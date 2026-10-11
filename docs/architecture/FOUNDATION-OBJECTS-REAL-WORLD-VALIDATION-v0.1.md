# EVO Foundation Objects & Real-World Validation Program v0.1

**Status:** ACTIVE PROGRAM BASELINE  
**Date:** 2026-10-07  
**Owner:** EVO App Platform / first-party object plugins  
**Applies to:** Counterparty first, then Item/Product/Inventory identity, Warehouse/Location and later enterprise foundation objects

## 1. Purpose

For the next product phase, EVO will deliberately build a small set of high-reuse
enterprise foundation objects before expanding into many business applications.

The immediate sequence is:

```text
Counterparty / 往来对象
        ↓
Item / Product / 存货对象 identity
        ↓
Warehouse / 仓库对象
        ↓
Storage Location / Bin / 库位
        ↓
additional foundation objects selected by real business evidence
```

This is not a fixed universal ontology. Each object must earn its boundary from
legacy archaeology, real enterprise use, public standards/data and cross-application
reuse.

## 2. Object admission rule

An entity is not automatically a Counterparty, Item, Warehouse or another foundation
object merely because it exists somewhere in the system.

For Counterparty specifically:

> A person, employee, internal company, government body, bank or any other entity
> becomes a Counterparty only when the current Enterprise needs to persist and reuse
> that entity **as a business/economic/settlement counterparty**.

Examples:

```text
Bank exists in reference data
≠ automatically Counterparty

Bank becomes deposit / loan / fee / settlement counterparty
→ Counterparty relationship is justified

Employee exists in workforce/identity data
≠ automatically Counterparty

Employee becomes accountable advance / reimbursement / loan counterparty
→ Counterparty relationship may be justified
```

The same principle applies to future objects: existence in another domain is not a
license to collapse distinct semantics into one universal table.

## 3. Canonical layering rule

Foundation objects own stable/current reference identity and relationship semantics.
They do not own every state or calculation that can be shown about the object.

```text
Layer 1 — Foundation Object / Master Reference
  identity + current governed descriptive state

Layer 2 — Relationship / Profile
  role-specific relationship semantics and settings

Layer 3 — BusinessData
  immutable committed business facts + required snapshots

Layer 4 — Deterministic Runtime
  Posting / Ledger / Cost / Allocation / Settlement facts

Layer 5 — Projection / Read Model
  current balances, open items, aging, on-hand, availability, summaries

Layer 6 — Report / BI / Management Intelligence
  analytical aggregation, presentation, comparison and explanation
```

The lower identity layers MUST NOT copy derived values back from higher calculation
or projection layers merely to make a screen convenient.

### Counterparty example

```text
Counterparty
= who

Relationship Role / Profile
= Customer / Supplier / service provider / affiliate / ...
  + role-specific settings

BusinessData
= sales order approved / purchase received / payment / invoice / ...

Ledger / Settlement
= receivable / payable / cash / open-item effects

Projection / Read Model
= current balance / aging / unsettled items

Report / BI
= customer exposure / supplier aging / concentration / trend
```

Therefore fields such as `receivableBalance`, `payableBalance`,
`unsettledAmount` or `agingBucket` do not belong on Counterparty master data.

### Item / Inventory example

```text
Item / SKU
= what the thing is

Inventory fact / Ledger
= what quantity/value changed, where and why

Inventory Position projection
= Item + Location + governed time/current boundary → on-hand / available state
```

`Item.quantityOnHand` is therefore not the target foundation-object model.

### Warehouse example

```text
Warehouse
= managed warehouse/facility identity

Zone / Storage Location / Bin
= physical/logical locating structure

Inventory Position
= Item at Location, derived from governed business facts
```

Warehouse identity, location topology and inventory balance remain separate concerns.

## 4. Relationship-first reuse, not duplicated identities

A stable object may participate in many business meanings without being duplicated.

For Counterparty:

```text
Counterparty cp-123
├─ CUSTOMER
├─ SUPPLIER
└─ future SERVICE_PROVIDER
```

