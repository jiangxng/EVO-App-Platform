# Generic Durable Agent Action Receipt — P1.5B v0.1

**Status:** MACHINE_VERIFIED  
**Milestone:** Personal Agent P1.5 — Durable Agent Operations  
**Scope:** Personal Agent material WRITE execution evidence

## 1. Problem

Before P1.5B, continuity after a Personal Agent WRITE depended on domain-specific readback.

That works for one domain at a time, but it does not answer a generic Host question:

```text
Did this Agent WRITE actually execute?
Was it denied?
Did it fail?
Was it already completed before the browser/model retried?
Did the previous process die after requesting it but before recording completion?
```

A long-running Agent platform cannot rely on conversation memory or model recollection for those facts.

## 2. Invariant

```text
Every Personal Agent material WRITE must have durable Host-owned execution evidence.
```

The receipt is generic execution evidence.

It is not the domain object's source of truth.

```text
Action Receipt
= what the Host observed about one Agent WRITE invocation

Domain READ
= current authoritative business/governance state
```

## 3. Append-only lifecycle

Each receipt is materialized from append-only events:

```text
REQUESTED
→ SUCCEEDED
or FAILED
or DENIED
```

Rules:

- REQUESTED is persisted before authorization/execution;
- exactly one terminal event may follow;
- terminal receipt facts are immutable;
- no terminal event means the invocation is indeterminate;
- indeterminate WRITEs are never automatically repeated.

## 4. Receipt identity

The Host derives a stable idempotency key from:

- source interaction ID;
- source action ID;
- Principal subject;
- active Context;
- tool ID;
- canonical input digest.

The LLM does not choose this key.

The key produces a deterministic receipt ID and invocation ID for that source interaction.

## 5. Retry semantics

For an identical WRITE in the same source interaction:

### Existing SUCCEEDED

Do not execute again.

Return the existing receipt as successful replay evidence.

### Existing REQUESTED

Fail closed:

```text
AGENT_ACTION_RECEIPT_INDETERMINATE
```

The Host cannot safely know whether the side effect occurred before the previous process/interruption.

Do not guess and do not retry automatically.

### Existing FAILED / DENIED

Do not silently execute the same invocation again.

A genuinely new Human interaction may create a new idempotency scope and attempt again subject to current authority.

## 6. Receipt facts

A materialized receipt includes:

- receiptId;
- invocationId;
- idempotencyKey;
- sourceInteractionId;
- sourceActionId;
- Principal subject and actor type;
- active Context;
- tool ID;
- owner Package;
- optional Capability;
- effect = WRITE;
- input digest;
- status;
- requestedAt;
- completedAt when terminal;
- result digest when successful;
- bounded result entity references;
- deterministic result summary;
- error code/message when failed or denied;
- latest append-only event ID.

The receipt does not persist raw tool input.

This avoids turning receipt storage into a duplicate Secret/content store.

## 7. Persistence

Reference Host persistence:

```text
APP_PLATFORM_AGENT_ACTION_RECEIPT_FILE
```

If the explicit path is absent and App Platform lifecycle state is file-backed, the Host uses sibling:

```text
agent-action-receipts.jsonl
```

JSONL is append-only.

Service reconstruction must reproduce the same materialized receipt state.

## 8. Personal Agent tools

P1.5B adds READ-only tools:

```text
agent.action.receipt.get
agent.action.receipt.list
```

These are scoped by the Host to:

- current Principal;
- current active Context.

The model cannot supply a forged Context to broaden receipt access.

## 9. Authorization relationship

Receipt recording does not bypass authorization.

The sequence is:

```text
model requests WRITE
→ Host persists REQUESTED receipt
→ Host authorization check
→ DENIED receipt
  or
→ tool execution
→ SUCCEEDED / FAILED receipt
```

This means authorization denial itself becomes durable execution evidence.

## 10. Receipt versus domain authority

A SUCCEEDED receipt means:

```text
the Host observed this WRITE invocation complete successfully
```

It does not mean:

```text
the domain object is still in the same current state
```

For example:

- a Memory Proposal receipt proves proposal staging completed;
- the proposal's current state still comes from the Memory Proposal domain READ;
- an install receipt proves that installation invocation completed;
- current installed/effective state still comes from App Manager/Host READ.

## 11. Result entity references

The reference implementation extracts bounded identifier-like fields from successful tool results.

Examples:

- proposalId;
- memoryId;
- packageId;
- canonicalizationId;
- other *Id / *Ids fields.

This provides enough continuity to locate domain state without persisting the entire result payload.

## 12. Failure posture

Receipt infrastructure is part of the material WRITE safety boundary.

If a Personal Agent WRITE has no receipt service:

```text
AGENT_ACTION_RECEIPT_REQUIRED
```

The WRITE does not execute.

If receipt finalization fails after an execution failure:

```text
AGENT_ACTION_RECEIPT_FINALIZATION_FAILED
```

The Host must not claim a safe retry.

## 13. Relationship to P1.5C

P1.5B solves durable side-effect evidence.

It does not yet make the entire Agent run resumable.

P1.5C will build resumable/asynchronous Agent runs on top of:

- durable receipt IDs;
- idempotent WRITE boundaries;
- explicit terminal/indeterminate action state;
- durable run state.

## 14. Machine acceptance

P1.5B machine verification requires:

- successful WRITE produces REQUESTED + SUCCEEDED;
- identical successful retry executes once only;
- denied WRITE produces durable DENIED without executing domain action;
- failed WRITE produces durable FAILED;
- orphan REQUESTED blocks automatic retry;
- get/list receipt READ is Principal + Context scoped;
- JSONL survives service reconstruction;
- provider-independent Personal Agent policy explains receipt semantics;
- existing Agent/Memory/Provider/Platform CI remains green.

Current machine result:

```text
26 / 26 triggered CI workflows PASS
```

## 15. Human live gate

After deployment, perform one real Personal Agent material WRITE through the browser.

The Human should verify:

1. the WRITE succeeds through the normal authorization boundary;
2. the Agent exposes a durable SUCCEEDED receipt;
3. a later READ-only request can retrieve that receipt;
4. receipt IDs/result entity references connect the execution evidence to the domain object;
5. domain READ still determines the object's current authoritative state;
6. no duplicate WRITE is needed merely to recover continuity.
