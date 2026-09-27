# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `P1.5-2026-09-27-02`  
**Snapshot time:** `2026-09-27T15:20:06.336Z`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Personal Agent P1.5 — Durable Agent Operations
ACTIVE
```

## Latest closed live slice

**personal-agent-p1.4x-vertical-experience-checkpoint: LIVE_PASS**

P1.4X Human browser checkpoint is closed end-to-end with real LLM behavior. Canonical Memory B is durable across sessions; fresh-session recall supports qualified reasoning; governance/audit/history remain intact; final epistemic-boundary retest passed.

Authority: `docs/roadmap/P1.4X-LIVE-CERTIFICATION.md`

Evidence:

```json
{
  "productionBehaviorCommit": "8ffc87369b3dfe021a3fd3c27f3b4ad6242789de",
  "deploymentId": "34d37eee-45e7-4bb7-a55f-1b811120a8e8",
  "canonicalMemoryId": "memory:proposal:memory-proposal:cb145bad-bd4f-4bcd-b0b6-c4d105a5082a",
  "canonicalization": "LIVE_PASS",
  "freshSessionRecall": "LIVE_PASS",
  "qualifiedReasoning": "LIVE_PASS",
  "epistemicBoundaries": "LIVE_PASS",
  "projectContinuity": "LIVE_PASS"
}
```

## Current open live gate

**p1.5a-context-memory-governance-inventory: DEPLOYED_HUMAN_GATE_READY**

P1.5A deterministic paginated Context Memory inventory is deployed. Human browser must ask a completeness-sensitive question without naming the tool and verify Personal Agent selects inventory, reports exact reader-visible count/completeness, includes historical A/B relation, and does not fall back to ranked search/recall as proof of completeness.

Acceptance:

- fresh Personal Agent conversation or no useful prior discourse
- Human asks for an exact complete governed Memory count/list without naming the inventory tool
- Agent selects context.memory.inventory.list for completeness rather than ranked search/recall
- Agent reports exact reader-visible totalCount and complete state
- Agent paginates using nextCursor until complete=true if more than one page exists
- Agent distinguishes effective Memory from historical superseded/canonicalized Memory
- Agent can identify the 17:00 A/B canonicalization relationship from inventory metadata
- Agent states the completeness scope is READER_VISIBLE_CURRENT_CONTEXT, not physical/global store
- Agent performs READ only and creates no Proposal/WRITE

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `64255c3905a905bf56a91492cdeff6b33ae19a36`
- Deployment: `0e6de7ad-0015-4544-8dd6-18af20568785`
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

## DO NOT repeat stale actions

- Do not accept memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f as the deduplication mechanism.
- Do not create or accept another A→B canonicalization for the known 17:00 duplicate pair; the Human already accepted it and the slice is LIVE PASS.
- Do not reopen P1.4X Memory Canonicalization or fresh-session recall as active gates unless a new regression provides current evidence.
- Do not infer that a Memory belongs in Enterprise Context merely because Personal Context retrieval returned zero results.
- Do not claim ranked Context Memory search/recall is exhaustive inventory or infer global absence/uniqueness from its returned set.
- Do not state a specific downstream operational consequence as authoritative fact unless Memory or another Host source actually states it.
- Do not use ranked retrieval as the P1.5 governance inventory implementation.
- Do not restart PR #84–#97 work unless a new regression provides current evidence.

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
- state P1.4X as Human LIVE PASS and closed
- state P1.5A Context Memory governance inventory Human browser verification as the current open gate
- state current deployed runtime revision 64255c3905a905bf56a91492cdeff6b33ae19a36 and Railway service
- identify PR #99 as the latest deployed behavioral change
- distinguish ranked retrieval from deterministic inventory
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
