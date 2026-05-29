<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getUserListApi, getUserDetailApi, changeUserRoleApi } from "@/api/user";
import { getUserInfo } from "@/utils/auth";

defineOptions({ name: "Users" });

// ── 当前登录用户 ──
const currentUser = getUserInfo();
const isSuperAdmin = computed(() => currentUser?.roles?.includes("SUPER_ADMIN"));

// ── 列表数据 ──
const loading = ref(false);
const userList = ref<any[]>([]);

// ── 搜索 & 筛选 ──
const searchKeyword = ref("");
const roleFilter = ref("");
const roleOptions = [
  { label: "全部角色", value: "" },
  { label: "SUPER_ADMIN", value: "SUPER_ADMIN" },
  { label: "ADMIN", value: "ADMIN" },
  { label: "USER", value: "USER" },
];

const filteredList = computed(() => {
  let list = userList.value;
  const kw = searchKeyword.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(
      (u) =>
        u.email?.toLowerCase().includes(kw) ||
        u.nickname?.toLowerCase().includes(kw)
    );
  }
  if (roleFilter.value) {
    list = list.filter((u) => u.role === roleFilter.value);
  }
  return list;
});

// ── 分页 ──
const page = ref(1);
const pageSize = ref(10);
const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});
const total = computed(() => filteredList.value.length);

function onSearch() {
  page.value = 1;
}
function onFilterChange() {
  page.value = 1;
}

// ── 加载列表 ──
async function fetchUsers() {
  loading.value = true;
  try {
    const res: any = await getUserListApi();
    userList.value = Array.isArray(res) ? res : res?.data ?? res?.list ?? [];
  } catch (e: any) {
    ElMessage.error(e?.message || "获取用户列表失败");
  } finally {
    loading.value = false;
  }
}

// ── 详情抽屉 ──
const drawerVisible = ref(false);
const detailUser = ref<any>(null);
const detailLoading = ref(false);

