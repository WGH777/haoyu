// apps/frontend/src/api/user.ts
import http from '@/api/http'

export type RoleLiteral = 'USER' | 'ADMIN' | 'SUPER_ADMIN'
export type UserRole = RoleLiteral | string

export interface UserItem {
  id: number
  email: string
  nickname: string | null
  role: UserRole
  balance?: number
  avatar?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UserProfile {
  id: number
  email: string
  nickname: string | null
  role: UserRole
  balance: number
  avatar?: string | null
  createdAt: string
  updatedAt: string
  bio?: string | null
  wallet?: { available: number }
}

export interface LoginDto {
  email: string
  password: string
}
export interface RegisterDto {
  nickname: string
  email: string
  password: string
}

// =================== 后台管理：用户管理 ===================

export const getUserList = () => {
  return http.get<UserItem[]>('/user')
}

export const changeUserRole = (id: number, role: UserRole) => {
  return http.patch(`/user/${id}/role`, { role })
}

export const deleteUser = (id: number) => {
  return http.delete(`/user/${id}`)
}

/**
 * 超级管理员重置指定用户密码（对齐后端 AuthController）
 * PATCH /api/auth/admin/reset-password/:userId
 */
export const resetUserPassword = (id: number, newPassword: string) => {
  return http.patch(`/auth/admin/reset-password/${id}`, { newPassword })
}

// =================== 通用：当前登录用户 ===================

export const getProfile = async () => {
  return await http.get<UserProfile>('/user/profile')
}

export const updateProfile = (data: { nickname?: string; bio?: string; avatar?: string | null }) => {
  return http.patch<UserProfile>('/user/profile', data)
}

// =================== 可选：如果你前端也在这里做登录/注册 ===================

export const login = (data: LoginDto) => {
  return http.post('/auth/login', data)
}

export const register = (data: RegisterDto) => {
  return http.post('/auth/register', data)
}
