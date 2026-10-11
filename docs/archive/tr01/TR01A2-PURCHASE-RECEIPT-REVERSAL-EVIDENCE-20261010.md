# TR-01A2 — Purchase Receipt Reversal App Platform Evidence v0.1

**Date:** 2026-10-10
**Status:** IMPLEMENTED_CANDIDATE / CI_AND_PRODUCTION_PENDING
**Mainline:** TR-01 Trading Reference Loop
**Parent authority:** `docs/roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md`
**Continuity closure coordination:** PR #556 is the independent TR-01A1 state / HANDOFF-LATEST change; do not duplicate or overwrite it.

## Reuse and verified upstream ownership

- App Platform PR #551 (merged, `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3`) proves the positive Purchase Order -> Goods Receipt loop. Project Continuity, Platform and Cross Project PostgreSQL CI succeeded on head `1de23c70e26c1c45653115ac6abc805d4f70f681`.
- EVO main `2311022640aa108a6baf3db44d9b26bd3e3ad623` includes merged PRs #103, #104 and #105.
- Read directly in EVO main: `modules/business-data/api/contracts.ts`, `apps/api/src/business-data-submission-route.ts`, `PUBLIC-API.md`, `scripts/validate-tr01-purchase-receipt-reversal.ts`. The public `POST /api/v1/business-data` contract supports an atomic `REVERSES` link from original Goods Receipt BusinessData to a new reversal fact; the EVO certification proves its independent Replay determinism. This is a direct source read, not an inference from a link list.
- Verified Railway deployment of App Platform main `a191b1ac`: `b1d141c6-858d-4ee3-8422-0efbe7147396`, SUCCESS. This is **A1 production evidence**, not A2 production evidence.

## Implemented candidate

The Application-owned `apps/trading-reference/purchase-loop.ts` adds `reversePurchaseReceipt` through the existing `EvoBusinessDataAdapterV010.submit`:

```text
original Purchase Order       (unchanged)
    | FULFILLS
original Goods Receipt        (unchanged)
    | REVERSES
new goods_receipt.reversed    (append-only)
    movementType = PURCHASE_RECEIPT_REVERSAL
    applicationId = inventory_movement
    causationId = original receipt BusinessData ID
    relation.fromBusinessDataId = original receipt BusinessData ID
    relation.relationType = REVERSES
    quantity = positive reversed quantity
    totalCost = nonnegative original cost reversal
```

EVO owns `pending_purchase`, `inventory`, `payable`, posting, Work and Replay. App Platform does **not** write any Ledger/Balance/Work table and never modifies the earlier Purchase Order or Goods Receipt. Stable Counterparty/Item/Warehouse IDs remain runtime dimensions. Code and display-name values are snapshots, not new master authority.

## CI proof staged in this PR

`tests/protocol/tr01-purchase-reference-loop.test.mjs`:

- original submitted PO/Receipt inputs remain byte-for-byte unchanged in the test adapter;
- third submission uses a distinct business fact key with correct `REVERSES` source ID, type, causation and purchase/receipt dimensions;
- missing source ID, reused reversal key, negative cost and nonpositive quantity reject before EVO submission.

`tools/certify-tr01-purchase-evo-postgres.mjs` extends the existing real public-HTTP/PostgreSQL proof to assert after full 10-unit/CNY 125 reversal:

| Public EVO current state | Expected |
| --- | --- |
| `pending_purchase` | 10 (RECEIVE reopened) |
| `inventory.quantity` | 0 |
| `inventory.amount` | 0 |
| `payable.amount` | 125 (PAY still open) |
| Purchase Order events | unchanged at exactly the original +1 |
| Receipt runtime application events | original Receipt + reversal, exactly +2 |
| inventory dimensions | identical before and after reversal |

The cross-project workflow checks out exact EVO main and runs the existing EVO `validate:tr01-purchase-receipt-reversal` certification, which separately checks canonical BusinessData facts, immutable relation rows, Work, balances and full Replay economic digest. The App Platform HTTP script does not query EVO SQL or private runtime internals.

**Do not call this passing until the A2 PR CI is actually SUCCESS.** A2 is not deployed as of this evidence draft. Do not mark TR-01A closed or start TR-01B without a separate verified continuity transition.

## Known bounds / following acceptance gates

- The current generic EVO submission contract verifies that the referenced BusinessData ID exists in the same enterprise and atomically writes a relation, but App Platform does not yet have a public fact-detail read that independently verifies the source is a `goods_receipt.received` fact and checks original receipt snapshots/remaining reversible quantity.
- This first certified path is a **full single-receipt reversal** with an explicit source ID and caller-supplied original receipt context. A general arbitrary/partial correction UI, over-reversal prevention across distinct idempotency keys, and archived-master-data reversal need separate governed source-fact read / remaining-quantity acceptance; do not assert these are production-safe.
- The real runtime proof is cross-project backend integration evidence, not an installation-first Eidos Human-facing procurement workflow. No new procurement UI has been introduced or implied.
- A2 closes only after actual CI and deployed code validation, including any additional public source-validation safeguards required for operational generalization.
- PR #555 Item RVC handoff and all open 2D Designer branches are independent and must not be modified or automatically merged.

## Sources and provenance

All referenced repository materials above were directly fetched from the named GitHub repository and commit on 2026-10-10. External IT-01 source statuses remain as classified in `docs/research/IT01-ITEM-RVC-REFERENCE-INDEX-20261010.md` on the unmerged #555 handoff branch. This A2 slice introduces no external data claims.
