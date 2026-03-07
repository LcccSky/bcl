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
      meta: { title: '心语盒子' }
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
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || '心语盒子'
  next()
})

export default router
