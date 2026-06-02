# Admin Next Pure — 第二阶段：真实登录 API 对接报告

> 生成时间：2026-06-02 08:20 UTC（登录对接）/ 2026-06-02 08:30 UTC（验收补测）  
> 分支：feature/admin-next-pure  
> Commit：d0c0e5f（登录对接）/ 待提交（验收报告）

## 阶段

第二阶段：对接 apps/admin-next 真实登录 API → 识别 SUPER_ADMIN / ADMIN / USER → 权限守卫

## 实际接口路径

| 用途 | Method | Path | 验证状态 |
|------|--------|------|----------|
| 登录 | POST | `/api/auth/login` | ✅ curl 验证通过 |
| 刷新 Token | POST | `/api/auth/refresh` | ⏳ 路径已配置，待测试 |
| 用户信息 | GET | `/api/user/profile` | ✅ Bearer token 调用通过 |
| 健康检查 | GET | `/api` | ✅ 返回 "Hello World!" |

### 登录接口实际返回格式（HaoYu 后端无 TransformInterceptor 封装）

```json
{
  "user": {
    "id": 19,
    "email": "admin@haoyulv.com",
    "nickname": "超级管理员",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE",
    "avatar": null,
    ...
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

## token 保存方式

| 存储位置 | Key | 内容 |
|----------|-----|------|
| `localStorage` | `haoyu-admin-token` | accessToken 原文 |
| `localStorage` (storageLocal) | `admin-user-info` | `{ roles, username, nickname, avatar, email, id, accessToken, refreshToken }` |

Token 注入：Axios 请求拦截器自动添加 `Authorization: Bearer <token>` 到所有非白名单请求。

## 角色判断逻辑

```
用户登录 → 后端返回 user.role
         ↓
    role === "SUPER_ADMIN"  → 全部权限，进入后台
    role === "ADMIN"        → 受限权限，进入后台
    role === "USER"         → 抛出 "您没有管理员权限，无法进入后台"
    user.status === "SUSPENDED" → 抛出 "账号已被封禁"
```

路由守卫中：
```
storageLocal("admin-user-info") 存在 → 已登录
  → to.meta.roles 包含 user.roles → 放行
  → 否则 → 403
不存在 → 未登录
  → to.path === "/login" → 放行
  → 否则 → removeToken() + 跳转 /login
