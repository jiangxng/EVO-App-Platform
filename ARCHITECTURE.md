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

It must operate from public contracts and App Manifest data.

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

## 5. App logical structure

```text
apps/<app-id>/
├─ app.manifest.json
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
