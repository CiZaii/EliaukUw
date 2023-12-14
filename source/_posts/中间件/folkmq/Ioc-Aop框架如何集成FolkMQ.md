---
title: Ioc/Aop框架如何集成FolkMQ
date: '2023-12-14 20:25'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/010350-16996358307f29.jpg'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/010350-16996358307f29.jpg'
categories: FolkMQ
tags:
  - 中间件
top: true
sticky: 2
swiper_index: 2
---

## 1、部署FolkMQ

> 这里我是使用的docker-compose部署的，如果是本地部署，请自行修改docker-compose.yml文件
> 现在我使用的版本是1.0.20

```yaml
    folkmq-server:
        image: noearorg/folkmq-server:1.0.20
        container_name: folkmq-server
        ports:
            - 8602:8602
            - 18602:18602
        volumes:
            - ./data/broker:/data
            - ./logs/broker:/logs
        environment:
            - folkmq.admin=zangzang  #管理后台密码
            - folkmq.access.folk=sk1 #消息访问账号，可以配置多个
#      - folkmq.access.ak2=sk2
            - TZ=Asia/Shanghai  
```
> 然后执行
```bash
docker-compose up -d folkmq-server
```

## 2、使用FolkMQ

### 1、引入依赖

```xml
<dependencies>
    <dependency>
        <groupId>org.noear</groupId>
        <artifactId>folkmq-transport-netty</artifactId>
        <version>1.0.20</version>
    </dependency>
</dependencies>
```

### 2、application.yml中配置

```yaml

folkmq:
  server: 'folkmq://127.0.0.1:18602?ak=folk&sk=sk1'
  consumerGroup: 'Cizai'
```

### 3、如何订阅配置

```java
/**
 * @author Eliauk
 * @since 2023/12/6 15:42
 */
@Configuration
@RequiredArgsConstructor
public class FolkMQConfig {

    @Bean
    public MqClient initClient(@Value("${folkmq.server}") String serverUrl,
                               @Value("${folkmq.consumerGroup}") String consumerGroup,
                               @Autowired Map<String, MqConsumeHandler> subscriptionMap) throws IOException {
        // 构建客户端
        MqClient client = FolkMQ.createClient(serverUrl).connect();

        // 订阅
        for (Map.Entry<String, MqConsumeHandler> subscription : subscriptionMap.entrySet()) {
            client.subscribe(subscription.getKey(), consumerGroup, subscription.getValue());
        }

        return client;
    }

}
```

### 4、注册消费者

```java

/**
 * 
 *
 * @author Eliauk
 * @since 2023/12/14 10:32
 */
@Component(TestConsumer.TOPIC)
public class EventTestConsume implements MqConsumeHandler, TestConsumer {

    private static Logger logger = LoggerFactory.getLogger(EventTestConsume.class);


    @Override
    public void consume(MqMessageReceived message) {

        logger.info("EventTestConsume.consume: " + message);

    }
}
```

### 5、生产者发送消息
```java
private final MqClient mqClient;


/**
 * test
 *
 * @param message 消息
 * @return 发送结果
 * @throws Exception 异常
 */
@GetMapping("/api/folkMQ/test")
public Result<String> test(@RequestParam String message) throws Exception {
    mqClient.publishAsync(TestConsumer.TOPIC, new MqMessage(message));
    return Results.success("成功发送消息");
}

```



