---
title: 字体打包进容器(用于OFD文件)
date: '2023/10/24 21:01'
swiper: true
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/234046-1697384446c383.jpg'
top_img: 'url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/234046-1697384446c383.jpg)'
categories: 各种类型文件操作
tags:
  - 字体相关
abbrlink: 81a06a9b
---

{% wow animate__zoomIn,5s,0.5s,100,10 %}
{% note blue 'fas fa-bullhorn' modern%}
字体打包进容器(用于OFD文件)
{% endnote %}
{% endwow %}

```java
首先将fonts解压出来，把解压后的文件夹放到/usr/share/fonts/win目录下
cd /usr/share/fonts
docker cp win ai-sensitive-x:/usr/share/fonts/win
docker restart ai-sensitive-x
```

[字体的百度网盘链接](https://pan.baidu.com/s/1De3VRUQ1yJtpQL4tIBaR4g )

> 1. 首先从链接中下载所有的字体然后解压到宿主机的/usr/share/fonts/win目录下
> 2. 然后进入到fonts目录下  (cd /usr/share/fonts)
> 3. 然后将所有的字体放到容器的指定目录中 (docker cp win ai-sensitive-x:/usr/share/fonts/win)
> 4. 执行完之后重启服务就可以了

