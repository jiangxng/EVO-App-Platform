# CV07 · Eidos List Foundation UI review and Business Dictionary Import — 2026-11-25

## Screenshot findings (user-supplied screenshot, not claimed online login)

The Business Dictionary header and toolbar use the existing Eidos Catalog Browser page: system views **All / Draft / Published**, presentations **Table / Chart / Board**, server search, column controls, CSV export and New Dictionary. The visible "列设置" panel displayed unstyled native buttons with no button spacing/alignment, notably "隐藏 字典编码 / 下移 字典编码" et al; the layout groups were not coherent and crowded a smaller screen. Eidos `catalog-browser/render.ts` already emitted semantic `<details>`, buttons, and routes but `productive-workbench-css.ts` had no styles for its column-controls selectors. This is a **shared design-language defect**, not an individual dictionary plugin style deficiency.

## Implemented boundary

1. **Eidos-only presentation**: shared `data-eidos-catalog-table-toolbar` groups owner-provided search and column visibility. Default native details stays keyboard accessible; dropdown uses Eidos tokens, clear button hit areas, focus indicators, and a 600px responsive layout appropriate for 390px. System views, chart/board and sorted owner routes are not re-implemented in the browser.
2. **Domain-owned import target**: `evo-business-dictionary` contributes `platform.data-import-target` ID `business-dictionary.option`, a lazily resolved `HOST_FACTORY` using existing Dictionary Owner Repository + Enterprise Resource Repository. The shared `evo-data-import` handles CSV/XLSX upload, mapping/preview, error review and commit; the dictionary target enforces stable codes, names, statuses, existing option collisions and one new **DRAFT** revision per dictionary, atomically across the uploaded batch.
3. **Permission & availability**: The real Host only supplies Import navigation for current Enterprise OWNER/ADMIN when **both** Dictionary and Data Import Features and the effective target are active. The click's route is never a permission grant: Data Import Host independently checks current Principal/active enterprise and target before upload, staging or writing. Disabling either Feature must remove the live factory/route. No static module initialization, manual JSON writes, hidden rows or cross-enterprise lookup. The CV03 *READ-only* optional view path passes the same Host-checked Import navigation without enabling Saved View WRITE.
4. **Publication**: Successful import writes only drafts. No automatic publish; an authorized Human must separately publish using the already governed Dictionary publish route. The old published version remains effective until this occurs.

### Example CSV (UTF-8)

```csv
字典编码,字典名称,选项编码,选项名称,选项状态,简体中文名称,来源别名（逗号分隔）
customer.level,客户等级,A,重点客户,启用,重点客户,"重点,VIP"
customer.level,客户等级,B,一般客户,停用,一般客户,普通
sector.kind,行业分类,X,制造业,ACTIVE,制造业,工厂
```

CSV and XLSX accepted via the existing Data Import file uploader. The field names are localized through the import target's schema, and the common mapping step allows user correction before dry-run. Maximum file size and row controls are **the existing Data Import limits** (not independently expanded by this project slice). Idempotent retries, atomic Owner save and history semantics stay in the existing Repository, not custom browser state.

## Proof and remaining gates

- New protocol tests: manifest target discovery; Chinese-column mapping; real shared Data Import stage/dry-run/commit; multiple dictionaries per batch; unpublished vs effective version; duplicate and stale-preview failures; rollback on mid-batch conflict; unauthorized UI absence; Eidos markup/CSS including 390px breakpoint.
- CI, protected main merge and physical Tokyo runtime evidence **not claimed by this document until actual successful checks/deployment**.
- A Tokyo install with the Dictionary Feature but Data Import disabled **must not** show a broken Import button. To make import usable there, an authorized operator may opt in to the existing Data Import lifecycle through the original protected Host channels (not mutate persistence files or bypass Basic Auth). Verify Tokyo Feature flags with a read-only Action before claiming online readiness.
- Real authorized Human browser flow (upload, map, dry-run, commit, list/draft, publish separately) remains a separate acceptance gate; unrelated CV03 Saved View formal WRITE, CV04 formal Export, production OIDC, PA05 operator/Agent WRITE and PR #1184 remain untouched.

## Handoff

Repository: [EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform). Branch/PR and CI evidence to be linked after actual execution; no manufactured success records.
