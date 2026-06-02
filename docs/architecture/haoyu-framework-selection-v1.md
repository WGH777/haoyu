# HaoYu / 浩煜灯火站 前后端框架选型报告 v1

> 生成时间：2026-06-02 07:30 UTC  
> 生成分支：spike/admin-backend-framework-selection  
> 基于 commit：994fc7a (fix(admin): make beforeEach async to await initRouter properly)  
> 生成方式：只读分析代码 + 外部仓库调研，未修改任何源代码  
> 状态：DRAFT — 待公子审阅决策

---

## 执行摘要

### 核心结论

1. **前端 admin**：当前自写的 `apps/admin` 工程骨架来自 Vue Pure Admin 的早期裁剪版本，但存在布局/路由/样式问题（标题闪烁、暗色下拉框、页面不存在等）。建议尽快迁移到成熟的 Vue Pure Admin（v5+）或 Vue Vben Admin（v5）完整基座。
2. **后端**：NestJS + Prisma + SQLite 核心业务已经落地（钱包引擎、订单状态机、仲裁管理、审计日志），不建议换语言/主框架，但工程结构需要治理。
3. **数据库**：SQLite 在生产环境存在并发写锁瓶颈，必须规划迁移 PostgreSQL。
4. **当前 admin 问题不是框架问题，是构建/部署/配置问题**，已经有成熟的修复方向。

### 推荐路线

| 层级 | 推荐选择 | 时间窗口 |
|------|----------|----------|
| 管理后台 | **Vue Pure Admin**（稳妥）或 **Vue Vben Admin**（长期） | POC 7 天 → 决定 |
| 用户端前台 | Vue 3 + 品牌化设计系统重构，不用 admin 模板 | 后续规划 |
| 后端框架 | **继续 NestJS**，参考 ack-nestjs-boilerplate 架构治理 | 持续改进 |
| ORM | **继续 Prisma**，但预研 PostgreSQL 迁移 | 2-4 周 |
| 缓存/队列 | Redis + BullMQ | 后续规划 |

---

## 1. 当前 Admin 架构审计

### 1.1 目录结构

```
apps/admin/src/
├── api/user.ts                # API 层：login、getProfile、admin 接口
├── App.vue                    # 根组件
├── components/                # 通用组件（ReAuth、ReDialog、ReIcon、RePerms）
├── config/index.ts            # 平台配置加载
├── directives/                # 自定义指令（auth、copy、longpress、perms、ripple）
├── layout/                    # 布局系统（content、footer、navbar、notice、panel、search、sidebar、tag）
│   ├── hooks/                 # 布局逻辑 hooks
│   ├── components/lay-sidebar/# 侧边栏组件集（5种导航模式）
│   └── types.ts
├── main.ts                    # 入口
├── plugins/                   # Element Plus、i18n 插件
├── router/                    # 路由系统
│   ├── index.ts               # 路由入口（beforeEach、权限检查、token 守卫）
│   ├── modules/admin.ts       # 管理后台菜单路由
│   ├── utils.ts               # 路由工具函数
│   └── enums.ts
├── store/                     # Pinia 状态管理
│   └── modules/               # app、epTheme、multiTags、permission、settings、user
├── style/                     # 样式
├── utils/                     # 工具函数
│   ├── auth.ts                # token 存储、用户信息存取
│   └── http/index.ts          # Axios 封装（请求/响应拦截、token 注入）
└── views/                     # 页面视图
    ├── login/index.vue        # 登录页
    ├── dashboard/index.vue    # 总览
    ├── users/index.vue        # 用户管理
    ├── tasks/index.vue        # 任务管理
    ├── orders/index.vue       # 订单管理
    ├── wallet/index.vue       # 钱包监控
    ├── arbitration/index.vue  # 仲裁中心
    ├── audit/index.vue        # 审计日志
    ├── settings/index.vue     # 系统设置
    ├── error/                 # 403、404、500 错误页
    └── empty/index.vue
```

### 1.2 当前 Admin 问题清单

