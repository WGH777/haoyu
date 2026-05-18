<template>
  <div class="my-tasks-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h2>📋 我的任务</h2>
          <el-button :icon="Refresh" @click="fetchData" circle />
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 我接取的任务 -->
        <el-tab-pane label="我接取的任务" name="assigned">
          <div v-loading="loading">
            <!-- 状态筛选 -->
            <div class="filter-bar">
              <span class="filter-label">状态：</span>
              <el-radio-group v-model="orderStatusFilter" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="ASSIGNED">进行中</el-radio-button>
                <el-radio-button label="SUBMITTED">待验收</el-radio-button>
                <el-radio-button label="COMPLETED">已完成</el-radio-button>
                <el-radio-button label="CANCELLED">已取消</el-radio-button>
              </el-radio-group>
            </div>

            <el-empty
              v-if="filteredAssignedOrders.length === 0"
              description="暂无符合条件的任务"
            />

            <el-table
              v-else
              :data="filteredAssignedOrders"
              stripe
              style="width: 100%"
            >
              <el-table-column label="任务标题" min-width="180">
                <template #default="scope">
                  <el-link
                    type="primary"
                    @click="goToDetail(scope.row.taskId)"
                  >
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

              <!-- 子任务进度 -->
              <el-table-column label="进度" width="180">
                <template #default="scope">
                  <div class="progress-cell">
                    <!-- 有子任务：显示进度条 + “已完成/总数” -->
                    <template v-if="hasSubTasks(scope.row.task)">
                      <el-progress
                        :percentage="calcSubTaskProgress(scope.row.task)"
                        :stroke-width="10"
                        :show-text="false"
                      />
                      <span class="progress-text">
                        {{ formatSubTaskFraction(scope.row.task) }}
                      </span>
                    </template>

                    <!-- 没有子任务：显示“未拆分” -->
                    <template v-else>
                      <span class="progress-none">未拆分</span>
                    </template>
                  </div>
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
                  <el-button
                    v-else-if="scope.row.status === 'CANCELLED'"
                    type="danger"
                    size="small"
                    disabled
                  >
                    已取消
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 我发布的任务 -->
        <el-tab-pane label="我发布的任务" name="published">
          <div v-loading="loading">
            <!-- 状态筛选 -->
            <div class="filter-bar">
              <span class="filter-label">状态：</span>
              <el-radio-group v-model="taskStatusFilter" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="PENDING">待领取</el-radio-button>
                <el-radio-button label="ASSIGNED">进行中</el-radio-button>
                <el-radio-button label="SUBMITTED">待验收</el-radio-button>
                <el-radio-button label="COMPLETED">已完成</el-radio-button>
                <el-radio-button label="CANCELLED">已取消</el-radio-button>
              </el-radio-group>
            </div>

            <el-empty
              v-if="filteredPublishedTasks.length === 0"
              description="暂无符合条件的任务"
            />

            <el-table
              v-else
              :data="filteredPublishedTasks"
              stripe
              style="width: 100%"
            >
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

              <!-- 子任务进度 -->
              <el-table-column label="进度" width="180">
                <template #default="scope">
                  <div class="progress-cell">
                    <template v-if="hasSubTasks(scope.row)">
                      <el-progress
                        :percentage="calcSubTaskProgress(scope.row)"
                        :stroke-width="10"
                        :show-text="false"
                      />
                      <span class="progress-text">
                        {{ formatSubTaskFraction(scope.row) }}
                      </span>
                    </template>
                    <template v-else>
                      <span class="progress-none">未拆分</span>
                    </template>
                  </div>
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
                    @click="goToDetail(scope.row.id)"
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders, type OrderItem } from '@/api/order'
import { getMyPublishedTasks, type Task } from '@/api/task'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref<'assigned' | 'published'>('assigned')

// 原始数据
const assignedOrders = ref<OrderItem[]>([])
const publishedTasks = ref<Task[]>([])
const loading = ref(false)

// 状态筛选 - 我接取的任务（订单状态）
const orderStatusFilter = ref<
  'all' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED'
>('all')

// 状态筛选 - 我发布的任务（任务状态）
const taskStatusFilter = ref<
  'all' | 'PENDING' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED'
>('all')

// 计算：过滤后的数据 - 我接取的任务
const filteredAssignedOrders = computed(() => {
  if (orderStatusFilter.value === 'all') return assignedOrders.value
  return assignedOrders.value.filter(
    (o) => o.status === orderStatusFilter.value,
  )
})

// 计算：过滤后的数据 - 我发布的任务
const filteredPublishedTasks = computed(() => {
  if (taskStatusFilter.value === 'all') return publishedTasks.value
  return publishedTasks.value.filter(
    (t) => t.status === taskStatusFilter.value,
  )
})

/**
 * 拉取我接取的任务（订单）
 */
const fetchAssignedOrders = async () => {
  const res = await getMyOrders()
  assignedOrders.value = Array.isArray(res) ? res : []
}

/**
 * 拉取我发布的任务
 */
const fetchPublishedTasks = async () => {
  const res = await getMyPublishedTasks()
  publishedTasks.value = Array.isArray(res) ? res : []
}

/**
 * 根据当前 Tab 拉取对应数据
 */
const fetchData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'assigned') {
      await fetchAssignedOrders()
    } else {
      await fetchPublishedTasks()
    }
  } catch (error) {
    console.error('获取我的任务失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * Tab 切换时重置对应筛选，并刷新数据
 */
const handleTabChange = (name: string | number) => {
  if (name === 'assigned') {
    orderStatusFilter.value = 'all'
  } else {
    taskStatusFilter.value = 'all'
  }
  fetchData()
}

// --- 状态 & 进度显示 ---

/**
 * 状态对应的标签颜色
 */
const getStatusTag = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'info',
    ASSIGNED: 'warning',
    ONGOING: 'warning',
    SUBMITTED: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'danger',
  }
  return map[status] || 'info'
}

/**
 * 状态对应的中文文案
 */
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待领取',
    ASSIGNED: '进行中',
    ONGOING: '进行中',
    SUBMITTED: '待验收',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return map[status] || status
}

/**
 * 是否有子任务
 */
const hasSubTasks = (task?: Task) => {
  return !!task && Array.isArray(task.subTasks) && task.subTasks.length > 0
}

/**
 * 计算子任务完成百分比（仅在有子任务时调用）
 */
const calcSubTaskProgress = (task?: Task) => {
  if (!hasSubTasks(task)) return 0
  const total = task!.subTasks!.length
  const done = task!.subTasks!.filter((s) => s.isDone).length
  return Math.round((done / total) * 100)
}

/**
 * 显示 “已完成/总数”
 */
const formatSubTaskFraction = (task?: Task) => {
  if (!hasSubTasks(task)) return '0/0'
  const total = task!.subTasks!.length
  const done = task!.subTasks!.filter((s) => s.isDone).length
  return `${done}/${total}`
}

/**
 * 跳转任务详情
 */
const goToDetail = (taskId: number) => {
  router.push(`/task/${taskId}`)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.my-tasks-container {
  max-width: 1200px;
  margin: 20px auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 筛选条 */
.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.filter-label {
  margin-right: 8px;
  color: #94a3b8;
  font-size: 13px;
}

/* 进度单元格 */
.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: #94a3b8;
  min-width: 40px;
}

.progress-none {
  font-size: 12px;
  color: #64748b;
}
</style>
