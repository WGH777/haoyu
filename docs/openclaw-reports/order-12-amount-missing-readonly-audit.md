# 订单 #12 amount missing 只读巡检报告

## 概述

检查背景：PM2 日志持续输出 WARN 级别消息 `Skip legacy order #12: amount is missing (legacy order)`，每 60 秒循环一次。

仅读操作，未执行任何 INSERT/UPDATE/DELETE。

## 1. WARN 来源

| 字段 | 值 |
|------|-----|
| 日志位置 | `SchedulerService` → `OrderService.autoConfirm()` |
| 代码路径 | `apps/backend/src/scheduler/scheduler.service.ts:22` （@Cron 每分钟） |
| | `apps/backend/src/order/order.service.ts:646` （logger.warn） |
| 判断函数 | `checkLegacyOrder()` at `order.service.ts:152` |
| 触发频率 | `CronExpression.EVERY_MINUTE` |
| 日志模式 | 每分钟 `WARN Skip legacy order #12: amount is missing (legacy order)` |
| | 紧接 `LOG ✅ 订单 #12 自动确认完成`（易误导） |

## 2. 检查函数逻辑 (`checkLegacyOrder`)

```typescript
private checkLegacyOrder(order: any): string | null {
    if (!order.amount || order.amount <= 0) {
      return 'amount is missing (legacy order)';
    }
    if (!order.task?.price || order.task.price <= 0) {
      return 'task price is invalid';
    }
    const migrationDate = new Date('2026-05-26T00:00:00Z');
    if (order.createdAt && new Date(order.createdAt) < migrationDate) {
      return 'order created before wallet migration';
    }
    return null;
}
```

三个保护条件任中一条即跳过结算。订单 #12 命中了第一条。

## 3. 订单 #12 当前数据

| 字段 | 值 |
|------|-----|
| id | 12 |
| amount | **NULL**（缺失） |
| status | SUBMITTED |
| taskId | 11 |
| workerId | 9 |
| submissionContent | "ad" |
| submittedAt | 2025-12-14 00:45:46 UTC |
| createdAt | 2025-12-14 00:14:14 UTC |

## 4. 关联数据

### 任务 #11

| 字段 | 值 |
|------|-----|
| title | "327" |
| price | 10000.0（100 元） |
| status | SUBMITTED |
| riskLevel | LOW |
| publisherId | 3（haoyu@haoyu.com, SUPER_ADMIN） |
| createdAt | 2025-12-12 UTC |

### 服务者 #9（ceshi@haoyu.com）

| 字段 | 值 |
|------|-----|
| role | USER |
| status | ACTIVE |
| 钱包 (wallet_9) | available=299900 (2999元) |
| | frozen=0 |

### 发布者 #3（haoyu@haoyu.com）

| 字段 | 值 |
|------|-----|
| role | SUPER_ADMIN |
| status | ACTIVE |
| 钱包 (wallet_3) | available=9559999, frozen=8900 |

### LedgerEntry

**无记录。** Order #12 没有关联任何 LedgerEntry——符合"迁移前订单"特征。

## 5. 全局 amount=NULL 统计

**18 条**订单的 amount 字段全部为 NULL（100% legacy 数据）。其中：
- 16 条 COMPLETED — 历史完成数据，不影响当前流程
- 1 条 CANCELLED — 正常取消
- 1 条 **SUBMITTED**（#12）— 唯一触发 WARN 的活跃遗留订单

## 6. 风险判断

| 风险维度 | 评估 | 说明 |
|---------|------|------|
| 功能风险 | ✅ 无 | `checkLegacyOrder` 正确拦截，不会进入 Wallet 结算 |
| 资金风险 | ✅ 无 | 无 LedgerEntry，钱包未受影响 |
| 数据安全 | ✅ 安全 | 纯测试数据，非用户正式订单 |
| 日志噪声 | ⚠️ 中度 | WARN 每分钟重复，已超过 60 条/小时，会掩盖真实问题 |
| 误导日志 | ⚠️ 轻度 | `✅ 订单 #12 自动确认完成` 易被误读为成功处理 |

## 7. 后续处理建议

| # | 建议 | 优先级 | 方案类型 |
|---|------|--------|---------|
| 1 | `autoConfirm` 中对 legacy skip 使用 `logger.log` 而非 `logger.warn`，降级日志级别 | P1 | 代码变更（不影响逻辑） |
| 2 | `checkLegacyOrder` 命中后不应返回 `order`（标记为 success），而应返回并标记 `autoConfirm` 为 skip | P2 | 代码变更（消除误导日志） |
| 3 | 停止每分钟重试 legacy 订单——增加跳过记录或 dedup 状态 | P2 | 设计变更 |
| 4 | 数据修复：对未来不会结算的 legacy 订单，可评估是否置为 `CANCELLED` 或删除 | P3 | 数据库变更（需 schema 设计与讨论） |
| 5 | 遗留数据治理：18 条 NULL amount 订单需整体评估清理策略 | P3 | 跨版本规划 |

## 8. 参考文件

```
apps/backend/src/order/order.service.ts:146-169   → checkLegacyOrder()
apps/backend/src/order/order.service.ts:631-663   → autoConfirm() with legacy skip
apps/backend/src/scheduler/scheduler.service.ts:22 → @Cron(EVERY_MINUTE)
apps/backend/prisma/schema.prisma                 → Order.amount Int? definition

PM2 output sample (every minute):
WARN [OrderService] Skip legacy order #12: amount is missing (legacy order)
LOG  [SchedulerService] ✅ 订单 #12 自动确认完成
```
