# EVO 项目组合里程碑与架构决策背景（2026-11-06）

> **Document class:** HISTORICAL_SNAPSHOT / architecture decision briefing  
> **Scope:** EVO-App-Platform 仓库可查的项目组合、架构边界、里程碑证据与未决事项；非逐模块代码审查。  
> **Repository baseline:** \`main@58c49dadda57e7f260c9cc7ebad8bf9a4c0e0e1e\`（2026-11-04）。核查日：2026-11-06。  
> **权威限制：** 本文是**有日期的跨工作线导航和证据摘要**，不取代 \`project.status.json\`、各 owner 专项里程碑、当前有效架构宪法或线上实时查询；不将旧证据自动外推为今天的部署或 Human 签收。不修改任何现行里程碑的既定范围。

## 1. 项目是什么，以及未来架构讨论的固定起点

EVO 不是单一 ERP 前端，也不是把 LLM 作为业务事实权威的聊天产品。四个 owner 项目的职责以 [生态项目边界](../architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md) 和 [扩展边界宪法](../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) 为准：

| Owner | 长期职责 | 禁止误归属 |
| --- | --- | --- |
| EVO-App-Platform | Package/Feature 生命周期、能力/Provider 解析、Host 治理、身份/授权编排与外部 Agent 入口 | 不吸收 EVO Core / Eidos Core 或具体行业事实 |
| EVO | 确定性业务运行事实、Posting/Ledger/Balance、重放与核算 | 不把上层业务应用生命周期重新塞入底层引擎 |
| Eidos | 可复用 Human Experience、UIDL、App Host/Workbench、2D/3D 交互与设计语言 | 不掌握企业业务定义和权威数据 |
| Experience-Compiler | 企业/行业知识、研究、学习、经验与受治理建议 | 不替代企业正式定义、运行事实或授权 |

其他不可变的架构思路：**Package → Feature → Contribution**；安装不等于激活；平台是 control plane，普通组件数据流经稳定公开接口；企业 Business Definitions 由 Enterprise Context 治理；EOG 是投影/导航/聚合，不是企业本体的唯一设计器；Personal Agent 模型可替换，确定性系统负责权限和写入。详见 [项目哲学](../../PHILOSOPHY.md)、[Package 模型](../architecture/PACKAGE-FEATURE-CONTRIBUTION-MODEL-v0.1.md)、[Agent 状态宪法](../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) 和 [EOG/知识边界](../architecture/ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md)。

## 2. 各工作线里程碑：区分代码、合并、部署与 Human

| 工作线 | 截至本次核查可确认的阶段事实 | 不可冒称已关闭的边界 | 首选证据入口 |
| --- | --- | --- | --- |
| 插件平台 / GOV | 核心安装、激活、能力解析和治理模型已形成；2026-10-22 新插件架构准入阶段按 **DEV_COMPLETE** 收口；原 7 项存量治理 **4 闭环、3 部分完成** | 阶段收口 ≠ 7/7 存量技术债消失；并非所有 Provider/插件资源均已独立完成按需运行认证 | [治理固定状态表](../plans/platform-governance/CLOSEOUT-COUNTDOWN.md)、[架构准入规范](../architecture/PLUGIN-LAZY-RESOURCE-LOADING-v0.1.md) |
| Personal Agent / PA | P1.4X、P1.5–P1.8 有阶段性产品/CI/运行证据；PA05 Host+PROCESS K0 工程 PR [#1104](https://github.com/jiangxng/EVO-App-Platform/pull/1104) 于 2026-10-22 **merged** | K0 生产安全认证 **NOT_SIGNED**，material WRITE 不因工程合并解锁；[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 截至核查仍 OPEN | [PA05 工程阶段收口](../agent-line/PA05-PHASED-ENGINEERING-CLOSEOUT-20261022.md)、[专项入口](../agent-line/PA05-K0-WINDOW-20261022-POSTMERGE-HANDOFF-ENTRY.md)、[P1.8](P1.8-CONVERSATION-LIFECYCLE-RETENTION.md) |
| External Agent | 官方路线图 2026-10-02 的 **READ/PLAN 基础 VERIFIED_PRODUCTION_PASS**，含 OAuth/MCP、外部客户端调用和 Grant 撤销等范围受限验收 | External Agent 治理 WRITE、更多非 Ledger 插件、各厂商独有体验不因此签收 | [External-Agent-First §17](EXTERNAL-AGENT-FIRST-PLATFORM-VALIDATION.md#17-validation-closure--2026-10-02) |
| Enterprise Context / EOG / 2D | 企业定义权威分离与 EOG 插件职责已定；2D Designer v1.0 2026-10-12 **开发阶段 Human 39/39 通过** | 39/39 不是所有设备/生产环境认证；SOP Designer 独立产品开发仍 **DEFERRED**，不能把已存在的 package identity 当成产品可用 | [2D 验收结论](../architecture/DIAGRAM-V1-FORMAL-ACCEPTANCE-RUN-20261012.md)、[EOG 需求待决](EOG-待明确需求清单-v0.1.md)、[SOP 分离](../architecture/EOG-PEER-PLUGIN-EXTRACTION-BASELINE-v0.1.md) |
| Foundation Objects / TR-01 | CP/IT/WH 对象验证已有历史闭环，交易组合工作线进入 TR-01；全局结构化状态仍以 TR-01 为当前里程碑 | 财务/跨运行时受治理写入不能由 2026-10-10 的 read-only/CI 记录推定完成；需专项 owner 对账较晚 B2D3 文档和真实环境 | [Foundation Object Program](FOUNDATION-OBJECT-PROGRAM-v0.1.md)、[TR-01 证据](TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md)、[项目状态](../../project.status.json) |
| BEX-01 V3 / 通用业务体验 | 2026-10-22 交接把 M01–M03 记为工程完成；[#1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086) 已 merged，部分后续设计改动也进入 main | M04 客户真实源、M05 授权实际提交、M06 功能/布局/颜色三维终验仍 OPEN；[#1070](https://github.com/jiangxng/EVO-App-Platform/pull/1070) 等历史 Draft 尚不能视为已验收 | [V3/M06 交接](../plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-14-RAILWAY-DELIVERY-HANDOFF-ENTRY-20261022.md)、[业务体验框架](../plans/foundation-list-experience/BUSINESS-EXPERIENCE-FRAMEWORK.md) |
| IAM 平台权限 0→1 | 专项 M0 的服务端/主线/东京发布证据已由 [#1137](https://github.com/jiangxng/EVO-App-Platform/pull/1137)、[#1138](https://github.com/jiangxng/EVO-App-Platform/pull/1138) 留存 | M0 真实 Human 未签；M1 可信平台 Owner、M2 管理页授予/撤销、M3 创建企业完整端到端，专项记录均为未开始。**完整四阶段状态表目前只在仍开放的 [Draft #1129](https://github.com/jiangxng/EVO-App-Platform/pull/1129) 分支，不能误称已合入 main** | [Draft #1129](https://github.com/jiangxng/EVO-App-Platform/pull/1129)、[M0 发布记录](../operations/EVO-TOKYO-CI-GATED-PREVIEW-RELEASE-20261028.md) |
| 基础字典、组织人员、模型、导入 | 固定 #01–#05/06 有 **DEV_COMPLETE** 记录；第 #06 的 IM-01 [#1155](https://github.com/jiangxng/EVO-App-Platform/pull/1155) 和 HX 局部 [#1156](https://github.com/jiangxng/EVO-App-Platform/pull/1156) 均于 2026-11-02 merged；字典管理 UI [#1157](https://github.com/jiangxng/EVO-App-Platform/pull/1157) 于 11-04 merged | #06 的 HX-01/EV-01 真实 Host 中文桌面、窄屏、完整导入旅程和 Human 未签；主线六步状态表仍将 IM-01 写作 **IN_REVIEW**，与 PR 实况存在时间差，须由 owner 对账后再改原状态表 | [六步状态表](../plans/foundation-list-experience/FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md)、[#1155](https://github.com/jiangxng/EVO-App-Platform/pull/1155)、[#1156](https://github.com/jiangxng/EVO-App-Platform/pull/1156)、[#1157](https://github.com/jiangxng/EVO-App-Platform/pull/1157) |

**验收措辞：** Architecture accepted / code implemented / exact-head CI / merged main / deployed specific revision / Human PASS / production security signed 分别记录，不得互相替代。旧计划、旧 PR 描述、合成测试与正常健康响应不自动升级为最新完成结论。

## 3. 工程与部署的跨线现实

- 本仓库 \`main\` 精确 HEAD 为 \`58c49dadda57e7f260c9cc7ebad8bf9a4c0e0e1e\`，对应 [PR #1160](https://github.com/jiangxng/EVO-App-Platform/pull/1160) 的追踪 sidecar 工作流更新；不是所有工作线同日发布版本。
- 东京开发预览现有 [CI-gated 自动发布机制](../operations/EVO-TOKYO-CI-GATED-PREVIEW-RELEASE-20261028.md)。[run #41761112690](https://github.com/jiangxng/EVO-App-Platform/actions/runs/41761112690) 的 deploy job SUCCESS；而较新的 [run #41768336702](https://github.com/jiangxng/EVO-App-Platform/actions/runs/41768336702) 尽管工作流 conclusion SUCCESS，**deploy job 是 SKIPPED**。因此不能拿后一个绿色状态宣称最新 main 已在东京完成部署，也不能据此断言当前在线的实际 SHA。
- 项目技术主线遵守 [开发交付工作流](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)：短闭环独立 PR、复用已有能力、定向反馈、完整必要门禁、先合并再清理过程分支，禁止将历史快照当当前 owner PR。
- 2026-11-04/05 定时 Ecosystem Certification 的全量 suite 存在未通过测试；这是跨仓库质量/回归线索，**不属于本架构基线对某业务功能的最终诊断**。正式设计若涉及共享协议，需另核对应目标场景与最新 CI。

## 4. 项目状态连续性中最需要治理的缺口

[项目连续性协议](../architecture/PROJECT-CONTINUITY-PROTOCOL-v0.1.md) 将 \`project.status.json\` 与生成的 \`docs/roadmap/HANDOFF-LATEST.md\` 作为全局入口。但是截至本次核查，\`projectContinuity.snapshotAt\` 仍是 **2026-10-10**，\`currentMilestone\` 仍为 TR-01，而 README 的「Current continuation point」仍以 P1.4X 为中心。它们不一定对应同一个层级，却尚未为多个并行工作线提供可靠统一视图。

[project-continuity.mjs](../../tools/project-continuity.mjs) 核验的是状态 JSON、引用与生成文件的**内部一致性**，不能证明状态及时吸收了新合并和实际部署。整改应由各 owner 先核准自己的真实阶段，再设计组合级状态汇聚：同一工作线各自有里程碑、合并证据、部署和 Human gate；全局概览只索引、不自行修改业务签收。

本文件**不直接更新** \`project.status.json\` 或各 owner 里程碑，避免在缺乏实时生产/Human 证据时破坏权威账本。

## 5. 后续架构决策前需优先回答的问题

1. **先分 owner 再选方案：** 是 Platform Core、Provider、Application、Integration Adapter、Eidos Experience、EVO Runtime，还是 Experience Compiler 的权威责任？先复用现有能力，避免另造一套。
2. **一条正式语义如何跨入口复用：** Human、Personal Agent、External Agent、导入/编辑/图形入口是否都使用可版本化的同一业务契约、同一授权和确定性结果？
3. **平台控制面如何保持轻量：** 新能力是否按 Package/Feature 的实际有效资格装载，资源停止/恢复、依赖拒绝及占用预算能否证实，不因单个业务需求扩张 Host 核心？
4. **正式企业定义、企业知识和实时事实如何协同：** Enterprise Context、EC、EOG 和 EVO 的信息引用、时效、审计、授权、发布/回滚界面如何划清？
5. **产品可交付性的统一门槛是什么：** 设计交互和功能验收必须与构建、PR、部署、生产权限认证分别留证；不能用一次机器测试/原型替代真实业务闭环。
6. **如何让多 Agent/多窗口持续协作：** 项目层保留唯一可发现的架构权威，工作线保留各自可续接的唯一当前记录，历史研究按需加载，不继续堆叠互相矛盾的“最新交接”。

另需专项对账的**文档表述冲突**：[AGENT-PACKAGE-MODEL-v0.1](../architecture/AGENT-PACKAGE-MODEL-v0.1.md) 的早期 EC→Enterprise Agent 历史措辞与较新 [四项目边界](../architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md) 不一致。以四项目当前职责为设计讨论依据；后续若改动现行宪法，必须通过规范的版本化决策，而非在本快照里改写历史。

## 6. 如何使用本快照

- **架构讨论**：先读 §1、§5，再读具体涉及的现行宪法；本快照帮助确定现有资产与可复用边界。
- **问项目进度**：先读 §2，再回到该工作线真正最新的 owner 记录、PR 和部署/Human 证据；不可把本快照当实时状态。
- **准备修改项目状态**：先让各 owner 对账并确认主线/部署/验收，最后才更新结构化状态和生成交接，严禁从旧聊天、合并标题或绿灯推断生产 PASS。
- **保存历史**：依据 [文档生命周期规则](../architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md)，本文属于有日期的事实整合；将来新快照应引用/替代它，而非把它无限扩写为新的竞争性状态权威。

**变更范围声明：** 文档盘点与架构导航，无运行代码、用户权限、真实数据、部署、数据库或既有专项里程碑状态变更。
