# Handoff — Person-first Personal Agent / Context Memory Baseline

**Date:** 2026-09-26  
**Status:** authoritative continuation note  
**Branch target:** EVO-App-Platform main after Person-first MVP freeze

## Why this handoff exists

The conversation that led to the current architecture materially changed EVO's root world model. Future LLM sessions MUST NOT reconstruct this from chat memory.

Read first:

1. `docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`
2. `docs/architecture/ENTERPRISE-AGENT-TOOL-SYSTEM-v0.1.md`
3. `LLM.md`
4. `INVARIANTS.md`
5. `project.status.json`
6. `llm.foundation-map.json`

## Frozen interpretation

EVO's first perspective is the human.

```text
Human
  └── Personal Agent
        ├── Personal Context
        │     └── Personal Context Memory
        └── authorized Enterprise Context(s)
              └── Enterprise Context Memory
```

There is no Enterprise Agent in the MVP ontology.

The existing `enterprise-agent` Package, route, command and TypeScript symbols are compatibility implementation assets for the product-facing **Personal Agent**. Do not perform cosmetic repository-wide renames.

## Meaning of Enterprise Context

Enterprise Context is governed working and learning material available to the Personal Agent. It can expose business data, historical events, documents, SOPs, Context Memory and context-bound tools.

Enterprise Context does not own the person's identity.

A person may work across multiple enterprises. Losing one enterprise relationship must not delete the person's Personal Context or Personal Context Memory.

## Context Memory distinction

Two durable memory owners are frozen for the MVP:

- Personal Context Memory;
- Enterprise Context Memory.

Enterprise Context may be used as reasoning material when access is granted.

```text
read/use for reasoning
!=
permission to persist into Personal Context Memory
```

Until a future Memory Attribution boundary exists, cross-context memory promotion is deny-by-default.

Context Memory is durable platform data, not LLM hidden state. Models/providers can be replaced without deleting Context Memory.

## Agent and human responsibility

Personal Agent is an adviser.

```text
observe
→ analyze
→ explain
→ opinion / proposal
→ Human decision
→ governed execution
```

Material final decisions remain human-owned in the MVP. READ and PLAN are the preferred near-term Agent capabilities. WRITE operations remain Host-governed and should not be expanded casually.

## Plugin consequence

Context is the environment in which capabilities/data are available; plugins add capabilities to a Context.

Long-term mental model:

```text
effective EVO view
=
Principal
+ Active Context
+ installed/effective Capabilities
+ relevant Context Memory
+ effective Tools
```

The same Personal Agent remains stable while Active Context changes.

Do not encode enterprise-specific business semantics into Personal Agent core.

## Compatibility / migration strategy

Use **semantic migration first, implementation migration when touched**.

Preserve working assets:

- Plugin Protocol and Package/Feature/Contribution model;
- Provider model;
- Eidos Workbench and design language;
- Secrets Provider;
- Platform Help;
- runtime isolation/storage/events;
- Dynamic Host Tool Discovery;
- existing `enterprise-agent` package machine identifiers.

Known migration debt includes:

- legacy Enterprise Agent names in implementation symbols;
- `PlatformScopeV010` enterprise/company/workspace/user hierarchy;
- Provider binding scopes that predate Person-first Context;
- future authorization assumptions.

Do not solve all migration debt at once.

## Immediate implementation slice

Implement only:

1. `PersonalContextV010`;
2. revised/minimal `EnterpriseContextV010` compatible with existing contract;
3. `ActiveContextRefV010`;
4. Person-first fields in `PlatformRequestContextV010` while retaining legacy `scope`;
5. Host-owned active-context resolution for Personal Agent;
6. active context passed into Host Tool Catalog and model input;
7. a READ-only `context.current.get` tool;
8. Context Memory **read contract only**, no learning engine yet;
9. tests proving the client cannot manufacture an Enterprise Context by merely sending an id.

Do not build:

- full IAM;
- enterprise membership workflows;
- role hierarchy;
- memory learning/write engine;
- multi-Agent architecture;
- automatic cross-context memory transfer.

## Security posture before full permissions

Before authorization is mature:

- default context is Personal Context;
- Enterprise Context must come from a Host-owned resolver/source;
- request/browser input may select among Host-offered Context refs but may not create one;
- missing/unknown enterprise context fails closed;
- Context Memory is read-only at this slice;
- existing privileged platform WRITE protections remain unchanged.

## Next after this slice

Once active Context is real and observable:

