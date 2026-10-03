# Enterprise Observatory Peer Package v0.1

**Status:** AUTHORITATIVE  
**Date:** 2026-10-03

## Decision

Enterprise Observatory is a peer application plugin. It is not a mode owned by
EOG 2D Viewer and it is not the definition of EOG 3D Viewer.

Current converged model:

```text
evo-eog-2d
├─ viewer
└─ designer

evo-eog-3d
└─ viewer

evo-enterprise-observatory
├─ 2d
│  ├─ desktop runtime-fact / analysis overlay experience
│  └─ mobile read experience
└─ 3d
   └─ spatial runtime-fact / analysis overlay experience
```

The Observatory 2D Feature requires the public EOG 2D Viewer Feature. The
Observatory 3D Feature requires the public EOG 3D Viewer Feature. They reuse
the same authoritative Enterprise Graph projection surfaces while keeping
lifecycle and business responsibility independent.

## Ownership

EOG 2D Viewer owns:

- interactive graph reading;
- node/edge selection;
- Inspector;
- navigation;
- presentation View State;
- peer contribution rendering seams.

Enterprise Observatory owns:

- Time Lens;
- Runtime Fact observation orchestration;
- Analysis overlay orchestration;
- observatory desktop/mobile Experience;
- observatory Agent read tools.

Runtime Fact and Analysis calculations remain in their Provider packages.
Enterprise Observatory aggregates them; it does not absorb their calculation
authority.

## Compatibility

The existing routes remain stable during extraction:

- `/operating-graph/observe`
- `/m/operating-graph/observe`

Legacy module paths under `apps/eog-2d-viewer` and `manager` remain
compatibility re-exports only.

## 3D convergence

EOG 3D Viewer now owns a neutral `spatial-workspace` surface at
`/operating-graph/view/3d`.

The compatibility route `/operating-graph/observe/3d` belongs to the
Enterprise Observatory 3D Feature and layers Runtime Facts / analysis over the
same package-neutral spatial projection.

SOP remains separate and deferred.
