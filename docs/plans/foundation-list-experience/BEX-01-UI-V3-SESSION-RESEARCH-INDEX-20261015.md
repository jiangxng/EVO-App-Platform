# BEX-01 / CP-03 V3｜本窗口研究资料、设计取舍与证据详细索引（2026-10-15）

> **配套简短入口：** [BEX-01-UI-V3-SESSION-HANDOFF-20261015.md](BEX-01-UI-V3-SESSION-HANDOFF-20261015.md)。  
> **原则：只收录本窗口实际引用过、或此前研究文档明确留有阅读记录的资料。** 不臆造新的调研结果、未访问过的官网交互、真实客户数据或未执行的 Human 测试。网络来源事实、对 EVO 的**推论/方案决定**、实际代码/CI 三者不得混用。

## 1. 资料等级与分层继承

- **A｜既有记录明确“打开并读过相关原文”**：可复述确有记录的段落；但此交接整理时没有再次打开外站，应写“既有记录已读”，不能冒称交接当天重新读过整站。仓库源码则可以标“本次直接核实”。
- **B｜搜索工具提取出可见原文段落/章节**：可保留提取的特定信息，**不等于完整读过网页**；如直接打开只有空白/零行，必须保留限制。
- **C｜只见搜索结果摘要、图片预览/题录**：仅是设计线索，不能推出整套产品行为。
- **D｜待验证/未取得原文或真实产品证据**：不能作为已确认实现要求所依赖的外部事实。
- **R｜已从 GitHub 核实的代码/设计文档**：这是 EVO/Eidos 仓库事实，不代表来源所主张的通用科学理论已经另行验证。

**继承资料不要遗漏：** 
1. [视觉/认知/无障碍原索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md) 有 **V01–V16、M01–M08、F01–F07** 的原始 URL、章节定位和“原文/论文摘要/搜索摘要”等级；这一份不重造那约 30 条历史阅读记录。
2. [流程/产品方案原索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md) 有 **EX01–EX10**（勤哲、Microsoft Lists、Airtable、NN/g、Notion/ClickUp 社区）的逐条原始出处、日期/阅读等级及比较；旧社区反应不能上升为产品官方事实。
3. [视觉认知综合研究](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md) §一–§六、§十一；[Business Office 高保真品质范例](BEX-01-BUSINESS-OFFICE-HIGH-FIDELITY-QUALITY-REFERENCE-20261015.md) §1–§7；详述了本轮决策来源及为何用户认可新版，而不是另造未经测试的品牌皮肤。

## 2. 中国软件：本窗口已使用的原始网络资料

**查阅日期**均为 **2026-10-15**（由本轮已有研究记录继承，本次交接只重新核对 GitHub 中保存的研究内容）。为避免将检索提取误作原文全文，每条分别保留可复核的等级。

