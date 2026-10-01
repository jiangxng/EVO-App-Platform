# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `EXT-AGENT-2026-10-01-02`  
**Snapshot time:** `2026-10-01T11:20:00+08:00`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
External-Agent-First Platform Validation v0.1
ACTIVE
```

## Latest closed live slice

**external-agent-mcp-inspector-e2e-security-v0-1: VERIFIED_PRODUCTION_PASS**

The official MCP Inspector completed a real production CIMD-first OAuth Authorization Code + PKCE flow to EVO, connected over Streamable HTTP using MCP 2026-07-28, saw only the two delegated Ledger READ operations, called the real Ledger Runtime describe operation, performed bounded accounts section reads with digest-bound cursor continuation, and then immediately lost access when its delegated Grant was revoked while its OAuth client state remained present. This proves the EVO External Agent OAuth/MCP/governed-capability security chain with a standards client, but MCP Inspector is not an AI Agent and does not substitute for a real external AI-Agent portability proof.

Authority: `docs/runbooks/EA-1B2C-GOOGLE-OIDC-PRODUCTION-LIVE-CUTOVER.md`

Evidence:

```json
{
  "productionCommit": "9c3c1399ecc2c9d42598004e39b5add49d7015ae",
  "productionDeploymentId": "9b44fd96-df50-48c4-bc66-c7bea7428b64",
  "productionStatus": "SUCCESS",
  "mcpInspectorCimd": "https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/mcp-inspector-web-v3-client.json",
  "oauthAuthorizationCodePkce": true,
  "bearerProtectedMcp": true,
  "protocolVersion": "2026-07-28",
  "toolsList": [
    "ledger.runtime.configuration.describe",
    "ledger.runtime.configuration.section.read"
  ],
  "describeTemplateId": "bookkeeping-default",
  "describeSemanticDigest": "8a1e5f7110625cf92da1c6c65a57d875cca9c008bc47c391ebeb76a694990e98",
  "describeCounts": {
    "accounts": 141,
    "applications": 143,
    "dictionaries": 106,
    "postingRules": 912,
    "referenceLegacyPostingRules": 587
  },
  "burnReady": true,
  "boundedAccountsRead": {
    "firstOffset": 0,
    "secondOffset": 3,
    "pageSize": 3,
    "total": 141,
    "semanticDigestStable": true
  },
  "grantRevocationImmediateCutoff": true,
  "postRevokeObservedErrorPrefix": "EXTERNAL_AGENT_OAUTH_DELEGATED_AUTHORITY_INACTIVE",
  "inspectorOAuthStateClearedBeforeCutoffProof": false,
  "accessTokenExplicitlyRevokedBeforeCutoffProof": false
}
```

## Current open live gate

**real-external-ai-agent-portability-v0-1: ACTIVE_FREE_CLIENT_VALIDATION**

Prove the same generic EVO External Agent contract with a real external AI Agent client that can use remote MCP + OAuth without source/private endpoint knowledge. Prefer a free client path first. ChatGPT-specific validation remains pending product-plan/workspace entitlement and must not block this generic portability proof.

Acceptance:

- a real external AI Agent client connects to the existing production /mcp endpoint without EVO client-specific runtime changes
- the client completes the existing CIMD/OAuth or another standards-compatible registered-client flow without weakening EVO security
- the client discovers only currently delegated Capability Operations
- the Agent autonomously selects and invokes ledger.runtime.configuration.describe for a natural-language request
- the Agent uses bounded ledger.runtime.configuration.section.read only when needed rather than requiring source/database/private endpoint knowledge
- the answer describes the current installation Ledger Runtime configuration and does not claim Enterprise-specific Ledger Template binding
- current delegated authority remains dynamically revocable
- record any client-specific compatibility only as Integration Adapter/Product Adapter behavior, not Host Core business logic

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `9c3c1399ecc2c9d42598004e39b5add49d7015ae`
- Deployment: `9b44fd96-df50-48c4-bc66-c7bea7428b64`
- Status: `SUCCESS`
- Persistent state: `/data`

## Project continuity live validation

**Status:** `LIVE_PASS`

**Scenario:** `Production Human identity + Enterprise Context delegation + standards-client External Agent OAuth/MCP + dynamic Grant revocation`

A real production MCP Inspector Web client used its own CIMD identity, completed the EVO OAuth Authorization Code + PKCE flow, connected to the bearer-protected Streamable HTTP /mcp endpoint in Modern MCP 2026-07-28 mode, discovered only the two delegated Ledger Runtime READ tools, successfully read the current installation Ledger Runtime description and two digest-consistent bounded accounts pages, then immediately lost access after its delegated Grant was revoked without clearing Inspector OAuth state or explicitly revoking the access token.

Authority: `docs/runbooks/EA-1B2C-GOOGLE-OIDC-PRODUCTION-LIVE-CUTOVER.md`

Proved:

- real production Google OIDC Human authentication and durable/revocable Host managed Session
- Enterprise Context creation and Human-owned delegated Grant governance
- CIMD-first OAuth Authorization Code + PKCE interoperability with an independent standards client
- bearer-protected Streamable HTTP MCP in protocol revision 2026-07-28
- least-privilege tools/list projection exposes only the two delegated Ledger READ Capability Operations
- ledger.runtime.configuration.describe returns real current installation configuration through ActionHost
- bounded ledger.runtime.configuration.section.read supports digest-stable cursor continuation
- revoking the delegated Grant invalidates effective access immediately even while the previously issued OAuth client state/token remains otherwise present

Not proved:

- MCP Inspector is an AI Agent or can autonomously decide which business tools to call
- a real ChatGPT custom MCP client has completed OAuth or called EVO tools
- a second mature external AI Agent client has completed the same portability proof
- Enterprise Context-specific Ledger Template selection/binding
- External Agent WRITE


## Recent mainline changes

- PR #242 — MERGED_CI_PASS_DEPLOYED: Align MCP tools/call structuredContent directly with each declared Capability Operation outputSchema; production Ledger describe call passed.
- PR #241 — MERGED_CI_PASS_DEPLOYED: Stamp resultType=complete on MCP 2026-07-28 successful results; production modern tools/list passed.
- PR #240 — MERGED_CI_PASS: Add a fresh Inspector Web CIMD identity with supported localhost/127.0.0.1 callbacks only.
- PR #239 — MERGED_CI_PASS: Add cache-independent Inspector Web CIMD identity used during interoperability diagnosis.
- PR #238 — MERGED_CI_PASS: Document additional loopback callback variants during Inspector interoperability diagnosis.
- PR #237 — MERGED_CI_PASS: Add the first public secret-free MCP Inspector CIMD metadata document.
- PR #236 — MERGED_CI_PASS: Record the first production OAuth/MCP public-discovery pass and preserve the real-client gate.
- PR #235 — MERGED_CI_PASS_DEPLOYED: Codify Core/Provider/Application/Integration Adapter/Experience ownership boundaries and selective documentation lifecycle governance; deploy the current mainline used by OAuth/MCP production validation.
- PR #234 — MERGED_CI_PASS_DEPLOYED: Add installable Enterprise Context Governance Experience plugin while preserving Provider-owned Enterprise Context facts; production Human created the first Enterprise Context through the normal page flow.
- PR #233 — MERGED_CI_PASS_DEPLOYED: Expose External Agent governance through Human Action Host commands with Enterprise Context-only delegated grants and confirmation boundaries.
- PR #232 — MERGED_CI_PASS_DEPLOYED: Add explicit durable managed Session revocation; production Human proof and restart-after-revoke both passed.
- PR #229 — MERGED_CI_PASS_DEPLOYED: Add the first ChatGPT MCP Product Adapter without changing plugin business semantics; add RFC 9207 issuer identification and deploy safely with External Agent access still OFF.
- PR #228 — MERGED_CI_PASS_DEPLOYED: Project currently delegated READ/PLAN Capability Operations into MCP tools/list and tools/call through the ordinary ActionHost path.
- PR #227 — MERGED_CI_PASS_DEPLOYED: Bind /mcp to the OAuth Bearer protected-resource resolver behind a default-OFF production flag.
- PR #226 — MERGED_CI_PASS_DEPLOYED: Add the stateless MCP 2026-07-28 protocol core.
- PR #224 — MERGED_CI_PASS_DEPLOYED: Project External Agent OAuth onto Host HTTP discovery/authorize/token/revoke routes behind a default-OFF production flag.
- PR #223 — MERGED_CI_PASS_DEPLOYED: Add CIMD-first PKCE S256 resource-bound OAuth authorization/access/refresh token core with current-authority revalidation.
- PR #222 — MERGED_CI_PASS_DEPLOYED: Recompute effective delegated External Agent authority from current Human, membership, plugin lifecycle and authorization policy.
- PR #221 — MERGED_CI_PASS_DEPLOYED: Add the current Human identity user directory used by delegated authority resolution.
- PR #220 — MERGED_CI_PASS_DEPLOYED: Add durable External Agent, Client and attenuated Authority Grant governance.
- PR #219 — MERGED_CI_PASS_DEPLOYED: Make Capability Operation discovery and invocation authorization-aware at the Host boundary.
- PR #218 — MERGED_CI_PASS_DEPLOYED: Expose Ledger Runtime configuration describe and bounded digest-bound section READ as Agent-neutral Capability Operations.
- PR #217 — MERGED_CI_PASS_DEPLOYED: Add platform.capability-operation to Plugin Protocol with lifecycle-effective aggregation and fail-closed operation-id conflicts.
- PR #216 — MERGED_CI_PASS_DEPLOYED: Wire the generic OIDC Provider into Host Settings, Secrets and Provider Runtime Registry while keeping production login disabled until live proof.
- PR #215 — MERGED_CI_PASS_DEPLOYED: Add generic OIDC Authorization Code + PKCE S256 + JWKS/RS256 Provider core.
- PR #214 — MERGED_CI_PASS_DEPLOYED: Add Provider-neutral Host authentication orchestration and managed Session issuance/logout boundary.
- PR #210 — MERGED_CI_PASS_DEPLOYED: Record the Enterprise–Personal Learning Loop as a long-term architecture target while keeping it outside current MVP/CI.
- PR #209 — MERGED_CI_PASS_DEPLOYED: Converge Enterprise Context Business Definition authority, migrate legacy EOG SOP persistence and preserve EOG/SOP analysis assets as non-gating.
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
- Do not infer Surface support from viewport/CSS alone; Surface support is explicit Experience metadata.
- Do not let persisted Workbench layout override an explicit semantic deep link or ?surface= selection.
- Do not mount Workbench, activities or realtime SSE when Browser Surface Gateway resolves HANDOFF.
- Do not verify Surface routing by localized UI copy; use stable structural DOM identity, Surface/page ids and network evidence.
- Do not force desktop-only Agent setup/quality/memory pages into MOBILE_TASK; unsupported semantic routes must hand off deterministically.
- Do not duplicate business semantics for mobile: desktop/mobile Personal Agent surfaces share the same Host Action and semantic route identity.
- Do not statically import the full Workbench from the minimal browser bootstrap; desktop/tablet Workbench is a post-Surface-resolution lazy runtime.
- Do not load Diagram/Spatial/desktop Workbench modules into the Personal Agent MOBILE_TASK dependency graph.
- Do not judge code splitting only from source imports; production acceptance requires real browser network evidence.
- Do not claim warm-cache efficiency from request count alone; encoded transfer bytes are the relevant proof and are currently 0 for the measured immutable JS graph.
- Do not treat every pagehide as a real unload; pagehide.persisted=true is a bfcache freeze and mounted Surface state must be preserved.
- Do not allow an older route/data request to overwrite a newer navigation; abort superseded requests and reject stale generations.
- Do not silently label last-known offline data as current; freshness/connectivity state must be explicit.
- Do not reconnect background realtime by fixed polling; SSE resumes from cursor/version when the page becomes active again.
- Do not rebuild Personal Agent as the next mobile vertical; it is already production-proven. P4 starts with Review Queue / approval decisions.
- Do not reopen MOBILE_TASK Memory Review as pending; PR #185 is production deployed and PR #188 real-Chrome proof passed.
- Do not implement mobile Review Queue by shrinking desktop Workbench; the independent mobile runtime and byte budget are already proven.
- Do not weaken Human confirmation for material Memory accept/reject just because the action is presented on mobile.
- Do not invent a second mobile task execution authority; Task Inbox actions must use the same App Host ActionHost / Host command boundary.
- Do not seed or fabricate Follow-up tasks merely to make MOBILE_TASK Task Inbox production proof non-empty; an authoritative empty inbox is valid evidence.
- Do not treat Task Inbox presentation state as enterprise business truth or infer domain completion from READY/BLOCKED/EXCEPTION UI state.
- Do not port the desktop Follow-up Catalog Browser wholesale into mobile; MOBILE_TASK uses semantic Task Inbox composition over the same Host authority.
- Do not rebuild EOG MOBILE_READ as a responsive Diagram/Workbench page; it is an independent read-only Entity Inspector over shared EOG truth.
- Do not add write controls to MOBILE_READ merely for feature parity; material interaction belongs on an explicitly admitted MOBILE_TASK or desktop Surface.
- Do not evaluate mobile performance using JS bytes alone; route/API data bytes are now part of the Surface budget.
- Do not use a manually persisted deploy-trigger variable as the preferred immutable asset revision when the actual deployment Git commit is available.
- Do not claim immutable caching is safe if an already-open old tab can no longer lazy-load modules from its own revision after a new deployment.
- Do not serve current bytes under an old immutable revision URL; retain exact old revision bytes or fail explicitly.
- Do not force-reload compatible stale tabs merely because a newer frontend exists; expose update availability and preserve bounded frontend/backend contract skew.
- Do not turn RUM into high-frequency request telemetry or authoritative enterprise state; it is sampled, bounded browser delivery evidence only.
- Do not recreate a standalone Business Definition Repository product/plugin; Business Definition Repository is a capability inside Enterprise Context.
- Do not treat Enterprise Context as the target enterprise knowledge/learning store; Experience Compiler owns enterprise and industry knowledge, learning and experience.
- Do not treat SOP Designer, Definition Comparison, Observatory, Bottleneck or report/analysis capabilities as child modules that EOG must own.
- Do not delete existing SOP/Observatory/analysis implementations while correcting ownership; preserve them for future peer-plugin extraction.
- Do not put SOP definition/edit/publish or EOG/SOP analysis into the current EOG Core CI gate before their owning plugins are formalized.
- Do not interpret project SOP as a conventional step-by-step Standard Operating Procedure; its target semantics are APQC process structure plus time dimension.
- Do not resume the historical SOP real-trace live proof as the active mainline unless the future report/analysis/SOP plugin plan explicitly reactivates it.
- Do not continue EOG upper-layer feature expansion while External-Agent-first Platform Validation is the current mainline unless a concrete dependency is accepted.
- Do not resume major Personal Agent feature expansion while External-Agent-first Platform Validation is active; preserve regression, security and shared-contract compatibility only.
- Do not treat host-static-session-provider or deployment-scoped static identity as production Human login for External Agent delegation.
- Do not expose production Human-delegated MCP/OAuth External Agent access before request-bound production Session/Principal resolution is live and revocable.
- Do not rebuild Capability Operation, delegated External Agent authority, OAuth, Generic MCP or the ChatGPT Product Adapter as pending foundations; PRs #217-#229 have already merged and the resulting mainline is production-shape deployed at 74796311df71e16a8f25f1caf21e203324aae4a4.
- Do not claim public External Agent production availability from deployment 41ae4d9e-8d96-44fa-bf85-e6b853405c6e; External Agent OAuth/MCP remain intentionally disabled and real Human OIDC login is still the active live gate.
- Do not use host-static-session-provider or APP_PLATFORM_STATIC_SESSION_JSON to bypass the real Human OIDC live gate for delegated External Agent access.
- Do not enable APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED or APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED before the real browser OIDC login/logout/revocation proof passes.
- Do not redefine Ledger Agent access in an adapter: the plugin-owned operations are ledger.runtime.configuration.describe and ledger.runtime.configuration.section.read.
- Do not identify ChatGPT from MCP clientInfo/model text; ChatGPT Product Adapter selection is based only on validated OAuth CIMD client identity.
- Do not hand-edit HANDOFF-LATEST.md; update project.status.json and regenerate it through the continuity renderer.
- Do not repeat Enterprise Context creation for EA-001; the first Human-created Enterprise Context already exists and is authoritative.
- Do not recreate the EA-001 ChatGPT Agent, Public MCP Client or READ Grant while the existing active Grant is valid unless governance inspection proves they are missing/revoked.
- Do not treat External Agent OAuth/MCP production activation or public protocol discovery as pending; both flags are ON and PRM/AS metadata plus unauthenticated 401 discovery are VERIFIED_PRODUCTION_PASS.
- Do not claim full EA-001 until a real entitled ChatGPT custom MCP client completes OAuth, tools/list, Ledger READ and post-Grant-revoke denial.
- Do not loosen OAuth, MCP, CIMD, PKCE, Enterprise Context or authorization checks to work around ChatGPT product-plan/workspace entitlement.
- Do not describe the current Ledger Runtime configuration as enterprise-specific; its Capability Operation dataScope remains INSTALLATION.
- Do not repeat the MCP Inspector CIMD/OAuth/tools/list/Ledger READ/revocation proof unless a current regression requires it; the standards-client production chain is VERIFIED_PRODUCTION_PASS.
- Do not treat MCP Inspector as proof of AI-Agent autonomy or second mature AI-Agent portability; Inspector is a standards/debugging client.
- Do not recreate or reactivate the revoked Inspector v3 Grant merely to preserve the completed proof; create a new bounded Grant only if another Inspector test is actually needed.
- Do not reintroduce the MCP 2026-07-28 missing resultType or wrapped structuredContent shapes fixed by PRs #241 and #242.
- Do not make ChatGPT plan entitlement a blocker for generic External Agent portability validation; use another standards-compatible real AI Agent client while preserving ChatGPT-specific validation as pending.

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
- state Web Delivery P1 Surface Contract + Resolver as production PASS through Eidos #51-#54 and App Platform #174/#175/#176
- state Personal Agent as the first real dual-Surface vertical: /enterprise-agent DESKTOP_WORKBENCH and /m/enterprise-agent MOBILE_TASK share semanticRouteId enterprise-agent.home
- state Surface resolution precedence as explicit URL target > stored user target > browser capability profile > deterministic default
- state the production Chrome proof: compact auto -> mobile-home; compact + ?surface=desktop -> desktop home; compact setup -> handoff; handoff -> no /v1/events
- state unsupported mobile pages as deliberate handoff rather than responsive desktop squeeze
- state the next Web foundation slice as P2 Surface-scoped loading with independently measured mobile/desktop JS transfer budgets
- state Web Delivery P2 Surface-scoped loading as production PASS through App Platform #179/#180
- state the production Chrome transfer evidence exactly: MOBILE_TASK 30,685 cold JS bytes / 19 requests; DESKTOP_WORKBENCH 87,880 / 55; HANDOFF 12,089 / 7; all measured warm JS encoded bytes 0
- state MOBILE_TASK as not requesting desktop-workbench-runtime, Eidos Workbench, Diagram or Spatial modules
- state HANDOFF as requesting neither mobile nor desktop Surface runtime
- state the next Web foundation slice as P3 Browser Lifecycle + Resilience, not a broad mobile page port
- state Eidos PR #59 / merge 31a81c92562025d5a2d571e443e4bb8156990010 as the upstream P3 Browser Lifecycle + Resilience foundation
- state App Platform PR #182 as merged, CI-passed and production-deployed at 61bf923466a118b4fb6b2ed938c2b41dc9302b52 / Railway f2340000-460a-4c23-b173-652aac3f0138
- state the real Chrome P3 proof exactly: bfcache DOM preserved, pagehide.persisted=true, pageshow.persisted=true, actionDelta=0, SSE 1->2 across restore, offline notice visible, online recovery true
- state superseded route/data reads as AbortController + generation guarded; stale completions must not win
- state P4 Web Delivery as Mobile Verticals, with Review Queue / approval decisions next because Personal Agent MOBILE_TASK is already complete
- state P4 MOBILE_TASK Memory Review as production PASS: implementation PR #185 / deployment 69f58d70-74a0-4f95-92a8-84379560db1 and corrected production proof PR #188
- state mobile Review cold JS as 36,881 bytes, desktop as 90,637 bytes, both warm JS transfer 0, and mobile as loading no Workbench/Diagram/Spatial/desktop runtime
- state Review Queue desktop/mobile as the same semantic route and Host authority with Surface-specific rendering
- state the next Web P4 slice as Task Inbox for notifications/exceptions/assigned work, beginning with real Personal Agent Follow-up planning state rather than demo data
- state PR #190 / production commit 9373efd9d77a1b25805ded240956bf40ad65625d / Railway deployment 5aad75b5-1e10-4887-8e8a-119e2873f795 as the MOBILE_TASK Follow-up Task Inbox implementation
- state PR #191 production proof exactly: mobile route /m/enterprise-agent/follow-ups, inbox personal-agent.follow-ups.mobile, current real inbox empty with itemCount=0, mobile cold JS 39,653 bytes, desktop cold JS 92,537 bytes, both warm JS 0, and no mobile desktop-runtime/Workbench/Diagram/Spatial loading
- state the empty production Task Inbox as valid governed evidence rather than a reason to create synthetic tasks
- state the next Web Delivery vertical as MOBILE_READ KPI/entity inspection over a real governed read model
- state EOG MOBILE_READ as production PASS at commit 0b0c30e6b83ade0b7afd96d4612bbc3a0a232c0a / deployment 7074e0d0-c02a-45b3-83d4-fa7f9d258624
- state the real Chrome proof exactly: /m/operating-graph/observe, eog:primary, stale=false, 4 entities, 13 metrics, 13 evidence entries, 0 buttons/forms, mobile cold JS 18,243 bytes, warm JS 0, cold API/data 5,007 bytes
- state desktop comparison as 92,690 cold JS bytes and 19,244 cold API/data bytes with explicit desktop override
- state the next Web foundation slice as security/delivery hardening: immutable shell CSS, security headers/CSP, compression/version-skew and RUM/performance budgets
- state Web security/delivery hardening PR #196 and production proof #197 as complete before discussing version-skew/RUM work
- state PR #198 as merged/deployed at d66c37f9d19552fcbb93a24cb7acd3d1fd51269f with explicit Web revision headers, bounded sampled RUM and persistent old-revision asset archive
- state PR #199 / production db61089df709a23eba60daa0e3cc8aa80c2fef03 as the first true cross-deployment immutable-asset proof
- state the old-revision proof exactly: old d66c37f app-host-client.js, mobile-read-runtime.js and desktop-workbench-runtime.js each returned 200 from the new deployment with immutable cache and ETag
- state stale compatible client behavior exactly: x-evo-host-revision points to db61089d, x-evo-web-contract=0.1.0 and x-evo-client-update=available; no forced reload is required
- state RUM as bounded non-authoritative evidence and the next Web slice as real-browser RUM/performance budget governance
- state Enterprise Context as the headless authoritative Business Definition space and BDR as an internal/public capability rather than a standalone plugin
- state Experience Compiler as the authority for enterprise/industry knowledge, learning, research and experience
- state EOG Core as CI-gated graph design/navigation/aggregation, not the parent of SOP/reporting/analysis plugins
- state existing SOP definition/edit/publish and EOG/SOP Observatory/analysis code as preserved non-gating assets pending future plugin extraction
- state project SOP semantics as APQC process structure plus time dimension rather than conventional work-instruction SOP
- state the report/analysis plugin portfolio as intentionally not yet planned
- state EVO Ledger Runtime as deterministic BusinessData/posting/reconciliation/calculation/replay without Business Definition version-lifecycle ownership
- state App Platform as control plane while peer components exchange ordinary data through stable contract-bound interfaces after binding
- state enterprise-context-business-definitions-sop-authority-migration-v0-1 as VERIFIED_PRODUCTION_PASS with one legacy SOP migrated into Enterprise Context on Railway deployment 8f31d73c-d211-48a4-a377-4894c2181dfc
- state External-Agent-First Platform Validation v0.1 as the current milestone
- state production-human-login-request-bound-session-v0-1 as the active gate before public delegated External Agent access
- state EOG upper-layer expansion and major Personal Agent feature expansion as deferred while their existing assets remain preserved/regression-protected
- state EA-001 Blind Enterprise Discovery over Ledger Runtime as the first external Agent conformance target after login, delegation and Generic MCP READ/PLAN exist
- state PRs #217-#229 as merged foundations: Capability Operations, Ledger READ operations, current-authority delegation, OAuth, MCP and ChatGPT Product Adapter are implemented rather than future work
- state production Ledger Configurator as commit 74796311df71e16a8f25f1caf21e203324aae4a4 / Railway deployment 41ae4d9e-8d96-44fa-bf85-e6b853405c6e SUCCESS
- state the production startup evidence exactly: Enterprise Context legacy SOP migration still reports one imported definition; Generic OIDC reports ISSUER_REQUIRED/inactive; Host listens normally
- state External Agent OAuth and MCP as default-OFF in production and therefore not yet a public External Agent live pass
- state the active gate as real production Human OIDC login/logout/revocation, not Capability Registry/OAuth/MCP implementation
- state EA-001 as ready in code but still awaiting live Human OIDC, explicit ChatGPT client registration/Grant and intentional OAuth/MCP activation
- state ChatGPT integration as a Product Adapter over Generic MCP, selected only by validated CIMD identity and never by model text/clientInfo
- state ledger.runtime.configuration.describe and ledger.runtime.configuration.section.read as the plugin-owned first EA-001 READ operations

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
