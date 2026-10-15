# PA-02 本窗口研究、来源与证据详细索引（2026-10-15）

**Document class:** SESSION_RESEARCH_SOURCE_LEDGER / HISTORICAL_SNAPSHOT  
**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**编制时主线：** `main@991ac3e030884b69586b3c1732db9953dc17ef91`，#880 合并后。**这不是资料包 PR 合并后的或将来永久最新 HEAD。**  
**简短交接入口：** [PA02-WINDOW-HANDOFF-ENTRY-20261015.md](PA02-WINDOW-HANDOFF-ENTRY-20261015.md)  
**上轮历史索引：** [2026-10-14 detailed source ledger](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md)；[原 PA-02 总纲 §25 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)；[项目交付规范](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。

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

这些链接来自 [10-14 历史索引 §3](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md#3-历史外部网页参考原始-url-完整保留但本窗口未访问外站)。**保留网址不是标记已读**。下列中间栏全部是先前交接的可能要点，未经本窗口核实。

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
| G03 [PA-00～PA-06 Construction Blueprint §25](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) | **G-PART 10-14**：R01–R10 原始测试；R10 包括步骤/时间/**费用**，PA-04 context token budgeting 不是费用硬预算。 | 防止人为缩窄原始完成定义或偷渡 PA-03～06。 |
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


## 5. 关键易失资源：CI Job、报告、Chromium 截图和保全层级

GitHub Actions 的日志和 Artifact 有保留期限。**以下 URL 经过前面本窗口原始 CI／项目专项文档记录**，但本次整理没有重新下载二进制图像、录屏或将其复制成永久附件。Artifact 号码、Run 号码必须配对，**初版 Artifact 不等于最终 PR HEAD 的同一次执行**。

| 场景及原始位置 | 已保存的证据结构、事实 | 时效与局限 |
| --- | --- | --- |
| #859 READ-only Chromium | [最终 Run 38545777724](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38545777724)；[初版 Artifact 11883745457](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38543376224/artifacts/11883745457) | 初版 5/5 记录包括 `PA02_REAL_CHROMIUM_R09`、`r09-http-browser-report.json` 和 Chromium 截图/Host 日志。**仅 READ**，不得冒充企业 WRITE 复核。 |
| #863 真正受治理 SQL Owner 浏览器 | [最终 Run 38548975998](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548975998)、[中间一次 7/7 Artifact 11885457660](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548540580/artifacts/11885457660) | `owner-http-browser-report.json`、`pa02-owner-workbench.png`、`pa02-owner-reloaded.png`、`bootstrap.log`；曾发现新增取消测试 6/7，后通过正确 `REQUESTED→CANCELLED` 正式 Host 协议修复并 7/7。失败是**测试错误使用旧取消流程**，不可改写成首次通过。 |
| #865 已提交业务/浏览器断线取消 | [最终 Run 38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829)；[中间 8/8 Artifact 11885399235](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549519235/artifacts/11885399235) | 原 Run SQL 业务/evidence/Receipt 各一条，重连后终态取消仍留已发生回执。`pa02-owner-committed-cancel-recovered.png` 及报告/Host 日志在中间 Artifact。**当时尚未模拟 Owner→Host 丢 ACK**。 |
| #868 SQL commit 后模拟业务 ACK 丢失 | [最终 Run 38551397649](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397649)；[初版 9/9 Artifact 11886517409](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38550940285/artifacts/11886517409) | `pa02-owner-post-commit-ack-lost.png`、`owner-http-browser-report.json`、`bootstrap.log`；宿主测试专用包装器在真实 PG commit 后丢弃 ACK。**不是抓到一次真实公网 TCP 故障**。 |
| R10 PG/Host 真正可重跑测试 | [#869 PG18](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38552517889)、[#870 Host PG18](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38553690645)、[#872 Host PG18](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38651279340)、[#874 Host PG18](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38652026320) | 关键日志 markers：`PA02_R10_MONEY_RESERVATION_PG`、`PA02_R10_HOST_MONEY_PREFLIGHT`、`PA02_R10_REAL_REQUEST_BOUND_REQUIRED`、`PA02_R10_HOST_CACHE_WRITE_UNPRICED`。断言永久在 `tests/agent-line/` 内；没有向 GitHub 另存全部原始 Job 日志。 |
| 原 R01–R10 条款位置 | [总纲](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) 的 `25`、`26.2`、`27`。上轮历史索引记作大约 745–754、850–860、887–892 行 | 新增源码会改变行号，**按节标题而非旧固定行号检索**。 |
| 四条历史 PA-02 docs 分支 | [retired-branches.json](https://github.com/jiangxng/EVO-App-Platform/blob/main/repository-hygiene/retired-branches.json) 的四个 `expectedHeadSha`；[Branch Hygiene workflow](https://github.com/jiangxng/EVO-App-Platform/actions/workflows/branch-hygiene.yml) | #877/#880 清单与 SHA 已入 main；本窗口**没有手动运行** `workflow_dispatch execute=true`，还无 `DELETED` 日志/删后确认。 |

**保全办法：** 固定 commit/PR SHA、真实 Runner ID、关键 Job 测试名、脚本/断言路径和官方来源级别优先；有权限时在 Artifact 到期前下载，但**当前没有已验证的持久存档附件路径**。不能编造 `sandbox:/mnt/data/...` 文件或假定旧文件可跨窗口自动使用。

## 6. 项目方案比较：已采用、排除与适用条件

**决策来源：** 项目用户已确认的交付边界 + 当前 GitHub 一手代码/CI + 本窗口工程判断 J。**不是**未读 H01–H14 外站给出的“官方最优解”。

| 议题 | 采用的路线、工程理由（J） | 明确排除/延期及原因（J） | 一手证据支持的条件与限制 |
| --- | --- | --- | --- |
| Run/Worker 引擎 | **复用已有** PG Fenced Worker、Host Thread/Run、Owner verifier、Receipt、原 Eidos Workbench；已满足当前原始 R01–R09，避免重复建设 | 不另建 Temporal 式新调度器、第二套 Agent executor 或全平台状态引擎。H10 原文未读，不能据此断言 Temporal 不可用。 | **G** #839/#842/#845/#868。现在验证过的是隔离 Owner/PG/Chromium，而非生产多地域可靠性。 |
| WRITE 结果不明 | PG 业务 Owner 的独立幂等/不可变 evidence，`UNKNOWN` 只查询验证已提交效果；迟到响应和取消按原 Receipt 结算 | 不让模型的“成功”文本替代回执，不在丢 ACK 时再调用 Owner 重复 WRITE | **G** #839/#842/#865/#868；需要业务插件有可独立核实的 Owner evidence；不擅自迁移既有企业文件型资源到生产 PG |
| 客户端事件恢复 | Run Outbox 与业务事件事务一致，`eventId`+ordinal 去重、缺口返回权威 Run 快照，原 Thread 重连继续同 Run | 不拿旧内存 SSE ring 充当唯一跨进程权威，不因 UI reload 生成新 Human Turn/业务写入 | **G** #844/#847/#859/#863/#865；浏览器联测 PASS 仅受控本地 Host |
| 运行边界 | 连续 3 次模型错误上限；整 Run 24 slices、创建时间默认 72h，持久状态不可因进程重启清零 | 不无限重试模型，也不按单个 HTTP action 单独 reset run limits | **G** #845/#848；费用是另外一个必须验收的 R10 gate |
| R10 金钱模型 | 同原 Host Worker 的 PG 最坏费用预留、未知费用不放回、完整最终 Request 被可信 quote 拒绝时不得发模型、cache write 未批准不结算 | 不把公开价格摘要写死、不把供应商 usage 缺失当 0、不用 Human text token 估整个系统请求、不提前释放未知额外计费 | **G** #869/#870/#872/#874 **都是合成费率/quote**；**W01** 只有计数 API 信息、**W04** 只有搜索摘要，均不是批准合同 |
| 真实费率与付款审计 | 企业有权 owner 批准实际 Provider/model/tier、版本化币种/费率及最坏计费项；要求供应商可信使用量和账单对账 | 拒绝模型自己口述费用、公开营销价、根据 Railway 变量名揣测收费合同 | **M/R-META** [Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879)，目前**实际合同/原始账单仍未取得**；没有权威只能保持 R10 OPEN |
| 团队分支/权限 | 一项独立成果一条短期 `agent/` branch/PR，修复同 PR，最新 Head CI→merge→自动清理；历史 docs branch 使用准确 SHA 的现成工作流退休 | 不 Force-push/强行移动历史 refs、不凭文件删除伪装删分支、不覆盖 BEX/治理/2D、不绕过保护 | **G** #877/#880 与 [Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/actions/workflows/branch-hygiene.yml)；四条历史 refs **仍待人工 execute=true** |

## 7. 冲突、未解问题与下一步最有价值的查阅

1. **历史 `CI_PENDING` vs 真实 merged：** 2026-10-13/14 旧快照常写“尚未 Host Owner 接线／未验证浏览器”。#839～#874 后续 PR 已改善；**保留历史文档原样**，以 GitHub 真实 merge SHA、最终 Head、现行 [R01–R10 audit](PA02-FINAL-SIGNOFF-AUDIT-20261015.md) 界定当前状态。
2. **“26/26 CI”不等于真实货币硬预算：** R10 合成 token 价和 synthetic quote 已验证但没有供应商真实合同、账单、实际额外类别与可靠全费用 upper bound。按原 `25` 仍 `PA-02 IN_PROGRESS / R10 NOT_SIGNED`。若无额外权限事实，不应靠再做一个模拟功能关闭 Issue #879。
3. **W01 计数 API vs 最大可收费金额：** 返回模型输入计数≠输入上限证明，更不覆盖缓存写入、reasoning/output、tier 长上下文、额外收费或异常重试。最值得查阅的下一材料：**真实绑定** Provider/model/端点的对应官方 API 适用章节、合同版本和供应商可核账单，而不是泛搜不知当前使用的模型。
4. **W02 DeepSeek Chat 端点 vs 现 Responses Adapter：** `max_tokens` 文档不能直接支持这个仓库的 `max_output_tokens`。得到真实部署绑定端点后再定位**准确端点**的限制/费用资料；未完成以前 fail closed。
5. **已报告 token vs 金钱可结算：** `MODEL_USAGE_RECORDED(REPORTED)` 是来源事实，`UNKNOWN` 金钱是收费证据不足；#874 证明 cache write 增费分类未知时完整占额不能释放。二者不矛盾，不要强行改成已支付/免费。
6. **正式 Host 与测试注入的边界：** `testOnlyCostPolicy` 与 `testOnlyBilledInputUpperBound` 不等于已载入生产价表。已连接 Railway 只读 variable names 并不能证实实际 provider binding/币种；绝不读取或在文档粘贴密钥。
7. **四条历史 docs branch 真正是否删除：** [#877](https://github.com/jiangxng/EVO-App-Platform/pull/877)/[#880](https://github.com/jiangxng/EVO-App-Platform/pull/880) 只是 SHA pin 清单，必须手动现有 Workflow `Run workflow→execute=true`，要求 `DELETED <branch> @ <exact sha>` 日志且删后 GitHub branches list 不含其名称。如果没有 workflow dispatch 写权限，只能报告“待执行”，不拿其他 API 强制替代。
8. **未完结的 owner 授权：** [Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879)：真实 Provider/model/区域/tier/端点、批准价目/币种/版本/时间、全部收费类别、可信最大 billable 上下界、原始 usage/收费凭证；在取得前不应发起付费 API 调用或宣布阶段签收。
9. **未来研究的优先级：** (高) 实际批准的真实 Provider 费用合同和计算边界；(高) 准确端点模型输入和输出 cap + 账单核对；(中) 必要时 H13 OTel GenAI instrumentation/H12 W3C status messages；(低) H01–H10 等在 PA-03/04/05 未来 scope 变更后才重访。**14 条 H 不应因本轮其他外站阅读“升级”。**

## 8. 项目模块映射、下一任务与当前源分支约定

| 项目 owner 与现存模块/路径 | 已有成果，下一任务 |
| --- | --- |
| Host/Agent：`manager/agent-async-read-worker-runtime.ts`、`agents/enterprise-agent/pa02-async-read-worker.ts`、`tests/agent-line/pa02-r10-host-cost-preflight.test.mjs` | 正式同一 Run/Worker 加合成计价预留与完整请求 quote 负向 **已合并**；无批准 Provider 不得打开真实收费模式，也不用重做 executor |
| PostgreSQL 费用账：`agents/enterprise-agent/pa02-r10-postgres-cost-reservation.ts` | 原子 reserve、UNKNOWN 持有/重启、不合法额外费用 fail closed 已验证；只在实际定价合同给全量可计费项目上限后接真实费率 |
| Provider：`contracts/llm.ts`、`providers/openai/runtime.ts`、`providers/deepseek/runtime.ts` | 原始 `usage` 已真实区分 REPORTED/UNAVAILABLE；需要**获授权**的实际绑定 Provider/model、端点、tier、准确计费/凭证 |
| 业务 Owner：`manager/agent-pa02-sandbox-object-extension.ts`、`apps/object-extension/agent-owner-postgres.ts` | R04/R07/R08/R09 受控真实 SQL/Host/Chromium 联测已验证，不转化为生产 WRITE 授权 |
| Eidos Thread/Run：`vendor/eidos` 的既有消费端恢复路径 | 不重做 #847/#859/#863/#865/#868；如果将来另改 UI，由 Eidos owner 依自身规则负责 |
| 阶段签收：`docs/agent-line/PA02-CURRENT-ACCEPTANCE.md`、`PA02-R01-R10-EVIDENCE-LEDGER-20261014.md`、`PA02-FINAL-SIGNOFF-AUDIT-20261015.md` | 若 [Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879) 有**真实新增已获批准的** Provider 凭据，再建**一个**最小成本正/负闭环短 PR；否则 R10 保持 OPEN |
| Branch Governance：[retirement manifest](https://github.com/jiangxng/EVO-App-Platform/blob/main/repository-hygiene/retired-branches.json)、[Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/actions/workflows/branch-hygiene.yml) | 四条旧 PA-02 docs branches 已 pin exact SHA，**未真实删除**；下一窗口或有权限用户执行现成安全 workflow；BEX/gov/2D branches 严禁碰 |
| 本次交接两档文档：[入口](PA02-WINDOW-HANDOFF-ENTRY-20261015.md) + [本详细索引](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) | 新窗口先简短入口，再按需本索引；历史 10-14 索引保留，不能当作最新 main |

编制基线时开放 PR 是 BEX [#846](https://github.com/jiangxng/EVO-App-Platform/pull/846)、[#860](https://github.com/jiangxng/EVO-App-Platform/pull/860)、[#866](https://github.com/jiangxng/EVO-App-Platform/pull/866)、[#878](https://github.com/jiangxng/EVO-App-Platform/pull/878)，**仅属 2026-10-15 此刻的快照**。本交接只在独立 `agent/pa02-session-research-handoff-20261015` 短分支工作；合并后**从最新 main 接续，不复用此短分支**。不改 `project.status.json`、全局 `docs/roadmap/HANDOFF-LATEST.md`、其他 BEX/治理文件，不提前做 PA-03～06，绝不启用生产 WRITE。

## 9. 本次确已保存和确实未保存的内容

- **保存在 GitHub 文本中的内容**：本窗口 W01–W04 URL／日期／精确阅读层级；H01–H14 URL／历史非访问状态；源码/PR/CI/截图附件 URL 与使用限制；方案比较及来源事实/J 判断区别；冲突与待研究方向；R10 Issue #879 和四条 docs branch 退休状况；模块到下一任务映射。只有**资料 PR 实际 merged**才可称这些新文档已进入 main。
- **未额外上传为新永久附件**：全部 Actions Job raw logs、截图二进制、Browser Trace/录屏。仅记录了 **Run/Artifact 原始可复核 URL + 日志 marker + 测试源代码**，某些 Artifact 以后可能因保留期过期；本次不宣称已打开或下载所有旧 ZIP。
- **根本没有得到、不能造的资料**：H01–H14 的本窗口原站全文和截图；W03 原文/W04 原站定价正文；当前企业获批真实价表、实际 LLM 凭证、可信供应商计费上下界与原始账单；生产可靠性/生产 WRITE 授权；未发生的安全分支删除日志。它们都是**待核/未取得**，不是被遗漏未贴的“已阅附件”。
