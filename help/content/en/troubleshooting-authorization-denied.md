---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.authorization-denied",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "troubleshooting",
  "title": "Authorization denied",
  "summary": "Determine whether authentication, Provider resolution or policy denied a privileged operation.",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["troubleshooting", "authorization", "policy"],
  "contexts": {
    "errorCodes": ["AUTHORIZATION_PROVIDER_UNAVAILABLE", "AUTHORIZATION_PROVIDER_RESOLUTION_FAILED", "STATIC_POLICY_NO_MATCH", "STATIC_POLICY_EXPLICIT_DENY"]
  },
  "related": ["evo.authorization.authentication-vs-authorization"],
  "lastReviewedAt": "2026-09-26"
}
---
A privileged operation can fail before or during authorization evaluation.

## Check the failure stage

- Authentication errors mean a Principal could not be established.
- Provider resolution errors mean authorization.check could not resolve deterministically.
- Policy denial means the active Authorization Provider returned DENY.
- No matching static rule also denies by default.

Do not bypass the decision by changing the UI. Authorization is enforced server-side.
