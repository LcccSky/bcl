<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePetStore } from '@/stores/pet'
import { useUserStore } from '@/stores/user'
import { petApi } from '@/utils/supabase'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()
const petStore = usePetStore()
const userStore = useUserStore()
const petName = ref('')
const feeding = ref(false)
const playing = ref(false)
const loading = ref(false)
const showPetNameDialog = ref(false)
const petAnimation = ref('idle') // idle, happy, eating, playing, sad

const petEmoji = computed(() => {
  if (!petStore.pet) return '🐱'

  // 根据动画状态显示不同表情
  if (petAnimation.value === 'eating') return '😋'
  if (petAnimation.value === 'playing') return '😸'
  if (petAnimation.value === 'happy') return '😻'
  if (petAnimation.value === 'sad') return '😿'

  // 根据等级显示不同猫咪
  const level = petStore.pet.level

  // 根据心情显示表情
  if (petStore.pet.happiness < 30) return '😿'
  if (petStore.pet.hunger < 30) return '😾'

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
      showPetNameDialog.value = true
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

async function confirmPetName() {
  if (!petName.value.trim()) {
    showToast('请输入小猫的名字')
    return
  }

  try {
    const pet = await petApi.createPet({ name: petName.value })
    petStore.setPet(pet)
    showPetNameDialog.value = false
    showToast('小猫诞生了！')
  } catch (error) {
    console.error('创建宠物失败:', error)
    showToast('创建失败')
  }
}

async function feedPet() {
  if (!petStore.pet) return

  feeding.value = true
  petAnimation.value = 'eating'
  try {
    const pet = await petApi.feedPet(petStore.pet.id)
    petStore.setPet(pet)
    showToast('喂食成功！🍖')

    // 动画效果
    setTimeout(() => {
      petAnimation.value = 'happy'
      setTimeout(() => {
        petAnimation.value = 'idle'
      }, 2000)
    }, 1500)
  } catch (error) {
    console.error('喂食失败:', error)
    showToast('喂食失败')
    petAnimation.value = 'idle'
  } finally {
    feeding.value = false
  }
}

async function playWithPet() {
  if (!petStore.pet) return

  playing.value = true
  petAnimation.value = 'playing'
  try {
    const pet = await petApi.playWithPet(petStore.pet.id)
    petStore.setPet(pet)
    showToast('玩耍成功！🎾')

    // 动画效果
    setTimeout(() => {
      petAnimation.value = 'happy'
      setTimeout(() => {
        petAnimation.value = 'idle'
      }, 2000)
    }, 1500)
  } catch (error) {
    console.error('玩耍失败:', error)
    showToast('玩耍失败')
    petAnimation.value = 'idle'
  } finally {
    playing.value = false
  }
}

// 点击小猫互动
function petCat() {
  if (!petStore.pet) return

  petAnimation.value = 'happy'
  showToast('喵~ 😻')

  setTimeout(() => {
    petAnimation.value = 'idle'
  }, 2000)
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
        <div
          class="pet-avatar-large"
          :class="{
            'pet-bounce': petAnimation === 'happy',
            'pet-shake': petAnimation === 'eating',
            'pet-spin': petAnimation === 'playing'
          }"
          @click="petCat"
        >
          {{ petEmoji }}
        </div>
        <h2 class="pet-name">{{ petStore.pet.name }}</h2>
        <div class="pet-level">Lv.{{ petStore.pet.level }}</div>
        <div class="pet-status-text">
          <span v-if="petAnimation === 'eating'">正在吃饭...</span>
          <span v-else-if="petAnimation === 'playing'">正在玩耍...</span>
          <span v-else-if="petAnimation === 'happy'">好开心！</span>
          <span v-else-if="petStore.pet.hunger < 30">肚子好饿...</span>
          <span v-else-if="petStore.pet.happiness < 30">有点无聊...</span>
          <span v-else>心情不错~</span>
        </div>
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
          :disabled="feeding || playing"
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
          :disabled="feeding || playing"
          @click="playWithPet"
          class="action-button play-button"
        >
          <span class="button-icon">🎾</span>
          <span>玩耍</span>
        </van-button>
      </div>

      <!-- 互动提示 -->
      <div class="interaction-tip">
        <span class="tip-icon">💡</span>
        <span>点击小猫可以互动哦~</span>
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

    <!-- 宠物命名对话框 -->
    <van-dialog
      v-model:show="showPetNameDialog"
      title="欢迎！"
      :show-cancel-button="false"
      :close-on-click-overlay="false"
      confirm-button-text="确定"
      @confirm="confirmPetName"
    >
      <div style="padding: 16px">
        <p style="margin-bottom: 12px; color: #666; text-align: center;">给你们的小猫起个名字吧~</p>
        <van-field
          v-model="petName"
          placeholder="输入小猫的名字"
          maxlength="10"
          autofocus
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
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
}

.pet-avatar-large:hover {
  transform: scale(1.1);
}

.pet-avatar-large:active {
  transform: scale(0.95);
}

/* 开心动画 */
.pet-bounce {
  animation: bounce 0.6s ease infinite !important;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 吃饭动画 */
.pet-shake {
  animation: shake 0.5s ease infinite !important;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* 玩耍动画 */
.pet-spin {
  animation: spin 1s ease-in-out infinite !important;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
  100% {
    transform: rotate(0deg);
  }
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

.pet-status-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  font-style: italic;
  min-height: 20px;
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

.interaction-tip {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #fff3f8 0%, #ffe8f0 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--primary-color);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.tip-icon {
  font-size: 18px;
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
