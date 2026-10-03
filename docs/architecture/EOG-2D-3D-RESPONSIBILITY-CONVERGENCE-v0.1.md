# EOG 2D/3D Responsibility Convergence v0.1

**Status:** AUTHORITATIVE ARCHITECTURE BASELINE  
**Date:** 2026-10-02  
**Scope:** Eidos visual cores, Enterprise Context definition authority, and the EOG application-plugin family

## 1. Decision

EOG is converged into a frontend/backend-like low-coupling model.

The business-definition authority and the visual/application experiences are intentionally separated:

```text
Enterprise Context
= authoritative Enterprise Graph Definition lifecycle/persistence
            │
            │ stable definition contracts
            ▼
┌───────────────────── App Platform ─────────────────────┐
│                                                       │
│  EOG 2D Designer     EOG 2D Viewer     EOG 3D Viewer │
│  write/governance     read/aggregate      read/spatial │
│          │                 │                  │         │
└──────────┼─────────────────┼──────────────────┼─────────┘
           ▼                 ▼                  ▼
      Eidos 2D Core     Eidos 2D Core      Eidos 3D Core
```

The three EOG application plugins share one Enterprise Graph Definition. They are not three graph authorities.

## 2. Cross-plugin interaction model

Plugin-to-plugin interaction follows a frontend/backend-style separation:

- one component owns authoritative state;
- another component owns a specialized experience or projection;
- they communicate through stable public contracts;
- neither imports the other's private implementation;
- App Platform discovers, binds, authorizes and manages lifecycle;
- ordinary business payloads do not need to be translated by App Platform after binding.

Target:

```text
authoritative provider
    ↓ public capability / contract
consumer plugin
    ↓
its own experience / projection
```

Not:

```text
plugin A
→ private import from plugin B
→ shared hidden state
```

and not:

```text
plugin A
→ App Platform business translation
→ plugin B
```

unless a control-plane intervention is actually required.

## 3. Enterprise Context responsibility

Enterprise Context remains the authority for Enterprise Graph Definition truth.

It owns:

- Enterprise scope;
- Draft / Published / Effective lifecycle;
- immutable definition revisions;
- provenance / attribution;
- publication governance;
- authoritative persistence;
- definition retrieval and mutation interfaces.

Enterprise Context does **not** own:

- 2D rendering;
- 3D rendering;
- graph canvas interaction;
- EOG editor UX;
- EOG viewer UX;
- domain-specific visual layout implementation.

The EOG plugin family may own Enterprise Graph domain validation and editing semantics, but authoritative definition state is persisted through Enterprise Context.

## 4. Eidos 2D Core

Eidos 2D Core is a reusable frontend-framework capability.

It owns generic 2D graph/diagram interaction primitives such as:

- node;
- edge;
- port;
- group;
- x/y position;
- size;
- viewport;
- selection;
- pan / zoom;
- drag;
- hit testing;
- connection interaction;
- layout hooks;
- annotations / overlays;
- generic interaction events;
- accessibility, keyboard and focus behavior for the 2D surface.

It must not understand:

- Enterprise Context;
- EOG;
- Application;
- Ledger;
- SOP;
- Enterprise Relation;
- accounting guidance;
- publication governance.

The existing Eidos `src/diagram` implementation is a convergence asset for this core, not a separate product truth boundary.

## 5. Eidos 3D Core

Eidos 3D Core is the corresponding reusable spatial-experience capability.

It owns generic concepts such as:

- scene;
- object;
- x/y/z pose;
- camera;
- projection;
- selection;
- focus;
- spatial navigation;
- visibility;
- LOD;
- overlays;
- generic spatial interaction events;
- renderer-adapter boundaries.

Three.js, WebGL, WebGPU or future renderers are replaceable implementations behind the Eidos 3D contract.

Eidos 3D Core must not understand Enterprise Graph business semantics.

The existing Eidos `src/spatial` implementation and Three-like adapter are convergence assets for this core.

## 6. EOG 2D Designer Plugin

The EOG 2D Designer is the only EOG application plugin whose primary purpose is editing Enterprise Graph definitions.

Responsibilities:

- project Enterprise Graph Definition into a 2D editing experience;
- bind/unbind domain nodes;
- propose/remove Guidance relations;
- Human-confirm/remove Enterprise relations;
- validate graph-domain semantics;
- request Draft publication through the authoritative definition boundary;
- manage 2D design View State separately from semantic definition state;
- expose Human and governed Agent editing capabilities.

Authority rule:

```text
Designer proposes/edits
        ↓
Enterprise Context validates lifecycle/governance and persists authoritative definition revision
```

The Designer is not a second definition repository.

## 7. EOG 2D Viewer Plugin

The EOG 2D Viewer is a separate semantically read-only but fully interactive plugin. It is not a disabled Designer mode, and it is not a static read-only page.

Responsibilities:

- read the same Enterprise Graph Definition;
- navigate and inspect the graph;
- render interactive 2D projections without Enterprise Graph semantic mutation;
- aggregate peer-plugin contributions;
- show overlays, indicators, warnings and drill-down destinations;
- host the future enterprise-wide 2D "God view".

