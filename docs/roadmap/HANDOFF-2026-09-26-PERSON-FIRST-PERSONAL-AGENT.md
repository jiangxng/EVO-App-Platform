# Handoff — Person-first Personal Agent / Context Memory Baseline

**Date:** 2026-09-26  
**Status:** authoritative continuation note  
**Branch target:** EVO-App-Platform main after Person-first MVP freeze

## Why this handoff exists

The conversation that led to the current architecture materially changed EVO's root world model. Future LLM sessions MUST NOT reconstruct this from chat memory.

Read first:

1. `docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`
2. `docs/architecture/ENTERPRISE-AGENT-TOOL-SYSTEM-v0.1.md`
3. `LLM.md`
4. `INVARIANTS.md`
5. `project.status.json`
6. `llm.foundation-map.json`

## Frozen interpretation

EVO's first perspective is the human.

```text
Human
  └── Personal Agent
        ├── Personal Context
        │     └── Personal Context Memory
        └── authorized Enterprise Context(s)
              └── Enterprise Context Memory
```

There is no Enterprise Agent in the MVP ontology.

The existing `enterprise-agent` Package, route, command and TypeScript symbols are compatibility implementation assets for the product-facing **Personal Agent**. Do not perform cosmetic repository-wide renames.

## Meaning of Enterprise Context

Enterprise Context is governed working and learning material available to the Personal Agent. It can expose business data, historical events, documents, SOPs, Context Memory and context-bound tools.

Enterprise Context does not own the person's identity.

A person may work across multiple enterprises. Losing one enterprise relationship must not delete the person's Personal Context or Personal Context Memory.

## Context Memory distinction

Two durable memory owners are frozen for the MVP:

- Personal Context Memory;
- Enterprise Context Memory.

Enterprise Context may be used as reasoning material when access is granted.

```text
read/use for reasoning
!=
permission to persist into Personal Context Memory
```

Until a future Memory Attribution boundary exists, cross-context memory promotion is deny-by-default.

Context Memory is durable platform data, not LLM hidden state. Models/providers can be replaced without deleting Context Memory.

## Agent and human responsibility

Personal Agent is an adviser.

```text
observe
→ analyze
→ explain
→ opinion / proposal
→ Human decision
→ governed execution
```

Material final decisions remain human-owned in the MVP. READ and PLAN are the preferred near-term Agent capabilities. WRITE operations remain Host-governed and should not be expanded casually.

## Plugin consequence

Context is the environment in which capabilities/data are available; plugins add capabilities to a Context.

Long-term mental model:

```text
effective EVO view
=
Principal
+ Active Context
+ installed/effective Capabilities
+ relevant Context Memory
+ effective Tools
```

The same Personal Agent remains stable while Active Context changes.

Do not encode enterprise-specific business semantics into Personal Agent core.

## Compatibility / migration strategy

Use **semantic migration first, implementation migration when touched**.

Preserve working assets:

- Plugin Protocol and Package/Feature/Contribution model;
- Provider model;
- Eidos Workbench and design language;
- Secrets Provider;
- Platform Help;
- runtime isolation/storage/events;
- Dynamic Host Tool Discovery;
- existing `enterprise-agent` package machine identifiers.

Known migration debt includes:

- legacy Enterprise Agent names in implementation symbols;
- `PlatformScopeV010` enterprise/company/workspace/user hierarchy;
- Provider binding scopes that predate Person-first Context;
- future authorization assumptions.

Do not solve all migration debt at once.

## Immediate implementation slice

Implement only:

1. `PersonalContextV010`;
2. revised/minimal `EnterpriseContextV010` compatible with existing contract;
3. `ActiveContextRefV010`;
4. Person-first fields in `PlatformRequestContextV010` while retaining legacy `scope`;
5. Host-owned active-context resolution for Personal Agent;
6. active context passed into Host Tool Catalog and model input;
7. a READ-only `context.current.get` tool;
8. Context Memory **read contract only**, no learning engine yet;
9. tests proving the client cannot manufacture an Enterprise Context by merely sending an id.

Do not build:

- full IAM;
- enterprise membership workflows;
- role hierarchy;
- memory learning/write engine;
- multi-Agent architecture;
- automatic cross-context memory transfer.

## Security posture before full permissions

Before authorization is mature:

- default context is Personal Context;
- Enterprise Context must come from a Host-owned resolver/source;
- request/browser input may select among Host-offered Context refs but may not create one;
- missing/unknown enterprise context fails closed;
- Context Memory is read-only at this slice;
- existing privileged platform WRITE protections remain unchanged.

## Next after this slice

Once active Context is real and observable:

1. attach minimal Session/Principal;
2. add Relationship/Grant only when a real Enterprise Context needs access control;
3. filter Tool Catalog by Principal + Active Context;
4. route material WRITE through authorization + human confirmation;
5. then add real Personal/Enterprise Context Memory providers and Memory Attribution.

This document exists specifically so a fresh LLM can continue without needing the original conversation.
