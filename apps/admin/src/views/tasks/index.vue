<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getAdminTasksApi, getAdminOrdersApi, forceCancelTaskApi } from "@/api/user";
import { getUserInfo } from "@/utils/auth";

defineOptions({ name: "Tasks" });

const currentUser = getUserInfo();
const isSuperAdmin = computed(() => currentUser?.roles?.includes("SUPER_ADMIN"));

const statusMap: Record<string, string> = {
  PENDING: "待领取",
  ASSIGNED: "进行中",
  SUBMITTED: "待验收",
  ONGOING: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};
const statusTagType = (s: string) =>
  s === "COMPLETED" ? "success" : s === "CANCELLED" ? "danger" : s === "SUBMITTED" ? "warning" : s === "ASSIGNED" ? "" : "info";

const formatYumi = (fen: number) => (fen / 100).toFixed(fen % 100 === 0 ? 0 : 2);
const formatTime = (s: string) => (s ? new Date(s).toLocaleString("zh-CN") : "-");

// ── 数据 ──
const loading = ref(false);
const tasks = ref<any[]>([]);
const statusFilter = ref("");
const searchKeyword = ref("");

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "待领取", value: "PENDING" },
  { label: "进行中", value: "ASSIGNED" },
  { label: "待验收", value: "SUBMITTED" },
  { label: "已完成", value: "COMPLETED" },
  { label: "已取消", value: "CANCELLED" },
];

const filteredTasks = computed(() => {
  let list = tasks.value;
  const kw = searchKeyword.value.trim().toLowerCase();
  if (kw) list = list.filter((t: any) => t.title?.toLowerCase().includes(kw));
  return list;
});

// ── 加载 ──
async function fetchTasks() {
  loading.value = true;
  try {
    const params: any = {};
    if (statusFilter.value) params.status = statusFilter.value;
    const res: any = await getAdminTasksApi(params);
    tasks.value = Array.isArray(res) ? res : res?.data ?? [];
  } catch (e: any) {
    ElMessage.error(e?.message || "加载任务列表失败");
  } finally {
    loading.value = false;
  }
}

// ── 详情 ──
const detailVisible = ref(false);
const detailTask = ref<any>(null);
const detailOrders = ref<any[]>([]);

async function openDetail(row: any) {
  detailTask.value = row;
  detailVisible.value = true;
  detailOrders.value = [];
  // 加载关联订单
  try {
    const res: any = await getAdminOrdersApi({ taskId: row.id });
    detailOrders.value = Array.isArray(res) ? res : res?.data ?? [];
  } catch {}
}

// ── 强制取消 ──
const cancelVisible = ref(false);
const cancelReason = ref("");
const cancelLoading = ref(false);
const cancelTarget = ref<any>(null);

function openForceCancel(task: any) {
  if (!isSuperAdmin.value) return;
  cancelTarget.value = task;
  cancelReason.value = "";
  cancelVisible.value = true;
}

async function confirmForceCancel() {
  if (!cancelReason.value.trim()) { ElMessage.warning("请填写取消原因"); return; }
  try {
    await ElMessageBox.confirm(
      `确定要强制取消任务 #${cancelTarget.value.id} "${cancelTarget.value.title}" 吗？\n\n当前状态：${statusMap[cancelTarget.value.status]}\n取消原因：${cancelReason.value.trim()}\n\n⚠️ 此操作不可撤销，将退款给发布者。操作写入审计日志。`,
      "确认强制取消", { confirmButtonText: "确认取消", cancelButtonText: "返回", type: "warning" }
    );
  } catch { return; }

  cancelLoading.value = true;
  try {
    await forceCancelTaskApi(cancelTarget.value.id, cancelReason.value.trim());
    ElMessage.success("任务已取消，退款已处理。操作已写入审计日志。");
    cancelVisible.value = false;
    fetchTasks();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || "取消失败");
  } finally { cancelLoading.value = false; }
}

onMounted(fetchTasks);
</script>

<template>
  <div class="page">
    <h2 class="page-title">任务管理</h2>

    <div class="toolbar">
      <el-select v-model="statusFilter" placeholder="全部状态" style="width: 140px" clearable @change="fetchTasks">
        <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索标题" clearable style="width: 220px" />
    </div>

    <el-table :data="filteredTasks" v-loading="loading" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column label="发布者" width="140">
        <template #default="{ row }">
          {{ row.publisher?.nickname || row.publisher?.email || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="赏金" width="110" align="center">
        <template #default="{ row }">
          <strong style="color: #f6b73c">{{ formatYumi(row.price || 0) }}</strong> 煜米
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
          <el-button
            v-if="isSuperAdmin && row.status !== 'COMPLETED' && row.status !== 'CANCELLED'"
            type="danger" link size="small" @click="openForceCancel(row)"
          >强制取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="任务详情" size="480px" destroy-on-close>
      <template v-if="detailTask">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="ID">{{ detailTask.id }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ detailTask.title }}</el-descriptions-item>
          <el-descriptions-item label="描述">
            <div style="white-space: pre-wrap; max-height: 200px; overflow-y: auto;">{{ detailTask.description || "-" }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(detailTask.status)" size="small">{{ statusMap[detailTask.status] || detailTask.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="赏金"><strong style="color:#f6b73c">{{ formatYumi(detailTask.price || 0) }}</strong> 煜米</el-descriptions-item>
          <el-descriptions-item label="服务费">{{ formatYumi(detailTask.serviceFee || 0) }} 煜米</el-descriptions-item>
          <el-descriptions-item label="分类">{{ detailTask.category || "-" }}</el-descriptions-item>
          <el-descriptions-item label="服务方式">{{ detailTask.serviceMode || "-" }}</el-descriptions-item>
          <el-descriptions-item label="发布者">{{ detailTask.publisher?.nickname || detailTask.publisher?.email || "-" }}</el-descriptions-item>
          <el-descriptions-item label="浏览量">{{ detailTask.views || 0 }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(detailTask.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatTime(detailTask.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <template v-if="detailOrders.length">
          <h4 style="margin-top: 20px">关联订单</h4>
          <el-table :data="detailOrders" size="small" border>
            <el-table-column prop="id" label="订单ID" width="70" />
            <el-table-column label="执行者" width="140">
              <template #default="{ row: o }">{{ o.worker?.nickname || o.worker?.email || "-" }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row: o }">
                <el-tag :type="o.status === 'COMPLETED' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'warning'" size="small">{{ o.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </template>
      <el-empty v-else description="暂无数据" />
    </el-drawer>

    <!-- 强制取消确认弹窗 -->
    <el-dialog v-model="cancelVisible" title="⚠️ 强制取消任务" width="440px" destroy-on-close>
      <el-alert title="危险操作" type="error" :closable="false" show-icon style="margin-bottom:16px">
        <p style="margin:0;line-height:1.6">此操作将强制取消任务并退款给发布者。操作写入审计日志供后续追溯。</p>
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="任务">
          <strong>{{ cancelTarget?.title }}</strong> (#{{ cancelTarget?.id }})
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag size="small">{{ statusMap[cancelTarget?.status] || cancelTarget?.status }}</el-tag>
        </el-form-item>
        <el-form-item label="取消原因" required>
          <el-input v-model="cancelReason" type="textarea" :rows="3" placeholder="例如：违规/纠纷/无法继续" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelVisible = false">取消</el-button>
        <el-button type="danger" :loading="cancelLoading" @click="confirmForceCancel">确认强制取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 20px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 18px 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
