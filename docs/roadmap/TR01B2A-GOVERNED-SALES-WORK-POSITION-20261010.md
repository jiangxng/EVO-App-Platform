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

## Verified implementation result — 2026-10-10

- [PR #574](https://github.com/jiangxng/EVO-App-Platform/pull/574) final head `c4ac883269ca95cf7665ceb3adecccc951e4d813` merged at `39109addd721c017cd6276c60ee4b3062ab3f6b7`.
- New real EVO/PostgreSQL proof [38014202340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014202340): **SUCCESS** with exact `TR01B2A_GOVERNED_SALES_EVO_PUBLIC_READ_PROOF` marker `status=PASS`. HUMAN and AI Principals observe identical bounded authorized read results against EVO public Work/Balance; an unrelated order is denied.
- [Platform CI 38014202293](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014202293) **PASS**, [Continuity CI 38014202284](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014202284) **PASS**, [Existing PostgreSQL regression 38014202326](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014202326) **PASS**, [TR-01A installed Chrome/Workbench regression 38014202298](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014202298) **PASS**.
- Railway production deployment `b0ff4777-17d6-4de0-bdda-7a02dbf39d6b` at merged main `39109addd721c017cd6276c60ee4b3062ab3f6b7`: **SUCCESS**.
- Crucial factual result: after Shipment, EVO **Inventory quantity=0 yet observed raw Inventory Ledger amount=125**. This is a separately actionable costing/valuation contract and rule maturity gap. Never assert amount 0, COGS 125 or zero closing stock valuation without separate pinned valuation certification.
- This bounded slice closes **service-level governed derived Sales read** only; Host Capability Operation admission and installed Human/Agent/Workbench UI are **NOT_CLAIMED**. Formal AllocationInstruction, exact replay and Financial Account master data remain unproven and must not inherit B2A's PASS stamp.

Next: bounded TR-01B2B discovery/implementation of cost/valuation public lifecycle and settlement Allocation Instruction/Relation contracts, keeping all business/economic authority in EVO. Separately take TR-01B2C Sales read through the already-proven lifecycle-gated Host/Workbench mechanism when authorized, not via a standalone new ERP.
