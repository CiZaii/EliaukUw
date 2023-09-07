---
title: ElasticSearch和Kibana配置
date: '2023/9/7 23:20'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-yx2zd7.png
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-yx2zd7.png)
categories: ElasticSearch
tags:
  - docker-compose
top: true
abbrlink: be7fed04
---

## ElasticSearch和Kibana配置

### 1、docker-comppose
```yaml
  elasticsearch:
    container_name: gw-es
    image: registry.cn-hangzhou.aliyuncs.com/zhengqing/elasticsearch:7.14.1
    volumes:
      - ./elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
      - ./elasticsearch/logs/elasticsearch.log:/usr/share/elasticsearch/logs/elasticsearch.log
      - ./elasticsearch/data:/usr/share/elasticsearch/data #配置文件挂载
      - ./elasticsearch/plugins:/usr/share/elasticsearch/plugins #日志文件挂载
    ports:
      - "39200:9200"
      - "39300:9300"
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx1024m
      - ELASTIC_PASSWORD= "123456" # elastic账号密码
    networks:
      - gw_net
    restart: always
  kibana:
    image: registry.cn-hangzhou.aliyuncs.com/zhengqing/kibana:7.14.1
    container_name: gw-kibana
    restart: always
    volumes:
      - ./elasticsearch/kibana/config/kibana.yml:/usr/share/kibana/config/kibana.yml
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    links:
      - elasticsearch
    networks:
      - gw_net
```

### 2、配置文件

#### 2.1、kibana.yml
```yaml
server.name: kibana
server.host: "0.0.0.0"
elasticsearch.hosts: [ "http://elasticsearch:9200" ] # http://www.zhengqingya.com:9200 TODO 修改为自己的ip
xpack.monitoring.ui.container.elasticsearch.enabled: true
elasticsearch.username: "elastic"  # es账号
elasticsearch.password: "123456"   # es密码
i18n.locale: zh-CN # 中文

```
#### 2.2、elasticsearch.yml
```yaml
cluster.name: "docker-cluster"
network.host: 0.0.0.0
http.port: 9200
# 开启es跨域
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: Authorization
# 开启安全控制
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

## 3、初始化密码
### 3、1 首先执行以下命令进如到ES容器中
```bash
docker exec -it [容器ID/容器名] /bin/bash 
```
### 3、2 执行以下命令初始化密码
```bash
bin/elasticsearch-setup-passwords interactive
```
