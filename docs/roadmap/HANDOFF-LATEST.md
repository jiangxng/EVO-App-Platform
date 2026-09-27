# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `P1.6-2026-09-28-01`  
**Snapshot time:** `2026-09-27T23:12:29.919Z`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Personal Agent P1.6 — Run-backed Experience
ACTIVE
```

## Latest closed live slice

**p1.5-durable-agent-operations: COMPLETE**

P1.5 closed after P1.5A governance inventory and P1.5B Action Receipts passed Human live verification, while P1.5C resumable runs passed automated platform acceptance and production deployment. Long multi-step Agent work now has durable run state independent of one browser request.

Authority: `docs/roadmap/P1.5-DURABLE-AGENT-OPERATIONS.md`

Evidence:

```json
{
  "p1_5A": "HUMAN_LIVE_PASS",
  "p1_5B": "HUMAN_LIVE_PASS",
  "p1_5C": "PLATFORM_AUTOMATED_ACCEPTANCE_PASS",
  "p1_5cFinalCommit": "d9f6855d84d947226be7efce2c6bdd8ae4003259",
  "p1_5cDeploymentId": "0158698d-66b0-4f7c-b000-bf3eba38555e",
  "p1_5cDeploymentStatus": "SUCCESS"
}
```

## Current open live gate

**p1.6a-run-backed-eidos-chat-transport: IMPLEMENTATION_READY**

Migrate the Personal Agent chat interaction transport from one synchronous enterprise-agent.chat request to durable enterprise-agent.run.start/get/resume actions, while keeping current UI semantics and compatibility fallback.

Acceptance:

- sending a Personal Agent message creates or resumes a durable run rather than executing the full multi-tool loop in one request
- client persists current runId independently of transient request state
- PAUSED run state triggers bounded continuation without resending original user input
- page refresh/reconnect restores run state with run.get
- SUCCEEDED renders the final Assistant reply exactly once
- BLOCKED/FAILED states are surfaced without automatic authority escalation or unsafe retry
- material WRITE observations remain linked to P1.5B Action Receipts
- existing conversation-history semantics remain bounded and distinct from durable run state
- legacy enterprise-agent.chat remains compatibility fallback until run-backed path is certified
- no new Human governance approval is automated

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `d9f6855d84d947226be7efce2c6bdd8ae4003259`
- Deployment: `0158698d-66b0-4f7c-b000-bf3eba38555e`
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
- PR #104 — MERGED: Close P1.5B Human LIVE PASS and start P1.5C resumable runs.
- PR #105 — MERGED_DEPLOYED: Add durable resumable Personal Agent runs with bounded slices, restart recovery, scope re-authorization and Action Receipt replay safety.
- PR #106 — CLOSED_NOT_MERGED: Oversized post-squash follow-up PR intentionally closed and replaced by clean PR #107.
- PR #107 — MERGED_DEPLOYED: Preserve active run slice across pre-decision crash; final P1.5C production revision.

## DO NOT repeat stale actions

- Do not accept memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f as the deduplication mechanism.
- Do not accept the P1.5B smoke-test Proposal memory-proposal:55b2b06e-8361-43f9-8f22-408aae7a8f1b as formal Memory; it is test-only and remains a Human-governed Proposal.
- Do not reopen P1.4X, P1.5A, P1.5B or P1.5C as active gates unless a new regression provides current evidence.
- Do not use ranked retrieval as governance inventory; P1.5A inventory is the completeness surface.
- Do not automatically repeat a material Agent WRITE when its Action Receipt is REQUESTED without a terminal event.
- Do not treat an Action Receipt as replacement for domain authoritative state.
- Do not make run resume depend on browser conversation memory or resending the original user task.
- Do not reorder append-only Agent Run events by wall-clock timestamp; append order is causal authority.
- Do not create a new run slice after a durable SLICE_STARTED crash window when activeSliceId can be resumed.
- Do not silently switch LLM Provider/model mid-run.
- Do not let run resume implicitly cross a Human approval boundary.
- Do not merge or revive closed PR #106; its clean replacement is merged PR #107.

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

- state current milestone as Personal Agent P1.6 — Run-backed Experience
- state P1.4X and P1.5 as closed
- state P1.5A and P1.5B Human LIVE PASS; state P1.5C Platform/Automated Acceptance PASS
- state P1.6A run-backed Eidos chat transport as the current open gate
- state current production revision d9f6855d84d947226be7efce2c6bdd8ae4003259 and Railway deployment 0158698d-66b0-4f7c-b000-bf3eba38555e
- explain that P1.5C has durable run.start/get/resume/list but current Personal Agent UI still uses compatibility enterprise-agent.chat
- preserve P1.5B receipt and P1.5C Human-authority fail-closed semantics
- identify the P1.5B smoke-test Proposal as test-only and not to be accepted
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
