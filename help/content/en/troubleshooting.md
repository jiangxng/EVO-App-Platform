---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.provider-ambiguous",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "troubleshooting",
  "title": "Provider resolution is ambiguous",
  "summary": "Fix a capability that has multiple executable Providers and no applicable explicit binding.",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["troubleshooting", "provider", "ambiguous"],
  "contexts": {
    "errorCodes": ["PROVIDER_RESOLUTION_AMBIGUOUS"],
    "routes": ["/providers"]
  },
  "related": ["evo.provider.binding", "evo.provider.model"],
  "lastReviewedAt": "2026-09-26"
}
---
This error means more than one executable Provider can satisfy the capability and no explicit binding resolves the choice.

## Resolution

1. Open Provider Bindings.
2. Select the affected capability.
3. Choose the intended Provider.
4. Choose the correct scope.
5. Save the binding after authorization policy approval.

> [!INFO] Why EVO does this
> Lexical order, install order and current health are not allowed to silently choose platform behavior.
