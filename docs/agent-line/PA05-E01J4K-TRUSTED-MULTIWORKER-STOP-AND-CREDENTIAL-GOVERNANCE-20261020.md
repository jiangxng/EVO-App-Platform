# PA05-05 / E01J4K — Trusted Multi-Worker Stop Proof & Production Identity / DBA Credential Governance

**Date:** 2026-10-20  
**Class:** DECISION_RECORD / SOURCE-GROUNDED-GAP-ASSESSMENT  
**Status:** RESEARCH_COMPLETE / DESIGN_BASELINE_PROPOSED / IMPLEMENTATION_NOT_STARTED / NOT_SIGNED  
**Parent evidence:** [PA05 certification baseline](PA05-CERTIFICATION-BASELINE-20261015.md) §§62–67, [E01J4A persisted multi-Worker reattestation](PA05-E01J4-PERSISTED-MULTIWORKER-REATTEST-20261019.md), [E01J4G production operator trust boundary](PA05-E01J4G-PRODUCTION-OPERATOR-TRUST-BOUNDARY-20261019.md), [E01J4G provider engineering](PA05-E01J4G-PROVIDER-TRUST-ENGINEERING-20261019.md), [E01J4J cooperative Host exclusion](PA05-E01J4J-COOPERATIVE-HOST-EXCLUSION-20261019.md).

This is the next independent security gate after J4J. It records a design baseline and missing evidence; it does **not** implement a distributed stop mechanism, select a production IdP/secret product, sign PA05-05, or authorize production material WRITE. It does not close or replace Issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988), [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979), or [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913).

## 1. Confirmed starting point — reuse, do not repeat

