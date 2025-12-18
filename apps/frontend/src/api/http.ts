// apps/frontend/src/api/http.ts
import axios from 'axios'
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'

// =========================================================
// 🔄 智能环境配置
// npm run dev   -> import.meta.env.DEV 为 true (连本地)
// npm run build -> import.meta.env.DEV 为 false (连线上)
// =========================================================

const isDev = import.meta.env.DEV

export const API_BASE: string = isDev
  ? 'http://localhost:3000/api'
  : 'https://api.722933.xyz/api'

// 1) axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {},
})

// -------------------------
// Refresh 队列（防并发风暴）
// -------------------------
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []
let refreshRejectQueue: Array<(err: any) => void> = []

function enqueueRefresh(resolve: (token: string) => void, reject: (err: any) => void) {
  refreshQueue.push(resolve)
  refreshRejectQueue.push(reject)
}

function flushRefreshQueue(token: string) {
  refreshQueue.forEach((fn) => fn(token))
  refreshQueue = []
  refreshRejectQueue = []
}

function flushRefreshQueueWithError(err: any) {
  refreshRejectQueue.forEach((fn) => fn(err))
  refreshQueue = []
  refreshRejectQueue = []
}

async function doRefreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = localStorage.getItem('refreshToken') || ''
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN')
  }

  // 注意：refresh 不能用当前 instance（它会走拦截器，可能形成循环）
  const res = await axios.post(
    `${API_BASE}/auth/refresh`,
    { refreshToken },
    { timeout: 15000 },
  )
  return res.data as any
}

function clearAuthAndRedirect(message?: string) {
  if (message) ElMessage.error(message)
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  localStorage.removeItem('currentUser')

  const p = window.location.pathname
  if (p !== '/login' && p !== '/register') {
    setTimeout(() => {
      window.location.href = '/login'
    }, 200)
  }
}

// 2) 请求拦截：Token + 禁用缓存
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    config.headers = config.headers || {}

    if (token) {
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }

    ;(config.headers as any)['Cache-Control'] = 'no-cache'
    ;(config.headers as any)['Pragma'] = 'no-cache'

    return config
  },
  (error) => Promise.reject(error),
)

// 3) 响应拦截：401 自动 refresh + 重试一次；失败则回登录
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const status = error.response?.status
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined

    // 非 401：统一报错
    if (status !== 401) {
      const message =
        (error.response?.data as any)?.message ||
        (error.response?.data as any)?.error ||
        error.message ||
        '网络出小差了'
      ElMessage.error(message)
      return Promise.reject(error)
    }

    // 401：如果没有请求信息/或已重试过一次，直接清理并回登录
    if (!originalRequest || originalRequest._retry) {
      clearAuthAndRedirect('登录已过期，请重新登录')
      return Promise.reject(error)
    }

    // 没有 refreshToken：直接回登录
    const rt = localStorage.getItem('refreshToken')
    if (!rt) {
      clearAuthAndRedirect('登录已过期，请重新登录')
      return Promise.reject(error)
    }

    // 标记重试，避免无限循环
    originalRequest._retry = true

    // 并发情况下：只有第一个请求真的去 refresh；其他排队等结果
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        enqueueRefresh(
          (newAccessToken) => {
            originalRequest.headers = originalRequest.headers || {}
            ;(originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`
            resolve(instance(originalRequest))
          },
          (err) => reject(err),
        )
      })
    }

    isRefreshing = true

    try {
      const tokens = await doRefreshToken()
      localStorage.setItem('token', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      flushRefreshQueue(tokens.accessToken)

      // 用新 token 重放当前请求
      originalRequest.headers = originalRequest.headers || {}
      ;(originalRequest.headers as any).Authorization = `Bearer ${tokens.accessToken}`
      return instance(originalRequest)
    } catch (e: any) {
      flushRefreshQueueWithError(e)
      clearAuthAndRedirect('refreshToken 已失效，请重新登录')
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

// 4) 对外接口定义
export interface HttpClient {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

// 5) 统一只返回 data
const http: HttpClient = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await instance.get<T>(url, config)
    return res.data as any
  },
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await instance.post<T>(url, data, config)
    return res.data as any
  },
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await instance.patch<T>(url, data, config)
    return res.data as any
  },
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await instance.delete<T>(url, config)
    return res.data as any
  },
}

export default http
export { instance }
