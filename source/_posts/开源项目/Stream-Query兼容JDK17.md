---
title: Stream-Query兼容JDK17
description: 'Stream-Query兼容JDK17,解决JDK8+版本的模块化安全问题'
date: '2023-11-06 22:51'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-jxl56w.png'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-jxl56w.png'
categories: 开源
top: true
sticky: 1
swiper_index: 1
tags:
  - Dromara
abbrlink: ce54e34d
---



## {% tip warning faa-horizontal animated %}1、升级之后的问题{% endtip %}

> 在升级到JDK17的过程中遇到了一些问题
> 1、比如在设置属性可修改时碰到了一些问题

```java
/**
   * return accessible accessibleObject
   *
   * @param accessibleObject accessibleObject method
   * @param <$ACCESSIBLE_OBJECT> a $ACCESSIBLE_OBJECT class
   * @return accessibleObject
   */
  public static <$ACCESSIBLE_OBJECT extends AccessibleObject> $ACCESSIBLE_OBJECT accessible(
      $ACCESSIBLE_OBJECT accessibleObject) {
    if (accessibleObject.isAccessible()) {
      return accessibleObject;
    }
    return AccessController.doPrivileged(
        (PrivilegedAction<$ACCESSIBLE_OBJECT>)
            () -> {
              accessibleObject.setAccessible(true);
              return accessibleObject;
            });
  }
```
> 上述是源代码，然后产生的问题是
```shell
java.lang.reflect.InaccessibleObjectException: Unable to make field private static final long java.lang.invoke.MethodType.serialVersionUID accessible: module java.base does not "opens java.lang.invoke" to unnamed module @6cc4c815
```

> 在网上查阅资料得知是因为在jkd9版本及以上版本中，Java平台模块化系统（JPMS）引入了更严格的访问控制。即使通过反射API调用setAccessible(true)试图强制访问某个类的私有成员，
> 如果包含该成员的模块没有显式地向调用者模块开放(opens)相应的包，那么尝试访问该成员时将会抛出IllegalAccessException。

## 2、解决

### 1、来自(CSDN)

>在网上(CSDN)看到了好多说什么把JDK版本降到8就解决了（好像在脱了裤子放屁一样）

### 2、一些正确的可用的解决方法

网上有一种临时解决办法就是在项目启动的jvm参数中设置以下参数
```shell
--add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED
```

> 但是作为一个开源项目不能让使用的用户每次启动项目都去手动设置JVM参数，如果这样的化那这个开源项目基本就没人使用了


### 3、最终解决办法(全自动，可靠，兼容多版本)

#### 1、添加属性
为了适配多版本需要使用properties属性
```xml
<properties>
        <surefire.argLine></surefire.argLine>
</properties>
```
> 添加属性，然后根据JDK的版本去添加对应的数据

#### 2、使用属性

引入maven插件
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>${maven-surefire-plugin.version}</version>
    <configuration>
        <testFailureIgnore>true</testFailureIgnore>
        <!-- 使用属性值来配置argLine -->
        <argLine>${surefire.argLine}</argLine>
    </configuration>
</plugin>
```

#### 3、动态修改启动参数

```xml
<profile>
    <!-- 这个profile在Java 8或更高版本时激活 -->
    <id>java8+</id>
    <activation>
        <jdk>[8,)</jdk>
    </activation>
    <properties>
        <!-- 重写argLine属性为Java 8+的配置 -->
        <surefire.argLine>--add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED</surefire.argLine>
    </properties>
</profile>
```




