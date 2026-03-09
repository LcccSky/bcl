<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '@/utils/supabase'
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
})

async function loadMessages() {
  loading.value = true
  try {
    const data = await messageApi.getPublishedMessages()
    messages.value = data
    allMessages.value = data
    messageStore.setMessages(data)
  } catch (error) {
    console.error('加载留言失败:', error)
  } finally {
    loading.value = false
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

function goToStats() {
  router.push('/stats')
}

function goToAdmin() {
  router.push('/admin/new')
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
        <van-button plain type="primary" size="small" icon="calendar-o" @click="showDatePicker">
          日期
        </van-button>
        <van-button plain type="primary" size="small" @click="goToStats">
          统计
        </van-button>
      </div>
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
              <span class="mood-tag" :style="{ color: getMoodInfo(message.mood_tag).color }">
                {{ getMoodInfo(message.mood_tag).emoji }} {{ getMoodInfo(message.mood_tag).label }}
              </span>
              <span v-if="!message.is_read" class="new-badge">NEW</span>
            </div>

            <div class="card-content">
              <p class="message-text">{{ message.content }}</p>
              <img v-if="message.image_url" :src="message.image_url" class="message-image" />
            </div>

            <div class="card-footer">
              <div class="footer-left">
                <span class="time">{{ formatDate(message.publish_at) }}</span>
                <span v-if="message.author_name" class="author">· {{ message.author_name }}</span>
              </div>
              <div class="footer-right">
                <span class="likes">❤️ {{ message.likes_count }}</span>
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
  </div>
</template>

<style scoped>
.message-list {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  padding-bottom: 80px;
}

:deep(.van-floating-bubble) {
  z-index: 999 !important;
}

.header {
  background: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow);
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

.date-filter-bar {
  background: #fff3f8;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--primary-color);
  border-bottom: 1px solid #ffe0ed;
}

.messages-container {
  padding: 16px;
}

.message-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  cursor: pointer;
  animation: fadeIn 0.5s ease;
}

.message-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mood-tag {
  font-size: 14px;
  font-weight: 600;
}

.new-badge {
  background: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.card-content {
  margin-bottom: 12px;
}

.message-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-image {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
  max-height: 200px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
  gap: 8px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author {
  color: var(--primary-color);
  font-weight: 500;
}

.likes {
  color: var(--primary-color);
}
</style>