1. attach minimal Session/Principal;
2. add Relationship/Grant only when a real Enterprise Context needs access control;
3. filter Tool Catalog by Principal + Active Context;
4. route material WRITE through authorization + human confirmation;
5. then add real Personal/Enterprise Context Memory providers and Memory Attribution.

This document exists specifically so a fresh LLM can continue without needing the original conversation.


## Personal Agent product experience follow-up

After the P0.3 Context plumbing was deployed and exercised in production, the Personal Agent UI was reviewed against Eidos Productive Design Language.

Authority:

- `docs/architecture/PERSONAL-AGENT-PRODUCT-EXPERIENCE-v0.1.md`
- Eidos RFC: `docs/product/ASSISTANT-AND-SETUP-EXPERIENCE-PATTERNS-v0.1.md` in the Eidos repository.

Key finding:

Using an Eidos renderer is necessary but not sufficient. The current `chat@0.1.0` and Extension Manager contracts are too thin for a mature Personal Agent installation/setup/chat experience.

Do not fix this with Personal Agent CSS or custom controls.

Implementation order:

1. Eidos Chat/Assistant v0.2;
2. Eidos Setup Flow v0.1;
3. Eidos Extension Manager readiness + progressive disclosure;
4. optionally Settings Editor v0.2 grouping;
5. update App Platform Eidos pin;
6. add Host-computed Personal Agent readiness and setup orchestration;
7. keep Provider/model/API Key configuration owned by Provider + Secrets surfaces;
8. then improve Personal Agent structured activity/evidence/proposal UX.

Installation principle:

```text
Installed != Ready
```

Do not silently choose an LLM Provider when multiple candidates exist. Provider/vendor choice can carry cost, privacy and credential consequences and therefore belongs to an explicit setup step.

Personal Agent remains zero ordinary configuration: it consumes the selected/resolved `llm.inference` Provider rather than owning vendor-specific settings.


## Four-locale product requirement

From Personal Agent P0.4 forward, new plugin/product UI is designed for four first-class user locales from the start:

- `en` — English;
- `zh-CN` — 简体中文;
- `ja` — 日本語;
- `zh-TW` — 繁體中文.

Personal Agent chat chrome, readiness/setup, Provider-selection/configuration orchestration, errors/notices and proposal/confirmation actions must ship with all four locale bundles.

Existing Help may continue using per-document English fallback while Japanese and Traditional Chinese Help translations are filled incrementally. Missing Help translation must never hide the document.

Machine identifiers and business data are not translated. Do not postpone ja/zh-TW support until after UI implementation; localization and text-expansion behavior are part of P0.4 design and CI.


## P0.4 implementation checkpoint

Personal Agent P0.4 has now been implemented on stacked integration branches.

Implemented:

- App Platform vendored Eidos advanced to `12f61d5a02011a5f974beac8e0fda8c34f81e142`;
- Chat Experience upgraded to `chat@0.2.0`;
- Host-computed Personal Agent readiness distinguishes Installed from Ready;
- Setup Flow v0.1 routes Provider install/selection/configuration through platform-owned surfaces;
- multiple usable `llm.inference` Providers require explicit human selection;
- Provider credentials/settings remain owned by Provider + Host Secrets;
- Extension Manager exposes `Needs setup / Ready / Degraded / Unavailable`;
- Agent replies can render structured text/activity/evidence/proposal parts;
- Personal Agent, Setup, llm.inference Provider selection and OpenAI Provider settings cover `en / zh-CN / ja / zh-TW`.

Current integration stack:

1. PR #59 — Eidos P0.4A vendor sync;
2. PR #60 — Personal Agent readiness + Setup Flow;
3. PR #61 — structured Chat v0.2;
4. finalization branch — four-locale Provider configuration and authority/status updates.

Do not restart Eidos P0.4A or redesign Personal Agent setup.

CI validation is now complete after the repositories were made public and GitHub-hosted runners resumed. Platform CI, Enterprise Agent CI, OpenAI Provider CI and Host Secrets Provider CI all pass on the final P0.4 integration branch.

After P0.4 merge, resume the Person-first roadmap at the first real Enterprise Context source and read-only Agent use. Do not expand to multi-Agent or generic Memory writes.


## P0.5 — first real Enterprise Context source

P0.5 advances the frozen Person-first model from test-only Enterprise Context registration to a real replaceable Provider boundary.

Implemented:

