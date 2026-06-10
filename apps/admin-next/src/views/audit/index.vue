<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAuditLogsApi } from "@/api/user";

defineOptions({ name: "AuditLogs" });

const loading = ref(true);
const logs = ref<any[]>([]);
const total = ref(0);
const error = ref("");
const page = ref(1);
const pageSize = ref(20);

async function fetchLogs() {
  loading.value = true;
  try {
    const res = await getAuditLogsApi({ page: page.value, pageSize: pageSize.value });
    logs.value = res?.items || res?.data || [];
    total.value = res?.total || 0;
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchLogs);

const actionLabels: Record<string, string> = {
  FORCE_CANCEL_TASK: "强制取消任务",
  FORCE_COMPLETE_ORDER: "强制结算订单",
  FORCE_REJECT_ORDER: "强制驳回订单",
  RESET_PASSWORD: "重置密码",
  CREATE_USER: "创建用户",
  BAN_USER: "封禁用户",
  UNBAN_USER: "解封用户"
};
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">审计日志</h1>

    <div v-if="loading && logs.length === 0" class="text-gray-500">加载中...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <div v-else>
      <el-table :data="logs" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="操作" min-width="160">
          <template #default="{ row }">
            {{ actionLabels[row.action] || row.action }}
          </template>
        </el-table-column>
        <el-table-column label="目标" min-width="120">
          <template #default="{ row }">
            {{ row.targetType }} #{{ row.targetId }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作时间" min-width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
      </el-table>

      <div class="flex items-center justify-between mt-4">
        <span class="text-gray-400 text-sm">共 {{ total }} 条</span>
        <el-pagination
          v-if="total > pageSize"
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          size="small"
          background
          @current-change="fetchLogs"
        />
      </div>
    </div>
  </div>
</template>
