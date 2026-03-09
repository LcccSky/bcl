<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { wishApi } from '@/utils/supabase'
import { useUserStore } from '@/stores/user'
import { showToast, showConfirmDialog } from 'vant'
import type { Wish } from '@/types'
import { WISH_CATEGORIES } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const wishes = ref<Wish[]>([])
const loading = ref(false)
const showAddDialog = ref(false)
const newWish = ref({
  title: '',
  description: '',
  category: 'travel' as const
})

const completedWishes = computed(() => wishes.value.filter(w => w.is_completed))
const pendingWishes = computed(() => wishes.value.filter(w => !w.is_completed))
const completionRate = computed(() => {
  if (wishes.value.length === 0) return 0
  return Math.round((completedWishes.value.length / wishes.value.length) * 100)
})

onMounted(async () => {
  await loadWishes()
})

async function loadWishes() {
  loading.value = true
  try {
    const data = await wishApi.getWishes()
    wishes.value = data
  } catch (error) {
    console.error('加载愿望清单失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

async function addWish() {
  if (!newWish.value.title.trim()) {
    showToast('请输入愿望标题')
    return
  }

  if (!userStore.userId) {
    showToast('请先设置昵称')
    return
  }

  try {
    await wishApi.createWish({
      title: newWish.value.title,
      description: newWish.value.description,
      category: newWish.value.category,
      created_by: userStore.userId
    })
    showToast('添加成功！')
    showAddDialog.value = false
    newWish.value = { title: '', description: '', category: 'travel' }
    await loadWishes()
  } catch (error) {
    console.error('添加愿望失败:', error)
    showToast('添加失败')
  }
}

async function toggleComplete(wish: Wish) {
  try {
    if (wish.is_completed) {
      await wishApi.uncompleteWish(wish.id)
      showToast('已标记为未完成')
    } else {
      await wishApi.completeWish(wish.id)
      showToast('恭喜完成愿望！🎉')
    }
    await loadWishes()
  } catch (error) {
    console.error('更新失败:', error)
    showToast('操作失败')
  }
}

async function deleteWish(wishId: string) {
  const result = await showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这个愿望吗？'
  })

  if (result === 'confirm') {
    try {
      await wishApi.deleteWish(wishId)
      showToast('删除成功')
      await loadWishes()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败')
    }
  }
}

function getCategoryInfo(category: string) {
  return WISH_CATEGORIES[category as keyof typeof WISH_CATEGORIES] || WISH_CATEGORIES.other
}
</script>

<template>
  <div class="wish-list">
    <van-nav-bar title="愿望清单" fixed placeholder />

    <div class="stats-banner">
      <div class="stat-item">
        <div class="stat-value">{{ wishes.length }}</div>
        <div class="stat-label">总愿望</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ completedWishes.length }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ completionRate }}%</div>
        <div class="stat-label">完成率</div>
      </div>
    </div>

    <van-pull-refresh v-model="loading" @refresh="loadWishes">
      <div class="wish-container">
        <!-- 未完成的愿望 -->
        <div v-if="pendingWishes.length > 0" class="wish-section">
          <div class="section-title">
            <span class="title-icon">🎯</span>
            <span>待完成 ({{ pendingWishes.length }})</span>
          </div>
          <div class="wish-cards">
            <div v-for="wish in pendingWishes" :key="wish.id" class="wish-card">
              <div class="wish-header">
                <span class="category-tag" :style="{ color: getCategoryInfo(wish.category).color }">
                  {{ getCategoryInfo(wish.category).emoji }} {{ getCategoryInfo(wish.category).label }}
                </span>
                <van-button
                  size="mini"
                  type="danger"
                  plain
                  @click="deleteWish(wish.id)"
                >
                  删除
                </van-button>
              </div>
              <div class="wish-content">
                <h3 class="wish-title">{{ wish.title }}</h3>
                <p v-if="wish.description" class="wish-desc">{{ wish.description }}</p>
              </div>
              <div class="wish-footer">
                <van-button
                  type="success"
                  size="small"
                  round
                  @click="toggleComplete(wish)"
                >
                  ✓ 完成
                </van-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 已完成的愿望 -->
        <div v-if="completedWishes.length > 0" class="wish-section">
          <div class="section-title">
            <span class="title-icon">✨</span>
            <span>已完成 ({{ completedWishes.length }})</span>
          </div>
          <div class="wish-cards">
            <div v-for="wish in completedWishes" :key="wish.id" class="wish-card completed">
              <div class="wish-header">
                <span class="category-tag" :style="{ color: getCategoryInfo(wish.category).color }">
                  {{ getCategoryInfo(wish.category).emoji }} {{ getCategoryInfo(wish.category).label }}
                </span>
                <van-button
                  size="mini"
                  type="danger"
                  plain
                  @click="deleteWish(wish.id)"
                >
                  删除
                </van-button>
              </div>
              <div class="wish-content">
                <h3 class="wish-title">{{ wish.title }}</h3>
                <p v-if="wish.description" class="wish-desc">{{ wish.description }}</p>
              </div>
              <div class="wish-footer">
                <span class="completed-badge">✓ 已完成</span>
                <van-button
                  size="mini"
                  plain
                  @click="toggleComplete(wish)"
                >
                  取消完成
                </van-button>
              </div>
            </div>
          </div>
        </div>

        <van-empty v-if="wishes.length === 0 && !loading" description="还没有愿望，快来添加吧！" />
      </div>
    </van-pull-refresh>

    <!-- 添加按钮 -->
    <van-floating-bubble
      axis="xy"
      icon="plus"
      magnetic="x"
      @click="showAddDialog = true"
    />

    <!-- 添加愿望对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="添加愿望"
      show-cancel-button
      @confirm="addWish"
    >
      <div class="add-wish-form">
        <van-field
          v-model="newWish.title"
          label="愿望"
          placeholder="想一起做什么呢？"
          maxlength="50"
          show-word-limit
        />
        <van-field
          v-model="newWish.description"
          label="描述"
          type="textarea"
          placeholder="详细描述一下（可选）"
          maxlength="200"
          show-word-limit
          rows="3"
        />
        <van-field name="category" label="分类">
          <template #input>
            <van-radio-group v-model="newWish.category" direction="horizontal">
              <van-radio
                v-for="(info, key) in WISH_CATEGORIES"
                :key="key"
                :name="key"
              >
                {{ info.emoji }} {{ info.label }}
              </van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </div>
    </van-dialog>

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
.wish-list {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%);
  padding-bottom: 60px;
}

.stats-banner {
  background: white;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 2px 12px rgba(255, 107, 157, 0.08);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.wish-container {
  padding: 20px 16px;
}

.wish-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
}

.wish-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wish-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.08);
  transition: all 0.3s ease;
}

.wish-card.completed {
  opacity: 0.7;
}

.wish-card.completed .wish-title {
  text-decoration: line-through;
  color: #999;
}

.wish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(255, 107, 157, 0.08);
}

.wish-content {
  margin-bottom: 12px;
}

.wish-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.wish-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.wish-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completed-badge {
  color: #4caf50;
  font-size: 14px;
  font-weight: 600;
}

.add-wish-form {
  padding: 16px 0;
}

:deep(.van-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.van-radio) {
  margin-right: 0;
}
</style>