#### 1.2.1 已知已修复问题（commit 994fc7a）
- ✅ login title 闪烁（`document.title` 设置时机修复）
- ✅ 已登录访问 login 页自动跳转 dashboard
- ✅ 外部 URL 不触发 initRouter
- ✅ `beforeEach` 改为 async，正确 await initRouter
- ✅ token 为空时不调用 initRouter

#### 1.2.2 当前仍在观察的问题
| 问题 | 严重度 | 现状 |
|------|--------|------|
| 移动端/桌面端 admin 显示"页面不存在" | 🔴 P0 | 路由守卫修复后需真实浏览器验证 |
| 登录按钮转圈不进入后台 | 🔴 P0 | 同上 |
| 暗色模式下拉框样式 | 🟡 P2 | Element Plus CSS 变量覆盖 |
| 表单控件垂直居中 | 🟡 P2 | 全局样式微调 |
| 注册按钮可读性 | 🟢 P3 | 首页前端问题，非 admin |

#### 1.2.3 架构问题
1. **UI 质感不足**：当前 admin 是 Vue Pure Admin 的裁剪版本，缺少完整主题系统、品牌定制。
2. **工程来源混合**：从 Vue Pure Admin 裁剪而来，又自写了大量组件，代码风格不统一。
3. **缺少 CI/CD**：构建后手动部署到 `/var/www/haoyu-admin/`，回滚困难。
4. **响应式支持有限**：移动端适配不完整。
5. **无 e2e 测试**：登录流程、路由守卫全靠手动验证。

### 1.3 Admin 技术特征
- 路由守卫：静态路由 + 角色权限过滤（ADMIN/SUPER_ADMIN）
- Token 管理：`localStorage` 多 key 兼容（`token`、`access_token`、`jwt`）
- API base：通过 `/api` 反代到后端 127.0.0.1:3000
- 状态管理：Pinia（user、permission、multiTags、settings、app、epTheme）
- 登录流程：`/api/auth/login` → store 权限验证（非 ADMIN/SUPER_ADMIN 拒绝）→ token 存储 → initRouter → redirect

---

## 2. 当前 Backend 架构审计

### 2.1 模块全景

