import { storeToRefs } from "pinia";
import { getConfig } from "@/config";
import { emitter } from "@/utils/mitt";
import { getTopMenu } from "@/router/utils";
import { useFullscreen } from "@vueuse/core";
import type { routeMetaType } from "../types";
import { useRouter, useRoute } from "vue-router";
import { router, remainingPaths } from "@/router";
import { computed, ref, type CSSProperties } from "vue";
import { useAppStoreHook } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import { useGlobal, isAllEmpty } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
import Fullscreen from "~icons/ri/fullscreen-fill";

const errorInfo =
  "The current routing configuration is incorrect, please check the configuration";

export function useNav() {
  const route = useRoute();
  const pureApp = useAppStoreHook();
  const routers = useRouter().options.routes;
  const { isFullscreen, toggle } = useFullscreen();
  const { wholeMenus } = storeToRefs(usePermissionStoreHook());
  /** 平台`layout`中所有`el-tooltip`的`effect`配置，默认`light` */
  const tooltipEffect = getConfig()?.TooltipEffect ?? "light";

  const getDivStyle = computed((): CSSProperties => {
    return {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden"
    };
  });
  /** 头像 — 严格校验：仅 http/https/data 开头的才是有效头像 */
  const userAvatar = computed(() => {
    const raw = useUserStoreHook()?.avatar || "";
    return raw && (raw.startsWith("http") || raw.startsWith("/") || raw.startsWith("data:")) ? raw : "";
  });

  /** 头像是否显示 img（失败后自动切换为 fallback） */
  const showAvatarImg = ref(true);

  function onAvatarError(e: Event) {
    showAvatarImg.value = false;
  }

  /** 头像 fallback 文字 */
  const avatarAlt = computed(() => {
    const role = (useUserStoreHook()?.roles || [])[0] || "";
    if (role === "SUPER_ADMIN") return "超";
    if (role === "ADMIN") return "管";
    return "用";
  });

  /** 显示名称：昵称 > 用户名 > 邮箱 > 角色中文 */
  const username = computed(() => {
    const store = useUserStoreHook();
    const role = (store?.roles || [])[0] || "";

    // 从多个字段取第一个有效值
    const displayName =
      store?.nickname ||
      store?.username ||
      store?.email ||
      "";

    // 过滤掉模板残留值
    const invalidNames = ["荒", "admin", "ping", ""];
    if (!displayName || invalidNames.includes(displayName)) {
      if (role === "SUPER_ADMIN") return "超级管理员";
      if (role === "ADMIN") return "管理员";
      return "浩煜管理员";
    }

    return displayName;
  });

  const avatarsStyle = computed(() => {
    return username.value ? { marginRight: "10px" } : "";
  });

  const isCollapse = computed(() => {
    return !pureApp.getSidebarStatus;
  });

  const device = computed(() => {
    return pureApp.getDevice;
  });

  const { $storage, $config } = useGlobal<GlobalPropertiesApi>();
  const layout = computed(() => {
    return $storage?.layout?.layout;
  });

  const title = computed(() => {
    return $config.Title;
  });

  /** 动态title */
  function changeTitle(meta: routeMetaType) {
    const Title = getConfig().Title;
    if (Title) document.title = `${meta.title} | ${Title}`;
    else document.title = meta.title;
  }

  /** 退出登录 */
  function logout() {
    useUserStoreHook().logOut();
  }

  function backTopMenu() {
    router.push(getTopMenu()?.path);
  }

  function onPanel() {
    emitter.emit("openPanel");
  }

  function toggleSideBar() {
    pureApp.toggleSideBar();
  }

  function handleResize(menuRef) {
    menuRef?.handleResize();
  }

  function resolvePath(route) {
    if (!route.children) return console.error(errorInfo);
    const httpReg = /^http(s?):\/\//;
    const routeChildPath = route.children[0]?.path;
    if (httpReg.test(routeChildPath)) {
      return route.path + "/" + routeChildPath;
    } else {
      return routeChildPath;
    }
  }

  function menuSelect(indexPath: string) {
    if (wholeMenus.value.length === 0 || isRemaining(indexPath)) return;
    emitter.emit("changLayoutRoute", indexPath);
  }

  /** 判断路径是否参与菜单 */
  function isRemaining(path: string) {
    return remainingPaths.includes(path);
  }

  /** 获取`logo` */
  function getLogo() {
    return new URL("/logo.svg", import.meta.url).href;
  }

  return {
    route,
    title,
    device,
    layout,
    logout,
    routers,
    $storage,
    isFullscreen,
    Fullscreen,
    ExitFullscreen,
    toggle,
    backTopMenu,
    onPanel,
    getDivStyle,
    changeTitle,
    toggleSideBar,
    menuSelect,
    handleResize,
    resolvePath,
    getLogo,
    isCollapse,
    pureApp,
    username,
    userAvatar,
    showAvatarImg,
    avatarAlt,
    onAvatarError,
    avatarsStyle,
    tooltipEffect
  };
}
