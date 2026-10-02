# EOG 2D Interactive Workspace Model v0.1

**Status:** AUTHORITATIVE ARCHITECTURE CORRECTION  
**Date:** 2026-10-02  
**Parent:** `EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`

## Core correction

EOG 2D Viewer is **not** a static read-only page.

It is an interactive 2D workspace that shares most navigation, selection and inspection behavior with EOG 2D Designer.

The boundary is not:

```text
Viewer = no interaction
Designer = interaction
```

The boundary is:

```text
Viewer
= interactive inspection/navigation
+ presentation/view interaction
- Enterprise Graph semantic mutation

Designer
= the same inspection/navigation foundation
+ Enterprise Graph semantic mutation
```

## Layering

```text
Eidos 2D Core
  generic canvas / hit test / selection / inspector / pan / zoom / interaction

          ↓

EOG 2D Workspace
  EOG node/edge projection
  EOG node/edge inspector model
  EOG selection/detail model
  shared EOG 2D interaction semantics

       ↙                         ↘

EOG 2D Viewer                EOG 2D Designer
inspect / navigate           inspect / navigate
overlays / drill-down        overlays / drill-down
no semantic writes           + semantic edit commands
```

Neither EOG application plugin imports the other's private implementation.

## Shared Viewer + Designer behavior

Both surfaces should support, where applicable:

- select a node;
- select a connection/edge;
- inspect node properties;
- inspect edge/relation properties;
- pan / zoom / focus;
- search / locate / navigate;
- open related entity detail or drill-down;
- render peer-plugin overlays/indicators;
- display lifecycle/state/provenance;
- keyboard/focus/accessibility interaction;
- transient selection and viewport state.

These capabilities belong to the shared workspace model or Eidos 2D Core, not exclusively to Designer.

## Viewer capabilities

Viewer may interact deeply with the graph while remaining semantically non-mutating.

Allowed:

- node selection;
- edge selection;
- node property inspection;
- edge property inspection;
- navigation and drill-down;
- filters / Time Lens / overlay selection;
- pan / zoom / focus;
- transient presentation state;
- persisted presentation state only through an explicit View State policy.

Not allowed:

- create/delete Enterprise Graph nodes;
- create/delete/reconnect semantic relations;
- edit semantic node/edge properties;
- confirm Enterprise relations;
- publish Enterprise Graph Definition revisions.

Therefore **read-only means semantic-read-only, not interaction-read-only**.

## Designer capabilities

Designer includes the full Viewer interaction baseline plus governed semantic editing:

- edit permitted node properties;
- edit permitted edge/relation properties;
- create/remove nodes;
- create/remove/reconnect relations;
- create/remove guidance relations;
- Human-confirm governed Enterprise relations;
- publish Draft definitions through Enterprise Context;
- persist permitted layout/View State changes.

Designer editing must remain field/action capability driven rather than being inferred merely from rendering mode.

## Property Inspector model

Node/edge inspection must be shared.

The target inspector shape is generic:

```text
Selection
  kind: NODE | EDGE
  id
  title
  properties[]
    key
    label
    value
    display
    editor?        // absent in Viewer, available only when Designer permits
    writeAction?   // explicit governed command
  actions[]
```

Viewer receives the same property values/schema but no semantic editor/write action.

Designer receives editable controls only for fields for which the owning domain exposes a write capability.

This avoids maintaining two property panels with duplicated business semantics.

## Eidos responsibility

Eidos 2D Core should provide generic reusable primitives for:

- canvas;
- nodes/edges;
- selection;
- hit testing;
- pan/zoom/focus;
- inspector shell;
- generic property rows/edit controls;
- generic interaction events;
- action slots;
- accessibility.

Eidos must not understand EOG node kinds, Enterprise Context, Ledger, SOP or enterprise relation semantics.

The current `DiagramEditor*` implementation is a convergence asset. The target abstraction is a neutral **2D Workspace**, with editing as an optional capability rather than the identity of the whole surface.

## EOG shared responsibility

The package-neutral EOG 2D layer owns:

