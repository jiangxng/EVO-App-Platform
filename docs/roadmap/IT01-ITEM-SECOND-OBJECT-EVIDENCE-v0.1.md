# IT-01 Item/Product Second-Object Evidence v0.1

**Status:** IT-01A + IT-01B + IT-01C + IT-01D MERGED_CI_PRODUCTION_PASS / IT-01E ACTIVE  
**Date:** 2026-10-09  
**Authority:** `docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md`

## Purpose

IT-01 exists to prove that Foundation Object architecture is not a Counterparty
framework with generic names.

The first Item slice therefore does two things together:

1. introduces a materially different second Foundation Object schema;
2. removes the need for new objects to model applicability through
   Counterparty relationship roles.

## Initial semantic boundary

The first stable Item identity is deliberately small:

- `itemId` — internal durable identity;
- `code` — enterprise-stable Item code;
- `displayName` — Human-facing name;
- `itemKind` — `GOODS` or `SERVICE`;
- `baseUomCode` — canonical quantity unit code;
- `description` — optional descriptive text.

This does **not** yet decide that Product, SKU, variant, barcode/GTIN or category are
fields of the same identity.

That restraint is intentional.

GS1 defines GTIN as the identifier of a trade item that may be priced, ordered or
invoiced, and materially different trade items receive different GTINs. Therefore a
GTIN must not be placed on a future Product/template identity before the Item/variant
boundary is proven.

UN/CEFACT Recommendation 20 provides governed unit-of-measure codes for international
trade. IT-01 begins with a semantic `baseUomCode` field and defers the governed code
catalog/validation mechanism to a bounded later slice.

References:

- GS1 GTIN overview: https://support.gs1.org/support/solutions/articles/43000734404-what-is-the-global-trade-item-number-gtin-
- UN/CEFACT Recommendation 20: https://unece.org/trade/documents/2021/06/uncefact-rec20-0
- Open Food Facts will be used as a later real-world Item pressure corpus.

## Anti-overfit finding

The Counterparty-first shared schema exposed this generic contract:

```text
FoundationObjectFieldApplicabilityV010.relationshipRoles
CompileEffectiveObjectSchemaInputV010.activeRelationshipRoles
```

Those names are valid Counterparty semantics but are not a valid universal
Foundation Object model.

IT-01A adds an object-neutral qualifier model:

```text
applicability.qualifiers = {
  "<semantic-dimension>": ["<allowed-value>", ...]
}

activeQualifiers = {
  "<semantic-dimension>": ["<active-value>", ...]
}
```

Semantics:

- OR within values of one dimension;
- AND across different dimensions;
- dimension names are normalized case-insensitively;
- values are normalized as semantic codes;
- `relationshipRoles` remains only as v0.1 Counterparty compatibility debt;
- new Foundation Objects must not add another object-specific applicability key.

## Item proof

The first Item descriptor uses:

```text
objectType = item.subject
ownerPackageId = evo-item
schemaRef = evo.item/0.1.0
```

Extension slots:

- `item.identity`
- `item.trade-profile`
- `item.inventory-profile`

The proof extension `shelfLifeDays` is applicable only when:

```json
{
  "item.kind": ["GOODS"]
}
```

It must be absent for `SERVICE`.

This is intentionally different from Counterparty CUSTOMER/SUPPLIER relationship-role
semantics and therefore acts as the first anti-overfit test.

## Compatibility rule

Existing Counterparty `relationshipRoles` behavior must remain unchanged during the
transition. IT-01 may later migrate Counterparty definitions to generic qualifiers,
but it must do so explicitly with compatibility evidence rather than silently changing
persisted Enterprise Context definitions.

## Next slices

After IT-01A CI passes:

1. IT-01B — Item Enterprise Context repository + deterministic identity lifecycle;
2. IT-01C — generic Data Import reuse with an Item target;
3. IT-01D — Item projections/responsibility + governed Eidos experience;
4. IT-01E — real-world Open Food Facts RVC and Product/SKU/variant/GTIN boundary pressure;
5. contract maturity review — decide whether the shared Foundation Object contracts
   can move from EXPERIMENTAL toward STABLE.

Do not stabilize contracts merely because IT-01A compiles.


## IT-01A production evidence

