<template>
  <div class="user-list-page">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-header-title">管理中心</span>
          <div class="card-actions">
            <el-tag
              v-if="currentUser"
              size="small"
              :type="isSuperAdmin ? 'success' : 'warning'"
              class="role-tag"
            >
              当前角色：{{ currentUserRoleLabel }}
            </el-tag>
            <el-button
              v-if="isSuperAdmin"
              type="danger"
              size="small"
              plain
              @click="handleCleanTestUsers"
              class="clean-btn"
            >
              🧹 清理测试用户
            </el-button>
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

      <!-- 管理中心内容 -->
      <div v-else>
          <el-tabs v-model="activeTab" class="admin-tabs">
            <!-- Tab 1：用户列表 -->
            <el-tab-pane label="用户列表" name="users">
              <!-- 批量操作栏 -->
              <div v-if="isSuperAdmin && selectedUserIds.length > 0" class="batch-bar">
                <span>已选 <strong>{{ selectedUserIds.length }}</strong> 个用户</span>
                <el-button type="danger" size="small" @click="handleBatchDelete">
                  🗑 批量删除
                </el-button>
                <el-button size="small" @click="clearSelection">取消选择</el-button>
              </div>

              <!-- 桌面端：表格 -->
              <div class="desktop-only">
                <el-table
                  ref="userTableRef"
                  v-loading="loadingUsers"
                  :data="users"
                  border
                  style="width: 100%"
                  @selection-change="handleSelectionChange"
                >
                  <el-table-column
                    v-if="isSuperAdmin"
                    type="selection"
                    width="50"
                    :selectable="(row: UserItem) => row.id !== currentUser?.id"
                  />
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
                  <el-table-column label="金额" width="120">
                    <template #default="{ row }">
                      {{ ((row.balance || 0) / 100).toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="注册时间" min-width="180">
                    <template #default="{ row }">
                      {{ formatTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140" fixed="right">
                    <template #default="{ row }">
                      <el-dropdown
                        v-if="row.id !== currentUser?.id"
                        trigger="click"
                      >
                        <el-button size="small" type="primary" plain>
                          操作
                          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <template v-if="canManageRole(row)">
                              <el-dropdown-item
                                v-if="row.role !== 'USER'"
                                @click="handleChangeRole(row, 'USER')"
                              >
                                👤 设为普通用户
                              </el-dropdown-item>
                              <el-dropdown-item
                                v-if="row.role !== 'ADMIN'"
                                @click="handleChangeRole(row, 'ADMIN')"
                              >
                                ⭐ 设为管理员
                              </el-dropdown-item>
                              <el-dropdown-item
                                v-if="isSuperAdmin && row.role !== 'SUPER_ADMIN'"
                                @click="handleChangeRole(row, 'SUPER_ADMIN')"
                              >
                                👑 设为超级管理员
                              </el-dropdown-item>
                              <el-dropdown-item divided />
                            </template>
                            <el-dropdown-item
                              v-if="isSuperAdmin"
                              @click="openNicknameDialog(row)"
                            >
                              ✏️ 修改昵称
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="canResetPassword(row)"
                              @click="openResetPasswordDialog(row)"
                            >
                              🔑 重置密码
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="canBan(row) && !row.isBanned"
                              @click="handleBanUser(row)"
                            >
                              🚫 封禁
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="canBan(row) && row.isBanned"
                              @click="handleUnbanUser(row)"
                            >
                              ✅ 解封
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="isSuperAdmin"
                              divided
                              @click="handleDeleteUser(row)"
                              style="color: #f56c6c"
                            >
                              🗑 删除
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                      <span v-else class="text-muted">-</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 移动端：卡片列表 -->
              <div class="mobile-only user-cards" v-loading="loadingUsers">
                <!-- 移动端批量选择按钮 -->
                <div v-if="isSuperAdmin" class="mobile-batch-toggle">
                  <el-button
                    size="small"
                    :type="mobileBatchMode ? 'warning' : 'default'"
                    @click="toggleMobileBatch"
                  >
                    {{ mobileBatchMode ? '退出批量模式' : '📋 进入批量模式' }}
                  </el-button>
                  <el-button
                    v-if="mobileBatchMode && mobileSelectedIds.length > 0"
                    type="danger"
                    size="small"
                    @click="handleMobileBatchDelete"
                  >
                    🗑 删除已选({{ mobileSelectedIds.length }})
                  </el-button>
                </div>

                <div
                  v-for="user in users"
                  :key="user.id"
                  class="user-card"
                  :class="{ 'user-card-selected': mobileBatchMode && mobileSelectedIds.includes(user.id) }"
                  @click="mobileBatchMode ? toggleMobileSelect(user.id) : undefined"
                >
                  <div class="user-card-top">
                    <div class="user-card-identity">
                      <span class="user-card-nickname">{{ user.nickname || '-' }}</span>
                      <span class="user-card-id">ID: {{ user.id }}</span>
                    </div>
                    <div class="user-card-badges">
                      <el-tag :type="getRoleTagType(user.role)" size="small">
                        {{ getRoleLabel(user.role) }}
                      </el-tag>
                      <el-tag v-if="user.isBanned" type="danger" size="small">已封禁</el-tag>
                    </div>
                  </div>
                  <div class="user-card-meta">
                    <div class="meta-item">
                      <span class="meta-label">邮箱</span>
                      <span class="meta-value">{{ user.email }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">余额</span>
                      <span class="meta-value balance">¥{{ ((user.balance || 0) / 100).toFixed(2) }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">注册</span>
                      <span class="meta-value">{{ formatTime(user.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="user-card-actions" v-if="!mobileBatchMode">
                    <el-dropdown trigger="click">
                      <el-button size="small" type="primary" plain>
                        操作
                        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <template v-if="canManageRole(user)">
                            <el-dropdown-item v-if="user.role !== 'USER'" @click="handleChangeRole(user, 'USER')">
                              👤 设为普通用户
                            </el-dropdown-item>
                            <el-dropdown-item v-if="user.role !== 'ADMIN'" @click="handleChangeRole(user, 'ADMIN')">
                              ⭐ 设为管理员
                            </el-dropdown-item>
                            <el-dropdown-item v-if="isSuperAdmin && user.role !== 'SUPER_ADMIN'" @click="handleChangeRole(user, 'SUPER_ADMIN')">
                              👑 设为超级管理员
                            </el-dropdown-item>
                            <el-dropdown-item divided />
                          </template>
                          <el-dropdown-item
                            v-if="isSuperAdmin"
                            @click="openNicknameDialog(user)"
                          >
                            ✏️ 修改昵称
                          </el-dropdown-item>
                          <el-dropdown-item v-if="canResetPassword(user)" @click="openResetPasswordDialog(user)">
                            🔑 重置密码
                          </el-dropdown-item>
                          <el-dropdown-item v-if="canBan(user) && !user.isBanned" @click="handleBanUser(user)">
                            🚫 封禁
                          </el-dropdown-item>
                          <el-dropdown-item v-if="canBan(user) && user.isBanned" @click="handleUnbanUser(user)">
                            ✅ 解封
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="isSuperAdmin"
                            divided
                            @click="handleDeleteUser(user)"
                            style="color: #f56c6c"
                          >
                            🗑 删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
                <el-empty v-if="!loadingUsers && users.length === 0" description="暂无用户" />
              </div>
            </el-tab-pane>

            <!-- Tab 2：任务监控 -->
            <el-tab-pane label="任务监控" name="tasks">
              <div class="task-filter-bar">
                <span class="filter-label">状态：</span>
                <el-radio-group v-model="adminTaskStatusFilter" size="small" class="filter-radio-group">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="PENDING">待领取</el-radio-button>
                  <el-radio-button label="ASSIGNED">进行中</el-radio-button>
                  <el-radio-button label="SUBMITTED">待验收</el-radio-button>
                  <el-radio-button label="COMPLETED">已完成</el-radio-button>
                  <el-radio-button label="CANCELLED">已取消</el-radio-button>
                </el-radio-group>
              </div>

              <div class="table-scroll-wrapper">
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
                  <el-table-column label="金额" width="120">
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
            </el-tab-pane>

            <!-- Tab 3：资金监控 -->
            <el-tab-pane label="资金监控" name="wallet">
              <div class="wallet-filter-bar">
                <div class="filter-row">
                  <span class="filter-label">类型：</span>
                  <el-radio-group v-model="adminTxnTypeFilter" size="small" class="filter-radio-group">
                    <el-radio-button label="all">全部</el-radio-button>
                    <el-radio-button label="DEPOSIT">充值</el-radio-button>
                    <el-radio-button label="WITHDRAW">提现</el-radio-button>
                    <el-radio-button label="PUBLISH">发布任务</el-radio-button>
                    <el-radio-button label="INCOME">任务收入</el-radio-button>
                  </el-radio-group>
                </div>
                <div class="filter-row filter-row-uid">
                  <span class="filter-label">用户ID：</span>
                  <el-input-number
                    v-model="adminTxnUserId"
                    :min="1"
                    :controls="false"
                    placeholder="全部用户"
                    style="width: 140px"
                    size="small"
                  />
                  <el-button
                    size="small"
                    type="primary"
                    @click="handleSearchAdminTransactions"
                  >
                    查询
                  </el-button>
                </div>
              </div>

              <div class="table-scroll-wrapper">
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
              </div>
              <div class="tab-tip">
                当前流水数据来自接口 <code>/admin/transactions</code>，展示最近 100 条记录。
              </div>
            </el-tab-pane>
          </el-tabs>
      </div>
    </el-card>

    <!-- 修改昵称弹窗 -->
    <el-dialog
      v-model="nicknameDialogVisible"
      title="修改用户昵称"
      width="400px"
    >
      <div v-if="nicknameTargetUser">
        <p class="dialog-tip">
          正在为用户
          <strong>{{ nicknameTargetUser.nickname || nicknameTargetUser.email }}</strong>
          修改昵称
        </p>
        <el-form @submit.prevent>
          <el-form-item label="新昵称">
            <el-input
              v-model="newNickname"
              placeholder="请输入新昵称"
              maxlength="30"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="nicknameDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="nicknameSubmitting" @click="handleUpdateNickname">确认修改</el-button>
      </template>
    </el-dialog>

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

import {
  getUserList,
  changeUserRole,
  resetUserPassword,
  deleteUser,
  deleteUsersBatch,
  updateUserNickname,
  cleanTestUsers,
  getProfile,
  type UserItem,
  type UserProfile,
  type UserRole,
} from '@/api/user'

import type { Task } from '@/api/task'
import { getAdminTasks, getAdminTransactions, type AdminTransaction } from '@/api/admin'
import http from '@/api/http'

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

// 批量选择
const userTableRef = ref()
const selectedUserIds = ref<number[]>([])

// 移动端批量模式
const mobileBatchMode = ref(false)
const mobileSelectedIds = ref<number[]>([])

// 修改昵称弹窗
const nicknameDialogVisible = ref(false)
const newNickname = ref('')
const nicknameTargetUser = ref<UserItem | null>(null)
const nicknameSubmitting = ref(false)

// 是否是超级管理员
const isSuperAdmin = computed(
  () => currentUser.value?.role === 'SUPER_ADMIN',
)

// 是否是管理员及以上
const isAdmin = computed(
  () => currentUser.value?.role === 'ADMIN' || currentUser.value?.role === 'SUPER_ADMIN',
)

// 是否可以管理某用户的角色
const canManageRole = (row: UserItem) => {
  if (row.id === currentUser.value?.id) return false
  if (isSuperAdmin.value) return true
  if (!isAdmin.value) return false
  return row.role === 'USER' || row.role === 'ADMIN'
}

// 是否可以重置某用户密码
const canResetPassword = (row: UserItem) => {
  if (row.id === currentUser.value?.id) return false
  if (isSuperAdmin.value) return true
  if (!isAdmin.value) return false
  return row.role === 'USER'
}

// 是否可以封禁/解封某用户
const canBan = (row: UserItem) => {
  if (row.id === currentUser.value?.id) return false
  if (isSuperAdmin.value) return true
  if (!isAdmin.value) return false
  return row.role === 'USER'
}

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

// 调整角色
const handleChangeRole = async (user: UserItem, targetRole: UserRole) => {
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

// 打开昵称弹窗
const openNicknameDialog = (user: UserItem) => {
  nicknameTargetUser.value = user
  newNickname.value = user.nickname || ''
  nicknameDialogVisible.value = true
}

// 提交修改昵称
const handleUpdateNickname = async () => {
  if (!nicknameTargetUser.value) return
  if (!newNickname.value.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }
  nicknameSubmitting.value = true
  try {
    await updateUserNickname(nicknameTargetUser.value.id, newNickname.value.trim())
    ElMessage.success('昵称已修改')
    nicknameDialogVisible.value = false
    await fetchUsers()
  } catch (e: any) {
    console.error('修改昵称失败:', e)
    ElMessage.error(e?.response?.data?.message || '修改失败')
  } finally {
    nicknameSubmitting.value = false
  }
}

// 封禁用户
const handleBanUser = async (user: UserItem) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入封禁原因',
      '封禁用户',
      { type: 'warning', confirmButtonText: '确认封禁', cancelButtonText: '取消' },
    )
    await http.patch(`/user/${user.id}/ban`, { reason })
    ElMessage.success('已封禁')
    await fetchUsers()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') {
      console.error('封禁失败:', e)
    }
  }
}

// 解封用户
const handleUnbanUser = async (user: UserItem) => {
  try {
    await ElMessageBox.confirm(
      `确定解封用户「${user.nickname || user.email}」吗？`,
      '解封确认',
      { type: 'info' },
    )
    await http.patch(`/user/${user.id}/unban`)
    ElMessage.success('已解封')
    await fetchUsers()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') {
      console.error('解封失败:', e)
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

// 一键清理测试用户
const handleCleanTestUsers = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除所有测试账号及其关联数据吗？此操作不可恢复！',
      '⚠️ 清理测试用户',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
    const result: any = await cleanTestUsers()
    ElMessage.success(`已清理 ${result.deleted || 0} 个测试账号`)
    clearSelection()
    await fetchUsers()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') {
      console.error('清理失败:', e)
      ElMessage.error('清理失败: ' + (e?.response?.data?.message || e?.message || ''))
    }
  }
}

// =========== 桌面批量选择 ===========
const handleSelectionChange = (rows: UserItem[]) => {
  selectedUserIds.value = rows.map(r => r.id)
}

const clearSelection = () => {
  selectedUserIds.value = []
  userTableRef.value?.clearSelection()
}

const handleBatchDelete = async () => {
  const count = selectedUserIds.value.length
  if (count === 0) {
    ElMessage.warning('请先勾选要删除的用户')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除勾选的 ${count} 个用户及其所有关联数据吗？此操作不可恢复！`,
      '⚠️ 批量删除用户',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
    const result: any = await deleteUsersBatch(selectedUserIds.value)
    ElMessage.success(`已删除 ${result.deleted || 0} 个用户`)
    clearSelection()
    await fetchUsers()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') {
      console.error('批量删除失败:', e)
      ElMessage.error('批量删除失败: ' + (e?.response?.data?.message || e?.message || ''))
    }
  }
}

// =========== 移动端批量模式 ===========
const toggleMobileBatch = () => {
  mobileBatchMode.value = !mobileBatchMode.value
  if (!mobileBatchMode.value) {
    mobileSelectedIds.value = []
  }
}

const toggleMobileSelect = (userId: number) => {
  const idx = mobileSelectedIds.value.indexOf(userId)
  if (idx >= 0) {
    mobileSelectedIds.value.splice(idx, 1)
  } else {
    mobileSelectedIds.value.push(userId)
  }
}

const handleMobileBatchDelete = async () => {
  const count = mobileSelectedIds.value.length
  if (count === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除勾选的 ${count} 个用户及其所有关联数据吗？此操作不可恢复！`,
      '⚠️ 批量删除用户',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
    const result: any = await deleteUsersBatch(mobileSelectedIds.value)
    ElMessage.success(`已删除 ${result.deleted || 0} 个用户`)
    mobileSelectedIds.value = []
    mobileBatchMode.value = false
    await fetchUsers()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') {
      console.error('批量删除失败:', e)
      ElMessage.error('批量删除失败: ' + (e?.response?.data?.message || e?.message || ''))
    }
  }
}

// 资金监控 Tab 内的查询按钮
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

// 金额格式化
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
    await fetchUsers()
  }
})

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
  flex-wrap: wrap;
  gap: 8px;
}

