# CV-03 / N1-04e～04l｜研究资料、方案决策与证据的详细索引

> **编制时间：2026-11-11；归档工程窗口：2026-11-10 的 #01～#07。** 对应[简短交接入口](CV03-N104L-WINDOW07-RESEARCH-HANDOFF-ENTRY-20261111.md)。
>
> 本资料基于 `jiangxng/EVO-App-Platform` 的 `main@560af7b5227194fb384d02de8fcd8396178a11b3` 创建独立 docs 分支。**本次交接只通过 GitHub 已存的历史研究索引复核旧外网阅读记录，并没有重新打开厂商官网**。不会把新编制日伪写成网页查阅日。现有网页原文/搜索摘要的记录来自下列历史文件，任何旧网页不等于已经保存完整页面。
>
> **证据纪律**：来源事实（F）≠ EVO 架构判断（D）≠ CI 隔离工程验证（G-CI）≠ 正式生产审批（P，尚缺）。生产 N1=**NOT_CERTIFIED**；正式 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE 403、未注册 Saved View Page GET 404 保持；无真实外部 LLM/Human 390px 验收。

## 0. 索引规则：分清网页、历史和当前代码

| 标记 | 必须具备的证据 | 本次处理 |
| --- | --- | --- |
| **R / 已读官方正文相关章节** | 以前相应窗口明确记录了打开原始网址并取回可读章节，保留日期、章节名和范围 | 仅按[2026-11-10 N1-04d 已存索引 §1](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)继承，**不是本次 #01–#07 重新浏览**。 |
| **H / 历史已读正文** | 2026-11-06 的 [EX01～EX08 原研究记录](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)或 2026-10-12 的 [S01～S08 记录](REFERENCES.md) | 只称“历史研究记录已读”，不称今天重新访问。 |
| **S / 仅搜索摘要** | 当时只有搜索结果摘要而打开原文失败/无正文 | 只保留搜索线索，不作精确版本/实现事实。此类包括 10-12 S01/S08。 |
| **U / 待验证** | 相关复查时超时、来源工具不可访问或 HTML 页面无正文 | 保留历史 H 但不可升级为此次 R。包括 11-10 EX03/EX04/EX05。 |
| **G / GitHub 文件或 Actions 源数据** | 本工程窗口实际通过 GitHub API 读取源码、commit、PR 和工作流 job/log | 能证实具体模块和 CI SHA；**测试 schema 不是生产运行**。 |
| **D / 工程判断或候选方案** | 由已有协议、来源事实和失败模式推导，非厂商原文或 Owner 签收 | 例如选定现有 Platform 方案、建议统一生产 PG 权威源和拒绝 unsigned DML。 |
| **P / 生产/人类实证** | 实际生产 DB 主体与 KMS、签收、部署/人类浏览器及真实 LLM 调用证据 | **本次没有，不得用 G-CI 或 D 替代。** |

原站点可能改版、链接需要登录、动态 Actions 日志会过期。优先用固定 GitHub PR/commit、Markdown 中保存的事实级别及明确章节名复核；**本仓库没有本次新增网页完整 HTML/PDF/截图/厂商操作录屏**。

## 1. 外部官方研究 EX01～EX08（原网址、日期、状态、章节、用途）

以下 **EX01～EX08 的“11-10 R/U”仅指较早 N1-04d 研究窗口的历史记录**。本次 #01～#07 没有新的厂商网页访问；其关键发现取自[旧窗口详细索引 §1](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)和[11-06 原始研究](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。

