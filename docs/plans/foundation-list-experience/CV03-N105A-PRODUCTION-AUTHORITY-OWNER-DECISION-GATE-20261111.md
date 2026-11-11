# CV-03 / N1-05a — Production Authority Owner Decision Gate (first executable slice)

> Created 2026-11-11 from verified main 098188deacd6a0cc9b35bacc48ec2347f1ff8bae; source-anchored G inspection, engineering decision D, Owner decision P **PENDING**. This is a new increment under the existing [N1 production decision and acceptance plan](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md), not a competing plan, approval, schema migration or production certification.

## Scope and current verdict

- Production N1 = **NOT_CERTIFIED**; APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF, SAVE POST 403 and unregistered Personal Saved View Page GET 404 **must remain unchanged**.
- Continue existing Eidos + Platform + PA05 + AuthorizationProvider + Domain Owner. Do not create a separate list model, Agent authorization framework or generic database.
- This slice is **N1-05a-01: identify real authority boundaries, create a deterministic drift alarm, and request decision evidence**. N1-05a Owner signoff itself is **NOT DONE**. N1-05b–f must not be reported PASS based on this preflight.
- The three owner-controlled files changed in concurrent PR #1184 are not edited here.

## G: 2026-11-11 live-main source graph (actual code, not historical inference)

| Verified source | Code fact | Boundary / implication (D) |
| --- | --- | --- |
| manager/store.ts; manager/server.ts | LifecycleStore is file/memory; real Host constructs it from APP_PLATFORM_STATE_FILE. N1-04i–l added local stale reader/writer fail-closed. | File durability and cooperating process fences do not make PostgreSQL mirror the same authorization authority. |
| manager/service.ts — disable()/uninstall() | Each Feature deletion precedes the onLifecycleEvent callback, without a shared SQL transaction handle. | Crash between mutation and callback can leave an old remote ALLOW. T0 must own both authority mutation and immutable outbox commit. |
| manager/server.ts — createAppManagerService callback | pluginEvents.publish and a bounded lifecycleEventLog are in-process; realtimeEvents publishes topology notifications. | This is not durable outbox, acknowledged cross-Host delivery or complete recovery watermark. |
| manager/server.ts — resolveAuthorizationProvider | Resolves an active provider through resolveProviderRuntimeV010 at runtime. providers/authorization/runtime.ts implements static policy checks. | Must identify the authoritative installed Provider, actual policy persistence, epoch owner and source of revocation; dynamic provider selection alone is not durable authority. |
| providers/enterprise-context/resources-postgres.ts | Explicit opt-in async Resource adapter; SQL_GATEWAY_ISOLATED_V010 and SQL_ROLE_SCOPED_ISOLATED_V010 are isolated modes. No automatic official Host migration. | Do not deploy CI test schema or treat C3-02 signed receipt as production SQL principal attestation. |
| providers/enterprise-context/package.ts; manager/cv03-personal-saved-view-host-admission.ts | Saved View Feature is not in the default package, SAVE_MODE accepts OFF only and denied command returns a production admission error. | Admission must remain closed while Owner decision and production runtime proof are absent. |
| tools/cv03-n1-postgres-role-audit.mjs | SELECT-only role inspection unconditionally reports NOT_CERTIFIED and a DB-enforced signed gateway blocker. | An ACL observation is diagnostic, not authorization certification. No live production DB role evidence is available in this window. |

The companion read-only tool, tools/cv03-n105a-authority-boundary-preflight.mjs, hashes the above source paths and verifies **known negative anchors**. Node test + dedicated Actions workflow mark source drift for review; green means the known unsafe integration is **still gated**, not that authority is integrated. Source matching cannot prove an absence of undiscovered alternate code paths. No credentials or network access are used.

## D: decision to be signed — choose one production authority boundary