- implementation PR: #522
- main merge commit: `d9ad7b6cb194096f04aa58979af27e0af99d157d`
- Platform CI: PASS
- Project Continuity CI: PASS
- Railway deployment: `3aa0e5fb-139a-492f-be63-41b1b9255c9b` — SUCCESS

IT-01A is closed. IT-01B is the active slice and will add Enterprise Context-backed
Item identity persistence before Data Import/package/UI expansion.


## IT-01B — Enterprise Context identity repository

Status: **MERGED_CI_PRODUCTION_PASS**.

The Item repository persists `item.subject` through the same Enterprise Resource
contract used by the first Foundation Object, while deliberately avoiding a hidden
Item-specific lifecycle framework.

Identity/lifecycle rules:

- `itemId` is the durable resource identity;
- Item code is unique case-insensitively within one Enterprise Context;
- the same code may exist independently in another Enterprise Context;
- ACTIVE / ARCHIVED is owned by the Enterprise Resource lifecycle, not duplicated
  as an Item payload `status` field;
- ordinary `save` cannot silently reactivate an archived Item;
- an archived Item code cannot be silently reused for a different Item identity;
- archive preserves payload and audit timestamps rather than deleting the resource.

Evidence:

- `apps/item/repository.ts`
- `tests/protocol/it01-item-repository.test.mjs`

IT-01B still does not introduce Product/SKU/variant/GTIN/category semantics.


## IT-01B production evidence

- implementation PR: #524
- main merge commit: `7dbe34f706fdf4dd27d60997127cc5766002b1de`
- Platform CI: PASS
- Project Continuity CI: PASS
- Railway deployment: `d2d85a7f-3987-4f49-8bf5-de9a3c6e9d58` — SUCCESS

IT-01B is closed. IT-01C is the active slice and must prove generic Data Import as a
real second-object capability rather than creating an Item-specific import subsystem.


## IT-01C — Generic Data Import second-object proof

Status: **MERGED_CI_PRODUCTION_PASS**.

IT-01C removes another Counterparty-first leak from shared Foundation Object contracts:
`FoundationObjectImportTargetParametersV010` is now an object-neutral parameter bag.
Counterparty still interprets its own `relationshipMode` /
`relationshipRoles` compatibility values inside the Counterparty target; the shared
contract no longer names them.

The previously Counterparty-local import cell normalization logic is also now shared
through `foundation/import-values.ts`, and both Counterparty and Item consume it.

Item uses the existing generic Data Import service:

```text
stage -> dry-run -> schema digest -> atomic batch commit -> receipt
```

The Item target proves:

- deterministic mapping over Item core fields plus unconditional Enterprise Extensions;
- case-insensitive batch dedupe before business writes;
- schema-drift rejection between dry-run and commit;
- atomic rollback when extension-value persistence fails;
- extension provenance retained as IMPORT + importJobId;
- deterministic imported Item identities.

### Deliberate current limitation

The current Data Import target contract resolves one `EffectiveObjectSchema` per import
job. Therefore an extension whose applicability depends on a row value such as
`item.kind = GOODS` is **not** exposed by the Item import target unless the job itself
has an active qualifier context.

IT-01C does not pretend row-dynamic qualifier schemas are solved. The current proof
uses an unconditional Item extension for real second-object extension import and keeps
row-dynamic qualifier resolution as a later bounded design problem.

Evidence:

- `foundation/import-values.ts`
- `apps/item/import-target.ts`
- `tests/protocol/it01-item-data-import.test.mjs`


## IT-01C production evidence

- implementation PR: #528
- main merge commit: `8639fc0914e33d4040b92a1541679557f97c9cee`
- Platform CI: PASS
- Project Continuity CI: PASS
- Railway deployment: `f4e56280-cfae-4012-bc8a-ed4e48d77ec6` — SUCCESS

IT-01C is closed. IT-01D is the active slice and must prove Item through the existing
Projection, Responsibility, Eidos Experience and Workbench Contribution boundaries
without creating a parallel Item authority or moving Workspace ownership.


## IT-01D — Projection, Responsibility and Eidos product slice

Status: **MERGED_CI_PRODUCTION_PASS**.

IT-01D makes Item a real governed application surface without creating a parallel
business-data authority or moving Workspace ownership into Item.

### Responsibility semantic

The second-object responsibility is:

```text
ITEM_STEWARD
```

It means responsibility for maintaining/governing the Item master identity.

It does **not** mean:

