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
