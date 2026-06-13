<template>
  <div class="admin-page">
    <section class="admin-hero">
      <div>
        <p class="eyebrow">HaoYu Admin Console</p>
        <h2>浩煜管理中枢</h2>
        <p class="hero-copy">聚合订单履约、争议仲裁与用户治理，让每一次协作都有清晰的风险处置路径。</p>
      </div>
      <div class="hero-badge">
        <span>风险治理</span>
        <strong>{{ disputes.filter(d=>['OPEN','UNDER_REVIEW'].includes(d.status)).length }}</strong>
        <small>待处理争议</small>
      </div>
    </section>

    <div class="stats-row" v-if="orders.length">
      <div class="stat-card gold">
        <span class="stat-num">{{ orders.length }}</span>
        <span class="stat-label">总订单</span>
      </div>
      <div class="stat-card green">
        <span class="stat-num">{{ orders.filter(o=>o.status==='COMPLETED').length }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-card amber">
        <span class="stat-num">{{ orders.filter(o=>['ASSIGNED','SUBMITTED'].includes(o.status)).length }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-card red">
        <span class="stat-num">{{ disputes.filter(d=>['OPEN','UNDER_REVIEW'].includes(d.status)).length }}</span>
        <span class="stat-label">待处理争议</span>
      </div>
      <div class="stat-card purple">
        <span class="stat-num">¥{{ totalVolume }}</span>
        <span class="stat-label">交易总额</span>
      </div>
    </div>

    <section class="admin-panel">
      <el-tabs v-model="activeTab" class="admin-tabs">
        <el-tab-pane label="订单管理" name="orders">
          <div class="section-head">
            <div>
              <h3>订单履约监控</h3>
              <p>仅展示当前订单状态与必要的后台干预入口。</p>
            </div>
          </div>

          <el-table :data="orders" stripe class="admin-table">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="task.title" label="任务" min-width="160" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="orderTag(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }">
                ¥{{ ((row.task?.price || 0) / 100).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="更新时间" width="180">
              <template #default="{ row }">
                {{ row.updatedAt ? formatTime(row.updatedAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="{ row }">
                <div class="action-row">
                  <el-button
                    v-if="['ASSIGNED','SUBMITTED'].includes(row.status)"
                    size="small"
                    type="success"
                    @click="forceComplete(row)"
                  >强制结算</el-button>
                  <el-button
                    v-if="['ASSIGNED','SUBMITTED'].includes(row.status)"
                    size="small"
                    type="danger"
                    @click="forceCancel(row)"
                  >强制取消</el-button>
                  <span v-if="!['ASSIGNED','SUBMITTED'].includes(row.status)" class="muted">无需处理</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="争议列表" name="disputes">
          <div class="section-head">
            <div>
              <h3>争议仲裁队列</h3>
              <p>只在开放或复核中的争议上展示处置按钮。</p>
            </div>
          </div>

          <el-table :data="disputes" stripe class="admin-table">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="order.task.title" label="订单" min-width="160" />
            <el-table-column prop="reason" label="原因" min-width="180" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="disputeTag(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" v-if="activeTab === 'disputes'">
              <template #default="{ row }">
                <div class="action-row">
                  <template v-if="['OPEN','UNDER_REVIEW'].includes(row.status)">
                    <el-button size="small" type="success" @click="resolveDispute(row, 'PAY_SELLER')">付款</el-button>
                    <el-button size="small" type="warning" @click="resolveDispute(row, 'REFUND_BUYER')">退款</el-button>
                    <el-button size="small" type="danger" @click="resolveDispute(row, 'CANCEL_ORDER')">取消订单</el-button>
                  </template>
                  <span v-else class="muted">已处理</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="用户管理" name="users">
          <div class="user-entry-card">
            <span class="entry-icon">用户</span>
            <div>
              <h3>用户管理入口</h3>
              <p class="hint">用户管理功能请使用左侧菜单“用户管理”入口，避免在订单治理页混合高风险操作。</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="fcVisible" title="强制结算" width="420px" class="admin-action-dialog">
      <p class="dialog-tip">请记录本次后台干预原因，便于后续审计追踪。</p>
      <el-input v-model="fcReason" placeholder="操作原因（必填）" />
      <template #footer>
        <el-button @click="fcVisible = false">取消</el-button>
        <el-button type="primary" @click="doForceComplete">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAdminOrders, forceCompleteOrder } from '@/api/admin'
import { disputeApi } from '@/api/dispute'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('orders')
const orders = ref<any[]>([])
const disputes = ref<any[]>([])

const totalVolume = computed(() => {
  const total = orders.value
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.task?.price || 0), 0)
  return (total / 100).toFixed(2)
})
const fcVisible = ref(false)
const fcReason = ref('')
const selectedOrder = ref<any>(null)

const orderTag = (s: string) => {
  const m: Record<string, string> = { ASSIGNED: 'primary', SUBMITTED: 'warning', COMPLETED: 'success', CANCELLED: 'info', DISPUTED: 'danger' }
  return m[s] || 'info'
}

const disputeTag = (s: string) => {
  const m: Record<string, string> = { OPEN: 'danger', UNDER_REVIEW: 'warning', RESOLVED: 'success', REJECTED: 'info', CANCELLED: 'info' }
  return m[s] || 'info'
}

const formatTime = (t: string) => new Date(t).toLocaleString('zh-CN')

const forceComplete = (row: any) => {
  selectedOrder.value = row
  fcReason.value = ''
  fcVisible.value = true
}

const doForceComplete = async () => {
  if (!fcReason.value.trim()) { ElMessage.warning('请填写操作原因'); return }
  try {
    await forceCompleteOrder(selectedOrder.value.id, fcReason.value)
    ElMessage.success('已强制结算')
    fcVisible.value = false
    loadOrders()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

const forceCancel = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '强制取消', { type: 'warning' })
    // Import forceCancelTask from admin api
    const { forceCancelTask } = await import('@/api/admin')
    await forceCancelTask(row.taskId, value)
    ElMessage.success('已强制取消')
    loadOrders()
  } catch { /* cancel */ }
}

const resolveDispute = async (row: any, result: string) => {
  try {
    await disputeApi.resolve(row.id, result)
    ElMessage.success('争议已处理')
    loadDisputes()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

const loadOrders = async () => {
  try {
    const res: any = await getAdminOrders()
    orders.value = Array.isArray(res) ? res : res?.data || []
  } catch { orders.value = [] }
}

const loadDisputes = async () => {
  try {
    const res: any = await disputeApi.findAll()
    disputes.value = Array.isArray(res) ? res : res?.data || []
  } catch { disputes.value = [] }
}

onMounted(() => { loadOrders(); loadDisputes() })
</script>

<style scoped>
.admin-page {
  position: relative;
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px;
  color: #f8efd9;
}

.admin-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 16% 18%, rgba(242, 179, 77, 0.14), transparent 30%),
    radial-gradient(circle at 82% 8%, rgba(120, 86, 52, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(5, 10, 20, 0.96), rgba(9, 15, 29, 0.94));
}

.admin-hero,
.admin-panel,
.user-entry-card {
  border: 1px solid rgba(255, 214, 145, 0.18);
  background: linear-gradient(145deg, rgba(8, 14, 28, 0.9), rgba(13, 23, 42, 0.78));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 232, 174, 0.08);
  backdrop-filter: blur(18px);
}

.admin-hero {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24px;
  padding: 30px;
  border-radius: 18px;
  overflow: hidden;
}

.admin-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.45;
  background-image:
    linear-gradient(rgba(255, 214, 145, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 214, 145, 0.06) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(120deg, transparent, #000 24%, transparent 74%);
}

.eyebrow {
  margin: 0 0 10px;
  color: #f2b34d;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.admin-hero h2 {
  margin: 0;
  font-size: 32px;
  line-height: 1.2;
  color: #ffe8ae;
}

.hero-copy {
  max-width: 620px;
  margin: 12px 0 0;
  color: #aebbd2;
  line-height: 1.8;
}

.hero-badge {
  min-width: 150px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(191, 83, 72, 0.32);
  background: rgba(76, 29, 25, 0.26);
  text-align: center;
}

.hero-badge span,
.hero-badge small {
  display: block;
  color: #c7d2e4;
  font-size: 12px;
}

.hero-badge strong {
  display: block;
  margin: 8px 0;
  color: #ffcf8a;
  font-size: 34px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0;
}

.stat-card {
  min-height: 100px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(255, 214, 145, 0.14);
  background: rgba(9, 16, 31, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 232, 174, 0.06);
}

.stat-card.gold { border-color: rgba(255, 214, 145, 0.28); }
.stat-card.green { border-color: rgba(71, 196, 157, 0.3); background: rgba(19, 78, 74, 0.16); }
.stat-card.amber { border-color: rgba(245, 158, 11, 0.3); background: rgba(120, 74, 22, 0.16); }
.stat-card.red { border-color: rgba(191, 83, 72, 0.32); background: rgba(76, 29, 25, 0.18); }
.stat-card.purple { border-color: rgba(178, 142, 255, 0.26); background: rgba(65, 48, 112, 0.16); }

.stat-num {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: #ffe8ae;
}

.stat-label {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #9fb0c8;
}

.admin-panel {
  padding: 24px;
  border-radius: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 6px 0 18px;
}

.section-head h3,
.user-entry-card h3 {
  margin: 0 0 6px;
  color: #ffe8ae;
  font-size: 20px;
}

.section-head p,
.hint {
  margin: 0;
  color: #8fa3bf;
  line-height: 1.7;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.muted {
  color: #8091aa;
  font-size: 13px;
}

.user-entry-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 28px;
  border-radius: 16px;
}

.entry-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: 1px solid rgba(255, 214, 145, 0.28);
  background: rgba(242, 179, 77, 0.13);
  color: #ffe8ae;
  font-weight: 700;
}

.dialog-tip {
  margin: 0 0 12px;
  color: #9fb0c8;
}

:deep(.admin-tabs .el-tabs__nav-wrap::after) {
  background: rgba(255, 214, 145, 0.12);
}

:deep(.admin-tabs .el-tabs__item) {
  color: #8fa3bf;
  font-weight: 700;
}

:deep(.admin-tabs .el-tabs__item.is-active) {
  color: #ffe8ae;
}

:deep(.admin-tabs .el-tabs__active-bar) {
  background: linear-gradient(90deg, #ffe8ae, #f2b34d);
}

:deep(.admin-table) {
  --el-table-border-color: rgba(255, 214, 145, 0.12);
  --el-table-header-bg-color: rgba(255, 214, 145, 0.08);
  --el-table-tr-bg-color: rgba(8, 14, 28, 0.58);
  --el-table-row-hover-bg-color: rgba(255, 214, 145, 0.08);
  --el-table-text-color: #d8e1ee;
  --el-table-header-text-color: #ffe8ae;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(8, 14, 28, 0.65);
  border: 1px solid rgba(255, 214, 145, 0.12);
}

:deep(.admin-table .el-table__inner-wrapper::before),
:deep(.admin-table .el-table__border-left-patch) {
  background: rgba(255, 214, 145, 0.12);
}

:deep(.admin-table th.el-table__cell),
:deep(.admin-table tr),
:deep(.admin-table td.el-table__cell) {
  background: transparent;
}

:deep(.el-tag) {
  border-radius: 999px;
  background: rgba(255, 214, 145, 0.1);
  border-color: rgba(255, 214, 145, 0.18);
}

:deep(.el-button) {
  border-radius: 999px;
  border-color: rgba(255, 214, 145, 0.22);
  background: rgba(8, 14, 28, 0.72);
  color: #ffe8ae;
}

:deep(.el-button--primary),
:deep(.el-button--success) {
  border: none;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  color: #1d1406;
  box-shadow: 0 12px 28px rgba(242, 179, 77, 0.22);
}

:deep(.el-button--warning) {
  border-color: rgba(245, 158, 11, 0.36);
  background: rgba(120, 74, 22, 0.22);
  color: #ffd08a;
}

:deep(.el-button--danger) {
  border-color: rgba(191, 83, 72, 0.42);
  background: rgba(96, 33, 29, 0.28);
  color: #ffb3a8;
}

:deep(.admin-action-dialog) {
  border-radius: 18px;
  border: 1px solid rgba(255, 214, 145, 0.2);
  background: linear-gradient(145deg, rgba(8, 14, 28, 0.96), rgba(13, 23, 42, 0.94));
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 232, 174, 0.08);
}

:deep(.admin-action-dialog .el-dialog__title) {
  color: #ffe8ae;
  font-weight: 800;
}

:deep(.admin-action-dialog .el-dialog__body),
:deep(.admin-action-dialog .el-dialog__footer) {
  color: #d8e1ee;
}

:deep(.admin-action-dialog .el-input__wrapper) {
  border-radius: 12px;
  border: 1px solid rgba(255, 214, 145, 0.16);
  background: rgba(4, 10, 20, 0.72);
  box-shadow: none;
}

:deep(.admin-action-dialog .el-input__inner) {
  color: #f8efd9;
}

@media (max-width: 900px) {
  .admin-page { padding: 18px; }
  .admin-hero { flex-direction: column; }
  .admin-panel { padding: 16px; overflow-x: auto; }
  .stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