```
apps/backend/src/
├── main.ts                          # 入口：CORS、helmet、Swagger、全局 ValidationPipe、端口 3000
├── app.module.ts                    # 根模块：12 个子模块 + ThrottlerGuard + ServeStatic
├── app.controller.ts                # GET /api → 健康检查（简单字符串）
├── app.service.ts                   # 空服务
│
├── prisma/                          # Prisma ORM
│   ├── prisma.module.ts             # 全局模块
│   └── prisma.service.ts            # 带超时的事务包装器
│
├── auth/                            # 认证鉴权模块
│   ├── auth.module.ts               # JWT + Passport 注册
│   ├── auth.service.ts              # 注册、登录、refresh、改密、登出、管理员重置密码
│   ├── auth.controller.ts           # POST /auth/login, /auth/register, /auth/refresh, PATCH 改密
│   ├── jwt.strategy.ts              # JWT 策略（从 DB 查询用户角色）
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # @Public 装饰器 + JWT AuthGuard
│   │   └── roles.guard.ts           # @Roles('ADMIN', 'SUPER_ADMIN') 权限检查
│   ├── decorators/                  # @CurrentUser、@Roles
│   └── dto/                         # login、register、change-password、refresh-token、admin-reset-password
│
├── user/                            # 用户模块
│   ├── user.controller.ts           # GET/PATCH 用户信息（含管理员重置密码、修改角色）
│   ├── user.service.ts              # CRUD + 角色管理
│   └── dto/                         # create-user、update-profile、update-user、admin-reset-password
│
├── task/                            # 任务模块
│   ├── task.controller.ts           # CRUD + 发布者/管理员权限检查
│   ├── task.service.ts              # 核心：状态机 PENDING→ASSIGNED→SUBMITTED→COMPLETED
│   └── dto/                         # create-task、update-task、create-subtask、update-subtask
│
├── order/                           # 订单模块
│   ├── order.controller.ts          # 抢单、开始服务、提交成果、验收、取消
│   ├── order.service.ts             # 核心引擎：事务重试、并发控制、资金结算、自动确认/取消、旧订单兼容
│   └── dto/                         # create-order、submit-result、complete-order
│
├── wallet/                          # 钱包引擎
│   ├── wallet.controller.ts         # 查询、充值、提现、流水
│   ├── wallet.service.ts            # 核心资金引擎：freeze/unfreeze/settle/refund/deposit/withdraw + LedgerEntry
│   └── dto/                         # deposit
│
├── admin/                           # 管理员治理模块
│   ├── admin.controller.ts          # 905 行 — 核心控制器
│   │   ├── 用户管理：重置密码、创建用户、封号/解封（SUPER_ADMIN）
│   │   ├── 只读接口：任务列表、流水、订单列表、审计日志
│   │   └── 干预操作：强制取消任务（退款）、强制结算订单、强制驳回订单
│   ├── admin.service.ts             # Dashboard 统计 + 晋升管理员
│   ├── admin.module.ts              # 模块注册（注入 PrismaModule + WalletModule）
│   └── admin-audit.service.ts       # 管理员操作审计日志
│
├── dispute/                         # 纠纷/仲裁模块
│   ├── dispute.controller.ts
│   └── dispute.service.ts
│
├── notification/                    # 通知模块
│   ├── notification.controller.ts
│   ├── notification.service.ts      # create + createBatch（支持多种通知类型）
│   └── notification.module.ts
│
├── comment/                         # 订单留言模块
│   ├── comment.controller.ts
│   └── comment.service.ts
│
├── scheduler/                       # 定时任务
│   ├── scheduler.module.ts
│   └── scheduler.service.ts         # 每分钟：48h 超时取消 + 72h 超时自动确认/预警
│
├── health/                          # 健康检查（⚠️ 未注册到 AppModule）
│   ├── health.module.ts
│   └── health.controller.ts
│
└── common/                          # 公共设施
    ├── filters/http-exception.filter.ts      # 全局异常过滤器（500→友好消息）
    ├── interceptors/transform.interceptor.ts  # 响应格式统一 { code, message, data }
    └── upload-validator.ts
```

### 2.2 Backend 问题清单

#### 2.2.1 工程治理问题
| 问题 | 严重度 | 详情 |
|------|--------|------|
| HealthModule 未注册到 AppModule | 🟡 中 | `health/health.module.ts` 存在但不在 `app.module.ts` imports 中 |
| 无全局日志系统 | 🔴 高 | 使用 `console.log/error`，无结构化日志、无请求链路追踪 |
| 无统一异常处理中间件 | 🟡 中 | 已有 `HttpExceptionFilter`，但未注册到 `app.module.ts` providers |
| 无 TransformInterceptor 注册 | 🟡 中 | 已定义但未全局使用 |
| 模块间循环依赖风险 | 🟡 中 | UserModule↔AuthModule、AdminModule→WalletModule 等 |
| 缺少 Swagger DTO 示例 | 🟢 低 | 部分接口有 @ApiBody/@ApiOperation，但 DTO 缺少 @ApiProperty |
| 缺少数据库迁移管理 | 🟡 中 | 无 Prisma Migrate 规范化流程 |

#### 2.2.2 安全与鉴权
| 问题 | 严重度 | 详情 |
|------|--------|------|
| RBAC 实现良好 | ✅ | @Roles() + RolesGuard + 资源级权限检查（assertTaskOwnerOrAdmin） |
| JWT 无弱默认回退 | ✅ | 强制要求 JWT_SECRET 环境变量 |
| RefreshToken 轮换机制完善 | ✅ | bcrypt hash 比较 + updateMany 原子轮换 |
| 用户封号后强制退出 | ✅ | ban 时清空 refreshToken |
| 缺少请求频率精细化限制 | 🟢 低 | 仅有全局 60s/100 次限制，无按接口/用户细粒度限流 |
| 缺少 CSRF 保护 | 🟢 低 | JWT Bearer 天然免疫，但若未来 cookie 模式需要注意 |

