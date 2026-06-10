<template>
  <section class="stats-strip">
    <div class="strip-inner">
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <div class="stat-body">
          <span class="stat-num">{{ stats.users }}+</span>
          <span class="stat-label">服务用户</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📋</span>
        <div class="stat-body">
          <span class="stat-num">{{ stats.orders }}+</span>
          <span class="stat-label">完成订单</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⭐</span>
        <div class="stat-body">
          <span class="stat-num">{{ stats.rating }}%</span>
          <span class="stat-label">好评率</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔒</span>
        <div class="stat-body">
          <span class="stat-num">{{ stats.funds }}</span>
          <span class="stat-label">托管资金</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  stats: { users: string; orders: string; rating: string; funds: string }
}>()
</script>

<style scoped>
.stats-strip {
  max-width: 1280px; margin: -20px auto 32px; padding: 0 24px;
  position: relative; z-index: 2;
}
.strip-inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px;
  background: linear-gradient(180deg, rgba(17,24,39,0.75), rgba(15,23,42,0.55));
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.15);
}
.stat-icon { font-size: 28px; line-height: 1; }
.stat-body { display: flex; flex-direction: column; gap: 2px; }
.stat-num {
  font-size: 20px; font-weight: 800;
  background: linear-gradient(135deg, #a5b4fc, #67e8f9);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.stat-label { font-size: 12px; color: #64748b; }
@media (max-width: 768px) {
  .stats-strip { margin-top: -10px; padding: 0 12px; }
  .strip-inner { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .stat-card { padding: 12px; }
  .stat-num { font-size: 17px; }
}
</style>
