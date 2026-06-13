<template>
  <div class="notification-page">
    <section class="notification-hero">
      <div class="hero-copy">
        <span>Notification Center</span>
        <h2>通知中心</h2>
        <p>任务状态、验收结算、争议处理与系统提醒会在这里汇总。</p>
      </div>
      <div class="notification-stats" aria-label="通知概览">
        <div class="stat-card unread">
          <strong>{{ unreadCount }}</strong>
          <span>未读通知</span>
        </div>
        <div class="stat-card">
          <strong>{{ notifications.length }}</strong>
          <span>全部通知</span>
        </div>
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
            <el-tag :type="tagType(n.type)" size="small" :class="`notice-type-${n.type}`">{{ typeLabel(n.type) }}</el-tag>
            <span v-if="!n.readAt" class="unread-dot"></span>
          </span>
          <span class="notify-state" :class="{ unread: !n.readAt }">{{ n.readAt ? '已读' : '未读' }}</span>
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
  max-width: 1080px;
  min-height: 620px;
  margin: 0 auto;
  padding: 30px;
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
    radial-gradient(circle at 16% 12%, rgba(255, 214, 145, .18), transparent 26%),
    radial-gradient(circle at 82% 14%, rgba(124, 101, 216, .13), transparent 24%),
    radial-gradient(circle at 50% 88%, rgba(80, 120, 165, .11), transparent 32%),
    linear-gradient(135deg, rgba(6, 10, 19, .84), rgba(8, 18, 32, .96) 48%, rgba(5, 8, 16, .98));
}

.notification-page::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: .38;
  background:
    linear-gradient(112deg, transparent 0 40%, rgba(255, 214, 145, .08) 40% 41%, transparent 41% 100%),
    radial-gradient(circle at 18% 86%, rgba(242, 179, 77, .12), transparent 24%);
}

.notification-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 20px;
  align-items: stretch;
  padding: 30px;
  border: 1px solid rgba(255, 214, 145, .24);
  border-radius: 26px;
  background:
    radial-gradient(circle at 80% 18%, rgba(255, 214, 145, .16), transparent 28%),
    linear-gradient(120deg, rgba(8, 14, 28, .92), rgba(12, 18, 36, .70));
  box-shadow:
    0 22px 54px rgba(0, 0, 0, .36),
    0 0 42px rgba(242, 179, 77, .10),
    inset 0 1px 0 rgba(255, 255, 255, .08);
}

.hero-copy {
  max-width: 560px;
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
  font-size: 36px;
  line-height: 1.12;
}

.notification-hero p {
  margin: 0;
  color: rgba(255, 232, 196, .64);
  line-height: 1.8;
}

.notification-stats {
  display: grid;
  grid-template-columns: repeat(2, 112px);
  gap: 10px;
  align-self: center;
}

.stat-card {
  min-height: 96px;
  padding: 15px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 18px;
  background: rgba(5, 10, 20, .48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);
}

.stat-card.unread {
  background:
    radial-gradient(circle at 80% 14%, rgba(242, 179, 77, .18), transparent 36%),
    rgba(5, 10, 20, .48);
}

.stat-card strong,
.stat-card span {
  display: block;
}

.stat-card strong {
  color: #ffe8ae;
  font-size: 28px;
  line-height: 1;
  margin-bottom: 10px;
  font-variant-numeric: tabular-nums;
}

.stat-card span {
  color: rgba(183, 200, 220, .68);
  font-size: 12px;
}

.header-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 128px;
}

:deep(.notification-page .el-button) {
  border-color: rgba(255, 214, 145, .24);
  border-radius: 999px;
  background: rgba(255, 255, 255, .055);
  color: #ffe8ae;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);
}

:deep(.notification-page .el-button--primary) {
  border: 0;
  color: #251504;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d) !important;
  box-shadow: 0 12px 24px rgba(242, 179, 77, .18);
}

:deep(.notification-page .el-button:hover) {
  border-color: rgba(255, 214, 145, .42);
  color: #fff7dd;
}

.notification-empty {
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  margin-top: 22px;
  padding: 42px;
  border: 1px dashed rgba(255, 214, 145, .18);
  border-radius: 24px;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 214, 145, .12), transparent 26%),
    rgba(4, 9, 17, .48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05);
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