- `EnterpriseContextProviderV010`;
- reference Package `host-enterprise-context-provider`;
- Provider `host.enterprise-context`;
- capability `enterprise.directory`;
- Host configuration source `APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON`;
- dynamic Host Context Registry consumption;
- generic Eidos Chat Context selector from Eidos commit `ff4b720d863f51a2121ef22178c6e54b5bdb8e9f`;
- Personal Agent selection of Host-offered Personal/Enterprise Contexts;
- Host re-validation of the selected Context before Agent execution;
- `context.available.list` READ tool;
- existing `context.current.get` remains the authoritative current Context read;
- en / zh-CN / ja / zh-TW selector chrome;
- tests proving registered Enterprise Context selection succeeds and forged Context selection still fails closed.

Authority:

- `docs/architecture/ENTERPRISE-CONTEXT-PROVIDER-P0.5-v0.1.md`

P0.5 does not add an Enterprise Agent, generic Context Memory writes, automatic cross-context Memory promotion, or broad WRITE autonomy.

P0.5 is CI-verified across Platform CI, Enterprise Agent CI, Host Enterprise Context Provider CI, Host Authorization Provider CI, OpenAI Provider CI and Host Secrets Provider CI.

After P0.5, the next mainline is the minimum executable Principal/Session + Relationship/Grant layer needed to determine which Enterprise Contexts a human is entitled to receive and which Context-bound tools are effective.


## P0.6 — Principal, Session and Enterprise Context Grants

P0.6 implements the minimum executable identity/relationship layer required by the frozen Person-first model.

Implemented:

- `IdentitySessionProviderV010`;
- reference `host-static-session-provider` / `host.static-session`;
- capability `identity.session`;
- `APP_PLATFORM_STATIC_SESSION_JSON` reference configuration;
- compatibility-local Session only when no effective Session Provider exists;
- effective-but-unusable Session Provider fails closed;
- `EnterpriseContextGrantV010` and `EnterpriseContextGrantProviderV010`;
- reference `host-enterprise-context-grant-provider`;
- capability `enterprise.membership`;
- `APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON`;
- Personal Context identity derived from current Principal;
- available Enterprise Contexts = Enterprise Directory ∩ current Principal grants;
- unknown/ungranted Context selection fails closed;
- authoritative Principal supplied to Personal Agent model input;
- `enterprise.context.profile.get` READ tool appears only in a Principal-consistent Enterprise Context;
- isolated CI for Session and Grant Providers.

Authority:

- `docs/architecture/PERSONAL-AGENT-PRINCIPAL-GRANTS-P0.6-v0.1.md`

P0.6 deliberately does not implement full IAM, interactive login, request-bound bearer/cookie sessions, generic Memory writes or broad material WRITE authorization.

The next mainline is request-bound identity/session transport plus Principal + Active Context authorization for material WRITE actions. Context Memory Providers and Memory Attribution/Governance follow after that security boundary is executable.


## P0.7 — request-bound Session, Enterprise Context creation and ownership

P0.7 makes Enterprise Context creation the first explicit governed Material WRITE in the Person-first model.

Implemented:

- request-bound Session contract `RequestIdentitySessionProviderV010`;
- capability `identity.session.request`;
- reference `host-bearer-session-provider` / `host.bearer-session`;
- bearer-only reference authentication; a session ID alone is not accepted;
- Host-derived `PlatformRequestContextV010` passed separately from browser Action values;
- durable/in-memory `EnterpriseContextGovernanceStoreV010`;
- lifecycle states `CREATING / ACTIVE / SUSPENDED / ARCHIVED`;
- platform command `enterprise.context.create`;
- creation from Personal Context only;
- HUMAN Principal requirement for initial ownership;
- fail-closed `authorization.check` requirement;
- explicit confirmation intent requirement;
- atomic creation of Enterprise Context + ACTIVE OWNER Relationship + initial access Grant + CREATING→ACTIVE events;
- immutable `enterpriseId / createdBySubjectId / createdAt`;
- ACTIVE Enterprise Context must retain at least one ACTIVE OWNER;
- capability `enterprise.relationship` with reference `host.enterprise-relationship`;
- effective Context API exposes the current Principal's active enterprise relationships;
- all Personal Agent WRITE tools now pass through a Host Material WRITE authorization hook before execution.

Authority:

- `docs/architecture/ENTERPRISE-CONTEXT-CREATION-OWNERSHIP-P0.7-v0.1.md`

The creator is an immutable audit fact. OWNER is a separate governance relationship and is the future transfer mechanism.

