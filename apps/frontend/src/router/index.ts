// apps/frontend/src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
    },
    {
      // 布局路由：左侧菜单 + 顶部栏 + 内容区
      path: '/',
      name: 'layout',
      component: HomeView,
      redirect: '/task', // 默认进入任务列表
      children: [
        {
          path: 'task',
          name: 'task',
          component: () => import('../views/task/TaskList.vue'),
        },
        {
          path: 'my-task',
          name: 'my-task',
          component: () => import('../views/task/MyTasks.vue'),
        },
        {
          path: 'wallet',
          name: 'wallet',
          component: () => import('../views/Wallet.vue'),
        },
        {
          path: 'user',
          name: 'user',
          component: () => import('../views/user/UserList.vue'),
        },
        {
          // ★ 个人资料页面
          path: 'profile',
          name: 'profile',
          component: () => import('../views/Profile.vue'),
        },
      ],
    },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫：未登录只能访问 login / register
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const whiteList = ['login', 'register']

  if (whiteList.includes(to.name as string)) {
    // 去登录 / 注册
    if (token) {
      // 已登录就不让回登录页，直接进任务页
      next({ name: 'task' })
    } else {
      next()
    }
  } else {
    // 去系统内部页面
    if (token) {
      next()
    } else {
      next({ name: 'login' })
    }
  }
})

export default router
