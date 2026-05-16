<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <div class="logo">浩煜平台</div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
      >
        <el-menu-item index="/task">
          <el-icon><List /></el-icon>
          <span>任务大厅</span>
        </el-menu-item>
        <el-menu-item v-if="isLogin" index="/my-task">
          <el-icon><Checked /></el-icon>
          <span>我的任务</span>
        </el-menu-item>
        <el-menu-item v-if="isLogin" index="/my-orders">
          <el-icon><Document /></el-icon>
          <span>我接的订单</span>
        </el-menu-item>
        <el-menu-item v-if="isLogin" index="/notifications">
          <el-icon><Bell /></el-icon>
          <span>通知中心</span>
          <el-badge
            v-if="unreadCount"
            :value="unreadCount"
            class="menu-badge"
          />
        </el-menu-item>
        <el-menu-item v-if="isLogin" index="/wallet">
          <el-icon><Wallet /></el-icon>
          <span>钱包中心</span>
        </el-menu-item>
        <el-menu-item v-if="isLogin && canSeeUserManage" index="/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="system-title">宇宙级悬赏系统</span>
        </div>
        <div class="header-right">
          <div class="balance-tag" v-if="currentUser">
            <span class="label">余额：</span>
            <span class="balance-amount">
              ¥ {{ ((currentUser.balance || 0) / 100).toFixed(2) }}
            </span>
          </div>

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-dropdown">
              <el-avatar
                v-if="currentUser?.avatar"
                :size="32"
                :src="getFullUrl(currentUser.avatar)"
                class="avatar-img"
              />
              <el-avatar
                v-else
                :size="32"
                :style="{
                  backgroundColor: getNameColor(currentUser?.email),
                  color: '#fff',
                  fontSize: '14px',
                }"
              >
                {{ getFirstLetter(currentUser?.email) }}
              </el-avatar>

              <span class="nickname">
                {{ currentUser?.nickname || '游客' }}
              </span>
              <el-icon class="el-icon--right">
                <CaretBottom />
              </el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <template v-if="isLogin">
                  <el-dropdown-item command="profile">
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    退出登录
                  </el-dropdown-item>
                </template>
                <template v-else>
                  <el-dropdown-item command="login">
                    去登录
                  </el-dropdown-item>
                  <el-dropdown-item command="register">
                    去注册
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <div
          v-if="$route.path === '/' || $route.path === '/task'"
          class="task-container"
        >
          <el-card class="box-card" shadow="never">
            <template #header>
              <div class="card-header">
                <h2 class="page-title">📝 任务广场</h2>
                <el-button type="primary" size="large" @click="openCreateDialog" round>
                  + 发布悬赏
                </el-button>
              </div>
            </template>

            <div v-loading="loading">
              <el-empty
                v-if="!loading && tasks.length === 0"
                description="暂无任务，快来发布第一个吧！"
              />

              <div v-else>
                <div class="task-filter-bar" v-if="tasks.length > 0">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索任务标题或描述..."
                    clearable
                    class="task-search-input"
                    prefix-icon="Search"
                  />

                  <div class="task-filter-right">
                    <span class="filter-label">赏金：</span>
                    <el-radio-group v-model="priceFilter" size="small">
                      <el-radio-button label="all">全部</el-radio-button>
                      <el-radio-button label="low">0 - 99</el-radio-button>
                      <el-radio-button label="mid">100 - 499</el-radio-button>
                      <el-radio-button label="high">500+</el-radio-button>
                      <el-radio-button label="custom">自定义</el-radio-button>
                    </el-radio-group>

                    <div v-if="priceFilter === 'custom'" class="custom-price-box">
                      <el-input-number
                        v-model="customMinPrice"
                        :min="0"
                        :step="10"
                        :controls="false"
                        placeholder="最低"
                        class="price-input"
                        size="small"
                      />
                      <span class="price-sep">-</span>
                      <el-input-number
                        v-model="customMaxPrice"
                        :min="0"
                        :step="10"
                        :controls="false"
                        placeholder="最高"
                        class="price-input"
                        size="small"
                      />
                    </div>

                    <div class="sort-box">
                      <el-select
                        v-model="sortBy"
                        size="small"
                        class="sort-select"
                        placeholder="排序"
                      >
                        <el-option label="最新发布" value="latest" />
                        <el-option label="最早发布" value="oldest" />
                        <el-option label="赏金从高到低" value="price_high" />
                        <el-option label="赏金从低到高" value="price_low" />
                        <el-option label="综合热度" value="popular" />
                      </el-select>
                    </div>

                    <el-button
                      :icon="Refresh"
                      size="small"
                      circle
                      @click="refreshList"
                      title="刷新"
                    ></el-button>
                    <el-button size="small" text @click="resetFilters">重置</el-button>
                  </div>
                </div>

                <el-empty
                  v-if="
                    !loading &&
                    tasks.length > 0 &&
                    filteredTasks.length === 0
                  "
                  description="暂无符合条件的任务"
                />

                <div v-else-if="filteredTasks.length > 0" class="task-grid">
                  <el-card
                    v-for="task in filteredTasks"
                    :key="task.id"
                    class="task-item"
                    shadow="hover"
                    :body-style="{ padding: '0px', height: '100%', display: 'flex', flexDirection: 'column' }"
                    @click="goToDetail(task.id)"
                  >
                    <div class="task-cover">
                      <div class="status-badge">
                        <el-tag v-if="task.status === 'PENDING'" type="success" effect="dark" size="small">待领取</el-tag>
                        <el-tag v-else-if="['ASSIGNED','ONGOING'].includes(task.status)" type="warning" effect="dark" size="small">进行中</el-tag>
                        <el-tag v-else-if="task.status === 'SUBMITTED'" type="primary" effect="dark" size="small">待验收</el-tag>
                        <el-tag v-else-if="task.status === 'COMPLETED'" type="info" effect="dark" size="small">已完成</el-tag>
                        <el-tag v-else type="danger" effect="dark" size="small">已取消</el-tag>
                      </div>
                      
                      <img
                        v-if="task.image"
                        :src="getFullUrl(task.image)"
                        class="task-img"
                        alt="任务配图"
                      />
                      <div v-else class="task-img-placeholder">
                        <span>{{ task.title[0] }}</span>
                      </div>
                    </div>

                    <div class="task-info-body">
                      <div class="task-header-row">
                        <h3 class="task-title" :title="task.title">{{ task.title }}</h3>
                      </div>
                      <p class="task-desc">{{ task.description || '暂无详细描述...' }}</p>
                      
                      <div class="publisher-row">
                        <div class="user-tag">
                          <el-avatar :size="20" :src="getFullUrl(task.publisher?.avatar)" class="publisher-avatar">
                             {{ getFirstLetter(task.publisher?.email) }}
                          </el-avatar>
                          <span class="publisher-name">{{ task.publisher?.nickname || '神秘人' }}</span>
                        </div>
                        <span class="post-date">{{ new Date(task.createdAt).toLocaleDateString() }}</span>
                      </div>
                    </div>

                    <div class="task-item-footer">
                      <div class="price-box">
                        <span class="symbol">¥</span>
                        <span class="amount">{{ ((task.price || 0) / 100).toFixed(2) }}</span>
                      </div>
                      
                      <div class="action-btn">
                        <el-button
                          v-if="task.status === 'PENDING'"
                          type="primary"
                          round
                          size="small"
                          @click.stop="handleAssign(task.id)"
                        >
                          🚀 抢单
                        </el-button>
                        <el-button
                          v-else-if="['ASSIGNED','ONGOING','SUBMITTED'].includes(task.status)"
                          type="warning"
                          plain
                          round
                          size="small"
                          @click.stop="goToDetail(task.id)"
                        >
                          🏃 进行中
                        </el-button>
                        <el-button v-else disabled round size="small" plain>🏁 结束</el-button>
                      </div>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <router-view v-else />
      </el-main>
    </el-container>

    <el-dialog v-model="showCreateDialog" title="发布新悬赏" width="500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="任务标题">
          <el-input
            v-model="form.title"
            placeholder="例如：帮我设计一个 Logo"
          />
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            rows="4"
            placeholder="详细描述您的需求..."
          />
        </el-form-item>

        <el-form-item label="配图 (可选)">
          <el-upload
            class="image-uploader"
            :show-file-list="false"
            :http-request="handleImageUpload"
            :before-upload="beforeImageUpload"
          >
            <img
              v-if="form.image"
              :src="getFullUrl(form.image)"
              class="uploaded-image"
            />
            <el-icon v-else class="uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
          <el-button
            v-if="form.image"
            type="danger"
            size="small"
            plain
            style="margin-left: 10px;"
            @click="form.image = ''"
          >
            移除图片
          </el-button>
        </el-form-item>

        <el-form-item label="赏金预算 (元)">
          <el-input-number
            v-model="form.price"
            :min="1"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">
          确认发布
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTaskList, createTask, uploadTaskImage, type Task } from '@/api/task'
import { createOrder } from '@/api/order'
import { getProfile, type UserProfile } from '@/api/user'
import { notificationApi } from '@/api/notification'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, CaretBottom, List, Checked, Wallet, User, Document, Bell } from '@element-plus/icons-vue'

