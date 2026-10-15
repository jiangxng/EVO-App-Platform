# PA-05 插件标准认证：基线与首个跨业务 READ 闭环（2026-10-15）

**Document class:** PA05_CERTIFICATION_BASELINE / CURRENT_STATUS (专项；不是全局 project continuity)  
**Authority:** [Personal Agent Blueprint §21.1–21.3 and §26.2](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)  
**Historical research:** [PA-04 handoff](PA04-WINDOW-HANDOFF-ENTRY-20261015.md), [reference provenance](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md).  
**Starting main:** `4b746bfa76cacef0fa1d1e45d2e28ebccfedab67` (historical SHA; recheck live main before every new PR).  
**Stage:** `PA-05 IN_PROGRESS / NOT_SIGNED`; this slice is `READ_CERTIFICATION_CANDIDATE`, not production approval.

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

**Source fact:** Both already publish `platform.capability-operation` with `HUMAN` and `PERSONAL_AGENT` exposure; both have actual business-owner Action handlers. The trading reference read uses a Host→EVO enterprise mapping and domain resource authorization; the ledger read exposes a bounded configuration description. Existing owner tests cover their business logic separately.

**Engineering choice:** Certify these installed-domain contracts together *without modifying Agent core or BEX/CP-03*. The second plugin is a **second existing real plugin under certification**, not a newly created/third-party plugin; PA-05 cannot claim independent new-plugin SDK onboarding until that separate evidence exists.

**Alternatives / reasons deferred:** Counterparty/Item/Warehouse new write operation would overlap BEX and business-object ownership. EOG 2D tool extension would overlap the existing 2D owner. Creating a redundant Agent-only adapter or new SDK runtime would fork verified Host contracts. Trading reference READ alone is safe but insufficient for WRITE/idempotency/lifecycle-in-flight certification.

## 4. PA05-01 machine-checkable read gate

The new standalone test `tests/agent-line/pa05-cross-business-read-certification.test.mjs` composes **actual business package manifests, owner handlers, Host action router, live effective-operation catalog, and existing Personal Agent Capability Fabric**; a deterministic, explicitly named fake EVO ledger read port is used instead of production EVO or a model.

| Gate | Acceptance | Evidence ceiling |
| --- | --- | --- |
| P05-R01 | Both real package manifest contracts validate; neither modifies Agent tool definitions | Protocol-level test |
| P05-R02 | Agent dynamically discovers/describes both real operations with published input contract | Isolated Host integration |
| P05-R03 | Direct HUMAN and Personal Agent AI calls return identical **business** results for ledger description and purchase Work/Position; current-tenant EVO mapping preserved | Isolated Host and fake EVO READ data |
| P05-R04 | Revoked grant / wrong resource blocks before owner ledger reads on **both channels** | In-memory test policy, not live identity |
| P05-R05 | Missing order ID, wrong inputVersion, plugin disable fail closed; disabling purchase leaves ledger owner usable | In-memory lifecycle; not in-flight Run drain |

CI: `.github/workflows/agent-pa05-cross-business-read.yml`; includes pre-existing owner-specific and Agent Fabric regression tests. Green CI means **PA05-01 isolated READ gate only**; no asserted token/provider/hardware or production identity proof.

## 5. Remaining PA-05 gates, owner and sequence

1. **PA05-01** real cross-business READ / lifecycle parity (this short PR, isolated proof only).
2. **PA05-02** certification fixture/SDK gap: typed validation, schema input/output negative cases, recovery & error categories, current owner permissions; reuse schema validator and Capability Fabric. Must prove exact Host binding; no new parallel tool registry.
3. **PA05-03** a genuinely independent business-plugin onboarding certification: Manifest/object schema/operation/assistance and result bindings, task template/learning policy where applicable; direct/Agent parity and no Agent-core patch. Choose actual owner after BEX overlap and permission review.
4. **PA05-04** independently audited WRITE with Host receipt/idempotency/unknown-result recovery, mid-run disable/upgrade/rollback, identity change, conflicting operation owner, artifact/UI state and model fallback. `WRITE` cannot be treated as certified by PA05-01.
5. **PA05-05** actual Human/browser/Provider/production-like environment signing, model selection and environment credentials; PA-04 real gates remain separately signed by their owners. Only after this can PA-05 be considered for full signoff.

**Source provenance:** All new direct reads in this slice are GitHub repository authority and code, not outside web pages. Prior PA-04 external URLs are inherited as `H-UNREAD` from its source index. No new outside original-source reading is claimed.

**Branch governance:** Keep one `agent/pa05-...` short branch, exact-head CI, merge, then verify retirement. Historical `docs/pa04-window-research-decision-handoff-20261015` branch still exists as of startup; safely retire only after confirming #902 merged and no independent commits; do not touch BEX branches.
