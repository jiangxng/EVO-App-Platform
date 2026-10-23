# BEX-01 V3｜M06 Window 03 研究资料与决策详细参考索引（2026-10-21）

> 配套 [Window 03 简短交接入口](BEX-01-V3-M06-WINDOW-03-HANDOFF-ENTRY-20261021.md)。这里是本窗口 2026-10-20 的**增量研究、源码、方案选择、错误修复和可复核证据**，并于 2026-10-21 复核 PR/main 元数据。旧 [#1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058)、[#1075](https://github.com/jiangxng/EVO-App-Platform/pull/1075) 及 M04/V3 研究索引继续原样保存，不把后来的结论回写为旧日期下的事实。

## 1. 目标、证据等级、阅读边界

**本轮目标**：逐屏推进供应商导入 V3 审核工作台对 [#909 原型](https://github.com/jiangxng/EVO-App-Platform/pull/909) 的高保真实现，保持真实 Host 授权／业务动作／Eidos 通用控件职责。先 1280px/390px 视觉与功能工程回归、后用户 Human 视觉签收；在此之前不试用真实客户 XLSX，不执行 M05 客户业务导入。

- **R｜直接阅读**：本窗口实际读取 GitHub HTML、PR/source 文件及部分源码片段；读取 Actions 日志、下载并直接打开部分 PNG 和 `report.json`。本节的“已读原文”只指**列明的文件/章节/截图**，不暗示已打开同一网站的全部文件。
- **RM｜直接核对元数据**：本窗口直接查询 PR HEAD、Actions 状态、artifact ID 或 Railway deployment，但有些历史 run 只核对了 run/索引，未重新打开每张图。
- **H-A｜旧索引记载此前读过相关原文**，**H-B｜此前只读章节/段落**，**H-C｜此前仅看搜索摘要、题录或图片搜索结果**。本窗口没重新访问这些外站；表中“10-15”是原阅读日期，不是当前访问日期。
- **D｜待验证或待取得**：客户 Excel、授权 Import Job、银行 fieldId 与用途、实际三条主体身份、实机与人工视觉签收。**Synthetic screenshot、CI、Railway main SUCCESS 的证据层级与 D 严格不同。**

## 2. 本窗口直接使用的原始网络资料与可重读位置（R/RM）

下表的“查阅日”为**2026-10-20**（前六次自动续跑和本窗口源码复核），特别说明的 PR/Railway 当前值于 **2026-10-21** 复核。每项保留原始网址与阅读范围；文中“判断”见 §5。

| ID、原始标题/地址 | 范围、查阅日、级别 | 已读来源事实 | 与本项目的具体关系 |
| --- | --- | --- | --- |
| R01 [V3 In-Context High Fidelity 原型 HTML（不可变 #909 SHA）](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | 10-20 原始 HTML 全文、10-21 再查看关键行，**R 已读原文** | 约 30,883 字符；`stageOne`/`stageTwo`、`.fileinfo`、三问题 `.issue`、`tableFilter`/`mappingRows`、`.reviewtable`、`.actionbar`/`saveStatus`、`precheck`/`submit`；模拟 172 行 22 列 | 最优先视觉/交互参照，**原型内 bank ID、系统编码和示例客户均是演示** |
| R02 [原型 PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | 10-20 PR 源码与截图；10-21 PR 元数据，**R/RM** | Open Draft，原型精确 HEAD `af58e0abad880439d54230485305bf2b4e05decc`；并非已部署工作台 | 防止把高保真 HTML 当生产真实数据；用不变 SHA 而非分支路径复核 |
| R03 [原型截图 run 38704093619／artifact 11957646429](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619/artifacts/11957646429) | 10-20 已下载原 ZIP 并打开重点 PNG，**R 截图** | `01-desktop-overview.png`、`03-complete-field-table.png`、`10-mobile-overview.png`；源图的中文业务节奏、连续问题框及步骤状态可见 | 1280px 原型对 1280px Host；780 像素导出手机源图对 390px 浏览器，注意像素尺度不同 |
| R04 [M06 Window 01 #1058 与其两份 handoff 文档](https://github.com/jiangxng/EVO-App-Platform/pull/1058) | 10-20/21 直接读 Markdown、元数据，**R** | 精确旧 SHA `1e03d120770462190818528b657e72c3e9d76a3a`，未合并；记录已有 UI/Host 决定、不同 CI HEAD 和外站继承 | 不重复已有宽工作台、可逆聚焦、M01–M03 研究；main 404 不等于文档丢失 |
| R05 [M06 Window 02 #1075 与两份 handoff 文档](https://github.com/jiangxng/EVO-App-Platform/pull/1075) | 10-20/21 直接读文件与 PR，**R** | 旧 SHA `32d30b5685760d12d01fc7304cd2eeee9bb433ce`，未合并；明确 R/RM/H/A/B/C 来源等级、功能基线和 #204 问题卡分歧 | 上游决策与文献索引，保留旧时间点，不把新验收写回旧文档 |
| R06 [Platform PR #1060：真实 V3 主实施线](https://github.com/jiangxng/EVO-App-Platform/pull/1060) | 10-20 代码/PR 检查，10-21 PR HEAD，**R/RM** | Open Draft，`feat/bex01-v3-real-fidelity-clean-mainline-20261020`，HEAD `0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23` | #1077 叠加基线；不要擅自改变 base、blind rebase 或把 base Draft 部署到 main |
| R07 [Platform PR #1077：M06 Window 03 增量实施](https://github.com/jiangxng/EVO-App-Platform/pull/1077) | 10-20 六次自动续跑代码、测试、CI、评论；10-21 PR HEAD，**R 已读实际来源** | `feat/bex01-v3-m06-file-footer-parity-20261020`，最终 `84939fbd01857c8c41172308731c6b687041b065`，仍 Draft | 本轮功能实现唯一准确源码快照；不能把本交接 docs 分支当实现分支 |
| R08 [Eidos #202](https://github.com/jiangxng/eidos/pull/202)、[#203](https://github.com/jiangxng/eidos/pull/203)、[#204](https://github.com/jiangxng/eidos/pull/204) | 10-20 已查看 owner 说明/源码，10-21 PR 元数据复核，**R/RM** | 三 PR 仍未合并；#204 HEAD `199feb9addfa8de1ae930097c56f528ba1b86ab3`，主张三张独立编号问题卡；#202 路由聚焦，#203 相关 Eidos UI | 记录并行 owner 权限与跨仓改动冲突，不能默默替换其通用默认规范 |
| R09 [Platform 数据导入 page.ts（#1077 精确 HEAD）](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/apps/data-import/page.ts) | 10-20 反复读对应函数/行，**R 源码** | `reviewTask`/`reviewTable`/`contextNavigation`/真实 Import Job 和 Host 路由；三类型问题、双同名银行风险，类型缺失真实行号 | Platform 业务组合和权限判断唯一位置，不把供应商规则写进 Eidos |
| R10 [Platform XLSX parser](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/apps/data-import/xlsx.ts) 与 [types.ts](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/apps/data-import/types.ts) | 10-20 直接源码阅读，**R** | 原 parser 解析工作表关系但原不保留名称；本轮将真实 `xl/workbook.xml` 的首张 sheet 名持久化为可选、校验的 `source.worksheetName` | 原型文件信息真实化，旧 Job/CSV 不编造工作表名；headers/Recipe/权限不变 |
| R11 [Eidos review contracts](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/vendor/eidos/src/runtime/contracts.ts) / [validator](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/vendor/eidos/src/runtime/validate.ts) / [HTML renderer](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/vendor/eidos/src/renderers/html/index.ts) | 10-20 多次直接读具体函数，**R** | 可选 Workbench 指示器、真实 Agent action ID、内部路线、issue-related routes、`issuesLayout="connected"` 的契约和验证 | 保护通用 Eidos API 与 HTML XSS/非法路由，保持无配置页面兼容 |
| R12 [Eidos workbench CSS](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/vendor/eidos/src/design-language/productive-workbench-css.ts) 与 [page-controller](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/vendor/eidos/src/app-host/page-controller.ts) | 10-20 直接读 CSS/事件处理，**R** | 连续列表样式只 opt-in，普通仍编号卡；AI 事件仍按现有 data-action，重置不提交 Host，实际 route 由 Host 绑定 | 反证“截图按钮”假功能，局部修改不跨工作台污染 |
| R13 [Protocol tests](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/tests/protocol/bex01-v3-decision-first-visual-review.test.mjs) | 10-20 直接读/改，**R** | 禁止未知 layout、非法外链、空问题 badge、无 Agent 引用等；覆盖逐阶段及页面结构 | 契约安全保护，不代替实际浏览器测量 |
| R14 [Real Host V3 synthetic Chromium test](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py) 与 [supplier journey](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/tests/bex01/live_supplier_chromium.py) | 10-20 直接读/修改并检查 CI/截图，**R** | 1280px/390px 三问题、真实工作表、6→22→6 筛选、错误行 165/169/172、导航和重置、底部按钮，构建 Headless Chromium | 工程证据：实际 DOM、CSS 边界、行级更正页点击，而非静态 HTML 对照 |
| R15 [#1077 本轮增量研究源码归档](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-03-INCREMENTAL-RESEARCH-20261020.md) 与 [UI 复核](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/docs/ui-design-reviews/bex01-v3-m06-file-footer-parity-20261020.md) | 10-20 增量追加，每个子项有自己的研究/判断/测试，10-21 重新读取，**R GitHub 文档** | 包含 6 次自动续跑、方案取舍、语义差距、失败修复、项目边界；不记录新外站考古 | 新窗口深入具体模块时的落地索引，**不要覆盖** |
| R16 [Railway 项目部署资源](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) | 10-20 多次查询 / 10-21 再查部署元数据，**RM** | 生产服务 `ledger-configurator-production` branch main SUCCESS、SHA `ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9` | 不得宣称 #1077 已上线或改 Railway release 分支 |

### 2.1 原型源码与截图的可重开位置（R01–R03，极重要）

- **原型 GitHub 文件**：原文 `#909/af58e0a` 下 `docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html`，已读 CSS 约 **17–25 行**（`.fileinfo`、`.reviewtable`、`.actionbar`），HTML 约 **68–90 行**（XLSX 文件卡、同一暖色外框内的三问题、四列及底部按钮），JavaScript 约 **104–244 行**（同名银行两个样例候选、字段行、实时筛选、保存/预检模拟状态）。GitHub 可依精确 SHA 重读；行号只是 2026-10-21 文件版本的位置。
- **原型两阶段**：`stageOne` 上传完成后变 ✓，`stageTwo` 核对并导入为当前。**不是三阶段，也不是已生效的真实 Host 业务提交**。
- **原型文件卡**：演示 `供应商资料_2026年10月.xlsx`、工作表 `供应商清单`、172 条/22 列、绿色已读取、XLSX 色块；任何这些名字/数字都不能代替真实客户上传结果。
- **原型三问题**：两个业务用途不同但同名“开户银行”候选、人为未确认的 3 条主体类型、`系统编码` 是否导入；在同一个淡暖色容器中呈现，三行有编号和各自操作。
- **原型底部**：返回文件／恢复初始选择／预检查并继续；原型文案“更改将自动保存”只反映纯 HTML 演示行为，**真实 Host 必须坚持显式保存**。
- **原型截图**：[run 38704093619/artifact 11957646429](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619/artifacts/11957646429) 内 `01-desktop-overview.png`（1280×1668）、`03-complete-field-table.png`（1280×2643）、`10-mobile-overview.png`（780×5350，手机输出画布不等于 390 CSS 像素）。本窗口已实际打开；PNG 不在当前文档 Git 树中，后续按 artifact 重新下载。

## 3. 外站/竞品研究遗产——**本窗口未重新打开原文**（H）

本节**只是把旧 GitHub 索引的来源和阅读级别保留**，不是本窗口重新访问网址后的独立结论。2026-10-14～15 原查阅层级由 [M04 详细索引 §3](https://github.com/jiangxng/EVO-App-Platform/blob/ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9/docs/plans/foundation-list-experience/BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[V3 总索引](https://github.com/jiangxng/EVO-App-Platform/blob/ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9/docs/plans/foundation-list-experience/BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) 和 [UI 早期总索引](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md) 继承。若精确 UI 索引路径不存在，应回原 #909 分支 tree 验证，而非伪称已读。

| 继承的原始标题、URL | 历史查阅日／原文层级 | 记录的关键发现及本项目用途（**继承而非本轮实证**） |
| --- | --- | --- |
| [飞书 Aily 数据表](https://www.feishu.cn/content/vl1lf3v5) | 2026-10-15 **H-A 前轮阅读相关正文** | 自动映射建议与人工确认分开；作为 AI 自动匹配但不得静默批准的比较线索 |
| [飞书多维表格应用模式](https://www.feishu.cn/content/article/7578812241772924111) | 10-15 **H-A** | 来源基础数据/业务视角分层，帮助划清 Import Job/个人工作台层级 |
| [飞书响应式设计指南](https://open.feishu.cn/document/design-specification/responsive-design/responsive-design-guidelines?lang=zh-CN) | 10-15 **H-B 只读章节段落** | 桌面多列到手机卡片的布局转换；不能声称采用了具体断点 |
| [Lark Visual specifications](https://open.larksuite.com/document/tools-and-resources/design-specification/gadget-design-specification/visual-specifications/style) | 10-15 **H-B 部分段落** | 中性与功能性颜色分工；Eidos 统一 token |
| [飞书抽屉组件](https://open.feishu.cn/document/design-specification/component----feedback/drawer) | 10-15 **H-B 访问不完整** | 歧义证据就地查看思路，未断言抽屉是唯一实现 |
| [简道云 CRM 导入关键字段](https://hc.jiandaoyun.com/solution/13147) | 10-15 **H-C 仅搜索摘要** | 中文导入业务用语线索，**不是**真实字段匹配算法的已读来源 |
| [伙伴云 Excel 导入](https://hc.huoban.com/tables/8a9a/974b) | 10-15 **H-A 相关内容** | 样例值与目标字段同处，辅助四列审核工作台组织 |
| [WPS 文档官网](https://docs.wps.cn/welcome) | 10-15 **H-C 仅官网摘要** | 中文办公用语，**没有**验证其自动映射特性 |
| [NN/g Recognition Rather Than Recall](https://www.nngroup.com/articles/recognition-and-recall/) | 10-15 **H-A 相关正文** | 复用 Recipe 和已确认选择，降低用户记忆负担 |
| [W3C COGA Making Content Usable](https://www.w3.org/TR/coga-usable/) | 10-15 **H-A 特定章节：§4.5/4.6.2/4.6.3/4.7.5** | 进度、恢复和纠错；COGA Note 不能当作新增强制 WCAG 条款 |
| [NN/g Interaction Cost](https://www.nngroup.com/articles/interaction-cost-definition/) | 10-15 **H-A** | 少切换、近距离字段用途与例值，但不消除必要授权 |
| [NN/g Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) / [Proximity Principle](https://www.nngroup.com/articles/gestalt-proximity/) | 10-15 **H-A 相关正文** | 文件→指标→问题→映射的扫描顺序，异常处理证据与动作同组 |
| [NN/g Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) | 10-15 **H-A** | 视觉高保真和安全/业务真实验收必须分别签字 |
| [USWDS Table](https://designsystem.digital.gov/components/table/) | 10-15 **H-A 官方相关正文** | 桌面四列表格、手机可审查结构；不能把 22 列压成 390px 小表 |
| [W3C WCAG 2.2 Understanding: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)、[Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)、[Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color) | 10-15 **H-A 解释章节** | 状态文字、边框/颜色结合；本轮 Chromium PASS 不代表完成全面 WCAG 审计 |
| [Microsoft Lists: Create list from spreadsheet](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet)、[Airtable CSV Import](https://support.airtable.com/articles/3067164948-csv-import-extension) | 10-15 **H-A 相关官方正文** | 原表头、样例、可编辑映射和字段创建应分阶段，不能照搬不同产品的存储策略 |

**其他继承来源**：Lark 信息卡、飞书应用引擎、简道云关联导入、畅捷通图片（仅图片搜索结果）、Cowan 题录（仅摘要）、勤哲业务字段等详见上游 M04 §3 和 V3 总索引；不把这些在本轮重复贴成“已读原文”，也不补造未证实原始 URL。

## 4. 六次自动续跑的实际实施索引（源码＋行为＋证据）

| 节点/主要提交 | 本轮采用的真实实现 | 核心保护和验证 |
| --- | --- | --- |
| #01：`7d494241…` → `4e664c2b…` → `32e7b396…` | 真实 XLSX `worksheetName`，来源信息、四列表标题、精简首屏说明 | 浏览器真实工作表、两视口/文案，保护 Recipe/原文件/旧 Job；约 14/14 工作流 |
| #01 后段：`6071451a…` → `6d94f561…` | 两阶段完成勾号/当前步骤及真正的 3 项 badge（取 issues 长度） | 0 问题页不能出现待处理 badge；修复旧 HTML 固定标签断言；14/14 |
| #02：`4e082986…` → `10a2620110f933dc812dbdd868bf503fe58dbffd` | 映射标题、提示、来源保留底注；将 `ai-auto-map` 真实 Agent 动作放字段工具栏，底部三个主动作 | 6/22→22/22→6/22 实时筛选，按钮唯一/44px，无伪模型调用；14/14 |
| #03：`5b461a6482ab265f0094d3a5a300ea8b9ed16834` → `7fe5bca1…` → `b8f83d4d39fb7baae8e21db3c442ba8a6b5432ad` | 真实错误行详情与 Host row-correction 内路由、桌面/手机横排紧凑链接 | 真实 synthetic 行165/169/172、在既有授权校验后可点击更正页、只导航不保存；该 HEAD 13/14，PA Allow 历史偶发失败 |
| #04：`b29b58d4…` → `ffca8247db125053c69aaf6afee210ac21b3c9cc` | 把集中审核/创建扩展字段/批次固定值从面包屑移至「字段处理工具」 | 审批路由仍由 Host 处理，390px 无溢出；初次 Git ref push 未见 PR CI，后 Contents 更新才触发完整 14/14 |
| #05：`761630a2…` → `69e1dfdc3b0cc993eefc67534faee0b05d7ff63e` | 真实正向“文件已读取”状态，风险指标暖色边框/浅背景 | 以语义 tone 和 computed color 测试；13/14，PA Allow `MOCK_MODEL_CALL_NOT_SEEN` 复现 |
| #06：`109c1351…` → `c5476eba…` → `11e87227…` → **`84939fbd01857c8c41172308731c6b687041b065`** | BEX `reviewTask.issuesLayout="connected"` opt-in：三行共用外框/细分隔线，独立按钮仍在 | 首次 CSS/HTML template 截断造成 build fail，修复后 **14/14**，Real Host 5/5、桌面/390px screenshot 直接核对 |

**不可误解的失败链**：曾出现 `DATA_IMPORT_SOURCE_WORKSHEET...` 契约旧断言、CP-03 XLSX 测试新增 `worksheetName` 与旧预期冲突；修正测试保留严格校验。#01 的短文案误删“先恢复本企业之前的映射”和 Experience Compiler 来源名，曾使旧协议失败，已修回。#02/03 旧旅程仍按固定 HTML DOM 找旧按钮，适配到真正 Host route 测试。#06 首次源码构建失败绝不是业务可用证明；最终需精确 HEAD 绿灯及新截图。PA Allow 多次 `MOCK_MODEL_CALL_NOT_SEEN`，有红有绿，**根因尚未闭环**。

## 5. 方案比较：来源事实、实施判断、排除原因和限制

| 问题 | 已读来源事实 | **采用的 EVO 工程判断**及理由 | 已排除方案、适用限制 |
| --- | --- | --- | --- |
| 文件卡真实工作表 | 原型有演示 sheet；Host 原无持久化 sheet 字段 | 解析 workbook.xml 的实际首张工作表，保存可选 `worksheetName` | 排除写死“供应商清单”、从文件名猜测；旧 Job/CSV 无 sheet 时只展示可信行列 |
| 两阶段/首屏 | #909 为上传→核对导入两阶段，非三阶段 | Eidos 可读 stepper 和中文简短说明，当前步骤与已完成可识别 | 排除回归旧三阶段、堆砌测试说明 |
| 统计/风险 | 原型警告统计有暖色边界、绿色文件状态 | Eidos 语义 `positive/warning` + token，0 问题时 attention neutral | 排除对所有状态上色“成功”、复制固定 3 个问题 |
| 表格/筛选 | #909 有四列对应关系和部分字段优先显示 | Eidos 可选 heading/hint/footnote，真实筛选数随 Host 控制器变化 | 排除静态“7/22”及手机直接缩小全表；桌面/390px 保留功能测试 |
| AI 自动匹配 | 原 Host 已有 `ai-auto-map` Agent 动作 | 放到字段工具栏，仍由现有 Agent/Host action 绑定，footer 不重复 | 排除假按钮、静默自动调用和没有真实上下文的网络请求；不声称模型 E2E 已验收 |
| 底部返回/重置/保存 | 原型三个操作，但演示“自动保存” | 真实 Host 内部返回、仅本地未保存选择 reset、显式 Host 保存预检 | 排除 localStorage 伪持久化、自动提交、修改 Host 命令绕权限 |
| 3 条缺失主体身份 | 原型示例缺失主体类型可展开 | 来源 dry-run 实际行与 schema/映射/可更正性逐条通过后，提供真实 `/fix/行/列` 内路由 | 排除 `SUPPLIER=ORGANIZATION`、替客户推断、自动填值；不可更正则退回字段定位 |
| 字段工具导航 | 原 Host 面包屑夹杂批量审核和扩展字段工具 | 将真实授权路由放 “字段处理工具” 菜单，面包屑只呈上级路径 | 排除删入口、工具伪装成上级/返回目标；无权限菜单必须不出现 |
| 三问题视觉冲突 | #909 同一暖色框＋分隔线；#204 默认独立卡 | **BEX opt-in connected** 只合视觉外框，保持独立列表项/动作；兼容 owner 默认 | 排除全局覆盖 Eidos #204 与合并业务问题；Human 最终仍须选择 |
| 测试/分支 | GitHub workflow 与 main/Railway 可独立变化 | 以精确 HEAD 跑协议与隔离真实 Host、逐张核对 PNG；Docs 独立 PR | 排除拿历史 PASS 证明新 HEAD、先合并/上线再找问题；不盲目 rebase |

## 6. CI、截图与难再取得的附件索引（R／RM）

**重要：Artifact 可能过期。** GitHub Actions URL 是原始留存位置，不是永久文档附件。下表的 `R` 表示此前本窗口已实际下载和打开相关 ZIP/PNG；`RM` 表示本窗口记录的 run/ID 已在日志或 GitHub 文档中核对，未承诺本次重新解压全部文件。

| 代码 HEAD ／运行来源、查阅日 | 证据等级与状态 | ZIP 内关键内容／复核用途 |
| --- | --- | --- |
| **最终** `84939fbd…` [BEX run 39440257993](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39440257993) / [artifact 12273680796](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39440257993/artifacts/12273680796)；10-20 | **R：直接下载/读 report/打开截图**，精确 HEAD **14/14 workflows SUCCESS**；`actualHost=true`、5/5 PASS、0 browser errors | `v3-connected-issues-desktop.png`、`v3-connected-issues-phone.png`、`v3-prototype-parity-submit-desktop.png`、`v3-issue-real-row-links-*.png`；用于验证三行共用暖色边框/分隔及真实底部流程 |
| `69e1dfdc…` [BEX run 39438330994](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39438330994) / [artifact 12272188172](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39438330994/artifacts/12272188172)；10-20 | **R：直接打开**；13/14，PA Allow fail；BEX 5/5、0 errors | `v3-prototype-parity-issues-desktop.png` / `phone.png`；正向文件状态与警告指标对照 |
| `ffca8247…` [BEX run 39436569710](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39436569710) / [artifact 12271691414](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39436569710/artifacts/12271691414)；10-20 | **R：直接打开**；14/14 | `v3-secondary-field-tools-desktop.png`、`v3-secondary-field-tools-phone.png`；面包屑与字段工具菜单 |
| `b8f83d4d…` [BEX run 39433705806](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39433705806) / [artifact 12268309393](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39433705806/artifacts/12268309393)；10-20 | **R：直接打开**；BEX 5/5；13/14 全局（独立 PA Allow fail） | `v3-issue-real-row-links-desktop.png`、`v3-issue-real-row-links-phone.png`；错误行横向紧凑展示 |
| `7fe5bca1…` [BEX run 39433005026](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39433005026) / [artifact 12269421167](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39433005026/artifacts/12269421167)；10-20 | **R：直接打开**；初版真实行入口 5/5 | 真实错误行进入 Host row-correct 的前后旅程；旧卡片竖排空白的视觉反证 |
| `10a262011…` [BEX run 39430695183](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39430695183) / [artifact 12268221036](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39430695183/artifacts/12268221036)；10-20 | **R：直接打开**；14/14 | 字段工具栏 `AI 自动匹配`、底部三个真实按钮，动态筛选与响应式 |
| `4e082986…` [BEX run 39429607094](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39429607094) / [artifact 12267531766](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39429607094/artifacts/12267531766)；10-20 | **R/RM**；BEX/Platform PASS，PA Allow 首次 fail 后重跑 | 筛选提示、安全底注及 6/22→22/22→6/22 的真实 UI |
| `6d94f561…` [BEX run 39428041191](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39428041191) / [artifact 12267131416](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39428041191/artifacts/12267131416)；10-20 | **R：直接打开**；14/14 | 两阶段勾号/编号和真实问题 badge；桌面/手机 DOM 截图 |
| `32e7b396…` [BEX run 39426057813](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39426057813) / [artifact 12265941794](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39426057813/artifacts/12265941794)；10-20 | **R：直接打开**；14/14 | 短文案、真实 worksheet、四列表标题，desktop/390px 对照 |
| `4e664c2b…` [BEX run 39424881538](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39424881538) / [artifact 12265218415](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39424881538/artifacts/12265218415)；10-20 | **R：直接打开**；14/14 | 真实工作表、四列表区标题和解释 |
| 首个 #1077 工程头 `aed51518…` [BEX artifact 12264985007](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803660/artifacts/12264985007)；10-20 | **R：直接打开**；当时 75 ZIP 文件，synthetic Host | 初版 XLSX marker + footer back/reset 交付的截图与协议基线 |
| #1060 旧 Host [BEX run 39391932514](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514) / [artifact 12250007262](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514/artifacts/12250007262)；10-20 | **R：直接打开**；旧 Host 初始截图 | 首轮四列/三问题已有但文件卡层级和 footer 缺失的反证 |

**截图对照姿势**：1）原型 `01-desktop-overview.png` ↔ 最终 `v3-connected-issues-desktop.png`；2）原型 `03-complete-field-table.png` ↔ 最终 `v3-prototype-parity-submit-desktop.png`（不能只截900px首屏比较全页密度）；3）原型 `10-mobile-overview.png` ↔ 最终 `v3-connected-issues-phone.png` 与 `v3-secondary-field-tools-phone.png`。同步检查 390px 完整滚动内容和触控，而不是只比较图片中的色值。

## 7. 来源冲突、待决和最值得继续读的方向（D）

1. **原型 vs Eidos owner**：#909 三问题连续一体框与 #204 独立编号卡冲突，现实现是 BEX opt-in 双布局，**Human 尚未签字选择跨产品默认**。下一步用原型/最终 Host 逐图比较行间密度、不同卡状态、展开后的整体高度；不能宣称该冲突已被统一解决。
2. **原型自动保存 vs 真 Host**：#909 的 HTML 有“更改将自动保存”，而 EVO 数据修改须显式 Host 保存、预检。应继续保持真实安全语义；视觉差异需向 Human 说明并签收，而非为仿真偷偷开启自动提交。
3. **原型演示字段 vs 真正业务**：两种“开户银行”候选和三条缺主体身份在 #909 是模拟内容，synthetic fixture 亦模拟。M04 必须以客户授权工作簿、schema 的真实两个 fieldId/用途、缺主体身份记录及权限逐项确认。
4. **历史测试通过不代表目前可部署**：#1077 基于 #1060 Draft 且未进 main，Railway production 仍 main。要确认任何新 HEAD 真实 CI、Chrome 及 Eidos vendor 与 owner 向前兼容；不要沿用旧 artifact 作为新 HEAD 证据。
5. **PA Allow 偶发**：`MOCK_MODEL_CALL_NOT_SEEN` 在部分早期 HEAD 触发、最终 84939 HEAD 14/14 通过；未证明永久修复，归独立 PA owner；避免在 BEX UI 工作流内擅自修改 Agent。
6. **真实移动端**：Chromium 390px synthetic 是工程验证，不等于 Safari/Android 真机、不等于视觉 Human 签收。剩余四列表密度、工具菜单展开、完备滚动截图、状态对比需单独核验。
7. **续查方向优先级**：①重新阅读原型 CSS/HTML 的 `.reviewtable`、`.issue`、`.actionbar`，完成真实 Host 同尺寸 **全页截图叠照**；②阅读 #1077 的 live/synthetic Chromium 用例、截图和报告；③对照 Eidos #204 owner 分支的实际规范，决定最终统一或保留双布局；④确认新 main/production/PR 并行推进后部署拓扑；⑤**只有 Human 签收后**才查客户 Excel、Job、schema 与身份依据。

## 8. 模块、分支、文档和新窗口操作落点

| 决策/验收主题 | GitHub 落地位置 / 安全工作线 | 接续任务 |
| --- | --- | --- |
| 原型真源 | #909 `af58e0a` HTML、run38704093619/artifact11957646429 | 1280px/390px 原型基准，重开截图，列出剩余真实差异 |
| Import source metadata、双同名 bank、主体身份 | #1077 `apps/data-import/xlsx.ts`, `types.ts`, `page.ts`, `service.ts`, `row-correction-page.ts` | 保护真实可更正性/字段歧义规则；不做客户写入 |
| Eidos 设计契约/样式 | #1077 `vendor/eidos/src/runtime/{contracts,validate,render-model}.ts`, `renderers/html/index.ts`, `design-language/productive-workbench-css.ts`, `app-host/page-controller.ts` | 保留 opt-in、strict validation、真实 Agent/Host 路由；与 Eidos #202/#203/#204 owner 协调 |
| 工程协议/手机实际旅程 | #1077 `tests/protocol/bex01-v3-decision-first-visual-review.test.mjs`, `tests/bex01/{live_supplier_chromium.py,v3_synthetic_xlsx_retained_fields_chromium.py}` | 精确 HEAD 14 workflows+5 Host scenarios，提取截图和失败修复链 |
| 本窗口实施研究 | #1077 `docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-03-INCREMENTAL-RESEARCH-20261020.md` | 查每次变更的 source facts/判断/冲突和阶段状态 |
| 本窗口设计核对 | #1077 `docs/ui-design-reviews/bex01-v3-m06-file-footer-parity-20261020.md` | 完成视觉密度和 Human 验收清单；当前未签收 |
| 早期研究遗产 | #1058、#1075 两 PR 内的入口+详细索引，main M04/V3 总索引 | 按精确 SHA 继承外部参考；不“恢复”为 main 上不存在的旧路径 |
| 本次**文档归档** | `docs/bex01-v3-m06-window03-research-handoff-20261021`（独立于实施线），本页与简短入口 | 文档 PR 待合并，不触碰 #1077 代码或他窗状态；新窗口先读 |

## 9. 尚未保存到 GitHub／不可声称已取得的内容

- **没有**客户原始 XLSX `往来账户2026_10_08_10_15_23.xlsx` 的可核验业务字节内容、客户授权 Import Job 完整响应；旧 #909 的 synthetic 172×22 是原型/测试数据，不得冒充。实际 Job 编号曾在原型文档出现，但未授权访问，不能作为已验证样本。
- **没有**两个同名「开户银行」真实 fieldId、用途与合法字段选择结果；没有三条主体类型缺失记录的真实身份凭证；因此 M04/M05 真实业务门禁 OPEN。
- **没有**用户签名的 100% 人工视觉验收文件、Safari/Android 真机及生产版 #1077 演示验收；因此 M06 OPEN、进度 3/6。
- **GitHub 已有** #909 原型 HTML 与 Actions artifact 的准确 ID/文件名和本轮截图观察摘要；**但是 PNG 原始文件未作为持久 Git blob 新增到本次文档分支**。Actions artifacts 可能到期，其他聊天中的 `sandbox:/mnt/data/...` 路径也不构成跨窗口持久存储。如需要长期保存原图，必须另建明确附件归档，不得声称已经 Git 永存。
- 一些前序外站资料只留了 GitHub 来源索引（H），没有本轮最新网页抓取快照；此事实已显式标注，而不是悄悄补造已读资料。

**此索引为研究和实施接续证据，不是上线批准或客户验收签名。**
