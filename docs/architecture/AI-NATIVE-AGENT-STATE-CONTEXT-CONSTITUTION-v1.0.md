# AI-Native Agent State & Context Constitution v1.0

**Status:** ACTIVE PROJECT CONSTITUTION  
**Effective:** 2026-10-08  
**Scope:** Personal Agent, Conversation, Agent Run, Working State, Context Assembly, Personal Context Memory, Experience Compiler integration, model-provider boundaries, durable storage and long-context handling  
**Authority level:** Project-level architecture constitution. This document governs implementation choices unless explicitly superseded by a later versioned constitution or decision record.

## 1. Purpose

EVO is AI-native because its software architecture treats models as replaceable reasoning engines operating over explicit, governed, durable state.

AI-native does **not** mean:

- storing everything as JSON or JSONL;
- sending all available data to an LLM;
- allowing a model to own durable state;
- treating chat history as memory;
- treating summaries as truth;
- relying on hidden model state;
- adopting experimental infrastructure merely because it is associated with AI.

The canonical principle is:

> **Semantics, authority, provenance, recovery and model independence come first. Storage formats and model vendors are implementation choices serving those invariants.**

## 2. Canonical state model

Personal Agent MUST distinguish the following state classes:

~~~text
Human
  |
  v
Personal Agent
  |
  +-- Conversation
  |     raw visible discourse and message provenance
  |
  +-- Working State
  |     current goal, plan, unresolved questions, artifacts,
  |     Run state, tool outcomes and continuation checkpoints
  |
  +-- Context Assembly
  |     task-specific minimum sufficient model context
  |
  +-- Personal Context Memory
  |     governed person-scoped durable memory and reusable experience
  |
  +-- Enterprise / Runtime Evidence
  |     authorized current facts, business data, definitions,
  |     documents, receipts and runtime evidence
  |
  +-- Experience Compiler
        enterprise / industry experience, cases, patterns,
        methods, provenance and long-term learning
~~~

These layers may reference one another but MUST NOT be collapsed into one generic "memory" store.

## 3. Conversation is durable discourse, not memory

Conversation records what was said and what was presented to the Human.

Conversation MUST:

- be server-authoritative;
- survive browser refresh, model replacement and process restart;
- support pagination, retention, archive and retrieval;
- preserve message identity and relationship to Agent Runs;
- preserve source/provenance needed to reconstruct the Human-visible interaction;
- remain logically separate from Personal Context Memory and EC.

The browser MAY keep lightweight recovery identifiers such as current thread/run selection, but browser-local storage MUST NOT be the authority for conversation content.

A statement appearing in conversation does not automatically become Personal Context Memory or enterprise knowledge.

## 4. Long conversations: preserve originals, derive compression

Long-context handling MUST NOT be implemented by deleting or overwriting old conversation merely to fit a model context window.

Canonical model:

~~~text
raw messages
  -> bounded segments
  -> versioned segment summaries
  -> conversation checkpoints
  -> current working summary
  -> task-specific Context Assembly
~~~

Raw conversation remains the recoverable source evidence subject to retention policy.

Compression artifacts are derived data.

Every durable compression artifact SHOULD identify, at minimum:

- the thread;
- covered message range or source identifiers;
- summary version;
- compression policy version;
- model/provider used when model-generated;
- creation time;
- extracted decisions;
- active goals;
- unresolved questions;
- important entities/references;
- relevant tool outcomes;
- source provenance.

A summary MUST NOT become the only surviving representation of the source conversation.

If a better compression policy is introduced later, summaries MUST be regenerable from retained source evidence.

## 5. Context Assembly is a first-class capability

The system MUST NOT solve long-context problems by dumping all Conversation, Memory, EC knowledge and enterprise data into every model request.

For each inference, the Host assembles the **minimum sufficient authorized context** based on:

- current Human/Principal;
- active Personal/Enterprise Context;
- current goal/task;
- current page/application state;
- current durable Run/Working State;
- recent relevant conversation;
- relevant conversation summaries/checkpoints;
- relevant Personal Context Memory;
- relevant EC enterprise/industry experience;
- relevant EVO/runtime/business evidence;
- effective tool/capability contracts;
- authority and safety constraints;
- model context/token budget.

Conceptual request:

~~~text
system/runtime rules
+ principal and authority
+ current work state
+ recent/relevant discourse
+ relevant personal memory
+ relevant enterprise experience
+ relevant business evidence
+ effective tools
+ constraints
-> model provider
~~~

Context Assembly is governed orchestration, not model-owned hidden state.

## 6. Working State is not hidden in chat

Multi-step work MUST have explicit durable Working State / Agent Run state rather than relying on the model to infer progress from conversation text.

