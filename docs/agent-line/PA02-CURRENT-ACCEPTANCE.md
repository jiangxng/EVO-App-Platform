# PA-02 — R01–R10 当前验收与最终收口表

**Document class:** CURRENT_STATUS / LIVING_RUNBOOK
**Last reviewed:** 2026-10-14
**Authority:** [PA-00～PA-06 建设总纲 §25](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) 的原始 R01–R10；项目交付规范；[历史交接入口](PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md)。
**Current development line:** [#856](https://github.com/jiangxng/EVO-App-Platform/pull/856)（初始 CI Head `907568ed0533f7f07cee5352ff9b13aaf684967a` 的 18/18 workflows SUCCESS；文档更新后仍需复核**最终 Head**）。
**Production:** NOT AUTHORIZED / No production WRITE deployment. **PA-02 milestone:** IN_PROGRESS, NOT SIGNED.

每完成一个可验证交付闭环，**更新这张表，不使用倒数数字冒充进度**。状态必须区分局部 CI 通过、隔离真实整链通过、最终阶段签收；表格不得提前填 PASS。

| 验收项目 | 当前状态（有证据的范围） | 下一步／剩余验收 |
| --- | --- | --- |
| R01 双 Worker 领取 | **既有 PostgreSQL/lease 证据已通过**；PA-02A/B 历史 PR | 纳入最终同一基线证据账，重核恢复边界 |
| R02 旧 Worker 复活 | **既有 fencing 负向证据已通过** | 汇总旧租约失效与旧事务拒绝证明 |
| R03 模型失败 | **已验证** [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845) | 最终账登记连续 3 次封顶/负向场景 |
| R04 WRITE 响应丢失 | **隔离 Host + Owner 已验证** [#839](https://github.com/jiangxng/EVO-App-Platform/pull/839) | 与浏览器断线综合证明：已提交不二次发送 |
| R05 Outbox 重投 | **服务端 PG 与 Eidos 消费端分别已验证** [#844](https://github.com/jiangxng/EVO-App-Platform/pull/844) / [#847](https://github.com/jiangxng/EVO-App-Platform/pull/847) | 真实 HTTP/Chromium 同 Run 重复事件测试 |
| R06 事件缺口 | **服务端 PG 与 Eidos 消费端分别已验证** #844/#847 | 真实缺口 + 授权快照/回执联动验收 |
| R07 部分成功/失败 | **隔离 Owner/Run 已验证** [#842](https://github.com/jiangxng/EVO-App-Platform/pull/842) | 汇入浏览器恢复与最终证据账 |
| R08 运行中取消 | **隔离 PG 原子取消已验证** #842 | 浏览器取消及保留已提交效果 |
| R09 断流重连 | **真实 HTTP/Chromium + PG READ-only 子门槛 5/5 PASS**（[#859](https://github.com/jiangxng/EVO-App-Platform/pull/859) 初版完整证据 [run 38543099401](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38543099401)，仍待该 PR 最终 HEAD CI 及合并） | Material WRITE/Receipt 同 Run 断线恢复、取消/重复不重发仍 OPEN |
| R10 Run 步数 | **24 slice 持久边界已验证** #845 | 纳入最终证据账 |
| R10 Run 时间 | **72h 持久截止已验证** [#848](https://github.com/jiangxng/EVO-App-Platform/pull/848) | 纳入最终证据账 |
| R10 实际 usage | **#856 隔离 PG/Host 局部 CI 通过，尚待最终合并**；[原始用量、未知用量的回归证据](PA02-R10-USAGE-EVIDENCE-20261014.md) | 核实真实安装 Provider 供应商回执；不编造金额 |
| **R10 硬货币预算** | **OPEN / NOT IMPLEMENTED** | 审批计价版本与最坏情况预留、费用结算和崩溃保留，预算前置阻断的负向 CI |
| **真实 HTTP／Chromium 整链** | **OPEN** | 同 Run 断流/重连/重复/缺口/取消/跨 scope，隔离 Host + PG + Eidos 真实网络和浏览器 artifact |
| **R01–R10 最终签收** | **OPEN** | 完整原始矩阵：代码/CI/负向/真实环境/限制与准确 SHA |
| **PA-02 阶段** | **IN_PROGRESS / NOT_PRODUCTION_READY** | 全部原验收通过方可 DEV_COMPLETE；生产单独审批 |

## 最新完成与事实边界

- 本轮新完成的**局部测试**：[Agent PA-02 Async Read Worker, run 38540567510](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38540567510)，PG18 / `17 pass 0 fail`，日志实际出现 `PA02_R10_DURABLE_PROVIDER_USAGE`；同一准确 Head 的 18 项 workflow 全部 SUCCESS，包括原 PA-01B2 Chromium CI（**这不是 PA-02 整链浏览器证据**）。
- #856 代码把真实 `llm.inference` Provider 回来的 usage（如果提供）作为独立 Run 事件记录；没有 usage 的 mock 与 Provider 记 `UNAVAILABLE`，**不认为免费**。没有可靠供应商账单、价格审批或硬预算。
- 对照 [2026-10-14 原详细研究索引](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md) 中项目一手证据与 14 条历史外站 H 级转引；新增的实际外站查阅等级见 [R10 Usage 研究页](PA02-R10-USAGE-EVIDENCE-20261014.md)。
- **并行边界：** 用户 BEX #846 仍开放，#855 已合入；本线不覆盖 BEX/2D/插件治理，未修改 `project.status.json`、项目级 `HANDOFF-LATEST.md`、生产运行模式或生产 WRITE。
- **历史分支清理待核：** #853 过程 ref `docs/pa02-window-closure-research-handoff-20261014` 在本轮首次分支查询仍存在。#856 合并后的过程 ref 也须核实删除；受权限/保护限制无法安全删时要如实记录，不能称作完成清理。

## 下一项最小真实 Gate

先完成 #856 CI+merge+branch retirement，再从最新 main 开始 R10 **可硬阻断的真实货币费用预算**。如果当前 Provider 缺真实 usage、已批准价表或可担保的单次费用上界，则只实施可核实的 fail-closed 条件，R10 保持 OPEN，不能将 token 示例当成账单。随后使用隔离真实 App Host/PG + Chromium 跑 R05–R09 联合验收；最后按原始 R01–R10 做证据签收。**不提前引入 PA-03～PA-06。**

## 2026-10-14：Provider 实际回执真实性复核（R10，PR 待 CI）

继 #856 后查出实际安装的 `providers/openai/runtime.ts` 和 `providers/deepseek/runtime.ts` **都将缺失的 `body.usage` 用 `?? 0` 伪造为零 token**。本次在两个 Provider 适配层将只有真正回报的非负整数 usage 转成 `LlmInferenceResponseV010.usage`；缺失、部分或错误的 usage 表示**未知**，可选 `input_tokens_details.cached_tokens` 严格校验并作为已回报缓存输入传递。模型实际报告 `0/0` 的合法情形仍保留，并与未报告区分。历史 OpenAI 直连 adapter 不是正式 Host 计量真相，无需重写它。

`tests/llm/provider.test.mjs` 和 `tests/llm/deepseek-provider.test.mjs` 新增正/反断言，使用各自既有 Provider CI 工作流。此次不强行指定 OpenAI/DeepSeek 的单价、不声称这个项目安装或当前绑定了哪个具体模型、也不将 Provider token 用量视作应付费用。**R10 硬货币预算保持 OPEN**，待最终 Head CI+PR 合并结果补记。


## 2026-10-14：R05/R06/R09 真实 HTTP + Chromium / PostgreSQL READ-only 联合 Gate

[新测试与严格边界](PA02-R09-HTTP-CHROMIUM-RECOVERY-20261014.md) 已在独立短分支提交，使用实际 App Host、真实 Eidos Workbench、PG18 Run/Outbox、浏览器刷新、真实 HTTP event cursor 与 scope 否决，测试模型为本机 Loopback Responses，不调用供应商或生产。**本段提交时 PR/CI 尚未 PASS**。即便 PASS，也只能补 R05/R06/R09 的 READ-only 浏览器/Run 部分，不得替代 Owner WRITE、取消后的效果不重发和最终签收。

**浏览器一手补证据（2026-10-14，#859 初版成功）：** [CI run 38543099401](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38543099401)，GitHub 实际 PG18 + HTTP App Host + Chromium Workbench，真实脚本日志 `PA02_REAL_CHROMIUM_R09={passed:5,total:5,realHTTP:true,realPG:true,productionUsed:false}`；五项分别为真实 Workbench → 持久 Run（含 usage）、Outbox 重读、缺口快照重置、刷新不二次推理、外来上下文 HTTP403。证据报告/截图在同一次 Actions Artifact。**明确限制：这是 READ-only 子门槛，不包含受治理业务 WRITE、不意味着 PA-02 全部 PASS。** 最终合入前仍核对当前 HEAD 全绿。
