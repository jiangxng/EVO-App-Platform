# BEX-01 / CP-03 V3｜真实 Host 来源列核对闭环（2026-10-15）

**性质：** V3 实际产品增量实施与决策记录；沿用 [V3 交接入口](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-HANDOFF-20261015.md)、[原始资料与阅读等级索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md) 及 [高保真质量依据](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-BUSINESS-OFFICE-HIGH-FIDELITY-QUALITY-REFERENCE-20261015.md)。这些资料位于 **Draft #909**，本 PR 不引入或合并其 HTML 原型，不重做外部研究。

## 最新基线与不重复事项

- 本实现分支基于 EVO `main@28912c50b2d786b099c9a0a5fe9927d786a3134b`，其中新增 PA05 #923；交接快照 `60366fa` 已过时。Eidos `main@4c2f36040bdca102b67ba65acb7b35998261ab7d`。
- #921 已在 main：未完成的真实企业 Job 优先展示、保留原有任务并可继续核对；本次不重复实现。
- #860 OPEN，涉及 `apps/data-import/page.ts` **映射表单段**、扩展字段和共享 Host；#878 OPEN，涉及共享 Host/批量字段设计；#846 与 #909 均 Draft。**本次只修改预检查页、独立来源核对帮助模块与专项测试，不更改映射表单或 Host/server。** 合并前仍须与 #860 验证无冲突。
- #909 的 172 行/22 列/三条问题是合成评审场景，不能冒充已读取原始 Excel。真实 `往来账户2026_10_08_10_15_23.xlsx`、授权 Import Job JSON、本地现场截图附件仍未取得。

## 这个闭环真正解决的问题

当前 `createDataImportReviewPageV010` 只列出前 30 行预检结果，无法核对全部来源列，尾部错误也容易被遮住。平台数据模型其实已经拥有 `job.source.headers/rows`、`mapping`、`ignoredSourceColumns`、`dryRun.rows` 与 `appliedRecipeId`，本轮**直接复用该 Host 持久业务记录**：

1. 预检异常行先于成功行显示，无论异常位于源文件哪个行号；真实行号不改。最多显示 30 个行摘要，其余问题仍由原错误清单能力读取，不误称“全部异常已显示”。
2. **每一个来源表头**都变为可核对的实际记录：原 Excel 列顺序、非空原始样本（最多 3 项、每值至多 100 字符）、当前目标 field ID、映射/可撤销忽略/待处理状态。**样本仅为预览，全部原始行值仍存放 Host Job，未被替换或裁剪**。
3. 当 schema 中出现多个同名目标字段时，列旁展示每个目标的 **field ID 与 `resolvedDescription` 业务用途**，保留已确定目标，不依据同名自动更改。正式字段用途若尚未配置，仍要求业务 owner 核验，不凭猜测命名。
4. 错误行显示与其 field ID 关联的**原始 Excel 字段值**，而不是已转换/推测值。若 `subjectType` 缺失则显示空值，不从 `SUPPLIER` 关系角色推断主体身份。
5. 未提交任务的每列提供“核对或调整本列”入口，复用原来的真实映射编辑页；已提交/部分提交 Job 不提供该入口。**此入口暂非同卡内的行级值编辑**，不能误报“异常就地修正已完成”。

## 权威、安全与边界

- 读取仍使用已有真实导入页面受企业权限约束的 Job，无新 endpoint、无浏览器本地数据写入、无绕过 `canManageEnterpriseContext` 的动作、无 Agent 代替 Human，源码只产生 Eidos CatalogBrowser items。
- `RECIPE`、已确认目标、`ignoredSourceColumns`、原始来源列/行、dry-run、审计与导入提交行为**全部未改**。忽略列保留、可通过合法映射流程修改；映射目标仍遵守现有一对一校验。
- 不触碰 Object Extension Schema 创建、Owner 审批、批量字段提交、数据提交、Eidos 核心 token、Railway 和 PA05。
- 预览提供 **3 个非空样本而非全行浏览**；如业务要求核查全部 172 行/22 列原值，应另行设计分页/授权下载或逐行核对，不能把本轮认定为已完成。
- 提交门禁维持原有 `DRY_RUN_READY` + 明确确认，不因核对页出现绿色状态而自动写入。

## 验收项目｜当前状态｜下一步

