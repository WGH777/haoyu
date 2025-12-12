<template>
  <div class="task-detail-page" v-loading="pageLoading">
    <!-- 返回与标题 -->
    <el-page-header
      class="page-header"
      @back="goBack"
      content="任务详情"
    />

    <!-- 任务主体 -->
    <el-card v-if="task" class="task-card">
      <template #header>
        <div class="task-card-header">
          <div class="left">
            <el-tag :type="getStatusTag(task.status)">
              {{ getStatusText(task.status) }}
            </el-tag>
            <span class="task-id">ID：{{ task.id }}</span>
          </div>
          <div class="right">
            <el-tag type="danger" effect="dark">
              💰 赏金：¥ {{ (task.price / 100).toFixed(2) }}
            </el-tag>
          </div>
        </div>
      </template>

      <div class="task-body">
        <!-- 左侧：任务信息 + 子任务 -->
        <div class="task-main">
          <h2 class="task-title">{{ task.title }}</h2>

          <!-- 发布者信息 -->
          <div class="publisher-info">
            <span class="label">发布者：</span>
            <span class="value">
              {{ task.publisher?.nickname || task.publisher?.email || '未知用户' }}
            </span>
            <span class="time">
              发布时间：{{ formatTime(task.createdAt) }}
            </span>
          </div>

          <!-- 任务图片 -->
          <div v-if="task.image" class="task-image">
            <el-image
              :src="getFullUrl(task.image)"
              fit="cover"
              :preview-src-list="[getFullUrl(task.image)]"
              preview-teleported
            />
          </div>

          <!-- 任务描述 -->
          <el-card class="desc-card" shadow="never">
            <template #header>
              <div class="desc-header">
                <span>任务说明</span>
              </div>
            </template>
            <p class="task-desc">
              {{ task.description || '暂无任务描述' }}
            </p>
          </el-card>

          <!-- 子任务区域 -->
          <el-card class="subtask-card" shadow="never">
            <template #header>
              <div class="subtask-header">
                <span>子任务拆分</span>
                <el-tag
                  v-if="hasSubTasks"
                  size="small"
                  type="success"
                  effect="plain"
                >
                  已拆分 {{ task.subTasks?.length || 0 }} 项
                </el-tag>
                <el-tag
                  v-else
                  size="small"
                  type="info"
                  effect="plain"
                >
                  当前未拆分子任务
                </el-tag>
              </div>
            </template>

            <!-- 没有子任务 -->
            <el-empty
              v-if="!hasSubTasks"
              description="暂无子任务"
            />

            <!-- 已有子任务 -->
            <ul v-else class="subtask-list">
              <li
                v-for="sub in task.subTasks"
                :key="sub.id"
                class="subtask-item"
              >
                <div class="subtask-main">
                  <el-checkbox
                    v-if="canManageSubTasks"
                    :model-value="sub.isDone"
                    :disabled="updatingSubTask"
                    @change="handleToggleSubTask(sub, $event)"
                  >
                    <span :class="{ 'subtask-done': sub.isDone }">
                      {{ sub.title }}
                    </span>
                  </el-checkbox>

                  <span
                    v-else
                    :class="{ 'subtask-done': sub.isDone }"
                  >
                    {{ sub.title }}
                  </span>
                </div>

                <div
                  v-if="canManageSubTasks"
                  class="subtask-actions"
                >
                  <el-button
                    type="text"
                    size="small"
                    @click="handleDeleteSubTask(sub)"
                  >
                    删除
                  </el-button>
                </div>
              </li>
            </ul>

            <!-- 发布者可新增子任务 -->
            <div
              v-if="canManageSubTasks"
              class="subtask-input"
            >
              <el-input
                v-model="newSubTaskTitle"
                placeholder="输入子任务标题，回车或点击添加"
                @keyup.enter="handleCreateSubTask"
              />
              <el-button
                type="primary"
                class="ml-8"
                :loading="creatingSubTask"
                @click="handleCreateSubTask"
              >
                添加
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 右侧：订单状态 & 操作区 -->
        <div class="task-side">
          <el-card shadow="never" class="order-card">
            <template #header>
              <div class="order-header">
                <span>任务进度与操作</span>
              </div>
            </template>

            <!-- 未登录 -->
            <div v-if="!isLogin" class="section">
              <el-alert
                title="您还未登录，登录后可接单 / 提交 / 验收任务"
                type="info"
                :closable="false"
                show-icon
              />
              <el-button
                class="mt-12"
                type="primary"
                @click="goLogin"
              >
                去登录
              </el-button>
            </div>

            <!-- 游客视角 -->
            <div
              v-else-if="viewMode === 'guest'"
              class="section"
            >
              <el-alert
                v-if="task.status === 'PENDING'"
                title="当前任务还未被接取，您可以抢单成为执行者"
                type="success"
                :closable="false"
                show-icon
              />
              <el-alert
                v-else
                title="您不是该任务的发布者或执行者，仅可查看任务信息"
                type="info"
                :closable="false"
                show-icon
                class="mt-12"
              />
              <el-button
                v-if="canRobOrder"
                class="mt-16"
                type="primary"
                :loading="opLoading"
                @click="handleAssign"
              >
                立即接单
              </el-button>
            </div>

            <!-- 执行者视角 -->
            <div
              v-else-if="viewMode === 'worker'"
              class="section"
            >
              <el-descriptions
                title="我的任务进度"
                :column="1"
                size="small"
                border
              >
                <el-descriptions-item label="当前状态">
                  <el-tag :type="getStatusTag(myOrder?.status || '')">
                    {{ getStatusText(myOrder?.status || '') }}
                  </el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="子任务完成情况">
                  <span v-if="subTaskProgressText">
                    {{ subTaskProgressText }}
                  </span>
                  <span v-else>暂无子任务拆分</span>
                </el-descriptions-item>
              </el-descriptions>

              <div class="section mt-16">
                <!-- 状态：进行中（ASSIGNED） -->
                <template v-if="isOrderAssigned">
                  <el-alert
                    v-if="hasSubmissionHistory"
                    title="您之前提交的成果已被驳回，请根据发布者意见修改后重新提交。"
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
                  <el-button
                    class="mt-16"
                    type="primary"
                    @click="openSubmitDialog"
                  >
                    {{ hasSubmissionHistory ? '重新提交任务成果' : '提交任务成果' }}
                  </el-button>

                  <!-- 如果有历史提交，作为参考展示出来 -->
                  <div
                    v-if="hasSubmissionHistory"
                    class="submission-view mt-12"
                  >
                    <div class="submission-content">
                      <div class="label">上次提交内容：</div>
                      <div class="value">
                        {{ currentSubmissionContent || '无' }}
                      </div>
                    </div>
                    <div
                      v-if="currentSubmissionImage"
                      class="submission-image"
                    >
                      <div class="label">上次提交截图：</div>
                      <el-image
                        :src="getFullUrl(currentSubmissionImage)"
                        fit="cover"
                        :preview-src-list="[getFullUrl(currentSubmissionImage)]"
                        preview-teleported
                      />
                    </div>
                  </div>
                </template>

                <!-- 状态：已提交待验收（SUBMITTED） -->
                <template v-else-if="isOrderSubmitted">
                  <el-alert
                    title="您已提交成果，等待发布者验收。"
                    type="success"
                    :closable="false"
                    show-icon
                  />
                  <div class="submission-view mt-12">
                    <div class="submission-content">
                      <div class="label">提交内容：</div>
                      <div class="value">
                        {{ currentSubmissionContent || '无' }}
                      </div>
                    </div>
                    <div
                      v-if="currentSubmissionImage"
                      class="submission-image"
                    >
                      <div class="label">提交截图：</div>
                      <el-image
                        :src="getFullUrl(currentSubmissionImage)"
                        fit="cover"
                        :preview-src-list="[getFullUrl(currentSubmissionImage)]"
                        preview-teleported
                      />
                    </div>
                  </div>
                </template>

                <!-- 状态：已完成（COMPLETED） -->
                <template v-else-if="isOrderCompleted">
                  <el-alert
                    title="任务已完成，赏金已结算到您的账户。"
                    type="success"
                    :closable="false"
                    show-icon
                  />
                  <div class="submission-view mt-12">
                    <div class="submission-content">
                      <div class="label">最终提交内容：</div>
                      <div class="value">
                        {{ currentSubmissionContent || '无' }}
                      </div>
                    </div>
                    <div
                      v-if="currentSubmissionImage"
                      class="submission-image"
                    >
                      <div class="label">最终提交截图：</div>
                      <el-image
                        :src="getFullUrl(currentSubmissionImage)"
                        fit="cover"
                        :preview-src-list="[getFullUrl(currentSubmissionImage)]"
                        preview-teleported
                      />
                    </div>
                  </div>
                </template>

                <!-- 其他状态（理论上不会出现） -->
                <template v-else>
                  <el-alert
                    class="mt-8"
                    title="当前状态暂不可提交成果。"
                    type="warning"
                    :closable="false"
                    show-icon
                  />
                </template>
              </div>
            </div>

            <!-- 发布者视角 -->
            <div
              v-else-if="viewMode === 'publisher'"
              class="section"
            >
              <el-descriptions
                title="任务与订单状态"
                :column="1"
                size="small"
                border
              >
                <el-descriptions-item label="任务状态">
                  <el-tag :type="getStatusTag(task.status)">
                    {{ getStatusText(task.status) }}
                  </el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="执行者">
                  <span v-if="publisherOrder">
                    {{ publisherOrder.workerId }}（用户 ID）
                  </span>
                  <span v-else>暂无执行者或订单已失效</span>
                </el-descriptions-item>
              </el-descriptions>

              <div class="section mt-16">
                <!-- 还没有人接单 -->
                <template v-if="task.status === 'PENDING'">
                  <el-alert
                    title="当前任务尚未被任何人接取。"
                    type="info"
                    :closable="false"
                    show-icon
                  />
                </template>

                <!-- 已接单但未提交 -->
                <template v-else-if="task.status === 'ASSIGNED'">
                  <el-alert
                    title="执行者正在进行任务，还未提交成果。"
                    type="info"
                    :closable="false"
                    show-icon
                  />
                </template>

                <!-- 已提交待验收 -->
                <template v-else-if="task.status === 'SUBMITTED' && publisherOrder">
                  <el-alert
                    title="执行者已提交成果，请验收后结算或驳回返工。"
                    type="warning"
                    :closable="false"
                    show-icon
                  />

                  <div class="submission-view mt-12">
                    <div class="submission-content">
                      <div class="label">提交内容：</div>
                      <div class="value">
                        {{ publisherOrder.submissionContent || '无' }}
                      </div>
                    </div>
                    <div
                      v-if="publisherOrder.submissionImage"
                      class="submission-image"
                    >
                      <div class="label">提交截图：</div>
                      <el-image
                        :src="getFullUrl(publisherOrder.submissionImage)"
                        fit="cover"
                        :preview-src-list="[getFullUrl(publisherOrder.submissionImage)]"
                        preview-teleported
                      />
                    </div>
                  </div>

                  <div class="mt-16 buttons-row">
                    <el-button
                      type="success"
                      :loading="opLoading"
                      @click="handleAccept"
                    >
                      验收并结算
                    </el-button>
                    <el-button
                      type="danger"
                      :loading="opLoading"
                      @click="handleReject"
                    >
                      驳回返工
                    </el-button>
                  </div>
                </template>

                <!-- 已完成 -->
                <template v-else-if="task.status === 'COMPLETED'">
                  <el-alert
                    title="任务已完成，赏金已结算给执行者。"
                    type="success"
                    :closable="false"
                    show-icon
                  />
                </template>

                <!-- 其他状态 -->
                <template v-else>
                  <el-alert
                    title="暂无可操作项。"
                    type="info"
                    :closable="false"
                    show-icon
                  />
                </template>
              </div>
            </div>

            <!-- 兜底：不应该出现，但防御一下 -->
            <div v-else class="section">
              <el-alert
                title="当前身份无法识别，仅可查看任务信息。"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 任务不存在 -->
    <el-empty
      v-else
      description="任务不存在或已被删除"
    />

    <!-- 执行者提交成果弹窗 -->
    <el-dialog
      v-model="submitDialogVisible"
      title="提交任务成果"
      width="600px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item label="说明">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            placeholder="请详细描述您的完成情况"
            :rows="5"
          />
        </el-form-item>
        <el-form-item label="截图">
          <el-input
            v-model="submitForm.image"
            placeholder="可填写成果截图 URL（后续可接入上传）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="submitDialogVisible = false">取 消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleSubmitResult"
          >
            确认提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

