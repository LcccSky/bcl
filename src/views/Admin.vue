<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '@/utils/supabase'
import { MOOD_TAGS } from '@/types'
import { formatDateTime } from '@/utils/date'
import type { Message } from '@/types'

const router = useRouter()
const messages = ref<Message[]>([])
const loading = ref(false)

onMounted(async () => {
  await loadMessages()
})

async function loadMessages() {
  loading.value = true
  try {
    const data = await messageApi.getPublishedMessages()
    messages.value = data
  } catch (error) {
    console.error('加载留言失败:', error)
  } finally {
    loading.value = false
  }
}

function goToNew() {
  router.push('/admin/new')
}

function getMoodInfo(tag: string) {
  return MOOD_TAGS[tag as keyof typeof MOOD_TAGS] || MOOD_TAGS.miss
}
</script>

<template>
  <div class="admin">
    <van-nav-bar title="管理后台" />

    <div class="admin-header">
      <van-button type="primary" size="large" round block @click="goToNew">
        + 发布新留言
      </van-button>
    </div>

    <div class="admin-content">
      <van-tabs>
        <van-tab title="已发布" :badge="messages.length">
          <div class="message-list">
            <div
              v-for="message in messages"
              :key="message.id"
              class="admin-message-card"
            >
              <div class="card-header">
                <span class="mood-tag" :style="{ color: getMoodInfo(message.mood_tag).color }">
                  {{ getMoodInfo(message.mood_tag).emoji }} {{ getMoodInfo(message.mood_tag).label }}
                </span>
                <span v-if="message.is_read" class="read-status">✓ 已读</span>
                <span v-else class="read-status unread">未读</span>
              </div>

              <div class="card-content">
                <p class="message-text">{{ message.content }}</p>
              </div>

              <div class="card-footer">
                <span class="time">{{ formatDateTime(message.publish_at) }}</span>
                <span class="likes">❤️ {{ message.likes_count }}</span>
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="待发布" :badge="0">
          <van-empty description="暂无待发布留言" />
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  background: var(--bg-color);
}

.admin-header {
  padding: 16px;
  background: white;
}

.admin-content {
  padding: 16px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

.admin-message-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow);
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

.read-status {
  font-size: 12px;
  color: var(--success-color);
}

.read-status.unread {
  color: var(--text-light);
}

.card-content {
  margin-bottom: 12px;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.likes {
  color: var(--primary-color);
}
</style>
