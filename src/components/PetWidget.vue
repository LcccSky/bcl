<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePetStore } from '@/stores/pet'
import { petApi } from '@/utils/supabase'
import { showToast, showDialog } from 'vant'

const petStore = usePetStore()
const showPetDialog = ref(false)
const petName = ref('')
const feeding = ref(false)
const playing = ref(false)

const petEmoji = computed(() => {
  if (!petStore.pet) return '🐱'
  const level = petStore.pet.level
  if (level >= 10) return '😺' // 成年猫
  if (level >= 5) return '😸' // 少年猫
  return '🐱' // 幼年猫
})

const hungerStatus = computed(() => {
  if (!petStore.pet) return { text: '', color: '' }
  const hunger = petStore.pet.hunger
  if (hunger >= 70) return { text: '饱饱的', color: '#4caf50' }
  if (hunger >= 40) return { text: '有点饿', color: '#ff9800' }
  return { text: '很饿了', color: '#f44336' }
})

const happinessStatus = computed(() => {
  if (!petStore.pet) return { text: '', color: '' }
  const happiness = petStore.pet.happiness
  if (happiness >= 70) return { text: '开心', color: '#4caf50' }
  if (happiness >= 40) return { text: '一般', color: '#ff9800' }
  return { text: '不开心', color: '#f44336' }
})

onMounted(async () => {
  await loadPet()
})

async function loadPet() {
  try {
    let pet = await petApi.getPet()

    if (!pet) {
      // 第一次使用，创建宠物
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
      }).then(() => {
        // 用户确认后的回调
      })
    } else {
      // 更新宠物状态（自动衰减）
      pet = await petApi.updatePetStatus(pet.id)
      petStore.setPet(pet)
    }
  } catch (error) {
    console.error('加载宠物失败:', error)
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

function openPetDialog() {
  showPetDialog.value = true
}
</script>

<template>
  <div class="pet-widget">
    <div v-if="petStore.pet" class="pet-card" @click="openPetDialog">
      <div class="pet-avatar">{{ petEmoji }}</div>
      <div class="pet-info">
        <div class="pet-name">{{ petStore.pet.name }}</div>
        <div class="pet-level">Lv.{{ petStore.pet.level }}</div>
      </div>
    </div>

    <!-- 宠物详情弹窗 -->
    <van-popup v-model:show="showPetDialog" round position="bottom" :style="{ padding: '20px' }">
      <div class="pet-detail">
        <div class="pet-header">
          <div class="pet-avatar-large">{{ petEmoji }}</div>
          <div class="pet-title">
            <h2>{{ petStore.pet?.name }}</h2>
            <p>等级 {{ petStore.pet?.level }} · 经验 {{ petStore.pet?.exp }}/{{ (petStore.pet?.level || 1) * 100 }}</p>
          </div>
        </div>

        <div class="pet-stats">
          <div class="stat-item">
            <div class="stat-label">饥饿值</div>
            <van-progress
              :percentage="petStore.pet?.hunger || 0"
              :color="hungerStatus.color"
              :show-pivot="false"
            />
            <div class="stat-value" :style="{ color: hungerStatus.color }">
              {{ petStore.pet?.hunger }}/100 · {{ hungerStatus.text }}
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-label">心情值</div>
            <van-progress
              :percentage="petStore.pet?.happiness || 0"
              :color="happinessStatus.color"
              :show-pivot="false"
            />
            <div class="stat-value" :style="{ color: happinessStatus.color }">
              {{ petStore.pet?.happiness }}/100 · {{ happinessStatus.text }}
            </div>
          </div>
        </div>

        <div class="pet-actions">
          <van-button
            type="primary"
            size="large"
            block
            :loading="feeding"
            @click="feedPet"
          >
            🍖 喂食
          </van-button>
          <van-button
            type="success"
            size="large"
            block
            :loading="playing"
            @click="playWithPet"
          >
            🎾 玩耍
          </van-button>
        </div>

        <div class="pet-tips">
          <p>💡 发布留言 +10 经验</p>
          <p>💡 收到点赞 +5 经验</p>
          <p>💡 发表评论 +3 经验</p>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.pet-widget {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 999;
}

.pet-card {
  background: white;
  border-radius: 50px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 107, 157, 0.1);
}

.pet-card:active {
  transform: scale(0.95);
}

.pet-avatar {
  font-size: 32px;
  line-height: 1;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.pet-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pet-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.pet-level {
  font-size: 12px;
  color: #999;
}

.pet-detail {
  padding: 20px 0;
}

.pet-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.pet-avatar-large {
  font-size: 64px;
  line-height: 1;
}

.pet-title h2 {
  font-size: 24px;
  color: var(--primary-color);
  margin: 0 0 4px 0;
}

.pet-title p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.pet-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.stat-value {
  font-size: 12px;
  font-weight: 500;
}

.pet-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.pet-tips {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
}

.pet-tips p {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}
</style>
