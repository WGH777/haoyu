// 响应式storage (简化版)
// 替代 responsive-storage 包，提供 Pure Admin layout 所需的 $storage / $config
import type { App, InjectionKey } from "vue";
import { reactive } from "vue";
import { routerArrays } from "@/layout/types";
import { responsiveStorageNameSpace } from "@/config";

export const GlobalConfigKey: InjectionKey<any> = Symbol("$config");
export const GlobalStorageKey: InjectionKey<any> = Symbol("$storage");

export const injectResponsiveStorage = (app: App, config: PlatformConfigs) => {
  const $config = config;

  const $storage: Record<string, any> = reactive({
    // 国际化
    locale: { locale: config.Locale ?? "zh" },
    // layout
    layout: {
      layout: config.Layout ?? "vertical",
      theme: config.Theme ?? "dark",
      darkMode: config.DarkMode ?? true,
      sidebarStatus: config.SidebarStatus ?? true,
      epThemeColor: config.EpThemeColor ?? "#f5a623",
      themeColor: config.Theme ?? "dark",
      themeMode: config.ThemeMode ?? "dark"
    },
    // 界面配置
    configure: {
      grey: config.Grey ?? false,
      weak: config.Weak ?? false,
      hideTabs: config.HideTabs ?? false,
      hideFooter: config.HideFooter ?? true,
      showLogo: config.ShowLogo ?? true,
      watermark: config.Watermark ?? false,
      watermarkText: config.WatermarkText ?? "",
      tagsStyle: config.TagsStyle ?? "chrome",
      multiTagsCache: config.MultiTagsCache ?? false,
      stretch: config.Stretch ?? false
    }
  });

  if (config.MultiTagsCache) {
    ($storage as any).tags = routerArrays;
  }

  app.provide(GlobalConfigKey, $config);
  app.provide(GlobalStorageKey, $storage);

  // Also set on globalProperties for compatibility
  (app.config.globalProperties as any).$config = $config;
  (app.config.globalProperties as any).$storage = $storage;
};
