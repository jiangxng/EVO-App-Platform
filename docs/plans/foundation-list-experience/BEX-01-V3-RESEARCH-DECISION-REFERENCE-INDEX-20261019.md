# BEX-01 / V3｜本窗口研究资料与决策详细参考索引（2026-10-19）

> **搭配简短入口：** [2026-10-19 窗口接续入口](BEX-01-V3-WINDOW-HANDOFF-ENTRY-20261019.md)。这是本窗口的**增量索引**，不重写 2026-10-15 的逐条来源记录，不替代真实客户视觉签收。项目：`jiangxng/EVO-App-Platform`；此记录核对时间 2026-10-19，初始基线 `main@42ce894b4129089cbd8a270bd3473f0c93b7657b`；并行主线随时可能继续前进。
>
> **证据强度：** **R**＝本窗口/本次交接确实取回阅读的 GitHub 原文、代码、PR/CI/源 HTML；**A（历史）**＝2026-10-15 GitHub 索引记载阅读外部正文，但本次**没有重新打开该外站全文**；**B（历史）**＝仅搜索工具提取可见原文段落/章节，不能说完整阅读全文；**C（历史）**＝搜索摘要、图片预览或论文题录；**D**＝未获得、待验证。**R 的 PR/CI/源码 ≠ 当前登录用户视觉/业务数据通过**。所有外站资料原始网址和 2026-10-15 的阅读等级均继承已保存索引，严禁将 A/B/C 宣称为 2026-10-19 的外站重新查阅。

## 1. 资料遗产：应按怎样的顺序读

