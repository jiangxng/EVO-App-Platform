# Agent / External Agent branch reconciliation — 2026-10-12

**Scope:** current development-only Platform main; nonproduction. The developer authorized incomplete plugin experiments to be merged after reconciliation, but not to regress newer main code or global status authority.

| Original branch | Exact SHA | Resolution against newer main |
|---|---|---|
| agent/pa02a-postgres-async-uniqueness-proof-20261011 | 9f794cf928d9a01e55a22c6d5742ea23fd7bc456 | 3 core proof/code/test files already identical in main. Add previously absent isolated PostgreSQL CI workflow; experimental adapter still NOT wired to production server. |
| docs/external-agent-access-standard-20260930 | 661341eb87e8bfd8a5884c150267933c65b0c4b1 | Current main already has the standard/roadmap and expanded invariants; keep newer documents rather than overwriting. |
| docs/external-agent-ea5-machine-foundation-20260930 | 8a4b5a0caecda26b90a4bfa60e17f9b5e23fb5d9 | Keep current LLM.md, HANDOFF-LATEST.md, and especially current shared project.status.json. Older snapshots superseded. |
| feat/external-agent-access-experience-20260930 | 76b33e63ac7d1e282463cae46133d74f54c0b636 | Preserve standalone, not-activated package manifest at apps/external-agent-access/package.ts for staged development; no automatic install or runtime activation. |
| feat/ea4a-oauth-resource-profile-20260930 | 7eb802eb21230e2e5a2dcf863d1507c69f1f7b0f | Main already has newer OAuth authorization code/token management, consent, HTTP, metadata and contracts. Older helper imports removed scope symbols; do not copy obsolete TS into runtime and do not overwrite current contract/package.json. Full legacy code is reachable in this merge's parent history. |

Merge parents preserve all original branch commits for audit even when original deltas have been superseded in current main. **Avoid falsely claiming that obsolete code is activated**; source history, docs, and safe unique nonactivated artifacts are what is integrated. Branch references retire only after merger into main and verifying they have no active dependent PR.

The PA-02 proof remains a *nonproduction experimental contract*, not a wired Postgres Agent Run store. External Agent app is a *standalone opt-in manifest*, not a verified end-user feature. Neither changes active Host permissions or authorization.
