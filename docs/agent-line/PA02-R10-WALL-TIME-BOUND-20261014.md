# PA-02 R10 — 整 Run 逾时停止新增动作（2026-10-14）

**Class:** PA-02 R10 / RUN-05 incremental safety gate  
**Base:** `main@dbc6112a794fea401078e662c211670ff877a750`（#847 Eidos Outbox 接线已合入）。  
**Authority:** 原始 [总纲 §21 任务预算、§26.2 PA-02、§27 RUN-05](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)，不能以步骤上限代替时间/费用边界。

## 狭窄缺口与实现

#845 已为整个持久 Run 实施 24 slice 上限、R03 连续模型失败有界。此前没有**绝对时间截止**，多日后重新进入同一 Run 仍可能尝试新推理/新工具。此次在已有 fenced Worker 内加入基于 **Host 持久 `RUN_CREATED.createdAt`** 的整 Run `maxRunElapsedMs` 截止检查，默认开发安全口径 72 小时（可由 Worker 构造参数在隔离测试中覆盖；输入严格校验范围 1 分钟至 30 天）。不新增表、定时调度器或前端中断功能，也不把时间预算写进用户客户端数据。

一旦超时，原 Worker 在开始任何新模型调用前持久写入 `RUN_BLOCKED / PA02_RUN_TIME_BUDGET_EXHAUSTED` 并明确建议新建更窄请求。已经持久存在的待核验 Owner WRITE、原有决策与合法回执处理仍在检查前优先完成；不能以超时隐藏业务已提交的事实。已完成或已取消 Run 为终态不会复活；换 Worker/Host 进程或重新连接不能重置原 `createdAt`。

**验收：** 在既有 `pa02-r03-r10-durable-model-budget.test.mjs` 添加正式 `run.start / run.resume` + PG18 实验：人为通过可信 Host 提供旧创建时间 → 模型未调用直接 BLOCKED；Host 重启后同一 Run 仍 BLOCKED；新 Run 在允许时间内可正常推理成功。原 R03/R10 失败和循环测试、Owner WRITE/cancel tests 保留。只在当前 PA-02 可选 PG Worker 模式生效，不部署生产或改变通用 V010 Run。

**仍未闭合：** 按总纲 RUN-05，*费用预算*需要一个可验证的供应商模型 usage 记录和获批准的成本计价/硬预算策略。现有 `LlmInferenceResponseV010.usage` 尚未成为持久 Run 成本账本，不能凭“72h + 24步”声明已实现美元费用上限。此项与 PA-04 全输入上下文 token 预算、PA-06 企业配额运营不同，不得彼此替代。不要无根据地编造价格。

**CI evidence：** 最终以 PR head 的 Actions PostgreSQL 18 报告为准，不预先标注 PASS。
