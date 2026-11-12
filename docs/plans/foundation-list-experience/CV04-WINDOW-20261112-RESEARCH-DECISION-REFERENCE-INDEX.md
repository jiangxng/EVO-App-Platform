# CV-04 / 2026-11-12 旧窗口研究、决策、GitHub 证据交叉索引

> **RECOVERED_REFERENCE_INDEX / VERIFIED_STATUS_DELTA**。本索引是增量恢复，不覆盖既有研究文献，也不声称重新访问全部历史来源。配套[简短交接入口](CV04-WINDOW-20261112-CONTEXT-RECOVERY-HANDOFF-ENTRY.md)。核验 2026-11-12 `jiangxng/EVO-App-Platform main@fd357d988df99602545655a457fe3d79a9b412e2`。本轮实际读取 GitHub connector 的 main 文件、PR 元数据、Actions run 状态及 Issue；**没有执行新的物理 Tokyo 登录或重新打开第三方产品网页**。

## 0. 资料等级与恢复边界

- **CHAT**：从当前用户陈述、可恢复的前窗口内容归纳的明确要求；不当作已提交代码。
- **G-CODE**：本轮直接读取 main 源码/现有文档，或从已合并 PR 核对文件级实现；需要区分实际读过源码与仅查到旧索引。
- **G-META / G-ACTIONS**：本轮实际核 GitHub PR、Issue 及 Actions run 状态；原始 job log 的终端 marker 有**先前归档文档**佐证，本轮未重新逐行打开 job log，故不冒称重新阅读。
- **H-ORIGINAL**：原窗口研究索引注明已读官方相关正文，直接继承**当年的日期/具体章节**；不是 2026-11-12 重新阅读。
- **S-SNIPPET / U-UNAVAILABLE**：历史仅见搜索摘要或网页正文无法读取；只保存线索与用途，不增加外推。
- **D**：本项目采用/排除的工程设计判断；**P**：尚无合格证据、待验证事项；**HUMAN_PENDING** 与通过 CI/自动浏览器不同。
- 本次未定位到可逐页核查的完整旧聊天原始导出；已入库的旧窗口研究和源码路径足够恢复主干，但不能复原旧聊天中从未入库的搜索、页面截屏及原始附件。不会把“未在本轮找到”改写成“历史上不存在”。

## 1. 用户明确要求与确认决定（CHAT / DESIGN）

1. 原始需求（2026-11-06 起）：Dictionary、Counterparty、Item、Warehouse 等业务插件大量是列表型，提炼可被继承/覆盖/扩展的共同 Collection、表格/紧凑列表、列/快速筛选/多条件过滤、排序与服务器分页、保存个人/公共视图、详情返回、导出/导入、看板/柱饼图、BI 两种注入方式，桌面与手机都要能实际用；**不能做第二套业务事实或 List/Eidos framework**。
2. 权威分层：Domain Owner 保存原业务事实、Schema/行字段权限、聚合与写入；Eidos 负责共享 View/Navigation/Responsive/可访问性；Platform Host 负责 Plugin Feature 生命周期、受管 Operations/authorization/receipts；Personal Agent 通过有权工具搜索/描述/执行，AI 失败可 Human 继续。所有表现依据 Eidos/V3 的功能、布局、颜色，不允许“测试绿灯但页面不完整”。
3. 2026-11-12 最新确认：**日常 List 开发自主推进，不逐项等用户批准**。但 PR/Actions、真实验收、分支清理、发布规则照常；并行窗口与 Owner 文件不得抢占；真正生产 N1 SAVE 安全门禁不在此授权内。
4. CV-03 另一工作线已确定 **方案 A**：正式 PostgreSQL 真实授权 + `authority_epoch` + `source_generation` + immutable Outbox 在同一个 ACID T0；东京现有 Lighthouse 优先。仅选择架构不等于具名 PA05/DB/Security/AuthorizationProvider Owner 审批。当前 `N1=NOT_CERTIFIED`、SAVE OFF、POST 403、GET 404。
5. CV-04 本轮最新目标：当前页 CSV 已上线并由真实隔离 Host + Eidos + Chromium 下载 6/6 自动验收；接下来真实登录跨企业/撤权/Agent 验收，再做**独立 EXPORT 权限 + 审计 + 任务预算的安全跨页导出**，整个 List 尚未完成。

