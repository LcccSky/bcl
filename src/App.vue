<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const nicknameInput = ref('')
const showNicknameDialog = ref(false)

onMounted(() => {
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
#app {
  min-height: 100vh;
}
</style>
