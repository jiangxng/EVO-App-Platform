# PA05-05/E01J2 — authenticated SQL Host READ admission and genuine Purchase Attention Handler

**Date:** 2026-10-19. **Class:** DECISION_RECORD / engineering candidate.
**Status until exact-head CI:** CANDIDATE / NOT_SIGNED.
**Boundary:** PA-05/W06 IN_PROGRESS / NOT_SIGNED; #988, #979, #913 OPEN; production material WRITE OFF. No Railway, BEX, CP03, Eidos, 2D or global-status changes.

## Source and prior work (no repeated research)

- [E01J1 decision and original three-PG18 evidence](PA05-E01J-SHARED-READ-OWNER-EPOCH-PG-20261016.md), [#997](https://github.com/jiangxng/EVO-App-Platform/pull/997): central Owner row locking with two independent OS Host processes, 15/15 PASS, no SQL-role separation or Handler linkage.
- [2026-10-19 short handoff](PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md) and [graded original-source ledger](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md): preserved prior official PostgreSQL18 research. This change did not reread those external pages; it uses repository code and PostgreSQL18 CI, pending current exact-head results.
- Original code inspected on current main: `manager/pa05-read-owner-shared-sql-gate.ts`, `apps/purchase-attention/host-optin.ts`, `apps/purchase-attention/operation.ts`, `apps/trading-reference/operational-actions.ts`, `tests/agent-line/pa05-e01b-host-optin.test.mjs` and `tests/agent-line/pa05-e01j-shared-read-owner-pg.test.mjs`.
- [PG18 privileges](https://www.postgresql.org/docs/18/ddl-priv.html), [CREATE FUNCTION security-definer guidance](https://www.postgresql.org/docs/18/sql-createfunction.html), [server session identity](https://www.postgresql.org/docs/18/functions-info.html), [row-lock consistency](https://www.postgresql.org/docs/18/applevel-consistency.html): HISTORIC OFFICIAL-ORIGINAL 2026-10-16, not re-read 2026-10-19 (details and visit grades retained in previous index).

## Narrow adopted engineering design

1. Preserve E01J1 and its legacy test markers unmodified. Add a separate `createPa05AuthenticatedReadHostV010` Host gate (not imported by production `manager/server.ts`), with **no constructor DDL, recertification, revocation or user-supplied hostId**. The Host's PostgreSQL connection authenticates as an individual SQL LOGIN role and uses one transaction per READ callback.
2. Disposable PG18 DBA creates two distinct LOGIN/NOINHERIT/NOSUPERUSER/NOCREATEROLE Host roles, a separate ordinary Worker role, protected `pa05_read_host_principals` bindings, and a DBA-owned `SECURITY DEFINER` function with fully qualified table references and fixed `search_path`. The function checks `session_user` against the server-owned mapping and actual pinned Host inventory, locks the trusted mapping and current central Owner epoch using `FOR SHARE`, and rejects absent, FROZEN or mismatched epoch. Only Host roles get schema USAGE and function EXECUTE. No Host/Worker direct UPDATE/INSERT/CREATE grant to central authority.
3. Execute the **actual Purchase Attention READ Action Handler and existing Trading Reference source Action Handler** via the original AppManager and Action Router within the read-lock callback. Two **forked Node Host processes** use different database LOGIN roles; no simulated shared JS instance. The source Ledger projection Reader, enterprise Principal and Authorization Provider are deliberately deterministic disposable fixtures, **not live EVO data, live Human/Agent authentication or provider signoff**.
4. A DBA revoke waits for held source read; both old epochs deny subsequent READ. A live old SQL Host backend loses EXECUTE after DBA REVOKE. Termination of the authenticated central PG backend while the original business Handler is paused denies external READ result; after recovery fresh READ rechecks the epoch. Original AppManager disabled Feature still blocks actual Action Router execution.
5. A request-body `hostId`, client `application_name`, custom GUC or `SET ROLE` cannot substitute for `session_user`; ordinary Worker can neither execute the protected function nor change the epoch/inventory. The Host returns a business result only after the enclosing SQL transaction commits.

## Rejected alternatives and limits

Rejected: client-declared Host ID or GUC identity; copying E01J1's privileged constructor into every Worker; granting SELECT/UPDATE on authority tables to application roles; `SET ROLE` as authenticated identity; using the original Object Extension WRITE Owner proof as READ evidence; unconditional production Host startup import; pretending that an SQL lock makes AppManager's JSON state transactional.

**Explicitly not certified:** production credential custody, mTLS/PKI or hardware workload attestation; unauthorized possession of genuine Host SQL secrets; actual production Host route; live enterprise/EVO source READ; real Human + Agent credentials, Provider/model/browser; real central **network** partition during an in-flight READ (forced backend termination is only an isolated failure mode); unbounded asynchronous data leakage outside the callback; physically atomic AppManager install/activate/uninstall across local JSON and PostgreSQL; PA05-05 E01–E05 or W06 signature. No production material WRITE or Railway deployment.

## Verification record (pending accurate-HEAD CI)

- New file: `manager/pa05-read-owner-authenticated-host.ts`.
- Original, opt-in business route in the child fixture: `tests/agent-line/fixtures/pa05-e01j2-host-worker.mjs`.
- Physical PG18 test: `tests/agent-line/pa05-e01j2-authenticated-read-handler-pg.test.mjs`.
- Existing three-PG18 workflow now asserts `PA05_E01J2_AUTHENTICATED_HANDLER_PG`, zero skipped and all previous E01J1/D14C13 markers.
- Until accurate final PR HEAD evidence is available, do **not** write PASS; record run ID, number of physical PG18 clusters, actual case count, raw markers, failures/fixes, merge SHA and post-merge branch disposition here.

## Remaining follow-on gate

An authenticated opt-in Host READ proof still has to become a *real deployed/installed* lifecycle-integrated, tenant-scoped Host route without weakening the lightweight startup ratchet or duplicating Plugin Protocol registration. Separate central/AppManager two-store lifecycle authority must address freeze/revoke before effects, durable recovery and cross-Worker restoration; transactionally fencing a single callback is insufficient. Then separately close the real environmental PA05-05 E01–E05 and W06 evidence gates.
