<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi, missYouApi, notificationApi, userApi } from '@/utils/supabase'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { MOOD_TAGS } from '@/types'
import { formatDate } from '@/utils/date'
import type { Message } from '@/types'
import { showConfirmDialog, showToast } from 'vant'

const router = useRouter()
const messageStore = useMessageStore()
const userStore = useUserStore()
const messages = ref<Message[]>([])
const allMessages = ref<Message[]>([])
const loading = ref(false)
const selectedDate = ref<Date | null>(null)
const showCalendarPicker = ref(false)
const missYouCount = ref(0)
const sending = ref(false)
const unreadNotifications = ref(0)

const filteredMessages = computed(() => {
  if (!selectedDate.value) return messages.value

  const targetDate = new Date(selectedDate.value)
  targetDate.setHours(0, 0, 0, 0)

  return messages.value.filter(msg => {
    const msgDate = new Date(msg.publish_at)
    msgDate.setHours(0, 0, 0, 0)
    return msgDate.getTime() === targetDate.getTime()
  })
})

onMounted(async () => {
  await loadMessages()
  await loadMissYouCount()
  await loadUnreadNotifications()
})

async function loadMessages() {
  loading.value = true
  try {
    const data = await messageApi.getPublishedMessages()

    // 为每条留言加载作者头像
    if (data) {
      const messagesWithAvatars = await Promise.all(
        data.map(async (msg) => {
          if (msg.author_name) {
            try {
              const user = await userApi.getUser(msg.author_name)
              return { ...msg, avatar_url: user?.avatar_url }
            } catch {
              return msg
            }
          }
          return msg
        })
      )
      messages.value = messagesWithAvatars
      allMessages.value = messagesWithAvatars
      messageStore.setMessages(messagesWithAvatars)
    }
  } catch (error) {
    console.error('加载留言失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadMissYouCount() {
  if (!userStore.nickname) return
  try {
    missYouCount.value = await missYouApi.getTodayMissYouCount(userStore.nickname)
  } catch (error) {
    console.error('加载想你了次数失败:', error)
  }
}

async function loadUnreadNotifications() {
  if (!userStore.nickname) return
  try {
    unreadNotifications.value = await notificationApi.getUnreadCount(userStore.nickname)
  } catch (error) {
    console.error('加载未读通知失败:', error)
  }
}

async function sendMissYou() {
  if (!userStore.nickname) {
    showToast('请先设置昵称')
    return
  }

  if (sending.value) return

  sending.value = true
  try {
    // 这里假设对方的昵称是固定的，实际应该从配置或数据库获取
    const otherUser = userStore.nickname === '宝贝' ? '老公' : '宝贝'
    await missYouApi.sendMissYou(userStore.nickname, otherUser)
    showToast('已发送"想你了" 💕')
    await loadMissYouCount()
  } catch (error) {
    console.error('发送失败:', error)
    showToast('发送失败')
  } finally {
    sending.value = false
  }
}

function showDatePicker() {
  showCalendarPicker.value = true
}

function onDateConfirm(date: Date) {
  selectedDate.value = date
  showCalendarPicker.value = false
  showToast(`查看 ${formatDate(date.toISOString())} 的留言`)
}

function clearDateFilter() {
  selectedDate.value = null
  showToast('已显示全部留言')
}

function goToDetail(id: string) {
  router.push(`/message/${id}`)
}

function goToAdmin() {
  router.push('/admin/new')
}

function goToNotifications() {
  router.push('/notifications')
}

function goToProfile() {
  router.push('/profile')
}

function getMoodInfo(tag: string) {
  return MOOD_TAGS[tag as keyof typeof MOOD_TAGS] || MOOD_TAGS.miss
}

function isMyMessage(message: Message) {
  return message.author_name === userStore.nickname
}

function goToEdit(id: string, event: Event) {
  event.stopPropagation()
  router.push(`/admin/edit/${id}`)
}

async function deleteMessage(id: string, event: Event) {
  event.stopPropagation()
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条留言吗？'
    })
    await messageApi.deleteMessage(id)
    showToast('删除成功')
    await loadMessages()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      showToast('删除失败')
    }
  }
}
</script>

