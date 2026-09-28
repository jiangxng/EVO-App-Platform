# Eidos Experience Architecture Adoption v0.1

**Status:** Active App Platform gate  
**Date:** 2026-09-28  
**Eidos Experience Architecture authority:** `9440d8c32b9f23eab2c55b0f58a8be711573da33`  
**Eidos Review / Decision pattern:** `82dcea59abf14518394fd605faf5b741e57a7ef0`  
**Eidos Journey Continuation:** `b937d45e6149dc16bdd2f0f6141df468f9014bda`

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
| Personal Agent Setup | candidate | setup | novice task language; provider selection/settings save resume the Setup journey through Eidos Journey Continuation |
| Personal Agent Memory Review | candidate | review | Eidos Review/Decision pattern; Human decision layer separated from collapsed machine/diagnostic detail |
| LLM Provider Binding | candidate | editor | AI-service-first default path; scope/runtime/administrator controls progressively disclosed as Advanced |
| LLM Provider Settings | candidate | editor | grouped runtime/credentials/administration |
| Personal Agent Quality | experimental | overview | engineering evidence surface, not yet product-certified |
| Personal Agent Quality Review | experimental | review | engineering evidence surface, not yet product-certified |
| Personal Agent Follow-ups | experimental | work-queue | useful capability but not yet product-certified |

## Ratchet rule

The file records known Experience Architecture diagnostics for current candidate pages. The current machine-validator baseline is empty after Foundation UX Pass 1; new diagnostics therefore fail closed instead of being normalized as existing debt.

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

Foundation UX Pass 1 closes the first three candidate-surface debts through public Eidos patterns:

1. Personal Agent Memory Review — Human labels for review signals, machine identifiers under Technical details, first-class Review/Decision hierarchy.
2. Personal Agent Setup / LLM Provider — novice task language plus Journey Continuation for provider binding/settings save.
3. Provider Binding — AI-service-first default path with scope/runtime/administrator controls under progressive disclosure.

Remaining work is not hidden:

- first-run Provider discovery/install from the general Plugin Store still needs a precise install-completion continuation that cannot accidentally trigger on an unrelated plugin install;
- Quality / Quality Review / Follow-up surfaces remain explicitly `experimental` until localization, journey/action closure and direct-operation review are complete.

Do not promote these items by changing maturity labels alone.
