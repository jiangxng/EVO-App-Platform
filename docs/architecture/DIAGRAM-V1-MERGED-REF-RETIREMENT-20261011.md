# EVO 2D Designer v1.0 — branch inventory and guarded merged-head retirement (2026-10-11)

> Scope is **EVO-App-Platform 2D Designer only**. This is an operational branch-history audit, not a business definition edit, global project status update, or formal device acceptance. Main branch, PR history, commits, and uploaded browser CI evidence must remain intact.

## Verified source and status

- Audited GitHub REST `/branches?per_page=100` and full pull-request pages against **the live head SHAs**, not historical PR descriptions. Snapshot before third-batch end had 76 Platform branches, of which 43 matched the focused 2D/diagram/project prefixes. These are moving counts, not immutable baseline.
- The original v1.0 §14 now has 39/39 numbered *browser subcase evidence* after A01 [Platform #770](https://github.com/jiangxng/EVO-App-Platform/pull/770) / [Eidos #171](https://github.com/jiangxng/eidos/pull/171), A02 [#772](https://github.com/jiangxng/EVO-App-Platform/pull/772), P01 [#773](https://github.com/jiangxng/EVO-App-Platform/pull/773), P02 [#774](https://github.com/jiangxng/EVO-App-Platform/pull/774). Formal customer/physical device signing **remains 0/39**. P01 perf evidence includes regressions; production multi-instance CAS is not inferred from the P02 fixture.
- The separate [#762](https://github.com/jiangxng/EVO-App-Platform/pull/762) handoff and [#715](https://github.com/jiangxng/EVO-App-Platform/pull/715) research PRs remain OPEN, and MUST NOT be closed or deleted in this maintenance PR.

## Merge-provenance bounded retirement

The machine manifest [diagram-v1-merged-head-retirement-20261011.json](../../repository-hygiene/diagram-v1-merged-head-retirement-20261011.json) lists **34 exact PR heads that are already squash-merged to main**, each with a full 40-character expected head commit, closed-and-merged PR number and exact main merge commit. It includes the D01–D06 and A01/A02/P01/P02 heads only once; these refs have no open PR. Their commits and evidence remain addressable by PR and immutable SHA after a branch ref is retired.

[One-time guarded workflow](../../.github/workflows/diagram-v1-merged-branch-retirement-20261011.yml): PR run is *audit only*. Execution is permitted **only after this maintenance PR is merged into main** (main push with manifest change). Before any write, it verifies:
1. Exact repo, bounded allowlisted 2D branch naming, unique PR number/ref, expected full head and merge SHAs.
2. Latest main descends from recorded audit baseline, each PR is closed **and merged into main** at that exact head and has its recorded main merge SHA in main ancestry.
3. Source ref HEAD SHA is unchanged, branch is not protected, and no currently open PR uses the branch as head **or base**. Recheck these reserved refs before deletion.
4. Recheck the actual SHA on every ref immediately before deleting. Any unexpected mismatch fails closed rather than force-moving an active branch.

The scope explicitly **excludes** all Agent, Ledger, TR-01, Eidos owner repo, current open research and unmerged/unknown-status branches. Also exclude closed-but-not-merged 2D PR head refs (#733, #737, #727, #718, #720) and standalone EOG/Viewer branches with unknown ancestry. No unverified historical change is claimed integrated.

## Evidence and lifecycle

- CI audit result and the later main-push deletion job must be checked *separately*. A merged maintenance PR is not proof of completed deletion.
- After job execution, enumerate GitHub branches again and record remaining names/count. If Github token permissions or any SHA/PR check fails, report BLOCKED and leave refs unchanged.
- This branch cleanup is independent of formal human signoff, deployment, tenant activation and physical device acceptance. Do not inflate 39/39 machine-subcase coverage into commercial PASS.
