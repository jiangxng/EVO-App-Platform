# PA05-05/E01J4C — Host-only, revoke-first READ Owner lifecycle composition

**2026-10-19 · ENGINEERING_CANDIDATE, awaiting exact-head CI · E01J4 full lifecycle NOT_SIGNED**

## Fixed milestone progress

| Milestone | Source-backed status | E01J4C scope |
| --- | --- | --- |
| E01A–J1 | Previous bounded research and engineering completed | Do not repeat |
| E01J2 | BOUNDED_PASS 17/17 | Authenticated SQL Host READ plus original business Handler |
| E01J3 | BOUNDED_PASS 18/18 | TCP fault + recorded postgres.js process-crash P0 remains |
| E01J4A | BOUNDED_PASS 19/19 | Distinct persisted AppManagers, per-Host reattestation |
| E01J4B | BOUNDED_PASS 20/20, [#1031](https://github.com/jiangxng/EVO-App-Platform/pull/1031) | SQL-first intent, 3 Worker crashes, idempotent repair |
| **E01J4C** | **IN_PROGRESS / NOT_SIGNED** | Bounded reusable Host-internal DISABLE/UNINSTALL adapter, trusted callback + central SQL first, original AppManager, retry after local failure, 21/21 actual PG18 zero skip |
| Full E01J4 production Host lifecycle | **OPEN / NOT_SIGNED** | Real configured operator/secret trust, production SQL schema provision and Host route/rollback |
| PA05-05 E01–E05 | NOT_SIGNED | Actual Human/Agent/Provider/browser/enterprise evidence |
| PA-05/W06 | IN_PROGRESS / NOT_SIGNED | #988, #979, #913 OPEN |
| Production material WRITE | OFF | No Railway or material deployment |

## Reused existing code and sources, no repeated research

- [E01J4B accepted final original-source ledger](PA05-E01J4B-CRASH-LIFECYCLE-REPAIR-20261019.md), [baseline §57](PA05-CERTIFICATION-BASELINE-20261015.md): real PostgreSQL18, SQL-first central cut and pending intent, file-backed AppManager replay, last 20/20 PASS, 0 skipped. Proof is an *isolated mechanism*, not a production installation.
- [E01D real Host admin admission](PA05-E01D-ADMIN-HOST-READ-ADMISSION-20261016.md) and direct `manager/server.ts`: configured bootstrap admin + independent live AuthorizationProvider gate controls optional, deferred READ plugin *registration*, not installation. Do not add another public endpoint, Agent registry or automatically activate it.
- [E01I real Host startup quarantine](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md): refuses local persisted Purchase Attention on production server startup; do not relax while real reattestation credentials/operator route remain unavailable.
- Direct source read 2026-10-19: `manager/service.ts` AppManager `planDisable/planUninstall/disable/uninstall`; `manager/store.ts` file LifecycleStore; `manager/on-demand-host-read-admission.ts`; `manager/agent-plugin-write-host-lifecycle.ts` existing WRITE Host composition precedent; `manager/pa05-read-owner-authenticated-host.ts` original SQL role-bound READ gate; `tests/agent-line/pa05-e01j2-authenticated-read-handler-pg.test.mjs`.
- [Platform Extension Boundary Constitution](../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md): generic Host lifecycle is **Core**; real remote credentials/CA/operator are Provider/Host-owned and cannot be supplied by an arbitrary plugin or HTTP command. Historic official PostgreSQL original-source grading unchanged at [reference index](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md); do not mislabel as reread.

## Adopted narrow implementation

Add `manager/pa05-read-owner-host-lifecycle.ts` as an **internal opt-in composition adapter**, not imported by default `manager/server.ts`. The Host pins `evo-purchase-attention`, injects its existing trusted asynchronous operator/Provider authorization and a **separate privileged PostgreSQL central lifecycle authority** owned by an operator (not an ordinary READ SQL Worker). The adapter provides only `apply(DISABLE|UNINSTALL,operationId)` and `recover(DISABLE|UNINSTALL,operationId)`.

Every call requires a current Host operator authorization and an exact operation identifier. New transitions reject absent packages, existing AppManager blockers, concurrent Host-local operations and incomplete central cut. The authority must atomically persist a durable intent and revoke Host SQL approval *before* invoking original AppManager mutation. If local file write or completion fails, do not roll back central protection or quietly permit READ. Recovered instances must verify the original central fenced operation before idempotently completing the appropriate local mutation. Both successful and failed cases prevent automatic SQL reattestation. Ordinary Agent/Worker requests cannot supply an arbitrary Host ID or central lifecycle database credential.

Concrete PG18 regression reloads the **original file-backed AppManager**, simulates denied administrator, unreachable central authority before local mutation, a failure after local disable but before central completion, recovery from a fresh original AppManager instance, duplicate repair, original uninstall, reloaded missing package, unapproved reinstallation, worker role unable to complete a central intent, and READ fail-closed via original SQL gate. Target: **21/21 actual three-PostgreSQL18 tests, 0 fail, 0 skipped**, all inherited READ/WRITE/Lightweight/Continuity/Design checks.

## Explicitly rejected / still NOT signed

No default Host import, automatic installation, new public E01D admin endpoint, fabricated operator credential, broad modification of manager/server or Agent command parser, new SQL privilege for ordinary READ Worker, deletion of E01I quarantine, WRITE enablement, Railway deploy or unrelated BEX/CP03/Eidos/2D/global authority update.

The adapter takes a trusted Host-supplied authority interface; that alone is **not credential verification, CA/mTLS workload identity, production operator consent, or a shipped central SQL provider**. Production provisioning and actual running Host route remain OPEN. No transaction can make JSON file persistence and PostgreSQL a globally atomic ACID commit. Recoverability of READ permission is bounded by central fail-closed admission; arbitrary local effects or postgres.js fatal TCP crash stability are not proved. A successful 21/21 proves a reusable Host composition contract only. Full E01J4, E01–E05 and W06 remain NOT_SIGNED.

## CI/merge record

**Initial:** engineering candidate; do not claim PASS until raw exact-head PG18 log, CI statuses, merged SHA and source branch retirement are verified. One activity/one PR. Keep this table updated on final delivery.
