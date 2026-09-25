# Internal Plugin vs External Integration Boundary v0.1

**Status:** Accepted architecture boundary
**Date:** 2026-09-25

## Decision

EVO has two different extension problems and must not collapse them into one protocol.

### 1. Internal EVO plugins

Internal plugins are first-party or ecosystem applications that run as native EVO packages.

They follow EVO Plugin Protocol:

- Package Manifest
- Feature
- Capability dependencies/provisions
- Contribution Points
- lifecycle and activation
- permissions/trust
- plugin runtime/sandbox
- plugin-local storage/events
- Eidos Experiences and Workbench contributions
- independent plugin CI and release

This is the primary model for future EVO business plugins, configurators, providers and enterprise mini-apps.

The closest product-shape reference is a mini-app platform: plugins are complete applications hosted by a stable platform, not remote tools wrapped behind OAuth.

### 2. External integrations

External integrations connect EVO or an EVO plugin to systems outside the EVO runtime boundary.

Prefer open standards:

- MCP for LLM/tool/resource interoperability when appropriate;
- OAuth 2.1 + PKCE for delegated authorization;
- OIDC when identity claims are required;
- HTTP/webhooks/event standards for conventional service integration.

MCP is therefore an external interoperability protocol, not the internal EVO plugin runtime protocol.

## Required separation

Do not implement an internal plugin as:

    EVO plugin -> private MCP server -> OAuth -> App Platform -> same EVO plugin

unless an independent remote deployment/ownership boundary actually requires it.

The normal internal path is:

    Package -> Feature -> Capability -> Contribution -> App Platform -> Eidos / Plugin Runtime

The normal external path is:

    EVO Plugin or Host -> MCP/HTTP -> OAuth/OIDC -> External Service

## Design references

EVO intentionally combines different lessons:

- mini-app platforms: complete hosted application lifecycle, permissions, storage and platform APIs;
- VS Code-style extension systems: manifest, contribution points, host API, lazy activation and isolation;
- MCP/OAuth: interoperable connection to external AI tools/data/services.

These references inform different layers. None is copied wholesale.

## CI consequence

Internal plugin CI validates one plugin against EVO Plugin Protocol and the public App Platform/Eidos contracts it directly consumes.

External integration adapter tests validate only the adapter and its protocol contract. They do not turn remote systems or unrelated plugins into ordinary CI dependencies.

## LLM context rule

For internal plugin development, load EVO Plugin Protocol + the plugin + directly consumed public contracts.

For external integration work, additionally load only the relevant interoperability specification/adapter context such as MCP/OAuth.

Do not load MCP/OAuth material for ordinary native plugin work.
