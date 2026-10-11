# TR-01B2D3｜主线窗口恢复核验增量（2026-10-11）

> **非权威状态快照；只读恢复。** 本文不替代 `project.status.json`、`docs/roadmap/HANDOFF-LATEST.md` 或产品验收。与 [旧 TR01 交接](TR01-RESEARCH-HANDOFF-ENTRY-20261010.md)、[旧来源索引](TR01-RESEARCH-SOURCE-INDEX-20261010.md)、[旧决策](TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md) 及 [B2D3 最新研究交接](TR01B2D3-WINDOW-RESEARCH-HANDOFF-ENTRY-20261011.md)、[来源索引](TR01B2D3-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)、[决策缺口](TR01B2D3-WINDOW-RESEARCH-DECISIONS-GAPS-20261011.md) 串联阅读。后一组三文件已在 **main**，但未在本轮财务父功能分支上发现；不要用路径不存在推断研究丢失。

## 用户已确认（聊天要求；与实现/验收分开）

- 业务采用**四个独立可安装、启用、停用**的 EVO Application 插件：Sales `evo-trading-stage-sales`、Shipment `evo-trading-stage-shipment`、Receivable `evo-trading-stage-receivable`、Cash `evo-trading-stage-cash`。使用正式 App Platform Store → Host 生命周期 → eidos Experience；不另造网页、CSS、服务或单体销售到收款插件。
- 只读阶段展示 `DEMO-SO-1001` / `DEMO-SHIP-1001` / `DEMO-AR-1001` / `DEMO-REC-1001`；合成数据必须明显标明 `SYNTHETIC / READ-ONLY / NOT_CERTIFIED`。
- 长期生产业务写入必须按领域插件分清语义与可发布边界；现阶段 `SalesReferenceServiceV010` 仍是参考实现，**并未**拆成四个生产写入 Owner。
- App Platform 只做 Host/上下文/生命周期/授权；Eidos 渲染 UI；EVO 最小 Ledger 持有不可变事实、确定性账本与回放；估值/成本/核销走正式 Owner，不把财务能力塞入 Host 或 Agent。
- 当前本窗口属于 TR-01 主线，不修改 Agent、2D、Eidos 专项；不直接推 main，不改权威 status 或生成 handoff，无独立真实环境/身份/凭据审批不得宣称生产可用。

## 当前 GitHub 核对（UTC 2026-10-11；按事实等级）

