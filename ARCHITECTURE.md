# EVO App Platform Architecture

## 1. Top-level model

```text
EVO App Platform
├─ App Manager
├─ App Catalog
└─ Apps
```

## 2. Cross-project position

```text
Business App
   ├─ backend contribution ──> EVO Public Contract
   └─ experience contribution -> Eidos Public Contract
```

EVO App Platform owns application lifecycle and distribution semantics. It does not own EVO Core or Eidos Core.

## 3. App Manager

App Manager owns:

- discovery;
- compatibility validation;
- dependency resolution;
- install planning;
- install;
- upgrade;
- deactivate;
- uninstall;
- lifecycle status;
- rollback/recovery metadata;
- certification hooks.

It must operate from public contracts plus Package Manifest and Feature Manifest data.

## 4. App Catalog

Catalog exposes:

- app id;
- display name;
- versions;
- maturity;
- provided capabilities;
- dependencies;
- EVO protocol requirements;
- Eidos protocol requirements;
- configuration schema;
- installability status.

## 5. Package logical structure

```text
apps/<package-id>/
├─ package.manifest.json
├─ features/
│  ├─ <feature>.feature.json
│  └─ ...
├─ backend/
├─ experience/
└─ tests/
```

Backend may contain declarative definitions or code for an independent runtime extension.

Experience contains Eidos-compatible declarations, not a parallel frontend framework.

## 6. Lifecycle

```text
discover
→ plan
→ validate
→ install
→ activate
→ verify
```

Later:

```text
upgrade
deactivate
uninstall
recover
```

## 7. Dependency direction

- manager depends on contracts, never app private implementation;
- apps depend only on published EVO/Eidos contracts;
- catalog consumes manifests;
- certification consumes public observable behavior.

## 8. Deployment

Repository structure does not force one deployment topology.

App Manager may later be hosted locally or as a platform service. EVO/Eidos remain independently deployable.

## 9. First proof

The first end-to-end proof should be a tiny app such as `trading-lite`:

```text
Bare EVO
→ App Manager plan
→ install Trading Lite
→ backend capability active
→ Eidos App Host discovers experience
→ user can open installed app
→ deactivate/uninstall removes current exposure
```


## 10. Generic Package Graph

The platform should converge on one generic package model rather than treating EVO Core, Apps and Agents as unrelated lifecycle concepts.

Candidate package roles:

```text
FOUNDATION_RUNTIME
APPLICATION
RUNTIME_EXTENSION
EXPERIENCE
AGENT
```

Examples:

```text
evo.core                 FOUNDATION_RUNTIME
eidos.core               FOUNDATION_RUNTIME
eidos.app-host           FOUNDATION_RUNTIME
trading-lite             APPLICATION
finance-reporting        APPLICATION
enterprise-agent         AGENT
```

Package role does not determine source repository. A large package may be independently maintained while still participating in the same Package Graph.

## 11. Enterprise Agent

The former EC / Experience Compiler concept is being redefined as an **Enterprise Agent Package**.

The App Platform owns only the Agent Package lifecycle model and manifest compatibility. It does not own the Agent's enterprise knowledge itself and does not become the Agent runtime.

The authoritative package-model definition is:

`docs/architecture/AGENT-PACKAGE-MODEL-v0.1.md`


## 12. Package → Feature → Contribution

The canonical lifecycle hierarchy is:

```text
Package
  ↓ contains
Feature
  ↓ contributes
Contribution
```

- Package = distribution/install/upgrade unit.
- Feature = activation/deactivation/dependency unit.
- Contribution = concrete content/runtime registration.

Human-facing shell extensions follow the same rule. Product-specific Workbench entries are Contributions, not App Host constants:

```text
Enterprise Agent Feature
  ├─ eidos.experience
  ├─ eidos.localization-bundle
  └─ eidos.workbench-activity
```

The App Platform aggregates only Contributions from currently effective Features. Eidos renders and reconciles the supplied Activity set; it does not discover package lifecycle itself.

Installation and activation are distinct.

The detailed authority is:

`docs/architecture/PACKAGE-FEATURE-CONTRIBUTION-MODEL-v0.1.md`

This model is conceptually inspired by SharePoint's historical Solution → Feature → Element separation, but does not inherit SharePoint's XML format, Farm/WebApplication deployment semantics or arbitrary in-process activation receiver model.
