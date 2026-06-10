# 管理后台登录失败、限流与 fail2ban 防护设计

**版本**: v0.2.5 P0-3  
**状态**: 设计阶段（未执行）  
**设计时间**: 2026-06-05  
**目标系统**: `admin.haoyulv.com`

---

## 1. 当前登录失败日志来源

### 1.1 后端登录流程（当前）

```
POST /api/auth/login
  → AuthController.signIn(dto: LoginDto)
  → AuthService.signIn(email, password)
  → Prisma: findUnique({ where: { email } })
  → bcrypt.compare()
  → 成功: 返回 tokens
  → 失败: throw new UnauthorizedException('账号或密码错误')
```

### 1.2 当前日志输出

| 事件 | 日志类型 | 日志内容 | 有无审计记录 |
|------|---------|---------|:----------:|
| 登录成功 | 无显式日志 | — | ❌ 无 |
| 登录失败（用户不存在） | `console.error` | NestJS 异常栈，含 401 | ❌ 无 |
| 登录失败（密码错误） | `console.error` | NestJS 异常栈，含 401 | ❌ 无 |
| 登录失败（账号封禁） | `console.error` | NestJS 异常栈，含 401 | ❌ 无 |

**结论**: 当前唯一可追溯登录失败的方式是 **PM2 error.log** 中的异常栈。无结构化、无上下文（IP、UA）、无持久化。

### 1.3 Nginx 日志

Docker nginx access log 中包含所有 `/api/auth/login` 请求（包括失败），但：

```
access.log: POST /api/auth/login 401
```

- Nginx 看到的是 401，但**无法区分是密码错误还是 CSRF 或 token 校验失败**
- 无法区分是 API 正常 401（如未认证的 `/api/` 调用）还是登录失败的 401
- Nginx access log 在容器内（`/var/log/nginx/`），宿主机不直接读取

---

## 2. admin.haoyulv.com 登录入口风险

### 外部暴露面

```
Cloudflare (proxy)
  └─ Docker nginx:80/443 (network=host)
       └─ /api/auth/login → backend :3000 (POST)
```

### 风险矩阵

| 风险 | 等级 | 说明 |
|------|:----:|------|
| 暴力破解密码 | 🔴 **高** | 无失败次数限制，无 IP 封禁 |
| 撞库测试（email 枚举） | 🟡 中 | 失败返回相同消息"账号或密码错误"（已防御枚举） |
| 持续请求消耗资源 | 🟡 中 | 每次 bcrypt.compare 约 10ms CPU，高并发可压测 |
| Token 绕过 | 🟢 低 | JWT 签名完整，refreshToken 一次性轮换 |
| 应用层 DDoS | 🟡 中 | /api/auth/login 是公开端点，无请求频率限制 |

### 当前无保护的点

- 无 IP 级失败计数
- 无 email 级失败计数
- 无全局请求频率限制
- 无 fail2ban 规则
- 无审计日志记录登录失败
- 无告警机制

---

## 3. 是否需要 NestJS 层限流

**需要。优先级最高。**

### 理由

1. `@nestjs/throttler@^6.5.0` **已在依赖中** — 无需新增包
2. 后端可精确判断「是否登录失败」（Nginx 无法区分登录 401 和 API 401）
3. 后端可拿到 `X-Real-IP`（Nginx 透传），方便 IP 级限流
4. 与状态无关 — 不修改数据库，不修改 Wallet/LedgerEntry

### 推荐方案：自定义 `LoginThrottleGuard`

不直接使用 `@nestjs/throttler` 内置全局守卫，而是创建**专门针对登录端点的自定义守卫**，理由：

- 全局 throttler 会误伤 `/api/health` 等低频但合规的端点
- 登录限流策略更复杂：需要同时考虑 IP 和 email
- 全局 throttler 适合通用 API 限流，登录需要独立配置

#### 守卫设计

```
LoginThrottleGuard：
  - 只应用于 POST /api/auth/login
  - 基于内存 Map<IP, LoginAttempt[]> 记录
  - 策略 1：同一 IP 15 分钟内最多 10 次登录请求 → 超限返回 429
  - 策略 2：同一 email 15 分钟内最多 5 次失败 → 超限返回 429（无论 IP）
  - 成功登录后清除该 IP 的失败记录（不是清除重试次数，而是 _失败_ 记录）
```

