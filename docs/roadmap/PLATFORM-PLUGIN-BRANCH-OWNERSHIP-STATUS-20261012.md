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


## 2026-10-12 第二轮实时分支对账（main 8997e68）

**此次仅核对，不删除、不合并、不创建开发任务。** 固定 GitHub main `8997e68b65336717ce50e7227baa874485d2ea31`，实时读取分支 26 条、开放 PR 3 条。主线已从上次 `fd915983d108f860215276dcfe9e78af173544ee` 前进；本轮按当前树而非旧历史数字判断。

### 精确分组与变动来源

| 归属 | refs 数 | 保留/清理判断 |
| --- | ---: | --- |
| `main` | 1 | 保护 |
| TR-01/B2D3 14 条旧来源 | 14 | 尚未完成逐项语义收敛，保留；六个业务 Application + Finance Provider 全部 **PRODUCT_UNFINISHED** |
| Agent/External Agent | 5 | 外部专项，不动；`agent/pa02a-postgres-async-uniqueness-proof-20261011` PR #692 已 **closed/unmerged**，但分支还在，不能误报合并 |
| SOP Designer | 2 | `architecture/sop-designer-package-identity`、`-v2` 属于独立 Designer；不覆盖新 Host/Catalog |
| Platform 清理 | 2 | 两个原始改动文件集合与 main Blob 完全一致，**内容已被 main 收敛，可优先安全退役** |
| Plugin Store 描述 | 1 | `fix/plugin-card-descriptions-20261012`，开放 PR #783，保护；这条只涉及插件描述/契约/UI，并非本窗口新增任务 |
| Platform 交接 | 1 | 本 Draft #771，保护 |

2026-10-12 上次清单为 31。对比仓库本次实际 ref：Agent 的 `agent/pa01a-contextual-turn-identity-20261010`、`agent/pa01b2-native-chromium-preflight-20261011`、`agent/pa01b2-page-assistance-20261010`、`agent/pa01b3-authorized-mapping-receipt-browser-20261011`、`agent/pa01b-assistance-contract-20261010`、`docs/personal-agent-blueprint-20261010` 已不在分支列表；另增加 `fix/plugin-card-descriptions-20261012`，因此 31 - 6 + 1 = **26**。六项 Agent PR #570/#575/#577/#579/#638/#691 的查询结果都为 `merged:true`，**但删除动作不归本收敛窗口认领**。

