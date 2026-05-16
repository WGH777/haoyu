<template>
  <div class="app-shell">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo" @click="$router.push('/task')">
        <span class="logo-icon">煜</span>
        <span class="logo-text">浩煜</span>
      </div>
      <nav class="nav">
        <router-link to="/task" class="nav-item" :class="{ active: $route.path === '/task' || $route.path === '/' }">
          <el-icon><List /></el-icon>
          <span>任务大厅</span>
        </router-link>
        <template v-if="isLogin">
          <router-link to="/my-task" class="nav-item" :class="{ active: $route.path === '/my-task' }">
            <el-icon><Checked /></el-icon>
            <span>我的任务</span>
          </router-link>
          <router-link to="/my-orders" class="nav-item" :class="{ active: $route.path === '/my-orders' }">
            <el-icon><Document /></el-icon>
            <span>我接的订单</span>
          </router-link>
          <router-link to="/notifications" class="nav-item" :class="{ active: $route.path === '/notifications' }">
            <el-icon><Bell /></el-icon>
            <span>通知</span>
            <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
          </router-link>
          <router-link to="/wallet" class="nav-item" :class="{ active: $route.path === '/wallet' }">
            <el-icon><Wallet /></el-icon>
            <span>钱包</span>
          </router-link>
        </template>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/trust" class="nav-item small">信任中心</router-link>
        <template v-if="isLogin && canSeeUserManage">
          <router-link to="/admin" class="nav-item small">管理后台</router-link>
        </template>
      </div>
    </aside>

    <!-- 主区域 -->
    <main class="main-area">
      <!-- 顶栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <span class="greeting">👋 {{ isLogin && currentUser ? currentUser.nickname : '欢迎来到浩煜' }}</span>
        </div>
        <div class="topbar-right">
          <span v-if="isLogin && currentUser" class="balance-badge">
            💰 ¥{{ (walletBalance / 100).toFixed(2) }}
          </span>
          <template v-if="isLogin">
            <el-avatar
              :size="34"
              :src="currentUser?.avatar ? getFullUrl(currentUser.avatar) : undefined"
              :style="!currentUser?.avatar ? { backgroundColor: '#6366f1', color: '#fff', fontSize: '14px' } : {}"
            >
              {{ currentUser?.email ? currentUser.email[0].toUpperCase() : '?' }}
            </el-avatar>
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="dropdown-trigger">
                {{ currentUser?.nickname }}
                <el-icon><CaretBottom /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button size="small" @click="$router.push('/login')">登录</el-button>
            <el-button size="small" type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </header>

      <!-- 内容区 -->
      <div class="content" v-if="$route.path === '/' || $route.path === '/task'">
        <!-- Hero -->
        <div class="hero">
          <div class="hero-glass">
            <span class="hero-badge">🔒 资金托管保障</span>
            <h1>让每一份能力都被看见</h1>
            <p>发布需求，响应服务，可信交易。资金托管、过程留痕、信用沉淀。</p>
            <div class="hero-actions">
              <el-button type="primary" size="large" round @click="openCreateDialog" v-if="isLogin" class="btn-glow">✨ 发布需求</el-button>
              <el-button size="large" round @click="$router.push('/register')" v-else class="btn-glow">免费注册</el-button>
              <el-button size="large" round class="btn-outline" @click="$router.push('/trust')">了解保障</el-button>
            </div>
            <div class="hero-stats">
              <div class="hs-item"><strong>{{ tasks.length }}</strong><span>开放需求</span></div>
              <div class="hs-div"></div>
              <div class="hs-item"><strong>0%</strong><span>前30单免服务费</span></div>
              <div class="hs-div"></div>
              <div class="hs-item"><strong>💰</strong><span>托管保障</span></div>
            </div>
          </div>
        </div>

        <!-- 搜索 + 筛选 -->
        <div class="filter-row">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索任务..."
            :prefix-icon="Search"
            clearable
            size="large"
            class="search-input"
          />
          <el-select v-model="priceFilter" size="large" class="filter-select">
            <el-option label="全部赏金" value="all" />
            <el-option label="¥100以下" value="low" />
            <el-option label="¥100-500" value="mid" />
            <el-option label="¥500以上" value="high" />
          </el-select>
          <el-button size="large" @click="fetchData" :icon="Refresh">刷新</el-button>
        </div>

        <!-- 统计条 -->
        <div class="stats-row" v-if="tasks.length">
          <span>共 <strong>{{ tasks.length }}</strong> 个任务</span>
          <span>·</span>
          <span v-if="isLogin && currentUser">
            <router-link to="/my-task" class="link">我的发布</router-link>
          </span>
        </div>

        <!-- 任务卡片 -->
        <div v-loading="loading" class="task-grid">
          <el-empty v-if="!loading && !tasks.length" description="还没有任务，来做第一个发布者吧" />

          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-card"
            @click="$router.push(`/task/${task.id}`)"
          >
            <div class="card-top">
              <span class="card-category">
                {{ categoryLabel(task.category) }}
                <span v-if="task.isPublicWelfare" class="welfare-badge">公益</span>
              </span>
              <span class="card-mode" v-if="task.serviceMode !== 'ONLINE'">
                {{ task.serviceMode === 'OFFLINE' ? '📍线下' : '🌐均可' }}
              </span>
            </div>
            <h3 class="card-title">{{ task.title }}</h3>
            <p class="card-desc">{{ truncate(task.description, 80) }}</p>
            <div class="card-bottom">
              <span class="card-price">¥{{ (task.price / 100).toFixed(2) }}</span>
              <span class="card-meta">
                <span class="card-status" :class="task.status">{{ statusLabel(task.status) }}</span>
                <span class="card-views">👁 {{ task.views || 0 }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="page-footer">
          <span>浩煜 Haoyu — 可信价值协作平台</span>
          <span class="dot">·</span>
          <router-link to="/trust">信任与保障</router-link>
          <span class="dot">·</span>
          <span>资金托管 · 信用沉淀 · 争议协调</span>
        </div>
      </div>

      <!-- 子路由内容 -->
      <div class="content" v-else>
        <router-view />
      </div>
    </main>

    <!-- 发布对话框 -->
    <el-dialog v-model="showCreateDialog" title="发布新需求" width="560px" destroy-on-close>
      <el-form :model="createForm" label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="createForm.title" placeholder="简单描述你的需求" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.desc" type="textarea" :rows="3" placeholder="详细说明需求内容、要求等" />
        </el-form-item>
        <el-form-item label="赏金 (¥)">
          <el-input-number v-model="createForm.price" :min="1" :step="10" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="createForm.category" style="width:100%">
            <el-option label="技能服务" value="SKILL_SERVICE" />
            <el-option label="生活协助" value="LIFE_ASSISTANCE" />
            <el-option label="家庭关怀" value="FAMILY_CARE" />
            <el-option label="远程协助" value="REMOTE_ASSISTANCE" />
            <el-option label="社区协作" value="COMMUNITY_COLLABORATION" />
            <el-option label="公益互助" value="PUBLIC_WELFARE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务方式">
          <el-radio-group v-model="createForm.serviceMode">
            <el-radio label="ONLINE">线上</el-radio>
            <el-radio label="OFFLINE">线下</el-radio>
            <el-radio label="BOTH">均可</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTask" :loading="submitting">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Search, CaretBottom, List, Checked, Wallet, User, Document, Bell, Setting, Lock } from '@element-plus/icons-vue'
import { getTaskList, createTask, type Task } from '@/api/task'
import { createOrder } from '@/api/order'
import { getProfile, type UserProfile } from '@/api/user'
import { notificationApi } from '@/api/notification'
import { getWallet } from '@/api/wallet'

const router = useRouter()
const route = useRoute()

const isLogin = computed(() => !!localStorage.getItem('token'))
const currentUser = ref<UserProfile | null>(null)
const walletBalance = ref(0)
const unreadCount = ref(0)

const loading = ref(false)
const tasks = ref<Task[]>([])
const searchKeyword = ref('')
const priceFilter = ref('all')
const showCreateDialog = ref(false)
const submitting = ref(false)

const createForm = reactive({
  title: '',
  desc: '',
  price: 100,
  category: 'SKILL_SERVICE',
  serviceMode: 'ONLINE',
})

const canSeeUserManage = computed(() => {
  const role = currentUser.value?.role
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
})

const categoryLabel = (c: string) => {
  const m: Record<string, string> = {
    SKILL_SERVICE: '技能服务', LIFE_ASSISTANCE: '生活协助',
    FAMILY_CARE: '家庭关怀', REMOTE_ASSISTANCE: '远程协助',
    COMMUNITY_COLLABORATION: '社区协作', PUBLIC_WELFARE: '公益互助', OTHER: '其他',
  }
  return m[c] || c
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    PENDING: '待接单', ASSIGNED: '进行中', SUBMITTED: '待验收',
    COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中',
  }
  return m[s] || s
}

