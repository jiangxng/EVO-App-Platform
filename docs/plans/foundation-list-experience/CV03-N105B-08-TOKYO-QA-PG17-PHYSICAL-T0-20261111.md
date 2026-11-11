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


## Postmerge physical Tokyo acceptance evidence — 2026-11-11 (G, verified)

The earlier header saying TOKYO PHYSICAL EXECUTION PENDING preserves the state **when the draft PR was authored**. The following newer evidence supersedes that for the **QA** scope only.

| Evidence | Verified result |
| --- | --- |
| Engineering PR | [#1224 MERGED](https://github.com/jiangxng/EVO-App-Platform/pull/1224): exact HEAD e41f3430dc1776f60a33b248c0aac2decce5812c, merge main 0ab405611539881f8024b708e2f0b220db521326 |
| HEAD CI | 5/5 SUCCESS, including disposable PG17 physical-sql-isolated. Not production certification |
| Real Tokyo execution | [Actions #43018562251](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43018562251), physical-qa-t0 job 130515707869, SUCCESS; runtime log inspected 2026-11-11 |
| QA schema/roles | Runtime markers ISOLATED_DATABASE_AND_NON_SUPERUSER_ROLES_CREATED_PASS, REAL_POSTGRESQL_T0_FUNCTIONS_INSTALLED_PASS and PHYSICAL_NON_SUPERUSER_SESSION_PASS |
| Atomicity and replay | Runtime ATOMIC_DENY_AND_IDEMPOTENT_REPLAY_PASS, ROLLBACK_OUTBOX_AND_ALL_SCOPE_T0_FENCE_PASS |
| Physical DENY tests | Runtime PHYSICAL_DIRECT_DML_SET_ROLE_UNTRUSTED_DENY_PASS, including direct authority/outbox DML refusal, owner SET ROLE refusal and untrusted call refusal |
| Original database protected | Runtime ORIGINAL_EVO_DEV_SCHEMA_UNCHANGED_PASS; no QA schema created in evo_dev |
| End-of-script verification | Runtime REAL_SQL_TRANSACTION_AND_LEAST_PRIVILEGE_ACCEPTANCE_PASS and TERMINAL_SQL_EVIDENCE_ENFORCED_PASS, not only a green workflow badge |
| Process branch cleanup | [Branch Hygiene #43018563860 SUCCESS](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43018563860); #1224 branch absent |

**Resulting milestone state:** real QA PostgreSQL ACID DENY/outbox, durable replay receipt and all seeded Human/AI/offline scope Feature fence are **PHYSICALLY TESTED IN TOKYO QA**. The shipped functions are not production Host-mounted; current PA05/AuthorizationProvider production canonical facts are not SQL migrated; the trusted role uses local QA socket without production password/KMS. This result must not be confused with production N1-05b or N1-05c certification.

**Evidence limits / remaining acceptance:** Full archive restore, SIGKILL during in-flight T0, double-Host concurrent replay, old generation after authorized rotation, network identity, KMS and signed Resource/Receipt DML, complete real offline user population and migration, live Human/Agent, independent PA05/Authorization/DB/Security owner signoffs and formal release PR remain OPEN. PostgreSQL archive_mode=off still means no WAL PITR proof. Issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212#issuecomment-6795577949) records the same source and pending Owner decisions.

**Unchanged production gate:** N1=NOT_CERTIFIED; APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF; formal SAVE POST 403; unregistered Page GET 404. PR #1184's three managed documents are untouched. No new cloud host or Railway resource.
