# CV-03 / N1-05c-01 — Authenticated SQL Producer (QA only)

> 2026-11-11. Status **DRAFT / NOT PHYSICALLY EXECUTED**. Owner issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) remains OPEN. This file does not authorize applying the SQL changes to Tokyo.

## Starting evidence (G)
- Exact starting main: `117a658d3fd4029de93ab442fcd78bed49539526`; option A remains selected.
- [Tokyo N1-05b-08 run #43018562251](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43018562251) proved a genuine PostgreSQL 17 T0 + immutable outbox and least-privileged local-socket role in isolated `cv03_n105b_qa`, not a password-authenticated workload Producer.
- [Tokyo full-restore run #43020836019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43020836019) proved same-host logical restore and preservation of the business database; off-host recovery and PITR are still open.
- The existing QA Producer uses `PASSWORD NULL`. Existing T0 functions bind `SESSION_USER` to a QA seed table. The genuine PA05/AuthorizationProvider source, KMS and real Host identity have **not** been migrated or certified.

## Intended bounded change (D)
A new isolated, main-only workflow `.github/workflows/cv03-n105c-tokyo-qa-tcp-principal.yml` proposes password-backed SCRAM TCP LOGIN in the **existing QA database only**, physical wrong-password and `SESSION_USER` tests, atomic QA Producer mapping reassignment, prior login GRANT revocation, replay without new outbox event, and negative direct DML / role impersonation tests. It is not a second T0 schema, and it must never mount a Saved View feature or open SAVE.

## Execution blocker found in source review
The initial workflow draft calls `has_function_privilege` using the helper connected to the separate `postgres` database. Functions reside only in `cv03_n105b_qa`; that particular assertion must run against the QA database instead. An old-Producer negative-call shell quoting section also deserves syntax review. Attempts to correct the source through the available GitHub write connector were blocked by a tool safety check. **Do not merge or execute this draft as-is.**

Before READY, complete source correction and safe shell/YAML syntax validation, peer-reviewed comparison against the exact main HEAD, and explicit verification that the workflow cannot mutate `evo_dev` or production Host, nor log a generated QA password. After exact-head CI passes, merge and inspect real Tokyo run terminal markers. If any provisioning step fails, preserve partially initialized QA resources for explicit repair rather than destructive reset.

## Open (P)
- True production SQL workload identity and KMS custody/rotation.
- Current PA05/AuthorizationProvider canonical persistent authority source and trusted scope migration.
- SQL producer ability to CONNECT to existing `evo_dev` via PUBLIC grant needs a **read-only** privilege audit; don't silently REVOKE grants on the existing business database.
- Multi-Host crash, stale generation, source outage, network partition and replay recovery; offsite backup/PITR; independent Owner/Security approvals.

**Unchanged:** `N1=NOT_CERTIFIED`, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, formal SAVE POST 403, unregistered GET 404. No changes to #1184 Owner-managed documents.