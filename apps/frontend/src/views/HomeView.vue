<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
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
        <el-menu-item index="/my-task">
          <el-icon><Checked /></el-icon>
          <span>我的任务</span>
        </el-menu-item>
        <el-menu-item index="/wallet">
          <el-icon><Wallet /></el-icon>
          <span>钱包中心</span>
        </el-menu-item>
        <el-menu-item v-if="canSeeUserManage" index="/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container>
      <!-- 头部 -->
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
                {{ currentUser?.nickname || '未登录' }}
              </span>
              <el-icon class="el-icon--right">
                <CaretBottom />
              </el-icon>
            </div>
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

      <!-- 主内容 -->
      <el-main class="main">
        <!-- 任务广场（首页 & /task） -->
        <div
          v-if="$route.path === '/' || $route.path === '/task'"
          class="task-container"
        >
          <el-card class="box-card">
            <template #header>
              <div class="card-header">
                <h2>📝 任务广场</h2>
                <el-button type="primary" size="large" @click="openCreateDialog">
                  + 发布悬赏
                </el-button>
              </div>
            </template>

            <div v-loading="loading">
              <!-- 完全没有任务的情况 -->
              <el-empty
                v-if="!loading && tasks.length === 0"
                description="暂无任务，快来发布第一个吧！"
              />

              <div v-else>
                <!-- 筛选区：搜索 + 价格区间 + 排序 -->
                <div class="task-filter-bar" v-if="tasks.length > 0">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索任务标题或描述..."
                    clearable
                    class="task-search-input"
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

                    <!-- 自定义价格区间（单位：元） -->
                    <div v-if="priceFilter === 'custom'" class="custom-price-box">
                      <el-input-number
                        v-model="customMinPrice"
                        :min="0"
                        :step="10"
                        :controls="false"
                        placeholder="最低价"
                        class="price-input"
                      />
                      <span class="price-sep">-</span>
                      <el-input-number
                        v-model="customMaxPrice"
                        :min="0"
                        :step="10"
                        :controls="false"
                        placeholder="最高价"
                        class="price-input"
                      />
                      <span class="price-unit">元</span>
                    </div>

                    <!-- 排序选择 -->
                    <div class="sort-box">
                      <span class="filter-label">排序：</span>
                      <el-select
                        v-model="sortBy"
                        size="small"
                        class="sort-select"
                      >
                        <el-option
                          label="发布时间 · 最新优先"
                          value="latest"
                        />
                        <el-option
                          label="发布时间 · 最早优先"
                          value="oldest"
                        />
                        <el-option
                          label="赏金 · 从高到低"
                          value="price_high"
                        />
                        <el-option
                          label="赏金 · 从低到高"
                          value="price_low"
                        />
                        <el-option
                          label="热度 · 综合排序"
                          value="popular"
                        />
                      </el-select>
                    </div>

                    <!-- 刷新 / 重置 -->
                    <el-button
                      :icon="Refresh"
                      size="small"
                      @click="refreshList"
                    >
                      刷新
                    </el-button>
                    <el-button size="small" @click="resetFilters">重置</el-button>
                  </div>
                </div>

                <!-- 有任务但筛选后为空 -->
                <el-empty
                  v-if="
                    !loading &&
                    tasks.length > 0 &&
                    filteredTasks.length === 0
                  "
                  description="暂无符合条件的任务，请调整筛选条件"
                />

                <!-- 展示筛选后的任务列表 -->
                <div v-else-if="filteredTasks.length > 0" class="task-grid">
                  <el-card
                    v-for="task in filteredTasks"
                    :key="task.id"
                    class="task-item"
                    shadow="hover"
                    @click="goToDetail(task.id)"
                  >
                    <div class="task-content">
                      <div class="task-image-wrapper" v-if="task.image">
                        <img
                          :src="getFullUrl(task.image)"
                          class="task-image"
                          alt="任务配图"
                        />
                      </div>

                      <div class="task-info">
                        <div class="task-header">
                          <span class="task-title">{{ task.title }}</span>
                          <el-tag
                            v-if="task.status === 'PENDING'"
                            type="success"
                          >
                            待领取
                          </el-tag>
                          <el-tag
                            v-else-if="
                              task.status === 'ASSIGNED' ||
                              task.status === 'ONGOING'
                            "
                            type="warning"
                          >
                            进行中
                          </el-tag>
                          <el-tag
                            v-else-if="task.status === 'SUBMITTED'"
                            type="primary"
                          >
                            待验收
                          </el-tag>
                          <el-tag
                            v-else-if="task.status === 'COMPLETED'"
                            type="info"
                          >
                            已完成
                          </el-tag>
                          <el-tag v-else type="danger">已取消</el-tag>
                        </div>

                        <p class="task-desc">
                          {{ task.description }}
                        </p>

                        <div class="task-meta">
                          <el-tag type="danger" effect="plain" size="small">
                            💰 赏金
                            {{ ((task.price || 0) / 100).toFixed(2) }} 元
                          </el-tag>
                        </div>
                      </div>
                    </div>

                    <div class="task-footer">
                      <span class="author">
                        👤 {{ task.publisher?.nickname || '神秘人' }}
                      </span>
                      <span class="time">
                        {{ new Date(task.createdAt).toLocaleDateString() }}
                      </span>
                    </div>

                    <div style="margin-top: 15px;">
                      <el-button
                        v-if="task.status === 'PENDING'"
                        type="primary"
                        class="w-100"
                        @click.stop="handleAssign(task.id)"
                      >
                        🚀 立即抢单
                      </el-button>
                      <el-button
                        v-else-if="
                          task.status === 'ASSIGNED' ||
                          task.status === 'ONGOING' ||
                          task.status === 'SUBMITTED'
                        "
                        disabled
                        class="w-100"
                        @click.stop=""
                      >
                        🏃 正在进行中
                      </el-button>
                      <el-button
                        v-else
                        disabled
                        class="w-100"
                        @click.stop=""
                      >
                        🏁 已结束
                      </el-button>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 其他路由页面 -->
        <router-view v-else />
      </el-main>
    </el-container>

    <!-- 发布任务弹窗 -->
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
import { getProfile } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  CaretBottom,
  List,
  Checked,
  Wallet,
  User,
} from '@element-plus/icons-vue'

