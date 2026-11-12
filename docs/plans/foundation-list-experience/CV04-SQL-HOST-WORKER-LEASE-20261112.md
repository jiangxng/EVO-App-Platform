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


## NEXT-04 / 2026-11-12：已有 SQL Permit/Lease 上的 Host-only 调度 sweep、崩溃重领与 DB 冷却

> **独立隔离工程 NOT PRODUCTION ADMITTED。** #1282 合入 `main@42389e2dfe27b7ec959b3c6c57d8ee50b8d65647` 后接续。本阶段只扩展**原** `cv04_export_work_permits`、`cv04_export_work_leases` 和原签名 Owner CAS，没有新增调度租约、持久任务复制表、后台服务、PA05 授权源或 Host 产品路由。此前记录的 #1275 单独 SQL 物理围栏局限依旧是历史来源事实；后续 #1281/#1282 已在其它文档中补足签名 CAS/真实 Owner 的**隔离验证**，请以各自合并 SHA 区分前后。

### A / 2026-11-12 直接查阅原始源码

- [原 SQL Lease `main@42389e2...`](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/apps/business-dictionary/export-job-pg-sql-lease.ts)：真实 SQL Host `issue/revoke/status/due`、真实 SQL Worker `claim/complete/readCiphertext`。物理 `cv04_export_work_leases` 主键为 `(context_id,job_id)`，Epoch 仅为 1/2，短期 Permit 30s、物理 Worker Lease 15s，claim 使用 CAS+超时检查；原本**无**可扫描正在等待执行或可重领 Job 的最小 Host 元数据入口，也没有跨多个 Host 的常规调度 sweep。
- [原签名 SQL CAS](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/tools/cv04-isolated-signed-export-gateway.mjs)、[实际 Domain Owner `run()`](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/apps/business-dictionary/export-jobs.ts)：只有带 Host HMAC、相同 Principal/Operation Epoch、有效物理 Worker Token+Epoch 和原 Job Resource Revision 才可写入，包括 Owner 真实 `RUNNING→RUNNING` 审计。原普通 `Owner.run` 在正常恢复时用自己可用的加密快照重跑，必须配合 `trustedSqlLeaseUntil` 而不能人为延长物理租约。
- [原 TTL tombstone 维护](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/apps/business-dictionary/export-job-pg-maintenance.ts)：已有独立 Host `due()` 只查到期记录，先撤销 Lease 再在共享 PG CAS 中 EXPIRED。它用于到期清理，不应复用为 Worker 调度候选或新增业务权限来源。

### D / 选择和约束

