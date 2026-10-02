# EOG Enterprise Context Definition Persistence v0.1

**Status:** FOUNDATION READY — RUNTIME CUTOVER NOT YET APPLIED  
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

The existing file/memory EOG semantic store remains a protected legacy migration
asset until runtime cutover is independently CI-proven.

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

## Next slice

Wire `EnterpriseOperatingGraphHostServiceV010` to the repository-backed
persistence adapter, migrate any legacy semantic snapshot before reads/writes,
and stop using the legacy EOG semantic store as authority for new operations.