// ========== 工具函数 ==========
const getFullUrl = (path: string) =>
  !path ? '' : path.startsWith('http') ? path : `http://localhost:3000${path}`

const getFirstLetter = (email?: string) =>
  email ? email.charAt(0).toUpperCase() : '?'

const getNameColor = (str?: string) => {
  if (!str) return '#409EFF'
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9C27B0', '#3F51B5', '#009688']
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// ========== 路由 & 用户状态 ==========
const route = useRoute()
const router = useRouter()
const currentUser = ref<UserProfile | null>(null)
const unreadCount = ref(0)

const isLogin = computed(() => !!currentUser.value)

const activeMenu = computed(() => {
  if (route.path.startsWith('/task/')) return '/task'
  return route.path === '/' ? '/task' : route.path
})

const canSeeUserManage = computed(
  () =>
    currentUser.value?.role === 'ADMIN' ||
    currentUser.value?.role === 'SUPER_ADMIN',
)

// 获取用户信息
const fetchProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    currentUser.value = null
    localStorage.removeItem('currentUser')
    return
  }

  try {
    const cached = localStorage.getItem('currentUser')
    if (cached) {
      currentUser.value = JSON.parse(cached) as UserProfile
    }
  } catch {
    localStorage.removeItem('currentUser')
  }

  try {
    const res = await getProfile()
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch {
    // 忽略错误
  }
}