<template>
  <div class="message-list">
    <div class="header">
      <h1>❤️ 留一口</h1>
      <div class="header-actions">
        <van-button plain type="primary" size="small" icon="user-o" @click="goToProfile">
          我的
        </van-button>
        <van-badge :content="unreadNotifications > 0 ? unreadNotifications : ''" max="99">
          <van-button plain type="primary" size="small" icon="bell-o" @click="goToNotifications">
            通知
          </van-button>
        </van-badge>
        <van-button plain type="primary" size="small" icon="calendar-o" @click="showDatePicker">
          日期
        </van-button>
        <van-button
          plain
          type="danger"
          size="small"
          icon="like-o"
          :loading="sending"
          @click="sendMissYou"
        >
          想你了
        </van-button>
      </div>
    </div>

    <div v-if="missYouCount > 0" class="miss-you-banner">
      <span class="miss-you-icon">💕</span>
      <span>今天收到了 {{ missYouCount }} 次"想你了"</span>
    </div>

    <div v-if="selectedDate" class="date-filter-bar">
      <span>{{ formatDate(selectedDate.toISOString()) }} 的留言 ({{ filteredMessages.length }}条)</span>
      <van-button size="mini" type="primary" plain @click="clearDateFilter">清除筛选</van-button>
    </div>

    <van-pull-refresh v-model="loading" @refresh="loadMessages">
      <div class="messages-container">
        <van-empty v-if="!loading && filteredMessages.length === 0" description="这天还没有留言哦" />

        <div v-else class="message-cards">
          <div
            v-for="message in filteredMessages"
            :key="message.id"
            class="message-card"
            @click="goToDetail(message.id)"
          >
            <div class="card-header">
              <div class="header-left">
                <span class="mood-tag" :style="{ color: getMoodInfo(message.mood_tag).color }">
                  {{ getMoodInfo(message.mood_tag).emoji }} {{ getMoodInfo(message.mood_tag).label }}
                </span>
              </div>
              <div class="header-right">
                <span v-if="!message.is_read" class="new-badge">NEW</span>
              </div>
            </div>

            <div class="card-meta">
              <div class="author-info">
                <div class="author-avatar">
                  <img v-if="message.avatar_url" :src="message.avatar_url" class="avatar-img" />
                  <span v-else>{{ (message.author_name || '匿名').charAt(0) }}</span>
                </div>
                <span class="meta-author">{{ message.author_name || '匿名' }}</span>
              </div>
              <span class="meta-date">{{ formatDate(message.publish_at) }}</span>
            </div>

            <div class="card-content">
              <p class="message-text">{{ message.content }}</p>
              <img v-if="message.image_url" :src="message.image_url" class="message-image" />
            </div>

            <div class="card-footer">
              <div class="footer-left">
                <span class="likes">❤️ {{ message.likes_count }}</span>
                <span class="comments">💬 {{ message.replies_count || 0 }}</span>
              </div>
              <div class="footer-right">
                <template v-if="isMyMessage(message)">
                  <van-button size="mini" type="primary" plain @click="goToEdit(message.id, $event)">编辑</van-button>
                  <van-button size="mini" type="danger" plain @click="deleteMessage(message.id, $event)">删除</van-button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-pull-refresh>

    <!-- 日历选择器 -->
    <van-calendar
      v-model:show="showCalendarPicker"
      title="选择日期"
      :min-date="new Date(2024, 0, 1)"
      :max-date="new Date()"
      @confirm="onDateConfirm"
    />

    <!-- 浮动按钮：发布留言 -->
    <van-floating-bubble
      axis="xy"
      icon="plus"
      magnetic="x"
      @click="goToAdmin"
    />

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

<style scoped>
.message-list {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  padding-bottom: 60px;
}

:deep(.van-floating-bubble) {
  z-index: 999 !important;
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(255, 107, 157, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h1 {
  font-size: 24px;
  color: var(--primary-color);
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.miss-you-banner {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  color: white;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  animation: slideDown 0.5s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.miss-you-icon {
  font-size: 18px;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.date-filter-bar {
  background: linear-gradient(135deg, #fff3f8 0%, #ffe8f0 100%);
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--primary-color);
  border-bottom: 1px solid rgba(255, 107, 157, 0.1);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.05);
}

.messages-container {
  padding: 20px 16px;
}

.message-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(255, 107, 157, 0.05);
  animation: fadeIn 0.5s ease;
}

.message-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.mood-tag {
  font-size: 15px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255, 107, 157, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 107, 157, 0.08);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meta-author {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-color);
}

.meta-date {
  font-size: 13px;
  color: #999;
}

.new-badge {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
}

.card-content {
  margin-bottom: 12px;
}

.message-text {
  font-size: 16px;
  line-height: 1.7;
  color: #333;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.message-image {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
  max-height: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 107, 157, 0.08);
  gap: 12px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.likes,
.comments {
  color: var(--primary-color);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 107, 157, 0.06);
  border-radius: 12px;
  font-size: 13px;
}
</style>
