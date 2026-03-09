<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { checkInApi } from '@/utils/supabase'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'
import type { CheckIn } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const todayCheckIns = ref<CheckIn[]>([])
const checkInStreak = ref(0)
const loading = ref(false)
const showMorningDialog = ref(false)
const showNightDialog = ref(false)
const morningMessage = ref('')
const nightMessage = ref('')

const hasMorningCheckIn = computed(() =>
  todayCheckIns.value.some(c => c.type === 'morning')
)

const hasNightCheckIn = computed(() =>
  todayCheckIns.value.some(c => c.type === 'night')
)

const currentHour = computed(() => new Date().getHours())

const greeting = computed(() => {
  const hour = currentHour.value
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

onMounted(async () => {
  await loadCheckIns()
})

async function loadCheckIns() {
  if (!userStore.userId) {
    showToast('请先设置昵称')
    return
  }

  loading.value = true
  try {
    todayCheckIns.value = await checkInApi.getTodayCheckIn(userStore.userId)
    checkInStreak.value = await checkInApi.getCheckInStreak(userStore.userId)
  } catch (error) {
    console.error('加载打卡记录失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function doMorningCheckIn() {
  if (!userStore.userId) {
    showToast('请先设置昵称')
    return
  }

  try {
    await checkInApi.morningCheckIn(userStore.userId, morningMessage.value)
    showToast('早安打卡成功！☀️')
    showMorningDialog.value = false
    morningMessage.value = ''
    await loadCheckIns()
  } catch (error) {
    console.error('早安打卡失败:', error)
    showToast('打卡失败')
  }
}

async function doNightCheckIn() {
  if (!userStore.userId) {
    showToast('请先设置昵称')
    return
  }

  try {
    await checkInApi.nightCheckIn(userStore.userId, nightMessage.value)
    showToast('晚安打卡成功！🌙')
    showNightDialog.value = false
    nightMessage.value = ''
    await loadCheckIns()
  } catch (error) {
    console.error('晚安打卡失败:', error)
    showToast('打卡失败')
  }
}
</script>

<template>
  <div class="check-in">
    <van-nav-bar title="每日打卡" fixed placeholder />

    <div class="greeting-banner">
      <div class="greeting-text">{{ greeting }}，{{ userStore.nickname || '亲爱的' }}</div>
      <div class="streak-info">
        <span class="streak-icon">🔥</span>
        <span>已连续打卡 {{ checkInStreak }} 天</span>
      </div>
    </div>

    <div class="check-in-container">
      <!-- 早安打卡 -->
      <div class="check-in-card morning">
        <div class="card-icon">☀️</div>
        <div class="card-content">
          <h3 class="card-title">早安打卡</h3>
          <p class="card-desc">开启美好的一天</p>
        </div>
        <div class="card-action">
          <van-button
            v-if="!hasMorningCheckIn"
            type="warning"
            round
            @click="showMorningDialog = true"
          >
            打卡
          </van-button>
          <div v-else class="checked-badge">
            <span class="badge-icon">✓</span>
            <span>已打卡</span>
          </div>
        </div>
      </div>

      <!-- 晚安打卡 -->
      <div class="check-in-card night">
        <div class="card-icon">🌙</div>
        <div class="card-content">
          <h3 class="card-title">晚安打卡</h3>
          <p class="card-desc">结束充实的一天</p>
        </div>
        <div class="card-action">
          <van-button
            v-if="!hasNightCheckIn"
            type="primary"
            round
            @click="showNightDialog = true"
          >
            打卡
          </van-button>
          <div v-else class="checked-badge">
            <span class="badge-icon">✓</span>
            <span>已打卡</span>
          </div>
        </div>
      </div>

      <!-- 打卡统计 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value">{{ checkInStreak }}</div>
            <div class="stat-label">连续天数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <div class="stat-value">{{ todayCheckIns.length }}</div>
            <div class="stat-label">今日打卡</div>
          </div>
        </div>
      </div>

      <!-- 打卡提示 -->
      <div class="tips-card">
        <div class="tips-title">💡 打卡小贴士</div>
        <div class="tips-list">
          <p>• 每天早晚各打卡一次</p>
          <p>• 连续打卡可以获得成就</p>
          <p>• 打卡时可以留下今天的心情</p>
        </div>
      </div>
    </div>

    <!-- 早安打卡对话框 -->
    <van-dialog
      v-model:show="showMorningDialog"
      title="早安打卡 ☀️"
      show-cancel-button
      @confirm="doMorningCheckIn"
    >
      <div class="check-in-form">
        <van-field
          v-model="morningMessage"
          type="textarea"
          placeholder="说点什么吧~（可选）"
          maxlength="100"
          show-word-limit
          rows="3"
        />
      </div>
    </van-dialog>

    <!-- 晚安打卡对话框 -->
    <van-dialog
      v-model:show="showNightDialog"
      title="晚安打卡 🌙"
      show-cancel-button
      @confirm="doNightCheckIn"
    >
      <div class="check-in-form">
        <van-field
          v-model="nightMessage"
          type="textarea"
          placeholder="今天过得怎么样？（可选）"
          maxlength="100"
          show-word-limit
          rows="3"
        />
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
.check-in {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  padding-bottom: 60px;
}

.greeting-banner {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  color: white;
  padding: 24px 20px;
  text-align: center;
}

.greeting-text {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
}

.streak-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
}

.streak-icon {
  font-size: 20px;
  animation: flicker 1.5s ease-in-out infinite;
}

@keyframes flicker {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.check-in-container {
  padding: 20px 16px;
}

.check-in-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  font-size: 48px;
  line-height: 1;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 14px;
  color: #999;
}

.card-action {
  flex-shrink: 0;
}

.checked-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #4caf50;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 20px;
}

.badge-icon {
  font-size: 16px;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.08);
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  text-align: left;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.tips-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.08);
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.tips-list p {
  font-size: 14px;
  color: #666;
  line-height: 2;
}

.check-in-form {
  padding: 16px 0;
}
</style>
