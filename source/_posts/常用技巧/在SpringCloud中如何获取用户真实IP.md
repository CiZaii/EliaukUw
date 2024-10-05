---
title: 在SpringCloud中如何获取用户真实IP(避免各种问题)
date: '2024/3/14 19:28'
swiper: false
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefined20240315143508.png
img: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/undefined20240315143508.png
categories: 实用
tags:
  - 真实项目
top: true
sticky: 6
swiper_index: 6
abbrlink: 1f6ffb2c
---

> 大家平时获取用户的真实IP的时候可能会遇到的一些问题 如果发生问题可以按照以下思路排查应该会帮到你

## 1、查看Nginx配置

> 一般情况下，我们的项目都是通过Nginx进行代理的，所以我们需要查看Nginx的配置文件


```conf

location / {

proxy_set_header X-Real-IP $remote_addr;



}

2. 使用X-Forwarded-For头字段：类似于X-Real-IP，可以使用X-Forwarded-For头字段来传递客户端的真实IP地址。在NGINX配置文件中，可以通过添加如下代码来设置X-Forwarded-For头字段的值：

location / {

proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

}
```
> 查看是否有以上配置进行了代理转发

## 2、查看GateWay配置(如果单体项目没有使用网关忽略)
> 首先要查看网关中的过滤器链里边所有的自定义过滤器有没有对请求头进行了修改，如果有修改的话请根据当前业务进行适当的修改

## 3、查看是否调用了Fegin接口
> 如果调用了Fegin接口的话，他默认是不携带多余请求头的，所以我们要对齐进行配置

```java
@Configuration
public class FeignAuthRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate requestTemplate) {
        // 获取当前的ServletRequestAttributes
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            // 获取原始的HttpServletRequest
            HttpServletRequest request = attributes.getRequest();

            // 遍历所有的请求头
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                String headerValue = request.getHeader(headerName);
                // 这个地方一定要加上，否则会出现一些问题
                if (headerName.equals("content-length")){
                    continue;
                }
                // 将请求头添加到Feign的RequestTemplate
                requestTemplate.header(headerName, headerValue);
            }
        }
    }
}
```



