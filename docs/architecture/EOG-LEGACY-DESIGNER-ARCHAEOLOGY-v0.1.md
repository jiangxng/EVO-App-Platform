# EOG Legacy Designer Archaeology v0.1

**Status:** DESIGN EVIDENCE  
**Date:** 2026-09-28  
**Purpose:** Preserve the useful semantic and persistence lessons from the legacy Asloop business-process designer without copying its storage model into EOG.

## 1. Conclusion

The legacy implementation already separated two concerns that EOG must preserve more explicitly:

1. **diagram/editor persistence** — saved visual content, lists, configuration and thumbnail;
2. **business/accounting topology** — application/transaction nodes connected to accounting relations/accounts and navigated upstream/downstream.

EOG v0.1 should retain that separation but replace legacy XML/table coupling with:

```text
canonical semantic references
+ explicit semantic relations
+ separate position/layout state
```

The legacy schema is evidence and genealogy, not the new contract.

## 2. Editor persistence ancestor

Evidence:

- `roleplay-localize/roleplay-localize-provider/src/main/resources/db/migration/V1.0.0.201912131536__bizFlow_xing.sql`

The migration shows `business_group` carrying:

- `BUSINESS_GROUP_XML` — saved process/diagram body;
- `THUMBNAIL` — visual preview;
- `UNIQUE_ID` — stable front-end save/update key;
- `LISTS` — applications contained by the diagram;
- `CONFIG` — diagram-related configuration.

This is the direct ancestor of the EOG rule:

> layout/view persistence must be separable from enterprise semantic truth.

EOG must not keep a free-form XML blob as the authoritative enterprise model.

## 3. Explicit node-position ancestor

Evidence:

- `roleplay-gofu/src/main/java/com/refordom/roleplay/gofuit/core/bean/GlobalBusinessNode.java`

The legacy `global_business_node` model stores:

- `MODULE_ID`;
- `COLUMN_ANCHOR_POINT`;
- `ROW_ANCHOR_POINT`;
- `LIST_ID` / `LIST_KEY`;
- `NEXT_NODE`;
- `TYPE`;
- `STATUS`.

This confirms that node identity/business binding and node position were already distinct concerns.

EOG v0.1 therefore stores position as a separate record keyed by `nodeId`.

## 4. Application ↔ accounting/ledger topology ancestor

Evidence:

- `roleplay-gofu/src/main/java/com/refordom/roleplay/gofuit/core/dao/PulsationDiagramMapper.java`

The pulsation diagram queries expose nodes with:

- `trans_type`;
- `account_code`;
- `node_type`;
- `list_id`;
- group/sort information.

Upstream/downstream traversal is derived through `c_component`, `calc_rel`, `check_direction`, transaction type and account code.

The same mapper also distinguishes configured/related examples from the main relation path.

The architectural lesson is important:

> the visible business flow was not merely hand-drawn; it was informed by pre-existing transaction/accounting relationships.

This is the genealogy for EOG **Guidance Topology**.

It does **not** mean the old `c_component` / `calc_rel` schema should become the new graph schema.

## 5. EOG v0.1 mapping

```text
legacy editor body / coordinates
        ↓
EOG Position / view state

legacy List / application
        ↓
EOG Application semantic reference

legacy account / calc relation
        ↓
EOG Ledger semantic reference
+ guidance provenance from PostingRule/accounting templates

legacy inferred upstream/downstream relation
        ↓
EOG Guidance relation
        ↓ Human confirmation
EOG Enterprise relation
```

The new model must preserve the distinction:

```text
Guidance relation ≠ Enterprise-confirmed relation
```

A guidance relation may be shown by the editor, suggested by the LLM or materialized by the Agent, but it never becomes published enterprise truth without Human confirmation.

## 6. First executable contract boundary

The first executable EOG contract deliberately covers only:

- Application node binding;
- Ledger node binding;
- Application → Ledger guidance relation;
- Human-confirmed Application → Ledger enterprise relation;
- node Position;
- shared Human/Agent semantic operations;
- draft/published immutability.

Process, Transaction Type, Business Fact, PostingRule, Metadata, Capability/APQC and richer views remain canonical EOG concepts, but are added after this foundation proves the round-trip without creating a parallel ontology.

## 7. Anti-copy rule

Do not reproduce:

- `BUSINESS_GROUP_XML` as the semantic source of truth;
- comma/string encoded `NEXT_NODE` relationships;
- UI node type as business semantics;
- `c_component` or `calc_rel` as the EOG contract;
- diagram coordinates inside Application or Ledger definitions.

Reuse the lessons, not the legacy coupling.
