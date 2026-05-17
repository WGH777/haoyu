<template>
  <div class="app-shell">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo" @click="$router.push('/task')">
        <span class="logo-mark">煜</span>
        <span class="logo-text">浩煜</span>
      </div>
      <nav class="nav">
        <router-link to="/task" class="nav-item" :class="{ active: $route.path === '/task' || $route.path === '/' }">
          <el-icon><List /></el-icon><span>任务大厅</span>
        </router-link>
        <template v-if="isLogin">
          <router-link to="/my-task" class="nav-item" :class="{ active: $route.path === '/my-task' }">
            <el-icon><Files /></el-icon><span>我的任务</span>
          </router-link>
          <router-link to="/my-orders" class="nav-item" :class="{ active: $route.path === '/my-orders' }">
            <el-icon><Connection /></el-icon><span>我接的订单</span>
          </router-link>
          <router-link to="/notifications" class="nav-item" :class="{ active: $route.path === '/notifications' }">
            <el-icon><Bell /></el-icon><span>通知</span>
            <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
          </router-link>
          <router-link to="/wallet" class="nav-item" :class="{ active: $route.path === '/wallet' }">
            <el-icon><Wallet /></el-icon><span>钱包</span>
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
      <header class="topbar">
        <div class="topbar-left">
          <span class="greeting">👋 {{ isLogin && currentUser ? currentUser.nickname : '可信价值协作平台' }}</span>
        </div>
        <div class="topbar-right">
          <span v-if="isLogin && currentUser" class="balance-badge">💰 ¥{{ (walletBalance / 100).toFixed(2) }}</span>
          <template v-if="isLogin">
            <el-avatar
              :size="34"
              :src="currentUser?.avatar ? getFullUrl(currentUser.avatar!) : undefined"
              :style="!currentUser?.avatar ? { backgroundColor: '#6366f1', color: '#fff', fontSize: '14px' } : {}"
            >
              {{ currentUser?.email?.[0]?.toUpperCase() || '?' }}
            </el-avatar>
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="dropdown-trigger">{{ currentUser?.nickname }} <el-icon><CaretBottom /></el-icon></span>
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

      <div class="content" v-if="$route.path === '/' || $route.path === '/task'">
        <!-- Hero -->
        <section class="hero">
          <div class="hero-bg"></div>
          <div class="hero-content">
            <span class="hero-tag">🔒 资金托管 · 信用沉淀 · 智能仲裁</span>
            <h1>浩煜<span class="glow-text"> Haoyu</span></h1>
            <p class="hero-subtitle">可信价值协作平台 — 连接真实需求，激活真实能力，保障可信交付</p>
            <div class="hero-actions">
              <el-button type="primary" size="large" round @click="openCreateDialog" v-if="isLogin" class="btn-glow">✨ 发布需求</el-button>
              <el-button size="large" round @click="$router.push('/register')" v-else class="btn-glow">免费注册</el-button>
              <el-button size="large" round class="btn-outline" @click="$router.push('/trust')">了解保障</el-button>
            </div>
          </div>
        </section>

        <!-- 数据看板 -->
        <section class="dashboard">
          <div class="stat-item">
            <span class="stat-number">{{ tasks.length }}</span>
            <span class="stat-label">开放需求</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">0%</span>
            <span class="stat-label">服务费率（前30单）</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">🔒</span>
            <span class="stat-label">资金托管保障</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">⚡</span>
            <span class="stat-label">智能调度匹配</span>
          </div>
        </section>

        <!-- 价值流转图 -->
        <section class="value-flow-enhanced">
          <div class="flow-step-dot done">
            <span class="flow-icon">📝</span>
            <span class="dot"></span>
            <span>需求发布</span>
          </div>
          <div class="flow-step-connector done"></div>
          <div class="flow-step-dot active">
            <span class="flow-icon">🔒</span>
            <span class="dot"></span>
            <span>资金托管</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">🤝</span>
            <span class="dot"></span>
            <span>协作执行</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">✅</span>
            <span class="dot"></span>
            <span>成果验收</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">💰</span>
            <span class="dot"></span>
            <span>价值结算</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">⭐</span>
            <span class="dot"></span>
            <span>信用沉淀</span>
          </div>
        </section>

        <!-- 搜索与筛选 -->
        <div class="filter-row">
          <el-input
            v-model="searchKeyword"
            placeholder="找需求、找能力、找协作机会"
            :prefix-icon="Search"
            clearable
            size="large"
            class="search-input"
          />
          <el-select v-model="priceFilter" size="large" class="filter-select">
            <el-option label="全部赏金" value="all" />
            <el-option label="¥100 以下" value="low" />
            <el-option label="¥100 – 500" value="mid" />
            <el-option label="¥500 以上" value="high" />
          </el-select>
          <el-button size="large" @click="fetchData" :icon="Refresh" class="btn-outline">刷新</el-button>
        </div>

        <!-- 主内容区（任务网格 + 榜单侧栏） -->
        <div class="market-layout">
          <!-- 左侧：任务卡片网格 -->
          <div class="market-main" v-loading="loading">
            <el-empty v-if="!loading && !tasks.length" description="这里暂时安静，新的需求可能正在路上 ✨">
              <el-button type="primary" round @click="openCreateDialog">发布第一个需求</el-button>
            </el-empty>

            <div class="task-grid">
              <div
                v-for="task in tasks"
                :key="task.id"
                class="task-card-premium"
                @click="$router.push(`/task/${task.id}`)"
              >
                <div class="premium-card-top">
                  <span class="premium-card-category">
                    {{ categoryLabel(task.category || '') }}
                    <span v-if="task.isPublicWelfare" class="welfare-badge">公益</span>
                  </span>
                  <span :class="['status-badge', statusClass(task.status)]">
                    {{ statusLabel(task.status) }}
                  </span>
                </div>

                <h3 class="premium-card-title">{{ task.title }}</h3>
                <p class="premium-card-desc">{{ truncate(task.description, 80) }}</p>

                <!-- 迷你进度条 -->
                <div class="progress-mini" style="margin-bottom: 12px;">
                  <div class="progress-fill" :style="{ width: progressPercent(task.status) }"></div>
                </div>

                <div class="premium-card-bottom">
                  <span class="premium-card-price glow-amber">¥{{ (task.price / 100).toFixed(2) }}</span>
                  <span class="premium-card-meta">
                    <span>{{ task.serviceMode === 'OFFLINE' ? '📍 线下' : task.serviceMode === 'BOTH' ? '🌐 均可' : '💻 线上' }}</span>
                    <span>👁 {{ task.views || 0 }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：榜单侧栏 -->
          <aside class="leaderboard-sidebar">
            <!-- 热门需求 -->
            <div class="leaderboard-panel">
              <div class="leaderboard-title">
                <span>🔥</span> 热门需求
              </div>
              <div v-if="tasks.length" class="leaderboard-list">
                <div
                  v-for="(t, idx) in tasks.slice(0, 5)"
                  :key="'hot-' + t.id"
                  class="leaderboard-item"
                  @click="$router.push(`/task/${t.id}`)"
                  style="cursor: pointer;"
                >
                  <span class="leaderboard-rank" :class="'top-' + (idx + 1)" v-if="idx < 3">{{ idx + 1 }}</span>
                  <span class="leaderboard-rank" v-else>{{ idx + 1 }}</span>
                  <span class="leaderboard-name">{{ truncate(t.title, 16) }}</span>
                  <span class="leaderboard-value">¥{{ (t.price / 100).toFixed(0) }}</span>
                </div>
              </div>
              <div v-else style="font-size: 12px; color: #64748b; text-align: center; padding: 12px 0;">
                暂无需求
              </div>
            </div>

            <!-- 完成榜 -->
            <div class="leaderboard-panel" style="margin-top: 16px;">
              <div class="leaderboard-title">
                <span>🏆</span> 完成榜
              </div>
              <div style="font-size: 12px; color: #64748b; text-align: center; padding: 20px 0;">
                协作完成后上榜
              </div>
            </div>

            <!-- 信用榜 -->
            <div class="leaderboard-panel" style="margin-top: 16px;">
              <div class="leaderboard-title">
                <span>⭐</span> 信用榜
              </div>
              <div style="font-size: 12px; color: #64748b; text-align: center; padding: 20px 0;">
                信用分达标后上榜
              </div>
            </div>

            <!-- 最新加入 -->
            <div class="leaderboard-panel" style="margin-top: 16px;">
              <div class="leaderboard-title">
                <span>🆕</span> 最新加入
              </div>
              <div style="font-size: 12px; color: #64748b; text-align: center; padding: 20px 0;">
                新用户加入后展示
              </div>
            </div>
          </aside>
        </div>

        <!-- 信任机制区 -->
        <section class="trust-section">
          <h3>🔒 浩煜信任引擎</h3>
          <p style="font-size:13px;color:#64748b;margin-bottom:20px;">每一次协作都有据可查，每一笔资金都有保障</p>
          <div class="trust-grid">
            <div class="trust-item"><span>💰</span> 资金托管</div>
            <div class="trust-item"><span>📝</span> 过程留痕</div>
            <div class="trust-item"><span>⭐</span> 信用沉淀</div>
            <div class="trust-item"><span>⚖️</span> 争议仲裁</div>
            <div class="trust-item"><span>🔍</span> 风控审计</div>
            <div class="trust-item"><span>🤖</span> AI 调度</div>
          </div>
        </section>

        <footer class="page-footer">
          <span>浩煜 Haoyu — 可信价值协作平台</span>
          <span class="dot">·</span>
          <router-link to="/trust">信任与保障</router-link>
          <span class="dot">·</span>
          <span>资金托管 · 信用沉淀 · 争议协调</span>
        </footer>
      </div>

      <div class="content" v-else>
        <router-view />
      </div>
    </main>

    <!-- 发布弹窗 -->
    <el-dialog v-model="showCreateDialog" title="发布新需求" width="560px" destroy-on-close>
      <el-form :model="createForm" label-position="top">
        <el-form-item label="给这次协作起个清楚的名字" required>
          <el-input v-model="createForm.title" placeholder="让人一眼知道你需要什么" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="说说背景、目标和期望">
          <el-input v-model="createForm.desc" type="textarea" :rows="3" placeholder="越具体，匹配到合适的人越快" />
        </el-form-item>
        <el-form-item label="你愿意为这个需求支付多少？（¥）">
          <el-input-number v-model="createForm.price" :min="1" :step="10" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="配图（可选）">
          <el-upload :http-request="handleUpload" :show-file-list="false" accept="image/*">
            <el-button type="primary" :loading="uploadingImg" class="upload-btn">
              {{ createForm.image ? '已选图片' : '添加参考图' }}
            </el-button>
          </el-upload>
          <p class="upload-hint" style="font-size:12px;color:rgba(203,213,225,0.48);margin-top:6px;">截图、样例图或补充说明都可以</p>
          <el-image v-if="createForm.image" :src="getFullUrl(createForm.image)" style="width:100px;height:100px;border-radius:8px;margin-top:8px" fit="cover" />
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
        <el-button type="primary" @click="submitTask" :loading="submitting">确认发布</el-button>
      </template>
    </el-dialog>
  </div>

  <!-- 移动端底部导航 -->
  <nav class="mobile-nav">
    <router-link to="/task" class="mn-item" :class="{ active: $route.path === '/task' || $route.path === '/' }">
      <el-icon><List /></el-icon><span>大厅</span>
    </router-link>
    <router-link to="/my-task" class="mn-item" :class="{ active: $route.path === '/my-task' }">
      <el-icon><Files /></el-icon><span>我的</span>
    </router-link>
    <router-link to="/my-orders" class="mn-item" :class="{ active: $route.path === '/my-orders' }">
      <el-icon><Connection /></el-icon><span>订单</span>
    </router-link>
    <div class="mn-item" @click="openCreateDialog" v-if="isLogin">
      <span class="mn-publish">＋</span><span>发布</span>
    </div>
    <router-link to="/notifications" class="mn-item" :class="{ active: $route.path === '/notifications' }">
      <el-icon><Bell /></el-icon><span>通知</span>
      <span v-if="unreadCount" class="mn-badge">{{ unreadCount }}</span>
    </router-link>
    <router-link to="/wallet" class="mn-item" :class="{ active: $route.path === '/wallet' }">
      <el-icon><Wallet /></el-icon><span>钱包</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Search, CaretBottom, List, Checked, Wallet, User, Document, Bell, Setting, Lock, Files, Connection } from '@element-plus/icons-vue'
