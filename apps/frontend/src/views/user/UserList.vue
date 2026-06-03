<template>
  <div class="user-list-page">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>管理中心</span>
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

      <!-- 加载当前用户信息时的骨架屏 -->
      <div v-if="loadingUser" class="loading-wrapper">
        <el-skeleton :rows="4" animated />
      </div>

      <!-- 无权限提示 -->
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

      <!-- 管理中心内容：用户列表 + 任务监控 + 资金监控 -->
      <div v-else>
        <el-tabs v-model="activeTab">
          <!-- Tab 1：用户列表 -->
          <el-tab-pane label="用户列表" name="users">
            <!-- 桌面端表格 -->
            <div class="desktop-only">
              <el-table
                v-loading="loadingUsers"
                :data="users"
                border
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

            <!-- 移动端卡片列表 -->
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
                    <el-dropdown v-if="isSuperAdmin">
                      <el-button size="small" plain>角色</el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="handleChangeRole(u, 'USER')">设为普通用户</el-dropdown-item>
                          <el-dropdown-item @click="handleChangeRole(u, 'ADMIN')">设为管理员</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <el-button size="small" plain @click="openResetPasswordDialog(u)">重置密码</el-button>
                    <el-button size="small" type="danger" plain @click="handleDeleteUser(u)">删除</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 2：任务监控（管理员专用，只读） -->
          <el-tab-pane label="任务监控" name="tasks">
            <!-- 桌面端筛选条 + 表格 -->
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

              <el-table
                v-loading="loadingTasks"
                :data="filteredAdminTasks"
                border
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
              <div class="tab-tip">
                当前任务数据来自接口 <code>/admin/tasks</code>，包含各状态任务。
              </div>
            </div>

            <!-- 移动端筛选 chip + 卡片列表 -->
            <div class="mobile-only">
              <div class="mobile-chip-row">
                <span v-for="opt in taskStatusOptions" :key="opt.value"
                  class="mobile-chip"
                  :class="{ active: adminTaskStatusFilter === opt.value }"
                  @click="adminTaskStatusFilter = opt.value as AdminTaskStatus"
                >{{ opt.label }}</span>
              </div>

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
                    <span>👤 {{ t.publisher?.nickname || t.publisher?.email || 'N/A' }}</span>
                    <span>💰 {{ (t.price / 100).toFixed(2) }}</span>
                  </div>
                  <div class="mdc-time">📅 {{ formatTime(t.createdAt) }}</div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 3：资金监控（管理员专用，只读） -->
          <el-tab-pane label="资金监控" name="wallet">
            <!-- 桌面端 -->
            <div class="desktop-only">
              <div class="task-filter-bar">
                <span class="filter-label">类型：</span>
                <el-radio-group v-model="adminTxnTypeFilter" size="small">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="DEPOSIT">充值</el-radio-button>
                  <el-radio-button label="WITHDRAW">提现</el-radio-button>
                  <el-radio-button label="PUBLISH">发布任务</el-radio-button>
                  <el-radio-button label="INCOME">任务收入</el-radio-button>
                </el-radio-group>

                <span class="filter-label" style="margin-left: 20px;">用户ID：</span>
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
                  style="margin-left: 10px;"
                  @click="handleSearchAdminTransactions"
                >
                  查询
                </el-button>
              </div>

              <el-table
                v-loading="loadingAdminTransactions"
                :data="filteredAdminTransactions"
                border
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
              <div class="tab-tip">
                当前流水数据来自接口 <code>/admin/transactions</code>，展示最近 100 条记录。
                本页仅支持查看，不提供资金修改入口，资金安全完全由业务逻辑控制。
              </div>
            </div>

            <!-- 移动端 -->
            <div class="mobile-only">
              <div class="mobile-filter-bar">
                <div class="mobile-chip-row">
                  <span v-for="opt in txnTypeOptions" :key="opt.value"
                    class="mobile-chip"
                    :class="{ active: adminTxnTypeFilter === opt.value }"
                    @click="adminTxnTypeFilter = opt.value as AdminTxnType"
                  >{{ opt.label }}</span>
                </div>
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
                    <span>👤 {{ tx.user?.nickname || tx.user?.email || 'N/A' }}（ID:{{ tx.userId }}）</span>
                  </div>
                  <div class="mdc-meta">
                    <span :class="tx.amount > 0 ? 'text-green' : 'text-red'">{{ formatTxnAmount(tx) }}</span>
                    <el-tag :type="tx.status === 'SUCCESS' ? 'success' : 'info'" size="small">{{ tx.status }}</el-tag>
                  </div>
                  <div class="mdc-time">📅 {{ formatTime(tx.createdAt) }}</div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="resetDialogVisible"
      title="重置用户密码"
      width="400px"
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
          <el-button @click="resetDialogVisible = false">取 消</el-button>
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
import { Empty } from 'vant'

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
    users.value = res
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
      `确定将用户「${user.nickname || user.email}」设置为「${label}」吗？`,
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
      `确定删除用户「${user.nickname || user.email}」吗？此操作不可恢复！`,
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

// 顶部刷新按钮：根据当前 Tab 刷对应的数据
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
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 15px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-wrapper {
  padding: 24px 0;
}

.no-permission {
  padding: 40px 0;
}

.tab-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

.dialog-tip {
  margin-bottom: 12px;
}

.task-filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.filter-label {
  margin-right: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.user-id-text {
  margin-left: 4px;
  font-size: 12px;
  color: #64748b;
}

.text-green {
  color: #6ee7b7;
  font-weight: 600;
}

.text-red {
  color: #fca5a5;
  font-weight: 600;
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
</style>
