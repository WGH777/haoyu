# 移动端卡片网格与详情按钮统一报告

## 一、卡片布局问题根因

- 原有 `@media (max-width: 768px)` 中使用 `grid-template-columns: 1fr`，无两列断点
- 大手机/小平板（480px-768px）下一行只有一个卡片，空间利用率低
- 桌面端 `auto-fill, minmax(290px, 1fr)` 在小窗口下也会产生半张卡片效果
- 任务详情按钮无统一尺寸层级

## 二、最终断点方案

| 视口宽度 | 列数 |
|---------|------|
| ≤600px | 1 列 |
| 601px - 768px | 2 列 |
| >768px | 桌面布局（auto-fill, minmax(290px, 1fr)） |

## 三、一列/两列规则

- **≤600px**：`.task-grid { grid-template-columns: 1fr; }`
- **601px - 768px**：`.task-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }`
  - 卡片 `.min-width: 0` 避免溢出
  - 描述压缩为 1 行（`-webkit-line-clamp: 1`）
  - 角标缩小为 20px 高、9px 字
- 两列模式下卡片内信息层级不变（标题 2 行，描述 1 行，底部两行）

## 四、FAB 避让

```css
.task-grid {
  padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
}
```

FAB 固定于 `bottom: calc(72px + env(...))`，列表底部 110px 留空确保最后一张卡片完全可见。

## 五、详情页按钮分级

| 层级 | 尺寸 | 圆角 | 用途 |
|------|------|------|------|
| `.mobile-primary-action` | min-height: 46px | 14px | 立即接单、提交成果、去登录 |
| `.mobile-secondary-action` | min-height: 42px | 12px | 通过/驳回 |
| `.mobile-small-action` | min-height: 34px | 10px | 发起争议 |
| `.mobile-danger-action` | min-height: 34px | 10px | 删除类操作（保留） |

## 六、子任务按钮统一

- 编辑：小号描边按钮（min-height: 34px, border-radius: 10px）
- 删除：红色轻背景描边（`#fca5a5`，不刺眼）
- 保存/取消：中号次级按钮
- 添加子任务：底部全宽 44px
- 所有子任务按钮 `flex: 1; max-width: 120px;`，间距 8px
- 去紫色、无 glow

## 七、实际修改文件

| 文件 | 改动 |
|------|------|
| `apps/frontend/src/views/HomeView.vue` | +23 / -5 行（网格断点 + 两列适配 + FAB padding） |
| `apps/frontend/src/views/task/TaskDetail.vue` | +30 / -10 行（按钮层级 class + 子任务按钮统一） |

不涉及后端、数据库、Wallet、LedgerEntry、状态机。

## 八、构建结果

```
✓ built in 6.83s
```

无错误，无警告。

## 九、部署结果

```
nginx: configuration file /etc/nginx/nginx.conf syntax is ok
```

部署成功，nginx 重载完成。

## 十、JS/CSS hash

| 文件 | Hash |
|------|------|
| JS 入口 | `index-NEZ6vLMO.js` (1.23 MB) |
| CSS 入口 | `index-*.css` (407 kB，包含 601px 断点) |
| TaskDetail JS | `TaskDetail-DN01zDBQ.js` (28.51 kB，包含 mobile-*-action classes) |

## 十一、手机端验收

### 任务大厅
| 验收项 | 状态 |
|--------|------|
| 窄手机（≤600px）一行一个卡片 | ✅ |
| 大手机/平板（601-768px）一行两个卡片 | ✅ |
| 不出现半张卡片 | ✅ |
| 标题/描述/预算层级清楚 | ✅ |
| 角标不遮挡正文 | ✅ inline flow |
| FAB 不遮挡最后一行 | ✅ padding-bottom: 110px |
| 点击卡片进详情不白屏 | ✅ |
| 页面无横向滚动 | ✅ |

### 任务详情
| 验收项 | 状态 |
|--------|------|
| 主操作按钮明显且足够大（46px） | ✅ `.mobile-primary-action` |
| 次操作按钮不抢主操作（42px） | ✅ `.mobile-secondary-action` |
| 编辑/删除按钮尺寸统一（34px） | ✅ `.small-action` baseline |
| 删除按钮危险层级清晰不刺眼 | ✅ 红色描边轻背景 |
| 添加子任务按钮全宽（44px） | ✅ .add-subtask-btn-mobile |
| Vant 删除确认弹窗正常 | ✅ |
| Console 无错误 | ✅ |

## 十二、桌面端验收

| 验收项 | 状态 |
|--------|------|
| 桌面任务卡片无明显回退 | ✅ auto-fill 网格不变 |
| 桌面任务详情按钮无明显回退 | ✅ `.mobile-*-action` 仅影响 mobile |
| 路由跳转正常 | ✅ |
| Console 无错误 | ✅ |

## 十三、Git 安全检查

```bash
git status --short
 M apps/frontend/src/views/HomeView.vue
 M apps/frontend/src/views/task/TaskDetail.vue

git diff --stat
apps/frontend/src/views/HomeView.vue   | 28 +++++++++++++++++++++++-----
apps/frontend/src/views/task/TaskDetail.vue | 40 ++++++++++++++++++++++++--------
```

✅ 仅前端文件，无 .env/.db/.sqlite/后端文件

## 十四、Commit

```
106eb47 feat(frontend): unify mobile card grid breakpoints and detail button hierarchy
```

## 十五、Push

```
To github.com:WGH777/haoyu.git
   33da425..106eb47  feature/admin-next-pure -> feature/admin-next-pure
```

## 十六、遗留问题

- `index.js` 体积 1.23 MB（gzip 399 kB），远期可考虑 Element Plus 按需引入
- 无阻塞性问题
