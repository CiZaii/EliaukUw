---
title: 多种格式文件合并为pdf(大数据量)
date: '2023/7/15 19:28'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-72kejo.jpg'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-72kejo.jpg'
categories: 实用
tags:
  - pdf
top: true
abbrlink: a532201c
---

## 需求场景
最近遇到了一个比较恶心的需求，就是用户为了安全性，本地的富文本文件不存放到我们的minio中，而是富文本的原件存在了客户的服务器中，但是我们只能在数据库存放对应的路径。
富文本与档案的绑定关系是多对一，也就是多个富文本绑定一个档案，现在有个问题就是我们系统都是档案都是以pdf进行展示的，而客户那边档案下对应的富文本是多种数据类型的包括以下几种：jpg，png，jpeg，pdf，tif，tiff
所以我要去做兼容也就是说需要把档案下对应的各种格式的富文本拼接成一个pdf，然后再去展示。

先看一下我最开始写的方法

```java
private boolean isPDF(byte[] data) {
        try (PDDocument document = PDDocument.load(data)) {
            // 如果加载成功，表示是有效的 PDF 文件
            return true;
        } catch (IOException e) {
            // 加载失败，不是有效的 PDF 文件
            return false;
        }
    }

    public byte[] convertToPdf(List<byte[]> files) throws IOException {
        PDDocument pdf = new PDDocument();

        List<byte[]> imageFiles = new ArrayList<>();
        for (byte[] fileData : files) {
            String mimeType = URLConnection.guessContentTypeFromStream(new ByteArrayInputStream(fileData));
            if (isPDF(fileData)) {
                imageFiles.addAll(pdfToImage(fileData));
            } else if (mimeType != null && (mimeType.toLowerCase().contains("png")
                    || mimeType.toLowerCase().contains("jpg") || mimeType.toLowerCase().contains("jpeg"))) {
                imageFiles.add(fileData);
            } else if (mimeType != null && (mimeType.toLowerCase().contains("tiff") || mimeType.toLowerCase().contains("tif"))) {
                List<byte[]> tiffImages = tiffToImage(fileData);
                imageFiles.addAll(tiffImages);
            }
        }

        int numThreads = Runtime.getRuntime().availableProcessors() * 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numThreads);

        List<Future<PDPage>> futures = new ArrayList<>();
        for (byte[] imageFileData : imageFiles) {
            futures.add(executorService.submit(() -> {
                try (InputStream is = new ByteArrayInputStream(imageFileData)) {
                    BufferedImage readPic = ImageIO.read(is);
                    if (ObjectUtil.isEmpty(readPic)) {
                        return null;
                    }
                    PDImageXObject fromImage = LosslessFactory.createFromImage(pdf, readPic);
                    PDPage page = new PDPage(PDRectangle.A4);
                    PDPageContentStream contents = new PDPageContentStream(pdf, page);
                    float height = page.getMediaBox().getHeight();
                    float y = page.getMediaBox().getHeight() - height;
                    contents.drawImage(fromImage, 0, y, page.getMediaBox().getWidth(), height);
                    contents.close();
                    return page;
                } catch (IOException e) {
                    e.printStackTrace();
                    throw new RuntimeException("Error processing image data", e);
                }
            }));
        }

        try {
            for (Future<PDPage> future : futures) {
                PDPage page = future.get();
                if (page != null) {
                    pdf.addPage(page);
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            throw new RuntimeException("Error retrieving page futures", e);
        } finally {
            executorService.shutdown();
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            pdf.save(outputStream);
        } finally {
            pdf.close();
        }
        return outputStream.toByteArray();

    }

    private List<byte[]> pdfToImage(byte[] pdfData) throws IOException {
        List<byte[]> imageFiles = new ArrayList<>();
        try (InputStream is = new ByteArrayInputStream(pdfData);
             PDDocument document = PDDocument.load(is)) {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            for (int pageIndex = 0; pageIndex < document.getNumberOfPages(); ++pageIndex) {
                BufferedImage bim = pdfRenderer.renderImageWithDPI(pageIndex, 300, ImageType.RGB);
                try (ByteArrayOutputStream imageStream = new ByteArrayOutputStream()) {
                    ImageIO.write(bim, "png", imageStream);
                    imageFiles.add(imageStream.toByteArray());
                }
            }
        }
        return imageFiles;
    }


    private List<byte[]> tiffToImage(byte[] tiffData) throws IOException {
        List<byte[]> imageFiles = new ArrayList<>();
        try (ImageInputStream is = ImageIO.createImageInputStream(new ByteArrayInputStream(tiffData))) {
            Iterator<ImageReader> it = ImageIO.getImageReaders(is);
            if (it.hasNext()) {
                ImageReader reader = it.next();
                reader.setInput(is);
                for (int i = 0; i < reader.getNumImages(true); i++) {
                    BufferedImage image = reader.read(i);
                    try (ByteArrayOutputStream imageStream = new ByteArrayOutputStream()) {
                        ImageIO.write(image, "png", imageStream);
                        imageFiles.add(imageStream.toByteArray());
                    }
                }
            }
        }
        return imageFiles;
    }
```
> 产生问题的原因是因为我们的数据量比较大，而且每次都是多个文件，所以这个方法的执行时间会比较长，而且在执行的过程中会产生大量的临时文件，这样会导致服务器的磁盘空间不足，所以使用了流代替temp。
> 然后对方数据量都是一个档案可能对应几百页的富文本，这种写法会特别慢，导致接口超时所以要想一种解决办法

