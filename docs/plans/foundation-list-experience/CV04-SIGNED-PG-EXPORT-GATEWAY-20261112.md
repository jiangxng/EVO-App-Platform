# CV-04 / 2026-11-12 — Dictionary Export SQL 签名准入与运行角色隔离

> **仅隔离工程 / SQL 签名准入验证。没有生产准入认证，也没有开放正式 Host 导出操作。** 来源继承 [CV-03 N1 签名 SQL gateway](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs)、[CV-04 加密任务](CV04-ENCRYPTED-POSTGRES-EXPORT-JOB-20261112.md)、[CV-04 PG 审计](CV04-PG-IMMUTABLE-EXPORT-AUDIT-20261112.md)及[独立 EXPORT Capability](CV04-DICTIONARY-EXPORT-HOST-CAPABILITY-20261112.md)。

## 目标和选择

现有 `createPostgresConditionalResourceRepositoryV010` 具备共享 CAS，但若运行数据库角色获得资源表直接 DML 权限，就可以绕过 Node Host 授权；CV-03 已有物理测试明确记录该危险。上一阶段新建独立审计表和元数据触发器，但 **DB owner/superuser仍能禁用 trigger，未获得 SQL 强制认证能力**。

本轮选择 **基于 CV-03 签名入口思想的独立 CV-04 隔离 SQL gateway**，不修改 CV-03 原签名工具、Saved-View 命名空间或密钥。实现位于 [`tools/cv04-isolated-signed-export-gateway.mjs`](../../../tools/cv04-isolated-signed-export-gateway.mjs)，是**无副作用 SQL 建表/函数生成器**，仅人工测试 fixture 将其施加于一次性 `cv03_*` schema。

## 安全边界与实现

- **物理角色**：独立 NOLOGIN owner 持有资源、审计、授权镜像、签名密钥和 replay nonce 表。受限运行 SQL LOGIN 不获得 `resources`、`cv04_export_audit`、`cv04_export_signing_keys`、`cv04_export_authority`、`cv04_export_used_proofs` 的 SELECT/INSERT/UPDATE/DELETE，也不能改 DDL；只获得 `cv04_export_signed_put(text,text,text)` 的 EXECUTE。
- **SQL 验签**：数据库在 SECURITY DEFINER / 固定 `search_path` 的函数内通过 `pgcrypto.hmac` 检查 **原样 signed envelope bytes**。Domain = `cv04.dictionary-export.host-write/0.1.0`（与 CV-03 保存视图完全区分），必须绑定签名密钥 ID、时间、nonce、ENTERPRISE context、enterpriseId、subjectId、actorType、具体 Operation、authorityEpoch、expectedRevision 以及**完整加密资源的 SHA-256**。
- **DB 级授权镜像**：表 `cv04_export_authority` 由隔离管理员人工配置，必须 `enabled=true`、`mirror_healthy=true`、epoch 完全相等，且数据库墙钟 `lease_until` 未过期。授权行和密钥行 `FOR SHARE` 读取，将并发撤权/禁用与正在提交的写入排序；缺行/epoch gap/镜像不健康/lease 到期/密钥禁用全部 fail closed。**这只是测试镜像，未与真实 PA05/T0 授权事件同步，更不是生产授权证明。**
- **单次使用**：带签名时间短有效期（过去最多 60 秒、未来最多 20 秒），DB `cv04_export_used_proofs` 的 (`key_id,nonce`) 唯一约束使已提交 permit 无法再次变更资源。重放同 nonce 拒绝；新 nonce 对旧 revision 也因 CAS 拒绝。重放表插入、CAS、审计写入在同一事务，失败自动回滚。nonce 清理/长期容量治理尚未实现。
- **数据库 Worker 租约围栏（本轮新增）**：即使调用方拥有有效签名，也必须通过旧 Resource revision 的状态与 lease 对比。QUEUED→RUNNING 首次尝试 attempt 1，租约不得超过数据库当前时间 +15 秒；RUNNING→RUNNING 只能在旧租约确实过期后 attempt+1 重领且最多 2 次；旧租约到期后 Worker 不能再将结果写为 READY/FAILED。只有与签名 Operation 相匹配的 READY 下载审计或 EXPIRED TTL 转换可进行，不接受提前过期。数据库确认过期的 EXPIRED 写入会用新 AES-GCM envelope 清空当前任务快照和 CSV、保留独立元数据审计。**这不是后台定时 Worker/主动清理服务**；未建立守护进程或长期 WAL/备份清理保证。
- **固定范围**：仅接收 `evo.dictionary.export-jobs`、`bounded-csv-jobs`、`evo.dictionary.export.job`、`evo.dictionary.export-job/0.1.0`、`evo-business-dictionary` 的加密文档；企业、原 Subject/Actor、Job ID、snapshot/request digest、TTL、前置 revision 必须一致。初始任务仅 `QUEUED`；后续 Worker / download / expire 独立 Operation。最终状态变更和独立事件由前序 PostgreSQL 触发器在同事务提交，绝不让 SQL 运行账号直接更新审计。
- **写入权限是 SQL EXECUTE，非 Host Capability 的自动公开**：描述符仍没有在正式 `manager/server.ts` 或 `catalog/seed.ts` 注册；原 CSV READ、真实 Host/Agent 的产品边界不变，CV-03 N1 SAVE 继续 OFF。

