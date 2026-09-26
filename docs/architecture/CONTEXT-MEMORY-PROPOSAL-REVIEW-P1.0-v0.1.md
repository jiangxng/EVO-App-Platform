# Context Memory Proposal Review P1.0 v0.1

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-27  
**Depends on:** Governed Context Memory P0.9  
**Eidos Review Queue baseline:** `fafff9808e82d5b1c1c6cf8dcbb9dd5602d165b9`

## 1. Purpose

P1.0 inserts an explicit Human review boundary between Personal Agent learning and durable Context Memory.

The core rule is:

```text
Personal Agent proposal
        ≠
durable Context Memory
```

The Personal Agent may stage candidate knowledge for review. Only a Human review decision can materialize that proposal into the P0.9 append-only Memory store.

## 2. Lifecycle

A Memory Proposal has this lifecycle:

```text
PENDING
  ├─→ ACCEPTED
  └─→ REJECTED
```

While PENDING, edits append immutable Proposal revisions.

After ACCEPTED or REJECTED, the Proposal is terminal and immutable.

Proposal state is stored separately from durable Context Memory.

## 3. Proposal creation

Personal Agent tool:

`context.memory.proposal.create`

Inputs:

- `kind`;
- `summary`;
- optional `evidenceRefs[]`;
- optional `proposedConfidence`;
- optional `observedAt`;
- optional `supersedesMemoryId`;
- optional `potentialContradictionMemoryIds[]`.

The tool is a Host-governed WRITE because it persists review state.

It does **not** write durable Memory.

Proposal staging does not require the second Human confirmation used by final materialization. It still requires:

1. a Host-resolved request Principal and Context;
2. Context Memory write authority for that Context;
3. Host `authorization.check` ALLOW for `context.memory.proposal.create`.

The model cannot establish or override the target Context. The proposal is bound to the current Host-resolved Active Context.

## 4. Human review

P1.0 review commands:

- `context.memory.proposal.edit`;
- `context.memory.proposal.accept`;
- `context.memory.proposal.reject`.

The Host re-resolves authority at review time. A Proposal is not grandfathered into access merely because it was created earlier.

The Proposal Context must still be in the current Principal's Host-offered Context set, and the Principal must still have Memory write authority there.

## 5. Editing

Editing a Proposal does not mutate the prior revision.

```text
Agent revision R1
       ↓ Human edit
Human revision R2
```

R1 remains immutable.

Editable P1.0 fields:

- Memory kind;
- summary.

Evidence references, proposed confidence, observation time and review references are retained when the Human edits wording/classification.

## 6. Accept

Accept is the durable Memory boundary.

Accept requires:

1. HUMAN Principal;
2. explicit confirmation;
3. current Context write authority;
4. `authorization.check` ALLOW for `context.memory.proposal.accept`;
5. a separate `authorization.check` ALLOW for `context.memory.record`.

This dual authorization prevents Proposal approval policy from implicitly granting durable Memory write authority.

The latest Proposal revision is materialized as a normal P0.9 immutable DIRECT Memory record.

## 7. Idempotent materialization

Accepted Memory uses a deterministic materialization identity derived from Proposal identity:

`memory:proposal:<proposalId>`

This protects the retry boundary:

```text
Memory write succeeds
Proposal ACCEPTED save fails
        ↓ retry
existing matching Memory is reused
Proposal finalizes without duplicate Memory
```

If an existing deterministic Memory does not match the Proposal revision, acceptance fails closed with a materialization conflict.

## 8. Reject

Reject requires:

- HUMAN Principal;
- explicit confirmation;
- current Context write authority;
- `authorization.check` ALLOW.

Reject creates no durable Memory.

A REJECTED Proposal is terminal and cannot later be edited or accepted.

## 9. Evidence quality

P1.0 evidence quality is deliberately conservative:

- `UNVERIFIED` — no evidence references were supplied;
- `REFERENCED` — one or more evidence references were supplied.

`REFERENCED` means **references exist**.

It does not mean:

- the evidence is true;
- the evidence is authoritative;
- the evidence independently proves the proposal.

Source verification and evidence trust scoring are future capabilities.

## 10. Proposed confidence

`proposedConfidence` is optional and bounded to `0..1`.

