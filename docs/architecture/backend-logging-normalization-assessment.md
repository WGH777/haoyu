# 后端日志规范化评估报告

> 版本：v0.2.4  
> 日期：2026-06-03  
> 只读评估，未修改代码

---

## 一、当前日志来源

| 来源位置 | 文件 | 引擎 | 日志量 |
|---------|------|------|--------|
| `OrderService` | `order.service.ts:646` | `NestJS Logger` | 高（每分钟重复） |
| `SchedulerService` | `scheduler.service.ts:24,45,54,83,109,113,132` | `NestJS Logger` | 中（每分钟多行） |
| `HttpExceptionFilter` | `http-exception.filter.ts:63` | `console.error` | 低（按请求触发） |
| `AdminController` | `admin.controller.ts:243` | `console.error` | 低（按操作触发） |
| `main.ts` | `main.ts:61-62` | `console.log` | 低（启动时一次） |

### 使用的 Logger 引擎

- `OrderService`、`SchedulerService`：NestJS 内置 Logger（带模块名前缀、颜色）
- 其余位置：原生 `console.log` / `console.error`（不带 NestJS 格式化）

---

## 二、每分钟重复 WARN 来源

### 来源链

```
SchedulerService (cron *每分钟*)
  → OrderService.autoConfirm(orderId=12)
    → checkLegacyOrder() → "amount is missing (legacy order)"
    → logger.warn("Skip legacy order #12: ...")          ← WARN 源头
    → return order（静默返回，不抛异常）
  → SchedulerService 收到 order（非 undefined）
    → logger.log("✅ 订单 #12 自动确认完成")              ← 误导 LOG
```

### 时序

| 时间 | 日志 | 级别 |
|------|------|------|
| T+0s | `WARN Skip legacy order #12: amount is missing (legacy order)` | WARN |
| T+0s | `LOG  ✅ 订单 #12 自动确认完成` | LOG |
| T+60s | 重复... | |

### 统计

| 指标 | 值 |
|------|-----|
| 最近 2000 行日志中 WARN 总数 | 574 条 |
| 其中 #12 相关 WARN | 574 条（100%） |
| 其中非 #12 的 WARN | 0 条 |
| 误导性 `✅ 订单 #12` LOG 数 | 574 条 |
| 每小时日志增量 | ≈120 条 / 小时 |

---

## 三、WARN 分类：业务风险 vs 遗留数据噪声

| 日志 | 级别 | 分类 | 判断依据 |
|------|------|------|---------|
| `Skip legacy order #12` | WARN | **遗留噪声** | 订单 #12 创建于 2025-12，早于钱包迁移 2026-05-26，属测试数据 |
| `订单 X 超时预警（48h）` | LOG | 预期行为 | ~500 元任务 48h 预警，属正常业务通知 |
| `订单 X 高风险超时` | WARN | **业务风险** | HIGH 风险等级订单需人工处理 |
| `订单 X 超时取消失败` | WARN | **业务风险** | 处理异常，需关注 |
| `订单 X 自动处理失败` | ERROR | **业务风险** | 需立即排查 |
| `DualSignService 注入失败` | ERROR | 历史遗留 | 5/19 的历史错误，当前已修复 |
| `对账发现异常` | ERROR | **业务风险** | 钱包不一致漂移 -35000 分 |

### 结论

**全部 574 条当前循环 WARN 均为遗留数据噪声，非业务风险。**  
真正的业务风险 ERROR 仅有 1 条（对账异常 -35000 分）。

---

## 四、日志质量问题

### 4.1 缺乏请求上下文

当前日志无法关联到具体请求（userId、requestId、sessionId）。排查问题需靠时间戳交叉比对。

### 4.2 日志格式不一致

| 引擎 | 格式 | 示例 |
|------|------|------|
| NestJS Logger | `[Nest] PID - [TIME] [Level] [ModuleName] message` | `[Nest] 2686276 - [06/03/2026, 1:23:00 PM] WARN [OrderService] Skip legacy order #12...` |
| console.error | `ERROR message` | `创建用户钱包失败:`（HttpExceptionFilter 自带 `[HttpExceptionFilter]` 前缀） |

### 4.3 误导日志

`✅ 订单 #12 自动确认完成` 使用 checkmark emoji + "完成" 字样，但实际并未完成结算。对人工排查造成误导。

### 4.4 日志膨胀

11 MB 的 out log 中 #12 噪声占据大量空间。长期运行会快速膨胀。

---

## 五、建议

### 5.1 立即修复项（v0.2.4）

| # | 建议 | 影响 | 风险 |
|---|------|------|------|
| A | `checkLegacyOrder` 命中后使用 `logger.log`（非 `logger.warn`） | 消除每分钟 WARN 噪声 | 低 |
| B | `autoConfirm` legacy skip 后返回 `null` 或新类型，Scheduler 不记录 `✅` | 消除误导 LOG | 低 |
| C | `autoConfirm` 增加 legacy skip 后的 token bucket 或跳过记录，避免每分钟重试 | 消除全部每分钟重复 | 中 |

### 5.2 中期改进（v0.2.5）

| # | 建议 | 说明 |
|---|------|------|
| D | 统一所有日志源为 NestJS Logger | 替换 `console.log/error` 为 `this.logger.log/error` |
| E | 引入 `LoggingInterceptor` 自动记录请求级别日志 | requestId、path、method、duration、userId |
| F | ERROR 级增加 `ReconciliationService` 对账异常上下文 | 记录具体 walletId、漂移明细 |

### 5.3 长期架构（v0.2.6+）

| # | 建议 | 说明 |
|---|------|------|
| G | 使用 `pino` 或 `winston` 作为 NestJS Logger 后端 | 结构化 JSON 日志，方便 ELK / Loki |
| H | 日志级别运行时可配置 | DEBUG/LOG/WARN/ERROR 通过环境变量切换 |
| I | 请求追踪（trace ID） | 跨服务调用链路追踪 |

---

## 六、不修改项确认

| 禁止项 | 是否涉及 |
|--------|---------|
| 修改数据库 | ❌ 未涉及 |
| 修改 Wallet/LedgerEntry | ❌ 未涉及 |
| 修改任务/订单状态机 | ❌ 未涉及 |
| 直接修改订单 #12 amount | ❌ 未涉及（订单就是 legacy 数据） |

---

## 七、附录：当前日志格式参考

### NestJS Logger 输出格式

```
level  colors:    灰=LOG  黄=WARN  红=ERROR
[Nest] PID - [MM/DD/YYYY, h:mm:ss AM/PM]  LEVEL  [ModuleName] message

示例：
LOG:  [Nest] 2686276 - [06/03/2026, 1:23:00 PM]    LOG  [SchedulerService] ✅ 订单 #12 自动确认完成
WARN: [Nest] 2686276 - [06/03/2026, 1:23:00 PM]   WARN  [OrderService] Skip legacy order #12: amount is missing (legacy order)
ERROR:[Nest] 2686276 - [06/03/2026, 1:23:00 PM]  ERROR  [ReconciliationService] ❌ 对账发现异常
```

### 控制台日志格式

```
console.log: Application is running on: http://127.0.0.1:3000
console.error: [HttpExceptionFilter] { status: 500, error: 'InternalServerError', ... }
console.error: 创建用户钱包失败: WalletError: ...
```
