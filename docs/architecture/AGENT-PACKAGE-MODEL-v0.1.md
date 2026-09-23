# Agent Package Model v0.1

**Status:** Architecture baseline  
**Date:** 2026-09-23  
**Authority:** EVO App Platform package-model authority

## 1. Definition

An **Agent Package** is a versioned installable package whose primary executable role is an LLM Agent.

The first planned Agent Package is the former EC concept, now redefined as an **Enterprise Agent**.

> Enterprise Agent is a durable enterprise LLM agent package whose underlying model is replaceable while its role, memory, knowledge, methods and tool contracts remain persistent.

## 2. Package, not platform core

Enterprise Agent is not EVO Core, not Eidos Core, and not App Manager.

It is an installable participant in the package graph.

Conceptually:

```text
Application Platform
└─ Package Graph
   ├─ evo.core
   ├─ eidos.core
   ├─ eidos.app-host
   ├─ applications
   └─ enterprise-agent
```

The repository topology may differ from this package topology.

## 3. Agent responsibilities

An Enterprise Agent may:

- understand enterprise context;
- use enterprise and industry knowledge;
- plan and recommend;
- discover installed/available Apps;
- compose/configure applications;
- invoke public tools and APIs when authorized;
- learn from outcomes;
- preserve durable methods and memory;
- coordinate specialist agents in the future.

It does not become the owner of enterprise business truth merely because it reasons about that truth.

## 4. Durable identity

The Agent identity is larger than the current model provider.

```text
Enterprise Agent
├─ Role
├─ Goals / Rules
├─ Memory
├─ Knowledge
├─ Methods
├─ Tool Contracts
├─ History / Provenance
└─ Current LLM
```

The Current LLM is replaceable.

Changing model provider must not silently redefine the Agent's role, authority, persistent memory semantics or tool contracts.

## 5. Knowledge and memory

Knowledge/Memory are durable Agent assets or dependencies, not the complete product definition of the Agent.

Do not create a separate Knowledge Platform merely because the Agent needs persistent knowledge.

A separate project becomes justified only when knowledge/memory develops an independent lifecycle, shared multi-agent ownership, independent scaling/security requirements, or materially separate product responsibility.

## 6. Tool boundary

The Enterprise Agent may use:

- EVO public capabilities for enterprise computation/runtime;
- Eidos public contracts for frontend experience composition;
- App Manager/Catalog for package discovery and lifecycle;
- external tools/connectors through explicit contracts;
- durable enterprise/industry knowledge sources.

It must not rely on EVO, Eidos or App Manager private implementation details.

## 7. Human authority

Agent intelligence and automation do not automatically imply unrestricted execution authority.

Execution must follow the authorization/policy model of the tool or host system being invoked.

## 8. Package manifest direction

The generic Package Manifest should support package roles rather than a special one-off EC format.

Candidate package types include:

```text
FOUNDATION_RUNTIME
APPLICATION
RUNTIME_EXTENSION
EXPERIENCE
AGENT
```

An Agent Package may declare:

- required capabilities;
- optional capabilities;
- tool contracts;
- model/runtime requirements;
- memory/knowledge requirements;
- authority/permission requests;
- lifecycle hooks;
- compatibility requirements.

## 9. Repository topology is independent

An Agent Package may live:

- inside EVO-App-Platform during early development;
- in a dedicated repository once large enough;
- in a third-party repository.

App Manager must care about Package Manifest + Artifact + Contracts, not Git repository location.

## 10. Historical EC transition

The former `Experience-Compiler` repository contains valuable implementation, knowledge, learning, provenance and model-replacement assets.

Those assets should be preserved and evaluated for migration into the Enterprise Agent package.

The old product identity "Experience Compiler" is no longer the target product definition.

Repository rename/migration is a separate engineering decision and is intentionally not decided by this document.

## 11. Cross-project authority

This document is the **primary package-model authority** for Agent Package semantics.

Other repositories should only record their local boundary:

- EVO: how an Agent consumes EVO public capabilities;
- Eidos: how an Agent consumes/produces Eidos experience contracts;
- Experience-Compiler: historical identity transition and asset migration.
