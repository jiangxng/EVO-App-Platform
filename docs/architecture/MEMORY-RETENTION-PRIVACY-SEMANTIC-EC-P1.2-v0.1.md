# Memory Retention, Privacy, Semantic Retrieval and EC Adapter P1.2 v0.1

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-27  
**Depends on:** P0.9 governed Context Memory, P1.0 Human review, P1.1 governed intake  
**World model:** Human → Personal Agent → Host-resolved Context → governed Memory

## 1. Purpose

P1.2 adds three production-oriented boundaries without weakening the Person-first model:

1. retention/privacy governance over immutable Memory;
2. replaceable semantic retrieval;
3. a production HTTP intake adapter for Experience Compiler.

The Memory record itself remains immutable.

## 2. Retention and privacy are overlays, not Memory mutation

P0.9 established append-only Memory records. P1.2 preserves that invariant.

A retention/privacy change writes a separate append-only governance event:

```text
Memory
  unchanged
    +
Governance Event 1
Governance Event 2
Governance Event 3
  ↓
latest effective governance decision
```

This separates:

- historical knowledge fact;
- current retrieval/privacy policy.

## 3. Governance states

Memory governance state:

- `ACTIVE`
- `RESTRICTED`
- `EXPIRED`

Privacy class:

- `STANDARD`
- `SENSITIVE`
- `RESTRICTED`

Optional `retainUntil` is evaluated at read time.

If the latest governance event has a retention time in the past, the effective state becomes `EXPIRED` without rewriting either the Memory or the governance event.

## 4. Retrieval rules

The Host Context Memory Reader applies governance before lexical, semantic, or hybrid ranking.

Default Agent-visible rule:

```text
state == ACTIVE
AND privacyClass != RESTRICTED
```

Therefore:

- RESTRICTED Memory is excluded from Agent retrieval;
- EXPIRED Memory is excluded from Agent retrieval;
- SENSITIVE Memory remains Context-visible in P1.2 but retains its classification for stricter future policy.

The semantic Provider never receives hidden candidates.

## 5. Governance write command

Command:

`context.memory.governance.set`

Input:

- `memoryId`
- `state`
- `privacyClass`
- optional `retainUntil`
- optional `reason`

Requirements:

1. request-bound HUMAN Principal;
2. explicit confirmation;
3. Memory belongs to current Host-resolved Context;
4. Personal Context: current owner;
5. Enterprise Context: ACTIVE OWNER or ADMIN;
6. `authorization.check` ALLOW for `context.memory.governance.set`.

MEMBER may contribute Enterprise Memory under P0.9 but cannot change Enterprise retention/privacy governance.

AUDITOR remains read-only.

## 6. Governance history

Governance events are append-only.

A later event may make a previously restricted Memory ACTIVE again, but historical restriction remains recorded.

This is not mutation or deletion of prior policy evidence.

## 7. Physical deletion

P1.2 does not claim legal/physical deletion.

RESTRICTED/EXPIRED suppress retrieval while retaining immutable evidence.

Future compliance work may add cryptographic erasure, storage-tier deletion or legal-hold policy, but those must be explicit mechanisms rather than pretending logical suppression equals physical deletion.

## 8. Semantic retrieval Provider

P1.2 adds:

`context.memory.semantic-retrieval`

Contract:

`ContextMemorySemanticRetrieverV010`

The Host passes only already-authorized candidates:

- Memory id;
- summary;
- kind;
- evidence refs.

The Provider returns ranked Memory ids with normalized scores in `[0,1]` and explanatory signals.

The Provider cannot introduce an id outside the candidate set.

Invalid or duplicate ranking ids fail closed.

## 9. SEMANTIC and HYBRID

Reader strategies:

- `LEXICAL`
- `SEMANTIC`
- `HYBRID`

LEXICAL remains Host deterministic behavior.

SEMANTIC requires an effective semantic Provider and a non-empty query.

HYBRID combines:

```text
50% Host lexical score
+
50% semantic Provider score
```

P1.2 deliberately keeps this fusion formula simple and explicit. Ranking policy can later become a replaceable policy contract.

If no semantic Provider is available, SEMANTIC/HYBRID fail closed rather than silently pretending lexical search is semantic search.

## 10. Remote semantic adapter

Reference optional Provider:

- package: `remote-context-memory-semantic-provider`
- provider: `remote.context-memory-semantic`
- configuration: `APP_PLATFORM_MEMORY_SEMANTIC_URL`
- optional timeout: `APP_PLATFORM_MEMORY_SEMANTIC_TIMEOUT_MS`
- optional secret: `remote-context-memory-semantic-provider/apiToken`

