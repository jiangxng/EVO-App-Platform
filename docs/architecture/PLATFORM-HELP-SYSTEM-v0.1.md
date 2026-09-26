# Platform Help System v0.1

**Status:** P0 implemented  
**Date:** 2026-09-26  
**Scope:** EVO App Platform + Eidos Workbench  
**Owner split:** Eidos owns Help rendering/Workbench interaction contracts; App Platform owns Help aggregation, lifecycle, context, search/index policy and governance; every Package owns the help content for the vocabulary and behavior it introduces.

## 1. Why Platform Help is a platform capability

EVO is intended to become a long-lived enterprise operating environment. Help therefore cannot be treated as a static FAQ page or a documentation website bolted on after product development.

Platform Help is a governed knowledge surface that must serve at least five consumers:

1. ordinary users learning how to complete work;
2. administrators operating Providers, permissions, Packages and enterprise configuration;
3. plugin authors extending the platform;
4. support/operations staff diagnosing failures and migrations;
5. LLM/Agent runtimes that need deterministic, version-aware product knowledge.

The Help system is part of the product contract. A capability that exists in code but has no discoverable explanation, task guidance, troubleshooting path or machine-readable reference is not fully governable over a multi-year product lifecycle.

## 2. Design principles

### HELP-1 — Help is owned where behavior is owned

Eidos defines the generic Help presentation contract.

App Platform aggregates and governs effective Help content.

Each Package owns the Help content for its own:

- concepts;
- actions;
- settings;
- Provider behavior;
- commands;
- error codes;
- workflows;
- migration notes.

A central Help package MUST NOT become the owner of unrelated product vocabulary.

### HELP-2 — Human-readable and machine-readable are the same knowledge base

Do not maintain one manual for humans and another hidden prompt corpus for LLMs.

Canonical Help source must carry stable metadata so the same content can be:

- rendered in Workbench;
- searched;
- cited by an Agent;
- validated in CI;
- linked from routes/actions/errors;
- version-filtered;
- audited for freshness.

### HELP-3 — Context beats manual browsing

The Help system should know the current product context:

```text
current Package / Feature
current route / Experience / page
current Capability
current action / command
current Provider
current error code
current enterprise scope
current locale
```

The user should normally see relevant Help before needing to understand the whole documentation taxonomy.

### HELP-4 — Help is version-aware

Every Help document must declare what it applies to.

Help for an old Provider contract, removed setting, deprecated action or previous migration MUST NOT silently appear as current guidance.

### HELP-5 — Help is lifecycle-aware

Installed Package help remains discoverable even when the Package/Feature is disabled, because disabled software often needs troubleshooting or repair guidance.

Uninstalled Package help may still be available as catalog preview/documentation if the catalog source exposes it, but it is not part of the effective installed-product Help set.

### HELP-6 — Help never bypasses authorization

Public product Help can be broadly visible.

Environment-specific operational material, enterprise policy, security-sensitive runbooks or customer-specific knowledge must be filtered server-side through platform authorization where required. UI filtering alone is not a security boundary.

### HELP-7 — Search quality does not redefine truth

Deterministic metadata/full-text retrieval is the baseline.

Semantic/vector/LLM retrieval may improve ranking and answers, but it never becomes the canonical source of truth and never silently rewrites Help content.

## 3. Content architecture

The Help corpus should use one stable taxonomy across platform and plugins.

### 3.1 Start

Purpose: help a new user become productive.

Examples:

- What is EVO?
- Understanding Workbench
- Installing an App
- Configuring a Provider
- First enterprise setup

### 3.2 How-to

Task-oriented guidance.

Examples:

- Bind an LLM Provider to a workspace
- Disable a plugin
- Change a Provider setting
- Re-run a health probe
- Recover from an unavailable Provider

### 3.3 Concepts

Explain product models and mental models.

Examples:

- Package / Feature / Contribution
- Capability
- Provider
- Principal / Scope / Authorization
- Ledger Runtime
- Workbench Activity

### 3.4 Reference

Precise behavior and contract information.

Examples:

- Provider health states
- binding scope precedence
- action codes
- settings fields
- error codes
- compatibility rules

### 3.5 Troubleshooting

