# BEX-01 V3｜M06 高保真工作台接续入口（2026-10-20）

> **新窗口先读本页，再读[详细研究资料与决策索引](BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)。** 然后按需要读取 [M04 前序简短交接](BEX-01-V3-M04-WINDOW-HANDOFF-ENTRY-20261019.md)、[M04 详细索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[V3 总研究遗产](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)，以及 [#909 原型 PR](https://github.com/jiangxng/EVO-App-Platform/pull/909)。这些文档是不同时间点的记录；**当前状态以本页“最新核验快照”为准**，旧文档不回写覆盖。
>
> **保存位置：** 文档专用分支 `docs/bex01-v3-m06-research-window-handoff-20261020`，从 Platform `main@5919e0147232fef1ddfc4f7e9a38b67969100bcf` 创建；不直接推 `main`，不修改 `project.status.json`、Railway 配置、PA05 或其他窗口工作。本文与详细索引为本次新增，是否合并以该文档 PR 为准。

## 一、不可改变的目标与决定

完成 EVO-App-Platform / BEX-01 供应商导入 V3 高保真审核工作台，**按 #909 原型继续实现，目标是 100% 还原；在页面达到目标并完成人工视觉签收前，不启动真实客户 Excel 业务验收**。不得需求偏移、扩大范围或为了增加 PR 数重复实现已有功能。

- **Eidos**：通用工作台、表格/卡片响应式、可逆布局与通用交互；不得写入供应商、开户银行、Import Job 等 Platform 业务语义。
- **Platform**：真实 Import Job、字段业务语义、Host 权限、草稿、预检、提交和审计；仅由 Host 选择哪些内部路由启用宽审核模式。
- 1280px 桌面审核页需提供足够宽的审核表（当前测试目标为约 1200px 内容上限），390px 必须使用合适的手机布局，不能保留挤压桌面表格。
- 自动聚焦只是布局行为；不能覆盖用户已保存的侧栏偏好。原侧栏按钮、活动栏和 Ctrl/Cmd+B 必须能主动恢复导航。
- 两个同名“开户银行”不得按顺序、标签或 LLM 高置信度自动猜选 field ID。Recipe 只能在 Human 明确选择并通过预检后按原契约复用。
- `SUPPLIER` 是往来角色，不是 `ORGANIZATION` 身份证据。三条真实缺失主体类型记录必须按真实证据逐条确认。
- CI PASS、部署 SUCCESS、合成 Host 旅程和历史截图均不能代替客户真实数据验收或 Human 视觉签收。

## 二、最新核验快照（2026-10-20）

| 项目 | 当前准确状态 | 证据与限制 |
|---|---|---|
| Platform `main` | `5919e0147232fef1ddfc4f7e9a38b67969100bcf` | 直接读取 GitHub branch API |
| Railway production | `main@5919e014…`，deployment `5b921757-ca9e-4b48-9eba-595a5b6f6459`，`SUCCESS` | 直接读取 Railway deployment；本轮没有部署新代码 |
| Eidos `main` | `1b651737182c083bdb945e30c4d16b9ecacbc1e1` | 直接读取 GitHub branch API |
| Eidos [#202](https://github.com/jiangxng/eidos/pull/202) | 未合并；HEAD `f3e2b5ec4d90ababa43b343c0008295243a19ca6`；CI 与 Human UI gate PASS | [CI run 39285222302](https://github.com/jiangxng/eidos/actions/runs/39285222302)、[Human gate 39285222230](https://github.com/jiangxng/eidos/actions/runs/39285222230)。通过仅表示该 HEAD 的工作台门禁通过，不表示 Platform 已完成 |
| Platform [#1054](https://github.com/jiangxng/EVO-App-Platform/pull/1054) | **Draft / 未合并**；HEAD `3845c9d953943a3f962ad298669fc66c46956758`；两项关键检查失败 | [Platform CI 39285016324](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016324) 与 [Real Host Chromium 39285016537](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016537) |
| 原型 [#909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | 仍为 Draft / Open；原型源码在独立设计分支 | 原型不是生产页面，也不是已合并的业务实现 |
| 客户数据 | 尚未完成真实验收 | 原客户 Excel、授权 Job、真实银行 field ID/用途与三条身份仍须授权后核对 |
| 总体里程碑 | **3/6 完成** | M01–M03 工程完成；M04 部分完成并 OPEN；M05 OPEN；M06 建设中并待 Human 签收 |

### 需要特别注意的两个新发现

1. Platform CI 的单个失败位于 `tests/app-host/mobile-design-language.test.mjs:68`：旧断言只接受 `browserToolbar.append(globalControls)`，但当前通用工具栏加入了聚焦按钮，实际代码是先追加聚焦按钮再追加 `globalControls`。这是结构断言与新增通用控件不一致；新窗口应更新测试表达正确不变量，不应删除必要的聚焦按钮来迎合旧断言。
2. Real Host Chromium 的 390px 场景失败：`PHONE_TABLE_SHOULD_REFLOW_TO_CARDS`。诊断确认 viewport=390、CSS 成功加载，但 `cardsDisplay=block` 且 `tableDisplay=table`，即手机端仍显示表格。该失败必须调查真实 CSS/DOM 选择器与级联原因，**不能简单放宽或删除测试**。本轮 run 后面的 V3 专项截图步骤因此被跳过。

Platform #1054 分支与当前 main 已发生分叉：compare 结果为相对 `main@5919e014…` **ahead 51 / behind 43**，共同基点 `504554d151081324645ab6d180872c720eaa25d8`。不要直接合并或盲目 rebase；先检查差异中的提交、其他窗口工作与可安全同步的最小变更。

## 三、M01–M06 固定状态表

| 里程碑 | 状态 | 已有工程证据 | 尚余门禁 |
|---|---|---|---|
| **M01 四列审核** | 工程完成 | #973/#978/#981/#984/#989 等既有 PR 已合并；历史适用 CI PASS | 最终 1280px/390px 视觉归 M06 |
| **M02 批次审核** | 工程完成 | #991/#993/#996 已合并；真实隔离 Host 与批次常量/方案预览回归 | 客户真实主体身份归 M04 |
| **M03 草稿恢复** | 工程完成 | #999/#1028 已合并；历史适用 CI 与部署成功 | 真实授权客户会话仍不能由隔离测试替代 |
| **M04 客户数据验收** | **部分完成 · OPEN** | #1033/#1035/#1037/#1039 的工程安全子项已完成 | 原 Excel、授权 Import Job、两个银行字段真实 ID/用途/样本、三条真实主体身份 |
| **M05 真实完整导入** | OPEN | 既有隔离 Host / Recipe 回归 | 真实权限、预检失效重跑、幂等、明确提交、最终审计 |
| **M06 V3 高保真** | **建设中 · OPEN** | #909 原型；Eidos #202 当前 CI/Human gate PASS；Platform 有新增布局代码但当前 CI 失败 | 修复 Platform 两项失败、对照原型 1280px/390px、当前截图证据、Human 签收 |

**总进度保持 3/6，不因 Eidos #202 单独通过而提升。**

## 四、新窗口唯一执行顺序

1. 先读本页与配套详细索引，刷新 GitHub main、#909/#202/#1054 的 HEAD/CI、Railway；不能沿用本页 SHA 当永久最新状态。
2. 先处理 Platform #1054 当前失败：修正旧结构断言；定位 390px 表格未切换卡片的真正原因；不要为了过 CI 牺牲既有手机体验。
3. 由于 #1054 分支相对 main 分叉，先审查 compare 结果并与并行窗口隔离，拟定最小安全同步策略；不直接推 main、不盲目合并/rebase。
4. 重新运行精确 HEAD 的 Platform CI 和真实 Host Chromium；确保 V3 专项步骤真正执行并保存新截图。逐项对照 #909 的文件卡片、问题区、四列映射、步骤导航和底部操作区，分别检查 1280px 与 390px。
5. 只有当前截图和真实页面达到 V3 原型并由用户签收后，才进入 M04 真实客户数据验收；如果原 Excel/授权 Job 不可得，保持 M04 OPEN，不造合成客户事实。之后才继续 M05。
6. 持续保持 M01–M06 六行状态表；不修改 `project.status.json`，不切 Railway 到 release，不覆盖 PA05、Eidos 其他工作或插件治理分支。

## 五、资料和证据边界

本次没有重新开展竞品/外站研究；外部参考网址与历史阅读等级继承自 [M04 详细索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) 和 [2026-10-15 UI/业务研究索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[业务流程研究索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。本次新读的是 GitHub 原型、源码、PR、Actions 日志、部署元数据；具体 URL、结果、方案比较和未决冲突见[详细索引](BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)。

尚未取得/永久保存：客户原始 `往来账户2026_10_08_10_15_23.xlsx`、受权客户 Import Job、真实银行字段身份与用途决定、三条真实主体身份、用户原始四张参考 PNG 的永久仓库附件，以及本轮最新 V3 专项 Chromium 截图。最新失败 run 的 artifact 可查阅，但本轮尚未下载检查其内部文件清单；不得声称它包含已跳过的 V3 专项截图。


## 2026-10-20 续跑 #08 最新执行状态

> 详细证据、截图文件名、原型差异与纠正理由见[详细研究资料与决策索引 §续跑 #08](BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)。

- Platform main 最近一次核验为 `eaa5e813b1e86a6460d988c76eb2076512c35127`；Eidos main 为 `1b651737182c083bdb945e30c4d16b9ecacbc1e1`。PR #1060 当前候选 `def4fa6c99a72e17f6de5569b28307ba2a77e878` 已基于该 Platform main，compare ahead 25 / behind 0；仍为 Draft，未部署。
- 精确 HEAD `def4fa6…` 的 Platform CI、Real Host Chromium、In-Context Import Resume、Human UI Design Review Gate、Lightweight Host Architecture 均 PASS。浏览器 artifact 为 [12242119759](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762771/artifacts/12242119759)，已实际打开桌面/手机 PNG。真实 Host Chromium 5/5 场景通过；V3 source audit、row correction、batch constant restore、172×22 synthetic XLSX 的 V3 专项步骤实际执行并通过。
- 复核 artifact 后发现 `report.json` 的页数和行数元数据落后于测试断言。已提交修正 `6d77dcf22324a9039f315432598892b8dc5d6e07`（分页报告改为 25/25/4，样本报告改为 54 行）；**新 HEAD 的 CI/Chromium 仍需重跑确认，暂不记为最终 PASS**。
- 最新截图已证明：标题“核对导入数据”、文件摘要、四列映射表、1280px 桌面和 390px 卡片布局正常。仍未签收：当前映射截图是 0 项 mapping attention 状态，未覆盖原型中的银行同名字段/主体类型/系统编码三类 issue box；顶部三步表达与原型两阶段不同；底部返回文件/恢复初始选择动作尚未对齐。不得把自动化绿灯等同 100% 视觉还原。
- 下一步：等待 `6d77dcf…` 精确 HEAD 的 Platform CI 和 BEX-01 Real Host Chromium；检查新 artifact 的报告数据一致性；随后为未决字段创建隔离 Host 映射状态截图，审查 Host 安全动作契约，再按 #909 逐项修正。继续保持 Draft、不部署、不合并。
- M01–M03 工程完成；M04 客户真实数据 OPEN；M05 真实完整导入 OPEN；M06 高保真/人类视觉签收 OPEN；总体 **3/6**。客户文件、授权 Job、银行字段真实身份/用途和三条真实主体身份仍未取得。


## 2026-10-20 续跑 #10：行级问题区已验证，下一项是原型组合异常状态与底部动作

- 候选 HEAD `dfc1cea0c6b74e21746769c04bd72047204572ca` 的 [Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716071)、[Real Host Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067)、[In-Context Resume](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716088) 均 PASS；PR #1060 仍 Draft。
- 新 artifact [12244670622](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067/artifacts/12244670622) 已直接检查：`report.json` 为 54 条隔离供应商、分页 25/25/4、5/5 通过。新增截图 `v3-map-row-issues-desktop.png`（1280px）与 `v3-map-row-issues-phone.png`（390px）显示失败预检后映射页出现三条主体类型缺失的问题卡片；手机无横向溢出。
- 代码已把持久化 dry-run 行问题按字段/错误码聚合到 Eidos 通用问题区，不自动执行 dry-run、不推断主体身份、不改变映射或提交。该项已通过真实 Host 验证。
- 下一步：创建同时包含银行同名字段歧义、主体类型多行缺失和系统编码未决的隔离映射状态；核对三类问题卡片顺序与跳转。随后审查底部“返回文件/恢复初始选择/预检查并继续”与现有 Host/Eidos 动作契约，避免添加无行为按钮。
- 仍需处理步骤条两步/三步视觉差异；保持预检查与明确提交的安全门禁。当前 main 最近核验 `eaa5e813b1e86a6460d988c76eb2076512c35127`，如前进须重新 compare。未部署、不合并、不修改 `project.status.json`。
- M01–M03 完成，M04/M05/M06 OPEN，总体 3/6；客户真实文件/Job/银行字段身份/三条主体身份仍未取得，Human 视觉签收未完成。


## 2026-10-20 续跑 #11：最新精确 HEAD、真实 Host 截图与当前差距

> 本节为追加记录，不回写上文历史快照。动态状态以 GitHub 当前分支/Actions 为准。

- Platform main 最新核验：`eaa5e813b1e86a6460d988c76eb2076512c35127`。实施 PR [#1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) 当前 HEAD `dfc1cea0c6b74e21746769c04bd72047204572ca`，Draft / Open；相对最新 main compare 为 ahead 29 / behind 0。未合并、未部署。
- 精确 HEAD 的 [Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716071)、[Real Host Chromium Supplier Journey](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067)、[In-Context Import Resume](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716088)、[Human UI Design Review Gate](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716228)、[Lightweight Host Architecture](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716062) 均 completed / success。
- 已下载并实际检查 Real Host Chromium artifact [12244670622](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067/artifacts/12244670622)。报告明确为隔离 Host、54 条已提交供应商记录、Headless Chromium 141、5/5 场景通过、无浏览器错误；它不证明 iOS Safari、物理 Android Chrome 或弱网/实体手机键盘。
- 截图清单中实际存在 1280px 桌面审核页 `v3-fidelity-workbench-map-1280.png` 与 390px 手机首屏 `v3-fidelity-first-viewport-batch-390.png`，以及行级问题区桌面/手机截图、完整映射滚动截图和 172×22 合成 XLSX 的桌面/手机截图。当前两张主要截图已从 artifact 打开检查。
- 桌面截图显示正式 Host 已有“核对导入数据”标题、文件摘要、四项指标、四列映射表；手机截图显示标题、文件摘要、响应式指标卡片与步骤导航，无横向溢出。但这只能证明布局和功能旅程，不能判定 #909 视觉 100% 还原。
- 已确认仍需逐项人工比对的差距：原型采用文件/审核阶段的明确组织方式；当前 Host 顶部以三项步骤状态表达；原型底部 `.actionbar` 的返回、恢复初始选择、预检/继续与明确提交需要与当前 Host 的实际动作逐项核对，不能新增没有 Host 行为的装饰按钮；必须同时查看包含银行同名字段、主体类型缺失、系统编码未决的组合异常状态，而非只看普通映射首屏。
- 最新浏览器证据可用但尚未 Human 签收；截图均为隔离合成数据。客户原始 Excel、授权 Import Job、银行字段真实 ID/用途和三条真实主体身份仍缺失。保持 M04/M05 OPEN，M06 OPEN，总体 3/6。
- 下一步：对照 #909 的原型源和最新实际截图建立逐项差异表；先修正有明确证据的正式页面差异，再运行新的精确 HEAD CI/Chromium 并重新取证。不得以当前 5/5 自动化 PASS 替代视觉签收。


## 2026-10-20 续跑 #12：两阶段步骤条按 #909 原型收敛

- 原型 HTML 的 `.stage` 明确呈现两个顶层阶段：“选择文件”与“核对并导入”。当前正式 Host 的 `reviewTask.steps` 先前呈现三项：“选择文件 / 核对映射 / 预检查与导入”，将原型内部的预检查/确认/提交子流程抬升为第三个顶层阶段，视觉结构不一致。
- 已在实施分支 #1060 修改 `apps/data-import/page.ts`：顶层步骤改为“选择文件 → 核对并导入”；预检查、Schema 确认、明确提交仍保留为审核流程内部步骤，没有删除安全门禁。
- 已在 `tests/protocol/data-import-human-experience.test.mjs` 增加精确协议断言，锁定两个步骤的 ID、标签与状态。
- 新 HEAD 为 `895ea758a3f8ba6787f9f96f06155afbf9ff05b9`；Platform CI 与 Real Host Chromium 已重新触发，当前状态待完成，不能沿用上一个 HEAD 的 PASS。
- 此修正是按 #909 原型源码直接对齐，不是新增需求。下一步等新 HEAD CI/Host Chromium 通过后，下载最新 artifact，检查步骤条与底部操作区截图，再继续收敛问题卡片和文件卡片。
- 仍未部署/合并；M04/M05 OPEN、M06 OPEN，总体 3/6。


## 2026-10-20 续跑 #13：同步修正 V3 浏览器断言

- 两阶段步骤条改动后的 Platform CI 通过，但 Real Host Chromium 在 V3 XLSX 子步骤失败；日志精确显示浏览器断言仍要求 `[data-eidos-form-task-steps] li` 数量为 3，而实际页面正确返回 2。
- 已修正 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` 的步骤数量断言为 2，与 #909 原型一致。没有恢复第三个顶层步骤，也没有移除预检查、Schema 确认或明确提交。
- 当前候选 HEAD 为 `0a135314c32fcd0633cedf1ac7dda1ad9be66407`。Platform CI、Real Host Chromium、In-Context Resume 等检查已重新触发；状态待完成。不要沿用 `895ea758…` 的 Real Host Chromium failure 或更早 HEAD 的 PASS 作为本 HEAD 最终结果。
- 下一步等待最新精确 HEAD 的所有适用门禁，重点确认 V3 XLSX 子步骤走完并产出新 artifact。仍未合并/部署；M04/M05 OPEN、M06 OPEN，总体 3/6。


## 2026-10-20 续跑 #14：真实 Host 证据复核与原型差异登记

- 当前 Platform `main`：`eaa5e813b1e86a6460d988c76eb2076512c35127`。实施分支 `feat/bex01-v3-real-fidelity-clean-mainline-20261020` 的候选 HEAD `6049c5875adecadef7b353fbc8861acc5c154ecd` 相对 main ahead 36 / behind 0；没有必要再盲目 rebase。
- 精确 HEAD `6049c587…` 的 Platform CI PASS（run `39384540039`）、BEX-01 Real Host Chromium PASS（run `39384540028`，5/5）、In-Context Resume PASS（run `39384540118`）。Host 截图 artifact ID `12246513104`，含桌面 1280px、手机 390px、映射异常区和连续滚动/底部操作区证据。
- 最新文档更新 HEAD `107fbceb1c26043bd01ef2791e25068c3f474767` 已触发新一轮 CI；Platform CI 与 BEX-01 Real Host Chromium 当时仍在运行。不得把 `6049c587…` 的 PASS 继承成 `107fbceb…` 的最终结果。
- 已实际打开对照 #909 原型 artifact ID `11957646429` 的 `01-desktop-overview.png` / `03-complete-field-table.png` 与真实 Host 的 `v3-fidelity-workbench-map-1280.png`、`v3-fidelity-first-viewport-batch-390.png`、`v3-map-row-issues-desktop.png`、`v3-map-row-issues-phone.png`、`v3-e4-map-desktop-submit.png`。
- 差异已记录在 `docs/ui-design-reviews/bex01-v3-decision-first-live-fidelity-20261019.md` 的 2026-10-20 复核附录：原型文件卡片有更强的 XLSX 类型图标/信息层级；原型展示三种不同问题并逐项行动，当前问题截图仅包含 3 条主体类型缺失，因而只能呈现一个聚合问题卡；映射表四列已存在但 fixture 状态与原型不同；步骤条和底部操作区仍需统一状态后逐项核验。
- 下一步不能只改 CSS 或把问题数写死。应建立独立 synthetic 视觉 fixture，复现 #909 的 22 列、16 已匹配、4 待新增、0 忽略、3 类异常状态；采集相同状态的 1280px/390px 连续截图，再修正文件卡片、异常项层级、步骤条和操作区。
- 同一 HEAD 的 PA-01B2 Full Isolated Chrome Host Acceptance 曾以 7/8 失败，具体是普通聊天 transport 场景的 `MOCK_MODEL_CALL_NOT_SEEN`；这是独立 Agent 验收，不要改 PA05/PA01 源码或忽略断言来解决 BEX 任务。
- #1060 继续 Draft，未合并/部署。M04 客户真实数据验收 OPEN；M05 真实完整导入 OPEN；M06 高保真建设中、Human 签收待定；总体进度 3/6。客户原始 Excel、授权 Import Job、两个银行字段真实身份与用途、三条真实主体身份仍未取得。

## 2026-10-20 续跑 #15：精确 HEAD 门禁收敛

- 2026-10-20 07:30 UTC 复核：Platform 实施分支最新 HEAD 为 `107fbceb1c26043bd01ef2791e25068c3f474767`；Platform `main` 仍为 `eaa5e813b1e86a6460d988c76eb2076512c35127`。实施分支相对 main ahead 36 / behind 0，改动路径与主线已分离；不做盲目 rebase。
- 此 HEAD 的 Platform CI PASS（run `39386798443`），BEX-01 Real Host Chromium PASS（run `39386798369`），BEX-01 In-Context Import Resume PASS（run `39386798367`），Human UI Design Review Gate PASS（run `39386798312`），Lightweight Host Architecture PASS（run `39386798311`），PA-01B2 Full Isolated Chrome Host Acceptance 本轮也 PASS（run `39386798382`）。此前 `6049c587…` 的 PA-01B2 失败是较早 HEAD 的结果，不再描述为当前最新状态。
- 最新 BEX 真实 Host artifact ID `12248210391`，报告时间 `2026-10-20T07:30:03Z`，5/5 场景通过、无浏览器错误；截图均来自隔离合成数据。不要把该结果当作客户真实验收或 Human 视觉签收。
- 已将 #909 原型截图与真实 Host 截图实际打开比对，并在 `docs/ui-design-reviews/bex01-v3-decision-first-live-fidelity-20261019.md` 追加了有证据的视觉差异记录。关键差异是原型和当前截图使用不同的数据状态；文件卡片的 XLSX 视觉提示较弱；当前异常截图只有主体类型缺失一类，不能证明原型中的三种独立异常和对应动作已复现；步骤条/底部动作区仍需在同一流程状态下核验。
- 下一步继续实施独立 synthetic 视觉 fixture：目标状态锁定为 22 列、16 已匹配、4 待新增、0 忽略、3 类问题；用同一状态分别采集 1280px 和 390px 截图，再修复差异。禁止把真实客户身份、银行字段用途或导入证据合成出来。
- #1060 仍为 Draft、未合并/部署；当前 CI 通过不等于视觉签收。M04 客户真实数据 OPEN，M05 真实完整导入 OPEN，M06 待 Human 视觉签收，总体进度 3/6。不得改 `project.status.json`，不得切换 Railway 到 release。

## 2026-10-20 续跑 #16：提交计数校正

- 计数更正：#15 记录的 `107fbceb…` 分支 ahead 36 是按当时快照记录；本次再次调用 GitHub 双向比较，当前 main `eaa5e813…` 到实施分支 `107fbceb…` 为 ahead 37 / behind 0。新增的一个差异来自已追加的视觉审查文档提交。behind 仍为 0，因此无需 rebase；提交数不影响此前精确 HEAD CI 结论。
- 当前实施 HEAD 仍为 `107fbceb1c26043bd01ef2791e25068c3f474767`；该 HEAD 的 Platform CI、BEX Real Host Chromium、In-Context Resume、Human UI Design Review Gate、Lightweight Host Architecture、PA-01B2 Full Isolated Chrome Host Acceptance 均 PASS。最新 BEX artifact ID `12248210391`，5/5，浏览器错误为空。
- 继续保持 #1060 Draft，未合并/部署。下一步是建立独立 synthetic 视觉 fixture 并对照 #909，而不是继续重复跑已经通过的相同测试。
## 2026-10-20 续跑 #17：三类问题高保真状态与真实 Host 证据

### 已完成的实施与证据

- 当前 Platform 实施 PR：[#1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060)，仍为 Draft，未合并、未部署。代码验收 HEAD `0e3aec5b7c1e4be6f8f1454ea51b05cb18f7b161` 的 Platform CI、BEX-01 Real Host Chromium、In-Context Import Resume、Human UI Design Review Gate、Lightweight Host Architecture、PA-01B2 Full Isolated Chrome Host Acceptance 均 PASS。后续追加视觉评审文档形成 `0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23`，这是 docs-only 提交，需以该精确 HEAD 的新门禁结果为准。
- 新增隔离 synthetic visual-review job：22 列、172 行；16 已匹配、4 待新增、0 忽略、3 类问题。该 job 不使用客户数据，未执行业务提交。
- 真实 Host Chromium 运行：[BEX-01 Real Host Chromium Supplier Journey](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391545718)，5/5 既有浏览器旅程通过，额外 V3 visual-review fixture 的断言也通过。最新 artifact ID `12249767148`，包括 `v3-prototype-parity-issues-desktop.png`、`v3-prototype-parity-issues-phone.png`、`v3-prototype-parity-submit-desktop.png`、`v3-prototype-parity-submit-phone.png`。
- 问题卡现在按原型顺序显示：开户银行存在多个对应字段 → 选择字段；3 条记录缺少主体类型 → 查看记录（第 165、169、172 行）；「系统编码」尚未选择处理方式 → 处理此列。问题数量、行号和操作均来自 Host 状态，不是前端伪造。

### 设计边界

- Platform 页面负责业务问题标题、行号、动作语义；Eidos 负责编号卡片、边框和手机端按钮布局。
- Eidos owner-layer 独立 PR [#204](https://github.com/jiangxng/eidos/pull/204) 已补充 Human UI 设计审查记录，CI 与 Human UI Design Review Gate 均 PASS；仍为 Draft，未合并，也不修改 PR #202。
- 已排除为通过测试而放宽断言或将按钮做成纯装饰的方案。

### 仍未完成

- 文件卡尚缺 XLSX 文件类型徽标。
- 底部仍只有当前有效的保存映射并预检查和 AI 自动匹配；原型中的返回文件、恢复初始选择尚未实现，需先定义真实导航/原生 reset 语义，再实现。
- 完整 1280px/390px 原型逐项核对与 Human 视觉签收仍未完成。自动化 PASS 不等于视觉签收。

### 当前基线与项目状态

- Platform `main`：`eaa5e813b1e86a6460d988c76eb2076512c35127`。
- 实施分支相对最新 `main` 为 ahead 43 / behind 0（以 `0f5b5b3…` 文档提交后的双向比较为准）；无需 rebase，不直接推 main。
- 不改 `project.status.json`，不切换 Railway 到 release，不覆盖 PA05/Eidos 其他工作。
- M01–M03 完成；M04 客户真实数据 OPEN；M05 真实完整导入 OPEN；M06 高保真建设中、待 Human 签收。总体进度仍为 3/6。客户 Excel、授权 Import Job、两个银行字段真实身份与用途、三条真实主体身份仍未取得，禁止用 synthetic fixture 冒充客户证据。