For future objects the same principle applies: model reusable identity once, then put
context-specific behavior in explicit relationships/profiles.

A profile is not a license to build a giant generic object. Only semantics with a
clear owner and lifecycle are admitted.

## 5. Projection / read-model architecture

Traditional ERP systems often surfaced balances, aging, open items, inventory
quantities and similar values through projection tables, reporting layers or BI.
EVO keeps this useful separation while making authority explicit.

Target flow:

```text
Foundation Object
        │ reference
        ▼
BusinessData
        ▼
EVO Runtime / domain deterministic engines
        ▼
Ledger / Allocation / Settlement / Cost
        ▼
Projection / Read Model
        ├─ operational UI
        ├─ reports
        ├─ BI
        └─ Agent / Management Intelligence reads
```

A projection is rebuildable/read-optimized state. It must not become a second source
of master identity or historical business truth.

This is compatible with mature CQRS/read-model practice but EVO does not require a
particular CQRS framework. The design decision is about **authority separation**, not
technology branding.

## 5A. Human experience, import and workbench companion

Foundation-object validation is not limited to domain shape and performance.

The companion authority
`docs/architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md`
defines how the same object is exposed through Registry, role projections, import,
facet-based Object Pages and Personal Workbench composition.

RVC and demo fixtures should therefore also pressure-test:

- large import/mapping/error flows;
- list/projection usability at realistic record counts;
- role and permission intersection;
- sparse/heterogeneous optional facet data;
- custom-extension fields without core-schema expansion.

## 6. Real-World Validation Corpus (RVC)

Foundation-object design MUST be pressure-tested with substantial real-world data.
Toy fixtures remain useful for deterministic CI, but they are insufficient evidence
for object boundaries.

The engineering program is named:

> **EVO Real-World Validation Corpus (RVC)**

RVC is an engineering evidence program, **not** an EVO business module and not
Enterprise Context customer data.

### 6.1 Evidence flow

```text
Source dataset
+ source license
+ provenance/version
        ↓
source adapter
        ↓
normalized validation projection
        ↓
object-model validation
        ↓
exceptions / distribution report
        ↓
architecture decision or model correction
```

Source schemas are evidence, never canonical EVO schemas.

## 7. Validation scales

Default scale bands are engineering guidance, not semantic thresholds:

| Band | Approximate scale | Purpose |
| --- | ---: | --- |
| DESIGN | 10,000 records | discover field distributions, missing/odd values, internationalization and boundary cases |
| INTEGRATION | 100,000 records | imports, references, isolation, search, dedup candidates, relationship joins |
| PERFORMANCE | 1,000,000+ records | indexing, paging, query plans, storage, caching and Agent/tool access |
| FULL CORPUS | all practical source records | offline pressure testing and statistical analysis |

CI should use a small deterministic fixture derived or synthesized from the same
semantic cases. Full public datasets should not be committed to Git.

## 8. Initial source registry

The source registry is versioned evidence. Counts change over time; adapters MUST
pin a retrieval date/version.

| Object pressure-tested | Source | Useful evidence | Current reference |
| --- | --- | --- | --- |
| Counterparty identity | GLEIF Global LEI Index | legal entities, names, jurisdiction, addresses, lifecycle | 2026-10-06 Level 1: 3,453,219 records |
| Counterparty relationships | GLEIF Level 2 RR | parent/ownership relationships and exceptions | 2026-10-06: 672,492 relationship records |
| Counterparty identity | UK Companies House free company data | company status, registered office, SIC, previous names | monthly public snapshot |
| Counterparty business role | USAspending | real awarding agency ↔ recipient/contractor relationships | public API/bulk award and transaction data |
| Counterparty business role | EU TED | real buyer ↔ supplier/winner procurement relationships | open Search API + bulk XML notices |
| Item/Product | Open Food Facts | GTIN/barcode, names, brands, packaging, categories, multilingual product data | open bulk data/API |
| Warehouse / Facility | Japan MLIT Project LINKS warehouse data | warehouse specs, usage and business-operation evidence | 2025 warehouse CSV dataset |
| Warehouse / Location | OpenStreetMap / Geofabrik | real physical warehouse/facility geometry and location evidence | regional extracts, normally daily |
| Warehouse operations | real WMS research datasets | storage locations, SKU placement, picking waves/routes | anonymized real operational datasets |

