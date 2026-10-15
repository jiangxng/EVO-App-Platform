# BEX-01 / CP-03 研究资料与决策参考索引（2026-10-15）

> 与 [简短交接入口](BEX-01-WINDOW-HANDOFF-ENTRY-20261015.md) 配套。目的是保存本窗口已阅读、被引用和待验证的研究遗产，而不是重新做一份泛泛的“行业竞品报告”。原则：**来源事实、EVO 产品判断、用户真实截图、代码/CI 证据分层**。网页随时可能变化，重要内容已保留章节定位和必要摘要；未做付费网页镜像。

## 1. 阅读状态判定方法

- **A｜本次实际读到原文**：2026-10-15 再次打开网页并读取相关正文；该信息可作为当前来源事实，但不能代表网页未来不会修改。
- **B｜上一窗口研究文档记录原文已读**：此前在本项目 REFERENCES.md 或当前 BEX 交接文档明确记载所读章节；本次未逐页再次验证，不能把 B 写成 A。
- **C｜只得到搜索摘要或原文无法重开**：仅可保留待验证的社区线索，不将缺乏原文支持的具体结论作为实施依赖。
- **D｜待验证/未查阅**：指向下一窗口定向查阅的来源或尚未得到可访问内容。

**日期**：本窗口 2026-10-14 开始现场验收与资料研究，2026-10-15 再次核对网页。资料旧记录若写 2026-10-14，仍保留旧日期和原文阅读声明，但另列 2026-10-15 的复核状态。GitHub HEAD 与 Railway 部署均只代表核查时点。

## 2. 外部参考资料——核心原始来源

### EX01 — 勤哲 Excel 服务器《定义数据项》

- 原始网址：https://www.qinzhe.com/cn/tutorial-2015/t-05-03.html
- 日期 / 状态：2026-10-14 既有 BEX #846 REFERENCES §7 标注已读；**2026-10-15 本次再读正文，A**。
- 主题/原文位置：**5.3.1 数据项的属性**；**5.3.2 定义单一数据项**。字段包括位置/名称、数据类型、必填、数据规范、主键。5.3.2 步骤 3 可将单元格左侧标题转为字段名，步骤 5 在同一列表中调整类型和必填，再保存模板。
- 来源事实：设计者可以一次选择多个单元格/数据项，沿用表头名称并集中配置字段规则。
- EVO 用途（**自主判断**）：批量候选默认来自 Excel 列名；字段名和数据类型集中审核；不要让 Human 重输已经知道的名称。
- 限制：此产品的数据项/模板不是 EVO Counterparty 的企业扩展 Schema；不能由此推导出“上传 Excel 即可自动修改核心对象”。

### EX02 — 勤哲 Excel 服务器《模板的概念》

- 原始网址：https://www8.qinzhe.com/cn/tutorial-2015/t-03-02.html
- 日期 / 状态：2026-10-14 #846 记录原文已读；**2026-10-15 复核原文，A**。
- 主题/原文位置：**模板的设计者和使用者**、**模板=表样+填表规定**、**三种类型的模板**。
- 来源事实：字段类型、必填、数据规范和流转要求都可附于业务模板；作者区分设计角色和填写角色；模板分基础数据、业务单据、统计台账等类别。
- EVO 用途：人类业务列定义与 Owner 权限应分层；Excel 文件可以提出候选字段，但并不自动获得企业模型设计权限。
- 限制：其模板、表间公式、工作流能力不等价于 EVO 自身 Host/Agent；本轮不做自由表单引擎。

### EX03 — Microsoft Support《Create a list based on a spreadsheet》

