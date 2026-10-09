# WH-01 Warehouse/Location Third-Object Evidence v0.1

**Status:** WH-01A + WH-01B MERGED_CI_PRODUCTION_PASS / WH-01C ACTIVE  
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


## WH-01B — hierarchical Data Import

Status: **MERGED_CI_PRODUCTION_PASS**.

WH-01B reuses the accepted generic Data Import target/service pipeline without
changing a shared STABLE_CANDIDATE Foundation Object contract.

The import target is domain-owned:

```text
targetId = warehouse.location
ownerPackageId = evo-warehouse
```

Import columns:

```text
warehouseCode
path
displayName
locationKind = ZONE | LOCATION | BIN
description?
```

### Why path is an import reference, not identity

External files should not need EVO `locationId` values merely to express a physical
hierarchy.

Example:

```text
WH-A | ZONE-A
WH-A | ZONE-A/01
WH-A | ZONE-A/01/BIN-01
```

The path consists of operational sibling codes. It is normalized only for import
resolution and is **not** persisted as the durable identity. `locationId` remains
the stable Enterprise Context resource identity.

This preserves the WH-01A rule that display/navigation paths are derived structure,
not identity.

### Order-independent same-batch resolution

Source row order is not hierarchy authority. A child may appear before its parent.

At atomic commit time the Warehouse target:

1. resolves active Warehouse codes;
2. indexes the existing active hierarchy by normalized operational path;
3. indexes all same-batch paths;
4. verifies every parent path exists either in the existing hierarchy or the batch;
5. sorts only the internal write plan by path depth;
6. writes parents before children inside one Enterprise Resource transaction;
7. maps results back to original source row order.

Thus file order does not change business meaning.

### Failure model

The target fails closed for:

- unknown active Warehouse code;
- invalid/empty path segments;
- duplicate normalized path inside one batch;
- orphan parent path;
- existing hierarchy corruption;
- sibling code collision, archived code reservation or other WH-01A repository
  invariant;
- missing Enterprise Resource transaction support.

A batch-level hierarchy failure becomes one atomic Data Import failure receipt; no
partial Warehouse Location resources remain.

### No generic hierarchy abstraction yet

The path resolver belongs to `evo-warehouse`.

WH-01B does **not** add:

- `parentId` to the generic Foundation Object descriptor;
- a shared tree/path framework;
- a generic hierarchy import contract;
- any inventory quantity field.

One third-object domain is insufficient evidence for a universal hierarchy
abstraction.

Evidence:

- `apps/warehouse/import-target.ts`
- `tests/protocol/wh01-warehouse-location-import.test.mjs`

After WH-01B passes CI/production, WH-01C should compose Responsibility, Projection
and Eidos navigation from the same authoritative Warehouse/Location resources.


## WH-01B production evidence

- implementation PR: #542
- main merge commit: `9f3e65e84d521f2e6ea23aba31dc64525c3aa224`
- Platform CI: PASS
- Project Continuity CI: PASS
- Railway deployment: `c2011371-4309-4982-9062-90cb98a166a9` — SUCCESS

WH-01B is closed. WH-01C is the active slice and will compose Warehouse/Location
Responsibility, Authorization, derived Projection, Eidos and shared Human/Agent read
authority without adding Inventory Position state to Warehouse.


## WH-01C — Responsibility / Projection / Eidos composition

Status: **MERGED_CI_PRODUCTION_PASS**.

WH-01C reuses the Item-proven governance pattern without copying Item semantics.

### Responsibility is business scope, not permission

The Warehouse-owned responsibility type is:

```text
WAREHOUSE_STEWARD
```

`warehouse.my-stewardship` first intersects normal Warehouse authorization and only
then filters to active WAREHOUSE_STEWARD assignments for the current principal.

Responsibility therefore cannot grant a Warehouse that authorization denied.

### One derived read authority

The Warehouse Projection Service composes, at read time:

```text
Warehouse identity
+ active Warehouse Location hierarchy
+ Enterprise Extension values
+ Responsibility assignments
+ Authorization decisions
→ Warehouse Projection
```

No `evo.warehouse-projection` enterprise resource is persisted.

The same Projection Service is used by:

- Eidos Human pages;
- platform capability operations exposed to Personal Agent;
- Automation.

### Eidos experience

The package contributes:

- Warehouse Directory;
- My Warehouses;
- Warehouse Detail;
- Workbench Home: My Warehouses;
- localization bundles;
- lifecycle-aware `warehouse.location` Data Import target metadata.

Warehouse Detail derives readable hierarchy paths from the authoritative
parentLocationId/code structure. Those paths are display/navigation structure and are
not persisted identity.

### Lifecycle / lazy-loading rule

`evo-warehouse` is catalog-discoverable without loading its implementation.

The Host resolves Warehouse repositories, hierarchy, projection service, page module,
projection action handlers and Data Import target only after the Warehouse feature is
active and the corresponding capability/page/import target is actually used.

