# CV07 · Data Import scoped parameter choices — 2026-11-25

Scope: `apps/data-import/page.ts` and `tests/protocol/cv07-scoped-data-import-options.test.mjs`. This is a targeted follow-up to [CV07 Eidos Dictionary import](CV07-EIDOS-COLLECTION-DICTIONARY-IMPORT-20261125.md), not another uploader or a new Eidos component. Source authority: Eidos Human Experience Design Authority, Productive Design Language (work in context, continuous journey), Business Office Visual Language, and the current Platform Data Import/CV07 contracts. There is no distinct approved prototype source for this specific conditional select; it reuses the existing Eidos form/select.

## 目标与完成条件

A current-enterprise OWNER/ADMIN follows Import from a Customer or Supplier list, selects a CSV/XLSX file and stages it without accidentally making the previously approved return route invalid by changing a role option. On a free-standing Import Center path, the user can still choose NONE/CUSTOMER/SUPPLIER/BOTH. Backend rejects crafted conflicting role/return routes as before. Code proof requires a real Owner Target and Eidos form render, targeted tests, and exact-HEAD CI. Human browser signoff is separate.

## 流程与步骤

- List (Customer or Supplier) → Import → Eidos upload form with matching role preselected and no incompatible role choices → upload → map/preview → dry-run → explicit commit → original filtered list. Cancel/back can use the existing context navigation before commit.
- Import Center → select Counterparty → unrestricted role choices → upload → map/dry-run → commit → owner-selected business list.
- Error/recovery: crafted cross-list `returnTo` is rejected by the existing owner route check; no Import Job is staged.

## 导航与信息架构

Keep the existing contextual Import entry inside authorized Counterparty lists and the independent Import Center under its existing application placement. No global navigation, new URL pattern or special case in Eidos. Source-list return route is a Host/Domain Owner hint, not a grant or stored direct link.

## 视觉与颜色

Reuse Eidos standard Form and Select controls from `apps/data-import/page.ts`; no CSS/tokens changes. Only an existing choice set and the short explanatory business-language description change. The select retains the Eidos layout and theme. 390px and high-zoom remain subject to real-browser verification.

## 记忆与注意力

The source list's role and filters are kept, so the user does not have to remember the original context or debug an avoidable staging failure. A short note explains how to choose another scope through the Import Center rather than silently dropping the return route. The chooser is still visible, not replaced with a fake hidden permission.

## 无障碍与跨年龄

Retain Eidos native semantic select, form labels, keyboard flow, file upload and context navigation. No new overlay/hover-only interaction. The single valid choice remains announced as a select value. Actual keyboard, screen reader and touch verification remains OPEN.

## 安全与数据修复

Allowed choices are calculated from `FoundationObjectImportTargetV010.completionNavigation` using the exact original scoped `returnTo` and candidate parameter value. If an Owner cannot validate a candidate, it is not displayed. If no choice is safe, the page rejects it rather than quietly dropping the source scope. Existing server-side stage permission, enterprise context/Feature checks, effective target resolution, scope validation, dry-run and commit remain unchanged. Client controls are guidance only, not authorization.

## 证据与剩余问题

Before: `createDataImportUploadPageV010` displayed all `relationshipMode` values even when an initial Customer/Supplier `returnTo` was supplied. Existing `tests/protocol/data-import-human-experience.test.mjs` already proved a mismatched mode + source route is rejected by stage with `DATA_IMPORT_RETURN_ROUTE_INVALID` and no staged job. After: new protocol regression asserts the route-preserving options for both scoped lists, unrestricted Import Center, preserved query URL, rendered Eidos form and cross-scope rejection. The exact HEAD CI result is recorded in PR evidence, not presumed here. No Tokyo authorized Human session/screenshots were used.

## 页面模式与导航归属

Page archetype: existing Eidos form, with original Context Navigation and governed Data Import command. Eidos owns rendering/style; Data Import owns form/model selection; Counterparty Owner owns relationship role and valid return route; Host enforces current authorized principal/context and target lifecycle. No duplicated client-side import workflow.

## 功能、布局、颜色对照

| Axis | Before | After | Evidence status |
| --- | --- | --- | --- |
| Function | Scoped list offered role choices that its return route could not accept | Only Owner-valid choices offered; Import Center retains full options | Protocol test and CI pending |
| Layout | Existing upload Form with a parameter select | Same controls, one clear scope guidance sentence | Static model; browser pending |
| Color | Eidos Form tokens | Unchanged | Code review; Human pending |

## 入口、退出与恢复矩阵

| Entry | Action | Destination / exit | Failure recovery |
| --- | --- | --- | --- |
| Customer list, OWNER/ADMIN | Import as CUSTOMER | Mapping → review → current filtered Customer list | Cancel/back to customer; wrong role never offered |
| Supplier list, OWNER/ADMIN | Import as SUPPLIER | Mapping → review → current filtered Supplier list | Cancel/back to supplier; wrong role never offered |
| Import Center, authorized | Choose any supported role | Mapping → review → matching Owner workspace | Original service error review and retry |
| Crafted route / no allowed choice | Try to open invalid scoped form | No successful upload page | Fail closed; use existing Import Center |
| Non-manager / disabled Feature | No authorized contextual action | No Import entry | Existing Host admission denies direct stage |

## 浏览器与 Human 证据

功能：新的 scoped/unscoped UI 回归待准确 HEAD CI；原后端越权拒绝断言已在主线存在，不宣称在线操作。
布局：沿用 Eidos Form 原有字段、分组和上下文导航；只减少冲突选项，实际渲染待浏览器复核。
颜色：未引入 CSS 或 token 修改；Eidos 原有业务办公主题保持不变，Human 尚未验证。
入口：受权限/Feature 控制的客户或供应商列表 Import → Data Import 上传；独立导入中心仍可进入。
退出：同一 Owner 校验的原客户/供应商筛选分页路由；取消可返回原列表或导入中心。
异常恢复：跨角色/非法 returnTo 拒绝表单或 Host staging；保留已有映射预检和重试路径。
桌面：本轮没有新浏览器截图或真实授权会话，待验收。
移动：390px 没有新的触摸及屏幕阅读器实际证据，待验收。
Human：NOT SIGNED；东京真实 CSV/XLSX 与视觉验收均另行进行。

Desktop: no new screenshot or live session observed; pending. 390px: no new browser evidence observed; pending. Human: NOT SIGNED. This PR does not claim Tokyo deployment, dictionary real CSV/XLSX signoff, or Agent WRITE certification.

## CV07 scoped Data Import 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
| --- | --- | --- |
| 跨插件复用核查 | 源码已确认 Counterparty/Dictionary/Item/Warehouse 有 Owner Import Target | 对照 required CI |
| 列表范围兼容导入 | 代码待 CI | 精确 HEAD 运行相关协议测试 |
| 越权与错误恢复 | 原 Host 拒绝测试已有，新 UI 拒绝测试待 CI | 确认无回退 |
| 桌面和 390px Human | 未签收 | 实际授权会话操作与视觉验收 |
| CV07 scoped Data Import 整体 | 开发验证中 | CI 通过后合并，Human 独立保持 OPEN |
