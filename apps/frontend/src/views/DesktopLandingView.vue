<template>
  <div class="desktop-landing">
    <!-- 大画布外壳 -->
    <div class="dl-canvas">
      <!-- A. 顶部导航 -->
      <nav class="dl-nav">
        <div class="dl-nav-inner">
          <div class="dl-nav-brand" @click="$router.push('/')">
            <span class="dl-brand-logo">煜</span>
            <span class="dl-brand-name">浩煜</span>
            <span class="dl-brand-divider"></span>
            <span class="dl-brand-tagline">万家灯火</span>
          </div>
          <div class="dl-nav-links">
            <a class="dl-nav-link active" @click.prevent="$router.push('/')">首页</a>
            <a class="dl-nav-link" @click.prevent="$router.push('/task')">任务大厅</a>
            <a class="dl-nav-link" @click.prevent="handlePublish">发布需求</a>
            <a class="dl-nav-link" @click.prevent="$router.push('/task')">解决方案</a>
            <a class="dl-nav-link" @click.prevent="$router.push('/trust')">服务保障</a>
            <a class="dl-nav-link" @click.prevent="$router.push('/trust')">关于我们</a>
          </div>
          <div class="dl-nav-right">
            <div class="dl-nav-search">
              <el-input v-model="searchKeyword" placeholder="找需求、找能力……" :prefix-icon="SearchIcon" clearable size="small" class="dl-search-input" />
            </div>
            <template v-if="isLogin">
              <span class="dl-nav-bell" @click="$router.push('/notifications')">🔔</span>
              <span class="dl-balance">💰 {{ formatYumiCompactFromCent(walletBalance) }}</span>
              <el-avatar :size="32" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);cursor:pointer;border:2px solid rgba(251,191,36,0.2)" @click="$router.push('/task')">
                {{ userInitial }}
              </el-avatar>
            </template>
            <template v-else>
              <el-button size="small" @click="$router.push('/login')" class="dl-btn-ghost">登录</el-button>
              <el-button size="small" type="warning" round @click="$router.push('/register')" class="dl-btn-warm">注册</el-button>
            </template>
          </div>
        </div>
      </nav>

      <!-- B. Hero 首屏 -->
      <section class="dl-hero">
        <div class="dl-hero-bg">
          <!-- WebP 实感背景层（新增） -->
          <img src="/assets/haoyu/desktop/hero_banners_01_desktop_dark_bridge_banner.webp" alt="" class="dl-hero-bg-real" aria-hidden="true" />
          <img :src="cityLights" alt="" class="dl-hero-bg-img" aria-hidden="true" />
          <img :src="lanterns" alt="" class="dl-hero-lanterns" aria-hidden="true" />
          <div class="dl-hero-radial"></div>
          <div class="dl-hero-glow"></div>
        </div>
        <div class="dl-hero-content">
          <div class="dl-hero-badge">🏮 万家灯火 · 资金托管 · 信用沉淀</div>
          <h1 class="dl-hero-title">
            浩煜<span class="dl-hero-dot"> · </span>万家灯火，
          </h1>
          <h1 class="dl-hero-title-2">总有你的一颗</h1>
          <p class="dl-hero-subtitle">万家灯火因你而亮，专业协作让每一份热爱落地生花</p>
          <div class="dl-hero-actions">
            <el-button type="warning" size="large" round @click="handlePublish" class="dl-hero-cta-gold">✨ 发布需求</el-button>
            <el-button size="large" round @click="$router.push('/task')" class="dl-hero-cta-outline">探索任务 →</el-button>
          </div>
          <div class="dl-hero-trust">
            <span class="dl-trust-item"><span class="dl-trust-icon">🔒</span> 平台托管</span>
            <span class="dl-trust-sep"></span>
            <span class="dl-trust-item"><span class="dl-trust-icon">✅</span> 实名认证</span>
            <span class="dl-trust-sep"></span>
            <span class="dl-trust-item"><span class="dl-trust-icon">⭐</span> 贴心服务</span>
          </div>
        </div>
      </section>

      <!-- C. 数据横条 -->
      <section class="dl-stats">
        <div class="dl-stats-inner">
          <div v-for="(item, i) in stats" :key="i" class="dl-stat-card">
            <div class="dl-stat-icon-row">{{ item.icon }}</div>
            <div class="dl-stat-body">
              <span class="dl-stat-num">{{ item.num }}</span>
              <span class="dl-stat-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- D. 五步流程 -->
      <section class="dl-flow">
        <h3 class="dl-section-title">🤝 协作流程</h3>
        <div class="dl-flow-inner">
          <div v-for="(step, i) in steps" :key="i" class="dl-flow-step">
            <span class="dl-flow-step-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="dl-flow-step-icon">{{ step.icon }}</span>
            <span class="dl-flow-step-label">{{ step.label }}</span>
            <span class="dl-flow-step-desc">{{ step.desc }}</span>
            <div v-if="i < steps.length - 1" class="dl-flow-arrow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 4l7 8-7 8" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>
            </div>
          </div>
        </div>
      </section>

      <!-- E. 服务分类 -->
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
              <h4 class="dl-card-title">{{ truncate(t.title, 28) }}</h4>
              <div class="dl-card-bottom">
                <span class="dl-card-price">{{ formatYumiCompactFromCent(t.price) }} 煜米</span>
                <span class="dl-card-meta">{{ timeAgo(t.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- G. 麦穗品牌区 -->
      <section class="dl-footer-band">
        <img :src="wheatBand" alt="" class="dl-wheat-bg" aria-hidden="true" />
        <div class="dl-footer-band-content">
          <p class="dl-footer-quote">在浩煜，每一份付出被看见，每一次信任都点亮生活的光。</p>
          <p class="dl-footer-brand">🏮 浩煜 · 万家灯火 · 可信协作平台</p>
        </div>
      </section>

      <!-- 底部 -->
      <footer class="dl-legal">
        <span>© 2026 浩煜 HaoYu</span>
        <span class="dl-dot">·</span>
        <span>万家灯火 · 可信协作平台</span>
        <span class="dl-dot">·</span>
        <router-link to="/trust">信任与保障</router-link>
      </footer>
    </div>

    <CreateTaskDialog v-model="showCreateDialog" @published="fetchTasks" />
    <MobileBottomTabs :is-login="isLogin" @publish="handlePublish" />
    <MobileDrawerMenu :open="mobileDrawerOpen" :is-login="isLogin" :user="currentUser" title="浩煜" :items="mobileMenuItems" @update:open="mobileDrawerOpen = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { formatYumiCompactFromCent } from '@/utils/money'
import { getTaskList, type Task } from '@/api/task'
import { getProfile, type UserProfile } from '@/api/user'
import { getWallet } from '@/api/wallet'
import { notificationApi } from '@/api/notification'
import { resolveApiAssetUrl } from '@/api/http'
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
    items.push({ label: '我的任务', path: '/my-task', icon: 'Tickets' }, { label: '通知', path: '/notifications', icon: 'Bell', badge: unreadCount.value }, { label: '钱包', path: '/wallet', icon: 'Wallet' })
  }
  items.push({ label: '信任中心', path: '/trust', icon: 'Lock' })
  return items
})
const handlePublish = () => { if (!isLogin.value) { router.push('/login'); return }; showCreateDialog.value = true }
const stats = [
  { icon: '👥', num: '10万+', label: '注册用户' },
  { icon: '📋', num: '3万+', label: '完成任务' },
  { icon: '⭐', num: '98.6%', label: '好评率' },
  { icon: '💰', num: '1.2亿+', label: '托管资金' },
  { icon: '🛡️', num: '100%', label: '安全托管' },
]
const steps = [
  { icon: '📝', label: '发布需求', desc: '清晰描述，精准匹配' },
  { icon: '🔒', label: '资金托管', desc: '平台安全托管，资金保障' },
  { icon: '🤝', label: '协作交付', desc: '服务者按约定交付成果' },
  { icon: '✅', label: '验收确认', desc: '满意后确认，释放资金' },
  { icon: '⭐', label: '信用沉淀', desc: '每次协作积累信用值' },
]
const categories = [
  { label: '设计创意', icon: iconDesign }, { label: '技术开发', icon: iconDev },
  { label: '生活服务', icon: iconService }, { label: '视频制作', icon: iconVideo },
  { label: '营销推广', icon: iconMarketing }, { label: '文案策划', icon: iconWriting },
  { label: '数据标注', icon: iconData }, { label: '更多服务', icon: iconTrust },
]
const featuredTasks = computed(() => tasks.value.slice(0, 6))
const fetchTasks = async () => { try { const res: any = await getTaskList(); tasks.value = Array.isArray(res) ? res : res?.data || [] } catch { tasks.value = [] } }
const catLabel = (c: string | undefined) => {
  const m: Record<string, string> = { SKILL_SERVICE: '技能', LIFE_ASSISTANCE: '生活', FAMILY_CARE: '家庭', REMOTE_ASSISTANCE: '远程', COMMUNITY_COLLABORATION: '社区', PUBLIC_WELFARE: '公益', OTHER: '其他' }
  return m[c || ''] || c || ''
}
const statusLabel = (s: string | undefined) => {
  const m: Record<string, string> = { PENDING: '待接单', ASSIGNED: '进行中', IN_PROGRESS: '服务中', SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中' }
  return m[s || ''] || s || ''
}
const statusClass = (s: string | undefined) => {
  const m: Record<string, string> = { PENDING: 'pending', ASSIGNED: 'active', IN_PROGRESS: 'active', SUBMITTED: 'active', COMPLETED: 'done', CANCELLED: 'danger', DISPUTED: 'danger' }
  return m[s || ''] || 'pending'
}
const isNew = (t: { createdAt?: string }) => t.createdAt && Date.now() - new Date(t.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
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
    return resolveApiAssetUrl(img)
  }
  const c = t.category || 'OTHER'
  const map: Record<string, string> = { SKILL_SERVICE: coverDev, LIFE_ASSISTANCE: coverDesign, FAMILY_CARE: coverDesign, REMOTE_ASSISTANCE: coverDev, PUBLIC_WELFARE: coverDesign, OTHER: coverDesign }
  return map[c] || coverDesign
}
const fetchProfile = async () => {
  try { const cached = localStorage.getItem('currentUser'); if (cached) currentUser.value = JSON.parse(cached); const res = await getProfile(); currentUser.value = res; localStorage.setItem('currentUser', JSON.stringify(res)) } catch { currentUser.value = null }
}
const fetchWallet = async () => { if (!isLogin.value) return; try { const w: any = await getWallet(); walletBalance.value = w?.available ?? 0 } catch {} }
const fetchUnread = async () => { if (!isLogin.value) return; try { const r: any = await notificationApi.unreadCount(); unreadCount.value = r?.count ?? 0 } catch {} }
onMounted(async () => { await Promise.all([fetchTasks(), fetchProfile(), fetchWallet(), fetchUnread()]) })
</script>

