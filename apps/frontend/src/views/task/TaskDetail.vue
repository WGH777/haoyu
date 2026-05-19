<template>
  <div class="task-detail-page" v-loading="pageLoading">
    <!-- 返回与标题 -->
    <el-page-header class="page-header" @back="goBack" content="任务详情" />

    <!-- 任务主体 -->
    <el-card v-if="task" class="task-card" shadow="never">
      <template #header>
        <div class="task-card-header">
          <div class="left">
            <el-tag :type="getStatusTag(task.status)" effect="dark">
              {{ getStatusText(task.status) }}
            </el-tag>
            <span class="task-id">ID：{{ task.id }}</span>
          </div>

          <div class="right">
            <el-tag type="danger" effect="plain" size="large" class="price-tag">
              💰  {{ ((task.price || 0) / 100).toFixed(2) }} 煜米
            </el-tag>
          </div>
        </div>
      </template>

      <div class="task-body">
        <!-- 左侧：任务信息 + 子任务 -->
        <div class="task-main">
          <h2 class="task-title">{{ task.title }}</h2>

          <!-- 发布者信息 + 信任快照 -->
          <div class="publisher-info">
            <el-avatar
              :size="24"
              :src="getFullUrl((task.publisher as any)?.avatar)"
              class="avatar-small"
            >
              {{ getFirstLetter((task.publisher as any)?.email) }}
            </el-avatar>

            <span class="value">
              {{ task.publisher?.nickname || task.publisher?.email || '未知用户' }}
              <el-tag v-if="task.publisher?.verified" size="small" type="success" class="verified-tag">已认证</el-tag>
            </span>

            <span class="time">发布于 {{ formatTime(task.createdAt) }}</span>
          </div>

          <!-- 信任快照 -->
          <div v-if="(task as any).publisherStats" class="trust-snapshot">
            <div class="trust-stat">
              <span class="trust-stat-value">{{ (task as any).publisherStats.completionRate }}%</span>
              <span class="trust-stat-label">完成率</span>
            </div>
            <div class="trust-stat">
              <span class="trust-stat-value">{{ (task as any).publisherStats.disputeRate }}%</span>
              <span class="trust-stat-label">争议率</span>
            </div>
            <div class="trust-stat">
              <span class="trust-stat-value">{{ (task as any).publisherStats.totalOrders }}</span>
              <span class="trust-stat-label">总订单</span>
            </div>
          </div>

          <!-- 任务图片 -->
          <div v-if="task.image" class="task-image">
            <el-image
              :src="getFullUrl(task.image)"
              fit="cover"
              :preview-src-list="[getFullUrl(task.image)]"
              preview-teleported
              class="rounded-image"
            />
          </div>

          <!-- 任务描述 -->
          <el-card class="desc-card" shadow="never">
            <template #header>
              <div class="desc-header">📋 任务说明</div>
            </template>
            <p class="task-desc">
              {{ task.description || '暂无任务描述' }}
            </p>
          </el-card>

          <!-- 子任务区域 -->
          <el-card class="subtask-card" shadow="never">
            <template #header>
              <div class="subtask-header">
                <span>📝 子任务拆分</span>
                <el-tag v-if="hasSubTasks" size="small" type="success" effect="light">
                  已拆分 {{ task.subTasks?.length || 0 }} 项
                </el-tag>
                <el-tag v-else size="small" type="info" effect="plain">
                  暂无子任务
                </el-tag>
              </div>
            </template>

            <!-- 进度条（有子任务才展示） -->
            <div v-if="hasSubTasks" class="progress-bar-wrapper">
              <el-progress
                :text-inside="true"
                :stroke-width="16"
                :percentage="completionPercentage"
                :status="completionPercentage === 100 ? 'success' : ''"
              />
            </div>

            <!-- 无子任务提示：非发布者 -->
            <el-empty
              v-if="!hasSubTasks && !canEditSubTasks"
              description="发布者暂未设置子任务清单"
              :image-size="80"
            />

            <!-- 子任务列表：有子任务 or 发布者可管理 -->
            <ul v-else class="subtask-list">
              <li
                v-for="sub in task.subTasks"
                :key="sub.id"
                class="subtask-item"
                :class="{ 'item-done': sub.isDone }"
              >
                <div class="subtask-main">
                  <el-checkbox
                    v-if="canToggleSubTasks"
                    :model-value="sub.isDone"
                    :disabled="updatingSubTask"
                    @change="handleToggleSubTask(sub, $event)"
                  >
                    <template v-if="canEditSubTasks && editingSubTaskId === sub.id">
                      <el-input
                        v-model="editingSubTaskTitle"
                        size="small"
                        class="subtask-title-input"
                        :disabled="updatingSubTask"
                        @keyup.enter="handleSaveSubTaskTitle(sub)"
                      />
                    </template>
                    <template v-else>
                      <span :class="{ 'subtask-done-text': sub.isDone }">{{ sub.title }}</span>
                    </template>
                  </el-checkbox>

                  <div v-else class="readonly-check">
                    <el-icon v-if="sub.isDone" class="ok-icon">
                      <CircleCheckFilled />
                    </el-icon>
                    <el-icon v-else class="wait-icon">
                      <CircleCheck />
                    </el-icon>
                    <span :class="{ 'subtask-done-text': sub.isDone }">{{ sub.title }}</span>
                  </div>
                </div>

                <div v-if="canEditSubTasks" class="subtask-actions">
                  <template v-if="editingSubTaskId === sub.id">
                    <el-button
                      type="primary"
                      link
                      size="small"
                      :disabled="updatingSubTask"
                      @click="handleSaveSubTaskTitle(sub)"
                    >
                      保存
                    </el-button>
                    <el-button
                      type="info"
                      link
                      size="small"
                      :disabled="updatingSubTask"
                      @click="cancelEditSubTask"
                    >
                      取消
                    </el-button>
                  </template>

                  <template v-else>
                    <el-button
                      type="primary"
                      link
                      size="small"
                      :disabled="updatingSubTask"
                      @click="startEditSubTask(sub)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      type="danger"
                      link
                      size="small"
                      :disabled="updatingSubTask"
                      @click="handleDeleteSubTask(sub)"
                    >
                      删除
                    </el-button>
                  </template>
                </div>
              </li>

              <!-- 发布者无子任务时：给一个占位说明（不影响功能） -->
              <li v-if="canEditSubTasks && !hasSubTasks" class="subtask-item placeholder">
                <span class="placeholder-text">还没有子任务，下面可以新增。</span>
              </li>
            </ul>

            <!-- 发布者可新增子任务 -->
            <div v-if="canEditSubTasks" class="subtask-input">
              <el-input
                v-model="newSubTaskTitle"
                placeholder="输入子任务标题，回车添加"
                @keyup.enter="handleCreateSubTask"
              >
                <template #append>
                  <el-button
                    type="primary"
                    :loading="creatingSubTask"
                    @click="handleCreateSubTask"
                  >
                    添加
                  </el-button>
                </template>
              </el-input>
            </div>
          </el-card>
        </div>

        <!-- 右侧：订单状态 & 操作区 -->
        <div class="task-side">
          <el-card shadow="never" class="order-card">
            <template #header>
              <div class="order-header">⚡ 任务进度与操作</div>
            </template>

            <!-- 未登录 -->
            <div v-if="!isLogin" class="section">
              <el-alert
                title="您还未登录，登录后可接单 / 提交 / 验收任务"
                type="info"
                :closable="false"
                show-icon
              />
              <el-button class="mt-12 w-100" type="primary" @click="goLogin">
                去登录
              </el-button>
            </div>

            <!-- 游客视角 -->
            <div v-else-if="viewMode === 'guest'" class="section">
              <el-alert
                v-if="task.status === 'PENDING'"
                title="任务待领取，快来抢单！"
                type="success"
                :closable="false"
                show-icon
              />
              <el-alert
                v-else
                title="您是旁观者"
                description="您不是该任务的发布者或执行者，仅可查看信息。"
                type="info"
                :closable="false"
                show-icon
                class="mt-12"
              />

              <el-button
                v-if="canRobOrder"
                class="mt-16 w-100"
                :type="isQuickClaim ? 'success' : 'primary'"
                size="large"
                :loading="opLoading"
                @click="handleAssign"
              >
                {{ isQuickClaim ? '⚡ 一键接单（低风险）' : '🚀 立即接单' }}
              </el-button>
            </div>

            <!-- 执行者视角 -->
            <div v-else-if="viewMode === 'worker'" class="section">
              <div class="status-box">
                <div class="label">当前身份</div>
                <div class="value worker">执行者</div>
              </div>

              <div class="status-box">
                <div class="label">订单状态</div>
                <div class="value">
                  <el-tag :type="getStatusTag(myOrder?.status || '')" size="small">
                    {{ getStatusText(myOrder?.status || '') }}
                  </el-tag>
                </div>
              </div>

              <div class="status-box">
                <div class="label">子任务完成</div>
                <div class="value">{{ subTaskProgressText || '暂无子任务拆分' }}</div>
              </div>

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
                  />

                  <el-button
                    class="mt-16 w-100"
                    type="primary"
                    size="large"
                    @click="openSubmitDialog"
                  >
                    {{ hasSubmissionHistory ? '🔄 重新提交成果' : '🏁 提交任务成果' }}
                  </el-button>

                  <!-- 历史提交参考 -->
                  <div v-if="hasSubmissionHistory" class="submission-view mt-12">
                    <div class="submission-content">
                      <div class="label">上次提交内容：</div>
                      <div class="content-box">
                        {{ currentSubmissionContent || '无' }}
                      </div>
                    </div>

                    <div v-if="currentSubmissionImage" class="submission-image">
                      <div class="label">上次提交截图：</div>
                      <el-image
                        :src="getFullUrl(currentSubmissionImage)"
                        fit="cover"
                        :preview-src-list="[getFullUrl(currentSubmissionImage)]"
                        preview-teleported
                        class="preview-img mt-8"
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
                      <div class="content-box">
                        {{ currentSubmissionContent || '无' }}
                      </div>
                    </div>

                    <div v-if="currentSubmissionImage" class="submission-image">
                      <div class="label">提交截图：</div>
                      <el-image
                        :src="getFullUrl(currentSubmissionImage)"
                        fit="cover"
                        :preview-src-list="[getFullUrl(currentSubmissionImage)]"
                        preview-teleported
                        class="preview-img mt-8"
                      />
                    </div>
                  </div>
                </template>

                <!-- 状态：已完成（COMPLETED） -->
                <template v-else-if="isOrderCompleted">
                  <el-alert
                    title="任务已完成，煜米已结算到您的账户。"
                    type="success"
                    :closable="false"
                    show-icon
                  />

                  <div class="submission-view mt-12">
                    <div class="submission-content">
                      <div class="label">最终提交内容：</div>
                      <div class="content-box">
                        {{ currentSubmissionContent || '无' }}
                      </div>
                    </div>

                    <div v-if="currentSubmissionImage" class="submission-image">
                      <div class="label">最终提交截图：</div>
                      <el-image
                        :src="getFullUrl(currentSubmissionImage)"
                        fit="cover"
                        :preview-src-list="[getFullUrl(currentSubmissionImage)]"
                        preview-teleported
                        class="preview-img mt-8"
                      />
                    </div>
                  </div>
                </template>

                <template v-else>
                  <el-alert
                    title="当前状态暂不可提交成果。"
                    type="warning"
                    :closable="false"
                    show-icon
                  />
                </template>
              </div>
            </div>

            <!-- 发布者视角 -->
            <div v-else-if="viewMode === 'publisher'" class="section">
              <div class="status-box">
                <div class="label">当前身份</div>
                <div class="value publisher">发布者</div>
              </div>

              <div class="status-box">
                <div class="label">执行者ID</div>
                <div class="value">{{ publisherOrder?.workerId || '暂无' }}</div>
              </div>

              <div class="section mt-16">
                <!-- 还没有人接单 -->
                <template v-if="task.status === 'PENDING'">
                  <el-alert title="等待勇士接单..." type="info" :closable="false" show-icon />
                </template>

                <!-- 已接单但未提交 -->
                <template v-else-if="task.status === 'ASSIGNED'">
                  <el-alert title="执行者正在努力搬砖..." type="info" :closable="false" show-icon />
                </template>

                <!-- 已提交待验收 -->
                <template v-else-if="task.status === 'SUBMITTED' && publisherOrder">
                  <el-alert title="收到成果，请验收" type="warning" :closable="false" show-icon />

                  <div class="submission-preview mt-12">
                    <div class="label">提交内容：</div>
                    <div class="content-box">
                      {{ publisherOrder.submissionContent || '无' }}
                    </div>

                    <el-image
                      v-if="publisherOrder.submissionImage"
                      :src="getFullUrl(publisherOrder.submissionImage)"
                      class="preview-img mt-8"
                      :preview-src-list="[getFullUrl(publisherOrder.submissionImage)]"
                      preview-teleported
                    />
                  </div>

                  <div class="mt-16 buttons-row">
                    <el-button
                      type="success"
                      class="flex-1"
                      :loading="opLoading"
                      @click="handleAccept"
                    >
                      ✅ 通过
                    </el-button>
                    <el-button
                      type="danger"
                      class="flex-1"
                      :loading="opLoading"
                      @click="handleReject"
                    >
                      ❌ 驳回
                    </el-button>
                  </div>

                  <div class="mt-8" style="text-align:center">
                    <el-button type="warning" plain size="small" @click="showDisputeDialog = true">
                      ⚡ 发起争议
                    </el-button>
                  </div>
                </template>

                <!-- 已完成 -->
                <template v-else-if="task.status === 'COMPLETED'">
                  <el-alert title="交易已完成" type="success" :closable="false" show-icon />
                </template>

                <!-- 其他 -->
                <template v-else>
                  <el-alert title="暂无可操作项。" type="info" :closable="false" show-icon />
                </template>
              </div>
            </div>

            <!-- 兜底 -->
            <div v-else class="section">
              <el-alert title="当前身份无法识别，仅可查看任务信息。" type="info" :closable="false" show-icon />
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 任务不存在 -->
    <el-empty v-else description="任务不存在或已被删除" />

    <!-- 执行者提交成果弹窗 -->
    <el-dialog
      v-model="submitDialogVisible"
      title="提交任务成果"
      width="520px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="成果说明">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您的完成情况"
          />
        </el-form-item>

        <el-form-item label="成果截图 (URL，可选)">
          <el-input
            v-model="submitForm.image"
            placeholder="可填写成果截图 URL（后续可接入上传）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitResult">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 争议弹窗 -->
    <el-dialog v-model="showDisputeDialog" title="发起争议" width="460px">
      <el-form>
        <el-form-item label="争议原因" required>
          <el-input v-model="disputeReason" type="textarea" :rows="3" placeholder="请说明争议原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDisputeDialog = false">取消</el-button>
        <el-button type="warning" :loading="disputeLoading" @click="handleDispute">发起争议</el-button>
      </template>
    </el-dialog>

    <!-- 推荐任务 -->
    <el-card v-if="relatedTasks.length" class="related-card" shadow="never">
      <template #header><span style="font-weight:600">🔗 你可能会感兴趣</span></template>
      <div class="related-grid">
        <div v-for="rt in relatedTasks" :key="rt.id" class="related-item" @click="$router.push(`/task/${rt.id}`)">
          <span class="related-title">{{ rt.title }}</span>
          <span class="related-price">{{ ((rt.price||0)/100).toFixed(0) }} 煜米</span>
        </div>
      </div>
    </el-card>

    <!-- 留言区（订单参与方可见） -->
    <div v-if="myOrder || publisherOrder" class="comment-section">
      <h4>💬 沟通记录</h4>
      <div v-if="comments.length" class="comment-list">
        <div v-for="c in comments" :key="c.id" class="comment-item" :class="{ mine: c.userId === currentUser?.id }">
          <span class="comment-author">{{ c.userId === currentUser?.id ? '我' : '对方' }}</span>
          <span class="comment-text">{{ c.content }}</span>
          <span class="comment-time">{{ new Date(c.createdAt).toLocaleTimeString('zh-CN') }}</span>
        </div>
      </div>
      <div class="comment-input">
        <el-input v-model="newComment" placeholder="输入留言..." size="small" @keyup.enter="sendComment" />
        <el-button size="small" type="primary" @click="sendComment" :loading="sendingComment">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, CircleCheckFilled } from '@element-plus/icons-vue'

