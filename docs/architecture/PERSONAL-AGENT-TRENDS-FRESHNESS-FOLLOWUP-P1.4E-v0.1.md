# Personal Agent Trends + Memory Freshness Policy + Follow-up P1.4E v0.1

**Status:** implementation candidate  
**Date:** 2026-09-27  
**Depends on:** P1.4A Responsibility Policy, P1.4B Quality Evaluation, P1.4C Real Evidence, P1.4D Human/Lab Evaluation + Memory Quality

## 1. Purpose

P1.4E turns the evidence introduced in P1.4C/P1.4D into bounded longitudinal views, replaces the fixed Memory freshness window with explicit governance policy, and connects resolved Memory contradictions to non-authoritative Personal Agent follow-up work.

Three boundaries remain authoritative:

> Trend evidence describes observed change; it is not a composite quality score.

> Freshness Policy changes quality interpretation; it does not rewrite Memory.

> Personal Agent Follow-up is planning state; it cannot authorize or execute a Memory write.

## 2. Quality trend windows

Personal Agent quality now exposes fixed evidence windows:

- 7 days;
- 30 days;
- 90 days.

Each current window is compared with the immediately preceding window of equal length.

### Cohort rule

Window membership is determined by the timestamp of the matching `HOST_OBSERVED` interaction.

A Human or Lab evaluation appended later does not move an old interaction into a newer trend window.

This prevents delayed evaluation from contaminating recent product-quality evidence.

### Minimum evidence

P1.4E uses explicit minimum comparison thresholds:

- minimum Host interactions in both windows: 5;
- minimum evaluated interactions in both windows for subjective metrics: 3.

When thresholds are not met, the metric is returned as non-comparable with an explicit reason such as:

- `INSUFFICIENT_INTERACTIONS`;
- `INSUFFICIENT_EVALUATED_EVIDENCE`;
- `NO_DENOMINATOR`.

The system does not invent a direction when evidence is insufficient.

### Trend dimensions

Trend windows may compare:

- tool success rate;
- Human evaluation coverage;
- verified-completion rate;
- post-authorization continuation rate;
- unnecessary-clarification rate.

Each metric exposes current value, previous value and delta when comparable.

There is no overall trend verdict and no composite score.

## 3. Memory Freshness Policy

P1.4E introduces an append-only freshness policy store.

Policy events contain:

- policy id;
- Context;
- ACTIVE / RETIRED state;
- freshness window in days;
- optional Memory kinds;
- reason;
- occurrence time;
- actor.

Production persistence:

- `APP_PLATFORM_CONTEXT_MEMORY_FRESHNESS_POLICY_FILE`, or
- sibling `context-memory-freshness-policy.json` when `APP_PLATFORM_STATE_FILE` is used.

## 4. Freshness precedence

Freshness evaluation is deterministic.

For one Memory item:

1. active kind-specific policies matching the Memory kind are considered first;
2. if any kind-specific policy exists, Context-default policies are ignored for that Memory;
3. among policies at the same specificity, the shortest active window wins;
4. if no policy applies, P1.4D fallback remains 180 days.

This allows, for example, FACT and CLAIM records to have different review horizons without creating hidden priority rules.

## 5. Freshness policy authority

Formal commands:

- `context.memory.quality.freshness-policy.set`
- `context.memory.quality.freshness-policy.retire`

Both require:

1. Human Principal;
2. Personal owner or Enterprise OWNER/ADMIN governance authority;
3. explicit confirmation;
4. Host material-write authorization.

Updating a policy appends another event for the same policy id.

Retirement also appends an event.

Historical policy events are never rewritten.

## 6. Freshness policy Eidos flow

Routes:

- `/memory/quality/freshness-policies`
- `/memory/quality/freshness-policies/new`

The policy form uses the formal Eidos UIDL Form contract.

The policy list uses CatalogBrowser and exposes confirmed retirement through ActionHost.

`/memory/quality` now evaluates each Memory using the effective freshness policy rather than a single hard-coded window.

## 7. Personal Agent Follow-up

A confirmed Memory contradiction resolution may create a Personal Agent Follow-up.

The Follow-up is append-only planning state with:

- OPEN;
- COMPLETED;
- DISMISSED.

Current follow-up kinds:

- `REVIEW_PREFERRED_MEMORY`;
- `CLARIFY_MEMORY_CONTEXT`;
- `REVIEW_MEMORY_RESOLUTION`.

Production persistence:

- `APP_PLATFORM_PERSONAL_AGENT_FOLLOW_UP_FILE`, or
- sibling `personal-agent-follow-ups.json` when `APP_PLATFORM_STATE_FILE` is used.

## 8. Governance fact before planning follow-up

Contradiction resolution is authoritative quality-governance state.

Follow-up creation is not.

The execution order is therefore:

```text
Human-confirmed contradiction resolution
→ append contradiction resolution event
→ attempt Personal Agent Follow-up creation
```

If Follow-up persistence fails:

- contradiction resolution remains successful;
- the result explicitly exposes `followUpCreationError`;
- Memory and contradiction governance are not rolled back.

A planning-layer failure must never invalidate a completed governance decision.

## 9. Follow-up does not supersede Memory

For `PREFER_LEFT` or `PREFER_RIGHT`, the Follow-up asks Personal Agent to review whether a new Memory Proposal is warranted.

It never rewrites either Memory record.

For `BOTH_VALID`, the Follow-up may ask whether new contextual knowledge would clarify when both records are valid.

For `OTHER`, it requests review of the Human resolution.

Actual durable Memory change must still use the formal Memory Proposal → Human review → accept flow.

## 10. Agent integration

Personal Agent receives a new Host-provided read-only tool:

- `personal.follow-up.list`

The tool only returns OPEN Follow-ups for:

- current Principal;
- current active Context.

The Personal Agent home page may show up to three OPEN Follow-ups as suggested prompts.

The prompt instructs the Agent to inspect the Host follow-up tool before proposing action.

The Agent receives no new write authority.

## 11. Follow-up Eidos surface

Route:

- `/enterprise-agent/follow-ups`

The queue displays all current-Principal/current-Context Follow-ups.

OPEN items can:

- open Personal Agent;
- be marked complete;
- be dismissed.

Formal planning-state commands:

- `enterprise-agent.follow-up.complete`
- `enterprise-agent.follow-up.dismiss`

These commands are self-scoped Human planning actions.

They do not require material-write confirmation because they do not mutate business facts, Memory or governance truth.

## 12. Relationship to the responsibility model

P1.4E reinforces the intended Human/Agent split:

- the platform measures evidence without inventing certainty;
- policy configuration stays Human-governed;
- a Human governance decision can produce structured follow-up work;
- Personal Agent picks up that work automatically in its collaboration surface;
- any durable Memory change still returns to the formal authorization and review path.

## 13. Next work

After CI verification:

- add policy-driven freshness refresh workflows without mutating historical Memory;
- add reconciler/diagnostic support for rare Follow-up creation failures;
- use browser experience feedback to tune trend presentation and Follow-up UX;
- begin a deliberate vertical experience checkpoint covering install → Provider setup → Personal Agent → Memory review → governance → quality → follow-up without introducing demo-only UI.
