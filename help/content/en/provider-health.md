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
    "routes": ["/providers"]
  },
  "related": ["evo.provider.binding", "evo.troubleshooting.provider-unavailable"],
  "lastReviewedAt": "2026-09-26"
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
