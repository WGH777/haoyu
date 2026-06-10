# Admin Next Pure — 菜单/会话/子路径修复报告

> 生成时间：2026-06-02 09:25 UTC  
> 分支：feature/admin-next-pure  
> Commit：e851766

## 根因

三个独立 bug：

| 问题 | 根因 |
|------|------|
| 顶部显示"荒" | 旧 admin 和 admin-next 共享 `storageLocal["admin-user-info"]` key，旧缓存中的用户名"荒"被 admin-next 读取 |
| 侧栏转圈 | `initRouter()` → `handleWholeMenus([])` → `filterTree` 过滤掉 `showLink:false` 的父路由 → 其 children（Dashboard 等）也被丢弃 → `wholeMenus` 只剩父级空壳 → 侧栏永远 loading |
| 重新加载 404 | `onFresh()` 调用 `router.replace("/redirect" + fullPath)`，但 `/redirect/:path` 路由在 earlier cleanup 中被删除 |

## "荒"来源

`userKey = "admin-user-info"` 在旧 admin（`apps/admin`）和 admin-next 中完全一致。旧 admin 在 `storageLocal` 中持久化了用户名"荒"（可能是之前测试遗留），admin-next 初始化 store 时从 storageLocal 读取了这个值。

**修复**：
- `userKey` → `"haoyu-admin-next-user"`
- `TOKEN_KEY` → `"haoyu-admin-next-token"`  
- `multipleTabsKey` → `"haoyu-admin-next-tabs"`
- `removeToken()` 增加清理旧 admin key 的逻辑

## 侧栏转圈来源

```
router.beforeEach
→ userInfo exists
→ wholeMenus.length === 0
→ initRouter()
  → handleWholeMenus([])
    → filterTree(ascending(constantMenus.concat([])))
      → filterTree 过滤 showLink:false → 移除父路由 "/" 
        → 父路由 children 也被丢弃
    → wholeMenus = [] （空）
→ 侧栏读取 wholeMenus → 空 → loading spinner forever
```

**修复**：
- 移除 `home.ts` 父路由的 `showLink: false`
- `initRouter()` 使用 `usePermissionStoreHook().handleWholeMenus([])` 而非 `handleAsyncRoutes([])`，确保 `constantMenus` 被正确合并

## reload 404 来源

`onFresh()` 在 `lay-tag/index.vue` 中：
```js
router.replace({ path: "/redirect" + fullPath })
```
`fullPath` = `/admin/dashboard` → 拼接为 `/redirect/admin/dashboard`。

但 `/redirect/:path(.*)` 路由从 `remaining.ts` 中被删除（为了清理模板代码）。

**修复**：恢复 `/redirect/:path` 路由。

## 是否还请求 /get-async-routes

❌ 不再请求。`getAsyncRoutes` 导入已移除，`initRouter()` 完全本地静态路由。

## token key

| Key | 旧值 | 新值 |
|-----|------|------|
| TOKEN_KEY | `haoyu-admin-token` | `haoyu-admin-next-token` |
| userKey | `admin-user-info` | `haoyu-admin-next-user` |
| multipleTabsKey | `haoyu-multiple-tabs` | `haoyu-admin-next-tabs` |

## userInfo key

同上，`haoyu-admin-next-user`。

## 实际修改文件

| 文件 | 变更 |
|------|------|
| `apps/admin-next/src/utils/auth.ts` | token/userInfo/tabs key 重命名为 admin-next 独立前缀；removeToken 增加旧 key 清理 |
| `apps/admin-next/src/router/modules/home.ts` | 移除父路由 `showLink: false`（防止 filterTree 丢弃菜单） |
| `apps/admin-next/src/router/utils.ts` | `initRouter()` 改用 `handleWholeMenus([])` 代替 `handleAsyncRoutes([])` |
| `apps/admin-next/src/router/modules/remaining.ts` | 恢复 `/redirect/:path` 路由 |

## Nginx fallback

```
location /admin-next/ {
    alias /var/www/html/haoyu-admin-next/;
    try_files $uri $uri/ /admin-next/index.html;
}
```

所有子路径验证通过：
- `/admin-next/` → 200
- `/admin-next/login` → 200
- `/admin-next/admin/dashboard` → 200
- `/admin-next/redirect/admin/dashboard` → 200
- `/admin-next/nonexistent` → 200（SPA fallback）

## Vite base

```ts
base: "/admin-next/"
```

## Router base

```ts
createWebHistory("/admin-next/")
```

## 构建结果

```
✓ built in 10.00s
打包大小: 2.21 MB (gzip: ~411 KB)
```

## 部署路径

| 项目 | 路径 |
|------|------|
| 宿主机 | `/home/web/html/haoyu-admin-next/` |
| 容器内 | `/var/www/html/haoyu-admin-next/` |
| Nginx config | `/home/web/conf.d/haoyu-admin.conf` |

## 手机端验证

⚠️ 服务器无图形浏览器。curl 验证通过（所有路由 200）。

需公子在手机端验证：
1. 清理浏览器缓存 + localStorage
2. 访问 `https://admin.haoyulv.com/admin-next/`
3. 应进入登录页
4. 登录后 → 侧栏应有"总览"菜单，不转圈
5. 顶部不显示"荒"
6. 刷新不 404
7. 重新加载不 404

## 电脑端 Console

⚠️ 需公子验证（服务器无 GUI）。预期：
- 无关键红色错误
- 无 `/get-async-routes` 请求

## 电脑端 Network

⚠️ 需公子验证。预期：
- 无 401/403/404 循环
- 无 JS/CSS 404
- 第一次加载请求：index.html → favicon → js/css chunk

## Git 安全检查

```
分支: feature/admin-next-pure
Commit: e851766
未使用 git add .
修改: 4 files, +33 -10
无 .env/.db/.sqlite
```

## commit

```
e851766 fix(admin-next): isolate storage keys, fix menu spinner, fix reload 404
```

## push

未 push（待公子确认后 push）

## 报告路径

- `docs/openclaw-reports/admin-next-pure-menu-session-subpath-fix.md`

## 遗留问题

1. ⚠️ 真实浏览器 + 手机端验证需要在本地执行
2. 侧栏菜单目前只有"总览"一项（父级"浩煜灯火站"也可点击但只是 Layout 容器）
3. 其他 6 个管理页面未创建（用户管理、任务管理、仲裁中心、钱包监控、订单管理、审计日志）
4. 多标签页功能可用但当前只有一个 Dashboard 标签
