# Project Continuity Protocol v0.1

**Status:** authoritative architecture rule  
**Scope:** EVO-App-Platform engineering continuity across ChatGPT conversations, LLMs, Agents and time

## 1. Problem

A long-running AI-native engineering project cannot rely on one chat conversation as its project database.

A fresh ChatGPT conversation may retain some cross-chat Memory, but it does not inherit the prior conversation's complete working context. That creates a dangerous failure mode:

```text
new chat
→ partial old memory / old handoff
→ stale project state reconstructed as current
→ already-closed work is reopened
→ current live gate is lost
→ old unsafe actions may be repeated
```

For a project intended to live for years or decades, this is unacceptable.

## 2. Invariant

```text
No critical project state may exist only in chat context.
```

Chat history is a collaboration surface, not the authority for project progress.

## 3. State layers

Keep these layers distinct:

```text
Conversation History
= current-chat discourse continuity

ChatGPT / model Memory
= selective cross-chat assistance

Context Memory
= governed durable product knowledge

Project Status
= authoritative engineering progress/state

HANDOFF-LATEST
= generated human/LLM-readable projection of Project Status

Host READ
= current runtime/platform truth
```

No layer may impersonate another.

## 4. Source of truth

The authoritative current engineering state is:

```text
project.status.json
```

The stable fresh-session entry point is:

```text
AI-BOOTSTRAP.md
```

The stable human/LLM continuation document is:

```text
docs/roadmap/HANDOFF-LATEST.md
```

`HANDOFF-LATEST.md` is generated from the structured `projectContinuity` snapshot inside `project.status.json`.

Dated handoffs remain historical evidence. They are never current merely because their filename looks recent.

## 5. Fresh-session startup

Every fresh ChatGPT / LLM / engineering Agent session must read, in order:

1. `AI-BOOTSTRAP.md`
2. `project.status.json`
3. `docs/roadmap/HANDOFF-LATEST.md`
4. `LLM.md`
5. `llm.foundation-map.json`
6. task-specific authority documents only as needed

The session must not continue implementation until it can answer:

```text
What milestone are we in?
What live slice most recently passed?
What gate is currently open?
What version is actually deployed?
What recent PRs materially changed the state?
What stale actions must not be repeated?
```

## 6. Anti-stale rule

Repository state wins over:

- ChatGPT Memory;
- model memory;
- prior assistant summaries;
- old conversation transcripts;
- a dated handoff selected by guess;
- a stale local copy.

The only current handoff is the document referenced by `project.status.json.handoff`.

For v0.1 that path is fixed to:

```text
docs/roadmap/HANDOFF-LATEST.md
```

If `llm.foundation-map.json.currentHandoff` disagrees, CI fails.

## 7. Structured current snapshot

`project.status.json.projectContinuity` contains the minimum state a fresh LLM needs:

- snapshot ID and timestamp;
- current milestone and milestone status;
- latest closed live slice;
- current open live gate;
- production preview/deployment revision;
- recent material mainline PRs;
- explicit `doNotRepeat` stale-action guards;
- fresh-session acceptance criteria.

Do not hide critical continuation state only inside prose.

## 8. Generated handoff

Use:

```bash
npm run continuity:render
```

to regenerate:

```text
docs/roadmap/HANDOFF-LATEST.md
```

Use:

```bash
npm run continuity:validate
```

to verify:

- Bootstrap references the canonical startup set;
- `project.status.json.handoff` points to `HANDOFF-LATEST.md`;
- current milestone is consistent;
- production deployment evidence is consistent;
- closed canonicalization state is consistent with the P1.4X evidence;
- `LLM.md` requires the fresh-session bootstrap;
- `llm.foundation-map.json.currentHandoff` cannot regress to a dated handoff;
- generated HANDOFF-LATEST exactly matches the structured snapshot.

## 9. CI

`.github/workflows/project-continuity.yml` runs on every push and pull request.

A stale or manually-diverged HANDOFF-LATEST fails CI.

Platform CI also executes the continuity validator.

## 10. Update triggers

Update the continuity snapshot whenever any of these materially changes:

- current milestone;
- live gate status;
- Human acceptance result;
- latest closed live slice;
- production deployment revision;
- a new behavior-changing PR relevant to the current mainline;
- a new dangerous stale action / rollback prohibition;
- next Human decision/gate.

Not every code commit needs a new project snapshot. The snapshot changes when project continuation semantics change.

## 11. Branch rule

The continuity snapshot describes accepted/mainline state, not speculative feature-branch intent.

A feature PR may prepare the next state, but it must not mark a live gate PASS before the required Human/runtime evidence exists.

## 12. Deployment rule

Code merged to `main` is not automatically equivalent to production state.

Where a live checkpoint depends on Railway or another runtime, record:

- source repository/branch;
- deployed commit;
- deployment ID;
- deployment status;
- persistent-state posture where relevant.

A fresh session must distinguish "merged" from "deployed" and "deployed" from "Human live PASS".

## 13. Historical handoffs

Existing dated handoffs are valuable historical architecture evidence and must not be deleted merely because a newer state exists.

Their role is:

```text
historical reasoning / architecture evidence
!=
current project continuation pointer
```

## 14. ChatGPT new-chat behavior

When the Human opens a new ChatGPT conversation, the safe continuation prompt is intentionally small:

```text
继续 EVO-App-Platform。
先从 GitHub 读取 AI-BOOTSTRAP.md，并按它规定的顺序恢复当前项目状态。
不要根据聊天记忆猜进度。
恢复后先告诉我：当前里程碑、最近 LIVE PASS、当前开放 gate、线上版本、禁止重复动作。
```

After that bootstrap, ordinary project work can continue without importing the previous transcript.

## 15. Long-term direction

This protocol is repository-native and model-independent.

The same project can be handed between:

- different ChatGPT conversations;
- different OpenAI models;
- DeepSeek or future Providers;
- a future engineering Agent;
- a Human engineer;

without requiring one model's hidden memory to survive.

That is the engineering equivalent of the product-level principle:

```text
LLM reasons.
System remembers.
Repository records project truth.
```