Primary source pages:

- GLEIF Concatenated Files: https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file
- Companies House free company data: https://download.companieshouse.gov.uk/
- USAspending API: https://api.usaspending.gov/
- EU TED Search API: https://docs.ted.europa.eu/api/latest/search.html
- Open Food Facts data/docs: https://openfoodfacts.github.io/documentation/
- Geofabrik OpenStreetMap extracts: https://download.geofabrik.de/
- Japan MLIT Project LINKS open data: https://www.mlit.go.jp/links/open-data.html

Specific research datasets may be added only with an explicit source URL, license and
provenance record.

## 9. Licensing, provenance and privacy

Every RVC source MUST record:

```text
sourceId
sourceUrl
retrievedAt
sourceVersion/date
license
attribution requirements
redistribution constraints
adapterVersion
sampling method
content digest where practical
```

Rules:

1. Large original datasets remain outside the Git repository.
2. Git stores source manifests, adapters, small deterministic fixtures and reports.
3. ODbL/share-alike or attribution obligations are preserved per source.
4. Public legal-entity/business data may be used at scale for architecture testing.
5. Do not build a large real-person PII corpus merely to test Person counterparties.
   Use anonymized real structures and synthetic edge cases for natural persons.
6. Cross-source matching must retain provenance and confidence; it must never silently
   create a global identity truth.

## 10. Counterparty RVC first plan

The first large validation target should combine independent evidence classes:

```text
50k+ GLEIF legal entities
30k+ Companies House entities
20k+ GLEIF parent/relationship edges
50k+ procurement/award relationships from TED and/or USAspending
+ curated edge cases
```

Edge-case sampling should deliberately include:

- duplicate/similar names;
- multilingual and non-Latin names;
- very long legal/display names;
- previous names and status changes;
- missing or multiple identifiers;
- multiple addresses/jurisdictions;
- parent/subsidiary networks;
- one entity observed in multiple relationship roles;
- inactive/dissolved entities;
- code/name changes without identity replacement.

The purpose is not to import these records into a customer Enterprise Context. The
purpose is to prove or falsify the reusable object contract.

## 11. Architecture references

External enterprise systems are comparison evidence, not EVO schema authority.

Oracle Trading Community Architecture explicitly separates a Party from the business
relationships it enters into; Customer is a Party with a selling relationship and
Customer Account carries relationship terms. This is useful comparative evidence for
EVO's identity → role/profile separation:

- https://docs.oracle.com/en/cloud/saas/financials/26b/fairp/customer-and-party-structure.html
- https://docs.oracle.com/cd/E26401_01/doc.122/e48950/T172155T172158.htm

EVO still uses its own Enterprise Context, Resource Library, BusinessData and
EVO Runtime authority boundaries.

## 12. Foundation-object acceptance rule

A foundation object is not mature merely because CRUD works.

Before declaring an object boundary stable, applicable evidence should include:

```text
real-world corpus pressure test
enterprise-context isolation
stable identity under mutable descriptive data
explicit relationship/profile separation
transaction snapshot rule
derived-state/projection separation
cross-application reference proof
migration evidence mapping
large-list/search performance evidence
desktop/mobile Human experience
Agent/tool read/write contract where required
license/provenance documentation
```

## 13. Current program state

```text
Counterparty v0.1 identity/master-data loop
= production complete

Counterparty v0.2 relationship roles
= current implementation gate

Foundation-object RVC
= architecture baseline established by this document

Next foundation objects
= Item/Product and Warehouse/Location after Counterparty role boundary is proven
```
