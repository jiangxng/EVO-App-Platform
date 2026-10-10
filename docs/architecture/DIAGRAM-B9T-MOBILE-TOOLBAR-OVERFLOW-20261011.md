# B9t — Chrome-verified 390px Designer overflow fix (2026-10-11)

App B-Class stacked on [B9s #635](https://github.com/jiangxng/EVO-App-Platform/pull/635). Pair upstream Eidos Draft with **only the matching mobile toolbar CSS line** in App vendor Surface; preserve all App Host navigation differences. Original B9s Chrome measurements (synthetic inputs) were at 390×844: Designer `documentWidth=698`, Viewer `documentWidth=390`, both visible canvas widths=390 and Viewer world SVG=904. Thus the actual defect is **Designer document horizontal overflow**, not Eidos world SVG width.

B9t replaces mobile `flex-wrap:nowrap` with `flex-wrap:wrap` for the toolbar, and adds the strict full-document `scrollWidth<=clientWidth+2` assertion in the native Chrome Designer/readonly Viewer script for both synthetic S2C and P2P flows at 390px. The existing real browser click / FileStore CAS / stale-write rejection / responsive geometry contracts must all continue to PASS. If the CSS fix does not address the overflow, capture CI failure and refine *locally* rather than lowering the guard.

No real customer data, native physical OS devices, formal accessibility audit or production identity/database were tested. All 39 original §14 formal cases remain NOT TESTED. No TR-01/main changes, merge, deployment or full-file vendor overwrite.
