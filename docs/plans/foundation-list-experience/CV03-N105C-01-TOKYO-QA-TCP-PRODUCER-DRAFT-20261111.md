# CV-03 / N1-05c-01 — Authenticated SQL Producer (QA only)

> 2026-11-11. Status **TOKYO QA PHYSICAL PASS / PRODUCTION N1 NOT_CERTIFIED**. Owner issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) remains OPEN. This file does not authorize applying the SQL changes to Tokyo.

## Starting evidence (G)
- Exact starting main: `117a658d3fd4029de93ab442fcd78bed49539526`; option A remains selected.
- [Tokyo N1-05b-08 run #43018562251](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43018562251) proved a genuine PostgreSQL 17 T0 + immutable outbox and least-privileged local-socket role in isolated `cv03_n105b_qa`, not a password-authenticated workload Producer.
- [Tokyo full-restore run #43020836019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43020836019) proved same-host logical restore and preservation of the business database; off-host recovery and PITR are still open.
- The existing QA Producer uses `PASSWORD NULL`. Existing T0 functions bind `SESSION_USER` to a QA seed table. The genuine PA05/AuthorizationProvider source, KMS and real Host identity have **not** been migrated or certified.

## Intended bounded change (D)
A new isolated, main-only workflow `.github/workflows/cv03-n105c-tokyo-qa-tcp-principal.yml` proposes password-backed SCRAM TCP LOGIN in the **existing QA database only**, physical wrong-password and `SESSION_USER` tests, atomic QA Producer mapping reassignment, prior login GRANT revocation, replay without new outbox event, and negative direct DML / role impersonation tests. It is not a second T0 schema, and it must never mount a Saved View feature or open SAVE.

## Historical source review blocker (resolved in #1233)
The initial workflow draft calls `has_function_privilege` using the helper connected to the separate `postgres` database. Functions reside only in `cv03_n105b_qa`; that particular assertion must run against the QA database instead. An old-Producer negative-call shell quoting section also deserves syntax review. Attempts to correct the initial source through the available GitHub write connector were blocked at that time. **This warning applied only to the initial draft**; the independent stacked [PR #1233](https://github.com/jiangxng/EVO-App-Platform/pull/1233) later fixed both defects, passed a dedicated source-contract CI, and merged into #1227 before main integration.

Before READY, complete source correction and safe shell/YAML syntax validation, peer-reviewed comparison against the exact main HEAD, and explicit verification that the workflow cannot mutate `evo_dev` or production Host, nor log a generated QA password. After exact-head CI passes, merge and inspect real Tokyo run terminal markers. If any provisioning step fails, preserve partially initialized QA resources for explicit repair rather than destructive reset.

## Open (P)
- True production SQL workload identity and KMS custody/rotation.
- Current PA05/AuthorizationProvider canonical persistent authority source and trusted scope migration.
- SQL producer ability to CONNECT to existing `evo_dev` via PUBLIC grant needs a **read-only** privilege audit; don't silently REVOKE grants on the existing business database.
- Multi-Host crash, stale generation, source outage, network partition and replay recovery; offsite backup/PITR; independent Owner/Security approvals.

**Unchanged:** `N1=NOT_CERTIFIED`, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, formal SAVE POST 403, unregistered GET 404. No changes to #1184 Owner-managed documents.

## Verified real Tokyo physical execution (G / 2026-11-11)

**Source and source-control trail:** stacked fix [#1233](https://github.com/jiangxng/EVO-App-Platform/pull/1233) corrected the QA database ACL assertion and old-role SQL shell quoting; no QA role was provisioned by that PR. The N1-05c Producer [PR #1227](https://github.com/jiangxng/EVO-App-Platform/pull/1227) then synchronized against the verified SCRAM `main`, passed **5/5 exact-HEAD CI checks**, and merged as `main@b9a5897d39ba4f8063c3bbd31a16df5f3cb2318c`. The automatically triggered [physical Tokyo Actions #43034999556](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43034999556), job `130571390912`, completed **SUCCESS**. The original job log, not just its green status, was read. Exact terminal markers:
- `CV03_N105C_QA_MAIN_AND_SSH_PIN_PASS`
- `CV03_N105C_QA_PG_HEALTH_AND_CAPACITY_PASS`
- `CV03_N105C_EXISTING_ATOMIC_T0_UNCHANGED_PASS`
- `CV03_N105C_QA_RESTRICTED_LOGIN_CREATED_PASS`
- `CV03_N105C_REAL_SCRAM_TCP_SESSION_AND_BAD_PASSWORD_DENIAL_PASS`
- `CV03_N105C_OWNER_REBOUND_AND_OLD_PRODUCER_REVOKED_PASS`
- `CV03_N105C_QA_SOURCE_IDENTITY_FENCE_PASS`
- `CV03_N105C_TCP_REPLAY_WITHOUT_DUPLICATE_OUTBOX_PASS`
- `CV03_N105C_DIRECT_DML_ROLE_IMPERSONATION_SCOPE_DRIFT_AND_FROZEN_DENY_PASS`
- `CV03_N105C_OLD_LOCAL_SOCKET_PRODUCER_DENIED_PASS`
- `CV03_N105C_EVO_DEV_SCHEMA_UNTOUCHED_PASS`
- `CV03_N105C_REAL_TCP_PRODUCER_QA_PHYSICAL_ACCEPTANCE_PASS`
- `CV03_N105C_QA_TERMINAL_PROOFS_ENFORCED_PASS`

**Exact observed isolation limitation, NOT PASS:** the job additionally emitted `CV03_N105C_QA_ORIGINAL_DB_CONNECT_VIA_CLUSTER_ACL=true`. The restricted QA Producer still inherits PostgreSQL cluster-level permission to **CONNECT** to the original business `evo_dev` database (likely PUBLIC CONNECT; exact grant provenance requires separate read-only catalog proof). This alone does **not** establish any ability to read or modify business schemas, but also does **not** prove database-level isolation. No `REVOKE CONNECT ON DATABASE evo_dev FROM PUBLIC` was attempted, because changing a live business database-wide ACL without verified application role inventory and rollback would be unsafe. Future isolated Host/DB rule hardening needs separate review and connection-negative proof.

**Operational limits:** newly created QA-only `cv03_n105c_qa_tcp_producer` is a non-superuser login with a locally private generated password, max 3 sessions and `VALID UNTIL 2026-12-01 00:00:00+00` in the audited workflow source; it is not production KMS/rotation or a signed Host workload identity. Its test scope is the existing `cv03_n105b_qa` with synthetic facts. No new PA05/AuthorizationProvider canonical DB migration, multi-Host partition/crash recovery, off-host backup/PITR, or independent Owner/Security approval has been obtained. Original `evo_dev` schema was checked unchanged; the QA schema/outbox replay retained existing counts.

**Strict release gate still applies:** `N1=NOT_CERTIFIED`; `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`; formal SAVE POST 403; unregistered GET 404; [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) remains OPEN and #1184 Owner-controlled docs are unchanged. Do not re-run the initial producer provisioning as if the QA role did not exist; rerun is designed as an audit of the already bound identity, not destructive reset.
