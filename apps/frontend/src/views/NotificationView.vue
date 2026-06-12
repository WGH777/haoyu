<template>
  <div class="notification-page">
    <section class="notification-hero">
      <div>
        <span>Notification Center</span>
        <h2>通知中心</h2>
        <p>任务状态、验收结算、争议处理与系统提醒会在这里汇总。</p>
      </div>
      <div class="header-actions">
        <el-button v-if="notifications.length && unreadCount" type="primary" size="small" round @click="markAll">
          全部已读 ({{ unreadCount }})
        </el-button>
        <el-button size="small" :type="showAll ? 'default' : 'primary'" round @click="showAll = !showAll">
          {{ showAll ? '仅未读' : '全部' }}
        </el-button>
      </div>
    </section>

    <div v-if="!filteredNotifications.length" class="notification-empty">
      <div class="empty-signal"><span></span></div>
      <strong>没有新通知，一切安好</strong>
      <p>当任务被接单、成果提交、验收结算或争议处理时，会在这里留下清晰记录。</p>
    </div>

    <div v-else class="notification-list">
      <div
        v-for="n in filteredNotifications"
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
import { ref, onMounted, computed } from 'vue'
import { notificationApi } from '@/api/notification'
import { ElMessage } from 'element-plus'

const notifications = ref<any[]>([])
const showAll = ref(false)

const filteredNotifications = computed(() => {
  if (showAll.value) return notifications.value
  return notifications.value.filter((n: any) => !n.readAt)
})

const unreadCount = computed(() =>
  notifications.value.filter((n: any) => !n.readAt).length
)

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
.notification-page {
  position: relative;
  max-width: 1040px;
  min-height: 620px;
  margin: 0 auto;
  padding: 28px;
  color: #fff2d6;
  overflow: hidden;
}

.notification-page::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 28px;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 214, 145, .14), transparent 24%),
    radial-gradient(circle at 78% 12%, rgba(124, 101, 216, .16), transparent 24%),
    radial-gradient(circle at 50% 84%, rgba(80, 120, 165, .12), transparent 30%),
    linear-gradient(180deg, rgba(5, 10, 20, .80), rgba(5, 10, 20, .96));
}

.notification-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  padding: 30px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 24px;
  background: linear-gradient(120deg, rgba(8, 14, 28, .84), rgba(12, 18, 36, .62));
  box-shadow: 0 22px 54px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.06);
}

.notification-hero span {
  color: #ffd073;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.notification-hero h2 {
  margin: 8px 0 10px;
  color: #ffe8ae;
  font-size: 34px;
}

.notification-hero p {
  max-width: 540px;
  margin: 0;
  color: rgba(255, 232, 196, .64);
  line-height: 1.8;
}

.header-actions { display: flex; gap: 10px; }

:deep(.notification-page .el-button) {
  border-color: rgba(255, 214, 145, .22);
  border-radius: 999px;
  background: rgba(255,255,255,.055);
  color: #ffe8ae;
}

:deep(.notification-page .el-button--primary) {
  border: 0;
  color: #251504;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d) !important;
}

.notification-empty {
  min-height: 340px;
  display: grid;
  place-items: center;
  text-align: center;
  margin-top: 22px;
  padding: 42px;
  border: 1px dashed rgba(255, 214, 145, .18);
  border-radius: 24px;
  background: rgba(4, 9, 17, .36);
}

.empty-signal {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  border-radius: 30px;
  border: 1px solid rgba(255, 214, 145, .22);
  background: radial-gradient(circle, rgba(255, 214, 145, .18), rgba(255,255,255,.035));
  box-shadow: 0 18px 40px rgba(242,179,77,.10);
}

.empty-signal span {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  box-shadow: 0 0 0 14px rgba(255, 214, 145, .08), 0 0 32px rgba(242,179,77,.22);
}

.notification-empty strong { color: #fff7dd; font-size: 18px; }
.notification-empty p { max-width: 430px; margin: 0; color: rgba(255,232,196,.58); line-height: 1.7; }

.notification-list { display: grid; gap: 10px; margin-top: 22px; }
.notification-item { padding: 16px; border: 1px solid rgba(255, 214, 145, .13); border-radius: 16px; cursor: pointer; background: rgba(255,255,255,.035); transition: all .18s ease; }
.notification-item.unread { border-color: rgba(255, 214, 145, .30); background: rgba(242, 179, 77, .08); }
.notification-item:hover { box-shadow: 0 12px 28px rgba(0,0,0,.26); transform: translateY(-1px); }
.notify-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.notify-type { display: flex; align-items: center; gap: 8px; }
.unread-dot { width: 7px; height: 7px; background: #f2b34d; border-radius: 50%; box-shadow: 0 0 14px rgba(242,179,77,.6); }
.notify-time { font-size: 12px; color: rgba(166, 183, 207, .58); }
.notify-title { font-weight: 800; font-size: 16px; margin-bottom: 5px; color: #fff7dd; }
.notify-content { font-size: 13px; color: rgba(255,232,196,.62); line-height: 1.6; }

@media (max-width: 768px) {
  .notification-page { padding: 14px; min-height: auto; }
  .notification-hero { flex-direction: column; padding: 24px; }
  .header-actions { flex-wrap: wrap; }
}
</style>