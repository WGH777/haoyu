# Nginx limit_req 登录限流设计复核

**版本**: v0.2.5 P0-7  
**状态**: 设计复核阶段（未执行，未修改配置）  
**复核时间**: 2026-06-05 11:41 UTC  
**前置条件**: 后端 LoginThrottleGuard 已部署（v0.2.5 P0-4/P0-6）

---

## 1. 当前 Nginx 是否运行在 Docker 容器中

**✅ 是。Docker nginx (nginx:alpine)。**

| 属性 | 值 |
|------|-----|
| 容器名 | `nginx` |
| 镜像 | `nginx:alpine` |
| 运行时间 | 3 天 |
| 模式 | network=host（监听宿主机 80/443） |
| 版本 | `1.31.0` |
| 配置挂载 | `/home/web/conf.d/` → `/etc/nginx/conf.d/` (ro) |
| 日志挂载 | `/home/web/log/nginx/` → `/var/log/nginx/` |

**影响**: Nginx 配置修改需编辑宿主机文件 + `docker exec nginx nginx -s reload`。

---

## 2. 当前 www.haoyulv.com / admin.haoyulv.com / /api 反代配置路径

### 配置文件结构

| 域名 | 配置文件 | 宿主机路径 |
|------|---------|-----------|
| `www.haoyulv.com` | `haoyu.conf` | `/home/web/conf.d/haoyu.conf` |
| `admin.haoyulv.com` | `haoyu-admin.conf` | `/home/web/conf.d/haoyu-admin.conf` |
| Nginx 主配置 | `nginx.conf` | `/home/web/nginx.conf` |

### /api 反代配置（两域名共用相同结构）

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;       # ← 当前是 CF 边缘 IP
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**关键发现**: `$remote_addr` 在 Cloudflare 代理模式下得到的是 **CF 边缘节点 IP**，非用户真实 IP。
`CF-Connecting-IP` 头携带真实用户 IP，但当前**没有被传递给后端**。

---

## 3. 是否经过 Cloudflare

**✅ 是。CF 全代理模式（橙色云）启用。**

### 证据

| 检查项 | 结果 |
|--------|------|
| DNS A 记录 | `104.21.30.238`, `172.67.174.47`（均为 CF 任播 IP） |
| 响应头 | `server: cloudflare` |
| 响应头 | `cf-ray: a06ee8d0c8c3dc86-FRA` |
| 响应头 | `cf-cache-status: DYNAMIC` |

### 架构

```
用户浏览器
  ↓ TLS (QUIC / HTTP/2)
Cloudflare 边缘节点 (fra)
  ↓ HTTP/1.1
Docker nginx:80 (host network) → backend :3000
```

---

## 4. 是否能稳定取得 CF-Connecting-IP

**✅ 可以。CF 在代理模式下始终设置 `CF-Connecting-IP` 请求头。**

### 验证方式

Nginx 中通过 `$http_cf_connecting_ip` 变量获取。当 CF 处于代理模式时，此头始终存在，值为访问者的真实 IP。

### 当前配置未利用此头

```nginx
proxy_set_header X-Real-IP $remote_addr;  # 当前是 CF IP
```

`X-Real-IP` 传的是 CF IP（`$remote_addr`），后端 LoginThrottleGuard 无法获取真实用户 IP。

### 建议修复

有两条路径可修复以获取真实 IP：

#### 路径 A：使用 CF-Connecting-IP（推荐，不改 `set_real_ip_from`）

```nginx
# 在 limit_req 限流 key 中使用
$http_cf_connecting_ip

# 同时修复 X-Real-IP，让后端拿到真实 IP
proxy_set_header X-Real-IP $http_cf_connecting_ip;
```

**优点**: 不依赖 CF IP 列表维护，不受 CF IP 变动影响

#### 路径 B：配置 `set_real_ip_from`（更彻底，但需维护 IP 列表）

```nginx
# 在 nginx.conf http 块中
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
# ... 全部 CF IPv4 + IPv6 范围（需定期更新）
real_ip_header CF-Connecting-IP;
```

**问题**: CF 的 IP 范围会变动，需维护列表。适用于高频 CI/CD 自动更新，但对手动维护不友好。

**建议采用路径 A**。

---

## 5. limit_req_zone 应使用 $http_cf_connecting_ip 还是 $binary_remote_addr