#### 2.2.3 数据库与钱包
| 问题 | 严重度 | 详情 |
|------|--------|------|
| SQLite 并发写锁瓶颈 | 🔴 高 | 事务重试可缓解，但高并发下性能受限；需迁移 PostgreSQL |
| 钱包引擎设计优秀 | ✅ | freeze→settle/unfreeze→LedgerEntry 资金守恒，幂等键设计 |
| order.service.ts 事务重试机制 | ✅ | 3 次重试 + 退避 + Prisma 错误码匹配 |
| Legacy 旧订单兼容逻辑 | 🟡 中 | `checkLegacyOrder` 跳过 Wallet 迁移前的订单，需文档化 |
| Transaction 表为 Legacy | 🟡 中 | 与 LedgerEntry 并存，admin 流水查询仍用旧表 |

#### 2.2.4 订单/任务状态机
| 问题 | 严重度 | 详情 |
|------|--------|------|
| 任务状态机有明确定义 | ✅ | 4 状态 + assertTaskTransition 边界检查 |
| 订单状态机隐式在代码中 | 🟡 中 | ASSIGNED→SUBMITTED→COMPLETED/CANCELLED，但无集中状态机定义 |
| 条件更新防并发 | ✅ | updateMany + where status 条件更新 |
| 缺少 IN_PROGRESS 状态的实际流转 | 🟡 中 | startService 将 ASSIGNED→IN_PROGRESS，但 submitResult 要求 ASSIGNED |

#### 2.2.5 代码规模
| 文件 | 行数 | 职责 |
|------|------|------|
| admin.controller.ts | 905 | 管理员控制器（过重，建议拆分） |
| order.service.ts | 826 | 订单服务（核心引擎，逻辑复杂但合理） |
| task.service.ts | 362 | 任务服务 |
| wallet.service.ts | 311 | 钱包引擎 |
| user.service.ts | 295 | 用户服务 |

### 2.3 Backend 亮点
1. **钱包引擎设计严谨**：freeze/unfreeze/settle/refund 全部原子操作 + LedgerEntry 审计，金额单位为分，避免浮点精度。
2. **事务重试机制**：order.service.ts 实现了 3 次重试 + 退避 + Prisma 错误码分类，适配 SQLite 写锁场景。
3. **管理员审计日志**：AdminAuditService 记录了所有危险操作（FORCE_CANCEL_TASK、FORCE_COMPLETE_ORDER 等）。
4. **定时任务完备**：48h 服务者超时自动取消 + 72h 发布者未确认按风险等级自动处理 + 通知推送。
5. **JWT + RefreshToken 轮换**：bcrypt hash 存储 + updateMany 原子条件更新，防止并发轮换问题。

---

## 3. 前端后台框架对比

### 3.1 Vue Vben Admin

| 维度 | 评估 |
|------|------|
| 仓库 | https://github.com/vbenjs/vue-vben-admin |
| 版本 | v5（最新版，不兼容 v2） |
| Stars | 26k+ |
| 技术栈 | Vue 3 + Vite + TypeScript + Monorepo + Shadcn UI + Tailwind CSS |
| UI 质感 | ★★★★★ |
| 权限系统 | 完整的动态路由权限生成方案 |
| 主题 | 多主题、暗色模式、自定义 |
| 国际化 | 完整内置 |
| 文档 | https://doc.vben.pro/ |
| 移动端 | 有限支持 |
| 适配 HaoYu 成本 | ⭐⭐⭐ 较高 |
| 包管理 | pnpm + monorepo |

**适合 HaoYu 的理由**：
- 工程化成熟度最高，适合长期维护
- UI 质感达到"高级感"要求
- 权限/路由/主题体系完整
- 社区活跃、文档完善

