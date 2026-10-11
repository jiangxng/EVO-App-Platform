# Platform 非 Agent / 非 2D 分支功能收敛 — 新窗口接续入口

> 核查日：2026-10-11。本文是窗口工作交接，不是 Platform 全项目权威状态文件。
> 仓库：https://github.com/jiangxng/EVO-App-Platform
> 独立交接分支：docs/platform-convergence-research-handoff-20261011
> 核查基准 main：56063b50802697fcbdddf772683a4b9d174907ba
> 交接分支自己的最终 SHA 以 GitHub 分支页面 / 交接 PR 为准；创建文档时不能预知本次提交 SHA。

## 1. 立即接续

**工作边界：**只负责 EVO-App-Platform 中非 Agent、非 2D Designer 的分支功能级收敛。Agent / EOG / 2D / 投影设计器由并行窗口管理；不修改其分支、核心文件或 PR。不要直接覆盖 project.status.json、HANDOFF-LATEST.md 等全局权威文件。财务 FIFO、核销、余额及 Posting 的实际算法仍属于 EVO Ledger Runtime；Platform 只持有应用、主数据维度和经授权的对接契约。

**用户已明确：**一项功能能用、测试通过才合入 main，随后再安全删原分支；不接受只统计 Git commit 的形式收敛；不应留下大批 Draft 功能分支。当前 Railway 只是“公网集成测试环境”，不能因为 Railway 的 production 环境名称就称为正式投产。

**先读四份：**
1. 本入口（简短，决策导航）。
2. [已读原始资料与 CI 证据索引](../research/PLATFORM-CONVERGENCE-SOURCE-INDEX-20261011.md)（每项有来源状态、日期、用途、关键发现）。
3. [已确认选择、冲突、风险和待做事项](./PLATFORM-CONVERGENCE-DECISIONS-GAPS-20261011.md)。
4. [剩余功能分支矩阵与处置门槛](./PLATFORM-CONVERGENCE-REMAINING-BRANCHES-20261011.md)。

## 2. 本窗口已经实际合入 main 的五批功能

