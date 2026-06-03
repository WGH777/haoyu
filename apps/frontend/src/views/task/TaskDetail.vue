<template>
  <section class="task-detail-page" v-loading="pageLoading">
    <!-- ====== Hero 头部 ====== -->
    <header class="task-detail-hero">
      <button class="hero-back" @click="goBack">
        <span class="back-arrow">←</span>
        <span>返回</span>
      </button>

      <div class="hero-body">
        <div class="hero-top">
          <span class="hero-badge" :class="'badge-' + (task ? getStatusClass(task.status) : 'default')">
            {{ task ? getStatusText(task.status) : '加载中…' }}
          </span>
          <span v-if="task" class="hero-id">#{{ task.id }}</span>
        </div>

        <h1 class="hero-title">{{ task?.title || '任务详情' }}</h1>

        <div class="hero-meta" v-if="task">
          <div class="hero-meta-item">
            <span class="meta-icon">👤</span>
            <span>{{ task.publisher?.nickname || task.publisher?.email || '未知用户' }}</span>
          </div>
          <div class="hero-meta-item">
            <span class="meta-icon">🕐</span>
            <span>{{ formatTime(task.createdAt) }}</span>
          </div>
          <div class="hero-meta-item hero-price">
            <span class="meta-icon">💰</span>
            <span class="price-value">{{ formatYumi(task.price) }}</span>
            <span class="price-unit">煜米</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ====== 双栏网格 ====== -->
    <div class="task-detail-grid" v-if="task">
      <!-- ====== 左侧主内容 ====== -->
      <main class="task-detail-main">

        <!-- 参考图卡片 -->
        <article class="detail-card cover-card">
          <div class="card-header-row">
            <h3 class="card-title">📷 参考图</h3>
            <button
              v-if="task.image"
              class="cover-zoom-btn"
              @click="previewImage"
            >查看大图</button>
          </div>

          <div class="cover-frame" :class="{ 'no-image': !task.image }">
            <img
              v-if="task.image"
              :src="getFullUrl(task.image)"
              alt="任务参考图"
              class="cover-img"
            />
            <div v-else class="cover-fallback">
              <span class="cover-fallback-icon">🖼️</span>
              <span class="cover-fallback-title">暂无参考图</span>
              <span class="cover-fallback-hint">发布者未上传参考图片</span>
            </div>
          </div>
        </article>

        <!-- 任务说明卡片 -->
        <article class="detail-card desc-card">
          <h3 class="card-title">📋 任务说明</h3>
          <div class="desc-content">
            <p class="desc-text">{{ task.description || '暂无任务描述' }}</p>
          </div>
          <div class="desc-footer">
            <div class="desc-tip">
              <span class="tip-icon">💡</span>
              <span>请在接单前确认交付物、验收标准与时间预期。</span>
            </div>
          </div>
        </article>

        <!-- 子任务拆分卡片 -->
        <article class="detail-card subtask-card">
          <div class="card-header-row">
            <h3 class="card-title">📝 子任务拆分</h3>
            <el-tag v-if="hasSubTasks" size="small" type="success" effect="light">
              已拆分 {{ task.subTasks?.length || 0 }} 项
            </el-tag>
          </div>

          <!-- 进度条（有子任务才展示） -->
          <div v-if="hasSubTasks" class="subtask-progress">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: completionPercentage + '%' }"></div>
            </div>
            <span class="progress-text">{{ completionPercentage }}%</span>
          </div>

          <!-- 空状态 -->
          <div v-if="!hasSubTasks && !canEditSubTasks" class="subtask-empty">
            <div class="empty-graphic">
              <span class="empty-icon">📋</span>
            </div>
            <p class="empty-title">还没有子任务</p>
            <p class="empty-desc">可以把大需求拆成多个可验收的小步骤。</p>
          </div>

          <!-- 发布者但无子任务：占位 + 输入框 -->
          <div v-else-if="!hasSubTasks && canEditSubTasks" class="subtask-empty">
            <div class="empty-graphic">
              <span class="empty-icon">📋</span>
            </div>
            <p class="empty-title">还没有子任务</p>
            <p class="empty-desc">可以把大需求拆成多个可验收的小步骤。</p>
            <div class="subtask-input">
              <el-input
                v-model="newSubTaskTitle"
                placeholder="输入子任务标题，回车添加"
                @keyup.enter="handleCreateSubTask"
              >
                <template #append>
                  <el-button
                    type="primary"
                    :loading="creatingSubTask"
                    class="add-subtask-btn-desktop"
                    @click="handleCreateSubTask"
                  >
                    添加
                  </el-button>
                </template>
              </el-input>
              <el-button
                type="primary"
                :loading="creatingSubTask"
                class="add-subtask-btn-mobile"
                @click="handleCreateSubTask"
              >
                添加子任务
              </el-button>
            </div>
          </div>

          <!-- 子任务列表 -->
          <ul v-if="hasSubTasks" class="subtask-list">
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
                  <span class="check-dot" :class="{ done: sub.isDone }"></span>
                  <span :class="{ 'subtask-done-text': sub.isDone }">{{ sub.title }}</span>
                </div>
              </div>

              <div v-if="canEditSubTasks" class="subtask-actions">
                <template v-if="editingSubTaskId === sub.id">
                  <el-button size="small" plain :disabled="updatingSubTask" @click="handleSaveSubTaskTitle(sub)">保存</el-button>
                  <el-button size="small" plain :disabled="updatingSubTask" @click="cancelEditSubTask">取消</el-button>
                </template>
                <template v-else>
                  <el-button size="small" plain :disabled="updatingSubTask" @click="startEditSubTask(sub)">编辑</el-button>
                  <el-button size="small" type="danger" plain :disabled="updatingSubTask" @click="handleDeleteSubTask(sub)">删除</el-button>
                </template>
              </div>
            </li>

            <!-- 发布者可在列表底部新增 -->
            <li v-if="canEditSubTasks && hasSubTasks" class="subtask-item subtask-input-row">
              <div class="add-subtask-row">
                <el-input
                  v-model="newSubTaskTitle"
                  size="small"
                  placeholder="输入新子任务标题，回车添加"
                  class="add-subtask-input"
                  @keyup.enter="handleCreateSubTask"
                >
                  <template #append>
                    <el-button type="primary" size="small" class="add-subtask-btn-desktop" :loading="creatingSubTask" @click="handleCreateSubTask">添加</el-button>
                  </template>
                </el-input>
                <el-button type="primary" size="small" class="add-subtask-btn-mobile" :loading="creatingSubTask" @click="handleCreateSubTask">添加子任务</el-button>
              </div>
            </li>
          </ul>
        </article>

        <!-- 需求元信息卡片 -->
        <article class="detail-card meta-card" v-if="task.category || task.serviceMode">
          <h3 class="card-title">📌 需求信息</h3>
          <div class="meta-grid">
            <div class="meta-item" v-if="task.category">
              <span class="meta-label">分类</span>
              <span class="meta-val">{{ task.category }}</span>
            </div>
            <div class="meta-item" v-if="task.serviceMode">
              <span class="meta-label">服务方式</span>
              <span class="meta-val">{{ getServiceModeText(task.serviceMode) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">交付提示</span>
              <span class="meta-val">请在接单前确认交付物、验收标准与时间预期。</span>
            </div>
          </div>
        </article>

        <!-- 任务流程 Timeline -->
        <article class="detail-card timeline-card">
          <h3 class="card-title">⏱ 任务流程</h3>
          <div class="timeline">
            <div
              v-for="(step, idx) in timelineSteps"
              :key="idx"
              class="timeline-step"
              :class="{
                done: step.status === 'done',
                current: step.status === 'current',
                pending: step.status === 'pending',
              }"
            >
              <div class="timeline-dot">
                <span v-if="step.status === 'done'" class="dot-inner done">✓</span>
                <span v-else-if="step.status === 'current'" class="dot-inner current"></span>
                <span v-else class="dot-inner pending"></span>
              </div>
              <div class="timeline-info">
                <span class="timeline-label">{{ step.label }}</span>
                <span class="timeline-desc">{{ step.desc }}</span>
              </div>
              <div v-if="idx < timelineSteps.length - 1" class="timeline-line" :class="{ filled: step.status === 'done' }"></div>
            </div>
          </div>
        </article>

        <!-- 留言区 -->
        <div v-if="myOrder || publisherOrder" class="detail-card comment-card">
          <h3 class="card-title">💬 沟通记录</h3>
          <div v-if="comments.length" class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item" :class="{ mine: c.userId === currentUser?.id }">
              <span class="comment-author">{{ c.userId === currentUser?.id ? '我' : '对方' }}</span>
              <span class="comment-text">{{ c.content }}</span>
              <span class="comment-time">{{ new Date(c.createdAt).toLocaleTimeString('zh-CN') }}</span>
            </div>
          </div>
          <div v-else class="comment-empty">
            <span>暂无沟通记录</span>
          </div>
          <div class="comment-input">
            <el-input v-model="newComment" placeholder="输入留言..." size="small" @keyup.enter="sendComment" />
            <el-button size="small" type="primary" @click="sendComment" :loading="sendingComment">发送</el-button>
          </div>
        </div>

      </main>

      <!-- ====== 右侧操作栏 ====== -->
      <aside class="task-detail-aside">

        <!-- 卡1: 任务进度与操作 -->
        <div class="aside-card action-card">
          <h3 class="aside-card-title">⚡ 任务进度与操作</h3>

          <!-- 未登录 -->
          <template v-if="!isLogin">
            <el-alert title="您还未登录，登录后可接单 / 提交 / 验收任务" type="info" :closable="false" show-icon />
            <el-button class="aside-btn-full mt-12" type="primary" @click="goLogin">去登录</el-button>
          </template>

          <!-- 游客视角 -->
          <template v-else-if="viewMode === 'guest'">
            <div class="aside-status-row">
              <span class="aside-label">当前状态</span>
              <el-tag :type="getStatusTag(task.status)" size="small">{{ getStatusText(task.status) }}</el-tag>
            </div>
            <div class="aside-status-row">
              <span class="aside-label">当前身份</span>
              <span class="aside-val">旁观者</span>
            </div>
            <div class="aside-status-row">
              <span class="aside-label">执行者</span>
              <span class="aside-val">暂无</span>
            </div>

            <el-alert
              v-if="task.status === 'PENDING'"
              title="任务待领取，快来抢单！"
              type="success"
              :closable="false"
              show-icon
              class="mt-12"
            />
            <el-alert
              v-else
              title="您不是该任务的发布者或执行者"
              description="仅可查看信息"
              type="info"
              :closable="false"
              show-icon
              class="mt-12"
            />

            <el-button
              v-if="canRobOrder"
              class="aside-btn-full mt-12"
              type="primary"
              size="large"
              :loading="opLoading"
              @click="handleAssign"
            >
              🚀 立即接单
            </el-button>
          </template>

          <!-- 执行者视角 -->
          <template v-else-if="viewMode === 'worker'">
            <div class="aside-status-row">
              <span class="aside-label">当前身份</span>
              <span class="aside-val role-worker">执行者</span>
            </div>
            <div class="aside-status-row">
              <span class="aside-label">订单状态</span>
              <el-tag :type="getStatusTag(myOrder?.status || '')" size="small">{{ getStatusText(myOrder?.status || '') }}</el-tag>
            </div>
            <div class="aside-status-row" v-if="completionPercentage > 0">
              <span class="aside-label">子任务完成</span>
              <span class="aside-val">{{ subTaskProgressText }}</span>
            </div>

            <!-- ASSIGNED -->
            <template v-if="isOrderAssigned">
              <el-alert
                v-if="hasSubmissionHistory"
                title="之前提交的成果已被驳回"
                description="请根据发布者意见修改后重新提交。"
                type="warning"
                :closable="false"
                show-icon
                class="mt-12"
              />
              <el-alert
                v-else
                title="请按需求完成任务后提交成果"
                description="提交后等待发布者验收。"
                type="info"
                :closable="false"
                show-icon
                class="mt-12"
              />
              <el-button class="aside-btn-full mt-12" type="primary" size="large" @click="openSubmitDialog">
                {{ hasSubmissionHistory ? '🔄 重新提交成果' : '🏁 提交任务成果' }}
              </el-button>
            </template>

            <!-- SUBMITTED -->
            <template v-else-if="isOrderSubmitted">
              <el-alert title="您已提交成果，等待发布者验收。" type="success" :closable="false" show-icon class="mt-12" />
            </template>

            <!-- COMPLETED -->
            <template v-else-if="isOrderCompleted">
              <el-alert title="任务已完成，赏金已结算到您的账户。" type="success" :closable="false" show-icon class="mt-12" />
            </template>

            <template v-else>
              <el-alert title="当前状态暂不可提交成果。" type="warning" :closable="false" show-icon class="mt-12" />
            </template>

            <!-- 提交历史预览 -->
            <div v-if="hasSubmissionHistory" class="submission-brief mt-12">
              <div class="submission-brief-content">{{ currentSubmissionContent || '无' }}</div>
              <el-image
                v-if="currentSubmissionImage"
                :src="getFullUrl(currentSubmissionImage)"
                fit="cover"
                :preview-src-list="[getFullUrl(currentSubmissionImage)]"
                preview-teleported
                class="submission-brief-img mt-8"
              />
            </div>
          </template>

          <!-- 发布者视角 -->
          <template v-else-if="viewMode === 'publisher'">
            <div class="aside-status-row">
              <span class="aside-label">当前身份</span>
              <span class="aside-val role-publisher">发布者</span>
            </div>
            <div class="aside-status-row">
              <span class="aside-label">执行者</span>
              <span class="aside-val">{{ publisherOrder?.workerId ? '已指派 #' + publisherOrder.workerId : '暂无' }}</span>
            </div>

            <!-- PENDING -->
            <template v-if="task.status === 'PENDING'">
              <el-alert title="等待勇士接单…" type="info" :closable="false" show-icon class="mt-12" />
            </template>

            <!-- ASSIGNED -->
            <template v-else-if="task.status === 'ASSIGNED'">
              <el-alert title="执行者正在努力搬砖…" type="info" :closable="false" show-icon class="mt-12" />
            </template>

            <!-- SUBMITTED -->
            <template v-else-if="task.status === 'SUBMITTED' && publisherOrder">
              <el-alert title="收到成果，请验收" type="warning" :closable="false" show-icon class="mt-12" />

              <div class="submission-brief mt-12">
                <div class="submission-brief-content">{{ publisherOrder.submissionContent || '无' }}</div>
                <el-image
                  v-if="publisherOrder.submissionImage"
                  :src="getFullUrl(publisherOrder.submissionImage)"
                  class="submission-brief-img mt-8"
                  :preview-src-list="[getFullUrl(publisherOrder.submissionImage)]"
                  preview-teleported
                />
              </div>

              <div class="mt-12 action-btn-row">
                <el-button type="success" class="flex-1" :loading="opLoading" @click="handleAccept">✅ 通过</el-button>
                <el-button type="danger" class="flex-1" :loading="opLoading" @click="handleReject">❌ 驳回</el-button>
              </div>
              <div class="mt-8 text-center">
                <el-button type="warning" plain size="small" @click="showDisputeDialog = true">⚡ 发起争议</el-button>
              </div>
            </template>

            <!-- COMPLETED -->
            <template v-else-if="task.status === 'COMPLETED'">
              <el-alert title="交易已完成" type="success" :closable="false" show-icon class="mt-12" />
            </template>

            <template v-else>
              <el-alert title="暂无可操作项。" type="info" :closable="false" show-icon class="mt-12" />
            </template>
          </template>

          <!-- 兜底 -->
          <template v-else>
            <el-alert title="当前身份无法识别，仅可查看任务信息。" type="info" :closable="false" show-icon />
          </template>
        </div>

        <!-- 卡2: 赏金与托管 -->
        <div class="aside-card escrow-card">
          <h3 class="aside-card-title">💎 赏金与托管</h3>
          <div class="escrow-amount">
            <span class="escrow-number">{{ formatYumi(task.price) }}</span>
            <span class="escrow-unit">煜米</span>
          </div>
          <div class="escrow-status-row">
            <span class="aside-label">托管状态</span>
            <el-tag
              :type="escrowStatusTag"
              size="small"
              effect="dark"
            >{{ escrowStatusText }}</el-tag>
          </div>
          <div class="escrow-tip">
            <span class="tip-icon">🛡️</span>
            <span>赏金已由平台托管，交付确认后自动结算。</span>
          </div>
        </div>

        <!-- 卡3: 发布者信用 -->
        <div class="aside-card publisher-card">
          <h3 class="aside-card-title">👤 发布者</h3>
          <div class="publisher-card-body">
            <el-avatar
              :size="40"
              :src="getFullUrl((task.publisher as any)?.avatar)"
              class="publisher-avatar"
            >{{ getFirstLetter((task.publisher as any)?.email) }}</el-avatar>
            <div class="publisher-info">
              <span class="publisher-name">{{ task.publisher?.nickname || task.publisher?.email || '未知用户' }}</span>
              <span class="publisher-role">任务发布者</span>
            </div>
          </div>
        </div>

        <!-- 卡4: 平台保障提示 -->
        <div class="aside-card safety-card">
          <h3 class="aside-card-title">🛡️ 平台保障</h3>
          <ul class="safety-list">
            <li class="safety-item">
              <span class="safety-dot"></span>
              <span>接单前请确认需求范围</span>
            </li>
            <li class="safety-item">
              <span class="safety-dot"></span>
              <span>交付前请保留沟通记录</span>
            </li>
            <li class="safety-item">
              <span class="safety-dot"></span>
              <span>争议可申请平台仲裁</span>
            </li>
            <li class="safety-item">
              <span class="safety-dot"></span>
              <span>平台根据履约记录累计信用</span>
            </li>
          </ul>
        </div>

      </aside>
    </div>

    <!-- ====== 任务不存在 ====== -->
    <el-empty v-if="!task && !pageLoading" description="任务不存在或已被删除" />

    <!-- ====== 执行者提交成果弹窗 ====== -->
    <el-dialog v-model="submitDialogVisible" title="提交任务成果" width="520px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="成果说明">
          <el-input v-model="submitForm.content" type="textarea" :rows="4" placeholder="请详细描述您的完成情况" />
        </el-form-item>
        <el-form-item label="成果截图 (URL，可选)">
          <el-input v-model="submitForm.image" placeholder="可填写成果截图 URL（后续可接入上传）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitResult">提交</el-button>
      </template>
    </el-dialog>

    <!-- ====== 争议弹窗 ====== -->
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

    <!-- ====== 图片预览弹窗 ====== -->
    <el-dialog v-model="imagePreviewVisible" title="参考图" width="80%" destroy-on-close>
      <img v-if="task?.image" :src="getFullUrl(task.image)" alt="参考图" class="preview-full-img" />
    </el-dialog>

    <!-- 移动端子任务删除确认弹窗 -->
    <van-dialog
      v-model:show="showSubtaskDeleteDialog"
      title="确认删除"
      show-cancel-button
      confirm-button-text="确认删除"
      cancel-button-text="取消"
      @confirm="confirmDeleteSubTask"
      class="van-dialog-dark"
      :close-on-click-overlay="false"
    >
      <p style="padding:16px;margin:0;color:#e2e8f0;font-size:14px;text-align:center;">确定要删除该子任务吗？此操作不可恢复。</p>
    </van-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Dialog } from 'vant'

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

