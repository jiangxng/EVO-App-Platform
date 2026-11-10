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
