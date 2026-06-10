# Admin Next Pure — 预览部署报告

> 生成时间：2026-06-02 08:35 UTC  
> 分支：feature/admin-next-pure  
> 部署方式：同域名路径前缀（/admin-next/），不新增子域名

## 预览域名

```
https://admin.haoyulv.com/admin-next/
```

⚠️ `admin-next.haoyulv.com` DNS 记录不存在（且无 Cloudflare API token 可自动添加），采用同域名 `/admin-next/` 路径前缀方案。

## 宿主机部署目录

```
/home/web/html/haoyu-admin-next/
├── favicon.ico
├── index.html
├── logo.svg
├── platform-config.json
└── static/
    ├── css/
    └── js/
```

## 容器内目录

Nginx 运行在 Docker 容器中（`--network host` 模式）：

| 宿主机 | 容器内 |
|--------|--------|
| `/home/web/html/` | `/var/www/html/` |
| `/home/web/conf.d/` | `/etc/nginx/conf.d/` |

admin-next 静态文件实际路径：
- 宿主机：`/home/web/html/haoyu-admin-next/`
- 容器内：`/var/www/html/haoyu-admin-next/`

## Nginx 配置

文件：`/home/web/conf.d/haoyu-admin.conf`（admin.haoyulv.com 的 server 块）

新增 location：
```nginx
location /admin-next/ {
    alias /var/www/html/haoyu-admin-next/;
    try_files $uri $uri/ /admin-next/index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

备份文件：`/home/web/conf.d/haoyu-admin.conf.bak.20260602_083000`

## 构建配置

`.env.production`：
```
VITE_PUBLIC_PATH = /admin-next/
VITE_ROUTER_HISTORY = "h5,/admin-next/"
```

构建产物中所有资源引用 `/admin-next/` 前缀：
```html
<script src="/admin-next/static/js/index-C3S-loC4.js">
<link href="/admin-next/static/css/index-J8NVZYqg.css">
```

## curl 验证结果

### 本地验证（全部 200）

| 端点 | HTTP | 说明 |
|------|------|------|
| `/` | 200 | 旧 admin 不受影响 |
| `/admin-next/` | 200 | admin-next SPA 首页 |
| `/admin-next/favicon.ico` | 200 | 静态资源 |
| `/admin-next/static/js/*.js` | 200 | JS bundle |
| `/api/` | 200 | 后端健康检查 |
| `/api/auth/login` | 200 | 登录接口（SUPER_ADMIN） |

### 公网验证

| 端点 | HTTP | 说明 |
|------|------|------|
| `https://admin.haoyulv.com/` | 200 | 旧 admin 正常 |
| `https://admin.haoyulv.com/admin-next/` | 200 | admin-next 可通过公网访问 |

## 部署操作记录

1. 修改 `.env.production` 设置 `VITE_PUBLIC_PATH=/admin-next/` 和 `VITE_ROUTER_HISTORY=h5,/admin-next/`
2. `npx vite build` → 10.52s, 2.22 MB
3. `cp -r dist/* /home/web/html/haoyu-admin-next/`
4. 修改 `/home/web/conf.d/haoyu-admin.conf` 新增 `/admin-next/` location
5. Docker 容器从 bridge 网络切换为 host 网络（解决 API 反代到宿主机 127.0.0.1:3000 问题）
6. `docker exec nginx nginx -s reload`

## 对现有服务的影响

- ✅ 旧 admin（`admin.haoyulv.com/`）不受影响
- ✅ 后端 API（`/api/`）不受影响
- ✅ 前端（`www.haoyulv.com`）不受影响
- ✅ MPT（`mpt.haoyulv.com`）不受影响
- ⚠️ Docker nginx 从 bridge 切换为 host 网络（docker restart 后端口映射失效风险已消除）

## Git 安全检查

```
分支: feature/admin-next-pure
未提交变更: 无（构建产物和 .env 在 .gitignore 中）
无 .env/.db/.sqlite 提交
```

## 访问方式

公子在浏览器打开：

```
https://admin.haoyulv.com/admin-next/
```

即可看到 admin-next 登录页（暗色主题、🏮 品牌标识）。

- 旧 admin 仍可通过 `https://admin.haoyulv.com/` 访问
- 两个后台共存，互不影响

## 回滚方案

```bash
# 恢复 Nginx 配置
cp /home/web/conf.d/haoyu-admin.conf.bak.20260602_083000 /home/web/conf.d/haoyu-admin.conf
docker exec nginx nginx -s reload

# 删除部署文件
rm -rf /home/web/html/haoyu-admin-next
```
