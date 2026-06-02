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
  <div>
    <h1 class="text-2xl font-bold mb-4">用户管理</h1>

    <div v-if="loading" class="text-gray-500">加载中...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <div v-else>
      <el-table :data="users" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'SUPER_ADMIN' ? 'danger' : row.role === 'ADMIN' ? 'warning' : 'info'" size="small">
              {{ row.role === 'SUPER_ADMIN' ? '超级管理员' : row.role === 'ADMIN' ? '管理员' : row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ACTIVE' ? '正常' : '已封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}
          </template>
        </el-table-column>
      </el-table>
      <p class="text-gray-400 text-sm mt-2">共 {{ users.length }} 条记录（只读模式）</p>
    </div>
  </div>
</template>