| PR | 合并提交 | 工作内容 | 验证 |
|---|---|---|---|
| [#716](https://github.com/jiangxng/EVO-App-Platform/pull/716) | fcff4a54ca35c57ce2f0ebd413fcdaa49ab9f2fd | Template Store 缺失的模板版本 ID 生成/解析、严格数字验证；原旧 actions/authorization 历史保留 | Platform、Template Store Plugin、Continuity CI PASS |
| [#717](https://github.com/jiangxng/EVO-App-Platform/pull/717) | 36ec6a4b97b71f7608f979eea02fe067c08aa9d0 | CP-03 XLSX 2048 列边界、过多数据列显式拒绝、行数早期约束；当前原子事务保留 | Platform、Continuity CI PASS |
| [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) | c53661e57f44fdb656f0cabc89ac99d5e32e91a6 | 六条旧登录分支：当前双皮肤、途鸽 PNG、缓存参数已经实现；新增回归、留旧提交历史，不倒退 UI | Platform、Continuity CI PASS |
| [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) | 456aacaa9bfecb324027d117d428dfd1d64cff27 | Ledger Configurator 现代只读 Capability / Eidos Template Store / EVO observation 企业权限边界的跨模块回归；四旧分支收敛 | Platform、Continuity CI PASS |
| [#722](https://github.com/jiangxng/EVO-App-Platform/pull/722) | 56063b50802697fcbdddf772683a4b9d174907ba | TR-01 采购—收货—冲回原始证据归档和 BusinessData FULFILLS/REVERSES 回归；两旧分支收敛 | Platform、Continuity CI PASS |

合计**16 条原来独立的非 Agent/2D 功能源分支**已通过五批功能审查、复用新版实现/补齐缺失能力并将原始提交历史并入 main。这**不等于**这些源分支的 Git refs 已被删除。另有先前工作完成的 IT01 / Help Center / 历史状态清理 PR #555、#710–#714、#711、#385，证据请见来源索引。

本轮实质新增：
- apps/template-store/repository.ts：templateStoreRecordItemIdV010、parseTemplateStoreRecordItemIdV010。
- apps/data-import/xlsx.ts：稀疏列及记录数限制、额外数据列拒绝。
- tests/protocol/template-store-identity-convergence.test.mjs
- tests/protocol/cp03-xlsx-resource-guards-convergence.test.mjs
- tests/protocol/login-skin-legacy-convergence.test.mjs
- tests/protocol/platform-capability-legacy-convergence.test.mjs
- tests/protocol/tr01-purchase-legacy-convergence.test.mjs
- 五批 provenance 记录：docs/archive 目录，具体位置见索引。

## 3. 当前 Git / Railway 实况（时点快照，继续工作前必须重查）

截至本次核验，main = 56063b50802697fcbdddf772683a4b9d174907ba。GitHub 分支枚举为 59 条（其中包含近期合并但还未删除的历史源分支、清理分支及同时新增的 2D 分支），不可继续把上轮“剩余 30 条”当成实时仓库总分支数。

2026-10-11 05:07:48 UTC 的 GitHub Branch Hygiene run [38113793947](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38113793947) 失败，实际原因是 GitHub installation API **rate limit exhausted, 403**，脚本遍历已关闭 PR 翻至 page 5 时耗尽 5000 请求额，并非上述五批功能 CI 失败。原分支可能仍存在。仓库还有并行创建的 chore/prune-functionally-converged-nonparallel-20261011 分支；不要越权修改，先审查它的实际状态。

Railway 现有公网测试 Host：
https://ledger-configurator-production.up.railway.app
最后查询到的 SUCCESS 部署为 2026-10-11 02:14:57 UTC，部署提交 **296d9c444ae50ba802fd01c1584caccd205f356c**，不是本轮 main 56063b50。正式业务环境从未由用户确认；不应称为生产。Railway 项目、环境、服务名称尚未实际更名。新创建 Preview 曾因 Free plan resource provision limit exceeded 失败；无需为本次功能验证新增业务服务。

## 4. 下一窗口先做什么

**P0** 重查 main SHA、开放 PR、全部 branches、五批 CI、Railway 部署状态；不要采用本文快照作实时事实。审查 GitHub Branch Hygiene 的限额问题和现有并行 prune 分支；改为限流、少页 API、仅针对已核验祖先的闭合集清理。先确保保留所有 Agent/2D 和开放 PR head/base，再移除已经成功合并、且与其他任务无依赖的旧 refs。不要重跑耗尽 API 的遍历式清理脚本。

**P1** 处理尚有独立代码的约 14 条 TR-01 B2D3 系列分支，尤其 [Draft PR #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 的签名 Host 委托、凭证回收、跨实例 nonce、环境准入和权限边界。先抽出独立安全/认证/业务验证模块，用当前 main 做干净、可 CI 合并的 PR；每个独立功能验收后合入，不得将旧 branch manager/server.ts、catalog/seed.ts 大面积回退。

**P2** 检查与 EVO Ledger Runtime 的公共 API 兼容性和六个 Trading Native Application package 的实际安装/发现/生命周期；#703 只证明 demo/read-only 独立包与 CI，不等于它们已真实在 /store 可用。核对后才考虑部署到**同一现有公网测试服务**进行人机验收。

## 5. 资料可信度与交接声明

这个窗口主要通过已连接的 GitHub、Railway 接口直接读取原始文件、源代码、CI 日志和实时部署元数据；**没有发现需要补造的第三方网页文章，也没有保存网页截图**。参考索引严格区分“已读原文”“部分原文/仅元数据”“待验证”；原始链接、文档路径和 run id 均留在独立索引中。除 GitHub 上明确保存的文档/PR/源码/CI 外，聊天解释本身不构成独立永久源文件。

## 2026-10-11 新窗口增量核验（非历史快照覆盖）

- 新窗口直接读取了本入口、来源索引、决策与风险、14 分支矩阵原文，核验 GitHub main 在本轮初始时为 `60754835f4c7d7b6e2acd7fe9f12b202ef143244`（2D 专项 PR #726，**不可据此修改 2D**）。
- [Branch Hygiene 失败 run #38113793947](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38113793947) 的工作流原文已复核：每次 main push 全量分页 `state:closed`，直接删 ref；退休清单 `repository-hygiene/retired-branches.json` 仅有名称/原因，没有旧 head SHA；因此不能直接据此批量删。
- 已建立 [PR #728](https://github.com/jiangxng/EVO-App-Platform/pull/728)，head `4d37a029c93a9a94136545e1d2d7d230d4d9588d`，只修改 `.github/workflows/branch-hygiene.yml`：取消 main push 自动清理；改手工、默认 audit，只有 manifest 显式 `expectedHeadSha`、不是开放 PR head/base、不是 Agent/EOG/2D/Projection、旧 head 是 main 祖先且 ref 未变化才允许 execute 删除。既有无 SHA 清单保持不可删。本项在 CI PASS/实际合并前**不得称完成**。
- [Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 核实仍 OPEN；PR 原文承认虽然已有 HTTP/PostgreSQL、Managed Session、ECDSA/Ed25519 签名与跨实例轮换专项 CI，真实外部 OIDC、实际部署 TLS、分布式 Host key 传播、正式运行权限等仍未认证，不能整支合并。
- 本轮未删除旧 branch ref，未修改 Agent/2D 分支或全局状态，未发布 Railway。新材料均为直接读取的 GitHub 原始文件/PR/API，日期 2026-10-11；本记录不声称查过第三方文档或真实线上浏览器。

### PR #728 结果勘误／实际验收

[PR #728](https://github.com/jiangxng/EVO-App-Platform/pull/728) 已在本轮通过 Project Continuity CI [run #38138346624](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38138346624) 并 squash 合入 `main`，合并 SHA `4867d7a25f47fde47fa37be14fbd1ef568834e68`。由于此前入口的新增记录是在 CI 尚未结束时写入，以上是**后续实际结果**，不得再称 #728 待合并。最新分支查询 58 条，旧 16 条中仍看到多个历史 refs；本次**未执行删除**，没有证据称已清理完成。

#703 的六独立 Trading Application package PR 状态已直接查询为 merged；当前 main 的 apps 目录列有 trading-stage-sales、shipment、receivable、cash、purchasing、receiving 六包。**目录存在不等于实测安装/启用/商店发现/真实授权通过**，这仍是后续功能验收工作。


### 2026-10-11 独立六插件公网可交互预览交付（新窗口，实际部署）

- **真实实现与合并**：[PR #731](https://github.com/jiangxng/EVO-App-Platform/pull/731)，squash main SHA `89320e118b97f358b4fdab0ec4c198d1cf8a57c7`。在 `apps/trading-stage/host-preview.ts` 通过双开关将六个独立 `APPLICATION` 作为可发现、安装、启用、禁用、卸载的真实 Host Store 项注册；`manager/server.ts` 只有四处注册 wiring，不修改 Catalog seed、Agent/2D、Finance Owner、Ledger engine。工作流验证 Host 变化**只允许这四处**，新增 `tests/protocol/tr01-six-stage-host-preview.test.mjs`。
- 最新合并前 CI 在 [PR #731](https://github.com/jiangxng/EVO-App-Platform/pull/731) **36/36 SUCCESS**；其中六插件 workflow [run #38139204726](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38139204726)。CI 的模拟生命周期可重放，但不是生产业务事实。
- **实际铁路部署**：Railway 项目 `EVO Ledger Runtime MVP`、environment `production`（只是**公网集成测试**）、服务 `Ledger Configurator`；由原先明确 pinned SHA `296d9c444ae50ba802fd01c1584caccd205f356c` 改为明确 pinned `89320e118b97f358b4fdab0ec4c198d1cf8a57c7`。部署 `bcc40ccc-ed2e-4746-8a56-45d9289ca3ca` 为 **SUCCESS**，build log 报 `/health` 第 1/1 次成功、Node `EVO App Manager listening on http://localhost:8080`；`/data` 原始持久卷保留，Railway 配置无 pending patch。仅设置 `APP_PLATFORM_STAGE_MODE=isolated-preview` 和 `APP_PLATFORM_TR01B_STAGE_DEMO=enabled`。
- 可供用户浏览器验收：https://ledger-configurator-production.up.railway.app/store 、`/trading-stage/{sales,shipment,receivable,cash,purchasing,receiving}`（先安装）。**浏览器里真实登录、安装、页面视觉、权限、跨服务业务数据仍待用户签收**；这是 `Synthetic Stage Demo` / `READ-ONLY` / `NOT_CERTIFIED`，不得写成业务上线。
- **测试版本冻结**：用户测试期间不能将此 Host 自动升级到后续 `main`；后续专项代码继续独立 PR 和审查，不扰动 Railway 的 pinned SHA。Railway 的 environment 名字为 `production` 不代表业务正式投产。


### 2026-10-11 实际清理结项：16 个旧源分支（修正此前“待删除”快照）

- [PR #740](https://github.com/jiangxng/EVO-App-Platform/pull/740) 合入 main `4690ff813fc076e3d0d8bf18641f2ca145d56b4b`。审计 workflow [#38140337021](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140337021) **SUCCESS** 且未删；执行 workflow [#38140393664](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140393664) **SUCCESS**。
- 实际重新枚举 GitHub branches 结果为 54，交接矩阵列举的 **16 条历史源 refs 均不存在**；源码仍在 main 的 Git 历史和先前五批合并 PR 中。此前目录显示“待安全删除”的条目现已全部更正为 **DELETED_VERIFIED**。
- [主线实际删除证据档案](https://github.com/jiangxng/EVO-App-Platform/blob/4690ff813fc076e3d0d8bf18641f2ca145d56b4b/docs/archive/platform-convergence-branch-retirement-20261011.md)（随后 docs 修订 [#741](https://github.com/jiangxng/EVO-App-Platform/pull/741) 将预案改为结项）。
- GitHub open PR 中仍有 #723（本交接）、#594（Finance Owner Draft）、Agent/2D/EOG 等；剩余约 14 条 TR-01 B2D3 仍有独立差异，未误删。
- 近期 #728/#731/#736/#740 的 squash PR 源分支因历史 `diverged`，不符合祖先-only 自动删除条件，不能用第一批方式假装清理完毕。下一步需做比对与显式审批。
- Railway 公网集成测试服务保持 pinned `89320e118b97f358b4fdab0ec4c198d1cf8a57c7`，部署并未随 GitHub main 变化；不能打断用户测试。


### 2026-10-11 第二批合并源分支清理：squash PR heads（5 条）

- [PR #743](https://github.com/jiangxng/EVO-App-Platform/pull/743) 通过 audit-only CI 并合入 main `8f32e0d348e5e9268612f1402afc72ab66d288cd`。GitHub Actions [执行 run #38140857767](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140857767) 完成 **SUCCESS**；执行后重新完整枚举分支，**5/5 指定 squash-merged PR heads 消失**，仓库当次总数 **52**。
- 本次清理固定 PR #728、#731、#736、#740、#741：检查每条 PR 在 GitHub merged=true / closed / base=main、正确源仓库、精确 head SHA 与 mergeCommitSha，且真实 mergeCommitSha 是 main 祖先；开放 PR 不引用、分支非 protected、删除前 SHA 不变。区别于第一批 16 条 source branch 的直接 ancestor-only 删除。
- **本窗口共 21 条原历史分支 refs 删除成功**（16 条功能源 + 5 条已经 squash merge 的专项 PR heads）。完成不等于剩余 14 条 TR-01 B2D3 已审查/关闭。
- [本批归档](https://github.com/jiangxng/EVO-App-Platform/blob/8f32e0d348e5e9268612f1402afc72ab66d288cd/docs/archive/platform-merged-squash-ref-retirement-20261011.md) 保存五项 SHA/PR；[源 manifest](https://github.com/jiangxng/EVO-App-Platform/blob/8f32e0d348e5e9268612f1402afc72ab66d288cd/repository-hygiene/platform-merged-squash-heads-20261011.json) + Actions run 是实际删除证据。主线 archive 原“待执行”属于执行前快照，以本条和 Actions 为准。
- 本轮未修改 Railway，用户六插件测试部署 `89320e118b97f358b4fdab0ec4c198d1cf8a57c7` 保留不动；Agent/2D/EOG/Projection、Draft #594 和剩余功能分支未删除。