## 现在要优化成什么样子呢
> 1、首先是要保证合并的时候有序，
> 2、所以就直接排除并行流了，
> 3、既要有序也要保证大文件和多页数时候的效率，并且要保证有序合并
> 4、同时还要兼容各种不同的类型，所以就需要对不同的类型进行不同的处理

## 优化后的代码
```java

logger.info("开始转换pdf");
        // Assume that urls is List<String> urls.
        int totalUrls = collect.size();

        int batchSize = 20;  // process 20 URLs in each batch
        int totalBatches = (int) Math.ceil((double) totalUrls / batchSize);

        ExecutorService executorService = Executors.newFixedThreadPool(Math.min(totalBatches, Runtime.getRuntime().availableProcessors()));

        List<CompletableFuture<byte[]>> futures = new ArrayList<>();

        for (int i = 0; i < totalBatches; i++) {
            int fromIndex = i * batchSize;
            int toIndex = Math.min((i + 1) * batchSize, totalUrls);
            List<String> batchUrls = collect.subList(fromIndex, toIndex);

            for (String url : batchUrls) {
                CompletableFuture<byte[]> future = CompletableFuture.supplyAsync(() -> {
                    logger.info("开始合并数据路径为:{}", url);
                    final String extName = FileUtil.extName(url);

                    if ((extName != null && (extName.toLowerCase().contains("png")
                            || extName.toLowerCase().contains("jpg") || extName.toLowerCase().contains("jpeg")))) {
                        try {
                            final byte[] bytes = PicUtil.compressPictureForScale(url, 1024, 0.9);
                            logger.info("文件大小为:{}", bytes.length);
                            return bytes;
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    } else {
                        File imageFile = new File(url);
                        if (imageFile.exists() && imageFile.isFile()) {
                            try (InputStream fileInputStream = new FileInputStream(imageFile)) {
                                byte[] fileData = IOUtils.toByteArray(fileInputStream);
                                logger.info("文件大小为:{}", fileData.length);
                                return fileData;
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        }
                    }

                    return null;  // Or throw an exception if a URL does not correspond to a valid image
                }, executorService);

                futures.add(future);
            }
        }

// Now futures is a list of CompletableFuture<byte[]>, each of which represents the result of one task.
// We can ensure that we get the results in the same order as the tasks were submitted by retrieving the results in the order they were added to the futures list.

        List<byte[]> imageFiles = futures.stream()
                .map(CompletableFuture::join)  // This will block until the result is available
                .collect(Collectors.toList());

        executorService.shutdown();

// Now imageFiles contains all the processed data in the same order as the URLs were provided.

        logger.info("合并数据路径为");


        byte[] pdfData = appraisalFileService.convertToPdf(imageFiles);
        logger.info(pdfData.length + "");
        logger.info("转换pdf结束");
        response.setHeader("Content-Disposition", "attachment; filename=converted.pdf");
        response.setContentLength(pdfData.length);
        ServletOutputStream outputStream = response.getOutputStream();
        outputStream.write(pdfData);
        outputStream.flush();
        return R.success("导入成功");
```