Symptom → diagnosis → safe action.

Examples:

- Provider resolution ambiguous
- plugin failed signature verification
- runtime unavailable
- Package cannot activate
- authorization denied

### 3.6 Administration and operations

Operator-focused Help:

- trust stores;
- Provider governance;
- audit;
- deployment;
- backup/recovery;
- migration;
- observability;
- incident procedures.

Sensitive operational material may require authorization.

### 3.7 Development and extension

Plugin/Provider developer material:

- Plugin Protocol;
- Contribution contracts;
- Eidos integration;
- Provider implementation;
- CI requirements;
- compatibility;
- release lifecycle.

### 3.8 Change, migration and deprecation

Users need to know not only how the system works now, but what changed.

Every material breaking/deprecating change should be able to link:

```text
old behavior
→ new behavior
→ affected versions
→ migration path
→ rollback/compatibility notes
```

Release notes alone are not sufficient for long-lived operational guidance.

## 4. Canonical Help source format

P0 should use repository-owned Markdown because it remains easy for humans and LLMs to author and review.

Markdown must carry structured frontmatter and compile into a versioned Help document contract.

Illustrative source:

```yaml
---
helpVersion: "0.1.0"
id: "evo.app-platform.providers.binding"
ownerPackageId: "evo-app-platform"
locale: "en"
kind: "how-to"
title: "Bind a Provider"
summary: "Create an explicit scope-aware Provider binding."
audiences: ["admin"]
tags: ["provider", "binding"]
appliesTo:
  package: ">=0.1.0 <0.2.0"
contexts:
  capabilities: ["llm.inference"]
  routes: ["/providers/llm.inference"]
  actions: ["provider.binding.update"]
  errorCodes:
    - "PROVIDER_RESOLUTION_AMBIGUOUS"
related:
  - "evo.app-platform.providers.health"
  - "evo.app-platform.authorization"
---
```

The compiled runtime contract should contain metadata plus a safe document body.

P0 MUST NOT accept arbitrary executable HTML or JavaScript from Help content.

Long term, Eidos may compile Markdown into a deterministic document/block AST for rendering. Markdown is an authoring format, not an execution boundary.

## 5. Proposed Help document metadata

The eventual public contract should support at least:

```text
contractVersion
id
ownerPackageId
ownerFeatureId?
locale
kind
title
summary
audiences[]
tags[]
appliesTo
contexts
related[]
sourceRevision?
lastReviewedAt?
body / bodyRef
```

### Context selectors

A Help document may declare zero or more:

- packageIds
- featureIds
- capabilityIds
- experienceIds
- route paths
- action codes
- command codes
- Provider IDs
- settings namespaces / keys
- error codes

These selectors power contextual Help without coupling Eidos to App Platform private implementation.

## 6. Ownership model

### Eidos owns

- generic Help viewer capability;
- Help navigation/search UI contracts;
- document rendering;
- accessibility;
- responsive/mobile behavior;
- semantic Help icon;
- focus/keyboard interaction;
- generic document outline/breadcrumb presentation.

Eidos does not own EVO-specific content.

### App Platform owns

- Help index aggregation;
- Package/lifecycle discovery;
- contextual matching;
- search API;
- authorization filtering;
- version filtering;
- Help health/coverage diagnostics;
- governance rules;
- platform-owned Help documents;
- Workbench Help activity composition.

### Package owns

- content for the behavior it introduces;
- translations/locales it claims to support;
- links from its own routes/actions/errors/settings;
- migration/deprecation notes;
- Help updates when behavior changes.

### Enterprise/customer extensions may own

- customer SOP;
- internal policy;
- local operating procedures;
- enterprise-specific troubleshooting;
- training content.

These should enter through an explicit enterprise knowledge/Help extension boundary and authorization rules, not by editing product Help in-place.

## 7. Package integration

Long term, Help should become a first-class declarative Package contribution, conceptually:

```text
kind: eidos.help-document
document:
  ...
```

The exact public contract must be added to Eidos/Plugin Protocol rather than implemented as App Platform private UI data.

Help has a management lifecycle similar to Settings:

- installed Package Help is discoverable while enabled;
- Help remains discoverable while the Package is disabled;
- uninstall removes it from the installed Help corpus;
- catalog preview may expose package Help before install;
- Package removal must not leave orphaned active Help routes.