**✅ 结论：必须使用 `$http_cf_connecting_ip`。**

### 原因

| Key | 值 | 是否适合 |
|-----|-----|:-------:|
| `$binary_remote_addr` | CF 边缘 IP（如 `104.21.x.x`） | ❌ 全球用户共享几百个 CF 节点 IP，会误伤 |
| `$http_cf_connecting_ip` | 用户真实 IPv4/IPv6 | ✅ 精准到个人 |
| `$http_x_forwarded_for` | 逗号分隔的用户 IP 链 | ❌ 含多个 IP，不直接用作 key |

### 在 nginx.conf http 块中定义

```nginx
http {
    # 使用 CF-Connecting-IP 作为限流 key
    limit_req_zone $http_cf_connecting_ip zone=login_limit:10m rate=30r/m;
    limit_req_zone $http_cf_connecting_ip zone=api_global:10m rate=200r/m;
    ...
}
```

### 注意点

- `$http_cf_connecting_ip` 在 CF 代理模式下始终有值
- 如果直接访问 nginx（绕过 CF），此变量为空。需要提供 fallback
- **fallback 建议**: 创建 map 处理空值 case

```nginx
# 在 http 块中
map $http_cf_connecting_ip $limit_key {
    ""      $binary_remote_addr;
    default $http_cf_connecting_ip;
}
limit_req_zone $limit_key zone=login_limit:10m rate=30r/m;
```

---

## 6. /api/auth/login 建议限流值

### 建议配置

| 参数 | 建议值 | 理由 |
|------|:------:|------|
| `rate` | `30r/m` | 每分钟 30 次 = 每 2 秒 1 次。手动输入密码的正常频率远低于此 |
| `burst` | `5` | 允许短时突发（如用户连输 5 次错误密码再重新输入） |
| `nodelay` | ✅ 开启 | 避免排队延迟影响正常请求 |
| `zone size` | `10m` | 可记录约 16 万 IP 指纹，远超出线用户数 |

### 与后端 LoginThrottleGuard 对比

| 层级 | 限流粒度 | 限流值 | 触发方式 |
|------|---------|:------:|---------|
| Nginx `limit_req` | IP | 30r/m (0.5r/s) | 每分钟 30 次请求即触发 |
| 后端 `LoginThrottleGuard` IP | IP | 10 次/15min | 15 分钟内 10 次登录请求 |
| 后端 `LoginThrottleGuard` Email | Email | 5 次失败/15min | 15 分钟内 5 次失败 |

**注意**: Nginx 层以请求速率限流（r/m），后端以窗口计数限流（15min/10）。两者角度不同，Nginx 层更宽松，不冲突。

### 配置示例（admin.haoyulv.com.conf）

```nginx
server {
    location /api/auth/login {
        limit_req zone=login_limit burst=5 nodelay;
        limit_req_status 429;
        
        proxy_pass http://127.0.0.1:3000/api/auth/login;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;  # 修正为真实 IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 为什么 30r/m 而不是 10r/m？

后端已经做了 10 次/15min 的单位时间限流，Nginx 层如果设成同样的值会导致：
- 后端 10 次和 Nginx 30r/m 的关系：15 分钟内最多 450 次 Nginx 请求 → 后端 10 次才是真正的瓶颈
- Nginx 层 30r/m 只挡 2-5 秒内连续 30+ 请求的自动化脚本
- 30r/m ≈ 500ms per request，真人手输不可能超过

---

## 7. /api 全局限流是否必要

**建议分阶段实施。**

### 全局限流方案

```nginx
limit_req_zone $http_cf_connecting_ip zone=api_global:10m rate=200r/m;

