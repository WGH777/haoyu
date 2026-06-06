<template>
  <section class="featured-section">
    <div class="section-top">
      <h3 class="section-title"><span class="title-icon">🔥</span> 精选任务</h3>
      <a class="section-more" @click.prevent="$router.push('/task')">查看全部 →</a>
    </div>
    <div class="ft-grid">
      <FeaturedTaskCard v-for="t in tasks" :key="t.id" :task="t" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Task } from '@/api/task'
import FeaturedTaskCard from './FeaturedTaskCard.vue'

defineProps<{ tasks: Task[] }>()
</script>

<style scoped>
.featured-section {
  max-width: 1280px; margin: 0 auto 40px; padding: 0 24px;
}
.section-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.section-title {
  font-size: 16px; font-weight: 700; color: #f1f5f9;
  margin: 0; display: flex; align-items: center; gap: 6px;
}
.title-icon { font-size: 16px; }
.section-more {
  font-size: 13px; color: #818cf8; cursor: pointer; text-decoration: none;
}
.section-more:hover { color: #a5b4fc; }
.ft-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 900px) {
  .ft-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 540px) {
  .ft-grid { grid-template-columns: 1fr; }
}
</style>
