# TR-01A4 — Opt-in, governed purchase operational read capability

**Date:** 2026-10-10  
**State:** proposed integration; TR-01A acceptance #6 remains OPEN.  
**Parent evidence:** `docs/roadmap/TR01A3-OPERATIONAL-READ-GATE-20261010.md`.

## Owner boundaries and behavior

- Application plugin: `apps/trading-reference/package.ts`; application-owned
  `READ` Capability Operation with declared `HUMAN`, `PERSONAL_AGENT`
  and `AUTOMATION` exposures and `ACTION_HOST` binding.
- Host: only catalog inclusion, lifecycle-gated **lazy** action registration
  and explicit tenant mapping. The Host does not own purchase semantics.
- EVO: public `/api/v1/work-items` and public **dimension-filtered**
  `/api/v1/ledgers/{code}/balances` only. Work, Inventory, Payable and
  pendingPurchase remain EVO-derived, with no App Platform ledger writes.
- Shared projection: `apps/trading-reference/operational-projection.ts`;
  same service path for Human and Agent principals.

## Security decisions

1. The package is **opt-in**; adding it to the catalog is not installing it.
   Feature activation is checked by the existing ActionRouter.
2. Enterprise Context and Host request-scope enterprise must match.
3. The **Host enterprise → EVO runtime enterprise** binding must exist
   explicitly in `APP_PLATFORM_EVO_RUNTIME_SCOPE_MAP_JSON`; **never**
   fall back to `EVO_DEMO` or the legacy Trading Lite compatibility
   resolver for this read path.
4. The action is declared in `platform.capability-operation` with an
   INPUT-bound `orderNo` resource. The projection performs a second
   order/reference-scoped `authorization.check` before fetching any
   Work or Position. Missing, denying and unresolved-obligation policy
   outcomes fail closed.
5. No blanket default `ALLOW` policy is installed. An operator must
   explicitly provision an appropriate read policy with row/reference
   scope before production use. An authorized page is not proof of
   an authorized business object unless that policy is correctly set.
6. Partial (capped) API pages, ambiguous balance rows and contradictory
   Work/Balance conditions fail closed. No background synchronization,
   private Postgres reads or mutable cached balances are introduced.

## Evidence & remaining acceptance

Protocol tests exercise package registration, Action Host contract,
cross-enterprise refusal, missing EVO binding, public HTTP URL/dimension
scoping, partial pages and Human/Agent parity. The existing TR-01A
PostgreSQL certification continues to verify economic effects and
reversal through public EVO APIs.

Still required for TR-01A original acceptance #6: a productive
human-facing Eidos Experience, a Workbench contextual projection
contribution that makes sense without pretending to be a generic
procurement UI, and an end-to-end Human/Agent/Workbench journey test,
authorization administration and Human validation. This candidate
must **not** be equated to a finished purchase module.

Do not begin TR-01B or Cash Account object-first expansion on the
strength of capability registration alone. Preserve parallel 2D
Designer scope and #555 research handoff.
