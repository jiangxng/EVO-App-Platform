# EVO 2D Designer — Stage convergence on current main (2026-10-11)

**Purpose:** Integrate the reusable 2D Designer independently, without merging all 48 B-class QA increments, old branch ancestry, research-only files, or changes to TR-01/Agent core. Based on exact current `main` commit `653a1646bf4178b5b068b85323189304f89e76fa` and eidos component merged via eidos PR #160, squash `3fde008f372bcbcaad45563f511c7b7cf1f8924e`.

## Integration boundary
- eidos 2D core: `vendor/eidos/src/diagram` copy, app-local `surface.ts` and `index.ts` distinct from upstream, intentional adapter compatibility; all remaining diagram modules checked identical to upstream eidos/main at convergence.
- EVO thin adapter: `apps/eog-2d-designer`, `apps/eog-2d-viewer`, projection contracts, enterprise projection store, projection presentation source.
- Selected functional regression tests and `diagram-designer-integration.yml` CI; no B10k–B11p offline QA sprawl, 32 extra Draft evidence manifests remain in GitHub for future use.
- Git comparison from merge-base `6de1b25a283ad691839e0233615dc8f074632186` to latest main found **zero overlap** with these 19 production module file paths changed by B branch. Recent main-only business/Agent changes are preserved intact.

## Release gate
The Railway Ledger Configurator service tracks `EVO-App-Platform/main` and can redeploy on push. Do NOT merge this PR before Railway is pinned to a known-safe commit or its production release guard is separately verified. A merged PR must be tested on current main, must not automatically claim §14 formal commercial signoff; all 39 items remain NOT TESTED. Real customer/physical hardware/production identity DB tests are outstanding.

## Implementation decision
The independent 2D component is upstreamed in eidos/main first, while EVO App has only an explicitly scoped adapter/product code delta on current main. Business graph definition revisions remain independent of presentation-only projection edits. No Agent/core feature takeover.
