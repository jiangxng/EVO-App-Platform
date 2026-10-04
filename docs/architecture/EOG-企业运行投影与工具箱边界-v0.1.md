# EOG 企业运行投影与工具箱边界 v0.1

**状态：已确认基础方向**  
**日期：2026-10-04**

## 1. 产品定位

EOG 是**企业运行投影工具**，不是企业本体设计器。

EOG 2D Designer 中的 “Designer” 指 **Projection Designer / 投影设计器**：用户设计的是“这张图如何投影企业”，不是在画布上创建企业的 Application、Ledger、PostingRule 等运行定义。

本轮澄清不推翻任何此前设计。权威边界继续保持：

```text
Enterprise Context
= Enterprise Graph Definition authority

EVO Runtime
= ApplicationAnchor / PostingRule / LedgerDefinition authority
  + Runtime Fact authority

EOG
= projection / organization / navigation surface

Eidos
= neutral 2D/3D interaction foundation
```

EOG 可以投影企业全部对象，不预设最终对象类型集合。一个企业可以拥有多个 Graph，Graph 数量和钻取深度均不由系统固定，最终由企业用户自行组织。

自动生成投影图暂不属于 EOG 本体；未来 Personal Agent 或其他 Agent 通过公开 Projection Commands 完成。

## 2. 工具箱

Designer 左侧提供类似 Visio 的企业对象工具箱。

首批对象：

| Toolbox ID | 中文 | 领域类型 | 图标方向 |
| --- | --- | --- | --- |
| `eog.application` | 应用 | `APPLICATION` | 窗口 + 模块网格 |
| `eog.ledger` | 账本 | `LEDGER` | 账册 / 分层记录 |

后续组织、人员、客户、供应商、产品、仓库、设备、流程、数据对象、外部系统等可继续加入工具箱。

工具箱条目属于 EOG 领域配置；工具箱容器、拖放和图元交互属于 Eidos。

首期工具箱由当前企业的 Runtime Definition 驱动，而不是任意创建新业务对象：

```text
选中 Application
→ toolbox = 该 Application 按条件式 Posting 可能增加的 Ledger

选中 Ledger
→ toolbox = 按条件式 Posting 可能减少该 Ledger 的 Application
```

因此工具箱同时承担“可投影对象库”和“沿运行拓扑继续组织投影”的导航作用。

## 3. 第一阶段投影编辑能力

必须具备：

- Toolbox → Canvas：将已有权威对象加入当前投影；
- 从投影中移除对象，但不删除源对象；
- 框选；
- 多选；
- 批量投影操作；
- 子图 / Graph 引用；
- 对齐；
- 现有投影节点移动；
- 已有权威关系的显示/隐藏；
- Projection / View Inspector 属性编辑。

这里的所有“编辑”都作用于 Graph Definition / Projection / View State，不直接修改 Application、LedgerDefinition、PostingRule 或 Runtime Facts。

其他成熟图编辑能力预留并逐步加入。

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

- 可投影企业对象的工具箱内容；
- 企业对象图标语义；
- Graph / Node / Edge 的投影语义；
- EOG Graph Definition / View mutation；
- 对 EVO Runtime Definition 和其他权威企业对象的稳定引用与投影；
- 投影一致性校验；
- Graph Definition 的发布与治理；
- EOG 特有 Inspector；
- Graph-to-Graph drill-down 语义。

EOG 不负责：

- 新建/定义 Application；
- 新建/定义 LedgerDefinition；
- 新建/定义 PostingRule；
- 写入 BusinessData / LedgerEntry；
- 通过画线改变企业实际运行语义。

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
Human Drag / Projection Edit ─┐
                               ├─> EOG Projection Commands
Agent Projection Proposal/Edit ┘
                                    ↓
                     Enterprise Context Graph Definition

Runtime semantic reference
→ EVO Runtime Definition Authority
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

### 8.3 Toolbox Drop 语义（已确认）

从“应用 / 账本”工具项拖到画布后：

- 只把**已有 Runtime 对象的引用**加入当前 EOG Graph；
- 保存图形出现状态与 View State；
- 不创建 Application；
- 不创建 LedgerDefinition；
- 不创建/修改 PostingRule；
- 不改变 Runtime Definition。

如果已有 Runtime Definition 表明两个对象存在条件式 Posting 关系，EOG 可以自动投影/显示该已有关系；但拖放动作本身不创建语义关系。

新增 Application / Ledger / PostingRule 属于高级设置，当前延期。


## 9. 企业运行权威分层

EOG 必须区分四种不同权威：

```text
Reference / Standards
会计准则、行业经验、APQC、历史模板
        ↓
Default Runtime Template
        ↓ 企业采用/调整
Enterprise Runtime Definition
ApplicationAnchor + PostingRule + LedgerDefinition
        ↓ 执行
Runtime Facts
BusinessData + Posting + LedgerEntry + LedgerBalance
```

另有：

```text
Enterprise Context / EOG Graph
= 企业上下文 + 用户组织出来的 Graph + Runtime 对象引用
```

关键原则：

- Runtime Facts 的发生源只能是 EVO Runtime。
- Application ↔ PostingRule ↔ Ledger 的运行语义以 Runtime Definition 为准。
- Default Runtime Template 是默认实施骨架，不等于某企业不可变真相。
- Enterprise Context 不复制 Posting/Ledger 运行定义成为第二套真相。
- EOG 是对这些对象的选择、组织、解释和可视化建模层。

## 10. 先运行骨架、后应用字段

这是一条企业实施/配置顺序，不是 EOG 创建这些定义的职责。

实施顺序允许：

```text
先确定企业有哪些 Application
→ 确定 Application 与 Ledger 的条件式 Posting 拓扑
→ 形成企业运行骨架
→ 再逐步深入具体 Application 字段/表单/数据模型
```

这与 APQC 先建立流程/分类框架再深入具体实现细节的思想相似，但 EOG 的运行骨架最终以 EVO Runtime Definition 为执行依据。

PostingRule 中需要的具体字段绑定可以在后续应用详细设计阶段补齐；EOG 首层不要求先展开所有字段。


## 11. “Designer” 的命名约束

为了避免未来再次混淆：

```text
EOG 2D Viewer
= 读取既有 Graph Definition 的交互式投影

EOG 2D Designer
= 编辑 Graph Definition / Projection / View 的工具
  ≠ Enterprise Designer
  ≠ Application Designer
  ≠ PostingRule Designer
  ≠ Ledger Designer
```

如果后续产品语言仍使用 “Designer”，所有契约与文档必须能够明确指出它设计的是 **Projection**，而不是企业运行本体。
