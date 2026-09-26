---
{
  "helpVersion": "0.1.0",
  "id": "evo.provider.binding",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "how-to",
  "title": "Configure a Provider binding",
  "summary": "Bind a capability to a Provider at an explicit scope.",
  "audiences": ["admin", "operator", "agent"],
  "tags": ["provider", "binding", "scope", "priority"],
  "contexts": {
    "routes": ["/providers"],
    "actions": ["provider.binding.update"],
    "errorCodes": ["PROVIDER_RESOLUTION_AMBIGUOUS"]
  },
  "related": ["evo.provider.model", "evo.provider.health", "evo.troubleshooting.provider-ambiguous"],
  "lastReviewedAt": "2026-09-26"
}
---
A Provider binding is Host-owned policy that selects a Provider for one capability and scope.

## Scope precedence

More specific bindings override broader bindings in this order:

1. USER
2. WORKSPACE
3. COMPANY
4. ENTERPRISE
5. INSTALLATION
6. SYSTEM

## Save a binding

1. Open Settings and choose Provider Bindings.
2. Select the capability and Provider.
3. Choose the scope and enter a Scope ID when the scope is not SYSTEM.
4. Provide administrator authentication when required.
5. Save the binding.

> [!WARNING] No silent fallback
> If the explicitly bound Provider runtime is unavailable, resolution fails closed instead of selecting another Provider.
