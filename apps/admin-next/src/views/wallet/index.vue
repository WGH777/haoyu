<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAdminTransactionsApi } from "@/api/user";

defineOptions({ name: "Wallet" });

const loading = ref(true);
const transactions = ref<any[]>([]);
const error = ref("");

onMounted(fetchTxns);

async function fetchTxns() {
  loading.value = true;
  try {
    const res = await getAdminTransactionsApi();
    transactions.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

const typeLabels: Record<string, string> = {
  PAYMENT: "支付", INCOME: "收入", REFUND: "退款",
  DEPOSIT: "充值", WITHDRAW: "提现", TRANSFER: "转账"
};
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">钱包监控</h1>
    <p class="text-gray-500 text-sm mb-4">全站交易流水（只读，禁止调账）</p>

    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <el-table v-else :data="transactions" stripe border size="small" style="width:100%">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column label="金额" width="100">
        <template #default="{ row }">¥{{ (row.amount / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag size="small">{{ typeLabels[row.type] || row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="70">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 'SUCCESS' ? 'success' : 'warning'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户ID" width="70" prop="userId" />
      <el-table-column label="时间" min-width="160">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
      </el-table-column>
    </el-table>
    <p class="text-gray-400 text-sm mt-2">共 {{ transactions.length }} 条（只读，基于 Legacy Transaction 表）</p>
  </div>
</template>