- Enterprise Graph → 2D node/edge projection;
- node/edge property-inspector projection;
- shared selection/detail mapping;
- shared read interaction descriptors;
- renderer-independent EOG presentation semantics.

It must not own Enterprise Context persistence or package lifecycle.

The current `eog/diagram-projection.ts` is the starting point for this layer.

## View State rule

Semantic Definition and View State remain separate.

Viewer interaction may change ephemeral UI state freely.

Persistent View State writes require an explicit policy. They are not automatically forbidden merely because the user is in Viewer, and they are not automatically allowed merely because they are non-semantic.

This lets future products support personal layouts, saved viewpoints or shared presentation layouts without confusing them with Enterprise Graph Definition mutation.

## Capability matrix

| Capability | 2D Viewer | 2D Designer |
| --- | --- | --- |
| render graph | yes | yes |
| select node | yes | yes |
| select edge | yes | yes |
| inspect node properties | yes | yes |
| inspect edge properties | yes | yes |
| pan / zoom / focus | yes | yes |
| filters / overlays / drill-down | yes | yes |
| edit node semantic properties | no | governed yes |
| edit edge semantic properties | no | governed yes |
| create/remove node | no | governed yes |
| create/remove/reconnect semantic relation | no | governed yes |
| confirm/publish definition | no | Human-governed yes |
| persistent View State write | policy-driven | policy-driven |

## Consequence for current implementation

The existing Viewer fail-closed semantic operation boundary remains useful, but it must not be interpreted as forbidding all Viewer interaction.

The next convergence work is:

1. extend Eidos 2D from editor-shaped primitives toward neutral Workspace + Inspector primitives;
2. extend the package-neutral EOG 2D projection with structured node/edge inspector data;
3. make Viewer consume the inspector in non-editable mode;
4. make Designer consume the same inspector plus explicit field/action editors;
5. keep semantic mutation commands Designer-owned.


## Implementation progress — shared structured Inspector

Upstream Eidos 2D Core PR #77 / merge `747e0968e12da23a45159edd214da879a1981872` adds renderer-independent structured selection properties for both nodes and edges.

App Platform now mirrors that public primitive and projects EOG node/edge properties from the package-neutral `eog/diagram-projection.ts`.

Result:

- Viewer and Designer receive the same node/edge property values;
- Viewer renders them without semantic editors;
- Designer receives the same property model and can add governed edit descriptors in a later slice;
- property semantics remain in EOG, while rendering remains generic in Eidos.


## Implementation progress — field-level edit binding

Eidos 2D Core now supports optional field-level Inspector editor descriptors. App Platform binds these through:

`eog/2d-inspector-editors.ts`

The shared EOG property projection remains read-oriented. Editor metadata is attached only by an explicit binding keyed by target and property key.

Therefore:

- Viewer receives the shared property values and no semantic editors;
- Designer may attach an editor only after a domain write contract exists;
- a visible property does not imply writability;
- an editable control does not invent persistence semantics;
- authorization and validation remain in the owning domain/Host action.

At this stage no new EOG semantic property-write operation is invented. The seam is ready for real domain capabilities to opt in.


## Implementation progress — neutral Workspace API adoption

Eidos 2D Core exposes `DiagramWorkspace*V010` compatibility names over the existing v0.1 diagram surface.

The package-neutral EOG projection, Inspector editor-binding seam, 2D Viewer and 2D Designer now consume those neutral Workspace types.

Designer-specific function names may still use `Editor` where the function itself is specifically about editing. The reusable surface type no longer implies that every consumer is an editor.


## Viewer shell and Observatory mode

The generic 2D Viewer Workspace is now distinct from the Observatory mode.

```text
EOG 2D Viewer
├── Workspace
│   ├── graph navigation
│   ├── node / edge selection
│   └── shared property Inspector
│
└── Observatory mode
    ├── Time Lens
    ├── Runtime Fact overlays
    └── Analysis overlays
```

The Viewer package default desktop entry is the generic Workspace. The existing `/operating-graph/observe` route remains available as a compatibility/observability mode.

This prevents Runtime Observatory from becoming the definition of the Viewer product.
