<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePetStore } from '@/stores/pet'
import { useUserStore } from '@/stores/user'
import { petApi } from '@/utils/supabase'
import { showToast, showDialog } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()
const petStore = usePetStore()
const userStore = useUserStore()
const petName = ref('')
const feeding = ref(false)
const playing = ref(false)
const loading = ref(false)

const petEmoji = computed(() => {
  if (!petStore.pet) return '🐱'
  const level = petStore.pet.level
  if (level >= 10) return '😺'
  if (level >= 5) return '😸'
  return '🐱'
})

const hungerStatus = computed(() => {
  if (!petStore.pet) return { text: '', color: '', bgColor: '' }
  const hunger = petStore.pet.hunger
  if (hunger >= 70) return { text: '饱饱的', color: '#4caf50', bgColor: '#e8f5e9' }
  if (hunger >= 40) return { text: '有点饿', color: '#ff9800', bgColor: '#fff3e0' }
  return { text: '很饿了', color: '#f44336', bgColor: '#ffebee' }
})

const happinessStatus = computed(() => {
  if (!petStore.pet) return { text: '', color: '', bgColor: '' }
  const happiness = petStore.pet.happiness
  if (happiness >= 70) return { text: '开心', color: '#4caf50', bgColor: '#e8f5e9' }
  if (happiness >= 40) return { text: '一般', color: '#ff9800', bgColor: '#fff3e0' }
  return { text: '不开心', color: '#f44336', bgColor: '#ffebee' }
})

const expProgress = computed(() => {
  if (!petStore.pet) return 0
  const currentLevelExp = (petStore.pet.level - 1) * 100
  const nextLevelExp = petStore.pet.level * 100
  const progress = ((petStore.pet.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100
  return Math.min(100, Math.max(0, progress))
})

onMounted(async () => {
  await loadPet()
})

async function loadPet() {
  if (!userStore.nickname) {
    showToast('请先设置昵称')
    router.push('/messages')
    return
  }

  loading.value = true
  try {
    let pet = await petApi.getPet()

    if (!pet) {
      showDialog({
        title: '欢迎！',
        message: '给你们的小猫起个名字吧~',
        showCancelButton: false,
        beforeClose: async (action) => {
          if (action === 'confirm' && petName.value.trim()) {
            pet = await petApi.createPet({ name: petName.value })
            petStore.setPet(pet)
            showToast('小猫诞生了！')
            return true
          }
          return false
        }
      })
    } else {
      pet = await petApi.updatePetStatus(pet.id)
      petStore.setPet(pet)
    }
  } catch (error) {
    console.error('加载宠物失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function feedPet() {
  if (!petStore.pet) return

  feeding.value = true
  try {
    const pet = await petApi.feedPet(petStore.pet.id)
    petStore.setPet(pet)
    showToast('喂食成功！🍖')
  } catch (error) {
    console.error('喂食失败:', error)
    showToast('喂食失败')
  } finally {
    feeding.value = false
  }
}

async function playWithPet() {
  if (!petStore.pet) return

  playing.value = true
  try {
    const pet = await petApi.playWithPet(petStore.pet.id)
    petStore.setPet(pet)
    showToast('玩耍成功！🎾')
  } catch (error) {
    console.error('玩耍失败:', error)
    showToast('玩耍失败')
  } finally {
    playing.value = false
  }
}
</script>

<template>
  <div class="pet-page">
    <van-nav-bar title="我的猫猫" fixed placeholder />

    <div v-if="loading" class="loading-container">
      <van-loading size="24px">加载中...</van-loading>
    </div>

    <div v-else-if="petStore.pet" class="pet-container">
      <!-- 宠物展示区 -->
      <div class="pet-display">
        <div class="pet-avatar-large">{{ petEmoji }}</div>
        <h2 class="pet-name">{{ petStore.pet.name }}</h2>
        <div class="pet-level">等级 {{ petStore.pet.level }}</div>
      </div>

      <!-- 经验条 -->
      <div class="exp-section">
        <div class="exp-label">
          <span>经验值</span>
          <span>{{ petStore.pet.exp }}/{{ petStore.pet.level * 100 }}</span>
        </div>
        <van-progress
          :percentage="expProgress"
          stroke-width="12"
          color="linear-gradient(to right, #ff6b9d, #ff8fab)"
          :show-pivot="false"
        />
      </div>

      <!-- 状态区 -->
      <div class="stats-section">
        <div class="stat-card" :style="{ backgroundColor: hungerStatus.bgColor }">
          <div class="stat-icon">🍖</div>
          <div class="stat-info">
            <div class="stat-label">饥饿值</div>
            <div class="stat-value" :style="{ color: hungerStatus.color }">
              {{ petStore.pet.hunger }}/100
            </div>
            <div class="stat-status" :style="{ color: hungerStatus.color }">
              {{ hungerStatus.text }}
            </div>
          </div>
          <van-progress
            :percentage="petStore.pet.hunger"
            :color="hungerStatus.color"
            :show-pivot="false"
            stroke-width="8"
          />
        </div>

        <div class="stat-card" :style="{ backgroundColor: happinessStatus.bgColor }">
          <div class="stat-icon">❤️</div>
          <div class="stat-info">
            <div class="stat-label">心情值</div>
            <div class="stat-value" :style="{ color: happinessStatus.color }">
              {{ petStore.pet.happiness }}/100
            </div>
            <div class="stat-status" :style="{ color: happinessStatus.color }">
              {{ happinessStatus.text }}
            </div>
          </div>
          <van-progress
            :percentage="petStore.pet.happiness"
            :color="happinessStatus.color"
            :show-pivot="false"
            stroke-width="8"
          />
        </div>
      </div>

      <!-- 互动按钮 -->
      <div class="action-section">
        <van-button
          type="primary"
          size="large"
          block
          round
          :loading="feeding"
          @click="feedPet"
          class="action-button feed-button"
        >
          <span class="button-icon">🍖</span>
          <span>喂食</span>
        </van-button>

        <van-button
          type="success"
          size="large"
          block
          round
          :loading="playing"
          @click="playWithPet"
          class="action-button play-button"
        >
          <span class="button-icon">🎾</span>
          <span>玩耍</span>
        </van-button>
      </div>

      <!-- 提示区 -->
      <div class="tips-section">
        <div class="tips-title">💡 如何获得经验</div>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-icon">📝</span>
            <span>发布留言 +10 经验</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">❤️</span>
            <span>收到点赞 +5 经验</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">💬</span>
            <span>发表评论 +3 经验</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-container">
      <van-empty description="还没有小猫哦" />
    </div>
  </div>
</template>

<style scoped>
.pet-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  padding-bottom: 60px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.pet-container {
  padding: 20px;
}

.pet-display {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.1);
}

.pet-avatar-large {
  font-size: 120px;
  line-height: 1;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.pet-name {
  font-size: 28px;
  color: var(--primary-color);
  margin: 0 0 8px 0;
  font-weight: 700;
}

.pet-level {
  font-size: 16px;
  color: #999;
  font-weight: 500;
}

.exp-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.1);
}

.exp-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.1);
  transition: all 0.3s ease;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.stat-info {
  margin-bottom: 12px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-status {
  font-size: 14px;
  font-weight: 500;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-button {
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.button-icon {
  font-size: 24px;
}

.feed-button {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  border: none;
}

.play-button {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  border: none;
}

.tips-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.1);
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #666;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
}

.tip-icon {
  font-size: 20px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}
</style>
