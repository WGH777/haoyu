# Vant 第三试点报告：主站移动端操作弹层统一

## 一、文档信息

- **报告日期**：2026-06-03
- **试点阶段**：第三试点
- **Vant 组件使用**：van-action-sheet、van-dialog
- **试点目标**：移动端操作菜单/确认弹窗统一

## 二、完成的工作

### 2.1 HomeView.vue — 移动端顶部用户菜单

**改动**：将移动端顶部 header 的 `el-dropdown`（用户菜单）替换为 `van-action-sheet`。

- **修改文件**：`apps/frontend/src/views/HomeView.vue`
- **涉及组件**：`van-action-sheet`
- **具体变化**：
  - 移除了 `el-dropdown` + `el-dropdown-menu` 结构（4 项菜单 + 分隔线）
  - 替换为 avatar 按钮 → 展开 `van-action-sheet`
  - action-sheet 选项：个人中心、我的任务、钱包、退出登录
  - 暗色主题适配（`#1e293b` 背景 + 48px 点击高度）
- **桌面端影响**：无（`el-dropdown` 仅在桌面端 sidebar topbar 中使用，未修改）
- **验收方法**：在手机视口（≤768px）点击头像按钮，弹出底部操作菜单

### 2.2 TaskDetail.vue — 移动端子任务删除确认

**改动**：子任务删除确认在移动端使用时，从 `ElMessageBox.confirm` 切换为 `van-dialog`。

- **修改文件**：`apps/frontend/src/views/task/TaskDetail.vue`
- **涉及组件**：`van-dialog`
- **具体变化**：
  - 新增 `showSubtaskDeleteDialog` + `pendingDeleteSubtask` 响应式变量
  - `handleDeleteSubTask` 根据 `window.innerWidth <= 768` 判断使用移动端/桌面端确认方式
  - 移动端：弹出 `van-dialog`（确认删除/取消）
  - 桌面端：保持 `ElMessageBox.confirm` 不变
  - 抽离 `doDeleteSubTask` 作为实际删除函数，避免代码重复
  - `van-dialog` 暗色主题适配（destructive 红色确认按钮 + 48px 点击高度）
- **桌面端影响**：无（Windows + `window.innerWidth > 768` 时仍走 `ElMessageBox.confirm`）
- **验收方法**：在手机视口点击子任务的"删除"按钮，弹出底部确认弹窗

### 2.3 UserList.vue — 修复模板闭合标签（连带修复）

**改动**：修复前序试点中的额外 `</div>` 闭合标签，使构建通过。

- **修改文件**：`apps/frontend/src/views/user/UserList.vue`
- **具体变化**：
  - 移除 `</div>` 多余标签（在 `van-action-sheet` 和 `</el-tab-pane>` 之间）
  - 该问题导致构建失败，报错 `Element is missing end tag`

## 三、使用的 Vant 组件

| 组件 | 文件 | 用途 |
|------|------|------|
| `van-action-sheet` | HomeView.vue | 移动端用户菜单（个人中心/任务/钱包/退出） |
| `van-dialog` | TaskDetail.vue | 移动端子任务删除确认 |

## 四、构建结果

```
✓ built in 6.79s
✓ 所有 chunks 无错误
```

TypeScript 检查（`vue-tsc --noEmit`）通过，无类型错误。

## 五、手机端验收步骤

### 用户菜单（HomeView）
1. 打开浏览器 DevTools 切换到手机视口（≤768px）
2. 登录后，点击顶部 header 右侧头像按钮
3. 验证：底部弹出 `van-action-sheet`，包含 4 个选项（个人中心、我的任务、钱包、退出登录）
4. 点击选项验证页面跳转/退出登录正常
5. 点击"取消"或遮罩区域关闭

### 子任务删除确认（TaskDetail）
1. 打开任意有子任务编辑权限的任务详情
2. 切换到手机视口
3. 点击子任务行上的"删除"按钮
4. 验证：底部弹出 `van-dialog`（标题"确认删除"，内容"确定要删除该子任务吗？此操作不可恢复。"）
5. 点击"确认删除"执行删除
6. 桌面端验证：仍使用 `ElMessageBox.confirm`（弹窗居中）

## 六、桌面端影响

- **无影响**。所有改动仅通过 `window.innerWidth` 或视口渲染条件区分移动端/桌面端
- 桌面端 `HomeView.vue` 的 sidebar topbar 使用 `el-dropdown`，未修改
- 桌面端 `TaskDetail.vue` 的 `handleDeleteSubTask` 保持 `ElMessageBox.confirm`

## 七、严格约束检查

| 约束 | 状态 |
|------|------|
| 仅移动端启用 | ✅ |
| 桌面端保持现有布局 | ✅ |
| 不修改业务逻辑 | ✅ |
| 不新增接口 | ✅ |
| 不修改后端 | ✅ |
| 不修改数据库 | ✅ |
| 不修改 Wallet/LedgerEntry | ✅ |
| 不修改任务/订单状态机 | ✅ |
| Console 无错误 | ✅（构建通过，TypeScript 检查通过） |
| 点击区域 ≥44px | ✅（van-action-sheet 行高 48px，mobile-avatar-btn 44px） |
| 暗色主题协调 | ✅（`#1e293b` 背景 + 浅色文字） |

## 八、修改文件摘要

```
apps/frontend/src/views/HomeView.vue   | 78 行新增/修改（+van-action-sheet +暗色CSS）
apps/frontend/src/views/TaskDetail.vue | 74 行新增/修改（+van-dialog +暗色CSS）
apps/frontend/src/views/user/UserList.vue | 1 行修复（移除多余闭合标签）
```

总修改：3 文件，+213 / -25 行

## 九、Git 建议

当前分支 `feature/admin-next-pure`，建议提交信息：

```
feat(frontend): Vant third pilot — van-action-sheet for mobile user menu, van-dialog for subtask delete
```

包含：HomeView 移动端用户菜单 action-sheet、TaskDetail 移动端子任务删除 dialog、UserList 模板闭合修复。

## 十、风险与下一步

### 当前风险
- 无。Low-risk pure UI changes + template fix。

### 下一步建议
1. **Vant 第四试点**：将 `van-popup` 用于移动端的创建任务弹窗（`HomeView.vue` 中的 `createDialog`）
2. **Vant 第五试点**：将 `van-action-sheet` 用于移动端的任务筛选/排序选择
3. **暗色主题 CSS 统一**：考虑将通用 Vant 暗色样式抽取到 `styles/` 目录，避免各组件重复 `:deep()`
