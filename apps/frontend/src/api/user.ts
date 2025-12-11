import http from '@/api/http'

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

export interface UserItem {
  id: number
  email: string
  nickname: string | null
  role: UserRole | string
  balance: number
  avatar?: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends UserItem {
  bio?: string | null
}

// =================== 后台管理接口 ===================

export const getUserList = () => {
  return http.get<UserItem[]>('/user')
}

export const changeUserRole = (id: number, role: UserRole) => {
  return http.patch(`/user/${id}/role`, { role })
}

export const deleteUser = (id: number) => {
  return http.delete(`/user/${id}`)
}

export const resetUserPassword = (id: number, newPassword: string) => {
  return http.patch(`/user/${id}/reset-password`, { newPassword })
}

// =================== 个人中心接口 ===================

export const getProfile = () => {
  return http.get<UserProfile>('/user/profile')
}

export const updateProfile = (data: { nickname?: string; bio?: string }) => {
  return http.patch<UserProfile>('/user/profile', data)
}

// 🔥 核心修复：补回修改密码接口
export const updatePassword = (data: { oldPassword?: string; newPassword: string }) => {
  return http.patch('/user/password', data)
}

// 上传头像
export const uploadAvatar = (formData: FormData) => {
  return http.post<{ url: string }>('/user/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}