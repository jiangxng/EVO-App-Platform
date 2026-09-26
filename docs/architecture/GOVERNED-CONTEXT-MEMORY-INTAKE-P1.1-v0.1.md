# Governed Context Memory Intake P1.1 v0.1

**Status:** CI-verified implementation baseline  
**Date:** 2026-09-27  
**Depends on:** Context Memory P0.9 + Human-reviewed Memory Proposals P1.0  
**Scope:** source adapters, evidence-source identity/trust, intake receipts, proposal deduplication, retrieval strategy foundation, EC adapter boundary

## 1. Purpose

P1.1 opens Context Memory to external learning sources without allowing any external system to bypass Human-reviewed Memory governance.

The core pipeline is:

```text
External / internal knowledge source
  ↓
ContextMemoryIntakeSourceAdapterV010
  ↓
Evidence Source identity + trust metadata
  ↓
governed intake action
  ↓
append-only Intake Receipt
  ↓
PENDING Memory Proposal
  ↓
P1.0 Human review
  ↓
P0.9 durable Context Memory
```

External intake never writes durable Memory directly.

## 2. New platform capabilities

P1.1 adds two replaceable capabilities:

- `context.memory.intake-source`
- `context.memory.evidence-source`

Reference package:

- `host-memory-intake-provider`

Reference Provider ids:

- `host.memory-intake-source`
- `host.memory-evidence-source`

Reference configuration:

- `APP_PLATFORM_MEMORY_INTAKE_JSON`

The reference Provider exists to prove the contract. It is not the only allowed intake implementation.

## 3. Source Adapter contract

`ContextMemoryIntakeSourceAdapterV010` exposes:

- stable Provider id;
- stable `sourceId`;
- bounded pull by Host-resolved Context;
- cursor;
- limit;
- source records.

Each intake record contains:

- `sourceId`;
- stable source-local `sourceRecordId`;
- target Context reference;
- Memory kind;
- summary;
- evidence refs;
- optional observed time;
- optional proposed confidence;
- optional supersession/contradiction hints;
- primitive source attributes.

The Adapter proposes knowledge. It does not decide truth and does not write Memory.

## 4. Experience Compiler boundary

Experience Compiler is one possible source type:

`EXPERIENCE_COMPILER`

EC integration rule:

> EC may implement the generic Context Memory Intake Source Adapter contract. App Platform must not import, call, or depend on EC internal data models or learning implementation.

Conceptually:

```text
EC internals
  ↓ adapter owned by EC/integration package
ContextMemoryIntakeSourceAdapterV010
  ↓
App Platform governed intake
```

Switching EC implementation or model must not change App Platform Memory governance.

## 5. Evidence Source identity

P1.1 introduces `ContextMemoryEvidenceSourceV010`.

Source types:

- HUMAN
- APPLICATION
- DOCUMENT
- EXTERNAL_SYSTEM
- EXPERIENCE_COMPILER

Evidence source metadata survives Proposal review and, after Human acceptance, is copied into durable Memory provenance.

This allows future Memory readers to answer not only “what evidence ref exists?” but also “which identified source produced it?”

## 6. Source trust

Trust levels:

- `UNVERIFIED`
- `DECLARED`
- `HOST_VERIFIED`

Meaning:

### UNVERIFIED

A source identifier exists, but the Host has not established source identity/integrity assurance.

### DECLARED

The source has been deliberately configured/declared by Host governance, but no stronger verification is asserted.

### HOST_VERIFIED

Host policy asserts that the source identity/integrity has passed a configured verification process.

Critical rule:

> Source trust is not content truth.

`HOST_VERIFIED` does **not** mean:

- every statement from the source is true;
- the source is unbiased;
- the source is authoritative for every topic;
- a Proposal should be automatically accepted.

Even a HOST_VERIFIED source produces a PENDING Proposal requiring Human review.

## 7. Governed intake action

Command:

`context.memory.intake.run`

Requirements:

1. request-bound HUMAN Principal;
2. explicit confirmation;
3. Host-resolved Active Context;
4. current Principal has Context Memory write authority;
5. effective Intake Source Adapter exists;
6. `authorization.check` ALLOW for `context.memory.intake.run`.

The action may stage multiple Proposals but cannot create durable Memory.

Enterprise Context write authority remains:

- OWNER;
- ADMIN;
- MEMBER.

AUDITOR remains read-only and cannot run Enterprise Memory intake.

## 8. Intake receipts

P1.1 introduces append-only `ContextMemoryIntakeReceiptV010`.

A receipt records:

- source id;
- source record id;
- Context;
- deterministic knowledge fingerprint;
- outcome;
- Proposal id;
- duplicate reference when applicable;
- evidence-source metadata;
- ingestion time;
- Human Principal that authorized the intake run.

Receipt persistence:

- `APP_PLATFORM_CONTEXT_MEMORY_INTAKE_FILE`, or
- `context-memory-intake.json` beside the platform lifecycle state,
- in-memory fallback.

Existing receipts cannot be edited or deleted.

## 9. Retry idempotency

Source identity is:

```text
sourceId + sourceRecordId
```

