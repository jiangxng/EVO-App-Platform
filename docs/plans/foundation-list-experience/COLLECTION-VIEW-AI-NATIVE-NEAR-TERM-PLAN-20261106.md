# 近期实施计划：Eidos 数据集合/视图复用 × EVO 插件平台 × Personal Agent（2026-11-06）

> **状态：APPROVED_DIRECTION / PARTIAL_IMPLEMENTATION — CV-00 代码对账进入复核、CV-01 两个业务 owner 的首轮 READ 代码与 CI 已合入；CV-02 已开始且 Eidos 上游/Platform 定向采用代码已合入（完整业务页面/真实 Human 尚待）；CV-03 C3-01 受限条件资源写入已由 #1177 合 main + 9/9 CI；正式多主机存储验收与 C3-02～04 仍开放，CV-04～07 仍为 PLANNED。** 本文是“近期可执行的分步工作包”，不是 Feature 已完成或 Human 验收证明。用户确定：**基于现有 Eidos 和 Platform 演进、不建第二框架；个人 Agent 可操作，AI 原生能力是验收的一部分。**
>
> **实施基线：** EVO-App-Platform main `58c49dadda57e7f260c9cc7ebad8bf9a4c0e0e1e`（2026-11-06）；实际开发必须重查 main/Eidos HEAD、最新 owner PR 和权限。前置[架构设计](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)；[研究与资料索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。原[基础对象和列表计划](PLAN.md)、[Business Experience](BUSINESS-EXPERIENCE-FRAMEWORK.md)、[Foundation 六步](FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md)继续各守自己的状态与实施责任。
>
> **进度规则：** 原 2026-11-06 首次版本只交付计划；随后 [PR #1163](https://github.com/jiangxng/EVO-App-Platform/pull/1163) 与 [PR #1165](https://github.com/jiangxng/EVO-App-Platform/pull/1165) 已合 main。代码/CI/合并不等于真实 Agent/浏览器/Human 签收；后续只能由 owner 的 PR、准确 HEAD CI、真实 Host/浏览器/Agent 证据和 Human 验收分别推进状态。新阶段拆分不得覆盖正在开展的 BEX V3、权限、PA05 或 Eidos 主线。

## 1. 一眼可见的分工与前置约束

- **Eidos owner：** 基于已有 `src/catalog-browser/`、`src/data-grid/`、Experience / navigation / responsive / design tokens 扩展通用集合交互。复用现有 renderer，不另起 `ListFramework`，不复制平台私有 CSS。
- **Platform owner：** 使用当前 Plugin Protocol / Capability Operation / Agent Capability Fabric / ActionHost 接入轻量声明、授权发现、上下文与受管视图配置；**不得**向 Core 引入业务 repository 或静态大依赖。
- **领域 owner：** Counterparty 第一适配、Business Dictionary 第二异构适配、Item/Warehouse 第三复用；业务字段、合法筛选排序/聚合、读取/写入规则、归档/发布和版本仍归业务 owner。
- **Data Import owner：** 原 ImportTarget、源文件、预检、Recipe、结果/回执继续使用；集合仅声明导入入口和跳转恢复，禁止重复导入引擎。
- **Personal Agent owner：** 通过授权 `search/describe/invoke`、READ/PLAN 与现有 Host WRITE/Receipt/Run 协作。**外部 Agent Fabric v0.1 不是 WRITE 通道**；内部 Personal Agent 已有单独的受管 `invoke.write` 工具，但不得假设模型拥有保存共享视图、发布或批量业务写入的权限，必须经过对应 owner 的实际 Operation、授权及 Host 回执。
- **验证负责人/CI：** Eidos 独立 UI/键盘/移动测试；Platform 插件协议、轻量宿主、真实业务插件集成；真实 Agent 人机闭环；按需单插件测试与最小平台公共 CI。

## 2. 固定八步近期里程碑

| 步骤 | 计划任务 | 当前 | 必须形成的可验收结果 |
| --- | --- | --- | --- |
| **CV-00** | 现状代码/合同盘点与最小 ADR 定稿 | **IN_REVIEW（源码对账记录已合入；Eidos owner / ADR 签收待补）** | 确认已有与缺失的能力、owner、端到端样例、兼容/回滚 |
| **CV-01** | 受治理的 Collection READ / Schema / Query 契约 | **CODE_MERGED + CI_PASS（Dictionary/Counterparty 两 owner；真实 Agent/Human 待验）** | Counterparty + Dictionary 使用同一受限查询语义；Agent 有权 READ |
| **CV-02** | Eidos 共用表格/列表与查询体验 | **IN_PROGRESS — Eidos #209 + Platform #1167/#1169/#1170 代码合 main；#1172 两业务 Owner 的真实内部 Personal Agent/Host READ 集成 5/5 CI PASS；真实登录/LLM 对话、390px/Human 与焦点恢复待验** | 两真实插件不复制 UI，PC/390px、详情返回和筛选保持 |
| **CV-03** | 系统/个人/企业视图保存与恢复 | **IN_PROGRESS — C3-01 #1177/#1179、C3-02 私有视图 #1180、PG 原子回执 #1182、Host HMAC 准入 #1183 全部已合 main；#1182/#1183 各 10/10 CI 成功、真实 PostgreSQL 18 各 7/7 PASS。** **正式 Host Feature/签发密钥/SQL 物理隔离、PG 生产切换、Eidos UI/LLM/390px Human 均 OPEN**；C3-03/04 未实现 | 已完成隔离级的读/写/授权/同事务收据与签名实证；下一步独立签发服务/数据库登录物理授权、真实 Host/浏览器接入与用户签收 |
| **CV-04** | 导入入口复用、导出与跨视图安全 | **PLANNED** | 真实 Import Job/Recipe/receipt 不退化；导出和 Agent 同权 |
| **CV-05** | Agent 原生自然语言查询/计划/可恢复任务 | **PLANNED** | 完整“查询→预览→保存视图/启动合法操作→核验”回执闭环 |
| **CV-06** | 按需看板与聚合图表（首个受控样例） | **PLANNED** | 一个看板和一个合法聚合图；不从当前页虚构全集指标 |
| **CV-07** | 第三插件复用、负载、安全、CI 与交付认证 | **PLANNED** | Item/Warehouse 至少其一接入，独立开发模板和真实验收矩阵 |

**2026-11-06 实施证据：** [CV-00 重复开发对账](CV00-20261106-COLLECTION-CONTRACT-REUSE-REVIEW.md)、[PR #1163](https://github.com/jiangxng/EVO-App-Platform/pull/1163)（45/45 CI；merge `8ff2932013e25f63382a25606dfacc254a03c3dc`）、[PR #1165](https://github.com/jiangxng/EVO-App-Platform/pull/1165)（45/45 CI；merge `d3076e9dc037bc85f2508aa515d2296cddaa520f`）。已实现轻量 owner READ 和两数据源标准结果，但未取得真实 Agent 查找/调用、浏览器/手机、Eidos owner 签收，不得标 CV-01 全通过。

**不启动平行八条长期 Draft 分支。** 优先连续完成 CV-00～CV-02 的最小可用纵切，再扩展功能；Eidos 和 Platform 变更必须各有 owner PR，按真实依赖做短周期兼容集成。每步验收通过才进入下一项，无法通过时修复当前阶段而非叠加新功能。

**CV-02 第一项可复用代码证据（2026-11-06）：** [Eidos owner #209](https://github.com/jiangxng/eidos/pull/209) 已合并 upstream `127150c30193b57b38d1d9cc62443ddfa90e2349`，给现有 Catalog Browser 增加可选、声明式 `table.views` 与导航安全验证；[Platform #1167](https://github.com/jiangxng/EVO-App-Platform/pull/1167) 在全部 **9/9 相关 CI 通过**后合并 `ef9275cad7f02af786b424801a282733bbe8e746`，按 scoped upstream pin 定向采用并保留 Eidos Host overlay。证据文档：[实际 Platform 采用 UI 设计/缺口](../../ui-design-reviews/cv02-eidos-catalog-view-adoption-20261106.md)。**此证据只证明 Eidos 通用组件可被 Platform 复用，尚未证明 Counterparty/Dictionary 的视图导航由授权数据源驱动，也没有 Saved View、桌面/手机 Human 或真实 Agent 全链路**；CV-02 仍在实施中。

**2026-11-09 CV-02 真实业务接入证据：** [Platform #1169](https://github.com/jiangxng/EVO-App-Platform/pull/1169) 在准确 HEAD 45/45 相关 CI 成功后合入 `main@79d2fe3f1789b20ced440dff031815694961c654`。原 Counterparty 客户/供应商/我的受权投影已提供 Eidos 视图导航，Dictionary 已由原有 Collection Query 驱动表格/三个系统视图；业务 `dictionary.collection.query` 的 allowlisted `view=all|draft|published` 对 Human 与 Personal Agent 受管 READ 共同开放，仍不授权字典发布。详情返回上下文的下一段实现/验证进入本期后续 PR，真实 Agent/桌面/390px/Human 均未签收。参考 [业务列表 UI 证据](../../ui-design-reviews/CV02-REAL-OWNER-LIST-VIEWS-20261109.md) 和 [列表→详情→返回设计与正反测试](../../ui-design-reviews/CV02-COLLECTION-DETAIL-RETURN-20261109.md)。不将此标为 CV-02 HUMAN_PASS。

**2026-11-09 CV-02 第二条工程闭环：** [Platform #1170](https://github.com/jiangxng/EVO-App-Platform/pull/1170) 在最终准确 HEAD **45/45 相关 CI 成功**后合入 `main@33d32d5dbb240974edb2e4eb3ccf2bc73f99d3dc`。原客户/供应商投影与业务字典系统视图可把合法 `search/sort/page/view` 作为限定的 returnTo 传到详情 Eidos Context Navigation，返回原列表仍重新由 Host / Domain owner 授权。禁止其他域路径和恶意 URL；无全局 History/导航框架重建。证据：[CV-02 真实返回 Eidos 设计/风险](../../ui-design-reviews/CV02-COLLECTION-DETAIL-RETURN-20261109.md)、[对应协议测试](../../../tests/protocol/cv02-collection-detail-return.test.mjs)。这不等同“浏览器焦点恢复”或所有真实 Human/Agent 任务已经签收。**接下来的最小用户验收**：两企业实际角色、一个供应商或字典 View → 搜索分页 → 详情 → 返回、390px 浏览器、登录后的 Personal Agent READ 结果对齐；仍记录 CV-02 IN_PROGRESS。

**2026-11-09 CV-02 个人代理集成证据：** [Platform #1172](https://github.com/jiangxng/EVO-App-Platform/pull/1172) 于精确 HEAD 的 **5/5 CI 通过**后合入 `main@03a9f68751e7e25c2a9f62d46b00adadbee8ab77`。新增测试 [cv02-personal-agent-authorized-collection.test.mjs](../../../tests/integration/cv02-personal-agent-authorized-collection.test.mjs) 在隔离的内存 Enterprise Resources 上使用真实内部 Personal Agent `search/describe/invoke.read-plan`、Host Capability 授权和实际 Business Dictionary/Counterparty Repository/ProjectionService：字典已发布视图、我的供应商与 Human ActionRouter 的合法行数/字段逐项一致，跨企业及停用 Feature 后发现/调用失败封闭。**这是无外部大模型的确定性 Host/Agent 工具集成测试，不是真实登录后的自然语言模型 Run，不等于 Human PASS 或真实 390px/浏览器验收。** 详细限制及后续：[个人代理真实工具链测试报告](CV02-PERSONAL-AGENT-AUTHORIZED-READ-RUN-20261109.md)。

## 3. 各步骤实施任务、测试和退出门槛

### CV-00｜现状与契约锁定（最优先，纯对账/最小设计）

**实际工作：**
1. 重新读取 EVO-App-Platform 最新 main：`contracts/foundation-object/{schema,descriptor,import}.ts`、`apps/counterparty/{projection-query,page}.ts`、`apps/business-dictionary/{page,repository}.ts`、`apps/data-import/`、`manager/server.ts` 以及 `docs/architecture/PLATFORM-CAPABILITY-OPERATION-EA2A-v0.1.md`。
2. 在 Eidos 独立仓库重新阅读 `src/catalog-browser/`、`src/data-grid/`、导航和多端规则，明确已有 table、search、分页、行选择与缺少的交互，核对 `vendor/eidos` 采用来源。
3. 针对 Counterparty（投影数据）与 Dictionary（版本化发布数据）画**同一查询与两种 owner**数据流；确认双方当前 READ Operation 有无可调用集合查询能力。若缺失，新增最小 owner READ Operation 并保留旧 API，不让 Host 直接访问内部数据库。
4. 确认企业共享视图和个人偏好能够使用哪一个既有资源 namespace、谁有权新建/更新/删除、版本和数据留存规则；确认现有 Agent 对 READ、PLAN 和 governed WRITE 的真实能力边界。
5. 写小 ADR（可含本架构文档的批准记录）和接口兼容矩阵；文档列出引入公共契约与继续 `CatalogBrowserV010` 的最低必要差别。

**机器验收：** 各代码路径/契约定位与固定 SHA 可复查；报告无新的平行 Eidos 目录/数据库/万能 BaseList；原测试清单与缺口一一对应。**Human 验收：** 团队能够说明首个完整目标（供应商搜索→筛选→打开→返回，Agent 查同一数据）及三个关键业务差异。

**退出证据：** 版本化 ADR、Eidos/Platform 双 owner 承诺、迁移与回滚清单、CV-01 的确定输入输出；未完成不能标为 DEV_COMPLETE。

### CV-01｜Collection 受限查询 + schema + Agent READ 基础

**实际工作：**
1. 在现有 Platform 公开 `Capability Operation` 语义上新增**最小声明/适配**，而非第二套 invocation registry；使用稳定 Collection ID、owner、schemaRef、合法 query 操作与当前 Feature 生命周期。
2. 让 Counterparty 的已有 projection/query 被公开标准请求适配；让 Dictionary 的列表读取也使用同一有界查询形状（保留字典草稿/发布语义）。对 filter/sort/search operator 实施类型/长度/复杂度/页大小白名单。
3. 使用 Host 的 current Principal/Enterprise Context 和 owner field grants 在查询**执行前及结果输出前**复核。分页/计数/游标均基于有权全集，远端数据源需要 cursor 时由 owner 实现。
4. 为 Personal Agent 的现有 search/describe 加入当前**已授权**的 Collection READ 操作描述，验证 Agent 能搜索到、了解并读取当前企业的数据，不暴露私有 repository 或新增任意 REST/MCP SQL 接口。

**机器验收：** 同输入得到确定结果；两个 owner 通过同一契约测试；不同企业、三角色、隐藏字段、禁止排序/过滤字段、无插件、Feature 停用、Context 过期、schema 漂移、未授权 operationId、猜测 ID 均失败封闭；空集合/大量结果/重复键/稳定分页一致。**真实验收：** 人和 Personal Agent 从同一授权条件获得相同记录/计数口径；Agent 无该权限时既不能查询也不能发现。

**退出证据：** Platform owner PR、真实两业务插件 READ 纵切、准确 HEAD CI、非 Mock Host 的至少一条 Agent READ/PLAN 记录；独立记录 Human 结果。

**2026-11-09 CV-02 必跑授权回归补充：** [Platform #1173](https://github.com/jiangxng/EVO-App-Platform/pull/1173) 在最新 HEAD **5/5 相关检查成功**后合并 `870bd80bbe3279e5ebe60ee356f598870ede708b`。新增 [Mandatory Protocol Test](../../../tests/protocol/cv02-real-owner-agent-human-collection.test.mjs)，验证真实 Business Dictionary Repository、Host ActionRouter、Personal Agent 的 search/describe/READ invoke 与 Human 获得相同当前授权行，以及跨企业/撤权/插件停用/READ-WRITE 效果隔离。与 #1172 的字典+往来两 owner 真实集成测试互补；**此用例属于每次 `npm run test:platform` 必跑的 Protocol suite**。不改变真实登录模型与 Human/390px 缺口。

**CV-03 前置代码决策（2026-11-09）：** [Saved View 原子存储与 Agent WRITE 权威门禁](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md)。现有 `EnterpriseResourceRepositoryV010.put()` 无 `expectedRevision`，可选内存事务不证明跨实例原子性；首先补足生产存储后端的比较写/冲突与 readback，随后通过现有 Capability Operation/ActionHost + 内部 Personal Agent `invoke.write` 实现个人私有视图，最后扩展企业共享权限。文档完成不代表 CV-03 工程完成。

**2026-11-09 CV-03 / C3-01 条件存储已合并补充：** [PR #1177](https://github.com/jiangxng/EVO-App-Platform/pull/1177) 在既有 `EnterpriseResourceRepositoryV010` 引入可选 `putIfRevision/archiveIfRevision` 与显式一致性作用域；Memory 仅 `PROCESS_LOCAL`，File 仅 `SAME_FILESYSTEM_LOCK`，以两独立 Node 进程对同一文件 revision 的测试核对唯一成功。归档、冲突、旧无版本记录迁移、重启读回、遗留写锁 fail-closed 都在 [C3-01 工程证据](CV03-C301-RESOURCE-CONDITIONAL-WRITE-IMPLEMENTATION-20261109.md) 中记录。**此代码仍不能证明部署到不同主机/独立本地磁盘时的全局 CAS；不得因此开放正式 Saved View WRITE，C3-02～04 仍未开始。** 最终 PR HEAD `b6328fb3a5c9f5c927d511491f92abec1beec268` 9/9 CI 通过并合并 `1cb6730841e8b3fd8841360c947b71bfc28c84f5`；仍不代表生产认证。

**2026-11-09 C3-01 PostgreSQL 真实后端验证追加：** [#1179](https://github.com/jiangxng/EVO-App-Platform/pull/1179) 在原 Enterprise Resource 契约之外提供**隔离的异步条件写入适配**，沿用项目已经使用的 PostgreSQL 驱动和 PA-02 事务测试模式；显式 `cv03_*` schema，真实 PG18 对两独立 Node 进程同 revision 冲突与丢 ACK 读回进行验证。参见[完整实现证据、JSONB 编码失败与修复、正式 Host 启用门禁](CV03-C301-POSTGRES-ATOMIC-RESOURCE-PROOF-20261109.md)。**本功能未默认接入 Host，不影响旧同步资源仓库；不等于 Saved View WRITE、Railway 部署或 Human 验收。** 合并/CI 状态随 PR 准确 HEAD 核查，不提前关闭生产门禁。

**2026-11-09 C3-02 个人私有视图隔离 Host 纵切（#1180 已合并）：** [#1180](https://github.com/jiangxng/EVO-App-Platform/pull/1180) 在**原 Enterprise Resource Provider、原受管 Capability Operation、原 Business Dictionary Collection READ 与 Personal Agent `invoke.write`** 上新增显式 opt-in 的私有保存配置，依赖共享 PostgreSQL CAS；当前 **不注册生产 Feature**。真实数据库/授权/撤权/两企业两用户回归及生产 durable receipt 尚未接入的边界见 [C3-02 工程证据](CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md)。不得以 CI 的隔离 Host receipt stub 冒充正式已签发持久回执，亦不等于桌面/390px Human 或自然语言签收。最终 HEAD `de94a32397afc196e8f4c07f7349cb1f6a63136e` 9/9 CI、PostgreSQL 18 专项 5/5 PASS，合并提交 `9a181dd64703c74f89590f33383337ad1a966e68`；**C3-03/04 仍未实现**。

**2026-11-09 C3-02 同事务 Agent 回执纵切：** [#1182](https://github.com/jiangxng/EVO-App-Platform/pull/1182) 将原个人视图 WRITE 的测试 Host 前置 `Promise<void>` 桩改为**完整 Host 发行材料 + 同一 PostgreSQL 事务的 Resource CAS 和不可变 AgentActionReceiptV010**；可信事务结果有历史 readback / 同 key 重放 / 冲突拒绝 / 回执失败回滚实证，真实 PostgreSQL 18 专项覆盖两独立 Node 进程。详见 [C3-02 同事务回执实现与边界](CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md)。**真实 Host 的发行 authority 仍未接线；生产 Feature 仍未注册；不能因这一隔离 CI 直接开放 Saved View WRITE 或宣告 Human 成功。** 本阶段只闭合存储层同事务证据，不替代 C3-03/04。

**2026-11-09 C3-02 Host 签发准入追加：** [#1183](https://github.com/jiangxng/EVO-App-Platform/pull/1183) 是在 #1182 已合并的原子回执之上的独立安全收口：只有已授权、仍激活的 Platform WRITE Operation 可由 Host 专用 issuer 签署含完整 inputDigest 的批准材料；PG Owner 未获可信 HMAC verifier key 或 proof 被伪造时不允许写。此处测试使用**明确标记的隔离用密钥**，不部署任何真实 secret。证据及未完成物理 SQL permit、生产 Host+JSONL receipt 相互不原子、Human UI 的限制见 [同事务回执工程记录 §5](CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md) 与 [同 PR UI Review](../../ui-design-reviews/cv03-host-signed-receipt-admission-20261109.md)。**#1183 最终 HEAD `36801d9362f461fe101d6d12610268c8451f2ce3` 10/10 CI SUCCESS 并合并 `91cef31fa6518f328b1480d897afe0ef47339f57`；C3-02 仍非 HUMAN_PASS。**

### CV-02｜Eidos 通用表格与列表

**实际工作：**
1. Eidos owner 对既有 Catalog Browser `table` 和 Data Grid 做增量整合：列标题/顺序/宽度/显隐、受限排序、组合筛选与快速筛选、加载/空状态/无权限/错误恢复、合理密度；不得同时保留两套功能近似的 renderer。
2. Platform 只提交声明/数据输出和轻量挂接，不渲染私有 HTML/复制颜色与控件；Counterparty 和 Dictionary 两个现有页面接入，旧 URL、动作与返回导航保留。
3. 手机 390px 优先紧凑列表、过滤面板与主操作，不把十几列表格按比例缩小；桌面表格保持可见焦点、键盘操作与可复制字段。

**机器验收：** 同样的 Eidos 组件在两个 owner 的页面上运行；端到端筛选不是只过滤本地当前一页；前后端字段裁剪一致；列状态恢复、输入法组词不触发破坏查询、返回/取消/错误保留状态；Eidos 快照/交互/可访问性与 Platform Host 集成 CI。**Human 验收：** 中文桌面与 390px 浏览器逐条执行“入口→搜索筛选→详情→返回→换企业→权限拒绝→恢复”，并对照 V3 功能/布局/颜色三轴。

**退出证据：** Eidos 源仓 owner PR 和 Platform 采用 SHA、实际浏览器证据、无独立插件私有 CSS 的源码检查。

### CV-03｜Saved Views：系统、个人、共享与代理创建

**实际工作：**
1. 定义最小 `SavedListView`：stable viewId、collectionId、schemaRef、ownerPrincipal/enterpriseScope、visibility（SYSTEM/PERSONAL/ENTERPRISE）、filters/sort/columns/presentation、revision、createdBy，使用已有个人/企业受管资源。
2. 建立有权保存/重命名/设默认/切换/删除；企业共享视图需明确管理员授权、冲突与版本前置条件；系统预设视图受插件管理，用户不可更改其定义。
3. Personal Agent 可以**准备/解释视图**；真实保存属于受治理 WRITE，必须由合法 owner action + Host 身份/权限/幂等回执执行，按既有政策必要时 Human 确认。**不得通过 Fabric v0.1 READ/PLAN invoke 偷渡 WRITE。**
4. Schema 变化导致列/筛选失效、换企业与撤权、插件禁用、删除视图都要反馈明确，不得隐藏错误或静默扩权。

**机器验收：** 两企业/三角色 1) 私人视图不能跨用户 2) 共享视图不会扩大数据访问 3) 并发更新有 409 类版本冲突 4) 相同操作重复回执不会创建多个视图 5) Agent WRITE 未授权则拒绝 6) 旧视图能修复而非错映射；重启后仍存在。**Human 验收：** 用户和 Personal Agent 分别创建同条件个人视图、切换再恢复；共享视图授权路径也得到确认。

**退出证据：** Host durable storage readback + Receipt 证据；若当前 Agent WRITE 接口尚未准备好，标记独立 BLOCKED，不允许把仅 PLAN 写成 Agent 已保存。

### CV-04｜导入/导出能力和安全复用

**实际工作：**
1. Collection 的“导入”动作仅在 Data Import 插件已安装、业务 owner 提供合法 Import Target 且当前用户有权时出现；沿用原上传/映射/预检查/确认/回执/Recipe、页面恢复，兼容 BEX V3 的用户体验。
2. “导出”是可选已授权 READ/长期任务，不等于对当前页面 rows 做浏览器保存。owner/Host 再次授权行列、全查询范围、行数/体积/耗时预算；CSV 公式注入安全编码与审计；大型导出异步可恢复。
3. 与 Agent 共用已声明能力：Agent 可以描述、查询导出合法列、PLAN 导入字段映射；导入 Commit 是业务 WRITE，必须通过既有 Human 和目标 owner 的幂等/回执。

**机器验收：** 未装 Data Import 无按钮、未声明 ImportTarget 无按钮、关闭应用后入口消失；已发布版本/Schema 冲突阻止旧预检提交；10,000 行导出使用后端查询且不超出权限；公式开头不被 Spreadsheet 执行为危险公式；断网/重复提交无二次业务写。**Human 验收：** 从往来列表发起导入、处理一个歧义、完成后返回筛选列表，二次导入命中有效 Recipe；普通用户无法越权导出敏感字段。

**退出证据：** 真实源文件/有权对象数/回执/导出只读比对，不以 Mock Success 代替。

### CV-05｜完整 Personal Agent 自然语言工作旅程

**实际工作：**
1. 基于现有 Agent Capability Fabric/Run/Context Assembly/Action Receipt，为“我负责的供应商”“最近待解决的导入失败”“按地区筛选后保存个人视图”等目标提供受管 **natural language → authorized search → schema describe → typed PLAN → Host validate → READ**。
2. 模型可以建议筛选和排序、解释当前数据范围与未知项；不得发 SQL/任意执行代码/未经授权的数据聚合。Agent 可操作合法视图保存及受管导入/导出入口，但只通过可用的 owner operations。
3. 保存长任务的 durable 运行态，网络断开/工具超时/模型切换后利用 Host receipt/readback 恢复，拒绝重复 material WRITE。
4. 防止恶意单元格内容/记录文本改变工具选择或越权请求；禁止向模型默认上传全表或跨企业秘密；EC 可提供候选经验，但无业务事实和自动发布权。

**机器验收：** 20 条带标注的语言任务（中文/英文混合字段、歧义字段、负例、两企业不同权限），至少覆盖正确 schema/过滤、字段未授权、Prompt injection、自然语言跨企业要求、导出超量、模型不存在/超时、禁用插件、恢复与幂等。正确性通过**确定性预期结果比对**，不能以模型文字“已完成”为证据。**Human 验收：** 无需知道 operationId，通过对话完成“搜索→读结果→保存我的视图→切换可视页面→断开恢复”，能够看到权威结果、来源和回执；需要 Human 确认时有清楚下一步。

**退出证据：** 真实 Agent Run ID、Operation ID、receiptId/READ 比对、评测结果与隐私处理记录；不记录敏感原始样本进公共文档。

### CV-06｜受控多视图：Kanban + Chart

**实际工作：**
1. 只选**一个**合法的枚举分组 Collection（如字典 ACTIVE/INACTIVE 或有权限的 Counterparty 分类）验证 Kanban；不实现跨领域看板拖拽状态修改。
2. 由业务 owner 暴露合法 `aggregate READ` 合同（或已有等价合法事实计算），以 schema 与 metricId/单位/作用域/时间/asOf 确定图表语义。Eidos 只画 bar/pie；只有有效能力与已启用可视化 contribution 时显示。
3. 同一 view 查询与图表聚合再授权，统计全集而不是当前页；设小样本隐私/桶数量/资源预算，不暴露隐藏类别或计数。
4. 供 Personal Agent 以 READ/PLAN 描述这张图基于哪些过滤/口径；绝不让模型自己计算财务权威。

**机器验收：** 两企业不同可见行、两种过滤、分页切换后的图表结果稳定；更改/撤销权限图表/tooltip/缓存不残留；停用分析 contribution 后表格仍可用；拖拽无法绕过合法 owner WRITE。**Human 验收：** 列表↔看板↔图表与详情之间保持上下文，移动端可操作，图表有可读文字替代。

**退出证据：** Eidos owner PR、合法服务器聚合结果与可复查对照，Agent 的同口径解释测试。

### CV-07｜跨插件复用、可靠性和开发者准入

**实际工作：**
1. 在 CV-01～06 已有适配器基础上，选 Item 或 Warehouse 作为第三实测插件；证明不加入第三套领域 `if/switch` 和业务私有 renderer。
2. 提供“新增插件如何声明 Collection”的简短教程、最小示例、schema lint 与正反 CI 夹具，更新既有 Plugin Protocol 指向的贡献文档（必要时版本化，不擅自修改权威）。
3. 建立独立 CI 与精确触发边界：Eidos UI owner 测 Eidos，Platform 测公共协议+两个/三个代表性插件；具体插件只测自身领域产品行为。用 `npm run architecture:lightweight` 及模块/资源审计防回退。
4. 对 1k/10k 真实读取样本、未来 100k 选配性能数据测量（机器/数据规模/热冷/网络固定）。记录 p95、UI 可用、内存/RSS、首屏请求、分页、切视图开销和停用资源释放；未实测不承诺性能数值。
5. 对新插件 Feature 禁用、依赖失效、换企业/用户、回滚到旧 Eidos 版本、Schema 升级、反向兼容、已存在视图和导入任务做矩阵测试。

**机器验收：** 第三个 owner 无私有排序/过滤 UI 重复实现；PR 所需 CI 成功、不拉起全部插件测试；未安装时无业务预加载、悬挂订阅与资源扩张；权限/Agent negative cases 全绿。**Human 验收：** 一名不参与框架实现的开发者按教程接入新 Collection；一名业务用户从 desktop/mobile 与 Agent 完成同一任务并逐项签收。

**退出证据：** CI run URL、owner SHA、Eidos/Platform 兼容证明、浏览器/Agent/人验报告；之后才能宣称“通用列表基础能力的首轮验收完成”，不得自动称“整个插件平台生产认证完成”。

## 4. 统一验收矩阵与证据等级

| 维度 | 必测情形 | 必须提供的证据 |
| --- | --- | --- |
| 功能 | 列表、搜索、筛选、排序、分页、查看、返回、保存视图、导入/导出 | 真实 Host 运行的输入/输出与截图或可复现操作记录 |
| 权限 | 两企业；至少管理员/业务/只读三类；字段隐藏、角色变更、插件停用 | 当前 Principal/Context 的正反测试，不暴露秘密值 |
| Agent | 自然语言→授权发现→结构化计划→执行→结果/回执；失败恢复 | 真实 Agent Run / Host Operation / receipt 及 owner READ 核对 |
| AI 安全 | 模型被换、恶意字段文本、未知含义、错币种、无效字段、无权限聚合 | 机器判定拒绝/确认动作，不靠模型自然语言自评 |
| UX | Eidos 模式、功能/布局/颜色、桌面、390px、键盘和读屏、导航往返 | UI owner PR + 真实 Chromium/Host + **独立 Human** 状态 |
| 大数据 | server query / cursor、全集筛选、授权聚合、10k 结果预算 | 固定环境下 repeatable latency、内存、查询范围和负例 |
| 兼容 | 老 URL/Recipe/字典发布、安装持久态、旧 CatalogBrowser、Eidos pin | 回滚和前后兼容记录，没有破坏原数据权威 |
| 轻量插件 | 未安装、禁用、重新启用、依赖缺失、插件贡献失败隔离 | Lightweight Host ratchet + 真实生命周期测试 |

状态用词：`PLANNED` → `IN_PROGRESS` → `CODE_COMPLETE` → `CI_PASS` → `MERGED_MAIN` → `DEPLOYED_PREVIEW` → `HUMAN_PASS`，彼此可以分别记录；不能把前一步自动当下一步。Production 还需正式安全/性能/备份/日志等独立认证。

**执行规则：** 每个阶段形成一个小的可复现“实际需求→最小实现→机器回归→浏览器/Agent验收→准确 HEAD CI→合并与删除已合并过程分支”闭环。既有 owner 正在开发时只提交不冲突的适配 PR，不重复实现；各阶段遇到真权限与安全阻塞必须保留 FAIL-CLOSED。

## 5. 第一条必须看到的业务结果

**人：** 进入供应商视图 → 搜索/快速过滤“香港” → 调整列 → 查看详情 → 返回保持同视图/筛选/焦点 → 将其保存为“香港供应商”个人视图 → 导入有歧义的客户/供应商数据，复用现有映射/确认 → 返回视图并能解释未显示记录的原因。

**Personal Agent：** “找出我负责的香港供应商，按名称排序，把这个筛选保存为我的视图” → Agent 只发现当前有权操作 → 生成可检查结构化 Query → owner READ → 展示范围/计数/来源 → 获准执行已支持的受管视图保存 WRITE，产生 Host 持久回执 → Eidos 里看得到同一视图 → 中断重试不重复保存。若当前 WRITE 未具备，必须明确阻塞而不是假装已操作。

两条路径使用同一 owner 权限/字段语义/保存版本，不在 Human 与 Agent 之间维护两份数据或 API。

## 6. 范围与停止条件

近期不建第二套列表 UI、通用业务数据表、Excel 模拟器、可执行任意 SQL 的自然语言机器人、全量工作流/单据状态机、通用 BI 数仓、任意 iframe/JS 部件或强制大数据导出。看板与图表必须有真实 owner 数据口径；安全、Agent 回执和 Human 可用性从 CV-01 即进入验收而不是最后补测试。

**本计划入 main 只意味着项目批准了方向、保存了近期工作包与参考资料，不意味着 CV-00～CV-07 的任何实现或签收已完成。**
