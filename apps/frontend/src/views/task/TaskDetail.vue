<template>
  <div class="task-detail-container" v-loading="loading">
    <el-card v-if="task" class="detail-card" :key="task.id + task.status">
      
      <template #header>
        <div class="card-header">
          <h2>{{ task.title }}</h2>
          <div class="status-meta">
            <el-tag :type="getStatusTag(task.status)">
              {{ getStatusText(task.status) }}
            </el-tag>
            <el-tag type="danger" effect="plain" size="large" style="margin-left: 15px;">
              💰 赏金 {{ (task.price / 100).toFixed(2) }} 元
            </el-tag>
          </div>
        </div>
      </template>

      <el-row :gutter="30">
        <el-col :span="task.image ? 14 : 24">
          <h3>需求描述</h3>
          <p class="description-text">{{ task.description }}</p>

          <el-divider />

          <el-descriptions :column="1" border class="publisher-info">
            <el-descriptions-item label="发布者">
              <div class="publisher-avatar">
                <el-avatar 
                  :size="24"
                  :src="getAvatarUrl(task.publisher)"
                  :style="{ backgroundColor: getNameColor(task.publisher?.email), color: '#fff', fontSize: '12px' }"
                >
                  {{ getFirstLetter(task.publisher?.email) }}
                </el-avatar>
                <span style="margin-left: 8px;">{{ task.publisher.nickname }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="发布时间">
              {{ new Date(task.createdAt).toLocaleString() }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="task.status === 'SUBMITTED' || task.status === 'COMPLETED' || task.status === 'ASSIGNED'">
            <el-divider />
            <h3>成果提交：</h3>
            <el-alert 
              v-if="myOrder?.submissionContent"
              :title="myOrder.submissionContent" 
              :type="task.status === 'COMPLETED' ? 'success' : 'info'"
              show-icon 
              :closable="false"
            />
            <p v-else-if="task.status === 'SUBMITTED'">等待发布者验收，成果内容未显示。</p>
            <p v-else>执行者尚未提交成果内容。</p>
          </div>

        </el-col>

        <el-col :span="10" v-if="task.image">
          <h3 style="margin-bottom: 10px;">任务配图</h3>
          <div class="image-preview" @click="showImageDialog = true">
            <img :src="getFullUrl(task.image)" alt="任务配图" class="task-image-lg" />
            <div class="zoom-mask">
              <el-icon><ZoomIn /></el-icon>点击放大
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <div class="action-footer">
        <!-- 待领取：非发布者才能抢单 -->
        <el-button 
          v-if="isPending"
          type="primary" 
          size="large" 
          @click="handleAssign"
        >
          🚀 立即抢单 (托管中)
        </el-button>

        <!-- 我作为执行者，已抢单 -->
        <div v-else-if="isAssigned">
          <el-alert title="您已抢单成功，请尽快完成任务！" type="success" :closable="false" style="margin-bottom: 15px;" />
          <el-button 
            type="success"
            size="large" 
            @click="openSubmitDialog"
          >
            🏁 提交任务成果
          </el-button>
        </div>
        
        <!-- 任务已提交成果：根据是否为发布者展示不同按钮 -->
        <div v-else-if="task.status === 'SUBMITTED'">
          <div v-if="isPublisher">
            <el-alert title="执行者已提交成果，请您确认验收。" type="warning" :closable="false" style="margin-bottom: 15px;" />
            <el-button type="success" size="large" @click="handleComplete(true)">
              ✅ 验收通过并结算
            </el-button>
            <el-button type="danger" size="large" @click="handleComplete(false)" style="margin-left: 15px;">
              ❌ 拒绝验收 (要求返工)
            </el-button>
          </div>

          <el-button 
            v-else 
            type="warning" 
            size="large" 
            disabled
          >
            等待发布者验收中...
          </el-button>
        </div>

        <el-button 
          v-else-if="task.status === 'COMPLETED'"
          type="info" 
          size="large" 
          disabled
        >
          交易已完成
        </el-button>
        
        <el-button 
          v-else-if="task.status === 'CANCELLED'"
          type="danger" 
          size="large" 
          disabled
        >
          任务已取消/失败
        </el-button>
      </div>

    </el-card>

    <!-- 提交成果弹窗 -->
    <el-dialog v-model="submitDialogVisible" title="提交任务成果" width="600px">
      <el-form :model="submitForm" label-position="top">
        <el-form-item label="成果说明">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            rows="4"
            placeholder="请详细描述您的成果，或提供在线链接..."
          />
        </el-form-item>
        <el-alert title="请确保成果真实有效，否则可能被拒绝验收。" type="warning" :closable="false" />
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="success" @click="handleSubmit" :loading="submitting">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 配图放大 -->
    <el-dialog v-model="showImageDialog" :title="task?.title" width="80%">
      <img :src="getFullUrl(task?.image)" style="width: 100%; display: block;" alt="任务配图" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProfile } from '@/api/user'
import { createOrder, submitTaskResult, findTaskOrderForDetail, completeOrder } from '@/api/order'
import { type Task, findTaskDetail } from '@/api/task'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ZoomIn } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const taskId = computed(() => parseInt(route.params.id as string))

const loading = ref(true)
const task = ref<Task | null>(null)
const myOrder = ref<any>(null)
const submitDialogVisible = ref(false)
const submitting = ref(false)

const submitForm = reactive({
  content: ''
})

// === 核心状态判断 ===

