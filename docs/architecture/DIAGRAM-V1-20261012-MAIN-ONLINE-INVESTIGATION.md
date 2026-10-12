# EVO 2D Designer｜GitHub main 与 Railway 线上功能疑似覆盖：只读诊断快照（2026-10-12）

> **性质**：在用户反馈「很多功能被覆盖」之后完成的 **只读** 平台、源码、服务/HTTP 日志核查；目前**尚未复现任何用户指定的真实 UI 缺失**。不是故障最终根因结论、不是修复 PR、不是发布许可。新窗口入口见[本窗简短交接](./DIAGRAM-V1-20261012-WINDOW-CONTINUATION.md)，证据出处见[详细资料索引](./DIAGRAM-V1-20261012-REFERENCE-INDEX.md)。

## A. 快照与环境：不要误认当前在线版本就是 main

**读取时间**：2026-10-12 香港时间上午（UTC+8），GitHub/Railway 读操作；均有原始可重查 API、源文件或 CI 页面。新窗口必须按新时间重新读取。

| 层 | 直接读得的快照 | 含义／限制 |
| --- | --- | --- |
| Platform GitHub main | `33ecccdaa27a96f8d6fa0e3e146b589dd71adfa8`，提交 [#787 BEX-00 supplier/import](https://github.com/jiangxng/EVO-App-Platform/commit/33ecccdaa27a96f8d6fa0e3e146b589dd71adfa8)，2026-10-12 00:59:27Z | 其他窗口持续合并；这不是永久的最新 main |
| Eidos GitHub main | `f412f1d03e684a3f3463d10eac51d6cc79032eff`，[#177 Agent chat reconcile](https://github.com/jiangxng/eidos/commit/f412f1d03e684a3f3463d10eac51d6cc79032eff) | 不要把当前 Eidos HEAD 与 Platform **2D 专属组件 pin** 混为一谈 |
| Railway 项目 | `EVO Ledger Runtime MVP`，project `aee4643e-912b-4ca1-ae95-fe4ec64f5601`，production env `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3` | 该项目虽叫 Ledger Runtime，实际含 Platform 站点的 `Ledger Configurator` 服务；另一个 Preview 项目读取报 `Project not found`，不可认作生产 |
| Railway 线上服务 | `Ledger Configurator`，service `a8622238-480e-4da3-be6f-60fd0f3e18db`，域名 [ledger-configurator-production.up.railway.app](https://ledger-configurator-production.up.railway.app) | GitHub source repo Platform，source branch `main` |
| 生产有效部署 | `a6554bd8-8a24-4c13-9b40-e93c32f62a62`，commit `ccb5820b99d854e1e78f6c35bfb77e01e7d084f1`，2026-10-11 23:59:56Z 创建，状态 `SUCCESS` | 生产仍比被读取时的 main 旧；线上服务 `online`、1/1 running、healthcheck 成功；**不等于 UI 无故障** |

**GitHub Compare `ccb5820b...main@33eccc...` 的具体结果（原始 GitHub REST + 插件 Compare）：** `ahead=39, behind=0, status=ahead, files=19`。差异集中于 External Agent、BEX 供应商/导入、工作流、文档及少量 `manager/server.ts`。具体 19 文件：
`.github/workflows/agent-external-merged-ref-retirement-20261012.yml`；
`.github/workflows/agent-pa02a-postgres-durability.yml`；
`.github/workflows/bex00-merged-plan-branch-retirement.yml`；
`apps/counterparty/import-target.ts`；
`apps/counterparty/page.ts`；
`apps/data-import/constants.ts`；
`apps/data-import/page.ts`；
`apps/external-agent-access/package.ts`；
`contracts/foundation-object/import.ts`；
`docs/agent-line/AGENT-EXTERNAL-BRANCH-CONVERGENCE-20261012.md`；
`docs/plans/foundation-list-experience/BEX-00-AUDIT-20261012.md`；
`docs/plans/foundation-list-experience/BUSINESS-EXPERIENCE-FRAMEWORK.md`；
`docs/plans/foundation-list-experience/PLAN.md`；
`docs/plans/foundation-list-experience/README.md`；
`docs/plans/foundation-list-experience/REFERENCES.md`；
`docs/roadmap/BACKLOG.md`；
`manager/server.ts`；
`repository-hygiene/bex00-merged-plan-retirement-20261012.json`；
`tests/protocol/bex01-supplier-import-journey.test.mjs`。

**[判断]** 这个差异**没有直接替换 `apps/eog-2d-designer`、`apps/eog-2d-viewer` 或 `vendor/eidos/src/diagram`**，因此“仅因为线上没追平 main，就造成 2D 大面积功能丢失”没有直接源码证据。但 `manager/server.ts` 和会话/上下文运行数据始终可能影响功能有效性，**不能把「没有图形文件 diff」写成「线上已无任何功能回退」**。

## B. 对照三个时期的关键源文件 Blob SHA（GitHub 原文读取，非臆测）

冻结列：2D 较早收敛 main `34f332ba96feaa9d19a6fd8615fb2e5de9b98e8d`；当前生产 `ccb5820b...`；2026-10-12 快照 main `33eccc...`。

| 文件 | 早期 2D closeout | 生产 | 快照 main | 判断 |
| --- | --- | --- | --- | --- |
| `apps/eog-2d-designer/definition-projection-editor.ts` | `43bbd754` | `43bbd754` | `43bbd754` | **三者完全同一 Git blob** |
| `apps/eog-2d-viewer/definition-preview.ts` | `fd126efc` | `fd126efc` | `fd126efc` | **三者完全同一 Git blob** |
| `vendor/eidos/src/diagram/surface.ts` | `bd38eb20` | `bd38eb20` | `bd38eb20` | **三者完全同一 Git blob**；画布核心并未被后续整体覆盖 |
| `vendor/eidos/src/app-host/browser-shell.ts` | `18bc832c` | `18bc832c` | `18bc832c` | hash 路由壳三者一致 |
| `apps/eog-2d/package.ts` | `8c1f3a41` | `caa82669` | `caa82669` | **不是相同 blob**；后续曾有插件标题多语言元数据调整；不能由 SHA 不同推断功能被删 |
| `vendor/eidos/source.manifest.json` | `e2e3146f` | `53a530ed` | `53a530ed` | pin 清单及后续非 2D 源数据更新，**必须看 componentPins** |
| `manager/plugin-store-page.ts` | `2a598371` | `a0f96d35` | `a0f96d35` | 商店后续有本地化/列表变更；对具体异常须看功能 diff |

上述 Git blob 是文件内容 SHA 前 8 位，不是 Git commit SHA；完整值由对应 `git blob`/文件接口查得。证据来自 [Platform 仓库](https://github.com/jiangxng/EVO-App-Platform)、上述精确 commit 的 `blob` 内容；不需要信任删除掉的旧分支名称。

## C. 实际运行时注册/显示门槛

- **[代码事实]** [apps/eog-2d/package.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/eog-2d/package.ts) 的 `evo-eog-2d` 包同时声明：Viewer `evo-eog-2d.viewer`、Designer `evo-eog-2d.designer`，两者都 `defaultActivation: true`；Designer 依赖 Viewer 与 `authorization.check`。
- **[代码事实]** Viewer 默认 route `/operating-graph/view`；Designer `/operating-graph`；定义预览/编辑 route 另由 contracts 声明。**注释明确**：这两个体验从 owning business flows / Agent / deep link 等上下文唤起，**不是 persistent Workbench navigation**。用户从常驻左侧导航找不到它们，不能直接认定包消失。
- **[代码事实]** 生产 [manager/server.ts 2451–2465](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/manager/server.ts#L2451-L2465) 的启动迁移仅在**包已安装且 Viewer active、Designer not active**时尝试 `manager.enable`；并不是无条件 install。真实 `installedPackages` / `activeFeatures` 状态必须读受权 `/v1/platform/snapshot`；仅凭 manifest 的 defaultActivation 无法得知。
- **[代码事实]** `/v1/experience-pages` 对不生效页面返回 `PAGE_NOT_EFFECTIVE_OR_NOT_FOUND`；Viewer 的具体读操作还依赖企业上下文与 Projection 选择；`canEditProjection && projectionId` 时才显示 Viewer “编辑投影”。两因素都可能令操作不可见。
- **[代码事实]** [Eidos App Host browser-shell.ts 55–77](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/app-host/browser-shell.ts#L55-L77) 的 `currentPath` 从 `window.location.hash` 获得 path；适合的手动访问形式是 `https://ledger-configurator-production.up.railway.app/#/store`、`/#/operating-graph`，**不是**服务端 `GET /store` 或 `GET /operating-graph`。
- **[代码事实]** 会话 Shell 由网站主页 `/` 提供，未认证时会重定向登录；插件装载与业务上下文通常登录后才有意义。不可绕过授权来读取生产租户信息。

## D. Railway 原始日志摘要（均 R，非真实浏览器人工复现）

**Railway OAuth 数据边界**：可以只读列出 service、environment、deploy、health、HTTP status、变量**名称**；工具 `list_variables` 返回 `valuesRedacted=true`，未获得任何授权策略正文、会话、密钥、`APP_PLATFORM_STAGE_MODE` 的值。因此**不能声称知道 Stage 模式实际开启或关闭**。记录到的部分变量名包括 `APP_PLATFORM_STATE_FILE`、`APP_PLATFORM_STAGE_MODE`、`APP_PLATFORM_TR01B_STAGE_DEMO`、`EVO_BI_WORKBENCH_AUTOINSTALL`、`APP_PLATFORM_MANAGED_SESSION_ENABLED`；只用于提示排查方向，不得猜值。

**Railway `get_logs` HTTP 流采样（200–201 条日志，非全时段覆盖）：**

| 发生时刻 UTC | HTTP / 服务器事实 | 解释边界 |
| --- | --- | --- |
| 2026-10-12 00:23:53Z | `GET /store → 404` | 与 Host hash route 对应；**可能是错误地直接访问服务器端路径**，而非 Store 功能被删 |
| 2026-10-12 00:24:08Z | `GET /assets/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/catalog-detail/render.js → 200`，`catalog-browser/render.js → 200` | 至少有按**线上 commit** 版本化的 Eidos 静态资源正常送达；不能证明所有 2D 页面运行 |
| 2026-10-11 14:28:04Z | `GET /v1/experience-pages → 403` | **旧时间点**，缺少身份/权限上下文；不能由单条 HTTP 403 推断最新生产版本授权系统故障 |
| 2026-10-11 14:53–14:54Z、2026-10-12 00:23–00:24Z | `GET /login → 200`；`GET /auth/login → 302` | 登录页面与入口至少有 HTTP 响应；不代表用户所有身份均有效 |
| 历史 deploy 流与 2026-10-12 00:00:41Z | 旧 Node `npm error signal SIGTERM` 出现在容器切换/停止附近，同时新版本记录 `EVO App Manager listening on http://localhost:8080`，production healthcheck SUCCESS | **更符合旧容器正常终止的一个可能解释 [判断]**；不能单独当作当前功能消失或持续 crash 根因 |

**采样状态总览**：采样中 200 占多数（约 186），另有 302/303/304、单条 403 和 404；采样混合不同部署与时间，**不应把这一比例当作完整生产可靠性报告**。Railway 查询未检测到当前 service 崩溃（1/1 running，recentFailures=0），但并没有用户级 UI 端到端结果。

**截图/附件**：本窗**没有实际浏览器屏幕截图**，也未将 HTTP 日志导出图片/文件。唯一可追溯的是 Railway Deployment ID、服务配置读取、GitHub 文件 URL 与 Actions run 链接。任何未来截图应按用户授权产生，标记真实时间、会话/版本，适当遮蔽企业数据，归档到对应 PR 并记录附件位置。

## E. vendor Eidos 不可盲目同步（高风险）

`vendor/eidos/source.manifest.json` 的层级关系：

- `sourceCommit:22b487ffc3ddc12b819c9601d6f06c34326fb454` 是**顶层广义 Eidos runtime snapshot**；
- `componentPins[eidos.2d-core].sourceCommit:79e124d32fa5435a645968617d3147358518cb4f` 是更新的**独立图形组件** pin，声明**15/16 文件匹配 upstream**；
- `src/diagram/surface.ts` 的 Host overlay 记录上游 blob `5d98d767e702102fcd1ee7ac136bd318f75a18a3`、Platform vendored blob `bd38eb20c75d526c3e0ec90f1e6d3e5933506c09`，差异来自投影上下文、指针行为/样式和特定 v1.0 回归修补；
- 与 [上游对应文件](https://github.com/jiangxng/eidos/blob/79e124d32fa5435a645968617d3147358518cb4f/src/diagram/surface.ts) 的名称对账中，**没有证明某个核心渲染函数被意外删除**。Platform 文件另有 Host `validContextNavigationV010`，上游直接包含 ContextNavigation 类型与渲染逻辑。**差异是事实，是否体验退化需真实页面复现。**

**下一窗口严禁直接将 `jiangxng/eidos` 最新 main 的整个 `src/diagram` 覆盖到 Platform `vendor/eidos`**。需要做具体版本间审计、主线所有权确认及回归测试。

## F. 合理诊断次序及是否修复的门槛

| 假设 | 现有证据 | 如何证伪/补证，优先处理 |
| --- | --- | --- |
| HYP-1：只是 URL 写错或菜单入口从常驻改为上下文 | hash route 原码、真实 HTTP `/store:404`；Designer/Viewer 包明确不常驻侧栏 | P0：在受权已登录浏览器上试 `/#/store`、`/#/operating-graph` 与账本定义/版本/投影视图入口；记录截图与 DevTools |
| HYP-2：插件安装/启用状态或企业上下文不同 | `defaultActivation` 不是无条件安装；服务需要 active feature/企业 context/role | P0：对有权限用户读 `/v1/platform/snapshot`、有效体验和页面 source，记录 package 与 feature ID，遮蔽身份 |
| HYP-3：main 功能已合入，但生产没更新 | commit 相差 39 commits/19 文件，包含近期 BEX/External Agent，无直接 2D 代码 diff | P1：列出用户声称消失的准确 feature，确认它是在 `ccb...` 之后才合 main；若是，才考虑部署升级并做风险对账 |
| HYP-4：曾经在旧分支看到独有 UI，但本次未保留到运行时 | Platform 12 旧分支对账文档确实注明 Gallery 管理动作、Viewer 旧返回方式等未整体复制 | P1：对照用户**已验收**旧截图/提交；如属必须功能，重新评审符合当前“投影不生业务版本”的新实现 |
| HYP-5：Eidos Overlay 行为存在特定回退 | `surface.ts` 长期未变，upstream 与 Host overlay 是有意分叉 | P1/P2：在精确相同的真实业务图、浏览器、账户与输入设备复现，再定位具体行为与版本，不盲目重写画布 |
| HYP-6：性能/多实例造成假性功能消失 | P01 压力数据有轻微回退；P02 fixture 隔离非企业 CAS；0/39 formal signoff | P2：先有用户重现后查实际图数据规模、浏览器 console、保存冲突；不得用机器自动化替代实机 |

**修复 / 发布授权边界**：当前用户请求是**调查“main + 线上”与交接**；本窗口做完所有工作依然仅只读生产。没有修改 Railway 环境变量、数据库卷、部署状态；没有修复或正式验证缺失功能。新的实现须在独立 2D scoped PR 中、以当前 main 为基础，跑现有集成/浏览器验收，并由明确授权的项目主线发布窗口执行上线。

## G. 具体链接、数据复原路径

- GitHub Git tree、对比：`https://github.com/jiangxng/EVO-App-Platform/compare/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1...33ecccdaa27a96f8d6fa0e3e146b589dd71adfa8`（后续以新 main 重新对账）。
- Railway Dashboard: `https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601/service/a8622238-480e-4da3-be6f-60fd0f3e18db?environmentId=98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`；对应 production deployment `a6554bd8-8a24-4c13-9b40-e93c32f62a62`。
- 旧阶段 2D 清理 [Platform #780](https://github.com/jiangxng/EVO-App-Platform/pull/780)，[Eidos #174](https://github.com/jiangxng/eidos/pull/174)；前序验收矩阵与研究索引均在 `docs/architecture`，入口见[总索引](./DIAGRAM-V1-20261012-REFERENCE-INDEX.md)。
- 企业软件管理/投影 Gallery 源码：[software-page.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/enterprise-context-governance/software-page.ts#L214-L319)；Viewer [definition-preview.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/eog-2d-viewer/definition-preview.ts#L115-L178)。

**最后提醒**：2026-10-12 main 是动态的；本页 SHA 作为“当时观测事实”保留，不可以因为新窗口看到了另一 SHA 就改写本次真实观测记录。


---

## H. 新窗口追加：main／Railway／2D 业务入口第二轮对账（2026-10-12，UTC+8）

> **来源级别 R（本轮直接读取）**：GitHub branch、GitHub Compare REST（包括 \`manager/server.ts\` patch）、GitHub 原始源文件、Railway \`describe_environment\` / \`describe_service\` / \`list_deployments\` / \`get_logs\`。**限制 U**：仍未进入用户有权限的生产浏览器；无法读取真实租户的 \`installedPackages\`、\`activeFeatures\`、投影数据、会话/角色或 UI 截图。故本文是**第二轮只读证据更新**，不是线上根因已复现或验收已通过。

### H1. 重新读取的版本及生产事实

| 层次 | 本轮直接读取结果 | 结论 |
| --- | --- | --- |
| [Platform main](https://github.com/jiangxng/EVO-App-Platform/commit/ad85f8501930b6e3bf7e67211e6dbf3942a27327) | \`ad85f8501930b6e3bf7e67211e6dbf3942a27327\`，[#788](https://github.com/jiangxng/EVO-App-Platform/pull/788) 交接仅 3 个文档文件，已合 main | 前窗 \`33eccc...\` 是先前快照，不可冒充最新 |
| [Eidos main](https://github.com/jiangxng/eidos/commit/f412f1d03e684a3f3463d10eac51d6cc79032eff) | \`f412f1d03e684a3f3463d10eac51d6cc79032eff\` | 与前窗一致，不能误当 Platform diagram 独立 pin |
| Railway \`Ledger Configurator\` | production \`a6554bd8-8a24-4c13-9b40-e93c32f62a62\`，\`SUCCESS\`，部署提交 \`ccb5820b99d854e1e78f6c35bfb77e01e7d084f1\`，2026-10-11 23:59:56Z | 本轮读数中未出现新的该服务部署；来源是 Platform/main，但**生产未追至当前 main** |
| Railway 配置与存储 | 服务 \`live\`；1 replica；\`ledger-configurator-state\` 挂载 \`/data\`；本环境无 staged patch；服务变量仅见名称，不读取值 | 卷仍挂载，不等于应用状态正确，更不能断言数据未变或插件已经启用 |
| [从生产到 main 的 Compare](https://github.com/jiangxng/EVO-App-Platform/compare/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1...ad85f8501930b6e3bf7e67211e6dbf3942a27327) | \`ahead=40\`、\`behind=0\`、\`22\` 文件变更 | 没有 \`apps/eog-2d*\`、\`apps/eog-2d-viewer\`、\`vendor/eidos/src/diagram\` 变更；源代码没有被这 40 个新提交整体覆盖 |

**更精确的 server 差异**：本轮直接读取 GitHub Compare 的 \`manager/server.ts\` patch，所有更改均位于 Data Import / Counterparty Supplier 的 import 入口、上传 intent 与 review 页面参数，**未触及此文件的 2D 页面分支**。因此针对“最新合并直接删掉 2D 路由”的假设，已有明确负证据；这**不能**排除持久层、权限或业务上下文导致的运行态差异。

### H2. 逐层分类，禁止把代码存在升级成线上可用

| 层／用户感受到的缺失 | 直接证据 | 当前分类／尚缺证明 |
| --- | --- | --- |
| EOG 2D 运行时代码 | 生产提交 [\`apps/eog-2d/package.ts\`](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/eog-2d/package.ts) 仍注册 \`evo-eog-2d.viewer\`、\`evo-eog-2d.designer\`；两者 \`defaultActivation: true\` | **代码仍在**。默认激活仅针对安装，不证明生产已安装 |
| 真实插件安装/开启 | Manager \`getSnapshot().installedPackages / activeFeatures\` 决定生效性；启动迁移只覆盖“已安装且 Viewer active，但 Designer inactive” | **未核实**。须在已授权会话读取 \`/v1/platform/snapshot\`；不以变量名或日志猜测 |
| 商店及侧栏 | Store 声明 \`/store\` 为 Host 路由；2D 注释明确不贡献永久 Workbench 菜单。真实服务 \`GET /store\` 曾为 404 | **入口模型不同**。浏览器使用主页 \`/#/store\`；侧栏缺席不等于删插件 |
| 业务入口 | [\`apps/ledger-manager/page.ts\`](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/ledger-manager/page.ts#L288-L348) 账本定义详情 Gallery 的 \`preview\` 行为指向带定义 ID、revision、投影 ID 的 \`/definition-preview/2d?... \`。[\`manager/server.ts\`](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/manager/server.ts#L7710-L7967) 仍有编辑/预览路由与 \`投影视图\` 上下文返回 | **代码仍在**，应从账本定义／版本／投影视图业务入口验证；不应把参数化路由当无条件公开工作台入口 |
| 页面门槛与错误码 | 2D feature inactive → \`PAGE_NOT_EFFECTIVE_OR_NOT_FOUND\` (404)；Enterprise context 不符 → \`DEFINITION_PROJECTION_ENTERPRISE_CONTEXT_REQUIRED\` (409)；未有已保存投影/selection → \`DEFINITION_PROJECTION_SELECTION_REQUIRED\` (409) | **条件不可用** 的明确代码机制，尚未观测到当前用户实际触发哪一项 |
| Viewer 的“编辑投影” | [\`definition-preview.ts\`](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/eog-2d-viewer/definition-preview.ts#L115-L178) 仅在 \`canEditProjection && projectionId\` 时创建该 toolbar action | **按钮条件性隐藏**。服务只将 Designer feature active 状态作为此处的 \`canEditProjection\` 值；操作执行的实际授权仍须单独核验 |
| 旧独有管理/导航 | [12 旧 ref 对账](./DIAGRAM-V1-12-LEGACY-HEADS-RECONCILIATION-20261012.md) 记录历史软件 Gallery \`ADD/EDIT/REMOVE/SET_PRIMARY_PROJECTION\`、旧 Eidos \`secondaryActions\` 提议及 Viewer \`returnAction\` 原实现未完整移植；旧 #388 revision-save 不予复活 | **只存在历史版本或方案不等价**。是否是用户此前实际使用的功能，需旧截图/精确 commit；不可借“恢复”重写当前业务版本策略 |
| Diagram 核心与 Eidos | 生产 \`vendor/eidos/source.manifest.json\` 独立 pin \`eidos.2d-core=79e124...\`，\`surface.ts\` 是受保护 Host overlay；与上游 main 不一致有预期 | **代码仍在**，未经具体失败复现不得 bulk-sync 上游 |

**重要的路由取证细化**：前文引用的 \`vendor/eidos/src/app-host/browser-shell.ts\` 有基于 hash 的代码，但生产实际入口是 [\`manager/app-host-client.ts\`](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/manager/app-host-client.ts)，它为 desktop 装载 \`desktop-workbench-runtime\`。生产 vendored [\`workbench/surface-routing.ts\`](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/workbench/surface-routing.ts) 会在 route matching 前去掉 \`?\` 后查询字符串，而 [\`app-host/host.ts\`](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/app-host/host.ts#L673-L705) 保留原 route 传给 source。因此**不能只凭另一 Browser Shell 的精确路径比较便认定生产参数化投影路由损坏**。真正的 UI 跳转仍需要登录浏览器复现。

### H3. 新发现：投影数量边界可能使业务详情页整体失败（代码条件成立，线上是否触发 U）

- [\`apps/ledger-manager/page.ts\` 约 298–347 行](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/ledger-manager/page.ts#L298-L348) 按 \`projectionGallery?.projections ?? []\` 建构 \`catalog-detail.gallery.items\`，并给定 \`maxItems: 9\`；[软件定义详情](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/enterprise-context-governance/software-page.ts#L214-L270) 也如此。
- [Eidos \`catalog-detail/render.ts\` 约 93–115 行](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/catalog-detail/render.ts#L93-L115) 的 \`assertCatalogDetailV010\` 在 \`gallery.items.length < 1\` 时抛 \`EIDOS_CATALOG_DETAIL_INVALID\`，而 \`items.length > maxItems\` 时抛 \`EIDOS_CATALOG_DETAIL_GALLERY_LIMIT_INVALID\`。
- **静态推论（可从两个函数直接演绎）**：零个投影或多于九个投影时，调用该 Eidos 渲染器的详情页存在确定性校验失败路径；这可能造成“列表存在但详情页打不开”的体验。**不能声称生产已有该类数据，不能声称这解释了用户反馈的全部消失项**。
- **所有权**：问题横跨 Eidos 通用 Catalog Detail、Ledger Manager/Enterprise Software；本 2D 窗口只记录条件与可复现测试需求，不得直接修改其他窗口的业务页或泛化为“2D 引擎坏了”。待业务页所有者确认现网有对应数据，再安排所属模块最小修复。

### H4. Railway 进一步日志取样和明确限制

本轮再次只读取 HTTP 流最多 500 条及当前生产部署的启动日志；返回样本约 501 条，混杂 2026-10-11 与 2026-10-12 多版静态资源请求。按 \`path + HTTP 状态\` 聚合有 \`GET /v1/experience-pages: 200\` 59 次、\`GET /v1/experiences/effective: 200\` 13 次与 304 九次、\`GET /v1/experience-pages: 403\` 一次、\`GET /store: 404\` 一次；历史请求曾加载 \`vendor/eidos/src/diagram/surface.js\` 返回 200。**这些是 HTTP 流计数，不包含请求的 page source、响应体、cookie 或是否最终绘制成功；也不是完整运行指标。**

生产部署启动记录表明服务监听端口成功，出现 \`Migrated 1 legacy EOG SOP definition(s) into Enterprise Context.\`。该行**只是迁移曾执行的记录**，没有显示源记录细节、当前投影内容或 UI 完整性；不得将它直接指认为数据遗失或回退的根因。

本轮对生产地址的未登录直读尝试未得到可核查的 HTTP 业务响应（外部网页工具不可访问；容器 DNS 解析失败）；不能把诊断工具的网络故障写成 Railway 宕机。Railway 控制面仍显示生产 deployment SUCCESS。没有取得有权限的真实浏览器读数或保存任何用户 token/cookie。

### H5. 当前判断与下一次只读核验的精确顺序

1. 先用**真实登录浏览器**从 \`/#/store\` 读取 \`evo-eog-2d\` 安装/启用状态；检查 \`evo-eog-2d.viewer\` 与 \`evo-eog-2d.designer\` 是否同时有效，保留文字化结果。
2. 同一账户/同一 Enterprise Context，从 \`/#/ledger-manager\`（若该路由确为当前有效入口）进入具体账本定义版本 → Gallery 投影视图 → Viewer → 编辑按钮。保留各步 path、HTTP 状态及 404/409 业务错误码；对用户可见内容做去标识化。参数化 URL 应由页面操作生成，不能手工伪造 definition/projection ID。
3. 若详情页无法打开，**只读**核对该定义当前投影项数（0、1–9、10+），及客户端是否报 Eidos Catalog Detail 校验错误；不要修改数据或立即扩展 2D 范围。
4. 对旧独有 UI 逐项核用户实际使用过的历史提交/截图；本次历史归档并没有“原样恢复全部按钮”，不能自行翻案旧版 revision-save 原则。
5. 将用户真正在生产复现的缺失项按 \`代码缺失 / 无入口 / inactive / context 或 permission / 仅历史分支 / 其他代码缺陷\` 分类；仅确认可归属的当前 2D 真缺陷后，以**最新 main** 单一独立分支做最小修复并回归测试。账本管理或通用 Eidos 组件由其所属负责人处理。

**未改变的结论**：§13/§14 权威不变；39/39 仅代表机器子场景证据，正式人工/真实设备仍为 0/39。本轮**未改程序、未部署、未回滚、未写生产数据，也未证明真实用户端的最终根因**。


### H6. 用户确认的当前正常界面基线（2026-10-12，聊天截图；证据级别 U-SCREENSHOT）

**证据来源及强度**：用户在接续诊断的当前聊天中上传截图 `image(20261012-024510).png`，明确说明「**目前这个样子是正常的**」。此项是**用户对当前可见状态的正向确认**，不是工具在 Railway 生产环境执行的端到端测试。截图只存在于本次聊天附件中，**没有作为 GitHub 仓库文件归档**；截图没有浏览器地址栏与 commit SHA，无法据此精确确认服务部署及账号的后台安装记录。后续新窗口需要原图时应由用户重新提供，不得编造 GitHub 附件 URL。

**截图可直接观察到的正常内容**：

- 顶部业务上下文及面包屑：`账本管理 → EVO 账本运行时基线 → 投影视图 → 编辑投影`；标题 `编辑投影 · 从销售到收款`。这是 **S2C 投影编辑页面**，并非泛用 `/operating-graph` 空白页。
- 主工具栏已呈现 `Select / Hand / Mouse / Grid / Grid snap / Align / Undo / Redo / 自动排版 / 保存投影 / 更多`。
- 画布已绘制节点、连线及网格，右下角有缩放控制，显示 `69%`；右侧已呈现选中的 `posting-rule`（Rule ID 108，开票 → 应收账款）的属性及连接路径 / 两端 attachment 选择器、`从投影移除`。
- 画布中有较淡的其他节点和连接；**用户确认当前外观正常，因此不能因浅色视觉状态就推断功能缺失、布局错误或隐藏状态丢失**。

**据此更新对账分类**：

| 功能假设 | 此用户截图新增证据 | 当前判定及仍未核验部分 |
| --- | --- | --- |
| S2C 投影编辑页面无法打开 / 路由全丢 | 已经到达有业务面包屑、画布、检查器的页面 | **该用户会话中的 S2C 编辑界面可显示；“此页面全丢”不成立。** 不能从无地址栏截图外推至所有环境、企业或账号 |
| 工具栏 / 样式 Inspector 被覆盖 | Select / Hand、Undo / Redo、自动排版、保存投影、连线样式面板均肉眼可见 | **入口和控件存在**；点击行为、权限、手势、撤销、CAS 保存与刷新往返尚未被此图验收 |
| 画面较淡的节点是回归缺陷 | 用户明确表示目前的外观正常 | **不登记为缺陷，不更改配色或强制恢复可见状态** |
| 插件已装且双 Feature 全部 active | 截图可见一个可用的投影编辑业务页面 | **强支持该会话存在可渲染的编辑体验**，但缺少后台有效状态响应，不得填写 `installedPackages` / `activeFeatures` 的实际值 |
| “很多功能被覆盖”的剩余范围 | 当前正常页面已经排除若干可能的 UI 丢失项 | 只对用户另行指出的**具体缺失操作/页面/历史版本差异**继续举证；不把当前截图当所有 §14 case 的人工签收 |

**下一步**：保留此截图为正常视觉与业务入口基线；先询问或等待用户指出该正常页面之外的缺失项（如投影管理操作、业务定义列表入口、Viewer 返回流程、插件商店）。针对明确缺失项再进行与已合并 main / 生产版本 / 历史分支的定点对比；未获真实缺陷证据前不改程序。§14 状态仍为机器子场景 39/39、正式人工/真实设备 0/39。