import { getTaskList, createTask, uploadTaskImage, type Task } from '@/api/task'
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
const uploadingImg = ref(false)

const createForm = reactive({
  title: '', desc: '', price: 100, category: 'SKILL_SERVICE', serviceMode: 'ONLINE', image: ''
})

const canSeeUserManage = computed(() =>
  ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.value?.role || '')
)

// === 工具函数 ===
const categoryLabel = (c: string) => {
  const m: Record<string, string> = {
    SKILL_SERVICE: '技能', LIFE_ASSISTANCE: '生活', FAMILY_CARE: '家庭',
    REMOTE_ASSISTANCE: '远程', COMMUNITY_COLLABORATION: '社区',
    PUBLIC_WELFARE: '公益', OTHER: '其他'
  }
  return m[c] || c
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    PENDING: '待接单', ASSIGNED: '进行中', IN_PROGRESS: '服务中',
    SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中'
  }
  return m[s] || s
}

const statusClass = (s: string) => {
  const m: Record<string, string> = {
    PENDING: 'pending', ASSIGNED: 'active', IN_PROGRESS: 'active',
    SUBMITTED: 'active', COMPLETED: 'done', CANCELLED: 'danger', DISPUTED: 'danger'
  }
  return m[s] || 'pending'
}

const progressPercent = (s: string) => {
  const m: Record<string, string> = {
    PENDING: '0%', ASSIGNED: '25%', IN_PROGRESS: '50%',
    SUBMITTED: '75%', COMPLETED: '100%', CANCELLED: '100%', DISPUTED: '100%'
  }
  return m[s] || '0%'
}

