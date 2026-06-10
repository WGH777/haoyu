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

.login-page {
  padding: 32px 18px;
  color: #fff2d6;
  background:
    radial-gradient(circle at 18% 8%, rgba(206, 142, 54, .18), transparent 26%),
    radial-gradient(circle at 80% 0%, rgba(117, 74, 24, .24), transparent 32%),
    linear-gradient(145deg, #040911 0%, #07111e 45%, #160f09 100%);
}

.login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle, rgba(247, 185, 90, .46) 0 1px, transparent 2px),
    linear-gradient(110deg, transparent 0 18%, rgba(236, 160, 73, .08) 18.2%, transparent 18.6% 100%);
  background-size: 150px 150px, 360px 360px;
  opacity: .28;
}

.login-bg-glow {
  background:
    radial-gradient(ellipse 54% 44% at 50% 28%, rgba(245, 184, 91, .12) 0%, transparent 62%),
    radial-gradient(ellipse 42% 34% at 18% 72%, rgba(76, 101, 132, .12) 0%, transparent 52%),
    radial-gradient(ellipse 36% 30% at 82% 18%, rgba(126, 84, 35, .14) 0%, transparent 54%);
}

.login-box {
  background:
    radial-gradient(circle at 92% 12%, rgba(239, 163, 60, .16), transparent 30%),
    linear-gradient(145deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .026));
  border-color: rgba(255, 214, 145, .18);
  box-shadow:
    0 28px 70px rgba(0, 0, 0, .44),
    0 0 40px rgba(196, 125, 43, .16),
    0 0 0 1px rgba(255, 240, 205, .07) inset;
}

.login-box:focus-within {
  border-color: rgba(243, 180, 78, .45);
  box-shadow:
    0 28px 76px rgba(0, 0, 0, .48),
    0 0 48px rgba(236, 163, 62, .2),
    0 0 0 1px rgba(255, 240, 205, .08) inset;
}

.logo-mark {
  color: #241307;
  font-weight: 900;
  background: linear-gradient(145deg, #ffe6a9, #d58a30 58%, #7058b6);
  box-shadow: 0 0 28px rgba(231, 155, 57, .34);
}

.login-header h1 {
  color: #ffe4b5;
  font-weight: 800;
  letter-spacing: 0;
}

.login-header p,
.login-footer {
  color: rgba(255, 232, 196, .62);
}

:deep(.login-box .el-form-item__label) {
  color: rgba(255, 232, 196, .76);
  font-weight: 700;
}

:deep(.login-box .el-input__wrapper) {
  border-radius: 12px;
  background: rgba(4, 9, 17, .58);
  box-shadow: 0 0 0 1px rgba(255, 214, 145, .16) inset;
}

:deep(.login-box .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(243, 180, 78, .35) inset;
}

:deep(.login-box .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(255, 216, 139, .58) inset, 0 0 0 3px rgba(243, 180, 78, .10);
}

:deep(.login-box .el-input__inner) {
  color: #fff2d6;
}

:deep(.login-box .el-input__inner::placeholder) {
  color: rgba(255, 232, 196, .38);
}

.login-btn {
  color: #241307 !important;
  font-weight: 800;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d) !important;
  box-shadow: 0 14px 30px rgba(235, 164, 69, .3);
}

.login-btn:hover {
  background: linear-gradient(135deg, #fff0bd, #d89a37 54%, #7c65d8) !important;
  box-shadow: 0 18px 38px rgba(235, 164, 69, .38);
}

.login-footer a {
  color: #ffd16e;
  font-weight: 700;
}

.login-footer a:hover {
  color: #ffe8ae;
}

.sep {
  color: rgba(255, 214, 145, .22);
}

.login-bottom-text {
  color: rgba(148, 170, 196, .6);
}
</style>
