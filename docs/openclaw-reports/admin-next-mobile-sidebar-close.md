# Admin Next Pure — 移动端侧栏自动收起修复报告

> 生成时间：2026-06-02 10:43 UTC  
> 分支：feature/admin-next-pure  
> Commit：d2b3bad

## 问题

手机端访问 `https://admin.haoyulv.com/admin-next/`，点击左侧菜单项后，侧边栏/抽屉不会自动关闭，遮挡页面内容，需手动收起。

## 修改文件

`apps/admin-next/src/router/index.ts` — 6 行新增

### Diff

```diff
+ import { useAppStoreHook } from "@/store/modules/app";

  router.afterEach(to => {
    loadedPaths.add(to.path);
    NProgress.done();
+
+   // 移动端点击菜单后自动收起侧栏
+   if (useAppStoreHook().getDevice === "mobile"
+       && useAppStoreHook().getSidebarStatus) {
+     useAppStoreHook().toggleSideBar(false, "resize");
+   }
  });
```

## 实现方式

```
router.afterEach → 每次路由切换触发
  ├─ getDevice → app store 中由 deviceDetection() 返回 "mobile" | "desktop"
  ├─ getSidebarStatus → sidebar.opened 状态（boolean）
  └─ toggleSideBar(false, "resize") → 关闭侧栏，标记 resize 触发（无动画）
```

- **桌面端**：`getDevice === "desktop"` → 条件不满足 → 不触发
- **移动端**：`getDevice === "mobile"` + 侧栏展开 → 自动关闭

`toggleSideBar(false, "resize")` 使用第二个参数 `"resize"`，确保关闭时无过渡动画，内容区立即填满屏幕，体验流畅。

## 构建结果

```
✓ built in 10.70s, 2.22 MB
JS: index-vT4q7298.js
```

## 部署状态

已部署至 `https://admin.haoyulv.com/admin-next/`（推送后自动生效）。

## 手机端验证

⚠️ 需公子在手机端执行：

1. 清除站点缓存后访问 `https://admin.haoyulv.com/admin-next/`
2. 登录（`admin@haoyulv.com` + 密码）
3. 点击左上角菜单图标展开侧栏
4. 点击任意菜单项（如"用户管理"）
5. 验证：侧栏自动收起，页面内容正常显示
6. 桌面端验证：侧栏不自动收起（保持不变）

## Git 安全检查

```
分支: feature/admin-next-pure
Commit: d2b3bad
修改: 1 file, +6 lines
无 .env/.db/.sqlite
```

## commit

```
d2b3bad fix(admin-next): auto-close sidebar on mobile after menu click
```

## push

已推送 `origin/feature/admin-next-pure` ✅

## 遗留问题

- 无
