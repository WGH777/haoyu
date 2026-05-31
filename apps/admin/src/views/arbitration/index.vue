<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getAdminOrdersApi, forceCompleteOrderApi, forceRejectOrderApi } from "@/api/user";
import { getUserInfo } from "@/utils/auth";

defineOptions({ name: "Arbitration" });

const currentUser = getUserInfo();
const isSuperAdmin = computed(() => currentUser?.roles?.includes("SUPER_ADMIN"));

const statusMap: Record<string, string> = {
  ASSIGNED: "进行中",
  SUBMITTED: "待验收",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  DISPUTED: "争议中",
};
const statusTagType = (s: string) =>
  s === "COMPLETED" ? "success" : s === "CANCELLED" ? "danger" : s === "DISPUTED" ? "danger" : s === "SUBMITTED" ? "warning" : "";

const formatYumi = (fen: number) => (fen / 100).toFixed(fen % 100 === 0 ? 0 : 2);
const formatTime = (s: string) => (s ? new Date(s).toLocaleString("zh-CN") : "-");

// ── 数据 ──
const loading = ref(false);
const orders = ref<any[]>([]);
const statusFilter = ref("");
const searchTaskId = ref("");

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "进行中", value: "ASSIGNED" },
  { label: "待验收", value: "SUBMITTED" },
  { label: "已完成", value: "COMPLETED" },
  { label: "已取消", value: "CANCELLED" },
];

const filteredOrders = computed(() => {
  let list = orders.value;
  if (searchTaskId.value.trim()) {
    const id = parseInt(searchTaskId.value.trim());
    if (!Number.isNaN(id)) list = list.filter((o: any) => o.taskId === id);
  }
  return list;
});

async function fetchOrders() {
  loading.value = true;
  try {
    const params: any = {};
    if (statusFilter.value) params.status = statusFilter.value;
    const res: any = await getAdminOrdersApi(params);
    orders.value = Array.isArray(res) ? res : res?.data ?? [];
  } catch (e: any) {
    ElMessage.error(e?.message || "加载订单列表失败");
  } finally {
    loading.value = false;
  }
}

// ── 详情 ──
const detailVisible = ref(false);
const detailOrder = ref<any>(null);

function openDetail(row: any) {
  detailOrder.value = row;
  detailVisible.value = true;
}

// ── 危险操作统一模板 ──
const actionVisible = ref(false);
const actionLoading = ref(false);
const actionMode = ref<"complete" | "reject">("complete");
const actionReason = ref("");
const actionTarget = ref<any>(null);

function openAction(mode: "complete" | "reject", order: any) {
  if (!isSuperAdmin.value) return;
  actionTarget.value = order;
  actionMode.value = mode;
  actionReason.value = "";
  actionVisible.value = true;
}

async function confirmAction() {
  if (!actionReason.value.trim()) { ElMessage.warning("请填写操作原因"); return; }
  const isComplete = actionMode.value === "complete";
  const label = isComplete ? "确认强制完成" : "确认强制驳回";
  const details = isComplete
    ? `将强制结算订单 #${actionTarget.value.id}，向执行者支付赏金。`
    : `将驳回订单 #${actionTarget.value.id}，退回进行中状态。`;

  try {
    await ElMessageBox.confirm(
      `${details}\n\n目标任务：${actionTarget.value.task?.title || "-"}\n操作原因：${actionReason.value.trim()}\n\n⚠️ 此操作不可撤销。操作写入审计日志。`,
      label, { confirmButtonText: "确认操作", cancelButtonText: "返回", type: "warning" }
    );
  } catch { return; }

  actionLoading.value = true;
  try {
    if (isComplete) {
      await forceCompleteOrderApi(actionTarget.value.id, actionReason.value.trim());
      ElMessage.success("订单已强制完成，赏金已结算。操作已写入审计日志。");
    } else {
      await forceRejectOrderApi(actionTarget.value.id, actionReason.value.trim());
      ElMessage.success("订单已驳回，退回进行中状态。操作已写入审计日志。");
    }
    actionVisible.value = false;
    fetchOrders();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || "操作失败");
  } finally { actionLoading.value = false; }
}

onMounted(fetchOrders);
</script>

