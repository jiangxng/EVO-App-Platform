---
{
  "helpVersion": "0.1.0",
  "id": "evo.provider.health",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "reference",
  "title": "Provider health states",
  "summary": "Interpret HEALTHY, DEGRADED, UNAVAILABLE and UNKNOWN.",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["provider", "health", "probe"],
  "contexts": {
    "actions": ["provider.health.probe"],
    "routes": ["/providers"],
    "errorCodes": ["EVO_OBSERVATORY_REQUEST_TIMEOUT"]
  },
  "related": ["evo.provider.binding", "evo.troubleshooting.provider-unavailable"],
  "lastReviewedAt": "2026-10-22"
}
---
Provider health is observable runtime posture.

## HEALTHY

The runtime and its active probe report normal operation.

## DEGRADED

The runtime is reachable but reports a recoverable or partial problem.

## UNAVAILABLE

The runtime cannot currently satisfy the capability or its active probe failed.

## UNKNOWN

The runtime exists but no reliable active health result is available.

> [!INFO] Explicit probe
> P0 health probes run only after an explicit Host administration operation. They do not run as hidden startup polling.

## EVO Runtime observation deadlines

The `evo.runtime-observatory` readiness probe has an 8-second default deadline. A timeout reports `UNAVAILABLE` with `EVO_OBSERVATORY_REQUEST_TIMEOUT`. Check the configured EVO endpoint and connectivity, then run a new authorized explicit probe after recovery; there is no background polling or automatic retry.

An observation query has its own 8-second total budget, covering enterprise resolution, all requested targets, trace reads and response bodies. Timeout rejects the query without returning partial facts. Readiness uses HTTP status and releases an unfinished body; `HEALTHY` proves endpoint reachability, not business-fact completeness. Package disable prevents new effective selection; it does not immediately cancel a query that already started.
