---
title: Idea推送Github仓库超时问题
date: '2023/10/22 22:12'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E6%9C%BA%E7%94%B2%E5%B0%91%E5%A5%B34k%E5%A3%81%E7%BA%B8_%E5%BD%BC%E5%B2%B8%E5%9B%BE%E7%BD%91.jpg
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E6%9C%BA%E7%94%B2%E5%B0%91%E5%A5%B34k%E5%A3%81%E7%BA%B8_%E5%BD%BC%E5%B2%B8%E5%9B%BE%E7%BD%91.jpg)
categories: Git
tags:
  - 小技巧
abbrlink: 440070d0
---



{% tip error %}## Idea推送Github仓库{% emp 超时 %}问题{% endtip %}

>有时候在本地推送Github的仓库的时候经常Time OUT 并且你挂了梯子之后还是会超时，这个时候只需要配置一下终端代理就行

{% tip key %}寻找终端代理的{% endtip %}
## 
1. 找到梯子的终端代理端口号然后替换掉下边指令的
```shell
export https_proxy=http://127.0.0.1:33210 http_proxy=http://127.0.0.1:33210 all_proxy=socks5://127.0.0.1:33211
```
2. 或者找到您对应的梯子的可视化界面复制终端代理的代码
         

{% tip cogs %}## 配置终端代理{% endtip %}

> 打开git bash 输入终端代理的代码
> 最后打开Idea重新推送代码就可以了