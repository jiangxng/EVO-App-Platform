# Scheduled Memory Operations, Retention Policy, Legal Hold and DLP P1.3 v0.1

**Status:** implementation complete; CI verification required before merge  
**Date:** 2026-09-27  
**Depends on:** P1.2 Memory retention/privacy governance, semantic retrieval and EC adapter  
**World model:** Human → Personal Agent → Host-resolved Context → governed immutable Memory

## 1. Purpose

P1.3 turns P1.2's per-Memory governance primitives into an operational governance layer without creating a second source of truth.

The stable rule is:

> Scheduler, retention policy and DLP may evaluate; only append-only governance evidence changes the effective Memory state.

Durable Memory records remain immutable.

## 2. Retention policies

Retention policy is an append-only event stream.

A policy defines:

- stable `policyId`;
- Host-resolved Context;
- `ACTIVE / RETIRED`;
- `retainForDays`;
- optional Memory kinds;
- optional privacy classes;
- reason and actor.

The latest event per policy id is effective.

When multiple active policies match a Memory item, the earliest applicable deadline wins. This is fail-safe and deterministic.

Retention is calculated from immutable Memory `attribution.recordedAt`.

## 3. Legal Hold

Legal Hold is a separate append-only overlay.

States:

- `PLACED`
- `RELEASED`

A hold targets a specific Memory id and retains:

- stable `holdId`;
- reason;
- actor;
- event history.

A placed hold blocks retention-driven expiration.

A released hold does not rewrite history. Existing retention rules become effective again.

Holds are independent by stable `holdId`. Releasing one hold never releases another active hold on the same Memory.

Legal Hold does not automatically make explicitly RESTRICTED or explicitly EXPIRED Memory visible. It only prevents expiration caused by retention deadlines.

## 4. Scheduled Memory Operations

P1.3 defines operation evidence independently from Memory truth.

Operation kinds:

- `RETENTION_EVALUATION`
- `DLP_RECLASSIFICATION`
- `SOURCE_INTAKE`

Operation states:

- `SUCCEEDED`
- `FAILED`
- `SKIPPED`

Each operation records:

- operation id;
- Context;
- start/end;
- examined count;
- changed count;
- skipped count;
- optional failure code/message.

The operation log is observability/audit evidence. It is not used to derive Memory state.

### Retention execution

The scheduler:

1. selects immutable Memory for one Context;
2. checks Legal Hold first;
3. resolves current privacy classification;
4. evaluates matching active retention policies and explicit `retainUntil`;
5. writes an append-only `EXPIRED` governance event when expiration is due;
6. never rewrites Memory.

Repeated evaluation is safe: already scheduled-expired Memory is skipped.

## 5. Read-time Legal Hold precedence

P1.2 can derive `EXPIRED` at read time when `retainUntil` has passed.

P1.3 composes Legal Hold into the Host governance Provider so a placed hold prevents that derived expiration.

This prevents a semantic mismatch where the scheduled job respects a hold but the Reader still hides the held item.

Explicit governance state remains authoritative:

- explicit `RESTRICTED` remains restricted;
- explicit `EXPIRED` remains expired;
- only deadline-derived expiration is suspended by hold.

## 6. DLP / Sensitive Classification

P1.3 introduces the replaceable contract:

`ContextMemoryDlpClassifierV010`

Input is restricted to the already Host-scoped candidate:

- Context;
- optional Memory id;
- Memory kind;
- summary.

Output:

- `STANDARD / SENSITIVE / RESTRICTED`;
- labels;
- optional confidence;
- reason codes.

DLP does not mutate Memory.

A classification change becomes a new append-only governance event.

Governance evidence records its origin as `HUMAN / RETENTION_POLICY / DLP_PROVIDER`. Explicit Human privacy governance takes precedence over automatic DLP classification.

The remote DLP Provider is HTTP-based, validates the complete response and resolves its optional bearer credential only through Host Secrets.

DLP evaluation is batch fail-closed: all Provider calls and results are validated before any governance mutation is appended. A mid-batch Provider failure therefore leaves the batch unmodified.

If no DLP Provider is bound, scheduled DLP fails closed and writes no governance mutation.

## 7. Governance authority

Retention policy and Legal Hold commands require:

1. request-bound HUMAN Principal;
2. explicit material-write confirmation;
3. current Host-resolved Context;
4. Personal Context owner for Personal Memory;
5. active OWNER or ADMIN for Enterprise Context;
6. `authorization.check` ALLOW.

MEMBER and AUDITOR cannot govern enterprise retention policy or Legal Hold.

## 8. Security invariants

