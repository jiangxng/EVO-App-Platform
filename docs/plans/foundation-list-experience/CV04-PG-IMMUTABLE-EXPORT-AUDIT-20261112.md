# CV-04 / 2026-11-12 — PostgreSQL 原子不可变 EXPORT 审计与物理角色拒绝

> **ISOLATED ENGINEERING / PRODUCTION GATE STILL CLOSED.** 接续 [CV04 加密 PG CAS](CV04-ENCRYPTED-POSTGRES-EXPORT-JOB-20261112.md)、[原 Dictionary Owner 任务](CV04-DICTIONARY-EXPORT-JOB-OWNER-20261112.md)。本阶段复用 CV-03 的 `EnterpriseResourceConditionalAsyncRepositoryV010` 和 `cv03_*` 隔离测试 Schema；不修改 CV-03 生产 PG gateway、N1 SAVE 安全门禁或 #1184 正在管理的三份文件。

## 目标与已选择方案

上一阶段在加密 JSONB envelope 的 `meta.audit` 记录任务事件，业务代码验证 CAS 前缀不可重写，然而**没有独立数据库审计表**。单靠先写 Job、再应用层写审计会有两个独立提交的失败窗口。选择在 **原 PG Resource INSERT/UPDATE 的同一个 SQL transaction** 加上 PostgreSQL trigger：每个新 `meta.audit` 事件既保留在加密 envelope 的 AAD，又原子追加到独立 `cv04_export_audit` 表；任何失败回滚整个 Job revision。保留同一 Domain Owner/任务状态机，不增加第二套业务 Store。

[隔离显式 DDL + 原子触发器](../../../apps/business-dictionary/export-job-pg-audit.ts)：

- 只允许预先创建的 `cv03_[a-z0-9_]*` 测试 Schema，`NODE_ENV=test && isolatedTestOnly=true` 才能准备或读取；**没有自动部署/生产 migration**。
- Schema `cv04_export_audit`：`context_id/job_id/ordinal` 主键，`event_id` UNIQUE，`stage/occurred_at/rows_count/bytes_count/code` 元数据，不复制 CSV、字段、明文业务行、原始授权 Token 或 SQL 凭据。
- 原 `resources` 记录发生 CAS `INSERT/UPDATE` 时，触发器只拦截 `evo.dictionary.export-jobs` namespace，检查业务 resource schema、字段、精确 revision、首事件 REQUESTED、旧历史完整前缀、新事件 shape，然后逐个追加事件；任何审计写入冲突意味着整个资源更新事务回滚。
- 审计表 `BEFORE UPDATE OR DELETE` 触发器拒绝修改历史；**SQL 表所有者或超级用户仍可停用触发器或 TRUNCATE**，因此此机制不是可对抗 privileged DBA 的 WORM，也不是正式 PA05 签名/独立不可变外部账本。
- 另建真实非超级用户、无 DDL/Resource DML/审计 SELECT 权限的 SQL login 做物理拒绝测试。既不允许它查询所有企业的审计，也不允许它绕过 Host 认证直接读明文 JSONB 或提交历史。**没有认证过的 tenant-scoped SQL gateway/function 前，绝不可对该账号额外 GRANT DML**；安全登录权限的“全否定”测试不等于生产 Owner 能完成数据库业务写入。

## 可机器验收的测试（状态以真实 CI 为准）

[独立 PostgreSQL 16 测试](../../../tests/agent-line/cv04-dictionary-export-pg-immutable-audit.test.mjs) 使用真实独立 PG 连接/新随机 Schema、独立低权限 SQL login，验收：

1. Dictionary Owner 的 REQUESTED、STARTED、COMPLETED、READY、DOWNLOAD_AUTHORIZED 历史由 PG trigger **同事务生成独立 6 条元数据事件**；直接查询 DB JSONB 和审计表无业务私密字符串；错误 AuthProvider 时无“假授权下载”事件。
2. 直接 SQL UPDATE/DELETE 审计历史被触发器拒绝；伪造已有事件历史或给新事件注入 CSV 字段，使业务记录 CAS 整体回滚；合法业务仍可继续完成。
3. 真实不同 SQL 登录没有资源表的 SELECT/INSERT/UPDATE，亦没有审计表的 SELECT/UPDATE/DELETE；任何尝试均返回数据库 permission denied。
4. 两 PostgreSQL 连接竞争同一个 QUEUED 任务只有一方 CAS 成功；独立审计按版本连续，无假 COMPLETED。
5. 不安全 Schema/非测试 DDL 一律拒绝。新增 CI 还要保持原加密 PG 5/5 和文件 Owner 8/8、Chromium、Continuity、Lightweight Host，不开新产品 Action。

## 未决正式生产条件

- **真正 Host `dictionary.export` Capability / ActionRouter**：需与 READ 区分并经过独立 Permission Provider、真实 Enterprise revoke 与插件停用，Human/Personal Agent 使用同一正式 Owner；目前不注册产品 Operation，更不允许模拟 Principal 冒充 OIDC 登录。
- **认证 SQL Gateway/角色隔离**：持久 Worker SQL login 不可持有广泛的原 `resources` DML；须参考 CV-03 已有 SQL gateway 采用经 Host 验证的最小权限 admission，并在多个真实物理 Host/SQL login 验证，**不能复用 CV-03 saved-view 签名假装 EXPORT 已授权**。
- **生产审计/密钥/数据留存**：可追溯、不可被业务服务账号删除的独立 audit writer；密钥轮换/KMS、队列速率限制/公平度、主动 TTL 清除与重复取文件的权限重验证。只有认证后才允许新的正式 Export Action、Eidos 下载按钮及正式 Agent Tool。
- **安全门禁**：`N1=NOT_CERTIFIED`, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, formal SAVE POST 403 / unregistered GET 404；所有东京生产数据、账号/DB 角色均保持未变。本轮改变的只是测试可选 SQL 工具与未注册运行时代码；CI/东京镜像更新不能等同 EXPORT 生产可用。

### 研究资料状态

此纵切的依据均为 2026-11-12 直接读过的项目源码：[已有 PG 条件写合同](../../../contracts/enterprise-resource.ts)、[PG 资源实现](../../../providers/enterprise-context/resources-postgres.ts)、[SQL runtime role 反例](../../../tests/agent-line/cv03-postgres-runtime-role-admission.test.mjs)、[Capability Fabric Host 权限](../../../manager/capability-operation-access.ts)、[原 CV04 owner](../../../apps/business-dictionary/export-jobs.ts)，以及本轮 CI 实际日志。没有假称新查阅第三方资料、没有触碰正式数据库。
