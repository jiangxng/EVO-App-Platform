# CV-03 / N1-05c-03 — Original EVO database QA SQL Producer read-only privilege audit

> **STATE: CODE SUBMITTED / PHYSICAL TOKYO EVIDENCE PENDING.** 2026-11-11. This is a QA threat-model audit, not production N1 approval.

## Verified G / why this audit follows the real Tokyo QA proof

- [Physical N1-05c-01 Actions #43034999556](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43034999556) on `main@b9a5897d39ba4f8063c3bbd31a16df5f3cb2318c` created a password-backed, restricted SQL QA Producer and passed real SCRAM TCP, bad-password denial, prior Producer revocation, frozen/replay T0, no duplicate Outbox, direct DML/role spoofing denial, original `evo_dev` schema untouched.
- Crucial exact runtime finding: `CV03_N105C_QA_ORIGINAL_DB_CONNECT_VIA_CLUSTER_ACL=true`. The same QA login retains `CONNECT` to `evo_dev` despite functioning only as a QA T0 Producer; this is **not** sufficient evidence of business data read/write access, and is **not** an isolation PASS.
- Source actually read 2026-11-11: official [PostgreSQL 17 §5.8 privileges](https://www.postgresql.org/docs/17/ddl-priv.html) explains the normal default `PUBLIC CONNECT` and `TEMPORARY` database privileges, and that `CONNECT` is checked on connection startup along with `pg_hba.conf`. Official [PostgreSQL 17 REVOKE](https://www.postgresql.org/docs/17/sql-revoke.html) states a role's effective privilege aggregates direct, role-membership and `PUBLIC` grants; revoking an individual grant does not override a continuing `PUBLIC` grant. These are **source facts**, not a claim about which actual Tokyo ACL entry is responsible until the audit runs.

## Implemented D / bounded source of truth and acceptance

[Protected-main Tokyo audit workflow](../../../.github/workflows/cv03-n105c-tokyo-original-db-acl-readonly.yml):
1. PR-time locally checks the syntax of embedded Bash blocks without any credential or Tokyo access. On protected main, compares the SHA to the live main ref, verifies the known Tokyo SSH key, PG17.11 and the existing QA Producer identity.
2. Uses the QA Producer's already private password only inside the Tokyo SSH/Compose environment to establish a **real authenticated read-only TCP session to `evo_dev`** and reject a wrong password. Logs role/database identity only, never passwords, data rows, connection strings or business table names. Sets PostgreSQL `default_transaction_read_only=on`.
3. Via only read-only catalog SQL, records effective database `CONNECT/CREATE/TEMPORARY`, actual `PUBLIC CONNECT` grant attribution using `aclexplode` plus default ACLs, aggregated user relation `SELECT`/write grants, schema `CREATE` grants and callable non-system `SECURITY DEFINER` routines. Names and values remain private.
4. Treats any direct business object read/write, schema CREATE or SECURITY DEFINER EXECUTE grant as a **RED security finding** without executing the privileged operation. Even when all object counts are zero and the job is green, original DB `CONNECT` stays explicitly **OPEN**, not certified.
5. Verifies no QA schema appears inside `evo_dev`, preserves all original and QA SQL data/state, and enforces remote completion markers. No `ALTER ROLE`, no HBA edits, no `GRANT/REVOKE`, no Schema/DDL/DML, no PostgreSQL restart or SAVE changes.

## Engineering D / why not perform a direct `REVOKE` on the original database

Do not run `REVOKE CONNECT ON DATABASE evo_dev FROM PUBLIC` just to make a QA check green. That database hosts the existing EVO preview application; its full current/future application role inventory, GRANT coverage, open connection behavior and safe rollback have not yet been independently accepted. PostgreSQL `REVOKE CONNECT ... FROM <one QA role>` is not an effective negative permission override while `PUBLIC CONNECT` remains. Options for later design comparison are a narrowly scoped, first-match `pg_hba.conf` deny for this specific QA role and original DB, or a planned least-privilege migration of business DB grants with exact role inventory/rollback. Either needs separate reviewed implementation and physical positive/negative app connection checks; **neither is authorized in this audit**.

## P / still unresolved

- The observed physical ACL source and object privilege counts until the original Tokyo audit runs. An HBA reject rule, if selected later, would be host/network authentication fencing rather than fully independent production workload identity.
- Canonical PA05/AuthorizationProvider persistent authority and full scope generation, real signed Host workload identity/KMS and rotation, true multi-Host network partition/crash replay, offsite/PITR backup and independent named DB/Security/PA05 Owners.
- The QA credential currently has `VALID UNTIL 2026-12-01` in the tested workflow, not an evergreen production identity.

**Hard release invariants:** `N1=NOT_CERTIFIED`; `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`; formal SAVE POST 403; unregistered GET 404. [Owner Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) stays OPEN. Do not change PR #1184 Owner-controlled documents or the original `evo_dev` business schema/data.
