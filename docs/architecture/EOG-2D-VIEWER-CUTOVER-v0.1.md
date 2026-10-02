# EOG 2D Viewer Controlled Cutover v0.1

**Status:** IMPLEMENTED / CI GATE  
**Date:** 2026-10-02  
**Parent authority:** `EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`

## Scope

This slice moves runtime ownership of the EOG 2D Viewer Experience and its read/orchestration ActionHost handlers from the Enterprise Agent compatibility feature to:

```text
evo-eog-2d-viewer
└── evo-eog-2d-viewer.default
```

It includes both desktop and mobile-read Viewer surfaces.

## Ownership after cutover

```text
Enterprise Context
= Enterprise Graph Definition authority

evo-eog-2d-viewer
= desktop 2D Viewer Experience
+ mobile read Experience
+ observatory read/analyze orchestration actions
+ 2D observatory projection read action

peer Providers / Plugins
= Runtime Facts and analysis calculations

Eidos 2D Core
= reusable 2D interaction/rendering primitives
```

The Viewer aggregates peer contributions; it does not absorb their calculations.

## Compatibility preserved

Unchanged compatibility identifiers:

- desktop route: `/operating-graph/observe`;
- mobile read route: `/m/operating-graph/observe`;
- existing observatory/mobile page sources;
- existing observatory command codes;
- Runtime Fact / Analysis Overlay provenance boundaries.

## Lifecycle migration

The 2D Viewer feature becomes default-active. Host startup performs idempotent install/activation when needed.

Dependency remains explicit:

- `enterprise.business-definition.repository`.

Runtime/analysis Providers stay optional so the Viewer can degrade honestly when no provider is bound.

## Experience discovery

The 2D Viewer Experience now comes from ordinary package lifecycle discovery.

The Host no longer injects the Enterprise Agent-owned 2D Observatory manifest.

The 3D Viewer compatibility manifest remains temporarily on the Enterprise Agent path until its own cutover.

## Action gating

The following now declare the dedicated Viewer package/feature owner:

- observatory observe/analyze orchestration handlers;
- desktop observatory projection read handler;
- mobile read handler.

The existing App Action Router therefore enforces Viewer lifecycle activation.

## Agent tool boundary

Observatory Agent tools remain on the compatibility tool-registration path until the 3D Viewer cutover is complete. This avoids prematurely assigning mixed 2D/3D tool ownership.

## Acceptance

1. Viewer install activates its Enterprise Context definition dependency;
2. exactly one desktop Viewer route and one mobile-read Viewer route are effective;
3. Viewer read/orchestration handlers are gated by `evo-eog-2d-viewer.default`;
4. Enterprise Agent no longer injects the 2D Viewer Experience;
5. analysis computation remains in peer Providers/Plugins;
6. existing observatory regression tests remain green.


## Physical ownership convergence — runtime/read slice

The following implementations now live under `apps/eog-2d-viewer/`:

- Observatory request input parsing;
- Observatory Human action handlers;
- Observatory Personal Agent tools;
- mobile read projection/action handling.

The previous `manager/enterprise-operating-graph-*` locations remain compatibility re-exports only.

The desktop 2D Observatory projection is intentionally deferred to the next slice because it still shares EOG-to-Eidos 2D projection logic with the Designer. That projection dependency will be separated before the desktop page is moved.


## Desktop Viewer physical cutover

The desktop Observatory projection now lives under `apps/eog-2d-viewer/desktop-page.ts`.

Key boundary changes:

- consumes the package-neutral EOG 2D base projection directly;
- consumes the public semantic read contract and public View State provider contract;
- no longer imports the Designer page/service implementation;
- no longer binds its page to the Designer semantic/view operation command;
- exposes a Viewer-owned operation command that fails closed as `EOG_2D_VIEWER_READ_ONLY`;
- old manager page path is a compatibility re-export only.

This makes semantic read-only behavior an executable boundary. It does not prohibit Viewer interaction such as node/edge selection, property inspection, navigation, drill-down, filters, overlays, pan/zoom/focus, or policy-governed presentation-state behavior.


## Interactive Viewer clarification

The Viewer is not a static reader.

It shares the 2D workspace interaction foundation with Designer, including node/edge selection and property inspection. The difference is that semantic editors and semantic mutation actions are absent from Viewer.

The Viewer-owned fail-closed operation command protects the semantic write boundary only. Generic local interaction and future explicitly governed View State commands belong to the shared workspace model.
