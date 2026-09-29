# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `EOG-2026-09-29-10`  
**Snapshot time:** `2026-09-29T15:16:00.000+08:00`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
Enterprise Operating Graph — SOP Semantics & Live Proof v0.4
ACTIVE
```

## Latest closed live slice

**enterprise-operating-graph-published-sop-no-trace-proof-v0-4: VERIFIED_PRODUCTION_PASS**

Human-confirmed Expected SOP publication and the real no-trace fail-closed proof are complete. sop:o2c-evo-configurator-v1 is PUBLISHED revision 2 by preview-user. Both DIAGRAM_2D and SPATIAL_3D project the same Host-derived SOP=INSUFFICIENT_EVIDENCE conclusion for the selected September 2026 Time Lens because production EVO_CONFIG_MVP has no legitimate runtime trace evidence.

Authority: `docs/architecture/EOG-VIEW-STATE-AND-OBSERVATORY-v0.1.md`

Evidence:

```json
{
  "humanConfirmedPublish": true,
  "sopId": "sop:o2c-evo-configurator-v1",
  "sopRevision": 2,
  "sopState": "PUBLISHED",
  "publishedBySubjectId": "preview-user",
  "publishDeploymentId": "2ecb5ae1-b6fd-41e6-8904-16da89e1fd75",
  "twoDProofDeploymentId": "b8a8ce09-1441-4b71-a5f9-4d89f940e579",
  "threeDProofDeploymentId": "6a78f6d4-cc8b-4e59-b807-2ce7aa5eab44",
  "sopAnalysisValue": "INSUFFICIENT_EVIDENCE",
  "analyzer": "sop-path-conformance-v0.2",
  "runtimeFlowDefinitions": 0,
  "runtimeFlowTraces": 0
}
```

## Current open live gate

**enterprise-operating-graph-sop-real-trace-live-proof-v0-4: BLOCKED_ON_LEGITIMATE_RUNTIME_FLOW_SOURCE**

Expected SOP publication and the no-trace fail-closed proof are complete. The remaining v0.4 proof requires a legitimate EVO runtime flow definition and traced workload produced through governed/public EVO boundaries. Production EVO_CONFIG_MVP currently has no flow_definition or flow_trace evidence, so sop.trace.transition and sop.trace.coverage cannot yet be honestly produced. Synthetic private-table inserts and EVO_DEMO seeding are explicitly out of bounds.

Acceptance:

- provision or observe a legitimate runtime flow definition and traced workload through EVO public/governed boundaries; do not insert flow_definition/flow_trace rows directly and do not seed EVO_DEMO into production
- prove /api/v1/runtime-traces/query returns real flow-instance steps resolved to the four stable ApplicationAnchors under the selected Enterprise Context
- prove Host Observatory emits sop.trace.transition and sop.trace.coverage facts with evidence provenance for the selected Time Lens
- prove a completed expected path yields evidence-backed SOP_CONFORMANCE while allowed alternatives/exceptions remain semantically distinct
- prove a real disallowed path yields SOP_DEVIATION with evidenceFactIds and analyzer provenance
- verify incomplete or ACTIVE traces remain INSUFFICIENT_EVIDENCE rather than compliance
- do not treat conditionRef as satisfied until a runtime evidence model can prove the condition

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `ac1b35a60229ce978a795a97588205e3aef8cbe4`
- Deployment: `afaa6b9f-8bad-4e5a-9089-434b7a459e31`
- Status: `SUCCESS`
- Persistent state: `/data`

## Project continuity live validation

**Status:** `VERIFIED_PRODUCTION_PASS`

**Scenario:** `LLM-native realtime transport idle-network and mounted-refresh proof`

A read-only validator opened one production SSE connection and remained idle for 32 seconds. During the window POST /v1/actions increased by 0; no business SSE event was emitted; only two heartbeat frames totaling 26 bytes crossed the SSE connection. The shared EVO runtime revision bridge executed 3 conditional checks, 2 returned Not Modified, with 0 runtime changes and 0 errors. PR #168 also moved ordinary multi-slice Agent continuation into a bounded Host-side drain; all 30 triggered CI workflows passed, including Platform, Resumable Runs, Run-backed Chat, Thread-backed Turns, Conversation Lifecycle and Durable Threads.

Authority: `docs/architecture/LLM-NATIVE-REALTIME-TRANSPORT-ADOPTION-v0.1.md`

Proved:

- idle browser transport no longer generates repeated /v1/actions application traffic
- SSE is an event-waiting connection with bounded heartbeat traffic when nothing changes
- EVO runtime change detection uses shared conditional revision checks and does not retransmit runtime snapshots when unchanged
- resource invalidation can refresh mounted Diagram/Spatial resources without Workbench shell remount
- ordinary durable multi-slice Agent execution completes inside one Host action boundary without client-driven resume round trips
- transport request/SSE/byte counters are exposed for ongoing SLO verification

Not proved:

- LLM token-level streamed Fetch output; current Host-side drain returns the ordinary turn result at action completion
- WebSocket collaborative editing/presence; this is intentionally outside the current vertical slice
- EOG trace-backed SOP conformance; production EVO_CONFIG_MVP still lacks legitimate flow trace evidence


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
- PR #141 — MERGED_CI_PASS: Advance EOG continuity from semantic/View-State separation to Runtime & Observatory Foundation v0.2.
- PR #142 — MERGED_CI_PASS: Add renderer-independent Runtime Fact, Time Lens and evidence-backed Analysis Overlay contracts and Host observatory service.
- PR #143 — MERGED_CI_PASS: Integrate EOG Runtime Fact and Analysis Provider contracts with the generic Platform Provider system.
- PR #144 — MERGED_CI_PASS: Resolve EOG node/relation targets to canonical semantic bindings in the Host before Provider queries.
- PR #145 — MERGED_CI_PASS: Connect the EOG Observatory to a real EVO Runtime Fact Provider over canonical EVO LedgerDefinition targets.
- PR #146 — MERGED_CI_PASS: Add the first Human operational Observatory surface with Time Lens presets and real Runtime Fact overlays over the same 2D EOG view.
- PR #149 — MERGED_CI_PASS: Add the first Host-backed SPATIAL_3D Enterprise Observatory and a conservative evidence-backed Bottleneck Analysis Provider; preserve spatial View State and fact-vs-analysis boundaries.
- PR #151 — MERGED_CI_PASS: Add explicit durable Host Application ↔ EVO applicationId runtime identity mapping and fail-closed Application Runtime Fact resolution.
- PR #152 — MERGED_CI_PASS: Add Host-owned Expected SOP authority, EVO trace-derived sop.transition.count Runtime Facts, proposal-only Agent SOP tools, Human-confirmed publish, and shared 2D/3D SOP conformance/deviation overlays.
- PR #73 — MERGED_CI_PASS: EVO repository: add time-scoped runtime execution trace query over flow_trace/flow_instance evidence resolved to stable Application Anchors.
- PR #154 — MERGED_CI_PASS: Add explicit Expected/Allowed Alternative/Allowed Exception SOP transitions, preserve per-flow Actual Path and coverage facts from EVO traces, emit SOP_EXCEPTION separately from deviations, and fail closed when trace or conditional evidence is insufficient.
- PR #157 — MERGED_DEPLOYED_CI_PASS: Propagate Host-resolved active Enterprise Context through Eidos AppManager actions so EOG reads and writes execute in the selected Enterprise Context.
- PR #158 — MERGED: Record the Human-owned Enterprise Context, explicit EVO_CONFIG_MVP stable ApplicationAnchor mappings, live 2D/3D Runtime Facts, genuine absence of production traces, and the Expected SOP publish gate.
- PR #160 — MERGED_DEPLOYED_CI_PASS: Eliminate App Host remount loops and high-frequency DOM replacement: preserve self-updating EOG/Chat surfaces, keyed incremental Personal Agent transcript rendering, and retained-DOM rAF-batched SPATIAL_3D rendering.
- PR #162 — MERGED_DEPLOYED_CI_PASS: Stop the remaining Workbench action-success full refresh loop so side-panel/workspace self-updating surfaces remain mounted.
- PR #163 — MERGED_CI_PASS: Strengthen the thin-breadth/deep-vertical MVP engineering rule; required in-scope foundations are not dismissed as over-design.
- PR #164 — MERGED_DEPLOYED: Adopt Eidos realtime SSE/event delivery, resource-scoped mounted-page refresh and conditional query foundation.
- PR #165 — MERGED_DEPLOYED: Honor weak ETag validators for conditional Host queries.
- PR #166 — MERGED_DEPLOYED: Bridge EVO runtime revision changes into Host resource events with shared conditional reads.
- PR #167 — MERGED_DEPLOYED: Expose realtime event-bus and EVO revision-bridge diagnostics.
- PR #168 — MERGED_DEPLOYED_CI_PASS: Add Host-side durable Agent drain, transport route/action/JSON/SSE traffic counters, restore durable Agent chat after vendor sync, and production-certify idle action traffic at zero.
- PR #170 — MERGED_DEPLOYED_CI_PASS: Establish browser cache P0: revisioned immutable ESM module graph, App Shell ETag revalidation, legacy asset validators, and App Platform adoption of explicit desktop/mobile Surface architecture.
- PR #171 — MERGED_PRODUCTION_PROOF_PASS: Add reusable production Web Delivery proof; certify root 304, immutable revisioned asset caching, and legacy ETag revalidation against Railway production.

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
- Do not reopen Runtime Fact, Time Lens, Analysis Overlay or Observatory Provider foundation as unresolved design work; PRs #142-#144 are merged and CI-passed.
- Do not create a separate 3D semantic graph, 3D runtime store or Three.js-owned enterprise state; SPATIAL_3D is a View State and projection over the same EOG and Observatory Snapshot.
- Do not infer bottleneck, severity, WIP or backlog merely from a raw balance/frequency number; derived operational conclusions require explicit evidence-backed Analysis Overlay logic.
- Do not aggregate incompatible quantity units or currencies into one observation; EVO PR #71 makes this fail closed.
- Do not guess Host Application to EVO applicationId mappings from labels, node IDs or layout; define a stable canonical mapping before Application Runtime Facts are enabled.
- Do not reopen the first SPATIAL_3D Observatory or evidence-backed Bottleneck Provider as unresolved foundation work; PR #149 is merged and Platform CI passed.
- Do not let a Three.js/WebGL/WebGPU renderer own EOG semantic truth, Runtime Facts, Analysis Overlays or durable View State.
- Do not reconstruct Actual SOP paths from aggregate event frequency or counts; EVO PR #73 provides explicit time-scoped flow_trace evidence.
- Do not let an Expected SOP Draft participate in conformance analysis; only Human-published SOPs are enterprise truth.
- Do not give Personal Agent a SOP publish capability; Agent may create/revise Drafts only.
- Do not reopen Host Application ↔ EVO applicationId identity mapping or the first linear SOP conformance foundation as unresolved work; PR #151, EVO PR #73 and PR #152 are merged and CI-passed.
- Do not reopen explicit allowed-alternative/allowed-exception SOP transitions or per-flow Actual Path evidence as unresolved foundation work; PR #154 is merged and Platform CI passed.
- Do not collapse sop.trace.transition / sop.trace.coverage back into aggregate frequency when judging SOP conformance; aggregate counts are observability, per-instance path facts are evidence.
- Do not treat conditionRef metadata as proof that a condition was satisfied; until condition evidence exists, observed conditional transitions remain INSUFFICIENT_EVIDENCE.
- Do not redeploy PR #154/#155 as if deployment were pending; EVO Runtime and Ledger Configurator production previews are already SUCCESS on the recorded commits.
- Do not treat empty 2D/3D badge sets from a failed request as projection parity; both actions must succeed in an authorized Enterprise Context before comparing conclusions.
- Do not reopen Enterprise Context creation or Eidos Context transport as unresolved; the Human-owned Enterprise Context exists and PR #157 is deployed.
- Do not map Observatory applications to EVO application_instance UUIDs; runtime observation resolves exact application_instance.config.sourceApplicationId stable anchors.
- Do not report event.count=0 as missing mapping; all four real ApplicationAnchors resolve successfully and zero is the observed September value.
- Do not manufacture SOP live evidence by inserting flow_definition/flow_trace rows or seeding EVO_DEMO into production; production EVO_CONFIG_MVP currently has no legitimate trace evidence.
- Do not interpret the published SOP as proof of Actual Path compliance; production EVO_CONFIG_MVP still has no legitimate flow trace evidence and both 2D/3D correctly show SOP=INSUFFICIENT_EVIDENCE.
- Do not manufacture the remaining trace proof with direct flow_definition/flow_trace inserts or by seeding EVO_DEMO into production.
- Do not restore shell-wide refresh/remount after successful Diagram/Spatial/Chat actions; self-updating surfaces own their local result rendering and only Host chrome should refresh.
- Do not rebuild the entire Personal Agent transcript with transcript.innerHTML on progress/thread updates; stable message-id keyed DOM patching is the rendering contract.
- Do not rebuild SPATIAL_3D object/link DOM on every pointer/wheel/resize event; retain scene elements and update geometry on requestAnimationFrame.
- Do not reintroduce action-success -> Workbench full refresh -> remount -> automatic read as a synchronization mechanism.
- Do not use POST /v1/actions to poll for unchanged state; commands are explicit intent only.
- Do not replace SSE/resource-version reconciliation with fixed-interval browser polling for EOG or Agent state.
- Do not reintroduce browser-driven one-resume-per-slice Agent continuation as the normal path; ordinary multi-slice runs drain inside the Host with bounded recovery semantics.
- Do not overwrite App Platform durable Personal Agent chat extensions when syncing the Eidos vendor snapshot; preserve conversation history, dynamic delegated actions, run/thread durability and realtime resource refresh together.
- Do not treat network efficiency as optional polish: idle /v1/actions delta=0 is a production transport SLO.
- Do not serve normal static JavaScript with Cache-Control: no-store; versioned static assets are immutable and legacy mutable URLs revalidate with ETag.
- Do not mark a URL immutable unless its bytes are version-pinned/content-addressed; mutable URLs must revalidate.
- Do not cache Principal/Context-specific enterprise snapshots as public shared-cache content.
- Do not make browser local/session/IndexedDB state authoritative for enterprise truth, authorization, material write status or durable business state.
- Do not assume mobile means squeezing the desktop Workbench through CSS breakpoints; mobile support is an explicit Experience Surface contract and may be TASK_FOCUSED, READ_ONLY or UNSUPPORTED.
- Do not require every Experience to support mobile; unsupported mobile operations must resolve to a useful deterministic handoff.
- Do not introduce a global Service Worker/PWA cache before a concrete accepted vertical needs offline/installability; ordinary HTTP cache semantics are the baseline.

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
- state Enterprise Operating Graph Contract & Editor v0.1 as implementation-closed through PR #139/#140
- state Semantic Graph as coordinate-free and DIAGRAM_2D/SPATIAL_3D View State as durable presentation state with independent revisions
- state Runtime Facts + Time Lens + Analysis Overlay + Provider foundation as implementation-closed through PR #142/#143/#144
- state EVO PR #70 as the merged generic time-scoped Ledger Runtime observation boundary and EVO PR #71 as the merged unit/currency integrity correction
- state PR #145 as the merged real EVO Runtime Fact Provider using Host-resolved canonical EVO LedgerDefinition targets
- state PR #146 as the merged first read-only 2D Operational Observatory with 1h/4h/24h/7d Time Lens presets over the same eog:primary
- state 3D as an operational God’s-eye observatory for enterprise activity, not a decorative renderer or separate enterprise model
- state raw Runtime Facts as distinct from derived bottleneck/SOP/anomaly conclusions
- state the Host-owned EVO BusinessData Adapter as no longer blocked by the Runtime Fact boundary but still deferred by current EOG Observatory priority
- do not require the previous ChatGPT transcript to continue
- state PR #149 as merged with the first Host-backed SPATIAL_3D Observatory and evidence-backed Bottleneck Analysis Provider
- state 3D as a projection over the same eog:primary Semantic Graph, Time Lens, Runtime Facts and Analysis Overlays as 2D; spatial placement/camera remain View State
- state bottleneck conclusions as Provider-derived and evidence-backed, with INSUFFICIENT_EVIDENCE used instead of guessing
- state PR #151 as merged: Host Application ↔ EVO applicationId runtime identity is explicit, durable and never inferred from labels/node IDs
- state EVO PR #73 as merged: Actual execution paths now have a time-scoped runtime trace read boundary over flow_trace evidence
- state PR #152 as merged: Expected SOP is Host-owned Draft/Published truth, Agent is proposal-only, Human publish is explicit, and SOP_CONFORMANCE/SOP_DEVIATION are evidence-backed overlays
- state sop.transition.count as a raw Runtime Fact derived from adjacent EVO trace steps, distinct from the derived SOP analysis conclusion
- state PR #154 as merged and CI-passed: explicit EXPECTED / ALLOWED_ALTERNATIVE / ALLOWED_EXCEPTION SOP transitions are implemented and legacy linear SOPs remain compatible
- state sop.transition.count as aggregate Observatory data while sop.trace.transition and sop.trace.coverage preserve per-flow-instance Actual Path evidence for SOP analysis
- state SOP_EXCEPTION as distinct from SOP_DEVIATION so Human-published known business exceptions are not mislabeled as violations
- state incomplete/non-completed Actual Path coverage and unproven conditionRef transitions as INSUFFICIENT_EVIDENCE rather than compliance
- state EVO Runtime production preview as deployment ba33ae46-9390-4aac-8728-c57e3dfb7397 on commit 2ec947c5b1f70ecd772679981d6846680f6cab05 (PR #73), SUCCESS
- state Ledger Configurator production preview as deployment b8dfe3aa-664c-4056-a084-051955e06f79 on commit 6a75566d0c1bf31ebf491a9673a5672641f06eb2, SUCCESS
- state Enterprise Context enterprise:ent_c7ca03e32bec4ce5b105ea40f9f7a982 as ACTIVE and Human-owned; the prior no-Enterprise-Context gate is closed
- state PR #157 as merged, CI-passed and production-deployed at commit 4c5ed7a67de891f82477168b92f683bafcb90227
- state the real EVO enterprise as EVO_CONFIG_MVP and the four O2C Host nodes as explicitly mapped to stable EVO sourceApplicationId anchors, not application_instance UUIDs
- state real September Runtime Facts as live-passed in both 2D and 3D with event.count=0/event.frequency=0 and identical Bottleneck=INSUFFICIENT_EVIDENCE overlays
- state production EVO as currently containing no flow_definition and no flow_trace evidence; do not claim Actual Path live proof
- state Expected SOP sop:o2c-evo-configurator-v1 as Human-confirmed PUBLISHED revision 2 by preview-user
- state the published no-trace proof as production PASS: both DIAGRAM_2D and SPATIAL_3D project SOP=INSUFFICIENT_EVIDENCE from analyzer sop-path-conformance-v0.2 for the September 2026 Time Lens
- state PR #160 as merged, CI-passed and Railway production-deployed at commit b2b5c55c1e1ff55c11dd28d5c966e2676697dec8; EOG self-updating pages no longer require shell remount after local read/update results
- state Personal Agent transcript rendering as stable message-id keyed incremental DOM patching with requestAnimationFrame batching and near-bottom scroll anchoring rather than full transcript replacement
- state SPATIAL_3D as retained object/link DOM with requestAnimationFrame-batched geometry updates; Selection is not rewritten per frame
- state upstream Eidos PR #45 as merged at 6e4256194781957d90402dd359021fa68c997c26
- state the next EOG v0.4 semantic gate as a legitimate governed EVO runtime flow/trace source; visual flicker retest is a UI verification follow-up, not a reason to reopen semantic foundations
- state the LLM-native realtime transport baseline as production PASS at commit f154450b4cefd1c763573f9584f257083fcd2202 / Railway deployment 554c9f93-caab-40c9-a147-f63bf8b8f666
- state the 32-second idle proof exactly: actionRequests delta 0, SSE business events 0, two heartbeat frames / 26 bytes, EVO bridge checks 3 with 2 Not Modified, changes 0, errors 0
- state normal durable Agent multi-slice continuation as Host-drained rather than browser-resume-driven, with bounded PAUSED recovery for exceptional long runs
- state SSE + Last-Event-ID replay + visibility-aware pause/reconnect + ETag/304 + resource-scoped mounted refresh as the accepted communication model
- state idle action traffic zero as a product SLO, not an optimization suggestion
- state Eidos PR #50 / merge 5c0c6c44a8efeb5c2b3393f76b8e39e54f540ddc as the upstream Web Delivery and Surface architecture authority
- state Web Delivery P0 as production PASS at App Platform commit ac1b35a60229ce978a795a97588205e3aef8cbe4 / Railway deployment afaa6b9f-8bad-4e5a-9089-434b7a459e31
- state the production cache proof exactly: root no-cache + 304; versioned app-host-client asset public max-age=31536000 immutable + 304; legacy asset public max-age=0 must-revalidate + 304
- state desktop/mobile architecture as same semantic truth and Host Actions but potentially different Experience Surfaces; one responsive page is not required
- state mobile support as explicit FULL / TASK_FOCUSED / READ_ONLY / UNSUPPORTED metadata rather than inferred CSS fit
- state the next Web foundation slice as P1 Surface Contract + Resolver; do not jump to global PWA/offline or port every desktop page to mobile

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
