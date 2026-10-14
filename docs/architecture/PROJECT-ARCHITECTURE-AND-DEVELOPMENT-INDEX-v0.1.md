# Project Architecture and Development Index (v0.1)

**Status:** CURRENT_AUTHORITY
**Date:** 2026-10-14
**Document class:** CURRENT_AUTHORITY
**Purpose:** the detailed architecture + development index behind
`docs/architecture/PROJECT-ORIENTATION-v0.1.md`.

Scope note: this index describes behavior evidenced in the repository at the commit recorded in
§11. Where a chain is only partially verified, it is marked. It points to authorities instead of
restating them, and it is not a substitute for `project.status.json` (state) or any constitution.

## 1. Module responsibilities

| Area | Responsibility | Host files |
| --- | --- | --- |
| Lifecycle | plan/install/upgrade/enable/disable/uninstall, effective Contributions | `manager/service.ts`, `manager/store.ts`, `manager/compatibility.ts`, `manager/lifecycle-migrations.ts` |
| Catalog | discovery, capability provider lookup, seed | `catalog/catalog.ts`, `manager/server.ts` |
| Action execution | command routing, feature-active gate, pre-execute authorization | `actions/router.ts`, `actions/lazy-handler.ts`, `manager/capability-operation-access.ts` |
| Request identity/context | session → principal → resolved context/scope | `manager/request-context.ts`, `manager/request-authentication.ts`, `manager/context-registry.ts`, `manager/principal-context.ts` |
| Providers | binding resolution, health, governance, lifecycle | `manager/provider-resolution.ts`, `manager/provider-governance.ts`, `manager/provider-lifecycle-*.ts` |
| Runtime hosting | declarative/worker/process/remote dispatch | `manager/plugin-runtime-host.ts`, `manager/plugin-runtime-dispatcher.ts`, `manager/plugin-runtime-remote.ts` |
| Integrity/trust | signature, artifact digest, admission | `manager/package-integrity.ts`, `manager/sigstore-verifier.ts` |
| Agent runtime | runs, durability, receipts, Host tool catalog | `agents/enterprise-agent/*`, `manager/agent-run-store.ts`, `contracts/agent-action-receipt.ts` |
| Enterprise Context | governance, relationships, grants, definitions | `manager/enterprise-context-*.ts`, `manager/enterprise-relationship-actions.ts`, `providers/enterprise-context/*` |
| External Agent | governance, OAuth, MCP projection | `manager/external-agent-*.ts`, `manager/mcp-*.ts` |
| Workbench surface | pages, settings, login, Help, localization | `manager/workbench-*.ts`, `manager/settings-page.ts`, `manager/login-page.ts`, `manager/help-system.ts`, `manager/localization.ts` |

## 2. Contract ownership

- Package/Feature/Contribution + install/lifecycle plans: `contracts/package.ts`.
- Principal, scope, Context, authorization decision: `contracts/platform-services.ts`.
- Plugin protocol (runtime/integrity/provenance/storage/events): `contracts/plugin-protocol.ts`, `contracts/plugin-protocol.manifest.json`.
- Foundation object descriptor/schema/extension/import: `contracts/foundation-object/*`.
- Business definition + projection: `contracts/enterprise-business-definition.ts`, `contracts/definition-projection.ts`.
- EVO boundary: `contracts/evo-business-data.ts` + `manager/evo-business-data-http-adapter.ts`.
- Agent run/receipt/durability/assistance: `contracts/agent-run.ts`, `contracts/agent-action-receipt.ts`, `contracts/agent-durability-async.ts`, `contracts/agent-assistance.ts`.
- Conversation/context: `contracts/conversation-*.ts`.

Rule: authoritative facts have exactly one owner; everything else consumes a public contract.

## 3. Representative call chains

Each chain: **entry → processing → permission check → data ownership → result**.

### 3.1 Package install → Experience appears

- Entry: Eidos Plugin Store page → `POST /v1/install/plan`, `POST /v1/install`
  (`manager/server.ts:9264-9294`; plan carries a sha256 `planDigest`, `:5591`).