- 英文原始网址：https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet
- 既有中文入口：https://support.microsoft.com/zh-cn/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet
- 日期 / 状态：2026-10-14 #846 §7 已读；**2026-10-15 本次再读英文官方原文，A**。
- 主题/原文位置：**Create a list based on an Excel (.xlsx) file**，主要现代体验步骤 1–6；另有旧版 SharePoint 2016 说明，**不得误当最新 UI**。
- 来源事实：Excel 表头转成 Microsoft List 的列，数据行转为列表项目；用户先选表、指定位置与列表属性。官方特别提醒本地上传源文件可能保存到 SharePoint Site Assets 中，被其他有权人员看到。
- EVO 用途：可一屏从表头发现字段、集中调整草案与用途，再确认；增加明确的数据权限和来源证据提示。
- 冲突/限制：这是 **Excel → 新 Microsoft List**，而 EVO 是 **Excel → 已有供应商对象的企业扩展字段**；不能照搬成“一个文件自动创建新业务对象”。外部文件的存储安全行为不是 EVO 当前实现的事实。

### EX04 — Microsoft Support《列表和库的列的类型和选项》

- 原始网址：https://support.microsoft.com/zh-cn/sharepoint/lists/data-and-lists/list-and-library-column-types-and-options
- 日期 / 状态：2026-10-14 #846 §7 已读；**2026-10-15 再打开原文，A**。
- 主题/原文位置：标题及各类列类型说明，列类型影响输入、显示、筛选/排序能力。
- 来源事实：列类型并非仅显示标签，决定数据可用的操作和输入形式。
- EVO 用途：集中处理界面必须让“账期天数”等可以选数字，不把任何来源列机械设成文本；创建前类型由 Human 确认。
- 限制：SharePoint 列类型不是 EVO Object Extension 类型全集；最终以实际可用的企业 Owner Schema 与权限为准。

### EX05 — Airtable Help Center《CSV import extension》

- 原始网址：https://support.airtable.com/articles/3067164948-csv-import-extension
- 日期 / 状态：2026-10-15 原文实际阅读并复核，**A**；该官方页面显示“Last updated 1 month ago”，未来复查时必须重新查看更新情况。
- 主题/原文位置：**Uploading a CSV file**；**Configure settings and field mappings → Field mappings**；**Resetting field mappings**；**Preview sample records**；**Understanding why CSV values don't import**。
- 来源事实：Airtable 识别 CSV 首行标题，尝试按名称匹配现有字段；其他列可人工映射或不用；映射有重置和再次导入的记忆行为；导入前显示样例记录；部分无法解析的字段可能最终为空而不导致整次导入失败。
- EVO 用途：先复用已有 Schema/Recipe，集中展示建议，保留“忽略/跳过”，展示预览与结果范围；**EVO 不应照搬“部分无法解析但不报错”**，原 subjectType 等关键问题必须在 dry-run 中可见。
- 限制：Airtable 的“Create missing select options”是创建枚举选项，不等于创建 EVO 企业字段；“按字段名匹配”只是候选，不代表语义必然相同。其数据行上限、费用规则和本地映射保存机制不作为 EVO 设计指标。

### EX06 — Nielsen Norman Group《10 Usability Heuristics for User Interface Design》

- 原始网址：https://www.nngroup.com/articles/ten-usability-heuristics/
- 日期 / 状态：2026-10-14 本轮早期引用；**2026-10-15 复核原文，A**。
- 主题/章节：**#5 Error Prevention**、**#6 Recognition Rather than Recall**、**#7 Flexibility and Efficiency of Use**。
- 来源事实：防错约束和适当默认值优先；应在使用场景内直接显示操作，减少跨页面记忆负担；让高频任务有更省力的路径。
- EVO 用途：从“开户银行”发起创建，就带入当前来源列/同名业务名称；一对一占用字段应在其他下拉实时消失；多列不要重复跳新建页。
- 限制：这些是普遍的人机交互启发式，不提供某个批量创建 API 或“应有多少次点击”的行业硬标准；**一次确认**是基于用户现场任务提出的 EVO 方案。

### EX07 — Microsoft Learn《FAQ for Excel to table and app》

