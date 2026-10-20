# PA-05｜E01J4G–J4J 本窗口研究资料、原始证据与方案决策索引（2026-10-20）

**文档类型：HISTORICAL_SNAPSHOT / RESEARCH_REFERENCE_DECISION_LEDGER。** 本文件只固定当前聊天窗口 2026-10-19 的源码查阅、GitHub CI、Railway 和网络故障证据，以及 2026-10-20 交接复核所得的新事实；不取代持续更新的认证总账或全局 `project.status.json`。配套简短入口：[E01J4G–J4J Window Handoff Entry](PA05-E01J4G-J4J-WINDOW-HANDOFF-ENTRY-20261020.md)。

**仓库：** https://github.com/jiangxng/EVO-App-Platform 。
**交接工程原始状态：** main `5919e0147232fef1ddfc4f7e9a38b67969100bcf`；工作分支 `agent/pa05-e01j4j-cooperative-host-lock-20261019`，**截至这次交接开始时**原工程 HEAD `16e00238026f015fc233f38207b8d0c38ee480db`，PR [#1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) OPEN。为归档而提交本文件后 HEAD 会前进；**以新窗口实时 GitHub HEAD 和交接回答的归档提交号为准**，不得复用原工程 HEAD 冒充最新。

## 0. 严格的资料阅读等级

| 等级 | 确切含义 |
| --- | --- |
| **ORIGINAL_GITHUB_SOURCE** | 本聊天于 2026-10-19 / 本次整理于 2026-10-20，使用已连接 GitHub API **直接取得源码、README/决策文档或 PR 对象原始内容**；局部截取仅证明所见片段，非全仓安全审计 |
| **ORIGINAL_CI_LOG** | 本聊天/本次整理调用 GitHub workflow job log，直接见到指定 marker、测试汇总或 TypeScript 错误；**不代表其后文档提交的新 HEAD 已通过** |
| **ORIGINAL_STATUS_WEB** | 通过 web 打开 GitHub Status 原始事件详情页，读取原文和 UTC 更新时间 |
| **ORIGINAL_CONNECTOR_STATE** | GitHub / Railway 官方连接器读到的对象状态或部署状态，不等于浏览器 Human 操作或生产数据库访问 |
| **INHERITED_PRIOR_WINDOW** | 2026-10-16、此前 2026-10-19 的已归档 PostgreSQL 官网研究、J2–F 验证来自老交接文档；**本窗口未重复打开那些 PostgreSQL 原文**，不可改称此窗口亲读 |
| **SEARCH_SNIPPET_ONLY** | 只看检索摘要未打开原文；本轮用于正式方案决策的**新增引用为 0** |
| **ANALYSIS / TO_VERIFY** | 源码和证据基础上的工程判断、跨 Worker 推断或仍欠缺的认证；不是第三方权威来源，不得标记已验证 |

原文查阅日期如无另外注明为 **2026-10-19**；`复核 2026-10-20` 是重新取得原始 API/网站资料。所有 UTC 时间以 GitHub 原文为准，避免把自动续跑提示的当地时间混成 Actions 事件时间。本轮**没有任何新制作的截图、PDF、测试现场影像、生产证书、Credential/DBA 授权附件**；相应资料位置标为「无／待真实采集」，禁止编造。

## 1. 直接阅读的项目原始文件索引（附确切 GitHub URL）

以下各项使用同一个明确快照 `5919e0147...`（已并入 main 的 G/H/I）；J4J 尚未合并的文件使用其**原工程 HEAD** `16e00238...`，可在 PR #1057 按文件导航。点击链接的 URL 是项目源文件原始位置，不是另造外部文献。

| 编号、原始网址 / 原文标题 | 访问日期、阅读状态、事实摘要 | 对应模块与具体用途 |
| --- | --- | --- |
| GH-01 [AI Bootstrap](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/AI-BOOTSTRAP.md) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；顺序 `AI-BOOTSTRAP → project.status → 当前 handoff → LLM → foundation map`；聊天记忆非事实权威 | 新窗口恢复规则、避免错用老项目快照 |
| GH-02 [Project Status](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/project.status.json) / [Generated Handoff](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/docs/roadmap/HANDOFF-LATEST.md) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；项目全局当前视图仍包含历史 TR-01 主线快照，不能拿来覆盖 PA05 独立认证总账；generated 文件不能手改 | 不碰主线、不重构全局状态 |
| GH-03 [LLM Context Contract](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/LLM.md) / [Foundation Map](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/llm.foundation-map.json) / [Delivery Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；复用已验工程、一个活动短 PR、精确 HEAD CI、合并和删除分支；Host 默认轻量按需 | 控制分支/交付方式、避免 PR 分叉和权限漂移 |
| GH-04 [Plugin extension boundary constitution](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | 10-19 **ORIGINAL_GITHUB_SOURCE**；通用 Core 只拥有宿主机制，特定 Provider/业务按 owner 分离 | J4J 只加 PA05 内部接线，不推广成未经认证的全平台锁协议 |
| GH-05 [PA05 Certification Baseline](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md) §§62–66 / [Agent Handoff](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/docs/agent-line/HANDOFF.md) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；G/H/I 工程 PASS，§66 J4J 待精确 CI；E01J4、E01–E05、W06、生产 WRITE 限制明确 | 本线权威总账与新窗口第一验收入口 |
| GH-06 [Host server](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/manager/server.ts) | 10-19 **ORIGINAL_GITHUB_SOURCE**；约第1043行 `APP_PLATFORM_STATE_FILE` 加载、E01I startup quarantine；J4J 仅 OPT_IN 时在 State 加载前获得锁；进程 `exitCode === 0` 才 release，原服务 SIGTERM/SIGINT 关闭位于文件末尾 | 实际 Host 启动、业务/认证门禁不变；不把服务启动当全 Worker 证明 |
| GH-07 [J4G trusted prestartup](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/manager/pa05-read-owner-trusted-prestartup.ts) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；请求绑定 HUMAN Session、每次即时 `authorization.check`、Host 范围 `secrets.resolve`；无 CLI/生产 IdP；SQL 秘密不落日志 | G 的身份、授权和 DBA 密钥供应内聚边界 |
| GH-08 [J4H durable audit](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/manager/pa05-read-owner-prestartup-audit.ts) | 10-19 **ORIGINAL_GITHUB_SOURCE**；单 Host 0700/0600、O_APPEND+fsync 仅非秘密 `AUTHORIZED`/`COMPLETED` JSONL；非签名/非分布式审计 | 独立维护安全审计，不可冒充不可篡改证明 |
| GH-09 [J4I one-shot](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/manager/pa05-read-owner-one-shot-prestartup.ts) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；严格 opt-in、私有持久 state、umask 077、exclusive 文件锁、复用 J4G/H/F SQL FENCED UNINSTALL；锁**原来只保护 maintenance–maintenance** | J4J 的设计起因，下一步不重做 J4I |
| GH-10 [J4J cooperating Host lock](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/manager/pa05-read-owner-cooperative-host-lock.ts) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；`stateFile + ".pa05-one-shot.lock"` 与 J4I 相同，O_CREAT|O_EXCL|O_NOFOLLOW；权限/owner/inode 核实、禁止锁偷取；仅协作 POSIX 文件系统 | J4J 的实际新增代码；多节点证据还不存在 |
| GH-11 [J4F recovery](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/manager/pa05-read-owner-prestartup-recovery.ts)、[DB authority](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/manager/pa05-read-owner-lifecycle-pg.ts)、[Host lifecycle](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/manager/pa05-read-owner-host-lifecycle.ts) | 10-19 **ORIGINAL_GITHUB_SOURCE**；DB 先 FENCE、再本地 UNINSTALL、再 COMPLETE；`session_user` 和 EXECUTE-only operator 授权；JSON+PG 非单事务 | 保留 J4E/F 原地可恢复链路、不重做语义 |
| GH-12 [Secrets store](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/manager/secret-store.ts)、[Secrets Provider](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/providers/secrets/runtime.ts)、[Request Session Provider](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/providers/request-session/runtime.ts) | 10-19 **ORIGINAL_GITHUB_SOURCE**；AES-256-GCM 文件密钥参考实现、request Session 契约、可注入 Secret Provider；不证明生产 IdP 与 DBA 轮换 | 排除“已有参考 Provider = 已签生产运维”错误推断 |
| GH-13 [Physical recovery PG test](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/tests/agent-line/pa05-e01j4f-prestartup-recovery-pg.test.mjs)、[J4H audit test](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/tests/agent-line/pa05-e01j4h-durable-audit-pg.test.mjs)、[J4I negative test](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/tests/agent-line/pa05-e01j4i-one-shot-host-pg.test.mjs) | 10-19 **ORIGINAL_GITHUB_SOURCE**；真实三 PG18 SQL 恢复、真实 SIGKILL 审计/维护文件、权限负面 | 不把测试夹具当生产凭据 |
| GH-14 [J4J independent Node test](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs) / [strict CI workflow](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/.github/workflows/agent-pa05-cross-database-admission.yml) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；真实分离 Node Host，未设置环境开关的默认 OFF，对抗另一个 Host、J4I、SIGTERM、SIGKILL、`exit(1)`；CI 固定 28/28 0 skip + marker | J4J 现有验证门禁的真实代码位置 |
| GH-15 [J4G trust gap](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/docs/agent-line/PA05-E01J4G-PRODUCTION-OPERATOR-TRUST-BOUNDARY-20261019.md)、[G engineer](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/docs/agent-line/PA05-E01J4G-PROVIDER-TRUST-ENGINEERING-20261019.md)、[H](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/docs/agent-line/PA05-E01J4H-DURABLE-PRESTART-AUDIT-20261019.md)、[I](https://github.com/jiangxng/EVO-App-Platform/blob/5919e0147232fef1ddfc4f7e9a38b67969100bcf/docs/agent-line/PA05-E01J4I-ONE-SHOT-HOST-RECOVERY-20261019.md)、[J](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/docs/agent-line/PA05-E01J4J-COOPERATIVE-HOST-EXCLUSION-20261019.md) | 10-19、10-20 **ORIGINAL_GITHUB_SOURCE**；已写定各阶段采用/未采用方案和不签收范围，部分原记录是当时的候选快照，不应替代后续 PR 当前状态 | 直接继承阶段决策，不重写已通过研究 |

### 1.1 只继承、不伪装本窗口读过的旧网络研究

- [E01J2–J4F 历史短入口](PA05-E01J2-J4F-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md) 与 [J2–F 详细来源索引](PA05-E01J2-J4F-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)：**INHERITED_PRIOR_WINDOW**；确切原始网页 URL、章节和“已读原文/摘要”级别在旧索引；本窗口 2026-10-19 没有重新浏览这些 PostgreSQL 官网页面。
- 更早 [E01J1 历史入口](PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md)、[E01J1 参考索引](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)、[2026-10-16 D14C5–D14C12 原文索引](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md)：**INHERITED_PRIOR_WINDOW**。不要把历史“已读原文”外推为 10-19 J4J 本窗口重读。

## 2. 原始 PR/Actions 与关键 CI 证据（重要、易变）

以下均为项目真实 GitHub 路径，检查“原始日志”注明确切 Actions run 和 job；不能把较旧 SHA 的 PASS 套到较新文档 HEAD。所有 PR merge SHA 已于 **2026-10-20** 通过 GitHub 原始 PR 信息重新核验。

| 阶段、标题 / 原始 URL | 原始结论、精确定位及资料状态 | 对新窗口的意义 |
| --- | --- | --- |
| G [PR #1053](https://github.com/jiangxng/EVO-App-Platform/pull/1053) / [CI #39270689657](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39270689657) | **ORIGINAL_CONNECTOR_STATE + 本窗口继承的原始 log 观察**；PR MERGED `main@9a3edf8dd1c6b98b304cd55ea4f4442c60223068`；真实三 PG18 **25/25、0 skipped**；HUMAN Provider 信任组合工程 PASS，非 IdP 生产签收 | 不重复 G 工程 |
| G 合并后的真实失败 [Actions #39271124305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39271124305) | **ORIGINAL_CI_LOG（本窗口此前已查）**：原有 E01J2 场景中 `postgres.js 3.4.9` `connection.js:255` 断链读取 null.write，报表 21 tests/20 passed/1 failed/0 skipped；PR G 原成功不抹除主线偶发失败 | TCP 原进程稳定性 P0 OPEN，后续绿测不等于已修 |
| H [PR #1055](https://github.com/jiangxng/EVO-App-Platform/pull/1055) / [main CI #39273862092](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39273862092) job `118132949808` | **ORIGINAL_CI_LOG + PR VERIFIED**；MERGED `da8188c78b1dc784e19776b20459e9b44da6de2a`；三 PG18 **26/26、0 skipped**；J4H FSYNC 审计单机真实 SIGKILL 防虚报 COMPLETED | G/H 正证据保留，不能视为签名审计 |
| I [PR #1056](https://github.com/jiangxng/EVO-App-Platform/pull/1056) / [post-main #39277102943](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39277102943) job `118144238106` | **ORIGINAL_CI_LOG + PR VERIFIED**；MERGED `5919e0147232fef1ddfc4f7e9a38b67969100bcf`；三 PG18 **27/27、0 skipped**，包括 J4I 正负 marker；`noProductionMaintainerCli:true`、`distributedHostLockCertified:false` | J4I 原有状态和局限固定，不要重新实现 |
| I 初始失败 [#39275960370](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39275960370) job `118140198664` | **ORIGINAL_CI_LOG（本窗口已查）**：27/26/1/0；测试夹具 `umask 077` 设置较晚，期望锁拒绝而更早命中安全配置拒绝。首轮另有 TypeScript Stats 重载错误，在同 PR 修正；不能只记录 PASS | 负证据、修复原因不可删除 |
| J [PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) / [real PG18 run #39281032761](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032761) **job `118155037302`** | **ORIGINAL_CI_LOG，2026-10-20 复读**。J4J 原工程 HEAD `16e00238026f015fc233f38207b8d0c38ee480db`：原始 stdout `ℹ tests 28`, `ℹ pass 28`, `ℹ fail 0`, `ℹ skipped 0`；`PA05_E01J4J_COOPERATING_HOST` 确认真实独立 Node Host/default OFF/第二 Host 拒绝、在线 Host 排除维修、正常 SIGTERM 释放、SIGKILL 与 exit(1) 留锁，Secrets 未触及 | **明确这 28/28 已是真测试 PASS，不要延续旧“全部 queued”结论**。但整 PR 仍未全绿 |
| J 取消工作流 [Memory Review #39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878) / [Experience P1.3.1 #39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769) | **ORIGINAL_CONNECTOR_STATE，2026-10-20**：同精确原工程 HEAD 总计 **45 workflow = 43 SUCCESS / 2 CANCELLED**；取消作业无 test steps，分别是 `test` job `118155041969` 与 `experience` job `118155056976`。取消原因**未被证实**，不能擅称并发覆盖或忽略。 | 新窗口先判断是否属于必需检查，并在原 PR 恢复其真实通过，不能凭 43/45 合并 |
| J 历次 PR 证据评论 [#1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057#issuecomment-6271442083) | **ORIGINAL_GITHUB_SOURCE**：记录 45 queued 时的事实及当时 GitHub 状态事件。它是历史时间切片，**2026-10-20 已不适用“仍排队”** | 防止新窗口从评论误判当前 |
| 未决 [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) | **ORIGINAL_CONNECTOR_STATE，10-19 核验 OPEN**；前者生命周期所有路由，第二真实 Human/Personal Agent/Provider E2E，第三 WRITE 生命周期原子 fencing。**新窗口仍须刷新** | 不通过 J4J 工程绿测强行关闭认证问题 |

### 2.1 原始 J4J 正向日志的核心非秘密摘要（保留在此，方便 Actions 保留期后恢复）

**原始出处：** [#39281032761](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032761) → job `118155037302` → 测试输出阶段约 **2026-10-19 15:58:42 UTC**、汇总 **15:58:55 UTC**。

`PA05_E01J4J_COOPERATING_HOST` 的实际真值：`actualSeparateNodeServer=true`，`hostHoldsSameStateLock=true`，`secondCooperatingHostDenied=true`，`onlineHostExcludesMaintenanceBeforeIdentity=true`，`cooperativeGracefulExitReleases=true`，`operatorDenialAfterHostStop=true`，`crashLeavesAmbiguousLock=true`，`staleLockBlocksRestart=true`，`nonzeroHostExitLeavesLock=true`，`noSecretsTouched=true`，`defaultHostModeStillOff=true`。同一 marker 的真实限制为 `multiWorkerGlobalStopCertified=false`、`actualProductionOperatorIdpCertified=false`、`productionMaterialWriteEnabled=false`、`pa05Signed=false`。

原始 Node test reporter **28/28 PASS / fail 0 / skipped 0**；J4I 同 suite 仍输出 `noProductionMaintainerCli=true`、`productionIdentityCertified=false`、`distributedHostLockCertified=false`、`crossStoreAtomicityCertified=false`。这是**本地协作锁隔离工程正证据**，不是生产全 Worker 离线证明。

**附件/截图：** 未制作。若原 CI 日志链接过期，则用仓库中的测试断言、本段原始 stdout 摘要和提交 SHA 交叉核实；但**此摘要不能当作原始日志永久存证的等价物**，如需合规证据另建受控工件留存。

## 3. 本窗口确实打开的外部网站原文：GitHub Actions 故障

**WEB-01：** [Degraded availability for GitHub Actions, GitHub Pages and Webhooks — 官方 GitHub Status 事件](https://www.githubstatus.com/incidents/8tzbpcnl75jp)。访问：**2026-10-20 本次交接打开官方原文**，历史 2026-10-19 晚本窗口亦曾打开 GitHub Status 首页并读取当时事件。级别：**ORIGINAL_STATUS_WEB**，非搜索摘要。

原网页关键位置按状态更新：`Investigating` **2026-10-19 15:49 UTC**：Actions / Pages；`Update` **15:50 UTC**：Webhooks；`Update` **15:56 UTC**：确认 Action 处理、Pages 建站、Webhook 延迟；`Update` **16:30 UTC**：恢复中，状态更新/部署/回调仍可能延迟；`Monitoring/Resolved` **16:56 UTC**：官方标记已恢复/解决。GitHub 官网 [Status 首页](https://www.githubstatus.com/) 在 2026-10-20 显示 **All Systems Operational**。

**来源事实：** GitHub 当日存在全局平台服务退化，随后恢复。**工程推断**：它与本仓库和 Eidos 当时大量工作流排队时间重叠，可能与 Runner 延迟有关。**不可声称**每条作业 15:35 即已排队完全由 15:49 才发布的事件引起，也不能据公共状态页确定本仓库额度、并发或排队的唯一原因。已恢复后 #1057 真实跑出 43 SUCCESS/2 CANCELLED，应以此为当前工作门禁。

**WEB-02：** [Eidos Actions 工作流列表 API](https://api.github.com/repos/jiangxng/eidos/actions/runs?per_page=100) 及 [Eidos 仓库](https://github.com/jiangxng/eidos)。访问：**2026-10-19**，级别：**ORIGINAL_CONNECTOR_STATE**；当时读取 Eidos 最近 100 runs，其中 10 queued / 90 completed，早前最近成功的 CI 在 15:21 UTC；其用途仅为跨仓排队现象的交叉观察，不推断 Eidos 代码故障，不修改 Eidos。

**不曾阅读或不能确认：** 这次 GitHub incident 的最终 RCA（事件页仍注明将来发布详细 RCA）、GitHub repo 专属 billing/quota/runners 管理页、生产 IdP/DBA/密钥、跨机器操作系统锁语义实测、生产数据库连接与企业客户操作记录。它们全部为 **TO_VERIFY**。

## 4. 采用与排除方案对照：来源事实 vs 本线工程判断

| 候选与结论 | 事实依据 | 采用/排除理由和有效条件；限制 |
| --- | --- | --- |
| **采用 G**：既有 Host Session / Authorization / Secrets Provider 组合 | GH-07/12 + 25/25 真 PG18 | **工程判断**：可复用现有认证契约，避免“布尔环境变量=管理员”。Test-only bearer/静态策略≠真实 OIDC/轮换；生产签发 OPEN |
| **采用 H**：私有本地审计 AUTHORIZED→COMPLETED + fsync | GH-08 / H 26/26 | **工程判断**：阻止 OS SIGKILL 后虚构 COMPLETE；不具备密码学防篡改、中央多节点留存 |
| **采用 I**：只读受限入口加载原 Host JSON / one-shot exclusive | GH-09 / I 27/27 | **工程判断**：不使用内存空状态代替真实状态；仅可恢复 DB 已 FENCED UNINSTALL；I 锁仅串行维修、未锁正常 Host |
| **采用 J**：普通 Host 默认 OFF 的同名 O_EXCL 协作锁 | GH-06/10/14；J 28/28 raw | **工程判断**：以最小改动补 Host 运行中与 J4I 竞争；必须全部参与同一可信文件系统，单 Host/同一文件命名空间有效；不能签多 Worker/global offline |
| **采用 J 异常保留锁**：`exitCode===0` 才 release；SIGKILL/exit(1) 留锁 | GH-06/10/14；J marker | **工程判断**：非零退出含未知未清理业务副作用，不可由“进程不见了”推断安全；缺人工 stale-lock runbook |
| **排除**：`AUTHORIZED=true`、Agent 自陈 Host/principal、Bearer 文本信任、用 SQL URL 作为认证 | G 源码/生产 gap 决策 | 身份与权限两条独立真信号未成立，越权风险；测试环境临时 bearer 只可用于隔离验证 |
| **排除**：自动删除遗留锁 / 根据 PID 判断锁失效 / 直接重启 | J4J fail-closed 源码 + 测试 | 有可能仍有其他 Host/Worker 或存储事务，缺独立离线证明；只能在另行批准运维流程中操作 |
| **排除**：直接将 local lock 称为分布式 Lease/全局停机 | GH-09/10/14 的范围限制 | 不验证共享 NFS/多节点 O_EXCL、Worker 全员 opt-in/停机、网络隔离；需控制平面/受信租约 |
| **排除**：复做 J2–I PostgreSQL 研究和复制成功测试 | 原 17→27 / 旧详细索引 | 版本化保留过去通过及失败；本轮仅加 J4J 一项 28；CI 正常回归不等于重复开发 |
| **排除**：绕过/暂时删除 GitHub checks 或靠 43 success 当成全通过 | #1057 两个 CANCELLED 原始状态 | 完整 Host 变更仍影响更广泛插件体验，须判断取消项目是 required 还是 superseded，采取原 PR 有根据的重跑或修复 |
| **不采用/尚未决定**：具体生产 IdP、DBA 凭据发行、集中签名审计、分布式协调产品 | 实际生产配置/运维约束缺失 | 这类事项必须有真实组织授权、部署架构、Secret/DBA 和 Worker 数据，不可凭通用技术偏好擅定 |

## 5. 资料冲突、残留问题、未来最值得读的方向

1. **时态冲突已解决：** 10-19 接续回合中的 `45/45 QUEUED` 仅是**当时真实快照**；10-20 再检查 **45/45 已结束 = 43 SUCCESS + 2 CANCELLED，三 PG18 28/28 PASS**。GitHub incident 已于 10-19 **16:56 UTC RESOLVED**。下一窗口禁止使用旧排队状态做“现在无法测”的借口。
2. **PR HEAD 冲突未解决：** 这次交接还要新增两个 docs 并可能补链接，PR HEAD 必然超过 `16e00238...`；原 HEAD 43/2 结果**不可直接挪用到新 HEAD**。后续须用最新 commit/check-runs 与 workflow raw logs 验证，至少解决取消的两条 workflow；如外部 Runner 无法使用，保持未合并。
3. **认证语义冲突仍 OPEN：** `E01J4J 28/28` 的真实工程 PASS 不能升级 `E01J4 全局生产签收`；缺多 Worker 证明、真实 HUMAN IdP/Session revoked、DBA secret governance、正式 CLI + Runbook、集中审计、SQL/JSON ACID。#988/#979/#913 均不因工程通过自动关闭。
4. **旧 P0 未消除：** `postgres.js 3.4.9` TCP 断链 null.write 在 #39271124305 真实出现。多次后续 CI 成功只证明同环境下没有重现，**不是底层竞态已修复**。最好定向调查 postgres.js 与 Node 当前版本连接 shutdown/error 状态的已知上游问题（**本轮未阅读 upstream issue，待验证**）。
5. **实际先查的来源**：[#1057 最新 check-runs](https://github.com/jiangxng/EVO-App-Platform/pull/1057/checks)、[cancelled #39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878)、[#39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769)、[三 PG18 #39281032761](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032761)、[Host server J4J 入口](https://github.com/jiangxng/EVO-App-Platform/blob/16e00238026f015fc233f38207b8d0c38ee480db/manager/server.ts)、[总账 §66](PA05-CERTIFICATION-BASELINE-20261015.md)。再按真实多节点部署拓扑收集运维/DBA/IdP 证据。
6. **分支卫生：** 本线 PR #1057 是唯一活动 PA05 工程 PR；不同 owner 的 BEX、Eidos、2D/Projection 不碰。过往两条 docs 分支 `docs/pa05-e01j2-j4f-window-research-handoff-20261019` / `docs/pa05-e01j4g-production-operator-trust-gate-20261019` 先前核对 ahead=0，尚无安全 delete-ref 能力；不要无确认地重写历史或删除其他窗口分支。

## 6. 文件归属、交接恢复顺序、验证与限制

**直接对应模块**：
`manager/server.ts`（单点 Host 入口）；
`manager/pa05-read-owner-cooperative-host-lock.ts`（J4J 内部 OS 锁）；
`manager/pa05-read-owner-one-shot-prestartup.ts`（J4I）；
`manager/pa05-read-owner-trusted-prestartup.ts`（J4G）；
`manager/pa05-read-owner-prestartup-audit.ts`（J4H）；
`manager/pa05-read-owner-prestartup-recovery.ts`（J4F）；
`manager/pa05-read-owner-lifecycle-pg.ts`（J4E）；
`tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs` 与原真实 PostgreSQL suite；
`.github/workflows/agent-pa05-cross-database-admission.yml`；
`docs/agent-line/HANDOFF.md`、`docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md` §§62–66。

**新窗口恢复步骤**：读取 `AI-BOOTSTRAP.md` → `project.status.json` → `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json` → `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`，再读本线 HANDOFF、短交接、这份索引、总账 §66、PR #1057、最新 HEAD check-runs 与 Railway。所有已有 J2–I 工程和历史原始资料已在仓库，**不重搜不重做**。不要改 `project.status.json` 或生成的全局 HANDOFF 来覆盖并行 TR-01。

**新窗口下一行动**：继续原 #1057 单 PR，确认最新 HEAD（文档归档可能触发 CI）、复核 45 条 workflow 的取消/通过原因，重跑两条 CANCELLED（如仍属于必须门禁）并审查其真实日志；确认 J4J 28/28/0 skipped 和其他适用检查完整 PASS 后 merge main、删除原工程分支、核对 main push CI 与 Railway 自动部署；**然后**才讨论独立可信生产多 Worker 停机证明/IdP+DBA 凭据治理。没有真实生产凭据、没有自动移锁或发布 material WRITE 的权限。

**本轮未保存到 GitHub 的内容**：原始截图/附件为**无**（未制作）；生产 IdP/DBA/RCA/多 Worker 证据为**尚未获得**，不可补造。此交接文件是原始日志的出处索引和关键字段摘要，不是替代原日志的合规副本。


## 7. 最终 HEAD、main CI、Railway 与取消工作流复核（2026-10-20）

本节是合并后直接读取 GitHub / Railway 对象和原始 job log 得到的最终事实；它更新本索引的“当前状态”，但不抹除 §§1–6 中历史时间片。

| 验收项 | 当前可证实事实 | 原始证据与阅读等级 |
| --- | --- | --- |
| PR 与提交 | [PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) MERGED；最后工程 HEAD `1fba63927a80f2e9658b8608bb5a92a9849abcdf`；merge/main SHA `e123924af8bdd1214a4aec6bfaf358c5afb9f445` | **ORIGINAL_CONNECTOR_STATE**；PR 元数据与 main branch API 直接读取 |
| 最终 PR-head CI | 45/45 checks 全部 SUCCESS | [准确 commit checks](https://github.com/jiangxng/EVO-App-Platform/commit/1fba63927a80f2e9658b8608bb5a92a9849abcdf/checks)，**ORIGINAL_CONNECTOR_STATE** |
| 最终 PR-head 物理 PostgreSQL18 | [run #39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722) job `118424890768`：**28 tests / 28 pass / 0 fail / 0 skipped**。原始 marker `PA05_E01J4J_COOPERATING_HOST` 确认独立 Node Host、第二协作 Host 拒绝、在线 Host 阻挡维护、正常退出释放、SIGKILL 和非零退出保留锁、Secrets 未触及；同时明确多 Worker 与生产身份仍 false | **ORIGINAL_CI_LOG**；直接下载并查阅 303 KB job log 的 marker 和 Node reporter summary |
| 合并后 main CI | 合并 SHA 的 **39/39 checks SUCCESS** | [main commit checks](https://github.com/jiangxng/EVO-App-Platform/commit/e123924af8bdd1214a4aec6bfaf358c5afb9f445/checks)，**ORIGINAL_CONNECTOR_STATE** |
| 合并后 main PostgreSQL18 | [run #39361578987](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39361578987) job `118428747522`：**28/28 PASS / 0 failed / 0 skipped**，同一 J4J marker 和硬性 grep 门禁实际通过 | **ORIGINAL_CI_LOG**；直接读取主线 push job log |
| J4J 合并时 Railway 自动部署 | Ledger Configurator deployment `91ac2596-8e4f-4863-a208-5eca3d5c4931`，`main@e123924...`，在该时间片完成 SUCCESS；服务 Online | **ORIGINAL_CONNECTOR_STATE**；Railway 官方连接器直接读取 production environment / deployment |
| 当前主线与 Railway（后续时间片） | 其他工作线 [PR #1047](https://github.com/jiangxng/EVO-App-Platform/pull/1047) 将 main 推进至 `00d05159af8912f9a1194399d7723adfbbf686a5`；当前 Railway deployment `448f3428-6497-46a5-8f54-f6d3b490dd1a` 对应此 SHA，SUCCESS / Online，1 running / 0 crashed，0 warnings / 0 critical，无 pending work。该 main SHA 当前 6 个检查为 5 SUCCESS / 1 CANCELLED（continuity，[#39362505077](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39362505077)）；这是后续其他工作线时间片，不改变 J4J merge SHA 当时 39/39 SUCCESS，也不由本线重跑或改动 | **ORIGINAL_CONNECTOR_STATE**；在文档 PR #1059 期间重新读取 main check-runs、Railway deployment 与 environment status |
| 分支清理 | 原工程分支 `agent/pa05-e01j4j-cooperative-host-lock-20261019` 在合并后 branch search 无结果（已自动删除） | **ORIGINAL_CONNECTOR_STATE**；GitHub branch search 直接读取 |
| 旧取消 workflow 原因 | [#39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878)（Memory Review）与 [#39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769)（Experience P1.3.1）在旧 HEAD `16e00238...` 上结论 CANCELLED。两 workflow 源码均配置 `concurrency.cancel-in-progress: true`，因此同一 ref 的后续 run 可以取消旧 run；但不能仅凭此配置证明这两次的具体取消原因/取消者。旧 job logs 请求当前返回 `BlobNotFound`，未发现可证实 RCA | **ORIGINAL_CONNECTOR_STATE + ORIGINAL_GITHUB_SOURCE**；结论边界为“原因未证实”，不把可能机制写成事实 |
| 旧 43/45 时间片的处置 | 旧工程 HEAD `16e002...` 的 43 SUCCESS / 2 CANCELLED 仍作为历史记录保留；最终工程 HEAD 45/45 SUCCESS 且 main 39/39 SUCCESS，故旧取消不再阻断合并，不需要按旧 SHA 补跑 | 对准确新 HEAD 的正向 CI 已直接复核；不是推断旧作业成功 |

### 7.1 最终范围与下一项门禁

- J4J 是 **ENGINEERING_BOUNDED_PASS**：同一可信 POSIX 文件命名空间内，自愿 opt-in 的协作 Host 排他；不是分布式锁或全 Worker 停机证明。
- `multiWorkerGlobalStopCertified=false`、`actualProductionOperatorIdpCertified=false`、`productionMaterialWriteEnabled=false`、`pa05Signed=false` 是实际测试 marker 的显式负值，不得改写为认证通过。
- 完整 E01J4、PA05-05 E01–E05、W06 仍 NOT_SIGNED；#988/#979/#913 仍 OPEN；production material WRITE OFF；异常退出后的锁不自动清除。
- 下一项独立门禁是可信多 Worker 停机证明，以及真实生产 Human IdP / Session 撤销、DBA 登录凭据与轮换、CLI/Runbook 和集中审计治理。没有组织授权和真实环境证据时只做契约、方案与隔离负测试。
