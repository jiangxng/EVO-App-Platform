# IT-01 Item Real-World RVC Evidence — 2026-10-09

**Status:** PASS  
**Program:** Foundation Object Program / IT-01 Item/Product second-object proof  
**Source class:** real-world external product data + standards  
**Purpose:** retain durable Item anti-overfit evidence after GitHub Actions artifacts expire.

## Source provenance

The RVC used the verified Open Food Facts product database published through the
Open Food Facts Hugging Face organization.

- source dataset: `openfoodfacts/product-database`
- resolved dataset snapshot:
  `65ceac3fa350b90dc3abea5cddbaa2a2370e73de`
- resolved data file: `food.parquet` at that snapshot
- retrieval time: `2026-10-09T12:35:10.054339Z`
- license: Open Database License (ODbL) 1.0
- sample method: first 20,000 rows with non-empty source `code`
- sample SHA-256:
  `6b8793b66bed44de09f158605e5ca6f7e9c040294d1ad3814c64082244a30218`
- raw sample: ephemeral CI input only; not committed and not retained as an artifact

Implementation evidence:

- `tools/item-rvc-open-food-facts.mjs`
- `tests/protocol/it01-item-open-food-facts-rvc.test.mjs`
- `.github/workflows/it01-item-open-food-facts-rvc.yml`
- PR #538
- real-data workflow run `37931433948`

## Observed real-world data

| Evidence | Result |
| --- | ---: |
| total sampled rows | 20,000 |
| distinct external codes | 20,000 |
| duplicate external codes | 0 |
| duplicate display-name candidates | 5,291 |
| missing product name | 0 |
| missing package quantity | 6,897 |
| missing brand | 346 |
| missing category | 1,087 |
| missing country evidence | 0 |
| numeric source codes | 20,000 |
| GTIN-8/12/13/14 shape candidates | 20,000 |
| valid GS1 check-digit candidates | 19,984 |
| invalid GS1 check-digit candidates | 16 |
| observed OFF-assigned 200-prefix candidate | 1 |
| numeric-13 codes | 19,157 |
| numeric-8 codes | 843 |

The sample is intentionally not treated as representative of every Open Food Facts
record. It is an auditable pressure corpus for the current Item contract.

## Package quantity / UOM pressure

13,003 of the 20,000 rows contained package quantity text that the bounded RVC parser
could identify with a unit token. 12,450 of those mapped directly to the small
UN/CEFACT Rec20 subset used by the evidence harness.

Observed top quantity-unit tokens:

| Source token | Count | Rec20 evidence code |
| --- | ---: | --- |
| g | 11,055 | GRM |
| ml | 1,312 | MLT |
| oz | 467 | not promoted by this bounded mapping |
| fl oz | 57 | not promoted by this bounded mapping |
| l | 41 | LTR |
| kg | 36 | KGM |
| lb | 16 | not promoted by this bounded mapping |
| cl | 13 | not promoted by this bounded mapping |
| count/unit | 6 | C62 |

The observed mixture is evidence against copying external package quantity into
`baseUomCode`. Package content and enterprise operational UOM are different
semantics.

## Generic EVO import pressure

1,000 usable real-world records were adapted into an ephemeral Enterprise Context and
run through the already accepted generic Item Data Import path:

```text
Open Food Facts evidence
→ explicit RVC adapter
→ generic Data Import stage
→ dry-run
→ schema digest
→ atomic batch commit
→ Item Enterprise Resource
→ Enterprise Extension trade-profile evidence
→ receipt
```

Result after the IT-01E Item batch-persistence correction:

| Evidence | Result |
| --- | ---: |
| requested rows | 1,000 |
| dry-run valid | 1,000 |
| dry-run invalid | 0 |
| commit state | COMMITTED |
| committed rows | 1,000 |
| failed commit rows | 0 |
| persisted Item resources | 1,000 |
| persisted extension value sets | 1,000 |
| elapsed | 6,563.15 ms |
| throughput | 152 rows/sec |

The first successful real-data run, before batch repository optimization, took
32,535.18 ms at approximately 31 rows/sec. The same semantic workload after
`ItemRepositoryV010.saveMany` and batch import reuse took 6,563.15 ms at
approximately 152 rows/sec — about 4.9x faster — while preserving archive/code
reservation and atomic-commit invariants.

This is a design-pressure measurement, not a production database SLO.

## Explicit RVC adapter rules

The RVC adapter intentionally does **not** claim that external data is enterprise
authority.

