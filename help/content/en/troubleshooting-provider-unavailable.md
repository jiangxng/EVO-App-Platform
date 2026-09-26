---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.provider-unavailable",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "troubleshooting",
  "title": "Explicit Provider is unavailable",
  "summary": "Diagnose an unavailable Provider without triggering silent failover.",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["troubleshooting", "provider", "unavailable", "health"],
  "contexts": {
    "errorCodes": ["PROVIDER_RUNTIME_UNAVAILABLE"],
    "routes": ["/providers"]
  },
  "related": ["evo.provider.health", "evo.provider.binding"],
  "lastReviewedAt": "2026-09-26"
}
---
An explicit Provider binding exists, but the selected Provider runtime is unavailable.

## Diagnose

- Confirm the Package and Feature are installed and active.
- Inspect Provider health.
- Run an authorized active health probe when appropriate.
- Check Provider configuration and required credential boundaries.

> [!WARNING] Binding remains authoritative
> EVO does not silently switch to another Provider because the selected runtime is unavailable.
