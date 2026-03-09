<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { timeCapsuleApi } from '@/utils/supabase'
import { showToast, showConfirmDialog } from 'vant'
import type { TimeCapsule } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const capsules = ref<TimeCapsule[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const selectedCapsule = ref<TimeCapsule | null>(null)

const newCapsule = ref({
  title: '',
  content: '',
  unlock_date: ''
})

const showDatePicker = ref(false)
const minDate = new Date()

// 未解锁的胶囊
const lockedCapsules = computed(() =>
  capsules.value.filter(c => !c.is_unlocked)
)

// 已解锁的胶囊
const unlockedCapsules = computed(() =>
  capsules.value.filter(c => c.is_unlocked)
)

onMounted(async () => {
  await loadCapsules()
})

async function loadCapsules() {
  loading.value = true
  try {
    capsules.value = await timeCapsuleApi.getTimeCapsules()
  } catch (error) {
    console.error('加载时光胶囊失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function createCapsule() {
  if (!newCapsule.value.title.trim()) {
    showToast('请输入标题')
    return
  }
  if (!newCapsule.value.content.trim()) {
    showToast('请输入内容')
    return
  }
  if (!newCapsule.value.unlock_date) {
    showToast('请选择解锁日期')
    return
  }

  try {
    await timeCapsuleApi.createTimeCapsule({
      ...newCapsule.value,
      created_by: userStore.nickname
    })
    showToast('时光胶囊创建成功！🎉')
    showCreateDialog.value = false
    newCapsule.value = {
      title: '',
      content: '',
      unlock_date: ''
    }
    await loadCapsules()
  } catch (error) {
    console.error('创建失败:', error)
    showToast('创建失败')
  }
}

function onDateConfirm(date: Date) {
  newCapsule.value.unlock_date = date.toISOString().split('T')[0] || ''
  showDatePicker.value = false
}

function canUnlock(capsule: TimeCapsule): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const unlockDate = new Date(capsule.unlock_date)
  unlockDate.setHours(0, 0, 0, 0)
  return unlockDate <= today && !capsule.is_unlocked
}

function getDaysUntilUnlock(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

async function openCapsule(capsule: TimeCapsule) {
  if (!canUnlock(capsule)) {
    const days = getDaysUntilUnlock(capsule.unlock_date)
    showToast(`还需要等待 ${days} 天才能解锁哦~`)
    return
  }

  try {
    const unlocked = await timeCapsuleApi.unlockTimeCapsule(capsule.id)
    selectedCapsule.value = unlocked
    showDetailDialog.value = true
    await loadCapsules()
  } catch (error) {
    console.error('解锁失败:', error)
    showToast('解锁失败')
  }
}

function viewCapsule(capsule: TimeCapsule) {
  if (!capsule.is_unlocked) {
    showToast('时光胶囊还未解锁')
    return
  }
  selectedCapsule.value = capsule
  showDetailDialog.value = true
}

async function deleteCapsule(capsule: TimeCapsule) {
  const result = await showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这个时光胶囊吗？'
  })

  if (result === 'confirm') {
    try {
      await timeCapsuleApi.deleteTimeCapsule(capsule.id)
      showToast('删除成功')
      await loadCapsules()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败')
    }
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="time-capsule">
    <van-nav-bar
      title="时光胶囊"
      left-arrow
      @click-left="goBack"
    >
      <template #right>
        <van-button size="small" type="primary" @click="showCreateDialog = true">
          创建
        </van-button>
      </template>
    </van-nav-bar>

    <div class="capsule-content">
      <!-- 未解锁的胶囊 -->
      <div v-if="lockedCapsules.length > 0" class="capsule-section">
        <div class="section-title">🔒 等待解锁</div>
        <div class="capsule-list">
          <div
            v-for="capsule in lockedCapsules"
            :key="capsule.id"
            class="capsule-card locked"
            @click="openCapsule(capsule)"
          >
            <div class="capsule-icon">📦</div>
            <div class="capsule-info">
              <div class="capsule-title">{{ capsule.title }}</div>
              <div class="capsule-date">
                解锁日期：{{ capsule.unlock_date }}
              </div>
              <div class="capsule-countdown">
                <span v-if="canUnlock(capsule)" class="can-unlock">可以解锁了！</span>
                <span v-else>还需 {{ getDaysUntilUnlock(capsule.unlock_date) }} 天</span>
              </div>
            </div>
            <van-button
              size="mini"
              type="danger"
              plain
              @click.stop="deleteCapsule(capsule)"
            >
              删除
            </van-button>
          </div>
        </div>
      </div>

      <!-- 已解锁的胶囊 -->
      <div v-if="unlockedCapsules.length > 0" class="capsule-section">
        <div class="section-title">🎁 已解锁</div>
        <div class="capsule-list">
          <div
            v-for="capsule in unlockedCapsules"
            :key="capsule.id"
            class="capsule-card unlocked"
            @click="viewCapsule(capsule)"
          >
            <div class="capsule-icon">🎉</div>
            <div class="capsule-info">
              <div class="capsule-title">{{ capsule.title }}</div>
              <div class="capsule-date">
                解锁于：{{ capsule.unlocked_at?.split('T')[0] }}
              </div>
            </div>
            <van-icon name="arrow" />
          </div>
        </div>
      </div>

      <van-empty v-if="capsules.length === 0" description="还没有时光胶囊，创建一个吧！" />
    </div>

    <!-- 创建时光胶囊对话框 -->
    <van-dialog
      v-model:show="showCreateDialog"
      title="创建时光胶囊"
      show-cancel-button
      @confirm="createCapsule"
    >
      <div class="create-form">
        <van-field
          v-model="newCapsule.title"
          label="标题"
          placeholder="给时光胶囊起个名字"
          maxlength="30"
        />
        <van-field
          v-model="newCapsule.content"
          label="内容"
          type="textarea"
          placeholder="写下想对未来说的话..."
          maxlength="500"
          rows="4"
          show-word-limit
        />
        <van-field
          v-model="newCapsule.unlock_date"
          label="解锁日期"
          placeholder="选择解锁日期"
          readonly
          @click="showDatePicker = true"
        />
      </div>
    </van-dialog>

    <!-- 日期选择器 -->
    <van-calendar
      v-model:show="showDatePicker"
      :min-date="minDate"
      @confirm="onDateConfirm"
    />

    <!-- 查看时光胶囊对话框 -->
    <van-dialog
      v-model:show="showDetailDialog"
      :title="selectedCapsule?.title"
      confirm-button-text="关闭"
    >
      <div v-if="selectedCapsule" class="capsule-detail">
        <div class="detail-content">{{ selectedCapsule.content }}</div>
        <div class="detail-footer">
          <div class="detail-author">来自：{{ selectedCapsule.created_by }}</div>
          <div class="detail-date">创建于：{{ selectedCapsule.created_at.split('T')[0] }}</div>
        </div>
      </div>
    </van-dialog>

    <!-- 底部导航栏 -->
    <van-tabbar route>
      <van-tabbar-item to="/messages" icon="chat-o">留言</van-tabbar-item>
      <van-tabbar-item to="/pet" icon="smile-o">猫猫</van-tabbar-item>
      <van-tabbar-item to="/wish" icon="star-o">愿望</van-tabbar-item>
      <van-tabbar-item to="/stats" icon="bar-chart-o">故事</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.time-capsule {
  min-height: 100vh;
  background: var(--background-gradient);
  padding-bottom: 60px;
}

.capsule-content {
  padding: 20px;
}

.capsule-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.capsule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.capsule-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.capsule-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.capsule-card.locked {
  border: 2px dashed #ddd;
}

.capsule-card.unlocked {
  border: 2px solid var(--primary-color);
}

.capsule-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.capsule-info {
  flex: 1;
  min-width: 0;
}

.capsule-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.capsule-date {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.capsule-countdown {
  font-size: 13px;
  color: #666;
}

.can-unlock {
  color: var(--primary-color);
  font-weight: 600;
}

.create-form {
  padding: 16px 0;
}

.capsule-detail {
  padding: 20px;
}

.detail-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.detail-footer {
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.detail-author,
.detail-date {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}
</style>
