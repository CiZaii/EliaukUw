---
title: RabbitMQ如何保证消息幂等？
date: '2023/10/18 22:12'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E9%98%BF%E7%8B%B8%20cosplay%E7%BE%8E%E5%A5%B34k%E9%AB%98%E6%B8%85%E5%A3%81%E7%BA%B8_%E5%BD%BC%E5%B2%B8%E5%9B%BE%E7%BD%91.jpg
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/%E9%98%BF%E7%8B%B8%20cosplay%E7%BE%8E%E5%A5%B34k%E9%AB%98%E6%B8%85%E5%A3%81%E7%BA%B8_%E5%BD%BC%E5%B2%B8%E5%9B%BE%E7%BD%91.jpg)
categories: RabbitMQ
tags:
  - 真实项目
abbrlink: '20032586'
---

{% wow animate__zoomIn,5s,0.5s,100,10 %}
{% note blue 'fas fa-bullhorn' modern%}
# RabbitMQ如何保证消息幂等？
{% endnote %}
{% endwow %}

{% tip cogs %}## 1、生产端做消息幂等 (即不重复投递){% endtip %}
> 在生产端的话，其实消费端做好幂等，生产端就算投递多次，也无所谓了。 如果实在想在生产者做幂等的话，可以参考消费端的思路，比如通过redis的 setnx (key可以设计成 producer:具体业务:具有唯一性的某几个或者某一个业务字段 作为key) ,添加防重表等等。但是我个人觉得没必要。把消费端做好幂等就可以了。


{% tip cogs %}## 2、消费端做消息幂等 (即不重复消费){% endtip %}

{% note purple no-icon %}### A、方案{% endnote %}
```java
 /** 
  * 是否能消费，用于防止重复消费
  * false 代表未消费过 ，true代表消费过
  * 
  * @param  content 
  * @param  queueName 
  * @return  
 */
private Boolean checkConsumedFlag(T content, String queueName) {
    String messageKey = queueName + ":" + content.getId();
    if (StringUtils.isBlank(redisTemplate.opsForValue().get(messageKey))) {
        //从redis中没获取到value，说明未消费过该消息，返回true
        return false;
    } else {
        //获取到了value说明消费过，然后将该消息标记为已消费并直接响应ack，不进行下边的业务处理，防止消费n次(保证幂等)
        redisTemplate.opsForValue().set(messageKey, "lock", 60, TimeUnit.SECONDS);
        //事实上，set操作应该放在业务执行完后，确保真正消费成功后执行。这里偷个懒。写在业务执行前了。
        return true;
    }
}
```

{% note green no-icon %}### B、方案(防重表){% endnote %}
>并发高情况下可能会有{% span red, IO瓶颈 %} (先读在写) 该方式需要在发送消息时候，指定一个业务上唯一的字段。
>如 xzll:order:10001 (10001代表订单id) 然后，在消费端获取该字段，并插入到防重表中(插入代码写在哪？)
>如果你{% span green, 声明了事务 %}，那么插入防重这段代码位置无需关注(因为出现异常肯定会回滚)，
>如果{% span green, 没实现事务 %}，那么最好在执行完业务逻辑后，再插入防重表，保证防重表中的数据肯定是消费成功的。实现步骤:
>接收到消息后，{% span yellow, select count(0) from 防重表 where biz_unique_id=message.getBizUniqueId(); %}
>如果大于0，那么说明以及消费过，将直接ack，告知mq删除该消息。如果=0说明没消费过。进行正常的业务逻辑。

{% note red no-icon %}### C、方案(唯一键 : 真正保证了幂等){% endnote %}
> 直接写) 如果消费端业务是新增操作，我们可以为某几个或者某一个字段{% span cyan, 设置业务上的唯一键约束 %}，
> 如果重复消费将会插入两条相同的记录，数据库会{% span red, 报错 %}从而可以保证数据不会插入两条。 

{% note orange no-icon %}### D、方案(乐观锁) {% endnote %}

>并发高下也可能会产生{% span red, IO瓶颈 %} (先读再写) 如果消费端业务是更新操作（例如扣减库存），
>可以给{% span green, 业务表 %}加一个 {% span green, version 字段 %}，每次更新把 {% span green, version %} 作为条件，更新之后 {% span green, version + 1 %}。
>由于 {% span cyan, MySQL的innoDB %}是{% span cyan, 行锁 %}，当其中一个请求成功更新之后，另一个请求才能进来(注意此时该请求拿到的{% span gray, version %}还是1)，
>由于版本号{% span blue, version %}已经变成 2，所以{% span blue, 更新操作 %}不会执行，从而{% span blue, 保证幂等 %}。



