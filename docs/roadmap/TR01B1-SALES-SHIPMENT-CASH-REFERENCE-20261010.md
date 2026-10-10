# TR-01B1 — Inverse Sales / Shipment / Customer Cash Reference (candidate)

**Date:** 2026-10-10  
**Status:** PR candidate, not TR-01B complete  
**Owns:** the Trading Reference Application's minimal BusinessData composition; EVO Ledger/Work and enterprise master-data objects remain independent authorities.

## Evidence-based decisions

Read EVO `PUBLIC-API.md`, `scripts/seed-demo.ts`, EEL-C01 Order-to-Cash certification and EEL-C03 Sales Return certification in the pinned EVO main at `2311022640aa108a6baf3db44d9b26bd3e3ad623`. These establish:

- `sales_order.approved` (`sales_order`) creates `pending_production`, `pending_shipment` and `receivable` for the actual seed posting rules.
- `production.completed` (`production_completion`) supplies actual inventory and closes production demand, rather than assuming pre-existing inventory for an arbitrary Warehouse or synthesizing an initial stock figure.
- `sales_shipment.created` (`inventory_movement`, `movementType: SHIP`) reduces inventory **quantity** and pending shipment. The base shipment rule posts zero inventory amount; COGS/cost valuation is a separate EVO capability. **Do not infer inventory cost/value goes to zero merely because quantity does.**
- `cash.received` (`cash_receipt`) records actual Cash and reduces scoped Receivable; this bounded same-currency full-closure test is not formal AllocationInstruction or bank-account reconciliation.
- Generic EVO `BusinessData` supports atomic immutable `FULFILLS` and `REFERENCES` links. The latter **is not a substitute** for the financial AllocationRelation/Instruction proved separately by EEL-C01.
- `GET /api/v1/ledgers/:ledgerCode/balances` is a read-only exact dimensioned CURRENT Position source, and `GET /api/v1/work-items` derives Work from positive balances, not a second App Platform Work state.

## Owner-correct minimum flow

```text
CUSTOMER Counterparty + Item + Warehouse
             |
Sales Order → pending_production +10, pending_shipment +10, receivable +1000
             |
Production completed → pending_production 0; item/warehouse Inventory +10
             |
Shipment → pending_shipment 0, Inventory quantity 0 (cost not assumed)
             |
Customer Cash Receipt → receivable 0, Cash +1000, COLLECT Work closes
```

All four business events are append-only and refer to the original Sales Order where applicable. Owner references are looked up in the original generic Counterparty/Item/Warehouse repositories and copied as stable IDs plus historic display-name snapshots. Customer must have an explicit CUSTOMER relationship role. Binding uses explicit `HostApplicationRefId → EVO ApplicationId` provider, not direct SQL or implied Warehouse Inventory ownership.

## Code and validation

- `apps/trading-reference/sales-loop.ts`: four public BusinessData submissions with strict reference/amount/identity checks.
- `tests/protocol/tr01b-sales-reference-loop.test.mjs`: OWNER-role gate, stable refs, immutable lineage, wrong/missing object rejection and explicit anti-overclaim checks.
- `tools/certify-tr01b-sales-evo-postgres.mjs`: live EVO HTTP Contract, scoped Ledger balances and open/closed Work with async-posting bounded wait. **No synthetic ledger writes**.
- `.github/workflows/cross-project-tr01b-sales-evo-postgres.yml`: isolated pinned EVO/PostgreSQL CI.

## Non-goals / safety gates

This is not a sales CRUD application, a replacement to the TR-01A Human/Agent/Workbench view, a Cash Account object, a new inventory ledger, Accounts Receivable account posting policy, collections workflow or financial reconciliation.

Deferred separately: actual stock valuation/COGS posting proof, external customer payment matching/AllocationInstruction, multi-currency realized FX, partial/over/under-payments, chargebacks, refunds, returns, multi-line/partial shipments, replay equivalence under all these variants, automatic Agent sales authoring, production authorization/installation and customer live UI approval.

**Cash `ledger` is not the company's Bank/Cash/Payment Platform master-data object.** The cash reference proves incoming cash movement only. Add the Financial Account Foundation Object later only if cross-channel banking identity, access control, multi-currency account routing, reconciliation and audit requirements create a demonstrated stable base-object contract; never introduce it just because the test includes `cash.received`.

No changes are permitted to IT-01, WH-01 or parallel 2D Designer branches; do not change `project.status.json` or GENERATED `HANDOFF-LATEST` before actual run evidence.
