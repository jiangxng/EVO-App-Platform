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

## Error contract

Errors must be stable, machine-readable and include correlation/operation identity where applicable.

## Contract rule

No public API may expose EVO/Eidos private classes, SQL tables or repository internals.
