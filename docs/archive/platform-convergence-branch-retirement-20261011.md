# Platform Convergence: one-time retirement provenance (2026-10-11)

> This is a pre-execution approval and evidence file. Actual deletion and CI outcome require GitHub Actions run logs and post-run branch enumeration. No Agent / EOG / 2D / projection refs are candidates.

- Prior functional convergence: PR [#716](https://github.com/jiangxng/EVO-App-Platform/pull/716), [#717](https://github.com/jiangxng/EVO-App-Platform/pull/717), [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719), [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721), [#722](https://github.com/jiangxng/EVO-App-Platform/pull/722).
- Initial eligibility audit: main 5c479d9934c38ed37948eb21cd90de8546c77219, 68 Git branches, 11 open PRs. All 16 below are main ancestors, with compare behind_by=0 and merge_base = pinned SHA. None is an open PR head/base. Last-minute API checks in workflow remain authoritative.
- Manifest `repository-hygiene/platform-convergence-retirement-20261011.json`, workflow `.github/workflows/platform-convergence-one-time-retirement-20261011.yml`, exact names hard-coded in workflow for defense in depth. PR runs are audit-only. The **single manifest addition to main** is the only intended trigger for execution. The standing Branch Hygiene workflow stays manual and default audit-only.
- Workflow requires an exact SHA and PR provenance, repository check, 100-PR bound, active open PR head/base exclusion, protected-branch exclusion, ancestry against actual main, main must descend from audited baseline, and immediate pre-delete ref SHA validation.
- Source refs are not unique backups: their original commits and provenance remain reachable from main after deletion. This manifest and this document preserve identifiers.
- User Railway public integration Host remains pinned to `89320e118b97f358b4fdab0ec4c198d1cf8a57c7`. No deployment or runtime change is in this PR.

| Archived ref | Original SHA | Functional PR |
|---|---|---|
| `feature/template-store-actions-v0.1` | `f32e07698a0b54c72ca65fb3c81d36fed3551d0c` | [#716](https://github.com/jiangxng/EVO-App-Platform/pull/716) |
| `fix/template-store-copy-authorization-v01` | `d36659c052f1281b7d33f9f30c8bef69f2907ffb` | [#716](https://github.com/jiangxng/EVO-App-Platform/pull/716) |
| `feat/cp03-atomic-bulk-import` | `8fc2247ae40b1422a25f71e00471d5020cc7a343` | [#717](https://github.com/jiangxng/EVO-App-Platform/pull/717) |
| `feat/cp03-xlsx-human-import` | `d0ef6f1c8b47716f35f4da26dd2f9d500e36c93d` | [#717](https://github.com/jiangxng/EVO-App-Platform/pull/717) |
| `fix/login-assets-binary-v02` | `4cd090be941219f95a26288ce8298dad4dcf77a0` | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) |
| `fix/login-assets-valid-binary-v01` | `844583709268ef09f0ed9282ebfe10dd415495b3` | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) |
| `improve/login-assets-cache-revision-v01` | `771e194f3b6c706e43fdaeb750d15f05317a8047` | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) |
| `improve/login-assets-real-binary-v01` | `9a1a14d9bb074bf56ff940217261295b1ea1bba9` | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) |
| `improve/login-final-reference-v03` | `8c2f70962bd231b6c749b00bfaf25986de8b3dcc` | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) |
| `improve/login-final-tuge-v03` | `50e3768acede4060c02c90d029e6fa256b3c803c` | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) |
| `feat/ea2b-ledger-capability-operations-20260930-v2` | `0cb910386a2e8c91584d7283c210127dc81b1e91` | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) |
| `integration/evo-explicit-runtime-scope-proof` | `18db6c1744b4ad20ea44c46cde513b1c6728638e` | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) |
| `integration/evo-runtime-observation-adapter` | `2f939dc67a4bfbd30aac8bff2a0ca003b608daf7` | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) |
| `fix/template-store-eidos-compliance-v0.1` | `ecf196d2c439a1ead243f7d13a3e94a449bf2e09` | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) |
| `tr01/purchase-receipt-reversal-app-20261010` | `81fcc46f4a3888b0107641c7bac5d58a3e19311b` | [#722](https://github.com/jiangxng/EVO-App-Platform/pull/722) |
| `tr01/purchase-receipt-reversal-a2-20261010` | `b3163293f1bc203319d3a8bab9906b20d57bfda1` | [#722](https://github.com/jiangxng/EVO-App-Platform/pull/722) |

## Execution status

**EXECUTED AND VERIFIED — 2026-10-11.** [PR #740](https://github.com/jiangxng/EVO-App-Platform/pull/740) merged to main at `4690ff813fc076e3d0d8bf18641f2ca145d56b4b`. The [read-only PR preflight run #38140337021](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140337021) completed SUCCESS; [execution run #38140393664](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140393664) was a `push` to main and completed SUCCESS. The post-run GitHub branches listing returned 54 branches and **none of the 16 listed exact names above remained**. This is a verified ref deletion, not a claim that all older branches were retired.

**Still intentionally retained:** all open PR head/base branches (including Draft #594 Finance Owner, Agent PRs and 2D/EOG work), approximately 14 independent TR-01 B2D3 feature branches, and other unreviewed refs. The recently squash-merged Platform PR heads `fix/platform-branch-hygiene-leased-20261011`, `feat/tr01-six-stage-host-preview-discovery-20261011`, `fix/tr01-finance-signer-pointer-fd-20261011`, and this cleanup PR head also remain; GitHub compare reports their head commits **diverged** from main (because of squash merges). Do not delete them under the strict ancestor-only mechanism without an explicit separate content/provenance review.

**Railway release isolation:** No deployment was triggered for this pruning change. The designated public integration test Host remains pinned to application test SHA `89320e118b97f358b4fdab0ec4c198d1cf8a57c7`; branch cleanup never changes that service source or data volume.
