# EOG 3D Viewer Controlled Cutover v0.1

**Status:** IMPLEMENTED / CI GATE  
**Date:** 2026-10-02  
**Parent authority:** `EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`

## Scope

This slice moves runtime ownership of the EOG 3D Viewer Experience and its spatial read ActionHost handler from the Enterprise Agent compatibility feature to:

```text
evo-eog-3d-viewer
└── evo-eog-3d-viewer.default
```

This completes Experience/Action ownership cutover for the three EOG application plugins.

## Ownership after cutover

```text
Enterprise Context
= Enterprise Graph Definition authority

evo-eog-2d-designer
= 2D design/write Experience

evo-eog-2d-viewer
= 2D read/aggregation Experience

evo-eog-3d-viewer
= 3D read/spatial Experience

peer Providers / Plugins
= Runtime Facts and analysis calculations

Eidos
├── 2D Core
└── 3D Core
```

## Compatibility preserved

Unchanged identifiers:

- route: `/operating-graph/observe/3d`;
- spatial page source: `app://evo-enterprise-operating-graph/pages/observatory-spatial`;
- spatial read command code;
- SPATIAL_3D View State semantics;
- Runtime Fact / Analysis Overlay provenance boundaries.

## Lifecycle migration

The 3D Viewer feature becomes default-active. Host startup performs idempotent install/activation when needed.

Dependency remains explicit:

- `enterprise.business-definition.repository`.

## Experience discovery

The 3D Viewer Experience now comes from ordinary package lifecycle discovery.

The Host no longer injects any EOG Experience manifest on behalf of the Enterprise Agent feature.

Therefore Enterprise Agent is no longer the Experience owner for:

- EOG 2D Designer;
- EOG 2D Viewer;
- EOG 3D Viewer.

## Action gating

The spatial Viewer read handler now declares:

- packageId: `evo-eog-3d-viewer`;
- featureId: `evo-eog-3d-viewer.default`.

The App Action Router therefore enforces 3D Viewer lifecycle activation.

## Remaining compatibility debt

Personal Agent EOG tools still use the historical mixed registration path. They combine:

- semantic graph read/proposal;
- 2D View operations;
- 3D View operations;
- observatory read/analysis operations.

Now that all three application plugins have independent lifecycle ownership, Agent tools can be split in a separate slice without changing Human UI ownership.

## Acceptance

1. 3D Viewer install activates its Enterprise Context definition dependency;
2. exactly one spatial Viewer route is effective;
3. spatial read handler is gated by `evo-eog-3d-viewer.default`;
4. no EOG Experience is injected by the Enterprise Agent compatibility feature;
5. analysis calculation remains in peer Providers/Plugins;
6. existing spatial regression tests remain green.


## Spatial Viewer physical cutover

The 3D spatial Observatory implementation now lives under `apps/eog-3d-viewer/spatial-page.ts`.

It consumes only:

- the public Enterprise Graph semantic read contract;
- the public shared View State provider contract;
- the package-neutral Observatory input grammar;
- the public Eidos 3D Core facade;
- Host-provided Observatory provider resolution.

It no longer imports 2D Designer or 2D Viewer private implementation. The old manager spatial page path remains a compatibility re-export only.


## Superseding convergence — 2026-10-03

The original cutover intentionally preserved the historical Spatial
Observatory implementation inside the 3D Viewer package. That transitional
ownership is now superseded.

Canonical target:

- `evo-eog-3d / evo-eog-3d.viewer` owns the neutral 3D spatial Viewer;
- `evo-enterprise-observatory / evo-enterprise-observatory.3d` owns Runtime
  Fact and Analysis overlays;
- both reuse the package-neutral EOG spatial projection and Eidos 3D Workspace.

The old `apps/eog-3d-viewer/spatial-page.ts` path is compatibility only.
