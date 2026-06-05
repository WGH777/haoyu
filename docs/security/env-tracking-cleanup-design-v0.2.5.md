# .env 跟踪历史与敏感配置清理设计文档

**版本**: v0.2.5 P0-1  
**状态**: 设计阶段（未执行）  
**设计时间**: 2026-06-05  

---

## 1. 当前仓库中被 git 跟踪的 .env / .env.production / .env.example 文件清单

### 跟踪文件清单

| # | 文件路径 | 是否跟踪 | 大小 | 内容类型 | 敏感程度 |
|---|---------|:------:|:----:|---------|:-------:|
| 1 | `apps/admin/.env.production` | ✅ 跟踪 | 173B | Vite 构建变量 | **低** |
| 2 | `apps/backend/.env.example` | ✅ 跟踪 | 20B | 示例配置模板 | **无** |

### 当前 .gitignore 规则（相关部分）

```gitignore
# 3. 忽略环境变量
.env
.env.*
!.env.example
```

- `.env` — 忽略根目录和子目录下所有 `.env` 文件 ✅
- `.env.*` — 忽略 `.env.production`、`.env.development` 等变体 ✅
- `!.env.example` — 特意解除忽略，允许跟踪示例文件 ✅

### 未跟踪的 .env 文件（不在版本管理）

| 文件路径 | 大小 | 说明 |
|---------|:----:|------|
| `apps/backend/.env` | 309B | 后端真实环境变量（含敏感值）→ 当前被 `.gitignore` 保护 |
| `apps/admin/.env` | 116B | admin 本地开发环境变量 → 被 `.gitignore` 保护 |
| `apps/admin-next/.env` | 176B | admin-next 本地开发环境变量 → 被 `.gitignore` 保护 |

### 与 `.gitignore` 的匹配验证

```bash
git check-ignore apps/admin/.env.production   # exit=1（不匹配）
git check-ignore apps/backend/.env.example    # exit=1（不匹配，expclict unignore）
git check-ignore apps/backend/.env             # exit=0（匹配，正确忽略）
git check-ignore apps/admin/.env               # exit=0（匹配，正确忽略）
git check-ignore apps/admin-next/.env          # exit=0（匹配，正确忽略）
```

**关键发现**: `apps/admin/.env.production` 在 `.gitignore` 规则下本应被忽略（匹配 `.env.*`），但由于该文件已被 git 跟踪，.gitignore 规则对已跟踪文件不生效。`git check-ignore` 返回 1 不代表规则不匹配，而是因为文件已跟踪。

---

## 2. 判断哪些是敏感文件，哪些只是 Vite 公共变量

### apps/admin/.env.production — 内容审查

```ini
# 线上环境平台打包路径
VITE_PUBLIC_PATH = /

# 线上环境路由历史模式
VITE_ROUTER_HISTORY = "h5"

# 是否在打包时使用cdn替换本地库
VITE_CDN = false

# 是否启用gzip/brotli压缩
VITE_COMPRESSION = "none"
```

**结论**: 不含任何敏感信息。

所有变量均为 `VITE_*` 前缀的 Vite 构建公开变量：
- 路径配置（`/`）— 公共，非敏感
- 路由模式（`h5`）— 公共，非敏感
- 构建开关（`false`, `none`）— 公共，非敏感

**分类**: ⚠️ 不应跟踪，但目前无害。更像一个应通过 `.env.example` 提供的配置示例。

### apps/backend/.env.example — 内容审查

```ini
JWT_EXPIRES_IN=7d
```

**结论**: 纯示例模板，不含真实密钥、数据库连接串或 token。`.gitignore` 特意解除忽略（`!.env.example`），属正常情况。

**分类**: ✅ 应当跟踪，无风险。

---

## 3. 是否需要从当前索引移除

### 分析

