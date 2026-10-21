# PA05 / E01J4J–J4K / K0 — 2026-10-21 续跑 #02–#07 研究资料与决策参考索引

> **RESEARCH_REFERENCE_INDEX / DATED_EVIDENCE / NOT_PRODUCTION_SIGNOFF**。配套短交接： [续跑 #07 简短入口](PA05-E01J4K-K0-WINDOW-07-CONTINUATION-HANDOFF-ENTRY-20261021.md)。只整理 2026-10-21 续跑阶段的已证实事实与研究遗产，不替换 [原 2026-10-21 最终详细索引](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)、[原 2026-10-20 索引](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)、[本日逐步原始记录 §§1–19](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)。
>
> GitHub: https://github.com/jiangxng/EVO-App-Platform · 文档分支: docs/pa05-e01j4k-account-scope-20261020 · [Draft PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)。本资料记录 2026-10-21 时间片；**新窗口须自行重查 SHA、CI、Railway 部署与 Owner 原始证据**。禁止把“上次的判断”当作持续有效的生产事实。

## A. 研究目标、明确要求与决策冻结

目标：将 Personal Agent PA-05 / E01J4J–E01J4K 从 J4J 的局部协作锁与局部 PROCESS 生命周期，推向真正的 K0 全 Worker/外部 Caller 可确认停机、生产 Human IdP、DBA/SQL session、凭据轮换/撤销与审计治理；不将 CI 绿灯/空 map/单一 Railway 服务计数当作全域证明。

用户明确要求：先复用已有研究，不重复 PostgreSQL18、OAuth、Lease、NIST 基础调查；来源有阅读等级和精确 URL；优先攻克父 Host 意外 SIGKILL、独立监督者和真实 drain/PID1；**无受权的独立清理保证前不做故意遗孤实验**。维持四条独立 Draft、没有明确授权不得合并、部署、重启/停止生产、访问 production Secrets/SQL/Validator、更改 draining、自动清异常锁、删除活动分支；不修改 project.status.json、不覆盖 BEX/CP03/Eidos/2D 等窗口；每轮保留里程碑状态表。

已选整体路线（仍是设计基线、非已经生产实现）：**中央 fencing epoch + 完整权威 Worker/Runner/Caller 清单 + 外部逐实例停机/隔离回执 + PostgreSQL backend session 二次确认 + Human IdP/DBA/credential broker/独立审计签收**。正式实施按 [K0→K6 决策文档 §§3–6](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md) 进行，不把 Infra / DBA / Identity Owner 缺席填作零。当前 K0 / 完整 E01J4 / PA05-05 E01–E05 / W06 **全部 NOT_SIGNED**；production material WRITE **OFF**，Issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) OPEN。

## B. 来源阅读等级（别混同“前窗已读”和“本次重新打开”）

- **ORIGINAL_DIRECT_ARCHIVED_20261021**：本聊天此前续跑实际打开过官方正文、原始 man page、GitHub 精确源码/Actions 原始 job log 或 Railway 连接器原始返回；**此份汇编仅再次核对其 GitHub 持久化记录**，不暗示当前编辑交接时重新打开了所有网页。
- **ORIGINAL_READ_EARLIER_INHERITED**：2026-10-19/20 以前交接有明确“已读原文”的阅读记录；本续跑复用归档，**不冒充本轮新增直接阅读**。
- **SEARCH_SNIPPET_ONLY**：只得到搜索摘要，没有直接阅读目标网页正文；不能作为本阶段签收的来源。
- **SOURCE_CODE_OR_RAW_CI_DIRECT**：精确 GitHub SHA、源文件或原始 Actions job 的阅读记录；区分“commit check 状态”和“job log 真正执行测试”的证据层级。
- **NOT_VERIFIED / OPERATOR_REQUIRED**：生产实际有效配置、真实 PID1、全域 Worker/Caller、退出回执、IdP/DBA 凭据审计等尚未取得可信原始材料。**未看过不能写已读；当前未核实不能写已证实**。