## convertToPdf方法
```java

public byte[] convertToPdf(List<byte[]> files) throws IOException {
        // calculate mime type in advance
        Tika tika = new Tika();

        List<String> mimeTypes = files.stream().map(fileData -> {
            try (TikaInputStream tikaStream = TikaInputStream.get(fileData)) {
                return tika.detect(tikaStream);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }).collect(Collectors.toList());

        if (mimeTypes.stream().noneMatch(mimeType -> mimeType != null && mimeType.toLowerCase().contains("pdf"))) {
            ByteArrayOutputStream finalOutputStream = new ByteArrayOutputStream();
            PdfWriter finalWriter = new PdfWriter(finalOutputStream);
            PdfDocument finalPdf = new PdfDocument(finalWriter);
            Document finalDocument = new Document(finalPdf);

            for (int i = 0; i < files.size(); i++) {
                byte[] fileData = files.get(i);
                String mimeType = mimeTypes.get(i);

                try (InputStream inputStream = new ByteArrayInputStream(fileData)) {
                    if (mimeType != null && mimeType.toLowerCase().contains("pdf")) {
                    /*PdfDocument sourcePdf = new PdfDocument(new PdfReader(inputStream));
                    int finalPdfNumberOfPages = finalPdf.getNumberOfPages();
                    sourcePdf.copyPagesTo(1, sourcePdf.getNumberOfPages(), finalPdf, finalPdfNumberOfPages + 1);

                    sourcePdf.close();*/
                    } else if (mimeType != null && (mimeType.toLowerCase().contains("png")
                            || mimeType.toLowerCase().contains("jpg") || mimeType.toLowerCase().contains("jpeg"))) {
                        com.itextpdf.io.image.ImageData imageData = ImageDataFactory.create(fileData);
                        Image image = new Image(imageData);

                        // Adjust the size of the image if it's too large
                        float pageWidth = finalDocument.getPageEffectiveArea(PageSize.A4).getWidth();
                        if (image.getImageScaledWidth() > pageWidth) {
                            image.scaleToFit(pageWidth, Float.MAX_VALUE);
                        }

                        finalDocument.add(image);
                        finalDocument.add(new AreaBreak(AreaBreakType.NEXT_PAGE)); // Add a page break after each image
                    } else if (mimeType != null && (mimeType.toLowerCase().contains("tiff") || mimeType.toLowerCase().contains("tif"))) {
                        try (ImageInputStream imageInputStream = ImageIO.createImageInputStream(inputStream)) {
                            Iterator<ImageReader> imageReaders = ImageIO.getImageReaders(imageInputStream);
                            if (imageReaders.hasNext()) {
                                ImageReader reader = imageReaders.next();
                                reader.setInput(imageInputStream);
                                int pageCount = reader.getNumImages(true);
                                for (int k = 0; k < pageCount; k++) {
                                    BufferedImage page = reader.read(k);
                                    try (ByteArrayOutputStream pageOutputStream = new ByteArrayOutputStream()) {
                                        ImageIO.write(page, "png", pageOutputStream);
                                        ImageData imageData = ImageDataFactory.create(pageOutputStream.toByteArray());
                                        Image image = new Image(imageData);
                                        finalDocument.add(image);
                                        finalDocument.add(new AreaBreak(AreaBreakType.NEXT_PAGE)); // Add a page break after each image
                                    }
                                }
                            }
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }

            finalDocument.close();
            finalPdf.close();

            return finalOutputStream.toByteArray();
        }else {

            int batchSize = 50;                     // 每批处理的文件数量
            int totalFiles = files.size();
            int batches = (int) Math.ceil((double) totalFiles / batchSize);

            ExecutorService executorService = Executors.newFixedThreadPool(Math.min(batches, Runtime.getRuntime().availableProcessors()));

            List<CompletableFuture<PDDocument>> futures = new ArrayList<>();

            for (int i = 0; i < batches; i++) {
                int fromIndex = i * batchSize;
                int toIndex = Math.min((i + 1) * batchSize, totalFiles);
                List<byte[]> batchFiles = files.subList(fromIndex, toIndex);

                CompletableFuture<PDDocument> future = CompletableFuture.supplyAsync(() -> {
                    PDDocument batchPdf = new PDDocument();
                    PDFMergerUtility merger = new PDFMergerUtility();
                    for (byte[] fileData : batchFiles) {
                        String mimeType = null;
                        try {
                            mimeType = URLConnection.guessContentTypeFromStream(new ByteArrayInputStream(fileData));
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                        if (isPDF(fileData)) {
                            try (InputStream inputStream = new ByteArrayInputStream(fileData)) {
                                PDDocument sourcePdf = PDDocument.load(inputStream);
                                merger.appendDocument(batchPdf, sourcePdf);
                                sourcePdf.close();
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        } else if (mimeType != null && (mimeType.toLowerCase().contains("png")
                                || mimeType.toLowerCase().contains("jpg") || mimeType.toLowerCase().contains("jpeg"))) {
                            PDPage page = createPDPageFromImage(batchPdf, fileData);
                            if (page != null) {
                                batchPdf.addPage(page);
                            }
                        } else if (mimeType != null && (mimeType.toLowerCase().contains("tiff") || mimeType.toLowerCase().contains("tif"))) {
                            List<byte[]> tiffImages = null;
                            try {
                                tiffImages = tiffToImage(fileData);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                            for (byte[] imageFileData : tiffImages) {
                                PDPage page = createPDPageFromImage(batchPdf, imageFileData);
                                if (page != null) {
                                    batchPdf.addPage(page);
                                }
                            }
                        }
                    }
                    return batchPdf;
                }, executorService);

                futures.add(future);
            }

            CompletableFuture<Void> allFutures = CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
            allFutures.join();

            // 构建最终的有序 PDF 文档
            // 构建最终的有序 PDF 文档
            PDDocument finalPdf = new PDDocument();
            PDFMergerUtility merger = new PDFMergerUtility();

            for (CompletableFuture<PDDocument> future : futures) {
                PDDocument batchPdf = future.join();
                merger.appendDocument(finalPdf, batchPdf);
                batchPdf.close();
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            finalPdf.save(outputStream);
            finalPdf.close();

            executorService.shutdown();

            return outputStream.toByteArray();
        }
```

