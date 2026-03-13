import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/messages'
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('@/views/MessageList.vue'),
      meta: { title: '留一口' }
    },
    {
      path: '/message/:id',
      name: 'message-detail',
      component: () => import('@/views/MessageDetail.vue'),
      meta: { title: '留言详情' }
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/Stats.vue'),
      meta: { title: '我们的故事' }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/Admin.vue'),
      meta: { title: '管理后台', requiresAuth: true }
    },
    {
      path: '/admin/new',
      name: 'admin-new',
      component: () => import('@/views/AdminNew.vue'),
      meta: { title: '发布留言', requiresAuth: true }
    },
    {
      path: '/admin/edit/:id',
      name: 'admin-edit',
      component: () => import('@/views/AdminEdit.vue'),
      meta: { title: '编辑留言' }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/pet',
      name: 'pet',
      component: () => import('@/views/PetPage.vue'),
      meta: { title: '我的猫猫' }
    },
    {
      path: '/wish',
      name: 'wish',
      component: () => import('@/views/WishList.vue'),
      meta: { title: '愿望清单' }
    },
    {
      path: '/checkin',
      name: 'checkin',
      component: () => import('@/views/CheckIn.vue'),
      meta: { title: '每日打卡' }
    },
    {
      path: '/theme',
      name: 'theme',
      component: () => import('@/views/ThemeSettings.vue'),
      meta: { title: '主题设置' }
    },
    {
      path: '/capsule',
      name: 'capsule',
      component: () => import('@/views/TimeCapsule.vue'),
      meta: { title: '时光胶囊' }
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: () => import('@/views/QuizGame.vue'),
      meta: { title: '情侣问答' }
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/Chat.vue'),
      meta: { title: '聊天' }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/Notifications.vue'),
      meta: { title: '通知' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      meta: { title: '个人资料' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '留一口'
  next()
})

export default router