const truncate = (text: string, len: number) =>
  text && text.length > len ? text.slice(0, len) + '...' : text || ''

const getFullUrl = (path: string) =>
  path ? (path.startsWith('http') ? path : `http://localhost:3000${path}`) : ''

// === 数据请求 ===
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getTaskList()
    let list = Array.isArray(res) ? res : res?.data || []
    if (searchKeyword.value) {
      list = list.filter((t: any) =>
        t.title?.includes(searchKeyword.value) || t.description?.includes(searchKeyword.value)
      )
    }
    if (priceFilter.value === 'low') list = list.filter((t: any) => t.price <= 9900)
    else if (priceFilter.value === 'mid') list = list.filter((t: any) => t.price >= 10000 && t.price <= 49900)
    else if (priceFilter.value === 'high') list = list.filter((t: any) => t.price >= 50000)
    tasks.value = list
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
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
      image: createForm.image || undefined
    } as any)
    ElMessage.success('需求已发布，等待合适的人来接单')
    showCreateDialog.value = false
    createForm.title = ''; createForm.desc = ''; createForm.price = 100; createForm.image = ''
    fetchData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const handleUpload = async (options: any) => {
  uploadingImg.value = true
  try {
    const fd = new FormData(); fd.append('file', options.file)
    const res: any = await uploadTaskImage(fd)
    createForm.image = res?.url || ''
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploadingImg.value = false
  }
}

