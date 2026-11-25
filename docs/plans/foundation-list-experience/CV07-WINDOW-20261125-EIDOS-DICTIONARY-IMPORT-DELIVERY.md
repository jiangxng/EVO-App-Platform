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

## 2026-11-25 真实执行回执（本节追记原件）

- **实现与审核**：[PR #1379](https://github.com/jiangxng/EVO-App-Platform/pull/1379) Draft → 准确 HEAD `2ab0704d6f742a4229958f3a6516eb7f9ed995be` 53/53 CI SUCCESS → Ready → ordinary merge into protected `main@fb2abcbe21a534eecf944a51c40dad12c3494606`，无直接 push。最初编译 TS 返回路由类型问题已在同 PR HEAD 修复；UI Review Gate 要求的 [12 段 Eidos 评审](../../ui-design-reviews/CV07-EIDOS-COLLECTION-DICTIONARY-IMPORT-20261125.md) 和用户旅程测试已补齐。
- **真实 Data Import 协议原证**：[Platform CI protocol-and-core #45542883045](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45542883045)，Job #138965394772，1503 测试通过、0 失败；新 7 项 `CV07 dictionary import ...` 均显示 `ok`（当地时间 2026-11-25；原日志 UTC 03:53）。包含 CSV 映射、dryRun、atomic commit、PUBLISHED 不覆盖、重复/坏状态、 stale preview 原子回滚、授权 UI；**不能**由此声称 Human 的公网在线导入已签收。
- **主线与物理发布**：[Tokyo CI-Gated #45543350816](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45543350816) preflight Job #138966936362 SUCCESS、deploy Job #138967730357 SUCCESS。2026-11-25T04:00Z 原日志 `docker compose ps` 真正运行 `ghcr.io/jiangxng/evo-app-platform:fb2abcbe21a534eecf944a51c40dad12c3494606`、`Up 6 seconds (healthy)`，`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=fb2abcbe21a534eecf944a51c40dad12c3494606`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。
- **自动只读后验**：[Tokyo Inventory #45543859814](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45543859814)，Job #138968616160 SUCCESS（UTC 04:01），真实镜像 `fb2abcbe...` healthy，`CV07_TOKYO_BUSINESS_DICTIONARY_PACKAGE_INSTALLED=YES`、`CV07_TOKYO_BUSINESS_DICTIONARY_FEATURE_ACTIVE_IN_PERSISTED_STATE=YES`、`CV07_TOKYO_DATA_IMPORT_PACKAGE_INSTALLED=YES`、`CV07_TOKYO_DATA_IMPORT_FEATURE_ACTIVE_IN_PERSISTED_STATE=YES`，ACTIVE OWNER 企业关系 YES。它读取**持久态布尔值**，不能证明当前网页用户的授权、CSV 操作成功或录屏结果。
- **过程分支清理**：[Branch Hygiene #45543279096](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45543279096) 原日志 `DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv07-eidos-dictionary-import-ui-20261125 @ 2ab0704d6f742a4229958f3a6516eb7f9ed995be`，未触碰 PR #1184。
- **仍待真正 Human 签收**：用已有合法 Basic Auth + 当前企业 OWNER/ADMIN，刷新 `https://evo.43.167.252.197.sslip.io/`，进入业务字典，确认“导入 CSV / Excel”按预期出现；按本文示例 CSV（另测 XLSX）上传/映射/dry-run/commit，核对状态 DRAFT 和未发布的版本隔离；用只读成员确认入口被隐藏；在桌面及 390px 实际检查列设置按钮、返回路径与失败恢复。当前不持有或使用用户合法登录会话，不上传虚构企业数据；**Human = NOT SIGNED**。正式 CV03 Saved View WRITE/CV04 full Export/OIDC/PA05/Agent WRITE 不受此项影响。
