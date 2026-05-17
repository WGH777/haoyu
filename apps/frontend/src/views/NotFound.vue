<template>
  <div class="not-found">
    <div class="nf-card">
      <span class="nf-icon">🔍</span>
      <h1>404</h1>
      <p>页面不存在</p>
      <el-button type="primary" @click="$router.push('/task')" round>返回任务大厅</el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0e17; }
.nf-card { text-align: center; }
.nf-icon { font-size: 64px; display: block; margin-bottom: 16px; }
.nf-card h1 { font-size: 72px; font-weight: 800; color: #6366f1; margin: 0 0 8px; }
.nf-card p { font-size: 16px; color: #94a3b8; margin: 0 0 24px; }
</style>
