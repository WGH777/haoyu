/**
 * HaoYu 管理后台 — 认证工具
 * 对接 HaoYu NestJS 后端 token 格式
 */
import { storageLocal } from "@pureadmin/utils";

export interface UserInfo {
  id?: number;
  email?: string;
  nickname?: string;
  role?: string;
  roles?: string[];
  avatar?: string;
}

export const userKey = "haoyu-admin-next-user";
const TOKEN_KEY = "haoyu-admin-next-token";
export const multipleTabsKey = "haoyu-admin-next-tabs";

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
    roles: [user.role || "USER"],
    username: user.nickname || user.email || "",
    nickname: user.nickname || user.email || "",
    avatar: user.avatar || "",
    email: user.email || "",
    id: user.id
  });
}

/** 获取用户信息 */
export function getUserInfo(): any {
  return storageLocal().getItem(userKey);
}

/** 删除 token — 同时清理旧 admin key 防止污染 */
export function removeToken() {
  // admin-next keys
  localStorage.removeItem(TOKEN_KEY);
  storageLocal().removeItem(userKey);
  // 旧 admin keys（防止切换后污染）
  localStorage.removeItem("haoyu-admin-token");
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("jwt");
  localStorage.removeItem("currentUser");
  storageLocal().removeItem("admin-user-info");
}

/** DataInfo 类型 */
export interface DataInfo<T> {
  id?: number;
  email?: string;
  username?: string;
  nickname?: string;
  roles?: string[];
  avatar?: string;
  role?: string;
  permissions?: string[];
  accessToken?: string;
  expires?: T;
}

/** 是否有按钮级别的权限 */
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const userInfo = getUserInfo();
  if (!userInfo?.roles) return false;
  return true;
};

