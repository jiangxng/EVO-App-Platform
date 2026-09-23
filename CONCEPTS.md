# EVO App Platform Concepts

## App
A versioned installable business capability package.

## App Manager
The lifecycle orchestrator for planning, installing, upgrading, deactivating and uninstalling Apps.

## App Catalog
The discoverable registry of available Apps, versions, dependencies and compatibility.

## Package Manifest
The machine-readable distribution/install/upgrade identity of a Package.

## Feature Manifest
The machine-readable activation/deactivation/dependency contract of a Feature.

## Backend Contribution
Definitions, APIs, projections or optional runtime services provided through EVO public contracts.

## Experience Contribution
Eidos-compatible app manifest, navigation, pages/UIDL and data/action bindings.

## Installation Scope
The business installation scope into which an App is activated. It is not a cloud multi-tenant storage strategy.

## Official App
An App maintained in this repository. Official status does not grant private access to EVO or Eidos implementations.

## Third-party App
An App maintained outside this repository but conforming to the same public contracts.


## Package
A versioned installable unit governed by a machine-readable Package Manifest. Package topology is independent of Git repository topology.

## Foundation Package
A Package that provides foundational runtime capability, such as `evo.core` or Eidos runtime packages. Foundation status does not mean the package must live in this repository.

## Agent Package
A Package whose primary executable role is an LLM Agent.

The first planned Agent Package is **Enterprise Agent**, the successor product concept to the former Experience Compiler (EC).

Enterprise Agent preserves durable role, memory, knowledge, methods and tool contracts while allowing the underlying LLM/model provider to be replaced.

See `docs/architecture/AGENT-PACKAGE-MODEL-v0.1.md`.


## Feature
An independently discoverable and activatable lifecycle unit contained in a Package. A Feature may provide capabilities, require capabilities/features, declare activation scope and register Contributions.

## Capability
A machine-discoverable contract provided by one or more Features. Consumers should prefer capability dependencies when implementation substitution is desirable.

## Contribution
A concrete declarative or runtime registration made active by a Feature, such as an EVO ledger definition, posting rule, Eidos page/navigation entry, runtime extension registration or Agent tool.

## Activation Scope
The business/application scope at which a Feature is activated. It is explicitly distinct from cloud tenant/database topology.

## Install vs Activate
Installing a Package makes its Features available. Activating a Feature makes its Contributions effective. These are separate lifecycle transitions.
