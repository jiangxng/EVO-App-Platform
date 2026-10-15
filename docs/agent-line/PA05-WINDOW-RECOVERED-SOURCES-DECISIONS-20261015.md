# PA-05 旧窗口恢复：来源、链接、决策与证据等级（2026-10-15）

**Document class:** SESSION_RESEARCH_SOURCE_LEDGER / HISTORICAL_SNAPSHOT；恢复基线 `main@ad0b4172eb1cf0086d4836b57203a62107ee1323`。  
**短入口：** [PA05-WINDOW-RECOVERY-HANDOFF-20261015.md](PA05-WINDOW-RECOVERY-HANDOFF-20261015.md)。  
**当前在库事实：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md)；阻断 [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913)，费用 [#879](https://github.com/jiangxng/EVO-App-Platform/issues/879)。**检索/复核日期：2026-10-15**。

## 0. 恢复原则和真实阅读层级

- **USER**＝用户本次提交及可复原的上一窗口明确要求；不是代码。**G-FULL**＝本次读取相应 GitHub 文档的完整关键段；**G-PART**＝只取得部分源码/章节；**G-META**＝本次直接查询 PR/Issue/HEAD/运行元数据；**G-LOG**＝本次读取 workflow Job 原始日志并核对 marker；**G-HIST**＝先前已经留存于 GitHub 的专项报告，旧窗口曾读过但这次没有独立重跑。
- **H-UNREAD**＝恢复的外站 URL 仅在原仓库研究索引出现，本次未读原网页，不可写成官方最新事实。**J**＝本项目的工程采纳/排除理由，非外部作者建议。**UNKNOWN**＝没有可追溯原文/证据。
- 完整旧聊天原始附件/导出转录未在当前可读文件搜索中发现；有限跨窗摘要只能辅助定位。GitHub 固定提交、PR 和 CI 优先于摘要。原 [PA04 来源索引](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) 已有 25 类 GitHub 资料和 14 个外链；[PA02 2026-10-15 索引](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) 另保留曾直接读过的 Provider 文档。**不重新制造另一版“资料已读”表**。

## 1. 本次真正重新读取／核对的仓库原始资料

| ID | 标题／直接 URL | 本轮核对等级、具体位置 | 支持的事实／使用边界 |
| --- | --- | --- | --- |
| G01 | [AI-BOOTSTRAP](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/AI-BOOTSTRAP.md) | G-FULL，2026-10-15 | project.status 与生成 handoff 全局优先；不凭聊天改主线；按项目隔离交付 |
| G02 | [project.status.json](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/project.status.json) → [HANDOFF-LATEST](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/roadmap/HANDOFF-LATEST.md) | G-PART；`projectContinuity` / 生成首页 | 当前**全局**项目主线仍记录 TR-01 快照；不可假称它是新的 PA05 全局 RELEASE 状态。PA 专项见 G04 |
| G03 | [LLM.md](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/LLM.md)、[foundation map](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/llm.foundation-map.json)、[开发交付规范](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | G-PART／规范 G-FULL | 原合同优先；同一闭环一条短 PR；真实安全权限与生产批准独立 |
| G04 | [PA05-CERTIFICATION-BASELINE](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md) | G-PART；§1–§21 选择与安全段 | PA05-01～04D8 的问题、取舍、作用域；尤其 §19–21 PG Worker SQL 完整性；旧的“candidate”句要由实际 PR/CI 更新，不直接当 PASS |
| G05 | [PA04 交接入口](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/agent-line/PA04-WINDOW-HANDOFF-ENTRY-20261015.md) 与 [研究/来源索引](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/agent-line/PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) | G-FULL/G-PART；用户先后顺序、网址等级、未决 | PA04 工程验收与真正 Human/Provider 签收分离；旧公网链接 H-UNREAD |
| G06 | [Blueprint §21.1–21.3](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) | G-PART；插件包、生命周期与认证、§22 | 新业务插件完整契约、直接与 Agent 同结果、Owner/权限/receipt/恢复、人体验收三层，不因展示成功即认证 |
| G07 | [Issue #913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 及其逐轮评论、[Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879) | G-FULL/G-META；2026-10-15 | #913 要求同时冻结入口与 UNKNOWN drain；#879 仍真实货币费用授权阻断；两者 OPEN |
| G08 | [PA05-04D4 PR #923](https://github.com/jiangxng/EVO-App-Platform/pull/923) / [HEAD](https://github.com/jiangxng/EVO-App-Platform/commit/9b1ce6aee56c43670fd16660e83ceec10880f68c) | G-META；merged `28912c50...`，改动 7 文件 | 同库多 Schema，中央 Owner 行锁和受信 Schema inventory；不是跨独立 DB |
| G09 | [#923 isolated PG18 workflow](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704115047)，Job `116319146352` | **G-LOG**；直接读 Job 日志中 `PA05_SHARED_SCHEMA_OWNER_PG`、workflow 成功 | 包含 `separateBusinessWorkerSchemas:2`、`unknownFromOtherSchemaBlocksDisable:true`；36/36 与 0 skip 的汇总还记录在 #913 评论 |
| G10 | [PA05-04D8 PR #930](https://github.com/jiangxng/EVO-App-Platform/pull/930) / [HEAD](https://github.com/jiangxng/EVO-App-Platform/commit/954394f2f98135f1a01d499aea11357cce5e2066) | G-META；merged commit `ad0b4172eb1cf0086d4836b57203a62107ee1323`、4 changed files | 全更新 trigger、不可变 provenance 和终态 Owner 核验；默认 opt-in |
| G11 | [#930 PG18 workflow](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38709029820)／Job `116335521897`；[HEAD CI](https://github.com/jiangxng/EVO-App-Platform/commit/954394f2f98135f1a01d499aea11357cce5e2066/checks) | **G-LOG/G-META**；实际读 `PA05_PG_WRITE_STATE_INTEGRITY`，7 个 HEAD workflow 全 success | marker 明确 6 项防伪标志、`productionWriteEnabled:false`；40/40 0 skip 见 #913 comment |
| G12 | [Agent 专项分支治理](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/agent-line/AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md) 及 [文档生命周期](https://github.com/jiangxng/EVO-App-Platform/blob/ad0b4172eb1cf0086d4836b57203a62107ee1323/docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md) | G-FULL；操作边界和文档分类 | 仅更新 Agent 范围；历史快照冻结；`HANDOFF-LATEST` 不可手改 |

**一手访问边界：** 除上述有标记的范围，并未对每个 PA05 PR 的每一行源码、每次 PG18 的完整日志逐项复核，也未登陆生产真实数据库。G-META 与 G-LOG 不能互换。

## 2. 已有版本化 PR / 测试证据链（从旧窗口修复而非重复实施）

| 阶段 | 原始 PR URL | 已证事实与未证条件 |
| --- | --- | --- |
| 初始多业务 READ | [#903](https://github.com/jiangxng/EVO-App-Platform/pull/903)、[#907](https://github.com/jiangxng/EVO-App-Platform/pull/907) | 复用真实 Owner，正向 Manifest 修复，隔离 Human/Agent READ parity；外部真实身份未签 |
| Schema 工具 / READ 时间门禁 | [#908](https://github.com/jiangxng/EVO-App-Platform/pull/908)、[#910](https://github.com/jiangxng/EVO-App-Platform/pull/910) | 认证子集、运行后重授权；不等于完整 Schema 标准或默认 Host 强制接线 |
| 独立业务插件 | [#911](https://github.com/jiangxng/EVO-App-Platform/pull/911) | opt-in Purchase Attention 第三业务 owner；未默认注册或生产 Human |
| 初始 WRITE / 竞态 | [#912](https://github.com/jiangxng/EVO-App-Platform/pull/912)、[#915](https://github.com/jiangxng/EVO-App-Platform/pull/915)、[#917](https://github.com/jiangxng/EVO-App-Platform/pull/917) | 既有 PA-02 协调器 + 真 PG18，丢失 ACK/UNKNOWN、Host 生命周期原子 gate；非全球分布式 |
| Owner 全量覆盖与启动 | [#918](https://github.com/jiangxng/EVO-App-Platform/pull/918)、[#919](https://github.com/jiangxng/EVO-App-Platform/pull/919)、[#920](https://github.com/jiangxng/EVO-App-Platform/pull/920) | 不完全 inventory fail-closed；启用/安装与 prelisten；隔离 PG18 20/20、26/26、32/32 见 #913 |
| 同库 Schema 中央化 | [#923](https://github.com/jiangxng/EVO-App-Platform/pull/923) | 隔离 PG18 **36/36**，两个 Worker Schema 共 Owner 事务；不是分库 |
| SQL 强制、权限与身份 | [#924](https://github.com/jiangxng/EVO-App-Platform/pull/924)、[#926](https://github.com/jiangxng/EVO-App-Platform/pull/926)、[#928](https://github.com/jiangxng/EVO-App-Platform/pull/928) | 触发器、最小权限、真实 LOGIN/SESSION_USER；隔离 38/38、40/40、40/40；不是现场账户运维 |
| 完整性漏洞收口 | [#930](https://github.com/jiangxng/EVO-App-Platform/pull/930) | 隔离 PG18 **40/40**；伪造终态、不可变键、错误登录/DELETE privilege 被拒，准确 HEAD 7/7；生产 WRITE 未开 |

## 3. 方案取舍（明确区分证据事实与工程判断）

| 议题 | 来源事实 G | J 采纳方案与理由 | J 排除或待定方案与限制 |
| --- | --- | --- | --- |
| 多业务插件接入 | 现有 Manifest / Capability Fabric / Action Host / Owner 可组合，#903/#907/#911 | **复用现有协议和动态权限**，第三插件是独立业务 owner，避免 Agent 核心按业务编码 | 排除复制 Agent 工具注册/另造 SDK，排除为认证修改 BEX/2D |
| Schema 认证 | JSON Schema fixture 不支持全部关键字，READ runtime 没全覆盖，#908/#910 | 采用明确子集 + unknown→非 PASS + opt-in 运行校验 | 排除谎称完整 Draft 2020-12 或把证书等同全 Host 生产接线 |
| 不确定的业务 WRITE | PA-02 PostgreSQL Owner 回执、Run fencing 已存在，#912 | 复用真实 Owner/receipt，lost response 不自动重执行、终态要独立验证 | 排除模型声称 SUCCEEDED、仅 HTTP 成功就删除未决 Effect |
| 插件停用与在途 WRITE | #913 起初 `planDisable` 与新调用有竞争条件，#915/#917 | Host 冻结与 Worker INVOKING 共 SQL 锁，冻结后检查未决并拒停用 | 排除 `listPending` 单次预查、内存进程锁、改变版本后未经认证重新开放 |
| 另一 Schema 的 UNKNOWN | #923 同库有中央 inventory 与 Owner 锁 | 采用完整受信 inventory + 单中央 Owner 行锁，避免每 Schema 各自看不见另一方 | **排除**把 PG 同库事务推广为两个独立数据库的原子协议；跨库方案仍未决 |
| 未受控 Worker SQL | #924/#926/#928 暴露并修复绕过可能 | opt-in SQL trigger + 独立最小权限 LOGIN + `SESSION_USER` | 排除把只有 JS Worker 的守卫当普遍 DB 安全；超级用户/Host 攻陷仍属边界外 |
| Worker 伪终态和修改 ID | #930 扩展 `BEFORE UPDATE` 并新增负面测试 | 所有 UPDATE 验身份/关键键；终态 Host/Owner 核验；拒 INSERT/DELETE/TRUNCATE 权限漂移 | 排除只监视 `UPDATE OF state`、Worker 普通 UPDATE 能提交终态 |
| 部署和签收 | 所有 PA05 PR 均是 opt-in 工程隔离；#913 和 #879 open | 保持生产 WRITE OFF，按真实业务/Provider/Human/隔离安全三层证据签收 | 排除绿色 CI = production signed、单库 40/40 = 跨库分布式安全 |

## 4. 外部行业资料遗产（保持旧来源真实阅读等级）

以下都是仓库早期蓝图/PA-04 索引中保存的**旧官网 URL**，本次未重新打开，故 **H-UNREAD**；“主题”仅指项目先前借用的设计参考，不表示该官网目前仍为该内容/版本。全部原始 14 项与旧阅读等级见 [PA04 索引 §3](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md#3-原总纲列出的外部公开研究原网址完整保留全部仍待本窗口直接验证)。

| 旧编号 | 原始标题 / URL | 归档主题／实际用途（未经本轮原文验证） |
| --- | --- | --- |
| S01 | [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 组合式 Agent 与 workflow；避免不必要多 Agent 架构 |
| S02 | [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 上下文选择与工作状态；PA04 |
| S03 | [Anthropic: Managed agents](https://www.anthropic.com/engineering/managed-agents) | 持久执行与生命周期，未来 PA06 |
| S04 | [Microsoft: Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | 工具/知识语义元数据；PA05 语义合同需要时定向复核 |
| S05 | [AG-UI: Events](https://docs.ag-ui.com/concepts/events) | 事件互操作；Eidos 仍为 Human 权威 |
| S06 | [A2UI: Catalogs](https://a2ui.org/concepts/catalogs/) | 安全注册组件目录；不能取代 Eidos |
| S07 | [A2A: Specification](https://a2a-protocol.org/latest/specification/) | 未来跨 Agent 互操作；动态 latest 必须锁版本 |
| S08 | [MCP: Security best practices (2025-11-25)](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | 外部授权/Token/隔离的历史参考；并非本次同库 SQL 安全证明 |
| S09 | [Microsoft HAX: Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | PA05-05 Human 体验原则 |
| S10 | [Temporal: Workflow execution](https://docs.temporal.io/workflow-execution) | 持久工作流参考；**未决定引入 Temporal** |
| S11 | [W3C: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Eidos 可访问性 |
| S12 | [W3C: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 错误/阻断反馈与辅助技术 |
| S13 | [OpenTelemetry: GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | PA06 观测，需锁定版本/隐私 |
| S14 | [OWASP: LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | C05 与插件调用安全，仅历史转述 |

**另一份历史的实际外网访问等级**不是 H-UNREAD：PA02 索引的 [Responses Input Tokens](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens) 记录旧窗口 **W-FULL**、[DeepSeek Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion/) **W-PART**；[Responses Create](https://platform.openai.com/docs/api-reference/responses/create) **W-ATTEMPTED-NOT_READ**、[OpenAI Pricing](https://platform.openai.com/pricing) **W-SEARCH-SNIPPET**。本次**没有重访**、没使用任何旧价格数字；实际费用签收由 #879 约束。

## 5. 未解决的冲突、可变资料与最值得继续查阅的位置

1. **同一数据库 vs 多独立数据库：** #923/#930 证明 SQL 事务+ACL 的局部闭环；Issue #913 仍要求多 Host/跨数据库防竞态。源事实和“可能用中央协调服务”的工程备选不是同一种已实现结论。下一次必须定向核查跨库部署拓扑、可信成员注册、分区恢复与撤销安全模式，勿自动选择方案。
2. **SQL Worker 角色静态核验 vs 凭证漂移：** #926–#930 有 isolated LOGIN/ACL 实证，缺生产 role provisioning、rotation、re-attestation 与 superuser/Owner threat model。先设计可审核的权限控制与 runbook，再审可否实际演练。
3. **工程 opt-in vs 真实 Host/Provider/Human：** `PA05_SHARED_SCHEMA_AUTHORITY_ENABLED`、`enforceSqlOwnerAdmission` 的隔离启用不能表示 Railway 已开启；真实业务 WRITE、Credentialed Human/Agent、业务插件 Owner 仍无现场签收。
4. **规范历史 vs 现时官方文档：** 若跨 Host 采用特定协议/产品，才定向复核 S04/S07/S08 或实际 DB 协调规范；本轮没有外部新文献依据，不宜先展开 14 条网页重搜。
5. **容易失效的证据**：GitHub Actions artifact 有保留期；可靠锚点是上表固定 SHA 的源码/测试、#913 评论及 CI Job marker。未保存原聊天全文、浏览器截图、密钥、真实运营日志或生产数据库 dump。**不补写截图位置**。
6. **范围分工**：Agent 接续只维护 `docs/agent-line` 和必要时受审的 Agent/Host 安全代码；BEX #929/#909/#878/#860/#846，Eidos、2D 与全局 handoff 由相应 owner 维护。

**下一任务绑定：** 新窗口读 `AI-BOOTSTRAP.md` / 当前 main → 此索引与 [交接入口](PA05-WINDOW-RECOVERY-HANDOFF-20261015.md) → [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) → 当前 `manager/agent-plugin-write-lifecycle-gate.ts`、`agents/enterprise-agent/pa02b-postgres-coordination.ts`、`tests/agent-line/pa05-plugin-write-lifecycle-fence-pg.test.mjs` → 在独立短 PR 闭合下一项分布式安全门禁。PA05-05 另获真实使用证据后才能讨论签收。
