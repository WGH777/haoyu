<template>
  <div class="notification-page">
    <div class="page-header">
      <h2>通知中心</h2>
      <el-button v-if="notifications.length" type="primary" link @click="markAll">
        全部已读
      </el-button>
    </div>

    <el-empty v-if="!notifications.length" description="暂无通知" />

    <div v-else class="notification-list">
      <div
        v-for="n in notifications"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationApi } from '@/api/notification'
import { ElMessage } from 'element-plus'

const router = useRouter()
const notifications = ref<any[]>([])

const tagType = (type: string) => {
  const map: Record<string, string> = {
    SERVICE_COMPLETED: 'success', ORDER_CANCELLED: 'danger', ORDER_DISPUTED: 'warning',
    DISPUTE_RESOLVED: 'success', DEADLINE_WARNING: 'warning', PROVIDER_UNRESPONSIVE: 'danger',
    AUTO_CONFIRMED: 'info', REQUEST_RESPONDED: 'primary', SERVICE_SUBMITTED: 'primary',
    RISK_ALERT: 'danger', PAYMENT_RECEIVED: 'success',
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
  }
  return map[type] || type
}

const formatTime = (t: string) => new Date(t).toLocaleString('zh-CN')

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
  padding: 14px 16px; margin-bottom: 8px; border-radius: 8px; cursor: pointer;
  background: #fff; border: 1px solid #ebeef5; transition: all 0.2s; user-select: none;
}
.notification-item.unread { background: #ecf5ff; border-color: #b3d8ff; }
.notification-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); transform: translateY(-1px); }
.notification-item:active { transform: scale(0.995); }
.notify-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.notify-type { display: flex; align-items: center; gap: 6px; }
.unread-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; }
.notify-time { font-size: 12px; color: #999; }
.notify-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
.notify-content { font-size: 13px; color: #666; line-height: 1.5; }
</style>