const truncate = (text: string, len: number) => {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '...' : text
}

const getFullUrl = (path: string) => {
  if (!path) return ''
  return path.startsWith('http') ? path : `http://localhost:3000${path}`
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getTaskList()
    let list = Array.isArray(res) ? res : res?.data || []
    if (searchKeyword.value) {
      const q = searchKeyword.value.toLowerCase()
      list = list.filter((t: any) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    if (priceFilter.value === 'low') list = list.filter((t: any) => t.price <= 9900)
    else if (priceFilter.value === 'mid') list = list.filter((t: any) => t.price >= 10000 && t.price <= 49900)
    else if (priceFilter.value === 'high') list = list.filter((t: any) => t.price >= 50000)
    tasks.value = list
  } catch { tasks.value = [] }
  finally { loading.value = false }
}

const openCreateDialog = () => {
  if (!isLogin.value) { router.push('/login'); return }
  showCreateDialog.value = true
}

const submitTask = async () => {
  if (!createForm.title.trim()) { ElMessage.warning('请输入标题'); return }
  submitting.value = true
  try {
    await createTask({
      title: createForm.title,
      description: createForm.desc,
      price: Math.round(createForm.price * 100),
      category: createForm.category,
      serviceMode: createForm.serviceMode,
    } as any)
    ElMessage.success('发布成功')
    showCreateDialog.value = false
    createForm.title = ''; createForm.desc = ''; createForm.price = 100
    fetchData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '发布失败') }
  finally { submitting.value = false }
}

