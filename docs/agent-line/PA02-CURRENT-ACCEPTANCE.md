# PA-02 — R01–R10 当前验收与最终收口表

**Document class:** CURRENT_STATUS / LIVING_RUNBOOK
**Last reviewed:** 2026-10-14
**Authority:** [PA-00～PA-06 建设总纲 §25](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) 的原始 R01–R10；项目交付规范；[历史交接入口](PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md)。
**Current verified main:** `996cb2de2e63a657438adfa12aba05044e70fed0`（[#865](https://github.com/jiangxng/EVO-App-Platform/pull/865) 已合入；本轮快照）。截至核验无开放 PA-02 PR，BEX #846/#860 是其他 owner。**原始十项证据总账：** [PA02-R01-R10-EVIDENCE-LEDGER-20261014.md](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)。最新状态以该总账及本节最终 merged 补记为准，旧时间顺序段落不覆盖最新合并状态。
**Production:** NOT AUTHORIZED / No production WRITE deployment. **PA-02 milestone:** IN_PROGRESS, NOT SIGNED.

每完成一个可验证交付闭环，**更新这张表，不使用倒数数字冒充进度**。状态必须区分局部 CI 通过、隔离真实整链通过、最终阶段签收；表格不得提前填 PASS。

| 验收项目 | 当前状态（有证据的范围） | 下一步／剩余验收 |
| --- | --- | --- |
| R01 双 Worker 领取 | **隔离 PG18 竞争已验证** #799/#800 | 独立证据已纳入原始总账；生产多节点 RPO/RTO 不是本轮证明 |
| R02 旧 Worker 复活 | **旧 fence/租约拒绝已验证** #800/#842 | 旧 Worker 拒绝不能代替外部业务回滚 |
| R03 模型失败 | **已验证** [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845) | 最终账登记连续 3 次封顶/负向场景 |
| R04 WRITE 响应丢失 | **正式 Host + SQL Owner 已提交 ACK 丢失独立核验通过** #839/#842 | 未直接在同一浏览器/Host 故障内制造 Owner→Host ACK 丢失+旧 Worker 失租 |
| R05 Outbox 重投 | **PG/Eidos/READ/真实 governed Owner WRITE 分层已验** #844/#847/#859/#863/#865 | 重复事件/请求不二次业务 WRITE，见总账 |
| R06 事件缺口 | **PG/Eidos/真实 HTTP 缺口及取消后 Receipt 快照均验收** #844/#847/#859/#865 | 异常游标读权威快照，不新建 Run |
| R07 部分成功/失败 | **提交后中断，Chromium 恢复保留已发生的 Owner Receipt 验证** #842/#865 | 不代表 SQL 内部部分成功可撤销 |
| R08 运行中取消 | **Owner 原子取消与浏览器执行前/已提交后取消均已验** #842/#863/#865 | 同一 SQL 提交时旧 Worker 失租+浏览器复合故障未直接模拟 |
| R09 断流重连 | **READ #859 5/5、Owner WRITE #863 7/7、已提交后浏览器断线取消 #865 8/8 均 merged**（[最终 CI 38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829)） | 不是 SQL Owner→Host ACK 真丢的模拟；R04 独立证据仍需区分 |
| R10 Run 步数 | **24 slice 持久边界已验证** #845 | 纳入最终证据账 |
| R10 Run 时间 | **72h 持久截止已验证** [#848](https://github.com/jiangxng/EVO-App-Platform/pull/848) | 纳入最终证据账 |
| R10 实际 usage | **#856/#857 已合并**：真实 Provider 所回报用量持久记录，缺失用量明确标记 `UNAVAILABLE`、不伪零；[实施证据](PA02-R10-USAGE-EVIDENCE-20261014.md) | 仍缺绑定的供应商真实计费/审批费率；不能由 token 数自动推定货币费用 |
| **R10 硬货币预算** | **OPEN / NOT IMPLEMENTED** | 审批计价版本与最坏情况预留、费用结算和崩溃保留，预算前置阻断的负向 CI |
| **真实 HTTP／Chromium 整链** | **READ 5/5 + SQL Owner 7/7 + post-commit disconnect/cancel 8/8 均通过并合并** | 还没有单次 Owner→Host ACK 丢失＋浏览器失联＋旧 Worker fencing 的极端复合证明 |
| **R01–R10 最终签收** | **逐项证据总账完成 / 阶段未签收** | R10 货币限额的批准计价、最坏情况原子预留/硬拒绝仍未完成 |
| **PA-02 阶段** | **IN_PROGRESS / NOT_PRODUCTION_READY** | 全部原验收通过方可 DEV_COMPLETE；生产单独审批 |

## 最新完成与事实边界

- 本轮新完成的**局部测试**：[Agent PA-02 Async Read Worker, run 38540567510](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38540567510)，PG18 / `17 pass 0 fail`，日志实际出现 `PA02_R10_DURABLE_PROVIDER_USAGE`；同一准确 Head 的 18 项 workflow 全部 SUCCESS，包括原 PA-01B2 Chromium CI（**这不是 PA-02 整链浏览器证据**）。
- #856 代码把真实 `llm.inference` Provider 回来的 usage（如果提供）作为独立 Run 事件记录；没有 usage 的 mock 与 Provider 记 `UNAVAILABLE`，**不认为免费**。没有可靠供应商账单、价格审批或硬预算。
- 对照 [2026-10-14 原详细研究索引](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md) 中项目一手证据与 14 条历史外站 H 级转引；新增的实际外站查阅等级见 [R10 Usage 研究页](PA02-R10-USAGE-EVIDENCE-20261014.md)。
- **并行边界：** BEX #846（Draft）与 #860（功能修复）仍开放；本线不覆盖 BEX/2D/插件治理，不修改 `project.status.json`、项目级 `HANDOFF-LATEST.md`、生产运行模式或生产 WRITE。
- **分支核验（2026-10-14）：** #859 合并后 `agent/pa02-r09-http-chromium-recovery-20261014` 已由 GitHub 自动删除。历史 `docs/pa02-window-closure-research-handoff-20261014`、`fix/governance-review-closeout-20261014`、`fix/governance-runtime-readiness-20261014` 与 `main` 对比均 ahead=0，属于**可清理候选，尚未执行删除**；`release/bex01-dev-20261014` 虽 ahead=0，但有 BEX dev 发布用途，未获 release owner 清退确认，保留。BEX #846/#860 有未合入独有提交，保留。当前 GitHub 连接不提供删除 ref 的写操作，不把候选冒称已删除。

## 下一项最小真实 Gate

**剩余 3 个验收工作包（不是保证只需 3 个 PR）：** ① R04/R07/R08/R09 联合 `OWNER_SANDBOX` 真正 HTTP/Chromium/PG 同 Run WRITE、取消/缺口/重连后效果不重发；② R10 真实供应商 usage、获 Host 批准的版本化费率与每次计费前持久最坏情况预留/硬阻断，缺审批价表时只能 fail-closed 且保持 OPEN；③ 在实际最终 main 基线汇总原始 R01–R10 的代码、CI、负向、浏览器/SQL、限制并签收。以上任一项未证明不能宣称 DEV_COMPLETE，生产授权另议。**不提前引入 PA-03～PA-06。**

## 2026-10-14：Provider 实际回执真实性复核（R10，历史记录；#856/#857 已合并）

继 #856 后查出实际安装的 `providers/openai/runtime.ts` 和 `providers/deepseek/runtime.ts` **都将缺失的 `body.usage` 用 `?? 0` 伪造为零 token**。本次在两个 Provider 适配层将只有真正回报的非负整数 usage 转成 `LlmInferenceResponseV010.usage`；缺失、部分或错误的 usage 表示**未知**，可选 `input_tokens_details.cached_tokens` 严格校验并作为已回报缓存输入传递。模型实际报告 `0/0` 的合法情形仍保留，并与未报告区分。历史 OpenAI 直连 adapter 不是正式 Host 计量真相，无需重写它。

`tests/llm/provider.test.mjs` 和 `tests/llm/deepseek-provider.test.mjs` 新增正/反断言，使用各自既有 Provider CI 工作流。此次不强行指定 OpenAI/DeepSeek 的单价、不声称这个项目安装或当前绑定了哪个具体模型、也不将 Provider token 用量视作应付费用。**R10 硬货币预算保持 OPEN**，待最终 Head CI+PR 合并结果补记。


## 2026-10-14：R05/R06/R09 真实 HTTP + Chromium / PostgreSQL READ-only 联合 Gate

[新测试与严格边界](PA02-R09-HTTP-CHROMIUM-RECOVERY-20261014.md) 已在独立短分支提交，使用实际 App Host、真实 Eidos Workbench、PG18 Run/Outbox、浏览器刷新、真实 HTTP event cursor 与 scope 否决，测试模型为本机 Loopback Responses，不调用供应商或生产。**本段提交时 PR/CI 尚未 PASS**。即便 PASS，也只能补 R05/R06/R09 的 READ-only 浏览器/Run 部分，不得替代 Owner WRITE、取消后的效果不重发和最终签收。

**浏览器一手补证据（2026-10-14，#859 初版成功）：** [CI run 38543099401](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38543099401)，GitHub 实际 PG18 + HTTP App Host + Chromium Workbench，真实脚本日志 `PA02_REAL_CHROMIUM_R09={passed:5,total:5,realHTTP:true,realPG:true,productionUsed:false}`；五项分别为真实 Workbench → 持久 Run（含 usage）、Outbox 重读、缺口快照重置、刷新不二次推理、外来上下文 HTTP403。证据报告/截图在同一次 Actions Artifact。**明确限制：这是 READ-only 子门槛，不包含受治理业务 WRITE、不意味着 PA-02 全部 PASS。** 最终合入前仍核对当前 HEAD 全绿。


## 2026-10-14：#859 最终 HEAD 验收与分支收敛补记

- **真实代码/CI**：#859 提交头 `8600460c7f4faaa8ffa860e39712be3d27a17ce5`；合并 `5cab35eac649e43968be822c15f579f833596763`；最终 [R09 Chromium/PG HTTP run 38545777724](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38545777724)、[Project Continuity run 38545777639](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38545777639)、[Lightweight Host run 38545777611](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38545777611) 均 SUCCESS。浏览器场景五项：工作台发送+PG Run/usage、Outbox 重读去重、缺口快照、刷新不重发、跨 Context 拒绝。原始代码来自真正 Eidos、Host、PG18，推理仍为 loopback fixture，**不等于外部收费或 Owner WRITE 验收**。
- **合并门禁原因与处置**：初次提交在合并候选中被 required `continuity` 拒绝，随后证实 PR branch 相对 main 落后 3 commits；在原 PR branch 合并现有 main，重新通过必需 CI 后才由标准 GitHub merge 合入。未改写 main 或绕过保护。
- **下一项真实 WRITE 隔离前提**：`enterprise.context.create` 只创建 `enterprise:ent_...` 身份；`manager/agent-pa02-sandbox-object-extension.ts` 强制仅接受 `pa02-sandbox:*` Context/Enterprise，且要求**预建的独立业务 schema、已安装有效 Object Extension Capability、明确非生产确认和 Host 权限**。READ-only Chromium fixture 不能通过简单切换模式冒充 WRITE。必须构造专用隔离身份及 Authoritative SQL Owner，并保留已有负向授权检查；不可放松生产禁写以求测试绿。
- **状态分级**：#839–#848 已证实的局部逻辑不重做；#856/#857 usage 精度已合并；#859 READ-only 浏览器恢复合并。R10 硬费用预算、WRITE 真实联合恢复与最终 R01–R10 签收仍 OPEN。外站历史 14 条仍为 H（历史转引），本补记未阅读外站或改变等级。


## 2026-10-14：R09 governed SQL Owner 浏览器 WRITE 真实整链补证据（待最终 PR 合并）

- [PR #863](https://github.com/jiangxng/EVO-App-Platform/pull/863) 实现仅为 `tools/agent-line/pa02-owner-http-chromium-fixture.mjs`、`tests/agent-line/pa02_owner_http_chromium_recovery.py`、新增隔离 CI 与 [证据文档](PA02-R09-OWNER-CHROMIUM-RECOVERY-20261014.md)；没有改正式 Worker/Host/Eidos/业务 Owner，也没有将生产 WRITE 打开。
- 初版代码 HEAD `fe7343734cd8fe2c545438345ccce6c251d6a472` [Actions #38547645499](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38547645499)，真实 PostgreSQL18 + Chromium + 正式 Host + SQL Owner 6/6 PASS，截图/报告 [Artifact #11884923046](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38547645499/artifacts/11884923046)。相同 Run 的独立业务行、Owner Evidence、Agent Receipt 均为 1；重复 HTTP turn、Outbox、缺口回读和刷新不二次 WRITE，外来 Context 拒绝。
- 这项测试用 Host 显式允许的 `pa02-sandbox:*` 合成非生产企业和模型 loopback JSON；**未发生真实供应商计费**。实际没有模拟已提交后丢 ACK 与取消中失租的同时浏览器场景，故 R04/R07/R08/R09 联合最终门槛、R10 费用和完整 R01–R10 签收仍 OPEN。以最终 PR HEAD CI/merge 结果作阶段升级依据。


### #863 最新代码 HEAD 7/7 浏览器取消补证（2026-10-14）

[Actions 38548540580](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548540580)（HEAD `56a8ac3548f83e0e97fd51e8a414437cb9017276`）真实 PG18/HTTP Host/Chromium 7/7 PASS，[artifact 11885457660](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548540580/artifacts/11885457660)。新增场景证明：第二个 Run 模型即将给出业务工具调用时，正式 HTTP `run.cancel` 先记录请求，释放后按既有 PA02C 契约再次取消核验，最后 `CANCELLED`、无第二份 Owner 业务效果。初版 [Actions 38548226890](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548226890) 6/7 为测试误用 `REQUESTED` 后纯 `run.get` 轮询，修正流程而非放宽产品授权。**仍未模拟已提交 ACK 丢失与写入过程中取消**，R04/R07/R08/R09 联合 WRITE 全部签收和 R10 货币预算仍 OPEN。#863 以 PR 最终 HEAD CI 和 merged 状态为准。


### 2026-10-14：已提交业务效果后的断线与取消复合门禁（#865）

- [PR #863](https://github.com/jiangxng/EVO-App-Platform/pull/863) 最终合入 main `65d1d1fe97043a819d04b83d3eb3fb6b3c00252f`，最终 HEAD `0df7f94a7bab1f380c67ae6b9b6ad68a37d939c5` 对应真实 [Owner+Chromium 38548975998](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548975998) 7/7、[Continuity 38548975986](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548975986)、[Lightweight Host 38548976066](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548976066) 均 SUCCESS。已合并 Agent 源分支确实不再列出。
- #865 首版 HEAD `f6953f707e97b6d89b62090ed97dd5a73133cc2d` 的真实 [PG18 + Host + Chromium CI 38549519235](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549519235) **8/8 PASS**，[Artifact 11885399235](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549519235/artifacts/11885399235)。新增第三个 Run 先通过受治理 Owner 提交另一条 SQL 业务效果及 receipt，随后浏览器断线、模型最后回复仍等待，再经正式 HTTP Run 取消与恢复核验；Run `CANCELLED` **保留已经发生的业务 receipt**，SQL business/evidence/Run receipts 共各两笔、无重发。这批源代码未改生产 Host/Owner/Eidos。
- **限制**：这是模型后续回复未 ACK 到浏览器的断线；**不等于** SQL Owner 已 commit 而对 Host 失去业务 ACK 或 SQL 提交中的原子取消。后者由旧 #839/#842 局部分别证明，完整浏览器联合证明仍 OPEN；货币费用硬预算 R10 和 R01–R10 最终签收也 OPEN。#865 合并前必须再核对最终 HEAD CI。


## 2026-10-14：#865 最终 HEAD 及最新原始矩阵覆盖历史描述

- #859 main merge `5cab35eac649e43968be822c15f579f833596763`，READ-only HTTP/Chromium 5/5；#863 main merge `65d1d1fe97043a819d04b83d3eb3fb6b3c00252f`，真实受治理 Owner SQL 7/7；#865 main merge `996cb2de2e63a657438adfa12aba05044e70fed0`，已提交 Owner 后浏览器断线取消 8/8。上述 Agent 源分支均已确认自动删除。
- **#865 最终 HEAD** `48b8c122fbdc8087db6d91961802a11e99831706` 的 [Chromium/PG/Host run 38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829)、[Continuity 38549835903](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835903)、[Lightweight Host 38549835816](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835816) 均 SUCCESS；首版浏览器证据 [Artifact 11885399235](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549519235/artifacts/11885399235)。
- 原始十项详细证据分类：**[PA02-R01-R10-EVIDENCE-LEDGER-20261014.md](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)**。上方历史时间线有创建时 `#863/#865 待合并` 的文字，它是历史事实，不代表此刻还开放 PR。
- **仍有 2 类阶段级未关闭**：R10 实际货币费用硬限额（阻止 `DEV_COMPLETE`），以及 Owner→Host 提交后 ACK 真丢 + 浏览器 + 旧 Worker 失租是否作为最高保真联合验收（与已通过的各分层证明严格区分）。生产授权与正式迁移不包含在当前隔离开发签收。
