---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.plugin-integrity",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "troubleshooting",
  "title": "Plugin integrity or signature failure",
  "summary": "Understand why executable plugin admission rejects invalid or untrusted integrity evidence.",
  "audiences": ["admin", "operator", "support", "developer", "agent"],
  "tags": ["troubleshooting", "plugin", "signature", "integrity", "sigstore", "slsa"],
  "contexts": {
    "errorCodes": ["PACKAGE_INTEGRITY_REJECTED", "PROCESS_PACKAGE_SIGNATURE_REQUIRED"]
  },
  "related": ["evo.extension-manager.overview", "evo.plugin.lifecycle"],
  "lastReviewedAt": "2026-09-26"
}
---
Executable plugin Packages must satisfy Host-owned integrity and trust policy.

## Typical causes

- unknown or revoked signing key;
- invalid signature;
- entrypoint digest mismatch;
- missing required signature for executable runtime;
- declared Sigstore evidence failed verification;
- provenance does not match Host-owned builder policy.

The Package cannot establish its own root of trust.
