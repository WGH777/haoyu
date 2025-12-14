<!-- apps/frontend/src/views/task/TaskDetail.vue -->
<template>
  <div class="task-detail-page" v-loading="pageLoading">
    <el-page-header class="page-header" @back="goBack" content="任务详情" />

    <el-card v-if="task" class="task-card">
      <template #header>
        <div class="task-card-header">
          <div class="left">
            <el-tag :type="getTaskStatusTag(task.status)">{{ getTaskStatusText(task.status) }}</el-tag>
            <span class="task-id">ID：{{ task.id }}</span>
          </div>
          <div class="right">
            <el-tag type="danger" effect="dark">赏金：¥ {{ (task.price / 100).toFixed(2) }}</el-tag>
          </div>
        </div>
      </template>

      <div class="task-body">
        <!-- 左侧：任务信息 + 子任务 -->
        <div class="task-main">
          <h2 class="task-title">{{ task.title }}</h2>

          <div class="publisher-info">
            <span class="label">发布者：</span>
            <span class="value">{{ task.publisher?.nickname || task.publisher?.email || '未知用户' }}</span>
            <span class="time">发布时间：{{ formatTime(task.createdAt) }}</span>
          </div>

          <div v-if="task.image" class="task-image">
            <el-image
              :src="getFullUrl(task.image)"
              fit="cover"
              :preview-src-list="[getFullUrl(task.image)]"
              preview-teleported
            />
          </div>

          <el-card class="desc-card" shadow="never">
            <template #header>
              <div class="desc-header">任务说明</div>
            </template>
            <p class="task-desc">{{ task.description || '暂无任务描述' }}</p>
          </el-card>

          <!-- 子任务协作 -->
          <el-card class="subtask-card" shadow="never">
            <template #header>
              <div class="subtask-header">
                <span>子任务拆分</span>
                <el-tag v-if="hasSubTasks" size="small" type="success" effect="plain">
                  已拆分 {{ task.subTasks?.length || 0 }} 项（{{ subTaskProgressText }}）
                </el-tag>
                <el-tag v-else size="small" type="info" effect="plain">当前未拆分子任务</el-tag>
              </div>
            </template>

            <!-- 发布者：新增子任务（无论是否已有子任务，都显示） -->
            <div v-if="canManageSubTasks" class="subtask-input">
              <el-input
                v-model="newSubTaskTitle"
                :disabled="creatingSubTask || updatingSubTask"
                placeholder="输入子任务标题，回车或点击添加"
                @keyup.enter="handleCreateSubTask"
              />
              <el-button
                type="primary"
                class="ml-8"
                :loading="creatingSubTask"
                :disabled="updatingSubTask"
                @click="handleCreateSubTask"
              >
                添加
              </el-button>
            </div>

            <el-empty v-if="!hasSubTasks" description="暂无子任务" />

            <ul v-else class="subtask-list">
              <li v-for="sub in task.subTasks" :key="sub.id" class="subtask-item">
                <div class="subtask-left">
                  <!-- 可勾选：发布者永远允许；执行者仅 ASSIGNED / SUBMITTED -->
                  <el-checkbox
                    v-if="canToggleSubTasks"
                    :model-value="sub.isDone"
                    :disabled="updatingSubTask || isEditing(sub.id)"
                    @change="onSubTaskCheckboxChange(sub, $event)"
                  />
                  <span v-else class="checkbox-placeholder" />

                  <div class="subtask-title">
                    <!-- 发布者编辑标题 -->
                    <template v-if="canManageSubTasks && isEditing(sub.id)">
                      <el-input
                        v-model="editingTitle"
                        size="small"
                        :disabled="updatingSubTask"
                        placeholder="编辑子任务标题"
                        @keyup.enter="handleSaveEditSubTask(sub)"
                        @keyup.esc="handleCancelEditSubTask"
                      />
                    </template>

                    <template v-else>
                      <span :class="{ 'subtask-done': sub.isDone }">{{ sub.title }}</span>
                    </template>
                  </div>
                </div>

                <!-- 发布者：改标题/删除 -->
                <div v-if="canManageSubTasks" class="subtask-actions">
                  <template v-if="isEditing(sub.id)">
                    <el-button type="text" size="small" :disabled="updatingSubTask" @click="handleSaveEditSubTask(sub)">
                      保存
                    </el-button>
                    <el-button type="text" size="small" :disabled="updatingSubTask" @click="handleCancelEditSubTask">
                      取消
                    </el-button>
                  </template>
                  <template v-else>
                    <el-button type="text" size="small" :disabled="updatingSubTask" @click="handleStartEditSubTask(sub)">
                      改标题
                    </el-button>
                    <el-button type="text" size="small" :disabled="updatingSubTask" @click="handleDeleteSubTask(sub)">
                      删除
                    </el-button>
                  </template>
                </div>
              </li>
            </ul>

            <!-- 执行者提示 -->
            <el-alert
              v-if="isWorkerToggleOnlyHint"
              class="mt-12"
              type="info"
              :closable="false"
              show-icon
              title="提示：你是执行者，只能勾选子任务完成/取消（仅 isDone），不能新增/改标题/删除。"
            />
          </el-card>
        </div>

        <!-- 右侧：任务进度与操作 -->
        <div class="task-side">
          <el-card shadow="never" class="order-card">
            <template #header>
              <div class="order-header">任务进度与操作</div>
            </template>

            <!-- 未登录：游客（全站可浏览，只读） -->
            <div v-if="!isLogin" class="section">
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item label="账号角色">游客</el-descriptions-item>
                <el-descriptions-item label="任务身份">游客（只读）</el-descriptions-item>
                <el-descriptions-item label="任务状态">{{ getTaskStatusText(task.status) }}</el-descriptions-item>
              </el-descriptions>

              <el-alert
                class="mt-12"
                title="游客可浏览任务详情，但不能接单/提交/验收/修改子任务。注册并登录后将成为普通用户。"
                type="info"
                :closable="false"
                show-icon
              />

              <el-button class="mt-12" type="primary" @click="goLogin">去登录</el-button>
            </div>

            <!-- 已登录：展示账号角色 + 任务身份 -->
            <div v-else class="section">
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item label="账号角色">{{ accountRoleText }}</el-descriptions-item>
                <el-descriptions-item label="任务身份">{{ taskIdentityText }}</el-descriptions-item>
                <el-descriptions-item label="任务状态">{{ getTaskStatusText(task.status) }}</el-descriptions-item>
                <el-descriptions-item label="订单状态">
                  <span v-if="viewMode === 'worker'">{{ getOrderStatusText(myOrder?.status || '') }}</span>
                  <span v-else-if="viewMode === 'publisher'">{{ getOrderStatusText(publisherOrder?.status || '') }}</span>
                  <span v-else>-</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 旁观：只读 -->
            <div v-if="isLogin && viewMode === 'viewer'" class="section mt-16">
              <el-alert
                title="你当前不是该任务的发布者或执行者，仅可查看任务信息（不会退出登录）。"
                type="info"
                :closable="false"
                show-icon
              />
            </div>

            <!-- 待接单：允许抢单 -->
            <div v-if="isLogin && viewMode === 'guest'" class="section mt-16">
              <el-alert
                title="当前任务还未被接取，你可以抢单成为执行者。"
                type="success"
                :closable="false"
                show-icon
              />
              <el-button class="mt-16" type="primary" :loading="opLoading" @click="handleAssign">
                立即接单
              </el-button>
            </div>

            <!-- 执行者视角 -->
            <div v-if="isLogin && viewMode === 'worker'" class="section mt-16">
              <el-descriptions title="我的任务进度" :column="1" size="small" border>
                <el-descriptions-item label="当前状态">
                  <el-tag :type="getOrderStatusTag(myOrder?.status || '')">
                    {{ getOrderStatusText(myOrder?.status || '') }}
                  </el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="子任务完成情况">
                  <span v-if="subTaskProgressText">{{ subTaskProgressText }}</span>
                  <span v-else>暂无子任务拆分</span>
                </el-descriptions-item>
              </el-descriptions>

              <div class="section mt-16">
                <template v-if="isOrderAssigned">
                  <el-alert
                    v-if="hasSubmissionHistory"
                    title="你之前提交的成果已被驳回，请根据发布者意见修改后重新提交。"
                    type="warning"
                    :closable="false"
                    show-icon
                  />
                  <el-alert
                    v-else
                    title="请按需求完成任务后提交成果，提交后等待发布者验收。"
                    type="info"
                    :closable="false"
                    show-icon
                    class="mt-8"
                  />
                  <el-button class="mt-16" type="primary" @click="openSubmitDialog">
                    {{ hasSubmissionHistory ? '重新提交任务成果' : '提交任务成果' }}
                  </el-button>
                </template>

                <template v-else-if="isOrderSubmitted">
                  <el-alert title="你已提交成果，等待发布者验收。" type="success" :closable="false" show-icon />
                </template>

                <template v-else-if="isOrderCompleted">
                  <el-alert title="任务已完成，赏金已结算到你的账户。" type="success" :closable="false" show-icon />
                </template>

                <template v-else>
                  <el-alert title="当前状态暂不可提交成果。" type="warning" :closable="false" show-icon class="mt-8" />
                </template>
              </div>
            </div>

            <!-- 发布者视角 -->
            <div v-if="isLogin && viewMode === 'publisher'" class="section mt-16">
              <el-descriptions title="任务与订单状态" :column="1" size="small" border>
                <el-descriptions-item label="执行者">
                  <span v-if="publisherOrder">{{ publisherOrder.workerId }}（用户 ID）</span>
                  <span v-else>暂无执行者</span>
                </el-descriptions-item>
                <el-descriptions-item label="子任务进度">
                  <span v-if="subTaskProgressText">{{ subTaskProgressText }}</span>
                  <span v-else>暂无子任务拆分</span>
                </el-descriptions-item>
              </el-descriptions>

              <div class="section mt-16">
                <template v-if="task.status === 'PENDING'">
                  <el-alert title="当前任务尚未被任何人接取。" type="info" :closable="false" show-icon />
                </template>

                <template v-else-if="task.status === 'ASSIGNED' || task.status === 'ONGOING'">
                  <el-alert title="执行者正在进行任务，还未提交成果。" type="info" :closable="false" show-icon />
                </template>

                <template v-else-if="task.status === 'SUBMITTED' && publisherOrder">
                  <el-alert title="执行者已提交成果，请验收后结算或驳回返工。" type="warning" :closable="false" show-icon />

                  <div class="mt-16 buttons-row">
                    <el-button type="success" :loading="opLoading" @click="handleAccept">验收并结算</el-button>
                    <el-button type="danger" :loading="opLoading" @click="handleReject">驳回返工</el-button>
                  </div>
                </template>

                <template v-else-if="task.status === 'COMPLETED'">
                  <el-alert title="任务已完成，赏金已结算给执行者。" type="success" :closable="false" show-icon />
                </template>

                <template v-else>
                  <el-alert title="暂无可操作项。" type="info" :closable="false" show-icon />
                </template>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <el-empty v-else description="任务不存在或已被删除" />

    <!-- 执行者提交成果弹窗 -->
    <el-dialog v-model="submitDialogVisible" title="提交任务成果" width="600px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="说明">
          <el-input v-model="submitForm.content" type="textarea" placeholder="请详细描述你的完成情况" :rows="5" />
        </el-form-item>
        <el-form-item label="截图">
          <el-input v-model="submitForm.image" placeholder="可填写成果截图 URL（后续可接入上传）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="submitDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmitResult">确认提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  findTaskDetail,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  type Task,
  type SubTask,
} from '@/api/task'
import {
  createOrder,
  getMyOrderForTask,
  findTaskOrderForDetail,
  submitTaskResult,
  completeOrder,
  type OrderItem,
} from '@/api/order'
import { getProfile, type UserProfile } from '@/api/user'

