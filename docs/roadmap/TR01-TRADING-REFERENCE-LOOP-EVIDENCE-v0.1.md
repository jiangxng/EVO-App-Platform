# TR-01 Trading Reference Loop Evidence v0.1

**Status:** TR-01A ACTIVE  
**Date:** 2026-10-10  
**Program:** Foundation Object Program  
**Authority:** `docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md`

## Purpose

Counterparty, Item and Warehouse/Location have completed their object-level proofs.
TR-01 stops object-first expansion and uses those authorities in real business
operations.

The first bounded slice is the purchase-side loop:

```text
Supplier Counterparty
+ Item
+ Warehouse / Location
        ↓
Purchase Order
        ↓
Receipt
        ↓
Inventory movement / Inventory Position
        ↓
Payable / open item
        ↓
Work + Projection + Personal Workbench
```

## Hard authority boundaries

### Master data

- Counterparty owns supplier identity/relationship role.
- Item owns enterprise Item identity and Item semantics.
- Warehouse/Location owns where.
- Purchase Order stores governed references/snapshots needed for the business fact; it
  does not become a second master-data authority.

### Business facts

Purchase Order approval, Receipt and later corrections/reversals are immutable
business occurrences. Later state is expressed by new facts, not by rewriting the
historical occurrence.

### Inventory

Warehouse master data does not contain on-hand quantity.

```text
Warehouse = where
Inventory Position = what Item is there and how much
```

Inventory Position must be derived from inventory movement / ledger facts.

### Finance

Payable/open-item balances are not Purchase Order fields. They are derived from
governed financial posting facts/rules and projections.

### Views and work

Projection, Work, Workbench and Agent views may summarize authoritative facts but
must never become transaction or ledger authority.

## TR-01A acceptance

1. Purchase Order references a Supplier-role Counterparty, Item lines and destination
   Warehouse/Location using public contracts.
2. Receipt is appended as a new business occurrence and deterministically reduces the
   open-to-receive view.
3. Receipt produces inventory movement facts that determine Inventory Position.
4. Payable/open-item effects are produced through posting facts/rules rather than
   hidden mutable order balance fields.
5. The loop is deterministic/replayable from BusinessData + posting facts.
6. Human/Agent/Workbench operational views consume shared projections.
7. Corrections/reversals use new facts, never historical mutation.

## Planned sequence

```text
TR-01A  Purchase Order → Receipt → Inventory Position → Payable
TR-01B  Sales Order → Shipment → Inventory Position → Receivable → Receipt/Settlement
TR-01C  contract maturity + Foundation Object Program exit review
```

Selected object-neutral Foundation Object contracts remain **STABLE_CANDIDATE** until
the real trading loops complete without incompatible evidence.


## TR-01A1 — Purchase / Receipt cross-project composition

Status: **IMPLEMENTED / CI PENDING**.

This slice does not implement procurement accounting inside App Platform.

App Platform owns:

- resolving an ACTIVE Supplier-role Counterparty;
- resolving ACTIVE Item and Warehouse authority;
- stable runtime Application bindings;
- business intent composition and idempotency/correlation identity;
- passing an explicit Receipt `FULFILLS` relation.

EVO owns:

- BusinessData persistence;
- immutable BusinessData relation persistence;
- PostingRule evaluation;
- `pending_purchase`, `payable` and `inventory` ledger facts/balances;
- derived WorkItem state.

Runtime binding:

```text
application:trading-reference.purchase-order
  -> EVO applicationId purchase_order

application:trading-reference.goods-receipt
  -> EVO applicationId inventory_movement
```

Authoritative master-data references are stable IDs:

```text
supplier  = Counterparty.counterpartyId
productId = Item.itemId
warehouse = Warehouse.warehouseId
```

Human-facing code/display-name values are copied only as historical snapshots in
BusinessData payload and do not become transaction-owned master-data authority.

Receipt lineage:

```text
Purchase Order BusinessData
        |
        | FULFILLS
        v
Goods Receipt BusinessData
```

EVO direct BusinessData relation support is pinned to:

```text
jiangxng/EVO main
PR #103
merge 184811a1b25aa6563b03439758663f04fa4d6319
```

Cross-project certification uses only public EVO HTTP boundaries:

- `POST /api/v1/business-data`;
- `POST /api/v1/runtime-observations/query`;
- `GET /api/v1/work-items`.

Expected economic result for a full 10-unit / CNY 125 receipt:

```text
after Purchase Order:
pending_purchase +10
payable          +125
inventory         unchanged
RECEIVE Work      open
PAY Work          open

after full Receipt:
pending_purchase  back to baseline
payable          +125
inventory         +10 / +125
RECEIVE Work      closed
PAY Work          still open
```

No App Platform code writes LedgerEntry, LedgerBalance, WorkItem or EVO database
tables directly.
