# BEX-01｜Eidos E2 接入真实字段映射页：四列审核表格（2026-10-16）

## 问题证据与业务验收基准

用户的实际线上入口是 `#/data-import/jobs/:id/map`，已有页面虽已使用 Eidos #187 的分组表单，却仍与 Draft [#909 V3 高保真原型](https://github.com/jiangxng/EVO-App-Platform/pull/909) 中的「字段对应关系」四列表格显著不同。Eidos [E1 #188](https://github.com/jiangxng/eidos/pull/188) 与 [E2 #189](https://github.com/jiangxng/eidos/pull/189) 已独立合并、CI 通过。**本 PR 真正修改用户所在 /map 业务页面，不能用 batch-import 另一条路由替代验收。**

## 目标与完成条件

拥有授权的业务用户在原 Import Job 上继续查看来源表头/非空及示例值、对应企业 field ID/候选用途、处理状态。四列标题由 Platform 使用当前 locale 提供：「来源列名｜示例值｜对应系统字段｜状态」。默认只看「需要关注」的来源列；点击「全部字段」仍能浏览完整 22 列，进行同一 `map_N` 选择、展开来源/同名用途、返回「需要关注」，**任一已选择的值都不能被视图筛选擦除**。原操作保持为单次「预检查」及随后独立的最终导入确认，字段扩展集中审核入口、AI 自助建议、Recipe 和 Batch Job 信息均继续可用。E2 不是完整 E3/E4 产品签收。

## 流程与步骤

用户在原 `/data-import/jobs/:id/map` 入口查看授权来源列，默认「需要关注」并逐行查看证据，在同一行以原 `map_N` 下拉框明确复用/新建/忽略。对需要业务解释的候选字段，在当前行展开来源与用途详情。切换「全部字段」时，先前映射项及其输入值始终保留；继续操作通过同一个原始 `data-import.review` Host 命令完成预检查，再按原业务授权进入最终提交。任何 AI 建议不能代替用户对同名银行用途、主体类型和源系统元数据的明确判断。尚未实施的 E3 保存反馈与跨步骤恢复不属于本阶段已交付内容。

## 导航与信息架构

`apps/data-import/page.ts` 是真实映射 page owner，仍返回原来的 `evo-data-import.mapping` Form UIDL、`DATA_IMPORT_REVIEW_COMMAND_V010`、所有 input key（`map_N` / `sourceEvidence_N` / `candidateEvidence_N`）、顶部已有面包屑和原 `batchReviewEntry` 链接。仅声明 Eidos 通用 `reviewGroups` + `reviewTable` 的页面呈现。导入来源数据、target schema、Host 身份权限、Agent 工具注册和真实字段映射逻辑不移入 Eidos。Eidos vendor 消费严格对应 #189 公共合同的字段/校验/渲染/样式和浏览器 filter 代码，保留 EVO 已有 Eidos 扩展（导航/Agent）。

## 视觉与颜色

按照 Eidos 的 Experience Architecture / Productive Design Language v0.1 / Business Office Visual v0.2：白色文档式内容表面、中性表头、四列紧凑业务阅读、蓝色仅用于动作和焦点、语义 warning 仅用于真正未决、已匹配使用 positive。移动宽度直接转为**同一份语义表格的可操作卡片**，不存在第二套 HTML 原型、BEX 私有 CSS 或额外映射数据副本。所有原始证据文本经过 Eidos 渲染器 HTML escape；技术 Job ID 与辅助内容仍待 E3 的业务流程架构继续精简。

## 记忆与注意力

Platform 基于已授权 Job 的**持久映射和明确 ignored 列**标注已匹配/不导入；`__CREATE__` 为待新增、唯一字段名称的未经保存建议为待确认匹配，`__PENDING__`、两项同名候选、不可用旧 field ID、疑似源系统元数据一律要求人工核对。当前过滤基于生成页时的 Host 快照，用户作出新的下拉选择后需完成原 Host 预检查才会生成最新业务状态（E3 负责进一步规范保存反馈；E2 不假装自动保存）。`subjectType` 和同名银行必须根据每条真实记录和目标 field ID 作业务确认，不能根据 SUPPLIER 推定，不能把“系统编码”自动忽略。

## 无障碍与跨年龄

Eidos 提供原生 `<table>`、`th scope`、form label/原 select/keyboard input、screen reader 当前可见数 `aria-live`；手机宽度通过公共媒体查询切换为单列大触控区域而非横向压缩。自动化验收使用真实隔离 Host + Chromium 22列172行合成 XLSX，桌面和 390px touch 上访问**同一个 /map**，切换需关注⇄全部、选项重建/保留、展开证据与没有横向滚动。Chromium 模拟≠客户设备/真实 XLSX Human 签收。

## 安全与数据修复

Eidos view filter 只更改现有 DOM row.hidden，不调用 Host、不移除 input、不授权任何执行。原排他目标选项、无效目标/同名用途比较、人工修正、Repository、映射 Recipe、确认及未完成导入的原始 172 行永久由 EVO Host 校验/保存。参数、权限、schema、source binary 和 Agent WRITE 保持不变。不能把合成 172 行的最终结果当成客户真实工作簿的已签收结果。

## 证据与剩余问题

- 官方框架 Eidos #189 `main@0d72472f86ebb5fc29ca4cc6e7974bd39691f009`；E1 #188 已可供未来业务概览组合，但本次只消费 E2。
- 应用 owner `apps/data-import/page.ts`；公共 Eidos vendor: `vendor/eidos/src/runtime/contracts.ts`, `validate.ts`, `render-model.ts`, `renderers/html/index.ts`, `app-host/page-controller.ts`, `design-language/productive-workbench-css.ts`。
- Protocol `tests/protocol/data-import-human-experience.test.mjs`；真正 Host Chromium `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`；全部原 BEX/Lightweight Host、项目连续性和 Human UI Gate 必须在**合并前最终 HEAD** 通过。
- 验收结果按「E2 /map 四列表格成功」「E3 连续工作步骤尚未实施」「E4 V3 原型完整 Human 验收未完成」分别说明。与原型尚存的**文件工作表卡片、统计、问题清单、底部操作与保存反馈**缺口必须 E3/E4 按场景补完，不能借用这次表格合并来宣称全量 V3 完成。