- 原始网址：https://learn.microsoft.com/en-us/power-apps/maker/common/faqs-excel-to-table-app
- 日期 / 状态：既有 foundation-list-experience/REFERENCES.md **S04** 标注已读；**2026-10-15 本次重新打开，A（但本轮只核对所需正文，不重做整篇研究）**。
- 主题/原文位置：Excel 到表/应用的可配置元数据和限制；研究记录重点为生成列名/类型与创建前审查。
- EVO 用途：LLM 可以建议字段含义和类型，但有效 Schema、字段授权、必填校验和 Human 确认优先；原 Agent 入口非必经环节。
- 限制：不据其承诺中文自动识别准确率、地区能力，也不把自由建 App 纳入 BEX-01。

## 3. 社区用户反馈（证据强度低于官方说明和本项目现场验收）

### EX08 — Notion 用户《How did I miss this?! The new CSV mapping feature is AMAZING!》

- 原始网址：https://www.reddit.com/r/Notion/comments/1mzxbd1/how_did_i_miss_this_the_new_csv_mapping_feature/
- 日期 / 状态：2026-10-14 本窗口曾引用旧短链接；**2026-10-15 搜索返回 Reddit 原帖标题与公开讨论正文，A（仅该公开讨论）**。
- 主题/原帖位置：2025-08-25 楼内评论：旧 CSV 表头不一致容易创建重复列，新的映射减少人工清理；另有用户指出日期/数字仍会出现导入失败或漏值，提醒导后核对。
- 来源事实：存在欢迎减少重复列操作的用户，同时也存在映射正确但数据不完整的质疑；**不是统计总体满意度**。
- EVO 用途：必须同时优化“是否复用正确字段”和“数据导入后值是否真的落地”，不能只做漂亮的批量映射页面。
- 限制：用户评论不能证明 Notion 内部实现方式或当前所有账户的版本表现。

### EX09 — ClickUp 旧引用“导入生成重复字段”讨论

- 原始网址（上一窗口记录）：https://www.reddit.com/r/clickup/comments/1jjqm3n
- 日期 / 状态：2026-10-14 既有 PR #878 的参考记录声称已读；**2026-10-15 再打开返回 Internal Error，搜索也未核实该精确帖标题和正文，归类 C｜未能复核**。
- 主题/仅存旧线索：重复定义/重新匹配造成整理成本。
- EVO 用途：只能当**需要复核的社区线索**，不能把其具体细节当事实，不作为实施的必要证明。真实的两个“开户银行”不同 ID 的用户截图和 Notion/Airtable 的当前证据已足以说明复用/防重复的必要性。
- 下一步：若此类社区评价对重大产品决策仍有影响，先找到可访问且可确认的原讨论，再引用。

### EX10 — 本窗口早期其他 Reddit 讨论的保全索引

以下网址**曾在本窗口引用**，但本次没有重读原文，因此只保留入口与先前讨论方向，不增强其证据地位：
- https://www.reddit.com/r/PowerApps/comments/1bk99kj/ ：旧窗口将其用于“Excel 导入列类型误判”案例，**C｜仅旧窗口说法，待复核**。
- https://www.reddit.com/r/PowerApps/comments/wkaor3/ ：旧窗口将其用于“事后更改字段类型破坏兼容性”案例，**C｜待复核**。
- https://www.reddit.com/r/nocode/comments/1shj3i4/ ：旧窗口将其用于“Excel 易用性与数据库权限兼顾”讨论，**C｜待复核**。
- 这些社区网址不是必要的架构依据，且不能以其代表全部用户。

## 4. 继承的项目参考，不要与本窗口新研究混淆

