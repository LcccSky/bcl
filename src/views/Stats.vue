<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi, anniversaryApi } from '@/utils/supabase'
import { showToast, showConfirmDialog } from 'vant'
import type { Anniversary } from '@/types'
import { ANNIVERSARY_TYPES } from '@/types'

const router = useRouter()
const totalMessages = ref(0)
const loading = ref(false)
const anniversaries = ref<Anniversary[]>([])
const showAddDialog = ref(false)
const newAnniversary = ref({
  title: '',
  date: '',
  type: 'custom' as const,
  description: '',
  is_recurring: false
})

// 在一起的日期：2026年3月3日
const togetherDate = new Date('2026-03-03')

// 计算在一起的天数
const daysTogether = computed(() => {
  const now = new Date()
  const diff = now.getTime() - togetherDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

// 计算距离下一个纪念日的天数
function getDaysUntil(dateStr: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

onMounted(async () => {
  await loadStats()
  await loadAnniversaries()
})

async function loadStats() {
  loading.value = true
  try {
    const messages = await messageApi.getPublishedMessages()
    totalMessages.value = messages.length
  } catch (error) {
    console.error('加载统计失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadAnniversaries() {
  try {
    anniversaries.value = await anniversaryApi.getAnniversaries()
  } catch (error) {
    console.error('加载纪念日失败:', error)
  }
}

async function addAnniversary() {
  if (!newAnniversary.value.title.trim()) {
    showToast('请输入纪念日名称')
    return
  }
  if (!newAnniversary.value.date) {
    showToast('请选择日期')
    return
  }

  try {
    await anniversaryApi.createAnniversary(newAnniversary.value)
    showToast('添加成功！')
    showAddDialog.value = false
    newAnniversary.value = {
      title: '',
      date: '',
      type: 'custom',
      description: '',
      is_recurring: false
    }
    await loadAnniversaries()
  } catch (error) {
    console.error('添加纪念日失败:', error)
    showToast('添加失败')
  }
}

async function deleteAnniversary(id: string) {
  const result = await showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这个纪念日吗？'
  })

  if (result === 'confirm') {
    try {
      await anniversaryApi.deleteAnniversary(id)
      showToast('删除成功')
      await loadAnniversaries()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败')
    }
  }
}

function getAnniversaryInfo(type: string) {
  return ANNIVERSARY_TYPES[type as keyof typeof ANNIVERSARY_TYPES] || ANNIVERSARY_TYPES.custom
}

function goBack() {
  router.back()
}

function goToCheckIn() {
  router.push('/checkin')
}

const showDatePicker = ref(false)

function onDateConfirm(date: Date) {
  newAnniversary.value.date = date.toISOString().split('T')[0]
  showDatePicker.value = false
}
</script>

<template>
  <div class="stats">
    <van-nav-bar
      title="我们的故事"
      left-arrow
      @click-left="goBack"
    />

    <div class="stats-content">
      <div class="stat-card">
        <div class="stat-icon">💌</div>
        <div class="stat-value">{{ totalMessages }}</div>
        <div class="stat-label">收到留言</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ daysTogether }}</div>
        <div class="stat-label">在一起</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">❤️</div>
        <div class="stat-value">{{ totalMessages }}</div>
        <div class="stat-label">总留言数</div>
      </div>

      <div class="stat-card clickable" @click="goToCheckIn">
        <div class="stat-icon">✅</div>
        <div class="stat-value">打卡</div>
        <div class="stat-label">每日打卡</div>
      </div>
    </div>

    <!-- 纪念日列表 -->
    <div class="anniversaries-section">
      <div class="section-header">
        <h3>重要纪念日</h3>
        <van-button size="small" type="primary" plain @click="showAddDialog = true">
          添加
        </van-button>
      </div>

      <div v-if="anniversaries.length > 0" class="anniversary-list">
        <div v-for="anniversary in anniversaries" :key="anniversary.id" class="anniversary-card">
          <div class="anniversary-icon">
            {{ getAnniversaryInfo(anniversary.type).emoji }}
          </div>
          <div class="anniversary-content">
            <div class="anniversary-title">{{ anniversary.title }}</div>
            <div class="anniversary-date">{{ anniversary.date }}</div>
            <div v-if="anniversary.description" class="anniversary-desc">
              {{ anniversary.description }}
            </div>
            <div class="anniversary-countdown">
              <span v-if="getDaysUntil(anniversary.date) === 0" class="today-badge">今天！</span>
              <span v-else-if="getDaysUntil(anniversary.date) > 0">
                还有 {{ getDaysUntil(anniversary.date) }} 天
              </span>
              <span v-else class="passed-badge">已过去</span>
            </div>
          </div>
          <van-button
            size="mini"
            type="danger"
            plain
            @click="deleteAnniversary(anniversary.id)"
          >
            删除
          </van-button>
        </div>
      </div>

      <van-empty v-else description="还没有添加纪念日" />
    </div>

    <div class="love-quote">
      <p>"每一条留言，都是我对你的思念"</p>
    </div>

    <!-- 添加纪念日对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="添加纪念日"
      show-cancel-button
      @confirm="addAnniversary"
    >
      <div class="add-anniversary-form">
        <van-field
          v-model="newAnniversary.title"
          label="名称"
          placeholder="例如：第一次约会"
          maxlength="30"
        />
        <van-field
          v-model="newAnniversary.date"
          label="日期"
          placeholder="选择日期"
          readonly
          @click="showDatePicker = true"
        />
        <van-field
          v-model="newAnniversary.description"
          label="描述"
          type="textarea"
          placeholder="添加一些描述（可选）"
          maxlength="100"
          rows="2"
        />
        <van-field name="type" label="类型">
          <template #input>
            <van-radio-group v-model="newAnniversary.type" direction="horizontal">
              <van-radio
                v-for="(info, key) in ANNIVERSARY_TYPES"
                :key="key"
                :name="key"
              >
                {{ info.emoji }} {{ info.label }}
              </van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field name="recurring" label="每年重复">
          <template #input>
            <van-switch v-model="newAnniversary.is_recurring" />
          </template>
        </van-field>
      </div>
    </van-dialog>

    <!-- 日期选择器 -->
    <van-calendar
      v-model:show="showDatePicker"
      @confirm="onDateConfirm"
    />

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
.stats {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  padding-bottom: 60px;
}

.stats-content {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: var(--shadow);
  animation: fadeIn 0.5s ease;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
  word-break: break-word;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.love-quote {
  margin: 40px 20px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  text-align: center;
  box-shadow: var(--shadow);
}

.love-quote p {
  font-size: 16px;
  color: var(--text-secondary);
  font-style: italic;
  line-height: 1.8;
}

.anniversaries-section {
  margin: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.anniversary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.anniversary-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
}

.anniversary-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.anniversary-content {
  flex: 1;
  min-width: 0;
}

.anniversary-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.anniversary-date {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.anniversary-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.anniversary-countdown {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 500;
}

.today-badge {
  color: #ff6b9d;
  font-weight: 600;
}

.passed-badge {
  color: #999;
}

.add-anniversary-form {
  padding: 16px 0;
}

:deep(.van-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.van-radio) {
  margin-right: 0;
}
</style>