import { disputeApi } from '@/api/dispute'
import { commentApi } from '@/api/comment'

import { getProfile, type UserProfile } from '@/api/user'

type ViewMode = 'guest' | 'worker' | 'publisher'

// ========== 工具函数 ==========
const getFullUrl = (path?: string | null): string => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path
  if (path.startsWith('/')) return path
  return '/' + path
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

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    ONGOING: 'assigned',
    SUBMITTED: 'submitted',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  }
  return map[status] || 'default'
}

const getServiceModeText = (mode: string) => {
  const map: Record<string, string> = {
    ONLINE: '线上',
    OFFLINE: '线下',
    BOTH: '线上/线下均可',
  }
  return map[mode] || mode
}

const formatYumi = (fen: number | null | undefined): string => {
  if (fen === null || fen === undefined) return '0'
  const yumi = fen / 100
  return Number.isInteger(yumi) ? yumi.toString() : yumi.toFixed(2)
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
const editingSubTaskId = ref<number | null>(null)
const editingSubTaskTitle = ref('')

// 提交成果弹窗
const submitDialogVisible = ref(false)
const submitLoading = ref(false)
const submitForm = reactive({ content: '', image: '' })

// 图片预览
const imagePreviewVisible = ref(false)

// 争议
// Vant dialog for mobile subtask delete
const showSubtaskDeleteDialog = ref(false)
const pendingDeleteSubtask = ref<SubTask | null>(null)

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
  const publisherId = (task.value.publisher as any)?.id ?? (task.value as any).publisherId
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

const canToggleSubTasks = computed(() => {
  if (isPublisher.value) return true
  if (viewMode.value !== 'worker') return false
  const st = myOrder.value?.status
  return st === 'ASSIGNED' || st === 'SUBMITTED'
})

const canRobOrder = computed(
  () => !!task.value && task.value.status === 'PENDING' && !isPublisher.value && !isWorker.value,
)

const currentOrder = computed<OrderItem | null>(() => {
  if (viewMode.value === 'worker') return myOrder.value
  if (viewMode.value === 'publisher') return publisherOrder.value
  return null
})

const hasSubmissionHistory = computed(
  () => !!currentOrder.value && (!!currentOrder.value.submissionContent || !!currentOrder.value.submissionImage),
)

const isOrderAssigned = computed(() => currentOrder.value?.status === 'ASSIGNED')
const isOrderSubmitted = computed(() => currentOrder.value?.status === 'SUBMITTED')
const isOrderCompleted = computed(() => currentOrder.value?.status === 'COMPLETED')

const currentSubmissionContent = computed(() => currentOrder.value?.submissionContent || '')
const currentSubmissionImage = computed(() => currentOrder.value?.submissionImage || '')

// ========== Timeline 步骤 ==========
const timelineSteps = computed(() => {
  if (!task.value) return []
  const status = task.value.status
  const steps = [
    { key: 'PENDING', label: '发布需求', desc: '发布者发布任务需求' },
    { key: 'ASSIGNED', label: '等待接单', desc: '勇士接取任务' },
    { key: 'SUBMITTED', label: '执行交付', desc: '执行者提交任务成果' },
    { key: 'COMPLETED', label: '确认完成', desc: '发布者验收，赏金结算' },
  ]

  const statusIndex = steps.findIndex((s) => s.key === status)
  if (statusIndex === -1 && status === 'CANCELLED') {
    return steps.map((s) => ({ ...s, status: 'done' as const }))
  }

  return steps.map((s, idx) => {
    if (idx < statusIndex) return { ...s, status: 'done' as const }
    if (idx === statusIndex || steps[Math.min(statusIndex, steps.length - 1)]?.key === s.key) return { ...s, status: 'current' as const }
    return { ...s, status: 'pending' as const }
  })
})

// ========== 托管状态 ==========
const escrowStatusText = computed(() => {
  if (!task.value) return '未知'
  const s = task.value.status
  if (s === 'PENDING') return '待托管'
  if (s === 'ASSIGNED') return '已锁定'
  if (s === 'SUBMITTED') return '已锁定'
  if (s === 'COMPLETED') return '已结算'
  if (s === 'CANCELLED') return '已退回'
  return '未知'
})

const escrowStatusTag = computed(() => {
  const s = task.value?.status
  if (s === 'COMPLETED') return 'success' as const
  if (s === 'CANCELLED') return 'danger' as const
  if (s === 'PENDING') return 'info' as const
  return 'warning' as const
})

// ========== 图片预览 ==========
const previewImage = () => {
  imagePreviewVisible.value = true
}

// ========== 加载数据 ==========
const getTaskIdFromRoute = () => {
  const idParam = route.params.id
  const id = Number(idParam)
  if (!id || Number.isNaN(id)) return null
  return id
}

const loadCurrentUser = async () => {
  try {
    const keys = ['currentUser', 'user', 'userInfo', 'profile', 'current_user']
    for (const k of keys) {
      const cached = localStorage.getItem(k)
      if (cached) {
        currentUser.value = JSON.parse(cached) as UserProfile
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
        return
      }
    }
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

  try {
    const resWorker = await getMyOrderForTask(taskId)
    myOrder.value = (resWorker || null) as OrderItem | null
  } catch {
    myOrder.value = null
  }

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
  // 移动端使用 van-dialog，桌面端使用 ElMessageBox
  if (window.innerWidth <= 768) {
    pendingDeleteSubtask.value = subTask
    showSubtaskDeleteDialog.value = true
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该子任务吗？此操作不可恢复。', '提示', { type: 'warning' })
  } catch {
    return
  }
  doDeleteSubTask(subTask)
}

const confirmDeleteSubTask = async () => {
  const subTask = pendingDeleteSubtask.value
  if (!subTask || !task.value) return
  showSubtaskDeleteDialog.value = false
  pendingDeleteSubtask.value = null
  doDeleteSubTask(subTask)
}

const doDeleteSubTask = async (subTask: SubTask) => {
  if (!task.value) return
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
    await submitTaskResult(currentOrder.value.id, { content, image: submitForm.image || undefined })
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
    await loadOrders()
  } catch (error) {
    console.error('验收失败:', error)
    ElMessage.error('验收失败')
  } finally {
    opLoading.value = false
  }
}

const handleReject = async () => {
  if (!publisherOrder.value) return
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因（会展示给执行者）', '驳回返工', {
      inputType: 'textarea',
      inputPlaceholder: '例如：提交内容与需求不符，请补充说明或补充截图等',
      inputValidator: (val: string) => (val.trim().length > 0 ? true : '驳回原因不能为空'),
    })
    opLoading.value = true
    await completeOrder(publisherOrder.value.id, { isAccepted: false, comment: value.trim() })
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
/* ====== 页面容器 ====== */
.task-detail-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  color: rgba(255, 255, 255, 0.92);
}

