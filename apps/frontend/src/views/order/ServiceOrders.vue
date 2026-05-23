<template>
  <div class="orders-page">
    <h2>我接的订单</h2>

    <el-empty v-if="!orders.length" description="还没有接过订单，去任务大厅逛逛" />

    <div v-else class="order-list">
      <el-card
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        shadow="hover"
      >
        <div class="order-top">
          <div class="task-info">
            <router-link :to="`/task/${order.task.id}`" class="task-title">
              {{ order.task.title }}
            </router-link>
            <div class="task-meta">
              <el-tag :type="statusType(order.status)" size="small">
                {{ statusLabel(order.status) }}
              </el-tag>
              <span>¥ {{ ((order.task.price || 0) / 100).toFixed(2) }}</span>
            </div>
          </div>
          <div class="order-actions" v-if="order.status === 'ASSIGNED'">
            <el-button type="primary" size="small" @click="doStart(order)">
              开始服务
            </el-button>
            <el-button type="success" size="small" @click="showSubmit(order)">
              提交成果
            </el-button>
          </div>
          <div class="order-actions" v-else-if="order.status === 'IN_PROGRESS'">
            <el-tag type="warning" size="small">服务中</el-tag>
            <el-button type="success" size="small" @click="showSubmit(order)">
              提交成果
            </el-button>
          </div>
        </div>
        <div class="order-bottom" v-if="order.status === 'SUBMITTED'">
          <el-tag type="warning" size="small">等待发布者验收</el-tag>
        </div>
      </el-card>
    </div>

    <!-- 提交成果对话框 -->
    <el-dialog v-model="submitVisible" title="提交成果" width="500px">
      <el-form>
        <el-form-item label="成果描述">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            :rows="4"
            placeholder="描述你完成的工作..."
          />
        </el-form-item>
        <el-form-item label="截图（可选）">
          <el-input v-model="submitForm.image" placeholder="图片URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" @click="doSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyOrders, submitTaskResult, startService } from '@/api/order'
import { ElMessage } from 'element-plus'

const orders = ref<any[]>([])
const submitVisible = ref(false)
const submitForm = ref({ content: '', image: '' })
const selectedOrder = ref<any>(null)

const statusType = (s: string) => {
  const map: Record<string, string> = {
    ASSIGNED: 'primary',
    SUBMITTED: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'info',
    DISPUTED: 'danger',
  }
  return map[s] || 'info'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    ASSIGNED: '进行中',
    SUBMITTED: '已提交',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    DISPUTED: '争议中',
  }
  return map[s] || s
}

const showSubmit = (order: any) => {
  selectedOrder.value = order
  submitForm.value = { content: '', image: '' }
  submitVisible.value = true
}

const doStart = async (order: any) => {
  try {
    await startService(order.id)
    ElMessage.success('已开始服务')
    loadOrders()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

const doSubmit = async () => {
  try {
    await submitTaskResult(selectedOrder.value.id, submitForm.value)
    ElMessage.success('提交成功')
    submitVisible.value = false
    loadOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '提交失败')
  }
}

const loadOrders = async () => {
  try {
    const res: any = await getMyOrders()
    orders.value = Array.isArray(res) ? res : res?.data || []
  } catch {
    ElMessage.error('加载订单失败')
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.orders-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.order-card {
  border-radius: 8px;
}
.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-title {
  font-size: 15px;
  font-weight: 600;
  color: #cbd5e1;
  text-decoration: none;
}
.task-title:hover {
  color: #818cf8;
}
.task-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
  font-size: 13px;
  color: #999;
}
.order-bottom {
  margin-top: 10px;
}
</style>
