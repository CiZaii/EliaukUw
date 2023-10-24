---
title: X、工具类
date: '2023/10/24 21:01'
swiper: true
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/213128-1697722288f1a3.jpg'
top_img: 'url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/213128-1697722288f1a3.jpg)'
categories: 各种类型文件操作
tags:
  - 工具类
abbrlink: 163b33dd
---

## PicUtil（文件压缩工具类）

```java
/**
 * 文件压缩工具类
 * @author Eliauk 
 */
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

## IBaseEnum（通用枚举接口）

```java
/**
 * @author Eliauk
 * @since 2023/9/28 14:40
 */


public interface IBaseEnum {

    Object getValue();
    String getLabel();

    /**
     * 获取与给定值匹配的枚举常量。
     *
     * @param <E>    继承自Enum并且实现IBaseEnum的泛型
     * @param value  要查找的值
     * @param clazz  枚举类的Class对象
     * @return       与给定值匹配的枚举常量，如果没有找到则返回null
     * @throws NullPointerException 如果提供的值为null
     */
    static <E extends Enum<E> & IBaseEnum> E getEnumByValue(Object value, Class<E> clazz) {
        Objects.requireNonNull(value);
        EnumSet<E> allEnums = EnumSet.allOf(clazz);
        return allEnums.stream().filter(e -> value.equals(e.getValue())).findFirst().orElse(null);
    }

    /**
     * 通过给定的值获取枚举常量的标签。
     *
     * @param <E>    继承自Enum并且实现IBaseEnum的泛型
     * @param value  要查找的值
     * @param clazz  枚举类的Class对象
     * @return       与给定值匹配的枚举标签，如果没有找到则返回null
     */
    static <E extends Enum<E> & IBaseEnum> String getLabelByValue(Object value, Class<E> clazz) {
        E matchEnum = getEnumByValue(value, clazz);
        String label = null;
        if (Objects.nonNull(matchEnum)) {
            label = matchEnum.getLabel();
        }
        return label;
    }

    /**
     * 通过给定的标签获取匹配的枚举常量。
     *
     * @param <E>    继承自Enum并且实现IBaseEnum的泛型
     * @param label  要查找的标签
     * @param clazz  枚举类的Class对象
     * @return       与给定标签匹配的枚举常量，如果没有找到则返回null
     * @throws NullPointerException 如果提供的标签为null
     */
    static <E extends Enum<E> & IBaseEnum> E getEnumByLabel(String label, Class<E> clazz) {
        Objects.requireNonNull(label);
        EnumSet<E> allEnums = EnumSet.allOf(clazz);
        Optional<E> match = allEnums.stream().filter(e -> label.equals(e.getLabel())).findFirst();
        return match.orElse(null);
    }

}
```

## TextValidator（正则工具类）

```java
/**
 * 通过正则表达判断是否正确的手机号，固定电话，身份证，邮箱等.
 * <p>
 * 从AndroidUtilCode的RegexUtils移植, 性能优化将正则表达式为预编译, 并修改了TEL的正则表达式.
 *
 * @author Eliauk
 */
public class TextValidator {

    /**
     * 正则：手机号（简单）, 1字头＋10位数字即可.
     */
    private static final String REGEX_MOBILE_SIMPLE = "^[1]\\d{10}$";
    private static final Pattern PATTERN_REGEX_MOBILE_SIMPLE = Pattern.compile(REGEX_MOBILE_SIMPLE);

    /**
     * 正则：手机号（精确）, 已知3位前缀＋8位数字
     * <p>
     * 移动：134(0-8)、135、136、137、138、139、147、150、151、152、157、158、159、178、182、183、184、187、188
     * </p>
     * <p>
     * 联通：130、131、132、145、155、156、175、176、185、186
     * </p>
     * <p>
     * 电信：133、153、173、177、180、181、189
     * </p>
     * <p>
     * 全球星：1349
     * </p>
     * <p>
     * 虚拟运营商：170
     * </p>
     */
    private static final String REGEX_MOBILE_EXACT = "^((13[0-9])|(14[5,7])|(15[0-3,5-9])|(17[0,3,5-8])|(18[0-9])|(147))\\d{8}$";
    private static final Pattern PATTERN_REGEX_MOBILE_EXACT = Pattern.compile(REGEX_MOBILE_EXACT);

