# EVO Diagram B5–B9 Draft convergence (2026-10-11)
 
## What is preserved
This stage compares the latest B9z development tree `a70c55ead2b936d6e0c24116854998f2675cd0b9`, the B5–B9 research and acceptance PR #554, and the B9j research handoff PR #623 to `main` `4542ab12d2db73ad8d3a2b0799199a41788dc31e`. It tracks **54 still-open Draft PRs** (not yet retired) in the [SHA catalog](./DIAGRAM-B9-DRAFT-CONSOLIDATED-CATALOG-20261011.json) and imports 92 source-exact historical artifacts, including documents, tests, utility code, and legacy browser workflows.

## Product ownership
EVO `evo-eog-2d` remains one installable application plugin with Viewer and Designer Features. eidos owns generic 2D rendering, gesture/viewport and styling. Platform owns capability resolution and permission boundaries. Do not overwrite main's current authoritative server, Plugin Catalog, other applications or eidos source with an older B9 fork. The old Designer source differing only by a superseded private eidos import is preserved separately, not activated.

## Evidence policy
Files saved under `docs/archive/diagram-b9/source/` are literal historical sources, not runtime imports. Obsolete GitHub Actions workflows were moved outside `.github/workflows` to prevent duplicate or unmaintained CI. Original SHA, PR number and source path are retained, while `docs/architecture` retains original stage reports at discoverable paths.

## Formal testing
39 commercial cases remain **NOT TESTED** (no physical device, real enterprise data, or human signed acceptance); the historical Chrome/CI diagnostics are synthetic. Source preservation or merge to main does not imply test signoff.

## Cleanup
Close and delete only the documented 54 Draft heads once this archive is merged, all SHA/delta checks pass and original sources are proven preserved. Exclude Personal Agent and TR-01 active development PRs and all non-Draft PRs. Never delete a head that has moved after this audit.
