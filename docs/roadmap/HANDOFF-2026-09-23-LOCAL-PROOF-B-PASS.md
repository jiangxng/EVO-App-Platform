# Handoff — Local Proof B PASS — 2026-09-23

**Status:** User-confirmed local end-to-end Proof B PASS  
**Mainline:** Agent-driven App installation → real EVO capability integration  
**Repository:** `jiangxng/EVO-App-Platform`  
**Branch:** `main`

## 1. User-confirmed Proof B

The user pulled the latest EVO-App-Platform and Eidos branches and confirmed the local Proof B run is green.

Confirmed path:

```text
Eidos Browser App Host
→ user: "帮我安装 Trading Lite"
→ Enterprise Agent
→ app.catalog.list
→ app.install.plan
→ capability dependency resolution
→ app.install.execute
→ evo.core dependency installed/activated
→ trading-lite installed/activated
→ effective Eidos Experience refreshed
→ Trading Lite appears
→ Trading Lite reference page renders
```

This establishes the product proof:

> The user installs an App; the system installs the dependency graph.

The confirmation used the deterministic development AgentModel unless explicitly stated otherwise. Do not count the real OpenAI-backed model proof as complete.

## 2. Architecture demonstrated

The local proof confirms that:

- Enterprise Agent does not require Trading Lite-specific install logic.
- App Manager resolves declared capabilities/providers.
- Trading Lite does not import EVO private implementation.
- Eidos does not install Packages and does not contain Trading Lite-specific source logic.
- Eidos dynamically discovers the effective Trading Lite Experience after lifecycle activation.
- Foundation dependencies can be installed because an application requires their capabilities.

## 3. Current reference limitation

The current `evo.core` package in EVO-App-Platform is a reference capability provider used to prove dependency resolution.

It is **not yet the real EVO runtime integration**.

The Trading Lite page is also a minimal Eidos-compatible reference form. Its `trading-lite.create-order` command is not yet wired to the authoritative EVO business runtime.

Therefore do not describe Proof B as proving the full Trading Lite business application.

## 4. Next mainline

The next mainline is to replace the reference boundary with real public EVO capabilities while preserving the proven package graph:

```text
Trading Lite
→ public EVO capability contract
→ authoritative EVO command/business-data runtime
→ posting
→ ledger
→ balance
→ public query/result
→ Eidos
```

Start with one thin vertical business flow, not a broad Trading Lite implementation.

Recommended first flow:

```text
Create Sales Order
→ immutable BusinessData / command result
→ posting
→ ledger effect
→ balance/query
→ visible result in Trading Lite
```

The integration must use EVO public contracts only. Do not import EVO private modules into EVO-App-Platform or Trading Lite.

## 5. Still pending

- live real-LLM installation proof;
- real EVO capability-provider integration;
- real Trading Lite command/query flow;
- durable App Manager lifecycle persistence;
- frozen Package Manifest schema;
- frozen Feature Manifest schema;
- uninstall/deactivate end-to-end behavior;
- production authentication/authorization/security.

## 6. Continuation rule

Do not redesign the proven Agent → App Manager → dependency graph → Eidos path unless new evidence requires it.

The next proof should answer:

> Can an installed App use real EVO public capabilities to perform an authoritative business transaction without crossing repository-private boundaries?
