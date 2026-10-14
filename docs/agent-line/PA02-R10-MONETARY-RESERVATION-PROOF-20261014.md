# PA-02 R10 — PostgreSQL 货币预留原语与审批定价缺口（2026-10-14）

**Document class:** DELIVERY_EVIDENCE / PR_CI_PENDING / NOT_R10_SIGNOFF  
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
