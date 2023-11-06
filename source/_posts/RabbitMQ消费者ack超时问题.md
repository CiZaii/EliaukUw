---
title: RabbitMQ消费者ack超时问题
date: '2023/10/18 22:12'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-ex9gwo.png
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-ex9gwo.png)
categories: RabbitMQ
tags:
  - 真实项目
abbrlink: e5894e20
---

{% tip error %}### 报错信息{% endtip %}
```bash
Shutdown Signal: channel error; protocol method: #method<channel.close>(reply-code=40, reply-text-PRECONDITION FAILED 
- deliveryacknowledoement on channel 2 timed out, Timeout value used: 1800000 ms, This timeout yalue can be confaured. se consumers doc ouide to learmore. 
class-id=0.method-id=0)
```

{% tip success %}### 解决方法{% endtip %}
>rabbitmq默认客户端超时时间是30分钟，手动ACK情况下会如果业务事件较长会超时，可以采用下面修改方式：

#### {% span blue, 第一种：需要重启MQ %}
> 在etc目录下建一个文件，/etc/rabbitmq.conf，rabbitmq默认不会建这个文件，然后文件里面设置consumer_timeout = 360000（根据需要来决定）。然后重新启动rabbitmq。

#### {% span blue, 第二种：无需重启，动态修改： %}
> 修改前，在MQ服务器上执行：{% span cyan, rabbitmqctl eval 'application:get_env(rabbit,consumer_timeout).' %} 来查看当前时间是多少，然后：

##### {% span green, 如果你是在docker容器中 %}
要在Docker容器中运行`rabbitmqctl`命令，你需要先进入到运行RabbitMQ的Docker容器内。下面是一些步骤说明如何执行这个任务：

1. 查找容器ID或名称:<br />首先，你需要找到运行RabbitMQ的Docker容器的ID或名称。你可以通过运行以下命令来做到这一点：
```bash
{% span yellow, docker ps %}
```
这会列出所有正在运行的容器，包括它们的ID和名称。

2. 进入容器:<br />现在，你可以使用`docker exec`命令进入容器。替换`<container_id_or_name>`**为你在上一步找到的容器ID或名称：
```bash
{% span cyan, docker exec -it <container_id_or_name> /bin/bash %}
```
>这将打开一个bash shell，让你能够在容器内运行命令。

3. 运行`rabbitmqctl`命令:<br />现在你可以运行`rabbitmqctl`命令来更新RabbitMQ的配置：
```bash
{% span cyan, rabbitmqctl eval 'application:set_env(rabbit, consumer_timeout, 3600000).' %}
```

4. 修改后，再执行验证。
```bash
{% span cyan, rabbitmqctl eval 'application:get_env(rabbit,consumer_timeout).' %}
```

5. {% span red, 退出容器: %}

>完成后，你可以通过输入exit命令退出容器的bash shell。<br />请注意，更改RabbitMQ的配置可能需要RabbitMQ服务重启才能生效。在生产环境中执行此类操作时应当谨慎，并确保你已经备份了所有重要的数据和配置。**<br />此外，为了持久化这些配置更改，你可能需要考虑更新RabbitMQ的配置文件，并重新创建和启动容器。这样，即使容器被重新启动，配置更改也会保留。
