# CV-03 / C3-02 旧长聊天研究遗产恢复与 GitHub 实证审计（2026-11-10）

> **文档性质：RECOVERED_CONTEXT / SOURCE-GRADED / DOCS_ONLY；不代表新功能验收。**
> 本轮核对时的 Platform `main`：[`14464232bfbe633fbcc2fcaaf5edd692e255db28`](https://github.com/jiangxng/EVO-App-Platform/commit/14464232bfbe633fbcc2fcaaf5edd692e255db28)（#1192 合并）。本页是[七轮最终工程交接](CV03-C302-WINDOW07-FINAL-HANDOFF-20261109.md)的**增量核对清单**，不是新的 CV-00～07 权威里程碑表；最新实施任务仍由原[八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)归口。
> 资料来源分级：**[CHAT]** 本轮用户贴出的旧窗口最后一轮原文及可恢复的历史要求；**[DESIGN]** 仓库旧研究/ADR；**[CODE]** 实际 GitHub merged PR + 主干文件；**[CI]** GitHub 检查结果；**[REAL]** 真实上线、外部 LLM、人体验收。禁止跨级推断。

## A. 来源与可恢复程度

1. **[CHAT，可直接恢复]** 用户本轮粘贴的 2026-11-09 最后一轮自动续跑 #07/07，含正式 Host fail-closed 的边界、#1191/#1192、精确 SHA、N1～N5；旧聊天的更早用户要求由[11-09 恢复入口](CV-20261109-RECOVERY-HANDOFF-ENTRY.md)和 11-06 方案交叉印证。
2. **[DESIGN/研究档案，可直接复用]** [11-06 官方参考 EX01～EX08 / 内部 H01～H10](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[11-09 研究/源码恢复索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)、[架构决策](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)和[恢复交接 #1176](https://github.com/jiangxng/EVO-App-Platform/pull/1176)。
3. **[CODE/CI，本轮 GitHub 直接核验]** 当前 `main` 的提交、#1173/#1184/#1190/#1191/#1192 PR 元数据、[#1191 的源码变更](https://github.com/jiangxng/EVO-App-Platform/pull/1191/files)、`manager/server.ts`、`manager/cv03-personal-saved-view-host-admission.ts`、`tests/protocol/cv03-real-host-save-admission.test.mjs` 和 GH check-runs。
4. **[未恢复]** 当前会话未附完整旧长聊天导出；可查 ChatGPT conversation 文件列表为空，Library 搜索未找到 11-06～09 完整逐字记录。故**无法保证**旧窗口每条曾打开的网址、临时搜索片段、用户截图、模型推理/临时讨论均已恢复。不可把档案所写“查阅”扩张为本窗口重新逐页浏览。

## B. 用户明确要求与确认决定：只保留已证实的结论

| 需求或决定 | 证据类别/依据 | 当前落地含义 |
| --- | --- | --- |
| 客户、供应商、业务字典等很多业务插件是列表型；抽出可继承/组合的公共体验，不再为每类业务重画一遍 | **[CHAT + DESIGN]** 11-06 原需求；[架构决策 §1](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md) | 用受管 Collection/Schema/Query + View Definition + Eidos Renderer + Capability Operation 的组合；避免巨型 `BaseList` 继承树 |
| **在现有 Eidos 和 Platform 上实现，不另起框架**，同时保持 Domain Owner/插件生命周期/轻量 Host | **[CHAT + DESIGN]** 11-06 确认、原八步计划 | Eidos 负责 UI/多端；领域 Owner 负责数据与规则；Host 负责权限/操作/回执；不造万能业务事实库 |
| 表格、搜索/排序/筛选、保存个人/企业视图、详情返回、导入/导出、看板/合法聚合和 BI 插槽按需演进 | **[CHAT + DESIGN]** 11-06 目标、[旧方案](PLAN.md) | 列表与实际受管查询优先；看板/图表/大规模 Grid 编辑后置并须领域聚合语义。**不能把计划当全功能实现** |
| **Human 与 Personal Agent 均可操作**，AI 原生必须经同一有权 Operation；WRITE 有授权、确认、幂等、可恢复 receipt | **[CHAT + DESIGN]** 11-06/11-09 要求、Agent/Host 约束 | Agent 禁止自由 SQL、直写 Provider、跨企业或绕过暂停的 Feature；本地 deterministic 工具成功不等于外部 LLM 成功 |
| 真实体验以 Eidos/V3 功能、布局、颜色/导航为准；PC 与 **390px**、键盘/焦点、详情往返和失败恢复要能被用户验收 | **[CHAT + DESIGN]** [Human 门禁](../../governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md) | Eidos 静态渲染/测试截图不能替代登录后的 Human 签收 |
| **生产默认关闭**；正式 Host 没有认证 PG、Host 签名密钥与 WRITE Feature 之前不得注册 Save Human 页面、不得借 flag 开 WRITE | **[CHAT + CODE]** #1191/#1192、[正式 Host 门禁](../../../manager/cv03-personal-saved-view-host-admission.ts) | 保存指令 403，未注册入口 404，误开 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE` 拒绝启动；独立 HTTP harness 不安装在全局 `/v1/actions` |
| 分窗口独立分支/PR、精准 HEAD 和 CI；及时交接，能验收再合并；不直接 push `main`，不抢其他 owner 文件 | **[CHAT + DESIGN]** 旧窗口治理与 11-09 交接 | 本文仅 docs-only audit；不改权威八步表、不改 Eidos、Provider、Host、Railway 或生产密钥 |

## C. 已研究资料：原网址、结论与未采用原因

以下是 **2026-11-06 已入库的原始官方来源**，本轮逐项从仓库恢复**网址和原有阅读级别**，没有冒称今日重新研读全部网页。

| ID / 官方原文 | 已采纳 | 明确不照搬 |
| --- | --- | --- |
| EX01 [SharePoint Server 2019 列表/库视图](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | 记录与个人/公共视图分离；列、筛选、排序、分组、保存 | 不混淆 SharePoint 2019 与 Microsoft 365 的差异；不复制底层授权/存储 |
| EX02 [SharePoint 2019 软件边界](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | 服务端分页、索引/查询预算 | 不把「5,000」直接移植为 EVO 统一列表上限 |
| EX03 [Odoo 19 View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | 领域模型与 List/Search/Kanban/Graph/Pivot 的多视图声明分离 | 不引入 Odoo XML/Python 为新平台协议 |
| EX04 [Power Apps Grid](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 共用列模型和密度/多端交互 | 首轮不强制完整内联编辑、无限滚动或高级 Grid |
| EX05 [SAP Fiori List Report + Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | 列表→详情→合法上下文返回 | 不另建 Eidos 之外的导航体系 |
| EX06 [明道云视图](https://help.mingdao.com/view/introduction/) | 多种呈现同一受管记录集合，扩展 renderer | 不开放任意 HTML/JS 越过 Eidos/Host 治理 |
| EX07 [明道云应用](https://help.mingdao.com/application/introduction/) | 领域对象、视图、角色、图表、工作流分层 | 不把所有业务实体合并成“万能工作表” |
| EX08 [WAI-ARIA APG Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 只读 table 优先；互动 Grid 另做键盘/读屏 | 仅改变 ARIA role 不能证明无障碍 |

内部研究 **H01～H10** 的源文件、具体章节及采用理由已在[11-06 原始参考索引 §2](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)与[11-09 证据交叉索引 §2](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)逐项保留：基础对象 Owner/Schema、体验与导入、旧列表计划、通用业务工作页、Foundation 六步、Plugin Protocol、Agent Fabric/WRITE receipt、Run/Context 宪章、Human 交付门禁。这些是历史资产，不应重写阅读日期。

**设计弃选集中理由**：巨型 `BaseList` 继承体系、万能业务表、通用 Agent WRITE 绕过受管 Host、把单页数据当全集聚合、任意脚本视图注入以及直接挂载隔离 HTTP handler 均违背 Owner 主权、轻量宿主、安全/权限或真实体验约束。

## D. GitHub 当前代码、PR、验证层级交叉表

| 包/来源 | 本轮证据 | 已证实 | 尚不能宣称 |
| --- | --- | --- | --- |
| CV-01 [#1163](https://github.com/jiangxng/EVO-App-Platform/pull/1163) / [#1165](https://github.com/jiangxng/EVO-App-Platform/pull/1165) | **[CODE]** 已合并（见原索引） | Dictionary 与 Counterparty 两种受管 Collection READ owner | 自由模型对话/人验已通过 |
| CV-02 [Eidos #209](https://github.com/jiangxng/eidos/pull/209)、[#1167](https://github.com/jiangxng/EVO-App-Platform/pull/1167)、[#1169](https://github.com/jiangxng/EVO-App-Platform/pull/1169)、[#1170](https://github.com/jiangxng/EVO-App-Platform/pull/1170) | **[CODE + 历史 CI]** 已归档 PR/返回路由回归 | 现有 Eidos 表格视图、两个真实业务 owner 和合法 search/sort/page/view 的详情返回 | 390px/浏览器 focus 和 Human 签收 |
| CV-02 [#1172](https://github.com/jiangxng/EVO-App-Platform/pull/1172)、[#1173](https://github.com/jiangxng/EVO-App-Platform/pull/1173) | **[CODE]** #1173 本轮 GitHub 确认合并 `870bd80bbe3279e5ebe60ee356f598870ede708b` | 真字典 Repository、Host ActionRouter、内部 Personal Agent 工具一致性及撤权/换企业/停用拒绝的确定性回归 | 外部 LLM 自主行为，真实登录/UI |
| C3-01 [#1177](https://github.com/jiangxng/EVO-App-Platform/pull/1177)、[#1179](https://github.com/jiangxng/EVO-App-Platform/pull/1179) | **[CODE + 已归档隔离测试]** 七轮交接 | 有界条件写入、隔离共享 PG18 冲突/事务证明 | 正式生产两 Host SQL principal/GRANT 审核 |
| C3-02 [#1180](https://github.com/jiangxng/EVO-App-Platform/pull/1180)、[#1182](https://github.com/jiangxng/EVO-App-Platform/pull/1182)、[#1183](https://github.com/jiangxng/EVO-App-Platform/pull/1183) | **[CODE + 已归档隔离测试]** owner、Host HMAC 精确 digest、同 PG 事务 CAS/Receipt | 私有 View 可在隔离环境有权持久化，错误签名拒绝 | 生产 signer/密钥轮换、正式 SQL 最小权限 |
| C3-02 [#1185](https://github.com/jiangxng/EVO-App-Platform/pull/1185)～[#1189](https://github.com/jiangxng/EVO-App-Platform/pull/1189) | **[CODE + 隔离工程测试]** 11-09 七轮交接 | 只读 Eidos Tab、route/columns 回读、未注册 Human UidlForm | 正式可点击保存入口、人体验收 |
| C3-02 [#1190](https://github.com/jiangxng/EVO-App-Platform/pull/1190) | **[CODE]** 本轮直接核 PR merged；**[历史 CI]** 10/10 PG18 记录 | 隔离真实 Node HTTP + Host 签名 + PG18 + Eidos 保存/回读链路 | `manager/server.ts` 正式路由身份/CSRF/生产认证 |
| 正式 Host [#1191](https://github.com/jiangxng/EVO-App-Platform/pull/1191) | **[CODE]** merged `8095f8c0709af58f661d3ed4d0ee1c1f67ed7cea`；**[CI]** GitHub 以 head SHA 查询：51 个 check-runs=46 success+5 skipped、0 failure；旧交接按自身统计称 45/45 | `server.ts` 实际 GET 保存页 404、POST Saved View WRITE 403、非 OFF 启动拒绝；其它动作不受该 guard 劫持；子进程 HTTP 测试在仓 | 这是**否定准入**，非正式存储/WRITE上线 |
| [#1192](https://github.com/jiangxng/EVO-App-Platform/pull/1192) | **[CODE]** merged `14464232bfbe633fbcc2fcaaf5edd692e255db28`；**[CI]** head 10 check-runs=5 success+5 skipped、0 failure（原交接称 4/4） | 七轮最终交接及 README 指针已入 `main` | 仅 docs，不改变生产开关 |
| 并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | **[PR]** 2026-11-10 仍 OPEN，HEAD `af96db1f0473059f412068b03efc978166fda46f`，4 个 check-run success | 此 PR 是较早的 `#1182/#1183` 证据文档对账 | PR 描述仍将 #1185～#1191 看作未来工作；**不能当最新实情，也不应由本恢复窗口抢改其 3 个文件** |

### 本轮核查到的正式 Host 实际边界

- `manager/server.ts` 在启动路径调用 `assertCv03HumanSaveNotEnabledV010`；仅允许 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`（或未设）。`APP_PLATFORM_CV03_PERSONAL_VIEW_PAGE_MODE=OFF|READ_ONLY` 是另外的**只读**视图配置，不能解锁写入。
- 真正 GET `/v1/experience-pages` 对未注册的个人保存页源返回 `CV03_HUMAN_SAVE_PAGE_NOT_ADMITTED` / 404；POST `/v1/actions` 对 `collection.saved-view.personal.save` 在分派前返回 `CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED` / 403。
- 未被上述 exact command 命中的业务动作仍流向既有 ActionRouter。证据：[实现](../../../manager/cv03-personal-saved-view-host-admission.ts)、[真实 Host HTTP 回归](../../../tests/protocol/cv03-real-host-save-admission.test.mjs)。**本恢复轮仅查阅源码及已有 CI，没有重新启动正式 Host/登录浏览器，也没有证明部署状态。**

## E. 当前准确进度（不能让历史计划快照覆盖新证据）

| 里程碑 | 当前最可靠证据层 | 仍未结束的验收 |
| --- | --- | --- |
| CV-00 | 设计/复用审查入库 | Eidos owner/ADR 签收仍未从该恢复资料确认 |
| CV-01 | 两业务 Owner READ 代码/CI | 用户/LLM/必要 Human 认证 |
| CV-02 | 两真实 owner Eidos 多视图、详情返回 + 内部 Agent/Host 确定性回归 | 实际登录、desktop/390px、焦点、自然语言、Human 认证 |
| CV-03 C3-01/C3-02 | **隔离正向工程实现+测试已合；正式 Host 负向门禁已合** | **N1～N4**：物理数据库/密钥、Feature 正式注册、Human 受控入口与真实体验；生产 WRITE 保持 OFF |
| CV-03 C3-03/C3-04 | 仅计划 | 企业共享视图独立授权及真实人机端到端签收 |
| CV-04～CV-07 | 计划/历史通用能力复用素材 | 新功能/更广体验未在本恢复轮做实际验收 |

**注意历史状态漂移：** [11-09 初版恢复入口](CV-20261109-RECOVERY-HANDOFF-ENTRY.md)当时把 C3-01～04 记为未实现；[11-06 八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)也停在 #1183 左右。它们是**形成时快照**，不是对 #1190/#1191 的否认。本轮不直接编辑它们或并行 #1184 的工作范围；后续由计划 owner 整合版本化状态。

## F. 缺失与下一窗口的具体动作（依赖顺序）

**明确未恢复/未认证：** 旧聊天完整原文及临时网页/截图；生产 PostgreSQL 实际服务器/用户/GRANT/migration、Host signer/verifier 密钥实际保管与轮换的审计结果、PA05 Feature 生产安装审批；真实 Cookie/Origin/CSRF；桌面和 390px 人体验收与焦点/读屏；外部 LLM 个人代理 SAVE Run；Railway/Tokyo 的实际上线读回。**缺来源就写 OPEN，不从本地测试外推**。

| 顺序/owner | 下一项独立可验收交付 | 保持关闭的条件 |
| --- | --- | --- |
| **N1 数据库/安全/运维 owner** | 生产级共享 PG 物理主体、SQL 最小 GRANT/Schema/migration、至少两独立 Host CAS/冲突/崩溃恢复，以及由生产 Host 持有的签名与 verifier/轮换、不可伪造/Receipt 同事务证据 | N1 缺任何物理凭据/审批，正式 WRITE 必须继续 403 |
| **N2 Platform/PA05/Feature owner** | 经现有生命周期安装私有 Saved View Feature，按当前 Principal/企业/撤权/停用验证实际 `AppActionRouter`、Host signer、PG Owner，保持其它命令无回归 | 不得将测试 HTTP adapter 套到全局路由或单独用 ON flag 放行 |
| **N3 Dictionary/Eidos/Host 联合 owner** | 正式注册合法 Human UidlForm/保存入口；实际 Cookie/Origin/CSRF、确认/回显、命名、冲突、重放、撤权与读回 | N1/N2 未验之前页面仍 404 |
| **N4 UI/真实 Human owner** | 登录桌面/390px 真实浏览器及键盘/读屏、列表搜索→保存→Tab→详情→返回、换企业/停用/错误恢复；截图/用户签收 | CI/模拟 Eidos DOM 不得标 HUMAN_PASS |
| **N5 Personal Agent / 企业共享 owner** | 外部 LLM `search/describe/invoke` 正规有权 WRITE/receipt/readback，未知 ACK 恢复；C3-03 企业共享 scope 另审授权与可见性 | Agent 不得直写数据库；个人范围不等于共享范围 |

**只做定向补查：** N1 首先向真正拥有生产数据库/密钥/部署职责的 owner 获取物理验收清单与脱敏证据；仅对这些缺失点检查生产部署与权限，不重新开 SharePoint/Odoo 全套调研。若恢复到旧聊天原始导出，再做 **diff式补充** 未入库讨论，不覆盖已确认历史来源。

## G. 并行窗口与本次写入范围

- 本窗口仅维护**这一份增量恢复审计及本目录 README 导航**；绝不编辑 #1184 在改的 `COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`、`CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`、`CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md`。
- 不接管 N1～N5 的代码实施和 owner 验收，不创建平行通用列表框架、密钥、生产数据库、Railway 环境变更；从准确 `main` 开独立 docs 分支，PR/CI 完成后按现有治理处理。
- **未来新窗口优先阅读顺序**：本文 → [七轮最终交接](CV03-C302-WINDOW07-FINAL-HANDOFF-20261109.md) → [原研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) / [11-09 证据索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md) → 正式 `manager/server.ts`、#1191 测试 → 目标 owner 最新 HEAD。旧计划中标过时的历史状态要显式校准，不能盲从。
