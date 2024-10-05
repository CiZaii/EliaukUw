---
title: Git操作规约
date: '2023-10-31 23:25'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-qzowgr.png'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/wallhaven-qzowgr.png'
categories: 开发规约
tags:
  - 开发规约
top: true
sticky: 2
swiper_index: 2
password: zangzang
theme: xray
message: 私有文章，仅供自己学习使用。
abstract: 别看了，这篇文章是写给自己的
wrong_pass_message: '抱歉, 这个密码看着不太对, 请再试试!'
abbrlink: c35b2800
---

## Git操作规约

### Git Flow 模型

Git Flow是一种流行的Git工作流程模型，旨在更好地管理Git仓库中的分支和版本控制。它是由 Vincent Driessen 在一篇博文中提出的，并且得到了广泛的采用。
Git Flow 定义了一组严格的分支命名约定和分支的用途，以便团队成员可以更好地协作开发和管理软件项目。该工作流程包括以下几个主要分支：

> 1. Master 分支：代表了主要的稳定版本，用于发布生产环境的代码。通常是经过测试和审核的最新可发布代码。
> 2. Develop 分支：是开发分支，包含最新的开发代码。所有的功能开发、bug修复等都在此分支上进行。
> 3. Feature 分支：用于单个功能的开发，通常从 Develop 分支创建，并在开发完成后合并回 Develop 分支。
> 4. Release 分支：用于发布准备，当在 Develop 分支上积累了足够的功能后，会从 Develop 分支创建<br> Release 分支，用于进行最终的测试和修复 BUG，然后合并回 Master 和 Develop 分支。
> 5. Hotfix 分支：用于紧急修复生产环境中的 BUG。从 Master 分支创建，修复后会合并回 Master 和 Develop 分支。

> Git Flow 通过这样的分支管理方式，使得团队能够更好地协作，同时确保在开发和发布过程中的稳定性和可靠性。这种工作流程在许多软件开发团队中被广泛使用，并被认为是一种成熟、可靠的Git工作流模型。

### 提交日志规约

Cimmit Message：type(scope[optional]): subject

#### 1、type

- feature：新功能
- fix：修补bug
- docs：文档
- style：格式（不影响代码运行的变动）
- refactor：重构（即不是新增功能，也不是修改bug的代码变动）
- test：增加测试
- chore：构建过程或辅助工具的变动
- optimize：优化

#### 2、scope

scope用于说明 commit 影响的范围，比如数据层、控制层、视图层等等，视项目不同而不同。

#### 3、subject

subject是 commit 目的的简短描述，不超过50个字符。

- 以动词开头，使用第一人称现在时，比如change，而不是changed或changes
- 第一个字母小写
- 结尾不加句号（.）

示例：
feature(message-center): 开发消息发送落库功能。或者 feature: 开发消息发送落库功能。

### 分支命名规约

分支命名：{type}_{time}_{describe}_{developer}



#### 1、type


- feature：新功能
- fix：修补bug
- docs：文档
- style：格式（不影响代码运行的变动）
- refactor：重构（即不是新增功能，也不是修改bug的代码变动）
- test：增加测试
- chore：构建过程或辅助工具的变动
- optimize：优化

#### 2、time

- 格式：20190301

#### 3、describe

例如消息发送：send-message。尽量以两个单词描述清楚，多个单词间使用中划线 - 分割。

#### 4、developer

建议填写开发者名字，例如：eliauk.doo

示例：
feature_20220915_send-message_eliauk.doo
