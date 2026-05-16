# 浩煜 — 生产部署说明
# 环境：Debian 12 + Nginx/Caddy + Node.js

---

## 系统要求

- Debian 12 x86_64
- Node.js >= 20
- npm >= 10
- Nginx 或 Caddy
- pm2（全局安装）

---

## 一、依赖安装

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs nginx

# pm2
npm install -g pm2

# Caddy（可选，替代 Nginx，自动 HTTPS）
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy
```

---

## 二、环境变量

### 前端（apps/frontend/.env）
```bash
cp apps/frontend/.env.example apps/frontend/.env
# 默认 VITE_API_BASE=/api 即可
```

### 后端（apps/backend/.env）
```bash
cp apps/backend/.env.example apps/backend/.env
# 必填：
JWT_SECRET=<openssl rand -hex 32>
REFRESH_TOKEN_SECRET=<openssl rand -hex 32>
SUPER_ADMIN_EMAIL=admin@haoyulv.com
SUPER_ADMIN_PASSWORD=<强密码>
```

---

## 三、构建与运行

```bash
cd apps/backend && npm install && npx prisma generate && npx prisma db push && npm run build
cd ../frontend && npm install && npx vite build
cp -r dist/* /var/www/haoyu/
```

---

## 四、反代（二选一）

### Nginx（仓库含 nginx.haoyu.conf）
```bash
cp nginx.haoyu.conf /etc/nginx/sites-available/haoyu
ln -sf /etc/nginx/sites-available/haoyu /etc/nginx/sites-enabled/haoyu
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### Caddy（仓库含 deploy/caddy/Caddyfile.example，自动 HTTPS）
```bash
cp deploy/caddy/Caddyfile.example /etc/caddy/Caddyfile
systemctl reload caddy
```

---

## 五、pm2 保活

```bash
cd apps/backend
pm2 start dist/main.js --name haoyu-backend
pm2 save && pm2 startup
```

---

## 六、数据库备份

```bash
mkdir -p /var/backups/haoyu
cp apps/backend/prisma/dev.db /var/backups/haoyu/dev-$(date +%F-%H%M).db
```

---

## 七、日常维护

```bash
pm2 logs haoyu-backend     # 日志
pm2 restart haoyu-backend  # 重启后端
./deploy-frontend.sh       # 重新构建+部署前端
systemctl reload nginx     # 重载反代
```

---

## 八、上线检查清单

- [ ] 前端可访问 www.haoyulv.com
- [ ] API `/api/docs` Swagger 正常
- [ ] 注册/登录/发布/接单 全流程可用
- [ ] 后端监听 127.0.0.1:3000
- [ ] 防火墙仅 22/80/443
- [ ] `.env` 未提交 GitHub
- [ ] JWT_SECRET 已替换为强随机值
- [ ] 数据库已备份
- [ ] pm2 开机自启
- [ ] 日志不含真实密钥
