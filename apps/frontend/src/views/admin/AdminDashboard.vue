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
        <span class="stat-num">{{ totalVolume }}</span>
        <span class="stat-label">交易总额（煜米）</span>
      </div>
    </div>

    <div style="margin-bottom:16px">
      <el-button type="warning" size="small" @click="creditVisible = true">💳 用户充值</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="概览" name="overview">
        <div v-if="dashboardData" class="overview-grid">
          <div class="ov-card"><span class="ov-num">{{ dashboardData.totalTasks }}</span><span class="ov-label">总任务</span></div>
          <div class="ov-card"><span class="ov-num">{{ dashboardData.totalOrders }}</span><span class="ov-label">总订单</span></div>
          <div class="ov-card"><span class="ov-num">{{ dashboardData.totalUsers }}</span><span class="ov-label">总用户</span></div>
          <div class="ov-card"><span class="ov-num">{{ (dashboardData.totalVolume/100).toFixed(0) }} 煜米</span><span class="ov-label">交易总额（煜米）</span></div>
        </div>
        <div v-if="dashboardData?.taskByCategory?.length" style="margin-top:20px">
          <h4 style="color:#94a3b8;margin-bottom:8px">任务分类分布</h4>
          <el-tag v-for="c in dashboardData.taskByCategory" :key="c.category" style="margin:4px" type="primary">{{ c.category }}: {{ c._count }}</el-tag>
        </div>
      </el-tab-pane>
      <el-tab-pane label="订单管理" name="orders">
        <el-table :data="orders" stripe>
          <el-table-column prop="id" label="订单ID" width="70" />
          <el-table-column prop="task.title" label="任务" min-width="140" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="orderTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="煜米" width="100">
            <template #default="{ row }">
              {{ ((row.task?.price || 0) / 100).toFixed(2) }} 煜米
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

      <el-tab-pane label="操作审计" name="audit">
        <el-table :data="auditLogs" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="操作" min-width="140">
            <template #default="{ row }">{{ row.action }}</template>
          </el-table-column>
          <el-table-column prop="operatorId" label="操作人ID" width="100" />
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="detail" label="详情" min-width="200" />
        </el-table>
        <el-empty v-if="!auditLogs.length" description="暂无审计记录" />
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

    <!-- 钱包充值弹窗 -->
    <el-dialog v-model="creditVisible" title="用户钱包充值" width="400px">
      <el-form label-position="top">
        <el-form-item label="用户ID">
          <el-input-number v-model="creditForm.userId" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="充值金额（煜米）">
          <el-input-number v-model="creditForm.amount" :min="1" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="creditVisible = false">取消</el-button>
        <el-button type="primary" @click="doCredit" :loading="crediting">确认充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { getAdminOrders, forceCompleteOrder } from '@/api/admin'
import http from '@/api/http'
import { disputeApi } from '@/api/dispute'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('overview')
const orders = ref<any[]>([])
const disputes = ref<any[]>([])
const auditLogs = ref<any[]>([])
const dashboardData = ref<any>(null)

const totalVolume = computed(() => {
  const total = orders.value
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.task?.price || 0), 0)
  return (total / 100).toFixed(2)
})
const fcVisible = ref(false)
const fcReason = ref('')
const selectedOrder = ref<any>(null)
const creditVisible = ref(false)
const crediting = ref(false)
const creditForm = reactive({ userId: 1, amount: 100 })

const orderTag = (s: string) => {
  const m: Record<string, string> = { ASSIGNED: 'primary', SUBMITTED: 'warning', COMPLETED: 'success', CANCELLED: 'info', DISPUTED: 'danger' }
  return m[s] || 'info'
}

const disputeTag = (s: string) => {
  const m: Record<string, string> = { OPEN: 'danger', UNDER_REVIEW: 'warning', RESOLVED: 'success', REJECTED: 'info', CANCELLED: 'info' }
  return m[s] || 'info'
}

const formatTime = (t: string) => new Date(t).toLocaleString('zh-CN')

const fetchAuditLogs = async () => {
  try { const r: any = await http.get('/admin/audit-logs'); auditLogs.value = r.data || r || [] }
  catch { auditLogs.value = [] }
}

const fetchDashboard = async () => {
  try { const r: any = await http.get('/admin/dashboard'); dashboardData.value = r.data || r }
  catch {}
}

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

const doCredit = async () => {
  crediting.value = true
  try {
    await http.post('/admin/credit', { userId: creditForm.userId, amount: Math.round(creditForm.amount * 100) })
    ElMessage.success('充值成功'); creditVisible.value = false
  } catch { ElMessage.error('充值失败') }
  finally { crediting.value = false }
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

onMounted(() => { loadOrders(); loadDisputes(); fetchAuditLogs(); fetchDashboard() })
</script>

<style scoped>
.admin-page { max-width: 1100px; margin: 0 auto; padding: 20px; }
.admin-page h2 { margin-bottom: 16px; }

.stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
.stat-card {
  flex: 1; padding: 16px; border-radius: 10px;
  background: rgba(17, 24, 39, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.12);
  text-align: center;
}
.stat-card.green { border-color: rgba(16, 185, 129, 0.25); background: rgba(16, 185, 129, 0.06); }
.stat-card.orange { border-color: rgba(245, 158, 11, 0.25); background: rgba(245, 158, 11, 0.06); }
.stat-card.red { border-color: rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.06); }
.stat-card.purple { border-color: rgba(99, 102, 241, 0.25); background: rgba(99, 102, 241, 0.06); }
.stat-num { display: block; font-size: 24px; font-weight: 700; color: #f1f5f9; }
.stat-label { display: block; font-size: 12px; color: #94a3b8; margin-top: 4px; }

.overview-grid { display: flex; gap: 16px; flex-wrap: wrap; }
.ov-card { flex:1; min-width:120px; padding:16px; border-radius:10px; background:rgba(17,24,39,0.45); border:1px solid rgba(148,163,184,0.12); text-align:center; }
.ov-num { display:block; font-size:24px; font-weight:700; color:#f1f5f9; }
.ov-label { font-size:12px; color:#94a3b8; }
</style>
