<template>
  <div class="featured-task-card" @click="$router.push(`/task/${task.id}`)">
    <div class="ftc-cover">
      <img :src="coverSrc" :alt="coverAlt" class="ftc-cover-img" />
      <span v-if="isHighBudget" class="ftc-hot-badge">🔥 高预算</span>
      <span v-else-if="isNew" class="ftc-new-badge">🆕 新发布</span>
    </div>
    <div class="ftc-body">
      <div class="ftc-tags">
        <span class="ftc-category">{{ categoryLabel }}</span>
        <span :class="['ftc-status', statusClass]">{{ statusLabel }}</span>
      </div>
      <h4 class="ftc-title">{{ task.title }}</h4>
      <p class="ftc-desc">{{ task.description ? (task.description.length > 60 ? task.description.slice(0, 60) + '…' : task.description) : '暂无描述' }}</p>
      <div class="ftc-bottom">
        <span class="ftc-price">{{ formatYumiCompactFromCent(task.price) }} 煜米</span>
        <span class="ftc-meta">{{ timeAgo(task.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatYumiCompactFromCent } from '@/utils/money'
import type { Task } from '@/api/task'
import { resolveApiAssetUrl } from '@/api/http'
import coverDesign from '@/assets/haoyu-v027/task-covers/task-cover-design.svg'
import coverDev from '@/assets/haoyu-v027/task-covers/task-cover-dev.svg'
import coverVideo from '@/assets/haoyu-v027/task-covers/task-cover-video.svg'
import coverMarketing from '@/assets/haoyu-v027/task-covers/task-cover-marketing.svg'
import coverWriting from '@/assets/haoyu-v027/task-covers/task-cover-writing.svg'
import coverData from '@/assets/haoyu-v027/task-covers/task-cover-data.svg'

const props = defineProps<{ task: Task }>()

const categoryLabel = computed(() => {
  const m: Record<string, string> = {
    SKILL_SERVICE: '技能', LIFE_ASSISTANCE: '生活', FAMILY_CARE: '家庭',
    REMOTE_ASSISTANCE: '远程', COMMUNITY_COLLABORATION: '社区',
    PUBLIC_WELFARE: '公益', OTHER: '其他'
  }
  return m[props.task.category || ''] || props.task.category || '其他'
})

const statusLabel = computed(() => {
  const m: Record<string, string> = {
    PENDING: '待接单', ASSIGNED: '进行中', IN_PROGRESS: '服务中',
    SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中'
  }
  return m[props.task.status] || props.task.status
})

const statusClass = computed(() => {
  const m: Record<string, string> = {
    PENDING: 'pending', ASSIGNED: 'active', IN_PROGRESS: 'active',
    SUBMITTED: 'active', COMPLETED: 'done', CANCELLED: 'danger', DISPUTED: 'danger'
  }
  return m[props.task.status] || 'pending'
})

const isHighBudget = computed(() => props.task.price >= 50000)
const isNew = computed(() => {
  if (!props.task.createdAt) return false
  return Date.now() - new Date(props.task.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
})

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return m + '分钟前'
  const h = Math.floor(m / 60)
  if (h < 24) return h + '小时前'
  return Math.floor(h / 24) + '天前'
}

/** Map categories to default cover SVGs */
const coverSrc = computed(() => {
  // If the task already has an image, use it
  if (props.task.image || (props.task as any).referenceImage) {
    const img = props.task.image || (props.task as any).referenceImage || ''
    return resolveApiAssetUrl(img)
  }
  const c = props.task.category || 'OTHER'
  const map: Record<string, string> = {
    DESIGN: coverDesign,
    SKILL_SERVICE: coverDev,
    VIDEO: coverVideo,
    MARKETING: coverMarketing,
    WRITING: coverWriting,
    DATA: coverData,
  }
  return map[c] || coverDesign
})

const coverAlt = computed(() => `任务配图 - ${props.task.title}`)
</script>

<style scoped>
.featured-task-card {
  background: rgba(17,24,39,0.6);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}
.featured-task-card:hover {
  transform: translateY(-4px);
  border-color: rgba(99,102,241,0.3);
  box-shadow: 0 12px 40px rgba(99,102,241,0.08);
}
.ftc-cover {
  position: relative; width: 100%; height: 140px;
  overflow: hidden; background: rgba(15,23,42,0.5);
}
.ftc-cover-img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.ftc-hot-badge, .ftc-new-badge {
  position: absolute; top: 8px; right: 8px;
  padding: 2px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; line-height: 1.5;
}
.ftc-hot-badge { background: rgba(251,191,36,0.2); border: 1px solid rgba(251,191,36,0.3); color: #fcd34d; }
.ftc-new-badge { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; }
.ftc-body { padding: 14px 16px 16px; }
.ftc-tags { display: flex; gap: 6px; margin-bottom: 8px; }
.ftc-category {
  font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px;
  background: rgba(148,163,184,0.08); color: #94a3b8;
}
.ftc-status { font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 999px; }
.ftc-status.pending { background: rgba(99,102,241,0.1); color: #a5b4fc; }
.ftc-status.active { background: rgba(6,182,212,0.1); color: #67e8f9; }
.ftc-status.done { background: rgba(16,185,129,0.1); color: #6ee7b7; }
.ftc-status.danger { background: rgba(239,68,68,0.1); color: #fca5a5; }
.ftc-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 6px; line-height: 1.4; }
.ftc-desc { font-size: 12px; color: #64748b; margin: 0 0 10px; line-height: 1.5; }
.ftc-bottom { display: flex; justify-content: space-between; align-items: center; }
.ftc-price {
  font-size: 16px; font-weight: 800;
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.ftc-meta { font-size: 11px; color: #475569; }
</style>
