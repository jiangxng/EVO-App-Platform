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