1. 同一个隔离物理 SQL Lease 安装器增加 **`cv04_export_runnable_jobs(context,limit)`**，`SECURITY DEFINER` + `session_user=hostLoginRole` + schema 最小 EXECUTE，范围最多 25 Job，只返回 opaque `jobId`、`expectedRevision`、Enterprise/Subject/Actor 与 Attempt，绝不返回快照、CSV、AES-GCM 密文、密钥或独立 Audit。Worker SQL 角色不得 EXECUTE，也不得 SELECT `resources/permit/lease`。候选为 QUEUED+Attempt=0+无物理 Lease，或 RUNNING+Attempt=1+物理 Lease Epoch=1 已到期且业务 Lease 同时到期；后者必须额外经过 **1 秒数据库墙钟冷却**。READY/FAILED/EXPIRED/Attempt=2 不再派工。
2. Host `issue` 在带 `authorityEpoch` 的联合签名模式下，使用原 Job advisory transaction lock，在签发 Permit 前拒绝仍存在**未过期 ISSUED 许可**或**活跃 RUNNING 物理租约**，返回 `CV04_EXPORT_SQL_DISPATCH_BUSY`。两个 Host 可能先读到同一个候选，但最多只有一个 live issuer 得到有效派工；原七参数未盖章的独立 Lease QA 模式兼容。新 Permit 不等于授权：每个候选在签发前必须由调用者执行 live Host 审核并提供新审批 ID + 单调 `authorityEpoch`，不可把 DB Metadata 当真实 PA05/T0 授权。
3. 新 `createIsolatedDictionaryExportPgDispatcherV010` 是 **`NODE_ENV=test + isolatedTestOnly:true`、主动调用的 bounded `sweep()`**，只使用现有 Host SQL `runnable/issue` 和 Worker SQL `claim/complete` 与注入的原签名 CAS `runWork`；每批 1–25、Worker 并发 1–4。失败后**绝不虚报 DONE、不用内存自动重试**：被杀的 Worker 的物理 Lease 留存于数据库，下一次 sweep 在双租约和冷却到期后、凭新 Host 授权进入 Epoch=2。第二次失败后达预算停止。不构建新进程常驻定时器、无记忆队列。
4. 真 PostgreSQL16 CI 在同一临时 `cv03_*` schema 下使用两个独立 Host SQL 连接/调度 sweep 与**不同 Node OS 子进程 Worker**；第一 Worker claim 后由测试驱动 `SIGKILL`，其未完成的 RUNNING Job 经 HMAC 签名 CAS 保留。数据库注入物理 Lease 过期后若业务 Lease 尚未到期仍不得重领；经过数据库双租约 + 冷却，到新的 Worker 子进程 claim Epoch=2 且用原签名 SQL CAS 完成 READY + 元数据审计；旧 Token、旧 Epoch 不得完成。另一回归覆盖 Host live deny（不生成 Permit）、待领取 30s Permit 冷却、过期可重签、Worker 不得枚举和 Host revoke。
5. 这证明的是**两个独立 Host 数据库连接**和**真实不同 Worker OS 进程**在隔离 PG16 的 fencing 与 bounded recovery，**不是**两个真正跨网络 Host 机器、网络分区/WAL 恢复、独立 KMS、持续 dispatch service 或生产签名身份认证。CI 人工模拟墙钟到期时只修改 Disposable PG 的物理租约，不能据此宣称真实 15 秒调度时效保证。

### B/C：结果须按 GitHub 原始证据回填

- B / 新 PR 的完整精确 HEAD PostgreSQL marker、复用 #1281/#1282 正常 Owner 13/13 原套件、原 SQL Host/Worker、Immutable Audit、AES-GCM、Chromium、CI、受保护 main、东京实际发布、Branch Hygiene **只在本次真实日志成功后确认**。请保留失败→修复记录，不以后一次绿灯覆盖此前问题。
- C / 真实 PA05/T0 source/outbox 与撤权、物理 Host 身份、Signer/KMS、不同网络分区 Host、自动 cron/daemon、SLA、跨进程独立加密密钥保管、备份与 WORM 保留、真实 Human/Personal Agent 生产交互仍未认证；**正式 EXPORT OFF、CV03 N1=NOT_CERTIFIED、SAVE OFF，#1184 文件不动。**


## NEXT-04b / 2026-11-12：隔离周期调度、停止排空、Host 进程重启

> **TEST-ONLY DISPOSABLE CONTROLLER, NOT A PRODUCTION DAEMON.** 延续已合并 PR #1283 的有界 `sweep()`，不引入另一套 Permit/Lease/Job/Owner，也不发布用户可见 EXPORT Action。

### A — 查阅过的原文（查阅 2026-11-12）