P0.7 does not yet implement ownership transfer, invitations, membership acceptance, lifecycle mutation commands, full IAM, or generic Context Memory writes.

Next mainline: ownership transfer + member invitation/acceptance + broader Context-aware material WRITE authorization, then Context Memory Provider / provenance / attribution / governed cross-context promotion.


P0.7 final verification: Platform CI plus Enterprise Agent, Authorization, Enterprise Context, Enterprise Context Grant, Enterprise Relationship, Static Session, Bearer Session, OpenAI Provider and Host Secrets Provider CI all pass on the final integration head. P0.7 is merge-ready.


## P0.8 — Enterprise Relationship Lifecycle

P0.8 completes the first executable Human ↔ Enterprise governance lifecycle on top of P0.7.

Implemented:

- invitation states `PENDING / ACCEPTED / DECLINED / REVOKED / EXPIRED`;
- `enterprise.relationship.invite`;
- target acceptance from Personal Context before any Enterprise access exists;
- acceptance atomically creates ACTIVE Relationship + ACTIVE Grant;
- OWNER can grant ADMIN/MEMBER/AUDITOR;
- ADMIN can grant MEMBER/AUDITOR but cannot grant ADMIN;
- MEMBER/AUDITOR cannot invite;
- Relationship lifecycle `ACTIVE → REVOKED`, reactivation forbidden;
- Grant lifecycle `ACTIVE → REVOKED`, revoked Grants excluded from effective Context access;
- direct OWNER revocation forbidden;
- ownership transfer states `PENDING / ACCEPTED / DECLINED / CANCELLED / EXPIRED`;
- two-party ownership transfer with acceptance from target Personal Context;
- atomic ownership acceptance: target OWNER activates while outgoing OWNER Relationship/Grant revoke in one validated commit;
- immutable Enterprise creator facts remain unchanged through ownership transfer;
- append-only relationship lifecycle events;
- P0.7 governance files normalize missing P0.8 collections without manual migration;
- effective Context API exposes current Principal's non-expired pending invitations/transfers;
- Enterprise governance Material WRITE requires both Host structural role rules and `authorization.check` ALLOW.

Authority:

- `docs/architecture/ENTERPRISE-RELATIONSHIP-LIFECYCLE-P0.8-v0.1.md`

P0.8 still uses stable `subjectId` as invitation target and deliberately does not invent a user directory, email invitation system or full IAM.

The next mainline is Context Memory Provider + immutable provenance/attribution + separate Personal/Enterprise Memory authority + governed cross-context promotion, using the Principal + Context + Relationship + Authorization foundation now in place.


## P0.9 — Governed Context Memory

P0.9 makes Context Memory executable without turning chat history or model internals into authority.

Implemented:

- replaceable `context.memory.read` and `context.memory.write` capabilities;
- reference `host-context-memory-provider`;
- durable/in-memory append-only Context Memory store;
- Memory kinds `FACT / CLAIM / EXPERIENCE / PRACTICE`;
- immutable provenance with DIRECT/PROMOTED origin, source Context, source Memory and evidence refs;
- immutable attribution with recording Principal actor and time;
- correction through new `supersedesMemoryId` record; historical Memory is never rewritten;
- Personal Memory writes restricted to the current Personal Context owner;
- Enterprise Memory writes restricted to ACTIVE OWNER/ADMIN/MEMBER; AUDITOR is read-only;
- Human + explicit confirmation required for durable Memory mutation;
- `authorization.check` required for `context.memory.record`;
- `context.memory.promote` creates a new target Memory and preserves source provenance;
- promotion requires write authority on source and target Contexts and explicit policy ALLOW, therefore deny-by-default;
- Personal Agent READ tool `context.memory.search`;
- Agent Memory reads are Host-bound to current Active Context; model-supplied Context selectors are ignored;
- deterministic exact-Context retrieval with id/kind/text/limit/cursor filters;
- isolated Context Memory Provider CI plus Platform/Agent integration verification.

Authority:

- `docs/architecture/CONTEXT-MEMORY-GOVERNANCE-P0.9-v0.1.md`

P0.9 deliberately does not silently persist chat, automatically write learned conclusions, automatically synchronize Personal/Enterprise Memory, or introduce vector retrieval before authority/provenance is stable.

Next mainline: Memory Proposal lifecycle + Human review/edit/accept/reject + evidence quality/confidence + contradiction/supersession assistance + Eidos Memory review surface. EC integration comes later behind these same Context Memory contracts.