import {
  findTaskDetail,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  getRelatedTasks,
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

import { disputeApi } from '@/api/dispute'
import { commentApi } from '@/api/comment'

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

const getFirstLetter = (email?: string) => (email ? email.charAt(0).toUpperCase() : '?')

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
const relatedTasks = ref<Task[]>([])

const fetchRelated = async (id: number) => {
  try { const r: any = await getRelatedTasks(id); relatedTasks.value = Array.isArray(r) ? r : r?.data || [] }
  catch { relatedTasks.value = [] }
}
const myOrder = ref<OrderItem | null>(null)
const publisherOrder = ref<OrderItem | null>(null)
const currentUser = ref<UserProfile | null>(null)

const pageLoading = ref(false)
const opLoading = ref(false)

// 子任务相关
const newSubTaskTitle = ref('')
const creatingSubTask = ref(false)
const updatingSubTask = ref(false)
const editingSubTaskId = ref<number | null>(null)
const editingSubTaskTitle = ref('')

// 提交成果弹窗
const submitDialogVisible = ref(false)
const submitLoading = ref(false)
const submitForm = reactive({
  content: '',
  image: '',
})

// 争议
const showDisputeDialog = ref(false)
const disputeReason = ref('')
const disputeLoading = ref(false)

// 留言
const comments = ref<any[]>([])
const newComment = ref('')
const sendingComment = ref(false)

// ========== 计算属性 ==========
const isLogin = computed(() => !!currentUser.value)

const isPublisher = computed(() => {
  if (!task.value || !currentUser.value) return false

  // 优先用 ID 判断（更可靠），兜底用 email
  const publisherId =
    (task.value.publisher as any)?.id ?? (task.value as any).publisherId
  const currentId = (currentUser.value as any)?.id

  if (publisherId !== undefined && currentId !== undefined) {
    return Number(publisherId) === Number(currentId)
  }

  const publisherEmail = (task.value.publisher as any)?.email
  const currentEmail = (currentUser.value as any)?.email
  return !!publisherEmail && !!currentEmail && publisherEmail === currentEmail
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

const completionPercentage = computed(() => {
  if (!task.value?.subTasks || task.value.subTasks.length === 0) return 0
  const total = task.value.subTasks.length
  const done = task.value.subTasks.filter((s) => s.isDone).length
  return Math.round((done / total) * 100)
})

const subTaskProgressText = computed(() => {
  if (!task.value?.subTasks || task.value.subTasks.length === 0) return ''
  const total = task.value.subTasks.length
  const done = task.value.subTasks.filter((s) => s.isDone).length
  return `${done} / ${total} 已完成`
})

const canEditSubTasks = computed(() => isPublisher.value)

// 是否可以勾选子任务完成状态：
// - 发布者：永远允许
// - 执行者：只有在「已接单 / 已提交待验收」阶段允许（ASSIGNED / SUBMITTED）
const canToggleSubTasks = computed(() => {
  if (isPublisher.value) return true
  if (viewMode.value !== 'worker') return false
  const st = myOrder.value?.status
  return st === 'ASSIGNED' || st === 'SUBMITTED'
})

const canRobOrder = computed(
  () =>
    !!task.value &&
    task.value.status === 'PENDING' &&
    !isPublisher.value &&
    !isWorker.value,
)

// 一键接单条件：低风险 + 发布者已认证
const isQuickClaim = computed(() =>
  task.value?.riskLevel === 'LOW' && (task.value as any)?.publisher?.verified,
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
    (!!currentOrder.value.submissionContent || !!currentOrder.value.submissionImage),
)

const isOrderAssigned = computed(() => currentOrder.value?.status === 'ASSIGNED')
const isOrderSubmitted = computed(() => currentOrder.value?.status === 'SUBMITTED')
const isOrderCompleted = computed(() => currentOrder.value?.status === 'COMPLETED')

const currentSubmissionContent = computed(() => currentOrder.value?.submissionContent || '')
const currentSubmissionImage = computed(() => currentOrder.value?.submissionImage || '')

// ========== 加载数据 ==========
const getTaskIdFromRoute = () => {
  const idParam = route.params.id
  const id = Number(idParam)
  if (!id || Number.isNaN(id)) return null
  return id
}

const loadCurrentUser = async () => {
  try {
    // 兼容历史存储 key：不同页面/版本可能用过不同名称
    const keys = ['currentUser', 'user', 'userInfo', 'profile', 'current_user']
    for (const k of keys) {
      const cached = localStorage.getItem(k)
      if (cached) {
        currentUser.value = JSON.parse(cached) as UserProfile
        // 统一写回，后续页面读取更稳定
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
        return
      }
    }

    // 若本地无缓存，则尝试拉取 profile（需要登录 token）
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('jwt') ||
      ''
    if (!token) {
      currentUser.value = null
      return
    }

    const res = await getProfile()
    const profile = (res as any)?.data ?? res
    currentUser.value = profile as UserProfile
    localStorage.setItem('currentUser', JSON.stringify(profile))
  } catch {
    currentUser.value = null
  }
}

const loadTask = async () => {
  const taskId = getTaskIdFromRoute()
  if (!taskId) throw new Error('任务 ID 无效')

  const res = (await findTaskDetail(taskId)) as Task
  task.value = res
  fetchRelated(res.id)

  // 如果正在编辑的子任务已不存在，则退出编辑态
  if (editingSubTaskId.value !== null) {
    const exists = (res.subTasks || []).some((s) => s.id === editingSubTaskId.value)
    if (!exists) cancelEditSubTask()
  }
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

  // 发布者视角订单：仅发布者才拉取，避免旁观者/执行者触发权限接口
  if (!isPublisher.value) {
    publisherOrder.value = null
  } else {
    try {
      const resPublisher = await findTaskOrderForDetail(taskId)
      publisherOrder.value = (resPublisher || null) as OrderItem | null
    } catch {
      publisherOrder.value = null
    }
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

const startEditSubTask = (subTask: SubTask) => {
  editingSubTaskId.value = subTask.id
  editingSubTaskTitle.value = subTask.title
}

const cancelEditSubTask = () => {
  editingSubTaskId.value = null
  editingSubTaskTitle.value = ''
}

const handleSaveSubTaskTitle = async (subTask: SubTask) => {
  if (!task.value) return
  const title = editingSubTaskTitle.value.trim()
  if (!title) {
    ElMessage.warning('子任务标题不能为空')
    return
  }

  updatingSubTask.value = true
  try {
    await updateSubTask(task.value.id, subTask.id, { title })
    ElMessage.success('子任务标题已更新')
    cancelEditSubTask()
    await loadTask()
  } catch (error) {
    console.error('更新子任务标题失败:', error)
    ElMessage.error('更新子任务标题失败')
  } finally {
    updatingSubTask.value = false
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
      { type: 'warning' },
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

const openSubmitDialog = () => {
  if (!currentOrder.value) return
  submitForm.content = currentOrder.value.submissionContent || ''
  submitForm.image = currentOrder.value.submissionImage || ''
  submitDialogVisible.value = true
}

const handleSubmitResult = async () => {
  if (!currentOrder.value) return
  const content = submitForm.content.trim()
  if (!content) {
    ElMessage.warning('请填写提交内容')
    return
  }
  submitLoading.value = true
  try {
    await submitTaskResult(currentOrder.value.id, {
      content,
      image: submitForm.image || undefined,
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
      '确认验收通过并结算煜米给执行者？',
      '提示',
      { type: 'warning' },
    )
  } catch {
    return
  }

  opLoading.value = true
  try {
    await completeOrder(publisherOrder.value.id, { isAccepted: true, comment: '' })
    ElMessage.success('验收成功，煜米已结算')
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
        inputValidator: (val: string) => (val.trim().length > 0 ? true : '驳回原因不能为空'),
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
    if (error == 'cancel') return
    console.error('驳回失败:', error)
    ElMessage.error('驳回失败')
  } finally {
    opLoading.value = false
  }
}

// 发起争议
const handleDispute = async () => {
  if (!disputeReason.value.trim()) { ElMessage.warning('请填写争议原因'); return }
  if (!publisherOrder.value) { ElMessage.error('未找到订单'); return }
  disputeLoading.value = true
  try {
    await disputeApi.create({ orderId: publisherOrder.value.id, reason: disputeReason.value })
    ElMessage.success('争议已发起，等待处理')
    showDisputeDialog.value = false
    disputeReason.value = ''
    loadPage()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '发起失败') }
  finally { disputeLoading.value = false }
}

// 留言
const loadComments = async () => {
  const oid = myOrder.value?.id || publisherOrder.value?.id
  if (!oid) return
  try { const res: any = await commentApi.list(oid); comments.value = Array.isArray(res) ? res : res?.data || [] } catch {}
}
const sendComment = async () => {
  const oid = myOrder.value?.id || publisherOrder.value?.id
  if (!oid || !newComment.value.trim()) return
  sendingComment.value = true
  try {
    await commentApi.send(oid, newComment.value)
    newComment.value = ''
    loadComments()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '发送失败') }
  finally { sendingComment.value = false }
}

// ========== 路由相关 ==========
const goBack = () => router.back()
const goLogin = () => router.push('/login')

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
  border-radius: 10px;
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
  color: #64748b;
}

.price-tag {
  font-weight: 600;
}

.task-body {
  display: flex;
  gap: 24px;
  margin-top: 10px;
}

.task-main {
  flex: 2;
  min-width: 0;
}

.task-side {
  flex: 1;
  min-width: 320px;
}

/* 侧边栏卡片样式 */
.order-card {
  position: sticky;
  top: 20px;
}

.order-header {
  font-weight: 600;
}

.task-title {
  font-size: 24px;
  margin: 0 0 12px;
  font-weight: 700;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #94a3b8;
  font-size: 14px;
  background: rgba(17, 24, 39, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.08);
  padding: 10px 14px;
  border-radius: 10px;
}

.avatar-small {
  /* fits dark theme by default */
}

.publisher-info .time {
  margin-left: auto;
  color: #64748b;
  font-size: 12px;
}
.verified-tag { margin-left: 6px; vertical-align: middle; }

/* 信任快照 */
.trust-snapshot {
  display: flex;
  gap: 16px;
  margin: 12px 0;
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.04);
  border: 1px solid rgba(16, 185, 129, 0.1);
  border-radius: 10px;
}
.trust-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.trust-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #6ee7b7;
}
.trust-stat-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.task-image .rounded-image {
  width: 100%;
  max-height: 320px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 14px;
}

.desc-card {
  margin-bottom: 14px;
}

.desc-header {
  font-weight: 700;
  border-left: 3px solid #6366f1;
  padding-left: 10px;
}

.task-desc {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #cbd5e1;
}

.subtask-card {
  margin-top: 8px;
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  font-weight: 700;
}

.progress-bar-wrapper {
  margin: 12px 0;
}

.subtask-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.subtask-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  transition: background 0.2s;
}

.subtask-item:hover {
  background: rgba(99, 102, 241, 0.04);
}

.subtask-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.subtask-title-input {
  width: 260px;
  max-width: 100%;
}

.readonly-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
}

.ok-icon {
  color: #10b981;
}

.wait-icon {
  color: #64748b;
}

.item-done {
  opacity: 0.9;
}

.subtask-done-text {
  text-decoration: line-through;
  color: #64748b;
}

.subtask-actions {
  display: flex;
  gap: 6px;
  margin-left: 10px;
  flex-shrink: 0;
}

.subtask-input {
  margin-top: 12px;
}

.placeholder {
  justify-content: center;
  border-bottom: none;
}

.placeholder-text {
  color: #64748b;
  font-size: 13px;
}

/* 侧边栏区块 */
.section + .section {
  margin-top: 16px;
}

.status-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  padding-bottom: 8px;
}

