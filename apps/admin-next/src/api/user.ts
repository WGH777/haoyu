/**
 * HaoYu 管理后台 — API 接口
 * 对接 HaoYu NestJS 后端
 *
 * 登录返回格式（无 TransformInterceptor 封装）:
 *   { user: {...}, accessToken: "...", refreshToken: "..." }
 */
import { http } from "@/utils/http";

/** 登录 */
export const getLogin = (data: { email: string; password: string }) => {
  return http.request<any>("post", "/api/auth/login", { data });
};

/** 刷新 token */
export const refreshTokenApi = (data: { refreshToken: string }) => {
  return http.request<any>("post", "/api/auth/refresh", { data });
};

/** ──────── Dashboard ──────── */

/** 管理后台统计 */
export const getAdminDashboardApi = () => {
  return http.request<any>("get", "/api/admin/stats");
};

/** ──────── 用户管理（只读）──────── */

/** 用户列表 */
export const getUserListApi = (params?: any) => {
  return http.request<any>("get", "/api/user", { params });
};

/** ──────── 审计日志（只读）──────── */

/** 审计日志列表 */
export const getAuditLogsApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/audit-logs", { params });
};

/** ──────── 任务管理（只读）──────── */

/** 管理后台任务列表 */
export const getAdminTasksApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/tasks", { params });
};

/** ──────── 订单管理（只读）──────── */

/** 管理后台订单列表 */
export const getAdminOrdersApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/orders", { params });
};

/** ──────── 钱包流水（只读）──────── */

/** 全站交易流水 */
export const getAdminTransactionsApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/transactions", { params });
};
