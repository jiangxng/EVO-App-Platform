---
{
  "helpVersion": "0.1.0",
  "id": "evo.authorization.authentication-vs-authorization",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "concept",
  "title": "Authentication vs authorization",
  "summary": "Authentication establishes a Principal; authorization decides whether that Principal may act.",
  "audiences": ["admin", "developer", "operator", "agent"],
  "tags": ["authentication", "authorization", "principal", "policy"],
  "contexts": {
    "capabilities": ["authorization.check"],
    "errorCodes": ["AUTHORIZATION_PROVIDER_UNAVAILABLE", "AUTHORIZATION_PROVIDER_RESOLUTION_FAILED"],
    "actions": ["provider.binding.update", "provider.health.probe", "provider.governance.audit.read"]
  },
  "related": ["evo.provider.model", "evo.troubleshooting.authorization-denied"],
  "lastReviewedAt": "2026-09-26"
}
---
Authentication answers who is acting. Authorization answers whether that Principal may perform a specific action on a resource and scope.

## Current P0 flow

The transitional bootstrap credential authenticates the bootstrap-admin Principal. It does not grant permission by itself.

Authorization then resolves the active authorization.check Provider and evaluates an AuthorizationCheck.

> [!WARNING] Deny by default
> Missing, ambiguous, unavailable, errored or denying Authorization Providers cause the privileged operation to fail closed.