- Processing: `manager.planInstall` / `manager.install` (`manager/service.ts`) → compatibility
  (`manager/compatibility.ts`), dependency/capability resolution, integrity admission
  (`manager/package-integrity.ts`), runtime inspection (`manager/plugin-runtime-host.ts`).
- Permission: `InstallAuthorizationV010` (`trustApproved`, `approvedPermissions`); unverified
  publishers require explicit trust.
- Ownership: `LifecycleStore` (`manager/store.ts`); file-backed when `APP_PLATFORM_STATE_FILE` is
  set (`manager/server.ts:1086`).
- Result: `PlatformSnapshotV010` + `effectiveExperiences`; a page becomes reachable only through
  the active Feature's `eidos.experience` Contribution (`manager/service.ts` list/load effective).
- Agent path: `app.catalog.list` → `app.install.plan` → `app.install.execute`, which fails with
  `INSTALL_PLAN_REQUIRED` unless a successful plan for the same package precedes it
  (`agents/enterprise-agent/app-manager-client.ts`).
- To verify (observation, not a defect claim): `/v1/install` recomputes the plan instead of
  comparing the submitted `planDigest` (`manager/server.ts:9278`).

### 3.2 Foundation object import → mapping → validation → write

- Entry: Data Import Eidos page → `apps/data-import/actions.ts` → `apps/data-import/service.ts`.
- Mapping: `suggestDataImportMappingV010`; AGENT-origin ENUM `VALUE_MAP` entries that do not match
  accepted option values/labels/aliases fail closed with
  `DATA_IMPORT_AGENT_ENUM_VALUE_MAP_REQUIRES_HUMAN_REVIEW` (no model self-attestation).
- Validation/write: `FoundationObjectImportTargetV010.validateRow` then
  `commitRow` / `commitPreparedRows` (`ATOMIC_BATCH`) — `contracts/foundation-object/import.ts`.
- Ownership: the object-owning package supplies the target; persistence goes through the enterprise
  resource repository (`manager/server.ts:1088-1123`).
- Result: `FoundationObjectImportCommitResultV010`.
- Partial: `apps/data-import/authorization.ts` and per-object target implementations were not fully
  read this round → treat the full authorization path as not yet verified.

### 3.3 Ledger definition select → compile → publish

- Entry: `apps/ledger-manager/actions.ts` (`LEDGER_MANAGER_PUBLISH_COMMAND`, with a dedicated
  publish authorization action).
- Processing: read the immutable definition revision (`BusinessDefinitionRepositoryV010`) →
  compile (`apps/ledger-runtime-configurator/expression-compiler.ts`, `bookkeeping-aviator-v1`) →
  `publishToLedgerRuntime`.
- Permission: publish is its own authorized action.
- Ownership: definitions = Enterprise Context (`providers/enterprise-context/business-definitions.ts`);
  execution = EVO.
- Result: published runtime configuration. **Incomplete:** production execution is not admitted —
  `financialExecutionState = READ_ONLY_NOT_ADMITTED` (`architecture.boundary-policy.json`).

### 3.4 Personal Agent invokes an existing platform capability

- Entry: Agent turn (`agents/enterprise-agent/thread-turn-action-handlers.ts`) → `run-runtime.ts`
  → `provider-model.ts`.
- Processing: the Host builds the tool catalog (`agents/enterprise-agent/host-tool-catalog.ts`);
  the model may only select tools from that catalog. Effects are `READ | PLAN | WRITE`.
- Permission: WRITE goes through Host `authorizeWrite` / `authorization.check`; effect metadata is
  not authorization.
- Ownership: run state (`manager/agent-run-store.ts` and Postgres stores), audit receipts
  (`contracts/agent-action-receipt.ts`).
- Result: tool observations + final answer. **Incomplete:** production trusted Host→EVO Owner
  delegation remains OPEN (`project.status.json`).

## 4. Shared capabilities that must be reused

