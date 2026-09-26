---
{
  "helpVersion": "0.1.0",
  "id": "evo.workbench.overview",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "start",
  "title": "Workbench overview",
  "summary": "Understand the Activity Bar, Side Panel, Workspace and Status Bar.",
  "audiences": ["user", "admin", "agent"],
  "tags": ["workbench", "navigation", "workspace"],
  "contexts": {
    "routes": ["/store", "/settings", "/providers", "/help"]
  },
  "related": ["evo.plugin.lifecycle", "evo.settings.secrets"],
  "lastReviewedAt": "2026-09-26"
}
---
EVO uses an Eidos Workbench as its primary human-facing shell. The Workbench keeps application navigation, contextual tools and the current working surface separate.

## Main regions

- Activity Bar selects a work context.
- Side Panel shows navigation or contextual tools.
- Workspace is the main application and document surface.
- Status Bar shows lightweight current context.

## Activity behavior

Selecting the active side-panel activity again toggles the Side Panel. Workspace routes open in the main surface without replacing the Activity model.

> [!INFO] Stable shell
> Workbench layout is user-interface state. It is not business truth, enterprise scope or authorization input.
