# CV-03 / C3-02：个人私有 Saved View 隔离 Host/Agent 纵切（2026-11-09）

> **状态：ISOLATED_IMPLEMENTATION_IN_PR / NO_PRODUCTION_REGISTRATION / RECEIPT_CERTIFICATION_OPEN。** 工程 PR [#1180](https://github.com/jiangxng/EVO-App-Platform/pull/1180)；本文件不构成生产 Enabled、自然语言真实模型成功、Eidos UI 或 390px Human 验收的证明。依据：[#1179 PostgreSQL 条件写](CV03-C301-POSTGRES-ATOMIC-RESOURCE-PROOF-20261109.md)、[CV-03 设计门禁](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md)、[唯一八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。

## 1. 设计与实现：不重建任何框架

| 部件 | 采用的项目权威 | 新增与不变的边界 |
| --- | --- | --- |
| Collection Owner | 原 Business Dictionary 的 `dictionary.collection.query` READ 与同一 `AppActionRouter`；其他领域后续按现有 owner 合同注册 | **每次 LIST/GET/SAVE 再调用有权限的当前 Collection READ** 取得 `collectionId`、`schemaRef`、`readableFieldIds`；只缓存 View 配置，不保存任何业务行、选项或数据快照 |
| Platform Feature | `host-enterprise-context-provider` 原包下新的 opt-in `FeatureManifestV010`；原 `platform.capability-operation` 声明 READ/WRITE；原 `ActionRouter` / 动态 `createCapabilityOperationActionPreExecuteV010` | 未把新 Feature 加入生产 `catalog/seed.ts` 或 `manager/server.ts`，需经单独 Host owner 准入才能注册；不增加第二套插件容器 |
| Personal Agent | 现有 `evo.capabilities.search/describe/invoke.read-plan/invoke.write` | Agent 与 Human 使用相同 Host 操作 ID、授权、业务 owner 和 PostgreSQL 存储；**测试是真工具调用，非外部 LLM 自主选择工具/语言对话** |
| 私有资源 | [共享 PG 条件写入适配](../../../providers/enterprise-context/resources-postgres.ts) | 仅接收 `SHARED_POSTGRES_TRANSACTION` 适配器；从可信 `principal.subjectId + active.enterpriseId + contextId` 派生强隔离资源地址，输入 `ownerSubjectId/enterpriseId/visibility` 一律拒绝，不允许重建另一个业务 owner |
| 主体防泄漏 | 只读投影当前有权字段、Filter/Sort 校验 | Query 只允许 `view/search/sort/direction`，交由源 owner 校验；列需是 `readableFieldIds` 子集，最多 20 个；保存后读取仍会重新检查 Schema 和列权限。旧 Schema / 来源撤权 / 停用 Feature 必须不返回私人视图 |
| 写入治理 | Platform WRITE `writeSafety: {idempotency: HOST_REQUIRED, receipt: HOST_REQUIRED}` | 强制调用**由可信 Host 注入**的 `assertHostWriteReceipt` 才能执行写入；未注入时 fail-closed。测试夹具以显式 stub 证明注入点；**没有在本 PR 签发、持久化或验证真实 Host receipt，不能以 stub 冒充认证** |

## 2. 验收证据粒度

- **隔离真实数据/路由/数据库**：`tests/agent-line/cv03-personal-saved-view-postgres.test.mjs`，由现有 `.github/workflows/cv03-resource-postgres-atomic.yml` 的 PostgreSQL 18 容器运行。字典是实际 `BusinessDictionaryRepositoryV010`，查询由其现有 `ActionRouter` 重新授权。
- **正向**：Human WRITE → Agent `invoke.write` 有权更新 → Human READ 与 Agent `invoke.read-plan` 同视图 revision/配置；两个 Person、两个 Enterprise 同名视图相互隔离；新数据库连接 readback。
- **负例**：无权限源、WRITE 撤权、隐藏字段、伪造用户/企业/共享作用域、非法查询/SQL、旧 revision、Schema 漂移、停用插件、无可信 receipt、Memory Provider 冒充 PG。每次结果与测试 PR 的**最终准确 SHA/CI**核对；并发 CAS 已另由 #1179 真实 PG 证明。
- **未覆盖**：真实 Host durable receipt 的 issue/finalize/reconcile、未知 WRITE retry 的独立回执核验、真实用户登录/外部 LLM、390px Eidos 保存/切换 UI、正式 PG 数据迁移/部署。**它们仍是 OPEN 门禁**，不因 isolated test 通过就关闭。

## 3. 交接与下一步

1. 在已存在的 Host WRITE/Receipt owner 中为 Saved View 实际提供受管 `assertHostWriteReceipt`（不可来自用户/模型入参），验证 **Host durable receipt+idempotency / unknown ACK readback**；当前 `writeSafety` 元数据本身不能担保 receipt 已落地。
2. 正式 Provider owner 确认生产 PG authority 的备份、迁移、回滚、数据主体隔离、字段版本升级和跨 Worker 同主库；Railway 当时服务 Offline，不要把隔离 CI 当线上成功。
3. 在既有 Eidos Catalog Browser 消费权限裁剪后的个人 `views[]`，提供真实 Human 保存入口、切换与错误恢复；移动 390px/键盘签收需独立 evidence。
4. C3-03 企业共享视图、C3-04 真实自然语言和完整恢复闭环均不在本阶段。窗口接续时读准确 main/PR SHA、审查设计 owner，禁止静默开启生产 Feature。

**实现安全基线：** 只有 Person 的真实 Enterprise Context、当前合法源 READ、可信 Host WRITE receipt + 原子 PG 版本提交全部成立，保存才被视为成功。该 PR 的隔离测试并未闭合所有生产前置。