The Viewer does not own calculation of peer-plugin analytics.

Target:

```text
Enterprise Graph Definition
+ peer-plugin contributions
+ 2D projection
= EOG 2D Viewer
```

## 8. EOG 3D Viewer Plugin

The EOG 3D Viewer reads the same Enterprise Graph Definition and projects it through Eidos 3D Core.

It owns:

- spatial composition;
- 3D View State;
- camera/focus/navigation preferences;
- read-only graph inspection;
- peer-plugin overlays in spatial form.

It does not own a separate "3D enterprise graph".

Invariant:

```text
one Enterprise Graph Definition
├── 2D View State
└── 3D View State
```

Changing position or camera must not manufacture a new Enterprise Graph Definition revision.

## 9. Shared semantic contract

The Enterprise Graph domain contract remains outside Eidos.

It defines business/domain concepts such as:

- graph identity;
- semantic node/reference bindings;
- Guidance relationships;
- Human-confirmed Enterprise relationships;
- graph-domain validation;
- permitted domain mutations.

The contract may be consumed by Enterprise Context and all three EOG plugins through stable public interfaces.

Physical package extraction can occur incrementally. Existing `contracts/enterprise-operating-graph*.ts` remains a protected migration asset until the package boundary is moved without changing semantics.

## 10. Peer plugins and contributions

Observatory, Bottleneck, SOP, Metrics, Reports and future analysis capabilities are not children of the EOG application plugins.

They are peer plugins/providers.

They may contribute read-only projections such as:

- status;
- metrics;
- warnings;
- analysis overlays;
- evidence;
- drill-down destinations.

EOG Viewer plugins aggregate those contributions without owning their calculations.

## 11. Existing asset convergence map

### Eidos-bound assets

Target Eidos 2D Core:

- `vendor/eidos/src/diagram/**` upstream equivalent `src/diagram/**`

Target Eidos 3D Core:

- `vendor/eidos/src/spatial/**` upstream equivalent `src/spatial/**`

### EOG 2D Designer target

- semantic edit actions from `manager/enterprise-operating-graph-actions.ts`;
- governed Agent proposal tools from `manager/enterprise-operating-graph-agent-tools.ts`;
- editor projection/actions from `manager/enterprise-operating-graph-page.ts`;
- 2D View State services/stores;
- graph-domain validation/application logic.

### EOG 2D Viewer target

- interactive semantic-read-only graph projection;
- current 2D Observatory viewing assets where they are EOG projection concerns;
- contribution aggregation contracts;
- mobile/desktop read projections where applicable.

### EOG 3D Viewer target

- `manager/enterprise-operating-graph-spatial-observatory-page.ts`;
- SPATIAL_3D projection/View State consumption;
- future spatial contribution aggregation.

### Enterprise Context target

- authoritative Enterprise Graph Definition persistence;
- lifecycle/revision/publication/provenance;
- generic Business Definition repository behavior.

### Preserve for peer-plugin extraction

- SOP definition/editor/analysis assets;
- EVO Runtime Observatory Provider;
- Bottleneck Analysis Provider;
- runtime-binding adapters;
- analysis-specific calculation logic.

No working asset is deleted merely because ownership changes.

## 12. Migration sequence

Migration is intentionally incremental:

1. freeze this responsibility baseline;
2. formalize Eidos 2D Core and 3D Core public boundaries while preserving compatibility;
3. establish three App Platform package identities: EOG 2D Designer, EOG 2D Viewer, EOG 3D Viewer;
4. move Experience manifests and ownership metadata to those packages;
5. route Enterprise Graph definition persistence through Enterprise Context;
6. move generic diagram/spatial implementation responsibility to Eidos upstream;
7. extract analysis/runtime/SOP assets only when their peer-plugin contracts are defined;
8. remove old mixed ownership only after compatibility and production regression proof.

## 13. Non-goals for this convergence

This slice does not:

- redesign the complete future Enterprise Graph ontology;
- add new analytics;
- add new SOP semantics;
- add External Agent WRITE;
- replace working renderers;
- force immediate file moves before public contracts are stable.

## 14. Canonical statement

> Enterprise Context owns Enterprise Graph Definition truth; Eidos owns reusable 2D/3D interaction cores; App Platform owns three EOG application plugins—2D Designer, 2D Viewer and 3D Viewer—which consume the same authoritative definition through stable contracts.


## 15. Physical extraction progress — 2D Designer semantic core

The first physical extraction slice moves implementation ownership for the EOG semantic model, legacy compatibility store, and Host-facing semantic service into `apps/eog-2d-designer/`.

Moved implementation owners:

- `enterprise-operating-graph-model.ts`
- `enterprise-operating-graph-store.ts`
- `enterprise-operating-graph-service.ts`

The previous `manager/enterprise-operating-graph-*.ts` locations remain as compatibility re-exports only.

This does not change semantic authority: authoritative Enterprise Graph Definition persistence remains Enterprise Context Business Definition Repository. The package-local store exists only for compatibility/migration and tests; it is not restored as production authority.


