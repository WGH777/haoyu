// 路径：apps/frontend/src/api/http.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

// 1. 创建 axios 实例
const instance: AxiosInstance = axios.create({
  // 核心：全局 API 前缀 /api
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. 请求拦截器：自动带上 Token + 禁用浏览器缓存（解决 304 导致 axios 报错/身份识别异常）
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (!config.headers) {
      config.headers = {} as any;
    }

    // 禁用缓存：避免 /user/profile、/order/my 等接口出现 304（axios 默认会把 304 当作错误）
    (config.headers as any)['Cache-Control'] = 'no-cache';
    (config.headers as any)['Pragma'] = 'no-cache';

    // GET 请求强制加时间戳参数，确保每次请求都拿到最新数据
    const method = (config.method || 'get').toLowerCase();
    if (method === 'get') {
      const params = (config.params || {}) as Record<string, any>;
      // 不覆盖用户自己传入的 _t
      if (params._t === undefined) {
        params._t = Date.now();
      }
      config.params = params;
    }

    if (token) {
      // 确保 Token 携带的是 'Bearer xxx' 格式
      const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      (config.headers as any).Authorization = finalToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 3. 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const resData = response.data;

    // 兼容统一响应结构：{ code, message, data }
    if (resData && typeof resData === 'object' && 'code' in resData && 'data' in resData) {
      const wrapped = resData as { code: number; message?: string; data: any };

      if (wrapped.code === 0) {
        return wrapped.data;
      } else {
        const msg = wrapped.message || '请求失败';
        ElMessage.error(msg);
        return Promise.reject(new Error(msg));
      }
    }

    // 后端直接返回数据对象
    return resData;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // 仅用于“未登录/登录过期/Token 无效”
      ElMessage.error('登录已过期，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');

      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 300);
      }
    } else {
      // 其他错误（400 / 403 / 404 / 500）
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
