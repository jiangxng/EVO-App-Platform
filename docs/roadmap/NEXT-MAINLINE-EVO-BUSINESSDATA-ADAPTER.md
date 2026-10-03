# Next Mainline — Host-owned EVO BusinessData Adapter

**Status:** TRADING LITE HOST-ADAPTER MIGRATION IMPLEMENTED — DATABASE/BROWSER PROOF NEXT  
**Date:** 2026-09-28  
**Predecessor:** Personal Agent P1.8 — VERIFIED PRODUCTION PASS  
**Primary integration:** EVO App Platform + Eidos + EVO public runtime contracts

## 1. Why this is the next mainline

The previously approved Proof C continuation already established the next direction:

```text
Trading Lite
→ Host-owned generic EVO adapter
→ generic EVO BusinessData submission
→ Posting / Ledger / Balance runtime
→ public query/result projection
→ Eidos
```

The current Trading Lite integration is still a compatibility adapter that directly uses:

```text
GET  /api/v1/enterprises/:enterpriseCode
GET  /api/v1/capabilities?enterprise_id=...
POST /api/v1/commands
```

EVO `PUBLIC-API.md` now explicitly identifies those endpoints as Host/compatibility composition rather than the target minimal Core boundary.

## 2. Current EVO authority inspected

EVO repository:

```text
jiangxng/EVO
main inspected: 38799a38f455107a33ef68724b9a6fe7d8672852
authority: PUBLIC-API.md
```

The target BusinessData routing contract requires:

```text
scopeKey
applicationId
businessDataType
businessObjectKey
effectiveAt
payload
correlation/idempotency identity
```

PostingRule routing uses the same stable `applicationId`.

The exact target HTTP paths are intentionally not frozen yet.

## 3. Core boundary

The App Platform Host owns the integration adapter.

```text
Business App / Personal Agent
→ App Platform Action
→ Host EVO BusinessData Adapter
→ EVO public BusinessData contract
```

The Host adapter must remain business-semantic neutral.

It may own:

- EVO endpoint configuration;
- scope resolution;
- authenticated/authorized actor projection;
- application routing anchor resolution;
- correlation and idempotency identity;
- transport/error normalization;
- stable public read/query projection.

It must not own:

- Sales Order field semantics;
- Purchase/Production-specific business rules;
- PostingRule content;
- Ledger entry construction;
- EVO SQL/table access;
- EVO private module imports.

## 4. Application responsibility

A Business App owns its business payload mapping.

Example:

```text
Trading Lite create-order
→ businessDataType = SALES_ORDER
→ businessObjectKey = app-owned order identity
→ payload = Trading Lite business fields
→ applicationId = stable installed App routing anchor
```

Trading Lite supplies business meaning.

The Host supplies platform identity, authority, transport and generic EVO invocation.

## 5. Identity and authority

Apps must not forge EVO actor identity.

For an App Platform request:

```text
request/session Principal
→ Host authorization
→ Host-owned EVO actor/scope projection
```

The adapter must not accept a caller-provided actor object as authority.

Discovery is not authorization.

## 6. Idempotency

Every material submission must have a deterministic Host-visible idempotency identity.

Retry must return/recover the same accepted business operation rather than duplicate BusinessData.

For Agent-originated WRITEs, existing P1.5B Action Receipt remains the outer Agent execution evidence.

```text
Agent Action Receipt
≠ EVO business result

Action Receipt
→ proves Host tool execution

EVO result/readback
→ proves domain/runtime state
```

## 7. Compatibility migration

Do not remove the current Trading Lite compatibility path yet.

Migration order:

```text
1. define Host generic adapter contract
2. prove adapter against EVO public test double/current target contract
3. expose/match target EVO BusinessData public endpoint
4. database proof in EVO
5. migrate Trading Lite reference flow
6. add public read/query projection
7. browser proof in Eidos
8. only then retire compatibility /commands path
```

This is an architecture convergence, not a repository replacement.

## 8. First write proof

