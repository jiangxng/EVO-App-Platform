# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `P1.4X-2026-09-27-01`  
**Snapshot time:** `2026-09-27T13:22:04.537Z`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Personal Agent P1.4X — Vertical Experience Checkpoint
LIVE_CERTIFICATION_IN_PROGRESS
```

## Latest closed live slice

**context-memory-canonicalization: LIVE_PASS**

Real A→B duplicate canonicalization is Human-accepted; ordinary retrieval returns only B while exact-ID audit preserves A+B and no third Memory was created.

Authority: `docs/roadmap/P1.4X-LIVE-CERTIFICATION-MEMORY-CANONICALIZATION.md`

Evidence:

```json
{
  "duplicateMemoryId": "memory:proposal:memory-proposal:bef0947e-4563-4618-9c1f-68f8452b0421",
  "canonicalMemoryId": "memory:proposal:memory-proposal:cb145bad-bd4f-4bcd-b0b6-c4d105a5082a",
  "proposalId": "memory-canonicalization-proposal:534175fa-fde5-42f1-8a54-510f4fa7900a",
  "canonicalizationId": "memory-canonicalization:4e1d97e8-1bad-4e4c-9591-a2117263eedc",
  "effectiveQuery": "仓库 17:00 截单",
  "effectiveCount": 1,
  "effectiveScore": 0.7,
  "effectiveSignal": "SUMMARY_TOKENS_ALL",
  "exactIdAudit": "A_AND_B_PRESENT"
}
```

## Current open live gate

**fresh-session-context-memory-recall: READY_FOR_LIVE_RETEST**

In a fresh Personal Agent conversation, ask whether an 18:00 order can still be handled the same day without mentioning 17:00 or any memoryId. The Agent must recall canonical B through Context Memory and reason with the 'normally' qualifier.

Acceptance:

- fresh conversation has no useful prior discourse
- Agent performs READ only
- Agent recalls canonical Memory B without being told 17:00 or any memoryId
- Agent identifies the Memory evidence it used
- Agent says 18:00 is normally after the 17:00 cutoff
- Agent preserves that exceptions may exist
- Agent does not treat 17:00 as an unconditional absolute
- Agent does not infer Enterprise Context merely from an empty retrieval
- Agent creates no Proposal and performs no WRITE

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `fc4d5e42135d2f6dbc25600b2363cd57e3f4c259`
- Deployment: `7fc9e813-8a7a-4678-b41b-d0a422fe58dc`
- Status: `SUCCESS`
- Persistent state: `/data`

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

## DO NOT repeat stale actions

- Do not accept memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f as the deduplication mechanism.
- Do not create or accept another A→B canonicalization for the known 17:00 duplicate pair; the Human already accepted it and the slice is LIVE PASS.
- Do not treat Memory Canonicalization as the current open gate; it is closed.
- Do not infer that a Memory belongs in Enterprise Context merely because Personal Context lexical retrieval returned zero results.
- Do not restart PR #84–#93 work unless a new regression provides current evidence.

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

- state the current milestone accurately
- state Memory Canonicalization as LIVE PASS
- state fresh-session Memory recall as the current open live gate
- state the current deployed revision and Railway service
- identify PR #93 as the latest deployed behavioral change
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