## 2. 已有一手外部研究：原网址、日期、读级、项目用途与排除理由

以下直接继承 [11-06 EX01–EX08 原索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) / [11-10/11 交接索引的补充重查记录](CV03-N104L-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261111.md)。**本次没有新打开网址或擅自“升级”阅读等级**。

| ID、原始网址 | 已存历史阅读记录（不是本次访问） | 已记录来源事实与本项目采用（D） | 暂缓/放弃/边界（D） |
| --- | --- | --- | --- |
| EX01 [Microsoft SharePoint Server 2019 / Create, change or delete a view](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | 11-06 H-ORIGINAL（相关章节）；11-10 R-相关正文，Applies To、Create new views | 系统/个人/共享视图与记录分离，列/排序/过滤；用于 CV-02/03 | 不混同 Microsoft 365 的新视图；不采用 SharePoint 存储/授权 |
| EX02 [Microsoft SharePoint 2019 limits](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | 11-06 H、11-10 R，「Items」「List view threshold」 | 特定操作 5,000 行阈值与总量不同；用于服务端过滤/分页/预算 | 5,000 不是 EVO 统一上限，更不是 CV-04 Export Job 预算 |
| EX03 [Odoo 19 View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | 11-06 H；11-10 打开超时 U-UNAVAILABLE；待按 19.0 章节复查 | List/Search/Kanban/Graph/Pivot 模型上的声明式视图；用于 CV-06 | 不移植 XML/Python，不假定任何字段可做统计图/看板业务改写 |
| EX04 [Power Apps grid control](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 11-06 H；11-10 原页不可达 U；另有 [10-12 S02 en-us 正文](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 字段/权限/密度/移动 Reflow；用于 Eidos 只读表格 | 复杂可编辑 Grid、无限滚动及全部子控件后置；不能把网页不可达当源不存在 |
| EX05 [SAPUI5 List Report and Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | 11-06 H 摘取相关内容；11-10 HTML 壳无正文 U；10-12 S01 **仅搜索摘要** | 列表→详情→返回的组合设计；用于 CV-02 | 不移植 SAPUI5；不得从无正文来源引用精确键盘/按钮规范 |
| EX06 [明道云视图介绍](https://help.mingdao.com/view/introduction/) | 11-06 H；11-10 R「概述」「视图基本组成」 | 视图与工作表记录分离、呈现变体可扩展；用于 CV-02/06 | 不允许任意 HTML/JS 插件绕过 Host；不复制其权限角色 |
| EX07 [明道云应用介绍](https://help.mingdao.com/application/introduction/) | 11-06 H；11-10 R「功能模块」 | 工作表、视图、角色/权限、统计/工作流分层 | 不采用万能单一业务表；Domain Owner 保持 |
| EX08 [W3C WAI-ARIA APG Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 11-06 H；11-10 R「About」「Data Grids」「Keyboard」 | 语义只读 Table vs 可交互 Grid 的焦点/键盘不同；用于 CV-02/07 | 只改 role=grid 不代表无障碍完成；仍需读屏/键盘和 Human |

**补充 2026-10-12 S 资料：** [REFERENCES.md §2](REFERENCES.md) 保留 S01～S08 独立、不可更改的原始阅读评级，包括：S03 [Power Apps Import data](https://learn.microsoft.com/en-us/power-apps/user/import-data) **已读原文相关章节**（映射/复核/Recipe），S04 [Excel to table Copilot FAQ](https://learn.microsoft.com/en-us/power-apps/maker/common/faqs-excel-to-table-app) **已读相关正文**（AI 建议需审核），S05 [AG Grid SSRM pagination](https://www.ag-grid.com/javascript-data-grid/server-side-model-pagination/) **已读相关正文**（远程分页，但 **没有选型或许可证认证**），S07 [Power BI embedded RLS](https://learn.microsoft.com/en-us/power-bi/developer/embedded/cloud-rls) **已读相关正文**（BI 嵌入必须真实身份权限，**未采购**），S08 [SAP Analytical List Page](https://experience.sap.com/fiori-design-web/analytical-list-page/) **只有搜索摘要，打开失败**。这些不成为 11-12 新网页阅读。

**CV-03 PostgreSQL 历史官方资料：** [PostgreSQL 17 pg_hba.conf](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html)、[pg_hba_file_rules](https://www.postgresql.org/docs/17/view-pg-hba-file-rules.html) 见 [N1-05c 来源索引 §5](CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md)，为此前设计时已查参考，**11-12 本次未新读原文**。具体东京 HBA、SCRAM、SQL role 是否有效只能以实际 SQL/CI 物理证据证明，不能以官方页替代。

## 3. 内部 H01～H10 与现成资产（继承历史索引，避免重复开发）

| 历史索引 | 项目原始文档 / 已有实现职责 | 当前如何复用 |
| --- | --- | --- |
| H01–H02 | [Foundation Object Platform Architecture](../../architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md)；[Experience / Import / Workbench](../../architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md) | 各 Owner 的事实、EffectiveSchema、职责 Projection，沿用数据导入 |
| H03–H05 | [旧 PLAN](PLAN.md)；[Business Experience Framework](BUSINESS-EXPERIENCE-FRAMEWORK.md)；[2026-10-12 REFERENCES](REFERENCES.md) | 原 L0～L5/候选列表接口是**历史设计**，不是实际接口；BI/页面双路径保留 |
| H06 | [Foundation 建模与导入工作包](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md)；[六步里程碑](FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md) | 不将其独立任务完成状态混入 CV-04 |
| H07 | [Plugin Platform Mainline](../../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)、[Plugin Protocol](../../architecture/PLUGIN-PROTOCOL-v0.1.md)、[Extension Boundary](../../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | 使用原 Plugin/Feature/Capability，不让轻量 Host 承载业务 Repo |
| H08–H09 | [Agent Capability Fabric](../../architecture/AGENT-CAPABILITY-FABRIC-v0.1.md)、[Agent Action Receipt](../../architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md)、[Agent Context 宪章](../../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) | Human/Agent 同权 READ；WRITE 需 Operation/Host durable receipt；EC 不是业务事实 |
| H10 | [Plugin Human Experience Gate](../../governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md) | V3/Eidos 对齐、桌面+390px、用户/Agent、入口/返回/失败/恢复签收 |

完整 H01～H10 的历史章节与原始说明见 [11-06 索引 §2](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[11-09 恢复索引 §2–5](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)，不重命名 owner，不补造原来源。

## 4. 本次直接核对的 GitHub / 源码 / PR / 运行证据

| 证据（日期 2026-11-12） | 等级与已证实事实 | 不可混淆的待验 |
| --- | --- | --- |
| [当前 main branch API](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main) | G-META：`fd357d988df99602545655a457fe3d79a9b412e2` 是本次访问时最新主线；其直接父提交包含 `8a7d3d...` | 新窗口必须刷新；不是在线镜像 |
| [CSV Serializer](../../../foundation/collection-query/page-csv.ts) + [底座设计](CV04-AUTHORIZED-COLLECTION-PAGE-CSV-20261112.md) | G-CODE：已读真实函数；当前页、最多 100 行/20 列、字段范围/长度限制、CSV 公式安全；helper 无权私自查询 Repo | 不是独立跨页 EXPORT / 后台 Job |
| [字典 Owner + Eidos](CV04-DICTIONARY-CURRENT-PAGE-EXPORT-HOST-EIDOS-20261112.md)、[#1259](https://github.com/jiangxng/EVO-App-Platform/pull/1259) | G-已存源码证据/PR：原 Query/READ/Host 注册和真实 Eidos Button；东京 [#43150074863](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43150074863) 为有条件的实际发布证据 | 单页 READ 授权不是全量 EXPORT；不是登录验收 |
| [Counterparty Projection](../../../apps/counterparty/projection-service.ts) / [Owner CSV](CV04-COUNTERPARTY-MY-PROJECTION-PAGE-CSV-20261112.md)、[#1261](https://github.com/jiangxng/EVO-App-Platform/pull/1261) | G-已存工程归档，行字段先授权再查询；东京 [#43152812989](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43152812989) 记录业务 SHA `73b5875...` 发布 | 不可复活未经授权 displayName / 未同意全量跨页 |
| [PR #1263](https://github.com/jiangxng/EVO-App-Platform/pull/1263)、[改动文件](https://github.com/jiangxng/EVO-App-Platform/pull/1263/files) | G-META：确认为 MERGED，merge `8a7d3d...`，改 4 文件（Host fixture、Chromium script、workflow、验收文档）；没有 runtime 修改 | 不能把浏览器下载事件当真正东京员工签收 |
| [主线 Actions #43155275632](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43155275632)、[6/6 验收明细](CV04-REAL-HOST-CHROMIUM-CSV-ACCEPTANCE-20261112.md) | 本次 G-ACTIONS 再查 completed/success、`head_sha=8a7d3d...`；先前文档存六次 `CV04_PHYSICAL_CHROMIUM_DOWNLOAD_PASS` 和 `...TERMINAL_PASS=6` 原始 job marker。下载落地真实 CSV 字节、字段/BOM、隐私、状态与无 JS 溢出已有记录 | 无实机 Safari/Android、无真实 Tokyo 登录账号/LLM |
| [证据 Actions #43154945153](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43154945153) | 历史归档：artifact `13915826586`，六张截图、JSON、fixture 日志约 459KB；原索引已记首次 fixture `result.data.version` 错误并修复 | 本轮没有重新下载 ZIP 或独立复读全部截图；GitHub Actions artifact 有保存/过期风险 |
| [PR #1264](https://github.com/jiangxng/EVO-App-Platform/pull/1264) | G-META：MERGED，归档上述 run/job 和主线、Branch Hygiene、预览 SKIP，merge `fd357d...` | 纯文档不代表部署 `fd357d...` 镜像 |
| [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | G-META：1212 本次仍 OPEN/Owner signoff PENDING；1184 本次仍 OPEN，三份 Owner 文件不可越界改 | 五项 checkbox 勾选和任何 LLM 自述都不是独立生产授权 |
| [N1-05c 历史 Window Entry](CV03-N105C-WINDOW-20261111-POSTMERGE-HANDOFF-ENTRY.md) / [Index](CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md) | H/G-已存：真实东京 PG17 QA SCRAM/HBA、两个 SQL Principal/进程、Outbox/拒绝、原 DB ACL、当前静态 Provider 候选等有限证据 | QA 同机 ≠ 跨物理 Host；没有 PA05/Provider/SQL/KMS 正式生产 T0/安全 Owner 签收 |

**物理截图/原始日志位置**：见 [CV-04 Chromium 专题 § 主线实际证据](CV04-REAL-HOST-CHROMIUM-CSV-ACCEPTANCE-20261112.md)，以及上述 GitHub Actions run/job/artifact ID；本次不新建图片/PDF、不虚构本地附件位置。需要长久留存时依既有权限和保留策略归档，避免公开包含敏感业务数据的日志。

## 5. 方案比较：来源事实 F / EVO 选择 D / 放弃与条件

| 议题 | F：已知事实/旧研究 | D：采用方案及理由 | 放弃方案与限制 |
| --- | --- | --- | --- |
| 数据集合抽象 | Counterparty/Dictionary 已是不同领域 Owner，Eidos 有 CatalogBrowser；EX01/03/06 视图独立 | 原 Domain Owner + 共同受限 `DataCollectionResultV010` + Eidos 视图声明 | **不做**统一业务数据表、新 List Framework 或复制 Eidos renderer；领域写入/聚合不可泛化 |
| 读/导出范围 | 已合 CSV helper 和 READ Page Export；Owner 再授权 | 先为明确可见的**当前授权页**提供 CSV；现有权限下可证明字节一致性 | **不做**浏览器跨页抓取/不在没独立 `EXPORT` 权限时提供全量导出；大导出另建 Owner Job |
| AI 操作 | CV-02 内部 Agent Tool / Human ActionRouter 同权回归；Fabric v0.1 仅 READ/PLAN | `search/describe/invoke.read-plan` 和正式受管 WRITE/Receipt 分开；下一步真 LLM/真实会话验收 | **不做**Agent 直连 DB、任意 SQL 或用测试静态 Session 代表登录人 |
| 多视图/BI | Eidos 上游视图已接；EX03/06/07、S07 提供模式 | Table 优先，Kanban/Chart 合法后端聚合、BI 跳转或治理贡献插槽按需装载 | 不从当前页虚构总量，不做万能 BI 嵌入/无权限脚本 |
| CV-03 授权 T0 | 历史 QA 中真实 Manager file/memory 与 PG 授权非同一生产事务 | 用户明确 **方案 A：单真实 PG T0 + immutable Outbox**；保持原 PA05/Provider 接口并渐进迁移 | 方案 B 跨不同存储同步封闭无独立签名证据，不采用；未签核绝不放开 SAVE |
| 环境/发布 | 腾讯东京已有 CI-gated Preview、健康与 Basic Auth | 复用现有 Tokyo/Actions，runtime 变更才 Deploy；docs/test-only SKIP 正确 | 不另买 Railway 作为此工作线依赖；不把 Preview/QA 等同 Production |
| 无障碍 | EX08 / S06 说明 grid 键盘语义差异 | Eidos 语义只读表格，真正互动 Grid 人工键盘/读屏专项验证 | 仅设置 ARIA 属性、390px viewport 模拟或静态截图不足以 Human_PASS |

## 6. 冲突、无法恢复与继续检索的最低必要范围

1. **历史状态冲突**：2026-11-06 唯一计划中 CV-04 写 `PLANNED`，这是当时快照；2026-11-12 已有真实当前页 CSV 代码/自动浏览器/预览证据。**不直接修改仍被 #1184 管理的原计划**，以本增量页记录新证据，后续由对应 Owner 合并修订状态。
2. **“真实浏览器”与“真实账号”不是一回事**：本轮 6/6 通过使用实际安装 Host + Chromium，但是隔离临时企业、静态 HUMAN Test Session；真实东京登录撤权 / Agent 真正自然语言 / 物理手机和人工签收仍 P。
3. **“东京预览成功”与“本次 main 发布”不同**：业务镜像是 `73b5875...`；`8a7d3d...` 是浏览器测试合并 main；`fd357d...` 是证据文档合并 main。测试/文档 CI 触发部署正确 SKIPPED，不能制造新发布完成记录。
4. **方案 A 与 Source Owner 冲突**：PG17 QA T0、角色/HBA 有真证据，但运行时 Provider 静态候选不能证明真实 PA05 policy authority；#1212 checkbox 勾选但状态 OPEN。独立 Owner 审批、正式数据迁移/ACL/KMS/离线恢复、跨机器实验仍未取得。
5. **资料访问不足**：Odoo 19（11-10 超时）、Power Apps Grid（11-10 不可达）、SAP 正文（HTML 壳）、SAP Analytical List Page（10-12 只摘要）。未来**只有当 CV-06 或交互式 Grid 需要精确产品对标时**再定向查对应章节；本次不做大范围重复调研。
6. **旧聊天无法逐字完整恢复**：可恢复的要求和历次 GitHub 交接文件足够执行当前路线；任何未曾入库的旧网页、截图、明确拒绝方案不得猜测。验收 screenshot 在 Actions artifact 下，尚未复制为永久附件。
7. **最值得立即查的不是竞品网页而是执行证据**：新增 CV-04 登录/跨企业撤权/Feature 停用/Agent Run 的真实结果；安全跨页 Job 先定 Owner `EXPORT` 权限和预算；CV-03 正式 Producer/Provider/DB Owner 如无签核继续拒绝生产 SAVE。

## 7. 具体接续文件与实施顺序

- 以[近期 CV-00～07 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[架构分工](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)和 [CV-04 真实 Host 验收](CV04-REAL-HOST-CHROMIUM-CSV-ACCEPTANCE-20261112.md)为起点；别修改 #1184 管理计划全文。
- 首个工程 PR：扩展 `tools/cv04/real-host-csv-browser-fixture.mjs`、`tests/cv04/real_host_csv_download_chromium.py` 及真实 `apps/{counterparty,business-dictionary}` Owner/Agent 工具集成负例；要同一已认证 Principal、企业 Context 和撤权事件，**区分模拟、Host 认证与真实登录**。
- 次个工程 PR：在现有 Domain Owner/Capability/Host ActionRouter/Collection Query 上定义明确 `EXPORT` Operation、行列政策、Snapshot、审计 + Budget + TTL + async job；新增可复用安全合同与 Eidos/Agent 下载入口。导入仍用 Data Import / ImportTarget/Recipe。
- 后续按 CV-05/06/07 逐项选一个真实任务、一个合法聚合/看板、第三插件，以及 Eidos 真实手机/键盘体验；验收完成前不可将 List 基础插件标完。
- 所有工程由单独分支 Draft PR → exact-head CI → Ready → merge → SHA-safe Branch Hygiene → main/东京检查；本 **恢复文档 PR 是 docs-only**，不代表新运行时测试/上线。正式 N1 仍只由独立 Owner 证据解锁。
