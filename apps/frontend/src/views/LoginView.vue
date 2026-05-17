<template>
  <div class="login-page">
    <!-- 背景光晕 -->
    <div class="login-bg-glow"></div>

    <div class="login-box">
      <div class="login-header">
        <div class="logo-mark">
          <span>煜</span>
        </div>
        <h1>欢迎回到浩煜</h1>
        <p>可信价值协作平台 · 资金托管保障每一次协作</p>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="loginFormRef"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="your@email.com"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="输入密码"
            show-password
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          @click="handleLogin"
          :loading="loading"
          round
          class="login-btn"
        >
          登录浩煜
        </el-button>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register">免费注册</router-link>
        <span class="sep">|</span>
        <router-link to="/task">先看看平台</router-link>
      </div>
    </div>

    <!-- 底部文案 -->
    <div class="login-bottom-text">
      <span>🔒 资金托管 · 信用沉淀 · 智能仲裁</span>
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
  email: [
    { required: true, message: '请输入你的邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res: any = await login(form.email, form.password)
    localStorage.setItem('token', res.accessToken || res.access_token)
    if (res.user) localStorage.setItem('currentUser', JSON.stringify(res.user))
    ElMessage.success('登录成功，欢迎回来')
    const redirect = (route.query.redirect as string) || '/task'
    router.push(redirect)
  } catch (e: any) {
    const msg = e?.response?.data?.message || '登录失败，请检查邮箱和密码'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0e17;
  position: relative;
  overflow: hidden;
}

/* 背景光晕 */
.login-bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 20% 70%, rgba(6, 182, 212, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 80% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 50%);
}

/* 登录卡片 */
.login-box {
  position: relative;
  z-index: 1;
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  padding: 44px 40px 36px;
  width: 420px;
  max-width: 92vw;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(148, 163, 184, 0.06) inset;
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}

.login-box:focus-within {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow:
    0 8px 40px rgba(99, 102, 241, 0.08),
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(148, 163, 184, 0.06) inset;
}

/* 头部 */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-mark {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

.login-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.login-header p {
  color: #64748b;
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 4px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.25);
  transition: all 0.3s ease;
}
.login-btn:hover {
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
  background: linear-gradient(135deg, #818cf8, #a78bfa) !important;
}

/* 底部链接 */
.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.login-footer a {
  color: #818cf8;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.login-footer a:hover {
  color: #a5b4fc;
}

.sep {
  color: #334155;
}

/* 底部保障文案 */
.login-bottom-text {
  position: relative;
  z-index: 1;
  margin-top: 28px;
  font-size: 12px;
  color: #475569;
  letter-spacing: 0.5px;
  text-align: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-box {
    padding: 32px 24px 28px;
    border-radius: 16px;
  }
  .login-header h1 {
    font-size: 20px;
  }
  .logo-mark {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
}
</style>
