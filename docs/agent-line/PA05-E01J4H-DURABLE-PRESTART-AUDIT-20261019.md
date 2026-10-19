# PA05-05/E01J4H — 受限启动前恢复的持久审计（2026-10-19）

**Document class: DECISION_RECORD / engineering evidence, bounded non-production.** Original source at main `9a3edf8dd1c6b98b304cd55ea4f4442c60223068`. Previous J2–G accepted decisions and original PostgreSQL research unchanged. Engineering PR: [#1055](https://github.com/jiangxng/EVO-App-Platform/pull/1055). Until final accurate-head tests this is an implementation candidate, **not E01J4 production signoff**.

## 1. Why this is the next narrow gate

The actual [J4G trust composition](../../manager/pa05-read-owner-trusted-prestartup.ts) calls the Host-provided `audit({stage:"AUTHORIZED"| "COMPLETED",...})` before opening PostgreSQL credentials and after the fenced local UNINSTALL. Its prior PostgreSQL fixture supplied an in-memory array only; losing the operator process loses that evidence. The original J4F OS SIGKILL replay ensures DB intent survives and original E01I quarantines restored owners, but did **not** make the off-process HUMAN authorization audit durable. No new IdP/DBA/Secrets supplier may be inferred from a test-only bearer/role.

## 2. Code and isolated evidence

- New Host-internal `manager/pa05-read-owner-prestartup-audit.ts`: explicit bounded event schema containing only stage, principal/session IDs, pinned Host, action and package, event UUID/timestamp; refuses arbitrary/free-form fields or SQL URL-like ID strings. No bearer/SQL URL/secret values are accepted, retained, or returned.
- Append-only local JSONL evidence within the trusted operating-system boundary: create/check parent as user-owned 0700 directory, reject symbolic link via `O_NOFOLLOW`, require user-owned regular file with one link and no group/other permissions (0600), `O_APPEND` single write + file `fsync` + directory entry `fsync`. An unavailable/unsafe audit sink fails closed. This is **not cryptographic tamper-proof append-only storage**, a DBA source of truth, nor a distributed audit across Host nodes; OS-privileged actors can still alter it. Journal location supplied by the trusted maintenance caller, not by an Agent or request.
- New physical child OS `SIGKILL` scenario in `tests/agent-line/pa05-e01j4h-durable-audit-pg.test.mjs`: authorized event persisted before kill; no invented COMPLETE, second process context can append actual COMPLETE; wrong Host, URI-like IDs, symlink, permissive file and directory denied.
- Genuine PostgreSQL18 test `tests/agent-line/pa05-e01j4f-prestartup-recovery-pg.test.mjs` now uses the journal for a J4G operator-authorized SQL-fenced recovery; validates durable AUTHORIZED/COMPLETED, no SQL URL or bearer values in evidence, central approval remains revoked.
- Existing three-PG18 workflow `.github/workflows/agent-pa05-cross-database-admission.yml` requires **26/26 PASS, 0 skipped**, legacy J2–G markers + new `PA05_E01J4H_DURABLE_AUDIT` mandatory. No previous PostgreSQL source re-search or duplicate J2–G implementation.

## 3. Prior confirmed failure must remain visible

Post-merge J4G `main@9a3edf8d` [Actions #39271124305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39271124305) actual E01J2 physical PostgreSQL18 test crashed with `postgres.js 3.4.9` `connection.js:255` `Cannot read properties of null (reading 'write')`. Reporter only counted **21 tests, 20 passed, 1 failed, 0 skipped** due crash; the main-post-merge cross-database workflow is **FAILURE**, notwithstanding prior PR final HEAD [#39270689657](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39270689657) 25/25, 0 skipped, 8/8 checks SUCCESS. Do not relabel this race as fixed; stay separate from J4H audit changes.

## 4. Explicit certification exclusions

- Real production operator identity/approved Human, provisioned OIDC and revocation, scoped DBA role migration/credential PKI + rotation, production-readiness of the Host Secrets Provider, independent maintenance executable/runbook, durable signed and tamper-evident cross-Host audit **all NOT_SIGNED**.
- Local JSON and central PostgreSQL are not ACID together; cross Worker global installation consistency and `postgres.js 3.4.9` TCP crash/packet blackhole are unchanged; PA05-05 E01–E05 and PA-05/W06 remain NOT_SIGNED; Issues #988/#979/#913 remain OPEN; production material WRITE OFF.
- Branch PR changes scoped to J4H internal audit, two PA05 test files, PA05 workflow and Agent line docs. No Railway manual deployment, prod secret/DB admin, BEX/CP03/Eidos/2D, `project.status.json` or generated global HANDOFF.

## 5. Decision and next gate

Reuse existing J4G Provider admission and J4F SQL intent. Do not implement a CLI that accepts local env `AUTHORIZED=true` or unverified bearer-to-principal mapping. When real trusted production IdP/DBA credential issuer and audit retention policy are provisioned, install a narrowly scoped one-shot operator entry and prove the actual authorized invocation and revocation (including recovering from a compromised/stale Human session), before E01J4 or W06 signoff. Local journal success alone does not establish those external trust decisions.

**Evidence grading:** repository source and CI logs described above directly read 2026-10-19; no new upstream database document was consulted. Subsequent PR CI result, final PR head and main deployment must be verified independently before changing this record's implementation status.
