/**
 * HaoYu 管理后台 — API 接口
 */
import { http } from "@/utils/http";

/** 登录 */
export const getLogin = (data: { email: string; password: string }) => {
  return http.request<any>("post", "/api/auth/login", { data });
};
export const refreshTokenApi = (data: { refreshToken: string }) => {
  return http.request<any>("post", "/api/auth/refresh", { data });
};

/** Dashboard */
export const getAdminDashboardApi = () => http.request<any>("get", "/api/admin/stats");
export const getUserListApi = (params?: any) => http.request<any>("get", "/api/user", { params });
export const getAuditLogsApi = (params?: any) => http.request<any>("get", "/api/admin/audit-logs", { params });
export const getAdminTasksApi = (params?: any) => http.request<any>("get", "/api/admin/tasks", { params });
export const getAdminOrdersApi = (params?: any) => http.request<any>("get", "/api/admin/orders", { params });
export const getAdminTransactionsApi = (params?: any) => http.request<any>("get", "/api/admin/transactions", { params });

/** 🛡 危险治理操作 — 仅 SUPER_ADMIN */
export const resetUserPasswordApi = (userId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/users/${userId}/reset-password`, { data: { reason } });
};

export const banUserApi = (userId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/users/${userId}/ban`, { data: { reason } });
};
export const unbanUserApi = (userId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/users/${userId}/unban`, { data: { reason } });
};

export const createUserApi = (data: { email: string; nickname: string; password?: string; role?: string; reason: string }) => {
  return http.request<any>("post", "/api/admin/users", { data });
};

