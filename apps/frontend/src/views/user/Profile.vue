<template>
  <div class="profile-page">
    <!-- ====== 桌面端布局 ====== -->
    <div class="profile-desktop">
    <el-row :gutter="20" class="profile-layout">
      <!-- 左边：账号信息 + 编辑资料 -->
      <el-col :xs="24" :sm="10">
        <el-card shadow="hover" v-loading="loadingProfile">
          <template #header>
            <div class="card-header header-with-action">
              <span>账号信息</span>

              <div class="header-actions">
                <el-button
                  v-if="!editingProfile"
                  type="primary"
                  size="small"
                  :disabled="!profile"
                  @click="openEditProfile"
                >
                  编辑资料
                </el-button>

                <template v-else>
                  <el-button
                    type="success"
                    size="small"
                    :loading="savingProfile"
                    @click="handleSaveProfile"
                  >
                    保存
                  </el-button>
                  <el-button size="small" @click="cancelEditProfile">
                    取消
                  </el-button>
                </template>
              </div>
            </div>
          </template>

          <!-- 展示模式 -->
          <div v-if="!editingProfile">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="昵称">
                {{ profile?.nickname || '-' }}
              </el-descriptions-item>

              <el-descriptions-item label="邮箱">
                {{ profile?.email || '-' }}
              </el-descriptions-item>

              <el-descriptions-item label="角色">
                <el-tag v-if="profile" size="small" :type="roleTagType">
                  {{ roleLabel }}
                </el-tag>
              </el-descriptions-item>

              <el-descriptions-item label="余额">
                <span v-if="profile">
                  {{ formatYumiFromCent(profile?.wallet?.available ?? 0) }}
                </span>
                <span v-else>-</span>
              </el-descriptions-item>

              <el-descriptions-item label="简介">
                {{ profile?.bio || '-' }}
              </el-descriptions-item>

              <el-descriptions-item label="头像">
                <div class="avatar-row">
                  <el-image
                    v-if="profile?.avatar"
                    :src="profile.avatar"
                    fit="cover"
                    class="avatar-img"

                  >
                    <template #error>
                      <div class="avatar-fallback">{{ profile?.nickname?.[0] || '煜' }}</div>
                    </template>
                  </el-image>
                  <div v-else class="avatar-fallback">{{ profile?.nickname?.[0] || '煜' }}</div>
                </div>
              </el-descriptions-item>

              <el-descriptions-item label="创建时间">
                {{ profile ? formatTime(profile.createdAt) : '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 编辑模式 -->
          <div v-else>
            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="80px"
            >
              <el-form-item label="昵称" prop="nickname">
                <el-input
                  v-model="profileForm.nickname"
                  maxlength="50"
                  show-word-limit
                  placeholder="请输入昵称"
                />
              </el-form-item>

              <el-form-item label="简介" prop="bio">
                <el-input
                  v-model="profileForm.bio"
                  type="textarea"
                  :rows="3"
                  maxlength="200"
                  show-word-limit
                  placeholder="请输入个人简介（可选）"
                />
              </el-form-item>

              <el-form-item label="头像URL" prop="avatar">
                <el-input
                  v-model="profileForm.avatar"
                  maxlength="500"
                  show-word-limit
                  placeholder="请输入头像 URL（可选，留空则清空）"
                />
              </el-form-item>

              <el-form-item label="预览">
                <div class="avatar-row">
                  <el-image
                    v-if="profileForm.avatar"
                    :src="profileForm.avatar"
                    fit="cover"
                    class="avatar-img"
                  />
                  <span v-else>（无）</span>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 右边：修改密码 -->
      <el-col :xs="24" :sm="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>修改密码</span>
            </div>
          </template>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="rules"
            label-width="100px"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入原密码"
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="至少 6 位，建议包含大小写字母和数字"
              />
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                placeholder="再次输入新密码"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="submitting"
                @click="handleChangePassword"
              >
                提交修改
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>

            <el-alert
              title="安全提示：修改密码成功后，将自动退出登录，需要使用新密码重新登录。"
              type="info"
              show-icon
              :closable="false"
            />
          </el-form>
        </el-card>
      </el-col>
    </el-row>
    </div><!-- /.profile-desktop -->

    <!-- ====== 移动端用户中心聚合页 ====== -->
    <div class="profile-mobile" v-loading="loadingProfile">
      <div class="uc-profile-section">
        <div class="uc-avatar">
          <el-image
            v-if="profile?.avatar"
            :src="profile.avatar"
            fit="cover"
            class="uc-avatar-img"
          >
            <template #error>
              <span class="uc-avatar-fallback">{{ profile?.nickname?.[0] || profile?.email?.[0]?.toUpperCase() || '煜' }}</span>
            </template>
          </el-image>
          <span v-else class="uc-avatar-fallback">{{ profile?.nickname?.[0] || profile?.email?.[0]?.toUpperCase() || '煜' }}</span>
        </div>
        <div class="uc-profile-info">
          <div class="uc-nickname">{{ profile?.nickname || profile?.email?.split('@')[0] || '用户' }}</div>
          <div class="uc-role">{{ profile?.email || '' }}</div>
        </div>
      </div>

      <div class="uc-stats-bar">
        <div class="uc-stat-item">
          <span class="uc-stat-num">{{ taskStats.total }}</span>
          <span class="uc-stat-label">全部任务</span>
        </div>
        <div class="uc-stat-item">
          <span class="uc-stat-num">{{ taskStats.rate }}</span>
          <span class="uc-stat-label">好评率</span>
        </div>
        <div class="uc-stat-item">
          <span class="uc-stat-num">{{ formatYumiCompactFromCent(profile?.wallet?.available ?? 0) }}</span>
          <span class="uc-stat-label">余额</span>
        </div>
        <div class="uc-stat-item">
          <span class="uc-stat-num">—</span>
          <span class="uc-stat-label">信用分</span>
        </div>
      </div>

      <section class="uc-management-section">
        <h3 class="uc-section-title">📌 管理中心</h3>
        <div class="uc-management-grid">
          <div v-for="item in managementLinks" :key="item.label" class="uc-mgmt-card" @click="$router.push(item.path)">
            <span class="uc-mgmt-icon">{{ item.icon }}</span>
            <div class="uc-mgmt-info">
              <span class="uc-mgmt-label">{{ item.label }}</span>
              <span class="uc-mgmt-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="uc-task-section">
        <h3 class="uc-section-title">📋 任务概况</h3>
        <div class="uc-task-cards">
          <div class="uc-task-card" @click="$router.push('/my-task?status=PENDING')">
            <span class="uc-task-count pending-count">{{ taskStats.pending }}</span>
            <span class="uc-task-label">待接单</span>
            <span class="uc-task-status">等待服务者领取</span>
          </div>
          <div class="uc-task-card" @click="$router.push('/my-task?status=IN_PROGRESS')">
            <span class="uc-task-count active-count">{{ taskStats.active }}</span>
            <span class="uc-task-label">进行中</span>
            <span class="uc-task-status">服务中或待验收</span>
          </div>
          <div class="uc-task-card" @click="$router.push('/my-task?status=COMPLETED')">
            <span class="uc-task-count done-count">{{ taskStats.done }}</span>
            <span class="uc-task-label">已完成</span>
            <span class="uc-task-status">交易成功已结算</span>
          </div>
          <div class="uc-task-card" @click="$router.push('/my-task?status=CANCELLED')">
            <span class="uc-task-count cancel-count">{{ taskStats.cancelled }}</span>
            <span class="uc-task-label">已取消</span>
            <span class="uc-task-status">已关闭或争议</span>
          </div>
        </div>
      </section>
    </div><!-- /.profile-mobile -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { formatYumiFromCent, formatYumiCompactFromCent } from '@/utils/money'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import http from '@/api/http'
import { getProfile, updateProfile } from '@/api/user'
import type { UserProfile } from '@/api/user'

const profile = ref<UserProfile | null>(null)
const loadingProfile = ref(false)

const editingProfile = ref(false)
const savingProfile = ref(false)
const profileFormRef = ref<FormInstance>()
const profileForm = reactive({
  nickname: '',
  bio: '',
  avatar: '',
})

// 基础校验（不改变后端规则，仅做前端友好提示）
const profileRules: FormRules<typeof profileForm> = {
  nickname: [
    {
      validator: (_rule, value, callback) => {
        if (typeof value !== 'string') return callback(new Error('昵称必须是字符串'))
        if (value.length > 50) return callback(new Error('昵称长度不能超过 50 个字符'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
  bio: [
    {
      validator: (_rule, value, callback) => {
        if (typeof value !== 'string') return callback(new Error('简介必须是字符串'))
        if (value.length > 200) return callback(new Error('简介长度不能超过 200 个字符'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
  avatar: [
    {
      validator: (_rule, value, callback) => {
        if (typeof value !== 'string') return callback(new Error('头像URL必须是字符串'))
        if (value.length > 500) return callback(new Error('头像 URL 不能超过 500 个字符'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
}

const passwordFormRef = ref<FormInstance>()
const submitting = ref(false)

// ====== 移动端用户中心数据 ======
const managementLinks = [
  { icon: '📋', label: '我的任务', desc: '查看与管理的任务', path: '/my-task' },
  { icon: '💰', label: '钱包', desc: '余额与交易记录', path: '/wallet' },
  { icon: '🛡️', label: '信任中心', desc: '信用记录与保障', path: '/trust' },
  { icon: '⚙️', label: '个人设置', desc: '编辑资料与密码', path: '/profile' },
]

// 任务统计（UI 展示用，后续可对接后端统计接口）
const taskStats = {
  total: '—',
  rate: '—',
  pending: '—',
  active: '—',
  done: '—',
  cancelled: '—',
}

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 角色展示文本
const roleLabel = computed(() => {
  if (!profile.value) return '-'
  switch (profile.value.role) {
    case 'SUPER_ADMIN':
      return '超级管理员'
    case 'ADMIN':
      return '管理员'
    case 'USER':
      return '普通用户'
    default:
      return profile.value.role
  }
})

// 角色标签颜色
const roleTagType = computed<'success' | 'warning' | ''>(() => {
  if (!profile.value) return ''
  if (profile.value.role === 'SUPER_ADMIN') return 'success'
  if (profile.value.role === 'ADMIN') return 'warning'
  return ''
})

// 表单校验规则（修改密码）
const rules: FormRules<typeof passwordForm> = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '原密码长度至少 6 位', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入新密码'))
        } else if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const formatTime = (t: string) => {
  if (!t) return '-'
  try {
    const date = new Date(t)
    return date.toLocaleString()
  } catch {
    return t
  }
}

// 加载当前用户信息（从后端 /user/profile 获取最新）
const loadProfile = async () => {
  try {
    loadingProfile.value = true
    const res = await getProfile()
    profile.value = res
    // 同步一份到 localStorage，方便其它地方使用
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch (error) {
    console.error('加载个人信息失败:', error)
    ElMessage.error('加载个人信息失败，请稍后重试')
  } finally {
    loadingProfile.value = false
  }
}

const openEditProfile = () => {
  if (!profile.value) return
  profileForm.nickname = profile.value.nickname || ''
  profileForm.bio = profile.value.bio || ''
  profileForm.avatar = profile.value.avatar || ''
  editingProfile.value = true
}

const cancelEditProfile = () => {
  editingProfile.value = false
  // 回填为当前 profile，避免“取消后表单残留”
  if (profile.value) {
    profileForm.nickname = profile.value.nickname || ''
    profileForm.bio = profile.value.bio || ''
    profileForm.avatar = profile.value.avatar || ''
  } else {
    profileForm.nickname = ''
    profileForm.bio = ''
    profileForm.avatar = ''
  }
}

const handleSaveProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
  } catch {
    return
  }

  savingProfile.value = true
  try {
    const payload = {
      nickname: profileForm.nickname,
      bio: profileForm.bio,
      // 约定：留空则清空头像（后端允许 avatar:null）
      avatar: profileForm.avatar.trim() ? profileForm.avatar.trim() : null,
    }

    const res = await updateProfile(payload)
    profile.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))

    editingProfile.value = false
    ElMessage.success('个人资料已更新')
  } catch (error) {
    console.error('更新个人资料失败:', error)
    // 具体错误提示由 http.ts 统一处理
  } finally {
    savingProfile.value = false
  }
}

const resetForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    // 与后端 PATCH /auth/change-password 对齐
    await http.patch('/auth/change-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })

    ElMessage.success('密码修改成功，请重新登录')

    // 清理本地登录信息并跳转登录页
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    window.location.href = '/login'
  } catch (error) {
    console.error('修改密码失败:', error)
    // 具体错误提示由 http.ts 统一处理
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  padding: 16px;
  min-height: 100vh;
  background: #05070d;
}

.card-header {
  font-weight: 600;
  font-size: 15px;
}

.header-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-fallback {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  user-select: none;
}

@media (max-width: 992px) {
  .profile-desktop { padding: 8px; }
}

/* 移动端用户中心 — 桌面端隐藏 */
.profile-mobile { display: none; }

/* ====== 移动端用户中心 ====== */
@media (max-width: 768px) {
  .profile-page { padding: 0; max-width: 100vw; overflow-x: hidden; background: #05070d; }
  .profile-desktop { display: none; }
  .profile-mobile { display: block; padding-bottom: calc(100px + env(safe-area-inset-bottom)); }

  .uc-profile-section {
    display: flex; align-items: center; gap: 14px; padding: 20px 14px; height: 120px;
    background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(251,191,36,0.04));
    border-bottom: 1px solid rgba(148,163,184,0.06);
  }
  .uc-avatar { width: 58px; height: 58px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg,#6366f1,#818cf8); }
  .uc-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .uc-avatar-fallback { width: 58px; height: 58px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 700; }
  .uc-profile-info { display: flex; flex-direction: column; gap: 4px; }
  .uc-nickname { font-size: 19px; font-weight: 700; color: #f1f5f9; }
  .uc-role { font-size: 12px; color: rgba(255,255,255,0.5); }

  .uc-stats-bar { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 16px 14px 0; }
  .uc-stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; background: rgba(17,24,39,0.5); border: 1px solid rgba(148,163,184,0.08); border-radius: 14px; }
  .uc-stat-num { font-size: 19px; font-weight: 900; background: linear-gradient(135deg,#a5b4fc,#67e8f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; }
  .uc-stat-label { font-size: 10px; color: #64748b; }

  .uc-section-title { font-size: 17px; font-weight: 700; color: #f1f5f9; margin: 0 0 12px; padding: 0; }

  .uc-management-section { padding: 18px 14px 0; }
  .uc-management-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .uc-mgmt-card { display: flex; align-items: center; gap: 10px; padding: 14px; background: rgba(17,24,39,0.55); border: 1px solid rgba(148,163,184,0.08); border-radius: 16px; min-height: 68px; cursor: pointer; transition: all 0.2s; }
  .uc-mgmt-card:active { background: rgba(17,24,39,0.75); border-color: rgba(251,191,36,0.15); }
  .uc-mgmt-icon { font-size: 22px; flex-shrink: 0; }
  .uc-mgmt-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .uc-mgmt-label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }
  .uc-mgmt-desc { font-size: 11px; color: rgba(180,190,210,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .uc-task-section { padding: 18px 14px 0; }
  .uc-task-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .uc-task-card { padding: 14px; border-radius: 16px; background: rgba(17,24,39,0.5); border: 1px solid rgba(148,163,184,0.08); min-height: 100px; display: flex; flex-direction: column; justify-content: center; gap: 4px; cursor: pointer; transition: all 0.2s; }
  .uc-task-card:active { background: rgba(17,24,39,0.75); }
  .uc-task-count { font-size: 24px; font-weight: 900; line-height: 1; }
  .pending-count { color: #a78bfa; }
  .active-count { color: #fbbf24; }
  .done-count { color: #4ade80; }
  .cancel-count { color: #94a3b8; }
  .uc-task-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.65); }
  .uc-task-status { font-size: 11px; color: rgba(180,190,210,0.35); }
}

@media (max-width: 375px) {
  .uc-avatar { width: 54px; height: 54px; }
  .uc-avatar-fallback { width: 54px; height: 54px; font-size: 20px; }
  .uc-nickname { font-size: 17px; }
  .uc-stat-num { font-size: 17px; }
  .uc-mgmt-card { min-height: 64px; padding: 12px; }
  .uc-task-count { font-size: 22px; }
}

@media (min-width: 391px) and (max-width: 430px) {
  .uc-avatar { width: 62px; height: 62px; }
  .uc-avatar-fallback { width: 62px; height: 62px; font-size: 24px; }
  .uc-nickname { font-size: 20px; }
  .uc-stat-num { font-size: 20px; }
  .uc-mgmt-card { min-height: 72px; }
  .uc-task-count { font-size: 24px; }
}
</style>
