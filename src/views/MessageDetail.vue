<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { messageApi, replyApi, petApi } from '@/utils/supabase'
import { useUserStore } from '@/stores/user'
import { usePetStore } from '@/stores/pet'
import { MOOD_TAGS } from '@/types'
import { formatDateTime } from '@/utils/date'
import type { Message, Reply } from '@/types'
import { showToast, showConfirmDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const petStore = usePetStore()
const message = ref<Message | null>(null)
const replies = ref<Reply[]>([])
const loading = ref(false)
const replyContent = ref('')
const submittingReply = ref(false)

const isMyMessage = computed(() => {
  return message.value?.author_name === userStore.nickname
})

onMounted(async () => {
  await loadMessage()
  await loadReplies()
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
      if (message.value) {
        message.value.is_read = true
      }
    }
  } catch (error) {
    console.error('加载留言失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadReplies() {
  try {
    const id = route.params.id as string
    const data = await replyApi.getReplies(id)
    replies.value = data
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

async function submitReply() {
  if (!replyContent.value.trim()) {
    showToast('请输入评论内容')
    return
  }

  submittingReply.value = true
  try {
    const replyData = {
      message_id: route.params.id as string,
      author_name: userStore.nickname,
      content: replyContent.value,
      user_id: userStore.nickname // 暂时用昵称作为 user_id
    }

    await replyApi.createReply(replyData)
    replyContent.value = ''

    // 发表评论奖励：+3 经验
    if (petStore.pet) {
      await petApi.addExp(petStore.pet.id, 3)
      const updatedPet = await petApi.getPet()
      if (updatedPet) {
        petStore.setPet(updatedPet)
      }
    }

    showToast('评论成功，小猫获得了 3 经验！')
    await loadReplies()
  } catch (error) {
    console.error('评论失败:', error)
    showToast('评论失败')
  } finally {
    submittingReply.value = false
  }
}

async function deleteReply(replyId: string) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条评论吗？'
    })
    await replyApi.deleteReply(replyId)
    showToast('删除成功')
    await loadReplies()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      showToast('删除失败')
    }
  }
}

function isMyReply(reply: Reply) {
  return reply.author_name === userStore.nickname
}

async function handleLike() {
  if (!message.value) return

  try {
    await messageApi.likeMessage(message.value.id)
    message.value.likes_count++

    // 点赞奖励：+5 经验
    if (petStore.pet) {
      await petApi.addExp(petStore.pet.id, 5)
      const updatedPet = await petApi.getPet()
      if (updatedPet) {
        petStore.setPet(updatedPet)
      }
    }

    showToast({
      message: '❤️ 小猫获得了 5 经验！',
      duration: 1500
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

function goToEdit() {
  if (!message.value) return
  router.push(`/admin/edit/${message.value.id}`)
}

async function handleDelete() {
  if (!message.value) return

  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条留言吗？'
    })
    await messageApi.deleteMessage(message.value.id)
    showToast('删除成功')
    router.push('/messages')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      showToast('删除失败')
    }
  }
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
        <span v-if="message.author_name" class="author">· {{ message.author_name }}</span>
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

        <div v-if="isMyMessage" class="my-actions">
          <van-button
            type="primary"
            plain
            round
            block
            size="large"
            @click="goToEdit"
          >
            编辑留言
          </van-button>
          <van-button
            type="danger"
            plain
            round
            block
            size="large"
            @click="handleDelete"
          >
            删除留言
          </van-button>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>评论 ({{ replies.length }})</h3>
        </div>

        <div class="comments-list">
          <div v-if="replies.length === 0" class="no-comments">
            还没有评论，快来抢沙发吧~
          </div>
          <div v-else>
            <div
              v-for="reply in replies"
              :key="reply.id"
              class="comment-item"
            >
              <div class="comment-header">
                <span class="comment-author">{{ reply.author_name || '匿名' }}</span>
                <span class="comment-time">{{ formatDateTime(reply.created_at) }}</span>
              </div>
              <div class="comment-content">{{ reply.content }}</div>
              <div v-if="isMyReply(reply)" class="comment-actions">
                <van-button size="mini" type="danger" plain @click="deleteReply(reply.id)">
                  删除
                </van-button>
              </div>
            </div>
          </div>
        </div>

        <div class="comment-input">
          <van-field
            v-model="replyContent"
            rows="2"
            autosize
            type="textarea"
            maxlength="200"
            placeholder="写下你的评论..."
            show-word-limit
          />
          <van-button
            type="primary"
            size="small"
            :loading="submittingReply"
            @click="submitReply"
          >
            发送
          </van-button>
        </div>
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

.author {
  color: var(--primary-color);
  font-weight: 500;
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

.my-actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comments-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.comments-header h3 {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.comments-list {
  margin-bottom: 16px;
}

.no-comments {
  text-align: center;
  color: var(--text-secondary);
  padding: 24px 0;
  font-size: 14px;
}

.comment-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.comment-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.comment-actions {
  text-align: right;
}

.comment-input {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: white;
  padding: 12px;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.comment-input .van-field {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-input .van-button {
  flex-shrink: 0;
}
</style>