### 数据流

```
POST /api/auth/login
  ├─ LoginThrottleGuard.canActivate()
  │   ├─ 检查 IP 总请求次数（≥10 → 429）
  │   ├─ 检查 email 失败次数（≥5 → 429）
  │   └─ 通过 → 继续
  ├─ AuthService.signIn()
  │   ├─ 成功 → LoginThrottleGuard.onSuccess() 清除该 IP/email 失败记录
  │   └─ 失败 → LoginThrottleGuard.onFailure() 记录失败
  └─ 返回 200 / 401
```

### 内存策略说明

| 问题 | 方案 |
|------|------|
| 进程重启丢失记录 | 重启后记录自然清零，可接受（相当于解封所有 IP） |
| 多进程场景（PM2 cluster） | 当前 PM2 使用 fork 模式（单进程），无此问题 |
| 内存泄漏 | 使用 `node-cron` 或守卫内部定时清理超过 15 分钟的记录 |
| IP 来源 | 从 `request.headers['x-real-ip'] || request.ip` 获取（Nginx 透传） |

### 配置建议

```
IP 限流：  15 分钟窗口内 ≤ 10 次请求 /api/auth/login
Email 限流：15 分钟窗口内 ≤ 5 次失败
封禁时长：  超过限制后锁定该 IP/email 15 分钟
```

---

## 4. 是否需要 Nginx 层限流

**需要。作为第二层防御。**

### 理由

1. 即使后端限流失效（如进程崩溃、内存溢出），Nginx 层还能兜底
2. Nginx `limit_req_zone` 在 worker 间共享内存，不依赖后端进程
3. 可以限制所有 `/api/` 的请求频率，防止后端过载
4. 可在 Cloudflare 层之前挡住大量请求

### 方案设计

#### 4.1 Nginx 全局限流（Docker nginx 内配置）

```nginx
# 在 /etc/nginx/nginx.conf 的 http 块中定义区域
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=api_global:10m rate=200r/m;
```

#### 4.2 应用到 admin.haoyulv.com.conf

```nginx
location /api/auth/login {
    limit_req zone=login_limit burst=5 nodelay;
    limit_req_status 429;
    proxy_pass http://127.0.0.1:3000/api/auth/login;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/ {
    limit_req zone=api_global burst=50 nodelay;
    # ... 现有 proxy 配置
}
```

#### 4.3 限流策略汇总

| 层级 | 端点 | 速率 | Burst | 备注 |
|------|------|------|-------|------|
| Nginx | `/api/auth/login` | 30 请求/分钟/IP | 5 | 用户手动输入密码的正常频率 |
| Nginx | `/api/` (全) | 200 请求/分钟/IP | 50 | 足够正常前端交互（含轮询、资源加载） |
| NestJS | `/api/auth/login` | 10 请求/15 分钟/IP | — | 后端细粒度，拒绝暴力 |
| NestJS | `/api/auth/login` (email) | 5 次失败/15 分钟 | — | 防止针对单账号的暴力破解 |

### Nginx 限流状态码

- 超过 limit_req → 429 Too Many Requests
- 添加自定义 429 响应页面或 JSON（可选）
- 在 location 中配置：
  ```nginx
  limit_req_status 429;
  ```

---

## 5. 是否需要 fail2ban

**需要。作为第三层防御（可选，建议 v0.2.5 P1 补充）。**

### 理由

1. Docker nginx 限制同 IP 速率，但不能持久封禁
2. fail2ban 可解析 Docker nginx access log，对异常 IP 执行 iptables DROP
3. 封禁时长可配置（默认 1h，暴力攻击可延长到 24h）
4. 服务器已有 fail2ban（当前仅用于 SSH），集成成本低

### 方案设计

#### 5.1 Docker nginx 日志适配

Docker nginx 日志在宿主机 `/home/web/log/nginx/access.log`（卷映射）：

