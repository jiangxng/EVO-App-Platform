# B9s — Responsive Chrome world SVG clipping versus visible canvas (2026-10-11)

B9q native Chrome logged `viewerSvgWidth=904` for both 390px and 768px viewport. This measurement alone **is NOT evidence of a 904px visible mobile page bug**. Reading the actual current Eidos Surface implementation shows the SVG is intentionally assigned `graphBounds+120` world-coordinate width while `data-eidos-diagram-canvas` has `overflow:hidden` and handles viewport transforms, so raw `getBoundingClientRect()` for SVG is the wrong acceptance metric.

B9s adds explicit DOM measurements for physical browser viewport, canvas clip box, overflow mode, underlying world SVG and document width, at the two emulated Chrome viewports on both Designer and readonly Viewer after actual synthetic S2C/P2P native Save. Assert canvas is nonzero, clipped, and its **visible width** fits viewport. Preserve world SVG numbers separately, and do **not** claim mobile touch/OS usability from these checks. If CI fails, preserve exact failed run rather than relaxing clipping assertions or modifying Eidos geometry to shrink world bounds.

Stacked independent Draft on B9r #634; no TR-01, main or production code change. Historical B8t congestion and all formal §14 39 items remain NOT TESTED.