.status-box .label {
  color: #94a3b8;
}

.status-box .value {
  font-weight: 700;
}

.value.publisher {
  color: #818cf8;
}

.value.worker {
  color: #6ee7b7;
}

.submission-view {
  font-size: 13px;
}

.submission-content,
.submission-image {
  margin-bottom: 10px;
}

.submission-view .label {
  font-weight: 700;
  margin-bottom: 6px;
}

.content-box {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  padding: 12px;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #cbd5e1;
}

.preview-img {
  width: 100%;
  max-height: 240px;
  border-radius: 10px;
  overflow: hidden;
}

.buttons-row {
  display: flex;
  gap: 12px;
}

.w-100 {
  width: 100%;
}

.flex-1 {
  flex: 1;
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

@media (max-width: 960px) {
  .task-body {
    flex-direction: column;
  }
  .task-side {
    min-width: 0;
  }
  .order-card {
    position: static;
  }
}

.related-card { margin-top: 16px; }
.related-grid { display: flex; flex-direction: column; gap: 8px; }
.related-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border-radius: 10px;
  background: rgba(17,24,39,0.35); border: 1px solid rgba(148,163,184,0.08);
  cursor: pointer; transition: background 0.2s, border-color 0.2s;
}
.related-item:hover { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.2); }
.related-title { font-size: 14px; color: #cbd5e1; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.related-price { font-size: 14px; font-weight: 700; color: #fcd34d; margin-left: 12px; }
</style>