Feature deactivation or package uninstall clears the cached Warehouse runtime.

This preserves PR #509:

```text
Discover metadata cheaply.
Load implementation only when lifecycle and use require it.
```

### Inventory separation remains hard

Warehouse projection and Eidos payloads contain structure and responsibility only.

They do not contain:

- itemId;
- on-hand quantity;
- available quantity;
- reserved quantity;
- inventory balance;
- ledger balance.

Inventory Position remains a separate later trading/inventory authority.

Evidence:

- `apps/warehouse/access.ts`
- `apps/warehouse/authorization.ts`
- `apps/warehouse/projections.ts`
- `apps/warehouse/projection-service.ts`
- `apps/warehouse/projection-actions.ts`
- `apps/warehouse/page.ts`
- `apps/warehouse/capability-manifest.ts`
- `apps/warehouse/package.ts`
- `tests/protocol/wh01-warehouse-projection-eidos.test.mjs`
- lifecycle/lazy Host wiring in `manager/server.ts`

After WH-01C production passes, WH-01D should use real warehouse/location evidence to
pressure naming, hierarchy depth, codes and structural assumptions before TR-01.


## WH-01C production evidence

- implementation PR: #544
- main merge commit: `f47890b5823ad7389625563d5a6f0c62eb220fdb`
- combined CI: 34/34 PASS
- Platform CI: PASS
- Project Continuity CI: PASS
- Cross Project Trading Lite Eidos Browser EVO CI: PASS
- Railway deployment: `60a02755-b544-48cf-907c-95e3feddd56f` — SUCCESS

WH-01C is closed. WH-01D is the active closure slice and will pressure Warehouse
identity and Location hierarchy with real external place/facility evidence before
TR-01.


## WH-01D — real Warehouse / facility RVC

Status: **IMPLEMENTED / REAL-DATA CI PENDING**.

### External evidence source

WH-01D uses Overture Maps Buildings release `2026-09-23.1`, schema v2.0.0.

The real-data workflow selects `class = warehouse` building features from four
bounded logistics-heavy regions and retains at most 5,000 rows:

- Los Angeles;
- Chicago;
- Dallas–Fort Worth;
- Rotterdam–Antwerp.

The sample must contain at least 1,000 real warehouse-class building features to count
as useful pressure evidence.

Raw source records are ephemeral CI input only. The repository retains only source
manifest/provenance, sample SHA-256 and derived evidence.

Official evidence semantics:

- Overture Building `id` may be a GERS feature identifier;
- Building geometry is a physical building footprint;
- `height`, `num_floors` and `has_parts` describe physical structure;
- BuildingPart represents a physical part of a larger building, not an operational
  Warehouse Zone/Location/Bin;
- OSM warehouse tagging distinguishes warehouse buildings/facilities from enterprise
  operational identities and explicitly allows one warehouse to span multiple
  buildings or one building to contain multiple warehouses;
- GS1 GLN is another external supply-chain location identifier and therefore further
  supports keeping external location identifiers separate from `warehouseId`.

References:

- Overture 2026-09-23 release:
  https://docs.overturemaps.org/blog/2026/09/23/release-notes/
- Overture Buildings data access:
  https://docs.overturemaps.org/guides/buildings/
- Overture Building schema:
  https://docs.overturemaps.org/schema/reference/buildings/building/
- Overture BuildingPart schema:
  https://docs.overturemaps.org/schema/reference/buildings/building_part/
- OpenStreetMap warehouse semantics:
  https://wiki.openstreetmap.org/wiki/Tag:industrial=warehouse
- GS1 GLN:
  https://support.gs1.org/support/solutions/articles/43000734322-what-is-a-global-location-number-gln-

### RVC decision rules before seeing the data

The workflow must not equate a public map feature with enterprise Warehouse identity.

These rules are fail-closed:

```text
Overture/GERS building id != warehouseId
building name != required enterprise Warehouse displayName authority
building/building-part hierarchy != Zone / Location / Bin authority
geometry != Inventory Position
height / floors != stock quantity
```

Permitted conclusion:

```text
external facility evidence
  (identifier scheme/value + source + geometry/physical attributes)
may relate to
enterprise Warehouse identity
```

The relation is evidence/provenance, not identity replacement.

### Why this is a third-object structural pressure test

Counterparty proved role-heavy identity.
Item proved semantic qualifiers, import, trade identifiers and UOM boundaries.
Warehouse now pressures a different shape:

- place identity;
- physical structure;
- parent/child operational hierarchy;
- navigation paths;
- external geospatial/location identifiers;
- strict separation from Inventory Position quantities.

No new shared hierarchy abstraction is permitted merely because Warehouse needs a
tree. The shared STABLE_CANDIDATE contracts should change only if the real RVC exposes
a concrete incompatibility.

Evidence implementation:

- `tools/warehouse-rvc-overture.mjs`
- `tests/protocol/wh01-warehouse-overture-rvc.test.mjs`
- `.github/workflows/wh01-warehouse-overture-rvc.yml`
