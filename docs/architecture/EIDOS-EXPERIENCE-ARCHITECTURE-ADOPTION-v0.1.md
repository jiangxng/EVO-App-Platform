# Eidos Experience Architecture Adoption v0.1

**Status:** Active App Platform gate  
**Date:** 2026-09-28  
**Eidos authority commit:** `9440d8c32b9f23eab2c55b0f58a8be711573da33`

## Purpose

EVO App Platform adopts the Eidos Experience Architecture Constitution as a product-quality authority above visual Design Language.

A page that renders or invokes a command is not automatically a complete Experience.

For bounded productive work, the review model is:

```text
Experience = Archetype + Goal + Subject + State + Journey + Actions + Feedback + Recovery + Agent Assistance
```

## Why App Platform needs a local gate

LLMs can lose context, change models, or enter the repository without the conversation that produced a feature. Therefore product completeness cannot depend on chat memory.

The App Platform keeps a machine-readable registry in:

`manager/experience-architecture-registry.ts`

and validates it with:

`npm run experience:validate`

The Platform CI runs this gate.

## Current critical surface classification

| Experience | Maturity | Archetype | Current posture |
|---|---|---|---|
| Personal Agent Chat | candidate | conversation | direct composer + Agent channel |
| Personal Agent Setup | candidate | setup | guided journey exists; internal capability wording still leaks into Human copy |
| Personal Agent Memory Review | candidate | review | direct actions exist; machine/debug values and visual pattern still need cleanup |
| LLM Provider Binding | candidate | editor | grouped Eidos settings; internal scope/runtime values need Human-layer treatment |
| LLM Provider Settings | candidate | editor | grouped runtime/credentials/administration |
| Personal Agent Quality | experimental | overview | engineering evidence surface, not yet product-certified |
| Personal Agent Quality Review | experimental | review | engineering evidence surface, not yet product-certified |
| Personal Agent Follow-ups | experimental | work-queue | useful capability but not yet product-certified |

## Ratchet rule

The file records known Experience Architecture diagnostics for current candidate pages.

**The baseline may shrink without Human approval when an issue is fixed.**

**The baseline MUST NOT expand without explicit Human approval.**

A new LLM may not make CI green by reclassifying a new defect as accepted debt.

## Non-visual review

Even without a browser, a reviewer must verify:

1. page archetype;
2. Human goal;
3. subject/state;
4. primary next action;
5. direct deterministic actions;
6. prerequisites/blockers;
7. post-action result;
8. completion;
9. recovery;
10. resume;
11. Human copy vs machine values;
12. localization;
13. Agent declared-action boundary;
14. progressive disclosure;
15. keyboard/touch completion path.

Pixel-level Human review remains the final visual check, not the only source of UX correctness.

## Migration direction

Current known debt should be removed through Eidos public capabilities/patterns, not App Platform private CSS.

The first product migrations are:

1. Personal Agent Memory Review — Human labels for machine review signals/IDs, Eidos Review visual hierarchy and action closure.
2. Personal Agent Setup / LLM Provider — remove internal capability language from the novice path and make the setup journey continue automatically/directly.
3. Provider Binding — keep advanced scope/runtime values behind progressive disclosure while preserving expert control.
4. Quality / Follow-up surfaces — migrate from experimental to candidate only after localization, interaction closure and direct-action review.
