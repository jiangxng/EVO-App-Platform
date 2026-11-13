# CV-05 / Window11 / 自动续跑 #05/08 — 通用 Collection 视图切换触摸目标修复

> 2026-11-13。主线基线 `c9ec5b5e9eef0019bb5392fe31bc23c76f9c23c5`。本页记录首次发现时的原证和最小方案；PR HEAD、CI、Tokyo 和 Branch Hygiene 必须在运行后另记原始证据，不预填“成功”。

## 独立复现依据（A/B；先复用现成资料）

- 前一轮 [CV05 Chromium Run #43422243845](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43422243845)，[原始截图 Artifact #14034273210](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43422243845/artifacts/14034273210)，含 `my-suppliers-390-list.png` 和 `dictionary-390-list.png` 两张 **实际 Chromium 390px 截图**。视图标签分别「供应商 / 我的供应商」「全部 / 草稿 / 已发布」，浏览器呈现为紧贴的原生小按钮；此前 #04 只保证可见、导航正确和无水平溢出，未断言这些视图按钮达到 44px。
- 原文 `vendor/eidos/src/catalog-browser/render.ts` 的 `viewNavigation` 输出 `[data-eidos-catalog-view-navigation]`、`[data-eidos-catalog-view-id]` 和每个 `select-view-*` button；已选项自带 `aria-current="page"`，原路由由 Domain 提供，**不需要重造选项/权限/状态**。
- 原文 `vendor/eidos/src/design-language/productive-workbench-css.ts` 只有 Table、Pagination、Search 的 44px 控件规则，而没有针对 `[data-eidos-catalog-view-navigation]` 的布局/触摸尺寸/已选/焦点样式；Eidos Design Tokens 中已经有 `--eidos-touch-target:44px`。因此这是共有 **Eidos Productive UI** 的可复现遗漏，不是 Supplier/Dictionary 各自的问题。

## 决定及实际最小改动（D）

1. 只在 **Eidos 原统一 CSS** 对 `data-eidos-catalog-view-navigation` 设置弹性换行、间距，按钮 `min-width/min-height:var(--eidos-touch-target)`、共享前景/背景、根据原 `aria-current` 高亮已选、`:focus-visible` 清晰外框；不修改业务查询、导航 Controller、路由/权限合同、Agent 模型与生产控制面。
2. 扩展之前已合并的 `tests/cv05/real_host_agent_list_chromium.py`，复用同一个真实隔离 Host、A/B Owner、原 Eidos 浏览器页面，对 My Suppliers/Dictionary × 1280px/390px 实测所有视图按钮矩形 **宽高至少 44px**、视口边界、唯一已选、键盘 Enter/触控切换视图后的原 Domain 路由，以及切回原搜索/分页的有权记录；保留前轮详情返回、跨企业不泄漏和无横向溢出断言。
3. 既有 `tests/app-host/business-page-navigation.test.mjs` 增加精确 CSS 规则防回退，继续沿用已有 `test:platform`/CV05 Chromium Workflow；不新建一套 Playwright 环境、重复 #1318 浏览器工作或修改 CV04 fixture。

## 保护边界

- Chrome 自动化和测试夹具是 `LOCAL_STATIC_HUMAN` 隔离数据，真实 LLM、Google OIDC 生产会话、真实物理手机和 Human/UX 签收仍待证据；截图不能冒充生产现场。
- Eidos 的 `view` 是对同一 Domain 重新查询的 UI 选择，不是 CV03 SAVE 或 CV04 正式后台 EXPORT。生产 `N1=NOT_CERTIFIED`，CV03 Human SAVE OFF / CV04 正式后台 EXPORT OFF 不变；#1212 Owner、#1092 Operator 独立签署仍待，#1184 其他窗口文件不得更动。
- 真正的运行时 CSS 改动应在受保护 main 合并后进入已有东京 Preview 发布路径；必须核查 GHCR immutable SHA 与 SSH 本机/公网 HTTPS/Auth 原始日志，不能把 CI 绿色自动等同实际发布。

## 关联文档和短接续

[Window10 研究入口](CV04-WINDOW10-20261113-RESEARCH-HANDOFF-ENTRY.md)／[研究来源与决策](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md)／[Window11 #04 Chromium 交接](CV05-WINDOW11-20261113-0408-REAL-HOST-CHROMIUM-HANDOFF.md)／[Window11 #04 UI Review](../../ui-design-reviews/CV05-WINDOW11-20261113-0408-CHROMIUM-AGENT-LIST-REVIEW.md)。

下一步只在独立 Draft PR 的 **精确 HEAD** 测试全绿后 Ready → protected main merge → main CI & Tokyo 真实日志 → Actions 清理过程分支；CI 如果查出新失败，留在同一 PR 内修复。未新增其他 List 功能范围。