| ID / 资料标题与原始网址 | 实际阅读等级 | 对应主题及仅根据已有记录可确认的发现（来源事实） | EVO 用途与不能过度推断之处（产品判断） |
|---|---|---|---|
| CN01 飞书《飞书智能伙伴 Aily 之数据表》 https://www.feishu.cn/content/vl1lf3v5 | **A：既有记录已打开并阅读相关原文**，未声称逐页全读 | Excel 导入可选表头/数据行和导入列；AI 辅助按名称/类型匹配，未匹配项可人工改；报告错误记录；草稿和提交动作可区分 | “机器先匹配、人只改歧义”，不让用户从空白的 22 个下拉开始；**不代表 EVO 已获得飞书 AI 或数据表实现** |
| CN02 飞书《多维表格应用模式》 https://www.feishu.cn/content/article/7578812241772924111 | **A：既有记录已打开并阅读相关原文** | 区分底层数据表/运行数据基础与按业务角色配置的应用化使用界面 | 前端工作台用业务对象/任务表达，底层仍有 Schema/权限/插件；**不代表直接复用飞书产品** |
| CN03 飞书开放平台《响应式设计指南》 https://open.feishu.cn/document/design-specification/responsive-design/responsive-design-guidelines?lang=zh-CN | **B：检索提取章节/原文段落**；直接打开返回零行，**非完整原文审阅** | 既有记录涉及 Web 8px 节奏和 4px 微调、移动 4dp、栅格/安全边距/断点，以及不同设备组件转换 | 将“桌面表格→手机字段卡片”作为 Eidos 下的跨设备形态转换；**不是直接复制飞书数值、tokens 或断点** |
| CN04 飞书/Lark《Style / Visual specifications》 https://open.larksuite.com/document/tools-and-resources/design-specification/gadget-design-specification/visual-specifications/style | **B：检索提取相关原文**；直接打开无有效行 | 中性色承担文字/背景/边框，功能色表达状态；文字色层级须节制 | 视觉克制、可扫描，品牌蓝/警告橙/成功绿只做语义，复用 Eidos 而非再发明 Feishu 风格 CSS |
| CN05 飞书应用引擎《常见页面设计原则》 https://ae.feishu.cn/hc/zh-CN/articles/768591170201 | **B：检索正文摘要和段落**；直接打开零行 | 先布局骨架再设计元素，涉及上/下、左右/T 形等后台常见布局与内容宽度实践 | 先定“当前对象→异常→操作→详情”的业务骨架，不把 1200px 作为所有页面必须遵守的硬值 |
| CN06 飞书/Lark《Message card design specifications》 https://open.feishu.cn/document/ukTMukTMukTM/ugDOwYjL4gDM24CO4AjN | **B：检索提取较完整正文**，未称 HTML 全文已打开 | 先主后次、内容模块化、状态色和行动入口有目的地组织 | 支持“状态 + 就近处理”的理念；**消息卡并非导入工作台，不照搬其控件大小/模板** |
| CN07 飞书开放平台《抽屉》 https://open.feishu.cn/document/design-specification/component----feedback/drawer | **B：检索到组件正文**；直接打开零行 | 侧面板可让用户在主任务上下文附近查看/操作附加内容 | 同名字段比较、查看来源证据等可用同页展开/侧栏；并非必须抽屉化所有高级选项 |
| CN08 简道云官方《CRM 业务关键字段导入》 https://hc.jiandaoyun.com/solution/13147 | **C：本轮仅搜索摘要**，完整原文仍待复核 | 已有摘要提到数据工作表/表头预览、配置表单字段、导入结果/数量与校验提示 | 用户能在一条业务旅程中看见“来源数据→字段匹配→反馈结果”；不能由摘要推断所有版本的内部导入架构 |
| CN09 简道云官方《导入关联数据》 https://hc.jiandaoyun.com/doc/18609 | **C：仅搜索摘要** | 摘要认为关联数据必须唯一匹配，缺失或多重匹配需处理 | 强化遇到歧义时让人确定身份而不是自选任意候选；**它讨论的是关联记录，不是 EVO 两个同名开户银行字段的自动处理证明** |
| CN10 伙伴云官方《导入 Excel 数据》 https://hc.huoban.com/tables/8a9a/974b | **A：既有记录已打开网页相关内容**；截图只见搜索呈现 | 已有记录提及可见表头和样本行、对应关系以及新增/更新模式等业务入口 | 预览与字段处理相邻，不让使用者去另一个设置区回忆上一页；**不得据此声称已测试最新伙伴云 UI** |
| CN11 畅捷通/好生意字段匹配参考截图 https://service.static.chanjet.com/kj_java/20230505/2f079522361a4f18912a4519d691216b3.2-7.png | **C：仅见图片搜索结果**，原页面上下文待证实 | 截图展示“表头字段匹配”的中文业务字段、Excel 来源、已匹配和未匹配入口 | 用作中文业务文案、状态可见性的静态界面参考；不得解释其背后的自动化能力 |
| CN12 WPS/金山文档官方首页 https://docs.wps.cn/welcome | **C：仅官网搜索摘要**，**导入行为待验证** | 摘要仅覆盖文档、智能表格、表单/多维表格等办公入口 | 理解中国办公软件用户熟悉的 UI 语汇；不可无证据声称 WPS 具有某项特定 Excel 映射算法 |

**国内参照的综合判断（EVO 自主选择，而非以上每一家官方共同宣言）：**  
**功能不必四处找、信息不必靠人记、异常有明确办法、操作不绕路。** 要借鉴“减少查找、记忆与跨页切换成本”的任务组织方法，而非照抄飞书/简道云的图标、品牌蓝或页面 HTML。

