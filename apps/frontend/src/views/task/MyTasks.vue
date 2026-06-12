<template>
  <div class="my-tasks-container">
    <section class="tasks-hero">
      <div>
        <span class="eyebrow">Task Workspace</span>
        <h2>我的任务</h2>
        <p>集中查看我接取的协作与我发布的需求，跟踪进度、验收状态和下一步操作。</p>
      </div>
      <el-button class="refresh-btn" :icon="Refresh" :loading="loading" @click="fetchData">刷新</el-button>
    </section>

    <section class="workspace-panel" v-loading="loading">
      <div class="workspace-tabs" role="tablist" aria-label="任务视角">
        <button type="button" :class="{ active: activeTab === 'assigned' }" @click="switchTab('assigned')"><span>我接取的任务</span><b>{{ assignedOrders.length }}</b></button>
        <button type="button" :class="{ active: activeTab === 'published' }" @click="switchTab('published')"><span>我发布的任务</span><b>{{ publishedTasks.length }}</b></button>
      </div>

      <div class="summary-strip">
        <article v-for="item in currentSummary" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></article>
      </div>

      <div v-if="activeTab === 'assigned'" class="task-section">
        <div class="section-toolbar">
          <div><span class="toolbar-kicker">Accepted</span><h3>我接取的任务</h3></div>
          <div class="filter-chips" aria-label="接取任务状态筛选">
            <button v-for="option in assignedFilterOptions" :key="option.value" type="button" :class="{ active: orderStatusFilter === option.value }" @click="orderStatusFilter = option.value">{{ option.label }}</button>
          </div>
        </div>

        <div v-if="filteredAssignedOrders.length === 0" class="task-empty">
          <span class="empty-mark">灯</span><strong>暂无符合条件的任务</strong><p>接取任务后，协作进度、提交成果和结算状态会在这里汇总。</p>
        </div>

        <div v-else class="task-card-list">
          <article v-for="order in filteredAssignedOrders" :key="order.id" class="workspace-task-card" @click="goToDetail(order.taskId)">
            <div class="task-card-top"><span class="status-pill" :class="getStatusTone(order.status)">{{ getStatusText(order.status) }}</span><span class="task-price">{{ formatMoney(order.task?.price) }}</span></div>
            <h4>{{ order.task?.title || '未命名任务' }}</h4>
            <p>{{ order.task?.description || '发布者暂未填写任务说明。' }}</p>
            <div class="task-meta-grid"><span>发布者 <b>{{ order.task?.publisher?.nickname || order.task?.publisher?.email || 'N/A' }}</b></span><span>进度 <b>{{ formatSubTaskFraction(order.task) }}</b></span><span>更新时间 <b>{{ formatDate(order.updatedAt || order.createdAt || order.task?.updatedAt) }}</b></span></div>
            <div class="progress-row"><div class="progress-track"><i :style="{ width: calcSubTaskProgress(order.task) + '%' }"></i></div><span>{{ calcSubTaskProgress(order.task) }}%</span></div>
            <div class="card-actions"><button type="button" class="ghost-action" @click.stop="goToDetail(order.taskId)">{{ getActionText(order.status) }}</button></div>
          </article>
        </div>
      </div>

      <div v-else class="task-section">
        <div class="section-toolbar">
          <div><span class="toolbar-kicker">Published</span><h3>我发布的任务</h3></div>
          <div class="filter-chips" aria-label="发布任务状态筛选">
            <button v-for="option in publishedFilterOptions" :key="option.value" type="button" :class="{ active: taskStatusFilter === option.value }" @click="taskStatusFilter = option.value">{{ option.label }}</button>
          </div>
        </div>

        <div v-if="filteredPublishedTasks.length === 0" class="task-empty">
          <span class="empty-mark">需</span><strong>暂无符合条件的任务</strong><p>发布需求后，接单、提交、验收和结算状态会在这里形成清晰链路。</p>
        </div>

        <div v-else class="task-card-list">
          <article v-for="task in filteredPublishedTasks" :key="task.id" class="workspace-task-card" @click="goToDetail(task.id)">
            <div class="task-card-top"><span class="status-pill" :class="getStatusTone(task.status)">{{ getStatusText(task.status) }}</span><span class="task-price">{{ formatMoney(task.price) }}</span></div>
            <h4>{{ task.title }}</h4>
            <p>{{ task.description || '暂未填写任务说明。' }}</p>
            <div class="task-meta-grid"><span>发布时间 <b>{{ formatDate(task.createdAt) }}</b></span><span>进度 <b>{{ formatSubTaskFraction(task) }}</b></span><span>分类 <b>{{ task.category || '未分类' }}</b></span></div>
            <div class="progress-row"><div class="progress-track"><i :style="{ width: calcSubTaskProgress(task) + '%' }"></i></div><span>{{ calcSubTaskProgress(task) }}%</span></div>
            <div class="card-actions"><button type="button" class="ghost-action" @click.stop="goToDetail(task.id)">{{ getPubActionText(task.status) }}</button></div>
          </article>
        </div>
      </div>
    </section>
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
const assignedOrders = ref<OrderItem[]>([])
const publishedTasks = ref<Task[]>([])
const loading = ref(false)
const orderStatusFilter = ref<'all' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED'>('all')
const taskStatusFilter = ref<'all' | 'PENDING' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED'>('all')
type AssignedFilter = typeof orderStatusFilter.value
type PublishedFilter = typeof taskStatusFilter.value
const assignedFilterOptions: Array<{ value: AssignedFilter; label: string }> = [{ value: 'all', label: '全部' }, { value: 'ASSIGNED', label: '进行中' }, { value: 'SUBMITTED', label: '待验收' }, { value: 'COMPLETED', label: '已完成' }, { value: 'CANCELLED', label: '已取消' }]
const publishedFilterOptions: Array<{ value: PublishedFilter; label: string }> = [{ value: 'all', label: '全部' }, { value: 'PENDING', label: '待领取' }, { value: 'ASSIGNED', label: '进行中' }, { value: 'SUBMITTED', label: '待验收' }, { value: 'COMPLETED', label: '已完成' }, { value: 'CANCELLED', label: '已取消' }]
const filteredAssignedOrders = computed(() => orderStatusFilter.value === 'all' ? assignedOrders.value : assignedOrders.value.filter((o) => o.status === orderStatusFilter.value))
const filteredPublishedTasks = computed(() => taskStatusFilter.value === 'all' ? publishedTasks.value : publishedTasks.value.filter((t) => t.status === taskStatusFilter.value))
const currentSummary = computed(() => {
  const source = activeTab.value === 'assigned' ? assignedOrders.value : publishedTasks.value
  return [{ label: '全部', value: source.length }, { label: '进行中', value: source.filter((item: any) => ['ASSIGNED', 'ONGOING'].includes(item.status)).length }, { label: '待验收', value: source.filter((item: any) => item.status === 'SUBMITTED').length }, { label: '已完成', value: source.filter((item: any) => item.status === 'COMPLETED').length }]
})
const fetchAssignedOrders = async () => { const res = await getMyOrders(); assignedOrders.value = Array.isArray(res) ? res : [] }
const fetchPublishedTasks = async () => { const res = await getMyPublishedTasks(); publishedTasks.value = Array.isArray(res) ? res : [] }
const fetchData = async () => { loading.value = true; try { if (activeTab.value === 'assigned') await fetchAssignedOrders(); else await fetchPublishedTasks() } catch (error) { console.error('获取我的任务失败:', error); ElMessage.error('获取任务列表失败') } finally { loading.value = false } }
const handleTabChange = (name: string | number) => { if (name === 'assigned') orderStatusFilter.value = 'all'; else taskStatusFilter.value = 'all'; fetchData() }
const switchTab = (name: 'assigned' | 'published') => { if (activeTab.value === name) return; activeTab.value = name; handleTabChange(name) }
const getStatusText = (status: string) => ({ PENDING: '待领取', ASSIGNED: '进行中', ONGOING: '进行中', SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消' } as Record<string, string>)[status] || status
const getStatusTone = (status: string) => ({ PENDING: 'gold', ASSIGNED: 'blue', ONGOING: 'blue', SUBMITTED: 'amber', COMPLETED: 'green', CANCELLED: 'copper' } as Record<string, string>)[status] || 'muted'
const hasSubTasks = (task?: Task) => !!task && Array.isArray(task.subTasks) && task.subTasks.length > 0
const calcSubTaskProgress = (task?: Task) => { if (!hasSubTasks(task)) return 0; const total = task!.subTasks!.length; const done = task!.subTasks!.filter((s) => s.isDone).length; return Math.round((done / total) * 100) }
const formatSubTaskFraction = (task?: Task) => { if (!hasSubTasks(task)) return '未拆分'; const total = task!.subTasks!.length; const done = task!.subTasks!.filter((s) => s.isDone).length; return done + '/' + total }
const formatMoney = (value?: number | null) => { const amount = Number(value || 0) / 100; if (!Number.isFinite(amount)) return '0 煜米'; return amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) + ' 煜米' }
const formatDate = (value?: string) => { if (!value) return '暂无'; const date = new Date(value); if (Number.isNaN(date.getTime())) return '暂无'; return date.toLocaleDateString('zh-CN') }
const goToDetail = (taskId: number) => { router.push('/task/' + taskId) }
onMounted(() => { fetchData() })
const getActionText = (status: string) => ({ ASSIGNED: '去提交成果', SUBMITTED: '待发布方验收', COMPLETED: '查看结算详情', CANCELLED: '查看取消记录' } as Record<string, string>)[status] || '查看详情'
const getPubActionText = (status: string) => ({ SUBMITTED: '去验收', PENDING: '查看详情', ASSIGNED: '查看协作进度', COMPLETED: '查看结算详情', CANCELLED: '查看取消记录' } as Record<string, string>)[status] || '查看详情'
</script>

<style scoped>
.my-tasks-container { position: relative; max-width: 1120px; margin: 0 auto; padding: 28px; color: #fff2d6; overflow: hidden; }
.my-tasks-container::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: 28px; background: radial-gradient(circle at 16% 12%, rgba(255, 214, 145, .16), transparent 25%), radial-gradient(circle at 86% 16%, rgba(95, 124, 166, .16), transparent 28%), radial-gradient(circle at 50% 88%, rgba(242, 179, 77, .10), transparent 32%), linear-gradient(180deg, rgba(5, 10, 20, .78), rgba(5, 10, 20, .96)); }
.tasks-hero { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; padding: 32px; border: 1px solid rgba(255, 214, 145, .18); border-radius: 24px; background: linear-gradient(120deg, rgba(8, 14, 28, .88), rgba(10, 24, 42, .64)), radial-gradient(circle at 88% 18%, rgba(255, 214, 145, .16), transparent 28%); box-shadow: 0 24px 58px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.06); }
.eyebrow, .toolbar-kicker { color: #ffd073; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.tasks-hero h2 { margin: 8px 0 10px; color: #ffe8ae; font-size: 34px; line-height: 1.15; }
.tasks-hero p { max-width: 640px; margin: 0; color: rgba(255,232,196,.66); line-height: 1.8; }
.refresh-btn { border: 1px solid rgba(255,214,145,.24); border-radius: 999px; background: linear-gradient(135deg, #ffe8ae, #f2b34d); color: #281704; font-weight: 800; box-shadow: 0 16px 34px rgba(242,179,77,.20); }
.workspace-panel { margin-top: 22px; padding: 22px; border: 1px solid rgba(255,214,145,.14); border-radius: 24px; background: rgba(4,9,17,.42); box-shadow: inset 0 1px 0 rgba(255,255,255,.045); }
.workspace-tabs { display: inline-flex; gap: 8px; padding: 6px; border: 1px solid rgba(255,214,145,.14); border-radius: 999px; background: rgba(255,255,255,.045); }
.workspace-tabs button, .filter-chips button, .ghost-action { border: 1px solid rgba(255,214,145,.14); border-radius: 999px; background: rgba(255,255,255,.04); color: rgba(255,232,196,.70); cursor: pointer; transition: all .18s ease; }
.workspace-tabs button { display: inline-flex; align-items: center; gap: 10px; min-height: 38px; padding: 0 16px; font-weight: 800; }
.workspace-tabs b { min-width: 24px; height: 24px; display: grid; place-items: center; border-radius: 999px; color: #1f1304; background: rgba(255,214,145,.75); font-size: 12px; }
.workspace-tabs button.active, .filter-chips button.active, .ghost-action:hover { border-color: rgba(255,214,145,.48); color: #2a1a05; background: linear-gradient(135deg, #ffe8ae, #f2b34d); box-shadow: 0 12px 26px rgba(242,179,77,.18); }
.summary-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0 22px; }
.summary-strip article { padding: 16px; border: 1px solid rgba(255,214,145,.12); border-radius: 16px; background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025)); }
.summary-strip span { display: block; color: rgba(255,232,196,.58); font-size: 12px; }
.summary-strip strong { display: block; margin-top: 6px; color: #ffe8ae; font-size: 24px; font-variant-numeric: tabular-nums; }
.section-toolbar { display: flex; justify-content: space-between; gap: 20px; align-items: flex-end; margin-bottom: 16px; }
.section-toolbar h3 { margin: 6px 0 0; color: #fff7dd; font-size: 24px; }
.filter-chips { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.filter-chips button { min-height: 32px; padding: 0 12px; font-size: 13px; }
.task-card-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.workspace-task-card { min-height: 252px; display: flex; flex-direction: column; padding: 18px; border: 1px solid rgba(255,214,145,.14); border-radius: 18px; background: radial-gradient(circle at 90% 14%, rgba(255,214,145,.11), transparent 28%), linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.026)); box-shadow: inset 0 1px 0 rgba(255,255,255,.055); cursor: pointer; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
.workspace-task-card:hover { transform: translateY(-2px); border-color: rgba(255,214,145,.30); box-shadow: 0 18px 38px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.07); }
.task-card-top, .card-actions, .progress-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.status-pill { display: inline-flex; align-items: center; min-height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 900; }
.status-pill.gold { color: #2a1a05; background: linear-gradient(135deg, #ffe8ae, #f2b34d); }
.status-pill.blue { color: #dcecff; background: rgba(92,124,166,.28); }
.status-pill.amber { color: #ffe2a7; background: rgba(242,179,77,.20); }
.status-pill.green { color: #9af5dc; background: rgba(45,212,191,.16); }
.status-pill.copper { color: #ffc7b6; background: rgba(207,97,74,.18); }
.status-pill.muted { color: #d6e2f0; background: rgba(148,163,184,.14); }
.task-price { color: #ffe8ae; font-weight: 900; font-variant-numeric: tabular-nums; }
.workspace-task-card h4 { margin: 16px 0 8px; color: #fff7dd; font-size: 18px; line-height: 1.35; }
.workspace-task-card p { min-height: 46px; margin: 0; color: rgba(255,232,196,.60); line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.task-meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 16px 0; }
.task-meta-grid span { min-width: 0; padding: 10px; border: 1px solid rgba(255,214,145,.10); border-radius: 12px; color: rgba(183,200,220,.68); background: rgba(255,255,255,.035); font-size: 12px; }
.task-meta-grid b { display: block; margin-top: 4px; color: rgba(255,242,214,.86); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.progress-track { position: relative; flex: 1; height: 8px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.075); }
.progress-track i { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: linear-gradient(90deg, #ffe8ae, #f2b34d); box-shadow: 0 0 18px rgba(242,179,77,.20); }
.progress-row span { color: rgba(255,232,196,.62); font-size: 12px; font-variant-numeric: tabular-nums; }
.card-actions { margin-top: auto; padding-top: 16px; }
.ghost-action { min-height: 34px; padding: 0 14px; font-weight: 800; }
.task-empty { min-height: 320px; display: grid; place-items: center; text-align: center; padding: 42px; border: 1px dashed rgba(255,214,145,.18); border-radius: 22px; background: radial-gradient(circle at 50% 12%, rgba(255,214,145,.10), transparent 28%), rgba(255,255,255,.025); }
.empty-mark { width: 84px; height: 84px; display: grid; place-items: center; border-radius: 26px; color: #2a1a05; background: linear-gradient(135deg, #ffe8ae, #f2b34d); font-size: 24px; font-weight: 900; box-shadow: 0 18px 38px rgba(242,179,77,.18); }
.task-empty strong { color: #fff7dd; font-size: 18px; }
.task-empty p { max-width: 420px; margin: 0; color: rgba(255,232,196,.58); line-height: 1.7; }
:deep(.el-loading-mask) { border-radius: 22px; background-color: rgba(5,10,20,.62); backdrop-filter: blur(10px); }
:deep(.el-loading-spinner .path) { stroke: #f2b34d; }
@media (max-width: 768px) { .my-tasks-container { max-width: 100%; margin: 0; padding: 12px 14px calc(100px + env(safe-area-inset-bottom)); } .tasks-hero, .workspace-panel { padding: 18px; border-radius: 18px; } .tasks-hero { flex-direction: column; } .tasks-hero h2 { font-size: 24px; } .workspace-tabs, .summary-strip, .task-card-list, .task-meta-grid { grid-template-columns: 1fr; } .workspace-tabs { display: grid; width: 100%; border-radius: 18px; } .section-toolbar { align-items: stretch; flex-direction: column; } .filter-chips { justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; scrollbar-width: none; -webkit-overflow-scrolling: touch; } .filter-chips::-webkit-scrollbar { display: none; } }
</style>
