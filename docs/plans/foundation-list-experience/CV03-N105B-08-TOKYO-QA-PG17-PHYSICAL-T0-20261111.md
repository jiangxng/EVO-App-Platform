# CV-03 / N1-05b-08 — Tokyo isolated PostgreSQL 17 physical T0 (2026-11-11)

> **Status at PR drafting: CODE SUBMITTED / TOKYO PHYSICAL EXECUTION PENDING.** Do not count a migration file or green isolated PG17 CI as a completed Tokyo DB acceptance. Independent production Owners in [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) remain unsatisfied.

## Retained decisions and environment evidence

User confirmed Option A: PostgreSQL source generation/authority epoch and immutable Outbox in the same ACID T0. Keep current Eidos, Platform, PA05, AuthorizationProvider, Domain Owner and existing unmounted Host-only PG ports. N1-05b-01–06 have already merged; no duplicate framework or SAVE release.

[Actual Tokyo backup terminal proof](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43016695338) (2026-11-11 UTC 12:01): PG17.11 healthy; original evo_dev 8,025,779 bytes; available disk 46,368,052 KiB; available memory 2,513 MiB; archive_mode=off; QA DB absent; QA roles absent. Private 17,744-byte custom-format logical backup created, pg_restore --list successful, but **no actual full restore** or point-in-time recovery demonstrated.

## Concrete bounded implementation

- [QA PG17 SQL](../../../deploy/tencent-tokyo/cv03-n105b-qa-t0.sql): separate QA schema, QA authority facts, immutable outbox with write-preventing triggers, operation-key receipt, existing port's commit-deny and feature-fence functions, persisted epoch/generation, row-level and feature-level lock. Each function executes inside the calling SQL transaction.
- [Tokyo gated execution](../../../.github/workflows/cv03-n105b-tokyo-qa-t0.yml): trusted main, pinned SSH, hash-checked SQL, verifiable private backup, capacity and absence of colliding resources before creating the dedicated cv03_n105b_qa database and three namespaced test roles. Tests real session identity, deny, replay, rollback, full-scope fence, refusal of direct DML, forbidden SET ROLE and original evo_dev schema unchanged. Actual terminal proof is enforced.
- [Independent PR PG17 test](../../../.github/workflows/cv03-n105b-pg17-qa-t0-pr.yml): disposable real PG17 run for SQL syntax, security grants and transaction mechanics. No Tokyo secrets and no production DB access.

**QA proof limit:** SQL owner seeds synthetic QA identities/scopes, not migrated real PA05 or AuthorizationProvider facts. QA producer and untrusted LOGIN roles use PASSWORD NULL and local Docker socket only; they prove PostgreSQL role ACL, **not** authenticated production network workload credentials, KMS or signed DML. Shared default Enterprise Context Provider is not disabled; only saved-view Feature is fenced. Outbox cannot be changed by QA producer and has owner-level immutable-update triggers; a DB superuser still controls the DB.

**Failure boundary:** Namespaced QA role creation is a cluster-wide administrative write, QA database/schema DDL is isolated from original evo_dev; no business data copied. A mid-migration failure must remain RED and be explicitly inspected. A DBA-reviewed rollback may drop exactly the named QA database and QA roles after checking dependencies; never automatically drop an existing data volume or mutate evo_dev. Existing evo superuser privileges are unchanged.

## Evidence and pending work

Original PostgreSQL 17 references **opened and relevant sections read 2026-11-11**: [CREATE FUNCTION / SECURITY DEFINER and search_path](https://www.postgresql.org/docs/17/sql-createfunction.html), [Privileges §5.8](https://www.postgresql.org/docs/17/ddl-priv.html) and [SET SESSION AUTHORIZATION](https://www.postgresql.org/docs/17/sql-set-session-authorization.html). GitHub [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212), [read-only Tokyo SQL](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098340) and [backup terminal log](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43016695338) were read as original live evidence.

Production PA05/Provider persistent source switch, authentic Host credentials and KMS, complete offline/future scopes, multi-Host crash/recovery, full restore rehearsal, Human+Agent and independent Owner approvals remain PENDING. Preserve **N1=NOT_CERTIFIED**, **APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF**, SAVE POST 403 and unregistered GET 404. No PR #1184 managed docs touched. Before any Tokyo execution, require exact PR HEAD CI to pass. Next record real Actions run/SHAs and failures rather than assuming success.
