# BEX-01 V3 / M06｜Window 13 研究资料、决策与证据详细索引（2026-10-22）

> **配套**：[Window 13 简短交接入口](BEX-01-V3-M06-WINDOW-13-HANDOFF-ENTRY-20261022.md)。只记录本窗口（2026-10-21 的 #03–#07 续跑，2026-10-22 核对）**实际读取**的 GitHub 原文、验证和由此作出的判断，不替换 [Window 12 历史原始索引](BEX-01-V3-M06-WINDOW-12-RESEARCH-DECISION-REFERENCE-INDEX-20261021.md)、[2026-10-19 V3 总索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)和[2026-10-15 UI/认知索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。本索引是**增量研究遗产**，不是新的线上产品验收证书。
>
> 项目 `jiangxng/EVO-App-Platform`；本轮最终 BEX Owner **[#1086 Draft](https://github.com/jiangxng/EVO-App-Platform/pull/1086)** HEAD `6bde0259aab71b28f742f8178366e266ed2fb368`，main 2026-10-22 核查 `eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`。GitHub 随时变化，新窗口必须再次 GET，而不是复制 SHA 后视为永恒状态。

## 0. 阅读强度、事实与判断的定义

- **R（本窗口已读原文）**：本窗口确实通过 GitHub 连接器取回**原始 HTML/CSS/JS、TypeScript/Python 测试源码、项目 Markdown 或 CI 运行日志**，并阅读相关章节；不意味着逐字读完整仓库。**RM（直接查 metadata）**：本窗口直接读取 GitHub PR/commit/check run/Actions artifact API；可确认状态和链接，但不能因此声称已打开 artifact 中每一张 PNG。
- **RH（历史资料）**：前序已保存索引记载当时读过外部来源原文或段落；**本窗口未再次访问这些外站**。**SH（历史搜索摘要）**：仅在前序索引中由搜索摘要、局部提取或图片预览得到，**本窗口没有新的此类搜索结果**。**D（待验证）**：本次未取得原文/二进制、用户事实、生产身份或 Human 实际签收。
- **[S] 来源事实**为可从上述材料确证的内容；**[J] 工程/产品判断与取舍**是本窗口对其应用，不能冒充厂商或用户的原话；**[U] 用户明确要求**是三维 100%、源码优先、集中根因、不得跨视口机械锁死像素。**CI SUCCESS ≠ 真实客户数据 PASS ≠ 生产发布 ≠ Human 100%**。
- **时间**：实际开发和初读 2026-10-21；本交接又在 2026-10-22 通过 GitHub 确认 main、#1086、#909 blob、最终 check 和 artifact。下面标为「10-21 R；10-22 RM」的来源确实于两时点分别被调用。历史外站查阅日期留在旧索引中，不伪写成今日阅读。

## 1. 本窗口 GitHub 网络资料索引：原始 URL、时间、深度和用途

| ID / 标题 / 原始网址 | 实际阅读日期及深度 | [S] 阅读到的关键事实（附定位） | [J] 用于 EVO 何处；边界 |
| --- | --- | --- | --- |
| **R01 V3 可编辑的唯一批准原型**：[精确 SHA 的 HTML/CSS/JS](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，[PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | **10-21 R：源全文 290 行；10-22 R 相关 CSS/JS 章节和 blob 再核** | blob `9f57e9320eb527786ff7b737be27777eba6f8a92`；L7–L36 CSS 变量/响应式；L68–L93 结构与按钮；L132–L163 初始状态和模拟存档；L180–L238 行渲染/状态/统计；L245–L287 审核→字段确认→模拟预检→完成/恢复。 | 页面顺序、信息层次、配色、三类筛选与交互真实差距的最高**设计**依据；但 #909 仍 Draft，原型 localStorage / 172 演示数不能代替 Host。 |
| **R02 全项目「原型源码优先」规范**：[main 工作流 §5](https://github.com/jiangxng/EVO-App-Platform/blob/eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)，[PR #1097](https://github.com/jiangxng/EVO-App-Platform/pull/1097)，[merge commit](https://github.com/jiangxng/EVO-App-Platform/commit/eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff) | **10-21 R：五文件 patch、GitHub PR/CI、合并门禁；10-22 R：main 工作流原文** | 批准原型有源码就读其完整 DOM/CSS/JS，功能/布局/颜色独立差异表；经真实 Host 与 Human 签收。最初 required `continuity` 保护门禁被拒，随后正常合入最新 main、全绿并按保护流程 squash 到 main；五份入口落地。 | 所有窗口的 CURRENT_AUTHORITY，**不是 BEX 专属文档**，无须在 BEX 业务 PR 再造相同规范；需按 main 的 `AI-BOOTSTRAP.md`、`LLM.md` 和快速止损文件实际执行。 |
| **R03 当前 BEX Owner PR 三层依赖**：[上游 #1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) / [中层 #1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077) / [当前 #1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086) | **10-21～10-22 RM：PR API / HEAD / base / changed files** | #1060 `ff38cbf6b7fe9264b18ef1a1e2730e8505978905` base main；#1077 `2c2b6bb8ed8f6c9f23e1e8f63a4b070dac7e17cf` base #1060；#1086 `6bde0259aab71b28f742f8178366e266ed2fb368` base `feat/bex01-v3-m06-file-footer-parity-20261020`，3 PR 仍 Draft OPEN 未合并。 | 此分支是唯一业务 Owner 实现线；本交接 docs-only 分支从 #1086 快照派生并以其为 base，避免并行覆盖实际文件和 main。后续必须重新查各 HEAD 与 CI。 |
| **R04 真实映射页构造器**：[apps/data-import/page.ts @ 6bde025](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/apps/data-import/page.ts) | **10-21 R：实际多次逐段阅读；10-22 关联证据重核** | `createDataImportMappingPageV010`：约 L497 起；`mappingSelectionFor`、`reviewStatusFor`、`choiceStatusFor`（约 L627–L700），`reviewGroups` / `statusByChoice`（约 L702），筛选键和 `unmatched`（约 L736–L830），问题区 `reviewIssues`（约 L834–988），四统计 `reviewTask`（约 L989–1054）；`createDataImportReviewPageV010` 约 L1218+。 | Platform 负责真实 Job 字段、Host issues、合法选择和审查导航；改界面之前读现有构造器，不能通过名字猜字段 ID；行状态与服务器问题数严格区分。行号是核对时的近似定位，以精确 blob 为准。 |
| **R05 授权命令及持久化语义**：[actions.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/apps/data-import/actions.ts)、[service.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/apps/data-import/service.ts)、[row-correction-page.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/apps/data-import/row-correction-page.ts) | **10-21 R：相关源段落** | `data-import.review` 保存合法映射、pending 禁止被无意略去、待建列走 Owner 批次确认；`data-import.dry-run` 受企业管理权限控制；`data-import.row-correct` 仅 Human、带修正版本；服务纠错会使旧 dry-run 失效后再核；最终 `commit` 单独确认。| 防止将原型本地的自动保存、按 SUPPLIER 推断 ORGANIZATION、无审批 field create 或模拟“导入完成”搬入生产。 |
| **R06 Eidos 通用交互合同、渲染与控制器**：[contracts.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/vendor/eidos/src/runtime/contracts.ts)、[validate.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/vendor/eidos/src/runtime/validate.ts)、[renderers/html/index.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/vendor/eidos/src/renderers/html/index.ts)、[app-host/page-controller.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/vendor/eidos/src/app-host/page-controller.ts)、[browser-shell.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/vendor/eidos/src/app-host/browser-shell.ts) | **10-21 R：各关键方法原文** | 通用 `statusByChoice` 本地即时状态；`reviewTask.metrics[].reactive?:boolean` 对可重算指标 opt-out；筛选 `choiceValues` 对真实 select option 受校验；Browser Shell 的成功命令已在 `onActionResult→refresh()` 重新挂载当前页。 | 应在 Eidos 通用契约以可选扩展支持显示，Platform 保存业务意义；禁止第二套导入 UI 与全局 CSS 改其他页面；重复同路由导航造成旧 DOM 引用竞态。 |
| **R07 真实 Host Chromium 供应商链路测试**：[Python 测试 @ 最终 HEAD](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py)；[协议测试](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/tests/protocol/bex01-v3-decision-first-visual-review.test.mjs)、[业务/安全回归](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/tests/protocol/data-import-human-experience.test.mjs) | **10-21 R：实际测试代码、失败行/日志，10-22 R：最终测试源截图输出名称** | 22 列 / 172 行 synthetic 数据（不代表客户真实文件/行号）；两同名银行候选核实、字段映射保存、问题行 165/169/172 合成值纠错、真实重新预检、受权提交、业务数据保留；桌面和 390px 映射页视觉/操作/重开证明。| 全路径真实隔离 Host 检查，非仅协议模拟或原型脚本；不能由此宣称真实客户文件、线上权限或所有 Human 视觉已通过。 |
| **R08 #1086 本窗口的实测 PR 评论**：[第一批联动](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6310117313)、[状态与服务器问题](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6310321354)、[重新预检查](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6310588391)、[待处理筛选](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6310781429) | **10-21 R：本窗口实际撰写并留存的原始 GitHub 评论** | 精确每批 HEAD、试错根因、测试覆盖、尚未签收项和实际模块。 | 下一窗口不用从数千行聊天反推开发历史；评论本身是历史快照，以新 PR HEAD/Actions 为准。 |
| **R09 本次两份功能审阅记录**：[选择与计数](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/docs/ui-design-reviews/bex01-v3-m06-live-map-choices-20261021.md)、[重新预检查](https://github.com/jiangxng/EVO-App-Platform/blob/6bde0259aab71b28f742f8178366e266ed2fb368/docs/ui-design-reviews/bex01-v3-m06-real-precheck-rerun-20261021.md) | **10-21 R：实施时落盘；10-22 R：GitHub 再取回** | 记录原型源码路径、Host/Eidos 边界、改变/撤回选择、服务器验证问题计数、单次刷新、真实设备和失败禁提交的自动化门禁；文中 PASS 以最终 HEAD CI 为准。 | 保留原始 QA 可审计性；Human 签收仍 OPEN。文件仍在业务 Draft HEAD 上，不是 main。 |
| **R10 先前 Window 12 项目研究遗产**：[简短入口](BEX-01-V3-M06-WINDOW-12-HANDOFF-ENTRY-20261021.md)、[详细索引](BEX-01-V3-M06-WINDOW-12-RESEARCH-DECISION-REFERENCE-INDEX-20261021.md) | **10-22 R：读取 GitHub 原文** | 旧 HEAD `60f1e11`、16/4/3 synthetic 设计同态、桌面/手机连续截图、用户三维目标、旧性能/布局和失败路径；文档不是当前 HEAD。 | 继承基础视觉来源及避免重踩旧问题；**不修改、不把 60f1e11 的 CI 当最新结果**。 |
| **R11 最终 HEAD 的平台及业务 CI**：[GitHub commit](https://github.com/jiangxng/EVO-App-Platform/commit/6bde0259aab71b28f742f8178366e266ed2fb368)，[BEX Chromium run 39563551706](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551706)，[BEX resume run 39563551695](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551695)，[Platform run 39563551665](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551665)，[Lightweight Host run 39563551683](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551683) | **10-21/22 RM：实际 API check-runs/workflow runs；部分失败日志为 R** | 当前 `6bde025` 精确提交的 16 个 GitHub checks **全部 completed/success**；涵盖供应商 Chromium、导入恢复、Eidos/Platform、UI 和架构。部分 check 名都叫 `test`，用各自 run ID 区分。 | 是**工程自动化通过**，不是 Human 100% 通过；报告时必须写精确 SHA/最终 attempt。 |
| **R12 Agent PA-01B2 隔离 Chrome 交叉 CI**：[run 39563551676](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551676) | **10-21 R：失败 job 日志；10-22 RM：attempt=2 及工作流 success** | 初次 `full-host-chromium (allow)` 报 `MOCK_MODEL_CALL_NOT_SEEN`；未改 Agent 代码，选择“仅重新运行失败 Job”，第二次成功，最终两项 Agent Job SUCCESS。 | 外部并行 Host 测试偶发问题须**明确记录 first failure 和 rerun**；不能隐去、误把本次 BEX 功能改为原因。若持续复现，应由 PA Owner 跟进。 |
| **R13 Actions 视觉截图证据包**：[最终供应商 artifact 12328632650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551706/artifacts/12328632650)、[旧 Window 12 同态 artifact 12322028969](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838/artifacts/12322028969) | **10-22 RM：最终 artifact API 的确存在、未过期；相关 Python 源代码 R。旧包依据前序索引 RH；本窗口未逐张打开 PNG 二进制** | 最终证据 artifact 名 `bex01-real-host-chromium-evidence`，GitHub API 当时显示有效且到期 `2027-01-19T07:39:43Z`（未来可能提早清理，需复核）；脚本输出见 §5。 | 后续直接下载真实 artifact 或重新运行真 Host 并人工对照原型，不能把源代码里出现 PNG 文件名等同已亲眼签收具体图像。 |
| **R14 旧外站研究原始目录**：[2026-10-15 业务索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[2026-10-15 UI/认知索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[2026-10-19 V3 索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) | **10-22 R：GitHub 目录文档原文；外站本轮未读＝RH/SH 历史等级保留** | 旧文件保留飞书/Lark、简道云、Microsoft、Airtable、NN/g 原始 URL、访问日期、已读/仅摘要/待查标记与方案取舍。 | 不重复广泛联网研究，不凭旧索引给外站内容升级本轮已读证明；只有需求变化或具体冲突才定向重开原文。 |

**订正说明**：R07 的「172 行 22 列」、合成行 165/169/172 均来自合成夹具；**真实客户行号、字段 ID、银行业务用途本轮未核实**。R10/R14 的 Markdown 原文实际读到，不代表其中引用的每一个外部链接都曾在本轮打开。对于“仅看搜索摘要”类来源，本窗口**没有新增此类直接材料**，不得补造。

## 2. 本轮已实施闭环和可追溯的提交链

| 批次 / 时间 | 精确 HEAD 原始 URL | [S] 问题 → 修复 → 自动化结果 | 状态 |
| --- | --- | --- | --- |
| 项目级 source-first | [PR #1097](https://github.com/jiangxng/EVO-App-Platform/pull/1097) → [merge eef6774](https://github.com/jiangxng/EVO-App-Platform/commit/eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff) | 原型设计反复截图反推 → 规定“HTML/CSS/JS 已有就先读源码；三维独立验收”；先遇到 required `continuity` 与最新 main 对齐问题 → 正常 merge main 到 doc 分支重跑，通过后受保护 squash 合并。 | **已合入 main**；无须再造规则。 |
| V3 实时改选 | [ddb6e8b](https://github.com/jiangxng/EVO-App-Platform/commit/ddb6e8b4a39dd4da6b46ce1bb2bf3a723b68f966) → [cdba8f8](https://github.com/jiangxng/EVO-App-Platform/commit/cdba8f8034c3f1bb0d9b42d31bd3de4a459ba158) | 行改选没有全部业务状态联动；Eidos `statusByChoice` 支持。本批迭代修“初始全 matched 不要打开空关注”、旧断言只允许初始状态、TypeScript 类型和 Playwright 夹具对初始 `__CREATE__` 的错判；**最终 8/8 PASS**。 | **业务 Draft 已实现+回归，未合并。** |
| 原选择回退 + Host issue 数值 | [4c84a05](https://github.com/jiangxng/EVO-App-Platform/commit/4c84a052b1ea5e954e73b1879bdee26ded1b7f00) → [c490dd8](https://github.com/jiangxng/EVO-App-Platform/commit/c490dd890413506b38b5026a3025d1abc84e4671) | 改成 Ignore 再改回原 `__CREATE__` 应恢复原 Host 的 `attention`；真实 Chromium 随后发现 3 个 Host 问题被客户端重算成 1 行 attention——**这是产品问题非测试错误**。给 `reviewTask.metrics[].reactive:false` 显式阻止只重算此 Host 指标；其他匹配/待新增/忽略即时数字不变；**最终 16/16 PASS**。 | **业务 Draft 已实现+回归。** |
| 真实重复预检查 | [56cd092](https://github.com/jiangxng/EVO-App-Platform/commit/56cd092c60f97cbe5a0edcaff92c4a4e767d2776) → [6a0da98](https://github.com/jiangxng/EVO-App-Platform/commit/6a0da98f552459c48648224eafed24d32d8a245e) → [b700526](https://github.com/jiangxng/EVO-App-Platform/commit/b700526ec6c4f6eb699b582c5f32e96382533b00) | 原型 `#rerun` 真实预检页缺对应操作。增加 `data-import.dry-run`；初版同时 `navigateTo` 相同 route + Shell 自动 refresh，导致后续点击旧 DOM 行修正竞态；去掉多余导航并等待 remount；Python Playwright `wait_for_function` 需要关键字 `arg=`，修测试而不改业务。**最终 16/16 PASS**。 | **业务 Draft 已实现+回归。** |
| 第三筛选「待处理」 | [6bde025](https://github.com/jiangxng/EVO-App-Platform/commit/6bde0259aab71b28f742f8178366e266ed2fb368) | #909 `filter==="unmatched"` 严格等于 `state.maps[k]==="__PENDING__"`，现有 Eidos 仅 attention/all/handled。加通用 `choiceValues` 选项与白名单 validator、渲染及客户端实时筛选；真实 Chromium 验证 +1/−1；**最终 16/16 PASS**（PA-01B2 首轮失败、按原 Job 重试通过）。 | **本窗口最终业务 Draft HEAD，未合并。** |

**止损记录**：上表中若存在带红色检查的旧 HEAD，其失败属于当时真实功能边界或测试问题，不能选择性只保留绿色证据；后续应以最终 head 16/16、且故障处理记录不丢失为完成门槛。修复具体可对照 #1086 评论 R08 与各历史 commit。

## 3. 方案比较：来源事实、采用决定、排除原因、前提

| 讨论议题 | [S] 来源事实 | [J] 采用方案及理由 | [J] 排除/限制 |
| --- | --- | --- | --- |
| V3 信息结构/视觉实施 | #909 已有可编辑的 HTML/CSS/JS 和明确色板；截图只是渲染结果。 | **原型源码优先、三维分别列差距**；最后用 Host 截图/用户体验核验。 | **排除截图倒推 CSS 和跨屏强求像素行高相同**，但实际层级/布局必须达到批准版相应效果。 |
| 本地状态与真实保存 | 原型 `save()` 写 `localStorage` 并显示“已保存”；真实 Host 有 Principal、Job、显式 Review Command 和审计。 | 行状态本地即时可见、提交/保存继续受 Host 控制，文案须说明未保存。 | **排除模仿假自动保存、虚构后台成功或取消真实安全校验**。若 Human 要自动保存真实 Job，必须另定新授权/冲突解决语义及独立门禁。 |
| 状态刷新 | #909 `changed()/render()` 会本地重算；Eidos 已有可选 `statusByChoice`。 | 在 Platform 提供真实 option → 状态映射，Eidos 通用组件表现，不为供应商复制一套交互内核。 | 不能只靠静态默认状态，也不能直接把未保存选择写成 `matched`。 |
| 统计误差 | Host `reviewIssues` 可来自持久化 dry-run 行/元数据/歧义；表格 `attention` 行数不是全量 Issue 数。 | 引入通用指标 `reactive?:false` 保留 Host 问题证据，其它字段统计照常联动。 | 排除把 **3** 个服务器问题因一次本地选择误减成 **1**；也不全局禁用动态统计。 |
| “待处理”第三筛选 | #909 L184 是 `__PENDING__` 精确选值；旧 Eidos 有 needs/all/handled。 | 增加选值过滤和严格 UIDL 选项白名单，展示真实当前 Pending。 | 排除使用 status warning/attention 代替真实 `__PENDING__`，因为已有选择但尚需确认的风险列不等于未选择处理方式。 |
| 默认筛选 | 当前 fully matched Job 可能已无真实待注意行，但未来仍允许用户手动改 Pending。 | 筛选**选项覆盖可达状态、默认选择只看当前已恢复状态**；避免空列表。 | 排除始终默认 needs 导致已完成 Job 空页面。 |
| 重新预检/路由刷新 | 真正 `data-import.dry-run` 已存在，Browser Shell 同 route 的 `onActionResult` 自带 refresh。 | review 页只在未提交态提供 rerun，Host 已授权真实验证后**单次刷新**。 | 排除复制前端 `precheck()` 假校验、重复同路由 navigate+refresh、复核失败却显示 commit、未经确认导入。 |
| 同名“开户银行”及主体类型 | 合成表可有两个名字相同但 field ID 不同的银行；SUPPLIER 关系不等于 ORGANIZATION 主体身份。 | Human 按**真实字段 ID 与可信用途**确定对应；缺失主体类型执行有授权的行级纠错。 | 禁止按名称自动合并、虚构业务用途、用供应商身份批量猜主体类型。 |
| Eidos vs Platform 的职责 | Eidos 已存在通用 ReviewTable、控件、Host Shell；Platform 掌管业务、授权和数据。 | 在 Eidos 加可选通用能力、Platform 只声明真实业务配置。 | 排除破坏全局主题、所有表格的通用行为；扩展必须保证此前契约默认语义不变。 |
| 交付/集成 | #1060→#1077→#1086 仍三个 Draft，当前真实检验只在业务 HEAD。 | 文档单独 Draft stacked 在 #1086，业务继续该 Owner，合并前逐层重核。 | 不强推、不直接推 main、不擅自发布 Railway 或修改其他并行 Owner 文件。 |

## 4. 来源之间的冲突、未决问题、值得继续核查方向

1. **原型 7/22 vs Host 6/22**：R01 使用原型合成状态；Window 12 与真实相应 Job 记录 6 个需关注来源列，另有独立的行级问题。**当前只可证明两种数据/关注口径不同**；不应凑第 7 列或隐藏真实风险。是否最终视为视觉/行为等价由 Human 在 M06 判定，不能写成用户已批准。
2. **原型的自动存档提示 vs Host 显式 Review/Schema/导入**：原型的 JS 只存浏览器 localStorage，不具备真实租户/操作者隔离。现在真实 UI 明确保存→预检→最终单独提交。**安全真实语义已采取 Host 路线，但文案视觉等价性仍可能需 Human 决议**。
3. **原型独立 topbar vs Eidos Host 容器**：来源视觉不能直接覆盖企业 Context、语言、导航或安全提示。当前保留 Host；对界面布局的最终接受与否**仍未签**。
4. **色板精确度 vs Eidos 主题权威**：原型 CSS 是可核实的颜色源（下节记录）；本窗口没有形成经 Human 正式批准的“全页面颜色 100%”对照表，也没有授权全局硬编码。应以具体 token/作用域记录差值、对比度与一致性，需要时由 Eidos owner 提供受控主题机制。
5. **真实客户与合成 fixture**：本次通过的是 synthetic 22 列 172 行，三条合成纠错行号 165/169/172；**不能外推到**真实 `往来账户2026_10_08_10_15_23.xlsx`、客户两条同名银行真实用途/ID、真实缺失主体类型记录。获取真实数据及授权前 M04/M05 继续 OPEN。
6. **PA-01B2 同步 CI 偶发失败**：在 2026-10-21 的多个 BEX HEAD 出现 `MOCK_MODEL_CALL_NOT_SEEN`，重试同一失败 Job 可绿，表明**现象是间歇性的**；不能据此证明根因是某个特定 Agent Bug，也不能归咎于这次字段 UI。若独立场景再失败，应交由 PA owner 分析实际日志。
7. **M06 仍缺最终同态 Human 三维签署**：已知 Window 12 的连续截图旧 artifact，Window 13 最新截图/日志均可追溯，但人类对所有 DOM/layout/token/正常与异常功能逐项确认尚未发生。优先获取实际同态桌面 1280px、手机 390px 全页对照和真正用户的签字结论，而不是继续轻率加 CI/PR 次数。

**下一条最值得深入的检验（非重复大规模网络搜索）**：用 #909 L68–93/L180–287 的真实 DOM/事件与 HEAD `6bde025` 的 map/review/Owner 批次/行纠错逐条对照，在一个表里分别标注【已等价】【现存可复现问题】【原型与 Host 安全冲突待 Human 决策】；对正常/异常/取消/刷新/跨端场景各留足证据。真实功能缺口由现有 BEX Owner 小批量修；布局/颜色需结合原型源 CSS 与实际 Host 截图单独交付 Human 验收。不是继续改“某行高出 1px”。

## 5. 难重现来源的核心摘要、CSS 色值、截图与附件位置

### 5.1 原型稳定章节与精确可复用颜色

源 [R01 290 行](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)：

- **CSS L7**：`--page:#f5f7fa; --surface:#fff; --text:#172b44; --muted:#6a7c91; --line:#e3e9ef; --line-strong:#ced9e4; --primary:#2563a6; --primary-weak:#eaf2fb; --success:#18765a; --success-bg:#eaf7f1; --warning:#a66712; --warning-bg:#fff6e7; --danger:#b54738; --danger-bg:#fff1ee`。另有明确的焦点 outline `#73aaf4`（L9）、强调问题边框 `#eddfc6`（约 L21）、按钮/状态色（L19–L27）。**这些是原型源码事实，不是已对齐 Host 的验收结果。**
- **结构 L68–93**：文件和阶段、4 汇总指标、银行/主体类型/系统编码 3 类问题、四列字段表、`#tableFilter` 三个选项、底部保存提示/返回/重置/继续、`#confirm`/ `#precheck` / `#done`。响应式 @max-width:850 / 520 / 680 见 L28–L36；不要硬抄阈值覆盖当前 Eidos 主题，但应保留可用语义。
- **交互 L132–163、L180–212、L238–287**：原型初始化与 localStorage、`state.maps` 当前选择、重复目标占用、`attention` vs `unmatched=__PENDING__`、字段状态、`changed()` 触发 render、`prepare` 及 schemaConfirm、rerun 和假 final、重置/继续。**仅凭这一节就能恢复已查阅参考遗产，无须新窗口重新网上搜相同设计。**

### 5.2 Action 工件和真实脚本截图

| 证据 | 真实链接 / 定位 | 可得到什么、没得到什么 |
| --- | --- | --- |
| **最终 6bde025 真实 BEX Host 图/日志** | [run 39563551706](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551706) / [artifact 12328632650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551706/artifacts/12328632650)（名称 `bex01-real-host-chromium-evidence`，API 2026-10-22 查询未过期，计划到期 2027-01-19 07:39 UTC） | 真实隔离 Host Chromium 测试 PASS，test 源声明截图名：`v3-prototype-parity-issues-desktop.png`、`v3-prototype-parity-issues-phone.png`、`v3-prototype-parity-submit-desktop.png`、`v3-prototype-parity-submit-phone.png`、`v3-connected-issues-*.png`、`v3-file-footer-reset-*.png`、`v3-retained-xlsx-ready-172.png`、`v3-retained-xlsx-172-detail.png`；**需从 ZIP 实际查核文件**，本窗口没有直接逐张检视图片内容。 |
| **Window 12 16/4/3 同态连续滚动帧** | [run 39549354838](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838) / [artifact 12322028969](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838/artifacts/12322028969)，对应 Window 12 详细索引 G03 | 已保存旧索引注明 `v3-visual-parity-desktop-contiguous-00..02.png`（3 帧）、`v3-visual-parity-phone-contiguous-00..05.png`（6 帧）以及 scroll manifest；属于**历史证据**，不是最终 6bde025 的图，也不是本窗口重新解压每一帧。 |
| **失败反证：rerun 初版** | [run 39561222212](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39561222212) / [artifact 12327872053](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39561222212/artifacts/12327872053) | 首个重新预检真实执行且 3 行仍无效，但点击接续行更正超时；用于解释双重刷新/测试等待问题，**不是最终 PASS**。 |
| **PA Agent 首轮/重试** | [run 39563551676](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551676) attempt 1/2 | 最终 PASS，首轮 `MOCK_MODEL_CALL_NOT_SEEN` 保留；与 BEX 业务隔离。 |

**过期风险**：GitHub Actions artifact 有有效期；表格记录的是 API 查询时的过期时间，非永久保存。若未来打不开，先查 Actions API 或根据测试源重新生成，不能编造不存在的 `sandbox:/mnt/data` 路径。旧聊天用户提供的局部四张截图（Window 12/更早文件名 `image(20261016-123851).png`、`...123943.png`、`...124020.png`、`...124036.png`）**二进制未由本窗口保存到 GitHub**，只有旧索引的描述/附件线索。

## 6. 准确落点及下一步执行清单

| 位置 | 已有能力/责任 | 最小下一步与门禁 |
| --- | --- | --- |
| `AI-BOOTSTRAP.md` / `LLM.md` / `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` §5 / `docs/governance/FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0.md` | main 上的项目级“源码优先 + 集中同根因 + 三维分验”权威（#1097 已合） | 新窗口先按这些入口执行，**不重做已合并规范**。 |
| #1086：`apps/data-import/page.ts`、`actions.ts`、`service.ts`、`row-correction-page.ts`、`apps/object-extension/batch-page.ts` | Job 字段映射、来源样本和 issue、Host 写操作、独立人审/字段批准/行纠错 | 制定剩余真实功能差异清单；有准确复现再补 Owner 分支并精准验证。 |
| #1086：`vendor/eidos/src/runtime/{contracts,validate}.ts`、`vendor/eidos/src/renderers/html/index.ts`、`vendor/eidos/src/app-host/{page-controller,browser-shell}.ts`、设计语言 CSS | 通用 opt-in 交互、状态反馈、选择值筛选、指标保护、单次刷新、响应式 | 做任何共享修改前先检查其他窗口并复用 Eidos 可选能力，避免冲突/破坏其他业务。 |
| `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`、`tests/protocol/bex01-v3-*.test.mjs`、`tests/protocol/data-import-human-experience.test.mjs` | 真实隔离 Host/桌面/手机/恢复/安全/原始列保全/三项错误重新检验 | 每批先定向再最终 HEAD 全量 CI；Human 独立用截图与真实操作签收。 |
| `docs/ui-design-reviews/bex01-v3-m06-live-map-choices-20261021.md`、`bex01-v3-m06-real-precheck-rerun-20261021.md` 和本套 Window 13 两份文档 | 已实施增量解释、真实来源 URL、失败保全与准确状态 | 不覆盖旧 Window 12；更新后续 #1086 评论记录新 HEAD。文档 PR 与业务 PR 分开，暂不合并。 |
| M04 / M05 / M06 | 真实客户 XLSX 与授权数据、最终业务导入、功能/布局/颜色 Human 100% 签收未完成 | **3/6 OPEN 边界保持**；取得实际授权与用户视觉评审前不得将自动化 PASS 擅自升级成真实客户/生产/人审。 |

## 7. 尚未保存或无法替代的原始材料（坦诚列出）

1. **没有保存新的外站原始网页副本或网页截图**：本窗口实际依赖 GitHub 直接读取；旧 10-14/15/19 的飞书、Lark、简道云、Microsoft、Airtable、NN/g 阅读/搜索等级只存在在此前研究索引，**本次没有重爬，也没有新搜摘要**。
2. **没有重新取得或在本 docs-only PR 增加客户原始** `往来账户2026_10_08_10_15_23.xlsx`、授权 Import Job 的真实现场数据、两同名银行真实 ID/用途、3 条客户真实主体身份决策；没有取得可用于 M04/M05 的新授权签收。
3. **没有在本 docs-only PR 上传 PNG/ZIP 二进制附件**：可再下载的 GitHub Actions artifact 精确链接/当前有效期见 §5，旧用户聊天四图原始二进制仍未入 GitHub；不能用这些来源的文字摘要代替未来 Human 全页对比。
4. **没有生产部署或登录线上 Human 验收**。不改变其他 Owner 分支及部署配置；除完整三维差异和人审尚未签署外，没有根据猜测新增一个“已经完成”的里程碑。
5. **本两份 Window 13 文档的最终提交 SHA / Draft PR 号码**由当前交接创建操作产生，见 GitHub 新文档分支和 PR；避免在生成前写假 SHA。下一窗口从这两个链接的实际 HEAD 读取即可，不将 #1086 的业务提交 SHA 混同为文档 commit。

