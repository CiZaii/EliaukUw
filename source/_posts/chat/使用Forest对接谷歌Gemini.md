---
title: 使用Forest对接谷歌Gemini
date: '2024-2-12 23:25'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefinedwallhaven-gpx73q.png'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefinedwallhaven-gpx73q.png'
categories: chat
tags:
  - AI
top: true
sticky: 2
swiper_index: 2
abbrlink: c3461094
---

## 1、前置需要
> 申请Gemini账号，并获取API Key

官网地址：[Gemini](https://makersuite.google.com/app/apikey) 

## 2、测试所引入依赖

```xml

        <dependency>
            <groupId>com.dtflys.forest</groupId>
            <artifactId>forest-spring-boot-starter</artifactId>
            <version>1.5.33</version>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>

        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>5.8.18</version>
        </dependency>

        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.12.0</version> <!-- 或更高版本 -->
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-core</artifactId>
            <version>2.12.0</version> <!-- 或更高版本 -->
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-annotations</artifactId>
            <version>2.12.0</version> <!-- 或更高版本 -->
        </dependency>
```

## 3、yml文件配置

```yaml
forest:
  variables:
    gemini:
      #proxies: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent  这个是普通请求
      proxies: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent # 这个是流式请求
      key: YOUR_API_KEY # 这里是你申请的apikey
  max-connections: 1000        # 连接池最大连接数
  connect-timeout: 300000        # 连接超时时间，单位为毫秒
  read-timeout: 300000           # 数据读取超时时间，单位为毫秒
```

## 4、创建接口

```java
/**
 * 构造AI中台请求接口
 * @author Eliauk，微信：Cizai_，邮箱：zang.dromara.org <br/>
 * @date 2024/2/5 <br/>
 * @Copyright 博客：https://eliauku.gitee.io/  ||  per aspera and astra <br/>
 */

public interface AIMiddlePlatform {

    @PostRequest(url ="${gemini.proxies}" + "?" + "key=" + "${gemini.key}",
    headers = {"Accept: text/event-stream","User-Agent: fastchat Client"})
    InputStream intelligentQA(@JSONBody JSONObject params);
}
```

## 5、调用接口
```java

/**
 * @author Eliauk，微信：Cizai_，邮箱：zang.dromara.org <br/>
 * @date 2024/2/18 <br/>
 * @Copyright 博客：https://eliauku.gitee.io/  ||  per aspera and astra <br/>
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class AiController {

    @Resource
    private final AIMiddlePlatform aimiddlePlatform;

    private final ExecutorService nonBlockingService = Executors.newCachedThreadPool();
    @PostMapping(value = "/ai",produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter ai(@RequestParam String text) {
        final SseEmitter sseEmitter = new SseEmitter();

        nonBlockingService.execute(() -> {
            // 使用Jackson构建JSON对象
            ObjectMapper mapper = new ObjectMapper();
            ObjectNode textPart = mapper.createObjectNode().put("text", text);

            ArrayNode partsArray = mapper.createArrayNode().add(textPart);
            ObjectNode contentsObject = mapper.createObjectNode().set("parts", partsArray);
            ArrayNode contentsArray = mapper.createArrayNode().add(contentsObject);
            ObjectNode requestBody = mapper.createObjectNode().set("contents", contentsArray);

            InputStream result = aimiddlePlatform.intelligentQA(requestBody);

            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(result, "UTF-8"));
                 JsonParser parser = new JsonFactory(mapper).createParser(br)) {

                while (!parser.isClosed()) {
                    JsonToken jsonToken = parser.nextToken();

                    if (jsonToken == null) {
                        break;
                    }

                    if (JsonToken.FIELD_NAME.equals(jsonToken) && "text".equals(parser.getCurrentName())) {
                        parser.nextToken(); // 移动到字段值
                        sb.append(parser.getValueAsString()).append("\n"); // 收集"text"字段的值
                        System.out.println(parser.getValueAsString());
                        sseEmitter.send(parser.getValueAsString());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            finally {
                sseEmitter.complete();
            }
        });

        return sseEmitter;
    }
}
```

这样就可以得到流式相应的结果了。
![](https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefined20240218154111.png)