type ViewMode = 'guest' | 'viewer' | 'worker' | 'publisher'

// ========== 工具函数 ==========
const getFullUrl = (path?: string | null): string => {
  if (!path) return ''
  return path.startsWith('http') ? path : `http://localhost:3000${path}`
}

const formatTime = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString()
}

const getTaskStatusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待领取',
    ASSIGNED: '已接单',
    ONGOING: '进行中',
    SUBMITTED: '待验收',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return map[status] || status || '-'
}

const getTaskStatusTag = (status: string) => {
  const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
    PENDING: 'info',
    ASSIGNED: 'warning',
    ONGOING: 'warning',
    SUBMITTED: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
  }
  return map[status] || 'info'
}

const getOrderStatusText = (status: string) => {
  const map: Record<string, string> = {
    ASSIGNED: '已接单',
    SUBMITTED: '已提交',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return map[status] || (status ? status : '-')
}

const getOrderStatusTag = (status: string) => {
  const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
    ASSIGNED: 'warning',
    SUBMITTED: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
  }
  return map[status] || 'info'
}

// ========== 路由 & 基本状态 ==========
const route = useRoute()
const router = useRouter()

const task = ref<Task | null>(null)
const myOrder = ref<OrderItem | null>(null)
const publisherOrder = ref<OrderItem | null>(null)
const currentUser = ref<UserProfile | null>(null)