Transport:

`HTTP POST`

Bearer credential is resolved through Host Secrets and is never browser-owned.

If a configured secret cannot be resolved, the Provider fails closed instead of downgrading to anonymous access.

## 11. Semantic security boundary

The remote semantic service is a ranking service, not a Memory authority.

The Host performs first:

1. Principal resolution;
2. Context resolution;
3. Grant/Relationship filtering;
4. Memory Context isolation;
5. retention/privacy filtering.

Only then are candidate summaries sent to semantic ranking.

A remote semantic service cannot request another Context or recover suppressed Memory through the Provider contract.

## 12. Experience Compiler production intake adapter

P1.1 defined the generic source contract.

P1.2 adds the production adapter package:

- package: `experience-compiler-memory-intake-provider`
- intake provider: `experience-compiler.memory-intake`
- evidence provider: `experience-compiler.evidence-source`
- configuration: `APP_PLATFORM_EC_MEMORY_INTAKE_JSON`
- optional secret: `experience-compiler-memory-intake-provider/apiToken`

The configuration defines:

- HTTP endpoint;
- stable source id;
- display name;
- trust level;
- trust policy metadata;
- timeout.

`sourceType` is fixed to `EXPERIENCE_COMPILER`.

## 13. EC HTTP contract

The Host POSTs the generic intake request:

```text
contractVersion
context
cursor?
limit?
```

EC responds with:

```text
contractVersion
records[]
nextCursor?
```

Each record remains a `ContextMemoryIntakeRecordV010`.

The adapter validates stable source identity and response shape.

App Platform has no dependency on:

- EC storage schema;
- EC learning algorithm;
- EC ontology internals;
- EC model vendor;
- EC crawler implementation.

## 14. EC cannot write durable Memory

The production EC adapter plugs into the same P1.1 intake service:

```text
EC
 ↓
ContextMemoryIntakeSourceAdapter
 ↓
PENDING Memory Proposal
 ↓
Human review
 ↓
Accept / edit / reject
 ↓
durable Memory only after accept
```

EC therefore remains an evidence/experience source, not a direct Memory authority.

No external intake adapter receives a direct Writer capability.

## 15. EC trust is not truth

`HOST_VERIFIED` means the Host verified the source identity/integration according to policy.

It does not mean:

- the source content is true;
- the learned conclusion is correct;
- the proposal should be accepted.

Truth/quality judgment remains part of review and future evidence policy.

## 16. Provider ambiguity

Multiple Providers may exist for:

- semantic retrieval;
- Memory intake source;
- evidence source.

Existing Provider binding rules apply.

Ambiguous multiple effective Providers fail closed unless an explicit binding resolves the capability.

This allows a customer to choose EC, another knowledge system, or another vector service without changing Personal Agent core.

## 17. Security invariants

1. Memory records remain immutable.
2. Retention/privacy state is append-only governance evidence.
3. Restricted/expired Memory is filtered before any ranking Provider.
4. Semantic Provider cannot introduce unauthorized candidate ids.
5. SEMANTIC/HYBRID never silently degrade to lexical behavior.
6. Enterprise retention/privacy governance requires OWNER/ADMIN.
7. Every governance mutation requires Human confirmation and Authorization ALLOW.
8. Remote credentials remain in Host Secrets.
9. EC intake is proposal-only.
10. EC cannot directly write durable Context Memory.
11. Source trust is identity/integrity assurance, not truth.
12. No Enterprise Agent is introduced.

## 18. Deferred

P1.2 does not yet implement:

- physical/cryptographic deletion;
- legal hold;
- jurisdictional retention policy;
- field-level redaction;
- per-Memory encryption keys;
- scheduled automatic expiration jobs;
- semantic vector index owned by App Platform;
- ranking model governance/evaluation;
- automatic EC intake schedule;
- multi-source merge policy;
- enterprise DLP classifier;
- Memory governance UI in Eidos.

## 19. Next mainline

Recommended next slice:

1. scheduled governed intake;
2. retention policy templates and legal hold;
3. sensitive-data / DLP classification Provider;
4. Memory governance and search controls in Eidos;
5. semantic retrieval evaluation/observability;
6. EC source selection and operational health UX.

The stable rule remains:

> External systems may propose or rank; Host Context authority and Human review decide durable enterprise/personal Memory.