**不适合的理由**：
- 使用 Shadcn UI，与现有 Element Plus 技术栈差异大
- Monorepo 结构重，学习曲线陡
- 迁移成本高：需要从 Element Plus 全面切换到 Shadcn UI

### 3.2 Vue Pure Admin

| 维度 | 评估 |
|------|------|
| 仓库 | https://github.com/pure-admin/vue-pure-admin |
| Stars | 17k+ |
| 技术栈 | Vue 3 + Vite + Element Plus + TypeScript + Pinia + Tailwind CSS |
| UI 质感 | ★★★★☆ |
| 权限系统 | 静态/动态路由 + 角色权限 |
| 主题 | 暗色模式 + 多主题 |
| 国际化 | 完整内置 |
| 移动端 | ✅ 兼容移动端 |
| 精简版本 | pure-admin-thin（打包 < 2.3MB，brotli < 350KB） |
| 脚手架 | @pureadmin/cli（一行命令创建项目） |
| 适配 HaoYu 成本 | ⭐⭐ 较低 |

**适合 HaoYu 的理由**：
- **当前 admin 就是从 Vue Pure Admin 裁剪而来**，技术栈完全一致
- Element Plus 组件体系可直接复用
- 移动端兼容（HaoYu 管理后台需要）
- 精简版 pure-admin-thin 适合实际项目开发
- 迁移成本远低于 Vben

**不适合的理由**：
- UI 质感不如 Vben 高级
- 社区规模略小于 Vben

### 3.3 vue-element-plus-admin

| 维度 | 评估 |
|------|------|
| 仓库 | https://github.com/kailong321200875/vue-element-plus-admin |
| Stars | 10k+ |
| 技术栈 | Vue 3 + Vite + Element Plus + TypeScript |
| UI 质感 | ★★★☆☆ |
| 权限系统 | 动态路由权限 |
| 移动端 | 有限支持 |
| 风险 | **官方提醒**：完整版集成很多功能会造成代码冗余，建议用 mini 分支 |
| 适配 HaoYu 成本 | ⭐⭐ 较低 |

**结论**：技术栈接近但完整性不如 Pure Admin，且有官方"不建议直接全量套用"的提醒。**不建议作为主选**，可作为 UI/布局参考。

### 3.4 前端对比总结

| 维度 | Vue Vben Admin | Vue Pure Admin | vue-element-plus-admin |
|------|:---:|:---:|:---:|
| UI 质感 | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| 适配 HaoYu 成本 | ⭐⭐⭐ 高 | ⭐⭐ 低 | ⭐⭐ 低 |
| Element Plus 兼容 | ❌ Shadcn UI | ✅ 原生 Element Plus | ✅ 原生 Element Plus |
| 移动端 | 有限 | ✅ | 有限 |
| 社区活跃度 | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| 文档质量 | ★★★★★ | ★★★★☆ | ★★★★☆ |
| 工程化成熟度 | ★★★★★ | ★★★★★ | ★★★★☆ |
| 长期维护潜力 | ★★★★★ | ★★★★☆ | ★★★☆☆ |

### 3.5 前端推荐

```txt
稳妥路线（推荐）：Vue Pure Admin（精简版 pure-admin-thin）
  - 技术栈一致，迁移成本最低
  - 当前 admin 已有 Pure Admin 基础
  - 移动端兼容
  - 可快速上线

长期高级路线：Vue Vben Admin
  - 需要学习 Shadcn UI 体系
  - 迁移成本高
  - UI 质感最强
  - 适合 HaoYu 2.0 大版本
```

---

## 4. 后端框架对比

### 4.1 ack-nestjs-boilerplate

| 维度 | 评估 |
|------|------|
| 仓库 | https://github.com/andrechristikan/ack-nestjs-boilerplate |
| Stars | 1.5k+ |
| 技术栈 | NestJS 11 + Prisma + MongoDB（可切换任意 DB） |
| Auth | JWT + OAuth (Google/Apple) + OTP + TOTP/2FA |
| RBAC | 完整角色权限 + Policy Ability |
| 模式 | Repository Pattern + 模块化 |
| 生产就绪 | ✅ Docker、Swagger、CI/CD、审计日志 |
| 测试 | Unit + Integration + E2E |

