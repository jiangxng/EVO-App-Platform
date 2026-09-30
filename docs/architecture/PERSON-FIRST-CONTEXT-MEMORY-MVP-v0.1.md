# EVO Person-First Context Memory MVP v0.1

**Status:** Frozen MVP world model  
**Date:** 2026-09-26  
**Scope:** EVO identity, Personal Agent, Personal Context and Enterprise Context

> **Architecture ownership correction — 2026-09-30:** The Person-first identity decision in this document remains authoritative: Human is the root, Personal Agent is the single product Agent, and Enterprise Context is not an Agent. However, the target ownership of **enterprise knowledge** has changed. Enterprise/industry knowledge and learning now belong to Experience Compiler. Enterprise Context becomes a definition-first governed enterprise space whose primary durable product assets are Business Definitions. Existing Enterprise Context Memory implementation is preserved compatibility/migration evidence, not the target enterprise knowledge authority. See `ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md`.
>
> Where this historical MVP document says Enterprise Context accumulates institutional knowledge, the 2026-09-30 ownership baseline supersedes that statement without invalidating the implemented memory-governance evidence.

## 1. Frozen MVP decision

EVO's first point of view is the human.

The MVP world model contains one Agent type only:

```text
Human
  │
  └── Personal Agent
        │
        ├── Personal Context
        │      └── Personal Context Memory
        │
        └── Enterprise Context(s)
               └── Enterprise Context Memory
```

The current `enterprise-agent` Package is the implementation asset that evolves into Personal Agent.

Its Package ID, route, command codes and public machine identifiers remain stable during the compatibility phase. Product-facing naming changes to **Personal Agent**.

## 2. Human decision authority

Personal Agent is an adviser, not the final decision authority.

Canonical decision flow:

```text
Context data / memory
        ↓
Personal Agent observes
        ↓
analysis
        ↓
opinion / proposal
        ↓
Human
        ↓
decision
        ↓
governed execution
```

The Agent may inspect, analyze, explain, plan and propose.

A model-generated opinion is not a human decision.

P0/P1 SHOULD prefer READ and PLAN capabilities. WRITE capabilities require explicit Host governance and, for material decisions, human confirmation.

Future delegation may extend execution authority, but it must be explicit and must not retroactively redefine the MVP world model.

## 3. Personal Context

Personal Context belongs to the human's long-lived working identity.

It may contain:

- personal work preferences;
- personal methods and reusable experience;
- prior human decisions and feedback;
- task history that is permitted to persist;
- Personal Context Memory.

Personal Context persists independently of any one enterprise relationship.

## 4. Enterprise Context

Enterprise Context is not an Agent and not a personality.

It is a governed source of enterprise-specific working material for the Personal Agent.

It may expose:

- enterprise business data;
- historical events;
- documents and SOPs;
- current application state;
- approved enterprise knowledge;
- Enterprise Context Memory;
- tools/capabilities available in that enterprise context.

A human may have access to zero, one or multiple Enterprise Contexts.

Enterprise Context access is relationship/grant based. It must not make the person's identity a child object owned by the enterprise.

## 5. Context Memory

MVP defines two long-lived memory owners only:

```text
Personal Context Memory
Enterprise Context Memory
```

### Personal Context Memory

Optimizes the Personal Agent for the human over time.

It may retain permitted personal methods, preferences, prior choices and reusable experience.

### Enterprise Context Memory

Allows the enterprise context to accumulate durable institutional knowledge without requiring an enterprise Agent or subjective consciousness.

It may retain governed facts, learned patterns, prior outcomes, approved procedures and provenance-linked knowledge.

## 6. Enterprise Context as learning material

When the human has access, Enterprise Context may be used as learning material for the Personal Agent's current reasoning.

This does not imply unrestricted copying into Personal Context Memory.

MVP rule:

```text
read/use for reasoning
≠
permission to persist into personal memory
```

Cross-context persistence requires an explicit future memory-attribution/governance boundary.

Until that boundary exists, implementation MUST default to preventing enterprise-confidential facts from being silently promoted into Personal Context Memory.

## 7. Memory and model independence

Context Memory is not LLM hidden state.

Models may be replaced without deleting Personal or Enterprise Context Memory.

Canonical principle:

