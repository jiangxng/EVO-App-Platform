# ADR-0001: Adopt Package → Feature → Contribution model

**Status:** Accepted  
**Date:** 2026-09-23

## Context

The platform originally used "App" and "Package" too broadly. Recent architecture work showed the need to represent foundation runtimes, business apps, Eidos experience, runtime extensions and Agent Packages under one lifecycle model.

The classic SharePoint Solution → Feature → Element pattern provides a useful conceptual reference: distribution package, independently activatable feature, and concrete registered elements.

## Decision

Adopt:

```text
Package → Feature → Contribution
```

with these semantics:

- Package = distribution/install/upgrade unit;
- Feature = activation/deactivation/dependency unit;
- Contribution = concrete registered capability/content/runtime declaration.

Install and activation are separate lifecycles.

Feature dependencies and activation scope are first-class.

Repository topology is independent from package/feature topology.

Lifecycle is declarative-first; arbitrary in-process installer/activation code is not the default extension mechanism.

## Consequences

The future manifest model will split Package Manifest and Feature Manifest.

EVO Core, Eidos runtime, business Apps and Enterprise Agent can share the same package graph while keeping different runtime semantics and lifecycle policies.

Existing documents using "App Manifest" should be interpreted as transitional until the generic Package/Feature contracts are frozen.

## Non-decision

This ADR does not freeze exact JSON field names, scope vocabulary, API paths or physical artifact format.
