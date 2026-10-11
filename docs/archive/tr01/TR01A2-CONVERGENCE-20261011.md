# TR-01A / Purchase-to-Receipt Reversal — functional branch convergence

Original source heads:
- `tr01/purchase-receipt-reversal-a2-20261010`: `b3163293f1bc203319d3a8bab9906b20d57bfda1`
- `tr01/purchase-receipt-reversal-app-20261010`: `81fcc46f4a3888b0107641c7bac5d58a3e19311b`

Modern `main` has already absorbed the actual `reversePurchaseReceipt` Application adapter behavior and its dedicated tests, including append-only new fact type `goods_receipt.reversed`, correct `REVERSES` lineage, missing source ID / duplicate key / negative cost / negative quantity rejection and preservation of old facts. The cross-project workflow is Git-blob identical to the original candidate. The current certification extends EVO public API HTTP replay, and EVO retains exclusive ledger/posting/FIFO/allocations ownership.

The original Oct 10 evidence writeup was absent from `main`. It is now copied verbatim to `docs/archive/tr01/TR01A2-PURCHASE-RECEIPT-REVERSAL-EVIDENCE-20261010.md` and should be read as **historical candidate evidence**, not a fresh 2026-10-11 production certification. New regression coverage guards current public contract and workflow retention. No business algorithm or Host Core changes.

Both original source commits are ancestors of this selective merge commit; do not restore the older `apps/trading-reference/purchase-loop.ts` or overwrite the stronger current tests.
