<template>
  <div class="haoyu-page" :class="{ 'is-home-page': isHome }">
    <div class="pc-home-layout" :class="{ 'is-home': isHome }">
    <main class="desktop-frame">
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
            <el-avatar :size="30" :src="userAvatarSrc" @error="handleAvatarError">
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
        <section id="task-section" class="tasks-section">
          <div class="tasks-head">
            <div class="tabs">
              <h2>精选任务</h2>
              <button :class="{ active: taskViewFilter === 'recommend' }" @click="setTaskView('recommend')">推荐</button>
              <button :class="{ active: taskViewFilter === 'high' }" @click="setTaskView('high')">高预算</button>
              <button :class="{ active: taskViewFilter === 'latest' }" @click="setTaskView('latest')">最新发布</button>
            </div>
            <div class="task-controls">
              <button v-for="cat in categories" :key="cat.value" :class="{ active: categoryFilter === cat.value }" @click="categoryFilter = cat.value">
                {{ cat.label }}
              </button>
              <el-dropdown trigger="click" popper-class="haoyu-task-sort-popper" @command="setSortMode">
                <button class="filter-btn">
                  <el-icon><Filter /></el-icon>{{ sortModeLabel }}<el-icon><CaretBottom /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="item in sortOptions" :key="item.value" :command="item.value">
                      {{ item.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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

    <aside v-if="isHome" class="account-preview" aria-label="个人工作台">
      <section class="account-panel">
        <div class="account-panel__glow"></div>
        <div class="account-panel__head">
          <span class="account-brand"><img :src="brandLogoSrc" alt="" /></span>
          <div>
            <small>个人工作台</small>
            <strong>浩煜协作中枢</strong>
          </div>
          <button class="account-bell" aria-label="通知" @click="router.push('/notifications')">
            <el-icon><Bell /></el-icon>
            <span v-if="unreadCount">{{ unreadCount }}</span>
          </button>
        </div>

        <template v-if="isLogin && currentUser">
          <div class="account-hero-card">
            <el-avatar :size="62" :src="userAvatarSrc" @error="handleAvatarError">
              {{ userInitial }}
            </el-avatar>
            <div class="account-identity">
              <span>{{ accountRoleLabel }}</span>
              <h3>{{ currentUser.nickname || '浩煜用户' }}</h3>
              <p>{{ currentUser.email }}</p>
            </div>
          </div>

          <div class="account-metrics">
            <div>
              <span>可用余额</span>
              <strong>{{ accountBalanceText }}</strong>
            </div>
            <div>
              <span>未读通知</span>
              <strong>{{ unreadCount || 0 }}</strong>
            </div>
          </div>

          <div class="account-info-list">
            <div>
              <span>账号状态</span>
              <b>安全在线</b>
            </div>
            <div>
              <span>加入时间</span>
              <b>{{ accountCreatedText }}</b>
            </div>
            <div>
              <span>个人简介</span>
              <b>{{ currentUser.bio || '让每一次协作都有回响' }}</b>
            </div>
          </div>

          <div class="account-actions">
            <button class="account-action primary" @click="openCreateDialog">发布需求</button>
            <button class="account-action" @click="handleCommand('profile')">个人资料</button>
            <button class="account-action" @click="handleCommand('wallet')">钱包中心</button>
            <button class="account-action" @click="router.push('/notifications')">通知中心</button>
            <button v-if="canSeeUserManage" class="account-action" @click="handleCommand('admin')">管理后台</button>
            <button class="account-action danger" @click="handleCommand('logout')">退出登录</button>
          </div>
        </template>

        <template v-else>
          <div class="account-guest-card">
            <div class="guest-avatar"><el-icon><User /></el-icon></div>
            <span>访客模式</span>
            <h3>登录后查看个人工作台</h3>
            <p>同步余额、通知、资料与发布入口，让你的需求和协作都在同一处流转。</p>
          </div>

          <div class="guest-actions">
            <button class="account-action primary" @click="router.push('/login')">立即登录</button>
            <button class="account-action" @click="router.push('/register')">免费注册</button>
            <button class="account-action" @click="scrollToTasks">先逛任务</button>
          </div>

          <div class="account-trust-list">
            <div>
              <el-icon><Lock /></el-icon>
              <span>资金托管</span>
              <b>平台保障协作权益</b>
            </div>
            <div>
              <el-icon><CircleCheck /></el-icon>
              <span>验收结算</span>
              <b>交付路径清晰可追溯</b>
            </div>
            <div>
              <el-icon><Star /></el-icon>
              <span>信用沉淀</span>
              <b>好评与履约持续累积</b>
            </div>
          </div>
        </template>
      </section>
    </aside>
    </div>

    <footer class="site-footer" aria-label="站点版权信息">
      <div class="site-footer__brand">浩煜·万家灯火</div>
      <div class="site-footer__links">
        <span>可信协作</span>
        <span>资金托管</span>
        <span>过程留痕</span>
      </div>
      <p>© 2026 HaoYu. All rights reserved.</p>
    </footer>
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
        <div class="dialog-title"><strong>发布新的协作需求</strong><span>资金托管、协作交付、验收结算一步进入浩煜流程</span></div>
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
            <el-button class="upload-reference-btn" :loading="uploadingImg">{{ previewImageUrl ? '重新选择图片' : '添加参考图' }}</el-button>
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
        <el-button class="dialog-btn-ghost" @click="showCreateDialog = false">取消</el-button>
        <el-button class="dialog-btn-primary" type="primary" :loading="submitting" @click="submitTask">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
import { resolveApiAssetUrl } from '@/api/http'

const router = useRouter()
const route = useRoute()

const currentUser = ref<UserProfile | null>(null)
const heroBgSrc = heroBg
const brandLogoSrc = brandLogo
const addButtonSrc = addButton
const defaultAvatarSrc = defaultAvatar
const avatarLoadFailed = ref(false)
const walletBalance = ref(0)
const unreadCount = ref(0)
const loading = ref(false)
const tasks = ref<Task[]>([])
const searchKeyword = ref('')
const priceFilter = ref('all')
const categoryFilter = ref('all')
const taskViewFilter = ref<'recommend' | 'high' | 'latest'>('recommend')
const sortMode = ref<'default' | 'price_desc' | 'price_asc' | 'latest'>('default')
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
const userAvatarSrc = computed(() => {
  if (avatarLoadFailed.value) return defaultAvatarSrc
  const avatar = currentUser.value?.avatar?.trim()
  if (!avatar || !isUsableAvatarValue(avatar)) return defaultAvatarSrc
  return getFullUrl(avatar)
})
const canSeeUserManage = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.value?.role || ''))
const accountRoleLabel = computed(() => ({
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  USER: '认证用户',
}[currentUser.value?.role || 'USER'] || '认证用户'))
const accountBalanceText = computed(() => formatAccountMoney(walletBalance.value || currentUser.value?.wallet?.available || currentUser.value?.balance || 0))
const accountCreatedText = computed(() => currentUser.value?.createdAt ? new Date(currentUser.value.createdAt).toLocaleDateString('zh-CN') : '待完善')