## P1.0 — Human-reviewed Memory Proposal lifecycle

P1.0 inserts an explicit Human review boundary between Personal Agent learning and durable Context Memory.

Implemented:

- Personal Agent tool `context.memory.proposal.create`;
- Proposal staging is bound to the Host-resolved current Context and does not write durable Memory;
- Proposal lifecycle `PENDING → ACCEPTED / REJECTED`;
- append-only Proposal revisions;
- Agent-authored initial revision and Human-authored edit revisions remain distinct;
- evidence quality `UNVERIFIED / REFERENCED`, where REFERENCED means references exist, not that truth was verified;
- optional `proposedConfidence` in `0..1`, explicitly supporting metadata rather than Host truth;
- review assistance signals for potential duplicate, explicit potential contradiction references and supersession candidates;
- review signals never make automatic truth decisions;
- Human edit / accept / reject actions;
- Accept requires explicit confirmation, current Context Memory write authority, Proposal Accept authorization and normal Memory Record authorization;
- retry-safe deterministic Memory materialization, preventing duplicate Memory if Proposal finalization must be retried;
- Reject is terminal and creates no Memory;
- Eidos generic `review-queue@0.1.0` consumed from Eidos main `fafff9808e82d5b1c1c6cf8dcbb9dd5602d165b9`;
- Personal Agent Memory Review route `/enterprise-agent/memory`;
- Review Queue fields, evidence, confidence/signals/Context metrics and Accept/Edit/Reject controls;
- Memory Proposal chat presentation explicitly says the proposal is not yet durable Memory;
- UI and chat guidance delivered together in `en / zh-CN / ja / zh-TW`;
- dedicated Personal Agent Memory Review CI plus Platform, Agent, Context Memory and authority integration coverage.

Authority:

- `docs/architecture/CONTEXT-MEMORY-PROPOSAL-REVIEW-P1.0-v0.1.md`

The critical invariant is now executable:

```text
Personal Agent may propose
Human reviews and decides
Host revalidates Context + authorization
only Accept materializes immutable Context Memory
```

P1.0 does not yet implement semantic contradiction judgment, evidence-source trust verification, retention/privacy policy, bulk learning ingestion or EC adapters.

Next mainline: governed Memory intake/source identity + evidence trust metadata + retrieval quality/semantic search behind the Memory Provider contracts + EC adapter boundary, while preserving Human review as the durable-write authority.


## P1.1 — Governed Memory Intake and Evidence Trust

P1.1 opens the P1.0 review pipeline to external/internal learning sources without giving those sources durable Memory authority.

Implemented:

- `context.memory.intake-source` and `context.memory.evidence-source` capabilities;
- reference `host-memory-intake-provider`;
- generic `ContextMemoryIntakeSourceAdapterV010` boundary;
- evidence source identity with HUMAN / APPLICATION / DOCUMENT / EXTERNAL_SYSTEM / EXPERIENCE_COMPILER types;
- source assurance `UNVERIFIED / DECLARED / HOST_VERIFIED`;
- explicit rule that source trust describes identity/integrity assurance, not content truth;
- Human-confirmed and authorization-gated `context.memory.intake.run`;
- intake produces PENDING Proposal only, never durable Memory;
- append-only durable intake receipts;
- deterministic source-record → Proposal identity for retry idempotency;
- pending candidate fingerprint deduplication;
- new Evidence merges through append-only SOURCE_ADAPTER Proposal revisions;
- terminal ACCEPTED/REJECTED Proposals are never silently enriched;
- source metadata survives Proposal acceptance into durable Memory provenance;
- Memory Review Queue surfaces Host-verified / Declared / Unverified source counts;
- trust labels are implemented in en / zh-CN / ja / zh-TW;
- Context Memory Reader contract now declares LEXICAL / SEMANTIC / HYBRID strategies;
- reference Host Reader implements explicit ranked LEXICAL only and fails closed for unsupported strategies;
- Experience Compiler may implement the generic Adapter contract, while App Platform remains independent of EC internals.

Authority:

- `docs/architecture/GOVERNED-CONTEXT-MEMORY-INTAKE-P1.1-v0.1.md`

P1.1 does **not** claim semantic/vector retrieval is implemented. It establishes the strategy/ranking contract and lexical reference behavior.

Next mainline: retention/privacy governance + sensitive-data boundaries + production semantic/hybrid Memory Reader + production EC adapter + governed source credentials/health/backpressure/scheduling.


