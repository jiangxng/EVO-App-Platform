# Enterprise Observatory Peer Package v0.1

**Status:** AUTHORITATIVE  
**Date:** 2026-10-03

## Decision

Enterprise Observatory is a peer application plugin. It is not a mode owned by
EOG 2D Viewer and it is not the definition of EOG 3D Viewer.

Current first extraction:

```text
evo-eog-2d
├─ viewer
└─ designer

evo-enterprise-observatory
└─ 2d
   ├─ desktop runtime-fact / analysis overlay experience
   └─ mobile read experience
```

The Observatory 2D Feature requires the public EOG 2D Viewer Feature because
it projects observations over the same enterprise graph, but lifecycle and
business responsibility are independent.

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

## Next slice

3D Viewer will receive a neutral spatial Workspace identity. The current
Spatial Observatory projection will then become an Enterprise Observatory 3D
Feature rather than defining the EOG 3D Viewer product.

SOP remains separate and deferred.
