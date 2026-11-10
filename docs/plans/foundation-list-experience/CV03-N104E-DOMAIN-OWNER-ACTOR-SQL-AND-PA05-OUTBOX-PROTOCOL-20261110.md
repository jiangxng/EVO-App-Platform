# CV-03 / N1-04e — Domain Owner namespace、ActorType SQL mirror 与 PA05 可靠授权事件协议

> 2026-11-10；**ISOLATED ENGINEERING ONLY / N1 PRODUCTION ADMISSION = NOT_CERTIFIED**。
> 正式 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、Save 403、未注册页面 GET 404 均保持不变。本文件不替代 [CV-00～07 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)，也不覆盖并行 #1184 所管文档。

## 1. N1-04e 可复验的工程改动

1. **Domain Owner 地址一致性**：以现有 `providers/enterprise-context/personal-saved-views.ts` `address()` 为事实权威，其 namespace 必须为 `evo.saved-view.personal.` + `SHA256(UTF8(JSON.stringify([enterpriseId,subjectId])))`。隔离 PostgreSQL 使用 `tools/cv03-n104e-domain-owner-namespace.mjs` 中的纯 SQL 函数，对两个 JSON text 标量逐个序列化并精确拼接 `[`/`,`/`]`，避免 PostgreSQL `json_build_array(...)::text` 的空格影响哈希。SQL WRITE 以 **signed receipt 的 enterpriseId + principalSubjectId** 重算，而不是接受客户端传入任意 namespace。Scoped GET/LIST/历史 Receipt 使用该函数与可信读身份的 enterpriseId+ownerSubjectId 一起检查；不放宽授权范围。
2. **ActorType 物理隔离**：`cv03_n1_operation_policy` 的键改为 `context_id + principal_subject_id + actor_type + operation_id`，只允许 `HUMAN` 或 `AI`；SQL 写入时用经 HMAC 验签的 Host Receipt `principalActorType` 查找本 actor 行，缺行默认拒绝；历史 receipt replay 也绑定 actorType。签名 PA05-shaped 测试事件必须显式带 `evaluatedActorType`，校验后仅更新该 actor 的 epoch/lease/健康状态；不会继承同主体另一 actor 的 ALLOW。
3. **测试持久 outbox 独立键**：现有 N1-04d fixture outbox 添加 `actor_type`，队列去重、查询、ACK 只按完整主体+actor+operation+epoch；AI/Human 同一 epoch 不能相互覆盖。仍是 **TEST_ONLY**，不能声称 PA05 Lifecycle 与 PostgreSQL 原子提交。
4. **正反向覆盖**：既有 `cv03-n1-signed-sql-gateway.test.mjs`、`cv03-n104b-tenant-read-isolation.test.mjs`、`cv03-n104c-authenticated-authority-event.test.mjs`、`cv03-n104d-pa05-real-manager-authority.test.mjs` 改用 Domain Owner 哈希地址。N1-04b 真实调用原 `createPersonalSavedViewActionHandlersV010` 的 READ 处理器取得 `address()` 生成地址，再与真实 PG18 SQL 函数比较；不同企业/主体/JSON 特殊字符组合和跨 scope GET/LIST/历史 receipt 设负例。N1-04c 验证 Human 放行不自动放行 AI、独立 AI 授权、AI 撤权后 Human 仍可写、非法 actor 事件拒绝；N1-04d 验证真实 Manager 决策的 AI DENY 不影响 Human ALLOW 与丢 ACK 回放。

