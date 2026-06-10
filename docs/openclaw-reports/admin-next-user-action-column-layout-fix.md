# 后台用户管理桌面端操作列布局优化报告

## 1. 问题现象

桌面端后台用户管理页面「操作」列按钮布局不协调。4 个操作按钮（重置密码、封禁/解封、调整角色）堆叠拥挤，行高不稳定，操作区域视觉混乱。

## 2. 根因

- 操作列 `el-table-column` 固定 `width="160"`，不足以容纳 4 个按钮
- 按钮没有容器包装，依赖 Element Plus 默认内联布局和按钮间 `margin-left`
- 按钮直接在列内平铺，无换行控制

## 3. 操作列所在文件

`apps/admin-next/src/views/users/index.vue`

## 4. 操作列宽度调整

| 修改前 | 修改后 |
|--------|--------|
| `width="160"` | `min-width="220"` + `class-name="user-action-column"` |

## 5. 按钮布局方案

- 新增 `<div class="user-action-buttons">` 容器包裹所有操作按钮
- 使用 CSS `display: flex; flex-wrap: wrap; gap: 6px; max-width: 220px;`
- 按钮高度统一 `28px`，内边距 `0 8px`，字号 `12px`，圆角 `6px`
- 覆盖 Element Plus 默认 `margin-left: 0`（`.user-action-buttons .el-button + .el-button`）
- 调整角色按钮从 `type="primary"` 改为 `type="warning"`，统一描边层级

布局效果：
```
┌──────────────────────┐
│ 重置密码        封禁 │
│ 调整角色             │
└──────────────────────┘
```

## 6. 是否影响移动端

**否。** 移动端卡片使用独立的 `.card-actions` class，桌面端按钮容器使用 `.user-action-buttons` class，两者不冲突。移动端布局不受影响。

## 7. 是否改业务逻辑

**否。** 仅修改 CSS 布局和按钮容器结构。所有函数名、业务逻辑、弹窗逻辑、权限判断完全不变。

## 8. 实际修改文件

`apps/admin-next/src/views/users/index.vue`

## 9. 构建结果

```
✓ built in 12.22s
✓ 打包后的大小为 2.26 MB
```

## 10. 部署结果

部署路径：`/home/web/html/haoyu-admin-next/`

- 源站验证：✅ HTTP 200
- 新 JS 资源可访问：✅
- 新 CSS 资源可访问：✅

## 11. JS/CSS hash

| 文件 | hash |
|------|------|
| JS entry | `index-D0UDPW_I.js` |
| User chunk | `user-DuARcWwl.js` |
| CSS | `index-CMZj8F5p.css` |

## 12. 桌面端验收

源站已验证，新 index.html 正确引用新 JS/CSS 资源。

Cloudflare CDN 可能暂时缓存旧 HTML，待缓存过期或手动清除后即可看到完整布局效果。

## 13. 移动端验收

移动端 `.card-actions` 样式未修改，不受影响。无需额外验证。

## 14. Git 安全检查

```
 apps/admin-next/src/views/users/index.vue | 34 ++++++++++++++++++++++++-----
 1 file changed, 29 insertions(+), 5 deletions(-)
```

- 未修改后端文件 ✅
- 未修改数据库 ✅
- 未修改 Wallet/LedgerEntry ✅
- 未修改任务/订单状态机 ✅
- 未使用 `git add .` ✅

## 15. commit

```bash
git add apps/admin-next/src/views/users/index.vue
git commit -m "fix(admin): 优化用户管理桌面端操作列按钮布局

- 操作列宽度从 160px 改为 min-width:220px
- 新增 .user-action-buttons flex-wrap 容器
- 按钮高度统一 28px，间距 6px，圆角 6px
- 覆盖 Element Plus 默认按钮 margin-left
- 调整角色按钮 type 从 primary 改为 warning
- 移动端卡片不受影响"
```

## 16. push

```bash
git push
```

## 17. 报告路径

`docs/openclaw-reports/admin-next-user-action-column-layout-fix.md`

## 18. 遗留问题

1. **Cloudflare CDN 缓存**：`admin.haoyulv.com` 通过 Cloudflare 代理，旧 HTML 可能被缓存。由于未找到 Cloudflare API 凭据，暂无法自动清除缓存。预计随 TTL 自然过期。
2. **按钮行高自然增长**：部分用户可能显示 3 个按钮（如 ACTIVE + 非 SUPER_ADMIN 角色），2 行布局；部分用户显示 2 个按钮（如 SUSPENDED + 非 SUPER_ADMIN），1 行布局。属于预期行为。
3. **1280px 窄屏**：若在 1280px 及以下仍需进一步优化，可将 `min-width` 提高到 `240px`。
