# Enterprise Agent / EC Convergence v0.1

**Status:** Architecture baseline  
**Date:** 2026-09-24  
**Authority:** EVO App Platform package integration for the former Experience Compiler

## 1. Decision

The historical Experience Compiler (EC) project is not rewritten or copied into EVO App Platform.

It converges as the durable intelligence asset/runtime source behind an installable **Enterprise Agent** Package.

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
- enterprise scope/context passed into the Agent.

### Experience-Compiler owns

- durable enterprise intelligence semantics;
- knowledge/memory/learning/context/research;
- reasoning bootstrap assets;
- provenance/lineage;
- industry packs;
- advisory methods;
- durable Agent identity assets that must survive model replacement.

### Eidos owns

- deterministic human Experience contracts/rendering;
- Agent-facing product UI realization.

### EVO owns

- enterprise business truth;
- deterministic execution;
- governed command/ledger effects.

## 4. LLM boundary

The current direct OpenAI adapter under `agents/enterprise-agent` is retained as migration evidence only.

Target dependency:

```text
Enterprise Agent
      ↓
llm.inference public capability
      ↓
App Platform Provider resolution
      ↓
installed LLM Provider Package
      ↓
OpenAI / Anthropic / local / enterprise gateway / future provider
```

The Enterprise Agent package MUST NOT permanently own an OpenAI-specific dependency.

## 5. First convergence slice

The first slice intentionally does **not** migrate all EC Python modules.

It proves:

```text
Catalog
→ install enterprise-agent Package
→ Feature active
→ Enterprise Agent Experience visible in canonical App Host
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
3. route Enterprise Agent chat through the Provider;
4. keep human confirmation/authorization around side-effectful tools;
5. then begin moving EC context/knowledge services behind explicit runtime contracts.

## 7. No duplicated intelligence platform

Do not duplicate EC knowledge/memory/context implementation in TypeScript merely because the host is TypeScript.

Use service/adaptor boundaries where language/process separation is appropriate.

Repository topology remains independent from Package topology.

## 8. Acceptance

This convergence is accepted when:

- Enterprise Agent appears in Plugin Store as an ordinary AGENT package;
- lifecycle closure works through App Manager;
- App Host discovers/removes its Eidos Experience with lifecycle state;
- status Action runs only while Feature is active;
- CI preserves existing Agent Proofs and all existing App Platform tests;
- docs in both repositories point to the same convergence decision.