- enterprise Item code = deterministic RVC-only surrogate derived from the source
  code; this is not a production identity rule;
- `itemKind = GOODS`;
- `baseUomCode = C62` only as an explicit pipeline-pressure assumption that one
  external record is treated as one operational unit;
- Open Food Facts source code is preserved as external trade-item identifier evidence;
- package quantity, brand and category stay in trade-profile extension evidence.

## Semantic decisions from the second object

### Enterprise Item identity

Keep the accepted minimal stable identity:

```text
itemId
code
displayName
itemKind
baseUomCode
description?
```

The enterprise owns this identity. External dataset identifiers do not become
`itemId`.

### GTIN / barcode

Do **not** add `gtin` as the universal Item primary key or a mandatory core identity
field.

The evidence supports a separate identifier model:

```text
Item
└─ external/trade identifier
   ├─ scheme
   ├─ value
   └─ source/provenance
```

GTIN is one identifier scheme for trade items. Other barcode/internal/external schemes
may coexist. A later Item/trading capability may promote this from Enterprise
Extension evidence into a reusable related identifier resource when real transaction
requirements need it.

### Product / SKU / variant

Do **not** create universal core fields named `productId`, `sku` or `variantId`
from this dataset.

Those names describe enterprise relationships that differ by business:

- Product may mean a commercial grouping/template;
- SKU may mean a sellable, stock-managed or channel-specific unit;
- variant may express dimension values under a grouping.

They should be modeled only when an enterprise/trading use case proves the relation.
A public product database cannot define those internal enterprise semantics.

### Category

Category is classification/taxonomy, not identity. The target model must support
governed taxonomy relations and potentially multiple classifications rather than
freezing one scalar `categoryId` into Item identity.

### Brand

Brand is descriptive/commercial evidence and not Item identity.

### UOM

`baseUomCode` remains the enterprise operational quantity unit.

Its value should converge on a governed code reference compatible with UN/CEFACT
Recommendation 20. External package content such as `400 g` or `154 ml` is a
separate measure and must not silently redefine the enterprise base UOM.

## Foundation Object maturity decision

IT-01 is the materially different second-object anti-overfit proof. The evidence is
strong enough to distinguish object-neutral contracts from domain-specific semantics.

### STABLE_CANDIDATE after IT-01

The following mechanisms have now been exercised by both Counterparty and Item and may
move **toward STABLE** under normal version-compatibility discipline:

- `FoundationObjectDescriptorV010` object/slot ownership model;
- core/effective schema separation;
- object-neutral applicability qualifiers;
- DISCOVERY/EFFECTIVE schema compilation modes;
- Enterprise Object Extension definition/value boundaries;
- generic Foundation Object Data Import target contract and stage/dry-run/schema-
  digest/atomic-commit/receipt pipeline;
- Enterprise Resource as durable enterprise-owned persistence boundary;
- derived Projection + Responsibility + Authorization separation as the object read
  composition pattern.

`STABLE_CANDIDATE` does not mean frozen forever. It means WH-01 should reuse these
contracts and open a shared-contract change only when the structurally different
Warehouse/Location proof produces concrete incompatibility evidence.

### Keep EXPERIMENTAL / compatibility-scoped

Do not stabilize these as universal Foundation Object semantics yet:

- Counterparty `relationshipRoles` compatibility keys;
- Item/Product/SKU/variant/trade-identifier semantics;
- Item UOM/catalog/classification domain model;
- Item-specific Responsibility codes;
- source-specific RVC adapters;
- recently introduced lifecycle-aware Data Import target package contribution as a
  universal extension mechanism beyond its accepted use case.

## IT-01 exit recommendation

The second-object gate has achieved its purpose:

- it found and removed Counterparty-first applicability vocabulary from the generic
  path;
- it found and removed Counterparty-first import-parameter/value-normalization
  assumptions;
- it forced lifecycle-aware Data Import target discovery instead of static Host
  registration;
- it forced generic row-dynamic qualifier discovery/effective compilation;
- it proved Item identity, extensions, import, projection, Responsibility, Eidos and
  Agent composition;
- it survived real Open Food Facts data and standards pressure without forcing GTIN,
  Product, SKU, variant, brand or category into Item identity;
- it exposed a real batch-persistence performance issue and corrected it without
  weakening identity/archive invariants.

Recommendation: **close IT-01 after PR #538 is merged and production deployment
passes; activate WH-01 Warehouse/Location third-object proof.**
