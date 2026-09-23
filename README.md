# EVO App Platform

**Status:** Architecture bootstrap  
**Repository role:** Application ecosystem layer for EVO + Eidos

EVO App Platform is the LLM-native application platform that manages installable business applications built on top of EVO backend contracts and Eidos frontend contracts.

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
                    EC
        enterprise / industry knowledge
                    │
                    │
                    ▼
              project LLMs
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
      EVO                     Eidos
 backend runtime        frontend framework
        ▲                       ▲
        │                       │
        └────── public contracts┘
                    ▲
                    │
            EVO App Platform
            ├─ App Manager
            ├─ App Catalog
            └─ Apps
```

## Installable application model

A business application may contribute both backend capability and frontend experience:

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
2. `CONCEPTS.md`
3. `INVARIANTS.md`
4. `ARCHITECTURE.md`
5. `PUBLIC-API.md`
6. `LLM.md`
7. `architecture.manifest.json`
8. `project.status.json`

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
