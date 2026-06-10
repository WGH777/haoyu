# GitHub PR Ready Note

## PR 标题

```text
feat(frontend): add warm gold PC product showcase
```

## PR Summary

本 PR 完成 HaoYu PC 端视觉主题统一与产品展示能力增强，包含“浩煜·万家灯火 / 暖金夜色 / 深色玻璃 / 城市灯火”主题统一、发布需求弹窗视觉优化、个人中心视觉统一，以及独立 `/design-showcase` 产品全景展示页。

所有核心改动已进入 `origin/feature/admin-next-pure`，未 push `main`。

## Changes

### 1. 主题统一

- 首页、登录、注册、个人中心统一为“浩煜·万家灯火 / 暖金夜色 / 深色玻璃 / 城市灯火”风格。
- 统一深蓝黑夜色背景、暖金边框、玻璃卡片、柔和光影和主按钮渐变。

### 2. 发布需求弹窗优化

- 输入框、文本域、下拉框、预算金额控件、上传按钮、radio 和底部操作按钮统一为深色暖金主题。
- 修复 Element Plus select 下拉面板白底和默认控件感。
- 保持创建任务字段、上传逻辑、预算逻辑、提交接口和登录判断不变。

### 3. `/design-showcase` 展示页

- 新增 PC 产品全景效果图页。
- 覆盖发布需求、任务市场、任务详情、我的任务、钱包、通知、个人中心、信任中心、争议仲裁、管理端 mock 展示。
- 页面只使用 mock 数据，不调用真实接口，不读写 `localStorage`，不依赖登录态。

### 4. 素材补齐

- 补齐本轮 UI 改造依赖的 4 个桌面端 WebP 素材。
- 仅使用 `apps/frontend/src/assets/haoyu-desktop/` 下的桌面端素材。

## Verification

- `npm run build` 通过。
- 已完成 PC 产品验收截图归档。
- 验收宽度：1366 / 1440 / 1920。
- 已验收公开页面：
  - `/`
  - `/login`
  - `/register`
  - `/task`
  - `/design-showcase`
- 公开页面均无横向滚动。
- 图片加载正常。
- `/design-showcase` 4/4 图片加载成功。
- `main` 未 push，所有改动只进入 `origin/feature/admin-next-pure`。

## Screenshots

截图目录：

```text
docs/openclaw-reports/screenshots/product-acceptance-20260610-2159
```

截图清单：

- `home-1366.png` / `home-1440.png` / `home-1920.png`
- `login-1366.png` / `login-1440.png` / `login-1920.png`
- `register-1366.png` / `register-1440.png` / `register-1920.png`
- `task-1366.png` / `task-1440.png` / `task-1920.png`
- `profile-1366.png` / `profile-1440.png` / `profile-1920.png`
- `design-showcase-1366.png` / `design-showcase-1440.png` / `design-showcase-1920.png`
- `create-task-dialog-1366.png` / `create-task-dialog-1440.png` / `create-task-dialog-1920.png`

## Known follow-ups

1. `/profile` 需账号登录后补验。
2. 发布需求弹窗打开态需账号登录后补验。
3. 本轮截图只启动了前端服务，登录态页面需启动后端后补充。
4. `/design-showcase` 为 mock 展示页，不调用真实 API，不代表真实业务页全部已完成视觉沉淀。
5. 后续应将 showcase 风格逐页沉淀到 `Wallet`、`MyTasks`、`TaskDetail`、`Notifications`、`TrustCenter` 等真实页面。
6. `apps/frontend/tsconfig.node.tsbuildinfo` 是 tracked 构建缓存，后续建议单独处理，不混入 UI PR。

## Safety notes

1. 未修改 `backend`。
2. 未修改 `prisma`。
3. 未修改数据库、`.env`、`*.db`。
4. 未修改上传目录、`dist`、`node_modules`。
5. 未修改 `Wallet` / `LedgerEntry` / `Order` / `Task` 后端资金与状态逻辑。
6. `/design-showcase` 不调用 API、不读写 `localStorage`、不依赖登录态。
7. 本轮没有 push `main`。