const stats = computed(() => [
  { icon: User, value: '10万+', label: '注册用户' },
  { icon: Briefcase, value: '3万+', label: '完成任务' },
  { icon: Star, value: '98.6%', label: '好评率' },
  { icon: WalletFilled, value: '1.2亿+', label: '托管资金(元)' },
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

const sortOptions = [
  { label: '默认排序', value: 'default' },
  { label: '预算从高到低', value: 'price_desc' },
  { label: '预算从低到高', value: 'price_asc' },
  { label: '最新发布', value: 'latest' },
] as const

const sortModeLabel = computed(() => sortOptions.find((item) => item.value === sortMode.value)?.label || '默认排序')

const visibleTasks = computed(() => {
  let list = [...(tasks.value.length ? tasks.value : demoTasks)]
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter((task) =>
      `${task.title} ${task.description}`.toLowerCase().includes(kw),
    )
  }
  if (categoryFilter.value !== 'all') {
    list = list.filter((task) => task.category === categoryFilter.value)
  }
  if (taskViewFilter.value === 'high' || priceFilter.value === 'high') {
    list = list.filter((task) => task.price >= 5000000)
  }
  if (taskViewFilter.value === 'latest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortMode.value === 'price_desc') {
    list.sort((a, b) => b.price - a.price)
  } else if (sortMode.value === 'price_asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortMode.value === 'latest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else {
    list.sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING') || b.price - a.price)
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

const setTaskView = (view: 'recommend' | 'high' | 'latest') => {
  taskViewFilter.value = view
  priceFilter.value = view === 'high' ? 'high' : 'all'
  if (view === 'latest') sortMode.value = 'latest'
  if (view === 'recommend') sortMode.value = 'default'
}

const setSortMode = (mode: 'default' | 'price_desc' | 'price_asc' | 'latest') => {
  sortMode.value = mode
  if (mode === 'latest') taskViewFilter.value = 'latest'
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
    avatarLoadFailed.value = false
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

const formatAccountMoney = (cent?: number | null) => {
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
  return resolveApiAssetUrl(path)
}

const isUsableAvatarValue = (value: string) =>
  /^(https?:\/\/|data:image\/|\/?uploads\/|\/?assets\/)/i.test(value)

const handleAvatarError = () => {
  avatarLoadFailed.value = true
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

.haoyu-page.is-home-page {
  padding: 12px;
}

.pc-home-layout {
  position: relative;
  z-index: 1;
}

.pc-home-layout.is-home {
  max-width: 1720px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 252px;
  align-items: start;
  gap: 14px;
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

.pc-home-layout.is-home .desktop-frame {
  max-width: none;
  margin: 0;
}

.site-footer {
  position: relative;
  z-index: 1;
  max-width: 1420px;
  margin: 18px auto 0;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid rgba(255, 214, 145, .14);
  border-radius: 18px;
  color: rgba(255, 232, 196, .66);
  background: linear-gradient(135deg, rgba(5, 10, 20, .72), rgba(10, 18, 32, .54));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05), 0 16px 34px rgba(0, 0, 0, .18);
}

.site-footer__brand {
  color: #ffe8ae;
  font-size: 15px;
  font-weight: 800;
}

.site-footer__links {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.site-footer__links span {
  position: relative;
}

.site-footer__links span + span::before {
  content: "";
  position: absolute;
  left: -7px;
  top: 50%;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 214, 145, .48);
  transform: translateY(-50%);
}

.site-footer p {
  margin: 0;
  font-size: 12px;
  color: rgba(205, 217, 234, .58);
}

.account-preview {
  position: sticky;
  top: 22px;
  z-index: 1;
}

.account-panel {
  position: relative;
  min-height: calc(100vh - 56px);
  max-height: 940px;
  overflow: hidden;
  border: 2px solid rgba(194, 125, 45, .58);
  border-radius: 30px;
  padding: 18px 14px 16px;
  color: #fff2d6;
  background:
    linear-gradient(180deg, rgba(7, 13, 26, .9), rgba(5, 10, 20, .98)),
    radial-gradient(circle at 82% 16%, rgba(245, 158, 11, .24), transparent 30%),
    radial-gradient(circle at 12% 72%, rgba(93, 129, 166, .18), transparent 34%),
    #060b15;
  box-shadow: 0 24px 60px rgba(0, 0, 0, .48), 0 0 34px rgba(196, 125, 43, .22);
}

.account-panel__glow {
  position: absolute;
  inset: 1px;
  border-radius: 28px;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 232, 174, .12), transparent 28%, rgba(255, 255, 255, .04));
  mask-image: linear-gradient(#000, transparent 62%);
}

.account-panel__head,
.account-hero-card,
.account-metrics,
.account-info-list div,
.account-trust-list div {
  position: relative;
  display: flex;
  align-items: center;
}

.account-panel__head {
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.account-brand,
.account-bell,
.guest-avatar {
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 214, 145, .18);
  background: rgba(255, 214, 145, .08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08), 0 0 18px rgba(238, 164, 61, .14);
}

.account-brand {
  width: 34px;
  height: 34px;
  border-radius: 13px;
}

.account-brand img {
  width: 22px;
  height: 22px;
}

.account-panel__head div {
  flex: 1;
  min-width: 0;
}

.account-panel__head small,
.account-identity span,
.account-metrics span,
.account-info-list span,
.account-trust-list span {
  display: block;
  color: rgba(183, 200, 220, .72);
  font-size: 12px;
}

.account-panel__head strong {
  display: block;
  margin-top: 2px;
  color: #ffe8ae;
  font-size: 15px;
}

.account-bell {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #ffe8ae;
  cursor: pointer;
}

.account-bell span {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  color: #fff;
  background: #ef4444;
  font-size: 10px;
  line-height: 16px;
}

.account-hero-card,
.account-guest-card,
.account-metrics,
.account-info-list,
.account-trust-list {
  border: 1px solid rgba(255, 214, 145, .15);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .07), rgba(255, 255, 255, .03));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .07);
}

.account-hero-card {
  gap: 12px;
  padding: 14px;
}

.account-hero-card .el-avatar {
  flex: 0 0 auto;
  border: 2px solid rgba(255, 214, 145, .32);
  box-shadow: 0 12px 30px rgba(0, 0, 0, .28), 0 0 24px rgba(242, 179, 77, .16);
}

.account-identity {
  min-width: 0;
}

.account-identity span,
.account-guest-card span {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  color: #2a1a05;
  background: linear-gradient(135deg, #ffe8ae, #d99b43);
  font-size: 11px;
  font-weight: 800;
}

.account-identity h3,
.account-guest-card h3 {
  margin: 8px 0 4px;
  color: #fff7dd;
  font-size: 19px;
  line-height: 1.2;
}

.account-identity p,
.account-guest-card p {
  margin: 0;
  color: rgba(255, 232, 196, .66);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.account-metrics {
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding: 13px;
}

.account-metrics div {
  flex: 1;
  min-width: 0;
}

.account-metrics strong {
  display: block;
  margin-top: 5px;
  color: #ffd073;
  font-size: 17px;
}

.account-info-list,
.account-trust-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
  padding: 13px;
}

.account-info-list div,
.account-trust-list div {
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.account-info-list b,
.account-trust-list b {
  min-width: 0;
  color: rgba(255, 247, 221, .9);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  overflow-wrap: anywhere;
}

.account-actions,
.guest-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.account-action {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 999px;
  color: #fff2d6;
  background: rgba(255, 255, 255, .06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);
  cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}

.account-action:hover {
  border-color: rgba(255, 214, 145, .42);
  box-shadow: 0 0 20px rgba(242, 179, 77, .16), inset 0 1px 0 rgba(255, 255, 255, .09);
  transform: translateY(-1px);
}

.account-action.primary {
  grid-column: 1 / -1;
  color: #2a1a05;
  font-weight: 800;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  box-shadow: 0 12px 28px rgba(242, 179, 77, .26);
}

.account-action.danger {
  color: #ffd7c2;
  border-color: rgba(207, 97, 74, .32);
}

.account-guest-card {
  padding: 18px 14px;
  text-align: center;
}

.guest-avatar {
  width: 62px;
  height: 62px;
  margin: 0 auto 12px;
  border-radius: 22px;
  color: #ffe8ae;
  font-size: 28px;
}

.account-guest-card span {
  margin: 0 auto;
}

.account-trust-list div {
  justify-content: flex-start;
  align-items: flex-start;
}

.account-trust-list .el-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #ffd073;
}

.account-trust-list b {
  flex: 1;
  text-align: left;
}
.top-nav {
  height: 74px;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 205px 1fr auto;
  align-items: center;
  gap: 14px;
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
  font-size: 18px;
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
  gap: 18px;
  white-space: nowrap;
}

.nav-links a,
.nav-links button {
  color: rgba(255, 232, 192, .64);
  font-size: 13px;
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
  gap: 9px;
}

.search-pill {
  width: 190px;
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

.pc-home-layout.is-home .hero-copy {
  max-width: 880px;
}

.pc-home-layout.is-home .hero h1 {
  font-size: clamp(40px, 3.45vw, 58px);
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
}



.task-controls :deep(.el-dropdown) {
  margin-left: auto;
}
:global(.haoyu-task-sort-popper.el-popper) {
  border: 1px solid rgba(255, 214, 145, .22) !important;
  border-radius: 14px !important;
  background:
    radial-gradient(circle at 100% 0%, rgba(242, 179, 77, .16), transparent 30%),
    rgba(7, 13, 25, .97) !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, .42), 0 0 26px rgba(242, 179, 77, .10) !important;
  overflow: hidden;
}

:global(.haoyu-task-sort-popper .el-dropdown-menu) {
  background: transparent !important;
  border: 0 !important;
  padding: 6px !important;
}

:global(.haoyu-task-sort-popper .el-dropdown-menu__item) {
  color: rgba(255, 232, 196, .82) !important;
  border-radius: 10px;
}

:global(.haoyu-task-sort-popper .el-dropdown-menu__item:hover) {
  color: #ffd16e !important;
  background: rgba(242, 179, 77, .14) !important;
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
    linear-gradient(180deg, rgba(7, 12, 24, .90), rgba(5, 10, 20, .96)),
    var(--dialog-hero);
  border: 1px solid rgba(255, 214, 145, .22);
  box-shadow:
    0 34px 96px rgba(0, 0, 0, .56),
    0 0 58px rgba(196, 125, 43, .18),
    0 0 0 1px rgba(255, 255, 255, .045) inset;
  backdrop-filter: blur(22px);
  background-size: cover;
  background-position: center;
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



:deep(.haoyu-dialog .el-input__count-inner),
:deep(.haoyu-dialog .el-textarea .el-input__count-inner) {
  color: rgba(255, 232, 196, .58) !important;
  background: transparent !important;
}

:deep(.haoyu-dialog .el-button.upload-reference-btn),
:deep(.haoyu-dialog .el-button.dialog-btn-ghost),
:deep(.haoyu-dialog .el-button.dialog-btn-primary) {
  border-radius: 999px !important;
}

:deep(.haoyu-dialog .el-select__selected-item),
:deep(.haoyu-dialog .el-select__placeholder) {
  color: #fff2d6 !important;
}
/* Create task dialog: final warm-gold glass polish */
:deep(.haoyu-dialog .el-dialog) {
  width: min(560px, calc(100vw - 32px));
  overflow: hidden;
}

:deep(.haoyu-dialog .el-dialog__header) {
  padding: 28px 32px 15px;
  background:
    linear-gradient(90deg, rgba(255, 232, 174, .075), transparent 72%),
    rgba(255, 255, 255, .015);
}

:deep(.haoyu-dialog .el-dialog__body) {
  padding: 20px 32px 10px;
}

:deep(.haoyu-dialog .el-dialog__footer) {
  padding: 16px 32px 28px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, .16));
}

.dialog-title {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.dialog-title strong {
  font-size: 21px;
  line-height: 1.2;
  background: linear-gradient(135deg, #fff2c7, #f2b34d 66%, #b98cff);
  -webkit-background-clip: text;
  color: transparent;
}

.dialog-title span {
  color: rgba(183, 200, 220, .66);
  font-size: 12px;
  font-weight: 600;
}

.publish-form {
  display: grid;
  gap: 2px;
}

:deep(.haoyu-dialog .el-form-item) {
  position: relative;
  margin-bottom: 18px;
  padding: 12px;
  border: 1px solid rgba(255, 214, 145, .105);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .035), rgba(255, 255, 255, .014)),
    rgba(3, 8, 17, .22);
}

:deep(.haoyu-dialog .el-form-item:hover) {
  border-color: rgba(255, 214, 145, .20);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .035), 0 0 22px rgba(242, 179, 77, .045);
}

:deep(.haoyu-dialog .el-form-item__label) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 18px;
  padding: 0;
  color: #f7dca5;
  text-shadow: 0 0 14px rgba(242, 179, 77, .12);
}

:deep(.haoyu-dialog .el-form-item.is-required .el-form-item__label::before) {
  color: #f07d63;
}

:deep(.haoyu-dialog .el-input__wrapper),
:deep(.haoyu-dialog .el-select__wrapper),
:deep(.haoyu-dialog .el-textarea__inner),
:deep(.haoyu-dialog .el-input-number .el-input__wrapper) {
  min-height: 40px;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .055), rgba(255, 255, 255, .018)),
    rgba(3, 8, 17, .86) !important;
  border: 1px solid rgba(255, 214, 145, .18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .045), 0 10px 24px rgba(0, 0, 0, .16) !important;
}

