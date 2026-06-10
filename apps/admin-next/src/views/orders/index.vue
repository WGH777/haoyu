<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAdminOrdersApi } from "@/api/user";

defineOptions({ name: "Orders" });

const loading = ref(true);
const orders = ref<any[]>([]);
const error = ref("");
const filterStatus = ref("");

onMounted(fetchOrders);

async function fetchOrders() {
  loading.value = true;
  try {
    const params: any = {};
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await getAdminOrdersApi(params);
    orders.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

const statusLabels: Record<string, string> = {
  ASSIGNED: "已分配", SUBMITTED: "已提交", COMPLETED: "已完成",
  CANCELLED: "已取消", DISPUTED: "争议中", IN_PROGRESS: "进行中",
  PENDING: "待处理"
};
const statusColors: Record<string, string> = {
  ASSIGNED: "warning", SUBMITTED: "", COMPLETED: "success",
  CANCELLED: "danger", DISPUTED: "danger", IN_PROGRESS: "warning",
  PENDING: "info"
};

const detailVisible = ref(false);
const detailOrder = ref<any>(null);
function showDetail(order: any) { detailOrder.value = order; detailVisible.value = true; }
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">订单管理</h1>
    <div class="flex items-center gap-3 mb-4">
      <el-select v-model="filterStatus" placeholder="全部状态" clearable size="small" style="width:140px" @change="fetchOrders">
        <el-option v-for="(label, key) in statusLabels" :key="key" :label="label" :value="key" />
      </el-select>
    </div>

    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <el-table v-else :data="orders" stripe border size="small" style="width:100%">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column label="任务" min-width="120">
        <template #default="{ row }">{{ row.task?.title || `#${row.taskId}` }}</template>
      </el-table-column>
      <el-table-column label="金额" width="80">
        <template #default="{ row }">{{ row.amount ? '¥' + (row.amount / 100).toFixed(2) : '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="statusColors[row.status] || 'info'" size="small">{{ statusLabels[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="执行者" width="90">
        <template #default="{ row }">{{ row.worker?.nickname || '#' + row.workerId }}</template>
      </el-table-column>
      <el-table-column label="时间" width="100">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="详情" width="70" fixed="right">
        <template #default="{ row }"><el-button size="small" @click="showDetail(row)">查看</el-button></template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="detailVisible" title="订单详情" size="400px">
      <template v-if="detailOrder">
        <p><b>订单 ID:</b> {{ detailOrder.id }}</p>
        <p><b>任务:</b> {{ detailOrder.task?.title || `#${detailOrder.taskId}` }}</p>
        <p><b>金额:</b> {{ detailOrder.amount ? '¥' + (detailOrder.amount / 100).toFixed(2) : '未设置' }}</p>
        <p><b>状态:</b> {{ statusLabels[detailOrder.status] || detailOrder.status }}</p>
        <p><b>执行者:</b> {{ detailOrder.worker?.nickname || detailOrder.worker?.email || '#' + detailOrder.workerId }}</p>
        <p><b>提交内容:</b> {{ detailOrder.submissionContent || '无' }}</p>
        <p><b>创建时间:</b> {{ new Date(detailOrder.createdAt).toLocaleString('zh-CN') }}</p>
      </template>
    </el-drawer>
  </div>
</template>
