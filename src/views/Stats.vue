<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const totalMessages = ref(128)
const daysTogether = ref(365)
const consecutiveDays = ref(30)
const monthlyMessages = ref(24)

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
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ consecutiveDays }}</div>
        <div class="stat-label">连续收到</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">❤️</div>
        <div class="stat-value">{{ monthlyMessages }}</div>
        <div class="stat-label">本月留言</div>
      </div>
    </div>

    <div class="love-quote">
      <p>"每一条留言，都是我对你的思念"</p>
    </div>
  </div>
</template>

<style scoped>
.stats {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
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
  font-size: 32px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
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