:deep(.haoyu-dialog .el-input__wrapper:hover),
:deep(.haoyu-dialog .el-select__wrapper:hover),
:deep(.haoyu-dialog .el-textarea__inner:hover),
:deep(.haoyu-dialog .el-input-number:hover .el-input__wrapper) {
  border-color: rgba(255, 214, 145, .36);
  background:
    linear-gradient(180deg, rgba(255, 232, 174, .075), rgba(255, 255, 255, .02)),
    rgba(5, 12, 24, .92) !important;
  box-shadow: 0 0 0 1px rgba(243, 180, 78, .18), 0 0 24px rgba(243, 180, 78, .08) !important;
}

:deep(.haoyu-dialog .el-input__wrapper.is-focus),
:deep(.haoyu-dialog .el-select__wrapper.is-focused),
:deep(.haoyu-dialog .el-textarea__inner:focus),
:deep(.haoyu-dialog .el-input-number .el-input__wrapper.is-focus) {
  border-color: rgba(255, 216, 139, .62);
  box-shadow: 0 0 0 1px rgba(255, 216, 139, .32), 0 0 0 4px rgba(243, 180, 78, .10), 0 0 30px rgba(243, 180, 78, .12) !important;
}

:deep(.haoyu-dialog .el-input__inner),
:deep(.haoyu-dialog .el-select__selected-item),
:deep(.haoyu-dialog .el-select__placeholder),
:deep(.haoyu-dialog .el-input-number .el-input__inner),
:deep(.haoyu-dialog .el-textarea__inner) {
  color: #fff2d6 !important;
  font-weight: 650;
}

