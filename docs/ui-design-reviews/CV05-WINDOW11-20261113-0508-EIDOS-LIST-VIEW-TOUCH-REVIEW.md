# CV05 Window11 #05/08 — Eidos Collection View Switch Touch Review

> 2026-11-13，same-PR Human UI Review gate artifact。受保护 main 基线 `c9ec5b5e9eef0019bb5392fe31bc23c76f9c23c5`。此项为 Eidos 通用 `CatalogBrowser` 的触摸目标，不是新插件 Experience 模式。精确 UI 源文件：`vendor/eidos/src/design-language/productive-workbench-css.ts`。真实 Chromium 截图来自 [#1318 artifact #14034273210](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43422243845/artifacts/14034273210)。无实人签收，不借 CI 声称生产 UX PASS。

## 目标与完成条件

业务用户（包括手指触控者和键盘用户）在供应商/业务字典列表之间切换已有的 View，不需要瞄准极小原生按钮。完成条件：Eidos 统一视图按钮均达到 44×44 CSS px，当前选中与焦点清楚，390px 可自动换行不横向溢出；保留现有 Domain Query / Host 二次授权 / A/B 企业隔离 / 详情返回。视觉来源：原有 Eidos Productive CSS 和设计 token `--eidos-touch-target:44px`，不新建 UI 体系。

## 流程与步骤

进入现有业务列表 → 已选 View 用原 `aria-current="page"` 明确识别 → 点击/触摸/按 Enter 选择另一视图 → 原 Eidos `onNavigate` 打开 Domain Owner 路由 → 使用原列表入口恢复带筛选/排序/页码的状态。对无结果或无权情况继续沿用原 Host 查询与页面错误/空状态，不创建前端假授权。实际自动用例为 `tests/cv05/real_host_agent_list_chromium.py`，非假设浏览器可点击。

## 导航与信息架构

视图属于列表内部同一 Business Domain 的 View 层，不额外加入顶层菜单、全局导航、第二组切换控件或 View 编译器。供应商保留「供应商」「我的供应商」，字典保留「全部」「草稿」「已发布」。被选中与路由仍由 `vendor/eidos/src/catalog-browser/render.ts` 的 `data-eidos-catalog-view-navigation` + `data-eidos-catalog-action=select-view-*` + `aria-current=page` 驱动，未变更现有合同。

## 视觉与颜色

**功能：** 原视图 ID、路由与按钮行为不改；修复原样式遗漏。**布局：** 一行优先、窄屏自动换行，min-width/min-height 44px，沿用 Eidos space tokens，桌面 1280px 与手机 390px 保持区域内可触达。**颜色：** 非选中使用 Eidos bg/fg/border，已选使用 `--eidos-bg-selected` + primary 色与边框，focus-visible 使用原 primary 外框；不引入新品牌色。原 Chromium `my-suppliers-390-list.png` / `dictionary-390-list.png` 显示之前 buttons 原生缩小；本 PR 的后图与测量数据只在新 Chromium CI 真实执行时成立。没有假定截图差异为像素级人工验收。

## 记忆与注意力

保持原有 `aria-current` 显示所处 View，减少用户在跨 View、详情返回之间重新判断位置的成本。控件紧邻列表搜索与分页，避免新建悬浮导航重复信息。已存在的筛选参数由 Domain Query Route 保存，本次不另存本地/服务端视图状态；内存和权限均不向 UI 做自定义缓存。

## 无障碍与跨年龄

用现有原生 `button`，支持键盘焦点和 Enter。44px 触控目标降低手指点击错误和年龄/运动控制差异。高对比 focus-visible、唯一已选 `aria-current=page` 由浏览器读回核实；另需真实屏幕阅读器、物理 Android/iOS 和不同缩放级 Human 测试，当前自动 Chromium 不能取代这些证明。没有变更业务文本本地化或语言方向。

## 安全与数据修复

选择 View 只是导航，不能访问跨企业数据或绕开 Domain Owner。原 A→B→A 企业切换、READ 重新授权、插件禁用和隐藏字段由既有受保护测试维持；CV03 Human SAVE OFF、CV04 正式后台 Export OFF，#1212 N1=NOT_CERTIFIED 不变。无需数据库迁移、数据修复、重新发布 CSV 或扩大 Scope。若发生 UI 回退，按正常受保护 main + 东京不可变 SHA 发布回滚，不碰 #1092 Railway。

## 证据与剩余问题

**已读源码（A）：** `vendor/eidos/src/catalog-browser/render.ts` 原按钮标记；`vendor/eidos/src/design-language/productive-workbench-css.ts` 原先缺 view nav 样式、现在最小补 Eidos token；`tools/ui-design-review-gate.mjs` 所需八章节；`docs/governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md` 审查标准。

**原始浏览器证据（B）：** [#1318 Run #43422243845](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43422243845) 的 390px 原始截图给出缺陷场景；本 PR 原始 Chromium 输出使用 `CV05_EIDOS_COLLECTION_VIEW_44PX_SWITCH_PASS:<name>:<viewport>`，对于 My Suppliers/Dictionary × 1280/390 应当 4/4。#1319 初版 CI 曾因缺少同 PR UI Review 与后续缺固定八章节被**正确 FAIL CLOSED**，已按原门禁补文件，不更改门禁逻辑。最终 Head/main Actions、东京健康/401 和分支清理以 PR 最终评论为准，不预写成功。

**未完成：** 真实 Google OIDC 登录、在线 LLM 语义准确率、物理手机/真实人手持点击、屏幕阅读器、Human 生产签收；维持待验。文档关系：[Window11 #05 研究与决策](../plans/foundation-list-experience/CV05-WINDOW11-20261113-0508-VIEW-SWITCH-TOUCH-HANDOFF.md)、[#04 Chromium 交接](../plans/foundation-list-experience/CV05-WINDOW11-20261113-0408-REAL-HOST-CHROMIUM-HANDOFF.md)。
