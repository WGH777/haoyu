<script setup lang="ts">
import { ref, onMounted } from "vue";
import { http } from "@/utils/http";

defineOptions({ name: "Arbitration" });

const loading = ref(true);
const disputes = ref<any[]>([]);
const error = ref("");

onMounted(async () => {
  try {
    const res = await http.request<any>("get", "/api/dispute");
    disputes.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
});

const statusLabels: Record<string, string> = {
  OPEN: "待处理", UNDER_REVIEW: "审核中", RESOLVED: "已解决",
  REJECTED: "已驳回", CANCELLED: "已取消"
};
const resultLabels: Record<string, string> = {
  REFUND_BUYER: "退款买家", PAY_SELLER: "支付卖家",
  PARTIAL_REFUND: "部分退款", CANCEL_ORDER: "取消订单"
};
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">仲裁中心</h1>
    <p class="text-gray-500 text-sm mb-4">争议案件列表（只读，禁止强制处理）</p>

    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else-if="disputes.length === 0" class="text-gray-400 py-8 text-center">
      暂无争议案件
    </div>
    <el-table v-else :data="disputes" stripe border size="small" style="width:100%">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="orderId" label="订单ID" width="70" />
      <el-table-column prop="reason" label="申诉原因" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">{{ statusLabels[row.status] || row.status }}</template>
      </el-table-column>
      <el-table-column label="结果" width="90">
        <template #default="{ row }">{{ row.result ? resultLabels[row.result] || row.result : '-' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>
