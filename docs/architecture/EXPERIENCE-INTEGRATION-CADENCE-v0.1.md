# Experience Integration Cadence v0.1

**Status:** authoritative engineering/product rule  
**Date:** 2026-09-27

## Purpose

EVO development must avoid two opposite failure modes:

1. horizontal architecture expansion that remains technically elegant but cannot be experienced as a coherent product;
2. demo-driven UI work that bypasses real contracts, real Host authority or real lifecycle state.

The operating model is:

> Big-step vertical closure + frequent verification + selective experience checkpoints.

This is not a requirement to build UI for every internal change.

## Completion model

A capability is product-complete only when the meaningful user lifecycle can be expressed through formal system boundaries.

The preferred lifecycle is:

```text
Discover
→ Install
→ Installed
→ Needs setup
→ Configure / Select Provider
→ Host Secret configuration
→ Ready
→ Open
→ Use
→ Observe
→ Govern
→ Diagnose / Recover
```

Not every Package needs every state, but when a state is meaningful it must not be replaced with demo-only behavior.

## No demo bypasses

Experience checkpoints MUST use:

- real Package/Feature lifecycle;
- real Eidos public contracts;
- real Host capability resolution;
- real Provider bindings;
- real Host Secrets;
- real Principal / Context / authorization rules;
- real Memory governance;
- real action routing.

Experience checkpoints MUST NOT use:

- fake install state;
- hard-coded Ready state;
- UI-only Provider selection;
- browser-owned Secret state;
- fake Memory that bypasses the Memory Provider;
- demo-only routes that duplicate production behavior;
- direct storage access from Eidos;
- temporary authorization bypasses.

## LLM development cadence

LLM-native development does not need human-sized micro-iterations.

Prefer:

1. stabilize the smallest durable contract boundary;
2. implement a meaningful vertical slice across Host + Provider + Eidos + tests;
3. expose it for Human product judgment once the experience can reveal product-direction errors;
4. use that judgment to correct the next slice;
5. avoid repeated architecture rewrites after every UI observation.

The goal is not maximum UI frequency. The goal is maximum learning per experience checkpoint.

## When to create an experience checkpoint

Create one when at least one of these becomes true:

- a new lifecycle can be walked end-to-end;
- product semantics may differ from the technical model;
- a Human can now judge whether terminology, sequencing or control ownership feels correct;
- multiple previously separate capabilities can now be composed into one real workflow;
- additional backend work would multiply an unvalidated product assumption.

Do not create one solely because a version number changed.

## Current checkpoint: P1.3.1

P1.3.1 does not create a second setup system.

It integrates the existing official surfaces:

```text
Plugin Store
  → Install Personal Agent
  → Needs setup
  → Personal Agent Setup
  → install/select LLM Provider
  → Provider Settings
  → Host Secrets
  → Provider readiness
  → Ready
  → Open Personal Agent
  → Context selection
  → Memory Review
  → Memory Governance
  → Memory Source Health
```

The same readiness function drives:

- Personal Agent Chat readiness;
- Personal Agent Setup;
- Plugin Store product state.

There is no UI-local readiness truth.

## Long-term rule

For future EVO work, architecture depth and experience integration should alternate according to product risk, not according to a fixed sprint ceremony.

The assistant/project lead owns this cadence decision.

Human review is especially valuable at vertical checkpoints where the real interface can expose incorrect product assumptions before they are replicated across more Packages and capabilities.
