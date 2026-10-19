# PA05-05/E01J4D — existing Host HTTP and Action lifecycle routes with opt-in PostgreSQL READ fence

**2026-10-19 · ENGINEERING_CANDIDATE, first physical PG18 PASS; final CI pending.** No Railway, production credentials, automatic install, or W06 signoff.

## Fixed PA-05 milestone status

| Milestone | Status | Kept boundary |
|---|---|---|
| E01A–J1 | Previous bounded research/engineering completed | Preserve, do not repeat |
| E01J2 | BOUNDED_PASS 17/17 | Authenticated SQL Host + real Purchase Attention Handler |
| E01J3 | BOUNDED_PASS 18/18 | Actual TCP cut; postgres 3.4.9 crash P0 OPEN |
| E01J4A | BOUNDED_PASS 19/19 | Separate persistent Workers and per-Host reattestation |
| E01J4B | BOUNDED_PASS 20/20 | SQL-first durable intent and multiple crash repair |
| E01J4C | BOUNDED_PASS 21/21, merged #1036 | Default-unwired, internal Host composition |
| **E01J4D** | **IN_PROGRESS / NOT_SIGNED** | Existing HTTP/Action routes opt-in to real SQL-first fence with dedicated role, 22/22 real PG18 expected |
| E01J4 full production lifecycle | OPEN / NOT_SIGNED | Human/operator identity, durable credential provision, recovery route, multi-Worker ACID remain |
| PA05-05 E01–E05 | NOT_SIGNED | Real Human/Agent/Provider/browser/Enterprise Context acceptance |
| PA-05/W06 | IN_PROGRESS / NOT_SIGNED | #988/#979/#913 OPEN |
| Production material WRITE | OFF | No deployment |

## Direct original code and decisions retained

- [E01J4C merged decision and exact-head 21/21](PA05-E01J4C-HOST-LIFECYCLE-COMPOSITION-20261019.md) is the Host-internal `DISABLE/UNINSTALL` implementation. E01J1–J4B previous evidence, tests, and original PostgreSQL source-grade index are retained unchanged.
- Direct `manager/server.ts` original inspection 2026-10-19: E01D actual `POST /v1/admin/pa05/read-plugin/admit` uses existing bootstrap administrator plus dynamic AuthorizationProvider before delayed registration; E01F/G/H require authorization against live AppManager impact for *both* `/v1/disable`, `/v1/uninstall` and `/v1/actions` lifecycle commands. Previously those four paths invoked general WRITE Host lifecycle, not the E01J4C READ SQL fence.
- [E01I startup restored-state quarantine](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md) remains unchanged: the already persisted uncertified owner must not auto-resume on server startup.
- [Extension Boundary Constitution](../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) keeps generic Host security/lifecycle in Core, business Handler in its plugin and actual identity/credential provider out of this slice. Official PG18 references were graded and read in the [historical reference index](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md), not newly claimed as read.

## Selected smallest real Host integration

Existing `/v1/disable`, `/v1/uninstall` and corresponding original Action commands call the **same** `applyPa05ReadLifecycleMutation` function. For unrelated packages or default `APP_PLATFORM_PA05_E01J4D_READ_LIFECYCLE=OFF`, existing behavior stays unchanged, and no eager business module or database connection is added to startup.

Only when `APP_PLATFORM_PA05_E01J4D_READ_LIFECYCLE=OPT_IN` **and** the protected Package is exactly `evo-purchase-attention`, the route uses the existing E01F live administrator/Provider checks, dynamically loads J4C and a narrowly scoped central PostgreSQL authority, and generates an operation ID on the trusted Host (not from request input). It requires independently configured `APP_PLATFORM_PA05_E01J4D_DATABASE_URL`, `APP_PLATFORM_PA05_E01J4D_SCHEMA`, `APP_PLATFORM_PA05_E01J4D_HOST_ID`, all of which are **unset** here. Missing config fails closed. An actual restricted LOGIN role maps `session_user` to a pre-provisioned trusted lifecycle operator. This operator differs from ordinary READ Worker roles. The database must be pre-provisioned with the dedicated operator mapping, central Owner epoch, per-Host approval and durable operation intent tables. The Host's PostgreSQL transaction inserts the intent and cuts its approval under a row lock, then original AppManager performs the local mutation, and another SQL transaction completes the durable intent. Unexpected SQL/outage/permission denial cannot fall back to direct AppManager mutation. Startup and E01D registration remain unchanged.

**Test:** a real disposable Node `dist/manager/server.js` is spawned with a throwaway bootstrap token, actual Host authorization policy, and real PostgreSQL18 isolated provisioned schema with distinct LOGIN operator and Worker roles. E01D opt-in admission + original install precede authorized real HTTP DISABLE and existing Action UNINSTALL. Test inspects central PostgreSQL committed approvals/intents and actual AppManager state, rejects unauthenticated calls and client-supplied operation identifiers, confirms Worker SQL role cannot mutate approval, and confirms opt-in with no DB credentials fails closed for both HTTP and Action, without altering local ACTIVE state. New `PA05_E01J4D_ACTUAL_HTTP_LIFECYCLE_PG` plus all 21 inherited cases must produce **22/22 physical PG18 PASS, 0 skipped**.

## Explicitly NOT proven

No real production administrator token/provider identity or credential provisioning; no end-to-end production tenant/Enterprise/Agent/Provider/browser acceptance; no actual production Host read execution gate; no recovery HTTP route or automatic repair daemon; no SQL schema migration in actual deployments; no distributed ACID JSON+PG transaction; no convergence of Worker install/upgrade/disable/rollback; no packet-blackhole or stable original Node process recovery from the still-open upstream postgres.js crash. The test operator role receives narrowly scoped table rights but is **not independently certified as PKI/mTLS workload attestation**, and future production privilege review must constrain raw central table mutation. No Railway or production WRITE enablement.

## Verification log

**First primary PG18 proof:** engineering HEAD `d18f3402bae80432b433e05e388903a69f37581c`, [real PG18 CI #39214959937](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39214959937), original job `117936544924` **22/22 PASS, 0 failed/skipped**. Real Host HTTP+Action and central DBA inspected. **Concurrent separate WRITE CI FAILED:** [#39214960038](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39214960038), job 117936545290, test `pa05-host-write-lifecycle.test.mjs` expected two original Action branches but one branch had been missed by the first J4D routing change. This failure revealed a security-relevant duplicate Action path, not a failed SQL gate. Same PR now rewires BOTH duplicate Action disable/uninstall handlers and direct HTTP (six call sites total), updates source-gate assertions to require all six routing calls and zero direct legacy calls. No security test dropped or relaxed.

**Still in progress:** final exact-head 22/22 PG18, governed WRITE, READ, Platform, Lightweight, Continuity, Human UI and full server-affected CI after latest-main reconciliation. DO NOT merge or sign before all required checks. No actual production credential or deployment authorization.
