<script setup lang="ts">
defineOptions({ name: "Users" });
</script>
<template>
  <div class="page">
    <h2 class="page-title">用户管理</h2>
    <el-empty description="用户管理功能开发中，将接入 /api/user 接口" />
  </div>
</template>
<style scoped>
.page { padding: 20px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 20px 0; }
</style>
