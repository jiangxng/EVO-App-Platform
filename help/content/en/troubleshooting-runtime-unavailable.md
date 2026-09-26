---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.runtime-unavailable",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "troubleshooting",
  "title": "Plugin runtime is unavailable",
  "summary": "Diagnose plugin runtime readiness, crash, timeout or admission failures.",
  "audiences": ["admin", "operator", "support", "developer", "agent"],
  "tags": ["troubleshooting", "runtime", "process", "remote"],
  "contexts": {
    "errorCodes": ["PLUGIN_RUNTIME_UNSUPPORTED", "PLUGIN_RUNTIME_INACTIVE", "PLUGIN_RUNTIME_TIMEOUT"]
  },
  "related": ["evo.extension-manager.overview", "evo.plugin.lifecycle"],
  "lastReviewedAt": "2026-09-26"
}
---
Runtime availability depends on lifecycle state, integrity admission and the declared runtime kind.

## Diagnose

- Confirm the Package is installed.
- Confirm at least one owning Feature is active.
- Inspect Extension Manager runtime diagnostics and recent history.
- For PROCESS runtime, check trusted signature and entrypoint digest.
- For REMOTE runtime, check HTTPS endpoint and credential Provider readiness.

A runtime crash or timeout fails the invocation deterministically and should not corrupt unrelated plugin processes.
