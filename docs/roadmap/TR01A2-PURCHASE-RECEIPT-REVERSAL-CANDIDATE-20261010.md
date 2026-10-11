# TR-01A2 Purchase Receipt Reversal — Implementation Candidate (2026-10-10)

**Document class:** HISTORICAL_SNAPSHOT / implementation candidate evidence (not authoritative current status)  
**Status:** CANDIDATE_CI_PENDING — NOT MERGED, NOT PRODUCTION-CLOSED  
**Current authority:** `project.status.json` and `docs/roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md`

## Verified prerequisites

- App Platform PR #551 merged at `a191b1acac1a142d4c71ac31bc388ef7ec4bfde3` and deployed Railway `b1d141c6-858d-4ee3-8422-0efbe7147396` SUCCESS.
- EVO PR #103 atomically persists direct BusinessData `FULFILLS` relation.
- EVO PR #104 exposes dimension-filtered CURRENT LedgerBalance reads.
- EVO PR #105 merged at `2311022640aa108a6baf3db44d9b26bd3e3ad623`, with public `REVERSES` relation, `PURCHASE_RECEIPT_REVERSAL` rules, and isolated full-replay certification.
- The EVO runtime owns BusinessData/Posting/Ledger/Balance/Work; App Platform only composes master-reference-resolved business intent.

## Candidate App Platform composition

`createPurchaseReferenceServiceV010.reversePurchaseReceipt` appends a new
`goods_receipt.reversed` BusinessData fact with the existing
`inventory_movement` ApplicationAnchor.

```text
Purchase Order fact (unchanged)
  └── FULFILLS → Goods Receipt fact (unchanged)
                       └── REVERSES → new receipt reversal fact
```

- Stable supplier, Item and Warehouse IDs are resolved by the same existing master-data repositories and role checks as the positive loop.
- The reversal includes the originating `receiptBusinessDataId` in both `causationId` and an explicit `REVERSES` relation. EVO validates the referenced fact's enterprise scope and persists the relation atomically.
- It carries `originalReceiptNo`, `reversalNo`, `orderNo`, positive `quantity` and nonnegative original `totalCost` in the new immutable occurrence.
- Caller-provided economic values are source-fact-sensitive. This bounded reference proof uses the known Goods Receipt output and original 10-unit / 125-cost values. A future generalized production correction UX must read and verify the immutable originating receipt/remaining reversible quantity against an authoritative public query contract rather than trusting freeform user cost fields.
- The service does not issue any direct LedgerEntry/Balance/Work mutations or create a new transaction authority.

## Acceptance evidence required before closure

1. Unit test: three submissions (PO, receipt, reversal); prior submissions unchanged, distinct reversal ID, `REVERSES` links to original receipt ID, expected dimensions/movement type; invalid identities, quantities and negative cost rejected before submission.
2. App Platform → EVO PostgreSQL HTTP integration: after receipt reversal, `pending_purchase` returns to +10, `inventory` goes to quantity/amount 0, `payable` remains +125, RECEIVE work reopens and PAY stays open. Uses only public BusinessData, LedgerBalance, Work and Runtime Observation APIs.
3. EVO replay authority: certified EVO main PR #105 `validate:tr01-purchase-receipt-reversal` proves the immutable facts and links survive full replay with identical economic digest, balances and Work.
4. Platform CI, Project Continuity CI, Cross Project CI PostgreSQL all PASS on the exact App Platform implementation head.
5. PR merged and Railway deployment SUCCESS for the exact merged App Platform main before recording `MERGED_CI_PRODUCTION_PASS` and closing TR-01A2.

## Explicit scope exclusions

- No mutation or deletion of original PO or Goods Receipt.
- No App Platform-owned Inventory Position, Payable balance, WorkItem, PostingRule or ledger table.
- No Payment/Settlement, sales loop, ERP procurement interface, or new Foundation Object.
- No claim that general partial reversal aggregation, concurrent over-reversal prevention or read-back of original cost is product-complete; the current reference proof is full reversal of one known receipt.
- No changes to parallel 2D Designer branches, IT-01 or Warehouse assets.

**Next decision after CI:** only record A2 as completed with merged + production evidence; otherwise preserve CANDIDATE/OPEN. TR-01B remains blocked.
