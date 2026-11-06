# Eidos × Platform 通用数据集合/多视图/AI 原生参考资料索引（2026-11-06）

> **类型：RESEARCH_REFERENCE / VERSIONED_SOURCE_INDEX。** 本文件保存本工作线实际核对的**官方资料 URL、阅读范围、由此得出的设计启示与适用限制**，不是全文转载；查阅日为 2026-11-06。GitHub 仓库基线与历史提案按原作者保留。不可将外部软件的功能直接宣称为 EVO 已实现。
>
> **决策入口：** [架构设计](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md) ｜ [CV-00～07 近期验收计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) ｜ 原 [PLAN](PLAN.md) ｜ 原 [REFERENCES](REFERENCES.md)。

## 1. 一手外部参考：2026-11-06 实际核查的官方文档

说明：以下为公开官方产品及规范站点。引用其在对应文档中明确阐述的机制；实际权限、授权、全部版本功能和 UI 细节由各厂商产品实现及部署条件决定。**没有复制厂商页面、截图或全文。**

| ID / 官方资料 | 核查范围（原文事实） | 设计采用/排除理由 |
| --- | --- | --- |
| **EX01 · Microsoft SharePoint Server 2019：列表视图**：[创建、更改或删除列表/库视图](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | 明确适用于 SharePoint Server 2019、2016 和 Microsoft 365；支持个人/公共视图、选列、过滤、排序、分组与保存；文档提醒不同版本功能会有差别 | 采纳“数据记录与个人/共享视图分离”；不要将 Microsoft 365 的所有新功能归给 SharePoint 2019 |
| **EX02 · SharePoint 2019 性能边界**：[软件边界与限制](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | 官方区分总列表容量与“单次查询处理 >5,000 items”阈值，某些操作/阈值另有条件 | 采纳服务端分页、过滤索引和预算；**不照抄 5,000 为 EVO 的强制行数限制** |
| **EX03 · Odoo 19：视图架构**：[View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | List、Search、Kanban、Graph、Pivot 属模型之上的声明式视图；图表按数据库聚合、看板可以按维度分组；记录了部分视图类型的限制 | 采纳模型与视图分离、可扩展 renderer；禁止默认所有字段支持图表或将卡片拖拽直接当作业务批准 |
| **EX04 · Microsoft Power Apps Grid**：[Power Apps grid control](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 官方 Grid 支持 view/subgrid、只读/编辑、分组、聚合和无限滚动，并说明配置选项和已知限制 | 采纳同一字段与权限契约驱动不同密度/交互；**不把高级 Grid 所有能力作为首轮交付要求** |
| **EX05 · SAP Fiori**：[List Report and Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | List Report 负责过滤/操作对象集合，Object Page 负责查看/编辑/创建单个对象；两者通常组合 | 采用列表→详情→返回的页面家族；Eidos 保留统一导航/响应式实现 |
| **EX06 · 明道云视图**：[视图介绍](https://help.mingdao.com/view/introduction/) | 官方描述视图作为工作表记录的展示过滤器，支持表格、看板、层级、甘特等和自定义插件视图；视图改变不应影响源数据 | 采纳“呈现与数据分离”与“第三方可扩展视图”，但不把任意插件 HTML/JS 注入作为 EVO 默认机制 |
| **EX07 · 明道云应用**：[应用介绍](https://help.mingdao.com/application/introduction/) | 官方区分工作表、视图、角色权限、统计图、工作流等功能模块，同一表数据可有多个视图 | 采纳对象与视图/角色/统计分层；不复制“所有业务对象共用一张表”的产品模型 |
| **EX08 · W3C WAI-ARIA APG**：[Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 明确普通 table 和交互式 grid 的焦点管理不同；交互 grid 必须设计箭头键、Tab、Enter/F2/Escape 等适用行为 | 首期只读表格优先语义 table；真正交互式 grid 另行实施键盘/读屏验收，不能只改 role 属性 |

**来源状态：EX01～EX08 均由本工作线通过公开网页检索结果检查了对应正文/相关章节；不是本地浏览器对所有网页截图逐字审查。** 本轮没有验证第三方产品账号里的所有配置场景，故不作额外功能宣称。外部文档可更新，实施前按产品版本重查原文。旧 2026-10-12 [REFERENCES.md](REFERENCES.md) 的 S01～S08 属**历史查阅证据**，其“仅读摘要/未取得原文”等状态不能被本次查阅回溯性改写。

## 2. EVO 内部历史研究：不可丢失的资产与决策演变

| ID | 原始资料 | 关键决策（按原文） | 本次处理 |
| --- | --- | --- | --- |
| H01 | [基础对象架构](../../architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md) §5–§6、§12、§15、§20 | Object owner 保留语义；EffectiveObjectSchema 对齐 LIST/FILTER/IMPORT/EXPORT；Projection 为只读模型；不要过早抽象，至少第二真实对象验收 | 继续采用，不重造 Foundation Object 模型或 Host “万能对象” |
| H02 | [基础对象体验、导入与工作台](../../architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md) §6、§12–§15 | 一份对象事实、多角色投影、导入优先与 Eidos 列表；内含 SAP/Dynamics/Odoo 等旧研究 | 作为旧研究财富；与本轮新查外部 EX01～EX08 分开记录 |
| H03 | [2026-10-12 列表计划](PLAN.md) §9、§10、§13 | `ListExperienceDefinition`、`ListQueryRequest/Result`、`SavedListView`、嵌入式 BI/Agent 插槽为**候选**，L0～L5 待实施 | 接续原语义；新 CV 计划只是原计划的“近期工作包”，不平行造框架 |
| H04 | [通用业务体验框架](BUSINESS-EXPERIENCE-FRAMEWORK.md) | Eidos 决定公共页面/多端；Host 决定生命周期/授权；插件决定领域状态/动作 | 将 Collection 视为 collection floorplan 的一族，不试图覆盖所有单据/申请 |
| H05 | [2026-10-12 研究来源](REFERENCES.md) | 代码原始路径、外部资料阅读级别与历史未决项 | 保留旧资料，不因为后来有新实现就改历史研究日期 |
| H06 | [Foundation 字典/组织/人员/导入任务](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md)、[六步状态](FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md) | 业务字典、组织人员、模型发布和受管 Import Target 已有独立 owner 与任务 | 不偷换成 CV 的完成；适配真实接口，不重做导入/字典 |
| H07 | [插件平台主线](../../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)、[Plugin Protocol](../../architecture/PLUGIN-PROTOCOL-v0.1.md)、[扩展边界宪章](../../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | Platform 负责发现/治理/公开受管操作；Eidos 负责 Experience；MCP 不是插件协议的替代 | 新 Collection 只增量接入原有 Feature/Contribution/Capability 体系 |
| H08 | [Agent Capability Fabric](../../architecture/AGENT-CAPABILITY-FABRIC-v0.1.md) §3–§12、[Agent WRITE Receipt](../../architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md) | Agent 授权 search/describe/invoke 的 v0.1 只支持 READ/PLAN；Host WRITE 要求 durable receipt；READ 与业务事实同权 | Agent 不能直连私有数据库，也不能把 v0.1 Fabric 当自动写操作通道 |
| H09 | [AI 原生 Agent 状态宪章](../../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) §10–§11 | 模型可替换、Run/Context/Receipt 可恢复、Human 有最终权威、EC 不成为业务数据权威 | 每个 CV 阶段加入 Agent 无模型时可降级与授权/恢复负例 |
| H10 | [插件体验 Human 交付门禁](../platform-governance/../../governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md) | Eidos/V3 作为 UI 权威，功能/布局/颜色、桌面/390px、往返与失败恢复需 Human 证据 | CV-02/03/05/07 必须有真实 UI/Agent 验收，不能只通过文件检查 |

## 3. 本轮核对的源码位置（固定读取日，实施前复查）

**Platform repo：** https://github.com/jiangxng/EVO-App-Platform ，截至 2026-11-06 `58c49dadda57e7f260c9cc7ebad8bf9a4c0e0e1e`。

- `apps/business-dictionary/page.ts`：CatalogBrowser 列表与字典详情，草稿/发布不能由通用列表自动写。
- `apps/business-dictionary/repository.ts`：业务字典在企业资源中保留 `current/history`，Human 发布权威由 owner 验证。
- `apps/counterparty/projection-query.ts`、`page.ts`：有界搜索/排序/分页、权限字段裁剪和表格展示，适合作首个公共 Query 适配。
- `apps/item/page.ts`、`apps/warehouse/page.ts`：基础对象列表和责任关系投影，可做第三插件验证。
- `apps/data-import/`、`contracts/foundation-object/import.ts`：有真实 ImportTarget、mapping、preflight、confirmation、receipt，必须复用。
- `contracts/foundation-object/schema.ts`：`FoundationObjectFieldSurfaceV010` 含 `LIST/FILTER/IMPORT/EXPORT` 等；非 Foundation Object 仍可有最小读取 Schema。
- `docs/plans/foundation-list-experience/`：10 月 12 日提案已经设计共同列表/多端/BI 双路径，不能重复建第二套。
- `docs/architecture/AGENT-CAPABILITY-FABRIC-v0.1.md`：目前的通用 Agent gateway 并没有 READ/PLAN 之外的 WRITE 权威。

**Eidos 独立 repo：** https://github.com/jiangxng/eidos ；`src/catalog-browser/{contracts,render}.ts` 包含 `CatalogBrowserV010.table` 与有限分页/搜索表格，`src/data-grid/model.ts` 存在本地 rows 过滤/排序/分页模型。Platform `vendor/eidos` 必须与独立仓库的 owner 版本明确对齐；不能把 vendor 中的单个能力存在误称为所有多视图已可用。

**阅读级别说明：** 本次已针对上述文件的职责、类型与关键逻辑阅读；没有全量审计全部 Eidos 组件、实际生产查询执行、完整浏览器/可访问性测试或运行环境。代码事实 != 产品/上线/人验结论。

## 4. 参考方案对照与已排除路线

| 方案 | 优点 | 不采用/限制 |
| --- | --- | --- |
| SharePoint 式单一列表/数据存储中心 | 个人/共享视图与列筛选成熟 | **不采用统一业务事实数据库**：与 EVO 业务 owner、EVO Ledger 主权冲突 |
| Odoo 的 model + multiple views | 领域模型与呈现分离、可扩展 | 不复制 Odoo XML/Python 作为新平台协议 |
| Dataverse/Power Apps grid | 列、分组、移动呈现参考 | 不照单全收内联编辑、无限滚动与复杂嵌套表 |
| 明道云工作表/视图/插件视图 | 多形态、可扩展 | 不允许任意 UI 脚本抢占 Eidos 宿主或越权 |
| 巨型 BaseList 继承树 | 初期看似简单 | 扩展各业务状态、存储、认证会耦合，拒绝作为主要抽象 |
| **现有 EVO/Eidos + 公共查询契约 + 视图声明 + 可选插件贡献** | 与当前 Host/Eidos/Agent 既有权威相容；按需加载；可跨插件验证 | **本次采用的近期方向**，C0/C1 先证明兼容并复用真实代码 |

## 5. 后续研究原则

新研究要记录原始 URL、版本、查阅日期、所读章节、是否原文/摘要/代码事实/部署观察，避免把未核查的竞品特性变成 EVO 的硬要求；明确已采用/未采用的理由及替代方案。对外界截图、转载或代码许可证须单独合规复查，不复制第三方代码。若采用第三方 Grid SDK，先核对许可证、包体积、无障碍、API 变更、SSR/多端与轻量加载边界；本工作线尚未选定组件供应商。
