# AI-Native Agent Foundation Debt Retirement Route v0.1

**Status:** CURRENT EXECUTION ROUTE  
**Effective:** 2026-10-08  
**Authority:** `docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md`  
**Purpose:** define the bounded debt-retirement sequence that must be followed after CP-03D closes and before CP-05 implementation resumes.

## 1. Why this route exists

Recent production validation exposed two facts at the same time:

1. the Personal Agent is already a real product surface with durable conversations, resumable work and Human-visible recovery;
2. some persistence and long-context foundations are still compatibility-era implementations, especially file-backed Conversation JSONL.

The project must repay debt that would otherwise make later Agent/context capabilities harder or unsafe, but it must not stop the ERP mainline for an open-ended infrastructure rewrite.

The approved sequence is:

~~~text
CP-03D CLOSED_HUMAN_PASS
        ↓
AF-01 Conversation PostgreSQL Authority — CLOSED_PRODUCTION_PASS
        ↓
AF-02 Long-context v0.1 — CLOSED_PRODUCTION_PASS
        ↓
CP-05 Foundation Object mainline resumes
~~~

This route is intentionally small. It is not permission to build the entire future Personal Agent architecture now.

## 2. Governing principles

All work in this route MUST obey:

- `docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md`;
- Conversation, Working State, Personal Context Memory and EC learning remain distinct;
- AI-native does not imply JSONL-first storage, vector databases or all-history model prompts;
- raw Conversation remains source evidence subject to retention policy;
- summaries/checkpoints are derived, versioned, traceable and regenerable;
- mature production technology is preferred;
- model/provider replacement must not erase durable state;
- no migration may weaken authorization, provenance, idempotency or Human authority.

## 3. Gate 0 — CP-03D closure

**Status:** `CLOSED_HUMAN_PASS` on 2026-10-08.

Closure evidence includes same-structure Recipe Human validation and a real production Experience Compiler proof where a successful Human-origin import produced scoped EC experience and a differently structured second file received advisory recommendations without whole-file Recipe reuse. The Human explicitly accepted recommendation-presentation styling as non-gating for this milestone.

Rich Counterparty domain modeling such as Contact, Address, CustomerProfile, SupplierProfile and broader legacy-field destination coverage remains CP-05 through CP-07 scope and does not reopen CP-03D.

Exit state:

`COUNTERPARTY_IMPORT_EC_LEARNING_REUSE_LOOP_PASS`

AF-01 and AF-02 are CLOSED_PRODUCTION_PASS. The bounded Agent foundation debt route is complete; mainline returns to CP-05.

## 4. AF-01 — Conversation PostgreSQL Authority

### Goal

Replace file-backed Conversation JSONL as the authoritative production store with server-side PostgreSQL, without changing Conversation semantics.

### Scope

Implement only what is required for a mature Conversation authority:

- versioned database migrations;
- an App Platform-owned PostgreSQL schema, logically separated from EVO business semantics;
- durable conversation thread rows;
- durable conversation message rows;
- stable message/run/thread identity;
- indexes for principal/context/thread ordering and bounded history reads;
- transactional writes where one logical turn requires atomic persistence;
- server-side pagination/bounded reads;
- retention/archive fields required by the existing Conversation contract;
- migration tooling from current `conversation-threads.jsonl`;
- integrity verification of thread/message counts and identity relationships;
- controlled production cutover;
- rollback posture;
- removal of JSONL from the authoritative runtime path after cutover validation.

### Migration rule

~~~text
create schema/migrations
→ deploy PostgreSQL adapter dark/inactive
→ import existing JSONL
→ verify counts + content + identities
→ cut authoritative reads/writes to PostgreSQL
→ validate refresh/history/recovery/pagination
→ retain old JSONL only as bounded migration backup/export evidence
→ remove JSONL authority path
~~~

Indefinite dual-write is prohibited as the target architecture.

### Acceptance

AF-01 is PASS only when:

- refreshing the browser restores the same authoritative thread from PostgreSQL;
- existing production Conversation history is preserved;
- one Human turn produces one durable user message and one governed Agent continuation;
- thread history supports bounded/paginated reads rather than whole-file reconstruction;
- service restart does not lose Conversation;
- current Personal Agent idempotent turn and single-flight resume behavior still passes;
- migration can prove source-to-target integrity;
- JSONL is no longer the production authority.

