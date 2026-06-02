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