Working State SHOULD be able to represent:

- objective;
- plan/steps;
- completed steps;
- current step;
- unresolved questions;
- artifacts;
- source resource identifiers;
- tool receipts/results;
- Human decisions;
- retry/recovery state;
- continuation checkpoint.

The Agent MUST be able to continue after:

- browser refresh;
- network interruption;
- provider timeout;
- process restart;
- model-provider change;
- conversation compression.

Durable Agent Run, idempotent turns and single-flight resume are required foundations, not optional UX improvements.

## 7. Personal Context Memory is governed person-scoped memory

Personal Context Memory exists to optimize the Personal Agent for the Human over time.

It is not a copy of chat history.

Candidate memory may include permitted:

- stable preferences;
- reusable personal work methods;
- prior Human choices;
- durable feedback;
- personally reusable experience;
- references to prior work artifacts and outcomes.

Automatic persistence from conversation or model inference is prohibited unless explicitly governed by the active memory policy.

Model-generated memory proposals are proposals only until the applicable governance/confirmation boundary is satisfied.

## 8. Experience Compiler is the enterprise/industry learning authority

Experience Compiler owns persistent enterprise/industry learning.

Personal Agent, Applications and EVO Runtime may produce **Experience Evidence**, but they MUST NOT silently write universal learned truth.

Canonical learning path:

~~~text
real work
-> actions / Human corrections / outcomes
-> governed evidence
-> EC evaluation / comparison / synthesis
-> candidate experience / pattern / method
-> later advisory retrieval or compiled deterministic artifact
~~~

The following remain distinct:

~~~text
Conversation Summary
!= Personal Context Memory
!= Experience Evidence
!= EC Experience / Pattern / Rule
~~~

Personal data must not be promoted to enterprise learning merely because it was useful in one conversation.

## 9. Model independence

LLM Providers are replaceable reasoning engines.

No model provider owns:

- Conversation;
- Working State;
- Personal Context Memory;
- EC knowledge;
- Business Definitions;
- business truth;
- authorization;
- durable learning;
- final action state.

Changing OpenAI, DeepSeek, Anthropic, Gemini, a local model or a future provider MUST NOT erase or redefine durable system state.

Provider-specific request/response formats stay behind provider adapters.

## 10. Human authority and governed action

The Personal Agent may inspect, reason, plan, recommend, execute authorized low-risk work and continue durable tasks.

Human decision authority remains explicit for material decisions according to Host policy.

Agent state architecture MUST preserve:

- authorization checks;
- confirmation gates where required;
- receipts/provenance;
- deterministic retry/idempotency;
- distinction between recommendation and committed business truth.

A network retry or UI replay MUST NOT cause the same governed business effect to occur multiple times.

## 11. Required Personal Agent capability direction

The Personal Agent foundation must progressively provide and regression-protect:

1. **Durable Conversation** — server-authoritative threads/messages, pagination, archive, retention and retrieval.
2. **Long-context management** — segmentation, summaries, checkpoints and token-budgeted assembly without losing source evidence.
3. **Durable Working State / Runs** — pause/resume/recover without replaying completed effects.
4. **Turn and action idempotency** — retries and reconnections do not duplicate Human turns or side effects.
5. **Context Assembly** — relevant authorized context is selected per task rather than globally dumped.
6. **Personal Memory** — governed person-scoped durable memory independent from conversation.
7. **Retrieval** — bounded recency, lexical, semantic and hybrid retrieval where justified.
8. **Tool discovery** — effective tools derive from current Principal, Context, lifecycle and authorization.
9. **Planning / acting / observing / verifying** — tool completion is not assumed to equal goal completion.
10. **Provenance and receipts** — important reasoning inputs, actions and outcomes remain auditable at appropriate granularity.
11. **Failure recovery** — provider/network/tool/process failures can resume from durable checkpoints.
12. **EC learning evidence** — useful outcomes can become governed evidence for EC without automatic knowledge promotion.
13. **Model independence** — capability survives provider/model replacement.
14. **Observability and evaluation** — quality, latency, recovery and failure behavior can be measured without making telemetry the source of business truth.

These capabilities are a long-term execution program. They may be delivered incrementally, but new implementations MUST NOT contradict the target.

## 12. Storage constitution

AI-native semantics determine what must be represented and governed. Storage technology is chosen according to mature operational requirements.

### 12.1 Durable product state

Queryable, concurrent, transactional and long-lived product state SHOULD use a mature database.

For current EVO App Platform deployment, PostgreSQL is the preferred authority for durable Personal Agent product state such as:

- conversation threads;
- conversation messages;
- conversation compression/checkpoints;
- durable task/work state where appropriate;
- queryable Agent metadata where appropriate.

