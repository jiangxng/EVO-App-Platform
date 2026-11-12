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
