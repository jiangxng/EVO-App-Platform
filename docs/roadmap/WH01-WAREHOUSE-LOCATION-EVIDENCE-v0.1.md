# WH-01 Warehouse/Location Third-Object Evidence v0.1

**Status:** WH-01A MERGED_CI_PRODUCTION_PASS / WH-01B ACTIVE  
**Date:** 2026-10-09  
**Authority:** `docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md`

## Purpose

WH-01 is not another master-data feature expansion. It is the structural third-object
proof after Counterparty and Item.

The shared Foundation Object contracts are now `STABLE_CANDIDATE`. WH-01 therefore
starts with a stronger rule than IT-01:

> reuse the accepted shared contracts by default; reopen them only when Warehouse /
> Location produces a concrete incompatibility.

## Hard semantic separation

```text
Warehouse / Location
= where

Inventory Position
= what Item is there and how much
```

WH-01A contains no on-hand quantity, available quantity, reserved quantity, inventory
balance or ledger state.

Those belong to later operational Inventory Position / BusinessData / Ledger
relationships, not to Warehouse master data.

## External location evidence

GS1 location standards reinforce the same semantic boundary:

- GLN location identification answers the question "where";
- warehouse / distribution centre is an example physical location;
- dock door, cold storage and shelf are examples of physical sub-locations;
- one physical location can contain another physical sub-location;
- sub-locations may use their own GLN or other agreed internal identification.

References:

- https://www.gs1.org/standards/id-keys/gln/physical-location
- https://www.gs1.org/standards/gs1-gln-allocation-rules-standard/current-standard
- https://www.gs1.org/standards/gln-data-model-solution-standard/current-standard

This evidence does **not** make GLN the mandatory EVO Warehouse or Bin primary key.
Enterprise Warehouse/location identity remains enterprise-owned. GLN and other external
location identifiers are later identifier evidence where interoperability requires it.

## WH-01A model

### Foundation Object — Warehouse

```text
warehouse.subject
  warehouseId
  code
  displayName
  description?
```

Extension slots:

- `warehouse.identity`
- `warehouse.facility-profile`

Address, coordinates, ownership/management, operating constraints and external location
identifiers are deliberately not frozen into core identity in WH-01A.

### Domain child resource — Warehouse Location

```text
warehouse.location
  locationId
  warehouseId
  parentLocationId?
  code
  displayName
  locationKind = ZONE | LOCATION | BIN
  description?
```

The hierarchy is domain-owned inside `evo-warehouse`; it is not promoted to a new
generic Foundation Object hierarchy framework before evidence shows another object
needs the same semantics.

## Structural invariants

- every active Warehouse Location belongs to one active Warehouse;
- an existing Location cannot silently move to another Warehouse;
- parent and child must belong to the same Warehouse;
- hierarchy cycles fail closed;
- Location code uniqueness is sibling-scoped, not globally flattened;
- archived Location identity cannot be silently reactivated through ordinary save;
- a Location with active children cannot be archived;
- a Warehouse with active Locations cannot be archived;
- archive preserves historical Enterprise Context resources rather than deleting them;
- no inventory quantity/balance is stored in Warehouse or Location payloads.

## Why sibling-scoped codes

Real Warehouse structures often repeat short operational codes below different parent
areas. WH-01A therefore treats:

```text
Zone A / 01
Zone B / 01
```

as distinct valid locations while rejecting two active/historical siblings with the
same normalized code.

The stable identity remains `locationId`; a display/path string is derived navigation
and must not become the identity.

## Next slices

After WH-01A passes CI/production:

1. **WH-01B** — hierarchical Data Import using the existing generic Data Import
   contracts and parent-resolution rules;
2. **WH-01C** — Responsibility / Projection / Eidos composition for Warehouse and
   location navigation;
3. **WH-01D** — real WMS/location RVC, external identifiers and hierarchy pressure;
4. close WH-01 and move to **TR-01 Trading Reference Loop**.

Do not create Inventory Position inside Warehouse merely to make the demo look more
complete.


## WH-01A production evidence

- implementation PR: #540
- main merge commit: `4f9490b24792836db5d070bd8b2b2767809f3bda`
- Platform CI: PASS
- Project Continuity CI: PASS
- Railway deployment: `a946ec39-35d2-4c73-8dd2-d9e3b7cd5de1` — SUCCESS

WH-01A is closed. WH-01B is the active slice and must prove order-independent
hierarchical Data Import through the existing generic Data Import contracts without
moving Warehouse hierarchy semantics into shared Foundation Object contracts.
