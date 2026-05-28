<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { message } from "@/utils/message";
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/mail-line";

defineOptions({ name: "Login" });

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();

const loginForm = reactive({
  email: "",
  password: ""
});

const rules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱格式", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" }
  ]
};

const onLogin = async () => {
  const valid = await ruleFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await useUserStoreHook().loginByUsername({
      email: loginForm.email,
      password: loginForm.password
    });
    message("登录成功", { type: "success" });
    const redirect = (route.query.redirect as string) || "/admin/dashboard";
    router.push(redirect);
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || "登录失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>浩煜灯火站</h1>
        <p>管理后台</p>
      </div>

      <el-form
        ref="ruleFormRef"
        :model="loginForm"
        :rules="rules"
        size="large"
        @keyup.enter="onLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="管理员邮箱"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-btn"
            @click="onLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>仅限管理员登录</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #24243e 50%, #1a1a2e);
  padding: 20px;
}

.login-card {
  width: 400px;
  max-width: 100%;
  padding: 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 180, 50, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #f5a623;
  letter-spacing: 4px;
  margin: 0 0 8px 0;
  text-shadow: 0 0 40px rgba(245, 166, 35, 0.3);
}

.login-header p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  letter-spacing: 6px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #f5a623, #e8961a);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #f7b84e, #f5a623);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
}

.login-footer span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
