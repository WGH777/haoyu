# Admin Next Pure — 第二阶段：真实登录 API 对接报告

> 生成时间：2026-06-02 08:20 UTC  
> 分支：feature/admin-next-pure  
> Commit：d0c0e5f

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

由于无本地图形浏览器，通过 curl 链式验证：

```
1. Vite dev server proxy → /api/auth/login → 后端 127.0.0.1:3000
   ✅ 返回 200 + { user, accessToken, refreshToken }
   ✅ role: SUPER_ADMIN, status: ACTIVE

2. 错误密码测试
   ✅ 返回 401 { message: "账号或密码错误" }

3. Bearer token 调用受保护接口
   ✅ GET /api/user/profile → 200, 返回用户数据含 wallet
   ✅ GET /api → 200, "Hello World!"
```

## 构建结果

```
✓ built in 10.30s
打包大小: 2.22 MB
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
2. 未测试真实浏览器登录流程（无 GUI 环境）
3. logout 时未调用后端 `/api/auth/logout` 接口
4. USER 角色被拒后的错误提示待优化（当前仅 message 弹窗）

## 下一步

- 第三阶段：接入 Dashboard / 用户管理 / 审计日志真实数据
- 或先部署到 `admin-next.haoyulv.com` 预览域名做真实浏览器验证
