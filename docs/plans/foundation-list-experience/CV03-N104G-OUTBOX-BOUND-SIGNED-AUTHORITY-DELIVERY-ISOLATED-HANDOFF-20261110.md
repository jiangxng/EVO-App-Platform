# CV-03 / N1-04g — 强制持久 outbox 来源的签名授权事件投递（隔离证明）

> 2026-11-10，本轮从 `main@765aaf9344ac51a3c525533c16e61c104658ccb6` 接续。
> **ISOLATED ENGINEERING ONLY / Production N1=NOT_CERTIFIED。**
> 正式 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、Saved View SAVE 403、未注册 Page GET 404 保持不变。沿用现有 Eidos+Platform+Domain Owner+PA05；未创建新的权限或 List 框架。

## 一、为何继续 N1-04g（源码证据与精确缺口）

本轮直接读取 [N1-04c 签名事件桥](../../../tools/cv03-n104c-isolated-authority-event-bridge.mjs)、[N1-04f 事务 outbox](../../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs)、[N1-04f PG18 回归](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs)，并核对 `manager/store.ts`、`manager/service.ts`：

- 原 N1-04c `cv03_n104c_ingest_signed_event` 认证测试 HMAC、epoch 和 lease，但**没有 SQL 级条件要求事件存在于已提交的 T0 outbox**。N1-04f 测试 JavaScript 的 dispatcher 只从 outbox 读取，是可信调用约定，不能视为 SQL 物理边界。
- 真实 `LifecycleStore` 仍可能为内存/文件型；它与真实授权 Provider 状态未与 N1-04f 的 PG 测试授权状态形成同一权威持久事务。生产跨存储问题继续 OPEN，不因本补丁改变。
- 额外失效模式：已提交较早的 ALLOW epoch，在更新的 DENY 已持久但消息尚未送达时才抵达镜像，可能重新打开过时许可。仅做 HMAC 验签不能确认它仍是当前权威版本。

## 二、实现（独立随机 PG18 schema，不是生产迁移）

本轮新增 [`tools/cv03-n104g-isolated-outbox-bound-delivery.mjs`](../../../tools/cv03-n104g-isolated-outbox-bound-delivery.mjs)，定义一个受限的 `SECURITY DEFINER` `cv03_n104g_ingest_committed_authority`：

1. 对事件 domain、generation、context+enterprise、主体、HUMAN/AI、已有 Capability WRITE Operation 和 epoch 做严格校验。
2. **即使旧 epoch 已被新事件覆盖**，仍使用当前启用测试签名 key 的 HMAC 验证完整 envelope，错误/禁用 key 拒绝；不能把伪造旧事件当成可 ACK 结果。
3. 在同一 SQL 事务内，`FOR SHARE` 锁住已提交 test authority state 及精确 `(context,subject,actor,operation,epoch)` 的 test outbox 行；检查原始 `event_json::jsonb` 与签名 envelope 的 event 一致、企业及 generation 一致。并发权威 UPDATE 会被状态行锁序列化。
4. 对不存在的权威行或 outbox 行、不同授权事实/主体/Actor、未授权 epoch：DENY；对存在完整 outbox 但被新权威 epoch 覆盖的旧事件：`SUPERSEDED_NO_EFFECT`，**不得调用旧事件接收函数**、不得刷新镜像许可；对匹配最新权威 epoch+enabled 的事件，调用原 N1-04c 事件接收函数，保留原 HMAC、签名时效、DB event epoch gap latch 和 lease 保护。
5. 独立测试 Delivery SQL LOGIN **仅 GRANT 新函数 EXECUTE**，没有 raw N1-04c 接口权限，也没有读取/修改 Key、Policy、Authority/Outbox 表的权限。不会修改正式 SQL 登录或替换生产网关。

## 三、真实测试和失败关闭范围

复用 [N1-04f PG18 测试](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs)，仍由原 PA05 Manager + AuthorizationProvider 测试调用提供授权事实：

| 场景 | 期望 |
| --- | --- |
| 真实 Manager 判断 ALLOW 但尚未原子提交 T0 | 正确 HMAC 也必须 `UNCOMMITTED_AUTHORITY_DENIED` |
| 正确 HMAC、事件改成同 epoch 的另一授权结果 | `OUTBOX_OR_SCOPE_MISMATCH` |
| 同主体更改 HUMAN → AI，AI 未提交对应 outbox | 物理拒绝，不借用 Human |
| 无效 HMAC、已停用 key | 拒绝，连“旧事件无作用”状态都不能伪造 |
| 测试 Delivery SQL 角色直调旧 N1-04c | 权限拒绝 |
| 当前权威 revoke epoch 2 已提交，旧 epoch 1 ALLOW 迟到 | `SUPERSEDED_NO_EFFECT` 且不得恢复/延长过期许可 |
| 丢 ACK 的已提交最新事件重新投递 | 原 N1-04c `STALE_IGNORED`，不延长 lease |
| 已提交 epoch4 先于 epoch3 到达 | 原 DB gap latch 失败关闭，迟到 epoch3 不能清除 unhealthy；T3 签名快照按原 N1-04f 测试恢复 |
| Actor/企业切换、`manager.disable` | 仍验证原 Capability Operation 授权与独立镜像拒绝 |

本轮测试执行结果以 **PR 最终 HEAD 的 PG18 Actions** 为准，不以此文档断言 PASS。

## 四、边界 / 安全 Owner 必需资料

这道 SQL 闸门解决的是 **测试数据库中事件必须对应已提交的权威状态/outbox 事实**，不是现实生产 PA05 与 DB 的真实原子事务。正式准入仍需要签收：

- 确认 Manager/AuthorizationProvider 真正权威的持久数据库或事务事实源；N1-04f `test_authority_state` 不能替代它；缺失时不得启用 Save。
- 生产事件生成由认证、单调 epoch 的 authority producer 完成，多个 Host 同时写入要有 generation/fencing 和持久 tombstone；DB snapshot 全范围/Watermark 与密钥轮换要由安全 Owner 复核。
- SQL pooled READ/WRITE 身份与主机 Principal/ActorType 的可认证映射、真实 SQL GRANT/KMS、正式 schema migration/回滚、真实 Human/外部 LLM 证据，均未完成。
- 已知不能做到的保证：**权威撤权提交之后但尚未被 SQL mirror 获知，旧合法租约到期之前**，SQL 仍可能承认先前的许可。本次改动能阻止**迟到旧 ALLOW 被再次应用**，不能把失联同步自动变成强一致生产撤权。正式策略需安全 Owner 决定主动 fencing/读权威、租约 SLO 与 DB owner 可靠性设计。

## 五、来源等级和治理

本次只有**直接读取的仓库 G 来源**与基于代码失效路径的**设计 D 判断**，没有新访问厂商网页，不提升先前 EX01–EX08 阅读等级。历史 [N1-04f 交接](CV03-N104F-ACTOR-READ-TX-OUTBOX-SNAPSHOT-ISOLATED-HANDOFF-20261110.md) 仍有效。新发现和取舍增量记录到同一 [决策索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)。禁止覆盖 #1184 负责的三份文件，禁止直接 push main。只有 exact HEAD 全部 CI 成功才合并，合并后复用 `branch-hygiene.yml` 验证精确 SHA 再清理本过程分支。
