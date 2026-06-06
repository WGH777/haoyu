<template>
  <!-- <section class="protection-bar">
    <div class="prot-inner">
      <div class="prot-item" v-for="item in items" :key="item.icon">
        <span class="prot-icon">{{ item.icon }}</span>
        <div class="prot-text">
          <span class="prot-title">{{ item.title }}</span>
          <span class="prot-desc">{{ item.desc }}</span>
        </div>
      </div>
    </div>
  </section> -->
</template>

<script setup lang="ts">
</script>

<style scoped>
.protection-bar {
  max-width: 1280px; margin: 0 auto 48px; padding: 0 24px;
}
.prot-inner {
  display: flex; justify-content: center; gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(17,24,39,0.45), rgba(15,23,42,0.3));
  border: 1px solid rgba(148,163,184,0.08);
  border-radius: 18px;
}
.prot-item { display: flex; align-items: center; gap: 12px; }
.prot-icon { font-size: 28px; }
.prot-text { display: flex; flex-direction: column; }
.prot-title { font-size: 14px; font-weight: 700; color: #e2e8f0; }
.prot-desc { font-size: 12px; color: #64748b; }
</style>
