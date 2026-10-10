# TR-01B2A — Governed inverse sales Work/Position read (candidate)

**Date:** 2026-10-10  
**Stage:** first bounded slice of TR-01B2; **NOT** end-to-end commercial sales/settlement acceptance.

## Public owner boundary: what is already available

EVO already certifies an internal bounded EEL-C01 Order-to-Cash settlement with AllocationInstruction/AllocationRelation and replay, plus EEL-C03 reverse sales/returns. These are real PostgreSQL proofs **inside EVO**. The current EVO `PUBLIC-API.md` still exposes a generic immutable BusinessData write, exact dimension-filtered `GET /api/v1/ledgers/:ledgerCode/balances`, and `GET /api/v1/work-items` as the App Platform's stable integration surface.

An EVO internal allocation service method and the compatibility `/api/v1/demo/cost/recalculate` endpoint are **not** an admitted, scoped, production Host-facing cost/settlement API. Do not call private Postgres/undocumented demo endpoint or issue fabricated `AllocationRelation` or `CostResult` from App Platform.

## The implemented B2A reading contract

- `apps/trading-reference/sales-operational-projection.ts`: read-only service with explicit Host Enterprise Context, order/customer/Item/Warehouse and EVO enterprise ID, mandatory scoped `authorization.check` before any I/O. HUMAN/AI clients share the same service. Refuses absent policy, denied/unresolved-obligation policy, cross-tenant scopes, incomplete/ambiguous balances, and out-of-sync SHIP/COLLECT Work.
- `apps/trading-reference/sales-operational-http-reader.ts`: use only public EVO Work and four dimensioned balance GET endpoints for `pending_shipment`, `receivable`, `inventory`, `cash`. Respect the public `truncated` response and fixed bound; never aggregate heterogeneous rows or silently treat capped data as complete.
- `tests/protocol/tr01b-sales-operational-projection.test.mjs`: Human/AI parity, order/reference scope, strict policy denial, missing/duplicate/stale/incomplete Work/Position, HTTP truncation and **explicit cost-status false**.
- Existing `tools/certify-tr01b-sales-evo-postgres.mjs`: after it runs four real App Platform-originated immutable facts through EVO PostgreSQL, the same service reads the real closed SHIP/COLLECT and Inventory/Cash/Receivable state for both Human and AI principals under **CI-scoped fixture policy**. It refuses a forged sales order, and emits `TR01B2A_GOVERNED_SALES_EVO_PUBLIC_READ_PROOF` only on success. The pre-existing B1 proof marker stays unchanged.

## Financial precision: do not infer cost or cash account semantics

EVO demo Shipment posting rule `shipment-inventory` moves **quantity** with literal zero amount; this can produce `inventory.quantity=0` with a **non-zero amount** after shipment. The new view deliberately names the raw amount `observedLedgerAmount`, marks `costValuationCertified:false`, and does **not** assert Cost of Goods Sold or a valid closing inventory valuation. EVO's existing `CostEngine` and `ValuationPostingService` belong to a separately certified public cost lifecycle, not a field alias.

B1 `cash.received` decreases Receivable and increases Cash Ledger by posting rules. Its immutable `REFERENCES` relation identifies history, but is **not** the formal source-position `AllocationInstruction/AllocationRelation` needed for customer cross-currency/partial settlement lineage. Likewise Cash Ledger is not Financial/Bank Account Foundation Object identity.

## Remaining gate

1. Register the shared Sales READ as an explicitly authorized, opt-in first-party Capability Operation with a controlled Host Enterprise→EVO binding, and test actual installed Eidos Human/Agent/Workbench presentation. **This B2A PR does not wire the Host nor certify an installed browser.**
2. Assess how the public EVO contracts should expose pinned cost valuation and COGS, explicit payment allocation, and deterministic replay of these specific immutable B1 facts. Prefer narrow EVO contract adoption or tracked gap to a second platform ledger.
3. Do not mark TR-01B2 or the Foundation Object Program fully complete on this slice. No Cash Account object, sales CRUD UI, tax ledger, FX settlement or General Ledger added. Preserve 2D Designer and independent Agent-line branches.
