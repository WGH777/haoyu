<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getUserListApi, resetUserPasswordApi, banUserApi, unbanUserApi, createUserApi } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";

defineOptions({ name: "Users" });

const loading = ref(true);
const users = ref<any[]>([]);
const error = ref("");

const currentUser = computed(() => useUserStoreHook());
const isSuperAdmin = computed(() => currentUser.value.roles?.includes("SUPER_ADMIN"));

onMounted(fetchUsers);

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await getUserListApi();
    users.value = Array.isArray(res) ? res : res?.items || res?.data || [];
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

// ── 重置密码对话框 ──
const resetVisible = ref(false);
const resetTarget = ref<any>(null);
const resetFormRef = ref<FormInstance>();
const resetForm = ref({ reason: "" });
const resetLoading = ref(false);
const resetResult = ref({ password: "", email: "" });

function openReset(user: any) {
  resetTarget.value = user;
  resetForm.value.reason = "";
  resetResult.value = { password: "", email: "" };
  resetVisible.value = true;
}

async function submitReset() {
  if (!resetForm.value.reason.trim()) return;
  resetLoading.value = true;
  try {
    const res = await resetUserPasswordApi(resetTarget.value.id, resetForm.value.reason.trim());
    resetResult.value = {
      password: res.temporaryPassword || "",
      email: res.targetEmail || resetTarget.value.email
    };
    message("密码已重置", { type: "success" });
    // 注意：temporaryPassword 不写入 localStorage / console / 报告
  } catch (e: any) {
    message(e?.response?.data?.message || e?.message || "操作失败", { type: "error" });
  } finally {
    resetLoading.value = false;
  }
}

function closeReset() {
  resetVisible.value = false;
}

// ── 封禁/解封对话框 ──
const banVisible = ref(false);
const banTarget = ref<any>(null);
const banForm = ref({ reason: "" });
const banLoading = ref(false);
const isBanning = ref(false); // true=封禁, false=解封

function openBan(user: any, doBan: boolean) {
  banTarget.value = user;
  banForm.value.reason = "";
  isBanning.value = doBan;
  banVisible.value = true;
}

async function submitBan() {
  if (!banForm.value.reason.trim()) return;
  banLoading.value = true;
  try {
    if (isBanning.value) {
      await banUserApi(banTarget.value.id, banForm.value.reason.trim());
    } else {
      await unbanUserApi(banTarget.value.id, banForm.value.reason.trim());
    }
    message(isBanning.value ? "已封禁" : "已解封", { type: "success" });
    banVisible.value = false;
    fetchUsers();
  } catch (e: any) {
    message(e?.response?.data?.message || e?.message || "操作失败", { type: "error" });
  } finally {
    banLoading.value = false;
  }
}

// ── 创建用户对话框 ──
const createVisible = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = ref({ email: "", nickname: "", password: "", role: "USER", reason: "" });
const createLoading = ref(false);
const createResult = ref<{ email: string; password: string; role: string } | null>(null);

function openCreate() {
  createForm.value = { email: "", nickname: "", password: "", role: "USER", reason: "" };
  createResult.value = null;
  createVisible.value = true;
}

function closeCreate() {
  createVisible.value = false;
}

async function submitCreate() {
  if (!createForm.value.email.trim() || !createForm.value.nickname.trim() || !createForm.value.reason.trim()) return;
  createLoading.value = true;
  try {
    const res = await createUserApi({
      email: createForm.value.email.trim(),
      nickname: createForm.value.nickname.trim(),
      password: createForm.value.password.trim() || undefined,
      role: createForm.value.role,
      reason: createForm.value.reason.trim()
    });
    createResult.value = {
      email: res.email || createForm.value.email,
      password: res.temporaryPassword || "",
      role: res.role || createForm.value.role
    };
    message("用户创建成功", { type: "success" });
    fetchUsers();
  } catch (e: any) {
    message(e?.response?.data?.message || e?.message || "操作失败", { type: "error" });
  } finally {
    createLoading.value = false;
  }
}
</script>

