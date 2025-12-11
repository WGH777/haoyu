<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>✨ 浩煜平台 | 注册</h2>
        </div>
      </template>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-position="top"
      >
        <el-form-item label="昵称 Nickname" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="邮箱 Email" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="密码 Password" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码 Confirm" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          class="w-100"
          size="large"
          @click="handleRegister"
          :loading="isLoading"
        >
          立即注册
        </el-button>

        <div class="links">
          <el-link type="primary" @click="router.push('/login')">
            已有账号？去登录
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import http from '../api/http'

const router = useRouter()
const formRef = ref<FormInstance>()
const isLoading = ref(false)

const form = reactive({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (!value) return callback(new Error('请再次输入密码'))
        if (value !== form.password) {
          return callback(new Error('两次输入的密码不一致'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    isLoading.value = true

    await http.post('/auth/register', {
      nickname: form.nickname,
      email: form.email,
      password: form.password
    })

    ElMessage.success('注册成功，请使用新账号登录')
    router.push('/login')
  } catch (error: any) {
    console.error('注册失败:', error)
    // http.ts 拦截器已经弹出了一层错误，这里只兜底
    if (error?.response?.status !== 401) {
      ElMessage.error(
        error?.response?.data?.message || '注册失败，请稍后重试'
      )
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.register-card {
  width: 420px;
}

.card-header {
  text-align: center;
}

.w-100 {
  width: 100%;
  margin-top: 10px;
}

.links {
  margin-top: 20px;
  text-align: center;
}
</style>
