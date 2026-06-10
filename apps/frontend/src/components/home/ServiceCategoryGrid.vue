<template>
  <section class="category-grid">
    <h3 class="section-title"><span class="title-icon">🔖</span> 热门服务分类</h3>
    <div class="cat-inner">
      <div v-for="cat in categories" :key="cat.key" class="cat-item" @click="$router.push('/task')">
        <img :src="cat.icon" :alt="cat.label" class="cat-icon" />
        <span class="cat-label">{{ cat.label }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import iconDesign from '@/assets/haoyu-v027/category-icons/icon-design.svg'
import iconDev from '@/assets/haoyu-v027/category-icons/icon-dev.svg'
import iconService from '@/assets/haoyu-v027/category-icons/icon-service.svg'
import iconVideo from '@/assets/haoyu-v027/category-icons/icon-video.svg'
import iconMarketing from '@/assets/haoyu-v027/category-icons/icon-marketing.svg'
import iconWriting from '@/assets/haoyu-v027/category-icons/icon-writing.svg'
import iconData from '@/assets/haoyu-v027/category-icons/icon-data.svg'
import iconTrust from '@/assets/haoyu-v027/category-icons/icon-trust.svg'

const categories = [
  { key: 'SKILL_SERVICE', label: '设计创作', icon: iconDesign },
  { key: 'SKILL_SERVICE', label: '技术开发', icon: iconDev },
  { key: 'LIFE_ASSISTANCE', label: '生活服务', icon: iconService },
  { key: 'SKILL_SERVICE', label: '视频制作', icon: iconVideo },
  { key: 'SKILL_SERVICE', label: '营销推广', icon: iconMarketing },
  { key: 'SKILL_SERVICE', label: '文案策划', icon: iconWriting },
  { key: 'LIFE_ASSISTANCE', label: '数据标注', icon: iconData },
  { key: 'OTHER', label: '更多服务', icon: iconTrust },
]
</script>

<style scoped>
.category-grid {
  max-width: 1280px; margin: 0 auto 36px; padding: 0 24px;
}
.section-title {
  font-size: 16px; font-weight: 700; color: #f1f5f9;
  margin: 0 0 16px; display: flex; align-items: center; gap: 6px;
}
.title-icon { font-size: 16px; }
.cat-inner {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
}
.cat-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 18px 8px;
  background: rgba(17,24,39,0.5);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.cat-item:hover {
  border-color: rgba(99,102,241,0.3);
  background: rgba(99,102,241,0.06);
  transform: translateY(-2px);
}
.cat-icon {
  width: 36px; height: 36px;
  object-fit: contain;
}
.cat-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
@media (max-width: 900px) {
  .cat-inner { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 480px) {
  .cat-inner { grid-template-columns: repeat(3, 1fr); }
  .cat-item { padding: 12px 6px; }
}
</style>