以上是隔离 SQL DDL 构造器、Source/Tests，不是正式数据库迁移。[PR #1202](https://github.com/jiangxng/EVO-App-Platform/pull/1202) 早期 HEAD `fc95e8684854c54c85e66977fac49f9a8a16ef83` 的 [PG18 Actions #42754171632](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42754171632) 已有真实 **20/20 PASS、0 FAIL、0 SKIPPED**；这是**早期 HEAD** 的证据。此后又补签名地址负例与双向 Human/AI 独立 epoch 测试；**最终合并必须以最终 HEAD 的 CI 重新验收**。

## 2. 真实 PA05 生命周期与授权 Outbox：拟定一致性协议（P1，仍待 Owner 定案）

**不选择**“`manager.onLifecycleEvent` 同步回调 + 后台异步发送 DB permit”作为权威事件源：Manager 回调不是与真实业务授权状态同库同事务持久化的记录。失联可能漏发撤权，甚至 ACK 成功无法证明授权权威存储已持久。

建议接口先最小化，在 **Platform/Authorization Owner** 决定持久事务事实源后实施：

- **权威事务 T0**：在能够提交 Feature/Principal 授权事实的权威持久事务中，同时提交不可变 outbox 记录；字段包含 `authoritySourceId`、`generation`、`contextId`、`enterpriseId`、`principalSubjectId`、`actorType`、`operationId`、`authorityEpoch`、`enabled`、`effectiveAt`、`eventId`、`schemaVersion`。若权威事实与 outbox 不可能在同一物理事务，则 **必须先明确跨存储失败关闭协议，并经安全 Owner 签核**，不能把测试 outbox 直接升级为生产。
- **签发与投递 T1**：独立可信 signer 仅签发已持久提交的 outbox；DB 验证签名/key 状态/完整身份元组及连续序号。单 Key 轮换及 signer 身份凭证属于 DB/安全 Owner，测试 HMAC 常量不得进入正式配置。重复投递返回 `STALE_IGNORED`，不得刷新旧 permit 租约；只有 DB 事务成功后才能 ACK，ACK 丢失允许重试。
- **时序与失联 T2**：数据库按每个 `(source,generation,context,subject,actor,operation)` 的 epoch 连续检查；缺号或异常切换 `mirror_healthy=false` 且不得由普通事件直接恢复。过期 lease 一律 READ/WRITE 拒绝；切企业的旧 Scope 撤权不得依赖新企业 ALLOW 被推断。停用插件意味着已有 Operation 失效，旧签名请求仍须拒绝。90 秒候选租约不是生产 SLA。
- **恢复 T3**：可信、完整、版本化 snapshot 经权限 Owner 发出 `generation + watermark + policy rows`，DB 在一个受管事务中核对 signer、覆盖范围、epoch 和 tombstones，完成后才可清除 unhealthy latch；部分 snapshot、无效签名或跨企业 scope 不得开锁。多实例 Host 在恢复前读写均失败关闭。
- **消费方界限**：Human/AI 均须由原 Capability Operation 与 AuthorizationProvider 决定授权，Domain Owner 持业务事实，Host 不旁路 SQL Gateway；DB policy 是授权结果的受信缓存/物理闸门，绝非新建一个 Platform 权限中心。

**额外未解决的 ActorType READ 限制**：本轮 N1-04e 的 `cv03_n1_operation_policy` 是 WRITE Operation 物理镜像；N1-04b 的 `cv03_n1_read_scope` 仍以 `session_user` 单 SQL 登录绑定企业与主体，**没有可认证的 Human/AI ActorType 读授权维度**。原隔离测试的两个 SQL 登录不等于正式 Host 的多主体连接池。正式 AI READ 同样不得借用 Human 的 SQL 角色，应由 DB/Host Owner 在 N1 生产准入前提供独立的可信 ActorType 身份传播/授权协议与反例；本轮不得扩大为已认证 READ。

## 3. 安全准入与未取得的证据

| 关口 | 当前实际状态 | 继续需要的证据 |
| --- | --- | --- |
| Domain Owner namespace ↔ SQL WRITE/GET/LIST/receipt | 本 PR 代码与 CI 待验证 | 当前 HEAD PG18 真实 PASS + 反例 |
| Human/AI 同主体分权 | 本 PR 代码与 CI 待验证 | 当前 HEAD PG18 真实 PASS + 角色撤权竞态 |
| PA05 测试签名事件/丢 ACK 重放 | 承接 N1-04d 隔离 fixture，更新 actor key | 真实持久事实源 T0、Signer/事件规范与多 Host 恢复 |
| 生产 SQL 身份/Schema/GRANT/KMS/迁移 | **NOT_CERTIFIED** | 正式 Primary Owner、授权 SQL LOGIN/连接池身份、最小权限、密钥保管轮换、备份回滚、双 Host 与恢复 |
| 正式 Saved View Feature、Human UI、外部 LLM | **OFF / OPEN** | N1 正式授权后依 CV-00～07 原计划阶段化验收 |

## 4. 来源与本轮来源等级

- **G / 2026-11-10 已读仓库原文**：[原 Domain Owner](../../../providers/enterprise-context/personal-saved-views.ts) `address()`、[原 Signed SQL Gateway](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs)、[原 SQL scoped read](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs)、[原测试签名事件桥](../../../tools/cv03-n104c-isolated-authority-event-bridge.mjs)、[PA05 Manager 测试集成](../../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs)；上述相互不兼容点来自源码比较。
- **G / 历史 CI**：[N1-04d #1200](https://github.com/jiangxng/EVO-App-Platform/pull/1200) 的 PG18 20/20 只证明**当时旧测试模式**；不是 N1-04e 结果。
- **D / 本轮工程推导**：T0～T3 是拟议生产协议，针对“无事务 outbox 无法保证撤权事件不丢失”的一致性风险而设计；**不是**已上线事实，也不是新的第三方研究。沿用 2026-11-06 [原资料索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 和 11-10 [详细决策索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)，本轮没有重新访问竞品网页，无新 EX 来源。
