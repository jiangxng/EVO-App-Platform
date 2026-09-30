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


## External Agent Access — Reserved

Authority: `docs/architecture/EXTERNAL-AGENT-ACCESS-STANDARD-v0.1.md`.

This remains a reserved **network** API family; no External Agent public endpoint
is exposed yet.

Internal public semantic contracts now exist for:

- plugin `platform.capability-operation` declarations;
- authorization-aware effective operation selection;
- External Agent registration;
- External Agent Client registration;
- delegated External Agent Authority Grants;
- bounded validity/revocation/effective-status semantics.

These internal contracts are not OAuth credentials and are not evidence that an
external caller can already connect.

Future network/public families include:

- protected-resource / authorization discovery;
- authenticated External Agent/client identity;
- delegated Authority Grant management;
- authorization-aware effective capability-operation discovery;
- generic capability invocation;
- approval status;
- durable action receipt/audit reads;
- MCP projection;
- OpenAPI projection;
- future A2A task projection where justified.

Plugins do not publish product-specific ChatGPT/Claude APIs. Plugins publish one stable semantic Capability Operation through Plugin Protocol/App Platform public contracts. App Platform projects effective authorized operations into external protocols.

Production external Human-delegated access remains blocked until:

1. real production Human OIDC browser login is live-proven;
2. EA-3B can re-resolve the authorizing Human's current identity/context/authority without relying on a live browser Session;
3. OAuth protected-resource/client authorization is implemented;
4. delegated discovery/invocation is machine-proven fail-closed.

See `docs/architecture/EXTERNAL-AGENT-DELEGATED-AUTHORITY-EA3A-v0.1.md`.