    /**
     * 正则：固定电话号码，可带区号，然后6至少8位数字
     */
    private static final String REGEX_TEL = "^(\\d{3,4}-)?\\d{6,8}$";
    private static final Pattern PATTERN_REGEX_TEL = Pattern.compile(REGEX_TEL);

    /**
     * 正则：身份证号码15位, 数字且关于生日的部分必须正确
     */
    private static final String REGEX_ID_CARD15 = "^[1-9]\\d{7}((0\\d)|(1[0-2]))(([0|1|2]\\d)|3[0-1])\\d{3}$";
    private static final Pattern PATTERN_REGEX_ID_CARD15 = Pattern.compile(REGEX_ID_CARD15);

    /**
     * 正则：身份证号码18位, 数字且关于生日的部分必须正确
     */
    private static final String REGEX_ID_CARD18 = "^[1-9]\\d{5}[1-9]\\d{3}((0\\d)|(1[0-2]))(([0|1|2]\\d)|3[0-1])\\d{3}([0-9Xx])$";
    private static final Pattern PATTERN_REGEX_ID_CARD18 = Pattern.compile(REGEX_ID_CARD18);

    /**
     * 正则：邮箱, 有效字符(不支持中文), 且中间必须有@，后半部分必须有.
     */
    private static final String REGEX_EMAIL = "^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$";
    private static final Pattern PATTERN_REGEX_EMAIL = Pattern.compile(REGEX_EMAIL);

    /**
     * 正则：URL, 必须有"://",前面必须是英文，后面不能有空格
     */
    private static final String REGEX_URL = "[a-zA-z]+://[^\\s]*";
    private static final Pattern PATTERN_REGEX_URL = Pattern.compile(REGEX_URL);

    /**
     * 正则：yyyy-MM-dd格式的日期校验，已考虑平闰年
     */
    private static final String REGEX_DATE = "^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$";
    private static final Pattern PATTERN_REGEX_DATE = Pattern.compile(REGEX_DATE);

    /**
     * 正则：IP地址
     */
    private static final String REGEX_IP = "((2[0-4]\\d|25[0-5]|[01]?\\d\\d?)\\.){3}(2[0-4]\\d|25[0-5]|[01]?\\d\\d?)";
    private static final Pattern PATTERN_REGEX_IP = Pattern.compile(REGEX_IP);

    /////////////////

    /**
     * 验证手机号（简单）
     */
    public static boolean isMobileSimple(CharSequence input) {
        return isMatch(PATTERN_REGEX_MOBILE_SIMPLE, input);
    }

    /**
     * 验证手机号（精确）
     */
    public static boolean isMobileExact(CharSequence input) {
        return isMatch(PATTERN_REGEX_MOBILE_EXACT, input);
    }

    /**
     * 验证固定电话号码
     */
    public static boolean isTel(CharSequence input) {
        return isMatch(PATTERN_REGEX_TEL, input);
    }

    /**
     * 验证15或18位身份证号码
     */
    public static boolean isIdCard(CharSequence input) {
        return isMatch(PATTERN_REGEX_ID_CARD15, input) || isMatch(PATTERN_REGEX_ID_CARD18, input);
    }

    /**
     * 验证邮箱
     */
    public static boolean isEmail(CharSequence input) {
        return isMatch(PATTERN_REGEX_EMAIL, input);
    }

    /**
     * 验证URL
     */
    public static boolean isUrl(CharSequence input) {
        return isMatch(PATTERN_REGEX_URL, input);
    }

    /**
     * 验证yyyy-MM-dd格式的日期校验，已考虑平闰年
     */
    public static boolean isDate(CharSequence input) {
        return isMatch(PATTERN_REGEX_DATE, input);
    }

    /**
     * 验证IP地址
     */
    public static boolean isIp(CharSequence input) {
        return isMatch(PATTERN_REGEX_IP, input);
    }

    public static boolean isMatch(Pattern pattern, CharSequence input) {
        return StringUtils.isNotEmpty(input) && pattern.matcher(input).matches();
    }
}
```

## **DirectoryScanner（文件扫描工具类）**

```java
/**
 * 文件扫描工具类
 * @author Eliauk 
 */
public class DirectoryScanner {

