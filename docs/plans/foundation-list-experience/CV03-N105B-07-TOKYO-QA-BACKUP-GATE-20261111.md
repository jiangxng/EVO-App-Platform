# CV-03 / N1-05b-07 — Tokyo QA capacity and private backup gate (2026-11-11)

> **Status at PR authoring: IMPLEMENTED WORKFLOW / TOKYO EXECUTION PENDING.**
> Authority: [N1-05b established implementation record](CV03-N105B-01-APPROVED-A-DENY-T0-SEAM-20261111.md), [N1 production acceptance plan](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md), [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212). No production certification or new approval is implied.

## Retained decisions / scope

- User selected **A**: PostgreSQL authority/source generation/epoch + immutable outbox in a single ACID T0. Existing Eidos, Platform, PA05, AuthorizationProvider and Domain Owner are retained; no new list framework.
- Actual environment is Tencent Tokyo Lighthouse, PostgreSQL 17.11; original `evo_dev` SQL role `evo` is superuser, not an acceptable least-privilege Producer. Read-only evidence: [Actions #43012098340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098340). Functions and N1 schema were **zero** at that observation.
- Previously merged #1214–#1219 are **not** repeated. #1184's three Owner-managed files are **not** touched.
- Actual SQL/owner/signature/scope completeness and remote crash recovery remain **PENDING**. No release switch is changed: N1=NOT_CERTIFIED, APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF, official SAVE POST 403, unregistered GET 404.

## Implemented bounded step

New dedicated [Tokyo QA backup/capacity workflow](../../../.github/workflows/cv03-n105b-tokyo-qa-backup-gate.yml):

1. Executes only on the trusted `main` addition of its workflow (or explicit dispatch); verifies exact current main SHA and pinned Tokyo SSH Host key / configured GitHub Environment.
2. Checks actual PostgreSQL Docker health, original database identity/size, `archive_mode`, existing QA database/role names, host free disk and available RAM. Fails closed if host disk less than **2 GiB** free or available RAM below **256 MiB**.
3. Only after the above, creates a PostgreSQL `pg_dump --format=custom` **consistent logical backup** of `evo_dev` under the deploy user's **0700 private Tokyo home directory**, with a unique **0600** file. Validates nonzero archive bytes and `pg_restore --list` parsing **before** the atomic final filename. No backup bytes are uploaded to GitHub Actions. Aborted partial archives are cleaned. Existing archives are not deleted.
4. No `CREATE DATABASE`, SQL schema/table/role modifications, resource DML, volume operations, service restart or deploy image change. The archive is a safety prerequisite for a later isolated QA database—not a fabricated completed restore test.

**CAUTION:** `pg_restore --list` validates the archive structure, not full recovery. A complete QA restore and tested disaster recovery/runbook still require separate evidence. Host free space and PG flags are runtime observations, not a cloud-provider snapshot guarantee.

## Target next work package (must not invent success)

- Review the actual postmerge workflow run and log markers `CV03_TOKYO_QA_*PASS`; record exact commit/Actions reference, space, backup size, QA DB/roles existence, archive/WAL caveats. If the gate fails, **do not create QA resources** before fixing the named condition.
- Once safe: create `cv03_n105b_qa` as a **separate database** plus independent non-superuser owner/Producer/Reader principals; never modify `evo_dev` business records or weaken existing `evo` role. Retain credential secrecy and no direct DML grants to Producer; test actual SQL permissions, rollback and functional restore.
- Implement the existing proposed `cv03_n105b_commit_deny_t0` and `cv03_n105b_fence_package_t0` contracts using *DB-verified* `SESSION_USER`, bounded expected generation/epoch, immutable append-only outbox and operation-key idempotency. Reuse current unmounted ports and Host-only lifecycle adapter, never activate SAVE.
- Do not call QA synthetic seeded authority the real production AuthorizationProvider. Full persisted PA05/Provider authority migration, KMS/workload principal, offline/future scope enumeration, two-host fencing, and independent Owner signoffs remain part of N1-05b/c/d/f.

## Newly consulted PostgreSQL 17 source originals (2026-11-11)

| Official original reference / read level | Relevant source fact | Use / limitation |
| --- | --- | --- |
| [CREATE FUNCTION, PostgreSQL 17](https://www.postgresql.org/docs/17/sql-createfunction.html) — **original opened**, relevant SECURITY DEFINER/function definition sections | Functions can run as owner and support function-local configuration; changing function definition is subject to ownership. | Later QA SQL must use pinned trusted search_path and explicit owner. Not evidence that a SQL function is deployed. |
| [Privileges, PostgreSQL 17 §5.8](https://www.postgresql.org/docs/17/ddl-priv.html) — **original opened**, roles/EXECUTE/USAGE sections | Object owner/superuser privilege differs from object grants; EXECUTE applies to functions and USAGE to schemas. | Deny direct DML physically; limit Producer to specific EXECUTE, revoke PUBLIC. Not evidence of Tokyo privileges after migration. |
| [SET SESSION AUTHORIZATION, PostgreSQL 17](https://www.postgresql.org/docs/17/sql-set-session-authorization.html) — **original opened** | `SESSION_USER` is initially the authenticated login; unlike `CURRENT_USER` it does not change with ordinary `SET ROLE` or SECURITY DEFINER. Superusers can alter session authorization. | Function must bind actual non-superuser SQL session identity; a caller Host ID string is not proof. |

These three official pages were actually opened this window, unlike unverified historical external references. The source observations and workflow design here are distinct from **pending Tokyo execution**.

## QA authorization / rollback boundaries

A completed private logical backup by itself does **not** certify restore ability, point-in-time recovery, platform uptime, cloud snapshot coverage, or a new QA role. Later SQL/role migrations must be confined to a distinct database, with reversible commands verified before use, and independently checked physical LOGIN/GRANT/DML denial. No actual data or secrets should enter repo documents or Actions artifacts.

**PR discipline:** independent branch → Draft PR → exact-head required CI → merge `main` → SHA-safe Branch Hygiene. Read-only / backup evidence is an engineering milestone only, not an Owner signature.

## N1-05b-07b — First Tokyo run and explicit terminal-evidence correction (2026-11-11)

**G (actual Actions original job log):** [Run #43015746709](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43015746709), job 130506246229, concluded SUCCESS on main f2b9ac6fcf0fbc6c1858eca04e27d2bb80bc5a19. The SSH log recorded PostgreSQL healthy and:

| Actual marker | Observed |
| --- | --- |
| DISK_FREE_KB | 46368980 |
| MEM_AVAILABLE_MB | 2507 |
| PG_SERVER_VERSION | 170011 (PG 17.11) |
| ORIGINAL_DATABASE | evo_dev |
| DATABASE_BYTES | 8025779 |
| ARCHIVE_MODE | off — no PITR evidence |
| TARGET_DB_EXISTS | false |
| EXISTING_QA_ROLES | 0 |

**Important gap:** the same original job log did **not** contain terminal markers for PRIVATE_BACKUP_ARCHIVE_VALID_PASS, LOGICAL_BACKUP_BYTES or NO_LIVE_DB_DDL_OR_DML_PASS even though the job concluded SUCCESS. The workflow source does contain these expected commands but that does not prove they ran. Consequently **backup remains unverified** and QA database creation remains blocked. Do not mistake echoed source code for runtime output.

**D correction:** capture complete remote SSH stdout on the runner and require exact terminal completion proof, otherwise fail the run even if SSH exits zero. After the correction's exact-head CI and main merge, examine runtime terminal proof and archive bytes. This changes no production authorization or release switch.

**P:** verified backup, complete restore, QA roles and isolation, real PostgreSQL T0/immutable outbox, SESSION_USER/SECURITY DEFINER ACL denial, independent DB/Security signoff all remain separately pending.