| 文件 | 当前状态 | 风险评分 | 建议 |
|------|---------|:-------:|------|
| `apps/admin/.env.production` | 已跟踪，非敏感 | ⚠️ **1/5** | **建议移除跟踪**，纳入 `.gitignore` 保护机制 |
| `apps/backend/.env.example` | 已跟踪，纯示例 | ✅ **0/5** | **保持跟踪**，当前设计正确 |

### 为什么要移除 `apps/admin/.env.production`

1. **原则一致**: `.gitignore` 已声明忽略 `.env.*`，此文件不应例外
2. **防止退化**: 如果有人后续向此文件添加真实敏感值（如 API key），git 会将其记入历史
3. **简化审计**: 所有 .env 变体统一为未跟踪状态，安全边界清晰
4. **发布风险**: `VITE_COMPRESSION = "none"` 虽不敏感，但未来新增 `VITE_API_SECRET="xxx"` 将无预警暴露

### 移除方式

```bash
git rm --cached apps/admin/.env.production
```

- `--cached` 仅从索引移除，**不影响工作区文件**
- 不会影响 Docker nginx 的 `vite build`（构建时读的是工作区文件，不是 git 索引）
- 不会影响 PM2 进程（前端部署不依赖 PM2）

### 保留理由（apps/backend/.env.example）

- `.gitignore` 中 `!.env.example` 明确表示示例文件应被跟踪
- 内容不敏感，长期维护也不会有敏感数据
- 作为后端配置的文档，方便新开发者了解需要设置哪些环境变量

---

## 4. 是否需要清理历史

### 分析

| 维度 | 评估 |
|------|------|
| 当前文件内容是否敏感 | ❌ 否，仅 Vite 公共变量 |
| 历史版本中是否存在敏感值 | ❌ 未发现（首次提交 `66c789f` 至今内容和当前相同） |
| 是否曾在历史中加入过真实密钥 | ❌ 无记录 |
| 该文件是否存在于多个分支 | ✅ 是：`feature/admin-next-pure`、`main`、`spike/admin-backend-framework-selection` |
| 影响范围 | 3 个分支，5 个远端引用 |

### 结论

**当前不执行历史清理（filter-repo / BFG）。**

理由：

1. **内容无害**: 历史中包含的始终是 Vite 构建公开变量，无密码、token、secret
2. **filter-repo 破坏性大**: 重写历史需要 force push，影响所有协作者和 CI
3. **成本收益比**: 清理历史（3 分支 + force push）vs 什么也不做 — 当前收益为零
4. **可略过**: 从 `git rm --cached` 后，新 clone 不会获得此文件，历史是只读的

### 遗留条件

如果未来有更严格的合规要求（如 SOC2、ISO 27001 审计要求 git 历史零敏感文件），再考虑 filter-repo。届时：

- 使用 `git filter-repo --path apps/admin/.env.production --invert-paths`
- 所有涉及该文件的分支均需 force push
- 所有协作者需重新 clone

---

## 5. 是否需要轮换密钥

**不需要。**

- `apps/admin/.env.production` 中无任何密钥、密码、token、连接串
- `apps/backend/.env.example` 仅仅是示例值 `JWT_EXPIRES_IN=7d`，非真实 JWT_SECRET
- 真实 `.env` 文件（`apps/backend/.env`、`apps/admin/.env`、`apps/admin-next/.env`）未被跟踪，未泄露

---

## 6. 是否需要更新 `.gitignore`

### 当前规则

```gitignore
.env
.env.*
!.env.example
```

### 问题

当前的 `.env.*` 规则匹配所有 `.env.xxx` 变体，但 `apps/admin/.env.production` 已跟踪，`.gitignore` 对其不生效。

### 建议

**无需更改 `.gitignore` 规则本身**，但建议在 `.gitignore` 中添加一条注释提示，明确说明当前已跟踪的 .env 文件情况，避免未来再次误提交。

建议追加：