This is intentionally different from runtime Contributions that only become effective while a Feature is active.

## 8. Search architecture

### P0 — deterministic local index

Start with:

- title;
- summary;
- headings;
- tags;
- exact context selectors;
- error codes;
- action/command names;
- package/capability identifiers.

Use deterministic scoring and filtering.

This gives reliable behavior without requiring embeddings or an LLM.

### P1 — semantic retrieval

Add an optional Help Search Provider for:

- embeddings;
- semantic ranking;
- multilingual retrieval;
- query expansion.

The Provider may improve ranking but cannot hide deterministic exact matches such as an error code or action identifier.

### P2 — Agent-assisted Help

The Enterprise Agent may answer Help questions using retrieved Help documents.

Requirements:

- cite Help document IDs/titles;
- respect version/scope/authorization filters;
- distinguish product Help from general model knowledge;
- provide a direct “Open in Help” action;
- never claim unsupported behavior when the Help corpus does not establish it.

## 9. Workbench presentation

The Help experience should use existing Workbench semantics.

### 9.1 Activity Bar

Add a platform-owned **Help** Activity in the `secondary` placement.

Rationale:

- Help is globally available but not the user's primary application context;
- secondary placement matches Settings/account/support-style utilities;
- it remains stable independent of installed business Apps.

Conceptually:

```text
Primary
  Apps
  Agent / contributed work contexts
  ...

Secondary
  Help
  Settings
```

The final order remains an Eidos/App Host product decision.

### 9.2 Help Side Panel

Selecting Help opens a `side-route` Help Navigator.

Initial Side Panel:

```text
Help
[ Search help... ]

Context
  About this page
  Current task
  Current error (when present)

Browse
  Start
  How-to
  Concepts
  Troubleshooting
  Administration
  Development

Installed
  App Platform
  Eidos
  <installed packages...>
```

The Side Panel is for discovery and context, not long-form reading.

### 9.3 Main Workspace

Selecting a result opens the document in the Main Workspace.

Document layout:

```text
Breadcrumb
Title
Summary
Applies to / version / owner

Document content

Related
  related concepts
  next task
  troubleshooting
```

For larger documents, an outline/TOC may appear as a local document region rather than another global navigation tree.

### 9.4 Contextual Help

A page/action/error should be able to open Help with a context object.

Examples:

```text
Provider Bindings page
→ Help suggests binding scope + health + authorization

PROVIDER_RESOLUTION_AMBIGUOUS
→ Help opens exact troubleshooting article

Extension Manager package signature failure
→ Help opens Package integrity troubleshooting
```

Do not hard-code Help article IDs throughout UI implementations. Product surfaces should emit semantic context; the Help index resolves matching documents.

### 9.5 Agent relationship

Help and Agent complement each other:

```text
User asks Agent
→ Agent searches authorized Help corpus
→ explains
→ cites Help
→ optionally opens article in Workspace
```

Help remains usable without Agent or network access.

### 9.6 Mobile

On mobile:

- Help Activity opens the Help Navigator as the active surface;
- selecting an article switches to Workspace/document view;
- browser back/navigation returns to Help results;
- no desktop-only hover, resize or split-view behavior is required.

## 10. Context contract

App Platform should eventually provide a generic Help context similar in spirit to `PlatformRequestContext`.

Conceptually:

```ts
HelpContextV010 {
  contractVersion
  locale
  packageId?
  featureId?
  experienceId?
  route?
  capability?
  action?
  command?
  providerId?
  errorCode?
  principal?
  scope?
}
```

Principal and Scope are used for visibility/authorization, not for changing factual Help content.

## 11. Localization

Help follows the existing app-owned localization principle.

A Package owns its translated Help just as it owns its UI vocabulary.

Rules:

- Help document IDs are language-independent;
- locales are separate variants of the same document ID;
- fallback rules are explicit;
- unsupported translations fall back visibly rather than silently pretending translated coverage;
- machine identifiers, command names, error codes and contract IDs are never translated.

P0 requires English (`en`) as the canonical fallback for every required Help document and ships complete Simplified Chinese (`zh-CN`) variants for the Platform Help seed corpus.

