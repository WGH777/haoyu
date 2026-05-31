/**
 * HaoYu 管理后台 — API 接口
 * 对接 HaoYu NestJS 后端
 */
import { http } from "@/utils/http";

/** 登录 */
export const loginApi = (data: { email: string; password: string }) => {
  return http.request<any>("post", "/api/auth/login", { data });
};

/** 获取当前用户信息 */
export const getProfileApi = () => {
  return http.request<any>("get", "/api/user/profile");
};

/** 健康检查 */
export const healthCheckApi = () => {
  return http.request<any>("get", "/api");
};

/** 用户列表 */
export const getUserListApi = (params?: any) => {
  return http.request<any>("get", "/api/user", { params });
};

/** 管理后台 - 任务列表 */
export const getAdminTasksApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/tasks", { params });
};

/** 管理后台 - 订单列表 */
export const getAdminOrdersApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/orders", { params });
};

/** 强制取消任务（仅 SUPER_ADMIN） */
export const forceCancelTaskApi = (taskId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/tasks/${taskId}/force-cancel`, { data: { reason } });
};

/** 强制结算订单（仅 SUPER_ADMIN） */
export const forceCompleteOrderApi = (orderId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/orders/${orderId}/force-complete`, { data: { reason } });
};

/** 强制驳回订单（仅 SUPER_ADMIN） */
export const forceRejectOrderApi = (orderId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/orders/${orderId}/force-reject`, { data: { reason } });
};

/** 全站流水（仅 SUPER_ADMIN，只读） */
export const getAdminTransactionsApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/transactions", { params });
};

/** 用户详情 (含 wallet) */
export const getUserDetailApi = (id: number) => {
  return http.request<any>("get", `/api/user/${id}`);
};

/** 修改用户角色 */
export const changeUserRoleApi = (id: number, role: string) => {
  return http.request<any>("patch", `/api/user/${id}/role`, { data: { role } });
};

/** 审计日志（仅 SUPER_ADMIN） */
export const getAuditLogsApi = (params?: any) => {
  return http.request<any>("get", "/api/admin/audit-logs", { params });
};

/** 重置用户密码（仅 SUPER_ADMIN） */
export const resetUserPasswordApi = (userId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/users/${userId}/reset-password`, { data: { reason } });
};

/** 创建用户（仅 SUPER_ADMIN） */
export const createUserApi = (data: {
  email: string;
  nickname: string;
  password?: string;
  role?: string;
  reason: string;
}) => {
  return http.request<any>("post", "/api/admin/users", { data });
};

/** 封号（仅 SUPER_ADMIN） */
export const banUserApi = (userId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/users/${userId}/ban`, { data: { reason } });
};

/** 解封（仅 SUPER_ADMIN） */
export const unbanUserApi = (userId: number, reason: string) => {
  return http.request<any>("post", `/api/admin/users/${userId}/unban`, { data: { reason } });
};
