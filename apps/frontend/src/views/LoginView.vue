<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <span class="logo-mark">煜</span>
        <h1>欢迎回来</h1>
        <p>登录浩煜，继续你的协作之旅</p>
      </div>

      <el-form :model="form" :rules="rules" ref="loginFormRef" label-position="top">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="your@email.com" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="输入密码" show-password size="large" />
        </el-form-item>
        <el-button type="primary" size="large" @click="handleLogin" :loading="loading" round block>
          登录
        </el-button>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register">免费注册</router-link>
        <span class="sep">|</span>
        <router-link to="/task">先看看</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '@/api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const loginFormRef = ref()

const form = reactive({ email: '', password: '' })
const rules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res: any = await login(form.email, form.password)
    localStorage.setItem('token', res.accessToken || res.access_token)
    if (res.user) localStorage.setItem('currentUser', JSON.stringify(res.user))
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/task'
    router.push(redirect)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '登录失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #0a0e17;
}
.login-box {
  background: rgba(17, 24, 39, 0.8); backdrop-filter: blur(20px);
  border: 1px solid rgba(51, 65, 85, 0.4); border-radius: 16px; padding: 40px; width: 400px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}
.login-header { text-align: center; margin-bottom: 28px; }
.logo-mark {
  width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-radius: 12px; display: inline-flex; align-items: center;
  justify-content: center; font-size: 24px; font-weight: 700; margin-bottom: 12px;
}
.login-header h1 { font-size: 22px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
.login-header p { color: #64748b; font-size: 14px; margin: 0; }
.login-footer {
  margin-top: 20px; text-align: center; font-size: 13px; color: #94a3b8;
  display: flex; gap: 8px; justify-content: center;
}
.login-footer a { color: #6366f1; text-decoration: none; font-weight: 500; }
.sep { color: #cbd5e1; }
</style>
