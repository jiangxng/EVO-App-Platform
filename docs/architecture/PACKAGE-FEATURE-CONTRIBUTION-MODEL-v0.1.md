# Package → Feature → Contribution Model v0.1

**Status:** Architecture baseline  
**Date:** 2026-09-23  
**Authority:** EVO App Platform package/feature lifecycle model

## 1. Why this model exists

EVO App Platform needs one model that can describe:

- foundation runtimes such as EVO Core;
- Eidos runtime packages;
- business applications;
- runtime extensions;
- experience packages;
- Agent Packages.

The model must separate **delivery/install lifecycle** from **feature activation lifecycle**.

The architectural pattern is inspired by the classic SharePoint Solution → Feature → Element model, but this project does not copy SharePoint implementation details, XML format, Farm/WebApplication scope semantics, or arbitrary in-process activation receivers.

## 2. Three levels

```text
Package
  ↓ contains
Feature
  ↓ contributes
Contribution
```

### Package

Package is the versioned distribution/install/upgrade unit.

It answers:

> What artifact is delivered into the system?

A Package owns:

- package identity;
- publisher;
- package version;
- artifact integrity/digest;
- package compatibility;
- included Features;
- package-level upgrade/migration metadata;
- package-level lifecycle metadata.

### Feature

Feature is the independently discoverable/activatable capability unit inside a Package.

It answers:

> What capability becomes active?

A Feature owns:

- stable feature identity;
- feature version;
- activation scope;
- dependencies;
- provided capabilities;
- required capabilities;
- activation/deactivation policy;
- configuration schema;
- included Contributions.

### Contribution

Contribution is a concrete declarative/runtime contribution registered by a Feature.

It answers:

> What does this Feature add to the system?

Examples:

- EVO Ledger Definition;
- EVO Posting Rule;
- EVO query/API contribution;
- projection definition;
- runtime extension registration;
- Eidos Page/UIDL;
- Eidos navigation entry;
- Eidos route;
- Eidos dashboard;
- Eidos component package reference;
- Agent tool definition;
- Agent role/method/knowledge binding;
- configuration schema;
- migration declaration.

Contribution is the preferred neutral term. "Element" may appear in historical/reference discussion but is not the canonical schema term.

## 3. Package is not Feature

A Package may contain one or many Features.

Example:

```text
Package: finance-reporting

Features:
├─ finance-reporting.backend
├─ finance-reporting.experience
└─ finance-reporting.default
```

The `default` Feature may depend on the backend and experience Features.

This allows one Package to be installed once while Features are activated/deactivated independently where policy allows.

## 4. Install is not Activate

Package lifecycle and Feature lifecycle are distinct.

Package lifecycle:

```text
AVAILABLE
→ INSTALLED
→ UPGRADED
→ REMOVED
```

Feature lifecycle:

```text
INACTIVE
→ ACTIVATING
→ ACTIVE
→ DEACTIVATING
→ INACTIVE
```

Therefore this is valid:

```text
finance-reporting package = INSTALLED
finance-reporting.backend = ACTIVE
finance-reporting.experience = INACTIVE
```

The App Manager must not collapse these into one boolean.

## 5. Feature dependency graph

Feature dependencies are first-class and machine-readable.

A Feature may declare:

- `requiresFeatures`;
- `requiresCapabilities`;
- `providesCapabilities`;
- version ranges;
- activation ordering constraints where unavoidable.

Example:

```text
finance-reporting.default
requires:
  - finance-reporting.backend
  - finance-reporting.experience

finance-reporting.backend
requiresCapabilities:
  - evo.ledger
  - evo.balance

finance-reporting.experience
requiresCapabilities:
  - eidos.app-host
  - eidos.datagrid
  - eidos.chart
```

App Manager resolves the graph from capabilities and feature contracts, not from source repositories.

## 6. Runtime Packages are ordinary Packages

EVO and Eidos may participate in the same package graph, but neither gains hidden platform privilege from the package model.

Target EVO model:

```text
Package: evo.runtime
type: RUNTIME_EXTENSION (or future generic PLUGIN type)

Feature: evo.runtime
provides:
- evo.business-data
- evo.posting
- evo.ledger
- evo.balance
- evo.runtime.recalculate
- evo.runtime.clear
- evo.runtime.export
```

EVO is a lightweight runtime plugin. Identity, permissions, Application/Package lifecycle, capability discovery and PostingRule lifecycle are owned by the Host/App Platform or other plugins.

The current reference seed still uses `packageId: evo.core`, `type: FOUNDATION_RUNTIME` and multiple Features because Proof B was certified against that shape. Treat it as compatibility/proof data, not the target product boundary. Do not add new platform privileges to `FOUNDATION_RUNTIME`.

Eidos runtime is likewise a Package whose lifecycle is governed by App Manager; its frontend framework responsibilities remain separate from EVO runtime responsibilities.

## 6.1 EVO is not the platform Core

The name "EVO Core" in historical assets must not be interpreted as "the Core of the whole enterprise platform."

The target composition is:

```text
App Platform / Host
├─ identity / permissions
├─ package / feature / application lifecycle
├─ capability graph
├─ rule plugins
├─ audit/governance plugins
├─ Eidos
├─ Enterprise Agent
└─ EVO Runtime Plugin
```

App Manager may install EVO because another App requires its capabilities, exactly as it installs another dependency package.

## 7. Agent Packages

