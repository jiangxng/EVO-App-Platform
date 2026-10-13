# PA-02B — 多进程 Fencing 与持久写入意图隔离实验（2026-10-13）

Document class: AGENT_LINE_INCREMENTAL_PROOF
Status: ISOLATED_CI_PASS_MERGED_MAIN / NOT_HOST_WIRED / NOT_PRODUCTION

## 继承的权威和边界

读取2026-10-13交接入口、来源索引、决策缺口及[PA-02A进程恢复阶段记录](PA02A-CROSS-PROCESS-RECOVERY-20261013.md)；以最新main中的 `manager/server.ts`、`run-runtime.ts`、`run-action-handlers.ts`、`agent-run-store.ts` 和V020契约为依据。正式Host仍绑定同步Run/Receipt V010，不因隔离证明成功即替换。

## 本PR只增加实验性可靠性原语

- 在隔离PostgreSQL 18 schema内，写入数据库时间控制的执行lease、严格递增fencing token和scope隔离的写入意图。
- `claimLease` 同Run的两个或更多独立客户端只一个可持有有效租约；过期后新Worker可获得递增fence；旧Worker不许renew、start、complete WRITE。
- 外部WRITE只能在**已提交**的 `PREPARED` 意图后，持有效fence转成 `INVOKING`。**INVOKING后即使Worker掉线/lease过期，也不允许接管者再次beginWrite**。
- 未得知业务结果时，`markUnknown`只将INVOKING隔离到 `UNKNOWN`；真实业务owner的结果核验和凭证仍是独立门禁，不靠LLM、SQL状态或超时猜测成功。
- 独立数据库连接、24个租约并发争用、fence过期、不同企业读隔离、跨连接恢复、同输入幂等、异输入拒绝和不可重复终态通过专用PostgreSQL CI验证（需在最终PR head复核）。
- 不在正式Host接线，没有运行任何外部业务WRITE、生产数据库或者线上部署。代码是实验性 `createPostgresAgentExecutionCoordinatorV020`，不能直接作为可用的企业生产调度器。

## 后续必须补齐

1. PA-02A正式Host异步Repository迁移、旧Run历史状态/Conversation同源视图的兼容策略、真实权限scope、feature flag和无停机回滚；不能将不同原语混作成熟Host集成。
2. 多节点Worker的实际任务认领（run state + fence 同事务）和真正owner Tool端的幂等/重放保护；仅数据库 lease 不阻止一个失联Worker在外部系统完成原先发出的请求。
3. 单独取得owner判定结果的确定性回执、outbox dispatch/重试确认、长时间任务恢复、实际多企业权限/负载/RPO/RTO。
4. PA-02C设计并实现取消请求、已发出WRITE的未知状态隔离、Worker安全停机确认与终态原子转换；不抢在任意在途执行之前冒称CANCELLED。

## 外部资料阅读状态

旧S1-S14仍为H级历史链接；本阶段没有据未阅读原文改变架构。上述设计来自内部源码验证和失败模型推演。后续若改变fencing或持久调度方案须记录新证据和理由。

## CI证据签收

在CI完成后，以最终PR精确head的GitHub Actions job日志为准；本文件的独立能力状态不随合并自动升级为正式Host/PA-02B生产完成。

## 合并后验收凭证

[#800](https://github.com/jiangxng/EVO-App-Platform/pull/800)经准确head `4e4147b8716e945ece07f93f92bd81d0c2f140d7` 的 [PostgreSQL CI 38347246849](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38347246849) SUCCESS；merge `92faf7ec69e0ae1de82288dec92fa5c622c91609`，短分支已删除。首次全Host浏览器allow job在mock模型调用观察中失败，同head复跑成功；不可抹去失败日志，也不是PA02B业务Host生产门禁。
