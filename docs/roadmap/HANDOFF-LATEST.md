# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: `project.status.json`.  
> Do not hand-edit this file. Run `npm run continuity:render` after changing the structured continuity snapshot.

**Snapshot:** `tr01b2a-public-governed-sales-raw-stock-value-gap-2026-10-10`  
**Snapshot time:** `2026-10-10T01:45:00.000Z`  
**Status:** `AUTHORITATIVE_CURRENT`

## Current milestone

```text
TR-01 Trading Reference Loop
ACTIVE
```

## Latest closed live slice

**tr01b2a-authorized-inverse-sales-work-position-service: SERVICE_LEVEL_CI_POSTGRESQL_PRODUCTION_PASS_BOUNDED**

TR-01B2A introduces a guarded, application-owned, read-only inverse Sales operational projection from public EVO WorkItems and dimension-filtered LedgerBalance for pending Shipment, Receivable, Inventory quantity/raw amount and Cash. In real PostgreSQL after App Platform-originated immutable Sales→Production→Shipment→Cash facts it proves HUMAN/AI Principal parity under one-order-only scoped CI authorization, rejects an unauthorized sales order, and shows SHIP/COLLECT Work closed. Critical discovery: after Shipment quantity=0 while unvalued raw Inventory Ledger amount=125; shipment costing/COGS is NOT certified. This service is NOT yet a registered Host Capability Operation or installed sales Human/Agent/Workbench Experience. Formal allocation, replay, customer production policy, financial Account Foundation Object remain OUT OF SCOPE.

Authority: `docs/roadmap/TR01B2A-GOVERNED-SALES-WORK-POSITION-20261010.md`

Evidence:

```json
{
  "implementationPr": 574,
  "head": "c4ac883269ca95cf7665ceb3adecccc951e4d813",
  "mergedMain": "39109addd721c017cd6276c60ee4b3062ab3f6b7",
  "postgresProofRun": 38014202340,
  "postgresProof": "PASS",
  "marker": "TR01B2A_GOVERNED_SALES_EVO_PUBLIC_READ_PROOF",
  "platformRun": 38014202293,
  "platformCI": "PASS",
  "continuityRun": 38014202284,
  "continuityCI": "PASS",
  "tradingLiteEvoRegressionRun": 38014202326,
  "tradingLiteEvoRegression": "PASS",
  "tr01aInstalledBrowserRun": 38014202298,
  "tr01aInstalledBrowser": "PASS",
  "observedInventoryQuantityAfterShipment": 0,
  "observedRawInventoryAmountAfterShipment": 125,
  "costValuationCertified": false,
  "hostInstalledSalesUX": "NOT_CERTIFIED",
  "formalReceiptAllocation": "NOT_CERTIFIED",
  "financialAccountObject": "NOT_STARTED",
  "railwayDeploymentId": "b0ff4777-17d6-4de0-bdda-7a02dbf39d6b",
  "railwayDeploymentStatus": "SUCCESS"
}
```

## Current open live gate

**tr01b2b-valuation-cogs-and-settlement-public-contract: OPEN**

TR-01B2A shared authorized Sales read service passed real EVO public PostgreSQL CI, but quantity 0 and raw Inventory amount 125 after Shipment reveal that stock cost/COGS must be handled by pinned EVO Valuation/Cost lifecycle. Formal Cash Receipt→Receivable AllocationInstruction/Relation remains an EVO-internal certified EEL-C01 capability without an adopted scoped public Host integration. Verify usable public contracts (or explicitly report a gap) for cost and allocation before broadening sales UX. TR-01B2C Host/Eidos/Agent/Workbench installation and replay of exact App Platform facts remain subsequent gates. No direct inventory write, new Cash Account object or customer production auth changes.

Acceptance:

- Inventory amount=125 with quantity=0 is not a valid finished-cost guarantee: locate EVO pinned CostResult/ValuationPosting public lifecycle and prove exact shipment cost-to-COGS without altering immutable events or issuing direct LedgerEntry.
- Inspect existing EVO EEL-C01 AllocationInstruction/Relation and public contracts; prove customer receipt source-target allocation if exposed, or record an owner-scoped EVO API gap instead of fabricating a settlement relation.
- Keep formal cost valuation, same-currency cash receipt posting, foreign exchange and customer bank-account identities distinct in both contract and UI claims.
- Plan deterministic full replay equality for exact App Platform sales/production/shipment/cash facts after cost/settlement semantics are pinned.
- Subsequently register the Sales READ through the same opt-in governed Action Host lifecycle as TR-01A and certify real installed Eidos Human + Agent + Workbench against authorized EVO public Work/Position.
- Do not reopen Counterparty/Item/Warehouse imports or expand Cash Account Foundation Object, and do not modify parallel 2D Designer or Agent-line PRs.

## Current production preview

- Platform: RAILWAY
- Project: EVO Ledger Runtime MVP
- Service: Ledger Configurator
- Environment: production
- Source: `jiangxng/EVO-App-Platform:main`
- Commit: `39109addd721c017cd6276c60ee4b3062ab3f6b7`
- Deployment: `b0ff4777-17d6-4de0-bdda-7a02dbf39d6b`
- Status: `SUCCESS`
- Persistent state: `/data`

## Project continuity live validation

**Status:** `LIVE_PASS`

**Scenario:** `EOG semantic authority migration to Enterprise Context Business Definition Repository`

Production #269 startup imported one legacy EOG graph definition into Enterprise Context, while preserving the legacy source. A controlled restart on the same commit reached SUCCESS without a second graph import or migration conflict, proving restart-safe migration and repository-backed semantic authority. 2D/3D View State remained on its independent presentation persistence path.

Authority: `docs/architecture/EOG-ENTERPRISE-CONTEXT-DEFINITION-PERSISTENCE-v0.1.md`

Proved:

- production EOG semantic authority can migrate non-destructively into Enterprise Context Business Definition Repository
- legacy EOG graph migration is restart-safe after repository authority is established
- new Host semantic runtime no longer requires the legacy EOG semantic store as its write authority
- EOG-specific persistence adaptation remains owned by EOG 2D Designer while Enterprise Context remains generic
- 2D/3D View State remains outside Enterprise Business Definition revisions

Not proved:

- future expansion of the Enterprise Graph ontology
- new EOG upper-layer analytics/report features
- explicit public Eidos 2D/3D API entrypoints


## Recent mainline changes

