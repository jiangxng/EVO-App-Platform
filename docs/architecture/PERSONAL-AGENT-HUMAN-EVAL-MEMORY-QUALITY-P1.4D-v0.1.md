# Personal Agent Human/Lab Evaluation + Memory Quality P1.4D v0.1

**Status:** CI-verified implementation candidate  
**Date:** 2026-09-27  
**Depends on:** P1.4A Responsibility Policy, P1.4B Quality Evaluation, P1.4C Real Quality Evidence

## 1. Purpose

P1.4D adds explicit Human/Lab evaluation ingestion for subjective Personal Agent collaboration quality and introduces an append-only Memory Quality overlay for evidence trust, observation freshness and contradiction lifecycle.

Two principles remain authoritative:

> Evaluation evidence may describe product quality but cannot grant Agent authority.

> Memory Quality may describe and govern relationships around immutable Memory, but may not rewrite Memory facts.

## 2. Human and Lab evaluation

The formal ActionHost command is:

- `enterprise-agent.quality.evaluate`

Evaluation is only allowed when a matching `HOST_OBSERVED` interaction already exists.

The evaluator cannot create a synthetic interaction.

### Human evaluation

A Human evaluator:

- may evaluate only their own interaction;
- must be operating in the same active Context;
- may add explicit subjective labels;
- does not overwrite Host-observed tool evidence.

### Lab evaluation

A Lab evaluation:

- must originate from a non-Human Principal;
- must identify the target Human subject;
- must reference a matching Host-observed interaction;
- requires Host authorization for `enterprise-agent.quality.lab-evaluate`.

Human and Lab evidence remain separately attributable.

## 3. Objective versus subjective aggregation

Objective tool metrics are aggregated only from `HOST_OBSERVED` events.

They are never double-counted when Human or Lab evaluation is later appended.

Subjective collaboration metrics use the latest explicit evaluation for an interaction with this precedence:

1. Human evaluation;
2. Lab evaluation;
3. Host observation, which normally leaves subjective dimensions UNKNOWN.

This means Human experience remains the final subjective product-quality evidence when available.

No composite quality score is introduced.

## 4. Human review surface

Personal Agent exposes:

- `/enterprise-agent/quality`
- `/enterprise-agent/quality/review`

The review page uses the formal Eidos ReviewQueue contract.

It only lists real Host-observed interactions matching:

- current Principal;
- current active Context.

The Human may evaluate:

- whether clarification occurred;
- whether clarification was necessary;
- avoidable option menus;
- executable work pushed back to the Human;
- whether authorization was required/granted;
- whether the Agent continued after authorization;
- whether completion was actually verified;
- whether the Agent corrected the approach;
- whether correction preserved the Human's valid goal.

UNKNOWN is an explicit first-class value.

## 5. Memory Quality overlay

Memory Quality is a separate append-only overlay.

It does not modify `ContextMemoryItemV010`.

Current quality dimensions:

- evidence reference count;
- evidence source metadata count;
- Host-verified / declared / unverified source counts;
- effective source trust;
- observation freshness;
- open contradiction count;
- explicit quality signals.

No aggregate score is used.

## 6. Evidence trust

Evidence trust is derived from immutable provenance metadata.

Effective trust is:

- `HOST_VERIFIED` when all described sources are Host-verified;
- `DECLARED` when no source is unverified but at least one is only declared;
- `UNVERIFIED` when any source is unverified;
- `UNKNOWN` when source metadata does not exist.

This is descriptive evidence state, not a truth score.

## 7. Observation freshness

Freshness uses `observedAt`, not `recordedAt`.

Recording something recently does not imply that the underlying observation is recent.

States:

- `FRESH`;
- `STALE`;
- `UNKNOWN`.

The evaluation uses a configurable freshness window. P1.4D defaults to 180 days when no explicit window is supplied.

Missing `observedAt` remains UNKNOWN.

## 8. Contradiction lifecycle

Potential contradiction signals already produced during Memory Proposal review are promoted into a durable append-only quality lifecycle when the Proposal is accepted.

States:

- `OPEN`;
- `RESOLVED`;
- `DISMISSED`.

A contradiction links two immutable Memory records.

Resolution values:

- `PREFER_LEFT`;
- `PREFER_RIGHT`;
- `BOTH_VALID`;
- `OTHER`.

These values do **not** perform Memory supersession.

If actual supersession is needed, the system must use the formal new-Memory / Proposal path.

## 9. Contradiction authority

Formal command:

- `context.memory.quality.contradiction.resolve`

Resolution or dismissal requires:

1. Human Principal;
2. Personal owner or Enterprise OWNER/ADMIN governance authority;
3. explicit confirmation;
4. Host material-write authorization;
5. both Memory records still present in the active Context;
6. current contradiction state = OPEN.

The result appends a quality event only.

Memory records are unchanged.

## 10. Eidos Memory Quality surfaces

Memory Governance now exposes:

- `/memory/quality`
- `/memory/quality/contradictions`

The quality page shows Memory-level evidence/freshness/trust/contradiction dimensions.

The contradiction page uses Eidos ReviewQueue and allows confirmed resolution or dismissal.

There is no demo-only data path.

## 11. Quality signals

P1.4D can emit:

- `EVIDENCE_REFS_MISSING`;
- `EVIDENCE_SOURCE_METADATA_MISSING`;
- `EVIDENCE_SOURCE_UNVERIFIED`;
- `OBSERVATION_TIME_MISSING`;
- `OBSERVATION_STALE`;
- `OPEN_CONTRADICTION`.

These are review signals, not truth verdicts.

## 12. Next work

After CI verification:

- add bounded quality trend windows only after real evaluation volume exists;
- make freshness policy configurable by Memory kind / enterprise policy rather than one default window;
- add source-evidence refresh workflows without mutating historical Memory;
- connect contradiction resolution to follow-up Agent work when a new superseding Memory should be proposed;
- use Human browser feedback before expanding quality governance to additional domains.
