import http from './http'

/**
 * 用户角色类型
 */
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

/**
 * 用户基础信息（列表 / 管理界面常用）
 */
export interface UserItem {
  id: number
  email: string
  nickname: string | null
  role: UserRole | string
  balance: number
  createdAt: string
  updatedAt: string
}

/**
 * 当前登录用户的资料（Profile 页使用）
 * 可以和 UserItem 共用；这里单独写是为了以后扩展字段更清晰
 */
export interface UserProfile {
  id: number
  email: string
  nickname: string | null
  role: UserRole | string
  balance: number
  createdAt: string
  updatedAt: string
  bio?: string | null
}

// =================== 后台管理：用户管理 ===================

/**
 * 获取用户列表（仅 SUPER_ADMIN / ADMIN）
 */
export const getUserList = () => {
  return http.get<UserItem[]>('/user')
}

/**
 * 修改用户角色（仅 SUPER_ADMIN）
 */
export const changeUserRole = (
  id: number,
  role: UserRole,
) => {
  return http.patch(`/user/${id}/role`, { role })
}

/**
 * 删除用户（仅 SUPER_ADMIN）
 */
export const deleteUser = (id: number) => {
  return http.delete(`/user/${id}`)
}

/**
 * 超级管理员重置指定用户密码（无需旧密码）
 */
export const resetUserPassword = (id: number, newPassword: string) => {
  return http.patch(`/user/${id}/reset-password`, { newPassword })
}

// =================== 通用：当前登录用户 ===================

/**
 * 获取当前登录用户的资料（个人资料 / 顶部栏 / 其它页面可复用）
 */
export const getProfile = () => {
  return http.get<UserProfile>('/user/profile')
}

/**
 * 更新当前登录用户资料（昵称 / 简介等）
 */
export const updateProfile = (data: { nickname?: string; bio?: string }) => {
  return http.patch<UserProfile>('/user/profile', data)
}
