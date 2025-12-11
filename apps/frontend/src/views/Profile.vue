<!-- apps/frontend/src/views/Profile.vue -->
<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <!-- 左边：账号信息 -->
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>账号信息</span>
            </div>
          </template>

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
                {{ (profile.balance || 0) / 100 }} 元
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ profile ? formatTime(profile.createdAt) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右边：修改密码 -->
      <el-col :span="14">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import http from '../api/http'

interface UserProfile {
  id: number
  email: string
  nickname: string | null
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | string
  balance: number
  createdAt: string
  updatedAt: string
}

const profile = ref<UserProfile | null>(null)
const loadingProfile = ref(false)

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

// 表单校验规则
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
    const res = await http.get<UserProfile>('/user/profile')
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
    // 错误提示 http.ts 已统一处理
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
}

.card-header {
  font-weight: 600;
  font-size: 15px;
}

@media (max-width: 992px) {
  .profile-page {
    padding: 8px;
  }
}
</style>