const pageLoading = ref(false)
const opLoading = ref(false)

// 子任务相关
const newSubTaskTitle = ref('')
const creatingSubTask = ref(false)
const updatingSubTask = ref(false)

// 子任务：发布者编辑标题
const editingSubTaskId = ref<number | null>(null)
const editingTitle = ref('')

// 提交成果弹窗
const submitDialogVisible = ref(false)
const submitLoading = ref(false)
const submitForm = ref({
  content: '',
  image: '',
})

// ========== 计算属性 ==========
const isLogin = computed(() => !!currentUser.value)

const myUserId = computed(() => {
  if (!currentUser.value) return null
  const raw = (currentUser.value as any).id ?? (currentUser.value as any).userId
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const isPublisher = computed(() => {
  if (!task.value || !myUserId.value) return false
  const pid = Number((task.value as any).publisherId)
  return pid === myUserId.value
})

const isWorker = computed(() => !!myOrder.value && isLogin.value)

const accountRoleText = computed(() => {
  if (!isLogin.value) return '游客'
  const role = String((currentUser.value as any).role || 'USER').toUpperCase()
  if (role === 'SUPER_ADMIN') return '超管'
  if (role === 'ADMIN') return '管理员'
  return '普通用户'
})

const taskIdentityText = computed(() => {
  if (!isLogin.value) return '游客（只读）'
  if (isPublisher.value) return '发布者'
  if (isWorker.value) return '执行者'
  return '普通用户（旁观）'
})

const viewMode = computed<ViewMode>(() => {
  if (!isLogin.value) return 'viewer' // 未登录也按只读处理
  if (task.value?.status === 'PENDING' && !isPublisher.value) {
    // 待接单：允许普通用户抢单
    return 'guest'
  }
  if (isPublisher.value) return 'publisher'
  if (isWorker.value) return 'worker'
  return 'viewer'
})

const hasSubTasks = computed(() => {
  return !!task.value && Array.isArray(task.value.subTasks) && task.value.subTasks.length > 0
})

const subTaskProgressText = computed(() => {
  if (!task.value || !task.value.subTasks || task.value.subTasks.length === 0) return ''
  const total = task.value.subTasks.length
  const done = task.value.subTasks.filter((s) => s.isDone).length
  return `${done} / ${total} 已完成`
})

// 发布者：可新增/改标题/删除/勾选
const canManageSubTasks = computed(() => isPublisher.value)

// 执行者：仅允许在 ASSIGNED / SUBMITTED 勾选 isDone
const canWorkerToggle = computed(() => {
  if (!myOrder.value) return false
  return myOrder.value.status === 'ASSIGNED' || myOrder.value.status === 'SUBMITTED'
})

// 勾选权限：发布者 or 可勾选的执行者
const canToggleSubTasks = computed(() => canManageSubTasks.value || canWorkerToggle.value)

const isWorkerToggleOnlyHint = computed(() => !canManageSubTasks.value && canWorkerToggle.value)

const isEditing = (subTaskId: number) => editingSubTaskId.value === subTaskId

const hasSubmissionHistory = computed(() => {
  if (!myOrder.value) return false
  return !!myOrder.value.submissionContent || !!myOrder.value.submissionImage
})

const isOrderAssigned = computed(() => myOrder.value?.status === 'ASSIGNED')
const isOrderSubmitted = computed(() => myOrder.value?.status === 'SUBMITTED')
const isOrderCompleted = computed(() => myOrder.value?.status === 'COMPLETED')

// 修复 TS7006：模板事件不要用匿名参数（Volar 会报隐式 any）
const onSubTaskCheckboxChange = (subTask: SubTask, val: unknown) => {
  // Element Plus checkbox change 的 val 在常见场景是 boolean
  handleToggleSubTask(subTask, !!val)
}

// ========== 加载数据（关键：避免“旁观者”触发敏感接口） ==========
const loadCurrentUser = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    currentUser.value = null
    localStorage.removeItem('currentUser')
    return
  }

  // 仍可用缓存提速，但最终以 profile 为准
  const cached = localStorage.getItem('currentUser')
  if (cached) {
    try {
      currentUser.value = JSON.parse(cached) as UserProfile
    } catch {
      // ignore
    }
  }

  try {
    const res = await getProfile()
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }
}

