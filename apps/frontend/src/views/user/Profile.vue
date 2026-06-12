<template>
  <div class="profile-page">
    <el-row :gutter="20" class="profile-layout">
      <!-- 左边：账号信息 + 编辑资料 -->
      <el-col :xs="24" :sm="10">
        <el-card class="profile-glass-card profile-card" shadow="never" v-loading="loadingProfile">
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
          <div v-if="!editingProfile" class="profile-overview">
            <div class="profile-hero">
              <div class="avatar-ring">
                <el-image
                  v-if="profile?.avatar"
                  :src="profile.avatar"
                  fit="cover"
                  class="avatar-img"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ profile?.nickname?.[0] || 'H' }}</div>
                  </template>
                </el-image>
                <div v-else class="avatar-fallback">{{ profile?.nickname?.[0] || 'H' }}</div>
              </div>
              <div class="profile-title">
                <strong>{{ profile?.nickname || '-' }}</strong>
                <span>{{ profile?.email || '-' }}</span>
              </div>
            </div>

            <div class="profile-fields">
              <div class="info-row profile-field">
                <span class="field-label">&#x5934;&#x50cf;</span>
                <span class="field-value">{{ profile?.avatar ? 'Set' : 'Unset' }}</span>
              </div>
              <div class="info-row profile-field">
                <span class="field-label">&#x6635;&#x79f0;</span>
                <span class="field-value">{{ profile?.nickname || '-' }}</span>
              </div>
              <div class="info-row profile-field">
                <span class="field-label">&#x90ae;&#x7bb1;</span>
                <span class="field-value">{{ profile?.email || '-' }}</span>
              </div>
              <div class="info-row profile-field">
                <span class="field-label">&#x89d2;&#x8272;</span>
                <span class="field-value">
                  <el-tag v-if="profile" size="small" :type="roleTagType" effect="dark">
                    {{ roleLabel }}
                  </el-tag>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="info-row profile-field balance-field">
                <span class="field-label">&#x4f59;&#x989d;</span>
                <span class="field-value">
                  <span v-if="profile">
                    {{ formatYumiFromCent(profile.balance ?? 0) }}
                  </span>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="info-row profile-field bio-field">
                <span class="field-label">&#x7b80;&#x4ecb;</span>
                <span class="field-value">{{ profile?.bio || '-' }}</span>
              </div>
              <div class="info-row profile-field">
                <span class="field-label">&#x521b;&#x5efa;&#x65f6;&#x95f4;</span>
                <span class="field-value">{{ profile ? formatTime(profile.createdAt) : '-' }}</span>
              </div>
            </div>
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
              <el-form-item label="预设头像">
                <div class="avatar-preset-grid">
                  <button
                    v-for="item in avatarPresets"
                    :key="item.label"
                    type="button"
                    class="avatar-preset"
                    :class="{ active: profileForm.avatar === item.value }"
                    @click="selectAvatarPreset(item.value)"
                  >
                    <img :src="item.value" :alt="item.label" />
                    <span>{{ item.label }}</span>
                  </button>
                </div>
              </el-form-item>

              <el-form-item label="头像URL" prop="avatar">
                <el-input
                  v-model="profileForm.avatar"
                  maxlength="500"
                  show-word-limit
                  placeholder="可粘贴图片 URL，或从上方选择预设头像"
                />
              </el-form-item>

              <el-form-item label="预览">
                <div class="avatar-row">
                  <el-image
                    v-if="profileForm.avatar"
                    :src="profileForm.avatar"
                    fit="cover"
                    class="avatar-img"
                  >
                    <template #error>
                      <div class="avatar-fallback">H</div>
                    </template>
                  </el-image>
                  <span v-else>（无）</span>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 右边：修改密码 -->
      <el-col :xs="24" :sm="14">
        <el-card class="profile-glass-card password-card" shadow="never">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { formatYumiFromCent } from '@/utils/money'
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