<style>
body { margin: 0; background: #05070d !important; }
html { overflow-y: auto; }
html, body, #app { max-width: 100%; overflow-x: hidden; }
#app { overflow: visible !important; height: auto !important; }
.desktop-landing { background: #05070d; min-height: 100vh; overflow-x: hidden; }

/* 防溢出规则 */
*,
*::before,
*::after {
  box-sizing: border-box;
}
.dl-hero-content *,
.dl-stats *,
.dl-flow *,
.dl-featured * {
  max-width: 100%;
  overflow-wrap: break-word;
}
</style>
<style scoped>
/* ====== 大画布 (home-shell) ====== */
.dl-canvas {
  width: min(1360px, calc(100vw - 80px));
  margin: 32px auto 48px;
  border: 1px solid rgba(251,191,36,0.28);
  border-radius: 28px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.45);
  overflow: hidden;
  background: rgba(5, 9, 16, 0.92);
  min-height: 900px;
  position: relative;
}

/* ====== A. 顶部导航 ====== */
.dl-nav {
  background: linear-gradient(180deg, rgba(8,13,24,0.95) 0%, rgba(8,13,24,0.88) 100%);
  border-bottom: 1px solid rgba(148,163,184,0.08);
}
.dl-nav-inner {
  max-width: 1280px; margin: 0 auto;
  display: flex; align-items: center; gap: 12px;
  height: 72px; padding: 0 48px;
}
.dl-nav-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
.dl-brand-logo { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px; }
.dl-brand-name { font-size: 17px; font-weight: 700; color: #f1f5f9; }
.dl-brand-divider { width: 1px; height: 18px; background: rgba(148,163,184,0.2); margin: 0 4px; }
.dl-brand-tagline { font-size: 14px; color: #fbbf24; font-weight: 600; }
.dl-nav-links { display: flex; gap: 2px; margin: 0 8px; }
.dl-nav-link { padding: 8px 16px; border-radius: 8px; color: #94a3b8; font-size: 14px; cursor: pointer; text-decoration: none; transition: all 0.15s; white-space: nowrap; }
.dl-nav-link:hover { color: #e2e8f0; background: rgba(255,255,255,0.04); }
.dl-nav-link.active { color: #fbbf24; background: rgba(251,191,36,0.08); font-weight: 600; }
.dl-nav-right { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-shrink: 0; }
.dl-nav-search { max-width: 220px; }
.dl-search-input { --el-input-bg-color: rgba(255,255,255,0.04); }
.dl-nav-bell { font-size: 18px; cursor: pointer; opacity: 0.7; transition: opacity 0.15s; }
.dl-nav-bell:hover { opacity: 1; }
.dl-balance { padding: 3px 12px; border-radius: 14px; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.18); color: #fcd34d; font-size: 13px; font-weight: 600; }
.dl-btn-ghost { background: transparent !important; border: 1px solid rgba(148,163,184,0.2) !important; color: #94a3b8 !important; }
.dl-btn-warm { font-weight: 700 !important; }

/* ====== B. Hero ====== */
.dl-hero {
  position: relative; overflow: hidden;
  padding: 52px 28px 40px; text-align: center;
  min-height: 340px; display: flex; align-items: center; justify-content: center;
}
.dl-hero-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.dl-hero-bg-img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 28%; }
.dl-hero-bg-real {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.25;
  z-index: 0;
}
.dl-hero-lanterns { position: absolute; top: 1%; right: 4%; width: 35%; max-width: 320px; height: auto; pointer-events: none; opacity: 0.8; }
.dl-hero-radial {
  position: absolute; top: 0; right: 0; width: 70%; height: 70%;
  background: radial-gradient(circle at 72% 28%, rgba(245,158,11,0.32), transparent 42%);
  pointer-events: none; z-index: 0;
}
.dl-hero-glow { position: absolute; left: 50%; bottom: -50px; width: min(860px, 100vw); height: 180px; transform: translateX(-50%); background: radial-gradient(ellipse, rgba(251,191,36,0.12), transparent 60%); pointer-events: none; z-index: 0; }
.dl-hero-content { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
.dl-hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 18px; border-radius: 999px; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); color: #fcd34d; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
.dl-hero-title { font-size: 54px; font-weight: 900; color: #f1f5f9; margin: 0; letter-spacing: -2px; line-height: 1.15; text-shadow: 0 0 60px rgba(99,102,241,0.1); }
.dl-hero-dot { font-weight: 300; color: #475569; }
.dl-hero-title-2 { font-size: 54px; font-weight: 900; margin: 0 0 12px; background: linear-gradient(135deg, #a5b4fc 0%, #fcd34d 50%, #67e8f9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -2px; line-height: 1.15; }
.dl-hero-subtitle { font-size: 18px; color: #94a3b8; margin: 0 auto 36px; max-width: 620px; line-height: 1.7; }
.dl-hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
.dl-hero-cta-gold { font-weight: 800 !important; font-size: 16px !important; color: #0f172a !important; padding: 14px 36px !important; border-radius: 999px !important; box-shadow: 0 8px 36px rgba(251,191,36,0.35) !important; transition: all 0.3s !important; }
.dl-hero-cta-gold:hover { transform: translateY(-2px); box-shadow: 0 12px 48px rgba(251,191,36,0.5) !important; }
.dl-hero-cta-outline { background: transparent !important; border: 2px solid rgba(148,163,184,0.25) !important; color: #cbd5e1 !important; font-size: 16px !important; padding: 14px 36px !important; border-radius: 999px !important; transition: all 0.3s !important; font-weight: 600 !important; }
.dl-hero-cta-outline:hover { border-color: #fbbf24 !important; color: #fcd34d !important; }
.dl-hero-trust { display: inline-flex; align-items: center; gap: 18px; padding: 12px 24px; background: rgba(15,23,42,0.55); border: 1px solid rgba(148,163,184,0.1); border-radius: 999px; }
.dl-trust-item { font-size: 14px; color: #e2e8f0; display: flex; align-items: center; gap: 6px; font-weight: 500; }
.dl-trust-icon { font-size: 15px; }
.dl-trust-sep { width: 1px; height: 20px; background: rgba(148,163,184,0.12); }

/* ====== C. 数据横条 ====== */
.dl-stats { max-width: 1160px; margin: -20px auto 48px; padding: 0; position: relative; z-index: 2; }
.dl-stats-inner { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.dl-stat-card { display: flex; align-items: center; gap: 12px; padding: 18px 16px; background: linear-gradient(180deg, rgba(17,24,39,0.82), rgba(15,23,42,0.55)); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); min-height: 76px; }
.dl-stat-icon-row { font-size: 28px; line-height: 1; }
.dl-stat-body { display: flex; flex-direction: column; gap: 2px; }
.dl-stat-num { font-size: 21px; font-weight: 800; background: linear-gradient(135deg, #a5b4fc, #67e8f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.dl-stat-label { font-size: 13px; color: #64748b; }

/* ====== D. 五步流程 ====== */
.dl-flow { max-width: 1160px; margin: 0 auto 48px; padding: 0; }
.dl-section-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0 0 16px; }
.dl-flow-inner { display: flex; gap: 16px; justify-content: center; }
.dl-flow-step { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; width: 180px; min-width: 160px; padding: 20px 12px 16px; background: linear-gradient(180deg, rgba(17,24,39,0.6), rgba(15,23,42,0.35)); border: 1px solid rgba(251,191,36,0.12); border-radius: 14px; position: relative; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.dl-flow-step-num { font-size: 11px; font-weight: 700; color: rgba(251,191,36,0.5); letter-spacing: 1px; }
.dl-flow-step-icon { font-size: 30px; line-height: 1; }
.dl-flow-step-label { font-size: 14px; font-weight: 700; color: #e2e8f0; }
.dl-flow-step-desc { font-size: 11px; color: #64748b; white-space: nowrap; }
@media (min-width: 769px) {
  .dl-flow-arrow { display: flex; align-items: center; position: absolute; right: -18px; top: 50%; transform: translateY(-50%); }
}

/* ====== E. 分类宫格 ====== */
.dl-categories { max-width: 1160px; margin: 0 auto 48px; padding: 0; }
.dl-cat-grid { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 14px; }
.dl-cat-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px 8px; min-height: 100px; background: rgba(17,24,39,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 18px; cursor: pointer; transition: all 0.2s; }
.dl-cat-item:hover { border-color: rgba(251,191,36,0.35); background: rgba(251,191,36,0.05); transform: translateY(-2px); }
.dl-cat-icon { width: 42px; height: 42px; object-fit: contain; }
.dl-cat-label { font-size: 13px; color: #94a3b8; font-weight: 600; }

/* ====== F. 精选任务 ====== */
.dl-featured { max-width: 1160px; margin: 0 auto 48px; padding: 0; }
.dl-featured-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.dl-view-all { font-size: 14px; color: #818cf8; cursor: pointer; text-decoration: none; }
.dl-view-all:hover { color: #fbbf24; }
.dl-featured-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.dl-task-card { background: rgba(17,24,39,0.6); border: 1px solid rgba(148,163,184,0.1); border-radius: 22px; overflow: hidden; cursor: pointer; transition: all 0.3s ease; min-width: 0; }
.dl-task-card:hover { transform: translateY(-5px); border-color: rgba(251,191,36,0.25); box-shadow: 0 16px 48px rgba(251,191,36,0.06); }
.dl-card-cover { position: relative; width: 100%; height: 130px; overflow: hidden; background: rgba(15,23,42,0.5); }
.dl-card-cover-img { width: 100%; height: 100%; object-fit: cover; min-width: 0; }
.dl-card-hot, .dl-card-new { position: absolute; top: 10px; right: 10px; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.dl-card-hot { background: rgba(251,191,36,0.2); border: 1px solid rgba(251,191,36,0.3); color: #fcd34d; }
.dl-card-new { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; }
.dl-card-body { padding: 14px 18px 18px; }
.dl-card-tags { display: flex; gap: 8px; margin-bottom: 10px; }
.dl-card-cat { font-size: 11px; font-weight: 600; padding: 3px 12px; border-radius: 999px; background: rgba(148,163,184,0.08); color: #94a3b8; }
.dl-card-status { font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 999px; }
.dl-card-status.pending { background: rgba(99,102,241,0.1); color: #a5b4fc; }
.dl-card-status.active { background: rgba(6,182,212,0.1); color: #67e8f9; }
.dl-card-status.done { background: rgba(16,185,129,0.1); color: #6ee7b7; }
.dl-card-status.danger { background: rgba(239,68,68,0.1); color: #fca5a5; }
.dl-card-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 10px; line-height: 1.45; min-height: 0; }
.dl-card-bottom { display: flex; justify-content: space-between; align-items: center; }
.dl-card-price { font-size: 16px; font-weight: 800; background: linear-gradient(135deg, #fcd34d, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.dl-card-meta { font-size: 12px; color: #475569; }

/* ====== G. 麦穗品牌区 ====== */
.dl-footer-band { position: relative; overflow: hidden; text-align: center; padding: 100px 28px 80px; }
.dl-wheat-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; opacity: 0.4; }
.dl-footer-band-content { position: relative; z-index: 1; }
.dl-footer-quote { font-size: 22px; font-weight: 700; color: #e2e8f0; margin: 0 0 14px; line-height: 1.5; }
.dl-footer-brand { font-size: 15px; color: #fbbf24; margin: 0; letter-spacing: 1px; }

/* ====== 底部 ====== */
.dl-legal { text-align: center; padding: 28px; font-size: 13px; color: #475569; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; background: rgba(5,7,13,0.8); }
.dl-legal a { color: #818cf8; text-decoration: none; }
.dl-legal a:hover { color: #fbbf24; }
.dl-dot { color: #334155; }

/* ====== 响应式 ====== */
@media (max-width: 900px) {
  .dl-cat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .dl-featured-grid { grid-template-columns: minmax(0, 1fr); }
  .dl-stats-inner { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .dl-canvas { width: 100%; margin: 0; border: none; border-radius: 0; box-shadow: none; padding: 0 14px calc(108px + env(safe-area-inset-bottom)); min-height: 100vh; overflow-x: hidden; box-sizing: border-box; }
  .dl-canvas * { box-sizing: border-box; max-width: 100%; }
  .dl-nav { display: none; }
  .dl-hero { margin: 0; padding: 24px 22px 22px; min-height: 315px; border-radius: 24px; }
  .dl-hero-title, .dl-hero-title-2 { font-size: 30px; line-height: 1.16; max-width: 280px; margin-left: auto; margin-right: auto; letter-spacing: -0.5px; }
  .dl-hero-subtitle { margin-top: 10px; margin-bottom: 0; font-size: 13px; line-height: 1.55; max-width: 290px; }
  .dl-hero-badge { margin-bottom: 12px; font-size: 11px; padding: 4px 14px; }
  .dl-hero-content { max-width: 100%; }
  .dl-hero-actions { margin-top: 22px; margin-bottom: 0; flex-direction: column; gap: 10px; }
  .dl-hero-cta-gold { font-size: 14px !important; padding: 10px 24px !important; width: 90%; min-height: 44px; }
  .dl-hero-cta-outline { font-size: 14px !important; padding: 10px 24px !important; width: 90%; min-height: 42px; }
  .dl-hero-trust { margin-top: 14px; padding: 8px 14px; gap: 6px; flex-wrap: wrap; border-radius: 999px; }
  .dl-trust-item { font-size: 12px; }
  .dl-trust-sep { height: 14px; }
  .dl-hero-lanterns { width: 50%; top: 1%; right: 2%; opacity: 0.5; }
  .dl-stats { margin-top: -12px; padding: 0 12px; max-width: 100%; }
  .dl-stats-inner { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .dl-stat-card { padding: 12px 10px; min-height: 54px; border-radius: 14px; gap: 8px; }
  .dl-stat-icon-row { font-size: 24px; }
  .dl-stat-num { font-size: 18px; font-weight: 900; text-shadow: 0 0 12px rgba(99,102,241,0.25); }
  .dl-stat-label { font-size: 10px; }
  .dl-flow { max-width: 100%; padding: 0 12px; }
  .dl-flow-inner { flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start; gap: 8px; }
  .dl-flow-step { width: 140px; min-width: 110px; padding: 14px 8px 12px; }
  .dl-flow-step-icon { font-size: 34px; }
  .dl-flow-step-desc { font-size: 10px; white-space: nowrap; }
  .dl-categories { max-width: 100%; padding: 0; margin-bottom: 28px; }
  .dl-cat-grid { display: flex; gap: 10px; overflow-x: auto; padding: 4px 0 12px; scrollbar-width: none; }
  .dl-cat-grid::-webkit-scrollbar { display: none; }
  .dl-cat-item { flex: 0 0 56px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0; min-height: 0; background: none; border: none; border-radius: 0; }
  .dl-cat-item:hover { background: none; border: none; transform: none; }
  .dl-cat-icon { width: 44px; height: 44px; border-radius: 16px; margin: 0 auto 6px; }
  .dl-cat-label { font-size: 10px; white-space: nowrap; line-height: 1.2; color: #94a3b8; }
  .dl-section-title { font-size: 19px; }
  .dl-featured { max-width: 100%; padding: 0; }
  .dl-featured-top { margin-bottom: 12px; }
  .dl-featured-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; width: 100%; }
  .dl-task-card { width: 100%; min-height: 118px; border-radius: 18px; }
  .dl-card-cover { height: 100px; }
  .dl-card-body { padding: 14px 15px 15px; }
  .dl-card-title { font-size: 16px; line-height: 1.35; }
  .dl-card-price { font-size: 20px; }
  .dl-card-meta { font-size: 11px; }
  .dl-footer-quote { font-size: 16px; }
  .dl-footer-brand { font-size: 13px; }
  .dl-footer-band { padding: 40px 14px 36px; }
}
@media (max-width: 430px) {
  .dl-canvas { padding-left: 14px; padding-right: 14px; }
}
@media (max-width: 375px) {
  .dl-canvas { padding-left: 12px; padding-right: 12px; }
  .dl-hero-title, .dl-hero-title-2 { font-size: 27px; }
  .dl-cat-item { flex-basis: 52px; }
}
</style>
