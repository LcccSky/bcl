<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { messageApi } from '@/utils/supabase'
import { MOOD_TAGS } from '@/types'
import { formatDateTime } from '@/utils/date'
import type { Message } from '@/types'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const message = ref<Message | null>(null)
const loading = ref(false)

onMounted(async () => {
  await loadMessage()
})

async function loadMessage() {
  loading.value = true
  try {
    const id = route.params.id as string
    const data = await messageApi.getMessage(id)
    message.value = data

    // 标记为已读
    if (!data.is_read) {
      await messageApi.markAsRead(id)
      message.value.is_read = true
    }
  } catch (error) {
    console.error('加载留言失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function handleLike() {
  if (!message.value) return

  try {
    await messageApi.likeMessage(message.value.id)
    message.value.likes_count++
    showToast({
      message: '❤️',
      duration: 1000
    })
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

function getMoodInfo(tag: string) {
  return MOOD_TAGS[tag as keyof typeof MOOD_TAGS] || MOOD_TAGS.miss
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="message-detail">
    <van-nav-bar
      title="留言详情"
      left-arrow
      @click-left="goBack"
    />

    <van-loading v-if="loading" class="loading" />

    <div v-else-if="message" class="detail-content">
      <div class="mood-header">
        <span class="mood-tag" :style="{ color: getMoodInfo(message.mood_tag).color }">
          {{ getMoodInfo(message.mood_tag).emoji }} {{ getMoodInfo(message.mood_tag).label }}
        </span>
      </div>

      <div class="message-body">
        <p class="message-text">{{ message.content }}</p>

        <img v-if="message.image_url" :src="message.image_url" class="message-image" />
      </div>

      <div class="message-meta">
        <span class="time">{{ formatDateTime(message.publish_at) }}</span>
      </div>

      <div class="actions">
        <van-button
          type="primary"
          round
          block
          size="large"
          @click="handleLike"
        >
          ❤️ 点个爱心 ({{ message.likes_count }})
        </van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.detail-content {
  padding: 20px;
}

.mood-header {
  text-align: center;
  margin-bottom: 24px;
}

.mood-tag {
  font-size: 18px;
  font-weight: 600;
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  display: inline-block;
  box-shadow: var(--shadow);
}

.message-body {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
  animation: fadeIn 0.5s ease;
}

.message-text {
  font-size: 18px;
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 16px;
}

.message-image {
  width: 100%;
  border-radius: 12px;
  margin-top: 16px;
}

.message-meta {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

.actions {
  margin-top: 32px;
}

.actions .van-button {
  font-size: 16px;
  height: 50px;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  border: none;
}
</style>
