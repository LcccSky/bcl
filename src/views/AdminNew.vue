<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi, petApi } from '@/utils/supabase'
import { MOOD_TAGS } from '@/types'
import { showToast } from 'vant'
import type { UploaderFileListItem } from 'vant'
import { useUserStore } from '@/stores/user'
import { usePetStore } from '@/stores/pet'

const router = useRouter()
const userStore = useUserStore()
const petStore = usePetStore()
const content = ref('')
const imageUrl = ref('')
const imageFiles = ref<UploaderFileListItem[]>([])
const moodTag = ref('miss')
const customMoodLabel = ref('')
const customMoodColor = ref('#ff6b9d')
const showCustomMood = ref(false)
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
    // 移除上传失败的文件
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

  // 如果是自定义心情，验证必填项
  if (moodTag.value === 'custom') {
    if (!customMoodLabel.value.trim()) {
      showToast('请输入自定义心情标签')
      return
    }
  }

  loading.value = true
  try {
    const messageData = {
      content: content.value,
      image_url: imageUrl.value || null,
      mood_tag: moodTag.value === 'custom' ? customMoodLabel.value : moodTag.value,
      mood_emoji: moodTag.value === 'custom' ? '💭' : MOOD_TAGS[moodTag.value as keyof typeof MOOD_TAGS]?.emoji,
      mood_color: moodTag.value === 'custom' ? customMoodColor.value : MOOD_TAGS[moodTag.value as keyof typeof MOOD_TAGS]?.color,
      author_name: userStore.nickname,
      publish_at: publishType.value === 'now' ? new Date().toISOString() : publishTime.value,
      is_published: publishType.value === 'now',
      is_read: false,
      likes_count: 0
    }

    await messageApi.createMessage(messageData)

    // 发布留言奖励：+10 经验
    if (petStore.pet) {
      await petApi.addExp(petStore.pet.id, 10)
      const updatedPet = await petApi.getPet()
      if (updatedPet) {
        petStore.setPet(updatedPet)
      }
    }

    showToast('发布成功，小猫获得了 10 经验！')
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
              @click="moodTag = mood.value; showCustomMood = false"
            >
              {{ mood.label }}
            </div>
            <div
              class="mood-option custom-mood-btn"
              :class="{ active: moodTag === 'custom' }"
              @click="moodTag = 'custom'; showCustomMood = true"
            >
              ✨ 自定义
            </div>
          </div>

          <!-- 自定义心情输入 -->
          <div v-if="showCustomMood && moodTag === 'custom'" class="custom-mood-form">
            <van-field
              v-model="customMoodLabel"
              label="标签"
              placeholder="输入心情标签，如 开心"
              maxlength="10"
            />
            <van-field
              v-model="customMoodColor"
              label="颜色"
              type="text"
              placeholder="#ff6b9d"
            >
              <template #input>
                <input
                  v-model="customMoodColor"
                  type="color"
                  style="width: 100%; height: 40px; border: none;"
                />
              </template>
            </van-field>
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

.custom-mood-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.custom-mood-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.9;
}

.custom-mood-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
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
