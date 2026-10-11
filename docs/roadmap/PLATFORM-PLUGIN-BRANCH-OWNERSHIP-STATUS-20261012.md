# EVO 插件平台｜按插件拆分的分支收敛状态（2026-10-12）

> **这是分支归属与真实状态台账，不是新开发需求清单。** 用户明确要求停止扩大开发，专注平台已有分支收敛：每个插件单独列出；未完成的保持 **未完成**。本文件仅在现有 [交接 Draft #771](https://github.com/jiangxng/EVO-App-Platform/pull/771) 中记录，不合入、不激活任何额外业务能力，不修改全局 `project.status.json`。此文件中的状态优先于此前交接中“下一步开始 Purchasing / 补 F1-F4 CI”的执行建议。

## 一、状态定义（避免伪完成）

| 标记 | 含义 |
| --- | --- |
| `PACKAGE_PRESENT` | 当前 main 有独立 `PackageManifest` / Feature / 代码路径，仅证明**源码存在** |
| `PREVIEW_LIFECYCLE_PROVEN` | 现有测试验证合成只读预览的发现、安装、启停或卸载；**不是实际业务插件已完成** |
| `PRODUCT_UNFINISHED` | 实际业务、授权、EVO public runtime 事实调用或用户验收缺任意关键证据时，坚持标记 **未完成** |
| `NOT_REASSESSED` | 平台已有其他插件的历史完成状态不因这次 TR-01 分支收敛被更改；未重新核验时不作“完成”断言 |
| `RETAIN_BRANCH` | 开放 PR、依赖未决或来源尚未审核可退役；保留固定 ref，不是新开发任务 |
| `RETIRE_CANDIDATE` | 已合并 PR 且无当次开放 PR head/base 依赖、原 head 未受保护，**仍需执行实际删除后才算已清理** |

**核心原则：** “PR merged / tests green / Store 列出 / Synthetic Stage Demo 有页面”均不能升级为“业务插件已完成”。未完成插件继续保持未完成，不为更改其状态而安排新功能或扩大 CI。

## 二、TR-01 六个业务插件——物理代码已经分别存在，产品状态全部未完成

| 独立插件（Package ID） | 主线源码 | 确认存在的能力 | **业务插件最终状态** | 历史来源 |
| --- | --- | --- | --- | --- |
| **采购订单 Purchasing** / `evo-trading-stage-purchasing` | [package.ts](../../apps/trading-stage-purchasing/package.ts) | 独立 APPLICATION；采购订单合成只读 Eidos 页面；独立安装生命周期的代码/测试 | **未完成 PRODUCT_UNFINISHED**；正式业务录入与原始真实 BusinessData 工作流未证明由本插件承接 | `feat/tr01-trading-peer-purchasing-receiving-20261011` |
| **采购收货 Receiving** / `evo-trading-stage-receiving` | [package.ts](../../apps/trading-stage-receiving/package.ts) | 独立 APPLICATION；合成收货、订单引用、只读页面与生命周期 | **未完成 PRODUCT_UNFINISHED**；真实收货业务/冲销仍在既有 reference path；不是本插件完成证明 | 同 Purchasing 历史来源 |
| **销售订单 Sales** / `evo-trading-stage-sales` | [package.ts](../../apps/trading-stage-sales/package.ts) | 独立 APPLICATION；合成销售订单和 Eidos 页面 | **未完成 PRODUCT_UNFINISHED**；真实销售订单创建和授权没有以本插件完成验收 | `feat/tr01b2d3-four-peer-business-plugins-stage-20261011` |
| **出库发货 Shipment** / `evo-trading-stage-shipment` | [package.ts](../../apps/trading-stage-shipment/package.ts) | 独立 APPLICATION；合成出库单与销售单引用 | **未完成 PRODUCT_UNFINISHED**；正式发货、库存与 Ledger/Work 事实边界未在该插件验收 | 同四 peer 历史来源 |
| **应收 Receivable** / `evo-trading-stage-receivable` | [package.ts](../../apps/trading-stage-receivable/package.ts) | 独立 APPLICATION；合成应收状态及来源订单 | **未完成 PRODUCT_UNFINISHED**；账本/应收语义归属 EVO，当前只是展示，不是完成的记账插件 | 同四 peer 历史来源 |
| **收款 Cash** / `evo-trading-stage-cash` | [package.ts](../../apps/trading-stage-cash/package.ts) | 独立 APPLICATION；合成收款记录、应收引用 | **未完成 PRODUCT_UNFINISHED**；正式收款事实、Allocation/settlement 未在该插件完成验收 | 同四 peer 历史来源 |

六包在当前 main 中由共用 [demo-kit.ts](../../apps/trading-stage/demo-kit.ts) 仅复用 Eidos Presentation 适配器；由 [host-preview.ts](../../apps/trading-stage/host-preview.ts) **双环境开关** `APP_PLATFORM_STAGE_MODE=isolated-preview` + `APP_PLATFORM_TR01B_STAGE_DEMO=enabled` 才暴露 synthetic preview。全部独立 `packageId`，不能并成一张 Sales→Cash 总插件。**demo-kit 与 host-preview 不是新增第七、第八个业务插件**。

已有 [六包生命周期测试](../../tests/protocol/tr01-trading-peer-purchasing-receiving.test.mjs)、[Host Store 合成预览测试](../../tests/protocol/tr01-six-stage-host-preview.test.mjs)、[四包 F0 回收](../../tests/protocol/platform-f0-four-peer-source-recovery.test.mjs)，相关 #703/#731/#775 已合入 main。测试证明的上限为独立 Package + 只读 Eidos/商店合成预览，**六包无一被重新标成产品完成或 USER_ACCEPTED**。当前旧 `trading-reference` 中已存在的采购/销售参考路径不等于这六包已迁移完毕。

## 三、Finance Owner 是单独的 PROVIDER 插件，不是第七个业务应用

| 插件 ID | 来源与形态 | 保留状态 |
| --- | --- | --- |
| `evo-trading-finance-owner-provider` | [providers/trading-finance-owner/package.ts](../../providers/trading-finance-owner/package.ts)；`type=PLATFORM_PROVIDER`，只读 `evo.trading-finance.owner.verify-readonly`，没有用户/Agent 财务执行操作，`executionAllowed=false`；Host 的签名客户端源码独立存在 | **未完成 PRODUCT_UNFINISHED**：`#594` Platform Draft、`#108` EVO Draft 未完成正式 Finance-only Listener 和实际部署认证；main 的 Provider manifest 或本地 F1/F2 小测试 **不等于** 完整 Owner 已安装可用或财务权限开放 |

旧 Host delegation、安全门禁、nonce/登录/TLS/rotation 的代码/测试分支归属于这个 **Provider 插件相关的未结项历史资产**，不拆成多个新插件，不把安全工具分支转成开发项目。不新建“Cost FIFO”“Allocation”“Posting”三个 Platform 插件；经济语义归 EVO Ledger Runtime 的唯一权威。

## 四、既有平台插件独立保留，不因 TR-01 收敛改判状态

`apps/counterparty`（往来对象）、`apps/item`（物料）、`apps/warehouse`（仓库）、`apps/data-import`（数据导入）、`apps/object-extension`（对象扩展）、`apps/template-store`（模板库）均已有各自 `APPLICATION` manifest。它们不是六个 TR-01 交易应用的子模块，不应随历史 Finance 分支整合/退役而变化。**本轮 `NOT_REASSESSED`，既不宣称完成，也不改写它们以往的验收结论**。Ledger Manager、BI Workbench、2D/3D 等独立插件及 eidos 专项亦遵守现行 owner 边界，不借本收敛窗口强行分包或重排代码。

## 五、14 条历史 TR-01 分支：按插件归属拆清，不把“分支”误认为“独立插件”

| 历史 branch（全名） | 归属分类 | 现阶段处理 |
| --- | --- | --- |
| `feat/tr01-trading-peer-purchasing-receiving-20261011` | **采购 + 收货** 两个 APPLICATION 的旧阶段包来源（并非两份新开发任务） | 六包主线已存在；旧 ref 保留待退役证据复核；插件本体均未完成 |
| `feat/tr01b2d3-four-peer-business-plugins-stage-20261011` | **销售 + 发货 + 应收 + 收款** 四个 APPLICATION 的旧阶段来源 | 四包主线已存在；旧 ref 保留待退役证据复核；插件本体均未完成 |
| `feat/tr01b2d3-host-owner-delegation-20261010` | **Finance Owner PROVIDER** / Host security 候选 / [开放 Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) | **RETAIN_BRANCH**：未完成，禁止整体并入 main |
| `feat/tr01b2d3-definer-owner-strict-admission-20261011` | Finance Owner Provider 权限预检历史证据 | RETAIN_BRANCH / 不新增专项 |
| `feat/tr01b2d3-deployment-descriptor-gate-20261011` | Finance Owner Provider 部署门禁历史证据 | RETAIN_BRANCH / 不新增专项 |
| `feat/tr01b2d3-finance-owner-prod-preflight-20261011` | Finance Owner Provider 安全预检历史证据 | RETAIN_BRANCH / 不能称生产认证 |
| `feat/tr01b2d3-six-lane-production-admission-20261011` | Finance Owner Provider 六层准入历史研究 | RETAIN_BRANCH / 不启动新门禁开发 |
| `feat/tr01b2d3-twelve-lane-preprod-20261011` | Finance Owner Provider 十二层预准入历史研究 | RETAIN_BRANCH / 不启动新门禁开发 |
| `test/tr01b2d3-cross-instance-nonce-revocation-race-20261011` | Finance Owner Provider nonce 与并发安全旧测试 | RETAIN_BRANCH / 未认证的保持未认证 |
| `test/tr01b2d3-distinct-db-login-http-20261010` | Finance Owner Provider 独立 DB 登录 / HTTP 旧测试 | RETAIN_BRANCH；F2 #777 仅回收 PG 一小部分，未证明整体完成 |
| `test/tr01b2d3-isolated-finance-owner-credential-http-20261011` | Finance Owner Provider 凭证/隔离旧测试 | RETAIN_BRANCH / 不新增专项 |
| `docs/tr01b2d3-mainline-recovery-20261011` | 横跨六应用与 Finance Owner 的历史交接**文档** | RETAIN_BRANCH / 归档性资料，**不是插件** |
| `docs/tr01b2d3-railway-runtime-preflight-evidence-20261011` | Finance Owner / Railway 历史预检**文档** | RETAIN_BRANCH / 不是已交付 Provider |
| `demo/tr01b2d3-isolated-live-stage-20261011` | 合成浏览器/WebCrypto 预览**演示** | RETAIN_BRANCH / 不恢复产品插件，不称线上 Host/Owner |

以上分类为历史分支的**主要内容归属**；每个历史分支可能包含旧 base 的其他插件源码，不能通过旧 branch 的文件数量误推为这些插件全部由它独占。14 条固定 tip 和 24 个独有历史路径的逐一哈希证据已在 [Execution Evidence](../archive/PLATFORM-20261011-WINDOW-EXECUTION-EVIDENCE.md) §J 中保存；所有 14 ref 目前未删除。

## 六、其余 GitHub 分支处置：只做收敛，不给任何插件新增任务

核对 2026-10-12 当前 main `1d9b301f418ef17b0d15aa8df982bab17810e9ca`，GitHub **33 branches / 9 open PR**：

- **3 个已合 PR 的源码分支，标记为 `RETIRE_CANDIDATE`（未删除）**：`test/platform-f0-four-peer-lifecycle-convergence-20261011` → [#775](https://github.com/jiangxng/EVO-App-Platform/pull/775)；`test/platform-f2-disposable-postgres-logins-20261012` → [#777](https://github.com/jiangxng/EVO-App-Platform/pull/777)；`test/platform-f1-host-signed-loopback-proof-20261012` → [#779](https://github.com/jiangxng/EVO-App-Platform/pull/779)。三个 PR 均 closed/merged，source refs 未受保护且不在当前 9 open PR head/base 中。尚未运行删除。
- **`docs/platform-convergence-window-handoff-20261011` / #771**：本收敛记录，保持 Open Draft；不把它变成产品研发 PR。
- **`chore/audit-and-retire-platform-tail-20261011`**：旧收敛审计分支，不存在于当前开放 PR head/base；`git compare` 与 main **diverged**，不能仅凭名称判断已完整合并或安全删除，暂留待证据确权。
- **11 条 Agent / External Agent 相关分支**：独立线、相关 open PR 及链式 base，全部保护不动。
- **2 条 SOP Designer 架构分支**：独立 Designer 归属，不由 Platform 窗口处理。
- **main**：唯一当前集成权威，保护不动。

`33 = 1 main + 14 TR-01 + 3 已合候选 + 1 交接 + 1 旧 chore + 11 Agent + 2 Designer`。这是一份分支库存分类，**不等于从 33 减去候选已经实际删除**。

## 七、收敛结论——不建立下一批研发任务

1. 六个 Trading APPLICATION 的独立包已经主线存在，但 **六个仍是 PRODUCT_UNFINISHED**；Finance Owner PLATFORM_PROVIDER 也是 **PRODUCT_UNFINISHED**。保持原真实状态，不要为“完成分支收敛”而补代码、强制合 PR 或开启财务执行。
2. Finance security 与合成 stage 演示属于该 Provider 或各 Application 的历史**来源和证据**，不是可新增安装插件，不增加插件数/工作流/业务任务。
3. 分支清理候选的必要条件：具体 merged PR、对应已合 main 的变更、原 head SHA 与开放 PR head/base 双重检查、非保护状态、无其他用法；不满足或无法执行删除，就保持候选/保留状态。**本次没有删除分支**。
4. **不创建功能 PR，不启动六应用开发、Finance Owner 开发、F1/F2 专项、安全扩张、Railway 部署或 Agent/2D 改造。** 本次交付仅为插件独立归属 + 完成状态保真 + 现有分支退出/保留边界。


## 最新执行补记：清理三条已合验证 PR 源分支（2026-10-12）

**以本段为最新 Git Ref 状态；上文“33 branches / 三个候选尚未删除”是之前的历史快照，不应按现状继续解读。**

- [清理 PR #781](https://github.com/jiangxng/EVO-App-Platform/pull/781) 已 squash merged，main merge `fd915983d108f860215276dcfe9e78af173544ee`，只影响一次性 source ref 退役工作流、精确 SHA 清单和审计文档。**不是新增插件开发、测试或功能**。
- PR audit [Actions #38157635596](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38157635596) SUCCESS，日志逐个 `PR_MERGE_VERIFIED` 后标记 `AUDIT_ONLY`。
- merge 后 main push [Actions #38157759718](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38157759718) **SUCCESS**；日志实际对 [#775](https://github.com/jiangxng/EVO-App-Platform/pull/775)、[#777](https://github.com/jiangxng/EVO-App-Platform/pull/777)、[#779](https://github.com/jiangxng/EVO-App-Platform/pull/779) 对应的三条 SHA pinned 源分支逐个 `DELETED_SQUASH_HEAD`。
- **执行后的独立分支枚举：31 branches，三条 `test/platform-f*` 已全部不存在；TR01 仍为 14 refs、Agent 仍为 11 refs。** 从本批开始前 33 条变 31 条，是 3 条已删 + 1 条 cleanup PR 源分支新增仍留着（`chore/retire-platform-merged-f0-f1-f2-heads-20261012`），不虚报净减 3。
- 六个业务 APPLICATION 和 Finance Owner PROVIDER **继续全部未完成**；原有 14 条旧 TR-01 source tips 无删除，#594 Draft 和 #771 Draft 仍应保留。后续仅处理已有分支本身的安全归档与退役判定，不建立新业务开发任务。