| Capability | Reuse point |
| --- | --- |
| Package/Feature lifecycle + effective Contributions | `manager/service.ts`, `contracts/package.ts` |
| Capability Operation binding + `authorization.check` gate | `manager/capability-operation-access.ts` |
| Request context / principal / scope derivation | `manager/request-context.ts`, `contracts/platform-services.ts` |
| Provider resolution (no silent failover) | `manager/provider-resolution.ts`, `manager/provider-governance.ts` |
| Secrets resolution (no readback) | `providers/secrets`, `manager/secret-store.ts` |
| Eidos Experience contracts / pages | `contracts/package.ts` (`eidos.experience`), `manager/app-host-*.ts` |
| Help + localization | `manager/help-system.ts`, `manager/localization.ts`, `help/content/*` |
| Realtime events | `contracts/realtime-events.ts`, `manager/realtime-event-bus.ts` |
| Agent runs + receipts | `contracts/agent-run.ts`, `contracts/agent-action-receipt.ts` |
| Foundation object contracts | `contracts/foundation-object/*` |

## 5. Deterministic code vs LLM

- Deterministic (code owns the outcome): lifecycle transitions, dependency/capability resolution,
  authorization decisions, integrity admission, ledger posting/replay, import validation and
  compilation.
- LLM (reasons and proposes): understanding a request, selecting Host-provided tools, drafting
  proposals, mapping suggestions. The model never holds authority; safety lives at Host execution
  boundaries (`LLM.md`, `agents/enterprise-agent/host-tool-catalog.ts`).

## 6. Data ownership and isolation

| Data | Owner / where | Isolation |
| --- | --- | --- |
| Installed Packages / active Features | Host `LifecycleStore` (`manager/store.ts`) | platform-wide; not tenant-scoped |
| Enterprise resources (Counterparty, Item, Warehouse, …) | enterprise resource repository (`manager/server.ts:1088`), file/memory | scoped by resolved Host context |
| Enterprise Business Definitions / Context facts | Enterprise Context provider (`providers/enterprise-context/*`) | `enterpriseId`/`contextId` |
| Context Memory (personal/enterprise knowledge) | `providers/context-memory`, `manager/context-memory-*` | governed, context-attributed, proposal/review/retention |
| Business/ledger facts | EVO (external), via `manager/evo-business-data-http-adapter.ts` | EVO-owned; platform is a client |
| Agent conversations / runs / receipts | `manager/conversation-*`, `manager/agent-run-store.ts` | principal + active context |
| Secrets | `providers/secrets`, `manager/secret-store.ts` | host-managed; never returned in plaintext |

Isolation rule: scope is derived by the Host from the authenticated session and a Host-owned
context registry; a request may only **select** a context, never manufacture one
(`manager/request-context.ts`, `manager/context-registry.ts`, `contracts/platform-services.ts`).

## 7. Implemented vs planned / open gates

- Implemented (code-evidenced): lifecycle + plans, catalog, capability resolution, request
  context/authorization gate, provider governance, plugin runtime hosting (process/remote),
  integrity/signing admission, Help, localization, Agent Host tool catalog, ledger configurator
  compiler, foundation object import contracts, EOG surfaces, External Agent governance/OAuth/MCP.
- Decided but not implemented / blocked: production trusted Host→EVO finance Owner delegation
  (OPEN). Note: `enterprise-business-data-http-adapter` / Host-owned business data work is **gated
  by the EOG v0.1 target model**, i.e. deferred by decision — not cancelled. Confirm against the
  EOG authority before touching it.
- Cross-project claims: see §7.1 below.

### 7.1 Cross-project contract verification (2026-10-14)

The EVO, Eidos and Experience-Compiler repositories are present locally
(`D:\Documents\EVO`, `D:\Documents\eidos`, `D:\Documents\Experience-Compiler`) and were fetched;
all three local `main` equal their `origin/main` at the time of this pass.

