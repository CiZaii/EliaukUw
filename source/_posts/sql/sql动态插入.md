---
title: sql动态插入
date: '2024-10-12 20:25'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefined20241012181329.png'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefined20241012181329.png'
categories: SQL
tags:
  - SQL
top: true
sticky: 2
swiper_index: 2
abbrlink: 43d9924e
---

## 1、场景需求

> 在版本迭代中要给租户添加菜单权限，但是现场的租户id肯定不和开发环境的租户id一致，所以需要动态的给租户添加菜单权限

## 2、动态插入

```sql
INSERT INTO "nexusai".sys_tenant_menu(tenant_id, menu_id) SELECT st.id, 294254436813638 FROM "nexusai".sys_tenant st;
```

> 这样的话我们就可以动态的给租户添加菜单权限了会读取到租户表中所有的租户id，分别添加meni_id到对应的租户表菜单中间表中