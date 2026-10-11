# TR-01B2D2 — EVO owner read-only immutable finance fact/pin validation on real App Platform sales

**Date:** 2026-10-10  
**Status:** BOUNDED OWNER-READ-ONLY PostgreSQL CI ACCEPTED; **not production Host delegation or finance mutation admission**.

## EVO-owned capability added first

EVO [PR #107](https://github.com/jiangxng/EVO/pull/107) completed its **27/27 CI** and merged as `d5ce051325c4572c7a5fd713560d7d7d06e4b401`. It added the read-only `PostgresTradingFinanceFactVerifierV010` within the compatible valuation/plugin owner module. It does not add an anonymous route, generic `/api/v1/commands` finance permission bypass, private API exposure, direct Ledger mutation, or change the minimal EVO Core target.

It checks the original persisted `sales_order.approved` order/customer/item/warehouse in the declared EVO enterprise. For COST it requires a matching `sales_shipment.created` immutable Shipment ID and POSTED input at the explicitly pinned sequence, a compatible published/active Cost valuation policy, allocation policy, and published Shipment valuation rule, each by **ID+version**. For CASH it requires matching source Order ID, consumer `cash.received` ID, source/receipt customer+order references, current posted state, same currency, positive exact full amount equal to both immutable order carrying and receipt amount, and an eligible published `EXPLICIT_ONLY` allocation policy. Partial/split/FX remain explicitly outside this bounded proof.

### App Platform cross-project integration certification

The existing `.github/workflows/cross-project-tr01b-sales-evo-postgres.yml` now pins the **exact accepted EVO PR #107 merge commit**. The original three proof stages remain, without substituting a fake order:

1. App Platform publishes one Sales Order, Production, Shipment and Cash Receipt to EVO **public BusinessData API**, with real Counterparty/Item/Warehouse references and original local carrying basis.
2. EVO-owned pinned FIFO calculation, valuation posting and canonical Full Replay verify Inventory quantity/amount=0, COGS=125, Receivable=0, Cash=1000.
3. EVO owner-runner records explicit formal `AllocationInstruction` and derived `AllocationRelation` consuming 1000 CNY from the original Sales Order with canonical Full Replay MATCH.
4. `tools/certify-tr01b2d2-owner-finance-fact-pin.mjs` calls the new EVO **read-only** verifier against **those same immutable BusinessData IDs and active published pins**. In disposable CI only, the actual B2D1 Host preflight is composed with an in-process verifier bridge to prove HUMAN/AI authorization-before-owner behavior. A denied Receipt policy stops before owner I/O. Invalid original customer/item/warehouse, wrong Shipment or Receipt ID, bad pin/version, wrong scope, amount, currency and sequence must fail.
5. Economic and replay input digests, CostRun IDs and AllocationInstruction IDs before/after must be unchanged. The verifier returns `executionAllowed:false` even when all facts are correct.

**Safety boundary:** this is an **in-process integration harness only**. It is NOT production trusted Host→EVO delegation and does not install or register cost or allocation write Capability Operations. App Platform production runtime does not import EVO's private verifier or private Cost/Allocation engines. B2D3 trusted transport/identity and execution-phase authorization plus later B2E Sales Human/Agent/Workbench remain separate. No new Bank/Cash/Financial Account object, no changes to parallel 2D Designer/Agent branches.

**Proof marker (only valid after passing real CI):** `TR01B2D2_OWNER_FINANCE_FACT_PIN_POSTGRESQL_PROOF`.

## Verified exact result — 2026-10-10

- EVO [PR #107](https://github.com/jiangxng/EVO/pull/107) merged as `d5ce051325c4572c7a5fd713560d7d7d06e4b401`; full owner CI [38019400183](https://github.com/jiangxng/EVO/actions/runs/38019400183) **27/27 jobs PASS**, including quality/typecheck/production artifact and all EEL/FAI certification gates.
- App Platform [PR #588](https://github.com/jiangxng/EVO-App-Platform/pull/588) merged as `3d5cc5a0793b3db990cde36564838d6097cc8d8f`. Pinned true EVO cross-project PostgreSQL [38019652795](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38019652795) **PASS**, emits `TR01B2D2_OWNER_FINANCE_FACT_PIN_POSTGRESQL_PROOF` with `status=PASS`; canonical Project Continuity [38019652821](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38019652821) **PASS**.
- Before the owner test, the **same** App Platform Sales/Production/Shipment/Customer Cash immutable source data (one order, one shipment, one receipt) survived FIFO Inventory→COGS valuation and formal 1000 CNY receipt AllocationInstruction/Relation canonical full replay. The new EVO verifier checks **those same immutable IDs**, active published Cost/Valuation/allocation/rule pins and posted sequence.
- Host B2D1 authorization checked separate order/Customer/Item/Warehouse and Shipment/Receipt resources for HUMAN and AI Principals in a **disposable CI in-process adapter only**. Denied Receipt blocked before the owner, and wrong tenant/customer/item/warehouse/order source/receipt/amount/currency/policy version/boundary were rejected by the actual owner database verifier.
- Canonical economic runtime digest and canonical immutable replay input digest stayed unchanged; no CostRun and no AllocationInstruction created by owner checks; `executionAllowed:false` even for a successful owner attestation.
- Railway exact main commit `3d5cc5a0793b3db990cde36564838d6097cc8d8f`, deployment `b64899d3-70d6-4df5-97ee-b1750109540c`: **SUCCESS**. Deployment does not install an EVO verifier over untrusted HTTP.
- **NEXT GATE:** trusted authenticated Host→EVO owner delegation, anti-forgery tenant/actor proof, installation lifecycle, and financial execution-phase revalidation and idempotency. Current owner interface is internal/direct **only**, not a production authenticated public verifier. Public Cost/Allocation write operations and Sales Eidos/Agent/Workbench remain **NOT CERTIFIED**.
