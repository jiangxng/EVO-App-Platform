# TR-01A3 — Governed Derived Purchase Operational Read (candidate)

**Date:** 2026-10-10  
**State:** PR candidate only; do not mark TR-01A acceptance #6 closed.  
**Authority:** `docs/roadmap/TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md` and `project.status.json`.

## Why this small gate exists

Counterparty / Item / Warehouse object proofs and TR-01A1/A2 immutable
purchase/receipt/reversal economics are already CI- and production-certified.
TR-01A acceptance #6 still requires a shared governed Human/Agent/Workbench
operational view. Master-data projections are not an Inventory Position source.

This step introduces one **application-owned read-only contract**:
`apps/trading-reference/operational-projection.ts`.

- All Work comes from public EVO `GET /api/v1/work-items`.
- Pending Purchase, Inventory Position (quantity **and cost**), and Payable
  come from public EVO dimension-filtered `/api/v1/ledgers/{code}/balances`.
- A single view is consumable by both Human and Agent principals. It holds no
  authoritative balance, event, ledger entry, or second Work state.
- It is scoped to an explicit enterprise, PO, supplier, Item and Warehouse,
  with matching active Enterprise Context, scope, and a mandatory
  `authorization.check` decision before **any** EVO call.
- Deny, missing Provider, unresolved policy obligations, incomplete pages,
  duplicate/wrong-dimensional balances or contradictory positive balance
  without matching Work all fail closed.
- No permanent Applications navigation or new Eidos UI is added by this PR.

## Verification

`tests/protocol/tr01-purchase-operational-projection.test.mjs` exercises
Human/AI identity equivalence, reversal Work re-opening, scoping,
missing/denying policy, incomplete work pages and duplicate ledger rows.

`tools/certify-tr01-purchase-evo-postgres.mjs` additionally executes the
same read projection from public EVO HTTP APIs in real PostgreSQL CI after
a full Receipt reversal. It verifies RECEIVE + PAY, restored pending quantity,
zero inventory quantity/cost and unchanged payable for **both** principal
types. Its scoped policy is **a certification fixture only**, not a production
authorization-policy installation.

## Remaining before TR-01A closes

1. Bind the projection service and operation through an admitted first-party
   Application Package/Feature with explicit authorization policy and
   lifecycle; authenticate Principal/Enterprise Context in the Host.
2. Offer the same governed operation through Agent capability discovery,
   Human Eidos Experience and optional BI Workbench contribution, without
   creating duplicate read implementations or persistent navigation solely
   because a route exists.
3. Test real end-to-end Human/Agent/Workbench functional UX and evidence
   of authorized/unauthorized reads, plus CI/production deployment.
4. Explicitly keep full single-Receipt reversal proof separate from
   generalized partial/multiple reversal, over-reversal and concurrency UX.

Do not reopen IT-01 or WH-01, start TR-01B, create a Cash Account object or
change EVO Ledger/Balance authority just to complete this slice. The official
snapshot stays unchanged until subsequent accepted evidence justifies it.