## P1.2 — Memory Retention, Privacy, Semantic Retrieval and Production EC Adapter

P1.2 is CI-verified and extends the P0.9–P1.1 Memory pipeline without weakening Human or Context authority.

Implemented:

- `context.memory.governance` capability and Host governance Provider;
- separate append-only retention/privacy governance events; durable Memory records remain immutable;
- governance states `ACTIVE / RESTRICTED / EXPIRED`;
- privacy classes `STANDARD / SENSITIVE / RESTRICTED`;
- optional `retainUntil` evaluated at read time;
- `context.memory.governance.set` with Human confirmation + `authorization.check`;
- Personal governance by Personal owner; Enterprise governance by OWNER/ADMIN only;
- restricted/expired/privacy-restricted Memory filtered before any ranking Provider sees candidates;
- `context.memory.semantic-retrieval` Provider contract;
- SEMANTIC and HYBRID retrieval with explicit Provider-backed ranking;
- unsupported semantic retrieval fails closed rather than impersonating semantic search with lexical behavior;
- remote semantic HTTP Provider `remote.context-memory-semantic`;
- semantic ranking output restricted to the Host-authorized candidate set;
- optional semantic API token resolved only through Host Secrets;
- production `experience-compiler-memory-intake-provider`;
- generic HTTP EC intake contract with no EC internal implementation dependency;
- EC evidence remains source identity/integrity metadata, not truth authority;
- EC can only stage PENDING proposals through the existing P1.1 pipeline and cannot directly write durable Memory;
- optional EC API token resolved only through Host Secrets;
- four-locale Provider secret configuration copy for en / zh-CN / ja / zh-TW.

Authority:

- `docs/architecture/MEMORY-RETENTION-PRIVACY-SEMANTIC-EC-P1.2-v0.1.md`

P1.2 deliberately does not claim physical deletion, legal hold, DLP classification, scheduled intake/expiration execution, or an App Platform-owned vector index.

Next mainline: scheduled governed Memory operations + retention policy templates/legal hold + DLP/sensitive classification Provider + Eidos Memory governance/search/source-health surface + semantic retrieval observability/evaluation.


## P1.3 — Scheduled Memory Operations, Retention Policy, Legal Hold, DLP and Eidos Governance

P1.3 operationalizes the P1.2 governance model without creating a second Memory authority.

Implemented on the P1.3 branch:

- append-only Retention Policy events with ACTIVE/RETIRED lifecycle;
- deterministic retention deadline evaluation from immutable Memory recordedAt;
- earliest applicable policy deadline wins;
- append-only independent Legal Hold overlays with PLACED/RELEASED lifecycle;
- releasing one hold never releases another active hold on the same Memory;
- Legal Hold blocks retention-driven expiration, including P1.2 read-time retainUntil expiration;
- explicit RESTRICTED/EXPIRED governance is not reactivated by Legal Hold;
- governance evidence origin HUMAN / RETENTION_POLICY / DLP_PROVIDER;
- replaceable context.memory.dlp-classification Provider contract;
- production remote HTTP DLP Provider;
- DLP bearer token only through Host Secrets;
- missing/invalid DLP Provider fails closed;
- complete DLP Provider batch is evaluated before governance writes, preventing partial classification on remote failure;
- Human privacy governance overrides automatic DLP classification;
- scheduled operation evidence for RETENTION_EVALUATION / DLP_RECLASSIFICATION / SOURCE_INTAKE;
- durable JSONL operation audit, explicitly not a Memory truth source;
- scheduler process re-entrancy protection plus durable TTL lease for shared-state multi-process execution;
- scheduled Source Intake only for explicit configured Contexts;
- one-page-per-tick intake backpressure with limit=100;
- durable nextCursor state across ticks, reset at source end;
- scheduled intake uses SERVICE Principal but remains Pending Proposal only;
- durable Memory creation still requires Human Review + Accept;
- durable/in-memory Retention Policy, Legal Hold and scheduler cursor stores;
- Eidos Workbench Memory activity;
- Eidos /memory governance surface;
- Eidos /memory/search surface through Host Reader;
- Eidos /memory/sources Provider health surface;
- Enterprise governance detail restricted to OWNER/ADMIN;
- Search preserves RESTRICTED/EXPIRED pre-ranking suppression;
- Memory Source Health never exposes Secret values;
- App Platform Memory UI copy in en / zh-CN / ja / zh-TW;
- Help guide in en / zh-CN;
- dedicated P1.3 protocol/CI coverage.

