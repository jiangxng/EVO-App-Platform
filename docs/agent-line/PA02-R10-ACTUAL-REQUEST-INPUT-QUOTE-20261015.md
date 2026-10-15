# PA-02 R10 — 完整模型请求的可信输入计费上界前置门禁（2026-10-15）

**Document class:** DELIVERY_EVIDENCE / FIRST_HEAD_CI_VERIFIED / PA02_R10_NOT_SIGNED  
**Baseline:** `main@f09709adcb1b9817516d8d3c2479845c5900f22b`（当前基线含并行插件治理 #871；不能把前一窗口 `f5c90d2...` 当永久 HEAD）。  
**Scope authority:** [原始 PA-02 §25 R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) / [当前验收](PA02-CURRENT-ACCEPTANCE.md) / [完整 R01–R10 证据账](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)。

## 新发现的真实风险（源码一手）

- 已合并 #869/#870 证明 Host 的 PostgreSQL 原子预留、额度耗尽阻断、模型异常费用 UNKNOWN；但前一版使用 `Pa02CostPolicyCandidateV010.maxBillableInputTokens` 这一静态候选数，**在 Worker 构造最终模型消息/工具列表之前已经预留**。该数值无法证明真实发送给 Provider 的完整系统/开发者/用户消息、历史、工具 Schema 和观察结果均在这个可计费范围内。
- 单纯 `run.input.message` 字节数、用户文本 tokenizer 估计、模型自己声称的上界都不能替代已组装真实请求的独立可信计量口径。缓存、reasoning/output、额外工具计价更需单独费用条件。R10 不得凭静态上界杜撰供应商最大账单。

## 本闭环改动（非第二套执行器）

复用原 `createReadOnlyFencedAgentWorkerV030`、`createProviderBackedAgentModel`、`Pa02CostLedgerV010` 和原隔离 PG schema。仅受信任 Host 注入的**测试用** `testOnlyBilledInputUpperBound(request)` 必须在模型已组装**真实完整 `LlmInferenceRequestV010`**之后评估该请求的可计费输入 token **严格上界**，且这个上界必须是正的安全整数、不得超过当前候选策略 `maxBillableInputTokens`。未提供、异常、畸形或越界时 `RUN_BLOCKED: PA02_R10_COST_INPUT_UPPER_BOUND_UNVERIFIED`，**在 reserve 和 provider.infer 之前阻止**；没有发生的付费请求不会伪造费用预留。

得到被信任的合法 quote 后，原 PG 费用原语仍按可能的最大输入/输出收费做原子持久预留；重复/UNKNOWN、额度不足、Provider/model 不符仍阻断；额度预留成功才调用原 Provider；响应未知仍以最大额保留。没有更换模型、执行器或业务 Owner。

**注意：** 本批回归使用的 `syntheticFullRequestQuote` 只是测试替身，它检查完整 request 的系统/开发者字段与 Host 输出限制是否存在，然后模拟一个整数上限；**绝不是实际供应商 tokenizer 或账单凭证**。正式 Server 仍未启用货币计价策略，也未获得任何真实 `Provider` 的可信输入上限服务。这个变动是将来获批可信 quote 接线的门禁，不表示正式收费预算完成。

## 新查阅外部官方文档（与历史 14 条 H 来源分离）

