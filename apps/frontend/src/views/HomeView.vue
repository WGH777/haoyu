<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <div class="logo">浩煜平台</div>
      <el-menu :default-active="activeMenu" class="menu" router background-color="#001529" text-color="#fff" active-text-color="#409eff">
        <el-menu-item index="/task"><el-icon><List /></el-icon><span>任务大厅</span></el-menu-item>
        <el-menu-item index="/my-task"><el-icon><Checked /></el-icon><span>我的任务</span></el-menu-item>
        <el-menu-item index="/wallet"><el-icon><Wallet /></el-icon><span>钱包中心</span></el-menu-item>
        <el-menu-item v-if="canSeeUserManage" index="/user"><el-icon><User /></el-icon><span>用户管理</span></el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left"><span class="system-title">宇宙级悬赏系统</span></div>
        <div class="header-right">
          <div class="balance-tag" v-if="currentUser">
            <span class="label">余额：</span>
            <span class="balance-amount">¥ {{ ((currentUser.balance || 0) / 100).toFixed(2) }}</span>
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
                :style="{ backgroundColor: getNameColor(currentUser?.email), color: '#fff', fontSize: '14px' }"
              >
                {{ getFirstLetter(currentUser?.email) }}
              </el-avatar>
              
              <span class="nickname">{{ currentUser?.nickname || '未登录' }}</span>
              <el-icon class="el-icon--right"><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <div v-if="$route.path === '/' || $route.path === '/task'" class="task-container">
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
              <el-empty v-if="tasks.length === 0" description="暂无任务，快来发布第一个吧！" />
              
              <div v-else class="task-grid">
                <el-card v-for="task in tasks" :key="task.id" class="task-item" shadow="hover">
                  <div class="task-content">
                    <div class="task-image-wrapper" v-if="task.image">
                      <img :src="getFullUrl(task.image)" class="task-image" alt="任务配图" />
                    </div>

                    <div class="task-info">
                      <div class="task-header">
                        <span class="task-title">{{ task.title }}</span>
                        <el-tag v-if="task.status === 'PENDING'" type="success">待领取</el-tag>
                        <el-tag v-else-if="task.status === 'ONGOING'" type="warning">进行中</el-tag>
                        <el-tag v-else type="info">已完成</el-tag>
                      </div>
                      
                      <p class="task-desc">{{ task.description }}</p>
                      
                      <div class="task-meta">
                        <el-tag type="danger" effect="plain" size="small">
                          💰 赏金 {{ ((task.price || 0) / 100).toFixed(2) }} 元
                        </el-tag>
                      </div>
                    </div>
                  </div>

                  <div class="task-footer">
                    <span class="author">👤 {{ task.publisher?.nickname || '神秘人' }}</span>
                    <span class="time">{{ new Date(task.createdAt).toLocaleDateString() }}</span>
                  </div>

                  <div style="margin-top: 15px;">
                    <el-button 
                      v-if="task.status === 'PENDING'"
                      type="primary" 
                      class="w-100" 
                      @click="handleAssign(task.id)"
                    >
                      🚀 立即抢单
                    </el-button>
                    <el-button v-else disabled class="w-100">
                      {{ task.status === 'ONGOING' ? '🏃 正在进行中' : '🏁 已结束' }}
                    </el-button>
                  </div>
                </el-card>
              </div>
            </div>
          </el-card>
        </div>
        
        <router-view v-else />
      </el-main>
    </el-container>

    <el-dialog v-model="showCreateDialog" title="发布新悬赏" width="500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="任务标题"><el-input v-model="form.title" placeholder="例如：帮我设计一个Logo" /></el-form-item>
        <el-form-item label="任务描述"><el-input v-model="form.description" type="textarea" rows="4" placeholder="详细描述您的需求..." /></el-form-item>
        
        <el-form-item label="配图 (可选)">
          <el-upload
            class="image-uploader"
            :show-file-list="false"
            :http-request="handleImageUpload"
            :before-upload="beforeImageUpload"
          >
            <img v-if="form.image" :src="getFullUrl(form.image)" class="uploaded-image" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
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

        <el-form-item label="赏金预算 (元)"><el-input-number v-model="form.price" :min="1" :step="10" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">确认发布</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTaskList, createTask, uploadTaskImage, type Task } from '@/api/task'
import { createOrder } from '@/api/order'
import { getProfile } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue' 
import { 
  UserFilled, CaretBottom, List, Checked, Wallet, User 
} from '@element-plus/icons-vue'

