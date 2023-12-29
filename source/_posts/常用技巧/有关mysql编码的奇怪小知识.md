---
title: 有关mysql编码的奇怪小知识
description: 有关mysql编码的奇怪小知识
date: '2023-12-03 22:51'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-jxl56w.png'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-jxl56w.png'
categories: 数据库
tags:
  - mysql
abbrlink: 30e1d389
---

当我们数据库User表中有一条数据的name='Zang'时，我们执行查询语句
```sql
select * from user where name = 'zang';
```

这样的话还是会查询到一条数据，这是因为当我们的数据库字段编码使用的是utf8mb4时他是忽略大小写的

如果我们要对某个字段严格区分大小写的查询，我们可以将其更改为utf8的编码格式

```sql
ALTER TABLE xxx.t_user MODIFY name VARCHAR(8) CHARACTER SET utf8 COLLATE utf8_general_ci;

```