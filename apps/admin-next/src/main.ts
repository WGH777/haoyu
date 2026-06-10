import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";

import Table from "@pureadmin/table";

// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// tailwindcss
import "./style/tailwind.css";
import "element-plus/dist/index.css";
// 导入字体图标
import "./assets/iconfont/iconfont.js";
import "./assets/iconfont/iconfont.css";

const app = createApp(App);

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 全局注册@iconify/vue图标库
import {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon
} from "./components/ReIcon";
app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

// 全局注册按钮级别权限组件
import { Auth } from "@/components/ReAuth";
import { Perms } from "@/components/RePerms";
app.component("Auth", Auth);
app.component("Perms", Perms);

// 浩煜 · 万家灯火 · 管理后台
// HaoYu Admin Next — powered by vue-pure-admin

// ═══════════════════════════════════════
// 版本标识 + 旧缓存清理
// ═══════════════════════════════════════
const BUILD_INFO = {
  version: "admin-next",
  buildTime: "__BUILD_TIME__",
  commitHash: "__COMMIT_HASH__"
};
console.info("[haoyu-admin-next] build", BUILD_INFO);

// 清理旧 admin 污染的 localStorage key
(function cleanupLegacyKeys() {
  const oldKeys = [
    "token",                // 旧 admin TOKEN_KEY
    "admin-user-info",      // 旧 admin userKey
    "haoyu-admin-token",    // admin-next 旧版 TOKEN_KEY
    "haoyu-multiple-tabs",  // 旧 tabsKey
    "access_token",         // 兼容 key
    "jwt"                   // 兼容 key
  ];
  oldKeys.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
  // 注意：不删除当前 admin-next 的 key (haoyu-admin-next-*)
})();

// 禁用 Service Worker（管理后台不需要离线缓存）
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => { try { r.unregister(); } catch {} });
  });
}

// ═══════════════════════════════════════
getPlatformConfig(app).then(async config => {
  setupStore(app);
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  app.use(MotionPlugin).use(useElementPlus).use(Table);
  app.mount("#app");
});
