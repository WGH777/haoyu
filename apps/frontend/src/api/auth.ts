import { defineStore } from 'pinia'
import http from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    user: null as any
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
    },

    async fetchProfile() {
      try {
        const res = await http.get('/user/profile')
        this.user = res
        return true
      } catch {
        return false
      }
    },

    async refreshAccessToken() {
      try {
        const res: any = await http.post('/auth/refresh', {
          refreshToken: this.refreshToken
        })

        this.setTokens(res.accessToken, res.refreshToken)
        return true
      } catch {
        this.clearAuth()
        return false
      }
    }
  }
})
