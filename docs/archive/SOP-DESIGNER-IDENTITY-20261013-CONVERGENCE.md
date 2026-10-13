
# SOP Designer branch convergence and upgraded Plugin Host boundary — 2026-10-13

**Purpose:** merge existing SOP package identity to main without developing the deferred SOP editor, modifying live plugin installs, or reverting modern Host governance.

## Governance baseline

- [Platform governance PR #794](https://github.com/jiangxng/EVO-App-Platform/pull/794) merged main `f128b160cfaa7f85fe1b0129f6ffd6f294eb0182`.
- `docs/plans/platform-governance/PLAN.md`: minimal Host, optional business packages, lazy activated/disposed implementations, no second data/ledger authority, no automatic activation of unfinished products.
- `tools/lightweight-host-validate.mjs` and `tools/lightweight-host-baseline.json` reject **new eager dependency edges** rooted in `catalog/seed.ts` and `manager/server.ts`. A naive static import from the old SOP branches would breach the new rule. The old `manager/server.ts` (one source had 5749 lines) is not restored over current main (9339 lines as of this comparison).
- `architecture/sop-designer-package-identity` exact head `179d2f554fc9745d1a3f2f332cbbb53ab1a7475e`, 7 commits ahead/1658 behind against governance main.
- `architecture/sop-designer-package-identity-v2` exact head `e45afa0634ec2b3c281367708c08410b85f095c9`, 9 commits ahead/1647 behind.

## Preserved in the current Plugin-owned directory

| Source | Original old blob SHA | Action |
| --- | --- | --- |
| `apps/sop-designer/package.ts` (old branch v2) | `358583054ca7239fa062374dc9c337f8521ccf4d` | Copy exact, independent APPLICATION manifest, default-off |
| `tests/protocol/sop-designer-package-identity.test.mjs` | `7de014c00b09e1c62bcaba1a039afab104fa8cee` | Copy exact, identity contract unit check |

Old branches both carry same SHA for the above files. No activation, UI or business service was extracted. Other legacy changes to `catalog/seed.ts`, `manager/server.ts`, EOG boundary documents and old JSON are **not directly merged**. The current main's Runtime Binding Provider lifecycle and current Host authorization remain authoritative.

Current additional archive documents this exact decision, while `docs/architecture/eog-peer-plugin-extraction.v0.1.json` only updates **SOP owner target fields**, not active Runtime Binding or analysis fields.

## Status and future boundary

- `IDENTITY_SOURCE_IN_MAIN` — source scaffold is physically present in main, with standalone catalog discovery tested **in isolation**.
- `HOST_CATALOG_REGISTRATION_DEFERRED` — intentional governance gate; not visible as installed SOP app in running Host.
- `DEFAULT_ACTIVATION_OFF` — no startup or background execution.
- `IMPLEMENTATION_EXTRACTION_DEFERRED`, `PRODUCT_UNFINISHED` — do not build or deploy.
- [PR #794](https://github.com/jiangxng/EVO-App-Platform/pull/794) governance docs head may be retired after verifying #794 merged, SHA unchanged, and no open PR depends on it.
- The two old SOP identity branch heads may be retired after this archive is merged, unchanged source hashes confirmed, and exact no-open-PR/protection guard. No archive tag created; Git history and pinned source SHA stay in merged PR and this document.

No Agent, EOG Designer/Viewer runtime, EVO Ledger, Finance Owner or Railway change is authorized by this convergence.