旧入口：
- **PR #846 分支的 REFERENCES.md §7**：S10–S13 对勤哲、Microsoft Lists 已读材料的详细记录；**#846 是 Draft，不应只读 main**。
- **原 main 的 docs/plans/foundation-list-experience/REFERENCES.md S01–S09**：SAP、Power Apps 网格与导入、AG Grid 服务端分页、WAI-ARIA grid、Power BI 的项目背景索引；S01/S08 SAP 原网页曾标注只看搜索摘要或无法打开，**不得升级为已读原文**。大数据表格/BI不在当前 BEX-01 收尾范围，不要因此延展实现。
- **PR #878 分支的 BEX-01-BATCH-EXTENSION-REVIEW-20261015.md**：本窗口已经确认的批量体验路线和固定验收表。**仍为未合并独立 PR**；本索引和简短交接保留其关键判断，避免分支未合并时遗失研究遗产。
- **Eidos PR #182** https://github.com/jiangxng/eidos/pull/182：2026-10-15 实际核对已合并，通用 exclusiveSelect；本窗口没有重复阅读其全量源文件或重新跑它的 CI。EVO #866 vendored Eidos 适配仍需经自身 CI 与兼容门禁。
- **Platform PR #862** https://github.com/jiangxng/EVO-App-Platform/pull/862：已合并的单列预填/返回自动选中实现；旧 Railway 开发构建包含它。不是批量保存能力。

## 5. 用户截图、实际操作、不可轻易复现的证据

本聊天中用户提供的原始图片，容器中的短期文件名（**不是 GitHub URL；换窗口不保证仍可取**）：

| 证据文件 | 原始用户场景 | 能证明什么；不能证明什么 |
|---|---|---|
| image(20261014-080843).png、image(20261014-083500).png | 早期字段选择/上下文入口现场截图 | 原有页面与下拉列表可见行为；不能推断后端已创建字段 |
| image(20261014-093222).png | “开户银行”来源列旁点击“创建企业扩展字段” | 新入口已出现 |
| image(20261014-093238).png | 创建页最初选中“系统编码”，而非点击的“开户银行” | 来源列上下文丢失和重复选择 BUG |
| image(20261014-093339).png | 用户改选“开户银行”、手填业务名 | 原创建页面多余步骤 |
| image(20261014-093440).png | 保存后返回仍显示“忽略此列” | 保存后的目标映射未默认选中 |
| image(20261014-093454).png | 下拉中有两个同名“开户银行”、字段 ID 不同 | 已经产生历史重复字段；**不能据截图判断哪个字段有值** |
| image(20261014-102424).png | “默认支付方式”已选中扩展字段，下方“结算方式”“默认账期方式”“账期天数”仍需逐一新建 | **单列修复用户已验证**，但整个文件仍存在三次重复跳转成本 |

用户截图中显示的原 Import Job：**import-0c89df2e-c4e1-40ce-b96b-a4a341bd69a2**。输入文件名记录为 **往来账户2026_10_08_10_15_23.xlsx**。均是当时页面证据，当前 job state、角色和数据是否已变化**未核验**。

本次会话另生成一个**原图未修改的截图 ZIP**：BEX01-CP03-20261014-screenshot-evidence.zip，包含以上 8 张 PNG 和 MANIFEST.txt（文件 SHA-256/大小）。**ZIP 不是 GitHub 内容，不是现有项目附件**；换窗口如要浏览这些原图，需要用户把 ZIP/对应 PNG 上传新窗口。GitHub 本交接只保存其时间、文件名、含义及上述限制。

## 6. 比较过的设计：采用、排除与适用条件

| 方案 | 处理决定 | 原因与证据层级 | 条件 / 限制 |
|---|---|---|---|
| 现状：每列跳创建表单、返回后继续下一列 | **不再作为默认批量流程**，保留偶发单列入口 | **用户截图/实测**证明一个字段可用但多列操作繁琐 | 1–2 个异常字段时仍可手动使用 |
| Excel 未匹配列全部直接忽略 | **排除作为默认** | 用户明确不希望漏导有业务含义的列 | “忽略”仍是用户可选决策；日志类列可提示忽略 |
| Excel 未匹配列自动全部写进企业 Schema | **排除** | 数据可能是系统 ID、日志、错误类型或敏感字段；**本窗口设计判断** | 仅安全业务属性作为“新建候选”，Human 集中确认后才保存 |
| 已有同名字段全部自动复用 | **限条件采用** | 有两个“开户银行”不同 ID 的现场截图；错误自动选中风险高 | 唯一、权限与业务语义无冲突时建议复用；多重同名必须人工判断 |
| 一屏批量字段建议→集中确认→一次创建并自动映射 | **正式采用的 BEX 产品方向，未实现** | 勤哲的批量定义、SharePoint 的表头转列、Airtable 的集中映射均是参考事实；“一屏一次确认”由用户痛点推导 | Owner 权限、不重复定义、恢复机制、一对一映射、dry-run/commit 分离是硬门禁 |
| Agent 自动无确认批量建字段并提交供应商 | **排除** | 项目 Human Gate 和用户对 Agent 兼容的要求 | Agent 只做建议，旧操作/上下文与 Host 契约保持兼容 |
| 直接从 Excel 创建整个新业务对象或应用 | **单独保留长期方向，当前排除** | Microsoft Lists 与 Excel Server 模式与 EVO Counterparty 语义不同 | 不进入 BEX-01 / CP-03、也不借此改企业对象 Owner |