- PR #574 — MERGED_CI_PRODUCTION_PASS_BOUNDED: TR-01B2A governed Sales Work/Position read service for HUMAN/AI Principals using EVO public exact dimensioned Ledger+Work; CI [38014202340] PASS with isolated one-order authorization and unauthorized-order refusal, Platform 38014202293 PASS, continuity 38014202284 PASS, existing PostgreSQL 38014202326 PASS, TR-01A installed Chrome regression 38014202298 PASS. Merged 39109addd721c017cd6276c60ee4b3062ab3f6b7; Railway b0ff4777-17d6-4de0-bdda-7a02dbf39d6b SUCCESS. Stock qty=0 while raw amount=125 after shipment; valuation/COGS, installed sales UI and formal allocation NOT certified.
- PR #571 — MERGED_CI_PRODUCTION_PASS_BOUNDED: TR-01B1 reused CUSTOMER Counterparty, Item and Warehouse in real EVO Sales→Production→Shipment→Cash public BusinessData chain. Platform 38013542321 PASS, Continuity 38013542307 PASS, PostgreSQL Sales Cash 38013542437 PASS, existing PostgreSQL 38013542399 PASS, installed TR01A browser regression 38013542531 PASS. Merged 301cf0a45e59591adcb6a33e6d30fb68a94db443; Railway 3add74b5-5ed9-4da7-ade4-bd5f7dbd8691 SUCCESS. Cash Account object and inventory valuation/COGS/Allocation remain unproven.
- PR #567 — MERGED_INSTALLED_BROWSER_CI_PRODUCTION_CODE_PASS: Pinned real EVO PostgreSQL + immutable PO/Receipt/Reversal proof; installed optional Trading Reference/BI Workbench, scoped policy and mapping; actual Chrome Eidos Workbench→lookup→detail, separate AI Principal Host parity, forbidden order and deep link denial. Run 38012256000 PASS, existing DB CI 38012255964 PASS, continuity 38012255960 PASS, merged main 399cbf5838626583599b441e3992e03fef9102c5, Railway 5a03ab99-2731-4a0d-91e4-9daa8c33a7dc SUCCESS.
- PR #565 — MERGED_35_CI_PRODUCTION_PASS: Added opt-in Eidos read-only purchase query/detail and permission-filtered Workbench operational entry using the A4 governed read; 35/35 CI PASS, Railway deployment 624d7723-45bb-4a03-a0fd-3ceecd930650 SUCCESS; actual installed browser certified later by #567.
- PR #564 — MERGED_35_CI_PRODUCTION_PASS: Registered optional Trading Reference Capability Operation and Action Host with explicit enterprise-to-EVO mapping and deny-by-default policy; 35/35 CI PASS, Railway 588060a1-3945-4c18-9d7e-665b5b5fec7f SUCCESS.
- PR #562 — MERGED_CI_PRODUCTION_PASS: Proved bounded read-only authorized shared EVO Work/Inventory Position/Payable projection with Human/AI parity and PostgreSQL certification; Railway 2b58a678-bf20-40e7-9da4-d7bf020d17ff SUCCESS.
- PR #559 — MERGED_CI_PRODUCTION_PASS: Made pinned EVO full deterministic TR-01A2 reversal Replay an explicit third cross-project PostgreSQL CI gate; exact head 2ebaf57c passed Continuity/Platform/Cross Project CI and main 5f4ff27bd3c4b42d6d5acd3cebab096588e18f5b deployed Railway 11ee6c04-6845-474c-b56b-d8b7b84ea015 SUCCESS.
- PR #557 — MERGED_CI_PRODUCTION_PASS: TR-01A2 appended receipt-reversal BusinessData using EVO REVERSES and unchanged PO/Receipt; public EVO PostgreSQL CI proved pending purchase/inventory/payable/Work effects, pinned EVO replay CI passed and Railway production 1ece6ea3-c124-4d65-9860-f14d88f959a9 is SUCCESS.
- PR #556 — MERGED_CI_PRODUCTION_PASS: Restored A1 continuity drift and activated A2 using verified #551 CI/production facts; regenerated HANDOFF-LATEST and deployed main 2737de425cc53d017fe250007a7f8139ce51d67d at Railway fc2b7e6c-9e8d-47a7-90df-d7e9b9c787fc SUCCESS.
- PR #551 — MERGED_CI_PRODUCTION_PASS: TR-01A1 positive purchase/receipt loop composed Supplier Counterparty, Item and Warehouse into immutable EVO BusinessData facts with FULFILLS lineage; Platform, Continuity and cross-project EVO PostgreSQL CI passed; production main a191b1ac deployed at b1d141c6-858d-4ee3-8422-0efbe7147396 SUCCESS.
- PR #546 — MERGED_CI_RVC_PRODUCTION_PASS: WH-01D completed real Overture warehouse/facility RVC over 5,000 external warehouse building features; Platform/Continuity/RVC CI passed and Railway deployment 235335b8-44e3-4da4-9682-6cb75c70bcb6 is SUCCESS.
- PR #544 — MERGED_CI_PRODUCTION_PASS: WH-01C completed lifecycle-gated Warehouse Responsibility/Authorization/Projection/Eidos composition with shared Human/Agent read authority; 34/34 CI passed and Railway deployment 60a02755-b544-48cf-907c-95e3feddd56f is SUCCESS.
- PR #542 — MERGED_CI_PRODUCTION_PASS: WH-01B proved order-independent hierarchical Warehouse Location Data Import on unchanged STABLE_CANDIDATE contracts; Platform/Continuity CI passed and Railway deployment c2011371-4309-4982-9062-90cb98a166a9 is SUCCESS.
- PR #540 — MERGED_CI_PRODUCTION_PASS: WH-01A established Enterprise Context-backed Warehouse identity and structural Zone/Location/Bin hierarchy on unchanged STABLE_CANDIDATE Foundation Object contracts; Platform/Continuity CI passed and Railway deployment a946ec39-35d2-4c73-8dd2-d9e3b7cd5de1 is SUCCESS.
- PR #538 — MERGED_CI_RVC_PRODUCTION_PASS: IT-01E completed real Open Food Facts Item RVC and the second-object contract maturity review; 20k real rows and 1k generic imports passed, Item batch persistence improved ~4.9x, and Railway deployment ca33d2da-7de7-483a-b584-1d71d38f84d1 is SUCCESS.
- PR #534 — MERGED_CI_PRODUCTION_PASS: Resolved row-dynamic qualifier-aware Item import through generic DISCOVERY/EFFECTIVE schema modes; Platform/Continuity CI passed and Railway deployment b16708e5-b17b-4151-99d1-4803880880b3 is SUCCESS.
- PR #532 — MERGED_CI_PRODUCTION_PASS: Resolved lifecycle-aware Data Import target discovery/loading; 35/35 CI passed and Railway deployment c7ac359b-3fe7-4a5c-b258-9fb7e3baa01d is SUCCESS.
- PR #530 — MERGED_CI_PRODUCTION_PASS: IT-01D completed lifecycle-gated Item Projection/Responsibility/Eidos composition with shared Human/Agent projection authority; 34/34 CI passed and Railway deployment bb543f4b-fb43-4d4e-a515-c83eb46ff992 is SUCCESS.
- PR #528 — MERGED_CI_PRODUCTION_PASS: IT-01C proved Item on the generic Data Import path, shared import value normalization, object-neutral target parameters, schema-drift protection and atomic extension rollback; Platform/Continuity CI and Railway deployment f4e56280-cfae-4012-bc8a-ed4e48d77ec6 passed.
- PR #524 — MERGED_CI_PRODUCTION_PASS: IT-01B added Enterprise Context-backed Item identity persistence with enterprise-scoped code uniqueness and archive-preserving deterministic lifecycle; Platform/Continuity CI and Railway deployment d2d85a7f-3987-4f49-8bf5-de9a3c6e9d58 passed.
- PR #522 — MERGED_CI_PRODUCTION_PASS: IT-01A added the minimal Item second-object schema and object-neutral applicability qualifiers while preserving Counterparty compatibility; Platform/Continuity CI and Railway production deployment 3aa0e5fb-139a-492f-be63-41b1b9255c9b passed.
- PR #519 — MERGED_CI_PRODUCTION_PASS: Integrated the complete reconciled CP-07 maturity evidence stack; 42/42 combined candidate CI passed and Railway production deployment f681b927-2685-4d66-8654-299e0374c347 is SUCCESS.
- PR #509 — MERGED_CI_PRODUCTION_PASS: Promoted install/use-driven plugin lazy resource loading to platform architecture authority; current production runs the #509 mainline successfully.
- PR #504 — MERGED_CI_PRODUCTION_PASS_AWAITING_HUMAN: Extracted Workspace from Host into optional evo-bi-workbench plugin; /workspace is plugin-owned, runtime/state are lazy, Host default routing is based on active Experiences, and current production was explicitly migrated to the plugin.
- PR #500 — MERGED_CI_PRODUCTION_PASS: Fixed Host Workbench action feature gating so Workbench commands execute through the real ActionRouter feature gate while preserving item-level reauthorization.
- PR #499 — MERGED_CI_PRODUCTION_PASS: Persisted governed Enterprise/role Workbench defaults plus personal preferences, Favorites and Recent; Workbench opens reauthorize before recording Recent; Data Import remains a fixed capability.
- PR #498 — MERGED_CI_PRODUCTION_PASS: Added active-package Workbench contributions and deterministic Package -> Enterprise/role -> Personal composition; unauthorized preference items cannot expand authority.
- PR #497 — MERGED_CI_PRODUCTION_PASS: Human UI and Personal Agent now share the same governed Counterparty My Customers/My Suppliers projection service and Capability Operations.
- PR #493 — MERGED_CI_PRODUCTION_HUMAN_PASS: CP-05 deployed facet/profile composition was Human validated and is now closed; mainline advances to CP-06.
- PR #492 — MERGED_CI_PRODUCTION_HUMAN_PASS: Counterparty detail progressively composes role-scoped Customer/Supplier Profiles plus repeatable Contacts and Addresses through Eidos; Human accepted the production experience.

