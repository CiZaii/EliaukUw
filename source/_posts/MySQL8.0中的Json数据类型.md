---
title: Mysql8.0中的Json数据类型
date: '2023/7/16 19:28'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E5%A5%B3%E7%A5%9E%E5%A5%8F%E9%B8%A3%E6%9B%B210k.jpg'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E5%A5%B3%E7%A5%9E%E5%A5%8F%E9%B8%A3%E6%9B%B210k.jpg'
categories: 实用
tags:
  - MySQL
top: true
---

## 场景
在某张表中存在一个字段数据类型是一个Json，这个字段保存的数据格式是一个JsonArray，其中每个JsonObject都有一个属性为UUID，现在我们有以下两个需求
1、 根据UUID查询出对应的JsonObject
2、 根据UUID查询出对应的JsonObject并且将其删除，并保留该JsonArray的其他数据

>条件只有一个UUID，而没有该JsonArray所在的数据的主键索引


## 根据UUID查询出对应的JsonObject
```java
/**
     * 通过uuid查询当页对应的敏感句对应的jsonObject
     */
    @Query(value = "SELECT json_extract(machine_wording, '$[0]') " +
            "FROM xxxxxx " +
            "WHERE json_extract(machine_wording, '$[0].uuid') = :uuid",
            nativeQuery = true)
    String findJsonObjectByUuid(@Param("uuid") String uuid);
```
> 上述machine_wording就是存放这个JsonArray的字段名称
> 通过json_extract函数可以获取到JsonArray中的第一个JsonObject，然后通过json_extract函数获取到该JsonObject中的uuid属性，然后与传入的uuid进行比较，如果相等则返回该JsonObject

## 根据UUID查询出对应的JsonObject并且将其删除，并保留该JsonArray的其他数据
```java

/**
     * 通过uuid删除当页对应的敏感句
     */

    @Modifying
    @Transactional
    @Query(nativeQuery = true, value = "UPDATE xxx AS a " +
            "SET a.machine_wording = coalesce((" +
            "    SELECT JSON_ARRAYAGG(json_object) " +
            "    FROM (" +
            "        SELECT JSON_EXTRACT(a.machine_wording, CONCAT('$[', jt.idx - 1, ']')) as json_object " +
            "        FROM JSON_TABLE(" +
            "            a.machine_wording, " +
            "            '$[*]' COLUMNS (" +
            "                idx FOR ORDINALITY, " +
            "                uuid VARCHAR(255) PATH '$.uuid'" +
            "            )" +
            "        ) AS jt " +
            "        WHERE jt.uuid != :uuid" +
            "    ) AS filtered_json_objects" +
            "), a.machine_wording)" +
            "WHERE JSON_CONTAINS(a.machine_wording, JSON_OBJECT('uuid', :uuid));")
    void deleteJsonObjectByUuid(@Param("uuid") String uuid);
```
> 上述machine_wording就是存放这个JsonArray的字段名称
> 上述xxx就是表名
> 通过json_table函数将JsonArray转换成一个表，然后通过where条件过滤掉uuid等于传入的uuid的JsonObject，然后通过json_arrayagg函数将过滤后的JsonObject转换成JsonArray，最后通过update语句将原来的JsonArray替换成过滤后的JsonArray