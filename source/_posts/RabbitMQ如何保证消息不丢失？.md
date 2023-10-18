---
title: RabbitMQ如何保证消息不丢失？
date: '2023/10/18 22:12'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-l8gw6l.png
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-l8gw6l.png)
categories: RabbitMQ
tags:
  - 真实项目
abbrlink: 3bd74647
---

{% wow animate__zoomIn,5s,0.5s,100,10 %}
{% note blue 'fas fa-bullhorn' modern%}
RabbitMQ如何保证消息不丢失？
{% endnote %}
{% endwow %}

{% tip cogs %}1、生产者需要做的{% endtip %}

> 生产者重写 RabbitTemplate.ConfirmCallback的 confirm方法以及 returnedMessage 方法。
将 ack==false 的消息 持久化到数据库,定时扫描 DB 中投递失败的数据，重新投递到MQ中；

```java
/**
 * 生产者 确认消息的配置
 * 此函数为回调函数,用于通知producer消息是否投递成功
 *
 * @param correlationData 消息唯一ID
 * @param ack             确认消息是否被MQ 接收,true是已被接收,false反之
 * @param cause
 */
@Override
public void confirm(CorrelationData correlationData, boolean ack, String cause) {
   //投递成功
   if (ack) {
      //不做处理，等待消费成功
      log.info(correlationData.getId() + "：发送成功");
      //删除redis里面备份的数据
      redisTemplate.delete(correlationData.getId());
   } else {
      //投递失败 //测试该逻辑时候 把上边的if(ack) 改成if(!ack)即可
      //持久化到数据库 (TODO 注意: 有时候 (严格保证消息投递成功的场景下) 可能需要增加定时任务，
      //TODO 定时扫描 redis或者DB (这里我们把投递失败的保存到了DB 所以定时任务扫描DB就可以了) 中投递失败的数据，重新投递到MQ中,这也是保证消息投递成功的一个手段)
      //TODO (但是 :  如果是需要顺序消费的话，这种重新投递的策略就显得不那么合适了，我想的是某几个顺序消息拥有同一个会话ID 。。。具体的实现我将在后续研究一下,这里先不考虑顺序消费的场景)
      log.error(correlationData.getId() + "：发送失败");
      log.info("备份到DB的内容：" + redisTemplate.opsForValue().get(correlationData.getId()));
      try {
         SaveNackMessage strategy = SaveNackMessage.getStrategy(SaveNackMessage.NackTypeEnum.PRODUCER.getType());
         HashMap<String, Object> map = new HashMap<>();
         map.put("cause", StringUtils.isNoneBlank(cause) ? cause : StringUtils.EMPTY);
         map.put("ack", ack ? 1 : 0);
         map.put("correlationData", Objects.nonNull(correlationData) ? correlationData : StringUtils.EMPTY);
         saveNackMessageThread.execute(strategy.template(map));
      } catch (Exception e) {
         //TODO 发布event事件 监听方发送钉钉消息提醒开发者
         log.error("记录mq发送端错误日志失败", e);
      }
   }
}
```

>另外除了实现confirm方法，还需要实现returnedMessage方法 即(投递消息后，交换机找不到具体的queue将会回调该方法 一般我们需要配置钉钉预警，告知开发者)
具体代码如下:

```java
@Autowired
private ApplicationEventPublisher publisher;

/**
 * 当投递消息后，交换机找不到具体的queue将会回调该方法 一般我们需要配置钉钉预警，告知开发者
 *
 * @param message
 * @param replyCode
 * @param replyText
 * @param exchange
 * @param routingKey
 */
@Override
public void returnedMessage(Message message, int replyCode, String replyText, String exchange, String routingKey) {
   log.error("returnedMessage 消息主体 message : {}", message);
   log.error("returnedMessage 描述：{}", replyText);
   log.error("returnedMessage 消息使用的交换器 exchange : {}", exchange);
   log.error("returnedMessage 消息使用的路由键 routing : {}", routingKey);

   HashMap<String, Object> maps = Maps.newHashMap();
   maps.put("message", message);
   maps.put("replyCode", replyCode);
   maps.put("replyText", replyText);
   maps.put("exchange", exchange);
   maps.put("routingKey", routingKey);
   String returnedMessage = JSON.toJSONString(maps);

   SendFailNoticeEvent noticeEvent = new SendFailNoticeEvent();
   noticeEvent.setLevel(1);
   noticeEvent.setErrorMsg(
         System.lineSeparator() +
               "producer投递消息失败；报错信息: " + returnedMessage);
   noticeEvent.setTalkTypeEnum(DingTalkTypeEnum.BIZ_NOTICE);
   //发送消息投递失败事件，监听器方将信息发送至钉钉机器人群里或者是某个具体的人。
   publisher.publishEvent(noticeEvent);
}
```

{% tip cogs %}2、(MQ需要做的) 开启持久化参数{% endtip %}
> durable=true

{% tip cogs %}3、消费者需要做的 {% endtip %}

>(消费者) 需要做的 手动ack,保证业务执行完后再ack,通知mq将某条消息删除
```properties
spring.rabbitmq.listener.simple.acknowledge-mode=manual
```

