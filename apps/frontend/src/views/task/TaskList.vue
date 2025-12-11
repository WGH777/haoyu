<template>
  <div class="task-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h2>📝 任务广场</h2>
          <el-button type="primary" size="large" @click="showCreateDialog = true">
            + 发布悬赏
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-empty v-if="tasks.length === 0" description="暂无任务，快来发布第一个吧！" />
        
        <div v-else class="task-grid">
          <el-card v-for="task in tasks" :key="task.id" class="task-item" shadow="hover">
            <template #header>
              <div class="task-header">
                <span class="task-title">{{ task.title }}</span>
                <el-tag v-if="task.status === 'PENDING'" type="success">待领取</el-tag>
                <el-tag v-else-if="task.status === 'ONGOING'" type="warning">进行中</el-tag>
                <el-tag v-else type="info">已完成</el-tag>
              </div>
            </template>
            
            <p class="task-desc">{{ task.description }}</p>
            
            <div class="task-meta">
              <el-tag type="danger" effect="plain" size="small">
                💰 赏金 {{ ((task.price || 0) / 100).toFixed(2) }} 元
              </el-tag>
            </div>

            <div class="task-footer">
              <span class="author">👤 {{ task.publisher?.nickname || '神秘人' }}</span>
              <span class="time">{{ new Date(task.createdAt).toLocaleDateString() }}</span>
            </div>

            <div style="margin-top: 15px;">
              <el-button 
                v-if="task.status === 'PENDING'"
                type="primary" 
                class="w-100" 
                @click="handleAssign(task.id)"
              >
                🚀 立即抢单
              </el-button>

              <el-button 
                v-else 
                disabled 
                class="w-100"
              >
                {{ task.status === 'ONGOING' ? '🏃 正在进行中' : '🏁 已结束' }}
              </el-button>
            </div>

          </el-card>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="发布新悬赏" width="500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="任务标题">
          <el-input v-model="form.title" placeholder="例如：帮我设计一个Logo" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" rows="4" placeholder="详细描述您的需求..." />
        </el-form-item>
        <el-form-item label="赏金预算 (元)">
          <el-input-number v-model="form.price" :min="1" :step="10" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getTaskList, createTask, assignTask } from '../../api/task' // 👈 确保这里不需要 import type Task，或者把 Task 类型定义对
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tasks = ref<any[]>([]) // 临时用 any 避免类型报错
const showCreateDialog = ref(false)
const submitting = ref(false)

const form = reactive({
  title: '',
  description: '',
  price: 100 // 🔥 修复：初始值改为 price
})

const fetchData = async () => {
  try {
    loading.value = true
    const res: any = await getTaskList()
    // 兼容后端直接返回数组或返回 { data: [] }
    tasks.value = Array.isArray(res) ? res : (res.data || [])
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!form.title || !form.description) return ElMessage.warning('请补全信息')
  
  try {
    submitting.value = true
    // 🔥 修复：发送给后端的是 price (分)
    await createTask({
      title: form.title,
      description: form.description,
      price: form.price * 100 // 元转分
    })
    
    ElMessage.success('发布成功！')
    showCreateDialog.value = false
    // 重置表单
    form.title = ''
    form.description = ''
    form.price = 100
    fetchData()
  } catch (error) {
    console.error(error)
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

const handleAssign = (id: number) => {
  ElMessageBox.confirm(
    '确定要领取这个任务吗？领取后即表示您承诺完成该任务。',
    '抢单确认',
    {
      confirmButtonText: '确定抢单',
      cancelButtonText: '再看看',
      type: 'info',
    }
  ).then(async () => {
    try {
      loading.value = true
      // 注意：你需要确保后端接口现在叫 /order (POST) 而不是 assignTask
      // 如果 api/task.ts 里 assignTask 还是旧接口，这里会报错
      await assignTask(id)
      ElMessage.success('抢单成功！')
      await fetchData()
    } catch (error) {
      // 错误已拦截
    } finally {
      loading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
.task-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 16px; margin-bottom: 10px; }
.task-desc { color: #666; margin: 10px 0; height: 40px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.5; }
.task-meta { margin-bottom: 10px; }
.task-footer { display: flex; justify-content: space-between; color: #999; font-size: 12px; margin-top: 10px; }
.w-100 { width: 100%; }
</style>