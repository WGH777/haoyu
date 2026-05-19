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
        <!-- 1. 标题 — 首要信息 -->
        <h3 class="premium-card-title">{{ task.title }}</h3>

        <!-- 2. 煜米预算 — 核心决策信息 -->
        <div class="premium-card-price-row">
          <span class="premium-card-price glow-amber">{{ (task.price / 100).toFixed(2) }} 煜米</span>
          <span v-if="task.status !== 'PENDING'" :class="['status-dot', statusClass(task.status)]">
            {{ statusLabel(task.status) }}
          </span>
        </div>

        <!-- 3. 信任标签 — 安全信号 -->
        <div class="trust-tags">
          <span v-if="task.price > 0" class="trust-tag trust-escrow" title="资金托管保障">
            🔒 托管
          </span>
          <span v-if="task.publisher?.verified" class="trust-tag trust-verified" title="已认证服务者">
            ✅ 已认证
          </span>
          <span v-if="task.riskLevel === 'LOW'" class="trust-tag trust-low-risk" title="低风险任务">
            🟢 低风险
          </span>
          <span v-if="task.isPublicWelfare" class="trust-tag trust-welfare">
            💚 公益
          </span>
        </div>

        <!-- 4. 描述（保留，降级） -->
        <p class="premium-card-desc">{{ truncate(task.description, 60) }}</p>

        <!-- 匹配原因 -->
        <div v-if="matchReasons?.[task.id]" class="match-reason">
          💡 {{ matchReasons[task.id] }}
        </div>

        <!-- 5. 底部元信息：分类 + 服务方式 + 发布时间 + 浏览 -->
        <div class="premium-card-bottom">
          <span class="card-meta-tag">{{ categoryLabel(task.category || '') }}</span>
          <span class="card-meta-tag">{{ modeIcon(task.serviceMode) }} {{ modeLabel(task.serviceMode) }}</span>
          <span class="card-meta-time">{{ timeAgo(task.createdAt) }}</span>
          <span class="card-meta-views">👁 {{ task.views || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@/api/task'

defineProps<{ tasks: Task[]; loading: boolean; matchReasons?: Record<number, string> }>()
defineEmits<{ select: [id: number]; create: [] }>()

const categoryLabel = (c: string) => {
  const m: Record<string, string> = { SKILL_SERVICE: '技能', LIFE_ASSISTANCE: '生活', FAMILY_CARE: '家庭', REMOTE_ASSISTANCE: '远程', COMMUNITY_COLLABORATION: '社区', PUBLIC_WELFARE: '公益', OTHER: '其他' }
  return m[c] || c
}

const modeIcon = (m?: string) => {
  const map: Record<string, string> = { OFFLINE: '📍', BOTH: '🌐', ONLINE: '💻' }
  return map[m || ''] || '💻'
}

const modeLabel = (m?: string) => {
  const map: Record<string, string> = { OFFLINE: '线下', BOTH: '均可', ONLINE: '线上' }
  return map[m || ''] || '线上'
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = { PENDING: '待接单', ASSIGNED: '进行中', IN_PROGRESS: '服务中', SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中' }
  return m[s] || s
}

const statusClass = (s: string) => {
  const m: Record<string, string> = { PENDING: 'pending', ASSIGNED: 'active', IN_PROGRESS: 'active', SUBMITTED: 'active', COMPLETED: 'done', CANCELLED: 'danger', DISPUTED: 'danger' }
  return m[s] || 'pending'
}

const timeAgo = (t: string) => {
  const diff = Date.now() - new Date(t).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}天前`
  return new Date(t).toLocaleDateString('zh-CN')
}

const truncate = (text: string, len: number) => text && text.length > len ? text.slice(0, len) + '...' : text || ''
</script>
