---
title: Swagger刷新页面异常解决
date: '2022/10/6 10:32'
swiper: true
cover: https://zang-1307996497.cos.ap-beijing.myqcloud.com/af73ad849c6143b8aaf7f41493544353.jpg
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/af73ad849c6143b8aaf7f41493544353.jpg'
categories: 技巧
tags:
  - 异常记录
top: false
abbrlink: 10e6d135
---

直接引入maven依赖即可解决

```xml
            <dependency>
                <groupId>io.swagger</groupId>
                <artifactId>swagger-annotations</artifactId>
                <version>1.5.22</version>
            </dependency>
            <dependency>
                <groupId>io.swagger</groupId>
                <artifactId>swagger-models</artifactId>
                <version>1.5.22</version>
            </dependency>
```