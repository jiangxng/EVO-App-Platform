# Diagram 2D B4a — mobile second-pointer gesture cancellation

This App Platform vendor integration is stacked on 2D B3 and follows Eidos #136.

- A second touch instantly aborts active uncommitted node movement and moves into pan/pinch semantics. It does not wait for another move from the original finger.
- The active first touch contributes its current coordinates to the two-finger baseline. Blur cancels the unfinished node drag.
- The integration retains App Host context-navigation behavior. No graph relationship or business definition changes.
- Lightweight structural regression guards this integration. Structural checks do **not** prove actual gesture correctness.
- Browser/device matrix T02–T07, pointer capture ordering, blur/pointercancel and pinch continuity are **NOT YET CERTIFIED**.

Dependent PRs should be merged in order, after CI plus human/device checks.
