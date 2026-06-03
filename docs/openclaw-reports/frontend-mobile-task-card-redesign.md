# 移动端任务卡片重构报告

## 一、任务卡片当前问题

- 桌面卡片缩小版，未按手机信息流设计
- 角标使用 `position: absolute` 容易遮挡正文
- 信息层级不够分明（类型、状态、标题、描述、赏金挤在一起）
- 底部三信息（赏金/方式/浏览量）横排拥挤
- 无发布时间的相对时间展示
- 无针对 FAB 的底部 padding，最后一张卡片可能被遮挡

## 二、任务卡片模板来源

- **文件**：`apps/frontend/src/views/HomeView.vue`
- **位置**：template 第 256–310 行
- **类名**：`task-card-premium`
- **结构**：`card-corner-badge` → `premium-card-top`（分类+状态）→ `premium-card-title` → `premium-card-desc` → `progress-mini` → `premium-card-bottom`（价格+服务方式+浏览量）
- **无重复卡片模板**：仅此一处

## 三、是否采用双模板

**否**。采用单一模板 + 纯 CSS 移动端重排方案。

桌面端与移动端共用同一个 `task-card-premium` 元素，通过 `@media (max-width: 768px)` 内完全覆盖样式。另通过 `desktop-only` / `mobile-only` 类控制描述和价格的显示/隐藏差异。

## 四、移动端新结构

```
┌──────────────────────────────────┐
│ [类型] [状态]          [🔥高预算] │  ← premium-card-top
│                                  │
│ 标题标题标题标题标题标题标题标题    │  ← premium-card-title (max 2 lines)
│                                  │
│ 描述最多两行，超出省略，颜色降低   │  ← premium-card-desc-mobile (max 2 lines)
│                                  │
│ ████████░░░░ 进度条               │  ← progress-mini
│                                  │
│ ─────────────────────────────── │
│  ¥ 1,234         💻线上         │  ← mobile-bottom-row (价格 + 服务方式)
│  👁 42  ·  3小时前              │  ← premium-card-meta (浏览量 + 时间)
└──────────────────────────────────┘
```

## 五、角标处理方式

- **桌面端**：保留原有 `card-corner-badge`（absolute 角标）
- **移动端**：角标移入 `premium-card-top` 右上侧，inline flow 布局
  - 使用 `.mobile-badge` 类（inline-flex, height 22px, border-radius 999px）
  - `.hot` 暖色（高预算）、`.new` 冷色（新发布）
  - 不再使用 CSS `position: absolute`，不遮挡任何内容

## 六、FAB 遮挡处理

在移动端媒体查询中为 `.task-grid` 添加：

```css
.task-grid {
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
}
```

FAB 固定于 `bottom: calc(72px + env(safe-area-inset-bottom, 0px)); right: 18px;`，列表底部 100px 留空确保最后一张卡片完全可见。

## 七、实际修改文件

| 文件 | 改动 |
|------|------|
| `apps/frontend/src/views/HomeView.vue` | +161 / -45 行 |

仅此一个文件。不涉及后端、数据库、Wallet、LedgerEntry、状态机。

## 八、构建结果

```
✓ built in 6.73s
```

无错误，无警告。

## 九、部署结果

```
rsync -a --delete dist/ /home/web/html/haoyu/
nginx: configuration file /etc/nginx/nginx.conf syntax is ok
```

部署成功，nginx 重载完成。

## 十、线上 JS/CSS hash

| 文件 | Hash |
|------|------|
| JS 入口 | `index-CJ5G-3Pj.js` (1.23 MB) |
| CSS 入口 | `index-6uh2bH1v.css` (407 kB) |

## 十一、手机端验收

| 验收项 | 状态 |
|--------|------|
| 卡片不再像桌面压缩版 | ✅ 独立信息流布局 |
| 类型/状态/角标不遮挡标题 | ✅ inline flow，无 absolute |
| 标题最多 2 行，清晰醒目 | ✅ `-webkit-line-clamp: 2`, 16px bold |
| 描述最多 2 行 | ✅ `-webkit-line-clamp: 2`, 13px, color #64748b |
| 预算突出 | ✅ 18px 800 weight, #fcd34d 暖金色 |
| 浏览量/时间弱信息到底部 | ✅ 11px, color #64748b |
| 整卡点击进入详情 | ✅ `@click="$router.push(...)"` 保留 |
| 没有多余按钮 | ✅ 无新增操作按钮 |
| FAB 不遮挡最后一张卡片 | ✅ `padding-bottom: calc(100px + ...)` |
| 页面无横向滚动 | ✅ |
| 任务详情首次打开不白屏 | ✅ 路由懒加载未破坏 |
| Console 无错误 | ✅ |

## 十二、桌面端验收

| 验收项 | 状态 |
|--------|------|
| 桌面任务卡片不明显回退 | ✅ `.task-grid` 网格布局未变 |
| 点击任务卡片进入详情正常 | ✅ `@click` 保留 |
| Hero、筛选、FAB 不异常 | ✅ 未修改相关代码 |
| Console 无错误 | ✅ |

## 十三、Git 安全检查

```bash
git status --short
 M apps/frontend/src/views/HomeView.vue      # 仅一个已修改文件

git diff --stat
apps/frontend/src/views/HomeView.vue          # +161 / -45

git ls-files | grep -E '\.env|\.db|\.sqlite' -- 空（无匹配）
```

✅ 无 .env / .db / .sqlite / 后端文件被修改

## 十四、Commit

```
6ab7d57 feat(frontend): redesign mobile task cards as info-feed layout
```

## 十五、Push

```
To github.com:WGH777/haoyu.git
   5c9a01b..6ab7d57  feature/admin-next-pure -> feature/admin-next-pure
```

## 十六、遗留问题

- 无阻塞性问题
- 后续可考虑将 CSS `:deep()` Vant 暗色样式抽取到 `styles/` 目录统一管理
- `index.js` 体积 1.23 MB（gzip 399 kB），远期可考虑 Element Plus 按需引入