:deep(.haoyu-dialog .el-input__inner::placeholder),
:deep(.haoyu-dialog .el-textarea__inner::placeholder) {
  color: rgba(166, 183, 207, .58) !important;
  font-weight: 500;
}

:deep(.haoyu-dialog .el-input .el-input__count),
:deep(.haoyu-dialog .el-textarea .el-input__count) {
  right: 10px;
  border-radius: 999px;
  padding: 1px 7px;
  color: rgba(255, 232, 196, .56) !important;
  background: rgba(4, 9, 17, .78) !important;
  box-shadow: 0 0 0 1px rgba(255, 214, 145, .12) inset;
}

:deep(.haoyu-dialog .el-select__caret) {
  color: #ffd073 !important;
}

:deep(.haoyu-dialog .el-input-number) {
  border: 0;
  background: transparent !important;
}

:deep(.haoyu-dialog .el-input-number__decrease),
:deep(.haoyu-dialog .el-input-number__increase) {
  top: 1px;
  bottom: 1px;
  width: 44px;
  color: #ffe8ae !important;
  background:
    linear-gradient(180deg, rgba(255, 232, 174, .09), rgba(255, 255, 255, .02)),
    rgba(3, 8, 17, .92) !important;
  border-color: rgba(255, 214, 145, .16) !important;
}

