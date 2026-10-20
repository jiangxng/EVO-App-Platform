# PA05 / E01J4K–K0 研究资料与决策交接索引（2026-10-20）

**类型：** `RESEARCH_REFERENCE_INDEX / WINDOW_ARCHIVE / EVIDENCE_CLASSIFIED`。配套短入口：[E01J4K-K0 Window Handoff](PA05-E01J4K-K0-WINDOW-HANDOFF-ENTRY-20261020.md)。  
**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**归档线：** [PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)；`docs/pa05-e01j4k-account-scope-20261020`；Draft 不合并、不部署。  
**历史研究链：** [J4G–J4J 旧窗口详细索引](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) → [J4K 独立设计决策](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md) → [K0 生产拓扑与观测](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md) → 本资料与决策交接。**不要重做旧研究，也不能把旧快照写作当前状态。**

## 0. 资料阅读等级与责任边界

| 等级 | 含义 |
| --- | --- |
| **ORIGINAL_READ_THIS_WINDOW** | 本轮通过 GitHub/Railway 连接器读取原始仓库内容、官方文档全文、API 状态或可用的 job 原始日志；注明具体对象。 |
| **ORIGINAL_READ_EARLIER_ARCHIVED** | 前一阶段在项目研究文档中明确登记为原文已读，本次从项目记录继承；**没有冒称本次重新阅读**。 |
| **SEARCH_SNIPPET_ONLY** | 搜索摘要，仅用于发现线索，未经原文核查不得成为安全签收证据。本轮铁路 shutdown 核心资料已从摘要进一步打开原文。 |
| **NOT_VERIFIED / BLOCKED** | 没有实际访问或足以证明的证据（例：其他云账号、Railway Settings-pane 有效排空时长、真实生产 Human IdP 与 DBA）。不得补造结论。 |

**事实与判断分离：** 官方文档所述行为、当前 GitHub 源码、Railway 返回的实际配置、实际 Actions 结论分别列事实；“能否证明全局停止”“是否可签收”等属项目的工程判断与认证决策。不同时间点的 `main`、部署、工作流不能混写。

## 1. 本轮目标、明确要求与最终决策

### 1.1 目标与明确要求

- 原始主任务：继续 J4J 独立协作 Host 排他 PR #1057，逐一核验准确 HEAD 的三 PostgreSQL18 28/28、全部适用 Host CI、历史两条取消工作流、合并/主线 CI/Railway；只依真实证据签工程有界验收。
- 继任 K0：建立可信多 Worker stop proof、完整生产 Worker/调用者清单、权威进程终止证据和真实生产 Human IdP/DBA/秘密轮换审计治理。用户多次要求“继续”，不得只报进度不做取证。
- 分支与冲突：共享 Host 变更按独立短 PR，已有研究不重做；不覆盖 BEX/CP03/Eidos/2D、`project.status.json`、生成的 `HANDOFF-LATEST`。生产 material WRITE 保持 OFF，不删除异常留锁，不冒充生产 IdP。
- **当前并行边界：** 现存 #1071 为 K0 **文档专用 Draft**；#1074 为 **不同分支的 Host shutdown 工程 Draft**。两个都没有获得合并引发 Railway 自动部署/生产停机测试的授权；本交接只更新 #1071，不操作 #1074。

### 1.2 已确认的决策

1. **J4J `ENGINEERING_BOUNDED_PASS`：** 同一可信 POSIX 文件命名空间内自愿协作 Host 的 opt-in 文件锁；默认 OFF。不能外推到跨节点分布式锁、所有 Worker 停机、IdP、DBA、PG+JSON 原子性。
2. **分离证明：** 单调 fencing epoch 拒绝旧操作 ≠ 已知完整 Worker inventory 的逐实例死亡/DB 会话清零 ≠ 真实 Human 操作员授权/DBA credential。三条证据互不替代。
3. **采纳 K0→K6 分门推进：** K0 全部生产拓扑与 stop authority；K1 fencing；K2 逐实例停机；K3 PG18 DB 身份/会话；K4 真实非生产 IdP 与 credential broker；K5 对抗测试；K6 组织签收。K0 未签收前不得声称 K1/K2 生产合格。
4. **不因本地 Docker Compose 宣称生产 Worker 存在；不因连接的 Railway 项目只有 5 服务宣称其他 Worker 不存在。**
5. **不能把“CI 绿色”当“生产已部署安全修复”：** #1074 45/45 CI 仅源码/测试证据。Railway 目前仍运行 main，#1074 未合并；实际 signal/drain 未证实。
6. **不隐去反面证据：** main 定时全套 10 failures 必须保留；旧 J4J 两条 CANCELLED 的确切取消原因无法证实；#1074 物理 PG18 测试曾一次 transient IPC 20s timeout、精准 rerun 后通过，二者并存。

## 2. 本轮直接打开和阅读的外部官方资料（2026-10-20）

