# PA-02 — R01–R10 当前验收与最终收口表

**Document class:** CURRENT_STATUS / LIVING_RUNBOOK
**Last reviewed:** 2026-10-14
**Authority:** [PA-00～PA-06 建设总纲 §25](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) 的原始 R01–R10；项目交付规范；[历史交接入口](PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md)。
**Current verified main at #872 start:** `f09709adcb1b9817516d8d3c2479845c5900f22b`（[#870](https://github.com/jiangxng/EVO-App-Platform/pull/870) 与并行插件治理 [#871](https://github.com/jiangxng/EVO-App-Platform/pull/871) 均已合并）。本窗口只接续 PA-02 的 R10 请求真实上界验收，不修改并行 BEX/插件治理。**原始十项证据总账：** [PA02-R01-R10-EVIDENCE-LEDGER-20261014.md](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)。最新状态以本表新增补记、实际 GitHub HEAD 和 PR CI 为准，旧段落保留其历史意义。
**Production:** NOT AUTHORIZED / No production WRITE deployment. **PA-02 milestone:** IN_PROGRESS, NOT SIGNED.

每完成一个可验证交付闭环，**更新这张表，不使用倒数数字冒充进度**。状态必须区分局部 CI 通过、隔离真实整链通过、最终阶段签收；表格不得提前填 PASS。

