# Documentation Lifecycle Governance v0.1

**Status:** Active architecture authority  
**Date:** 2026-10-01  
**Principle:** Preserve history selectively; keep current truth editable.

## 1. Decision

EVO documentation is NOT globally append-only.

The governing rule is:

> Historical evidence must not be erased, but current authority must be allowed to evolve.

Project memory is preserved by document class, not by freezing every document.

## 2. Document classes

### CURRENT_AUTHORITY

Answers: **What is true now?**

May be edited in place as architecture becomes clearer. It should converge toward the current canonical rule rather than accumulate obsolete alternatives.

Examples:

- `LLM.md`;
- `INVARIANTS.md`;
- `architecture.manifest.json`;
- active architecture constitutions/standards;
- active provider/plugin/Experience boundary documents.

A material semantic change to CURRENT_AUTHORITY SHOULD have a corresponding immutable Decision Record when the reason/history will matter to future engineering.

### DECISION_RECORD

Answers: **Why did we make or change this material decision?**

Append-only after acceptance except for non-semantic metadata such as `Superseded by`, broken links or obvious typo corrections.

A changed decision is represented by a new Decision Record that supersedes the old one.

Examples:

- major architecture direction changes;
- ownership-boundary changes;
- protocol strategy choices;
- deliberate exceptions to architecture constitutions.

### HISTORICAL_SNAPSHOT

Answers: **What was the project state/evidence at that point in time?**

Frozen after the represented milestone or proof completes. Do not rewrite it to match later architecture.

Examples:

- dated handoffs;
- milestone checkpoints;
- migration reports;
- production validation evidence;
- incident/postmortem evidence.

### VERSIONED_CONTRACT

Answers: **What exact contract did version N mean?**

Released versions are immutable in semantics. Compatible editorial clarifications must not alter behavior; incompatible behavior requires a new version.

Examples:

- Plugin Protocol schemas;
- public capability contracts;
- serialized data schemas;
- externally consumed protocol versions.

### LIVING_RUNBOOK

Answers: **What should an operator do now?**

May be edited in place as production procedures change. Historical execution results belong in separate evidence/snapshot records, not in stale procedure text.

### GENERATED_CURRENT_VIEW

Answers: **What is the current synthesized view?**

May be regenerated or overwritten from authoritative sources. It is not historical evidence by itself.

Examples:

- `docs/roadmap/HANDOFF-LATEST.md`;
- generated indexes;
- generated continuity summaries.

### CURRENT_STATUS

Answers: **What is the current execution state?**

May be updated in place. Important completed milestones are preserved separately as Decision Records or Historical Snapshots when future reasoning requires them.

Example:

- `project.status.json`.

## 3. History preservation rule

Do not preserve history merely by leaving obsolete statements in current authority documents.

Bad:

~~~text
current standard document
  section A: old rule
  section B: newer rule
  section C: newest exception
~~~

Preferred:

~~~text
CURRENT_AUTHORITY
  -> one current rule

DECISION_RECORD / HISTORICAL_SNAPSHOT
  -> why the rule changed
  -> previous state and evidence when it matters
~~~

This keeps fresh LLM context deterministic without erasing project memory.

## 4. When history is required

Create or preserve a historical record when a change materially affects one or more of:

- ownership boundary;
- public contract/protocol;
- data model or source-of-truth semantics;
- security/authorization model;
- lifecycle model;
- migration/replay compatibility;
- production architecture;
- externally observable behavior that future engineers may need to explain;
- a founder/Human architecture decision;
- an intentional exception to an invariant.

History is usually NOT required for:

- typo/grammar fixes;
- clearer wording that does not change semantics;
- formatting;
- link repair;
- generated index refresh;
- routine runbook maintenance whose old procedure has no continuing forensic value;
- implementation details already adequately preserved by Git history and not needed as architecture memory.

## 5. Supersession

Historical documents are not silently edited into the new truth.

When a Decision Record or Historical Snapshot is no longer current:

1. keep the old document;
2. add non-destructive metadata/link indicating `Superseded by` when useful;
3. create the new current authority or new Decision Record;
4. point the current architecture manifest/LLM bootstrap only to the current authority.

A fresh LLM should not need to read every superseded record to implement ordinary work.

## 6. Git history vs semantic history

Git history preserves file evolution but is not a substitute for architecture memory.

Use Git history for ordinary implementation evolution.

Use Decision Records/Historical Snapshots when the *reason* for a material change is important enough that a future LLM/Human should understand it without reconstructing commits and chats.

## 7. Fresh-chat rule

A fresh LLM reads CURRENT_AUTHORITY and CURRENT_STATUS first.

Historical records are loaded only when:

- the current authority links to them for rationale;
- the task is a migration/compatibility/forensics question;
- a current decision conflicts with an older implementation;
- the Human explicitly asks for history.

This prevents historical memory from overwhelming current execution context.

## 8. Default classification

When creating a new document, explicitly decide its class.

If unclear:

- standards/constitutions/current architecture -> CURRENT_AUTHORITY;
- material decision rationale -> DECISION_RECORD;
- dated state/proof -> HISTORICAL_SNAPSHOT;
- released API/schema -> VERSIONED_CONTRACT;
- operating procedure -> LIVING_RUNBOOK;
- generated index/summary -> GENERATED_CURRENT_VIEW.

Do not infer document class only from a `v0.1` filename.

## 9. Change rule

A material change to this documentation governance itself requires a new Decision Record explaining the change. The CURRENT_AUTHORITY document may then be updated in place.