<template>
  <!-- 移动端顶部 header -->
  <header class="mobile-topbar">
    <button class="mobile-menu-btn" @click="$emit('update:open', true)" aria-label="打开菜单">
      <span></span><span></span><span></span>
    </button>
    <span class="mobile-page-title">{{ title }}</span>
    <div class="mobile-topbar-right">
      <template v-if="isLogin && user">
        <button class="mobile-avatar-btn" aria-label="用户菜单" @click="showSheet = true">
          <span class="mobile-avatar">{{ userNameInitial }}</span>
        </button>
      </template>
      <template v-else>
        <el-button size="small" @click="$router.push('/login')">登录</el-button>
      </template>
    </div>
  </header>

  <!-- 移动端用户操作 ActionSheet -->
  <van-action-sheet
    v-model:show="showSheet"
    :actions="sheetOptions"
    cancel-text="取消"
    close-on-click-action
    @select="onSheetSelect"
    class="van-action-sheet-dark"
  />

  <!-- 移动端遮罩 -->
  <div v-if="open" class="mobile-drawer-mask" @click="$emit('update:open', false)"></div>

  <!-- 移动端抽屉菜单 -->
  <aside class="mobile-drawer" :class="{ open: open }">
    <div class="mobile-drawer-header">
      <div class="brand" @click="goHome()">
        <span class="brand-logo">煜</span>
        <span class="brand-name">浩煜</span>
      </div>
      <button class="drawer-close" @click="$emit('update:open', false)">✕</button>
    </div>
    <nav class="mobile-drawer-menu">
      <a v-for="item in items" :key="item.path"
         class="mdm-item" :class="{ active: $route.path === item.path }"
         :href="item.path"
         @click.prevent="goMenu(item.path)"
      >
        <el-icon v-if="item.icon" style="font-size:18px;margin-right:10px;"><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="mn-badge mdm-badge">{{ item.badge }}</span>
      </a>
    </nav>
    <div class="mobile-drawer-footer">
      <div class="mobile-drawer-user" v-if="isLogin && user">
        <span class="drawer-avatar">{{ userNameInitial }}</span>
        <div class="drawer-user-info">
          <span class="drawer-nickname">{{ user?.nickname }}</span>
          <span class="drawer-email">{{ user?.email }}</span>
        </div>
      </div>
      <div v-else class="mobile-drawer-user">
        <span style="font-size:14px;color:rgba(255,255,255,0.5);">可信价值协作平台</span>
      </div>
      <template v-if="isLogin && user">
        <el-button size="small" plain @click="logout()" style="width:100%">退出登录</el-button>
      </template>
      <template v-else>
        <el-button size="small" @click="goMenu('/login')">登录</el-button>
        <el-button size="small" type="primary" @click="goMenu('/register')">注册</el-button>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  open: boolean
  isLogin: boolean
  user: any | null
  title: string
  items: any[]
}>()
const emit = defineEmits<{
  'update:open': [v: boolean]
  'navigate': [path: string]
}>()

const router = useRouter()
const route = useRoute()

const showSheet = ref(false)
const sheetOptions = [
  { name: '个人中心', key: 'profile' },
  { name: '我的任务', key: 'my-task' },
  { name: '钱包', key: 'wallet' },
  { name: '退出登录', key: 'logout' },
]

const userNameInitial = computed(() =>
  props.user?.nickname?.[0] || props.user?.email?.[0]?.toUpperCase() || '?'
)

const onSheetSelect = (item: { key: string }) => {
  if (item.key === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    ElMessage.success('已退出登录')
    window.location.reload()
  } else {
    router.push('/' + item.key)
  }
}

const goMenu = (path: string) => {
  emit('update:open', false)
  document.body.classList.remove('drawer-open')
  router.push(path)
}

const goHome = () => {
  emit('update:open', false)
  document.body.classList.remove('drawer-open')
  router.push('/task')
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('currentUser')
  emit('update:open', false)
  document.body.classList.remove('drawer-open')
  window.location.reload()
}
</script>

<style scoped>
.mobile-topbar {
  display: none;
}
.mobile-drawer-mask { display: none; }
.mobile-drawer { display: none; }

@media (max-width: 768px) {
  .mobile-topbar {
    display: flex !important;
    position: fixed; top: 0; left: 0; right: 0; z-index: 900;
    height: 52px;
    align-items: center; justify-content: space-between;
    padding: 0 14px;
    background: rgba(8, 13, 26, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .mobile-menu-btn {
    display: flex !important;
    flex-direction: column; gap: 4px;
    background: none; border: none; cursor: pointer; padding: 8px;
  }
  .mobile-menu-btn span {
    width: 18px; height: 2px;
    border-radius: 999px;
    background: rgba(255,255,255,0.88);
    transition: transform 0.2s ease;
  }
  .mobile-topbar-right {
    display: flex; align-items: center; gap: 8px;
  }
  .mobile-avatar-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; padding: 0;
  }
  .mobile-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-weight: 700; font-size: 13px;
  }
  .mobile-page-title {
    font-size: 15px; font-weight: 600; color: #f1f5f9;
    margin-left: 8px;
  }
  .mobile-drawer-mask {
    display: block !important;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.52);
    z-index: 998;
  }
  .mobile-drawer {
    display: flex !important;
    position: fixed; top: 0; left: 0;
    width: min(82vw, 320px); height: 100vh;
    z-index: 999;
    background: rgba(12, 17, 31, 0.98);
    border-right: 1px solid rgba(255,255,255,0.08);
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: 24px 0 60px rgba(0,0,0,0.35);
    padding: 16px;
    flex-direction: column;
    overflow-y: auto;
  }
  .mobile-drawer.open { transform: translateX(0); }
  .mobile-drawer-header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 8px;
  }
  .brand {
    display: flex; align-items: center; gap: 8px; cursor: pointer;
  }
  .brand-logo {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px;
  }
  .brand-name { font-size: 16px; font-weight: 700; color: #e2e8f0; }
  .drawer-close {
    width: 32px; height: 32px; border: 0; background: transparent;
    color: rgba(255,255,255,0.5); font-size: 18px; cursor: pointer;
  }
  .mobile-drawer-menu {
    flex: 1; overflow-y: auto; padding: 8px 0;
  }
  .mdm-item {
    display: flex; align-items: center;
    padding: 12px 10px; border-radius: 10px;
    color: #94a3b8; text-decoration: none;
    font-size: 15px; position: relative; transition: all 0.15s;
  }
  .mdm-item:hover { background: rgba(255,255,255,0.04); color: #cbd5e1; }
  .mdm-item.active { background: rgba(99,102,241,0.1); color: #a5b4fc; }
  .mdm-badge {
    margin-left: auto;
    background: #ef4444; color: #fff;
    font-size: 10px; min-width: 16px; height: 16px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .mobile-drawer-footer {
    border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;
  }
  .mobile-drawer-user {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 0; margin-bottom: 4px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .drawer-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-weight: 700; font-size: 16px;
  }
  .drawer-user-info { display: flex; flex-direction: column; gap: 2px; }
  .drawer-nickname { color: #f1f5f9; font-size: 15px; font-weight: 500; }
  .drawer-email { color: rgba(255,255,255,0.45); font-size: 12px; word-break: break-all; }
  .mobile-drawer-footer .el-button { min-height: 44px; margin-bottom: 4px; }
  .mobile-topbar-right .el-button { min-height: 36px; }
}
</style>
