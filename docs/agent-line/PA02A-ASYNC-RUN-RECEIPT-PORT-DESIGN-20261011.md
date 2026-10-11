# PA-02A：Async Run / ActionReceipt 持久端口与可靠性证明 — 2026-10-11

Document class: DESIGN_CANDIDATE  
Status: REVIEW_READY / NOT_IMPLEMENTED / NOT_MIGRATED  
Owner: independent Personal Agent development line  
Architecture authority: [AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0](../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md)  
Existing first-pass evidence: [PA00 baseline](PA00-BASELINE-AND-PA01A-SCOPE-20261010.md), [Agent handoff](HANDOFF.md). This is a scoped next-step design, not a change to accepted global project sequencing.

## 1. Exact ground truth at the read revision

| Source | Directly inspected behavior | Consequence |
|---|---|---|
| Platform #579 `contracts/agent-run.ts` | `AgentRunEventStoreV010.append/listEvents` and `AgentRunStoreV010.create/append/get/list/events` all synchronous | Do **not** substitute an async SQL provider under the same synchronous type |
| Platform #579 `manager/agent-run-store.ts` | `runs() = materializeAgentRunsV010(eventStore.listEvents())`; scope/list capped at 100; `create` checks only runId | Current `clientTurnId` retry scan can miss older tasks and race across processes |
| Platform #579 `contracts/agent-action-receipt.ts` + `manager/agent-action-receipt-store.ts` | Receipt `begin/complete/get/getByIdempotencyKey/list` synchronous; event source may be JSONL/memory, complete reads all events | No durable DB uniqueness / atomic status transitions across processes |
| Platform #579 `agents/enterprise-agent/thread-turn-action-handlers.ts` | Lookup candidate by last 100 scoped Runs and sourceActionId before new Run | Keep PA-01A full-task identity comparison; replace bounded scan with durable direct turn claim |
| Platform main `manager/conversation-postgres-store.ts` | Independent Conversation PostgreSQL authority exists, uses schema, migrations, transactional `sql.begin`, `FOR UPDATE`, durable message/event uniqueness | Reuse demonstrated PostgreSQL transaction conventions; do not rebuild Conversation |
| Platform main `manager/conversation-context-postgres-store.ts` | Independently persists derived Context Assembly summaries/checkpoints | Do not conflate Run with Conversation or long-term Memory |
| 2026-10-08 state constitution | PostgreSQL preferred for durable queryable state, JSONL appropriate for export/logs, immutable facts and model replaceability | Prefer explicit relational keys/unique indexes and bounded JSONB, no JSONL as production authority |

The earlier static audit could not prove the **actual production environment's** Run/Receipt storage bindings, row counts or RPO/RTO. This document also does not prove them; never infer runtime deployment from implementation defaults.

## 2. Scope / non-scope

PA-02A NOW: define new async interfaces, deterministic task-identity binding and atomic claim semantics; isolate owner Postgres schema and tests (including unique-key race across separate connections, retry across restart, append order and receipt terminal CAS). Maintain current V010 sync API unchanged for all existing consumers until a later guarded adapter cutover.

Not PA-02A: broad `manager/server.ts` rewrite, moving Conversation/Memory/EC, full distributed work scheduler, generic event bus, lease/fencing/outbox (PA-02B), Run cancel (PA-02C), production migration, vendor UI, 2D graph changes or a speculative Temporal dependency.

## 3. Candidate async interfaces (not yet released)

Names below are interface sketches, NOT the current shipped `AgentRunStoreV010` or authorized runtime commands:

```ts
interface AgentRunRepositoryV020 {
  claimTurn(input: {
    principalScope: ResolvedPrincipalContextFromHost;
    threadId: string;
    clientTurnId: string;
    canonicalTaskDigest: string;
    create: AgentRunCreateInputV010;
  }): Promise<
    { status: "CREATED"; run: AgentRunV010 }
    | { status: "REUSED"; run: AgentRunV010 }
    | { status: "CONFLICT"; existingRunId: string }
  >;
  appendEvent(input: {
    runId: string;
    expectedRevision: number;
    event: AgentRunEventV010;
  }): Promise<{ revision: number; run: AgentRunV010 }>;
  getByTurnIdentity(scope: HostScope, threadId: string, clientTurnId: string):
    Promise<AgentRunV010 | undefined>;
  get(scope: HostScope, runId: string): Promise<AgentRunV010 | undefined>;
  events(scope: HostScope, runId: string, cursor?: number, limit?: number):
    Promise<{ events: AgentRunEventV010[]; nextCursor?: number }>;
  list(scope: HostScope, cursor?: string, limit?: number):
    Promise<{ runs: AgentRunV010[]; nextCursor?: string }>;
}

interface AgentReceiptRepositoryV020 {
  beginUnique(input: {
    scope: HostScope;
    receipt: AgentActionReceiptBeginInputV010;
  }): Promise<{ created: boolean; receipt: AgentActionReceiptV010 }>;
  completeCAS(input: {
    scope: HostScope;
    receiptId: string;
    expectedStatus: "REQUESTED";
    terminal: AgentActionReceiptTerminalInputV010;
  }): Promise<{ transitioned: boolean; receipt: AgentActionReceiptV010 }>;
  getByIdempotencyKey(scope: HostScope, key: string):
    Promise<AgentActionReceiptV010 | undefined>;
  get(scope: HostScope, receiptId: string): Promise<AgentActionReceiptV010 | undefined>;
}
```

**HostScope is server-resolved** from authenticated Principal and currently authorized Personal/Enterprise Context. No body field can create tenant/identity authority. Exact types and compatibility namespace to be fixed in owning contract PR, with original `V010` semantics preserved.

