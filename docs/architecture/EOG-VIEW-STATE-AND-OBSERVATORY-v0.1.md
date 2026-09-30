# Enterprise Operating Graph — View State and Observatory Architecture v0.1

> **Ownership/CI correction — 2026-09-30:** The Observatory, Runtime Fact, Analysis Overlay, Bottleneck and SOP-analysis implementations documented here are **preserved assets**. They are no longer assumed to be intrinsic EOG Core ownership. Their future ownership will be decided when report/analysis/runtime-adapter plugins are planned. They are **NON_GATING_FOR_CURRENT_EOG_CORE_CI** and MUST be preserved for future plugin extraction. EOG Core itself remains CI-gated. See `ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md` and `eog-asset-boundary.v0.1.json`.
>
> This correction changes ownership and CI classification, not the historical validity of the implemented/proven capabilities below.

**Status:** IMPLEMENTATION FOUNDATION  
**Date:** 2026-09-28

## 1. Decision

Enterprise Operating Graph is not a diagram document.

The Host-authoritative enterprise model is separated from every visual arrangement:

```text
Enterprise Operating Graph
├── Semantic Graph
│   ├── canonical node bindings
│   ├── Guidance relations
│   ├── Human-confirmed enterprise relations
│   └── semantic lifecycle / revision
│
└── View State
    ├── DIAGRAM_2D
    │   └── x / y placement
    └── SPATIAL_3D
        ├── x / y / z placement
        └── camera
```

A view is disposable presentation state. It is not enterprise truth.

## 2. Why the split is mandatory

A single enterprise model may have many useful arrangements:

- process-oriented 2D editing;
- finance-oriented 2D layout;
- supply-chain layout;
- 2.5D layered view;
- full 3D observatory;
- temporary Agent-created analysis lenses.

If coordinates lived on the Semantic Graph, changing a camera or rearranging a node would create a false enterprise-model change.

Therefore:

- semantic revision changes only when enterprise semantics change;
- view revision changes only when presentation state changes;
- published semantic models are immutable;
- views over a published semantic model may continue to change.

## 3. v0.1 View kinds

### DIAGRAM_2D

Stores renderer-independent x/y placement.

The current Eidos Diagram Editor consumes this view. Eidos is responsible for interaction and rendering. App Platform owns the Host View State.

### SPATIAL_3D

Stores renderer-independent x/y/z placement and optional camera position/target.

This is deliberately not a Three.js contract. Three.js may be an Eidos renderer behind the spatial abstraction.

## 4. 3D is an observability surface, not decoration

The long-term 3D experience is an Enterprise Observatory.

Its purpose is to give a stable, clean "god view" over enterprise operation, especially where a dense 2D topology becomes difficult to reason about.

The stable spatial model should represent relatively persistent structure. Dynamic operational measurements should be overlays, not layout churn.

Candidate stable axes:

```text
X = value stream / business-flow direction
Y = business domain / organization / product line
Z = semantic layer
```

The exact mapping is view policy, not Semantic Graph truth.

## 5. Runtime and Analysis Overlay direction

Future Observatory views combine three independent sources:

```text
Semantic Graph
      +
Runtime Facts
      +
Derived Analysis
      ↓
Observatory Projection
```

Runtime facts may include:

- event frequency;
- throughput;
- WIP / backlog;
- waiting time;
- lead time;
- quantities and amounts;
- queue age;
- actual execution paths.

Derived analysis may include:

- SOP conformance and deviation;
- bottleneck detection;
- abnormal path detection;
- capacity pressure;
- trend and seasonality;
- cost / cash-flow impact;
- simulation results.

Derived analysis never overwrites source facts or Semantic Graph truth.

## 6. SOP model direction

EOG should ultimately allow comparison of:

```text
Expected Path (SOP)
vs
Actual Event Trace
```

The Observatory can then show where execution follows, deviates from, bypasses, or stalls relative to the expected path.

Human confirmation remains distinct from observed behavior. Frequent behavior is not automatically promoted into enterprise policy.

## 7. Agent boundary

Personal Agent may:

- propose Semantic Graph draft changes;
- arrange 2D/3D View State;
- create filters and analysis lenses;
- explain runtime and analysis overlays.

Personal Agent may not:

- silently convert Guidance into enterprise truth;
- confirm enterprise relations;
- publish the semantic model.

Human and Agent use the same Host View State when arranging the same named view.

## 8. Rendering boundary

```text
Host EOG Semantic Graph
Host EOG View State
        ↓
App Platform projection
        ↓
Eidos
├── diagram-core / 2D renderer
└── spatial-core / Three-like renderer
        ↓
optional concrete renderer
├── maxGraph
└── Three.js / later renderer
```

No renderer-specific XML, scene graph, mesh object, DOM node, WebGL object or Three.js object may become EOG truth.

## 9. Current implementation

The first implementation establishes:

- Semantic Graph without coordinates;
- independent durable View State store;
- DIAGRAM_2D placement;
- SPATIAL_3D placement and camera contract;
- separate optimistic revisions;
- Human Eidos drag -> View State only;
- Agent semantic tools separated from Agent view tools.

Three.js rendering, Runtime Facts and Analysis Overlay are intentionally not implemented in this slice.

## 10. Next architectural slice

After the 2D Human/Agent round-trip is stable, the next foundation should define:

1. Runtime Fact projection into EOG;
2. Analysis Overlay contract;
3. Time Lens contract;
4. SOP Expected Path vs Actual Event Trace comparison;
5. Eidos Spatial Surface consuming SPATIAL_3D View State.

The implementation must remain bounded: do not turn the current milestone into a generic 3D dashboard project.
