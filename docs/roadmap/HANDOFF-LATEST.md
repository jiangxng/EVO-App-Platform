# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `EOG-2026-09-28-03`  
**Snapshot time:** `2026-09-28T23:29:00+08:00`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Enterprise Operating Graph — Runtime & Observatory Foundation v0.2
ACTIVE
```

## Latest closed live slice

**p1.8-durable-conversation-lifecycle-retention: VERIFIED_PRODUCTION_PASS**

Personal Agent durable conversation lifecycle is complete: durable Host threads, run-bound turns, Eidos transcript recovery, append-only archive lifecycle, Human-selected 90-day archived retention policy, and Eidos New Chat/history/switch/archive/read-only management are production-deployed.

Authority: `docs/roadmap/P1.8-CONVERSATION-LIFECYCLE-RETENTION.md`

Evidence:

```json
{
  "p18aPr": 119,
  "p18bPreviewPr": 120,
  "p18bPolicyPr": 122,
  "p18cPr": 123,
  "p18cCi": "32/32 PASS",
  "productionCommit": "d5e4748900f3682d50d6cf3014c98c1251f8d155",
  "deploymentId": "75fd7061-f471-423a-bbb8-b8160361095e",
  "deploymentStatus": "SUCCESS",
  "archivedRetentionDays": 90,
  "destructivePurgeEnabled": false
}
```

## Current open live gate

**enterprise-operating-graph-runtime-analysis-overlay-v0-2: IMPLEMENTATION_READY**

Define the first Host-authoritative Runtime Fact, derived Analysis Overlay and Time Lens contracts over the existing EOG semantic graph. Runtime observations and derived diagnostics must target stable EOG semantic identities while remaining separate from semantic truth and View State. Keep this slice renderer-independent: the future 3D Observatory will consume these contracts through Eidos spatial-core, but Three.js is not the current implementation gate.

Acceptance:

- Runtime Facts are time-bounded observations with explicit source/provenance and can target an EOG node or relation without mutating the Semantic Graph
- raw Runtime Facts remain distinguishable from derived Analysis Overlay results
- Time Lens selects a deterministic observation window and comparison window without rewriting source facts
- event frequency, throughput, WIP/backlog, wait/lead time and amount/quantity can be represented as typed measurements without hard-coding a single business domain
- Analysis Overlay can represent bottleneck, SOP-conformance/deviation and anomaly evidence as derived observations with provenance and confidence/status metadata
- dynamic metrics never change semantic node identity or force semantic revision changes
- 2D DIAGRAM_2D and future SPATIAL_3D views can consume the same runtime/analysis overlay contracts
- no Three.js/WebGL object, Eidos scene object, renderer XML or client cache becomes runtime or enterprise truth
- the existing Application/Ledger semantic scope remains stable while the runtime/analysis contract is proven; broader semantic node kinds are not added merely to support visualization
- define the minimum provider/source boundary needed to connect future EVO BusinessData/Ledger runtime observations without resuming business-specific Host mappings

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `d5e4748900f3682d50d6cf3014c98c1251f8d155`
- Deployment: `75fd7061-f471-423a-bbb8-b8160361095e`
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
- PR #119 — MERGED_DEPLOYED: Add append-only ACTIVE→ARCHIVED Conversation Thread lifecycle; 31/31 CI PASS.
- PR #120 — MERGED_DEPLOYED: Add non-destructive archived-thread retention preview; 32/32 CI PASS; no destructive action enabled.
- PR #122 — MERGED_DEPLOYED: Apply Human-selected 90-day archived Conversation Thread retention policy; 27/27 CI PASS; destructive purge remains disabled.
- PR #123 — MERGED_DEPLOYED: Add Eidos durable Conversation Thread management (New Chat/history/switch/archive/read-only); 32/32 CI PASS and Railway SUCCESS.
- PR #133 — MERGED: Record enterprise migration Agent learning as a supporting roadmap and repository-native knowledge asset.
- PR #134 — MERGED: Prioritize Enterprise Operating Graph: Personal Agent + LLM + Human direct editing converge on one structured target enterprise model; migration/training deferred.
- PR #135 — MERGED: Converge repository continuity on Enterprise Operating Graph — Contract & Editor v0.1 and defer the Host-owned EVO BusinessData Adapter without cancelling it.
- PR #136 — MERGED_CI_PASS: Add the first executable EOG Application/Ledger contract foundation, legacy designer archaeology, separate Guidance/Enterprise relations, Position, shared Human/Agent operations, revision protection and publish immutability.
- PR #137 — MERGED_CI_PASS: Add enterprise-scoped EOG Host persistence, Human AppActions and proposal-only Personal Agent tools over one graph service; keep Enterprise confirmation and publish Human-only.
- PR #138 — MERGED_CI_PASS: Advance repository continuity from EOG contract design to the first Eidos graph-surface implementation gate.
- PR #139 — MERGED_CI_PASS: Bind the first Eidos Diagram Editor vertical slice to Host-authoritative EOG state; Human drag/confirm/publish and Agent proposals converge on eog:primary without an Eidos-owned semantic model.
- PR #140 — MERGED_CI_PASS: Separate EOG semantic truth from durable DIAGRAM_2D/SPATIAL_3D View State, introduce independent revisions and Agent view tools, and record the Enterprise Observatory architecture.

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
- Do not reopen Personal Agent P1.8 conversation lifecycle as the active mainline without new regression evidence.
- Do not replace the current Trading Lite /commands compatibility path before the generic BusinessData adapter is database- and browser-proven.
- Do not move Trading Lite business-specific mapping into Host Core; the Host adapter must remain generic.
- Do not pass EVO-private ApplicationInstance IDs as the target application routing contract; use stable applicationId.
- Do not resume the Host-owned EVO BusinessData Adapter as the active mainline until the Enterprise Operating Graph v0.1 target-model gate is completed; it is deferred, not cancelled.
- Do not start legacy-data projection, Best Data Provider implementation or model fine-tuning before the target Enterprise Operating Model is usable.
- Do not build a generic ProcessOn clone; graph UI exists to edit and confirm EVO enterprise semantics.
- Do not let accounting/APQC/legacy templates become published enterprise truth without Human confirmation.
- Do not reopen the EOG v0.1 Application/Ledger contract foundation as an unresolved design gate unless a concrete regression requires it; PR #136 is merged and CI-passed.
- Do not create Eidos-owned EOG semantic persistence; Eidos must render and mutate the Host-authoritative graph through the existing EOG action boundary.
- Do not let Personal Agent tools confirm Enterprise relations, remove Human-confirmed Enterprise relations, or publish EOG; those remain Human authority boundaries in v0.1.
- Do not put x/y/z position, camera, zoom or other presentation state back into the EOG Semantic Graph; PR #140 moved layout into independent View State.
- Do not treat semantic publish as freezing View State; published enterprise semantics are immutable while 2D/3D arrangements remain presentation state.
- Do not make Three.js, maxGraph, SVG, WebGL, Eidos scene objects or renderer serialization authoritative EOG state.
- Do not let event frequency, heat, bottleneck scores, SOP conformance or other runtime/analysis metrics mutate stable semantic node identity or layout automatically.
- Do not overwrite raw Runtime Facts with derived Analysis Overlay conclusions; preserve provenance and the fact-vs-analysis boundary.

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

- state Personal Agent P1.8 as verified and production-closed
- state archived Conversation Thread retention as 90 days from archivedAt and destructive purge as disabled
- state Enterprise Operating Graph Contract & Editor v0.1 as implementation-closed through PR #139/#140
- state PR #139 as the merged Host-backed Eidos 2D editor vertical slice over the shared eog:primary graph
- state PR #140 as the merged semantic/View-State separation: Semantic Graph has no coordinates; DIAGRAM_2D and SPATIAL_3D View State have independent revisions
- state Guidance topology as advisory and Human-confirmed Enterprise relations/publish as Human authority
- state Personal Agent semantic tools as proposal-only for enterprise truth while separate Agent View tools may arrange 2D/3D presentation state
- state the current open gate as Runtime Facts + Analysis Overlay + Time Lens foundation, renderer-independent
- state the 3D Enterprise Observatory as a formal future Eidos spatial view for operational observation/diagnosis rather than visual decoration
- state the Host-owned EVO BusinessData Adapter as deferred pending the Runtime Fact source boundary, not cancelled
- state legacy-data projection / Best Data Provider / training as downstream of a usable target Enterprise Operating Model
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