**最重要的区别**：“默认**建议新建**”不等于默认**立即写入**。采用页面载入时生成方案草稿，用户可以一次确认已有字段、拟新增字段、歧义字段、忽略项。**原始来源数据仍保留在导入作业中，确认批量字段定义不等于确认供应商数据导入**。

## 7. 资料/需求之间的冲突与明确未决问题

1. **Airtable 可有无效值导成空、EVO 要求核心必填严格失败**：不能直接复制外部的“跳过不可解析单元格”作为 EVO 的隐式成功。主体类型缺失属于核心数据质量问题；用户明确禁用“往来类型 → 主体类型”的默认猜测。
2. **SharePoint 新 List vs EVO 已有基础对象**：SharePoint 适合快速形成自由列集合，EVO 供应商必须保留唯一对象权威、授权与企业扩展范围。不存在“看到 Excel 就全量建新对象”的开发授权。
3. **字段名相似 vs 字段语义相同**：开户银行 vs 银行名称、结算方式 vs 默认支付方式可能差异明显；两条相同字段名也未必代表同一实体。下一步必须明确复用建议的语义安全与同名归属。
4. **“账期天数”推荐类型**：来源是字符串列还是数值、空值/单位如何处理、零与空的含义等需要真实 XLSX 样本；推荐数字属于待核实推断，不可假装原文件全部为数字。
5. **批量写入的“原子性”与失败恢复**：目前单字段 create-from-import 命令已存在，不等于已经具备跨 N 个字段的事务。尚需确定：全部预检查失败即不执行、部分成功如何报告/重试、如何防并发重复、来源映射何时保存；不擅自要求 PA-02 重写 Object Extension Owner 存储。
6. **源列与系统目标一对一 vs 常量/转换**：用户要求的是两个不同 Excel 列不能重复占用同一系统字段。#866 对普通目标映射增加排他；现存 CONSTANT/advanced transform 的领域语义需按已有数据导入契约区别处理，不机械剥夺合法操作。
7. **PR #866 的跨项目 CI 失败是否因 BEX 造成**：目前仅知道失败工作流名称和失败步骤，不知道准确原因；后续需要拉取失败 job logs。不能把“其他窗口造成”的推测直接当因果结论。
8. **PR #878 因 main 移动而 behind**：其 CI 曾全绿，并不意味着已合并；不要为文档收口而 force-push、重写他人 main 或继续造并行实现分支。
9. **已经重复创建的两个“开户银行”**：必须先查哪个有引用、实际值、Schema surface、关系角色和导入历史，再经业务确认保留/归并。**不能自动删除或以相同名称就认定两个字段可直接合并**。
10. **用户原始 Excel 本体未取得**：只能依据现场截图和之前 3 行缺失反馈，不得声称已验证每行字段值、类型或最终供应商详情。

## 8. 推荐继续阅读方向（只在存在实际缺口时）

