# EVO 2D Designer｜新窗口简短交接入口（2026-10-12）

> **阅读顺序**：本入口（先读，约 3 分钟）→ [本窗已查资料与决策详细索引](./DIAGRAM-V1-20261012-REFERENCE-INDEX.md) → [main 与 Railway 线上诊断快照](./DIAGRAM-V1-20261012-MAIN-ONLINE-INVESTIGATION.md)。既有 [v1.0 商业化要求](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) **§13 / §14**、[原始研究资料索引](./DIAGRAM-V1-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md) 和 [验收证据矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md) 仍是权威，不因本交接被改写。

## 1. 所属窗口、目标与用户明确要求

- 仅接续 **EVO 2D Designer 商业化 v1.0**，包括与 Eidos 2D 通用引擎、2D Viewer、Platform 投影插件接合的部分；**不接管** EVO 主线业务、Ledger Runtime、Personal Agent、TR-01 或其他窗口，不触碰 `project.status.json` 等全局归属文件。
- 用户先要求：「已完成的合并到 main，删除已合并分支」「做一下对账，然后合并，删除」；随后明确问「本轮 2D Designer 的开发工作是否已全部完成？」；最后反馈「你帮我看一下 main 还有线上环境，好像很多功能被覆盖了」。
- 本窗口最后一项**尚未完成的问题**是“**线上感觉很多功能消失/被覆盖**”。新窗口的第一优先级是**复现、对账、定位具体丢失页面/操作**，**不是重新开发所有 v1.0 特性或盲目发布/回滚**。先调查哪些路径原本是上下文入口/需要插件启用；确认真正缺失再提出最小修复。
- 之前用户明确：投影是可见性/呈现层；**编辑投影不新增业务定义版本**；自动排版是固定功能、尊重隐藏与位置锁定；公用图形语义由 `jiangxng/eidos` 负责，Platform 负责受控 Host/vendored 适配。不得用旧分支覆盖新 Viewer/Designer。

## 2. 已发生、已核实

