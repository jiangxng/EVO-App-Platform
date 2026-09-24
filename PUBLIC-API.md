# EVO App Platform Public API — Draft

The public API is not frozen yet. This document defines the required families.

## Catalog

- list Apps
- get App/version metadata
- inspect capabilities and dependencies

## Planning

- plan install
- plan upgrade
- plan uninstall
- return dependencies, blockers, warnings and expected changes
- planning must be side-effect free

## Lifecycle

- install
- activate
- deactivate
- upgrade
- uninstall
- query operation status

## Discovery

- list installed Apps for an installation scope
- expose effective backend capabilities
- expose effective Eidos experience contributions
- expose effective Eidos Workbench Activity contributions

## Error contract

Errors must be stable, machine-readable and include correlation/operation identity where applicable.

## Contract rule

No public API may expose EVO/Eidos private classes, SQL tables or repository internals.


## Implemented MVP endpoints — 2026-09-23

The first App Manager backend now exposes:

- `GET /health`
- `GET /v1/catalog`
- `GET /v1/platform/snapshot`
- `POST /v1/install/plan`
- `POST /v1/install`
- `GET /v1/experiences/effective`
- `GET /v1/workbench/activities`
- `GET /v1/experience-pages?source=<experience-source>`

Current semantics:

- `planInstall` is side-effect free;
- `install` installs required Packages and activates planned default/dependency Features;
- effective Eidos experiences are visible only from active Features;
- effective Workbench Activities are visible only from active Features and are removed when those Features are disabled/uninstalled;
- page assets are not served through the effective page API until their Experience Contribution is active.

These endpoints are MVP contracts, not yet frozen public v1 compatibility promises.
