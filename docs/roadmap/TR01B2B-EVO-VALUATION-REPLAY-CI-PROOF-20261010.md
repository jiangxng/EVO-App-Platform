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

It first asserts the pre-cost raw quantity 0 / Inventory amount 125. Only inside this disposable CI database it asks EVO's reference `/api/v1/demo/cost/recalculate` endpoint to calculate FIFO and post pinned valuation. It then reads public dimensioned inventory and cogs Ledgers and asserts Inventory quantity 0/amount 0 and COGS amount 125. Finally, the CI-only `/api/v1/demo/replay` invocation must report a matching economic digest and produce **the same inventory, COGS, receivable 0 and cash 1000** with SHIP/COLLECT Work remaining closed.

**Passing this proof does NOT authorize App Platform production UI, Agent, Action Host or generic HTTP clients to call demo endpoints.** It certifies the correctly owned economic lifecycle and calls out a missing owner-governed/public submission capability, to be designed in EVO with explicit tenant, identity, cost method/policy pinning, idempotency, Replay ownership and audit requirements.

## Residual payment allocation and financial account boundary

The immutable `cash.received --REFERENCES--> sales_order.approved` link is **historical BusinessData lineage only**. EEL-C01's `AllocationInstruction` and `AllocationRelation` are actual EVO semantic financial allocation objects whose source-target policy and replay pins must be protected by an admitted scoped public contract before App Platform can use them. B2B's valuation/replay test does **not** prove App Platform-originated formal cash allocation; this remains an explicit EVO owner contract gap.

EVO Cash Ledger effects do not identify a customer's bank account or the enterprise's own Bank/Cash/Payment Platform account. No new Financial Account master-data object should be built until bank/channel identity, company ownership, currency, posting eligibility, permission and reconciliation requirements are validated separately.

## No conflicting work

No edits to Counterparty/Item/Warehouse import, parallel 2D Designer/Agent lines, internal EVO database schema, or platform `project.status.json` in this candidate. A passing real CI result should be recorded before promoting any gate.