.card-header-title {
  white-space: nowrap;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px 14px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
  font-size: 14px;
}

.loading-wrapper {
  padding: 24px 0;
}

.no-permission {
  padding: 40px 0;
}

.tab-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
}

.dialog-tip {
  margin-bottom: 12px;
}

/* ---- Tabs: 移动端允许原生横向滚动（不截断） ---- */
.admin-tabs :deep(.el-tabs__nav-wrap) {
  overflow: visible;
}
.admin-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.admin-tabs :deep(.el-tabs__header) {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.admin-tabs :deep(.el-tabs__header::-webkit-scrollbar) {
  display: none;
}
.admin-tabs :deep(.el-tabs__nav) {
  white-space: nowrap;
  flex-wrap: nowrap;
}
.admin-tabs :deep(.el-tabs__item) {
  flex: 0 0 auto;
  min-width: auto;
}

/* ---- 筛选栏 ---- */
.task-filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  padding-bottom: 4px;
}

.filter-label {
  margin-right: 8px;
  font-size: 13px;
  color: #cbd5e1;
  flex-shrink: 0;
}

.filter-radio-group {
  flex-shrink: 0;
}

/* ---- 资金监控筛选 ---- */
.wallet-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.filter-row {
  display: flex;
  align-items: center;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  padding-bottom: 2px;
}