```gitignore
# NOTE: apps/admin/.env.production 此前已被 git 跟踪，
# 需执行 git rm --cached 解除跟踪后方可生效。
# 解除后若误提交新 .env.* 文件，使用 git restore --staged 撤回。
```

### 好处

- 保留原始规则不变（已有规则正确）
- 注释作为文档，下次有 .env 文件意外追踪时提供操作指引
- `.env.example` 继续被 unignore，维持正常

---

## 7. 是否需要补充 `.env.example`

### 现状

| 模块 | 是否有 `.env.example` | 状态 |
|------|:-------------------:|:----:|
| `apps/backend/` | ✅ `apps/backend/.env.example` | 良好，已跟踪 |
| `apps/admin/` | ❌ 无 `.env.example` | **缺失**（当前 `.env.production` 替代了此角色） |
| `apps/admin-next/` | ❌ 无 `.env.example` | **缺失** |
| `apps/frontend/` | ❌ 无 `.env.example` | **缺失** |

### 建议

`git rm --cached` 解除 `apps/admin/.env.production` 跟踪后，创建以下 .env.example 文件（仅设计，经确认后执行）：

```bash
# 创建 admin 的 .env.example
touch apps/admin/.env.example

# 创建 admin-next 的 .env.example
touch apps/admin-next/.env.example
```

### admin/.env.example 内容建议

```ini
# Admin 前端构建配置
# VITE_* 变量在构建时嵌入，可在 .env.production / .env.development 中覆盖

# 线上环境平台打包路径
VITE_PUBLIC_PATH = /

# 线上环境路由历史模式
VITE_ROUTER_HISTORY = "h5"

# 是否在打包时使用cdn替换本地库
VITE_CDN = false

# 是否启用gzip/brotli压缩（可选: "gzip" / "brotli" / "none"）
VITE_COMPRESSION = "none"
```

### admin-next/.env.example 内容建议

```ini
# Admin Next 前端构建配置

# API 基础路径（生产环境应置为 /api）
VITE_API_URL = /api
```

### 说明

- `.env.example` 区别于 `.env.production`：example 是文档性质的模板，不会在构建时被 vite 读取；`.env.production` 会被 vite 自动加载
- 解除 `.env.production` 跟踪后，需要在宿主机保留一个 `.env.production` 用于 `vite build`，但不纳入 git
- 现有的部署文档（`haoyu-deployment-guide-v0.2.4.md`）已说明构建过程，只需明确强调 `.env.production` 需手动放置于部署目录

---

## 8. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:----:|:----:|---------|
| `git rm --cached` 后本地 `.env.production` 被 Delete | 极低 | 中 | `--cached` 只删索引，保留工作区文件 |
| 部署时忘记保留 `.env.production` 导致构建异常 | 中 | 高 | 部署脚本中显式 check 文件存在；部署文档已写明前置条件 |
| 其他人 clone 后拿不到 `.env.production` 示例 | 中 | 低 | 用 `.env.example` 替代示例角色，内容一致 |
| 历史中曾存在敏感值未发现 | 低 | 高 | 已检查首次提交至今的所有 diff，无敏感值 |
| filter-repo 意外执行 | 极低 | 高 | 本阶段不执行，明确排除在 scope 外 |
| 其他开发者重新 add .env.production | 低 | 低 | `.gitignore` 已匹配 `.env.*`，阻止自动 add；force add 需显式 `-f` |
| 影响 CI/CD 流水线 | 低 | 中 | 检查 CI 中是否有 `git pull` 后依赖此文件的操作 |

---

## 9. 回滚方案

### 方案 A：如果 `git rm --cached` 后需要恢复跟踪

```bash
git reset HEAD apps/admin/.env.production
git restore --staged apps/admin/.env.production
git checkout HEAD -- apps/admin/.env.production
```

或者更直接：

```bash
git reset apps/admin/.env.production     # 从 index 恢复
```

以上操作均**不影响工作区文件**，仅恢复 git 索引记录。完全可逆。