## 3. 国际/认知资料：本窗口真正用来支持决策的关键条目

下表只保留直接改变了这次方案的关键来源；完整 16 条视觉、8 条记忆资料与更多产品链接及阅读等级**仍以 §1 所列老索引为准**。

| ID、原始资料与网址 | 日期/已有阅读等级 | 来源发现（注明局限） | EVO 的推导与位置 |
|---|---|---|---|
| M01 NN/g《Recognition Rather Than Recall in User Interfaces》 https://www.nngroup.com/articles/recognition-and-recall/ | 2026-10-15，**旧索引记录已读网页正文** | 识别可见信息通常比重新回忆过去选择所费成本更低 | 页面提供已保存的映射和候选业务用途，而非要求记字段 ID；详见认知文档 §二 |
| M02 Nelson Cowan (2001) *The magical number 4 in short-term memory* https://pubmed.ncbi.nlm.nih.gov/11515286/ | 2026-10-15，**仅论文题录与摘要**，未读全文 | 短期记忆平均约四组块受实验条件约束 | 不要让用户靠脑内缓存 22 列；**不**据此制定“最多四个按钮”的伪规则 |
| M03 W3C COGA *Making Content Usable...* https://www.w3.org/TR/coga-usable/ | 2026-10-15，**旧索引记录已读 §4.5、§4.6.2、§4.6.3、§4.7.5** | 简化必要步骤、避免无故重复输入、持续提供理解任务所需信息、可纠错 | “继续上次导入”、就地处理、保存上下文；**COGA Working Group Note 并非 WCAG AA 强制新条款** |
| M04 NN/g *Designing for Long Waits and Interruptions* https://www.nngroup.com/articles/designing-for-waits-and-interruptions/ | 2026-10-15，**旧索引记录已读相关正文** | 中断/等待后需要任务状态、进度、上下文与恢复线索 | Host 持久导入 Job 的继续入口，避免伪本地浏览器持久化 |
| M05 NN/g *Usability for Older Adults: Challenges and Changes* https://www.nngroup.com/articles/usability-for-senior-citizens/ | 2026-10-15，**旧索引记录已读相关正文** | 小字号、点击区域、陌生术语影响一些用户，数字经验差异大 | 不按年龄隐藏功能；中文正文/按钮默认易读、手机可实际点击 |
| M06 NN/g *Interaction Cost* https://www.nngroup.com/articles/interaction-cost-definition/ | 2026-10-15，**旧索引记录已读正文** | 成本不只是鼠标点击，还包括阅读、等待、记忆与切换注意力 | 把“一屏少跳转、信息就地”作为任务绩效，不追求机械的最少页面数 |
| V02 NN/g *Visual Hierarchy in UX: Definition* https://www.nngroup.com/articles/visual-hierarchy-ux-definition/ | 2026-10-15，**旧索引记录已读正文** | 对比、尺度、分组引导信息扫描 | “标题→文件→异常→详细来源→唯一 CTA”的阅读路径 |
| V03 NN/g *Proximity Principle in Visual Design* https://www.nngroup.com/articles/gestalt-proximity/ | 2026-10-15，**旧索引记录已读正文** | 近邻关系形成视觉分组；设备转换可能破坏关系 | 选择字段时当场显示用途和受影响数据；手机保持近邻语义 |
| V08 NN/g *The Aesthetic-Usability Effect* https://www.nngroup.com/articles/aesthetic-usability-effect/ | 2026-10-15，**旧索引记录已读正文** | 好看的产品可能掩盖轻微易用性问题 | 用户认可“赏心悦目”是设计方向证据，不是授权/导入业务结果签收 |
| V11 USWDS《Table》 https://designsystem.digital.gov/components/table/ | 2026-10-15，**旧索引记录已读官方正文** | 桌面表格便于行列对齐，窄屏有堆叠等模式 | 22 列要完整保留；电脑表格，手机逐项卡片以保证操作按钮可见 |
| V13/V14/V15 W3C WAI WCAG 解释文档 https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum 、https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast 、https://www.w3.org/WAI/WCAG22/Understanding/use-of-color | 2026-10-15，**旧索引记录已读官方解释** | 正文对比度、可感知控件边界、不能只用红绿表达问题 | 文本/焦点/输入框/状态按 Eidos 既有无障碍要求验收；**Chromium 自动 PASS 不等于已测完 WCAG** |
| EX01/EX02 勤哲《定义数据项》《模板的概念》 https://www.qinzhe.com/cn/tutorial-2015/t-05-03.html 、https://www8.qinzhe.com/cn/tutorial-2015/t-03-02.html | 2026-10-14–15，**旧原流程索引记录打开/复核原文** | 数据项标题/类型/必填可集中配置；区分模板设计者与业务填写者 | 对多个未知扩展字段集中审核、一次确认，而不是逐列新建；与 EVO Schema Owner 权限分开 |
| EX03/EX05 Microsoft Lists Excel 导入、Airtable CSV Import https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet 、https://support.airtable.com/articles/3067164948-csv-import-extension | 2026-10-15，**旧索引记录已读相关官方正文** | 来源表头/目标字段可预览、按名称复用、用户可修订；需防止忽略/覆盖源值 | 提供可撤销映射建议与来源值保留；**新建 List 并不等于导入现有往来对象** |