/* ====== Hero 头部 ====== */
.task-detail-hero {
  margin-bottom: 28px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.08), rgba(246, 183, 60, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
}

.hero-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: rgba(180, 190, 210, 0.8);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 16px;
  transition: color 0.2s;
}
.hero-back:hover {
  color: #f6b73c;
}
.back-arrow {
  font-size: 16px;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.hero-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.hero-badge.badge-pending {
  background: rgba(124, 92, 255, 0.18);
  color: #a78bfa;
  border: 1px solid rgba(124, 92, 255, 0.25);
}
.hero-badge.badge-assigned {
  background: rgba(246, 183, 60, 0.15);
  color: #f6b73c;
  border: 1px solid rgba(246, 183, 60, 0.25);
}
.hero-badge.badge-submitted {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.22);
}
.hero-badge.badge-completed {
  background: rgba(74, 222, 128, 0.18);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}
.hero-badge.badge-cancelled {
  background: rgba(251, 113, 133, 0.12);
  color: #fb7185;
  border: 1px solid rgba(251, 113, 133, 0.22);
}
.hero-badge.badge-default {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(180, 190, 210, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-id {
  font-size: 13px;
  color: rgba(180, 190, 210, 0.5);
  font-family: 'SF Mono', 'Cascadia Code', monospace;
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 16px;
  line-height: 1.3;
  letter-spacing: 0.2px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}
.hero-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(180, 190, 210, 0.8);
}
.meta-icon {
  font-size: 15px;
}

.hero-price {
  background: linear-gradient(135deg, rgba(246, 183, 60, 0.12), rgba(246, 183, 60, 0.04));
  border: 1px solid rgba(246, 183, 60, 0.18);
  padding: 6px 14px;
  border-radius: 20px;
  margin-left: auto;
}
.price-value {
  font-size: 18px;
  font-weight: 800;
  color: #f6b73c;
}
.price-unit {
  font-size: 13px;
  color: rgba(246, 183, 60, 0.7);
  margin-left: 2px;
}

/* ====== 双栏网格 ====== */
.task-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
}

