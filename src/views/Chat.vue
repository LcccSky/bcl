<template>
  <div class="chat-page">
    <van-nav-bar title="聊天" fixed placeholder />

    <div class="chat-container" ref="chatContainer">
      <div v-for="msg in messages" :key="msg.id"
           :class="['message-item', msg.user_id === currentUserId ? 'message-right' : 'message-left']">
        <div class="message-avatar">
          {{ msg.user_name.charAt(0) }}
        </div>
        <div class="message-content">
          <div class="message-name">{{ msg.user_name }}</div>
          <div v-if="msg.message_type === 'text'" class="message-text">
            {{ msg.content }}
          </div>
          <div v-else-if="msg.message_type === 'image'" class="message-image">
            <van-image :src="msg.image_url" fit="cover" @click="previewImage(msg.image_url)" />
          </div>
          <div v-else-if="msg.message_type === 'emoji'" class="message-emoji">
            {{ msg.content }}
          </div>
          <div class="message-time">{{ formatTime(msg.created_at) }}</div>
        </div>
      </div>
    </div>

    <div class="chat-input-wrapper">
      <van-field
        v-model="inputMessage"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
      >
        <template #button>
          <van-button size="small" type="primary" @click="sendMessage">发送</van-button>
        </template>
      </van-field>
    </div>

    <!-- 底部导航栏 -->
    <van-tabbar route>
      <van-tabbar-item to="/messages" icon="chat-o">留言</van-tabbar-item>
      <van-tabbar-item to="/chat" icon="comment-o">聊天</van-tabbar-item>
      <van-tabbar-item to="/pet" icon="smile-o">猫猫</van-tabbar-item>
      <van-tabbar-item to="/wish" icon="star-o">愿望</van-tabbar-item>
      <van-tabbar-item to="/stats" icon="bar-chart-o">故事</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { showToast, showImagePreview } from 'vant'
import { chatApi } from '@/utils/supabase'
import type { ChatMessage } from '@/types'

const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const chatContainer = ref<HTMLElement>()
const currentUserId = ref('user1') // 这里应该从用户状态获取
const currentUserName = ref('用户1') // 这里应该从用户状态获取
let realtimeChannel: any = null

// 加载历史消息
const loadMessages = async () => {
  try {
    const data = await chatApi.getMessages(100)
    messages.value = data || []
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('加载消息失败:', error)
    showToast('加载消息失败')
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  try {
    await chatApi.sendMessage({
      user_id: currentUserId.value,
      user_name: currentUserName.value,
      content: inputMessage.value.trim(),
      message_type: 'text'
    })
    inputMessage.value = ''
  } catch (error) {
    console.error('发送消息失败:', error)
    showToast('发送失败')
  }
}

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`

  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// 预览图片
const previewImage = (url?: string) => {
  if (url) {
    showImagePreview([url])
  }
}

// 订阅实时消息
const subscribeToMessages = () => {
  realtimeChannel = chatApi.subscribeToMessages((newMessage: ChatMessage) => {
    messages.value.push(newMessage)
    nextTick(() => {
      scrollToBottom()
    })
  })
}

onMounted(() => {
  loadMessages()
  subscribeToMessages()
})

onUnmounted(() => {
  if (realtimeChannel) {
    chatApi.unsubscribe(realtimeChannel)
  }
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 130px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 8px;
}

.message-left {
  flex-direction: row;
}

.message-right {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-name {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.message-right .message-name {
  text-align: right;
}

.message-text {
  background: white;
  padding: 10px 14px;
  border-radius: 12px;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-right .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-image {
  border-radius: 12px;
  overflow: hidden;
  max-width: 200px;
}

.message-emoji {
  font-size: 48px;
  line-height: 1;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.message-right .message-time {
  text-align: right;
}

.chat-input-wrapper {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: white;
  padding: 8px;
  border-top: 1px solid #eee;
  z-index: 100;
}

:deep(.van-field) {
  padding: 8px 12px;
}
</style>