Relational columns SHOULD represent stable query/constraint semantics.

PostgreSQL JSONB MAY represent bounded, schema-governed flexible payloads such as:

- presentation metadata;
- context snapshots;
- tool result metadata;
- provenance extensions.

JSONB is not permission to avoid schema design.

### 12.2 JSON / JSONL

JSON and JSONL remain valid for:

- wire contracts;
- configuration;
- append/export formats;
- diagnostics;
- audit/export bundles;
- evaluation corpora;
- replay/migration interchange;
- offline analysis.

JSONL MUST NOT be chosen as the authoritative production database merely because the system is AI-native.

Current file-backed Conversation JSONL is transitional implementation debt once the PostgreSQL conversation authority is delivered and migrated.

### 12.3 Semantic retrieval

Do not introduce a vector database by default.

Start with ordinary database indexes and lexical/full-text retrieval.

Add embedding/vector retrieval only when measured retrieval quality requires it.

When vector search is justified, prefer mature, replaceable infrastructure compatible with the current database/platform (for example PostgreSQL pgvector where appropriate) rather than introducing an experimental distributed subsystem without evidence.

Embeddings are derived indexes, not authoritative knowledge.

## 13. Mature technology default

Production authority MUST prefer mature, broadly understood and operationally supported technologies.

Experimental technology MAY be used only when:

- there is a concrete capability gap not reasonably solved by mature technology;
- it is isolated behind a replaceable contract/provider;
- authoritative source data remains recoverable without it;
- failure degrades safely;
- rollout and rollback are explicit;
- its adoption has measured evidence.

"AI-native" is not an exception to engineering maturity.

## 14. Provenance and reconstructability

Important derived intelligence MUST remain traceable to source evidence.

This includes:

- conversation summaries;
- memory proposals;
- accepted memories;
- EC experience;
- semantic retrieval results when persisted;
- compiled recipes/rules produced from learned experience.

The platform SHOULD be able to answer:

~~~text
Where did this come from?
What source evidence did it cover?
Who/what produced it?
Which model/policy/version was used?
Was a Human involved?
What later superseded or contradicted it?
Can it be regenerated?
~~~

## 15. Storage must not redefine ownership

Moving data to PostgreSQL does not change semantic ownership.

Examples:

- Conversation in PostgreSQL is still Conversation, not Memory.
- Personal Context Memory in PostgreSQL is still person-scoped Memory, not EC.
- EC persistence remains EC-owned even if the physical database technology is also PostgreSQL.
- Enterprise Context remains definition/governance authority, not a generic AI memory bucket.
- EVO Runtime remains deterministic business truth and execution evidence.

Physical co-location MUST NOT collapse logical boundaries.

## 16. Current migration implication

The project SHALL converge Conversation from file-backed JSONL authority to server-side PostgreSQL authority through a controlled migration.

Required characteristics:

~~~text
create versioned DB schema/migrations
-> import existing Conversation JSONL
-> verify thread/message counts and integrity
-> cut reads/writes to PostgreSQL authority
-> production validate refresh/history/pagination/recovery
-> retain old JSONL only as bounded migration backup/export evidence
-> remove JSONL from authoritative runtime path
~~~

Do not maintain indefinite dual-write as the target architecture.

This migration should be executed in bounded slices and must not require rewriting unrelated Agent semantics.

## 17. Evolution rule

This Constitution defines long-term invariants, not a frozen implementation.

Implementations may improve as models, databases and retrieval methods evolve.

A change MAY replace:

- database adapter;
- model provider;
- summarizer;
- retrieval algorithm;
- context-ranking strategy;
- transport;
- UI implementation.

A change MUST NOT silently replace:

- semantic ownership;
- Human authority;
- provenance;
- source-evidence recoverability;
- model independence;
- idempotency;
- authorization boundaries;
- the distinction between Conversation, Working State, Personal Memory and EC learning.

Any intentional exception requires:

1. explicit architecture rationale;
2. evidence that the invariant is no longer appropriate;
3. migration/compatibility plan;
4. rollback posture;
5. update or supersession of this Constitution.

## 18. Fresh-LLM rule

Before materially changing Personal Agent state, Conversation, long-context handling, summarization, Personal Context Memory, Context Assembly, Agent Runs, semantic retrieval or EC learning integration, a fresh LLM MUST read this Constitution.

The minimum questions are:

~~~text
Which state class does this belong to?
Who owns its semantics?
What is authoritative source evidence?
Is this durable or derived?
How is it recovered after model/process replacement?
How is it authorized?
How is it prevented from becoming accidental Memory or EC knowledge?
Why is this storage/retrieval technology appropriate for production?
~~~

If these questions are not answered, implementation must not proceed merely because a local shortcut is convenient.
