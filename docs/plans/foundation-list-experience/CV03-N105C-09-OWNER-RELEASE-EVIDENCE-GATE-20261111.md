# CV-03 / N1-05c-09 — Production Owner evidence and SAVE release-integrity gate

> **STATE: PROTECTED-MAIN LIVE OWNER/RELEASE INTEGRITY GATE VERIFIED; N1 NOT CERTIFIED.** 2026-11-11. This is an executable **NOT_CERTIFIED drift and evidence-integrity guard**, not Owner approval, production integration, a migration, or a new certification pathway.

## G / real source and live GitHub reference

- Starting exact protected `main@fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031`. Reviewed existing actual `manager/server.ts`, `manager/service.ts`, `manager/store.ts`, `manager/cv03-personal-saved-view-host-admission.ts`, `manager/cv03-n105b-authority-t0-pg.ts`, `manager/cv03-n105b-pa05-host-lifecycle.ts`, `providers/authorization/runtime.ts`, the established [N1-05a source preflight](../../../tools/cv03-n105a-authority-boundary-preflight.mjs), its [tests](../../../tests/agent-line/cv03-n105a-authority-boundary-preflight.test.mjs), and the [N1 production authority plan](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md).
- Live [Owner Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) read via GitHub Connector on 2026-11-11: `state=open`, headline `PENDING OWNER SIGNOFF`, body `N1=NOT_CERTIFIED` and `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`. **All five bullet checkboxes in the issue currently read `[x]`, yet none of those checkmarks is itself an independently verifiable dated named Owner approval.** The issue's actual open status and explicit pending verdict govern; existing comments are evidence of QA work, not signoffs.
- Parallel [Owner-controlled PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) is **OPEN and unmerged** as inspected. Its eventual merge must not be treated as an authorization release; the three Owner-managed files remain outside this workline.
- Genuine Tokio QA N1-05c-01～08 evidence exists: final physical [#43048753191](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43048753191) independently authenticated Host01/Host02 SQL logins, and [#43051604400](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43051604400) two real Node OS processes in one container + target-only QA backend termination and fail-closed client; both are **synthetic isolated QA database authority**, not the actual PA05/AuthorizationProvider T0 production source.

## D / implementation and acceptance

- [New read-only integrity tool](../../../tools/cv03-n105c09-owner-evidence-release-gate.mjs) accepts **actual GitHub Issue and PR JSON via a local file**, reports a bounded data-only status without printing raw Issue content, credentials or file paths, invokes the existing full source-boundary preflight, checks both opt-in SQL/PA05 lifecycle seams remain unmounted in formal `manager/server.ts`, and explicitly verifies SAVE OFF / command deny anchored in existing real Host code.
- The five checked boxes are reported only as diagnostics: `checkedBoxesAreApproval=false`. The gate returns `EXPECTED_BLOCKED_BASELINE` only when the **real Issue is OPEN and explicitly pending**, the exact Owner PR identity is known, real Host authorization remains gated and source anchors unchanged. It always returns `certification=NOT_CERTIFIED` and `releaseDecision=DENY_NO_PRODUCTION_OWNER_APPROVED_INTEGRATION`. A missing/closed Issue, unknown parallel PR, source drift, unexpected Saved View T0 mounting or malformed response is RED and requires review.
- CLI `--certify`/`--release` always exits **2**, never emits production approval. `--check` exit 0 only means **the current blocked baseline remains visibly intact**, not release readiness. Future genuine Owner signoff requires a separately reviewed versioned production integration and an explicit change to this audit contract, not merely checking boxes/closing Issue or merging another PR.
- [Adversarial offline regression](../../../tests/agent-line/cv03-n105c09-owner-evidence-release-gate.test.mjs) verifies all five checked boxes are not signatures, missing/closed Issue is drift, parallel #1184 merging is not certification, accidental real Host mounting of the optional SQL seam is red, source CLI supports blocked-baseline status only, and `--certify` is forbidden.
- [GitHub Actions](../../../.github/workflows/cv03-n105c09-owner-release-evidence.yml) runs on target PR/source path changes, protected main changes, Issue #1212 `edited/closed/reopened`, and manual dispatch. It separately fetches the **current** GitHub Issue #1212 + PR #1184 using read-only `GH_TOKEN` and runs the source/real status gate. The workflow emits only non-secret terminal pass markers; it changes **no SQL, HBA, identities, Owner documents, live runtime or SAVEs**.
- A GREEN run means **the alert/gate is working while N1 remains blocked**. Any real production release requires new architectural PRs and named independent approvals. This gate is a supplementary safety diagnostic and does not replace existing `assertCv03HumanSaveNotEnabledV010` or Owner policies.

## P / true production integration remains externally unsigned

| Owner role and source | Required concrete approval or physical proof | Current |
| --- | --- | --- |
| PA05 Lifecycle Owner / `manager/service.ts` | Chosen Scheme A shared real lifecycle epoch/outbox T0 commit, stop/disable/uninstall and restarts, file-state split, multi-Host recovery and rollback | PENDING |
| AuthorizationProvider Owner / `manager/server.ts` and Provider runtime | Installed real Provider identity and canonical persistent scope grant/deny source; Human/AI, enterprise, subject, operation, epochs, revocations and cold-start default DENY | PENDING |
| DB Owner / real original `evo_dev` and migration | Approved production owner, schema, SQL principal/GRANT scope, owner-owned transaction/Outbox, snapshot watermark, offsite/PITR and tested forward/back migration | PENDING |
| Security/Operations Owner / real Host workload | Signed/KMS workload identity and key custody/rotation, stopped old Producer, verified multi-physical-Host partition/crash/RPO/RTO and independent incident signoff | PENDING |
| Domain Owner + Human/Agent acceptance | Existing Eidos+Platform saved-view resource only, Human 390px and actual Personal Agent with real field-level permissions, no new framework, explicit publish rollback | PENDING |

**Hard invariant:** `N1=NOT_CERTIFIED`, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, formal SAVE POST 403, unregistered Page GET 404. No QA success or Owner issue checkbox can alter this. Keep #1212 open and #1184's three managed docs unchanged.

## Physical CI evidence

Verified actual protected-main GitHub Issue and code-check evidence is recorded below. No Tokyo SQL/SSH operation occurred in this source governance check.

## G / protected-main live GitHub Issue + source guard acceptance (2026-11-11)

- Source [PR #1248](https://github.com/jiangxng/EVO-App-Platform/pull/1248) exact HEAD `574d6e110c061d7e0324cb7dac4351f967859253`: source-and-live-owner-provenance, continuity, Lightweight Host and Human UI checks all SUCCESS before protected merge. Merged `main@4c5844b875d65a82642cfdc565a0611fa3722343`.
- Actual postmerge [GitHub Actions #43054986490](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43054986490), job `130641916971`, concluded **SUCCESS**; the original job log was inspected. Node adversarial tests: `# tests 6`, `# pass 6`, `# fail 0`.
- Exact live terminal markers: `CV03_N105C09_SOURCE_BOUNDARY_AND_ADVERSARIAL_FIXTURES_PASS`, `CV03_N105C09_LIVE_GITHUB_OWNER_ISSUE_OPEN_UNCERTIFIED_PASS`, `CV03_N105C09_CHECKED_BOXES_DO_NOT_CONSTITUTE_OWNER_APPROVAL_PASS`, `CV03_N105C09_REAL_HOST_SAVE_ADMISSION_STILL_OFF_PASS`, `CV03_N105C09_RELEASE_CERTIFICATION_NOT_GRANTED_TERMINAL_PASS`.
- A separate read of GitHub [#1212 Issue comments](https://github.com/jiangxng/EVO-App-Platform/issues/1212) and [#1184 PR Reviews](https://github.com/jiangxng/EVO-App-Platform/pull/1184) showed 23 issue comments (recent entries are QA evidence) and an empty PR review list at the time of inspection. These are **negative, time-scoped observations**; this tool never decides who may be a genuine Owner, or attests future signoffs.
- This workflow does **not** use Tokyo SSH, PostgreSQL, physical deployment keys or direct Production data. Its green status is the strongest possible `EXPECTED_BLOCKED_BASELINE`, not an independent Owner decision, approval, N1 certification, SAVE release or real Host source migration.

**Unchanged P:** actual PA05 Lifecycle and AuthorizationProvider source of truth, real signed/KMS workload principal, Owner-authorized production SQL transaction/schema and physical multi-Host recovery have not been established. Maintain `N1=NOT_CERTIFIED`, SAVE OFF, POST 403, GET 404, Issue #1212 OPEN; do not modify #1184 Owner-controlled documents.