> EVO does not depend on the model to remember the human or enterprise. Context Memory is durable platform data; the model is a replaceable reasoning consumer.

## 8. Personal Agent context composition

The Personal Agent reasons over an active context set:

```text
Personal Context
+
zero or more authorized Enterprise Contexts
+
current task
+
effective tools
+
relevant Context Memory
        ↓
Personal Agent
        ↓
opinion / proposal
```

The same Personal Agent remains stable while active Enterprise Context changes.

## 9. Tool Discovery relationship

The P0.2 Host Tool Catalog remains valid.

Future effective tools are derived from:

```text
human identity / principal
+
active context
+
context grants
+
installed/effective capabilities
+
Host policy
        ↓
effective Tool Catalog
```

Enterprise-specific tools are context-bound capabilities, not a separate Enterprise Agent.

## 10. Naming and compatibility

Preferred product term from this baseline:

```text
Personal Agent
```

Compatibility identifiers remain temporarily unchanged:

- Package: `enterprise-agent`
- Feature: `enterprise-agent.default`
- Experience: `enterprise-agent`
- route: `/enterprise-agent`
- command: `enterprise-agent.chat`

Existing source directory and TypeScript symbol names are implementation compatibility debt, not the product ontology.

Do not perform a repository-wide rename solely for aesthetics. Migrate machine identifiers only with an explicit versioned compatibility plan.

## 11. Explicitly out of MVP scope

The frozen MVP does **not** introduce:

- an Enterprise Agent;
- organization personalities;
- multi-agent societies;
- autonomous enterprise decision authority;
- arbitrary Agent-to-Agent delegation;
- complex Context graphs;
- automatic cross-context memory transfer;
- AGI-specific autonomy assumptions.

These may be revisited only after concrete product need.

## 12. Architectural consequences

From this baseline forward:

1. do not design identity as `Enterprise -> User`;
2. do not make Enterprise the root owner of human identity;
3. do not introduce a second Agent merely to represent Enterprise Context;
4. treat enterprise data/knowledge/tools as context available to the Personal Agent under governance;
5. keep Personal and Enterprise Context Memory logically distinct;
6. model Agent output as opinion/proposal before human decision;
7. preserve dynamic Host Tool Discovery;
8. prefer READ/PLAN growth before broad WRITE autonomy;
9. keep Context Memory independent from any LLM Provider;
10. keep human decision authority explicit in product UX and action flows.

## 13. Next implementation slice

The next implementation should remain minimal:

1. introduce a Personal Agent naming compatibility layer;
2. define minimal `PersonalContextV010` and `EnterpriseContextV010`;
3. define active context selection in `PlatformRequestContext`;
4. pass active context into Tool Catalog construction;
5. add initial Context Memory read contracts only;
6. expose Agent analysis/opinion distinctly from execution;
7. require human confirmation for material WRITE actions.

Do not build the full long-term memory-learning engine in this slice.

## 14. Help impact

This is a material user-visible and architectural change.

Help impact classification: **new Help content required**.

The product Help corpus must describe:

- Personal Agent;
- Personal Context;
- Enterprise Context;
- Personal vs Enterprise Context Memory;
- human decision authority;
- compatibility naming during migration.


## 15. P0.3 minimal Context plumbing

The first implementation slice after the world-model freeze intentionally does not implement full IAM.

Public contracts:

- `PersonalContextV010`;
- compatibility-extended `EnterpriseContextV010`;
- `ActiveContextRefV010`;
- `ResolvedContextSetV010`;
- Person-first `PlatformRequestContextV010.context`;
- read-only `ContextMemoryReaderV010`.

Host resolution rule:

```text
request may SELECT a Context ref
        ↓
Host Context Registry
        ↓
known Personal / Enterprise Context?
        ├─ yes → resolved Context
        └─ no  → fail closed
```

Request/browser data MUST NOT create an Enterprise Context by presenting an arbitrary enterprise/context id.

Until Identity/Session/Grant becomes executable, production defaults to a Host-owned Personal Context and no Enterprise Context. Enterprise Contexts enter later from an explicit Host/provider/grant source.

The Personal Agent receives the resolved Context in model input and can inspect it through the READ-only `context.current.get` tool.

Context Memory in this slice is contract-only and read-only. There is deliberately no generic Context Memory write/learn API yet.