1. **真正的 V3 交互源**：[原始 V3 HTML（#909 Draft 分支）](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)。本窗口已读取源码：`#review`、`#tableFilter`、`#mappingRows`、`.actionbar`、`#saveStatus`，对应从“上传”到“核对并导入”的主路径。源为前端合成原型，不代表真实 Host。
2. **完整旧 V3 研究**：[旧 V3 简短交接](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-HANDOFF-20261015.md)与[旧 V3 详细参考索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)，特别是详细索引 §2 CN01–CN12、§3 M/V/EX、§4 方案比较、§5 冲突与截图保全、§6 实施、§7 未保存。
3. **稳定 main 的基础研究**：[视觉/认知/UI 来源 V01–V16、M01–M08、F01–F07](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)；[流程与导入 EX01–EX10](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)；[2026-10-16 E4 恢复核对](BEX-01-E4-V3-RECOVERY-AND-EVIDENCE-20261016.md)。
4. **已实施代码的升级证据**：[E4-01 截图对照](BEX-01-E4-01-V3-TO-REAL-MAP-EVIDENCE-20261016.md)、[E4-02 部署及滚动证据](BEX-01-E4-02-ONLINE-VERIFICATION-20261016.md)、[真实四列集中审核 #984](https://github.com/jiangxng/EVO-App-Platform/pull/984)、[常量 #991](https://github.com/jiangxng/EVO-App-Platform/pull/991)、[当前草稿 #999](https://github.com/jiangxng/EVO-App-Platform/pull/999)。以上不能用原型的“15/15 PASS”替代真实业务签收。

## 2. 本窗口实际核验的 GitHub 网络资料（R 类）

| ID／标题／原始网址 | 本次阅读日期和状态 | 主题与已核证的来源事实 | 在 EVO 的用途／证据限制 |
| --- | --- | --- | --- |
| R01 [V3 可交互 HTML，#909 原型](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | 10-16 阅读源、10-19 再取回，**R：源 HTML** | `#review` 四类汇总、`#tableFilter` 默认“需要关注”、`#mappingRows` 四列“Excel列名/示例值/对应系统字段/状态”、`.actionbar` 保存和下一步；上传→核对两阶段。| **最高设计参照**，但原型数据、浏览器局部状态和最终 Host 行为必须分开；原型源仍在开放 Draft #909 分支，不能误称已合并。|
| R02 [旧 V3 研究参考索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md) | 10-19 **R：GitHub 原文，非外站原文** | §2 CN01–CN12、§3 国际认知、§4 方案取舍、§5 冲突与持久截图位置、§6 代码、§7 丢失材料。| 继承过去的实际查阅等级，避免重做研究、伪造外站阅读史。|
| R03 [2026-10-15 UI 原始研究索引](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md) | 10-19 **R：仓库研究原文** | §3 V01–V16 视觉、§4 M01–M08 记忆与跨年龄、§6 采用/排除、§7 来源矛盾；含原始 URL。| Eidos 视觉层级与交互语义来源；旧“已读”是历史声明。|
| R04 [原业务/流程 EX01–EX10 参考索引](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md) | 10-19 **R：仓库原文** | §2 勤哲、Microsoft、Airtable、NN/g；§3 Reddit 社区证据；§5 现场；§6 方案比较。| 区分官方文档、社区体验、旧方案，不用社区观点代替需求验收。|
| R05 [Eidos Human Experience Design Authority](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md)、[Business Office Visual](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md) | 10-19 **R：GitHub 权威的既有索引再次核对**；本次未逐条重读完整设计规范 | “让复杂留在系统内部，让简单发生在用户面前；功能就近、信息就地、系统记忆、异常驱动、操作连续”为既定 Eidos 方向。| Eidos 负责通用 reviewTable、响应式和行为；Platform 负责导入业务上下文、字段语义/Host 命令。|
| R06 [Platform #984：实际集中审核四列](https://github.com/jiangxng/EVO-App-Platform/pull/984) | 10-16～10-19 **R：PR、`apps/object-extension/batch-page.ts` 原文** | 合并 `1f5ec1a9171391847bf4e9794e0e10964b53d08c`；复用 Eidos 表格，来源证据、目标选择、状态、筛选、四统计和问题定位真实接入。 | 避免回到纵向大表单；不是“把独立原型美化”或客户现场验收。|
| R07 [Platform #989：选择改变即时状态](https://github.com/jiangxng/EVO-App-Platform/pull/989) | 10-19 **R：已合并 PR 原文** | 合并 `b110b7ce69cbf6e80fdda75efeaa5df24285d8c0`；Eidos #195 通用状态联动；行选择→状态/过滤/汇总立即变化，尚未批准前只属客户端反馈。 | 继续测试筛选不丢选择、未保存状态与已持久状态区分；**不等于草稿已经保存**。|
| R08 [Platform #991：主体类型批次固定值](https://github.com/jiangxng/EVO-App-Platform/pull/991) | 10-16 编写/10-19 查合并，**R：源码、PR** | 合并 `38643c92160a79e2ae3220a0d036326eae1d9f6f`；可选择“未设置/ORGANIZATION/PERSON”，持久 `mapping.transform.CONSTANT`，已映射来源列则禁止全批覆盖。| 批次级 Human 决策独立于行级缺失纠错；不能以 SUPPLIER 推断所有对象为 ORGANIZATION。|
| R09 [Platform #993：真实隔离 Host 常量旅程](https://github.com/jiangxng/EVO-App-Platform/pull/993) | 10-19 **R：PR 已合并及测试描述** | 合并 `6f99bf9049b498f23e38766b149f408e5ee025f1`；无主体类型来源列的 synthetic Job，真实 UI 选择/Host 保存/重新进入桌面及 390px 回显。| 自动化安全回归，**不代表客户真实 Excel 或登录 Railway 操作**。|
| R10 [Platform #996：受控字段方案预览](https://github.com/jiangxng/EVO-App-Platform/pull/996) | 10-19 **R：PR 原文与合并记录** | 合并 `6327199c580c8ca5e5ba1434d01aedf2bc16daf6`；Eidos #197 通用只读方案，在实际批次审核表格下展示各列创建/复用/忽略/未决和字段标签类型；预览不会自行写 Schema。| 同屏审核的“证据→建议→人类决定→受控批准”闭环支撑；真实执行仍走 Owner/Host 确认。|
| R11 [Platform #999：Owner 范围草稿保存与恢复](https://github.com/jiangxng/EVO-App-Platform/pull/999) | **10-19 R：开放 PR 描述**，不是已合并验证 | 计划在真实 Job 的企业资源中保存按操作者隔离的未批准草稿；Eidos #199 通用多提交，独立“保存草稿”与“确认字段创建”。查阅时 PR **OPEN**，`head@78aa43d666c24df848bf1b1fe795c381a9c389ef`。| 下一窗口须先查最新 SHA/CI/审查，不得重做并行 #999；不提前宣称草稿已上线。|
| R12 [Platform #973](https://github.com/jiangxng/EVO-App-Platform/pull/973)、[#978](https://github.com/jiangxng/EVO-App-Platform/pull/978)、[#981](https://github.com/jiangxng/EVO-App-Platform/pull/981) | 10-16 本窗口执行/10-19 核 PR，**R** | 真实 `/map` 的短样本、文件名、技术 ID 去冗；滚动证据全覆盖；手机 Eidos #193/#194 改动测出 9139→7621px（合成 22 列，-16.61%）。| 后续不要再重复优化已通过场景；真实样本/用户使用感受不以像素数代替。|
| R13 [#987：本窗口重叠 PR 已关闭](https://github.com/jiangxng/EVO-App-Platform/pull/987)、[#998：合并分支安全清理](https://github.com/jiangxng/EVO-App-Platform/pull/998) | 10-19 **R：PR 状态** | #987 **CLOSED / 未合并**，被同范围已合并 #984 取代；#998 **MERGED**，以已合并/HEAD 校验安全清理。| 不能在接续窗口复活 #987 或误删 #999、#909、#878、#846。|
| R14 [实际代码：批次页](https://github.com/jiangxng/EVO-App-Platform/blob/main/apps/object-extension/batch-page.ts)、[批次命令](https://github.com/jiangxng/EVO-App-Platform/blob/main/apps/object-extension/batch-action.ts)、[导入复核动作](https://github.com/jiangxng/EVO-App-Platform/blob/main/apps/data-import/actions.ts)、[当前 /map](https://github.com/jiangxng/EVO-App-Platform/blob/main/apps/data-import/page.ts) | 10-16/10-19 **R：源代码相关段落** | 原 `choice_N/label_N/type_N/sample_N`、字段排他/确认、`CONSTANT`、源数据与 dry-run 的分离。| 在实际 owner 模块实现而非在 Eidos 写 supplier/银行专有逻辑；所有真实写入需 Host 权限与提交边界。|

## 3. 外部网页：仅继承 2026-10-15 已保存的阅读记录（**本交接没有重新查阅外站**）

下列“发现”是**旧 GitHub 文档已保存的摘要/章节**，不是 2026-10-19 新取得的原文，也不是本项目自动化验收；精细章节与阅读层级请回看上述 R02/R03/R04。

| ID／资料标题和原始网址 | 历史查阅日期／精确等级 | 主题与旧记录中的关键发现 | 对 EVO 的实际用途／限制 |
| --- | --- | --- | --- |
| CN01 [飞书智能伙伴 Aily：数据表](https://www.feishu.cn/content/vl1lf3v5) | 10-15 **A（历史）：已读相关原文** | Excel 列匹配建议、人工修正、错误反馈。 | 机器建议、人审歧义；不等于复用 Aily 算法。 |
| CN02 [飞书多维表格应用模式](https://www.feishu.cn/content/article/7578812241772924111) | 10-15 **A（历史）：相关正文** | 数据表基础与业务角色使用界面区分。 | 用工作台表达任务，Host 保持 Schema 与权限。 |
| CN03 [飞书开放平台响应式设计指南](https://open.feishu.cn/document/design-specification/responsive-design/responsive-design-guidelines?lang=zh-CN) | 10-15 **B（历史）：仅章节/段落提取，直开零行** | 不同设备布局/安全边距/组件转换。 | Eidos 桌面表→手机卡片；不把飞书断点复制为 EVO 硬标准。 |
| CN04 [Lark Visual specifications](https://open.larksuite.com/document/tools-and-resources/design-specification/gadget-design-specification/visual-specifications/style) | 10-15 **B（历史）：提取段落** | 中性色及功能色的职责区分。 | 状态与视觉层级克制；不复制品牌色。 |
| CN05 [飞书应用引擎常见页面设计原则](https://ae.feishu.cn/hc/zh-CN/articles/768591170201) | 10-15 **B（历史）：检索可见段落** | 先定布局骨架，再放元素。 | 先任务摘要/问题/行动，再考虑细节。 |
| CN06 [Lark Message card design specifications](https://open.feishu.cn/document/ukTMukTMukTM/ugDOwYjL4gDM24CO4AjN) | 10-15 **B（历史）：正文提取** | 主次分明、模块和状态组织。 | 借用近场建议与状态，不把消息卡当作导入工作台。 |
| CN07 [飞书抽屉组件](https://open.feishu.cn/document/design-specification/component----feedback/drawer) | 10-15 **B（历史）：检索正文/直开零行** | 辅助信息可以在主任务附近展开。 | 候选字段用途、来源证据就地核对；不要求必须使用抽屉。 |
| CN08 [简道云 CRM 关键字段导入](https://hc.jiandaoyun.com/solution/13147) | 10-15 **C（历史）：仅搜索摘要** | 摘要提及来源预览、映射、结果。 | 中文业务链路参考；**未通读，不能断言全部实际产品行为**。 |
| CN09 [简道云导入关联数据](https://hc.jiandaoyun.com/doc/18609) | 10-15 **C（历史）：仅搜索摘要** | 多重/缺失匹配需业务处理的线索。 | 同名银行遇歧义需 Human；关联数据问题不等同于字段 ID。 |
| CN10 [伙伴云导入 Excel 数据](https://hc.huoban.com/tables/8a9a/974b) | 10-15 **A（历史）：已读网页相关内容** | 表头、样本、关联选择同屏。 | 证据靠近决定；不宣称测试了其最新 UI。 |
| CN11 [畅捷通字段匹配旧参考图](https://service.static.chanjet.com/kj_java/20230505/2f079522361a4f18912a4519d691216b3.2-7.png) | 10-15 **C（历史）：仅图片搜索结果** | 中文来源字段、已/未匹配形式。 | 静态中文用语和状态参考；上下文/功能待验证。 |
| CN12 [WPS 金山文档](https://docs.wps.cn/welcome) | 10-15 **C（历史）：仅官网摘要** | 熟悉的办公平台词汇。 | **未证实**任何具体 Excel 映射或 AI 算法。 |
| M01 [NN/g Recognition Rather Than Recall](https://www.nngroup.com/articles/recognition-and-recall/) | 10-15 **A（历史）：正文** | 已呈现的选择比用户从记忆重新构造更易使用。 | 保留前次 Job 映射、样本、候选用途。 |
| M02 [Cowan: The magical number 4 in short-term memory](https://pubmed.ncbi.nlm.nih.gov/11515286/) | 10-15 **C（历史）：仅论文题录/摘要** | 短期记忆组块量的研究线索。 | 减少跨 22 列记忆；**不得推断界面最多四个按钮**。 |
| M03 [W3C COGA Making Content Usable](https://www.w3.org/TR/coga-usable/) | 10-15 **A（历史）：§4.5、§4.6.2、§4.6.3、§4.7.5** | 进度/解释、减少重复、纠错路径。 | Host 草稿恢复、上下文连续；COGA Note 不是新增 WCAG 强制合规。 |
| M04 [NN/g Designing for Long Waits and Interruptions](https://www.nngroup.com/articles/designing-for-waits-and-interruptions/) | 10-15 **A（历史）：相关正文** | 中断后要有任务状态和继续位置。 | 未完成 Job 优先，草稿持久化需要真实 Host。 |
| M05 [NN/g Usability for Older Adults](https://www.nngroup.com/articles/usability-for-senior-citizens/) | 10-15 **A（历史）：相关正文** | 复杂术语、小控件、认知负担的可用性风险。 | 自然中文、移动端 44px 可操作，不因年龄默认隐藏功能。 |
| M06 [NN/g Interaction Cost](https://www.nngroup.com/articles/interaction-cost-definition/) | 10-15 **A（历史）：正文** | 点击外还有阅读、切换、记忆成本。 | 少跳页、证据就在当前行，但不能取消必需的 Owner 审批。 |
| V02 [NN/g Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) | 10-15 **A（历史）：正文** | 视觉层级引导扫描。 | 标题→批次→问题→字段行→操作；不等于任意缩小字号。 |
| V03 [NN/g Proximity Principle](https://www.nngroup.com/articles/gestalt-proximity/) | 10-15 **A（历史）：正文** | 相关信息距离影响归组理解。 | 来源值、候选用途、状态与字段选择相邻。 |
| V08 [NN/g Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) | 10-15 **A（历史）：正文** | 美观可能提高主观易用评价，但不解决所有操作问题。 | 用户认可 V3 视觉方向≠实际功能已签收。 |
| V11 [USWDS Table](https://designsystem.digital.gov/components/table/) | 10-15 **A（历史）：官方正文** | 表格用于列间对照，窄屏需适配。 | Desktop 四列、Mobile Eidos 卡片，不裁剪必要来源字段。 |
| V13–15 [W3C WCAG 文本对比](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)、[非文本对比](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)、[不只靠颜色](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color) | 10-15 **A（历史）：解释章节** | 文字、边框、状态均应可感知且不靠颜色独占信息。 | Eidos 语义状态和可读控件回归；Chromium PASS 不等于 WCAG 全覆盖。 |
| EX01–02 [勤哲定义数据项](https://www.qinzhe.com/cn/tutorial-2015/t-05-03.html)、[模板概念](https://www8.qinzhe.com/cn/tutorial-2015/t-03-02.html) | 10-14–15 **A（历史）：两篇相关正文复核** | 字段名称、类型、必填可集中配置。 | 多个扩展字段集中建议和审核；不可自动升格为 EVO Schema。 |
| EX03 / EX05 [Microsoft Lists 基于 Excel 创建列表](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet)、[Airtable CSV import](https://support.airtable.com/articles/3067164948-csv-import-extension) | 10-15 **A（历史）：相关官方正文** | 列/数据预览与目标对应可编辑。 | AI/规则推荐后人工确认，保留原始值；与 EVO 现有对象导入语义不同。 |

**尚未查阅的新资料：** 没有。若出现确实影响设计的新问题，再定向打开 CN08/09 真实官方全文、飞书 JS 页面可阅读官方版本；不要凭链接当作已读。

## 4. 用户四张对照截图：保存判断逻辑与**未入仓二进制**的准确位置

本窗口用户于 2026-10-16 上传以下 4 张图片；**此交接保存文字观察和原聊天附件标识，不声称 GitHub 已保存原 PNG**。ChatGPT 附件 ID/临时容器路径不是跨窗口永久可下载 URL；如下一窗口需要像素级分析，请回原聊天或要求再次上传原图。照片中没有客户 Excel 的真实文件内容可供验证。

| ID／原聊天上传文件／附件标识 | 关键局部与原始观察 | 实施约束（EVO 设计判断） |
| --- | --- | --- |
| S01 `image(20261016-123851).png` / `file_00000000afec82098eeef212799e6d86` | “字段对应关系”，22 列／显示 7/22／默认需要关注；四列、来源行、样本、目标选择、状态；单条较密、中文业务语义。 | 单纯“字段映射”已有基础，但它只是 V3 的一个局部；不能因为 4 列齐全就说集中审核完成。 |
| S02 `image(20261016-123943).png` / `file_00000000241882098805da9ff5c8056d` | “集中审核 20 个未匹配字段”，批次固定值“主体类型 ORGANIZATION”、20/26；来源证据链接、候选业务用途、拟建企业字段显式集中审批；比 S01 更强调决策层。 | 页面必须体现**批次决策 / 来源证据 / 系统建议 / Human 决定 / 受控字段创建**，不能退化为机械的字段下拉表。示例 ORGANIZATION 仅截图演示，不能自动设为任何供应商 Job 的真值。 |
| S03 `image(20261016-124020).png` / `file_000000006ad482098729c8092c96e76a` | S01 中“对应系统字段／状态”局部：状态“待处理/待新增”、下拉默认建议新建字段。 | 状态是下一步动作语义，不是仅换一个彩色徽标；区分异常、拟建与已处理。 |
| S04 `image(20261016-124036).png` / `file_00000000f4a48230847b7ab6aa7814a9` | S02 中“示例值／对应系统字段／状态”局部；原值旁“查看来源及候选字段用途”、目标新建建议及“为本列创建企业扩展字段”次级入口。 | 证据应可在本行展开；建议≠批准；企业字段永久定义变更和一次性导入映射必须明确区分。 |

用户在此窗口明确纠正：“**这样的细节很重要，要高度还原，不是多一个按钮少一个按钮的事情**”。基于四图与 #909 V3，本窗口形成了可复用的**审核工作台设计逻辑**：异常优先、共性批次上提、证据就地、机器提出建议、人做明确决定、Schema 扩展需 Owner 受控批准、状态引导下一步。

## 5. 方案取舍：严格区分来源事实与 EVO 产品决定

| 决策问题 | 采用方案（**EVO 判断／用户要求**） | 排除方案及理由 | 适用条件／限制 |
| --- | --- | --- | --- |
| 映射表 vs 审核工作台 | 任务概览、当前文件、四列决策、证据展开、人工状态、最终确认共同组成工作台。 | 仅补几个按钮、只缩小下拉和行高；会漏掉审查责任与结果。 | Eidos 宿主 UI 保留，不按独立静态 HTML 复制整套外壳。 |
| 默认看全部 vs 异常优先 | 默认“需要关注”，可随时“全部字段”；筛选只影响可见性。 | 22 项全铺/只看 3 项并隐藏余列：前者认知负担大，后者丢业务上下文。 | 每项原值/目标/已做决策仍在真实 Job 中保存。 |
| 批次固定值 vs 逐行数据 | 只有整批同一合法主体身份且**没有源列映射**时，人工批准 CONSTANT；有来源列则逐行看原值、对缺失做行修正。 | 根据“SUPPLIER”就默认 ORGANIZATION；会覆写或混淆个人身份。 | 已合并 #991、#993 的 synthetic Host 已验证；用户真实 3 行仍未获得。 |
| 证据显示 | 简短样本与状态常显；原始 3 样本/数量/候选用途就地按需展开。 | 一开始大量技术字段 ID、三样本、Schema 文案充满屏幕。 | 重复同名银行必须保留 ID/业务用途，不可因“简洁”删身份信息。 |
| 字段建议与批准 | 推荐复用／拟建／忽略；只读即时方案预览；最终治理创建需明确 Owner/Host 确认。 | 系统自动新建 20 项 Schema、上传后静默导入。 | #984/#996 已合并，审批效果用真实 Host+权限判定。 |
| 立即响应 vs 后端持久 | 下拉改变即更新**未保存**行状态／统计；正式保存使用 Authoritative Job/草稿命令。 | 将客户端实时状态错当已持久化；HTML `localStorage` 不能作企业草稿。 | #989 已合并，#999 当下 OPEN，须核后继续；不能重复实现。 |
| 原型 CSS vs 真实系统框架 | Eidos 负责通用表格、移动卡片、状态/预览和排版；Platform 负责业务数据/语义/导入命令。 | BEX 私有皮肤、复制飞书颜色、把 supplier 业务写进 Eidos。 | 平台与 Eidos 已有多个稳定 PR；对并行 owner 不重复修改。 |
| 少步骤 vs 安全门禁 | 人感知上传→核对导入两阶段；内部必须仍有字段治理、人类审批、预检查和最终提交。 | “两步”就跳过 Owner 权限与 dry-run。 | 必须分层证据签收，CI/部署 ≠ 客户真实数据签收。 |
| 并行 PR 处理 | 比对最新 main、HEAD、冲突文件和 CI；重复 PR 关闭而不抢合并。 | 强行合并 #987 覆盖 #984；直接推 main；清理带独有提交或开放 PR 的分支。 | #987 CLOSED/未合并是主动去重的已验证先例。 |

## 6. 仍在冲突或未解决的证据；值得继续查阅的方向

1. **最重要：代码合并 ≠ V3 人工视觉签收。** 本窗口实际看过隔离 Host 截图/测试，但仍没有来自已登录 Railway 的**真实客户 Job** 全页桌面/390px、长滚动、底部 CTA、行级纠错的用户验收；还没有用户签署“高度还原”的最终确认。建议以 #909 原型和 S01–S04 对照 **逐项判为通过/差异/缺图**，不要只凭测试计数断言完成。
2. **真实 Excel 与 Job 未取得**：历史引用 `往来账户2026_10_08_10_15_23.xlsx`、客户作业如 `import-79ce7d97-bbea-442a-b656-0661273b52f8`；旧窗口还见其他不同 Job ID，**不能凭 ID 猜内容**。两个“开户银行”真实 field ID、三条缺失 `subjectType` 的当前状态、银行语义、客户权限与 Recipe 复用仍需受权核查。
3. **#999 OPEN 的草稿持久化与实时未保存反馈可能冲突**：需严格区分“临时修改/待保存草稿/已批准定义/已提交供应商”；验证 actor 作用域、版本过期、页面切换、重新登录、并发和错误重试，且草稿保存**不得自动**创造企业字段或使有效的 dry-run 失效。只在此真实缺口触发新的 Eidos/Host 工程研究。
4. **静态 V3 vs 运行时 Host**：原型采用浏览器交互/合成 172×22，而实际导入受企业权限、对象字段语义与真实数据限制；可以高度还原阅读路径与人类决策含义，不能复制不安全的默认动作。
5. **来源冲突**：COGA Working Group Note 不是 WCAG 强制合规；Cowan 摘要的 4 组块不是组件数量定律；NN/g 审美效应不意味着好看即正确；飞书/简道云仅部分网页或摘要不可作严格实现细则；同名银行标签不等于同一个 fieldId。
6. **定向补查优先级**：第一优先用户授权真页面/原 Excel（无需泛泛 web 查竞品）；第二优先 #999 的精确实现/CI 和 Eidos #199 多动作契约；仅出现新的证据布局争议时再去查 CN08/CN09 官方全文、飞书响应式官方可读页面，分别注明“已读正文/仅摘要”。不重新做已完成的 10-15 外站广搜。

## 7. 可复核截图/测试/附件的长期位置与限制

| 证据 | 原始链接／稳定仓库位置 | 重要摘要及可访问边界 |
| --- | --- | --- |
| V3 可运行 HTML | [#909 原型 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | 源码在 Git 分支中；`#mappingRows` 与 `#tableFilter` 负责四列和异常聚焦。切勿将 HTML 内 synthetic 数据当客户记录。 |
| V3 独立 Chromium 15/15 | [run 38684546184](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184)、[artifact 11948839518](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184/artifacts/11948839518) | 高保真原型桌面/手机和 JSON；**Actions 附件有保留期**，源 HTML 才是可持久重建的基础。 |
| E3 真实隔离 Host | [run 38842754856](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38842754856)、[artifact 12022135417](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38842754856/artifacts/12022135417) | 初次 22 来源列实测界面；截图可能仅捕获内部滚动容器的一段。 |
| E4 完整滚动证据 | [run 38895420715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715)、[artifact 12044215349](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715/artifacts/12044215349) | 桌面 6 张、手机 16 张连续滚动重叠截图；分别记录内部容器滚动高度 3981/9139px，仅 synthetic。 |
| #981 Eidos 手机密度 | [run 38898532530](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38898532530)、[artifact 12044782204](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38898532530/artifacts/12044782204) | 实测手机缩到 7621px、减少 1518px/16.61%，短中文字段名单行，44px 控件；不代表真机全面通过。 |
| V3 真实集中审核 | [run 38905654416](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38905654416)、[artifact 12047588110](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38905654416/artifacts/12047588110) | #984 真实 Host 四列+问题聚焦截图；非客户文件。 |
| V3 主体常量 Host 旅程 | [#993](https://github.com/jiangxng/EVO-App-Platform/pull/993)，`tests/bex01/v3_batch_constant_host_chromium.py` | 独立合成 Job 验证实际选择→Host 保存→跨设备重新进入回显。 |
| V3 设计审查归档 | `docs/ui-design-reviews/bex01-v3-*.md`、[E4-02](BEX-01-E4-02-ONLINE-VERIFICATION-20261016.md) | 每个工程 PR 有设计门禁记录，但门禁检验文档存在性 ≠ User Human signoff。 |
| 用户 S01–S04 现场对照 | 本聊天 2026-10-16 4 张附图，**见 §4 文件名与附件 ID** | 原 PNG **尚未作为永久 GitHub 二进制入仓**；下一窗口的暂存绝对路径和历史 `sandbox:/` 不保证有效。 |

## 8. 模块/分支/任务映射，以及尚未永久保存的材料

- **Platform 审核页 owner：** `apps/data-import/page.ts`、`apps/object-extension/batch-page.ts`；真实权限及提交 `apps/data-import/actions.ts`、`apps/object-extension/batch-action.ts`、`apps/data-import/service.ts`；协议 `tests/protocol/bex01-batch-extension-import.test.mjs`；实际浏览器 `tests/bex01/live_supplier_chromium.py`、`tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`、`tests/bex01/v3_batch_constant_host_chromium.py`。
- **Eidos：** `jiangxng/eidos` 负责通用 ReviewTable/状态联动/字段方案预览/多 action。相关已合并 #192、#193、#194、#195、#197、#199，Platform 按明确模块选择性同步，不整包覆盖。10-19 核验 Eidos `main@6f51b6ce55798521c0c7be3fc69c2897aafc4297`。
- **GitHub 截至 2026-10-19 本次核验：** Platform `main@42ce894b4129089cbd8a270bd3473f0c93b7657b`；Railway 项目 `EVO Ledger Runtime MVP` 中 Ledger Configurator 服务 production 部署同 SHA 且状态 **SUCCESS**（`main`）；**部署记录 ≠ 已登录/已签收界面**。当前另一窗口 [PR #999](https://github.com/jiangxng/EVO-App-Platform/pull/999) OPEN；原型 [Draft #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) OPEN；历史 [#878](https://github.com/jiangxng/EVO-App-Platform/pull/878)、[#846](https://github.com/jiangxng/EVO-App-Platform/pull/846) OPEN。旧 PR #987 CLOSE 未合并，不得恢复。
- **接续先做**：刷新 main + #999 和 Eidos #199 的精确 HEAD/CI → 不重复本窗口已合并 V3 工程 → 验证草稿保存及恢复/权限/源数据保全 → 取得客户授权页面与真实 workbook 做 E4-03 / E4-04 Human 验收 → 精确差距再 bounded PR。不得动 PA05、治理 PR、`project.status.json`、Railway 分支。
- **未保存到 GitHub 的材料（明确告知，不伪称入仓）：** ① 此聊天四张原始用户对照截图 **PNG 二进制**（§4 有名称、附件 ID、文字观察，但没有 GitHub 永久文件）；② 客户原始 `往来账户2026_10_08_10_15_23.xlsx` 以及授权 Job 内容/账号访问；③ 客户真实两个开户银行 field ID、三条缺失主体类型当前行数据及实际确认记录；④ 登录后 Railway 页面 1280/390px 截图及用户明确签收；⑤ 外网飞书部分 JS 页面完整原文、CN08/09 全文、WPS 映射算法（均无可靠已读记录）；⑥ GitHub Actions artifact 可能到期且不能视为永久二进制归档。**无需为本次“交接文档”改生产或上传敏感业务数据。**

## 9. 2026-10-19 接续增量：多提交动作 CI 失效的真实定位（R，独立测试线）

> 本节是接续窗口读取原交接入口及 §2/§4–§8 后的**新增验证**，不覆盖先前参考遗产或 Human 验收状态。读取等级 R = 本次直接取得 GitHub PR、Actions 原始日志、Railway Connector 部署清单、当前源码，均非用户已登录页面。

- **GitHub 并行状态：** 核验时 Platform main 已推进至 `d60a8d82d3272b904d104405dbbe8df6711f50f3`（PA05 文档交接 #1022），Eidos main `6f51b6ce55798521c0c7be3fc69c2897aafc4297`。#1021 已合并；[#999](https://github.com/jiangxng/EVO-App-Platform/pull/999) 仍为 OPEN / HEAD `78aa43d666c24df848bf1b1fe795c381a9c389ef`。比较 `main...#999` 当时显示 ahead 21 / behind 60；**不是可立即合并状态**。#909 继续 Draft。
- **Railway 状态：** `EVO Ledger Runtime MVP` / production / `Ledger Configurator` 仍跟踪 `jiangxng/EVO-App-Platform` 的 `main`；#1021 交接 SHA `d0f4a1b...` 对应 deployment `37b77350-fdc7-4014-b734-cc4d67cff6d1` 为 SUCCESS；新的 `d60a8d82...` deployment `7daf9739-acd9-4d1b-9e89-92589b9a84fb` 核验时为 BUILDING。**不得将旧 SUCCESS 推断为新版本已部署，也不得凭部署证明登录后 Human UX。**
- **确切 CI 阻塞：** [#999 BEX-01 Real Host Chromium run 38926673240](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38926673240)，job `117059863672` 失败于 `tests/bex01/v3_batch_constant_host_chromium.py:73`，调用 `form.locator('button[type="submit"]').click()`。原始 Actions 日志揭示多提交动作匹配两元素：`data-eidos-action="create-extension-batch"`、`data-eidos-action="save-review-draft"`，Playwright strict mode violation。它是测试定位器与 Eidos #199 多动作契约不兼容的**直接证据**，不能推导草稿 Host 正确、错误或 Human 签收。其余该 SHA 上取得的各工作流显示 success；该浏览器套件明确 failure。
- **采用/排除判断：** 独立测试分支 `test/bex01-v3-explicit-approval-action-20261019` 只让批次主体常量回归**明确选择已存在的受控批准动作** `button[data-eidos-action="create-extension-batch"]` 并断言动作唯一；不采用 `.first()`、取消保存草稿按钮或合并两个 Host 命令，因为它们会掩盖业务分界或把草稿保存误作字段创建。主代码中的该动作标识亦见 `apps/object-extension/batch-page.ts`，PR #999 日志进一步验证两动作渲染。
- **并行边界：** #999 修改 `apps/data-import/{service,types}.ts`、`apps/object-extension/{actions,batch-draft,batch-page,constants}.ts`、`manager/server.ts`、两项其他测试和 7 个 Eidos 桥接文件；本次单独修正的 `tests/bex01/v3_batch_constant_host_chromium.py` **不在 #999 改动文件集**。完成后 #999 Owner 仍需与最新 main 对齐并在本分支测试改动合入后重新跑自己的 exact-HEAD 全量 CI。
- **下一真实验收门禁不变：** 验证草稿 actor scope、失效、重入、权限、并发/重试和提交分离；真实客户 `往来账户2026_10_08_10_15_23.xlsx` 与授权 Job、两个开户银行真实 field ID、三行 `subjectType`，以及 Railway 已登录 1280/390px 长页与用户 Human signoff **仍未取得**。合成数据和本次单项测试修复均不改变这些状态。

## 10. 2026-10-19 接续增量：#999 回归最新 main、草稿权限出口与 CI（R）

> 此段记录本轮**直接读取** GitHub PR/#999 精确分支、主线源码与 GitHub Actions 日志所得的新证据。继承 §3 竞品与认知研究，不将旧外站网页标记为当日重读；V3 人工签收及原 Excel 均仍缺失。

- **主线重对齐（R，GitHub commits）：** [#1023](https://github.com/jiangxng/EVO-App-Platform/pull/1023) 合入后，Platform main 为 `c9e8ea8d725da6003a620e59de153394c0621206`、Railway production 对应 SHA SUCCESS；在原 [#999](https://github.com/jiangxng/EVO-App-Platform/pull/999) 分支上创建双亲合并提交 `141da19ecde9753765b3e919fd2d8f66318fe328`。比较证明 #999 原 18 个文件只有 `apps/object-extension/actions.ts` 与 `manager/server.ts` 在最新主线发生并行改动：仅对两文件人工上下文合并，其余原有草稿文件保留；合并后的 PR 比较结果 `behind_by=0`，`mergeable=true`，未覆写 PA05 / 治理线。
- **实际 TypeScript 阻断与修复（R，Actions 日志）：** 合并 HEAD 的 [Platform CI run 39202533214](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39202533214) 报 `TS2304 Cannot find name 'dataImportRepository'`，原因是并行治理将导入资源改为 lazy `dataImportRuntimeHost.resolve()`，原 #999 草稿保存闭包依旧引用旧仓库变量。已在**同一 #999 分支**改用现有 `runtime.repository.get/save`（提交 `e49de79a5697260319e99126f59e4308db33987d`），无额外常驻模块加载、无切换 Railway 分支。
- **实际权限泄漏发现与修复（R，源码）：** #999 原审核页按 `session.principal.subjectId` 过滤草稿，但通用 `data-import.get` 经 `jobResult(job)` 直接序列化了同一 Job 的所有 `batchReviewDrafts`；`data-import.mapping.inspect` 同样携带完整 Job；若两名拥有企业管理权限的 Human 访问相同导入 Job，会跨操作者获取彼此未批准的字段选择。**采用方案：在通用 Host Action 输出处投影**，只保留当前 `principal.subjectId` 的草稿，不改变内部 Job、原始行、已有映射与 dry-run。覆盖 `get`、`inspectMapping`、预检查/导航返回携带 Job 的动作，提交 `fd883d7613615e667fce0c5d7bebb2322b3fdeb2`；新增 `tests/protocol/bex01-batch-extension-import.test.mjs` 对 `owner`、`other-owner`、无草稿操作者的读和检查做数据隔离回归（提交 `55da7430f69bd0b6899c21e337fa35c6deeaa8e7`）。**来源事实为读到的代码路径；合规性仍需 CI/真实会话实测，不以静态代码充当签收。**
- **方案取舍（产品/安全判断）：** 采用 Host Action 返回投影而非前端隐藏字段，因为仅隐藏 Eidos UI 不能阻止经 `data-import.get` 读取别人的草稿。保持权威 Job 中最多 16 份按人隔离草稿，避免以 localStorage 替代 Host 存储；拒绝把草稿保存解释为已批准 Schema、已运行 dry-run 或已提交供应商数据。
- **未决 / 验收路线：** ① 刷新 #999 最终 HEAD 的 Platform、BEX 真实隔离 Host Chromium、Human UI、轻量宿主和所有被触发的 CI，严格修复失败后再考虑合并；② actor / enterprise 权限、关闭导入、映射变更失效、失效候选、未保存变动、重新登录、失败重试、dry-run 保真与 Schema/Commit 独立边界继续按证据核对；③ 客户原 Excel 两个同名开户银行字段 ID、三条真实主体类型、Recipe 与预检查失效/重新执行、Railway 登录后 1280/390 长页、Human 视觉签收仍属**D 未取得**，不能用此 PR 的模拟测试代替。

## 11. 2026-10-19 接续增量：真实 Host 草稿读取与过期字段的失效安全性（R）

**R：直接取得并比对项目代码（而非竞品检索或模拟网页推测），精确证据为 #999 同分支提交。** 与 §10 的交接研究索引及此前四图产品决策一致。

1. **真实 Host 读 Job 闭环缺口：** 最新 `manager/server.ts` 向对象扩展动作提供异步 `resolveImportJobReader()`，不再提供静态 `getImportJob`；原 #999 `object-extension.batch-review.save-draft` 仍直接读 `input.getImportJob`。按运行时代码对照，这会将真实已存在 Job 误判为不存在。现和已有的 `create-from-import` 命令对齐：先异步解析合法数据导入资源、复核企业 Owner/Admin 权限，再读 Job；加载可能 yield 后重读权威 Job，避免过期快照写入。代码提交 `ceaec04592c1d08da4ebe953a87013dc71a7e446`；协议测试特意改为只提供懒加载 reader 并断言被调用，提交 `c746f5f90918a9b48bffb6289a59011f286495e5`。此发现独立于此前 TypeScript 编译错误修复。
2. **草稿已选字段被删除/撤权后不允许自动改选：** 原 `batch-page.ts` 当已保存选择不在当前 `fieldOptions` 内，静默回退到自动推荐（可能是 `__CREATE__`），但界面仍提示“草稿已恢复”。这违反 Human 明确决定和受控 Schema 变更的边界。采用方案：当草稿原 field ID 不再可选时回到 `__REVIEW__`，纳入“需要校对”的任务/列表、就地展开来源证据，并提示“草稿中 N 列原目标已失效，需重新核对”；禁止靠标签相同或重新推断值自动批准。代码提交 `12da67edb10b209de42dc79eb25082630f13eccc`、对应协议回归 `d8e9e437cd949a17605408a8f51b515a6511b032`。
3. **方案比较与限制：** 优先于自动新建 Schema 的是“已保存意图失效 → 让人重新确认”；优先于缓存整个企业加载系统的是复用现有按需 Host Reader。真实客户的“开户银行”两项字段依然需要通过企业字段 ID 和用途核验，不能从设计原型的 `BANK_SETTLEMENT/BANK_ARCHIVE` 合成标识推断真实取值。草稿与 Schema 正式批准、dry-run 和最终 Supplier commit 仍是四个不同边界。
4. **验收状态：** 这些源代码/新协议测试已写入 #999 原分支，**最终 exact-HEAD 全部 CI、Railway 已登录真实客户 Job 和 Human 视觉签收仍需分别核验**；任何绿色 CI 都不能替代未获得的原始 Excel、用户四图二进制和两个银行 field ID 的确认。

## 12. 2026-10-19 E7 草稿重入的真实 Host / 浏览器证据分层（R）

本节是直接阅读 [#999 的隔离 Host Chromium 工作流](https://github.com/jiangxng/EVO-App-Platform/pull/999) 运行日志和当前代码的新增证据，**全部是合成隔离 Job，绝非 Railway 已登录客户验收**。

- 原 E7 场景中“保存草稿”动作返回成功，但 `page.goto` 再次指向**相同完整 URL（含 hash）**，Playwright/SPA 可以保留已装载页面，不构成真正的重开证据。因此随后看到“原始 Excel 已保留”不能直接断言 Host 丢失草稿。
- [Actions run 39204327750](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39204327750) 的两组直接证据：`data-import.get` 对授权操作者返回 `STAGED` Job，包含仅属于 `bex01-isolated-operator` 的 18 列草稿和人工编辑后的名称；独立请求 `GET /v1/experience-pages` 得 `200`、`Your unapproved review draft restored`、原人工字段名称。由此**权威存储和 Host 新页面重建成功**；先前浏览器断言失败属于重入方式未真正刷新所致。
- 采用方案：测试改用完整的 `page.reload(wait_until="domcontentloaded")` 以保证真正重新加载，同步保留权威 Job/最新 Host 页面状态的断言；**不**采用删除重开断言、sleep 或以客户端 localStorage 冒充企业持久化。修改提交 `34b0c57111f1eea6f03b2f954fb87afc01c7596e`。
- 判定级别：以上属于 **R：直接读到的隔离 Host 原始 Actions 日志**。草稿 actor/权限隔离、过期字段回退和 Schema/最终供应商数据独立仍分别需要 exact-head 回归通过；用户真实 Excel、两个银行实际 ID、三行纠错、生产会话截图和 Human 签收仍保持未取得。
