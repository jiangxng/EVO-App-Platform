# Scheduled Memory Operations, Retention Policy, Legal Hold and DLP P1.3 v0.1

**Status:** implementation branch baseline  
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

## 9. Current implementation slice

Implemented in this branch:

- platform contracts for retention policy, Legal Hold, DLP and operation evidence;
- append-only in-memory Retention Policy store;
- append-only in-memory Legal Hold store;
- scheduled retention evaluator;
- DLP reclassification evaluator;
- fail-closed missing DLP Provider behavior;
- operation evidence log;
- Host governance Provider Legal Hold precedence;
- Human/OWNER/ADMIN gated retention-policy command;
- Human/OWNER/ADMIN gated Legal Hold command;
- protocol tests;
- dedicated P1.3 CI workflow.

## 10. Remaining P1.3 work before mainline completion

Still required before P1.3 can be called complete:

- durable file-backed policy/hold/operation stores;
- production scheduled runner / lease and concurrency semantics;
- production DLP Provider adapter + Host Secrets credential path;
- source intake scheduling and backpressure;
- source/provider health aggregation;
- Eidos Memory Governance surface;
- Eidos Memory Search surface;
- Eidos Source Health surface;
- Help/localization/handoff/status updates;
- full CI matrix and merge to main.

No completion claim should be made until those items are implemented and CI verified.
