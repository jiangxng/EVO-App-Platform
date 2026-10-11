# Template Store functional consolidation — 2026-10-11

This change restores a concrete missing capability from `feature/template-store-actions-v0.1`: reversible, URL-safe, version-aware item identity helpers, now with **strict safe-integer parsing** to prevent accepting invalid suffixes such as `1junk`.

The current `main` keeps ownership of seed merging, immutable repository persistence and Template Store authorization. The historical `fix/template-store-copy-authorization-v01` branch already supplied the same `apps/template-store/copy-action.ts` blob as `main`; its alternate static authorization rule ID is historical and is NOT reintroduced, because policy rule IDs are deployment-specific and changing them is unnecessary for functional correctness. The action key `template.store.copy`, human-only gate and `template.store.entry` resource check are unchanged.

Source history from both branches is attached as commit parents. No Agent, EOG, Ledger Runtime, Platform Host Core, `project.status.json` or deployment config is touched.
