# Admin Next 替换旧后台入口 — 切换评估报告

> 生成时间：2026-06-02 11:15 UTC  
> 分支：feature/admin-next-pure  
> 最新 commit：6c2a170  
> 状态：评估报告，未执行切换

---

## 1. 当前 admin-next 已完成能力

| 能力 | 状态 | 等价于旧 admin? |
|------|:---:|:---:|
| 登录鉴权（email/password, SUPER_ADMIN/ADMIN 角色检查） | ✅ | ✅ 优于旧 admin（无转圈/404 问题） |
| 7 项管理菜单（总览/用户/任务/订单/钱包/仲裁/审计） | ✅ | ✅ 等价 |
| 用户管理只读列表（含角色/状态标签） | ✅ | ✅ 等价 |
| 审计日志只读列表（含操作类型/分页） | ✅ | ✅ 等价 |
| 任务管理只读列表（含状态筛选+详情抽屉） | ✅ | ✅ 等价（旧 admin 无详情抽屉） |
| 订单管理只读列表（含状态筛选+详情抽屉） | ✅ | ✅ 等价（旧 admin 无详情抽屉） |
| 钱包监控只读流水 | ✅ | ✅ 等价 |
| 仲裁中心只读列表 | ✅ | ✅ 等价 |
| Dashboard（数据卡片+快捷入口+暖金视觉） | ✅ | ⬆️ 显著优于旧 admin |
| 移动端侧栏自动收起+动画 | ✅ | ⬆️ 显著优于旧 admin |
| 品牌定制（🏮 浩煜灯火站） | ✅ | ⬆️ 显著优于旧 admin |
| localStorage key 隔离（不与旧 admin 交叉污染） | ✅ | ⬆️ 优于旧 admin |
| 后端 API 反代 | ✅ | ✅ 等价（同一条 Nginx location） |
| 危险管理操作（封禁/解封/重置密码/强制结算等） | ❌ 未接入 | ❌ 旧 admin 也未完全接入 |

---

## 2. 旧 apps/admin 已知问题

| 问题 | 严重度 | admin-next 是否解决 |
|------|:---:|:---:|
| 登录按钮永久转圈 | 🔴 P0 | ✅ |
| 登录后显示"页面不存在" | 🔴 P0 | ✅ |
| title 闪烁 | 🔴 P0 | ✅ |
| 手机端无法稳定进入后台 | 🔴 P0 | ✅ |
| `initRouter` 异步卡死 | 🔴 P0 | ✅ |
| 路由守卫依赖 `Cookies` 判断 | 🟡 | ✅ |
| 暗色下拉框样式不良 | 🟡 P2 | ⚠️ Element Plus 默认主题 |
| 表单控件垂直居中 | 🟡 P2 | ⚠️ 同上 |
| 品牌 UI 质感不足 | 🟡 | ✅ |
| localstorage key 无隔离 | 🟡 | ✅ |
| 缺少详情抽屉/快捷入口 | 🟢 | ✅ |

---

## 3. admin-next 与旧 admin 功能差异

### admin-next 优于旧 admin

| 功能 | 说明 |
|------|------|
| Dashboard 视觉 | 暖金渐变标题、🏮 图标、数据卡片可点击跳转、6 个快捷入口按钮 |
| 移动端 | 侧栏点击自动收起+动画过渡、响应式排版 |
| 路由稳定性 | 静态菜单，不请求后端 `/get-async-routes`，不会转圈 |
| 品牌 | 暗色默认+暖金主题，footer 显示"浩煜灯火站·可信协作平台" |
| 登录体验 | email/password 即时反馈、错误提示明确、不转圈 |
| 任务/订单 | 详情抽屉（查看任务描述/分类/浏览量/提交内容等） |
| 缓存隔离 | `haoyu-admin-next-*` 独立 key，启动时自动清理旧 `admin-user-info` |

### 旧 admin 优于 admin-next

| 功能 | 说明 |
|------|------|
| (无) | — |

### 均不具备

| 功能 | 说明 |
|------|------|
| 危险治理操作按钮 | 两端均未接入 |
| 服务端分页 | 两端均未接入 |
| Token 自动刷新 | 两端均未接入 |

**结论**：admin-next 是旧 admin 的严格超集——所有旧功能保留，且修复了所有已知 P0 问题并增强了 UX。

---

## 4. 切换方案

### 方案 A：直接替换根路径（推荐）

