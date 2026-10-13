# Diagram v1 — five merged documentation branch refs retired (2026-10-13)

**Scope: branch hygiene only.** No 2D Designer feature code, Eidos/vendor assets, CI quality gates, plugin installation or Railway deployment is changed by this document. “Branch retired” means deleting only a movable `refs/heads/*` name, not removing a merged commit or GitHub PR.

| Source ref (SHA pinned in JSON) | Verified merged PR | Merge commit already an ancestor of main |
| --- | --- | --- |
| `docs/diagram-v1-window-research-main-online-handoff-20261012` | [#788](https://github.com/jiangxng/EVO-App-Platform/pull/788) | `ad85f8501930b6e3bf7e67211e6dbf3942a27327` |
| `docs/diagram-v1-main-online-reconciliation-20261012` | [#789](https://github.com/jiangxng/EVO-App-Platform/pull/789) | `6467d6960d5b89f41f318e8ec4df40477c33d06d` |
| `docs/diagram-v1-runtime-revision-followup-20261012` | [#790](https://github.com/jiangxng/EVO-App-Platform/pull/790) | `863667a0290ca07b4b2677c8650a5be2ed6e6cfe` |
| `docs/diagram-v1-formal-acceptance-20261012` | [#791](https://github.com/jiangxng/EVO-App-Platform/pull/791) | `056112e78753e356f87a18a62a903a437aac6583` |
| `docs/diagram-v1-usable-acceptance-policy-20261012` | [#792](https://github.com/jiangxng/EVO-App-Platform/pull/792) | `0c49414d1c3131cc4026fe3fe8ae926e3119c071` |

The five historical branches diverged because these docs PRs were squash-merged, **not because five Diagram software implementations remain unmerged**. Differences to current main are old documentation snapshots. On 2026-10-13 all five GitHub PRs were verified `closed, merged`, exact source SHA unchanged, every exact merge commit an ancestor of main, and no open PRs.

Current, user-endorsed acceptance authority remains
[`DIAGRAM-V1-FORMAL-ACCEPTANCE-RUN-20261012.md`](../architecture/DIAGRAM-V1-FORMAL-ACCEPTANCE-RUN-20261012.md):
**39/39 confirmed development usability**; screenshots/recordings are not a secondary 0/39 completion gate. The obsolete pre-policy artifact in PR #791 is preserved in GitHub immutable history only, not re-merged into main. Older Railway and GitHub diagnosis docs are historic version-specific observations, not current deployment claims.

One-time guarded retirement manifest: `repository-hygiene/diagram-v1-merged-document-heads-retirement-20261013.json`. The main-only workflow must verify PRs, exact ref SHAs, ancestor relationships, open-PR protection, and main acceptance policy **before** deletion. It may also delete its own merged cleanup head, resulting in **main as the only remaining branch** if no other window creates one concurrently. The actual outcome must be confirmed by workflow logs and a fresh GitHub ref listing; this file alone does not prove deletion.

No new Diagram tests, SOP work, finance functions, other platform maintenance work or product development are authorized by this archival step.
