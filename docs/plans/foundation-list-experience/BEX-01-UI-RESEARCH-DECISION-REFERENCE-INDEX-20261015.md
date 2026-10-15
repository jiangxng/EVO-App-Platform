# BEX-01 界面研究资料与决策详细参考索引 — 2026-10-15

> **本索引与 [简短交接入口](BEX-01-UI-RESEARCH-HANDOFF-ENTRY-20261015.md) 配套。** 保存完整参考遗产和明确的读原文/摘要边界。已完成研究复用，不开展重复的互联网调查。原始文献事实、Eidos 设计权威和 EVO 场景推断分开记录。
>
> **本轮仓库核验成果**：此前的导航与颜色不是散落在 Platform 的独立方案，而是 Eidos `EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md` 和 `EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md` 的正式权威，Eidos `EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md` 是先读的总入口。Platform 通过 `docs/architecture/EIDOS-NAVIGATION-INFORMATION-ARCHITECTURE-ADOPTION-v0.1.md` 采纳。新增的视觉/认知研究归入 Eidos [PR #183](https://github.com/jiangxng/eidos/pull/183)；Platform 设计工作门禁由 [PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904) 跟进。以各 PR 的合并状态为准，不提前声称 main 已启用门禁。

## 1. 记录规则及重要证据

- **R-已读仓库原文**：本轮在 GitHub 打开了 Eidos 总纲 §1–19 的相关完整章节、导航与 IA、现有 Productive Design、Business Office Visual Language、Eidos 旧来源资料架以及 Platform adoption/项目规则。本轮没有把 Google/NNg 页面重爬一遍。
- **A-前序已读网页正文**：既有 2026-10-15 研究文件明确标记已读的外部可见正文；**这次只复核了该 GitHub 研究记录，并未对每条外部 URL 重新读取**。
- **B-只读正式论文题录及摘要**：V07、M02，不能写成全文阅读。
- **C-只读搜索摘要/原文打不开**：如 M07、M08、F01、F02，不能把具体研究细节当已证实。
- **D-待验证**：当前真实 Import Job 的源字段映射、历史 Recipe 恢复缘由、截图原始附件长期保存、三行主体类型的最新数据、更正正式供应商后的可审计流程。
- 工具代码/页面与用户实际浏览器的区别：PR 代码/CI PASS ≠ 开发环境成功 ≠ 当前用户原 XLSX 的真实验收。自上轮已确认的固定开发部署 `7620f15f`，**本次研究没有部署任何运行时功能**。

## 2. 原有导航与颜色权威（本轮实际核验 GitHub 文档）

| 编号 | 权威文档原始 URL | 查阅日期与状态 | 确定事实 | 对 EVO 的用途 |
|---|---|---|---|---|
| E01 | https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md | 2026-10-15，仓库原文相关章节已核验 | Experience Architecture → Navigation/IA → Productive Interaction → Business Office Visual → Mobile/Icon；内置 Fresh-LLM 工作流；界面不是单纯 CSS | 明确所有 LLM UI 修改前的必读总纲，不另建第二套设计系统 |
| E02 | https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md | 2026-10-15，仓库原文相关章节已核验 | 导航是有意的业务可发现性投影，非已安装插件清单；业务工作/管理/设置/上下文工具各有边界 | 字段审核入口靠近当前导入任务，不让用户追技术菜单 |
| E03 | https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md | 2026-10-15，**仓库原文全文已核验** | 柔和中性底+白内容面+克制的品牌蓝；业务内容先于技术 chrome；正常图标单色、语义色不装饰；插件不得重造配色 | 数据导入 V2 沿用现有颜色/字号/按钮 tokens，不能自创品牌蓝或大面积彩色卡片 |
| E04 | https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md | 2026-10-15，仓库原文主要章节已核验 | 一个主要动作，渐进展开，紧凑与可点目标并重，用户看到业务语言 | 两阶段可见流程，异常摘要优先，22 来源列完整可展开 |
| E05 | https://github.com/jiangxng/eidos/blob/main/docs/product/DESIGN-RESEARCH-SOURCES-v0.1.md | 2026-10-15，仓库原文已核验 | 旧参考架包含 VS Code、Fluent 2、Carbon、Apple HIG、WAI、direct manipulation、Human-AI mixed initiative 等 | 用作既有资料权威，不把旧清单当本次新读文献 |
| E06 | https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/EIDOS-NAVIGATION-INFORMATION-ARCHITECTURE-ADOPTION-v0.1.md | 2026-10-15，仓库原文已核验 | Platform 由 Eidos 导航语义派生，本平台负责 Workbench/Settings 中业务落点 | 不能改别的窗口通用 Workbench 导航，BEX 插件只在上下文内改体验 |

## 3. 视觉注意、层级、格式塔、眼动与无障碍（V01–V16）

**日期：** 原专题于 2026-10-15 建索引；本窗口仅核对并继承其「原文已读/论文摘要」记录，不把 R 写成重新查过原文。

| 编号 | 标题与原始 URL | 前序阅读状态 | 章节/重要发现 | 适用于本项目的设计推导 |
|---|---|---|---|---|
| V01 | NN/g, *5 Principles of Visual Design in UX*, https://www.nngroup.com/articles/principles-visual-design/ | **已读网页正文**，§Scale / Visual Hierarchy / Balance / Contrast / Gestalt；原文 2020，显示 2026-09 reviewed | 视觉五原则，重点稀缺性；部分建议将元素大小保持少数层级 | 限制字号层级、减弱大部分重复按钮 |
| V02 | NN/g, *Visual Hierarchy in UX: Definition*, https://www.nngroup.com/articles/visual-hierarchy-ux-definition/ | **已读网页正文**，§Color and contrast / Scale / Grouping / Squint Test | 对比、尺度、组别与模糊测试 | L1→异常→CTA 的视觉次序 |
| V03 | NN/g, *Proximity Principle in Visual Design*, https://www.nngroup.com/articles/gestalt-proximity/ | **已读网页正文**，§Place Related Elements near Each Other / Proximity May Shift in Responsive Designs | 空白间距产生分组，响应式可能破坏关系 | 4 类业务组别与窄屏排列 |
| V04 | NN/g, *The Principle of Common Region: Containers Create Groupings*, https://www.nngroup.com/articles/common-region/ | **已读网页正文**，§Use/Common Region / Conclusion | 共同边界强化分组；过多容器和强分隔产生假页面结束 | 保留少量大组、减少逐行卡片 |
| V05 | NN/g, *Text Scanning Patterns: Eyetracking Evidence*, https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/ | **已读网页正文**，§Scanning Patterns / Summary | 多种扫视模式受任务/布局影响 | 左侧高价值字段与分组标题 |
| V06 | NN/g, *F-Shaped Pattern of Reading: Misunderstood, But Still Relevant*, https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ | **已读网页正文**；不能把 F 模式普遍化 | F 只是多种扫视中的一种 | 避免机械 F 型强制排版 |
| V07 | Tuch et al. (2012), *The role of visual complexity and prototypicality regarding first impression of websites*, https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/ （DOI: 10.1016/j.ijhcs.2012.06.003） | **已读正式论文题录与摘要；未读完整论文** | 两组实验；网页低复杂度与典型性影响早期审美印象；不能推断业务任务效果 | 降低无意义视觉复杂度的辅助证据 |
| V08 | NN/g, *The Aesthetic-Usability Effect*, https://www.nngroup.com/articles/aesthetic-usability-effect/ | **已读网页正文**，原理/设计限度 | 美观可能掩盖轻微可用性问题 | 必须做真正的数据纠错与用户验收 |
| V09 | IBM Carbon, *2x Grid – Guidelines*, https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/guidelines | **已读官方正文**，§Fit for purpose / Content hierarchy / Continuity and contrast / Style models | 模块对齐，布局随产品任务在默认与高密度间切换 | 轻概览与专业表格使用不同密度模式 |
| V10 | IBM Carbon, *Spacing*, https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview | **已读官方正文**，§Spacing | 2/4/8 倍数的间距比例系统 | 拟定节奏并匹配 eidos tokens |
| V11 | USWDS, *Table*, https://designsystem.digital.gov/components/table/ | **已读官方正文**，§Striped / Scrollable / Responsive stacked table | 表格有对比优势，窄屏可堆叠 | 22 列建议在表格中对齐审查，不堆表单 |
| V12 | USWDS, *Font size*, https://designsystem.digital.gov/design-tokens/typesetting/font-size/ | **已读官方正文**，§Theme tokens / System tokens | 文字比例体系，避免随意指定大量微小字号 | 中英文标题、正文与元信息层级 |
| V13 | W3C WAI, *Understanding 1.4.3 Contrast (Minimum)*, https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum | **已读官方解释正文**，§Success Criterion / Intent | AA 正常文本 4.5:1，大文本 3:1（有条件） | 控件与正文配色可读 |
| V14 | W3C WAI, *Understanding 1.4.11 Non-text Contrast*, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast | **已读官方解释正文**，§UI Components / Focus | 重要非文字控件与状态可感知部分 3:1 | 选择框、焦点、状态图标可辨 |
| V15 | W3C WAI, *Understanding 1.4.1 Use of Color*, https://www.w3.org/WAI/WCAG22/Understanding/use-of-color | **已读官方解释正文**，§Intent / Examples | 颜色不是唯一信息手段 | 状态显示文字 + 图标而非红绿点 |
| V16 | GOV.UK Design System, *Summary list*, https://design-system.service.gov.uk/components/summary-list/ | **已读官方正文**，§When to use / When not to use / Summary cards | key/value 摘要可用；明示不适合一般 tabular data | 概览摘要使用，完整映射网格不用 summary-list |

## 4. 工作记忆、跨年龄注意力、中断与认知负担（M01–M08）

**日期：** 前序专题于 2026-10-15 建索引，重要差异：Cowan ≈4 chunks 是论文摘要的有条件实验结论，不是“最多 4 个控件”。

| 编号 | 标题与原始 URL | 前序阅读状态 | 章节/重要发现 | 适用于本项目的设计推导 |
|---|---|---|---|---|
| M01 | Raluca Budiu, NN/g (2024), Memory Recognition and Recall in User Interfaces, https://www.nngroup.com/articles/recognition-and-recall/ | 已读原网页正文，§Recognition vs. Recall、§Promote Recognition | 可见选择和上下文帮助识别，历史活动提示恢复 | 历史映射/建议直接显示于来源列旁 |
| M02 | Nelson Cowan (2001), The magical number 4 in short-term memory, https://pubmed.ncbi.nlm.nih.gov/11515286/  DOI 10.1017/S0140525X01003922 | 已读 PubMed 正式题录和摘要，**未读论文全文** | 条件受控时短时记忆容量平均约四组块，不是所有场景的普适 UI 限制 | 不要求用户暂时记住 22 项选择；不创设「4 个按钮」规则 |
| M03 | W3C COGA (2021), Making Content Usable for People with Cognitive and Learning Disabilities, https://www.w3.org/TR/coga-usable/ | 已读官方指南相关 §4.5、§4.6.2、§4.6.3、§4.7.5 正文 | 减步骤、保留信息、避免丢失、能返回和更正；这是 Working Group Note，非 WCAG 额外合规门槛 | 同一页面双状态、持续上下文、草稿与恢复 |
| M04 | Kate Kaplan, NN/g (2021), Designing for Long Waits and Interruptions, https://www.nngroup.com/articles/designing-for-waits-and-interruptions/ | 已读正文及五项建议 | 中断与等待需要进度、历史、上下文摘要和后台进展 | 上次作业恢复与已保存的决定 |
| M05 | Lexie Kane, NN/g (2019), Usability for Older Adults: Challenges and Changes, https://www.nngroup.com/articles/usability-for-senior-citizens/ | 已读网页正文，Research Program / Changes Over Time / Challenges | 三轮研究总计 123 位 65+ 参与者；技术经验各异，排版和点击目标不可过小 | 不按年龄分流，所有人默认容易看、点、修复 |
| M06 | Raluca Budiu, NN/g (2013, revised 2024), Interaction Cost, https://www.nngroup.com/articles/interaction-cost-definition/ | 已读原网页正文，§What Is Interaction Cost | 成本涵盖阅读、操作、等待、切换注意力和记忆 | 减少真实工作负担，不只是计算点击次数 |
| M07 | National Institute on Aging, Memory Problems, Forgetfulness, and Aging, https://www.nia.nih.gov/health/memory-loss-and-forgetfulness/memory-forgetfulness-and-aging-whats-normal-and-whats-not | **仅看搜索结果摘要**，原站打开失败 | 年龄相关记忆变化存在但表现有差异，未证实其他细节 | 仅作为背景，不用于年龄阈值/能力标签 |
| M08 | NN/g, Usability for Senior Citizens: Improved, But Still Lacking (2013), https://www.nngroup.com/articles/usability-seniors-improvements/ | **仅看详细搜索摘要**，未打开全文 | 早期年龄组使用差异有特定年代数字经验影响 | 不将旧样本数字当作现今普遍定律 |

## 5. 之前的使用流程研究引用（不丢失阅读状态）

| 编号 | 原始标题与网址 | 前序阅读状态 | 关键发现/具体用途 |
|---|---|---|---|
| F01 | Apple HIG Design Principles — https://developer.apple.com/design/human-interface-guidelines/design-principles/ | 只见搜索摘要，打开原文需要 JS | 用户自主、任务优先；不用它伪称已读全书 |
| F02 | Apple HIG Disclosure Controls — https://developer.apple.com/design/human-interface-guidelines/disclosure-controls | 仅搜索摘要 | 高级细节按需展开 |
| F03 | NN/g Progressive Disclosure — https://www.nngroup.com/articles/progressive-disclosure/ | 前序记录已读网页原文主要正文 | 初始只给关键选择，进阶能力按需展开且别层层跳页 |
| F04 | NN/g Ten Usability Heuristics — https://www.nngroup.com/articles/ten-usability-heuristics/ | 前序记录已读原文 | 系统状态可见、识别优于回忆、容错恢复；不是某个 API 的具体规范 |
| F05 | GOV.UK Summary List — https://design-system.service.gov.uk/components/summary-list/ | 前序记录已读官方正文 | 决策摘要可改；22 行数据列表用对齐表格，别把 summary list 错当 tabular grid |
| F06 | Microsoft Lists Excel import — https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet | 旧 BEX 索引 EX03 记录 2026-10-15 已读官方英文正文 | Excel 表头、列类型和确认动作可合并整理；但新建 List 不等价于改已有供应商对象 |
| F07 | Airtable CSV Import Extension — https://support.airtable.com/articles/3067164948-csv-import-extension | 旧 BEX 索引 EX05 记录 2026-10-15 已读官方正文 | 优先按字段名复用、用户能改映射、显示样例、可重置；不要复制可能悄悄空值的行为 |

其它旧 BEX 参考资料与社区反馈入口、失败网页访问状态仍由 [原 BEX 总研究索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md) 负责。本轮不提升其证据级别。

## 6. 方案比较、确认决定与限制

| 备选方案 | 取舍 | 证据和理由（来源事实与 EVO 决定分开） |
|---|---|---|
| 继续 22 个大下拉 + 每列链接 | **排除默认视图** | 用户截图确证布局拥挤；NN/g 视觉层级/渐进呈现及工作记忆研究提供解释，但最终是否更好仍待业务测试 |
| 仅把 22 行缩成紧凑表格 | **只用于按需展开的高级明细** | 表格提高比较效率，但不能让常规用户每天仍逐列完成全部决策 |
| 全部字段自动创建/自动导入 | **排除** | 安全、权限、审核及三行主体类型真实缺失不能跳过；系统保存原始全部列≠写所有列为业务 Schema |
| 由 AI 自动匹配后让用户只看异常 | **有条件采用** | 先复用既有 Human/Recipe 决定，AI 只建议未知列；权限与 Agent 上下文不改变；AI 失败有人工路径 |
| 2 个用户感知阶段：上传 → 核对并导入 | **推荐作为 V2 设计，尚未实现/签收** | 降低来回跳页与回忆成本；内部仍保留 Schema 创建确认、dry-run 和最终提交的独立风险门禁 |
| 摘要优先、少量例外、同屏改错，完整字段可见 | **推荐，尚需 Human 验收** | 视觉格式塔分组、NN/g 识别优于回忆与 W3C COGA 指导；不能以漂亮截图替代实测 |
| 按年龄自动选择“弱化功能”模式 | **排除** | 群体差异并不等于个体能力；对所有人默认可读、可恢复，同时允许专家查看高级表格 |

**已确认产品规则（不能改）：** 历史匹配优先；一个来源列一个系统目标；AI 非强制；未匹配真实业务列默认建议创建但未经确认不写数据库；完整原始 Excel 列保留；B 方案一屏集中审核一次批量创建/自动映射；预检查后显式提交；Agent 原入口和上下文保持；缺失三行 subjectType 不自动推断；两个同名“开户银行”不自动合并/删除；允许用户选错并进行可追溯修复。

**设计提案与已确认决策区分：** 「两阶段同屏、默认例外摘要、候选 16px 字体、保存进度视觉」目前是本轮建议与原型，并非用户已经正式通过或线上已实现的状态。

## 7. 来源冲突、易变资料和未决研究

- 前序页面的候选 24px/16px/8px 设计尺寸与 Eidos 已有字号、4px spacing rhythms 存在数字差异：**实际实现以 Eidos tokens 为准**，本地原型数字只作视觉试验。
- 「一个按钮」不是绝对只能有一个操作入口，而是一个范围内只有一个最高视觉权重的主动作；忽略、撤销、查看明细与权限确认仍可达。
- NN/g 眼动 F 模式不能强行当布局公式；不是所有使用者都按同一个视觉路径扫视。
- W3C COGA 是 Working Group Note，不是 WCAG 2.2 AA 的额外强制条款；WCAG 正式色彩/焦点规范另行遵循。
- Tuch 低复杂度和典型性只说明其实验中的早期美感评价，不能推导字段导入准确率；必须以真实业务任务测试。
- 未读学术全文：V07 Tuch 原始研究、M02 Cowan 原文全文；重要实证判断应在可访问时专门查原论文。
- 需要继续：不同数字经验群体的真实实机测试；页面断点恢复与错误修订的持久化语义；人如何比较两条同名业务字段；原 Excel 真实对象数据的审计修复方案。
- 项目原截图存在于 2026-10-15 这段聊天而**未附着到 GitHub**。临时工具容器曾挂载 `/mnt/data/image(20261015-015021).png`（22 列相关）与 `/mnt/data/image(20261015-023214).png`（截图版本请按聊天消息核查）；**容器路径不保证下个窗口可访问**。源文件 `往来账户2026_10_08_10_15_23.xlsx` 的二进制原件也未保存到研究 PR。
- 实际 Import Job `import-33ff3446-80c5-4992-b5c6-710f415535b3` 的私有内容尚无被授权的完整读取证据，不能凭截图判断 Recipe 丢失原因；不要反向修改历史正式业务数据。

## 8. 与实现、分支和文档的连接

- Eidos 设计权威/色彩导航来源 → [Eidos PR #183](https://github.com/jiangxng/eidos/pull/183)，研究索引 `docs/product/EIDOS-VISUAL-COGNITIVE-RESEARCH-REFERENCE-INDEX-v1.0.md`、设计必检 `docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`。
- Platform 采用 → [Platform PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904)，涉及 `.clinerules/03-human-ui-design-review.md`、`AGENTS.md`、`docs/architecture/EIDOS-HUMAN-UI-DESIGN-REVIEW-ADOPTION-v0.1.md`、`tools/ui-design-review-gate.mjs`、对应 GitHub Actions。
- 本窗口 BEX 研究 → [Platform PR #899](https://github.com/jiangxng/EVO-App-Platform/pull/899)：原流程、视觉、认知三文档，静态交互原型 `BEX-01-IMPORT-V2-COGNITIVE-PROTOTYPE-20261015.html`，本详细索引与简短入口。**设计研究 PR 不是实现 PR**。
- 未来最小 BEX 实现范围：`apps/data-import` 的任务和原始记录/映射恢复/预检查；`apps/object-extension` 的确认批量创建；现有 PA-02/PA-04、Eidos 共享源码、Host 通用治理未经本次授权不调整。
- 下一窗口：先核对最新 main、开放 PR、三项检查门禁实际是否已合并；在项目现有状态表中记录 BEX V2 Human 视觉/流程/记忆设计仍待签收；再按测试证据实施，不直接上线未经确认的 V2。
