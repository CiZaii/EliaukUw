---
title: 解析双层DDF
date: '2023-08-06 10:25'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-x8o5wd.jpg'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-x8o5wd.jpg'
categories: 小技巧
tags:
  - 模板模式
top: false
abbrlink: 8dda91f7
---
需引入Maven依赖
```xml
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
```

```java
public Map<Integer, String> PDFIdentification(InputStream inputStream) {
        Map<Integer, String> textMap = new HashMap<>();
        //读取PDF
        PDDocument document = PDDocument.load(inputStream);
        //按照页码读取文本
        for (int i = 0; i < document.getNumberOfPages(); i++) {
            //文本剥离器
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(i + 1);
            stripper.setEndPage(i + 1);
            //按照位置排序
            stripper.setSortByPosition(true);
            //获取文本
            String text = stripper.getText(document);
            if (StrUtil.isBlank(text)) {
                continue;
            }
            text = text.replace("\r\n", "\n");
            textMap.put(i + 1, text);
        }
        document.close();
        return textMap;
    }
```

> 解析完之后Map的Key是pdf的页数，Value是pdf的内容