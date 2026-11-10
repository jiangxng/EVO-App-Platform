# CV-03 N1-04d — 真实 PA05 Manager 授权决策 → 离线签名事件 → PG18 准入与 ACK 恢复

> **2026-11-10 | 当前仅 ISOLATED_OWNER_AUTHORITY_INTEGRATION。PRODUCTION_ADMISSION=NOT_CERTIFIED；正式 Saved View WRITE=OFF。**
> 基线 `main@a9e4d9470a94ef0781891137a3238eff0cfe1f0e`，接续 [N1-04c 签名事件、短租约](CV03-N104C-AUTHENTICATED-EVENT-LEASE-ISOLATED-HANDOFF-20261110.md)、[N1-04b 读取身份隔离与 epoch](CV03-N104B-TENANT-SCOPED-SQL-READ-AUTHORITY-EPOCH-20261110.md)，不新增业务 Feature 或第二套 List 框架。

## 本轮新增的真实与模拟边界

上一轮 N1-04c 的事件全部由测试脚本生成，**不曾读取真实 PA05 的有效插件/Capability Operation 状态，也不曾调用真实 AuthorizationProvider 预执行检查**。本轮通过 [`tools/cv03-n104d-isolated-pa05-manager-authority.mjs`](../../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs) 把**真实代码实例**接入隔离决策：

- 使用既有 `createAppManagerService` / `createMemoryLifecycleStore` 安装**显式测试** `personalSavedViewsOptInFeatureV010`；每次动态读取 `manager.listEffectiveCapabilityOperations()`，要求 owner package、feature、WRITE effect、ENTERPRISE scope、原 Action Host binding、Human 或 Personal Agent exposure、HOST_REQUIRED idempotency/receipt 全部匹配。
- 复用正式源码 `checkCapabilityOperationActionV010()`（与原 [Host Receipt Issuer](../../../manager/cv03-personal-saved-view-host-issuer.ts) 使用相同预执行门禁）调用传入的**测试 AuthorizationProvider**。无 Provider、错误、撤权、插件停用、企业/主体不一致、非法 delegatedActor、Operation 缺失时**不得签发启用事件**；非法 Host Context 直接拒绝取样。
- 审计结果包含 `evaluatedActorType` 与所用 Operation/Feature 摘要，但数据库接受的来源名仍明确是 `PA05_OWNER_TEST_ONLY`；这是**真实 PA05 管理器代码在隔离测试中运行**，不是生产 PA05 事件流，签名密钥也只是测试用。
- 在随机、独立 PostgreSQL 18 schema 内创建一个**测试专用签名 outbox 表**，一组（企业上下文、主体、Operation、epoch）只准对应一个经过签名的事件；先持久化，再通过 N1-04c 的 DB HMAC 事件 Bridge 验证与应用。故意遗漏 Delivery ACK 并重建 SQL 连接读取待交付事件后重发，数据库按 epoch 返回 `STALE_IGNORED`，不重新授权，也不延长旧租约。
- [`tests/agent-line/cv03-n104d-pa05-real-manager-authority.test.mjs`](../../../tests/agent-line/cv03-n104d-pa05-real-manager-authority.test.mjs) 用**真实现有 Host Issuer**签发 Human 已准入的原 HMAC Receipt，测试先被数据库持久准入、之后撤销 AuthorizationProvider 时旧已签 Receipt 仍被物理拒绝；变更企业上下文时验证旧企业**须显式送出 revoke**、新企业无授权不能自动继承；真实 `manager.disable(packageId)` 移除 Capability Operation 后，原 Issuer 与 DB 镜像均拒绝，模拟 AI 与 HUMAN 的独立 Host 决策。

## 不能误写为生产验收的剩余问题（重点）

