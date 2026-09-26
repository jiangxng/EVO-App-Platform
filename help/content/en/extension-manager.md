---
{
  "helpVersion": "0.1.0",
  "id": "evo.extension-manager.overview",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "how-to",
  "title": "Use Extension Manager",
  "summary": "Inspect plugin lifecycle, compatibility, trust, integrity and runtime posture.",
  "audiences": ["user", "admin", "operator", "support", "agent"],
  "tags": ["extension-manager", "plugin", "integrity", "runtime"],
  "contexts": {
    "routes": ["/store"]
  },
  "related": ["evo.plugin.lifecycle", "evo.troubleshooting.plugin-integrity", "evo.troubleshooting.runtime-unavailable"],
  "lastReviewedAt": "2026-09-26"
}
---
Extension Manager is the standard Eidos surface for discovering and operating installed extensions.

## What it shows

- lifecycle status;
- host compatibility;
- publisher trust;
- integrity and provenance posture;
- requested permissions;
- runtime type and health history;
- provided and required capabilities.

## Actions

Available actions depend on lifecycle and admission state. Unsupported or unsafe transitions are blocked rather than simulated.