location /api/ {
    limit_req zone=api_global burst=50 nodelay;
    ...
}
```

### 争议点

| 角度 | 结论 | 理由 |
|------|:----:|------|
| 当前是否有 DDoS 迹象 | ❌ 否 | 无异常流量记录 |
| 全局限流是否会误伤 | ⚠️ 可能 | 前端 SPA 频繁刷新时可能 200+ 请求 |
| 是否增加运维复杂度 | ✅ 是 | 多一层参数调优 |
| 后端已经在处理 | ✅ 是 | 请求到达后端后，PM2 自身有 worker 限制 |

### 建议

**本阶段不上 `/api` 全局限流。** 理由：

1. 后端 `LoginThrottleGuard` + Nginx `/api/auth/login` 限流已覆盖登录攻击场景
2. 全局限流误伤排查成本高（用户报"页面加载失败"可能是 429）
3. 留到后续阶段，根据实际流量模式再决定

---

## 8. 如何避免误伤正常用户

### 风险场景

| 场景 | 风险 | 缓解 |
|------|:----:|------|
| 浏览器自动重试 429 页面 | ⚠️ 中 | `limit_req_status 429`，浏览器重试时触发 Nginx 429（正常行为） |
| 前端 API 轮询 | ⚠️ 低 | `/api/` 全局限流已推迟；`/api/auth/login` 无需轮询 |
| CDN 回源请求 | 🟢 低 | `limit_req_zone` 使用 `$http_cf_connecting_ip`，CF 代理回源时此头存在 |
| 用户 VPN/代理共享 IP | ⚠️ 中 | `$http_cf_connecting_ip` 是 VPN 出口 IP，30 人/分钟 VPN 共享 → 可能误伤 |
| 忘记密码后的快速尝试 | ⚠️ 中 | burst=5 允许 5 次/秒突发；5 次后 Nginx 限流（比后端 5 次 email 失败更宽松） |

### 多重缓解

| 缓解措施 | 效果 |
|---------|------|
| `burst=5` 允许短时突发 | 避免 1-2 秒内的密集请求直接返回 429 |
| `nodelay` 避免排队等待 | 超限立即返回 429，不累积排队压力 |
| `30r/m` 宽松速率 | 真人用户没有可能达到这个速率 |
| `$http_cf_connecting_ip` 精确到个人 | 避免 CF 节点 IP 误伤 |
| 后端 10 次/15min 邮箱级限流是真正的瓶颈 | Nginx 30r/m 只挡自动化脚本 |
| 成功登录后后端 clearIp | 后端解封不影响 Nginx 层（15 分钟窗口自动过期） |

---

## 9. 如何记录 $limit_req_status

### 方案：在访问日志中记录限流状态

Nginx 提供了 `$limit_req_status` 变量，取值：
- `PASS` — 请求通过
- `DELAY` — 请求排队等待
- `REJECT` — 请求被拒绝（429）

### 修改 log_format

```nginx
log_format extended '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'limit=$limit_req_status real_ip=$http_cf_connecting_ip';
access_log /var/log/nginx/access.log extended buffer=512k flush=10s;
```

**注意**: 修改 `log_format` 会影响全局日志格式。建议仅在 phase 1 中保持现有 `main` format 不变，观察 24h 后按需调整。

### 分析限流事件

```bash
# 查询被 Nginx 限流的登录请求
grep "limit=REJECT" /home/web/log/nginx/access.log | grep "/api/auth/login" | cut -d' ' -f1 | sort | uniq -c | sort -rn

# 查看被限流的 IP 汇总
grep "limit=REJECT" /home/web/log/nginx/access.log | grep -oP 'real_ip=\S+' | sort | uniq -c | sort -rn
```

---

## 10. reload 失败回滚方案

### Nginx 配置修改流程

```
编辑 /home/web/conf.d/haoyu-admin.conf
  ↓
docker exec nginx nginx -t      ← 语法检查
  ↓ (通过)
docker exec nginx nginx -s reload  ← 热重载
```

### 回滚方案

| 场景 | 操作 | 影响 |
|------|------|------|
| `nginx -t` 语法错误 | 不会写入容器（ro 挂载），配置文件未生效 | 零影响，只需修正语法 |
| `nginx -s reload` 失败 | nginx 使用旧配置继续运行 | 零影响 |
| Nginx 限流误伤太多 | 注释 `limit_req` 行 → `nginx -t` → `nginx -s reload` | 约 1 秒恢复 |
| 需要紧急恢复 | `mv /home/web/conf.d/haoyu-admin.conf.bak /home/web/conf.d/haoyu-admin.conf && docker exec nginx nginx -s reload` | 全量回退 |

### 生产建议

```bash
# 修改前备份
cp /home/web/conf.d/haoyu-admin.conf /home/web/conf.d/haoyu-admin.conf.bak

# 修改 + 检查 + reload
nano /home/web/conf.d/haoyu-admin.conf   # 添加 limit_req 块
docker exec nginx nginx -t               # 语法检查
docker exec nginx nginx -s reload        # 热重载

