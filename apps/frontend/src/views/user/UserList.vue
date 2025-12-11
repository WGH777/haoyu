<template>
  <div class="user-list-container">
    <el-card>
      <template #header>
        <div class="header-box">
          <h2>👥 用户管理</h2>
          <el-button type="primary" @click="fetchUserList">刷新列表</el-button>
        </div>
      </template>

      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="email" label="邮箱账号" width="200" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        
        <el-table-column label="角色" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.role === 'SUPER_ADMIN'" type="danger" effect="dark">超级管理员</el-tag>
            <el-tag v-else-if="scope.row.role === 'ADMIN'" type="warning">管理员</el-tag>
            <el-tag v-else type="info">普通员工</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="balance" label="余额" width="120">
          <template #default="scope">
            ¥ {{ (scope.row.balance / 100).toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="注册时间" />

        <el-table-column label="操作" width="280">
          <template #default="scope">
            <div v-if="currentUser?.role === 'SUPER_ADMIN' && scope.row.role !== 'SUPER_ADMIN'">
              
              <el-button 
                v-if="scope.row.role === 'USER'"
                type="success" size="small" plain
                @click="handleChangeRole(scope.row, 'ADMIN')"
              >
                升职管理
              </el-button>

              <el-button 
                v-if="scope.row.role === 'ADMIN'"
                type="warning" size="small" plain
                @click="handleChangeRole(scope.row, 'USER')"
              >
                降职员工
              </el-button>

              <el-button 
                type="danger" size="small" 
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </div>
            
            <div v-else>
               <span style="color: #999; font-size: 12px;">无权操作</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 🔥 修复 1：路径修正，使用 ../../ 向上跳两层找到 api 目录
import { getUserList, deleteUser, changeUserRole, type UserItem } from '../../api/user'
import { getProfile, type UserProfile } from '../../api/user'

const users = ref<UserItem[]>([])
const loading = ref(false)
const currentUser = ref<UserProfile | null>(null)

// 1. 获取所有用户
const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList()
    // 兼容处理：有些接口直接返回数组，有些返回 { data: [] }
    users.value = Array.isArray(res) ? res : (res as any).data || []
  } catch (error: any) {
    console.error('获取用户列表失败', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 2. 获取当前登录者身份
const fetchCurrentUser = async () => {
  try {
    const res = await getProfile()
    currentUser.value = res
  } catch (error: any) {
    console.error('获取个人信息失败', error)
  }
}

// 3. 删除用户
const handleDelete = (row: UserItem) => {
  ElMessageBox.confirm(`确认删除用户 "${row.nickname}" 吗？此操作不可逆！`, '警告', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  }).then(async () => {
    // 🔥 修复 2：给 error 加上 :any 类型，解决 'unknown' 报错
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUserList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  })
}

// 4. 修改角色
const handleChangeRole = (row: UserItem, newRole: 'USER' | 'ADMIN') => {
  const actionText = newRole === 'ADMIN' ? '提拔为管理员' : '降职为普通员工'
  
  ElMessageBox.confirm(`确认将 "${row.nickname}" ${actionText} 吗？`, '权限变更', {
    type: 'info',
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(async () => {
    // 🔥 修复 2：给 error 加上 :any 类型
    try {
      await changeUserRole(row.id, newRole)
      ElMessage.success('权限变更成功！')
      fetchUserList()
    } catch (error: any) {
      console.error(error)
      // 错误通常由拦截器处理，这里只做兜底
    }
  })
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchUserList()
})
</script>

<style scoped>
.user-list-container { max-width: 1200px; margin: 20px auto; }
.header-box { display: flex; justify-content: space-between; align-items: center; }
</style>