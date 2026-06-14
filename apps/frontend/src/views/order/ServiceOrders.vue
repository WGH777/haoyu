<template>
  <div class="orders-page">
    <section class="orders-hero">
      <div>
        <span class="eyebrow">ORDER WORKSPACE</span>
        <h2>我接的订单</h2>
        <p>协作交付、成果提交与验收结算集中在这里推进，每一笔订单都留有清晰路径。</p>
      </div>
      <div class="hero-steps" aria-label="订单协作流程">
        <span>协作交付</span>
        <span>成果提交</span>
        <span>验收结算</span>
      </div>
    </section>

    <section v-if="!orders.length" class="orders-empty">
      <div class="empty-orb"></div>
      <h3>还没有接过订单</h3>
      <p>去任务大厅看看合适的协作需求，接单后会在这里跟踪交付进度。</p>
    </section>

    <div v-else class="order-list">
      <el-card
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        shadow="hover"
      >
        <div class="order-top">
          <div class="task-info">
            <span class="order-kicker">协作订单 #{{ order.id }}</span>
            <router-link :to="`/task/${order.task.id}`" class="task-title">
              {{ order.task.title }}
            </router-link>
            <div class="task-meta">
              <el-tag :type="statusType(order.status)" size="small">
                {{ statusLabel(order.status) }}
              </el-tag>
              <span>¥{{ ((order.task.price || 0) / 100).toFixed(2) }}</span>
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
    <el-dialog v-model="submitVisible" title="提交成果" width="500px" class="order-submit-dialog">
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
  max-width: 1120px;
  margin: 0 auto;
  padding: 42px 24px 56px;
  color: #fff7df;
}

.orders-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 22px;
  padding: 30px;
  overflow: hidden;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 24px;
  background:
    radial-gradient(circle at 15% 0%, rgba(242, 179, 77, .22), transparent 34%),
    linear-gradient(135deg, rgba(8, 14, 28, .94), rgba(6, 12, 24, .82));
  box-shadow: 0 22px 48px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255, 255, 255, .06);
}

.orders-hero::after {
  content: "";
  position: absolute;
  right: -70px;
  top: -90px;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 214, 145, .18), transparent 66%);
  pointer-events: none;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  color: #ffd891;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.orders-hero h2 {
  margin: 0;
  font-size: 32px;
  line-height: 1.15;
  color: #fff2c7;
}

.orders-hero p {
  max-width: 560px;
  margin: 12px 0 0;
  color: rgba(214, 224, 239, .72);
  font-size: 14px;
  line-height: 1.8;
}

.hero-steps {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.hero-steps span {
  padding: 9px 13px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 999px;
  color: #ffe8ae;
  background: rgba(255, 255, 255, .05);
}

.orders-empty {
  min-height: 300px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 46px 24px;
  border: 1px dashed rgba(255, 214, 145, .18);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(8, 14, 28, .78), rgba(6, 12, 24, .58));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04);
}

.empty-orb {
  width: 76px;
  height: 76px;
  margin-bottom: 18px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 22px;
  background:
    radial-gradient(circle at 50% 50%, #ffd891 0 18%, rgba(255, 216, 145, .22) 19% 38%, transparent 39%),
    rgba(255, 255, 255, .05);
  box-shadow: 0 18px 44px rgba(242, 179, 77, .18);
}

.orders-empty h3 {
  margin: 0 0 10px;
  color: #fff2c7;
  font-size: 20px;
}

.orders-empty p {
  max-width: 420px;
  margin: 0;
  color: rgba(214, 224, 239, .68);
  line-height: 1.7;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.order-card {
  border: 1px solid rgba(255, 214, 145, .14);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(12, 20, 34, .88), rgba(8, 14, 28, .78));
  box-shadow: 0 18px 40px rgba(0, 0, 0, .26), inset 0 1px 0 rgba(255, 255, 255, .05);
}

.order-card :deep(.el-card__body) {
  padding: 20px;
}
.order-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.task-info {
  min-width: 0;
}

.order-kicker {
  display: inline-block;
  margin-bottom: 8px;
  color: rgba(255, 216, 145, .72);
  font-size: 12px;
  font-weight: 700;
}
.task-title {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: #fff7df;
  font-size: 18px;
  font-weight: 800;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-title:hover {
  color: #ffd891;
}
.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  font-size: 13px;
  color: rgba(214, 224, 239, .68);
}

.task-meta span:last-child {
  color: #ffe8ae;
  font-weight: 800;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  min-width: 210px;
}
.order-bottom {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, .08);
}

.orders-page :deep(.el-card) {
  --el-card-bg-color: transparent;
  --el-card-border-color: transparent;
}

.orders-page :deep(.el-tag) {
  border-color: rgba(255, 214, 145, .2);
  border-radius: 999px;
  background: rgba(255, 214, 145, .1);
  color: #ffe8ae;
}

.orders-page :deep(.el-button) {
  min-height: 34px;
  border-radius: 999px;
  font-weight: 800;
}

.orders-page :deep(.el-button--primary),
.orders-page :deep(.el-button--success) {
  border: 0;
  color: #1a1206;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  box-shadow: 0 12px 24px rgba(242, 179, 77, .22);
}

.orders-page :deep(.el-button--default) {
  border-color: rgba(255, 214, 145, .18);
  color: #ffe8ae;
  background: rgba(255, 255, 255, .05);
}

:global(.order-submit-dialog.el-dialog) {
  overflow: hidden;
  border: 1px solid rgba(255, 214, 145, .22);
  border-radius: 22px;
  background:
    radial-gradient(circle at 18% 0%, rgba(242, 179, 77, .18), transparent 36%),
    rgba(8, 14, 28, .96);
  box-shadow: 0 28px 70px rgba(0, 0, 0, .48), inset 0 1px 0 rgba(255, 255, 255, .06);
}

:global(.order-submit-dialog .el-dialog__title) {
  color: #ffe8ae;
  font-weight: 900;
}

:global(.order-submit-dialog .el-dialog__body) {
  color: rgba(214, 224, 239, .78);
}

:global(.order-submit-dialog .el-form-item__label) {
  color: #fff2c7;
}

:global(.order-submit-dialog .el-textarea__inner),
:global(.order-submit-dialog .el-input__wrapper) {
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 14px;
  background: rgba(4, 10, 20, .62);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04);
}

:global(.order-submit-dialog .el-textarea__inner),
:global(.order-submit-dialog .el-input__inner) {
  color: #fff7df;
}

:global(.order-submit-dialog .el-textarea__inner::placeholder),
:global(.order-submit-dialog .el-input__inner::placeholder) {
  color: rgba(148, 163, 184, .78);
}

:global(.order-submit-dialog .el-dialog__footer .el-button) {
  min-height: 38px;
  border-radius: 999px;
  font-weight: 800;
}

:global(.order-submit-dialog .el-dialog__footer .el-button--primary) {
  border: 0;
  color: #1a1206;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
}

@media (max-width: 900px) {
  .orders-page {
    padding: 24px 14px 44px;
  }

  .orders-hero,
  .order-top {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-steps,
  .order-actions {
    justify-content: flex-start;
  }

  .task-title {
    white-space: normal;
  }
}
</style>
