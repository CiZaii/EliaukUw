---
title: 使用SSE对接清华chatGLM模型
date: '2023-12-13 23:25'
swiper: false
cover: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/172633-1702200393f13a.jpg'
img: 'https://zang-1307996497.cos.ap-beijing.myqcloud.com/172633-1702200393f13a.jpg'
categories: chat
tags:
  - AI
abbrlink: a0c3992a
---

## 1、前端基本代码

```vue
<template>
  <!-- 输入框，用于输入消息。当按下回车键时，触发 handleSendEvent 方法 -->
  <input v-model="input" @keydown.enter="handleSendEvent" >
  <!-- 发送按钮，点击时触发 handleSendEvent 方法 -->
  <button @click="handleSendEvent">发送信息</button>
  <!-- 显示从服务器接收的消息 -->
  <div>
    {{message}}
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'

// 使用 ref 创建一个响应式的变量 message 来存储从服务器接收的消息
const message = ref('')
// 使用 ref 创建一个响应式的变量 input 来存储用户输入的消息
const input = ref('')

// 处理发送事件的函数
function handleSendEvent(){
  // 如果输入为空，则显示警告并返回
  if(!input.value){
    alert('内容为空');
    return
  }
  // 清空显示的消息
  message.value = '';
  // 创建一个新的 EventSource 实例来监听服务器发送的事件
  // `/api/chatgpt/test?message=${input.value}` 是向服务器发送的请求，包含用户输入的消息
  const evtSource = new EventSource(`/api/chatgpt/test?message=${input.value}`);
  // 清空输入框
  input.value = '';
  // 当收到消息时的处理函数
  evtSource.onmessage = (event) => {
    console.log('onmessage',event.data)
    // 解析从服务器接收的数据，并更新 message 变量来显示消息
    message.value += JSON.parse(event.data)?.choices[0].delta.content;
  }
  // 如果连接出错，关闭 EventSource
  evtSource.onerror = () => {
    console.log('onerror')
    evtSource.close();
  }
}
</script>

```

## 2、后端代码

```java

/**
 * 处理与OpenAI API的实时交互，并通过Server-Sent Events (SSE) 返回数据。
 *
 * @param message 用户发送的消息
 * @return SseEmitter 用于发送实时事件
 * @throws Exception 如果在处理请求时发生异常
 */
@GetMapping(value = "/api/chatgpt/test", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter testChatGpt(@RequestParam String message) throws Exception {

    // 创建一个SseEmitter实例，超时时间设置为无限
    final SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

    // 使用线程池执行任务
    executorService.execute(() -> {
        // 构建与OpenAI API通信的请求
        CompletionRequest request = CompletionRequest.builder()
                .stream(true)
                .messages(Collections.singletonList(Message.builder().role(CompletionRequest.Role.USER).content(message).build()))
                .model(CompletionRequest.Model.CHATGLM_TURBO.getCode())
                .build();

        // 创建一个CountDownLatch以等待异步操作完成
        CountDownLatch countDownLatch = new CountDownLatch(1);

        // 尝试发送请求并处理响应
        try {
            openAiSession.completions(request, new EventSourceListener() {
                @Override
                public void onEvent(EventSource eventSource, @Nullable String id, @Nullable String type, String data) {
                    // 检查是否收到完成标记
                    if ("[DONE]".equalsIgnoreCase(data)) {
                        log.info("OpenAI 应答完成");
                        return;
                    }

                    // 解析OpenAI的响应
                    CompletionResponse chatCompletionResponse = JSON.parseObject(data, CompletionResponse.class);
                    List<ChatChoice> choices = chatCompletionResponse.getChoices();
                    for (ChatChoice chatChoice : choices) {
                        Message delta = chatChoice.getDelta();
                        // 忽略助理的角色消息
                        if (CompletionRequest.Role.ASSISTANT.getCode().equals(delta.getRole())) continue;

                        // 检查是否应该结束响应
                        String finishReason = chatChoice.getFinishReason();
                        if (StringUtils.isNoneBlank(finishReason) && "stop".equalsIgnoreCase(finishReason)) {
                            return;
                        }
                        try {
                            // 向客户端发送数据
                            emitter.send(data);
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                        log.info("测试结果：{}", delta.getContent());
                    }
                }

                @Override
                public void onClosed(EventSource eventSource) {
                    log.info("对话完成");
                    emitter.complete(); // 确保SSE流被正确关闭
                    countDownLatch.countDown();
                }

                @Override
                public void onFailure(EventSource eventSource, @Nullable Throwable t, @Nullable Response response) {
                    // 在发生错误时完成SSE流并记录错误
                    emitter.completeWithError(t);
                    log.info("对话异常");
                    countDownLatch.countDown();
                }
            });
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        try {
            // 等待直到对话完成
            countDownLatch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    });

    return emitter;
}


```