<template>
  <div class="page">
    <h2 class="page-title">仲裁中心</h2>
    <p class="page-desc">管理所有任务订单，处理争议和干预操作。</p>

    <div class="toolbar">
      <el-select v-model="statusFilter" placeholder="全部状态" style="width: 140px" clearable @change="fetchOrders">
        <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-input v-model="searchTaskId" placeholder="按任务ID搜索" clearable style="width: 160px" />
    </div>

    <el-table :data="filteredOrders" v-loading="loading" border stripe style="width: 100%">
      <el-table-column prop="id" label="订单ID" width="80" />
      <el-table-column label="任务" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.task?.title || "-" }}</template>
      </el-table-column>
      <el-table-column label="发布者" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.task?.publisherId || "-" }}</template>
      </el-table-column>
      <el-table-column label="执行者" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.worker?.nickname || row.worker?.email || "-" }}</template>
      </el-table-column>
      <el-table-column label="赏金" width="100" align="center">
        <template #default="{ row }">
          <strong style="color:#f6b73c">{{ formatYumi(row.task?.price || 0) }}</strong> 煜米
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
          <template v-if="isSuperAdmin && row.status === 'SUBMITTED'">
            <el-button type="success" link size="small" @click="openAction('complete', row)">强制完成</el-button>
            <el-button type="danger" link size="small" @click="openAction('reject', row)">强制驳回</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="订单详情" size="480px" destroy-on-close>
      <template v-if="detailOrder">
        <h4 style="margin-top:0">订单信息</h4>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="订单ID">{{ detailOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="statusTagType(detailOrder.status)" size="small">{{ statusMap[detailOrder.status] || detailOrder.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="赏金"><strong style="color:#f6b73c">{{ formatYumi(detailOrder.task?.price || 0) }}</strong> 煜米</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatTime(detailOrder.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top:20px">任务信息</h4>
        <el-descriptions :column="1" border size="small" v-if="detailOrder.task">
          <el-descriptions-item label="任务ID">{{ detailOrder.task.id }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ detailOrder.task.title }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag size="small">{{ statusMap[detailOrder.task.status] || detailOrder.task.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布者ID">{{ detailOrder.task.publisherId }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top:20px">执行者</h4>
        <el-descriptions :column="1" border size="small" v-if="detailOrder.worker">
          <el-descriptions-item label="ID">{{ detailOrder.worker.id }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailOrder.worker.nickname || "-" }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detailOrder.worker.email }}</el-descriptions-item>
        </el-descriptions>

        <template v-if="detailOrder.submissionContent">
          <h4 style="margin-top:20px">提交内容</h4>
          <div style="background:#f5f7fa;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:13px;max-height:300px;overflow:auto;">
            {{ detailOrder.submissionContent }}
          </div>
        </template>

        <el-alert title="提示" type="info" :closable="false" show-icon style="margin-top:20px">
          <p style="margin:0;line-height:1.6">所有干预操作写入审计日志，可在 /admin/audit 查询。</p>
        </el-alert>
      </template>
      <el-empty v-else description="暂无数据" />
    </el-drawer>

    <!-- 危险操作弹窗 -->
    <el-dialog
      v-model="actionVisible"
      :title="actionMode === 'complete' ? '⚠️ 强制完成订单' : '⚠️ 强制驳回订单'"
      width="460px"
      destroy-on-close
    >
      <el-alert :title="actionMode === 'complete' ? '将强制结算并向执行者支付赏金' : '将驳回订单退回进行中状态'" type="error" :closable="false" show-icon style="margin-bottom:16px">
        <p style="margin:0;line-height:1.6">此操作不可撤销。请确认已核对双方沟通与平台规则。操作写入审计日志供后续追溯。</p>
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="订单">{{ actionTarget?.task?.title || "-" }} (#{{ actionTarget?.id }})</el-form-item>
        <el-form-item label="当前状态">
          <el-tag size="small">{{ statusMap[actionTarget?.status] || actionTarget?.status }}</el-tag>
        </el-form-item>
        <el-form-item label="执行者">{{ actionTarget?.worker?.nickname || actionTarget?.worker?.email || "-" }}</el-form-item>
        <el-form-item label="操作原因" required>
          <el-input v-model="actionReason" type="textarea" :rows="3" :placeholder="actionMode === 'complete' ? '例如：发布者超时未验收，平台仲裁通过' : '例如：成果不符合要求，平台要求重新提交'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionVisible = false">取消</el-button>
        <el-button :type="actionMode === 'complete' ? 'success' : 'danger'" :loading="actionLoading" @click="confirmAction">
          {{ actionMode === 'complete' ? '确认强制完成' : '确认强制驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 20px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
.page-desc { color: #909399; font-size: 13px; margin: 0 0 18px 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
