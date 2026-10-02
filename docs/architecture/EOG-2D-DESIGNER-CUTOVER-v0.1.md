# EOG 2D Designer Controlled Cutover v0.1

**Status:** IMPLEMENTED / CI GATE  
**Date:** 2026-10-02  
**Parent authority:** `EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`

## Scope

This slice moves runtime ownership of the existing EOG 2D Designer Experience and its Human ActionHost handlers from the Enterprise Agent compatibility feature to the dedicated application package:

```text
evo-eog-2d-designer
└── evo-eog-2d-designer.default
```

It does not migrate the 2D Viewer or 3D Viewer yet.

## Ownership after cutover

```text
Enterprise Context
= Enterprise Graph Definition authority

evo-eog-2d-designer
= 2D Designer Experience
+ EOG semantic Human actions
+ EOG 2D view/read/edit Human actions

Eidos 2D Core
= reusable diagram/graph interaction primitives
```

## Compatibility preserved

The following public compatibility identifiers remain unchanged:

- route: `/operating-graph`;
- page source: `app://evo-enterprise-operating-graph/pages/editor`;
- existing EOG command codes;
- EOG semantic graph and View State contracts;
- Human confirmation requirement for Enterprise relation confirmation and publish.

The legacy manifest helper remains temporarily available but reports the new Designer package/feature owner.

## Lifecycle migration

The Designer feature becomes default-active and the Host performs an idempotent startup install/activation when it is not already active.

Dependencies remain explicit:

- `enterprise.business-definition.repository`;
- `authorization.check`.

This is a package-ownership cutover, not a second definition authority.

## Experience discovery

The Designer Experience now comes from ordinary `manager.listEffectiveExperiences()`.

The Host no longer injects the old Enterprise Agent-owned Designer manifest into `/v1/experiences/effective`.

The 2D Viewer and 3D Viewer compatibility manifests remain under the existing path until their own cutover slices.

## Action gating

EOG semantic Human action handlers and EOG 2D diagram action handlers now declare:

- packageId: `evo-eog-2d-designer`;
- featureId: `evo-eog-2d-designer.default`.

Therefore the existing App Action Router lifecycle gate now enforces Designer package activation.

## Agent tool boundary

Personal Agent EOG tool registration is deliberately not physically split in this slice because the current tool set mixes semantic read/proposal and 2D/3D View operations.

Human/Agent authority invariants remain unchanged.

Agent tool ownership will be separated only after Viewer ownership is cut over, so READ/proposal/2D/3D responsibilities can be assigned without creating another mixed package.

## Acceptance

This slice is accepted when:

1. Designer package installation activates its definition/authorization dependencies;
2. the effective Designer Experience belongs to `evo-eog-2d-designer`;
3. only one effective `/operating-graph` route exists;
4. semantic and diagram action handlers are gated by the Designer feature;
5. Enterprise Agent no longer owns/injects the 2D Designer Experience;
6. existing semantic/Human confirmation tests remain green.


## Physical ownership convergence — actions and editor projection

The second physical extraction slice moves implementation ownership for:

- `enterprise-operating-graph-actions.ts`;
- `enterprise-operating-graph-page.ts`.

Their authoritative implementation now lives under `apps/eog-2d-designer/`.
The previous `manager/` paths remain compatibility re-exports only.

The shared View State service/store remains outside this slice because it is still consumed by both 2D and 3D surfaces. Personal Agent tool implementation is also deferred to a dedicated package split so 2D Designer and 3D Viewer ownership are not recombined in one physical module.
