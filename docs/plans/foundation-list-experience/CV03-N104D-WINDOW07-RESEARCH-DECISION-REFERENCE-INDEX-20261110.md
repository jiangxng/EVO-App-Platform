# CV-03 / N1-04d — 2026-11-10 七轮窗口研究、决策与来源证据详细索引

> 类型：RESEARCH_DECISION_REFERENCE_INDEX / WINDOW07 / PROVENANCE_AUDIT。配套短入口：[本窗口接续入口](CV03-N104D-WINDOW07-RESEARCH-HANDOFF-ENTRY-20261110.md)。
> 截止 GitHub `main@a83d8594e7994601d5becb2348bd18a0d7575172`（PR #1200 合并后；本资料 PR 的新合并提交需由短入口更新或新窗口先 fetch）。所有本窗口工程、阅读和外部来源均按证据等级标明，不声称真实生产安全验收。

## 0. 阅读范围、真实性标签与留存原则

- **R-正文选读**：本窗口 2026-11-10 直接打开官方原始 URL 并取得可读正文/相关章节；仅能证实所读段落，非网页全文逐字审计，也未操作厂商产品账号。
- **H-历史正文选读**：仓库 [2026-11-06 原研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 记录当日通过公开网页检索检查了官方正文/相关章节；是历史阅读记录，**不是本窗口重新访问成功**。
- **U-本次待验证**：已尝试原链接而未取到可读正文；保留历史索引结论，不把网络错误当产品事实。此状态并不推翻 H。
- **S-仅摘要**：当前新增的 EX01–EX08 **没有仅凭本窗口搜索摘要扩写的新发现**；2026-10-12 [REFERENCES.md](REFERENCES.md) 中以前仅看搜索摘要/未取得原文的 S 系列条目仍按其原有标记处理，不擅自提升阅读等级。
- **G-已读 GitHub 原文件/CI**：本窗口直接读取源文件、PR 或 GitHub Actions 日志；需区分「代码事实 / 真实隔离 PG18 验证 / 正式生产环境验收 / Human 签收」。代码及 PR 可能持续变化，阅读本索引时请先取最新 main。
- 网页阅读日期均为 **2026-11-10**，H 历史阅读日期为 **2026-11-06**。本窗口没有创建网页 PDF、网页截图、厂商产品实操视频或第三方原文完整离线副本；**不能凭空填充附件路径或精确截图位置**。官方章节位置与长期 GitHub URL 作为可重复定位锚点。

## 1. 一手网络资料：原始 URL、阅读层次、事实和 EVO 用途

| ID、标题与原始网址 | 查阅日期与证据等级 | 对应主题与来源事实（不是 EVO 实现承诺） | EVO 取舍、用途及限制（工程判断） |
| --- | --- | --- | --- |
| EX01 · [Microsoft Support: Create, change, or delete a view of a list or library](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | **2026-11-06 H；2026-11-10 R-正文选读**。页面「Applies To」「Create new views」 | 文档标注 SharePoint Server 2019/2016、Microsoft 365、Lists；记录个人/公共视图、列显示、筛选、排序；明确功能随版本不同；页面注明 Gallery view 仅 SharePoint Online | 采用记录与视图配置分离、个人与共享作用域；**不把 M365 专属功能写成 SharePoint 2019 功能**，不引入其存储/权限引擎；链接到 CV-03 Personal Saved View、后续企业共享 C3-03 |
| EX02 · [Microsoft Learn: Software boundaries and limits for SharePoint Servers 2016 and 2019](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | **2026-11-06 H；2026-11-10 R-正文选读**。章节「Boundaries, thresholds, and supported limits」→「Items」「List view threshold」 | 区分静态边界、可配置阈值、经测试支持上限；官方表的 Items 为 30,000,000/list *supported*，list view threshold 为一次数据库操作处理大于 5,000 项的门槛，依场景有例外 | 采用服务端过滤、分页、索引与查询预算；**拒绝将 5,000 当 EVO 固定最大记录数**。该来源不验证 EVO/Postgres 的 SLA、SQL 性能和容量 |
| EX03 · [Odoo 19: View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | **2026-11-06 H；2026-11-10 U-本次访问超时**；本次未取得正文，不标 R | 历史来源记录 List/Search/Kanban/Graph/Pivot 属业务模型上的声明式视图，图表/分组受维度与数据类型约束 | 采用模型与呈现分离、renderer 扩展点；不复制 Odoo XML/Python 或假定所有对象都能生成图表；需按 Odoo 19 版本再次获取原文验证相关约束 |
| EX04 · [Microsoft Learn: Power Apps grid control](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | **2026-11-06 H；2026-11-10 U-本次来源工具不可访问** | 历史来源记录 model-driven app Grid 的受控表格、视图/子网格、分组、汇总、滚动与配置限制 | 参考列元数据和不同密度的桌面交互；不直接复制编辑 Grid SDK、不把无限滚动和高级聚合列为首轮必做；当前工具访问失败不代表官网已删除 |
| EX05 · [SAP Help Portal: List Report and Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | **2026-11-06 H；2026-11-10 U-返回 HTML 壳但零条可读正文** | 历史来源记录 List Report 负责对象集合、过滤和动作，Object Page 负责对象详情，常组合使用 | 采用列表→详情→返回的页面族和统一信息架构；在 **Eidos** 内实现，不另建 SAP UI；此回合没有可验证的 SAP 正文章节截图 |
| EX06 · [明道云帮助中心：视图介绍](https://help.mingdao.com/view/introduction/) | **2026-11-06 H；2026-11-10 R-正文选读**。章节「概述」「视图的基本组成」「10 种视图样式」「视图的显示与隐藏控制」 | 视图描述工作表记录的筛选、排序、字段显示和多种呈现；文档明确删除/修改视图不改变工作表事实，并在本页写明**管理员创建/配置视图及分配可见人** | 采用“视图只是配置不是业务事实”、Eidos 多形态呈现；**不能套用明道云管理员可见性规则到 EVO 个人 Saved View**，需遵循 EVO 自己的 Host 授权；不允未经治理的任意 JS 插槽 |
| EX07 · [明道云帮助中心：应用介绍](https://help.mingdao.com/application/introduction/) | **2026-11-06 H；2026-11-10 R-正文选读**。章节「应用的7个功能模块」之「工作表/视图/用户角色和权限/统计图表/工作流」 | 应用把工作表、视图、角色权限、图表、工作流、页面、门户分为不同层；一表可以建立多个角色/业务筛选视图 | 采用对象→视图→权限→分析的分层与有限可扩展性；不建立一个取代 Foundation Object/Owner 的全能共享业务数据库 |
| EX08 · [W3C WAI-ARIA APG: Grid (Interactive Tabular Data and Layout Containers) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | **2026-11-06 H；2026-11-10 R-正文选读**。章节「About This Pattern」「Data Grids For Presenting Tabular Information」「Keyboard Interaction For Data Grids」 | 交互 grid 是复合焦点控件，箭头/Home/End 等键盘导航需实现；普通 table 的 Tab 语义不同，不能只添加 role=grid | 首轮静态/只读 Eidos table 优先，新增单元格编辑与交互 grid 必须独立实现键盘和屏幕阅读器验收；桌面/390px Human 签收尚未发生 |

**来源事实 vs 自主判断的总边界**：表中“来源事实”只来自可读取的原网页相应段落或 11-06 历史研究正文记录；“EVO 取舍”是项目架构决策，**不等于厂商推荐 EVO 的具体实现**。2026-11-10 当前可重新读原文者 **EX01/02/06/07/08**；EX03/04/05 待重新验证。本窗口没有将搜索结果摘要偷换成原文，也没有将网页所示现代界面自动视为 SharePoint Server 2019 原版 UI。

## 2. 旧研究资产与内部架构来源（H01–H10，保留历史章节位置）

下表是对 [11-06 原索引 §2](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 和 [11-09 历史证据索引 §2](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md) 的**有来源复用**。其中 H01–H10 原始文档 **本窗口没有逐份重新阅读全文**，阅读等级为「H-历史研究正文摘录，当前原文复查待办」，不能标成今天全量阅读。

| ID | 原始文件与章节/位置 | 历史关键结论 / 当下实现位置 |
| --- | --- | --- |
| H01 | [FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md](../../architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md) §5–6、§12、§15、§20 | Domain Owner、EffectiveObjectSchema、只读 Projection 负责业务事实/可授权字段；CV Query/Views 不接管业务写入 |
| H02 | [FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md](../../architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md) §6、§12–15 | 一份业务数据、多场景投影、导入先行；SAP/Dynamics/Odoo 旧研究已经在仓库，不当成本轮新访问 |
| H03 | [PLAN.md](PLAN.md) §9/§10/§13 | ListExperienceDefinition、SavedListView、BI/Agent 槽是 10 月候选；不能以文档有类型名声称全部实现 |
| H04 | [BUSINESS-EXPERIENCE-FRAMEWORK.md](BUSINESS-EXPERIENCE-FRAMEWORK.md) | Eidos 页面/多端；Host 权限/生命周期；插件 Domain Owner 业务状态。列表公共体验不等于整个业务对象模型 |
| H05 | [REFERENCES.md](REFERENCES.md) | 2026-10-12 S01–S08 等旧网源及“原文/摘要/未取得”状态原样保留，本索引未提升原有等级 |
| H06 | [FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md) 和 [六步状态表](FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md) | 字典/组织人员/建模/Import 的各自业务 Owner 不可被 CV 工作线重复实现或重复计入完成 |
| H07 | [PLUGIN-PLATFORM-MAINLINE-v0.1.md](../../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)、[PLUGIN-PROTOCOL-v0.1.md](../../architecture/PLUGIN-PROTOCOL-v0.1.md)、[EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md](../../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | Package/Feature/Contribution/Capability Operation 的治理、按需装载、Host 不承担所有插件业务逻辑 |
| H08 | [AGENT-CAPABILITY-FABRIC-v0.1.md](../../architecture/AGENT-CAPABILITY-FABRIC-v0.1.md) §3–12、[AGENT-ACTION-RECEIPT-P1.5B-v0.1.md](../../architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md) | Fabric 通用层的 READ/PLAN 不等于未认证 Agent WRITE；内部 Host tool invoke.write 必须走合法 Capability/authorization/receipt |
| H09 | [AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md](../../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) §10–11 | Human 权威、Run/Context/Receipt 可恢复、模型替换不应丢业务授权 |
| H10 | [PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md](../../governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md) | V3/Eidos 功能、布局、颜色、390px/桌面、真实往返及失败恢复须有 Human 验收，不可用 CI 替代 |

主要采用文档：[Eidos × Platform 架构决策](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[CV-00～CV-07 唯一计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[11-09 恢复参考索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)、[11-10 长聊天恢复审计](CV03-C302-LONGCHAT-RECOVERY-AUDIT-20261110.md)。这些是**历史设计权威/证据索引**，并非证明运行环境已经具备产品功能。

## 3. 本窗口 GitHub 原始证据（G；2026-11-10 实际读取 / GitHub Actions 执行）

| 工作 / PR（已合并） | 真实工程观察与保留的源位置 | 验收边界 |
| --- | --- | --- |
| 先行恢复 [#1193](https://github.com/jiangxng/EVO-App-Platform/pull/1193)，合并 `e7c3c713fdcbabec3255bbb70013b4c3df93bfa9` | [旧窗口审计](CV03-C302-LONGCHAT-RECOVERY-AUDIT-20261110.md) 保存 EX/H、原 C3-02 Host 工程、生产拒绝状态 | 旧完整聊天正文/未记录网页和截图**没有找回** |
| N1-01 [#1194](https://github.com/jiangxng/EVO-App-Platform/pull/1194)，合并 `2bd7a37e38b1d11f3c8545c71bef401984fb3b22` | [SQL 授权负向审计](CV03-N1-POSTGRES-PHYSICAL-SQL-ADMISSION-NEGATIVE-PROOF-20261110.md)，[只读审计器](../../../tools/cv03-n1-postgres-role-audit.mjs) 与 [负向 PG18 测试](../../../tests/agent-line/cv03-postgres-runtime-role-admission.test.mjs) | **实证风险**：仅在 Node 校验 HMAC，而 runtime SQL 仍获直接 INSERT 权限时可绕开 Host；非生产入侵证据 |
| N1-02 [#1195](https://github.com/jiangxng/EVO-App-Platform/pull/1195)，合并 `228df3d5e13c7681ed236478115516fa45bfdfba` | [DB 强制签名 Gateway](CV03-N102-SIGNED-SQL-GATEWAY-ISOLATED-PROOF-20261110.md)、[SQL builder](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs)；最小权限 + PG 验签 + CAS/回执同事务，原 Host SHA 回读兼容 | 隔离 SQL builder **不会自动执行/安装生产迁移** |
| N1-03 [#1196](https://github.com/jiangxng/EVO-App-Platform/pull/1196)，合并 `30a24bce811b6bc19a77216b406a8a67e8cdc092` | [原 Provider 适配](../../../providers/enterprise-context/resources-postgres.ts) 显式 `SQL_GATEWAY_ISOLATED_V010`，不降级 raw DML；[两 OS Worker / 丢 ACK fixture](../../../tests/fixtures/cv03-n1-gateway-provider-child.mjs) | 未注册正式 Host，旧直接模式仍属历史隔离测试；不等于可上线 |
| N1-04a [#1197](https://github.com/jiangxng/EVO-App-Platform/pull/1197)，合并 `c7b52cf731198a2638f4166ed7f7162918ce0981` | [签名时效、DB Owner 管理的撤权镜像与 FOR SHARE 锁](CV03-N104-SQL-PERMIT-REVOCATION-ISOLATED-GATE-20261110.md)；错误签名/过期/撤权竞态/缺函数不降级 | 5 分钟 permit、30 秒偏差为**试验候选**，不等于产品 SLA |
| N1-04b [#1198](https://github.com/jiangxng/EVO-App-Platform/pull/1198)，合并 `9c5617e01700a067d4acfb8ce28752ad767a21a6` | [租户读隔离与 owner epoch](CV03-N104B-TENANT-SCOPED-SQL-READ-AUTHORITY-EPOCH-20261110.md)、[受控 get/list/receipt 函数](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs)，两独立 SQL 登录相互隔离、事件缺号闭锁 | test `session_user` 一对一账号并非正式 Host 多人连接池 |
| N1-04c [#1199](https://github.com/jiangxng/EVO-App-Platform/pull/1199)，合并 `a9e4d9470a94ef0781891137a3238eff0cfe1f0e` | [隔离签名事件桥](../../../tools/cv03-n104c-isolated-authority-event-bridge.mjs)、[交接](CV03-N104C-AUTHENTICATED-EVENT-LEASE-ISOLATED-HANDOFF-20261110.md)，DB 独立验事件 HMAC、短租约及 Human/Agent 合成写入 | `PA05_OWNER_TEST_ONLY` 非真实 PA05 可信事件源；90 秒仅测试租约 |
| N1-04d [#1200](https://github.com/jiangxng/EVO-App-Platform/pull/1200)，合并 `a83d8594e7994601d5becb2348bd18a0d7575172` | [真实 Manager 决策探测/测试 Outbox](../../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs)、[真实 PG18 回归](../../../tests/agent-line/cv03-n104d-pa05-real-manager-authority.test.mjs)、[完整交接](CV03-N104D-REAL-PA05-MANAGER-OUTBOX-ISOLATED-HANDOFF-20261110.md)；实际 `AppManagerService` 与 `checkCapabilityOperationActionV010`、原 Host Issuer，撤权/切企业/真实 manager.disable、隔离持久 ACK 重放 | **仍非生产原子 outbox**；真实 Policy 是测试 AuthorizationProvider；SQL mirror 未按 actorType 授权，Domain Owner namespace 不兼容 |

**最后的可复查 CI 证据**：[GitHub Actions run 42750611281](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42750611281)，PR #1200 HEAD `92db2a8a9deb0ee46f1e6bbd4065b96eb60f4690`：PostgreSQL 18 **20 tests / 20 pass / 0 fail / 0 skipped**，日志包含 `CV03_N104D_REAL_PA05_MANAGER_AUTHORITY_TO_SIGNED_SQL=PASS`、`CV03_N104D_OUTBOX_LOST_ACK_REPLAY=PASS`、`CV03_N104D_REVOKE_SWITCH_ENTERPRISE_DISABLE_FEATURE=PASS`，并**主动记录** `CV03_N104D_LIVE_PRODUCTION_OUTBOX=NOT_CERTIFIED`。同 HEAD 五项 GitHub checks **5/5 SUCCESS**。动态 Actions 原始日志可能按 GitHub 保留策略失效，因此本文件保存**run ID、HEAD SHA、摘要和 marker**；并未创建独立截图、完整日志附件或不可变离线备份。

## 4. 已选择方案 / 被排除方案（区分“证据事实”和“我们判断”）

| 方案 | 来源事实或工程实证 | EVO 决策、理由和适用限制 |
| --- | --- | --- |
| **采用：Eidos + Platform + Domain Owner 的声明式集合/视图** | EX01/03/06/07 的视图与事实分离思路；H01/H07 的现有 Owner/Feature 边界；CV-01/02/03 代码已在本仓库 | 不另建第二通用列表引擎、不重写字典/导入、不把业务字段权限交给前端筛选；短期使用原 Eidos CatalogBrowser / UidlForm + Collection Query |
| **采用：Host 同一 Capability Operation 供 Human 与 Personal Agent** | 已读 `manager/capability-operation-access.ts`、`manager/cv03-personal-saved-view-host-issuer.ts`、`manager/service.ts`，真实 Manager 可获取生效 Feature 并做当前权限再判断 | 防止 Agent 越权、Feature 停用后继续保存；**目前正向只在隔离环境**，外部 LLM 与真实 Human 未签 |
| **采用：SQL 强制原子写入 + 不降级 + 有界授权** | #1194 证明直接 DML 绕过；#1195–#1200 证明隔离 PG18 物理权限、签名、CAS、幂等、租约和事件 gap 负例 | 生产须独立数据库/安全 Owner 认证，不能凭测试 Builder / CI 创建正式数据库角色、密钥或迁移 |
| **采用：简短入口 + 详细参考索引** | 本仓库 11-06/11-09 既有材料与本窗口 README/专项交接过长、部分历史状态已过时 | 此两文件为增量索引，不替换权威 CV-00～07 计划，也不覆盖 #1184 并行权威文档 |
| **排除：万能 BaseList 类、集中保存所有业务事实** | H01、H04、H07 的 Owner 事实权与字段授权要求，已有 Dictionary/Counterparty/Import 现成模块 | 仅共用 Query/View/Presentation、按能力贡献；复杂单据与审批须保留各 Owner 生命周期 |
| **排除：把 Node-only HMAC + 普通 SQL DML 视为安全** | #1194 可重复隔离物理负例 | 必须由数据库强制受控函数或等价物理策略阻断；缺 Gateway 不准回退 |
| **排除：共享 SQL 登录直接代表每个 Human 或 AI** | #1198 隔离 proof 依赖 `session_user` 与某一主体/企业一对一绑定 | 真连接池需由 Host/DB Owner 设计可信身份传播/RLS 或租户化读接口，不能直接上线 |
| **排除：仅定时/递增 epoch 就声称撤权即时有效** | #1198/1199 的 gap/TTL 实证和未到达事件无法被数据库自行发现的推理 | 正式要求事务级权威 outbox、认证事件、断链 fail-closed、可信全量 snapshot 恢复和合理一致性边界 |
| **暂缓：全功能高级 Grid/看板拖拽、自由 BI/无限滚动** | EX03/04/08、原计划 L0～L5；当前原 Eidos table 与 Human 业务测试的权限/无障碍仍需签收 | 第一批优先可靠只读表格、搜索/筛选/排序/返回，图表与看板按真实业务 schema/可聚合维度分期；键盘 grid 另行审查 |
| **暂缓：CV-03 正式 Feature/UI/WRITE 与企业共享** | `manager/cv03-personal-saved-view-host-admission.ts` 和 [真实 Host 负向测试](../../../tests/protocol/cv03-real-host-save-admission.test.mjs) | N1 生产身份/密钥/迁移/Actor 审查全签收前，正式 SAVE 403、页面 404、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`；共享视图 C3-03 独立授权路径 |

## 5. 冲突 / 缺证据 / 最值得继续验证

1. **最高优先级：真实 Domain Owner 的 namespace 与隔离 SQL POC 不一致（SOURCE+CODE 冲突）**。原 [personal-saved-views.ts](../../../providers/enterprise-context/personal-saved-views.ts) 使用 `evo.saved-view.personal.<sha256(JSON.stringify([enterpriseId,subjectId]))>`，N1-02 SQL Gateway 及 N1-04b scoped read 使用 `evo.saved-view.personal.<subjectId>`。不应通过放宽 namespace 校验解决；N1-04e 需用原 Domain Owner 规范的输入、回执、读取和租户负例作真实互操作。
2. **ActorType 不在数据库授权键（CODE 证据空缺）**。原 Capability Operation 对 Human/Personal Agent 可有不同授权；当前 SQL `cv03_n1_operation_policy(context,subject,operation)` 未存 actorType，历史 receipt 同样必须验证 exact actor；N1-04e 增 actor-scoped epoch、签名绑定、正确 denial，避免 Human allow 自动让 AI 得权。
3. **事件可靠性与生产主权未闭合（部署证据空缺）**。真实 PA05 `onLifecycleEvent` 是本地回调；#1200 的 SQL outbox 属测试用。需持久权威事件源、事务签名/审计/顺序、取消/更换企业、断链和重放、认证 snapshot resync、TTL/密钥轮换方案。约 90 秒租约不等于即刻撤权保证。
4. **真实 SQL 身份/权限与安全 Owner 缺证据**。本窗口 #1194 只读核对过 Railway 名为 EVO Ledger Runtime MVP 的 PG18/服务元数据，**未确认该服务为 EVO-App-Platform Saved View 生产 Primary**；没有生产 runtime Principal/Role GRANT/DDL、Host 连接目标、正式 KMS 与 schema migration/备份恢复的签收。不得将测试 SQL 登录当生产凭据。
5. **EX01/EX06 权限模型差异**。SharePoint 个人/公共 View 可由有权用户创建；本次重新读的明道云 View intro 描述管理员创建配置与控制普通成员可见。两者属不同产品，不是事实矛盾；EVO 应由自身 Personal/Enterprise 授权设计确定谁能创建、读取、分享，不能直接照搬其中一个产品。
6. **EX01 与 EX02 的 SharePoint 版本/阈值误读**。EX01 的现代 Microsoft 365 列表体验和 SharePoint Server 2019 不完全一致；EX02 5,000 是特定数据库查询阈值，不是列表总记录上限。推荐将产品能力和数据库指标分开验证。
7. **EX03/04/05 本次未读原文**。下一轮只有在要落地 Kanban/Graph/高级 Grid/SAP 详情时，再定向重开原 URL 并记录版本/章节；不必为继续 N1-04e 重做竞品调研。
8. **UI、截图、浏览器/LLM 实证仍缺**。本窗口没有新生成的桌面/390px 视觉签收文件或第三方网页截图；可追踪的 UI 历史工程审查位于 `docs/ui-design-reviews/cv03-c302-human-save-as-form-isolated-20261109.md`、`cv03-c302-human-http-isolated-20261109.md`、`cv03-c302-real-host-save-admission-failclosed-20261109.md`。这些是工程审查**不是**实际 Human 验收。未经测试的真实 Cookie/Origin/CSRF、Agent 外部 LLM、企业共享 Saved View 仍不能标 PASS。

## 6. 资料保存位置、重复使用与增量原则

- **权威设计**：[Eidos × Platform 架构](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md) 与 [CV-00～07 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)，此回合无权威修改。
- **历史原文阅读证据**：[2026-11-06 EX01–EX08/H01–H10](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[2026-11-09 恢复索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)、[2026-11-10 旧聊天恢复审计](CV03-C302-LONGCHAT-RECOVERY-AUDIT-20261110.md)；历史链接仍可点击。
- **本轮七轮工程证据**：[N1-01](CV03-N1-POSTGRES-PHYSICAL-SQL-ADMISSION-NEGATIVE-PROOF-20261110.md) → [N1-02](CV03-N102-SIGNED-SQL-GATEWAY-ISOLATED-PROOF-20261110.md) → [N1-03](CV03-N103-EXPLICIT-SQL-GATEWAY-PROVIDER-ISOLATED-HANDOFF-20261110.md) → [N1-04a](CV03-N104-SQL-PERMIT-REVOCATION-ISOLATED-GATE-20261110.md) → [N1-04b](CV03-N104B-TENANT-SCOPED-SQL-READ-AUTHORITY-EPOCH-20261110.md) → [N1-04c](CV03-N104C-AUTHENTICATED-EVENT-LEASE-ISOLATED-HANDOFF-20261110.md) → [N1-04d](CV03-N104D-REAL-PA05-MANAGER-OUTBOX-ISOLATED-HANDOFF-20261110.md)。以上所有内容均在 main，工程证据是随机隔离 PG18 + 原代码，**不能代替生产确认**。
- **可变内容保存程度**：已在此索引保存原始 URL、2026-11-06/11-10 查阅日期、精确章节标题、关键可转述事实、适用条件、失败访问状态及最终 CI run/HEAD/marker；没有保存原始第三方网页 HTML/PDF/截图、不可变 CI 原始日志包或过往完整聊天逐字导出。需要离线原件须另行获得合法授权与实际文件，**不可生成虚假的附件链接**。
- **并行所有权**：#1184 当前仍为 Open；不修改其涉及的 `COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`、`CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`、`CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md`。本研究交接分支为 `docs/cv03-n104d-window07-research-handoff-20261110`，仅两份新入口/索引及同目录 README。


## 6. N1-04e 增量研究/决策登记（2026-11-10，后续窗口提交；不修改历史等级）

- **原始代码证据（G / 本次直接读取仓库）**：[Saved View Domain Owner `address()`](../../../providers/enterprise-context/personal-saved-views.ts)、[隔离 SQL WRITE Gateway](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs)、[隔离 scoped GET/LIST/历史 receipt](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs)、[签名事件桥](../../../tools/cv03-n104c-isolated-authority-event-bridge.mjs) 以及 [N1-04d Manager/outbox adapter](../../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs)。这些代码证明旧实现存在 namespace 与 actorType 协议冲突；**不是**外部生产运行证据。
- **实现取舍（D / 工程判断）**：N1-04e 不改 Domain Owner 地址，改隔离 PostgreSQL 使用 SHA256(JSON.stringify([enterpriseId,subjectId])) 严格复核，同时把 mirror、签名事件和 outbox 按 actorType 独立键控；缺行/签名不合/epoch gap/lease 过期继续 fail-closed。拒绝将任意 namespace 或 Human 授权通配给 AI。
- **本轮独立实现分支**：`fix/cv03-n104e-namespace-actor-sql-20261110`；[具体协议及负面关口](CV03-N104E-DOMAIN-OWNER-ACTOR-SQL-AND-PA05-OUTBOX-PROTOCOL-20261110.md)。原 N1-04d PG18 20/20 是历史事实，**不可用于声称 N1-04e 已 PASS**。此项最终 PR/CI/合并提交在完成后按 exact HEAD 续填。
- **Outbox 研究结论等级 D**：现有 PA05 Lifecycle callback 不与真实授权权威持久事务原子；T0 权威状态+outbox 同事务、T1 验签投递/DB ACK、T2 epoch 连续性+租约失联关闭、T3 可信 snapshot 恢复，是本轮提出的待签收协议设计，**不是已运行生产实现，也没有新访问的外部网页**。
- **仍 OPEN**：生产 Primary Owner 身份、DB session/pool 主体、GRANT/迁移、KMS/轮换、可靠事件事实源与快照、真实多 Host/人类/外部 LLM；正式 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，Save 403、Page 404 不得解除；并行 #1184 的三份 Owner 文件未改。

- **实现 PR / 初版实测（G / 2026-11-10）**：[N1-04e PR #1202](https://github.com/jiangxng/EVO-App-Platform/pull/1202)，独立分支从 `7898c6b5...` 创建；早期 HEAD `fc95e8684854c54c85e66977fac49f9a8a16ef83` 的 [PG18 Actions #42754171632](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42754171632) 确认为 **20 tests / 20 pass / 0 fail / 0 skipped**。随后继续增加了已签名旧 namespace 与跨企业/主体拒绝、AI/Human 双向独立授权 epoch 的 PostgreSQL 断言，早期 PASS **不代替最终 HEAD**；合并前必须再次查完整 GitHub checks。
- **重要新增未决（SOURCE+CODE）**：N1-04b `cv03_n1_read_scope` 使用 SQL `session_user` 键且没有 actorType，N1-04e 新加的 actorType policy 是 WRITE Operation 边界；不能由此把 Human 只读 SQL scope 自动视为已隔离 AI 的可信读授权。生产 READ actor 身份与连接池方案仍待 Owner 签收。


## 7. N1-04f 增量来源、取舍及工程验证（2026-11-10 / 本窗口）

- **实际读取仓库原文 G**：[`manager/store.ts`](../../../manager/store.ts) 的 `createMemoryLifecycleStore` 与 `createFileLifecycleStore`、[`manager/service.ts`](../../../manager/service.ts) 的 `createAppManagerService`、`disable`、`onLifecycleEvent`；[N1-04e scoped READ](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs) 与 [N1-04d 实际 Manager/AuthorizationProvider 测试适配](../../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs)。**来源事实**：当前 Manager 生命周期持久化没有同一个 PostgreSQL 授权 outbox 事务，旧 READ role scope 无 ActorType 维度；**工程判断**：需要额外的可信原子源，不可仅在回调中异步投递授权事件。
- **已选隔离修复 D + PG18 测试**：[#1203](https://github.com/jiangxng/EVO-App-Platform/pull/1203) 在原 scoped READ Gateway 中添加 SQL 登录到 enterprise+subject+ActorType+READ Operation 的逐角色映射，epoch、健康状态、必需短租约；历史 WRITE receipt 必须同 Actor，Human 权限不得默认使 AI 能 GET/LIST/receipt。模拟隔离 SQL login，**不是生产 Host 共用连接池**。
- **已选隔离 T0/T3 D + PG18 测试**：[N1-04f 事务 SQL builder](../../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs) 与 [PG18 T0/T3 测试](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs)，真实 Manager 决策输入隔离 PG test authority state，**同 PG 事务**提交持久 state/outbox；中途强制失败回滚、签名投递、重启丢 ACK、epoch 缺号失败关闭、单 Actor/Operation 完整签名快照恢复。强调真实 PA05 LifecycleStore / AuthorizationProvider **不属于该 SQL T0 事务**，所以仍 `NOT_CERTIFIED`。
- **首次工程证据 G**：PR #1203 早期 HEAD `68cdd024abe653a0c380ea0b69cf60db556874c1` [PG18 Actions 42756918293](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42756918293) **22 tests / 22 pass / 0 fail / 0 skipped**，包含 `CV03_N104F_ACTOR_SCOPED_READ_DENY_GRANT_LEASE=PASS`、`CV03_N104F_T0_ATOMIC_AUTHORITY_OUTBOX_LOST_ACK=PASS`、`CV03_N104F_T3_SIGNED_FULL_SCOPE_SNAPSHOT_GAP_RECOVERY=PASS`、`CV03_N104F_REVOKE_ACTOR_SWITCH_ENTERPRISE_DISABLE=PASS`；**只属于该 HEAD**，不能取代后续 HEAD 的验收。
- **后续优先事项**：真实 PA05 和授权 Provider 的持久源选择（需与 outbox 原子或受签收的跨存储失败关闭协议）、多实例生产 signer + key rotation/KMS、SQL pooled actor identity、snapshot 全 scope watermark/generation/tombstones、正式 SQL Primary/GRANT/迁移/重启回读、真实 Human/外部 LLM；不转向另一套 List 框架。后续完整协议参见 [N1-04f 专项交接](CV03-N104F-ACTOR-READ-TX-OUTBOX-SNAPSHOT-ISOLATED-HANDOFF-20261110.md)。
- **本轮无新外部网页研究**：EX01–08 等原网址及 11-06/11-10 的 H/R/U/S 历史等级不变。不要把这里的 T0/T3 工程推论冒充厂商原文事实；不造网页截图和未保存附件。


## 8. N1-04g 增量：签名授权事件必须来自已提交 Outbox（2026-11-10）

- **G，原始仓库直接阅读**：[`cv03-n104c-isolated-authority-event-bridge.mjs`](../../../tools/cv03-n104c-isolated-authority-event-bridge.mjs)、[`cv03-n104f-isolated-authority-tx-outbox.mjs`](../../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs)、[`cv03-n104f-authority-tx-outbox-recovery.test.mjs`](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs)、`manager/store.ts` 与 `manager/service.ts`。旧 N1-04c HMAC 接收函数没有直接校验签名事件来自已提交测试 outbox；N1-04f JavaScript dispatcher 从 outbox 读取属于调用约定，不能等同 SQL 物理门禁。
- **D，工程结论**：必须在数据库中校验 HMAC、已提交测试 authority row、完整 Actor/Enterprise/Operation/Generation 身份、同 epoch 不可变 outbox event，再调用原 N1-04c；已被新 authority epoch 覆盖的旧事件虽有有效签名，亦不得重新启用或续租旧 ALLOW。必要时当前企业+Actor 权威行与事件应用持有 `FOR SHARE` 锁，和权威更新事务序列化。本轮实现不动既有 PA05/Domain Owner 生产门禁。
- **实现与安全负例**：[N1-04g outbox 来源闸门](../../../tools/cv03-n104g-isolated-outbox-bound-delivery.mjs) 接到原 [N1-04f PG18 测试](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs)；测试角色不能直调原 ingest；无权威行、伪造同 epoch、换 Actor、HMAC 错、旧 ALLOW、签名 key 停用均需失败关闭。详细范围见 [N1-04g 交接](CV03-N104G-OUTBOX-BOUND-SIGNED-AUTHORITY-DELIVERY-ISOLATED-HANDOFF-20261110.md)。
- **证据边界**：N1-04g 的任何最终 PASS 必须引用相应 PR 的 exact HEAD Actions 日志；当前代码仍只在随机 PG18 测试 schema，真实 PA05 LifecycleStore 与 AuthorizationProvider 的跨存储权威原子性未获证实，生产 `N1=NOT_CERTIFIED`、SAVE OFF/403、GET 404 继续锁住。无新 EX 网页研究，无并行 #1184 文档改动。


## 9. N1-04h 增量：多 Host Producer generation fencing 与原子拒绝（2026-11-10）

- **G / 实际读到的代码**：[`cv03-n104f-isolated-authority-tx-outbox.mjs`](../../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs) 仅存单一 `CI_GENERATION_1`（N1-04h 修复前）；[`cv03-n104g-isolated-outbox-bound-delivery.mjs`](../../../tools/cv03-n104g-isolated-outbox-bound-delivery.mjs) 原只能接收该测试 generation；`manager/store.ts` memory/file lifecycle API 和 `manager/service.ts` 生命周期仍不与测试数据库组成同一真实权威事务。**事实**：N1-04g outbox 守卫尚不能证明两个 Host/SQL Producer 的旧代失权与数据库镜像即时失败关闭。
- **D / 本轮设计决定**：不另建生产事件系统。仅在现有 isolated PG18 权威行、outbox、Mirror 之上加 Owner 持久 `source/generation/fenceEpoch/producer SQL login`，用 `session_user` 而非事件 JSON 判定生产者身份，和 T0 共用 `FOR SHARE/UPDATE` SQL 行锁。Owner 使用旧代 expected generation/epoch CAS 切换时，**同一事务**原子拒绝所有已知 scope、取消未过期 Mirror lease、将每个 Actor 的 epoch 增加并插入持久 DENY tombstone。旧 Producer 与旧签名事件不可在新代活动。
- **代码与隔离正反例**：[N1-04h Producer fence SQL](../../../tools/cv03-n104h-isolated-producer-fence.mjs) + [扩展原 N1-04f PG18 回归](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs)，真实 Manager `disable/enable`、不同 SQL 登录、重新连接读取持久 fence、旧 generation 快照拒绝、新 generation ALLOW 仍需 T3 健康快照才可解锁。完整设计和安全条件见 [N1-04h 专项交接](CV03-N104H-PRODUCER-GENERATION-FENCING-ISOLATED-HANDOFF-20261110.md)。
- **未认证**：真实 PA05 LifecycleStore + AuthorizationProvider 事务、持久真实 Producer credential/KMS、生产 pooled SQL 身份、双 Host/离线 Scope generation 水印与 tombstones、完整授权快照仍 `NOT_CERTIFIED`。CI 仅证明试验 schema，不能把 N1-04h 等同生产发布。正式 Saved View SAVE OFF/403、GET 404 不变。
- **来源归类与并行治理**：本轮是仓库 G 原文和设计 D 推论，无新增外部网站的 EX 阅读；不覆盖并行 #1184 的三份文件。PR exact-head PG18 结果和最终 main merge SHA 必须另用 Actions 实证，不能提前标绿。


## 10. N1-04i 增量：真实 PA05 文件状态单次写失败与重启 SQL 镜像差异（2026-11-10）

- **G / 实际读取项目原文**：`manager/store.ts` 的 `createFileLifecycleStore` 四种 save/delete 原先直接修改 Map 再调用同步 `persist`；文件 `writeFileSync` 或 `renameSync` 异常可能使同一进程的活跃生命周期状态与重启读到的旧文件状态不同。`manager/service.ts` 先调用存储删除 Feature，后发布 `onLifecycleEvent`，没有与独立 PostgreSQL outbox 的原子保证。原 `tests/manager/manager.test.mjs` 有正常 reopen 正例、无上述强制 I/O 错误负例。原 N1-04f/04h PostgreSQL 回归的 Manager 也是 `createMemoryLifecycleStore`，不是真实文件重启。
- **工程修复 D / 在现有 PA05 内**：[`manager/store.ts`](../../../manager/store.ts) 改为候选 Map 持久化成功后再替换 live Map，四种 mutation 写失败保持原内存状态；[独立 PA05 文件故障回归](../../../tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs) 强制把 `*.tmp` 设为目录，验证四种写入失败后本进程/磁盘字节/新进程快照一致；成功重试重开亦通过。此为**单次 I/O 故障原子性**，不是 fsync、跨进程锁或 PA05/PG 授权 outbox 的共同事务。
- **真实 PA05 与测试 DB 的差异验证 D/G**：[原 N1-04f/04h PG18 测试](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs) 改为 FileLifecycleStore，真实 Manager `disable` 持久写文件，重新构建 Manager 后原 Capability Operation DENY；DB Mirror 故意保留未过期的 ALLOW，从而实证“**新的 Manager DENY 不等于远端 SQL 已撤权**”。隔离测试**人工**执行已存在 N1-04h Owner generation rotation，将所有已知 Scope 同步 DENY/tombstone，之后需签名 T3 才恢复新权限。不是正式 Host 自动冷启动流程。
- **交接与安全 Owner 阻塞**：[N1-04i 专题文档](CV03-N104I-REAL-PA05-FILE-FAILURE-ATOMICITY-AND-RESTART-FENCE-20261110.md)。正式 PA05 文件/授权 Provider 跨存储一致性、真实 Host startup-fencing 和全 Scope ledger/旧主脑 fencing、持久 Key/DB Primary/GRANT、生产 SQL pooled Actor 身份、跨库 rollback/KMS/完整快照、Human 和外部 LLM 仍 OPEN。生产 N1 `NOT_CERTIFIED`，SAVE OFF/403、未注册 GET 404 不变。
- **来源等级和 CI 归属**：仅 G 项目原文 + D 设计判断，无新 EX01–EX08 网络研究；不动并行 #1184 的三份 Owner 文档。实际测试数字需由最终 PR HEAD PostgreSQL18 Action 日志支持，不能提前按源码写 PASS。


## 11. N1-04j：正式 Host 启动前的 Saved View opt-in Feature 复原隔离（2026-11-10）

- **G / 现场读取的源码**：[`manager/server.ts`](../../../manager/server.ts) 现有 FileLifecycleStore 恢复流程对 PA05 Purchase Attention 已实行 E01I fail-closed，但只对 CV-03 配置 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF` 做环境门禁，尚未检查磁盘上**活跃的**可选 `host-enterprise-context-provider.personal-saved-views` Feature；[`providers/enterprise-context/personal-saved-views.ts`](../../../providers/enterprise-context/personal-saved-views.ts) 定义精确 Feature ID，而正式 [package.ts](../../../providers/enterprise-context/package.ts) 没有注册它；E01I [真实 Node Host 启动回归](../../../tests/agent-line/pa05-e01i-startup-restoration.test.mjs) 提供可复用的隔离子进程验收方法。
- **D / 工程修复**：复用现有 [CV-03 Host Admission](../../../manager/cv03-personal-saved-view-host-admission.ts) 增加不依赖插件执行的纯检查，在正式 `server.ts` 读取恢复的 FileLifecycleStore 后、创建 HTTP listener 前拒绝准确 opt-in Feature ID 的活跃恢复态。仅已安装宿主包、普通默认 Feature 与 `READ_ONLY` 页面模式不因此被拒绝；未认证 WRITE Feature 不可被认为因磁盘还原就得到新授权。拒绝也不静默改写 operator 生命周期文件。
- **实测回归定义**：[N1-04j 真实 Node Host 子进程回归](../../../tests/agent-line/cv03-n104j-real-host-startup-quarantine.test.mjs) 从临时文件启动实际 `dist/manager/server.js`，检验活跃 Feature、恶意 packageId 两类被拒绝，以及仅安装宿主包、Default Feature 两类正常 HTTP 200（容许原 Host 合法 bootstrap 写入、原已保存记录必须保留且未经认证 Feature 不可自动激活）；和纯 Feature ID parity + SAVE_MODE OFF/ON 拒绝对比。置于原 CV-03 PG18 必运行套件，最终 PASS 数字应仅由 PR exact HEAD Actions 确认。
- **安全边界 D**：这是**真实 Host 本地启动拒绝**，不是授权 Provider / SQL mirror 的跨系统一致性；现有 SQL 旧 ALLOW 即使发生 Host 退出仍可能继续活跃，在 Owner 未进行可信 SQL fencing 前生产 N1 继续 `NOT_CERTIFIED`。未安装生产 SQL 密钥/角色、未更改正式 SAVE OFF/403 与 GET 404，未完成真正外部 LLM/人类视觉验收。没有新增厂商网站 EX 阅读，不修改 #1184 三份受管文档。
- 详细说明与交接入口：[N1-04j 真实 Host 启动隔离](CV03-N104J-REAL-HOST-RESTORED-FEATURE-STARTUP-QUARANTINE-20261110.md)。


## 12. N1-04k：实际 PA05 文件协作写者 fencing、防止旧 ALLOW 覆盖（2026-11-10）

- **G / 原始源码实读**：[`manager/store.ts`](../../../manager/store.ts) 在 N1-04i 修复后的 persist 原使用固定 `<state>.tmp`、普通 `writeFileSync(path)`、无协作写锁/版本比对；攻击者/旧进程可预置 `.tmp` symlink 导致目标文件被跟随写入，两个持有较早文件快照的同路径 Manager 可在后续 mutation 中静默覆盖更早进程提交的 Feature 撤权。原 [N1-04i 失败回归](../../../tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs) 覆盖单次写失败/重开但不覆盖两个 Writer 交错。PA05 E01J4J 原 Host lock 面向单独的 Prestartup 维护，不是所有 LifecycleStore mutation 的可靠共享授权事务。
- **D / 落地修改**：保留原现有 FileLifecycleStore JSON/API，在真正生产 `manager/store.ts` 给四种 mutation 增加同路径 `O_EXCL/O_NOFOLLOW` 协作写锁，精确 `dev/inode/raw JSON` 持久版本对比；检测另一 Writer 已改变后，拒绝旧状态覆盖并将原 Manager Store 标记为需要 reopen 的失败关闭态。随机独占 staging tmp 防止旧固定临时路径 symlink 被跟随；POSIX/Linus staging 文件 fsync + rename + parent dir fsync 后才认为单进程状态提交完成。旧锁、异常/后 rename 不确定性不自动清理或默认为成功。
- **验收与可复用来源**：[N1-04k 跨进程与 symlink 回归](../../../tests/agent-line/cv03-n104k-pa05-file-writer-fencing.test.mjs) 验证：A 撤销 B 旧 ALLOW 写入拒绝；真实第二 Node 进程持久撤权、父进程旧写被拒；`<state>.tmp` symlink 不可覆盖受害文件；写锁 symlink 和 authority state symlink 拒绝。原 N1-04i 强制故障改成孤儿写锁，保持原内存/文件/重开一致性。详细理由和操作边界见 [N1-04k 专项交接](CV03-N104K-REAL-PA05-COOPERATING-FILE-WRITER-FENCE-20261110.md)。
- **不属于生产 N1 已认证**：这是受控文件路径的**合作写者本地 fencing**，非强制非协作文件修改、恶意同用户、分布式 NFS/容器、正式 AuthorizationProvider+SQL outbox ACID、真实多 Host DB credential、跨数据库撤权传播/全 Scope snapshot、Human/LLM/生产发布。生产 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE 403、GET 404 / `N1=NOT_CERTIFIED` 保持。无新增 EX 文献阅读，不动并行 #1184 负责的三份文档；CI exact HEAD 另证。
