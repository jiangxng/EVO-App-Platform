# Short-Term Mainline — Agent-Driven App Installation v0.1

**Status:** Active short-term mainline  
**Date:** 2026-09-23  
**Primary owner:** EVO App Platform  
**Cross-project participants:** Enterprise Agent, Eidos, EVO

## 1. User-visible goal

The next short-term milestone is complete when a user can open the system UI and say to the Enterprise Agent:

> "帮我安装一个应用"

and the requested application is actually installed, activated, discovered by Eidos App Host, visible in navigation, and usable.

This is the primary short-term development line. Individual module completion is subordinate to this end-to-end result.

## 2. Canonical end-to-end flow

```text
User
  ↓
Eidos Agent UI
  ↓
Enterprise Agent
  ↓
App Catalog
  ↓
App Manager.planInstall()
  ↓
Package/Feature dependency resolution
  ↓
Install required Packages
  ↓
Activate required/default Features
  ↓
Verify effective Contributions
  ↓
Eidos App Host refresh/discovery
  ↓
New application appears and can be opened
  ↓
Enterprise Agent reports result
```

## 3. Architectural boundary

The Enterprise Agent interprets user intent and invokes public tools.

The Enterprise Agent does **not** directly:

- modify package files;
- alter private EVO/Eidos internals;
- execute arbitrary database changes;
- bypass App Manager lifecycle rules.

App Manager remains the deterministic lifecycle executor:

```text
Agent intent
→ App Manager plan
→ validate
→ install
→ activate
→ verify
```

## 4. Migration strategy for former EC

Do not migrate the entire Experience Compiler repository before this milestone.

Extract only the minimum reusable assets needed for Enterprise Agent MVP:

- Agent runtime shell;
- model adapter / replaceable model boundary;
- role/instructions;
- tool calling;
- minimum context assembly;
- minimum durable memory;
- execution/provenance history;
- App Manager tool adapter.

Defer until after the first end-to-end milestone:

- large-scale industry knowledge;
- active web research/crawling;
- advanced learning strategies;
- manufacturing intelligence;
- large-scale knowledge graph/storage;
- complex model routing;
- multi-agent orchestration.

The old Experience-Compiler repository remains an asset source and historical authority during migration.

## 5. Two-stage proof

### Proof A — no EVO dependency

Install a tiny application such as `company-notes`.

Purpose:

```text
Enterprise Agent
+ App Catalog
+ App Manager
+ Package/Feature lifecycle
+ Eidos App Host
```

Expected result:

- Agent discovers the app;
- App Manager produces a deterministic install plan;
- Package is installed;
- default Feature is activated;
- Eidos Contributions become visible;
- page/navigation appears.

### Proof B — EVO dependency graph

Install `trading-lite`.

Purpose:

```text
Enterprise Agent
+ App Platform
+ Eidos
+ EVO
```

Trading Lite should declare required EVO capabilities rather than assume EVO is globally preinstalled.

Expected behavior:

```text
install trading-lite
→ resolve required capabilities
→ detect missing evo.core capabilities
→ install/enable required Foundation Package/Features
→ install Trading Lite
→ activate Trading Features
→ Eidos experience appears
→ verify usable business flow
```

This proves the principle:

> **The user installs an App; the system installs the dependency graph.**

## 6. Definition of done

This mainline is done only when all of the following are demonstrated in a runnable environment:

1. user opens an Eidos-hosted interface;
2. user sends a natural-language install request to Enterprise Agent;
3. Agent discovers a real catalog entry;
4. Agent requests a side-effect-free install plan from App Manager;
5. dependency graph is resolved from Package/Feature/Capability contracts;
6. user intent is executed through App Manager public lifecycle APIs;
7. Package installation status is persisted;
8. default/required Features are activated;
9. effective Contributions are discoverable;
10. Eidos App Host reflects the newly active experience without source-code modification;
11. installed app can be opened and used;
12. Agent reports deterministic success/failure evidence;
13. uninstall/deactivate path can remove current exposure without deleting authoritative historical data owned elsewhere.

## 7. Work priority

Until this milestone is complete, prioritize work that directly closes this path:

```text
Package Manifest
→ Feature Manifest
→ Catalog
→ dependency resolver
→ install plan
→ lifecycle state machine
→ App Manager API
→ Agent tool adapter
→ Eidos App Host discovery
→ reference app
→ EVO capability dependency proof
```

Avoid unrelated platform expansion unless it blocks the end-to-end path.

## 8. Business meaning

This milestone is intentionally user-visible.

It proves that the system can convert a plain-language business request into a governed, deterministic application change without requiring the user to understand Package, Feature, Capability, EVO, Eidos, manifests, or dependency graphs.

That is the first concrete proof of the LLM-native product direction.