**阅读级别冲突处理：**旧文档的 V/M/EX 是早先窗口阅读的**继承性声明**；本次交接只重新核对了该 GitHub 记录，没有重开每条外网 URL。CN03–07 的“搜索提取了原文段落”不可写成“完整读过原文”，CN08–09 更不能由搜索摘要推断任何真实接口/权限细节。

## 4. 经过比较的方案：来源事实与 EVO 决定逐项分开

| 方案/争议 | 曾比较或排除的方案 | EVO 已采取或确认的方案 + 理由 | 适用条件 / 尚存限制 |
|---|---|---|---|
| 高保真到底展示什么 | **排除**：在产品界面四处写“模拟问题行”“DEMO-A”“非 Host”“Schema”；7 条随意行要用户脑补真实 22 列 | **采用**：可信中文业务用语、22 列一致的**合成**字段/样本、正常错误与操作；**合成来源在 PR 明确披露** | 设计评审可用；不得说数据是客户真实 Excel、不得说真实写入成功 |
| 学习飞书还是简道云 | **排除**：单纯复制飞书品牌蓝、圆角、截图；仅研究海外组件库而忽略中国软件 | **采用**：飞书智能匹配/上下文、简道云预览→字段配置→结果、伙伴云来源可见等的任务逻辑，再映射到 Eidos 规范 | CN08/09 为摘要证据，继续深读须保留 A/B/C 等级 |
| 简单是否等于隐藏功能 | **排除**：把 22 列全部丢弃、只保留 3 个摘要；或一次性展开 22 个大表单 | **采用**：异常优先 + 全部来源随时能看 + 本列就地修正 + 可撤销 | 已知歧义不能被机器静默忽略，使用者仍需真实决定 |
| 步骤少 vs 安全 | **排除**：上传后静默建字段/提交数据；只为了“2 步”把 Owner 审批压没 | **采用**：对人可见“上传→核对并导入”两阶段；内部创建扩展字段、dry-run、commit 有各自权限/确认门槛 | 真实 Host/审计/幂等必须独立证明 |
| Agent 是否代替控件 | **排除**：所有常规映射必须先打开 Agent 聊天；Agent 自己猜缺少的主体类型 | **采用**：已确认 Recipe → 规则/AI 建议 → 人工解决不确定项；Agent 作为辅助，不是低歧义按钮的替代 | 仍须真实权限、调用上下文和 Human 优先级；不能破坏 PA 并行工作 |
| 同名银行及缺失身份 | **排除**：两个“开户银行”按标签自动合并、删掉一个；以 SUPPLIER 关系推断 `subjectType` | **采用**：按 field ID 和业务用途核对；3 行缺失主体身份由人逐行补充；不能无证据补写 | 真实 Excel/Job 没拿到，尚未完成真实行级验证 |
| 保存草稿/继续导入 | **排除**：把 HTML `localStorage` 当正式多用户持久化；最近 20 个成功任务冲掉失败任务 | **采用**：真实 Host 企业内持久 Job/Recipe；#921 合并了目录未完成任务优先与继续入口 | #921 仅恢复到既有核对/预检查页面，**尚非 V3 完整“异常就地纠正”** |
| 移动端体验 | **排除**：桌面表格仅水平缩小、整页不溢出就算通过 | **采用**：移动时“来源列/样本/目标选择/状态”逐张卡片；实际 Chromium 截图与控件可见范围验证 | 真机、中文 400% 放大与屏幕阅读器仍未全面 Human 验收 |
| 跨业务美学统一 | **排除**：在 Platform 内另建 BEX-only 的“飞书皮肤”或复制所有页面成四张指标卡 | **采用**：统一 Eidos Productive + Business Office 的语义、视觉节奏、直接操作；每个业务保有自己的骨架 | Eidos PR #186 已确立原则；全平台具体落地还需各 owner 后续实施 |

