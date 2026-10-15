# PA-02 本窗口研究、来源与证据详细索引（2026-10-15）

**Document class:** SESSION_RESEARCH_SOURCE_LEDGER / HISTORICAL_SNAPSHOT  
**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**编制时主线：** `main@991ac3e030884b69586b3c1732db9953dc17ef91`，#880 合并后。**这不是资料包 PR 合并后的或将来永久最新 HEAD。**  
**简短交接入口：** [PA02-WINDOW-HANDOFF-ENTRY-20261015.md](PA02-WINDOW-HANDOFF-ENTRY-20261015.md)  
**上轮历史索引：** [2026-10-14 detailed source ledger](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md)；[原 PA-02 总纲 `25 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)；[项目交付规范](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。

## 0. 阅读/访问等级和来源真实性

- **G-FULL/G-PART**：GitHub 源文件/契约取得内容并阅读全部或相关节；**G-LOG**：GitHub CI Job 原始日志或输出已核对断言/结果；**M**：GitHub PR、SHA、Actions、branch、Issue 元数据。已看到来源不等于生产验收或下载永久附件。
- **W-FULL/W-PART**：本窗口较早阶段确曾读过公开官网有关原文或相关参数段，级别由当时已提交的项目专项记录复核；**此次交接没有重新打开公网文档**，不能因此假称复核了最新页面。
- **W-SEARCH-SNIPPET**：仅搜索摘要，直接访问未取得可用正文；**W-ATTEMPTED-NOT_READ**：尝试读取但无可用原文。
- **H**：前面聊天/旧 GitHub 索引留下的 14 条公网网址，**本窗口没有访问这些原文**；其“要点”只是历史转述，不作为来源事实。历史归档日 2026-10-10/11/13/14 **不是被证实的原文访问日期**。
- **R-META**：Railway 已连接服务/变量**名字**的只读观察，变量值遮蔽；无密钥和账单证明。
- **J**：本窗口的工程判断或用户确定方案，不可伪称 Anthropic/Microsoft/Temporal 等 **H** 网页的官方建议。

**日期：** 本窗口资料与 GitHub 交付集中于 2026-10-14～15；下表外网新增材料均记录为 2026-10-15。**未被实际阅读的内容保持待验证**。

## 1. 本窗口实际涉及的新增公开网页：逐条原网址、日期与真实深度

| 编号／原始网址／标题 | 日期、实读等级 | 可由原资料支持的要点 | 用于 EVO 的模块、适用条件与无法证明的事 |
| --- | --- | --- | --- |
| W01 [OpenAI API — Responses Input Tokens](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens) | **2026-10-15，W-FULL**：旧专项已记录读取有关的完整官方页面，此次编交接没有重访 | 官方显示 `POST /responses/input_tokens` 以及 `input_tokens` 统计响应。 | `agents/enterprise-agent/pa02-async-read-worker.ts`：计数必须针对包含 system/developer/user/history/tool schema/observations 的完整已组装请求。**计数接口本身不能保证最大计费金额、缓存写入、额外收费、异常重试或输出计费界限**；本窗口未真实请求该 API。 |
| W02 [DeepSeek API — Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion/) | **2026-10-15，W-PART**：只读了相关参数段 | Chat Completion 文档提到 `max_tokens` 输出上限以及上下文限制。 | `providers/deepseek/runtime.ts` 实际现行 adapter 的 Responses 端点/`max_output_tokens` 不应直接套用**另一端点**的参数与价格语义；对应供应商当前端点仍需精确查验。 |
| W03 [OpenAI — Responses Create](https://platform.openai.com/docs/api-reference/responses/create) | **2026-10-15，W-ATTEMPTED-NOT_READ** | 曾尝试读取但网页体积限制，**无可引用完整原文**。 | 本轮不能把其搜索信息当已读，模型上界／Response 调用实际计费规则继续待核。 |
| W04 [OpenAI — Pricing](https://platform.openai.com/pricing) | **2026-10-15，W-SEARCH-SNIPPET**：见到搜索摘要，直接网页没有可读正文 | 搜索结果出现 `Input`、`Cached input`、`Cache writes`、`Output` 等计费类别名称。 | R10 #874：当 `cacheWriteInputTokens>0` 且未获独立收费单价批准，金额账必须 `UNKNOWN`、原保留额不释放。**未核正式价格、币种、版本、地区、合同，也未采纳摘要中的任何金额**。 |

来源原有独立记录：[完整请求输入 Quote 专项](PA02-R10-ACTUAL-REQUEST-INPUT-QUOTE-20261015.md#新查阅外部官方文档与历史-14-条-h-来源分离) 和 [金额预留专项／cache write](PA02-R10-MONETARY-RESERVATION-PROOF-20261014.md#2026-10-15额外计费缓存写入用量不应静默结算ci-待证)。本轮最终研究没有新增未经核实的官方 Provider URL。

## 2. 前序 14 条外网参考：全量原始 URL，但**均是 H／原文未读**

这些链接来自 [10-14 历史索引 `3](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md#3-历史外部网页参考原始-url-完整保留但本窗口未访问外站)。**保留网址不是标记已读**。下列中间栏全部是先前交接的可能要点，未经本窗口核实。

| ID/标题与原始链接（全部 H） | 历史转述的主题（不是当前来源事实） | 对 EVO 的用途／重访优先级 |
| --- | --- | --- |
| H01 [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 有界 Workflow | 未来编排重评；现 PA-02 不重造 executor，低 |
| H02 [Anthropic — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 选择性上下文 | PA-04 的范围，当前低 |
| H03 [Anthropic — Managed agents](https://www.anthropic.com/engineering/managed-agents) | 长期 Run 状态 | 如真重审持久调度选型才读，中 |
| H04 [Microsoft — Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | 元数据驱动调用工具 | Capability Catalog 比较，低 |
| H05 [AG-UI — Events](https://docs.ag-ui.com/concepts/events) | 前端 Agent 事件协议 | Eidos 若更换事件标准才重读，低 |
| H06 [A2UI — Catalogs](https://a2ui.org/concepts/catalogs/) | 受约束 UI 组件 | Eidos 未来 generated UI 研究，低 |
| H07 [A2A — Specification](https://a2a-protocol.org/latest/specification/) | 任务委派/取消/artifact | PA-05；`latest` 版本易变，须锁具体版，低 |
| H08 [MCP — Security best practices（2025-11-25）](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | token audience、转发 token、SSRF | PA-05 OAuth/MCP，低 |
| H09 [Microsoft HAX — Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | 人类控制／可见状态 | 改 Eidos 体验时再读，低 |
| H10 [Temporal — Workflow execution](https://docs.temporal.io/workflow-execution) | 任务持久化与回放 | 比较新执行引擎时才真正查原文，中 |
| H11 [W3C — WCAG 2.2 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 触控尺寸 | Eidos 移动端，低 |
| H12 [W3C — WCAG 2.2 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 状态可感知 | 需要重做恢复 UX 时再读，中 |
| H13 [OpenTelemetry — GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | 模型可观测语义 | 未来费用日志规范，版本要锁定，中 |
| H14 [OWASP — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | 模型输出不可信 | 扩大工具攻击面再读；目前 Host 强权限依据项目源码，低 |

**新窗口如需进一步公共研究的真正高优先级：** **先有真实当前绑定 Provider/model/端点和经授权的企业合同信息**，再去查该具体版本供应商的 usage/计价/缓存与最高 billable 上界。H01–H14 并不自动成为当前 PA-02 实施依赖。


## 3. 本窗口实际读取的 GitHub 一手项目权威和 Railway 只读元数据

下列 GitHub URL 的**文件内容、PR 合并状态或部分 CI 原始日志**在本窗口实际通过连接器访问过；阅读日期为 **2026-10-14～15**。GitHub 可检索不是“生产验证”，旧文件开头的 `CI_PENDING` 也不是最新 PR 状态。

| 编号／原始链接／内容标题 | 阅读深度、直接发现 | 项目用途 |
| --- | --- | --- |
| G01 [AI-BOOTSTRAP.md](https://github.com/jiangxng/EVO-App-Platform/blob/main/AI-BOOTSTRAP.md) / [LLM.md](https://github.com/jiangxng/EVO-App-Platform/blob/main/LLM.md) | **G-PART 10-15**：启动需按 bootstrap、`project.status.json` 及其 handoff、LLM、foundation-map、任务权威；仓库高于聊天记忆。 | 新窗口先完成标准项目启动，不依赖本聊天截图或消息作为 authority。 |
| G02 [Development Delivery Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | **G-FULL 10-15**：一个真实闭环一短分支/PR、final HEAD CI→merge main→核分支退休，生产准入独立。 | 约束下个开发/资料 PR，防止二次重建。 |
| G03 [PA-00～PA-06 Construction Blueprint `25](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) | **G-PART 10-14**：R01–R10 原始测试；R10 包括步骤/时间/**费用**，PA-04 context token budgeting 不是费用硬预算。 | 防止人为缩窄原始完成定义或偷渡 PA-03～06。 |
| G04 [2026-10-14 旧交接入口](PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md) / [来源索引](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md) | **G-FULL 10-15**：七个旧合并 PR 的精确 SHAs 和所有 H01–H14 原 URL；其 `main@d8e25...` 和旧 OPEN 状态是**当时快照**。 | 参考遗产而非当前运行状态；新窗口不重做旧研究。 |
| G05 [PA02 Current Acceptance](PA02-CURRENT-ACCEPTANCE.md) / [R01–R10 Evidence Ledger](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md) / [Final Signoff Audit](PA02-FINAL-SIGNOFF-AUDIT-20261015.md) | **G-FULL/G-PART 10-15**：R01–R09 的隔离开发真实证据 PASS；R10 已有 24 slices/72h/usage & synthetic PG money gate，**真实供应商货币预算 NOT_SIGNED**。文档里历史 `CI_PENDING` 可能滞后。 | 阶段状态、PR/CI 补证总账和真正未决项的最优先阅读位置。 |
| G06 [LLM Contract](https://github.com/jiangxng/EVO-App-Platform/blob/main/contracts/llm.ts) / [OpenAI Provider Runtime](https://github.com/jiangxng/EVO-App-Platform/blob/main/providers/openai/runtime.ts) / [DeepSeek Provider Runtime](https://github.com/jiangxng/EVO-App-Platform/blob/main/providers/deepseek/runtime.ts) | **G-PART 10-14**：#857 已修正供应商未回 `body.usage` 却被伪造成 0 的行为；`UNAVAILABLE` 不应变 0 元。 | R10 真实 Provider ID、token 分类和账单凭据仍待供应商权威复核。 |
| G07 [Fenced Worker](https://github.com/jiangxng/EVO-App-Platform/blob/main/agents/enterprise-agent/pa02-async-read-worker.ts) / [Host Async Runtime](https://github.com/jiangxng/EVO-App-Platform/blob/main/manager/agent-async-read-worker-runtime.ts) | **G-PART 10-15**：现有 Host/Worker 模型调用前的金额预留接线目前是 `testOnlyCostPolicy`/`testOnlyBilledInputUpperBound`，普通生产路径并未加载真实价表。 | 不新建第二套执行器；有真实批准资料后才考虑启用，保持 fail-closed。 |
| G08 [PG Money Ledger](https://github.com/jiangxng/EVO-App-Platform/blob/main/agents/enterprise-agent/pa02-r10-postgres-cost-reservation.ts) / [Host Cost Test](https://github.com/jiangxng/EVO-App-Platform/blob/main/tests/agent-line/pa02-r10-host-cost-preflight.test.mjs) | **G-FULL/G-PART 10-15**：Run scope 下原子保留、UNKNOWN 保留不释放、重启后不二次推理、cache write 增费类别未批准则不结算。 | R10 安全技术底座已做；真实价格/全部费用类别仍缺批准。 |
| G09 [Owner Browser Test](https://github.com/jiangxng/EVO-App-Platform/blob/main/tests/agent-line/pa02_owner_http_chromium_recovery.py) / [Sandbox ACK Loss Fixture](https://github.com/jiangxng/EVO-App-Platform/blob/main/manager/agent-pa02-sandbox-object-extension.ts) | **G-PART/G-LOG 10-14**：隔离真实 SQL commit，包装器模拟 Owner→Host 丢 ACK，Chromium reload/cancel、Receipt 独立查询、不再次业务 WRITE。 | R04/R07/R08/R09 联合证据；**不意味着真实公网 TCP 故障或生产迁移验证**。 |
| G10 [Branch Hygiene Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/branch-hygiene.yml) / [Retired Manifest](https://github.com/jiangxng/EVO-App-Platform/blob/main/repository-hygiene/retired-branches.json) | **G-FULL 10-15**：四个历史 PA-02 docs ref 已由 #877/#880 精确 SHA pin；`workflow_dispatch execute=true` 才逐项核 PR、SHA、祖先关系及 race 并真正 delete。 | 分支整理**尚剩一次人类有权限的 workflow 操作**，merge manifest 不等于删除。 |
| G11 [R10 Actual Request Quote Research](PA02-R10-ACTUAL-REQUEST-INPUT-QUOTE-20261015.md) / [Money Proof](PA02-R10-MONETARY-RESERVATION-PROOF-20261014.md) | **G-FULL 10-15**：W01–W04 当时阅读等级、初版/最终 CI 来源、Railway 只读观察的真实性限制。 | 现金费用不能由旧固定 maxInputTokens、报价网页或模型答案估算。 |
| G12 [Issue #879 — PA02 R10 真实计价授权](https://github.com/jiangxng/EVO-App-Platform/issues/879) | **M 10-15**：已在此窗口创建，列明实际 provider/model/tier、企业批准价、缓存与附加项、账单原始凭据、hard upper bound 和未来最小 Host/PG 正反验收。 | **仍属外部权威待提供**，是下个窗口唯一重点 R10 人类/财务阻断。 |
| R01 [Railway service metadata](https://railway.com/)（仅该平台顶级入口，**没有本窗口验证的可共享特定环境 URL**） | **R-META 10-15**：只读 project/service/variable names，变量值脱敏。可见 Ledger Configurator 的 conversation DB 与 External Agent 开关、App Host Validator 的数据库变量；相关可见变量名**不能证实实际收费 Provider/model**。 | 不据变量名推断全平台没有 LLM，不要求/保存 secrets，也不拿它证明企业合同价或生产 WRITE 已获批准。 |

## 4. 已访问的 GitHub PR、真实 CI、合并 SHA 索引（本窗口已完成，禁止重做）

**阅读日期：** 2026-10-14～15；类型均为 **M + 按相应 PR 的 G-LOG/G-PART**。链接直接指向 GitHub 原始记录。以下是**分层不同代码 HEAD**的场景，不能把 PASS 个数相加当做“同一次全栈”试验。

| PR/固定合并提交 | 真正覆盖的边界 | CI/原始证据及未覆盖 |
| --- | --- | --- |
| [#839](https://github.com/jiangxng/EVO-App-Platform/pull/839)、[#841](https://github.com/jiangxng/EVO-App-Platform/pull/841)、[#842](https://github.com/jiangxng/EVO-App-Platform/pull/842) | Host 受治理 PG SQL Owner/Receipt、丢 ACK 核验、旧 Worker 失租与取消 | [#839 PG18 38511466369](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511466369)、[#842 38515066568](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38515066568)，都是隔离受控业务 |
| [#844](https://github.com/jiangxng/EVO-App-Platform/pull/844)、[#847](https://github.com/jiangxng/EVO-App-Platform/pull/847) | Run 事务 Outbox、事件重投/缺口权威快照、Eidos 消费端恢复 | [Host PG18 38516903528](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516903528)、[Eidos 38532064973](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38532064973)，#847 单测不等于真 Chromium |
| [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845)、[#848](https://github.com/jiangxng/EVO-App-Platform/pull/848) | 模型连续 3 错、24 persisted slices、72h wall clock deadline | [R03/R10 38518119905](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38518119905)、[R10 38532998079](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38532998079)，非货币 |
| [#856](https://github.com/jiangxng/EVO-App-Platform/pull/856)、[#857](https://github.com/jiangxng/EVO-App-Platform/pull/857) | 真实 Provider 响应的 `usage` 可作为 Run 已报告用量；未回不得写 0 | [Usage 专项](PA02-R10-USAGE-EVIDENCE-20261014.md)，未证明真实账单 |
| [#859](https://github.com/jiangxng/EVO-App-Platform/pull/859) merge `5cab35eac649e43968be822c15f579f833596763` | 真实 Chromium/Eidos+HTTP Host+PG READ-only 重连，5/5 | [最终 Actions 38545777724](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38545777724)；不能替代业务 WRITE |
| [#863](https://github.com/jiangxng/EVO-App-Platform/pull/863) merge `65d1d1fe97043a819d04b83d3eb3fb6b3c00252f` | 真实受治理 Owner WRITE，经浏览器前置取消、重复/缺口恢复，7/7 | [最终 Actions 38548975998](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548975998)；不是 SQL 事务内部取消 |
| [#865](https://github.com/jiangxng/EVO-App-Platform/pull/865) merge `996cb2de2e63a657438adfa12aba05044e70fed0` | 业务已提交后浏览器断线，再取消仍留 Receipt，无二次业务执行，8/8 | [最终 Actions 38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829)；Owner 接口 ACK 未失联 |
| [#868](https://github.com/jiangxng/EVO-App-Platform/pull/868) merge `d72c14856e391a7e6a077c93af57df5f8eae8b9a` | SQL 真提交后，**测试包裹层**模拟 Host 丢 Owner ACK，浏览器掉线取消，恢复并查唯一 Receipt，9/9 | [最终 Actions 38551397649](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397649)，不是公网/生产物理网络故障 |
| [#869](https://github.com/jiangxng/EVO-App-Platform/pull/869) merge `bfb3d35883c6f0d112048a359803b2fd492081ff` | 真实 PG18 **合成费率**最坏费用预留、并发/重启/UNKNOWN 占额 | [PG18 38552517889](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38552517889)，最终 14/14 工作流；不是供应商价 |
| [#870](https://github.com/jiangxng/EVO-App-Platform/pull/870) merge `f5c90d21981fb2f5876e27a7940493d77fe4608f` | 已有 Host Worker 发送模拟 Provider 前的货币硬阻断，失败不盲重试 | [PG18 38553690645](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38553690645)，23/23 Worker，最终 18/18 工作流；未接真实收费 Provider |
| [#872](https://github.com/jiangxng/EVO-App-Platform/pull/872) merge `b34863eddcaff75e8c5522da5206cf2828dc8ec5` | 完整已组装模型请求 quote 缺失/过限，则 0 Provider 请求、0 PG 预留 | [PG18 38651279340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38651279340)，24/24 Worker、最终 18/18 工作流；quote 是测试专用 |
| [#874](https://github.com/jiangxng/EVO-App-Platform/pull/874) merge `03cf2a15bb4c0af35cc4084c785cbe056dbb940b` | 缓存写入单独收费无批准时，token `REPORTED` 但金额 `UNKNOWN` 占额不放回 | [PG18 38652026320](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38652026320)，26/26 Worker、最终 18/18 工作流；无真实合同 |
| [#875](https://github.com/jiangxng/EVO-App-Platform/pull/875) merge `b3ae61d1c7c70e1731ddba74daa7ddcdd6fbd72a` | 整体 R01–R10 审计：R01–R09 隔离开发通过，R10 实际货币硬限额 NOT_SIGNED | [Final Signoff Audit](PA02-FINAL-SIGNOFF-AUDIT-20261015.md)；2/2 CI 通过 |
| [#877](https://github.com/jiangxng/EVO-App-Platform/pull/877) merge `54aadc62206a8f9b0b1b5750fedca21950d916f4`、[#880](https://github.com/jiangxng/EVO-App-Platform/pull/880) merge `991ac3e030884b69586b3c1732db9953dc17ef91` | 四条历史 PA-02 docs refs 的正确 SHA-pinned 安全退休清单 | [Manifest](https://github.com/jiangxng/EVO-App-Platform/blob/main/repository-hygiene/retired-branches.json)，每 PR 2/2 CI；**未实际执行 workflow 删除这四条历史 docs branches** |

这些是 **merge 后状态**。旧专项文档中为保留历史撰写时点会出现 `CI_PENDING`、`PR 尚未合入`；不能把这类文字覆盖较晚真实 PR merged/Actions，也不应倒改它们成为伪造当日已合并的历史。
