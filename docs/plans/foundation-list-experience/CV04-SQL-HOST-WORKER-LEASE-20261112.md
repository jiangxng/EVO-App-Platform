# CV-04 / 2026-11-12 — 隔离 PostgreSQL Host/Worker 物理身份和一次性租约

> **TEST-ONLY SQL LEASE FENCE / NOT A PRODUCTION SIGNED HOST EXPORT ROUTE.** 接续 [独立 `dictionary.export` Capability](CV04-DICTIONARY-EXPORT-HOST-CAPABILITY-20261112.md)、[PG 加密 CAS](CV04-ENCRYPTED-POSTGRES-EXPORT-JOB-20261112.md) 与 [PG 原子审计](CV04-PG-IMMUTABLE-EXPORT-AUDIT-20261112.md)。不修改 CV-03 N1 生产准入、PA05 身份账本或正在另 PR #1184 管理的文档。

## 目标与约束

当前未注册的 Dictionary Export Owner 已完成行/字段/企业权限、持久快照、TTL 与 PG CAS。**已有 Worker 运行仍使用隔离试验中的 privileged Owner SQL 连接**，并未证明跨物理 SQL 身份的任务领取许可，也没有 Host-issued 真实签名。直接把 CV-03 `SQL_GATEWAY_ISOLATED_V010` 和 PA05 Object Extension 许可当作 EXPORT 授权会造成错误权限继承，因此不可这样做。

本阶段只为该现有任务增加可复用的**独立 SQL Host/Worker 租约边界**：

- [物理 SQL 权限与租约实现](../../../apps/business-dictionary/export-job-pg-sql-lease.ts) 仅允许 `cv03_*` 隔离测试 Schema、`NODE_ENV=test && isolatedTestOnly=true` 显式安装，不在任何正式 Host 或 Eidos 注册。
- 准备阶段先审计两个不同 SQL LOGIN：均必须非 superuser、非 schema/table owner，无 DB DDL 或 Resources SELECT/INSERT/UPDATE 权限，且互不继承角色。分别仅授予对应 SQL SECURITY DEFINER 函数的 EXECUTE；函数内部还校验实际 `SESSION_USER`，不依赖可被 Worker 伪造的自定义 GUC、Action body 或 JS Boolean。
- 可信 **Host SQL 身份** 才能调用 `cv04_export_issue_lease`：输入真实企业 scope、User/Actor、预期业务 Job Revision、Host 审批 ID；PG 再对已经持久的加密业务 Job 的身份、所属企业、状态、过期时间和 revision 进行一致性校验。批准成功由 PG 产生随机不可猜 token（一次性 128-bit，短期过期），permit 表只保存 token hash，不保存明文。
- 独立 **Worker SQL 身份** 只能调用 `cv04_export_claim_lease(token)`，单事务锁定 permit，重查最新资源 revision/scope，依靠唯一任务行做有界 `epoch=1→2` 租约，拒绝并发重复领取、主动租约未到期抢占、重放、错角色/未签发 Token、过期审批、任务过期或资源已变更。调用 `cv04_export_complete_lease(token,epoch)` 需要相同 Fence、未失效租约以及**原 Dictionary Owner 真正把任务 CAS 更新为 READY** 才承认完成。
- Host 可调用 `cv04_export_revoke_lease` 撤销 outstanding permit 和正在运行的 lease；旧 Worker 不得继续提交完成状态。另有最小化的 Host 元数据状态查询，Worker 不能 SELECT 原始 encrypted Job、audit、permit、lease 表。
- 数据、CSV、审计的源权威仍是现有 Dictionary Owner + PostgreSQL CAS / AES-GCM / append-only audit。该新 lease 是**外部调度授权检查**，不是对业务资源写入的 SQL signed permit，也不是在真实生产调度器中接线的签名证明。可以在同一个隔离测试里先 Host.issue → Worker.claim → Owner.run → Worker.complete 验证，但这**并不**使 Owner.run 的 SQL DML 带有 epoch Fence。

## 验收矩阵

[真实 PG16 协议脚本](../../../tests/agent-line/cv04-export-host-worker-sql-lease.test.mjs) 要求：

1. 不同物理 Host、Worker SQL LOGIN 严格无基础表 SELECT/DML；Host 无权 Worker.claim，Worker 无权 Host.issue；Host 原生发出的 opaque Permit 可领取一次，重放失败；Worker.complete 必须等待 Owner READY。
2. 两 Worker 使用不同 Permit 并发抢同一个任务，唯有一个领取成功；模拟旧 Worker 离线到期后可重新领取，Epoch=2，旧 Token/Epoch 完成失败；第三次尝试被预算拒绝。
3. 主体/企业/Version 不一致、过期 Permit、撤权后旧 lease、原 Owner 活跃成员撤权、下载授权撤销均失败关闭；不通过 SQL Worker Token 直接接触 Business Owner 表。
4. 非测试、错误 Schema、Host/Worker 同一 SQL 角色都不得建立功能。所有现有加密 PG 5/5 和原子审计 5/5 仍需实际 PostgreSQL 不跳过回归。
5. 正式 Host `manager/server.ts` 和 `catalog/seed.ts` 仍不出现导出 Job Action，生产 CV03 SAVE 仍 OFF，N1 NOT_CERTIFIED。

## 本阶段无法认证的关键安全事实

- **不是正式 Host 授权签名**：单独 Host SQL LOGIN 在试验中由测试程序使用。数据库能辨认两个物理登录来源和不可重用 Token，**不能验证 Host 应用确曾执行 `AuthorizationProvider` 的实时 EXPORT grant**。真正生产需要经独立 Host Identity、PA05 账户/成员权威认可的签名来源，不能仅靠 SQL role/permit。
- **不是已签名的 Owner 业务写入**：Worker 领取 metadata lease 后，本次测试里的 Owner 仍以测试级 privileged SQL 连接执行原 CAS。需下一阶段将 Job CAS 写入绑定 Host 核准的物理 SQL 事务以及 epoch，且复核多实例生命期，才能宣称 epoch 真的 fence 住业务写入。
- **DB owner/superuser 不在对抗范围**：原不可变 audit trigger 与 permit 表的所有者均可从 PG 管理平面修改，不能替代生产 WORM 与第三方不可变账本。
- **没有清理用户快照的后台任务**：本阶段到期仅是 permit/lease 状态，不能替代加密 Job 本体的 TTL 主动清除和保留证据审计。
- 生产 EXPORT 仍关闭，Human/Personal Agent 正式登录、浏览器下载、跨两个物理 Host/T0/密钥轮换/受管 SQL 角色签核均未完成。不得把 GitHub runner 两 SQL LOGIN 误写成东京生产验收。

研究来源：仅 2026-11-12 已直接阅读的仓库原文，涉及 `apps/object-extension/pa05-host-sql-permit.ts`、`apps/object-extension/pa05-physical-sql-guard.ts`、`providers/enterprise-context/resources-postgres.ts`、CV04 PG CAS、Host Capability 与原 PG 审计；没有补造新外部参考资料。最终状态以精确提交 SHA 的 GitHub CI 原始日志为准。
