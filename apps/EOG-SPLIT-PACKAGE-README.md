# EOG package convergence

Canonical package family:

- `evo-eog-2d`
  - `evo-eog-2d.viewer` — interactive read/inspect/navigate Workspace.
  - `evo-eog-2d.designer` — Viewer baseline plus governed semantic editing.
- `evo-eog-3d`
  - `evo-eog-3d.viewer` — neutral spatial Viewer Workspace.
- `evo-enterprise-observatory`
  - `evo-enterprise-observatory.2d` — 2D runtime-fact / analysis overlays.
  - `evo-enterprise-observatory.3d` — 3D runtime-fact / analysis overlays.

The earlier separate `evo-eog-2d-viewer`,
`evo-eog-2d-designer` and `evo-eog-3d-viewer` package identities were
migration steps. Their legacy source paths remain compatibility aliases or
re-exports where required.

The 2D Viewer is **interactive**, not static. Viewer and Designer share graph
projection, node/edge selection, Inspector, pan/zoom/focus, navigation,
overlays and View State. Designer adds semantic mutation capabilities; Viewer
does not receive them.

The 3D Viewer likewise owns the neutral spatial graph experience. Enterprise
Observatory may overlay Runtime Facts and analysis in either 2D or 3D, but it
does not define the Viewer products.

Enterprise Context remains the single Enterprise Graph Definition authority.
Eidos owns reusable 2D/3D interaction cores.

SOP remains a separate deferred capability.
