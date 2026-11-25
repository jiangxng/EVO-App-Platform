# CV07 · Eidos Collection shared controls and governed Business Dictionary import

User screenshot (2026-11-25): Business Dictionary at approximately 1090×624 shows title, two page actions, system view chips, three presentation buttons, search, then a naked expanded "列设置" with densely packed browser-default hide/reorder buttons. It is a design-language defect rather than proof of missing Domain Owner logic. Scope: `apps/business-dictionary/page.ts`, `manager/cv03-personal-saved-view-dictionary-presentation.ts`, `vendor/eidos/src/catalog-browser/render.ts`, `vendor/eidos/src/design-language/productive-workbench-css.ts`; governed import Target: `apps/business-dictionary/import-target.ts`.

## 目标与完成条件
Unify search and column-management presentation in the shared Eidos List Foundation UI; give an authorized OWNER/ADMIN an Import CSV/Excel entry only when the Domain and Data Import Features are active; use actual existing Data Import upload→mapping→dry-run→commit, not fake a click. Success means automatic tests for role/feature gating, duplicate rows, rollback and draft-only behavior. A successful renderer assertion is not a Human acceptance signature.

## 流程与步骤
Business Dictionary list → Import CSV/Excel (eligible management only) → existing Data Import upload form (CSV/XLSX) → map Dictionary code/name, Option code/name/status, optional zh label/aliases → dry-run errors or mapped rows → explicit commit → draft dictionary options visible on list. Import never invokes Publish. User must deliberately publish with existing Human workflow. Existing Export current page CSV and New Dictionary remain.

## 导航与信息架构
Eidos Catalog Browser owns header, view chips, table/chart/board switch, search/columns toolbar. Active Domain Owner supplies URLs and field list; current Enterprise Principal via Host gates visibility. Reuse `/data-import/new/business-dictionary.option` and its existing breadcrumb/return flow; no new fake routes or local sorting. CV03 personal read-only view adapter gets the same Host-trusted importRoute only when eligible; stored personal view never authorizes a write.

## 视觉与颜色
Use the same Eidos neutral background, existing border tokens, selected-blue state, muted labels and focus outline. Column choices grouped inside a bounded popover, text first, aligned actions second. No raw default buttons, overflow or new arbitrary brand palette. 390px layout places search across width and column controls below, with button wrapping and readable lines.

## 记忆与注意力
Keep All/Draft/Published tabs and Table/Chart/Board state consistent with owner navigation. Column controls are closed by default; progressive disclosure reduces cognitive load. No repeating "列设置" actions on every table row; the control is adjacent to search. Show the import action with familiar "CSV / Excel" language rather than a technical target ID.

## 无障碍与跨年龄
Retain native `<details>/<summary>` keyboard navigation and Eidos action buttons with visible labels. Focus ring is explicit and consistent, click/touch targets are at least 36px inside popover and 44px on toolbar controls. The responsive layout at 390px avoids horizontal overflow while preserving a clear action hit area. Automated tests inspect DOM markers and shared CSS; actual keyboard/Screen Reader and Human acceptance still need later verification.

## 安全与数据修复
The page shows Import only if current Enterprise OWNER/ADMIN, Dictionary Feature ACTIVE, Data Import Feature ACTIVE, and the effective target advertised. Backend Data Import repeats current Principal, Enterprise scope and owner target checks. Rows are dry-run validated (required values, status enum, normalized option duplicate) and atomic-batch committed into Enterprise Dictionary drafts; no silent overwrite or automatic publish, and the old PUBLISHED snapshot remains authoritative until a Human publishes. Unsupported return routes fail closed. The UI must not falsely show a link when Data Import is not active in the preview.

## 证据与剩余问题
Visual observations grounded in user screenshot and current Eidos renderer/styles source. New protocol suite tests mapping, commit, conflicts and cross-enterprise resource isolation; all results to be reported from exact PR HEAD CI. Tokyo live operator cannot be claimed based only on CI. UI screenshot comparison at 1280/390, valid Basic Auth, real import file, Human accessibility sign-off and current Tokyo Data Import installed/active remain separate checks. Do not claim production OIDC, CV03 SAVE, CV04 EXPORT, or Agent WRITE certified.

## 页面模式与导航归属
Eidos owns catalog-browser markup and design tokens; Dictionary Owner owns query filters/column order, draft/publish validation, and import Target; Data Import owns file parsing and staged workflow; Host owns identity, Package lifecycle and current enterprise. No new default global startup installer, no new CRUD route, no CSS fork in Dictionary.

## 功能、布局、颜色对照
功能：旧 UI 缺 Import；新 UI adds only authorized Import and connects existing CSV/XLSX workflow. Existing Export/Create/Sort/Page controls preserved.
布局：旧展开列设置为密集原生控件；新 toolbar aligns search and responsive column dropdown, 390px wrapping.
颜色：复用 Eidos `--eidos-primary`, `--eidos-border-strong`, `--eidos-bg-selected`, no opaque custom color except restrained shadow.

## 入口、退出与恢复矩阵
入口：authorized Dictionary list and live Data Import Target → Import form; missing target or no OWNER/ADMIN → no entry.
退出：back to Dictionary list via Owner-validated route; system views/filters remain owner-controlled.
异常恢复：invalid/duplicate row stays in existing Import review with error receipt, no partial draft writes; stale version during commit rolls back all groups; unauthorized/disabled target denies backend request even when a URL is manually crafted.

## 浏览器与 Human 证据
桌面：screen 1090px from user source shows existing defect; new Eidos CSS and semantic DOM tests prepared. New screenshots/Human confirmation not yet obtained.
移动：390px breakpoint behavior authored and protocol CSS asserted; physical browser screenshot/Human touch acceptance not yet obtained.
Human：NOT SIGNED. Keyboard/Screen Reader and actual Tokyo CSV+XLSX import remain pending independent real user exercise.

This is a same-PR implementation review and test plan, **not a fabricated Human PASS**.
