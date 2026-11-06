# CV-00 现有代码与 Agent/Eidos 契约对账及 CV-01 执行边界（2026-11-06）

> **性质：CV-00 源码与设计对账证据（CODE_AUDIT_COMPLETE；未获 Human 产品签收）。** 本轮只读审查并生成本文；不表示新增 Collection API、Saved View、图表或真实 Agent 旅程已开发。工程下一步是 CV-01 小纵切；本线状态主表仍由[八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)维护。
>
> **精确基线：** EVO-App-Platform `main@d4bebbba88213333b18a516ca21453dd6aa81107`（文档 PR #1162 合入），独立 Eidos `main@a6dc71a3390b5c22c4b4c91581866f8aa540b038`（本次只读核对）；Vendor Eidos 的全局 `sourceCommit=22b487ffc3ddc12b819c9601d6f06c34326fb454`，详见 `vendor/eidos/source.manifest.json`，存在显式 Platform Host overlay。基线不是线上已部署版本。

## 1. 结论：无需另建 Agent / Query / UI 框架

本轮通过固定路径实际读取了以下能力：

| 来源与准确实现入口 | 已有事实 | 实施判断 |
| --- | --- | --- |
| `apps/counterparty/capability-manifest.ts` | 已为“我的客户”“我的供应商”声明 `platform.capability-operation` READ，`PERSONAL_AGENT` exposure；query schema 有 search、sort、direction、page、pageSize | **CV-01 复用已授权 READ 和 ActionHost。** 禁止重复声明语义相同的全新 Agent API |
| `apps/counterparty/projection-query.ts`、`projection-actions.ts` | 解析有界查询；在 owner 读取后应用允许排序/字段读权限、分页；受权读取由原服务负责 | 此 owner 是首个真正 Query 样本，但**当前列表内过滤/切片并不意味着已验证大数据服务端索引性能** |
| `catalog/seed.ts` + `apps/business-dictionary/actions.ts` | `businessDictionaryCapabilityContributionsV010` 中 `dictionary.list`/resolve READ 暴露 HUMAN/PERSONAL_AGENT；保存草稿/发布 WRITE exposure 为 HUMAN；owner handler 再检查 Context/权限 | Dictionary 已可按当前企业授权读取，但现有 list **无标准 search/sort/pageSize/page 合同**；应新增兼容的 owner 只读查询操作/适配，不能修改原 `dictionary.list` 语义使 Agent 老调用失效 |
| `contracts/reference-data/dictionary-operations.ts`、`apps/business-dictionary/repository.ts` | 稳定字典 ID、企业资源内 current/history、Human publish + version conflict | Dictionary 作为第二个异构源；列表查询不能发布字典，发布仍严格 Human |
| `agents/enterprise-agent/capability-fabric-tools.ts` | **内部 Personal Agent** 已有 `evo.capabilities.search`/`describe`/`invoke.read-plan`/**`invoke.write`**；WRITE 创建 AI actor ActionHost 请求，走现有授权与回执 | **修正理解：**“Agent Fabric v0.1 WRITE 不可用”仅指当前**外部 Agent** `manager/agent-capability-fabric.ts` 网关；内部 Personal Agent 确实有受管 WRITE 入口，但新的 View 保存操作尚不存在，不能声称已能保存 |
| `manager/agent-capability-fabric.ts` | External Agent Fabric SupportedEffect = READ/PLAN；token/授权的受限 discover/execute | 绝不扩展其 v0.1 WRITE 来完成内部 Personal Agent 工作；外部 Agent 非本次首批验收 |
| `contracts/foundation-object/schema.ts` | `EffectiveObjectSchema` 字段有 LIST、FILTER、IMPORT、EXPORT、AGENT_READ/WRITE、稳定 ID 和可读性 | Foundation Object 可向最小 Collection 字段契约适配；非 Foundation Object 不被迫继承 Foundation Object |
| `contracts/enterprise-resource.ts` | 企业 Context 内 `get/list/put/archive` 能力已有；**此 v0.1 接口未声明 expectedRevision / compare-and-swap 写入参数** | **共享视图存储需要另核实 versioned authority / CAS；不能只调用 put() 就声称解决并发和 Agent 幂等。** 此为 CV-03 前置设计门槛 |
| `apps/bi-workbench/composition.ts` | 现有个人 Workbench 合成层有 personal preferences，但仅覆盖 Workbench item 可见性/排序 | 不把 Workbench preference 当已经具备 SavedListView 的持久化 CRUD |
| Eidos `src/catalog-browser/contracts.ts`、`render.ts` | 有 `CatalogBrowserV010.table`、search route、pageInfo、column sortRoute 和响应式渲染 | 现有通用能力要复用，但不等于高级 filter builder / saved views / virtual grid |
| Eidos `src/data-grid/model.ts` | 15 行本地 in-memory `executeGrid`、sort/filters/page/selectedIds | 不拿它作为服务端查询安全层；如果需要通用表格渲染，从 Eidos owner 端增量演进 |
| `vendor/eidos/source.manifest.json` | 固定来源 + scoped forward ports/overlays，不能以仓库最新 main 直接覆盖 | Eidos owner 新 PR 先落上游，Platform 以明确 pinned SHA/overlay compatibility 采用；禁止 fork 一套新的 UI |

## 2. 推荐最小技术路径：先复用、再提公共元数据

```text
已有 Counterparty READ Capability Operation
    └→ Agent search/describe/read-plan → Host authorization/ActionHost → owner projection
已有 Dictionary READ Capability Operation
    └→ Agent search/describe/read-plan → Host authorization/ActionHost → owner repository
                ↓
   CV-01 为两种有权只读来源制定最小可兼容 Collection 描述/Query 适配
                ↓
 Eidos 继续消费 owner 授权结果（CV-02），不是由 Platform 为各插件复制查询 UI
                ↓
 CV-03 受管 SavedListView + 内部 Agent 现有 invoke.write + Host receipt
```

**CV-01 禁止跨权威改写：** 保留 `dictionary.list` 不带分页的既有语义与路线；只追加专门 `dictionary.collection.query` 或经 owner 决议的等价 **READ** 操作；不把 `dictionary.publish` exposure 设成 PERSONAL_AGENT。Counterparty 现有两个 READ Operation 的 schema 已是严谨的兼容基线；如需公共视图声明，声明应指向这些现有 operation IDs，不制造第二操作。

## 3. CV-01 首个可合并代码纵切（小而可验收）

1. **只增加公共元数据/受限查询适配，不实现万能后端数据库。** 先盘点 `contracts/package.ts` 的 Contribution 联合类型与 validator；优先考虑能否复用现有 `platform.capability-operation` 的 READ 描述及 `eidos.experience`，确有不可表达的字段才增量版本化扩展；禁止未证实的全新 `eidos.collection` 运行时。
2. **Dictionary 实现与 Counterparty 等价的可分页、可排序、可搜索 READ 业务操作**（若当前 owner 查询尚不支持），由 owner 在企业 Context 下验证权限并裁剪输出；旧 list 继续兼容。
3. **同合同测试对齐**：给 READ 操作结构化 schema、受控 search/sort/page/pageSize，以及公开返回 `rows + pageInfo + schemaRef` 的候选统一语义（字段名称在 implementation PR 内与实际现有 schema 对齐）；两异构 owner 的授权范围、字段与数据边界必须可由同一矩阵验证。
4. **Agent 验收**：Internal Personal Agent `search → describe → invoke.read-plan` 执行当前授权的 Counterparty/Dictionary 读取操作；断言未授权、换企业、Feature 停用时不暴露，不依赖 LLM 是否生成友好文案。
5. **Eidos 验收**：现有 Catalog Browser 能消费两个 owner 的授权只读结果。Eidos 深层 UI、Saved Views/图表的修改仍在 CV-02/03/06；不提前将零新增 UI 说成 Eidos 已发布完整多视图。

**CV-01 正反用例最少包含**：多企业、管理员/成员/只读、AI actor、未安装、停用 Feature、未知字段/运算符、越权查询、无效页大小/排序、分页稳定性、字段裁剪、旧 route/API、空集、重启后的上下文状态。测试须覆盖 Host 真实 ActionHost / Capability Operation；仅手工调用内部 repository 不算集成通过。PR 更新源代码及测试后执行相关插件 CI、Platform CI 与 Lightweight Host；合并前必须检查精确 HEAD。

## 4. 三个明确不应在 CV-01 误判为解决的领域

1. **存储/并发**：`EnterpriseResourceRepositoryV010.put` 不见 expectedRevision；Saved View 的真实可持久化并发控制需 CV-03 明确 owner 再实现。提前只定义 interface 没有并发事实。
2. **大数据性能**：Counterparty 当前可分页只证明有界请求与读权限，不证明 10k/100k records 的数据库级排序索引/游标；CV-07 需有真实存储/基准。
3. **Agent WRITE**：内部个人 Agent 有 Host 受管 WRITE 工具，**不是**所有业务 WRITE 默认开放。Dictionary 现有 WRITE exposure 为 HUMAN；字典发布即使有人类确认也要经 owner 的 `actorType === HUMAN` 检查。Saved View WRITE 要另做新的安全 owner operation，不复用字典发布。

## 5. 当前验收账与下一步

| 证据门槛 | 当前结果 |
| --- | --- |
| 最新 main 与源代码精确 SHA / Eidos 独立 main / vendor Eidos pin | 已核对（见头部）；无生产声明 |
| ≥2 种异构数据 owner 已有授权 READ 入口 | **代码事实 PASS**：Counterparty 受限投影、Dictionary list；查询参数尚不统一 |
| Personal Agent READ/PLAN 与独立 WRITE 权威界限 | **代码事实 PASS**：内部 WRITE 存在，外部 Fabric v0.1 限 READ/PLAN |
| 已有 Eidos 只读表格/模型、升级前向兼容边界 | **代码事实 PASS**；完整 CV-02 交互不存在 |
| 新公共 Collection 代码/双 owner 真实查询协议 | **NOT_STARTED（CV-01）** |
| Saved Views/完整筛选/图表/Agent 真实 Natural Language 旅程 | **NOT_STARTED（CV-02～06）** |
| Host CI、浏览器与 Human 体验签收 | **NOT_TESTED（本轮纯文档审查）** |

**CV-00 的“代码与设计对账”工作已完成，并已有 CV-01 最小实施输入。** 按原计划如需将 CV-00 整步标为 `DEV_COMPLETE`，还需核对真实 Eidos 采用策略、owner PR 的决定与受影响 CI；不以本文件作为用户产品 Human PASS。下一步应在新分支开 CV-01 的首个真实代码纵切，并将实际失败与兼容结论记录到同一个 PR。
