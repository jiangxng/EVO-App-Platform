# PA05-05/E01J4E — least-privileged authenticated PostgreSQL lifecycle operator

**Date:** 2026-10-19. **Class:** DECISION_RECORD / initial engineering candidate. Full E01J4, PA05-05 E01–E05 and W06 NOT_SIGNED. Production material WRITE OFF.

## Fixed milestones

| Milestone | Status | Evidence or remaining limit |
| --- | --- | --- |
| E01A–J1 | Prior bounded milestones completed | No repeated research |
| E01J2 | BOUNDED_PASS 17/17 | Per-Host SQL READ identity and actual Handler |
| E01J3 | BOUNDED_PASS 18/18 | TCP cut; postgres 3.4.9 crash P0 remains |
| E01J4A | BOUNDED_PASS 19/19 | Distinct persisted Workers/re-attestation |
| E01J4B | BOUNDED_PASS 20/20 | Three OS crashes and SQL-first durable repair |
| E01J4C | BOUNDED_PASS 21/21 | Default-off Host lifecycle adapter |
| E01J4D | BOUNDED_PASS 22/22, [#1040](https://github.com/jiangxng/EVO-App-Platform/pull/1040) | Existing live Host HTTP+Action pathways, dedicated SQL LOGIN |
| **E01J4E** | **CANDIDATE / CI pending** | Eliminate direct privileged-table DML from actual Host SQL operator, DBA-owned function with session_user and Host scoping; target 23/23 physical PG18 |
| Full E01J4 | **OPEN / NOT_SIGNED** | Real production credentials, provisioned schema, recovery and cross-store consistency |
| PA05-05 E01–E05 | **NOT_SIGNED** | Original environment/provider/browser checks |
| PA-05/W06 | **IN_PROGRESS / NOT_SIGNED** | #988 / #979 / #913 OPEN |
| Production material WRITE | **OFF** | No Railway deployment |

## Why this precise gap, sources and authority

Existing [E01J4D](PA05-E01J4D-ACTUAL-HOST-ROUTE-20261019.md) proved a live original Host, HTTP and Action routing under actual PostgreSQL session_user. However the original operator was granted **direct SELECT on all central tables plus INSERT/UPDATE on intents and UPDATE on approval**. This was explicitly listed as an unclosed privilege review. Possession of that role's credential would allow arbitrary direct approval mutation despite the Host's trusted operation-ID interface; it did not yet meet the least-privilege goal.

Direct repository code read 2026-10-19: `manager/pa05-read-owner-lifecycle-pg.ts`, `manager/server.ts`, `tests/agent-line/pa05-e01j4d-actual-host-http-pg.test.mjs`, and existing three-PostgreSQL18 CI. Reuse E01D/E01F administrator/Provider checks and E01I startup quarantine unchanged. Official PostgreSQL18 privileges, SECURITY DEFINER fixed search path, `session_user`, and row lock semantics are historic original-source research already graded in [E01J reference index](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md); do **not** misrepresent those original pages as freshly reread. No new web research was necessary for this specific source-code privilege gap. [Development Delivery Workflow](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) and [Extension Boundary Constitution](../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) preserve lightweight Host and existing Plugin ownership.

## Bounded design

The **existing actual Host SQL authority** now submits one authenticated command per call to `pa05_read_lifecycle_operator_transition(phase,operationId,operation,hostId)`, replacing direct SELECT/UPDATE/INSERT on central tables. DBA preprovisions the function as `SECURITY DEFINER` with `SET search_path=pg_catalog,pg_temp`, every authority table fully schema-qualified, role mapped against PostgreSQL `session_user`, exact pinned Host ID, exact owner package, valid DISABLE/UNINSTALL and exact intent operation types. A `FENCE` transition reads owner epoch, locks current Host approval `FOR UPDATE`, and atomically records durable intent and sets approved_epoch=0; ASSERT/COMPLETE verify same Host/operation and approval still fenced. No transaction coordinates JSON and SQL; the original J4C adapter mutates the original AppManager **only after successful SQL function commit**. The Host cannot create the function or grant permissions. DBA revokes PostgreSQL's default PUBLIC EXECUTE, granting to only the dedicated Host lifecycle LOGIN role; it gets schema USAGE + function EXECUTE and **zero central-table SELECT/INSERT/UPDATE/DELETE grants**. Ordinary READ Worker gets no execute. The test-only DBA DDL sample lives in `tests/agent-line/fixtures/pa05-e01j4e-operator-function.sql`; it is not a production migration or an executable startup hook.

Existing HTTP/Action entrypoints and current E01D/E01F authorization rules are unchanged. In opt-in environments previously provisioned with old broad grants but missing the new function, the lifecycle **fails closed**, not silently falls back to raw table writes. Default J4D mode remains OFF with no eager PG import and no Railway/prod secrets.

## Verified only after fresh real CI

The unchanged live Host test now provisions the DBA function, grants only EXECUTE and exercises original HTTP DISABLE/Action UNINSTALL. An additional nested real PG18 test denies Host direct SELECT/UPDATE/intent insertion, denies Worker EXECUTE, denies forged Host ID via app_name/GUC, and rejects mismatched operation replay. Existing 22 PG tests remain; new expected strict total **23/23, 0 failed, 0 skipped**; CI requires the new `PA05_E01J4E_LEAST_PRIVILEGE_FUNCTION_PG` marker and the original J4D marker. All formerly accepted security/WRITE/READ/Host CI regressions retained. Negative CI attempts and fixes must be recorded without changing inherited assertions or marking skipped PASS.

**Not signed:** production DBA/secret issuance, deployed schema/CA/mTLS, malicious party possessing the actual lifecycle SQL login secret (it can still cause a restrictive FENCE for its own Host), full operation approval audit/attribution, automatic Host repair and crash supervision, cross-store ACID, packet-blackhole resilience, postgres.js 3.4.9 fatal socket-null, tenant Provider/Human/browser acceptance, real business READ route after external revocation, PA05-05 E01–E05 and W06. No production WRITE, Railway or other-line/global-status updates.
