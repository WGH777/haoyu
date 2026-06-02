/**
 * HaoYu 管理后台 — 独立路由（不经过 Layout）
 */
export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      showLink: false
    }
  },
  {
    path: "/error/403",
    name: "403",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: "无权访问",
      showLink: false
    }
  },
  {
    path: "/error/404",
    name: "404",
    component: () => import("@/views/error/404.vue"),
    meta: {
      title: "页面不存在",
      showLink: false
    }
  },
  {
    path: "/error/500",
    name: "500",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: "服务器错误",
      showLink: false
    }
  }
] satisfies Array<RouteConfigsTable>;
