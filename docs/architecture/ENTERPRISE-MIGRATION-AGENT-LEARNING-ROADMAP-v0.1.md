# Enterprise Migration Agent Learning Roadmap v0.1

**Status:** Active product/agent roadmap  
**Date:** 2026-09-28  
**Depends on:** EVO Enterprise Data Abstraction & Migration Learning Architecture v0.1

## 1. Product position

Personal Agent is person-first, but enterprise migration is expected to become a major enterprise onboarding and implementation entry point.

The migration conversation is not ordinary chat. It is a guided, resumable work surface for building and validating structured enterprise context.

Target:

```text
Human conversation
→ Enterprise Context
→ Metadata model
→ Business Fact mapping
→ Best Data Provider
→ EVO BusinessData dry run
→ Ledger replay
→ Reconciliation
→ Cutover
```

The durable object is a Migration Workspace, not a message transcript.

## 2. Agent migration responsibility

The Agent must learn to:

1. discover source systems;
2. profile source structures;
3. classify data as metadata / fact / derived state / snapshot / ledger result / tool/technical;
4. recognize Material Flow and Money Flow;
5. distinguish physical goods and virtual/service deliverables;
6. propose semantic mappings with confidence and evidence;
7. ask Humans only for unresolved or consequential decisions;
8. generate or configure a Best Data Provider;
9. run dry migration through public EVO BusinessData boundaries;
10. explain reconciliation differences;
11. preserve Human decisions and corrections as structured learning evidence.

## 3. Chat behavior

Conversation is a control plane.

For deterministic decisions use direct actions:

```text
[确认映射]
[修改含义]
[查看证据]
[跳过]
[运行样本]
[查看差异]
```

Do not force the Human to reply with prose when a safe declared action is available.

For open-ended discovery, use conversation.

## 4. Migration Workspace target model

```text
MigrationWorkspace
├─ enterpriseContextRef
├─ sourceSystems[]
├─ dataProfiles[]
├─ classificationProposals[]
├─ metadataMappings[]
├─ factMappings[]
├─ providerSpecifications[]
├─ openQuestions[]
├─ humanDecisions[]
├─ dryRuns[]
├─ reconciliationResults[]
└─ approvals[]
```

All major artifacts are versioned.

## 5. Training strategy

Do not begin with model fine-tuning.

Order:

```text
Architecture
→ Contracts
→ Tools
→ Curriculum
→ Evaluations
→ Shadow real-enterprise use
→ EC learning
→ Fine-tuning only if still justified
```

### Stage A — Vocabulary

Load the EVO migration vocabulary as required Agent context.

Acceptance:
- Agent can explain Decision Data vs Tool Data;
- Metadata vs Fact vs Balance;
- Material vs Money Flow;
- physical vs service deliverable.

### Stage B — Structured classifier

Agent outputs validated classification proposals with:

- class;
- semantic candidate;
- confidence;
- evidence;
- unresolved questions.

Acceptance:
- no free-form-only migration analysis for bounded classification tasks.

### Stage C — Legacy curriculum

Training/evaluation corpus from:

- bookkeeping;
- Asloop;
- EVO certified business scenarios.

Acceptance:
- fixed regression suite;
- negative examples;
- model-provider comparison.

### Stage D — Synthetic enterprise migrations

Known-answer datasets for trading, service, manufacturing and mixed enterprises.

Acceptance:
- semantic reconstruction accuracy;
- Human correction count;
- fact-vs-balance error rate;
- reconciliation quality.

### Stage E — Shadow customer migration

Agent proposes; Human approves.

Acceptance:
- no autonomous production cutover;
- corrections captured as structured evidence;
- every consequential mapping traceable.

### Stage F — Experience Compiler learning

Generalize reusable patterns, not raw customer data.

Acceptance:
- pattern versioning;
- provenance;
- customer data isolation;
- measurable reduction in Human correction burden.

### Stage G — Optional parameter training

Only after stable high-quality evidence exists.

Possible:
- SFT;
- preference optimization;
- distillation.

Parameter training is not allowed to replace missing contracts, tools or authorization.

## 6. Training triggers

Add or improve curriculum when:

- Humans repeatedly correct the same semantic mapping;
- Agent confuses balances with facts;
- Agent treats service as physical stock;
- Agent starts posting before metadata is understood;
- Agent overfits legacy table names;
- dry-run reconciliation shows systematic gaps;
- an industry introduces an uncovered semantic class;
- a model/provider change regresses migration evaluations.

Response order:

```text
contract
→ context/tool
→ examples
→ evaluator
→ behavior policy
→ parameter training
```

## 7. Product goals

### P0 — Repository knowledge freeze

- EVO canonical migration architecture documented.
- App Platform roadmap points to it.
- Fresh LLM must not reconstruct this from conversation memory.

### P1 — Migration Classification Contract

Build a public, machine-readable schema for:
- source asset;
- classification;
- candidate semantic meaning;
- confidence;
- evidence;
- Human disposition.

### P2 — Migration Evaluation Harness

Build repeatable test cases from legacy systems and EVO reference scenarios.

### P3 — Migration Workspace MVP

Persistent workspace + Eidos Experience.

### P4 — Metadata Discovery Provider

One source connector/provider that can profile a real source and generate structured proposals.

### P5 — Business Fact Mapping + EVO dry run

Generate canonical BusinessData in isolated migration scope.

### P6 — Reconciliation Experience

Show quantity/money/ledger differences with evidence and direct actions.

### P7 — Shadow Pilot

Run one real enterprise migration with Human confirmation.

### P8 — EC learning loop

Promote reusable patterns into Experience Compiler.

## 8. Guardrails

- Agent inference is proposal, not enterprise truth.
- No direct raw AI write into Actual EVO BusinessData.
- Production cutover requires governed Human authorization.
- Enterprise-specific semantics stay scoped until repeated evidence justifies generalization.
- Customer raw data is not automatically shared into cross-enterprise learning.
- New model providers must pass the same migration evaluation suite.
- A model that is more eloquent but less accurate on migration semantics is a regression.

## 9. Success measure

The long-term metric is not “number of conversations”.

It is:

```text
time to understood enterprise
↓
Human decisions required
↓
semantic correction rate
↓
migration exceptions
↓
reconciliation gap
↓
time to trusted EVO production
```

## 10. One-line target

> The Personal/Enterprise Agent should progressively become able to understand an unfamiliar enterprise from its metadata and historical records, turn that understanding into governed data-provider and BusinessData mappings, and improve from each migration without depending on one model's transient context or memory.
