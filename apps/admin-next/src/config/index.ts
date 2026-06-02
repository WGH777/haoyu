import axios from "axios";
import type { App } from "vue";

let config: Record<string, any> = {
  // 默认品牌配置
  Title: "浩煜 · 万家灯火",
  Theme: "default",
  Layout: "vertical",
  Grey: false,
  Weak: false,
  MultiTagsCache: false,
  EpThemeColor: "#c6a15e",
  ResponsiveStorageNameSpace: "responsive-haoyu-"
};

const { VITE_PUBLIC_PATH } = import.meta.env;

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

const getConfig = (key?: string): any => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data: any = config;
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config;
};

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<undefined> => {
  app.config.globalProperties.$config = getConfig();
  return axios({
    method: "get",
    url: `${VITE_PUBLIC_PATH}platform-config.json`
  })
    .then(({ data: platformConfig }) => {
      let $config = app.config.globalProperties.$config;
      if (app && $config && typeof platformConfig === "object") {
        $config = Object.assign($config, platformConfig);
        app.config.globalProperties.$config = $config;
        setConfig($config);
      }
      return $config;
    })
    .catch(() => {
      // platform-config.json 不存在时使用默认配置
      return config;
    });
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
