# PA-05 插件标准认证：基线与首个跨业务 READ 闭环（2026-10-15）

**Document class:** PA05_CERTIFICATION_BASELINE / CURRENT_STATUS (专项；不是全局 project continuity)  
**Authority:** [Personal Agent Blueprint §21.1–21.3 and §26.2](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)  
**Historical research:** [PA-04 handoff](PA04-WINDOW-HANDOFF-ENTRY-20261015.md), [reference provenance](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md).  
**Starting main:** `4b746bfa76cacef0fa1d1e45d2e28ebccfedab67` (historical SHA; recheck live main before every new PR).  
**Stage:** `PA-05 IN_PROGRESS / NOT_SIGNED`. PA05-01 [PR #903](https://github.com/jiangxng/EVO-App-Platform/pull/903) merged (23/23 isolated parity); PA05-M01 [PR #907](https://github.com/jiangxng/EVO-App-Platform/pull/907) **merged main@5a46f846b81fe1c2a244371e0783b906cfe170c5** (final 24/24 CI); [Issue #905](https://github.com/jiangxng/EVO-App-Platform/issues/905) closed. PA05-02 schema fixture is an additional candidate, not production certification.

## 1. Explicit preservation

- PA-04 nine engineering PRs merged, PG18 convergence 42/42; C01–C06 real-provider/Human gates remain **NOT_SIGNED**. Do not rerun or reimplement PA-04 merely to make this certification green.
- PA-02 R10 real **monetary** bill/cost verification remains **NOT_SIGNED**, Issue #879 OPEN under user option B. Proposed local open-source model, exact tokenizer, hardware, pricing and model selection are not certified.
- Execute PA-05 → PA-06 → resume PA-03 I01–I10 **only after** the parallel BEX/CP-03 object import lane completes. PA-03 is the Agent-driven import cycle, not BEX import UI.
- No BEX/CP-03, Eidos, EOG 2D, `manager/server.ts`, `project.status.json` or generated global handoff modifications; no production deployment or WRITE enabling.

## 2. Reused baseline and true delta

| Concern | Existing owner contract / CI (reused) | PA-05 assessment |
| --- | --- | --- |
| Package / Feature Manifest | `contracts/plugin-protocol.ts`; two JSON schemas; `plugin:validate`; `tests/protocol/plugin-*.test.mjs` | Implemented; do not build another manifest parser |
| Capability Catalog, live lifecycle | `manager/service.ts`, `manager/capability-operation-access.ts`; `tests/protocol/capability-operation*.test.mjs` | Implemented dynamic lifecycle/authorization; needs *real multi-owner* certification |
| Action Host and Tool Owner | `actions/router.ts`, business plugin `operational-actions.ts` and ledger `capability-action-handlers.ts` | Owner logic already exists; Host dispatch reuse |
| Agent Tool Catalog | `agents/enterprise-agent/host-tool-catalog.ts`; `capability-fabric-tools.ts`; existing synthetic test | Implemented discovery, describe and governed invoke; synthetic sample does not prove two real owners |
| Signing / runtime / integrity | Plugin Protocol + isolated runtime, Host trust and publisher verification tests | Existing engineering coverage; not production supply-chain release certification of these two plugins |
| Plugin conformance suite | `certification/README.md`, `ecosystem-certification.yml` | Contains installation suite plan and portfolio CI; does not itself establish PA-05 §21.3 business result parity |
| PA-04 C03/C05/C06 | Optional Host read-freshness, tool-admission, source-disclosure ports | These six C gates are *not* signed by this isolated read test |

## 3. Second-business-plugin decision

**Real target:** `evo-trading-reference` Purchase Operational Position **READ**, alongside the existing `evo-ledger-runtime-configurator` Configuration Description **READ** as comparison.

**Source fact:** Both already publish `platform.capability-operation` with `HUMAN` and `PERSONAL_AGENT` exposure and real business-owner Action handlers. The old Trading Reference Manifest on main before PA05-M01 fails the existing Protocol validator for its two operation ID namespaces; PA05-M01's additive versioned correction is described below; the focused CI [run #38676068105](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38676068105) passed 24/24. This must not be described as a full Agent-certified package. The trading reference read uses a Host→EVO enterprise mapping and domain resource authorization; the ledger read exposes a bounded configuration description. Existing owner tests cover their business logic separately.

**Engineering choice:** Certify these installed-domain contracts together *without modifying Agent core or BEX/CP-03*. The second plugin is a **second existing real plugin under certification**, not a newly created/third-party plugin; PA-05 cannot claim independent new-plugin SDK onboarding until that separate evidence exists.

**Alternatives / reasons deferred:** Counterparty/Item/Warehouse new write operation would overlap BEX and business-object ownership. EOG 2D tool extension would overlap the existing 2D owner. Creating a redundant Agent-only adapter or new SDK runtime would fork verified Host contracts. Trading reference READ alone is safe but insufficient for WRITE/idempotency/lifecycle-in-flight certification.

## 4. PA05-01 machine-checkable read gate

The new standalone test `tests/agent-line/pa05-cross-business-read-certification.test.mjs` composes **actual business package manifests, owner handlers, Host action router, live effective-operation catalog, and existing Personal Agent Capability Fabric**; a deterministic, explicitly named fake EVO ledger read port is used instead of production EVO or a model.

| Gate | Acceptance | Evidence ceiling |
| --- | --- | --- |
| P05-R01 | Ledger manifest PASS; original Trading Reference Manifest FAIL at two namespaces; PA05-M01 replaces blocker-assertion with positive manifest validation | **Positive manifest validation PASS in PR #907 CI 24/24**, merge/production signoff separate |
| P05-R02 | Agent dynamically discovers/describes both real operations with published input contract | Isolated Host integration |
| P05-R03 | Direct HUMAN and Personal Agent AI calls return identical **business** results for ledger description and purchase Work/Position; current-tenant EVO mapping preserved | Isolated Host and fake EVO READ data |
| P05-R04 | Revoked grant / wrong resource blocks before owner ledger reads on **both channels** | In-memory test policy, not live identity |
| P05-R05 | Missing order ID, wrong inputVersion, plugin disable fail closed; disabling purchase leaves ledger owner usable | In-memory lifecycle; not in-flight Run drain |

CI: `.github/workflows/agent-pa05-cross-business-read.yml`; includes pre-existing owner-specific and Agent Fabric regression tests. For merged PA05-01, green CI meant isolated parity/denial regression only and original Trading Reference manifest conformance **FAILED**. PA05-M01 produced full positive manifest PASS in 24/24 focused CI; no asserted token/provider/hardware or production identity proof.

## 5. Remaining PA-05 gates, owner and sequence

1. **PA05-01** real cross-business READ / lifecycle parity (this short PR, isolated proof only; no package Agent certification).
2. **PA05-M01 COMPLETE** [PR #907](https://github.com/jiangxng/EVO-App-Platform/pull/907): additive canonical Capability and 0.1.0→0.1.1 migration, retaining legacy Capability and public operation/action IDs; **24/24 final CI PASS**, Issue #905 CLOSED. **PA05-02**: reusable bounded schema certification fixture for actual owner input/output, malformed payload and unsupported schema rejection (candidate separate PR); runtime enforcement, typed errors, fault recovery and current Owner permissions still pending. Reuse existing validator/Capability Fabric; no parallel Agent tool registry.
3. **PA05-03** a genuinely independent business-plugin onboarding certification: Manifest/object schema/operation/assistance and result bindings, task template/learning policy where applicable; direct/Agent parity and no Agent-core patch. Choose actual owner after BEX overlap and permission review.
4. **PA05-04** independently audited WRITE with Host receipt/idempotency/unknown-result recovery, mid-run disable/upgrade/rollback, identity change, conflicting operation owner, artifact/UI state and model fallback. `WRITE` cannot be treated as certified by PA05-01.
5. **PA05-05** actual Human/browser/Provider/production-like environment signing, model selection and environment credentials; PA-04 real gates remain separately signed by their owners. Only after this can PA-05 be considered for full signoff.

**Source provenance:** All new direct reads in this slice are GitHub repository authority and code, not outside web pages. Prior PA-04 external URLs are inherited as `H-UNREAD` from its source index. No new outside original-source reading is claimed.

**Branch governance:** Keep one `agent/pa05-...` short branch, exact-head CI, merge, then verify retirement. Historical `docs/pa04-window-research-decision-handoff-20261015` branch still exists as of startup; safely retire only after confirming #902 merged and no independent commits; do not touch BEX branches.

## 6. First CI finding, source truth and decision (2026-10-15)

The initially executed [PA05 workflow run #38675058157](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38675058157) ran 23 tests: **22 pass, 1 fail**. Three new behavioural cases plus both real business owner suites passed. The failing case was the existing `validatePluginManifestV010(tradingReferencePackageV010)` assertion: two `PLUGIN_CAPABILITY_OPERATION_ID_NAMESPACE_MISMATCH` issues. This is a real existing source compatibility defect, **not** a failed Human/AI parity test. Both affected operation IDs begin `trading-reference.purchase-operations...`, while their declared capability is `enterprise.trading-reference.purchase-operations`. Source: `apps/trading-reference/constants.ts` + `apps/trading-reference/package.ts`, validator: `contracts/plugin-protocol.ts`.

**Decision:** Do not reinterpret or relax the validator; do not silently rename published operation IDs/capability or break saved task/action references. Pin the precise namespace debt as an explicit failing certification prerequisite with a regression that checks only the known two issues; if a third issue appears, CI must fail. This keeps cross-business parity tests running without falsely approving a nonconformant manifest. Separate bounded owner migration PR must re-enable a positive-only manifest PASS gate. The repair verified positive manifest CI in merged #907; `PA05-M01 CLOSED` / Issue #905 CLOSED. Whole `TRADING_REFERENCE_AGENT_CERTIFICATION` still `NOT_SIGNED` pending SDK completeness, real-provider/browser/Agent execution and production-like conformance.

## 7. PA05-M01 additive compatibility decision (2026-10-15; 24/24 CI PASS)

**Owner files:** `apps/trading-reference/constants.ts`, `apps/trading-reference/package.ts`; consumer regression `tests/agent-line/pa05-cross-business-read-certification.test.mjs`. No generic platform / Agent Core changes.

| Item | Previous v0.1.0 | Candidate v0.1.1 | Migration intent |
| --- | --- | --- | --- |
| legacy provided Capability | `enterprise.trading-reference.purchase-operations` | **still provided** | Existing `requiresCapabilities` dependency declarations continue resolving |
| operation-owner Capability | previously same legacy ID (invalid namespace) | additional `trading-reference.purchase-operations` | Operation IDs match strict Plugin Protocol namespace rule |
| public Operation IDs | `trading-reference.purchase-operations.read`, `trading-reference.purchase-operations.entry.open` | unchanged | Existing Agent Runs, Agent tool invocation, Workbench action reference and exact IDs retained |
| Host Action command codes | unchanged string IDs | unchanged | Existing business handlers and authorization actions remain unchanged |
| authorization/effect/exposure | existing READ, Human/Personal Agent/Automation | unchanged | No new WRITE, scope, permissions or external Agent exposure |
| package + feature version | 0.1.0 | 0.1.1 | Explicit Additive migration using existing AppManager `planUpgrade/upgrade` |
| operationVersion | 0.1.0 | 0.1.0 | Semantics and input/output contract are unchanged |

**Why not other choices?** Renaming public Operation IDs breaks saved references; changing only the old Capability ID drops existing plugin dependency; a validator exception weakens the generic security contract; inventing a parallel registry/Agent-only alias forks semantic ownership. The additive Capability is the smallest bounded fix.

**Important limitation:** Code review of business owner/Host/Agent delegated capability paths found no repository-hardcoded use of the legacy Capability beyond its declaration. The legacy Capability continues to be **provided** for dependency checks, but existing direct catalog filters or capability-level delegated selectors targeting that exact old ID **do not automatically select the operations newly associated with the canonical Capability**. Runtime production grants/data were not inspected. Trading Reference currently does *not* expose those two operations to `EXTERNAL_AGENT`; no claim about unknown private persisted selectors is made. Further alias/deprecation semantics, if required by a real consumer, need their own reviewed public contract, not a hidden rewrite here.

**Machine gates:** Positive `validatePluginManifestV010`, canonical and legacy provided capability declarations, two unchanged operation IDs and command codes, no operation semantic/authorization/operationVersion changes, in-memory persisted lifecycle `0.1.0 → 0.1.1` upgrade plan without new approvals, cross-business Human/Agent parity, and denial/disable regressions. [Focused run #38676068105](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38676068105): **24 tests, 24 pass, 0 fail, 0 skip**. Issue #905 was closed only after merged main and final exact-head 24/24 CI. Never infer production install upgrade or old Capability-selector equivalence from isolated tests.

## 8. PA05-02 bounded SDK schema certification fixture (candidate; not yet fully signed)

**Source finding:** `contracts/package.ts` defines `platform.capability-operation.inputSchema/outputSchema` as open `Record<string, unknown>`. `contracts/plugin-protocol.ts` validates contributions/operation IDs structurally; the live `manager/capability-operation-access.ts` checks effect, current exposure/permission/resource/activation and inputVersion, **but does not perform full JSON Schema validation of the business input/output values**. The owner handlers validate some required input manually. `vendor/eidos/src/runtime/validate.ts` validates Eidos UIDL, **not** generic Capability Operation JSON Schema.

**Decision:** Do not hand-roll a supposedly complete runtime JSON Schema engine, add a new hidden package dependency, or move domain validation into Agent Core. The smallest independent PA05-02 delivery is a **pure certification-only helper**, `certification/capability-operation-schema-fixture.mjs`, with a known keyword subset and strict **unsupported→not-PASS** outcome. Run real ledger and trading Owner results and malformed-input/output examples through it using `tests/agent-line/pa05-schema-cert-fixture.test.mjs`. Hook it into the existing focused PA05 workflow, not a duplicate ecosystem-wide CI. The helper is **not production input/output enforcement**.

**Evidence ceiling:** Deterministic fixture/example conformance and invalid-example rejection only. Full JSON Schema 2020-12, owner-controlled runtime input+output validation and classification, unknown-write idempotency/verification, true Host multi-tenant revocation, in-flight upgrade/disable and model/Human acceptance remain open. Any newly encountered unsupported keyword must fail fixture certification, never silently skip. Future runtime enforcement must be a separate reviewed owner/Host safety contract and consider BEX shared Capability owners; no edits to `manager/server.ts` or BEX/CP-03 in this slice.

## 9. PA05-02B READ execution boundary (2026-10-15; candidate)

**New evidence / not historical source:** after PA05-02A merged #908 with 29/29 PASS, the Host live `manager/capability-operation-access.ts` still does not validate runtime business input and output JSON Schema. The offline `certification/capability-operation-schema-fixture.mjs` also originally visited only schema branches actually present in test data. That left a false assurance risk for an unsupported keyword inside an absent optional property.

**Bounded decision:** add an opt-in, exact-ID READ-only `certification/pa05-read-action-gateway.mjs` wrapper over the existing App Action Router and current Authorization Provider; **no default production wiring** or Agent Core rewrite. Admission recursively inspects the entire supported schema tree, not just one example. At request time it checks Host policy (fail closed on obligations), input and binding; after owner execution it rechecks live permissions/lifecycle/operation fingerprint and verifies successful output before disclosure. It rejects unknown operations, WRITE effects and any unsupported schema; business Owner remains authoritative and the Action Host remains the executor.

**Limitations:** This is not Draft 2020-12 or a general-purpose safe JSON Schema validator; unsupported schema features fail admission. It cannot prove plugin business code truth, production Host adapter use, real network/identity, the model or in-flight WRITE. Only a consumer **explicitly using this gateway** obtains the new checks. The previous `PA-04 C01–C06`, `PA-02 R10` and full PA-05 certification remain NOT_SIGNED. Focused tests use fake EVO read rows and a test Authorization Provider, not production.

**New isolated gates:** PA05-B01 READ Human/Agent result parity; B02 input, scope, unknown/WRITE, obligations fail before owner; B03 wrong or missing owner output suppressed; B04 revocation during READ suppressed; B05 disable during READ suppressed and peer owner independent; B06 absent optional schema branch with unsupported keyword must prevent admission. Exact PR/CI result is recorded after checks; no CI success claimed in this decision text until observed.
