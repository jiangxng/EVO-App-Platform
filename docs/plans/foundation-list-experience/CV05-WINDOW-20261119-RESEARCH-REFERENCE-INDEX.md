# CV05 MVP #05/06 · 本窗口研究资料、原证与决策参考索引（2026-11-19）

> **RESEARCH_REFERENCE / PROVENANCE_LOCKED**。与[简短交接入口](CV05-WINDOW-20261119-RESEARCH-HANDOFF-ENTRY.md)配套；不覆盖[11-18 七轮工程最终交接](CV05-MVP-0506-20261118-WINDOW-0707-FINAL-HANDOFF.md)和[11-06 原始竞品研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。本文件严格区分**网页原文阅读、搜索摘录、先前研究索引转引、GitHub 原始仓库/CI 证据、未能查阅的管理控制面**。不声称保存任何未实际制作的网页截图或原文全文。

## 0. 检索日期、等级与证据使用边界

- 记录完成日：**2026-11-19**。本窗口 GitHub 工程读取/CI 核验集中于 **2026-11-18**；11-19 又独立核对受保护 `main@8038a03333bded27e309b9b00b940c10502f79c3`、[PR #1360](https://github.com/jiangxng/EVO-App-Platform/pull/1360) MERGED、[#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) OPEN。若新窗口读取时主线已变化，先重新获取 GitHub 当前 HEAD。
- **O（已读官方网页原文可见章节）**：本窗口实际打开官方页面并取得章节原文/对应段落；不是截图、未必是全站审计。
- **S（官方检索摘录/搜索结果）**：本窗口检索得到页面标题、URL、相关段落，但打开完整页面失败或未完成；不以其作为精确兼容/上线签收。
- **H（历史研究转引）**：本窗口读取了仓库此前已保存的研究索引；**没有在本窗口重访原厂网页**。原索引注明当时的核查日期与阅读层级，这不等于本窗口今日再读原文。
- **G（GitHub 原始代码/PR/Workflow/Actions）**：本窗口经已连接的 GitHub 读取具体仓库文件、合并状态、Actions job 或原始日志；其证据仅代表该 SHA 与该次 Run。
- **U（未验证）**：GitHub Environment 的实际设置/密钥存在性/配额、在线付费模型返回和真实 Human OIDC 签收均无直接原件；不得用代码或文档假设补足。

## 1. 本窗口直接查阅的官方网络资料（按来源逐项可重访）

| ID / 标题与原始 URL | 查阅日期 / 级别 / 定位 | 来源事实（不是 EVO 的实现声明） | 对 EVO 的具体用途及限制 |
| --- | --- | --- | --- |
| **GHD01 · [Managing environments for deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)** | 2026-11-19，**O**；§Creating an environment，步骤 3–11；§How environments relate to deployments | Job 指定 Environment 后需先满足其保护规则；`Selected branches and tags` 可限制部署分支；环境级 Secrets 仅在规则通过后供相关 Job 使用。**若工作流引用不存在的环境，GitHub 可能自动创建，普通情况下初始无保护规则/Secret**。公开仓库可用性及 reviewer 选项取决于计划和仓库类型。 | **最高优先外部权限原证**。为 `cv05-live-qa` 选择**仅 `main`**的 Environment branch policy，将专用 QA Key 仅放环境级。不能因为 YAML 声明了 `environment` 就假定管理员策略已存在；管理员仍须实际查看 Settings。 |
| **GHD02 · [Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)** | 2026-11-19，**O**；§Creating secrets for a repository / an environment / an organization；§Using secrets in a workflow | Secret 分仓库、环境、组织不同作用域；页面说明 Environment secret 的 Settings 路径、`gh secret set --env`、`gh secret list --env`；未设置的 Secret 表达式会得到空字符串。还提醒避免命令行暴露凭据。 | [#1357](https://github.com/jiangxng/EVO-App-Platform/pull/1357) 采用 `CV05_LIVE_QA_ENVIRONMENT_ONLY_API_KEY`，只应存在于 `cv05-live-qa`。**“名称含 ENVIRONMENT_ONLY”本身并非权限隔离**；必须核验没有 repo/org 级同名/旧名称的密钥。 |
| **GHD03 · [Manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)** | 2026-11-19，**O**；§Running a workflow，步骤 4–7；§CLI `--ref`；§REST `ref` | `workflow_dispatch` 的 UI 有 **Branch** 选择，CLI 可用 `--ref BRANCH`，REST 使用 `ref`；工作流需要存在于默认分支才能手动触发。 | 解释 #1356 的代码级 main/ref 守卫**不等于**受保护分支外无法读取 repo-scoped Secret。#1357 增加 Environment-only Secret + 控制面分支政策；必须先验证此策略再付费手动测试。 |
| **GHD04 · [Triggering a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)** | 2026-11-19，**O**；§Defining inputs for manually triggered workflows / §Using events to trigger workflows | 可设置 `workflow_dispatch` 输入；触发行为与 `GITHUB_TOKEN` 派生事件不同；各 event 的过滤条件有各自适用范围。 | 只允许手工受控的在线质量测试。没有证据支持“通过 PR 自动触发收费推理”是安全方案；本项目排除自动收费验收。 |
| **API01 · [OpenAI — Create a model response](https://developers.openai.com/api/reference/resources/responses/methods/create)** | 2026-11-19，**S**；官方搜索结果可见 `POST /v1/responses`、`model`、`input`、`tools`、`max_output_tokens`；**直接打开长页面失败（超出内容限制）** | 官方检索摘录说明 Responses API 能通过函数工具调用返回模型结果，字段包括模型 ID、输入、工具、输出 token 约束。无法从这些摘录推出本项目某个具体模型的生产可用性或收费额度。 | 对照 `providers/openai/runtime.ts` 的官方 endpoint、tool calling 和 Token 边界；[#1358](https://github.com/jiangxng/EVO-App-Platform/pull/1358) **仅使用合成 HTTP** 回放真实适配器。正式 L01–L05 前要重新核对当前模型及 API 响应兼容性。 |
| **API02 · [DeepSeek — Responses API](https://api-docs.deepseek.com/api/create-response/)** | 2026-11-19，**S**；官方搜索摘录可见 `POST /responses`、`function` tools、`model` 和返回的 `output`；页面原文打开超时/未完整获取 | 文档摘录说明以 Responses 结构发起调用、函数工具参数和模型列表；当前检索摘录列出 `deepseek-flash` / `deepseek-v4-pro`，**不是已验收的项目模型绑定，也不保证未来仍相同**。 | 对照 `providers/deepseek/runtime.ts`，特别是 `/responses` 路径、JSON 参数、实际可用模型；不可根据旧测试中使用的 `deepseek-chat` 或假模型值认定当前在线支持。 |
| **API03 · [DeepSeek — Using the Responses API](https://api-docs.deepseek.com/guides/responses_api/)** | 2026-11-19，**S**；官方搜索结果提供指南摘录；打开完整页面超时 | 摘录强调基础 URL `https://api.deepseek.com`、部分功能兼容而非完全等价、对话状态和工具能力有限制；`previous_response_id` 等字段不受支持，`parallel_tool_calls` 处理与 OpenAI 有差异。 | 采用现有两个独立 Provider Adapter 而非硬套单一“完全兼容”假设；在线首次验收要核实对话历史如何传入、模型是否一次请求多个工具以及本地 Agent 一次只执行一个工具的适配边界。 |

> 重要：`API01–API03` 在本轮属于**官方站点检索摘录**，不是完成了全文对照，也不代表真实 API 已调用。对 API 端点、模型名、定价及参数不采用“永久不变”承诺。直接打开失败本身已记录为证据缺口。

## 2. 历史外部竞品与规范：保留原网址，不虚构本窗口阅读

以下历史资料从已读取的 [2026-11-06 原始参考索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) / [2026-11-18 来源索引](CV05-MVP-0506-20261118-RESEARCH-EVIDENCE-INDEX.md) 转录标题、用途和版本范围。原索引记载 **2026-11-06** 曾核查正文/公开检索，**本窗口 2026-11-19 只读取项目内部索引，没有重新打开这些外站**，故每项均为 **H**。原研究版本的产品能力可能变化，不能用作当前某一功能上线的唯一依据。

| ID / 标题及原始 URL | 原历史查阅日 / 本窗口级别 / 主题 | 历史索引记载的关键发现（转述）及 EVO 采用边界 |
| --- | --- | --- |
| **EX01 · [SharePoint — Create, change or delete a view](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library)** | 2026-11-06 / **H**；列表视图 | 公共/个人视图、过滤、排序、显示列可与原列表分离；采用查询与可保存 View 分离，不把 Microsoft 365 的新特性直接归给 Server 2019，也不统一 EVO 业务事实表。 |
| **EX02 · [SharePoint 2019 software boundaries and limits](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019)** | 2026-11-06 / **H**；规模/阈值 | “单次查询阈值”与总体容量不同；启发服务端查询、分页、预算；**不移植其 5,000 items 为 EVO 硬限制**。 |
| **EX03 · [Odoo 19 View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html)** | 2026-11-06 / **H**；多视图 | 模型事实层与 List/Search/Kanban/Graph 等声明式呈现分层；采用理念，不复制 Odoo XML/Python 模型体系。 |
| **EX04 · [Power Apps grid control](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control)** | 2026-11-06 / **H**；Grid 密度与交互 | 同一受管字段用于 view/subgrid、分组等；本 MVP 不复制无限滚动、复杂可编辑 Grid 或高级内联编辑。 |
| **EX05 · [SAP Fiori List Report and Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html)** | 2026-11-06 / **H**；列表→详情 | 列表/详情成对呈现；Eidos 保留列表返回、筛选和分页坐标；不引入另一套路由容器。 |
| **EX06 · [明道云视图介绍](https://help.mingdao.com/view/introduction/)** | 2026-11-06 / **H**；视图/插件扩展 | 一个工作表可以有多种展示视图；采用展示与业务数据分离，不允许任意插件私有 JS/HTML 抢占宿主。 |
| **EX07 · [明道云应用介绍](https://help.mingdao.com/application/introduction/)** | 2026-11-06 / **H**；对象/权限/统计 | 工作表、视图、角色权限、图表、流程职责分离；不复制“所有业务事实统一存储”架构。 |
| **EX08 · [W3C WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)** | 2026-11-06 / **H**；无障碍 | 交互 `grid` 的焦点与键盘操作比普通 `table` 复杂；只读优先语义表格，复杂 Grid 要另做 Human 实机键盘/读屏验收。 |

**历史资料重新核验触发条件：** 若要实现真实 Saved View、编辑 Grid、移动端键盘/读屏或更换前端架构，应按对应产品版本重新阅读官方原文、许可证与当前支持情况。当前阶段不据旧摘要贸然选定商业第三方 Grid 供应商。

## 3. 本窗口直接阅读/执行核验的 GitHub 项目事实原件（G）

所有项目链接均属于 `jiangxng/EVO-App-Platform`，日期为 2026-11-18～19，本次直接通过 GitHub 连接器读取/核验对应文件或原始 CI；**对时间敏感的内容使用固定 SHA**。

| ID / 原始对象与定位 | 级别 / 对应模块 | 原始结论与证据上限 |
| --- | --- | --- |
| **SRC01 · [Agent 模型指令与 Responses Tool 适配](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/agents/enterprise-agent/provider-model.ts)** | **G**；Agent/Provider | Model 只能收到 Host 当前工具目录；歧义 Collection 问澄清，拒绝非法筛选不能放宽；同一轮多工具调用不被默默部分执行。文字指令**不保证真实模型遵循**。 |
| **SRC02 · [Agent Runtime](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/agents/enterprise-agent/runtime.ts)**、[Host Catalog](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/agents/enterprise-agent/host-tool-catalog.ts) | **G**；Host 权限、READ | Runtime 有 READ 同参去重与有界步骤，Host Catalog 是业务工具/授权入口；不可用模型“猜测”代替 ActionRouter 真实权限。 |
| **SRC03 · [Agent/Eidos 回复导航](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/agents/enterprise-agent/reply-presentation.ts)、[真实 Owner 合成夹具](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/tests/integration/cv02-personal-agent-authorized-collection.test.mjs) | **G**；Eidos/Domain Owner/测试 | 只有当前成功有权 Collection Preview 才生成可导航列表；随后失败会隐藏旧动作。L05 需重新发起真实 Owner + Agent READ 才算撤权负例。 |
| **SRC04 · [安全 Launcher](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/tools/agent-line/cv05-live-llm-acceptance.mjs)、[手动 workflow](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/.github/workflows/cv05-live-llm-isolated-acceptance.yml)、[门禁测试](https://github.com/jiangxng/EVO-App-Platform/blob/8038a03333bded27e309b9b00b940c10502f79c3/tests/protocol/cv05-live-llm-acceptance-gate.test.mjs) | **G**；GitHub Actions/测试费用 | 只接受明确收费同意、官方 Provider、显式模型/独立 QA Key；workflow `admission` Job 无密钥，测试 Job 绑定 `environment: cv05-live-qa`。**无法由这些文件证明 Environment 实际 branch policy/Secret 已配置**。 |
| **SRC05 · [PR #1354](https://github.com/jiangxng/EVO-App-Platform/pull/1354)、[#1355](https://github.com/jiangxng/EVO-App-Platform/pull/1355)、[#1356](https://github.com/jiangxng/EVO-App-Platform/pull/1356)、[#1357](https://github.com/jiangxng/EVO-App-Platform/pull/1357)、[#1358](https://github.com/jiangxng/EVO-App-Platform/pull/1358)、[#1360](https://github.com/jiangxng/EVO-App-Platform/pull/1360)** | **G**；提交/治理 | 全部 MERGED；#1360 将工程七轮文档合入 `8038a03333bded27e309b9b00b940c10502f79c3`。各 PR 评论有准确 HEAD/合并后/Actions 的来源链接，不应只引用口头状态。 |
| **SRC06 · [Platform CI #44300440715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44300440715)**、[PR #1358 回执](https://github.com/jiangxng/EVO-App-Platform/pull/1358#issuecomment-6978163546) | **G**；测试能力等级 | **1,461 tests / 1,460 pass / 0 fail / 1 skip**；OpenAI/DeepSeek 真 Adapter 各接收 12 次**预设** Responses 函数调用，经合成 HTTP 和真实 Owner/Eidos 通过；不代表真实模型推理。 |
| **SRC07 · [东京实际发布 #44294553561](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44294553561)、[发布跳过 #44302950723](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44302950723)、[最终 PR #1360 回执](https://github.com/jiangxng/EVO-App-Platform/pull/1360#issuecomment-6978438117)** | **G**；Release | 实际健康 VPS 容器最近验收镜像为 `ghcr.io/jiangxng/evo-app-platform:f704394474fcf4d11d66d3714c060491a178e698`；后续 docs/tests/workflow 改动 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE`，不能称最新 Git main 已部署。Release manifest digest `sha256:444d4bad7d5e5ea2becbeeef8ddf46b739518c2b0c57f5e9cd5c71c85ae3097b` **不是单独取得的容器运行 digest**。 |
| **SRC08 · [#1359 管理员阻塞](https://github.com/jiangxng/EVO-App-Platform/issues/1359)** | **G + U**；外部依赖 | Issue 现为 OPEN，已列环境仅 main、环境级独立低额度 QA Secret、原证、不使用生产密钥、真实 L01–L05；**Issue 存在不意味着上述外部控制面已完成**。 |
| **SRC09 · [2026-11-18 七轮最终交接](CV05-MVP-0506-20261118-WINDOW-0707-FINAL-HANDOFF.md)、[在线验收 runbook](CV05-MVP-0506-20261118-LIVE-LLM-ACCEPTANCE.md)、[旧研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)** | **G**；历史/裁决 | 交接入口、研究缘由和历史决策已存仓库；其中提到的旧时点“候选/待 CI”仅当时快照，不能覆盖 #1360 的后续合并原证。 |

## 4. 方案对照：来源事实与我们的架构判断分开

| 路线 | 参考事实 / 观察来源 | 本项目决策（判断 D）与适用条件 | 排除项或边界 |
| --- | --- | --- | --- |
| **A. GitHub 纯 YAML `if main` + repo Secret** | GHD03：手动可选分支，且分支工作流内容可修改；GHD02：Secret 作用域不同 | **不采用为最终密钥边界**；#1356 的 Admission 仅作为纵深防御和意外运行保护 | YAML 不能隔离其他分支运行自己改写的工作流并读取 repo/org 级同名 Secret |
| **B. GitHub Environment selected main + Environment-only Secret** | GHD01/GHD02；SRC04 是已合入代码配置 | **采用**；独立管理员控制面与代码 CI 两道门禁。前提：实际 Settings 配置、管理员核查、明确费用同意；[#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) | 若未配置，Environment 可能被自动创建且无 protection rules；仅引用 `environment` 没有安全签收意义 |
| **C. 真实 OpenAI 或 DeepSeek Provider Adapter + 原 Agent/Host/Owner** | API01–03 搜索摘录 + SRC01–06 代码/CI | **采用**：复用已有 `llm.inference` 与 Host READ，不新建业务 SQL/NL executor；先离线协议回归，安全配置完成后再做真实 L01–L05 | 不假定两个厂商 Responses 完全兼容、模型一定可用或多工具/对话行为相同 |
| **D. 直接模拟 LLM 决策即可签语义验收** | SRC06 scripted HTTP；API01–03 仅接口 | **排除**：离线 12 步证明适配和权限边界，不证明实际模型能自主问歧义、修正错误 | 真实 L01–L05 与 Human 授权证据为独立上线门禁 |
| **E. SharePoint/Odoo 等另建万能 BaseList 与单一业务库** | EX01–EX07 为历史来源 H；SRC01–03 的现有 Domain Owner | **排除重造轮子**：沿 Eidos + Platform 现有 Collection Query、View、Feature/Capability、Owner 和 Agent；多插件能在共享契约下扩展 | 不复制供应商框架或一张大业务表，不能把 chart 当前分页冒充全量聚合 |
| **F. 只读视图 + 分权限图表/看板** | EX03/EX08（H）；#1352/#1353/#1354 的现有工程事实 | **采用**：Chart 由独立 Owner 聚合授权，Board 当前有权页，不暗启拖拽/WRITE；Human 与 Agent 都须在当前企业重新 READ | 复杂 editable Grid、Saved View persistence、Human 正式 SAVE/EXPORT/生产 WRITE 另行认证 |

## 5. 冲突、缺证和后续最值得读的材料

1. **旧文档快照 vs 最新工程状态：** 11-18 恢复文档 §1–10 的 “待 CI”是过程记录；[#1360 最终回执](https://github.com/jiangxng/EVO-App-Platform/pull/1360#issuecomment-6978438117) 已把 #1354–#1358 与七轮交接核验为 MERGED。以带准确 SHA 的后者为现状，不篡改历史。
2. **YAML 的 main 判断 vs GitHub 控制面的环境策略：** GHD03 能选择其他 `ref`，GHD01 又明确未预建环境可能默认无保护。因此 #1357 的代码通过 CI 与 **Environment 部署保护已经生效**是两件事。重点继续查阅/核实管理员真实 Settings、环境分支规则与 Secret scope；未取得前为 U。
3. **OpenAI vs DeepSeek“同为 Responses”不等于完全一致：** API03 搜索摘录列出部分 unsupported/ignored 字段，API02 模型选择有版本变化；需在 QA 的低额度身份下核对**当前服务方模型列表、费用、状态码、一次多工具和多轮历史**，保留差异失败。当前 S 级证据不足以做生产模型选型。
4. **`main` 代码 SHA 与东京物理容器 SHA 不同：** SRC07 证明 docs/test 改动后是 `deploy SKIPPED`，最近直接验收的物理容器仍为 `f704...`；下次若发生 runtime 变更，必须取得新的 VPS `docker compose ps`、health/HTTPS/401、tag/digest 并明确运行 SHA。
5. **Provider/Owner CI PASS vs LLM 语义 PASS：** SRC06 使用真实代码与假 HTTP 的有界场景，绝不升级 L01–L05；未来需原始 Actions Run、真实网络调用、错误/Token 用量脱敏摘要与人工按场景复核。
6. **Human 浏览器 vs Human 现实身份：** 1280/390 的 Chromium 工作流不能替代真实 OIDC/设备/读屏使用者签收；[#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)、[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 保留原门禁；并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不碰。
7. **下一轮文献方向的优先级：** (P0) GH Environment 的管理员原界面/部署 rule 及 Secret 权限（#1359）；(P1) 官方 OpenAI/DeepSeek 当前版本 Responses 完整参数与受支持型号、成本上限（API01–03，当前 S）；(P2) 真实 L01–L05 低风险脱敏运行的原始 Run/日志；(P3) 仅计划进入可编辑 Grid、个人 Saved View 或正式 Human 时，重新查 EX01–EX08 的当前章节/交互约束。

## 6. 易变资料的可回溯位置、截图与附件清单

- **可重新访问的重要官方章节**：GHD01 §Creating an environment 步骤 3–11（特别是 Deployment branches、Environment secrets、Environment 自动创建无默认保护）；GHD02 §Creating secrets for an environment 与 §Using secrets in a workflow；GHD03 §Running a workflow 的 Branch 下拉与 CLI `--ref`；API01–03 的 `POST /responses`、工具/schema、响应、模型与多轮状态兼容性（**原文未完整读取，不能写完整参数兼容表**）。
- **原始 CI/部署证据**：无需从易变网页重造日志；原始页面分别存于 SRC06/SRC07 中固定 Actions Run URL、PR 回执/Commit SHA。Github Actions Job 保留期受设置影响；若下次出现可下载的日志/artifact，优先按企业合规策略归档**脱敏结果及 hash/Run URL**，不能将原始 Secret/业务行体上传研究包。
- **截图与附件现状**：**本窗口没有新生成或上传网页截图、视频、API 响应原文、GitHub Environment 设置截图、模型凭据附件**；不要制造不存在的 `artifacts/` 路径。旧 [2026-11-06 索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 亦说明没有复制竞品页面全文/截图。
- **需后续管理员补充的截图/链接位置**：在 [#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) 评论中记录不含 Secret 值的 Environment 名称、`Selected branches and tags: main`、reviewer/bypass 规则、Environment secrets **仅名称/范围**、repo/org 同名排查与管理员签认日期；真实运行另附 Actions Run URL + SHA + Provider/Model + 5 项通过结果。禁止拍摄或粘贴密钥明文。
- **保存方式**：本索引只存可读短摘要、原始 URL、查阅/证据等级、固定 SHA 和章节/Run 位置，不复刻长篇版权原文；它不是外部网页的镜像备份。

## 7. 实施落点/未来接手矩阵

| 实施域 | 现有代码与交接 | 当前结论 / 下一步 |
| --- | --- | --- |
| Agent / Model | `agents/enterprise-agent/provider-model.ts`、`runtime.ts` | 保留 Prompt/动态工具约束与 Host 真实观察，不建第二个意图引擎；真实语义质量仍在 #1359 |
| Host / Authority | `agents/enterprise-agent/host-tool-catalog.ts`、`collection-read-preview.ts`、`reply-presentation.ts`，`apps/counterparty/projection-query.ts`、`apps/business-dictionary/directory-query.ts` | 当前 READ/企业/字段权限由 Owner 决定；旧链接必须打开时再授权，非法 status 不静默丢弃 |
| Provider adapters | `providers/openai/runtime.ts`、`providers/deepseek/runtime.ts`、`tests/integration/cv02-personal-agent-authorized-collection.test.mjs` | 双 Adapter 现有离线 transport PASS；需要真人管理员批准的真实模型服务能力验收 |
| CI / Credential boundary | `.github/workflows/cv05-live-llm-isolated-acceptance.yml`、`tools/agent-line/cv05-live-llm-acceptance.mjs`、`tests/protocol/cv05-live-llm-acceptance-gate.test.mjs` | workflow 的 `environment: cv05-live-qa` 已合入；**配置和费用授权未签收**，跟踪 #1359 |
| Eidos / Views | `vendor/eidos`、原 #1352/#1353、Eidos #219、多视图 / 只读 Board / 独立聚合 Chart | 先复用现有受管 View，不重新实现 kanban/通用 Grid/全量前端图表 |
| 发布/治理 | `.github/workflows/evo-tokyo-dev-deploy.yml`、[最终七轮交接](CV05-MVP-0506-20261118-WINDOW-0707-FINAL-HANDOFF.md) | 已合并文档不需物理部署；必要时先严格确认 `main` 与运行 SHA、最新 CI 和 exact-HEAD Branch Hygiene |
| 任务 | [#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359)、[#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)、[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) | 先完成 #1359 管理员可核实前置；保留其它独立生产准入，不合并到此轮研究文档工作 |

**备注：** 本文件的日期反映“本窗口做过何种检索”；新窗口不得把任何 S/H 自动升级为 O/G。来源事实是各 URL 原文/摘要或原始 Actions 所见；使用与拒绝理由属本工作线判断，遇到官方版本变化时需重新验证。


## 8. 2026-11-19 接续 #01/07：Responses 完成状态/JSON 函数参数原文审计

> **新增核实，源等级 O（官方网页可见原文）+ G（主线适配器代码实际读取）**；此节不追溯篡改 §1 在前一研究窗口时的 S/H 分类。新发现以本次真实浏览原文为准，已用于独立精确 HEAD PR 的非网络测试；**尚未实际调用远程 LLM**。

| 参考源（原始 URL） | 本次查阅及原文定位 | 事实 vs 本项目判断 |
| --- | --- | --- |
| [DeepSeek Responses API](https://api-docs.deepseek.com/api/create-response/) | **2026-11-19 O**；`Response body` §Responses（status: in_progress/completed/incomplete/failed）；`output[].status`；`function_call.arguments` 第 359–363 行；`incomplete_details.reason` 第 292–300 行 | **事实：** HTTP 200 返回的 Response 仍可能不完整或失败；模型生成的工具参数不一定是有效 JSON，需要调用方验证。**判断：**在任何 Host READ 之前拒绝非完成响应、未完成函数调用、非法 JSON；禁止把非法参数变成 `{}`。 |
| [OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling) | **2026-11-19 O**；§Handling function calls / §Executing the call / §Incorporating results into response（页面约 2026–2310 行） | **事实：** `response.output` 可包含一个或多个 `function_call`，参数为 JSON 字符串；通常需要把调用结果显式送回模型。**判断：**现有 Agent 一次一工具，已对多工具失败关闭；此次仅收紧不可安全执行的响应/工具参数，不擅自重写整个工具循环。 |
| [OpenAI Responses API Create](https://developers.openai.com/api/reference/resources/responses/methods/create) | **2026-11-19 S**；官方搜索摘录确认 `status/incomplete_details/function_call` 相关字段；原完整页面访问失败（页面超过抓取限制） | 与 DeepSeek 原文互证一般性响应结构，但不将未取得的整页声称为全文。首次真实模型前仍应复读模型版本和收费限额。 |
| [DeepSeek Responses API 中文](https://api-docs.deepseek.com/zh-cn/api/create-response/) 与 [DeepSeek API 价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/) | **2026-11-19 S**；官方搜索摘录列 `deepseek-flash`、`deepseek-v4-pro`；英文 [DeepSeek Responses API](https://api-docs.deepseek.com/api/create-response/) 已读页面中又出现仅 `deepseek-v4-flash` 的限制 | **来源间冲突（未解决）：** 不同语言与抓取时点对可用模型清单不同。**决定：**不更改生产/默认 Model ID，仅按 runbook 要求管理员在真实 QA 之前通过 Provider 最新列表、计划/价格、运行身份核实并**显式指定**获许可模型。 |

**读取的现有缺口：** `providers/openai/runtime.ts`、`providers/deepseek/runtime.ts` 之前将 JSON 参数解析失败退化为空对象，并在 HTTP 200 时直接解析输出函数调用，即使 `status=incomplete/failed`；可能消除 Human 指定筛选而扩大 READ。由本轮安全小 PR 改成固定错误码 fail-close，并为两个 Provider 分别验证 **9 种异常响应无任何 Agent Catalog.invoke**；合法空 JSON object 则仍可执行。新测试 `tests/protocol/cv05-responses-provider-failclosed.test.mjs` 只注入离线合成 HTTP，不构成真实模型/企业权限质量签收。

**保留范围：** 为兼容旧 Provider 测试夹具中未设置 `status` 的合成响应，当前适配器在字段明确为非 completed、`error` 或 `incomplete_details` 时拒绝；未来可另行考虑要求实际服务响应必须具备 `status`，但要先完整迁移旧 fixture 与协议定义。不要把当前改动包装成所有 Provider JSON Schema/生产安全已全面审计。
