# EOG 2D Plugin + Eidos Public Core — Boundary Closure (2026-10-11)

## Current authority
- EVO App Platform plugin contract: [PLUGIN-PLATFORM-MAINLINE-v0.1.md](./PLUGIN-PLATFORM-MAINLINE-v0.1.md).
- One installable `evo-eog-2d` package has Viewer + Designer Features. The Viewer is interactive but read-only; Designer requires Viewer activation and `authorization.check`.
- Eidos `src/2d/index.ts` exposes generic drawing/interaction; application code must not import `src/diagram` internals.
- Enterprise Context owns authoritative business definitions; EOG 2D projection mutates only view state via authorized public operations.

## Implemented stage convergence
1. `apps/eog-2d-designer/definition-projection-editor.ts` imports geometry helpers from the public Eidos 2D Core facade instead of private `src/diagram` paths.
2. `vendor/eidos/src/diagram/index.ts` is synchronized with eidos `3fde008f372bcbcaad45563f511c7b7cf1f8924e`.
3. The vendored Eidos manifest **keeps the earlier general sourceCommit** for the broad vendored runtime but records a separate `eidos.2d-core` upstream pin. 15/16 scoped diagram file blobs match the new eidos commit. `surface.ts` is an explicit, hash-locked App Host overlay protecting its existing context-navigation and canvas behavior; it is NOT claimed to be synchronized.
4. An offline source-provenance / public-entrypoint / unified-plugin-Feature validator runs in Diagram Designer CI. It fails on silent vendor drift or accidental private 2D imports.
5. Viewer and Designer registration/cutover tests run together with Designer integration regressions.

## Activation and demo limitation
A successful Railway service deployment or a route declaration **does not prove** that the EOG 2D package is currently installed and active in a specific tenant. The Host makes 2D an optional lifecycle-managed plugin; when inactive, ActionHost rejects its commands and routes are not effective. Verify the actual authenticated Plugin Store installation and Viewer/Designer active Features on the Railway demo tenant prior to Human demo acceptance. Do not auto-install globally to conceal this requirement.

## Formal certification
Synthetic CI is not a customer/physical-browser signoff. The 39 original commercial acceptance checks remain **NOT TESTED**; there is no new approval implied here.

## Release safety
Railway demo `Ledger Configurator` service was pinned to `c4eb4df583c458ee11df00689ea612c37f440024` at this task's start. Do not force production redeploy as a side effect of this architecture-only merge. Ship a new pinned commit separately after review.