## DO NOT repeat stale actions

- TR-01B2A real EVO proves Inventory quantity=0 but raw Ledger amount=125 after Shipment; do NOT claim Inventory Amount or COGS closed, and do NOT direct-write any balance. Sales read HUMAN/AI parity is service-level CI, NOT installed Host/Agent/Workbench.
- Do not conflate TR-01B1 cash.received and cash Ledger increase with an enterprise financial/bank account Foundation Object or formal allocation; shipment quantity closes but Inventory Amount and COGS need separate proof.
- Do not claim TR-01A reference acceptance proves customer production plugin install, actual customer login, Agent model reasoning, partial/concurrent reversal or a complete procurement product; #567 proves only real isolated installed Chrome/AI/Workbench acceptance.
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
- Do not reopen Cline 4.1.22 native DCR as an EVO Core requirement; its DCR-only remote OAuth behavior is a client compatibility concern and the local Integration Adapter is the current bounded solution.
- Do not repeat the Cline + DeepSeek autonomous Ledger describe/accounts-read proof unless a regression requires it; this real AI-Agent portability slice is VERIFIED_PRODUCTION_PASS.
- Do not call the Cline Adapter an EVO business provider or Core module; it is an Integration Adapter translating client protocol/OAuth mechanics only.
- Do not make ChatGPT entitlement the only path to the second mature External Agent proof.
- Second mature native Agent / Google Cloud-related validation is intentionally deferred by the Human; do not block Agent Capability Fabric work on that test.
- Do not solve capability-catalog scale by adding one bespoke MCP tool per future business function; prefer the Agent Capability Fabric search/describe/invoke boundary.
- Do not broaden Grant authority implicitly inside Capability Fabric search. Current allowedOperationIds and token operationIds remain hard upper bounds in v0.1.
- Do not expose WRITE through evo.capabilities.invoke in Fabric v0.1.
- Do not require Human users to create External Agent Agent/Client/Grant records through DevTools for first-use standards-client OAuth once the Human Consent flow is available.
- Do not implement Human Consent as open DCR; CIMD is client identity, Human approval is the authorization decision, and the Authority Grant remains the durable business authority.
- Do not preselect business operations in the consent UI or infer WRITE authority from OAuth scopes.
- Do not implement capability delegation scale as wildcard operation ids; use exact Capability selectors with explicit READ/PLAN effects.
- Do not let a durable capability selector silently expand an already-issued OAuth authorization code, access token, or refresh-token family; token authority must only stay equal or shrink.
- Do not remove explicit allowedOperationIds; precise operation-level delegation remains a supported authority primitive.
- Do not treat External Agent READ/PLAN capability as unverified or keep Grok portability as an active gate; Grok Web and Mobile are VERIFIED_PRODUCTION_PASS as of 2026-10-02.
- Do not treat docs/integration-clients/grok-web-mobile-client.json as the canonical current Grok Web native identity; Web observed https://grok.com/oauth/mcp-client.json automatically, while the EVO-maintained profile remains the Mobile/manual compatibility client.
- Do not interpret the first-consent Grok browser-return stall by itself as failed EVO authorization; both Web and Mobile were observed to receive EVO 303 while the browser could remain open, and a subsequent connector attempt completed token exchange using the already-created effective Grant.
- Do not repeat generic External Agent client portability proof unless a regression or materially new capability class requires it; WRITE and additional plugin exposure are expansion scopes.
- Do not re-expand mixed EOG Core ownership: Enterprise Context owns Enterprise Graph Definition authority, Eidos owns reusable 2D/3D cores, and App Platform converges EOG into 2D Designer, 2D Viewer and 3D Viewer plugins.
- Do not create separate semantic graph authorities for 2D Designer, 2D Viewer and 3D Viewer; all consume the same Enterprise Graph Definition.
- Do not move Application, Ledger, SOP, Enterprise Relation or publication semantics into Eidos 2D/3D Core.
- Do not delete existing Observatory/SOP/analysis/runtime assets during responsibility convergence; preserve and extract only after target peer-plugin contracts are defined.
- Do not restore EOG 2D Designer Experience or Human action ownership to Enterprise Agent; evo-eog-2d-designer is the cut-over owner.
- Do not inject a second /operating-graph Designer manifest from server compatibility code; the effective Designer Experience now comes from ordinary package lifecycle discovery.
- Do not restore EOG 2D Viewer Experience or read-action ownership to Enterprise Agent; evo-eog-2d-viewer is the cut-over owner.
- Do not move Runtime Fact or analysis calculation ownership into EOG 2D Viewer; it aggregates peer-provider results.
- Do not restore any EOG Experience injection under Enterprise Agent; all three EOG Experiences are owned by dedicated EOG application packages after the 3D Viewer cutover.
- Do not move Runtime Fact or analysis calculation ownership into EOG 3D Viewer; it consumes peer-provider results.
- Do not weaken Human-only EOG authority while splitting Agent tools: Enterprise relation confirmation/removal and publish remain unavailable to Agent.
- Do not assign the mixed DIAGRAM_2D/SPATIAL_3D generic Agent View tools wholesale to one dedicated EOG plugin; split their visual responsibilities first.
- Do not move Observatory Runtime Fact or Analysis calculation ownership into EOG 2D Viewer merely because the Personal Agent tool descriptor is Viewer-owned.
- Do not restore the legacy EOG semantic store as the authority for new writes; it is migration evidence/input only after production #269.
- Do not move EOG-specific semantic mapping into the generic Enterprise Context provider; the adapter belongs to EOG 2D Designer behind a stable persistence contract.
- Do not make EOG application code import vendor/eidos/src/diagram/** or vendor/eidos/src/spatial/** directly after the public visual-core boundary is available.
- Do not rewrite Eidos diagram/spatial implementations merely to satisfy 2D/3D naming; the public facades are the stable boundary.
- Do not treat EOG three-plugin physical extraction as pending; package ownership and plugin-to-manager private dependency closure are implemented on main through PR #284.
- Do not reintroduce apps/eog-* imports from manager/**; CI now prohibits this dependency direction.
- Do not physically extract preserved SOP/analysis/runtime-binding assets before their peer-plugin package identities and public contracts are frozen.
- Do not describe EOG 2D Viewer as non-interactive or as a static read-only page; only Enterprise Graph semantic mutation is prohibited.
- Do not fork separate Viewer and Designer property panels; both use the shared Eidos 2D Workspace Inspector and shared EOG property projection.
- Do not route peer-owned business-property writes through EOG; owner providers declare their own ActionHost commands.
- Do not resume SOP Designer extraction or expand the SOP domain until the product work is explicitly reactivated.
- Do not couple SOP back into EOG merely because historical SOP compatibility assets carry EOG-named types or graph/application-node references.
- Do not treat Application Runtime Binding as EOG-owned; the generic provider contract/package is authoritative and old EOG paths are compatibility only.
- Do not bypass Application Runtime Binding package lifecycle by directly consuming its implementation when normal provider resolution is available.
- Do not resume SOP extraction/product development during the four-project boundary audit.
- Do not treat Experience-Compiler as replaced by the App Platform enterprise-agent package; EC remains an independent owner project for durable advisory intelligence.
- Do not read EVO compatibility endpoints as target EVO Ledger Runtime Core ownership; targetCoreBoundary and minimal-runtime decisions are authoritative.
- Do not reopen SOP work while proving the App Platform to EVO applicationId contract path.
- Do not move Template Store into Enterprise Context; Template Store is an independent APPLICATION plugin and Enterprise Context remains the definition/share authority.
- Do not collapse 2D Designer Submit into Publish or Share; Save, Submit, Publish and Share are distinct lifecycle actions.
- Do not implement template use as a live source reference; v0.1 semantics are Copy -> independent enterprise-owned content.
- Do not make Share an alias for Enterprise Context Publish; a shared bundle may pin either an exact Draft or Published revision.
- Do not import Template Store private persistence from Enterprise Context or Enterprise Context private persistence from Template Store; both sides use contracts/template-transfer.ts.
- do not create a global top-level Projection application; Projection views are children of their owning Business Definition surface
- do not infer business icons from node names; wait for owning-plugin visualIdentity metadata
- do not move Projection presentation state into Ledger Runtime business truth
- do not create Projection versions; Projection save overwrites presentation state in place
- do not create or advance Business Definition versions for Projection rename, layout, hide/show, Restore all, Save As or default-view changes
- do not reopen Restore all/reset as pending; the Human flow has already been implemented and user-validated
- do not merge EOG 2D Viewer and EOG 2D Designer; they remain separate capabilities even though Ledger Manager owns the Projection product entry
- do not implement natural-language Projection requests as hard-coded business keyword/path rules; the Personal Agent reasons from current material and writes exact retained IDs
- do not simulate mouse/drag/click actions for Personal Agent Projection authoring; use the governed Projection capability directly
- do not require the Human to repeat definitionId/revision/projectionId after opening the intended 2D Projection Editor in the same Workbench session
- do not claim multi-tab current-editor arbitration is solved by v0.4; the first acceptance targets one intended current editor per active Workbench session
- do not require Personal Agent 当前上下文 to be ENTERPRISE merely because the Human is operating an enterprise 2D editor; chat/memory context and current-editor task scope are separate
- do not scope current-editor resource invalidation to the Personal Agent chat context; publish it to the current editor Enterprise Context
- do not expose current enterprise editor tools solely because a stale session target exists; re-check principal access to that editor enterprise
- do not weaken current-editor WRITE governance when chat context is Personal; Owner/Admin and material-write authorization are evaluated against the editor enterprise
- do not make stable deterministic common product functions Agent-only merely because Personal Agent can express the same intent
- do not create one bespoke Agent tool per foreseeable UI feature; keep stable governed editor capabilities small and composable
- do not keep appending global Diagram/Projection header buttons as functionality grows; classify actions into frequent toolbar actions, More overflow, canvas controls, or selection Inspector actions
- do not add Ledger, Application, sales, cash or other business vocabulary to Eidos auto-layout heuristics
- do not make Auto layout persist immediately; it is a local presentation edit until Save projection
- do not let Auto layout create Projection versions or Business Definition versions
- do not reopen fixed Auto layout or scalable Projection action-area validation after the Human production pass unless a new regression is observed
- do not rename the Counterparty product/domain back to 往来; the canonical product name is 往来对象 / Counterparty
- do not model Customer, Supplier, Employee or other roles as duplicate Counterparty master identities
- do not reintroduce legacy dealerLabelName-style comma-separated relationship labels as a Counterparty core field
- do not store Counterparty domain data in a private plugin file/database outside the Enterprise Context Resource Library
- do not move AR/AP balances, open-item accounting, settlement, matching, collection or payment workflows into the Counterparty plugin
- do not mechanically copy the legacy Asloop Dealer mega-record; preserve semantics through explicit identity, role and profile resources
- do not reopen Counterparty core edit as pending; Directory/Create/Detail/Edit/Archive are complete in production
- do not rename the product/domain to 往来; the canonical name is 往来对象 / Counterparty
- do not recreate Customer or Supplier as separate master identities; model them as roles/relationships on one stable Counterparty
- do not copy legacy dealerLabelName as a comma-separated identity field
- Do not implement generic ImportJob/Staging/Mapping, enterprise custom-field registry, EffectiveObjectSchema compiler, generic Projection execution, Responsibility framework, Personal Workbench framework or LLM adaptation pipeline inside apps/counterparty.
- Do not stabilize a shared Foundation Object contract from Counterparty evidence alone; Item/Product is the required second-object anti-overfit proof.
- Do not start Item/Warehouse as separate bespoke stacks; they must consume the shared Foundation Object contracts created from the Counterparty vertical proof.
- Do not expand Foundation Objects indefinitely before business use; after Counterparty + Item + Warehouse/Location, move the mainline into the Trading Reference Loop.
- Do not treat Enterprise Context as the semantic owner of Counterparty, Item, Warehouse, Object Extension, Import, Responsibility or Projection merely because their resources are persisted there.
- Do not bypass Enterprise Context Resource Library with a private durable Foundation Object database/store unless the public resource contract explicitly uses a governed TABLE/OBJECT/REFERENCE storage profile or provider reference.
- Do not couple plugin uninstall to deletion of enterprise resources; purge is a separate explicit destructive lifecycle.
- Do not repeat FO-01 shared descriptor/schema/extension contracts, EffectiveObjectSchema compiler, conformance testkit, or Counterparty schema integration; these are merged on main.
- Do not advertise enterprise.object-extension.definition as an effective public capability until CP-03 supplies governed invocation/authorization; FO-01 intentionally created the package/repository boundary without a fake callable capability.
- Do not ask for CP-02 Human validation again; it passed on 2026-10-07.
- Do not reopen FO-01; shared Foundation Object contracts/compiler are already merged and production-deployed.
- Do not rebuild the Data Import core inside Counterparty; PR #431 already provides the generic app and neutral import-target contract.
- Do not claim 10k full committed import is proven; only 10k stage + dry-run is currently certified.
- Do not close CP-03 merely because CSV works; XLSX, Human import experience and committed demo/bulk persistence evidence remain.
- Do not reintroduce per-row physical Enterprise Resource snapshot writes for Counterparty bulk import; use the transaction/bulk persistence path added in PR #433.
- Do not treat COMMITTED_WITH_ERRORS from an ATOMIC_BATCH target as partial success; for Counterparty atomic batches succeededRows must be zero when the batch rolls back.
- Do not add another Counterparty-private import UI; the generic Data Import Human experience is merged in PR #439.
- Do not bypass the Data Import dry-run and explicit commit confirmation in Human flows.
- Do not introduce a second XLSX parsing dependency/path; PR #439 provides the bounded first-sheet adapter behind the generic staged source model.
- Do not treat Import Recipe as the persistent learning owner; Recipe is the deterministic whole-file execution artifact/cache while Experience Compiler owns persistent advisory learning.
- Do not store EC-learned import semantics in Enterprise Context merely because Enterprise Context persists business resources.
- Do not embed Experience Compiler into EVO/App Platform to bypass the current Railway resource quota; EC must remain an independent optional advisory service.
- Do not use core-schema label matches such as 国家或地区 -> countryOrRegion as evidence that EC learned semantics.
- Do not reopen CP-03D for Contact, Address, CustomerProfile, SupplierProfile or richer Counterparty domain modeling; Human accepted CP-03D closure and those semantics belong to CP-05 through CP-07.
- Do not diagnose repeated Personal Agent replies as four independent tasks when they share one user turn; turn-level idempotency and single-flight resume are now required behavior.
- Do not reintroduce AGENT_RUN_RESUME_CONFLICT as a user-facing normal recovery path; concurrent resume must join the in-flight durable slice.
- Do not equate AI-native with JSONL, JSON-first storage, vector databases, or sending all available context to the model.
- Do not use Conversation history as a substitute for durable Working State, Personal Context Memory or Experience Compiler learning.
- Do not overwrite or discard raw Conversation solely because a model context window is full; compression must be derived, versioned, traceable and regenerable subject to retention policy.
- Do not adopt experimental AI infrastructure as production authority when mature replaceable technology satisfies the requirement.
- Do not jump directly from CP-03D to CP-05; execute AF-01 and AF-02 first according to the accepted bounded debt-retirement route.
- Do not expand AF-01/AF-02 into an open-ended Personal Agent rewrite before CP-05.
- Do not migrate every JSON/JSONL store merely for consistency; migrate only authoritative product state justified by the constitution and route.
- Do not reopen CP-05 after Human acceptance; Contact/Address/Profile semantics are now closed Foundation Object evidence and CP-06 must build on their public contracts.
- Do not move Workspace / Personal Workbench ownership back into App Platform Host or Counterparty; it is the independent optional evo-bi-workbench plugin in the BI / Insight Experience Layer, while business plugins only contribute governed items.
- Do not reopen CP-07 or ask for its 10k/100k/1M maturity evidence again; CP-07 closed on 2026-10-09 after PR #519 merged, 42/42 combined CI passed, and Railway production deployment f681b927-2685-4d66-8654-299e0374c347 succeeded.
- Do not stabilize shared Foundation Object contracts from Counterparty alone; IT-01 Item/Product is the required materially different second-object anti-overfit proof.
- Do not copy Counterparty semantics into Item/Product shared infrastructure; reuse only object-agnostic contracts and extract/converge generic mechanisms when second-object evidence requires it.
- Do not ask for CP-06 Human product validation again; it passed on 2026-10-09. CP-07 is also CLOSED_PRODUCTION_PASS and IT-01 is active.
- Do not reopen IT-01A or replace generic applicability qualifiers with a new Item-specific applicability key; Item is the proof that new objects must use object-neutral qualifier dimensions.
- Do not put GTIN/SKU/variant/category into the initial Item identity merely to make the model look complete; those boundaries require later real-world Item evidence.
- Do not reopen IT-01B or add a duplicate Item payload lifecycle status; Enterprise Resource ACTIVE/ARCHIVED is the current Item identity lifecycle authority.
- Do not create an Item-specific import subsystem in IT-01C; Item must prove the existing generic Data Import target/service contracts.
- Do not reopen IT-01C or create an Item-only Data Import framework; Item now consumes the generic Data Import target/service path.
- Do not turn Item Projection into a new business-data authority in IT-01D; projections remain derived from authoritative Item/Extension/Responsibility data.
- Do not move Workspace ownership into Item; evo-bi-workbench remains the optional BI / Insight Experience owner.
- Do not reopen IT-01D; its lifecycle-gated Item Projection/Responsibility/Eidos product slice passed 34/34 CI and production deployment on 2026-10-09.
- Do not treat ITEM_STEWARD Responsibility as Item authorization; it filters My Items only after normal Authorization Provider decisions.
- Do not force-install evo-item merely because it is present in Catalog; PR #509 install/use-driven lifecycle rules remain authoritative.
- Do not reopen the lifecycle-aware Data Import target registry debt; PR #532 resolved it with active-feature metadata discovery and use-time lazy target implementation loading.
- Do not reopen row-dynamic qualifier-aware Item import; PR #534 resolved it with shared DISCOVERY/EFFECTIVE applicability modes and per-row effective validation.
- Do not treat Open Food Facts barcode/code, GTIN, category, brand or packaging fields as EVO Item primary identity during IT-01E RVC; they are external identifiers/classifications until evidence says otherwise.
- Do not reopen IT-01 or rerun its Open Food Facts RVC without new compatibility evidence; IT-01 closed on 2026-10-09 after PR #538, real-data CI and production deployment passed.
- Do not make GTIN/barcode a universal Item primary key; external trade-item identifiers remain scheme+value evidence separate from enterprise Item identity.
- Do not add universal Product/SKU/variant/category core fields from naming preference; those remain domain relations/classifications until business evidence requires them.
- Do not infer enterprise baseUomCode from package quantity text; base UOM is governed operational UOM, external package measure is separate evidence.
- Do not put inventory quantity/on-hand/availability into Warehouse master data during WH-01; Warehouse is where, Inventory Position is what Item is there and how much.
- Do not casually redesign STABLE_CANDIDATE Foundation Object contracts in WH-01; require concrete third-object incompatibility evidence.
- Do not reopen WH-01A or introduce a generic hierarchy framework from Warehouse alone; warehouse.location hierarchy remains domain-owned until a second structurally hierarchical consumer proves a shared abstraction.
- Do not put on-hand, available, reserved or ledger quantities into Warehouse or Warehouse Location master data; Inventory Position owns what Item is there and how much.
- Do not reopen WH-01 or infer Inventory Position quantities from Warehouse/facility data; WH-01 closed with real Overture RVC and Warehouse remains where only.
- Do not continue adding Foundation Objects as the mainline during TR-01; pressure existing Counterparty, Item and Warehouse/Location through real business operations.
- Do not mutate historical Purchase Order/Receipt/Shipment facts to represent later state; state changes are new business/ledger facts and projections are derived.
- Do not reopen TR-01A1 or duplicate EVO Ledger/Work/Balance authority in App Platform.
- Do not start TR-01B until TR-01A2 immutable receipt reversal and replay certification have closed.
- Do not modify original Purchase Order or Goods Receipt to represent a correction; append an explicitly linked REVERSES fact.
- Do not repeat TR-01A2 reversal reference implementation or replay certification; it is merged, cross-project CI passed and production deployed.
- Do not mark all TR-01A acceptance complete solely from A1/A2 economic CI: governed Human/Agent/Workbench operational view acceptance still requires explicit evidence.
- Do not treat the certified full reversal of one known Goods Receipt as proof of safe generalized partial/concurrent over-reversal or original-cost read-back.

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

- state WH-01 Warehouse/Location third-object proof as CLOSED_PRODUCTION_PASS after PR #546 / main commit 0397a31f341a101756af5572f36d52390703c1a7 / Railway deployment 235335b8-44e3-4da4-9682-6cb75c70bcb6 SUCCESS and 5,000-row Overture real facility RVC PASS
- state TR-01A Purchase Order → Receipt → Inventory Position → Payable as the current active Foundation Object Program slice
- state selected object-neutral Foundation Object contracts as STABLE_CANDIDATE through TR-01; promote to STABLE only after real trading loop evidence
- state current production Ledger Configurator as App Platform PR #546 merge commit 0397a31f341a101756af5572f36d52390703c1a7 / Railway deployment 235335b8-44e3-4da4-9682-6cb75c70bcb6 SUCCESS
- state WH-01C Warehouse Responsibility / Projection / Eidos composition as MERGED_CI_PRODUCTION_PASS via PR #544 / main commit f47890b5823ad7389625563d5a6f0c62eb220fdb / Railway deployment 60a02755-b544-48cf-907c-95e3feddd56f SUCCESS after 34/34 combined CI
- state WH-01B hierarchical Warehouse Location Data Import as MERGED_CI_PRODUCTION_PASS via PR #542 / main commit 9f3e65e84d521f2e6ea23aba31dc64525c3aa224 / Railway deployment c2011371-4309-4982-9062-90cb98a166a9 SUCCESS
- state WH-01A Warehouse identity + Location hierarchy as MERGED_CI_PRODUCTION_PASS via PR #540 / main commit 4f9490b24792836db5d070bd8b2b2767809f3bda / Railway deployment a946ec39-35d2-4c73-8dd2-d9e3b7cd5de1 SUCCESS
- state IT-01 Item/Product second-object proof as CLOSED_PRODUCTION_PASS after PR #538 / main commit 139ad94c13909a1f47c73d081742a5a6a870eef5 / Railway deployment ca33d2da-7de7-483a-b584-1d71d38f84d1 SUCCESS
- state WH-01 Warehouse/Location third-object proof as the current active Foundation Object Program gate
- state selected object-neutral Foundation Object contracts as STABLE_CANDIDATE after Counterparty + Item proof, while Item/Product/SKU/variant/trade-identifier/UOM/classification semantics remain domain-owned/EXPERIMENTAL
- state Warehouse = where and Inventory Position = what Item is there and how much; Warehouse master data must not own stock balances
- state IT-01E row-dynamic qualifier-aware import as MERGED_CI_PRODUCTION_PASS via PR #534 / main commit 9d4475ac18e2457e46d7b596f9a3e87d0e5db4ac / Railway deployment b16708e5-b17b-4151-99d1-4803880880b3 SUCCESS
- state both IT-01E platform gaps (lifecycle-aware import targets and row-dynamic qualifier import) as closed before real-world Item RVC
- state IT-01E lifecycle-aware Data Import target registry as MERGED_CI_PRODUCTION_PASS via PR #532 / main commit 07ae77f1f9f94b9860b29c20f858bd059b23c502 / Railway deployment c7ac359b-3fe7-4a5c-b258-9fb7e3baa01d SUCCESS after 35/35 CI
- state IT-01D Item projections/responsibility + governed Eidos experience as MERGED_CI_PRODUCTION_PASS via PR #530 / main commit ea3594f06625803883b7fd6dddcc878feb8bdc99 / Railway deployment bb543f4b-fb43-4d4e-a515-c83eb46ff992 SUCCESS after 34/34 CI
- state Item import Host exposure as intentionally pending a lifecycle-aware Data Import target registry; do not statically register the Item target merely to make it visible
- state IT-01C generic Data Import reuse with Item target as MERGED_CI_PRODUCTION_PASS via PR #528 / main commit 8639fc0914e33d4040b92a1541679557f97c9cee / Railway deployment f4e56280-cfae-4012-bc8a-ed4e48d77ec6 SUCCESS
- state IT-01B Item Enterprise Context repository + deterministic identity lifecycle as MERGED_CI_PRODUCTION_PASS via PR #524 / main commit 7dbe34f706fdf4dd27d60997127cc5766002b1de / Railway deployment d2d85a7f-3987-4f49-8bf5-de9a3c6e9d58 SUCCESS
- state IT-01A Item second-object schema/anti-overfit proof as MERGED_CI_PRODUCTION_PASS via PR #522 / main commit d9ad7b6cb194096f04aa58979af27e0af99d157d / Railway deployment 3aa0e5fb-139a-492f-be63-41b1b9255c9b SUCCESS
- state object-neutral applicability qualifiers as the path for new Foundation Objects while Counterparty relationshipRoles remains v0.1 compatibility debt
- state CP-07 Counterparty maturity gate as CLOSED_PRODUCTION_PASS on 2026-10-09 after PR #519 merged, 42/42 combined CI passed and Railway production deployment f681b927-2685-4d66-8654-299e0374c347 succeeded
- state CP-06 Personal Workbench + Agent as CLOSED_HUMAN_PASS on 2026-10-09 with evo-bi-workbench remaining the independent optional BI / Insight Experience plugin
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
- state EOG upper-layer expansion and major Personal Agent feature expansion as deferred while their existing assets remain preserved/regression-protected
- state Agent Capability Fabric v0.2 / External Agent READ/PLAN foundation as VERIFIED_PRODUCTION_PASS rather than an active validation gate
- state Grok Web native client identity as https://grok.com/oauth/mcp-client.json with current URL-only connector setup
- state Grok Mobile/manual compatibility Client ID as docs/integration-clients/grok-web-mobile-client.json with no Client Secret
- state PR #255 handshake-era MCP compatibility as live-proven for native Grok while the 2026-07-28 path remains supported
- state immediate Grant-revocation cutoff as live-proven: a fresh Grok /mcp request returned 401 while the connector remained configured
- state the Grok first-consent browser-return stall as a known Web+Mobile client UX interoperability issue, not an unresolved authorization gate
- state External Agent WRITE, additional non-Ledger external projections and ChatGPT product-specific entitlement/UX as future expansion rather than foundation blockers
- state EOG 2D/3D Responsibility Convergence v0.1 as the active milestone
- state Enterprise Context as the authoritative Enterprise Graph Definition lifecycle/persistence owner
- state Eidos 2D Core and 3D Core as reusable business-semantic-free frontend framework capabilities
- state App Platform target EOG package family as EOG 2D Designer, EOG 2D Viewer and EOG 3D Viewer
- state all three EOG plugins as consumers of one semantic definition with separate 2D/3D View State
- state Observatory/SOP/analysis/runtime assets as preserved pending peer-plugin extraction rather than EOG Core ownership
- state Eidos PR #75 as merged and authoritative for reusable 2D Core / 3D Core ownership
- state EOG 2D Designer controlled cutover as active: evo-eog-2d-designer owns /operating-graph Experience plus semantic/2D Human action handlers
- state EOG 2D Viewer controlled cutover as active: evo-eog-2d-viewer owns desktop/mobile-read Experiences and Viewer read/orchestration handlers
- state all three EOG application Experiences as cut over to dedicated packages: evo-eog-2d-designer, evo-eog-2d-viewer and evo-eog-3d-viewer
- state EOG semantic Personal Agent tools as owned/lifecycle-gated by evo-eog-2d-designer
- state EOG Observatory Personal Agent tools as owned/lifecycle-gated by evo-eog-2d-viewer while calculations remain peer-Provider-owned
- state stable enterprise.operating_graph.view.get/apply as DIAGRAM_2D-only compatibility tools owned by evo-eog-2d-designer
- state enterprise.operating_graph.spatial_view.get/apply as SPATIAL_3D tools owned and lifecycle-gated by evo-eog-3d-viewer
- state no EOG Agent tool descriptor as owned by evo-app-platform after the 2D/3D View split
- state ENTERPRISE_OPERATING_GRAPH as the Enterprise Context Business Definition kind for EOG semantic truth
- state 2D/3D View State as explicitly excluded from Enterprise Business Definition payloads
- state EOG semantic Host runtime as repository-backed through Enterprise Context Business Definition authority after the cutover
- state the EOG-specific persistence adapter as owned by evo-eog-2d-designer, not by the generic Enterprise Context provider
- state the legacy EOG semantic file as migration evidence/input only with no new authoritative writes
- state EOG Enterprise Context semantic persistence cutover as VERIFIED_PRODUCTION_PASS
- state production #269 as commit 932098f9e2be13e1d0c9cf809831d3f3c5c2297c / deployment f93c06bd-651a-4b86-bb60-e97cab781d6a SUCCESS after controlled restart
- state the first production migration as importing exactly 1 legacy EOG graph definition into Enterprise Context and the controlled restart as graph-migration-idempotent
- state jiangxng/eidos PR #76 / commit 860658902b76fd0b1e5b9bd5faa01f17d4ca7920 as the explicit public 2D Core / 3D Core API authority
- state EOG 2D Designer and EOG 2D Viewer as consumers of the Eidos 2D Core facade
- state EOG 3D Viewer as a consumer of the Eidos 3D Core facade
- state EOG 2D Designer, 2D Viewer and 3D Viewer physical application ownership as converged
- state EOG application package imports from manager-private implementation as prohibited by CI
- state EOG 2D Viewer as an interactive semantic-read-only Workspace, not a static read-only page
- state EOG 2D Designer as the same shared interaction foundation plus governed semantic editing capabilities
- state node/edge selection and structured Inspector property display as shared Viewer/Designer behavior
- state peer-owned Inspector properties as lazily resolved on selection through additive providers rather than prefetched for the full graph
- state Viewer as stripping Inspector edit descriptors while Designer preserves owner-declared commands
- state EOG-owned semantic reference and unconfirmed Guidance source edits as governed new-revision mutations, not historical rewrites
- state Eidos 2D PRs #77-#81 as the upstream Workspace/Inspector authority
- state App Platform PRs #287-#296 as the interactive 2D Workspace and Inspector convergence line
- state peer-plugin extraction baseline PR #286 as closed and the next EOG gate as SOP Designer package identity
- state SOP as a separate preserved peer domain whose extraction/product development is currently deferred
- state Runtime Binding Adapter contract/package identity as the active next convergence gate
- state Enterprise Application Runtime Binding as a generic lifecycle-gated PLATFORM_PROVIDER rather than EOG-owned infrastructure
- state existing Runtime Fact / Analysis Providers as audited with SOP conformance/deviation preserved frozen debt
- state the active next gate as the EVO / App Platform / Eidos / Experience Compiler contract-boundary audit
- state the four-project contract-boundary audit as CLOSED PASS
- state Experience-Compiler as an independent owner project and enterprise-agent as an App Platform integration/package boundary
- state the current open gate as App Platform semantic Application -> Application Runtime Binding -> EVO applicationId public-contract proof
- state SOP as separate and deferred
- state Template Store v0.1 as merged through App Platform PR #342 with package evo-template-store and route /templates
- state Eidos PR #88 / merge 0d889af675f59466091fdcf89a061c0d421e7bdb as the reusable Catalog Browser thumbnail authority
- state Template Store card v0.1 as thumbnail + name + description with the first built-in EVO 账本运行时基线 template
- state Enterprise Context as the template definition/share authority and Template Store use as copy-only with no required live source linkage
- state the current Template Store gate as the public Enterprise Context Share/Copy contract while SOP remains separate and deferred
- state App Platform PR #344 / merge 6269e05c5218caf35a32ab3c7cfc6a4973cf77c4 as the merged neutral Template Store Share/Copy transfer boundary
- state Share as exact-revision export that may represent Draft or Published state, preserving Submit != Publish != Share
- state Template Store snapshots as immutable cloned bundles with deterministic SHA-256 integrity
- state Copy as creation of an independent target Enterprise Context revision-0 Draft with TEMPLATE_COPY provenance and no live source dependency
- state the current Template Store gate as governed ActionHost Share/Copy plus durable Store persistence and catalog projection
- state Projection as non-versioned presentation state whose saves overwrite in place without advancing Business Definition versions
- state Business Definition versions as representing real semantic business change rather than Projection layout/view changes
- state Restore all/reset for Projection as implemented and Human-validated rather than an open gate
- state Eidos PR #125 and App Platform PR #405 as the pane-responsive Personal Agent header and Projection no-version correction
- state Ledger Manager -> definition/version -> Projection views as the Projection product home while 2D Viewer and 2D Designer remain separate
- state App Platform PR #407 as merged and CI-passed: Personal Agent can directly crop the current open 2D Projection from natural-language intent with no mouse simulation
- state the normative first Projection Agent scenario exactly as: open a 2D Projection Editor, tell Personal Agent 帮我裁剪出从销售到收款的投影, and have the current canvas refresh automatically
- state current Projection target selection as established by opening/loading the qualified editor in the same Workbench session
- state natural-language Projection meaning as model reasoning over current material, not an EOG/Eidos sales-to-cash keyword dictionary
- state the next Projection gate as Human browser live validation of this direct current-editor flow
- state App Platform PR #410 as the production fix for Personal Agent context=Personal while an enterprise 2D editor is current
- state Personal Agent chat/memory context and current-editor task/resource scope as separate concepts
- state current-editor tool exposure under Personal chat context as allowed only after editor-enterprise access is rechecked
- state current-editor writes as Owner/Admin governed and authorized against the editor Enterprise Context rather than the chat context
- state the next live gate as re-running the exact screenshot scenario without manually switching 当前上下文 away from 个人
- state Eidos PR #126 and App Platform PR #412 as the fixed layered Auto layout plus scalable action-area implementation
- state stable deterministic common functions as first-class Human product capabilities while Personal Agent handles open-ended semantic/compositional intent
- state Auto layout as domain-neutral layered/hierarchical, left-to-right by default, visible-material-only and unsaved until Save projection
- state Projection Editor action IA as frequent Auto layout + Save projection with secondary management actions under More
- state the prior Personal Agent current-editor crop scenario as Human-confirmed working and the next gate as Human browser validation of fixed Auto layout/action ergonomics
- state fixed Auto layout and scalable Projection action-area v0.5 as Human-validated in production
- state App Platform PR #415 as the merged/production first Counterparty slice and the first concrete Enterprise Resource Library consumer
- state the canonical product/domain name as 往来对象 / Counterparty, with evo-counterparty as the first-party package
- state Counterparty data as Enterprise Context-owned resources under namespace evo.counterparty rather than a private plugin database
- state Customer/Supplier/etc. as roles/relationships over one stable Counterparty identity, not separate master objects
- state legacy Asloop Dealer as design lineage that validates shared identity + role semantics but must not be copied mechanically
- state Counterparty as identity/master-data scope only and explicitly outside AR/AP/open-item/settlement ownership
- state the next live gate as Counterparty current-master-data editing plus explicit relationship roles
- state Counterparty / 往来对象 v0.1 core master-data loop as production-complete through PR #417
- state Eidos PR #127 initialValue support as the generic edit-form mechanism used by Counterparty
- state Counterparty Relationship Roles v0.2 as the current live milestone
- state the Foundation Object Program as the active short-term mainline after the current Counterparty v0.2 Human validation gate
- state Counterparty as the first Foundation Object reference implementation, not the owner of generic import/extension/projection/responsibility/workbench/adaptation infrastructure
- state FO-01 Shared Foundation Object contracts + EffectiveObjectSchema compiler as the next implementation gate after Counterparty v0.2 Human pass
- state shared Foundation Object contracts as EXPERIMENTAL until Item/Product provides the materially different second-object proof
- state the program sequence as Counterparty -> Item/Product -> Warehouse/Location -> Trading Reference Loop rather than building every master-data object first
- state generic Data Import, Enterprise Adaptation and Responsibility capabilities as separate reusable product/application capabilities, not Counterparty-private infrastructure
- state Enterprise Context as the canonical thin persistent enterprise Resource Container/data plane for Foundation Object durable resources, analogous to a Docker Volume at the logical lifecycle boundary
- state the permanent rule exactly: Enterprise Context provides space; plugins/applications define what stored resources mean
- state Counterparty/Item/Warehouse durable enterprise resources as stored through Enterprise Resource public contracts rather than plugin-private durable stores
- state plugin uninstall as not deleting Enterprise Context resources by default; reinstall/bind reattaches and migrates as required
- state Object Extension as a separate reusable application semantic owner whose enterprise definitions/values persist in Enterprise Context
- state FO-01 Shared Foundation Object contracts + EffectiveObjectSchema as already merged, CI-passed and production-deployed through PR #427 / commit 5e8eb39b4fa56110de79814785ab3fd25d0a2e01
- state CP-02 Counterparty Relationship Roles Human browser validation as still open and not implicitly satisfied by FO-01 implementation
- state Object Extension definitions as enterprise-scoped resources persisted through Enterprise Context, with public mutation/invocation deliberately deferred to CP-03
- state Counterparty create/edit form fields as now driven by EffectiveObjectSchema rather than a duplicated private field list
- state CP-02 Counterparty Relationship Roles v0.2 as CLOSED with Human production validation PASS on 2026-10-07
- state Object Extension public capability as merged in PR #430 and Data Import core + Counterparty target as merged in PR #431
- state CSV stage/dry-run/commit, extension value sidecars, role-aware Counterparty import, schema drift guard and 10k stage/dry-run as already implemented
- state CP-02 as CLOSED_HUMAN_PASS based on user production validation
- state Counterparty import commit semantics as ATOMIC_BATCH: any batch failure rolls back all imported Counterparty/Role/Extension resources
- state PR #439 / commit 8876cedc259a2135a8c56d4721ea7b2f95901e6e as merged, CI-passed and production-deployed for CP-03 XLSX + Human Import Experience
- state CSV and XLSX as normalizing into the same staged Data Import source model
- state import mapping as suggested from EffectiveObjectSchema field IDs and localized labels rather than Counterparty-specific spreadsheet hardcoding
- state CP-04 Responsibility + Projections as CLOSED_HUMAN_PASS and do not reopen it because CP-03D was later refined
- state CP-03D Data Import learning + reuse closure as CLOSED_HUMAN_PASS and AF-01 Conversation PostgreSQL Authority as the current open gate
- state Experience Compiler as the persistent learning owner for Data Import experience; EVO owns deterministic import execution and Eidos owns Human presentation
- state Import Recipe as the same-structure deterministic fast path/cache, not the learning system
- state Experience-Compiler PR #7 / commit 63c2304b6b54fa40a63996b3c3736b8ad4277c1e as merged and CI-passed for tenant/object-scoped mapping experience and advisory recommendation
- state App Platform PR #462 / commit be1e33bc0bb8b7ec220f04ad1589d97171e9c7d1 as merged, all CI-passed and production-deployed at Railway fa2d9ffb-46e7-4b7f-bb61-6b4b4351c7ee
- state the first hard EC learning proof as 编码 -> Counterparty.code learned from a Human-confirmed successful import and reused in a different overall table structure
- state EC as optional/advisory: its absence or timeout must not make Data Import unavailable
- state CP-03D as closed after same-structure Human validation plus cross-structure real-EC production proof, with recommendation presentation explicitly non-gating at this stage
- state docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md as the active project constitution for Personal Agent state, long-context management, Context Assembly, Memory, EC learning integration and storage decisions
- state AI-native as explicit governed durable model-independent state/context architecture rather than JSONL-first storage
- state Conversation, Working State, Personal Context Memory and EC learning as distinct semantic layers that must not be collapsed
- state raw conversation as source evidence and summaries/checkpoints as derived versioned regenerable artifacts
- state current file-backed Conversation JSONL as transitional compatibility debt with PostgreSQL as the target authority, while JSONL remains valid for logs/export/migration/evaluation
- state Personal Agent foundation growth as an incremental long-term program including durable conversation, long-context compression, Working State/Runs, idempotency, Context Assembly, governed memory, retrieval, tool discovery, verification, provenance, recovery and EC evidence
- state the active execution route as AF-01 Conversation PostgreSQL Authority -> AF-02 Long-context v0.1 -> CP-05
- state docs/roadmap/AI-NATIVE-AGENT-FOUNDATION-DEBT-RETIREMENT-v0.1.md as the authority for the bounded debt-retirement sequence
- state AF-01 as ACTIVE and describe its controlled Conversation JSONL -> PostgreSQL authority migration with history integrity proof and no indefinite dual-write
- state AF-02 as a bounded long-context foundation slice with source-preserving versioned summaries/checkpoints and minimal Context Assembly rather than a full Agent framework rewrite
- state CP-05 as queued after AF-02, not the immediate next execution gate after CP-03D
- state full Working State, full Context Compiler, broad Memory migration, vector retrieval and automatic Personal Agent -> EC learning as explicitly deferred before CP-05 unless a concrete blocker appears

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
