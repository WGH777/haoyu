# 浩煜部署指南 v0.2.4

> 适用版本：v0.2.3+  
> 最后更新：2026-06-03

---

## 架构总览

```
Cloudflare（CDN / Proxy）
       │
       ▼
  Hetzner VPS (Debian 12)
       │
  ┌────┴──────────────────────────┐
  │  Docker: nginx:alpine (nginx) │  ← 反向代理 + TLS 终止
  │  Volume: /home/web/ → /var/www/html/
  │  Config: /home/web/conf.d/ → /etc/nginx/conf.d/
  │  Port: 80 + 443 (host → container)
  └────┬──────────────────────────┘
       │
  ┌────┴────┐   ┌────────────┐   ┌──────────────┐
  │  www    │   │ admin-next │   │  backend     │
  │  SPA    │   │  SPA       │   │  NestJS PM2  │
  │  静态   │   │  静态      │   │  :3000       │
  └─────────┘   └────────────┘   └──────────────┘
```

---

## 一、www 主站

| 项目 | 值 |
|------|-----|
| 源码 | `/opt/haoyu/apps/frontend` |
| 构建命令 | `cd /opt/haoyu/apps/frontend && npm run build` |
| 宿主部署目录 | `/home/web/html/haoyu/` |
| 容器内路径 | `/var/www/html/haoyu/` |
| 部署脚本 | `/opt/haoyu/deploy-frontend.sh` |
| Nginx 静态缓存 | `/assets/` → `expires 30d` + `public, immutable` |
| SPA 回退 | `/index.html`（`try_files $uri $uri/ /index.html`） |

### 标准部署流程

```bash
# 1. 拉取最新代码
cd /opt/haoyu && git pull

# 2. 构建 + 部署（全自动）
bash deploy-frontend.sh

# 或手动
cd /opt/haoyu/apps/frontend
npm run build
rsync -a --delete dist/ /home/web/html/haoyu/
docker exec nginx nginx -s reload
```

### 缓存策略

- `/assets/*`（JS/CSS chunks）→ 30 天强缓存（hash 文件名自动失效）
- `/index.html` → 不缓存（`no-cache, no-store, must-revalidate`）
- 每次构建生成新 hash 文件名，旧文件不会被引用

---

## 二、admin-next 后台

| 项目 | 值 |
|------|-----|
| 源码 | `/opt/haoyu/apps/admin-next` |
| 构建命令 | `cd /opt/haoyu/apps/admin-next && pnpm build` |
| 宿主部署目录 | `/home/web/html/haoyu-admin-next/` |
| 容器内路径 | `/var/www/html/haoyu-admin-next/` |
| 部署脚本 | **暂无自动化脚本，需手动部署** |
| Nginx 缓存 | `/static/*` → `no-cache, must-revalidate`（迭代期不走缓存） |
| SPA 回退 | `/index.html` |
| 旧版入口 | `/old-admin/` → 指向 `/var/www/html/haoyu-admin/`（v0.2.3 前版本） |

### 标准部署流程

```bash
# 1. 拉取最新代码
cd /opt/haoyu && git pull

# 2. 构建
cd apps/admin-next
HUSKY=0 pnpm install --ignore-scripts   # 跳过 husky 钩子
npx vite build                           # 或 pnpm build

# 3. 部署到宿主目录
rm -rf /home/web/html/haoyu-admin-next/*
cp -a dist/. /home/web/html/haoyu-admin-next/

# 或快捷方式（保持原 dist/ 结构不变）：
cp -a dist/. /home/web/html/haoyu-admin-next/

# 4. 重载 nginx
docker exec nginx nginx -s reload
```

### 缓存说明

admin-next 当前处于功能迭代期，`/static/*` 不设强缓存。进入稳定期后可改为：

```
location /static/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 三、backend 后端

| 项目 | 值 |
|------|-----|
| 源码 | `/opt/haoyu/apps/backend` |
| 构建命令 | `cd /opt/haoyu/apps/backend && npm run build` |
| 构建产物 | `/opt/haoyu/apps/backend/dist/main.js` |
| 进程管理 | **PM2**：`haoyu-backend` |
| 运行端口 | `127.0.0.1:3000` |
| 健康检查 | `GET /api/health` → `{"status":"ok","timestamp":...,"time":"..."}` |
| 日志路径 | `/root/.pm2/logs/haoyu-backend-out.log` |
| 错误日志 | `/root/.pm2/logs/haoyu-backend-error.log` |

### PM2 管理命令

```bash
# 查看状态
pm2 list
pm2 show haoyu-backend

# 重启
pm2 restart haoyu-backend

# 重新加载（零停机，需 PM2 集群模式）
# pm2 reload haoyu-backend