**Recommended candidate A (awaiting Owners)**: keep PA05 Manager/Capability Operation and existing Domain Owner APIs, but make the production AuthorizationProvider-backed authority epoch/generation + immutable outbox share a durable PostgreSQL T0 commit boundary with the actual PA05 saved-view lifecycle authorization. A SQL principal authenticated as a specific Producer/Actor/Enterprise may perform only explicitly approved operations. Default deny on unavailable authority, stale/gapped epoch or unknown producer. Use a complete signed scope snapshot to recover; retain the existing file store for unrelated plugin state only under an explicitly documented split.

**Alternative B (not approved)**: formally signed cross-store fail-closed protocol that synchronously denies all affected resource READ/WRITE before any file-authority mutation can ACK, including DB outage, network partition and cold restart. Requires measured zero unsafe stale-ALLOW window or accepted, signed residual risk; current onLifecycleEvent cannot implement this alone. Without that proof, reject B.

**Rejected as unsafe for N1**: directly deploying cv03_n104f_test_* or CI keys, assuming receipt HMAC verifies SQL login, direct Host INSERT/UPDATE into resources/receipts, trusting an in-memory plugin event after PA05 commit, silently removing orphaned locks, or switching SAVE_MODE before end-to-end signoff.

## Owner signoff matrix (P — all PENDING; do not fabricate names, signatures or infrastructure)

| Required decision owner | Evidence / explicit answer required | Status |
| --- | --- | --- |
| PA05 Lifecycle Owner | Chosen A or B; concrete lifecycle mutation entrypoints; file vs PostgreSQL split; disable/uninstall/restart ordering; two-Host fencing ownership; migration rollback semantics | **PENDING** |
| AuthorizationProvider Owner | Exact runtime Provider identity, canonical policy persistence, enterprise+subject+ActorType+Operation scope/epoch; grant/revoke and context-switch semantics; unavailable policy DENY | **PENDING** |
| PostgreSQL / DB Owner | Actual primary and schema owner; DDL migration order, SQL role/GRANT/REVOKE and connection-pool isolation; immutable T0/outbox; snapshot enumeration/watermarks; tested rollback | **PENDING** |
| Security / Operations Owner | Workload Producer identity and signer custody (KMS/rotation), actor binding; event ACK/replay/fencing SLO, incident response; signoff and monitoring owner | **PENDING** |

Each signoff must contain actual reviewer identity, dated decision, exact deployment/environment identifier (avoid secrets), durable GitHub review/approved decision reference, and counter-evidence/rollback plan. If one person legitimately holds multiple roles, they must explicitly sign each responsibility. GitHub CI success, merged docs, self-authored text and isolated PG18 proofs never count as Owner signatures.

## Decision-to-engineering acceptance (N1-05b–f stays OPEN)

1. **N1-05a completion:** all named owners sign a specific A/B decision, source of truth, real Producer identity, production-compatible SQL roles/migrations and full-scope recovery/rollback/SLO; record immutable evidence links in a follow-up PR. Only then mark N1-05a signed.
2. **N1-05b:** use actual PA05+AuthorizationProvider and same PostgreSQL T0 authority/outbox, force SIGKILL/rollback, replay after ACK loss and prove remote SQL cannot accept stale ALLOW.
3. **N1-05c:** SQL owner independently demonstrates physical denial of unsigned Resource/Receipt DML and borrowed pool, SET ROLE, Human/AI and enterprise swaps.
4. **N1-05d:** actual startup/partition/gap/dual-Producer/generation/tombstone/full-snapshot rehearsal fails closed until complete authoritative recovery.
5. **N1-05e:** real Human browser 390px and real external Personal Agent LLM with same business data/field permissions, revoke/switch/history and legitimate view restoration.
6. **N1-05f:** signed rollback rehearsal and environment deployment evidence. Only a subsequent independent release PR may propose changing OFF/403/404.

## Source grades, prior work and current gaps

