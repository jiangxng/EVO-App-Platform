# EOG package convergence

Current canonical package family:

- `evo-eog-2d`
  - `evo-eog-2d.viewer` — interactive read/inspect/navigate Workspace.
  - `evo-eog-2d.designer` — Viewer baseline plus governed semantic editing.
- `evo-eog-3d-viewer` — current spatial Viewer package; scheduled for naming/Observatory cleanup.

The earlier physical split into separate `evo-eog-2d-viewer` and
`evo-eog-2d-designer` packages was a migration step, not the final model.
Their source directories remain temporarily as implementation/compatibility
locations while the package identity converges.

The 2D Viewer is **interactive**, not static. Viewer and Designer share:

- graph projection;
- node/edge selection;
- node/edge Inspector;
- pan / zoom / focus;
- navigation / drill-down;
- overlays;
- View State.

Designer adds semantic mutation capabilities; Viewer does not receive them.

Enterprise Context remains the single Enterprise Graph Definition authority.
Eidos owns the reusable 2D/3D interaction cores.

Observatory / Analysis / SOP are peer capabilities, not children of the EOG
Viewer or Designer. Observatory compatibility routes remain temporarily and
will be extracted in a subsequent bounded slice. SOP remains deferred.