| 对象 | GitHub 证据 | 分类 / 明确限制 |
| --- | --- | --- |
| 四插件 PR [#694](https://github.com/jiangxng/EVO-App-Platform/pull/694) | 已于 2026-10-11T00:40:07Z **merged** 到 `feat/tr01b2d3-host-owner-delegation-20261010`；merge commit [e84b1150](https://github.com/jiangxng/EVO-App-Platform/commit/e84b1150b3fb81fac35faa736221c702cdde5bae)，共 10 文件（四个 package、通用 preview adapter、catalog/manager、测试、workflow、文档） | **代码已实现/父功能分支已合并**；绝非 `main` 合并或线上部署 |
| 四插件具体契约 | [阶段演示交接](TR01B2D3-FOUR-PEER-PLUGIN-STAGE-DEMO-20261011.md)，`apps/trading-stage-*/package.ts`，`tests/protocol/tr01b2d3-four-peer-stage-plugins.test.mjs` | **代码/测试覆盖**：独立 Package、read-only Capability、路由、Eidos catalog-browser 资源、关停失效、独立演示引用、双环境开关。生产写入**未拆分** |
| 阶段专用 [GitHub Action #38099212715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38099212715) | 财务父分支 head `e84b1150`；workflow `TR01B Four Peer Plugins Eidos Stage` status completed / conclusion success | **CI 验证通过**；不等于实际人类浏览器/真实 Railway 安装验收。 |
| 同一 head 的 [平台 CI #38099212719](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38099212719)、[跨项目销售事实 #38099212882](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38099212882)、[12-lane #38099212873](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38099212873) | 均 completed / success；同一 head GitHub runs 查询返回 42 条，列出的 42 条均 success | **CI 通过**（截至本次查询）；不为生产身份/TLS、金融写入或部署背书 |
| 父功能 [Draft PR #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) | open/draft，head `e84b1150`，base `main` | B2D3 仍为生产前可信委托未完成门槛；B2D4/B2E 未准入 |
| [main](https://github.com/jiangxng/EVO-App-Platform) | 检索到较新的 2D Designer 独立变更 `c4eb4df`，及已并入的研究三文件 | 切勿将 main 上 2D 改动视为本财务分支拥有；恢复资料时以两个分支的**交集/差集**明确查证 |
| 预览部署 | [阶段文档](TR01B2D3-FOUR-PEER-PLUGIN-STAGE-DEMO-20261011.md) 记载 Railway Free 配额阻止独立 Preview Host，且不可改生产 URL | **未验证有可访问的阶段预览部署**；必须有真实 URL、部署 revision、手工/浏览器证据才可升级状态 |

## 旧研究资产：恢复范围与采用/排除理由

- **直接复用已保存的旧包及 2026-10-11 B2D3 三文档**。已保存的外部官方原文索引仅明确标注 PostgreSQL 18: [SELECT](https://www.postgresql.org/docs/18/sql-select.html)、[INSERT](https://www.postgresql.org/docs/18/sql-insert.html)、[CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) 当时为 **已打开原文**；本次恢复仅阅读了**仓库索引原文**，没有重新访问上述 PostgreSQL 网页，不冒充重新原文核验。它们分别用于 `FOR SHARE` 的 UPDATE 权限、`ON CONFLICT` 的列级 SELECT 和 `SECURITY DEFINER` 安全取舍。旧仓库 source index 及 CI run 链接为原始具体位置；不将摘要等同日志全文。
- **已采用**：安装式独立 Application + 原生 Eidos Experience；双显式环境门禁 `APP_PLATFORM_STAGE_MODE=isolated-preview` 与 `APP_PLATFORM_TR01B_STAGE_DEMO=enabled`，默认 fail-closed；真实财务 Host→EVO 走短时 Ed25519、数据库 nonce、独立 Owner 进程的隔离只读校验。**理由**：插件业务语义归属、复用 Host 身份/生命周期、保持 EVO 经济权威、阻止演示越权。
- **已放弃**：[#690](https://github.com/jiangxng/EVO-App-Platform/pull/690) 原始 HTML/Railway Function 伪演示、Host 单体业务实现、通过假的阶段样例宣称财务执行、把 CI 同机两进程冒充真实分布式。**理由**：违反产品插件架构与可验证的生产边界。
- **尚待证实**：生产 Google/OIDC、真实 TLS/私网 ingress/KMS/密钥托管、生产 DB grant/function owner、跨主机实例、四业务生产写入分包、独立 Railway Preview URL 及真实 Eidos 浏览器安装/开关/失效流程。前一窗口的本地 OIDC/TLS、同 DB 并发和隔离进程证据，不能提升为生产。
- 本轮没有拿到旧聊天全文的独立附件，也没有逐一重新打开旧窗口每一条 CI 日志。旧来源的访问深度以既有索引原记录为准，无法恢复的页面截图/外部凭据/个人验收结论标记 **UNKNOWN**，不得补造。

## 下一主线行动（按顺序）

1. 用 #694 的 10 文件和 `TR01B Four Peer Plugins Eidos Stage` workflow 复核版本及正反向覆盖；若出现新 CI 不兼容，开独立小 PR 修复，不能更改财务执行界线或 Eidos 公共设计规范。
2. 优先找到可行**隔离 Preview Host** 资源或复用现有环境中的真正独立 preview revision；演示须实测 `/store` 四次安装、独立 Page，禁用 SHIPMENT 仅其页面失效，再恢复；保存带 revision 的运行证明。不得覆盖正式 Railway 生产，也不得只凭 mock 页面声称通过。
3. 保持 #594 Draft / B2D3 OPEN；基于既有 2026-10-11 研究缺口进行生产配置负控和安全验收清单，待真实生产环境和 Human 权限完成后另行认证；B2D4 写入与 B2E Human/Agent 工作台单列。
4. 在下一次跨分支集成前核查 `main` 新 2D 变更与父功能分支的 merge base，谨慎处理冲突；遵循既有资料的来源等级，不再全量重复研究。

**文档边界**：此恢复文档位于独立 docs branch，未改生产代码、`project.status.json`、`HANDOFF-LATEST.md` 或其他窗口分支。