1. **PA05 生命周期与 outbox 未具备生产原子性。** 真实 manager 的 `onLifecycleEvent` 只是本地同步回调，不是可与数据库 outbox 原子提交的持久日志。测试 outbox 是同一个隔离 PG 数据库的示范表，事件由 fixture 主动入队；尚无正式事件签发人、生命周期事务后的可信恢复游标、多 Host 事件源、多轮换 key、事件总线重放及全量快照修复。离线签发签名无法自动保证“Feature 已停用但事件根本没送达”；短租约最多约束模型中的陈旧窗口。
2. **生产 SQL 身份映射尚无协议。** N1-04b 使用 PostgreSQL `session_user` 与（企业、用户）一对一绑定的隔离登录；真实 Host 可能用共享连接池账号。不得把多主体共用的 SQL 用户直接当作认证 Principal。必须由 DB/Host Owner 选定可信、租户隔离、可轮换的绑定方案，并补 Human/Agent、撤权/企业切换负例。
3. **个人视图命名空间与真实 Domain Owner 不同。** [实际 Saved View Domain Owner](../../../providers/enterprise-context/personal-saved-views.ts) 计算 `namespace=evo.saved-view.personal.<sha256(JSON.stringify([enterpriseId,subjectId]))>`；当前 N1-02 试验性 SQL Gateway 却要求 `evo.saved-view.personal.<subjectId>`。本轮测试以**明确标注的隔离输入**验证真实 Host 签名与数据库事件准入，不代表原 Eidos/Domain Owner 的实际资源地址已经互操作。正式接线前，必须依据 Domain Owner 的规范算法统一 SQL 检查、SQL 只读 scope、历史回执、测试数据与升级迁移，且不得放宽跨主体约束。
4. **授权 ActorType 镜像维度不完整。** 真实 Capability Operation/AuthorizationProvider 对 Human 和 AI 可以得出不同结论；当前 N1-04b 的数据库 `cv03_n1_operation_policy` 只以 `contextId, principalSubjectId, operationId` 做键，**没有 actorType**。本轮记录 actorType 并实测真实 Host 拒绝未经许可的 AI，但**没有**证明 SQL 在 Human 允许而 AI 不允许时仍能独立区分；要将 actor type/binding/permission epoch 纳入物理准入键及签名绑定，然后分别验收两类调用。
5. **时效与密钥仅隔离候选。** N1-04c 90 秒租约、5 分钟 Host Receipt 上限不是批准的生产 SLA；没有实际 KMS、持久密钥保管/轮换、真实 PostgreSQL role/GRANT/SQL migration/backup/rollback、跨两真实 Host 部署和 Human 390px/browser/external LLM 验收。

## 工程事实与下一步

| 层级 | 真实覆盖 | 状态 |
| --- | --- | --- |
| 源码 + 真实管理器实例 | 实际 Feature install/disable、真实 Capability Operation 读取、现有 Action Host authorization gate、现有 Host receipt issuer | 本 PR 的隔离 CI 验证（以最终 HEAD 日志为准） |
| PostgreSQL 物理验证 | 随机 PG18 schema、NOLOGIN 对象 Owner、独立 Delivery SQL 登录、Host HMAC receipt 与 DB HMAC event、有限授权、持久队列 ACK 丢失与重放 | 仅隔离数据库 / 无生产用户数据 |
| 正式生产准入 | 可靠 PA05 事件 outbox/签发人与 DB 授权一致性、actor-scoped key、真实 namespace、真实 SQL 身份 / 密钥 / DBA Migration、断链恢复验收 | **NOT_CERTIFIED** |
| Eidos/Human + 外部 LLM Agent | 正式 Feature UI/390px/浏览器与外部模型实际调用 | **OPEN** |

**下一工程（N1-04e）**：优先修复**实际 Saved View namespace 算法**与**SQL actor-specific policy**；再在独立 Host/Provider 权威域设计真正持久、可审计、事务级 outbox + PA05 可信签发事件 / Snapshot 重建，并由 DB Owner 签收主库角色/密钥/迁移/轮换。仍不得因为本次隔离安全 CI 全绿就修改 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、公开保存 Action、部署 Railway 或合并与 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 冲突的文档。

**窗口治理：** 本轮仅新增测试用 manager-authority 工具、PG18 真实集成回归与 workflow、本文/README 导航。单独分支 Draft PR、精确 HEAD 全部 CI 绿后再合入 main 并删除过程分支。保持轻量 Host、V3/Eidos 现有架构、Human/Agent 共用 Operation、真实/模拟验收级别区分。
