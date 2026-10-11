# B10/B11 42 Draft PR Retirement — 2026-10-11

The source-exact research/diagnostic archive was merged through [PR #699](https://github.com/jiangxng/EVO-App-Platform/pull/699) as commit `de3bfbb967b2ff1113fc860a42f6b97d7741f83c`. Original PR discussions and commit SHAs remain discoverable in the [consolidated catalog](./DIAGRAM-B10-B11-CONSOLIDATED-CATALOG-20261011.json).

This cleanup is **only** for B10a–B10j and B10k–B11p, 42 explicitly recorded Draft PR heads. B9 drafts, unrelated windows, `main`, Railway and Eidos are out of scope. Source PRs must first be explicitly closed as superseded, not marked merged (they were never merged individually).

[Scoped retirement manifest](./DIAGRAM-B10-B11-RETIREMENT-20261011.json) enumerates 42 exact source PR/head SHA pairs. The [workflow](../../.github/workflows/diagram-b10-b11-retire.yml) runs on the retirement-PR merge, crosschecks both archival catalogs, the merged PR #699, source PR closed/unmerged states and immutable branch SHAs, before deleting any ref. Any preflight mismatch fails closed; deleted Git refs do not erase already merged archive content or archived GitHub PR discussions.

**Commercial acceptance**: 39 original cases remain NOT TESTED; retention and branch cleanup do not imply signoff, customer data, physical device QA or production deployment.
