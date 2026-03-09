<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useThemeStore, type ThemeName } from '@/stores/theme'
import { showToast } from 'vant'

const router = useRouter()
const themeStore = useThemeStore()

function selectTheme(themeName: ThemeName) {
  themeStore.setTheme(themeName)
  showToast('主题已切换 ✨')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="theme-settings">
    <van-nav-bar
      title="主题设置"
      left-arrow
      @click-left="goBack"
    />

    <div class="theme-content">
      <div class="theme-preview">
        <div class="preview-card">
          <div class="preview-header">
            <div class="preview-title">当前主题</div>
            <div class="preview-emoji">{{ themeStore.themes[themeStore.currentTheme].emoji }}</div>
          </div>
          <div class="preview-name">{{ themeStore.themes[themeStore.currentTheme].label }}</div>
        </div>
      </div>

      <div class="theme-list">
        <div class="section-title">选择主题</div>
        <div
          v-for="(theme, key) in themeStore.themes"
          :key="key"
          class="theme-item"
          :class="{ active: themeStore.currentTheme === key }"
          @click="selectTheme(key as ThemeName)"
        >
          <div class="theme-color-preview" :style="{ background: theme.colors.backgroundGradient }">
            <div class="theme-color-dot" :style="{ background: theme.colors.primary }"></div>
          </div>
          <div class="theme-info">
            <div class="theme-name">
              <span class="theme-emoji">{{ theme.emoji }}</span>
              <span>{{ theme.label }}</span>
            </div>
            <div class="theme-colors">
              <span class="color-dot" :style="{ background: theme.colors.primary }"></span>
              <span class="color-dot" :style="{ background: theme.colors.secondary }"></span>
            </div>
          </div>
          <van-icon v-if="themeStore.currentTheme === key" name="success" color="#07c160" size="20" />
        </div>
      </div>

      <div class="theme-tip">
        <van-icon name="info-o" />
        <span>主题会自动保存，下次打开时生效</span>
      </div>
    </div>

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
.theme-settings {
  min-height: 100vh;
  background: var(--background-gradient);
  padding-bottom: 60px;
}

.theme-content {
  padding: 20px;
}

.theme-preview {
  margin-bottom: 24px;
}

.preview-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  background: var(--background-gradient);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 14px;
  color: #666;
}

.preview-emoji {
  font-size: 32px;
}

.preview-name {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.theme-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.theme-item {
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

.theme-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.theme-item.active {
  border: 2px solid var(--primary-color);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.theme-color-preview {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.theme-color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-emoji {
  font-size: 20px;
}

.theme-colors {
  display: flex;
  gap: 8px;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.theme-tip {
  background: linear-gradient(135deg, #fff3f8 0%, #ffe8f0 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #666;
}

.theme-tip .van-icon {
  color: var(--primary-color);
  font-size: 18px;
}
</style>