/* ====== 主内容区 ====== */
.task-detail-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

/* ====== 通用卡片 ====== */
.detail-card {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 22px 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.9);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.card-header-row .card-title {
  margin-bottom: 0;
}

/* ====== 参考图卡片 ====== */
.cover-zoom-btn {
  background: rgba(124, 92, 255, 0.12);
  border: 1px solid rgba(124, 92, 255, 0.2);
  color: #a78bfa;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.cover-zoom-btn:hover {
  background: rgba(124, 92, 255, 0.22);
}

.cover-frame {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.1), rgba(246, 183, 60, 0.05));
}
.cover-frame.no-image {
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.06), rgba(15, 23, 42, 0.4));
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
}
.cover-fallback-icon {
  font-size: 44px;
  opacity: 0.4;
}
.cover-fallback-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(180, 190, 210, 0.6);
}
.cover-fallback-hint {
  font-size: 12px;
  color: rgba(180, 190, 210, 0.35);
}

.preview-full-img {
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 10px;
}

/* ====== 任务说明卡片 ====== */
.desc-content {
  padding: 6px 0;
}
.desc-text {
  white-space: pre-wrap;
  line-height: 1.75;
  color: rgba(200, 210, 230, 0.85);
  font-size: 14.5px;
  margin: 0;
}