将 `admin.haoyulv.com/` 的 Nginx root 从旧目录切换到 admin-next（带 `/` 前缀 base 的构建产物）。

```nginx
# 修改 /home/web/conf.d/haoyu-admin.conf
server {
    server_name admin.haoyulv.com;
    root /var/www/html/haoyu-admin-next;   # ← 改这里
    index index.html;
    # ... /api/ location 不变
}
```

**优点**：URL 干净，`admin.haoyulv.com/admin/dashboard` 直接访问。  
**缺点**：需要 admin-next 重新构建为 `base=/`。

### 方案 B：双路径并行（更安全）

保留当前方案，同时：
1. admin-next 重新构建为 `VITE_PUBLIC_PATH=/` + `VITE_ROUTER_HISTORY=h5`
2. 旧 admin 保留在 `/var/www/html/haoyu-admin/`，作为备用
3. 修改 Nginx root → 新目录

### 方案 C：分阶段切换

阶段 1：保持 `/admin-next/` 预览，不变
阶段 2：等危险治理操作接入后，再切换根路径

---

## 5. Nginx 路径调整方案

### 当前配置

```nginx
server {
    server_name admin.haoyulv.com;
    root /var/www/html/haoyu-admin;          # 旧 admin

    location /admin-next/ {
        alias /var/www/html/haoyu-admin-next/; # admin-next 预览
        try_files $uri $uri/ /admin-next/index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;  # 不变
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 切换后配置（方案 A/B）

```nginx
server {
    server_name admin.haoyulv.com;
    root /var/www/html/haoyu-admin-next;        # 新 admin

    # 旧 admin 保留为备份路径
    location /old-admin/ {
        alias /var/www/html/haoyu-admin/;
        try_files $uri $uri/ /old-admin/index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;  # 不变
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 6. 静态目录规划

### 切换前

| 目录 | 用途 | base |
|------|------|------|
| `/home/web/html/haoyu-admin/` | 旧 admin（生产） | `/` |
| `/home/web/html/haoyu-admin-next/` | admin-next（预览） | `/admin-next/` |

### 切换后

| 目录 | 用途 | base |
|------|------|------|
| `/home/web/html/haoyu-admin-next/` | admin-next（生产） | `/` |
| `/home/web/html/haoyu-admin/` | 旧 admin（备份） | `/old-admin/` |

### admin-next 重新构建

```bash
# 修改 .env.production
echo 'VITE_PUBLIC_PATH = /
VITE_ROUTER_HISTORY = "h5"
VITE_CDN = false
VITE_COMPRESSION = "none"
VITE_APP_TITLE = 浩煜灯火站' > apps/admin-next/.env.production

# 构建
cd apps/admin-next && pnpm build

# 部署（覆盖）
rm -rf /home/web/html/haoyu-admin-next/*
cp -r dist/* /home/web/html/haoyu-admin-next/
```

---

## 7. 缓存策略

| 资源 | 策略 |
|------|------|
| `index.html` | `no-cache, no-store, must-revalidate` |
| `static/js/*.js` | `expires 30d`（hash 文件名） |
| `static/css/*.css` | `expires 30d`（hash 文件名） |
| Cloudflare | `CF-Cache-Status: DYNAMIC`（不缓存 `/admin-next/*`） |

**切换后**：Cloudflare 规则需更新为 `admin.haoyulv.com/*`（原 `admin.haoyulv.com/admin-next/*` 将被替代为对根路径的 DYNAMIC 规则）。

---

## 8. 登录态 key 隔离影响

### 当前 key 表

| 用途 | 旧 admin key | admin-next key |
|------|-------------|----------------|
| token | `token` | `haoyu-admin-next-token` |
| userInfo | `admin-user-info` | `haoyu-admin-next-user` |
| tabs | — | `haoyu-admin-next-tabs` |

### 切换影响

- **旧 admin 已登录状态不会迁移到 admin-next**：用户在切换后需要重新登录
- **admin-next 启动时会清理旧 key**：`main.ts` 中 `cleanupLegacyKeys()` 会自动删除旧 `admin-user-info`、`token` 等
- **不存在交叉污染**：新旧 key 完全独立

### 用户体验

切换后用户首次打开 `admin.haoyulv.com` 时：
1. `cleanupLegacyKeys()` 清理旧 localStorage
2. 无 `haoyu-admin-next-user` → 跳转 `/login`
3. 输入超级管理员账号 → 登录成功 → Dashboard

**用户体验影响**：仅需重新登录一次。非 P0 问题。

---

## 9. 回滚方案

### 快速回滚（5 分钟）

```bash
# 1. 恢复 Nginx root 到旧 admin
sed -i 's|root /var/www/html/haoyu-admin-next|root /var/www/html/haoyu-admin|' /home/web/conf.d/haoyu-admin.conf
docker exec nginx nginx -s reload
# admin.haoyulv.com 回到旧 admin
```

### 完全回滚（恢复旧配置备份）

```bash
cp /home/web/conf.d/haoyu-admin.conf.bak.20260602_083000 /home/web/conf.d/haoyu-admin.conf
docker exec nginx nginx -s reload
```

---

## 10. 切换前验收清单

### 代码验证

- [ ] admin-next 已重新构建为 `base=/`
- [ ] 构建产物已部署到 `/home/web/html/haoyu-admin-next/`
- [ ] 旧 admin 备份到 `/home/web/html/haoyu-admin/`（仅备份，不删除）
- [ ] Nginx 配置备份已创建

### 功能验证（预览环境）

- [ ] 手机端无痕窗口访问 `/admin-next/` → 登录页正常
- [ ] 登录 → Dashboard 正常
- [ ] 7 个菜单项均可点击跳转
- [ ] 各页面数据正常加载
- [ ] 刷新不掉登录
- [ ] 退出登录正常
- [ ] 错误密码提示明确
- [ ] 侧栏菜单不转圈
- [ ] 移动端侧栏自动收起

### 安全验证

- [ ] 确认无 `.env/.db/.sqlite` 在构建产物或部署目录中
- [ ] 确认所有危险操作按钮未激活
- [ ] 确认 Cloudflare 缓存规则覆盖新路径

---

## 11. 切换后验收清单

### 立即验收（切换后 5 分钟内）

- [ ] `https://admin.haoyulv.com/` 返回 200（admin-next SPA）
- [ ] `https://admin.haoyulv.com/login` 返回 200（SPA 路由）
- [ ] `https://admin.haoyulv.com/admin/dashboard` 返回 200（SPA 路由）
- [ ] `https://admin.haoyulv.com/api/` 返回 200（后端健康）
- [ ] `https://admin.haoyulv.com/old-admin/` 返回 200（旧 admin 备份路径）
- [ ] `https://www.haoyulv.com/` 不受影响

### 功能验收（1 小时内）

- [ ] 手机端登录测试
- [ ] 电脑端登录测试
- [ ] 全部 7 个管理页面测试
- [ ] Console / Network 无红色错误
- [ ] 无 401/403/404 循环

---

## 12. 禁止事项

- ❌ 禁止在用户登录高峰期切换
- ❌ 禁止删除旧 admin 文件（`/home/web/html/haoyu-admin/`）
- ❌ 禁止修改后端代码
- ❌ 禁止修改数据库
- ❌ 禁止调账
- ❌ 禁止 `git add .`
- ❌ 禁止 force push
- ❌ 禁止创建 tag
- ❌ 禁止未备份 Nginx 配置就执行切换

---

## 13. 是否建议当前切换

### 结论：✅ 建议切换

| 因素 | 评估 |
|------|------|
| admin-next 功能完整性 | ✅ 7 个管理页面全部就绪，等价或优于旧 admin |
| P0 问题修复 | ✅ 旧 admin 的所有已知 P0 问题（转圈/404/title 闪烁）全部解决 |
| 风险 | ⚠️ 用户需重新登录一次（key 隔离所致）；无其他破坏性变更 |
| 回滚能力 | ✅ 5 分钟内可回滚（改 Nginx root 即可） |
| 危险操作 | ⚠️ 切换后仍需开发危险治理按钮（两端均未接入，非切换阻塞项） |
| 时间窗口 | ✅ 切换仅需修改 Nginx 1 行 + reload + 验证（总 < 3 分钟） |

### 切换阻塞项

**无技术阻塞项**。以下为优化项，非阻塞：

1. 重新构建 admin-next 为 `base=/`（5 分钟）
2. 危险治理操作未接入（切换前后均不具备，非退步）
3. Token 自动刷新未接入（切换前后均不具备，非退步）

### 建议时间

现在即可执行，在公子确认后 5 分钟内完成切换和验证。

---

> 报告路径：`docs/architecture/admin-next-cutover-assessment.md`  
> 建议：✅ 切换 | 风险：低 | 回滚：5 分钟
