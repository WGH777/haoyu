import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken } from "@/utils/auth";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  private static initConfig: PureHttpRequestConfig = {};
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 请求拦截 — 自动注入 Bearer token */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      (config: PureHttpRequestConfig) => {
        // 白名单不注入 token
        const whiteList = ["/login", "/auth/login", "/auth/register", "/auth/refresh"];
        const skipToken = whiteList.some(url => config.url?.includes(url));

        if (!skipToken) {
          const token = getToken();
          if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        }

        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
        }
        return config;
      },
      error => Promise.reject(error)
    );
  }

  /** 响应拦截 — 提取 data */
  private httpInterceptorsResponse(): void {
    PureHttp.axiosInstance.interceptors.response.use(
      (response: PureHttpResponse) => {
        // HaoYu 后端 { code, message, data } → 自动解包 data 层
        const payload = response.data;
        if (payload && typeof payload === "object" && "code" in payload) {
          return payload.data ?? payload;
        }
        return payload;
      },
      (error: PureHttpError) => {
        error.isCancelRequest = Axios.isCancel(error);
        return Promise.reject(error);
      }
    );
  }

  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => resolve(response))
        .catch(error => reject(error));
    });
  }

  public post<T, P>(url: string, params?: AxiosRequestConfig<P>, config?: PureHttpRequestConfig): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  public get<T, P>(url: string, params?: AxiosRequestConfig<P>, config?: PureHttpRequestConfig): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
