<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { messageApi } from '@/utils/supabase'
import { MOOD_TAGS } from '@/types'
import { showToast } from 'vant'
import type { UploaderFileListItem } from 'vant'

const route = useRoute()
const router = useRouter()
const content = ref('')
const imageUrl = ref('')
const imageFiles = ref<UploaderFileListItem[]>([])
const moodTag = ref<'miss' | 'cheer' | 'goodnight' | 'surprise'>('miss')
const loading = ref(false)
const uploading = ref(false)

const moodOptions = Object.entries(MOOD_TAGS).map(([key, value]) => ({
  value: key,
  label: `${value.emoji} ${value.label}`,
  color: value.color
}))

onMounted(async () => {
  await loadMessage()
})

async function loadMessage() {
  loading.value = true
  try {
    const id = route.params.id as string
    const data = await messageApi.getMessage(id)
    content.value = data.content
    imageUrl.value = data.image_url || ''
    moodTag.value = data.mood_tag
  } catch (error) {
    console.error('加载留言失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function handleImageUpload(item: UploaderFileListItem | UploaderFileListItem[]) {
  const fileItem = Array.isArray(item) ? item[0] : item
  if (!fileItem || !fileItem.file) return

  uploading.value = true
  try {
    const url = await messageApi.uploadImage(fileItem.file)
    imageUrl.value = url
    showToast('图片上传成功')
  } catch (error) {
    console.error('图片上传失败:', error)
    showToast('图片上传失败，请重试')
    imageFiles.value = []
  } finally {
    uploading.value = false
  }
}

async function handleSubmit() {
  if (!content.value.trim()) {
    showToast('请输入留言内容')
    return
  }

  loading.value = true
  try {
    const id = route.params.id as string
    const updates = {
      content: content.value,
      image_url: imageUrl.value || null,
      mood_tag: moodTag.value
    }

    await messageApi.updateMessage(id, updates)
    showToast('更新成功')
    router.back()
  } catch (error) {
    console.error('更新失败:', error)
    showToast('更新失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="admin-edit">
    <van-nav-bar
      title="编辑留言"
      left-arrow
      @click-left="goBack"
    />

    <div class="form-content">
      <van-form @submit="handleSubmit">
        <div class="section">
          <div class="section-title">选择心情</div>
          <div class="mood-selector">
            <div
              v-for="mood in moodOptions"
              :key="mood.value"
              class="mood-option"
              :class="{ active: moodTag === mood.value }"
              :style="{ borderColor: moodTag === mood.value ? mood.color : '#e9ecef' }"
              @click="moodTag = mood.value as any"
            >
              {{ mood.label }}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">留言内容</div>
          <van-field
            v-model="content"
            rows="6"
            autosize
            type="textarea"
            placeholder="写下你想说的话..."
            maxlength="500"
            show-word-limit
          />
        </div>

        <div class="section">
          <div class="section-title">添加图片（可选）</div>
          <van-uploader
            v-model="imageFiles"
            :max-count="1"
            :after-read="handleImageUpload"
            :preview-image="false"
            accept="image/*"
          >
            <van-button icon="photo" type="primary" plain :loading="uploading">
              {{ uploading ? '上传中...' : '选择图片' }}
            </van-button>
          </van-uploader>
          <div v-if="imageUrl" class="image-preview">
            <img :src="imageUrl" alt="预览图" />
            <van-button size="small" type="danger" @click="imageUrl = ''; imageFiles = []">删除</van-button>
          </div>
        </div>

        <div class="submit-section">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            size="large"
          >
            保存修改
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<style scoped>
.admin-edit {
  min-height: 100vh;
  background: var(--bg-color);
}

.form-content {
  padding: 16px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.mood-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mood-option {
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.mood-option.active {
  background: #ffeef8;
  font-weight: 600;
}

.submit-section {
  margin-top: 24px;
}

.image-preview {
  margin-top: 12px;
}

.image-preview img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 12px;
}
</style>
