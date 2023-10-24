---
title: 2、MQ配置以及生产者消费者逻辑
date: '2023/10/24 21:01'
swiper: true
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/171442-16968428823aa1.jpg'
top_img: 'url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/171442-16968428823aa1.jpg)'
categories: 各种类型文件操作
tags:
  - 消息发送与消费
abbrlink: 97da32d6
---

## 相关配置

### RabbitConfig

```java
@Configuration
public class RabbitConfig implements RabbitTemplate.ConfirmCallback, RabbitTemplate.ReturnCallback {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    private static final Logger logger = LoggerFactory.getLogger(RabbitConfig.class);

    @PostConstruct
    public void initRabbitTemplate() {
        rabbitTemplate.setConfirmCallback(this);
        rabbitTemplate.setReturnCallback(this);
    }

    @Override
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {
        if (ack) {
            logger.info("{}消息成功到达交换机",correlationData.getId());
        } else {
            logger.info("消息发送到Exchange失败, {}, cause: {}", correlationData, cause);
        }
    }

    @Override
    public void returnedMessage(Message message, int replyCode, String replyText, String exchange, String routingKey) {
        logger.error("消息从Exchange路由到Queue失败: exchange: {}, route: {}, replyCode: {}, replyText: {}, message: {}", exchange, routingKey, replyCode, replyText, message);
    }

}
```

### MessageHelper

```java
public class MessageHelper {

    public static Message objToMsg(Object obj) {
        if (null == obj) {
            return null;
        }

        //System.out.println(JSONUtil.toJsonStr(obj));

        Message message = MessageBuilder.withBody(JSONUtil.toJsonStr(obj).getBytes()).build();
        message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);// 消息持久化
        message.getMessageProperties().setContentType(MessageProperties.CONTENT_TYPE_JSON);

        return message;
    }

    public static <T> T msgToObj(Message message, Class<T> clazz) {
        if (null == message || null == clazz) {
            return null;
        }

        String str = new String(message.getBody());
        T obj = JSONUtil.toBean(str, clazz);

        return obj;
    }
}
```

### RabbitDirectConfig

```java
@Configuration
public class RabbitDirectConfig {

    @Bean
    public Queue pathUploadQueue() {
        Map<String, Object> arguments = new HashMap<>(2);
        arguments.put("x-dead-letter-exchange", PathUpLoadDeadMessage.EXCHANGE + APP_KEY);
        //绑定该队列到死信交换机的队列1
        arguments.put("x-dead-letter-routing-key", PathUpLoadDeadMessage.ROUTING_KEY + APP_KEY);
        return QueueBuilder.durable(PathUpLoadMessage.QUEUE + APP_KEY).withArguments(arguments).build();
    }


    @Bean
    public DirectExchange pathUploadExchange() {
        return new DirectExchange(PathUpLoadMessage.EXCHANGE + APP_KEY,
                true,  // durable: 是否持久化
                false);  // exclusive: 是否排它
    }


    @Bean
    public Binding pathUploadBinding() {
        return BindingBuilder.bind(pathUploadQueue()).to(pathUploadExchange()).with(PathUpLoadMessage.ROUTING_KEY + APP_KEY);
    }


    @Bean
    public Queue pathUploadDeadQueue() {
        return new Queue(PathUpLoadDeadMessage.QUEUE + APP_KEY, // Queue 名字
                true, // durable: 是否持久化
                false, // exclusive: 是否排它
                false); // autoDelete: 是否自动删除
    }


    @Bean
    public DirectExchange pathUploadDeadExchange() {
        return new DirectExchange(PathUpLoadDeadMessage.EXCHANGE + APP_KEY,
                true,  // durable: 是否持久化
                false);  // exclusive: 是否排它
    }


    @Bean
    public Binding pathUploadDeadBinding() {
        return BindingBuilder.bind(pathUploadDeadQueue()).to(pathUploadDeadExchange())
                .with(PathUpLoadDeadMessage.ROUTING_KEY + APP_KEY);
    }
}
```

## pathUpload包

### PathUploadConsumer

