# CV04 / NEXT-05b — 东京运行中 Host 与原业务 PostgreSQL 的正式 EXPORT 关闭状态只读验收

> 2026-11-12；独立工作线基线：`main@ef705935332d5b13976ad8459e193e99a59df0c3`，继续 #1285 NEXT-05a。目标是**收集真实运行环境对 CV04 正式 EXPORT 尚未开启的狭义证据**，而不是创造新的准入权威。Issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 仍 OPEN/PENDING；PR [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 受管文件不修改。正式 EXPORT OFF、CV03 N1=NOT_CERTIFIED、SAVE OFF 不变。

## 1. G — 已读原始来源与差异（2026-11-12）

| 已读等级、标题与原始地址 | 原文事实 | 新增证据用途 |
| --- | --- | --- |
| **A / 已读源码** — [真实 Manager HTTP Host](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/manager/server.ts)、[Catalog Service](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/manager/service.ts) | `GET /v1/catalog` 返回 Manager 的 `listCatalog()`，`GET /v1/platform/snapshot` 返回现有生命周期 snapshot；Provider effective/bindings 另各有 GET。没有可用的、未经 Owner 授权的正式 EXPORT POST 测试入口。 | 从**实际东京运行进程**查询 Catalog 中是否出现正式 `dictionary.collection.export.job.request/worker/download` Operation 名，不执行 POST，也不输出原始响应或企业用户数据。Catalog 缺名不是整个 ActionRouter 所有动态命令的完整否定证明；与 #1285 版本化源码关闭门禁互补。 |
| **A / 已读源码** — [先前 N105c11/12 东京实机只读 Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/.github/workflows/cv03-n105c11-tokyo-live-authority-readonly.yml)、[原东京 Docker Compose](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/deploy/tencent-tokyo/compose.yaml) | 既有主线只读流程可使用 pinned SSH identity 和 `evo-tokyo-dev` 环境，运行中容器自身通过 `http.get(127.0.0.1:4100)` 读取 JSON；原库是 `evo_dev`，POSTGRES 17，原 `evo` 登录是超管。之前 GET effective/bindings 得到单一静态 AuthorizationProvider 候选，但这**不等于一次真实业务授权决策**。 | 复用**同一**既有部署读入口；新的物理检查只加 CV04 live Catalog + 非 QA 命名 SQL 目录的具体证据，伴随 Provider 候选漂移监测，不重复 PA05 合成 T0/QA DDL。 |
| **A / 已读源码** — [#1285 源码 + Live GitHub 关闭门禁](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/tools/cv04-next05-production-authority-release-gate.mjs)、[真正 SQL Signed Gateway](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/tools/cv04-isolated-signed-export-gateway.mjs) | 前者核对 GitHub #1212/#1184、Manager/Catalog 源码、加密存储/Lease/Owner/Dispatch 的 test-only 拒绝；后者运行在隔离 `cv03_*` Schema 并使用测试专属签名密钥，**未挂载正式 Host**。 | 此阶段给出**运行时**狭义负证据，不能凭 PostgreSQL 没有特定 SQL 名称来证明不存在未知签名函数、真实 KMS 已就绪或生产最小权限 Producer 已核准。 |
| **B / 当次真实外部状态** — [Owner 待签 #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[并行 Owner 文档 #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | 本轮开始时 #1212 仍 OPEN，#1184 仍 OPEN；仍缺 PA05/AuthorizationProvider/DB/Security/Domain 的具名独立授权。 | 真实 Owner 指认后才可规划正式 KMS/SQL Producer/共享 T0；当前流程不执行相关 DDL/DML、权限签署或生产迁移。 |

## 2. D — 本轮选择及排除方案

采用新增独立 `.github/workflows/cv04-next05b-tokyo-export-readonly.yml`，而不更改既有 CV03 只读工作流，也不引入测试 Operator/Signer/Provider。

- **PR 阶段**：只执行 shell/Node 内嵌脚本语法及只读范围的源检查；**不允许** PR 阶段访问 Tokyo secrets、真实数据库或使正式服务发生变化。
- **protected main / 显式 main workflow_dispatch**：用固定 SSH 已知主机密钥，验证当前 `main` SHA（避免过期工作流操作），检查既有健康容器和 `.last-health-pass-sha`（**预览部署 SHA 与当前 `main` 可能不同**，两者必须分开报告）。运行容器内只做四个 GET：Catalog、Snapshot、AuthorizationProvider effective/bindings；证书与实际认证状态仅沿用现有东京发布验收，不冒称本 GET 新验 TLS/Basic Auth。
- **真实原库目录**：通过 `PGOPTIONS='-c default_transaction_read_only=on'`、`BEGIN TRANSACTION READ ONLY; ... ROLLBACK;` 只查询 `pg_proc`、`pg_class`、`pg_namespace` 和 `pg_roles` 的有限计数及固定登录标识，不读业务表/密钥/Outbox。断言**非 `cv03*` 隔离 Schema** 下特定 `cv04_export_%` 函数和表当前计数均为零；报告现有 `evo` SQL 登录仍为超管，不可当作未来最小权限生产 Producer。
- **输出安全**：不打印 JSON 响应、授权策略、任何 Subject/Enterprise ID、凭据、原表名称、PG 数据行。只打印固定 PASS/UNVERIFIABLE 标记、已知部署 SHA。Body 限制 4MiB，5 秒 GET 超时；失败即红灯，不能把 0 函数视为所有未知 SQL 授权来源的证明。
- **不执行**：无 HTTP POST、Docker 修改、数据库 DDL/DML、KMS 操作、授权 Source watermark 更新、正式 EXPORT ActionRouter/Catalog 注册或多机网络分区注入。不能借这个流程绕过 Issue #1212 Owner 核准。

## 3. 验收与证据等级

| 阶段 | 允许声明 | 绝对不能声明 |
| --- | --- | --- |
| Draft PR 的 source-syntax + 基础 CI 绿 | 在仓库验证只读 probe 语法与工具约束 | 真正东京 Host 已测，PG 目录已读 |
| protected main 的东京只读 Job 原始日志含终端标记 | 当时运行进程 Catalog 不列出指定正式 Export Operation、原库无指定非 QA CV04 函数/表名；当时静态 Provider 候选与旧约束一致 | SQL 上不存在未知命名函数；真实 Auth `check()` 已绑定 PA05/T0；已有生产 KMS/最小权限；正式 EXPORT 已可开 |
| 真实 PA05/Authorization/DB/Security/Domain Owners 独立具名签认 + 跨不同物理 Host 与 KMS/Outbox 故障测试 | 可单独开展 **后续** 最小生产接线 PR 并申请再审 | 本次 READONLY probe 自行给生产准入 |

## 4. C — 明确待批准与待验证

- 真实 `evo_dev` 原库中所有**未知名字** SQL Routine/Policy 并未全域语义审计；仅精确盘点了已知 CV04 前缀与非隔离命名空间。
- 真实 PA05 Lifecycle/AuthorizationProvider、full-scope DENY/tombstone 与 generation/epoch/watermark 在同一生产 ACID T0 中；持续健康/失联的 fail-closed 与 Outbox 重放，仍缺独立 Owner 认证。
- Producer Host 低权限 SQL LOGIN、签名身份/KMS custody/rotation、不同物理 Host 网络故障、主库分区和回滚、WAL/PITR 及生产 Human/Personal Agent 是后续独立工程，不用 QA 主体或 `evo` 超管代替。
- 本流程不申请人工代签 Owner，不碰 #1184 受管文件。**保持 CV03 SAVE OFF、N1=NOT_CERTIFIED，正式 EXPORT OFF。**

### B / 实际 CI 与主线物理结果

待 PR 和真实 protected-main Action 结束后以原始 run/job、准确 HEAD 与终端标记更新；本段现在**不预填 PASS**。若因发布被跳过，不等于本只读流程没执行；其物理证据来自独立主线工作流，不能引用 Tokyo deploy 的 SKIP 结果顶替。


## 5. B — 受保护 main 首次真实东京物理证据（2026-11-12，已读原始日志）

> **这是现场读取结果，不是上线审批。** 新 read-only 工作流通过 [PR #1286](https://github.com/jiangxng/EVO-App-Platform/pull/1286) 合并，精确 PR HEAD `b5b4209273d52d98f8b677b440b71874f10f0242`；受保护 `main@efbcaf8b7fc9228ff500fed729870736a0a04c67`。PR 阶段 source-syntax、Owner Gate、Human UI、Continuity、Lightweight Host 均成功；main-only 东京物理 Job 在 PR 上正确 SKIPPED，不能把此 SKIP 视为物理通过。

- **真实 Actions**：[CV04 NEXT-05b Tokyo read-only #43211654823](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43211654823)，[原始 Job #131160514844](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43211654823/job/131160514844)，Job 为 **SUCCESS**。本窗口直接读取其完整原始日志中的远端 terminal marker，而非仅看 GitHub 绿色摘要。
- **原始远端 marker**：`CV04_NEXT05B_EXACT_MAIN_PINNED_SSH_PASS`、`CV04_NEXT05B_EXISTING_CONTAINERS_HEALTHY_PASS`、`CV04_NEXT05B_LIVE_CATALOG_FORMAL_EXPORT_ABSENT_PASS`、`CV04_NEXT05B_LIVE_AUTH_PROVIDER_STATIC_CANDIDATE_ONLY_PASS`、`CV04_NEXT05B_LIVE_SAVED_VIEW_FEATURE_NOT_ACTIVE_PASS`、`CV04_NEXT05B_ORIGINAL_PG_NONQA_EXPORT_OBJECTS_ABSENT_PASS`、`CV04_NEXT05B_ORIGINAL_SQL_USER_IS_SUPERUSER_NOT_PRODUCER_PASS`、`CV04_NEXT05B_NOT_PRODUCTION_PA05_T0_OR_KMS_CERTIFIED`、`CV04_NEXT05B_PHYSICAL_READONLY_TERMINAL_PASS`。没有读写任何企业/用户数据和原授权规则。
- **真实运行镜像身份**：在 2026-11-12 11:44 UTC 读取的 `.last-health-pass-sha` 为 `81262c348b2abf0440ddc0501495aa9c572f2e23`（上一轮 #1284 NEXT-04b Runtime SHA），**不是**本轮 protected-main `efbcaf8b...`。实际 GET/SQL 结果针对**这份运行镜像**与当时原 `evo_dev`，不是一次新镜像发布声明。
- **数据范围**：运行中的 Catalog 没列出已知正式后台 EXPORT 的 request/worker/download 三个 Operation 标识；实时 effective Provider 只有原静态候选且该 Capability binding 为 0；Saved View Feature 未激活。原 PostgreSQL（`evo_dev`）在非 `cv03*` QA 命名空间的 `cv04_export_%` 函数数量为 **0**、表/视图数量为 **0**。原库会话 `evo` 为超管，**不具备未来正式最小权限 Producer 的身份属性**。
- **证据边界**：全程执行 Node 的既有 GET 和 PG `READ ONLY` 目录查询。这个“零计数”并未对未知名称、未来生成表或所有授权逻辑做完整审计；静态 Provider 可见不等于已测试真实业务请求 `AuthorizationProvider.check()`。一个通过的 read-only Job 不能作为真实 PA05/T0/签名 KMS/跨物理 Host 故障恢复的认证。
- **上游阻塞**：当次重新核验 [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 仍 OPEN，缺具名正式 PA05/AuthorizationProvider/DB/Security/Domain Owner 签署；正式 EXPORT 继续 OFF、CV03 `N1=NOT_CERTIFIED`，SAVE OFF。Owner 文件 #1184 未触碰。

**本轮无新的第三方网页资料、截图或附件；**全部引用为已读仓库源码、GitHub live Issue 与已执行 Actions 源日志。合并后的东京 Runtime 发布 preflight 与代码 CI 需要分别检查；docs-only 再合并不会自动部署新运行镜像。

## 6. Window 08 自动续跑 #02/07 — 原东京 Catalog 只读验收扩大为完整 Export Job 前缀（2026-11-12）

> **范围仅为现有 Tokyo preview 正在运行的 Catalog，非生产批准或泛化动态 ActionRouter 探测。** 初始受保护 main `b4c0868af6f8e893690ac59cc89234576e698360`。本节保留 §5 历史「三个已知 Operation」的原始证据范围，不事后扩大。

- **A：本轮直接读取** [现有东京只读工作流](../../../.github/workflows/cv04-next05b-tokyo-export-readonly.yml) 和 [Signed SQL 原隔离 Gate](../../../tools/cv04-isolated-signed-export-gateway.mjs)：前者的 GET Catalog 原先仅按 `request`/`worker`/`download` 三个全名查缺席；后者的 `requested_op` 允许 `expire`，因此旧真实运行检查的「未注册」结论本来**不包括** `expire` 或未来后缀。CV04 NEXT-05a 源码守卫已由 [PR #1290](https://github.com/jiangxng/EVO-App-Platform/pull/1290) 改为完整命名空间。
- **D：原地修改，不建新工作流**。在既有 `GET /v1/catalog` 内检查序列化结果是否包含 `dictionary.collection.export.job.` 前缀。保留其他三个 GET、`pg_catalog` READ ONLY 和既有 PASS marker；增加 `CV04_NEXT05B_LIVE_CATALOG_FORMAL_EXPORT_NAMESPACE_ABSENT_PASS` 并在 Host、Runner 两侧显式要求。PR 阶段原 `source-syntax` 也检查前缀的实际 Node 条件与 Marker，而非检查旧 request 文案。
- **限制**：这是 live Catalog 的字符串命名空间负证据，**不是**对动态装载的别名、所有 Host Action、真实 AuthorizationProvider.check()、业务权限或 SQL 名称的全域审计。依旧不访问企业数据、无 POST、无 DDL/DML、无 KMS/Signer、无产品 Operation 注册；东京实际运行镜像 SHA 与 workflow/main SHA 分开记录。
- **P**：#1212 真实 PA05 Lifecycle、AuthorizationProvider、DB、Security/Ops、Domain Owner 仍需具名来源 SHA/环境/角色/审议、最小权限 Producer/Signer、同 PG ACID T0 完整 Scope/epoch/generation/outbox/tombstone/watermark、迁移/回滚和两物理 Host 证据。CV03 `N1=NOT_CERTIFIED`、SAVE OFF；正式跨页 EXPORT OFF/unregistered。#1184 的三份受管文件不触碰。
- **待原始日志证明**：PR HEAD source-syntax 与基础 CI、合并后的 protected-main Tokyo READ ONLY terminal（包含新的 NAMESPACE marker）、Branch Hygiene、东京 Runtime SHA。不要将 pending 写为已通过；最终证据在本 PR 合并评论和 Actions 原始 Job 留痕。
