# EOG 2D B10/B11 Evidence Consolidation — 2026-10-11

## Decision: preserve research assets, do not merge the divergent product branch
The upstream B10/B11 stack contains **42 historical Draft PR increments** (10 B10a–B10j; 32 B10k–B11p). Its branch `fb2bbe71e2b14edb7b8c6dce4b2efd0debbcc7ec` diverged from platform main; independent Designer/Viewer product functions were already integrated through PR #693 and architecture boundary changes through PR #695. This consolidation copies only **44 unmodified research/evidence files, 31 offline QA tools, and 30 synthetic tests**, plus a narrow stand-alone CI definition, onto the latest main.

## Stable navigation
- [B10j 16-step historical decision research handoff](./DIAGRAM-B10J-RESEARCH-DECISIONS-HANDOFF-20261011.md)
- [B10j 16-step original PR/source index](./DIAGRAM-B10J-16-INCREMENT-MANIFEST-20261011.json)
- [B11p 32-step research/implementation handoff](./DIAGRAM-B11P-32-STEP-HANDOFF-20261011.md)
- [B11p 32-step immutable original historical PR/source index](./DIAGRAM-B11P-32-STEP-INDEX-20261011.json)
- [Machine-readable consolidated file and source-blob catalog](./DIAGRAM-B10-B11-CONSOLIDATED-CATALOG-20261011.json)
- [Formal 39-case acceptance matrix from original authoring context](https://github.com/jiangxng/EVO-App-Platform/pull/623). *Do not claim signed off.*

## What has and has not been adopted
- Tools `tools/diagram-enterprise-assurance-b10k.mjs` through `...b11p.mjs` are **bounded offline diagnostic algorithms**, not business or Eidos production runtime. They do not alter Designer visual routes, the platform Host, Agent action authorization, projection versions, or the database.
- Tests `tests/integration/diagram-enterprise-assurance-*.test.mjs` and historical B10i/B10j tests exercise synthetic topology, local evidence invariants, and provenance guards. Their PASS does **not** imply real device/browser manual input or legitimate customer identity permission.
- Historical evidence markers such as `merged:false`, `deployed:false` and `open-draft` in the *original snapshot* must stay untouched. They describe the original stage at its creation, not the later archive-consolidation PR status.
- B11c–B11f Chrome QA records rely on earlier synthetic App Handler proof scripts. Source references and relevant B9k/B9l helper assets are retained here, but historical CI and screenshots must be read at their original PR/action references, not imagined as new evidence.
- The 39 formal commercial acceptance items remain **39 NOT TESTED**; no real customer production tenant, physical device, screen-reader or human authorization signoff is certified by this merge.

## Run / audit
```sh
node --test tests/integration/diagram-enterprise-assurance-*.test.mjs
node --test tests/integration/diagram-commercial-next-b10i.test.mjs tests/integration/diagram-commercial-next-b10j.test.mjs
```
A standalone workflow `diagram-enterprise-assurance-b10k.yml` runs the same bounded synthetic checks. Package imports remain local and do not inject this tooling into production.

## Retirement sequence (separate from product release)
1. Merge this archival scope to current main with CI success.
2. Confirm every archived source file matches its original Git blob and all **42 PR numbers** are preserved in the catalog.
3. Close/mark superseded original Draft PRs with a link to the merged consolidation; preserve historical discussions.
4. Delete only the verified, unmodified original Draft head branches via the repository's existing Branch Hygiene retirement manifest, on a **separate guarded merge**. Skip anything whose head has moved or carries unarchived material.

## Branch and deploy separation
This merge does **not** publish Railway. The Railway demo service stays commit-pinned unless explicitly released later. Do not touch shared TR-01 or Agent authority files.
