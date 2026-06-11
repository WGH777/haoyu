// apps/frontend/src/utils/request.ts

import axios from 'axios';
import { ElMessage } from 'element-plus';

// 1. 创建 axios 实例
const service = axios.create({
  // 后端接口地址 (注意：如果您的后端跑在 3000，这里必须写对)
  baseURL: import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://admin.haoyulv.com'), 
  timeout: 5000, // 请求超时时间
});

// 2. 请求拦截器 (每次发请求前自动带上 Token)
service.interceptors.request.use(
  (config) => {
    // 假设我们把 token 存在 localStorage 里
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 响应拦截器 (统一处理报错)
service.interceptors.response.use(
  (response) => {
    // 如果后端返回 200/201，说明成功，直接把数据剥离出来
    return response.data;
  },
  (error) => {
    // 处理 HTTP 错误状态码
    const msg = error.response?.data?.message || '请求失败';
    ElMessage.error(msg); // 弹出红色错误提示
    return Promise.reject(error);
  }
);

export default service;
