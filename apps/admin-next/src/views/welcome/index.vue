<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getAdminDashboardApi,
  getUserListApi,
  getAdminTasksApi,
  getAuditLogsApi
} from "@/api/user";

defineOptions({ name: "Dashboard" });

const loading = ref(true);
const stats = ref({
  users: 0,
  tasks: 0,
  auditLogs: 0,
  error: ""
});

onMounted(async () => {
  try {
    const [users, tasks, logs] = await Promise.all([
      getUserListApi({ page: 1, pageSize: 1 }),
      getAdminTasksApi({ page: 1, pageSize: 1 }),
      getAuditLogsApi({ page: 1, pageSize: 1 })
    ]);
    stats.value.users = Array.isArray(users) ? users.length : 0;
    stats.value.tasks = Array.isArray(tasks) ? tasks.length : 0;
    stats.value.auditLogs = logs?.total || 0;
  } catch (e: any) {
    stats.value.error = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-2">浩煜灯火站 · 管理后台</h1>
    <p class="text-gray-500 mb-6">总览数据（更多统计功能开发中）</p>

    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else-if="stats.error" class="text-red-500">{{ stats.error }}</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500">用户数</div>
        <div class="text-2xl font-bold mt-1">{{ stats.users }}</div>
      </div>
      <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500">任务数</div>
        <div class="text-2xl font-bold mt-1">{{ stats.tasks }}</div>
      </div>
      <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500">操作日志</div>
        <div class="text-2xl font-bold mt-1">{{ stats.auditLogs }}</div>
      </div>
    </div>

    <p class="text-sm mt-6" style="opacity: 0.3">admin-next build: verify</p>
  </div>
</template>
