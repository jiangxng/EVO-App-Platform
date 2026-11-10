# CV-03 / N1-04l — 真实 PA05 读取新鲜度 + N1 最终交接（2026-11-10）

> 接续准确主线：`main@e53c27d4f04665c20ffdec1cac571fa60c5997a6`（N1-04k / PR #1208 已合并）。
> **结论：N1 / Production Saved View WRITE = NOT_CERTIFIED**。不部署、不改 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 POST SAVE 403 和未注册 Page GET 404，不修改并行 PR #1184 受管文件。参考 [生产集成决策与可执行验收](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)。

## 1. 真实源码检查（G 原始事实；D 推论分开）

- [`manager/store.ts`](../../../manager/store.ts) N1-04k 的文件 mutation 已使用协作写锁、独占 staging 和 `dev+inode+raw JSON` 比对、旧写者 quarantine。但是当另一进程**已经提交撤销**时，旧 Store 的 `getInstalledPackage`、`getActiveFeature`、`snapshot` 在 N1-04l 之前仅检查 `quarantined` 布尔值。如果旧实例只读不写，它不会知道文件已更新，就可能把缓存的旧 Feature ALLOW 呈给真实 Manager。
- [`manager/service.ts`](../../../manager/service.ts) `listEffectiveCapabilityOperations()` 和 `getSnapshot()` 调用 `store.snapshot()`，因此以上缺口影响真实 Capability Operation 读取，不只人工调用 Store API。
- [`manager/server.ts`](../../../manager/server.ts) 真实 Host 在 `APP_PLATFORM_STATE_FILE` 路径下构造该 FileLifecycleStore；有 N1-04j 的 Saved View opt-in 恢复拒绝，但 N1-04j 仅检查**启动时**状态，不能保证存活 Host 的后续读取永远新鲜。
- 文件生命周期仍经 [`manager/service.ts`](../../../manager/service.ts) 做 mutation 后发布 `onLifecycleEvent`，正式 [`manager/server.ts`](../../../manager/server.ts) 以进程内 `pluginEvents.publish`/有限长度实时事件队列转发；无与真实 AuthorizationProvider/PG outbox 的共同原子事务。[运行时 SQL 角色审计](../../../tools/cv03-n1-postgres-role-audit.mjs) 仍返回 `NOT_CERTIFIED` 并保留数据库签名闸门缺失 blocker。
- 上述为本轮直接读取的仓库源码 G；本轮未新增外部 EX01–EX08 文献，不将独立 SQL 模拟或内存事件视为正式权威证据。

## 2. N1-04l 工程实施与真正验收

直接更新 [`manager/store.ts`](../../../manager/store.ts)，保持现有 LifecycleStore 公共 API 和 JSON 文件格式不变：

1. 在 **每一次** `getInstalledPackage`、`getActiveFeature`、`snapshot` 之前读取本地写锁状态和实际生命周期文件 `dev+inode+raw JSON`。不使用间隔 TTL 或时间戳推断可信新鲜度。
2. 如果 `*.lifecycle-write.lock` 存在，包括正常写者瞬时持锁、Crash 孤儿目录、被放置的符号链接，拒绝本次读取（`LIFECYCLE_STATE_READ_LOCKED_RETRY`）。不把临时锁当成“旧数据依然合法”的许可；正常锁释放且磁盘版本未变化时原 Store 可继续读取。锁路径权限/IO 不确定，亦拒绝（`LIFECYCLE_STATE_READ_LOCK_UNCERTAIN`）。
3. 比对与初始或本实例最后一次**已确认持久提交**的精确版本；若内容、inode、文件是否存在改变，立即把旧 Store 标记为 quarantine（`LIFECYCLE_STATE_STALE_READER_REOPEN_REQUIRED`），后续所有读取都拒绝 `LIFECYCLE_STATE_REOPEN_REQUIRED`。**必须重新创建真正 Store/Manager、完成其准入才能恢复**，不自动加载另一进程刚写的内容。
4. 文件读取/JSON 校验失败也 quarantine（`LIFECYCLE_STATE_READ_UNAVAILABLE_REOPEN_REQUIRED`），不在磁盘未知时返回缓存旧 ALLOW。恢复原文件字节不能解除旧实例隔离。
5. 保留 N1-04k 的持锁写入版本比对，不能通过读取绕开已经存在的写者 fencing。读取检查前后都查看本地写锁，减少读取中写者启动的窗口。此为**同一受控本地文件路径的 read-time freshness**，不声明在没有真正共享事务的多 Host/PG 之间线性一致。

### 真实可执行回归