// 获取未读通知数
const fetchUnreadCount = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const res: any = await notificationApi.unreadCount()
    unreadCount.value = res?.count ?? res ?? 0
  } catch { /* 静默失败 */ }
}

const handleCommand = (cmd: string) => {
  if (cmd === 'login') return router.push('/login')
  if (cmd === 'register') return router.push('/register')

  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return router.push('/login')
  }

  if (cmd === 'logout') {
    localStorage.clear()
    currentUser.value = null
    router.push('/login')
    ElMessage.success('已退出')
    return
  }

  if (cmd === 'profile') {
    router.push('/profile')
  }
}

// ========== 任务广场逻辑 ==========
const loading = ref(false)
const tasks = ref<Task[]>([])
const showCreateDialog = ref(false)
const submitting = ref(false)

const form = reactive({
  title: '',
  description: '',
  price: 100 as number, // 元
  image: '' as string | null,
})

const searchKeyword = ref('')
type PriceFilter = 'all' | 'low' | 'mid' | 'high' | 'custom'
const priceFilter = ref<PriceFilter>('all')
const customMinPrice = ref<number | null>(null)
const customMaxPrice = ref<number | null>(null)
type SortOption = 'latest' | 'oldest' | 'price_high' | 'price_low' | 'popular'
const sortBy = ref<SortOption>('latest')

const filteredTasks = computed(() => {
  let list = tasks.value.slice()

  // 1. 关键词搜索
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter((t) => {
      const title = t.title?.toLowerCase() || ''
      const desc = t.description?.toLowerCase() || ''
      return title.includes(kw) || desc.includes(kw)
    })
  }

  // 2. 价格筛选
  const LOW_MAX = 99 * 100
  const MID_MIN = 100 * 100
  const MID_MAX = 499 * 100
  const HIGH_MIN = 500 * 100

  if (priceFilter.value === 'low') {
    list = list.filter((t) => t.price <= LOW_MAX)
  } else if (priceFilter.value === 'mid') {
    list = list.filter((t) => t.price >= MID_MIN && t.price <= MID_MAX)
  } else if (priceFilter.value === 'high') {
    list = list.filter((t) => t.price >= HIGH_MIN)
  } else if (priceFilter.value === 'custom') {
    const min = customMinPrice.value
    const max = customMaxPrice.value
    if (min != null && !Number.isNaN(min)) {
      list = list.filter((t) => t.price >= Math.round(min * 100))
    }
    if (max != null && !Number.isNaN(max)) {
      list = list.filter((t) => t.price <= Math.round(max * 100))
    }
  }

  // 3. 排序
  list.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()

    switch (sortBy.value) {
      case 'latest': return bTime - aTime
      case 'oldest': return aTime - bTime
      case 'price_high':
        if (b.price !== a.price) return b.price - a.price
        return bTime - aTime
      case 'price_low':
        if (a.price !== b.price) return a.price - b.price
        return bTime - aTime
      case 'popular':
        if (b.price !== a.price) return b.price - a.price
        return bTime - aTime
      default: return bTime - aTime
    }
  })

  return list
})

const openCreateDialog = () => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return router.push('/login')
  }
  form.title = ''
  form.description = ''
  form.price = 100
  form.image = null
  showCreateDialog.value = true
}

