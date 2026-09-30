# Enterprise Operating Graph Product Direction v0.1

**Status:** ACTIVE PRODUCT DIRECTION — REBASED 2026-09-30  
**Date:** 2026-09-30  
**Authority:** `ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md`

## 1. Product purpose

Enterprise Operating Graph (EOG) is the visual enterprise-definition graph and an enterprise-wide aggregation/navigation surface.

It is not:

- the enterprise definition repository;
- the parent of every enterprise designer;
- the owner of SOP semantics;
- the owner of report/analysis calculations;
- a workflow runtime;
- a second Ledger Runtime.

The long-term experience is:

```text
Enterprise Context definitions
          ↕
         EOG
   design / navigate
          +
peer plugin contributions
          ↓
enterprise-wide aggregated view
```

## 2. Enterprise Context is the definition authority

EOG reads and writes enterprise definitions through public Enterprise Context definition contracts.

Enterprise Context owns:

- Draft / Published / Effective lifecycle;
- immutable revision history;
- provenance / attribution;
- publication governance;
- authoritative enterprise definition persistence.

EOG MUST NOT become a second definition repository.

The existing EOG-local semantic stores are migration assets where their data has not yet converged to Enterprise Context.

## 3. EOG Core

EOG Core consists of:

- Enterprise Graph semantic model;
- canonical semantic bindings;
- Guidance and Human-confirmed enterprise relationships;
- Enterprise Graph Designer;
- 2D / 3D renderer-independent View State;
- graph actions;
- Human and Personal Agent graph interaction;
- enterprise-definition navigation;
- aggregation/extension points for peer plugins.

EOG Core is an active first-class plugin boundary and remains **CI-gated**.

## 4. Peer plugins, not EOG children

The following are conceptually peer plugins, not EOG submodules:

```text
Enterprise Context
SOP Designer
Enterprise Graph / EOG
Definition Comparison
Posting Rule Designer
Metric Designer
future report/analysis plugins
runtime adapter plugins
```

They communicate through stable public interfaces after App Platform discovery/binding.

App Platform manages the relationship; it should not become the mandatory business-data hop.

## 5. EOG aggregation / "God view"

The EOG "God view" means aggregation, not ownership of all analytics.

Future report/analysis plugins may contribute overlays, indicators, warnings, drill-downs or other views. EOG can aggregate and spatially locate those contributions on the enterprise graph.

The report/analysis plugin portfolio has not yet been designed. Do not invent a mandatory monolithic Reporting Layer or fixed report taxonomy.

## 6. Existing Observatory and analysis assets

The repository already contains working assets for:

- Runtime Facts;
- Time Lens;
- Analysis Overlay;
- EOG Observatory;
- EVO Runtime Observatory adapter;
- Bottleneck analysis;
- SOP Conformance / Deviation;
- trace/path coverage;
- 2D/3D operational projection;
- mobile read proof.

These are valuable implementation assets and MUST be preserved.

They are currently classified:

```text
PRESERVED_ASSET
FUTURE_PLUGIN_EXTRACTION
NON_GATING_FOR_CURRENT_EOG_CORE_CI
```

Future report/analysis/runtime-adapter design will determine their final plugin ownership.

## 7. SOP is not EOG Core

Existing SOP definition/edit/publish and SOP analysis were implemented inside the earlier EOG path. They are preserved, but they are not part of the target EOG Core ownership.

Target:

```text
SOP definition data
      ↓
Enterprise Context

SOP semantic/editor behavior
      ↓
future SOP Plugin

SOP runtime analysis
      ↓
future report/analysis plugin(s), ownership TBD
```

SOP definition/edit/publish and SOP analysis are **not part of the current EOG Core CI gate**. They should gain owning-plugin CI when extraction is formalized.

## 8. Project-specific SOP meaning

"SOP" in this project is not the ordinary step-by-step Standard Operating Procedure definition.

Its intended semantics are:

```text
APQC process reference structure
          +
      time dimension
          ↓
enterprise temporal process definition
```

The model may include:

- process/activity reference;
- sequence/dependency;
- expected start/end;
- duration;
- waiting time;
- deadlines;
- cadence/cycle;
- business calendar;
- trigger;
- condition;
- allowed alternative;
- exception path.

Traditional work instructions/checklists are a separate possible Definition Kind.

The existing machine term `SOP` remains a compatibility name until a deliberate naming migration is justified.

## 9. Visual state

Semantic definition and visual arrangement remain separate.

```text
Enterprise definition
!=
2D/3D View State
```

View State may contain coordinates, camera and renderer-independent presentation state. View changes MUST NOT manufacture enterprise-definition revisions.

Eidos owns reusable rendering/interaction primitives. EOG owns domain composition and graph-definition interaction, not Eidos rendering internals.

## 10. Personal Agent

Personal Agent may help a Human:

- inspect the graph;
- navigate definitions;
- propose definition changes;
- invoke declared editor actions;
- explain contributions from peer plugins.

Personal Agent does not become definition authority.

Material publication remains governed by the owning definition/plugin policy.

## 11. Current sequencing

Current order:

```text
Enterprise Context Business Definition foundation
→ migrate SOP definition authority away from EOG-local storage
→ keep EOG Core CI-gated
→ preserve SOP/analysis assets outside current EOG Core CI
→ continue Web Runtime foundation
→ later plan report/analysis plugin portfolio
→ later extract preserved assets into owning plugins
```

## 12. One-line target

> EOG visually designs and navigates the enterprise definition graph and aggregates peer-plugin views; it does not own every enterprise definition, process model or analytical calculation.