:deep(.haoyu-dialog .el-input-number__decrease) {
  left: 1px;
  border-radius: 13px 0 0 13px;
}

:deep(.haoyu-dialog .el-input-number__increase) {
  right: 1px;
  border-radius: 0 13px 13px 0;
}

:deep(.haoyu-dialog .el-input-number__decrease:hover),
:deep(.haoyu-dialog .el-input-number__increase:hover) {
  color: #2a1a05 !important;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d) !important;
}

:deep(.haoyu-dialog .el-radio-group) {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

:deep(.haoyu-dialog .el-radio) {
  height: 40px;
  margin: 0;
  justify-content: center;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 999px;
  background: rgba(3, 8, 17, .58);
  transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
}

:deep(.haoyu-dialog .el-radio:hover) {
  border-color: rgba(255, 214, 145, .36);
  background: rgba(242, 179, 77, .08);
}

:deep(.haoyu-dialog .el-radio__input.is-checked + .el-radio__label) {
  color: #ffe8ae !important;
}

:deep(.haoyu-dialog .el-radio:has(.el-radio__input.is-checked)) {
  border-color: rgba(255, 214, 145, .48);
  background: linear-gradient(135deg, rgba(255, 232, 174, .18), rgba(124, 101, 216, .10));
  box-shadow: 0 0 24px rgba(242, 179, 77, .11);
}

:deep(.haoyu-dialog .upload-reference-btn),
:deep(.haoyu-dialog .dialog-btn-ghost),
:deep(.haoyu-dialog .dialog-btn-primary) {
  height: 42px;
  border-radius: 999px;
  letter-spacing: 0;
}

:deep(.haoyu-dialog .upload-reference-btn) {
  padding: 0 18px;
  border-color: rgba(255, 214, 145, .34) !important;
  color: #ffe8ae !important;
  background:
    linear-gradient(180deg, rgba(255, 232, 174, .11), rgba(255, 255, 255, .025)),
    rgba(3, 8, 17, .74) !important;
}

:deep(.haoyu-dialog .dialog-btn-ghost) {
  min-width: 104px;
  color: rgba(255, 232, 196, .86) !important;
  background: rgba(3, 8, 17, .70) !important;
  border-color: rgba(255, 214, 145, .24) !important;
}

:deep(.haoyu-dialog .dialog-btn-primary) {
  min-width: 128px;
  border: 0 !important;
  color: #261604 !important;
  background: linear-gradient(135deg, #fff0bd, #f2b34d 62%, #c98c35) !important;
  box-shadow: 0 16px 34px rgba(242, 179, 77, .30), inset 0 1px 0 rgba(255, 255, 255, .42) !important;
}

:deep(.haoyu-dialog .dialog-btn-primary:hover) {
  background: linear-gradient(135deg, #fff5cf, #f6bf5d 58%, #9b72e7) !important;
}

:global(.haoyu-select-popper.el-popper),
:global(.haoyu-select-popper .el-select-dropdown),
:global(.haoyu-select-popper .el-scrollbar),
:global(.haoyu-select-popper .el-select-dropdown__wrap),
:global(.haoyu-select-popper .el-select-dropdown__list) {
  background: rgba(7, 13, 25, .98) !important;
}

:global(.haoyu-select-popper .el-select-dropdown__item) {
  color: rgba(255, 232, 196, .82) !important;
}

@media (max-width: 1180px) {
  .pc-home-layout,
  .pc-home-layout.is-home {
    display: block;
    max-width: none;
  }

  .account-preview {
    display: none;
  }

  .haoyu-page {
    padding: 0;
  }

  .desktop-frame {
    min-height: 100vh;
    border: 0;
    border-radius: 0;
  }

  .site-footer {
    margin: 16px 14px calc(88px + env(safe-area-inset-bottom));
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    border-radius: 16px;
  }

  .site-footer__links {
    flex-wrap: wrap;
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

