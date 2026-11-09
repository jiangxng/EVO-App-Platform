# CV-03 Saved Views：沿用 Platform 权威的版本/作用域/Agent WRITE 实施决策（2026-11-09）

> **状态：CODE_BOUNDARY_REVIEWED / IMPLEMENTATION_GATE_OPEN。** 本文件是 CV-03 开发前的真实代码对账与实施门禁，不是 Saved Views 已发布或 Human/Agent 已保存成功。**不另建数据列表框架，继续以 Eidos 负责呈现、Platform 负责授权和配置资源、领域插件负责 Collection READ / 业务规则。**
>
> 代码审查基线：EVO-App-Platform `main@870bd80bbe3279e5ebe60ee356f598870ede708b`（CV-02 授权回归 #1173 已合并）。研究背景：[集合/多视图设计](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[原始参考索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。

## 1. 已核实的真实代码事实

| 原权威资产 | 当前契约 / 行为 | 对 CV-03 的影响 |
| --- | --- | --- |
| [Enterprise Resource Repository](../../../contracts/enterprise-resource.ts) | `EnterpriseResourceRepositoryV010` 有 `get/list/put/archive` 和可选 `transaction`，但 **没有 expectedRevision、compare-and-swap / conditional write 的公开契约**；Resource 本身没有全局可比较 `revision` 字段 | 普通 `put()` 是无条件写，不可作为 Shared Saved View 并发编辑、幂等提交、断线恢复的完整保证 |
| [Memory/File 资源 Provider](../../../providers/enterprise-context/resources.ts) | `transaction` 基于单 Repository 实例的同步快照；文件后端写入通过快照文件更新；源码未体现跨进程/跨实例排它 CAS 与多 worker 协议 | **单实例内事务不等于多实例原子比较写**；不得靠本地 `get→put` 两行代码伪造乐观锁 |
| [Enterprise Business Definition](../../../contracts/enterprise-business-definition.ts) | 有 `expectedRevision` / immutable revision 历史与显式冲突错误，但用于企业正式业务定义草稿/发布，不是用户视图偏好存储 | 可参照版本冲突和保留历史的语义，**不把个人视图存入业务定义 repository**；同样不能从其 API 形状推断跨 worker 原子性 |
| [Host Capability Operation](../../../contracts/package.ts) / [授权执行](../../../manager/capability-operation-access.ts) | 已有 `READ/PLAN/WRITE`、Feature 安装/停用、Principal/Scope、声明式 ActionHost 和写入回执门禁 | Saved View 正式 READ/WRITE 必须是现有受管 Operation，不能新建私有 Agent HTTP 接口 |
| [Personal Agent Host Tools](../../../agents/enterprise-agent/capability-fabric-tools.ts) | 内部 Personal Agent 提供 `evo.capabilities.search/describe/invoke.read-plan/invoke.write`，调用时 `actorType=AI`，Host 重新授权 | **可复用当前 Agent WRITE 通道**；尚无 SavedView owner operation，不能声称 Agent 已经会保存视图 |
| [CV-01/02 Collection](../../../contracts/data-collection/query.ts) / [Eidos view navigation](../../../vendor/eidos/src/catalog-browser/contracts.ts) | 已有有权 Collection READ、`schemaRef`、稳定 rowId、系统视图导航和受管详情返回 | Saved View 仅是**某个已授权 Collection 的可恢复配置引用**，不拥有业务记录、范围、SQL 或 Eidos renderer |
| [CV-02 Host/Agent 测试](../../../tests/protocol/cv02-real-owner-agent-human-collection.test.mjs) | #1173 真实 Dictionary owner/Host + Personal Agent READ、跨企业/撤权/停用测试在必跑 Protocol CI 内 | CV-03 的 WRITE tests 可沿用同一 Host/真实 owner 测试骨架，避免另建 Mock AI 工具 |

**结论：** 系统视图已经能显示；个人/共享**保存**仍缺少已认证的可比较持久化写入权威。只增补 Eidos 视图配置字段或浏览器 LocalStorage 都不解决该问题。

## 2. 采用方案：复用已有资源能力，先验证真正的条件写入

- **配置资源而不是事实：** `SavedCollectionView` 是记录 `collectionId + schemaRef + authorizedQuery + columns + presentation + scope/owner + revision` 的治理配置，不包含行数据、领域记录快照、AI conversation 或 SQL。
- **权威与分层：** Platform 的受管配置/授权/存储层为 view resource owner；业务 Collection owner 验证 `queryOperationId`、有权字段/过滤/排序与 effective schema。Eidos 只接收已经筛选的 `views[]` 和当前选中项。
- **个人优先、共享分阶段：** 第一条真实纵切仅 `PERSONAL`、在**当前 Principal + Enterprise Context** 下读/写“我的视图”，绝不接受模型/URL 传入任意 `ownerSubjectId` 覆写身份。企业共享视图待管理员权限、原子版本写入与撤权策略通过后再激活。系统预设 `SYSTEM` 由业务插件注册、**只读**。
- **存储路线：** 优先为当前 Enterprise Resource Provider 增加**真正由存储后端执行**的条件提交契约（`createIfAbsent` / `updateIfRevision` / `archiveIfRevision` 或经 owner 决议的等价 API），指定冲突返回和持久 readback；按 provider 实现（内存、文件、正式多 worker store）分别验证。不能仅靠 `transaction` 的函数签名认定多实例具备 CAS。若正式 provider 暂不能保证，则 Saved View WRITE 对该 provider **fail-closed**，不开放生产或多 Worker。
- **声明与执行：** 用 `platform.capability-operation` 声明 Saved View READ/WRITE、当前 `authorization` 和 `writeSafety:{idempotency:"HOST_REQUIRED",receipt:"HOST_REQUIRED"}`，经原 ActionHost 的 durable receipt 与必要 Human confirmation。Personal Agent 复用已存在 `invoke.write`；未知 WRITE 结果先读回核对 receipt 和 revision，不自动重发。
- **查询版本变化：** 每次读取/应用视图都重新验证当前 Feature 激活、Principal、Enterprise、`schemaRef`、query-operation 的字段和作用域；原视图失效则返回明确修复结果，不静默扩大数据范围。
- **迁移：** 不改变 Counterparty/Dictionary 事实表、历史导入任务、原有 Eidos view buttons 和 URL。新增视图资源使用隔离 namespace，新增能力关闭时旧系统视图仍正常。可回滚 owner feature/Contribution，不删除用户视图事实数据。

