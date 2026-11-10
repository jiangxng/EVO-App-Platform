# CV-03 N1-04f — Actor-scoped SQL READ + T0/T3 持久授权与恢复（隔离工程）

> 2026-11-10，独立实现分支 `fix/cv03-n104f-actor-read-atomic-outbox-20261110`，基线 `main@cf5d1bf0909d89aad4fdd559af9f54f02fbcab02`；[PR #1203](https://github.com/jiangxng/EVO-App-Platform/pull/1203)。
>
> **仅 isolated PostgreSQL 18 / 真实 PA05 Manager 在测试中决策，不是正式生产 PA05 可信 outbox。N1 = NOT_CERTIFIED；正式 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，Saved View SAVE 403、未注册 Page GET 404 均保持不变。**

## 1. 实际接续、范围与来源

承接已合入 [#1202](https://github.com/jiangxng/EVO-App-Platform/pull/1202) 的 N1-04e：Domain Owner SHA namespace 和 WRITE ActorType 分权均经 PG18 20/20 PASS。#1202 终态合并 `main@cf5d1bf0909d89aad4fdd559af9f54f02fbcab02`，不重写上一轮代码。

本次直接读取的**G / 原源码**：
- [`manager/store.ts`](../../../manager/store.ts) 的 `createMemoryLifecycleStore` 和 `createFileLifecycleStore`：内存 Map / 文件 `renameSync` 持久化，缺乏与独立 PG outbox 同库事务的能力。**事实**：File LifecycleStore 每一项变更独立落盘；**推论**：仅靠同步 `onLifecycleEvent` 回调无法证明授权持久提交、序号和 outbox 可靠原子性。
- [`manager/service.ts`](../../../manager/service.ts) 的 `createAppManagerService`、`disable` 和 `onLifecycleEvent`：真实 Manager 负责 Feature 生命周期，回调不是事务日志 API。
- [N1-04d Manager 授权探测](../../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs)：使用已安装的 Feature/Capability Operation + 真实 `checkCapabilityOperationActionV010` + 测试 AuthorizationProvider，ActorType 独立；`authorityEpoch` 是**夹具自定**，不是实际 PA05 事务号。
- [N1-04e scoped read](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs)、[N1-04c HMAC 事件桥](../../../tools/cv03-n104c-isolated-authority-event-bridge.mjs)：都只有独立 PG18 夹具证明，不代表真实 Host 公用连接池 / KMS。

本轮未重新打开 EX01–EX08 厂商网页，不提升旧来源阅读等级；沿用 [原始资料索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[11-10 详细决策索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)。

## 2. N1-04f A — SQL ActorType READ 隔离

原 `cv03_n1_read_scope` 只绑定 `session_user + contextId + ownerSubjectId + enterpriseId`；两个不同 Actor 如果误共用 SQL 登录，数据库无法证明 AI 与 Human 读授权独立。本轮**隔离候选**：

- 数据库唯一 READ Scope 增加 `actor_type`（仅 `HUMAN/AI`）、原 `collection.saved-view.personal.list` Operation、`authority_epoch`、`mirror_healthy`，并**强制**非空、未过期 `delivery_required` lease。缺 Actor、健康状态、epoch、lease 默认 DENY。
- `session_user` 一对一指向 **企业+主体+ActorType**；SQL 请求参数/JSON 不能伪装 Actor。真正生产池化连接身份尚未批准，不能使用同一个 Human SQL Credential 为 AI 提供 READ。
- Scope GET/LIST 返回的 Saved View 是**同一主体拥有的业务视图数据**，仅在 AI 具有**独立 READ 授权**时可读；历史 WRITE receipt 附加 `principalActorType=g.actor_type`，AI 即使合法 READ 也不能提取 Human 签署的 WRITE 回执。
- [PG18 scoped-read 回归](../../../tests/agent-line/cv03-n104b-tenant-read-isolation.test.mjs) 增加同主体独立 Human、AI 登录与另企业登录：未授权 AI 不能 GET/LIST/历史 receipt；独立授权 AI 后允许 GET/LIST，但不能取得 Human WRITE receipt；AI lease 过期失败关闭而 Human 不受影响；Human 撤权不传播到 AI；运行 SQL 账号直接 SELECT/UPDATE 表及 SET ROLE 伪装被拒。

**边界**：READ 的启用/租约仍由**测试 Owner/SQL role fixture**填入，不是与真实 PA05 READ 权威状态的持续、认证的事件同步；没有真实 SQL 连接池 Actor attestation。不能标为生产 READ ActorType 认证。

## 3. N1-04f B — 真实 Manager 的隔离 T0/T3 验证

[新 test-only SQL builder](../../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs) 和 [真实 PG18 测试](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs) 只在随机 `cv03_` schema 安装：

| 步骤 | 隔离验证内容 | 失效关闭断言 |
| --- | --- | --- |
| **T0 原子事务** | 真实 Manager + 测试 AuthorizationProvider 对已安装的 Saved View Operation 做 HUMAN/AI 授权评估；单条 `SECURITY DEFINER` SQL 函数在**同一个 PostgreSQL 事务**更新 test authority row 与不可变 test outbox row，独立 scope epoch 必须连续。 | 函数故意在 state 更新后、outbox INSERT 前抛异常，PG 自动回滚，两者均不出现孤儿更新。旧事件允许 exact-duplicate，epoch 复用不同内容拒绝。 |
| **T1 认证传送/ACK** | 仅从已提交 outbox 读原始 event，TEST_ONLY HMAC Signer 签名后经原 N1-04c DB Event Bridge 验签/序号应用；独立 Delivery SQL LOGIN 只有函数 EXECUTE 无 Owner 表 SELECT。 | 消费者漏 ACK 时，新 SQL 连接重读待确认行并重复投递，返回 `STALE_IGNORED` 且旧租约不续期。 |
| **T2 失联/撤权** | 故意遗漏撤权事件、令 DB lease 过期；之后可靠重新提交并传送 deny。企业切换旧 context 需显式 revoke、新企业默认 deny，Human/AI 独立；真实 `manager.disable` 后拒绝。 | 即使镜像上一版本 `enabled=true`，lease 过期/epoch gap 下不可当作授权。**注意**：事件尚未到达且旧 permit 未到期期间，无法证明即时撤权；这是生产准入阻塞项。 |
| **T3 有界快照** | 漏投中间 epoch，后续事件触发 gap latch；普通旧事件不得解锁。TEST_ONLY 完整 `SINGLE_ACTOR_OPERATION` 快照由可信测试 key HMAC 签名，在 PG 对照其同库权威 state 的 epoch/identity/generation/enable 值后，恢复该 Actor 的健康镜像。 | 无效 HMAC、部分 snapshot、旧 epoch、不匹配的企业/Actor、已撤权后的旧快照不得恢复 ALLOW；恢复不影响其他 Actor。 |

技术限制：仅**一个 Actor+Operation** 的完整快照；不等于真正企业范围角色/权限图完整性；生产 Snapshot 要有 source generation、global watermark、撤销 tombstone 和受控迁移签发审核。

## 4. 为什么还不是生产安全 Owner 通过

1. **重要反例**：测试 `cv03_n104f_test_authority_state` 的事务和 outbox 同库，是**示范性的持久事实源**；真正 Manager 的 `LifecycleStore` 仍内存/文件型，AuthorizationProvider 的批准/撤权亦在另一个权威源。二者没有与本测试 T0 共同事务。不能因此宣称 PA05 正式事件已经可靠接线。
2. DB Event Bridge 的 HMAC 只能证明试验签发人持有测试 key，**不能**单凭事件签名证明生产事件与已提交权威变更一致；测试 signer 从已提交 outbox 取消息，但尚无真实 signer 身份、key custody/rotation/KMS/权限所有者/跨 Host producer fencing。
3. `session_user` 读角色按 Actor 独立仅是隔离登录模式；正式 Host 若共用 pool 需要经过 Host 和 DB Owner 审核的可认证 Actor/Enterprise/Subject 传播方案，且失败关闭。READ scope policy 尚非 live PA05。
4. 失联期间过期 lease 会拒绝 READ/WRITE；在 lease 到期**之前**未知的撤权不可能由隔离 SQL 自行发现。90 秒测试租约、5 分钟 Host HMAC permit 为试验参数，非生产 SLA。
5. 生产 Primary、SQL ROLE/GRANT、密钥/迁移/备份/回滚、真正两 Host、Human/390px、外部 LLM 仍均 **OPEN**。

## 5. 治理与结果登记

- 代码只改 test-only SQL READ builder/测试、test-only transactional T0/T3 builder/测试、PG18 Workflow 与本专项文档/原来源索引；**不更改并行 PR #1184 的三份 owner 文件**。
- 新增实际 GH Actions 证明须以 **PR #1203 最终 HEAD** 的日志为准。未执行/未结束的 CI **不得在文档中写 PASS**。
- GitHub branch hygiene 在 PR 合并后使用现有 `retire-merged-pr-safe` 验证 main 祖先关系及精确 SHA，再清理本过程分支；不得独立手动“清空旧工作线”。