## GitHub PR 正文

```markdown
# feat(frontend): add warm gold PC product showcase

## Summary

本 PR 完成 HaoYu PC 端视觉主题统一与产品展示能力增强，包含“浩煜·万家灯火 / 暖金夜色 / 深色玻璃 / 城市灯火”主题统一、发布需求弹窗视觉优化、个人中心视觉统一，以及独立 `/design-showcase` 产品全景展示页。

## Changes

### 主题统一

- 首页、登录、注册、个人中心统一为“浩煜·万家灯火 / 暖金夜色 / 深色玻璃 / 城市灯火”风格。
- 统一深蓝黑夜色背景、暖金边框、玻璃卡片、柔和光影和主按钮渐变。

### 发布需求弹窗优化

- 输入框、下拉框、预算控件、上传按钮、操作按钮统一为深色暖金主题。
- 修复 Element Plus select 下拉面板白底和默认控件感。
- 不修改任务创建字段、上传逻辑、预算逻辑、提交接口或登录判断。

### `/design-showcase` 展示页

- 新增 PC 产品全景效果图页。
- 覆盖发布需求、任务市场、任务详情、我的任务、钱包、通知、个人中心、信任中心、争议仲裁、管理端 mock 展示。
- 展示页只使用 mock 数据，不调用真实接口，不读写 `localStorage`，不依赖登录态。

### 素材补齐

- 补齐本轮 UI 改造依赖的 4 个桌面端 WebP 素材。
- 仅使用 `apps/frontend/src/assets/haoyu-desktop/` 下的桌面端素材。

## Verification

- `npm run build` 通过。
- 已完成 PC 产品验收截图归档。
- 验收宽度：1366 / 1440 / 1920。
- 已验收公开页面：
  - `/`
  - `/login`
  - `/register`
  - `/task`
  - `/design-showcase`
- 公开页面均无横向滚动。
- 图片加载正常。
- `/design-showcase` 4/4 图片加载成功。
- `main` 未 push，所有改动只进入 `origin/feature/admin-next-pure`。

## Screenshots

截图目录：

`docs/openclaw-reports/screenshots/product-acceptance-20260610-2159`

截图清单：

- `home-1366.png` / `home-1440.png` / `home-1920.png`
- `login-1366.png` / `login-1440.png` / `login-1920.png`
- `register-1366.png` / `register-1440.png` / `register-1920.png`
- `task-1366.png` / `task-1440.png` / `task-1920.png`
- `profile-1366.png` / `profile-1440.png` / `profile-1920.png`
- `design-showcase-1366.png` / `design-showcase-1440.png` / `design-showcase-1920.png`
- `create-task-dialog-1366.png` / `create-task-dialog-1440.png` / `create-task-dialog-1920.png`

## Known follow-ups

- `/profile` 需账号登录后补验。
- 发布需求弹窗打开态需账号登录后补验。
- 本轮截图只启动了前端服务，登录态页面需启动后端后补充。
- `/design-showcase` 为 mock 展示页，不调用真实 API，不代表真实业务页全部已完成视觉沉淀。
- 后续应将 showcase 风格逐页沉淀到 `Wallet`、`MyTasks`、`TaskDetail`、`Notifications`、`TrustCenter` 等真实页面。
- `apps/frontend/tsconfig.node.tsbuildinfo` 是 tracked 构建缓存，后续建议单独处理，不混入 UI PR。

## Safety notes

- 未修改 `backend`。
- 未修改 `prisma`。
- 未修改数据库、`.env`、`*.db`。
- 未修改上传目录、`dist`、`node_modules`。
- 未修改 `Wallet` / `LedgerEntry` / `Order` / `Task` 后端资金与状态逻辑。
- `/design-showcase` 不调用 API、不读写 `localStorage`、不依赖登录态。
- 本轮没有 push `main`。
```