| ID / 标题 / 原始网址 | 查阅日期、阅读层级及可重找章节 | 来源事实/主题（F，限历史已记录范围） | EVO 具体用途/判断（D，不是供应商批准） |
| --- | --- | --- | --- |
| **EX01** · [Microsoft Support: Create, change, or delete a view of a list or library](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | **2026-11-06 H、2026-11-10 R-相关正文**；「Applies To」「Create new views」。本次未重开 | SharePoint Server 2019/2016、M365/Lists 适用范围有版本差异；个人/公共视图、列、筛选、排序；**Gallery View 文档描述为 SharePoint Online 专有** | 业务事实与个人/企业共享视图配置分离，落到 Domain Owner Saved View + Eidos。**不把 Online 的新功能算给 SharePoint 2019**，C3-03 企业共享另审权限。 |
| **EX02** · [Microsoft Learn: Software boundaries and limits for SharePoint Servers 2016 and 2019](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | **2026-11-06 H、2026-11-10 R-相关正文**；「Boundaries, thresholds, and supported limits」→「Items」「List view threshold」。本次未重开 | 官方区分 supported total list item 容量（30,000,000/list）与**单次操作处理超过 5,000 条**触发的视图阈值，并有例外与具体限制 | EVO 应按真实业务 Query 做服务端索引、筛选、分页、查询预算。**不把 5,000 当 EVO 固定最大行数，也不当 PostgreSQL SLA**。 |
| **EX03** · [Odoo 19: View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | **2026-11-06 H；2026-11-10 U-打开超时**；历史章节主题 List/Search/Kanban/Graph/Pivot。**本次没有原文新阅读** | 历史记录：视图属领域模型上的声明式展示与聚合，不同视图/聚合有数据约束；**11-10 未取得最新正文** | 多 Renderer 与领域模型分离；不移植 Odoo XML/Python 或假定任意字段可绘图。**优先补查：按 19.0 版本实际章节重开，保存摘录和版次**。 |
| **EX04** · [Microsoft Learn: Power Apps grid control](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | **2026-11-06 H；2026-11-10 U-来源工具无法访问**；历史能力 Grid/view/subgrid、配置选项/limitations。注意原链接无 `en-us` | 历史记录：同一 Grid 有密度、分组/汇总、只读/编辑、滚动等受配置与端侧限制的能力；**不能从 11-10 访问失败推出页面被删除** | Eidos 表格共用 Query/Field Schema/权限，先稳定 read-only；暂缓嵌套编辑/无限滚动。**须用旧 10-12 S02 已读章节交叉核对版本差异**。 |
| **EX05** · [SAP Help Portal: List Report and Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | **2026-11-06 H；2026-11-10 U-HTML 壳无可读正文**；历史 List Report/Object Page。无此次新正文/截图 | 历史记录：List Report 处理对象集合、过滤与动作，Object Page 展示/处理单体；**10-12 S01 也仅搜索摘要** | 在原 Eidos 中统一列表→详情→合法状态返回；不复制 SAPUI5/不宣称按该链接重建了控件规范。未来需再次取得可读官方版本/章节。 |
| **EX06** · [明道云帮助中心：视图介绍](https://help.mingdao.com/view/introduction/) | **2026-11-06 H、2026-11-10 R-相关正文**；「概述」「视图的基本组成」「10 种视图样式」「视图的显示与隐藏控制」。本次未重开 | 工作表事实与视图配置分开；筛选/排序/字段显示和多种视图；旧页面写明管理员创建/配置视图和分配可见人 | EVO 复用视图声明、多形态渲染，但**明道云管理员可见性规则不等于 EVO 个人视图 Owner 权限**；不开放任意插件 JS 直接绕过 Host。 |
| **EX07** · [明道云帮助中心：应用介绍](https://help.mingdao.com/application/introduction/) | **2026-11-06 H、2026-11-10 R-相关正文**；「应用的 7 个功能模块」→「工作表/视图/用户角色和权限/统计图表/工作流」。本次未重开 | 工作表、视图、角色/权限、图表、工作流是分层应用模块；一份业务数据有多视图 | 采用“业务 Owner→View→授权→分析”的边界；不把所有 EVO 业务对象整合为万能工作表。 |
| **EX08** · [W3C WAI-ARIA APG: Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | **2026-11-06 H、2026-11-10 R-相关正文**；「About This Pattern」「Data Grids For Presenting Tabular Information」「Keyboard Interaction For Data Grids」。本次未重开 | 交互式 Grid 要复合焦点和箭头/Home/End 等键盘模型；普通 table 的 Tab 语义不同 | Eidos 首期先实现语义只读表格，后续可编辑 Grid 要独立 keyboard/读屏/Human 验证；**role=grid 不等于通过无障碍验收**。 |

**2026-11-11 编制状态**：上述 EX 的 R/H/U 是已保留的**历史阅读元数据**，而不是新增实时网页证据；EX03/04/05 的正文当前“可重复取得”仍待验证。该限制是来源真实性要求的一部分。

## 2. 2026-10-12 S01～S08 旧研究来源（不要改写其摘要/原文状态）

精确来源为[历史 `REFERENCES.md` §2 第 26–93 行](REFERENCES.md)。下面不是本次网页访问结果，而是为了避免 S 类历史线索丢失的**二级索引**。

| ID / 原始题目和 URL | 原查阅日及原记录状态 | 历史章节/发现（F） | 当前用途与明确限制（D） |
| --- | --- | --- | --- |
| **S01** · [SAP: List Report and Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | **2026-10-12，仅搜索摘要；原页无正文** | 搜索摘要线索：列表处理集合、Object Page 处理单体 | 为 Eidos 详情导航提供线索，需官方可读正文验证，**不能标已读原文**。 |
| **S02** · [Microsoft Power Apps grid control](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | **2026-10-12，已读相关原文章节** | 「Configure the Power Apps grid control」「Known issues and limitations」：只读/编辑、分组/聚合、Reflow、能力配置与限制 | Eidos 多密度和字段复用；不能由 10-12 版描述推定 11-10 官方网页仍相同；无采购/许可认证。 |
| **S03** · [Microsoft: Import data in model-driven apps](https://learn.microsoft.com/en-us/power-apps/user/import-data) | **2026-10-12，已读相关原文章节** | 「Review mapping」「Map lookup columns」「Save mapping settings」：人工复核关联字段映射、保存映射和导入进度 | 复用现有 EVO Import Recipe/Target 和错误反馈；不能从 Microsoft 文档推断 EVO 已支持全部数据格式。 |
| **S04** · [Microsoft: FAQ for Excel to table and app](https://learn.microsoft.com/en-us/power-apps/maker/common/faqs-excel-to-table-app) | **2026-10-12，已读原文重点章节** | 「What can…do」「limitations」「operational factors and settings」：Copilot 建议字段/类型但可不准确，需人工审核且有地区/语言条件 | AI 原生 schema 建议必须 Human 审核、确定性校验与手动 fallback；不宣称中文质量或所有区域可用。 |
| **S05** · [AG Grid: JavaScript Data Grid SSRM Pagination](https://www.ag-grid.com/javascript-data-grid/server-side-model-pagination/) | **2026-10-12，已读原文相关章节**；当时页面记录 v36.2.0 / Enterprise | 「Enabling Pagination」「Server-Side Pagination」：按需请求范围，服务端分页，结果边界元数据 | 真正远程分页，不以全量内存数组伪造；未做许可证、成本和 SDK 选择，**不是 EVO 已采用 AG Grid**。 |
| **S06** · [W3C WAI-ARIA APG: Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | **2026-10-12，已读原文相关章节** | 「Data Grids…」「Keyboard Interaction…」：交互焦点/键盘，虚拟数据影响导航 | Eidos 键盘/读屏规范；不可用仅设置 role 取代真实用户签收。与 EX08 为同一来源的不同时段记录。 |
| **S07** · [Microsoft Power BI: Embed a report with RLS](https://learn.microsoft.com/en-us/power-bi/developer/embedded/cloud-rls) | **2026-10-12，已读原文相关章节** | 场景、static/dynamic security、`Generate an embed token`：App-owns-data 需有效身份/角色和令牌 | BI“链接跳转 / 授权嵌入”两路径，链接参数不能代表权限。未选购 Power BI、未取得实际租户许可。 |
| **S08** · [SAP Analytical List Page](https://experience.sap.com/fiori-design-web/analytical-list-page/) | **2026-10-12，仅搜索摘要；原页打开失败** | 仅线索：图表与表格融合分析页；无可读原文 | **待验证**，不能声称 BI 双路径来自其已读规范；EVO BI 仍为内部架构判断。 |

**阅读层次冲突说明**：S02 旧窗口曾读到 Power Apps Grid 原文章节，EX04 在 11-10 较早窗口复查失败；这不是“官网证明功能矛盾”，而是**不同日期/URL 版本/访问状态**。S01 和 EX05 都不能作为已验证的当日 SAPUI5 正文。S05 的 Enterprise 标识可能随价格、授权、版本变化，重新选型必须单独查当前许可。

## 3. EVO 内部来源 H01～H10（相对路径、章节和作用）

历史 `H` 信息来自[11-06 §2](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 与[11-09 恢复证据](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)。这些是**历史架构原文索引**，不是本工程窗口逐文件全文复查：

| ID / 相对文件路径与历史章节位置 | 来源事实/长期约束（F） | 用在何处（D） |
| --- | --- | --- |
| H01 · [Foundation Object 架构](../../architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md) §5–6、§12、§15、§20 | Domain Owner 保留业务事实、EffectiveObjectSchema、只读 Projection 和字段 Surface | CV Query 不吸收业务字段/创建/审批，企业 Saved View 不改变对象权威 |
| H02 · [Foundation Object 体验/导入](../../architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md) §6、§12–15 | 一份对象事实，多角色投影，导入独立且优先 | 复用已有 ImportTarget/Recipe，不与 CV 重做导入 |
| H03 · [原列表计划](PLAN.md) §9/§10/§13 | `ListExperienceDefinition`、`SavedListView`、BI/Agent 槽曾为提案 | 检查现有实际代码，不能因历史提案有字段名就认定已实现 |
| H04 · [Business Experience Framework](BUSINESS-EXPERIENCE-FRAMEWORK.md) | Eidos 体验、Host 生命周期授权、业务插件 Domain Owner 边界 | UI 和 Action 分离，避免巨型 BaseList |
| H05 · [10-12 Sources](REFERENCES.md) §2 | S01～08 的原文/摘要层级与原始链接 | 不把历史摘要洗成原文 |
| H06 · [字典、组织、人员、导入](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md) 与 [六步计划](FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md) | 已有业务模块和各自 Owner | 不重复完成功能、不把 CV 进度覆盖字典/Import 主线 |
| H07 · [插件主线](../../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)、[Plugin Protocol](../../architecture/PLUGIN-PROTOCOL-v0.1.md)、[Extension Constitution](../../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | Package/Feature/Contribution/Capability Operation，按需装载 | Saved View 走现有受管 Feature 和 Action Host；不创建独立 Agent 插件协议 |
| H08 · [Agent Capability Fabric](../../architecture/AGENT-CAPABILITY-FABRIC-v0.1.md) §3–12、[Write Receipt](../../architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md) | 基础 Fabric READ/PLAN 与受管 WRITE/回执权威不同 | 个人代理不能直接连数据库或绕开 Host Receipt |
| H09 · [Agent Context Constitution](../../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) §10–11 | Human 权威、Run/Context/Receipt 可恢复 | Actor 切换、撤权、LLM 行为可追溯 |
| H10 · [Human Experience Gate](../../governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md) | Eidos/V3 功能、布局、颜色、390px、焦点/返回和人工签收 | Host / PG CI Gate 与真实 Human 不得混为一谈 |

主要现行链接：[Eidos × Platform 决策](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[CV-00～07 正式近期计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[N1-05 生产集成决策（候选）](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)。后者明确写的是**Owner 待签收的技术方向**，并非原厂信息或已经批准的生产架构。

## 4. 本工程窗口 G：精确 GitHub 工程结果索引

**来源等级：G-已实际访问 GitHub PR/源码/Actions；测试/部署层次严格区分。** 各工程分支在合并后由 Branch Hygiene 删除，不从过期临时分支接续；在 [GitHub main](https://github.com/jiangxng/EVO-App-Platform/tree/main) 用固定合并 SHA 和相对路径重建。

| 阶段 | PR / main merge SHA、PG18 run | 原始代码/测试文件与事实 | 证据级别/限制 |
| --- | --- | --- | --- |
| **N1-04e** | [#1202](https://github.com/jiangxng/EVO-App-Platform/pull/1202) → `cf5d1bf0909d89aad4fdd559af9f54f02fbcab02` | [Domain Owner 原地址](../../../providers/enterprise-context/personal-saved-views.ts) 与 [N1-04e namespace builder](../../../tools/cv03-n104e-domain-owner-namespace.mjs)：`evo.saved-view.personal.<sha256(JSON.stringify([enterpriseId,subjectId]))>`，actorType 独立 WRITE Scope | 真实 Domain Owner 算法 + 隔离 SQL；**仍缺正式生产数据库 Actor 身份和权限角色** |
| **N1-04f** | [#1203](https://github.com/jiangxng/EVO-App-Platform/pull/1203) → `765aaf9344ac51a3c525533c16e61c104658ccb6`；[PG18 #42757377407](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42757377407) 22/22 | [Tenant READ SQL](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs) 加 ActorType/epoch/lease；[测试 T0/outbox](../../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs) + [PG18 回归](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs) | T0/T3 是**隔离权威表**，不与正式 PA05 lifecycle 共事务 |
| **N1-04g** | [#1204](https://github.com/jiangxng/EVO-App-Platform/pull/1204) → `5c6e4868317b1d829c6e63ca2ab3812570c25251`；[PG18 #42758775199](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42758775199) 22/22 | [SQL Outbox-bound ingest](../../../tools/cv03-n104g-isolated-outbox-bound-delivery.mjs)：事件签名必须匹配已提交授权行/不可变 test outbox；撤权后旧 ALLOW 不能续租 | 不代表正式 Host callback 已具备 durable ACK/事件序号 |
| **N1-04h** | [#1205](https://github.com/jiangxng/EVO-App-Platform/pull/1205) → `62a32723e177ff67464d7b83d7ff703e5777c7aa`；[PG18 #42760537334](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42760537334) 22/22 | [隔离 Producer SQL fencing](../../../tools/cv03-n104h-isolated-producer-fence.mjs)，真实 PG 登录 A/B、generation rotate、全部已知 Actor DENY tombstone、新代签名 T3 | **CI-only SQL 主体**，不是生产 KMS/workload identity，也不证明离线 SQL Mirror 可立即接收事件 |
| **N1-04i** | [#1206](https://github.com/jiangxng/EVO-App-Platform/pull/1206) → `d9ad5dd2b669a656eb0b7d9b1f4c07fadac306c5`；[PG18 #42762094767](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42762094767) 23/23 | **真实** [PA05 FileLifecycleStore](../../../manager/store.ts)：先写候选 JSON 再替换内存；[I/O 故障测试](../../../tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs)；真实 Manager 文件恢复与 SQL mirror 失联试验 | **负面发现**：Manager 重启 DENY 时旧 SQL mirror 仍可持有未过期 ALLOW |
| **N1-04j** | [#1207](https://github.com/jiangxng/EVO-App-Platform/pull/1207) → `104c1faf82e3ee80a9e27ef00d9e37d54f465ba3`；[PG18 #42763429048](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42763429048) 28/28；当时 46/46 GitHub checks | [正式 Host startup](../../../manager/server.ts) + [CV03 Admission](../../../manager/cv03-personal-saved-view-host-admission.ts)：恢复未经认证的 active Saved View Feature 在 HTTP 前拒绝；[真实 Host 子进程](../../../tests/agent-line/cv03-n104j-real-host-startup-quarantine.test.mjs) 正反例 | 本机拒绝不等于隔离另一 Host/远端 SQL 的旧 ALLOW；正常 bootstrap 可合法增加基础 Provider 状态 |
| **N1-04k** | [#1208](https://github.com/jiangxng/EVO-App-Platform/pull/1208) → `e53c27d4f04665c20ffdec1cac571fa60c5997a6`；[PG18 #42765285750](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42765285750) 33/33 | **真实** [PA05 Store](../../../manager/store.ts)：协作独占写锁、旧 writer revision 拒绝、随机 nofollow staging/fsyncSync 文件/父目录同步；[跨进程/symlink 回归](../../../tests/agent-line/cv03-n104k-pa05-file-writer-fencing.test.mjs) | 仅协作同路径进程，不是分布式/恶意同用户强隔离；仍可存在旧缓存读 |
| **N1-04l** | [#1209](https://github.com/jiangxng/EVO-App-Platform/pull/1209) → `560af7b5227194fb384d02de8fcd8396178a11b3`；[PG18 #42767415315](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42767415315) **38/38** | **真实** [PA05 Store](../../../manager/store.ts) 每次读取精确版本/锁核验；[跨进程真实 Manager 读权限测试](../../../tests/agent-line/cv03-n104l-pa05-authority-read-freshness.test.mjs)；[生产 Owner 决策与验收](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md) | 只读新鲜度仍非跨 DB 真正 T0；真实 N1-05 Owner 签收全部 OPEN |

**Actions 可重找与结果易失风险**：上述 PG18 统计已在 PR 最终 HEAD job/log 核验，0 FAIL/0 SKIPPED；N1-04e 的本表**未复查具体运行统计，故不编造用例数**。N1-04g 首个中间提交因替换 SQL builder 出错曾失败，后修复且以最终 22/22 为准；N1-04i 旧全量 Manager suite 中间一次 31/38，其旧断言未作 baseline-certification，正式改用独立用例 + 全量 Platform CI；N1-04j 旧正向测试误把合法 Host bootstrap 写入当错误，最终正例更正；N1-04l 中间测试误改顶层 JSON contractVersion，最终改有效同 inode 内容并重跑 38/38。这些**不能删掉失败历史，也不能把旧失败归咎生产**。原始 Runner 日志可过期，本索引保留 PR、最终 HEAD 的完整 SHA 和 run ID。更详尽逐轮源代码/marker 见各 [N1-04e～04l 专项交接入口](CV03-N104L-REAL-PA05-READ-FRESHNESS-AND-N1-RELEASE-HANDOFF-20261110.md) 及各同名前缀文件。

## 5. 采用/弃选/暂缓路线的可比对决策（F 与 D 分列）

| 路线与决定 | F：来源事实或已跑工程结果 | D：采用/排除原因、适用条件和限制 |
| --- | --- | --- |
| **采用**现有 Eidos + Platform + Domain Owner 集合/视图契约 | EX01/03/06/07 历史多视图资料；H01/H07 已有 Owner、Feature/Contribution、CatalogBrowser；CV-01/02 已有字典/往来业务读与详情 | **不建第二套 List Framework、万能业务表或全项目 BaseList 继承树**。公共层仅声明式 Query/View/Renderer，领域事实和字段权限仍在 Owner；适合真实两个以上业务插件复用验证 |
| **采用** Personal Saved View 先行，企业共享另开 C3-03 | EX01 个人/公共视图；当前 CV03 试验仅围绕个人 Actor+subject+企业，Human/AI 结果可不同 | 企业共享需要新角色/可见性/撤权授权，不能把个人私有事实当全员共享 |
| **采用** Human/Personal Agent 统一 Host Capability Operation，而非 AI 直接 SQL | H08/09 与实际 `manager/service.ts`、Host Issuer 代码；N1-04i/04l 真实 Manager 读/撤权用例 | Human 与 AI **同受管入口但独立 actorScope**；外部 LLM 只能通过有权 Host 工具。现有测试不等于已执行外部 LLM 场景 |
| **采用**数据库物理签名/身份闸门 + 同事务授权权威 outbox（**正式候选，待 Owner 签收**） | N1-01 证明 Node-only HMAC 可经普通 SQL INSERT 绕过；N1-04f/h 隔离 PG18 成功在测试表中提交授权与 outbox | 正式必须由 PA05/AuthorizationProvider/DB Security Owner 共签权威来源/生产 schema/role/KMS/恢复；不得直接部署随机测试 builder |
| **采用（局部）**真实 PA05 FileLifecycleStore 原子写、锁、每读版本验证与 Host startup quarantine | PR #1206–1209 真实 Linux 文件/Host 回归 | 保留现有宿主运行安全，不假装本地文件/协作锁解决远端 SQL Mirror；共享 volume/多 Host/恶意文件系统须另审 |
| **排除**普通 SQL LOGIN 直接代表每个 Actor/Enterprise 或复用测试身份 | N1-04f/h PG18 每身份 SQL 登录是受控 fixture，生产连接池/Role 传播未完成 | 正式要签名请求上下文、可信 workload identity、ActorType 绑定和最小 SQL GRANT；不信任 JSON 自报 actor |
| **排除**Node-only 验签 + DB 直接 DML；只靠异步进程事件声称可靠撤权 | #1194 物理绕行、#1206 异步漏投后 PA05 DENY/SQL ALLOW 差异 | SQL 必须阻断 unsigned DML，真实事实/outbox 需单事务或经 Owner 签收的 fail-closed 恢复；仅 TTL/epoch 在事件未到时无法即时发现撤权 |
| **排除**自建独立生产 N1 权威/复制隔离测试表 | #1203–1205 全部测试表使用 CI-only `PA05_OWNER_TEST_ONLY`、试验 HMAC，未接正式 Authorizer | 否则形成第二不一致权限中心；只复用失败注入/SQL 安全模式，先确认真正 production source-of-truth |
| **暂缓**高级 Grid/全量 Inline Edit/无限滚动、任意 BI 脚本、企业共享视图 | EX03/04/08、S05/S07/S08；真实 Eidos 表/详情已有 | 优先受管只读表、筛选/排序/分页/详情返回；图表按已认证字段维度/聚合和 renderer 扩展，键盘/读屏与实际企业共享单独验收 |
| **采用**两层研究交接（本文件 + 简短入口），不覆盖主计划 | 历史窗口曾因长聊天丢失临时研究，旧计划与后续 PR 状态出现漂移 | 只做增量导航和证据索引，旧原文/决策日志原封保留；不编辑并行 PR #1184 的三份文件 |

## 6. 资料冲突、来源不一致与未解决缺口

1. **SharePoint Server 2019 vs Microsoft 365**：EX01 文档跨版；不能把 Gallery view/新功能自动认为 Server 2019 支持。EX02 的 30M *列表总 supported 数* 与 5K *单次视图处理阈值* 量纲不同，**不矛盾**，也不应该映射成 EVO 的统一硬阈值。
2. **同一产品访问层次冲突**：EX04 11-10 访问失败并不抵销 S02 10-12 已读正文；EX05/S01 当前缺可读 SAP 原文，不可套用精确 Fiori 交互；EX03 Odoo 19 待重开后才能核实对应版本图表/Pivot 细节。
3. **历史计划 vs 新代码实际状态**：11-06 主计划、11-09 恢复审计和 #1184 较早文档可能仍把后续 N1 任务标未实现；以 **最新合并 main + 本窗口 PR #1202–#1209** 为工程现状，但不能从“隔离已实现”推生产 READY。历史快照不抹除。
4. **同主体 Human/AI 权限是否相同**：复用 Capability Operation 不代表 grant 同一。N1-04e/f 证明模拟 actor-scoped SQL，但真实 pooled Actor principal、授权 Provider 的企业/角色权威还没有生产签收。
5. **真正的源权威不一致（P0）**：N1-04i 实测 PA05 持久文件已 DENY 但独立 SQL mirror 未收到事件仍 ALLOW。N1-04l local read freshness 解决旧 Host **本地缓存**，不能对另一个 Host / SQL 的 lease 产生强制原子撤权。**现有技术不能消除此矛盾，必须签收 N1-05a/b 真正权威事务**。
6. **持久锁 vs 分布式锁**：N1-04k 同目录协作锁会遗留 crash-orphan，避免自动破锁；不证明共享 NFS、同用户恶意 writer、目录被换或多部署 Host 对不同本地文件拥有全局互斥。N1-04l 读前后检查同样不是所有时刻线性化的全局 Provider。
7. **动作回执 vs 真正授权**：C3-01 资源+receipt PG 原子提交并不等于生命周期与 AuthorizationProvider 的授权变更同事务；签名 receipt 不自动认证资源读或撤权。N1-04g 的 outbox-bound 模拟无法代替生产事件源。
8. **UI/AI 验收**：Human UI CI 通过仅代表规范门禁，不代表桌面/390px 登录后视觉、焦点/键盘或真实外部模型 WRITE；旧窗口/静态 Eidos DOM 不能填充这些证据。
9. **原始资料缺失**：无法确认早期长聊天中未入库的每条临时 URL/截图；本索引不是旧聊天逐字存档。资料 URL 若未来失效，以本仓库历史短摘要为研究线索，不把它当厂商原文的完整法律/功能依据。

## 7. 下一轮值得补查的资料与理由（按风险和可执行性）

| 优先 | 应查对象/原始网址或项目证据 | 目标与所需可验证产物 |
| --- | --- | --- |
| **P0** | **真实 PA05 LifecycleStore / AuthorizationProvider / SQL Owner**：[`manager/service.ts`](../../../manager/service.ts) 的 `disable`；[`manager/server.ts`](../../../manager/server.ts) 的 `pluginEvents.publish`、动态 AuthorizationProvider；[`tools/cv03-n1-postgres-role-audit.mjs`](../../../tools/cv03-n1-postgres-role-audit.mjs) | N1-05a 三方 Owner 共同签收“正式持久授权源、原子事务边界、生产 DB schema/role/KMS、迁移/回滚、可信快照/撤权传播”；**这是当前最值得查的内容**，先于继续竞品调查 |
| **P0** | 正式 PG Primary/SQL GRANT/实际 Host identity/Pool：当前没有可分享的生产资源 locator | Owner 可脱敏提供实际角色权限审计、测试 producer signer key custody/轮换设计和 2 真 Host 失败注入；缺则保持 SAVE OFF |
| **P1** | EX03 [Odoo 19 View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | 重新取得 List/Search/Kanban/Graph/Pivot 的 19.0 章节、版本、维度聚合约束；保留可读网页定位、日期。此前 11-10 U 超时 |
| **P1** | EX04 [Power Apps Grid](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) + S02 10-12 [en-us 版](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 核对可访问版本、Reflow、分组/分页/可编辑权限、哪些是 Power Apps 配置，不误抄进 Eidos 首期 |
| **P1** | EX05 [SAP List Report / Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html)；S01 同页搜索摘要 | 查可读官方版本及 List→Object Page 返回状态/导航；在仅 HTML 壳时继续 U，不从旧搜索摘要编造焦点/按钮行为 |
| **P2** | EX01 SharePoint 2019 vs Online 范围；EX08 W3C APG Grid；S05 AG Grid Enterprise | CV-04/05 图表、真实键盘/390px、Grid 选型/许可阶段再定向阅读，记录新版变更，不重复既有设计推论 |

## 8. 易变/难重新访问资料的保留位置与缺失附件

| 资料 | 已保存的可复原摘要/章节位置 | 附件/截图状态 |
| --- | --- | --- |
| 11-06 厂商 EX01–EX08 历史原文阅读范围 | [原索引 §1](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 和本文件 §1；EX06「10 种视图样式」/EX08「Keyboard Interaction」等章节名 | **本次无网页截图、HTML/PDF 副本；不能编造路径** |
| 11-10 较早重新阅读后的可读/失败差异 | [N1-04d 详细索引 §0–§1](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md) | EX03/04/05 未恢复可读原文；无合法截图 |
| 10-12 S01–S08 的来源和阅读级别 | [REFERENCES.md §2 第 26–93 行](REFERENCES.md)；本文件 §2 列出完整原始 URL/原章节 | S01/S08 只摘要，非全文；无保存 PDF |
| 11-06 历史内部 H01–H10 | [11-06 内部章节索引 §2](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 与本文件 §3，可用相对路径按版本重取 | GitHub Markdown 原文可恢复；未为本次额外复制历史附件 |
| N1-04e～l 工程结果 | 本文件 §4 按 PR/merge SHA/PG18 run ID；各专项 `CV03-N104*-...-20261110.md` 与实际测试代码 | GitHub Actions 在线日志依平台保留期可失效；**无本次不可变离线日志 zip 或截图** |
| 真实生产 SQL / Owner/KMS / Human / LLM | 只列[正式生产决策/验收合同](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)中待验证项 | **无生产授权密钥/DB 凭证附件；无桌面/390px Human 验收截图或外部 LLM 运行录屏** |
| 完整旧长聊天逐字导出、聊天中未归档的临时搜索片段 | [11-10 长聊天恢复审计](CV03-C302-LONGCHAT-RECOVERY-AUDIT-20261110.md)已有明确缺失说明，本交接不冒充恢复完成 | **尚未提供/入库；本次没有取得这些原始文件** |

**安全注意**：不应把真实生产 secret、token、KMS key 私钥或客户资料写入这些 Markdown；未来仅存脱敏 role/审计摘要，凭证留正式密钥系统。任何未来网页/PDF 截图需用确定路径、对应采集时间和访问授权保存，本次不存在则保持“未保存”。

## 9. 映射到现行项目与新窗口工作路线

- **严格按现有 Owner 层落地**：`contracts/foundation-object/schema.ts` 和 `apps/counterparty/projection-query.ts` 做字段与真实集合读；`providers/enterprise-context/personal-saved-views.ts` 管个体 Saved View 命名空间；`manager/service.ts`、`manager/store.ts` 管 PA05 生命周期；`manager/cv03-personal-saved-view-host-issuer.ts`、`manager/capability-operation-access.ts` 管 Host 授权/回执；`providers/enterprise-context/resources-postgres.ts` 管受控资源；`manager/server.ts` 管正式 fail-closed 启动和 Action Router。
- **代码与隔离 proof 不混淆**：`tools/cv03-n104f-isolated-authority-tx-outbox.mjs`、`tools/cv03-n104h-isolated-producer-fence.mjs`、`tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs` 是 PG18 隔离权威试验；`tests/agent-line/cv03-n104l-pa05-authority-read-freshness.test.mjs` 是真实文件/Manager 的本地读新鲜度回归。真实 `manager/server.ts` 不能直接启用隔离表。
- **推荐下一工作线**：[N1-05a～f 生产授权集成决策与验收](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)：先授权事实源/负责人签收 → 真正 T0 + immutable outbox → 受限 SQL workload identity → startup fencing 和 full snapshot → Human/AI 真实端到端 → 可回滚发布。**没有 N1-05a Owner 决议就不动正式 WRITE**。
- **保留历史，避免覆盖**：[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的三份文件：`COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`、`CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`、`CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md` 继续归并行 Owner；本窗口两份新文档单独新增、无覆盖。#1161 等其他历史 Draft 也不接管。
- **分支治理**：本研究档案从 `main@560af7b5227194fb384d02de8fcd8396178a11b3` 建 `docs/cv03-n104l-window07-research-handoff-20261111`；只提交本[简短入口](CV03-N104L-WINDOW07-RESEARCH-HANDOFF-ENTRY-20261111.md)和详细索引。只有独立 docs PR 的 exact HEAD CI 成功、合入 main、Branch Hygiene 确认安全删分支后，才能宣称**本次研究交接文件已在 main 保存**。新窗口应从当时最新 `main` 分新分支，绝不能继续已删除的过程分支。

**本次编制中没有新增外部官网打开记录，没有新网页截图、离线附件或已批准的生产集成方案。** 这些“未保存/未签收”状态应连同工程成果被完整继承。
