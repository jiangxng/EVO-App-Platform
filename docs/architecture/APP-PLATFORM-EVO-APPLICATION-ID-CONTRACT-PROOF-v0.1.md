# App Platform ↔ EVO ApplicationId Contract Proof v0.1

**Status:** CURRENT CROSS-PROJECT CONTRACT PROOF  
**Date:** 2026-10-02

## Decision

The Application Runtime Binding Provider resolves a Host semantic Application reference into a runtime-specific application identity.

When the selected runtime is EVO Ledger Runtime:

```text
Host semantic Application ref
  ↓
enterprise.application-runtime-binding
  ↓
runtimeApplicationId
  ↓ exact identity, no transformation
EVO ApplicationAnchor.applicationId
```

There is no second EVO-facing Application id.

## Authority split

### EVO App Platform owns

- rich Host/Application semantics;
- package/feature lifecycle;
- provider discovery and lifecycle;
- Application Runtime Binding lifecycle;
- authorization/integration control plane.

### EVO Ledger Runtime owns

- minimal `ApplicationAnchor = applicationId`;
- BusinessData routing by exact `applicationId`;
- PostingRule selection by exact `applicationId`;
- deterministic posting/ledger/balance execution.

## Exact identity invariant

For an EVO-targeted resolved binding:

```text
binding.runtimeApplicationId === EVO BusinessDataSubmission.applicationId
binding.runtimeApplicationId === EVO ApplicationAnchor.applicationId
binding.runtimeApplicationId === EVO PostingRule.applicationId
```

The adapter MUST NOT:

- derive another id;
- prefix/suffix for EVO;
- hash the id;
- use EOG node ids;
- use App Platform package/feature ids;
- pass rich Application metadata into EVO for routing.

## Compatibility discriminator

The persisted v0.1 binding contract contains:

`runtimeKind = "EVO_APPLICATION_ANCHOR"`

This is a historical compatibility discriminator.

It does not make the generic Application Runtime Binding Provider an EOG-owned or EVO-private component. It indicates that the resolved `runtimeApplicationId` uses EVO's minimal ApplicationAnchor semantics.

Changing this persisted discriminator is a separate migration and is not required for the identity proof.

## Public bridge

`contracts/evo-ledger-runtime-application-id.ts`

The bridge performs one operation only:

```text
runtimeApplicationId -> applicationId
```

with byte-for-byte string identity.

## Cross-repository authority

EVO authority:

`docs/architecture/decisions/2026-09-24-minimal-application-routing-anchor-v0.1.md`

Canonical EVO invariant:

> Application identity is a Core routing key; Application lifecycle is not a Core responsibility.

App Platform must preserve this distinction.

## Current implementation scope

This slice proves the identity contract only.

It does not claim that EVO's target generic BusinessDataSubmission endpoint has completed its implementation convergence. Until that endpoint is production-ready, any compatibility transport remains explicitly an adapter and MUST preserve this exact `applicationId` identity.

## SOP

SOP is unrelated to this integration proof and remains deferred.