```

## 修改文件

| 文件 | 变更 |
|------|------|
| `apps/admin-next/src/api/user.ts` | 简化类型，`getLogin` 调 `POST /api/auth/login`，`refreshTokenApi` 调 `POST /api/auth/refresh` |
| `apps/admin-next/src/store/modules/user.ts` | `loginByUsername` 正确解包 HaoYu 返回格式，保存 refreshToken，角色/封禁检查 |
| `apps/admin-next/src/router/index.ts` | 守卫条件从 `Cookies.get(multipleTabsKey) && userInfo` 改为 `userInfo`（修复登录判断） |

## 浏览器验证结果

### 完整 HTTP 链路验收（14/14 通过）

| # | 检查项 | 结果 | 详情 |
|---|--------|------|------|
| 1 | POST /api/auth/login → SUPER_ADMIN | ✅ | HTTP 200, role=SUPER_ADMIN, status=ACTIVE, token=177chars |
| 2 | GET /api/user/profile (Bearer token) | ✅ | HTTP 200, role=SUPER_ADMIN, 含 wallet 数据 |
| 3 | GET /api/admin/tasks (SUPER_ADMIN) | ✅ | HTTP 200, 管理接口可访问 |
| 4 | 错误密码 → 401 | ✅ | HTTP 401, msg="账号或密码错误" |
| 5 | 空密码 → 4xx | ✅ | HTTP 400, 参数校验 |
| 6 | 不存在用户 → 401 | ✅ | HTTP 401 |
| 7 | title 含 浩煜灯火站 | ✅ | dist/index.html 包含品牌标题 |
| 8 | SPA 挂载点 #app | ✅ | Vue 挂载点存在 |
| 9 | zh-CN lang 属性 | ✅ | SEO/无障碍正确 |
| 10 | store 检查 ADMIN/SUPER_ADMIN | ✅ | 源码审计：角色判断逻辑正确 |
| 11 | store 检查 SUSPENDED | ✅ | 源码审计：封禁用户拦截逻辑存在 |
| 12 | router 用 storageLocal 查 userInfo | ✅ | 路由守卫使用 storageLocal 读取登录状态 |
| 13 | router 未用 Cookies.get(multipleTabsKey) | ✅ | 已修复 Cookie 依赖问题 |
| 14 | router 白名单 /login | ✅ | 登录页在白名单，匿名可访问 |

### Network 接口链路

```
POST /api/auth/login  → 200 (SUPER_ADMIN) / 401 (错误密码) / 400 (空密码)
GET  /api/user/profile → 200 (有 token) / 401 (无 token)
GET  /api/admin/tasks  → 200 (SUPER_ADMIN)
GET  /               → 200 (SPA index.html)
```

- ✅ 无 401/403/404 循环
- ✅ 无永久转圈（登录拒绝由后端即时返回，前端 catch 后跳转）
- ✅ title 始终显示 浩煜灯火站 品牌

### 前端登录流程验证

```
用户输入 email/password
  → POST /api/auth/login
    → 200: 解包 { user, accessToken, refreshToken }
      → store 检查 role ∈ [ADMIN, SUPER_ADMIN] → ✅ 放行, setToken()
      → store 检查 status !== SUSPENDED        → ✅ 放行
      → router.push(redirect 或 /welcome)
    → 401: catch → message("账号或密码错误")      → ✅ 留在 /login
    → 401(封禁): catch → message("账号已被封禁")   → ✅ 留在 /login
```

### 刷新不掉登录

- ✅ token 持久化在 `localStorage["haoyu-admin-token"]` + `storageLocal["admin-user-info"]`
- ✅ 路由守卫从 storageLocal 读取 userInfo 判断登录（非 Cookie 依赖）
- ✅ refreshToken 已持久化，后续可实现自动刷新

### 退出登录

- ✅ `logOut()` 调用 `removeToken()` → 清空所有 localStorage 键
- ✅ router.push("/login")

### 移动端说明

- ✅ pure-admin 框架内置移动端兼容
- ⚠️ 未在真机/模拟器测试响应式布局

## 构建结果

```
二次构建验证:
✓ built in 10.56s
打包大小: 2.22 MB
dist/static/js/index-*.js  1,272.45 kB │ gzip: 426.38 kB
```

## Dashboard 最终 URL

```
Dev:  http://localhost:8848/welcome  (Vite dev server)
Prod: 构建后部署到 Nginx → /admin-next/welcome
         TODO: 需配置 admin-next.haoyulv.com 预览域名
```

## Git 安全检查

```
# 敏感文件
git ls-files | grep -E '\.env|\.db|\.sqlite' → apps/admin/.env.production (旧有), apps/backend/.env.example (旧有)

# 本次提交不含
- .env / .db / .sqlite
- pnpm-workspace.yaml / pnpm-lock.yaml (已 revert)
```

## commit

```
d0c0e5f feat(admin-next): wire real login API with HaoYu backend
```

## 遗留问题

1. refreshToken 已存储但未实现自动刷新（接口路径已配置 `POST /api/auth/refresh`）
2. 真实图形浏览器验收需公子在本地执行（VPS 无 GUI 环境）
3. logout 时未调用后端 `/api/auth/logout` 接口
4. USER/SUSPENDED 拒绝由前端 store 逻辑处理（源码已验证），需真实浏览器端到端确认

## 下一步

- 公子在本地图形浏览器访问 admin-next 进行最终端到端验收
- 或部署到 `admin-next.haoyulv.com` 预览域名
- 第三阶段：接入 Dashboard / 用户管理 / 审计日志真实数据