Authority:

- `docs/architecture/MEMORY-OPERATIONS-RETENTION-LEGAL-HOLD-DLP-P1.3-v0.1.md`

Production configuration introduced by P1.3:

- `APP_PLATFORM_MEMORY_DLP_URL`;
- `APP_PLATFORM_MEMORY_DLP_TIMEOUT_MS`;
- `APP_PLATFORM_CONTEXT_MEMORY_RETENTION_POLICY_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_LEGAL_HOLD_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_OPERATIONS_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS`;
- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON`;
- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULER_LEASE_FILE`;
- `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_STATE_FILE`.

P1.3 does not implement or claim physical deletion of immutable Memory. Expiration is still a governance/visibility state.

Completion gate passed: 13/13 triggered workflows were successful on the implementation head. `project.status.json` is now `CI_VERIFIED_P1_3`. PR #71 is ready for mainline merge.

Next mainline after P1.3: Memory evaluation/quality metrics, retention-policy simulation/dry-run, operational hardening and broader long-running Provider observability without weakening Human/Context authority.


## P1.3.1 — Experience Integration Checkpoint

The user clarified that “larger development steps” and concern about over-design are primarily a request for earlier real product validation, not weaker architecture.

The permanent cadence is:

`big-step vertical closure + frequent verification + selective experience checkpoints`.

Authority:

- `docs/architecture/EXPERIENCE-INTEGRATION-CADENCE-v0.1.md`

Do not interpret this as “build UI for every backend change”.

Do not build demo-only UI or fake product state to create frequent previews.

Experience checkpoints must consume the same Package lifecycle, Host capability resolution, Provider bindings, Host Secrets, Principal/Context authority and Memory governance that production uses.

P1.3.1 connects the already-real Personal Agent lifecycle:

```text
Plugin Store
→ Install Personal Agent
→ Needs setup
→ Personal Agent Setup
→ install/select LLM Provider
→ Provider Settings + Host Secrets
→ Host Provider readiness
→ Ready
→ Open Personal Agent
→ Context selection
→ Memory Review / Governance / Source Health
```

Changes in this checkpoint:

- centralized Plugin Store readiness/primary-action mapping in Personal Agent product logic;
- setup Provider configuration links to formal Provider status;
- degraded/unavailable setup exposes Provider diagnosis and explicit recheck;
- completed setup continues into Memory Review/Governance/Source Health;
- all new product actions localized in en / zh-CN / ja / zh-TW;
- dedicated vertical experience integration test;
- dedicated experience CI;
- real browser runbook without fake data paths.

Browser checkpoint:

- `docs/roadmap/P1.3.1-PERSONAL-AGENT-EXPERIENCE-CHECKPOINT.md`

After CI verification, the next step is Human browser experience. Product feedback from that checkpoint should be used before multiplying the same interaction assumptions into P1.4+.


## P1.4A — Personal Agent Responsibility Policy

The product target now explicitly includes the collaboration quality discussed with the user:

> Human owns intent and authority; Personal Agent owns understanding, judgment, execution and follow-through within that authority.

This is not a tone/personality preference. It is durable product behavior.

Authority:

- `docs/architecture/PERSONAL-AGENT-RESPONSIBILITY-POLICY-v0.1.md`

Implementation:

- versioned `personalAgentResponsibilityPolicyV010`;
- responsibility modes EXECUTE / RECOMMEND_AND_EXECUTE / ASK_FOR_HUMAN_JUDGMENT / ASK_FOR_AUTHORIZATION;
- inspect/discover before asking;
- avoid unnecessary option menus when one reversible approach is materially preferable;
- constructive correction preserves the user's valid goal and repairs the approach;
- authorization is followed by continued execution rather than a tutorial/checklist;
- READ and PLAN default to autonomous execution;
- WRITE defaults to Host authorization;
- provider-backed model receives this policy independently of the selected LLM Provider;
- Host identity/Context/authorization remain the hard boundary.

Product-quality implication:

P1.4 evaluation should not measure only answer correctness. Future metrics should include unnecessary clarification, work pushed back to the Human, post-authorization completion, avoidable choice menus, verified completion and correction quality.

Do not convert this into unrestricted autonomy. Responsibility is bounded by formal Host authority.


## P1.4B — Quality Evaluation and Retention Simulation

P1.4B begins measurable product-quality work without manufacturing fake precision.

