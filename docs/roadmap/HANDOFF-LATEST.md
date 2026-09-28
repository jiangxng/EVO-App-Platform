# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `P1.8-2026-09-28-01`  
**Snapshot time:** `2026-09-28T09:12:00+08:00`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Personal Agent P1.8 — Conversation Lifecycle & Retention
ACTIVE
```

## Latest closed live slice

**p1.7-durable-conversation-threads: VERIFIED_PASS**

Conversation discourse is now durable Host state: thread foundation, run-bound turns and Eidos transcript recovery are implemented; PR #118 passed 30/30 CI and deployed successfully.

Authority: `docs/roadmap/P1.7-DURABLE-CONVERSATION-THREADS.md`

Evidence:

```json
{
  "p17aPr": 116,
  "p17bPr": 117,
  "p17cPr": 118,
  "p17cCi": "30/30 PASS",
  "productionCommit": "39f346ef790bdc634848b2dba3a51fe24ad6a4bc",
  "deploymentId": "4fd23d70-0a89-4ae0-b1d0-f3c7402a3b17",
  "deploymentStatus": "SUCCESS"
}
```

## Current open live gate

**p1.8a-thread-lifecycle-foundation: IMPLEMENTATION_READY**

Add append-only durable thread lifecycle state so active and archived conversations are explicit Host semantics before retention/purge and UI thread management are added.

Acceptance:

- thread lifecycle is materialized from append-only events
- new threads begin ACTIVE
- archive does not rewrite/delete messages
- archive is Principal + active-Context scoped
- archived thread remains exact-ID readable
- default list excludes archived and includeArchived=true can include them
- conversation history projection still works for archived thread reads but new send to archived thread is rejected
- Context Memory is not affected
- file-backed reconstruction preserves lifecycle state

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `39f346ef790bdc634848b2dba3a51fe24ad6a4bc`
- Deployment: `4fd23d70-0a89-4ae0-b1d0-f3c7402a3b17`
- Status: `SUCCESS`
- Persistent state: `/data`

## Project continuity live validation

**Status:** `LIVE_PASS`

**Scenario:** `FRESH_CHATGPT_CONVERSATION_COLD_START`

USER_CONFIRMED_CURRENT_PROJECT_PROGRESS_WAS_RECOVERED

Authority: `docs/roadmap/PROJECT-CONTINUITY-LIVE-CERTIFICATION.md`

Proved:

- fresh ChatGPT conversation can recover current project progress from repository-native bootstrap state
- previous ChatGPT transcript is not required for basic continuation
- stale dated handoff no longer determines current project state when bootstrap protocol is followed

Not proved:

- every future model will obey bootstrap without being instructed
- all project details can be reconstructed without task-specific authority documents


## Recent mainline changes

- PR #84 — MERGED: Preserve distinct Host tools after repeated READ suppression and add Memory Proposal readback.
- PR #85 — MERGED: Make supersedesMemoryId effective in ordinary retrieval while preserving exact-ID history.
- PR #86 — MERGED: Add append-only Human-reviewed existing-Memory canonicalization.
- PR #88 — MERGED: Converge paraphrased Context Memory READ loops by authoritative evidence.
- PR #89 — MERGED: Add exact-ID historical Context Memory audit.
- PR #90 — MERGED: Add one-shot effective-vs-history audit to reduce sequential LLM/tool latency.
- PR #91 — MERGED: Strengthen deterministic multi-token lexical retrieval.
- PR #92 — MERGED: Record Memory canonicalization LIVE PASS.
- PR #93 — MERGED_DEPLOYED: Add bounded cross-session Context Memory recall with short query expansion and prohibit Context speculation from retrieval misses.
- PR #94 — MERGED_HUMAN_LIVE_PASS: Add repository-native AI-BOOTSTRAP/project.status/HANDOFF-LATEST continuity protocol with anti-stale CI; fresh ChatGPT cold-start recovery was user-confirmed PASS.
- PR #95 — MERGED: Record Human LIVE PASS for fresh-ChatGPT project continuity cold-start recovery.
- PR #96 — MERGED_DEPLOYED: Make ranked Memory retrieval non-exhaustiveness and fact-vs-inference separation durable Personal Agent responsibility rules; context.memory.recall now declares exhaustive=false.
- PR #97 — MERGED: Record fresh-session recall functional pass and PR #96 epistemic retest gate.
- PR #98 — MERGED: Close P1.4X Human LIVE PASS and bootstrap P1.5 Durable Agent Operations.
- PR #99 — MERGED_DEPLOYED: Add deterministic paginated Context Memory governance inventory with exact reader-visible count, historical relation metadata and digest-bound cursor stability.
- PR #100 — MERGED: Record deployed P1.5A inventory Human gate and advance continuity validation beyond closed P1.4X.
- PR #101 — MERGED_DEPLOYED: Add generic durable idempotent Agent Action Receipts for Personal Agent material WRITEs.
- PR #103 — MERGED: Record P1.5B Human WRITE PASS and readback-only gate.
- PR #104 — MERGED: Close P1.5B LIVE PASS and start P1.5C resumable Agent Runs.
- PR #105 — MERGED_DEPLOYED: Add append-only durable resumable Personal Agent Runs with bounded slices and Action Receipt replay safety.
- PR #107 — MERGED_DEPLOYED: Resume a pre-decision crash in the original durable slice instead of inflating slice count.
- PR #109 — MERGED_DEPLOYED: Persist READ convergence across resumable slices after production smoke exposed repeated complete inventory reads.
- PR #110 — MERGED_DEPLOYED: Make Personal Agent recommendations governance-state aware and inventory completeness filter-bounded.
- PR #112 — MERGED_DEPLOYED: Make Eidos Personal Agent chat run-backed by default with automatic resume, reconnect recovery, rich terminal presentation and bounded legacy fallback.
- PR #114 — MERGED_CI_PASS: Add clean Host+Eidos integration proof for multi-slice READ and post-WRITE reconnect with no duplicate WRITE.
- PR #116 — MERGED: Add durable Conversation Thread foundation.
- PR #117 — MERGED: Bind durable Conversation Threads to Agent Runs and Host-built history.
- PR #118 — MERGED_DEPLOYED: Make Eidos Personal Agent transcript Host-thread-backed; 30/30 CI PASS and Railway deployment SUCCESS.

## DO NOT repeat stale actions

- Do not accept memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f as the deduplication mechanism.
- Do not accept the P1.5B smoke-test Proposal memory-proposal:55b2b06e-8361-43f9-8f22-408aae7a8f1b as formal Memory; it is test-only and currently PENDING.
- Do not accept the P1.5C smoke-test Proposal memory-proposal:974893e1-6a91-4473-8de8-e3e395342f62 as formal Memory; it is test-only and currently PENDING.
- Do not create or accept another A→B canonicalization for the known 17:00 duplicate pair; canonicalization is already LIVE PASS.
- Do not reopen P1.4X or P1.5A/B/C as active gates unless a new regression provides current evidence.
- Do not use ranked retrieval as governance inventory.
- Do not automatically repeat a material Agent WRITE when its durable receipt is REQUESTED without a terminal event.
- Do not treat an Action Receipt as replacement for domain authoritative state.
- Do not make run recovery depend on browser conversation memory or one long synchronous HTTP request.
- Do not let resume implicitly cross a Human approval boundary.
- Do not recommend governance work that authoritative current state already shows as completed.
- Do not remove enterprise-agent.chat compatibility until the run-backed Eidos path is certified.
- Do not accept the P1.5B smoke-test Proposal memory-proposal:55b2b06e-8361-43f9-8f22-408aae7a8f1b as formal Memory; it is test-only.
- Do not reintroduce enterprise-agent.chat as the primary Personal Agent transport; durable run-backed orchestration is now the default.
- Do not fall back to legacy chat after a durable run has been created.
- Do not make durable conversation threads the authority for Context Memory facts.
- Do not store hidden model chain-of-thought in conversation threads.
- Do not require the browser to resubmit durable thread history once P1.7 thread-backed turns are active.
- Do not restart P1.4X, P1.5 or P1.6 work unless a new regression provides current evidence.
- Do not reopen P1.7 thread durability as the active gate unless a new regression provides current evidence.
- Do not treat durable conversation messages as Context Memory authority; promotion still requires governed Memory Proposal/Review.
- Do not implement ordinary thread deletion as in-place mutation; P1.8 lifecycle/retention must remain auditable.
- Do not let 'New Chat' reuse the prior threadId or Host-built history once P1.8C is implemented.
- Do not reuse Context Memory retention semantics automatically for conversation threads.

## Fresh ChatGPT / LLM startup

A fresh session must read, in order:

1. `AI-BOOTSTRAP.md`
2. `project.status.json`
3. `docs/roadmap/HANDOFF-LATEST.md`
4. `LLM.md`
5. `llm.foundation-map.json`

The repository state wins over ChatGPT Memory, model memory, prior assistant summaries and dated handoff guesses.

A dated handoff is historical evidence unless `project.status.json.handoff` points to it.

## Fresh-session continuity acceptance

A new ChatGPT / LLM session is project-continuous only if it can do all of the following after the startup read:

- state current milestone as Personal Agent P1.8 — Conversation Lifecycle & Retention
- state P1.7 Durable Conversation Threads as verified and closed
- state P1.8A Thread Lifecycle Foundation as current open gate
- state current deployed runtime revision 39f346ef790bdc634848b2dba3a51fe24ad6a4bc
- explain Conversation Thread is durable discourse and is not Context Memory
- explain archive/lifecycle must be append-only and retention is a separate later destructive-governance concern
- do not require the previous ChatGPT transcript to continue

No previous ChatGPT transcript is required.

## State-layer distinction

```text
Conversation History
= current-chat discourse continuity

ChatGPT / model Memory
= selective cross-chat assistance, not authoritative project state

Context Memory
= governed product-level durable knowledge

Project Status + HANDOFF-LATEST
= authoritative engineering-project continuity

Host READ
= current runtime/platform truth
```
