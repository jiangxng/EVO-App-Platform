# PA-02 R10 — PostgreSQL 货币预留原语与审批定价缺口（2026-10-14）

**Document class:** DELIVERY_EVIDENCE / FIRST_CODE_HEAD_PG_CI_VERIFIED / NOT_R10_SIGNOFF  
**Start main:** `d72c14856e391a7e6a077c93af57df5f8eae8b9a`（#868 合并，2026-10-14）。  
**Original criterion:** [PA-00～PA-06 建设总纲 §25 R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)，[当前验收](PA02-CURRENT-ACCEPTANCE.md) 与 [原始证据总账](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)。

## 一手源码事实与仅此闭环范围

- 已有 #845 的整 Run 24 步/3 次模型失败、#848 的 72h deadline 和 #856/#857 的真实 Provider usage 持久记录；`MODEL_USAGE_RECORDED` 的 `UNAVAILABLE` 不代表 0 元。**不重写这些闭环**。
- 在正式模型通路 `createProviderBackedAgentModel` → `LlmInferenceProvider.infer` 中，普通请求的 `maxOutputTokens` 是可选属性，且未知哪个真实安装 model/config 经过了输出上限+计费上下界批准。当前无法合法保证单次最大实际收费，不能以合成 Token 数量/官网广告价宣称硬预算。
- 本批新增一个**独立数据库费用预留原语**，放在既有 Agent 线路下、不是新执行器，也**没有在普通 Host/Worker 中启用**。它接收未来经 Host 完成真实性审核的 Provider/model/币种/费率版本、可能计费的最大输入/输出 tokens、所有缓存计费模式的保守最高单价与每 Run 额度；采用整数微币、BigInt 向上取整，不接受缺失字段或零费率。
- 真实 PostgreSQL18 的 Run scope + Run ID 作为分区，每 Run 行锁保障多个 Host 不能并发透支；事务在模型发送**之前**保留整次最坏上界；同 slice 已保留不会允许再发送，旧 HELD/UNKNOWN 在崩溃重启后维持占额并拒绝新 slice。实际 Provider usage 只在严格非负、模型审批边界内才能保守结算并释放未使用额度；未知/畸形的用量保持全额持有，绝不假设免费。审批参数版本漂移、跨 Scope 均拒绝/隔离。
- 测试只采用 `approvalId=ISOLATED_SYNTHETIC_TEST_ONLY` 的**虚构测试费率**，验证数据库语义而非供应商收费单。不会拿这些数字写入企业计价配置，不能验证供应商账单。所有 SQL schema 使用 `pa02_*` 隔离前缀，测试结束删除。

## 明确仍没有通过的两道门禁

1. **运行入口接线**：此 PR 只验证费用预留原语与并发/恢复负向；正式 PA-02 Host/Worker 的模型调用**尚未**接入该原语，也未在请求发送前实际拒绝。故此批单独通过，不代表 R10 费用硬预算 PASS。
2. **真实供应商批准依据**：仍缺实际已安装并绑定的 Provider/model 账单与合法 `usage`、已批准的币种/区域/处理级别/费率版本、缓存计价、长上下文规则，以及该 Provider 的**可验证**最大可收费输入/输出上限。必须证明 Provider 接口实际遵守 Host 的 `maxOutputTokens` 和请求界限，不能仅由调用者声称或靠模型回答。没有这些条件，即使完成接线也应 fail-closed 而非允许任何收费推理。

## CI 门禁

已有 `.github/workflows/agent-pa02-async-read-worker.yml` 的真实 PG18 测试扩展 `tests/agent-line/pa02-r10-postgres-cost-reservation.test.mjs`，覆盖并发、租约之外的持久未知费用保留、重启、额度不足、负向报价、跨 Scope/价格版本漂移。以 PR 最终 Head GitHub Actions 具体成功日志为准；本文件创建时**未经过 CI**。

## 原始研究阅读级别

本批仅复用项目 [R10 usage 已存证据](PA02-R10-USAGE-EVIDENCE-20261014.md) 以及一手 GitHub 代码，**没有重新打开公开报价网站**。历史 14 条外站链接仍为 H 历史转引；未把任何广告价当作批准价。

