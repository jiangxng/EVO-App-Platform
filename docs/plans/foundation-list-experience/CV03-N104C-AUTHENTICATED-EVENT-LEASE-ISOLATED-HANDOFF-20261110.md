# CV-03 / N1-04c — 授权事件签名、投递身份隔离及超时封闭（2026-11-10）

> **交付级别：ISOLATED_PG18_SECURITY_PROOF。正式 PA05/Host 授权事件源、SQL Principal、生产 KMS、迁移和密钥轮换 = NOT_CERTIFIED。**
> 生产 **Saved View WRITE=OFF**、未注册保存页面 GET 404、保存命令 POST 403 均保持原状。
> 基线 `main@9c5617e01700a067d4acfb8ce28752ad767a21a6`；继续复用 [N1-04b 的 tenant-scoped read 和 authority epoch](CV03-N104B-TENANT-SCOPED-SQL-READ-AUTHORITY-EPOCH-20261110.md)、[N1-04a 的短效 Host receipt](CV03-N104-SQL-PERMIT-REVOCATION-ISOLATED-GATE-20261110.md)，不引入另一套 Framework。

## 核验中的真正缺口

N1-04b 已证明乱序事件不能重新放权，却只能让测试 DBA 手动更新镜像；真实 PA05 停用 Feature/撤权/切企业可能**没有事件送达**数据库。只依赖 epoch 无法感知一个从未到达的 revoke；一次旧 ENABLE 可无限期让 DB 继续授权。本轮补了**测试环境内的签名事件入口 + 短租约到期关闭**，降低这种隔离模型的持续失效窗口；**不能直接视为已接入 PA05 实时授权**。

## 代码与物理权限

| 层 | 新的隔离机制 | 负向验收 |
| --- | --- | --- |
| [事件 Bridge SQL builder](../../../tools/cv03-n104c-isolated-authority-event-bridge.mjs) | 新建独立 `cv03_n104c_event_keys`；`cv03_n104c_ingest_signed_event(text,text)` 是受控 `SECURITY DEFINER`，DB 端使用 `pgcrypto` **独立**验证 domain-separated HMAC-SHA256、keyId、事件 source、企业/主体/Operation/epoch/issuedAt；仅有认证交付 SQL 登录获 EXECUTE，无法读取密钥或授权表 | 无签名、改签名、跨企业篡改、伪 source、未知/停用密钥、超时或未来事件全部拒绝；普通写入 SQL 登录不可执行 Bridge |
| 数据库镜像更新 | 只通过现有 `cv03_n1_apply_owner_policy_epoch` 应用已认证的合成事件；保留 epoch+1、旧事件忽略和乱序缺口后永久 unhealthy；`delivery_required=true` 且 `lease_until` 以**数据库时钟**给最多 90 秒许可，禁止客户端自带未来 expiresAt 任意延长 | 旧 ENABLE 不能推翻 revoke，事件跳号后不能重开；事件签名 key 停用后，即使用旧 token 也不再承认 |
| [原隔离 SQL signed WRITE](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs) | 如果镜像显式 `delivery_required=true`，则 `lease_until` 到期/缺失即拒绝写入，且仍须 `enabled && mirror_healthy`，持有授权行锁，保证落库操作原子性 | 签名仍有效时如果 event 断链、lease 到期，必须拒绝保存；旧 N1-01～04b 的测试 fixture 默认不启用测试租约，保持历史隔离兼容 |
| [原隔离 SQL read gateway](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs) | 增加显式 read scope `delivery_required/lease_until`，三个受限 `GET/LIST/receipt` SQL 函数都检查数据库时钟租约；SQL LOGIN 仍只可调用白名单函数，不能读裸表 | 即使 `enabled=true`，租约到期 GET/LIST/Receipt 都是零结果；B 企业不受 A 企业失联影响 |
| [真实 PG18 授权投递测试](../../../tests/agent-line/cv03-n104c-authenticated-authority-event.test.mjs) 和 [原两租户读取测试](../../../tests/agent-line/cv03-n104b-tenant-read-isolation.test.mjs) | 用**独立的 NOLOGIN owner / 认证事件交付 LOGIN / runtime LOGIN** 建立隔离 schema；合成 Human 与 Personal Agent 写入分别使用原 Host HMAC receipt 格式；按 epoch 验证拒绝、恢复、签名 key 变更、断链过期和乱序后永久停用 | 运行时不能直接修改/查看 event 密钥、授权镜像、事件 Function；不能用旧请求放权；PG18 workflow 应全测试且 0 skip |

## 安全边界的准确解释

- 签名 **event** 与签名 **saved-view Host receipt** 是两套不同 domain 和数据库验证密钥。上述事件签发程序名字显式包含 `TestEventProof`；其签名只是**合成 PA05-shaped offline fixture**，不是实际 PA05 Capability/AuthorizationProvider 的私钥或签发人，绝不允许把测试 key 导入生产。
- `PA05_OWNER_TEST_ONLY` 是**唯一允许的模拟来源标签**。SQL 验签解决“知道一个测试交付秘密且持有效凭证”的认证问题，**并不解决真实 PA05 生命周期权威认定、用户换企业、Capability Operation 停用后的事件可靠传输**。生产需要 Host Owner 对实际审计事件做带来源认证的投递、顺序、事件重放策略及补快照机制。
- 90 秒是**隔离安全实验的候选上限**，不是产品 SLA。事件延迟和 `clock_timestamp()` 到期可以被检测，但**不能保证撤权事件到达前的立即拒绝**；过期闭锁只约束最长陈旧窗口，必须由 PA05 + DB 安全 Owner 为正式一致性目标签收。
- 当前 read scope 仍是按 **PostgreSQL session_user 与固定 tenant/subject 的一对一测试映射**。正式 Host 使用连接池服务账号时，不能用此测试绑定多人会话；需独立设计 verified principal→安全 SQL 身份或 RLS/tenant-bound scoped read 的授权证明。
- **生产迁移/正式 Host 不可执行这些试验 Builder**：没有安装真实 Feature，没有更改 `manager/server.ts`、KMS、Railway、生产数据库/Schema/GRANT/DDL/密钥；和并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) owner 文档不冲突。

## 下一工程与最终独立签收

N1-04d 需要联合 Host/PA05 与 DB Owner 先确定真正的统一权限权威：真实 Capability Operation + AuthorizationProvider 的变更审计、用户撤权/切企业/插件停用事件的持久 outbox、可认证签发人、授权 epoch 顺序、Event→SQL delivery ACK、断链关闭、异常恢复时由可信 authority 全量 snapshot reset，并对 Human 与 Agent 两种 caller 验收。正式 DB Owner 负责角色 GRANT、tenant-safe read 模型、Migration/回滚、两真实 Host primary 路由、KMS/密钥轮换及灾备签收。未签收前 **N1=NOT_CERTIFIED；严禁推进 N2 正式保存页或 WRITE**。

**CI 验收门禁：** 最终准确 PR HEAD 的 PostgreSQL 18 测试无 skip，日志必须有 `CV03_N104C_SIGNED_AUTHORITY_DELIVERY_LEASE=PASS` 与 `CV03_N104C_HUMAN_AI_REVOKE_REPLAY_AND_EVENT_GAP=PASS`，原 N1-01～04b 全绿；其余 Project Continuity、Lightweight Host、Human UI / Provider plugin checks 全通过后合并 main 并清理过程分支。测试绿不能替代上述正式物理授权。
