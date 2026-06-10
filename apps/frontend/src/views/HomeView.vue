<template>
  <div class="haoyu-page">
    <DesktopLandingView
      v-if="isHome"
      class="desktop-landing-only"
      :tasks="visibleTasks"
      :loading="loading"
      :current-user="currentUser"
      :is-login="isLogin"
      :unread-count="unreadCount"
      :user-initial="userInitial"
      @open-create="openCreateDialog"
      @task-click="(task: Task) => router.push(`/task/${task.id}`)"
      @route-to="(path: string) => router.push(path)"
      @search="handleDesktopSearch"
      @set-price-filter="priceFilter = $event"
      @set-category-filter="categoryFilter = $event"
      @refresh="fetchData"
    />

    <main class="desktop-frame" :class="{ 'legacy-mobile-shell': isHome }">
      <header class="top-nav">
        <button class="brand" @click="router.push('/task')" aria-label="回到首页">
          <span class="brand-mark"><img :src="brandLogoSrc" alt="" /></span>
          <span>浩煜·万家灯火</span>
        </button>

        <nav class="nav-links" aria-label="主导航">
          <router-link to="/task" :class="{ active: isHome }">首页</router-link>
          <router-link to="/task">任务市场</router-link>
          <button @click="openCreateDialog">发布需求</button>
          <router-link to="/trust">解决方案</router-link>
          <router-link to="/trust">服务保障</router-link>
          <router-link to="/trust">关于我们</router-link>
        </nav>

        <div class="nav-tools">
          <div class="search-pill">
            <el-icon><Search /></el-icon>
            <input v-model="searchKeyword" placeholder="搜索任务、技能或需求" @keyup.enter="fetchData" />
          </div>
          <button class="icon-btn" aria-label="消息"><el-icon><Message /></el-icon></button>
          <button class="icon-btn notice" aria-label="通知" @click="router.push('/notifications')">
            <el-icon><Bell /></el-icon>
            <span v-if="unreadCount">{{ unreadCount }}</span>
          </button>
          <template v-if="isLogin && currentUser">
            <el-avatar :size="30" :src="currentUser.avatar ? getFullUrl(currentUser.avatar) : defaultAvatarSrc">
              {{ userInitial }}
            </el-avatar>
            <el-dropdown trigger="click" @command="handleCommand">
              <button class="user-menu">
                {{ currentUser.nickname || '夜色信赖' }}
                <el-icon><CaretBottom /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="wallet">钱包中心</el-dropdown-item>
                  <el-dropdown-item v-if="canSeeUserManage" command="admin">管理后台</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <button class="ghost-login" @click="router.push('/login')">登录</button>
          </template>
        </div>
      </header>

      <template v-if="isHome">
        <section class="hero" :style="{ backgroundImage: `linear-gradient(90deg, rgba(5,10,20,.98) 0%, rgba(5,10,20,.72) 42%, rgba(5,10,20,.30) 100%), url(${heroBgSrc})` }">
          <div class="hero-copy">
            <h1>浩煜 · 万家灯火，总有你的一颗</h1>
            <p>万家灯火因你而亮，专业协作让每一份热爱落地生花</p>
            <div class="hero-actions">
              <button class="primary-cta" @click="openCreateDialog">
                发布需求 <el-icon><ArrowRight /></el-icon>
              </button>
              <button class="secondary-cta" @click="scrollToTasks">
                探索任务 <el-icon><Compass /></el-icon>
              </button>
            </div>
          </div>
        </section>

        <section class="stats-bar" aria-label="平台数据">
          <div v-for="item in stats" :key="item.label" class="stat-item">
            <el-icon><component :is="item.icon" /></el-icon>
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </section>

        <section class="process">
          <div class="section-title">
            <span>✦</span>
            <h2>信任，让协作更简单</h2>
            <span>✦</span>
          </div>
          <p>五步流程，保障每一次合作安心高效</p>
          <div class="process-line">
            <article v-for="step in processSteps" :key="step.title" class="process-card">
              <div class="step-icon"><el-icon><component :is="step.icon" /></el-icon></div>
              <div class="step-title"><b>{{ step.no }}</b>{{ step.title }}</div>
              <span>{{ step.desc }}</span>
            </article>
          </div>
        </section>

        <section id="task-section" class="tasks-section">
          <div class="tasks-head">
            <div class="tabs">
              <h2>精选任务</h2>
              <button class="active">推荐</button>
              <button @click="priceFilter = 'high'">高预算</button>
              <button>最新发布</button>
            </div>
            <div class="task-controls">
              <button v-for="cat in categories" :key="cat.value" :class="{ active: categoryFilter === cat.value }" @click="categoryFilter = cat.value">
                {{ cat.label }}
              </button>
              <button class="filter-btn" @click="fetchData">
                <el-icon><Filter /></el-icon> 默认排序
              </button>
            </div>
          </div>

          <div class="task-grid" v-loading="loading">
            <article v-for="task in visibleTasks" :key="task.id" class="task-card" @click="router.push(`/task/${task.id}`)">
              <div class="card-glow"></div>
              <div class="task-card-top">
                <span class="tag" :class="tagClass(task)">{{ taskTag(task) }}</span>
                <span class="price">{{ formatMoney(task.price) }}</span>
              </div>
              <h3>{{ task.title }}</h3>
              <p>{{ truncate(task.description, 44) }}</p>
              <div class="chips">
                <span>{{ categoryLabel(task.category || '') }}</span>
                <span>{{ serviceModeLabel(task.serviceMode || 'ONLINE') }}</span>
                <span>{{ statusLabel(task.status) }}</span>
              </div>
              <footer>
                <span class="publisher">
                  <span class="avatar-dot">{{ publisherInitial(task) }}</span>
                  发布者：{{ task.publisher?.nickname || '星海设计' }}
                </span>
                <span>{{ relativeTime(task.createdAt) }}</span>
              </footer>
            </article>
          </div>

          <button class="more-btn" @click="fetchData">查看全部任务</button>
        </section>
      </template>

      <section v-else class="route-content">
        <router-view />
      </section>
    </main>

    <nav class="mobile-bottom" aria-label="移动端导航">
      <button :class="{ active: isHome }" @click="router.push('/task')"><el-icon><House /></el-icon><span>首页</span></button>
      <button @click="router.push('/my-orders')"><el-icon><Tickets /></el-icon><span>任务市场</span></button>
      <button @click="router.push('/notifications')"><el-icon><Bell /></el-icon><span>消息</span></button>
      <button @click="router.push('/profile')"><el-icon><User /></el-icon><span>我的</span></button>
    </nav>

    <button class="mobile-fab" @click="openCreateDialog">
      <img :src="addButtonSrc" alt="" />
      <span>发布需求</span>
    </button>

    <el-dialog
      v-model="showCreateDialog"
      width="560px"
      destroy-on-close
      class="haoyu-dialog"
      modal-class="haoyu-dialog-modal"
    >
      <template #header>
        <div class="dialog-title">发布新的协作需求</div>
      </template>
      <el-form :model="createForm" label-position="top" class="publish-form">
        <el-form-item label="需求标题" required>
          <el-input v-model="createForm.title" placeholder="例如：品牌官网视觉设计升级" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="需求描述">
          <el-input v-model="createForm.desc" type="textarea" :rows="4" placeholder="说明背景、目标、交付物和验收标准" />
        </el-form-item>
        <el-form-item label="预算金额（元）">
          <el-input-number v-model="createForm.price" :min="1" :step="100" :precision="0" />
        </el-form-item>
        <el-form-item label="参考图片">
          <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="handleImageChange">
            <el-button :loading="uploadingImg">{{ previewImageUrl ? '重新选择图片' : '添加参考图' }}</el-button>
          </el-upload>
          <div v-if="previewImageUrl" class="reference-preview">
            <img :src="previewImageUrl" alt="参考图预览" />
          </div>
        </el-form-item>
        <el-form-item label="需求分类">
          <el-select v-model="createForm.category" popper-class="haoyu-select-popper" style="width: 100%">
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
        <el-button type="primary" :loading="submitting" @click="submitTask">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import DesktopLandingView from './DesktopLandingView.vue'