// ========== 工具函数 ==========
const getFullUrl = (path: string) =>
  !path ? '' : path.startsWith('http') ? path : `http://localhost:3000${path}`

const getFirstLetter = (email?: string) =>
  email ? email.charAt(0).toUpperCase() : '?'

const getNameColor = (str?: string) => {
  if (!str) return '#409EFF'
  const colors = [
    '#409EFF',
    '#67C23A',
    '#E6A23C',
    '#F56C6C',
    '#909399',
    '#9C27B0',
    '#3F51B5',
    '#009688',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// ========== 路由 & 用户状态 ==========
const route = useRoute()
const router = useRouter()
const currentUser = ref<any>(null)

// 菜单激活状态
const activeMenu = computed(() => {
  // 详情页 /task/:id 也高亮任务大厅
  if (route.path.startsWith('/task/')) return '/task'
  return route.path === '/' ? '/task' : route.path
})

const canSeeUserManage = computed(
  () =>
    currentUser.value?.role === 'ADMIN' ||
    currentUser.value?.role === 'SUPER_ADMIN',
)

// 获取用户信息（用于 Header）
const fetchProfile = async () => {
  try {
    const res = await getProfile()
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch (e) {
    // 未登录等情况忽略
  }
}

// 顶部下拉菜单操作
const handleCommand = (cmd: string) => {
  if (cmd === 'logout') {
    localStorage.clear()
    router.push('/login')
    ElMessage.success('已退出')
  } else if (cmd === 'profile') {
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

// 搜索 & 价格筛选
const searchKeyword = ref('')

type PriceFilter = 'all' | 'low' | 'mid' | 'high' | 'custom'
const priceFilter = ref<PriceFilter>('all')

// 自定义价格区间（元）
const customMinPrice = ref<number | null>(null)
const customMaxPrice = ref<number | null>(null)

// 排序方式
type SortOption = 'latest' | 'oldest' | 'price_high' | 'price_low' | 'popular'
const sortBy = ref<SortOption>('latest')

// 过滤 + 排序后的任务列表
const filteredTasks = computed(() => {
  let list = tasks.value.slice()

  // 业务上，任务广场只展示“待领取”的任务
  list = list.filter((t) => t.status === 'PENDING')

  // 关键字搜索（标题 + 描述）
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter((t) => {
      const title = t.title?.toLowerCase() || ''
      const desc = t.description?.toLowerCase() || ''
      return title.includes(kw) || desc.includes(kw)
    })
  }

  // 价格筛选（单位：分）
  const LOW_MAX = 99 * 100 // 0 - 99
  const MID_MIN = 100 * 100 // 100 起
  const MID_MAX = 499 * 100 // 到 499
  const HIGH_MIN = 500 * 100 // 500+

  if (priceFilter.value === 'low') {
    // 0 - 99
    list = list.filter((t) => t.price <= LOW_MAX)
  } else if (priceFilter.value === 'mid') {
    // 100 - 499
    list = list.filter((t) => t.price >= MID_MIN && t.price <= MID_MAX)
  } else if (priceFilter.value === 'high') {
    // 500+
    list = list.filter((t) => t.price >= HIGH_MIN)
  } else if (priceFilter.value === 'custom') {
    // 自定义区间（元 → 分）
    const min = customMinPrice.value
    const max = customMaxPrice.value

    if (min != null && !Number.isNaN(min)) {
      const minCents = Math.round(min * 100)
      list = list.filter((t) => t.price >= minCents)
    }

    if (max != null && !Number.isNaN(max)) {
      const maxCents = Math.round(max * 100)
      list = list.filter((t) => t.price <= maxCents)
    }
  }

  // 排序
  list.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()

    switch (sortBy.value) {
      case 'latest':
        // 发布时间 · 最新优先
        return bTime - aTime
      case 'oldest':
        // 发布时间 · 最早优先
        return aTime - bTime
      case 'price_high':
        // 赏金 · 从高到低（同价时按时间新到旧）
        if (b.price !== a.price) return b.price - a.price
        return bTime - aTime
      case 'price_low':
        // 赏金 · 从低到高（同价时按时间新到旧）
        if (a.price !== b.price) return a.price - b.price
        return bTime - aTime
      case 'popular':
        // 热度 · 综合排序：先赏金高，再最新
        if (b.price !== a.price) return b.price - a.price
        return bTime - aTime
      default:
        return bTime - aTime
    }
  })

  return list
})

// 打开发布弹窗
const openCreateDialog = () => {
  form.title = ''
  form.description = ''
  form.price = 100
  form.image = null
  showCreateDialog.value = true
}

// 跳转到任务详情页
const goToDetail = (taskId: number) => {
  router.push(`/task/${taskId}`)
}

// 获取任务列表
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getTaskList()
    // http.get 一般直接返回 data，这里兼容两种情况
    tasks.value = Array.isArray(res) ? res : res?.data || []
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新列表：重新拉取任务 + 同步顶部余额
const refreshList = async () => {
  await Promise.all([fetchData(), fetchProfile()])
}

// 重置筛选条件（仅影响前端展示）
const resetFilters = async () => {
  searchKeyword.value = ''
  priceFilter.value = 'all'
  customMinPrice.value = null
  customMaxPrice.value = null
  sortBy.value = 'latest'
  await refreshList()
}

// 发布任务
const handleCreate = async () => {
  if (!form.title.trim()) {
    return ElMessage.warning('请输入标题')
  }
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
    console.error('发布任务失败:', error)
    ElMessage.error('发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 抢单操作（通过订单模块）
const handleAssign = (id: number) => {
  ElMessageBox.confirm('确定抢单吗？', '确认', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await createOrder(id)
        ElMessage.success('抢单成功')
        await fetchData()
      } catch (error: any) {
        console.error('抢单失败:', error)
        ElMessage.error(error?.message || '抢单失败，请稍后重试')
      }
    })
    .catch(() => {
      // 用户取消，不提示
    })
}

// 图片上传
const handleImageUpload = async (options: any) => {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res: any = await uploadTaskImage(formData)
    form.image = res.url
    ElMessage.success('图片上传成功！')
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

// 图片上传前校验
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

// ========== 生命周期 & 事件监听 ==========
onMounted(() => {
  const cached = localStorage.getItem('currentUser')
  if (cached) currentUser.value = JSON.parse(cached)

  fetchProfile()

  // 首次进入首页 / 任务大厅时加载任务
  if (route.path === '/' || route.path === '/task') {
    fetchData()
  }

  // 监听钱包页面的余额变动事件
  window.addEventListener('balance-change', fetchProfile)
})

onUnmounted(() => {
  window.removeEventListener('balance-change', fetchProfile)
})

// 监听路由变化：切回任务大厅时自动刷新列表
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 筛选条 */
.task-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.task-search-input {
  max-width: 280px;
  width: 100%;
}

.task-filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  margin-right: 4px;
  font-size: 13px;
  color: #606266;
}

.custom-price-box {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.price-input {
  width: 110px;
}

.price-sep {
  color: #606266;
  font-size: 13px;
}

.price-unit {
  font-size: 13px;
  color: #606266;
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.sort-select {
  width: 190px;
}

/* 任务栅格 */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.task-content {
  display: flex;
  flex-direction: column;
}

.task-info {
  padding: 10px 0;
}

.task-image-wrapper {
  width: 100%;
  height: 150px;
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 10px;
}

.task-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.task-item:hover .task-image {
  transform: scale(1.05);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-weight: bold;
}

.task-title {
  font-size: 16px;
  margin-right: 10px;
}

.task-desc {
  color: #666;
  margin: 10px 0;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 14px;
}

.task-meta {
  margin-bottom: 10px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.w-100 {
  width: 100%;
}

/* 上传组件样式 */
.image-uploader {
  width: 150px;
  height: 150px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.image-uploader:hover {
  border-color: var(--el-color-primary);
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  text-align: center;
  line-height: 150px;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.task-item {
  cursor: pointer;
}
</style>