```java
/**
 * @author Eliauk
 * @since 2023/9/28 15:00
 */
@Component
@DependsOn({"appraisalFileRepository"})
public class PathUploadConsumer {

    private static Logger LOG = LoggerFactory.getLogger(PathUploadConsumer.class);

    @Resource
    private PathUploadStrategyContext pathUploadStrategyContext;


    @RabbitListener( queues = PathUpLoadMessage.QUEUE + "${spring.application.name}", concurrency = "1")
    @RabbitHandler
    public void onMessage(Message msg, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        PathUpLoadMessage message = MessageHelper.msgToObj(msg, PathUpLoadMessage.class);
        DBContextHolder.setDB(message.getTenantId());

        LOG.info("接收到文件上传消息--[线程编号:{}]-[文件夹名:{}]", Thread.currentThread().getId(), new File(message.getFile()).getName());

        long timeStart = DateUtil.current();

        try {
            pathUploadStrategyContext.getFileInferStrategy(message, message.getStrategy());
            // 只在成功处理后确认消息
            channel.basicAck(deliveryTag, false);
        }catch (Exception e) {

            e.printStackTrace();
            Boolean redelivered = msg.getMessageProperties().getRedelivered();
            if (redelivered) {
                LOG.info("异常重试次数已到达设置次数，将发送到死信交换机");
                channel.basicAck(deliveryTag, false);
            }

            LOG.error("处理异常，准备进行重试：{}", Thread.currentThread().getId());

            // 设置 requeue 参数为 true 以将消息重新放回队列
            channel.basicNack(deliveryTag, false, true);

            // 暂停一段时间，可根据需要调整
            try {
                Thread.sleep(3000); // 等待 5 秒
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
            }

            return; // 返回，以避免在 finally 块中再次确认消息
        }
        finally {
            DBContextHolder.clearDB();
            LOG.info("完成路径上传，总耗时：{}s--[线程编号:{}]", (DateUtil.current() - timeStart) / 1000, Thread.currentThread().getId());

        }

    }

}
```

### PathUpLoadDeadMessage

```java
/**
 * @author Eliauk
 */
@Data
public class PathUpLoadDeadMessage implements Serializable {

    private static final long serialVersionUID = -6106380050056919533L;
    public static final String QUEUE = "QUEUE_PATH_UPLOAD_DEAD";

    public static final String EXCHANGE = "EXCHANGE_PATH_UPLOAD_DEAD";

    public static final String ROUTING_KEY = "ROUTING_KEY_PATH_UPLOAD_DEAD";


    private String taskId;

    private String tenantId;

    private String importTaskId;
}
```

### PathUpLoadMessage

```java
/**
 * @author Eliauk
 */
@Data
public class PathUpLoadMessage implements Serializable {

    private static final long serialVersionUID = -3452912668432655539L;

    public static final String QUEUE = "QUEUE_PATH_UPLOAD";

    public static final String EXCHANGE = "EXCHANGE_PATH_UPLOAD";

    public static final String ROUTING_KEY = "ROUTING_KEY_PATH_UPLOAD";


    /**
     * 任务ID
     */
    private String taskId;

    /**
     * 租户ID
     */
    private String tenantId;

    /**
     * 文件名称
     */
    private String fileName;

    /**
     * 所需合并文件夹
     */
    private String file;

    /**
     * 所需执行策略
     */
    private String strategy;

    /**
     * 是否覆盖
     */
    private String overWrite;
}
```

### PathUpLoadProducer

```java
/**
 * @author Eliauk
 */
@Component
@DependsOn({"rabbitConfig"})
public class PathUpLoadProducer {
    @Resource
    private RabbitTemplate rabbitTemplate;
    @Value("${spring.application.name}")
    private String ROUTING_KEY;

    public void syncSendPathUpload(String tenantId, String taskId, String fileName,String file, String overwrite, String strategy) {
        PathUpLoadMessage message = new PathUpLoadMessage();
        String msgId = UUID.fastUUID().toString();
        CorrelationData correlationData = new CorrelationData(msgId);
        message.setTaskId(taskId);
        message.setTenantId(tenantId);
        message.setFileName(fileName);
        message.setStrategy(strategy);
        message.setOverWrite(overwrite);
        message.setFile(file);
        // 消息经过的交换机，通过名称指定，路由键：该路由键回去寻找绑定在交换机上相同路由键的队列
        rabbitTemplate.convertAndSend(PathUpLoadMessage.EXCHANGE + ROUTING_KEY,
                PathUpLoadMessage.ROUTING_KEY + ROUTING_KEY,
                MessageHelper.objToMsg(message), correlationData);
    }
}
```

