# Admin Next Pure — 缓存排查报告

> 生成时间：2026-06-02 10:03 UTC  
> 分支：feature/admin-next-pure  
> Commit：57ae61f / d4b4058

## 是否确认缓存问题

**确认。存在两类缓存污染。**

| 类型 | 详情 |
|------|------|
| 旧 bundle 残留 | 部署目录有 27 个 JS 文件（多次构建未 `--delete`）|
| localStorage 污染 | 旧 admin key `admin-user-info` + `token` 与 admin-next 历史共享 |

## 服务器 index hash

```
HTML: 1895f291209eb235b013f7d98f9c11bd (index-DLZMVquc.js)
JS:   e9325ea9729f945ca1b4a17253df0644
CSS:  已确认一致
```

## 公网 index hash

```
HTML: 1895f291209eb235b013f7d98f9c11bd ✅ 与服务器一致
JS:   e9325ea9729f945ca1b4a17253df0644 ✅ 与服务器一致
```

**结论：公网加载的是最新 bundle，无 CDN/Cloudflare 缓存差异。**

## 浏览器 JS hash

- 服务器上无图形浏览器，需公子验证 DevTools Network 中 JS 文件名是否为 `index-DLZMVquc.js`
- 如果用 Curl 加载且无 Service Worker/浏览器缓存，JS hash 与服务器一致

## Cache-Control

```
/admin-next/: no-cache, no-store, must-revalidate
/admin-next/login: no-cache, no-store, must-revalidate (SPA fallback)
/admin-next/admin/dashboard: no-cache, no-store, must-revalidate (SPA fallback)
/assets/*: 30d (长期缓存，hash 文件名)
```

## CF-Cache-Status

```
CF-Cache-Status: DYNAMIC
```

Cloudflare **不缓存** `/admin-next/*`（符合预期）。

## Service Worker

**不存在。** 已添加主动 unregister 代码（防御性编程）。

## localStorage 旧 key

| Key | 来源 | 状态 |
|-----|------|------|
| `token` | 旧 admin TOKEN_KEY | ✅ 已清理（`main.ts` 入口） |
| `admin-user-info` | 旧 admin userKey | ✅ 已清理（`main.ts` 入口） |
| `haoyu-admin-token` | admin-next 旧版 TOKEN_KEY | ✅ 已清理 |
| `haoyu-multiple-tabs` | 旧 tabsKey | ✅ 已清理 |
| `access_token`, `jwt` | 兼容 key | ✅ 已清理 |
| `haoyu-admin-next-user` | admin-next 当前 userKey | 🟢 保留 |
| `haoyu-admin-next-token` | admin-next 当前 TOKEN_KEY | 🟢 保留 |
| `haoyu-admin-next-tabs` | admin-next 当前 tabsKey | 🟢 保留 |

## 是否添加 build version

✅ 三处版本标识：

1. **Console**: `console.info("[haoyu-admin-next]", { version, buildTime, commitHash })`
2. **登录页底部**: "浩煜灯火站 · 可信协作平台 · admin-next d4b4058"
3. **Dashboard 底部**: "admin-next build: d4b4058"

## 实际修改文件

| 文件 | 变更 |
|------|------|
| `apps/admin-next/src/main.ts` | 添加旧 key 清理 + SW unregister + build info console |
| `apps/admin-next/src/views/login/index.vue` | footer 添加版本号 |
| `apps/admin-next/src/views/welcome/index.vue` | 添加 build 版本号 |

## 构建结果

```
✓ built in 10.20s, 2.22 MB
JS hash: index-DLZMVquc.js
部署文件: 9 JS files (清理前: 27)
```

## 部署路径

- `/home/web/html/haoyu-admin-next/`（已 `rm -rf` + 全新复制）
- 预览 URL: `https://admin.haoyulv.com/admin-next/`

## 手机端验证

⚠️ 需公子执行：

1. **最彻底方法**：打开 Chrome → 地址栏左侧锁图标 → 网站设置 → 清除数据
2. 或换一个从未访问过 `admin.haoyulv.com` 的浏览器
3. 访问 `https://admin.haoyulv.com/admin-next/`
4. 验证：
   - 登录页底部显示 "admin-next d4b4058"
   - 登录后不显示"荒"
   - 侧栏不转圈
   - Dashboard 底部显示 "admin-next build: d4b4058"

## 电脑端验证

⚠️ 需公子执行 DevTools 检查：

- Network → 确认 JS 文件名为 `index-DLZMVquc.js`
- Console → 应有 `[haoyu-admin-next] build` 日志
- Application → Storage → localStorage → 应只有 `haoyu-admin-next-*` key
- Application → Service Workers → 应为空

## Git 安全检查

```
分支: feature/admin-next-pure
最新: 57ae61f
工作区: clean
无 .env/.db/.sqlite 新增
```

## commit

```
57ae61f chore(admin-next): add build version labels
d4b4058 fix(admin-next): add cache-busting — legacy key cleanup, SW unregister
```

## push

未 push

## 报告路径

- `docs/openclaw-reports/admin-next-cache-investigation-report.md`

## 遗留问题

1. ⚠️ 用户必须手动清除浏览器站点数据才能彻底消除旧 localStorage 污染（`main.ts` 中的清理仅在 admin-next 页面首次加载时执行，不会影响其他域）
2. 首次打开时 JavaScript 清理代码执行前可能有短暂的白屏/loading
3. 部署脚本建议标准化为 `rsync --delete` 或 `rm -rf + cp`
