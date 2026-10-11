# CP-03 functional convergence (2026-10-11)

Source branch heads preserved as ancestors: `feat/cp03-atomic-bulk-import` (`8fc2247ae40b1422a25f71e00471d5020cc7a343`), and `feat/cp03-xlsx-human-import` (`d0ef6f1c8b47716f35f4da26dd2f9d500e36c93d`).

**Modern retained implementation:** The current Foundation Object target's `commitPreparedRows` atomic batch contract, with transaction/rollback and 1k/10k import tests, supersedes the old `commitBatch` API. Legacy `relationshipRoles` is domain-specific and intentionally NOT reinstated in generic contracts. Current Eidos integration is preserved.

**Recovered functional protections:** The legacy XLSX parser capped 2,048 columns; today's implementation has decompression limits but could inflate a huge sparse column array. Add an early 2,048-column bound, enforce `maxRows` before filling all rows, and reject silent dropping of extra data cells outside header width. Four independent in-memory XLSX fixture tests cover valid imports, far-column attack, extra data and row limits. No Agent/2D or finance code is changed.
