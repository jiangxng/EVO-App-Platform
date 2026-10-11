# B9o — Enterprise diagram corridor risk proxy (2026-10-11)

Stacked independently on B9n Draft #629. No production code, TR-01, Eidos route budget, App Host authorization or existing enterprise records modified.

## Why

The B8t recorded 21/900 and 27/1200 **actual** route-congested in controlled Chrome graphics. Their causes cannot be inferred from graph counts. Prioritize realistic S2C/P2P analysis without publishing names/coordinates by computing an **explicitly non-authoritative straight-corridor proxy**, before the existing B9l browser test.

`tools/diagram-corridor-risk-b9o.mjs` takes B9k/B9n validated local external data via `EVO_B9K_AUTHORIZED_QA=1`; for each non-self edge it counts unrelated node rectangles intersecting the axis-aligned rectangle between centers expanded by 16 world units. It returns only counts in bins 0 / 1–5 / 6–22 / 23+, total >22 risk corridors, maximum obstacle count and self loops. Data remains local; IDs, labels and coordinates never leave the tool in logs. Graph caps follow B9k (1500/5000), with O(nodes × edges) bounded work.

**CRITICAL DISTINCTION:** This is not Eidos' orthogonal A* algorithm, nor actual congested count, nor a collision prediction. Geometry along a straight corridor is just a triage signal; the actual budget is 22 local obstacles/2600 grid states and actual route evidence requires Eidos geometry/Chrome. No attempt to change budget or suppress warnings.

## Command

```bash
EVO_B9K_AUTHORIZED_QA=1 node tools/diagram-corridor-risk-b9o.mjs /outside-git/approved-s2c-qa.json
```

## Evidence

Five isolated synthetic scenario tests (positive 23-obstacle risk, empty graph, self-loop, layout dependence and invalid inputs), workflow `diagram-corridor-risk-b9o.yml`. Genuine enterprise graphs, actual Eidos computed congestion distribution, real customers/OS devices, and §14 39 formal cases remain NOT TESTED. No merge/deploy.
