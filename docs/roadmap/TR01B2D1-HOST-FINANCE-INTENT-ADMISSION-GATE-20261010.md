# TR-01B2D1 — Host-governed finance intent preflight, fail closed

**Date:** 2026-10-10  
**Status:** PR CANDIDATE, not an admitted production Finance capability or a full TR-01B2D acceptance.  
**Authority:** App Platform owns principal and Enterprise Context authorization. EVO's Cost/Valuation and Allocation plugin owners alone own verified historical financial facts, policy/rule versions and actual financial effects. EVO Core remains the deterministic runtime.

## Why this narrow slice

App Platform B1/B2A/B2B/B2C proved one scoped Sales→Production→Shipment→Cash sample, FIFO valued Inventory amount 0/COGS 125 and **formal** 1000 CNY single-source AllocationInstruction/Relation with deterministic full replay. However those write proofs executed *inside a disposable EVO owner CI runner*. EVO's compatibility `POST /api/v1/commands` accepts a caller-declared actor and its `/api/v1/demo/*` cost endpoints are not a trusted finance plugin execution boundary. It would be unsafe to connect a mutating Host/Agent finance operation to them.

## Implemented code

`apps/trading-reference/finance-intent-admission.ts` introduces a **pure Host-authorized, read-only preflight guard** and typed version-locked intents:

- **COST_VALUATION:** order/customer/item/warehouse/Shipment BusinessData identities; cost method, exact EVO posting sequence, explicit positive-version valuation policy, allocation policy and shipment valuation rule pins; stable idempotency intent key.
- **CASH_ALLOCATION:** same referenced master identities, exact immutable order BusinessData *source* and receipt BusinessData *consumer*, published allocation policy ID/version, positive two-decimal amount and ISO three-character currency; only `EXPLICIT_FULL` is admitted to this reference. Split/partial/multi-currency/overpayment are not claimed.
- Every request requires an active matching Host Enterprise Context and real principal, then a **server-resolved** Host→EVO enterprise binding (no `EVO_DEMO` compatibility fallback). It performs separate deny-by-default `AuthorizationProvider.check` calls on order, Customer, Item, Warehouse and Shipment or original Order/Receipt source facts. No attributes-only implicit authorizations; any denied resource or unresolved policy obligation fails before the owner port.
- `resolveOwnerPreflight()` is **optional and absent by default**. Unless an independently installed trusted EVO-owned read-only verifier exists, the guard **throws `TR01B2D_OWNER_PLUGIN_NOT_ADMITTED`** and never returns a readiness claim. The verifier contract must check real immutable source/consumer/published policy IDs; it receives a normalized Host-verified envelope and explicit enterprise ID.
- An exact owner attestation for another enterprise/order, non-verified status or any owner error rejects the request. A success result only indicates `OWNER_FACTS_VERIFIED_NO_EXECUTION`, always includes `executionAllowed:false`, and is **not a reusable execution token or a grant to post cost/settlement**.

`tests/protocol/tr01b-finance-intent-admission.test.mjs` covers HUMAN and AI envelope parity, scope mismatches, missing pins, invalid versions, amount/currency precision, malformed and partial settlement, separate reference grants, conditional obligations, missing owner plugin, missing Host→EVO mapping and wrong-tenant owner attestations.

## Explicit non-admissions and next exact acceptance

The guard has **no HTTP client, database connection, direct EVO internal import, private Core call, ledger write, runtime route, catalog registration, Action Host handler, Agent tool or Workbench entry**. App Platform does not provide a production Cost/Allocation feature simply because this guard is shipped in compiled code. The owner preflight is intentionally an **interface only** pending EVO plugin admission, not a mock cost result.

**TR-01B2D2 still OPEN:** EVO plugin-owned, authenticated and runtime-tenant scoped **read-only immutable-fact/pin verifier**, accepting only trusted Host delegation and reporting narrow business identity/version evidence; robust tests for forged callers, wrong tenant/pin/order/receipt and replay. Then EVO owner **mutating** Cost and formal Allocation operations with idempotency/approval/economic replay, wired through Host authorized operation lifecycle; no direct public `/demo` endpoint. Only after these gates should installation, Eidos Human/Agent/Workbench and financial-account needs be revisited.

EVO cross-owner [PR #106](https://github.com/jiangxng/EVO/pull/106) is a merged DESIGN review, not implementation. Do not modify target EVO minimal Core boundaries or parallel 2D Designer/Agent tasks. Do not update `project.status.json` to say TR-01B2D is done on this slice.
