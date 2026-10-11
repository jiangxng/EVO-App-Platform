# AI Project Bootstrap

This file is the stable entry point for every fresh ChatGPT / LLM / Agent conversation working on EVO App Platform.

Architecture authority: `docs/architecture/PROJECT-CONTINUITY-PROTOCOL-v0.1.md`.

Do not reconstruct project state from chat memory.

## Mandatory startup order

A fresh session MUST read, in order:

1. `AI-BOOTSTRAP.md`
2. `project.status.json`
3. the file referenced by `project.status.json.handoff`
4. `LLM.md`
5. `llm.foundation-map.json`
6. only the architecture / roadmap authority files referenced by the current task or by `project.status.json`

Do not load the entire repository by default.

## Source-of-truth rule

Conversation history, ChatGPT Memory, model memory, and prior assistant summaries are helpful context only.

They are never the authority for:

- the current milestone;
- what is already implemented;
- what already passed Human validation;
- the current production deployment;
- which Proposal / Memory / migration must not be repeated;
- the next live acceptance gate.

Those facts come from the repository, primarily `project.status.json` and the current handoff.

If chat memory conflicts with repository state, repository state wins.

## Continuation rule

Before proposing or implementing work, answer these from repository evidence:

```text
Where are we now?
What is already PASS?
What is still OPEN?
What must NOT be repeated?
What is the next smallest real gate?
```

If these cannot be answered, inspect the referenced authority documents before acting.

## Current product model

The Person-first root remains authoritative, with the 2026-09-30 enterprise-definition correction:

```text
Human
  └── Personal Agent
        ├── Personal Context
        │     └── Personal Context Memory
        └── authorized Enterprise Context(s)
              └── authoritative Business Definitions

Experience Compiler
  └── enterprise/industry knowledge + learning + experience
```

The product-facing Agent is Personal Agent. The machine/package name `enterprise-agent` remains compatibility debt.

Read `docs/architecture/ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md` before Enterprise Context, EOG, SOP, EC or Ledger Runtime ownership work.

Target ownership:

- EC knows, learns and proposes;
- Enterprise Context defines and governs;
- EOG designs/navigates the enterprise graph and aggregates peer-plugin views;
- EVO Ledger Runtime executes deterministic business effects;
- Eidos realizes deterministic human interaction.

Existing Enterprise Context Memory / SOP / Observatory implementations are preserved compatibility assets where noted; do not mistake historical implementation location for target ownership.

For Personal Agent state, long conversations, memory, Context Assembly, Agent Runs, retrieval, EC learning evidence or storage decisions, `docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md` is the project constitution. AI-native is a semantic/governance architecture, not a JSON/JSONL storage mandate. Keep Conversation, Working State, Personal Context Memory and EC learning distinct; preserve source evidence; treat summaries as derived/versioned; prefer mature production storage for durable queryable state; keep models replaceable.

## Human authority rule

The user has delegated ordinary engineering leadership and execution to the LLM.

Proceed without asking for confirmation when the next step is bounded, reversible, and already implied by the accepted goal.

Stop only when a real Human authority decision is required, including:

- accepting/rejecting governed durable Memory;
- destructive or irreversible action;
- business trade-off or requirement reinterpretation;
- credential/security decision;
- material production data mutation not already authorized.

## Durable progress rule

Every accepted project step must leave repository evidence.

At minimum, when project state materially changes:

1. update the structured `project.status.json.projectContinuity` snapshot;
2. run `npm run continuity:render` to regenerate `docs/roadmap/HANDOFF-LATEST.md`;
3. run `npm run continuity:validate`;
4. update or add the relevant architecture/live-certification authority document;
5. add regression/CI evidence when behavior changed.

Do not hand-edit HANDOFF-LATEST as an independent source of truth.

A chat-only decision is not durable project state.

## New-chat anti-amnesia acceptance

A fresh ChatGPT/LLM session is considered project-continuous only if, after reading the startup set above, it can correctly state:

- current milestone;
- latest closed live slice;
- current open live gate;
- current deployed revision;
- latest important implementation PRs;
- any dangerous stale action that must not be repeated.

No previous conversation transcript should be required.

## Scope

This protocol solves engineering/project continuity.

It is separate from Personal Agent product-level Context Memory recall. Personal Agent cross-session recall is validated through its own Host Memory tools and governance contracts.
