# PA-02 R03 / R10 — 持久模型失败重试与整 Run 步数上限（2026-10-14）

**Scope:** 按最初 [Personal Agent 建设总纲](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) 只修复 R03 和 R10 的已证实缺口；不把完整市场费用体系、PA-03/04、生产切换或插件认证纳入本批。基线 `main@126f5ef730458999e14b51a15d388938bf769a3b`（R05/R06 #844 已合入）。

## 发现与修复

- 既有 PG Fenced Worker 一旦模型供应商抛错便 `RUN_FAILED`，并没有原 R03 要求的**有限重试**。本轮在现有 Run 事件契约中增加 `MODEL_INFERENCE_FAILED`（含确切错误/尝试编号）；原 reducer 从不可变事件中计算 `modelFailureCount`，模型一次成功决策立即归零。最多 **3 次连续失败**，前两次仅返回持久 PAUSED 待另一个 Worker 或相同 Run 的继续，第三次 `RUN_FAILED / PA02_MODEL_RETRY_EXHAUSTED`，保留之前已确认的业务效果，绝不伪造完成。
- 现有 Host `for i<24` 只限制一次 HTTP action 的推进次数；重新连接/反复 `run.resume` 会继续新建切片，因而不能算原 R10 的**整 Run 循环限制**。本轮 Worker 以 persisted `sliceCount` 对一个 Run 设置上限 **24 slices**。已记账的待办模型决策、待核验 Owner WRITE 先完成安全检查，不因步数限制隐去已经发生的效果；超额前阻止再开始模型或工具，使用终态 `RUN_BLOCKED / PA02_RUN_SLICE_BUDGET_EXHAUSTED` 给出更窄请求建议。重启和新 HTTP action 都无法清除界限。
- 这两个限制都在现有 Host/Run store/Fenced Worker 内实现，无新数据库表、无新的异常任务队列；之前 R04/R05/R06/R07/R08 的事件回执逻辑继续沿用。

## 正式验收

`tests/agent-line/pa02-r03-r10-durable-model-budget.test.mjs` 在 PostgreSQL18 下由真实 `enterprise-agent.run.start/resume` Host Handler 调用：先模拟模型连续失败两次后成功并形成真实最终消息，再模拟三次失败终态，没有任意成功/Receipt；数据库中可追查三次失败事件且重复 Host turn 不会重复推理；反复选择 READ 而不结束的 Run，24 个持久切片后必须 BLOCKED，不执行第 25 次模型/工具，重新连接仍为同一终态。既有 Worker/Owner/Host tests 继续跑。

**严格验收边界：** R03 模型失败次数限制及 R10 跨请求/进程的步数限制是本批验收范围。R10 所述**时间预算、货币费用预算**仍需查证正式 Host 是否能得到可靠计量；本批不能声称 R10 整体通过。R05/R06 现有服务端 Outbox 路径已经通过隔离 CI，但浏览器消费者恢复与终态展示仍需最终签收，不能以本文替代。PA-02 必须完成原 R01–R10，不向后续阶段推包。

**CI evidence：** 以实际 PR head Actions 运行结果登记，本文创建时不预设 PASS。
