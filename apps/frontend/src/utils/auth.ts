// apps/frontend/src/utils/auth.ts

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

export interface CurrentUser {
  id: number
  email: string
  nickname: string
  role: UserRole
  balance?: number | null
}

const STORAGE_KEY_USER = 'currentUser'

export function getCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER)
    if (!raw) return null
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}

export function setCurrentUser(user: CurrentUser | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_USER)
  } else {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
  }
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem(STORAGE_KEY_USER)
  localStorage.removeItem('user')
}

// =======================
// 余额展示工具
// =======================

/**
 * 余额展示（煜米）：
 * 你当前线上数据更符合“元/业务单位”的直出（例如 1、-1、10000），
 * 这里先按“直接展示为 xx.xx”处理，避免 /100 导致钱包中心数值错位。
 *
 * 若你后端最终确认用“分”，只需把这里改回 (balance / 100).toFixed(2)
 */
export function formatBalance(balance?: number | null): string {
  if (balance == null) return '0.00'
  return Number(balance).toFixed(2)
}

// =======================
// 角色 & 权限工具
// =======================

export function roleLabel(role?: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '超级管理员'
    case 'ADMIN':
      return '管理员'
    case 'USER':
      return '普通用户'
    default:
      return '未知角色'
  }
}

export function isAdmin(user?: CurrentUser | null): boolean {
  if (!user) return false
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
}

export function isSuperAdmin(user?: CurrentUser | null): boolean {
  return !!user && user.role === 'SUPER_ADMIN'
}

export function hasRole(user: CurrentUser | null | undefined, roles: UserRole[]): boolean {
  if (!user) return false
  if (!roles || roles.length === 0) return true
  return roles.includes(user.role)
}
