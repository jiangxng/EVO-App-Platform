# CV-03 / N1-05c-04 — Tokyo original DB extended QA role ACL read-only proof

> **STATE: SOURCE PR; PHYSICAL TOKYO PROOF PENDING.** This is a supplementary catalogue audit, NOT a production release or a change to SQL/HBA/business privileges.

## G / exact inherited baseline (2026-11-11)
- Baseline protected main: `f6e7e4ecaf603818354bdc0b0ae6f1d09aa39817`; [#1236](https://github.com/jiangxng/EVO-App-Platform/pull/1236) and [#1237](https://github.com/jiangxng/EVO-App-Platform/pull/1237) merged.
- [Tokyo physical Actions #43036843959](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43036843959) established the QA TCP Producer can CONNECT to original `evo_dev` via SCRAM; original `PUBLIC CONNECT=true`, TEMP=true, CREATE=false, tested relation SELECT/write ACL counts 0/0, schema CREATE 0, callable non-system SECURITY DEFINER 0. These do not prove full object/column isolation.
- The actual QA database SQL T0, private backup restore and credential proofs were previously validated; this PR does not repeat them.

## D / bounded work
- [New source and protected-main workflow](../../../.github/workflows/cv03-n105c-tokyo-original-db-acl-depth-readonly.yml) checks real authenticated QA identity, intentionally OPEN original DB CONNECT and invalid password denial, then **only** queries PostgreSQL system catalogs via read-only SQL.
- Separately counts column-level read/REFERENCES and write permissions using `has_column_privilege`; sequence SELECT/USAGE/UPDATE using `has_sequence_privilege`; foreign data wrapper and server USAGE; plus reports role-inheritance, explicit default ACL entries, and user-schema USAGE as diagnostic **counts**, without leaking object names or customer rows.
- Any effective column/sequence/FDW/server privilege count nonzero is a **red finding**, not a condition to revoke production grants. Notes column `has_column_privilege` is effective (includes table-level privileges). Some supplementary counts are diagnostics, not proof of object access.
- Retains exact-head main verification, pinned SSH host key, PostgreSQL 17.11, fail-closed completion markers and PR-only embedded Bash syntax checks. No original DB DDL/DML, account/ACL/HBA changes, credential log output, restart or SAVE enablement.
- This is **not exhaustive** for PostgreSQL large objects, extensions, RLS/bypass paths, trust domains, network paths or future default grants. Original `PUBLIC CONNECT` and `TEMP` remain OPEN; investigate a separately reviewed role+database HBA reject and positive/negative preview app proof rather than global `REVOKE CONNECT FROM PUBLIC`.

## P / physical gate and Owner dependencies
- Record the actual Tokyo Actions run ID, job ID, full PASS/finding markers, exact merged main SHA, exact-head CI and hygiene outcome **only after they exist**.
- Production canonical PA05 and AuthorizationProvider source, signed workload principal/KMS, multi-Host adversarial recovery/offsite PITR, and named Owner signoff are not established by this query.
- `N1=NOT_CERTIFIED`; `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`; formal SAVE POST 403; unregistered GET 404; [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) OPEN. Do not modify #1184 Owner-managed documents.
