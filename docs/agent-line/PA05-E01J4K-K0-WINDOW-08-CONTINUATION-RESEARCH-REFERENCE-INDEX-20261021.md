# PA05 / E01J4J–E01J4K / K0 — WINDOW-08 研究资料与决策详细参考索引

**记录日期：2026-10-21；类型：RESEARCH_REFERENCE_INDEX / SOURCE_GRADED / UNSIGNED。**
对应新窗口短交接：[WINDOW-08 ENTRY](PA05-E01J4K-K0-WINDOW-08-CONTINUATION-HANDOFF-ENTRY-20261021.md)。
这是本窗口续跑 #02–#07 加上先前 #01 状态衔接的资料归档，**不是**生产认证或上一份 [WINDOW-07 索引](PA05-E01J4K-K0-WINDOW-07-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md) 的覆盖。早期长篇底稿另见 [逐步证据 §§1–19](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)、[K0 工作表 §§1–22](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[初始总决策 §§3–6](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)。**勿重做旧 PG18 / OAuth / Kubernetes Lease / NIST 的通识研究。**

## A. 本窗口目标、明确边界、源等级

目标：让 PA05 K0 从局部 PROCESS/协作 Host 工程测试走向可信全 Worker + Runner + 外部 Caller 清单、逐代停机、真正生产 Node/PID1 信号链与 draining、独立 Supervisor、PG backend 消失以及 Human IdP/DBA/secret rotation/audit 原始凭证的多方签收。不能把空 map、HTTP 成功、单 Railway 副本、synthetic Ed25519、CI 全绿当作全球停机授权。

用户要求：GitHub 独立分支和 PR；主线及其它窗口不能冲突；未经明确授权不合并/部署/重启/停机/修改 Railway 配置，不访问生产 Secrets/SQL、运行生产 Validator、清异常锁或在缺少独立回收保障时故意 parent Host SIGKILL；不修改全局 project.status.json、HANDOFF-LATEST 或 BEX/CP03/Eidos/2D。研究资源保留原始 URL、时间、阅读等级、版本、负证据；开发遵循先最小区别实验、实测精确 HEAD，避免同类 mock 堆积。

**阅读等级约定**：
- **DIRECT_OFFICIAL_ORIGINAL_20261021**：本窗口直接通过已连接 Railway 官方文档接口获取全文；只表示阅读过文档，**不证明**生产值。
- **DIRECT_GITHUB_SOURCE_20261021**：本窗口通过 GitHub Connector 读取指定 commit 文件、workflow、Issue/PR 原文。
- **DIRECT_CI_RAW_LOG_20261021**：本窗口直接获取 GitHub Actions 指定原始 job 日志并核对 marker/测试计数，不是单看 check-runs。
- **DIRECT_RAILWAY_CONTROL_PLANE_20261021**：本窗口通过只读 Railway 连接器取得已连接生产服务配置/健康与部署列表，受账户可见范围限制。
- **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED**：早先 WINDOW-07 或更早交接载明当时阅读过原文；**本 WINDOW-08 未逐项重读全文**，使用历史索引给出的章节和结论。
- **SEARCH_SNIPPET_ONLY_ARCHIVED / UNVERIFIED**：仅先前检索摘要，或尚无真实 Operator 证明。不得升级为来源事实。

## B. 本窗口直接阅读/核对的铁路平台官方来源（2026-10-21）

