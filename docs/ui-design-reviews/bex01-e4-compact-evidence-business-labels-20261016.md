# BEX-01 E4-02｜字段映射行密度与业务字段名称（2026-10-16）

> 源码范围：`apps/data-import/page.ts`；协议回归：`tests/protocol/data-import-human-experience.test.mjs`；真实隔离 Host Chromium：`tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`。本批调整真实 `#/data-import/jobs/:id/map` 的业务信息呈现，并同步已合并 [Eidos PR #192](https://github.com/jiangxng/eidos/pull/192) 的通用 inline detail 片段到 `vendor/eidos/src/renderers/html/index.ts` 和 `vendor/eidos/src/design-language/productive-workbench-css.ts`。没有 BEX 私有 CSS、不改 Host 命令、Import Job 保存、schema/fieldId、权限、Recipe、LLM、Railway 或其他窗口 PR 文件。
>
> 证据起点：[E4-01 V3/真实 Host 截图对照](../plans/foundation-list-experience/BEX-01-E4-01-V3-TO-REAL-MAP-EVIDENCE-20261016.md)；V3 高保真原型仍在 Draft #909。Eidos 规范参考 `EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`、`EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md`、`EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md`、Human UI Review Checklist。E4-01 证据是隔离 Host 的表格截图，不是有权登录的 Railway 客户 Job；本批不能自称完整 V3 签收。

## 目标与完成条件

在原供应商 Excel 的每行「来源列名｜示例值｜对应系统字段｜状态」之间，业务人员能够快速看到**一个真实样例和一个有业务意义的系统字段名称**，不用每行解码 `code`、`subjectType`、`ext_...`。但同名目标仍显示业务用途和原 field ID 供人排歧义；所有提交值保持真实 ID。成功不是把表格变成静态 V3 HTML，而是映射/筛选/人工决策的原动作零回归。

## 流程与步骤

仍是「选择文件→核对映射→预检查与导入」。默认异常优先，全部字段可检视。表格仅展示来源的**第一条去重、受控截断的非空样例**，无需把「非空 172 / 172」及三个值拼在每个格子里。每行都可展开「查看来源及候选字段用途」，其中仍展示完整原来的非空计数、最多三条已截断样例；真正的完整原始 172 条行数据从未离开 Import Job。待新增字段和自动匹配入口、批量字段审核、预检查和最后独立导入确认原样保留。

## 导航与信息架构

沿用已有 Context Navigation、原 Job URL、已安装 Eidos 的四列审核表和屏幕阅读器可理解的列标题。不创建第二个页面、不移动「投影」或供应商导航、不把正式导入改成必须呼叫 Agent。展开来源证据就在用户选择目标字段的同一行，不跨页回忆。已经明确的名称不追加 UUID/内部 ID；两种同名「开户银行」依旧展示用途、stable field ID，避免误选。

## 视觉与颜色

此 PR **没有私有 CSS**。上游 Eidos #192 将原生 `details/summary` 放入来源证据单元格，避免每个折叠证据无谓占据第二行；继续复用 Eidos E2 四列表格、E3 任务概览、原 Business Office 色板、文本比例、触控目标与移动响应式。通过缩短源数据视图和唯一目标选项文案减少折行和视觉噪声；不调整 Eidos 表格 padding、侧栏宽度、全站 token、默认控件高度。复杂来源可展开，默认密度更接近用户认可的 V3 节奏。原型和装有应用侧栏的真实 Host 并非相同容器，不能强求像素完全重合。

## 记忆与注意力

表格默认一条真实证据，展开后仍能看见三条不同样例及总非空数，不需从上一页记住原值；已有映射选择不会因为阅读浓缩而被覆盖，切换“全部字段/需要关注”不能丢映射。业务字段选项的 `value` 始终是原始 field ID；只有真实标签歧义时，用用途解释 + ID 打破歧义。额外的只读来源字段不参与写入，也不假装草稿自动保存。

## 无障碍与跨年龄

依赖原生 select、details/summary、table 标题、状态文字、Eidos 焦点/筛选/手机卡片。字段选项标签可读且短；技术身份仅出现在安全核对必需的位置。展开样例保留可读 label，受 Eidos keyboard/触屏事件控制；既有 390px Chromium 自动回归覆盖「已匹配来源」也能展开并看到第二条样例，且没有第二个 `data-eidos-review-table-detail-row`，并单独存证 E3 桌面/手机概览截图。仍需人类验证 200%/400% 放大、真实触摸设备及读屏交互。

## 安全与数据修复

原始 Excel 的来源 rows/headers、授权/隔离、字段 ID、目标字段唯一性、未知 ID 拒绝、同名字段判断、`__CREATE__` 和 `__IGNORE__`、单次 dry-run、Schema Owner 审批、Agent 上下文全部不改。新增的 sourceEvidence 字段是 **readOnly、非必填的非命令数据**，仅供人展开审查；Host 仍只处理 `map_N` 的固定输入合同。无自动提交、不把 `SUPPLIER` 当成缺失的主体类型、不对原始业务数据做改写。

## 证据与剩余问题

- 基于 Platform #966 [隔离 Host Chromium 图片](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38842754856) 与 Draft #909 [V3 图片](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184)，具体差距来自真实已展示的源值多行堆叠、选项技术 fieldId。
- `tests/protocol/data-import-human-experience.test.mjs` 需证实：所有映射状态与旧 Host 数据不变；第一条来源值直显；已映射/未映射均可展开原始样例；唯一字段 label 没有技术尾巴，但 option value 保持正确 fieldId。
- `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` 需证实：172 行、22 来源列中代表性样本和完整可展开源样本同时可见；原 `code` option value 和映射提交仍正确；E3 概览与 390px 任务保持可用。当前报告需以 PR HEAD CI 的实际结果填写，不预先宣布通过。
- [Eidos #192](https://github.com/jiangxng/eidos/pull/192) 先独立合并；Platform 本 PR 只选择性同步 Eidos 的两个公共源码片段，不覆盖 Platform 既有的 pinned Eidos 其他扩展。同步后需重新通过精确 PR SHA 的 Protocol / Host Chromium / Human 设计门禁。
- **未签收：** Railway 登录后的用户实际 `import-79ce...` Job 全页截图、当前用户认可的 V3 桌面/手机视觉、客户 Excel 的两个开户银行真实用途及三条缺失主体类型、端到端真实提交。E4-01 缺这些证据仍需后续单独取得；不得用隔离 Host 合成数据替代。
