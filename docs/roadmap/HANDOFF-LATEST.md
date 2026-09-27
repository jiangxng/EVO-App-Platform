# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `P1.5-2026-09-28-03`  
**Snapshot time:** `2026-09-28T06:37:00+08:00`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Personal Agent P1.5 — Durable Agent Operations
ACTIVE
```

## Latest closed live slice

**p1.5b-generic-durable-agent-action-receipt: LIVE_PASS**

A real Personal Agent WRITE produced a durable SUCCEEDED receipt linked to a test Proposal, and a fresh Personal Agent chat later recovered that receipt and current Proposal state using READ only without repeating the WRITE.

Authority: `docs/architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md`

Evidence:

```json
{
  "receiptId": "agent-action-receipt:bd82451335a2acf0e657fb4c04dcfaa6cfce8d1ee09e00711bfaf0df595fc52e",
  "receiptStatus": "SUCCEEDED",
  "invocationId": "agent-tool-invocation:bd82451335a2acf0e657fb4c04dcfaa6",
  "proposalId": "memory-proposal:55b2b06e-8361-43f9-8f22-408aae7a8f1b",
  "proposalState": "PENDING",
  "crossChatReadback": true,
  "repeatedWrite": false,
  "receiptVsDomainBoundary": "PASS"
}
```

## Current open live gate

**p1.5c-resumable-agent-runs: ARCHITECTURE_IMPLEMENTATION_READY**

Implement durable resumable Personal Agent runs so long work can survive HTTP disconnects/process restarts and continue from durable run state while preserving Action Receipt and Human authority boundaries.

Acceptance:

- every resumable run has durable runId and Principal/Context ownership
- run state is materialized from append-only events
- run states are explicit and terminal states are immutable
- one execution slice performs bounded work and persists before returning
- resume uses runId and Host authority rather than conversation memory
- completed tool observations and Action Receipt references survive resume
- resume does not repeat a completed material WRITE
- indeterminate WRITE receipts remain fail-closed
- browser can reconnect and inspect run status/progress
- process restart preserves run state when file-backed
- resume rechecks current Principal/Context authorization
- Human approval boundaries remain explicit; resume never silently approves pending governance

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `4e16fd5d5c0eb9cd3d0f3e8eb715ec6a3b18f5a7`
- Deployment: `952825f9-6c7f-4f5f-ad04-a6a7b6286ba4`
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

## DO NOT repeat stale actions

- Do not accept memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f as the deduplication mechanism.
- Do not create or accept another A→B canonicalization for the known 17:00 duplicate pair; the Human already accepted it and the slice is LIVE PASS.
- Do not reopen P1.4X Memory Canonicalization or fresh-session recall as active gates unless a new regression provides current evidence.
- Do not infer that a Memory belongs in Enterprise Context merely because Personal Context retrieval returned zero results.
- Do not claim ranked Context Memory search/recall is exhaustive inventory or infer global absence/uniqueness from its returned set.
- Do not state a specific downstream operational consequence as authoritative fact unless Memory or another Host source actually states it.
- Do not use ranked retrieval as the P1.5 governance inventory implementation.
- Do not reopen P1.4X or P1.5A as active gates unless a new regression provides current evidence.
- Do not use ranked retrieval as a governance inventory; P1.5A inventory is the completeness surface.
- Do not automatically repeat a material Agent WRITE when its durable receipt is REQUESTED without a terminal event.
- Do not treat an Action Receipt as replacement for domain authoritative state.
- Do not weaken the durable receipt requirement merely to preserve older WRITE tests; update test Host fixtures instead.
- Do not accept the P1.5B smoke-test Proposal memory-proposal:55b2b06e-8361-43f9-8f22-408aae7a8f1b as formal Memory; it is test-only and currently PENDING.
- Do not reopen P1.4X, P1.5A or P1.5B as active gates unless a new regression provides current evidence.
- Do not make P1.5C resume depend on browser conversation memory or one long synchronous HTTP connection.
- Do not let resume implicitly cross a Human approval boundary.
- Do not restart PR #84–#103 work unless a new regression provides current evidence.

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

- state current milestone as Personal Agent P1.5 — Durable Agent Operations
- state P1.4X, P1.5A and P1.5B as Human LIVE PASS and closed
- state P1.5C Resumable Agent Runs as the current open gate
- explain that P1.5B proved cross-chat WRITE execution continuity without repeating the WRITE
- state current deployed runtime behavior revision 4e16fd5d5c0eb9cd3d0f3e8eb715ec6a3b18f5a7
- identify the P1.5B smoke-test Proposal as test-only PENDING and do-not-accept
- preserve Action Receipt indeterminate fail-closed semantics in P1.5C
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