## 3. 最小正式契约候选（只是工作输入，非现有 SDK API）

```ts
type SavedCollectionViewCandidateV010 = {
  contractVersion: "0.1.0";
  viewId: string;                // stable, opaque, server-validated
  ownerPackageId: string;        // business Collection owner, NOT storage owner
  collectionId: string;
  schemaRef: string;
  queryOperationId: string;      // currently authorized READ capability
  visibility: "PERSONAL" | "ENTERPRISE";
  ownerSubjectId: string;        // from Host Principal; never trusted user input
  enterpriseId: string;          // from active Enterprise Context
  title: string;
  query: { search?: string; sort?: string; direction?: "asc" | "desc" };
  columns?: string[];            // current authorized field IDs only
  presentation: "table" | "list"; // no implicit chart/kanban write authority
  revision: number;              // optimistic concurrency
  updatedBy: string;
};
```

**不得直接采纳此候选名/类型为“已安装 API”**；C3-01 先核准已有 Eidos/Platform 合同及 owner。视图引用不能用 `ownerSubjectId` 或 `enterpriseId` 自行推断权限，它们只是持久归属线索。实际读权限在**每一次** Host 请求时执行。

## 4. 近期单线闭环与逐项验收

| 短闭环 | 代码交付 | 退出门禁 |
| --- | --- | --- |
| **C3-01 条件写入与资源 owner** | 确定存储后端的 CAS/多实例行为，选择现有 Enterprise Resource 的最小可兼容扩展；增加 provider 原子 `expectedRevision` / 冲突和重启恢复测试 | **不同实例同 revision 只允许一人成功**；不支持的 provider 明确拒绝，不能凭单实例 Mock 成功 |
| **C3-02 私有视图真实闭环** | 一个 Platform 受管 Feature 的 Personal Saved View READ/WRITE Operation，Context/Principal 绑定、字段/Schema 校验、Eidos 视图候选输出；沿用 Host 回执 | 两企业两用户、非 owner、未经授权 source、重复提交、版本冲突、停用后失败封闭、重启读回；真实 Agent WRITE + Human UI 双入口 |
| **C3-03 共享视图与权限** | 共享给企业的独立管理权限、版本冲突/撤权、schema 失效修复和已授权的 Eidos 切换 | 共享**不**扩大行列权限；普通成员不能覆盖共享定义；撤权/跨企业/disabled 不残留 |
| **C3-04 Human/Agent 交付证明** | 自然语言“保存我的香港供应商视图”→ PLAN→ 授权 WRITE → Receipt→ 页面切换→ 重进恢复，desktop+390px | Agent 真正工具调用与 READ readback、未知 WRITE 不重复；真实浏览器/Human 签收；准确 HEAD CI、owner SHA、合并/回滚 |

**安全负例必测：** 未登录、Personal Context 换人、Enterprise Context 切换/丢失、两企业相同 viewId、猜测私有 viewId、未激活源插件、隐藏列、非法 filter/SQL、旧 Schema、并发更新、重复 Agent invoke、WRITE 失败但模型说成功、Host 重启、两实例写入相同 revision、4000+ 列或超长标题、Prompt injection 来自业务记录。

## 5. 当前状态与对未来窗口的指令

- **CV-02：** 工程自动验收在推进，Human 390px/真实模型调用与焦点体验仍开放；详见[当前八步表](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。
- **CV-03：** `PLANNED / STORAGE_ATOMICITY_GATE_OPEN`。此文档**不关闭** C3-01 或任何正式 CV-03 工程门禁，不宣称 CAS 已存在。
- **不应做的事：** 为保存按钮直接在 UI localStorage、Platform generic Host Map、旧 Business Definition 发布流程，或普通 `EnterpriseResourceRepository.put()` 上新增“视图已保存”的成功提示。必须真实受管 readback + revision/receipt 证明。
- **最短下一步：** 在同一 CV-03 实施主线先实现经过 store/provider owner 同意的原子比较写；在未满足此门禁的 Provider 上不暴露 Saved View WRITE。原生 Eidos view renderer 不需要重写。

此结论基于 2026-11-09 读过的原有仓库源码而非外部新竞品推断，沿用项目参考资料索引的 SharePoint 2019 个人/共享视图、Odoo model/view 分离原则；它们只是产品体验借鉴，不能替代 EVO 自己的权限与并发证据。