Each intake source record maps to a deterministic Proposal identity.

Therefore:

```text
Proposal persisted
Receipt persistence fails
  ↓ retry
same deterministic Proposal id
  ↓
reuse matching Proposal
  ↓
no duplicate Proposal
```

If the same deterministic Proposal id is reused with materially different candidate content, the service fails closed with an idempotency conflict.

## 10. Proposal deduplication before Human review

P1.1 performs deterministic pending-Proposal deduplication.

Fingerprint includes the candidate semantic identity:

- Context;
- Memory kind;
- normalized summary;
- observed time;
- supersession target;
- contradiction hints.

Evidence refs are deliberately **not** part of the candidate fingerprint.

Therefore two source records that propose the same candidate knowledge but carry different evidence may converge into one PENDING Proposal.

New evidence is appended as a new immutable Proposal revision.

No previous Proposal revision is rewritten.

## 11. Terminal Proposal rule

Deduplication only merges into a PENDING Proposal.

Once a Proposal is:

- ACCEPTED; or
- REJECTED;

it is terminal.

A later source record with equivalent candidate content does not silently rewrite or enrich that terminal decision. It may stage a new reviewable Proposal.

This keeps post-decision evidence changes visible to Humans.

## 12. Intake is not acceptance

The following are all insufficient to create durable Memory:

- source trust = HOST_VERIFIED;
- high proposed confidence;
- no duplicate signals;
- no contradiction signals;
- EC-generated knowledge;
- successful intake action.

Only P1.0 Human acceptance may materialize the Proposal through the P0.9 Memory Writer.

## 13. Evidence provenance through materialization

For source-backed Proposals, the latest Proposal revision contains:

- evidence refs;
- evidence source descriptors;
- source trust metadata.

When a Human accepts the Proposal, these are preserved in durable Memory provenance.

Memory attribution still records the Human Principal who accepted/materialized the durable record.

This preserves the distinction:

```text
Provenance = where the knowledge/evidence came from
Attribution = who caused durable Memory to be written
```

## 14. Review Queue UX

The P1.0 Eidos Review Queue now surfaces source trust counts:

- Host-verified sources;
- Declared sources;
- Unverified sources.

These human-facing labels are implemented in:

- en
- zh-CN
- ja
- zh-TW

Stable machine values such as `sourceId`, `sourceType`, and trust enums are not localized.

An UNVERIFIED evidence source marks the Proposal as needing attention.

## 15. Retrieval strategy foundation

The `ContextMemoryReaderV010` request now carries an explicit retrieval strategy:

- `LEXICAL`
- `SEMANTIC`
- `HYBRID`

The P1.1 reference Host reader implements only deterministic `LEXICAL`.

It returns explicit ranking metadata:

- score;
- ranking signals;
- `strategyUsed`.

The reference Provider fails closed when SEMANTIC or HYBRID is requested.

There is no silent retrieval fallback.

This means a future semantic/vector Provider can implement the same Reader contract without changing Personal Agent Memory semantics.

## 16. Current lexical ranking

Reference lexical signals include:

- `SUMMARY_EXACT`;
- `SUMMARY_CONTAINS`;
- `EVIDENCE_REF_CONTAINS`;
- `RECENCY_ORDER` when no query is supplied.

Scores are deterministic reference ranking values.

They are not semantic confidence and do not measure truth.

## 17. Security and authority invariants

1. Intake never directly writes durable Memory.
2. Intake is bound to the Host-resolved Active Context.
3. Source Adapter cannot manufacture Context authority.
4. Human confirmation is required for an intake run.
5. Context Memory write authority is revalidated before intake.
6. Authorization Provider must explicitly ALLOW the intake action.
7. AUDITOR cannot run Enterprise Memory intake.
8. Source trust does not imply content truth.
9. Intake receipts are append-only.
10. Source record retry is idempotent.
11. Pending duplicate candidates merge evidence through append-only Proposal revisions.
12. Terminal Proposals are never silently enriched.
13. Human review remains the final durable-write boundary.
14. Semantic retrieval is not silently emulated by lexical retrieval.
15. App Platform does not depend on Experience Compiler internals.
16. No Enterprise Agent is introduced.

## 18. Deferred

P1.1 does not yet implement:

- a production EC adapter package;
- OAuth/API credentials for external intake sources;
- scheduled autonomous intake;
- source-specific cryptographic attestation;
- content truth scoring;
- calibrated source reputation;
- sensitive-data classification/redaction;
- retention/deletion/legal hold;
- semantic/vector retrieval implementation;
- embedding Provider selection;
- large-scale batching/backpressure;
- multi-party approval;
- autonomous Memory acceptance.

## 19. Next mainline

Recommended next slice:

1. retention/privacy governance for Memory, Proposal, and Intake Receipt data;
2. sensitive-data classification/redaction boundary;
3. production semantic/hybrid Memory Reader Provider behind the P1.1 strategy contract;
4. production EC adapter package using the generic intake contract;
5. source credentials/health/backpressure and scheduled governed intake;
6. evidence verification/attestation where sources support it.

Human review remains the durable Memory acceptance boundary.
