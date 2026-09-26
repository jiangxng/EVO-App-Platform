---
{
  "helpVersion": "0.1.0",
  "id": "evo.plugin.lifecycle",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "how-to",
  "title": "Plugin lifecycle",
  "summary": "Understand Install, Enable, Disable and Uninstall.",
  "audiences": ["user", "admin", "operator", "agent"],
  "tags": ["plugin", "install", "enable", "disable", "uninstall"],
  "contexts": {
    "routes": ["/store"],
    "actions": ["app-platform.install-package", "app-platform.enable-package", "app-platform.disable-package", "app-platform.uninstall-package"]
  },
  "related": ["evo.platform.package-feature-contribution", "evo.troubleshooting.runtime-unavailable"],
  "lastReviewedAt": "2026-09-26"
}
---
Plugin lifecycle is owned by App Platform and exposed through Extension Manager.

## Install

Install records the Package and activates only Features whose activation policy requires it.

## Disable

Disable deactivates the Package's active Features while keeping the Package installed. Settings and troubleshooting Help may remain available so configuration can be repaired.

## Enable

Enable reactivates eligible Features after lifecycle, compatibility and security checks.

## Uninstall

Uninstall removes the installed Package and its effective Contributions.

> [!WARNING] Lifecycle gates execution
> Executable plugin runtime dispatch cannot bypass installation and active Feature state.
