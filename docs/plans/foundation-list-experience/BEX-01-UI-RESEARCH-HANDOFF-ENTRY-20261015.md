# BEX-01 / CP-03 界面研究与治理 — 简短交接入口（2026-10-15）

> **先读本页，详细资料转到 [研究决策参考索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。** 这是新的窗口接续入口，而不是替代旧 `BEX-01-WINDOW-HANDOFF-ENTRY-20261015.md` 所保存的历史工程交接。主线当前状态仍需在接续时重新核对 GitHub main、PR、CI 与 Railway 固定版本。

> **治理核验补充（2026-10-15）：** Eidos [PR #183](https://github.com/jiangxng/eidos/pull/183) 已经在该仓库 main 合并为 `5d832200f10a423179928dc1cd467217c9167e79`，EVO Platform [PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904) 已经合并为 `1970c06238ff1e45930219f499e028609305c2e5`。这两个治理 PR 的 CI 已通过，**代码 PR 中的检查记录门禁已经进入主线**；机械门禁仅核查有记录/栏目/改动文件链接，无法代替实际体验质量或 Human 验收。本 #899 仅归档研究与原型，未实施 BEX V2。


> **必经 CI 已补强：** Eidos PR #184 合并提交 `5d6a49f0bfa27a1fec931217b7e850f2759066aa`，UI 检查已接入其 `release-check`；EVO Platform PR #906 合并提交 `97b51955b14a8c647eefa177b90c4bcc441ad754`，UI 检查已接入原有 `continuity`。两个核心 CI 保留原任务检查同时对识别到的 UI 代码变更要求 8 节审查证据。仍不能据此宣称 Human 设计体验已签收。

## 1. 本轮目标和已接住的用户要求

从 Excel 数据导入现场的“22 列重复下拉和创建按钮”出发，用户先要求**极少可见步骤、更多系统自动工作**，继而要求系统尊重视觉层级与颜色、不同年龄对注意力/记忆的差异，并提出 **LLM 以后凡做 Human UI 都必须经过完整界面设计检查**，不能因换窗口丢失前序研究。用户认可保留研究并做新一版设计，**未明确签收 V2 真实业务程序或同意改生产**。

**始终保留：** 先恢复历史/同企业合法映射→剩余列规则/AI 建议→真实业务字段集中审核与一次批量创建→dry-run→用户明确提交；原 Excel 每一列数据保留；单列只能映射一个目标，目标不能重复占用；用户可撤销忽略、恢复草稿、修复错误；对真实 3 行缺失 `subjectType` 不以供应商关系代填；历史两个同名“开户银行”不未经核实合并/删除；PA-02 原 Agent 自动匹配入口与上下文不破坏。

## 2. 核实到的权威位置

**导航和颜色研究权威在 Eidos，不是在 Platform 另起规则：**
- `jiangxng/eidos/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`：第一阅读入口；
- `EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md`：导航放置；
- `EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md`：层级、密度、动作；
- `EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md`：中性底/白内容/克制品牌蓝/状态色；
- `EIDOS-VISUAL-COGNITIVE-RESEARCH-REFERENCE-INDEX-v1.0.md` 和 `EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`：本轮补充的研究及必检规则，归入 [Eidos PR #183](https://github.com/jiangxng/eidos/pull/183)。
- Platform `docs/architecture/EIDOS-NAVIGATION-INFORMATION-ARCHITECTURE-ADOPTION-v0.1.md` 沿用 Eidos；本轮 Platform 新的设计必检约束由 [PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904) 负责（AGENTS/.clinerules/CI），不覆盖其他窗口业务文件。

## 3. 当前 V2 设计（提案，不代表已上线）

- **用户感知两个阶段**：上传 → 核对并导入；预检查与最终业务提交可同页状态切换，但 Schema 创建确认/最终供应商导入仍必须分别明确。
- 系统承担记忆：历史映射/字段名称/来源样本和依据同屏可见，保存当前决定、允许离开后继续，不让 Human 跨多个页回忆上次选过什么。
- 视觉呈现：文件和结果优先；一屏只展示真正需要决定的例外；已处理/保留来源/建议新增摘要安静呈现；完整 22 来源列可一键展开为紧凑审阅表格，不能默认丢失/隐式新建。
- 对所有年龄统一可读、可缩放、可键盘操作的默认界面，不以年龄贴标签；优先沿用 Eidos 的现行颜色、spacing 与图标 tokens，不复制外部产品视觉风格。
- 原 HTML 静态交互稿（只是演示，不链接实际 Job）：[BEX-01-IMPORT-V2-COGNITIVE-PROTOTYPE-20261015.html](BEX-01-IMPORT-V2-COGNITIVE-PROTOTYPE-20261015.html)。

## 4. 必读文件（按此顺序，避免重做研究）

1. 本交接入口（短）。
2. [详细参考索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)（外部原始 URL、阅读状态、冲突、证据）。
3. [已有流程研究](BEX-01-IMPORT-UX-SIMPLIFICATION-RESEARCH-20261015.md)、[视觉研究](BEX-01-VISUAL-PERCEPTION-RESEARCH-DESIGN-20261015.md)、[注意力记忆研究](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md)（无需再次联网搜索全部旧资料）。
4. Eidos 的既有 Human Design/导航/配色规范与 PR #183 必检规范；Platform PR #904 采用规则。
5. 如开始业务代码实现，再读 `BEX-01-INLINE-EXTENSION-DISCOVERY-20261014.md`、前工程 handoff 及原 PR #894/#884 的真实验证证据。

## 5. 当前固定验收进度表

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 原导航/颜色权威定位 | ✅ GitHub 文档确认在 Eidos | 规范合并后复核引用 |
| 原流程研究复用 | ✅ 已保留 | 不重做 |
| 视觉感知与设计资料 | ✅ 已保存 16 项来源索引 | 按 Eidos 权威吸收 |
| 记忆注意力与跨年龄资料 | ✅ 已保存 8 项来源索引 | 继续核查重要原文全文 |
| 三层研究整合、V2 原型 | ✅ 源文件已提交本研究分支 | Human 设计审阅 |
| Eidos 通用 UI 必检权威 | ✅ PR #183 已合并；CI PASS | 新工作按规范执行 |
| Platform LLM 入口与 CI 审查门禁 | ✅ PR #904 已合并；CI PASS | 后续 UI PR 提供可检查的审查记录 |
| 原 Excel 现场问题及截图原件 | ⏳ 尚未完成真实数据读取与图片 GitHub 二进制保全 | 取原 Job/授权素材并验收 |
| BEX V2 业务代码及 Railway | ❌ 本轮没有实施/部署 | 用户签收设计后独立实施 PR |
| **本专项整体** | **设计研究及治理变更已提交；用户真实验收未完成** | **CI/合并状态核查→设计签收→实现→业务验收** |

## 6. 分支、PR 和接续起点

- 业务研究资料：EVO-App-Platform [PR #899](https://github.com/jiangxng/EVO-App-Platform/pull/899)，分支 `docs/bex01-import-ux-simplification-research-20261015`（原 Draft 设计线）。
- 统一 Eidos 规范：eidos [PR #183](https://github.com/jiangxng/eidos/pull/183)，分支 `docs/human-ui-visual-cognitive-review-gate-20261015`。
- Platform LLM/CI 采用：EVO-App-Platform [PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904)，分支 `governance/human-ui-design-review-gate-20261015`。
- 该页提交 SHA 以随后回复的**交接快照**为准，不能在同一 Markdown 中预写其尚未完成的最终提交。
- 原 Import Job `import-33ff3446-80c5-4992-b5c6-710f415535b3`；原 Excel `往来账户2026_10_08_10_15_23.xlsx` 未作为二进制源存入本研究线。
- 用户提供的原截图保留在**原聊天附件**；曾挂载 `/mnt/data/image(20261015-015021).png` 与 `/mnt/data/image(20261015-023214).png`，均属本次容器临时路径，不能作为下一窗口稳定 GitHub 链接。

## 7. 下一窗口最小任务

先核对上述 3 条 PR 的状态/最新 main，确认所有跨 repo LLM 界面门禁合并与可用，再用 V2 静态原型和同一份验收表进行用户设计评审。没有新的否决依据不要推翻历史 B 方案；真正实施时**先写本次 UI 审查证据**，只在 BEX 独立 PR 修改对应业务文件，不顺手接管 Eidos/PA-04，使用原 Excel 真实 Host+Chromium 验收，符合 CI 才精确发布到现有 Railway 开发环境。严禁把研究原型当已交付程序。


## 8. 2026-10-15 本窗口接续审查增量（覆盖旧快照，不覆盖既有决定）

- **最新核查**：EVO Platform `main@5a46f846b81fe1c2a244371e0783b906cfe170c5`；Eidos `main@0f42f19dea26892403d2c377e4bb1a1858ca7c7d`。两个 main 的 CI 最近一次 push 成功；UI 强制复核步骤因仅用于 pull_request 而在 push 中被跳过，但两仓独立 UI PR gate 存在成功的 PR 运行证据。下次仍须实时核对。
- **开放 BEX PR**：#878、#860、#846。尤其 #860 对 `apps/data-import`、`apps/object-extension` 和 `manager/server.ts` 有业务修改，不能在本评审窗口抢改或合并。
- **V2 静态原型审查**：源码已阅读。首屏主标题→来源文件→摘要→例外→详情→主动作顺序符合方向；原型只有 5 条示意列、不具备持久保存和真实上传/预检/批量字段确认/成功提交，银行字段仅示意 A/B。不能将其当作功能已完成。
- **新审查记录写入原有认知 V2 文档**：[第七节：源码级设计审查、逐项验收、U1–U6 未决、双仓门禁真实边界](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md#七2026-10-15-接续审查v2-静态原型的产品与-human-ui-设计验收记录待-human-签收)。旧 V/M/F 来源阅读状态不变。
- **本次修改仅文档，不改 HTML 原型/Host 或 Railway**。新设计方向继续等待 Human 签收，任何 BEX V2 正式 UI 代码修改需独立 PR 配 `docs/ui-design-reviews/*.md` 的 8 节证据。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 最新 main / 开放 PR / CI | ✅ 已重新核验 | 实施前再次检查 |
| Eidos / Platform UI 门禁接入 | ✅ 实际文件及 PR CI 记录已核验 | 在真正 UI PR 触发验证 |
| 三层研究继承与原型源码审查 | ✅ 完成源码级审查 | Human 浏览器视觉验收 |
| 实际原 Excel/Job 数据与草稿恢复 | ⏳ 尚无 Host 授权证据 | 真实 Job + Chromium |
| V2 产品设计最终签收 | ⏳ 待 U1–U6 产品决定/实测 | 签收后独立实现 |
| V2 代码、固定 SHA 开发部署 | ❌ 本窗口未实施 | 业务 CI/验收后再部署 |


## 9. 2026-10-15 继续：可交互方案演示与下一道 Human Gate

- 在 **Draft [PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909)** 只新增一份独立 [V2 Human 可交互审阅原型](BEX-01-IMPORT-V2-HUMAN-REVIEW-PROTOTYPE-20261015.html)，不改 #899 的原版 HTML、不触碰 `apps/data-import`、`apps/object-extension`、Agent、Eidos、Host 或 Railway。
- 新原型只使用 **7 条明确标注的演示来源列**，不伪造原文件 22 列分类；可演练同名银行两候选比较、三条模拟主体类型人工补录、一次字段方案确认、预检阻断、最终模拟提交、局部演示草稿恢复和一键展开全部模拟明细。模拟选择在浏览器本地保存，不是 Host 断点恢复，绝无正式业务数据写入。
- 29 个 HTML id 与 `aria-controls` / `label for` / JS 目标关系已静态核对、结果正常；**未取得 Playwright/Chromium 真实截图和 Human 签收**，不能按浏览器通过宣传。
- **新增设计建议而非已批准新决定**：AI 在历史/规则之后建议剩余项；长异常列表按业务阻断级别排序；元数据只做可修订保留来源建议；正式恢复必须由 Host 持久化；只有字段创建清单变化时才重新确认 Schema，任何影响有效性的映射变更必须重跑 dry-run；提交后修复需独立审计。详见 [V2 认知研究第八节](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md)。
- 下一步仍为：Human 操作原型并记录关键交互决策 → 找到原 XLSX 与真实 Import Job 授权数据、实机浏览器核实 22 列 → 按独立 BEX 实现 PR 制作 Eidos 八域审查证据与准确 Host/Chromium 测试 → 满 CI 后才考虑现有 Railway 开发环境固定提交发布。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 核心设计与此前研究 | ✅ 保留，未推翻 | Human 验收 |
| 新版可交互原型 | ✅ 代码已进 Draft #909、静态关系检查正常 | Chromium + 人工操作 |
| U1–U6 研究方案 | 🟡 已给优选但未签收 | 业务 Owner / Human 批准 |
| 原 Excel/真实 Job | ⏳ 未读取 | 取得授权来源并核查 |
| V2 业务与固定 SHA 发布 | ❌ 没有实施 | 通过后续独立验收再推进 |


## 10. 2026-10-15 浏览器专项真实运行结果（最新，覆盖 §8/§9 的早期“未运行”快照）

- 本次新增隔离 Chromium [工作流](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38678793663) 已 **7/7 PASS（0 失败、0 JS 错误）**，且已上传 [只含模拟信息的截图与报告](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38678793663/artifacts/11947496968)。
- 精确新增文件：`tests/bex01/v2-prototype-chromium.mjs`、`.github/workflows/bex01-v2-prototype-chromium-review.yml`；**只运行独立研究原型的真实浏览器自动化，不调用 Railway/Host，也不读取用户文件**。
- 当前判断：可交互原型的基本状态/步骤/模拟断点恢复、桌面/窄屏/键盘/200% CSS zoom 自动化通过；主观截图评审、屏幕阅读器、400% 原生缩放、真实用户 Excel/22 列和企业 Host 仍未签收。具体结果及边界以 [认知 V2 文档第九节](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md) 为准。
- GitHub 最新主线/开放 PR 仍须新窗口实时核对；本轮只在 #909 Draft 内做设计/验证，**没有业务文件修改、合并 main 或 Railway 发布**。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 独立 V2 浏览器自动行为与截图证据 | ✅ 7/7 PASS，artifact 已保存 | Human 视觉/交互签收 |
| 项目真实 22 列来源、同名银行归属及三行缺失 | ⏳ 无真实授权数据 | 原 Excel + Import Job |
| 正式 BEX V2 Host/数据操作 | ❌ 未开始 | 设计经认可后独立代码 PR |
| 现有 Railway 开发版本 | — 没有修改 | 真正功能 CI/业务验收后固定 SHA |


## 11. 2026-10-15 来源列编辑闭环与审批状态证明（最新）

- [Draft PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) 的 V2 原型从只读 7 列摘要升级为 7/7 个示例来源行均有操作入口：五个来源行在详情中可改处理选择，“开户银行/主体类型”首屏独立展开，元数据待定有显著入口。不声称已解析真实 Excel 22 列。
- 模拟已有目标一对一排他、忽略可撤销、全部来源选择可重进复核、核心编码和名称出错则阻断；新建字段方案动态更新，清单一变就要求独立重新批准，0 新建时不强迫走创建确认。
- 新的 [run #38679932512](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38679932512) **10/10 Chrome/Chromium 自动测试 PASS**；证据含截图和 JSON：[artifact #11947504213](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38679932512/artifacts/11947504213)。本轮首次 [run #38679856210](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38679856210) 为 8 PASS/2 FAIL，确实发现原型把“下一步审批”误计为当前来源异常，已按语义修复后重测成功。完整细节参考 [认知 V2 文档第十节](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md)。
- 仍无原 XLSX、实际授权 Import Job、真实企业字段引用和实际 Supplier details Human 签收。本轮没有改变 PA/Eidos/Host 正式业务文件、Railway、主线合并；研究 PR 继续保持 Draft。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 7 列完整模拟来源处理与双审批行为 | ✅ 10/10 独立 Chromium 场景通过 | Human 亲自验证 |
| 原 Excel 22 列/字段 ID/缺失类型 | ⏳ 缺真实证据 | 用原 Job/文件逐项核查 |
| V2 业务实现与固定 SHA 发布 | ❌ 未实施 | 设计批准→独立业务 PR |
| Human 视觉、真机与无障碍签收 | ⏳ 未完成 | 主观设计评审与真实 Eidos 测试 |


## 12. 2026-10-15 用户否定开发说明式原型：高保真 UI 改版（最新）

用户明确：高保真原型面向使用者，不应在输入项、提示文字里反复写“演示选择”“三条模拟问题行”“非 Host”等；否则要自行脑补正式系统，不利于评审。用户允许同时参考中国企业软件的成熟做法。**此反馈已接受为产品原型默认规则，而不是对现有按钮做表面改名。**

**已改原型（同路径、同 Draft #909，未碰业务运行代码）：** `BEX-01-IMPORT-V2-HUMAN-REVIEW-PROTOTYPE-20261015.html` 是完整中文供应商导入工作页：EVO 工作台语境、导入步骤与文件名、172 条/22 列业务样例、4 项拟新增字段、优先处理 3 个数据/字段问题、可见业务字段名和样例值、一屏对应关系、按问题直接定位、更正三条真实感的供应商记录、区别同名银行的业务用途、创建字段清单单独确认、预检查失败与最终导入动作。输入中不出现技术/测试式标签。

**重要事实边界：** 页面显示的 172 条、22 列和供应商名称是为了逼真体验而专门构造的**合成产品样本**，不是从用户原 `往来账户2026_10_08_10_15_23.xlsx` 读取的真实数据，也不代表已经写入供应商。此说明保留在文档、PR 与验证报告中，**不再污染产品界面**。真正导入前必须按原 Excel 和授权 Import Job 重新核对真实字段和值。

**中国参考索引与采用排除理由**：飞书 Aily 官方 Excel 导入、简道云官方 CRM 数据预览/配置/结果、伙伴云官方 Excel 来源映射、畅捷通表头对应图片、WPS 办公界面熟悉感，及各来源已读/摘要/仅截图状态，均已记录在 [认知 V2 文档第十一节](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md)。此窗口不假装 WPS 已核实特定字段匹配方案。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 高保真中文业务产品页面（代替开发说明界面） | ✅ 新 HTML 已提交至 Draft #909 | 用最新版 Chromium 截图 + Human 视觉审阅 |
| 合成来源 22 列、供应商样例与异常修复交互 | ✅ 页面已具备，**不是原 XLSX 证据** | 最新浏览器自动回归及后续原作业 |
| 国内软件实际对照资料 | ✅ 已记录来源、阅读级别与落点 | 设计评审时继续比对 |
| 原 Excel 及账户授权后的实际 Import Job | ⏳ 仍未获得 | 用真实数据验收 |
| 正式 Eidos / Owner / Host / Railway | — 本研究未修改 | Human 设计获确认后独立实施 |

**注意**：此前§10-11中“10/10 通过”是旧开发说明式 HTML 的自动测试快照，不能自动算作本次高保真改版已通过；最新有效状态请以本 PR 最新提交关联工作流的精确结果为准。
