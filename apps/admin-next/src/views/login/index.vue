<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter, useRoute } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive } from "vue";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";

defineOptions({
  name: "Login"
});

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();

const { dataTheme, dataThemeChange } = useDataThemeChange();
dataThemeChange("dark");

const ruleForm = reactive({
  email: "",
  password: ""
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      await useUserStoreHook().loginByUsername({
        email: ruleForm.email,
        password: ruleForm.password
      });
      message("登录成功", { type: "success" });
      const redirect = (route.query?.redirect as string) || "/admin/dashboard";
      router.push(redirect);
    } catch (e: any) {
      message(e?.message || "登录失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  });
};

useEventListener(document, "keydown", ({ code }) => {
  if (["Enter", "NumpadEnter"].includes(code) && !loading.value) {
    onLogin(ruleFormRef.value);
  }
});
</script>

<template>
  <div class="select-none haoyu-login-page">
    <div class="flex-c absolute right-5 top-3">
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <div class="brand-section">
          <Motion>
            <div class="brand-icon">🏮</div>
          </Motion>
          <Motion :delay="100">
            <h1 class="brand-title">浩煜 · 万家灯火</h1>
          </Motion>
          <Motion :delay="150">
            <p class="brand-subtitle">管理后台</p>
          </Motion>
          <Motion :delay="200">
            <p class="brand-desc">有你值得</p>
          </Motion>
        </div>
      </div>
      <div class="login-box">
        <div class="login-form">
          <Motion>
            <h2 class="outline-hidden">管理员登录</h2>
          </Motion>

          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item prop="email">
                <el-input
                  v-model="ruleForm.email"
                  clearable
                  placeholder="邮箱"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                  @keyup.enter="onLogin(ruleFormRef)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-button
                class="w-full mt-4!"
                size="default"
                type="primary"
                :loading="loading"
                @click="onLogin(ruleFormRef)"
              >
                登 录
              </el-button>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
    <div class="login-footer">浩煜 · 万家灯火 | 有你值得</div>
  </div>
</template>

<style scoped>
.haoyu-login-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 40px;
  padding: 0 24px;
}

/* 品牌区域 */
.brand-section {
  text-align: center;
}

.brand-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 4px;
  margin: 0;
  color: #e8d5a3;
  background: linear-gradient(135deg, #d4a853 0%, #e8d5a3 50%, #c6a15e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 14px;
  color: #a09070;
  margin: 4px 0 0;
  letter-spacing: 8px;
}

.brand-desc {
  font-size: 13px;
  color: #6b6b76;
  margin: 8px 0 0;
}

.login-footer {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #4a4a55;
  text-align: center;
}
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}
</style>
