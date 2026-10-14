# PA-02C：真实 Host WRITE 取消时保留已提交业务效果（2026-10-14）

**Class:** PA02C / ORIGINAL R07-R08 ACCEPTANCE PROOF  
**Start:** `main@f7b722ed8121cab39b644a52d5904b2aee4c0f83`（#841 已通过）  
**Scope:** 仅 PA-02 原始 R07（部分成功后已发生效果可见）、R08（运行中取消且保留已发生效果）、R04（未知 WRITE 不盲重试）。不纳入 PA-03～PA-06。

## 缺口

已有 `PA-02C` 保证请求取消后，不再合法领取新 Worker；`PA-02B` 能独立核证数据库 Owner 的真实执行结果。但是在已经提交真实业务资源、且 Human 同时取消 Run 的交错下，旧 Worker 失去 fence，不能补记 `TOOL_OBSERVATION_RECORDED`。尽管 Owner/Agent Receipt 均为 `SUCCEEDED`，Run 最终可能只有 `RUN_CANCELLED` 而无 Receipt ID，导致用户看不见**取消前已经发生的效果**。

## 修复（沿用原有契约）

- `pa02c-atomic-run-cancel.ts` 在已有 cancel lease/UNKNOWN/pending-Receipt 门禁通过以后，对当前 Run 的已确认 Owner WRITE 查找持久映射与**独立 Owner verification 证据**、原始 `request_payload`、terminal Receipt、对应 durable model decision。验证来源/Scope/digest/terminal 一致后，仅对尚未观测的 decision 追加 `TOOL_OBSERVATION_RECORDED`，其 Receipt ID 与 `RUN_CANCELLED` 在一个数据库事务里同批写入、统一更新 Run revision 与 ordinal。未知 WRITE、缺少 Owner evidence/decision、跨 Context 均拒绝终态成功，不伪造完整 V010 receipt。
- `pa02b-owner-reconciliation.ts` 增加 exact-run 的已绑定 `INVOKING/UNKNOWN` effectId 查询（不提供任何 dispatch 能力）。
- `manager/agent-async-read-worker-runtime.ts` 在用户重试取消且明确得到 `PA02C_UNCONFIRMED_WRITE` 时，若有可信 Reconciler，则对已绑定 Owner UNKNOWN 执行原有 `markUnknown + reconcile`，**不调用 `Owner.invoke`**。若活动 Worker 尚未退出、Verifier 无法证明、Receipt 未终态，维持 `REQUESTED` 而非假取消；待合法核证可重试 commitSafe。
- 不改变原 `READ_ONLY`/`OWNER_SANDBOX` 准入，不部署真实生产，不迁移资源 Provider，也不修改其他插件的业务逻辑。

## 可复核验收

`tests/agent-line/pa02c-host-owner-cancel-visible.test.mjs` 通过正式 `enterprise-agent.run.start / run.cancel / run.get` Host handler、真实 Fenced Worker 与隔离 PostgreSQL18 Object Extension Owner：实际业务先提交、Owner ACK 被丢弃且 Worker 尚在处理中，Human 请求取消只能得到 `REQUESTED`。Worker 完成核证但无法恢复 fence 后，第二次取消在单事务记入成功 Receipt 与 RUN_CANCELLED；Run read、Host 重启后均显示 CANCELLED + 1 verified Receipt；相同取消重复请求不重复写入、不重新推理。旧 PA02C / Worker / Host READ 等回归均应通过。

**CI 证据：** 本文在初次创建时不预先声称通过；以准确 PR head 和 Actions 为准。

## 剩余 PA-02

R01–R10 总验收尚未完成；Outbox重复投递/序号缺口/部分成功展示应在后续 R05–R07 汇总验证。生产 WRITE/Provider 全量迁移/多插件认证不因此进入 PA-02。