const fetchProfile = async () => {
  try {
    const cached = localStorage.getItem('currentUser')
    if (cached) currentUser.value = JSON.parse(cached)
    if (isLogin.value) {
      const res = await getProfile()
      currentUser.value = res as any
      localStorage.setItem('currentUser', JSON.stringify(res))
    }
  } catch { currentUser.value = null }
}

const fetchWalletBalance = async () => {
  if (!isLogin.value) return
  try { const w: any = await getWallet(); walletBalance.value = w?.available ?? 0 } catch {}
}

const fetchUnreadCount = async () => {
  if (!isLogin.value) return
  try { const res: any = await notificationApi.unreadCount(); unreadCount.value = res?.count ?? res ?? 0 } catch {}
}

const handleCommand = (cmd: string) => {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'logout') {
    localStorage.clear(); currentUser.value = null; router.push('/task'); ElMessage.success('已退出')
  }
}

onMounted(() => { fetchProfile(); fetchUnreadCount(); fetchWalletBalance(); fetchData(); window.addEventListener("notification-read", fetchUnreadCount) })
</script>

<style>
/* 全局重置 */
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
</style>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }

/* === 侧边栏 === */
.sidebar {
  width: 200px; background: #fff; border-right: 1px solid #e2e8f0;
  display: flex; flex-direction: column; position: fixed; top: 0; bottom: 0; z-index: 100;
}
.logo { display: flex; align-items: center; gap: 8px; padding: 20px 16px; cursor: pointer; }
.logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
.logo-text { font-size: 18px; font-weight: 700; color: #1e293b; }
.nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px;
  color: #64748b; text-decoration: none; font-size: 14px; transition: all 0.15s; position: relative;
}
.nav-item:hover { background: #f1f5f9; color: #1e293b; }
.nav-item.active { background: #eef2ff; color: #6366f1; font-weight: 600; }
.nav-item.small { font-size: 12px; padding: 6px 12px; }
.badge {
  position: absolute; right: 10px; background: #ef4444; color: #fff; font-size: 11px;
  min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
}
.sidebar-footer { padding: 8px; border-top: 1px solid #e2e8f0; }

/* === 顶栏 === */
.topbar {
  height: 56px; background: #fff; border-bottom: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: space-between; padding: 0 24px;
  position: sticky; top: 0; z-index: 50;
}
.greeting { font-size: 14px; color: #64748b; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.balance-badge {
  background: #f0fdf4; color: #16a34a; padding: 4px 12px; border-radius: 20px;
  font-size: 13px; font-weight: 600;
}
.dropdown-trigger { cursor: pointer; font-size: 14px; color: #334155; display: flex; align-items: center; gap: 4px; }

/* === 主区域 === */
.main-area { flex: 1; margin-left: 200px; }
.content { max-width: 1000px; margin: 0 auto; padding: 0 24px 40px; }

/* === Hero === */
.hero {
  text-align: center; padding: 56px 0 40px;
  background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%);
}
.hero-glass {
  display: inline-block; max-width: 640px;
  background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.8); border-radius: 20px; padding: 40px 48px;
  box-shadow: 0 8px 32px rgba(99,102,241,0.06);
}
.hero-badge {
  display: inline-block; background: linear-gradient(135deg, #dbeafe, #ede9fe);
  color: #6366f1; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px;
}
.hero h1 { font-size: 30px; font-weight: 800; color: #1e293b; margin: 0 0 8px; letter-spacing: -0.5px; }
.hero p { font-size: 15px; color: #64748b; margin: 0 0 24px; line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; justify-content: center; }
.btn-glow { box-shadow: 0 4px 16px rgba(99,102,241,0.25); transition: all 0.3s; }
.btn-glow:hover { box-shadow: 0 6px 24px rgba(99,102,241,0.35); transform: translateY(-1px); }
.btn-outline { background: transparent; border: 1.5px solid #e2e8f0; color: #64748b; }
.btn-outline:hover { border-color: #6366f1; color: #6366f1; }
.hero-stats { display: flex; gap: 0; justify-content: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.05); }
.hs-item { padding: 0 20px; }
.hs-item strong { display: block; font-size: 18px; color: #1e293b; }
.hs-item span { display: block; font-size: 11px; color: #94a3b8; margin-top: 2px; }
.hs-div { width: 1px; background: #e2e8f0; }

/* === 筛选 === */
.filter-row {
  display: flex; gap: 12px; align-items: center; margin-bottom: 16px;
}
.search-input { max-width: 360px; }
.filter-select { width: 160px; }

/* === 统计 === */
.stats-row { display: flex; gap: 10px; align-items: center; font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
.stats-row strong { color: #475569; }
.link { color: #6366f1; text-decoration: none; }

/* === 卡片 === */
.task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.task-card {
  background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.9); border-radius: 16px; padding: 24px;
  cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative; overflow: hidden;
}
.task-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa); opacity: 0; transition: opacity 0.3s;
}
.task-card:hover::before { opacity: 1; }
.task-card:hover { border-color: #c7d2fe; box-shadow: 0 12px 40px rgba(99,102,241,0.1); transform: translateY(-2px); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-category {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
  background: linear-gradient(135deg, #eef2ff, #ede9fe); color: #6366f1; padding: 3px 10px; border-radius: 6px;
}
.welfare-badge { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; margin-left: 6px; font-size: 10px; font-weight: 600; }
.card-mode { font-size: 12px; color: #94a3b8; }
.card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 8px; line-height: 1.4; }
.card-desc { font-size: 13px; color: #94a3b8; margin: 0 0 16px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; }
.card-price { font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.card-meta { display: flex; gap: 10px; align-items: center; font-size: 12px; color: #94a3b8; }
.card-status.PENDING { color: #f59e0b; }
.card-status.ASSIGNED, .card-status.SUBMITTED { color: #6366f1; }
.card-status.COMPLETED { color: #16a34a; }
.card-views { color: #cbd5e1; }

/* === 页脚 === */
.page-footer {
  text-align: center; padding: 40px 0 20px; font-size: 13px; color: #94a3b8;
  display: flex; gap: 8px; justify-content: center;
}
.page-footer a { color: #6366f1; text-decoration: none; }
.dot { color: #cbd5e1; }
</style>
