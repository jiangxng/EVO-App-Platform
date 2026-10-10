# TR-01B2C — Exact App Platform Customer Cash Receipt → Receivable formal allocation (owner-CI proof)

**Date:** 2026-10-10  
**Stage:** CANDIDATE, awaiting real pinned EVO PostgreSQL evidence, **not** public Host Allocation API.  
**Relationship:** The previously-accepted TR-01B1 sales facts, TR-01B2A service-level reads and TR-01B2B cost/COGS canonical Full Replay remain independent. This is a new bounded test of **formal** receipt allocation, not a Sales ERP.

## Contract gap discovered by the inverse business exercise

The original App Platform Sales Order BusinessData had `currency` and `totalAmount` but no **historic local carrying amount / local currency**. EVO's already-published `fx_receivable` PositionDefinition v1 formally requires both `localCarryingAmount` and `localCurrency` from the **original Sales Order**, even when settlement and local currency coincide. An immutable fact cannot be retrospectively decorated by Agent/UI if this basis was never recorded.

`apps/trading-reference/sales-loop.ts` now permits an **optional, paired** historic `localCarryingAmount`/`localCurrency` on `sales_order.approved`; missing counterpart, malformed amount or same-currency unequal carrying basis is rejected **before BusinessData submission**. Other clients retain the previous payload contract unless they explicitly supply these fields. The isolated TR-01B certification supplies exact CNY 1000/1000 carrying and settlement while keeping the product/customer/warehouse identity and all prior cost/Work checks.

## Isolated EVO owner-only PostgreSQL proof

After the **same** actual App Platform-created Sales→Production→Shipment→Cash facts and pinned FIFO cost valuation+Full Replay (no fresh artificial order), `tools/certify-tr01b2c-formal-settlement-after-cost.mjs`:

1. Locates `sales_order.approved` and `cash.received` from their original immutable IDs; asserts customer, currency, carrying basis, 1000 settled amount, zero Receivable, 1000 Cash, zero valued Inventory and 125 COGS.
2. Fetches published `fx_settlement_explicit` allocation policy **ID + v1**; calls EVO `AllocationStore.recordInstruction` for a specific `sourceSelector: BUSINESS_DATA` to the original Sales Order and **consumerBusinessDataId** to the actual Customer Cash Receipt. The operation is executed only within disposable CI in the EVO owner runtime; it is *not* an admitted production HTTP operation. Checks identical request idempotence, conflicting-key rejection and cross-enterprise/missing BusinessData rejection. Merely recording an Instruction must **not** be claimed as a completed Relation.
3. Pins the published EVO `fx_receivable` PositionDefinition **ID/version/digest**, sends a governed **EVO-compatibility command from the isolated CI actor** for `valuation.requested` with a scope narrowed to customer+order, explicit instruction ID, policy pin and measurement mapping. EVO `valuationReplay.replayAcceptedRequests` must create a **completed** AllocationRun/Relation with the exact consumer ID, position key and `SETTLEMENT_QUANTITY=1000 CNY`. Equal-currency settlement has realized delta 0, and does not create FX profits.
4. Executes EVO Full Replay with the already-proven pinned FIFO cost rules and the accepted valuation request, verifies **canonical economic digest equality**, **immutable canonical input equality**, persisted Replay MATCH, stable source position identity, preserved AllocationInstruction and rebuilt derived Relation, and unchanged economic balances.

## Critical ownership and acceptance boundary

EVO has the reference implementation but **does not currently publish a production Host-authorized generic AllocationInstruction/Relation endpoint**. `Cash.received --REFERENCES--> sales_order.approved` is historic relationship only; this test targets actual policy-backed formal allocation and Replay. The `valuation.requested` compatibility command, private `runtime.allocation`, direct SQL **read assertions**, and private `runtime.valuationReplay` are all strictly CI-only, never App Platform/Agent production dependencies.

The test only proves a **single source order, single receipt, same currency, exact full payment**. Partial, overpayment, split receipt, multiple invoices, cancellation/refund, exchange rate, bank account identity, identity-provider authorization, real customer production installation, and external Host plugin acceptance remain OPEN.

**Do not close the master TR-01B2/Finance Account gate from this proof.** No direct LedgerEntry/Balance writes, no foundation object rebuild, no 2D Designer/Agent-window edits. The EVO [PR #106](https://github.com/jiangxng/EVO/pull/106) boundary review merged as design only and did not publish finance operations. Subsequent guarded public Contract Adapter implementation must be owner-reviewed and separated from the deterministic core.
