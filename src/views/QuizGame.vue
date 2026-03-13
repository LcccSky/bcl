<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

// 问答题库
const questions = [
  {
    id: 1,
    question: '对方最喜欢的颜色是什么？',
    options: ['红色', '粉色', '蓝色', '紫色', '绿色', '黄色']
  },
  {
    id: 2,
    question: '对方最喜欢吃的食物是什么？',
    options: ['火锅', '烧烤', '日料', '西餐', '中餐', '甜品']
  },
  {
    id: 3,
    question: '对方最喜欢的电影类型是？',
    options: ['爱情片', '动作片', '喜剧片', '科幻片', '恐怖片', '动画片']
  },
  {
    id: 4,
    question: '对方最喜欢的季节是？',
    options: ['春天', '夏天', '秋天', '冬天']
  },
  {
    id: 5,
    question: '对方最喜欢的休闲活动是？',
    options: ['看电影', '逛街', '运动', '宅家', '旅游', '读书']
  },
  {
    id: 6,
    question: '对方最害怕的东西是？',
    options: ['蟑螂', '老鼠', '蛇', '黑暗', '打雷', '高处']
  },
  {
    id: 7,
    question: '对方的理想约会地点是？',
    options: ['电影院', '游乐园', '海边', '山上', '咖啡厅', '家里']
  },
  {
    id: 8,
    question: '对方最喜欢的音乐类型是？',
    options: ['流行', '摇滚', '民谣', '古风', '电音', '轻音乐']
  },
  {
    id: 9,
    question: '对方最想去的旅游地是？',
    options: ['日本', '韩国', '欧洲', '东南亚', '美国', '国内']
  },
  {
    id: 10,
    question: '对方最喜欢的动物是？',
    options: ['猫', '狗', '兔子', '熊猫', '企鹅', '海豚']
  }
]

const gameState = ref<'start' | 'playing' | 'result'>('start')
const currentQuestionIndex = ref(0)
const myAnswers = ref<string[]>([])
const partnerAnswers = ref<string[]>([])
const currentAnswer = ref('')
const isAnsweringForPartner = ref(false)

const currentQuestion = computed(() => questions[currentQuestionIndex.value])
const progress = computed(() => ((currentQuestionIndex.value + 1) / questions.length) * 100)

function startGame() {
  gameState.value = 'playing'
  currentQuestionIndex.value = 0
  myAnswers.value = []
  partnerAnswers.value = []
  currentAnswer.value = ''
  isAnsweringForPartner.value = false
}

function selectAnswer(answer: string) {
  currentAnswer.value = answer
}

function nextQuestion() {
  if (!currentAnswer.value) {
    showToast('请选择一个答案')
    return
  }

  if (!isAnsweringForPartner.value) {
    // 回答自己的问题
    myAnswers.value.push(currentAnswer.value)
    currentAnswer.value = ''
    isAnsweringForPartner.value = true
  } else {
    // 回答对方的问题
    partnerAnswers.value.push(currentAnswer.value)
    currentAnswer.value = ''
    isAnsweringForPartner.value = false

    if (currentQuestionIndex.value < questions.length - 1) {
      currentQuestionIndex.value++
    } else {
      showResult()
    }
  }
}

function showResult() {
  gameState.value = 'result'
}

const matchScore = computed(() => {
  // 这里简化处理，实际应该让双方都回答后对比
  // 现在只是模拟一个分数
  return Math.floor(Math.random() * 30) + 70
})

const matchLevel = computed(() => {
  const score = matchScore.value
  if (score >= 90) return { text: '心有灵犀', emoji: '💯', color: '#ff6b9d' }
  if (score >= 80) return { text: '默契十足', emoji: '💕', color: '#ffa07a' }
  if (score >= 70) return { text: '还不错哦', emoji: '😊', color: '#ffd93d' }
  return { text: '需要加油', emoji: '💪', color: '#a8dadc' }
})

function goBack() {
  router.back()
}

function restartGame() {
  startGame()
}
</script>