 	/**
 	* 递归地遍历指定的文件夹及其所有子文件夹，查找包含具有合法后缀名的图片文件的文件夹。
 	* 找到这样的文件夹后，将其添加到给定的fileFolders列表中。
 	*
 	* @param folder       要开始遍历的根文件夹。
 	* @param fileFolders  用于存储包含合法图片的文件夹的列表。
 	* @param legalSuffix  合法图片文件后缀名的列表。
 	*/
	static void getFileFoldersWithImages(File folder, List<File> fileFolders, List<String> legalSuffix) {
	    File[] subFiles = folder.listFiles();
	    if (subFiles != null) {
	        boolean containsValidImage = false;
	        for (File subFile : subFiles) {
	            if (subFile.isFile() && legalSuffix.contains(FileUtil.getSuffix(subFile).toLowerCase())) {
	                containsValidImage = true;
	                break;
	            }
	        }
	        if (containsValidImage) {
	            fileFolders.add(folder);
	        }
	        for (File subFolder : subFiles) {
	            if (subFolder.isDirectory()) {
	                getFileFoldersWithImages(subFolder, fileFolders, legalSuffix);
	            }
	        }
	    }
	}

	 /**
	 * 递归遍历给定目录及其子目录，找出包含指定后缀名（通常为PDF）的文件夹。
	 * 将这些包含有符合后缀名条件的文件的文件夹添加到fileFolders列表中。
	 *
	 * @param directoryPath 待遍历的目录路径。
	 * @param fileFolders   存储包含有特定后缀名文件的文件夹的列表。
	 * @param legalSuffix   有效的文件后缀名列表。
	 */
	 static void getFoldersWithPDFFiles(String directoryPath, List<File> fileFolders, List<String> legalSuffix) {
	    File rootFolder = new File(directoryPath);
	    if (rootFolder.isDirectory()) {
	        File[] fileList = rootFolder.listFiles();
	        if (fileList != null) {
	            for (File file : fileList) {
	                if (file.isDirectory()) {
	                    // 递归处理子目录
	                    getFoldersWithPDFFiles(file.getAbsolutePath(), fileFolders, legalSuffix);
	                } else if (file.isFile() && legalSuffix.contains(getFileExtension(file))) {
	                    // 当前文件是PDF文件，将其父目录加入待解析目录列表
	                    File parentFolder = file.getParentFile();
	                    if (!fileFolders.contains(parentFolder)) {
	                        fileFolders.add(parentFolder);
	                    }
	                }
	            }
	        }
	    }
	}
    static List<File> getAllPDFFiles(File rootFolder, List<String> legalSuffix) {
        List<File> pdfFiles = new ArrayList<>();
        if (rootFolder.isDirectory()) {
            File[] fileList = rootFolder.listFiles();
            if (fileList != null) {
                for (File file : fileList) {
                    if (file.isDirectory()) {
                        pdfFiles.addAll(getAllPDFFiles(file, legalSuffix));
                    } else if (file.isFile() && legalSuffix.contains(getFileExtension(file)) && !file.getName().startsWith("._")) {
                        pdfFiles.add(file);
                    }
                }
            }
        }
        return pdfFiles;
    }


    
}
```

## ConvertToPDF(各种类型文件转换PDF)

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
                     if (mimeType != null && (mimeType.toLowerCase().contains("png")
                            || mimeType.toLowerCase().contains("jpg") || mimeType.toLowerCase().contains("jpeg"))) {
                        com.itextpdf.io.image.ImageData imageData = ImageDataFactory.create(changeDPI(fileData));
                        Image image = new Image(imageData);
                        PageSize pageSize = new PageSize(image.getImageWidth(), image.getImageHeight());
                        finalDocument.getPdfDocument().addNewPage(pageSize);
                        // 使用已有的布局器，并将页面边距设置为0
                        finalDocument.setMargins(0, 0, 0, 0);
                        // 将图像添加到已有的布局器
                        finalDocument.add(image);
                        if (i == files.size() - 1) {
                            finalDocument.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
                            finalDocument.close();
                            return finalOutputStream.toByteArray();
                        }
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
        } else {

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
            PDPage blankPage = new PDPage();
            finalPdf.addPage(blankPage);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            finalPdf.save(outputStream);
            finalPdf.close();

            executorService.shutdown();

            return outputStream.toByteArray();
        }

    }
/**
*  设置图片的DPI为符合国家文档标准的300DPI便于查看
*
*/
public byte[] changeDPI(byte[] imageData) {
        try {
            // 从字节数组读取图像
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageData));

            // 获取一个ImageWriter
            ImageWriter writer = ImageIO.getImageWritersByFormatName("png").next();

            // 准备输出流
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageOutputStream ios = ImageIO.createImageOutputStream(baos);
            writer.setOutput(ios);

            // 设置DPI为300
            IIOMetadata metadata = writer.getDefaultImageMetadata(new ImageTypeSpecifier(image), null);
            IIOMetadataNode root = (IIOMetadataNode) metadata.getAsTree("javax_imageio_1.0");
            IIOMetadataNode dimension = getChildNode(root, "Dimension");

            if (dimension == null) {
                dimension = new IIOMetadataNode("Dimension");
                root.appendChild(dimension);
            }

            IIOMetadataNode horiz = getChildNode(dimension, "HorizontalPixelSize");
            if (horiz == null) {
                horiz = new IIOMetadataNode("HorizontalPixelSize");
                dimension.appendChild(horiz);
            }

            IIOMetadataNode vert = getChildNode(dimension, "VerticalPixelSize");
            if (vert == null) {
                vert = new IIOMetadataNode("VerticalPixelSize");
                dimension.appendChild(vert);
            }

            horiz.setAttribute("value", Double.toString(25.4 / 300));
            vert.setAttribute("value", Double.toString(25.4 / 300));
            metadata.setFromTree("javax_imageio_1.0", root);

            // 写入图像
            writer.write(null, new IIOImage(image, null, metadata), null);

            ios.close();
            writer.dispose();

            return baos.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
/*
* 将PDF的页拆分为图片
*/
private PDPage createPDPageFromImage(PDDocument pdf, byte[] imageData) {
        try (InputStream is = new ByteArrayInputStream(imageData)) {
            BufferedImage image = ImageIO.read(is);
            if (image == null) {
                return null;
            }
            PDImageXObject imageObject = LosslessFactory.createFromImage(pdf, image);
            PDPage page = new PDPage(new PDRectangle(image.getWidth(), image.getHeight()));
            try (PDPageContentStream contentStream = new PDPageContentStream(pdf, page)) {
                contentStream.drawImage(imageObject, 0, 0, image.getWidth(), image.getHeight());
            }
            return page;
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Error processing image data", e);
        }
    }
/*
* 将TIF以及TIFF文件转换成图片
* 适配多页
*/
public List<byte[]> tiffToImage(byte[] tiffData) throws IOException {
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
/*
* PDF转图片
*/
public static List<byte[]> pdfToImagePlus(InputStream inputStream) {
        List<byte[]> result = new ArrayList<>();
        try {
            PDDocument document = PDDocument.load(inputStream);
            PDFRenderer renderer = new PDFRenderer(document);
            for (int i = 0; i < document.getNumberOfPages(); i++) {
                BufferedImage bufferedImage = renderer.renderImageWithDPI(i, DEFAULT_DPI);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                ImageOutputStream imageOut = ImageIO.createImageOutputStream(out);
                ImageIO.write(bufferedImage, DEFAULT_FORMAT, imageOut);
                result.add(out.toByteArray());
                out.close();
                imageOut.close();
                inputStream.close();
            }
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

```

## pom.xml(依赖项)

```xml
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
			<version>7.1.18</version>
			<type>pom</type>
		</dependency>
<!--解决PDF转图片的时候jpeg2000问题-->
		<dependency>
			<groupId>com.github.jai-imageio</groupId>
			<artifactId>jai-imageio-jpeg2000</artifactId>
			<version>1.3.0</version>
		</dependency>
  	<dependency>
			<groupId>org.ofdrw</groupId>
			<artifactId>ofdrw</artifactId>
			<version>2.0.9</version>
			<type>pom</type>
			<scope>compile</scope>
		</dependency>
		<dependency>
			<groupId>org.ofdrw</groupId>
			<artifactId>ofdrw-reader</artifactId>
			<version>2.0.9</version>
			<type>pom</type>
			<scope>compile</scope>
		</dependency>
		<dependency>
			<groupId>org.ofdrw</groupId>
			<artifactId>ofdrw-converter</artifactId>
			<version>2.0.9</version>
		</dependency>
```