// === 个人信息 ===
const fetchProfile = async () => {
  try {
    if (isLogin.value) {
      const res = await getProfile()
      currentUser.value = res as any
      localStorage.setItem('currentUser', JSON.stringify(res))
    }
  } catch {
    currentUser.value = null
  }
}

const fetchUnreadCount = async () => {
  if (!isLogin.value) return
  try {
    const r: any = await notificationApi.unreadCount()
    unreadCount.value = r?.count ?? r ?? 0
  } catch {}
}

const fetchWalletBalance = async () => {
  if (!isLogin.value) return
  try {
    const w: any = await getWallet()
    walletBalance.value = w?.available ?? 0
  } catch {}
}

const handleCommand = (cmd: string) => {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'logout') {
    localStorage.clear()
    ElMessage.success('已退出登录')
    // 直接跳转首页，让 Vue 重新初始化，避免状态残留
    window.location.href = '/task'
  }
}

onMounted(() => {
  fetchProfile()
  fetchUnreadCount()
  fetchWalletBalance()
  fetchData()
  window.addEventListener('notification-read', fetchUnreadCount as any)
})
</script>

<style scoped>
/* ==========================================
   布局
   ========================================== */
.app-shell { display: flex; min-height: 100vh; }

/* === 侧边栏 === */
.sidebar {
  width: 200px; background: rgba(10, 14, 23, 0.95); backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  display: flex; flex-direction: column;
  position: fixed; top: 0; bottom: 0; z-index: 100;
}
.logo { display: flex; align-items: center; gap: 8px; padding: 20px 16px; cursor: pointer; }
.logo-mark {
  width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-radius: 8px; display: flex; align-items: center;
  justify-content: center; font-size: 18px; font-weight: 700;
}
.logo-text { font-size: 18px; font-weight: 700; color: #f1f5f9; }
.nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 8px; color: #94a3b8; text-decoration: none; font-size: 14px;
  transition: all 0.2s; position: relative;
}
.nav-item:hover { background: rgba(99, 102, 241, 0.08); color: #f1f5f9; }
.nav-item.active { background: rgba(99, 102, 241, 0.12); color: #a5b4fc; font-weight: 600; }
.nav-item.small { font-size: 12px; padding: 6px 12px; }
.badge {
  position: absolute; right: 10px; background: #ef4444; color: #fff;
  font-size: 11px; min-width: 18px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}
.sidebar-footer { padding: 8px; border-top: 1px solid rgba(148, 163, 184, 0.1); }

/* === 顶栏 === */
.topbar {
  height: 56px; background: rgba(10, 14, 23, 0.8); backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; position: sticky; top: 0; z-index: 50;
}
.greeting { font-size: 14px; color: #94a3b8; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.balance-badge {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7; padding: 4px 12px; border-radius: 20px;
  font-size: 13px; font-weight: 600;
}
.dropdown-trigger {
  cursor: pointer; font-size: 14px; color: #cbd5e1;
  display: flex; align-items: center; gap: 4px;
}

/* === 主区域 === */
.main-area { flex: 1; margin-left: 200px; background: #0a0e17; min-height: 100vh; }
.content { max-width: 1200px; margin: 0 auto; padding: 0 24px 40px; }

/* === Hero === */
.hero {
  position: relative; overflow: hidden; padding: 64px 0 48px; text-align: center;
}
.hero-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.04) 0%, transparent 50%);
}
.hero-content { position: relative; z-index: 1; }
.hero-tag {
  display: inline-block; padding: 4px 16px; border-radius: 20px;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  color: #a5b4fc; font-size: 12px; font-weight: 600;
  margin-bottom: 16px; letter-spacing: 0.5px;
}
.hero h1 {
  font-size: 40px; font-weight: 800; color: #f1f5f9;
  margin: 0 0 12px; letter-spacing: -1px;
}
.hero-subtitle { font-size: 16px; color: #94a3b8; margin: 0 0 28px; }
.hero-actions { display: flex; gap: 12px; justify-content: center; }
.btn-glow {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  box-shadow: 0 4px 20px rgba(99,102,241,0.3);
}
.btn-glow:hover {
  box-shadow: 0 6px 30px rgba(99,102,241,0.5);
  transform: translateY(-1px);
}
.btn-outline {
  background: transparent !important;
  border: 1px solid rgba(148,163,184,0.2) !important;
  color: #94a3b8 !important;
}
.btn-outline:hover {
  border-color: #6366f1 !important;
  color: #a5b4fc !important;
}

/* === 数据看板 === */
.dashboard {
  display: flex; justify-content: center; gap: 0; margin-bottom: 32px;
  padding: 24px;
  background: rgba(17,24,39,0.45);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.stat-item { flex: 1; text-align: center; padding: 0 16px; }
.stat-divider { width: 1px; background: rgba(148,163,184,0.12); }

/* === 价值流转图（增强版） === */
.value-flow-enhanced {
  display: flex; align-items: flex-start; justify-content: center;
  margin-bottom: 32px; padding: 20px 24px;
  background: rgba(17,24,39,0.3);
  border: 1px solid rgba(148,163,184,0.08);
  border-radius: 14px;
  overflow-x: auto;
}
.value-flow-enhanced .flow-icon { font-size: 18px; margin-bottom: 4px; }

/* === 筛选行 === */
.filter-row {
  display: flex; gap: 12px; align-items: center; margin-bottom: 24px;
}
.search-input { max-width: 380px; }
.filter-select { width: 170px; }
.filter-select .el-input__wrapper {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  box-shadow: none !important;
}

/* 上传按钮 */
.upload-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.86), rgba(139, 92, 246, 0.86)) !important;
  border: 1px solid rgba(129, 140, 248, 0.30) !important;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.20) !important;
}