.desc-footer {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.desc-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: rgba(180, 190, 210, 0.55);
}
.tip-icon {
  flex-shrink: 0;
  font-size: 14px;
}

/* ====== 子任务卡片 ====== */
.subtask-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c5cff, #4ade80);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.progress-text {
  font-size: 13px;
  font-weight: 700;
  color: #4ade80;
  min-width: 38px;
  text-align: right;
}

.subtask-empty {
  text-align: center;
  padding: 28px 20px 16px;
}
.empty-graphic {
  margin-bottom: 12px;
}
.empty-icon {
  font-size: 40px;
  opacity: 0.35;
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(180, 190, 210, 0.65);
  margin: 0 0 6px;
}
.empty-desc {
  font-size: 13px;
  color: rgba(180, 190, 210, 0.4);
  margin: 0 0 6px;
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
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  margin-bottom: 6px;
  transition: background 0.2s;
  background: rgba(255, 255, 255, 0.02);
}
.subtask-item:hover {
  background: rgba(124, 92, 255, 0.05);
}
.item-done {
  opacity: 0.75;
  background: rgba(74, 222, 128, 0.03);
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
  gap: 10px;
  color: rgba(180, 190, 210, 0.65);
}
.check-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid rgba(180, 190, 210, 0.3);
  flex-shrink: 0;
}
.check-dot.done {
  background: #4ade80;
  border-color: #4ade80;
}
.subtask-done-text {
  text-decoration: line-through;
  color: rgba(180, 190, 210, 0.4);
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
/* 添加子任务按钮 — 手机/桌面切换 */
.add-subtask-btn-mobile {
  display: none;
}
@media (min-width: 901px) {
  .add-subtask-btn-desktop { display: inline-flex !important; }
}
.subtask-input-row {
  border: none;
  background: none;
  padding: 0;
}
.subtask-input-row:hover {
  background: none;
}

/* ====== 需求元信息卡片 ====== */
.meta-grid {
  display: grid;
  gap: 12px;
}
.meta-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.meta-label {
  font-size: 13px;
  color: rgba(180, 190, 210, 0.5);
  min-width: 64px;
  flex-shrink: 0;
}
.meta-val {
  font-size: 13.5px;
  color: rgba(200, 210, 230, 0.8);
}

/* ====== Timeline 卡片 ====== */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.timeline-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  position: relative;
  padding-bottom: 22px;
}
.timeline-step:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  font-size: 12px;
}
.timeline-step.done .timeline-dot {
  background: rgba(74, 222, 128, 0.2);
  border: 2px solid #4ade80;
}
.timeline-step.current .timeline-dot {
  background: rgba(124, 92, 255, 0.25);
  border: 2px solid #7c5cff;
  box-shadow: 0 0 12px rgba(124, 92, 255, 0.3);
}
.timeline-step.pending .timeline-dot {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.dot-inner.done {
  color: #4ade80;
  font-weight: 700;
}
.dot-inner.current {
  width: 8px;
  height: 8px;
  background: #7c5cff;
  border-radius: 50%;
}
.dot-inner.pending {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}

.timeline-info {
  flex: 1;
  min-width: 0;
}
.timeline-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 2px;
}
.timeline-step.pending .timeline-label {
  color: rgba(180, 190, 210, 0.4);
}
.timeline-desc {
  font-size: 12px;
  color: rgba(180, 190, 210, 0.45);
}

