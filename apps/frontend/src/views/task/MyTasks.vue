<template>
  <div class="my-tasks-container">
    <el-card>
      <template #header>
        <h2>📂 我的任务中心</h2>
      </template>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="我发布的" name="published">
          <div v-loading="loading">
            <el-empty v-if="publishedTasks.length === 0" description="您还没发布过任务" />
            
            <div v-else class="task-list">
              <el-card v-for="task in publishedTasks" :key="task.id" shadow="hover" class="task-card">
                <div class="card-content">
                  <div>
                    <h3 class="title">{{ task.title }}</h3>
                    <p class="desc">{{ task.description }}</p>
                    <el-tag type="danger" size="small">💰 赏金 {{ (task.price / 100).toFixed(2) }}</el-tag>
                  </div>
                  <div class="status-box">
                    <el-tag v-if="task.status === 'PENDING'" type="success">待领取</el-tag>
                    <el-tag v-else-if="task.status === 'ONGOING'" type="warning">进行中</el-tag>
                    <el-tag v-else type="info">已结束</el-tag>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我抢到的" name="orders">
          <div v-loading="loading">
            <el-empty v-if="myOrders.length === 0" description="您还没抢过单，去广场看看吧！" />
            
            <div v-else class="task-list">
              <el-card v-for="order in myOrders" :key="order.id" shadow="hover" class="task-card">
                <div class="card-content">
                  <div>
                    <h3 class="title">{{ order.task.title }}</h3>
                    <p class="desc">{{ order.task.description }}</p>
                    <el-tag type="danger" size="small">💰 赏金 {{ (order.task.price / 100).toFixed(2) }}</el-tag>
                  </div>
                  <div class="action-box">
                    <el-tag v-if="order.status === 'COMPLETED'" type="success">✅ 已完成</el-tag>
                    <el-tag v-else type="warning" effect="dark">🏃 进行中</el-tag>
                    
                    <el-button 
                      v-if="order.status === 'PENDING'" 
                      type="primary" 
                      size="small" 
                      style="margin-top: 10px;"
                      @click="handleComplete(order.id)"
                    >
                      提交验收
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import http from '../../api/http'
// 🔥 引入新加的接口
import { getMyOrders, completeOrder, type Order } from '../../api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('orders')
const loading = ref(false)
const publishedTasks = ref<any[]>([])
const myOrders = ref<Order[]>([])

const fetchPublished = async () => {
  loading.value = true
  try {
    const res: any = await http.get('/task/my-published')
    publishedTasks.value = Array.isArray(res) ? res : (res.data || [])
  } finally {
    loading.value = false
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res: any = await getMyOrders()
    myOrders.value = Array.isArray(res) ? res : (res.data || [])
  } finally {
    loading.value = false
  }
}

const handleTabClick = (tab: any) => {
  if (tab.paneName === 'published') {
    fetchPublished()
  } else {
    fetchOrders()
  }
}

// 🔥 核心：点击完成任务
const handleComplete = async (orderId: number) => {
  try {
    await ElMessageBox.confirm('确认任务已完成？系统将自动发放赏金。', '结算确认', {
      type: 'success',
      confirmButtonText: '确认提交'
    })
    
    loading.value = true
    await completeOrder(orderId) // 调用接口
    
    ElMessage.success('结算成功！赏金已到账 💰')
    
    // 刷新列表，按钮会变成“已完成”
    await fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('操作失败')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.my-tasks-container { max-width: 800px; margin: 20px auto; }
.task-list { display: flex; flex-direction: column; gap: 15px; }
.task-card { border-left: 5px solid #409EFF; }
.card-content { display: flex; justify-content: space-between; align-items: flex-start; }
.title { margin: 0 0 10px 0; font-size: 18px; }
.desc { color: #666; margin-bottom: 10px; font-size: 14px; }
.status-box, .action-box { display: flex; flex-direction: column; align-items: flex-end; }
</style>