import {
  ArrowRight,
  Bell,
  Briefcase,
  CaretBottom,
  CircleCheck,
  Compass,
  Connection,
  Filter,
  House,
  Lock,
  Medal,
  Message,
  Search,
  Star,
  Tickets,
  User,
  WalletFilled,
} from '@element-plus/icons-vue'
import heroBg from '@/assets/haoyu-desktop/hero_banners/hero_banners_05_city_waterfront_banner.webp'
import brandLogo from '@/assets/haoyu-desktop/icons/icons_18_brand_leaf_logo.webp'
import addButton from '@/assets/haoyu-desktop/icons/icons_09_add_button_glow.webp'
import defaultAvatar from '@/assets/haoyu-desktop/avatars/avatars_02_female_avatar_portrait.webp'
import { createTask, getTaskList, uploadTaskImage, type Task } from '@/api/task'
import { getProfile, type UserProfile } from '@/api/user'
import { notificationApi } from '@/api/notification'
import { getWallet } from '@/api/wallet'

const router = useRouter()
const route = useRoute()

const currentUser = ref<UserProfile | null>(null)
const heroBgSrc = heroBg
const brandLogoSrc = brandLogo
const addButtonSrc = addButton
const defaultAvatarSrc = defaultAvatar
const walletBalance = ref(0)
const unreadCount = ref(0)
const loading = ref(false)
const tasks = ref<Task[]>([])
const searchKeyword = ref('')
const priceFilter = ref('all')
const categoryFilter = ref('all')
const showCreateDialog = ref(false)
const submitting = ref(false)
const uploadingImg = ref(false)
const selectedImageFile = ref<File | null>(null)
const previewImageUrl = ref('')

const createForm = reactive({
  title: '',
  desc: '',
  price: 1000,
  category: 'SKILL_SERVICE',
  serviceMode: 'ONLINE',
  image: '',
})

const demoTasks: Task[] = [
  demoTask(90001, '品牌官网视觉设计升级', '为高端家居品牌打造全新视觉体验', 3800000, 'SKILL_SERVICE', '星海设计', 'PENDING'),
  demoTask(90002, '智能家居小程序开发', '支持设备控制与场景联动', 2800000, 'REMOTE_ASSISTANCE', '未来科技', 'PENDING'),
  demoTask(90003, '产品宣传片制作', '时长 3-5 分钟，突出产品亮点', 5600000, 'SKILL_SERVICE', '光影映画', 'ASSIGNED'),
  demoTask(90004, '品牌全案策划', '从定位到传播的一站式方案', 2500000, 'OTHER', '辰光咨询', 'PENDING'),
  demoTask(90005, '电商详情页设计', '高转化详情页视觉设计', 800000, 'SKILL_SERVICE', '松禾视觉', 'PENDING'),
  demoTask(90006, '数据可视化大屏开发', '可视化大屏与数据接口交互', 3200000, 'REMOTE_ASSISTANCE', '数境工坊', 'SUBMITTED'),
]

