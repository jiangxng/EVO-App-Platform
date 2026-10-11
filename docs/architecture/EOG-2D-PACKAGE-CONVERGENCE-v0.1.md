# EOG 2D Package Convergence v0.1

**Status:** AUTHORITATIVE  
**Date:** 2026-10-03

## Decision

EOG 2D Viewer and EOG 2D Designer are two Feature profiles of one installable
EOG 2D Package.

```text
evo-eog-2d
├─ evo-eog-2d.viewer
│  └─ Workspace + selection + Inspector + navigation + overlays
└─ evo-eog-2d.designer
   └─ Viewer baseline + governed semantic editing
```

This replaces the interim model where Viewer and Designer had separate package
identities.

## Interaction invariant

Viewer is semantically read-only, not interaction-read-only.

Both Feature profiles share the same 2D Workspace foundation. Clicking a node
or edge must select it and expose its Inspector properties in both Viewer and
Designer.

Only Designer may receive semantic editor descriptors, semantic mutation
commands, create/remove operations, relation mutation, confirmation and
publication actions.

## Dependency invariant

Designer requires Viewer Feature activation.

Viewer does not require write authorization. Designer requires the explicit
`authorization.check` capability.

## Ownership

- Enterprise Context: Enterprise Graph Definition authority.
- Eidos 2D Core: generic Workspace / canvas / selection / Inspector primitives.
- EOG 2D Package: EOG projection and Viewer/Designer Feature profiles.
- Observatory / Analysis: peer plugins/providers contributing overlays.
- SOP: separate and deferred.

## Migration

Legacy source paths under `apps/eog-2d-viewer` and
`apps/eog-2d-designer` remain compatibility implementation locations during
incremental convergence. Their package manifests are compatibility aliases to
the unified package and must not be independently registered in the Catalog.


## Cross-plugin read-only preview capability

The Viewer Feature also provides the neutral capability:

`visual.viewer.2d`

This capability is intentionally broader than Enterprise Operating Graph
semantics. It allows other installed plugins, such as Template Store, to supply
neutral read-only preview artifacts to the shared Eidos 2D Workspace.

Template Store depends only on this public capability and neutral preview
contract. It does not import EOG 2D Viewer private implementation.

## Lifecycle / loading invariant

EOG 2D is an optional application plugin.

Fresh Hosts MUST NOT auto-install Viewer or Designer merely because their
manifest is present in Catalog.

When the Viewer Feature is inactive:

- its routes are not effective;
- its Actions are rejected by ActionHost before implementation load;
- its Workspace / template-preview modules are not eagerly imported.

When active, the Host may lazy-load the requested Viewer page or Action module.

Existing persisted installations remain compatible.
