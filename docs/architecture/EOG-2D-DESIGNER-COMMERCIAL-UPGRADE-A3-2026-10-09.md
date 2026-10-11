# 2D Designer A3 — Projection Route Integration (Draft)

**Date:** 2026-10-09. **Scope:** App Platform integration of staged Eidos diagram PRs #130/#131/#132. No changes to mainline Foundation Object work or global project status.

- The vendored diagram surface incorporates the **upstream delta** against Eidos `df6b09c`, not a blind wholesale file replacement. The App Platform's existing `assertContextNavigationV010` and `renderContextNavigationV010` imports and navigation code remain intact.
- An opted-in editor allows selecting straight, orthogonal, rounded-orthogonal or curve while retaining source/target/arrow business semantics.
- `edgePaths` are validated and stored in the projection view; old views without route data retain legacy straight lines. Save-as and the 2D Viewer/thumbnail pipeline carry the route data forward.
- Core Eidos interaction behavior remains owned by Eidos; product authorization, enterprise definition revision and projection concurrency remain owned by App Platform.

**Not done / not certified:** full obstacle avoidance, manual route handles, UI permission/gesture certification on iOS and macOS, lock/snap, complete conflict recovery, performance budgets. Preserve Eidos PR dependencies and do not merge this branch before CI and cross-project review. Source file: owner-supplied `EVO-2D-Designer-商业化交互与视觉实施要求-v1.0`.
