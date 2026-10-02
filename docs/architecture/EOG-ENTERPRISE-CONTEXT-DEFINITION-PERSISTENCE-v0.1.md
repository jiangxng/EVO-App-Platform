# EOG Enterprise Context Definition Persistence v0.1

**Status:** RUNTIME CUTOVER IMPLEMENTED — CI / PRODUCTION VERIFICATION GATE  
**Date:** 2026-10-02  
**Parent authority:** `EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`

## Decision

Enterprise Graph semantic truth is represented as an Enterprise Context Business Definition.

```text
Enterprise Context
└── enterprise.business-definition.repository
    └── kind = ENTERPRISE_OPERATING_GRAPH
        ├── immutable semantic revisions
        ├── Draft / Published lifecycle
        └── attribution / provenance
```

EOG 2D Designer owns the domain adapter that translates EOG semantics into the generic Enterprise Context Business Definition contract. Enterprise Context remains the persistence/lifecycle authority and contains no EOG-specific domain implementation.

## Definition mapping

Business Definition metadata owns:

- `enterpriseId`
- `definitionId == graphId`
- `revision`
- `state`
- creation / recorded timestamps
- publication timestamp and publisher attribution
- origin / migration provenance

The definition payload owns only EOG semantic content:

- graph contract version
- nodes
- Guidance relations
- Human-confirmed Enterprise relations

The payload intentionally excludes:

- 2D node positions;
- viewport / selection;
- 3D x/y/z presentation state;
- camera state;
- Runtime Facts;
- analytics overlays;
- SOP/Observatory provider calculations.

## Compatibility

The existing `EnterpriseOperatingGraphV010` remains the EOG domain contract.

A repository adapter translates between that contract and
`BusinessDefinitionRevisionV010` without changing graph IDs or semantic revision numbers.

The existing file EOG semantic store is now a protected migration source only. The Host runtime no longer constructs it as the authority for new semantic writes. In-memory legacy store support remains only for compatibility tests and isolated historical code paths.

## Legacy migration

A non-destructive migration imports the latest legacy EOG semantic snapshot into
Enterprise Context.

Because the historical EOG store retained only the latest materialized graph,
migration provenance records:

```text
origin.type = MIGRATED
origin.sourceRef = legacy:eog-semantic-store
historyComplete = (legacy revision == 0)
```

For already-published legacy graphs, the old store did not retain the original
publish actor. Migration therefore uses an explicit migration attribution marker
rather than inventing a Human identity.

The legacy source is not deleted by migration.

## Authority invariant

After runtime cutover:

```text
new EOG semantic writes
→ Enterprise Context Business Definition Repository

2D/3D View State
→ remains separate presentation persistence
```

No 2D/3D presentation change may create an Enterprise Business Definition revision.

## Runtime cutover

The Host startup sequence is now:

```text
legacy EOG semantic file (if present)
        ↓ non-destructive migration
Enterprise Context Business Definition Repository
        ↓ EOG domain adapter
EnterpriseOperatingGraphHostServiceV010
```

New EOG semantic create/revise/publish operations go only through the Business Definition Repository.

The legacy semantic file is not rewritten or deleted.

Human and Agent creation attribution is preserved at the Business Definition revision boundary. New publication still requires Human authority.

## Next gate

Deploy the cutover and verify production migration/startup evidence before any legacy semantic-store cleanup.