**PA-02 总状态：** R10 实际货币硬预算仍 OPEN / PA-02 NOT_SIGNED / NO_PRODUCTION_WRITE / NO_PRODUCTION_DEPLOYMENT。该证据原语完成后下一闭环应优先把受限 budget port 接到真实 Host 的模型调用前，并经批准定价负向/正向测试；否则不能最终签收。


## 实际 GitHub CI 首轮：PostgreSQL18 正式 Runner（2026-10-14）

- 初版准确 Head `c8651aa5ff60b07f14c6c96c84364d9df0f68754`：[Agent PA-02 Async Read Worker #38552517889](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38552517889) job `115813635372` **SUCCESS**。三个新增测试的实际日志分别是 `PA02_R10_MONEY_RESERVATION_PG`、`PA02_R10_MONEY_UNKNOWN_PG`、`PA02_R10_MONEY_UNAPPROVED_REFUSAL`。真实 PG18 尝试证明并发唯一预留、重启未知占额不释放、合同版本漂移拒绝、跨 Context 账隔离，未把丢失的 usage 计作 0 元。同一 Head 其他相关工作流首次执行中；必须等待**最终 PR Head 全绿**后合并。
- 这些测试**仅调用新费用原语，不曾发送 `LlmInferenceProvider.infer`**，故所谓“pre-inference”是服务的调用顺序契约，不是 Host 已接好真正的付费接口；它是一项必要、非充分的 R10 子证据。所用每百万 token 合成费率不对应任何官方商业价格，绝不能当作客户账单。
- 审批所缺的信息仍需独立提供/核验：当前绑定 Provider/model 的身份和具体快照、币种/区域/计费类别、缓存费率的合规最高上限与有效期、真实推理最大可收费 token 界限、模型实际请求上限得到 Provider 确认、真实 usage 原始回执。缺一则正式调用必须 fail-closed。未改变 PA-03–PA-06 范围及生产 WRITE 保护。


## 2026-10-15：额外计费缓存写入用量不应静默结算（CI 待证）

基于 #872 已完成的真实请求输入上界检测，本轮审查发现在 `LlmInferenceResponseV010.usage.cacheWriteInputTokens` 已声明为**可能单独计费的缓存写入**，而 #869 原 PG 结算和 #870 Host 端只把 `inputTokens/outputTokens` 两项传入结算。若 Provider 回报 `cacheWriteInputTokens > 0`，在没有独立获批的缓存写入单价及最大量情况下仅结算两项会提早释放额度，不能称为货币硬预算。

最小安全修正：保留 Provider 原始 `MODEL_USAGE_RECORDED` 的正确事实，不捏造缺失 usage；在 Host→PG cost port 中传递完整 `usage`；现有合成价账本不支持额外单列缓存写入计价，故 **positive `cacheWriteInputTokens` = `UNKNOWN`，完整最坏费用占额保持不释放，`RUN_BLOCKED` 且不再发送后续模型/工具调用**。只有明确 0 或没有该字段时沿用此前合成价的 input/output 结算测试。未报告字段不能证明真实供应商不收费，正式计价依然需要 Provider 的可信类别与版本审批。

新增 PG18 + Host Run 负向要求：模拟 Provider 报告 input 25/output 5/cacheRead 10/cacheWrite 7；真实原 Run 持久 `REPORTED` usage（事实），但货币状态 `UNKNOWN`，140 合成微币不被释放；重复恢复也不会第二次付费调用。另一个独立 PG18 账本测试核定旧 UNKNOWN across restart。**创建代码与此文档时没有 CI PASS，最终仍以实际准确 PR HEAD 及测试日志为准**。

**新增外部来源阅读等级**：2026-10-15 [OpenAI Pricing](https://platform.openai.com/pricing) 通过搜索结果获得 `Input`、`Cached input`、`Cache writes`、`Output` 分类 **W-SEARCH-SNIPPET**，直接打开定价 URL 页面无可读正文，**不是 W-FULL、不是用户批准的价格合同**；不采用其中浮动金额。先前遗留 14 条外站 H 级照旧 H，不借本来源升级。

此安全改动仅补 PA-02 R10 合成账一致性，**不扩展 PA-03～06**、不配置或部署收费 Provider、不开生产 WRITE；真实用户/企业批准报价、真实附加费用机制及正式账单仍是阶段签收缺口。
