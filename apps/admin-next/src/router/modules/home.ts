/**
 * HaoYu 管理后台 — 主菜单路由
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/admin/dashboard",
  meta: {
    title: "浩煜灯火站",
    icon: "ri:home-4-line",
    showLink: false,
    rank: 0
  },
  children: [
    {
      path: "/admin/dashboard",
      name: "Dashboard",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: "总览",
        icon: "ri:bar-chart-box-line",
        roles: ["SUPER_ADMIN", "ADMIN"]
      }
    }
  ]
} satisfies RouteConfigsTable;