```bash
# 确认日志路径
ls -la /home/web/log/nginx/
```

#### 5.2 fail2ban filter 配置

```ini
# /etc/fail2ban/filter.d/haoyu-admin-login.conf
[Definition]
failregex = ^<HOST> .* "POST /api/auth/login" 429
            ^<HOST> .* "POST /api/auth/login" 4\d\d .*$
ignoreregex =
```

**注意**: 过滤 429（Nginx 限流触发的拒绝）或连续 4xx 状态码

#### 5.3 fail2ban jail 配置

```ini
# /etc/fail2ban/jail.d/haoyu-admin.conf
[haoyu-admin-login]
enabled   = true
port      = http,https
filter    = haoyu-admin-login
logpath   = /home/web/log/nginx/access.log
maxretry  = 3
findtime  = 600    # 10 分钟内
bantime   = 3600   # 封禁 1 小时
```

#### 5.4 fail2ban 告警可选

```
# 可选：封禁时发送 Telegram 通知
action = %(action_mwl)s          # 邮件通知 (如有配置)
       = %(action_)s             # 仅封禁，不通知（推荐初始版本）
```

### 方案对比

| 层级 | 复杂度 | 效果 | 运维成本 |
|------|--------|------|---------|
| A. 仅后端 Guard | 低 | 阻止暴力登录，但 IP 仍可请求 | 低 |
| B. A + Nginx limit_req | 中 | IP 级限速 + 登录失败封禁 | 中 |
| C. B + fail2ban | 中高 | 三层：应用限流 + Nginx 限速 + 系统封禁 | 中高 |

**建议**: Phase 1 实施 A+B（最低可行保护），观察 1 周后评估是否需要 C。

---

## 6. 如何避免误伤正常用户

### 6.1 误伤场景

| 场景 | 可能误伤 | 缓解 |
|------|---------|------|
| 正常用户连续输错密码 | 被限流 15 分钟 | 15 分钟自然恢复，不影响其他 IP |
| 办公网共用一个公网 IP | 同一大楼多人登录 → 累积请求超限 | burst=5 允许短时突发；30r/m 足够正常使用 |
| VPN 节点共享 IP | 多人共享 IP 登录 | 同样 burst 缓解；日志辅助判断 |
| 忘记密码后密集尝试 | 被限流 | 提示"登录次数已超限，请 15 分钟后再试" |
| Cloudflare 代理 IP 固定 | 所有流量从 CF 出口 IP 来，IP 限流指向 CF IP | 必须使用 `$http_cf_connecting_ip` 或 `$http_x_forwarded_for` 作为限流 key |

### 6.2 关键决策：限流 key 选择

```nginx
# Cloudflare 代理模式下，访问者真实 IP 在 CF-Connecting-IP 头中
# 否则 fallback 到 X-Real-IP

# 方案 1: 使用 CF-Connecting-IP（推荐）
map $http_cf_connecting_ip $real_ip {
    default $http_cf_connecting_ip;
    ""      $remote_addr;
}
limit_req_zone $real_ip zone=login_limit:10m rate=30r/m;

# 方案 2: 仅使用 remote_addr（简单但忽略 CF 头）
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=30r/m;
```

**建议使用方案 1**：CF 已启用，必须考虑 CF 代理模式。

### 6.3 错误消息设计

| 场景 | 当前 | 建议 |
|------|------|------|
| 登录被限流 | 无返回（Nginx 直接返回 429） | 返回 JSON：`{"statusCode":429,"error":"TooManyRequests","message":"登录请求过于频繁，请 15 分钟后再试"}` |
| 账号/密码错误 | `账号或密码错误` | 保持不变（已避免枚举） |
| 账号被封禁 | `账号已被封禁，请联系平台管理员` | 保持不变 |

### 6.4 清除策略

```
自动清除:
  - 成功登录后: 清除该 IP 和 email 的失败记录
  - 窗口过期（15 分钟）: 记录自然失效

手动重置（管理员）:
  - 联系用户确认后，重启 PM2 清空内存记录
  - 或使用 API 端点（需 SUPER_ADMIN 权限）
```

---

## 7. 如何记录失败次数