Exit state:

`PERSONAL_AGENT_CONVERSATION_POSTGRES_AUTHORITY_PASS`

## 5. AF-02 — Long-context v0.1

### Goal

Prevent long conversations from degrading into full-history prompts, silent truncation or irreversible summary loss.

AF-02 is a foundation slice, not the final Context Compiler.

### Scope

Implement:

- deterministic conversation segmentation boundaries;
- versioned summary artifacts;
- source message coverage references;
- conversation checkpoints;
- explicit compression policy version;
- model/provider/prompt provenance for model-generated summaries;
- extracted active goals, decisions, unresolved questions and relevant tool outcomes;
- a bounded token/context budget;
- a minimal Context Assembly seam that can combine:
  - current Human/authority;
  - current task/run context;
  - recent conversation;
  - relevant checkpoint/summary;
  - explicitly retrieved source messages when necessary;
  - effective tools;
- fallback behavior when summarization fails;
- regeneration capability from retained source conversation.

### Hard rules

- do not overwrite raw Conversation with a summary;
- do not make one summary the permanent truth;
- do not automatically promote summaries into Personal Context Memory;
- do not automatically promote summaries into EC;
- do not introduce a vector database merely to complete AF-02;
- do not build the full future Working State/Planning/EC retrieval system in this slice.

### Acceptance

AF-02 is PASS only when:

- a deliberately long test thread exceeds the normal direct-history budget;
- the model request remains bounded;
- older relevant context can still be recovered from source-backed summaries/checkpoints;
- every summary identifies the source range and policy/model version that produced it;
- the original messages remain retrievable;
- a changed compression policy can regenerate a new summary version;
- provider failure during compression does not corrupt the Conversation;
- normal short conversations remain simple and are not over-processed.

Exit state:

`PERSONAL_AGENT_LONG_CONTEXT_V01_PASS`

## 6. Return to CP-05

After AF-01 and AF-02 are both PASS:

~~~text
resume Foundation Object Program
→ CP-05 Facets / Profiles / related resources
~~~

CP-05 remains:

- Contact;
- Address;
- CustomerProfile;
- SupplierProfile;
- progressive Eidos object-page composition;
- profile-slot extension support.

AF-01/AF-02 MUST NOT be used as a reason to add BI analytics, broad EC features or unrelated Personal Agent expansion to CP-05.

## 7. Explicitly deferred debt

The following are governed long-term directions but are **not required before CP-05** unless a concrete blocking failure appears:

- migrating every Agent Run/event JSONL to PostgreSQL;
- migrating all Context Memory persistence;
- full generic Working State product model;
- full Context Compiler;
- semantic/vector retrieval;
- automatic Personal Agent → EC learning;
- global/cross-enterprise learning;
- multi-agent orchestration;
- large-scale autonomous planning framework.

These are revisited incrementally when real product pressure justifies them.

## 8. Debt trigger rule after CP-05

Future engineering should retire debt when at least one is true:

- it is already causing production reliability or Human UX failures;
- the next feature would otherwise deepen the wrong architectural dependency;
- scale/concurrency makes the compatibility implementation unsafe;
- security/authorization/provenance is weakened;
- recovery/model independence cannot be guaranteed.

Do not retire debt merely because an implementation is aesthetically imperfect.

## 9. Fresh-session continuation protocol

A new ChatGPT / LLM session continuing this route MUST read:

1. `AI-BOOTSTRAP.md`
2. `project.status.json`
3. `docs/roadmap/HANDOFF-LATEST.md`
4. `LLM.md`
5. `llm.foundation-map.json`
6. `docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md`
7. this document
8. `docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md`

Then answer from repository evidence:

~~~text
CP-03D is CLOSED_HUMAN_PASS.

AF-01 is CLOSED_PRODUCTION_PASS.

If AF-02 is open:
continue Long-context v0.1.

If AF-01 and AF-02 are closed:
resume CP-05.

Do not skip forward from chat memory.
~~~

## 10. Completion definition

This debt-retirement route is complete when:

~~~text
CP-03D = CLOSED_HUMAN_PASS
AF-01 = PASS
AF-02 = PASS
CP-05 = ACTIVE
~~~

At that point this document remains roadmap authority/history, while the active milestone returns to the Foundation Object Program.