const getTaskIdFromRoute = () => {
  const idParam = route.params.id
  const id = Number(idParam)
  if (!id || Number.isNaN(id)) return null
  return id
}

const loadTask = async () => {
  const taskId = getTaskIdFromRoute()
  if (!taskId) throw new Error('任务 ID 无效')
  const res = await findTaskDetail(taskId)
  task.value = res as Task
}

const loadMyOrder = async () => {
  const taskId = getTaskIdFromRoute()
  if (!taskId || !currentUser.value) {
    myOrder.value = null
    return
  }

  // 只查询“我是否接过这个任务”。没有订单返回 null（正常）
  try {
    const res = await getMyOrderForTask(taskId)
    myOrder.value = (res || null) as OrderItem | null
  } catch {
    myOrder.value = null
  }
}

const loadPublisherOrder = async () => {
  const taskId = getTaskIdFromRoute()
  if (!taskId || !currentUser.value) {
    publisherOrder.value = null
    return
  }

  // 仅发布者才拉订单详情（避免旁观者/执行者触发权限接口导致错误）
  if (!isPublisher.value) {
    publisherOrder.value = null
    return
  }

  try {
    const res = await findTaskOrderForDetail(taskId)
    publisherOrder.value = (res || null) as OrderItem | null
  } catch {
    publisherOrder.value = null
  }
}

