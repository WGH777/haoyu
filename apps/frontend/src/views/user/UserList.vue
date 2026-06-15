<template>
  <div class="user-list-page">
    <el-card class="box-card admin-user-shell" shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <p class="eyebrow">HaoYu Admin Center</p>
            <h2>后台管理中心</h2>
            <p class="header-copy">聚合用户、任务与资金流水监控，保持后台治理清晰可追踪。</p>
          </div>
          <div class="card-actions">
            <el-tag
              v-if="currentUser"
              size="small"
              :type="isSuperAdmin ? 'success' : 'warning'"
            >
              当前角色：{{ currentUserRoleLabel }}
            </el-tag>
            <el-button :icon="Refresh" circle @click="handleRefresh" />
          </div>
        </div>
      </template>

      <div v-if="loadingUser" class="loading-wrapper">
        <el-skeleton :rows="4" animated />
      </div>

      <div v-else-if="!hasPermission" class="no-permission">
        <el-result
          icon="warning"
          title="无访问权限"
          sub-title="只有管理员才能访问用户管理页面"
        >
          <template #extra>
            <el-button type="primary" @click="goBack">返回任务大厅</el-button>
          </template>
        </el-result>
      </div>

      <div v-else>
        <el-tabs v-model="activeTab" class="admin-user-tabs">
          <el-tab-pane label="用户列表" name="users">
            <div class="admin-section-head">
              <div>
                <h3>用户与权限</h3>
                <p>查看用户资料、角色与余额，仅超级管理员可执行角色调整和账号维护。</p>
              </div>
            </div>

            <div class="desktop-only admin-table-wrap">
              <el-table
                v-loading="loadingUsers"
                :data="users"
                border
                class="admin-data-table"
                style="width: 100%"
              >
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column label="昵称" min-width="120">
                  <template #default="{ row }">
                    {{ row.nickname || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="email" label="邮箱" min-width="200" />
                <el-table-column label="角色" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getRoleTagType(row.role)" size="small">
                      {{ getRoleLabel(row.role) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="余额 (元)" width="120">
                  <template #default="{ row }">
                    {{ ((row.balance || 0) / 100).toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column label="注册时间" min-width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="280" fixed="right">
                  <template #default="{ row }">
                    <el-space>
                      <el-dropdown
                        v-if="isSuperAdmin && row.id !== currentUser?.id"
                      >
                        <el-button type="primary" size="small">
                          调整角色
                          <el-icon class="el-icon--right">
                            <ArrowDown />
                          </el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item
                              @click="handleChangeRole(row, 'USER')"
                            >
                              设为普通用户
                            </el-dropdown-item>
                            <el-dropdown-item
                              @click="handleChangeRole(row, 'ADMIN')"
                            >
                              设为管理员
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>

                      <el-button
                        v-if="isSuperAdmin && row.id !== currentUser?.id"
                        size="small"
                        @click="openResetPasswordDialog(row)"
                      >
                        重置密码
                      </el-button>

                      <el-button
                        v-if="isSuperAdmin && row.id !== currentUser?.id"
                        type="danger"
                        size="small"
                        @click="handleDeleteUser(row)"
                      >
                        删除
                      </el-button>
                    </el-space>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="mobile-only">
              <div v-if="loadingUsers" style="text-align:center;padding:24px;color:#64748b;">加载中...</div>
              <van-empty v-else-if="!users.length" description="暂无用户记录" />
              <div v-else class="mobile-card-list">
                <div v-for="u in users" :key="u.id" class="mobile-data-card">
                  <div class="mdc-head">
                    <span class="mdc-id">#{{ u.id }}</span>
                    <el-tag :type="getRoleTagType(u.role)" size="small">{{ getRoleLabel(u.role) }}</el-tag>
                  </div>
                  <div class="mdc-nick">{{ u.nickname || '-' }}</div>
                  <div class="mdc-email">{{ u.email }}</div>
                  <div class="mdc-meta">
                    <span>余额：{{ ((u.balance || 0) / 100).toFixed(2) }} 元</span>
                    <span>注册：{{ formatTime(u.createdAt || '') }}</span>
                  </div>
                  <div v-if="isSuperAdmin && u.id !== currentUser?.id" class="mdc-actions">
                    <van-button size="small" round plain type="default" class="mdc-operate-btn" @click="openActionSheet(u)">操作</van-button>
                  </div>
                </div>
              </div>
            </div>
            <van-action-sheet v-model:show="actionSheetShow" :actions="actionSheetOptions" cancel-text="取消" close-on-click-action @select="onActionSheetSelect" />
          </el-tab-pane>

          <el-tab-pane label="任务监控" name="tasks">
            <div class="admin-section-head">
              <div>
                <h3>任务状态监控</h3>
                <p>只读查看全站任务状态，帮助管理员定位履约风险与异常协作。</p>
              </div>
            </div>

            <div class="desktop-only">
              <div class="task-filter-bar">
                <span class="filter-label">状态：</span>
                <el-radio-group v-model="adminTaskStatusFilter" size="small">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="PENDING">待领取</el-radio-button>
                  <el-radio-button label="ASSIGNED">进行中</el-radio-button>
                  <el-radio-button label="SUBMITTED">待验收</el-radio-button>
                  <el-radio-button label="COMPLETED">已完成</el-radio-button>
                  <el-radio-button label="CANCELLED">已取消</el-radio-button>
                </el-radio-group>
              </div>

              <div class="admin-table-wrap">
                <el-table
                  v-loading="loadingTasks"
                  :data="filteredAdminTasks"
                  border
                  class="admin-data-table"
                  style="width: 100%"
                  empty-text="当前没有任务"
                >
                  <el-table-column prop="id" label="任务 ID" width="90" />
                  <el-table-column label="任务标题" min-width="180">
                    <template #default="{ row }">
                      <el-link type="primary" @click="goTaskDetail(row.id)">
                        {{ row.title }}
                      </el-link>
                    </template>
                  </el-table-column>
                  <el-table-column label="发布人" width="140">
                    <template #default="{ row }">
                      {{ row.publisher?.nickname || row.publisher?.email || 'N/A' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="赏金 (元)" width="120">
                    <template #default="{ row }">
                      {{ (row.price / 100).toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="120">
                    <template #default="{ row }">
                      <el-tag :type="getTaskStatusTag(row.status)" size="small">
                        {{ getTaskStatusText(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="发布时间" width="180">
                    <template #default="{ row }">
                      {{ formatTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="tab-tip">
                当前任务数据来自接口 <code>/admin/tasks</code>，包含各状态任务。
              </div>
            </div>

            <div class="mobile-only">
              <van-tabs v-model:active="adminTaskStatusTabIndex" @change="onTaskStatusTabChange" class="vant-tabs-filter" :swipeable="false" :ellipsis="false" :duration="0.2" color="#6366f1" title-active-color="#a5b4fc" title-inactive-color="#94a3b8">
                <van-tab v-for="opt in taskStatusOptions" :key="opt.value" :title="opt.label" />
              </van-tabs>

              <div v-if="loadingTasks" style="text-align:center;padding:24px;color:#64748b;">加载中...</div>
              <van-empty v-else-if="!filteredAdminTasks.length" description="当前没有任务" />
              <div v-else class="mobile-card-list">
                <div v-for="t in filteredAdminTasks" :key="t.id" class="mobile-data-card" @click="goTaskDetail(t.id)" style="cursor:pointer;">
                  <div class="mdc-head">
                    <span class="mdc-id">#{{ t.id }}</span>
                    <el-tag :type="getTaskStatusTag(t.status)" size="small">{{ getTaskStatusText(t.status) }}</el-tag>
                  </div>
                  <div class="mdc-title">{{ t.title }}</div>
                  <div class="mdc-meta">
                    <span>发布人 {{ t.publisher?.nickname || t.publisher?.email || 'N/A' }}</span>
                    <span>赏金 {{ (t.price / 100).toFixed(2) }}</span>
                  </div>
                  <div class="mdc-time">{{ formatTime(t.createdAt) }}</div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="资金监控" name="wallet">
            <div class="admin-section-head">
              <div>
                <h3>资金流水监控</h3>
                <p>只读查看平台资金流水，支持按类型与用户 ID 进行安全查询。</p>
              </div>
            </div>

            <div class="desktop-only">
              <div class="task-filter-bar admin-fund-filter">
                <span class="filter-label">类型：</span>
                <el-radio-group v-model="adminTxnTypeFilter" size="small">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="DEPOSIT">充值</el-radio-button>
                  <el-radio-button label="WITHDRAW">提现</el-radio-button>
                  <el-radio-button label="PUBLISH">发布任务</el-radio-button>
                  <el-radio-button label="INCOME">任务收入</el-radio-button>
                </el-radio-group>

                <span class="filter-label user-filter-label">用户ID：</span>
                <el-input-number
                  v-model="adminTxnUserId"
                  :min="1"
                  :controls="false"
                  placeholder="全部用户"
                  style="width: 160px"
                />
                <el-button
                  size="small"
                  type="primary"
                  class="query-button"
                  @click="handleSearchAdminTransactions"
                >
                  查询
                </el-button>
              </div>

              <div class="admin-table-wrap">
                <el-table
                  v-loading="loadingAdminTransactions"
                  :data="filteredAdminTransactions"
                  border
                  class="admin-data-table"
                  style="width: 100%"
                  empty-text="当前没有流水记录"
                >
                  <el-table-column prop="id" label="流水ID" width="90" />
                  <el-table-column label="用户" min-width="180">
                    <template #default="{ row }">
                      <span>
                        {{ row.user?.nickname || row.user?.email || 'N/A' }}
                      </span>
                      <span class="user-id-text">（ID：{{ row.userId }}）</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="110">
                    <template #default="{ row }">
                      <el-tag
                        :type="row.amount > 0 ? 'success' : 'danger'"
                        size="small"
                      >
                        {{ getTxnTypeLabel(row.type) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" width="120">
                    <template #default="{ row }">
                      <span :class="row.amount > 0 ? 'text-green' : 'text-red'">
                        {{ formatTxnAmount(row) }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag
                        :type="row.status === 'SUCCESS' ? 'success' : 'info'"
                        size="small"
                      >
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="时间" width="180">
                    <template #default="{ row }">
                      {{ formatTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="tab-tip">
                当前流水数据来自接口 <code>/admin/transactions</code>，展示最近 100 条记录。
                本页仅支持查看，不提供资金修改入口，资金安全完全由业务逻辑控制。
              </div>
            </div>

            <div class="mobile-only">
              <div class="mobile-filter-bar">
                <van-tabs v-model:active="adminTxnTypeTabIndex" @change="onTxnTypeTabChange" class="vant-tabs-filter" :swipeable="false" :ellipsis="false" :duration="0.2" color="#6366f1" title-active-color="#a5b4fc" title-inactive-color="#94a3b8">
                  <van-tab v-for="opt in txnTypeOptions" :key="opt.value" :title="opt.label" />
                </van-tabs>
                <div class="filter-row-inner">
                  <el-input-number
                    v-model="adminTxnUserId"
                    :min="1"
                    :controls="false"
                    placeholder="用户ID（全部用户）"
                    style="flex:1;"
                    :style="{ width: 'auto' }"
                  />
                  <el-button type="primary" @click="handleSearchAdminTransactions" style="min-height:40px;">查询</el-button>
                </div>
              </div>

              <div v-if="loadingAdminTransactions" style="text-align:center;padding:24px;color:#64748b;">加载中...</div>
              <van-empty v-else-if="!filteredAdminTransactions.length" description="当前没有流水记录" />
              <div v-else class="mobile-card-list">
                <div v-for="tx in filteredAdminTransactions" :key="tx.id" class="mobile-data-card">
                  <div class="mdc-head">
                    <span class="mdc-id">#{{ tx.id }}</span>
                    <el-tag
                      :type="tx.amount > 0 ? 'success' : 'danger'"
                      size="small"
                    >{{ getTxnTypeLabel(tx.type) }}</el-tag>
                  </div>
                  <div class="mdc-meta">
                    <span>{{ tx.user?.nickname || tx.user?.email || 'N/A' }}（ID:{{ tx.userId }}）</span>
                  </div>
                  <div class="mdc-meta">
                    <span :class="tx.amount > 0 ? 'text-green' : 'text-red'">{{ formatTxnAmount(tx) }}</span>
                    <el-tag :type="tx.status === 'SUCCESS' ? 'success' : 'info'" size="small">{{ tx.status }}</el-tag>
                  </div>
                  <div class="mdc-time">{{ formatTime(tx.createdAt) }}</div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <el-dialog
      v-model="resetDialogVisible"
      title="重置用户密码"
      width="420px"
      class="admin-action-dialog"
    >
      <div v-if="resetTargetUser">
        <p class="dialog-tip">
          正在为用户
          <strong>{{ resetTargetUser.nickname || resetTargetUser.email }}</strong>
          重置密码
        </p>
        <el-form @submit.prevent>
          <el-form-item label="新密码">
            <el-input
              v-model="resetPassword"
              type="password"
              show-password
              placeholder="请输入至少 6 位新密码"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="resetSubmitting"
            @click="handleResetPassword"
          >
            确认重置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, ArrowDown } from '@element-plus/icons-vue'
import { Empty, Tab, Tabs, ActionSheet } from 'vant'

import {
  getUserList,
  changeUserRole,
  resetUserPassword,
  deleteUser,
  getProfile,
  type UserItem,
  type UserProfile,
  type UserRole,
} from '@/api/user'

import type { Task } from '@/api/task'
import { getAdminTasks, getAdminTransactions, type AdminTransaction } from '@/api/admin'

const router = useRouter()

// 当前登录用户信息
const currentUser = ref<UserProfile | null>(null)
const loadingUser = ref(true)

// 用户列表
const users = ref<UserItem[]>([])
const loadingUsers = ref(false)

// 任务监控数据（管理员视角，只读）
const adminTasks = ref<Task[]>([])
const loadingTasks = ref(false)

// 任务监控状态筛选
type AdminTaskStatus =
  | 'all'
  | 'PENDING'
  | 'ASSIGNED'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED'

const adminTaskStatusFilter = ref<AdminTaskStatus>('all')

// 资金监控数据（管理员视角，只读）
type AdminTxnType = 'all' | 'DEPOSIT' | 'WITHDRAW' | 'PUBLISH' | 'INCOME'
const adminTransactions = ref<AdminTransaction[]>([])
const loadingAdminTransactions = ref(false)
const adminTxnTypeFilter = ref<AdminTxnType>('all')
const adminTxnUserId = ref<number | null>(null)

// Vant tabs 索引（移动端筛选用）
const adminTaskStatusTabIndex = ref(0)
const adminTxnTypeTabIndex = ref(0)

const onTaskStatusTabChange = (index: number) => {
  const vals: AdminTaskStatus[] = ['all', 'PENDING', 'ASSIGNED', 'SUBMITTED', 'COMPLETED', 'CANCELLED']
  adminTaskStatusFilter.value = vals[index] || 'all'
}
const onTxnTypeTabChange = (index: number) => {
  const vals: AdminTxnType[] = ['all', 'DEPOSIT', 'WITHDRAW', 'PUBLISH', 'INCOME']
  adminTxnTypeFilter.value = vals[index] || 'all'
}

// Vant ActionSheet（移动端用户操作菜单）
const actionSheetShow = ref(false)
const actionSheetUser = ref<UserItem | null>(null)
const actionSheetOptions = [
  { name: '设为普通用户', key: 'role-user' },
  { name: '设为管理员', key: 'role-admin' },
  { name: '重置密码', key: 'reset-pwd' },
  { name: '删除用户', key: 'delete-user', color: '#ef4444' },
]

const openActionSheet = (user: UserItem) => {
  actionSheetUser.value = user
  actionSheetShow.value = true
}

const onActionSheetSelect = (item: { key: string }) => {
  const user = actionSheetUser.value
  if (!user) return
  switch (item.key) {
    case 'role-user':
      handleChangeRole(user, 'USER')
      break
    case 'role-admin':
      handleChangeRole(user, 'ADMIN')
      break
    case 'reset-pwd':
      openResetPasswordDialog(user)
      break
    case 'delete-user':
      handleDeleteUser(user)
      break
  }
}

// Tab
const activeTab = ref<'users' | 'tasks' | 'wallet'>('users')

// 重置密码弹窗
const resetDialogVisible = ref(false)
const resetPassword = ref('')
const resetTargetUser = ref<UserItem | null>(null)
const resetSubmitting = ref(false)

// 是否是超级管理员
const isSuperAdmin = computed(
  () => currentUser.value?.role === 'SUPER_ADMIN',
)

// 是否有权限访问此页面（ADMIN / SUPER_ADMIN）
const hasPermission = computed(() => {
  if (!currentUser.value) return false
  return (
    currentUser.value.role === 'ADMIN' ||
    currentUser.value.role === 'SUPER_ADMIN'
  )
})

const currentUserRoleLabel = computed(() => {
  if (!currentUser.value) return '-'
  return getRoleLabel(currentUser.value.role)
})

const formatTime = (t: string) => {
  if (!t) return '-'
  try {
    const date = new Date(t)
    return date.toLocaleString()
  } catch {
    return t
  }
}

// 角色展示文案
const getRoleLabel = (role: UserRole | string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '超级管理员'
    case 'ADMIN':
      return '管理员'
    case 'USER':
      return '普通用户'
    default:
      return role
  }
}

// 角色标签颜色
const getRoleTagType = (
  role: UserRole | string,
): '' | 'success' | 'warning' | 'info' => {
  if (role === 'SUPER_ADMIN') return 'success'
  if (role === 'ADMIN') return 'warning'
  return ''
}

// 任务状态文案
const getTaskStatusText = (status: Task['status']) => {
  switch (status) {
    case 'PENDING':
      return '待领取'
    case 'ASSIGNED':
    case 'ONGOING':
      return '进行中'
    case 'SUBMITTED':
      return '待验收'
    case 'COMPLETED':
      return '已完成'
    case 'CANCELLED':
      return '已取消'
    default:
      return status
  }
}

// 任务状态标签颜色
const getTaskStatusTag = (
  status: Task['status'],
): '' | 'success' | 'warning' | 'info' | 'danger' => {
  switch (status) {
    case 'PENDING':
      return 'info'
    case 'ASSIGNED':
    case 'ONGOING':
    case 'SUBMITTED':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    default:
      return ''
  }
}

// 移动端筛选芯片选项
const taskStatusOptions = [
  { value: 'all', label: '全部' },
  { value: 'PENDING', label: '待领取' },
  { value: 'ASSIGNED', label: '进行中' },
  { value: 'SUBMITTED', label: '待验收' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

const txnTypeOptions = [
  { value: 'all', label: '全部' },
  { value: 'DEPOSIT', label: '充值' },
  { value: 'WITHDRAW', label: '提现' },
  { value: 'PUBLISH', label: '发布任务' },
  { value: 'INCOME', label: '任务收入' },
]

// 前端过滤后的任务列表
const filteredAdminTasks = computed(() => {
  if (adminTaskStatusFilter.value === 'all') {
    return adminTasks.value
  }
  return adminTasks.value.filter(
    (t) => t.status === adminTaskStatusFilter.value,
  )
})

// 前端过滤后的资金流水列表
const filteredAdminTransactions = computed(() => {
  let list = adminTransactions.value
  if (adminTxnTypeFilter.value !== 'all') {
    list = list.filter((tx) => tx.type === adminTxnTypeFilter.value)
  }
  return list
})

// 加载当前登录用户
const loadCurrentUser = async () => {
  try {
    const cached = localStorage.getItem('currentUser')
    if (cached) {
      currentUser.value = JSON.parse(cached)
    } else {
      const res = await getProfile()
      currentUser.value = res
      localStorage.setItem('currentUser', JSON.stringify(res))
    }
  } catch (error) {
    console.error('加载当前用户信息失败:', error)
  } finally {
    loadingUser.value = false
  }
}

// 获取用户列表
const fetchUsers = async () => {
  if (!hasPermission.value) return
  loadingUsers.value = true
  try {
    const res = await getUserList()
    users.value = Array.isArray(res) ? res : ((res as any)?.items || [])
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loadingUsers.value = false
  }
}

// 获取任务列表（管理员视角，只读）
const fetchAdminTasks = async () => {
  if (!hasPermission.value) return
  loadingTasks.value = true
  try {
    const res = await getAdminTasks()
    adminTasks.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loadingTasks.value = false
  }
}

// 获取资金流水列表（管理员视角，只读）
const fetchAdminTransactions = async () => {
  if (!hasPermission.value) return
  loadingAdminTransactions.value = true
  try {
    const params: any = {}
    if (adminTxnUserId.value) {
      params.userId = adminTxnUserId.value
    }
    const res = await getAdminTransactions(params)
    adminTransactions.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取资金流水失败:', error)
    ElMessage.error('获取资金流水失败')
  } finally {
    loadingAdminTransactions.value = false
  }
}

// 调整角色（仅 SUPER_ADMIN）
const handleChangeRole = async (user: UserItem, targetRole: UserRole) => {
  if (!isSuperAdmin.value) return

  if (user.role === targetRole) {
    ElMessage.info('该用户已是该角色')
    return
  }

  try {
    const label = getRoleLabel(targetRole)
    await ElMessageBox.confirm(
      `确定将用户“${user.nickname || user.email}”设置为“${label}”吗？`,
      '提示',
      { type: 'warning' },
    )
    await changeUserRole(user.id, targetRole)
    ElMessage.success('角色已更新')
    await fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('修改角色失败:', error)
    }
  }
}

// 打开重置密码弹窗
const openResetPasswordDialog = (user: UserItem) => {
  if (!isSuperAdmin.value) return
  resetTargetUser.value = user
  resetPassword.value = ''
  resetDialogVisible.value = true
}

// 提交重置密码
const handleResetPassword = async () => {
  if (!resetTargetUser.value) return
  if (!resetPassword.value || resetPassword.value.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }

  resetSubmitting.value = true
  try {
    await resetUserPassword(resetTargetUser.value.id, resetPassword.value)
    ElMessage.success('密码已重置')
    resetDialogVisible.value = false
  } catch (error) {
    console.error('重置密码失败:', error)
  } finally {
    resetSubmitting.value = false
  }
}

// 删除用户（仅 SUPER_ADMIN）
const handleDeleteUser = async (user: UserItem) => {
  if (!isSuperAdmin.value) return

  try {
    await ElMessageBox.confirm(
      `确定删除用户“${user.nickname || user.email}”吗？此操作不可恢复！`,
      '警告',
      { type: 'warning' },
    )
    await deleteUser(user.id)
    ElMessage.success('删除成功')
    await fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除用户失败:', error)
    }
  }
}

// 打开任务详情
const goTaskDetail = (taskId: number) => {
  router.push(`/task/${taskId}`)
}

// 顶部刷新按钮：根据当前 Tab 刷新对应的数据
const handleRefresh = async () => {
  if (!hasPermission.value) return
  if (activeTab.value === 'users') {
    await fetchUsers()
  } else if (activeTab.value === 'tasks') {
    await fetchAdminTasks()
  } else {
    await fetchAdminTransactions()
  }
}

// 资金监控 Tab 内的查询按钮：按用户 ID 查询
const handleSearchAdminTransactions = async () => {
  await fetchAdminTransactions()
}

// 资金流水类型中文
const getTxnTypeLabel = (type: string) => {
  switch (type) {
    case 'DEPOSIT':
      return '充值'
    case 'WITHDRAW':
      return '提现'
    case 'PUBLISH':
      return '发布任务'
    case 'INCOME':
      return '任务收入'
    default:
      return type
  }
}

// 金额格式化：根据正负号显示 + / -
const formatTxnAmount = (tx: AdminTransaction) => {
  const sign = tx.amount > 0 ? '+' : ''
  return `${sign}${(tx.amount / 100).toFixed(2)}`
}

// 返回任务大厅
const goBack = () => {
  router.push('/task')
}

onMounted(async () => {
  await loadCurrentUser()
  if (hasPermission.value) {
    await fetchUsers() // 默认先加载用户列表
  }
})

// 当切换 Tab 时，首次进入“任务监控 / 资金监控”自动加载数据
watch(
  () => activeTab.value,
  async (val) => {
    if (val === 'tasks' && hasPermission.value && adminTasks.value.length === 0) {
      await fetchAdminTasks()
    }
    if (
      val === 'wallet' &&
      hasPermission.value &&
      adminTransactions.value.length === 0
    ) {
      await fetchAdminTransactions()
    }
  },
)
</script>

<style scoped>
.user-list-page {
  position: relative;
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px;
  color: #f8efd9;
}

.user-list-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 16%, rgba(242, 179, 77, 0.14), transparent 30%),
    radial-gradient(circle at 78% 10%, rgba(178, 142, 255, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(5, 10, 20, 0.96), rgba(9, 15, 29, 0.94));
}

.admin-user-shell {
  border-radius: 18px;
  border: 1px solid rgba(255, 214, 145, 0.18);
  background: linear-gradient(145deg, rgba(8, 14, 28, 0.9), rgba(13, 23, 42, 0.78));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 232, 174, 0.08);
  backdrop-filter: blur(18px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #f2b34d;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.card-header h2 {
  margin: 0;
  color: #ffe8ae;
  font-size: 28px;
  line-height: 1.2;
}

.header-copy {
  margin: 10px 0 0;
  color: #aebbd2;
  line-height: 1.7;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.loading-wrapper {
  padding: 24px 0;
}

.no-permission {
  padding: 40px 0;
}

.admin-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 8px 0 18px;
}

.admin-section-head h3 {
  margin: 0 0 6px;
  color: #ffe8ae;
  font-size: 20px;
}

.admin-section-head p {
  margin: 0;
  color: #8fa3bf;
  line-height: 1.7;
}

.admin-table-wrap {
  overflow-x: auto;
  border-radius: 14px;
}

.tab-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #8fa3bf;
  line-height: 1.7;
}

.dialog-tip {
  margin-bottom: 12px;
  color: #aebbd2;
}

.task-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: #aebbd2;
}

.user-filter-label {
  margin-left: 12px;
}

.query-button {
  margin-left: 2px;
}

.user-id-text {
  margin-left: 4px;
  font-size: 12px;
  color: #8fa3bf;
}

.text-green {
  color: #6ee7b7;
  font-weight: 700;
}

.text-red {
  color: #fca5a5;
  font-weight: 700;
}

:deep(.admin-user-shell > .el-card__header),
:deep(.admin-user-shell > .el-card__body) {
  border-color: rgba(255, 214, 145, 0.12);
  background: transparent;
}

:deep(.admin-user-tabs .el-tabs__nav-wrap::after) {
  background: rgba(255, 214, 145, 0.12);
}

:deep(.admin-user-tabs .el-tabs__item) {
  color: #8fa3bf;
  font-weight: 700;
}

:deep(.admin-user-tabs .el-tabs__item.is-active) {
  color: #ffe8ae;
}

:deep(.admin-user-tabs .el-tabs__active-bar) {
  background: linear-gradient(90deg, #ffe8ae, #f2b34d);
}

:deep(.admin-data-table) {
  --el-table-border-color: rgba(255, 214, 145, 0.12);
  --el-table-header-bg-color: rgba(255, 214, 145, 0.08);
  --el-table-tr-bg-color: rgba(8, 14, 28, 0.58);
  --el-table-row-hover-bg-color: rgba(255, 214, 145, 0.08);
  --el-table-text-color: #d8e1ee;
  --el-table-header-text-color: #ffe8ae;
  min-width: 880px;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(8, 14, 28, 0.65);
  border: 1px solid rgba(255, 214, 145, 0.12);
}

:deep(.admin-data-table .el-table__inner-wrapper::before),
:deep(.admin-data-table .el-table__border-left-patch) {
  background: rgba(255, 214, 145, 0.12);
}

:deep(.admin-data-table th.el-table__cell),
:deep(.admin-data-table tr),
:deep(.admin-data-table td.el-table__cell) {
  background: transparent;
}

:deep(.el-button) {
  border-radius: 999px;
  border-color: rgba(255, 214, 145, 0.22);
  background: rgba(8, 14, 28, 0.72);
  color: #ffe8ae;
}

:deep(.el-button--primary),
:deep(.el-button--success) {
  border: none;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  color: #1d1406;
  box-shadow: 0 12px 28px rgba(242, 179, 77, 0.22);
}

:deep(.el-button--danger) {
  border-color: rgba(191, 83, 72, 0.42);
  background: rgba(96, 33, 29, 0.28);
  color: #ffb3a8;
}

:deep(.el-tag) {
  border-radius: 999px;
  background: rgba(255, 214, 145, 0.1);
  border-color: rgba(255, 214, 145, 0.18);
}

:deep(.el-radio-button__inner) {
  border-color: rgba(255, 214, 145, 0.14);
  background: rgba(8, 14, 28, 0.62);
  color: #aebbd2;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #f2b34d;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  color: #1d1406;
  box-shadow: none;
}

:deep(.el-input-number .el-input__wrapper),
:deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 1px solid rgba(255, 214, 145, 0.16);
  background: rgba(4, 10, 20, 0.72);
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: #f8efd9;
}

:deep(.el-link.el-link--primary) {
  color: #ffe8ae;
}

:deep(.admin-action-dialog) {
  border-radius: 18px;
  border: 1px solid rgba(255, 214, 145, 0.2);
  background: linear-gradient(145deg, rgba(8, 14, 28, 0.96), rgba(13, 23, 42, 0.94));
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 232, 174, 0.08);
}

:deep(.admin-action-dialog .el-dialog__title) {
  color: #ffe8ae;
  font-weight: 800;
}

:deep(.admin-action-dialog .el-dialog__body),
:deep(.admin-action-dialog .el-dialog__footer),
:deep(.admin-action-dialog .el-form-item__label) {
  color: #d8e1ee;
}

/* ====== 移动端卡片样式 ====== */
.mobile-card-empty {
  text-align: center;
  padding: 40px 16px;
  color: #64748b;
  font-size: 14px;
}
.mobile-card-empty .empty-sub {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
}

.mdc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.mdc-id {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}
.mdc-nick {
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 2px;
}
.mdc-email,
.mdc-title {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 4px;
  word-break: break-all;
  line-height: 1.5;
}
.mdc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}
.mdc-time {
  font-size: 11px;
  color: #475569;
  margin-top: 4px;
}
.mdc-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.mdc-actions .el-button {
  font-size: 12px;
  min-height: 36px;
}

/* ====== Vant Tabs 暗色主题适配（仅移动端）====== */
.vant-tabs-filter {
  margin-bottom: 10px;
}
.vant-tabs-filter .van-tabs__wrap {
  background: transparent;
}
.vant-tabs-filter .van-tabs__nav {
  background: rgba(148, 163, 184, 0.06);
  border-radius: 8px;
  padding: 2px;
}
.vant-tabs-filter .van-tab {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 6px;
  min-height: 34px;
  color: #94a3b8;
  background: transparent;
}
.vant-tabs-filter .van-tab--active {
  background: rgba(99, 102, 241, 0.15);
  font-weight: 600;
}
.vant-tabs-filter .van-tabs__line {
  display: none;
}

/* ====== van-action-sheet 暗色主题适配 ====== */
:deep(.van-action-sheet) {
  background: #111827 !important;
  border-radius: 16px 16px 0 0 !important;
}
:deep(.van-action-sheet__item) {
  color: #e2e8f0 !important;
  background: #111827 !important;
  font-size: 15px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08) !important;
}
:deep(.van-action-sheet__item:active) {
  background: rgba(99, 102, 241, 0.08) !important;
}
:deep(.van-action-sheet__cancel) {
  color: #94a3b8 !important;
  background: #111827 !important;
  font-size: 15px;
}
:deep(.van-action-sheet__header) {
  color: #f1f5f9 !important;
}
:deep(.van-action-sheet__gap) {
  background: #0a0e17 !important;
}
:deep(.van-overlay) {
  background: rgba(0, 0, 0, 0.6) !important;
}

.mdc-operate-btn {
  min-height: 40px;
  padding: 0 20px;
  border-color: rgba(148, 163, 184, 0.18) !important;
  color: #94a3b8 !important;
  font-size: 13px;
}

@media (max-width: 900px) {
  .user-list-page {
    padding: 18px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
