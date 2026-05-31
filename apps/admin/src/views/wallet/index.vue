<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getAdminTransactionsApi } from "@/api/user";
import { getUserInfo } from "@/utils/auth";

defineOptions({ name: "Wallet" });

const currentUser = getUserInfo();

const typeMap: Record<string, string> = {
  DEPOSIT: "充值", WITHDRAW: "提现", FREEZE: "冻结",
  UNFREEZE: "解冻", PAYMENT: "支出", REFUND: "退款",
  EARN: "收入", SETTLEMENT: "结算", PLATFORM_FEE: "平台费",
  INCOME: "平台收入",
};
const typeLabel = (t: string) => typeMap[t] || t;

const directionMap: Record<string, { label: string; type: string }> = {
  IN: { label: "入账", type: "success" },
  OUT: { label: "出账", type: "danger" },
};
const formatYumi = (fen: number) => (Math.abs(fen) / 100).toFixed(Math.abs(fen) % 100 === 0 ? 0 : 2);
const formatTime = (s: string) => (s ? new Date(s).toLocaleString("zh-CN") : "-");

const loading = ref(false);
const transactions = ref<any[]>([]);
const filterUserId = ref("");
const filterType = ref("");
const typeOptions = [
  { label: "全部类型", value: "" },
  { label: "充值", value: "DEPOSIT" },
  { label: "提现", value: "WITHDRAW" },
  { label: "冻结", value: "FREEZE" },
  { label: "解冻", value: "UNFREEZE" },
  { label: "支出", value: "PAYMENT" },
  { label: "退款", value: "REFUND" },
  { label: "收入", value: "EARN" },
  { label: "结算", value: "SETTLEMENT" },
  { label: "平台费", value: "PLATFORM_FEE" },
];

async function fetchTransactions() {
  loading.value = true;
  try {
    const params: any = {};
    if (filterUserId.value) params.userId = filterUserId.value;
    if (filterType.value) params.type = filterType.value;
    const res: any = await getAdminTransactionsApi(params);
    transactions.value = Array.isArray(res) ? res : res?.data ?? [];
  } catch (e: any) {
    ElMessage.error(e?.message || "加载流水失败");
  } finally { loading.value = false; }
}

const detailVisible = ref(false);
const detailTx = ref<any>(null);

function openDetail(row: any) {
  detailTx.value = row;
  detailVisible.value = true;
}

onMounted(fetchTransactions);
</script>

<template>
  <div class="page">
    <h2 class="page-title">钱包监控</h2>
    <el-alert title="该页面仅用于监控钱包流水，不支持人工调账。" type="info" :closable="false" show-icon style="margin-bottom:16px" />

    <div class="toolbar">
      <el-input v-model="filterUserId" placeholder="用户ID" clearable style="width:120px" />
      <el-select v-model="filterType" placeholder="全部类型" clearable style="width:140px">
        <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-button type="primary" @click="fetchTransactions">搜索</el-button>
    </div>

    <el-table :data="transactions" v-loading="loading" border stripe style="width:100%" max-height="600">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户" width="160">
        <template #default="{ row }">
          {{ row.user?.nickname || row.user?.email || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90">
        <template #default="{ row }">{{ typeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column label="金额" width="110" align="center">
        <template #default="{ row }">
          <span :style="{ color: row.direction === 'IN' ? '#4ade80' : '#fb7185', fontWeight:700 }">
            {{ row.direction === 'IN' ? '+' : '-' }}{{ formatYumi(row.amount || 0) }}
          </span> 煜米
        </template>
      </el-table-column>
      <el-table-column label="方向" width="70" align="center">
        <template #default="{ row }">
          <el-tag :type="(directionMap[row.direction]?.type || 'info') as any" size="small">
            {{ directionMap[row.direction]?.label || row.direction }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" />
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="detailVisible" title="流水详情" size="420px" destroy-on-close>
      <template v-if="detailTx">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="流水ID">{{ detailTx.id }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeLabel(detailTx.type) }}</el-descriptions-item>
          <el-descriptions-item label="金额">
            <strong :style="{ color: detailTx.direction === 'IN' ? '#4ade80' : '#fb7185' }">
              {{ detailTx.direction === 'IN' ? '+' : '-' }}{{ formatYumi(detailTx.amount || 0) }}
            </strong> 煜米
          </el-descriptions-item>
          <el-descriptions-item label="方向">
            <el-tag :type="(directionMap[detailTx.direction]?.type || 'info') as any" size="small">
              {{ directionMap[detailTx.direction]?.label || detailTx.direction }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">{{ detailTx.status || "-" }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ detailTx.user?.nickname || detailTx.user?.email || "-" }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatTime(detailTx.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty v-else description="暂无数据" />
    </el-drawer>
  </div>
</template>

<style scoped>
.page { padding: 20px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