const goToDetail = (taskId: number) => {
  router.push(`/task/${taskId}`)
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getTaskList()
    tasks.value = Array.isArray(res) ? res : res?.data || []
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

const refreshList = async () => {
  await Promise.all([fetchData(), fetchProfile()])
}

const resetFilters = async () => {
  searchKeyword.value = ''
  priceFilter.value = 'all'
  customMinPrice.value = null
  customMaxPrice.value = null
  sortBy.value = 'latest'
  await refreshList()
}

const handleCreate = async () => {
  if (!form.title.trim()) return ElMessage.warning('请输入标题')
  try {
    submitting.value = true
    await createTask({
      title: form.title.trim(),
      description: form.description,
      price: form.price,
      image: form.image || undefined,
    })
    ElMessage.success('发布成功')
    showCreateDialog.value = false
    await fetchData()
    await fetchProfile()
  } catch (error) {
    ElMessage.error('发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const handleAssign = (id: number) => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return router.push('/login')
  }
  ElMessageBox.confirm('确定抢单吗？', '确认', { type: 'warning' })
    .then(async () => {
      try {
        await createOrder(id)
        ElMessage.success('抢单成功')
        await fetchData()
      } catch (error: any) {
        ElMessage.error(error?.message || '抢单失败')
      }
    })
    .catch(() => {})
}

const handleImageUpload = async (options: any) => {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res: any = await uploadTaskImage(formData)
    form.image = res.url
    ElMessage.success('图片上传成功！')
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

const beforeImageUpload = (rawFile: any) => {
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(rawFile.type)) {
    ElMessage.error('图片必须是 JPG / PNG / GIF 格式!')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

onMounted(() => {
  const cached = localStorage.getItem('currentUser')
  if (cached) currentUser.value = JSON.parse(cached)

  fetchProfile()
  fetchUnreadCount()

  if (route.path === '/' || route.path === '/task') {
    fetchData()
  }

  window.addEventListener('balance-change', fetchProfile)
})

onUnmounted(() => {
  window.removeEventListener('balance-change', fetchProfile)
})

watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/task' || newPath === '/') {
      fetchData()
    }
  },
)
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

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
  background-color: #002140;
}

.menu {
  border-right: none;
  flex: 1;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  background: #fff;
  z-index: 10;
  padding: 0 20px;
}

.header-left .system-title {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.balance-tag {
  background-color: #f0f9eb;
  padding: 4px 12px;
  border-radius: 16px;
  color: #67c23a;
  font-size: 14px;
}

.balance-amount {
  font-weight: bold;
  margin-left: 4px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.avatar-img {
  margin-right: 8px;
  border: 1px solid #e0e0e0;
  object-fit: cover;
}

.nickname {
  font-size: 14px;
  margin-left: 8px;
  margin-right: 4px;
  color: #333;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 筛选条美化 */
.task-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
}

.task-search-input {
  width: 240px;
}

.task-filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
}

.filter-label {
  font-size: 13px;
  color: #606266;
}

.custom-price-box {
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-input {
  width: 80px;
}

.price-sep {
  color: #999;
}

.sort-select {
  width: 140px;
}

/* 🔥 任务网格布局优化 🔥 */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.task-item {
  height: 380px; /* 固定高度，保证整齐 */
  cursor: pointer;
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
  background: #fff;
}

.task-item:hover {
  transform: translateY(-5px); /* 悬浮上移 */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

/* 图片区域 */
.task-cover {
  height: 160px;
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f5f7fa;
  border-bottom: 1px solid #f0f0f0;
}

.task-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.task-item:hover .task-img {
  transform: scale(1.08); /* 图片微放大 */
}

/* 无图占位 */
.task-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
  color: #fff;
  font-size: 40px;
  font-weight: bold;
  opacity: 0.8;
}

.status-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* 内容区域 */
.task-info-body {
  padding: 16px;
  flex: 1; /* 撑满剩余空间 */
  display: flex;
  flex-direction: column;
}

.task-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  margin: 0 0 12px 0;
  height: 38px; /* 限制高度，显示2行 */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.publisher-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto; /* 推到底部 */
  font-size: 12px;
  color: #999;
}

.user-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.publisher-avatar {
  margin: 0;
}

/* 底部操作区 */
.task-item-footer {
  padding: 12px 16px;
  border-top: 1px solid #f5f7fa;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-box {
  color: #f56c6c;
  font-weight: 800;
  font-size: 18px;
}

.price-box .symbol {
  font-size: 12px;
  margin-right: 2px;
}

.action-btn .w-100 {
  min-width: 80px;
}

/* 上传组件 */
.image-uploader {
  width: 150px; height: 150px; border: 1px dashed var(--el-border-color); border-radius: 6px; cursor: pointer; overflow: hidden; transition: var(--el-transition-duration-fast);
}
.image-uploader:hover { border-color: var(--el-color-primary); }
.uploader-icon { font-size: 28px; color: #8c939d; width: 150px; height: 150px; text-align: center; line-height: 150px; }
.uploaded-image { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>