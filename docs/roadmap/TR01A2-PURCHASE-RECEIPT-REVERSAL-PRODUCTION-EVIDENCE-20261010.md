# TR-01A2 — Immutable Purchase Receipt Reversal: Production Evidence (2026-10-10)

**Document class:** HISTORICAL_SNAPSHOT  
**Slice status:** **MERGED_CI_PRODUCTION_PASS** — bounded full Goods Receipt reversal only  
**Milestone status:** TR-01A remains open for governed Human/Agent/Workbench operational view acceptance  
**Authority:** `docs/roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md`

## Verified implementation and deployment

| Evidence | Exact result |
| --- | --- |
| App Platform implementation PR | [#557](https://github.com/jiangxng/EVO-App-Platform/pull/557) — merged |
| App Platform verified PR head | `646a7c0d75a9e88536c5ca71f4e7ea708ab83002` |
| App Platform main merge | `70c6aac34cd6fad931f7110442e9a0f01293ef44` |
| Project Continuity CI | PASS — run `38008286765` |
| Platform CI | PASS — run `38008286826` |
| Cross Project Trading Lite EVO PostgreSQL CI | PASS — run `38008286848` |
| Railway project | EVO Ledger Runtime MVP |
| Railway production service | Ledger Configurator |
| Railway deployment | `1ece6ea3-c124-4d65-9860-f14d88f959a9` — SUCCESS at exact main merge |
| Railway #557 implementation deployment | `1ece6ea3-c124-4d65-9860-f14d88f959a9` — SUCCESS (superseded by newer main deploy) |
| Replay CI hardening PR | [#559](https://github.com/jiangxng/EVO-App-Platform/pull/559) — merged at `5f4ff27bd3c4b42d6d5acd3cebab096588e18f5b` |
| #559 replay gate CI | Platform `38008484986`, Continuity `38008484991`, Cross Project EVO PostgreSQL `38008484982` — all PASS |
| Latest Railway production deployment | `11ee6c04-6845-474c-b56b-d8b7b84ea015` — SUCCESS at #559 main `5f4ff27bd3c4b42d6d5acd3cebab096588e18f5b` |
| EVO main | `2311022640aa108a6baf3db44d9b26bd3e3ad623` |
| EVO runtime authority | [PR #105](https://github.com/jiangxng/EVO/pull/105), merged; head `c1d5ff93f47fb5b15272885e10a5269165cb5504`, CI run `38006488638` PASS |

The cross-project PostgreSQL workflow pins the certified EVO main exactly. Passing workflow results are on the rebased App Platform head, not just an obsolete PR ancestor.

## What was submitted

Existing master-data owner repositories resolve active Supplier-role Counterparty, Item and Warehouse, retaining their stable IDs. App Platform submits Purchase Order and Goods Receipt through the existing generic EVO BusinessData HTTP adapter, then submits an additional **new** `goods_receipt.reversed` occurrence:

```text
unchanged Purchase Order BusinessData fact
  └── FULFILLS → unchanged Goods Receipt BusinessData fact
                       └── REVERSES → new reversal BusinessData fact
```

The reversal submits:

- `applicationId = inventory_movement`;
- `businessDataType = goods_receipt.reversed`;
- `movementType = PURCHASE_RECEIPT_REVERSAL`;
- `businessObjectKey = reversalNo` distinct from `originalReceiptNo`;
- `causationId = <original receipt BusinessData ID>`;
- `relation = { fromBusinessDataId: <original receipt BusinessData ID>, relationType: "REVERSES" }`;
- exact order/supplier/Item/warehouse identity dimensions, positive reversed quantity and original receipt cost.

The API validates source fact enterprise scope and atomically stores the relation with the new BusinessData, as proved by EVO PR #105. Neither the original PO nor the original Goods Receipt is edited or deleted. App Platform does not mutate EVO LedgerEntry, Balance, PostingRules, WorkItems or private database tables.

## Public PostgreSQL integration result

The independent cross-project CI starts PostgreSQL 18 and EVO API/worker, then invokes App Platform's composition service through its generic EVO HTTP adapter. Test code: `tools/certify-tr01-purchase-evo-postgres.mjs`. The proof uses public `POST /api/v1/business-data`, `GET /api/v1/ledgers/:ledgerCode/balances`, `GET /api/v1/work-items` and `POST /api/v1/runtime-observations/query`.

| After occurrence | Pending purchase quantity | Inventory quantity / amount | Payable amount | Derived Work |
| --- | ---: | ---: | ---: | --- |
| Purchase Order approved | +10 | unchanged | +125 | RECEIVE open; PAY open |
| Goods Receipt completed | 0 | +10 / +125 | +125 | RECEIVE closed; PAY open |
| Immutable full Receipt Reversal appended | +10 | 0 / 0 | +125 | RECEIVE reopened; PAY open |

Balances are read at exact order/supplier/Item/warehouse dimensions; the ledger-wide aggregate Runtime Observation is deliberately not misused as an order-level Position API.

App Platform unit tests additionally assert original submitted facts unchanged, distinct reversal identity, explicit `REVERSES` parent Goods Receipt, correct dimensions and validation failures before EVO submission.

## Replay evidence and ownership

EVO-owned `scripts/validate-tr01-purchase-receipt-reversal.ts` (merged PR #105) checks receipt reversal facts and BusinessData links before and after full replay, identical dimensional balances and Work states, and identical economic runtime digest. EVO's authority includes replay; App Platform consumes that public contract and does **not** reimplement replay, the ledger or Work.

The App Platform integration CI runs the economic purchase/receipt/reversal transaction through public EVO HTTP boundaries. The dedicated EVO replay CI runs against an isolated ledger state to avoid replaying a PostgreSQL dataset already mutated by App Platform's cross-project test.

## Explicit limits / next real gate

The certified case is a **full reversal of one known original Receipt**, 10 units and 125 cost. Neither this proof nor PR #105 establishes a product-ready generic correction engine for:

- multiple partial reversals and sums of previously reversed quantities;
- concurrent attempts to over-reverse;
- verification of originally booked quantity, cost and currency through an authoritative read-back API rather than caller-supplied data;
- Human/Agent/Workbench procurement experiences and their authorization-aware view composition.

The last point is an outstanding **existing TR-01A criterion 6**: shared governed operational projection/Workbench consumption has not been demonstrated by PR #551 or PR #557. Mainline proceeds to this bounded acceptance inventory and evidence, not directly to TR-01B. The project continuity status remains the ultimate CURRENT_STATUS authority.

## Non-interference

This production closure did not merge, edit or supersede IT-01 research PR #555 nor any concurrent 2D Designer PRs (#537, #547, #549, #550, #552, #553, #554). Item/GTIN/UOM/Product/SKU/category, inactive import target loading and Warehouse inventory ownership conclusions remain unchanged.

## Later accepted CI hardening before snapshot closure

While this closure was being prepared, parallel PR #559 merged **after** PR #557. It extends the *same* cross-project workflow with an explicit step executing the pinned EVO `validate:tr01-purchase-receipt-reversal` full Replay certification after the App Platform public HTTP economic assertions. This means the replay check is now an enforced recurring CI gate, not merely a separately trusted upstream certification. Its exact head `2ebaf57c596075d04193e7688d6e1f28d0be2ea4` passed Project Continuity, Platform and Cross Project CI, and Railway deployed resulting main `5f4ff27bd3c4b42d6d5acd3cebab096588e18f5b` at `11ee6c04-6845-474c-b56b-d8b7b84ea015` SUCCESS. PR #559 did not change transaction semantics or any mainline status files. The latest live production source is now #559's merge commit rather than #557's earlier merge.
