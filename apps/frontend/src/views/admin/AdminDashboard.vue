<template>
  <div class="admin-page">
    <h2>管理后台</h2>

    <!-- 统计面板 -->
    <div class="stats-row" v-if="orders.length">
      <div class="stat-card">
        <span class="stat-num">{{ orders.length }}</span>
        <span class="stat-label">总订单</span>
      </div>
      <div class="stat-card green">
        <span class="stat-num">{{ orders.filter(o=>o.status==='COMPLETED').length }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-card orange">
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

    <el-tabs v-model="activeTab">
      <el-tab-pane label="订单管理" name="orders">
        <el-table :data="orders" stripe>
          <el-table-column prop="id" label="订单ID" width="70" />
          <el-table-column prop="task.title" label="任务" min-width="140" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="orderTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="100">
            <template #default="{ row }">
              ¥{{ ((row.task?.price || 0) / 100).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
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
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="争议列表" name="disputes">
        <el-table :data="disputes" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="order.task.title" label="订单" min-width="140" />
          <el-table-column prop="reason" label="原因" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="disputeTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" v-if="activeTab === 'disputes'">
            <template #default="{ row }">
              <template v-if="['OPEN','UNDER_REVIEW'].includes(row.status)">
                <el-button size="small" type="success" @click="resolveDispute(row, 'PAY_SELLER')">付款</el-button>
                <el-button size="small" type="warning" @click="resolveDispute(row, 'REFUND_BUYER')">退款</el-button>
                <el-button size="small" type="danger" @click="resolveDispute(row, 'CANCEL_ORDER')">取消订单</el-button>
              </template>
              <span v-else>已处理</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="用户管理" name="users">
        <p class="hint">用户管理功能请使用左侧菜单「用户管理」入口</p>
      </el-tab-pane>
    </el-tabs>

    <!-- 强制结算弹窗 -->
    <el-dialog v-model="fcVisible" title="强制结算" width="400px">
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
.admin-page { max-width: 1100px; margin: 0 auto; padding: 20px; }
.admin-page h2 { margin-bottom: 16px; }

.stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
.stat-card {
  flex: 1; padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #e2e8f0;
  text-align: center;
}
.stat-card.green { border-color: #bbf7d0; background: #f0fdf4; }
.stat-card.orange { border-color: #fde68a; background: #fffbeb; }
.stat-card.red { border-color: #fecaca; background: #fef2f2; }
.stat-card.purple { border-color: #ddd6fe; background: #f5f3ff; }
.stat-num { display: block; font-size: 24px; font-weight: 700; color: #1e293b; }
.stat-label { display: block; font-size: 12px; color: #94a3b8; margin-top: 4px; }
</style>