An Agent Package uses the same model.

Example:

```text
Package: enterprise-agent
type: AGENT

Features:
├─ enterprise-agent.runtime
├─ enterprise-agent.memory
├─ enterprise-agent.knowledge
├─ enterprise-agent.tools
└─ enterprise-agent.default
```

Whether memory/knowledge are separate Features, external dependencies, or later independent services remains an implementation decision.

The authoritative Agent Package definition remains:

`docs/architecture/AGENT-PACKAGE-MODEL-v0.1.md`

## 8. Activation Scope

Feature activation has an explicit scope.

Candidate scope vocabulary:

```text
SYSTEM
INSTALLATION
ENTERPRISE
COMPANY
WORKSPACE
USER
```

These names are provisional until contract freeze.

Activation Scope is a **business/application activation boundary**, not a Cloud Tenant storage/isolation strategy.

A Feature must not infer cloud database topology from its activation scope.

## 9. Declarative-first lifecycle

Lifecycle should prefer:

```text
Declarative Contribution
> constrained lifecycle operation
> external runtime hook
> arbitrary executable installer
```

Arbitrary in-process activation/install code is not the default extension mechanism.

Where code execution is required, prefer an external runtime extension behind a versioned protocol with:

- timeout;
- idempotency;
- retry;
- health;
- authentication;
- failure isolation;
- explicit rollback/recovery semantics.

## 9.1 EVO ApplicationAnchor contribution

A business App that uses EVO must give EVO a stable routing identity.

The target contribution model is:

```text
Business App Package
→ contributes/registers ApplicationAnchor(applicationId)
→ contributes/registers current PostingRules(applicationId)
→ submits BusinessData(applicationId)
```

The same stable `applicationId` connects the App's EVO runtime configuration:

```text
ApplicationAnchor.applicationId
= PostingRule.applicationId
= BusinessData.applicationId
```

App Manager/Host still owns installation, activation, permissions, UI, Package/Feature lifecycle and capability discovery.

EVO owns only the minimal ApplicationAnchor required to route BusinessData to the correct current PostingRules.

PostingRule version/draft/approval/effective-date lifecycle remains owned by the rule/App package; EVO receives the current executable rule set.

## 10. Business application example

```text
Package: trading-lite

Feature: trading.inventory
Contributions:
- Inventory Qty Ledger Definition
- Inventory Value Ledger Definition
- Inventory Posting Rules
- Inventory Query API
- Inventory Page
- Inventory Navigation Entry

Feature: trading.receivable
Contributions:
- Receivable Ledger Definition
- Posting Rules
- Receivable API
- Receivable Page

Feature: trading.default
requires:
- trading.inventory
- trading.receivable
- trading.payable
```

Generic UI primitives such as Form, DataGrid and Chart remain Eidos-owned. The App contributes business-specific compositions that use them.

When the App uses EVO, its backend contribution must preserve one stable EVO `applicationId` across ApplicationAnchor, PostingRules and submitted BusinessData.

## 11. Repository topology is independent

Package/Feature topology is not repository topology.

A package may be built from:

- this repository;
- EVO repository;
- Eidos repository;
- a dedicated large-app repository;
- a third-party repository.

App Manager sees:

```text
Package Manifest
Feature Manifests
Artifact
Contracts
Signatures/Digests
```

It must not infer semantics from GitHub repository names or folders.

## 12. Manifest split

The target contract should converge toward:

```text
package.manifest.json

features/
├─ <feature>.feature.json
└─ ...
```

Package Manifest owns distribution/version/integrity metadata.

Feature Manifest owns activation/dependency/capability/contribution metadata.

Do not overload one manifest with all concerns.

## 13. Capability discovery

Capability is what other packages/features depend on.

Feature is the lifecycle unit that provides it.

Therefore:

```text
Feature
→ provides Capability
```

A consumer should preferably depend on a capability contract rather than a concrete implementation Feature when substitutability matters.

Example:

```text
requiresCapabilities:
  - evo.balance
```

is stronger than hard-coding:

```text
requiresFeatures:
  - evo.core.balance-feature
```

unless exact feature identity is materially required.

## 14. App Manager responsibilities

App Manager must eventually be able to:

- discover packages;
- validate Package Manifest;
- validate Feature Manifests;
- install package artifacts;
- build Feature dependency graph;
- calculate activation plans;
- detect cycles/conflicts;
- activate/deactivate Features;
- enforce activation scopes;
- prevent unsafe removal while dependents exist;
- plan upgrades;
- expose effective capabilities;
- expose effective frontend experiences;
- record lifecycle evidence.

## 15. Key architecture statement

> **Package is what enters the system. Feature is what becomes active. Contribution is what the Feature adds.**

This is the canonical mental model for EVO App Platform.


## 16. Plugin-First extension rule

EVO App Platform is plugin-first. New platform capability is assumed to be a Package/Feature/Capability/Contribution unless proven to require the minimal host Core.

The Core owns the generic substrate:

- catalog/discovery;
- package + feature lifecycle;
- dependency/capability resolution;
- contribution registration;
- App Host composition;
- persistence of lifecycle state;
- generic security/governance hooks.

Everything else should preferentially enter as plugins. If Eidos cannot render the required human experience, Eidos is extended first; the product plugin then consumes the new public Eidos capability.

This keeps long-term growth additive rather than centralizing every new requirement into a monolithic platform core.