## 必须保留的局限

1. 签名密钥在隔离 CI fixture 中由脚本持有；正式部署需 PA05/T0 提供可证实的身份、授权 epoch 与撤权事件，并使用独立的 signer/KMS；不能给运行 SQL login 该 secret。数据库触发器和 mirror 仍受 privileged DBA 控制，不能声称抗管理员篡改。
2. 这是一个**单次 SQL 资源写入入口**，不是完整 Worker 调度器，也没有正式的 Export 成品队列、速率预算、重试/租约抢占、定时过期 purge、持久 Worker 心跳或跨物理 Host 认证。当前 PG 资源的 `get` 仍属于测试管理员的只读验证路径，生产 Worker 限权读取和业务 Owner 接线尚未实现。
3. `CV-03` 的独立签名 SQL gateway 不允许直接代替此功能；没有复用 SAVED-VIEW 的签名、授权镜像或默认授权，避免跨资源能力升级。
4. 本轮若 GitHub CI/东京 preview SUCCESS，只表明测试过的隔离 SQL 门禁与发布镜像健康，不能写为生产 EXPORT 已可用或真实谷歌帐号/LLM/物理手机验收完成。

## 验收规范与证据位置

[专项真实 PG16 测试](../../../tests/agent-line/cv04-signed-export-gateway-pg.test.mjs) 和 [CI](../../../.github/workflows/cv04-signed-export-pg-gateway.yml) 使用独立 disposable database / 随机 Schema 和两条低权限 SQL 连接，要求：
- 只能凭正确 Host HMAC + DB 健康授权镜像调用 `SECURITY DEFINER` 将**加密**任务插入真实资源表，触发原子独立审计；Worker 直接读表/写表/读密钥/改账本/disable trigger 全部拒绝。
- 伪签名、错误 resource digest、请求中冒充外部 Subject/Enterprise、过期签名、已提交 nonce 重放、epoch 不匹配、镜像不健康或 lease 过期、Host signer 禁用全部 fail closed。
- 两独立 runtime SQL 登录并行提交同 Job revision，仅一个 CAS 胜出；独立审计只显示一次成功变更。新增数据库 Worker 活跃租约拒绝抢占、过期重领最多 2 次、旧 Worker 完成拒绝，以及短 TTL 后签名转 EXPIRED、清空现行密文快照并留下不可删的审计元数据测试。
- 原有 PG 审计 5 项、PG 加密 5 项、Dictionary Owner 8 项及 Protocol/Chromium/Lightweight Host 回归保持全绿；确认产品正式 EXPORT 路由没有激活。

**状态应以真实 CI 日志、最终工程 HEAD、受保护主线以及 Tokio preview 实际健康检查后更新；本文件不预设成功。** 未新增外部研究源，资料来自 2026-11-12 实际读取的仓库源代码和 Actions 证据。


## NEXT-01a / 2026-11-12：跨 Operation 的 Principal Epoch SQL 围栏（隔离增量）

> **只增强隔离验签入口，不代表生产 PA05/T0 AUTHORITY 事件同步或 Worker 业务 CAS 已认证。** 由 #05–#07 [交接入口](CV04-WINDOW-20261112-POSTMERGE-0707-HANDOFF-ENTRY.md)和[研究决策索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)直接接续，未重复建网关。

### 已观察的缺口（来源事实）

