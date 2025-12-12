<template>
  <div class="my-tasks-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h2>🎯 我的任务</h2>
          <el-button :icon="Refresh" @click="fetchData" circle />
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="fetchData">
        <el-tab-pane label="我接取的任务" name="assigned">
          <div v-loading="loading">
            <el-empty v-if="assignedOrders.length === 0" description="您还没有接取任何任务" />
            
            <el-table v-else :data="assignedOrders" stripe style="width: 100%">
              <el-table-column label="任务标题" min-width="180">
                <template #default="scope">
                  <el-link type="primary" @click="goToDetail(scope.row.taskId)">
                    {{ scope.row.task.title }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column label="发布人" width="120">
                <template #default="scope">
                  {{ scope.row.task.publisher?.nickname || 'N/A' }}
                </template>
              </el-table-column>
              <el-table-column label="赏金" width="100">
                <template #default="scope">
                  ¥ {{ (scope.row.task.price / 100).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="getStatusTag(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="scope">
                  <el-button 
                    v-if="scope.row.status === 'ASSIGNED'" 
                    type="success" 
                    size="small"
                    @click="goToDetail(scope.row.taskId)"
                  >
                    去提交成果
                  </el-button>
                  <el-button 
                    v-else-if="scope.row.status === 'SUBMITTED'" 
                    type="warning" 
                    size="small"
                    disabled
                  >
                    待验收
                  </el-button>
                  <el-button 
                    v-else-if="scope.row.status === 'COMPLETED'" 
                    type="info" 
                    size="small"
                    disabled
                  >
                    已结算
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我发布的任务" name="published">
          <div v-loading="loading">
            <el-empty v-if="publishedTasks.length === 0" description="您还没有发布任何任务" />
            
            <el-table v-else :data="publishedTasks" stripe style="width: 100%">
              <el-table-column label="任务标题" min-width="180">
                <template #default="scope">
                  <el-link type="primary" @click="goToDetail(scope.row.id)">
                    {{ scope.row.title }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column label="赏金" width="100">
                <template #default="scope">
                  ¥ {{ (scope.row.price / 100).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="getStatusTag(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="发布时间" width="180">
                <template #default="scope">
                  {{ new Date(scope.row.createdAt).toLocaleDateString() }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="scope">
                  <el-button 
                    v-if="scope.row.status === 'SUBMITTED'" 
                    type="danger" 
                    size="small"
                    @click="goToDetail(scope.row.id)"
                  >
                    去验收
                  </el-button>
                  <el-button 
                    v-else 
                    type="info" 
                    size="small"
                    disabled
                  >
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders } from '@/api/order' 
import { getMyPublishedTasks } from '@/api/task' 
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('assigned') // 默认显示接取的任务

const assignedOrders = ref<any[]>([]) 
const publishedTasks = ref<any[]>([]) 

const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'assigned') {
      const res: any = await getMyOrders()
      assignedOrders.value = Array.isArray(res) ? res : []
    } else if (activeTab.value === 'published') {
      const res: any = await getMyPublishedTasks()
      publishedTasks.value = Array.isArray(res) ? res : []
    }
  } catch (error) {
    console.error('获取我的任务失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

const getStatusTag = (status: string) => {
  const map: any = { 
    PENDING: 'success',    
    ASSIGNED: 'warning',   
    ONGOING: 'warning',    
    SUBMITTED: 'primary',  
    COMPLETED: 'info',
    CANCELLED: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: any = { 
    PENDING: '待领取', 
    ASSIGNED: '进行中', 
    ONGOING: '进行中', 
    SUBMITTED: '待验收', 
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

const goToDetail = (taskId: number) => {
  router.push(`/task/${taskId}`)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.my-tasks-container { max-width: 1200px; margin: 20px auto; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>