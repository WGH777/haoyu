<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAdminTasksApi } from "@/api/user";

defineOptions({ name: "Tasks" });

const loading = ref(true);
const tasks = ref<any[]>([]);
const error = ref("");
const filterStatus = ref("");

onMounted(fetchTasks);

async function fetchTasks() {
  loading.value = true;
  try {
    const params: any = {};
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await getAdminTasksApi(params);
    tasks.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

const statusLabels: Record<string, string> = {
  PENDING: "待接单", ASSIGNED: "已分配", SUBMITTED: "已提交",
  COMPLETED: "已完成", CANCELLED: "已取消", ONGOING: "进行中"
};
const statusColors: Record<string, string> = {
  PENDING: "info", ASSIGNED: "warning", SUBMITTED: "",
  COMPLETED: "success", CANCELLED: "danger", ONGOING: "warning"
};

const detailVisible = ref(false);
const detailTask = ref<any>(null);
function showDetail(task: any) { detailTask.value = task; detailVisible.value = true; }
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">任务管理</h1>
    <div class="flex items-center gap-3 mb-4">
      <el-select v-model="filterStatus" placeholder="全部状态" clearable size="small" style="width:140px" @change="fetchTasks">
        <el-option v-for="(label, key) in statusLabels" :key="key" :label="label" :value="key" />
      </el-select>
    </div>

    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <el-table v-else :data="tasks" stripe border size="small" style="width:100%">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
      <el-table-column label="金额" width="90">
        <template #default="{ row }">¥{{ (row.price / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="statusColors[row.status] || 'info'" size="small">{{ statusLabels[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布者" min-width="100">
        <template #default="{ row }">{{ row.publisher?.nickname || '#' + row.publisherId }}</template>
      </el-table-column>
      <el-table-column label="时间" width="100">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="详情" width="70" fixed="right">
        <template #default="{ row }"><el-button size="small" @click="showDetail(row)">查看</el-button></template>
      </el-table-column>
    </el-table>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="任务详情" size="400px">
      <template v-if="detailTask">
        <p><b>ID:</b> {{ detailTask.id }}</p>
        <p><b>标题:</b> {{ detailTask.title }}</p>
        <p><b>金额:</b> ¥{{ (detailTask.price / 100).toFixed(2) }}</p>
        <p><b>状态:</b> {{ statusLabels[detailTask.status] || detailTask.status }}</p>
        <p><b>发布者:</b> {{ detailTask.publisher?.nickname || detailTask.publisherId }}</p>
        <p><b>描述:</b> {{ detailTask.description || '无' }}</p>
        <p><b>分类:</b> {{ detailTask.category }}</p>
        <p><b>浏览量:</b> {{ detailTask.views }}</p>
        <p><b>创建时间:</b> {{ new Date(detailTask.createdAt).toLocaleString('zh-CN') }}</p>
      </template>
    </el-drawer>
  </div>
</template>
