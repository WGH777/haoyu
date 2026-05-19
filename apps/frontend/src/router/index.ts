// apps/frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { getProfile } from '@/api/user'

type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

/**
 * 角色等级：数值越大权限越高（SUPER_ADMIN 继承 ADMIN/USER 权限）
 */
const ROLE_LEVEL: Record<Role, number> = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
}

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * true 表示游客可访问（不需要 token）
     */
    public?: boolean
    /**
     * 需要的角色列表：满足任意一个即可（并支持等级继承）
     * 例如：['ADMIN'] 表示 ADMIN/SUPER_ADMIN 都可访问
     */
    roles?: Role[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    /**
     * 主布局（HomeView 内部包含菜单与 Header）
     * 说明：这里把任务大厅/任务详情设计成“公开可访问”
     */
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        // 任务大厅（游客可访问）
        {
          path: '/task',
          name: 'task',
          component: HomeView,
          meta: { public: true },
        },
        // 任务详情（游客可访问）
        {
          path: '/task/:id',
          name: 'task-detail',
          component: () => import('@/views/task/TaskDetail.vue'),
          meta: { public: true },
        },
        // 我的任务（必须登录）
        {
          path: '/my-task',
          name: 'my-task',
          component: () => import('@/views/task/MyTasks.vue'),
        },
        // 我接的订单（必须登录）
        {
          path: '/my-orders',
          name: 'my-orders',
          component: () => import('@/views/order/ServiceOrders.vue'),
        },
        // 通知中心（必须登录）
        {
          path: '/notifications',
          name: 'notifications',
          component: () => import('@/views/NotificationView.vue'),
        },
        // 信任中心（公开）
        {
          path: '/trust',
          name: 'trust',
          component: () => import('@/views/TrustCenter.vue'),
          meta: { public: true },
        },
        // 管理后台（仅 ADMIN / SUPER_ADMIN）
        {
          path: '/admin',
          name: 'admin',
          component: () => import('@/views/admin/AdminDashboard.vue'),
          meta: { roles: ['ADMIN', 'SUPER_ADMIN'] },
        },
        // 钱包中心（必须登录）
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
        // 个人资料（必须登录）
        {
          path: '/profile',
          name: 'profile',
          component: () => import('@/views/user/Profile.vue'),
        },
      ],
    },

    // 登录 / 注册（游客可访问）
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: { public: true },
    },

    // 404
    {
      path: '/help',
      name: 'help',
      component: () => import('@/views/HelpCenter.vue'),
      meta: { public: true },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/LegalTerms.vue'),
      meta: { public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFound.vue'),
      meta: { public: true },
    },
  ],
})

/**
 * 获取 token：保持兼容你之前可能用过的 key
 */
const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('access_token') ||
  localStorage.getItem('jwt') ||
  ''

/**
 * 读取缓存用户
 */
const getCachedUser = (): any | null => {
  const cached = localStorage.getItem('currentUser')
  if (!cached) return null
  try {
    return JSON.parse(cached)
  } catch {
    localStorage.removeItem('currentUser')
    return null
  }
}

/**
 * 判断角色是否满足路由要求（支持等级继承）
 */
const matchRoles = (userRole: string | undefined, required: Role[]) => {
  const role = (userRole || '') as Role
  const level = ROLE_LEVEL[role]
  if (!level) return false

  return required.some((r) => level >= ROLE_LEVEL[r])
}

// 路由错误监听 — 排查 P0 空白页/404
router.onError((err) => {
  console.error('[Router Error]', err)
})

/**
 * 路由守卫：游客访问控制 + 登录校验 + 角色校验
 */
router.beforeEach(async (to, _from, next) => {
  const token = getToken()
  const isPublic = !!to.meta.public

  // 1) 游客允许访问公开页面
  if (!token) {
    // 未登录访问非公开页面 -> 去登录
    if (!isPublic) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }

    // 未登录访问 login/register 正常放行
    return next()
  }

  // 2) 已登录访问 login/register：直接去任务大厅（避免重复登录）
  if (to.path === '/login' || to.path === '/register') {
    return next('/task')
  }

  // 3) 有 token：确保 currentUser 可用（从缓存或后端拉取）
  let currentUser = getCachedUser()
  if (!currentUser) {
    try {
      const res = await getProfile()
      currentUser = res
      localStorage.setItem('currentUser', JSON.stringify(res))
    } catch (e) {
      // token 失效：清理后回登录
      console.error('获取用户信息失败，可能 token 已过期:', e)
      localStorage.removeItem('token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('jwt')
      localStorage.removeItem('currentUser')
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
  }

  // 4) 角色路由校验
  const requiredRoles = (to.meta.roles || []) as Role[]
  if (requiredRoles.length > 0) {
    const ok = matchRoles(currentUser?.role, requiredRoles)
    if (!ok) {
      // 权限不足：跳回任务大厅（不强退登录，避免误判为“登录失效”）
      return next('/task')
    }
  }

  return next()
})

export default router
