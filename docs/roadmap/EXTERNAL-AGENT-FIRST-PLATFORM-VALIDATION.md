# External-Agent-First Platform Validation Roadmap

**Status:** STRATEGIC_PRIORITY_DECISION  
**Date:** 2026-09-30  
**Scope:** Near-term product/platform sequencing after the current atomic Enterprise Context definition-authority gate

## 1. Decision

EVO will use mature external Agents as the next primary validation clients for the plugin platform before continuing deep Personal Agent product development.

The sequence is intentionally changed from:

```text
build Personal Agent deeply
→ expose more plugins through Personal Agent
→ later support external Agents
```

to:

```text
stabilize platform/plugin semantic contracts
→ connect mature external Agents
→ validate plugins independently of the Personal Agent
→ harden capability/identity/authorization/discovery contracts
→ return to Personal Agent
→ make Personal Agent the first-party best client of the now-stable platform
```

This is a sequencing decision, not a rejection of Personal Agent.

## 2. Why this order

Personal Agent is a high-cost product surface because it combines many concerns at once:

- conversational UX;
- durable work/run orchestration;
- memory;
- long-term context;
- model behavior;
- model/provider differences;
- planning;
- proactive behavior;
- Human approval;
- task surfaces;
- mobile/desktop Experience;
- learning;
- eventually EC integration.

If plugin/platform contracts are still moving while Personal Agent is being refined, defects are difficult to classify:

```text
Is the problem:
- the plugin?
- capability semantics?
- context resolution?
- authorization?
- tool discovery?
- model behavior?
- Agent prompt/policy?
- Personal Agent UX?
```

Mature external Agents provide an independent client implementation.

They therefore become a strong platform test.

## 3. Strategic hypothesis

If ChatGPT, Claude and a generic MCP client can all use one plugin correctly without knowing EVO internals, then the plugin/platform boundary is probably healthy.

If only EVO Personal Agent can use the plugin, the platform may still contain hidden coupling.

Therefore:

> External Agent interoperability is not only an integration feature; it is a platform architecture test.

## 4. Near-term role of Personal Agent

Existing Personal Agent assets are preserved.

Do not remove or rewrite:

- durable Agent Runs;
- Conversation Threads;
- Context Memory;
- Action Receipts;
- dynamic Tool Catalog;
- Provider-independent model boundary;
- Human review/approval surfaces;
- existing desktop/mobile Experiences.

Near-term status:

```text
Personal Agent
= PRESERVED / REGRESSION-PROTECTED / NOT PRIMARY FEATURE-EXPANSION TARGET
```

Continue:

- regression fixes;
- security fixes;
- compatibility changes required by shared platform contracts;
- migrations required to consume the same generic capability contracts as external Agents.

Defer:

- new autonomous behavior;
- broad proactive behavior;
- additional memory sophistication solely for Personal Agent;
- broad new Personal-Agent-specific tools;
- major new Agent UX layers;
- EC/Personal learning-loop implementation;
- Agent-to-Agent delegation;
- speculative autonomy.

The Personal Agent should increasingly consume the same Capability Operation Registry as external Agents rather than own special platform APIs.

## 5. Near-term role of Enterprise Context / EOG

Enterprise Context and EOG foundations remain important, but upper-layer expansion is paused after the current atomic definition-authority convergence is safely closed.

Finish the current atomic gate:

```text
Business Definition authority
→ Enterprise Context

EOG
→ graph semantics / design / navigation / aggregation boundary

SOP / Observatory / analysis assets
→ preserved for later peer-plugin extraction
```

Then:

```text
EOG upper-layer feature expansion
= DEFERRED

report/analysis portfolio
= DEFERRED

new SOP product expansion
= DEFERRED
```

External Agents may later become useful validation clients for Enterprise Context/EOG capabilities, but those components should not grow new upper layers merely to support the first External Agent slice.

## 6. New validation philosophy

The next platform question becomes:

> Can an independently developed mature Agent understand and use an installed EVO plugin through public semantic contracts only?

This replaces the weaker question:

> Can our own Personal Agent call this plugin?

The external validation requirement exposes hidden coupling earlier.

## 7. Plugin readiness model

Introduce a conceptual readiness ladder.

### Level 0 — Installed

Package installs and Feature activates.

### Level 1 — Human-operable

Human can use the plugin through Eidos/public product surfaces.

### Level 2 — Semantically callable

Plugin exposes stable platform-neutral Capability Operations with machine-readable schemas and Help.

### Level 3 — Externally discoverable

An authorized generic External Agent can discover the relevant operation without source knowledge.

### Level 4 — Externally usable

A generic MCP/OpenAPI client can execute READ/PLAN operations correctly.

### Level 5 — Multi-Agent portable

At least two independent mature Agent products can use the same operation without plugin business-contract changes.

### Level 6 — Governed WRITE

Selected WRITE operations pass authority, approval, idempotency, receipt and readback verification.

Not every plugin must reach Level 6.

The required level is product-specific.

## 8. First reference plugin

Use Ledger Runtime / Ledger Configurator as the first External Agent reference because it is already real, deployed and business-semantic.

Reference question:

> Tell me the current Ledger Runtime template content for this enterprise.

This tests:

- Human login;
- Principal;
- Enterprise Context;
- delegated Agent authorization;
- plugin lifecycle;
- capability discovery;
- semantic self-description;
- READ authorization;
- protocol projection;
- product adapter;
- no developer knowledge.

This is EA-001 in the External Agent Access Standard.

## 9. Second and third plugin validation targets

After Ledger Runtime READ works, select plugins that test different capability shapes.

Recommended categories:

### Definition-oriented plugin

Enterprise Context Business Definition READ.

Tests:

- revision semantics;
- Draft/Published/Effective distinction;
- governed definition visibility.

### Graph/relationship plugin

EOG READ/navigation.

Tests:

- structured graph resources;
- bounded traversal;
- semantic relationships;
- large result handling.

Do not start with EOG analysis or SOP conformance as the first external integration because those are higher-layer/derived capabilities.

## 10. Required platform foundation

The External-Agent-first strategy depends on a small but real platform foundation:

```text
Production Human Login / Session
        ↓
Principal
        ↓
Enterprise Context Grant
        ↓
authorization.check
        ↓
External Agent / Client identity
        ↓
Delegated Authority Grant
        ↓
Effective Capability Operations
        ↓
MCP/OpenAPI projection
        ↓
External Agent
```

The key is to build only what this vertical requires, but build that vertical deeply.

## 11. Development order

### Step 0 — Close current atomic Enterprise Context definition-authority gate

Do not leave authority migration half-complete.

No new EOG upper-layer scope.

### Step 1 — Production Human login/session

Implement the minimum production-grade request-bound identity boundary.

Preferred first Provider: generic OIDC Provider Package.

Do not build a broad custom IAM suite before needed.

### Step 2 — Capability Operation contract

Implement the generic plugin callable-operation contract and effective registry.

Make Personal Agent capable of consuming this registry later, but do not make Personal Agent the reason for the schema.

### Step 3 — External Agent identity + delegated Grant

Add external actor/client registration and attenuated delegation.

READ-only first.

### Step 4 — Generic MCP READ adapter

Project effective authorized plugin operations.

No ChatGPT-specific business logic.

### Step 5 — Ledger Runtime EA-001

Pass Blind Enterprise Discovery through a generic client.

### Step 6 — ChatGPT Adapter

Optimize connection/setup for ChatGPT without changing capability semantics.

### Step 7 — Claude Adapter

Use Claude as the first portability test.

### Step 8 — Validate additional plugins

Enterprise Context READ, then EOG READ/navigation, then other stable plugins.

### Step 9 — Governed WRITE

Only after READ/PLAN contracts and authorization are stable.

### Step 10 — Return to Personal Agent

Resume deeper Personal Agent product development using the validated platform contracts.

## 12. What "return to Personal Agent" means

When the platform is stable, Personal Agent should no longer need special access paths.

Target:

```text
                Capability Operation Registry
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 Personal Agent       ChatGPT          Claude
        │                │                │
        └────────────────┼────────────────┘
                         ▼
             same governed capabilities
```

Personal Agent can still have first-party advantages:

- deeper Human relationship;
- Personal Context Memory;
- durable Work/Run integration;
- native Eidos UX;
- proactive platform events;
- tighter EC integration;
- richer approval surfaces.

But those are product advantages, not hidden business APIs.

## 13. Success criteria before Personal Agent feature expansion resumes

Do not require every plugin to be perfect.

Resume major Personal Agent expansion when the following platform evidence exists:

1. production Human login/session is real;
2. generic Capability Operation Registry is stable enough for at least two plugins;
3. authorization-aware external discovery works;
4. Ledger Runtime EA-001 passes without developer knowledge;
5. Generic MCP client passes;
6. ChatGPT passes;
7. a second mature Agent product passes without changing Ledger business semantics;
8. at least one non-Ledger plugin passes external READ;
9. plugin deactivate/uninstall removes external exposure;
10. Grant revocation is immediate;
11. audit/receipt correlation is observable;
12. no Personal-Agent-only business API is required for these validations.

## 14. What this strategy intentionally buys us

### Lower Personal Agent development risk

We separate platform defects from Agent behavior defects.

### Faster plugin feedback

A stable mature Agent can test a plugin before EVO's own Personal Agent UX is finished.

### Vendor independence

Multiple external Agent clients pressure-test the semantic boundary.

### Better plugin contracts

Plugins must explain themselves through schemas, Help and stable operations rather than implementation knowledge.

### Stronger future Personal Agent

When development returns to Personal Agent, it inherits already-proven enterprise capabilities.

## 15. What this strategy does not mean

It does NOT mean:

- Personal Agent is abandoned;
- ChatGPT becomes the EVO product Agent;
- external Agents receive Personal Context Memory by default;
- external Agents receive EC knowledge by default;
- every plugin must expose itself externally;
- Human UI becomes optional;
- Eidos becomes less important;
- platform security can be relaxed because external Agents are mature products.

Mature Agent products reduce client-development cost.

They do not reduce EVO's responsibility for identity, authority, isolation and deterministic execution.

## 16. Canonical strategic statement

> Near-term EVO should validate itself as an Agent-neutral plugin platform before spending heavily on first-party Personal Agent refinement.

More concretely:

> Build the platform so mature external Agents can use stable authorized plugin capabilities. Use those independent clients to harden plugin contracts. Then return to Personal Agent and make it the best integrated client of the already-proven platform.

