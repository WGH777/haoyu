<template>
  <div class="desktop-landing">
    <!-- A. 顶部导航 -->
    <nav class="dl-nav">
      <div class="dl-nav-inner">
        <div class="dl-nav-brand" @click="$router.push('/')">
          <span class="dl-brand-logo">煜</span>
          <span class="dl-brand-name">浩煜</span>
          <span class="dl-brand-tagline">· 万家灯火</span>
        </div>
        <div class="dl-nav-links">
          <a class="dl-nav-link active" @click.prevent="$router.push('/')">首页</a>
          <a class="dl-nav-link" @click.prevent="$router.push('/task')">任务大厅</a>
          <a class="dl-nav-link" @click.prevent="$router.push('/trust')">信任中心</a>
        </div>
        <div class="dl-nav-search">
          <el-input
            v-model="searchKeyword"
            placeholder="找需求、找能力……"
            :prefix-icon="SearchIcon"
            clearable
            size="small"
            class="dl-search-input"
          />
        </div>
        <div class="dl-nav-actions">
          <template v-if="isLogin">
            <span class="dl-balance">💰 {{ formatYumiCompactFromCent(walletBalance) }} 煜米</span>
            <el-avatar :size="30" style="background:#6366f1;cursor:pointer" @click="$router.push('/task')">
              {{ userInitial }}
            </el-avatar>
          </template>
          <template v-else>
            <el-button size="small" @click="$router.push('/login')" class="dl-btn-outline">登录</el-button>
            <el-button size="small" type="warning" @click="$router.push('/register')" class="dl-btn-warm">注册</el-button>
          </template>
        </div>
      </div>
    </nav>

    <!-- B. Hero 首屏 -->
    <section class="dl-hero">
      <div class="dl-hero-bg">
        <img :src="cityLights" alt="" class="dl-hero-bg-img" aria-hidden="true" />
        <img :src="lanterns" alt="" class="dl-hero-lanterns" aria-hidden="true" />
        <div class="dl-hero-glow"></div>
      </div>
      <div class="dl-hero-content">
        <h1 class="dl-hero-title">
          浩煜<span class="dl-hero-accent"> · 万家灯火，总有你的一颗</span>
        </h1>
        <p class="dl-hero-subtitle">
          万家灯火因你而亮，专业协作让每一份热爱落地生花
        </p>
        <div class="dl-hero-actions">
          <el-button type="warning" size="large" round @click="handlePublish" class="dl-hero-cta-gold">✨ 发布需求</el-button>
          <el-button size="large" round plain class="dl-hero-cta-outline" @click="$router.push('/task')">探索任务 →</el-button>
        </div>
        <div class="dl-hero-trust">
          <span class="dl-trust-item"><span class="dl-trust-icon">✅</span> 实名认证</span>
          <span class="dl-trust-divider"></span>
          <span class="dl-trust-item"><span class="dl-trust-icon">🔒</span> 资金托管</span>
          <span class="dl-trust-divider"></span>
          <span class="dl-trust-item"><span class="dl-trust-icon">⭐</span> 服务评价</span>
        </div>
      </div>
    </section>

    <!-- C. 数据背书横条 -->
    <section class="dl-stats">
      <div class="dl-stats-inner">
        <div v-for="(item, i) in stats" :key="i" class="dl-stat-card">
          <div class="dl-stat-icon">{{ item.icon }}</div>
          <div class="dl-stat-body">
            <span class="dl-stat-num">{{ item.num }}</span>
            <span class="dl-stat-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- D. 五步流程 -->
    <section class="dl-flow">
      <div class="dl-flow-inner">
        <div v-for="(step, i) in steps" :key="i" class="dl-flow-step">
          <div class="dl-flow-step-icon">{{ step.icon }}</div>
          <span class="dl-flow-step-label">{{ step.label }}</span>
          <span class="dl-flow-step-desc">{{ step.desc }}</span>
          <div v-if="i < steps.length - 1" class="dl-flow-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 5l6 7-6 7" stroke="#475569" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
        </div>
      </div>
    </section>

    <!-- E. 热门服务分类 -->
    <section class="dl-categories">
      <h3 class="dl-section-title">🔖 热门服务</h3>
      <div class="dl-cat-grid">
        <div v-for="cat in categories" :key="cat.label" class="dl-cat-item" @click="$router.push('/task')">
          <img :src="cat.icon" :alt="cat.label" class="dl-cat-icon" />
          <span class="dl-cat-label">{{ cat.label }}</span>
        </div>
      </div>
    </section>

    <!-- F. 精选任务 -->
    <section class="dl-featured">
      <div class="dl-featured-top">
        <h3 class="dl-section-title">🔥 精选任务</h3>
        <a class="dl-view-all" @click.prevent="$router.push('/task')">查看全部 →</a>
      </div>
      <div class="dl-featured-grid">
        <div v-for="t in featuredTasks" :key="t.id" class="dl-task-card" @click="$router.push(`/task/${t.id}`)">
          <div class="dl-card-cover">
            <img :src="getCover(t)" :alt="t.title" class="dl-card-cover-img" />
            <span v-if="t.price >= 50000" class="dl-card-hot">🔥 高预算</span>
            <span v-else-if="isNew(t)" class="dl-card-new">🆕 新发布</span>
          </div>
          <div class="dl-card-body">
            <div class="dl-card-tags">
              <span class="dl-card-cat">{{ catLabel(t.category) }}</span>
              <span :class="['dl-card-status', statusClass(t.status)]">{{ statusLabel(t.status) }}</span>
            </div>
            <h4 class="dl-card-title">{{ truncate(t.title, 30) }}</h4>
            <div class="dl-card-bottom">
              <span class="dl-card-price">{{ formatYumiCompactFromCent(t.price) }} 煜米</span>
              <span class="dl-card-time">{{ timeAgo(t.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- G. 底部品牌区 -->
    <section class="dl-footer-band">
      <img :src="wheatBand" alt="" class="dl-wheat-bg" aria-hidden="true" />
      <div class="dl-footer-content">
        <p class="dl-footer-text">在浩煜，每一份付出被看见，每一次信任都点亮生活的光。</p>
        <p class="dl-footer-sub">🏮 浩煜 · 万家灯火</p>
      </div>
    </section>

    <!-- 页脚底部 -->
    <footer class="dl-legal">
      <span>© 2026 浩煜 HaoYu</span>
      <span class="dl-dot">·</span>
      <span>万家灯火 · 可信协作平台</span>
      <span class="dl-dot">·</span>
      <router-link to="/trust">信任与保障</router-link>
    </footer>

    <!-- 发布弹窗 -->
    <CreateTaskDialog v-model="showCreateDialog" @published="fetchTasks" />

    <!-- 移动端底部 Tab / 菜单 -->
    <MobileBottomTabs :is-login="isLogin" @publish="handlePublish" />
    <MobileDrawerMenu
      :open="mobileDrawerOpen"
      :is-login="isLogin"
      :user="currentUser"
      title="浩煜"
      :items="mobileMenuItems"
      @update:open="mobileDrawerOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatYumiCompactFromCent } from '@/utils/money'
import { getTaskList, type Task } from '@/api/task'
import { getProfile, type UserProfile } from '@/api/user'
import { getWallet } from '@/api/wallet'
import { notificationApi } from '@/api/notification'

import cityLights from '@/assets/haoyu-v027/hero-city-lights.svg'
import lanterns from '@/assets/haoyu-v027/hero-lanterns.svg'
import wheatBand from '@/assets/haoyu-v027/wheat-glow-band.svg'

import iconDesign from '@/assets/haoyu-v027/category-icons/icon-design.svg'
import iconDev from '@/assets/haoyu-v027/category-icons/icon-dev.svg'
import iconService from '@/assets/haoyu-v027/category-icons/icon-service.svg'
import iconVideo from '@/assets/haoyu-v027/category-icons/icon-video.svg'
import iconMarketing from '@/assets/haoyu-v027/category-icons/icon-marketing.svg'
import iconWriting from '@/assets/haoyu-v027/category-icons/icon-writing.svg'
import iconData from '@/assets/haoyu-v027/category-icons/icon-data.svg'
import iconTrust from '@/assets/haoyu-v027/category-icons/icon-trust.svg'

import coverDesign from '@/assets/haoyu-v027/task-covers/task-cover-design.svg'
import coverDev from '@/assets/haoyu-v027/task-covers/task-cover-dev.svg'
import coverVideo from '@/assets/haoyu-v027/task-covers/task-cover-video.svg'
import coverMarketing from '@/assets/haoyu-v027/task-covers/task-cover-marketing.svg'
import coverWriting from '@/assets/haoyu-v027/task-covers/task-cover-writing.svg'
import coverData from '@/assets/haoyu-v027/task-covers/task-cover-data.svg'

import CreateTaskDialog from '@/components/home/CreateTaskDialog.vue'
import MobileBottomTabs from '@/components/home/MobileBottomTabs.vue'
import MobileDrawerMenu from '@/components/home/MobileDrawerMenu.vue'

const SearchIcon = markRaw(Search)
const router = useRouter()

// Auth / User
const isLogin = computed(() => !!localStorage.getItem('token'))
const currentUser = ref<UserProfile | null>(null)
const walletBalance = ref(0)
const unreadCount = ref(0)
const mobileDrawerOpen = ref(false)
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const tasks = ref<Task[]>([])

const userInitial = computed(() => currentUser.value?.email?.[0]?.toUpperCase() || '?')

const mobileMenuItems = computed(() => {
  const items: any[] = [{ label: '任务大厅', path: '/task', icon: 'List' }]
  if (isLogin.value) {
    items.push(
      { label: '我的任务', path: '/my-task', icon: 'Tickets' },
      { label: '通知', path: '/notifications', icon: 'Bell', badge: unreadCount.value },
      { label: '钱包', path: '/wallet', icon: 'Wallet' },
    )
  }
  items.push({ label: '信任中心', path: '/trust', icon: 'Lock' })
  return items
})

const handlePublish = () => {
  if (!isLogin.value) { router.push('/login'); return }
  showCreateDialog.value = true
}

// Stats
const stats = [
  { icon: '👥', num: '10万+', label: '注册用户' },
  { icon: '📋', num: '3万+', label: '完成任务' },
  { icon: '⭐', num: '98.6%', label: '好评率' },
  { icon: '💰', num: '1.2亿+', label: '托管资金' },
]

// Steps
const steps = [
  { icon: '📝', label: '发布需求', desc: '描述你的需求' },
  { icon: '🔒', label: '资金托管', desc: '平台安全托管' },
  { icon: '🤝', label: '协作交付', desc: '按时交付成果' },
  { icon: '✅', label: '验收确认', desc: '满意后确认' },
  { icon: '⭐', label: '信用沉淀', desc: '积累信用值' },
]

// Categories
const categories = [
  { label: '设计创意', icon: iconDesign },
  { label: '技术开发', icon: iconDev },
  { label: '生活服务', icon: iconService },
  { label: '视频制作', icon: iconVideo },
  { label: '营销推广', icon: iconMarketing },
  { label: '文案策划', icon: iconWriting },
  { label: '数据标注', icon: iconData },
  { label: '更多服务', icon: iconTrust },
]

// Tasks
const featuredTasks = computed(() => tasks.value.slice(0, 6))

const fetchTasks = async () => {
  try {
    const res: any = await getTaskList()
    tasks.value = Array.isArray(res) ? res : res?.data || []
  } catch {
    tasks.value = []
  }
}

// Task helpers
const catLabel = (c: string | undefined) => {
  const m: Record<string, string> = {
    SKILL_SERVICE: '技能', LIFE_ASSISTANCE: '生活', FAMILY_CARE: '家庭',
    REMOTE_ASSISTANCE: '远程', COMMUNITY_COLLABORATION: '社区', PUBLIC_WELFARE: '公益', OTHER: '其他'
  }
  return m[c || ''] || c || ''
}
const statusLabel = (s: string | undefined) => {
  const m: Record<string, string> = {
    PENDING: '待接单', ASSIGNED: '进行中', IN_PROGRESS: '服务中',
    SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中'
  }
  return m[s || ''] || s || ''
}
const statusClass = (s: string | undefined) => {
  const m: Record<string, string> = {
    PENDING: 'pending', ASSIGNED: 'active', IN_PROGRESS: 'active',
    SUBMITTED: 'active', COMPLETED: 'done', CANCELLED: 'danger', DISPUTED: 'danger'
  }
  return m[s || ''] || 'pending'
}
const isNew = (t: { createdAt?: string }) => {
  if (!t.createdAt) return false
  return Date.now() - new Date(t.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
}
const truncate = (t: string | undefined, n: number) => (t && t.length > n ? t.slice(0, n) + '…' : t) || ''
const timeAgo = (d?: string) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return m + '分钟前'
  const h = Math.floor(m / 60)
  if (h < 24) return h + '小时前'
  return Math.floor(h / 24) + '天前'
}
const getCover = (t: any) => {
  if (t.image || (t as any).referenceImage) {
    const img = t.image || (t as any).referenceImage || ''
    return img.startsWith('http') ? img : 'http://localhost:3000' + img
  }
  const c = t.category || 'OTHER'
  const map: Record<string, string> = {
    SKILL_SERVICE: coverDev, LIFE_ASSISTANCE: coverService, FAMILY_CARE: coverService,
    REMOTE_ASSISTANCE: coverDev, PUBLIC_WELFARE: coverDesign, OTHER: coverDesign,
  }
  return map[c] || coverDesign
}

const coverService = coverDesign // fallback for LIFE_ASSISTANCE

// Profile / Wallet / Unread
const fetchProfile = async () => {
  try {
    const cached = localStorage.getItem('currentUser')
    if (cached) { currentUser.value = JSON.parse(cached) }
    const res = await getProfile()
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch { currentUser.value = null }
}
const fetchWallet = async () => {
  if (!isLogin.value) return
  try { const w: any = await getWallet(); walletBalance.value = w?.available ?? 0 } catch {}
}
const fetchUnread = async () => {
  if (!isLogin.value) return
  try { const r: any = await notificationApi.unreadCount(); unreadCount.value = r?.count ?? 0 } catch {}
}

onMounted(async () => {
  await Promise.all([fetchTasks(), fetchProfile(), fetchWallet(), fetchUnread()])
})
</script>

<style>
/* === 全局重置（仅 Landing 作用域） === */
body {
  background: #0a0e17 !important;
  margin: 0;
}
.desktop-landing {
  background: #0a0e17;
  min-height: 100vh;
  color: #f1f5f9;
  overflow-x: hidden;
}
</style>

<style scoped>
/* === A. 顶部导航 === */
.dl-nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(8,13,26,0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(148,163,184,0.08);
}
.dl-nav-inner {
  max-width: 1280px; margin: 0 auto;
  display: flex; align-items: center; gap: 16px;
  height: 60px; padding: 0 24px;
}
.dl-nav-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
.dl-brand-logo {
  width: 30px; height: 30px; border-radius: 7px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px;
}
.dl-brand-name { font-size: 17px; font-weight: 700; color: #f1f5f9; }
.dl-brand-tagline { font-size: 13px; color: #fbbf24; }
.dl-nav-links { display: flex; gap: 4px; }
.dl-nav-link {
  padding: 6px 14px; border-radius: 8px;
  color: #94a3b8; font-size: 14px; cursor: pointer; text-decoration: none;
  transition: all 0.15s;
}
.dl-nav-link:hover { color: #cbd5e1; background: rgba(255,255,255,0.04); }
.dl-nav-link.active { color: #a5b4fc; background: rgba(99,102,241,0.1); }
.dl-nav-search { flex: 1; max-width: 260px; }
.dl-search-input { --el-input-bg-color: rgba(255,255,255,0.04); }
.dl-nav-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-shrink: 0; }
.dl-balance {
  padding: 3px 12px; border-radius: 14px;
  background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.18);
  color: #fcd34d; font-size: 13px; font-weight: 600;
}
.dl-btn-outline {
  background: transparent !important; border: 1px solid rgba(148,163,184,0.2) !important;
  color: #94a3b8 !important;
}
.dl-btn-warm {
  font-weight: 700 !important;
}

/* === B. Hero === */
.dl-hero {
  position: relative; overflow: hidden;
  padding: 100px 24px 80px; text-align: center;
  min-height: 620px; display: flex; align-items: center; justify-content: center;
}
.dl-hero-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.dl-hero-bg-img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }
.dl-hero-lanterns {
  position: absolute; top: 3%; right: 5%;
  width: 42%; max-width: 400px; height: auto; pointer-events: none;
  opacity: 0.85;
}
.dl-hero-glow {
  position: absolute; left: 50%; bottom: -60px;
  width: min(900px, 100vw); height: 200px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(251,191,36,0.15) 0%, transparent 60%);
  pointer-events: none; z-index: 0;
}
.dl-hero-content { position: relative; z-index: 1; max-width: 820px; margin: 0 auto; }
.dl-hero-title {
  font-size: 52px; font-weight: 900; color: #f1f5f9;
  margin: 0 0 16px; letter-spacing: -2px; line-height: 1.1;
  text-shadow: 0 0 40px rgba(99,102,241,0.1);
}
.dl-hero-accent {
  background: linear-gradient(135deg, #a5b4fc 0%, #fcd34d 50%, #67e8f9 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.dl-hero-subtitle {
  font-size: 17px; color: #94a3b8; margin: 0 auto 28px;
  max-width: 600px; line-height: 1.6;
}
.dl-hero-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 36px; }
.dl-hero-cta-gold {
  font-weight: 800 !important; font-size: 17px !important;
  color: #0f172a !important; padding: 16px 36px !important;
  border-radius: 999px !important;
  box-shadow: 0 8px 32px rgba(251,191,36,0.35) !important;
  transition: all 0.3s !important;
}
.dl-hero-cta-gold:hover { transform: translateY(-2px); box-shadow: 0 12px 42px rgba(251,191,36,0.5) !important; }
.dl-hero-cta-outline {
  background: transparent !important; border: 1px solid rgba(148,163,184,0.25) !important;
  color: #cbd5e1 !important; font-size: 17px !important; padding: 16px 36px !important;
  border-radius: 999px !important; transition: all 0.3s !important;
}
.dl-hero-cta-outline:hover { border-color: #6366f1 !important; color: #a5b4fc !important; }
.dl-hero-trust {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 14px 24px;
  background: rgba(15,23,42,0.55);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 999px;
  display: inline-flex; margin: 0 auto;
}
.dl-trust-item { font-size: 13px; color: #cbd5e1; display: flex; align-items: center; gap: 5px; }
.dl-trust-icon { font-size: 14px; }
.dl-trust-divider { width: 1px; height: 18px; background: rgba(148,163,184,0.15); }

/* === C. 数据横条 === */
.dl-stats { max-width: 1280px; margin: -40px auto 48px; padding: 0 24px; position: relative; z-index: 2; }
.dl-stats-inner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.dl-stat-card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(180deg, rgba(17,24,39,0.78), rgba(15,23,42,0.55));
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 18px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.15);
}
.dl-stat-icon { font-size: 32px; line-height: 1; }
.dl-stat-body { display: flex; flex-direction: column; gap: 2px; }
.dl-stat-num {
  font-size: 22px; font-weight: 800;
  background: linear-gradient(135deg, #a5b4fc, #67e8f9);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.dl-stat-label { font-size: 13px; color: #64748b; }

/* === D. 五步流程 === */
.dl-flow { max-width: 1280px; margin: 0 auto 48px; padding: 0 24px; }
.dl-flow-inner { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.dl-flow-step {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  text-align: center; min-width: 130px;
  padding: 22px 14px;
  background: linear-gradient(135deg, rgba(17,24,39,0.55), rgba(15,23,42,0.3));
  border: 1px solid rgba(148,163,184,0.08);
  border-radius: 18px;
  position: relative;
}
.dl-flow-step-icon { font-size: 32px; line-height: 1; }
.dl-flow-step-label { font-size: 14px; font-weight: 700; color: #e2e8f0; }
.dl-flow-step-desc { font-size: 11px; color: #64748b; white-space: nowrap; }
.dl-flow-arrow { display: none; }
@media (min-width: 700px) {
  .dl-flow-arrow {
    display: flex; align-items: center; position: absolute;
    right: -18px; top: 50%; transform: translateY(-50%);
  }
}

/* === E. 分类宫格 === */
.dl-categories { max-width: 1280px; margin: 0 auto 48px; padding: 0 24px; }
.dl-section-title { font-size: 17px; font-weight: 700; color: #f1f5f9; margin: 0 0 16px; }
.dl-cat-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; }
.dl-cat-item {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 22px 12px;
  background: rgba(17,24,39,0.5);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 18px;
  cursor: pointer; transition: all 0.2s;
}
.dl-cat-item:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.06); transform: translateY(-2px); }
.dl-cat-icon { width: 40px; height: 40px; object-fit: contain; }
.dl-cat-label { font-size: 13px; color: #94a3b8; font-weight: 600; }

/* === F. 精选任务 === */
.dl-featured { max-width: 1280px; margin: 0 auto 48px; padding: 0 24px; }
.dl-featured-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.dl-view-all { font-size: 14px; color: #818cf8; cursor: pointer; text-decoration: none; }
.dl-view-all:hover { color: #a5b4fc; }
.dl-featured-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.dl-task-card {
  background: rgba(17,24,39,0.6);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 20px; overflow: hidden; cursor: pointer;
  transition: all 0.3s ease;
}
.dl-task-card:hover { transform: translateY(-4px); border-color: rgba(99,102,241,0.3); box-shadow: 0 14px 44px rgba(99,102,241,0.08); }
.dl-card-cover { position: relative; width: 100%; height: 150px; overflow: hidden; background: rgba(15,23,42,0.5); }
.dl-card-cover-img { width: 100%; height: 100%; object-fit: cover; }
.dl-card-hot, .dl-card-new {
  position: absolute; top: 10px; right: 10px;
  padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 700;
}
.dl-card-hot { background: rgba(251,191,36,0.2); border: 1px solid rgba(251,191,36,0.3); color: #fcd34d; }
.dl-card-new { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; }
.dl-card-body { padding: 16px 18px 18px; }
.dl-card-tags { display: flex; gap: 6px; margin-bottom: 10px; }
.dl-card-cat {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px;
  background: rgba(148,163,184,0.08); color: #94a3b8;
}
.dl-card-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.dl-card-status.pending { background: rgba(99,102,241,0.1); color: #a5b4fc; }
.dl-card-status.active { background: rgba(6,182,212,0.1); color: #67e8f9; }
.dl-card-status.done { background: rgba(16,185,129,0.1); color: #6ee7b7; }
.dl-card-status.danger { background: rgba(239,68,68,0.1); color: #fca5a5; }
.dl-card-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 12px; line-height: 1.4; }
.dl-card-bottom { display: flex; justify-content: space-between; align-items: center; }
.dl-card-price {
  font-size: 17px; font-weight: 800;
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.dl-card-time { font-size: 12px; color: #475569; }

/* === G. 底部品牌区 === */
.dl-footer-band {
  position: relative; overflow: hidden;
  text-align: center; padding: 80px 24px 60px;
}
.dl-wheat-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; pointer-events: none; opacity: 0.5;
}
.dl-footer-content { position: relative; z-index: 1; }
.dl-footer-text {
  font-size: 22px; font-weight: 700; color: #e2e8f0;
  margin: 0 0 12px; line-height: 1.5;
}
.dl-footer-sub { font-size: 14px; color: #fbbf24; margin: 0; }

/* === 页脚 === */
.dl-legal {
  text-align: center; padding: 24px; font-size: 13px;
  color: #475569; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
}
.dl-legal a { color: #818cf8; text-decoration: none; }
.dl-legal a:hover { color: #fbbf24; }
.dl-dot { color: #334155; }

/* === 响应式 === */
@media (max-width: 900px) {
  .dl-cat-grid { grid-template-columns: repeat(4, 1fr); }
  .dl-featured-grid { grid-template-columns: repeat(2, 1fr); }
  .dl-stats-inner { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .dl-nav, .dl-nav-links { display: none; }
  .dl-hero { padding: 40px 16px 36px; min-height: 420px; }
  .dl-hero-title { font-size: 28px; letter-spacing: -1px; }
  .dl-hero-subtitle { font-size: 14px; }
  .dl-hero-trust { padding: 10px 18px; gap: 10px; flex-wrap: wrap; }
  .dl-stats { margin-top: -20px; padding: 0 12px; }
  .dl-stat-card { padding: 14px 16px; }
  .dl-stat-num { font-size: 18px; }
  .dl-flow-inner { flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start; }
  .dl-flow-step { min-width: 110px; }
  .dl-cat-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .dl-featured-grid { grid-template-columns: 1fr; }
  .dl-footer-text { font-size: 17px; }
  .dl-hero-lanterns { width: 50%; top: 1%; right: 3%; opacity: 0.6; }
}
</style>
