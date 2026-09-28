# Enterprise Operating Graph Product Direction v0.1

**Status:** ACTIVE PRODUCT DIRECTION  
**Date:** 2026-09-28  
**Canonical semantic authority:** EVO-15 — Enterprise Operating Graph v0.1

## 1. Product purpose

The immediate goal is not a generic diagramming product and not legacy-data migration.

The product goal is a Human-confirmable enterprise operating model built through Personal Agent + visual direct manipulation.

The intended loop is:

Natural language from enterprise owner
→ LLM extracts/proposes enterprise semantics
→ Personal Agent executes declared model actions
→ visual graph is rendered
→ Human directly edits/confirms the graph
→ the same structured model is updated
→ publish a versioned Enterprise Operating Model

## 2. Reuse, do not duplicate

Graph nodes must bind to existing canonical concepts rather than create App-Platform-specific copies:

- Process
- Transaction Type
- Application
- Command / business action
- Business Fact type
- Metadata
- PostingRule
- LedgerDefinition
- Capability/APQC reference

The graph may store view/layout metadata, but it must not become a second source of Application, Metadata or Ledger truth.

## 3. Product ownership

EVO owns the canonical enterprise/runtime semantics.

App Platform owns:

- installable product/package lifecycle;
- Personal Agent tool/action exposure;
- governed persistence/version workflow for the editing product;
- bindings to Host-owned Applications and providers;
- authorization for model changes.

Eidos should own reusable graph/canvas interaction primitives when implementation begins:

- nodes;
- semantic edges;
- selection;
- pan/zoom;
- direct manipulation;
- property inspection;
- grouping/swimlanes where required;
- keyboard/accessibility behavior.

Eidos must not own EVO business semantics.

## 4. Personal Agent behavior

The Personal Agent is the conversational entry.

The LLM may propose changes such as:

- add a missing process step;
- bind an existing Application;
- identify a missing Transaction Type;
- ask when a fact is recognized;
- identify which Metadata a fact requires;
- highlight a missing ledger consequence.

The Agent performs only declared model actions.

A Human graphical edit and a Human natural-language instruction must modify the same semantic model.

## 4.1 Guidance topology vs enterprise topology

The editor must support two different semantic layers.

**Guidance topology** is reusable expert knowledge. It may come from:

- previously converged `bookkeeping` / `Asloop-Backend` semantics;
- posting-rule templates;
- accounting guidance used by the legacy system;
- APQC/process references;
- future industry templates.

Guidance topology can recommend Application ↔ Business Fact ↔ PostingRule ↔ Ledger relationships and expected upstream/downstream business structure.

It is not enterprise truth.

**Published enterprise topology** is the Human-confirmed model for one enterprise.

The expected loop is:

```text
Guidance Template
→ LLM proposal
→ Personal Agent materializes proposal
→ Human edits/confirms
→ validate
→ publish Enterprise Operating Model
```

The product must make recommended/template-derived relationships distinguishable from enterprise-confirmed relationships.

Legacy semantic genealogy is authoritative evidence, not a requirement to reproduce legacy implementation:

```text
bookkeeping / Asloop
App → Transdata → Policy → Account → TransdataAccount → Balance
                 ↓
EVO
Application → BusinessData → PostingRule → LedgerEntry → LedgerBalance
```

## 5. First implementation target

Enterprise Operating Graph Editor v0.1 should prove only this vertical slice:

1. Human describes a small end-to-end process in Personal Agent.
2. LLM returns a structured proposal.
3. Agent creates/updates semantic graph nodes and edges.
4. Eidos renders the graph.
5. Human can directly change structure/bindings.
6. changes persist and are re-openable.
7. Transaction Type, Application and Ledger nodes reference existing definitions.
8. draft and published versions are distinct.
9. a validation step catches unresolved semantic edges/bindings.

No legacy-data projection is required for this first slice.

## 6. Sequencing

Current order:

Enterprise Operating Graph semantics
→ Graph Editor vertical slice
→ Human + LLM + Agent round-trip
→ reusable graph capability maturation
→ target enterprise model usable
→ only then resume migration projection / Best Data Provider work

## 7. Non-goals

Do not build:

- a ProcessOn clone;
- general-purpose diagram categories;
- a parallel workflow runtime;
- a parallel Application model;
- a parallel Ledger model;
- customer-data migration before the target model is established.

## 8. One-line target

> Personal Agent should let an enterprise owner describe how the business should run, let the LLM structure it, let the Agent materialize it, and let the Human correct the same model visually until EVO has a publishable operating definition.