**HaoYu 可借鉴**：
- Repository Pattern（当前 PrismaService 直接注入 Controller，未封装 Repository）
- Policy Ability（比当前简单的 @Roles 更精细）
- 审计日志的统一封装（当前 AdminAuditService 已有基础）
- Swagger 文档完善（当前已有但不够规范）

### 4.2 NestJS Boilerplate (brocoders)

| 维度 | 评估 |
|------|------|
| 仓库 | https://github.com/brocoders/nestjs-boilerplate |
| Stars | 3.5k+ |
| 技术栈 | NestJS + TypeORM/Mongoose + PostgreSQL/MongoDB |
| 差异 | 使用 TypeORM 而非 Prisma，与 HaoYu 现有 ORM 不兼容 |

**结论**：ORM 不兼容，只借鉴架构设计模式，不直接使用。

### 4.3 后端推荐

```txt
不换主框架：继续 NestJS + Prisma
工程治理：参考 ack-nestjs-boilerplate 的架构模式
  - Repository Pattern 封装
  - Policy Ability 权限
  - 结构化日志
  - Health Check 完善
  - 统一异常处理注册
数据库：规划 SQLite → PostgreSQL 迁移
```

---

## 5. 是否建议更换

### 5.1 建议更换
| 组件 | 建议 | 理由 |
|------|------|------|
| Admin 前端基座 | ✅ 建议换 | 当前裁剪版本不完整，UI 质感不足，补丁堆积 |
| 后端工程结构 | ✅ 建议治理 | 模块划分合理但缺少 Repository Pattern、全局日志、Health Check |

### 5.2 不建议更换
| 组件 | 建议 | 理由 |
|------|------|------|
| NestJS 框架 | ❌ 不换 | 核心业务已落地，钱包/订单/审计重写风险极高 |
| Prisma ORM | ❌ 不换 | Schema 已定义所有业务模型，迁移成本大 |
| SQLite → PostgreSQL | ⏳ 规划中 | 迁移必要但不紧急（低并发阶段 SQLite 可用） |
| 钱包引擎 | ❌ 不重写 | 设计已严谨（原子操作 + LedgerEntry + 资金守恒） |
| 订单状态机 | ❌ 不重写 | 逻辑完善，只需要文档化 + 集中化状态定义 |

---

## 6. 更换成本估算

### 6.1 Admin → Vue Pure Admin（稳妥路线）
| 阶段 | 工作内容 | 预估时间 |
|------|----------|----------|
| POC 搭建 | 克隆 pure-admin-thin，接入 HaoYu API | 1-2 天 |
| 登录迁移 | 接入 HaoYu 后端 /api/auth/login | 0.5 天 |
| 布局/菜单 | 配置 8 个管理页面菜单 | 0.5 天 |
| 页面迁移 | 逐页迁移（Dashboard→Users→Tasks→Orders→Wallet→Arbitration→Audit→Settings） | 3-5 天 |
| 权限对接 | @Roles 装饰器 + SUPER_ADMIN Guard | 1 天 |
| 主题定制 | 浩煜品牌色、暗色主题 | 1 天 |
| 测试验证 | 真实浏览器 + 移动端验证 | 1 天 |
| **合计** | | **8-11 天** |

### 6.2 Admin → Vue Vben Admin（高级路线）
| 阶段 | 工作内容 | 预估时间 |
|------|----------|----------|
| 学习成本 | Shadcn UI + Vben 架构学习 | 3-5 天 |
| 页面迁移 | 全部 8 个页面重写（不同 UI 体系） | 7-10 天 |
| 权限对接 | 适配 Vben 权限系统 | 2 天 |
| **合计** | | **12-17 天** |

