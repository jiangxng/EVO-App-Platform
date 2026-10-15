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
