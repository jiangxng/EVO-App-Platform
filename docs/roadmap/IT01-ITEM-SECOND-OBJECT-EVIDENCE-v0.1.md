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
