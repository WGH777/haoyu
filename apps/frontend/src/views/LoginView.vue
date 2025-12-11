<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>🚀 浩煜平台 | 登录</h2>
        </div>
      </template>

      <el-form
        :model="form"
        :rules="rules"
        ref="loginFormRef"
        label-position="top"
        autocomplete="off"
      >
        <el-form-item label="邮箱 Email" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="密码 Password" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            autocomplete="new-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="w-100"
          size="large"
          @click="handleLogin"
          :loading="isLoading"
        >
          立即登录
        </el-button>

        <div class="links">
          <el-link type="primary" @click="router.push('/register')">
            注册新账号
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import http from '../api/http'

const router = useRouter()
const isLoading = ref(false)
const loginFormRef = ref<FormInstance>()

// ✅ 初始值全部为空
const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 每次进入登录页，强制清空一次表单（防止组件缓存带来残留）
onMounted(() => {
  form.email = ''
  form.password = ''
})

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    isLoading.value = true

    const res: any = await http.post('/auth/login', {
      email: form.email,
      password: form.password
    })

    const token = res?.accessToken
    const user = res?.user

    if (!token) {
      ElMessage.error('登录失败：后端未返回令牌')
      return
    }

    localStorage.setItem('token', token)
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }

    ElMessage.success('登录成功！')
    router.push('/')
  } catch (error: any) {
    console.error('登录报错:', error)
    ElMessage.error(
      error?.response?.data?.message || '登录失败，请检查账号密码'
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}
.login-card {
  width: 400px;
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