type ViewMode = 'guest' | 'worker' | 'publisher'

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

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待领取',
    ASSIGNED: '进行中',
    ONGOING: '进行中',
    SUBMITTED: '待验收',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return map[status] || status || '-'
}

const getStatusTag = (status: string) => {
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

// 提交成果弹窗
const submitDialogVisible = ref(false)
const submitLoading = ref(false)
const submitForm = ref({
  content: '',
  image: '',
})

// ========== 计算属性 ==========
const isLogin = computed(() => !!currentUser.value)

const isPublisher = computed(() => {
  if (!task.value || !currentUser.value) return false
  const publisherEmail = (task.value.publisher as any)?.email
  return !!publisherEmail && publisherEmail === (currentUser.value as any).email
})

const isWorker = computed(() => !!myOrder.value && isLogin.value)

const viewMode = computed<ViewMode>(() => {
  if (!isLogin.value) return 'guest'
  if (isPublisher.value) return 'publisher'
  if (isWorker.value) return 'worker'
  return 'guest'
})

const hasSubTasks = computed(
  () => !!task.value && Array.isArray(task.value.subTasks) && task.value.subTasks.length > 0,
)

const subTaskProgressText = computed(() => {
  if (!task.value || !task.value.subTasks || task.value.subTasks.length === 0) return ''
  const total = task.value.subTasks.length
  const done = task.value.subTasks.filter((s) => s.isDone).length
  return `${done} / ${total} 已完成`
})

const canManageSubTasks = computed(() => isPublisher.value)

const canRobOrder = computed(
  () =>
    !!task.value &&
    task.value.status === 'PENDING' &&
    !isPublisher.value &&
    !isWorker.value,
)

// 当前视角下的订单
const currentOrder = computed<OrderItem | null>(() => {
  if (viewMode.value === 'worker') return myOrder.value
  if (viewMode.value === 'publisher') return publisherOrder.value
  return null
})

// 是否有提交历史（无论当前状态）
const hasSubmissionHistory = computed(
  () =>
    !!currentOrder.value &&
    (!!currentOrder.value.submissionContent ||
      !!currentOrder.value.submissionImage),
)

const isOrderAssigned = computed(
  () => currentOrder.value?.status === 'ASSIGNED',
)
const isOrderSubmitted = computed(
  () => currentOrder.value?.status === 'SUBMITTED',
)
const isOrderCompleted = computed(
  () => currentOrder.value?.status === 'COMPLETED',
)

const currentSubmissionContent = computed(
  () => currentOrder.value?.submissionContent || '',
)

const currentSubmissionImage = computed(
  () => currentOrder.value?.submissionImage || '',
)

// ========== 加载数据 ==========
const loadCurrentUser = async () => {
  try {
    const cached = localStorage.getItem('currentUser')
    if (cached) {
      currentUser.value = JSON.parse(cached) as UserProfile
      return
    }
    const res = await getProfile()
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch {
    currentUser.value = null
  }
}

const getTaskIdFromRoute = () => {
  const idParam = route.params.id
  const id = Number(idParam)
  if (!id || Number.isNaN(id)) {
    return null
  }
  return id
}

const loadTask = async () => {
  const taskId = getTaskIdFromRoute()
  if (!taskId) {
    throw new Error('任务 ID 无效')
  }
  const res = await findTaskDetail(taskId)
  task.value = res as Task
}

const loadOrders = async () => {
  const taskId = getTaskIdFromRoute()
  if (!taskId || !currentUser.value) {
    myOrder.value = null
    publisherOrder.value = null
    return
  }

  // 当前用户作为执行者的订单
  try {
    const resWorker = await getMyOrderForTask(taskId)
    myOrder.value = (resWorker || null) as OrderItem | null
  } catch {
    myOrder.value = null
  }

  // 发布者视角订单
  try {
    const resPublisher = await findTaskOrderForDetail(taskId)
    publisherOrder.value = (resPublisher || null) as OrderItem | null
  } catch {
    publisherOrder.value = null
  }
}

const loadPage = async () => {
  pageLoading.value = true
  try {
    await loadCurrentUser()
    await loadTask()
    await loadOrders()
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
  try {
    await ElMessageBox.confirm(
      '确定要删除该子任务吗？此操作不可恢复。',
      '提示',
      {
        type: 'warning',
      },
    )
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
    ElMessage.success('抢单成功，已成为该任务执行者')
    await loadTask()
    await loadOrders()
  } catch (error) {
    console.error('抢单失败:', error)
    ElMessage.error('抢单失败')
  } finally {
    opLoading.value = false
  }
}

// 打开提交成果弹窗
const openSubmitDialog = () => {
  if (!currentOrder.value) return
  submitForm.value.content = currentOrder.value.submissionContent || ''
  submitForm.value.image = currentOrder.value.submissionImage || ''
  submitDialogVisible.value = true
}

const handleSubmitResult = async () => {
  if (!currentOrder.value) return
  const content = submitForm.value.content.trim()
  if (!content) {
    ElMessage.warning('请填写提交内容')
    return
  }
  submitLoading.value = true
  try {
    await submitTaskResult(currentOrder.value.id, {
      content,
      image: submitForm.value.image || undefined,
    })
    ElMessage.success('提交成功，等待发布者验收')
    submitDialogVisible.value = false
    await loadTask()
    await loadOrders()
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
    await ElMessageBox.confirm(
      '确认验收通过并结算赏金给执行者？',
      '提示',
      { type: 'warning' },
    )
  } catch {
    return
  }

  opLoading.value = true
  try {
    await completeOrder(publisherOrder.value.id, {
      isAccepted: true,
      comment: '',
    })
    ElMessage.success('验收成功，赏金已结算')
    await loadTask()
    await loadOrders()
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
    const { value } = await ElMessageBox.prompt(
      '请输入驳回原因（会展示给执行者）',
      '驳回返工',
      {
        inputType: 'textarea',
        inputPlaceholder: '例如：提交内容与需求不符，请补充说明或补充截图等',
        inputValidator: (val: string) =>
          val.trim().length > 0 || '驳回原因不能为空',
      },
    )
    opLoading.value = true
    await completeOrder(publisherOrder.value.id, {
      isAccepted: false,
      comment: value.trim(),
    })
    ElMessage.success('已驳回，任务回到进行中状态')
    await loadTask()
    await loadOrders()
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('驳回失败:', error)
    ElMessage.error('驳回失败')
  } finally {
    opLoading.value = false
  }
}

// ========== 路由相关 ==========
const goBack = () => {
  router.back()
}

const goLogin = () => {
  router.push('/login')
}

onMounted(() => {
  loadPage()
})
</script>

<style scoped>
.task-detail-page {
  max-width: 1200px;
  margin: 20px auto;
}

.page-header {
  margin-bottom: 16px;
}

.task-card {
  border-radius: 8px;
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

.subtask-card {
  margin-top: 8px;
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 8px;
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

.subtask-main {
  flex: 1;
}

.subtask-done {
  text-decoration: line-through;
  color: #909399;
}

.subtask-input {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.order-card .section + .section {
  margin-top: 16px;
}

.buttons-row {
  display: flex;
  gap: 12px;
}

.submission-view {
  font-size: 13px;
}

.submission-content,
.submission-image {
  margin-bottom: 8px;
}

.submission-content .label,
.submission-image .label {
  font-weight: 500;
  margin-bottom: 4px;
}

.submission-image .el-image {
  width: 100%;
  max-height: 220px;
  border-radius: 6px;
  overflow: hidden;
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
