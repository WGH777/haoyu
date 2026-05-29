/**
 * HaoYu 管理后台 — 路由配置
 * 基于 Vue Pure Admin 骨架裁剪
 */
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { usePermissionStoreHook } from "@/store/modules/permission";
import {
  isUrl,
  openLink,
  cloneDeep,
  storageLocal
} from "@pureadmin/utils";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  type RouteRecordRaw,
  type RouteComponent,
  createRouter
} from "vue-router";
import {
  type DataInfo,
  userKey,
  removeToken
} from "@/utils/auth";

/** 自动导入全部静态路由 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts"],
  { eager: true }
);

const routes: any[] = [];
Object.keys(modules).forEach(key => {
  routes.push(modules[key].default);
});

/** 导出处理后的静态路由 */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(
    routes.flat(Infinity).filter((r: any) => r.path !== "/login")
  )
);

/** 初始的静态路由，用于退出登录时重置路由 */
const initConstantRoutes: Array<RouteRecordRaw> = cloneDeep(constantRoutes);

/** 用于渲染菜单 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
);

/** 登录路由（不在菜单中显示） */
const loginRoute = {
  path: "/login",
  name: "Login",
  component: () => import("@/views/login/index.vue"),
  meta: { title: "登录", showLink: false }
};

const errorRoutes = [
  {
    path: "/error/403",
    name: "403",
    component: () => import("@/views/error/403.vue"),
    meta: { title: "无权访问", showLink: false }
  },
  {
    path: "/error/404",
    name: "404",
    component: () => import("@/views/error/404.vue"),
    meta: { title: "页面不存在", showLink: false }
  },
  {
    path: "/error/500",
    name: "500",
    component: () => import("@/views/error/500.vue"),
    meta: { title: "服务器错误", showLink: false }
  }
];

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: [
    loginRoute,
    ...constantRoutes,
    ...errorRoutes,
    {
      path: "/",
      redirect: "/admin/dashboard"
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/error/404"
    }
  ],
  strict: true
});

/** 记录已经加载的页面路径 */
const loadedPaths = new Set<string>();

export function resetLoadedPaths() {
  loadedPaths.clear();
}

/** 重置路由 */
export function resetRouter() {
  router.clearRoutes();
  for (const route of initConstantRoutes) {
    router.addRoute(route);
  }
  router.addRoute(loginRoute as any);
  errorRoutes.forEach(r => router.addRoute(r as any));
  usePermissionStoreHook().clearAllCachePage();
  resetLoadedPaths();
}

/** 路由白名单 */
const whiteList = ["/login"];

router.beforeEach((to: ToRouteType, _from) => {
  to.meta.loaded = loadedPaths.has(to.path);

  if (!to.meta.loaded) {
    NProgress.start();
  }

  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
  }

  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      if (Title) {
        const title = typeof item.meta.title === 'string' ? item.meta.title : '';
        document.title = `${title} | ${Title}`;
      }
    });
  }

  // 已登录
  if (userInfo) {
    // 角色权限检查
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
      return { path: "/error/403" };
    }
    // 已登录访问登录页或错误页 → 跳后台首页
    if (to.path === "/login" || to.path.startsWith("/error/")) {
      return "/admin/dashboard";
    }
    if (externalLink) {
      openLink(to?.name as string);
      NProgress.done();
      return false;
    }
    // 刷新时重新初始化动态路由
    if (
      usePermissionStoreHook().wholeMenus.length === 0 &&
      to.path !== "/login"
    ) {
      initRouter().then((router: Router) => {
        getTopMenu(true);
        const route = findRouteByPath(
          to.path,
          router.options.routes
        );
        if (route && route.meta?.title) {
          const { path, name, meta } = route;
          usePermissionStoreHook()?.handleTags?.("push", { path, name, meta });
        }
      });
    }
    return true;
  }

  // 未登录
  if (to.path !== "/login") {
    if (whiteList.includes(to.path)) {
      return true;
    }
    removeToken();
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  return true;
});

router.afterEach(to => {
  loadedPaths.add(to.path);
  NProgress.done();
});

export default router;
