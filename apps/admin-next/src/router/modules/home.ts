/**
 * HaoYu 管理后台 — 主菜单路由（7 项）
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/admin/dashboard",
  meta: { title: "浩煜 · 万家灯火", icon: "ri:home-4-line", rank: 0 },
  children: [
    {
      path: "/admin/dashboard",
      name: "Dashboard",
      component: () => import("@/views/welcome/index.vue"),
      meta: { title: "总览", icon: "ri:bar-chart-box-line", roles: ["SUPER_ADMIN", "ADMIN"] }
    },
    {
      path: "/admin/users",
      name: "Users",
      component: () => import("@/views/users/index.vue"),
      meta: { title: "用户管理", icon: "ri:user-settings-line", roles: ["SUPER_ADMIN", "ADMIN"] }
    },
    {
      path: "/admin/tasks",
      name: "Tasks",
      component: () => import("@/views/tasks/index.vue"),
      meta: { title: "任务管理", icon: "ri:task-line", roles: ["SUPER_ADMIN", "ADMIN"] }
    },
    {
      path: "/admin/orders",
      name: "Orders",
      component: () => import("@/views/orders/index.vue"),
      meta: { title: "订单管理", icon: "ri:file-list-3-line", roles: ["SUPER_ADMIN", "ADMIN"] }
    },
    {
      path: "/admin/wallet",
      name: "Wallet",
      component: () => import("@/views/wallet/index.vue"),
      meta: { title: "钱包监控", icon: "ri:money-cny-circle-line", roles: ["SUPER_ADMIN"] }
    },
    {
      path: "/admin/arbitration",
      name: "Arbitration",
      component: () => import("@/views/arbitration/index.vue"),
      meta: { title: "仲裁中心", icon: "ri:scales-line", roles: ["SUPER_ADMIN", "ADMIN"] }
    },
    {
      path: "/admin/audit",
      name: "AuditLogs",
      component: () => import("@/views/audit/index.vue"),
      meta: { title: "审计日志", icon: "ri:file-search-line", roles: ["SUPER_ADMIN"] }
    }
  ]
} satisfies RouteConfigsTable;
