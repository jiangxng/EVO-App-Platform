# Enterprise Definition, EOG and Intelligence Boundaries v0.1

**Status:** AUTHORITATIVE ARCHITECTURE BASELINE  
**Date:** 2026-09-30  
**Supersedes where conflicting:** earlier assumptions that EVO owns enterprise-definition lifecycle, that Enterprise Context is an enterprise knowledge store, or that SOP/Observatory/analysis are intrinsic EOG submodules.

## 1. Core responsibility model

The current architecture has four primary responsibilities:

```text
Experience Compiler (EC)
= enterprise knowledge + industry knowledge + learning + experience accumulation

Enterprise Context
= enterprise identity/governance + authoritative business definitions

Enterprise Operating Graph (EOG)
= graphical enterprise-definition design/navigation + aggregation surface

EVO Ledger Runtime
= deterministic business-data execution + posting + reconciliation + calculation
```

Personal Agent is a horizontal intelligent interaction surface over these capabilities. It is not the owner of their durable truth.

## 2. Experience Compiler owns enterprise knowledge

All durable enterprise knowledge belongs to Experience Compiler.

Examples include:

- enterprise knowledge;
- industry knowledge;
- cases and experience;
- research;
- methods and learned patterns;
- decision/outcome lessons;
- provenance and evidence for learned knowledge;
- long-term learning and model-replacement/bootstrap assets.

Enterprise Context MUST NOT grow into a parallel knowledge platform.

EC may read governed enterprise definitions and runtime outcomes and may propose improvements, new Drafts or recommendations. EC does not become the authority for published enterprise definitions merely because it produced a proposal.

## 3. Enterprise Context is definition-first and headless

Enterprise Context is the authoritative enterprise definition space.

Its plugin is primarily a headless storage/governance component. It owns definition lifecycle and enterprise scope, not specialized editors.

The former standalone **Business Definition Repository (BDR)** concept is merged into Enterprise Context. A `BusinessDefinitionRepository` remains a useful internal/public capability boundary, but it is not a separate top-level product/plugin.

Target shape:

```text
Enterprise Context Plugin
├── enterprise identity / governance references
├── Business Definitions
│   ├── Application definitions
│   ├── Field / Schema definitions
│   ├── Process / SOP definitions
│   ├── Posting-rule definitions
│   ├── Metric definitions
│   ├── Organization / Responsibility definitions
│   ├── Enterprise Graph definitions
│   └── future definition kinds
│
├── Draft / Published / Effective lifecycle
├── immutable revision history
├── provenance / attribution
├── publication authority
└── public definition interfaces
```

A definition repository validates generic repository invariants such as enterprise scope, immutable revisions, lifecycle transitions, concurrency and attribution.

It MUST NOT absorb every definition kind's domain semantics.

For example, the repository may know that a definition is `kind=SOP`; the SOP plugin/designer owns whether its process nodes, temporal constraints or branch semantics are valid.

## 4. Editors and designers are peer plugins

Enterprise Context must not become a large UI/design application.

Editors/designers are separate, peer plugins that communicate through public interfaces.

Examples:

```text
Enterprise Context  ←→  SOP Designer Plugin
Enterprise Context  ←→  Enterprise Graph / EOG Plugin
Enterprise Context  ←→  Posting Rule Designer Plugin
Enterprise Context  ←→  Metric Designer Plugin
Enterprise Context  ←→  Definition Comparison Plugin
```

These plugins are peers. They are not children of EOG.

App Platform acts as the control plane for install/discovery/binding/authorization/lifecycle. Once resolved, components should exchange data through stable public interfaces without routing every payload through App Platform business logic.

## 5. EOG Core

EOG remains a first-class plugin and **EOG Core belongs in CI**.

EOG Core currently means:

- Enterprise Graph semantic model;
- canonical node/reference bindings;
- enterprise/guidance relation editing;
- Enterprise Graph Designer;
- 2D / 3D renderer-independent View State;
- graph actions;
- Human / Personal Agent graph interaction;
- enterprise-definition navigation;
- aggregation/extension points for future peer plugins.

EOG is not the parent package of SOP, reporting, runtime-observation or analysis plugins.

### EOG "God view"

The long-term EOG "God view" is an aggregation experience.

Future reporting/analysis plugins may contribute:

- indicators;
- overlays;
- warnings;
- status;
- drill-down destinations;
- report views;
- analysis results.

EOG may place or aggregate those contributions over the enterprise graph.

EOG MUST NOT therefore be assumed to own every report calculation or analytical model.