| 主题 | 结果（有实际 GitHub/CI 证据） |
| --- | --- |
| v1.0 功能收敛 | 39/39 **编号场景有范围受限的浏览器自动化子场景证据**；**正式人工/真实设备/客户验收 0/39**；不能写「正式 39/39 通过」 |
| Platform 2D 历史分支 | [#776](https://github.com/jiangxng/EVO-App-Platform/pull/776)、[#778](https://github.com/jiangxng/EVO-App-Platform/pull/778) 等先退役 38 个已合并相关旧 ref；[#780](https://github.com/jiangxng/EVO-App-Platform/pull/780) 将额外 12 个旧分支按原 SHA **历史归档而非整份旧工作树覆盖**，main 工作流删除它们及清理分支（共 13）。旧 [#388](https://github.com/jiangxng/EVO-App-Platform/pull/388) 关闭，但其原版保存逻辑**未部署**。 |
| Eidos 商业化旧 PR | 通用核心 [#160](https://github.com/jiangxng/eidos/pull/160)，位置锁定 [#171](https://github.com/jiangxng/eidos/pull/171)，历史对账 [#172](https://github.com/jiangxng/eidos/pull/172)、[#173](https://github.com/jiangxng/eidos/pull/173)、收尾 [#174](https://github.com/jiangxng/eidos/pull/174) 已入 main；旧阶段 PR 29 个已关闭或自动并入。曾有主清理工作流「**删除已发生，但最终失败**」的 404，应按真实日志记载，不得写为成功；后续 Eidos Branch Hygiene 与 CI **成功**。 |
| 没有因清理恢复旧功能 | 三类旧提议**未直接搬回**：企业软件投影 Gallery/原版管理动作、Eidos `secondaryActions` 旧字段、Viewer 返回导航旧实现；准确边界见 [12 分支对账](./DIAGRAM-V1-12-LEGACY-HEADS-RECONCILIATION-20261012.md)。历史归档 != 运行时代码合并。 |
| 最新 main 快照 | 2026-10-12 09:??–10:17（香港时间）查得 Platform `33ecccdaa27a96f8d6fa0e3e146b589dd71adfa8`（#787 BEX 供应商首片）；Eidos `f412f1d03e684a3f3463d10eac51d6cc79032eff`。**新窗口先重新查询**，其他窗口仍会继续合并。 |
| 线上 Railway 快照 | `ledger-configurator-production.up.railway.app` 的 Ledger Configurator 仍运行 Platform `ccb5820b99d854e1e78f6c35bfb77e01e7d084f1`（2026-10-11 23:59:56Z 部署；项目 `EVO Ledger Runtime MVP` 的 production）。当前 main 对比该部署：39 commits ahead、0 behind、19 个改变文件；有 BEX `manager/server.ts` 修改，但**无 `apps/eog-2d*` 或 `vendor/eidos/src/diagram` 文件差异**。Railway 在线、`/health` 通过并不等于操作验收通过。 |

## 3. 当前重要诊断结论与边界

- **[代码事实]** Platform 内置 EOG 2D 包仍存在：`apps/eog-2d/package.ts`，Designer `/operating-graph`、Viewer `/operating-graph/view`、定义投影编辑及预览路由均被声明；两功能默认启用属性 `defaultActivation:true` **只作用于安装后**，不能证明当前生产数据卷已安装且处于有效状态。
- **[代码事实]** Eidos App Host 的浏览器导航读 `window.location.hash`；进入 Store 应使用应用主页的 **`/#/store`**，不是服务器端直访 `/store`。Railway HTTP 流中曾捕获 `GET /store → 404`，这可能解释部分“页面不见”；不应把它误判成插件删除。
- **[代码事实]** 2D Designer/Viewer 作为可被业务上下文唤起的工具，代码注释明确**不贡献长期 Workbench 导航项**；侧栏里看不到不是功能丢失证据。Viewer 中「编辑投影」按钮受 `canEditProjection` 和 `projectionId` 条件控制。
- **[证据限制]** 未在有权限的真实登录浏览器中复现用户的具体消失项；Railway OAuth 只允许读环境变量**名称**，无法读其值；插件实装/activeFeatures、当前组织/角色/权限、持久层实际状态**尚未从受权线上会话核实**。有 403 的 `/v1/experience-pages` 访问日志，不足以判定是产品 bug。
- **[参考冲突]** Platform vendored Eidos 2D 独立 pin 为 `79e124d3...`，其 `surface.ts` 受 Platform Host overlay 保护；顶层 `sourceCommit=22b487...` 是更旧的全局 Eidos 快照，**不能误读成 2D core 退回旧版**。对比源码：15/16 图形文件按组件 pin，`surface.ts` 特意不同，不能整目录覆盖。

## 4. 下一窗口推荐操作（不扩展开发范围）

1. 先只读确认 **当前** Platform/Eidos main 与 Railway production 的 Commit SHA、最近部署；重读三份本窗文档、v1.0 §13/14、既有验证矩阵。
2. 从**实际用户已登录会话**列出缺失的具体项（页面名、原入口、预期、现状）。复现 `/#/store`、`/#/operating-graph`、`/#/operating-graph/view`、`/#/definition-preview/2d/edit`，并检查是否需要先从业务上下文、账本定义/版本/投影视图进入。
3. 只读核实生产 `/v1/catalog`、`/v1/platform/snapshot`、`/v1/experiences/effective`、`/v1/experience-pages?source=...` 的实效数据，**须依法依授权登录**；记录 HTTP/业务错误、`installedPackages`、`activeFeatures`、身份与企业上下文；**不要公开 token、cookie、隐私字段**。
4. 对每个真缺陷，比较**用户曾确认可用的具体提交/截图**与当前版本，排除旧分支意图与需求变更；最小独立分支/PR，测试后再提议上线。**本交接仅文档，无代码修改、未部署。**
5. 未经用户明确发布授权不操作 Railway `accept_deploy`、重部署/回滚，不改任何持久卷/全局状态；不把机器子场景覆盖当成 39/39 正式验收。

**历史档案链接**：[Eidos 旧链收尾](https://github.com/jiangxng/eidos/blob/main/docs/architecture/DIAGRAM-V1-STACK-RETIREMENT-OUTCOME-20261012.md)；[Platform 本轮 §14 进度](./DIAGRAM-V1-CURRENT-CONVERGENCE-STATUS-20261012.md)；[前序已读官方资料索引](./DIAGRAM-V1-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)。

**信息冻结时间**：2026-10-12，香港时间；SHA、Railway 部署状态与 HTTP 日志均可能迅速变化。具体索引见后续两文档。