### 7.1 后端守卫记录（内存级）

```typescript
// 方案：自定义 LoginThrottleGuard 内部维护 Map

interface LoginRecord {
  ipAttempts: number;        // 该 IP 总请求数
  emailFailures: Map<string, number>;  // 该 IP 下各 email 失败次数
  firstAttemptAt: number;    // 窗口起始时间戳
  lastAttemptAt: number;     // 最后尝试时间戳
}

// 全局 Map<IP, LoginRecord>
const globalAttemptStore = new Map<string, LoginRecord>();

// 定时清理过期记录（每 60 秒检查一次）
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of globalAttemptStore) {
    if (now - record.lastAttemptAt > 15 * 60 * 1000) {
      globalAttemptStore.delete(ip);
    }
  }
}, 60_000);
```

**不持久化**：内存级记录不写数据库，不写文件，进程重启后自动清零。

### 7.2 Nginx 日志记录

Nginx 自带 access log，通过 `$limit_req_status` 变量可获知请求是否被限流：

```nginx
log_format extended '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time limit=$limit_req_status';
```

### 7.3 审计日志记录（推荐升级，v0.2.5 P1）

当前 `AdminAuditService` 支持记录审计事件。建议扩展：

```typescript
// 在 AuthService.signIn() 失败分支中加入审计记录
// 需要注入 AdminAuditService
// action: 扩展 'LOGIN_FAILED' 类型
```

扩展建议：
- 新增 `AdminAuditAction` 类型：`'LOGIN_FAILED'`
- 记录：`targetType: 'USER'`、`targetId: 用户 ID（如存在）`、`detail: { email, ip, userAgent }`
- **仅登录失败时记录，不记录成功登录**（避免审计日志膨胀）
- 审计日志已有 46 条记录，接入后预期每天增加 5~10 条（正常场景）

---

## 8. 是否需要审计日志记录登录失败

**需要，但不作为 v0.2.5 P0 范围。**

### 理由

| 维度 | 评估 |
|------|------|
| 当前审计日志状态 | 46 条，仅管理员操作日志（CHANGE_USER_ROLE 等） |
| 审计日志目的 | 操作可追溯、安全审计合规 |
| 登录失败审计价值 | 可追溯到谁在什么时间从什么 IP 试图登录 |

### 审计字段设计

```
AdminActionLog:
  action:      'LOGIN_FAILED'
  adminId:     null（登录者还不是管理员）
  targetType:  'USER'
  targetId:    userId（若 email 存在）或 null（若 email 不存在）
  reason:      'password_mismatch' / 'account_not_found' / 'account_suspended'
  detailJson:  { email: "xxx@example.com", ip: "x.x.x.x", userAgent: "..." }
```

注意：`LOGIN_FAILED` 不符合当前 `AdminAuditAction` 类型（`FORCE_CANCEL_TASK` 等），需扩展类型定义。

### 为什么不在 P0 做

| 原因 | 说明 |
|------|------|
| 审计日志需要代码修改 | 扩展类型 + 注入 AdminAuditService + 调用 log() |
| 非阻塞性 | 登录限流本身不需要审计日志即可工作 |
| 可独立部署 | 限流 + 审计是两个独立任务 |

---

## 9. 灰度方案

### Phase 1：仅后端 LoginThrottleGuard（最小可行）

```
Step 1: 实现 LoginThrottleGuard
  - 新建文件 apps/backend/src/auth/guards/login-throttle.guard.ts
  - 内存 Map 记录 IP + email 失败次数
  - 通过 @UseGuards(LoginThrottleGuard) 应用到 AuthController.signIn()
  - 成功登录后清除该 IP/email 记录
  - 返回 429 携带清晰错误消息
  
Step 2: 后端验证
  - 同一 IP 连续请求 /api/auth/login 10 次 → 第 11 次 429
  - 同一 email 连续失败 5 次 → 第 6 次 429
  - 成功登录后恢复正常
```

**不修改**: 不修改数据库、不修改 Wallet/LedgerEntry、不修改状态机

### Phase 2：添加 Nginx limit_req（灰度）

