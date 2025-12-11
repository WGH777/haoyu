// apps/frontend/src/utils/auth.ts

// 用户角色类型
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

// 当前用户结构（和后端保持一致）
export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  balance?: number | null;
}

const STORAGE_KEY_USER = 'currentUser';

// =======================
// 本地存储相关
// =======================

/**
 * 从 localStorage 读取当前用户
 */
export function getCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

/**
 * 写入 / 清空 当前用户
 */
export function setCurrentUser(user: CurrentUser | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_USER);
  } else {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }
}

/**
 * 清除登录态（token + user）
 */
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem(STORAGE_KEY_USER);
}

// =======================
// 余额展示工具
// =======================

/**
 * 后端以「分」为单位，这里统一转成字符串「xx.xx」
 */
export function formatBalance(balance?: number | null): string {
  if (balance == null) return '0.00';
  return (balance / 100).toFixed(2);
}

// =======================
// 角色 & 权限工具
// =======================

/**
 * 角色中文文案
 */
export function roleLabel(role?: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '超级管理员';
    case 'ADMIN':
      return '管理员';
    case 'USER':
      return '普通用户';
    default:
      return '未知角色';
  }
}

/**
 * 是否管理员（包含超级管理员）
 */
export function isAdmin(user?: CurrentUser | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

/**
 * 是否超级管理员
 */
export function isSuperAdmin(user?: CurrentUser | null): boolean {
  return !!user && user.role === 'SUPER_ADMIN';
}

/**
 * 判断当前用户是否在允许的角色列表中
 */
export function hasRole(
  user: CurrentUser | null | undefined,
  roles: UserRole[],
): boolean {
  if (!user) return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes(user.role);
}
