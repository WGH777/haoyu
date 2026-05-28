<script setup lang="ts">
defineOptions({ name: "AuditLogs" });
</script>
<template>
  <div class="page">
    <h2 class="page-title">审计日志</h2>
    <el-empty description="审计日志功能开发中，需要后端先提供查询接口" />
  </div>
</template>
<style scoped>
.page { padding: 20px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 20px 0; }
</style>
