# CV-03 / C3-01：PostgreSQL 共享版本权威与独立进程原子性验证（2026-11-09）

> **范围：CODE / ISOLATED_REAL_POSTGRES_PROOF，不等于 PRODUCTION_CUTOVER、Saved View WRITE 或 Human/Agent 签收。** 工程 PR：[Platform #1179](https://github.com/jiangxng/EVO-App-Platform/pull/1179)，以该 PR 最终准确 HEAD、Actions 和 merge SHA 为准。已存在的本地文件和进程内 Provider 见 [#1177 工程记录](CV03-C301-RESOURCE-CONDITIONAL-WRITE-IMPLEMENTATION-20261109.md)，原始 [CV-03 设计门禁](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md)不覆盖。
>
> 本轮在 2026-11-09 GitHub `main@3dfc6b084cad7cb8799a0a00d3f1130e2c3e475b` 上检查了仓库 `postgres@3.4.9` 与既有 PA-02 PostgreSQL 事务、子进程证明和独立 CI 模式。**复用原 Enterprise Resource 地址/资源形状和业务 owner，不新建第二套数据库或 Host Plugin Framework。**

## 1. 实际代码和隔离性

| 位置 | 确实新增/采用 | 边界 |
| --- | --- | --- |
| [Enterprise Resource contract](../../../contracts/enterprise-resource.ts) | 新增可选**异步且只支持条件写入** `EnterpriseResourceConditionalAsyncRepositoryV010`；类型为 `putIfRevision/archiveIfRevision/get/list/close` | 不修改旧同步 `EnterpriseResourceRepositoryV010` 的既有调用；不会把原 Host 的同步 `get/put` 偷换为 PG Promise |
| [原资源验证](../../../providers/enterprise-context/resources.ts) | 把已有 `validateResource` 公开为 `validateEnterpriseResourceV010` 供 PG 复用 | 不复制 JSON/地址规则或放松原字段验证 |
| [Postgres adapter](../../../providers/enterprise-context/resources-postgres.ts) | `preparePostgresConditionalResourceSchemaV010` 显式创建隔离 `cv03_*` schema；`createPostgresConditionalResourceRepositoryV010` 使用共享 PostgreSQL 主键、唯一约束、事务 `SELECT ... FOR UPDATE`、revision 条件 UPDATE、ARCHIVED 阻止恢复 | 不在正常 Host 启动时自动建表；不自动修改 `APP_PLATFORM_ENTERPRISE_RESOURCES_FILE`、Railway Postgres 或任何生产数据 |
| [两个独立 Node Worker](../../../tests/fixtures/cv03-resource-postgres-child.mjs) / [真实 PG tests](../../../tests/agent-line/cv03-resource-postgres-conditional.test.mjs) | 两进程同 revision 竞争一个成功；另一个冲突；提交后丢 ACK，重启实例 readback，旧 revision 重试明确拒绝；跨 Enterprise Context 隔离 | 固定合成夹具、非真实登录模型或正式多主机负载 |
| [独立 CI](../../../.github/workflows/cv03-resource-postgres-atomic.yml) | 官方 Postgres 18 service，`npm ci` + Build + 多进程测试，不依赖 Railway 真库或 secrets | 隔离 CI 数据库不等于 Railway/Tokyo 正式存储认证 |

**明确保证等级：** `PROCESS_LOCAL`（Memory）、`SAME_FILESYSTEM_LOCK`（File）、`SHARED_POSTGRES_TRANSACTION`（经同一 PG primary 事务提交的隔离适配）。其中只有最后者具有独立进程/主机在**同一数据库实例**共享行锁和唯一约束的技术基础；其余两者不应作为多实例 Saved View 生产权威。

## 2. 真实 PostgreSQL 失败与修复证据

- 初次真实 Postgres 18 CI 的 JSONB CHECK 拒绝了被双重序列化的 `JSON.stringify(resource)`；这不是业务冲突，而是使用 postgres.js `sql.unsafe` 的参数编码差异。明确保留修复：`$N::text::jsonb`，使字符串先按文本绑定、由 PostgreSQL 完成 JSONB 解析；不使用直接 `$N::jsonb` 产生 JSON 字符串标量。
- 修复后，**真实数据库测试步骤**（含两个独立 Node 进程的同版本冲突、丢 ACK 读回）通过；完整 PR 状态以最终 HEAD CI 为准，不能用第一次失败前的编译成功冒充此项通过。
- 所有 resource key 字段通过绑定参数传入；SQL 动态标识符只允许严格正则 `cv03_[a-z0-9_]*`，没有由用户/模型提供任意 SQL；业务字段、权限仍须后续 Platform Feature 和 owner 单独校验。

## 3. 与正式环境的切换门禁

**本 PR 不包含任何生产自动切换。** 正式 Host `manager/server.ts` 仍以 `APP_PLATFORM_STATE_FILE` / `APP_PLATFORM_ENTERPRISE_RESOURCES_FILE` 选择 Memory/File；新 PG adapter 是明确的按需调用入口，并非 Host 已启用的受管 Provider。不能因真实 PG 单独验证成功就推定原 Counterparty/Dictionary 已迁入 PG、拥有新的保存视图、Agent 已可 WRITE 或旧数据已迁移。

后续正式 Provider owner 必须逐项证明：实际同一 PG **主库**/连接路由（非异步只读副本）；隔离 schema 的授权、备份、迁移与回滚；原资源/视图作用域的唯一数据权威；开启前数据库权限/secret 和部署回滚；跨 Worker 读回/冲突/丢 ACK 和重启恢复；停用后能失败封闭。用户 Railway Platform 服务先前只读核对为 **Offline**，本 PR 不修改服务、不触发部署。

## 4. C3-02 阶段准入

- 仅在上面的生产 Provider/Host 迁移门禁明确后，才可**生产发布** Saved View WRITE；但下一开发窗口可以在隔离测试 Host 中先实现 `PERSONAL` 配置 owner 的最小 Feature/Capability Operation，实际 `Principal + Enterprise Context` 每次重算授权，查询字段和 schemaRef 由 Dictionary/Counterparty 真实 owner 校验。
- Eidos `table.views` 仅接收裁剪后视图候选；Agent 使用现有内部 `invoke.write`，Host `writeSafety`/receipt/idempotency 和未知结果 readback/重试语义都不能省略。
- 两企业/两用户/撤权/停用/隐藏字段/重复提交/409 冲突/老 schema/重启读回加上真实 LLM Run 和 desktop+390px Human 是**独立**验收清单，不属于本次 PG adapter 已验证范围。

**结论分级：** 技术上有一条共享 PostgreSQL 原子写的可复用实现及真实数据库多进程证明；`C3-01 PG_CODE_AND_ISOLATED_TEST` 与 `C3-01 PRODUCTION_TOPOLOGY_CERTIFICATION` 是两件事，后者仍为 OPEN。保存视图 C3-02～04 尚未实现或验收。
