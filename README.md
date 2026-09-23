# EVO App Platform

**Status:** Architecture bootstrap  
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
└─ app.manifest.json
```

The App Manager understands the manifest and lifecycle contract. It must not depend on an app's private implementation.

## First reading order

1. `PHILOSOPHY.md`
2. `docs/architecture/AGENT-PACKAGE-MODEL-v0.1.md`
3. `CONCEPTS.md`
4. `INVARIANTS.md`
5. `ARCHITECTURE.md`
6. `PUBLIC-API.md`
7. `LLM.md`
8. `architecture.manifest.json`
9. `project.status.json`

## Initial repository structure

```text
manager/        App lifecycle orchestration
contracts/      App/package/installation public contracts
catalog/        Discoverable app catalog
apps/           Official business applications
certification/  Installation and compatibility certification
docs/           Architecture/product/ADR/status documentation
```

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
