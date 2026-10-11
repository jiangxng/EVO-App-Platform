# EVO Command Compatibility Usage Audit

**Status:** APP PLATFORM DIRECT DEPENDENCY CLEARED  
**Date:** 2026-10-03

## Scope

This audit checks whether EVO App Platform still directly depends on the legacy EVO compatibility surface:

```text
GET  /api/v1/enterprises/:enterpriseCode
GET  /api/v1/capabilities
POST /api/v1/commands
```

## Result

Current App Platform runtime code no longer requires those endpoints for the Trading Lite reference path.

The certified path is now:

```text
Eidos
→ App Platform ActionHost
→ Host-owned BusinessData adapter
→ POST /api/v1/business-data
→ EVO Posting / Ledger / Balance
→ Host-owned runtime observation adapter
→ POST /api/v1/runtime-observations/query
→ Eidos visible result
```

The cross-project browser proof is closed on main.

## Retirement decision

Do **not** delete EVO compatibility endpoints merely because App Platform no longer consumes them.

Their remaining ownership is inside EVO as a compatibility surface, and external consumers may still exist outside the four-project mainline.

Therefore compatibility retirement requires a separate EVO-side gate:

1. mark the endpoint explicitly deprecated;
2. identify any repository-owned callers and validation scripts;
3. preserve a migration note to BusinessData + runtime observation contracts;
4. remove only after a deliberate compatibility window or explicit breaking-change decision.

## App Platform conclusion

For App Platform:

- direct legacy Command dependency: **CLEARED**
- direct capability-discovery dependency: **CLEARED**
- direct enterprise-lookup dependency for Trading Lite: **CLEARED**
- generic BusinessData write proof: **PASS**
- generic runtime observation read proof: **PASS**
- Eidos visible browser readback proof: **PASS**

No further compatibility code needs to be retained inside Trading Lite.

## Next bounded slice

Return the mainline to platform capability growth rather than continuing to refactor an already-cleared compatibility path.

Recommended next platform slice:

```text
generic runtime observation contribution seam
→ reusable App/Agent read capability
→ avoid Trading Lite-specific observation wiring spreading to future Apps
```

SOP remains separate and deferred.
