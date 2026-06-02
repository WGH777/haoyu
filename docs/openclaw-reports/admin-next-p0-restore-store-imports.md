# Admin Next P0 启动崩溃恢复报告

> 生成时间：2026-06-02 13:55 UTC  
> 分支：feature/admin-next-pure  
> 紧急修复 commit：d0f5b5d

## 根因

commit `9cb0f83`（循环依赖修复）在重构 `store/utils.ts` 时，误将 `router/index.ts` 中的三个 store import 语句替换为注释：

```ts
// 9cb0f83 错误引入的注释
// store imports via dynamic lazy-load to break circular deps
// useMultiTagsStoreHook / usePermissionStoreHook / useAppStoreHook
// are imported inside beforeEach guards
```

而 `router/index.ts` 的 `beforeEach` 守卫、`afterEach` 守卫和 `resetRouter` 函数中大量调用了这三个 hook：

- `usePermissionStoreHook()` — 第 113/161/174 行
- `useMultiTagsStoreHook()` — 第 179/191/198 行  
- `useAppStoreHook()` — 第 231/234 行

缺少 import 导致运行时 `ReferenceError: usePermissionStoreHook is not defined` → SPA 入口崩溃 → 白屏/三个点 loading。

## 影响范围

- `https://admin.haoyulv.com/` — 无法加载（白屏）
- 所有子路由 — 同样无法加载
- 后端 API — 不受影响（静态文件服务仍正常）
- 用户端 `www.haoyulv.com` — 不受影响

## 修复

恢复 `router/index.ts` 中被误删的三行 import：

```ts
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useAppStoreHook } from "@/store/modules/app";
```

循环依赖修复的核心改动（`store/utils.ts` 移除 router re-export + `permission store` 动态 import）保持不变。Router 的 store import 是安全的——因为 `store/utils.ts` 不再 re-export `router`，循环链已断开。

## 实际修改文件

`apps/admin-next/src/router/index.ts` — 恢复 3 行 import（替换错误注释）

## 新 JS hash

| 项目 | Hash |
|------|------|
| 旧（崩溃版） | `index-nRw5UWfd.js` |
| 新（修复版） | `index-DkinplOF.js` |
| 服务器 dist | `15d0ff764a300164c966a9e459ad2870` |
| 公网 curl | `15d0ff764a300164c966a9e459ad2870` ✅ |

## 构建结果

```
✓ built in 10.48s
打包大小: 2.25 MB
```

## 部署路径

`/home/web/html/haoyu-admin-next/` → `https://admin.haoyulv.com/`

## 端点验证（全部 200）

| 路径 | HTTP |
|------|:---:|
| `/` | 200 |
| `/login` | 200 |
| `/admin/dashboard` | 200 |
| `/admin/users` | 200 |
| `/api/` | 200 |

## Console 验证

⚠️ 需公子确认：刷新页面后 Console 不再出现 `ReferenceError`

## 用户确认恢复

⚠️ 需公子确认：`https://admin.haoyulv.com/` 可正常打开登录页，登录后可进入 Dashboard

## commit

```
d0f5b5d fix(admin-next): restore missing store imports in router — emergency fix
```

## push

已推送 ✅

## 遗留问题

1. 封禁/解封按钮显示问题：在 `d0f5b5d` 之前的循环依赖导致组件未能渲染。修复后的 `index-DkinplOF.js` 理论上应包含封禁/解封代码，需用户清缓存后验证
2. 侧栏首次登录转圈：`initRouter` 改为 async/await 后可能引入新的时序问题，需验证
3. `handleWholeMenus` 改为 async 后其调用者均需 await，需确认所有调用点已处理

## 时间线

| 时间 (UTC) | 事件 |
|-------------|------|
| 13:31 | `9cb0f83` 提交循环依赖修复（引入 bug） |
| 13:49 | 用户报告启动崩溃 |
| 13:54 | `d0f5b5d` 紧急修复提交并推送 |
| 13:55 | 构建部署完成，全部端点验证 200 |

**故障持续时间**：约 15-20 分钟
