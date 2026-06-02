/**
 * HaoYu 管理后台 — 用户 Store
 * 对接 HaoYu NestJS 后端 /api/auth/login
 */
import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type UserResult,
  type RefreshTokenResult,
  getLogin,
  refreshTokenApi
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    permissions: storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    isRemembered: false,
    loginDay: 7
  }),
  actions: {
    SET_AVATAR(avatar: string) { this.avatar = avatar; },
    SET_USERNAME(username: string) { this.username = username; },
    SET_NICKNAME(nickname: string) { this.nickname = nickname; },
    SET_ROLES(roles: Array<string>) { this.roles = roles; },
    SET_PERMS(permissions: Array<string>) { this.permissions = permissions; },
    SET_ISREMEMBERED(bool: boolean) { this.isRemembered = bool; },
    SET_LOGINDAY(value: number) { this.loginDay = Number(value); },

    /** 登录 — 对接 HaoYu 后端 POST /api/auth/login */
    async loginByUsername(data: { email: string; password: string }) {
      const res: any = await getLogin(data);

      // HaoYu 后端返回: { user, accessToken, refreshToken }
      const token = res?.accessToken || res?.access_token || res?.token;
      const user = res?.user || res?.data?.user || res?.data;
      if (!token) throw new Error("登录失败：未获取到 token");

      const role = user?.role || "USER";
      const roles = [role];

      if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
        throw new Error("您没有管理员权限，无法进入后台");
      }

      if (user?.status === "SUSPENDED") {
        throw new Error("账号已被封禁");
      }

      setToken(token, {
        id: user?.id,
        email: user?.email,
        nickname: user?.nickname || user?.email,
        role,
        roles,
        avatar: user?.avatar
      });

      this.SET_ROLES(roles);
      this.SET_USERNAME(user?.nickname || user?.email);
      this.SET_NICKNAME(user?.nickname || user?.email);
      this.SET_AVATAR(user?.avatar || "");
    },

    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },

    async handRefreshToken(data: any) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then((res: any) => {
            if (res) setToken(res.data);
            resolve(res);
          })
          .catch(error => reject(error));
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
