# PA-02 — Object Extension PostgreSQL 跨进程原子 Owner（2026-10-14）

**Document class:** DECISION_RECORD / implementation evidence
**Scope:** 仅隔离 PostgreSQL 18 真实业务资源 + 不可变 Owner 证据闭环。生产 WRITE 未授权。
**Baseline:** main@5c53f8b6e079b7e29e6694cc27ff97984f28a8db。
**Prev:** [10-14 交接入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261014.md) · [决策/缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261014.md) · [来源索引](WINDOW-RESEARCH-SOURCE-INDEX-20261014.md)。

## 原 Owner / Provider 契约与决定

当前 EnterpriseResourceRepositoryV010 仅有可选同步 transaction(work)，文件实现读取进程内 snapshot 并以临时文件 rename 保存，没有跨进程 CAS 或共享事务。ObjectExtensionRepositoryV010 使用上述企业资源仓库。#832 的业务 Owner 预览明确 singleProcessDevelopmentOnly:true，继续原样保留。

**采用：** 在 apps/object-extension 真实领域 Owner 内新建隔离 PostgreSQL 资源后端，将合法 Object Extension Definition 作为 Enterprise Resource envelope 保存，和不可变领域 Owner Evidence 在同一个 PostgreSQL 事务提交。Context→Enterprise 绑定、行级锁、资源与幂等唯一约束及 Owner evidence 禁 UPDATE/DELETE trigger 实现跨进程竞争与重启可证实。

**排除：** 不把 Agent 的 PostgreSQL Run/Receipt/fence 冒充跨数据库的业务事务；不复用普通 Object Extension UPSERT 的覆写路径；不直接把现有文件 Provider 改成所谓跨进程安全；不做新通用 Agent 框架，也不擅自迁移现有生产数据。

当前采用 Context 级串行化，优先安全而非过早优化吞吐。Owner 对同 idempotency key、同 Run/Effect/Receipt/Actor/Enterprise/输入摘要只读取已提交证据；不同来源键冲突拒绝。历史 Owner 成功通过不可变 evidence 确认，即使当前业务对象之后合法变化，不能用当前对象不相等抹除历史提交。当前态一致性由未来独立检测，不属于本门禁。

## 实现与验收

- apps/object-extension/agent-owner-postgres.ts：显式 prepare（仅 pa02_ 前缀测试 schema）；createPostgresObjectExtensionAtomicOwnerV010 复用 GovernedAgentBusinessOwnerV040 与 AgentOwnerVerifierV030，暴露 Enterprise Resource 读取；不接入 manager/server.ts。
- 原 PA-02 可信注册、Worker、Run、fence、UNKNOWN、Owner reconciliation 保持；原 #832 单进程回归仍执行。
- tests/agent-line/pa02-object-extension-pg-atomic-owner.test.mjs 与独立 child fixture：多个实际 Node 进程争抢同一业务定义、重复同 key、不同 key 冲突、丢失 ACK 后独立验证、提交前 SIGKILL、业务 INSERT 后证据失败回滚、跨企业与身份伪造、历史证据不变及直接 UPDATE/DELETE 拒绝。
- .github/workflows/agent-pa02-async-read-worker.yml 明确将新测试文件列入 node --test 命令，不以绿灯暗示未执行的测试已通过。

**明确限制：** isolated schema 与现有生产 Enterprise Resource 文件存储不是同一持久权威。本闭环成功只关闭 PostgreSQL Owner 原子性技术门禁；不完成原文件数据无损迁移、正式 Provider 数据共享、生产凭据/RBAC、完整 Worker 取消/外部 ACK 失联体验、Host 正式 Owner 注册及生产部署。生产 WRITE 仍 OFF；不可把本适配器无审查地接线到 manager/server.ts。

## 本轮新增来源，浏览等级

| 标题 / 原文 URL | 2026-10-14 访问级别 | 实施用途 |
| --- | --- | --- |
| [PostgreSQL 18 Transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html) | 已实际打开官方原文 | 多语句提交原子性、崩溃前未提交则回滚 |
| [PostgreSQL 18 INSERT / ON CONFLICT](https://www.postgresql.org/docs/18/sql-insert.html) | 已实际打开官方原文，重点 ON CONFLICT 章节 | 唯一键竞态与冲突拒绝行为 |

旧 H01–H14 仍为历史转引，**本轮并未重读**。本轮官方原文访问只用于 PostgreSQL 本身的语义，不代表应用测试已经 PASS。

## CI / 后继状态

**已执行专项证据：** [GitHub Actions run 38507479196](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38507479196)，job 115668182153，代码 head `970eb7b1b07d87c6487a544d36b48c3d9dc6a413`：PostgreSQL 18 service，`npm run build` PASS，新旧 PA02 测试 **10 tests / 10 pass / 0 fail / 0 skipped**；日志标记 `PA02_OBJECT_EXTENSION_POSTGRES_ATOMIC_OWNER`，6 独立进程、1 业务提交、COMMIT 后 ACK 丢失核验、SIGKILL 未提交回滚、证据失败回滚、不可变历史及跨企业拒绝均 PASS。旧单进程 Owner 的 `productionEligible:false` 不变。CI 曾揭露 TypeScript verifier 签名、JSONB 原始结果反序列化、JSONB 字符串标量三处问题，均在 **同一 PR #836** 修复并由本次有效测试覆盖。本次合并时需另核对最终 PR head 的必要检查。
**下个门禁：** 接入现行共享 Enterprise Resource Provider 的真实数据权威、可审计迁移、Host 可信 Owner 可选注册与安全恢复，用户授权和生产上线仍需独立决策。不得将 PostgreSQL 隔离证明误写为 PA-02 全阶段 Production Ready。