<template>
  <div class="quiz-game">
    <van-nav-bar
      title="情侣问答"
      left-arrow
      @click-left="goBack"
    />

    <!-- 开始页面 -->
    <div v-if="gameState === 'start'" class="start-screen">
      <div class="game-intro">
        <div class="intro-icon">💑</div>
        <h2>测测你们的默契度</h2>
        <p>回答关于对方的问题，看看你们有多了解彼此</p>

        <div class="game-rules">
          <div class="rule-item">
            <span class="rule-icon">1️⃣</span>
            <span>先回答关于自己的问题</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">2️⃣</span>
            <span>再猜测对方会怎么回答</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">3️⃣</span>
            <span>共10道题，测试默契度</span>
          </div>
        </div>

        <van-button type="primary" size="large" round @click="startGame">
          开始游戏
        </van-button>
      </div>
    </div>

    <!-- 游戏进行中 -->
    <div v-else-if="gameState === 'playing'" class="game-screen">
      <div class="progress-section">
        <div class="progress-text">
          第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 题
        </div>
        <van-progress :percentage="progress" stroke-width="8" color="var(--primary-color)" />
      </div>

      <div class="question-card">
        <div class="question-type">
          <span v-if="!isAnsweringForPartner" class="type-badge me">关于你</span>
          <span v-else class="type-badge partner">猜测TA</span>
        </div>

        <div class="question-text">
          <span v-if="!isAnsweringForPartner">{{ currentQuestion?.question }}</span>
          <span v-else>你觉得TA会选择什么？</span>
        </div>

        <div class="options-list">
          <div
            v-for="option in currentQuestion?.options"
            :key="option"
            class="option-item"
            :class="{ selected: currentAnswer === option }"
            @click="selectAnswer(option)"
          >
            <div class="option-radio">
              <van-icon v-if="currentAnswer === option" name="success" />
            </div>
            <div class="option-text">{{ option }}</div>
          </div>
        </div>

        <van-button
          type="primary"
          size="large"
          round
          block
          @click="nextQuestion"
        >
          {{ isAnsweringForPartner && currentQuestionIndex === questions.length - 1 ? '查看结果' : '下一题' }}
        </van-button>
      </div>
    </div>

    <!-- 结果页面 -->
    <div v-else-if="gameState === 'result'" class="result-screen">
      <div class="result-card">
        <div class="result-icon" :style="{ color: matchLevel.color }">
          {{ matchLevel.emoji }}
        </div>
        <div class="result-score">{{ matchScore }}分</div>
        <div class="result-level" :style="{ color: matchLevel.color }">
          {{ matchLevel.text }}
        </div>
        <div class="result-message">
          你们的默契度超过了 {{ matchScore }}% 的情侣！
        </div>

        <div class="result-tips">
          <div class="tip-title">💡 小贴士</div>
          <div class="tip-content">
            多沟通、多了解对方的喜好，会让你们的感情更加甜蜜哦~
          </div>
        </div>

        <div class="result-actions">
          <van-button type="primary" size="large" round block @click="restartGame">
            再玩一次
          </van-button>
          <van-button size="large" round block @click="goBack" style="margin-top: 12px;">
            返回
          </van-button>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <van-tabbar route>
      <van-tabbar-item to="/messages" icon="chat-o">留言</van-tabbar-item>
      <van-tabbar-item to="/chat" icon="comment-o">聊天</van-tabbar-item>
      <van-tabbar-item to="/pet" icon="smile-o">猫猫</van-tabbar-item>
      <van-tabbar-item to="/wish" icon="star-o">愿望</van-tabbar-item>
      <van-tabbar-item to="/stats" icon="bar-chart-o">故事</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.quiz-game {
  min-height: 100vh;
  background: var(--background-gradient);
  padding-bottom: 60px;
}

.start-screen,
.game-screen,
.result-screen {
  padding: 20px;
}

/* 开始页面 */
.game-intro {
  background: white;
  border-radius: 20px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.intro-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.game-intro h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.game-intro p {
  font-size: 15px;
  color: #666;
  margin-bottom: 32px;
}

.game-rules {
  text-align: left;
  margin-bottom: 32px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 12px;
  font-size: 14px;
  color: #666;
}

.rule-icon {
  font-size: 20px;
}

/* 游戏进行中 */
.progress-section {
  margin-bottom: 24px;
}

.progress-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  text-align: center;
}

.question-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.question-type {
  margin-bottom: 16px;
  text-align: center;
}

.type-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.type-badge.me {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.type-badge.partner {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.question-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.6;
}

.options-list {
  margin-bottom: 24px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.option-item:hover {
  background: #f0f0f0;
}

.option-item.selected {
  background: linear-gradient(135deg, #fff3f8 0%, #ffe8f0 100%);
  border-color: var(--primary-color);
}

.option-radio {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.option-item.selected .option-radio {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.option-text {
  font-size: 15px;
  color: #333;
  flex: 1;
}

/* 结果页面 */
.result-card {
  background: white;
  border-radius: 20px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.result-icon {
  font-size: 100px;
  margin-bottom: 20px;
}

.result-score {
  font-size: 48px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.result-level {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.result-message {
  font-size: 15px;
  color: #666;
  margin-bottom: 32px;
}

.result-tips {
  background: linear-gradient(135deg, #fff3f8 0%, #ffe8f0 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 32px;
  text-align: left;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.tip-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.result-actions {
  margin-top: 24px;
}
</style>
