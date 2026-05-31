<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getAuditLogsApi } from "@/api/user";
import { getUserInfo } from "@/utils/auth";

defineOptions({ name: "AuditLogs" });

const currentUser = getUserInfo();

// ── 数据 ──
const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const totalPages = ref(0);

// ── 筛选 ──
const filters = reactive({
  action: "" as string,
  targetType: "" as string,
  adminId: "" as string,
  startDate: "" as string,
  endDate: "" as string,
});

const actionOptions = [
  { label: "全部操作", value: "" },
  { label: "强制取消任务", value: "FORCE_CANCEL_TASK" },
  { label: "强制结算订单", value: "FORCE_COMPLETE_ORDER" },
  { label: "强制驳回订单", value: "FORCE_REJECT_ORDER" },
  { label: "重置密码", value: "RESET_PASSWORD" },
  { label: "创建用户", value: "CREATE_USER" },
  { label: "封号", value: "BAN_USER" },
  { label: "解封", value: "UNBAN_USER" },
];

const targetTypeOptions = [
  { label: "全部类型", value: "" },
  { label: "任务", value: "TASK" },
  { label: "订单", value: "ORDER" },
  { label: "用户", value: "USER" },
];

// ── 详情展开 ──
const expandedRowKeys = ref<number[]>([]);

const parseDetailJson = (json: string | null) => {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return json;
  }
};

const formatDetail = (json: string | null) => {
  const obj = parseDetailJson(json);
  if (!obj) return "-";
  return JSON.stringify(obj, null, 2);
};

// ── 操作中文映射 ──
const actionLabelMap: Record<string, string> = {
  FORCE_CANCEL_TASK: "强制取消任务",
  FORCE_COMPLETE_ORDER: "强制结算订单",
  FORCE_REJECT_ORDER: "强制驳回订单",
  RESET_PASSWORD: "重置密码",
  CREATE_USER: "创建用户",
  BAN_USER: "封号",
  UNBAN_USER: "解封",
};
const actionLabel = (action: string) => actionLabelMap[action] || action;

const actionTypeMap: Record<string, string> = {
  FORCE_CANCEL_TASK: "danger",
  FORCE_COMPLETE_ORDER: "success",
  FORCE_REJECT_ORDER: "warning",
  RESET_PASSWORD: "info",
  CREATE_USER: "success",
  BAN_USER: "danger",
  UNBAN_USER: "success",
};
const actionTagType = (action: string) => actionTypeMap[action] || "info";

const targetTypeLabelMap: Record<string, string> = {
  TASK: "任务",
  ORDER: "订单",
  USER: "用户",
  TRANSACTION: "流水",
};

// ── 加载数据 ──
const loadData = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filters.action) params.action = filters.action;
    if (filters.targetType) params.targetType = filters.targetType;
    if (filters.adminId) params.adminId = filters.adminId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const res: any = await getAuditLogsApi(params);
    items.value = res.items || [];
    total.value = res.total || 0;
    totalPages.value = res.totalPages || 0;
  } catch (e: any) {
    if (e?.response?.status === 403) {
      ElMessage.error("仅超级管理员可查看审计日志");
    } else {
      ElMessage.error("加载审计日志失败");
    }
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  loadData();
};

const handleReset = () => {
  filters.action = "";
  filters.targetType = "";
  filters.adminId = "";
  filters.startDate = "";
  filters.endDate = "";
  page.value = 1;
  loadData();
};

const handlePageChange = (p: number) => {
  page.value = p;
  loadData();
};

const handleSizeChange = (s: number) => {
  pageSize.value = s;
  page.value = 1;
  loadData();
};

// ── 表格展开行 ──
const handleExpand = (row: any, rows: any[]) => {
  expandedRowKeys.value = rows.map((r: any) => r.id);
};

