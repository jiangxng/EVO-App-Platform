# EVO Compatibility Retirement Audit v0.1

**Status:** AUDITED — RETIREMENT GATES FROZEN  
**Date:** 2026-10-03  
**Scope:** EVO-App-Platform dependencies on EVO compatibility HTTP surfaces

## Result

The Trading Lite production/reference path no longer depends on EVO capability discovery or Command compatibility APIs.

Current target path:

```text
Host Enterprise Context
→ Application Runtime Binding
→ Host EVO runtime-scope mapping
→ POST /api/v1/business-data
→ EVO automatic Posting / Ledger / Balance
→ POST /api/v1/runtime-observations/query
→ App result
→ Eidos
```

## Compatibility surface classification

| EVO compatibility surface | Active App Platform runtime dependency | Retirement state |
| --- | --- | --- |
| `POST /api/v1/commands` | No | App Platform migration complete. EVO owns any later endpoint sunset. |
| `GET /api/v1/capabilities` | No | App Platform migration complete. EVO owns any later endpoint sunset. |
| `GET /api/v1/apps` | No | Not required by the current App Platform runtime path. |
| `GET /api/v1/enterprises/:enterpriseCode` | Yes, compatibility fallback | **Not retireable yet.** Replace remaining Host scope-resolution fallback first. |

## Remaining `/enterprises/:code` callers

The compatibility lookup is still used by:

1. App Platform runtime scope fallback in `manager/server.ts`;
2. EVO runtime revision bridge;
3. EVO Runtime Observatory provider;
4. cross-project certification utilities.

These are scope-resolution concerns, not Business App semantics.

## Frozen retirement rule

Do **not** remove an EVO compatibility endpoint merely because Trading Lite no longer calls it.

An endpoint can be considered for EVO-side removal only after:

1. all four project repositories have no required runtime caller;
2. App Platform has a governed replacement for the same responsibility;
3. cross-project certification no longer depends on the compatibility route;
4. EVO explicitly accepts the compatibility sunset as an EVO change.

## Next bounded slice

Remove the App Platform dependency on `GET /api/v1/enterprises/:enterpriseCode` from the normal governed path.

Preferred direction:

```text
Enterprise Context
→ explicit Host-owned EVO runtime-scope binding
→ scopeKey
```

The legacy enterprise-code lookup may remain only as an explicitly named compatibility/demo fallback until all remaining consumers migrate.

## Non-goals

This audit does not:

- delete EVO endpoints;
- move Enterprise ownership into EVO;
- add capability discovery back to App Platform;
- change Eidos;
- change SOP.
