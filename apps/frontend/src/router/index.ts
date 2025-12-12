// apps/frontend/src/router/index.ts
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
          component: HomeView,
        },
        // 任务详情
        {
          path: '/task/:id',
          name: 'task-detail',
          component: () => import('@/views/task/TaskDetail.vue'),
        },
        // 我的任务
        {
          path: '/my-task',
          name: 'my-task',
          component: () => import('@/views/task/MyTasks.vue'),
        },
        // 钱包中心
        {
          path: '/wallet',
          name: 'wallet',
          component: () => import('@/views/Wallet.vue'),
        },
        // 用户管理（仅 ADMIN / SUPER_ADMIN）
        {
          path: '/user',
          name: 'user-list',
          component: () => import('@/views/user/UserList.vue'),
          meta: {
            roles: ['ADMIN', 'SUPER_ADMIN'],
          },
        },
        // 个人资料
        {
          path: '/profile',
          name: 'profile',
          component: () => import('@/views/user/Profile.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
    },
  ],
})

// 路由守卫：登录校验 + 角色权限校验
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)

  // 未登录且访问受限页面 -> 去登录
  if (authRequired && !token) {
    return next('/login')
  }

  let currentUser: any = null

  // 已登录且访问受限页面时，确保有 currentUser 信息
  if (token && authRequired) {
    const cached = localStorage.getItem('currentUser')
    if (cached) {
      try {
        currentUser = JSON.parse(cached)
      } catch {
        localStorage.removeItem('currentUser')
      }
    }

    if (!currentUser) {
      try {
        // 从后端获取当前用户，并缓存
        const res = await getProfile()
        currentUser = res
        localStorage.setItem('currentUser', JSON.stringify(res))
      } catch (e) {
        // token 失效，清理后跳转到登录
        console.error('获取用户信息失败:', e)
        localStorage.clear()
        return next('/login')
      }
    }
  }

  // 角色权限校验：如果路由配置了 meta.roles，则需要满足角色
  const needRoles = (to.meta && (to.meta as any).roles) as string[] | undefined
  if (needRoles && needRoles.length > 0) {
    if (!currentUser) {
      // 理论上不会进入，因为上面已经处理过；稳妥起见再拦一次
      return next('/login')
    }

    const userRole = currentUser.role
    const allowed = needRoles.includes(userRole)

    if (!allowed) {
      // 没有权限，统一拦到任务大厅
      return next('/task')
    }
  }

  next()
})

export default router
