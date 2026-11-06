# EVO 数据集合与多视图：Eidos × Platform 复用架构决策（2026-11-06）

> **文档类别：IMPLEMENTATION_DESIGN / 已确认方向、待按里程碑实现的设计。** 用户已明确要求：复用现有 Eidos 和 EVO App Platform，不另建一套框架；个人代理须能够操作，符合 AI 原生产品原则。本文件不是已发布的 Plugin Protocol，也不表示新增能力已在代码中完成。
>
> **基准：** EVO-App-Platform main `58c49dadda57e7f260c9cc7ebad8bf9a4c0e0e1e`（2026-11-06）。Eidos 以各项实施时的最新独立仓库 main / 对应 owner PR 为准；不直接在 Platform 建第二份 Eidos 核心实现。**当前状态：DESIGN_APPROVED / IMPLEMENTATION_NOT_STARTED**，执行进度权威由本工作线的[近期计划](../plans/foundation-list-experience/COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)按真实证据更新。
>
> **研究与出处：** [参考资料与已查代码索引](../plans/foundation-list-experience/COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。保留此前[列表与基础对象计划](../plans/foundation-list-experience/PLAN.md)和[跨业务应用体验提案](../plans/foundation-list-experience/BUSINESS-EXPERIENCE-FRAMEWORK.md)的历史、约束与内容；本文件仅针对集合/视图具体化，并不将旧计划标成已验收。

## 1. 决策、动机与禁止项

**决定：在已有 Eidos 表格/列表、Catalog Browser、Data Grid、页面模式基础上，演进“同一业务集合的多视图体验”；在现有 Platform Package/Feature/Contribution/Capability Operation/ActionHost 基础上接入插件；领域 owner 继续实现受授权的读取与确定性业务操作。**

本次不是新产品框架，也不是统一业务数据库。禁止：
- 新建平行的“EVO List Framework”、私有 UI Shell/表格视觉系统或每个插件自己的筛选、列表、看板组件；
- 由 BaseList 巨型继承类控制所有业务规则、存储和生命周期；实现可使用接口、组合、轻量助手，但不可强迫深继承；
- 把 Counterparty/Dictionary/Import 的私有 repository 拿到 Host 通用模块直接调用；Host 仅经声明式贡献及受管公开操作分派；
- 在 Eidos 中运行 SQL/业务状态转移/权限决策，或让图表的数学聚合制造财务权威；Eidos 只呈现经 owner 计算和裁剪的输出；
- 插件未安装/停用仍提前导入页面、查询实现、导出或分析代码；新能力不得扩大 [轻量宿主基线](../../tools/lightweight-host-baseline.json)；
- 通过“Agent 是内部工具”绕过用户权限、字段裁剪、审批、Host 回执或插件停用。

**复用优先序：** 已存在的插件公开能力与业务 Schema → Platform Capability Operation / 当前授权上下文 → Eidos 既有 List/Collection 页面模型与响应式渲染 → 经过第二个真实异构业务 owner 验证后，才增量提炼缺失公共接口。新类型只作为兼容的契约扩展，实际名称/版本由 owner 的 PR 决定。

## 2. 当前实现证据及缺口（不是产品通过认证）

| 已有资产 | 代码位置 / 当前边界 | 本轮行为 |
| --- | --- | --- |
| Eidos Catalog Browser | `jiangxng/eidos/src/catalog-browser/{contracts,render}.ts`；Platform `vendor/eidos/src/catalog-browser/` | 已有卡片、列表、有限 table/服务端查询路由与分页呈现；扩展，不复制 |
| Eidos Data Grid | `jiangxng/eidos/src/data-grid/model.ts` | 有内存行过滤、排序、分页和选择状态；不能冒充服务端全集查询或完整可编辑数据表 |
| 基础对象字段语义 | `contracts/foundation-object/schema.ts` | `LIST/FILTER/IMPORT/EXPORT`、稳定字段、版本及可读性；优先复用 |
| Counterparty | `apps/counterparty/{projection-query,page}.ts` | 已有受限搜索/排序/分页、可读字段裁剪、投影视图；第一真实适配 |
| Business Dictionary | `apps/business-dictionary/{page,repository}.ts` | 字典列表/草稿/版本/发布；第二种不同 owner 的读模型；不能让通用表格发布字典 |
| Item/Warehouse | `apps/{item,warehouse}/page.ts` | 有管理列表、职责投影和详情；复用验证，不创建平行对象仓库 |
| Data Import | `apps/data-import/` 与 `contracts/foundation-object/import.ts` | 既有 CSV/XLSX、ImportTarget、预检、人工确认、Recipe、回执；只把入口/结果纳入集合体验 |
| Agent Fabric | `docs/architecture/AGENT-CAPABILITY-FABRIC-v0.1.md` | search/describe/invoke 对已授权 READ/PLAN；通用 Fabric v0.1 **不支持 WRITE** |
| Agent WRITE | `docs/architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md` | 复用 Host 管理的批准、幂等和持久回执，绝不另外造 Agent 更新通道 |

当前 Eidos 的 `catalog-browser.layout = grid` 通常为卡片网格，不等于高密度可编辑数据表。通用集合查询和持久化的 Saved View 不应因为上述类型已存在就被标记为已完成。

## 3. 概念边界：Collection、View、Projection、Operation

- **Collection Source（集合数据源）**：领域插件发布的受管读取能力和字段描述。它是可查询的**业务读模型**，不是数据库表；领域 owner 保留事实、索引策略、业务状态和行级权限。
- **Collection Schema（数据集合字段可见性）**：数据源公开的稳定 fieldId、显示与搜索语义、类型、筛选/排序/分组可用性、可聚合性、可读性、Schema 版本。Foundation Object 通过 EffectiveObjectSchema 适配；非 Foundation Object 不需继承此对象模型。
- **Projection（领域投影）**：owner 定义的“客户/供应商/我的供应商/待处理导入”等语义筛选和数据集。不能把“我的供应商”复制成第二张供应商事实表。
- **View Definition（视图配置）**：作用于有权集合上的 columns/filter/sort/group/presentation/pageDensity；无数据主权。系统预设、企业共享、个人私有分作用域、版本与 owner；删除视图不删除记录。
- **Renderer（可视化/交互呈现）**：由 Eidos 拥有；列表、表格、以后按需增加看板与图表。切换呈现不自动改变业务权限或数据范围。
- **Capability Operation（受管操作）**：由业务插件在当前 Plugin Protocol 上声明稳定 READ/PLAN/WRITE、范围、权限、schema、执行和回执规则。Agent 与 Human 走同一个 owner/Host 授权入口。

**来源集合、可见视图、传入的 route/query 参数均不是授权依据。** 服务端根据当前 Principal、Enterprise Context、Feature 激活状态、作用域和 field grants，每次重新计算可见字段及数据行。

## 4. 归属与技术接入

| 责任 | 唯一 owner | 禁止跨越 |
| --- | --- | --- |
| 声明接纳、Package/Feature 生命周期、贡献发现、授权操作分派、审计 | **EVO App Platform** | Host 不保管通用“万能业务表”、不直接调用业务私有仓库 |
| 通用表格、列表、视图切换、过滤控件、多端、键盘无障碍、受控图表渲染 | **Eidos 独立仓库** | Platform 不长期维护 Eidos 分叉，插件不私绘工具栏 |
| 领域字段、查询执行、过滤排序白名单、稳定身份、状态、行级权限、读模型和写入规则 | **业务 Application/Provider 插件** | Eidos/Agent 不能以“看见字段”为由进行操作 |
| 数据导入映射、preflight、Recipe、dry-run、commit/receipt | **现有 Data Import + 目标 owner** | 不重做第二套 CSV/XLSX 处理和导入业务算法 |
| 用户视图偏好、共享视图定义、版本校验 | **使用 Platform/企业与个人 Context 已有受管资源能力；具体资源 owner 在 C0 锁定** | 不把用户隐私或权限静态快照藏在 URL/前端 |
| 高级 BI、图表指标语义与可选分析插件 | **分析/事实 owner + Eidos 可视化** | 图表展示不等于财务解释；不能按当前前端一页伪造全集 |
| Personal Agent 的规划、任务继续与结果回执 | **Personal Agent + Host Agent Fabric / ActionHost** | LLM 不提交原始 SQL、不凭语言建议决定访问权限 |
| 经验模式/建议的学习材料 | **Experience Compiler（可选）** | EC 的建议不拥有业务事实或审批权 |

跨仓库实施顺序：先在 Platform owner PR 固定可接受的最小合同、Eidos owner PR 实现真正缺失的通用 UI；由 Platform 采用固定、可溯源 Eidos 版本，附双方兼容验收。禁止 Platform 先写一套 private renderer 再说以后上游迁移。

## 5. 计划中的最小公共合同（示意，不是现存 API）

下列名称和字段是设计提案，必须先完成 C0 盘点和 C1 契约审查，再由相关 owner 按版本实施。

```ts
type CollectionDescriptorCandidate = {
  collectionId: string;
  ownerPackageId: string;
  schemaRef: string;
  queryOperationId: string; // already-authorized READ Capability Operation
  allowedPresentations: Array<"table" | "list" | "kanban" | "chart">;
  views: Array<{ viewId: string; title: string; presentation: string }>;
  optionalOperations?: {
    importTargetCapability?: string;
    exportOperationId?: string;
    aggregateOperationId?: string;
  };
};

type CollectionQueryCandidate = {
  collectionId: string;
  schemaRef: string;
  filters?: Array<{ fieldId: string; op: string; value: unknown }>;
  sort?: Array<{ fieldId: string; direction: "asc" | "desc" }>;
  requestedFields?: string[];
  cursor?: string;
  pageSize: number; // server-enforced max
};

type CollectionResultCandidate = {
  rows: Array<{ rowId: string; values: Record<string, unknown> }>;
  nextCursor?: string;
  total?: { value: number; kind: "EXACT" | "ESTIMATED" | "UNKNOWN" };
  schemaRef: string;
  asOf?: string;
};
```

要求：受限 operator 白名单、字段类型校验、稳定排序、页大小和查询时间预算、跨 Context 失效的游标。**不开放任意 SQL/表达式/正则执行**；不把 URL 中的 filter 当授权策略。安全字段在 owner/Host 输出前裁剪，导出/图表/Agent 也遵守同一读策略。共享视图与用户视图保存稳定 fieldId、schemaRef、owner、scope、revision；模型变更时显式报失效/修复建议。

## 6. Human × Personal Agent：同一集合，两种操作入口

### 6.1 Agent-native 的定义

AI 原生不是“在列表右上角加一个 AI 按钮”。一个自然语言任务必须能通过**可发现、可描述、受管的语义操作**完成，且脱离 LLM 时人仍能完整操作。核心闭环：

```text
Human：“列出我负责的香港供应商，按名称排序，保存为我的视图”
  → Personal Agent 使用当前 Principal/Enterprise Context
  → 授权 Capability search/describe（不向模型暴露未授权目录）
  → 根据 Schema 生成结构化查询候选（PLAN），显示范围/字段/预期结果
  → Host + Counterparty owner 校验并 READ 当前有权数据
  → 展示筛选结果 + 来源、数量口径、asOf/有权范围
  → 保存视图属于持久 WRITE：走现有 WRITE 授权、需要时 Human 确认、
    幂等及 Host Action Receipt；未知结果先只读核验，不自动重试
  → Eidos 显示同一个视图；返回/切企业/撤权/停用均有效
```

**既有 Fabric v0.1 `evo.capabilities.invoke` 只覆盖 READ/PLAN。** 本计划不偷偷让它接受 WRITE。保存共享视图、批量变更、发布字典、导入提交或业务动作，应使用符合既有 Host Agent WRITE 治理的正式 owner 操作；若当前 Personal Agent 尚不能调用某类有效 WRITE，保持可见的“需 Human 执行/暂不可用”，在专属里程碑补合同，不伪报成功。

### 6.2 AI 原生能力分级（逐项可独立验收）

1. **READ：** 自然语言选择当前有权 Collection、过滤、排序、字段、分页；引用 schema/capability，服务端执行并返回精确/估计/未知计数，禁止模型只看当前一页就推断全集。
2. **PLAN：** 将“找出超过阈值的记录”“比较两个合法视图”转为可预览的结构化 Query/合法聚合候选；拒绝模糊时间、金额口径、未授权字段或未知数据范围。
3. **WRITE（治理）：** 保存私人视图、修改共享视图、导出任务、受管导入等仅通过声明的 owner 操作与原授权/确认/回执；模型不凭对话权威覆盖已发布定义。
4. **Task/Recovery：** 路由离开、模型更换、超时、会话中断后，从 Host 持久 Task/Run/Receipt 恢复；重新校验 context/schema/权限，避免二次业务写入。
5. **Evidence/EC：** 可记录用户确认的有效筛选/映射建议及 provenance 到已有受治理任务/EC 材料，但默认不把聊天内容变成企业规则、共享视图或学习样本。

### 6.3 安全与质量硬边界

- Prompt injection：数据记录的文本、导入文件单元格与第三方字段说明均为**不可信内容**，不得改变 Agent 指令、权限或 owner 操作；
- 最小上下文：Agent 使用经裁剪的结构化 schema、授权行和当前 Task，而不是上传整个企业表格至模型；
- 版本与撤权：保存视图、导出、图表聚合和 Agent 每一步重新验证企业/Principal/字段作用域；停用插件后能力自动从有效目录消失；
- WRITE 结果：Host receipt 是执行证据而非领域业务事实；读回验证由 owner 提供；未确定结果不自动重发；
- NL→Filter：模型只提出 AST/JSON 意图，确定性编译器进行字段/运算符/范围白名单验证；不接受自由 SQL、脚本与危险正则；
- 导出：只能导出服务端当前授权集合的指定允许列；考虑 formula injection、批量上限、可取消和审计；对敏感字段/小样本图表设定披露政策；
- 结果证明：Agent 必须能够解释“来源集合/当前视图/合法筛选/总数口径/数据时间”，不能编造不存在的聚合与业务口径。

## 7. 视图种类、限制和按需装载

| 呈现 | 首批策略 | 受管数据要求 |
| --- | --- | --- |
| Table / Compact List | **优先**；复用 Eidos Catalog Browser/Data Grid；服务端全集搜索/分页/排序 | 稳定 rowId，列安全裁剪、手机紧凑卡片、键盘与无障碍 |
| Saved View | **优先**；系统预设、个人私有、企业共享（共享需明确管理权限） | 按 scope 存储，schema revision 变更后显式修复 |
| Kanban | **后续按需扩展**；仅当字段类型允许分组 | 拖动不是直接修改字段；只能通过 owner 声明的合法 WRITE |
| Chart（bar/pie/line） | **后续按需扩展**；必须有领域合法 Aggregate READ | 服务端授权聚合、metric/单位/时间/asOf 和隐私阈值；不能按当前页统计 |
| Calendar/Tree/Gantt | 非首轮；真实日期、层级、工作调度语义成熟后再上 | 不因“都可列表化”就允许任意转化 |
| Embedded BI/Agent assist | 现有提案的受控 `relatedLinks/summary/assist` 插槽，逐项验证 | 可选按需；未安装不留空壳；扩展失败不阻塞基础列表 |

数据导入不是列表基类方法，而是由已安装 Data Import + 有效 `ImportTarget` 决定的可选动作。导入历史是 Collection 的一个**可读呈现**，导入预检查/提交则仍由原任务引擎处理。

## 8. 迁移与回滚原则

- 不直接全量迁移多个现有插件的页面/URL；优先为 Counterparty 加**兼容适配**，第二个用 Dictionary 验证领域差异，再验证 Item/Warehouse；
- 保留历史 `catalog-browser` 旧模型与路由，至少一个兼容窗口；新协议不可静默重解释旧保存查询、权限或数据；
- 老数据/导入 Recipe/Dictionary 版本不迁移到一个“集合表”；只增加读取视图配置，独立命名空间；
- 无 Agent、无图表插件、离线模型 Provider 的人仍能正常搜索、筛选、查看和导入；关闭可选贡献不能破坏主列表；
- Eidos 变更和 Platform 适配分别使用独立 owner PR，经合规测试后固定版本和回滚；新能力按 Feature 激活/兼容逐步迁移。

## 9. 实施门禁

每批必须具有：准确源代码基线、owner 映射、合同版本与边界、正反测试、真实页面或真实 Agent 完整任务、桌面/390px、权限/换企业/停用/恢复、性能/资源证据、PR/CI 合并结果和**独立 Human 验收状态**。不以 Mock、CI 或仅文档证明产品完成。测试按 Eidos 与 Platform owner 运行，不把全部新插件 CI 绑定在单一核心工作流。

具体工作分片、逐步 acceptance、依赖与退出门槛见[近期工作计划](../plans/foundation-list-experience/COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。该计划是**新增近期任务**，不改写历史 Foundation 六步、PA05、BEX 或 Eidos owner 状态。