const isLogin = computed(() => Boolean(localStorage.getItem('token')))
const isHome = computed(() => route.path === '/' || route.path === '/task')
const userInitial = computed(() => currentUser.value?.nickname?.[0] || currentUser.value?.email?.[0]?.toUpperCase() || '浩')
const canSeeUserManage = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.value?.role || ''))

const stats = computed(() => [
  { icon: User, value: '10万+', label: '注册用户' },
  { icon: Briefcase, value: '3万+', label: '完成任务' },
  { icon: Star, value: '98.6%', label: '好评率' },
  { icon: WalletFilled, value: formatLargeMoney(walletBalance.value || 120000000), label: '托管资金(元)' },
  { icon: Lock, value: '平台资金托管', label: '安全 · 透明 · 可追溯' },
])

const processSteps = [
  { no: 1, icon: Briefcase, title: '发布需求', desc: '清晰描述需求，设置预算与周期' },
  { no: 2, icon: WalletFilled, title: '资金托管', desc: '平台托管资金，保障双方权益' },
  { no: 3, icon: Connection, title: '协作交付', desc: '在线协作沟通，按计划推进项目' },
  { no: 4, icon: CircleCheck, title: '验收确认', desc: '确认成果验收，资金安全结算' },
  { no: 5, icon: Medal, title: '信用沉淀', desc: '评价与信用累积，解锁更多机会' },
]

const categories = [
  { label: '全部', value: 'all' },
  { label: '设计创意', value: 'SKILL_SERVICE' },
  { label: '开发技术', value: 'REMOTE_ASSISTANCE' },
  { label: '文案策划', value: 'OTHER' },
  { label: '生活协助', value: 'LIFE_ASSISTANCE' },
]

const visibleTasks = computed(() => {
  let list = tasks.value.length ? tasks.value : demoTasks
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter((task) =>
      `${task.title} ${task.description}`.toLowerCase().includes(kw),
    )
  }
  if (categoryFilter.value !== 'all') {
    list = list.filter((task) => task.category === categoryFilter.value)
  }
  if (priceFilter.value === 'high') {
    list = list.filter((task) => task.price >= 5000000)
  }
  return list.slice(0, 6)
})