### 6.3 Backend 工程治理
| 阶段 | 工作内容 | 预估时间 |
|------|----------|----------|
| 注册缺失组件 | HealthModule、HttpExceptionFilter、TransformInterceptor 全局注册 | 0.5 天 |
| 结构化日志 | 引入 Winston/Pino | 1 天 |
| Repository Pattern | 抽离 Prisma 查询到 Repository 层 | 2-3 天 |
| Swagger 完善 | DTO 添加 @ApiProperty | 1 天 |
| 状态机文档化 | 订单状态流转图 + 测试覆盖 | 1 天 |
| **合计** | | **5-7 天** |

---

## 7. 不更换风险

### 7.1 继续使用当前 Admin
- UI 质感难以提升到"高级感"水平
- 补丁式修改会继续堆积技术债务
- 新功能开发效率低（缺少完整的模板体系）
- 移动端适配需要大量追加工作

### 7.2 继续使用当前 Backend 工程结构
- 缺少结构化日志 → 生产问题难排查
- SQLite 并发瓶颈 → 用户增长后不可用
- 无 Health Check 端点 → 监控系统无法接入
- AdminController 905 行过重 → 维护困难

---

## 8. 分阶段迁移路线

### 阶段 A：冻结当前主线（立即）
```
✅ 已完成：commit 994fc7a 稳定可用
📋 待验证：真实浏览器 + 移动端确认 admin 登录正常
```

### 阶段 B：Admin POC（当前 spike 分支，7 天内）
```
1. 创建 apps/admin-pure-poc/（基于 pure-admin-thin）
2. 接入 HaoYu API（login + profile + admin/* 端点）
3. 迁移 1-2 个关键页面作为概念验证
4. 对比暗色主题、移动端体验
5. 决定：Pure Admin vs Vben Admin
```

### 阶段 C：Backend 治理（并行，不阻塞 Admin POC）
```
1. 注册 HealthModule → 可被 Nginx/Caddy 健康检查
2. 全局注册 HttpExceptionFilter + TransformInterceptor
3. 引入结构化日志（Winston）
4. 输出 docs/architecture/backend-audit-v022.md
```

### 阶段 D：Admin 迁移（POC 通过后）
```
1. 新建 apps/admin-next/
2. 按优先级逐页迁移（Dashboard → 用户管理 → 任务管理 → ...）
3. 通过 admin-next.haoyulv.com 子域名预览
4. 全功能验证通过后切换域名
```

### 阶段 E：数据库升级（中期）
```
1. Prisma Schema 适配 PostgreSQL
2. 数据迁移脚本 + 备份
3. Docker Compose PostgreSQL 部署
4. 灰度切换
```

---

## 9. 禁止触碰项确认

以下内容在整个选型和迁移过程中**绝不修改**：

- ❌ 生产数据库（SQLite .db 文件）
- ❌ Wallet 表结构和数据
- ❌ LedgerEntry 表结构和数据
- ❌ 任务/订单状态机核心逻辑
- ❌ 现有 apps/admin/ 目录（不删除）
- ❌ 现有 apps/backend/ 核心业务代码
- ❌ 不做 git add . / force push
- ❌ 不创建 v0.2.3 tag
- ❌ 不提交 .env / .db / .sqlite
- ❌ 不直接切换生产后台域名

---

## 10. 下一步建议

1. **立即**：在真实浏览器 + 移动端上验证 admind 登录（commit 994fc7a），确认不再转圈/页面不存在。
2. **本周**：搭建 Vue Pure Admin POC（apps/admin-pure-poc/），快速验证可行性。
3. **本周**：注册 HealthModule、日志组件到 AppModule，改善后端可诊断性。
4. **7 天内**：输出 final 选型决定（Pure Admin vs Vben Admin）。
5. **2-4 周**：完成 admin-next 迁移 + backend 工程治理。

---

> 报告生成于 spike/admin-backend-framework-selection 分支。  
> 所有分析基于只读代码审查，未修改任何源代码。  
> 相关外部仓库信息截至 2026-06-02。
