# EOG 2D professional routing integration — B1/B2

Status: STACKED IMPLEMENTATION, NOT PRODUCTION CERTIFIED. Owner: 2D Designer implementation window.

## Dependency chain

- Eidos #130 -> #131 -> #132 -> #133 -> #134
- App Platform #537 -> this downstream integration PR
- Source of requirements: owner-provided **EVO 2D Designer 商业化交互与视觉实施要求 v1.0**, acceptance E01/E02 and A/B handoff.

## Exact integration scope

- The vendor additions are `obstacle-routing.ts` and `edge-lanes.ts`.
- `edge-paths.ts` matches reviewed upstream geometry plus bounded obstacle routing. `index.ts` exports the helpers.
- `surface.ts` receives small targeted modifications to draw true obstacle-aware orthogonal paths, stable parallel lanes, and self-loop geometry. It **retains** the App Host-specific `context-navigation` imports and behavior.
- Existing projection `edgePaths` capture, store and Viewer/preview path semantics from #537 stay unchanged. Node avoidance and parallel lanes are deterministic visual geometry, not persisted independently and not business graph edits.
- Legacy edges without `pathKind` retain the old straight geometry; existing self-loops now become visible.
- Mouse drag preview remains lightweight; released nodes trigger a committed rerender.

## Known incomplete gates

- Manual waypoints/anchors, stable high-density obstacle routing, user-visible congestion recovery, touch gesture cancellation/precision, keyboard alternatives and save conflict testing remain incomplete.
- The new test suite checks pure deterministic helpers and vendor navigation retention; no claim of browser pointer testing, 200/400 performance, or mobile certification.
- This PR must not be merged on top of `main` before #537 and Eidos dependencies are settled. It does **not** grant deployment authorization.