const loadPage = async () => {
  pageLoading.value = true
  try {
    await loadCurrentUser()
    await loadTask()
    await loadMyOrder()
    await loadPublisherOrder()
  } catch (error) {
    console.error('加载任务详情失败:', error)
    ElMessage.error('加载任务详情失败')
  } finally {
    pageLoading.value = false
  }
}

// ========== 子任务操作 ==========
const handleCreateSubTask = async () => {
  if (!task.value) return
  if (!canManageSubTasks.value) return

  const title = newSubTaskTitle.value.trim()
  if (!title) {
    ElMessage.warning('请输入子任务标题')
    return
  }

  creatingSubTask.value = true
  try {
    await createSubTask(task.value.id, title)
    ElMessage.success('子任务添加成功')
    newSubTaskTitle.value = ''
    await loadTask()
  } catch (error) {
    console.error('添加子任务失败:', error)
    ElMessage.error('添加子任务失败')
  } finally {
    creatingSubTask.value = false
  }
}

const handleToggleSubTask = async (subTask: SubTask, value: boolean) => {
  if (!task.value) return
  if (!canToggleSubTasks.value) return

  updatingSubTask.value = true
  try {
    await updateSubTask(task.value.id, subTask.id, { isDone: !!value })
    await loadTask()
  } catch (error) {
    console.error('更新子任务失败:', error)
    ElMessage.error('更新子任务失败')
  } finally {
    updatingSubTask.value = false
  }
}

const handleDeleteSubTask = async (subTask: SubTask) => {
  if (!task.value) return
  if (!canManageSubTasks.value) return

  try {
    await ElMessageBox.confirm('确定要删除该子任务吗？此操作不可恢复。', '提示', { type: 'warning' })
  } catch {
    return
  }

  updatingSubTask.value = true
  try {
    await deleteSubTask(task.value.id, subTask.id)
    ElMessage.success('子任务已删除')
    await loadTask()
  } catch (error) {
    console.error('删除子任务失败:', error)
    ElMessage.error('删除子任务失败')
  } finally {
    updatingSubTask.value = false
  }
}

const handleStartEditSubTask = (subTask: SubTask) => {
  if (!canManageSubTasks.value) return
  editingSubTaskId.value = subTask.id
  editingTitle.value = subTask.title
}

const handleCancelEditSubTask = () => {
  editingSubTaskId.value = null
  editingTitle.value = ''
}

const handleSaveEditSubTask = async (subTask: SubTask) => {
  if (!task.value) return
  if (!canManageSubTasks.value) return

  const t = editingTitle.value.trim()
  if (!t) {
    ElMessage.warning('子任务标题不能为空')
    return
  }

  updatingSubTask.value = true
  try {
    await updateSubTask(task.value.id, subTask.id, { title: t })
    ElMessage.success('子任务标题已更新')
    handleCancelEditSubTask()
    await loadTask()
  } catch (error) {
    console.error('更新子任务标题失败:', error)
    ElMessage.error('更新子任务标题失败')
  } finally {
    updatingSubTask.value = false
  }
}

