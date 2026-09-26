---
{
  "helpVersion": "0.1.0",
  "id": "evo.platform.package-feature-contribution",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "concept",
  "title": "Package, Feature and Contribution",
  "summary": "Learn the three layers used to install, activate and extend the platform.",
  "audiences": ["admin", "developer", "agent"],
  "tags": ["package", "feature", "contribution", "plugin"],
  "related": ["evo.plugin.lifecycle", "evo.provider.model"],
  "lastReviewedAt": "2026-09-26"
}
---
A Package is what enters the system. A Feature is what becomes active. A Contribution is what an active Feature adds to a host surface or platform capability.

## Package

A Package is the installable ownership and distribution boundary.

## Feature

A Feature declares activation scope, dependencies, capabilities and Contributions.

## Contribution

Contributions add concrete behavior such as an Eidos Experience, localization bundle, Workbench Activity, Settings surface or platform service Provider.

> [!WARNING] No hidden activation
> Installing a Package does not imply that every Feature is active. Lifecycle state is explicit.