三条开放 PR：[#594](https://github.com/jiangxng/EVO-App-Platform/pull/594) Finance Owner Draft、[#771](https://github.com/jiangxng/EVO-App-Platform/pull/771) 交接 Draft、[#783](https://github.com/jiangxng/EVO-App-Platform/pull/783) Plugin Store 描述。三条对应分支不可删除。#783 当前 head `9e783438587a4b2b2bed41670235c445e0fbe1aa` 对本次 main 前进 1 提交、落后 0；Git compare 50 个文件（多数 package.ts 增加一行，另有契约、Eidos/测试等变动），由原专项审查，本窗口不合并。

### 2 条 Platform 收敛分支：已精确核对全部修改文件的 Blob

- `chore/audit-and-retire-platform-tail-20261011`，固定 head `3a499f1524048741307f134aa14f7c4a871e3729`。相对自身 merge-base 新增的 3 个文件 `.github/workflows/platform-tail-ref-retirement-20261011.yml`、`docs/roadmap/PLATFORM-REMAINING-BRANCH-LEDGER-20261011.md`、`repository-hygiene/platform-tail-ref-retirement-20261011.json`，三者逐一与 **当次 main blob SHA 完全相同**。该 ref 比 main 领先 3 commit、落后 197 commit，历史分叉不等于功能缺失。标记 `CONTENT_SUBSUMED_RETIRE_CANDIDATE`，删除前仍要求固定 SHA、open PR head/base、protected、历史 tag 安全门。
- `chore/retire-platform-merged-f0-f1-f2-heads-20261012`，固定 head `7bd9709ee0d812827476cdb0e6c1a07eddb44eb2`。相对自身 merge-base 的 3 个文件：`.github/workflows/platform-one-time-squash-pr-ref-retirement-20261011.yml`、`docs/archive/platform-merged-f0-f1-f2-heads-retirement-20261012.md`、`repository-hygiene/platform-merged-squash-heads-20261012.json`，三者与 main blob **完全相同**。其 [PR #781](https://github.com/jiangxng/EVO-App-Platform/pull/781) 已 squash merged 至 `fd915983d108f860215276dcfe9e78af173544ee`。标记 `MERGED_PR_RETIRE_CANDIDATE`，当前仍未删除。
- 这两条不携带新的未完成插件工作；其历史独立性应借 PR/commit 或固定档案保存，**不能以一个比较报表的 `diverged` 字样擅自合并旧 Host**。

### TR-01：14 条旧分支逐行对 main 历史对账

以下 `ahead/behind` 为 GitHub API `compare(base=main, head=branch)` 结果；**不是“差异功能完成量”**。每条都是 `diverged`，共同落后 main **415 提交**。相对于同一旧 base 的旧提交被不同分支重复携带，不得将 ahead 数求和。

| Branch 缩写（均为原固定全名） | Ahead / Behind | 源码所属插件或性质 | 判定 |
| --- | ---: | --- | --- |
| `demo/tr01b2d3-isolated-live-stage-20261011` | 112 / 415 | 独立模拟舞台；仅 Web/测试证据 | 演示**非产品插件**，来源暂留 |
| `docs/tr01b2d3-mainline-recovery-20261011` | 121 / 415 | 混合旧 Provider 来源与交接资料 | 文档历史，来源暂留 |
| `docs/tr01b2d3-railway-runtime-preflight-evidence-20261011` | 69 / 415 | Finance Owner 老预检资料 | 未认证，来源暂留 |
| `feat/tr01-trading-peer-purchasing-receiving-20261011` | 131 / 415 | Purchasing + Receiving（同时携带共同旧 Provider base） | 两个 APPLICATION **未完成**；来源暂留 |
| `feat/tr01b2d3-definer-owner-strict-admission-20261011` | 87 / 415 | Finance Owner 旧安全 gate | Provider 未完成；来源暂留 |
| `feat/tr01b2d3-deployment-descriptor-gate-20261011` | 85 / 415 | Finance Owner 旧部署 gate | Provider 未完成；来源暂留 |
| `feat/tr01b2d3-finance-owner-prod-preflight-20261011` | 88 / 415 | Finance Owner 老预检 gate | Provider 未完成；来源暂留 |
| `feat/tr01b2d3-four-peer-business-plugins-stage-20261011` | 119 / 415 | Sales + Shipment + Receivable + Cash 演示来源 | 四 APPLICATION **未完成**；来源暂留 |
| `feat/tr01b2d3-host-owner-delegation-20261010` | 132 / 415 | Finance Owner 源及 [开放 Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) | **保留，禁止整体合并** |
| `feat/tr01b2d3-six-lane-production-admission-20261011` | 99 / 415 | Finance Owner 六层 gate | 未完成；来源暂留 |
| `feat/tr01b2d3-twelve-lane-preprod-20261011` | 104 / 415 | Finance Owner 十二层 gate | 未完成；来源暂留 |
| `test/tr01b2d3-cross-instance-nonce-revocation-race-20261011` | 62 / 415 | Provider nonce 旧测试 | 未认证；来源暂留 |
| `test/tr01b2d3-distinct-db-login-http-20261010` | 57 / 415 | Provider DB/HTTP 旧测试 | 未认证；来源暂留 |
| `test/tr01b2d3-isolated-finance-owner-credential-http-20261011` | 67 / 415 | Provider credential 旧测试 | 未认证；来源暂留 |

### 14 个完整 Git trees 对账：新 main 缺失路径的含义

本次对 main + 14 源头共 **15 个 recursive Git tree** 做 Blob SHA 对比，所有树 `truncated=false`。main 有 1580 个 blob，14 个老分支各为 1152–1189。老树中相对当前 main 缺失的**不同路径并集仍为 24**（不是 14×24）：**6 工作流、12 tools 测试/脚本、3 孤立 demo 文件、2 protocol tests、1 旧 online demo 文档**。其中 23 个路径各 1 版历史 SHA；`tools/certify-tr01b2d3-distinct-db-logins.mjs` 有三版。

**本次未发现 main 缺失一个新的 `apps/trading-stage-*/package.ts` 独立 APPLICATION 包路径**；六包实际已在 main。剩余 24 条路径属于实验、CI、预检和文档，不能自动称为缺失业务功能。重要限制：14 条旧分支相对 main 的**同名文件也存在 83–90 条 blob 不一致**，不能只比较不存在的路径就声称代码功能已 100% 收敛。先前 F0/F1/F2 的有限 CI 不等于 Finance Owner 正式功能完成。

### 终局收敛次序（不创建研发任务）

1. **只退役经过核对的两个旧 Platform 清理 ref**，须满足固定 SHA + PR 依赖重检 + 必要历史归档；本次未执行删除。
2. 继续保存 #594/#771/#783 开放 PR 及其 head/base。Agent 5、SOP 2 全交回各自 owner；#692 **closed/unmerged** 不能被误判为已合。
3. 14 条 TR-01 旧 ref 继续做**归档/去重判定**，未完成 Provider / APPLICATION 始终维持未完成。不要据此新增 24 项工具研发、6 项业务研发或任何 CI、Railway 任务。


## 2026-10-12 最终执行结果：用户正式批准旧分支分流并全部清理（覆盖本文件前面的旧快照）

- 用户要求：两个旧阶段分支纳入 **六个独立 APPLICATION 插件**（未完成仍未完成）；Finance Owner 与 EVO Ledger/valuation/Allocation/fact verifier 重叠的旧功能不保留，Host 独特来源放回独立 Provider；孤立的独立 HTML/Railway 演示不保留；两份过程文档放入 main；多语言说明 PR 合并并发布公网。
- [插件描述 PR #783](https://github.com/jiangxng/EVO-App-Platform/pull/783) **MERGED_MAIN** `8b8b1634256f96b06e1a9e5aa978d919c39e8024`；当时 42 项 checks 全 SUCCESS。原多语言说明 branch 已作为本次 17 refs 退役的一部分删除。
- [插件分流与清理 PR #784](https://github.com/jiangxng/EVO-App-Platform/pull/784) **MERGED_MAIN** `ccb5820b99d854e1e78f6c35bfb77e01e7d084f1`；三项 PR checks 全 SUCCESS。main 已分别有六个业务 Package 的较新代码；新加 `apps/trading-stage/LEGACY-CONVERGENCE.md` 记录归属。五份**不激活的 Host 侧旧验证源码**逐字节迁入 `providers/trading-finance-owner/legacy-evidence/`。EVO Ledger 经济计算的旧复制、过时 Owner Listener/Race DB CI、独立 HTML Demo 均 **未复制/未重新启用**。旧两份过程文档在 main 的 Blob 均与历史分支完全一致，**已满足“放入 main”**，不是新拷贝。
- [Finance Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 已在提交明确原因的评论后 **CLOSED, UNMERGED**，保持 **PRODUCT_UNFINISHED**，不误报“完成”或“已合并”；EVO 仓库 [#108](https://github.com/jiangxng/EVO/pull/108) 独立保留不动。
- [只读 Audit #38186198615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38186198615) SUCCESS；[主线实际清理 #38186277365](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38186277365) **SUCCESS**，日志记录 **17 条 `DELETED_OLD_REF`**：14 条旧 TR01 分支 + 2 条旧 chore 清理尾巴 + 已合多语言说明 branch。独立再次枚举：**10 条分支，TR01 历史 0，Draft #594 头已删除**；保留 main、5 条 Agent/External Agent、2 条 SOP Designer、1 条本交接 Draft #771、1 条已合 #784 的清理工作分支。
- Railway Ledger Configurator 旧服务与原 `/data` 500 MB volume 维持，唯一 staged config 变更是从 `a35d68ddef5abbf1adfa3290317e9a069ddc449f` 切到精确 `ccb5820b99d854e1e78f6c35bfb77e01e7d084f1`。新 Deployment **`a6554bd8-8a24-4c13-9b40-e93c32f62a62`** `SUCCESS`；环境状态 `Online`，1 running / 0 crashed，0 warning/critical。网址 **https://ledger-configurator-production.up.railway.app/store**。此外部环境未取得独立 HTTP /health GET 结果；**不宣称浏览器人工验收或真实业务工作流已通过**。
- 退役来源/分类/旧固定 SHA 见 main 的 `docs/archive/TR01-20261012-LEGACY-BRANCH-RETIREMENT.md`；没有新增开发任务、产品功能、全局 project.status.json 改动、Finance Writer 权限或 EVO Ledger Runtime 调整。

**最新下一步不是再研发六个 APP**；六业务应用和 Finance Provider 仍为 **PRODUCT_UNFINISHED**。只剩 PR #784 的源分支 `chore/converge-tr01-legacy-to-independent-plugins-20261012` 可按合并 PR 事实另行退役（本轮未删）；Agent/Designer/其他无关分支照旧不动。


## 2026-10-12 最新平台收敛快照（main 0c49414）

- main `0c49414d1c3131cc4026fe3fe8ae926e3119c071`、11 branches、open PR 仅 #771（资料交接 Draft）是**这次重新核验的时点**，早先 73/33/31/26/10 的数字全部属于历史快照。
- 14 条 TR01 历史来源分支：**0**，已安全退役；原六个独立 `APPLICATION` 和 Finance Owner `PROVIDER` 的产品状态**仍然未完成**，不据此新生业务需求。
- 待归档退役源头有两条已合并分支：`chore/converge-tr01-legacy-to-independent-plugins-20261012` (#784、固定 `a6e5c0470a97c4c6ed0269ae7f064dc37de5ac1a`) 和 `feat/bex00-supplier-import-entry-20261012` (#787、固定 `30dcb38edc14a84189e93863d8497aa83707d88f`)。
- BEX-00 已根据 `docs/roadmap/BACKLOG.md` 被认领并完成 L0 对账；BEX-01 首批导入工作进入 main，不等于表格或手机验收。项目继续采用 Eidos 控件／对象插件语义／Host 授权三个独立 owner。
- 五条 `docs/diagram-v1-*` 和两条 `architecture/sop-designer-package-identity*` 为其他专项正在使用的资料与 branch；**明确排除**当前清理清单。
- 此状态清单属于**平台文档证据**；后续状态以 main 的 `BACKLOG.md` 和实际 GitHub 分支/PR 为准，历史仍保留在下文，不改写以往的主线时间点。
