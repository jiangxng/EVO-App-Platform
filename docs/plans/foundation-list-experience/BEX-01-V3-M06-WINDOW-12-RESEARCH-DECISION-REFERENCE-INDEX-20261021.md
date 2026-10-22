# BEX-01 V3 M06｜Window 12 研究资料与决策详细参考索引（2026-10-21）

> 与[简短交接入口](BEX-01-V3-M06-WINDOW-12-HANDOFF-ENTRY-20261021.md)配套，仅追加**本窗口实际核验的 GitHub 研究遗产和精确决策**。此前外站研究完整 URL/章节/查阅等级保存在[2026-10-15 原业务资料索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[同日 UI/认知索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[2026-10-19 V3 索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[M04 索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)和[Window 03 增量研究](BEX-01-V3-M06-WINDOW-03-INCREMENTAL-RESEARCH-20261020.md)。**不复制旧资料全文、不覆盖其历史快照、不对旧链接的未来可达性作保证。**

## 0. 证据等级、阅读时间与统计口径

- **R21 = 2026-10-21 本聊天确实读取原始材料**：GitHub PR/源码、git diff/commit/tree、工作流日志、Chromium JSON、原始截图/联系人图；只证明源码与隔离 Host，不是客户生产状态。
- **RH = 此聊天之前的同项目窗口/已保存研究记录注明原文或截图已读**：有原网址和历史日期，但本次没有逐一重新下载旧外站正文；来源事实按历史核证范围继承，**不升级为今天直接阅读**。
- **SH = 历史仅搜索摘要、可见片段、图片预览或题录**：不是完整原文；重新实施前定向核验。
- **D = 待验证/未获取**：外站更新、原始客户 Excel/Job、真实两银行用途与实际 ID、客户行级身份、登录后生产可用性和正式 Human 签收。
- **S = 来源事实 / J = 本窗口工程或产品判断 / H = 用户已确认要求**。不要把主观取舍写成厂商官方建议。
- **访问日期**：以下 R21 条目均为 **2026-10-21**；历史 RH/SH 条目在原研究文件中为 **2026-10-14～19**。本次没有通过网页搜索重新爬取外部竞品或 NN/g 官方网站，**没有任何新增“仅见今天搜索摘要”的条目**。

## 1. 本窗口确实取得的 GitHub 网络材料（R21）

| ID／标题和**原始 URL** | 查阅状态与主题 | 来源事实（S）/关键发现 | 对项目用途及限制（J） |
| --- | --- | --- | --- |
| G01 [V3 #909 可交互源 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，[原型 PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | 10-21 **R21：精确 SHA 源码**；#review、`#issuesTitle`、`#mappingRows`、`.fileinfo`、`.actionbar`、`#saveStatus` | S：文件卡、阶段条、统计、问题、四列映射、底部动作；原型明确写“更改将自动保存”“预检查并继续”，它是演示壳而非真实 Host | J：界面信息层级的最高视觉参照；绝不能复制演示自动保存行为或以静态原型替代业务命令 |
| G02 [原型真实截图（历史 Chromium run 38704093619）](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619/artifacts/11957646429) | 10-21 **RH/R21：本聊天对话已有已查看的对照图；图像原始工件链接取自前序直接阅读的仓库审查原文** | S：`01-desktop-overview.png` 1280×1668、`03-complete-field-table.png` 1280×2643、`10-mobile-overview.png` 780×5350（视觉按 390 CSS px 缩放）；原型演示中筛选 7/22 | J：视觉参照与真实 Host 的相同状态和相同 viewport 比较；原型不包含真实 Eidos Shell/企业上下文 |
| G03 [#1086 当前原始 Host Chromium run 39549354838](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838) / [artifact 12322028969](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838/artifacts/12322028969) | 10-21 **R21：CI API、实际日志、生成图像、附件清单** | S：isolated synthetic Host 5/5 PASS；**同态** `v3-visual-parity-desktop-contiguous-00..02.png` 3 帧、`v3-visual-parity-phone-contiguous-00..05.png` 6 帧（390×844）、对应滚动 manifest；另有旧 retained-XLSX 4 帧桌面/10 帧手机 | J：M06 当前最有价值的非生产 Human 截图包；要区分 16/4/3 原型同态与 4/17/1/0 旧 retained-XLSX，不能拿错证据签收 |
| G04 [#1086 最终前置 CI 汇总](https://github.com/jiangxng/EVO-App-Platform/pull/1086) | 10-21 **R21：精确 `60f1e11` 的七类工作流状态** | S：Platform [39549354862](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354862)、Real Host [39549354838](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838)、Lightweight Host [39549354858](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354858)、Project Continuity [39549354865](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354865)、BEX Resume [39549354859](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354859)、Plugin CI [39549354853](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354853)、自动 Human UI 规则 [39549354885](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354885) 均 SUCCESS | J：证明精确旧 HEAD 的工程质量，不等于新文档 commit 自动 PASS 或 Human 已签收 |
| G05 [真实映射页业务源码](https://github.com/jiangxng/EVO-App-Platform/blob/60f1e11a4913febda17e4a2cefc659be2ceda4d3/apps/data-import/page.ts) | 10-21 **R21：`createDataImportMappingPageV010` 及 `candidatesFor`、`mappingSelectionFor`、`reviewIssues`** | S：真实来源样本出自 Job；同名候选使用不同 fieldId，目的不明显示“业务用途待核对”；6/22 是状态过滤后的待处理**来源列**；三行缺主体类型在单独 issue 里。来源列唯一映射与原始数据保留仍受约束 | J：业务统计口径/防误选以真实 Host 为准，不为了截图 7/22 虚构第 7 列 |
| G06 [Eidos 通用 HTML 渲染](https://github.com/jiangxng/EVO-App-Platform/blob/60f1e11a4913febda17e4a2cefc659be2ceda4d3/vendor/eidos/src/renderers/html/index.ts)、[Workbench CSS](https://github.com/jiangxng/EVO-App-Platform/blob/60f1e11a4913febda17e4a2cefc659be2ceda4d3/vendor/eidos/src/design-language/productive-workbench-css.ts) | 10-21 **R21：`reviewTable`/workbench/原生 details、responsive 规则** | S：桌面可选 inline-collapsed evidence，手机 44px 来源展开与响应式卡片；有界的 desktop/mobile workbench padding、footer 纵列；未移动业务逻辑进 vendor Eidos | J：修改必须受 opt-in/viewport 限制，不能通过删证据、缩按钮、全局覆盖获得假高保真 |
| G07 [真实测试与 screenshot sweep helper](https://github.com/jiangxng/EVO-App-Platform/blob/60f1e11a4913febda17e4a2cefc659be2ceda4d3/tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py) / [isolated fixture](https://github.com/jiangxng/EVO-App-Platform/blob/60f1e11a4913febda17e4a2cefc659be2ceda4d3/tools/bex01/isolated-host-fixture.mjs) | 10-21 **R21：逐段源码与真实日志** | S：不同 fixture 的 mapping/filter/row/phone 断言；`capture_map_scroll_evidence` 针对**嵌套 Host 滚动容器**按约 20% 重叠取帧；`stem=v3-visual-parity` 现覆盖真正 16/4/3 状态；银行试选仅本地、reset 恢复、手机 reload 不自动保存 | J：下一次不从新写截图器；新截图应跟随完整 manifest，禁止只截 viewport 头尾就宣称全页 |
| G08 [#1060 上游 BEX PR](https://github.com/jiangxng/EVO-App-Platform/pull/1060) / [#1077 中层 PR](https://github.com/jiangxng/EVO-App-Platform/pull/1077) / [#1086 实施 PR](https://github.com/jiangxng/EVO-App-Platform/pull/1086) | 10-21 **R21：PR API、commits、compare、tree、CI runs** | S：当时 main `192b1948` 与 #1060 自共同祖先差异 65 vs 20 files，0 交叉；双父 commit 顺序 `ff38cbf` → `2c2b6bb` → `579c375`，保留 20/18/10 层独有文件；CI 依次 10/10、14/14、7/7 PASS | J：不另起清理 PR、不强推覆盖多窗口；三层虽 mergeable=true 仍 Draft，不能称已入 main |
| G09 [当前 main 精确变动与 PR 合并性](https://github.com/jiangxng/EVO-App-Platform/compare/192b1948a4f5856ba97cb0a15a0d7d50e12e3830...4e21fa8d0380168f9da0ae8a364020da1b9a3f90) | 10-21 **R21：GitHub compare API 与 PR API** | S：该间隔 2 commits、10 个身份目录/治理相关文件，未与 BEX 上游 20 files 重叠；#1060 曾返回 `mergeable=false` 后实际确认为 `true`，原先错误地当作必有冲突 | J：GitHub mergeable 需结合 base SHA/三方 diff 复核；避免每次 main 前进就机械同步 3 层导致数十条重复 CI |
| G10 [项目交付/连续性规程](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/AI-BOOTSTRAP.md) / [短闭环工作流](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) / [止损规程](https://github.com/jiangxng/EVO-App-Platform/blob/4e21fa8d0380168f9da0ae8a364020da1b9a3f90/docs/governance/FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0.md) | 10-21 **R21：仓库原文** | S：项目级强制读状态、当前 owner PR/HEAD/失败日志；两次无进展应换路径；正式 CI/Human/生产门禁不同；不能改手工生成的 `HANDOFF-LATEST.md` | J：本交接专门满足跨 ChatGPT/Codex 窗口抗遗忘，必须沿用同一分支与失败证据 |
| G11 [历史 #1077 文件卡/底栏视觉复核](https://github.com/jiangxng/EVO-App-Platform/blob/60f1e11a4913febda17e4a2cefc659be2ceda4d3/docs/ui-design-reviews/bex01-v3-m06-file-footer-parity-20261020.md) / [Window 03 research](BEX-01-V3-M06-WINDOW-03-INCREMENTAL-RESEARCH-20261020.md) | 10-21 **R21：仓库归档原文，包含历史阶段结论** | S：原型/Host 源卡、工作表名、问题区、真实 footer、行高失败与修复、手机布局、同名银行选择的证据路径和退路 | J：保留原始失败，不把每个早期“待 CI”尾注当最新状态；以准确当前 SHA/CI 为准 |
| G12 [本窗口 Human 建议与档案评论](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6308809648) / [人工决策建议](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6308915162) | 10-21 **R21：本聊天实际发布并校正的 PR 评论** | S：明确 R vs J、Host 6/22 原因、Shell/保存文案差异以及 Human OPEN；签收包 HTML 生成在本聊天的运行容器而非 GitHub | J：延续当前 Human 窄范围决策，不误用结尾的“需要 Human”当作系统已批准 |

### R21 已读取的精确浏览器运行链（只给后续需要的差异）

| 阶段/新证据 | 原始 URL、准确 artifact | 实测与使用边界 |
| --- | --- | --- |
| 桌面同根因纵向节奏修复 | [39541666091](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39541666091) / artifact `12319941350` | `source=86px,metric=98px,issues=[85,86,86]`，普通行 58px；该 HEAD 7/7 CI PASS |
| 手机四统计与三问题节奏 | [39542698699](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39542698699) / artifact `12319903197` | `metric=86px,firstIssue=129px`，计数在解释下；7/7 PASS；后续业务警告文案增长会改变首条高度，不能固化成永远 129px |
| 手机同排来源/底部真实按钮 | [39544054626](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39544054626) / artifact `12320716614` | evidence `cellHeight=56,summaryHeight=44,xGap=6`，footer 三按钮 `340×44`；真实浏览器无横向溢出 |
| 银行两个同名候选交互 + 反证修正 | [39547173316](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39547173316) / `12321734588`；[最终修订 39547621048](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39547621048) / `12322980183` | 先有 7/7、可分别选择，却从手机截图发现选中值的 ID 在尾部被截断；改为 ID 前置后可辨认；同名用途无可信文字时显示待核对，不假造银行类别 |
| 主线合并顺序后重新验 | [#1086 集成 39548547325](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39548547325) / `12322922128` | 三层按依赖 merge 后 7/7 PASS；真实隔离 Chromium 5/5，172 行 retained fields、同名字段试选重置和手机恢复通过 |
| 本窗口最后真正同态全页 | [39549354838](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838) / `12322028969` | **16/4/3** fixture；桌面 3 帧、手机 6 帧、各有 scroll manifest。**接续验收优先此项**，不要用上面的其他 fixture 冒充完全同态 |

## 2. 既有外站研究：保留原始 URL 与历史阅读等级（本次未重读外站）

下表是**仓库历史索引的简明指针**，原文阅读发生在 2026-10-14～15，**不是 10-21 新的网络搜索结果**。精确章节、矛盾、截图、时间与所有 V01–V16 / M01–M08 / EX01–EX10 的原始 URL 见[视觉研究总表](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)和[业务参考资料](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。

| 来源／原始网址 | 历史日期与等级 | 原文/历史研究摘要（S） | EVO 的本轮使用方式（J） |
| --- | --- | --- | --- |
| EX01 [勤哲《定义数据项》](https://www.qinzhe.com/cn/tutorial-2015/t-05-03.html) | 10-14/15 **RH：旧索引注明再次阅读全文 §5.3.1–5.3.2；本次未打开** | 可从已有单元格/表头得到数据项名并集中配置类型与约束 | Excel 列建议企业扩展字段集中核对，但不自动获得改写 Schema 权限 |
| EX03 [Microsoft Support: Create a list based on a spreadsheet](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet) | 10-14/15 **RH：旧索引注明阅读正文步骤 1–6；本次未打开** | Excel 表头映射到 List 列，上传源文件的权限/储存需留意 | 来源列与扩展字段集中审核；不能照搬为已有供应商 Schema 自动新增 |
| EX05 [Airtable: CSV import extension](https://support.airtable.com/articles/3067164948-csv-import-extension) | 10-15 **RH：旧索引注明原文映射/重置/预览章节；本次未打开** | 导入时映射建议、人工跳过、预览、重置和复用交互 | 保留原始来源、可逆排除与二次 Recipe；**不得将第三方忽略解析失败的策略搬到 EVO 关键校验** |
| EX06 [NN/g: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | 10-14/15 **RH：旧索引注明 #5/6/7 正文；本次未打开** | Error Prevention / Recognition rather than Recall / Efficiency | 同名银行不猜、来源样本就地、问题定位与记忆重入；不是一项具体 Host API 规范 |
| V02 [NN/g: Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) / V03 [Proximity Principle](https://www.nngroup.com/articles/gestalt-proximity/) | 10-15 **RH：旧索引注明阅读原文相关章节；本次未打开** | 尺度、对比、距离会改变信息阅读先后和分组感 | 任务步骤→文件→统计→问题→字段→动作层级，以及样本/候选用途同排 |
| M01 [NN/g: Recognition and Recall](https://www.nngroup.com/articles/recognition-and-recall/) / M06 [Interaction Cost](https://www.nngroup.com/articles/interaction-cost-definition/) | 10-15 **RH：旧索引注明读相关正文；本次未打开** | 直接呈现已知选择减少回忆成本；交互成本也含滚动、阅读和切换 | 导入二次记忆、当前 Job 恢复、避免 22 个字段卡无效膨胀 |
| M03 [W3C COGA: Making Content Usable](https://www.w3.org/TR/coga-usable/) / V13 [WCAG 文字对比](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) | 10-15 **RH：旧索引注明章节正文；本次未打开** | 进度/错误纠正与可理解内容；最低文字对比遵从相应适用条件 | 手机按钮与消息可读、原生操作与恢复；COGA Note 非新强制合规标准 |
| M08 [NN/g: Usability for Senior Citizens: Improved, But Still Lacking](https://www.nngroup.com/articles/usability-seniors-improvements/) | 10-15 **SH：旧索引明确只读搜索摘要、未读全文** | 只能当历史研究线索，不将旧样本体验视为现今普遍规律 | 如要引用具体数字或年龄推断，先定向回查全文，否则不用 |

**Eidos 原仓参考边界**：历史索引链接 [Eidos #196](https://github.com/jiangxng/eidos/pull/196) decision-first、[#200](https://github.com/jiangxng/eidos/pull/200) compact table、[#201](https://github.com/jiangxng/eidos/pull/201) workbench、[#202](https://github.com/jiangxng/eidos/pull/202) route focus、[#203](https://github.com/jiangxng/eidos/pull/203) source icon/footer、[#204](https://github.com/jiangxng/eidos/pull/204) issue layout。**10-21 本窗口只读到 Platform vendor 源码与保存的先前研究记录，未逐条重开上述 Eidos PR 原文**；需要跨仓移植时先读取精确 Eidos owner HEAD，并确认是否已合并，禁止凭这里的历史描述覆盖 owner 代码。

## 3. 方案比较与决定：来源事实和主观判断不混用

| 要解决的问题 | 实测/来源事实（S） | 已采用（J / 理由） | 排除/限制（J） |
| --- | --- | --- | --- |
| 高保真不是只看首屏 | #909 HTML 原始 `#review` 在映射前列文件、统计与问题；原 Host `decision-first` 折叠后错位 | opt-in `reviewTask.presentation=workbench` 恢复原型层级 | 排除把所有问题塞进折叠摘要；不全局更改 Eidos |
| 映射行 73px 过高 | Chromium 源样本/详情/选择各 36px；`label` margin 上下各 12px | `compact+inline-collapsed` 局部标签 margin=3px，普通行实测 58px | 先尝试证据同行但没有降低行高，故**不再照旧方案堆 CSS** |
| 桌面/手机卡片节奏差 | 原型文件卡约 87/统计约 101/问题约 86；Host 改前较短；手机统计卡约 68 | opt-in bounded desktop/mobile padding/gap 分批集中修复并加 geometry asserts | 不裁真实文件名；不修改真实字段样本；移动端 44px 保留 |
| 手机来源和操作区太分散 | 手机证据、按钮以前分别占多个行/并排；真实操作需保存/重置/返回 | 来源样本+原生 disclosure 同行，展开满宽；footer 三个 `340×44px` 纵列 | 不复制原型的假自动保存、不将长期业务数据藏进截图 |
| 两个“开户银行”选中时辨认不清 | 真实截图 `v3-bank-human-choice-phone-1/2` 先显示相同“用途待核对”，不同 ID 在窄屏尾部截断 | 把**真正 fieldId 放到标签靠前**，缺可信用途时仍显式“待核对”，可选/重置/reload 均测通 | 排除按名称/顺序/EC 自动选中及虚构两种银行用途；Human 身份判断另有 Gate |
| 手机滚动证据错用 | 原先 10 帧是 4/17/1/0 fixture，原型 16/4/0/3，不同态 | 共用 screenshot helper，参数选择 `v3-visual-parity`，3 desktop+6 phone 帧、manifest 记录完整滚动 | 排除“已证明 10 帧所以视觉 100%”的错误推论 |
| #1060 mergeable=false 的历史误报 | 实际 compare 发现当前 main 与 BEX 文件集合 0 交叉，GitHub 后续显示 mergeable=true | #1060→#1077→#1086 正常双父 merge、fast-forward update，保留 20/18/10 各层独有文件，精确 CI 10/14/7 PASS | 排除新建重构分支、强推/覆盖 PA05/EOG/治理。主线新提交无交叉时不机械多轮重合并 |
| 原型 7/22 与 Host 6/22 | `needs` filter 是实际待核对来源列，主体类型有 3 条**行级**错误但整列已映射 | **建议（未获 Human 决定）保留 6/22**，问题区负责行级纠错 | 不假造第 7 列来对齐演示图；若需综合问题计数应另定语义 |
| 原型导航/底部文案 | #909 为独立演示壳，文字“更改将自动保存/预检查并继续”；Host 要显示 Context/应用导航，提交含显式保存 | **建议（未获 Human 决定）**接受真实 Shell、保留“保存映射并预检查” | 不删授权上下文，不假称自动保存，不将建议写成最终用户接受 |

## 4. 失败/冲突与止损记录（下个窗口不可重蹈覆辙）

1. **“inline disclosure 后行高会降到约 55px”失败**：首次并排后仍 **73px**；进一步 computed style 测量发现不是详情组件本身，而是 select label 上下 `12px+12px` margin，改为 opt-in `3px+3px` 后实测 **58px**。见[Window 03 增量研究末段](BEX-01-V3-M06-WINDOW-03-INCREMENTAL-RESEARCH-20261020.md)及 [run 39531930203](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39531930203)、[run 39532250864](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39532250864)。
2. **测试脚本失败不能冒充产品退化**：先前选项 label 与生成枚举不一致、批次页面预期错误、Hidden rows 的 selector、展开行重新选择不稳定、JS regex 转义错误；回看 Host DOM/断言本身，修复稳定 selector，后续 CI PASS。旧错误记录见[#1077 历史审查](https://github.com/jiangxng/EVO-App-Platform/blob/60f1e11a4913febda17e4a2cefc659be2ceda4d3/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-03-INCREMENTAL-RESEARCH-20261020.md)及 [#1086 Continuity 评论](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6307466114)。
3. **两次假信心**：银行选择功能最初 CI 通过但视觉所选项在 390px 基本一样；读取真实截图后**改变 label 顺序**，修复不是一轮全局样式。另旧 10 帧截图来自**不对应原型的 fixture**，后来在相同 16/4/0/3 页面补了实际完整 3/6 帧。
4. **GitHub `mergeable` 会随 base 变化并异步更新**：先观察 false 不代表实际冲突；以共同祖先、自上游以来的 changed files、提交树和最终 PR 独有文件数核查。两侧都改相同文件或出现冲突时不能套用本窗口“零交叉快照”，必须重新三方合并并跑受影响 CI。
5. **来源和目标的不等价**：视觉原型截图可证明演示意图，不证明 Host 安全、真实客户 fieldId、真实用户屏幕；GitHub CI 只能证明 isolated fixture；Human 接受是单独授权。不能把 COGA Note/NNg 一般原则当具体强制平台合同。

## 5. 仍未解决的矛盾与定向查阅（高价值优先级）

| 开放冲突/资料缺口 | 目前证据与不能下的结论 | 下一步最高价值的验证 |
| --- | --- | --- |
| 目标 100% 高保真 vs 三项合理产品差异 | 7/22 vs 6/22；演示 shell vs Host；自动保存暗示 vs 显式保存。**不是缺少 CSS 就能解决** | Human 看同态 3+6 帧及原型截图，分别决定“接受/要改”，并单独签 M06 整体 |
| 客户真实两银行同名字段 | synthetic ID 两个均可选择，但缺真实业务用途 | 只在客户授权下核对真实字段定义/用途和原 Excel，保留人工确认，归 M04 |
| 三条主体身份 | synthetic 行 165/169/172；不可视为客户实际行号 | 用客户真实 Job 逐行核对源值、主体身份，禁止 `SUPPLIER` 直接推出 `ORGANIZATION` |
| 正式业务提交/Recipe/Schema | 测的是 isolated dry-run/save/reload，不是客户生产数据和授权导入 | 完成 M04 后才有条件推进 M05，验证 Owner 权限、Schema 变化、预检失效、幂等、明确 commit 与审计 |
| 2026-10-16 用户 S01–S04 原始 PNG | 历史索引保存了 `image(20261016-123851).png` 等 4 张 ID/内容摘要，但没有可从 GitHub 保证读取的二进制永久附件 | 若必须逐像素比较，先从原聊天/用户素材获取真实文件，不伪造截图；#909 HTML 和 artifact 是目前稳定参照 |
| 外部网页与 Eidos upstream | 旧资料已有网址和“历史已读/摘要”等级；10-21 未重新浏览外站/每个 Eidos PR | 只有产品决定真正依赖过时标准/外站新政策时再定向看原文；跨仓升级先核对 upstream exact HEAD |
| 当前 main、PR、Railway 是否仍对应 | 10-21 current main `4e21fa8d...`，三层 Draft；该状态会变化 | 下一窗口启动重取 main/PR/CI/部署，绝不拿本页 SHA 断言今天生产状态 |

## 6. 容易丢失的图像/资料位置及完整性说明

- **原型源**：[#909 原始 HTML exact blob](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，直接跳转 `#review`、`#mappingRows`、`#issuesTitle`、`.fileinfo`、`.actionbar`、`#saveStatus`（是 HTML/源码标识，不是 GitHub 章节链接）；原型 run 38704093619 / artifact 11957646429，截图 `01-desktop-overview.png`、`03-complete-field-table.png`、`10-mobile-overview.png`。
- **最新同态 Host（跨窗口首选）**：[run 39549354838 / artifact 12322028969](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838/artifacts/12322028969)；ZIP 内 `v3-visual-parity-{desktop,phone}-contiguous-*.png`，同前缀的 `*-scroll-manifest.json` 记录 `scrollTop`、scrollHeight/clientHeight、设备 viewport；`v3-prototype-parity-issues-{desktop,phone}.png`、`v3-prototype-parity-submit-{desktop,phone}.png`；同名银行前后可对照 `v3-bank-human-choice-{desktop,phone}-{1,2}.png`。这些图由 Playwright 在实际隔离 Host 生成，不是 UI mock。
- **旧 retained-XLSX**：同一 run ZIP 里的 `v3-e4-map-{desktop,phone}-contiguous-*.png` 是单独数据夹具，**手机 10 帧绝对不应标为 V3 原型同态全页**。
- **审查材料（当前会话内产生、未永久 GitHub 化）**：`/mnt/data/BEX-01-M06-Human-验收对照包-20261021.html`（原型 vs Host 多帧离线 HTML，供本聊天内使用）；`/mnt/data/bex-m06-human-review-20261021/v3-visual-parity-phone-contact.png`、`v3-visual-parity-desktop-contact.png` 等拼图和 ChatGPT 消息内图片；本交接**仅在 GitHub 保存文字索引和权威原始 artifact 链接**，不声称这些临时文件已上传 GitHub。原始数据和四张用户图的缺失见 §5。
- **视觉对照/决策评论**：[本轮完整同态证据](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6308809648)、[Human 差异建议](https://github.com/jiangxng/EVO-App-Platform/pull/1086#issuecomment-6308915162)；这是本窗口的评论永久索引，不是签收证明。
- **可变化资源警告**：GitHub Actions artifact 有可能过期，届时应利用 repo 中精确 synthetic fixture/source + 指定 run ID 重新取得**同版本**截图；绝不借过期链接的文件名臆造图像。外站有可能改版，旧正文摘要与 10-15 阅读日期要一起看。

## 7. 与模块、现有文件和下一真实任务的对应

| 模块/权威 | 已定角色 | 下一步 |
| --- | --- | --- |
| `apps/data-import/page.ts` | 真实映射页、字段/样本、状态过滤、真实业务候选与 Human 文案 | 6/22 定义、同名 fieldId/用途，仅按 Human 反馈改业务文本/数据语义 |
| `apps/data-import/types.ts` / `xlsx.ts` / `tools/bex01/isolated-host-fixture.mjs` | 来源工作表、172×22 synthetic fixture、真实 Host 保真 | M04 才核真实数据；不重复补“已有 worksheetName” |
| `vendor/eidos/src/renderers/html/index.ts`、`design-language/productive-workbench-css.ts`、`runtime/{contracts,validate,render-model}.ts` | 通用 Workbench/ReviewTable/原生 disclosure/响应式，opt-in | 若 Human 明确指出失败并有实测共同根因才改；优先协调 Eidos owner |
| `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` | 实际 Host Chrome 桌面+手机、银行双选/重置、同态连续截图 | 现有 3+6 帧和 scroll manifest 应直接复用；不要为产生 CI 而重复写 fixture |
| `docs/ui-design-reviews/bex01-v3-m06-file-footer-parity-20261020.md` | M06 技术变化和早期证据/失败历史 | 与本详细索引互链，不覆盖旧快照 |
| 本页 + [简短入口](BEX-01-V3-M06-WINDOW-12-HANDOFF-ENTRY-20261021.md) | 本窗口新文件／跨 ChatGPT/Codex 交接 | 最终 PR 注释列出新路径与精确文档提交 SHA；文档新 HEAD CI 须单独核对 |
| [#1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) → [#1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077) → [#1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086) | 三层 Draft 依赖，最新修复只在 #1086 | Human 授权及合并条件满足后按依赖顺序纳入 main；不要强推或改全局状态/生产 |
| `project.status.json` / generated `HANDOFF-LATEST.md` | 主线权威，属于跨窗口共享 | 此 BEX 局部文档归档不擅自改；正式里程碑签收后由相应主线 owner 更新 |

**这一轮的最终结论**：工程技术证据已覆盖 16/4/3 原型同态的真实 Host 桌面/手机完整滚动；开放的不是“再跑一次 CSS/CI”，而是 **Human 对三项可解释差异与 M06 整体高保真的裁决**，并且 M04/M05 客户与真实提交门禁仍各自 OPEN。没有人签收之前，进度仍 **3/6**。