/* ==========================================
   市场布局（任务网格 + 榜单侧栏）
   ========================================== */
.market-layout {
  display: flex; gap: 24px; margin-bottom: 40px; align-items: flex-start;
}
.market-main { flex: 1; min-width: 0; }

/* 任务卡片网格 */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 20px;
}

/* 福利标签微调 */
.welfare-badge {
  background: rgba(245,158,11,0.15);
  color: #fcd34d;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 6px;
  font-size: 10px;
}

/* === 榜单侧栏 === */
.leaderboard-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 72px;
}

/* === 信任机制 === */
.trust-section {
  margin-bottom: 40px; padding: 32px;
  background: rgba(17,24,39,0.35);
  border: 1px solid rgba(148,163,184,0.08);
  border-radius: 14px; text-align: center;
}
.trust-section h3 { font-size: 18px; color: #f1f5f9; margin-bottom: 8px; }
.trust-grid {
  display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;
}
.trust-item {
  font-size: 14px; color: #94a3b8;
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: rgba(17,24,39,0.5);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 8px;
}
.trust-item span { font-size: 16px; }

/* === 页脚 === */
.page-footer {
  text-align: center; padding: 24px 0; font-size: 13px;
  color: #475569; display: flex; gap: 8px; justify-content: center;
}
.page-footer a { color: #818cf8; }
.dot { color: #334155; }

/* ==========================================
   移动端底部导航
   ========================================== */
.mobile-nav {
  display: none;
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: rgba(10, 14, 23, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  z-index: 200;
  justify-content: space-around; align-items: center;
}
.mn-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px;
  min-width: 48px; min-height: 48px;
  color: #64748b; text-decoration: none; font-size: 11px;
  position: relative; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: color 0.15s ease;
}
.mn-item .el-icon { font-size: 20px; }
.mn-item.active { color: #a5b4fc; }
.mn-item:active { color: #c7d2fe; }
.mn-publish {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 26px;
  display: flex; align-items: center; justify-content: center;
  margin-top: -20px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
}
.mn-publish:active {
  transform: scale(0.92);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.25);
}
.mn-badge {
  position: absolute; top: 0; right: -6px;
  background: #ef4444; color: #fff;
  font-size: 10px; min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}

/* ==========================================
   响应式
   ========================================== */
@media (max-width: 1024px) {
  .leaderboard-sidebar {
    display: none !important;
  }
  .content {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .mobile-nav { display: flex !important; }
  .app-shell {
    max-width: 100vw;
    overflow-x: hidden;
  }
  .app-shell > .sidebar { display: none !important; }
  .main-area {
    margin-left: 0 !important;
    width: 100% !important;
    max-width: 100vw;
    padding-bottom: 80px !important;
  }
  .topbar { padding: 0 12px !important; }
  .topbar .greeting { font-size: 13px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .content { padding: 0 12px 32px !important; max-width: 100vw; }
  .hero { padding: 32px 0 24px !important; }
  .hero h1 { font-size: 24px !important; }
  .hero-subtitle { font-size: 14px !important; }
  .hero-actions { flex-direction: column; align-items: center; gap: 10px; }
  .hero-actions .el-button { width: 80%; }
  .dashboard { flex-wrap: wrap; gap: 8px; padding: 14px; }
  .stat-item { flex: 1 1 40%; min-width: 120px; padding: 8px; }
  .stat-divider { display: none; }
  .value-flow-enhanced { gap: 4px; padding: 10px; overflow-x: auto; }
  .value-flow-enhanced .flow-step-connector { min-width: 8px; }
  .task-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
  .market-layout { flex-direction: column; }
  .filter-row { flex-wrap: wrap; gap: 8px; }
  .filter-row .el-button { flex-shrink: 0; }
  .search-input { max-width: 100% !important; flex: 1; }
  .filter-select { width: 130px !important; flex-shrink: 0; }
  .trust-grid { gap: 8px; }
  .trust-item { font-size: 12px; padding: 6px 10px; }
  .balance-badge { display: none; }
}
</style>