// ========== 订单相关操作 ==========
const handleAssign = async () => {
  if (!task.value) return
  if (!isLogin.value) {
    ElMessage.warning('请先登录再接单')
    router.push('/login')
    return
  }

  opLoading.value = true
  try {
    await createOrder(task.value.id)
    ElMessage.success('接单成功，已成为该任务执行者')
    await loadTask()
    await loadMyOrder()
  } catch (error) {
    console.error('接单失败:', error)
    ElMessage.error('接单失败')
  } finally {
    opLoading.value = false
  }
}

const openSubmitDialog = () => {
  if (!myOrder.value) return
  submitForm.value.content = myOrder.value.submissionContent || ''
  submitForm.value.image = myOrder.value.submissionImage || ''
  submitDialogVisible.value = true
}

const handleSubmitResult = async () => {
  if (!myOrder.value) return
  const content = submitForm.value.content.trim()
  if (!content) {
    ElMessage.warning('请填写提交内容')
    return
  }

  submitLoading.value = true
  try {
    await submitTaskResult(myOrder.value.id, {
      content,
      image: submitForm.value.image || undefined,
    })
    ElMessage.success('提交成功，等待发布者验收')
    submitDialogVisible.value = false
    await loadTask()
    await loadMyOrder()
  } catch (error) {
    console.error('提交成果失败:', error)
    ElMessage.error('提交成果失败')
  } finally {
    submitLoading.value = false
  }
}

// 发布者验收通过
const handleAccept = async () => {
  if (!publisherOrder.value) return

  try {
    await ElMessageBox.confirm('确认验收通过并结算赏金给执行者？', '提示', { type: 'warning' })
  } catch {
    return
  }

  opLoading.value = true
  try {
    await completeOrder(publisherOrder.value.id, { isAccepted: true, comment: '' })
    ElMessage.success('验收成功，赏金已结算')
    await loadTask()
    await loadPublisherOrder()
  } catch (error) {
    console.error('验收失败:', error)
    ElMessage.error('验收失败')
  } finally {
    opLoading.value = false
  }
}

// 发布者驳回返工
const handleReject = async () => {
  if (!publisherOrder.value) return

  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因（会展示给执行者）', '驳回返工', {
      inputType: 'textarea',
      inputPlaceholder: '例如：提交内容与需求不符，请补充说明或补充截图等',
      inputValidator: (val: string) => val.trim().length > 0 || '驳回原因不能为空',
    })

    opLoading.value = true
    await completeOrder(publisherOrder.value.id, { isAccepted: false, comment: value.trim() })
    ElMessage.success('已驳回，任务回到进行中状态')
    await loadTask()
    await loadPublisherOrder()
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('驳回失败:', error)
    ElMessage.error('驳回失败')
  } finally {
    opLoading.value = false
  }
}

// ========== 路由相关 ==========
const goBack = () => router.back()
const goLogin = () => router.push('/login')

onMounted(loadPage)

watch(
  () => route.params.id,
  () => {
    loadPage()
  },
)
</script>

<style scoped>
.task-detail-page {
  max-width: 1200px;
  margin: 20px auto;
}

.page-header {
  margin-bottom: 16px;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-card-header .left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-card-header .task-id {
  font-size: 13px;
  color: #909399;
}

.task-body {
  display: flex;
  gap: 16px;
}

.task-main {
  flex: 2;
}

.task-side {
  flex: 1;
}

.task-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
}

.publisher-info .label {
  color: #909399;
}

.publisher-info .time {
  margin-left: auto;
}

.task-image {
  margin-bottom: 16px;
}

.task-image .el-image {
  width: 100%;
  max-height: 260px;
  border-radius: 6px;
  overflow: hidden;
}

.desc-card {
  margin-bottom: 16px;
}

.desc-header {
  font-weight: 500;
}

.task-desc {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #303133;
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtask-input {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.subtask-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.subtask-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #ebeef5;
}

.subtask-item:last-child {
  border-bottom: none;
}

.subtask-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.checkbox-placeholder {
  width: 16px;
  display: inline-block;
}

.subtask-title {
  flex: 1;
  min-width: 0;
}

.subtask-done {
  text-decoration: line-through;
  color: #909399;
}

.subtask-actions {
  display: flex;
  gap: 8px;
}

.buttons-row {
  display: flex;
  gap: 12px;
}

.mt-8 {
  margin-top: 8px;
}
.mt-12 {
  margin-top: 12px;
}
.mt-16 {
  margin-top: 16px;
}
.ml-8 {
  margin-left: 8px;
}
</style>