- [N1-04l 专项测试](../../../tests/agent-line/cv03-n104l-pa05-authority-read-freshness.test.mjs) 用**不同的真实 Node 进程**通过 FileLifecycleStore 撤销 Feature，父进程**不尝试写入，直接** `getActiveFeature` 读取旧缓存时必须失败关闭、整个旧实例隔离，新 Store 重开为 DENY。
- 同一专项用例使用实际 `createAppManagerService` + 真实 `personalSavedViewsOptInFeatureV010` + `listEffectiveCapabilityOperations`；另一个进程删除该 Feature，旧 Manager 不得再列出之前的 `collection.saved-view.personal.save` WRITE Operation，新 Manager 重启后也不得可用。
- 写锁被占用时全部 read 拒绝，锁释放且未变更时恢复读；非协作进程同 inode/等长度内容修改会被原始 JSON 比对发现；删除或损坏状态文件不得回退到旧 ALLOW；即使重新写回相同字节，已 quarantine 的旧 Store 仍必须重开。
- [N1-04i 文件故障回归](../../../tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs) 和 [N1-04k writer/符号链接回归](../../../tests/agent-line/cv03-n104k-pa05-file-writer-fencing.test.mjs) 增量调整为“锁存在时读取本来应拒绝，释放后证实数据未改变”，防止新保护与旧测试误判冲突。
- 原 N1-04f/04h PG18 Authority T0/Outbox/T3、N1-04i 真实 PA05 持久化重启和 N1-04j 正式 Host subprocess 被纳入同一 PostgreSQL18 工作流回归。最终统计必须只引用**PR 最新 HEAD 的 Actions 日志**，不能提前写 PASS。

## 3. 已完成修复 vs 仍未认证（零推断）

| 能力 | 目前来源 | 可宣布的范围 |
| --- | --- | --- |
| N1-04e～h Actor SQL 作用域、签名事件、测试原子 outbox、producer fence、T3 | 随机 PG18 测试 schema + Manager fixture | **ISOLATED TEST ONLY**；不是生产授权权威 |
| N1-04i 文件持久化候选先写后发布 | 真实 PA05 `manager/store.ts` | 同实例单次文件故障原子性 |
| N1-04j 未认证可选 Saved View Feature 冷启动隔离 | 真实 `manager/server.ts` + 子进程 | 该 Host 的预启动失败关闭；无法撤销远端 SQL 许可 |
| N1-04k 协作写者锁、过期写者隔离、文件 stage | 真实 `manager/store.ts` | 同路径协作本地文件写入；非强制跨容器/DB 锁 |
| **N1-04l** 读取前版本确认、过期读者隔离 | 真实 `manager/store.ts` + Manager Action Capability | 同文件生命周期读新鲜度；不保证 PG 及时收到撤权 |
| 生产权威状态与 Event Outbox ACID、Producer/KMS、SQL pooled actor identity、全量快照、多 Host | **未有生产认证** | **NOT_CERTIFIED / WRITE 继续关闭** |

## 4. 仍属生产 Owner 决策的关键风险

- 已退出或重启的文件型 Manager 给出 DENY，**不会自动**对仍未接收到撤权的远端 SQL Mirror 发送可信 fencing；旧租约仍可能保留直到到期（已在 N1-04i PG18 隔离试验证明）。
- 同路径文件的 read-time 版本核验无法与并发其他进程的提交构成跨节点全局快照；更无法把某个主体/企业的 AuthorizationProvider 检查原子化到独立 DB outbox。文件版本不能被当成多租户企业权限 epoch。
- 正式 Host 的 `onLifecycleEvent` 仍在状态变更后才触发，不是可靠重启恢复协议；生产逻辑不能直接用 N1-04f/04h 隔离测试表替换 PA05 正式权威。
- 面向正式上线，必须先由 PA05 Owner + Authorization/DB Security Owner 选择并签收 [N1 生产授权集成决策](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)，完成可信 SQL 与实时恢复、Human/个人代理验收。没有这一签收不得改变正式 SAVE MODE/路由。

## 5. 接续治理

- 独立 PR / 分支，禁止直接 push main；不改并行 #1184 的三份 Owner 文档。
- 保留上轮 [N1-04k 交接](CV03-N104K-REAL-PA05-COOPERATING-FILE-WRITER-FENCE-20261110.md)，本文件是新增的独立工程里程碑，不覆写历史 PR 状态。
- 源码引用与 N1-04l 结论只基于 G 现场代码；研究索引第 13 节新增本轮 G/D 区分。通过 exact HEAD PostgreSQL18、Platform、Host、Continuity、Human UI Gate 后方可合并 main，并由仓库现有 Branch Hygiene Actions SHA 核对后清理过程分支；未部署、未实际 Human 签收。