.timeline-line {
  position: absolute;
  left: 12px;
  top: 32px;
  width: 2px;
  height: calc(100% - 32px);
  background: rgba(255, 255, 255, 0.06);
}
.timeline-line.filled {
  background: rgba(74, 222, 128, 0.3);
}
.timeline-step:last-child .timeline-line {
  display: none;
}

/* ====== 留言区 ====== */
.comment-card {
  margin-top: 6px;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
  max-height: 240px;
  overflow-y: auto;
}
.comment-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.025);
  border-radius: 10px;
}
.comment-item.mine {
  background: rgba(124, 92, 255, 0.06);
}
.comment-author {
  font-weight: 700;
  color: rgba(180, 190, 210, 0.7);
  flex-shrink: 0;
  min-width: 32px;
}
.comment-text {
  flex: 1;
  color: rgba(200, 210, 230, 0.8);
  word-break: break-word;
}
.comment-time {
  font-size: 11px;
  color: rgba(180, 190, 210, 0.35);
  flex-shrink: 0;
}
.comment-empty {
  text-align: center;
  padding: 14px;
  color: rgba(180, 190, 210, 0.35);
  font-size: 13px;
}
.comment-input {
  display: flex;
  gap: 8px;
}

/* ====== 右侧栏 ====== */
.task-detail-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 84px;
}

