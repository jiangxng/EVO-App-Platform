# CV-03 / N1-05c-11 — 东京运行中 Host 真实授权来源 + 原库 PostgreSQL 目录只读盘点

> 2026-11-12；接续 [N1-05c-10 生产切换 Owner 契约](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md)。目的：**用真实运行时有限证据减少 Owner 签署未知项**；不重复已完成的合成 `cv03_n105b_qa` SQL 测试，不接线、不迁移、不放开 SAVE。方案 A、`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 SAVE POST 403 和未注册 GET 404 不变。

## G 源码、边界与本轮新能力

- 2026-11-12 原文读取 [`manager/server.ts`](../../../manager/server.ts)：实际运行 Host 使用 `APP_PLATFORM_STATE_FILE`（文件/内存），ProviderBinding 从 `APP_PLATFORM_PROVIDER_BINDINGS_FILE` 或生命周期同目录的 `provider-bindings.json` 读取；`resolveAuthorizationProvider` 动态选择有效 Provider；静态授权来自内置规则和 `APP_PLATFORM_AUTHORIZATION_POLICY_JSON` / overlay。`host.static-authorization` 是内建 Provider ID；**Provider 的存在/Feature active 并非 PostgreSQL 授权事实**。
- [`providers/authorization/package.ts`](../../../providers/authorization/package.ts) 明确静态 `authorization.check`、`host-static-authorization-provider.default` Feature ID；它与正式 Saved View 的 `host-enterprise-context-provider.personal-saved-views` 不同。
- [`deploy/tencent-tokyo/compose.yaml`](../../../deploy/tencent-tokyo/compose.yaml) 的东京 `evo` 容器挂载 `/data/platform-state.json`；现有 `postgres:17-alpine`、`evo_dev`、`evo` 管理登录和本机 `evo-data`；`APP_PLATFORM_CONVERSATION_AUTHORITY=POSTGRES` 只证明**对话**使用 PG，不证明 Saved View 授权来源已迁移。
- 新增 [`cv03-n105c11-tokyo-live-authority-readonly.yml`](../../../.github/workflows/cv03-n105c11-tokyo-live-authority-readonly.yml) 独立 Actions：PR 仅对源嵌入 shell/Node 语法检查；受保护 main + 固定 SSH 主机身份时，检查**实际运行容器**中已有 lifecycle/binding 文件的可用性及已激活静态授权/Saved View Feature 和 auth binding **数量**（不记录任一企业/用户/policy 内容），以及**原 `evo_dev`** 当前 SQL SESSION_USER、database Owner、Owner 是否超管、schema 数量、PG 17 版本与 WAL archive_mode、是否存在非 QA 命名 T0 函数；全程 `BEGIN TRANSACTION READ ONLY` + `default_transaction_read_only=on`。
- 实际 Host 绑定结果仍可能随运行时 Provider 激活和健康变化；读取文件**不能**代表 `resolveAuthorizationProvider` 在一次真实请求中一定选中哪个 Provider。任何计数 0 也不证明所有授权来源均不存在；PostgreSQL 非 QA 函数名检查仅覆盖既有 N105b 函数名字，不覆盖未知命名对象。
- SQL 使用既有 `evo` 管理身份进行目录查询，因此其角色权限**不是**要授权给正式 Producer 的最小权限；不以查询成功认定 signed Host principal。脚本既不输出 env 值、DB 密码、任意 Provider ID、业务对象名/行，也不新增 Docker 文件、PG 对象、HBA、数据库用户、network listener 或容器。

## 验收和现实限制

| 验收 / 证据要求 | 允许得出的结论 | 禁止得出的结论 |
| --- | --- | --- |
| PR 精确 HEAD 源语法与项目 CI 全绿 | 有可复现的只读元数据采集程序，已通过代码检查 | 当前东京 Runtime 或 DB 物理已验收 |
| **main** 触发的 `live-host-and-pg-catalog` 真实 Actions 原始日志含 terminal marker | 既有 Host 容器文件元数据与原库 PG catalog 在当时读得；SAVE OFF、未注册 Feature 未激活 | PA05/Provider 已统一 T0，数据库已上线正式 Schema、生产签名已批准 |
| 原始 PG session 是 `evo` 且 Owner roles 为超级用户 | **当前原库宿主访问具有高权限风险**，Owner 应单独提供生产最小权限 Principal | 可以把 `evo` 超管 SQL 登录直接作为签名 Producer |
| 原始 PostgreSQL `archive_mode` 值 | 实际 WAL archiving 设置的一个片段 | 已证明或否定全部 offsite PITR / backup 体系 |
| Provider file/binding 计数及 Feature active | 当前持久生命周期与 ProviderBinding 的局部拓扑 | 请求路径的动态 Provider 确定身份或所用授权事实源 |

凡主线 Actions 红灯要读取**原始 job log**与实际拒绝标记，不能将绿色 CI 提前当物理证据。纯 docs PR 不会触发东京 runtime 发布；这个只读 workflow 若触发也不会部署镜像。

## Owner 签收输入与下一步（D/P）

- **PA05 + AuthorizationProvider Owner**：以本次文件/Feature/binding 状态为现状输入，逐个决定哪些字段转入真实同一 PG T0，原 FileLifecycleStore 保留哪些**非授权**状态；最终有效 Provider ID 必须由正式 Host/Owner 具名批准并提供签名，不靠静态文件计数推断。
- **DB Owner**：确认实际 `evo_dev` schema、owner、least-privilege SQL LOGIN、T0/Outbox schema、迁移、向后/向前回滚、完整 Scope/tombstone snapshot 和离线恢复 watermark；本脚本无法替代 DDL/GRANT 签收或 PITR 演练。
- **Security/Ops**：正式签名 Producer/KMS/key custody、旧身份撤销、异物理 Host partition、冷启动与事故回滚责任仍待独立证据。
- **Domain Owner**：继续保留现有 Eidos + Platform 行为与 Human/Agent 分主体授权；不触碰 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的 Owner 受管文档。
- 独立审批和完整 Scope 恢复契约没有取得前，正式 Host T0/AuthorizationProvider 最小接线仍 **BLOCKED**；Issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 保持 OPEN。

## 本次来源分级

- **G 已读项目原文（2026-11-12）**：上面的 Host/Provider/Compose、现有东京只读流程 [N105b original DB inventory](../../../.github/workflows/cv03-n105b-tokyo-db-readonly.yml) 和 [N105c 原库 ACL read-only](../../../.github/workflows/cv03-n105c-tokyo-original-db-acl-readonly.yml)。本轮是新的**在运行 Host Lifecycle/Provider + 原数据库 Owner 关联盘点**，并非再次测试 QA Producer/HBA。
- **G 历史引用，未本轮重读原始日志**：PG17 QA、SCRAM、双 Host SQL LOGIN、两 Node OS 进程、原库 ACL/HBA：见 [N105c 详细研究索引](CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md)。
- **P**：真实生产 schema/Signer、Owner Reviews、完整 Scope/PITR/跨物理 Host 失败注入。此 PR 不新增第三方来源，无外部原文访问等级升级。

## 现场证据（合并后由实际 Actions 填写，不能预填 PASS）

- PR：待创建；精确 HEAD CI：待核验。
- main 合并 SHA：待核验；东京实际 Actions：待运行/检查；Branch Hygiene：待核验。
- 不允许以本文件的说明取代实际 Actions 原始日志。