| 标题与原始 URL | 阅读等级/位置 | 关键原文事实 | 在项目中的用途与判断 |
| --- | --- | --- | --- |
| [Railway — Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown#draining-time) | **ORIGINAL_READ_THIS_WINDOW**，页面“Draining time”“Overlap time”；通过 Railway 官方 docs connector 搜索并读取全文 | 新部署就绪后，旧部署收到 SIGTERM；其后于配置排空时间到期由 SIGKILL 终止；可在 Settings、config-as-code 或 service variable 设置。 | J4J 的正常退出证据不能直接外推到 Railway；必须查有效 per-service drain time。 |
| [Railway — Deployments reference](https://docs.railway.com/deployments/reference#singleton-deploys) | **ORIGINAL_READ_THIS_WINDOW**，“Singleton deploys” | 默认只维持单个活动部署；默认 graceful drain **0 秒**；文档称没有发送其他信号。 | 无法保证持锁 Host 的优雅退出窗口；**不是**实际 Settings-pane 值已被证明为零。 |
| [Railway — Variables Reference](https://docs.railway.com/variables/reference#user-provided-configuration-variables) | **ORIGINAL_READ_THIS_WINDOW**，“User-provided configuration variables” 表 | `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` 是 SIGTERM 到 SIGKILL 缓冲秒数，默认 0。 | Railway 所读 Host/EVO Runtime 变量**名称**不含此项，Postgres 包含此名称；没有读取任何值，不能断言其 Settings-pane 配置。 |
| [Railway — NodeJS SIGTERM Handling](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) | **ORIGINAL_READ_THIS_WINDOW**，全文 “When you start your app with NPM...” / “start Node directly” | npm/yarn/pnpm 可能成为主进程并截获信号；官方推荐直接运行 Node。 | 当前 EVO Runtime 与 Host 均 `npm start`，因此“Node 必定收到 SIGTERM、完成清理”未获实测证明。 |
| [Railway — Post-deploy drain slow-deployment troubleshooting](https://docs.railway.com/deployments/troubleshooting/slow-deployments#post-deploy-drain-instances) | **SEARCH_SNIPPET_ONLY**，搜索结果 | 搜索结果指向 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`；本轮**没有**打开该页面全文。 | 仅作为进一步诊断索引，绝不作证明。 |
| [Railway — BullMQ job retry/DLQ guide](https://docs.railway.com/guides/bullmq-jobs-retry-dlq#process-jobs-and-dead-letter-failures) | **SEARCH_SNIPPET_ONLY**，搜索结果 | 搜索摘要提及默认 0 秒和在 SIGTERM 时关闭 worker；没有全文阅读。 | 不可推定 EVO 生产运行 BullMQ；仅待条件适用时再查。 |

## 3. 已读原文的旧研究来源（继承，不冒充本轮新读）

以下索引直接继承 [J4K 设计记录 §7](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md) 的原文阅读登记；**本次窗口只读了项目归档文本，未重新打开下列全部官方原文**。

| 标题与 URL | 等级 / 旧研究记录位置 | 来源要点及当前用途 |
| --- | --- | --- |
| [Kubernetes — Leases](https://kubernetes.io/docs/concepts/architecture/leases/) | **ORIGINAL_READ_EARLIER_ARCHIVED**，Leases / Leader election；2026-10-20 J4K §7 | Lease 可协调心跳/选主；租约过期 **不等于**已证明 OS 进程终止（工程判断）。不擅自假设生产 Kubernetes。 |
| [PostgreSQL 18 — Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html) | **ORIGINAL_READ_EARLIER_ARCHIVED**，§13.3.5 Advisory Locks | 应用自愿遵守的 advisory lock 不是独立的全部 Worker 停机证明；不代替 fencing 与外部实例回执。 |
| [PostgreSQL 18 — Cumulative Statistics System](https://www.postgresql.org/docs/18/monitoring-stats.html) | **ORIGINAL_READ_EARLIER_ARCHIVED**，§27.2.3 `pg_stat_activity` | 记录 PG server process/session，不能枚举远端 OS Worker；K3 多源证据组合。 |
| [PostgreSQL 18 — System Administration Functions](https://www.postgresql.org/docs/18/functions-admin.html) | **ORIGINAL_READ_EARLIER_ARCHIVED**，`pg_terminate_backend` | 默认 timeout=0 返回 true 可仅表示成功发信号；会话真正消失需等待/重查。 |
| [PostgreSQL 18 — CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) | **ORIGINAL_READ_EARLIER_ARCHIVED**，Writing SECURITY DEFINER Functions Safely | 安全 `search_path`、限制 PUBLIC EXECUTE、限定授权；DBA 角色治理。 |
| [PostgreSQL 18 — Role Attributes](https://www.postgresql.org/docs/18/role-attributes.html) | **ORIGINAL_READ_EARLIER_ARCHIVED**，§21.2 superuser | 非 superuser 最小权限；Worker、维护 LOGIN、对象 OWNER/NOLOGIN 分离。 |
| [RFC 7009 — OAuth 2.0 Token Revocation](https://www.rfc-editor.org/rfc/rfc7009) | **ORIGINAL_READ_EARLIER_ARCHIVED**，§2.2 / §3 | 撤销传播不是瞬时零延迟；定义真实生产撤销 SLA。 |
| [RFC 7662 — OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662) | **ORIGINAL_READ_EARLIER_ARCHIVED**，§2.2 | `active` 与缓存新鲜度；不可缓存旧 ALLOW 代替当前维护批准。 |
| [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414) | **ORIGINAL_READ_EARLIER_ARCHIVED**，§§2/3.3/6.2 | issuer/discovery 元数据匹配与 HTTPS 根信任；不能用环境布尔值冒充。 |
| [NIST SP 800-207 — Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture) | **ORIGINAL_READ_EARLIER_ARCHIVED**，摘要 | 网络位置不自动授予信任；用作治理原则，不是选产品的证据。 |
| [HashiCorp Vault — Dynamic database secrets](https://developer.hashicorp.com/vault/tutorials/db-credentials/database-secrets) | **ORIGINAL_READ_EARLIER_ARCHIVED**，教程场景/数据库工作流 | 短寿命、隔离、可撤销 DB 凭据示例；**Vault 只是参考，未选为产品**。 |

历史 GitHub Actions 2026-10-19 outage 的来源/已读等级在 [旧研究索引 §3](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)；本轮不重搜、不伪装重新核查。该故障已恢复，不把当时 queued 状态当作今天的事实。

## 4. 本轮直接阅读的项目、平台与测试原始证据

| 标题 / 原始网址（带版本或运行 ID） | 日期与阅读等级 | 关键发现 / 用途 |
| --- | --- | --- |
| [J4J PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057)、[末 HEAD checks](https://github.com/jiangxng/EVO-App-Platform/commit/1fba63927a80f2e9658b8608bb5a92a9849abcdf/checks) | 10-20 **ORIGINAL_READ_THIS_WINDOW** GitHub PR/commit API | MERGED，45/45；局部证据不能转成多节点停机签收。 |
| [J4J 真实三 PostgreSQL18 #39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722) / [合并后 #39361578987](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39361578987) | 10-20 **ORIGINAL_READ_THIS_WINDOW**，CI 原始日志与节点 reporter 已在本轮直接核实并写入认证总账 §66 | 两次均 **28/28 PASS / 0 fail / 0 skipped**；真实独立 Node Host、二号协作 Host 拒绝、SIGTERM 释放、SIGKILL/非零留锁；marker 保留 `multiWorkerGlobalStopCertified:false`。 |
| [旧 CANCELLED #39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878) / [#39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769) | 10-20 **ORIGINAL_READ_THIS_WINDOW** workflow metadata，原 job log **NOT_VERIFIED（BlobNotFound）** | `cancel-in-progress:true` 可以解释可能机制，但无法证明具体原因；最终 HEAD/main CI 全绿，旧时间片不阻断合并。 |
| [J4K 生产 Worker 拓扑记录](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md) | 10-20 **ORIGINAL_READ_THIS_WINDOW** 仓库文档全部相关章节/后续增补 | Railway 所连生产项目 5 服务、单 Host replica、无单独 Worker/Cron/webhook/proxy；边界仅限当前连接的账号。 |
| [EVO package.json](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/package.json)、[EVO Worker entry](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/apps/worker/src/main.ts)、[EVO Compose](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docker-compose.yml) | 10-20 **ORIGINAL_READ_THIS_WINDOW** GitHub 精确仓库源码 | `npm start`→ API；`start:worker` 与本地 Compose Worker 独立。不能把 Compose Worker 当成已上线进程。 |
| [Experience Compiler Dockerfile.api](https://github.com/jiangxng/Experience-Compiler/blob/5f06a6224b6ffe434a9a3c0793b0384943121ac9/Dockerfile.api) | 10-20 **ORIGINAL_READ_THIS_WINDOW** GitHub 精确源码 | 生产 Experience Compiler API 入口（`uvicorn ec.api:app`），不据此宣称整个组织没有其他 Worker。 |
| [Platform Host server](https://github.com/jiangxng/EVO-App-Platform/blob/2735edb72f2b44297466cbd53feda3892f84385b/manager/server.ts)、[cooperative lock](https://github.com/jiangxng/EVO-App-Platform/blob/2735edb72f2b44297466cbd53feda3892f84385b/manager/pa05-read-owner-cooperative-host-lock.ts) | 10-20 **ORIGINAL_READ_THIS_WINDOW** 源码（启动、signal、相关默认变量） | in-process scheduler 变量缺席、默认 interval 0；Agent async reader OFF；J4J opt-in 默认为 OFF；代码中的 SIGTERM handler 不等于真实进程必收信号。 |
| [Host Validator 生产配置与 Railway 官方服务对象](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | 10-20 **ORIGINAL_READ_THIS_WINDOW** Railway connector `describe_environment/describe_service/list_projects/list_workspaces/list_webhooks/list_domains/list_tcp_proxies` | Validator `restartPolicyType=NEVER` / 0 running；已配置 `/v1/actions` 的 plan-install/install-package 调用，目标 `evo-ledger-runtime-configurator`，脚本无 Authorization header；不能由此推断必有未授权利用。未执行。无 Secret 值阅读。 |
| [Host HTTP logs — 仅有界窗口](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601/service/a8622238-480e-4da3-be6f-60fd0f3e18db) | 10-20 **ORIGINAL_READ_THIS_WINDOW** Railway connector HTTP 样本 | 返回的 501 条条目中 10 条 `POST /v1/actions`，所显示 user-agent 为浏览器；无请求 body；不能判明全部 command/actor，不能证明缺失外部调用者。 |
| [PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)、[原归档 HEAD](https://github.com/jiangxng/EVO-App-Platform/commit/472947a87298a93a7ce01949ff22cc7ffb6a60a0/checks) | 10-20 **ORIGINAL_READ_THIS_WINDOW** PR API + exact HEAD checks | 本文档分支 Draft，原归档 HEAD 7/7 SUCCESS；归档 commit 添加后新 HEAD 的检查需重新读取。 |
| [PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)、[独立工程 HEAD](https://github.com/jiangxng/EVO-App-Platform/commit/caccb1b60358b453ef471eaf6abecf1593e4965c/checks)、[host-shutdown.ts](https://github.com/jiangxng/EVO-App-Platform/blob/caccb1b60358b453ef471eaf6abecf1593e4965c/manager/host-shutdown.ts)、[负测](https://github.com/jiangxng/EVO-App-Platform/blob/caccb1b60358b453ef471eaf6abecf1593e4965c/tests/agent-line/pa05-host-shutdown-error-path.test.mjs) | 10-20 **ORIGINAL_READ_THIS_WINDOW** PR API、45 exact check statuses、源文件原文和测试原文 | try/catch 所有 cleanup + 记录失败，logger 抛错不阻断后续清理；shutdown requests 503/Connection close；并行工程 PR 仍 Draft/未部署；不在 #1071 改源。 |
| [PR #1074 Lightweight Host #39378563738](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378563738) / [PG18 #39378563669](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378563669) | 10-20 **原始已归档 CI 证据 + 本轮重新读取 45/45 检查** | 最终 Lightweight **201/201 PASS**；PG18 首次有 `PA05_E01J2_TIMEOUT:readResult` 20.46s/20s 超时，精准 rerun 后成功；不可把首次失败抹去。 |
| [当前 main commit](https://github.com/jiangxng/EVO-App-Platform/commit/eaa5e813b1e86a6460d988c76eb2076512c35127) / [Railway deployment](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | 10-20 **ORIGINAL_READ_THIS_WINDOW**，精确 main API + Railway deployment/status | main `eaa5e813...`，Host deployment `e5c56ed8-aac9-4177-bc83-9f01b07ad9b9` SUCCESS / Online，1 running / 0 crashed；生产非 #1074 工程分支。 |
| [Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) / job `118530781749` | 10-20 **ORIGINAL_READ_THIS_WINDOW**，**原始 job log 约 974 KB 已读**；定时 `main@eaa5...` | `npm run test:all`: **1815 total / 1723 pass / 10 fail / 82 skipped**。失败含 `tests/app-host/read-only-form-values.test.mjs`（源码匹配）、`tests/localization/app-localization.test.mjs`（期望标签/语言集合）、`tests/manager/manager.test.mjs`（缺 `enterprise.application-runtime-binding` 等）。与 K0 签收相互独立但不能隐去；**未修复、未确认归因**。 |

### 4.1 容易失效/不能访问的原始证据留存位置

- CI job 原始日志可能在保留期限后不可读：J4J PR physical PG18 [run #39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722) job `118424890768`；J4J 合并后 [#39361578987](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39361578987) job `118428747522`。**关键摘要 28/28/0 failed/0 skipped 与 J4J marker 已写入认证总账 §66**。
- #1074 Lightweight [#39378563738](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378563738)：201/201/0 failed；PG18 [#39378563669](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378563669) 初次 20.46s IPC timeout → 定向 rerun 通过。**只得认最终 HEAD 全绿，不能断言初次全部通过**。
- Main Ecosystem [#39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) job `118530781749`：`not ok` 例 `#349` read-only form、`#845/#846` localization、`#855/#856/#857/#858/#859/#860/#862` manager/lifecycle/localization；汇总 1815/1723/10/82。精确 URL + 失败类型已保存；没有复制整个 974 KB log，不包含凭据。
- 旧 J4J two cancelled logs [#39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878) / [#39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769) 返回 `BlobNotFound`；保存元数据与**原因不确定**，不伪造屏幕截图。
- **截图与附件：** 本窗口没有新增可定位的截图、视频或二进制附件；GitHub 的 PR、commit、job URL 是唯一可追溯原始对象。Railway 有效 Settings-pane 排空时间尚未读取，不存在可信截图。

## 5. 决策方案比较（事实、判断和限制）

| 方案 | 选择 | 来源事实 / 工程判断（标注） | 适用条件 / 已知限制 |
| --- | --- | --- | --- |
| J4J opt-in POSIX file lock | **保留，局部范围** | **实测：** 同一文件系统协作 Host 的默认 OFF、在线排他、异常留锁、SIGTERM 释放；**判断：** 非多节点 stop proof。 | 同一可信 POSIX 文件命名空间，全部相关 Host 主动遵守协议；生产开关目前 OFF。 |
| 全域只靠 PostgreSQL advisory lock | **排除** | **来源：** PG18 advisory locks 由应用自愿使用；**判断：** 非参与者可绕过，无法证明 OS 进程退出。 | 可以作为补充协调，不能代替完整 stop receipt。 |
| Heartbeat/Lease TTL 到期即认 Worker 已死 | **排除** | **来源：** Kubernetes Lease 为协调/心跳；**判断：** 网络分区、卡顿时 TTL 不能证明 OS 退出。 | 可用于活性信号，不可用于签收 `STOP_CONFIRMED`。 |
| Central fencing epoch + complete inventory + supervisor receipts + PG session re-query | **首选设计基线，未实施/未签收** | **既有工程：** J4A epoch/rea​ttestation；**判断：** 必须同时证明旧权限拒绝、逐实例退出、数据库会话无残余。 | 必须先有真实编排/实例 ID/进程 nonce、冻结扩缩容权、完整调用入口和审计。 |
| 仅观察 Railway 5 个服务以签全局停机 | **排除** | **实查：** 所连账号 1 workspace/1 project/5 services/no Worker/Cron；**判断：** 外部账号、CI Runner/queue、子进程可能不在此清单。 | 只作为部分现场证据；必须由组织确认全域范围。 |
| npm start + 默认 shutdown 定时即可保证优雅退出 | **排除为证明依据** | **来源：** Railway 默认 drain 0s，npm signal handling 有风险；**当前配置：** EVO/Host 均 npm start、有效 Settings time 未取。 | 不改生产之前只能标 `UNVERIFIED`；改启动配置需要授权、隔离验证和发布计划。 |
| #1074 Host shutdown attempt-all + admission close + nonzero failure | **工程候选采纳，暂不发布** | **源码/单测 + 45 CI：** 减少首个清理错误中断全部清理风险，非零退出保留锁。 | 仍不能证明生产 Railway signal、全局 stop、DBA/IdP；单独工程 Draft，不在本分支覆盖。 |
| 以环境布尔值/静态测试 Session 代替生产 Human IdP | **排除** | **既有 J4G Provider 工程是隔离契约**；**判断：** 不是生产 issuer、撤销/会话约束。 | 必须真实 issuer/audience/Subject/授权与 revoke SLA。 |
| 以 Vault / Kubernetes 为必选产品 | **未采纳** | **官网来源：** 可参考动态凭据与 Lease；**判断：** 没有企业产品选择证据。 | 等拓扑、运维组织、secret-provider 决策。 |
| 缺授权时合并 #1071/#1074 至 main | **当前排除** | **当前环境事实：** main 合并会自动触发 Railway 部署；**判断：** docs-only 也不可等同零副作用。 | 保留 Draft；取得发布/停机方案后依精确 HEAD 决定，不自行启用 WRITE。 |

## 6. 冲突、缺口及最值得继续查阅的方向

| 冲突 / 未决问题 | 本轮可证实内容 | 仍缺的证据或下一行动 |
| --- | --- | --- |
| Railway 默认 drain=0 与实际有效值 | 官网原文默认 0；Host/EVO 变量名中无 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`；服务配置接口没返回 Settings-pane 值。 | 由有权操作员只读核实服务 Settings 有效 draining/overlap；不要把默认误写为实际值。 |
| J4J 正向 SIGTERM 测试与 npm start 生产进程 | CI 单独 Node host 正常释放已通过；生产 Host 通过 npm start；Railway warns wrapper signal interception。 | 在受控**非生产**环境证明真实 PID/signal propagation/close/异常锁行为；明确生产 rollout 与 drain 变更授权前不得生产停机。 |
| Repo 有 EVO Worker vs Railway 无 Worker 服务 | `start:worker` / Compose 只证明代码和本地部署可用；Railway 当前配置运行 API。 | 全组织账号/平台、Runner、queue consumers/child processes 的拥有者声明及实时 inventory。 |
| PR #1074 45/45 vs main 10 fail | 两个不同 SHA、不同工作流范围；main `schedule test:all` 10 fail；#1074 的 PR CI 不等于全量定时 suite。 | 追踪全套失败的 owner/修复 PR，不能跨线改 BEX/Eidos；继续检查后续 main scheduled run，不丢反证。 |
| 两条旧 J4J CANCELLED 原因 | 工作流有 concurrency cancel-in-progress；旧日志 unavailable。 | **原因保持未证实**。不要重做过时旧 SHA 验收，最终 J4J merge 前已 45/45。 |
| #1074 PG18 初次 timed out，定向 rerun 成功 | 旧日志有 20.46s timeout（20s IPC threshold）；最终准确 HEAD 45/45 success。 | 后续仅在再次出现时判断是否 flaky/budget；不能抹去首失败。 |
| 身份与 credential 生产治理 | J4G providers 接口及 PG18 SQL least-privilege 工程已存在。 | 组织批准 IdP issuer、Human Operator 角色、revocation SLA、DBA NOLOGIN/LOGIN 边界、secret broker/rotation、集中审计。 |
| STOP_CONFIRMED 证明 | J4A fencing/J4J cooperative lock 有局部测试；Railway status Online。 | 完整权威清单、冻结扩缩容、逐 Worker supervisor termination receipt、PG 会话 re-query；实际分布式/多 Worker 故障注入。 |
| Host Validator 无 Authorization header | 只读解码当前配置脚本，确有 lifecycle-capable calls。 | 不能仅凭脚本断言真实未授权利用；Issue #988 OPEN，需真实路由/权限正反测试，不能运行生产 Validator。 |
| 外部来源快照易变 | 官方 Docs/PR/Actions 原 URL + 访问日期/章节保留；Railway 环境和 CI 随时变化。 | 新窗口以最新 GitHub/Railway 的 ref 和 run 状态覆盖“当前”，保留本次为历史证据。 |

## 7. 实施映射与交接恢复顺序

| 模块 / 所有权 | 当前材料与下一步 |
| --- | --- |
| J4J 协作锁 | `manager/pa05-read-owner-cooperative-host-lock.ts`、`manager/server.ts`、`tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs`，工程 #1057 MERGED；局部通过、默认 OFF，不重做。 |
| J4A/G-I SQL/Provider | `manager/pa05-read-owner-lifecycle-pg.ts`、`manager/pa05-read-owner-trusted-prestartup.ts`、[认证总账](PA05-CERTIFICATION-BASELINE-20261015.md) §§56–66；重用既定边界，不把测试身份签成生产 IdP。 |
| K0 实际生产拓扑 | [K0 主记录](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)，本交接新增来源与方案索引；必须取得组织对平台范围、所有进程与 external caller 的确认。 |
| K0→K6 实施框架 | [J4K 决策文档](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)，保持 `K0 NOT_SIGNED` 至拓扑和权威成立。 |
| Host shutdown 工程（其他独立窗口） | [PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) `manager/host-shutdown.ts` + server + unit/CI；**只引用，严禁本分支跨线修改**。 |
| 主线全套 10 failed（待对应 owner） | [Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504)；记录事实，不改 BEX/Eidos/其他业务线。 |
| 认证拒绝门禁 | Issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) OPEN，full E01J4 / PA05-05 E01–E05 / W06 NOT_SIGNED，production material WRITE OFF。 |
| 权威文档 | 本线仅更新专项 `docs/agent-line/HANDOFF.md` + `PA05-CERTIFICATION-BASELINE-20261015.md` 的交接链接，不覆盖 `project.status.json` 或生成的 `HANDOFF-LATEST.md`。 |

### 新窗口执行次序

1. 按 [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) 完整启动顺序，读取当前 main 与全局权威（只读）；然后本短入口、本索引、专项 HANDOFF、认证总账 §§62–66/67–75、J4K 决策、K0 主记录。
2. 检查 [PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) Draft 的**最新 HEAD 与全部 7 项 CI**及 PR 变更仅文档，别把交接前 HEAD 当最新；保持 Draft，除非明确取得发布授权。
3. 检查另一工程 [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) HEAD、CI、Draft/未部署状态；接续在原分支，不在 #1071 复制修复。
4. 检查当前 main 与 Railway 实际部署 SHA/状态，确认 schedule full-suite 10 fail 是否由其他工作线修复；不要使用旧时间片覆盖当前事实。
5. 继续只读补 K0 的未知来源；必要时由实际生产/身份/DBA owner 签署拓扑、drain 与 credentials，然后才考虑 K1/K2 隔离工程。绝不擅自开启 production material WRITE、清理异常锁或进行生产停机测试。

**附件和截图：** 未产生新的截图/视频/二进制。所有可定位证据为 GitHub 原始链接和 Railway connector 观察快照；不可访问的旧日志标注 NOT_VERIFIED，未伪造归档文件。


## 8. 2026-10-20 current-window refresh: source-grade revision, CI and retired-branch audit

**Archive class:** ADDENDUM_TO_WINDOW_ARCHIVE, no reinterpretation of previous historical timestamps. **New live inventory authority:** [K0 topology §19](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md). Access date: **2026-10-20**.

### 8.1 Directly read source and live connector records

| Original source / URL | Reading grade | What it proves / what it does not |
| --- | --- | --- |
| [main branch original API](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main) / [SHA](https://github.com/jiangxng/EVO-App-Platform/commit/102319de812ce65682f0c6ccb1a930e10b4e22d4) | **ORIGINAL_CONNECTOR_READ_THIS_WINDOW** | Actual main moved from historical `eaa5e813...` to `102319de812ce65682f0c6ccb1a930e10b4e22d4`, unrelated PR #1076. |
| [main exact-HEAD checks](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/102319de812ce65682f0c6ccb1a930e10b4e22d4/check-runs) / [main run list](https://api.github.com/repos/jiangxng/EVO-App-Platform/actions/runs?branch=main) | **ORIGINAL_CONNECTOR_READ_THIS_WINDOW** | **3/3 success** for *that push's* protocol-and-core, lightweight-host, continuity; not a complete `test:all` run and no evidence the pre-existing 10 failures were fixed. Latest 30 main run entries show scheduled `#39393603504` still failure, no subsequent scheduled full run in that inspected portion. |
| [PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) / [archived HEAD checks](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/bd5945c0bbd0d1c3b5522bc94a7e915c617d9fea/check-runs) | **ORIGINAL_CONNECTOR_READ_THIS_WINDOW** | Initial handoff HEAD 7/7 SUCCESS; Draft/unmerged. **New appended document commits must receive their own exact-HEAD CI verification.** |
| [PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) / [exact HEAD checks](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/caccb1b60358b453ef471eaf6abecf1593e4965c/check-runs) | **ORIGINAL_CONNECTOR_READ_THIS_WINDOW** | 45/45 success; Draft/unmerged, 201/201 Lightweight Host result inherited from its linked original Actions record; not Railway production signal or global stop proof. |
| [Railway connected project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | **ORIGINAL_CONNECTOR_READ_THIS_WINDOW**, `describe_environment`, `environment_status`, `list_deployments`, `describe_service` (read-only; no secret-value operations) | Latest Host deployment `dffc4413-07e5-4302-95ac-adcf737fbdfb` for exact main `102319de...`, SUCCESS/Online, 1 running 0 crashed. Prior `e5c56ed8...` REMOVED. Five connected project services, 0 separate Cron, no staged changes. Effective Settings-pane drain and individual child/Runner processes **NOT_VERIFIED**. |
| [Platform package.json at new main](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/package.json), [server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/server.ts), [plugin-runtime-host.ts](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/plugin-runtime-host.ts) | **ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW**, exact main, relevant matches (not full live process audit) | `npm start` invokes `node dist/manager/server.js`; server SIGTERM/SIGINT handlers and PROCESS `fork()` child + 750ms kill fallback exist. Runtime PID 1, signal delivery, actual active child count, child termination receipt not established. |
| [Railway — Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown), [Railway — NodeJS SIGTERM Handling](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) | **ORIGINAL_OFFICIAL_MARKDOWN_READ_THIS_WINDOW** from Railway docs connector, headings “Draining time”, “When you start your app with NPM...” | Teardown SIGTERM then configured draining interval prior to SIGKILL; npm wrapper may intercept, Railway advises direct Node. Effective deployed settings and signal chain **NOT_VERIFIED**. Official [variable default](https://docs.railway.com/variables/reference#user-provided-configuration-variables) remains **ORIGINAL_READ_EARLIER_ARCHIVED**, not newly re-read. |
| [Issues #988](https://github.com/jiangxng/EVO-App-Platform/issues/988), [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979), [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) | **ORIGINAL_CONNECTOR_READ_THIS_WINDOW** | All still OPEN, not closed by the new main push or either Draft PR. |

### 8.2 Exact safe-retirement inventory: audit complete, remote deletion not executed

Using original GitHub PR metadata, live branch SHA and `compare_commits(base=branch_tip,head=main)`, the following **nine still-present, PA05 task-produced historical documentation branches** have an associated MERGED PR, the current branch tip equals the PR's merged head, and their tip is an exact ancestor of the newest main (`behind_by=0`, `merge_base=tip`). These are **safe-retirement candidates**, not a claim that deletion happened:

| Merged PR | Existing branch | Exact expected HEAD |
| --- | --- | --- |
| [#974](https://github.com/jiangxng/EVO-App-Platform/pull/974) | `docs/pa05-d14c5-d14c12-research-decision-handoff-20261016` | `a5fc71ab12d4854875df51ca42223a66e4bdb24f` |
| [#1050](https://github.com/jiangxng/EVO-App-Platform/pull/1050) | `docs/pa05-e01j2-j4f-window-research-handoff-20261019` | `a4d258e2927dc57fde96e415233ffd187d0ebde6` |
| [#1052](https://github.com/jiangxng/EVO-App-Platform/pull/1052) | `docs/pa05-e01j4g-production-operator-trust-gate-20261019` | `82f65991aba943dd3319a96790a0284745d1bef7` |
| [#1059](https://github.com/jiangxng/EVO-App-Platform/pull/1059) | `docs/pa05-e01j4j-final-evidence-20261020` | `5bf4c9c6ce59076dcbb91b9dd776b4d4a409b0f7` |
| [#1062](https://github.com/jiangxng/EVO-App-Platform/pull/1062) | `docs/pa05-e01j4k-trusted-multiworker-stop-20261020` | `991e34f6caa011b05ec99c506919b9d121d7d975` |
| [#1064](https://github.com/jiangxng/EVO-App-Platform/pull/1064) | `docs/pa05-e01j4k-k0-topology-evidence-20261020` | `6bcb960b87855a5b91be4d00388a15052c59249c` |
| [#1065](https://github.com/jiangxng/EVO-App-Platform/pull/1065) | `docs/pa05-e01j4k-k0-postmerge-evidence-20261020` | `fe27267af40d14e393e6a6df2965cd3f043fb9c4` |
| [#1068](https://github.com/jiangxng/EVO-App-Platform/pull/1068) | `docs/pa05-e01j4k-postmerge-evidence-20261020` | `8fee1e9b4638df44451dcecbdf4752959cbfea7b` |
| [#1022](https://github.com/jiangxng/EVO-App-Platform/pull/1022) | `docs/pa05-window-research-handoff-20261019` | `ac2611725611c8a4f47364755b0a26cc51282147` |

**Implementation/permission boundary:** the connected GitHub action set offers no `delete_ref`/delete-branch operation or workflow-dispatch; remote branches remain **PRESENT**. No unsafe force move, file deletion, PR close or production-deploying merge was used as a substitute. The [current Branch Hygiene workflow source](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/branch-hygiene.yml) was **read as original**: auto-retirement of merged branches handles `agent/` and `docs/agent-` prefixes but not `docs/pa05-`; explicit `workflow_dispatch execute` requires a SHA-pinned `repository-hygiene/retired-branches.json` on default branch, verifies open PR refs, ancestry and race, and is not invocable via this connector. Future authorized retire action must recheck exact SHA, protection and current open references before deleting; active #1071 and #1074 must not be touched. J4J original `agent/pa05-e01j4j-cooperative-host-lock-20261019` is already absent.

### 8.3 Current decision and evidence gaps

**No design change:** retain central fencing epoch + *complete authoritative* Worker/caller inventory + external per-instance stop receipts + PostgreSQL session re-query + real Human/DBA/credential/audit authorities as the K0→K6 baseline. Keep #1074 shutdown patch isolated and Draft. Railway official docs' default 0 seconds and npm warning are **not** proof of the actual production Settings-pane draining value or PID signal path. This is still a **NOT_VERIFIED** blocker. Do not rerun the old Ecosystem Certification failure as PA05-owned, and never treat 3/3 limited current push CI as `test:all`.

**Unresolved dependencies:** authoritative inventory outside the connected Railway project, current PROCESS child PIDs and active-plugin runtime map, Runner/browser/external lifecycle reachability, effective drain override, PID 1 SIGTERM trace, responsible freeze/stop operator, production Human issuer and revoke SLA, DBA SQL role/session grants, approved credential broker, rotation/revocation and audit sink/signers. K0 and full E01J4/PA05-05 E01–E05/W06 remain **NOT_SIGNED**, #988/#979/#913 **OPEN**, and production material WRITE **OFF**. No production secret, DB or runtime state was read or modified.


## 9. 2026-10-20 K0 停机证据模板补充（本窗口有界原文查阅）

已新增 [K0 权威 Worker/外部调用者停机证据验收表](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)，类型 **CURRENT_GATE_EVIDENCE / UNSIGNED_OPERATOR_EVIDENCE_WORKSHEET**。不是已采集的生产 stop receipt，也不改变 J4K 已选设计。详细字段、未验证空白、适用范围与来源等级见表内 §§1–5。

| 新查阅源（原始 URL） | 阅读等级（2026-10-20） | 确认内容及限制 |
| --- | --- | --- |
| [Platform `plugin-runtime-host.ts` 精确 main](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/plugin-runtime-host.ts) 第 643–689 行 | **ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW** | `stop()` 先从 runtime map 删，再等 child exit，发 IPC shutdown 和 750ms SIGKILL fallback；`PROCESS_STOPPED` 为 Host 本地事件，**空 map 可能早于退出**。不代表线上孤儿进程已复现或已通过外部回执。 |
| [Platform child runtime 精确 main](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/plugin-runtime-process-child.ts) 第 204–209 行 | **ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW** | Child 收到 shutdown IPC 后请求 deactivate 并退出；只是源代码意图，不能证明实际生产所有 child 已收到信号。 |
| [GitHub workflow 目录原始 API](https://api.github.com/repos/jiangxng/EVO-App-Platform/contents/.github/workflows?ref=102319de812ce65682f0c6ccb1a930e10b4e22d4) 与此前 §14 | **ORIGINAL_GITHUB_DIRECTORY_READ_THIS_WINDOW**，完整文件名目录计 153 个；**不是重新扫描全部文件内容** | 生产调用者此前已全面源码盘点，§14 已包含 Web Version Skew/RUM。此次对其中 [.yml](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/.github/workflows/web-version-skew-rum-production-proof.yml) 和 [script](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/tools/web-version-skew-rum-production-proof.mjs) 原文复核确认直接 POST 遥测，非 PA05 material WRITE。 |
| [Railway Host service configuration](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | **ORIGINAL_RAILWAY_CONNECTOR_READ_THIS_WINDOW**；`get_service_config` 与 `describe_service` | `deploy` 返回字段无 effective drain/overlap，变量名无 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`。这**不证明** Settings-pane 默认值实际为 0；需要实际配置操作者只读截图/受信配置证据。 |
| [GitHub Branch Hygiene 原始 workflow](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/.github/workflows/branch-hygiene.yml) 与 9 条源 branch/PR/compare API | **ORIGINAL_GITHUB_SOURCE_AND_REF_READ_THIS_WINDOW** | 9 条 PA05 docs 合并分支还存在、HEAD 不变、均非 protected、不被全部 **13 条**当前 open PR 引用；精确 tip 为 main 祖先。**只读安全退役审计已完成，删除未执行**：连接器不具备 delete ref / workflow dispatch；原 workflow 的自动合并清理只覆盖 agent/、docs/agent- 前缀，不匹配 docs/pa05-。 |

**增量结论：** 外部 caller 与子进程不能用同一种“停机”证据。常驻 Worker 需要独立 OS/编排死亡回执；GitHub Runner/浏览器/临时 Validator 需要受保护路由/SQL 准入的 fail-closed deny，完整列表与独立权限边界需由组织签收。实际组织 stop/IdP/DBA owner 仍 `UNVERIFIED`，K0 `NOT_SIGNED`，WRITE `OFF`。两条 Draft PR 未合并。


## 10. 2026-10-20 后续 main / Railway 实际部署快照

**新独立控制面原文：** [GitHub main SHA `6fc8fac5...`](https://github.com/jiangxng/EVO-App-Platform/commit/6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1) 由其他 owner 的 #1078 合并产生， [exact check-runs](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1/check-runs) **40/40 SUCCESS**，`ORIGINAL_GITHUB_API_READ_THIS_WINDOW`。Railway connector `list_deployments` + `environment_status` **ORIGINAL_CONNECTOR_READ_THIS_WINDOW**：Host `002dc2d8-3fd5-42d2-88d5-8386c268b5e1` 对应 `6fc8fac5...` `SUCCESS/Online/1 running/0 crashed`，前一个 `102319de...` deployment `REMOVED`。

**不替代反证：** main 在旧 SHA 的 [Ecosystem schedule #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) 仍曾 10 FAIL/82 skipped；后续 40/40 是另一组提交检查，不代表完整定时 `npm run test:all` 通过。#1074 工程未合并/未部署，Railway 真实 drain、Worker 停机/外部回执、Human IdP/DBA 凭据治理未签。详见 [K0 拓扑 §21](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md) 与 [未签收验收表](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)；文档上一 HEAD `249fa43b6da7d68279fed488e96e923d7c35e857` 已获 **7/7 exact-HEAD CI SUCCESS**，本更新将推进 HEAD，后续应重新验 CI。


## 11. #1078 后主线 Host shutdown 段源码一致性核查

**ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW，2026-10-20：** [旧 main manager/server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/server.ts) blob `d1c50cc2c4c52bd251146ce84dfc6acfeca45e53` 对照 [新 main](https://github.com/jiangxng/EVO-App-Platform/blob/6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1/manager/server.ts) blob `019b42a97aca18403245bf8480978638eacb65e5`；整个从 `let shuttingDown = false;` 到文件尾 SIGTERM/SIGINT 注册的 1449 字符片段**逐字相同**，虽然同一文件其余部分随 #1078 变更。精确代码部分相同不是 runtime PID/信号/停机证明。**工程判断**：#1074 仍 Draft/未合并/未部署，生产 Host 没有其新 cleanup exception/error-path 保障。详见 [K0 §22](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)。不改 #1074、不重构并行治理代码。


## 12. 2026-10-20 — Host PA05 受保护入口直接源码证据与 K0 R3 收敛

| Source / 阅读日期 | 阅读等级 | 本轮精确发现及适用边界 |
| --- | --- | --- |
| [Platform `manager/server.ts`（`6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1`）](https://github.com/jiangxng/EVO-App-Platform/blob/6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1/manager/server.ts)，2026-10-20，blob `019b42a97aca18403245bf8480978638eacb65e5` | **ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW，读取实际源码相应原行号** | 3274–3357 bootstrap+Authorization Provider 与目标包作用范围；3363–3415 默认 OFF 的 J4D SQL authority；6982–7073 默认 OFF 的管理员注册；9421–9452/9819–10063 的 Action mutations；10099–10219 的 direct HTTP/plan 路由。完整分类与测试缺口见 [K0 工作表 §6](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)。这是代码事实，不是生产请求或权限测试。 |
| [Railway production service configuration](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601)，2026-10-20 | **ORIGINAL_RAILWAY_CONNECTOR_READ_THIS_WINDOW**（`describe_service` / `describe_environment`，只读） | 5 服务、Host 1 副本、无 Cron/已暂存变更；变量名没有显式 E01D/J4D/J4J opt-in。有效 drain/进程树、实际 SQL grants/IdP 均没有返回；不读取 Secret 值。 |

**决策：原 K0 边界保持不变。** 实施前先要求外部组织权威提交完整 Worker/临时调用者边界、冻结扩缩容/重启收据、旧 SQL Backend 实际失效证据，以及生产 IdP/DBA/Audit Owner 签字。五条 HTTP 或 Action 的静态检查不能替代这组准入证明；不做生产探针或动作。#1071 / #1074 继续 Draft，production material WRITE OFF。


## 13. 2026-10-20 — PROCESS child 异步停机竞态原始源码与新主线时间片

| 来源 | 阅读等级 | 已读原文事实与工作线解释 |
| --- | --- | --- |
| [`manager/plugin-runtime-host.ts` at `main@91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa`](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/manager/plugin-runtime-host.ts)，blob `7554a10065b907a1fd89c194505f7e5e9cb047f1` | **ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW**，331–434、591、643–689 行 | `stop` map 删除早于 child exit；`shutdown()` snapshot map，`invoke()` 可进入 `start()` 且所审阅的类中无关闭准入标记。竞态由源代码推导，**尚未实际测试或生产复现**。不能以 map 空或 parent completed 取代外部可信进程回执。 |
| [`manager/server.ts` at 同一 SHA](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/manager/server.ts)，blob `6d5878fc9030bd2de910106f6566b5f4adb9ead7` | **ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW**，第 2311–2312 行及 PA05/Host shutdown 对照 | 生命周期通知对 PROCESS child 调用 `void stop`，并非全域 await。与前一个 main 逐段比较，PA05 管理员/生命周期入口、shutdown 段逐字相同；该比对不证明生产进程停止。 |
| [current main `91ffb9bd...` checks](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/check-runs) 与 Railway [project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | **ORIGINAL_GITHUB_API_AND_RAILWAY_CONNECTOR_READ_THIS_WINDOW** | Governance PR #1079 使 main 推进，**39/39 exact SHA checks SUCCESS**；Railway deployment `9aa54df8-26ca-43aa-a598-9b547f276a5c` 对应此 SHA 且 SUCCESS。旧 Ecosystem scheduled 全套 10 FAIL/82 skipped 反证仍独立保留，不因局部 checks 变绿而抹去。 |

**K0 影响与不采用的证据：** 因子进程清单可能在尚未 exit 时提前消失，明确拒绝“Host map 空”作为 Worker `STOP_CONFIRMED`。未来隔离进程测试要覆盖 stop 与 shutdown 重叠、fork 与 shutdown 竞争、失联 child、父进程 SIGKILL 和跨服务重启竞态。仅保存设计用例，不重复开发 #1074，也不做生产 stop/身份/DBA 操作。K0、完整 E01J4、PA05-05 E01–E05 和 W06 全部 `NOT_SIGNED`，production material WRITE `OFF`。


## 14. 2026-10-20 — Existing tests and Railway trace metadata (targeted gap closure)

| Source / original URL | Access grade and date | Evidence and limits |
| --- | --- | --- |
| [`tests/protocol/process-runtime-host.test.mjs`](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/tests/protocol/process-runtime-host.test.mjs), blob `41099d341c956b67fcf998fe05f841a5e6efed88` | **ORIGINAL_FULL_FILE_READ_THIS_WINDOW**, 2026-10-20 | Explicit tests for PROCESS isolation/invocation, timeout/crash recovery, provenance; no identified explicit stop/shutdown concurrency test. Does not assert all tests elsewhere absent. |
| [PR #1074 test](https://github.com/jiangxng/EVO-App-Platform/blob/caccb1b60358b453ef471eaf6abecf1593e4965c/tests/agent-line/pa05-host-shutdown-error-path.test.mjs), blob `7de61c117653c71866298c4061315ee991153117` and [new `manager/host-shutdown.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/caccb1b60358b453ef471eaf6abecf1593e4965c/manager/host-shutdown.ts) | **ORIGINAL_FULL_FILE_READ_THIS_WINDOW**, 2026-10-20 | Four Host cleanup failure/HTTP 503 tests; does not include PROCESS child registry race or independently observed Worker stop. #1074 Draft, not production. |
| [PA05 J4J cooperating Host test](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs) blob `84785a29006e8f7e55096727d1ba8b8714dd513d` | **ORIGINAL_PARTIAL_SOURCE_READ_THIS_WINDOW** (test-case/exit sections), 2026-10-20 | Graceful/restarted/abnormal Host lock paths but bounded local co-operators only. |
| [Railway connected production project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | **ORIGINAL_RAILWAY_CONNECTOR_METADATA_READ_THIS_WINDOW** (`get_tracing`, `list_webhooks`, `list_tcp_proxies`), 2026-10-20 | 5/5 services tracing disabled, autoInstrumentation disabled; 0 project webhooks; 0 Host TCP proxies. Does not imply no external HTTPS/private-net/database callers. No runtime logs/traces or secrets retrieved. |

**Gap ownership, not new architectural decision:** [K0 worksheet §8](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) differentiates #1074 Host error-path patch, a future disposable PROCESS concurrency verification, authorized infrastructure identity + actual stop receipts, and privileged SQL/IdP owners. Source-derived coverage gap **not** an observed production race. Current explicit K0 sign-off status remains `NOT_SIGNED`.


## 15. 2026-10-20 — CI 真实负面复现原始日志证据、版本和阅读等级

| 原始来源 / URL | 本轮阅读等级 | 关键发现 / 非事实边界 |
| --- | --- | --- |
| [PR #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081)、[首个测试 HEAD](https://github.com/jiangxng/EVO-App-Platform/commit/6eeb01b01c680d1e0c90999c5a79fcc6776493c0) | **ORIGINAL_GITHUB_SOURCE_AND_PR_READ_THIS_WINDOW，2026-10-20** | 独立 Draft，两个新增文件 `tests/fixtures/pa05-k0-delayed-process.mjs`、`tests/protocol/pa05-k0-process-shutdown-negative.test.mjs`，没有 production Host 代码或 Railway 改动。测试代码在 CI 后另有仅证据输出时序修正，后续 HEAD 必须单独验 CI。 |
| [Platform CI #39426909610 / job #118641659592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39426909610/job/118641659592) | **ORIGINAL_GITHUB_ACTIONS_RAW_JOB_LOG_READ_THIS_WINDOW**，2026-10-20T13:02:06Z | `ok #759` 的 stop/shutdown overlapping child 实测，`shutdownReturnedWithChildAlive=true`、`shutdownSkippedInFlightStop=true`；`ok #760` 的 shutdown 后 fork 实测，`spawnedAfterShutdown=true`。全部 `globalStopCertified=false`。该 job 1087 total / 1086 pass / 1 skipped / 0 failed；5/5 exact HEAD check SUCCESS。原始两个 JSON 保留在 [工作表 §9](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)；留意 Actions 日志保留期。 |
| [main@ae704ad7](https://github.com/jiangxng/EVO-App-Platform/commit/ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9)、[exact checks](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9/check-runs) | **ORIGINAL_GITHUB_API_READ_THIS_WINDOW**，2026-10-20 | PR #1080 合并后的 main，4/4 commit checks SUCCESS，但非定时 `test:all`。不能把已知 schedule 全套 10 FAIL 视为消失。 |
| [Railway connected project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | **ORIGINAL_RAILWAY_DEPLOYMENT_AND_HEALTH_METADATA_READ_THIS_WINDOW**，2026-10-20 | 新 Host `5c88b3df-8a6c-4225-976d-cc2ccda97d9e` 对应 `ae704ad7...` SUCCESS / Online；旧 `9aa54df8...` 显示 CRASHED，但当前 Host 1 running/0 crashed，不推断旧状态的根因或当前故障。 |

**决定与分支职责：** 独立复现已把静态风险证据升级为隔离真实反例，**尚未进行修复**。保持 #1071 文档、#1074 Host 顶层清理、#1081 PROCESS 负面验证三线独立 Draft，禁止把 #1081 的“绿灯”解释为 K0 认证成功。继续 central fencing + 外部编排 stop receipts + PostgreSQL session re-query + IdP/DBA audit gate；不得以本机排他、CI 或 Lease 超时替代。