| Existing evidence | What it proves | What it does not prove |
| --- | --- | --- |
| E01J4A, merged PR [#1029](https://github.com/jiangxng/EVO-App-Platform/pull/1029), real three-PostgreSQL18 **19/19 PASS** | A central PostgreSQL READ Owner epoch can revoke stale authority; each Host must be separately reattested, and one Host's reattestation does not automatically approve another | All Worker processes have stopped; PostgreSQL and each Worker’s JSON state are atomic; a production operator actually approved the action |
| E01J4G, merged PR [#1053](https://github.com/jiangxng/EVO-App-Platform/pull/1053), provider composition isolated engineering | Request-bound Session + Authorization Provider + Host-scoped `secrets.resolve` can compose a fail-closed pre-start recovery contract | The reference/test Session Provider is a real production Human IdP; production DBA credentials, credential rotation, CLI and durable audit are signed |
| E01J4J, merged PR [#1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057), final engineering HEAD `1fba63927a80f2e9658b8608bb5a92a9849abcdf`, **45/45 checks SUCCESS**, physical PostgreSQL18 **28/28 PASS / 0 failed / 0 skipped** | Explicit opt-in cooperative Hosts sharing one trusted POSIX file namespace serialize against a maintenance operation; default remains OFF; stale locks fail closed | A distributed lock, complete Worker inventory, multi-node/global stop, production IdP/DBA custody, or full E01J4 signoff |
| Current provider boundary and SQL design in `manager/pa05-read-owner-trusted-prestartup.ts`, `manager/pa05-read-owner-lifecycle-pg.ts` | Existing Provider contracts, database-authenticated `session_user`, DBA-owned `SECURITY DEFINER` functions and least-privilege intent are reusable design assets | Actual production issuer, certificate/CA, role grants, credential issuer/rotation and an independently runnable maintenance entrypoint have been approved |

**Current certification remains:** full E01J4, PA05-05 E01–E05 and W06 are **NOT_SIGNED**; Issues #988/#979/#913 remain OPEN; production material WRITE remains OFF. No code or production configuration is changed by this record.

## 2. The three claims must remain separate

1. **Fencing / stale-operation denial:** a Worker with an old activation epoch cannot execute protected READ/WRITE/lifecycle work even if the process is still alive.
2. **Trusted stop proof:** every Worker in the authoritative, complete inventory has been drained and its exact process/instance termination independently confirmed; the database has no remaining sessions or in-flight work from the fenced generation.
3. **Production authority:** a real, authenticated and currently authorized Human/operator principal requested the exact maintenance operation, and the database credentials used to perform it are governed, scoped, revocable and auditable.

A local file lock proves none of the second or third claims. A central epoch can fence old operations but is not by itself evidence that the operating-system process exited. A valid Human identity is not a DBA credential, and a DBA login is not proof of Human consent.

## 3. Proposed design baseline (pending topology and organization approval)

### 3.1 Authoritative Worker inventory

Before implementation, identify the actual production runtime topology: application service instances, Worker processes, queue/job consumers, child processes, scheduled tasks and any external runtimes that can reach the protected READ/WRITE/lifecycle operations. A Railway service's current replica count is not a complete Worker inventory unless the organization proves that it covers every relevant process and entrypoint.

The stop operation must freeze a **versioned inventory snapshot** from a trusted orchestrator/control plane. Each inventory entry should bind at least:

- immutable Worker identity and Host ID;
- exact instance/deployment ID and process-start nonce (to distinguish a restarted process reusing a hostname);
- the protected authority epoch/fencing generation;
- the registered database role/application name or other auditable connection identity;
- the supervisor/orchestrator's lifecycle state and stop/termination receipt.

Worker self-report or heartbeat alone is not a complete inventory authority. If inventory completeness cannot be established, the system must not assert `STOP_CONFIRMED`.

### 3.2 Fencing and stop state machine

Recommended state transitions:

`ACTIVE → FREEZE_REQUESTED → FENCED(new epoch) → DRAINING → STOP_ATTESTATION → MAINTENANCE_AUTHORIZED → MAINTENANCE_COMPLETE → REATTESTING → ACTIVE`

- **FREEZE_REQUESTED:** atomically block new maintenance-sensitive work and freeze scaling/restart admission for the inventory snapshot.
- **FENCED:** advance the central epoch before waiting for process exit. Every protected operation entrypoint must check the authoritative epoch; stale Workers are denied even if they remain alive.
- **DRAINING:** signal every registered Worker to stop accepting new work, finish or cancel active work under an explicit policy, close resources, and exit.
- **STOP_ATTESTATION:** require external supervisor/orchestrator evidence for each exact instance, plus a fresh database-session query showing no protected sessions/in-flight transactions remain. A missed heartbeat, timeout or missing acknowledgement is **not** an acknowledgement.
- **MAINTENANCE_AUTHORIZED:** reached only after the complete inventory is accounted for, old epochs are fenced, process termination is confirmed and database sessions are verified absent. The maintenance principal must independently pass the real production identity and authorization gate.
- **REATTESTING:** a restarted Worker remains fenced until it is independently authenticated and explicitly reattested to the new epoch. Never auto-promote a restored local JSON state or auto-delete an abnormal-exit lock.

If a Worker is unreachable, unregistered, partitioned, cannot be stopped, or cannot be distinguished from a replacement process, remain fail-closed. The operator must obtain authoritative termination/fencing evidence or abort maintenance; do not infer success from elapsed time.

### 3.3 PostgreSQL is an authority and a source of session evidence, not the whole process supervisor

- Preserve the existing central epoch/fencing contract; extend it only after enumerating **every** READ, WRITE, lifecycle, queue/replay and restart entrypoint that can perform protected work.
- PostgreSQL `pg_stat_activity` can show server backend sessions and useful connection identity fields, but it does not enumerate every external OS process. Treat it as one evidence source, not the complete Worker inventory.
- A PostgreSQL advisory lock is application-enforced: code that does not participate can ignore it. It may be a coordination primitive, but cannot independently prove that every Worker has stopped.
- `pg_terminate_backend(pid)` with its default zero timeout reports whether the signal was sent, not necessarily that the backend actually terminated. If used by an explicitly authorized DBA path, require a positive timeout and/or independent re-query until the session is absent; a boolean `true` alone is not the stop proof.
- Do not grant application Workers superuser, broad table DML, or lifecycle-function EXECUTE merely to simplify the stop path. Keep the owner role separate from login roles, use narrowly scoped DBA-owned functions, pin a safe `search_path` for `SECURITY DEFINER`, revoke default PUBLIC EXECUTE, and grant only the approved operator role inside the migration transaction.

### 3.4 Production Human IdP / operator identity

The production trust contract must be bound to an organization-approved issuer, not an environment boolean or test fixture:

- issuer and discovery metadata obtained from a trusted HTTPS origin; validate that the returned `issuer` exactly matches the configured issuer;
- validate signature against trusted published keys, audience, subject, expiry/not-before, and the required Human/operator role and exact tenant/Host/operation scope;
- distinguish Human operator identity from Agent service identity and from the SQL login identity;
- define the real revocation semantics and maximum stale-authorization window. RFC 7009 describes token revocation but notes propagation delay; for self-contained tokens, immediate revocation needs backend coordination or a deliberately short token lifetime. RFC 7662 introspection can report `active:false`, but cache freshness must match the organization's revocation SLA;
- fail closed on invalid/expired/revoked credentials, issuer/audience mismatch, unavailable introspection/policy service, ambiguous identity, or stale authorization. Do not cache a previous ALLOW for later maintenance operations.

The actual issuer, account/role mapping, session revocation SLA, MFA/assurance requirement and production tenant must be supplied and approved by the organization. This record does not select an IdP.

### 3.5 DBA identity, secret lifecycle and audit

- Separate the Human/operator identity from the database identity. The application READ role, maintenance operator LOGIN, database object owner (preferably NOLOGIN), and any credential-broker role must have distinct, documented privileges.
- Use the existing `secrets.resolve` contract only after its production provider and scope are proven. A secret-manager product (including Vault) is not selected by this record.
- Prefer short-lived, unique credentials or certificates for the specific maintenance session; define issue, expiry, rotation, revocation, old-session termination and audit behavior. Do not assume that rotating a password terminates already-open database sessions.
- No raw database URL, password, bearer token, private key, connection string or secret response may appear in Git, PR comments, CLI arguments, logs, audit events or error messages.
- Record non-secret evidence: operation ID, actor subject/issuer reference, policy decision ID, scope, old/new epoch, inventory snapshot version, per-Worker stop receipts, database session-verification result, credential lease/reference ID (not secret value), timestamps, outcome and failure reason. The audit sink and retention/signature requirements remain an organization decision.

## 4. Options compared and current decision

| Option | Decision | Reason and limit |
| --- | --- | --- |
| Reuse J4J POSIX lock alone | **Rejected for global stop** | It serializes only cooperating Hosts sharing the same trusted file namespace; no cross-node or complete Worker inventory proof |
| PostgreSQL advisory lock alone | **Rejected as stop proof** | PostgreSQL documents advisory locks as application-enforced; a non-cooperating Worker can bypass them |
| Lease/heartbeat timeout alone | **Rejected as process-termination proof** | A Lease supports coordination/leader election and heartbeat; expiration does not itself attest that a particular OS process has exited |
| Central epoch/fencing + complete authoritative inventory + external termination receipts + DB-session verification | **Preferred design baseline; not yet implemented** | Layers independently fence stale operations and prove the known Worker set has stopped. Requires an actual trusted orchestrator and coverage of all operation entrypoints |
| Kubernetes-specific Lease/leader election | **Not selected** | Kubernetes is a useful reference for coordination semantics, but the actual complete production Worker topology has not been established as Kubernetes-based |
| Vault dynamic database credentials | **Reference pattern only; not selected** | Official Vault documentation illustrates short-lived, per-service and revocable database credentials. Product selection, trust root, DBA privileges and operations ownership require explicit approval |

## 5. Acceptance matrix — all rows are pending

| Case | Required result |
| --- | --- |
| Complete inventory, all Workers drain and exact instances terminate | Maintenance remains blocked until every stop receipt and database-session check is present; only then may the operator authorize the scoped operation |
| Worker misses heartbeat but process may still be alive | **DENY** maintenance; heartbeat expiry is not stop proof |
| Worker ignores stop or is network-partitioned | Old epoch cannot perform protected operations; no `STOP_CONFIRMED` without trusted termination evidence |
| Inventory incomplete, duplicate identity, unknown Worker or scaling race | **DENY**; no inferred completeness and no automatic admission of a newly started Worker |
| Old Worker continues after epoch advance | All protected operation paths reject the stale epoch; record a negative test on actual independent processes |
| `pg_terminate_backend` returns true but backend remains visible | **DENY** maintenance until the session is actually absent and the state is re-queried |
| Old/revoked Human token, wrong issuer/audience/signature, expired token, Agent identity used as Human | **DENY**; no test identity or environment boolean may substitute for production IdP evidence |
| Introspection/policy provider or secret provider unavailable | **DENY**; no cached ALLOW and no fallback to an unrestricted database URL |
| Worker attempts direct control-table DML or lifecycle function call | **DENY** by actual non-superuser role/EXECUTE grants; owner and operator roles stay separate |
| Crash between fencing, process stop, session termination and maintenance completion | State remains fenced/unknown and recoverable only through explicit authorized recovery; no automatic lock deletion, reactivation or WRITE |
| Restart/scale after maintenance | New instance starts fenced and requires explicit per-Worker reattestation before protected work |
| Audit or credential rotation evidence is missing | Gate cannot be signed; no production material WRITE |

## 6. Implementation gates and required organization decisions

1. **K0 — topology and authority inventory (no code):** document every production Worker/process/job and every protected entrypoint; name the authoritative orchestrator and the owner who can attest instance termination. Resolve what “all Workers” means before schema/API design.
2. **K1 — fencing contract:** define generation/epoch transitions, exact protected operations, stale-token rejection and fail-closed behavior; retain the existing J4A tests as regression only.
3. **K2 — stop attestation:** implement the orchestrator adapter and complete inventory snapshot, per-instance drain/termination receipts, restart/scale exclusion and failure/partition behavior.
4. **K3 — database evidence:** actual PostgreSQL18 tests with separate non-superuser Worker and maintenance roles, session inventory, termination timeout/re-query, secure function grants and no raw secret exposure.
5. **K4 — production identity and credentials in an approved non-production tenant:** real issuer metadata, Human/operator mapping, revocation SLA, scoped credential issue/rotation/revocation and durable non-secret audit; no real production secret values in Git or logs.
6. **K5 — adversarial integration:** at least two independent Worker processes across the supported topology plus the existing three physical PostgreSQL18 test setup; inject lost heartbeat, partition, stuck process, stale session, stale token, crash at each transition, restart/scale race and provider outage.
7. **K6 — release signoff:** independent review by the production identity owner, DBA/credential owner and runtime/orchestrator owner. Only their real evidence can change the current NOT_SIGNED state.

**Blocking decisions to obtain before K1/K2:** (a) complete production Worker topology and orchestrator API/termination receipt; (b) approved production IdP issuer, audience, operator groups and revocation SLA; (c) DBA role owner, privilege grant/migration procedure and session termination authority; (d) production `secrets.resolve` provider or other approved credential broker, rotation policy and emergency revocation; (e) audit sink, retention and approver. If any is unknown, stay at K0 and do not pretend that an engineering fixture proves production trust.

## 7. Original sources and reading status (accessed 2026-10-20)

The following official originals were opened and read at the cited sections during this gate. **Source facts** are distinguished from the project-specific engineering judgments above.

| Source | Reading status and relevant section | Source fact and project use |
| --- | --- | --- |
| [Kubernetes — Leases](https://kubernetes.io/docs/concepts/architecture/leases/) | **Original page opened/read**, “Leases” / “Leader election” | Describes Lease objects for node heartbeats and leader election. Used as a coordination reference; the project-specific conclusion that Lease expiry alone is not proof of OS process termination is an engineering inference |
| [PostgreSQL 18 — Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html) | **Original page opened/read**, §13.3.5 “Advisory Locks” | Advisory locks are application-enforced; session-level locks last until explicit unlock or session end, transaction-level locks end with the transaction. Used to reject advisory lock alone as global stop proof |
| [PostgreSQL 18 — Cumulative Statistics System](https://www.postgresql.org/docs/18/monitoring-stats.html) | **Original page opened/read**, §27.2.3 `pg_stat_activity` | One row per PostgreSQL server process with fields including PID, logged-in role, application name and client address. Used for DB-session evidence, not as a complete external Worker inventory |
| [PostgreSQL 18 — System Administration Functions](https://www.postgresql.org/docs/18/functions-admin.html) | **Original page opened/read**, `pg_terminate_backend` | With default zero timeout, `true` can mean only that the signal was sent; positive timeout can wait for termination. Used to require actual session disappearance, not a bare boolean |
| [PostgreSQL 18 — CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) | **Original page opened/read**, “Writing SECURITY DEFINER Functions Safely” | Recommends a safe `search_path`, restricting default PUBLIC EXECUTE and granting selectively in the same transaction. Used for DBA-owned privileged lifecycle functions |
| [PostgreSQL 18 — Role Attributes](https://www.postgresql.org/docs/18/role-attributes.html) | **Original page opened/read**, §21.2 “superuser status” / role creation | Superuser bypasses permission checks; most work should use non-superuser roles. Used for the Worker/operator/owner role boundary |
| [RFC 7009 — OAuth 2.0 Token Revocation](https://www.rfc-editor.org/rfc/rfc7009) | **Original RFC opened/read**, §2.2 and §3 | Specifies token revocation but notes practical propagation delay; self-contained tokens may need backend coordination or short-lived lifetimes for a bounded revocation window |
| [RFC 7662 — OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662) | **Original RFC opened/read**, §2.2 | Defines the `active` indicator and inactive-token response. Introspection/cache freshness must be chosen to meet the real revocation SLA |
| [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414) | **Original RFC opened/read**, §§2, 3.3, 6.2 | Defines HTTPS issuer metadata/JWKS and requires the returned issuer to exactly match the issuer identifier used for discovery; used for production issuer trust |
| [NIST SP 800-207 — Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture) | **Original NIST page opened/read**, abstract | No implicit trust based solely on network location or asset ownership; subject and device authentication/authorization are distinct. Used as a principle, not as a product specification |
| [HashiCorp Vault — Dynamic database secrets](https://developer.hashicorp.com/vault/tutorials/db-credentials/database-secrets) | **Original tutorial opened/read**, scenario and database secret workflow | Illustrates unique, short-lived and revocable database credentials for service instances. **Reference pattern only; Vault is not selected for EVO** |

## 8. Signoff boundary

- This document is **design baseline only**: `RESEARCH_COMPLETE / IMPLEMENTATION_NOT_STARTED / NOT_SIGNED`.
- J4J remains **ENGINEERING_BOUNDED_PASS** only. E01J4 full, PA05-05 E01–E05 and W06 remain NOT_SIGNED; #988/#979/#913 remain OPEN.
- Production material WRITE remains OFF. No real production database, production secret, credential rotation, IdP, Railway variable or runtime configuration was changed for this research.
- Do not automatically delete abnormal-exit locks, reattest a Worker, restart a fenced Worker or infer stop from a timeout.
- The next implementation PR must begin from the then-current `main`, remain isolated to this gate, preserve all existing tests and receive actual three-PostgreSQL18 + multi-Worker + identity/credential negative evidence before any certification decision.
