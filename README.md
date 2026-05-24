# 浩煜（Haoyu）— 可信价值协作平台 · MVP Core v2

> 连接真实需求与真实能力。发布需求，响应服务，资金托管，可信交易。

## 项目简介

HaoYu 是一个面向开放协作场景的价值市场系统，支持任务发布与接单、子任务协作、资金冻结/结算/退款、平台级权限治理与管理员仲裁。

**本项目已具备真实上线条件**，含完整的资金安全、权限体系、审计追溯和运维保障。

## 核心能力

### 🧩 任务系统（全闭环）
发布 → 接单 → 提交 → 验收/驳回 → 结算，严格状态机控制。

### 💰 钱包 & 资金引擎
- 发布即冻结（赏金 + 服务费）
- 结算/退款均走原子事务 + LedgerEntry 双记录
- 全流程流水可追溯，每日自动对账

### 🔐 三层权限体系（RBAC）
- 接口级（RolesGuard）
- 资源级（发布者/执行者/管理员）
- 状态机约束（状态 + 身份联合校验）

### ⚖️ 管理员仲裁（平台治理核心）
- 强制取消任务（退款给发布者）
- 强制结算订单（支付给执行者）
- 强制驳回成果（回退可重提）
- 双签机制（高风险操作需两位管理员确认）
- 全操作审计日志落库

### ⏱️ 自动化运维
- 服务者 48h 未开始 → 自动取消+退款
- 发布者 72h 未验收 → 48h 预警 → 72h 自动确认（低/中风险）
- 高风险订单转 DISPUTED 人工处理
- 需求 24h 无人响应 → 通知运营

## 系统架构

```
Frontend (Vue 3 + Vite + Element Plus)
        │ HTTP / REST
        ▼
Backend (NestJS)
├── Auth / RBAC（JWT + bcrypt + refresh 轮换）
├── Task / Order（状态机 + 并发保护）
├── Wallet（原子资金引擎 + LedgerEntry）
├── Admin（仲裁 + 审计 + 双签）
├── Scheduler（超时监控 + 自动处理）
├── Reconciliation（每日资金对账）
└── Prisma ORM
        │
        ▼
SQLite（dev）/ PostgreSQL（production）
```

## 快速开始

```bash
# 1. 安装后端依赖
cd apps/backend
npm install

# 2. 生成 Prisma 客户端 + 初始化数据库
npx prisma generate
npx prisma db push

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 JWT_SECRET 等必填项

# 4. 启动后端
npm run start:dev
# → http://localhost:3000/api
# → Swagger: http://localhost:3000/api/docs

# 5. 安装前端依赖
cd ../frontend
npm install

# 6. 配置前端环境变量
cp .env.example .env

# 7. 启动前端
npm run dev
# → http://localhost:5173
```

## API 文档

启动后端后访问 Swagger UI：
```
http://localhost:3000/api/docs
```

管理员接口示例：
- `POST /api/admin/orders/:id/force-complete` — 强制结算
- `POST /api/admin/tasks/:id/force-cancel` — 强制取消
- `GET /api/admin/audit-logs` — 审计日志
- `GET /api/admin/dual-sign/pending` — 双签请求

## 生产部署

详见 **[DEPLOYMENT.md](DEPLOYMENT.md)**，包含：
- 环境要求与依赖安装
- 环境变量配置
- Nginx/Caddy 反代
- pm2 保活
- 数据库备份
- 上线检查清单

## 状态机

### Task 状态机
```
PENDING → ASSIGNED → IN_PROGRESS → SUBMITTED → COMPLETED
              ↓ (管理员)              ↓ (争议)
           CANCELLED              DISPUTED
```

### Order 状态机
```
ASSIGNED → IN_PROGRESS → SUBMITTED → COMPLETED
    ↓ (管理员)    ↓ (争议)    ↓ (管理员)
CANCELLED     DISPUTED    → ASSIGNED（驳回）
```

## 测试

```bash
# 后端单元测试（26 用例）
cd apps/backend && npm test

# 前端类型检查
cd apps/frontend && npx vue-tsc --noEmit
```

## Roadmap

- **v2.1** — 移动端适配完成（卡片视图 + 折叠操作）
- **v2.2** — WebSocket 实时状态推送
- **v2.3** — 信誉系统 / 仲裁评分
- **v3.0** — 多人协作任务拆分 / 智能匹配引擎