Agent quality evaluation now has explicit dimensions for unnecessary clarification, avoidable choice menus, work pushed back to the Human, post-authorization continuation, verified completion, correction quality and tool success rate.

Important rule:

- objective evidence can be measured automatically;
- subjective collaboration judgments remain `UNKNOWN` unless explicit Human/lab evaluation evidence exists;
- no composite quality score is introduced yet.

Retention policy simulation is now a formal side-effect-free capability:

- current-policy dry-run;
- optional candidate policy;
- Legal Hold precedence;
- already-expired precedence;
- earliest matching deadline;
- zero Memory/governance/policy/hold mutation;
- Personal owner / Enterprise OWNER/ADMIN governance visibility.

Formal command:

- `context.memory.retention-policy.simulate`

Eidos route:

- `/memory/retention-simulation`

The dry-run is discoverable from Memory Governance.

Authority:

- `docs/architecture/PERSONAL-AGENT-QUALITY-RETENTION-SIMULATION-P1.4-v0.1.md`

Do not build a quality dashboard until real production/lab evidence exists. Unknown must remain unknown rather than being inferred from weak heuristics.


## P1.4C — Real Quality Evidence and Retention Preview/Commit Flow

P1.4C turns P1.4B metrics from an evaluation contract into real evidence without inventing subjective labels.

Personal Agent:

- every successful interaction can append Host-observed objective evidence;
- evidence includes Principal, active Context, interaction id and tool success/failure counts;
- evidence is append-only;
- production persistence is JSONL;
- subjective collaboration dimensions remain UNKNOWN unless explicitly evaluated;
- /enterprise-agent/quality shows only current Principal + active Context evidence;
- empty state explicitly says no real evidence exists instead of rendering sample metrics.

Retention Policy:

- policy editing uses a non-authoritative append-only Retention Draft;
- prepare automatically runs candidate simulation;
- PREPARED Draft shows preview impact;
- commit requires Human confirmation + governance authority + Host material-write authorization;
- immediately before commit, the Host re-simulates against current Memory/governance/policies/Legal Holds;
- changed impact fails closed with CONTEXT_MEMORY_RETENTION_DRAFT_STALE_REPREVIEW_REQUIRED;
- only a fresh confirmed Draft can append the authoritative Retention Policy event;
- Draft state itself never becomes Memory governance truth.

Eidos routes:

- /enterprise-agent/quality
- /memory/retention-drafts/new
- /memory/retention-drafts

Authority:

- `docs/architecture/PERSONAL-AGENT-QUALITY-EVIDENCE-RETENTION-FLOW-P1.4C-v0.1.md`

This is the first full policy-editing pattern that follows the P1.4A responsibility model: system performs impact analysis, Human authorizes the consequential change, Host executes and verifies the formal write.


## P1.4D — Human/Lab Evaluation and Memory Quality

P1.4D adds explicit evaluator evidence and a durable Memory Quality overlay without weakening authority or immutable-Memory boundaries.

Personal Agent quality:

- formal command: `enterprise-agent.quality.evaluate`;
- Human can evaluate only their own Host-observed interaction in the active Context;
- Lab evaluation requires a non-Human Principal, a target Human subject and Host authorization;
- evaluator evidence cannot exist without matching `HOST_OBSERVED` evidence;
- tool execution metrics aggregate from Host evidence only, so Human/Lab labels do not double-count tool calls;
- subjective precedence is Human → Lab → Host/UNKNOWN;
- no composite quality score;
- Eidos review route: `/enterprise-agent/quality/review`.

Memory Quality:

- independent append-only overlay; Memory payload stays immutable;
- evidence refs/source trust are descriptive dimensions;
- freshness uses `observedAt`, never `recordedAt`;
- missing observation time stays UNKNOWN;
- Proposal `POTENTIAL_CONTRADICTION` signals become durable OPEN contradictions when accepted;
- contradiction lifecycle: OPEN → RESOLVED or DISMISSED;
- resolution values are PREFER_LEFT / PREFER_RIGHT / BOTH_VALID / OTHER;
- resolution does not perform supersession;
- formal resolution requires Human confirmation, governance authority and Host material-write authorization;
- Eidos routes: `/memory/quality`, `/memory/quality/contradictions`.

Authority:

- `docs/architecture/PERSONAL-AGENT-HUMAN-EVAL-MEMORY-QUALITY-P1.4D-v0.1.md`

Do not convert descriptive quality signals into automated truth decisions or hidden Agent authority.
