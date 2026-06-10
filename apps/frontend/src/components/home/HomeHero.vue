<template>
  <section class="home-hero">
    <div class="hero-bg-layer">
      <img :src="cityLightsUrl" alt="" class="hero-bg-svg" aria-hidden="true" />
      <img :src="lanternsUrl" alt="" class="hero-lantern-svg" aria-hidden="true" />
    </div>
    <div class="hero-content">
      <span class="hero-tag">🏮 万家灯火 · 资金托管 · 信用沉淀</span>
      <h1 class="hero-title">
        浩煜<span class="hero-title-accent"> Haoyu</span>
      </h1>
      <p class="hero-slogan">让需求有着落，让协作有回响</p>
      <p class="hero-sub">可信价值协作平台</p>
      <div class="hero-actions">
        <el-button type="warning" size="large" round @click="onPublish" class="hero-cta-gold">✨ 发布需求</el-button>
        <el-button size="large" round plain @click="$router.push('/task')" class="hero-cta-outline">浏览任务</el-button>
        <el-button size="large" round plain @click="$router.push('/trust')" class="hero-cta-outline hide-mobile">了解保障</el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import cityLightsUrl from '@/assets/haoyu-v027/hero-city-lights.svg'
import lanternsUrl from '@/assets/haoyu-v027/hero-lanterns.svg'

defineEmits<{ publish: [] }>()

const onPublish = () => {
  // parent handles login check
}
</script>

<style scoped>
.home-hero {
  position: relative; overflow: hidden;
  padding: 88px 24px 56px; text-align: center;
  min-height: 520px; display: flex; align-items: center; justify-content: center;
}
.hero-bg-layer {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
}
.hero-bg-svg {
  width: 100%; height: 100%;
  object-fit: cover; object-position: 50% 40%;
}
.hero-lantern-svg {
  position: absolute; top: 5%; right: 6%;
  width: 45%; max-width: 420px; height: auto;
  pointer-events: none;
}
.hero-content {
  position: relative; z-index: 1;
  max-width: 720px; margin: 0 auto;
}
.hero-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 18px; border-radius: 20px;
  background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.22);
  color: #fcd34d; font-size: 12px; font-weight: 600;
  margin-bottom: 24px; letter-spacing: 0.5px;
}
.hero-title {
  font-size: 58px; font-weight: 900; color: #f1f5f9;
  margin: 0 0 12px; letter-spacing: -2.5px; line-height: 1.05;
  text-shadow: 0 0 40px rgba(99,102,241,0.12);
}
.hero-title-accent {
  background: linear-gradient(135deg, #a5b4fc 0%, #fcd34d 45%, #67e8f9 75%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hero-slogan {
  font-size: 22px; color: #e2e8f0; margin: 0 0 4px;
  font-weight: 700; letter-spacing: 0.4px;
  text-shadow: 0 0 24px rgba(251,191,36,0.08);
}
.hero-sub {
  font-size: 15px; color: #64748b; margin: 0 0 32px;
  font-weight: 400;
}
.hero-actions {
  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
}
.hero-cta-gold {
  font-weight: 800 !important; font-size: 16px !important;
  color: #0f172a !important; padding: 14px 32px !important;
  box-shadow: 0 6px 28px rgba(251,191,36,0.34) !important;
  border-radius: 999px !important;
  transition: all 0.3s !important;
}
.hero-cta-gold:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 38px rgba(251,191,36,0.48) !important;
}
.hero-cta-outline {
  background: transparent !important;
  border: 1px solid rgba(148,163,184,0.25) !important;
  color: #94a3b8 !important; font-size: 15px !important;
  padding: 14px 28px !important; border-radius: 999px !important;
  transition: all 0.3s !important;
}
.hero-cta-outline:hover {
  border-color: #6366f1 !important; color: #a5b4fc !important;
}
@media (max-width: 768px) {
  .home-hero { padding: 36px 16px 28px; min-height: 380px; }
  .hero-title { font-size: 32px; letter-spacing: -1px; }
  .hero-slogan { font-size: 18px; }
  .hero-lantern-svg { width: 50%; top: 2%; right: 4%; }
  .hero-actions { flex-direction: column; align-items: center; }
  .hero-cta-gold { width: 90%; }
}
</style>
