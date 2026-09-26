# Context Memory Governance P0.9 v0.1

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-27  
**Depends on:** Person-first Context model P0.3–P0.8  
**Scope:** Context Memory Provider, immutable provenance/attribution, governed writes and cross-context promotion

## 1. Core model

Context Memory is durable Context knowledge.

It is not:

- raw chat history;
- hidden model memory;
- a property of one LLM vendor;
- an Enterprise Agent;
- automatically shared between Personal and Enterprise Contexts.

Canonical model:

```text
Human
  ↓
Personal Agent
  ↓
Host-resolved Active Context
  ↓
Context Memory Provider
  ↓
immutable Memory records
```

Every Memory belongs to exactly one Context.

## 2. Memory kinds

P0.9 retains four stable semantic kinds:

- `FACT`
- `CLAIM`
- `EXPERIENCE`
- `PRACTICE`

These are machine identities and are not localized.

## 3. Provider boundary

P0.9 adds two replaceable capabilities:

- `context.memory.read`
- `context.memory.write`

Reference package:

- package: `host-context-memory-provider`
- reader: `host.context-memory-reader`
- writer: `host.context-memory-writer`

The Personal Agent and platform actions depend on these contracts, not on the reference persistence implementation.

## 4. Append-only records

A Memory record is immutable after creation.

The reference store rejects:

- deletion of an existing Memory record;
- mutation of any field on an existing Memory record;
- duplicate `memoryId`;
- invalid provenance;
- cross-Context supersession.

Correction uses a new record:

```text
Memory A
  ↓ superseded by semantic intent
Memory B
  supersedesMemoryId = A
```

P0.9 deliberately does not mutate Memory A to point at B.

Any reverse `supersededBy` projection is derived compatibility data, not authoritative storage.

## 5. Provenance

Every Memory has mandatory provenance:

```text
origin
sourceContext
sourceMemoryId?   // required for PROMOTED
evidenceRefs[]
```

Origins:

- `DIRECT`
- `PROMOTED`

DIRECT invariant:

```text
Memory.context == provenance.sourceContext
sourceMemoryId is absent
```

PROMOTED invariant:

```text
sourceMemoryId exists
sourceMemory.context == provenance.sourceContext
Memory.context != provenance.sourceContext
```

Promotion never erases the source Context.

## 6. Attribution

Every Memory has immutable attribution:

- `recordedBySubjectId`
- `recordedByActorType`
- `recordedAt`

Attribution answers who caused this durable Memory record to be written.

It is distinct from provenance, which answers where the knowledge came from.

Example:

```text
Alice promotes an ACME Memory into Personal Context

Attribution:
  recordedBy = Alice

Provenance:
  sourceContext = ACME
  sourceMemoryId = memory:acme-123
```

## 7. Personal Memory authority

A Personal Context Memory WRITE is valid only when:

1. request Principal is HUMAN;
2. Active/target Personal Context belongs to the same Principal;
3. the action has explicit confirmation intent;
4. `authorization.check` returns ALLOW.

A browser cannot choose another person's Personal Context as a writable target.

## 8. Enterprise Memory authority

Enterprise Memory WRITE additionally requires an ACTIVE Enterprise Relationship.

Writable P0.9 relationships:

- OWNER
- ADMIN
- MEMBER

AUDITOR is read-only for Context Memory.

Therefore:

```text
Enterprise Context access
≠
Enterprise Memory write authority
```

Authorization Provider ALLOW cannot bypass the structural Relationship rule.

## 9. Direct record action

Command:

`context.memory.record`

Required input:

- `kind`
- `summary`

Optional:

- `evidenceRefs[]`
- `observedAt`
- `supersedesMemoryId`

The Host generates `memoryId`, provenance and attribution authority fields.

If `supersedesMemoryId` is supplied, that Memory must exist in the same Active Context.

## 10. Cross-context promotion

Command:

`context.memory.promote`

Required input:

- `sourceMemoryId`
- `targetContextId`

Rules:

1. source is the Host-resolved Active Context;
2. source Memory must exist in that Context;
3. target Context must be in the Principal's Host-offered available Contexts;
4. source and target must be different Contexts;
5. Principal must hold Memory write authority for both sides;
6. explicit confirmation is required;
7. `authorization.check` must explicitly ALLOW `context.memory.promote`.

Because the reference Authorization Provider is deny-by-default, cross-context promotion is deny-by-default.

Promotion creates a new Memory. It never moves or deletes the source.

## 11. Why both source and target require write authority

Promotion can disclose or reinterpret knowledge across governance boundaries.

Examples:

```text
Enterprise → Personal
could exfiltrate enterprise knowledge

Personal → Enterprise
could publish personal knowledge into shared enterprise memory
```

P0.9 therefore does not treat promotion as ordinary READ + WRITE.

Both Context authorities must be satisfied, then policy authorization must ALLOW the promotion.

## 12. Personal Agent Memory tool

Personal Agent gains:

`context.memory.search`

Properties:

- READ only;
- available only when a Memory Reader Provider is effective;
- Host binds it to the current resolved Active Context;
- model input cannot choose another Context id;
- results contain provenance and attribution.

Supported filters:

- text query;
- Memory kind;
- limit.

The model may reason from these records, but P0.9 does not give chat inference an implicit Memory WRITE side effect.

## 13. Human decision authority

Durable Memory mutation commands require explicit Action confirmation.

Therefore this flow is intentional:

```text
Personal Agent observes/reasons
  ↓
proposal to remember / correct / promote
  ↓
Human decision
  ↓
confirmed Action
  ↓
Host Context authority
  ↓
authorization.check
  ↓
Memory Writer
```

This preserves the frozen rule that Human remains final decision authority.

## 14. Persistence

Reference persistence:

- `APP_PLATFORM_CONTEXT_MEMORY_FILE`, or
- `context-memory.json` beside the normal App Platform lifecycle state file,
- in-memory store when durable Host state is not configured.

The file format is Provider reference state, not the long-term storage technology contract.

A future database/vector Provider can replace it without changing Personal Agent semantics.

## 15. Retrieval behavior

P0.9 reference retrieval is deterministic:

- exact Context isolation;
- optional exact Memory ids;
- optional kinds;
- optional case-insensitive text match over summary/evidence refs;
- bounded result limit;
- offset cursor.

Semantic/vector retrieval is deliberately deferred.

Correct authority and provenance come before retrieval sophistication.

## 16. Security invariants

1. Every Memory belongs to exactly one Context.
2. Existing Memory records are append-only and immutable.
3. DIRECT provenance must equal the target Context.
4. PROMOTED provenance must point to a real source Memory and source Context.
5. Supersession cannot cross Context boundaries.
6. Personal Memory write requires current Personal owner.
7. Enterprise Memory write requires OWNER/ADMIN/MEMBER; AUDITOR cannot write.
8. Cross-context promotion requires authority on both Contexts.
9. Promotion is authorization-deny-by-default.
10. Personal Agent Memory reads are bound to current Host-resolved Context.
11. Model/browser supplied Context ids cannot establish Memory authority.
12. No automatic cross-context Memory synchronization exists.
13. No Enterprise Agent is introduced.

## 17. Deferred

P0.9 does not yet implement:

- automatic learning/writeback from every chat;
- semantic embeddings/vector search;
- confidence scoring;
- contradiction resolution;
- memory deletion/retention policy;
- legal hold;
- private-field/redaction policy;
- multi-party approval for sensitive promotion;
- bulk import/export;
- EC ingestion/adapters;
- automated experience distillation;
- Memory UI/editor in Eidos.

## 18. Next mainline

With durable Context Memory authority now executable, the next major slice should make learning safe rather than merely make storage richer.

Recommended next:

1. Memory Proposal lifecycle generated by Personal Agent;
2. human accept/reject/edit before durable write;
3. evidence quality and confidence metadata;
4. contradiction/supersession assistance;
5. Eidos Memory review surface;
6. then EC-backed learning/adapters behind the same Context Memory contracts.

Do not bypass Context, Principal, Relationship or Authorization boundaries.
