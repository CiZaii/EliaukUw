---
title: 导出Excel将指定列加锁不可编辑
date: '2023/5/31 23:12'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/6E751678A13E9E9F6A6A410DA02683FF.jpg
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/6E751678A13E9E9F6A6A410DA02683FF.jpg)
categories: 实用
tags:
  - EasyExcel
  - POI
top: true
abbrlink: e6860ebf
---

## 导出Excel将指定列加锁不可编辑
最近写了一个需求，需要将Excel导出，但是有些列是不允许编辑的，所以需要将这些列加锁，不允许编辑，这里就记录一下

### 首先将整个sheet页全部加锁
需要创建一个Handler
```java
package org.irm.ai.sensitive.excel;

import java.util.UUID;

import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFSheet;

import com.alibaba.excel.write.handler.SheetWriteHandler;
import com.alibaba.excel.write.metadata.holder.WriteSheetHolder;
import com.alibaba.excel.write.metadata.holder.WriteWorkbookHolder;

/**
 * 锁定Sheet页
 *
 * @author Eliauk
 * @since 2023/5/18 14:28
 */
public class LockSheetWriteHandler implements SheetWriteHandler {


    @Override
    public void beforeSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
    }

    @Override
    public void afterSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
        Sheet sheet = writeSheetHolder.getSheet();
        //锁定工作簿，设置保护密码
        sheet.protectSheet(String.valueOf(UUID.randomUUID()));
        // 锁定单元格不可选中(防止别人直接复制内容到其他excel修改)
        ((SXSSFSheet) writeSheetHolder.getSheet()).lockSelectLockedCells(true);
    }
}
```
### 需要解锁的列，也就是允许编辑的列
```java

package org.irm.ai.sensitive.excel;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.util.CellUtil;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.metadata.Head;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.write.handler.CellWriteHandler;
import com.alibaba.excel.write.metadata.holder.WriteSheetHolder;
import com.alibaba.excel.write.metadata.holder.WriteTableHolder;

/**
 * @author Eliauk
 * @since 2023/5/18 14:31
 */
final
public class CellHandler implements CellWriteHandler {

    // 将指定的要解锁的列放到set中
    private static final HashSet<String> values = new HashSet<>();

    static {

        Field[] fields = TriageResultsExcel.class.getDeclaredFields();
        for (Field field : fields) {
            if (field.isAnnotationPresent(ExcelProperty.class)) {
                ExcelProperty annotation = field.getAnnotation(ExcelProperty.class);
                String value = Arrays.toString(annotation.value());
                if (value.startsWith("[") && value.endsWith("]")) {
                    final String substring = value.substring(1, value.length() - 1);
                    if ("文件唯一Id(请勿修改)".equals(substring)) {
                        continue;
                    }
                    values.add(substring);
                    continue;
                }
                values.add(value);
            }
        }
    }

    @Override
    public void afterCellDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, List<WriteCellData<?>> cellDataList, Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {

        // 将需要解锁的列解锁
        final String dataHead = head.getHeadNameList().get(0);
        if (values.contains(dataHead)) {
            Map<String, Object> properties = new HashMap<>(1);
            properties.put(CellUtil.LOCKED, false);
            CellUtil.setCellStyleProperties(cell, properties);
        }
    }
}

```