| 来源和访问时间 | 阅读等级 | 已证事实 | 不可越界的推断 |
| --- | --- | --- | --- |
| OpenAI [Count input tokens](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens)，2026-10-15 | **W-FULL（官方实际读取相关完整内容）** | 官方列出 `POST /responses/input_tokens` 和 `input_tokens` 响应字段 | **不能**从该页面直接推出返回结果是包含未来额外费用、未公开计价项目、网络重试的完整最大账单；本批未实际请求 API |
| DeepSeek [Chat Completions API](https://api-docs.deepseek.com/api/create-chat-completion/)，2026-10-15 | **W-PART（官方实际读取参数相关段落）** | `max_tokens` 是 Chat Completion 输出上限参数；存在上下文长度限制 | 现有仓库 DeepSeek adapter 使用 `/responses` 与 `max_output_tokens`，不可用 Chat Completion 参数页冒充该端点的参数或收费承诺 |
| [OpenAI Responses create](https://platform.openai.com/docs/api-reference/responses/create)，2026-10-15 | **W-ATTEMPTED-NOT_READ** | 本轮全文读取因网页体积上限失败 | 不将搜索摘要写作已读全文或已核批准的价格 |

旧交接索引中的其他 **14 条**历史外站引用仍为 H／历史转引；这次没有逐页重读，不升级阅读等级。

## 当前仍阻断真正 PA-02 R10 签收的事实

(1) 真实当前绑定的 Provider/model/服务等级/货币和已审批**版本化**报价；(2) 真实 Provider 对**本次组装输入请求**的可证明最坏可计费输入上界及输出上限执行，缓存与附加费用类别按官方/合同处理；(3) Provider 原始计费凭证与 PG 持久账的差异核对；(4) 用真实审批数据完成隔离 HTTP/Host 费用硬限额正反验收。任何一项缺失只能 fail closed；不擅自调用收费供应商、不部署生产、不启用生产 WRITE。

**PR 验收门槛：** 现有 Agent PA-02 PG18 Worker CI、Host/Continuity/Lightweight 等相关检查全部绿；新增用例必须证明 quote 收到了真正的 system+developer+user/tool 输入结构，缺 quote/大 quote/NaN 均零 Provider 调用且零 PG 费用行。提交当下状态 **CI_PENDING**，不得提前写 PASS。


## 2026-10-15：第一次准确代码 HEAD 的真实 CI 证据（合并前）

- [PR #872](https://github.com/jiangxng/EVO-App-Platform/pull/872) 第一次代码+文档 HEAD `9864c64d1e1ecb79b640d5795fab8c927048b0b7` 的 **18/18 GitHub Actions 工作流 SUCCESS**；[真实 PG18 Agent PA-02 Async Read Worker workflow 38650954272](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38650954272) job `116149313153` 原始日志报告 **24 pass / 0 fail**，包括新增 `PA02_R10_REAL_REQUEST_BOUND_REQUIRED`。
- 新负向用例检查 quote 函数收到**已组装**的 system/developer/user 消息及实际 maxOutputTokens；没有可信 quote、quote 越过输入上限及非整数/NaN 时都 `RUN_BLOCKED`，本地 Provider `infer` 0 调用、PG monetary reservations 0 行。此前合成预留/额度不足/未知费用 + R03/Owner 回归继续绿。首次 Head [全部 Actions 列表](https://github.com/jiangxng/EVO-App-Platform/pull/872/checks)。
- 通过范围严格为**已编译 Host Worker + PostgreSQL18 + test-only synthetic quote/Provider**；不能推导实际 OpenAI/DeepSeek 的报价、最坏账单或真实生产路由。最终 PR Head 文档变更将再次触发 CI，必须重新复核，且未经正式供应商审批前 R10 / PA-02 仍 OPEN。


## 2026-10-15：已连接 Railway 只读环境盘点（不取得密钥、不执行模型或部署）

只读连接器 `Railway list_projects → list_services → list_variables` 返回当前可见项目 `EVO Ledger Runtime MVP` 的生产环境；相关服务 `Ledger Configurator` 的**已显示变量名**有 `APP_PLATFORM_CONVERSATION_DATABASE_URL`、`APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED` 和 `APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED`，但在这批变量名中**没有** `OPENAI_*/DEEPSEEK_*/APP_PLATFORM_AGENT_RUN_ASYNC_*`；`Ledger Configurator App Host Validator` 仅找到 `DATABASE_URL` 的相关变量名。连接器 `valuesRedacted=true`，本轮没有读取任何变量值、密钥、账单、Run 私有数据库或 Runtime Provider Registry，也没有开启生产 WRITE/调用真实收费模型。

**证据等级：R-META / connected Railway read-only service/variable-name metadata, 2026-10-15。** 这不证明整个 EVO App Platform 没有实际可用 LLM；Provider Binding 可能由 Platform 的密钥管理器/数据层保存，连接器可见 Railway 服务也不一定代表全部部署。**不能仅凭变量名宣布真实供应商/模型身份、计价类别、费用审批或使用量已核实**；R10 正式供应商计价仍缺一手批准证据，继续 fail closed。