function demoTask(
  id: number,
  title: string,
  description: string,
  price: number,
  category: string,
  nickname: string,
  status: string,
): Task {
  const now = new Date().toISOString()
  return {
    id,
    title,
    description,
    price,
    status,
    category,
    serviceMode: 'ONLINE',
    createdAt: now,
    updatedAt: now,
    publisherId: id,
    publisher: {
      id,
      email: '',
      nickname,
      role: 'USER',
      avatar: '',
    } as any,
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getTaskList()
    tasks.value = Array.isArray(res) ? res : []
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

const fetchProfile = async () => {
  if (!isLogin.value) return
  try {
    const res = await getProfile()
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch {
    currentUser.value = null
  }
}

const fetchUnreadCount = async () => {
  if (!isLogin.value) return
  try {
    const res: any = await notificationApi.unreadCount()
    unreadCount.value = res?.count ?? Number(res || 0)
  } catch {
    unreadCount.value = 0
  }
}

const fetchWalletBalance = async () => {
  if (!isLogin.value) return
  try {
    const wallet: any = await getWallet()
    walletBalance.value = wallet?.available ?? 0
  } catch {
    walletBalance.value = 0
  }
}

const openCreateDialog = () => {
  if (!isLogin.value) {
    router.push('/login')
    return
  }
  showCreateDialog.value = true
}

const submitTask = async () => {
  if (!createForm.title.trim()) {
    ElMessage.warning('请输入需求标题')
    return
  }

  submitting.value = true
  try {
    let imageUrl = createForm.image || ''
    if (selectedImageFile.value) {
      uploadingImg.value = true
      try {
        const fd = new FormData()
        fd.append('file', selectedImageFile.value)
        const res = await uploadTaskImage(fd)
        imageUrl = res?.url || ''
      } finally {
        uploadingImg.value = false
      }
    }

    await createTask({
      title: createForm.title,
      description: createForm.desc,
      price: Math.round(createForm.price * 100),
      category: createForm.category,
      serviceMode: createForm.serviceMode,
      image: imageUrl || undefined,
    } as any)

    ElMessage.success('需求已发布，等待合适的人来接单')
    showCreateDialog.value = false
    createForm.title = ''
    createForm.desc = ''
    createForm.price = 1000
    createForm.image = ''
    selectedImageFile.value = null
    previewImageUrl.value = ''
    await fetchData()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const handleImageChange = (uploadFile: any) => {
  const raw = uploadFile?.raw || uploadFile
  if (!(raw instanceof File)) return
  selectedImageFile.value = raw
  if (previewImageUrl.value) URL.revokeObjectURL(previewImageUrl.value)
  previewImageUrl.value = URL.createObjectURL(raw)
}

const handleCommand = (cmd: string) => {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'wallet') router.push('/wallet')
  if (cmd === 'admin') router.push('/admin')
  if (cmd === 'logout') {
    localStorage.clear()
    ElMessage.success('已退出登录')
    window.location.href = '/task'
  }
}

const scrollToTasks = () => {
  document.getElementById('task-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleDesktopSearch = (keyword: string) => {
  searchKeyword.value = keyword
  fetchData()
}

const formatMoney = (cent?: number | null) => {
  const yuan = Math.round(Number(cent || 0) / 100)
  return `￥ ${yuan.toLocaleString('zh-CN')}`
}

const formatLargeMoney = (cent: number) => {
  const yuan = cent / 100
  if (yuan >= 100000000) return `${(yuan / 100000000).toFixed(2)}亿+`
  if (yuan >= 10000) return `${Math.round(yuan / 10000)}万+`
  return `${Math.round(yuan).toLocaleString('zh-CN')}`
}

const categoryLabel = (category: string) => ({
  SKILL_SERVICE: '品牌设计',
  LIFE_ASSISTANCE: '生活协助',
  FAMILY_CARE: '家庭关怀',
  REMOTE_ASSISTANCE: '开发技术',
  COMMUNITY_COLLABORATION: '社区协作',
  PUBLIC_WELFARE: '公益互助',
  OTHER: '方案策划',
}[category] || '综合任务')

const serviceModeLabel = (mode: string) => ({
  ONLINE: '线上协作',
  OFFLINE: '线下服务',
  BOTH: '均可',
}[mode] || '线上协作')

const statusLabel = (status: string) => ({
  PENDING: '待接单',
  ASSIGNED: '协作中',
  IN_PROGRESS: '服务中',
  SUBMITTED: '待验收',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  DISPUTED: '争议中',
}[status] || status)

const truncate = (text: string, max: number) =>
  text && text.length > max ? `${text.slice(0, max)}...` : text || '需求方暂未填写详细说明'

const publisherInitial = (task: Task) =>
  task.publisher?.nickname?.[0] || task.publisher?.email?.[0]?.toUpperCase() || '浩'

const taskTag = (task: Task) => {
  if (task.price >= 5000000) return '高预算'
  if (task.status === 'PENDING') return '最新'
  return statusLabel(task.status)
}

const tagClass = (task: Task) => {
  if (task.price >= 5000000) return 'premium'
  if (task.status === 'PENDING') return 'fresh'
  return 'normal'
}

const relativeTime = (date?: string) => {
  if (!date) return '刚刚'
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.max(1, Math.round(diff / 3600000))
  return `${hours}小时前`
}

const getFullUrl = (path: string) => {
  if (!path) return ''
  return path.startsWith('http') ? path : `http://localhost:3000${path}`
}

onMounted(() => {
  fetchProfile()
  fetchUnreadCount()
  fetchWalletBalance()
  fetchData()
})
</script>

<style scoped>
.haoyu-page {
  min-height: 100vh;
  padding: 28px 42px 44px;
  color: #fff2d6;
  background:
    radial-gradient(circle at 18% 8%, rgba(206, 142, 54, .18), transparent 26%),
    radial-gradient(circle at 80% 0%, rgba(117, 74, 24, .24), transparent 32%),
    linear-gradient(145deg, #040911 0%, #07111e 45%, #160f09 100%);
  position: relative;
  overflow-x: hidden;
}

.desktop-landing-only {
  display: block;
}

.desktop-frame.legacy-mobile-shell {
  display: none;
}

.haoyu-page::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle, rgba(247, 185, 90, .48) 0 1px, transparent 2px),
    linear-gradient(110deg, transparent 0 18%, rgba(236, 160, 73, .08) 18.2%, transparent 18.6% 100%);
  background-size: 150px 150px, 360px 360px;
  opacity: .28;
}

.desktop-frame {
  position: relative;
  z-index: 1;
  max-width: 1420px;
  margin: 0 auto;
  min-height: calc(100vh - 72px);
  border: 2px solid rgba(194, 125, 45, .62);
  border-radius: 30px;
  overflow: hidden;
  background: rgba(5, 10, 20, .82);
  box-shadow: 0 28px 70px rgba(0, 0, 0, .45), 0 0 40px rgba(196, 125, 43, .18);
}

.top-nav {
  height: 74px;
  padding: 0 34px;
  display: grid;
  grid-template-columns: 250px 1fr auto;
  align-items: center;
  gap: 24px;
}

button {
  font: inherit;
  color: inherit;
}

.brand,
.nav-links button,
.ghost-login,
.icon-btn,
.user-menu,
.mobile-bottom button,
.mobile-fab {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 19px;
  font-weight: 800;
  color: #fff4dd;
}

.brand-mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 219, 143, .08);
  box-shadow: 0 0 18px rgba(238, 164, 61, .32);
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

.nav-links a,
.nav-links button {
  color: rgba(255, 232, 192, .64);
  font-size: 14px;
  text-decoration: none;
  padding: 9px 0;
}

.nav-links .active,
.nav-links a:hover,
.nav-links button:hover {
  color: #ffd88b;
}

.nav-links .active {
  border-bottom: 2px solid #f2b956;
}

.nav-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-pill {
  width: 228px;
  height: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, .055);
  border: 1px solid rgba(255, 255, 255, .08);
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 14px;
  color: rgba(255, 226, 181, .65);
}

.search-pill input {
  width: 100%;
  background: transparent;
  border: 0;
  outline: 0;
  color: #fff2d6;
  font-size: 13px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: rgba(255, 232, 192, .72);
  position: relative;
}

.icon-btn:hover,
.ghost-login:hover {
  background: rgba(255, 255, 255, .07);
}

.notice span {
  position: absolute;
  right: 3px;
  top: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 10px;
  background: #e14a3d;
  color: #fff;
  font-size: 10px;
}

.user-menu,
.ghost-login {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 18px;
  padding: 0 10px;
  color: rgba(255, 232, 192, .72);
}

.hero {
  min-height: 330px;
  padding: 78px 150px 56px;
  background-size: cover;
  background-position: center bottom;
  position: relative;
}

.hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 90px;
  background: linear-gradient(180deg, transparent, rgba(5, 10, 20, .94));
}

.hero-copy {
  max-width: 760px;
  position: relative;
  z-index: 1;
}

.hero h1 {
  margin: 0;
  font-family: Georgia, "Times New Roman", "Songti SC", serif;
  font-size: clamp(42px, 4vw, 64px);
  line-height: 1.08;
  letter-spacing: 0;
  color: #ffe8bd;
  text-shadow: 0 8px 30px rgba(0, 0, 0, .62);
}

.hero p {
  margin: 24px 0 34px;
  font-size: 18px;
  color: rgba(255, 232, 196, .72);
}

.hero-actions {
  display: flex;
  gap: 18px;
}

.primary-cta,
.secondary-cta {
  height: 54px;
  min-width: 166px;
  border-radius: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 800;
  cursor: pointer;
}

.primary-cta {
  border: 0;
  color: #231205;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  box-shadow: 0 16px 36px rgba(235, 164, 69, .34);
}

.secondary-cta {
  color: #fff1cf;
  background: rgba(4, 9, 17, .42);
  border: 1px solid rgba(255, 210, 141, .28);
}

.stats-bar {
  margin: -16px 70px 28px;
  min-height: 76px;
  border: 1px solid rgba(255, 218, 157, .18);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .045));
  backdrop-filter: blur(18px);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  position: relative;
  z-index: 2;
}