<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <el-button v-if="isSuperAdmin" type="primary" size="default" @click="openCreate">+ 创建用户</el-button>
    </div>

    <div v-if="loading" class="hint-text">加载中...</div>
    <div v-else-if="error" class="hint-text error">{{ error }}</div>

    <div v-else>
      <!-- 桌面端表格 -->
      <el-table :data="users" stripe border style="width:100%" class="desktop-table">
        <el-table-column prop="id" label="ID" width="50" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="nickname" label="昵称" min-width="90" />
        <el-table-column label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="row.role === 'SUPER_ADMIN' ? 'danger' : row.role === 'ADMIN' ? 'warning' : 'info'" size="small">
              {{ row.role === 'SUPER_ADMIN' ? '超管' : row.role === 'ADMIN' ? '管理员' : row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ACTIVE' ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册" min-width="100">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column v-if="isSuperAdmin" label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" plain @click="openReset(row)">重置密码</el-button>
            <el-button v-if="row.status === 'ACTIVE'" size="small" type="danger" plain @click="openBan(row, true)">封禁</el-button>
            <el-button v-else-if="row.status === 'SUSPENDED'" size="small" type="success" plain @click="openBan(row, false)">解封</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片 -->
      <div class="mobile-cards">
            <!-- ban/unban v2 -->
        <div v-for="user in users" :key="user.id" class="user-card">
          <div class="card-header">
            <span class="card-id">#{{ user.id }}</span>
            <el-tag :type="user.role === 'SUPER_ADMIN' ? 'danger' : user.role === 'ADMIN' ? 'warning' : 'info'" size="small">
              {{ user.role === 'SUPER_ADMIN' ? '超管' : user.role === 'ADMIN' ? '管理员' : user.role }}
            </el-tag>
            <el-tag :type="user.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ user.status === 'ACTIVE' ? '正常' : '封禁' }}
            </el-tag>
          </div>
          <div class="card-body">
            <div class="card-field">
              <span class="card-label">昵称</span>
              <span class="card-value">{{ user.nickname }}</span>
            </div>
            <div class="card-field">
              <span class="card-label">邮箱</span>
              <span class="card-value">{{ user.email }}</span>
            </div>
            <div class="card-field">
              <span class="card-label">注册</span>
              <span class="card-value">{{ new Date(user.createdAt).toLocaleDateString('zh-CN') }}</span>
            </div>
          </div>
          <div v-if="isSuperAdmin" class="card-actions">
            <el-button size="small" type="warning" plain @click="openReset(user)">重置密码</el-button>
            <el-button v-if="user.status === 'ACTIVE'" size="small" type="danger" plain @click="openBan(user, true)">封禁</el-button>
            <el-button v-else-if="user.status === 'SUSPENDED'" size="small" type="success" plain @click="openBan(user, false)">解封</el-button>
          </div>
        </div>
      </div>

      <p class="footer-text">{{ users.length }} 条记录</p>
    </div>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="resetVisible"
      title="***"
      width="420px"
      :close-on-click-modal="false"
      @close="closeReset"
    >
      <template v-if="resetTarget">
        <p class="mb-3">用户：<b>{{ resetTarget.email }}</b>（{{ resetTarget.nickname }}）</p>

        <div v-if="!resetResult.password">
          <el-form ref="resetFormRef" :model="resetForm">
            <el-form-item label="操作原因" required>
              <el-input
                v-model="resetForm.reason"
                placeholder="请填写重置原因（必填）"
                :rows="2"
                type="textarea"
              />
            </el-form-item>
          </el-form>
          <div class="flex items-center gap-3 mt-4">
            <el-button type="danger" :loading="resetLoading" :disabled="!resetForm.reason.trim()" @click="submitReset">
              确认重置
            </el-button>
            <el-button @click="closeReset">取消</el-button>
          </div>
        </div>

        <div v-else class="reset-done">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>
              请立即记录下方临时密码（仅显示一次）
            </template>
          </el-alert>
          <div class="temp-password-box">
            <code class="temp-password">{{ resetResult.password }}</code>
          </div>
          <p class="text-gray-400 text-sm">目标用户：{{ resetResult.email }}</p>
          <el-button class="mt-4" @click="closeReset">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 封禁/解封弹窗 -->
    <el-dialog
      v-model="banVisible"
      :title="isBanning ? '封禁用户' : '解封用户'"
      width="420px"
      :close-on-click-modal="false"
    >
      <template v-if="banTarget">
        <p class="mb-3">用户：<b>{{ banTarget.email }}</b>（{{ banTarget.nickname }}）</p>
        <el-form-item label="操作原因" required>
          <el-input
            v-model="banForm.reason"
            :placeholder="isBanning ? '请填写封禁原因' : '请填写解封原因'"
            :rows="2"
            type="textarea"
          />
        </el-form-item>
        <div class="flex items-center gap-3 mt-4">
          <el-button
            :type="isBanning ? 'danger' : 'success'"
            :loading="banLoading"
            :disabled="!banForm.reason.trim()"
            @click="submitBan"
          >
            {{ isBanning ? '确认封禁' : '确认解封' }}
          </el-button>
          <el-button @click="banVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 创建用户弹窗 -->
    <el-dialog
      v-model="createVisible"
      title="创建用户"
      width="460px"
      :close-on-click-modal="false"
      @close="closeCreate"
    >
      <!-- 第一步：表单 -->
      <template v-if="!createResult">
        <el-form ref="createFormRef" :model="createForm" label-width="80px">
          <el-form-item label="邮箱" required>
            <el-input v-model="createForm.email" placeholder="user@example.com" />
          </el-form-item>
          <el-form-item label="昵称" required>
            <el-input v-model="createForm.nickname" placeholder="用户昵称" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="createForm.password" placeholder="留空则自动生成 12 位强密码" show-password />
          </el-form-item>
          <el-form-item label="角色" required>
            <el-select v-model="createForm.role" style="width:100%">
              <el-option label="普通用户 (USER)" value="USER" />
              <el-option label="管理员 (ADMIN)" value="ADMIN" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作原因" required>
            <el-input
              v-model="createForm.reason"
              placeholder="请填写创建原因（必填）"
              :rows="2"
              type="textarea"
            />
          </el-form-item>
        </el-form>
        <div class="flex items-center gap-3 mt-2 justify-end">
          <el-button
            type="primary"
            :loading="createLoading"
            :disabled="!createForm.email.trim() || !createForm.nickname.trim() || !createForm.reason.trim()"
            @click="submitCreate"
          >
            确认创建
          </el-button>
          <el-button @click="closeCreate">取消</el-button>
        </div>
      </template>

      <!-- 第二步：显示结果 -->
      <template v-else>
        <div class="create-done">
          <el-alert type="success" :closable="false" show-icon>
            <template #title>
              用户创建成功
            </template>
          </el-alert>

          <div v-if="createResult.password" class="mt-4">
            <el-alert type="warning" :closable="false" show-icon>
              <template #title>
                请立即记录下方临时密码（仅显示一次，关闭后不可找回）
              </template>
            </el-alert>
            <div class="temp-password-box mt-3">
              <code class="temp-password">{{ createResult.password }}</code>
            </div>
          </div>
          <div v-else class="mt-4">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>
                已使用自定义密码创建用户
              </template>
            </el-alert>
          </div>

          <div class="mt-3 text-sm" style="color:var(--el-text-color-secondary)">
            <p>邮箱：{{ createResult.email }}</p>
            <p>角色：{{ createResult.role === 'ADMIN' ? '管理员' : '普通用户' }}</p>
          </div>
          <el-button class="mt-4" type="primary" @click="closeCreate">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.users-page { max-width: 960px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0; }
.hint-text { color: var(--el-text-color-secondary); }
.hint-text.error { color: var(--el-color-danger); }
.footer-text { color: var(--el-text-color-placeholder); font-size: 12px; margin-top: 12px; }

.desktop-table { display: table; }
.mobile-cards { display: none; }

@media (max-width: 640px) {
  .desktop-table { display: none; }
  .mobile-cards { display: flex; flex-direction: column; gap: 10px; }

  .user-card {
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 12px;
    background: rgba(255,255,255,0.02);
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .card-id { font-size: 12px; color: var(--el-text-color-placeholder); }
  .card-field {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 13px;
  }
  .card-label { color: var(--el-text-color-secondary); flex-shrink: 0; }
  .card-value { color: var(--el-text-color-primary); text-align: right; word-break: break-all; }
  .card-actions { margin-top: 8px; display: flex; justify-content: flex-end; }
}

.reset-done { text-align: center; }
.create-done { text-align: center; }
.temp-password-box {
  margin: 16px auto;
  padding: 12px;
  background: rgba(198,161,94,0.1);
  border: 1px solid rgba(198,161,94,0.3);
  border-radius: 6px;
  text-align: center;
}
.temp-password { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
</style>