| 原文标题与网址 | 等级、章节位置 | 来源事实 / 对本项目具体用途 |
| --- | --- | --- |
| [Railway CLI — railway api](https://docs.railway.com/cli/api) | **DIRECT_OFFICIAL_ORIGINAL_20261021**；api search、api describe、--file、--raw-var | 官方 CLI 支持搜索实时 GraphQL schema 和读类型/字段，可执行只读 GraphQL。EVO 用于将 R5-01 从反复读不到字段的连接器转为**有授权 Operator** 的实时 schema 发现。当前连接器没有 CLI/任意 GraphQL 执行能力，实际查询**未执行**。 |
| [Railway Public API — Manage Services](https://docs.railway.com/integrations/api/manage-services) | **DIRECT_OFFICIAL_ORIGINAL_20261021**；Get a service instance / serviceInstance query | 官方有 serviceInstance(serviceId, environmentId) 示例，示例提及 startCommand、buildCommand、latestDeployment 等；不证明 drainingSeconds/overlapSeconds 存在于 ServiceInstance。**必须现场 describe 字段再形成查询**。见 [Operator §8](PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md)。 |
| [Railway — Config as Code](https://docs.railway.com/config-as-code) | **DIRECT_OFFICIAL_ORIGINAL_20261021**；deployment details / effective configuration、配置来源 | 实际部署可能受多层配置与覆盖影响，操作员必须以**具体 deployment 生效配置及其来源**为证。dashboard/service 现值、环境变量名列表不能替代历史部署快照。 |
| [Railway — Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) | **DIRECT_OFFICIAL_ORIGINAL_20261021**；Draining time / Overlap time | overlap 与 SIGTERM 后 draining 属于不同时间段；对照指定 deployment 记录两项秒数，不从平台默认或缺变量推断实际值。 |

**已在上一窗口阅读原文，本次主要引用其留档而非逐页重读（2026-10-20/21）**：

| 原文标题与网址 | 等级 / 来源章节 | 事实与用途 |
| --- | --- | --- |
| [Railway Deployments Reference](https://docs.railway.com/deployments/reference#singleton-deploys) | **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED**；Singleton deploys | 历史官方原文记默认 graceful drain 为 0；**平台默认不等于本生产 effective 0**。 |
| [Railway Variables Reference](https://docs.railway.com/variables/reference#user-provided-configuration-variables) | **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED**；User-provided configuration variables | RAILWAY_DEPLOYMENT_DRAINING_SECONDS / OVERLAP_SECONDS 可影响关闭窗口；变量名缺席无证明力。 |
| [Railway Config-as-Code Reference](https://docs.railway.com/config-as-code/reference) | **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED**；deploy.drainingSeconds / overlapSeconds | 对照文件/界面/环境覆盖；不能擅自更改线上设置。 |
| [Railway Start Command](https://docs.railway.com/deployments/start-command) | **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED**；Railpack and Dockerfile | 实际 Railpack 使用 npm start；仓库 Dockerfile 的 exec-form CMD 不能证明线上 PID1。 |
| [Railway NodeJS SIGTERM Handling](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) | **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED**；npm start signal handling | npm/shell wrapper 可能影响信号到达 Node，需要真实生产 PID1/PPID/handler 原始证据；**不是已证实故障**。 |
| [Railway Sandboxes](https://docs.railway.com/sandboxes) / [Quickstart](https://docs.railway.com/sandboxes/quickstart) | **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED**；isolation / lifecycle / destroy | 仅为未来获授权独立非生产 Supervisor 候选；当前连接项目没有获证的测试环境或 Supervisor。 |

**仅检索摘要，未读目标正文，不能当成结论来源（2026-10-20 早窗）**：[Railway Slow Deployments](https://docs.railway.com/deployments/troubleshooting/slow-deployments#post-deploy-drain-instances)、[Railway BullMQ retries / DLQ](https://docs.railway.com/guides/bullmq-jobs-retry-dlq#process-jobs-and-dead-letter-failures)，均 **SEARCH_SNIPPET_ONLY_ARCHIVED**；没有证据 EVO 生产使用 BullMQ。

## C. 继承但不重新研究的 OS / DB / IdP 原始资料

下列 **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED** 均由早期交接明确登记“当时读过原文”；本次制作 WINDOW-08 时未重新直接打开。查阅日期为 2026-10-19 至 2026-10-21，精确章位及更多摘要见 [WINDOW-07 §§C–D](PA05-E01J4K-K0-WINDOW-07-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md) 和 [J4K 主决策 §7](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)。

| 官方标题与原网址 | 已记录章节 / 项目具体作用 |
| --- | --- |
| [Linux Kernel — Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html) | cgroup.kill、cgroup.events populated：外部**独占** cgroup 分组回收候选；populated=0 仅对该组有意义。 |
| [Linux pidfd_open(2)](https://man7.org/linux/man-pages/man2/pidfd_open.2.html)；[pidfd_send_signal(2)](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html) | DESCRIPTION/NOTES：精确进程身份与受权限约束的信号，不能自动扩为整组/全组织证明。 |
| [Linux PR_SET_CHILD_SUBREAPER](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html)；[systemd.kill(5)](https://man7.org/linux/man-pages/man5/systemd.kill.5.html) | 收养孤儿≠杀掉仍活的子进程；systemd KillMode 为对比参考，**不代表 Railway 使用 systemd**。 |
| [Node.js child_process](https://github.com/nodejs/node/blob/main/doc/api/child_process.md) | close / exit / error / disconnect：#1082 的本地 child 退出与 stdio/IPC 关闭屏障；父 Host 死亡仍需独立观察。 |
| [PostgreSQL 18 — Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html)；[Monitoring Stats](https://www.postgresql.org/docs/18/monitoring-stats.html) | §13.3.5 Advisory Locks、§27.2.3 pg_stat_activity：应用级锁不是独立 stop 权威；DBA 对后台会话另行再查。 |
| [PostgreSQL 18 — Administration Functions](https://www.postgresql.org/docs/18/functions-admin.html)；[CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html)；[Role Attributes](https://www.postgresql.org/docs/18/role-attributes.html) | pg_terminate_backend 默认 true 可只表示信号送出；安全 SECURITY DEFINER/search_path/grant，Worker 与 DBA 最小权限。 |
| [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009)；[RFC 7662](https://www.rfc-editor.org/rfc/rfc7662)；[RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) | token revocation、introspection active、issuer metadata：生产 Human IdP 与授权撤销 SLA 的候选标准，不是已部署的真实配置。 |
| [NIST SP 800-207](https://www.nist.gov/publications/zero-trust-architecture)；[Kubernetes Leases](https://kubernetes.io/docs/concepts/architecture/leases/)；[Vault database secrets](https://developer.hashicorp.com/vault/tutorials/db-credentials/database-secrets) | 零隐式信任、Lease 协调、动态短期凭据参考；生产既未确定为 Kubernetes，也未选 Vault。 |

## D. 本窗口直接查阅的项目源码、工作流、原始 CI（2026-10-21）

| 证据与原网址（精确 commit/job） | 阅读等级及关键发现；对应模块 |
| --- | --- |
| [#1074 Host shutdown Draft](https://github.com/jiangxng/EVO-App-Platform/pull/1074)；[server.ts@e2e4af92](https://github.com/jiangxng/EVO-App-Platform/blob/e2e4af922c87b985f9834b592b86556d0e28abac/manager/server.ts)；[host-shutdown.ts](https://github.com/jiangxng/EVO-App-Platform/blob/e2e4af922c87b985f9834b592b86556d0e28abac/manager/host-shutdown.ts) | **DIRECT_GITHUB_SOURCE**。5s referenced watchdog 在所有 await 之前、先关闭监听、503 拒绝入站、清理失败非零退出。**仍有残余风险**：顺序清理链最末才运行 processRuntimeHost.shutdown()，早期 await 不返回会触发 Host 退出，未必已停 child。PR 描述已保存。 |
| [#1074 tests@e2e4af92](https://github.com/jiangxng/EVO-App-Platform/blob/e2e4af922c87b985f9834b592b86556d0e28abac/tests/agent-line/pa05-host-shutdown-error-path.test.mjs)；[Lightweight Host 原始 job 119049576795](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39547720712/job/119049576795) | **DIRECT_GITHUB_SOURCE + DIRECT_CI_RAW_LOG**。本窗口新增一项源码顺序 guard（ commit e2e4af92，原 PR #1074 分支），实际 **6/6 Host shutdown/J4J PASS**；同 Job 另一组 **304/304** PASS，精确 HEAD **45/45 checks SUCCESS**。此为静态顺序+局部真实 Host，有条件 PASS，非生产 SIGTERM receipt。 |
| [J4J 合作锁实测代码](https://github.com/jiangxng/EVO-App-Platform/blob/e2e4af922c87b985f9834b592b86556d0e28abac/tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs)；同 [CI job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39547720712/job/119049576795) | **DIRECT_GITHUB_SOURCE + DIRECT_CI_RAW_LOG**。spawn 独立真实 Node Host，向其发送 SIGTERM，正常终止后临时锁释放；SIGKILL/非零退出保留模糊锁；日志 marker cooperativeGracefulExitReleases=true / multiWorkerGlobalStopCertified=false。不是 Railway 容器 PID1。 |
| [#1081 负面测试](https://github.com/jiangxng/EVO-App-Platform/blob/a1e8a0941ff5b796816aaea0904b89533191a239/tests/protocol/pa05-k0-process-shutdown-negative.test.mjs)；[PR #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) | **DIRECT_GITHUB_SOURCE**；两项旧行为故障断言要求 shutdownReturnedWithChildAlive=true 与 spawnedAfterShutdown=true；PR 5/5 check success 只表示旧缺陷复现成功；**DO NOT MERGE**。 |
| [#1082 正向测试](https://github.com/jiangxng/EVO-App-Platform/blob/eb4743e8ed34cf3cd748c3f79781d092c62712f4/tests/protocol/pa05-k0-process-shutdown-barrier.test.mjs)；[plugin-runtime-host.ts](https://github.com/jiangxng/EVO-App-Platform/blob/eb4743e8ed34cf3cd748c3f79781d092c62712f4/manager/plugin-runtime-host.ts)；[PR #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | **DIRECT_GITHUB_SOURCE**；反向断言 child exited、拒绝 shutdown 后 fork、追踪 stopping/liveChildren 和 verifier 取消；**11 项本地真实 PROCESS**。另 2 项 cgroup 能力提示、6 项 synthetic Ed25519、10 项 synthetic inventory、1 项外部 procfs 正常退出、2 项只读 PID1，**不能把这些加成 32 个真实 Worker 停机**。5/5 精确 CI，但没有生产全域证明。 |
| [#1082 真实历史 Platform job 119030399081](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39541560856/job/119030399081) | **PRIOR_WINDOW_ORIGINAL_READ_ARCHIVED（本窗口核了 PR 源码和最终 CI 状态，没有重下载该历史原始 job）**：1124 total / 1123 PASS / 1 SKIPPED / 0 FAIL，原有 11 local PROCESS cases。保留旧索引 marker/计数及范围。 |
| [#1071 文档 HEAD e2 前一轮，实际 3da2fe8](https://github.com/jiangxng/EVO-App-Platform/commit/3da2fe8f49573f79a30dfca5e3803e9b5f516eda)；[初次失败 job 119045130566](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39546299166/job/119045130566)；[一次重跑成功 job 119046162052](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39546299166/job/119046162052) | **DIRECT_CI_RAW_LOG**。初跑 6/7，E01J2 实际 PG18 子进程 readResult 20s timeout；只重跑这个 job 一次，第二次 **28/28 PASS / 0 skipped**，最终 7/7 checks。根因仍 UNDETERMINED，不能写“首次全绿/故障已修好”；原 PR 评论保留失败反证。 |
| [#1092 Operator Issue](https://github.com/jiangxng/EVO-App-Platform/issues/1092)；[原始手册 §8](PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md) | **DIRECT_GITHUB_SOURCE**。本窗口创建 issue，规定 R5-01 生效值及来源、R5-02 PID1/Node 信号、R5-03 独立非生产 Supervisor；记录 1 条本窗口对照评论；无已核的实际 Operator 证据/assignee。当前 Owner 需领取，未对生产运行任何 GraphQL 或信号实验。 |
| [#1074 + #1082 集成审查评论](https://github.com/jiangxng/EVO-App-Platform/pull/1082#issuecomment-6308719996) | **DIRECT_GITHUB_SOURCE**。原 GitHub 虚拟 merge ref 的父节点核查：#1074 在 main@192b1948 的 merge SHA 644c638f；#1082 虚拟 merge SHA 833b8f06 **仍是旧 main@4d291fb3**。后做独立文件级对比：#1082 唯一编辑的 runtime host 在其 old base 与 main@192b1948 blob SHA 都为 7554a100...；其余 12 个新增路径在该 main 尚无文件。同路径不冲突≠联合运行 PASS。当前 main 又前进，必须刷新。 |
| [当前 main@4e21fa8d](https://github.com/jiangxng/EVO-App-Platform/commit/4e21fa8d0380168f9da0ae8a364020da1b9a3f90)；[#1094](https://github.com/jiangxng/EVO-App-Platform/pull/1094) | **DIRECT_GITHUB_SOURCE**。并行共享身份目录初始化治理；本轮 main 从 192b1948 继续前进，和 PA05 Draft 分离。 |
| [Railway 当前可访问项目](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | **DIRECT_RAILWAY_CONTROL_PLANE**。生产 environment 98b8b20c...、Ledger Configurator service a8622238...；最近观测 deployment **7e794aba-21ec-4dab-b55c-601fa071e59d** 对应 main@4e21fa8d，SUCCESS/Online，1 running /0 crashed / no pending。此为历史时间片，必须重查。实际 draining/PID1 未暴露。 |

### D.1 本窗口再次直接阅读的生产 GitHub Actions Caller 源码（2026-10-21）

仓库 [workflows 目录@main 4e21fa8d](https://github.com/jiangxng/EVO-App-Platform/tree/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/.github/workflows) 有 **153 个 workflow 文件**（目录数量，不是 153 个生产 Caller）。前期拓扑已记十条显式触生产 Host 的 workflow；本次对以下选定工作流及脚本作 **DIRECT_GITHUB_SOURCE** 局部原文核查，完整组织 Caller 数量仍 **UNKNOWN**：

| Workflow / 脚本原网址 | 已确认触发与 HTTP 行为；不能推导的内容 |
| --- | --- |
| [EOG MOBILE_READ workflow](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/.github/workflows/eog-mobile-read-production-proof.yml)；[script](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/tools/eog-mobile-read-production-proof.mjs) | 具手动 / scoped PR / main push 触发；Chrome 在生产运行，代码断言冷启动确有 1 个 POST /v1/actions **受治理 READ**。不是 material WRITE/PA05 控制权限证明；未在本窗口触发 workflow。 |
| [Browser Lifecycle workflow](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/.github/workflows/browser-lifecycle-production-proof.yml)；[script](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/tools/browser-lifecycle-production-proof.mjs) | 手动/scoped PR；监测 POST /v1/actions 次数、SSE /v1/events 重连、bfcache 恢复不新增 Action。只是观测代码，**未证明某次运行真的发出可修改 PA05 的 POST**。 |
| [Web Delivery workflow](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/.github/workflows/web-delivery-production-proof.yml) | 手动/scoped PR；本轮读到的 curl 是生产根/静态 JS GET 缓存验证，不是 lifecycle WRITE。 |
| [Mobile Task workflow](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/.github/workflows/mobile-task-inbox-production-proof.yml)；[Mobile Review workflow](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/.github/workflows/mobile-review-production-proof.yml) | 手动/scoped PR/main push；脚本导航生产 Chrome 监测资源。不能通过静态脚本认定页面 JS 没有其它网络调用。 |
| [Ecosystem Certification workflow](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/.github/workflows/ecosystem-certification.yml) | 手动 + daily cron 17 3；只证实仓库有定时 CI，不证明该 workflow 本身调用 Railway 生产 Host。此前某旧 SHA [run #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) 1815 total / 1723 pass / **10 fail / 82 skipped**，不能以不同范围的新 CI 全绿抹去。 |
| [Host action-route source](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/manager/server.ts) | 本窗口读到受保护 package evo-purchase-attention 的 install/enable/disable/uninstall/upgrade 在 /v1/actions 有 authorizePa05E01fLifecycle；无 itemId 的 install 返回 PACKAGE_ID_REQUIRED。**这是静态保护边界，不是对全部旁路/生产会话授权的完整实证**；独立 Issue #988 仍 OPEN。 |

本轮出现 scripts 路径不匹配（tools/web-security-delivery-proof.mjs、tools/web-version-skew-rum-proof.mjs 在所读 commit 返回 404），**所以不得声称已完整阅读这两个脚本的正文**；相应 workflow 文件曾读，但脚本全文待读/需核对路径。完整流程/身份/命令代码矩阵移交到 #1092，禁止自动关闭这些外部工作流。

## E. 已选架构、排除路线与适用范围（区分来源事实和工程决策）

| 方案 | 来源事实 | 工程判断、选择与硬限制 |
| --- | --- | --- |
| **中央 fencing epoch + 权威版本化 Worker/Runner/Caller 清单 + 外部逐实例 stop receipt + DB 会话再查 + Human/DBA/IdP/凭证审计** | J4J/PG18、本地 OS 案例只证明局部事实；官方 PG、pidfd/cgroup、RFC 描述单个技术的语义 | **保留的 K0→K6 架构基线，尚未完整实现**。需要组织所有权、实际生产 scope、每代 incarnation/nonce、外部权威和逐项独立签收。 |
| 仅 J4J POSIX lock、PG advisory、Lease timeout | 本地锁限协作 namespace、PG advisory 应用协作、Lease 管续约 | **排除作为全域 STOP_CERTIFIED**，可保留局部互斥或 fencing 辅助；不能杀/证明未知进程和外部 Caller。 |
| 本地 PROCESS stop/shutdown 屏障 | #1081 真负例、#1082 真正反向本地回归 | **已按本地隔离工程门禁有界通过**，但 #1082 未与 #1074 联合运行或生产部署，且只有父 Host 存活时的停机保证。 |
| 顶层 Host 5 秒 watchdog + 顺序清理 | #1074 真实源码及 CI 6/6 | **采用 fail-closed 防止无期限假性零退出**；但前段 pending 可阻止末尾 processRuntimeHost.shutdown 被调用；应由 Runtime owner决定依赖安全的并发/阶段调度，不能偷偷调序或承诺 Worker 消亡。 |
| 单看 0 Worker / empty runtime map / PG terminate=true | #1081 反例 + PG 文档 | **拒绝**，须外部精确代际确认、DB session absence、Caller/replay 审查。 |
| pidfd + 独占 cgroup v2 + 独立 Supervisor/TTL | kernel 和 Linux man pages | **只作为经授权非生产试验候选**；独占性、权限、监督者在 parent 死后继续活、可回收、不可越界是前置门禁。Runner cgroup 文件存在≠有权清理。 |
| Railway API 自行猜 drain fields / 假设默认值 | 官方 GraphQL 示例未证明 ServiceInstance 的 drain 字段；连接器不返回秒数 | **拒绝盲猜**。Operator 先在线 schema introspection，后部署详情来源与生效值匹配，未知就记 UNKNOWN。 |
| synthetic Ed25519 + 2 Worker / 3 Caller fixture | #1082 离线通过验签/对账 | **仅协议自测**；自己生成测试 key、声明全为 mock 不能证明真实止停事实或权威身份。 |
| #1081 negative CI 与 #1082 positive fix 一起合并 | 两测试对同一 bug 要求相反断言，且同一路径 fixture 内容不同 | **明确拒绝**：#1081 留证据 Draft，不合并；#1082 才是未来修复候选，亦须经授权、完整新 merge CI。 |
| Kubernetes、Vault、systemd 即生产选型 | 官方说明这些组件如何工作 | **未选型**；没有证据 Railway 用 systemd/K8s 或本组织选 Vault。 |

## F. 冲突、证据差异、下一批值得读的方向

1. **默认 0 秒 vs production effective drain/overlap UNKNOWN**。必须由 Operator 交指定 deployment 的秒数/单位、来源层、查询时间、Owner；不能从 CLI/变量缺失或 dashboard 旧值推断。
2. **Railpack/npm start + Node SIGTERM 源码 vs Railway 生产 PID1/转发 UNKNOWN**。非生产 J4J 真的给独立 Node 发过 SIGTERM，但那不是生产 npm/shell 层；需现场有权限的只读工件或独立受控测试。
3. **Host watchdog 提前 vs 子进程停机调用排最后**。进程可以异常退出但 child 未回收；进程退出/锁留存不是 Worker stop receipt。下一步只在兼容现有生命周期与有可靠非生产外部清理时改调度。
4. **#1074 与 #1082 的虚拟 merge 时间片不一致**。已读 parent：#1074 merge SHA 644c638f 首父 main@192b1948；#1082 SHA 833b8f 首父仍 main@4d291fb3。不能称它们在 main@4e21fa8d 实时联合合并通过。另有早前只读文件级核对：#1082 编辑的 runtime host 在旧 base 与 main@192b1948 的 blob 相同，其余 12 新路径未碰撞；但最新 main 变更后**必须再次核对**。
5. **#1081 5/5 PASS 是旧 defect 的可信反证**；#1082 5/5 PASS 是局部修复证据；两组 PASS 是相反含义，不能一概记“安全通过”。
6. **#1071 首次 6/7 与重跑 7/7 并存**。E01J2 reply readResult 20s 超时首轮属原始失败；重跑 28/28/0 skip 成功，原因未定位、不应说已修复或“天然 7/7”。
7. **Railway 一个生产 Host replica vs GitHub Actions/其它服务/定时 Runner/外部 Caller**。workflow 可触发，不等于有授权的 PA05 WRITE；需要穷举实际端点、command code、认证身份、持久重放及停机/重启约束。
8. **旧 Ecosystem 10 FAIL/82 SKIPPED vs 各 Draft 新 CI 全绿**。时间/SHA/workflow 范围不同，不可跨主线自行归因或清算。
9. **真实 K0 Owner 缺席**：#1092 截至最近本轮观测仍 OPEN/未指派、没有外部有效值/PID1/独立 Supervisor 回执；生产 SQL session、Human MFA/IdP issuer/audience/revocation、DBA grants/credential rotation/audit 也未签。

**最值得继续查看**（不是已读或已签事实）：① Railway Operator 对实际部署的 GraphQL 实时 schema 与部署快照；②该部署的真实 PID1/Node 信号传递及受信退出回执；③ 经授权独立非生产 cgroup/监督者实验计划；④ 全仓/组织 GitHub Actions、Validator、EVO Runtime、Agent/CLI/queue 的可达性与身份目录；⑤ DBA/IdP/审计 Owner 原始签收。对未获取信息不可补造。

## G. 模块与任务映射、易失材料位置

- 主路径：manager/server.ts → 顶层 shutdown；manager/host-shutdown.ts → 顺序清理助手；manager/plugin-runtime-host.ts → 局部 child 生命周期；manager/pa05-read-owner-*-pg.ts / pa05-read-owner-trusted-prestartup.ts → epoch/DBA/Host scope；manager/server.ts 的 /v1/actions → 外部 Caller 受保护入口。
- 对应执行：[PR #1071 文档](https://github.com/jiangxng/EVO-App-Platform/pull/1071)；[PR #1074 Host shutdown](https://github.com/jiangxng/EVO-App-Platform/pull/1074)；[PR #1081 negative only](https://github.com/jiangxng/EVO-App-Platform/pull/1081)；[PR #1082 local positive](https://github.com/jiangxng/EVO-App-Platform/pull/1082)；[Issue #1092 Operator owner](https://github.com/jiangxng/EVO-App-Platform/issues/1092)；Issue #988/#979/#913 单独 OPEN。
- 原始日志易失：保留了本索引精确 run/job 链接、commit SHA、测试计数和关键 marker；完整 raw logs 未另上传到 Git 仓库。没有可验证的截图/附件/PDF 路径，不能造图像或文件；重要 Linux / Railway 文献仅摘要章节链接，不复制整篇原文。
- 未保存（因为不存在或权限不具备）：生产 effective drain 数值/来源截图、Railway PID1/PPID/startTicks/Node SIGTERM 接收记录、独立 Supervisor 签名 stop、完整组织级 Worker/Caller 冻结清单、真实 SQL/backend absent、IdP/DBA/Human/secret rotation/audit 记录；应全部维持 NOT_SIGNED，不说“资料遗漏”或补假文件。
- 文件在 Draft 文档分支 docs/pa05-e01j4k-account-scope-20261020，**未合并、不发布**；更新 HEAD 后需重核精确 CI，主线前进后需重新确认已授权服务/版本。所有上述资料用于辅助 K0 人工签证，**production material WRITE 保持 OFF**。
