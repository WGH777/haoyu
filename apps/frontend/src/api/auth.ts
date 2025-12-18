// apps/frontend/src/api/auth.ts
import { defineStore } from 'pinia'
import http from '@/api/http'
import type { UserProfile } from '@/api/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    user: null as UserProfile | null,
  }),

  actions: {
    setTokens(access: string, refresh: string) {
      this.accessToken = access
      this.refreshToken = refresh
      localStorage.setItem('token', access)
      localStorage.setItem('refreshToken', refresh)
    },

    clearAuth() {
      this.accessToken = ''
      this.refreshToken = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentUser')
      localStorage.removeItem('user')
    },

    async fetchProfile() {
      try {
        const res = await http.get<UserProfile>('/user/profile')
        this.user = res
        // 兼容你 utils/auth.ts 的 currentUser 存储
        localStorage.setItem('currentUser', JSON.stringify(res))
        return true
      } catch {
        return false
      }
    },

    async refreshAccessToken() {
      // 说明：真正的“自动 refresh + 重试”已在 http.ts 里做了
      // 这里只保留手动 refresh 的能力（例如某些页面初始化时显式调用）
      if (!this.refreshToken) return false
      try {
        const res: any = await http.post('/auth/refresh', {
          refreshToken: this.refreshToken,
        })
        this.setTokens(res.accessToken, res.refreshToken)
        return true
      } catch {
        this.clearAuth()
        return false
      }
    },
  },
})
