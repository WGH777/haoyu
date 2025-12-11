<!-- apps/frontend/src/views/HomeView.vue -->
<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside width="200px" class="aside">
      <div class="logo">
        浩煜平台
      </div>

      <el-menu
        :default-active="activeMenu"
        class="menu"
        router
      >
        <el-menu-item index="/task">
          <span>任务大厅</span>
        </el-menu-item>

        <el-menu-item index="/my-task">
          <span>我的任务</span>
        </el-menu-item>

        <el-menu-item index="/wallet">
          <span>钱包中心</span>
        </el-menu-item>

        <!-- 只有管理员 / 超管才看得见用户管理 -->
        <el-menu-item
          v-if="canSeeUserManage"
          index="/user"
        >
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧：头部 + 内容 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <span class="system-title">宇宙级悬赏系统</span>
        </div>

        <div class="header-right">
          <div class="balance" v-if="currentUser">
            余额：
            <span class="balance-amount">
              {{ (currentUser.balance || 0) / 100 }} 元
            </span>
          </div>

          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar
                size="small"
                class="avatar"
              >
                {{ avatarText }}
              </el-avatar>
              <span class="nickname">{{ currentUser?.nickname || '未登录' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主体内容：子路由出口 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '../api/http'

interface CurrentUser {
  id: number
  email: string
  nickname: string | null
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | string
  balance: number
  createdAt: string
  updatedAt: string
  bio?: string | null
}

const route = useRoute()
const router = useRouter()

const currentUser = ref<CurrentUser | null>(null)

// 当前激活菜单
const activeMenu = computed(() => {
  return route.path
})

// 是否可以看到「用户管理」菜单
const canSeeUserManage = computed(() => {
  if (!currentUser.value) return false
  const role = currentUser.value.role
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
})

/**
 * 头像里显示的文字：
 * - 优先用邮箱首字母（大写），例如 boss@haoyu.com -> B
 * - 若没有邮箱，则退回昵称首字
 * 这样右边再显示完整昵称，就不会出现“荒 荒”两个一模一样。
 */
const avatarText = computed(() => {
  if (currentUser.value?.email) {
    return currentUser.value.email.slice(0, 1).toUpperCase()
  }
  if (currentUser.value?.nickname) {
    return currentUser.value.nickname.slice(0, 1)
  }
  return '?'
})

// 从后端刷新个人信息
const fetchProfile = async () => {
  try {
    const res = await http.get<CurrentUser>('/user/profile')
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
  }
}

// 处理下拉菜单点击
const handleCommand = async (command: string) => {
  if (command === 'profile') {
    router.push({ name: 'profile' })
    return
  }

  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确认要退出登录吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })

      // 清除本地登录状态
      localStorage.removeItem('token')
      localStorage.removeItem('currentUser')

      ElMessage.success('已退出登录')
      router.replace({ name: 'login' })
    } catch {
      // 用户点了取消
    }
  }
}

onMounted(() => {
  // 1. 尝试从 localStorage 读取
  const cached = localStorage.getItem('currentUser')
  if (cached) {
    try {
      currentUser.value = JSON.parse(cached)
    } catch {
      currentUser.value = null
    }
  }

  // 2. 再向后端刷新一次最新资料
  fetchProfile()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

/* 左侧菜单 */
.aside {
  background-color: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu {
  border-right: none;
}

/* 顶部栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 16px;
  box-sizing: border-box;
}

.header-left .system-title {
  font-size: 16px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.balance {
  font-size: 14px;
}

.balance-amount {
  font-weight: 600;
  color: #409eff;
}

.user-dropdown {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.avatar {
  margin-right: 8px;
}

.nickname {
  font-size: 14px;
}

/* 主体内容 */
.main {
  background-color: #f5f5f5;
  padding: 16px;
  box-sizing: border-box;
}
</style>