## 16. Shared View State provider boundary

2D and 3D View State share a Host-owned persistence/provider boundary rather than importing one another's private implementation.

Authority split:

```text
Enterprise Graph Definition
= Enterprise Context authority

DIAGRAM_2D / SPATIAL_3D View State
= shared presentation-state provider
  ├─ public contract: contracts/enterprise-operating-graph-view-state.ts
  └─ Host implementation: providers/eog-view-state/**
```

EOG application plugins consume only the public View State provider contract. The provider is presentation infrastructure only: it cannot create semantic graph revisions, confirm Enterprise relations or publish Enterprise Graph Definitions.

Legacy `manager/enterprise-operating-graph-view-*` paths remain compatibility re-exports during convergence.


## 17. Public semantic read boundary

Viewer-side plugins do not depend on the 2D Designer's private Host service type.

The stable read seam is:

```text
EnterpriseOperatingGraphReadProviderV010
├─ get(enterpriseId, graphId)
└─ list(enterpriseId)
```

The 2D Designer Host service structurally implements this contract while retaining its private write/mutation surface. 2D Viewer, 3D Viewer and Observatory code consume only the read contract for semantic graph access.

This keeps write authority and editor implementation out of read-oriented plugins without creating a second graph authority.


## 18. Package-neutral 2D projection adapter

The common mapping from Enterprise Graph semantic nodes/relations plus DIAGRAM_2D View State into Eidos 2D nodes/edges is a package-neutral pure adapter:

`eog/diagram-projection.ts`

It owns no lifecycle, authority, persistence, action handling or package identity.

The base projection emits nodes/edges only and no semantic edit actions. The 2D Designer adds confirmation/publication actions in its own package. The 2D Viewer may consume the same base mapping in read-only mode without depending on Designer implementation.


## 19. Package-neutral Observatory input grammar

Time Lens, metric filter and target request parsing is shared by 2D and 3D observation experiences. It is therefore not owned by either Viewer plugin.

Canonical implementation:

`eog/observatory-input.ts`

Both Viewer families consume this neutral parser. The old manager path and the temporary 2D Viewer path remain compatibility re-exports only.

This prevents 3D Viewer from depending on 2D Viewer private implementation while keeping the Observatory request contract identical across projections.


## 20. Public Observatory runtime contract

Viewer plugins and peer analysis/runtime Provider packages no longer type-depend on the Host manager implementation.

Public authority:

`contracts/enterprise-operating-graph-observatory-runtime.ts`

It defines:

- Observatory Service shape;
- Provider Resolver shape;
- Runtime Fact / Analysis provider capability identifiers;
- provider contract identifiers.

The Host manager keeps provider discovery/binding and concrete service construction. Viewer plugins receive the public resolver/service boundary and remain unaware of manager-private implementation.


## 21. EOG plugin dependency closure

All three EOG application packages are now prohibited from importing `manager/**` private implementation.

The final generic dependency that crossed this boundary, material-write authorization, is exposed from the shared ActionHost utility layer:

`actions/material-write-authorization.ts`

The legacy manager path remains a compatibility re-export for Host code.

CI now enforces:

```text
apps/eog-2d-designer/**
apps/eog-2d-viewer/**
apps/eog-3d-viewer/**
    !-> manager/**
```

Allowed dependency directions are public contracts, neutral EOG adapters, shared ActionHost utilities and public Eidos Core facades.


## 22. 2D Viewer / Designer interactive workspace correction

The authoritative interaction model is defined in:

`docs/architecture/EOG-2D-INTERACTIVE-WORKSPACE-v0.1.md`

Key correction:

```text
Viewer = interactive inspect/navigate + no semantic mutation
Designer = same shared interaction baseline + governed semantic editing
```

The two packages MUST share Eidos 2D interaction primitives and package-neutral EOG 2D projection/inspector models rather than duplicating canvas and property-inspector behavior.

The Viewer may inspect node and edge properties, navigate, drill down, filter and interact with overlays. Its prohibition is on Enterprise Graph semantic mutation, not on interaction.


## 23. 2D package convergence

The previous physical split into separate EOG 2D Viewer and EOG 2D Designer
packages is superseded by one installable `evo-eog-2d` Package with two
Feature profiles:

- `evo-eog-2d.viewer`
- `evo-eog-2d.designer`

Designer requires Viewer and adds governed semantic mutation. Viewer remains
fully interactive for selection, node/edge inspection, navigation and
presentation interaction.

Authority: `docs/architecture/EOG-2D-PACKAGE-CONVERGENCE-v0.1.md`.


## 24. Final package convergence

The migration-era three-package model is superseded by:

```text
evo-eog-2d
├─ viewer
└─ designer

evo-eog-3d
└─ viewer

evo-enterprise-observatory
├─ 2d
└─ 3d
```

2D Viewer and Designer share one interactive Workspace family. EOG 3D Viewer
uses the neutral Eidos Spatial Workspace. Runtime Fact / Analysis experiences
belong to the peer Enterprise Observatory package in both dimensions.

Compatibility module paths and observe routes may remain while callers migrate;
they do not imply ownership.