| 验收项目 | 当前状态（有证据的范围） | 下一步／剩余验收 |
| --- | --- | --- |
| R01 双 Worker 领取 | **隔离 PG18 竞争已验证** #799/#800 | 独立证据已纳入原始总账；生产多节点 RPO/RTO 不是本轮证明 |
| R02 旧 Worker 复活 | **旧 fence/租约拒绝已验证** #800/#842 | 旧 Worker 拒绝不能代替外部业务回滚 |
| R03 模型失败 | **已验证** [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845) | 最终账登记连续 3 次封顶/负向场景 |
| R04 WRITE 响应丢失 | **#839/#842 独立 Owner 核验 + #868 同 Chromium/HTTP/PG Run 9/9 通过并合并** | #868 使用严格隔离的业务 ACK 丢失注入，不等于公网 TCP 断路或生产 Owner |
| R05 Outbox 重投 | **PG/Eidos/READ/真实 governed Owner WRITE 分层已验** #844/#847/#859/#863/#865 | 重复事件/请求不二次业务 WRITE，见总账 |
| R06 事件缺口 | **PG/Eidos/真实 HTTP 缺口及取消后 Receipt 快照均验收** #844/#847/#859/#865 | 异常游标读权威快照，不新建 Run |
| R07 部分成功/失败 | **提交后中断，Chromium 恢复保留已发生的 Owner Receipt 验证** #842/#865 | 不代表 SQL 内部部分成功可撤销 |
| R08 运行中取消 | **#842/#863/#865 已验证；#868 浏览器在 SQL commit 后、业务 ACK 未回到 Host 时取消，同 Run 保留已提交 Receipt 的初版 CI PASS** | 生产跨进程故障与真实 Owner 网络断路未验收 |
| R09 断流重连 | **#859 READ 5/5、#863 WRITE 7/7、#865 commit+断线 8/8、#868 Owner post-commit ACK 丢失/取消 9/9 均已合并** ([最终 #868 CI 38551397649](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397649)) | 正式生产环境与跨地域故障不属于 PA-02 隔离门禁 |
| R10 Run 步数 | **24 slice 持久边界已验证** #845 | 纳入最终证据账 |
| R10 Run 时间 | **72h 持久截止已验证** [#848](https://github.com/jiangxng/EVO-App-Platform/pull/848) | 纳入最终证据账 |
| R10 实际 usage | **#856/#857 已合并**：真实 Provider 所回报用量持久记录，缺失用量明确标记 `UNAVAILABLE`、不伪零；[实施证据](PA02-R10-USAGE-EVIDENCE-20261014.md) | 仍缺绑定的供应商真实计费/审批费率；不能由 token 数自动推定货币费用 |
| **R10 硬货币预算** | **OPEN**；#869 原子持久费用预留已 merged；#870 合成费率下真实 Host 调用前限制已 merged；本轮补**完整模型请求的可信输入计费上界 quote**（PR/CI 尚待证） | 仍缺真实供应商/绑定模型的官方及合同界限、Host 审批价表版本、真正 Provider quote 与收费核对；缺一时 fail closed |
| **真实 HTTP／Chromium 整链** | **#859/#863/#865/#868 已完成隔离真实 HTTP+Chromium+PostgreSQL 的分层与 ACK 丢失复合验收** | 生产多节点、高延迟真实远程业务网络不在本次准入范围 |
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

## 2026-10-14：#868 SQL commit 后 Host 丢失 Owner ACK，浏览器取消同 Run 复合补证

- [PR #868](https://github.com/jiangxng/EVO-App-Platform/pull/868) **首版代码 HEAD** `9cf8c2f180d112f0468678eba61902f64be0fa9f`：[真实 Chromium / Host / SQL Owner / PG18 工作流 38550940285](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38550940285) **9/9 PASS**，相关 [Platform 38550940149](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38550940149)、[Continuity 38550940191](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38550940191)、[Lightweight Host 38550940231](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38550940231) 均 SUCCESS。原始报告与浏览器截图 [Artifact 11886517409](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38550940285/artifacts/11886517409)，详细测试边界见 [专项证据](PA02-R04-OWNER-ACK-LOSS-CHROMIUM-20261014.md)。当前 branch 已安全对齐 #867 合入后的 main，但**最终 HEAD 文档更改和 PR 合并未预先算作已通过**。
- 这是测试专属 `NODE_ENV=test`、`OWNER_SANDBOX`、`pa02-sandbox:*` 和隔离 PG schema 下的**真实业务 SQL commit，受控包装器在返回 Host 前丢弃 ACK**。浏览器在窗口中断原 HTTP，请求正式 `run.cancel`，原 Owner Verifier 确认实际提交，终态 `CANCELLED` 保留唯一 Receipt，重复/缺口不重发。**非真实公网 TCP 错误、非生产签收**。
- 仍然唯一阶段阻断：**R10 实际货币费用计量/已批准费率/前置原子最坏费用保留和超限硬拒绝**。原始 R01–R10 证据总账此前 #867 已建立；本批完成后应更新该总账，才能做全阶段最终签收。


## 2026-10-14：#868 准确合并与 #869 R10 预留原语门禁（阶段未签收）

- [#868](https://github.com/jiangxng/EVO-App-Platform/pull/868) 合并 `d72c14856e391a7e6a077c93af57df5f8eae8b9a`，最终 HEAD `9d0f6d6e1bb7c743e6da6d502c40ab8a71e71f4c` [真实 Chromium/PG owner CI 38551397649](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397649)、[Platform 38551397809](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397809)、[Continuity 38551397781](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397781)、[Lightweight Host 38551397607](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397607) 均 SUCCESS；9/9 浏览器案例含真实 SQL commit 后 Host 测试包装器丢 ACK、Chromium reload/取消、唯一业务 Receipt 恢复。Agent 源分支已自动删除。
- [#869](https://github.com/jiangxng/EVO-App-Platform/pull/869) **仅实现 R10 金额预留数据库原语**：测试用的是显式 `ISOLATED_SYNTHETIC_TEST_ONLY` 的虚构费用和可信 token 边界，不能代表真正已安装模型的开票行为。首轮 [真实 PG18 Agent Worker CI 38552517889](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38552517889) 3 个新费用案例全部 PASS：同 Run 原子最坏费用预留、跨 Host 并发防双扣、旧 HELD/UNKNOWN 跨重启不释放、缺用量不当作免费、预算耗尽阻断、未经验证的费率/版本变更拒绝。最终 HEAD 全部 CI/合并仍须复核。详见 [R10 专项](PA02-R10-MONETARY-RESERVATION-PROOF-20261014.md)。
- **没有生产/真实 Provider 的价格审批、计费上界证据；也尚未把这层预算真正接到 Host `provider.infer` 之前。** R10 / PA-02 `NOT_SIGNED` 保持不变。历史外站 14 条仍是 H 转引，未读原文不能升级。

## 2026-10-14：#869 合并与 #870 实际 Host Run 预扣费联测（R10 仍 OPEN）

- [#869](https://github.com/jiangxng/EVO-App-Platform/pull/869) 最终 head `ea650242960fb6a0f44b700344a3c7660e0861c5` 的 **14/14 工作流 SUCCESS**，合并 `bfb3d35883c6f0d112048a359803b2fd492081ff`；过程 Agent branch 已在合并后自动删除。真实 [PG18 Worker Actions 38552895612](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38552895612) 的新预留/并发/未知/负向价格测试通过。所有货币费率都是合成数据。
- 当前 [#870](https://github.com/jiangxng/EVO-App-Platform/pull/870) **初版代码 HEAD `4138ef7dc4d6380bf9fea9bd0bb4d15bf99013cf`**，真实 [Host Run + PostgreSQL18 CI 38553690645](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38553690645) 23 pass / 0 fail，且此准确 Head 的 **18/18 GitHub Actions 全绿**。原始日志 `PA02_R10_HOST_MONEY_PREFLIGHT`（额度不足阻止第二推理/Host 重启不旁路）、`PA02_R10_HOST_UNKNOWN_CHARGE`（缺 usage / 模型调用异常可能已计费，原 Run 阻断并保留最大额）、`PA02_R10_HOST_TARIFF_IDENTITY_DENIED`（Provider/model 不符则不调用）。此 Head **不是文档更新后的最终 Head**；不得提前宣布 #870 merged。详见 [专项记录](PA02-R10-HOST-COST-PREFLIGHT-20261014.md)。
- 这只通过可信测试依赖在现有 Run/Worker 注入**合成费率**。普通 `manager/server.ts` **没有装载生产价表，也没有启用对真实收费 Provider 的金额硬限额**。尚无供应商真实价格审核/计费上限或账单回执；R10/PA-02 均 `NOT_SIGNED`，不因 CI 全绿声称已完成。历史外站 14 个 H 级引文不升级。


## 2026-10-15：#870 合并与 R10 完整请求计费上界修正（等待本轮 CI）

- [#870](https://github.com/jiangxng/EVO-App-Platform/pull/870) 最终 Head `9491009c8671fb9d747a41c7ced383671436867f` **18/18 CI SUCCESS**，main merge `f5c90d21981fb2f5876e27a7940493d77fe4608f`，过程 Agent 分支已确认删除。核心 [Host PG18 Worker run 38554138771](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38554138771) 继续证明预算不足则无法发第二次合成 Provider 请求。随后并行治理 [#871](https://github.com/jiangxng/EVO-App-Platform/pull/871) 合并使最新接续基线为 `f09709adcb1b9817516d8d3c2479845c5900f22b`，本轮 branch 取自这一确切 HEAD。
- **新增发现**：此前费用预留依据 `maxBillableInputTokens` 静态策略，而非真正 model request（包含 system/developer/user/history/tool schema/observations）已得到输入计费上界证明。为避免实际可计费输入增长突破保留额，本轮测试专属 Host 需在完成请求组装后、付费 `provider.infer` 前，取得绑定完整请求的可信输入上界。无法取得/超限时立即 `RUN_BLOCKED`，不发请求、亦不虚构已占费用。[专项证据与外站阅读等级](PA02-R10-ACTUAL-REQUEST-INPUT-QUOTE-20261015.md)已记录；**未收到本轮最终 CI 前不得填 PASS**。
- 真实报价/真实 Provider quote/生产授权并未取得；不以合成测试、GitHub CI 绿冒充 R10 `DEV_COMPLETE`。生产 WRITE 未打开，旧 14 条 H 级外站转引保持 H。
