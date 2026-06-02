# Admin Next Pure — 第一阶段：骨架搭建报告

> 生成时间：2026-06-02 08:10 UTC  
> 分支：feature/admin-next-pure  
> 基于 commit：994fc7a

## 阶段

第一阶段：pure-admin 骨架搭建 + HaoYu 品牌登录页 + 基础 Layout + Dashboard 空壳 + 构建链路

## 实际修改文件

### 新建目录
```
apps/admin-next/                              # 完整 pure-admin-thin 工程
```

### 自定义修改（相比 pure-admin-thin 原始模板）
| 文件 | 变更 |
|------|------|
| `src/views/login/index.vue` | HaoYu 品牌登录页（🏮 灯火图标、品牌标语、email/password 表单、暗色默认） |
| `src/views/welcome/index.vue` | Dashboard 空壳（浩煜灯火站标题 + 功能待开发说明） |
| `src/router/modules/home.ts` | 重命名首页路由：title "浩煜灯火站"，redirect /welcome |
| `src/api/user.ts` | 登录接口改为 `/api/auth/login`，refresh 改为 `/api/auth/refresh` |
| `src/store/modules/user.ts` | 登录适配 HaoYu 后端返回格式 `{ user, accessToken, refreshToken }`，添加 ADMIN/SUPER_ADMIN 权限检查 |
| `src/layout/hooks/useDataThemeChange.ts` | 默认暗色模式 |
| `src/layout/hooks/useNav.ts` | 移除 user.jpg 导入依赖 |
| `src/config/index.ts` | 默认标题 "浩煜灯火站"，主题色 `#c6a15e` |
| `index.html` | 标题改为 "浩煜灯火站 · 管理后台"，zh-CN，加载色暖金 |
| `.env` / `.env.development` / `.env.production` | VITE_APP_TITLE = 浩煜灯火站，H5 路由模式 |
| `vite.config.ts` | 添加 `/api` 代理到 `http://127.0.0.1:3000` |
| `build/plugins.ts` | 移除 cdn、mock 插件（不适配 monorepo） |
| `src/main.ts` | 移除 tippy、echarts 依赖 |
| `.gitignore` | 排除 `node_modules`、`dist`、`.env` |

## 实际命令

```bash
# 创建分支
cd /opt/haoyu
git checkout main
git checkout -b feature/admin-next-pure

# 脚手架创建
npx @pureadmin/cli init thin admin-next
mv admin-next apps/admin-next

# 安装依赖
cd apps/admin-next && pnpm install

# 构建
npx vite build
# → ✓ built in 10.31s, 2.22 MB

# Dev 启动
timeout 15 npx vite --host 0.0.0.0
# → VITE v7.3.3 ready, localhost:8848

# 提交
git add apps/admin-next/ docs/architecture/haoyu-framework-selection-v1.md
git commit -m "chore(admin-next): scaffold pure-admin app with HaoYu branding"
```

## 构建结果

```
dist/static/js/index-*.js    1,273.93 kB │ gzip: 426.91 kB
✓ built in 10.31s
打包后大小: 2.22 MB
```

## 接口对接

| 接口 | 状态 | 备注 |
|------|------|------|
| POST /api/login (mock) | ✅ | 脚手架自带 mock，dev 时可跳过登录 |
| POST /api/auth/login | ⏳ | API 路径已配置，待生产后端对接 |
| POST /api/auth/refresh | ⏳ | 同上 |
| GET /api/user/profile | ⏳ | 第二阶段接入 |

## 浏览器验证

- Dev server 在 `http://localhost:8848` 正常启动（1095ms）
- 构建产物全部生成完成
- 未做真实浏览器验证（无本地浏览器环境）

## Git 安全检查

```
# 敏感文件检查
git ls-files | grep -E '\.env|\.db|\.sqlite' → apps/admin/.env.production, apps/backend/.env.example (已有，非本次新增)

# untracked 敏感文件
apps/backend/prisma/dev.db.bak.20260531_105313 → 未提交

# 历史检查
git rev-list --objects --all | grep -E '\.db$|\.sqlite$' → (空)

# 未使用 git add .
# 未 force push
# 未创建 tag
# 未提交 .env/.db/.sqlite
```

## commit

```
5ea6119 chore(admin-next): remove backup files
0c8f491 chore(admin-next): scaffold pure-admin app with HaoYu branding
```

## 报告路径

- `docs/architecture/haoyu-framework-selection-v1.md`
- `docs/openclaw-reports/admin-next-pure-stage-1-scaffold.md`（本报告）

## 遗留问题

1. 登录页仍使用 mock 数据，第二阶段需对接真实后端 `/api/auth/login`
2. mock 目录保留（`apps/admin-next/mock/`），后续可清理
3. 未做真实浏览器测试
4. `pnpm-lock.yaml` 未提交（被 revert，monorepo 共享根 lockfile）

## 下一步

- 第二阶段：对接登录 API — 真实登录、token 持久化、SUPER_ADMIN/ADMIN 权限验证、token 刷新
- 可先用 `http://localhost:8848` 本地预览（需先 `cd apps/admin-next && npx vite`）
- 后续通过 `admin-next.haoyulv.com` 子域名部署预览
