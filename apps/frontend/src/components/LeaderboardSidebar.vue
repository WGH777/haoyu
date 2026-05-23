<template>
  <aside class="leaderboard-sidebar">
    <!-- 热门需求 -->
    <div class="leaderboard-panel">
      <div class="leaderboard-title"><span>🔥</span> 热门需求</div>
      <div v-if="tasks.length">
        <div v-for="(t, idx) in tasks.slice(0, 5)" :key="'hot-' + t.id" class="leaderboard-item" @click="$emit('select', t.id)" style="cursor:pointer">
          <span class="leaderboard-rank" :class="'top-' + (idx + 1)" v-if="idx < 3">{{ idx + 1 }}</span>
          <span class="leaderboard-rank" v-else>{{ idx + 1 }}</span>
          <span class="leaderboard-name">{{ truncate(t.title, 16) }}</span>
          <span class="leaderboard-value">¥ {{ (t.price / 100).toFixed(0) }}</span>
        </div>
      </div>
      <div v-else class="empty-hint">暂无需求</div>
    </div>

    <div class="leaderboard-panel" style="margin-top:16px">
      <div class="leaderboard-title"><span>🏆</span> 完成榜</div>
      <div class="empty-hint">协作完成后上榜</div>
    </div>

    <div class="leaderboard-panel" style="margin-top:16px">
      <div class="leaderboard-title"><span>⭐</span> 信用榜</div>
      <div class="empty-hint">信用分达标后上榜</div>
    </div>

    <div class="leaderboard-panel" style="margin-top:16px">
      <div class="leaderboard-title"><span>🆕</span> 最新加入</div>
      <div class="empty-hint">新用户加入后展示</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Task } from '@/api/task'

defineProps<{ tasks: Task[] }>()
defineEmits<{ select: [id: number] }>()

const truncate = (t: string, n: number) => t && t.length > n ? t.slice(0, n) + '...' : t || ''
</script>

<style scoped>
.leaderboard-sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 72px; }
.empty-hint { font-size: 13px; color: #cbd5e1; text-align: center; padding: 20px 0; }
@media (max-width: 1024px) { .leaderboard-sidebar { display: none !important; } }
</style>