.stat-item {
  display: grid;
  grid-template-columns: 34px 1fr;
  grid-template-rows: 1fr 1fr;
  column-gap: 10px;
  align-items: center;
  padding: 16px 24px;
  border-right: 1px solid rgba(255, 255, 255, .12);
}

.stat-item:last-child {
  border-right: 0;
}

.stat-item .el-icon {
  grid-row: 1 / 3;
  font-size: 26px;
  color: #f5bd58;
}

.stat-item strong {
  color: #ffe0a5;
  font-size: 18px;
  line-height: 1;
}

.stat-item span {
  color: rgba(255, 232, 196, .62);
  font-size: 12px;
}

.process {
  padding: 10px 70px 30px;
  text-align: center;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.section-title h2,
.tasks-head h2 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0;
  color: #ffe4b5;
}

.section-title span {
  color: #f3b44e;
}

.process > p {
  margin: 8px 0 30px;
  color: rgba(255, 232, 196, .52);
}

.process-line {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 34px;
}

.process-card {
  min-height: 126px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .06), rgba(255, 255, 255, .025));
  padding: 30px 16px 18px;
  position: relative;
}

.process-card::after {
  content: "";
  position: absolute;
  left: 100%;
  top: 42px;
  width: 34px;
  border-top: 1px dashed rgba(243, 180, 78, .35);
}

.process-card:last-child::after {
  display: none;
}

.step-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  position: absolute;
  left: 50%;
  top: -23px;
  transform: translateX(-50%);
  color: #231205;
  background: linear-gradient(145deg, #ffe6a9, #d58a30);
  box-shadow: 0 0 28px rgba(231, 155, 57, .34);
}

.step-title {
  display: flex;
  justify-content: center;
  gap: 10px;
  color: #ffd78f;
  font-weight: 800;
  margin-bottom: 12px;
}

.step-title b {
  color: #f8be52;
}

.process-card span:last-child {
  display: block;
  color: rgba(255, 232, 196, .58);
  font-size: 13px;
}

.tasks-section {
  padding: 0 70px 54px;
}

.tasks-head {
  margin-top: 18px;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 22px;
}

.tabs button,
.task-controls button {
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 232, 196, .54);
  cursor: pointer;
}

.tabs button {
  padding: 9px 0;
  font-size: 15px;
}

.tabs button.active,
.tabs button:hover {
  color: #ffd36f;
  border-bottom: 2px solid #f3b44e;
}

.task-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.task-controls button {
  min-height: 34px;
  padding: 0 20px;
  border: 1px solid rgba(255, 214, 145, .12);
  background: rgba(255, 255, 255, .035);
}

.task-controls button.active,
.task-controls button:hover {
  color: #ffd36f;
  border-color: rgba(243, 180, 78, .42);
}

.filter-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.task-card {
  min-height: 170px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 10px;
  background:
    radial-gradient(circle at 92% 20%, rgba(239, 163, 60, .18), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .035));
  padding: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}

.task-card:hover {
  transform: translateY(-3px);
  border-color: rgba(246, 190, 93, .45);
  box-shadow: 0 18px 36px rgba(0, 0, 0, .28);
}

.card-glow {
  position: absolute;
  right: -18px;
  bottom: -18px;
  width: 120px;
  height: 120px;
  border: 1px solid rgba(243, 180, 78, .2);
  border-radius: 24px;
  transform: rotate(22deg);
}

