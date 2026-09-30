# Residual Branch Reconciliation — 2026-09-30

Status: complete  
Canonical branch: `main`

## Decision

After automatic merged-PR cleanup, eighteen historical branches remained. They have now been reconciled against current `main`. None remains an authoritative development line.

One recent residual, `ci/rum-proof-deployed-revision-contract`, was **not** retired: its PR #205 fixed the production-proof revision contract and was merged into `main` before this reconciliation.

## Superseded proof / continuity branches

- `ci/eog-mobile-read-production-proof` — superseded by the merged EOG MOBILE_READ P4 proof and continuity line.
- `ci/mobile-review-production-proof-fix` — superseded by the merged MOBILE_TASK Review proof/selector fixes.
- `p1.5-complete-p1.6-run-experience` — superseded by the merged P1.5C → P1.8 run and conversation lifecycle.
- `p1.5c-production-live-smoke` — superseded by the certified production live pass and later gates.

## EOG historical branches

- `eog/sop-expected-model-v0.3` — its expected-vs-actual intent is already represented by later SOP conformance/path/evidence semantics in current main.
- `eog/spatial-observatory-v0.1` — superseded by the merged spatial View State, runtime analysis, Observatory and v0.4 mainline. PR #148 is closed.

## Personal Agent historical branches

The following P0.4-era branches are superseded by the current Personal Agent setup/readiness, structured Chat, governed memory, durable run and conversation mainline:

- `personal-agent-eidos-native-p0-4b`
- `personal-agent-p0-4-chat-structured`
- `personal-agent-p0-4-eidos-p0-4a`
- `personal-agent-p0-4-readiness-setup`
- `personal-agent-p0-4b`
- `personal-agent-p0-4b-onboarding`

Stale open PRs #56, #57 and #58 were closed during reconciliation.

## Web runtime historical branches

- `web/browser-asset-archive-v0.1` — absorbed by current `manager/web-asset-archive.ts` and the version-skew-safe delivery architecture.
- `web/browser-lifecycle-resilience-v0.1` — superseded by Browser Lifecycle P3, production proof and the current Eidos lifecycle/runtime baseline.
- `web/mobile-task-inbox-p4` — superseded by the merged MOBILE_TASK mainline, production proof and continuity pass.
- `web/mobile-my-work-v0.1` — exploratory implementation retired. The broader “My Work” intent is not declared delivered merely because this branch existed; if prioritized later it must be rebuilt from current Surface/Task Inbox/EVO contracts.

## Plugin tooling historical branches

- `feat/plugin-release-tooling-v0.1` — the old platform-local signing CLI is retired. Current authority remains Plugin Package Integrity, SLSA/Sigstore verification and plugin-local delivery ownership.
- `feat/standalone-plugin-ci-contract-v0.1` — the old standalone distribution experiment is retired. Current authority is the portable Plugin Protocol schemas, canonical semantic validator and plugin-local CI contract.

## Rule

A retired branch is historical evidence, not product authority. Useful intent may be reintroduced only from current `main`, using current contracts, invariants, tests, security rules and deployment proofs. Do not revive a retired branch by merging or rebasing it wholesale.
