// 路径：src/api/http.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

// 1. 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
});

// 2. 请求拦截器：自动带上 Token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. 响应拦截器：
//    - 如果后端返回 { code, message, data }，自动解包成 data
//    - 否则保持原样（兼容旧接口）
instance.interceptors.response.use(
  (response) => {
    const resData = response.data;

    // 统一响应结构：{ code, message, data }
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

    // 兼容旧格式：直接返回原来的 response.data
    return resData;
  },
  (error) => {
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    } else {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        '网络出小差了';
      ElMessage.error(message);
    }
    return Promise.reject(error);
  },
);

// 4. 轻量 HttpClient 接口：让调用端拿到的就是 data，不是 AxiosResponse
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