Locale resolution is **per document ID**, not per corpus. For a requested locale, each document independently resolves through:

```text
exact locale
→ language-only variant when explicitly present
→ configured fallback locale(s)
→ en
```

Therefore one missing translation never removes unrelated Help documents from the index. Stable document IDs, routes, context selectors, action/command names, Capability IDs and error codes remain identical across locale variants. CI compares machine metadata across translations and fails on drift.

## 12. Governance model

Platform Help becomes a permanent governance responsibility.

### 12.1 Ownership

Every required Help document must have an owner Package.

Core platform Help has an explicit App Platform/Eidos owner split.

No owner = governance defect.

### 12.2 Coverage

Generate a Help coverage report per Package.

Example dimensions:

```text
has overview
has getting-started path
has key how-to
has settings reference
has error/troubleshooting coverage
has admin guidance
has migration guidance when needed
localization coverage
context links valid
last review status
```

Not every Package needs every category. Requirements depend on Package type and capabilities.

### 12.3 Freshness triggers

Do not rely only on calendar reminders.

Help review must be triggered when:

- public contract changes;
- route/action/settings schema changes;
- error behavior changes;
- Provider semantics change;
- compatibility range changes;
- Package/Feature lifecycle changes;
- security/authorization flow changes;
- migration/deprecation is introduced.

A periodic review date remains useful as a secondary safety net.

### 12.4 CI validation

P0 CI should eventually validate:

- unique Help IDs;
- owner namespace;
- required metadata;
- supported kind/audience values;
- valid version syntax;
- valid related-document references;
- duplicate locale variants;
- required-locale coverage;
- cross-locale machine-metadata equivalence;
- canonical BCP-47 locale tags;
- broken internal links;
- referenced action/command/error/context identifiers where machine-verifiable;
- no raw executable HTML/scripts;
- no secret values in Help source.

Later CI can validate coverage policy per Package maturity level.

### 12.5 Feedback loop

The Help system should measure product/documentation gaps without becoming surveillance.

Useful aggregate signals:

- searches with no result;
- articles opened from errors;
- repeated troubleshooting paths;
- “helpful / not helpful” feedback;
- broken links;
- stale version hits;
- Agent Help questions with no authoritative answer.

Do not record secret input or unrestricted business content merely for Help analytics.

## 13. Help health as a platform diagnostic

Long term, Help should expose its own health:

```text
documents indexed
packages covered
broken references
stale documents
missing required locales
orphaned context links
unresolved search terms
```

This belongs in operator diagnostics and may eventually appear in Extension Manager/Platform status.

## 14. What not to do

Do not:

- create one giant hard-coded Help page;
- copy all repository architecture Markdown directly into the product;
- maintain separate human and LLM manuals;
- allow arbitrary plugin HTML/JS Help rendering;
- let Help silently expose restricted enterprise runbooks;
- make semantic search/LLM answers the source of truth;
- centralize plugin-owned vocabulary under App Platform;
- tie Help availability to an external network;
- use chat history as the Help database.

Architecture documents, ADRs, developer references and end-user Help may share source knowledge, but their presentation and audience are distinct.

## 15. P0 implementation

P0 is implemented as the current baseline and remains intentionally small.

### Eidos P0

1. define a generic Help document/viewer contract;
2. provide safe Help document rendering;
3. provide Help Navigator/search result rendering;
4. ensure responsive/mobile and accessibility behavior;
5. provide/confirm a semantic Help icon.

### App Platform P0

1. define Help source metadata and compiler/validator;
2. add platform Help index service;
3. add `/v1/help/search`, `/v1/help/documents/:id` and context-query boundaries;
4. add platform-owned Help Activity in Workbench secondary placement;
5. add Help Navigator side route;
6. open selected Help document in Main Workspace;
7. seed a small authoritative Help corpus;
8. add CI validation and coverage report;
9. synchronize Help status into project authority files.

### First seed corpus

Do not attempt to document the entire platform.

Start with the concepts/features already stable at P0:

