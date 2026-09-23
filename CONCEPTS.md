# EVO App Platform Concepts

## App
A versioned installable business capability package.

## App Manager
The lifecycle orchestrator for planning, installing, upgrading, deactivating and uninstalling Apps.

## App Catalog
The discoverable registry of available Apps, versions, dependencies and compatibility.

## App Manifest
The machine-readable identity and lifecycle contract of an App.

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