```
Step 1: 编辑 admin.haoyulv.com.conf
  - 在 nginx.conf http 块添加 limit_req_zone
  - 在 /api/auth/login location 添加 limit_req
  
Step 2: 低流量时段重载
  - docker exec nginx nginx -t（语法检查）
  - docker exec nginx nginx -s reload

Step 3: 观察 24 小时
  - 检查 access log 是否有预期 429
  - 确认正常用户登录不受影响
```

### Phase 3：fail2ban 规则（可选，v0.2.5 P1）

```
Step 1: 创建 fail2ban filter
Step 2: 启用 fail2ban jail
Step 3: 观察 48 小时
Step 4: 调整 bantime/findtime
```

### 回退

各层可独立回退：

| 层 | 回退方式 | 影响 |
|---|---------|------|
| 后端 Guard | 删除 `@UseGuards(LoginThrottleGuard)` → 提交 → 部署 | 零影响 |
| Nginx limit_req | 注释 limit_req 行 → nginx -s reload | 零 downtime |
| fail2ban | `fail2ban-client set haoyu-admin-login unbanip <ip>` 或 disable jail | 零影响 |

---

## 10. 回滚方案

### 方案 A：Pinpoint 回滚

```bash
# 后端守卫回滚
git revert <commit_hash> --no-edit
pm2 restart haoyu-backend

# Nginx 层回滚
# 注释 limit_req 行或 git revert nginx 配置 commit
docker exec nginx nginx -s reload

# fail2ban 回滚
fail2ban-client set haoyu-admin-login unbanip <ip>
fail2ban-client reload
```

### 方案 B：紧急回滚（不依赖 git）

```bash
# 后端
pm2 delete haoyu-backend
cd /opt/haoyu/apps/backend
git stash
npm run build
pm2 start dist/main.js --name haoyu-backend

# Nginx - 修改配置后 reload
docker exec nginx sed -i '/limit_req/d' /etc/nginx/conf.d/haoyu-admin.conf
docker exec nginx nginx -s reload

# fail2ban
fail2ban-client stop haoyu-admin-login
```

### 方案 C：最低回滚

```bash
# 什么都不做，429 只影响极端情况
# 15 分钟后窗口自动归零，用户可重新登录
# 这是最安全的方案
```

---

## 附录

### A. 执行计划摘要

| Phase | 范围 | 风险 | 预估工时 | 实施时机 |
|-------|------|:----:|:-------:|---------|
| P0 | 后端 LoginThrottleGuard | 低 | 2h | 用户确认后 |
| P1 | Nginx limit_req 配置 | 低 | 1h | P0 验证后 |
| P2 | 审计日志 `LOGIN_FAILED` 扩展 | 低 | 1h | P1 验证后 |
| P3 (可选) | fail2ban 规则 | 低 | 1h | 评估是否需要 |

### B. 不修改的操作

| 操作 | 原因 |
|------|------|
| ❌ 修改 Wallet / LedgerEntry | 不在本任务范围内 |
| ❌ 修改任务/订单状态机 | 不在本任务范围内 |
| ❌ 修改数据库 schema | 登录限流不持久化，无需迁移 |
| ❌ 新增 npm 依赖 | `@nestjs/throttler` 已在依赖中 |
| ❌ 修改 `/api/health` | 无影响 |
| ❌ 创建 tag | 由发布流程控制 |
| ❌ `git add .` | 精确 add |
| ❌ force push | 不覆盖远端历史 |
| ❌ 轮换现有 JWT_SECRET / 密钥 | 本设计不涉及密钥泄露 |

### C. 相关文件

- `apps/backend/src/auth/auth.controller.ts` — 登录端点（待施加守卫）
- `apps/backend/src/auth/auth.service.ts` — 登录逻辑（不修改）
- `apps/backend/src/auth/guards/jwt-auth.guard.ts` — 参考现有守卫写法
- `apps/backend/src/admin/admin-audit.service.ts` — 审计日志（P2 扩展）
- `/home/web/conf.d/haoyu-admin.conf` — nginx 配置（P1 修改）
- `apps/backend/package.json` — `@nestjs/throttler@^6.5.0` 已存在
