import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { getProfile } from '@/api/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        {
          path: '/task',
          name: 'task',
          component: HomeView
        },
        {
          path: '/my-task',
          name: 'my-task',
          component: () => import('@/views/task/MyTasks.vue') // ✅ 正确路径
        },
        {
          path: '/wallet',
          name: 'wallet',
          component: () => import('@/views/Wallet.vue') // ✅ 正确路径
        },
        {
          path: '/user',
          name: 'user-list',
          component: () => import('@/views/user/UserList.vue') // ✅ 正确路径
        },
        {
          path: '/profile',
          name: 'profile',
          component: () => import('@/views/user/Profile.vue') // ✅ 正确路径
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      // 🔥 核心修正：使用 LoginView.vue
      component: () => import('@/views/LoginView.vue') 
    },
    {
      path: '/register',
      name: 'register',
      // 🔥 核心修正：使用 Register.vue
      component: () => import('@/views/Register.vue') 
    }
  ]
})

// 路由守卫：检查登录状态
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired && !token) {
    return next('/login')
  }

  if (token && authRequired && !localStorage.getItem('currentUser')) {
    try {
      await getProfile()
    } catch (e) {
      localStorage.clear()
      return next('/login')
    }
  }

  next()
})

export default router