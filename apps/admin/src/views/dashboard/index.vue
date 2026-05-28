<script setup lang="ts">
import { ref, onMounted } from "vue";
import { healthCheckApi, getProfileApi } from "@/api/user";
import { getUserInfo } from "@/utils/auth";

defineOptions({ name: "Dashboard" });

const apiStatus = ref<"loading" | "ok" | "error">("loading");
const userInfo = ref<any>(null);
const serverTime = ref("");

const checkHealth = async () => {
  try {
    await healthCheckApi();
    apiStatus.value = "ok";
  } catch {
    apiStatus.value = "error";
  }
};

const loadUser = async () => {
  try {
    const res = await getProfileApi();
    userInfo.value = res.data ?? res;
  } catch {
    userInfo.value = getUserInfo();
  }
};

const updateTime = () => {
  serverTime.value = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
};

onMounted(() => {
  checkHealth();
  loadUser();
  updateTime();
  setInterval(updateTime, 1000);
});

const roleLabel = (role: string) => {
  const m: Record<string, string> = { SUPER_ADMIN: "超级管理员", ADMIN: "管理员", USER: "普通用户" };
  return m[role] || role;
};

/** 待建设模块 */
const pendingModules = [
  { name: "用户管理", status: "waiting", desc: "用户列表、角色管理、权限分配 — 等待接入真实接口" },
  { name: "任务管理", status: "waiting", desc: "任务审核、强制取消、完成确认 — 等待接入真实接口" },
  { name: "钱包监控", status: "waiting", desc: "资金流水、余额监控、异常预警 — 等待接入真实接口" },
  { name: "仲裁中心", status: "waiting", desc: "争议处理、仲裁裁决 — 等待接入真实接口" },
  { name: "审计日志", status: "waiting", desc: "管理员操作日志查询 — 等待后端接口" },
  { name: "系统设置", status: "waiting", desc: "平台参数、通知配置 — 等待接入真实接口" }
];
</script>

<template>
  <div class="dashboard">
    <h2 class="page-title">总览</h2>

    <!-- 状态卡片 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-label">API 状态</div>
          <div class="stat-value">
            <el-tag v-if="apiStatus === 'ok'" type="success" effect="dark">🟢 运行中</el-tag>
            <el-tag v-else-if="apiStatus === 'error'" type="danger" effect="dark">🔴 不可用</el-tag>
            <el-tag v-else type="info">⏳ 检测中...</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-label">当前用户</div>
          <div class="stat-value" v-if="userInfo">
            {{ userInfo.nickname || userInfo.email || "—" }}
          </div>
          <div class="stat-sub" v-if="userInfo">
            {{ roleLabel(userInfo.role) }}
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-label">服务器时间</div>
          <div class="stat-value">{{ serverTime }}</div>
          <div class="stat-sub">后台版本 v0.1.0</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待建设模块 -->
    <h3 class="section-title">模块建设状态</h3>
    <el-row :gutter="20">
      <el-col
        v-for="m in pendingModules"
        :key="m.name"
        :xs="24" :sm="12" :md="8"
        style="margin-bottom: 16px"
      >
        <el-card class="module-card" shadow="never">
          <div class="module-header">
            <span class="module-name">{{ m.name }}</span>
            <el-tag size="small" type="warning">接口建设中</el-tag>
          </div>
          <div class="module-desc">{{ m.desc }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 28px 0 16px 0;
  color: var(--el-text-color-primary);
}

.stat-card {
  margin-bottom: 16px;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.module-card {
  height: 100%;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.module-name {
  font-size: 15px;
  font-weight: 600;
}

.module-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