// ========== 工具函数 ==========
const getFullUrl = (path: string) => (!path ? '' : path.startsWith('http') ? path : `http://localhost:3000${path}`)
const getFirstLetter = (email: string) => (email ? email.charAt(0).toUpperCase() : '?')
const getNameColor = (str: string) => {
  if (!str) return '#409EFF'
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9C27B0', '#3F51B5', '#009688']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ========== 状态 & 路由 ==========
const route = useRoute(); const router = useRouter();
const currentUser = ref<any>(null)
const activeMenu = computed(() => route.path === '/' ? '/task' : route.path)
const canSeeUserManage = computed(() => currentUser.value?.role === 'ADMIN' || currentUser.value?.role === 'SUPER_ADMIN')

const fetchProfile = async () => {
  try { const res = await getProfile(); currentUser.value = res; localStorage.setItem('currentUser', JSON.stringify(res)) } catch (e) {}
}
const handleCommand = (cmd: string) => {
  if (cmd === 'logout') {
    localStorage.clear(); router.push('/login'); ElMessage.success('已退出')
  } else if (cmd === 'profile') router.push('/profile')
}

// ========== 任务广场逻辑 ==========
const loading = ref(false)
const tasks = ref<Task[]>([]) 
const showCreateDialog = ref(false)
const submitting = ref(false)

const form = reactive({
  title: '',
  description: '',
  price: 100, // 元
  image: '' as string | null
})

const openCreateDialog = () => {
  form.title = ''
  form.description = ''
  form.price = 100
  form.image = null
  showCreateDialog.value = true
}

const fetchData = async () => {
  try { loading.value = true; const res: any = await getTaskList(); tasks.value = Array.isArray(res) ? res : (res.data || []) } finally { loading.value = false }
}

const handleCreate = async () => {
  if (!form.title) return ElMessage.warning('请输入标题');
  try { 
    submitting.value = true; 
    await createTask({ 
      title: form.title, 
      description: form.description, 
      price: form.price,
      image: form.image || undefined 
    }); 
    ElMessage.success('发布成功'); 
    showCreateDialog.value = false; 
    fetchData(); 
    fetchProfile() 
  } catch(e){} finally { submitting.value = false }
}

const handleAssign = (id: number) => {
  ElMessageBox.confirm('确定抢单吗？', '确认').then(async () => {
    await createOrder(id); ElMessage.success('抢单成功'); fetchData()
  }).catch(() => {})
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
    ElMessage.error('图片必须是 JPG/PNG/GIF 格式!')
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
  const cached = localStorage.getItem('currentUser'); if (cached) currentUser.value = JSON.parse(cached)
  fetchProfile(); fetchData(); window.addEventListener('balance-change', fetchProfile)
})
onUnmounted(() => window.removeEventListener('balance-change', fetchProfile))
</script>

<style scoped>
.layout-container { height: 100vh; }
.aside { background-color: #001529; color: #fff; display: flex; flex-direction: column; }
.logo { height: 60px; line-height: 60px; text-align: center; font-weight: 600; font-size: 18px; background-color: #002140; }
.menu { border-right: none; flex: 1; }
.header { display: flex; align-items: center; justify-content: space-between; height: 60px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); background: #fff; z-index: 10; padding: 0 20px; }
.header-left .system-title { font-size: 18px; font-weight: 600; }
.header-right { display: flex; align-items: center; gap: 20px; }
.balance-tag { background-color: #f0f9eb; padding: 4px 12px; border-radius: 16px; color: #67c23a; font-size: 14px; }
.balance-amount { font-weight: bold; margin-left: 4px; }
.user-dropdown { display: flex; align-items: center; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.3s; }
.user-dropdown:hover { background-color: #f5f7fa; }
.avatar-img { margin-right: 8px; border: 1px solid #e0e0e0; object-fit: cover; } 
.nickname { font-size: 14px; margin-left: 8px; margin-right: 4px; color: #333; }
.main { background-color: #f0f2f5; padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }

.task-content { display: flex; flex-direction: column; }
.task-info { padding: 10px 0; }
.task-image-wrapper { width: 100%; height: 150px; overflow: hidden; border-radius: 4px; margin-bottom: 10px; }
.task-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.task-item:hover .task-image { transform: scale(1.05); }

.task-header { display: flex; justify-content: space-between; align-items: flex-start; font-weight: bold; }
.task-title { font-size: 16px; margin-right: 10px; }
.task-desc { color: #666; margin: 10px 0; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; font-size: 14px; }
.task-meta { margin-bottom: 10px; }
.task-footer { display: flex; justify-content: space-between; color: #999; font-size: 12px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; }
.w-100 { width: 100%; }

/* 上传组件样式 */
.image-uploader { width: 150px; height: 150px; border: 1px dashed var(--el-border-color); border-radius: 6px; cursor: pointer; overflow: hidden; transition: var(--el-transition-duration-fast); }
.image-uploader:hover { border-color: var(--el-color-primary); }
.uploader-icon { font-size: 28px; color: #8c939d; width: 150px; height: 150px; text-align: center; line-height: 150px; }
.uploaded-image { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>