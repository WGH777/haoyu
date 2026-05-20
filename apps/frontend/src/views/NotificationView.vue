<template>
  <div class="notification-page">
    <div class="page-header">
      <h2>通知中心</h2>
      <el-button v-if="notifications.length" size="small" plain @click="markAll">
        全部已读
      </el-button>
    </div>

    <el-empty v-if="!notifications.length" description="没有新通知，一切安好" />

    <!-- 需行动的通知 — 高亮置顶 -->
    <div v-if="actionItems.length" class="section-label">⚠️ 需要行动</div>
    <div
      v-for="n in actionItems"
      :key="n.id"
      class="notification-item action-required"
      :class="{ unread: !n.readAt }"
      @click="readOne(n)"
    >
      <div class="notify-header">
        <span class="notify-type">
          <el-tag :type="tagType(n.type)" size="small">{{ typeLabel(n.type) }}</el-tag>
          <span v-if="!n.readAt" class="unread-dot"></span>
        </span>
        <span class="notify-time">{{ formatTime(n.createdAt) }}</span>
      </div>
      <div class="notify-title">{{ n.title }}</div>
      <div class="notify-content">{{ n.content }}</div>
    </div>

    <!-- 仅提醒 — 降级展示 -->
    <div v-if="infoItems.length" class="section-label" style="margin-top:20px">ℹ️ 仅通知</div>
    <div
      v-for="n in infoItems"
      :key="n.id"
      class="notification-item"
      :class="{ unread: !n.readAt }"
      @click="readOne(n)"
    >
        <div class="notify-header">
          <span class="notify-type">
            <el-tag :type="tagType(n.type)" size="small">{{ typeLabel(n.type) }}</el-tag>
            <span v-if="!n.readAt" class="unread-dot"></span>
          </span>
          <span class="notify-time">{{ formatTime(n.createdAt) }}</span>
        </div>
        <div class="notify-title">{{ n.title }}</div>
        <div class="notify-content">{{ n.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationApi } from '@/api/notification'
import { ElMessage } from 'element-plus'

const router = useRouter()
const notifications = ref<any[]>([])

// 通知分层
const actionItems = computed(() => notifications.value.filter(n => isActionRequired(n.type)))
const infoItems = computed(() => notifications.value.filter(n => !isActionRequired(n.type)))

// 通知分层：需要行动的类型
const ACTION_TYPES = [
  'DEADLINE_WARNING', 'ORDER_DISPUTED', 'PROVIDER_UNRESPONSIVE',
  'MATCHING_ALERT', 'RISK_ALERT', 'SERVICE_SUBMITTED',
]

const isActionRequired = (type: string) => ACTION_TYPES.includes(type)

const tagType = (type: string) => {
  const map: Record<string, string> = {
    SERVICE_COMPLETED: 'success', ORDER_CANCELLED: 'danger', ORDER_DISPUTED: 'warning',
    DISPUTE_RESOLVED: 'success', DEADLINE_WARNING: 'warning', PROVIDER_UNRESPONSIVE: 'danger',
    AUTO_CONFIRMED: 'info', REQUEST_RESPONDED: 'primary', SERVICE_SUBMITTED: 'primary',
    RISK_ALERT: 'danger', PAYMENT_RECEIVED: 'success', SERVICE_STARTED: 'primary',
    REFUND_CREATED: 'warning', SETTLEMENT_CREATED: 'success', SERVICE_REJECTED: 'danger',
    MATCHING_ALERT: 'warning', NEWBIE_NUDGE: 'info',
  }
  return map[type] || 'info'
}

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    REQUEST_RESPONDED: '已被接单', SERVICE_STARTED: '服务开始', SERVICE_SUBMITTED: '已提交',
    SERVICE_COMPLETED: '已完成', ORDER_DISPUTED: '争议', REFUND_CREATED: '退款',
    SETTLEMENT_CREATED: '结算', RISK_ALERT: '风控', SYSTEM: '系统', PAYMENT_RECEIVED: '支付',
    AUTO_CONFIRMED: '自动确认', ORDER_CANCELLED: '已取消', DISPUTE_RESOLVED: '争议解决',
    DEADLINE_WARNING: '即将超时', PROVIDER_UNRESPONSIVE: '服务者超时',
    MATCHING_ALERT: '匹配提醒', NEWBIE_NUDGE: '新手引导', SERVICE_REJECTED: '验收驳回',
  }
  return map[type] || type
}

const readOne = async (n: any) => {
  if (n.readAt) return
  try {
    await notificationApi.markRead(n.id)
    n.readAt = new Date().toISOString()
    // 更新全局未读数
    window.dispatchEvent(new CustomEvent('notification-read'))
  } catch { ElMessage.error('标记失败') }
}

const markAll = async () => {
  try {
    await notificationApi.markAllRead()
    notifications.value.forEach(n => { n.readAt = n.readAt || new Date().toISOString() })
    window.dispatchEvent(new CustomEvent('notification-read'))
    ElMessage.success('已全部标记已读')
  } catch { ElMessage.error('操作失败') }
}

onMounted(async () => {
  try {
    const res: any = await notificationApi.list()
    notifications.value = Array.isArray(res) ? res : res?.data || []
  } catch { ElMessage.error('加载通知失败') }
})
</script>

<style scoped>
.notification-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; font-weight: 700; }
.notification-item {
  padding: 14px 16px; margin-bottom: 8px; border-radius: 10px; cursor: pointer;
  background: rgba(17, 24, 39, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: all 0.2s; user-select: none;
}
.notification-item.unread {
  background: rgba(99, 102, 241, 0.06);
  border-color: rgba(99, 102, 241, 0.15);
}
.notification-item:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.3); transform: translateY(-1px); }
.notification-item:active { transform: scale(0.995); }
.notify-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.notify-type { display: flex; align-items: center; gap: 6px; }
.unread-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; }
.notify-time { font-size: 12px; color: #64748b; }
.notify-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; color: #f1f5f9; }
.notify-content { font-size: 13px; color: #94a3b8; line-height: 1.5; }

.section-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #f59e0b;
  margin-bottom: 10px;
  padding-left: 2px;
}
.notification-item.action-required {
  border-left: 3px solid #f59e0b;
  padding-left: 14px;
}

@media (max-width: 768px) {
  .notification-page { padding: 12px !important; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .section-label { font-size: 11px; }
}
</style>
