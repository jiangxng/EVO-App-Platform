# App Platform → EVO BusinessData Transport v0.1

**Status:** CURRENT CROSS-PROJECT TRANSPORT BOUNDARY  
**Date:** 2026-10-03

## Boundary

App Platform owns the Host-side transport adapter. EVO owns the deterministic BusinessData submission runtime.

```text
Business App / governed Host action
  ↓
EvoBusinessDataAdapterV010
  ↓
POST /api/v1/business-data
  ↓
EVO BusinessDataSubmissionPortV010
  ↓
PostingRule(applicationId)
  ↓
LedgerEntry / LedgerBalance
```

## Exact application identity

The already-proven identity invariant remains unchanged:

```text
Application Runtime Binding.runtimeApplicationId
=== Host EvoBusinessDataSubmission.applicationId
=== EVO ApplicationAnchor.applicationId
=== EVO PostingRule.applicationId
```

The HTTP adapter does not transform, prefix, hash or reinterpret the value.

## Host contract

Public Host-side contract:

`contracts/evo-business-data.ts`

Reference HTTP implementation:

`manager/evo-business-data-http-adapter.ts`

The adapter owns only:

- endpoint configuration;
- JSON serialization;
- public response validation;
- public EVO error normalization.

It does not own:

- business payload semantics;
- Application lifecycle;
- capability discovery;
- actor/permission policy;
- PostingRule content;
- Ledger entry construction.

## Authority

Authorization and application semantics are resolved before this adapter is called.

The target EVO endpoint deliberately does not accept a caller-provided actor as business authority.

## Compatibility

The current Trading Lite `/capabilities + /commands` path remains in place until the next migration slice.

No compatibility route is removed by this change.

## SOP

SOP is unrelated to this boundary and remains separate and deferred.


## Trading Lite reference migration

Trading Lite is the first Business App migrated onto the generic Host adapter.

Ownership after migration:

```text
Trading Lite
  owns businessDataType / businessObjectKey / payload mapping

Host
  owns current enterprise Context
  owns EVO runtime scope resolution
  owns Application Runtime Binding resolution
  owns transport / errors / idempotency transport identity

EVO
  owns BusinessData acceptance
  owns applicationId routing
  owns PostingRule selection
  owns deterministic Posting / Ledger / Balance
```

Trading Lite no longer calls:

- `/api/v1/capabilities`;
- `/api/v1/commands`;
- `/api/v1/enterprises/:code`.

The Host may temporarily use the old enterprise lookup only as a scope-resolution compatibility adapter when no explicit `APP_PLATFORM_EVO_RUNTIME_SCOPE_MAP_JSON` entry exists. That compatibility is not visible to the Business App and is a separate retirement gate.

The Host Application reference is:

`application:trading-lite`

The target runtime provider identity is:

`evo-ledger-runtime`

For the reference sales-order flow, the default runtime applicationId is `sales_order`, configurable through `APP_PLATFORM_TRADING_LITE_EVO_APPLICATION_ID`. The resolved binding remains authoritative at runtime.


## Compatibility retirement audit — 2026-10-03

The generic write/read migration is now browser-certified.

Current App Platform runtime dependency state:

- `POST /api/v1/commands`: no active runtime caller;
- `GET /api/v1/capabilities`: no active runtime caller;
- `GET /api/v1/apps`: no active runtime caller;
- `GET /api/v1/enterprises/:code`: retained only as runtime-scope compatibility fallback.

The authoritative retirement gate is `EVO-COMPATIBILITY-RETIREMENT-AUDIT-v0.1.md`.
