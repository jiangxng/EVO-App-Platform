# BEX-01 V3｜以 Eidos 通用分组审核能力实现 Platform 字段决策体验（2026-10-16）

**Owner 判定：** [Eidos #187](https://github.com/jiangxng/eidos/pull/187) 已合并 `main@a082de4cc03a448e368881fd025be9dd8deee448`，Eidos 拥有通用 `reviewGroups` 的 UIDL 契约、校验、渲染、响应式与无障碍。**EVO-App-Platform 的对象扩展应用拥有具体 Excel 来源列、字段候选、业务字段定义、受控导入、权限和 Job/Recipe 真相。** 不能把业务页面当成 Eidos 框架私有页面，也不能把 Eidos 的通用能力复制为 BEX 私有 HTML/CSS。

## 目标与完成条件

客户上传 XLSX 后，需要快速审阅来自真实 Host Job 的 20 个未匹配来源列。当前整页为每列重复排出 4–5 个完整表单控件，导致页面过长、来源证据与选择脱节。目标是**一列一审核行，主要决定始终可见，来源原值概况就地可见，字段名称、类型和同名候选比较按需展开**。保存时仍只执行现有字段创建/映射命令，不自动提交供应商数据。

## 流程与步骤

保留原工作链路：数据导入 → 主映射页面 → 集中审核来源列 → 一次确认创建/复用/忽略 → 返回同一 Job 的映射 → 独立预检查 → 最终提交。BEX 仅在 `apps/object-extension/batch-page.ts` 的现有 Form 增加 `reviewGroups` 视图声明，不改变字段 key、Host 命令、业务计算、Recipe 或持久化。分组中 `choice_N` 总是直接可操作，其他字段以原生 disclosure 展开；系统元数据/同名候选错误优先展开。原 AI 建议仍是独立可选能力，不能代替 Human 业务确认。

## 导航与信息架构

不新增 Eidos 内部业务页、不增加一级 App/导航或第二个导入操作台；使用既有 `/object-extensions/from-import?job=...&mode=batch` 入口和现有工作路径。Eidos App Host 仅实现通用分组。业务应用提供每个 `source-N` 组的标题、原始样本摘要、`choice_N` 主输入及详情 field-key；真实数据来自 Host 的企业权限边界。原 Import Job 技术字段仍保留原表单契约，未来可用框架定义的非业务技术辅助字段模式进一步收敛。

## 视觉与颜色

通用行/详情响应式样式直接消费 `vendor/eidos/src/design-language/productive-workbench-css.ts` 中从正式 Eidos #187 引入的 Design Language CSS。布局采用设计语言 tokens、清楚的分隔线和对齐的主选择；不复制 HTML 原型、不给 BEX 编写私有 CSS，不使用独立图标/配色。桌面两栏，手机一栏，字段名称/类型/原始样本在详情展开后保持原 Form 样式和标签。

## 记忆与注意力

每行摘要中直接展示非空计数及至多三项不同原始样本；主选择在折叠状态仍可编辑，而非要求记住上一页面的 Excel 值。展开并折叠详情不会丢掉字段值，也不构造新映射。已有字段按真实 field ID 复用；多个同名“开户银行”仍须 Human 明确选择，候选用途在展开的组内完整显示；“系统编码”等疑似技术元数据优先要求人工核对，不误建第三个同名定义。

## 无障碍与跨年龄

每组由标题、摘要和直接操作的原 select 构成；详情使用原生 `details/summary`（键盘/辅助设备可操作，焦点可见）。不以颜色独立传达操作意义。390px 手机下单列布局、长来源样本换行，保持可放大的文本。Eidos 契约验证重复/缺失的 group 字段引用，Form 主动作可通过键盘操作。自动 Chromium 模拟不是实际真机/真人 Human 签收。

## 安全与数据修复

Eidos 通用 Group 只改变表现，不推断业务决策，也不替代 Host 权限。EVO 应用的 `apps/object-extension/batch-action.ts`、`apps/data-import/actions.ts`、Import Job、Role 权限、字段一对一与原始行更正均保持原样；确认创建定义与最终提交供应商仍是两步独立授权。任何同名目标仍按真实 field ID 检查，不从 SUPPLIER 关系推断缺失 `subjectType`。

## 证据与剩余问题

- Eidos 正式 PR #187 的公共契约、校验、HTML 分组渲染与响应式 CSS（已独立 CI/Human 门禁通过）。
- 本 PR 的 Eidos pinned vendor 消费文件：`vendor/eidos/src/runtime/contracts.ts`、`vendor/eidos/src/runtime/validate.ts`、`vendor/eidos/src/runtime/render-model.ts`、`vendor/eidos/src/renderers/html/index.ts`、`vendor/eidos/src/design-language/productive-workbench-css.ts`。
- BEX Experience owner：`apps/object-extension/batch-page.ts`。精确功能回归：`tests/protocol/bex01-batch-extension-import.test.mjs`、`tests/bex01/live_supplier_chromium.py`、`tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`。CI 必须以最新 Platform PR HEAD 为准。
- 原 [#909 Draft](https://github.com/jiangxng/EVO-App-Platform/pull/909) 只提供 V3 高保真设计研究/HTML 原型，本 PR 不直接合并该原型，也不能据此次分组体验宣称整个 V3 原型已实现。
- 客户真实 Excel、同名银行业务角色、3行缺失身份、真机/键盘/实际 Human 签收仍待独立验证；Railway 应只部署已合并的 `main`，本 PR 合并前不作发布断言。
