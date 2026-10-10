# TR-01 Trading Reference Loop Evidence v0.1

**Status:** TR-01A1 + TR-01A2 MERGED_CI_PRODUCTION_PASS / TR-01A operational view acceptance OPEN  
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

Status: **MERGED_CI_PRODUCTION_PASS**.

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


## TR-01A sub-gates

TR-01A is intentionally not closed by the first positive purchase loop alone.

### TR-01A1 — positive purchase loop + replay

Status: **MERGED_CI_PRODUCTION_PASS**

Evidence target:

- Supplier-role Counterparty + Item + Warehouse are resolved through their owning public contracts;
- Purchase Order and Goods Receipt are submitted as immutable BusinessData facts;
- Receipt carries explicit `FULFILLS` lineage to the Purchase Order fact;
- EVO public dimension-filtered CURRENT LedgerBalance read proves:
  - `pending_purchase = 0` after full receipt,
  - `payable = 125`,
  - `inventory quantity = 10`,
  - `inventory amount = 125`,
  - inventory dimensions retain the Item, Warehouse, order and Supplier references;
- Work closes RECEIVE after full receipt while PAY remains open;
- deterministic replay is certified by the pinned EVO mainline's isolated replay certifications. The current pin includes EVO PR #105, whose `tr01-purchase-receipt-reversal` certification proves Purchase -> Receipt -> Reversal full replay and whose normal EEL-C02 certification remains green. These isolated replay certifications intentionally do not share the already-mutated App Platform cross-project database.

Runtime Observation aggregate quantity/amount is deliberately **not** used as an order-level Position API. It is a ledger-wide observation surface and correctly fails closed when units/currencies cannot be represented as one aggregate. TR-01A1 instead uses EVO's public dimension-filtered LedgerBalance read boundary introduced by EVO PR #104.

### TR-01A1 verified closure — 2026-10-10

The positive purchase loop is closed as **MERGED_CI_PRODUCTION_PASS**; this does **not** close TR-01A or authorize TR-01B.

- App Platform PR #551: https://github.com/jiangxng/EVO-App-Platform/pull/551
- merged main commit: `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3`
- verified PR head: `1de23c70e26c1c45653115ac6abc805d4f70f681`
- Project Continuity CI: **PASS** (run 38006776596)
- Platform CI: **PASS** (run 38006776576)
- Cross Project CI — Trading Lite EVO PostgreSQL: **PASS** (run 38006776715)
- Railway project `EVO Ledger Runtime MVP`, service `Ledger Configurator`, production deployment `b1d141c6-858d-4ee3-8422-0efbe7147396`: **SUCCESS**, main commit `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3`
- EVO current main at verification: `2311022640aa108a6baf3db44d9b26bd3e3ad623`
- EVO PR #103: atomic direct BusinessData `FULFILLS` relation; PR #104: exact dimension-filtered LedgerBalance read; PR #105: isolated receipt `REVERSES` replay certification. All three are merged.

The dedicated PostgreSQL proof asserts Purchase Order -> Goods Receipt yields pending_purchase +10 then 0, inventory +10 / +125, payable +125 and an open PAY WorkItem while RECEIVE closes. This is a cross-project integration proof, not evidence of a completed App Platform correction/reversal submission. Historical BusinessData is immutable. EVO PR #105's isolated replay certification supplies the runtime-level replay capability; App Platform A2 still needs its own public API integration certification.

### TR-01A2 — purchase receipt correction / reversal

Status: **MERGED_CI_PRODUCTION_PASS — BOUNDED FULL REVERSAL**.

A correction must be a new immutable business occurrence. It must not mutate the
Purchase Order or prior Goods Receipt.

The minimum reversal semantics are:

```text
original Purchase Order remains unchanged
original Goods Receipt remains unchanged
+ new receipt-reversal fact
→ pending_purchase +reversed quantity
→ inventory -reversed quantity / -reversed cost
→ payable unchanged (the payable originated from Purchase Order approval)
```

