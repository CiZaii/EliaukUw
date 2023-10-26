---
title: RabbitMQ消费者ack超时问题
date: '2023/10/18 22:12'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-jxl31y.png
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-jxl31y.png)
categories: RabbitMQ
tags:
  - 真实项目
abbrlink: e5894e26
---

## 消息手动ack + 手动重试

```java
/**
 * 消息最大重试次数
 */
private static final int MAX_RETRIES = 3;
 
/**
 * 重试间隔(秒)
 */
private static final long RETRY_INTERVAL = 5;
 
private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    
@RabbitListener(queues = RabbitMqConfig.USER_ADD_QUEUE, concurrency = "10")
public void userAddReceiver(String data, Message message, Channel channel) throws IOException, InterruptedException {
    UserVo vo = OBJECT_MAPPER.readValue(data, UserVo.class);
    // 重试次数
    int retryCount = 0;
    boolean success = false;
    // 消费失败并且重试次数<=重试上限次数
    while (!success && retryCount < MAX_RETRIES) {
        retryCount++;
        // 具体业务逻辑
        success = messageHandle(vo);
        // 如果失败则重试
        if (!success) {
            String errorTip = "第" + retryCount + "次消费失败" +
                    ((retryCount < 3) ? "," + RETRY_INTERVAL + "s后重试" : ",进入死信队列");
            log.error(errorTip);
            Thread.sleep(RETRY_INTERVAL * 1000);
        }
    }
    if (success) {
        // 消费成功，确认
        channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        log.info("创建订单数据消费成功");
    } else {
        // 重试多次之后仍失败，发送到死信队列
        channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, false);
        log.info("创建订单数据消费失败");
    }
}
```