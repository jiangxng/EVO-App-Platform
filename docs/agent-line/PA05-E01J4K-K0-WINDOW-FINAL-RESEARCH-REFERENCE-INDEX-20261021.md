# PA-05 / E01J4J–J4K / K0 — 最终研究资料与决策参考索引（2026-10-21）

**类型：** \`RESEARCH_REFERENCE_INDEX / FINAL_WINDOW_HANDOFF / EVIDENCE_CLASSIFIED\`。配套[简短入口](PA05-E01J4K-K0-WINDOW-FINAL-HANDOFF-ENTRY-20261021.md)。  
**仓库/分支：** https://github.com/jiangxng/EVO-App-Platform · \`docs/pa05-e01j4k-account-scope-20261020\` · [文档 Draft #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)。  
**范围与遗产：** 本文件是 2026-10-20 本窗口 #01–#07 的**归纳和最终判定**，不替换已保存约 47KB 的[原研究索引 §§0–18](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)、[原阶段接续 §§一–九](PA05-E01J4K-K0-WINDOW-HANDOFF-ENTRY-20261020.md)、[J4G–J4J 研究遗产](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)、[J4K 方案记录](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)。上游文档的每个原始 URL、章节、历史正/反证据和分支 SHA 保持可回溯，**不要重新研究已经完成的 PostgreSQL18/OAuth/Lease/NIST 常规章节**。

## A. 本轮目标、硬性要求与最终状态

**目标：** 从 J4J 仅本地协作排他继续 K0 可信多 Worker 终止与生产身份治理；审计连接到的生产拓扑、Railway drain/Node SIGTERM 链路、GitHub Actions/外部调用者；验证 PROCESS stop/shutdown/fork 竞态，保存精确来源及事实/判断/未验证分界。应完成真正可执行的隔离测试，而非仅写说明。

**用户硬边界：** 并行工程分支独立；不覆盖 BEX、CP03、Eidos、2D、\`project.status.json\` 或生成的全局 HANDOFF；不合并可能触发 Railway 的 Draft，不运行生产 Validator，不重启/停机/扩缩容、不读生产 Secrets/SQL、不自动删 SIGKILL 后的锁、不因测试 IdP/单数据库 true/本机锁/心跳或 Lease 过期宣称可信全局停止。Production material WRITE 永远维持 OFF，直到明确的生产认证和授权流程。

**截至 2026-10-21 只读控制面刷新：** GitHub \`main@ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9\`；Railway Host deployment \`5c88b3df-8a6c-4225-976d-cc2ccda97d9e\` SUCCESS、1 running/0 crashed，其他 4 个可见服务 Experience Compiler / Host Validator / EVO Runtime / Postgres；Validator 0 running。以上仅为**已连接项目**的有限清单，不构成企业全域 Worker 或组织权限完整证明。

| 工作线 | 当前准确提交（此索引入档前） | 真实检查 | 不可跨越的结论 |
| --- | --- | --- | --- |
| 已合并 J4J [#1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) | 原工程 \`1fba63927a80f2e9658b8608bb5a92a9849abcdf\`，merge \`e123924af8bdd1214a4aec6bfaf358c5afb9f445\` | 三 PG18 [#39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722) 28/28，工程 45/45；合并后 PG18 [#39361578987](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39361578987) 28/28 | **ENGINEERING_BOUNDED_PASS**：同一 POSIX 域合作排他，非多 Worker stop |
| K0 文档 [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) | \`bcf897fad0c9d8a1bb6501f17d496c0994e56e15\` | 7/7 SUCCESS；**此归档入档后重新查新 HEAD** | Draft 文档线，不触碰其他工程 |
| Host 顶层关闭 [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) | \`caccb1b60358b453ef471eaf6abecf1593e4965c\` | 45/45 SUCCESS，Lightweight Host 201/201 PASS | Draft、未生产部署；失败清理继续尝试/HTTP 503 |
| PROCESS 负面实证 [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) | \`a1e8a0941ff5b796816aaea0904b89533191a239\` | 5/5 SUCCESS，真实 Node child 旧缺陷复现 | Draft，**通过即风险被复现，不是安全修复** |
| PROCESS 正向修复 [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | \`c15ce1f5225272b26d14f5b564a2a6b9f0582270\` | 5/5 SUCCESS，九项本地测试通过 | **ISOLATED_PROCESS_LIFECYCLE_NINE_CASE_BOUNDED_PASS**，Draft/未部署 |
| 主线独立反面证据 | [Ecosystem schedule #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504)，\`main@eaa5e813...\` | 1815 total / 1723 pass / **10 fail** / 82 skipped | 仍为真实旧版本负证据；不同 SHA/不同范围 CI 绿灯不能当作同范围问题已修复 |

**认证否决：** K0、完整 E01J4、PA05-05 E01–E05、W06 均 \`NOT_SIGNED\`；Issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988) / [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) / [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 三项在 2026-10-21 再查均 OPEN；production material WRITE OFF。

## B. 2026-10-20–21 原始技术资料索引：阅读等级必须如实注明

以下 \`DIRECT_PREVIOUS_TURN\` 指**同一长聊天窗口的前面轮次，真正打开过原始页面/源码/日志**，而不是仅此最终交接调用重新下载的资料；\`INHERITED_EARLIER\` 是从更早的原始研究文档继承，不得冒称本次亲自阅读原官方全文；\`SNIPPET_ONLY\` 不构成正式证明；\`NOT_VERIFIED\` 表示缺原始权威观测。

### B1. 已在本窗口直接阅读的 Railway 官方原文（访问日期：2026-10-20）

| 资料标题、原始 URL、章节 | 阅读等级 | 已读原文发现（事实） | 项目用途/自身判断 |
| --- | --- | --- | --- |
| [Railway — Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown#draining-time)，Draining time / Overlap time | **ORIGINAL_OFFICIAL_READ_DIRECT_PREVIOUS_TURN** | 部署更换时发送 SIGTERM，之后依有效配置排空，再 SIGKILL；可通过 Settings/配置指定 | 源码处理 SIGTERM 不能证明生产 shutdown 有足够时间；必须由 SRE 提供当前有效值 |
| [Railway — Deployments Reference](https://docs.railway.com/deployments/reference#singleton-deploys)，Singleton deploys | **ORIGINAL_OFFICIAL_READ_ARCHIVED_20261020** | 默认 singleton、默认 graceful draining 为 0 秒 | **默认值不是当前真实生产值**，不能把 Settings-pane 未知填成零 |
| [Railway — Variables Reference](https://docs.railway.com/variables/reference#user-provided-configuration-variables)，变量表 | **ORIGINAL_OFFICIAL_READ_ARCHIVED_20261020** | \`RAILWAY_DEPLOYMENT_DRAINING_SECONDS\` 描述 SIGTERM→SIGKILL 间隔、默认 0；已连接 Host/EVO 可见变量**名称**未包含该名称 | 仅能说变量名缺席；Railway 可能有其他配置层，effective drain 仍 UNVERIFIED |
| [Railway — NodeJS SIGTERM Handling](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling)，When you start your app with NPM / start Node directly | **ORIGINAL_OFFICIAL_READ_DIRECT_PREVIOUS_TURN** | npm/yarn/pnpm 包装进程可能导致 Signal 未直接送达 Node，官方建议直接启动 Node | Host 和 EVO Runtime 当前 \`npm start\`，虽 Platform script→Node，但真实 PID1/传播路径未知 |
| [Railway — slow deployments, post-deploy drain](https://docs.railway.com/deployments/troubleshooting/slow-deployments#post-deploy-drain-instances) | **SEARCH_SNIPPET_ONLY_ARCHIVED** | 仅搜过摘要，没读该原文 | 待真正读取，不能用来签生产 |
| [Railway — BullMQ job retries / DLQ](https://docs.railway.com/guides/bullmq-jobs-retry-dlq#process-jobs-and-dead-letter-failures) | **SEARCH_SNIPPET_ONLY_ARCHIVED** | 仅摘要提及 SIGTERM/Worker 收尾 | EVO 未证明上线 BullMQ Worker；不得引用为实际拓扑 |

### B2. 更早窗口原文研究遗产（2026-10-19–20，**本次最终交接只核对归档记录**）

| 标题与原始 URL、位置 | 阅读等级 | 既有关键成果/当前项目作用 |
| --- | --- | --- |
| [Kubernetes — Leases](https://kubernetes.io/docs/concepts/architecture/leases/)，Lease / Leader election | **ORIGINAL_READ_EARLIER_ARCHIVED** | Lease 仅协调存在/选主，不证明已终止实际 OS 进程；不默认生产运行 Kubernetes |
| [PostgreSQL 18 — Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html)，§13.3.5 | **ORIGINAL_READ_EARLIER_ARCHIVED** | advisory lock 仅协作者语义，不是全域 stop |
| [PostgreSQL 18 — Cumulative Statistics](https://www.postgresql.org/docs/18/monitoring-stats.html)，§27.2.3 | **ORIGINAL_READ_EARLIER_ARCHIVED** | \`pg_stat_activity\` 可以给 PG Session/Backend 证据，不能枚举操作系统 Worker |
| [PostgreSQL 18 — Administration Functions](https://www.postgresql.org/docs/18/functions-admin.html)，\`pg_terminate_backend\` | **ORIGINAL_READ_EARLIER_ARCHIVED** | 函数返回成功并非“全部 PG backend 确认已经消失”，必须后续重查 |
| [PostgreSQL 18 — CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html)，SECURITY DEFINER safety | **ORIGINAL_READ_EARLIER_ARCHIVED** | 限制函数执行授权、安全 search_path、角色及 PUBLIC EXECUTE |
| [PostgreSQL 18 — Role Attributes](https://www.postgresql.org/docs/18/role-attributes.html)，§21.2 | **ORIGINAL_READ_EARLIER_ARCHIVED** | 生产维护 LOGIN / 对象 OWNER/NOLOGIN / Worker 最小权限分离 |
| [RFC 7009 — OAuth Token Revocation](https://www.rfc-editor.org/rfc/rfc7009)，§§2.2/3 | **ORIGINAL_READ_EARLIER_ARCHIVED** | 撤销有传播时延；建立可核实 operator/credential revoke SLA |
| [RFC 7662 — OAuth Introspection](https://www.rfc-editor.org/rfc/rfc7662)，§2.2 | **ORIGINAL_READ_EARLIER_ARCHIVED** | \`active\` 和缓存新鲜度；不接受旧 ALLOW 缓存为当前维护权威 |
| [RFC 8414 — Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)，§§2/3.3/6.2 | **ORIGINAL_READ_EARLIER_ARCHIVED** | issuer / HTTPS discovery 与 audience/scope 匹配 |
| [NIST SP 800-207 — Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture)，摘要 | **ORIGINAL_READ_EARLIER_ARCHIVED** | 网络位置本身不授予信任；原则参考而不是产品落地凭证 |
| [HashiCorp Vault — Dynamic database secrets](https://developer.hashicorp.com/vault/tutorials/db-credentials/database-secrets) | **ORIGINAL_READ_EARLIER_ARCHIVED** | 短期/可撤销 DB 凭据实现范例；**未确定选用 Vault** |

原 E01J4G–J4J 的旧取消 CI/outage 等准确等级见[原研究索引 §§3–4](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)和[本轮原索引 §§3–4](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)，不要臆造过期 Actions 日志。

### B3. 本窗口确实读过的 GitHub、源码、Railway 元数据与原始 CI 日志（2026-10-20；本次再核元数据 2026-10-21）

| 原始证据与 URL | 阅读等级 | 核实结果、具体落点 |
| --- | --- | --- |
| [J4J PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) / [PG18 #39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722) / [merge 后 #39361578987](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39361578987) | **ORIGINAL_PR_JOB_ARCHIVED_AND_READ_PREVIOUS_TURN** | J4J 28/28 真实 PG18 和 45/45 工程，通过仅本地协作排他，认证总账 §66 |
| [EVO Worker entry](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/apps/worker/src/main.ts) / [EVO Compose](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docker-compose.yml) | **ORIGINAL_GITHUB_SOURCE_ARCHIVED** | repo/Compose 存在 Worker 只能证代码意图，不代表 Railway 有同名常驻服务 |
| [Platform main package.json](https://github.com/jiangxng/EVO-App-Platform/blob/ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9/package.json) / [manager/server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9/manager/server.ts) | **ORIGINAL_GITHUB_SOURCE_READ_PREVIOUS_TURN** | Railway \`npm start\`→ Node script；Host SIGTERM/SIGINT handler 存在；线上真实 PID1 传递/退出尚未实测 |
| [Host PROCESS runtime（早期 current main）](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/manager/plugin-runtime-host.ts) | **ORIGINAL_GITHUB_SOURCE_READ_PREVIOUS_TURN**，尤其 stop/shutdown 和 start/invoke 部分 | 旧版 stop 先删 map 再等 exit；shutdown 只快照 map；允许 shutdown 后重启。于是隔离 #1081 测试专门实证 |
| [Host lifecycle & PA05 protected ingress](https://github.com/jiangxng/EVO-App-Platform/blob/6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1/manager/server.ts) | **ORIGINAL_GITHUB_SOURCE_READ_PREVIOUS_TURN**，大致 §§3274–3415、6982–7073、9421–9452、9819–10219 | 默认关闭 E01D 管理注册、五类直接 HTTP/Action 生命周期及 J4D SQL-fenced opt-in；静态 guard 不等于生产 User/DBA 实测授权。详见[K0 验收表 §6](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) |
| [GitHub workflows 目录](https://api.github.com/repos/jiangxng/EVO-App-Platform/contents/.github/workflows?ref=102319de812ce65682f0c6ccb1a930e10b4e22d4) / [RUM workflow](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/.github/workflows/web-version-skew-rum-production-proof.yml) / [RUM script](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/tools/web-version-skew-rum-production-proof.mjs) | **ORIGINAL_GITHUB_DIRECTORY_AND_SELECTED_SOURCE_READ_PREVIOUS_TURN** | 153 workflow 文件目录；RUM 对生产 \`/v1/web-performance\` POST 是遥测，不是 PA05 material WRITE；此项原 K0 拓扑 §14 已发现，后续仅复核，不冒充新发现 |
| [Railway connected project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | **ORIGINAL_RAILWAY_CONNECTOR_READ_PREVIOUS_TURN_AND_REFRESHED_20261021** | 五服务、Host/EVO \`npm start\`、无独立 Cron、当前 Host 1 running；tracing/auto instrumentation 对五服务为 OFF，webhook 0、Host TCP proxy 0；不证明 HTTP/外部 CLI/SQL 直接来源为零 |
| [Railway Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) + [Node SIGTERM guide](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) | **ORIGINAL_OFFICIAL_READ_PREVIOUS_TURN** | 官方说明与实际生产生效 Settings-pane drain 之间仍存在验证缺口；当前 \`get_service_config\` 没有返回有效 draining |
| [Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) / [原 job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504/job/118530781749) | **ORIGINAL_JOB_RAW_LOG_ARCHIVED_20261020; CURRENT_RUN_METADATA_RECHECKED_20261021** | 1815/1723/10/82，App Host read-only form、localization、manager lifecycle 等独立反例；当前元数据仍 FAILURE，旧 SHA；不能从其他 PR CI 推断故障已经修复 |
| [旧 J4J CANCELLED #39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878) / [#39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769) | **ORIGINAL_RUN_METADATA_ARCHIVED / OLD_LOG_NOT_AVAILABLE** | 两项旧 run 原始日志 BlobNotFound；cancel-in-progress 是可行解释，但准确取消原因未证实 |

## C. PROCESS 竞态：由负面复现到九项正向回归的逐次原始证据

**工程文件边界：** [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 仅 \`tests/fixtures/pa05-k0-delayed-process.mjs\` + \`tests/protocol/pa05-k0-process-shutdown-negative.test.mjs\`（测试-only），[ #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 修改 \`manager/plugin-runtime-host.ts\`、同一 disposable fixture 及 \`tests/protocol/pa05-k0-process-shutdown-barrier.test.mjs\`（工程正向修复）。**它们从未合并到当前 main**。#1074 只管 Host 顶层 \`manager/host-shutdown.ts\`、\`manager/server.ts\`，工程职责不同。

| 研究时间片；原始提交、运行与 job URL | 阅读等级 | 已经实际观察到什么（事实） | 如何用于当前项目（判断及限制） |
| --- | --- | --- | --- |
| **负面首次复现**：[commit 6eeb01b](https://github.com/jiangxng/EVO-App-Platform/commit/6eeb01b01c680d1e0c90999c5a79fcc6776493c0)，[run #39426909610/job #118641659592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39426909610/job/118641659592)，2026-10-20 13:02 UTC | **ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_PREVIOUS_TURN** | \`shutdownReturnedWithChildAlive=true\`，\`shutdownSkippedInFlightStop=true\`，\`spawnedAfterShutdown=true\`，\`globalStopCertified=false\`；局部隔离 Node child 的旧缺陷真实复现。首次字段 \`stopFinishedAfterwards\` 固定写 true，**该字段自身不构成真实回执** | 明确危险的负面基线；不能以 CI SUCCESS 解释为安全通过 |
| **负面日志时序修订**：[commit a1e8a09](https://github.com/jiangxng/EVO-App-Platform/commit/a1e8a0941ff5b796816aaea0904b89533191a239)，[run #39427280985/job #118643113249](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39427280985/job/118643113249)，13:05 UTC | **ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_PREVIOUS_TURN** | 两个真实反例仍复现，\`stopFinishedAfterwards\` 此次在 \`await stopPending\` 之后记录；5/5 commit checks SUCCESS | 可信地保存原始反例/原始小瑕疵及其修订 |
| **两项局部修复**：[commit 41b4fec](https://github.com/jiangxng/EVO-App-Platform/commit/41b4fec7f153fe1df2df671a6f6030bd36d2b167)，[run #39428680055/job #118647684472](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39428680055/job/118647684472)，13:15 UTC | **ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_PREVIOUS_TURN** | \`shutdownReturnedWithChildAlive=false\`，\`shutdownSkippedInFlightStop=false\`，\`postShutdownForkDenied=true\`；1087 tests/1086 pass/1 skipped/0 fail；HEAD 5/5 | 引入 \`shuttingDown\` + 在途 \`stop()\` promises，**只**证明所测两种时序 |
| **超时 SIGKILL 与代际**：[commit c1e0341](https://github.com/jiangxng/EVO-App-Platform/commit/c1e0341951e00c9965780190e203ccfd2fa5a22d)，[run #39430410538/job #118653676285](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39430410538/job/118653676285)，13:27 UTC | **ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_PREVIOUS_TURN** | 新增 \`timeoutChildClosedBeforeShutdown=true\`、\`priorChildClosed=true\`、\`newChildReady=true\`、\`staleCleanupDidNotDeleteReplacement=true\`；1089/1088 pass/1 skipped/0 fail；5/5 checks | 子进程每一代独立 \`close\`，即使从 map 移除仍要跟踪；本地 child close ≠ 外部 supervisor 可信退出回执 |
| **并发异步 verifier / stop fence**：[commit 12dcfa1](https://github.com/jiangxng/EVO-App-Platform/commit/12dcfa1aec30e32247a865fe7c44267350e2f237)，[run #39431045554/job #118655876047](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39431045554/job/118655876047)，13:31 UTC | **ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_PREVIOUS_TURN** | \`verifyCount=1, forks=1\`；验证 pending 时 \`forks=0, lateForkDenied=true\`；6 项 \`ok #759–#764\`；1091/1090 pass/1 skipped/0 fail；5/5 | per-package starting single-flight + 提前停止准入阻止验证返回后重复 fork |
| **关闭等待取消、IPC 断线**：[commit c15ce1f](https://github.com/jiangxng/EVO-App-Platform/commit/c15ce1f5225272b26d14f5b564a2a6b9f0582270)，[run #39432525667/job #118660946764](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39432525667/job/118660946764)，13:41 UTC | **ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_PREVIOUS_TURN** | 新增 \`boundedShutdown=true, lateForks=0\`；\`boundedStop=true, lateForks=0\`；\`disconnectedChildClosed=true\`；9 项 \`ok #759–#767\`；1094/1093 pass/1 skipped/0 fail，HEAD **5/5** | 撤销的是 **Host 本地等待和迟到 fork 准入**，不等于取消外部 verifier 的真实网络计算；断线后 local child 关闭不证明 parent SIGKILL 下跨系统回收 |

**易失原始证据的保存策略：** 上表各 GitHub Actions job 可能在日志保留期后失效；完整 JSON marker、精确 job ID、日期、\`ok #759–#767\`、整套计数器已保存于 [K0 工作表 §§9–12](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[认证总账 §§83–86](PA05-CERTIFICATION-BASELINE-20261015.md) 和本索引；本窗口没有可确认的截图文件、视频或独立附件路径，**不伪造截图/附件**。单机 runner 的正常结束由 finally 清理，不代表生产行为被测试。

## D. 已采用、排除及适用范围（来源事实与独立判断分开）

| 方案 | 结论 | **来源事实** | **项目判断与条件/限制** |
| --- | --- | --- | --- |
| J4J POSIX 协作 Host file-lock | 保留局部 opt-in，默认 OFF | 三 PG18 28/28、默认 OFF、同本地命名空间多个 Host 协作排他、异常锁 fail-closed | 仅参与协议的本地 Host 可依赖；不能宣称别处 Worker 死亡 |
| 只有 Lease/heartbeat/PG advisory lock | **排除作为 K0 全局 stop 证明** | Lease/liveness 是协调或观察机制，无法证明每个 OS child 和外部 Runner 终止 | 可用于辅助 fencing，不可签 \`STOP_CONFIRMED\` |
| 单次 \`pg_terminate_backend=true\` 或空内存 runtime Map | **排除单一返回值/空清单作为停止签收** | PG 文档、代码与 #1081 负面实证证明单个信号/登记可以早于真实 child 退出 | 必须 OS/编排器独立逐实例 receipt + PG 会话前后复查 |
| K0→K6 分层：中央 fencing、完整库存、外部停机回执、PG session、Human IdP/DBA | **采用为全域主路线** | K0 拓扑只见连接的一个 Railway 项目；GitHub/Railway 并不暴露全部组织或 SQL actor | 需真实 Infrastructure/SRE/IdP/DBA 签名才可进入生产验证 |
| #1074 Host shutdown try-all + HTTP admission OFF | **独立保留 Draft** | 工程 HEAD 45/45、Lightweight 201/201；主线上未合并 | 修复顶层错误路径；没有证明 PID 1 / SIGTERM / draining，也不包办 PROCESS 子进程 |
| #1081 旧 PROCESS 负面复现 | **保留测试-only Draft，不合并为安全回归** | 两个真实反例在 CI 中复现 | 继续作为准确 before baseline，若误合并会把“允许错误发生”当长期绿色 |
| #1082 新 PROCESS stop barrier、live child close、generation、async verifier fence | **采用为本地 bounded 工程候选，Draft** | 9 项真实 local child CI PASS | 本地进程完成只支持有限生命周期工程验证；需对父 SIGKILL、启动期 hang、极端 IPC/deadline 另作验证 |
| \`Promise.race(local cancel, external verify)\` | **采用本地 fail-closed admission 策略** | 测试实证本地 stop/shutdown 可完成且迟到 verifier 不 fork | API 无 AbortSignal，不能宣称远端计算真实被取消；后续可按外部 provider 契约评估真实取消 API |
| 修改生产 \`npm start\` / draining / tracing / Validator | **未采用，缺生产授权** | Railway 官方 SIGTERM 提示和本次连接器元数据有缺口 | 配置变更与真实信号演练应为单独审批，不能在 K0 文档线擅自执行 |
| 仅 CI 全绿立即关闭 K0 | **明确拒绝** | #1082 5/5 与定时 Ecosystem 10 FAIL 属不同 HEAD/范围；外部权威缺失 | 认证门禁仍 NOT_SIGNED，production material WRITE OFF |

## E. 资料冲突与未决问题（不能把推断写成已证实事实）

1. **官方默认 0 drain vs 生产有效配置未知：** Railway 文档说明默认值；当前 \`describe_service\` 未返回 Settings-pane 的 effective draining/overlap。需要受信 Railway 操作员的只读版本化值、PID 1/启动命令层实测，再计算容器实际可关闭窗口。
2. **服务器注册 SIGTERM 处理器 vs npm 包装层信号：** 源码的 \`server.ts\` handler 已读，但 \`npm start\` 的真实 PID1/信号传播与进程树未观察；不能签“必收到且完成”。
3. **线上 Host 1 running vs 完整 Worker 清单：** 5 服务、无 Cron/Webhook/TCP proxy、tracing OFF 只说明该连接项目控制面；EVO repo 的 Compose Worker、lazy PROCESS 子进程、其他 Railway 工作区、GitHub Runner、queue/第三方维护工具和 PG backend 可能独立存在，**均需组织权威枚举**。
4. **旧 CI 10 FAIL vs 新 PR 5/5 或 main commit CI 通过：** 时间、SHA、测试范围不同；只认旧 \`test:all\` 反面证据尚无相同范围证明修复，不跨线修 BEX/Eidos。
5. **#1074 顶层 Host shutdown vs #1082 PROCESS：** 技术分工不同，不允许重复/覆盖；两者现都未合并部署。
6. **外部 verifier 本地等待取消 vs 真正网络任务取消：** #1082 证实不会迟到 fork，未证明外部 verifier 所占资源或调用停止。以后若引入 AbortSignal/remote cancellation，需独立协议、观察与实际回执。
7. **父进程突然 SIGKILL 后 child 如何回收：** 目前没有受信 supervisor 的完整实例 inventory/stop receipts；在没有独立收尸清理保证前**没有做故意遗孤测试**。后续最值得投入的不是再重复九项绿色用例，而是隔离 supervisor 证据链设计和真实负测。
8. **真实 IdP/DBA 认证：** 需可信 issuer/audience、MFA、Human 运维临时会话及撤销 SLA、PG 实际角色/grant/session、数据库凭据 broker/rotation/revocation、保留期和独立审计签字。测试 IdP 或 SQL 函数返回不能替代。
9. **GitHub 已合并过程分支清理：** [旧索引 §8.2](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 的 **9 条** \`docs/pa05-*\` 已合并远端残留分支通过 SHA/祖先/非保护/开放 PR 审计，但当前 GitHub 接口**不支持删除 ref / dispatch 现有 hygiene workflow**，因此远端实际清理 **NOT_EXECUTED**；当前 #1071/#1074/#1081/#1082 活动分支不可删除。

## F. 归档落点、章节定位、接续工作（防止研究与工程脱节）

| 主体 / 模块 | 原有及本轮落点 | 下次应做什么 |
| --- | --- | --- |
| 启动与全局权威 | [AI-BOOTSTRAP](../../AI-BOOTSTRAP.md) → [Agent HANDOFF](HANDOFF.md) → [PA05 认证总账](PA05-CERTIFICATION-BASELINE-20261015.md) | 按完整顺序只读恢复，不编辑 \`project.status.json\` |
| K0 架构已选方案 | [E01J4K 可信多 Worker 与凭据治理](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)，K0→K6；[J4G–J4J 旧研究索引](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) | 复用已读 PostgreSQL/OAuth/Lease/NIST，新增冲突才重新查 |
| 生产实际可见范围 | [K0 拓扑 §§19–29](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md) | 优先拿 SRE 的受权组织范围、所有进程及外部调用者清单、Railway 真正 draining/Node PID1 证据 |
| 具体不能签收的字段 | [K0 stop authority worksheet §§1–12](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) | R1–R8 必须由 Infra、Host Runtime、Security、DBA、IdP/Audit 真正 Owner 交付凭证；UNKNOWN/DENY 不能写 0 |
| J4J 已合并局部证明 | [认证总账 §66](PA05-CERTIFICATION-BASELINE-20261015.md)、[PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) | 仅保留 bounded PASS；无需重复其已完成工程和旧 CI |
| 顶层 Host shutdown | [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)，\`manager/host-shutdown.ts\`、\`manager/server.ts\` | 不与 #1082 重叠、不合并触发生产部署 |
| 旧反例与局部 PROCESS 修复 | [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) negative test、[ #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) \`manager/plugin-runtime-host.ts\`、disposable child fixture、positive test | 当前 9 项已通过，优先评估隔离外部 supervisor/parent-SIGKILL、child activate hang 和真实 deadline，且先能保证回收孤儿 |
| CI 正反证据 | 见上表六组精确 job；[schedule FAIL](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) | 新窗口重核对应 HEAD 实际 jobs，不把绿灯当全量或生产认证；不要跨线解决 BEX/localization |
| 独立权限/认证 Issues | [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988) / [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) / [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) | OPEN；全 E01J4、PA05-05 E01–E05、W06 仍 NOT_SIGNED，material WRITE OFF |
| 历史已合并分支 | [原详细资料索引 §8.2](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 逐个列出 PR、分支、准确 SHA | 有合规删除能力之后再实时复核并安全退休；本轮不能虚称已清理 |

**无已知新增截图/视频/附件：** 本窗口的主要不可复原证据是 GitHub Actions 原始日志和 Railway 当前设置/状态。前者已保留 run/job URL、UTC 记录时刻、test marker、计数器和固定 SHA；后者仅是连接器只读控制面快照，不存在真实 Settings-pane 屏幕截图。没有读到或生成生产 Secrets、DB dump、Worker PID 列表、supervisor 停机签名或 IdP/DBA 认证报告；**这些都尚未保存到 GitHub，因为根本没有取得可信原始材料**。

**下一窗口顺序：** \`AI-BOOTSTRAP.md\` 权威恢复 → 本次[简短入口](PA05-E01J4K-K0-WINDOW-FINAL-HANDOFF-ENTRY-20261021.md) → 本索引及原研究遗产 → 精确 HEAD/CI/main/Railway 状态刷新 → 在当前授权内继续隔离非生产和只读 SRE/IdP/DBA 证据，无权威回执仍不签 K0。