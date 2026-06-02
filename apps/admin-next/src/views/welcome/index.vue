<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getUserListApi, getAdminTasksApi, getAuditLogsApi } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import TeamIcon from "~icons/ri/team-line";
import TaskIcon from "~icons/ri/task-line";
import AuditIcon from "~icons/ri/file-search-line";
import WalletIcon from "~icons/ri/money-cny-circle-line";
import OrderIcon from "~icons/ri/file-list-3-line";
import ScaleIcon from "~icons/ri/scales-line";

defineOptions({ name: "Dashboard" });

const router = useRouter();
const loading = ref(true);
const stats = reactive({
  users: 0,
  tasks: 0,
  auditLogs: 0,
  error: ""
});
import { reactive } from "vue";

onMounted(async () => {
  try {
    const [users, tasks, logs] = await Promise.all([
      getUserListApi({ page: 1, pageSize: 1 }),
      getAdminTasksApi({ page: 1, pageSize: 1 }),
      getAuditLogsApi({ page: 1, pageSize: 1 })
    ]);
    stats.users = Array.isArray(users) ? users.length : 0;
    stats.tasks = Array.isArray(tasks) ? tasks.length : 0;
    stats.auditLogs = logs?.total || 0;
  } catch (e: any) {
    stats.error = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
});

function go(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="dashboard-haoyu">
    <!-- 欢迎区 -->
    <div class="welcome-section">
      <div class="welcome-icon">🏮</div>
      <div>
        <h1 class="welcome-title">浩煜灯火站</h1>
        <p class="welcome-subtitle">管理后台 · 可信协作平台</p>
      </div>
    </div>

    <p class="governance-desc">平台治理中心 — 监控数据、管理用户、追踪日志、处理仲裁，维护可信协作秩序</p>

    <!-- 数据卡片 -->
    <div v-if="loading" class="loading-hint">数据加载中...</div>
    <div v-else-if="stats.error" class="error-hint">{{ stats.error }}</div>
    <div v-else class="stats-grid">
      <div class="stat-card stat-users" @click="go('/admin/users')">
        <span class="stat-icon"><component :is="useRenderIcon(TeamIcon)" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.users }}</span>
          <span class="stat-label">注册用户</span>
        </div>
        <span class="stat-arrow">→</span>
      </div>
      <div class="stat-card stat-tasks" @click="go('/admin/tasks')">
        <span class="stat-icon"><component :is="useRenderIcon(TaskIcon)" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.tasks }}</span>
          <span class="stat-label">平台任务</span>
        </div>
        <span class="stat-arrow">→</span>
      </div>
      <div class="stat-card stat-audit" @click="go('/admin/audit')">
        <span class="stat-icon"><component :is="useRenderIcon(AuditIcon)" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.auditLogs || 0 }}</span>
          <span class="stat-label">治理记录</span>
        </div>
        <span class="stat-arrow">→</span>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="shortcuts-section">
      <h2 class="section-title">快捷入口</h2>
      <div class="shortcuts-grid">
        <button class="shortcut-btn" @click="go('/admin/users')">
          <span class="shortcut-icon">👤</span> 用户管理
        </button>
        <button class="shortcut-btn" @click="go('/admin/tasks')">
          <span class="shortcut-icon">📋</span> 任务管理
        </button>
        <button class="shortcut-btn" @click="go('/admin/orders')">
          <span class="shortcut-icon">📦</span> 订单管理
        </button>
        <button class="shortcut-btn" @click="go('/admin/wallet')">
          <span class="shortcut-icon">💰</span> 钱包监控
        </button>
        <button class="shortcut-btn" @click="go('/admin/arbitration')">
          <span class="shortcut-icon">⚖️</span> 仲裁中心
        </button>
        <button class="shortcut-btn" @click="go('/admin/audit')">
          <span class="shortcut-icon">🔍</span> 审计日志
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-haoyu {
  max-width: 960px;
}

/* ── 欢迎区 ── */
.welcome-section {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
}
.welcome-icon {
  font-size: 40px;
  line-height: 1;
}
.welcome-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #d4a853 0%, #e8d5a3 50%, #c6a15e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.welcome-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 2px 0 0;
  letter-spacing: 4px;
}
.governance-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 20px;
  opacity: 0.7;
}
.loading-hint, .error-hint {
  padding: 32px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.error-hint { color: var(--el-color-danger); }

/* ── 数据卡片 ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
  border: 1px solid rgba(255,255,255,0.06);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.stat-card:active { transform: translateY(0); }

.stat-users {
  background: linear-gradient(135deg, rgba(198,161,94,0.12), rgba(198,161,94,0.04));
}
.stat-tasks {
  background: linear-gradient(135deg, rgba(64,158,255,0.1), rgba(64,158,255,0.03));
}
.stat-audit {
  background: linear-gradient(135deg, rgba(103,194,58,0.1), rgba(103,194,58,0.03));
}

.stat-icon {
  font-size: 28px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.stat-body { display: flex; flex-direction: column; flex: 1; }
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}
.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.stat-arrow {
  font-size: 18px;
  color: var(--el-text-color-placeholder);
  opacity: 0.5;
  transition: opacity .15s;
}
.stat-card:hover .stat-arrow { opacity: 1; }

/* ── 快捷入口 ── */
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--el-text-color-primary);
}
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.shortcut-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.shortcut-btn:hover {
  background: rgba(198,161,94,0.08);
  border-color: rgba(198,161,94,0.2);
}
.shortcut-icon { font-size: 16px; }

/* ── 移动端 ── */
@media (max-width: 640px) {
  .stats-grid { grid-template-columns: 1fr; }
  .shortcuts-grid { grid-template-columns: repeat(2, 1fr); }
  .welcome-title { font-size: 18px; }
  .stat-value { font-size: 22px; }
}
</style>
