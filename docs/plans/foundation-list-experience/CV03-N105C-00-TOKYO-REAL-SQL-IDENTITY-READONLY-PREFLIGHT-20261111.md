# CV-03 / N1-05c-00 — Real Tokyo PostgreSQL SQL identity / TCP rule read-only preflight

> 2026-11-11. **STATUS: SOURCE READY / PHYSICAL ACTIONS PENDING UNTIL MAIN MERGE.** Owner issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) remains OPEN. Does NOT authorize SQL Producer provisioning.

## Retained decision and verified facts
- **D:** User-selected option A: one PostgreSQL T0 commit for authoritative Saved View generation/epoch and immutable Outbox; use existing Eidos, Platform, PA05, AuthorizationProvider and Domain Owner. No new framework; keep SAVE OFF and 403/404.
- **G:** Existing Tokyo PostgreSQL 17.11 `evo_dev` uses superuser `evo`. [#43018562251](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43018562251) physically verified a distinct `cv03_n105b_qa` DB, real T0/outbox functions and a QA-only local-socket Producer role with `PASSWORD NULL`. [#43020836019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43020836019) tested full **same-host logical backup restore**, not offsite/PITR.
- **G / original PostgreSQL 17 pages opened in this window on 2026-11-11:** [pg_hba_file_rules §52.9](https://www.postgresql.org/docs/17/view-pg-hba-file-rules.html) confirms the view describes current HBA file rules and may differ from what the server last loaded. [pg_hba.conf §20.1](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html) describes client authentication first-match rules, socket `local` vs TCP `host`, and `trust` vs `scram-sha-256`. **Reading these pages is not evidence of Tokyo runtime settings.**

## New bounded executable QA evidence collection
[Workflow `cv03-n105c-tokyo-auth-acl-readonly.yml`](../../../.github/workflows/cv03-n105c-tokyo-auth-acl-readonly.yml) is protected-main-only and pinned to existing `evo-tokyo-dev` GitHub Environment SSH. It uses read-only catalog SQL and a wrong-password **negative** TCP authentication attempt against the existing `PASSWORD NULL` QA Producer. It verifies:
1. Existing PostgreSQL 17, QA DB and original database; target future TCP Producer role **not** already provisioned.
2. Both QA DENY T0 functions exist as SECURITY DEFINER; authorized local Producer EXECUTE but no direct authority/outbox UPDATE; untrusted role EXECUTE refused.
3. Actual QA local `rolpassword IS NULL` status, plus HBA config-file trust rule counts, parsing errors and password_encryption setting; never emits hashes, host CIDRs, connection strings or secrets.
4. A real `127.0.0.1` TCP attempt using a deliberately invalid password **must fail**. This shows a negative case for existing role, not successful authenticated TCP identity.
5. Existing QA Producer's CONNECT privilege to `evo_dev` is recorded as a separate PENDING cross-database boundary; no REVOKE on original business DB. The original DB schema is checked unchanged.

**No CREATE ROLE/DB/SCHEMA, no DDL/DML/GRANT/REVOKE, no password created, no container restart, no secret values or archived data in logs.** If identity configurations differ or actual TCP incorrectly accepts the invalid password the job must fail closed.

## Follow-on engineering and outstanding Owner gates
The distinct [N1-05c-01 Draft PR](https://github.com/jiangxng/EVO-App-Platform/pull/1227) proposes a password-backed SCRAM QA Producer and source binding. It is **NOT READY**: static review found a SQL function ACL assertion connected to `postgres` instead of the QA database, and an old-role shell SQL denial requires scrutiny. Two GitHub connector attempts to correct it were blocked by an execution safety check. It must not be merged/executed without correcting the source and confirming exact-HEAD tests. This read-only survey provides real evidence without bypassing that gate.

Even a successful TCP QA proof would not be signed Host workload identity, KMS/rotation, formally migrated PA05/AuthorizationProvider source-of-truth, offsite backup, two-Host recovery or independent Owner approvals. No production release certification or Host Saved View admission.

**Hard gates:** `N1=NOT_CERTIFIED`; `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`; SAVE POST 403; unregistered GET 404. Do not edit PR #1184 Owner-managed docs or `project.status.json`.

## Postmerge Tokyo security failure — original runtime G / 2026-11-11

[Workflow #43023951994](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43023951994) on exact `main@83e1a7da229c808fa1d8c00a085f938d04485da7` completed **FAILURE**. The original job emitted `CV03_N105C_QA_UNAUTHENTICATED_TCP_ACCEPTED` after a real `127.0.0.1` TCP connection as `cv03_n105b_qa_producer` with its PASSWORD NULL and an intentionally **incorrect** supplied PGPASSWORD was accepted. This is observed authentication failure-closed evidence, **not** evidence of correct password enforcement. Due to SSH stdout capture, intermediate HBA counters and catalog observations were not printed on that failing run. Do not guess the matching HBA rule from this one finding.

**D / targeted diagnostic correction:** the workflow now prints only non-secret HBA file trust-rule counts / parse-error count and whether the original SQL superuser has any stored password hash; it also tries a deliberately incorrect TCP password against `evo` using `SELECT 1` only and reports pass/fail without disclosing data or passwords. The job must remain **RED** when the initial QA wrong-password bypass is reproduced. Neither observation changes `pg_hba.conf`, `evo_dev`, SQL grants or any application runtime. Follow-up HBA remediation needs a verified compatibility/rollback path because it could affect existing app connections. HBA file view may not match the currently loaded server policy (official PostgreSQL 17 §52.9); direct connection test is the independent active-path observation.

**P / execution safety:** [#1227](https://github.com/jiangxng/EVO-App-Platform/pull/1227) remains Draft and must not run its password-backed Producer migration while this authentication gap persists. N1=NOT_CERTIFIED, SAVE OFF, formal SAVE 403, unregistered GET 404.
