# PA-02 R10 — 模型调用前 PostgreSQL 费用预留接线（2026-10-14）

**Class:** DELIVERY_EVIDENCE / FIRST_HEAD_CI_VERIFIED / R10_STILL_OPEN  
**Baseline:** `main@bfb3d35883c6f0d112048a359803b2fd492081ff`，前置 [#869 PG 预留原语](PA02-R10-MONETARY-RESERVATION-PROOF-20261014.md)。原始范围保持 [建设总纲 §25 R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)。

## 范围及接线事实

- 不新建执行器：继续使用正式 `createPostgresHostAsyncReadExecutionV030` → `createReadOnlyFencedAgentWorkerV030` → `LlmInferenceProvider.infer`。仅由**可信 Host 内部依赖**可注入 `testOnlyCostPolicy`，把 #869 同一个 PG18 账绑定到原 Run 的 Host scope 和 slice。
- Worker 实际在新 slice 的 `SLICE_STARTED` 和 Provider inference **之前**调用数据库 `reserve`。若批准 Provider/model 不匹配、额度不足、同 slice 已预留、跨重启旧 HELD/UNKNOWN，持久 `RUN_BLOCKED`，不会发送计费请求、不会发业务工具。发送前的保留不会被新进程或重复请求重置。
- 该测试通路将 Host 候选配置的 `maxBillableOutputTokens` 作为 `maxOutputTokens` 传给原 Provider。返回真实 `LlmInferenceResponse.usage` 后，先持久记录 Provider reported usage，再保守结算 PG 占额，才能写 `MODEL_DECISION_RECORDED` 与发送后续工具。Provider 未报告 usage／越过批准界限，持续占额并标记 `RUN_BLOCKED`；抛异常可能已计费，持有 UNKNOWN、禁用盲重试。
- **极重要的安全边界：** 目前 `manager/server.ts` 的正式生产 Host **没有构造任何 `testOnlyCostPolicy`**，未把合成价格接到真实供应商。直接构建预算证明的 API 还额外禁止 `NODE_ENV=production` 注入。普通 Host 未开启预算时沿用原行为，故 R10 不能宣布已完成或有任何生产费用上限。
- 真实收费模式仍需 Host 主体明确批准且独立验证 Provider/model 身份、区域/计费等级、币种与不可变费率版本、缓存与长上下文策略、每次实际可收费输入/输出 tokens 上界和 Provider 是否遵守输出限制。以上缺一不得发布预算模式；不能拿官网样例/模型自己的估算代替审核。

## 隔离负向验收

`tests/agent-line/pa02-r10-host-cost-preflight.test.mjs` 接入现有 Agent Worker GitHub Actions (PG18)：真实 Host Run 的第一次模型请求费用预留、真实 Provider 模拟用量后结算，第二步不足额被**调用前阻断**；不同 Host 恢复后不增加 Provider 次数；缺 usage 与 Provider 异常均保留 UNKNOWN 金额、不自动三次收费重试；非法 Provider/model 身份在调用前拒绝。测试金额全部来自 `SYNTHETIC_PA02_TEST_ONLY`，**不是供应商真实回执和实际货币账单**。

首次提交尚未有 CI 结果，必须读取最终 HEAD Workflows／PG18 job 日志才能提升测试状态；未签收的 R10 与最终 PA-02 仍 OPEN。PA-03～PA-06、生产部署、生产 WRITE 均不在本 PR。历史 14 条外站 H 等级保持不变。


## 2026-10-14：首轮实际 PR Head CI 一手证据（最终 HEAD 待复核）

- 初版准确 HEAD `4138ef7dc4d6380bf9fea9bd0bb4d15bf99013cf`，GitHub [Agent PA-02 Async Read Worker #38553690645](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38553690645) job `115817477369` 真实 PostgreSQL18、**23 pass / 0 fail**，含新增的 `PA02_R10_HOST_MONEY_PREFLIGHT`、`PA02_R10_HOST_UNKNOWN_CHARGE`、`PA02_R10_HOST_TARIFF_IDENTITY_DENIED`。同一 HEAD GitHub **18/18 工作流 SUCCESS**，包含原有 Host、Owner、取消与 PA01B2 Chromium 回归。
- 第一种真实 Host Run：模型第 1 次调用先经 PG 事务保留 140（**合成**微币），返回 25/5 token 后保守结算 35；第 2 次候选上限预留 140 会超过仅余 135，Host 将 Run `BLOCKED`，Provider 总共调用一次，重启也不能增加。第二种：缺 usage 与 Provider 传输异常不会成为免费请求，均保留金额占额进入 `BLOCKED`，不进行自动有偿重试。第三种：Host 的候选 Provider/model 与实际模型不匹配，在 `provider.infer` 前拒绝，总调用次数零。
- **真实性边界**：这些是已编译真实 Host Run + PostgreSQL18 + **注入的本地模拟 Provider**，不是生产 `manager/server.ts` 已批准货币预算，不是供应商已计费 API 与合同价格。后续任何文档提交、main 更新产生新 PR HEAD，都必须检查新的完整 CI 才能合并；本文件不提前宣布 #870 merged。
