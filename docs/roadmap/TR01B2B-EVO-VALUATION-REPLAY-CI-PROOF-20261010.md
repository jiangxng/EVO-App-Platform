# TR-01B2B — EVO-owned cost valuation and deterministic replay (CI-only)

**Date:** 2026-10-10  
**Status:** Candidate pending GitHub cross-project validation.  
**Ownership:** EVO CostEngine + ValuationPosting + Replay. App Platform is only an immutable business-fact publisher and read consumer.

## What TR-01B2A actually found

Using App Platform's Counterparty CUSTOMER, Item and Warehouse references and public EVO BusinessData submissions, the exact sales reference created Production +10 at a historic 125 CNY amount, shipped all 10, then collected 1,000 CNY. The public inventory Ledger subsequently showed **quantity 0, raw amount 125**. The amount remained because the demo shipment's *operational quantity* rule posts zero amount; it is NOT evidence of correct finished inventory valuation or COGS.

## Existing EVO owner contracts and evidence

The pinned EVO repository has `CostEngine.recalculate(enterpriseId, method, pins?)`, `ValuationPostingService.postCostResult(costResultId)`, `prepareFullReplay()`, and published shipment valuation rule `shipment-inventory-to-cogs` with two valuation legs. `scripts/validate-eel-c01-full-replay.ts` proves pinned economics and replay *for EVO's own reference facts*. `scripts/validate-eel-c01-settlement-allocation.ts` proves that EEL-C01 records an `AllocationInstruction`, a linked `AllocationRelation`, and accepted request replay for its **own** source/consumer reference case.

The current **public** `apps/api/src/build-app.ts` has `GET /api/v1/ledgers/:code/balances` and `GET /api/v1/work-items`, but neither an admitted authenticated generic `POST /api/v1/cost-...` nor an externally usable public `POST /api/v1/allocations` route. `/api/v1/demo/cost/recalculate` and `/api/v1/demo/replay` are clearly labelled reference-only in EVO `PUBLIC-API.md`. EEL-C01 calling `runtime.allocation.recordInstruction` **inside EVO** does not grant permission for App Platform to call it over HTTP or to write the `allocation_relation` table.

## Minimal CI-only valuation and exact replay test

The new `tools/certify-tr01b2b-cost-replay-after-sales.mjs` runs **after** the existing `tools/certify-tr01b-sales-evo-postgres.mjs` in the same isolated pinned EVO + PostgreSQL workflow, so the immutable BusinessData identities and sale/shipment/cash order originate in **App Platform**, not a second synthetic test scenario.

It first asserts the pre-cost raw quantity 0 / Inventory amount 125. Only inside this disposable CI database, an **EVO-owned runtime certification harness** explicitly reads the published valuation policy `inventory_fifo` and allocation policy `inventory_fifo`, pins both IDs and versions **and the published `sales_shipment.created` valuation rule ID/version**, and calls `runtime.cost.recalculate` (the actual EVO cost engine) and EVO's full replay lifecycle. It then reads public dimensioned inventory and COGS Ledgers and requires Inventory quantity 0/amount 0, COGS amount 125, matching pre/post replay digests and unchanged Receivable/Cash and closed SHIP/COLLECT Work. This private runtime import is **test-only** and is never loaded by an App Platform production service or Agent.

**Passing this proof does NOT authorize App Platform production UI, Agent, Action Host or generic HTTP clients to invoke the private EVO runtime or demo endpoints.** It certifies the correctly owned economic lifecycle and calls out a missing owner-governed/public submission capability, to be designed in EVO with explicit tenant, identity, cost method/policy pinning, idempotency, Replay ownership and audit requirements.

## Residual payment allocation and financial account boundary

The immutable `cash.received --REFERENCES--> sales_order.approved` link is **historical BusinessData lineage only**. EEL-C01's `AllocationInstruction` and `AllocationRelation` are actual EVO semantic financial allocation objects whose source-target policy and replay pins must be protected by an admitted scoped public contract before App Platform can use them. B2B's valuation/replay test does **not** prove App Platform-originated formal cash allocation; this remains an explicit EVO owner contract gap.

EVO Cash Ledger effects do not identify a customer's bank account or the enterprise's own Bank/Cash/Payment Platform account. No new Financial Account master-data object should be built until bank/channel identity, company ownership, currency, posting eligibility, permission and reconciliation requirements are validated separately.

## No conflicting work

No edits to Counterparty/Item/Warehouse import, parallel 2D Designer/Agent lines, internal EVO database schema, or platform `project.status.json` in this candidate. A passing real CI result should be recorded before promoting any gate.

### Initial check exposed a necessary pin boundary

The first CI attempt reached the seeded App Platform sales facts but received EVO `COST_VALUATION_POLICY_PIN_REQUIRED` from the legacy demo cost endpoint. Its `{method:'FIFO'}` request does not carry the required published version pins and therefore cannot be treated as a working authoritative cost operation. We did **not** weaken the cost engine or bypass validation. The revised CI uses the pinned EVO owner module directly in the *disposable database*, with both published policy identities and versions explicitly selected; no production application runtime gets this direct access.

The second CI iteration additionally established `VALUATION_RULE_PIN_REQUIRED`: the cost engine correctly refuses to cost a Shipment without a pinned rule. The test harness now explicitly binds `shipment-inventory-to-cogs` v1 by its published ID. In production this pin must be carried by a governed EVO-side command/request contract; it must never be inferred opportunistically by an App Platform Agent.

Replay certification uses EVO's **canonical economic runtime digest** (`computeEconomicRuntimeDigest` with pinned posting boundary) and immutable canonical input digest (`computeReplayInputDigest`), **not** the lighter dashboard `runtime.query.balanceDigest`. The two digest functions intentionally cover different evidence families. This follows EVO's own EEL-C01 full-replay validation and additionally checks persisted `replay_run.validation_status=MATCH`. An earlier CI attempt compared those different digest families and correctly failed; no semantic difference was masked.
