import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 登录校验 — HaoYu 管理后台 */
const loginRules = reactive<FormRules>({
  email: [
    {
      required: true,
      message: "请输入邮箱",
      trigger: "blur"
    },
    {
      type: "email",
      message: "邮箱格式不正确",
      trigger: "blur"
    }
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur"
    },
    {
      min: 6,
      message: "密码长度不能少于6位",
      trigger: "blur"
    }
  ]
});

export { loginRules };