.aside-card {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 20px 22px;
}
.aside-card-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 14px;
  color: rgba(255, 255, 255, 0.88);
}

.aside-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13.5px;
}
.aside-label {
  color: rgba(180, 190, 210, 0.6);
}
.aside-val {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}
.aside-val.role-publisher {
  color: #a78bfa;
}
.aside-val.role-worker {
  color: #4ade80;
}

.aside-btn-full {
  width: 100%;
}

/* 赏金托管卡 */
.escrow-amount {
  text-align: center;
  padding: 10px 0 14px;
}
.escrow-number {
  font-size: 32px;
  font-weight: 900;
  color: #f6b73c;
  line-height: 1;
}
.escrow-unit {
  font-size: 14px;
  color: rgba(246, 183, 60, 0.65);
  margin-left: 4px;
}

.escrow-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13.5px;
}

.escrow-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(124, 92, 255, 0.06);
  border-radius: 10px;
  font-size: 12.5px;
  color: rgba(180, 190, 210, 0.55);
}

/* 发布者信用卡 */
.publisher-card-body {
  display: flex;
  align-items: center;
  gap: 12px;
}
.publisher-avatar {
  flex-shrink: 0;
}
.publisher-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.publisher-name {
  font-weight: 700;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
}
.publisher-role {
  font-size: 12px;
  color: rgba(180, 190, 210, 0.45);
}