Reference business flow remains:

```text
Create Sales Order
→ generic BusinessData submission
→ EVO automatic posting ownership
→ durable execution identity
→ Posting status
```

A `QUEUED` posting status is a valid accepted state because EVO owns continuation automatically.

The App must not issue a second “start posting” call.

## 9. First read proof

The migration is not complete with write acceptance alone.

Add one stable public read/query projection that lets the App show authoritative EVO resulting state.

The first projection should be deliberately narrow and business-neutral enough to become a reusable Host boundary.

Candidate proof:

```text
submitted BusinessData identity
→ posting/result status
→ relevant resulting balance/work projection
→ stable Host result
→ Eidos rendering
```

Do not expose persistence rows as public contracts.

## 10. Application routing anchor

`applicationId` is the stable EVO routing anchor.

It is not an EVO-private ApplicationInstance database identity.

The App Platform may maintain richer Package/Feature/Application metadata, but it maps that world to the minimal EVO `applicationId` boundary.

A later contribution point may make the mapping declarative.

## 11. Initial implementation slices

### A — Host adapter contract

Define:

```text
EvoBusinessDataSubmissionV010
EvoBusinessDataSubmissionResultV010
EvoBusinessDataAdapterV010
```

with replaceable transport implementation.

### B — HTTP reference adapter

Implement an HTTP adapter only against a documented EVO public boundary.

No private EVO code dependency.

### C — Trading Lite migration

Replace direct EVO fetch logic in Trading Lite with the Host adapter.

Keep its field→payload mapping inside Trading Lite.

### D — Read/query result projection

Add the first stable Host read contract and Eidos presentation.

### E — compatibility retirement gate

Retire direct `/capabilities + /commands` only after database + browser proof.

## 12. Acceptance

The first mainline slice passes when:

1. Host owns a generic EVO BusinessData adapter contract.
2. Adapter inputs include the target EVO routing tuple.
3. Principal/authority comes from Host request state.
4. Apps cannot inject arbitrary actor authority.
5. Adapter does not import EVO private modules or tables.
6. Idempotent retry does not duplicate BusinessData.
7. Trading Lite business mapping remains Trading Lite-owned.
8. Existing compatibility path stays available.
9. Contract tests cover success, unavailable target, malformed response and idempotent retry semantics.
10. The design leaves the HTTP path replaceable until EVO freezes the target endpoint.

## 13. Non-goals for the first slice

Do not yet:

- implement every business App;
- move PostingRule lifecycle into Core;
- remove `/api/v1/commands`;
- expose raw Ledger/BusinessData database rows;
- hard-code Sales Order semantics in Host;
- freeze an HTTP path that EVO itself still labels unfrozen.

The purpose is to establish the correct ownership boundary first.


## 14. Current implementation convergence

EVO now exposes the target transport:

`POST /api/v1/business-data`

App Platform now has:

- `contracts/evo-business-data.ts`;
- `manager/evo-business-data-http-adapter.ts`;
- exact `runtimeApplicationId -> applicationId` protocol proof;
- malformed-response and public-error fail-closed tests;
- deterministic idempotency identity preservation across retry.

The next bounded slice migrates Trading Lite to consume the Host adapter while leaving the legacy command path available as compatibility evidence.


## 15. Trading Lite migration

Trading Lite now submits through `EvoBusinessDataAdapterV010` and no longer performs EVO capability discovery or Command invocation directly.

The App owns:

- `sales_order.approved` businessDataType;
- order identity;
- business payload mapping.

The Host owns:

- current Enterprise Context;
- runtime scope mapping;
- Application Runtime Binding resolution;
- exact `runtimeApplicationId -> applicationId`;
- EVO HTTP transport.

Next proof:

```text
Eidos Trading Lite
→ App Platform ActionHost
→ Host runtime target resolution
→ POST /api/v1/business-data
→ EVO PostgreSQL
→ PostingRule(applicationId=sales_order)
→ Ledger / Balance
→ readback / browser evidence
```