The reversal fact must carry explicit lineage to the Goods Receipt it reverses and
must replay deterministically in EVO.

Do not mark TR-01A closed and do not start TR-01B merely because TR-01A1 passes.

## Next live gate / TR-01A2 ownership — 2026-10-10

- App Platform: resolve the authoritative receipt context and original Goods Receipt BusinessData identity, form a separate reversal BusinessData submission through the existing generic EVO adapter with `REVERSES` lineage; preserve existing owner references and deterministic idempotency.
- EVO: owns immutable BusinessData relation persistence, purchase reversal posting rules, pending_purchase/inventory/payable balances, WorkItems and replay. Reuse PR #105 and its public contract; no App Platform private Ledger writes.
- Evidence target: PostgreSQL HTTP receipt reversal from App Platform public integration, exact line/quantity/cost/dimension assertions, original PO/Receipt unchanged, REVERSES lineage, no payable rollback, RECEIVE reopened, PAY still open, deterministic replay.
- Sequence guard: TR-01A2 must close before TR-01B starts.


## TR-01A2 verified production closure — 2026-10-10

TR-01A2 is **MERGED_CI_PRODUCTION_PASS** as a bounded immutable full Goods Receipt reversal proof. This does **not** certify general partial or concurrent reversals, or close all TR-01A product experience acceptance.

- App Platform PR #557: https://github.com/jiangxng/EVO-App-Platform/pull/557
- merged main: `70c6aac34cd6fad931f7110442e9a0f01293ef44`; verified final PR head: `646a7c0d75a9e88536c5ca71f4e7ea708ab83002`.
- Project Continuity CI `38008286765`: PASS; Platform CI `38008286826`: PASS; Cross Project Trading Lite EVO PostgreSQL CI `38008286848`: PASS.
- Railway project `EVO Ledger Runtime MVP`, service `Ledger Configurator`, production deployment `1ece6ea3-c124-4d65-9860-f14d88f959a9` at main `70c6aac34cd6fad931f7110442e9a0f01293ef44`: SUCCESS; service reported online, 1/1 replicas and no current warnings/critical issues.
- EVO main `2311022640aa108a6baf3db44d9b26bd3e3ad623`, PR #105: merged runtime `REVERSES` contract and immutable, deterministic replay certification; EVO #105 CI PASS.
- App Platform certifies through public EVO BusinessData, dimension-filtered LedgerBalance, WorkItem and Runtime Observation boundaries: full Receipt +10 / +125 followed by reversal leaves `pending_purchase +10`, `inventory 0 quantity / 0 cost`, `payable +125`, RECEIVE reopened and PAY still open.
- The original Purchase Order and Goods Receipt remain unchanged. The new `goods_receipt.reversed` fact links by `REVERSES` directly to the original Goods Receipt's BusinessData ID. EVO replay preserves immutable facts, lineage, balances, Work and economic digest.

Detailed record: `docs/roadmap/TR01A2-PURCHASE-RECEIPT-REVERSAL-PRODUCTION-EVIDENCE-20261010.md`.

### Remaining TR-01A acceptance — NOT YET CLOSED

TR-01A's original acceptance criterion 6 calls for shared governed **Human/Agent/Workbench operational projections**. The #551/#557 certification proves economic ledger and derived EVO WorkItem behavior, but those PRs deliberately do not implement a procurement-specific Human interface or certify shared Human/Agent/Workbench consumption. Do not turn the successful economic reference proof into an unsupported claim that the entire TR-01A product experience is production accepted.

The next bounded gate is to inventory existing owned Work/Projection/Workbench capabilities, prove or implement the missing authorized consumption, and record relevant CI / production / Human evidence. TR-01B remains **PLANNED_NOT_STARTED** until this remaining acceptance is evaluated and closed.

Also excluded: generalized partial/multiple reversal, concurrency-safe over-reversal prevention, and public read-back verification of original receipt cost. These require a separate authoritative receipt query/idempotency and remaining-quantity design before a generic correction UX can claim readiness.
