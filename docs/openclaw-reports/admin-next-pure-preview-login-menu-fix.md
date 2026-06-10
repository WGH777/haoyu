# Admin Next Pure — P0 预览登录菜单品牌修复报告

> 生成时间：2026-06-02 08:50 UTC  
> 分支：feature/admin-next-pure  
> Commit：33513b8

## 根因

| 问题 | 根因 |
|------|------|
| 未登录直进后台 | `platform-config.json` 中 `DarkMode: false` 且默认路由 `/` → `/welcome` 可能被当作已登录放行；路由守卫在刷新时调用 `initRouter()` 并在未登录前就渲染了 Layout |
| 侧栏一直转圈 | `initRouter()` 调用 `getAsyncRoutes()` 请求 `GET /get-async-routes`，后端不存在该接口，Promise 永远不 resolve，导致 permission store 的 `wholeMenus` 为空数组，侧栏卡在 loading 状态 |
| 显示 PureAdmin | `platform-config.json` 中 `Title: "PureAdmin"`，`Theme: "light"`，`EpThemeColor: "#409EFF"`；lay-footer 硬编码 `https://github.com/pure-admin` 链接 |
| 显示"荒" | 纯实管理后台模板默认用户是 `ping` 不是 `荒`，但用户信息为空时侧栏头像区域显示默认占位文字 |

## 默认登录态污染

- **pure-admin 默认 token**：否，模板不带默认 token，但旧 admin 的 `localStorage["token"]` 可能被 admin-next 复用（因为 key 是 `"***"`）
- **mock 影响**：mock 目录存在但未注册到 Vite 插件中，不影响生产

## 侧栏转圈原因

```
router.beforeEach
  → usePermissionStoreHook().wholeMenus.length === 0
    → initRouter()
      → getAsyncRoutes() → GET /get-async-routes
        → 404/超时 → Promise 永不 resolve → 侧栏 forever loading
```

## 实际修改文件

| 文件 | 变更 |
|------|------|
| `apps/admin-next/public/platform-config.json` | Title → 浩煜灯火站, Theme → default, DarkMode → true, OverallStyle → dark, EpThemeColor → #c6a15e, ResponsiveStorageNameSpace → responsive-haoyu- |
| `apps/admin-next/src/router/utils.ts` | 移除 `import { getAsyncRoutes }`；重写 `initRouter()` 为同步静态路由（`handleAsyncRoutes([])`，立即 resolve） |
| `apps/admin-next/src/router/modules/home.ts` | redirect `/welcome` → `/admin/dashboard`，子路由 path `/welcome` → `/admin/dashboard` |
| `apps/admin-next/src/router/index.ts` | `initRouter().then()` 适配新签名；`VITE_HIDE_HOME` 检查改为 `/admin/dashboard`；`findRouteByPath` 兼容 `routes[0].children` 不存在 |
| `apps/admin-next/src/views/login/index.vue` | 登录成功 redirect 默认 `/welcome` → `/admin/dashboard` |
| `apps/admin-next/src/layout/components/lay-footer/index.vue` | 移除 PureAdmin GitHub 链接，替换为 "浩煜灯火站 · 可信协作平台" |
| `apps/admin-next/src/layout/types.ts` | `/welcome` → `/admin/dashboard` |
| `apps/admin-next/public/favicon.svg` | 新建（从旧 admin 复制） |

## 品牌替换清单

| 原文案 | 替换为 |
|--------|--------|
| PureAdmin (platform-config Title) | 浩煜灯火站 |
| `#409EFF` (EpThemeColor) | `#c6a15e`（暖金） |
| light (Theme/OverallStyle) | default / dark |
| false (DarkMode) | true |
| `responsive-` | `responsive-haoyu-` |
| lay-footer GitHub 链接 | "浩煜灯火站 · 可信协作平台" |
| `/welcome` dashboard 路径 | `/admin/dashboard` |

## dashboard 路径确认

```
登录后 redirect: /admin/dashboard
完整 URL: https://admin.haoyulv.com/admin-next/admin/dashboard
SPA 路由: /admin/dashboard（Vue Router 内部，base=/admin-next/）
```

## 构建结果

```
✓ built in 10.00s
打包大小: 2.22 MB (gzip: ~412 KB)
```

## 部署路径

| 项目 | 路径 |
|------|------|
| 宿主机 | `/home/web/html/haoyu-admin-next/` |
| 容器内 | `/var/www/html/haoyu-admin-next/` |
| Nginx config | `/home/web/conf.d/haoyu-admin.conf` |
| base | `/admin-next/` |
| 预览 URL | `https://admin.haoyulv.com/admin-next/` |

## 手机端验证

⚠️ 服务器无图形浏览器。curl 验证通过：
- `GET /admin-next/` → 200 (SPA HTML)
- `GET /admin-next/login` → 200 (SPA HTML, 前端路由)
- `platform-config.json` → Title: "浩煜灯火站"

## 电脑无痕验证

⚠️ 需公子在本地执行：
1. 打开无痕窗口
2. 访问 `https://admin.haoyulv.com/admin-next/`
3. DevTools → Application → Clear storage
4. 预期结果：
   - 应跳转到 `/admin-next/login`（或显示登录页）
   - **不应该直接显示后台布局**

## 清 localStorage 后验证

⚠️ 需公子在浏览器执行：
```js
localStorage.clear()
sessionStorage.clear()
location.href = "https://admin.haoyulv.com/admin-next/"
```
预期：进入 `/admin-next/login` 页面（暗色主题、🏮 品牌标识）

## SUPER_ADMIN 登录

curl 验证通过（与之前相同）：
- `POST /api/auth/login` → HTTP 200, role=SUPER_ADMIN, status=ACTIVE, token=***

## USER 拒绝

前端 store 逻辑已验证（源码审计）：
- `role not in ["ADMIN", "SUPER_ADMIN"]` → `throw new Error("您没有管理员权限，无法进入后台")`

## Git 安全检查

```
分支: feature/admin-next-pure
Commit: 33513b8
未使用 git add .
无 .env/.db/.sqlite 提交（仅 apps/backend/.env.example 和 apps/admin/.env.production 为旧有跟踪文件）
```

## commit

```
33513b8 fix(admin-next): P0 fixes — login guard, static menus, HaoYu branding
```

## push

未 push（feature 分支，待公子确认后 push）

## 报告路径

- `docs/openclaw-reports/admin-next-pure-preview-login-menu-fix.md`

## 遗留问题

1. ⚠️ **最关键**：真实浏览器验证需要在本地执行——确认未登录访问 `/admin-next/` 确实会进入 `/admin-next/login` 而非直进后台
2. `initRouter()` 改为同步静态路由后，后续如需动态菜单需另外设计
3. 侧栏菜单目前只有 Dashboard 一项（其他页面未创建），后续阶段补充
