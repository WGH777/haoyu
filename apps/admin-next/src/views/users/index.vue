<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getUserListApi } from "@/api/user";

defineOptions({ name: "Users" });

const loading = ref(true);
const users = ref<any[]>([]);
const error = ref("");

onMounted(async () => {
  try {
    const res = await getUserListApi();
    users.value = Array.isArray(res) ? res : res?.items || res?.data || [];
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="users-page">
    <h1 class="page-title">用户管理</h1>

    <div v-if="loading" class="hint-text">加载中...</div>
    <div v-else-if="error" class="hint-text error">{{ error }}</div>

    <div v-else>
      <!-- 桌面端表格 -->
      <el-table :data="users" stripe border style="width:100%" class="desktop-table">
        <el-table-column prop="id" label="ID" width="50" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="nickname" label="昵称" min-width="100" />
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="row.role === 'SUPER_ADMIN' ? 'danger' : row.role === 'ADMIN' ? 'warning' : 'info'" size="small">
              {{ row.role === 'SUPER_ADMIN' ? '超管' : row.role === 'ADMIN' ? '管理员' : row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ACTIVE' ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="110">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}</template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片 -->
      <div class="mobile-cards">
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
        </div>
      </div>

      <p class="footer-text">{{ users.length }} 条记录</p>
    </div>
  </div>
</template>

<style scoped>
.users-page {
  max-width: 960px;
}
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 16px; }
.hint-text { color: var(--el-text-color-secondary); }
.hint-text.error { color: var(--el-color-danger); }
.footer-text { color: var(--el-text-color-placeholder); font-size: 12px; margin-top: 12px; }

/* 桌面端表格可见，移动端隐藏 */
.desktop-table { display: table; }
.mobile-cards { display: none; }

@media (max-width: 640px) {
  .desktop-table { display: none; }
  .mobile-cards { display: flex; flex-direction: column; gap: 10px; }

  .user-card {
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px;
    background: rgba(255,255,255,0.02);
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .card-id { font-size: 12px; color: var(--el-text-color-placeholder); }
  .card-field {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13px;
  }
  .card-label { color: var(--el-text-color-secondary); flex-shrink: 0; }
  .card-value { color: var(--el-text-color-primary); text-align: right; word-break: break-all; }
}
</style>
