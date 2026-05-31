/**
 * HaoYu 管理后台 — 菜单路由
 * 角色：ADMIN / SUPER_ADMIN
 */
const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/admin",
    name: "Admin",
    component: Layout,
    redirect: "/admin/dashboard",
    meta: {
      title: "管理后台",
      icon: "ri:dashboard-line",
      showLink: false,
      rank: 0
    },
    children: [
      {
        path: "/admin/dashboard",
        name: "Dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: {
          title: "总览",
          icon: "ri:bar-chart-box-line",
          roles: ["ADMIN", "SUPER_ADMIN"]
        }
      },
      {
        path: "/admin/users",
        name: "Users",
        component: () => import("@/views/users/index.vue"),
        meta: {
          title: "用户管理",
          icon: "ri:user-settings-line",
          roles: ["ADMIN", "SUPER_ADMIN"]
        }
      },
      {
        path: "/admin/tasks",
        name: "Tasks",
        component: () => import("@/views/tasks/index.vue"),
        meta: {
          title: "任务管理",
          icon: "ri:task-line",
          roles: ["ADMIN", "SUPER_ADMIN"]
        }
      },
      {
        path: "/admin/orders",
        name: "Orders",
        component: () => import("@/views/orders/index.vue"),
        meta: {
          title: "订单管理",
          icon: "ri:file-list-3-line",
          roles: ["ADMIN", "SUPER_ADMIN"]
        }
      },
      {
        path: "/admin/wallet",
        name: "Wallet",
        component: () => import("@/views/wallet/index.vue"),
        meta: {
          title: "钱包监控",
          icon: "ri:money-cny-circle-line",
          roles: ["SUPER_ADMIN"]
        }
      },
      {
        path: "/admin/arbitration",
        name: "Arbitration",
        component: () => import("@/views/arbitration/index.vue"),
        meta: {
          title: "仲裁中心",
          icon: "ri:scales-line",
          roles: ["ADMIN", "SUPER_ADMIN"]
        }
      },
      {
        path: "/admin/audit",
        name: "AuditLogs",
        component: () => import("@/views/audit/index.vue"),
        meta: {
          title: "审计日志",
          icon: "ri:file-search-line",
          roles: ["SUPER_ADMIN"]
        }
      },
      {
        path: "/admin/settings",
        name: "Settings",
        component: () => import("@/views/settings/index.vue"),
        meta: {
          title: "系统设置",
          icon: "ri:settings-3-line",
          roles: ["SUPER_ADMIN"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
