---
title: Mysql8.0中的Json数据类型
date: '2023/7/16 19:28'
swiper: false
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E5%A5%B3%E7%A5%9E%E5%A5%8F%E9%B8%A3%E6%9B%B210k.jpg
img: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E5%A5%B3%E7%A5%9E%E5%A5%8F%E9%B8%A3%E6%9B%B210k.jpg
categories: 实用
tags:
  - MySQL
top: true
abbrlink: 9aeaf84b
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
> - 上述machine_wording就是存放这个JsonArray的字段名称
> - 上述xxx就是表名
> - 通过json_table函数将JsonArray转换成一个表，然后通过where条件过滤掉uuid等于传入的uuid的JsonObject，然后通过json_arrayagg函数将过滤后的JsonObject转换成JsonArray，最后通过update语句将原来的JsonArray替换成过滤后的JsonArray

## 2323-07-22测试环境产生问题
> 在测试环境中的时候对下边这个需求进行测试的时候产生了一些小问题
> 根据UUID查询出对应的JsonObject并且将其删除，并保留该JsonArray的其他数据

1. 首先使用我上边deleteJsonObjectByUuid方法时会在特殊环境下产生一些问题
2. 出现问题的场景
   当我们的machine_wording字段中的JsonArray中的JsonObject为一个的时候会出现删除不掉的问题
3. 产生问题的原因是对应的sql是先找到UUID不等于传入的时候他就会拿到所有不等于的然后更新到这个字段中，相当于删掉了，所以当只有一个的时候他找不到然后没有办法更新上去，所以就会出现问题

以下是我进行修改之后的方法
```java

@Modifying
    @Transactional
    @Query(nativeQuery = true, value = "UPDATE ai_sensitive_appraisal_file_ocr_post_artificial AS a " +
            "SET a.mark_words = CASE WHEN (" +
            "    SELECT JSON_ARRAYAGG(json_object) " +
            "    FROM (" +
            "        SELECT JSON_EXTRACT(a.mark_words, CONCAT('$[', jt.idx - 1, ']')) as json_object " +
            "        FROM JSON_TABLE(" +
            "            a.mark_words, " +
            "            '$[*]' COLUMNS (" +
            "                idx FOR ORDINALITY, " +
            "                uuid VARCHAR(255) PATH '$.uuid'" +
            "            )" +
            "        ) AS jt " +
            "        WHERE jt.uuid != :uuid" +
            "    ) AS filtered_json_objects" +
            ") IS NULL THEN '[]' ELSE (" +
            "    SELECT JSON_ARRAYAGG(json_object) " +
            "    FROM (" +
            "        SELECT JSON_EXTRACT(a.mark_words, CONCAT('$[', jt.idx - 1, ']')) as json_object " +
            "        FROM JSON_TABLE(" +
            "            a.mark_words, " +
            "            '$[*]' COLUMNS (" +
            "                idx FOR ORDINALITY, " +
            "                uuid VARCHAR(255) PATH '$.uuid'" +
            "            )" +
            "        ) AS jt " +
            "        WHERE jt.uuid != :uuid" +
            "    ) AS filtered_json_objects" +
            ") END " +
            "WHERE JSON_CONTAINS(a.mark_words, JSON_OBJECT('uuid', :uuid));")
    void deleteBModelWord(@Param("uuid") String uuid);
```