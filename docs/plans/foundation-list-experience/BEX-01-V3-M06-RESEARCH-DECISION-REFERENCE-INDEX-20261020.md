# BEX-01 V3｜M06 高保真工作台研究资料与决策详细参考索引（2026-10-20）

> **配套简短入口：** [BEX-01 V3 M06 窗口接续入口](BEX-01-V3-M06-WINDOW-HANDOFF-ENTRY-20261020.md)。本页记录本窗口 #05–#06 接续中的直接读取来源、源码审查、CI 失败证据、方案取舍、截图/附件位置及下一步实现落点；不覆盖或改写 [M04 前序交接入口](BEX-01-V3-M04-WINDOW-HANDOFF-ENTRY-20261019.md)、[M04 详细索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) 或 [V3 总研究索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)。
>
> **核对快照日期：2026-10-20。** Platform main `5919e0147232fef1ddfc4f7e9a38b67969100bcf`；Eidos main `1b651737182c083bdb945e30c4d16b9ecacbc1e1`；Railway production 当前记录为 Platform main 同 SHA、deployment SUCCESS。PR/CI 与部署是动态状态，后续窗口必须重新查询。
>
> **证据等级：**
> - **R（本轮直接读取）**：GitHub 原型 HTML、TypeScript/CSS/MJS/Python 源码、PR 元数据、Actions 日志/作业结果、Railway 部署元数据。
> - **H（继承历史研究）**：本轮直接读取了 GitHub 中已保存的研究索引，但没有重新打开索引列出的外部网站原文。其原始网址、历史阅读日期与 A/B/C 阅读等级均以旧索引为准。
> - **D（待验证）**：还没有证据或需要修复/重跑才能确认的事项。
> - **源事实与项目判断分开**：CI 日志/源码属于源事实；“不能弱化手机测试”“必须 Human 选择歧义字段”是用户已确认的 EVO 决策或本项目工程判断，不能伪装成外部研究结论。

## 1. 本轮目标与边界

本轮不是重新开展 UI 竞品研究，而是接续 V3 高保真工作台建设，修复桌面宽审核和可逆导航的边界，并确认最新的 GitHub CI、原型状态和生产部署。用户明确要求按 #909 原型 100% 还原；页面未完成且未由 Human 签收之前，先不要开始真实客户 Excel 业务验收。

- **设计基准**：#909 中的 V3 交互 HTML 原型；不是当前 Railway 生产页面，也不是已合并实现。
- **职责边界**：Eidos 负责通用工作台布局、导航、响应式和控件；Platform 负责导入路由、字段语义、Import Job、Host 权限、预检、提交与审计。
- **禁止范围扩张**：不重新做已经完成的外站研究；不重做 M01–M03；不更改客户字段语义；不把供应商业务规则写进 Eidos；不直接推 main；不切 Railway 到 release；不修改 `project.status.json`，不覆盖 PA05、插件治理或其他并行窗口。
- **固定进度**：M01–M03 工程完成；M04 客户真实数据验收仍 OPEN；M05 真实导入全链路仍 OPEN；M06 视觉/交互 Human 签收仍 OPEN。总计仍为 **3/6**。

## 2. 本轮直接读取的 GitHub / Railway 来源（R）

