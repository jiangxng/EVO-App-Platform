# BEX-01 / E4｜V3 高保真供应商导入界面：旧窗口恢复与证据接续（2026-10-16）

> **文档性质：** 当前接续记录（新文档，不覆盖历史快照）；只恢复决策、资料来源、设计基准与验收进度，不修改运行代码、业务数据、部署、共享 Eidos 或全局 `project.status.json`。
>
> **证据原则：** 「聊天中提出/用户决定」≠「原型演示」≠「已合入代码」≠「自动化验证」≠「真实 Railway 用户视觉与业务签收」。早期来源的“已读”仅继承 2026-10-15 GitHub 研究记录；本次没有重新打开所有外站全文或原客户 XLSX。
>
> **可用的旧窗口主要资产：** [V3 简短交接（Draft #909）](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-HANDOFF-20261015.md)、[V3 详细研究与方案比较（Draft #909）](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)、[可交互 V3 HTML 原型（Draft #909）](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)。#909 仍为未合并 Draft，以上链接指向**分支**，不是 main 代码。

## 1. 本轮准确快照和窗口边界

- 本次复核最初确认 Platform `main@6b54b0cb317319f37bd48668a86efaa5d42c259e`（合并 [#966](https://github.com/jiangxng/EVO-App-Platform/pull/966)，2026-10-16 02:55 UTC），与用户报告的 Railway E3 已部署 SHA 相符。**Railway Online 是用户提供的部署记录，本次未独立登录 Railway 核验实际页面或截图。**
- 因 PA05 并行推进，随后重新读取到 Platform `main@b294f24a81695cdde41a0c1a6d650e5236d77f64`（[#967](https://github.com/jiangxng/EVO-App-Platform/pull/967) 合并）。比较 `6b54b0cb…b294f24a` 显示随后提交为 PA05 等并行范围；**不可再称 `6b54b0cb` 是最新 GitHub main，更不能推断 Railway 已部署到 `b294f24a`**。
- Eidos 当前核验 `main@5e42613f4f877df48958db263275a7d0a2c742ab`（[#191](https://github.com/jiangxng/eidos/pull/191) 已合并）。
- 本恢复线仅在 `docs/plans/foundation-list-experience/` 增加接续记录及目录链接。无业务文件、`vendor/eidos/`、Agent、Host、Railway、全局状态更新。BEX 实际 UI 实现由原 owner/专属 PR 承接；PA05、Eidos 通用能力、插件治理窗口不属于本次变更。

## 2. 用户明确要求与已确认决策（恢复自旧会话索引、用户反馈及 V3 原型）

1. **视觉目标是用户认可的 V3 产品感。** 用户认可简洁、有秩序的白色办公界面、克制蓝色、留白、清晰信息层级、自然中文业务文案（“赏心悦目”“就是这种感觉”）。但**没有签收 E2/E3 的真实 /map 页面与 V3 像素级一致性**。不把模拟页做成满屏“非 Host”“模拟”“Schema”等工程说明；原型数据的合成属性仍须在研究/PR 中清楚声明。
2. **系统负责复杂度，用户就近做决定。** 经 [Eidos #186](https://github.com/jiangxng/eidos/pull/186) 纳入设计权威：“让复杂留在系统内部，让简单发生在用户面前”；“功能就近、信息就地、系统记忆、异常驱动、操作连续”。不能只把折叠表单当作 V3 完成。
3. **用户感知两阶段：上传 → 核对并导入。** 真实工作区须持续展示来源文件、工作表/真实行列数（确有数据时）、步骤、四类状态统计、优先问题列表、完整字段对应表、预检及底部单一明确主操作；低频内容按需展开，不掩藏必要动作。
4. **字段映射是完整、可撤销的业务决定。** 原 Excel 全来源列与授权可见原值保留；当前 Job 决定及合法历史 Recipe 优先复用，规则/AI 只对未决项提建议；每来源列只能选择一个目标，目标字段排他，不自动覆写用户选择；“不导入”可撤销、只影响业务写入，不代表删除原始来源证据。默认“需要关注”，可切换“全部字段”，筛选不能清空选择。
5. **问题必须真实和可定位。** 两个同名“开户银行”须依据真实 `field ID`、业务归属和来源样例供人选择，禁止按同名合并/删除；历史三条缺少 `subjectType` 的行若在当前 Job 仍然存在，逐条提供合法修复，不得以 `SUPPLIER` 关系推断 `ORGANIZATION` 或 `PERSON`；“系统编码”等元数据列须明确处理，不随意塞到扩展字段。
6. **少跳页不意味着跳过治理。** 企业扩展字段待建方案有独立 Human/Owner 批准；导入 `dry-run` 后才可再独立确认提交。任何新映射/Schema 变更须使旧预检失效；保留权限、企业隔离、重试幂等、失败可恢复、原始数据与已有批次记录。
7. **草稿与 Agent 的边界。** 真正的继续导入依靠 Host 持久 Job/映射/Recipe，不用静态 HTML 的 `localStorage` 冒充后台持久化；常规确定操作应由页面完成，Agent 是建议/辅助，不改 PA 权限契约。
8. **职责划分和窗口分工。** Eidos 管通用渲染/表格/审查工作区、语义与响应式；Platform 的 `apps/data-import/page.ts` 管真实 Job、字段状态、权限内命令、业务流程；不把业务规则写入 Eidos，也不私建 BEX 颜色组件。文档线独立，不覆盖并行开发。

## 3. 旧研究恢复：正式入口、网址、查阅等级与用途

完整、按编号的材料并未丢失，**不在本页重抄近百条**：

- [main：视觉层级 V01–V16、认知 M01–M08、流程 F01–F07、Eidos E01–E06、阅读等级和冲突](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。
- [main：旧 BEX 流程/业务方案参考索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。
- [#909 分支：V3 会话国内软件 CN01–CN12、国际认知原始资料、取舍、截图链接、丢失材料](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)。
- [#909 分支：Business Office 高保真品质分析](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-BUSINESS-OFFICE-HIGH-FIDELITY-QUALITY-REFERENCE-20261015.md)。

| 已用来源 / 原始 URL | 既有记录中的阅读状态（2026-10-15） | 被采用的事实/用途与限制 |
| --- | --- | --- |
| [Eidos Human Experience Authority](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md)、[Business Office Visual](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md) | **仓库原文已核验**；本轮确认 #186 和 #191 | Eidos 是设计及通用控件 owner；视觉原生，不引入 BEX 私有皮肤 |
| [飞书 Aily 数据表](https://www.feishu.cn/content/vl1lf3v5)、[多维表格应用模式](https://www.feishu.cn/content/article/7578812241772924111) | **旧记录已打开相关原文**；本次未重爬 | Excel 匹配建议、可人工修正；业务界面与数据架构分层；不是复制品牌或宣称拥有其技术 |
| [飞书响应式设计](https://open.feishu.cn/document/design-specification/responsive-design/responsive-design-guidelines?lang=zh-CN)、[飞书抽屉](https://open.feishu.cn/document/design-specification/component----feedback/drawer) | **仅检索提取章节/可见段落**，直开网页不完整 | 设备间布局转换、同上下文就近核对；不能说已通读官方全规范 |
| [简道云 CRM 关键字段导入](https://hc.jiandaoyun.com/solution/13147)、[导入关联数据](https://hc.jiandaoyun.com/doc/18609) | **仅搜索摘要**，正文未复核 | 提供中文导入预览→匹配→反馈的研究线索；关联歧义不可随便猜；不以摘要断言完整产品行为 |
| [伙伴云 Excel 导入](https://hc.huoban.com/tables/8a9a/974b)、[畅捷通字段匹配截图](https://service.static.chanjet.com/kj_java/20230505/2f079522361a4f18912a4519d691216b3.2-7.png) | 伙伴云 **旧记录见网页相关内容**；畅捷通**仅图片搜索结果** | 来源样本与目标选择同屏、中文字段状态；不能视为新版 UI 实测 |
| [NN/g 识别与回忆](https://www.nngroup.com/articles/recognition-and-recall/)、[中断与长等待](https://www.nngroup.com/articles/designing-for-waits-and-interruptions/) | **旧记录已读网页正文** | 历史选择可见、任务状态持续、进度和恢复入口 |
| [NN/g 视觉层级](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)、[GOV.UK Summary list](https://design-system.service.gov.uk/components/summary-list/)、[USWDS Table](https://designsystem.digital.gov/components/table/) | **旧记录已读官方网页正文** | 概览摘要和真实数据表格各司其职；视觉主次、桌面表格/窄屏可操作转换 |
| [W3C COGA](https://www.w3.org/TR/coga-usable/)、[WAI 文字对比](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) | **旧记录已读具体章节** | 减少记忆/重复输入、可返回纠错、基本对比度；COGA 文档不等于新的 WCAG 强制规范 |
| [Cowan 短期记忆研究](https://pubmed.ncbi.nlm.nih.gov/11515286/) | **仅正式题录/摘要**，非论文全文 | 减少对脑内记忆 22 列的依赖；不可推导为“界面最多四个控件” |
| [WPS 文档官网](https://docs.wps.cn/welcome) | **仅官网摘要** | 中文办公语汇背景；**没有验证 WPS 的具体字段映射算法** |

**明确比较与放弃理由（来源事实与 EVO 自身决策分开）：** 排除“全列大表单”“只剩几张指标卡”“聊天取代低歧义按钮”“上传即无确认写入”“标签相同即合并字段”“BEX 复制飞书皮肤”“原型 `localStorage` 当企业持久化”。采用“异常优先+全列可见+行内选择+真实 Host 保存/预检/人类确认+统一 Eidos”，是针对 EVO 任务的项目决策，不是外部软件的官方实现保证。完整逐项取舍、边界、矛盾和替代方案见上述 V3 研究索引 `4–`5。

## 4. 已完成 / 已验证 / 不能宣称的内容（GitHub 复核）

| 对象与 PR | 代码 / 设计 / 测试证据 | 能宣称的结论与不能宣称的结论 |
| --- | --- | --- |
| [Eidos #186](https://github.com/jiangxng/eidos/pull/186)、[#187](https://github.com/jiangxng/eidos/pull/187)、E1 [#188](https://github.com/jiangxng/eidos/pull/188)、E2 [#189](https://github.com/jiangxng/eidos/pull/189)、E3 [#191](https://github.com/jiangxng/eidos/pull/191) | **均已合并**；E3 最新来源 `main@5e42613f`；#191 PR 记录的两项检查成功 | **通用能力已实现**：分组、任务/概览、四列可编辑表、问题定位。≠ Platform 每一处 V3 视觉已签收 |
| [Platform #921](https://github.com/jiangxng/EVO-App-Platform/pull/921) | **已合并**，`1695d4ab`；未完成 Job 优先和“继续导入”真实目录导航 | 真实 Host 已有恢复入口；不等于完成异常行的就地纠错 |
| [Platform #860](https://github.com/jiangxng/EVO-App-Platform/pull/860) | **已合并**，`c0b56deb`；来源列单个扩展字段创建、持久映射、重复保护与重试 | 旧 #909 记为 OPEN 属历史快照，必须以**目前已合并**为准；不是全量 V3 Human 签收 |
| [Platform #964](https://github.com/jiangxng/EVO-App-Platform/pull/964) | **已合并**，`66f29a9d`；`apps/data-import/page.ts` 真实 `/map` 的 Eidos E2 四列审查、筛选、行内选择与 Host 命令；桌面/390px Chromium 回归 | **不是独立演示页**；筛选不删选择/原始数据，原目标 ID/排他与提交约束不变 |
| [Platform #966](https://github.com/jiangxng/EVO-App-Platform/pull/966) | **已合并**，`6b54b0cb`；在真实 `/map` 消费 Eidos E3 `reviewTask`：文件、三步进度、四项统计、最多 12 个实际待确认列的定位。PR HEAD Actions 共 17 次运行：**16 success / 1 skipped**（含 push 工作流），合并 SHA 的 main push 另有 **10 success** | **代码与自动化层 E3 接入成立**；用户交接同时报告 Railway `6b54b0cb` Online，**本轮未独立打开用户授权页取得视觉截图**；不能宣称 V3 已 Human 签收 |
| [Draft #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | **OPEN / Draft**，`head@af58e0abad880439d54230485305bf2b4e05decc`；保留 V2/V3 HTML、研究/截图索引、Chromium 测试。旧记录：V2 [run 38682435919](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38682435919) 14/14、V3 [run 38684546184](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184) 15/15 | 可作设计基准；**172 条、22 列及问题行是合成原型数据**，不是客户源 Excel，也不是正式 `/map` 页 |
| [Platform #878](https://github.com/jiangxng/EVO-App-Platform/pull/878)、[Draft #846](https://github.com/jiangxng/EVO-App-Platform/pull/846) | #878 **OPEN**，含旧版批量字段审核研究及 `manager/server.ts`；#846 **OPEN / Draft**，存历史字段交接 | 不能重复实施或未经复核直接合并其旧代码；要先按当前 main 判断与 #860/#964/#966 的重叠和未实现缺口 |

代码边界复核：Eidos E3 不拥有供应商/银行语义，也没有独立存储或新 Host 写命令；Platform E3 没改 SQL/授权/导入执行器。主线已有的行更正、Schema 创建、Recipe 能力需按现有业务 owner 与回归继续复用。**用户原 XLSX、真实客户 Job、当前浏览器截图和现场 Human signoff 不在本次 GitHub 合并验收中。**

## 5. 尚缺哪些关键原始资料或验收证据

- **最关键：原型 ↔ 用户实际部署页面的视觉对照还没有被用户签收。** 需在用户授权的 `#/data-import/jobs/import-79ce7d97-bbea-442a-b656-0661273b52f8/map` 实际环境采集桌面/390px 截图，对照 #909 V3 HTML 的文件层级、统计区、问题区、四列表格密度、底部动作与完整中文文案。旧截图描述只能用于定位问题，不能替代当前画面。
- 旧客户 Excel `往来账户2026_10_08_10_15_23.xlsx`、授权真实 Job `import-33ff3446-80c5-4992-b5c6-710f415535b3` 内容和两个银行的真实目标 field ID **未在研究分支留存**。新 Job 与旧 Job 不能混为一谈。必须先取得受权且合规的实际数据/脱敏证据，才能判断主体类型行级纠错与企业数据写入。
- 用户最初截图原件、旧聊天的全部逐条文本没有形成可核实的永久 GitHub 源；现在可稳定恢复的是 #909 的文档/原型及历史摘要。不要猜测失去的截图细节。
- [V2 截图 artifact 11948338743](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38682435919/artifacts/11948338743)、[V3 截图 artifact 11948839518](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184/artifacts/11948839518) 有 GitHub Actions 保留期限。原型 HTML 源码在 Git 分支；原 PNG、用户附件和真实 workbook 不能假定永久可访问。
- 简道云 CN08/09 官方全文、飞书部分 JS 页面、WPS 特定导入行为仅有摘要/段落，不需要现在重做广泛研究。**仅在真实场景出现尚无答案的 UI 决策时定向补查，并记录查阅等级。**
- 真机、缩放、屏幕阅读器、弱网中断以及真实源文件第二次导入 Recipe/幂等/权限/审计的综合 Human 任务验收尚未由本恢复线证明。

## 6. E4 下一步（按剩余结果，而非简单 PR 数量）

| 顺序 | 任务 | 验收口径 / Owner 边界 |
| --- | --- | --- |
| **E4-01** | **真实页面与 V3 的并排截图比对** | 在实际 `/map` 把“页面层级 / 文件摘要 / 4 统计 / 问题就地处理 / 字段表密度 / 底部 CTA / 中文措辞 / 390px”逐项标合格、差异、优先级；Human 决定是否认可 |
| **E4-02** | **仅修真实差距** | 通用控件/响应式行为需 Eidos 独立 owner 升级；数据/流程/文案落在 Platform BEX owner。不要复制 #909 静态 CSS 或重复创建 Eidos 组件；避免与 PA05 及 #878 旧变更冲突 |
| **E4-03** | **受权业务真数据验收** | 原值保留、Recipe 复用、同名银行 field ID、`subjectType` 真实缺失行、可撤销忽略、Schema 显式批量确认、预检失效/重新检查、最终提交及权限/幂等均用实际 Host 证据确认 |
| **E4-04** | **分层签收与归档** | 代码实现、专项/全量 CI、部署确切 SHA、桌面/移动真实页面和用户视觉签收分别记录；无 Human 签收不宣布 V3 高保真完成 |

**窗口交接规则：** 本页归档后，业务 owner 按最新 main 从独立 PR 继续；#909 只提供原型与证据，不把其历史分支整体合入运行主线。任何 PR 不得直接推 main 或覆盖他人共享 Host/Eidos 变更；CI 与用户视觉验收完成前不升级签收状态。
