// 路径：src/api/http.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

// 1. 创建 axios 实例
const instance: AxiosInstance = axios.create({
  // 🔥 核心修复：添加全局 API 前缀 /api
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. 请求拦截器：自动带上 Token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      
      // 🔥 确保 Token 携带的是 'Bearer xxx' 格式
      const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      (config.headers as any).Authorization = finalToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. 响应拦截器：
instance.interceptors.response.use(
  (response) => {
    const resData = response.data;

    // 兼容统一响应结构：{ code, message, data } (我们后端没有使用这种结构，但保留逻辑是好的)
    if (resData && typeof resData === 'object' && 'code' in resData && 'data' in resData) {
      const wrapped = resData as { code: number; message?: string; data: any };

      if (wrapped.code === 0) {
        // 成功：返回真正的业务数据
        return wrapped.data;
      } else {
        // 业务失败：弹错误并中断 Promise 链
        const msg = wrapped.message || '请求失败';
        ElMessage.error(msg);
        return Promise.reject(new Error(msg));
      }
    }

    // 🔥 我们的后端直接返回数据对象（如 User 或 Task），因此返回 resData
    return resData;
  },
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // 登录过期或权限不足
      ElMessage.error('登录已过期，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // 清理旧 user 缓存
      localStorage.removeItem('currentUser'); // 清理新 currentUser 缓存
      
      // 强制跳转到登录页
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 300);
      }
      
    } else {
      // 其他错误（400 Bad Request, 403 Forbidden, 404 Not Found, 500 Internal Server Error）
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        '网络出小差了';
      ElMessage.error(message);
    }
    return Promise.reject(error);
  },
);

// 4. 轻量 HttpClient 接口
export interface HttpClient {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

// 5. 封装一层，对外返回 Promise<T>
const http: HttpClient = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get<T>(url, config) as any;
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post<T>(url, data, config) as any;
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch<T>(url, data, config) as any;
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete<T>(url, config) as any;
  },
};

export default http;