## C. 2026-10-21 新增/再次直接读过的外部来源

| ID · 原始标题及 URL | 阅读等级 / 日期 / 原文章节 | 已读来源事实 | 对 EVO 的具体用途（工程判断，非来源声称） |
| --- | --- | --- | --- |
| C01 [Linux Kernel — Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html) | ORIGINAL_DIRECT_ARCHIVED_20261021；cgroup.kill / cgroup.events populated / freeze | 非 root cgroup 支持 cgroup.kill 处理组内进程；events 的 populated=0 表示该树无活进程；freeze 不等于已退出 | 独占非生产 cgroup 的组回收和退出确认候选；不得对共享 Runner 上级 cgroup 写 kill，亦不证明未知跨机 Caller |
| C02 [Linux man-pages — pidfd_open(2)](https://man7.org/linux/man-pages/man2/pidfd_open.2.html) | ORIGINAL_DIRECT_ARCHIVED_20261021；DESCRIPTION、NOTES | pidfd 引用内核进程身份，配合 poll/epoll 可观察退出并降低 PID 复用误识别 | 外部 Supervisor 绑定某一进程代际的候选；纯 PID 文字不够，且单个 pidfd 不证明完整树 |
| C03 [Linux man-pages — pidfd_send_signal(2)](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html) | ORIGINAL_DIRECT_ARCHIVED_20261021；DESCRIPTION | 向 pidfd 代表的进程发信号，受可见性/权限约束 | 单进程精确控制候选，仍需要独立进程组/子孙枚举 |
| C04 [Linux man-pages — PR_SET_CHILD_SUBREAPER(2const)](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html) | ORIGINAL_DIRECT_ARCHIVED_20261021；DESCRIPTION | 孤儿可由仍存活的祖先 subreaper 收养并 wait | 能回收退出状态≠自动停止仍运行 Worker；不能独立签停机 |
| C05 [systemd.kill(5)](https://man7.org/linux/man-pages/man5/systemd.kill.5.html) | ORIGINAL_DIRECT_ARCHIVED_20261021；KillMode、TimeoutStopSec | control-group / mixed / process 模式覆盖范围不同 | 对比组进程关闭语义；**无证据 Railway 当前使用 systemd** |
| C06 [Node.js child_process — API source](https://github.com/nodejs/node/blob/main/doc/api/child_process.md) | ORIGINAL_DIRECT_ARCHIVED_20261021；ChildProcess close / exit / error / disconnect | close、exit、error、disconnect 不是同一事件；close 等待进程终止及 stdio 关闭 | #1082 追踪 child close、代际与 IPC；父 Host SIGKILL 后仍需要独立监督回执 |
| C07 [Railway — Deployments Reference](https://docs.railway.com/deployments/reference#singleton-deploys) | ORIGINAL_DIRECT_ARCHIVED_20261020、20261021；Singleton deploys | 默认优雅关闭宽限为 **0 秒**；旧实例被替换时收到 SIGTERM 并受后续 kill 规则约束 | **仅是平台默认值**，生产有效 drainingSeconds 必须由 Operator 取证，不能冒充已确诊值 |
| C08 [Railway — Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) | ORIGINAL_DIRECT_ARCHIVED_20261020、20261021；Draining time / Overlap time | overlap 与收到 SIGTERM 后的 drain 缓冲是两个不同阶段 | R5-01 必须获取两项生产生效秒数、来源与部署 SHA |
| C09 [Railway — Variables Reference](https://docs.railway.com/variables/reference#user-provided-configuration-variables) | ORIGINAL_DIRECT_ARCHIVED_20261020、20261021；配置变量表 | RAILWAY_DEPLOYMENT_DRAINING_SECONDS 与 OVERLAP_SECONDS 默认 0 | 变量名未出现不是配置已确认为 0；其他设置层仍待查 |
| C10 [Railway — NodeJS SIGTERM Handling](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) | ORIGINAL_DIRECT_ARCHIVED_20261020；When you start your app with NPM / start Node directly | npm/yarn/pnpm 包装进程可能影响 Node 收到信号，文档建议直接运行 Node | 对生产 Railpack + npm start 路径预警；**不是**生产 PID1 实测 |
| C11 [Railway — Config as Code Reference](https://docs.railway.com/config-as-code/reference) | ORIGINAL_DIRECT_ARCHIVED_20261021；deploy.drainingSeconds / overlapSeconds | 可用配置文件及环境覆盖设置服务关闭参数 | 需核最终有效配置，不把仓库未找到 railway.json 当作设置不存在 |
| C12 [Railway — Start Command](https://docs.railway.com/deployments/start-command) | ORIGINAL_DIRECT_ARCHIVED_20261021；Railpack vs Dockerfile start | Railpack 的启动命令通过 shell；Dockerfile 场景可能不同 | 仓库 Dockerfile exec-form Node CMD 与在线 Railpack/npm 路径不能混淆；需核容器进程树 |
| C13 [Railway — Sandboxes](https://docs.railway.com/sandboxes) | ORIGINAL_DIRECT_ARCHIVED_20261021；sandbox 生命周期 / 进程回收 / destroy | 隔离 Linux VM 与 idle/destroy 生命周期、命令超时回收有可用机制，异常断连时结果可能不明确 | 仅是可评估的**经授权非生产设施**候选；当前没有创建和验收，更不是生产 Supervisor |
| C14 [Railway — Sandboxes Quickstart](https://docs.railway.com/sandboxes/quickstart) | ORIGINAL_DIRECT_ARCHIVED_20261021；创建 sandbox 的入门章节 | 官方入门工作流 | 仅用于未来隔离设施设计，未证明当前用户已有 Sandbox 权限/开通状态 |

### C.1 摘要级来源，明确不充当证据

| 标题 / 原始 URL | 阅读等级 / 日期 | 能说明的上限 |
| --- | --- | --- |
| [Railway — Slow Deployments, Post-deploy drain instances](https://docs.railway.com/deployments/troubleshooting/slow-deployments#post-deploy-drain-instances) | SEARCH_SNIPPET_ONLY_ARCHIVED_20261020 | 只得到搜索摘要；**原文待读**。不能说明本项目有效 drain |
| [Railway — BullMQ job retries / DLQ](https://docs.railway.com/guides/bullmq-jobs-retry-dlq#process-jobs-and-dead-letter-failures) | SEARCH_SNIPPET_ONLY_ARCHIVED_20261020 | 只得到 Worker 退出相关摘要；**未确认 EVO 生产使用 BullMQ** |
| 生产 Railway Settings-pane 的有效 drain 数值、运行中 PID1/PPID/cgroup/SIGTERM、真实隔离 Supervisor、组织完整 Worker/Caller 库存、PostgreSQL session 和 IdP/DBA/secret/audit Owner 收据 | NOT_VERIFIED / OPERATOR_REQUIRED_20261021 | 不是网页“读过/没读过”的差别，而是**尚未取得真实生产受信材料**；绝不可填为 0 或 PASS |

## D. 继承的已读原文遗产：不要重复研究

以下均是 **ORIGINAL_READ_EARLIER_INHERITED**（2026-10-19/20 交接明确记载原文已读；本续跑没有重做），其章节及更长摘要见 [原最终索引 B2](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)、[已选方案 §7](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)。

| 文献标题 / 原始 URL | 章节位置、原有发现 | 项目作用 |
| --- | --- | --- |
| [Kubernetes Leases](https://kubernetes.io/docs/concepts/architecture/leases/) | Leases / Leader election；协调、续约不是 kill receipt | 排除 Lease 过期即可签全域 stop；未假定生产是 Kubernetes |
| [PostgreSQL 18 Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html) | §13.3.5 Advisory Locks；应用协作语义 | J4J 局部排他≠跨 Worker 停机 |
| [PostgreSQL 18 Monitoring Stats](https://www.postgresql.org/docs/18/monitoring-stats.html) | §27.2.3 pg_stat_activity；PG backend/PID/role/client | DBA session 二次核查，不代替 OS Worker 清单 |
| [PostgreSQL 18 Administration Functions](https://www.postgresql.org/docs/18/functions-admin.html) | pg_terminate_backend；默认 timeout 的 true 可仅表明信号已发送 | 收到 true 后还须重查 backend 消失 |
| [PostgreSQL 18 CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) | Writing SECURITY DEFINER Functions Safely | 限定 search_path、PUBLIC EXECUTE 与授予范围 |
| [PostgreSQL 18 Role Attributes](https://www.postgresql.org/docs/18/role-attributes.html) | §21.2 superuser / role | Worker 最小权限、DBA 与对象 Owner 边界 |
| [RFC 7009 — OAuth Token Revocation](https://www.rfc-editor.org/rfc/rfc7009) | §§2.2/3 撤销与传播时间 | 生产撤销 SLA 与临时会话收据 |
| [RFC 7662 — Token Introspection](https://www.rfc-editor.org/rfc/rfc7662) | §2.2 active / 缓存 | 不能把过时 cached ALLOW 当新授权 |
| [RFC 8414 — Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414) | §§2、3.3、6.2 issuer / metadata | 真实生产发行者与 audience/scope 核验 |
| [NIST SP 800-207 — Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture) | Abstract 零隐式信任 | 安全原则参照，非生产 IdP 选型 |
| [HashiCorp Vault — Dynamic database secrets](https://developer.hashicorp.com/vault/tutorials/db-credentials/database-secrets) | 动态短期、可撤销 DB 角色示例 | 凭据 broker 设计参考，**Vault 未选型** |

## E. GitHub / Railway 动态原始证据目录（易失，需原始 job URL + SHA）

下表是**2026-10-21 续跑阶段实读 GitHub 原始 job log 的归档记录**，除特别注明仅 commit-status 外，阅读等级为 SOURCE_CODE_OR_RAW_CI_DIRECT_20261021；日期均 2026-10-21，仓库为 EVO-App-Platform。run/job 受 GitHub 日志保留期限制，不能以未来 404 否定历史记录；核验时按精确 SHA 判断。

| 证据 / 精确 HEAD / 原始 URL | 原始日志结论与具体用途 |
| --- | --- |
| #1082 [96caf490](https://github.com/jiangxng/EVO-App-Platform/commit/96caf490dbb5f6ad697a7388baef90dfca0c2287) · [run 39532710142 / job 119002307849](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39532710142/job/119002307849) | 1102 total / 1101 PASS / 1 SKIPPED / 0 FAIL；**第十项** child 真实 activate IPC 报 PID，前后存活核验；修正旧 PROCESS_STARTING-only 证据 |
| #1082 [156609a7](https://github.com/jiangxng/EVO-App-Platform/commit/156609a7bf9429fa2e1fcc4ca4e42a7349da1964) · [run 39533283090 / job 119004106488](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39533283090/job/119004106488) | 1103 / 1102 PASS / 1 SKIPPED / 0 FAIL；第十一项非合作 deactivate，观察 stop 753ms、child PID 确认退出；**753ms 不是生产 SLA** |
| #1082 [eb129cc2](https://github.com/jiangxng/EVO-App-Platform/commit/eb129cc2b156294d34c0a04fb73a6ebbedd4b34f) · [run 39535199087 / job 119010190494](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39535199087/job/119010190494) | 1105 / 1104 PASS / 1 SKIPPED / 0 FAIL；2 项只读 Supervisor preflight；Runner cgroupV2=true / populated=1，权限与独立清理 **false** |
| #1082 [50a7a068](https://github.com/jiangxng/EVO-App-Platform/commit/50a7a068259c966dafa86a722aab5d012fb96fd8) · [run 39536775595 / job 119015279614](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39536775595/job/119015279614) | 1111 / 1110 PASS / 1 SKIPPED / 0 FAIL；6 项**synthetic** Ed25519/绑定/时效/replay；必须先验签再解释 claims，仍未取得真实信任根 |
| #1082 [d9be185e](https://github.com/jiangxng/EVO-App-Platform/commit/d9be185e3e244bb45fec5f3fab2554c52b04114f) · [run 39537627482 / job 119017875426](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39537627482/job/119017875426) | 1121 / 1120 PASS / 1 SKIPPED / 0 FAIL；10 项**synthetic** 2 Worker / 3 Caller 冻结库存与逐实例停机回执一致性，不能算 10 个真实进程退出 |
| #1074 [c6d5fca9](https://github.com/jiangxng/EVO-App-Platform/commit/c6d5fca90ebfc41ffa642dc5af2e756a224ec838) · [run 39538625109 / job 119021176953](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39538625109/job/119021176953) | 新 HEAD **45/45 checks SUCCESS**；lightweight 原测试 278/278、新 PA05 独立 shutdown/J4J 5/5，workflow 冲突已解除；GitHub refs/pull/1074/merge 虚拟合并同时保留 main 测试与新 PA05 step，**未实际合并** |
| #1082 [9b5b62c5](https://github.com/jiangxng/EVO-App-Platform/commit/9b5b62c58ccad63b4d781eb5f4c4be63e69a5a68) · [run 39539664240 / job 119024257994](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39539664240/job/119024257994) | 1122 / 1121 PASS / 1 SKIPPED / 0 FAIL；**1 项真实非生产 Linux** 外部 /proc Host/Worker PPID、启动 tick、children 与正常 IPC stop 后退出观察；没有父 Host SIGKILL |
| #1082 [eb4743e8](https://github.com/jiangxng/EVO-App-Platform/commit/eb4743e8ed34cf3cd748c3f79781d092c62712f4) · [run 39541560856 / job 119030399081](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39541560856/job/119030399081) | 1124 / 1123 PASS / 1 SKIPPED / 0 FAIL；新增 2 项只读 Linux PID1/父链与非法输入拒绝，Runner chainLength=9、pid1Identified=true；**非 Railway 生产 PID1** |
| J4J [PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) · [PG18 run 39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722) | ORIGINAL_READ_EARLIER_INHERITED；真实三 PG18 28/28，只有 ENGINEERING_BOUNDED_PASS，非全域 stop |
| #1081 [a1e8a094](https://github.com/jiangxng/EVO-App-Platform/commit/a1e8a0941ff5b796816aaea0904b89533191a239) · [run 39427280985 / job 118643113249](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39427280985/job/118643113249) | ORIGINAL_READ_EARLIER_INHERITED；5/5 checks 证实旧逻辑下 shutdown 返回仍活 child 与 shutdown 后 fork **负例**。PR 绿色意味着反例被正确复现，**不是安全通过** |
| [Ecosystem Certification #39393603504 / job 118530781749](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504/job/118530781749) | ORIGINAL_READ_EARLIER_INHERITED；旧 main schedule **1815 total / 1723 pass / 10 fail / 82 skipped**。与 Draft CI SHA 和范围不同，旧负证据不能靠别处绿灯抵销 |
| [Railway connected project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | CONNECTED_RAILWAY_DIRECT_20261021；项目五服务、**只有 production 环境**；Host/EVO Runtime 为 Railpack + npm start；线上 Host 1 running / 0 crashed；get_service_config 无明确 effective drain/overlap 字段，不可推断为 0 |

**原始 marker 精简保留：**
- Activate entered: `activationEnteredByRealHostIPC=true`、`observedChildPidClosed=true`、`globalStopCertified=false`（第十项）。
- Noncooperative: `nonCooperativeDeactivate=true`、`elapsedMs=753`、`globalStopCertified=false`（第十一项）。
- Preflight: `cgroupV2Detected=true`、`cgroupKillPresent=true`、`observedPopulated="1"`，但 `independentSupervisorLifetimeVerified=false`、`parentSigkillExperimentAuthorized=false`。
- Synthetic receipt / inventory: `signatureMatchesSuppliedTestKey=true`、`locallyConsistentUntrustedFixture=true`，但 `realDbSessionAbsenceVerified=false`、`externalStopAuthorityVerified=false`、`globalStopCertified=false`。
- Real external /proc: `childConfirmedByExternalProcfs=true`、`workerParentPidMatched=true`、`gracefulExitExternallyObserved=true`、`noParentSigkillTestPerformed=true`。
- Read-only PID1: `chainLength=9`、`pid1Identified=true`、`runtimeSigtermDelivered=false`、`effectiveRailwayDrainingVerified=false`、`globalStopCertified=false`。

完整 JSON 与相邻负证据保存于 [2026-10-21 接续文档 §§7–19](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)、[K0 工作表 §§14–22](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[认证总账 §§88–98](PA05-CERTIFICATION-BASELINE-20261015.md)。**未生成也未获取可核实的 screenshots、视频、截图路径、运行环境 image digest、真实生产 PID dump、signed stop artifact 或 DB dump**；不得虚构附件或沙箱下载链接。GitHub job URL 随时间可能过期，这份摘要与精确 SHA 将保留可审计结论，但不能替代完整原始日志。

## F. 方案比较：来源事实 ≠ 项目推断

| 方案 / 当前决策 | 依赖的来源事实 | 适用条件与限制、为何采用/排除 |
| --- | --- | --- |
| J4J file lock / PG advisory lock / Lease 单独作全域 stop → **拒绝** | PG18 advisory 由应用协作；K8s Lease 供协调；J4J 28/28 只在协作本机有效 | 可作为局部互斥或辅助 fencing；不能证明未知 Worker/OS child/远端 Caller 已死亡 |
| 只看 process Map 空、stop() 返回或 pg_terminate_backend=true → **拒绝** | #1081 真实负例；PG18 administrative functions 与 Node close 事件语义 | 必须逐真实实例外部停止回执，且 DBA 再查 backend/session |
| 只用 cgroup.kill → **有条件候选，不直接采用生产** | Linux cgroup.kill、events populated；对并发 fork 的覆盖能力 | 必须证明专属 test cgroup + owner/权限 + 外部 Supervisor + `populated=0`；只证明这个组，不覆盖组织跨机 Worker |
| pidfd + subreaper + cgroup v2 + 独立 Supervisor → **优先非生产评估候选** | pidfd 身份稳定；subreaper 收养；cgroup 树退出可观测 | 外部监督者必须在 Host SIGKILL 后存活，拥有精确身份/强制回收/TTL 和独立退出回执，未经批准不运行 |
| systemd KillMode → **参考，不认定 Railway 用它** | man page 有多种 unit 进程关闭语义 | 只用于独占实验平台比较；当前 Railpack 不等于 systemd |
| Railway `npm start` 不改、直接提高 draining → **不自动执行** | Railpack shell 执行；平台默认 0 秒，但生产生效值不明 | 先 R5-01/02 Operator 查实配置和 PID1，再计算 shutdown budget；任何生产更改需单独授权 |
| 合成 Ed25519 receipt/2 Worker 对账 → **仅保持 test-only** | 6+10 项本地 CI 证明校验器按预期拒绝错输入 | 自签测试 key 和模拟 freeze 不能证明信任锚、完整清单或实际进程退出 |
| 真实 Linux `/proc` 外部正常停机观察 → **有界工程 PASS** | 1 项真实 Node 进程树与 graceful close 测试 | 观察者在同 Runner，不是生产受信 Supervisor；未验证父 Host SIGKILL 后回收 |
| Railway Sandboxes 或另建隔离测试环境 → **候选但尚未建** | 官方隔离 VM 和生命周期机制；当前 Railway 项目只列 production | 必须先有不接触生产数据的合法非生产环境、独立清理所有权、授权；当前 R5-03 BLOCKED |
| 中央 epoch + 权威库存 + 外部停机 + PostgreSQL session + Human IdP/DBA 证据 → **保留 K0→K6 主方案** | 已归档 OS/PG/OAuth/身份研究及拓扑缺口 | 这是工程架构判断，需 Infra/SRE/DBA/IdP/审计 Owner 独立签收；目前**NOT_SIGNED** |
| Kubernetes / Vault 生产产品选型 → **未选择** | 上游 Kubernetes Lease 和 Vault 动态凭据官方文档 | 仅参考模式；没有实际生产 Kubernetes 或选择 Vault 的权威决定 |

## G. 资料冲突与尚待验证的关键问题

1. **Railway 默认 0 秒 vs 生产实际 drain/overlap UNKNOWN。** get_service_config 不列秒数/变量名，不等于实际为 0。唯一可接受的 R5-01 证据：Railway Operator 对具体 service/environment/deployment 交出**生效数值、来源、时间和签名**；无证据继续 DENY。
2. **仓库 Dockerfile 直接 Node vs Railway 实际 Railpack + npm start。** 已证实线上 build=RAILPACK、startCommand=npm start，package script 再调 Node；生产 PID1 与 npm/shell SIGTERM 传播链未知。R5-02 需真实部署 image/digest、PID1/PPID/cgroup 和 SIGTERM 到达 Node 的独立回执（脱敏、不读 secret）。
3. **CI Runner cgroup.kill 文件可见 vs 可用的专属监督者不存在。** `populated=1` 不是退出回执；无独占 cgroup/外部 TTL/终止权限前仍禁止 parent SIGKILL。
4. **Railway 项目只有 production vs 需要安全非生产实验。** 当前只列 production，R5-03 BLOCKED；不能在生产创建 Sandbox 或连接生产数据库做演练；需要受权独立环境和独立回收。
5. **Host 1 replica online vs 企业全域 Worker 和 Caller 完整性。** 外部 GitHub workflows、Host Validator、EVO Compose worker、CLI/API、PG sessions、别的工作区不由这个观测自动排除；不得写“0”。
6. **#1074 45/45、#1082 5/5 vs 生产尚未合并这些 Draft。** #1074 已解决 `dirty` 合并冲突，虚拟 merge workflow 同时保留 main/OIDC/EVO 与 PA05 测试，但没有合并/部署。当前 main 的原 shutdown 错误路径风险须与 Draft 分开。
7. **旧 Ecosystem 10 FAIL vs 新 CI 绿灯。** SHA、工作流、测试范围不同，旧负证据仍在，不能跨窗口擅修 BEX/CP03/Eidos。
8. **生产 Human IdP/DBA/Secrets/Audit。** issuer、audience、MFA、revoke SLA、DB grants/session、broker rotation、回执审计均没有真实生产 Owner 签字。不能把合成签名/模拟 DB state 当真实权威。
9. **9 条旧已合并历史分支残留。** 已有 SHA/祖先审计，但当前连接器缺 delete-ref；远端删除 NOT_EXECUTED，活动四 Draft 不动。未来只能合法能力+重新核 exact SHA/PR/保护后安全清理。

**下一步定向研究优先级：** ① Railway R5-01/02 生效部署证据；②受权非生产 Supervisor、专属 cgroup/pidfd 与 TTL 回收；③组织权威完整 Worker+Caller 清单；④PostgreSQL session 和 IdP/DBA/secret/audit Owner 实际签收。以上是待获取的数据/实验，不是“新增可用资料已读”。

## H. 落地对照与新窗口工作顺序

| 责任模块 / 项目落点 | 已保存文档/工程 | 下一最小任务 |
| --- | --- | --- |
| 全局项目权威 | [AI-BOOTSTRAP](../../AI-BOOTSTRAP.md) → project.status.json → 指向的 handoff → LLM.md / llm.foundation-map.json；[Agent HANDOFF](HANDOFF.md) | 按完整顺序读，**不改 project.status.json**，以 GitHub 现状优先于聊天 |
| PA05 认证治理 | [PA05-CERTIFICATION-BASELINE §§62–98](PA05-CERTIFICATION-BASELINE-20261015.md) | 只在真实外部证据齐备时提升状态；目前 K0/E01J4/PA05-05/W06 NOT_SIGNED |
| K0 停机设计与已知拓扑 | [J4K 决策 §§2–7](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)、[Worker Topology](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md) | 对照 SRE 真正组织 Worker/Caller/外部编排器库存 |
| R1–R8 核验证据 | [STOP AUTHORITY 工作表 §§1–22](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[本日接续 §§1–19](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md) | 继续记录原始见证，未签不能填 0 |
| Railway R5-01/02/03 | [R5 Operator 请求 §§1–5](PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md) | 先只读取 production effective draining/overlap、PID1/SIGTERM；再请求授权非生产设施，禁止直接改生产 |
| Host 顶层 shutdown | [Draft #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) · manager/host-shutdown.ts / manager/server.ts | 冲突已解除、45/45 SUCCESS；保留 Draft，不合并 |
| PROCESS 负面与局部正向 | [Draft #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) / [Draft #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) · manager/plugin-runtime-host.ts、tests/fixtures/pa05-k0-*、tests/protocol/pa05-k0-* | 11 项真实 local PROCESS、2 preflight、6 synthetic receipt、10 synthetic inventory、1 real Linux /proc、2 PID ancestry 各分开记；不要再循环加类似 mock |
| 易失证据 | 本索引 §E 的精确 run/job URL、时间片、marker，以及旧 [2026-10-20 索引](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) | 原始 job 可过期；新窗口只因新增冲突复核原文，不能伪造没有的截图/附件 |
| 分支卫生 | [续跑证据 §5](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)、旧分支审计索引 | 9 条仅审计，删除需新 SHA 核验和合法权限；四 Draft 绝不可删除 |

## I. 2026-10-21 最后只读控制面快照（离开窗口必须刷新）

- GitHub main：`4d291fb31f7a5c429b20be14fb48df687c5a1dac`；其单 SHA check-runs 返回 **2/2 SUCCESS**，不要冒称历史 40/40 同范围。
- Railway Ledger Configurator：deployment `abe8f368-a45f-4a09-aa07-0f8201bf838e`，与上述 SHA 相同，**SUCCESS/Online**，1 running / 0 crashed。该项目仅 production 一个 Railway environment、五服务；没有已验证的 non-production test environment。
- 四 Draft 当时最新精确 HEAD：[ #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) `9082a9e2bb2f6665e7cb0e777fc0571035e29f89`（本交接提交之前，该 HEAD **7/7**）；[ #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) `c6d5fca90ebfc41ffa642dc5af2e756a224ec838` 45/45；[ #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) `a1e8a0941ff5b796816aaea0904b89533191a239` 5/5；[ #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) `eb4743e8ed34cf3cd748c3f79781d092c62712f4` 5/5。**本交接产生的新文档 HEAD / CI 必须以最终写入后的精确 SHA 重核。**
- 任何 CI 成功仅说明精确测试范围的局部工程通过；没有真实 production stop/DBA/IdP 交付时，**K0/完整 E01J4/PA05-05 E01–E05/W06 NOT_SIGNED，material WRITE OFF**。

## J. 无法保存/尚未存在的证据

没有已获取的生产 effective drain 数值、PID1/PPID/cgroup/信号到达原始记录、独立 Supervisor signed-exit receipt、组织范围 Worker/Caller freeze 清单、SQL session、Human/DBA/IdP/Secrets/audit 回执；故**没有可保存到 GitHub 的这些生产原始文件**。本次没有截图、PDF、录像、实际独立附件路径；不伪造它们。源网站全文并未复制为附件，依赖原始 URL + 查阅日期/级别/章节 + 上游保留的摘录；GitHub Actions 原始日志也没有另行上传完整拷贝，仅保存 URL、marker、计数器和 SHA。如未来源不可达，保留的来源等级及证据上限不变。

**下一窗口：先短入口再本索引，依 AI-BOOTSTRAP 完整恢复权威；刷新所有 HEAD/CI/Railway；先 R5-01/R5-02 实证，再由 Infra 提供独占非生产 Supervisor 和明确授权，未具外部回收保障不做 parent SIGKILL。**