The future report/analysis plugin portfolio has **not yet been planned**. Do not invent a mandatory monolithic Reporting Layer or a fixed list of report plugins before that design work occurs.

## 6. Preserved EOG/SOP analysis assets

The repository already contains valuable implemented capabilities including:

- Runtime Fact contracts;
- Time Lens;
- Analysis Overlay contracts;
- EOG Observatory services/surfaces;
- EVO Runtime Observatory adapter;
- Bottleneck analysis;
- SOP Conformance / Deviation;
- trace/path coverage handling;
- 2D/3D operational projections;
- mobile read proof assets.

These are **preserved implementation assets**.

They MUST NOT be deleted merely because ownership is being corrected.

Their current classification is:

```text
PRESERVED_ASSET
FUTURE_PLUGIN_EXTRACTION
NON_GATING_FOR_CURRENT_EOG_CORE_CI
```

Future architecture work will decide which reporting/analysis/runtime-adapter plugins own them.

## 7. SOP boundary

The existing SOP implementation is also a preserved asset, but SOP is not EOG Core.

SOP definition/edit/publish and SOP analysis are future peer-plugin responsibilities.

Immediate data convergence:

```text
legacy EOG SOP storage
        ↓ migrate
Enterprise Context / Business Definitions
```

EOG-specific SOP stores are not the target authority.

### CI status

Until SOP is extracted into its own plugin:

- SOP definition/edit/publish is preserved but **not part of the EOG Core CI gate**;
- SOP Conformance/Deviation analysis is preserved but **not part of the EOG Core CI gate**;
- later SOP/plugin-specific CI should be introduced when plugin ownership is formalized.

This is a CI ownership decision, not a deletion or deprecation decision.

## 8. Project-specific meaning of SOP

In this project, **SOP does not mean the ordinary internet definition of a Standard Operating Procedure / step-by-step work instruction**.

The intended model is closer to:

```text
APQC process structure
        +
time dimension
        ↓
enterprise temporal process definition
```

APQC provides a process taxonomy/reference structure such as category, process group, process and activity.

The enterprise adds time semantics such as:

- sequence and dependency;
- expected start/end;
- duration;
- waiting time;
- deadline;
- cadence/cycle;
- business calendar;
- trigger;
- conditional path;
- allowed alternative;
- exception path.

A traditional human work instruction/checklist is a different possible Definition Kind and MUST NOT be silently conflated with this process model.

The historical machine name `SOP` may remain for compatibility until a deliberate naming migration is justified.

## 9. Ledger Runtime boundary

EVO Ledger Runtime is intentionally narrow.

It owns:

- deterministic BusinessData execution;
- posting;
- LedgerEntry / LedgerBalance effects;
- reconciliation / hook-up relationships;
- quantity/amount/cost and other deterministic calculations;
- replay / recalculation within its runtime contract.

It does **not** own business-definition Draft/Published/history/version lifecycle.

Runtime receives the currently effective executable definition/compiled input through a stable adapter boundary.

Runtime may retain a semantic digest/hash or other execution evidence when required for reproducibility, but it MUST NOT reinterpret that as definition-version lifecycle ownership.

## 10. Component communication

The preferred model is:

```text
App Platform = Control Plane
Components   = Data Plane / Component Mesh
```

App Platform owns:

- package lifecycle;
- discovery;
- capability/provider binding;
- authorization;
- secrets;
- health;
- isolation;
- upgrade/rollback;
- platform observability.

Business components should communicate directly through stable contracts after binding.

Forbidden direction:

```text
component A
→ App Platform business router
→ App Platform translation layer
→ component B
```

when no governance/control-plane intervention is required.

Preferred direction:

```text
component A
→ public capability/interface
→ resolved component B
```

Direct communication does not permit imports of another plugin's private implementation.

## 11. Immediate convergence order

Current implementation order:

1. establish Enterprise Context Business Definition repository/lifecycle foundation;
2. migrate existing SOP definition data away from EOG-owned storage;
3. preserve existing SOP/EOG analysis assets unchanged unless migration requires an adapter;
4. keep EOG Core CI-gated;
5. keep SOP and analysis assets outside the current EOG Core CI gate;
6. continue Web Runtime foundations independently;
7. plan report/analysis plugin portfolio later;
8. extract preserved analysis/SOP assets only after their future plugin boundaries are designed.

## 12. One-line architecture

> EC knows and learns; Enterprise Context defines; EOG designs and aggregates views; EVO Ledger Runtime executes deterministically.
