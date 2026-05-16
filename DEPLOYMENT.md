# 浩煜 — 生产部署说明
# 环境：Debian 12 + Nginx + Node.js (pm2)

---

## 系统要求

- Debian 12 x86_64
- Node.js >= 20
- npm >= 10
- Nginx >= 1.22
- pm2 (全局安装)

---

## 一、依赖安装

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs nginx

# pm2（进程保活）
npm install -g pm2
```

---

## 二、环境变量配置

### 前端（apps/frontend/.env）

```bash
cp apps/frontend/.env.example apps/frontend/.env
# 编辑 .env，至少设置：
VITE_API_BASE=/api    # 默认同域，无需修改
```

### 后端（apps/backend/.env）

```bash
cp apps/backend/.env.example apps/backend/.env
# 编辑 .env，至少设置：
JWT_SECRET=<生成一个随机字符串>
DATABASE_URL="file:./prisma/dev.db"
CORS_ORIGIN=http://www.haoyulv.com,https://www.haoyulv.com,http://localhost:5173
SUPER_ADMIN_EMAIL=admin@haoyulv.com
SUPER_ADMIN_PASSWORD=<强密码>
```

---

## 三、构建与运行

```bash
# 1. 安装依赖
cd apps/backend && npm install
cd ../frontend && npm install

# 2. 数据库初始化
cd ../backend
npx prisma generate
npx prisma db push

# 3. 创建管理员
npx ts-node prisma/seed.ts

# 4. 构建前端
cd ../frontend
npx vite build

# 5. 部署前端到 Nginx 目录
cp -r dist/* /var/www/haoyu/
```

---

## 四、Nginx 配置

配置已包含在仓库：`nginx.haoyu.conf`

```bash
# 复制配置并启用
cp nginx.haoyu.conf /etc/nginx/sites-available/haoyu
ln -sf /etc/nginx/sites-available/haoyu /etc/nginx/sites-enabled/haoyu
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## 五、pm2 保活

```bash
# 启动后端
cd apps/backend
pm2 start dist/main.js --name haoyu-backend
pm2 save

# 开机自启
pm2 startup
```

---

## 六、日常维护

```bash
pm2 logs haoyu-backend     # 查看日志
pm2 restart haoyu-backend  # 重启后端
./deploy-frontend.sh       # 重新构建+部署前端
systemctl reload nginx     # Nginx 配置变更后重载
```

---

## 七、目录结构

```
/var/www/haoyu/          ← 前端静态文件（Nginx root）
/etc/nginx/sites-available/haoyu  ← Nginx 配置
~/.pm2/                  ← pm2 进程管理
apps/backend/prisma/dev.db  ← SQLite 数据库
apps/backend/uploads/    ← 用户上传文件
```