# 查看日志
pm2 logs haoyu-backend
pm2 logs haoyu-backend --lines 50 --nostream

# 保存进程列表（重启后自动恢复）
pm2 save

# 检查 startup 状态
pm2 startup
```

### 标准部署流程

```bash
# 1. 构建
cd /opt/haoyu/apps/backend
npm run build

# 2. 重启 PM2
pm2 restart haoyu-backend

# 3. 验证
curl -s http://127.0.0.1:3000/api/health
```

### 启动持久化

PM2 已配置 systemd startup（`pm2 startup`），服务器重启后自动恢复。

```
PM2 Init System: systemd
Dump file: /root/.pm2/dump.pm2
```

---

## 四、Nginx 反向代理

### 容器状态

```bash
docker ps --filter name=nginx
# CONTAINER ID   NAMES   IMAGE           STATUS
# b8e11e71d1b5   nginx   nginx:alpine    Up 30 hours
```

### 卷映射

| 宿主路径 | 容器路径 | 权限 |
|---------|---------|------|
| `/home/web/conf.d` | `/etc/nginx/conf.d` | ro |
| `/home/web/html` | `/var/www/html` | ro |
| `/home/web/log/nginx` | `/var/log/nginx` | rw |
| `/home/web/certs` | `/etc/nginx/certs` | ro |
| `/home/web/nginx.conf` | `/etc/nginx/nginx.conf` | ro |

### 配置检查与重载

```bash
# 检查语法
docker exec nginx nginx -t

# 重载
docker exec nginx nginx -s reload
```

### 网站配置

| 域名 | 配置文件 | root 路径 |
|------|---------|-----------|
| `www.haoyulv.com` | `haoyu.conf` | `/var/www/html/haoyu` |
| `admin.haoyulv.com` | `haoyu-admin.conf` | `/var/www/html/haoyu-admin-next` |
| `mpt.haoyulv.com` | `mpt-haoyu.conf` | 反代 :8501 |

### /api 反代

所有域名下 `location /api/` 统一反代到 `http://127.0.0.1:3000/api/`。  
如有新域名添加，需同步此配置。

### 安全头

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=()
```

---

## 五、回滚指南

### 前端回滚

```bash
# 方式一：tag 回滚（推荐）
cd /opt/haoyu
git checkout tags/v0.2.2-trial -- apps/frontend/
cd apps/frontend && npm run build
rsync -a --delete dist/ /home/web/html/haoyu/
docker exec nginx nginx -s reload

# 方式二：恢复上次部署（如有备份）
cp -a /home/web/html/haoyu.bak.20260603 /home/web/html/haoyu
docker exec nginx nginx -s reload
```

### Admin-next 回滚

```bash
cd /opt/haoyu
git checkout tags/v0.2.2-trial -- apps/admin-next/
cd apps/admin-next && pnpm build
cp -a dist/. /home/web/html/haoyu-admin-next/
docker exec nginx nginx -s reload
```

### 后端回滚

```bash
cd /opt/haoyu
git checkout tags/v0.2.2-trial -- apps/backend/
cd apps/backend && npm run build
pm2 restart haoyu-backend
```

**注意**：回滚后检查 `git status` 确认文件状态，如需恢复 HEAD 执行 `git checkout feature/admin-next-pure`。

---

## 六、常见故障排查

### 502 Bad Gateway

```
可能原因：
1. PM2 进程挂了 → pm2 list 检查，pm2 restart haoyu-backend
2. 后端 3000 端口不通 → curl http://127.0.0.1:3000/api/health
3. nginx 到后端连接超时 → docker exec nginx nginx -t 检查配置
```

### 静态资源加载旧 chunk

```
现象：页面显示旧功能，控制台无 404，但逻辑不对
原因：Cloudflare 代理模式下 HTML 被缓存
解决：
  1. 确认 CF 面板 → Caching → Purge Everything
  2. 如无 CF API，等待 TTL 自动过期（通常 0-30 分钟）
  3. 加版本参数访问：https://www.haoyulv.com/?v=$(date +%s)
```

### PM2 进程丢失（重启后）

```bash
# 检查 PM2 状态
pm2 list
pm2 resurrect    # 从 dump 恢复

# 如果未保存过
pm2 start /opt/haoyu/apps/backend/dist/main.js --name haoyu-backend
pm2 save
pm2 startup
```

### 部署到旧路径

```
现象：更新了前端代码但页面未变化
原因：部署到了 /home/web/html/haoyu/ 但 nginx 容器 read-only 装载
      /home/web/html/（ro = read only！）

重要：nginx 容器以 ro 模式装载 /home/web/html/。
部署前端时直接写入宿主 /home/web/html/ 即可，
不需要 docker cp 或 exec 操作。

部署后执行 docker exec nginx nginx -s reload
```
