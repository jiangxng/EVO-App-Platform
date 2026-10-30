# BEX-01 V3 mapping review alignment

## 目标与完成条件
Human reviewer checks a real staged import, understands the source file and mapping totals, resolves actual blockers, sees all source columns when needed, and explicitly saves and prechecks. This change addresses the heading and zero-issue presentation on the mapping page `apps/data-import/page.ts`.

## 流程与步骤
Keep the existing file → mapping → save/precheck → confirm/commit path. The “查看全部字段” link toggles the same Eidos filter select between all columns and attention columns; no new command or backend state is introduced. Zero current issues show a truthful success badge.

## 导航与信息架构
The page remains an in-context data-import workbench. The new link is a local table view control beside “字段对应关系”, not a second route or persistent navigation item. Existing return and reset actions stay in the footer.

## 视觉与颜色
The V3 HTML source uses `#f5f7fa` canvas, `#fff` panels, `#172b44` text, `#6a7c91` muted text and `#2563a6` action blue. The existing scoped mapping palette in `vendor/eidos/src/design-language/productive-workbench-css.ts` preserves these values. This change adds a quiet total-column pill, text link and positive empty-state badge with the same Eidos variables. Layout order remains source card → four metrics → issue summary → mapping heading and table → footer.

## 记忆与注意力
The column total derives from actual Job headers, not the V3 synthetic 22-column fixture. The table keeps the existing mapping selections while filters change. The UI does not invent V3's three resolved sample issues for a different source file; unresolved Host dry-run issues still appear as actionable rows.

## 无障碍与跨年龄
The new control is a labeled button, keyboard operable and 44px high on narrow screens. The zero state uses text as well as green. The filter select remains available. Existing native table and mobile layout retain their semantic controls.

## 安全与数据修复
Filtering is local presentation only. Source rows, mapping values, permissions, dry-run validation and explicit Host save/commit do not change. A malformed shortcut that names a missing or non-full-data filter fails UIDL validation.

## 证据与剩余问题
Approved prototype: `docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html`, blob `9f57e9320eb527786ff7b737be27777eba6f8a92`, source `.sectionhead`, `.issuebox`, `.maphead`, `toggleAll` and `updateIssues`. Previous attempts applied scoped colors and table density but retained the generic renderer's missing heading action and omitted zero-issue section. Targeted build/UIDL tests and exact-head CI are required. Real desktop and mobile screenshots and Human signoff remain pending until separately observed.

## 页面模式与导航归属
Existing Eidos form review workbench; contextual data-import journey. No new page, route, menu item, permission hint, or Page Archetype is added. One primary forward action remains save/precheck.

## 功能、布局、颜色对照
| Axis | V3 source | Before | After / status |
| --- | --- | --- | --- |
| Function | View all / attention toggle uses same filter | Select only | Direct heading toggle drives same select; automated check pending |
| Layout | Heading has total-column pill and view-all link | Heading copy only | Actual column count and link in heading; screenshot pending |
| Color | Neutral pill, blue text action, positive resolved state | No corresponding controls | Scoped Eidos tokens; live visual check pending |

V3's 22 columns and three resolved issues are synthetic fixture content. Current 19-column Job statistics and absence of issue history remain authoritative; the zero-state message only asserts that no issue is pending now.

## 浏览器与 Human 证据
Code and unit checks will establish source semantics. Desktop Chinese screenshot: pending. 390px mobile control reachability: pending. Human visual acceptance: pending. CI compliance does not establish any of those.

功能：定向 UIDL 与 BEX 测试通过；真实浏览器操作待核对。
布局：原型 DOM 顺序与页面模型已对照；实际渲染截图待核对。
颜色：Eidos 受限映射页色值已与 V3 源码核对；实际浏览器颜色待核对。
桌面：真实中文截图未取得。
移动：390px 实际按钮与筛选器操作证据未取得。
Human：用户本人尚未签收。

## 入口、退出与恢复矩阵
| Context | 入口 | 操作 / 目标 | 退出 | 异常恢复 |
| --- | --- | --- | --- | --- |
| Authorized enterprise reviewer | Import directory → staged Job mapping | Toggle all/attention; save and precheck | Return to import directory | Reset unsaved mapping choices; Host validation issues stay visible |
| No current issue | Same mapping route | Read “没有待处理问题”; inspect all columns | Return to import directory | A later Host dry-run issue renders its real actionable row |
| Unauthorized / wrong context | Existing Host route admission | No mapping mutation | Existing authorized parent | Host denial remains authoritative |

入口：导入任务目录进入真实 Job 的字段映射页。退出：页脚返回文件/导入目录。异常恢复：重置未保存选择、保留原始来源和 Host 预检问题。
