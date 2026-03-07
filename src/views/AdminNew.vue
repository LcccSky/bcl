<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '@/utils/supabase'
import { MOOD_TAGS } from '@/types'
import { showToast } from 'vant'
import type { UploaderFileListItem } from 'vant'

const router = useRouter()
const content = ref('')
const imageUrl = ref('')
const imageFiles = ref<UploaderFileListItem[]>([])
const moodTag = ref<'miss' | 'cheer' | 'goodnight' | 'surprise'>('miss')
const publishType = ref('now')
const publishTime = ref('')
const loading = ref(false)
const uploading = ref(false)

const moodOptions = Object.entries(MOOD_TAGS).map(([key, value]) => ({
  value: key,
  label: `${value.emoji} ${value.label}`,
  color: value.color
}))

async function handleImageUpload(item: UploaderFileListItem | UploaderFileListItem[]) {
  uploading.value = true
  try {
    const fileItem = Array.isArray(item) ? item[0] : item
    if (!fileItem || !fileItem.file) {
      throw new Error('No file selected')
    }

    const url = await messageApi.uploadImage(fileItem.file)
    imageUrl.value = url
    showToast('图片上传成功')
  } catch (error) {
    console.error('图片上传失败:', error)
    showToast('图片上传失败')
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
    const messageData = {
      content: content.value,
      image_url: imageUrl.value || null,
      mood_tag: moodTag.value,
      publish_at: publishType.value === 'now' ? new Date().toISOString() : publishTime.value,
      is_published: publishType.value === 'now',
      is_read: false,
      likes_count: 0
    }

    await messageApi.createMessage(messageData)
    showToast('发布成功')
    router.back()
  } catch (error) {
    console.error('发布失败:', error)
    showToast('发布失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="admin-new">
    <van-nav-bar
      title="发布新留言"
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
            :loading="uploading"
          >
            <van-button icon="photo" type="primary" plain>选择图片</van-button>
          </van-uploader>
          <div v-if="imageUrl" class="image-preview">
            <img :src="imageUrl" alt="预览图" />
          </div>
        </div>

        <div class="section">
          <div class="section-title">发布时间</div>
          <van-radio-group v-model="publishType">
            <van-radio name="now">立即发布</van-radio>
            <van-radio name="schedule">定时发布</van-radio>
          </van-radio-group>

          <van-field
            v-if="publishType === 'schedule'"
            v-model="publishTime"
            type="datetime-local"
            placeholder="选择发布时间"
          />
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
            {{ publishType === 'now' ? '立即发布' : '定时发布' }}
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<style scoped>
.admin-new {
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
