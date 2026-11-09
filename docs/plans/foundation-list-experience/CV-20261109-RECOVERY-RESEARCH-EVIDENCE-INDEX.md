# CV 旧窗口研究遗产、网址和实现证据交叉索引（2026-11-09）

> **类别：RECOVERED_REFERENCE_INDEX / SOURCE_PROVENANCE / NO_NEW_RESEARCH CLAIM。** 本文件**复用** 2026-11-06 早已归档的 [一手外部来源 EX01–EX08 与内部 H01–H10](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)，结合本轮 GitHub PR/源码读取作交叉核对；不是声称 2026-11-09 重新打开八个网页逐页核查。完整旧聊天导出当前未提供，不能声称找回所有过去的搜索结果。
>
> **执行入口**：[恢复交接](CV-20261109-RECOVERY-HANDOFF-ENTRY.md) → [唯一 CV-00~07 工作计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) → [CV-03 具体存储门禁](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md)。
>
> **复核锚点**：Platform `main@d5eb20f1b7ef4a682855e857cc33681b56e40d82`（2026-11-09）。以下分开列“来自旧研究”“原代码事实”“本次 GitHub 实际核对”“未来门禁”。

## 1. 外部一手资料原始网址与最终取舍（旧研究资产，完整保留）

| ID / 来源（2026-11-06 原研究索引） | 可恢复的阅读范围/机制 | 采用结论 | 放弃与限制 |
| --- | --- | --- | --- |
| **EX01 SharePoint 列表/库视图**：[Microsoft Support](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | 支持用户个人/公共视图，选列、过滤、排序、分组与保存；历史索引特别区分 SharePoint Server 2019/2016 与 Microsoft 365 | **采用记录和视图配置解耦、个人/共享视图作用域** | 不复制 SharePoint 的数据/权限/服务器结构，不混称 2019 与 Microsoft 365 功能 |
| **EX02 SharePoint 2019 性能边界**：[Microsoft Learn](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | 区分列表总容量与特定查询大于 5,000 行的处理/阈值限制 | **采用服务器端分页、过滤、索引、预算** | 不把 5,000 直接写成 EVO 统一上限 |
| **EX03 Odoo 19 View architectures**：[Odoo 官方](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | List/Search/Kanban/Graph/Pivot 是领域模型上的声明式视图，图表聚合和看板行为有业务限制 | **采用模型/视图/渲染分离** | 不引入 Odoo XML/Python 或所有表格自动支持 Kanban/Chart |
| **EX04 Power Apps Grid**：[Microsoft Learn](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 支持受控 Grid、分组/汇总/滚动等密度体验及明确局限 | **借鉴通用列模型、密度、桌面/多端交互** | 高级内联编辑、无限滚动和完整 Grid API 不列首轮必要实现 |
| **EX05 SAP Fiori List Report + Object Page**：[SAPUI5](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | 集合过滤/操作到对象详情的组合页面模式 | **采用列表→详情→返回与统一信息架构** | 不另造 Eidos 导航或照搬 SAP UI 框架 |
| **EX06 明道云视图**：[官方 View introduction](https://help.mingdao.com/view/introduction/) | 同一工作表的多种表格/看板/层级/甘特/自定义视图 | **视图不改变源数据，多形态可扩展** | 不默认注入任意 HTML/JS 插件，视图不是业务事实 |
| **EX07 明道云应用**：[官方 Application introduction](https://help.mingdao.com/application/introduction/) | 应用/工作表、视图、角色、图表、流程分层 | **采用对象/权限/视图/分析分层** | 不做所有领域共用一个“万能业务表”的模型 |
| **EX08 W3C WAI-ARIA APG Grid**：[W3C Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 普通静态 table 与可交互 grid 的焦点/键盘策略不同，涉及箭头、Tab、Enter、F2、Esc | **首轮只读 Table 语义优先；交互 Grid 另做键盘/读屏门禁** | 不仅换 `role=grid` 就宣称可访问性完成 |

**准确阅读级别**：2026-11-06 原作者在 [原索引 §1](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 写明检查公开原文对应章节/检索结果，但并非所有网页完整截图/所有厂商实际账号场景；2026-11-09 本窗口未重开这些网页。设计启示的“采纳”是**产品设计决定**，不是实现外部厂商所有能力。研究证据可更新时定向复核相应 URL，而不重做全部行业研究。

## 2. 已恢复的内部历史研究与“不能重新发明”的代码资产

| ID | 原始资料（本仓库） | 可恢复的结论/目前作用 |
| --- | --- | --- |
| H01 | [基础对象平台架构](../../architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md) | Domain owner 维持事实/权限/投影，EffectiveObjectSchema 统一 LIST/FILTER/IMPORT/EXPORT；至少第二异构 owner 证明再抽象 |
| H02 | [基础对象体验、导入、工作台](../../architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md) | 一份业务事实、多角色投影；包含较早 SAP/Dynamics/Odoo 研究，不把历史结论误标 11-06 新检索 |
| H03 | [2026-10-12 原始列表方案](PLAN.md) | `ListExperienceDefinition`、`SavedListView`、BI/Agent 插槽为当时**候选**，原 L0–L5 不可冒充实现 |
| H04 | [Business Experience Framework](BUSINESS-EXPERIENCE-FRAMEWORK.md) | Eidos 决定页面/多端、Host 决定治理、领域插件决定业务；单据/审批不是简单列表基类 |
| H05 | [2026-10-12 原研究证据](REFERENCES.md) | 历史读过/只见摘要/未取得原文的分类不能由后来研究追溯改写 |
| H06 | [Foundation 字典/组织/人员/建模任务](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md) / [六步](FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md) | 独立业务 owner/里程碑，CV 只适配，不把既有字典或导入成就计入 Saved View |
| H07 | [Plugin Platform Mainline](../../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md) / [Plugin Protocol](../../architecture/PLUGIN-PROTOCOL-v0.1.md) / [边界宪章](../../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | 原 Package/Feature/Contribution/Capability Operation 生命周期与按需装载是惟一入口 |
| H08 | [Agent Capability Fabric v0.1](../../architecture/AGENT-CAPABILITY-FABRIC-v0.1.md) / [Agent WRITE Receipt](../../architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md) | 通用 Fabric v0.1 是 READ/PLAN，**内部** Personal Agent 的 Host 工具已有独立 `invoke.write`；实际 WRITE 必须有合法 Operation/权限/回执 |
| H09 | [AI 原生 Agent 状态宪章](../../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) | Durable Run/Context/Receipt 与 Human 权威、跨会话/换模型可恢复；EC 学习不能代替业务 owner |
| H10 | [Human 体验门禁](../../governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md) | Eidos/V3 功能、布局、颜色和 390px/桌面两端操作都需真实证据，CI 不等于用户签收 |

**另外保留的实际落地研究**：[CV-00 重复开发审查](CV00-20261106-COLLECTION-CONTRACT-REUSE-REVIEW.md)、[架构决定](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[CV-02 Eidos 采用评审](../../ui-design-reviews/cv02-eidos-catalog-view-adoption-20261106.md)、[两 owner 列表实证](../../ui-design-reviews/CV02-REAL-OWNER-LIST-VIEWS-20261109.md)、[详情返回设计及正反向测试](../../ui-design-reviews/CV02-COLLECTION-DETAIL-RETURN-20261109.md)、[个人 Agent Host 运行描述](CV02-PERSONAL-AGENT-AUTHORIZED-READ-RUN-20261109.md)。后一个文件第 3 行“CI 尚需核验”为**提交时历史快照**，其后 #1172 已合并；阅读时以 PR 和唯一状态表为准。

## 3. 核验过的 GitHub PR 与责任边界

- [Platform #1163](https://github.com/jiangxng/EVO-App-Platform/pull/1163) / [#1165](https://github.com/jiangxng/EVO-App-Platform/pull/1165)：Dictionary / Counterparty 两个**真正领域 owner**的有限 Collection READ、字段/权限投影。已 merged；不等于生产数据 Agent Run。
- [Eidos #209](https://github.com/jiangxng/eidos/pull/209)：已 merged，上游在既有 CatalogBrowser Table 增加可选 `table.views`、安全 route；[Platform #1167](https://github.com/jiangxng/EVO-App-Platform/pull/1167) 已 merged，定向采用对应上游组件，不创建另一 Eidos 框架。
- [Platform #1169](https://github.com/jiangxng/EVO-App-Platform/pull/1169)：已 merged，Dictionary 系统 all/draft/published 和 Counterparty 客户/供应商/我的真实 owner 页面视图。
- [Platform #1170](https://github.com/jiangxng/EVO-App-Platform/pull/1170)：已 merged，带有界白名单的 `returnTo` 查询状态恢复；**不等于浏览器焦点已实测**。
- [Platform #1172](https://github.com/jiangxng/EVO-App-Platform/pull/1172)：已 merged，`tests/integration/cv02-personal-agent-authorized-collection.test.mjs`；固定 Principal + 内存资源，真实两 owner、内部 Personal Agent 工具/Host，**无外部 LLM**。
- [Platform #1173](https://github.com/jiangxng/EVO-App-Platform/pull/1173)：已 merged，`tests/protocol/cv02-real-owner-agent-human-collection.test.mjs`；真实字典 owner、Human/Agent 有权结果一致、字段遮盖、撤权/换企业/停用拒绝。实际读取 `package.json` 证实 `npm run test:platform` 的 `tests/protocol/**/*.test.mjs` glob 纳入此测试；真实 Agent 语言对话/Human 仍未证实。
- [Platform #1175](https://github.com/jiangxng/EVO-App-Platform/pull/1175)：已 merged，纯文档含 Saved View 存储与 Agent WRITE 门禁；该 PR 不含业务功能。其 merge commit `d5eb20f1b7ef4a682855e857cc33681b56e40d82` 为本次基线。

**自动化证据分级**：现有八步状态文档记录 #1163/#1165 的 45/45、#1167 的 9/9、#1169/#1170 的 45/45、#1172/#1173 的 5/5、#1175 的 4/4；本次检查了相关 PR 合并元数据，并读取了若干 GitHub check-runs 中的 `protocol-and-core`、`lightweight-host`、`continuity` 等结论，但**没有本地/真实 Host 重跑全套 CI**。这些历史计数为“仓库已记录的 CI 证据”，不是本恢复窗口产生的完整复验结果；要关闭具体门禁仍需由实现 PR 针对准确 HEAD 重新确认。

## 4. 本轮代码实际读取证据：为什么 CV-03 不能跳过 C3-01

| 路径 / 已核实代码事实 | 正确结论 | 不得推论 |
| --- | --- | --- |
| [contracts/enterprise-resource.ts](../../../contracts/enterprise-resource.ts) · `EnterpriseResourceRepositoryV010` | 提供 `get/list/put/archive` 和可选 `transaction`，`put` 无公开 `expectedRevision` / CAS 语义 | 不能声称跨实例同时保存不会覆盖 |
| [providers/enterprise-context/resources.ts](../../../providers/enterprise-context/resources.ts) | 内存/文件资源 Provider 的 `transaction` 使用实例内 snapshot；文件持久层出现 `writeFileSync` / `renameSync` | 文件替换原子性 ≠ 同版本条件写互斥，实例内 snapshot ≠ 多 Worker CAS |
| [contracts/enterprise-business-definition.ts](../../../contracts/enterprise-business-definition.ts) | 有 `expectedRevision` 业务定义修订语义，是独立 owner；详情参阅 [CV-03 决策](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md) | 不拿该仓库存个人视图，也不能借语义推断 resource provider 的跨实例事务 |
| [contracts/data-collection/query.ts](../../../contracts/data-collection/query.ts) / [vendor/eidos/src/catalog-browser/contracts.ts](../../../vendor/eidos/src/catalog-browser/contracts.ts) | 已有有界 READ / schemaRef / Eidos 系统视图 | `table.views` 不是持久 Saved View 配置数据库 |
| [agents/enterprise-agent/capability-fabric-tools.ts](../../../agents/enterprise-agent/capability-fabric-tools.ts) / [manager/capability-operation-access.ts](../../../manager/capability-operation-access.ts) | 内部 `evo.capabilities.invoke.write` 与现有 WRITE/授权机制可以作为未来 owner 入口 | 没有 Saved View owner Operation 就不能保存，更不能私建 Agent URL |
| [tests/protocol/cv02-real-owner-agent-human-collection.test.mjs](../../../tests/protocol/cv02-real-owner-agent-human-collection.test.mjs) / [package.json](../../../package.json) | mandatory protocol glob 确已包含新增真实 owner/Host/Agent 用例 | 测试使用内存资源/固定身份，不是正式多实例 CAS 或 LLM 自然语言证据 |

### C3-01、02、03、04 的固定先后门禁

**C3-01 条件存储**：获得 Provider owner 的可核实跨实例后端原子比较写入/冲突/重启读回合同。对不支持的 Provider，Saved View WRITE 必须 fail closed。不能因为存在 `transaction` 或 `renameSync` 就绕过。

**C3-02 个人视图**：真实 Personal Principal + Enterprise Context 绑定、由源 owner 验证字段/sort/filter/schema、受管 READ/WRITE、持久 receipt/readback；Agent 只通过原 Host 内部 `invoke.write`。

**C3-03 共享视图**：另有共享管理权限/409 类冲突、撤权与旧 Schema 修复，且没有扩大任何源 Collection 的行列权限。

**C3-04 实际签收**：登录 Human 浏览器、desktop/390px、真实模型自然语言“保存我的香港供应商视图”，显示正确 Operation/回执、跨页面重进恢复、未知 WRITE 不盲目重试。

## 5. 被放弃方案的可复核理由（历史结论，禁止误改为已实现）

1. **SharePoint/明道云式统一事实表或万能 BaseList 深继承**：伤害 Domain owner 与账本/权限边界，难以兼容字典发布、往来角色投影、导入任务等异构插件。
2. **Platform 新建第二 Eidos/List/UI Renderer**：与 Eidos 独立 owner、V3 风格和多端主权冲突；已通过 Eidos #209 + Platform #1167 增量采用路线证明可复用。
3. **新 Agent SQL/可执行脚本/私有 WRITE API**：绕过白名单、Principal/Enterprise/Feature 动态鉴权、Host receipt；使用现有受管 Capability Operation/ActionHost。
4. **仅 localStorage、通用 Map、普通 `get→put` 或 Business Definition Repository 存 Saved Views**：跨账号/企业、跨进程版本写入、重试与持久读回没有可信证明；必须先做 C3-01。
5. **首轮复制全能 Grid、Pivot、任意图表或全表客户导出**：来源/字段聚合权限、按需装载与真实业务样例缺失；按 CV-06/07 渐进实施。
6. **把全部当前页 rows 作为图表统计或 Agent 事实**：当前页不等于有权全集，聚合要由 owner 服务器返回合法计数、单位、asOf 和隐私预算。
7. **只凭测试绿关闭 Human、LLM 或上线状态**：自动化只验证所覆盖的固定边界；真实语言推理、390px/键盘焦点、跨企业/插件停用的人体任务独立门禁。

## 6. 来源遗产仍有缺口及定向补救规则

- **缺失**：2026-11-06～09 旧聊天全文附件/逐句搜索记录、未经归档的个别网页、原来讨论时截图和真实登录 Host/LLM 运行日志。此次未在当前聊天附件或可检索文件中找到对应完整原始导出，故不臆造。
- **已有**：上述 EX01–EX08 所有原始 URL、H01–H10 历史原文入口、CV-00/01/02/03 的 GitHub 一手资料与合并 SHA。**不需要重新进行全量竞品研究**。
- **仅在触发特定变更时才搜索**：需实现高级 Grid 再定向核对 Power Apps/WAI-ARIA 当前标准；需做共享视图 UX 再重查 SharePoint/明道云作用域；需更新 Eidos 插件接口则先读对应最新 owner 代码；需证明跨实例安全则看实际 Provider 与多 Worker 测试，外部竞品文档无法替代。
- **下一轮核验前置**：每一实现窗口先刷新 Platform main、Eidos upstream pin、Provider 所在的真正 owner；记录准确 commit/CI/截图/receipt/Human 签收，不沿用本索引的固定 SHA 作为新的实测证据。

历史研究遗产应持续留在原 `docs/plans/foundation-list-experience/` 与 `docs/architecture/`；本文件是**指针和证据勾稽，不是对旧资料的替换**。
