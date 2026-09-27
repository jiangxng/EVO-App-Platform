# Personal Agent Quality + Retention Simulation P1.4 v0.1

**Status:** CI-verified implementation candidate  
**Date:** 2026-09-27  
**Depends on:** P1.4A Responsibility Policy, P1.3 Memory Governance

## 1. Purpose

P1.4B begins measuring whether Personal Agent collaboration actually follows the responsibility policy and adds side-effect-free retention-policy simulation before policy changes are committed.

Two rules are authoritative:

> Quality evaluation is evidence, not authority.

> Retention simulation is prediction, not governance state.

Neither may become a hidden execution path.

## 2. Agent quality evaluation

The evaluator records dimensions instead of one opaque score.

Current dimensions:

- unnecessary clarification;
- avoidable choice menu;
- executable work pushed back to the Human;
- continuation after authorization;
- verified completion;
- constructive-correction quality;
- tool success rate.

Subjective dimensions MUST remain `UNKNOWN` unless explicit evaluation evidence exists.

The platform must not infer “unnecessary clarification” from punctuation, message length or other weak heuristics merely to create a number.

Objective tool counts may be derived automatically.

Future Human/lab evaluators may supply explicit labels.

## 3. Why no composite score yet

A single score would hide materially different failure modes.

For example:

- asking one unnecessary question;
- failing to continue after authorization;
- claiming completion without evidence;

are not interchangeable.

P1.4B therefore exposes dimensions and signals only.

## 4. Retention simulation

`simulateContextMemoryRetentionV010` evaluates current Memory against:

- current governance;
- current retention policies;
- Legal Hold;
- optional candidate retention policy;
- a caller-supplied simulation time.

Possible outcomes:

- `ALREADY_EXPIRED`;
- `LEGAL_HOLD`;
- `WOULD_EXPIRE`;
- `WOULD_REMAIN_ACTIVE`;
- `NO_MATCHING_POLICY`.

The simulation returns current, candidate and effective deadlines when applicable.

## 5. Precedence

Simulation preserves production governance semantics:

1. explicit already-expired state remains expired;
2. active Legal Hold blocks retention-driven expiration;
3. current and candidate deadlines are compared;
4. earliest applicable deadline wins;
5. no matching policy means no simulated retention expiration.

Simulation never changes explicit RESTRICTED/EXPIRED state.

## 6. Side-effect-free guarantee

The simulation:

- never appends a governance event;
- never changes policy state;
- never changes Legal Hold state;
- never changes Memory;
- never writes operation evidence.

The formal action `context.memory.retention-policy.simulate` additionally compares governance/policy/hold snapshots before and after evaluation and fails if state changed.

It does not require material-write confirmation because it is a read/plan operation, but it is governance-sensitive and therefore remains restricted to Personal owner or Enterprise OWNER/ADMIN.

## 7. Eidos surface

The Memory Governance Experience now contains:

- `/memory/retention-simulation`

The current-policy dry-run is discoverable from Memory Governance.

This surface uses the same Host stores and authority checks as production governance.

It is not a demo projection.

Candidate-policy simulation is exposed through the formal Action Host command so future Eidos policy-editing UI can run a preview before committing the append-only policy event.

## 8. Relationship to responsibility policy

Retention simulation is a direct example of the P1.4A collaboration model:

- PLAN work is executed by the Agent/Host without asking the Human to calculate impact manually;
- the system presents evidence before a consequential WRITE;
- the Human retains policy authority;
- after authorization, formal policy actions remain the execution path.

## 9. Next work

After CI verification:

- persist/aggregate real Agent quality evidence from production interactions without pretending subjective labels are objective;
- add Human/lab evaluation ingestion;
- expose quality dimensions in an operational Eidos surface when meaningful evidence exists;
- integrate candidate retention simulation into a formal retention-policy editing flow;
- continue Memory quality metrics such as provenance/evidence freshness and contradiction resolution.

Do not create a fake quality dashboard before real evidence exists.
