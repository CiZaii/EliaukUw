---
title: K、各种格式文件拼接为PDF
date: '2023/10/24 21:01'
swiper: true
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/003147-168961150720fc.jpg'
top_img: 'url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/003147-168961150720fc.jpg)'
categories: 各种类型文件操作
tags:
  - 前置处理操作
abbrlink: 30ce191e
---


## 所需数据


1. 首先需要将所有需要合并的文件转换成字节流也就是byte[] 然后把，每个数据都放到一个list


### 文件路径转换成byte[]

```java
final List<String> collect = //你的文件路径集合
logger.info("开始转换pdf");

int totalUrls = collect.size();

int batchSize = 20; // 每批文件数量
int totalBatches = (int) Math.ceil((double) totalUrls / batchSize); // 共多少批任务
if (totalBatches <=0 ) return new byte[0];
ExecutorService executorService = //你的自定义线程池

List<CompletableFuture<byte[]>> futures = new ArrayList<>();

for (int i = 0; i < totalBatches; i++) {
    int fromIndex = i * batchSize;
    int toIndex = Math.min((i + 1) * batchSize, totalUrls);
    List<String> batchUrls = collect.subList(fromIndex, toIndex);

    for (String url : batchUrls) {
        CompletableFuture<byte[]> future = CompletableFuture.supplyAsync(() -> {
            logger.info("开始合并数据路径为:{}", url);

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
            /*if ((extName != null && (extName.toLowerCase().contains("png")
                            || extName.toLowerCase().contains("jpg") || extName.toLowerCase().contains("jpeg")))) {
                        try {

                            final byte[] bytes = PicUtil.compressPictureForScale(url, 1024, 0.9);
                            logger.info("文件大小为:{}", bytes.length);
                            return bytes;
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }*/
            return null;
        }, executorService);

        futures.add(future);
    }
}

List<byte[]> imageFiles = futures.stream()
	.map(CompletableFuture::join)
	.collect(Collectors.toList());

executorService.shutdown();
```


> 上图中进行注释的地方是进行大图片压缩的，本文中所有涉及到的工具类都会在另一篇文章中附上源码