.task-card-top,
.task-card footer,
.chips {
  display: flex;
  align-items: center;
}

.task-card-top {
  justify-content: space-between;
  margin-bottom: 12px;
}

.tag {
  border-radius: 7px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 800;
  color: #1d1207;
}

.tag.premium {
  background: linear-gradient(135deg, #ffe3a0, #d89534);
}

.tag.fresh {
  background: linear-gradient(135deg, #9ee6d8, #3eaa9a);
}

.tag.normal {
  background: rgba(255, 220, 153, .22);
  color: #ffd383;
}

.price {
  color: #ffd16e;
  font-size: 20px;
  font-weight: 900;
}

.task-card h3 {
  margin: 0 0 8px;
  font-size: 19px;
  color: #fff3db;
}

.task-card p {
  margin: 0 0 14px;
  min-height: 24px;
  color: rgba(255, 232, 196, .6);
}

.chips {
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.chips span {
  padding: 5px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .06);
  color: rgba(255, 232, 196, .54);
  font-size: 12px;
}

.task-card footer {
  justify-content: space-between;
  gap: 12px;
  color: rgba(255, 232, 196, .46);
  font-size: 12px;
}

.publisher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.avatar-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  color: #1b1006;
  background: linear-gradient(135deg, #ffe8ae, #e7a648);
  font-size: 12px;
  font-weight: 900;
}

.more-btn {
  display: block;
  min-width: 340px;
  height: 48px;
  margin: 26px auto 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 214, 145, .18);
  background: rgba(255, 255, 255, .025);
  color: #ffd57f;
  cursor: pointer;
}

.route-content {
  padding: 28px 34px 54px;
}

.mobile-bottom,
.mobile-fab {
  display: none;
}

.reference-preview {
  margin-top: 12px;
  width: 150px;
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 214, 145, .18);
}

.reference-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.haoyu-dialog .el-dialog) {
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 232, 174, .075), transparent 22%),
    radial-gradient(circle at 90% 8%, rgba(239, 163, 60, .20), transparent 28%),
    radial-gradient(circle at 8% 100%, rgba(124, 101, 216, .12), transparent 32%),
    rgba(8, 14, 28, .94);
  border: 1px solid rgba(255, 214, 145, .22);
  box-shadow:
    0 34px 96px rgba(0, 0, 0, .56),
    0 0 58px rgba(196, 125, 43, .18),
    0 0 0 1px rgba(255, 255, 255, .045) inset;
  backdrop-filter: blur(22px);
  overflow: hidden;
}

:deep(.haoyu-dialog .el-dialog::before) {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent, rgba(255, 232, 174, .12), transparent) 0 0 / 100% 1px no-repeat,
    radial-gradient(circle at 18% 8%, rgba(255, 214, 145, .16), transparent 18%);
}

:global(.haoyu-dialog-modal) {
  background: rgba(0, 0, 0, .72) !important;
  backdrop-filter: blur(5px);
}

:deep(.haoyu-dialog .el-dialog__header) {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 24px 28px 12px;
  border-bottom: 1px solid rgba(255, 214, 145, .12);
}

:deep(.haoyu-dialog .el-dialog__body) {
  position: relative;
  z-index: 1;
  padding: 22px 28px 8px;
  color: rgba(255, 232, 196, .72);
}

:deep(.haoyu-dialog .el-dialog__footer) {
  position: relative;
  z-index: 1;
  padding: 14px 28px 26px;
  border-top: 1px solid rgba(255, 214, 145, .10);
}

.dialog-title {
  display: inline-flex;
  align-items: center;
  color: transparent;
  background: linear-gradient(135deg, #fff1c4, #f2b34d 58%, #bba8ff);
  -webkit-background-clip: text;
  background-clip: text;
  font-size: 22px;
  font-weight: 900;
  text-shadow: 0 12px 34px rgba(242, 179, 77, .22);
}

:deep(.haoyu-dialog .el-dialog__close) {
  color: rgba(255, 232, 196, .58);
}

:deep(.haoyu-dialog .el-dialog__close:hover) {
  color: #ffd16e;
}

:deep(.haoyu-dialog .el-form-item) {
  margin-bottom: 19px;
}

:deep(.haoyu-dialog .el-form-item__label) {
  color: rgba(255, 232, 196, .8);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 8px;
}

:deep(.haoyu-dialog .el-input__wrapper),
:deep(.haoyu-dialog .el-textarea__inner),
:deep(.haoyu-dialog .el-input-number .el-input__wrapper),
:deep(.haoyu-dialog .el-select .el-input__wrapper) {
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .065), rgba(255, 255, 255, .025)), rgba(4, 9, 17, .76);
  box-shadow:
    0 0 0 1px rgba(255, 214, 145, .18) inset,
    0 12px 24px rgba(0, 0, 0, .18);
  transition: box-shadow .18s ease, background .18s ease;
}

:deep(.haoyu-dialog .el-input__wrapper:hover),
:deep(.haoyu-dialog .el-textarea__inner:hover),
:deep(.haoyu-dialog .el-select .el-input__wrapper:hover),
:deep(.haoyu-dialog .el-input-number:hover .el-input__wrapper) {
  background: linear-gradient(180deg, rgba(255, 232, 174, .09), rgba(255, 255, 255, .03)), rgba(4, 9, 17, .82);
  box-shadow:
    0 0 0 1px rgba(243, 180, 78, .42) inset,
    0 0 22px rgba(243, 180, 78, .08);
}