### 方案 B：如果提交后发现遗漏（未纳入 `.gitignore` 补充提交）

```bash
# 补充提交
echo "# extra rule" >> .gitignore
git add .gitignore
git commit -m "chore: update gitignore for env tracking"
```

### 方案 C：恢复历史中的 .env.production（恢复跟踪）

```bash
git show main:apps/admin/.env.production > apps/admin/.env.production
git add apps/admin/.env.production
git commit -m "fix: restore .env.production tracking"
```

### 方案 D：如果部署脚本依赖 git 中的 .env.production（最坏情况）

```bash
# 临时从历史恢复
git show v0.2.4:apps/admin/.env.production > apps/admin/.env.production
# 然后正常构建
cd apps/admin && pnpm build
```

---

## 10. 分阶段执行步骤

### Phase 1：设计完成（当前阶段）

- [x] 审计被跟踪的 .env 文件清单
- [x] 判断敏感程度（均为非敏感）
- [x] 完成设计文档 ✅

### Phase 2：用户确认

- [ ] 用户审阅设计文档
- [ ] 用户确认执行或调整方案

### Phase 3：执行（用户确认后）

```bash
# Step 1: 从索引移除，保留工作区文件
git rm --cached apps/admin/.env.production

# Step 2: 更新 .gitignore（添加注释说明）
# 无需修改规则本身，仅追加注释

# Step 3: 创建补充的 .env.example（可选）
touch apps/admin/.env.example
touch apps/admin-next/.env.example

# Step 4: 提交变更
git add apps/admin/.env.example  # 如有新建
git add apps/admin-next/.env.example  # 如有新建
git add .gitignore
git commit -m "chore: remove .env.production from tracking, add .env.example for admin/admin-next"

# Step 5: 推送
git push
```

### Phase 4：验证

```bash
# 验证索引中已无 .env.production
git ls-files | grep '\.env' 
# 应只有 apps/backend/.env.example（和新建的 .env.example）

# 验证工作区文件仍然存在
ls -la apps/admin/.env.production

# 验证 admin-next 构建正常（如有 .env.production 依赖）
cd apps/admin-next && echo "VITE_API_URL=/api" > .env.production && pnpm build

# 清理测试用 .env.production
rm apps/admin-next/.env.production
```

### Phase 5：文档更新

- [ ] 更新 `haoyu-deployment-guide-v0.2.4.md`：明确 `.env.production` 需要手动放置
- [ ] 更新 `deploy-admin-next.sh`（如果有）：加入 `.env.production` 存在性检查
- [ ] 在 `.gitignore` 注释中说明已跟踪情况

---

## 附录

### A. 影响分支清单

| 分支 | 本地 | 远端 | 有 .env.production |
|------|:----:|:----:|:----------------:|
| `feature/admin-next-pure` | ✅ | origin | ✅ 当前工作分支 |
| `main` | ❌ | origin | ✅ 仅远端 |
| `spike/admin-backend-framework-selection` | ❌ | origin | ✅ 仅远端（spike 分支，不活跃） |

### B. 不执行的操作（严格禁止）

| 操作 | 原因 |
|------|------|
| ❌ `git rm`（不带 --cached） | 会从文件系统删除，破坏构建 |
| ❌ `git filter-repo` / BFG | 破坏 git 历史，需要 force push，当前无必要 |
| ❌ `force push` | 覆盖远端历史 |
| ❌ 修改代码 | 不在本任务范围内 |
| ❌ 修改数据库 | 不在本任务范围内 |
| ❌ 创建 tag | 由发布流程控制 |
| ❌ `git add .` | 精确 add，不批量 |

### C. 参考文档

- `.gitignore` — 当前忽略规则
- `haoyu-deployment-guide-v0.2.4.md` — 部署文档
- `v0.2.5-roadmap.md` — 阶段路线图
- 本次审计输出中的 `git ls-files | grep '\.env'` 结果