- **G (direct GitHub source)**: above main paths; exact SHA in header. Existing N1-04e–l merged #1202–#1209, PG18 38/38 from #1209 remain separate G-CI isolation evidence.
- **D (recommendation)**: candidate A, alternative B failure conditions and N1-05a–f ordering above. No Owner-approved production authority yet.
- **P (unavailable)**: actual production PostgreSQL endpoint/roles, deployed AuthorizationProvider identity and policy, Producer workload identity/KMS, complete snapshots, incident SLO, Owner signatures, Human 390px/LLM acceptance.
- **External research**: no new vendor website read or snippet reclassification. Inherit grades and original URLs from [2026-11-11 detailed research index](CV03-N104L-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261111.md) and the older [N1-04d index](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md).
- **Actual gate**: source preflight / CI only checks that known runtime trust boundaries are not silently modified. Owner decisions and true production certification remain externally blocking; never change production switches to satisfy a green badge.

## Next window / PR rules

From latest main after merge, first fetch this file and run node --test tests/agent-line/cv03-n105a-authority-boundary-preflight.test.mjs plus node tools/cv03-n105a-authority-boundary-preflight.mjs --check. Resolve any source drift with a fresh reviewed proof, never rubber-stamp anchors. Preserve #1184 managed files, use independent branch / Draft → checks exact HEAD → merge → Branch Hygiene SHA-safe cleanup. No direct main push or duplicate PG18 proof work.


## N1-05a-02 / 2026-11-11 incremental G proof: default production Host wiring (no release)

At main `d27794869fc192cb85078edd5ea6970f4b6d41ae`, following the first completed read-only gate (#1211), the next direct **GitHub source inspection** confirmed:

- `manager/server.ts` constructs the actual production `enterpriseResourceRepository` from `createFileEnterpriseResourceRepositoryV010` when a state file is configured, otherwise `createMemoryEnterpriseResourceRepositoryV010`. This is separate from the isolated `createPostgresConditionalResourceRepositoryV010` adapter. The production Resource/Receipt SQL cutover is **not already wired**.
- `manager/server.ts` merges built-in static policies and `APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON`; when configured, it installs `createHostStaticAuthorizationProviderV010(authorizationPolicy)` into the runtime registry. The active provider is still resolved from the effective runtime via `resolveAuthorizationProvider()`; the code does **not** establish an observed production PostgreSQL Provider identity.
- `contracts/platform-services.ts` defines `AuthorizationProviderV010.check(input)` returning `AuthorizationDecisionV010`. A synchronous/asynchronous allow/deny result has **no built-in atomic authority epoch/outbox commit API**. This is a fact about the V010 interface, not proof that no other deployment integration exists.
- `providers/enterprise-context/resources-postgres.ts` separately offers an isolated opt-in SQL Resource + Receipt CAS transaction; a receipt and Resource sharing one transaction **does not** make PA05 Feature lifecycle and AuthorizationProvider epoch participate in that same transaction.
- `manager/server.ts` still returns 403 for the unadmitted Saved View save command; the feature remains unregistered, and no deployment/production identity proof was obtained.

**D / implementation implication:** N1-05b integration requires an Owner-approved mapping from existing PA05 lifecycle mutation and effective AuthorizationProvider to a shared durable authority commit, as well as an explicit Domain Owner Resource repository cutover boundary; it must not swap *all* file-backed enterprise resources to PostgreSQL as a side effect. The simple source-anchored preflight now also checks the real resource default, policy overlay initialization and AuthorizationProvider V010 interface, and fails for source drift. It is still only a non-certifying code baseline.

**P remains pending:** #1212 is assigned to the repository maintainer **for coordination**, not signed by the PA05, Authorization, DB or Security Owners. No production primary/schema/SQL LOGIN, workload identity/KMS, recovery SLO, deployment, Owner approval or Human acceptance is claimed. N1=NOT_CERTIFIED; APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF; SAVE 403, unregistered GET 404 unchanged. No new vendor EX sources were read and #1184's owner-controlled files were not touched.

**Acceptance:** exact PR-HEAD `node --test tests/agent-line/cv03-n105a-authority-boundary-preflight.test.mjs`, source preflight `--check` and all project-required Actions; merge and hygiene only after green. Four tests include a deliberate mutation of the default enterprise repository creation path to force `DRIFT_REQUIRES_MANUAL_REVIEW`. This is **not** a re-run of the 38 PostgreSQL 18 isolation tests.
