# Personal Agent / EC Convergence v0.1

**Status:** Architecture baseline  
**Date:** 2026-09-24  
**Authority:** EVO App Platform package integration for the former Experience Compiler

## 0. Person-first supersession

Product ontology is now frozen by `docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`.

There is one MVP Agent: **Personal Agent**. Enterprise Context is governed enterprise identity/definition context available to that Agent; this document no longer implies a distinct Enterprise Agent persona. Durable enterprise knowledge and learning belong to Experience Compiler.

The historical filename and `enterprise-agent` implementation identifiers remain for compatibility until a versioned migration is justified.

## 1. Decision

The historical Experience Compiler (EC) project is not rewritten or copied into EVO App Platform.

It converges as the durable intelligence asset/runtime source behind the installable **Personal Agent** product surface. The existing `enterprise-agent` Package ID remains a compatibility identifier.

```text
Experience-Compiler repository
  knowledge / memory / learning / research / context / provenance / industry packs
                         │
                         │ public contracts / service adapters
                         ▼
EVO App Platform
  enterprise-agent Package
  lifecycle / Experience / capability exposure
                         │
                         ▼
Eidos App Host
                         │
                         ▼
Human / enterprise operator
```

## 2. Existing assets that are preserved

### Experience-Compiler repository

Preserve and reuse:

- knowledge models and canonical persistence;
- evidence/provenance/lineage;
- memory and case/decision/outcome assets;
- learning strategies and meta-learning;
- research acquisition;
- Context Compiler;
- manufacturing Industry Pack/reference system;
- EVO/Eidos integration ports;
- model capability registry/routing;
- model-replacement/bootstrap semantics;
- OpenAI-compatible adapter as migration/reference implementation.

### EVO App Platform

Preserve and reuse:

- `AGENT` Package model;
- existing `agents/enterprise-agent` runtime;
- model-independent `AgentModel` contract;
- App Manager HTTP tools;
- existing real OpenAI Responses adapter as migration evidence;
- Agent installation Proof B;
- App Host / Eidos Experience / ActionHost;
- Provider Plugin model.

No repository replacement is authorized by this convergence.

## 3. Responsibility split

### App Platform owns

- Package / Feature lifecycle;
- installation, enable/disable, uninstall and future upgrade;
- capability/provider discovery;
- Agent Experience contribution to App Host;
- Agent tool authorization boundary;
- LLM Provider resolution;
- enterprise scope/context and governed Business Definition access passed into the Agent.

### Experience-Compiler owns

- enterprise knowledge;
- industry knowledge;
- durable learning and experience semantics;
- cases / decisions / outcomes / learned patterns;
- research acquisition;
- reasoning bootstrap assets;
- knowledge provenance/lineage;
- industry packs;
- advisory methods and definition-improvement proposals;
- durable intelligence assets that must survive model replacement.

Experience Compiler may propose or help compile Business Definition Drafts, but published/effective enterprise definitions remain authoritative Enterprise Context assets.

### Enterprise Context owns

- enterprise identity/governance context;
- authoritative Business Definitions;
- Draft / Published / Effective lifecycle;
- immutable definition revision history;
- definition provenance/attribution and publication governance.

Enterprise Context is not a parallel enterprise knowledge store.

### Eidos owns

- deterministic human Experience contracts/rendering;
- Agent-facing product UI realization.

### EVO owns

- enterprise business truth;
- deterministic execution;
- governed command/ledger effects.

## 4. LLM boundary

The old direct OpenAI adapter under `agents/enterprise-agent` is retained as migration evidence only. The executable mainline now uses the generic `LlmInferenceProvider` contract plus Provider Runtime Registry.

Target dependency:

```text
Personal Agent
      ↓
llm.inference public capability
      ↓
App Platform Provider resolution
      ↓
installed LLM Provider Package
      ↓
OpenAI / Anthropic / local / enterprise gateway / future provider
```

The Personal Agent package MUST NOT permanently own an OpenAI-specific dependency.

## 5. First convergence slice

The first slice intentionally does **not** migrate all EC Python modules.

