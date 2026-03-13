<template>
  <div class="profile-page">
    <van-nav-bar title="个人资料" fixed placeholder />

    <div class="profile-content">
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="showAvatarUpload = true">
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
          <div v-else class="avatar-placeholder">
            {{ userStore.nickname?.charAt(0) || '?' }}
          </div>
          <div class="avatar-overlay">
            <van-icon name="photograph" size="24" />
            <span>更换头像</span>
          </div>
        </div>
      </div>

      <div class="info-section">
        <van-cell-group inset>
          <van-field
            v-model="nickname"
            label="昵称"
            placeholder="请输入昵称"
            :readonly="!editing"
          />
        </van-cell-group>
      </div>

      <div class="actions">
        <van-button
          v-if="!editing"
          type="primary"
          round
          block
          @click="editing = true"
        >
          编辑资料
        </van-button>
        <van-button
          v-else
          type="primary"
          round
          block
          :loading="saving"
          @click="saveProfile"
        >
          保存
        </van-button>
      </div>
    </div>

    <!-- 头像上传弹窗 -->
    <van-popup v-model:show="showAvatarUpload" position="bottom" :style="{ height: '40%' }">
      <div class="upload-popup">
        <div class="upload-header">上传头像</div>
        <van-uploader
          v-model="fileList"
          :max-count="1"
          :after-read="handleAvatarUpload"
          accept="image/*"
        >
          <van-button icon="plus" type="primary">选择图片</van-button>
        </van-uploader>
        <div class="upload-tip">支持 JPG、PNG 格式，建议尺寸 200x200</div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { userApi } from '@/utils/supabase'
import { useUserStore } from '@/stores/user'
import type { UploaderFileListItem } from 'vant'

const userStore = useUserStore()
const nickname = ref(userStore.nickname || '')
const avatarUrl = ref('')
const editing = ref(false)
const saving = ref(false)
const showAvatarUpload = ref(false)
const fileList = ref<UploaderFileListItem[]>([])
const uploading = ref(false)

onMounted(async () => {
  await loadUserProfile()
})

async function loadUserProfile() {
  if (!userStore.nickname) return

  try {
    const user = await userApi.getUser(userStore.nickname)
    if (user) {
      avatarUrl.value = user.avatar_url || ''
    }
  } catch (error) {
    console.error('加载用户资料失败:', error)
  }
}

async function saveProfile() {
  if (!nickname.value.trim()) {
    showToast('请输入昵称')
    return
  }

  saving.value = true
  try {
    await userApi.upsertUser({
      nickname: nickname.value.trim(),
      avatar_url: avatarUrl.value
    })

    userStore.setNickname(nickname.value.trim())
    showToast('保存成功')
    editing.value = false
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleAvatarUpload(file: UploaderFileListItem | UploaderFileListItem[]) {
  const fileItem = Array.isArray(file) ? file[0] : file

  if (!fileItem || !fileItem.file) return

  if (!userStore.nickname) {
    showToast('请先设置昵称')
    return
  }

  if (uploading.value) return

  uploading.value = true
  try {
    const uploadFile = fileItem.file as File
    const publicUrl = await userApi.uploadAvatar(uploadFile, userStore.nickname)

    avatarUrl.value = publicUrl

    await userApi.upsertUser({
      nickname: userStore.nickname,
      avatar_url: publicUrl
    })

    showToast('头像上传成功')
    showAvatarUpload.value = false
    fileList.value = []
  } catch (error) {
    console.error('上传头像失败:', error)
    showToast('上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
}

.profile-content {
  padding: 20px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  cursor: pointer;
}

.avatar,
.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  gap: 4px;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay span {
  font-size: 12px;
}

.info-section {
  margin: 24px 0;
}

.actions {
  margin-top: 32px;
}

.upload-popup {
  padding: 24px;
}

.upload-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.upload-tip {
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
</style>
