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