const avatarSvg = (bg: string, fg: string) => {
  const b = bg.replace('#', '%23')
  const f = fg.replace('#', '%23')
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='24' fill='${b}'/%3E%3Ccircle cx='40' cy='30' r='14' fill='${f}'/%3E%3Cpath d='M15 76c5-25 45-25 50 0' fill='${f}'/%3E%3C/svg%3E`
}

const avatarPresets = [
  { label: '暖金', value: avatarSvg('#d18a2f', '#fff2d6') },
  { label: '紫金', value: avatarSvg('#7c65d8', '#fff2d6') },
  { label: '蓝灰', value: avatarSvg('#1c314f', '#dbeafe') },
  { label: '青金', value: avatarSvg('#2f8f83', '#fef3c7') },
]

const selectAvatarPreset = (value: string) => {
  profileForm.avatar = value
}

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
  width: 100%;
  max-width: 100%;
  padding: 4px 0 0;
  color: #fff2d6;
  overflow-x: hidden;
}

.profile-layout {
  align-items: stretch;
  max-width: 100%;
}

.profile-glass-card {
  min-height: 100%;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 16px;
  background:
    radial-gradient(circle at 92% 10%, rgba(239, 163, 60, .16), transparent 28%),
    linear-gradient(145deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .026));
  box-shadow: 0 22px 54px rgba(0, 0, 0, .34), inset 0 1px 0 rgba(255, 240, 205, .08);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

:deep(.profile-glass-card .el-card__header) {
  border-bottom: 1px solid rgba(255, 214, 145, .14);
  background: linear-gradient(90deg, rgba(255, 224, 170, .08), rgba(88, 68, 141, .08));
}

:deep(.profile-glass-card .el-card__body) {
  padding: 22px;
}

:deep(.profile-glass-card .el-loading-mask) {
  background: rgba(5, 10, 20, .68);
}

.card-header {
  font-weight: 800;
  font-size: 16px;
  color: #ffe4b5;
  letter-spacing: 0;
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

.profile-overview {
  display: grid;
  gap: 18px;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 14px;
  background:
    radial-gradient(circle at 12% 15%, rgba(255, 219, 143, .16), transparent 28%),
    rgba(4, 9, 17, .34);
}

.avatar-ring {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffe6a9, #d58a30 52%, #6856b8);
  box-shadow: 0 0 28px rgba(231, 155, 57, .28);
}

.profile-title {
  min-width: 0;
  display: grid;
  gap: 7px;
}

.profile-title strong {
  color: #fff3db;
  font-size: 22px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.profile-title span {
  color: rgba(255, 232, 196, .62);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.profile-fields {
  display: grid;
  gap: 10px;
}

.info-row,
.profile-field {
  min-width: 0;
}

.profile-field {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 214, 145, .13);
  border-radius: 12px;
  background: rgba(255, 255, 255, .035);
}

.profile-field:hover {
  border-color: rgba(243, 180, 78, .34);
  background: rgba(255, 255, 255, .052);
}

.field-label {
  color: rgba(255, 232, 196, .52);
  font-size: 13px;
}

.field-value {
  min-width: 0;
  color: rgba(255, 242, 214, .9);
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  text-align: right;
}

.balance-field .field-value {
  color: #ffd16e;
  font-size: 18px;
  font-weight: 900;
}

.bio-field {
  align-items: start;
}

.bio-field .field-value {
  text-align: left;
}

.avatar-preset-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.avatar-preset {
  min-width: 0;
  padding: 10px 8px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 14px;
  background: rgba(4, 9, 17, .42);
  color: rgba(255, 232, 196, .72);
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, transform .18s ease;
}

.avatar-preset:hover,
.avatar-preset.active {
  border-color: rgba(255, 214, 145, .48);
  background: rgba(242, 179, 77, .10);
  color: #ffe8ae;
  transform: translateY(-1px);
}

.avatar-preset img {
  width: 48px;
  height: 48px;
  display: block;
  margin: 0 auto 6px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-preset span {
  display: block;
  font-size: 12px;
  text-align: center;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: block;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffe8ae, #e7a648 58%, #7c65d8);
  color: #241307;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  user-select: none;
}

.avatar-row .avatar-img,
.avatar-row .avatar-fallback {
  width: 54px;
  height: 54px;
}

:deep(.profile-glass-card .el-form-item__label) {
  color: rgba(255, 232, 196, .76);
  font-weight: 700;
}

:deep(.profile-glass-card .el-input__wrapper),
:deep(.profile-glass-card .el-textarea__inner) {
  border-radius: 12px;
  background: rgba(4, 9, 17, .58);
  box-shadow: 0 0 0 1px rgba(255, 214, 145, .16) inset;
}

:deep(.profile-glass-card .el-input__wrapper:hover),
:deep(.profile-glass-card .el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px rgba(243, 180, 78, .35) inset;
}

:deep(.profile-glass-card .el-input__wrapper.is-focus),
:deep(.profile-glass-card .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px rgba(255, 216, 139, .58) inset, 0 0 0 3px rgba(243, 180, 78, .10);
}

:deep(.profile-glass-card .el-input__inner),
:deep(.profile-glass-card .el-textarea__inner) {
  color: #fff2d6;
}

:deep(.profile-glass-card .el-input__inner::placeholder),
:deep(.profile-glass-card .el-textarea__inner::placeholder) {
  color: rgba(255, 232, 196, .36);
}

:deep(.profile-glass-card .el-input .el-input__count),
:deep(.profile-glass-card .el-textarea .el-input__count) {
  color: rgba(255, 232, 196, .42);
  background: transparent;
}

:deep(.profile-glass-card .el-button) {
  border-radius: 999px;
  border-color: rgba(255, 214, 145, .20);
  background: rgba(255, 255, 255, .055);
  color: #ffe5b6;
}

:deep(.profile-glass-card .el-button:hover) {
  border-color: rgba(243, 180, 78, .48);
  background: rgba(255, 255, 255, .085);
  color: #ffd16e;
}

:deep(.profile-glass-card .el-button--primary),
:deep(.profile-glass-card .el-button--success) {
  border: 0;
  color: #241307;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d) !important;
  box-shadow: 0 12px 28px rgba(235, 164, 69, .24);
}

:deep(.profile-glass-card .el-button--primary:hover),
:deep(.profile-glass-card .el-button--success:hover) {
  color: #1d1207;
  background: linear-gradient(135deg, #fff0bd, #d89a37 54%, #7c65d8) !important;
}

:deep(.profile-glass-card .el-tag) {
  border-color: rgba(255, 214, 145, .22);
  background: rgba(255, 214, 145, .12);
  color: #ffd98e;
}

:deep(.profile-glass-card .el-alert) {
  border: 1px solid rgba(130, 150, 180, .20);
  border-radius: 12px;
  background: rgba(18, 28, 45, .58);
  color: rgba(221, 232, 246, .78);
}

:deep(.profile-glass-card .el-alert__title),
:deep(.profile-glass-card .el-alert__content) {
  color: rgba(221, 232, 246, .78);
}

@media (max-width: 992px) {
  .profile-page {
    padding: 8px;
  }
}

/* 移动端全宽修复 */
@media (max-width: 768px) {
  .avatar-preset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .profile-page {
    padding: 0 !important;
    max-width: 100vw;
    overflow-x: hidden;
  }
  .profile-layout .el-col {
    margin-bottom: 12px;
  }
  .profile-page .el-descriptions {
    width: 100% !important;
  }
  .profile-page .el-descriptions__label {
    width: 80px !important;
    min-width: 80px !important;
    white-space: nowrap !important;
  }
  .profile-page .el-form-item__label {
    display: block !important;
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 6px !important;
    float: none !important;
  }
  .profile-page .el-form-item__content {
    margin-left: 0 !important;
    width: 100% !important;
  }
  .profile-page .el-input {
    width: 100% !important;
  }
  .profile-page .el-button--primary {
    width: 100% !important;
    margin-bottom: 8px;
  }
  .profile-page .el-card {
    max-width: 100% !important;
  }
}
</style>