## 4. Identity and uniqueness (design decision candidate)

Persist a canonical versioned `taskDigest` over the validated `assistanceRequest` (including `requestId`, `taskKind`, source, context/target/revision) or legacy message plus normalized interaction context. Compare complete canonical task when replayed; normalized object key order may differ but changed target/importJobId/source may not reuse an earlier Run. Store canonical payload/version alongside the digest to guard hash/version policy evolution.

SQL-grade unique constraints proposed:

```text
agent_runs.run_id                            PRIMARY KEY
agent_turn_claims(scope_key, thread_id, client_turn_id) UNIQUE
agent_run_events(run_id, event_ordinal)      UNIQUE
agent_run_events.event_id                    UNIQUE
agent_action_receipts.receipt_id             PRIMARY KEY
agent_action_receipts(scope_key, idempotency_key) UNIQUE
agent_receipt_events(receipt_id, event_ordinal) UNIQUE
agent_receipt_events.event_id                UNIQUE
```

`scope_key` must be a stable Host-derived identity boundary (actual enterprise tenant ID, context ID and principal Subject+Actor Type as required), NOT user-provided `enterpriseId`. Foreign keys bind events to parents; immutable creation identities stay immutable. A unique client turn can yield only one Run even after the 101st later Run, process restart or concurrent independent workers.

`claimTurn` transaction: attempt new unique claim plus run+RUN_CREATED in one DB transaction. On conflict, reread the winner under the same authoritative scope; reuse only if task payload/digest matches. On divergent payload return stable `CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED` without inserting new Run, messages, or calling model. No success claim before durable commit.

`appendEvent` transaction locks/compares current aggregate revision and appends unique event ordinal; no wall-clock sort for causal order. Repeated eventId + same payload is either explicitly idempotent or deterministic collision; different payload to same eventId is forbidden. Persist snapshot/checkpoint only as derived optimization and require integrity/replay parity.

`beginUnique` transaction uses unique idempotency key scoped to true Host scope. A duplicate with same input digest returns the existing receipt; a duplicate with a changed input digest is hard conflict. `completeCAS` transitions REQUESTED→one terminal state exactly once. A retry of same terminal state returns current receipt; contradictory later terminal updates are rejected; never report `SUCCEEDED` on database uncertainty.

## 5. Failure, isolation, recovery, durability gates

1. **Two-client concurrency**: ≥32 simultaneous `claimTurn` calls with same scope/thread/clientTurnId produce 1 Run; changed task inputs conflict deterministically; confirm zero duplicate model actions.
2. **Beyond 100 turns**: create ≥130 independent Runs, then resend original turn ID. Must retrieve original via unique direct lookup; no list(100) reliance.
3. **Scope isolation**: same turn IDs in distinct Host-resolved enterprise/principal scopes are separate; forged/mismatched caller scope rejected before revealing other task payload.
4. **Crash/reopen**: close both DB connections, reopen fresh process, verify Runs/events/receipts reconstruct identical state and source task/receipt linkage.
5. **Receipt concurrency**: ≥32 simultaneous begin calls same key + mixed input digests produce exactly one persisted receipt, same digest idempotent reuse, divergent digest conflict; terminal contention yields one permitted CAS.
6. **Partial failure**: transaction rollback leaves neither claimed turn nor partial Run, no stray event; invalid/torn payload does not become success.
7. **Monotonic state**: no illegal terminal→running/rewrite; known BLOCKED vs FAILED vs PAUSED vs CANCELLED retained; no pretend formal cancellation.
8. **Migration readiness only**: verify export/import integrity and rollback rehearsal on throwaway copies before changing any production-authoritative Run or receipt store. Measure row count/size, concurrency, retention, RPO/RTO from actual environment after separate authorization.

Proposed independent CI uses a disposable PostgreSQL instance/schema and separate connections. It should not depend on production DB URLs, Docker host production mounts, full vendor replacement or background scheduled migrations.

## 6. Open questions before accepting the contract

- Which existing app Platform namespace/schema version and foreign key policy should the Run/Receipt tables share with the already-shipped Conversation PostgreSQL authority? Preserve Conversation ownership.
- Exact `scope_key` composition for personal vs enterprise tenants and delegated AI/Human actor equivalence (must align with current Host authority and permission policy).
- Crash after external tool committed but before receipt terminal commit: status must be UNKNOWN_PENDING_RECONCILIATION / fail closed; PA-02B outbox/idempotent business action and verified reconciliation need an owner, no blind replay.
- Task identity digest version strategy, data minimization and retention, and maximal JSONB payload size/depth.
- Read cursor and cross-process resume lease/fencing fields after PA-02A, rather than silently granting single-flight safety.
- Actual operation metrics, RPO/RTO, storage migration/rollback authorization and tenant data-region policy are environment-dependent and remain OPEN.

## 7. Implementation steps without mainline conflict

1. Add `contracts/agent-run-async.ts` and `contracts/agent-action-receipt-async.ts` **independently**; document mapping to V010 and exact errors. Do not edit or rename original sync ports.
2. Implement disposable PostgreSQL turn-claim/Run-event and receipt repository with migrations and dual-connection transactions in Agent-specific files. Validate fail-closed semantics and replay of existing event reducer.
3. Add CI that starts disposable database, injects process/transaction fault, verifies 130+ turn collision and cross-connection idempotency and negative authorization isolation.
4. Only after independent gate and conflict recheck discuss Host adapter and migration opt-in; no launch change, no merge or production migration without explicit authorization.

All external literature from the prior 14-reference handoff retains its historical **待验证** state here; these decisions derive from newly re-read local code and current State Constitution, not an invented reading of Temporal or related papers.
