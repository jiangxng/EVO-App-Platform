# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `P1.6-2026-09-28-01`  
**Snapshot time:** `2026-09-28T00:01:05.402Z`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Personal Agent P1.6 — Run-backed Experience Integration
ACTIVE
```

## Latest closed live slice

**p1.5-durable-agent-operations: LIVE_PASS**

P1.5A governance inventory, P1.5B durable Action Receipts and P1.5C resumable Agent Runs are closed. Production P1.5C proved bounded multi-request runs, process-restart recovery, durable READ convergence and a material WRITE surviving restart with exactly one unchanged SUCCEEDED receipt and no duplicate WRITE.

Authority: `docs/roadmap/P1.5-DURABLE-AGENT-OPERATIONS.md`

Evidence:

```json
{
  "p1_5A": "HUMAN_LIVE_PASS",
  "p1_5B": "HUMAN_LIVE_PASS",
  "p1_5C": "PRODUCTION_LIVE_PASS",
  "productionCommit": "35bc1e5f50677a6dca739e290892ad60afbc07c4",
  "deploymentId": "ca0bc54b-2b32-4bc3-a7a0-288a60d75eab",
  "readRunId": "agent-run:b6bd76b7-0438-4ef9-a4a0-b453407f6faf",
  "restartRunId": "agent-run:955bdd34-3f6b-4763-a630-1b158297eceb",
  "writeRunId": "agent-run:af8ce534-f17a-436e-af00-246547390643",
  "writeReceiptId": "agent-action-receipt:3236edfb214c3dcc86dc0c3c4fb8bb2b74dadad75c8561ccfe0e713c02fe5081",
  "writeProposalId": "memory-proposal:974893e1-6a91-4473-8de8-e3e395342f62",
  "duplicateWrite": false
}
```

## Current open live gate

**p1.6a-eidos-run-backed-chat-orchestration: IMPLEMENTATION_READY**

Migrate the Personal Agent interaction surface from one synchronous enterprise-agent.chat request to Host durable enterprise-agent.run.start/get/resume orchestration. The UI should feel like the same chat while the transport automatically advances bounded run slices, survives reconnect/refresh and renders durable progress/final state.

Acceptance:

- Eidos starts a durable Agent Run instead of relying on one long enterprise-agent.chat request for the primary path
- UI stores runId as interaction transport state
- UI automatically resumes PAUSED runs without asking the Human to manage slices
- refresh/reconnect can recover run state by runId
- terminal SUCCEEDED renders the final Personal Agent reply
- BLOCKED/FAILED/CANCELLED are rendered explicitly without pretending success
- material WRITE Action Receipt evidence remains attached and no completed WRITE is repeated
- current Principal/Context and Human approval boundaries remain authoritative on every resume
- session conversation history behavior remains compatible
- legacy enterprise-agent.chat remains available only as bounded compatibility fallback until migration certification
- no UI-only hidden state is required to recover an active run

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `35bc1e5f50677a6dca739e290892ad60afbc07c4`
- Deployment: `ca0bc54b-2b32-4bc3-a7a0-288a60d75eab`
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

- state current milestone as Personal Agent P1.6 — Run-backed Experience Integration
- state P1.4X and all P1.5 slices A/B/C as closed LIVE PASS
- state P1.6A Eidos run-backed chat orchestration as the current open gate
- explain that P1.5C production validation proved a paused run with a material WRITE survives Railway restart without duplicate WRITE
- state current deployed runtime revision 35bc1e5f50677a6dca739e290892ad60afbc07c4 and latest successful restart deployment ca0bc54b-2b32-4bc3-a7a0-288a60d75eab
- identify both P1.5B and P1.5C smoke-test Proposals as test-only PENDING and do-not-accept
- preserve Action Receipt indeterminate fail-closed semantics
- preserve current Principal/Context and Human authority on every run resume
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
