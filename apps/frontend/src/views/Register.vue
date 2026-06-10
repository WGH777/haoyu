<template>
  <div class="register-page">
    <!-- 背景光晕 -->
    <div class="register-bg-glow"></div>

    <div class="register-box">
      <div class="register-header">
        <div class="logo-mark">
          <span>煜</span>
        </div>
        <h1>加入浩煜</h1>
        <p>免费注册，开始发布需求或提供服务</p>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-position="top"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="大家怎么称呼你？"
            size="large"
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="your@email.com"
            size="large"
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少 6 位，建议混合字母和数字"
            show-password
            size="large"
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          @click="handleRegister"
          :loading="loading"
          round
          class="register-btn"
        >
          注册
        </el-button>
      </el-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <router-link to="/login">去登录</router-link>
      </div>
    </div>

    <div class="register-bottom-text">
      <span>🔒 你的信息受资金托管级安全保障</span>
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
  nickname: [
    { required: true, message: '请输入你的昵称', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res: any = await register(form.nickname, form.email, form.password)
    if (res.accessToken || res.access_token) {
      localStorage.setItem('token', res.accessToken || res.access_token)
      if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
      if (res.user) localStorage.setItem('currentUser', JSON.stringify(res.user))
    }
    ElMessage.success('注册成功，欢迎加入浩煜')
    router.push('/task')
  } catch (e: any) {
    const msg = e?.response?.data?.message || '注册失败，请稍后重试'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
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
.register-bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 20% 70%, rgba(6, 182, 212, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 80% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 50%);
}

/* 注册卡片 */
.register-box {
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

.register-box:focus-within {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow:
    0 8px 40px rgba(99, 102, 241, 0.08),
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(148, 163, 184, 0.06) inset;
}

/* 头部 */
.register-header {
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

.register-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.register-header p {
  color: #64748b;
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

/* 注册按钮 */
.register-btn {
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
.register-btn:hover {
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
  background: linear-gradient(135deg, #818cf8, #a78bfa) !important;
}

/* 底部链接 */
.register-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
}

.register-footer a {
  color: #818cf8;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.register-footer a:hover {
  color: #a5b4fc;
}

/* 底部安全提示 */
.register-bottom-text {
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
  .register-box {
    padding: 32px 24px 28px;
    border-radius: 16px;
  }
  .register-header h1 {
    font-size: 20px;
  }
  .logo-mark {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
}

.register-page {
  padding: 32px 18px;
  color: #fff2d6;
  background:
    radial-gradient(circle at 18% 8%, rgba(206, 142, 54, .18), transparent 26%),
    radial-gradient(circle at 80% 0%, rgba(117, 74, 24, .24), transparent 32%),
    linear-gradient(145deg, #040911 0%, #07111e 45%, #160f09 100%);
}

.register-page::before {
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

.register-bg-glow {
  background:
    radial-gradient(ellipse 54% 44% at 50% 28%, rgba(245, 184, 91, .12) 0%, transparent 62%),
    radial-gradient(ellipse 42% 34% at 18% 72%, rgba(76, 101, 132, .12) 0%, transparent 52%),
    radial-gradient(ellipse 36% 30% at 82% 18%, rgba(126, 84, 35, .14) 0%, transparent 54%);
}

.register-box {
  background:
    radial-gradient(circle at 92% 12%, rgba(239, 163, 60, .16), transparent 30%),
    linear-gradient(145deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .026));
  border-color: rgba(255, 214, 145, .18);
  box-shadow:
    0 28px 70px rgba(0, 0, 0, .44),
    0 0 40px rgba(196, 125, 43, .16),
    0 0 0 1px rgba(255, 240, 205, .07) inset;
}

.register-box:focus-within {
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

.register-header h1 {
  color: #ffe4b5;
  font-weight: 800;
  letter-spacing: 0;
}

.register-header p,
.register-footer {
  color: rgba(255, 232, 196, .62);
}

:deep(.register-box .el-form-item__label) {
  color: rgba(255, 232, 196, .76);
  font-weight: 700;
}

:deep(.register-box .el-input__wrapper) {
  border-radius: 12px;
  background: rgba(4, 9, 17, .58);
  box-shadow: 0 0 0 1px rgba(255, 214, 145, .16) inset;
}

:deep(.register-box .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(243, 180, 78, .35) inset;
}

:deep(.register-box .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(255, 216, 139, .58) inset, 0 0 0 3px rgba(243, 180, 78, .10);
}

:deep(.register-box .el-input__inner) {
  color: #fff2d6;
}

:deep(.register-box .el-input__inner::placeholder) {
  color: rgba(255, 232, 196, .38);
}

.register-btn {
  color: #241307 !important;
  font-weight: 800;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d) !important;
  box-shadow: 0 14px 30px rgba(235, 164, 69, .3);
}

.register-btn:hover {
  background: linear-gradient(135deg, #fff0bd, #d89a37 54%, #7c65d8) !important;
  box-shadow: 0 18px 38px rgba(235, 164, 69, .38);
}

.register-footer a {
  color: #ffd16e;
  font-weight: 700;
}

.register-footer a:hover {
  color: #ffe8ae;
}

.register-bottom-text {
  color: rgba(148, 170, 196, .6);
}
</style>