- [#1283 合并后的 Dispatcher 原文](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/apps/business-dictionary/export-job-pg-dispatch.ts)：已有 `sweep(limit)` 遍历按 DB 元数据筛出的任务、逐个执行 live AuthorizationCallback、发放 Host permit、Worker claim、调用原签名 CAS、完成 lease；多 Host/Worker 通过 PostgreSQL Job advisory lock + Revision/Epoch 拒绝重复成功，但 **只在外部主动调用时运行**，进程停止后无人再次扫描。
- [#1283 原独立 PG Lease](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/apps/business-dictionary/export-job-pg-sql-lease.ts)、[原真实 PostgreSQL16 回归](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/tests/agent-line/cv04-signed-export-gateway-pg.test.mjs)、[Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/.github/workflows/cv04-signed-export-pg-gateway.yml)：Resource、Host permit、物理 Lease Epoch 状态由 PG 决定，JS 内存不应成为第二个权威。已证明两个 Host SQL 会话与 Worker OS 子进程失败重领；但 **尚未证明真实 Host OS 调度进程退出、轮询自动唤醒与安全停机**。

### D — 最小选择、接口行为及限制

1. **仅在原 `export-job-pg-dispatch.ts`** 增加 `createIsolatedDictionaryExportPgPollingV010`。必须 `NODE_ENV=test`、`isolatedTestOnly:true`，外部显式 `start()`，没有自动顶层副作用、后台 Worker 注册或正式 Host 生命周期挂载。控制器只调用原 `dispatcher.sweep({limit})`，不重复发放许可、不添加调度状态表；新进程从 PG 原有 Job/Permit/Lease 重扫。
2. 单个实例只允许启动一次；采用**单飞串行**循环，任何上次 sweep 未完成时不启动下次；时间间隔明确为 20–60000ms，连续空闲做有界指数退避（不超 `maxIdleIntervalMs`），有实际派工时恢复最小间隔。未经 AuthorizationProvider/PA05/T0 最新事件认证时回调必须拒绝，不可缓存上次授权。
3. `stop()` 取消下一次定时唤醒，**等待当前已经领取的有界 sweep 完成或失败**，不在 Node 内存里伪造 DONE、不主动撤销有效 SQL 物理 Lease、不抢占合法完成。若 Host 或 PG 错误，`done` 拒绝且循环立即 fail-stop，**不做无限自动补偿**；进程被 SIGKILL 时不存在 JS cleanup，原 PG Lease 保持、待 DB 双 Lease 过期及原 1s 冷却后由另一个实例重新 claim。
4. 在 [现有真实 PG16 signed fixture](../../../tests/agent-line/cv04-signed-export-gateway-pg.test.mjs) 新增：单位级定时器单飞、25/50/100ms 退避、stop 后不可再唤醒、stop during in-flight 等待排空、DB 故障模拟 fail-stop；实际 PG 通过 Host A 周期调度 first STARTED + 故障，stop 后独立 Host B 的新周期控制器重新读取 `runnable`，Epoch=2 签名 CAS 变成 READY，旧 Token 完成失败且不可扩展；另外在**两个独立 Node Host OS 进程**各自产生新的 Host/Worker SQL Pool，第一次 claim 后杀死 Host 进程，再由全新 Host 进程取得 Epoch=2，parent 的**隔离测试签名器**完成实际 SQL CAS，验证旧 Epoch 被拒绝。子进程 Host 真实不同 PID，但仍运行在同一 GitHub Runner；父进程签名器是测试夹具，不是生产签名 HA。
5. 设计选择：**不创建** Durable Timer/Redis Queue/第四套 Lease，不使用 `setInterval` 造成重叠，也不写“已达到跨地域/双物理机故障容忍”。真实进程重启由测试显式启动新实例触发；正式生产须独立受管 lifecycle/supervisor 和授权事件源，在该前置缺口关闭前不部署这个轮询器。

### 结果等级（需要以本轮 PR 精确 HEAD 原始日志更新）

- B / [NEXT-04b PR 入口待确认](https://github.com/jiangxng/EVO-App-Platform/pulls)：真 PostgreSQL 测试正覆盖轮询 stop/restart、OS Host crash、旧签名 Epoch fencing、原 Owner/audit/加密回归。**不能预填 CI success、main SHA 或东京健康标记**，每次应在 GitHub log 里找到 PASS marker 与 zero skip。
- C / 尚未完成的真实两个物理 Host/网络分区、真实 PA05/T0 授权签名与失联反应、Signer/KMS、持久 supervisor 服务注册、长期独立心跳 SLA、租约时间的真实物理时钟漂移/跨机器 DB 长尾、备份 WAL/保留策略、Human/Agent 生产会话认证均为未认证。独立进程试验依靠 GitHub Runner 内临时 SQL LOGIN，不等于生产身份。
- 原禁令不变：**正式 EXPORT OFF/unregistered；CV03 `N1=NOT_CERTIFIED`、SAVE OFF；不触碰 PR #1184 文件**。
