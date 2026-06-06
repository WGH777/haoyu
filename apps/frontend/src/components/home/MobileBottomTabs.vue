<template>
  <nav class="mobile-bottom-tabs" aria-label="移动端底部导航">
    <button class="mobile-tab-item active" @click="$router.push('/task')">
      <span class="tab-icon">🏠</span><span>首页</span>
    </button>
    <button class="mobile-tab-item" @click="$router.push('/task')">
      <span class="tab-icon">📋</span><span>任务</span>
    </button>
    <button class="mobile-tab-publish" @click="isLogin ? $emit('publish') : $router.push('/login')" aria-label="发布需求">
      <span>＋</span>
    </button>
    <button class="mobile-tab-item" @click="$router.push('/trust')">
      <span class="tab-icon">🛡️</span><span>保障</span>
    </button>
    <button class="mobile-tab-item" @click="isLogin ? $router.push('/wallet') : $router.push('/login')">
      <span class="tab-icon">👤</span><span>我的</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ isLogin: boolean }>()
defineEmits<{ publish: [] }>()
</script>

<style scoped>
.mobile-bottom-tabs {
  display: none;
}
@media (max-width: 768px) {
  .mobile-bottom-tabs {
    display: grid !important;
    grid-template-columns: 1fr 1fr 74px 1fr 1fr;
    align-items: center;
    position: fixed;
    left: 12px; right: 12px;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    height: 64px;
    padding: 6px 8px;
    border-radius: 24px;
    background: rgba(10,14,23,0.92);
    border: 1px solid rgba(148,163,184,0.14);
    box-shadow: 0 12px 36px rgba(0,0,0,0.36), 0 0 28px rgba(99,102,241,0.08);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: 940;
  }
  .mobile-tab-item,
  .mobile-tab-publish {
    border: 0;
    background: transparent;
    color: #94a3b8;
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .mobile-tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 10px;
    min-width: 0;
  }
  .mobile-tab-item.active { color: #fcd34d; }
  .tab-icon { font-size: 17px; line-height: 1; }
  .mobile-tab-publish {
    width: 58px; height: 58px;
    border-radius: 50%;
    justify-self: center;
    margin-top: -24px;
    background: linear-gradient(135deg, #fcd34d, #f59e0b);
    color: #0f172a;
    font-size: 30px;
    line-height: 1;
    font-weight: 400;
    box-shadow: 0 10px 30px rgba(251,191,36,0.34);
    animation: gold-pulse 3.2s ease-in-out infinite;
  }
  .mobile-tab-publish:active { transform: scale(0.94); }
}
</style>