.notification-list {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.notification-item {
  position: relative;
  padding: 17px 18px;
  border: 1px solid rgba(255, 214, 145, .13);
  border-radius: 18px;
  cursor: pointer;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .048), rgba(255, 255, 255, .022)),
    rgba(5, 10, 20, .44);
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease;
}

.notification-item::before {
  content: "";
  position: absolute;
  inset: 12px auto 12px 0;
  width: 3px;
  border-radius: 999px;
  background: rgba(148, 163, 184, .30);
}

.notification-item.unread {
  border-color: rgba(255, 214, 145, .32);
  background:
    radial-gradient(circle at 96% 10%, rgba(242, 179, 77, .14), transparent 24%),
    rgba(242, 179, 77, .075);
}

.notification-item.unread::before {
  background: linear-gradient(180deg, #ffe8ae, #f2b34d);
  box-shadow: 0 0 16px rgba(242, 179, 77, .36);
}

.notification-item:hover {
  border-color: rgba(255, 214, 145, .28);
  box-shadow: 0 12px 28px rgba(0,0,0,.26);
  transform: translateY(-1px);
}

.notify-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.notify-type { display: flex; align-items: center; gap: 8px; }
.unread-dot { width: 7px; height: 7px; background: #f2b34d; border-radius: 50%; box-shadow: 0 0 14px rgba(242,179,77,.6); }

.notify-state {
  margin-left: auto;
  padding: 3px 9px;
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 999px;
  color: rgba(183, 200, 220, .68);
  font-size: 11px;
  font-weight: 700;
}

.notify-state.unread {
  border-color: rgba(255, 214, 145, .26);
  color: #ffe8ae;
  background: rgba(255, 214, 145, .08);
}

.notify-time {
  font-size: 12px;
  color: rgba(166, 183, 207, .58);
  white-space: nowrap;
}

.notify-title {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 5px;
  color: #fff7dd;
}

.notify-content {
  font-size: 13px;
  color: rgba(255,232,196,.62);
  line-height: 1.6;
}

:deep(.notification-page .el-tag) {
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 999px;
  background: rgba(148, 163, 184, .12);
  color: #cbd5e1;
  font-weight: 800;
}

:deep(.notice-type-REQUEST_RESPONDED),
:deep(.notice-type-SERVICE_STARTED),
:deep(.notice-type-AUTO_CONFIRMED) {
  border-color: rgba(148, 163, 184, .20);
  background: rgba(148, 163, 184, .14);
  color: #cbd5e1;
}

:deep(.notice-type-SERVICE_SUBMITTED),
:deep(.notice-type-DEADLINE_WARNING) {
  border-color: rgba(245, 158, 11, .22);
  background: rgba(245, 158, 11, .14);
  color: #ffd58a;
}

:deep(.notice-type-SERVICE_COMPLETED),
:deep(.notice-type-SETTLEMENT_CREATED),
:deep(.notice-type-PAYMENT_RECEIVED) {
  border-color: rgba(45, 212, 191, .22);
  background: rgba(45, 212, 191, .13);
  color: #8ff5df;
}

:deep(.notice-type-ORDER_DISPUTED),
:deep(.notice-type-ORDER_CANCELLED),
:deep(.notice-type-RISK_ALERT),
:deep(.notice-type-PROVIDER_UNRESPONSIVE) {
  border-color: rgba(207, 97, 74, .22);
  background: rgba(207, 97, 74, .14);
  color: #ffc4b2;
}

:deep(.notice-type-DISPUTE_RESOLVED),
:deep(.notice-type-REFUND_CREATED),
:deep(.notice-type-SYSTEM) {
  border-color: rgba(168, 85, 247, .20);
  background: rgba(168, 85, 247, .13);
  color: #dec5ff;
}

@media (max-width: 768px) {
  .notification-page { padding: 14px; min-height: auto; }
  .notification-hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }
  .notification-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .header-actions { flex-wrap: wrap; }
  .notify-header { flex-wrap: wrap; }
  .notify-state { margin-left: 0; }
}
</style>