- **EVO — verified.** App Platform `contracts/evo-business-data.ts` is field-for-field identical to
  EVO `modules/business-data/api/contracts.ts` (same `contractVersion 0.1.0`, submission and result
  fields, `QUEUED | BLOCKED_REPLAY_REQUIRED`, and the relation enum
  `CAUSES/FULFILLS/ALLOCATES_TO/DERIVES_FROM/REFERENCES/REVERSES`). The endpoint App Platform calls
  (`POST /api/v1/business-data`, `manager/evo-business-data-http-adapter.ts`) is implemented at EVO
  `apps/api/src/business-data-submission-route.ts`. EVO
  `docs/architecture/EVO-CURRENT-AUTHORITY-BOUNDARY-v0.1.md` states the same ownership split
  (owns BusinessData → PostingRule → LedgerEntry/Balance; does not own identity, lifecycle, UI or
  knowledge), and EVO modules include `allocation`, `cost`, `valuation` and `replay`. The EVO SHA
  pinned in this repository's continuity evidence (`d5ce0513…`) equals EVO `main` HEAD.
- **Eidos — verified as a deliberate scoped pin, not drift.** `vendor/eidos/source.manifest.json`
  records `sourceCommit 22b487ff…` plus per-component pins (2D `3fde…`, extension-manager
  `7b346ca6…`, owner PR #175) and explicit EVO-App-Platform host overlays. Both checked SHAs exist in
  the Eidos repository and are ancestors of Eidos `main` (`78d8384b…`); vendored Eidos intentionally
  trails Eidos `main`, so it must not be treated as "the Eidos version".
- **Experience-Compiler — partially verified.** App Platform
  `apps/data-import/experience-advisor.ts` calls EC `POST /v1/data-import/mapping-recommendations`
  and `POST /v1/data-import/mapping-experiences`, which EC implements in `src/ec/api.py`; it is wired
  in `manager/server.ts` only when the EC base URL is configured, and is advisory-only
  (`advisoryOnly: true`). EC `docs/architecture/EC-CURRENT-AUTHORITY-BOUNDARY-v0.1.md` states the same
  ownership split. **Not verified / apparently not implemented on the EC side:** the
  `providers/experience-compiler-memory` Context Memory intake pull contract
  (`{contractVersion, records[], nextCursor}`) — EC's API currently exposes only `/health` and the two
  data-import endpoints. EC's own EVO/Eidos gateways are documented as preview adapters only.

Recorded cross-project SHAs: EVO `d5ce051325c4572c7a5fd713560d7d7d06e4b401`,
Eidos `78d8384ba92e7a302bfe1cfc82ec2ef71d6c605c`,
Experience-Compiler `5f06a6224b6ffe434a9a3c0793b0384943121ac9`.

Authority for current state: `project.status.json` and `docs/roadmap/HANDOFF-LATEST.md`.

## 8. Other-window ownership and parallel work

This repository is developed by several windows/owners. At the recorded commit, open remote
branches included `agent/pa02-host-owner-registration-20261014`, `docs/governance-plugin-review-20261014`,
`feat/bex01-supplier-table-paging-20261014`, `feat/governance-provider-lifecycle-ui-20261013`,
`fix/governance-ledger-compiler-boundary-20261014`, `fix/governance-revision-resource-lifecycle-20261013`.

Implication: before editing shared Host files (especially `manager/server.ts`), check the latest
`main` and open PRs, and do not overwrite another window's uncommitted or in-flight work.

Delivery authority: `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`,
`docs/agent-line/AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md`.

## 9. Development, validation, merge and deployment

```text
check latest main + open PRs + existing implementation/tests
→ one bounded task, one branch, one PR, successive commits
→ relevant scoped tests (not blind full-suite reruns)
→ update project.status.json.projectContinuity when continuation changes
→ npm run continuity:render && npm run continuity:validate
→ merge after required CI is green; verify merged SHA and content in main
→ retire the temporary branch (fail-safe: report if not safely deletable)
→ deployment is a separate authorization; merged != deployed != Human live PASS
```

- CI: `Platform CI` (`.github/workflows/ci.yml`) runs `npm ci` + `npm run test:platform` on the
  paths it owns; plugin changes run their own plugin CI (isolation per `VALIDATION-CONSTITUTION.md` §7).
- Branch hygiene: `.github/workflows/branch-hygiene.yml` audits and only deletes exact,
  ancestry-verified merged refs; it never infers deletion from naming.
- Dependency reproducibility: `package-lock.json` is authoritative; use `npm ci`.

## 10. Pre-task checklist for a new workstream

1. **Module & owner** — which module is this, and who owns the authoritative facts?
2. **Reusable capability** — does an existing contract/provider/Experience already do this?
3. **Contract / data ownership** — does this change a public contract or move authoritative data?
4. **Authorization & isolation** — does it affect permissions, enterprise isolation or the
   plugin/Feature lifecycle (install vs activate, disable/uninstall fail-closed)?
5. **Experience requirements** — is it Eidos-native, localized and mobile-appropriate
   (`APP-OWNED-LOCALIZATION`, Eidos design language, `vendor/eidos`)?
6. **Window overlap** — is another window editing the same files/PRs?
7. **Verification & done** — what scoped CI/regression proves it, and what is the exit condition?

Do not bypass a platform mechanism for implementation convenience. If a boundary is unclear,
inspect the public contracts and authorities before coding.

## 11. Evidence and reading record

- Recorded commit (main): `8f20033371edc32e47ede10d5bb94eea490385aa`
  (`Merge PA-02 Host trusted plugin Owner registration and scoped authorization (#829)`).
- Date: 2026-10-14.
- Fully read: `.clinerules/01-delivery.md`, `.clinerules/02-project-understanding.md`,
  `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`, `AI-BOOTSTRAP.md`,
  `VALIDATION-CONSTITUTION.md`, `README.md`, `CONCEPTS.md`, `PHILOSOPHY.md`, `INVARIANTS.md`,
  `LLM.md`, `documentation.policy.json`, `architecture.manifest.json`,
  `architecture.boundary-policy.json`, `docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md`,
  `docs/architecture/DEPENDENCY-REPRODUCIBILITY-v0.1.md`,
  `docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md`,
  `docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md`,
  `docs/architecture/PROJECT-CONTINUITY-PROTOCOL-v0.1.md`, `docs/governance/BRANCH-HYGIENE.md`,
  `docs/agent-line/AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md`, `.github/pull_request_template.md`,
  `.github/workflows/ci.yml`, `.github/workflows/branch-hygiene.yml`, `package.json`,
  `contracts/package.ts`, `contracts/platform-services.ts` (1-160),
  `contracts/foundation-object/import.ts`, `contracts/definition-projection.ts` (1-140),
  `catalog/catalog.ts`, `actions/router.ts`, `manager/request-context.ts`, `manager/store.ts`,
  `manager/capability-operation-access.ts`, `agents/enterprise-agent/app-manager-client.ts`.
- Partially read: `project.status.json` (key sections), `docs/roadmap/HANDOFF-LATEST.md` (1-326),
  `llm.foundation-map.json`, `manager/service.ts`, `manager/server.ts` (selected ranges),
  `manager/evo-business-data-http-adapter.ts` (1-80),
  `agents/enterprise-agent/host-tool-catalog.ts` and `run-runtime.ts` (1-170),
  `apps/data-import/service.ts` (1-170), `apps/ledger-runtime-configurator/capability-operations.ts`
  (1-120), `docs/agent-line/WINDOW-RESEARCH-SOURCE-INDEX-20261013.md` (1-114).
- Cross-project (fetched 2026-10-14; see §7.1): EVO `docs/architecture/EVO-CURRENT-AUTHORITY-BOUNDARY-v0.1.md`,
  `docs/interfaces/command-business-data.md`, `modules/business-data/api/contracts.ts`,
  `apps/api/src/business-data-submission-route.ts`, `contracts/enterprise-package-api-v0.1.openapi.yaml`;
  Eidos `vendor/eidos/source.manifest.json` (in this repo) cross-checked against SHAs in the Eidos repo;
  Experience-Compiler `docs/architecture/EC-CURRENT-AUTHORITY-BOUNDARY-v0.1.md`, `src/ec/api.py`,
  `src/ec/integration/http.py`, `contracts/jsonschema/*`.
- Not read: the remainder of the EVO, Eidos and Experience-Compiler repositories; EVO business-data
  route internals, EC runtime behavior and Eidos renderer internals were not executed.

This index records what the repository shows, not proof that behavior was executed. Tests were not
run as part of producing this index.