**关键取舍的原始依据**：国内产品事实在 §2，NN/g/W3C/USWDS 条件与限制在 §3，Business Office 实例分析在 [品质范例](BEX-01-BUSINESS-OFFICE-HIGH-FIDELITY-QUALITY-REFERENCE-20261015.md) §2–§6。**右侧所有 EVO“采用”均为用户确认和项目判断，不应伪装成外部产品官方承诺。**

## 5. 冲突、难以重新访问的材料与继续检索方向

### 5.1 已记录冲突 / 正确解释

1. **Cowan 四组块 vs 22 列业务数据**：短期记忆实验条件有限；不等于 UI 只能显示四项。通过并排来源样本、系统保存与全列按需审查解决认知负担。
2. **渐进披露 vs 可发现性**：隐藏高频动作会违背“不必到处找”。真实关键操作必须显眼；低频/技术选项才通过稳定入口展开。
3. **审美完成 vs 行为完成**：旧 Chromium 14/14 PASS 曾在截图里产生中文方框、手机横向隐藏下拉；从真实截图发现后才修复。**任何自动测试结果都不自动代表可用视觉**。
4. **合成场景好看 vs 业务真实**：V3 页可模拟“172 条、22 列、三个问题”，但原 Job 未读；严禁将合成字段与真实字段 ID 对号入座。
5. **一屏任务 vs 权限/审批**：可减少页面切换，**不能省略 Schema Owner、人类确认、权限和幂等校验**。
6. **两个银行同名 vs 自动匹配**：标签相同并不代表语义相同；必须真实 field ID/用途和来源上下文核查。
7. **用户喜欢 V2/V3 的整体感觉 vs 正式产品完整验收**：用户称“赏心悦目”明确证明视觉方向认可，但**未表示授权生产部署或签收真实导入操作**。
8. **并行 PR 与当前 main**：#860 在 `apps/data-import/page.ts` 字段部分有修改；#878 对 Host/字段审核有修改；#921 只修改目录安全恢复。不能因看到 #921 merged 就称 #860/#878 或完整 V3 已完成。

### 5.2 易变来源的章节位置和可保全摘要

- **飞书设计规范（CN03–CN07）**：开放平台页面直接 HTML 可能零行，文档首页可能需要 JS。**原始链接 + 主题 + 检索可见段落的精简发现已经写入 §2，并在品质范例 §3 逐项记录“正文提取 vs 零行”**。若将来需要逐字规范，下一窗口必须重新打开/另寻官方可访问版本，别凭索引扩展未看到的内容。
- **飞书 Aily/多维表格（CN01/CN02）**：本轮已存产品行为层摘要（智能匹配、业务 UI 与底层数据表分层），但没有取得官方可长期保存的整页离线 HTML；仅保留来源 URL + 研究摘录，不再造未获取的截图。
- **简道云（CN08/CN09）**：最值得继续核对完整官方帮助页或实际操作视频/录屏：导入预览页、错误行就地修复、冲突字段和审批。旧证据只有摘要，不能拿它证明已能在某产品完成未实测的行为。
- **WPS/畅捷通（CN11/CN12）**：只有截图搜索呈现/官网摘要。再研究时优先找对应官方导入帮助和当前版本界面；现阶段不能当成技术方案约束。

### 5.3 截图/附件/CI 长期位置（与原始用户数据区别）

