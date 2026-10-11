# B8l + B8m — Browser-measured labels and honest high-density routing (2026-10-10)

## Scope and inherited decisions

This double-increment continues the accepted EVO 2D Designer commercial program on top of [Eidos B8j+B8k Draft #151](https://github.com/jiangxng/eidos/pull/151) and [EVO B8j+B8k Draft #598](https://github.com/jiangxng/EVO-App-Platform/pull/598). New work is independently stacked on those branches as [Eidos Draft #152](https://github.com/jiangxng/eidos/pull/152) and [App Draft #599](https://github.com/jiangxng/EVO-App-Platform/pull/599). The product/research and §14 acceptance sources are inherited from the recorded EVO handoff and matrix; no external source is newly claimed to have been read in this turn.

Product boundaries: diagram 2D presentation and visibility only; never change business graph topology, source/target, Agent privileges, Host authorization, project authority files, domain definition version, projection CAS, or 44 CSS px drag targets. Existing user-edited manual self-loop waypoints retain precedence. All PRs remain Draft, unmerged, undeployed.

## B8l: measured text rather than arbitrary width cap

**Problem observed:** B8i/B8j label reservations capped unrelated edge captions at 176 world units. Real browser text such as a long name can extend much further, overlapping automatic self-loop corridors even though the geometry scoring marks the side as free.

**Adopted solution:** New `label-reservation.ts` pure contract `diagramLabelReservationV010(anchor,caption,measured?)` creates a centered world-coordinate rectangle matching the renderer's `11px` SVG text, `geometry.label.y - 8` baseline and a margin for the 4px outline. The canvas renderer now invokes browser `measureText` using `11px` and the computed diagram canvas font-family; measured ascent/descent and full measured glyph width (up to a safe maximum) determine the reservation. Within one render, equal captions share a measurement cache. If a Canvas2D context is unavailable, a deterministic English/CJK-aware fallback remains. Measurements are not derived from whether a label is transiently hidden, selected or hovered; panning/zooming cannot make automatic geometry jump. Rendered labels remain SVG text, not bitmaps.

**Evidence contract:** Unit tests verify a label whose measured width exceeds 176 units can divert a self-loop where the previous capped rectangle could not; fallback validity and CJK strings. The App genuine Chrome suite is expanded from 28 to 30 tabs with an isolated synthetic 60-M glyph caption on a remote straight connector. The new Designer tab checks real SVG text bounding width, browser measurement use, bottom-side automatic loop and unchanged 44px handle; the new readonly Viewer tab must produce identical SVG. Tests originate in isolated Host fixtures and do not change any enterprise's actual data.

**Remaining precision limits:** Browser font metrics can differ if an individual SVG label has a different local font-family/weight than the diagram inherited CSS; canvas text metrics approximate paint-stroke and actual ink envelope, not exact SVG box collision. Long labels are bounded for CPU and geometry sanity. Competing label-label placement, multilingual shaping and multiline text remain separate future work.

## B8m: high-density complexity budget and visible fidelity

**Problem observed:** Previous B8k flattened each new path with Q/C subdivision even after exceeding a global 100,000-segment budget; it silently fell back to a straight chord, despite possible curve crossings. Above 12,000 visible relationships the specialized self-loop ink index is skipped entirely. A user must not mistake this limitation for collision-free routing.

**Adopted solution:** Explicit `diagramInkQualityV010(edgeCount,hasStyledSelfLoops,fallbackCount)` yields `full`, `coarse` or `node-only`. A saturated segment budget no longer continues repeated Q/C subdivision; a conservative chord estimate is used and a degradation counter records it. When 12,000 visible relations are exceeded, no ink-index precompute is attempted; legacy B8h node and sibling self-loop steering remain available. The SVG Surface exposes read-only `data-eidos-diagram-ink-quality`; a **single**, non-blocking `role=status` advisory appears for degraded fidelity, not thousands of obstructing per-edge warnings. Viewer's geometry and advisory use the same rendering code; no new projection schema or write occurs.

**Evidence contract:** Synthetic 13,000-edge test checks near-neighbor correctness in the spatial index; pure threshold tests distinguish 12,000 full vs 12,001 node-only and fallback-coarse, invalid inputs reject. Source guard checks the early subdivision stop and advisory pointer-events:none. Existing performance CI and 30-tab Browser conflict regression must pass on latest head. These are *bounded correctness and synthetic stress*, not an assertion of measured 13k-edge production fps, which requires separate full-DOM Chrome benchmarking and target-device profiling.

## Comparison, limitations, acceptance status

- Compared with a global reflow or label-driven automatic business graph mutation, use a stable presentation-only reservation and a quality indicator; reasons: no unwanted topology edits, no change to a saved manual path, deterministic Viewer parity.
- Compared with an unbounded exact font/layout and Bézier intersection solver, keep affordable per-render memoization and explicit numerical/path budgets. Upgrade to exact bounding boxes and full-complexity routing only after real enterprise data and cross-device benchmarking justify cost.
- Source facts versus judgement: 176-world-unit cap and 12,000 relation/100,000 sample limits originate in the preceding checked repository code; whether a new heuristic is the best long-term architecture is an engineering judgement.
- The full §14 **39 commercial cases remain NOT TESTED**. Native iOS/Android/Windows/macOS touch and trackpad, restart of a durable database, real company diagram labels, font-by-font measurement fidelity, and 13k-edge production-grade fps have not been certified. Browser Chrome/CDP synthetic evidence is not physical-device acceptance.

## CI evidence

The latest run IDs and their final conclusions should be linked from PR #152/#599 after the final commits. Do not claim green for a queued or superseded run.