async function openDetail(row: any) {
  drawerVisible.value = true;
  detailLoading.value = true;
  detailUser.value = null;
  try {
    const res: any = await getUserDetailApi(row.id);
    detailUser.value = res ?? res?.data ?? res;
  } catch (e: any) {
    ElMessage.error(e?.message || "获取用户详情失败");
    drawerVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

// ── 煜米格式化（分 → 煜米） ──
function formatYumi(fen: number | null | undefined): string {
  if (fen === null || fen === undefined) return "0";
  const yumi = fen / 100;
  return Number.isInteger(yumi) ? yumi.toString() : yumi.toFixed(2);
}

// ── 角色修改 ──
const roleEditVisible = ref(false);
const targetRole = ref("");

function openRoleEdit() {
  targetRole.value = detailUser.value?.role || "USER";
  roleEditVisible.value = true;
}

async function confirmRoleChange() {
  const user = detailUser.value;
  if (!user) return;
  if (user.id === currentUser?.id) {
    ElMessage.warning("不能修改自己的角色");
    return;
  }
  if (user.role === targetRole.value) {
    roleEditVisible.value = false;
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定将 ${user.nickname || user.email} 的角色从 ${user.role} 修改为 ${targetRole.value}？${
        user.role === "SUPER_ADMIN" ? "\n⚠️ 该用户当前是超级管理员！" : ""
      }`,
      "确认角色修改",
      { confirmButtonText: "确认修改", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }
  try {
    await changeUserRoleApi(user.id, targetRole.value);
    ElMessage.success("角色修改成功");
    roleEditVisible.value = false;
    // 刷新详情和列表
    await openDetail(user);
    await fetchUsers();
  } catch (e: any) {
    ElMessage.error(
      e?.response?.data?.message || e?.message || "角色修改失败"
    );
  }
}

// ── 时间格式化 ──
function formatTime(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── 角色标签颜色 ──
function roleTagType(role: string): "danger" | "warning" | "info" | "" {
  if (role === "SUPER_ADMIN") return "danger";
  if (role === "ADMIN") return "warning";
  if (role === "USER") return "info";
  return "";
}

// ── 交易类型标签 ──
function txTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DEPOSIT: "充值",
    WITHDRAW: "提现",
    FREEZE: "冻结",
    UNFREEZE: "解冻",
    PAYMENT: "支出",
    REFUND: "退款",
    EARN: "收入",
  };
  return map[type] || type;
}

function txAmountClass(type: string): string {
  return ["DEPOSIT", "REFUND", "EARN", "UNFREEZE"].includes(type)
    ? "tx-plus"
    : "tx-minus";
}

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="users-page">
    <h2 class="page-title">用户管理</h2>

    <!-- 搜索 + 筛选 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索邮箱 / 昵称"
        clearable
        style="width: 260px"
        @input="onSearch"
      />
      <el-select
        v-model="roleFilter"
        placeholder="角色筛选"
        style="width: 160px"
        @change="onFilterChange"
      >
        <el-option
          v-for="opt in roleOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <!-- 表格 -->
    <el-table
      :data="pagedList"
      v-loading="loading"
      border
      stripe
      style="width: 100%"
      @row-click="openDetail"
      :row-style="{ cursor: 'pointer' }"
    >
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="nickname" label="昵称" min-width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="role" label="角色" width="130">
        <template #default="{ row }">
          <el-tag :type="roleTagType(row.role)" size="small" disable-transitions>
            {{ row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click.stop="openDetail(row)">
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="用户详情"
      size="420px"
      destroy-on-close
    >
      <template v-if="detailLoading">
        <el-skeleton :rows="8" animated />
      </template>
      <template v-else-if="detailUser">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="ID">
            {{ detailUser.id }}
          </el-descriptions-item>
          <el-descriptions-item label="昵称">
            {{ detailUser.nickname || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ detailUser.email }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="roleTagType(detailUser.role)" size="small">
              {{ detailUser.role }}
            </el-tag>
            <template v-if="isSuperAdmin && detailUser.id !== currentUser?.id">
              <el-button
                type="primary"
                link
                size="small"
                style="margin-left: 8px"
                @click="openRoleEdit"
              >
                修改角色
              </el-button>
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="个人简介">
            {{ detailUser.bio || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatTime(detailUser.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatTime(detailUser.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 钱包信息 -->
        <template v-if="detailUser.wallet">
          <h3 class="section-title">💰 钱包（煜米）</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="可用余额">
              <strong>{{ formatYumi(detailUser.wallet.available) }}</strong>
            </el-descriptions-item>
            <el-descriptions-item label="冻结金额">
              <span class="frozen">{{ formatYumi(detailUser.wallet.frozen) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 最近交易 -->
        <template v-if="detailUser.transactions?.length">
          <h3 class="section-title">📋 最近交易</h3>
          <el-table :data="detailUser.transactions" size="small" border>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row: tx }">
                {{ txTypeLabel(tx.type) }}
              </template>
            </el-table-column>
            <el-table-column label="金额（煜米）" width="120">
              <template #default="{ row: tx }">
                <span :class="txAmountClass(tx.type)">
                  {{ tx.type === "DEPOSIT" || tx.type === "EARN" ? "+" : tx.type === "REFUND" || tx.type === "UNFREEZE" ? "+" : "-" }}{{ formatYumi(Math.abs(tx.amount)) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" />
            <el-table-column label="时间" width="160">
              <template #default="{ row: tx }">
                {{ formatTime(tx.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </template>
      </template>
      <el-empty v-else description="暂无数据" />
    </el-drawer>

    <!-- 角色修改弹窗 -->
    <el-dialog
      v-model="roleEditVisible"
      title="修改角色"
      width="360px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item label="新角色">
          <el-select v-model="targetRole" style="width: 100%">
            <el-option label="USER - 普通用户" value="USER" />
            <el-option label="ADMIN - 管理员" value="ADMIN" />
            <el-option label="SUPER_ADMIN - 超级管理员" value="SUPER_ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleEditVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRoleChange">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.users-page {
  padding: 20px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 20px 0 10px;
}
.frozen {
  color: var(--el-color-warning);
}
.tx-plus {
  color: var(--el-color-success);
  font-weight: 500;
}
.tx-minus {
  color: var(--el-color-danger);
  font-weight: 500;
}
</style>
