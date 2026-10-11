# Five Platform squash-merged PR heads: reviewed one-time cleanup

2026-10-11. Scope: only the exact heads of five **merged** non-Agent/non-2D PRs. Unlike the prior 16 original source branches, these PR heads do not need to be Git ancestors of main because GitHub used squash merge. The proof is the exact merged PR metadata and the merge commit ancestry.

- Initial main baseline: `ab8de6d3942d2905205061e079daa0086d55fccb`.
- [#728](https://github.com/jiangxng/EVO-App-Platform/pull/728), [#731](https://github.com/jiangxng/EVO-App-Platform/pull/731), [#736](https://github.com/jiangxng/EVO-App-Platform/pull/736), [#740](https://github.com/jiangxng/EVO-App-Platform/pull/740), [#741](https://github.com/jiangxng/EVO-App-Platform/pull/741) have merged=true, closed, base=main; their PR exact merged SHA is in main history. No open PR uses these heads.
- Preflight checks all five PRs are merged, same repository, exact head branch & immutable source SHA, base main, exact merge commit in main ancestry; check current branch is not protected; protect every open PR head/base; reject moved SHA; fail closed; final ref recheck. No finance runtime, Agent, EOG/2D, or Railway changes.
- Pinned public integration test deployment stays `89320e118b97f358b4fdab0ec4c198d1cf8a57c7` and does not follow branch refs.
- PR run is audit-only; only a main push adding the manifest invokes deletion. Execution evidence will be in GitHub Actions.

| Merged PR | Source head | Fixed source SHA | Merged main SHA |
|---|---|---|---|
| #728 | `fix/platform-branch-hygiene-leased-20261011` | `4d37a029c93a9a94136545e1d2d7d230d4d9588d` | `4867d7a25f47fde47fa37be14fbd1ef568834e68` |
| #731 | `feat/tr01-six-stage-host-preview-discovery-20261011` | `54ba58e3d720802fb48e6f39df0a619d19e9b27c` | `89320e118b97f358b4fdab0ec4c198d1cf8a57c7` |
| #736 | `fix/tr01-finance-signer-pointer-fd-20261011` | `5ba74c150f9838029e66e48e46982fcbf702a86c` | `7c0be5f391d32a83eab515afad39adc8cfc5f247` |
| #740 | `chore/retire-verified-platform-source-refs-20261011` | `1433c9bfa052bc321ae4edb9040e7b5d1928ebb5` | `4690ff813fc076e3d0d8bf18641f2ca145d56b4b` |
| #741 | `docs/platform-convergence-cleanup-results-20261011` | `b920d7b9830dcf84a322d61fead85092ace11c28` | `ab8de6d3942d2905205061e079daa0086d55fccb` |

**Status before PR merge:** audit-only; not yet executed. The cleanup PR head itself is not part of this manifest and must not be treated as safely deleted.
