# Plugin Resource Lazy Loading v0.1

**Document class:** CURRENT_AUTHORITY  
**Status:** Architecture baseline  
**Date:** 2026-10-04  
**Owner:** EVO App Platform

## 1. Principle

Plugin Catalog metadata and plugin runtime resources are different things.

The Platform MAY load lightweight package manifests so an uninstalled plugin can
be discovered in Plugin Store.

The Platform MUST NOT eagerly load an uninstalled plugin's implementation
resources.

Canonical rule:

```text
Catalog-visible
  != installed
  != active
  != implementation loaded
```

## 2. Resource admission gates

### Catalog-only

Allowed:

- Package / Feature manifest metadata;
- display name, version, publisher and compatibility;
- declared capabilities and dependencies;
- declarative install-plan metadata.

Not allowed:

- page implementation modules;
- ActionHost implementation modules;
- plugin repositories / state files;
- plugin workers or processes;
- plugin-specific renderer/projection code;
- plugin background subscriptions.

### Installed but inactive

The package exists in lifecycle state, but inactive Features MUST NOT expose
their routes, Actions, Providers or Experiences.

Implementation code remains unloaded until an active Feature actually needs it.

### Active

Active Feature metadata becomes effective.

Even then, implementation modules SHOULD load on demand:

- page module when its effective page is requested;
- Action module on first active command invocation;
- runtime process/worker when first admitted by its runtime lifecycle;
- repository when the Feature first needs its state.

## 3. Host pattern

The standard in-process pattern is:

```text
lightweight manifest metadata
        |
        v
Feature active?
   no -> reject / unavailable, zero implementation import
   yes
        |
        v
lazy proxy / page resolver
        |
        v
dynamic import(plugin implementation)
```

ActionHost uses a lightweight lazy handler proxy. The router checks Feature
activation before calling the proxy, so an inactive plugin cannot trigger its
dynamic import.

Experience pages follow the same rule: the Host first verifies that the page
source is effective, then dynamically imports the page implementation.

## 4. Cross-plugin capability rule

A consumer plugin MUST test a public capability, not import the provider
plugin's private implementation.

Example:

```text
Template Store
  -> capability: visual.viewer.2d
  -> available: enable Preview
  -> unavailable: disable Preview with install guidance
```

Template Store does not depend on the concrete EOG 2D package identity.

The current EOG 2D Viewer Feature provides `visual.viewer.2d`, but a future
replacement Viewer can provide the same capability without changing Template
Store.

## 5. Template Store / 2D Viewer reference implementation

This architecture is first enforced by the Template Store preview path.

When 2D Viewer is not active:

- Template Store remains usable;
- Copy remains usable;
- Preview remains visible but disabled;
- UI explains: “未安装 2D Viewer 扩展插件，无法预览。”;
- no 2D Viewer page/action implementation module is loaded.

When 2D Viewer is active:

```text
Template Store card
  -> Preview
  -> transient preview selection
  -> 2D Viewer read-only Workspace
  -> node / edge inspection
```

Preview never creates an Enterprise Context Draft and never mutates enterprise
authority.

## 6. Installation behavior

Application plugins MUST NOT be silently auto-installed merely because the Host
knows their package manifest.

Historical migration-time auto-install behavior is technical debt and must be
removed as affected plugin boundaries converge.

For the 2D application path, fresh environments no longer auto-install EOG 2D
Designer or Viewer. Existing persisted installations remain intact.

## 7. Persistence

A plugin repository/state file SHOULD NOT be opened merely because the package
exists in Catalog.

Template Store Repository construction is lazy and occurs only after an active
Template Store operation requires it.

## 8. Uninstall / disable

After Feature deactivation:

- routes and Experiences cease to be effective;
- Action Router rejects its commands before lazy implementation execution;
- external process/worker runtimes are stopped;
- no new plugin work may start.

For in-process JavaScript modules, Node's module cache may retain code that was
already loaded earlier in the process. v0.1 guarantees **no eager loading for
never-used/inactive plugins**, not physical memory reclamation after a module was
previously imported.

True unload/reclamation is delegated to isolated Worker/Process runtime
boundaries where required.

## 9. CI invariant

CI MUST detect regressions such as:

- static Host imports of protected plugin implementation modules;
- adding Template Store page assets back to global eager Experience assets;
- startup-time auto-install of optional 2D application plugins;
- lazy handlers loading while their Feature is inactive.

## 10. Performance consequence

This model reduces:

- server startup module evaluation;
- unnecessary repository/file initialization;
- browser Experience payload discovery;
- plugin-specific runtime memory for unused plugins;
- accidental cross-plugin coupling.

The optimization follows the architecture boundary rather than introducing a
separate performance-only mechanism.
