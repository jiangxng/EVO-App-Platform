# Plugin Lazy Resource Loading v0.1

**Status:** Active architecture authority  
**Date:** 2026-10-09  
**Scope:** Package/Feature discovery, activation, runtime initialization and browser resource loading

## 1. Purpose

EVO App Platform must remain small as the plugin portfolio grows.

The platform may discover lightweight package metadata broadly, but a user who has not installed or activated a plugin must not pay the runtime cost of that plugin merely because the plugin exists in the catalog.

Canonical principle:

> Discover metadata cheaply. Load implementation only when lifecycle and use require it.

This rule applies to first-party and third-party Packages alike.

## 2. Loading stages

```text
Catalog metadata discovery
        ↓ lightweight only
Package installed?
        ↓ no → no effective Experience / no runtime / no plugin state initialization
Feature active?
        ↓ no → no runtime / no plugin state initialization
Capability requires background execution?
        ↓ yes → initialize only the declared background runtime
Human/Agent opens or invokes an interactive capability?
        ↓ yes → lazy-load the corresponding implementation/runtime/surface
```

Installation and activation are authority gates. Usage is a resource-loading gate.

## 3. Host boundary

App Platform Host MAY eagerly own only generic mechanisms needed to discover and govern plugins:

- Package/Feature lifecycle state;
- lightweight manifest/Contribution metadata;
- authorization and request Context plumbing;
- generic Contribution aggregation;
- generic route/Capability resolution;
- generic runtime dispatch/loading mechanism.

Host MUST NOT eagerly initialize plugin-specific:

- PostgreSQL/database connections;
- durable plugin stores;
- business repositories;
- background timers/schedulers;
- network clients;
- large in-memory indexes;
- plugin page/query data;
- plugin-specific browser bundles;
- model/provider clients;

unless an active Feature explicitly declares a required background runtime.

## 4. Optional application rule

For an optional interactive APPLICATION Package:

```text
not installed
→ catalog metadata may exist
→ no effective navigation/route
→ no plugin runtime initialization
→ no plugin persistence initialization
→ no plugin-specific browser resource loading

installed + active but unopened
→ effective navigation/route may exist
→ implementation remains lazy where feasible
→ no heavy query/data materialization merely for discovery

opened / capability invoked
→ load only the implementation needed for that surface/operation
```

A plugin being first-party does not exempt it from this rule.

## 5. BI Workbench reference proof

`evo-bi-workbench` is the first normative reference:

- Workspace is an optional APPLICATION plugin in the BI / Insight Experience Layer.
- App Platform Host does not publish `/workspace`.
- If the plugin is not installed/active, `/workspace` is absent from effective Experiences.
- Browser bootstrap chooses from effective Experiences rather than assuming Workspace exists.
- Workbench runtime is dynamically imported only after the plugin is active and its page/action is used.
- PostgreSQL personal Workbench state is initialized by the plugin runtime, not Host startup.
- disabling/uninstalling the plugin disposes the runtime.
- Counterparty, Data Import, Personal Agent and future plugins contribute lightweight Workbench items without owning Workspace.

## 6. Contribution rule

A Contribution is metadata, not permission to load every implementation behind it.

Package contributions SHOULD remain declarative and cheap enough for lifecycle/navigation/capability discovery.

Consumers MUST NOT infer that because a contribution is discoverable, its owner runtime must be initialized.

## 7. Browser rule

Browser delivery follows the same principle:

- bootstrap only the generic App Host/Surface resolver needed for the selected surface;
- do not hard-code optional plugin routes as default startup destinations;
- load plugin/surface-specific modules only for the selected effective Experience;
- inactive/uninstalled plugins must not add browser route modules or UI bundles to the active dependency graph;
- mobile/read/task surfaces remain independently loadable where declared.

## 8. Background capability exception

Some active plugins legitimately require background work.

Such work MUST be explicit in Feature/runtime contracts and lifecycle-managed.

```text
interactive plugin
→ lazy by use

declared background provider/worker
→ may initialize on Feature activation
→ stops on disable/uninstall
→ resource budget/health/observability still apply
```

Do not convert ordinary interactive plugins into eager background services merely for implementation convenience.

## 9. Performance acceptance

For optional interactive plugins, architecture acceptance SHOULD prove:

1. route/Experience absent when not installed or inactive;
2. plugin durable store/database is not initialized on Host startup;
3. heavy implementation modules are dynamically loaded or otherwise excluded from the cold path;
4. disabling/uninstalling releases runtime resources;
5. default browser routing still works without the plugin;
6. installing/activating restores the plugin Experience without Host-specific branching.

For high-cost plugins, future performance tests may additionally record cold-start bytes, module counts, memory, connections and initialization latency.

## 10. Permanent placement rule

```text
generic lifecycle + discovery + lazy dispatch
→ App Platform Host

plugin runtime + state + business/BI behavior
→ owning plugin

human rendering primitives
→ Eidos

plugin-specific browser surface
→ owning Experience/plugin, loaded on demand
```

The long-term target is not “zero metadata at startup.” The target is:

> The cost of adding installed-but-unused or uninstalled plugins grows primarily in cheap metadata, not in active runtime resources.
