<template>
  <section class="home-flow">
    <div class="flow-inner">
      <div v-for="(step, i) in steps" :key="i" class="flow-step">
        <span class="flow-icon">{{ step.icon }}</span>
        <span class="flow-label">{{ step.label }}</span>
        <span class="flow-desc">{{ step.desc }}</span>
        <div v-if="i < steps.length - 1" class="flow-arrow">→</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  { icon: '📝', label: '发布需求', desc: '详细描述你需要的服务' },
  { icon: '🔒', label: '资金托管', desc: '资金由平台安全保障' },
  { icon: '🤝', label: '协作交付', desc: '服务者按约定交付成果' },
  { icon: '✅', label: '验收确认', desc: '满意后确认，释放资金' },
  { icon: '⭐', label: '信用沉淀', desc: '每次协作积累信用值' },
]
</script>

<style scoped>
.home-flow {
  max-width: 1280px; margin: 0 auto 36px; padding: 0 24px;
  overflow-x: auto;
}
.flow-inner {
  display: flex; gap: 12px; justify-content: center;
}
.flow-step {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  text-align: center;
  min-width: 120px; padding: 16px 12px;
  background: linear-gradient(135deg, rgba(17,24,39,0.55), rgba(15,23,42,0.35));
  border: 1px solid rgba(148,163,184,0.08);
  border-radius: 16px;
  position: relative;
}
.flow-icon { font-size: 26px; line-height: 1; }
.flow-label { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.flow-desc { font-size: 11px; color: #64748b; white-space: nowrap; }
.flow-arrow {
  display: none;
}
@media (max-width: 768px) {
  .home-flow { padding: 0 12px; }
  .flow-inner { justify-content: flex-start; }
  .flow-step { min-width: 100px; padding: 12px 8px; }
}
</style>