:deep(.haoyu-dialog .el-input__wrapper.is-focus),
:deep(.haoyu-dialog .el-textarea__inner:focus),
:deep(.haoyu-dialog .el-select .el-input__wrapper.is-focus),
:deep(.haoyu-dialog .el-input-number .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(255, 216, 139, .64) inset,
    0 0 0 3px rgba(243, 180, 78, .12),
    0 0 26px rgba(243, 180, 78, .10);
}

:deep(.haoyu-dialog .el-input__inner),
:deep(.haoyu-dialog .el-textarea__inner),
:deep(.haoyu-dialog .el-select__placeholder) {
  color: #fff2d6;
}

:deep(.haoyu-dialog .el-input__inner::placeholder),
:deep(.haoyu-dialog .el-textarea__inner::placeholder) {
  color: rgba(166, 183, 207, .56);
}

:deep(.haoyu-dialog .el-input .el-input__count),
:deep(.haoyu-dialog .el-textarea .el-input__count) {
  color: rgba(255, 232, 196, .42);
  background: transparent;
}

:deep(.haoyu-dialog .el-select .el-icon) {
  color: rgba(255, 214, 145, .66);
}

:deep(.haoyu-dialog .el-input-number) {
  width: 100%;
  border-radius: 14px;
  background: rgba(4, 9, 17, .72);
}

:deep(.haoyu-dialog .el-input-number__decrease),
:deep(.haoyu-dialog .el-input-number__increase) {
  width: 42px;
  color: rgba(255, 232, 196, .74);
  background: linear-gradient(180deg, rgba(255, 232, 174, .08), rgba(255, 255, 255, .025)), rgba(7, 14, 27, .84);
  border-color: rgba(255, 214, 145, .18);
}

:deep(.haoyu-dialog .el-input-number__decrease:hover),
:deep(.haoyu-dialog .el-input-number__increase:hover) {
  color: #ffd16e;
  background: rgba(242, 179, 77, .16);
}

:deep(.haoyu-dialog .el-input-number__decrease.is-disabled),
:deep(.haoyu-dialog .el-input-number__increase.is-disabled) {
  color: rgba(166, 183, 207, .32);
  background: rgba(255, 255, 255, .025);
}

:deep(.haoyu-dialog .el-radio__label) {
  color: rgba(166, 183, 207, .78);
  transition: color .18s ease;
}

:deep(.haoyu-dialog .el-radio__inner) {
  background: rgba(4, 9, 17, .78);
  border-color: rgba(255, 214, 145, .32);
}

:deep(.haoyu-dialog .el-radio__input.is-checked .el-radio__inner) {
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  border-color: #f2b34d;
  box-shadow: 0 0 0 3px rgba(242, 179, 77, .13);
}

:deep(.haoyu-dialog .el-radio__input.is-checked + .el-radio__label) {
  color: #ffd16e;
}

:deep(.haoyu-dialog .el-button) {
  border-radius: 999px;
  border-color: rgba(255, 214, 145, .20);
  background: rgba(255, 255, 255, .055);
  color: #ffe5b6;
  min-height: 42px;
  padding: 0 20px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(0, 0, 0, .18);
}

:deep(.haoyu-dialog .el-button:hover) {
  border-color: rgba(243, 180, 78, .48);
  background: rgba(242, 179, 77, .12);
  color: #ffd16e;
  box-shadow: 0 14px 30px rgba(242, 179, 77, .14);
}

:deep(.haoyu-dialog .el-button--primary),
:deep(.haoyu-dialog .dialog-btn-primary) {
  border: 0;
  color: #241307;
  font-weight: 800;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d) !important;
  box-shadow: 0 14px 30px rgba(235, 164, 69, .26);
}