1. **最优先：GitHub #866 失败 job 的准确日志**，两个名称：Agent PA-01B2 Full Isolated Chrome Host Acceptance（失败步骤 Full real Workbench to Thread to Run to source browser proof），Cross Project CI - Trading Lite Eidos Browser EVO（失败步骤 Certify browser to EVO Ledger）。检查失败与本 PR、Eidos #182、并行主线变动的实际因果。
2. **真实 XLSX 取样**：在获得用户原文件或可访问作业样本之后，针对“结算方式”“默认账期方式”“账期天数”和三行主体类型缺失核实值分布。避免对没有样本的数据类型做未经证实的断言。
3. **实际批量命令能力**：查 apps/object-extension/actions.ts 和 repository.ts 当前幂等、权限、冲突检查；查 apps/data-import/service.ts 的 mapping/Recipe/dryRun；查 Eidos Owner 的已有可复用“批量预览+一次确认”控件能力。仅在缺失时设计局部扩展。
4. **社区资料非阻塞**：EX09/EX10 无法重新定位的帖子只有在需要重新支持某一设计争议时再查；优先以用户实际截图和已复核官方资料为依据，不做无限行业搜索。

## 9. 对应模块、GitHub 文档、分支、验收门禁

- **字段映射 UI**：apps/data-import/page.ts；字段排他通用组件（Eidos Owner PR #182）：vendor/eidos/src/runtime/contracts.ts、renderers/html/index.ts、app-host/page-controller.ts。EVO #866 当前正改这些文件——**先与其 owner 同步并收口**。
- **导入服务与回归**：apps/data-import/service.ts，tests/protocol/data-import-counterparty.test.mjs，tests/bex01/live_supplier_chromium.py；批量实现必须覆盖 BEX Host Chromium，服务端拒绝重复目标字段，不只做下拉视觉效果。
- **企业扩展字段**：apps/object-extension/page.ts、actions.ts、repository.ts、constants.ts。复用原 Owner 的定义、权限与保存语义，不更改 PA-02 Owner 数据存储实现。
- **Host/Agent**：只消费原有 Agent 行为，保护 ai-auto-map 与上下文；不迁移 PA-02 async/Thread/Run 工作；核心 subjectType 规则不得放宽。
- **项目文档**：同目录 README.md、PLAN.md、BEX-01-INLINE-EXTENSION-DISCOVERY-20261014.md；交接 PR #846 的 BEX-01-EXTENSION-USER-CLOSURE-20261014.md 与 REFERENCES.md §7；批量方案 PR #878 的 BEX-01-BATCH-EXTENSION-REVIEW-20261015.md。不要编辑 project.status.json 或共享 HANDOFF-LATEST。
- **固定验收门禁**：①一对一选择和释放 + 后端/Agent 防重复；②多个未匹配列一屏分类与编辑；③一次保存字段+回填映射，重试不重复；④权限/隐私/异常类型、必填项/导入分离；⑤真实 Host+Chromium、Plugin/Platform CI；⑥只部署经验证固定 SHA 至现有 Railway 开发服务；⑦用户原 Excel 人工签收和详情核验。每次按“验收项目｜当前状态｜下一步”更新，不使用数字倒计时。

## 10. 文件保存范围与未保存内容

**保存在本交接 GitHub 分支中的内容**：本详细参考索引 + [简短交接入口](BEX-01-WINDOW-HANDOFF-ENTRY-20261015.md) 的文字、来源网址、阅读证据层级、方案比较、失败状态、代码位置、截图索引。**未修改**原 PR #846/#866/#878，未部署 Railway，也未覆盖其他窗口文件。

**未保存到 GitHub 的内容**：
- 8 张用户原始截图 PNG 本体；暂存于当前聊天容器及本聊天截图 ZIP，需要新窗口时自行上传。
- 原始用户 Excel 文件本体；当前未检索到可访问的文件，不声称已经保存。
- PR #866 两项失败 CI 的完整日志和根因（目前只保留检查/失败步骤，待下一窗口取证）。
- 需登录且随时变化的线上 Railway UI 快照；以原提交、PR、工作流和用户手动截图作为可再现入口。

**权威性**：本交接不是平台全局状态权威。PR/部署/源码一切以新窗口重新查询为准；若已确认决策需要变更，必须记录新证据、改变原因、验收范围影响，再追加在同一 BEX 文档体系。
