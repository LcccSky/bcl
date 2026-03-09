<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '@/utils/supabase'

const router = useRouter()
const totalMessages = ref(0)
const loading = ref(false)

// 在一起的日期：2026年3月3日
const togetherDate = new Date('2026-03-03')

// 计算在一起的天数
const daysTogether = computed(() => {
  const now = new Date()
  const diff = now.getTime() - togetherDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

// 计算本月留言数
const monthlyMessages = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // 这里需要从实际数据中筛选本月的留言
  // 暂时返回 0，等加载数据后更新
  return 0
})

onMounted(async () => {
  await loadStats()
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

function goBack() {
  router.back()
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

      <div class="stat-card">
        <div class="stat-icon">🎉</div>
        <div class="stat-value">2026.3.3</div>
        <div class="stat-label">在一起的日子</div>
      </div>
    </div>

    <div class="love-quote">
      <p>"每一条留言，都是我对你的思念"</p>
    </div>

    <!-- 底部导航栏 -->
    <van-tabbar route>
      <van-tabbar-item to="/messages" icon="chat-o">留言</van-tabbar-item>
      <van-tabbar-item to="/pet" icon="smile-o">猫猫</van-tabbar-item>
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
</style>
