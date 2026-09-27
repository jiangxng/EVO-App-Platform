# EVO App Platform

**Status:** Personal Agent vertical experience checkpoint  
**Repository role:** Package lifecycle and application ecosystem layer

EVO App Platform is the LLM-native package and application platform that manages installable foundation packages, business applications, runtime extensions, experience packages and Agent Packages through public contracts.

It owns three long-term responsibilities:

```text
EVO App Platform
├─ App Manager
├─ App Catalog
└─ Apps
```

It does **not** own EVO Core and does **not** own Eidos Core.

## System relationship

```text
                 Enterprise Agent
               (Agent Package)
                      │
          public tools / contracts
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
      EVO           Eidos     EVO App Platform
 backend runtime  frontend      package/app
                   framework      lifecycle
```

The former EC / Experience Compiler concept is being transitioned into the Enterprise Agent model. The package-model authority is `docs/architecture/AGENT-PACKAGE-MODEL-v0.1.md`.

## Installable package model

A business application may contribute both backend capability and frontend experience. Other package types may instead provide foundation runtime, runtime extension, experience-only capability, or an LLM Agent.

```text
Business App
├─ backend
│  ├─ definitions
│  ├─ APIs
│  ├─ projections
│  └─ optional runtime service
├─ experience
│  ├─ Eidos app manifest
│  ├─ navigation
│  ├─ pages / UIDL
│  └─ data/action bindings
└─ package.manifest.json
   └─ features/*.feature.json
```

The App Manager understands Package/Feature manifests and lifecycle contracts. It must not depend on an app's private implementation.

Canonical rule: **Package is what enters the system. Feature is what becomes active. Contribution is what the Feature adds.**

## First reading order

1. `PHILOSOPHY.md`
2. `docs/architecture/PACKAGE-FEATURE-CONTRIBUTION-MODEL-v0.1.md`
3. `docs/architecture/AGENT-PACKAGE-MODEL-v0.1.md`
4. `CONCEPTS.md`
5. `INVARIANTS.md`
6. `ARCHITECTURE.md`
7. `PUBLIC-API.md`
8. `LLM.md`
9. `architecture.manifest.json`
10. `project.status.json`

## Initial repository structure

```text
manager/        App lifecycle orchestration
contracts/      App/package/installation public contracts
catalog/        Discoverable app catalog
apps/           Official business applications
certification/  Installation and compatibility certification
docs/           Architecture/product/ADR/status documentation
```

## Human + LLM operability

Apps and configuration tools are designed for LLM understanding and business-user operation at the same time. Normal configuration should be understandable and operable without human developer assistance, SQL or source-code changes. The target operating model is that approximately 99.9% of software engineering work is performed by LLMs.

See `docs/architecture/HUMAN-LLM-OPERABILITY-v0.1.md`.

## Current non-goals

This bootstrap does not yet move Finance Reporting, Trading or other existing application code from EVO.

First we stabilize:

- app identity and manifest;
- dependency model;
- install/upgrade/deactivate/uninstall semantics;
- EVO compatibility contract;
- Eidos experience compatibility contract;
- certification model.

Only then should existing apps be migrated.


## Current continuation point

The current mainline is the P1.4X Personal Agent vertical experience checkpoint:

`docs/roadmap/P1.4X-PERSONAL-AGENT-VERTICAL-EXPERIENCE-CHECKPOINT.md`

It composes the real product lifecycle built through P1.4E:

```text
Install Personal Agent
→ install/configure LLM Provider
→ Host Secrets
→ Ready
→ Personal Agent
→ Memory Proposal / Human Review
→ Governance / Retention
→ Memory Quality / Human quality evaluation
→ contradiction resolution
→ Personal Agent Follow-up
```

For the local Human checkpoint:

```bash
npm ci
npm run experience:start
```

Open `http://localhost:4100`.

The launcher uses formal Static Session and Static Authorization Provider contracts and durable local Host state. It does not preinstall Personal Agent, preconfigure an API Key, or seed fake Memory.

The older Company Notes / Trading Lite proof runbooks remain historical regression references.
