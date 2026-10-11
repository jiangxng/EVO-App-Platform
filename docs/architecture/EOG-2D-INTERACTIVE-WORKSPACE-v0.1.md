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


## Property ownership and peer contribution

The shared Inspector must not copy all business properties into EOG ownership.

Public contribution contract:

`contracts/enterprise-operating-graph-inspector.ts`

A property owner may contribute display data for an EOG node or relation. For example, an Application-definition capability may contribute Application properties for a node whose semantic reference points to that definition.

The 2D adapter applies contributions as follows:

```text
owner property contribution
          ↓
shared Inspector property value
       ↙                 ↘
   Viewer              Designer
   display             display
   no editor           optional owner editor
                           ↓
                  owner ActionHost command
```

The edit command belongs to the property owner. EOG does not proxy or reinterpret that write.

Built-in EOG structural properties remain produced by the package-neutral EOG projection. Contributed keys may not silently replace built-in keys.


## Inspector provider aggregation

Inspector property ownership is additive. The Host therefore resolves all active providers for the public Inspector capability rather than selecting one winner.

The resolver:

- discovers active `enterprise.operating-graph.inspector-properties` providers;
- resolves registered runtimes in deterministic provider-id order;
- validates provider identity and target identity;
- returns contributions without routing property writes through EOG.

Viewer/Designer role filtering remains downstream: Viewer strips edit descriptors; Designer may retain them.


## Lazy selection runtime integration

Eidos 2D Core upstream PR #81 adds target-scoped selection reads.

App Platform integrates this as two package-owned commands over one neutral EOG pipeline:

- Viewer selection read: peer properties are returned without edit descriptors;
- Designer selection read: the same peer properties retain owner-declared edit descriptors.

Provider discovery is additive and Host-owned. Property write commands continue to target the true owner plugin declared by each provider.


## EOG-owned editable Inspector properties

The first concrete editable fields are limited to properties actually owned by the Enterprise Graph domain:

- an unconnected node may rebind its canonical semantic reference;
- an unconfirmed Guidance relation may revise its Guidance source kind/reference.

These edits create a new Enterprise Graph revision through the existing governed Designer semantic mutation path.

Safety rules:

- a node participating in Guidance or Enterprise relations cannot be rebound directly;
- a Guidance source referenced by a confirmed Enterprise relation is immutable;
- Published Enterprise Graph definitions remain immutable.

This is intentionally separate from peer-owned business properties.

```text
EOG-owned structural property
→ EOG Designer semantic mutation
→ Enterprise Context authoritative new definition revision

Application/Ledger/other business property
→ owner Inspector provider editor descriptor
→ owner ActionHost command
→ owner authority
```

EOG must not become a generic write router for business properties merely because those properties are displayed inside its Inspector.


## Runtime convergence — neutral Workspace capability

Eidos 2D Core now accepts the neutral serialized kind `diagram-workspace` and
makes `operationCommand` optional.

EOG adopts that contract directly:

- Viewer: `diagram-workspace` + read + selection/Inspector, no operation command.
- Designer: the same `diagram-workspace` + explicit governed operation command.

This removes the previous fake Viewer edit command. Viewer interactivity is
proven by selection reads and Inspector properties, not by an operation handler
that merely rejects writes.


## Observatory extraction

The earlier compatibility model that described Observatory as a Viewer mode is
superseded.

Canonical ownership is now:

```text
EOG 2D Viewer
= interactive Workspace / selection / Inspector / navigation

Enterprise Observatory
= peer plugin
  + Time Lens
  + Runtime Facts
  + Analysis overlays
```

The Observatory may reuse the EOG projection and requires the Viewer Feature,
but it has an independent Package/Feature lifecycle. The Viewer package no
longer contributes `/operating-graph/observe` or the mobile Observatory
surface.

Authority:
`docs/architecture/ENTERPRISE-OBSERVATORY-PEER-PACKAGE-v0.1.md`.


## Professional canvas visual convergence

The EOG 2D Viewer/Designer adopts the Eidos professional-canvas hierarchy rather than maintaining a private graph skin.

Current product behavior:

- the graph canvas expands to the available Workbench task height instead of using a short fixed diagram window;
- when no saved camera exists, the initial camera fits the visible projection and keeps fit behavior through container resize until the Human manually pans/zooms;
- camera controls live as a compact floating control group at the canvas edge; business actions such as Edit projection / Save projection remain page actions;
- an empty Inspector does not permanently consume canvas width; selection opens contextual detail and clearing selection restores the canvas width;
- Application and Ledger nodes retain their product-owned type/shape distinction while Eidos supplies restrained Business Office surfaces, light borders and brand-only selection emphasis;
- dense relations are visually low-weight by default; selecting a node or relation emphasizes the directly connected neighborhood and de-emphasizes unrelated graph content;
- relation labels are progressively disclosed for dense graphs instead of rendering every label continuously;
- relation stroke width remains screen-stable during zoom where SVG supports non-scaling strokes;
- raw renderer/state metadata is not default business chrome.

These rules are presentation-only. They do not change ledger/application semantics, projection persistence rules or Enterprise Definition authority.

Reference patterns were reviewed from mature canvas/map products (Figma, Miro, Mapbox and Lucidchart) and summarized into Eidos-owned design authority so the product does not depend on external product imitation at runtime.


## Direct manipulation and keyboard conventions

The EOG 2D editor follows Eidos-owned professional canvas conventions rather than inventing ledger-specific controls.

Spatial behavior:

- projection coordinates are unbounded presentation coordinates; nodes may be dragged left/up past the original layout origin and may therefore have negative x/y values;
- the camera, not a hard canvas origin, defines what the Human sees;
- clicking blank canvas or pressing Escape clears the current node/edge selection;
- selecting a node or relation returns keyboard focus to the canvas so editing shortcuts remain available.

Keyboard behavior:

- Escape: clear selection;
- Delete / Backspace: remove the selected node or relation from the current projection only;
- Arrow keys: nudge a selected movable node by 1 view unit;
- Shift + Arrow: nudge by 10 view units;
- + / -: zoom in/out;
- Shift + 1: fit the visible graph;
- Shift + 2: fit the current selection;
- Ctrl/Cmd + 0: return zoom to 100%.

Copy, paste and duplicate are intentionally not assigned to business nodes. EOG must not imply that duplicating a drawn node duplicates the underlying Application, Ledger or other Enterprise Definition object.

Keyboard shortcuts are ignored while focus is inside text inputs, selects, textareas or contenteditable controls.