/* 平台保障卡 */
.safety-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.safety-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: rgba(180, 190, 210, 0.55);
}
.safety-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(124, 92, 255, 0.5);
  margin-top: 6px;
  flex-shrink: 0;
}

/* 提交预览 */
.submission-brief {
  font-size: 13px;
}
.submission-brief-content {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  padding: 10px 12px;
  white-space: pre-wrap;
  line-height: 1.6;
  color: rgba(200, 210, 230, 0.75);
  font-size: 12.5px;
}
.submission-brief-img {
  width: 100%;
  max-height: 180px;
  border-radius: 10px;
  overflow: hidden;
}

/* ====== 工具类 ====== */
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.flex-1 { flex: 1; }
.text-center { text-align: center; }
.action-btn-row {
  display: flex;
  gap: 12px;
}

/* ====== 移动端适配 ====== */
@media (max-width: 900px) {
  .task-detail-page {
    padding: 16px 14px 40px;
  }

  .task-detail-hero {
    padding: 18px 20px;
  }

  .hero-title {
    font-size: 22px;
  }

  .hero-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .hero-price {
    margin-left: 0;
  }

  .task-detail-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .task-detail-aside {
    position: static;
    gap: 12px;
  }

  .cover-frame {
    aspect-ratio: 16 / 10;
  }

  .escrow-number {
    font-size: 26px;
  }

  /* 操作按钮移动端点击区放大 */
  .aside-btn-full,
  .action-btn-row .el-button {
    min-height: 44px;
  }

  /* 评论发送按钮 */
  .comment-input .el-button {
    min-height: 44px;
    padding: 0 18px;
  }

  /* ====== 子任务区移动端调整 ====== */
  /* 子任务操作按钮 — 去重紫色，改为轻量描边 */
  .subtask-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-left: 0;
    margin-top: 6px;
    width: 100%;
  }
  .subtask-actions .el-button {
    font-size: 12px;
    min-height: 36px;
    padding: 0 12px;
  }
  /* 编辑按钮降级为默认 */
  .subtask-actions .el-button:not(.el-button--danger) {
    color: #94a3b8 !important;
    border-color: rgba(148, 163, 184, 0.18) !important;
  }
  /* 删除按钮保留红色描边 */
  .subtask-actions .el-button--danger.is-plain {
    color: #fca5a5 !important;
    border-color: rgba(239, 68, 68, 0.25) !important;
    background: rgba(239, 68, 68, 0.06) !important;
  }

  /* 移动端添加子任务 — 上下布局 */
  .add-subtask-row {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .add-subtask-input {
    width: 100%;
  }
  .add-subtask-btn-desktop {
    display: none !important;
  }
  .add-subtask-btn-mobile {
    display: block !important;
    width: 100%;
    min-height: 44px;
  }

  /* 子任务输入框 */
  .subtask-input .el-input {
    width: 100%;
  }
  .subtask-input .add-subtask-btn-mobile {
    margin-top: 8px;
    width: 100%;
    min-height: 44px;
  }

  /* 子任务列表项 — 每项更清晰 */
  .subtask-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 10px 12px;
  }
  .subtask-main {
    width: 100%;
  }
  .subtask-input-row {
    padding: 10px 0;
  }
}

/* ====== van-dialog 暗色主题适配 ====== */
:deep(.van-dialog-dark) {
  background: #1e293b !important;
}
:deep(.van-dialog-dark .van-dialog__header) {
  color: #f1f5f9 !important;
  font-size: 16px !important;
  padding-top: 20px !important;
}
:deep(.van-dialog-dark .van-dialog__message) {
  color: #e2e8f0 !important;
  font-size: 14px !important;
}
:deep(.van-dialog-dark .van-button--default) {
  background: transparent !important;
  border-top: 1px solid rgba(255,255,255,0.08) !important;
  color: #94a3b8 !important;
  font-size: 15px !important;
  min-height: 48px;
}
:deep(.van-dialog-dark .van-button--primary) {
  background: transparent !important;
  border-top: 1px solid rgba(255,255,255,0.08) !important;
  color: #ef4444 !important;
  font-size: 15px !important;
  min-height: 48px;
}
:deep(.van-dialog-dark .van-button--primary:active) {
  background: rgba(239,68,68,0.08) !important;
}
:deep(.van-dialog-dark .van-button--default:active) {
  background: rgba(255,255,255,0.06) !important;
}
:deep(.van-dialog-dark .van-hairline--top) {
  border-color: rgba(255,255,255,0.08) !important;
}
</style>
