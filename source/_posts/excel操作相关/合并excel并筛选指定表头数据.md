---
title: 合并excel并筛选指定表头数据
date: '2024-2-28 23:25'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefined20240228130054.png'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefined20240228130054.png'
categories: 开源
tags:
  - excel
sticky: 2
swiper_index: 2
---

## 1、需求
> 有多个excel文件，每个文件都有多个表头，现在需要将这些excel文件合并成一个excel文件，并且筛选出指定表头的数据。


## 2、代码

```java
    @Value("${OriginalFile}")
    private String originalDocument;
    @Value("${finalDocument}")
    private String finalDocument;


    private static int findColumnIndex(Sheet sheet, String headerName) {
        Row headerRow = sheet.getRow(0); // 假设第一行是表头
        if (headerRow != null) {
            for (Cell cell : headerRow) {
                if (headerName.equals(cell.getStringCellValue())) {
                    return cell.getColumnIndex();
                }
            }
        }
        return -1; // 如果未找到，返回-1
    }

    @Bean
    CommandLineRunner commandLineRunner(){
        return args -> {

            String folderPath = originalDocument; // Excel文件夹的路径
            String outputPath = finalDocument; // 输出文件的路径

            try (Workbook newWorkbook = new XSSFWorkbook()) {
                Sheet newSheet = newWorkbook.createSheet("Merged Data");
                AtomicReference<Row> newRow = new AtomicReference<>(newSheet.createRow(0));
                newRow.get().createCell(0).setCellValue("题名");
                newRow.get().createCell(1).setCellValue("文种");
                newRow.get().createCell(2).setCellValue("内容");

                AtomicInteger newRowNum = new AtomicInteger(1);

                Files.walk(Paths.get(folderPath))
                        .filter(Files::isRegularFile)
                        .filter(path -> path.toString().endsWith(".xlsx"))
                        .forEach(path -> {
                            try (InputStream is = new FileInputStream(path.toFile());
                                 Workbook workbook = WorkbookFactory.create(is)) {
                                Sheet sheet = workbook.getSheetAt(0); // 假设数据在第一个Sheet
                                int titleIndex = findColumnIndex(sheet, "题名");
                                int typeIndex = findColumnIndex(sheet, "文种");
                                int contentIndex = findColumnIndex(sheet, "内容");

                                // 跳过表头，从第二行开始读取数据
                                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                                    Row row = sheet.getRow(i);
                                    if (row != null) {
                                        newRow.set(newSheet.createRow(newRowNum.getAndIncrement()));
                                        if (titleIndex != -1) {
                                            newRow.get().createCell(0).setCellValue(row.getCell(titleIndex).getStringCellValue());
                                        }
                                        if (typeIndex != -1) {
                                            newRow.get().createCell(1).setCellValue(row.getCell(typeIndex).getStringCellValue());
                                        }
                                        if (contentIndex != -1) {
                                            newRow.get().createCell(2).setCellValue(row.getCell(contentIndex).getStringCellValue());
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                log.info(e);

                            }
                        });

                try (OutputStream fileOut = new FileOutputStream(outputPath)) {
                    newWorkbook.write(fileOut);
                }
            }
            ;
        };

        }
    }
```