:deep(.haoyu-dialog .el-button--primary:hover),
:deep(.haoyu-dialog .dialog-btn-primary:hover) {
  color: #1d1207;
  background: linear-gradient(135deg, #fff0bd, #d89a37 54%, #7c65d8) !important;
}

:deep(.haoyu-dialog .el-dialog__footer .el-button:first-child),
:deep(.haoyu-dialog .dialog-btn-ghost) {
  min-width: 96px;
  color: rgba(255, 232, 196, .82);
  background: linear-gradient(180deg, rgba(255, 255, 255, .065), rgba(255, 255, 255, .025)), rgba(7, 14, 27, .78);
  border-color: rgba(255, 214, 145, .24);
}

:deep(.haoyu-dialog .el-dialog__footer .el-button:last-child),
:deep(.haoyu-dialog .dialog-btn-primary) {
  min-width: 116px;
}

:deep(.haoyu-dialog .el-upload .el-button) {
  border-color: rgba(255, 214, 145, .30);
  background:
    linear-gradient(180deg, rgba(255, 232, 174, .10), rgba(255, 255, 255, .025)),
    rgba(7, 14, 27, .78);
  color: #ffe4ad;
}

:deep(.haoyu-dialog .el-upload .el-button:hover) {
  border-color: rgba(255, 216, 139, .58);
  background: rgba(242, 179, 77, .14);
  box-shadow: 0 0 26px rgba(242, 179, 77, .14);
}

:global(.haoyu-select-popper.el-popper) {
  border: 1px solid rgba(255, 214, 145, .22) !important;
  border-radius: 16px !important;
  background:
    radial-gradient(circle at 100% 0%, rgba(242, 179, 77, .16), transparent 30%),
    rgba(7, 13, 25, .96) !important;
  box-shadow: 0 22px 56px rgba(0, 0, 0, .44), 0 0 32px rgba(242, 179, 77, .10) !important;
  backdrop-filter: blur(18px);
  overflow: hidden;
}

:global(.haoyu-select-popper .el-select-dropdown) {
  background: transparent !important;
}

:global(.haoyu-select-popper .el-select-dropdown__wrap) {
  background: transparent !important;
}

:global(.haoyu-select-popper .el-select-dropdown__item) {
  color: rgba(255, 232, 196, .78) !important;
  background: transparent !important;
}

:global(.haoyu-select-popper .el-select-dropdown__item.hover),
:global(.haoyu-select-popper .el-select-dropdown__item:hover) {
  color: #ffd16e !important;
  background: rgba(242, 179, 77, .14) !important;
}

:global(.haoyu-select-popper .el-select-dropdown__item.is-selected) {
  color: #ffe8ae !important;
  font-weight: 800;
  background: rgba(242, 179, 77, .18) !important;
}

:global(.haoyu-select-popper .el-popper__arrow::before) {
  background: rgba(7, 13, 25, .96) !important;
  border-color: rgba(255, 214, 145, .22) !important;
}

@media (max-width: 1180px) {
  .desktop-landing-only {
    display: none;
  }

  .desktop-frame.legacy-mobile-shell {
    display: block;
  }

  .haoyu-page {
    padding: 0;
  }

  .desktop-frame {
    min-height: 100vh;
    border: 0;
    border-radius: 0;
  }

  .top-nav {
    grid-template-columns: 1fr auto;
    padding: 0 22px;
  }

  .nav-links,
  .search-pill,
  .nav-tools .icon-btn,
  .user-menu {
    display: none;
  }

  .hero {
    min-height: 336px;
    padding: 82px 24px 42px;
    background-position: center bottom;
  }

  .hero h1 {
    max-width: 330px;
    font-size: 32px;
  }

  .hero p {
    max-width: 260px;
    font-size: 14px;
    margin: 18px 0 24px;
  }

  .hero-actions {
    gap: 10px;
  }

  .primary-cta,
  .secondary-cta {
    min-width: 118px;
    height: 44px;
    font-size: 13px;
  }

  .stats-bar {
    margin: 0 14px 28px;
    grid-template-columns: repeat(4, 1fr);
  }

  .stats-bar .stat-item:last-child {
    display: none;
  }

  .stat-item {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    text-align: center;
    padding: 14px 8px;
    border-right: 0;
  }

  .stat-item .el-icon {
    grid-row: auto;
    margin: 0 auto 6px;
    font-size: 19px;
  }

  .stat-item strong {
    font-size: 14px;
  }

  .process {
    padding: 0 16px 28px;
    text-align: left;
  }

  .section-title {
    justify-content: flex-start;
  }

  .section-title h2,
  .tasks-head h2 {
    font-size: 20px;
  }

  .process-line {
    grid-template-columns: repeat(5, minmax(72px, 1fr));
    gap: 8px;
    overflow-x: auto;
    padding-top: 18px;
  }

  .process-card {
    min-width: 78px;
    min-height: 96px;
    padding: 28px 8px 10px;
    text-align: center;
  }

  .process-card::after {
    display: none;
  }

  .step-title {
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
  }

  .process-card span:last-child {
    display: none;
  }

  .tasks-section {
    padding: 0 14px 94px;
  }

  .tabs {
    gap: 20px;
    overflow-x: auto;
  }

  .task-controls {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }

  .task-controls button {
    white-space: nowrap;
  }

  .filter-btn {
    margin-left: 0;
  }

  .task-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .task-card {
    min-height: 144px;
    padding: 16px;
  }

  .more-btn {
    display: none;
  }

  .mobile-bottom {
    position: fixed;
    left: 14px;
    right: 14px;
    bottom: 12px;
    z-index: 20;
    height: 62px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid rgba(255, 214, 145, .16);
    border-radius: 20px;
    background: rgba(4, 9, 17, .88);
    backdrop-filter: blur(18px);
    box-shadow: 0 18px 50px rgba(0, 0, 0, .45);
  }

  .mobile-bottom button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: rgba(255, 232, 196, .58);
    font-size: 11px;
  }

  .mobile-bottom button.active {
    color: #ffd073;
  }

  .mobile-bottom .el-icon {
    font-size: 20px;
  }

  .mobile-fab {
    position: fixed;
    right: 20px;
    bottom: 86px;
    z-index: 21;
    width: 78px;
    height: 78px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: #241305;
    background: linear-gradient(145deg, #ffe9ac, #f1ad43);
    box-shadow: 0 18px 36px rgba(236, 163, 62, .34);
    font-size: 11px;
    font-weight: 900;
  }

  .mobile-fab .el-icon {
    font-size: 24px;
  }

  .mobile-fab img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
}

@media (max-width: 620px) {
  .brand {
    font-size: 17px;
  }

  .stats-bar {
    border-radius: 10px;
  }

  .stat-item span {
    font-size: 11px;
  }

  .price {
    font-size: 17px;
  }
}
</style>
