# CV-03 / N1-05c / 2026-11-11 — Research, actual sources and decision reference index

> **Companion:** [CV03 N1-05c postmerge handoff entry](CV03-N105C-WINDOW-20261111-POSTMERGE-HANDOFF-ENTRY.md).  
> **Record purpose:** Preserve what was actually verified and read in the 7-step Tokyo development continuation; distinguish source G (GitHub original code/logs) from design decision D and externally pending production attestation P. Do not invent unseen original articles, approval messages, screenshots or unrun disaster-recovery evidence.  
> **Exact pre-document baseline:** `main@fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031`. This is not the eventual merged document SHA; retrieve fresh main before subsequent engineering. Access date **2026-11-11** (some GitHub Actions events shown in UTC).

## 1 / Evidence and access grades — how to interpret this index

- **G 原始源码/原始日志已读：** 本七步及其连续工作现场通过 GitHub connector 获取文件源、Issue 正文或原始 Actions Job logs；超大源文件明确限于匹配行/相关片段。实际 CI job PASS 标记代表这一条限定测试运行成功，**不扩展其结论**。
- **G 仅元数据或历史文档：** 获取 GitHub PR/Actions 状态、已有工程文档或前窗口索引，但未在本次重新读取物理日志/完整 diff；清晰标出。
- **D：** 用户已选定的方案 A，及基于 G 的工程顺序/风险判断，不伪装成 PostgreSQL/Security Owner 签字。
- **P：** Owner 签名、真实授权权威的生产迁移、KMS、远端多物理 Host、安全/回滚和 Human/Agent 完整验收；不存在可合法宣称完成的原始证据。

## 2 / 本轮读过的项目源码与原始参考

| ID / 原始资源（固定网址或路径） | 本轮访问等级、时间 | 可验证的 G 事实 | 具体实施用途 |
| --- | --- | --- | --- |
| A01 [N1 真实生产权威整合决策与验收计划](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/docs/plans/foundation-list-experience/CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md) | **已读原文**（N1-05c-06 和 07），11-11 | §A–D：真实 PA05 LifecycleStore 与 AuthorizationProvider/SQL mirror 存在跨源事务断裂；要求同 T0 epoch/outbox、签名身份、完整 Scope 恢复、真实 Host/Agent 验收 | 全程 `N1=NOT_CERTIFIED`，不将 QA T0 或 Event publish 当正式权威 |
| A02 [N1-05a Owner Decision Gate](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/docs/plans/foundation-list-experience/CV03-N105A-PRODUCTION-AUTHORITY-OWNER-DECISION-GATE-20261111.md) | **已读原文**，11-11 | §Source graph / Signoff matrix：A 用户已选但 Owner 的真实审批与原 Host SQL schema/producer 仍需确认 | N1-05c-09 以真实 GitHub Issue/源码创建可执行误认证报警 |
| A03 [N1-05a source-anchored preflight](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/tools/cv03-n105a-authority-boundary-preflight.mjs) + [tests](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/tests/agent-line/cv03-n105a-authority-boundary-preflight.test.mjs) | **原文已读**，11-11 | `inspectCv03N105aAuthorityBoundary` 的 anchor 只检查既有负向边界；`BASELINE_MATCH` 不可能签发生产授权 | N1-05c-09 **复用该机制**，增加 Owner Issue + PR 真实状态，不新造生产授权框架 |
| A04 [manager/server.ts — 宿主](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/manager/server.ts) | **已读相关匹配行/节选**，11-11（文件约 438 KB，未声称通读每行） | `assertCv03HumanSaveNotEnabledV010`、`assertCv03UnadmittedPersistedFeatureAbsentV010`、`cv03UnadmittedWriteDenialV010`；`resolveAuthorizationProvider` 经动态 Provider runtime；本机 `pluginEvents.publish`，不共享 SQL T0 | 加入硬门禁源码漂移监测，确保 QA Node 工具未被当正式 Host 端点 |
| A05 [manager/service.ts](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/manager/service.ts) | **已读生命周期匹配行与函数段**，11-11 | 现有 `disable/deactivateFeature` 存储变更和事件通知在不同调用边界；没有现成跨文件/SQL ACID | 正式单 Feature 同 T0 迁移须由 Owner 定义，不误停企业默认 Feature |
| A06 [manager/store.ts](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/manager/store.ts) | **已读原文**，11-11 | FileLifecycleStore 本地锁、revision、fsync 对本机 Reader/Writer 失败关闭；明文指出不是分布式持久 SQL 授权权威 | 下一步 Owner file/Pg split 和 crash after local mutation 的基础 |
| A07 [AuthorizationProvider runtime](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/providers/authorization/runtime.ts) | **已读原文**，11-11 | Static policy ALLOW/DENY 判定、providerId，非已绑定生产 `authority_epoch`/不可变 Outbox 的同一 PostgreSQL 事务 | 持久 Provider 状态尚需 Owner 指认，不因 static overlay 成功便认为生效权威已迁移 |
| A08 [Saved View admission](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/manager/cv03-personal-saved-view-host-admission.ts) | **已读原文**，11-11 | `SAVE_MODE` 只允许 OFF，正式 WRITE 定向拒绝，已激活的未认证 Feature 阻止 Host 启动 | N1-05c-09 用真实源码反证任何偷偷打开或挂载的改动 |
| A09 [未挂载 T0 客户端](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/manager/cv03-n105b-authority-t0-pg.ts) + [PA05 lifecycle barrier](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/manager/cv03-n105b-pa05-host-lifecycle.ts) | **已读原文**，11-11 | 两个 opt-in 模块均明确 `UNMOUNTED`；使用 QA owner 函数不能证实真正的 Manager + Provider 是 SQL T0 的权威源 | 只用作未来 Owner 通过后的最小方案 A 接线，不立即注册 `manager/server.ts` |
| A10 [真实 QA SQL DDL/owner 函数](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/deploy/tencent-tokyo/cv03-n105b-qa-t0.sql) | **已读原文**，11-11 | `cv03_n105b_qa` 库名强制检查、`producer_identity`、`feature_authority`、`scope_authority`、`immutable_outbox`、`operation_receipts`；Owner SECURITY DEFINER T0；synthetic generation；Feature frozen | 确定实际物理测试是隔离 QA 并防止创建新生产 SQL 角色 |
| A11 [N1-05c-05 HBA cutover script](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/tools/cv03-n105c-tokyo-qa-original-db-hba-fence.sh) / [N1-05c-07 第二 Host](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/tools/cv03-n105c07-tokyo-second-qa-host-principal.sh) | **已读/本轮原始提交**，11-11 | 先 HBA 拒绝指定 QA role 进入原库，再创建 Host02 role，回滚前必重新验证角色 NOLOGIN/不存在 | 控制误连业务库和中途未知角色状态的破坏范围 |
| A12 [N1-05c-08 OS worker](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/tools/cv03-n105c08-tokyo-qa-os-process-worker.mjs) + [fault orchestrator](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/tools/cv03-n105c08-tokyo-two-os-process-failclosed.sh) | **已读/本轮原始提交**，11-11 | 同容器两个独立 Node OS 进程；仅按 QA role/database/唯一 SQL tag/PID 定向 `pg_terminate_backend` | 构成有限物理断连失败关闭证据，不证明正式 Host 断线策略 |