const tableRowClassName = ({ row }: { row: any }) => {
  if (row.action === "FORCE_CANCEL_TASK") return "row-danger";
  if (row.action === "FORCE_COMPLETE_ORDER") return "row-success";
  return "";
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="audit-page">
    <div class="page-header">
      <h2 class="page-title">审计日志</h2>
      <p class="page-desc">记录所有管理员操作，仅超级管理员可查看。</p>
    </div>

    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">操作类型</span>
          <el-select v-model="filters.action" placeholder="全部操作" clearable size="default" style="width: 160px">
            <el-option v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">目标类型</span>
          <el-select v-model="filters.targetType" placeholder="全部类型" clearable size="default" style="width: 140px">
            <el-option v-for="opt in targetTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">管理员ID</span>
          <el-input v-model="filters.adminId" placeholder="管理员ID" clearable size="default" style="width: 120px" />
        </div>

        <div class="filter-item">
          <span class="filter-label">起始时间</span>
          <el-date-picker v-model="filters.startDate" type="datetime" placeholder="选择起始时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss" size="default" style="width: 200px" />
        </div>

        <div class="filter-item">
          <span class="filter-label">结束时间</span>
          <el-date-picker v-model="filters.endDate" type="datetime" placeholder="选择结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss" size="default" style="width: 200px" />
        </div>

        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">
            <span>搜索</span>
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="items"
        v-loading="loading"
        stripe
        border
        :row-class-name="tableRowClassName"
        :expand-row-keys="expandedRowKeys"
        row-key="id"
        @expand-change="handleExpand"
        style="width: 100%"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-detail">
              <div class="detail-section">
                <h4>操作详情</h4>
                <pre class="detail-json">{{ formatDetail(row.detailJson) }}</pre>
              </div>
              <div class="detail-meta">
                <div class="meta-row" v-if="row.reason">
                  <span class="meta-key">原因：</span>
                  <span class="meta-val">{{ row.reason }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-key">记录ID：</span>
                  <span class="meta-val">{{ row.id }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-key">原始JSON：</span>
                  <span class="meta-val code">{{ row.detailJson || "-" }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString("zh-CN") }}
          </template>
        </el-table-column>

        <el-table-column label="管理员" width="200">
          <template #default="{ row }">
            <div class="admin-cell">
              <span class="admin-name">{{ row.admin?.nickname || row.admin?.email || "-" }}</span>
              <span class="admin-id">ID: {{ row.adminId }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-tag :type="actionTagType(row.action)" effect="dark" size="small">
              {{ actionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="目标" width="120">
          <template #default="{ row }">
            <div class="target-cell">
              <span class="target-type">{{ targetTypeLabelMap[row.targetType] || row.targetType }}</span>
              <span class="target-id" v-if="row.targetId">#{{ row.targetId }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="原因" min-width="200">
          <template #default="{ row }">
            <span class="reason-text">{{ row.reason || "-" }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && items.length === 0" description="暂无审计日志记录" />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.audit-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 18px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
}

.page-desc {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

/* 筛选栏 */
.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  color: #909399;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding-bottom: 1px;
}

/* 表格 */
.table-card :deep(.el-card__body) {
  padding: 16px;
}

.admin-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-name {
  font-weight: 600;
  font-size: 13px;
}

.admin-id {
  font-size: 11px;
  color: #909399;
}

.target-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

.target-type {
  font-size: 13px;
}

.target-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.reason-text {
  font-size: 13px;
  color: #606266;
}

/* 展开详情 */
.expand-detail {
  padding: 16px 20px;
  display: flex;
  gap: 32px;
}

.detail-section {
  flex: 1;
}

.detail-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
}

.detail-json {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: 300px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-meta {
  min-width: 200px;
}

.meta-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.meta-key {
  color: #909399;
  flex-shrink: 0;
}

.meta-val {
  color: #606266;
  word-break: break-all;
}

.meta-val.code {
  font-family: monospace;
  font-size: 12px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 行颜色 */
:deep(.row-danger) {
  background-color: rgba(245, 108, 108, 0.04);
}
:deep(.row-success) {
  background-color: rgba(103, 194, 58, 0.04);
}
</style>
