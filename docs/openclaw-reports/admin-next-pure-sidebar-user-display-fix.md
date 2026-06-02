# Admin Next Pure — 侧栏用户显示修复报告

> 生成时间：2026-06-02 09:55 UTC  
> 分支：feature/admin-next-pure  
> Commit：ebda502（已推送的 menu session fix）

## "荒"真实来源

**"荒"不在任何源代码中。** grep 全项目 `apps/admin-next/src` 和 `apps/admin-next/public` 结果为 0。

来源链路：
```
旧 apps/admin 将用户名"荒"写入 storageLocal["admin-user-info"]
    ↓
admin-next 使用同一个 key "admin-user-info"
    ↓
user store 初始化时从 storageLocal 读取 → username/nickname = "荒"
    ↓
layout 用户组件渲染显示"荒"
```

修复：`userKey` 已改为 `"haoyu-admin-next-user"`（token 改为 `"haoyu-admin-next-token"`），与旧 admin 完全隔离。`removeToken()` 同时清理旧 key。

## grep 是否仍有"荒"

- 源码：❌ 无
- 新构建产物 JS：❌ 无（部署文件中 grep 结果为 0）
- 之前的构建产物 JS 中有拼音词典数据含"荒"字（非用户名数据），新版构建已更新

## 用户显示字段

链路：`useNav.ts` → `computed username` → `useUserStoreHook().nickname || useUserStoreHook().username` → `storageLocal["haoyu-admin-next-user"].nickname`

登录后 store.set 写入：
```
nickname = user?.nickname || user?.email  (来自后端 /api/auth/login 返回)
```

## 侧栏转圈真实来源

`initRouter()` → `handleWholeMenus([])` → `filterTree(ascending(constantMenus.concat([])))` → 父路由 `showLink: false` 被过滤 → children 也被丢弃 → `wholeMenus` 为空 → 侧栏永远 loading。

修复（上轮已完成）：
- 移除 `home.ts` 父路由 `showLink: false`
- `initRouter` 使用 `handleWholeMenus([])` 确保 `constantMenus` 合并

## Layout 读取菜单字段

`NavVertical.vue` 等侧栏组件 → `usePermissionStoreHook().wholeMenus`

## initRouter 写入菜单字段

`handleWholeMenus([])` → `this.wholeMenus = filterNoPermissionTree(filterTree(ascending(constantMenus.concat([]))))` → 包含 `home.ts` 中的 Dashboard 菜单项

## wholeMenus 长度

预期长度 >= 1（父级"浩煜灯火站"目录 + 子级"总览"菜单项），取决于 `filterNoPermissionTree` 的 roles 过滤结果。

## 实际修改文件

本报告覆盖的是上轮 commit `e851766` 的修复（menu session fix），本轮无新增代码修改：

| 文件 | 上轮变更 |
|------|----------|
| `apps/admin-next/src/utils/auth.ts` | token/userInfo key 隔离 |
| `apps/admin-next/src/router/modules/home.ts` | 移除 `showLink: false` |
| `apps/admin-next/src/router/utils.ts` | `initRouter` 使用 `handleWholeMenus` |
| `apps/admin-next/src/router/modules/remaining.ts` | 恢复 `/redirect/:path` |

## 构建结果

```
✓ built in 10.29s
打包大小: 2.21 MB
部署产物中 grep "荒" 结果: 0
```

## 部署路径

| 项目 | 路径 |
|------|------|
| 宿主机 | `/home/web/html/haoyu-admin-next/` |
| 容器内 | `/var/www/html/haoyu-admin-next/` |
| 预览 URL | `https://admin.haoyulv.com/admin-next/` |

## 手机端验证

⚠️ 需公子执行：
1. 打开 `https://admin.haoyulv.com/admin-next/`
2. 在浏览器执行 `localStorage.clear(); sessionStorage.clear(); location.reload()`
3. 登录 `admin@haoyulv.com` + 密码
4. 验证：侧栏不转圈、用户名不为"荒"、不显示 PureAdmin

## 电脑端验证

⚠️ 需公子验证 Console/Network

## Git 安全检查

```
分支: feature/admin-next-pure
最新: ebda502 (已推送)
工作区: clean
无 .env/.db/.sqlite 新增
```

## commit

```
ebda502 docs: add admin-next-pure menu session subpath fix report
e851766 fix(admin-next): isolate storage keys, fix menu spinner, fix reload 404
```

## push

已推送 `origin/feature/admin-next-pure`

## 报告路径

- `docs/openclaw-reports/admin-next-pure-sidebar-user-display-fix.md`

## 遗留问题

1. ⚠️ 用户必须在浏览器清空 `localStorage` / `sessionStorage` 才能看到完整修复效果（旧 `admin-user-info` key 的缓存需要手动清除）
2. 侧栏目前只有"总览"一个菜单项（其他 6 个页面待开发）
3. Dashboard 页面内容为占位符