## 3 / 实际 GitHub Owner/PR/CI 来源

| ID / 原始网址 | 查阅/访问等级、日期 | G 发现和直接用途 |
| --- | --- | --- |
| O01 [Issue #1212 — Owner signoff](https://github.com/jiangxng/EVO-App-Platform/issues/1212) | **已读正文 + 评论 API**，11-11 | `state=open`；`PENDING OWNER SIGNOFF`，五项清单显示 `[x]`，却未等价于独立 Owner 具名 Review、实际签名资源、Schema/KMS/回滚验收；23 条评论中近期为逐项 QA 证据。用于 **纠正 checklist 误认证**。 |
| O02 [并行 PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | **已读 PR 元数据 + reviews API**，11-11，非完整 diff/Owner 文件 | PR OPEN / 未合并，读取时 Reviews API 返回空列表；不能把后续 PR 合并误认成生产授权。保持 Owner 文档独立边界。 |
| O03 [N1-05c-09 Draft PR #1248](https://github.com/jiangxng/EVO-App-Platform/pull/1248) | **已提交实际代码，PR 元数据已读，专用 Job 原始日志已读**，11-11 | 真实 GitHub Owner + Source Release Gate，6/6 对抗测试，专用 [Actions #43053899467](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43053899467) 标记 `CV03_N105C09_RELEASE_CERTIFICATION_NOT_GRANTED_TERMINAL_PASS`。此为禁止发布仍有效的 PASS，不是 release 通过。最终 exact-head/master CI/合并状态后续独立核验。 |
| O04 [CI-Gated Tokyo Preview workflow](https://github.com/jiangxng/EVO-App-Platform/blob/fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031/.github/workflows/evo-tokyo-dev-deploy.yml) | **原始文件历史查阅，#07 未重读全源；最近 run 仅元数据**，11-11 | 主线 CI 后触发预览部署；纯文档/配置可能 preflight SKIP，不能说每个文档 SHA 都部署成正式 EVO 镜像。 |

## 4 / 已实际复核的东京物理 Action 日志（无造假）

| ID、真实 Actions / Job URL | 11-11 查阅等级 | 重要原始标记、关键发现、模块用途 |
| --- | --- | --- |
| T01 [Host SCRAM #43028414842](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43028414842)、[Producer #43034999556](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43034999556) | **此前工程文档引证，本七步未重复读取全部原始 Job** | QA 专用 password-backed Producer/SQL session_user，错误密码拒绝；HBA host SCRAM 登录及原 EVO 应用保持。作为后续实际测试初始安全基线。 |
| T02 [原库 ACL #43036843959](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43036843959) | **前阶段现场/合并证据引证，本 #07 不再重读全部日志** | `evo_dev` PUBLIC CONNECT/TEMP OPEN、受限 QA Producer 表 ACL 0；促成精确 HBA 拒绝而不是全局 `REVOKE PUBLIC`。 |
| T03 [extended ACL #43039723598](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43039723598) job 130587963905 | **已读原始 Job 日志**（#02/07），11-11 | COLUMN READ/WRITE `0|0`，SEQUENCE `0`，FDW/SERVER `0|0`，原库 CONNECT/TEMP 仍开放；没有假装完整 tenant auth。 |
| T04 [role+DB HBA physical #43042027579](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43042027579) job 130596054079 | **已读原始 Job 日志**（#03/07），11-11 | `CV03_N105C05_FIRST_MATCH_THREE_FAMILY_REJECT_LOADED_PASS`、`QA_ORIGINAL_TCP_AND_LOCAL_DENIED_QA_T0_CONTINUES_PASS`、`REAL_EVO_TCP_RUNTIME_AND_HEALTH_POSITIVE_PASS`；准确角色-数据库拒绝，IPv6 独立连接未试。 |
| T05 [two-session ACK replay #43044527299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43044527299) job 130604837619 | **已读原始 Job 日志**（#04/07），11-11 | `CV03_N105C06_TWO_DISTINCT_AUTHENTICATED_TCP_SESSIONS_CONTENDING_PASS`；`ACK_LOSS_CONCURRENT_REPLAY_SAME_RECEIPT_NO_OUTBOX_PASS`；同一 Host LOGIN 的并发同收据，不是双 Host/真实丢 ACK。 |
| T06 [second SQL Host #43048753191](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43048753191) job 130619782779 | **已读原始 Job 日志**（#05/07），11-11 | `CV03_N105C07_TWO_DISTINCT_SCRAM_LOGINS_QA_ONLY_AND_CROSS_PASSWORD_DENY_PASS`、`CONCURRENT_SEPARATE_HOST_SQL_LOGIN_IDENTITIES_PASS`、`DB_OWNED_FROZEN_SOURCE_CROSS_HOST_AND_REPLAY_DENIAL_PASS`，是真实两独立 SQL role 非两台机器。 |
| T07 [two Node OS processes + backend kill #43051604400](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43051604400) job 130629935414 | **已读原始 Job 日志**（#06/07），11-11 | `CV03_N105C08_REAL_TWO_DIFFERENT_OS_PROCESSES_AND_SQL_SESSION_USERS_PASS`、`REAL_TARGETED_PG_BACKEND_TERMINATION_DENY_PASS`、`NEW_OS_PROCESS_REAUTH_FROZEN_AND_SQL_SOURCE_UNCHANGED_PASS`，原业务 app/HTTPS/401 仍健康。 |
| T08 [owner evidence gate #43053899467](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43053899467) job 130638122897 | **已读专用原始 Job 日志**（#07/07），11-11 | 6/6 adversarial tests；`CV03_N105C09_LIVE_GITHUB_OWNER_ISSUE_OPEN_UNCERTIFIED_PASS`、`CHECKED_BOXES_DO_NOT_CONSTITUTE_OWNER_APPROVAL_PASS`、`REAL_HOST_SAVE_ADMISSION_STILL_OFF_PASS`，仅证明**禁放行门禁**工作正常。 |

Physical data and log references are intentionally scoped to the observed test; no saved screenshots, private SSH keys, SQL passwords, customer row dumps or new offsite disaster-recovery artifacts were created here. When logs expire, use the tracked workflow markers and source file for reproducibility, or an Owner-approved retention process; do not recreate an unseen original log.

## 5 / External sources and source classification

- [PostgreSQL 17 Client Authentication / pg_hba.conf](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html) and [pg_hba_file_rules](https://www.postgresql.org/docs/17/view-pg-hba-file-rules.html): referred to during N1-05c-05 design in prior execution for HBA first-match ordering, reload and written-file-vs-loaded-policy risk. **In this #07/07 handoff they are historical reviewed/reference URLs, not newly re-opened original webpages**. The actual Tokyo connection tests, not the webpage, prove the specific IPv4/Unix-socket result; IPv6 socket was not independently tested.
- [N1-05b earlier detailed research index](CV03-N105B-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md) and [N1-04l source index](CV03-N104L-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261111.md) preserve previous legal/PG references with their original source grades; **do not uplift “搜索摘要” into “已读原文”** without visiting. No new third-party product sites, screenshots or paid research resources were used in #07.

## 6 / Source facts G versus chosen design D and rejected alternatives

| Topic | G observed evidence | D chosen / why | Rejected approach / remaining conditions |
| --- | --- | --- | --- |
| Authority commit boundary | File/Memory PA05 and dynamic AuthorizationProvider exist; Tokyo synthetic T0 is separate | **User approved Scheme A**: real canonical PA05 grant/deny `source_generation`, epoch and immutable Outbox sharing *one* true PG ACID T0, preserving existing API | **Scheme B** cross-store synchronous full-domain fail-close has no signed proof; post-event best effort is unsafe, not chosen |
| Identity isolation | QA SCRAM role and second login physically exist, original DB `PUBLIC CONNECT` exists but targeted HBA rejects those logins | Precise QA role/db HBA fence + independent SQL login and old-role denial preserves existing `evo_dev` app | Global `REVOKE CONNECT FROM PUBLIC` rejected until production role inventory/rollback signed; QA passwords are not KMS |
| Replay and recovery | Two-sessions same receipt, two independent SQL Host IDs, two Node OS processes and one targeted killed QA backend all verified | Use real PostgreSQL session identity and fail-closed handling, gradually move to true independent Host/partition fault matrix | These tests cannot certify multi-Host/primary failover, actual ACK loss or true Provider source |
| Owner approval | #1212 checkboxes all checked, Issue still open and pending; #1184 open/reviews empty at inspection | Code gate interprets checkboxes only as diagnostics, uses actual Issue state and existing source OFF status; unexpected closure/source drift makes CI red | Merged docs/LLM-authored approval text/green synthetic tests as authorization are rejected |
| Release | Real Host SAVE OFF, formal POST 403, unregistered GET 404 | Allow release change only in independently reviewed final N1-05f PR after real signatures and physical proof | Deleting the OFF guard merely because QA tests are green is forbidden |

## 7 / Unresolved conflicts, external dependencies and prioritized next investigation

1. **Highest priority P:** actual PA05 Lifecycle Owner and AuthorizationProvider Owner must identify real runtime Provider ID, authoritative persisted policies, official grant/revoke/switchEnterprise scope and single production transaction owner. Existing file-state and PG QA cannot both self-declare authority.
2. **P:** DB Owner supplies production target primary/schema, SQL `SESSION_USER`/role GRANTs, DDL migration/rollback, complete offline scope/tombstone snapshots and durable Outbox/watermarks. The current production app `evo` role is a high-privilege login, not an acceptable least-privilege signed Producer; real `evo_dev` data not modified.
3. **P:** Security/Ops supplies signed workload principal and KMS/rotation policy, stale credential revocation, cross-machine partition/failover and rollback SLO/offsite PITR. Two SQL logins in one cluster do not satisfy this.
4. **P:** Domain Owner and Human/Personal Agent complete real business Data/Permission/Host ActionRouter end-to-end, mobile 390px and full real LLM tool use after source of truth is approved. No user-visible SAVE route open until then.
5. **Process conflict:** Issue checklist x vs actual OPEN/PENDING; #1248 removes false-positive risk but cannot generate independent Owner signatures. PR #1184 must stay under its own Owner, not be altered by this workline.
6. **Next physical proof after signoff:** two actual independent Host instances/containers or machines, separate network/DB outage domains, same canonical data and signed principal identity, with fail-close on real SAVE/Human+Agent paths. Avoid another synthetic QA T0.

## 8 / Provenance, version drift and implementation links

- N1-05c source and test trajectory: #1227–#1239 (SCRAM, ACL), #1240–#1241 (HBA), #1242–#1243 (concurrent receipt), #1244–#1245 (separate SQL Host IDs), #1246–#1247 (two OS processes / backend termination), #1248 (Owner Issue + real Host release gate). Each physical conclusion is attached to the corresponding workflow/doc; PR merge statuses and exact-sha Branch Hygiene must be checked for any incomplete new work.
- Final Owner Issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212); unchanged parallel [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184). The repo's internal `N1=NOT_CERTIFIED` status is not changed by this reference index.
- **Use latest main**, not a previous window's last merged SHA or deleted branch. The latest SHA must be verified when the next window starts, because multiple branches may advance concurrently.