1. Workbench overview;
2. Package / Feature / Contribution;
3. Plugin lifecycle: Install / Enable / Disable / Uninstall;
4. Provider model;
5. Provider binding scopes and precedence;
6. Provider health states and active probe;
7. Authentication vs authorization;
8. Extension Manager;
9. Settings vs Secrets;
10. troubleshooting:
   - Provider ambiguous;
   - Provider unavailable;
   - authorization denied;
   - plugin integrity/signature failure;
   - runtime failed/unavailable.

This seed is enough to validate the architecture with real product content.

## 16. P1

After P0 proves the model:

- `eidos.help-document` Package contribution;
- installed-Package Help aggregation;
- contextual Help links from routes/actions/errors;
- localization variants;
- Help coverage dashboard;
- authorization-aware admin/runbook documents;
- catalog preview Help;
- Agent Help retrieval with citations.

## 17. P2 and long-term

- semantic Help Search Provider;
- enterprise/customer Help extensions;
- SOP/knowledge integration;
- release/migration timeline;
- Help feedback analytics;
- automated stale-content suggestions;
- LLM-assisted draft updates;
- compatibility-aware historical Help;
- optional external documentation publishing from the same canonical sources.

LLM-generated Help changes must remain reviewable repository changes or governed enterprise content updates. The LLM may propose updates, but cannot silently rewrite authoritative Help because product behavior changed.

## 18. Definition of done for Help P0

Help P0 is complete when this scenario passes:

```text
open Workbench
→ Help exists in secondary Activity Bar
→ Help Side Panel opens
→ search "provider binding"
→ deterministic result appears
→ select result
→ article opens in Main Workspace
→ article shows owner/version
→ switch locale where translated content exists
→ navigate to Provider Bindings
→ contextual Help suggests relevant articles
→ simulate PROVIDER_RESOLUTION_AMBIGUOUS
→ exact troubleshooting Help is discoverable
→ disable an installed plugin
→ its installed-package Help remains available for troubleshooting
→ uninstall it
→ installed Help entry disappears
→ CI validates Help IDs/links/metadata
```

No Agent or external search service is required for P0 acceptance.

## 19. Long-term governance rule

From Help P0 onward:

> A material user-visible capability change is incomplete until its Help impact is classified.

The classification may be:

- no Help change required;
- existing Help remains valid;
- Help update required;
- new Help/troubleshooting/migration content required.

This check should eventually become part of the same engineering completion rhythm as tests, public contracts, invariants and project status.


## 20. P0 implementation evidence

Current implementation:

- Eidos `help-document@0.1.0` safe semantic renderer with localized renderer-owned chrome;
- Eidos `catalog-browser` optional deterministic local search with localized search chrome;
- active App Host locale propagation into experience/page loading;
- per-document locale fallback with stable Help identity;
- complete `en` + `zh-CN` seed corpus;
- vendored Eidos revision `9b07e3d6da885f25b048ad79979239b823d84ef3`;
- canonical sources under `help/content/**/*.md`;
- source compiler/index in `manager/help-system.ts`;
- Workbench secondary Help activity at `/help`;
- Help articles open in Main Workspace through normal App Host routing;
- `GET /v1/help/search`, `GET /v1/help/context` and `GET /v1/help/health`;
- `tools/help-validate.mjs` as a Platform CI governance gate;
- 14 initial English Help documents covering the stable P0 platform foundations and common failure modes.

P0 intentionally does not yet introduce a Plugin Protocol `eidos.help-document` Contribution, semantic/vector search, enterprise/customer Help extensions or Agent answer generation. Those remain later layers over the same canonical model.


## 21. Design-language enforcement

Platform Help does not own a parallel visual system.

The only supported P0 composition is:

```text
Eidos Workbench Activity
→ Eidos catalog-browser
→ Eidos help-document
→ Eidos Productive Design Language tokens/styles
→ Eidos semantic Icon Registry
```

App Platform may supply content, lifecycle/context data and localization resources. It MUST NOT introduce Help-specific CSS, inline visual styling, raw standard-control HTML, copied SVG icons, or a competing component hierarchy for ordinary Help/Workbench surfaces.

A reusable visual or interaction requirement that Eidos cannot express is implemented in Eidos first and then consumed by App Platform.

`tools/eidos-design-language-validate.mjs` enforces this boundary in Platform CI.
