# PA05-05/E01J4B — SQL-first durable READ lifecycle repair after Worker crash

**Date:** 2026-10-19 · **Class:** DECISION_RECORD · **Status:** E01J4B ENGINEERING_BOUNDED_PASS / MERGED; overall W06 NOT_SIGNED. **Scope:** second bounded E01J4 proof; no scope expansion or production deployment.

## Fixed milestone status table

| Milestone | Status at E01J4B start | Exit condition |
| --- | --- | --- |
| E01A–J1 | Previous bounded engineering completed | Reuse, not repeat |
| E01J2 | BOUNDED_PASS; #1024 | Original Host SQL identity/READ Handler regression |
| E01J3 | BOUNDED_PASS; #1026; postgres 3.4.9 crash P0 OPEN | Preserve transport negative proof; no dependency upgrade |
| E01J4A | BOUNDED_PASS; [#1029](https://github.com/jiangxng/EVO-App-Platform/pull/1029), final real PG18 19/19 PASS | Preserve distinct original file-backed AppManagers, Host SQL reattestation |
| **E01J4B** | **ENGINEERING_BOUNDED_PASS / merged #1031** | SQL-first durable lifecycle intent, abort/replay across crash + READ fence, real three-PG18 20/20 0 skipped, accurate HEAD CI and merge |
| E01J4 full lifecycle | **NOT_SIGNED** | Installed production Host, authenticated operator governance and *true* cross-store atomicity still absent |
| PA05-05 E01–E05 | **NOT_SIGNED** | Human/Agent/Provider/browser/live enterprise evidence absent |
| PA-05/W06 | **IN_PROGRESS / NOT_SIGNED** | Issues #988, #979, #913 remain OPEN |
| Production material WRITE | **OFF** | Do not deploy Railway or enable |

## Already inspected, original artifacts reused

- [E01J4A exact-head evidence](PA05-E01J4-PERSISTED-MULTIWORKER-REATTEST-20261019.md), [baseline §56](PA05-CERTIFICATION-BASELINE-20261015.md). E01J4A genuinely proved SQL-role-scoped per-Host reattestation with two independent PostgreSQL logins and two *different* original AppManager JSON stores; 19/19 PG18 with 0 skip. Nothing in that evidence proves transactional SQL + local JSON mutation.
- [E01J3 TCP cut](PA05-E01J3-INFLIGHT-TCP-READ-20261019.md): FAIL-CLOSED despite disconnect; upstream postgres.js null-socket timing crash is a **separate P0 risk**. No upstream reread or dependency change in this slice.
- Direct repository code reviewed 2026-10-19: `manager/service.ts` real `enable/disable/uninstall/install/getSnapshot`, `manager/store.ts` JSON store atomic rename for each save (but not across SQL), `tests/agent-line/fixtures/pa05-e01j2-host-worker.mjs`, `tests/agent-line/pa05-e01j2-authenticated-read-handler-pg.test.mjs`, `manager/pa05-read-owner-authenticated-host.ts`. Existing [E01I startup quarantine](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md) already blocks unqualified original production Host restart; our disposable child fixture purposely restarts with stale local state for negative testing, **not a production startup exception**.
- Historic official PostgreSQL references and their **graded actual-read provenance** remain in [E01J original-source index](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md). Not newly inspected here.

## One new bounded repair invariant

Within the existing disposable actual PostgreSQL18 authority and original Purchase Attention/Trading Reference Handler, a DBA-owned `pa05_read_lifecycle_intents` record is committed in **the same PostgreSQL transaction** as revoking the affected Host's `approved_epoch` via a compare-and-swap. The existing `SECURITY DEFINER` READ function takes `FOR SHARE` on the same approval row and therefore serializes against that cut. This guarantees an in-flight **approved READ finishes before the central cut can commit**, and *after central cut* a crash-stale AppManager `ACTIVE` flag cannot deliver a successful business READ.

Test then SIGKILLs the actual Node Host (1) **before local DISABLE**, (2) **after local DISABLE**, and (3) **after original AppManager UNINSTALL**. The same original file store must restore each distinct local state. A previously existing but now-uninstalled file must NOT trigger disposable test fixture auto-install on startup. The durable central intent survives all three crashes; ordinary Worker SQL role cannot change it; DBA can complete the intent with a one-time CAS after checking actual local state; duplicate completion affects zero rows. Even explicitly reinstalling the original package locally does not allow READ until the DBA *separately* reattests the same authenticated Host. Independent second Worker remains locally ACTIVE and centrally denied.

**Critical implementation distinction:** the `pa05_read_lifecycle_intents` and approval rows are only in **disposable DBA-owned PG18 test schema**. The original JSON file save and PostgreSQL transaction remain **two stores with no distributed ACID commit**. Crash safety is achieved for observed READ *authorization* because central admission fails closed. No automatic repair daemon, real operator authority, consensus of install state, production Host integration, migration or arbitrary side-effect cancellation is asserted. The original Host startup quarantine and production READ OFF posture remain unchanged. No material WRITE.

## Primary CI and decision evidence (verified final HEAD and merged engineering PR)

**First real CI failure and correction:** initial engineering HEAD `eb7b2acc461f19185ccc3ee9e50266a286ed43a7`, [PG18 workflow #39210347370](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39210347370) failed by incorrectly invoking E01J4B on its grandparent `node:test` context, deadlocking nested scheduling until E01J4A timed out at 55 seconds; no SQL authorization bypass was observed. Fixed nested context in same PR with `j4.test(...)`, retained 20 actual cases and every original gate.

**First exact-code-HEAD PG18 PASS (not yet final PR HEAD):** `2af4bf518910cdade86d02b28e89ceeccf74a88a`, [Actions #39210593533](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39210593533), physical PG18 job 117922859200, original raw log read: **20/20 PASS, 0 fail, 0 skipped**, including `PA05_E01J4B_CRASH_RECOVER_LIFECYCLE_PG`. Proof marker confirms original AppManager+Handler, SQL cut serialized after original READ, durable central intent with approval CAS in same transaction, stale ACTIVE/disabled/uninstalled restart denial and no auto-reinstall, three real OS Worker crashes, one-time repair, restricted SQL Worker role, per-Host reattest for new local install, unapproved second Host denied. Marker explicitly reports `productionCrossStoreAtomicityCertified:false`, `operatorConsentAndSecretsCertified:false`, `productionHostWired:false`, `pa05Signed:false`.


- [Engineering PR #1031](https://github.com/jiangxng/EVO-App-Platform/pull/1031), branch `agent/pa05-e01j4b-crash-safe-read-lifecycle-20261019`, from main `6648204d8ef8e373f611831acbbc2c335f27b602`.
- Actual 3 PostgreSQL18 CI requires the inherited markers + `PA05_E01J4B_CRASH_RECOVER_LIFECYCLE_PG` and **20/20 PASS, 0 failed, 0 skipped**; five other relevant workflows retained. Failed attempts must be recorded with original logs and corrected in the same PR.
- Sign only **E01J4B ENGINEERING_BOUNDED_PASS** after accurate final HEAD, original job log, merge commit and source branch status are independently verified. Leave full E01J4, W06 and PA05-05 NOT_SIGNED, #988/#979/#913 OPEN, Production WRITE OFF.


**Final exact engineering HEAD and merge (2026-10-19):** `4f4eb76d925cf26afa15b832e0c4e84644995419` after safely merging concurrent latest main `7238931ba6a223eee41f0d16ad8360e1e84d48b9`, with the PR's six changed paths still solely PA05 tests/workflow/Agent docs. [Three real PG18 CI #39211031284](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211031284), job `117924220259`, original raw log inspected: **20/20 PASS, 0 failed, 0 skipped**. Exact same HEAD: [Continuity #39211031204](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211031204), [Governed WRITE #39211031211](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211031211), [Human UI #39211031287](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211031287), [Cross-business READ #39211031317](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211031317), and [Lightweight Host #39211031203](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211031203) **all SUCCESS**. [PR #1031](https://github.com/jiangxng/EVO-App-Platform/pull/1031) **MERGED** `c5bb189f159b60241375a570ada6733ceb3ce3db`, original `agent/pa05-e01j4b-crash-safe-read-lifecycle-20261019` branch confirmed deleted (GitHub 404). #988/#979/#913 remain OPEN, W06 and E01–E05 NOT_SIGNED. **Bounded SQL-first repair proof only, no distributed cross-store atomic install or production Host route**. No Railway or other-owner global changes.

**Next gate remains fixed:** actual lifecycle admission wiring under a trusted Host/operator and independently secured credential custody. This E01J4B proof must not be renamed production cross-store atomic installation.