- sales ownership;
- procurement ownership;
- inventory ownership;
- authorization to read the Item;
- ownership of Workspace / Personal Workbench.

Responsibility and authorization remain separate. A normal Item directory projection
is authorization-filtered independently of stewardship. `My Items` is then a further
derived filter over authorized Items with active `ITEM_STEWARD` responsibility for
the current principal.

### Derived projection authority

`ItemProjectionServiceV010` derives one read model from:

- authoritative Item identity;
- shared Responsibility assignments;
- Enterprise Object Extension values;
- Authorization Provider decisions.

No `evo.item-projection` resources are persisted. Projection output is derived and
regenerable.

The same service is consumed by:

- Human Eidos pages;
- Personal Agent / Automation capability operations.

### Eidos experience

The Item package contributes:

- Items directory;
- My Items;
- New Item;
- Item detail;
- Item edit;
- Workbench `My Items` contribution.

Create/Edit forms are generated from `EffectiveObjectSchema` instead of defining a
parallel Item form schema.

Workbench remains owned by `evo-bi-workbench`; Item contributes only governed content.

### Install/use-driven loading

The Host knows only lightweight Item package/constants/authorization metadata at
startup.

Item repository, projection service, pages and action implementations are resolved
only when the Item feature is active and used. Deactivation/uninstall clears the lazy
runtime reference.

The package is added to Catalog but is not force-installed by IT-01D.

### Second-object platform finding: Data Import target lifecycle

IT-01C proved `createItemImportTargetV010` against the generic Data Import service,
but the current Host has no lifecycle-aware import-target contribution/registry.
Counterparty's historical target is statically registered in Host.

IT-01D deliberately does **not** copy that static registration for Item because doing
so would expose an Item import target even when the Item package is not installed or
active, violating the install/use-driven loading rule established by PR #509.

Therefore:

- Item import contract/runtime proof remains valid;
- Item import is not yet exposed through Host Data Import UI;
- a lifecycle-aware import-target registry/contribution is now explicit platform debt
  revealed by the second object;
- this gap must be resolved before Item import is declared product-reachable.

### Evidence

- `apps/item/projections.ts`
- `apps/item/access.ts`
- `apps/item/projection-service.ts`
- `apps/item/projection-actions.ts`
- `apps/item/actions.ts`
- `apps/item/page.ts`
- `apps/item/capability-manifest.ts`
- `apps/item/package.ts`
- `tests/protocol/it01-item-projection-eidos.test.mjs`
- lifecycle-gated Host wiring in `manager/server.ts`


## IT-01D production evidence

- implementation PR: #530
- main merge commit: `ea3594f06625803883b7fd6dddcc878feb8bdc99`
- combined CI: 34/34 PASS
- Platform CI: PASS
- Project Continuity CI: PASS
- Cross Project Trading Lite / Eidos Browser / EVO CI: PASS
- Railway deployment: `bb543f4b-fb43-4d4e-a515-c83eb46ff992` — SUCCESS

IT-01D is closed. IT-01E is active.

IT-01E must now use real-world Item/product evidence to pressure the semantics that were
deliberately left open: Product, SKU, variant, GTIN/barcode, UOM and category. It must
also decide how to handle the lifecycle-aware Data Import target registry debt and the
row-dynamic qualifier import limitation before Foundation Object contracts are reviewed
for maturity.


## IT-01E platform finding resolution — lifecycle-aware Data Import targets

Status: **IMPLEMENTED / CI PENDING**.

IT-01D found that Host Data Import target discovery was static:

```text
Host startup -> construct Counterparty target -> dataImportTargets[]
```

That model could not expose Item import without also making an inactive or
uninstalled Item implementation visible to Data Import. It conflicted with PR #509:

```text
Discover metadata cheaply.
Load implementation only when lifecycle and use require it.
```

IT-01E introduces `platform.data-import-target` as a lightweight Package/Feature
contribution.

The AppManager returns only contributions whose owning features are currently active.
The contribution carries only:

- target identity;
- object type;
- localized display metadata;
- a Host factory binding reference.

The Host resolves the implementation only when Data Import is actually opened or
invoked. Counterparty and Item target factories are dynamically imported at that
point. An inactive target disappears immediately from discovery and Data Import
fails closed for staged jobs whose owning target is no longer active.

This deliberately does **not** turn target implementations into Host startup
dependencies and does not statically register Item merely to make it visible.

Evidence:

- `contracts/package.ts` — `platform.data-import-target` contribution contract;
- `manager/service.ts` — lifecycle-filtered effective target discovery;
- `manager/server.ts` — use-time lazy factory resolution;
- `apps/counterparty/package.ts` / `apps/item/package.ts` — target declarations;
- `apps/data-import/service.ts` — current-lifecycle target resolution support;
- `tests/manager/core-manager.test.mjs` — enable/disable target visibility;
- `tests/protocol/data-import-target-lifecycle.test.mjs` — fail-closed target removal.

This resolves the IT-01D `lifecycle-aware-import-target-registry` platform debt.

Production closure: PR #532 merged at `07ae77f1f9f94b9860b29c20f858bd059b23c502`; 35/35 CI passed and Railway deployment `c7ac359b-3fe7-4a5c-b258-9fb7e3baa01d` reached SUCCESS.


## IT-01E platform finding resolution — row-dynamic qualifier-aware import

Status: **IMPLEMENTED / CI PENDING**.

IT-01C intentionally exposed a second-object limitation: the Data Import job schema
was compiled before any row existed, so fields whose applicability depended on
`item.kind` could not participate in mapping for a mixed GOODS/SERVICE file.

The resolution is object-neutral and has two schema modes:

```text
EFFECTIVE
= apply the active qualifier/role context and return fields that are actually valid now

DISCOVERY
= retain conditionally-applicable governed fields so mapping/discovery can see
  every possible field before row context exists
```

The shared Foundation Object compiler owns these modes. It does not know
`itemKind`, GOODS or SERVICE.

Item owns the row semantic:

1. Item target `describe()` returns DISCOVERY schema for mapping.
2. Each row normalizes its own `itemKind`.
3. Item recompiles an EFFECTIVE schema for that row.
4. A conditionally-applicable mapped field:
   - is accepted and normalized when applicable;
   - is ignored when not applicable and blank;
   - fails closed with `DATA_IMPORT_FIELD_NOT_APPLICABLE` when nonblank.

This allows one import job to contain GOODS and SERVICE rows without making
GOODS-only enterprise extensions globally visible as writable Item fields.

Evidence:

- `foundation/schema-compiler/index.ts`
- `apps/item/foundation-object.ts`
- `apps/item/import-target.ts`
- `tests/protocol/it01-item-data-import.test.mjs`

The same DISCOVERY/EFFECTIVE mechanism is available to future Foundation Objects.
No Item-specific qualifier key is added to the shared Data Import or Foundation
Object contracts.

Production closure: PR #534 merged at `9d4475ac18e2457e46d7b596f9a3e87d0e5db4ac`; Platform CI and Project Continuity CI passed and Railway deployment `b16708e5-b17b-4151-99d1-4803880880b3` reached SUCCESS.


## IT-01E real-world RVC — Open Food Facts + standards

Status: **REAL_DATA_CI_PASS / MERGE_PENDING**.

### Source strategy

IT-01E uses the verified Open Food Facts organization dataset:

- dataset: `openfoodfacts/product-database`;
- current source is resolved to a concrete Hugging Face dataset snapshot SHA at CI time;
- RVC reads only selected columns from the Parquet source using range/column access;
- 20,000 rows with non-empty source `code` are retained as an ephemeral CI sample;
- raw source rows are neither committed to Git nor uploaded as evidence artifacts;
- only a manifest, sample SHA-256 and derived RVC report are retained.

Open Food Facts documents its exported `code` as the product barcode field; it may
contain EAN-13 values, store-internal codes, and Open Food Facts-assigned identifiers
for products without a barcode. This is exactly why source `code` is pressure
evidence rather than an EVO Item identity rule.

Source references:

- Open Food Facts verified dataset:
  https://huggingface.co/datasets/openfoodfacts/product-database
- Open Food Facts exported data fields:
  https://github.com/openfoodfacts/openfoodfacts-server/blob/main/html/data-fields.txt
- GS1 GTIN definition:
  https://support.gs1.org/support/solutions/articles/43000734404-what-is-the-global-trade-item-number-gtin-
- UN/CEFACT Recommendation 20:
  https://unece.org/trade/documents/2021/06/uncefact-rec20-0

### Two-layer RVC

The evidence intentionally separates raw external semantics from EVO adaptation.

**Layer 1 — raw semantic pressure**

The analyzer measures:

