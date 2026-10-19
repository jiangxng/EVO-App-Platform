# 独立 Agent 线交接入口

> **2026-10-19 PA05-05/E01J4B SQL-first lifecycle repair — first PG18 20/20 PASS / final engineering PR HEAD pending:** [fixed milestone and original-source ledger](PA05-E01J4B-CRASH-LIFECYCLE-REPAIR-20261019.md) → [one active PR #1031](https://github.com/jiangxng/EVO-App-Platform/pull/1031) → initial actual three PG18 [CI #39210593533](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39210593533), exact code HEAD `2af4bf518910cdade86d02b28e89ceeccf74a88a`, **20/20 PASS, 0 failed, 0 skipped**. First attempt [#39210347370](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39210347370) exposed a nested test scheduling deadlock, fixed in same PR. Original Purchase Attention/Trading Reference READ, PostgreSQL SQL-first per-Host fence, durable intent, three actual Worker crashes before/after DISABLE/UNINSTALL, no auto-reinstall, idempotent DBA repair and reattestation. **Production cross-store atomicity, actual Host lifecycle and privileged operator credentials remain NOT_SIGNED**; #988/#979/#913 OPEN, W06 IN_PROGRESS/NOT_SIGNED, material WRITE OFF, no Railway/other-line/global-status modifications. Final PR HEAD CI+merge must still be verified.

> **2026-10-19 PA05-05/E01J4A BOUNDED_ENGINEERING_PASS / overall NOT_SIGNED:** [Milestone ledger and original two-Worker crash/reattest decision](PA05-E01J4-PERSISTED-MULTIWORKER-REATTEST-20261019.md) → [PR #1029 MERGED](https://github.com/jiangxng/EVO-App-Platform/pull/1029) main `9ea731442bfbe28ab339965f77e137561bf3b6ee` → exact final HEAD `33e307f6c5759f966abe9ded8c0a22dc7829e16d` [real 3-PG18 #39208798334](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39208798334) **19/19 PASS / 0 skipped**, all 6 related CI SUCCESS. Actual separate Node Host SQL roles and original persisted AppManager file stores; DBA freeze first, stale ACTIVE restore on another Worker, central recertification without Host reattestation denied, SQL Worker privilege forgery denied, separately approved A succeeds while B remains denied. **E01J4 full atomic cross-store lifecycle, production Host/operator, stable postgres.js crash recovery, PA05-05 E01–E05 and W06 remain NOT_SIGNED.** #988/#979/#913 OPEN, production material WRITE OFF, no Railway or global/BEX/CP03/Eidos/2D changes.

> **2026-10-19 PA05-05/E01J3 BOUNDED_ENGINEERING_PASS / stage NOT_SIGNED:** [real TCP interruption, initial fatal postgres.js race and final evidence](PA05-E01J3-INFLIGHT-TCP-READ-20261019.md) → [PR #1026 MERGED](https://github.com/jiangxng/EVO-App-Platform/pull/1026) main `3be90217f26d79ccdd75f0320a02cd86eb6b5f2b` → exact final head `3ef47fb7a5921e2f733b041f5ee8607bb6800c68` [three-PG18 CI #39205257968](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39205257968) **18/18 PASS / 0 skipped** with all 6 relevant workflows SUCCESS. Automatic branch clean-up verified. First failure [#39204498694](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39204498694) found an actual `postgres 3.4.9` fatal socket-null race; upstream [#1208](https://github.com/porsager/postgres/issues/1208) / [#1209](https://github.com/porsager/postgres/pull/1209) remain OPEN. No leaked business result during cut, DBA revoke and fresh supervised Worker recovery proven; stable original Host in-place recovery, silent packet blackhole, cross-store AppManager lifecycle and production Host READ route **NOT certified**. #988/#979/#913 OPEN, PA-05/W06 IN_PROGRESS/NOT_SIGNED, material production WRITE OFF; no Railway/parallel-line/global-status changes.

> **2026-10-19 PA05-05/E01J2 engineering BOUNDED_PASS / overall NOT_SIGNED:** [final E01J2 authenticated SQL Host + real Purchase Attention Handler decision and accurate-head verification](PA05-E01J2-AUTHENTICATED-SQL-HOST-READ-20261019.md) → [merged PR #1024](https://github.com/jiangxng/EVO-App-Platform/pull/1024) `3d8320069ab3f424f4a2e47a2d2841df5c429c85` → [final three PG18 CI #39203051005](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39203051005) exact head `402c3d819228b1d4eb97301ab441e510428c726e` **17/17 PASS, 0 failed/skipped**, all 5 related workflows SUCCESS. Final agent engineering branch was verified deleted. Real opt-in Handler inside SQL fence, two independent Host SQL LOGIN identities, restricted Worker role, DBA epoch revoke, old-backend privilege loss, active-backend termination and unavailable-central fail-closed. **NOT production Host wiring, actual enterprise data, in-flight global network partition, AppManager/PG atomic install, Human/Agent/Provider/browser signoff or PA05-05 E01–E05/W06.** #988/#979/#913 OPEN; production material WRITE OFF; no Railway deployment. Older E01J research/source access grades retained unchanged.

> **2026-10-19 PA05-05 research/window handoff (CURRENT WINDOW INDEX; no production signoff):** [短交接入口：PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md](PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md) → [详细官网 / GitHub / CI 来源与决策索引](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md) → [认证总账 §§43–53](PA05-CERTIFICATION-BASELINE-20261015.md). 已重新核验 [E01J1 PR #997](https://github.com/jiangxng/EVO-App-Platform/pull/997) MERGED `c9a4ce2b9ebbffbe469a1fbc48ed046acfa0ce62`, old engineering branch retired; final HEAD `882979d3160c61bbd81531b03195a32cb852b3cc` [3-PG18 CI #38918563740](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38918563740) 15/15 PASS, 0 skipped. 2026-10-19 initial main `42ce894b4129089cbd8a270bd3473f0c93b7657b`; later SHA must recheck. **E01J1 is isolated SQL READ Owner proof, not actual production Purchase Attention Handler, authenticated Human/Provider or globally atomic AppManager installation**. #988/#979/#913 OPEN, PA05/W06 NOT_SIGNED, production WRITE OFF. New E01J2 begins by checking current main and other-owner PRs. This docs-only handoff does not edit mainline project status or deploy Railway.


> **2026-10-16 PA05-05/E01J1 central READ Owner candidate (NOT_SIGNED):** [actual shared PG18 Owner epoch, two real separate OS Host processes, cross-process revoke serialization](PA05-E01J-SHARED-READ-OWNER-EPOCH-PG-20261016.md) → [baseline §53](PA05-CERTIFICATION-BASELINE-20261015.md) → [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988). E01I [PR #995](https://github.com/jiangxng/EVO-App-Platform/pull/995) merged `main@20c8a94772f8d83ec9d85a4e81645e9a977084aa`; E01J1 branch `agent/pa05-e01j-shared-read-sql-gate-20261016`. Explicitly **not production Host/READ Handler/AppManager-installed authority**, role separation/partition not signed. Need true 3-PG18 zero-skipped and exact final CI before merging, no Railway/WRITE/BEX/CP03/Eidos/2D edits. #979/#913 OPEN, W06 NOT_SIGNED.


> **2026-10-16 PA05-05/E01I startup safety candidate (NOT_SIGNED):** [persisted uncertified READ Owner denied before Host listen/restore](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md) → [baseline §52](PA05-CERTIFICATION-BASELINE-20261015.md) → [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988). Previous E01H [PR #994](https://github.com/jiangxng/EVO-App-Platform/pull/994) MERGED `main@aa5bf6312e2a82cdba20e8a2b981021fdf25ad76`, exact PR HEAD 44/44 SUCCESS; new candidate branch `agent/pa05-e01i-restart-fail-closed-20261016`. Local persisted state is NOT a multi-Worker transactional authority; on restart with persisted installed/active Purchase Attention, fail closed without rewriting state. Real disposable Host startup regression pending CI. Cross-Worker atomics, real production identities/data/Provider and E01–E05 remain NOT_SIGNED; #979/#913 OPEN, production WRITE OFF. No Railway or parallel owner changes.


> **2026-10-16 PA05-05/E01H engineering candidate (NOT_SIGNED):** [race-limited two fresh Host lifecycle policy checks + re-read real AppManager dependency impact](PA05-E01H-AUTHORIZATION-RACE-20261016.md) → [baseline §51](PA05-CERTIFICATION-BASELINE-20261015.md) → [#988 security follow-ups](https://github.com/jiangxng/EVO-App-Platform/issues/988). E01G [PR #992](https://github.com/jiangxng/EVO-App-Platform/pull/992) MERGED at `main@e8f39d6668904e464483bdb336a7d4ecde3ecf6e`, exact HEAD 44/44 CI; E01H branch `agent/pa05-e01h-authorization-race-20261016`. This only addresses in-Host async policy/plan drift, NOT distributed lock, post-return race, production Human/Provider or startup persistence. Require precise final CI before merger and branch retirement. #979/#913 OPEN, W06 NOT_SIGNED, production WRITE OFF, no Railway or parallel owner edits.


> **2026-10-16 PA05-05/E01G candidate (NOT_SIGNED):** [real AppManager transitive dependency install/disabled Feature activation authorization](PA05-E01G-TRANSITIVE-READ-LIFECYCLE-20261016.md) → [certification baseline §50](PA05-CERTIFICATION-BASELINE-20261015.md) → [issue #988](https://github.com/jiangxng/EVO-App-Platform/issues/988) and [PA05-05 #979](https://github.com/jiangxng/EVO-App-Platform/issues/979). E01F [PR #990](https://github.com/jiangxng/EVO-App-Platform/pull/990) MERGED at `main@ddfe805ac5f5c5aab88d0eb593b33f83baeb7256`, 44/44 final CI SUCCESS. Current independent branch `agent/pa05-e01g-transitive-lifecycle-20261016`. E01G blocks indirect installer activation of Purchase Attention while preserving unrelated plugins and Host lazy startup. Require exact PR-head CI and safe retirement, never production deploy/WRITE or claim real Human/Provider signoff. #913 OPEN, W06 NOT_SIGNED; BEX/CP03/Eidos/2D and global status untouched.


> **2026-10-16 PA05-05/E01F active security fix (NOT_SIGNED):** [E01F lifecycle route coverage, test matrix and original E01E bypass evidence](PA05-E01F-LIFECYCLE-AUTHORIZATION-20261016.md) → [baseline §49](PA05-CERTIFICATION-BASELINE-20261015.md) → [Issue #988](https://github.com/jiangxng/EVO-App-Platform/issues/988). E01E [PR #986](https://github.com/jiangxng/EVO-App-Platform/pull/986) merged at `main@f70e0a047a729b6b4fcd2fe91f669516b658cd75`. Current candidate branch `agent/pa05-e01f-target-lifecycle-authorization-20261016` guards exact Purchase Attention install/enable/disable/uninstall/upgrade on direct and Action routes using operator bearer + live policy. No production deploy, no other plugins' security claim, #979/#913 OPEN, W06 NOT_SIGNED, WRITE OFF. Must check accurate final CI, merge and clean branch without touching BEX/CP03/Eidos/2D.


> **2026-10-16 PA05-05/E01E new candidate (NOT_SIGNED):** [actual disposable Node Host HTTP admission, original install/disable and source evidence](PA05-E01E-DISPOSABLE-REAL-HOST-HTTP-20261016.md) → [certification baseline §48](PA05-CERTIFICATION-BASELINE-20261015.md). E01D [PR #985](https://github.com/jiangxng/EVO-App-Platform/pull/985) merged `main@3395fe276c27528684caecfcd546cd9aab27ee8a`, 44/44 exact HEAD CI SUCCESS. E01E branch `agent/pa05-e01e-real-host-http-20261016` deliberately tests **real process HTTP with disposable tokens, never production data**; PR, exact HEAD CI, merged SHA pending. #979/#913 OPEN, PA-05/W06 NOT_SIGNED and production WRITE OFF; no Railway or parallel BEX/CP03/Eidos/2D/global authority changes.


> **2026-10-16 PA05-05/E01D current candidate (NOT_SIGNED):** [default-off Host admin endpoint, live Bootstrap identity + Provider policy, deferred authorized Purchase Attention READ admission](PA05-E01D-ADMIN-HOST-READ-ADMISSION-20261016.md) → [baseline §47](PA05-CERTIFICATION-BASELINE-20261015.md) → [#979 P05-E01–E05](https://github.com/jiangxng/EVO-App-Platform/issues/979). E01C [PR #983](https://github.com/jiangxng/EVO-App-Platform/pull/983) merged at `main@a3044ec10517e4295dac7feb6049eaf8a6058f83`; candidate branch `agent/pa05-e01d-host-admin-admission-20261016`. Route is OFF by default, requires two independent Host admission gates, never installs or executes business, no production credentials or Railway changes. Require exact HEAD CI before merging. #913 OPEN, PA-05/W06 NOT_SIGNED, production WRITE OFF; no BEX/CP03/Eidos/2D or global state edits.


> **2026-10-16 PA05-05/E01C candidate — NOT_SIGNED:** [trusted generic on-demand Host catalog + existing Router registration, actual source and negative test ledger](PA05-E01C-TRUSTED-ON-DEMAND-HOST-REGISTRATION-20261016.md) → [baseline §46](PA05-CERTIFICATION-BASELINE-20261015.md) → [#979 live E01-E05](https://github.com/jiangxng/EVO-App-Platform/issues/979). E01B [#982](https://github.com/jiangxng/EVO-App-Platform/pull/982) merged at `main@cd1163033a32be4ce949f01dd226b55eae6a2a4a`; E01C independent branch `agent/pa05-e01c-lazy-runtime-admission-20261016`. No `manager/server.ts` startup import, default plugin install, production Provider/Human signing, or WRITE. Require exact HEAD CI before merge. Issue #913 OPEN, W06 NOT_SIGNED, BEX/CP03/Eidos/2D/global continuity unchanged.


> **2026-10-16 PA05-05/E01B candidate, NOT_SIGNED:** [plugin-owned lazy Host adapter + Lightweight Host ratchet decision record](PA05-E01B-OPTIN-REAL-HOST-PURCHASE-READ-20261016.md) → [baseline §45](PA05-CERTIFICATION-BASELINE-20261015.md) → [PA05-05 actual Human/Provider blocker #979](https://github.com/jiangxng/EVO-App-Platform/issues/979). Candidate PR #982, branch `agent/pa05-e01b-optin-host-read-20261016`. The first opt-in startup implementation was **rejected by real CI** as an eager plugin import; `manager/server.ts` was restored unchanged. The remaining genuine plugin-owned adapter is tested only in isolated Host composition, no default Host install/routing, Provider or Human signing. Need final exact-HEAD CI before merge. #913 remains OPEN; PA-05/W06 NOT_SIGNED and production WRITE OFF. No BEX/CP03/Eidos/2D or global continuity edits.


> **2026-10-16 PA05-05/E01A current isolated readiness (NOT_SIGNED):** [real Host active Capability/Action-handler composition audit and missing Purchase Attention production registration](PA05-E01A-HOST-COMPOSITION-READINESS-20261016.md) → [baseline §44](PA05-CERTIFICATION-BASELINE-20261015.md) → [PA05-05 Issue #979](https://github.com/jiangxng/EVO-App-Platform/issues/979). Candidate branch `agent/pa05-e01a-host-readiness-preflight-20261016`; require actual CI before engineering signoff; E01 live Human/Provider/data still BLOCKED. **Previous D14C13 [PR #976](https://github.com/jiangxng/EVO-App-Platform/pull/976) is MERGED**, main merge `22d830dd34086c76c5dd0bdcdf0fb88aa7e0848e`, exact three-PG18 12/12 and 6/6 CI, engineering branch retired. Issue #913 OPEN, PA-05/W06 NOT_SIGNED, production WRITE OFF. Do not edit global project continuity or parallel BEX/CP03/Eidos/2D.


> **2026-10-16 PA05-04D14C13 active candidate (NOT SIGNED):** [PG18 genuine CA CRL, existing TLS backend SQL cutover, renewed leaf and source/option/evidence ledger](PA05-D14C13-HOST-TLS-CERTIFICATE-REVOCATION-20261016.md) · [certification baseline §43](PA05-CERTIFICATION-BASELINE-20261015.md). Developed on independent `agent/pa05-d14c13-host-cert-revocation-20261016` branch from `main@8f2b86a77fae933c63bcbb8731729f92f12cd6a5`. Earlier D14C12 12/12 success is inherited regression evidence, **not D14C13 acceptance**; require new real PG18 marker and exact HEAD relevant CI. #913 OPEN; PA-05/W06 NOT_SIGNED; production WRITE OFF; no BEX/CP03/Eidos/2D or global continuity changes.


> **2026-10-16｜D14C5–D14C12 完整研究与决策接续包（最新）：** [简短交接入口](PA05-D14C5-D14C12-RESEARCH-HANDOFF-ENTRY-20261016.md) → [详细网络资料／决策／证据索引](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md) → [认证基线 §35–42](PA05-CERTIFICATION-BASELINE-20261015.md) → [Issue #913](https://github.com/jiangxng/EVO-App-Platform/issues/913)。真实 C5 [#959](https://github.com/jiangxng/EVO-App-Platform/pull/959) 至 C12 [#972](https://github.com/jiangxng/EVO-App-Platform/pull/972) **共八个 PR 已合并**；C12 实际三 PostgreSQL18 12/12、0 skipped、6/6 变更 CI PASS，`main@84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0` 为本索引写作前代码快照（后续以新 main 为准）。本套文档**只更新研究交接，不新增生产批准**；PA-05/PA05-W06 NOT_SIGNED、#913 OPEN、生产 WRITE OFF；不重做已经验证的研究，不覆盖 BEX/Eidos/2D 或 `project.status.json`。下方逐轮文档是**当轮历史快照**，其中旧的“当前候选”表述不能取代已核验的 PR merged 状态。

> **2026-10-16 PA05-04D14C12 当前候选工程：** [真实 PG18 TLS 客户端证书与独立 Host SQL 权限绑定、HBA 真正验证 CA、错误证书和无证书拒绝、未签生产 PKI/工作负载身份](PA05-D14C12-ACTUAL-POSTGRESQL-CLIENT-CERT-HOST-IDENTITY-20261016.md) · [专项认证基线 §42](PA05-CERTIFICATION-BASELINE-20261015.md)。只增强 opt-in Object Extension 三库测试；保留已合并 #969 的 SQL 凭据轮换、真实 Owner、D9–D14C11。#913 OPEN，PA05/W06 NOT_SIGNED，生产 WRITE OFF；不改 BEX/Eidos/2D 或全局状态。

> **2026-10-16 PA05-04D14C11 当前工程：** [真实 Host/Business SQL 密码轮换后旧认证连接失效、水位锁与旧事务回滚、官方 PostgreSQL18 原文与未签生产机器身份](PA05-D14C11-SQL-CREDENTIAL-SESSION-ROTATION-20261016.md) · [专项认证基线 §41](PA05-CERTIFICATION-BASELINE-20261015.md)。从已合并 [#967](https://github.com/jiangxng/EVO-App-Platform/pull/967) 接续，继续独立三实例 PG18；受保护水位**必须由可信 DBA 与 SQL 密码变更同事务提交**，未声称无协调的密码变更自动阻断。Issue #913 OPEN、PA05/W06 NOT_SIGNED、生产 WRITE OFF；不触碰 BEX/Eidos/2D 或全局状态。

> **2026-10-16 PA05-04D14C10 当前工程：** [真实 PostgreSQL 后端 PID 与事务 XID 绑定 Host 一次性许可、被盗完整命令跨连接防重放、官方源与未签机器身份边界](PA05-D14C10-TRANSACTION-BOUND-PERMIT-20261016.md) · [认证基线 §40](PA05-CERTIFICATION-BASELINE-20261015.md)。从已合并 [#965](https://github.com/jiangxng/EVO-App-Platform/pull/965) 接续；复用 D9–D14C9 原始 Owner 与三物理 PG18 验证，不重建业务引擎。#913 OPEN、PA05/W06 NOT_SIGNED、生产 WRITE OFF；不动 BEX/Eidos/2D 或全局状态。

> **2026-10-16 PA05-04D14C9 最新增量：** [可信 SQL Host 单独登记不可变命令、原 Object Extension Owner 后续 SQL 匹配、仍未签机器身份与被盗原样令牌竞态](PA05-D14C9-HOST-COMMAND-PROVENANCE-20261016.md) · [认证基线 §39](PA05-CERTIFICATION-BASELINE-20261015.md)。从已合并 [#963](https://github.com/jiangxng/EVO-App-Platform/pull/963) 接续，不重复 D9–D14C8 实现；精确 CI/PR/合并状态以 GitHub 为准。PA-05/W06 NOT_SIGNED、#913 OPEN、生产 WRITE OFF；BEX/Eidos/2D/全局状态不变。

> **2026-10-16 PA05-04D14C8 当前工程入口：** [真实 Object Extension 业务资源与原始 Owner 凭据内容锁定、许可被盗负向验证、未签身份问题](PA05-D14C8-APPROVED-COMMAND-PAYLOAD-20261016.md) · [PA05 认证基线 §38](PA05-CERTIFICATION-BASELINE-20261015.md)。接续已合并 D14C7 [PR #962](https://github.com/jiangxng/EVO-App-Platform/pull/962)，仅增强现有隔离 PG18 Host 许可和物理门禁，不新建业务引擎。**Host 原始命令来源独立身份认证及同一获批命令被盗令牌抢先执行仍未签收**。准确主线及当前 PR/CI 以 GitHub 为准；#913 OPEN、PA-05/W06 NOT_SIGNED、生产 WRITE OFF，不修改 BEX/Eidos/2D 或全局进度。

> **2026-10-16 PA05-04D14C7 当前工程入口：** [Host 许可撤销与真实业务 Owner 事务提交竞态／PG18 原文访问等级／未签问题](PA05-D14C7-PERMIT-REVOKE-COMMIT-RACE-20261016.md) · [认证基线 §37](PA05-CERTIFICATION-BASELINE-20261015.md)。本次不重建 D9/D10/D14C5/C6，仅在显式隔离测试 Host SQL 身份中提供有界撤销；**已泄露且未撤销令牌＋业务 SQL 凭证的命令字段/凭据伪造仍为未签安全缺口**。准确 HEAD CI、PR/分支及 main 以 GitHub 为准；#913 OPEN，PA-05/W06 NOT_SIGNED、生产 WRITE OFF，不改 BEX/Eidos/2D 或全局状态。

> **2026-10-16 PA05-04D14C6 当前工程增量：** [Post-install Host/Business SQL 角色授权漂移与 NOINHERIT/PUBLIC 反例、官方 PG18 源阅读等级](PA05-D14C6-OBJECT-SQL-ROLE-DRIFT-20261016.md) · [PA05 认证基线 §36](PA05-CERTIFICATION-BASELINE-20261015.md)。接续已合并的 D14C5 [#959](https://github.com/jiangxng/EVO-App-Platform/pull/959)，仅增加实际数据库签发和业务 SQL INSERT 时的动态角色漂移阻断，复用三物理 PG18 实证；精确 PR/CI/合并状态必须从 GitHub 核验。PA-05、PA05-W06 NOT_SIGNED，#913 OPEN，生产 WRITE OFF，不动全局 continuity/BEX/Eidos/2D/默认生产路由。

> **2026-10-16 PA05-04D14C5 工程增量（#959，精确合并前状态以 PR 为准）：** [Host→真实 Object Extension Business LOGIN 不可冒用的许可边界与反例/资料等级](PA05-D14C5-HOST-PERMIT-BOUNDARY-20261016.md) · [PA05 专项基线 §35](PA05-CERTIFICATION-BASELINE-20261015.md)。沿用旧窗口 [交接入口](PA05-WINDOW-HANDOFF-ENTRY-20261016.md) 及 [参考索引](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md)，不覆盖历史阅读等级。新做独立 Host SQL LOGIN + 物理许可/提交前原 Owner 凭据核验，工程验收见 [PR #959](https://github.com/jiangxng/EVO-App-Platform/pull/959)；**PA05-W06 / PA-05 NOT_SIGNED，#913 OPEN，生产 WRITE OFF**。DBA/Host+Owner 双凭证/失联 ACTIVE 旧票/生产身份与 PA05-05 均未签，勿改默认生产路由。


> **2026-10-16 PA-05 最新换窗入口（优先于下方旧 PA05 D8 快照）：** [短交接入口](PA05-WINDOW-HANDOFF-ENTRY-20261016.md) · [详细研究资料/原链接/阅读等级/决策/PR/CI 索引](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md) · [PA05 专项工程证据 §22–34](PA05-CERTIFICATION-BASELINE-20261015.md)。编写时一手基线 `main@5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7`，已包含 D14C4 [#954](https://github.com/jiangxng/EVO-App-Platform/pull/954)。**这只是 Agent 线固定快照**，本窗口未新访外站官网；新窗口必读 AI-BOOTSTRAP 及 GitHub 最新 main。下一项暂定 D14C5：真实 Object Extension business SQL 凭证/事务来源防冒用反例及信任边界；**#913 OPEN、PA05-W06 / PA-05 NOT_SIGNED、生产 WRITE OFF**。不得改 BEX/2D/Eidos 或默认为生产可写。

> **2026-10-15 PA-05 旧窗口恢复入口（当前最新 Agent 专项导航，固定快照）**：[恢复后的决策／进度／待办](PA05-WINDOW-RECOVERY-HANDOFF-20261015.md) · [证据等级、原网址、PR/CI 和取舍详细索引](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md) · [PA05 专项当前记录](PA05-CERTIFICATION-BASELINE-20261015.md)。截至保存基线 `main@ad0b4172eb1cf0086d4836b57203a62107ee1323`，#930 merged、同库 PG18 40/40、准确 HEAD 7/7；**跨独立数据库/多 Host 和 PA05-05 仍 OPEN；PA-05 IN_PROGRESS / NOT_SIGNED；生产 WRITE OFF**。此项是 Agent 独立窗口导航，不改写 `project.status.json` 或生成的全局 handoff。每次接续必须重查最新 GitHub。


> **2026-10-15 PA-02 新窗口最新研究资料包（优先于下方历史入口）：** [简短交接入口](PA02-WINDOW-HANDOFF-ENTRY-20261015.md) · [完整来源／网页阅读等级／PR CI／方案决策索引](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)。本包编制基线 `main@991ac3e030884b69586b3c1732db9953dc17ef91`，**不是合并后永久 HEAD**；新窗口先按 `AI-BOOTSTRAP.md` 查最新 main 与实际 PR。R01–R09 隔离验证已证明，R10 **实际货币硬预算 NOT_SIGNED**，权威阻断 [Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879)，不能用合成费用签收。历史外部 H01–H14 仍未在本窗口访问原文。四条旧 PA02 文档分支的 SHA 退休清单已合并，但删除需要安全 Workflow 的手动 execute=true，**不得声称已删除**。不部署生产、不开生产 WRITE、不开 PA-03～06 范围。


> **2026-10-14 PA-02 当前可更新验收表（优先查看）：** [R01–R10 固定验收状态与下一门槛](PA02-CURRENT-ACCEPTANCE.md)；本次 [R10 Provider usage 持久证据、官方阅读等级、货币硬预算缺口](PA02-R10-USAGE-EVIDENCE-20261014.md)；相应代码 PR [#856](https://github.com/jiangxng/EVO-App-Platform/pull/856)。原 10-14 交接入口和详细索引仍是不可改写的历史快照，不以新研究混淆旧 14 条 H 级外链。此导航不宣称 PA-02 已签收或生产 WRITE 已批准。


> **2026-10-14 PA-02 最新换窗交接（优先于下方所有历史 PA-00～PA-02 阶段状态）**：请先读 [本窗口 PA-02 简短入口](PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md) 和 [详细 GitHub／外站参考索引、方案比较、未决项](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md)。截至该入口创建时，#839、#841、#842、#844、#845、#847、#848 均已合入 main；R10 真实费用硬预算、真实 HTTP／浏览器恢复整链及 R01–R10 综合签收**仍未完成**。本行只是交接导航，实际进展/PR 以 GitHub 最新 main、检查结果与新入口为准。下方 10-10/11/13 文字保留历史，不要当当前门禁；原 14 外部链接仍是历史转引，**不是本窗口已读外站**。


Document class: LIVING_RUNBOOK

> **2026-10-13 最新换窗提示（优先于以下所有历史PR/分支状态）：** 请先读 [新版简短入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261013.md)、[本轮原始GitHub/外链资料索引](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md)、[方案取舍与未决门禁](WINDOW-RESEARCH-DECISIONS-GAPS-20261013.md)。PA-01和Legacy External Agent五分支已完成各仓main合并/删除，旧#692 PR虽未通过自身merge，但实验历史与代码已由Platform#786纳入main。以下旧段落作为2026-10-10/11历史日志保留，不可再次当最新实施状态。本指针不调整TR/2D主线或生产。

更新时间：2026-10-10。用户已授权启动并持续推进Agent线，要求留存进度；常规工程无需逐项确认。不得影响业务主线和2D线。

## 2026-10-11 换窗入口

请先读 [研究与决策交接入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261011.md)，再按任务读 [详细参考索引](WINDOW-RESEARCH-SOURCE-INDEX-20261011.md) 与 [方案比较和缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261011.md)。最新任务为PA-01B2隔离环境真实浏览器验收；下方早期“下一步PA-01B2”是历史检查点。精确代码head未变，未合并/部署。外部链接阅读深度与未归档附件已明确分级，不据旧总纲重启PA-00。

## 当前状态

- PA-00：首轮静态盘点已完成；实际环境绑定/容量/恢复基线仍待测，不能整体标生产基线PASS。
- PA-01A：首个真实缺陷修复已实现，本地目标测试10/10 PASS；准确head仓库CI 16/16成功。未合并、未部署。
- 规划/进度 PR：[#570](https://github.com/jiangxng/EVO-App-Platform/pull/570)，分支 `docs/personal-agent-blueprint-20261010`。
- 实现 PR：[#575](https://github.com/jiangxng/EVO-App-Platform/pull/575)，分支 `agent/pa01a-contextual-turn-identity-20261010`，当前实现head `f5efab9b110b3e79635c7f904ef7a7d94fd6b137`。

## 本轮完成

1. 核实manager/server.ts实际Run/Receipt构造路径为JSONL或内存；Conversation有独立PostgreSQL authority，不重做AF-01/02。
2. 确认Run/Receipt同步公开端口会影响后续数据库迁移设计；记录已有实时事件通道，避免另起重复系统。
3. 发现同clientTurnId、同文字但不同导入作业会错误复用旧Run；PA-01A已在复用前验证完整interactionContext。
4. 新增6项回归，连同4项旧测试共10/10通过；修改前代码同套测试5项失败，已证明覆盖真实缺口。
5. 实施仅改Agent handler、对应集成测试与专属证据，未改共享Host、2D/vendor、主线状态或部署。

## 资料入口

- [建设总纲](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)：研究快照，不自动成为当前契约。
- [PA-00盘点与PA-01A范围](PA00-BASELINE-AND-PA01A-SCOPE-20261010.md)：代码证据、协议映射、冲突文件、剩余基线。
- [PA-01A实现证据](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01a-contextual-turn-identity-20261010/docs/agent-line/PA01A-CONTEXTUAL-TURN-IDENTITY-20261010.md)：本地测试方式与未覆盖限制。

## 下一步（无需重做研究）

PA-01A、PA-01B1、PA-01B2 已实现并通过对应准确 head CI；最新检查点见文末。下一步为 PA-01B2 隔离环境真实浏览器验收，随后再进入 PA-02；生产迁移前仍需实际环境与恢复证据。

## 未完成/限制

现有去重只查询100个Run，未解决永久唯一键或多进程幂等。真正取消、数据库Run/receipt、outbox与租约尚未实现。本地使用Node24对12个固定版本真实依赖模块作TS变换后执行原集成测试，不是完整tsc/npm构建；完整构建以仓库CI为准。没有浏览器、真实LLM、生产或数据库验证。

## 边界与主线快照

盘点代码基线 `301cf0a45e59591adcb6a33e6d30fb68a94db443`（#571）；创建#575时main已到 `39109addd721c017cd6276c60ee4b3062ab3f6b7`。不因主线继续前进反复重写研究快照，接续时定向核对差异。

2D #563/#566/#568涉及Agent crop CAS与vendor；本线不改图形写入。独立分支/PR/进度，不修改project.status.json或docs/roadmap/HANDOFF-LATEST.md，不推main、不自行部署/purge/生产迁移。共享契约/模块更改前核查owner和开放PR。

## 新窗口读取顺序

读仓库AI-BOOTSTRAP与当前主线状态（只读），再读本文件、PA-00记录、#575真实代码/检查结果，然后按当前任务读取总纲。不要根据旧聊天重建状态或重复已经通过的工作。

## PA-01A仓库验证闭环

准确head `f5efab9b110b3e79635c7f904ef7a7d94fd6b137`，本次返回的16项PR工作流全部SUCCESS。

- [P1.7B完整构建与线程集成测试](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014345349)：npm ci及npm run test:conversation-thread:p1-7b步骤均SUCCESS。
- [Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014345337)：SUCCESS。
- [Project Continuity CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014345295)：SUCCESS。

因此首切片状态为 IMPLEMENTED_CI_PASS_NOT_MERGED_NOT_DEPLOYED；仍不等于完整PA-01或生产验收。实现分支中的静态证据文件原先写CI_PENDING，此处的准确head运行链接为后续验证记录，避免仅为状态文字反复触发实现分支CI。PR#575仍为Draft以明确等待集成，未阻断其他主线。

## PA-01B1最新检查点

PR [#577](https://github.com/jiangxng/EVO-App-Platform/pull/577)，分支 `agent/pa01b-assistance-contract-20261010`，head `15f059da4d841e2bc1b6b84b0171bb1be0827797`，叠加于#575（PR base是PA-01A分支，不是main）。

后端已支持版本化assistanceRequest，沿现有thread.send执行；请求编号与clientTurnId绑定、来源与资源版本随Run保存、send/resume返回assistanceResult。旧入口兼容；重复请求仍比较完整任务身份。Run成功不代表业务写入成功，结果只引用真实receipt IDs。

本地23/23目标集成测试通过（含新增13项），覆盖持久事件重建、调用方修改隔离、版本/身份字段/输入冲突/大小深度等。P1.7B仓库完整构建及49/49测试通过；17项仓库工作流全部SUCCESS。未合并/部署。详细契约：[PA-01B1记录](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01b-assistance-contract-20261010/docs/agent-line/PA01B1-ASSISTANCE-CONTRACT-20261010.md)。

下一步PA-01B2：Eidos owner实现页面transport及source匹配/未保存输入保护，之后窄范围vendor消费。当前导入按钮仍走可用旧协议，不声称页面已经切换，也不自动刷新覆盖。不要把后端契约称为整个PA-01完成。

### PA-01B1仓库验证记录

准确head `15f059da4d841e2bc1b6b84b0171bb1be0827797`：[P1.7B运行38014789592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014789592)，job114102554558的npm ci、tsc构建和测试均SUCCESS，49 tests /49 pass /0 fail。共返回17项工作流，17项全部SUCCESS，包含[Platform CI 38014789600](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014789600)。未测试浏览器和生产。

PA-01B2接入前需注意：旧基线Eidos源文件与Platform vendor存在既有差异，已查询的upstream page-controller/workbench shell未找到对应interactionContext/refreshSourceOnComplete文本；personal-agent-thread-chat读取未获得可用源码。先比较真实Host/vendor实现与upstream owner，不整包覆盖或凭名称假定两仓同步。

## PA-01B2 最新检查点（2026-10-10）

状态：IMPLEMENTED_CI_PASS_BROWSER_PENDING_NOT_MERGED_NOT_DEPLOYED。

- 平台 PR [#579](https://github.com/jiangxng/EVO-App-Platform/pull/579)，分支 `agent/pa01b2-page-assistance-20261010`，准确 head `db555162370b3c3c992c7aef88f605f9ebf2d0cd`，base 为 #577 分支。依赖顺序 #575 → #577 → #579，不应直接把 #579 单独合入主线。
- Eidos owner PR [#142](https://github.com/jiangxng/eidos/pull/142)，分支 `agent/pa01b2-contextual-refresh-20261010`，准确 head `f1057a64e26377ecf719c34ea83ff74b9dee9dc9`。两仓均 Draft。
- 已接入页面按钮→侧栏→版本化 assistanceRequest→真实 thread transport→assistanceResult 返回链路。requestId 使用 UUID，复用线程发送身份；不混发旧 interactionContext，不静默降级丢失上下文。
- 仅请求、来源、任务、Run、终态和当前挂载实例全部匹配，且无未保存原生表单修改时刷新。已有或等待期间的修改保留；离开后重进同一路径、失败/取消/暂停/旧结果均不刷新。按钮等待期间禁用，异常恢复。
- 通用 helper 在 Eidos owner 实现，平台 narrow vendor 消费。既有 Host transport 上下游差异未整包覆盖，2D/crop 未改。

### 精确提交验证

- 平台 [P1.7C 38015600526](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015600526)：npm ci、完整 tsc 构建成功，63 tests /63 pass /0 fail（含本地 23 项 transport/guard 测试）。
- 平台准确 head 返回的 10 项工作流全部 SUCCESS，包括 [Platform CI 38015600547](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015600547)、跨项目 CI、P1.8A/P1.8C 和 Continuity CI。
- Eidos [release-check 38015597223](https://github.com/jiangxng/eidos/actions/runs/38015597223)：完整类型检查/构建与 235 tests /235 pass /0 fail。首次 CI 发现日文/繁体文案缺 key，已补齐四种语言并重新通过。
- 上述 Node/CI 证据不等于真实浏览器验收。未访问生产、未执行真实 LLM 或数据写入、未合并/部署。

### 下一步（先补验收，不重做研究）

在隔离测试环境使用此堆叠分支及匹配后端做真实浏览器检查：①干净来源页成功刷新；②已有/等待中修改保持；③离开后回到同一路径不刷新；④失败不刷新；⑤普通聊天与导入字段匹配回归。确认真实业务写入凭证与 Run 成功不是同一概念。

当前 dirty 保护范围为原生 input/textarea/select，测试用 DOM 替身；自定义富文本/画布需要显式 dirty 接口，不能称为已全面保护。程序保存未重挂载时可能保守阻止刷新。后续再进入 PA-02 Run/receipt 异步端口与持久化设计，不跳过环境/恢复基线。

平台实施说明：[PA01B2](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01b2-page-assistance-20261010/docs/agent-line/PA01B2-PAGE-ASSISTANCE-20261010.md)。本文件为持续状态入口，实施说明中的初始 CI_PENDING 以此处准确 head 证据为准，避免仅改状态反复跑实现 CI。


## 2026-10-11 新窗口接续：PA-01B2 原生 Chromium 预检

**新增门禁状态：NATIVE_CHROMIUM_HELPER_CI_PASS / FULL_APPHOST_BACKEND_BROWSER_PENDING / NOT_MERGED / NOT_DEPLOYED**。PA-00及PA-01A/B1/B2既有实现不重复启动；下一步仍为隔离环境中完整 App Host + 匹配后端的五组真实浏览器验收。

- 已按准确ref顺序复读本线四份交接文档并只读核查Platform/Eidos main、AI-BOOTSTRAP/LLM/owner和并行PR。Platform main当前为 `653a1646bf4178b5b068b85323189304f89e76fa`；旧Platform生产/continuity快照仍指向较早版本，**没有因此修改或重排TR业务主线**。Agent实现堆叠 #575→#577→#579 和Eidos #142仍开放Draft；文档 #570仍开放。
- 本地基于 #579 的 `contextual-assistance.ts` 严格验证Git blob `38cb45a81691d863d9c6ba79a377fb8c6e9a7699`，在隔离 Chromium `144.0.7559.96` 使用真实DOM/Playwright完成 10/10 helper预检（草稿、来源、终态、普通聊天封装、字段匹配）；它不是完整页面/真实Run验收。
- 新增独立 [Draft PR #638](https://github.com/jiangxng/EVO-App-Platform/pull/638) (`agent/pa01b2-native-chromium-preflight-20261011`)，base为#579实现分支，不碰原实现分支或main。head `793b2fb430fd1e82c52309fd4b705be2301f1cad`。真正GitHub Runner从该head构建后，原生 [Chromium CI run 38095315018](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018) 已 **SUCCESS, 10/10 PASS, Chromium 141.0.7390.37**；完整Job `114339888058` npm ci、build、Playwright、浏览器脚本、artifact上传全部成功。artifact [11685148470](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018/artifacts/11685148470)（report + 屏幕辅助图）。同时对应[Continuity CI 38095314949](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095314949) SUCCESS。**该CI只验证构建产物 helper 与真实原生DOM，不包含真实App Host或真实后端**。
- 固定证据见 [PA01B2-NATIVE-CHROMIUM-PREFLIGHT-20261011.md](PA01B2-NATIVE-CHROMIUM-PREFLIGHT-20261011.md)。新增PR没有改业务逻辑、vendor整包、项目全局状态或生产环境；原外部14项研究阅读等级仍保持待验证。

### 尚未完成的真实浏览器验收（继续按此顺序）

1. 隔离运行#579以及#577/#575所需的匹配Host后端，使用原生浏览器启动真实Eidos Workbench与已授权导入job；不得访问生产。
2. 干净页严格关联只刷新一次；请求前/等待中草稿保留并显示提示；离开重回同route旧响应不刷新；失败及非成功态不刷新；普通聊天与实际数据导入映射/Recipe二次导入不回归。
3. 保存准确代码heads、浏览器/运行命令、网络请求与真实Run/receipt、断言、截图、失败控制与清理；无此证据不标 `BROWSER_PASS`。
4. 完成后再进入PA-02A异步Run/receipt端口；不得把CI、本预检或Run文字成功升级为业务写入或生产认证。



## 2026-10-11 五倍推进：PA-01B2 隔离真实 App Host + Chromium 验收通过

**新增限定门禁：`PA01B2_ISOLATED_FULL_HOST_BROWSER_PASS_DETERMINISTIC_MODEL`**；原 PA-01A/B1/B2 实现head和Draft依赖链 #575→#577→#579 / Eidos #142 未变，尚未合并、部署。PA-00不重新启动，业务主线TR及2D专项均不接管。

- 在原独立测试Draft PR [#638](https://github.com/jiangxng/EVO-App-Platform/pull/638) 补充 **真实编译后 Host、Workbench、企业上下文创建、四个相关安装包、Agent thread/Run、Data Import 与 Chromium** 的E2E运行器；仅模型Responses API通过 `127.0.0.1` 确定性替身返回文本，避免外部API Key和不可控副作用。
- 最终测试准确 head `56a18615efdd6029ddf9057b85510b43b835fe8c`、[full-browser GitHub run 38097668578](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578)，job `114346855709`，**SUCCESS 8/8**，Chromium `141.0.7390.37`；[报告及截图 artifact 11686346415](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578/artifacts/11686346415)。
- 实测内容：干净来源页 `thread.send` 的assistanceRequest定位准确且源页**恰好一次HTTP重读**、已有草稿保持且零重读、等待中修改保持且零重读、离开再进同path旧结果不刷新、Responses受控503不刷新且按钮恢复、普通聊天仍走thread不混入assistanceRequest、真实 `stage-file → review → commit` 后同结构第二份CSV自动采用Recipe并达到 `DRY_RUN_READY`。
- 3轮早期CI [5/8](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097262322)、[7/8](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097433261)、[7/8](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097557504) 均为浏览器观测脚本问题（response监听、重复按钮定位、百分号编码route GET计数），修正后才关闭这8项；产品权限/dirty校验未放宽。详细失败记录和证据： [PA01B2-FULL-HOST-CHROMIUM-ACCEPTANCE-20261011.md](PA01B2-FULL-HOST-CHROMIUM-ACCEPTANCE-20261011.md)。
- 本次记录是**隔离确定性模型下的真实浏览器与Host端到端**，不宣称真实外部LLM字段映射、Agent真实调用 `enterprise.data-import.mapping.apply`、正式ActionReceipt/业务写入、生产环境/恢复演练、富文本dirty接口或PA-01整包完结。
- 代码/自动化都留在独立Draft PR #638，文档只更新Agent专属 `docs/agent-line/*`，没有改 `project.status.json` 或 `HANDOFF-LATEST.md`，无merge、部署、vendor整包覆盖或生产迁移。

### 后续独立推进顺序

1. **PA-01B3/受控AI业务动作端到端**：模拟确定性函数调用，经 Host 授权的正式 `mapping.inspect/apply` 写入测试隔离Job，核真实Run/actionReceipt并做权限拒绝无副作用；区分Run成功/业务写成功。避免把只返回文本的模拟LLM标记为AI字段映射完成。
2. **PA-02A**：读取当前State Context宪法、Run/receipt sync store与公开端口，先独立设计async接口和一次可撤销的隔离持久存储唯一性/恢复证明；不先改 `manager/server.ts`、不重新搬会话层、不做生产迁移。
3. 更后的PA-01提案/回执UX、跨进程租约/outbox/正式取消、丰富表单dirty provider仍为独立门禁。进度继续只写本线专属文档。



## 2026-10-11 五倍推进后续：PA-01B3能力写入/拒绝与PA-02A PostgreSQL独立证明

**当前隔离证据状态（不代表生产）：**
- PA-01B2 [full-browser](PA01B2-FULL-HOST-CHROMIUM-ACCEPTANCE-20261011.md)：独立#638 head `56a18615efdd6029ddf9057b85510b43b835fe8c`，[CI 38097668578](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578)，Chromium 141、真实Host/Workbench/Thread/Run/Data Import 8/8 PASS。模型是受控localhost Responses服务，**非真实LLM自主映射**。
- PA-01B3 [正向授权写入](PA01B3-ISOLATED-AUTHORIZED-MAPPING-20261011.md)：独立Draft [#691](https://github.com/jiangxng/EVO-App-Platform/pull/691)先在[CI 38097917163](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097917163)成功运行8/8 B2，再经真实 `evo_capabilities_invoke_write`→`enterprise.data-import.mapping.apply` 完成AGENT来源的导入映射及DRY_RUN_READY，返回真实ActionReceipt ID，浏览器重新读取页面一次。**不等于数据正式COMMIT或真实大模型语义质量合格**。
- PA-01B3 [显式AI拒绝](PA01B3-EXPLICIT-AI-DENY-BROWSER-20261011.md)：同一#691最终测试head `4692555eaa730c013f7c044f1b25e2e61825e350`，[双分支CI 38098385340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340) allow与deny两个独立Chromium jobs均SUCCESS。deny要求源作业STAGED状态及DETERMINISTIC映射保持未改；有审计关联Receipt ID，但未独立读取其终态，不能将它称为成功写入。首次负向测试假设错误：Data Import [authorization.ts](https://github.com/jiangxng/EVO-App-Platform/blob/db555162370b3c3c992c7aef88f605f9ebf2d0cd/apps/data-import/authorization.ts)现行baseline本就允许Owner/Admin的HUMAN/AI，必须用明确DENY覆盖才能构造真实拒绝。产品授权策略没有被修改。
- PA-02A [异步持久端口候选](PA02A-ASYNC-RUN-RECEIPT-PORT-DESIGN-20261011.md)+[PostgreSQL唯一性proof](PA02A-POSTGRES-UNIQUENESS-PROOF-20261011.md)：独立Draft [#692](https://github.com/jiangxng/EVO-App-Platform/pull/692)，base #579，不叠加其它测试PR。head `9f794cf928d9a01e55a22c6d5742ea23fd7bc456`，[CI 38098470224](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098470224) PASS。一次性PostgreSQL 18随机schema+两个独立DB连接：32并发同turn仅1创建、131新turn后可重取原身份、scope隔离、run事件revision CAS、32并发receipt begin/terminal只转移一次、关连接再连接可读取；**仅DB连接重连，不是完整业务进程崩溃恢复**。原同步 V010 仍原样、server/生产未切换。先前两次失败都是JSONB文本/对象反序列化差异，已修复并保留CI原始记录。

**下一Agent专线门禁**：PA-01B3侧补授权拒绝后Receipt终态确证、错企业/身份及多个字段语义边界、审批/提案真实UX；PA-02A侧补真正独立Node进程重启、PostgreSQL掉线/事务回滚、receipt与业务写入不确定结果reconciliation，再阶段性制定异步handler迁移路线；PA-02B lease/fencing/outbox及PA-02C正式cancel仍OPEN。

全部新代码在#638/#691/#692隔离Draft PR，未改原#575/#577/#579实现或Eidos#142 owner分支，未合并、未部署、未访问生产、不碰TR主线、2D专项、`project.status.json`、`docs/roadmap/HANDOFF-LATEST.md`、全量vendor。原研究14项外链阅读级别未被虚构升级。


## 2026-10-12 Agent 专项单阶段分支收敛（最新状态，优先于以上历史快照）

用户要求以“一步一步、一个阶段完成再进main”的方式推进，停止之前拆分成过多活跃分支的流程。此处只记录已经执行的PR操作，不声称历史CI代表当前main全量验收。

- **当前唯一待主线集成的PA-01应用PR为 [#575](https://github.com/jiangxng/EVO-App-Platform/pull/575)**，分支 `agent/pa01a-contextual-turn-identity-20261010`。实际集成内容已不是只含PA-01A：它已依赖顺序吸收 **#577 (PA-01B1) → #579 (PA-01B2) → #638 (B2 native/Host Chromium验收) → #691 (B3能力写入/显式拒绝验收)**；准确集成head在文档写入时为 `e49cdea7d1f192131b59e1e70ffb500facdce8d3`。这些PR的合并目标均是Agent集成分支，**没有合进main或部署生产**。
- 各中间PR #577、#579、#638、#691 **已merged/closed**；因为仓库 `delete_branch_on_merge=false`，关闭PR不代表其Git ref已删除。不要将剩余Source refs冒称已删除；后续须在确认无open PR依赖且精确head一致后按GitHub的受保护分支退休流程另行清理。
- [#692](https://github.com/jiangxng/EVO-App-Platform/pull/692) PA-02A PostgreSQL实验已**关闭但未合并**，head `9f794cf928d9a01e55a22c6d5742ea23fd7bc456` 和原源码/CI仍保留为明确的**PAUSED / UNFINISHED**。它不是PA-01的依赖，也绝不能因收敛而混入PA-01功能实现或生产。
- [#570](https://github.com/jiangxng/EVO-App-Platform/pull/570) 仍承载独立Agent专项研究/验收证据文件；尝试直接合入main时被仓库必需检查 `continuity`（up-to-date/required check）阻止。绝不绕过规则。下一步为将本线文档跟随唯一PA-01集成分支归档，避免第二条活跃开发线。
- Eidos组件正式owner仍为 [eidos#142](https://github.com/jiangxng/eidos/pull/142)，目前独立Draft/未合并。不得把Platform的vendor窄适配误称为Eidos owner正式合入。
- **当前尚未完成**：PA-01和变动较大的main重对账、up-to-date CI/required status checks、主线合并、Eidos owner审核、产线部署、真实LLM质量、PA-02持久状态集成/恢复。PA-01分支最初落后main数百提交；不能只凭旧head测试自动合入。
- **执行规则**：从现在起不新建新的Agent开发分支，单阶段仅保留一个活跃集成PR；测试/文档随本阶段收口。当前先完成PA-01对当前main的集成门禁，再考虑下一阶段。TR/EVO Ledger Runtime/2D和全局 `project.status.json` 不动。
