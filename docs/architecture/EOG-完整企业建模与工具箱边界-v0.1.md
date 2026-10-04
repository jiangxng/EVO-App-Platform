# EOG 完整企业建模与工具箱边界 v0.1

**状态：已确认基础方向**  
**日期：2026-10-04**

## 1. 产品定位

EOG 2D Designer 是完整企业建模工具。

EOG 可以表达企业全部对象，不预设最终对象类型集合。一个企业可以拥有多个 Graph，Graph 数量和钻取深度均不由系统固定，最终由企业用户自行组织。

自动画图暂不属于 EOG 本体；未来 Personal Agent 或其他 Agent 通过公开建模命令完成自动建模。

## 2. 工具箱

Designer 左侧提供类似 Visio 的企业对象工具箱。

首批对象：

| Toolbox ID | 中文 | 领域类型 | 图标方向 |
| --- | --- | --- | --- |
| `eog.application` | 应用 | `APPLICATION` | 窗口 + 模块网格 |
| `eog.ledger` | 账本 | `LEDGER` | 账册 / 分层记录 |

后续组织、人员、客户、供应商、产品、仓库、设备、流程、数据对象、外部系统等可继续加入工具箱。

工具箱条目属于 EOG 领域配置；工具箱容器、拖放和图元创建交互属于 Eidos。

## 3. 第一阶段编辑能力

必须具备：

- Toolbox → Canvas 拖拽建节点；
- 框选；
- 多选；
- 批量操作；
- 子图；
- 对齐；
- 现有单节点移动；
- 节点 / 关系创建删除；
- Inspector 属性编辑。

其他成熟建模能力预留并逐步加入。

## 4. Eidos 2D Core 应承担

Eidos 是领域无关的可复用图编辑基础：

- Toolbox / Palette 机制；
- Drag & Drop；
- Marquee Selection；
- Multi Selection；
- Selection Set；
- Alignment / Distribution；
- Generic Batch Interaction；
- Group / Subgraph primitive；
- Fold / Expand primitive；
- Grid / Snap / Guide；
- Resize；
- Edge reconnect；
- Keyboard interaction；
- Undo / Redo infrastructure；
- Layout extension seam。

Eidos 不认识 Application、Ledger、客户、仓库等企业语义。

## 5. EOG 应承担

EOG 负责：

- 企业对象工具箱内容；
- 企业对象图标语义；
- Graph / Node / Edge 的企业领域语义；
- Enterprise Context mutation；
- 企业关系校验；
- 发布与治理；
- EOG 特有 Inspector；
- Graph-to-Graph drill-down 语义。

## 6. 多图与钻取

```text
Enterprise
├─ Graph A
│  ├─ Node
│  └─ Node -> Graph B
├─ Graph B
└─ Graph C
```

Graph 不是固定层级中的“某一级”，而是用户定义的建模空间。

节点可以成为另一个 Graph/Subgraph 的入口。最终钻取深度由用户定义；EOG 不设固定层数。

## 7. Agent 原则

Human Designer 与 Agent 应共用同一套公开建模命令：

```text
Human Drag / Edit ─┐
                    ├─> EOG Modeling Commands
Agent Proposal/Edit ┘
                         ↓
                 Enterprise Context Authority
```

这样未来 Agent 自动建模不会形成第二套写入机制。


## 8. 当前 v0.1 实现的过渡限制

以下现有代码不得被解释为最终产品限制：

### 8.1 Node Kind

当前：

`EogNodeKindV010 = APPLICATION | LEDGER`

只是现阶段已经实现的两类节点。

后续模型必须允许扩展到企业全部对象；不能通过不断扩大一个封闭 union 让 Eidos 或 EOG Core 依赖所有行业对象知识。具体扩展协议在后续“企业对象类型注册 / Contribution”需求中冻结。

### 8.2 Primary Graph

当前：

`PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010`

只是默认入口 / 兼容快捷方式。

最终一个企业允许拥有多个 Graph，不设产品级数量上限。页面、查询、导航、View State 和权限接口不得长期假设只有一个 Primary Graph。

### 8.3 Toolbox Drop 的语义仍需确认

通用拖放交互属于 Eidos 已确定；但 EOG 中从“应用 / 账本”工具项拖到画布后，究竟：

1. 创建新的企业对象；
2. 从已有企业对象中选择并绑定；
3. 先创建未绑定的建模草稿节点，再完成语义绑定；

这一点尚未确认。

在该语义确认前，只冻结 Toolbox 视觉与交互机制，不应私自引入第二套企业对象真相。