| ID | 标题、原始网址与读取日期 | 直接读到的事实 | 对项目的具体用途与证据限制 |
|---|---|---|---|
| R01 | [V3 高保真 HTML 原型（#909 的不可变提交 af58e0a）](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，2026-10-20 | 直接读取 30,883 字节的 HTML。关键 ID 包含 `stageOne`、`stageTwo`、`review`、`tableFilter`、`mappingRows`、`saveStatus`、`prepare`、`confirm`、`precheck`、`submit`、`done`；有 `.actionbar`、`.reviewtable`。原型文字明确包含“开户银行存在多个对应字段”“3 条记录缺少主体类型”，并呈现四项审核汇总。 | 最高优先级的设计参照。它是 HTML 演示原型，不是生产页面/真实 Host；原型内的演示字段 ID 和示例数据不能代替客户真实字段证据。 |
| R02 | [#909 原型 PR](https://github.com/jiangxng/EVO-App-Platform/pull/909)，2026-10-20 | PR 仍 Open、Draft，head `af58e0abad880439d54230485305bf2b4e05decc`，base `5a46f846b81fe1c2a244371e0783b906cfe170c5`，当前元数据的 mergeable 为 false。 | 原型需要直接作为视觉基准继续核对；不能称原型已合并或已部署。由于其分支可能落后，读取时应使用不可变提交链接。 |
| R03 | [Eidos #202](https://github.com/jiangxng/eidos/pull/202)，2026-10-20 | Open、未合并；head `f3e2b5ec4d90ababa43b343c0008295243a19ca6`；base 与当时 Eidos main `1b651737182c083bdb945e30c4d16b9ecacbc1e1` 相同。 | 通用路由聚焦布局的 owner PR；仍需与 Platform vendor 副本和后续发布顺序协调。 |
| R04 | [Eidos Workbench shell.ts（精确提交）](https://github.com/jiangxng/eidos/blob/f3e2b5ec4d90ababa43b343c0008295243a19ca6/src/workbench/shell.ts)，2026-10-20 | 直接读取 `updateFocusedRoutePresentation`、`setActivity`、`toggleSidePanel` 等实现。发现最初把 `state.sidePanelVisible` 当作启用路由聚焦的必要条件；随后修正为分离“路由符合聚焦条件”与“侧栏当前可见”，并加入 `preserveExplicitNavigationReveal()`。 | 修复“侧栏原本关闭导致 V3 宽表仍受 1100px 表单宽度限制”及“Ctrl/Cmd+B 或活动栏显式打开后又立即隐藏”的通用布局问题。此为源码事实；浏览器效果仍需 Platform 当前 HEAD 的实际测试证明。 |
| R05 | [Eidos productive-workbench-css.ts（精确提交）](https://github.com/jiangxng/eidos/blob/f3e2b5ec4d90ababa43b343c0008295243a19ca6/src/design-language/productive-workbench-css.ts)，2026-10-20 | 直接读取桌面 `min-width:701px` 的聚焦规则、工作区宽度 `min(var(--eidos-focused-workspace-content-max,1200px),100%)`，以及 `max-width:700px` 隐藏专用聚焦按钮的规则。 | 聚焦只由 Host 显式匹配路由触发，不是全站永久宽布局；手机沿用现有单列/导航行为。CSS 规则本身不证明 390px 页面没有横向溢出。 |
| R06 | [Eidos Workbench 测试（精确提交）](https://github.com/jiangxng/eidos/blob/f3e2b5ec4d90ababa43b343c0008295243a19ca6/tests/workbench/workbench.test.mjs)，2026-10-20 | 增加源码级断言，保护路由聚焦可逆、隐藏侧栏时的宽度逻辑、原导航恢复操作及偏好不被错误覆盖。 | 属于源码/单元测试证据；不能代替 Platform 隔离 Host 的 1280px/390px 浏览器画面或 Human 签收。 |
| R07 | [Platform #1054](https://github.com/jiangxng/EVO-App-Platform/pull/1054)，2026-10-20 | Open、Draft、未合并；head `3845c9d953943a3f962ad298669fc66c46956758`；PR base `504554d151081324645ab6d180872c720eaa25d8`。与当前 Platform main 比较：共同基点为 `504554d…`，branch ahead 51 / behind 43，compare 状态 diverged。 | 该分支包含 V3 工作代码及 vendor Eidos 同步，不能直接合并/盲目 rebase；先审查提交差异并制定安全同步策略。 |
| R08 | [Platform vendor Eidos shell.ts（精确提交）](https://github.com/jiangxng/EVO-App-Platform/blob/3845c9d953943a3f962ad298669fc66c46956758/vendor/eidos/src/workbench/shell.ts)，2026-10-20 | 直接读取同步到 Platform 的聚焦/活动栏/快捷键逻辑。 | Eidos owner 包与 Platform vendor 副本必须保持一致；但同步副本并不等于 #202 已合并或 Platform 已通过 CI。 |
| R09 | [V3 合成 XLSX 保真 Chromium 测试（精确提交）](https://github.com/jiangxng/EVO-App-Platform/blob/3845c9d953943a3f962ad298669fc66c46956758/tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py)，2026-10-20 | 新增 1280px 宽度范围 `1120–1220px`，验证聚焦按钮、侧栏、`Ctrl+B`、活动栏、原持久化偏好；新增独立 1280px 用户上下文，预设 `sidePanelVisible=false`，检查仍可获得宽表且快捷键能显式打开导航；测试中仍包含 390px 手机布局检查。 | 测试目标合理，但当前 Real Host Chromium workflow 在更早的手机供应商列表步骤先失败，后续 V3 专项步骤被跳过。因此此 HEAD 的新断言还没有获得真实运行通过的证据。 |
| R10 | [Platform mobile design language 测试](https://github.com/jiangxng/EVO-App-Platform/blob/3845c9d953943a3f962ad298669fc66c46956758/tests/app-host/mobile-design-language.test.mjs#L68-L80)，2026-10-20 | 旧断言要求源码精确匹配 `browserToolbar.append(globalControls)`；当前通用工具栏新增聚焦按钮后实际为 `browserToolbar.append(focusToggle,globalControls)`，导致 Platform CI 第 27 项失败。 | 初步判断是结构断言没有随新通用按钮更新。修复应验证“globalControls 仍在工具栏且不出现地址栏控件”等稳定不变量，不应移除正确的聚焦按钮以迎合旧文本匹配。该判断需由修复后测试确认。 |
| R11 | [Real Host Chromium 测试脚本](https://github.com/jiangxng/EVO-App-Platform/blob/3845c9d953943a3f962ad298669fc66c46956758/tests/bex01/live_supplier_chromium.py#L260-L335)，2026-10-20 | 最新浏览器 run 在 390px viewport 诊断到 CSS HTTP 200、CSS 长度 130,805、`cardsDisplay=block`，但 `tableDisplay=table`；触发 `PHONE_TABLE_SHOULD_REFLOW_TO_CARDS`，总计 4/5 场景通过。 | 这是实际手机响应式失败。尚未确认是 CSS 级联、DOM 结构、selector 或分支与 main 分叉造成；不可弱化断言或宣称已修复。 |
| R12 | [Platform CI run 39285016324](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016324)，2026-10-20 | 精确 #1054 HEAD 的 Platform CI 失败。日志：1,031 tests，1,029 pass、1 fail、1 skipped；唯一失败是 `tests/app-host/mobile-design-language.test.mjs:68` 的工具栏源码断言。 | 明确的当前失败门禁，不能用其他 workflow success 抵消。 |
| R13 | [Real Host Chromium run 39285016537](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016537)，2026-10-20 | 精确 #1054 HEAD 的桌面/手机 Chromium step 失败；`PHONE_TABLE_SHOULD_REFLOW_TO_CARDS`，4/5 通过。失败后“V3 actual Host source audit desktop and phone”“governed row correction and revert”“batch subject constant”“synthetic 22-column XLSX”后续步骤均 skipped。 | 当前没有该 run 对应的 V3 专项最新 1280px/390px 画面签收证据。 |
| R14 | [当前失败 run 的 Chromium evidence artifact（ID 12201219707）](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016537/artifacts/12201219707)，2026-10-20 | GitHub artifact metadata 显示 `bex01-real-host-chromium-evidence`，约 952,504 bytes，未过期，包含 15 个文件；本轮只核对元数据和日志，没有下载/逐图检查内部文件。 | 可供下一窗口检查日志/截图；由于 V3 专项 step 已 skipped，不得假定其中有新生成的 V3 1280px/390px 截图。 |
| R15 | [此前成功的 Real Host Chromium run 39277312473](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39277312473) 与 [artifact ID 12197673105](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39277312473/artifacts/12197673105)，2026-10-20 查元数据 | 此历史 run 的 head 是 `0ade1040d701f456e362338cadf075e73de6c96a`，workflow success，artifact 约 5,986,397 bytes。 | **不是当前 HEAD**；只能作为历史截图/对比材料，不能覆盖新 HEAD 的手机回归失败。 |
| R16 | [Eidos CI run 39285222302](https://github.com/jiangxng/eidos/actions/runs/39285222302)、[Eidos Human UI Design Review Gate 39285222230](https://github.com/jiangxng/eidos/actions/runs/39285222230)，2026-10-20 | Eidos #202 的精确 HEAD 两项均 completed / success。 | Eidos 的独立通用改动通过了当前自动化门禁；未合并，不代表 Platform vendor 副本或整条 V3 旅程已通过。 |
| R17 | [Platform 当前 main commit](https://github.com/jiangxng/EVO-App-Platform/commit/5919e0147232fef1ddfc4f7e9a38b67969100bcf)、[Eidos 当前 main commit](https://github.com/jiangxng/eidos/commit/1b651737182c083bdb945e30c4d16b9ecacbc1e1)；Railway 当前 deployment `5b921757-ca9e-4b48-9eba-595a5b6f6459` | 2026-10-20 直接核验：Platform main 为 `5919e014…`，Eidos main 为 `1b651737…`；Railway production 为 Platform main 同 SHA、status SUCCESS。 | 生产没有包含当前 #1054 Draft 的未合并修改。本轮没有部署、没有切 release。 |
| R18 | [当前分支中的 V3 设计审查记录](https://github.com/jiangxng/EVO-App-Platform/blob/3845c9d953943a3f962ad298669fc66c46956758/docs/ui-design-reviews/bex01-v3-decision-first-live-fidelity-20261019.md) 与 [Eidos 聚焦布局记录](https://github.com/jiangxng/eidos/blob/f3e2b5ec4d90ababa43b343c0008295243a19ca6/docs/ui-design-reviews/eidos-route-focus-reversible-workbench-20261019.md)，2026-10-20 | 直接读取当前 branch 上的设计记录，确认已记录路由级聚焦、持久偏好保护与 Human 签收边界。 | 新的 M06 交接文档为增量记录，不替换既有设计审查文档。 |
| R19 | [M04 简短交接入口](BEX-01-V3-M04-WINDOW-HANDOFF-ENTRY-20261019.md)、[M04 详细索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[V3 总研究索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)，2026-10-20 | 直接读取 main 中已保存的三份 Markdown，核对历史决策、M01–M06 固定门禁、外站来源阅读等级与客户数据缺口。 | 作为研究遗产索引，不覆盖其历史快照，也不把旧的 CI/PR 状态当作最新状态。 |

## 3. V3 原型的可操作结构与现状冲突

### 原型源事实（R01）

本次读取的 #909 HTML 在不可变提交 `af58e0a…` 中包含：

- 上传与恢复：`stageOne`、`upload`、`resumeImport`、`clearImportDraft`。
- 审核区域：`stageTwo`、`review`、`mappedCount`、`createCount`、`skipCount`、`issueCount`。
- 问题优先处理：`bankIssue`、`subjectIssue`、`metadataIssue`；银行问题的说明是两个同名字段用途不同，主体类型问题是三条记录缺失。
- 映射表：`tableFilter`、`mappingRows`、`tableCaption`，样式含 `.reviewtable`。
- 连续流程：`prepare`、`confirm`、`schemaRows`、`precheck`、`blockers`、`rerun`、`submit`、`done`。
- 操作反馈：`saveStatus`、`.actionbar`、返回/重置/准备/确认/重新预检/提交等操作入口。

这证明原型不仅是一张字段映射表，而是“文件与恢复 → 异常优先 → 四列字段决策 → Schema 受控确认 → 独立预检 → 明确提交 → 结果”的连续审核流程。具体文字、间距、表格列、底部按钮布局仍必须通过对照 HTML 与实际页面截图逐项确认，不能仅凭 ID 列表判定视觉完成。

### 当前实现与原型的冲突

1. 当前 #1054 在 CI 的 390px 手机供应商列表仍显示表格，原型/项目要求的手机可用性没有被证明；这不是 1200px 聚焦 CSS 单独通过就能覆盖的问题。
2. #1054 最新 Real Host Chromium 在通用供应商旅程先失败，后续 V3 专项审查、行级纠错、批次常量、172×22 合成 XLSX 浏览器步骤全部 skipped。因此当前 HEAD 没有最新的 V3 专项截图，不能说“V3 浏览器验收已通过”。
3. Eidos #202 的 CI/Human gate 通过，但 Platform vendor 文件与 Platform 的旧源码测试并未同步更新全部测试不变量；CI 的结构断言失败正说明 owner PR PASS 不能替代 vendor 验收。
4. 原型 #909 仍 Draft、没有部署；生产仍是 main。两者之间的视觉差异必须在真实 Host 页面中逐项比较，不能把原型自带的示例数据或成功提示当作业务事实。

## 4. 方案比较：已采用、排除与适用限制

| 议题 | 已采用方案 | 排除方案与原因 | 适用条件/限制 |
|---|---|---|---|
| 桌面宽审核 | Host 对明确的内部路由调用通用 `shouldFocusWorkspaceRoute(path)`，Eidos 仅提供可逆布局能力 | 全站全局隐藏侧栏/强制宽表；将供应商路由写死进 Eidos | 仅在经 Host 明确选择的宽审核页面启用；不能影响其他应用与普通工作台 |
| 已保存侧栏关闭 | 路由匹配与用户侧栏可见性分开计算；隐藏侧栏仍可获得宽表；没有可恢复侧栏时不显示冗余聚焦按钮 | 把“侧栏已经关闭”当作跳过宽聚焦的理由 | CSS 与实际 Host 页面需通过 1280px Chromium；源码改动已提交，但当前 Platform workflow 先失败，仍待重跑 |
| 显式恢复导航 | 原侧栏按钮、活动栏和 Ctrl/Cmd+B 的明确操作优先；临时聚焦不覆盖用户偏好 | 只允许新增的聚焦按钮退出；让已有快捷键触发后仍被 CSS 隐藏 | 普通页面仍沿用既有持久化规则；需验证不同侧栏初始状态 |
| 390px 响应式 | 保留现有 Eidos 手机导航/单列策略，审核数据应呈现可读卡片或经原型认可的手机形式 | 缩小桌面四列表格、横向挤压；通过删除断言来消除 CI 红灯 | 最新真实 Chromium 明确显示表格仍为 table；必须找出根因并验证修复 |
| CI 失败处理 | 更新过时的结构测试以表达稳定不变量，同时单独修复真实移动端布局 | 仅将源码文本匹配改成更宽松的正则、忽略 390px 失败 | 第一项可能是测试表达过时；第二项是真实 DOM/CSS 结果，二者不能混为一谈 |
| 同名银行映射 | 首次匹配和 EC 只提供可审核候选；Human 确认且预检成功的 Recipe 才可按原 field ID 复用 | 按标签顺序、首个剩余字段、LLM 置信度自动选定 | 这是前序 M04 已确认决策；本轮不重做、不放宽 |
| 主体类型 | 按每条真实记录证据确认，不从 SUPPLIER 推断 ORGANIZATION | 把供应商角色当作组织身份 | 真实客户行与身份仍未取得，不得执行真实客户修正 |
| 分支同步 | 当前先比较分叉提交并制定 bounded 同步策略 | 直接合并或盲目 rebase 51 ahead / 43 behind 的 #1054 | 必须先识别已合并提交、并行工作及最小安全变更；不直接推 main |

## 5. 重要 CI 证据、截图与附件保全

### 当前精确 HEAD 的 CI 状态

- **Eidos #202 @ `f3e2b5ec…`**：CI [39285222302](https://github.com/jiangxng/eidos/actions/runs/39285222302) PASS；Human UI Design Review Gate [39285222230](https://github.com/jiangxng/eidos/actions/runs/39285222230) PASS。PR 仍未合并。
- **Platform #1054 @ `3845c9d9…`**：Platform CI [39285016324](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016324) FAIL，1,029/1,031 tests pass；失败测试为 `tests/app-host/mobile-design-language.test.mjs:68`，期望旧源码字符串 `browserToolbar.append(globalControls)`。
- **Platform #1054 @ 同一 HEAD**：Real Host Chromium [39285016537](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016537) FAIL，4/5 场景通过；390px 供应商列表的 `PHONE_TABLE_SHOULD_REFLOW_TO_CARDS` 失败。后续 V3 专项 Chromium 步骤 skipped。
- 同一 Platform HEAD 的 Project Continuity、In-Context Import Resume、Experience CI、PA-01B2 Full Isolated Chrome Host Acceptance、Lightweight Host Architecture、PA-01B2 Native Chromium Preflight、Plugin CI 与 Human UI Design Review Gate 等 workflow 当前记录为 success；它们不能抵消上述两个失败。

### 已存在的截图/附件

| 位置 | 日期/对应 HEAD | 内容与等级 |
|---|---|---|
| [当前失败 run artifact ID 12201219707](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016537/artifacts/12201219707) | 2026-10-19 16:24Z，Platform HEAD `3845c9d9…` | 名称 `bex01-real-host-chromium-evidence`，952,504 bytes、15 files、未过期。**本次只读了 artifact 元数据和日志，尚未下载逐图检查**。V3 专项步骤在该 run 中 skipped，不能假定它含有这些步骤的新截图。 |
| [历史成功 run artifact ID 12197673105](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39277312473/artifacts/12197673105) | 2026-10-19 15:23Z，较早 HEAD `0ade1040d701f456e362338cadf075e73de6c96a` | 5,986,397 bytes，未过期；历史 Real Host Chromium workflow success。仅用于历史比较，不覆盖最新 HEAD 失败。 |
| 当前 V3 测试脚本期望生成的截图路径 | 对应 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` | 脚本中包含 `v3-fidelity-workbench-map-1280.png`、`v3-e4-task-overview-desktop.png`、`v3-e6-plan-preview-phone.png`、`v3-eidos-v3-batch-17-review-table-phone.png`、`v3-retained-xlsx-ready-172.png` 等输出名。最新 workflow 在到达 V3 专项步骤前失败，**不能宣称这些文件由最新 run 生成**。 |
| 原客户参考截图 | 继承前序 M04 handoff 记录 | 原聊天中的四张 PNG 尚未作为可复用的永久 GitHub 附件保存；仅有历史文字观察/位置记录。新窗口若需要像素级签收，必须确认真实附件仍可访问，不能编造截图链接。 |

## 6. 分支、PR 与文件落点

### 实施线（不要在交接文档分支直接修改这些代码）

- Platform 仓库：`jiangxng/EVO-App-Platform`
- PR：[#1054](https://github.com/jiangxng/EVO-App-Platform/pull/1054)
- 分支：`feat/bex01-v3-real-fidelity-decision-first-20261019`
- 本次快照 HEAD：`3845c9d953943a3f962ad298669fc66c46956758`
- 核心文件：
  - `vendor/eidos/src/workbench/shell.ts)：路由聚焦、活动栏、Ctrl/Cmd+B 和显式恢复。
  - `vendor/eidos/src/design-language/productive-workbench-css.ts)：桌面聚焦宽度和移动端隐藏聚焦按钮。
  - `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py)：1280px 宽度和“原本隐藏侧栏”的独立 Host 回归。
  - `tests/app-host/mobile-design-language.test.mjs)：当前失败的工具栏结构断言。
  - `tests/bex01/live_supplier_chromium.py)：当前 390px 手机表格/卡片失败场景。
  - `docs/ui-design-reviews/bex01-v3-decision-first-live-fidelity-20261019.md)：本分支已有设计决策记录。

### Eidos owner 线

- 仓库：`jiangxng/eidos`
- PR：[#202](https://github.com/jiangxng/eidos/pull/202)
- 分支：`feat/workbench-route-scoped-focus-20261019`
- 本次快照 HEAD：`f3e2b5ec4d90ababa43b343c0008295243a19ca6`
- 文件：`src/workbench/shell.ts`、`src/design-language/productive-workbench-css.ts`、`tests/workbench/workbench.test.mjs`、`docs/ui-design-reviews/eidos-route-focus-reversible-workbench-20261019.md`。
- CI 与 Human UI gate 当前均 PASS，但 PR 未合并；合并/同步应先核对其他窗口是否有更新。

### 本交接包分支

- 本文与简短入口在独立文档分支：`docs/bex01-v3-m06-research-window-handoff-20261020`，从 Platform `main@5919e014…` 创建。
- 不修改旧 M04 入口/索引；不写 `project.status.json`；不直接推 main。
- 文档 PR/最终提交标识以本分支最新 GitHub 元数据为准，不能把本页创建时的初始提交 SHA 当作最终提交。

## 7. 冲突、未决问题与下一步研究方向

### 已发现的冲突

1. **排队状态与最新结果不同**：上一轮 handoff 仍记录 #202/#1054 queued；当前精确 HEAD 已完成，Eidos 两项 PASS，Platform 两项关键失败。以后续精确 SHA 的 Actions 结果为准。
2. **历史成功与当前失败并存**：run 39277312473 在较早 HEAD `0ade1040…` 成功；run 39285016537 在较新 HEAD `3845c9d9…` 手机回归失败。不得将前者当作后者的 PASS。
3. **源代码与旧测试断言不一致**：新通用聚焦按钮已被加入工具栏，但旧测试仍匹配单一 append 字符串。应修正测试不变量而非删除控件。
4. **CSS 声明与实际手机显示不一致**：CSS 已加载且 cards 容器 display:block，但 table 仍 display:table。需要检查 DOM selector specificity、祖先属性、响应式规则来源和当前分支与 main 的差异；根因尚未确认。
5. **分支与 main 分叉**：#1054 branch 相对 main ahead 51 / behind 43，merge base `504554d…`。不要假设简单快进/普通 rebase 安全；先审查提交列表和其他窗口变更。
6. **原型与生产不能混为一谈**：#909 仍 Draft；Railway 仍部署 main；V3 专项最新浏览器步骤 skipped。静态原型、Eidos CI PASS、其他 Host 场景成功都不能代替当前页面视觉签收。

### 仍未解决的任务

- [ ] 更新 `tests/app-host/mobile-design-language.test.mjs` 的过时结构断言，并运行该测试及 Platform CI。
- [ ] 对比 main 与 #1054 的手机 CSS/DOM，定位 `PHONE_TABLE_SHOULD_REFLOW_TO_CARDS` 根因，保留真实断言，修复后重跑 390px Chromium。
- [ ] 先制定 #1054 与当前 main 的最小安全同步方案；确认不会覆盖其他窗口提交。
- [ ] 确认 V3 专项 Chromium 步骤完整执行，取得当前 HEAD 的 1280px/390px 截图并逐项对照 #909。
- [ ] 逐项核对标题、文件卡片、问题处理区、四列映射、底部操作区、步骤流程、保存/预检/提交状态。
- [ ] 用户确认 100% V3 高保真后，才开始 M04 原客户 Excel 与授权 Job 的真实验收；未获文件/授权就继续保持 OPEN。
- [ ] M04 真实证据通过后才进入 M05 完整导入/审计；不提前创建或提交客户数据。

### 外部研究资料的继承边界

本轮没有重新打开飞书、Lark、NN/g、W3C、简道云、伙伴云、畅捷通、WPS 等外部站点，也没有新增搜索摘要。其原始网址、历史阅读日期与等级必须沿用：
- [M04 详细索引 §3](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)
- [2026-10-15 UI 研究索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)
- [2026-10-15 业务流程研究索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)
- [#909 前序完整研究索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)

以上是历史研究遗产，不可把“旧索引里记录了原文”说成本轮重新阅读了外站原文。


## 2026-10-20 续跑 #08：精确 HEAD 真实 Host 全旅程通过、截图直接复核与证据报告纠偏

### 本轮直接读取证据（R）

- Platform 当前 main（本次核验）：`eaa5e813b1e86a6460d988c76eb2076512c35127`。
- BEX-01 候选分支：`feat/bex01-v3-real-fidelity-clean-mainline-20261020`；精确 HEAD `def4fa6c99a72e17f6de5569b28307ba2a77e878` 是从当时最新 main 同步后形成，compare 为 ahead 25 / behind 0、merge-base 等于该 main。不要用旧 PR 元数据中的 base SHA 误判它仍然落后；以后仍须重新查询，因为 main 会继续移动。
- [Platform PR #1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) 仍 Draft / Open；候选未合并、未部署。
- 精确 HEAD 的 [Platform CI run 39373762600](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762600)、[BEX-01 Real Host Chromium run 39373762771](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762771)、[In-Context Import Resume 39373762700](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762700)、[Human UI Design Review Gate 39373762750](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762750)、[Lightweight Host Architecture 39373762704](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762704) 均完成并 PASS。Human UI Gate 是自动化门禁，不是用户本人视觉签收。
- Real Host Chromium artifact：[run 39373762771 / artifact 12242119759](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762771)。本轮已下载 ZIP 并实际打开 PNG；ZIP 约 6.5 MB，包含 67 个文件。其 `report.json` 声明 Headless Chromium 141、actualHost=true、disposable isolated fixture、5/5 case PASS、browserErrors=[]；不证明 iOS Safari、实体 Android 或弱网/真实移动键盘，也不是生产客户页面。
- 手机 390px 诊断直接记录 `tableWrapDisplay=none`、`cardsDisplay=grid`、`scrollWidth=390`，实际手机卡片/搜索/导入入口旅程 PASS；1280px 桌面浏览器旅程、V3 专项源审计、纠错恢复、批次常量持久化/恢复、22 列 172 行合成 XLSX 的 Host 旅程也都在该 run 实际执行而非 skipped。

### 截图 / 附件索引（R）

所有截图均来自隔离 Host 合成验收，不是生产页面或客户数据。可从上述 artifact ZIP 直接取用：

| 文件 | 视口/场景 | 已直接观察到的内容 | 限制 |
|---|---|---|---|
| `v3-fidelity-workbench-map-1280.png` | 1280×900，映射页首屏 | 标题“核对导入数据”、文件摘要、步骤、四项指标、四列映射表 | 该 fixture 为 4 已匹配 / 17 待新增 / 1 忽略 / 0 需核对；不是 #909 的 3 项异常状态 |
| `v3-fidelity-first-viewport-batch-390.png` | 390×844，批次审核首屏 | 手机纵向卡片、文件摘要、指标、来源提示和工作台底部导航 | 不是 #909 原图逐像素对照，也未由用户签收 |
| `v3-e4-map-desktop-overview.png` | 1280×900 | 四列标题、筛选、文件信息及第一批映射行 | 同样是无 mapping attention 的合成样本 |
| `v3-e4-map-desktop-submit.png` | 1280×900，长页底部 | 末尾字段行与底部操作区 | 当前可见“保存映射并预检查”“AI 自动匹配”；原型底部动作集合还包括返回文件、恢复初始选择和保存状态 |
| `v3-e4-map-phone-overview.png` / `v3-e4-map-phone-submit.png` | 390×844，手机长页首尾 | 真实手机卡片式映射、长页末尾 | 只覆盖当前 Host 状态，不覆盖所有问题状态 |
| `v3-e4-task-overview-desktop.png` / `v3-e4-task-overview-phone.png` | 桌面/手机任务概览 | Eidos 通用任务摘要 | 不能代替异常处理区域视觉验收 |
| `v3-source-audit-desktop.png` | 1280×900，失败预检来源审计 | 文件/来源与学习证据、行级问题、修正入口 | 这是预检页，不是映射页顶部的原型 issue box |
| `v3-correction-desktop.png` | 1280×900，行纠错 | 主体类型修正表单、Excel 原值、使用修正值、重新预检查及返回操作 | 功能/状态证据，不代表视觉签收 |
| `v3-retained-xlsx-ready-172.png` | 1280×900，172 行预检 | 真实 Host 的隔离 XLSX 预检、来源保留和纠错后结果 | 合成数据；不能充当客户 Excel 验收 |

### 与 #909 原型的直接对照：确认项与仍有差异

**已被当前真实 Host 截图/自动化证明：**

1. 页面标题已采用“核对导入数据”。
2. 真实 Job 文件摘要和源数据保留标识存在。
3. 桌面有四列：来源列名、示例值、对应系统字段、状态；桌面长页能滚动到最后一行和底部操作区。
4. 390px 实际切换为卡片，不显示桌面表格，页面宽度未超出 390px。
5. 真实 Host 操作旅程包含显式保存/预检查、行纠错、批次字段创建/映射与提交结果；这些测试使用隔离合成样本。

**尚未达到或尚未覆盖的原型差异（D）：**

1. 当前主要映射截图为 0 个 mapping attention 的状态，因此不能证明 #909 中“开户银行同名字段”“3 条缺少主体类型”“系统编码未决”三类问题卡片及其展开/跳转已按原型呈现。预检来源审计截图只能证明后续预检/纠错存在，不能替代映射页 issue box。
2. #909 顶部是“选择文件 → 核对并导入”的两阶段视觉表达；当前正式页面呈现“选择文件 → 核对映射 → 预检查与导入”三步。需由产品决策确定是保持真实 Host 的三步流程但按原型视觉压缩/命名，还是有证据后调整；不可为像素相似而隐藏真实预检步骤。
3. #909 映射区底部有自动保存状态、返回文件、恢复初始选择、预检查并继续；当前 Host 页面显示“保存映射并预检查”和“AI 自动匹配”。这是一项真实功能/视觉差异，不应只通过 CSS 模仿按钮；需要先确认 Host 是否有安全的重置与返回动作契约，再实现或记录有理由的差异。
4. 当前全局 Eidos Host 的应用栏、企业/语言/用户顶部栏和左侧导航与原型独立 HTML 的 topbar 不完全相同；视觉核验应区分宿主固定框架与页面自身区域，不要为了复制原型删除通用导航。
5. 当前已打开的 mapping screenshot 使用合成文件名和不同的映射分布，不等于原型的示例状态；不应把指标数字不同直接判为 UI 缺陷，也不应以这些数值作为客户证据。

### 本轮发现的证据报告不一致与纠正

直接读取 `tests/bex01/live_supplier_chromium.py` 的测试步骤后，发现浏览器断言已检查 54 条供应商的分页（25、25、4），但报告生成器仍写 `pages:[25,25,3]` 和“53 committed supplier rows”。这是测试证据元数据过时，并不代表业务页面失败。已在候选分支新增修正提交 `6d77dcf22324a9039f315432598892b8dc5d6e07`，将报告改为 25/25/4 和 54 条；**该新提交的精确 HEAD CI/Chromium 正在重跑，未通过之前不把这项报告纠偏记为最终验证完成**。

### 下一步决策与实施顺序

1. 等待新 HEAD `6d77dcf22324a9039f315432598892b8dc5d6e07` 的 Platform CI、BEX-01 Real Host Chromium 和 V3 专项步骤全部 PASS；确认新 artifact 的 `report.json` 与真实分页断言一致。
2. 不重新开展已完成的外站研究。使用当前 #909 HTML、S01–S04 历史截图观察记录与本次最新 Host 截图继续逐项核对。
3. 首要视觉/功能缺口是映射页的“需要处理”区覆盖：增加一个隔离测试状态，使真实 Host 在字段映射页呈现未决同名字段/未映射列的 issue list；对行级缺值，只在 Host 已有 dry-run/issue 证据时显示，不能自行推断客户主体身份。
4. 审查底部动作：先阅读 Eidos 表单动作合同与 Host 命令路由，确认“返回文件”“恢复初始选择”是否有现成、可审计的安全动作；不使用未经定义的 UI-only click，不删除当前 AI 自动匹配入口。
5. 以最新 main 为基线做变更路径审查；只要 main 再前进，重新 compare。#1060 保持 Draft，不部署、不合并。
6. 取得最新 1280px/390px 映射页首屏、问题区、表格长页底部与预检/纠错截图后，再交由用户进行 Human 视觉签收。

M01–M03 工程完成；M04 客户真实数据 OPEN；M05 真实完整导入 OPEN；M06 高保真及 Human 视觉签收 OPEN；总体进度继续保持 **3/6**。原客户 Excel、授权 Import Job、两个银行字段真实身份/用途、三条真实主体身份仍未取得，不使用合成样本替代。


## 2026-10-20 续跑 #09：证据报告纠偏已验证；映射页持久化行问题开始真实 Host 覆盖

### 报告元数据纠偏（R，已完成）

- 修正提交：`6d77dcf22324a9039f315432598892b8dc5d6e07`。
- [Platform CI 39377496124](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39377496124)、[BEX-01 Real Host Chromium 39377496173](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39377496173)、[In-Context Resume 39377496210](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39377496210)、[Human UI Gate 39377496040](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39377496040) 均对精确 HEAD `6d77dcf…` PASS。
- 下载并打开新 artifact [12243798507](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39377496173/artifacts/12243798507) 后，`report.json` 已与断言一致：`54 committed supplier rows`，分页 `[25,25,4]`，5/5 场景通过、`browserErrors=[]`。这关闭了前一节记录的报告元数据不一致；报告纠偏不是生产数据变更。

### 新增“失败预检后回到映射页”真实 Host 问题区（R/D）

直接代码检查确认，原型 #909 的映射审核页要显示问题区；之前 Platform `reviewTask.issues` 只由 mapping attention 列构成，忽略已持久化 dry-run 中按行记录的必填字段错误。因此在用户从失败预检返回映射时，行级错误可能仍留在后续预检页，而映射工作台没有把它们合并进“需要处理”区。这是实现缺口，不是视觉样式缺陷。

已在候选分支实现：

- `apps/data-import/page.ts`：仅读取已有 `job.dryRun.rows[].issues`，按 `fieldId + code` 分组并列出受影响行号；若该字段已有 mapping attention 卡片，则合并详情；否则添加问题卡片并聚焦对应的现有源列组。
- 不在页面渲染时自动运行 dry-run，不从源值推断主体身份，不修改映射、字段值、权限、预检结果或提交状态。
- `tests/protocol/data-import-human-experience.test.mjs`：加入 3 行主体类型缺失的回归，检查问题卡片、行号、焦点组及 Eidos 合同验证。此代码和单元测试在精确 HEAD `e0fa3e6…` 的 [Platform CI 39378466711](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378466711) PASS。
- `tests/bex01/live_supplier_chromium.py`：进一步加入失败预检后映射页的实际 Host 断言，并计划保存 `v3-map-row-issues-desktop.png` 和 `v3-map-row-issues-phone.png`；候选提交 `dfc1cea0c6b74e21746769c04bd72047204572ca` 的 [Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716071) 与 [Real Host Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067) 当前正在运行，**尚不能判定 PASS**。

### 下一步

1. 等待 `dfc1cea…` 的 Platform CI、Real Host Chromium 和 In-Context Resume 全部完成；检查实际 1280px/390px issue-state 截图及 report 元数据。
2. 若断言通过，按 #909 进一步对齐 issue 卡片的顺序、行号呈现和操作入口；若失败，修复真实 Host/渲染问题，不放宽断言。
3. 随后核对底部操作契约差异：原型含返回文件、恢复初始选择、预检查并继续；当前正式 Host 是保存映射/预检查与 AI 自动匹配。先查 Host/Eidos 现有 action contracts，再决定是否新增可审计动作。
4. 最新可确认 Platform main 仍为 `eaa5e813b1e86a6460d988c76eb2076512c35127`；如果 main 前进，重新 compare。PR #1060 继续 Draft，不合并、不部署。

M01–M03 工程完成；M04 客户真实数据 OPEN；M05 真实完整导入 OPEN；M06 高保真及 Human 视觉签收 OPEN；总体 3/6。合成 Host 只验证工程，不替代客户数据或 Human 视觉签收。


## 2026-10-20 续跑 #10：失败预检返回映射页的问题区已通过真实 Host / 双视口验证

### 精确 HEAD 与 CI（R）

- 当前候选 HEAD：`dfc1cea0c6b74e21746769c04bd72047204572ca`，Platform #1060 仍 Draft / Open。
- [Platform CI 39378716071](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716071)：PASS。
- [BEX-01 Real Host Chromium 39378716067](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067)：PASS。
- [In-Context Import Resume 39378716088](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716088)：PASS。
- [Human UI Design Review Gate 39378716228](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716228)：PASS（自动门禁，非用户签收）。
- 新 artifact：[12244670622](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067/artifacts/12244670622)。已下载并直接打开 `report.json` 与两张新增 PNG。报告仍是隔离 Host、54 条供应商、分页 25/25/4、5/5 场景通过、browserErrors=[]；未证明真机 iOS/Android 或弱网行为。

### 新增真实浏览器覆盖（R）

`tests/bex01/live_supplier_chromium.py` 现在在失败预检后重入同一 Job 的 `/map` 页面时，检查已保存 dry-run 中 3 条主体类型缺失问题确实出现在映射页“需要处理”区域，并验证该卡片聚焦到既有 `map-source-2` 源字段组；不执行额外提交、不改变映射或修正值。

- `v3-map-row-issues-desktop.png`：1280px 真实 Host 映射页，显示 3 条记录问题卡片与四列映射表。
- `v3-map-row-issues-phone.png`：390px 真实 Host 映射页，问题卡片按手机宽度换行；浏览器断言无横向溢出。
- 该 fixture 是隔离测试 CSV `bex01-bad-supplier-mapping.csv`，3 条主体类型为空，不是客户文件。截图只证明当前失败预检返回路径和问题区，不代表原型所有问题状态都已还原。

### 设计判断与仍余缺口

- **已补齐一个真实功能差异：** 映射页不再忽略已持久化 dry-run 的行级问题；行问题按 `fieldId + code` 聚合，并列出受影响行号。页面只读取已有 Host 证据，不在加载时自动运行 dry-run，也不猜测客户主体身份。
- **仍未完整覆盖 #909 的组合异常状态：** 当前新增截图只有主体类型缺失这一类；仍需一份隔离 fixture 同时呈现同名“开户银行”歧义、主体类型多行问题和“系统编码”未决，再确认三个问题卡片的顺序、文案与焦点行为。
- **底部动作区仍有差异：** #909 有“返回文件”“恢复初始选择”“预检查并继续”；当前页面是“保存映射并预检查”与“AI 自动匹配”。Eidos 当前 `UidlAction` 仅定义 submit/cancel/agent，不包含声明式 navigate；不要将一个无动作的按钮放到页面上。需进一步检查 cancel 行为与 Host command 路由，确定返回和重置应由通用导航还是明确的受控命令实现。
- **步骤条仍为三步**（选择文件/核对映射/预检查与导入），原型呈现两阶段（选择文件/核对并导入）。先保持真实预检查与显式提交的安全步骤，再研究如何在视觉层把子步骤收敛到原型表达，不隐藏安全门禁。
- **Human 视觉签收仍 OPEN**。自动化通过不代表 100% 还原。M04/M05 继续 OPEN，总进度 3/6。


## 2026-10-20 续跑 #11：当前 HEAD 的浏览器证据与差异判断

### 新增直接读取来源（R，2026-10-20）

| ID | 标题 / 原始 URL | 直接观察 | 用途与限制 |
|---|---|---|---|
| R20 | [Platform #1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) | 当前 HEAD 为 `dfc1cea0c6b74e21746769c04bd72047204572ca`，Draft / Open；对最新 Platform main `eaa5e813b1e86a6460d988c76eb2076512c35127` 的 compare 为 ahead 29 / behind 0。 | 继续实施的唯一候选；没有合并、没有部署。 |
| R21 | [Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716071) | 精确 HEAD `dfc1cea0c6b74e21746769c04bd72047204572ca` completed / success。 | 自动化源码/协议门禁通过；不证明视觉签收。 |
| R22 | [Real Host Chromium Supplier Journey](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067) | 精确 HEAD completed / success；作业产物含 `report.json` 和桌面/手机 PNG。 | 实际下载并查看 artifact [12244670622](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067/artifacts/12244670622)。 |
| R23 | [In-Context Import Resume](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716088) | 精确 HEAD completed / success。 | 安全恢复回归通过；不代替真实客户验收。 |
| R24 | [Human UI Design Review Gate](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716228) | 精确 HEAD completed / success。 | 这是自动化设计门禁，不是用户 Human 视觉签收。 |
| R25 | [Lightweight Host Architecture](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716062) | 精确 HEAD completed / success。 | 轻量 Host 架构门禁通过。 |
| R26 | [Real Host artifact 12244670622](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378716067/artifacts/12244670622) | 已下载并检查：隔离 Host、54 条已提交供应商记录、Chromium 141、5/5 场景 PASS、browserErrors=[]。包含桌面/手机映射、行级问题、连续滚动与合成 XLSX 回归截图。 | 当前精确 HEAD 的实际 Host 画面，但来自隔离合成数据；不是客户证据，也未获用户签收。 |

### 本轮直接证据与项目判断分离

**源事实：** 当前截图中桌面端显示标题、文件摘要、指标和四列映射表；手机端显示步骤导航、文件卡片、指标卡片与可滚动内容。report.json 为 5/5 PASS，无浏览器错误；手机视口 390px 的 scrollWidth=390。

**项目判断：** 已证明前一轮 CSS 级联问题得到修复，手机响应式基础通过；但不能据此声称 #909 的视觉 100% 还原。需要专门核对原型中的文件/审核阶段、银行同名字段问题、主体类型缺失、系统编码问题、四列映射、步骤表达、底部 actionbar 和恢复初始选择动作。当前普通映射截图不足以覆盖所有组合异常状态。

### 决策与排除方案

- 采用：以当前精确 HEAD 的真实 Host 截图做逐项原型差异表，先定位正式页面差异，再以浏览器回归验证。
- 排除：只凭 CI/Human UI Design Review Gate PASS 关闭 M06；用测试放宽替代手机布局修复；用截图演示页替代真实 Host 页面；把合成供应商/合成 XLSX 当客户证据；在未签收前启动 M04/M05。
- 尚未解决：#909 原型与当前 Host 的步骤表达及底部动作是否存在可见/行为差异，需结合原型完整交互与 Host action contract 再确认；组合异常状态需保留最新截图；Eidos #202 的 owner PR 是否合并仍是独立发布问题，不能假设已合并。

### 下一步落地

1. 以 #909 不可变原型提交 `af58e0abad880439d54230485305bf2b4e05decc` 为基准，形成“原型元素 → 当前 Host 元素 → 差异 → 具体文件 → 修复 → 截图/测试证据”表。
2. 审查 `apps/data-import/page.ts` 的页面结构与 `manager/desktop-workbench-runtime.ts` / Host action contract 的可执行动作；检查 `vendor/eidos/src/design-language/productive-workbench-css.ts` 与渲染器是否只承载通用样式/语义。
3. 不创建无行为的底部按钮；若原型动作已有安全的 Host 命令，按现有契约接入并覆盖浏览器测试。
4. 新改动必须重新运行精确 HEAD 的 Platform CI、Real Host Chromium、In-Context Resume、Human UI Design Review Gate 与 Lightweight Host Architecture，并重新生成 1280px/390px 画面。
5. 继续保持 M04/M05 OPEN、M06 OPEN、总体 3/6；不改 `project.status.json`，不切 Railway release，不部署、不合并、不覆盖 PA05/Eidos/插件治理工作。


## 2026-10-20 续跑 #12：步骤条差异的直接证据与修复

### 新增直接读取来源（R）

| ID | 来源 | 直接证据 | 结论 |
|---|---|---|---|
| R27 | [#909 原型 HTML（不可变提交）](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | 原型 `.pagehead .stage` 的可见阶段为两个：`选择文件`、`核对并导入`；其内部通过 review/confirm/precheck/submit 等区域表达细分流程。 | 这是原型源码事实，适用于当前 Host 顶层步骤条对齐。 |
| R28 | [Platform `apps/data-import/page.ts`（修复前 HEAD）](https://github.com/jiangxng/EVO-App-Platform/blob/dfc1cea0c6b74e21746769c04bd72047204572ca/apps/data-import/page.ts) | `reviewTask.steps` 有 source/review/commit 三项，其中第三项标签为“预检查与导入”。 | 与原型顶层两阶段结构不一致。 |
| R29 | [Platform PR #1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) | 已提交两阶段步骤条和协议断言；新 HEAD `895ea758a3f8ba6787f9f96f06155afbf9ff05b9`。 | 新 HEAD CI/Host Chromium 正在重新执行，不能把前一 HEAD 的 PASS 继承为新 HEAD 结果。 |

### 已执行修复与保护边界

- `reviewTask.steps` 改为 `source=选择文件 (complete)` 与 `review=核对并导入 (current)` 两项。
- `预检查`、新增字段 Schema 确认和明确提交仍保留在当前审核任务内部，不删除原安全门禁。
- `tests/protocol/data-import-human-experience.test.mjs` 增加精确断言，验证两个步骤的 ID、中文标签与状态。
- 未更改 Eidos 通用框架职责；此为 Platform 的导入业务流程表达，不把供应商语义写入 Eidos。
- 新 HEAD 通过后仍须查看真实 Host 截图并由用户视觉签收；CI/Human UI Design Review Gate 不等同于用户签收。


## 2026-10-20 续跑 #13：V3 Chromium 步骤条断言跟进

- [Real Host Chromium run 39381443031](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39381443031) 在 `V3 preserve all genuine synthetic XLSX business fields in supplier records` 子步骤失败。日志明确指出测试断言仍期望三项顶层步骤，而 Host 按新决策只渲染两项。
- 这是测试期望没有随已批准原型对齐变更同步，而不是业务导入失败。此前日志中 V3 Host source audit desktop/phone、row correction desktop/phone、batch constant persist/restore、22-column synthetic XLSX phone review、172-row isolated import 与 bank-field reuse 均已通过；随后仅在旧步骤数量断言处停止。
- 已在 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` 将顶层步骤数量断言从 3 修正为 2，提交 `0a135314c32fcd0633cedf1ac7dda1ad9be66407`。该 HEAD 的新 CI/Chromium 正在执行，尚不能标记 PASS。
- 设计依据：#909 的顶层阶段是“选择文件 → 核对并导入”；预检查/Schema 确认/明确提交仍作为内部子流程。拒绝把旧测试断言当作产品需求，也不移除安全步骤。


## 2026-10-20 续跑 #14：真实 Host 视觉差异证据与当前状态

### R30｜当前真实 Host 浏览器产物

- 来源：[BEX-01 Real Host Chromium Supplier Journey run 39384540028](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39384540028)，artifact ID `12246513104`，创建于 2026-10-20 07:09 UTC。
- 状态：**已下载并直接打开截图/报告**。`report.json` 为真实 Host 的隔离合成供应商数据，5/5 场景通过、`browserErrors=[]`；不代表真实客户验收或 Human 视觉签收。
- 关键截图：`v3-fidelity-workbench-map-1280.png`、`v3-fidelity-workbench-batch-1280.png`、`v3-fidelity-first-viewport-batch-390.png`、`v3-map-row-issues-desktop.png`、`v3-map-row-issues-phone.png`、`v3-e4-map-desktop-submit.png`，以及 `v3-e4-map-desktop-contiguous-00.png` 至 `03.png`。
- `v3-e4-map-desktop-scroll-manifest.json` 显示 1280×900 下映射页滚动容器高度 2460px，连续覆盖至最后一行与提交操作区；390px 页面宽度与视口一致，无横向溢出。

### R31｜#909 原型对照来源

- 来源：[BEX-01 V2 Prototype Chromium Review run 38704093619](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619)，artifact `bex-v3-in-context-import-open-in-browser`，ID `11957646429`。
- 状态：**已下载并直接打开原型截图与报告**。`01-desktop-overview.png`、`03-complete-field-table.png` 显示 22 列、16 已匹配、4 待新增、0 不导入、3 项需要处理；异常类型包括开户银行多目标、3 条主体类型缺失、系统编码未选择处理方式。报告将真实客户文件、生产授权、真实导入和 Human 视觉审批标为未验证。
- 与当前 Host 的关键差异：当前测试数据不是同一映射状态；文件卡片缺少与原型同等级的 XLSX 类型图标/信息层级；当前问题 fixture 只呈现主体类型缺失聚合卡，不能证明三个独立问题类别与动作已经复现；步骤条、底部动作区需要在相同流程状态下核对。
- 结论：不得把不同 fixture 的截图作 100% 还原证据。先建隔离 synthetic 视觉 fixture，锁定与原型一致的 22 列语义状态，再修正和签收。

### R32｜精确 HEAD 门禁和边界

- Platform `main` 核验值：`eaa5e813b1e86a6460d988c76eb2076512c35127`。候选 HEAD `6049c5875adecadef7b353fbc8861acc5c154ecd` 与 main ahead 36 / behind 0。
- `6049c587…` 的 Platform CI run `39384540039` PASS，BEX-01 Real Host Chromium run `39384540028` PASS（5/5），In-Context Resume run `39384540118` PASS。
- 视觉复核附录提交 `107fbceb1c26043bd01ef2791e25068c3f474767` 触发了新一轮 CI；在该 HEAD 上的 Platform CI 与 BEX-01 Real Host Chromium 当时仍在运行，必须按精确 HEAD 刷新状态，不继承前一提交的 PASS。
- PA-01B2 Full Isolated Chrome Host Acceptance 在 `6049c587…` 失败于普通聊天 transport `MOCK_MODEL_CALL_NOT_SEEN`（7/8）。这是独立 Agent 线；不得改 PA05/PA01 或放宽其断言来换取 BEX-01 通过。
- PR #1060 继续 Draft、未合并/部署。M04/M05 OPEN，M06 待 Human 视觉签收，总体进度 3/6。不得改 `project.status.json`，不得将 Railway 切换至 release。

## 2026-10-20 续跑 #15：最新精确 HEAD 门禁状态

- 实施候选 HEAD：`107fbceb1c26043bd01ef2791e25068c3f474767`；Platform `main`：`eaa5e813b1e86a6460d988c76eb2076512c35127`。分支 ahead 36 / behind 0。
- [Platform CI run 39386798443](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39386798443)：PASS。
- [BEX-01 Real Host Chromium run 39386798369](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39386798369)：PASS；artifact ID `12248210391`，报告 `2026-10-20T07:30:03Z`，5/5 场景通过、无浏览器错误。
- [BEX-01 In-Context Import Resume run 39386798367](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39386798367)：PASS；[Human UI Design Review Gate run 39386798312](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39386798312)：PASS；[Lightweight Host Architecture run 39386798311](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39386798311)：PASS；[PA-01B2 Full Isolated Chrome Host Acceptance run 39386798382](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39386798382)：PASS。
- 注意：较早 HEAD `6049c587…` 的 PA-01B2 full Chrome 曾因 `MOCK_MODEL_CALL_NOT_SEEN` 失败，但更新后的 `107fbceb…` 已通过该门禁。状态记录以精确 HEAD 为准，不延用较早失败或成功。
- 上述自动化 PASS 不构成 Human 视觉签收。实际截图与 #909 原型的数据状态不同，当前问题截图只有一类主体类型缺失，文件卡片/异常项层级/步骤与底部操作仍有差异；这些差异已登记在 BEX-01 视觉审查文档。
- 下一步：单独增加 synthetic V3 视觉 fixture，精确复现 22 列、16 匹配、4 新增、0 忽略、3 类异常；生成 1280px/390px 对照截图并修复视觉差异。客户 Excel 与授权证据仍缺失，禁止启动 M04/M05。

## 2026-10-20 续跑 #16：分支计数校正

- 再次比较确认 Platform `main`=`eaa5e813b1e86a6460d988c76eb2076512c35127`，实施分支 `107fbceb1c26043bd01ef2791e25068c3f474767` 为 ahead 37 / behind 0。上一条 #15 的 ahead 36 是新增视觉审查文档提交前的计数；本条以最新双向比较为准。
- 该计数变化不影响精确 HEAD `107fbceb…` 的 CI 结果：Platform CI run `39386798443` PASS，BEX Real Host Chromium run `39386798369` PASS（artifact `12248210391`，5/5），In-Context Resume `39386798367` PASS，Human UI Design Review Gate `39386798312` PASS，Lightweight Host Architecture `39386798311` PASS，PA-01B2 Full Isolated Chrome Host Acceptance `39386798382` PASS。
- 当前未合并/部署。保持 M04/M05 OPEN、M06 待 Human 视觉签收，总体 3/6。下一项是构建与 #909 同状态的隔离视觉 fixture，避免用不一致的数据状态声称 100% 还原。
## 2026-10-20 续跑 #17：真实 Host 三问题视觉 fixture 与门禁

### 直接证据

- Platform implementation PR #1060: https://github.com/jiangxng/EVO-App-Platform/pull/1060
- Tested code HEAD: `0e3aec5b7c1e4be6f8f1454ea51b05cb18f7b161`
- Docs-only follow-up HEAD: `0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23` (must rerun/check exact-HEAD CI before declaring latest branch green).
- Real Host Chromium run: https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391545718
- Artifact ID: `12249767148`, `bex01-real-host-chromium-evidence`
- Screenshot files: `v3-prototype-parity-issues-desktop.png`, `v3-prototype-parity-issues-phone.png`, `v3-prototype-parity-submit-desktop.png`, `v3-prototype-parity-submit-phone.png`.

### Fixture contract and observed result

A disposable isolated Host job uses synthetic data only: 22 columns, 172 rows, 16 existing target mappings, four new-field proposals, zero ignored columns, and three distinct issues. The three issue cards are rendered in prototype order and expose different actions: ambiguous bank target / choose field; missing subject type for rows 165, 169, 172 / view records; system-code metadata / handle column. The overall Real Host Chromium workflow is green, and the visual-fixture-specific assertions ran inside that workflow. The standard `report.json` still lists the five pre-existing named journeys; it does not add the visual-fixture case to its count, so do not describe it as a sixth report.json case.

### Implementation split and remaining parity gaps

- Platform business copy and action labels: `apps/data-import/page.ts`.
- Platform vendored Eidos issue-card realization: `vendor/eidos/src/design-language/productive-workbench-css.ts`.
- Platform regression checks: `tests/protocol/data-import-human-experience.test.mjs`, `tests/protocol/bex01-v3-decision-first-visual-review.test.mjs`, `tests/bex01/live_supplier_chromium.py`, and `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`.
- Eidos owner-layer issue-card CSS/test is isolated in PR #204: https://github.com/jiangxng/eidos/pull/204. Its CI and Human UI Design Review Gate pass on head `199feb9addfa8de1ae930097c56f528ba1b86ab3`; it remains Draft and does not alter PR #202.
- Remaining: file-type badge on source card; real return-to-file navigation; native restore-initial-selection/reset action; exact stepper and footer parity; final Human visual signoff. No customer Excel acceptance until signoff.