.filter-row-uid {
  gap: 8px;
}

.user-id-text {
  margin-left: 4px;
  font-size: 13px;
  color: #94a3b8;
}

.text-green {
  color: #6ee7b7;
  font-weight: 600;
}

.text-red {
  color: #fca5a5;
  font-weight: 600;
}

/* ---- 表格横向滚动包裹 ---- */
.table-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ---- 桌面/移动端显示控制 ---- */
.desktop-only {
  display: block;
}
.mobile-only {
  display: none;
}

/* ---- 移动端用户卡片 ---- */
.user-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-batch-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.user-card {
  background: rgba(17, 24, 39, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  padding: 12px 14px;
  transition: border-color 0.2s;
}
.user-card-selected {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.08);
}

.user-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.user-card-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.user-card-nickname {
  font-weight: 600;
  font-size: 15px;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-card-id {
  font-size: 12px;
  color: #64748b;
}

.user-card-badges {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.user-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.meta-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
}
.meta-value {
  font-size: 13px;
  color: #cbd5e1;
  word-break: break-all;
}
.meta-value.balance {
  color: #6ee7b7;
  font-weight: 600;
}

.user-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ==================== 移动端适配 ==================== */
@media (max-width: 768px) {
  .user-list-page {
    padding: 0;
  }

  /* el-card 内部缩到最小，且不裁剪下拉菜单 */
  :deep(.el-card__body) {
    padding: 10px 8px !important;
    overflow: visible !important;
  }

  /* 确保 tabs 容器不裁剪 */
  .admin-tabs {
    overflow: visible;
  }

  .card-header {
    font-size: 13px;
    gap: 6px;
  }

  .role-tag {
    font-size: 11px !important;
  }

  .clean-btn {
    font-size: 11px !important;
    padding: 4px 8px !important;
  }

  /* 隐藏桌面表格，显示移动卡片 */
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex;
  }

  /* 筛选栏横向滚动 */
  .task-filter-bar {
    padding-bottom: 6px;
  }

  /* 表格横向滚动 */
  .table-scroll-wrapper {
    margin-left: -8px;
    margin-right: -8px;
  }

  /* 弹窗全宽 */
  :deep(.el-dialog) {
    width: 92% !important;
    max-width: 400px;
  }

  /* 批量模式栏移动端紧凑 */
  .batch-bar {
    font-size: 12px;
    padding: 6px 10px;
    flex-wrap: wrap;
    gap: 6px;
  }
}
</style>
