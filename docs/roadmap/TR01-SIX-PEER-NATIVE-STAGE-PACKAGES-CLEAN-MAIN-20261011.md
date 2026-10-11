# TR-01 six peer Application packages — clean-main integration (2026-10-11)

## Purpose

Introduce the six independent `APPLICATION` **stage** packages on main **without** the larger unaccepted B2D3 finance-delegation branch and **without** changing `manager/server.ts`, `catalog/seed.ts`, Host Core, catalog loading, runtime financial permissions, or EVO. Stage packages: Purchasing, Receiving, Sales, Shipment, Receivable, Cash. Each has its own package identity, Feature, `eidos.experience`, locale and deterministic SYNTHETIC read-only fixture.

The test suite injects packages using the existing generic `createPackageCatalog` + `createAppManagerService` APIs and tests install/enable/disable/uninstall and Eidos rendering. **The official Host catalog is intentionally not wired**, so this PR does not assert that the packages are present in production `/store` or ready for real HTTP acceptance. A separate generic plugin discovery/installation infrastructure improvement must be approved, not a new hard-coded business registration in core.

Existing `apps/trading-reference/purchase-loop.ts` and `sales-loop.ts` are untouched, preserving previously certified BusinessData/ledger Postgres CI. Real sales, shipment, purchase, receipt, receivable and cash business mutations are **not** moved into these stage packages and are not claimed completed. Receiving reversal belongs to Receiving, not a standalone Reversal plugin.

Counterparty, Item, Warehouse, Data Import, Object Extension are already separate packages; this PR does not recreate them. Inventory and Cost are reports/views of existing EVO output, not new business accounting engines. EVO Ledger Runtime core plugin in `jiangxng/EVO` remains the sole FIFO, ledger, posting, replay and Allocation engine owner (see accepted EVO 2026-09-24 ADR). Platform must not copy any financial calculation.

## Integration and safety

- Changes confined to `apps/trading-stage*`, one test, one workflow and this document.
- No finance execution, no OAuth/install trust bypass, no production endpoint or DB migration.
- No modifications to Eidos / Agent / 2D Designer.
- Original B2D3 Draft #594 stays separate and not approved for production admission.
- Dedicated CI verifies six distinct manifests and their independent Eidos UI lifecycle.
- Railway preview is separately gated and must not overwrite the existing ledger production service.