// 使用 Task.publisherId + localStorage.currentUser.id 来判断是否为发布者
const isPublisher = computed(() => {
  if (!task.value) return false

  const raw = localStorage.getItem('currentUser')
  if (!raw) return false

  let currentUserId: number | null = null
  try {
    const parsed = JSON.parse(raw)
    currentUserId = Number(parsed.id) || null
  } catch {
    return false
  }

  const publisherId = Number((task.value as any).publisherId) || null

  if (!currentUserId || !publisherId) return false
  return currentUserId === publisherId
})

// 待领取（且不是发布者本人）
const isPending = computed(() => task.value?.status === 'PENDING' && !isPublisher.value)

// 当前用户作为执行者，已抢单但未提交成果
const isAssigned = computed(() => {
  return myOrder.value && myOrder.value.status === 'ASSIGNED'
})

// === 数据获取 ===

const fetchTaskDetail = async () => {
  loading.value = true
  try {
    const detail = await findTaskDetail(taskId.value)

    if (detail) {
      task.value = detail
      await fetchMyOrderStatus()
    } else {
      ElMessage.error('任务不存在或已完成')
      router.push('/task')
    }
  } catch (e) {
    console.error('获取任务详情失败:', e)
    if (router.currentRoute.value.path !== '/task') {
      router.push('/task')
    }
  } finally {
    loading.value = false
  }
}

const fetchMyOrderStatus = async () => {
  try {
    // 发布者 / 执行者 通用的订单详情接口
    const order = await findTaskOrderForDetail(taskId.value)
    myOrder.value = order
  } catch (e) {
    myOrder.value = null
  }
}

// === 操作处理 ===

// 抢单
const handleAssign = async () => {
  ElMessageBox.confirm('确定要抢单吗？', '抢单确认')
    .then(async () => {
      await createOrder(taskId.value)
      ElMessage.success('抢单成功！请尽快完成任务')
      await fetchTaskDetail()
    })
    .catch(() => {})
}

// 打开提交弹窗
const openSubmitDialog = () => {
  submitForm.content = ''
  submitDialogVisible.value = true
}

// 提交成果
const handleSubmit = async () => {
  if (!submitForm.content) return ElMessage.warning('请填写成果说明')
  if (!myOrder.value || !myOrder.value.id) return ElMessage.error('订单状态异常，无法提交')

  submitting.value = true
  try {
    await submitTaskResult(myOrder.value.id, { content: submitForm.content })
    await fetchTaskDetail()
    ElMessage.success('成果已提交，等待发布者验收')
    submitDialogVisible.value = false
  } catch (e) {
    console.error('提交成果时发生错误:', e)
  } finally {
    submitting.value = false
  }
}

// 发布者验收 / 拒绝验收
const handleComplete = async (isAccepted: boolean) => {
  if (!myOrder.value || !myOrder.value.id) {
    return ElMessage.error('无法结算：未找到关联的订单 ID 或订单状态异常。')
  }

  const action = isAccepted ? '验收通过' : '拒绝验收'
  const type = isAccepted ? 'success' : 'warning'

  ElMessageBox.confirm(`确定要${action}吗？`, `${action}确认`, { type })
    .then(async () => {
      await completeOrder(myOrder.value.id, { isAccepted, comment: `${action}操作` })

      if (isAccepted) {
        ElMessage.success('验收成功，赏金已结算给执行者。')
      } else {
        ElMessage.warning('已拒绝验收，任务将进入返工状态。')
      }

      await fetchTaskDetail()

      // 通知首页 Header 刷新余额
      window.dispatchEvent(new Event('balance-change'))
      // 兼容：单纯调用一次 profile 接口（即使没用返回值也无碍）
      getProfile().catch(() => {})
    })
    .catch(() => {})
}

// === 辅助函数 ===
const showImageDialog = ref(false)
const getFullUrl = (path: string | null | undefined) =>
  !path ? '' : path.startsWith('http') ? path : `http://localhost:3000${path}`
const getAvatarUrl = (user: any) => (user?.avatar ? getFullUrl(user.avatar) : '')
const getFirstLetter = (email: string) => (email ? email.charAt(0).toUpperCase() : '?')
const getNameColor = (str: string) => {
  if (!str) return '#409EFF'
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9C27B0', '#3F51B5', '#009688']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const getStatusTag = (status: string | undefined) => {
  if (!status) return 'info'
  const map: any = {
    PENDING: 'success',
    ONGOING: 'warning',
    ASSIGNED: 'warning',
    SUBMITTED: 'primary',
    COMPLETED: 'info',
    CANCELLED: 'danger',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string | undefined) => {
  if (!status) return '加载中'
  const map: any = {
    PENDING: '待领取',
    ONGOING: '进行中',
    ASSIGNED: '进行中',
    SUBMITTED: '待验收',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return map[status] || status
}

onMounted(() => {
  if (taskId.value) {
    fetchTaskDetail()
  } else {
    router.push('/task')
  }
})
</script>

<style scoped>
.task-detail-container { max-width: 1200px; margin: 20px auto; }
.detail-card { margin-top: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { margin: 0; font-size: 24px; }
.status-meta { display: flex; align-items: center; }
.description-text { white-space: pre-wrap; line-height: 1.8; color: #303133; }
.publisher-avatar { display: flex; align-items: center; }

.image-preview { 
  position: relative; 
  cursor: pointer; 
  height: 300px; 
  border-radius: 6px; 
  overflow: hidden;
}
.task-image-lg { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  display: block;
  transition: transform 0.3s;
}
.image-preview:hover .task-image-lg {
  transform: scale(1.05);
}
.zoom-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 14px;
}
.image-preview:hover .zoom-mask {
  opacity: 1;
}
.action-footer {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
