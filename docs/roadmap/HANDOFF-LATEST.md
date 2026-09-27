# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `P1.5-2026-09-28-01`  
**Snapshot time:** `2026-09-27T16:06:10.197Z`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Personal Agent P1.5 — Durable Agent Operations
ACTIVE
```

## Latest closed live slice

**p1.5a-context-memory-governance-inventory: LIVE_PASS**

Deterministic Context Memory governance inventory passed Human browser verification: exact reader-visible FACT count/list was obtained without ranked retrieval; A was historical CANONICALIZED_DUPLICATE -> B and B was effective.

Authority: `docs/roadmap/P1.5-DURABLE-AGENT-OPERATIONS.md`

Evidence:

```json
{
  "totalCount": 2,
  "complete": true,
  "scope": "READER_VISIBLE_CURRENT_CONTEXT",
  "snapshotDigest": "7472698bccf6c1c5b3bdb2b21c3a03c261508a6a2c6f3c2dc79810d051016288",
  "duplicateMemoryId": "memory:proposal:memory-proposal:bef0947e-4563-4618-9c1f-68f8452b0421",
  "canonicalMemoryId": "memory:proposal:memory-proposal:cb145bad-bd4f-4bcd-b0b6-c4d105a5082a",
  "duplicateState": "CANONICALIZED_DUPLICATE",
  "canonicalEffective": true,
  "readOnly": true
}
```

## Current open live gate

**p1.5b-generic-durable-agent-action-receipt: DEPLOYED_HUMAN_GATE_READY**

P1.5B durable Agent Action Receipts are deployed. Human live verification must prove one real Personal Agent WRITE produces a SUCCEEDED durable receipt and that a fresh chat can READ that receipt plus the domain Proposal without repeating the WRITE.

Acceptance:

- Human asks Personal Agent to stage one clearly test-only Memory Proposal; no acceptance into durable Memory
- WRITE executes through ordinary Host authorization
- Agent observation contains a durable receipt with status SUCCEEDED
- receipt includes receiptId, invocationId, idempotencyKey, current Principal/Context, toolId, inputDigest and result entity references
- resultEntityRefs includes the staged proposalId
- a fresh Personal Agent chat performs READ only using agent.action.receipt.list/get
- fresh chat identifies the prior SUCCEEDED receipt without repeating context.memory.proposal.create
- fresh chat uses proposalId from receipt evidence to read the domain Proposal
- Proposal domain READ remains authoritative for current proposal state
- test Proposal remains PENDING until Human rejects it; it is never accepted as formal Memory
- no duplicate Proposal is created merely to recover continuity

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
- Do not restart PR #84–#100 work unless a new regression provides current evidence.

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
- state P1.4X and P1.5A as Human LIVE PASS and closed
- state P1.5B Generic Durable Agent Action Receipt Human live verification as the current open gate
- state current deployed runtime revision 4e16fd5d5c0eb9cd3d0f3e8eb715ec6a3b18f5a7 and Railway service
- identify PR #101 as the latest deployed behavioral change
- explain that receipts prove Agent WRITE execution state but do not replace domain authority
- explain that orphan REQUESTED receipts fail closed and are not automatically retried
- identify the old dc107947 content Proposal as a do-not-accept stale action
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
