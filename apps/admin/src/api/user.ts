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

/** 用户详情 (含 wallet) */
export const getUserDetailApi = (id: number) => {
  return http.request<any>("get", `/api/user/${id}`);
};

/** 修改用户角色 */
export const changeUserRoleApi = (id: number, role: string) => {
  return http.request<any>("patch", `/api/user/${id}/role`, { data: { role } });
};