- source code numeric/non-numeric shapes;
- GTIN-8/12/13/14 shape candidates and actual GS1 check-digit validity;
- repeated external codes and repeated display-name candidates;
- missing product names, quantity, brand, category and country evidence;
- common package quantity unit tokens;
- the subset of observed quantity units with explicit UN/CEFACT Rec20 mappings.

**Layer 2 — generic EVO import pressure**

Up to 1,000 unique source records with a usable product name are adapted into an
ephemeral Enterprise Context and committed through the existing generic Item Data
Import path.

The adapter is intentionally explicit:

```text
enterprise Item code
= deterministic RVC-only surrogate
!= Open Food Facts code / GTIN

itemKind
= GOODS

baseUomCode
= C62 ("one") only as an RVC pipeline assumption:
  one external product record is treated as one operational unit

Open Food Facts code
= preserved as external trade-item identifier evidence
  in item.trade-profile Enterprise Extension values
```

Package quantity text, source brands and source categories are also preserved as
external evidence extensions rather than promoted into core Item identity.

### Semantic decision rules before seeing the results

IT-01E will not treat a passing pipeline as proof that source fields belong in the
core Item identity.

The maturity review must preserve these distinctions unless real evidence disproves
them:

1. **Enterprise Item identity** — durable identity chosen by the enterprise.
2. **External trade-item identifier** — scheme + value evidence such as GTIN/barcode,
   separate from `itemId` and enterprise Item code.
3. **Product / variant / SKU** — optional enterprise/business relationships whose
   exact meaning must not be inferred from an external product database.
4. **Category** — governed classification/taxonomy relation, potentially many-to-many,
   not a scalar identity field.
5. **Base UOM** — enterprise operational quantity unit referencing governed codes;
   external package quantity is separate measure evidence.

GS1 defines GTIN as identifying a trade item that can be priced, ordered or invoiced,
with different trade items receiving separate GTINs. That supports a trade-item
identifier layer, not a universal EVO Item primary-key rule.

UN/CEFACT Rec20 provides governed unit codes such as `GRM` (gram), `KGM`
(kilogram), `MLT` (millilitre), `LTR` (litre) and `C62` (one/unit). The RVC
records observed mappings but does not infer that a package label such as `400 g`
must become the enterprise Item's `baseUomCode`.

Evidence implementation:

- `tools/item-rvc-open-food-facts.mjs`
- `tests/protocol/it01-item-open-food-facts-rvc.test.mjs`
- `.github/workflows/it01-item-open-food-facts-rvc.yml`


### IT-01E real-world RVC result

Real-data CI is PASS. Durable evidence and the contract maturity recommendation are
retained in:

- `docs/roadmap/IT01-ITEM-RVC-EVIDENCE-2026-10-09.md`

Key observed result:

- 20,000 Open Food Facts records from snapshot
  `65ceac3fa350b90dc3abea5cddbaa2a2370e73de`;
- 19,984 valid GTIN check-digit candidates and 16 invalid candidates;
- 5,291 duplicate display-name candidates;
- 6,897 rows without package quantity;
- 1,000 / 1,000 adapted rows committed through generic Item Data Import;
- batch persistence improved the same 1,000-row workload from ~31 rows/sec to
  ~152 rows/sec without weakening archive/code-reservation invariants.

The maturity recommendation is **selected object-neutral contracts =>
STABLE_CANDIDATE**, while Item/Product/SKU/variant/trade-identifier/UOM/
classification semantics remain domain-owned and EXPERIMENTAL.


## IT-01 closure record

- final implementation / RVC PR: #538
- main merge commit: `139ad94c13909a1f47c73d081742a5a6a870eef5`
- Platform CI: PASS
- Project Continuity CI: PASS
- Open Food Facts real-data RVC workflow: PASS
- Railway deployment: `ca33d2da-7de7-483a-b584-1d71d38f84d1` — SUCCESS
- durable RVC evidence: `docs/roadmap/IT01-ITEM-RVC-EVIDENCE-2026-10-09.md`
- contract maturity: selected object-neutral contracts => **STABLE_CANDIDATE**
- next gate: **WH-01 Warehouse/Location third-object proof**

IT-01 is closed. Do not reopen Item domain semantics merely to make them look complete;
Product/SKU/variant/trade identifiers/UOM/classification remain domain-owned until
real business evidence requires their explicit models.
