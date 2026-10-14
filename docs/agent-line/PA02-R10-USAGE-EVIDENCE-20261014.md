# PA-02 R10 — 供应商 usage 持久证据、费用硬预算待验（2026-10-14）

**Document class:** DELIVERY_EVIDENCE / ACTIVE_GATE (尚待本 PR CI 和合并确认)
**Scope:** 原总纲 R10；只处理现有受治理 Host / Fenced Worker 的模型实际用量证据，不替换现行执行器。
**Baseline:** `main@cdf7b42721c9aa424caacbcb495996d5dae5da46`；其他窗口的新提交应以各自实际 main 为准。
**Earlier accepted evidence:** #839/#841/#842/#844/#845/#847/#848，详见 [历史原始索引](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md)。这些无需重做。

## 一手源码事实与本批改动

- 当前 Worker 经 `createProviderBackedAgentModel(provider)` 调用通用 `LlmInferenceProvider.infer`，既有模型适配仅提取决策文本/工具调用，而没有传递 `response.usage`；历史 OpenAI 直连 `openai-responses-model.ts` 不是正式 Host 的收费数据权威。
- `contracts/llm.ts` 支持模型实际 `inputTokens`、`outputTokens`；可选缓存读/写明细对接 Provider 回执。**可选字段缺席 = 未知，不是 0。** 未看到真实 Provider 回执前，不能推断缓存值或模型供应商实际账单。
- 这次通过现有 `agent_run_events` / 事务 Outbox 增加 `MODEL_USAGE_RECORDED`，在模型决策落库前写下原始返回的 providerId / modelId、确切 token 明细或 `UNAVAILABLE`。Run reducer 依每个 slice 校验身份、整数范围、重复记录，并在不同 Host 重建 `modelUsages`。若已持久记录 usage 但尚无决策，恢复时**不重发可能重复收费的推理**，进入明确阻断。
- 原 Owner WRITE ACK / Receipt、取消、Outbox、24 步和 72h 限制不改变。缺模型用量不应误称“模型免费”，也不写入虚构的金额。

## 外部研究来源与阅读等级（新增 2026-10-14，非历史 H 类升级）

| 来源 | 精确原始 URL | 本窗口阅读等级 | 经证实的事实 / 决策用途 |
| --- | --- | --- | --- |
| OpenAI API Pricing | https://developers.openai.com/api/docs/pricing?tab=suite | **W-FULL**（已打开当日官网页面） | 不同模型、上下文长度、缓存读取、缓存写入和处理模式存在不同单价。只作计算设计依据，不直接作为 Host 已批准价格表。 |
| OpenAI GPT-5.6 Terra model | https://developers.openai.com/api/docs/models/gpt-5.6-terra | **W-FULL**（已打开当日官方型号页面） | 示例验证模型 ID 和账单规则具有版本/上下文条件；并未证明此型号为当前已绑定的真实 Provider。 |
| Responses API usage | https://platform.openai.com/docs/api-reference/responses-streaming/response/content_part | **W-SEARCH-SNIPPET**（网页全文读取因体积超限失败） | 搜索摘要见 input_tokens/output_tokens/cached_tokens 结构；不得夸称原文已读或当作现有通用 Provider 一定回报缓存明细。 |
| 旧 14 个外部链接 | [交接详细索引 §3](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md#3-历史外部网页参考原始-url-完整保留但本窗口未访问外站) | **H**（历史转引未在本窗口打开） | 等级原样保留；此次新增 3 条页面不改写历史证据。 |

## 仍需完成才能称作 R10 硬预算 PASS

1. 在真实已安装 `llm.inference` Provider 验证 `usage` 是否确实可读、是否存在 token 明细遗漏；保留 modelId、准确配置版本和请求回执。现在测试 fixture 返回的是结构化模拟 usage，不等于真实供应商费用账单。
2. 由 Host 批准**明确币种、价目版本、模型实际 ID/区域/服务等级、缓存和长上下文计价**，再引入不可被模型或调用者操纵的费率表。不要把官网样例硬编码进运行时。
3. 要称“硬预算”，**每次可能计费的模型请求之前**必须保守保留足额已核验的最坏情况下费用上界，崩溃/超时期间不释放未知保留额；用真实 Provider 回执事务结算，费用不足**在发请求前**持久 BLOCKED；还需验证重启、并发、响应丢失和既有 Owner WRITE Receipt 仍能核验。仅推理后计算金额是事后统计而非硬阻断。
4. 隔离 Host + 真实 HTTP/Chromium 与 Eidos 同 Run 恢复整链仍独立 OPEN；R01–R10 阶段签收仍 OPEN。不得部署生产 WRITE。

## 这批测试门禁

`tests/agent-line/pa02-r03-r10-durable-model-budget.test.mjs` 新增 PostgreSQL18 真实 Host Run 测试：精确 usage 在 `agent_run_events` 保留，重启 Host Run 可重建，同源 `thread.send` 重复不会重发模型调用；未提供 usage 时 Run 清晰记录 `UNAVAILABLE`，不得以零费用计数。运行工作流 `.github/workflows/agent-pa02-async-read-worker.yml` 原有 `node --test` **确实包含此文件**。以最终 PR Head Actions 执行结果为准，不预填成功。

**限制:** 此 PR 是计量证据闭环，不是已经通过的货币硬预算，也不是生产成本上限；R10 费用门禁依然 OPEN。