# 浩煜（Haoyu）——宇宙级开放价值市场 · MVP Core v1.0

## 1. 项目简介
    HaoYu 是一个面向开放协作场景的价值市场系统，支持：

    任务发布与接单

    子任务协作

    资金冻结 / 结算 / 退款

    平台级权限治理与管理员仲裁

    该项目并非 Demo，而是一个具备真实上线条件的 MVP 核心系统。
## 2. 核心能力
    ✅ 任务系统（全闭环）

    发布 → 接单 → 提交 → 验收 / 驳回 → 结算

    严格状态机控制，禁止非法跳转

    💰 钱包 & 资金模型

    发布即冻结（赏金 + 服务费）

    结算 / 退款均走事务

    全流程流水可追溯

    🧩 子任务协作

    发布者：新增 / 编辑 / 删除 / 勾选

    执行者：仅可勾选完成

    状态刷新后保持一致

    🔐 RBAC 权限系统（三层）

    接口级权限（RolesGuard）

    资源级权限（发布者 / 执行者 / 管理员）

    状态机约束（状态 + 身份联合校验）

    ⚖️ 管理员仲裁（平台治理核心）

    强制取消任务（退款给发布者）

    强制结算订单（支付给执行者）

    强制驳回成果（回退可重提）

    所有操作可审计

## 3. 系统架构
    Frontend (Vue 3 + Vite)
            |
            | HTTP / REST
            v
    Backend (NestJS)
    ├─ Auth / RBAC
    ├─ Task / Order / Wallet
    ├─ Admin Arbitration
    └─ Prisma ORM
            |
            v
    SQLite (dev.db)


## 4. 状态机
### Task 状态机
    PENDING
    ↓ 接单
    ASSIGNED
    ↓ 提交成果
    SUBMITTED
    ↓ 验收 / 管理员结算
    COMPLETED

    （管理员可强制 → CANCELLED）

### Order 状态机
    ASSIGNED
    ↓ 提交成果
    SUBMITTED
    ↓ 验收 / 管理员结算
    COMPLETED

    （管理员可 → CANCELLED / 回退 ASSIGNED）

## 5. 权限矩阵（RBAC）
    | 角色          | 能力                 |
    | ----------- | ------------------ |
    | GUEST       | 浏览任务大厅 / 任务详情      |
    | USER        | 发布任务 / 接单 / 执行     |
    | ADMIN       | 平台仲裁（结算 / 取消 / 驳回） |
    | SUPER_ADMIN | 平台最高权限             |


## 6. 快速开始（本地运行）
    ### Backend
    cd apps/backend
    npm install
    npm run start:dev
    Base URL：
    http://localhost:3000/api

    Swagger 文档：
    http://localhost:3000/api/docs

    数据库文件：
    G:\haoyu\apps\backend\prisma\dev.db
    ### Frontend
    cd apps/frontend
    yarn install
    yarn dev

## 7. API 文档
    Swagger UI：
    👉 http://localhost:3000/api/docs

    管理员接口示例：

    POST /admin/orders/:id/force-complete

    POST /admin/tasks/:id/force-cancel

## 8. 系统级测试复盘结论
    | 编号 | 模块      | 结果   |
    | -- | ------- | ---- |
    | A1 | RBAC 基础 | ✅ 通过 |
    | A2 | 任务闭环    | ✅ 通过 |
    | A3 | 执行 & 仲裁 | ✅ 通过 |
    | A4 | 钱包与资金安全 | ✅ 通过 |
    | A5 | 子任务协作   | ✅ 通过 |
    | A6 | 审计与可追溯  | ✅ 通过 |


## 9. Roadmap
    v1.1（增强）

    管理后台 UI

    审计日志表落库

    任务状态时间线（Timeline）

    v2.0（愿景级）

    WebSocket 实时状态同步

    信誉系统 / 仲裁评分

    多人协作任务拆分

    平台治理规则引擎