## 压缩PDF工具类

```java

public class PicUtil {

    public static byte[] compressPictureForScale(String srcPath, long desFileSize, double accuracy) throws IOException {
        if (StringUtils.isEmpty(srcPath)) {
            return null;
        }
        File srcFile = new File(srcPath);
        if (!srcFile.exists()) {
            return null;
        }

        String formatName = FilenameUtils.getExtension(srcPath);
        BufferedImage image;
        try {
            long srcFileSize = srcFile.length();
            System.out.println("源图片: " + srcPath + ", 大小: " + srcFileSize / 1024 + "kb");

            image = Thumbnails.of(srcPath).scale(1f).asBufferedImage();
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            compressPicCycle(image, desFileSize, accuracy, formatName, byteArrayOutputStream);
            image.getGraphics().dispose();

            System.out.println("图片压缩完成!");

            byte[] byteArray = byteArrayOutputStream.toByteArray();
            System.out.println("源图片压缩后为: " + srcPath + ", 大小: " + byteArray.length / 1024 + "kb");
            byteArrayOutputStream.close();
            return byteArray;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private static void compressPicCycle(BufferedImage desImage, long desFileSize, double accuracy, String formatName, ByteArrayOutputStream byteArrayOutputStream) throws IOException, IOException {
        byteArrayOutputStream.reset();
        ImageIO.write(desImage, formatName, byteArrayOutputStream);
        byte[] byteArray = byteArrayOutputStream.toByteArray();
        if (byteArray.length / 1024 > desFileSize) {
            int srcWidth = desImage.getWidth();
            int srcHeight = desImage.getHeight();
            int destWidth = new BigDecimal(srcWidth).multiply(new BigDecimal(accuracy)).intValue();
            int destHeight = new BigDecimal(srcHeight).multiply(new BigDecimal(accuracy)).intValue();
            BufferedImage image = Thumbnails.of(desImage).size(destWidth, destHeight).outputQuality(accuracy).asBufferedImage();
            compressPicCycle(image, desFileSize, accuracy, formatName, byteArrayOutputStream);
        }
    }
}


```

## 需引入依赖

```xml
        <dependency>
            <groupId>net.coobird</groupId>
            <artifactId>thumbnailator</artifactId>
            <version>0.4.11</version>
        </dependency>
        <dependency>
			<groupId>com.twelvemonkeys.imageio</groupId>
			<artifactId>imageio-tiff</artifactId>
			<version>3.6.1</version>
		</dependency>
		<dependency>
			<groupId>org.apache.pdfbox</groupId>
			<artifactId>pdfbox</artifactId>
			<version>2.0.27</version>
		</dependency>
		<dependency>
			<groupId>org.apache.pdfbox</groupId>
			<artifactId>pdfbox-tools</artifactId>
			<version>2.0.26</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tika</groupId>
			<artifactId>tika-core</artifactId>
			<version>2.1.0</version>
		</dependency>
		<dependency>
			<groupId>com.itextpdf</groupId>
			<artifactId>itext7-core</artifactId>
			<version>7.2.1</version>
			<type>pom</type>
		</dependency>
```
