<template>
  <div class="notifications-page">
    <van-nav-bar title="通知" fixed placeholder>
      <template #right>
        <van-button v-if="unreadCount > 0" size="small" type="primary" plain @click="markAllRead">
          全部已读
        </van-button>
      </template>
    </van-nav-bar>

    <van-pull-refresh v-model="loading" @refresh="loadNotifications">
      <div class="notifications-container">
        <van-empty v-if="!loading && notifications.length === 0" description="暂无通知" />

        <div v-else class="notification-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="['notification-item', { unread: !notification.is_read }]"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <span v-if="notification.type === 'mention'">@</span>
              <span v-else-if="notification.type === 'reply'">💬</span>
              <span v-else-if="notification.type === 'like'">❤️</span>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-text">{{ notification.content }}</div>
              <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
            </div>
            <div v-if="!notification.is_read" class="unread-badge"></div>
          </div>
        </div>
      </div>
    </van-pull-refresh>

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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { notificationApi } from '@/utils/supabase'
import { useUserStore } from '@/stores/user'
import type { Notification } from '@/types'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()
const notifications = ref<Notification[]>([])
const loading = ref(false)

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length
})

onMounted(() => {
  loadNotifications()
})

async function loadNotifications() {
  if (!userStore.nickname) return

  loading.value = true
  try {
    const data = await notificationApi.getNotifications(userStore.nickname)
    notifications.value = data || []
  } catch (error) {
    console.error('加载通知失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function handleNotificationClick(notification: Notification) {
  // 标记为已读
  if (!notification.is_read) {
    await notificationApi.markAsRead(notification.id)
    notification.is_read = true
  }

  // 跳转到相关页面
  if (notification.related_id) {
    router.push(`/message/${notification.related_id}`)
  }
}

async function markAllRead() {
  if (!userStore.nickname) return

  try {
    await notificationApi.markAllAsRead(userStore.nickname)
    notifications.value.forEach(n => n.is_read = true)
    showToast('已全部标记为已读')
  } catch (error) {
    console.error('标记失败:', error)
    showToast('操作失败')
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return `${date.getMonth() + 1}-${date.getDate()}`
}
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  padding-bottom: 60px;
}

.notifications-container {
  padding: 16px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.15);
}

.notification-item.unread {
  background: linear-gradient(135deg, #fff9fc 0%, #fffafd 100%);
  border-left: 3px solid var(--primary-color);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.notification-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.unread-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  flex-shrink: 0;
  margin-top: 6px;
}
</style>
