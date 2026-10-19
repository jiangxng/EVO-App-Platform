# PA05-05/E01J4A — persisted multi-Worker READ Host reattestation after central revoke

**Date:** 2026-10-19. **Class:** DECISION_RECORD; isolated engineering candidate. **Not** production Host lifecycle/Owner installation signoff.

## Milestone ledger — fixed scope, no expansion

| PA-05 milestone | Inherited status | E01J4A objective / limit |
| --- | --- | --- |
| E01A–J1 | Previously completed bounded engineering and research | Do not recreate |
| E01J2 | Engineering BOUNDED_PASS, [#1024](https://github.com/jiangxng/EVO-App-Platform/pull/1024) | Preserve authenticated SQL Host + original Handler/roles |
| E01J3 | Engineering BOUNDED_PASS, [#1026](https://github.com/jiangxng/EVO-App-Platform/pull/1026) | Preserve 18/18 PG18 and TCP-fault negative history; driver P0 OPEN |
| **E01J4A** | **IN_PROGRESS** | 2 original AppManagers + 2 independent persistent local state files + one central SQL reattest control; 19/19 PG18 with 0 skips required |
| E01J4 full global lifecycle | **NOT_SIGNED** | Atomic cross-store install/disable/upgrade/crash/partition across real production Workers NOT proved |
| PA05-05 E01–E05 | **NOT_SIGNED** | No actual Human/Agent/Provider/tenant/browser certification |
| PA-05/W06 | **IN_PROGRESS / NOT_SIGNED** | #988, #979, #913 remain OPEN |
| Production material WRITE | **OFF** | No Railway, global status, BEX/CP03/Eidos/2D or other-owner changes |

## Verified original sources and decisions reused

- [PA05-05 certification baseline §55](PA05-CERTIFICATION-BASELINE-20261015.md), [E01J3 evidence](PA05-E01J3-INFLIGHT-TCP-READ-20261019.md), original 18/18 PG18 [#39205257968](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39205257968): central SQL transaction and original business Handler are already proven; no repeat.
- Direct original code checked 2026-10-19: `manager/store.ts` has **process-local** in-memory or JSON file-backed `LifecycleStore`; `manager/service.ts` provides actual `install/enable/disable/getSnapshot`. Two independent JSON files are **not a shared database** and **not transactional with PostgreSQL**.
- [E01I startup quarantine](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md): actual production Host already fails closed on restored uncertified Purchase Attention state; this isolated disposable worker fixture **does not replace or bypass that production startup policy**. It intentionally loads the old state to prove the SQL authority still denies it.
- [E01J2 real Host SQL gate](../../manager/pa05-read-owner-authenticated-host.ts) checks protected PostgreSQL `session_user`, pinned Owner and row locks. [Original three PG18 workflow](../../.github/workflows/agent-pa05-cross-database-admission.yml). Previously graded official PostgreSQL references remain in [original source ledger](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md); not newly claimed as read.
- Previous real node-postgres `postgres 3.4.9` null-socket crash and still-open upstream patch/issue remain a **P0 resilience gate**; not a reason to patch a shared dependency in this separate scope.

## Narrow security behavior under real three-PostgreSQL18 regression

Within the same ephemeral central authority/schema and true Host A/B non-superuser SQL LOGIN identities, add opt-in **DBA-owned** `pa05_read_host_activation_epoch`. This is not visible or writable by ordinary Worker roles. The central SECURITY DEFINER READ function checks the database-authenticated Host and `ACTIVE` Owner epoch, then checks the *same Host's approved epoch* using a PostgreSQL `FOR SHARE` transaction lock. An E01J4 test-only administrator performs explicit attestation for one verified Host after checking its local state. The implementation has **no new client-declared Host ID**, network identity assumption, automatic repromotion, public administrative operation, Agent tool or default Host startup import.

Use actual `createFileLifecycleStore` in two separate Node Host child processes with distinct files and the existing Purchase Attention → Trading Reference original Action Router. After successful READ on epoch 6:

1. Trusted DBA **first** freezes epoch 6→7. Host A disables locally, but Host B is left installed+ACTIVE in its *own JSON file*.
2. Kill Host B process (actual OS SIGKILL), spawn a new independent Node process using B's unchanged state file. It still shows local ACTIVE; actual business READ using old epoch 6 or frozen epoch 7 must fail centrally.
3. DBA explicitly certifies central epoch 7→8. Neither Host A nor B receives automatic per-Host SQL reattestation; both are refused with `PA05_READ_SQL_HOST_REATTEST_REQUIRED`, even if a caller supplies fresh epoch 8.
4. Ordinary Host B SQL role cannot mutate the protected attestation table. DBA separately checks A's local state, explicitly re-enables its original AppManager, and attests **only A** to 8. A succeeds through original business READ; B remains forbidden despite its restored local ACTIVE.
5. Ensure CI preserves the previous 18 PG18 tests, includes the new `PA05_E01J4_PERSISTED_MULTIWORKER_REATTEST_PG` marker and requires **19/19 actual PG18 PASS, no skipped**.

**Important ceiling:** This is a real isolated **control-plane mechanism proof**, not transactionally atomic AppManager JSON+PG installation, true production administrator decision/credential custody, all Worker instances' consensual recovery, globally atomic activation, or a real production Host route. The disposable DBA writes approvals directly for test only; future operator identity and lifecycle composition require their own production admission. A DBA or privileged table owner can still change its own trusted policy. The worker fixture restores JSON to exercise the risk; production E01I startup guard still rejects unqualified restoration.

## CI and decision status

**First genuine complete PostgreSQL18 pass (engineering evidence):** implementation HEAD `aae0982af8faeeed7a9d70dbaff8fcffab3a0167`, [physical PG18 Actions #39208481146](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39208481146), job `117916392195`: original job log inspected, **19/19 PASS, 0 failed, 0 skipped**; all prior E01J1/J2/J3 and WRITE/PKI markers enforced. Real `PA05_E01J4_PERSISTED_MULTIWORKER_REATTEST_PG` shows `distinctWorkerProcessAndStateFiles:2`, `centralRevocationBeforeLocalDisable:true`, `crashedWorkerRestoredLocallyActive:true`, `globalRecertificationDoesNotAutoApproveWorkers:true`, `reattestedHostReadPasses:true`, `unapprovedSurvivingWorkerDenied:true` and explicit `localJsonPostgresAtomicityCertified:false`, `productionOperatorAttestationCertified:false`, `productionHostLifecycleWired:false`, `pa05Signed:false`.

**Real preliminary failures preserved:** first CI [#39207937779](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39207937779) failed from generated JavaScript SQL-template collision (E01J4 was not executed); next [#39208207883](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39208207883) failed due missing `createFileLifecycleStore` import and SIGKILL cleanup masking the cause. Fixes stayed on original PR #1029, with no relaxation of SQL/authorization or inherited tests.

**Final accurate PR HEAD still requires six relevant CI checks and verified main merge/retirement** after this evidence/document change. An isolated initial code-HEAD PASS must not be silently upgraded into final PR-HEAD acceptance. One active PR; main branch protection preserved.

**Subsequent gate (not silently added):** actual installed generic Host lifecycle admission with durable central activation authority across Worker upgrades/uninstall, secret-protected real operator consent and SQL/JSON repair after partial failure; resolve or securely contain `postgres 3.4.9` crash for actual in-process Host resilience, then separately PA05-05 E01–E05 and W06.
