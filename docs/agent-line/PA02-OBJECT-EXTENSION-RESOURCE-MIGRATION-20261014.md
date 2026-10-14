# PA-02 Object Extension — Enterprise Resource → PostgreSQL 离线迁移验证（2026-10-14）

**Document class:** DECISION_RECORD / IMPLEMENTATION_EVIDENCE  
**Owner boundary:** Enterprise Context 是薄资源容器；Object Extension 插件拥有业务扩展定义语义；Host 仅管理生命周期、授权与装配。  
**Starting main:** `ca4a6108c80307b76e92e88b73f2ef258eb1ca4d`（PR #836 已合并）。  
**Parent research:** [10-14 原始入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261014.md) · [原决策与剩余问题](WINDOW-RESEARCH-DECISIONS-GAPS-20261014.md) · [研究来源索引和阅读等级](WINDOW-RESEARCH-SOURCE-INDEX-20261014.md) · [PG 原子 Owner 证明](PA02-OBJECT-EXTENSION-POSTGRES-ATOMIC-OWNER-20261014.md)  
**Authority:** [Enterprise Context Resource Container v1.0](../architecture/ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md)；[Delivery Workflow](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。

## 已核代码事实

- 当前 `manager/server.ts` 将 `APP_PLATFORM_ENTERPRISE_RESOURCES_FILE`（或 Host 状态旁的 `enterprise-resources.json`）装配为同步 `EnterpriseResourceRepositoryV010`；Counterparty、Object Extension、Item、Warehouse 与 Data Import 均依赖这个同一逻辑仓库，不能因为 PA-02 的需求改成仅由 Agent 拥有的新储存。
- `providers/enterprise-context/resources.ts` 提供 JSON 文件快照与进程内事务，非跨进程 CAS；`apps/object-extension/repository.ts` 正式业务字段定义使用相同 `EnterpriseResourceV010` 资源封套。
- PR #836 的 PostgreSQL Owner 已在隔离 `pa02_*` schema 中为真实 Object Extension 封套和不可变 Owner Receipt 证明事务原子性，但与生产文件不是同一个读取权威，**不能**仅因为其 CI 通过而开放生产 WRITE。
- `EnterpriseResourceRepositoryV010` 是同步接口；PostgreSQL Node 驱动为异步，不以一个未经版本治理的返回 Promise 假冒原接口。

## 本轮选择（本轮独立交付闭环）

在现有 Object Extension Owner 模块下增加**明确的离线只读取源、目标独占式导入**，而不是改写通用 Enterprise Resource Provider：

1. `apps/object-extension/agent-owner-migration.ts`：显式初始化独立 `pa02_import_receipts`；输入原始 `enterprise-resources.json` 路径、完整文件 SHA256、逐项 `contextId ↔ enterpriseId` 可信绑定、`offlineSourceFrozen:true`。**只能在所有源文件写入者已经停止后**进行人工受控迁移。此模式不是生产自动切换入口。
2. 读取既有 snapshot，筛选 `evo.object-extension / definitions / object-extension.definition`，复用已发布 schema validation，原样保存完整 `EnterpriseResourceV010`（创建者、创建/更新时间、元数据、ACTIVE/ARCHIVED 和 payload），不改动文件和其他命名空间。目标仍是 #836 已存在的 PostgreSQL 业务表，不复制新表做两套业务定义。
3. 同一 SQL 事务锁定目标 Context，验证企业绑定、空目标及不可变导入回执；逐个导入源资源并插入回执。两个独立进程使用同一文件/摘要并发时仅一个实际导入，另一个确认回执后安全返回。不同文件/资源摘要、目标已有写入、重复业务地址/字段、错误企业绑定都拒绝并全量回滚。
4. 提交前重新核对源文件字节 SHA256，防止普通迁移期间文件漂移造成半成品；但此检查**不能保证提交后源文件不再被其他进程写入**。因此生产切换前必须有停写/隔离及迁移管理权限门禁。
5. `apps/object-extension/agent-owner-postgres.ts` 添加企业作用域限定的 `listResources`，使迁移自文件的业务资源与新 Owner 的创建结果被同一 PostgreSQL 服务统一读取。Owner verifier 仍只核实真正 Owner 事务的证据，**不得将迁入的历史业务记录伪装成 Agent 执行过的成功 Receipt**。

## 实际验收方案

`tests/agent-line/pa02-object-extension-resource-migration.test.mjs`、独立 Node child fixture，现有 `.github/workflows/agent-pa02-async-read-worker.yml` 明确执行，PostgreSQL 18 服务：

- 两个独立进程竞争迁移同一文件 → 相同效果，只一份业务数据与导入证明；完整封套及归档定义不丢。
- 跨 Enterprise Context 数据读取隔离；与后续真实 Owner 创建的新资源在同一 SQL 查询面可见，Owner 独立核验仅证明该 Owner 新操作。
- 旧文件及无关企业数据不变；重复相同导入不重放，源更改/哈希冲突拒绝。
- 源文件在迁移事务中途更改 → SQL 回滚；目标业务字段冲突或错误 enterprise binding → 所有上下文一起回滚。
- 原 PR #836 的跨进程原子性和历史 PA-02 回归继续执行。

## 明确排除与下一门禁

**本 PR 不进行生产数据迁移、不中断/修改真实文件、不替换 Host 的同步 Enterprise Resource Provider、不修改 `manager/server.ts`、不接入 Agent 生产 WRITE，也不重新执行/重造 #816/#825/#828/#829/#832/#836。**

离线迁移验证完成之后，仍要独立完成“单一生产权威的可审计 Provider 切换”，使 Human 普通 Object Extension 读/改和 Agent Owner 看到同一库、阻断旧文件写入与双写分叉，并保留源备份/回滚决策；此门禁未关闭，PA-02 **NOT_PRODUCTION_READY**。另需 Host 当前身份/权限重新授权、取消与 Worker 恢复联动及真实 Human 浏览器体验。

**来源等级：** 本轮直接阅读 GitHub 当前 `main` 源码、测试、权威文件和实际 GitHub Actions；本轮**没有逐页打开任何额外外部技术网站**。先前 H01–H14 仍是历史转引/未重新核验；#836 记录的 PostgreSQL 官方文档等级沿用其原记载，不冒称本轮又查原文。

**CI evidence（首次真实专项 PASS）：** [GitHub Actions #38508584764](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38508584764)（job `115671640621`；PR #837；commit `dd8d6cfa9df2316008eaa6a811c4a52c6c7c500f`）：PostgreSQL 18、`npm run build` PASS、`node --test` 实际执行 **12 tests / 12 pass / 0 fail / 0 skipped**。日志标记 `PA02_OBJECT_EXTENSION_RESOURCE_MIGRATION` / `PA02_OBJECT_EXTENSION_IMPORT_ROLLBACK`：跨进程 2 importers、同库 Owner 读写、历史+归档封套保留、文件漂移/SQL 业务冲突和绑定错误事务回滚。原 #836 原子 Owner 回归继续 PASS。**最终合并需要最终 PR head 的相关检查 PASS**；成功仅限隔离开发数据库，不等于生产 WRITE、生产文件冻结或 Host Provider 切换。