# 如果出问题，一键回退
cp /home/web/conf.d/haoyu-admin.conf.bak /home/web/conf.d/haoyu-admin.conf
docker exec nginx nginx -t && docker exec nginx nginx -s reload
```

---

## 11. 与后端 LoginThrottleGuard 的叠加风险

### 风险矩阵

| 风险 | 等级 | 说明 | 缓解 |
|------|:----:|------|------|
| 429 叠加：Nginx 429 后用户不知后端限流状态 | 🟢 低 | 返回相同 message，用户无感知差异 | 由 Nginx 只挡「比后端严格」的场景 |
| 429 格式不一致 | 🟢 低 | Nginx 默认 429 返回 HTML | 需自定义 429 JSON 响应 |
| CF-Connecting-IP 注入 | 🟡 中 | 攻击者可能伪造此头 | Nginx 只信任 CF（需 set_real_ip_from）或在 map 中验证 |
| 双 IP 来源不一致 | 🟡 中 | Nginx 用 `$http_cf_connecting_ip`，后端用 `x-real-ip` | 需统一：修正 `proxy_set_header X-Real-IP $http_cf_connecting_ip` |
| 限流值不协调 | 🟢 低 | Nginx 30r/m 比后端宽松 | 后端先触达，Nginx 兜底 |
| PM2 重启后后端清零，Nginx 仍计数 | 🟢 低 | Nginx 共享内存区独立，不会受 PM2 影响 | 无副作用 |

### 关键建议：统一 IP 来源

当前后端 `LoginThrottleGuard` 从 `x-real-ip` 头获取 IP，而该头当前为 CF 边缘 IP。建议在 Nginx phase 同步修正：

```nginx
proxy_set_header X-Real-IP $http_cf_connecting_ip;
```

这样后端也能拿到真实用户 IP，不依赖 CF 头回退逻辑。

---

## 12. 是否建议本阶段只上 /api/auth/login，不上 /api 全局限流

**✅ 强烈建议只上 `/api/auth/login` 限流。**

### 理由

| 维度 | `/api/auth/login` 限流 | `/api/` 全局限流 |
|------|:---------------------:|:----------------:|
| **匹配攻击面** | 登录是唯一公开不认证的端点 | 其他端点已有 JWT 保护 |
| **误伤概率** | 低（用户不频繁登录） | 中（SPA 请求多） |
| **排查难度** | 低（直指登录问题） | 高（用户报"页面加载失败"） |
| **后端已有保护** | ✅ LoginThrottleGuard | ✅ JWT 保护 |
| **实施风险** | 低 | 中 |
| **调试复杂度** | 低 | 中（需区分是哪个 API 被限） |

### 推荐执行顺序

```
Phase 1: /api/auth/login limit_req (本阶段)
  → 观察 48 小时，确保无异常
Phase 2 (后续): 评估是否上 /api 全局限流
  → 根据实际流量和错误率决定
```

---

## 综合建议

### 实施前准备（本设计阶段确认）

- [x] `limit_req` 模块内置可用（nginx built-in，无需额外编译）
- [x] `$http_cf_connecting_ip` 是合适的限流 key
- [x] 需要 fallback map 处理非 CF 直接访问场景
- [x] 修正 `X-Real-IP` 传递真实 IP 到后端
- [x] 本阶段只上 `/api/auth/login`，不上全局限流
- [x] 回滚方案明确

### 估算配置变更

| 修改文件 | 修改内容 |
|---------|---------|
| `/home/web/nginx.conf` | 在 `http` 块添加 `map` + `limit_req_zone` |
| `/home/web/conf.d/haoyu-admin.conf` | 在 `location /api/auth/login` 添加 `limit_req`（admin 域名） |
| `/home/web/conf.d/haoyu.conf` | 在 `location /api/auth/login` 添加 `limit_req`（www 域名） |
| 两域名 | 修正 `proxy_set_header X-Real-IP $http_cf_connecting_ip` |

### 不修改的操作

- ❌ 不修改后端代码
- ❌ 不修改数据库
- ❌ 不创建 tag
- ❌ 不 force push
- ❌ 不修改 fail2ban
- ❌ 不上 `/api` 全局限流

### 参考

- 后端设计文档: `docs/security/admin-login-rate-limit-design-v0.2.5.md`
- 后端验收报告: `docs/openclaw-reports/v0.2.5-login-throttle-backend-acceptance.md`
