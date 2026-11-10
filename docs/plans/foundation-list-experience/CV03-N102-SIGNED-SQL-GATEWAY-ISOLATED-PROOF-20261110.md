# CV-03 / N1-02 — PostgreSQL DB 强制签名准入的隔离纵切（2026-11-10）

> **状态：ISOLATED_SQL_GATEWAY_PROOF（以最终 PR HEAD 真实 PG18 CI 为准）；PRODUCTION_ADMISSION=NOT_CERTIFIED。**
> 本文衔接 [N1-01 直写漏洞负向证据](CV03-N1-POSTGRES-PHYSICAL-SQL-ADMISSION-NEGATIVE-PROOF-20261110.md) 和 [七轮最终交接](CV03-C302-WINDOW07-FINAL-HANDOFF-20261109.md)。不改变 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，也不改正式 `manager/server.ts`、Railway、任何生产数据库/用户/密钥。

## 1. 解决什么，不解决什么

N1-01 已在真实隔离 PG18 证明：即使限制 `CREATEROLE`、表所有权与普通 DDL，若直接授权资源表 UPDATE/INSERT 和 receipt 表 INSERT，**应用 SQL 登录仍可绕开 Node 签名检查**。N1-02 在已存在的 `cv03_* resources + cv03_resource_receipts` 表与原 Host 的 **HMAC-SHA256 canonical receipt proof** 上，做一条**DB 强制执行的隔离正向纵切**：

- **独立不可登录的对象 Owner** 持有表、不可变回执触发器、存储的 Host verifier key 和 `SECURITY DEFINER` 函数；测试 runtime 登录仅 `USAGE SCHEMA + EXECUTE 特定函数`，不具备资源/回执表直接 DML，也无法查询私有签名密钥或重新定义函数。
- 原 [Host/Provider 签名摘要](../../../providers/enterprise-context/resource-receipt-digest.ts) 的 HMAC 包信封和原资源 `inputDigest` 由 PostgreSQL `pgcrypto` **独立验证**。函数要求当前 receipt 与 payload 的 Enterprise Context、actor、Owner、PERSONAL namespace、业务操作匹配。**有效签名仅允许提交它绑定的确切资源输入**；另将 JS canonical resource、completed receipt、Host approval 原文交由 SQL 校验其结构/绑定关系及 SHA，供现有 Provider 的历史回读方法校验。
- 使用原有资源表/不可变回执表，`pg_advisory_xact_lock` + 行级 CAS + 同一 SQL 事务插入资源和不可变成功回执；相同 idempotency key 重试仅返回已提交结果，不重复修改，两个连接竞争旧版本最多一个成功。
- 临时测试 schema 和临时角色由 CI 特权夹具创建，测试后销毁；没有可在真实 Host 上自动执行的迁移命令。HMAC 测试密钥只供隔离 CI，不是生产密钥。

## 2. 实际证据文件

- [隔离 SQL Gateway 显式 migration 生成器](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs)：本文件**仅构造 SQL**，不会执行、安装或部署。动态 schema 只接受 `cv03_[a-z0-9_]`；函数 `SECURITY DEFINER` 锁定 `pg_catalog,pg_temp` search_path；pgcrypto 使用显式 `public.hmac/digest`；只有经 owner 审核才能安装且不可直接套生产。
- [真实 PostgreSQL18 测试](../../../tests/agent-line/cv03-n1-signed-sql-gateway.test.mjs)：随机 schema、不可登录 owner、最小 runtime SQL Login，验证直接资源/回执 SQL 写入被拒，私有 signer 表读取/修改函数被拒，合法 HMAC canonical payload 能同事务 CAS + immutable receipt，错签名、改 inputDigest、跨主体、跨企业拒绝，重复 idempotency replay、双连接冲突、签名 key 停用后失败关闭。
- [原 PG18 测试工作流](../../../.github/workflows/cv03-resource-postgres-atomic.yml)：加入上述测试，在 **Postgres 18 官方 service** 的独立环境运行，并设置 `CV03_N1_ONLY_ISOLATED_GATEWAY_TEST=YES_CI_LOCAL`；测试同时强制连接 `localhost/cv03proof`，避免误指向任何 Railway/Tokyo 数据库。

## 3. 边界和不能偷换的结论

| 验收面 | 本次可证明范围 | 仍未证实 |
| --- | --- | --- |
| 物理 SQL 写入准入 | 单独的 CI 数据库内，runtime 不能直接表 DML、可用受控函数做单事务保存 | 生产 SQL Identity/GRANT、网络拓扑与备份/恢复 |
| Host 密钥证明 | PG 验证现有 Node canonical HMAC envelope、签名键不经 runtime SQL 可读 | 正式 Host signer/verifier 由谁持有、轮换、密钥与角色职责隔离；生产 KMS/密钥托管 |
| 原资源/回执一致性 | 在既有资源/回执表做最小事务 CAS 和回执不可变写 | 已按原 `stableResourceReceiptJsonV010` 传入规范化资源/回执/approval 原文，SQL 校验其与事务资源及 Host 签名绑定，再计算相同摘要；新增测试使用**现有** `getCommittedWriteByIdempotencyKey` 进行完整 canonical digest 回读校验。仍**没有**正式 Provider 的受控函数写入适配与生产切换，不能直接替换 `putIfRevisionWithReceipt`，N1 未闭合 |
| 权限与会话 | 签名包绑定 Owner/subject/企业与资源 inputDigest | 在线撤权、Feature 停用与操作签发-提交之间的竞态重验；真实 Cookie/Origin/CSRF 和两真实 Host 认证 |
| 工程范围 | 隔离 CI-only POC、文档与测试 | **不含生产部署、SQL migration、N2 Feature 安装、N3 人机保存入口、N4 浏览器/390px、N5 外部 LLM** |

**必要的 N1-03**：本次已有隔离 canonical readback 兼容测试，但仍须由 Platform + Provider/DB 安全 Owner 以正式 Owner Operation/Feature 的所有语义（合法 schema/字段、scope、撤权、异常恢复）评审 SQL 函数接口，再为正式 `createPostgresConditionalResourceRepositoryV010` 增加**强制受控的显式适配模式**（无受控函数即拒绝，不回退旧直写）；加入两独立 OS Host、丢 ACK 重启读回及不同角色正反测试。完成后，还必须由真实生产 Host/DB/密钥 Owner 进行脱敏的物理授权、迁移备份回滚与密钥托管验收，才能考虑 N2。不得因为本 CI 通过就自动修改生产开关。

## 4. 交付与并行 Owner 约束

- 独立分支、准确 `main`、Draft PR + GitHub Actions 全通过后才合入；不修改并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的三份文档或现有 CV-00～07 权威状态表。
- 与 N1-01 同样保持 `N1=NOT_CERTIFIED / Saved View WRITE=OFF`；运行时正式 `/v1/actions` 对 SAVE 返回 403，未安装 Human 页面返回 404。
- 所有新文件为**隔离、可验收、可丢弃**的 proof；外部 Eidos UI、正式 Capability Feature、现有 ActionRouter 与 PA05 生命周期完全不动。
