/**
 * HaoYu 管理后台 — 用户 Store
 */
import { defineStore } from "pinia";
import { store, router, resetRouter, routerArrays, storageLocal } from "../utils";
import { loginApi, getProfileApi } from "@/api/user";
import { setToken, removeToken, userKey, getUserInfo } from "@/utils/auth";
import { useMultiTagsStoreHook } from "./multiTags";

export const useUserStore = defineStore("admin-user", {
  state: () => ({
    avatar: getUserInfo()?.avatar ?? "",
    username: getUserInfo()?.username ?? "",
    nickname: getUserInfo()?.nickname ?? "",
    roles: getUserInfo()?.roles ?? [],
    email: getUserInfo()?.email ?? "",
    isRemembered: false,
    loginDay: 7
  }),
  actions: {
    SET_AVATAR(avatar: string) { this.avatar = avatar; },
    SET_USERNAME(username: string) { this.username = username; },
    SET_NICKNAME(nickname: string) { this.nickname = nickname; },
    SET_ROLES(roles: string[]) { this.roles = roles; },

    /** 登录 — 对接真实后端 */
    async loginByUsername(data: { email: string; password: string }) {
      const res = await loginApi(data);
      // HaoYu 后端返回: { user, accessToken, refreshToken }
      const token = res.accessToken || res.access_token || res.token
        || res.data?.accessToken || res.data?.access_token || res.data?.token;
      const user = res.user || res.data?.user || res.data;
      if (!token) throw new Error("登录失败：未获取到 token");

      const role = user.role || "USER";
      const roles = [role];

      // 检查是否有权限进入后台
      if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
        throw new Error("您没有管理员权限，无法进入后台");
      }

      setToken(token, {
        id: user.id,
        email: user.email,
        nickname: user.nickname || user.email,
        role,
        roles,
        avatar: user.avatar
      });

      this.SET_ROLES(roles);
      this.SET_USERNAME(user.nickname || user.email);
      this.SET_NICKNAME(user.nickname || user.email);
      this.SET_AVATAR(user.avatar || "");

      return res;
    },

    /** 退出登录 */
    logOut() {
      this.username = "";
      this.roles = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
