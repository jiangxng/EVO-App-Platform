# Handoff — Proof B Dependency Graph — 2026-09-23

**Status:** Dependency-graph core merged and CI-verified  
**Mainline:** Agent-driven app installation  
**Repository:** `jiangxng/EVO-App-Platform`  
**Branch:** `main`

## 1. Confirmed baseline

Proof A remains user-confirmed locally with the deterministic development AgentModel:

```text
Eidos Agent UI
→ Enterprise Agent
→ App Manager plan/install
→ Feature activation
→ effective Experience
→ Eidos refresh
→ Company Notes visible
```

The real OpenAI-backed local proof is still pending in the user's API-key environment.

## 2. New work completed

Proof B dependency resolution core is now merged.

Added reference packages:

```text
Package: evo.core
type: FOUNDATION_RUNTIME

Features / capabilities:
- evo.business-data → provides evo.business-data
- evo.posting       → requires evo.business-data; provides evo.posting
- evo.ledger        → requires evo.posting; provides evo.ledger
- evo.balance       → requires evo.ledger; provides evo.balance
```

```text
Package: trading-lite
type: APPLICATION

Feature: trading-lite.default
requiresCapabilities:
- evo.business-data
- evo.posting
- evo.ledger
- evo.balance

providesCapabilities:
- trading-lite
```

Trading Lite depends on EVO capabilities, not private EVO implementation or concrete repository structure.

## 3. CI proof

GitHub Actions verified:

```text
planInstall("trading-lite")
→ side-effect free
→ resolves evo.core as dependency
→ resolves required EVO Features
→ no missing capabilities
→ no blockers
```

and:

```text
install("trading-lite")
→ installs evo.core + trading-lite
→ activates only required EVO Features
→ exposes Trading Lite effective Eidos Experience
```

PR:

```text
#1 Proof B: Trading Lite resolves EVO capability dependencies
```

Squash merge commit:

```text
4f45f74b2a302fb0192735d688edf56eeb4288cc
```

## 4. What this does NOT yet prove

Do not mark Proof B complete yet.

Still pending:

- real OpenAI-backed Agent local proof for Company Notes;
- Trading Lite natural-language install through Enterprise Agent;
- Eidos browser refresh showing Trading Lite after install;
- real EVO runtime capability-provider integration rather than reference package declarations only;
- usable Trading Lite business flow;
- durable lifecycle persistence;
- frozen Package/Feature manifest schemas.

## 5. Next order

Continue in this order:

```text
A. Real LLM local proof
   Company Notes through OpenAI AgentModel

B. Agent-visible Trading Lite catalog proof
   user: "帮我安装 Trading Lite"

C. End-to-end Proof B
   Agent
   → plan dependency graph
   → install evo.core required Features
   → install Trading Lite
   → Eidos refresh
   → Trading Lite visible

D. Replace reference EVO capability providers
   with real EVO public capability integration
```

The next product proof remains:

> **The user installs an App; the system installs the dependency graph.**

## 6. Architecture boundary remains unchanged

- App Manager owns deterministic Package/Feature lifecycle.
- Enterprise Agent calls public App Manager tools.
- Eidos consumes effective experience contracts and does not install Packages.
- Apps declare capabilities; App Manager resolves providers.
- App Manager must not know Trading Lite business semantics.
- EVO and Eidos private implementation remain outside App Platform.
