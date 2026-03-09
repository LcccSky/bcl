<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const userStore = useUserStore()
const themeStore = useThemeStore()
const nicknameInput = ref('')
const showNicknameDialog = ref(false)

onMounted(() => {
  // 初始化主题
  themeStore.setTheme(themeStore.currentTheme)

  if (!userStore.nickname) {
    showNicknameDialog.value = true
  }
})

function confirmNickname() {
  const name = nicknameInput.value.trim()
  if (!name) return
  userStore.setNickname(name)
  showNicknameDialog.value = false
}
</script>

<template>
  <div id="app">
    <RouterView />

    <van-dialog
      v-model:show="showNicknameDialog"
      title="你是谁呀 💕"
      :show-cancel-button="false"
      :close-on-click-overlay="false"
      confirm-button-text="确定"
      @confirm="confirmNickname"
    >
      <div style="padding: 16px">
        <van-field
          v-model="nicknameInput"
          placeholder="输入你的昵称（如：宝贝、老公）"
          maxlength="10"
          autofocus
        />
      </div>
    </van-dialog>
  </div>
</template>

<style>
:root {
  --primary-color: #ff6b9d;
  --secondary-color: #ffc1e3;
  --background-color: #fff5f7;
  --background-gradient: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  --text-primary: #333;
  --text-secondary: #666;
}

#app {
  min-height: 100vh;
}
</style>