It is proposal metadata supplied by the proposing intelligence/path.

It is **not**:

- Host truth;
- authorization;
- automatic acceptance criteria;
- a probability guaranteed to be calibrated.

The Human may use it as supporting review context only.

## 11. Contradiction, duplicate and supersession assistance

P1.0 emits review signals:

- `POTENTIAL_DUPLICATE`;
- `POTENTIAL_CONTRADICTION`;
- `SUPERSESSION_CANDIDATE`.

These are assistance signals, never automatic truth decisions.

Current deterministic behavior:

- exact normalized summary match can flag a potential duplicate;
- explicit contradiction Memory ids are verified to exist and shown as potential contradictions;
- `supersedesMemoryId` is verified and shown as a supersession candidate.

P1.0 does not automatically decide that two statements contradict each other.

## 12. Eidos Review Queue

Eidos owns the reusable presentation pattern, not Memory semantics.

Eidos baseline:

`fafff9808e82d5b1c1c6cf8dcbb9dd5602d165b9`

Generic pattern:

`review-queue@0.1.0`

App Platform maps Memory Proposal state into the generic Review Queue:

- editable kind and summary;
- evidence references;
- confidence/evidence/signal/Context metrics;
- Accept as primary action;
- Save edit and Reject as secondary actions.

Eidos only renders and dispatches interactions through ActionHost.

App Platform owns:

- proposal semantics;
- Context authority;
- authorization;
- revision history;
- Memory materialization.

## 13. Four-locale completion

Memory Review UI is implemented simultaneously for:

- `en`;
- `zh-CN`;
- `ja`;
- `zh-TW`.

Localized:

- page title/description/empty state;
- review statuses;
- metrics;
- field labels;
- Memory kind labels;
- action labels;
- Personal Agent chat proposal guidance.

Not localized:

- Proposal ids;
- Memory ids;
- Context ids;
- command ids;
- field keys;
- Memory kind enum values.

## 14. Chat experience

After Personal Agent successfully stages a Memory Proposal, Chat presents it as a **review proposal**, not as completed learning.

The reply directs the Human to:

`/enterprise-agent/memory`

The assistant-facing message explicitly states that durable Context Memory is created only after Human review and acceptance.

## 15. Persistence

Reference Proposal persistence:

- `APP_PLATFORM_CONTEXT_MEMORY_PROPOSALS_FILE`, or
- `context-memory-proposals.json` beside App Platform lifecycle state,
- in-memory fallback.

Proposal persistence is independent of `context-memory.json`.

This separation makes it impossible to treat a pending proposal as committed Memory merely by reading the Memory Provider.

## 16. Security and authority invariants

1. Proposal is not durable Memory.
2. Model-supplied Context ids do not establish Proposal or Memory authority.
3. Proposal creation is bound to Host-resolved Active Context.
4. Proposal review revalidates current Context access and Memory write authority.
5. AUDITOR remains unable to materialize Enterprise Memory.
6. Proposal revisions are append-only.
7. Terminal Proposal decisions are immutable.
8. Accept requires explicit Human confirmation.
9. Accept requires both Proposal authorization and normal Memory-record authorization.
10. Reject never writes Memory.
11. Review signals do not automatically decide truth.
12. Proposed confidence does not establish truth or authorization.
13. Accepted Memory remains governed by P0.9 provenance/attribution/append-only invariants.
14. No Enterprise Agent is introduced.

## 17. Deferred

P1.0 does not yet implement:

- semantic contradiction detection;
- calibrated confidence models;
- evidence-source trust verification;
- evidence extraction pipelines;
- automated proposal batching/deduplication;
- sensitive-data classification/redaction;
- retention/deletion/legal-hold policy;
- multi-party approval;
- autonomous durable Memory acceptance;
- EC ingestion/adapters.

## 18. Next mainline

The next slice should move from safe review to safe large-scale learning:

1. governed Memory intake/source adapters;
2. evidence-source identity and trust metadata;
3. proposal batching/deduplication before Human review;
4. retrieval quality and semantic search behind the Memory Reader contract;
5. EC adapter boundary for long-term learning and industry knowledge;
6. retention/privacy governance before broader autonomous ingestion.

Human acceptance remains the final durable-write boundary unless a future explicitly governed policy introduces another approval model.
