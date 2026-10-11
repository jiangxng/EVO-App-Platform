# 2D Designer B3 — waypoint and anchor projection integration

Status: STACKED PR. Not merged, deployed or browser-certified.
Dependencies: Eidos #130 -> #131 -> #132 -> #133 -> #134 -> #135; App Platform #537 -> #547 -> this change.

- The Eidos B3 route contract is vendored by a line-hunk transplant; the App Host context-navigation delta remains intact.
- Optional 24-point bounded waypoints and fixed source/target boundary anchors are projection presentation metadata. No relationship identity, endpoint, arrow, or Enterprise Graph Definition mutation is allowed through these controls.
- Gallery validation, save capture parsing, serialized view, artifact projection, Designer/Viewer and regenerated thumbnail now carry the same optional metadata.
- Old projections without these fields stay compatible and straight by default; invalid input fails closed.
- B3 Inspector supports adding/removing/nudging and numeric editing points and fixed side selects with undo. These are alternatives to precision pointer drag, not a claim of full pointer-handle support.
- Outstanding gates: actual browser interactions, simultaneous equal-delta waypoint translation after commit, bidirectional labels and route congestion UX, multi-window conflict resolution, mobile gestures and performance acceptance. Unit/CI evidence is not device certification.

Do not merge before the dependency chain reconciles and integration CI passes.
