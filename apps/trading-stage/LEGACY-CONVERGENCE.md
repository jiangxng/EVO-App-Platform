# TR-01 六个独立业务插件：旧分支正式归属（2026-10-12）

> **不是新功能计划。** 本目录负责合成只读演示适配器；六个独立 `APPLICATION` 各自放在 `apps/trading-stage-<domain>/package.ts`。它们目前均为 **PRODUCT_UNFINISHED / NOT_CERTIFIED**。分支清理不代表业务完成。

| 独立插件 ID | 当前 main 源 | 对应旧阶段来源 | 收敛结论 |
|---|---|---|---|
| `evo-trading-stage-purchasing` | `apps/trading-stage-purchasing/package.ts` | `feat/tr01-trading-peer-purchasing-receiving-20261011` | 原业务合成展示已在 main；保留较新的国际化，不覆盖 |
| `evo-trading-stage-receiving` | `apps/trading-stage-receiving/package.ts` | 同上 | 同上 |
| `evo-trading-stage-sales` | `apps/trading-stage-sales/package.ts` | `feat/tr01b2d3-four-peer-business-plugins-stage-20261011` | 同上 |
| `evo-trading-stage-shipment` | `apps/trading-stage-shipment/package.ts` | 同上 | 同上 |
| `evo-trading-stage-receivable` | `apps/trading-stage-receivable/package.ts` | 同上 | 真实应收/记账不得在此派生重复计算 |
| `evo-trading-stage-cash` | `apps/trading-stage-cash/package.ts` | 同上 | 真实收款/核销由现有 EVO 事实和授权 Owner 解释 |

**核对范围：** 已直接比较旧包与新包的实际源码；六个旧 `package.ts` 与 main 对比首先差异为 main 新增 `titleJa`、`titleTw`，不是一套未迁移的独立业务内核。当前 `apps/trading-stage/host-preview.ts` 只有明确的 `APP_PLATFORM_STAGE_MODE=isolated-preview` 与 `APP_PLATFORM_TR01B_STAGE_DEMO=enabled` 同时满足时才将六个包加入真实 Store，页面只用 `SYNTHETIC` / `READ-ONLY` 示例。已有主线 `tests/protocol/tr01-trading-peer-purchasing-receiving.test.mjs`、`tr01-six-stage-host-preview.test.mjs` 和四插件 F0 回归，不需要恢复旧 Host/Catalog 硬编码。

旧 `demo/tr01b2d3-isolated-live-stage-20261011` 是 **孤立的 HTML / Railway Function / WebCrypto 模拟页面**，不是任何一个上述插件。按用户明确决定，不把该页面、其专用 CI、代码或运行入口移入 main；对应分支只保留在退役记录里的名称/SHA，不建立 archive tag 或复制演示文件。

**此文件归属代码所在目录，不改变任何业务功能。** 不新建 6 个插件、不复制账本、无运行时启用、不新增开发任务。参见 `providers/trading-finance-owner/legacy-evidence/README.md` 的 Finance Owner 边界和 `docs/archive/TR01-20261012-LEGACY-BRANCH-RETIREMENT.md` 的逐分支退役决策。