It proves:

```text
Catalog
→ install enterprise-agent Package
→ Feature active
→ Personal Agent Experience visible in canonical App Host
→ status Action executes through ActionHost
→ disable removes Experience
→ enable restores Experience
→ uninstall removes Package/Experience
```

The status action must identify the EC source repository/version and explicitly report whether a real `llm.inference` provider is connected.

## 6. Next slice

After Package convergence is green:

1. introduce the first real `llm.inference` Provider Package;
2. resolve the Provider through App Platform rather than directly reading `OPENAI_API_KEY` inside Agent code;
3. route Personal Agent chat through the Provider;
4. keep human confirmation/authorization around side-effectful tools;
5. then begin moving EC context/knowledge services behind explicit runtime contracts.

## 7. No duplicated intelligence platform

Do not duplicate EC knowledge/memory/context implementation in TypeScript merely because the host is TypeScript.

Use service/adaptor boundaries where language/process separation is appropriate.

Repository topology remains independent from Package topology.

## 8. Acceptance

This convergence is accepted when:

- Personal Agent appears in Plugin Store as an ordinary AGENT package;
- lifecycle closure works through App Manager;
- App Host discovers/removes its Eidos Experience with lifecycle state;
- status Action runs only while Feature is active;
- CI preserves existing Agent Proofs and all existing App Platform tests;
- docs in both repositories point to the same convergence decision.


## 9. LLM Provider slice

The second convergence slice adds `openai-llm-provider` as the first real `PLATFORM_PROVIDER` implementation.

```text
Enterprise Agent Eidos Experience
→ enterprise-agent.chat Action
→ provider-backed AgentModel
→ llm.inference Provider Resolver
→ openai.responses runtime
→ OpenAI Responses API
```

The provider is lifecycle-managed independently of the Agent. Credentials are configuration/secrets, never Package data. Installing or removing the Provider changes model availability without changing the durable Agent identity.


## 10. Tool Discovery slice

Personal Agent P0.2 removes the fixed App Manager tool list from Agent core.

Authority: `docs/architecture/ENTERPRISE-AGENT-TOOL-SYSTEM-v0.1.md`.

The Host now supplies the effective tool catalog and the Agent model consumes it dynamically. Initial registrations cover platform/capability state, Package discovery/install planning, Provider observation and authoritative Help search.

This is the required convergence boundary for future EC tools: EC context/knowledge/provenance functions must enter as registered tools/adapters rather than being embedded into Personal Agent prompt logic.

The next convergence slice is Principal/Scope-aware tool visibility and authorization for privileged WRITE tools, followed by the first EC Context/Knowledge/Provenance adapters.

## 11. Definition improvement loop

The target convergence loop is:

```text
EC enterprise/industry knowledge
+ runtime outcomes
+ definition history
        ↓
learning / reasoning / proposal
        ↓
Business Definition Draft / recommendation
        ↓
Enterprise Context
        ↓
governed publication
```

EC and Enterprise Context are therefore complementary rather than duplicate stores:

- EC knows, learns and proposes;
- Enterprise Context defines and governs the current enterprise model.


## 12. Enterprise–Personal Learning Loop

The detailed long-term relationship between Personal Context Memory, Personal Agent, EC, Enterprise Context, EVO Runtime, external knowledge and replaceable LLM Providers is defined in:

`docs/architecture/ENTERPRISE-PERSONAL-LEARNING-LOOP-LONG-TERM-v0.1.md`

That target is intentionally not the current implementation mainline.

Current architectural reservation:

- Personal Context Memory may retain permitted personal working experience;
- EC remains the enterprise/industry knowledge and learning authority;
- personal experience may later become governed EC learning evidence, but never by automatic synchronization;
- EC may later project task-relevant enterprise experience back to the Personal Agent;
- final LLM calls should eventually be assembled from minimum-sufficient authorized context rather than full memory dumps;
- model replacement must not erase either personal or enterprise accumulated experience;
- no speculative learning-loop infrastructure enters current CI without an accepted vertical use case.