1. Memory remains immutable.
2. Retention policy is append-only.
3. Legal Hold is append-only.
4. DLP result is an overlay, never Memory mutation.
5. Legal Hold is evaluated before retention expiration.
6. DLP without an effective Provider fails closed.
7. Scheduled jobs never become a second Memory authority.
8. Existing RESTRICTED/EXPIRED filtering still happens before ranking.
9. Enterprise governance remains OWNER/ADMIN only.
10. Human confirmation and authorization remain mandatory for policy/hold writes.

## 9. Production scheduling, lease and intake backpressure

Scheduled execution is disabled unless `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS` is set to at least 60000.

The scheduler uses:

- in-process re-entrancy protection;
- an optional durable file lease with TTL for multiple Host processes sharing state;
- durable JSONL operation evidence;
- deterministic Context de-duplication;
- immutable Memory as the source candidate set.

Retention and DLP can enumerate Contexts already represented by durable Memory.

Scheduled Source Intake is stricter. It only runs for explicitly configured `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON` entries. It never invents or broadens Context scope.

Intake backpressure is one page per Context per tick with `limit=100`. The Host persists the source `nextCursor`. When the source reports no next cursor, the cursor is reset so the next polling cycle starts from the beginning and relies on P1.1 receipt/proposal idempotency to ignore already-seen records.

Scheduled intake uses a SERVICE Principal and still enters the existing Pending Proposal pipeline. It has no durable Memory writer authority.

## 10. Eidos Memory surfaces

P1.3 adds the system Experience routes:

- `/memory` — Memory Governance;
- `/memory/search` — Memory Search;
- `/memory/sources` — Memory Source Health.

The Workbench exposes a Memory activity.

### Governance surface

Personal Context governance is visible to the Personal owner.

Enterprise governance details are visible only to active OWNER/ADMIN relationships. MEMBER/AUDITOR receive no governed Memory detail.

The surface shows effective governance state, privacy class, retention deadline, Legal Hold and recent scheduled-operation evidence.

### Search surface

Memory Search calls the Host Context Memory Reader rather than reading storage directly.

Therefore RESTRICTED / EXPIRED / privacy-RESTRICTED Memory is removed before the Eidos surface receives candidates.

### Source Health surface

The surface aggregates effective Memory Provider runtime health for:

- read;
- governance;
- semantic retrieval;
- DLP classification;
- intake source;
- evidence source.

Secret values are never exposed.

Eidos remains a consumer of Host contracts. It does not own retention, Legal Hold, DLP or Memory authority.

## 11. Persistence and configuration

Durable operational state supports:

- `APP_PLATFORM_CONTEXT_MEMORY_RETENTION_POLICY_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_LEGAL_HOLD_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_OPERATIONS_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULER_LEASE_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_STATE_FILE`.

When lifecycle persistence is configured, stable sibling files are used by default.

Remote DLP configuration:

- `APP_PLATFORM_MEMORY_DLP_URL`;
- `APP_PLATFORM_MEMORY_DLP_TIMEOUT_MS`;
- optional package secret `apiToken` through Host Secrets.

Scheduler configuration:

- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS`;
- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON`.

## 12. Implemented P1.3 scope

Implemented on the P1.3 branch:

- public contracts for retention policy, Legal Hold, DLP and operation evidence;
- append-only durable/in-memory Retention Policy store;
- append-only durable/in-memory Legal Hold store;
- independent overlapping Legal Hold semantics;
- Human/OWNER/ADMIN-gated retention-policy and Legal Hold commands;
- scheduled retention evaluator;
- read-time Legal Hold precedence for deadline-derived expiration;
- replaceable DLP classification Provider contract;
- production remote DLP HTTP Provider;
- Host Secrets bearer credential boundary;
- Human privacy override over automatic DLP;
- all-or-nothing Provider-evaluation phase for a DLP batch;
- fail-closed missing/invalid DLP Provider behavior;
- durable JSONL operation evidence;
- scheduler re-entrancy protection and durable TTL lease;
- explicit scheduled intake Context allow-list;
- durable intake cursor and one-page-per-tick backpressure;
- scheduled intake remains Proposal-only;
- Eidos Memory Governance, Search and Source Health surfaces;
- four-locale App Platform/DLP configuration UI copy;
- en/zh-CN Help;
- protocol and integration regression coverage;
- dedicated P1.3 CI workflow.

## 13. Completion gate

P1.3 may be merged only when the latest branch head passes:

- dedicated Context Memory P1.3 CI;
- Platform CI;
- all triggered P0.5–P1.2 authority/Memory regression workflows.

No physical Memory deletion is introduced or claimed by P1.3. Expiration remains a governance state/visibility decision over immutable Memory.
