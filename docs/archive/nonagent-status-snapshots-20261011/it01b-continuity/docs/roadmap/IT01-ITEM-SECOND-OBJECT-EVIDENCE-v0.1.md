# IT-01 Item/Product Second-Object Evidence v0.1

**Status:** IT-01A + IT-01B MERGED_CI_PRODUCTION_PASS / IT-01C ACTIVE  
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

Status: **IMPLEMENTED / CI PENDING**.

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
