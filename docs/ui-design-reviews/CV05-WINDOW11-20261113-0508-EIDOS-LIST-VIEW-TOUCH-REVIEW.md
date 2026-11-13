# CV05 Window11 #05/08 — Eidos Collection Views Touch Target UI Review

> 2026-11-13。**同 PR UI 审查资料，非 Human 生产视觉签收**。实际主线基线 `main@c9ec5b5e9eef0019bb5392fe31bc23c76f9c23c5`。由原 Chromium screenshot/源文件复现，不用渲染想象图替代浏览器证据。

## 发现与屏幕证据

- 阅读上轮已合并 #1318 的 [Chromium screenshots artifact](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43422243845/artifacts/14034273210)，尤其 `my-suppliers-390-list.png` 和 `dictionary-390-list.png`：390px 下供应商「供应商 / 我的供应商」、字典「全部 / 草稿 / 已发布」呈现为紧贴的原生小按钮，明显小于旁边 44px Search / Pagination 的 Eidos 控件。
- 核对源文件 `vendor/eidos/src/catalog-browser/render.ts`：视图按钮已使用 `data-eidos-catalog-view-navigation`，每个有 `select-view-*` 的原合法 Domain 路由，当前选中原生 `aria-current="page"`。
- 核对源文件 `vendor/eidos/src/design-language/productive-workbench-css.ts`：Search/Pagination 已用 44px，原 CSS **没有上述 viewNavigation 的样式规则**，导致其落回浏览器默认按钮；Eidos Design Token `--eidos-touch-target:44px` 已存在，可直接复用。

## 设计决定 / 减法优先

- Eidos 统一层为每个按钮设定 `min-height` 与 `min-width` 为 `var(--eidos-touch-target)`，flex-wrap + token 间距；对 `aria-current="page"` 使用原蓝色/selected tokens，维持视觉可识别已选；`:focus-visible` 使用原 primary 外框，保持键盘使用者的焦点可见。
- 不增加页面菜单、View Model 字段、权限绕道、新 List 控件或 Supplier/Dictionary 定制 CSS。原 `data-eidos-route` / Controller / Host 重新授权语义不变。小屏可自动换行，控制不超出 390px viewport。
- 所有 Eidos 业务 Catalog 共同继承该规则；桌面亦不再显示无样式的原生小按钮。

## 对比方案及不采用原因

1. **采用**：共享 Eidos CSS，沿用原 HTML/route/aria-current；改动最小，与轻量 Host/业务插件继承原则一致。
2. **排除**：在 Supplier 与 Dictionary 各写一套 CSS，重复实现会造成不同插件视觉差异与回退风险。
3. **排除**：新增 View Tab 组件/新的导航事件，既有 Eidos 原 Controller 已支持完整行为，没有独立逻辑缺口。
4. **排除**：只加 CSS 静态断言而不做浏览器验收；之前的截图就是可见尺寸问题，须实际测量。

## 同一 PR 验收矩阵及边界

- 现有 `tests/cv05/real_host_agent_list_chromium.py` 对 **My Suppliers/Dictionary × 1280/390** 均测所有 `select-view-*` 的实际矩形 ≥44×44、位置在 viewport 内、恰好一个 `aria-current`，且实际 Enter（桌面）/tap（390）切换至另一 Domain View 后仍能回到原搜索、排序与分页。保留同套 A/B Owner、详情返回、横向溢出安全回归。
- `tests/app-host/business-page-navigation.test.mjs` 的 Eidos Shared CSS source 断言与专用 CV05 Chromium Workflow 同时运行；所有 CI 必须以 GitHub **精确 HEAD 原始 Jobs** 为证，不在评审文档里预写成功。
- 390px 是 headless Chromium 的 viewport，不是物理 iOS/Android 真机，更不是正式 Google 登录、Live LLM、Human UX approval。现有 CV03 Human SAVE OFF、正式 CV04 后台 EXPORT OFF、#1212 `N1=NOT_CERTIFIED` 不变。
- 发布归属：这是运行时 CSS，合并后必须核对东京 Preview 对新 `main` SHA 的实际 deploy Job 与本机/HTTPS/BasicAuth 原始标记；CI GREEN 不等于已部署。回滚可按既有东京 immutable SHA/上一镜像回滚机制执行，不在此开新的部署路径。

关联研究/交接：[本切片独立缺陷与方案](../plans/foundation-list-experience/CV05-WINDOW11-20261113-0508-VIEW-SWITCH-TOUCH-HANDOFF.md)、[前轮真实 Chromium 交接](../plans/foundation-list-experience/CV05-WINDOW11-20261113-0408-REAL-HOST-CHROMIUM-HANDOFF.md)。