| 资料 | GitHub / 附件位置 | 精确证据与保留限制 |
|---|---|---|
| V2 最终中文桌面+手机+操作步骤截图/JSON | [run #38682435919](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38682435919) / [artifact #11948338743](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38682435919/artifacts/11948338743) | V2 **14/14 PASS**；测试曾发现中文字体缺失和窄屏下拉问题并修复。Actions artifact 非永久仓库文件，有保留期 |
| V3 离线可操作 HTML、桌面/手机截图、JSON | [run #38684546184](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184) / [artifact #11948839518](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184/artifacts/11948839518) | V3 **15/15 PASS**、V2 **14/14 PASS**；V3 HTML **源码已在 PR #909 分支永久作为 git 文本保留**；打包下载/Actions 截图另有保留期限 |
| V3 可直接在仓库查看的代码 | [V3 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | 可通过 GitHub Raw 保存，打开 Chrome/Edge；使用合成数据、浏览器端状态，无真实写入 |
| V3 专项浏览器脚本/工作流 | `tests/bex01/v3-in-context-import-chromium.mjs`、`.github/workflows/bex01-v2-prototype-chromium-review.yml`（PR #909） | 浏览器路径有 15 个独立场景；有可复核的 GitHub 精确提交与运行日志 |
| 真实 Host 导入恢复协议/浏览器回归 | [PR #921](https://github.com/jiangxng/EVO-App-Platform/pull/921)，[专项 run #38702419912](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38702419912)，[Host run #38702419909](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38702419909) | **19 个定向协议/历史回归测试通过**；其它 Platform/Architecture/Continuity/Human UI CI 同次通过；已合入 main |
| 用户最初问题现场截图 | 原 2026-10-15 BEX 现场聊天附件；原交接曾引用临时路径 `/mnt/data/image(20261015-015021).png` 与 `/mnt/data/image(20261015-023214).png` | **未确认截图二进制已永久上传 GitHub**；路径为临时容器，下一聊天可能不可达，依赖原对话或重新取得 |
| 本轮浏览器独立 ZIP/HTML 下载附件 | 同一聊天附有 `EVO-供应商导入-V3-体验包.zip` 与独立 HTML、桌面截图 | **可在原聊天中下载**；不能将旧 `sandbox:/mnt/data/` 临时链接假冒 GitHub 稳定附件。GitHub 永久可找的是原型源码与 PR |
| 真实原 Excel 与 Import Job JSON | `往来账户2026_10_08_10_15_23.xlsx`、`import-33ff3446-80c5-4992-b5c6-710f415535b3` | **未取得原文件和授权作业详情，未存 GitHub**。没有真实 22 列 field ID/原始值、不能声称导入验证 |

### 5.4 下一窗口最值得继续研究的方向（条件触发，不重做资料采集）

1. **先查已有 PR 实现，而非重新搜索飞书 UI**：#860 的 Excel 自动匹配/同名/自动复用、#878 的一屏批量扩展字段审核到底实装了什么，哪些已为 Host CI 证明，哪些还没有。
2. **原 Excel / Import Job 真实证据**：一旦获得用户授权的数据，先核真实列名、重复“开户银行”对应 field ID、三条类型缺失以及数据体来源，不凭示例数据编造正式映射。
3. **简道云 CN08/CN09 原始页面**：只有当真实 V3 导入异常处理模型还有冲突/信息架构空缺时，针对数据预览、错误反馈、关联记录歧义开展定向官方原文验证。
4. **Eidos 实现语义**：正式 Host 的 catalog-browser 能否承载“异常卡片 + 逐条来源修正 + 可恢复草稿 + 手机操作可达”，以及哪些需要提升为 Eidos reusable experience，而非在 BEX 业务内复制静态 CSS。
5. **风险高的 Host 写入**：创建 Schema 与提交 Import 是否跨 Owner/权限、如何避免二次创建、变更后的 dry-run 失效、失败重试、跨企业隔离，这些靠真实受权契约/测试，而不是视觉截图。

## 6. 精确代码、文档、PR、实施对照

| 决定/能力 | Owner 与文件/PR | 已证实状态 | 下一步 |
|---|---|---|---|
| EVO 核心五条交互原则正式化 | Eidos `docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`、`EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md`、`EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md`、`EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`；[Eidos PR #186](https://github.com/jiangxng/eidos/pull/186) | **MERGED `4c2f36040bdca102b67ba65acb7b35998261ab7d`**；本窗口核查 eidos main 就是此 SHA | 后续所有 Human UI 分支按正式权威执行，不再单独发新主题 |
| BEX 交互高保真样例 | EVO Draft [PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909)；两份 HTML、独立测试与 Business Office 品质范例 | V2 14/14、V3 15/15 真实 Chromium PASS，合成数据；未成为正式 Host UI | 用 V3 行为与视觉标准对照实际 Host 组件，不把静态源码直接并入运行 |
| 真实未完成任务恢复 | EVO `apps/data-import/page.ts`、`tests/protocol/bex01-in-context-resume.test.mjs`，审查 `docs/ui-design-reviews/bex01-in-context-resume-20261015.md`，合并 [PR #921](https://github.com/jiangxng/EVO-App-Platform/pull/921) | **MERGED `1695d4ab31985ba88f723d5dc4954dacc1677317`**；真实目录入口，Host 现有 Job/Recipe 恢复，未执行写入 | 上线与真实工作场景验收仍独立；不要重复造 Job 数据模型 |
| BEX Excel 导入/扩展字段代码线 | [PR #860](https://github.com/jiangxng/EVO-App-Platform/pull/860) | **OPEN**；其修改含 `apps/data-import/page.ts` 映射部分、`apps/object-extension/`、`manager/server.ts` | 避免同文件互相覆盖，审核其映射契约与高保真 V3 差异 |
| BEX 批量字段设计/Host 线 | [PR #878](https://github.com/jiangxng/EVO-App-Platform/pull/878) | **OPEN**；含批量审核研究与 `manager/server.ts` 等 | 对比本次“完整来源列 + 一次确认”；按 owner 集成顺序收敛 |
| 历史扩展字段 handoff | [PR #846](https://github.com/jiangxng/EVO-App-Platform/pull/846) Draft | **OPEN**，旧 CP-03 字段证据 | 不重写/强合并遗留资料，先看是否仍独有有效内容 |
| 原始真实业务数据 | 授权 Import Job 与原 Excel，企业 Owner / Data Import Service | **仍未验收** | 正式 Host + 授权企业文件 + 身份/字段 ID/来源保留 + 幂等恢复 |
| 生产发布 | Railway 部署窗口 owner | **本窗口未部署** | 开发 CI PASS ≠ DEV 业务验收 ≠ 生产发布 |

## 7. 未保存到 GitHub 或尚未取得的内容（明确列出）

1. **用户原始 Excel 二进制与认证 Job JSON：未取得、未存 GitHub**。这是当前最大真实业务核验阻断，不应自行从合成 HTML 推断。
2. **用户最初两张现场问题截图的永久 GitHub 附件：未确认保存**；仅存在旧聊天附件/旧临时容器路径。重要描述与文件名已在本索引 §5.3 保全，若需像素级比较须取得原件。
3. **外站飞书/简道云/伙伴云等网页全文或授权镜像：未存仓库**，仅保存 URL、已经阅读的范围、可靠摘要与明确的等级。避免无权限复制整站版权材料。
4. **GitHub Actions 生成的 PNG 和浏览器 report.json 二进制：保存在相应 Actions artifacts（有保留期），未声明永久 git 追踪**；V3 HTML **已在 git 中**，可重跑专项 workflow 生成新截图。
5. **用户聊天中提供的 ZIP、HTML、PNG 体验附件：没有另外上传到 GitHub Releases**；其功能源码已入 #909，附件是否可继续下载以原聊天为准。
6. **正式 V3 Eidos/Host 异常就地修复 UI、真实建扩展字段后批次写入：尚未完成，所以没有“已完成”的 GitHub 交付物**。#921 只完成了最小安全恢复入口。

> **整理提交自身仅动 PR #909 研究分支的 docs 文件**；不修改并行源码、不覆盖 Eidos 已合并规范、不改 main/生产、不补造 source URL 或新阅读声明。提交后以 GitHub 原分支 HEAD 和 PR 最新状态作为准确接续 SHA。
