/**
 * HaoYu 管理后台 — 认证工具
 * 对接 HaoYu NestJS 后端 token 格式
 */
import { storageLocal } from "@pureadmin/utils";

export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  role: string;
  roles: string[];
  avatar?: string;
}

export const userKey = "admin-user-info";
const TOKEN_KEY = "token";

/** 获取 token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ||
         localStorage.getItem("access_token") ||
         localStorage.getItem("jwt");
}

/** 设置 token + 用户信息 */
export function setToken(accessToken: string, user: UserInfo) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  storageLocal().setItem(userKey, {
    roles: [user.role],
    username: user.nickname || user.email,
    nickname: user.nickname || user.email,
    avatar: user.avatar || "",
    email: user.email,
    id: user.id
  });
}

/** 获取用户信息 */
export function getUserInfo(): any {
  return storageLocal().getItem(userKey);
}

/** 删除 token */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("access_token");
  localStorage.removeItem("jwt");
  localStorage.removeItem("currentUser");
  storageLocal().removeItem(userKey);
}

/** 是否有按钮级别的权限 */
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const userInfo = getUserInfo();
  if (!userInfo?.roles) return false;
  if (userInfo.roles.includes("SUPER_ADMIN")) return true;
  return true; // ADMIN also gets all perms in admin panel
};
