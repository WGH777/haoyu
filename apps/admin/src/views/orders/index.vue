<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getAdminOrdersApi } from "@/api/user";

defineOptions({ name: "Orders" });

const statusMap: Record<string, string> = {
  ASSIGNED: "进行中", SUBMITTED: "待验收",
  COMPLETED: "已完成", CANCELLED: "已取消", DISPUTED: "争议中",
};
const statusTagType = (s: string) =>
  s === "COMPLETED" ? "success" : s === "CANCELLED" ? "danger" : s === "DISPUTED" ? "danger" : s === "SUBMITTED" ? "warning" : "";

const formatYumi = (fen: number) => (fen / 100).toFixed(fen % 100 === 0 ? 0 : 2);
const formatTime = (s: string) => (s ? new Date(s).toLocaleString("zh-CN") : "-");

const loading = ref(false);
const orders = ref<any[]>([]);
const filterStatus = ref("");
const filterTaskId = ref("");

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "进行中", value: "ASSIGNED" },
  { label: "待验收", value: "SUBMITTED" },
  { label: "已完成", value: "COMPLETED" },
  { label: "已取消", value: "CANCELLED" },
];

async function fetchOrders() {
  loading.value = true;
  try {
    const params: any = {};
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterTaskId.value) {
      const id = parseInt(filterTaskId.value);
      if (!Number.isNaN(id)) params.taskId = filterTaskId.value;
    }
    const res: any = await getAdminOrdersApi(params);
    orders.value = Array.isArray(res) ? res : res?.data ?? [];
  } catch (e: any) {
    ElMessage.error(e?.message || "加载订单失败");
  } finally { loading.value = false; }
}

const detailVisible = ref(false);
const detailOrder = ref<any>(null);

function openDetail(row: any) {
  detailOrder.value = row;
  detailVisible.value = true;
}

onMounted(fetchOrders);
</script>

<template>
  <div class="page">
    <h2 class="page-title">订单管理</h2>
    <el-alert title="该页面仅用于查看订单信息，仲裁操作请前往仲裁中心。" type="info" :closable="false" show-icon style="margin-bottom:16px" />

    <div class="toolbar">
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:140px" @change="fetchOrders">
        <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-input v-model="filterTaskId" placeholder="按任务ID搜索" clearable style="width:160px" />
      <el-button type="primary" @click="fetchOrders">搜索</el-button>
    </div>

    <el-table :data="orders" v-loading="loading" border stripe style="width:100%" max-height="600">
      <el-table-column prop="id" label="订单ID" width="80" />
      <el-table-column label="任务" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.task?.title || "-" }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布者" width="80">
        <template #default="{ row }">#{{ row.task?.publisherId || "-" }}</template>
      </el-table-column>
      <el-table-column label="执行者" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.worker?.nickname || row.worker?.email || "-" }}</template>
      </el-table-column>
      <el-table-column label="赏金" width="100" align="center">
        <template #default="{ row }">
          <strong style="color:#f6b73c">{{ formatYumi(row.task?.price || 0) }}</strong> 煜米
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="detailVisible" title="订单详情" size="480px" destroy-on-close>
      <template v-if="detailOrder">
        <h4 style="margin-top:0">订单信息</h4>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="订单ID">{{ detailOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(detailOrder.status)" size="small">{{ statusMap[detailOrder.status] || detailOrder.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="赏金"><strong style="color:#f6b73c">{{ formatYumi(detailOrder.task?.price || 0) }}</strong> 煜米</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(detailOrder.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatTime(detailOrder.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <template v-if="detailOrder.task">
          <h4 style="margin-top:20px">任务信息</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="任务ID">{{ detailOrder.task.id }}</el-descriptions-item>
            <el-descriptions-item label="标题">{{ detailOrder.task.title }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag size="small">{{ statusMap[detailOrder.task.status] || detailOrder.task.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <template v-if="detailOrder.worker">
          <h4 style="margin-top:20px">执行者</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="ID">{{ detailOrder.worker.id }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ detailOrder.worker.nickname || "-" }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ detailOrder.worker.email }}</el-descriptions-item>
          </el-descriptions>
        </template>

        <template v-if="detailOrder.submissionContent">
          <h4 style="margin-top:20px">提交内容</h4>
          <div style="background:#f5f7fa;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:13px;max-height:300px;overflow:auto;">
            {{ detailOrder.submissionContent }}
          </div>
        </template>
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
