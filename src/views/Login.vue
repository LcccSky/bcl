<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    showToast('请输入邮箱和密码')
    return
  }

  loading.value = true
  try {
    // TODO: 实现登录逻辑
    showToast('登录成功')
    router.push('/admin')
  } catch (error) {
    showToast('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="login-header">
      <h1>❤️</h1>
      <h2>留一口</h2>
      <p>管理后台</p>
    </div>

    <div class="login-form">
      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="email"
            name="email"
            label="邮箱"
            placeholder="请输入邮箱"
            :rules="[{ required: true, message: '请输入邮箱' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="login-button">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            登录
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 64px;
  margin-bottom: 16px;
}

.login-header h2 {
  font-size: 28px;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: var(--text-secondary);
}

.login-form {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
}

.login-button {
  margin-top: 24px;
}
</style>
