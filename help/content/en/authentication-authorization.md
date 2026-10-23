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
    "errorCodes": ["AUTHORIZATION_PROVIDER_UNAVAILABLE", "AUTHORIZATION_PROVIDER_RESOLUTION_FAILED", "AUTHENTICATION_UNAVAILABLE", "OIDC_TRANSACTION_LIMIT_REACHED"],
    "actions": ["provider.binding.update", "provider.health.probe", "provider.governance.audit.read"]
  },
  "related": ["evo.provider.model", "evo.troubleshooting.authorization-denied"],
  "lastReviewedAt": "2026-10-22"
}
---
Authentication answers who is acting. Authorization answers whether that Principal may perform a specific action on a resource and scope.

## Current P0 flow

The transitional bootstrap credential authenticates the bootstrap-admin Principal. It does not grant permission by itself.

Authorization then resolves the active authorization.check Provider and evaluates an AuthorizationCheck.

> [!WARNING] Deny by default
> Missing, ambiguous, unavailable, errored or denying Authorization Providers cause the privileged operation to fail closed.

## OIDC login capacity and retry

The Generic OIDC Provider retains up to 1000 unconsumed login states per runtime by default. When full, new login starts receive HTTP 503 `AUTHENTICATION_UNAVAILABLE`; existing live logins keep their place. Complete or cancel an outstanding login, or retry after its default 10-minute lifetime has elapsed. There is no automatic retry or background cleanup timer; the next login/callback reclaims expired states.

A callback consumes its known state even when sign-in is denied or the authorization code is missing. Start a fresh login after such a failure. Pending login states are temporary and are lost on Host restart; issued Session history and revocation remain independent durable records. This capacity limit does not grant authorization or impose a Session-history retention policy.