| 验收项目 | 当前状态 | 下一步 |
| --- | --- | --- |
| 原始来源列顺序与逐列可见 | **MERGED #925；真实 Host Chromium + 专项协议 PASS（隔离测试数据）** | 测 22 列、移动 Eidos 卡片真实可操作 |
| 同名开户银行业务区分 | **已有字段 ID + 描述可核对，真实客户 schema 尚未取得** | 按授权 Job 和真实 field ID 逐一核实，不根据文案推断 |
| 3 行缺失主体类型 | **合成边界回归 PASS，原始空值未被猜测；真实身份未验证** | 真实授权 Job 中逐行核对并依法修正 |
| 原始数据与已确认 Recipe 保全 | **复用持久 Host Job 只读，专项回归 PASS；真实文件仍未核验** | 权限/企业隔离/草稿回归与真实文件核验 |
| 异常就地修正 | **未完成：当前只关联原值与回到已有映射页** | 先明确受控行级修正契约、预检查失效及回滚机制 |
| 字段候选比较 | **同名候选 ID + 用途可读；不自动选定** | 在真正映射控件就近选择与可用字段用途联动 |
| 集中新增扩展字段 | **本轮未实施，保留 #860/#878 的独立 owner** | 与开放 PR 合并顺序协调，保留批量审核 / 幂等 |
| 真实 Host/手机/Human/CI | **隔离 Host Chromium 桌面/手机通过；真实 XLSX 与真人 Human 仍未验收** | 检查 scoped workflow、完整安全回归及真实中文截图 |
| 生产部署和真实企业写入 | **未执行，未获授权** | 独立部署授权和私有原始 Excel/Job 验收 |

## 来源与进一步决策

本轮**没有新增互联网来源**；完全继承上述 V3 详细索引的 A/B/C/D 阅读等级，不把旧搜索摘要冒称本次阅读。实际代码与设计审查见：
- `apps/data-import/source-audit.ts`、`apps/data-import/page.ts` 的 review 部分；
- `tests/protocol/bex01-v3-source-audit.test.mjs`；
- `docs/ui-design-reviews/bex01-v3-host-source-audit-20261015.md`。

**下一个最小真实门槛：** 数据 owner 授权的逐行原值修正如何持久化、如何失效 dry-run 与 Recipe，且不可越权修改或在重试中重复提交。先读现有 import service/repository 权威，不要新造一套浏览器假持久化。

## 2026-10-15 合并后证据（后补，替代上表的“待 CI”历史状态）

- 独立正式实现 [PR #925](https://github.com/jiangxng/EVO-App-Platform/pull/925) **MERGED**，合并 `main@d754b1e378487f182232bfbc2f183175e2fbad72`。合并前将 PA05 最新 `main@c00f6cd7224f08a479936c36584bb84565d2f67f` 无重叠同步至实现分支，required `continuity` 正常通过，GitHub 显示 `mergeable_state=clean` 后正常合并，未绕过规则。
- 同步后的全部六项 CI 通过：[Platform #38705971376](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38705971376)、[真实 Host Chromium #38705971453](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38705971453)、[导入专项协议 #38705971433](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38705971433)、[Human UI #38705971400](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38705971400)、[Project Continuity #38705971386](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38705971386)、[Lightweight Host #38705971387](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38705971387)。
- 实际隔离 Host/Chromium 141 完成原有供应商完整旅程 **5/5 PASS**，附加 `BEX01_V3_HOST_SOURCE_AUDIT_PASS:DESKTOP` 与 `...:PHONE`（390px 触控模拟）。业务验证数据为**隔离测试 CSV**；22 列/三缺失/两同名候选的专项数据为**合成协议测试**。不等于读取用户 XLSX、真实企业数据提交、实际真机或用户 Human 签收。
- 这是 **DEV_COMPLETE（来源列只读核对闭环）**，不是 **V3_COMPLETE**、**PRODUCTION_READY** 或 **DEPLOYED**。仍缺行级原值就地修正、真实映射页候选比较、集中新增方案闭环以及用户授权真实 Job 的身份修正验收。
- #860 仍是映射表单/单字段扩展创建开放实现；#878 涉及 Host/批量设计并含并行认证变更；#909/#846 为 Draft 研究/交接。**在这些 owner 分支对齐前，不要重复修改其 shared Host / mapping 段落。**