截至起点 `main@14d919b12887dc6f1a88eeee79b1a1115abf9f4d`，`cv04_export_signed_put` 只按 `(context,enterprise,subject,actor,operation)` 查 `cv04_export_authority`。不同 Operation 的镜像是独立行；当管理员仅撤销一个 Operation 的行时，另一个仍有效的行可以继续认可旧 `authorityEpoch`。原签名 HMAC 和单 Revision CAS 本身不能表达**跨 Operation 的成员/企业级撤权代际**。此项来自 [签名 Gateway 原始源码](https://github.com/jiangxng/EVO-App-Platform/blob/14d919b12887dc6f1a88eeee79b1a1115abf9f4d/tools/cv04-isolated-signed-export-gateway.mjs) 原文检查，是当次工程判断，不是已发生生产越权事件。

### 本纵切的更改和选择（工程方案）

- 直接扩展原 SQL 生成器，新增仅属于同一 `cv03_*` 一次性隔离 Schema 的 `cv04_export_principal_fence`。主键是 `(context_id, enterprise_id, principal_subject_id, actor_type)`，保存独立于 Operation 的 `enabled/mirror_healthy/authority_epoch/lease_until`；默认 deny，无行也 deny。不新造签名函数、通用 Owner/列表框架。
- 在现有 `cv04_export_signed_put` 已验签、检查独立 Operation grant 后，追加 Principal Fence 的 `FOR SHARE` 行锁与数据库墙钟检查，**必须与签名证明的 `authorityEpoch` 完全相等**。先撤销主体，便可同时围住旧 request、worker、download、expire 所有 Operation；在 SQL 事务中与准入 CAS/trigger 原子排序。
- 运行 SQL LOGIN 不获得 Fence 表的 SELECT/UPDATE/DELETE；真实 PostgreSQL fixture 用隔离管理员显式预置两种镜像。新增测试涵盖共享 Principal 撤权、镜像不健康、Operation Epoch 未同步和不受信任 SQL 登录直接修改拒绝。回归工作流采用精确 PASS marker，不使用 skip 代替数据库证明。
- **不把手工修改镜像算作 PA05/T0 真实事件送达**。生产仍需真实 Host 订阅/验证成员撤权、企业切换、插件停用事件的权威签名/顺序/原子推进、故障断链 fail-closed，以及多实例的时钟/版本治理。更重要的是，#1275 `cv04_export_work_leases.epoch` 与原 Domain Owner 业务资源 `revision` 仍未在相同 signed SQL CAS 事务中强绑定；下一验收目标是单次 SQL Worker 完成必须同时拥有有效物理 Lease Epoch、当前 Principal Epoch 和合法预期 Revision，不可在这里只凭新 Principal Fence 宣称“完整多 Worker 认证”。
- 本修改不触及 `catalog/seed.ts`、`manager/server.ts`、CV03 SAVE/PA05 生产授权配置或 PR #1184 受管文件。不存在新正式 EXPORT 入口。

### 资料与可验收证据等级

**A / 已读原文（2026-11-12）**：[原有 signed Gateway](https://github.com/jiangxng/EVO-App-Platform/blob/14d919b12887dc6f1a88eeee79b1a1115abf9f4d/tools/cv04-isolated-signed-export-gateway.mjs)、[Host/Worker SQL 租约](https://github.com/jiangxng/EVO-App-Platform/blob/14d919b12887dc6f1a88eeee79b1a1115abf9f4d/apps/business-dictionary/export-job-pg-sql-lease.ts)、[真实 PostgreSQL 验收代码](https://github.com/jiangxng/EVO-App-Platform/blob/14d919b12887dc6f1a88eeee79b1a1115abf9f4d/tests/agent-line/cv04-signed-export-gateway-pg.test.mjs)、本页设计文档和 #05–#07 交接索引。**B / 待取新 PR HEAD 后核实**：新 SQL PG16 CI log、主线 merge SHA、东京 preflight/deploy、Branch Hygiene；不能预填通过。**C / 未验证来源**：真实 PA05/T0 OIDC/企业成员撤权事件到 DB 的完整订阅与事务证据、正式 KMS、WAL/备份 retention、安全稽核与外部手机实机。此次没有查阅外部网页/第三方文档，也没有创建截图或附件。

**下一步不扩范围**：优先把真实 PA05/T0 授权事件→共享 Principal Epoch 推进（失联拒绝）、SQL Worker Lease Epoch→Owner CAS Revision 在**一个受限 SQL transaction**中围住；之后才是持久 scheduler/KMS、正式双主体会话验收。当前 `N1=NOT_CERTIFIED`、生产 SAVE OFF、正式 EXPORT OFF。


## NEXT-02 / 2026-11-12：物理 SQL Lease Epoch 与签名业务 Resource Revision 同事务联合围栏

> **ISOLATED OPT-IN / NOT PRODUCTION ADMITTED.** 接续 NEXT-01a 已合并的跨 Operation Principal Epoch Fence。仅扩展已有 `cv04_export_signed_put` SQL 生成器、现有物理 Host/Worker SQL Lease、真实 PG CI；不创建另一套 Export Gateway、Owner/Job、列表框架或生产路由。

### 可复核的原始缺口（G：已读源码，2026-11-12）

- [合并后的签名 Gateway 原文](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/tools/cv04-isolated-signed-export-gateway.mjs)：对 Worker 只查 signed `authorityEpoch`、Job Revision、JSONB `attempt/leaseUntil`；并未读取 [物理 Lease 原文](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/apps/business-dictionary/export-job-pg-sql-lease.ts) 的 `cv04_export_work_leases`。旧 Worker 可在合成旧 lease 的时间窗口提出签名资源 CAS，不能从两套独立 PASS 推论实际相互围栏。该风险是源码可确认的**控制缺口**，不声称生产上已遭利用。
- 原 [Domain Owner `run`](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/apps/business-dictionary/export-jobs.ts) 通过独立加密 PG adapter + 原资源 CAS 执行业务逻辑，测试高级 DB 连接仍不经签名网关。当前联合 SQL 函数的验证是**同一真实 Resource CAS 事务**，尚不是正式业务 Owner `run()` 已经真实签名接线。

### 选择与工程实施（D：本阶段隔离实现）

1. 原 `cv04IsolatedSignedExportGatewaySqlV010(schema,{requirePhysicalWorkerLease:true})` 添加**显式 opt-in** 联合围栏；旧单独 signed gateway fixture 不改变含义，正式 Host 不引用任何隔离构造器。物理 Lease 表缺失时 Worker 操作必须失败，而不是假定已授权。非 Worker request/download/expiry 继续沿用原签名语义。
2. `worker` Operation 必须携带 **Host 签名内容中的** `workerLeaseEpoch`（1 或 2）与 `workerLeaseTokenHash`（一次性许可 token 的 MD5；token 具 128-bit 随机熵，Gateway 不接受纯 Agent 自报的 hash 作为许可）。DB `SECURITY DEFINER` 在同一事务内对物理 `lease` 和已 CLAIMED `permit` 行 `FOR SHARE`，确认两行相互绑定、主体/企业/Actor 相等、未撤销/未超时、**物理 permit 签发时 authority_epoch 与本次 HMAC + Principal + Operation epoch 相等**、token hash/lease epoch 相等；RUNNING 的业务 `expectedRevision=permit.job_revision`，READY/FAILED 必须在已 STARTED 的后续 Revision，且业务尝试号等于物理 Epoch、业务租约不长于物理租约。失败不更新 Resource、nonce 或独立 audit。
3. 原 SQL Host `issue`、Worker `claim/complete`、Host `revoke` 与 signed Gateway 按相同 `(contextId,jobId)` 获取**事务 advisory lock** 再拿各自基础表/资源锁，避免独立 Lease 更新和 Resource CAS 相互反向行锁引起的死锁。仍依靠数据库固有 Resource Revision CAS 防两端并发覆盖，沿用原审计 trigger 的单事务 append。
4. 真实 PostgreSQL16 新 fixture 在一个隔离 `cv03_*` schema 下装配现有四种源码、独立 NOLOGIN owner + 三种受限 SQL LOGIN（Host、Worker、签名执行），测试过期旧 Epoch 复领、旧签名 Proof 继续提交、新租约提交成功、Principal Epoch 撤权和 Host 租约撤销。测试里的数据库管理注入模拟过期**不是两个实际物理 Host 的时钟/崩溃/网络分区认证**，绝不把这一点隐去。
5. 原 `DictionaryExportJobOwnerV010.run()` 对 `RUNNING` 过程有多次 audit append，当前签名 Gateway 的 Worker transition 仅允许 `STARTED/READY/FAILED`。因此 **Owner `run()` 尚未通过此新协议接线**，需要单独补齐受签名的中途 RUNNING audit、物理 SQL 角色最小权限 GET 和一次性 Host 授权来源，才可证明正式全链路。此 PR 不把纯 SQL fixture 称为完整 Host→Owner 生产联合认证。

### 验证和边界

- **A / 本轮已读原文**：上一阶段的 Gateway、SQL Lease、Dictionary Owner、加密 PG store、签名 PG test fixture、两份对应 GitHub Actions 原文，以上链接固定到 `main@0233c390...`。
- **B / 结果必须回填**：本 PR 的最终精确 HEAD 真实 PG16 联合测试 marker、原租约 4/4、签名网关回归、加密 PG 5/5、审计 5/5、Owner 8/8；merge 后 main check-run/东京 preflight 和 Branch Hygiene 不得预设全绿。
- **C / 未验证**：PA05/T0 真实 source generation/outbox/成员撤权→SQL 的原子链接、生产 DB role/Host principal/KMS、Worker 网络分区及 WAL/备份 retention、真 Human/Agent OIDC 和手机验收。缺任何正式 Owner 放行则 EXPORT 入口保持 OFF；CV03 `N1=NOT_CERTIFIED`、SAVE OFF；并行 #1184 文档不触碰。

- **证据驱动的校正（PG16 CI 第一次红灯前后）**：最初独立联合协议在 `workerLeaseEpoch/tokenHash` 上具备检查，但物理 permit 原表无 `authority_epoch` 字段，可能把在旧授权代签发的 permit 与之后重授新代的签名错误配对。改为原 Host `cv04_export_issue_lease` 增加**默认 NULL 的第八个可选 `p_epoch` 参数**（原七参数 SQL 调用与隔离测试兼容），实际存储 `authority_epoch`，未携带时取 0 且**联合签名入口拒绝 0**。Host 隔离 API 新增可选 `authorityEpoch`，联合测试必须传入当前值；签名 SQL 还要求该列与签名中的 epoch 相同。旧测试授予的未盖章许可不能借新代 HMAC 被复活。该校正仍不能代替真实 PA05/T0 源 generation 和 Host 签名的授权因果验证。
- **失败如实记录**：[PR #1281 的首轮 signed PG16 CI #43194029869](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43194029869) 为 FAILURE：新 SQL 运行时 9/10 PASS、0 SKIP，另外的原 Host Worker 租约、TTL 和 Continuity 当次通过；唯一报错为测试对错误 expectedRevision 预期只列出下游 `PHYSICAL_LEASE_FENCED/REVISION_CONFLICT`，实际 Gateway 较早的 `CV04_GATEWAY_PERMIT_OR_STATE_DENIED` **正确拒绝**。现已将断言涵盖真实首先拒绝的版本预检查，和上面的许可签发 Epoch 加固一并重新提交；最终通过与否以更新后精确 HEAD Actions 为准，绝不追认首轮红灯。


## NEXT-03a / 2026-11-12：Domain Owner 中途审计的 SQL 联合围栏 + Worker 加密任务最小读取

> **真实 PostgreSQL CI 的隔离工程层，不是 PA05/T0 生产准入**。延续 #1281 已合并的签名 SQL CAS 与物理 Lease Epoch；没有新增 Gateway/Owner/列表框架，也没有打开正式 EXPORT 或 CV03 SAVE。

### G：本轮 2026-11-12 已读源码，不是复述旧链接

1. [现有 Owner `run()` 原文](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/apps/business-dictionary/export-jobs.ts#L263-L324)：Job `QUEUED→RUNNING` 后，`createAuthorizedCrossPageCsvV010` 的 `audit` 回调会调用 `append()`，用原 Resource CAS 将每条 `STARTED/COMPLETED/REJECTED` 写成 `RUNNING→RUNNING`，随后才进行 `READY` 写入；失败还会尝试 `FAILED`。原签名 SQL 只允许 RUNNING **增加 Attempt** 或在 READY/FAILED 完成，拒绝中途审计，故 #1281 的 10/10 PG16 测试不能宣称 `Owner.run()` 已能透过签名门禁完整执行。
2. [原签名 SQL 生成器](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/tools/cv04-isolated-signed-export-gateway.mjs) 和 [物理 SQL Lease](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/apps/business-dictionary/export-job-pg-sql-lease.ts)：已有独立受限签名执行 SQL LOGIN、受限 Worker SQL LOGIN 和原始资源表 CAS。后者的 Worker `claim/complete` 无法以同一个物理令牌只读取其已认领的密文任务；把 `resources` 表 SELECT 直接赋给 Worker 会暴露其他企业任务的加密 Metadata 并破坏隔离。
3. [独立审计 Trigger](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/apps/business-dictionary/export-job-pg-audit.ts)：同一 Resource CAS 内自动追加不可变、元数据-only Audit Ledger，拒绝旧事件前缀重写。应复用这个 Trigger，不能新增另一个审计事实源。

### D：本次最小工程选择与安全属性

- 在**原** `cv04_export_signed_put` 的 Worker 状态分支，允许 `RUNNING→RUNNING` 且 **Attempt 不变**，仅允许一次新增 `STARTED/COMPLETED/REJECTED` 事件。签名 HMAC + Principal/Operation Epoch + 物理 permit 的发行授权 Epoch + Lease Token Hash + Epoch + Resource CAS Revision 仍全部强制；原 Job Lease 必须未到期且字节级保持 `leaseUntil`，禁止借审计延长租约、多事件绕过预算或增加重试。Trigger 继续负责 Audit Ledger CAS-atomic 不可变性，SQL 无第二个审计路径。
- 在现有签名 Gateway 的 `requirePhysicalWorkerLease:true` 下，**显式绑定物理 Worker SQL LOGIN** 后才安装 `cv04_export_worker_read(text,bigint)`：SECURITY DEFINER 校验 `session_user`、一次性 permit 的 `CLAIMED` 状态、唯一关联 Job、操作级和主体级 Epoch/健康/时租、当前物理 Lease Epoch/到期与 Resource Revision/企业/Actor。只返回该任务的 AES-GCM `resource` 和 `revision`，不返回明文、密钥或其他 Job，不开放资源列表。Worker 仅得到该函数 EXECUTE；原表 SELECT 仍 REVOKED。未知 token、旧 Epoch、撤权或 DONE/REVOKED 必须拒绝。
- 现有 Worker 客户端新增隔离方法 `readCiphertext(token,epoch)`，不存在该 opt-in SQL 函数时拒绝；主线生产 Host、Catalog 和 Agent Tool 都不引用。原 SQL Role 凭据、真实 PA05/T0 outbox、KMS 无法从人工 fixture 得到认证。
- [真实 PG16 联合测试代码](../../../tests/agent-line/cv04-signed-export-gateway-pg.test.mjs) 扩展：Worker 只能用有效 claimed token 获取**加密**任务且不能 `SELECT resources`；签名 `RUNNING→RUNNING` 独立审核三段并持久化原不可变 ledger；跨 Revision、尝试、时间、一次两事件、Host 撤销、Principal/Operation 撤权全部 fail closed。新 exact marker 和 CI 原始日志 **以 PR 实际运行结果为准**。
- 还在同一真实 PostgreSQL fixture 中，用**实际的 Dictionary Domain Owner `request()→run()→READY`** 验证：请求阶段使用一次性 CI Host 签名创建队列，物理 Worker 认领后用本次新增的受限 SQL `readCiphertext` 获取原任务密文；原加密存储适配器仍执行实际 AES-GCM 加解密，所有新 Resource 都只调用原受限 `cv04_export_signed_put` 而非 `resources` 原表 DML。真实 Owner `run()` 实际调用 STARTED、再次 STARTED、COMPLETED、READY 的四次签名 CAS；独立不可变审计同事务达到 `REQUESTED/STARTED/STARTED/COMPLETED/READY`。由于物理 `claim()` 的数据库截止时间会早于 Owner 自行生成的 `now()+15s`，仅对现有未注册的 test-only Owner `run()` 新增第三参数 `trustedSqlLeaseUntil`，使用物理截止时间**不延长租约**；SQL 独立验证该截止不超过物理表值。该桥接由隔离 fixture 注入签名，不是新的业务 Owner、通用存储基类或生产 Host。
- **仍不等于生产端到端授权**：本次 fixture 签名密钥和临时解密密钥由同一个 CI 管理环境提供；正式 Host 并未注册 Owner 存储桥接，真实 PA05/T0 可信审批、物理 Host 签名身份、每次 GET 的 KMS 密钥发放、跨机器 Worker 失败恢复/重试、生产运行时强制签名策略均未认证。不能从真实 Owner 在 CI 中跑通推断生产 Host 已启用 EXPORT。生产 EXPORT OFF，CV03 `N1=NOT_CERTIFIED`、SAVE OFF。

### 原始参考索引与阅读等级

A / 2026-11-12 已读相关源码和测试：上面的四个固定 `bfdc861a...` 原文链接，原 [PG16 联合回归](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/tests/agent-line/cv04-signed-export-gateway-pg.test.mjs)、原 [签名 Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/.github/workflows/cv04-signed-export-pg-gateway.yml)。B / 本次 PR 的精确 HEAD CI、新 main CI、东京、Branch Hygiene 需要按原始日志核实再写入，不能提前编造。C / 尚无真实 PA05/T0 事件流、生产物理 SQL 权威/KMS/备份策略、多物理 Worker Host 失联/恢复、Human/AI 正式跨页 EXPORT 的生产端到端证据。本轮没有新增外部第三方网络研究或截图。

- **额外失败/恢复边界**：`trustedSqlLeaseUntil` 由数据库 `claim` 返回，只允许 `NODE_ENV=test + isolatedTestOnly:true` 的现有 Owner `run` 接收，校验必须是未来时间且不能超过本地 `now()+15s`；任何正式 HTTP/Agent 调用都没有传递该参数的入口。实际运行中的授权被撤销、信任源丢失或 SQL 异常仍必须失效而不发 CSV。生产 Worker 需独立的签名主体凭据与密钥管理和真实身份联动，不能复制此 CI fixture。


## NEXT-05a / 2026-11-12：生产授权源与 Owner 决策的真实证据门禁（正式 EXPORT 仍 OFF）

> **本次不造新的模拟 T0、不部署真实签名/密钥、不替代 Owner 批准。** 已合并 NEXT-04b `main@81262c348b2abf0440ddc0501495aa9c572f2e23` 证明隔离 PostgreSQL/两 Host OS 进程可停止并重扫，但之前 `cv04_export_authority`、`cv04_export_principal_fence` 均由测试管理员手工置为 enabled，签名 HMAC、AES-GCM Key 来自 disposable fixture。**18/18 PG16 PASS 不能转换成真实 PA05 生产签发。**

### G / 2026-11-12 已读源码、真实 Owner 信息与外部限制

1. [现有 CV-03 Owner 决策 Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)（B：本轮实读实际 Issue body 与最新评论；截至本次查询 **OPEN/PENDING OWNER SIGNOFF**）。五个复选框均标记完成，仅表示架构方向已经讨论；Issue 的签署要求另需具名 Owner、日期、环境、来源 SHA、可核验批准链。**它是共享 PA05/T0 授权上游依赖，不是针对 CV04 EXPORT 的独立上线批准**。并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184)（B：当次状态 OPEN）仍拥有自己的三份文档；禁止在 CV04 分支覆盖它。
2. [正式生产切换 Owner 契约](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md)（A：本轮直接阅读）：用户确认方案 A（**同一正式 PostgreSQL ACID T0**），但实际 PA05/AuthorizationProvider/DB/Security/Domain Owner 的签名、Producer role、完整 Scope+DENY/tombstone+generation+watermark、迁移/回滚、KMS、跨物理 Host/网络分区仍待决，不可用 `cv03_n105b_qa` 替代生产。原 [CV03 Owner gate 源码](../../../tools/cv03-n105c09-owner-evidence-release-gate.mjs)（A：直接已读）只会认定安全的 **BLOCKED** 现状，从不签发认证。
3. [运行时 Host Provider 候选真实证据](CV03-N105C12-LIVE-PROVIDER-CANDIDATE-READONLY-20261112.md)（A：本轮读该历史原始报告；**本轮未重新执行东京 Host GET**）：历史东京 Host 的 `authorization.check` 有效候选为唯一 `host.static-authorization`，binding count=0，无法证明 Provider `check()` 与真实 Pg Epoch/Outbox 同 T0，更无法证明完整企业/AI/个人 Agent 权威；当次历史物理验收和时间见该文档，不冒称是本次新物理确认。
4. [实际 CV04 Owner](../../../apps/business-dictionary/export-jobs.ts)、[PG 加密存储](../../../apps/business-dictionary/export-job-pg-store.ts)、[物理 SQL Lease](../../../apps/business-dictionary/export-job-pg-sql-lease.ts)、[隔离轮询器](../../../apps/business-dictionary/export-job-pg-dispatch.ts)、[签名 Gateway](../../../tools/cv04-isolated-signed-export-gateway.mjs)、[Host 入口](../../../manager/server.ts)（A：本轮查看相应正式源码）：Owner 创建拒绝 `NODE_ENV!==test`，加密 PG/Lease/Dispatch/Poll 均 fail-closed；正式 Host 与 Catalog **未注册** `dictionary.collection.export.job.request`。此前的 HMAC SQL Gate 与原 AES-GCM Storage 是隔离 `cv03_*` Schema 的测试资产，**不能从其存在推断已连生产密钥源**。

### D / 工程选择、排除、红绿含义

- 复用上游 N105c09 现有「Issue 身份+PG T0 连接仍 UNMOUNTED」检查而不是重复创建一套 Owner/授权审查框架；在 `tools/cv04-next05-production-authority-release-gate.mjs` 增加**专属于 CV04 Export** 的正式 Host/Catalog 未注册和原有 Owner/PG/Worker/调度器仍只接受 test-only 的静态源码验证。通过新的 GitHub Actions 每次读取**真实** #1212 Issue 和 #1184 PR 元数据，不能依赖用户附带、Agent 自报的批准信息；也不记录 Issue 原始文本/Secret 到日志。
- **GREEN=EXPECTED_BLOCKED_BASELINE**：当真实 Owner 决策仍待签、正式 EXPORT 入口未注册且 staging 隔离未漂移时视为保护生效。**RED=DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED**：Issue 找不到/意外关闭、生产代码新挂载 Gate/Owner 或削弱 `NODE_ENV=test` 拒绝、部分源码缺失或 Owner 上游门禁发生漂移，均应停止并请求独立 Owner 复核；RED 不等于自动允许生产接线。测试中明确对 `--enable/--certify/--release` 命令返回拒绝。
- 这只是版本化**负向发布完整性守卫**，不验证真实 KMS/HSM/Signer，无法做出任何肯定生产认证；无通往正式 EXPORT 的 enable path。不能用 CI 绿灯替代真正生产环境 Owner 签署。普通用户页面 CSV 下载功能是现有受权浏览器响应，**不同于正式持久跨页 EXPORT job**；守卫不能误关页面 CSV。
- 本次不触碰 `manager/cv03-n105b-authority-t0-pg.ts`、正式 Host Runtime、Catalog、#1184 受管文件或真实东京 SQL 角色；不凭借 checked boxes 放开任何权限。

### P / 接入真实生产前尚需完整独立 Owner 签署

| 职责 | 必须由真实 Owner 提供并确认的可验证事实 |
| --- | --- |
| PA05 / AuthorizationProvider | 正式企业/主体/HUMAN+AI Actor/Operation/Feature 的 canonical Scope、generation/epoch/Outbox 完整序列与失联/撤权 fail-closed、原 file→Pg T0 迁移，未知/离线租户的默认 DENY |
| PostgreSQL DB Owner | 原生产 DB/Schema/Owner 和真实登录最小 GRANT，不能由 `evo` 超管代替 Producer；不可变 Outbox/Receipt 幂等及快照水印、PITR、迁移与完整回滚 |
| Security/Ops | 真正 Producer workload principal，Signer/KMS 的职责分离、密钥轮换/泄漏吊销，跨物理 Host/主库分区和恢复证明、RPO/RTO 与回退联系人 |
| Domain/Human/Agent | 当前 List/Eidos Domain Owner 的真实 Human/Agent 同数据异授权、企业切换与下载时再次授权，390px 实机/Chromium 验收，以及明确的生产上线/回退独立批准 |

**硬禁令**：正式 EXPORT OFF/unregistered；CV03 `N1=NOT_CERTIFIED`、SAVE OFF；#1184 受管文件不修改。Owner 事实缺失时继续做证据准备和 fail-closed 门禁，不尝试人工生成生产 ACL、KMS、PA05 源事件或模拟签署。

### B / CI 与发布证据（以真实原始日志为准）

本节先记录 **待运行** 的 NEXT-05a Gate 源码测试和 GitHub live Issue 查询设计；只有实际 PR 最终 HEAD、真实查询与 main 分支 CI 后才标记 6/6 PASS。若只改文档而东京发布被正确 SKIPPED，不能写成新代码已部署。分支清理同理必须核对原始 GitHub ref。没有新增第三方网络研究或截图。
