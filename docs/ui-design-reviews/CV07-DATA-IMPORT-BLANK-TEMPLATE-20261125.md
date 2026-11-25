# CV07 · Reusable blank CSV template on Eidos Import Center — 2026-11-25

Scope: `apps/data-import/page.ts`, `apps/data-import/actions.ts`, `apps/data-import/template.ts`, `apps/data-import/capability-manifest.ts`, `apps/data-import/action-target.ts`, `manager/server.ts`, and tests `tests/protocol/cv07-data-import-blank-template.test.mjs`. Reuse current Eidos Catalog Browser, existing governed Owner Import Target, Host ActionRouter and standard Eidos action-result download, not a parallel CSV engine or browser-only data URI.

References already in current authority: Eidos Human Experience Design Authority v1, Navigation/IA, Productive Design Language v0.1, Business Office Visual Language v0.2, Human UI Review Checklist v1; Platform `.clinerules/03-human-ui-design-review.md`; CV07 Dictionary import (#1379) and scoped role recovery (#1381). No separately approved template prototype exists; the established Eidos import page is the normative surface.

## 目标与完成条件

An authorized current Enterprise OWNER/ADMIN can obtain a **blank** CSV for one effective Import Target before collecting their actual business rows. The header list comes from the *current effective* Owner `IMPORT` schema, not a hard-coded sample or cached enterprise fields. Downloaded columns must round-trip through existing deterministic header mapping; duplicate aliases must fall back to IDs and spreadsheet-formula labels must not execute. Only true writable, readable IMPORT fields appear. A read-only user or inactive Target never gains a download.

## 流程与步骤

Import Center → “下载…空白 CSV 模板” (Eidos command) → standard browser CSV download → fill rows in Excel or editor → return to the adjacent existing “导入…” action → stage CSV/XLSX → mapping → dry-run → explicit commit. Existing unfinished job resume, error CSV and import Recipe remain unchanged. Blank file intentionally has no fake row data and does not create a Job.

## 导航与信息架构

No new route, page, navigation bar entry, or static provider. Dynamic per-target download commands sit next to existing Import Center target actions, but stay secondary to the import/resume action. The Import Center remains the stable application destination. When many targets are active, the Host must continue to use Eidos' wrapping toolbar; future scalability review can introduce an Owner-approved per-target action menu rather than a second implementation. Upload page remains an Eidos Form and does not invent a secondary command that would require a preselected file.

## 视觉与颜色

No CSS additions or token overrides. Eidos Catalog Browser command buttons inherit existing semantic type, focus ring, responsive wrapping, and download feedback; labels include the business target. Actual 390px screenshot/zoom validation remains separate.

## 记忆与注意力

“Empty template” is distinguished from any real business sample. The user sees their current object name and can reuse the template without guessing which columns are currently writable. If the enterprise has two fields called “开户银行”, both are preserved under their stable field IDs so no business identity is silently guessed. Prior imported jobs and Recipe remain visible in the same Import Center.

## 无障碍与跨年龄

Use Eidos keyboard-operable, text-labelled command actions, not an icon-only download control. Each button names its business target and CSV purpose. No color-only indication or new hover/scroll trap. Actual keyboard, mobile touch and screen-reader evidence is still pending.

## 安全与数据修复

The route is an existing Host ActionRouter `READ` operation scoped to the current enterprise; it additionally requires active OWNER/ADMIN and effective live Target resolution. Parameters are constrained to the target's declared enumerated options, and schema comes from `target.describe({contextId, locale, parameters})`. The builder excludes non-IMPORT, unreadable, and non-writable fields. Only a header row is emitted; there is no enterprise record read, staging, Recipe creation, commit or publication. Suspicious formula-like labels are replaced with safe field IDs; malformed or colliding IDs fail closed. A disabled target returns `DATA_IMPORT_TARGET_NOT_FOUND`.

## 证据与剩余问题

Pre-change `apps/data-import/page.ts` offered CSV/XLSX upload and mapping but no blank-template command; `contracts/foundation-object/schema.ts` already defined authorized import fields; `service.ts` already defined collision-aware deterministic mapping. New target action and roundtrip/denial tests are part of the same PR; CI result must be attached from exact final HEAD. Known risks: (1) many installed targets could crowd the shared toolbar, needing Eidos Owner review if real 390px proves overflow; (2) a template from the global Import Center reflects **default** target parameters; customer/supplier role-specific templates can be requested through the same action API but are not yet offered as a contextual list-specific button; (3) the output is CSV, not native XLSX. No human-facing XLSX template is claimed.

## 页面模式与导航归属

Existing Eidos Catalog Browser (Import Center) owns the actions; existing Eidos Form owns upload and mapping. Data Import owns generic read-only CSV creation; each Domain Owner retains effective schema, parameter semantics and enterprise field authorization; Host retains lifecycle, Principal/Enterprise and capability operation authorization. No plugin-specific CSS or second data-import parser.

## 功能、布局、颜色对照

功能：原无模板下载命令；现为有效目标和授权企业动态生成可往返映射的空白 CSV，错误及停用拒绝保持；协议测试与正式 CI 分层记录。
布局：原仅导入/恢复操作；现按目标增加明确的二级文字命令，使用同一 Eidos toolbar；390px 实景待验。
颜色：未修改 Eidos tokens 或 CSS，仅使用已有 Catalog Browser semantic command；Human 色彩签收待验。

## 入口、退出与恢复矩阵

入口：企业 OWNER/ADMIN + active Data Import + effective target → 导入中心 → 下载当前目标空白模板。
退出：下载原始空白 CSV 后仍留在 Import Center；选择邻近的导入动作，预检查与显式确认流程不变。
异常恢复：角色不符、目标停用或非法参数 → ActionRouter/Domain Owner 拒绝且不写入企业 Job；有问题的实际数据进入现存预检查/错误纠正流程。

| Journey | Actual outcome needed | Contract test |
| --- | --- | --- |
| Owner/ADMIN, Dictionary | target current schema → CSV download → matching fields | cv07-data-import-blank-template.test.mjs |
| Owner/ADMIN, Counterparty role | scoped parameters → same Owner schema and deterministic mapping | cv07-data-import-blank-template.test.mjs |
| Read-only user / wrong context | deny without Job mutation | cv07-data-import-blank-template.test.mjs |
| Disabled target / forged parameters | deny before schema/download; no fallback | cv07-data-import-blank-template.test.mjs |
| Return to import | old route / mapping / dry-run / commit unchanged | existing Data Import protocol tests |

## 浏览器与 Human 证据

桌面：未取得新实际截图；Eidos HTML command markup covered by automated protocol tests, real browser pending.
移动：390px 与缩放 200% 实际触摸/键盘/焦点待验收。
Human：NOT SIGNED；Tokyo authenticated download/CSV editing/upload, permissions, Chinese headers and interaction still need a legitimate operator.

## CV07 通用 CSV 导入模板 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
| --- | --- | --- |
| 有效 Owner Schema 模板 | 代码待 CI | 编译并运行真实 Target 回归 |
| 权限/Feature 失败关闭 | 代码待 CI | 最终 SHA CI 与 Host permission 回归 |
| Eidos 入口与下载动作 | 代码待 CI | UI Gate 与 Chromium |
| 东京预览部署 | 未执行 | 合并后自动 CI-gated 发布并核验 |
| 真实中文/CSV/XLSX /390px Human | NOT SIGNED | 有效会话测试并记录问题 |
| CV07 通用 CSV 导入模板 整体 | 开发验证中 | 独立记录 CI、merge、deploy、Human |
