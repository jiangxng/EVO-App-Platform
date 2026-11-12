# CV-04 / 2026-11-12 — 隔离 PG 加密导出任务的主动 TTL 清理与审计

> **TEST-ONLY ACTIVE MAINTENANCE / NO PRODUCTION SCHEDULER / NO PUBLIC EXPORT**。连续完成 CV04 #07/07，继承 [#06 Host/Worker 物理 SQL 身份与租约](CV04-SQL-HOST-WORKER-LEASE-20261112.md)、[PG 加密存储](CV04-ENCRYPTED-POSTGRES-EXPORT-JOB-20261112.md)及[独立 PG 原子审计](CV04-PG-IMMUTABLE-EXPORT-AUDIT-20261112.md)。不修改另 PR #1184 的受管计划，CV03 N1 仍 NOT_CERTIFIED、SAVE OFF。

## 原始风险

原 Dictionary Owner 的状态/下载 API 能在用户访问时发现 TTL 已到，并通过 CAS 转成 `EXPIRED`，但**没有主动清理**。长期不再被用户查询的 READY 任务可能继续把 AES-GCM 加密的 CSV 存储在 PG JSONB；已经失去企业权限的用户也不应被要求重新授权才能让运维完成合法到期清理。这次不把准许删除所有用户资源的通用后台服务交给插件，而是用原 Scope/Owner/Encrypted Store 做受限纵切。

## 安全方案与实现

- [物理 Host SQL Due-ID 查询](../../../apps/business-dictionary/export-job-pg-sql-lease.ts) 增加 `cv04_export_due_jobs(contextId, limit)`，只允许独立受限 Host SQL LOGIN 调用，限定 `1..25` 条、企业 Context、`evo.dictionary.export-jobs` 资源、非 EXPIRED 且数据库时间到期。只返回不透明 `jobId/expiresAt`，不能通过 Worker LOGIN 调用，**既不解密业务资源、也不给该 SQL LOGIN 原始表 SELECT**。
- [主动清理服务](../../../apps/business-dictionary/export-job-pg-maintenance.ts) 要求显式可信的 Enterprise Context/Enterprise ID、经验证的加密 PG CAS Adapter 标记以及独立 Host SQL Due-ID + revoke 权限；仅 `NODE_ENV=test && isolatedTestOnly=true` 可构造，**无正式 Host/Agent/UI/cron/定时器**。每个到期资源再次解密核验 `contextId/enterpriseId/actor/expiry`，先 revoke 所有已签发/已领取的 Worker 许可，再通过原 Owner 资源的精确 Revision CAS 转 `EXPIRED`。
- 将原 `pages/csv/csvSha256` 移除，原任务主体、幂等键、非私密状态/行数等必要治理元数据保留；追加唯一 `EXPIRED` Audit Event，**与独立 PostgreSQL 审计表在同一 CAS SQL 事务内提交**。更新 Actor 明确为 `cv04.export-maintenance`，不谎称原 Human 用户主动删除。原加密 Adapter 仅在隔离环境且 `expectedRevision` 非空并已 EXPIRED 时接受该系统 Actor，不能由其创建新任务或代替用户下载。
- 最多 25 条/次、最多三次 CAS 冲突重试。并发两个任务只允许一方写 EXPIRED，另一方重新读取后跳过；若 Host revoke 失败、明文/异常存储、企业 scope 不符、到期未到或 PG audit/CAS 失败，**拒绝改变 Resource**。该服务返回数字计数，不回传明文数据或身份。
- 业务 KEY 的 Tombstone 仍保留原 idempotency identity，不能通过重复 key 复活旧 CSV；独立审计仍保留元数据和证据，不能删除原历史。此处只有**逻辑红action + 重加密空 payload**，并非数据库物理 secure erase / 全备份清理保证；真实 retention/KMS 删除和审计生命周期仍需审批。

## 真实可验收矩阵

[GitHub Actions 专项 PG16](../../../.github/workflows/cv04-export-pg-active-expiry.yml) 运行 [隔离源级测试](../../../tests/agent-line/cv04-export-pg-active-expiry-maintenance.test.mjs)，并复跑此前 SQL 物理 Host/Worker 租约 4 项、加密 PG 5 项、独立审计 5 项、Dictionary Owner 8 项。

1. 造一个**已到期 READY（含 CSV 明文只存在解密后）**与一个已到期 QUEUED，另一个未到期 QUEUED 不应碰。Host SQL due() 应只列前两个。物理 Worker SQL 无法执行 due() 或 raw resource SELECT。注入模拟崩溃遗留租约元数据后清理须将它 REVOKED。
2. 真正的加密 PG CAS 清除 READY CSV/所有排队 Snapshot 行并记录系统 Actor，独立审计对每个到期任务恰有一条 `EXPIRED`；未来任务仍可执行，已经清理的任务不可下载；第二次主动巡检没有待清任务。
3. 两个独立 PG 连接同时清一个到期任务，`EXPIRED` 写入/独立 audit 事件恰一次，不因重复清理丢失审计或复活数据。
4. 如果 Host SQL revoke 失败、被传入不同企业 Scope、Due-ID 枚举返回重复/非法 Job ID、未使用真实加密 PG Adapter 或尝试非测试启用，必须 fail closed；测试确保数据仍在原任务内且审计没有伪造过期成功。
5. 原始 14 项实际 PG 和 8 项 Owner 合同不回退；无新正式 `dictionary.collection.export.job.request` Host Operation、CV03 SAVE OFF。

## 尚不能用于生产的理由

- 有**定界工作函数**，**没有**后台调度器部署、KMS 轮换/实际擦除或独立保留策略；仅测试显式调用清理服务。只记录数据在逻辑上由新密文替换，Postgres WAL/备份/快照中旧密文仍可能存在。
- 上阶段的 physical SQL Host 签发凭证，**并未被认证为 PA05 多物理 Host/正式 Auth Provider 签名**；Owner 的业务写 CAS 仍使用隔离管理员连接，未绑定 SQL Epoch，不能宣称恶意或失联 Worker 被物理 SQL 制止再次写入。不能用此测试替代生产安全审查。
- 真正对用户开放前需要受管 SQL Host→Owner signed admission、多进程/网络分区/停机验收、实机手机/浏览器/真正 Google OIDC Human & Personal Agent 双主体授权与撤权证据、生产数据保留政策和多角色密钥轮换。保留 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，N1 NOT_CERTIFIED。

资料索引：2026-11-12 直接读取本仓库中的原 Owner、PG AES-GCM CAS、PG audit trigger、独立 Host/Worker SQL Permit 与实际 GitHub Actions 日志；无新外部网页。专项/主线合并状态必须以实际提交 SHA 与 Actions 原始日志补证，不能假称已投产。
