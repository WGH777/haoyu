<template>
  <div class="register-page">
    <div class="register-box">
      <div class="register-header">
        <span class="logo-mark">煜</span>
        <h1>加入浩煜</h1>
        <p>免费注册，开始发布需求或提供服务</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @keyup.enter="handleRegister">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="你的称呼" size="large" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="your@email.com" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="至少6位" show-password size="large" />
        </el-form-item>
        <el-button type="primary" size="large" @click="handleRegister" :loading="loading" round block>
          注册
        </el-button>
      </el-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <router-link to="/login">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const formRef = ref()

const form = reactive({ nickname: '', email: '', password: '' })
const rules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res: any = await register(form.nickname, form.email, form.password)
    // 自动登录
    if (res.accessToken || res.access_token) {
      localStorage.setItem('token', res.accessToken || res.access_token)
      if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
      if (res.user) localStorage.setItem('currentUser', JSON.stringify(res.user))
    }
    ElMessage.success('注册成功')
    router.push('/task')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '注册失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
}
.register-box {
  background: #fff; border-radius: 16px; padding: 40px; width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.register-header { text-align: center; margin-bottom: 28px; }
.logo-mark {
  width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-radius: 12px; display: inline-flex; align-items: center;
  justify-content: center; font-size: 24px; font-weight: 700; margin-bottom: 12px;
}
.register-header h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
.register-header p { color: #94a3b8; font-size: 14px; margin: 0; }
.register-footer {
  margin-top: 20px; text-align: center; font-size: 13px; color: #94a3b8;
  display: flex; gap: 6px; justify-content: center;
}
.register-footer a { color: #6366f1; text-decoration: none; font-weight: 500; }
</style>
