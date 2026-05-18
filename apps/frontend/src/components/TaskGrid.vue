<template>
  <div v-loading="loading">
    <el-empty v-if="!loading && !tasks.length" description="这里暂时安静，新的需求可能正在路上 ✨">
      <el-button type="primary" round @click="$emit('create')">发布第一个需求</el-button>
    </el-empty>

    <div class="task-grid" v-else>
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-card-premium"
        @click="$emit('select', task.id)"
      >
        <div class="premium-card-top">
          <span class="premium-card-category">
            {{ categoryLabel(task.category || '') }}
            <span v-if="task.isPublicWelfare" class="welfare-badge">公益</span>
          </span>
          <span class="trust-badge" v-if="task.price > 0" title="资金托管保障">🔒 托管保障</span>
          <span :class="['status-badge', statusClass(task.status)]">
            {{ statusLabel(task.status) }}
          </span>
        </div>
        <h3 class="premium-card-title">{{ task.title }}</h3>
        <p class="premium-card-desc">{{ truncate(task.description, 80) }}</p>
        <div class="progress-mini" style="margin-bottom:12px">
          <div class="progress-fill" :style="{ width: progressPercent(task.status) }"></div>
        </div>
        <div class="premium-card-bottom">
          <span class="premium-card-price glow-amber">{{ (task.price / 100).toFixed(2) }} 煜米</span>
          <span class="premium-card-meta">
            <span>{{ task.serviceMode === 'OFFLINE' ? '📍 线下' : task.serviceMode === 'BOTH' ? '🌐 均可' : '💻 线上' }}</span>
            <span>👁 {{ task.views || 0 }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@/api/task'

defineProps<{ tasks: Task[]; loading: boolean }>()
defineEmits<{ select: [id: number]; create: [] }>()

const categoryLabel = (c: string) => {
  const m: Record<string, string> = { SKILL_SERVICE: '技能', LIFE_ASSISTANCE: '生活', FAMILY_CARE: '家庭', REMOTE_ASSISTANCE: '远程', COMMUNITY_COLLABORATION: '社区', PUBLIC_WELFARE: '公益', OTHER: '其他' }
  return m[c] || c
}
const statusLabel = (s: string) => {
  const m: Record<string, string> = { PENDING: '待接单', ASSIGNED: '进行中', IN_PROGRESS: '服务中', SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中' }
  return m[s] || s
}
const statusClass = (s: string) => {
  const m: Record<string, string> = { PENDING: 'pending', ASSIGNED: 'active', IN_PROGRESS: 'active', SUBMITTED: 'active', COMPLETED: 'done', CANCELLED: 'danger', DISPUTED: 'danger' }
  return m[s] || 'pending'
}
const progressPercent = (s: string) => {
  const m: Record<string, string> = { PENDING: '0%', ASSIGNED: '25%', IN_PROGRESS: '50%', SUBMITTED: '75%', COMPLETED: '100%', CANCELLED: '100%', DISPUTED: '100%' }
  return m[s] || '0%'
}
const truncate = (text: string, len: number) => text && text.length > len ? text.slice(0, len) + '...' : text || ''
</script>
