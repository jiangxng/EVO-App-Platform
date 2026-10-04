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

这里列出的**普通投影编辑**只作用于 Graph Definition / Projection / View State，不直接修改 Application、LedgerDefinition 或 Runtime Facts。

唯一已经确认的例外是显式的 **Posting Relationship Edit**：它针对已有 Application / Ledger 之间的条件式记账关系，写入 Enterprise Template Working Draft，并遵循后文“Save Working Draft → Create Version → Administrator Activate”的软件版本流程。

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

EOG 首期明确不负责：

- 新建企业 Application；
- 新建企业 LedgerDefinition。

其他能力不因为这条“不新增”原则被一并禁止。尤其是 PostingRule、关系、Graph、Subgraph、投影节点等是否允许新增/修改，继续按各自需求单独确认。

EOG 仍然不直接写入 BusinessData / LedgerEntry，也不通过纯视觉画线伪造已经发生的运行事实。

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

- 只把**已有 Application / Ledger 的引用**加入当前 EOG Graph；
- 保存图形出现状态与 View State；
- 不创建新的企业 Application；
- 不创建新的企业 LedgerDefinition。

这里“不新增”的范围只锁定 Application 与 Ledger，不自动扩展到 PostingRule、关系或其他 EOG 能力。

如果已有 Runtime Definition 表明两个对象存在条件式 Posting 关系，EOG 可以自动投影/显示该已有关系；但拖放动作本身不创建语义关系。

新增企业 Application / Ledger 属于 EOG 之外或后续高级设置能力，当前不做。

已确认 EOG 可以通过受治理的 **Posting Relationship Edit** 修改已有 Application / Ledger 之间的记账关系，并写入软件 Working Draft。

这里的“关系修改”可覆盖已有 Application / Ledger 之间的关系新增、删除、条件/effect 调整；它不会创建新的 Application 或 Ledger。具体可编辑字段与校验规则继续单独冻结。


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


## 12. Template-first 企业实施原则

企业实施不应默认从空白开始。

如果每个企业都从零定义：

- 有哪些 Application；
- 有哪些 Ledger；
- Application 与 Ledger 之间有哪些条件式 Posting；
- 哪些基础企业元数据需要存在；
- 哪些基础流程/分类需要采用；

实施效率会非常低，也会把大量成熟、重复、可复用的知识重新变成人工访谈成本。

因此正式采用：

> **Template-first Implementation：先选择成熟模板，再做企业差异化裁剪与调整；EOG 首期不新建企业 Application 或企业 Ledger。**

### 12.1 模板知识来源

模板可以提前吸收和整理：

- 会计准则及其应用指南；
- 行业公开资料；
- APQC 等流程分类参考；
- 已验证的行业经验；
- 已实施企业中可复用、脱敏后的模式；
- 基础主数据 / 基础元数据结构；
- 常见 Application / Ledger / PostingRule 拓扑；
- 其他公开、可验证、可版本化的知识来源。

这些来源是模板的知识输入，不等于某家企业已经发生的事实。

### 12.2 模板存放位置

可部署、可选择、可版本化的 **Enterprise Template** 存放在 Enterprise Context。

Enterprise Context 因此可以拥有：

```text
Enterprise Template Catalog
├─ template id / version
├─ applicability
├─ provenance / source references
├─ Application candidates
├─ LedgerDefinition candidates
├─ PostingRule / conditional-posting candidates
├─ base metadata candidates
├─ process / classification references
└─ optional default Graph / projection hints
```

这里存放的是**模板定义**，不是企业 Runtime Fact。

### 12.3 项目实施流程

建议实施主链：

```text
公共知识 / 准则 / 行业经验
        ↓ 整理、验证、版本化
Enterprise Template Catalog
        ↓
项目实施：企业主选择模板
        ↓
确认 / 裁剪 / 调整企业差异
        ↓
Enterprise Runtime Definition
├─ ApplicationAnchor
├─ LedgerDefinition
├─ PostingRule
└─ Conditional Posting Topology
        ↓
EOG Projection
        ↓
继续深入具体 Application 字段 / 表单 / 数据模型
```

这样企业主讨论的第一批问题从：

> “请从空白告诉我们整个企业应该怎么建。”

变成：

> “这套默认运行骨架哪些适合你？哪些需要删、换、补？”

目标是显著降低实施时间、沟通成本和遗漏概率。

### 12.4 Template 与 Runtime 的边界

模板被选择，不代表模板本身直接成为企业运行事实。

必须经过：

```text
Template
→ enterprise adoption
→ enterprise-specific pinned Runtime Definition
→ runtime execution
```

真正执行时仍以企业自己的 Runtime Definition 为权威。

模板更新也不能偷偷改变已经实施企业的运行逻辑；升级必须显式比较、确认、迁移和版本化。

### 12.5 Template 与 EOG 的边界

EOG 不负责设计模板，也不因为拖放而实例化模板中的 Application / Ledger。

EOG 可以：

- 投影企业已经采用的 Runtime Definition；
- 在实施阶段预览候选模板拓扑；
- 显示“模板建议”与“企业已采用定义”的差异；
- 根据已采用 Runtime Definition 过滤 Toolbox。

但：

> **EOG = Projection Tool；Template = 实施基线；Runtime Definition = 可执行企业定义。**

三者不得合并成同一份数据。


### 12.6 EOG“不新增”的精确定义

本阶段“不新增”只表示：

```text
EOG 不新建 Enterprise Application
EOG 不新建 Enterprise Ledger
```

它**不等价于**：

- 不允许新增 Graph；
- 不允许新增 Subgraph；
- 不允许把已有对象加入当前投影；
- 不允许新增投影节点；
- 不允许新增/调整关系；
- 不允许新增/调整 PostingRule。

上述能力分别由各自需求决定，不能从“Application / Ledger 不新增”推导出来。

EOG 加载默认模板后，企业主可以对模板提供的 Application / Ledger 做裁剪、保留、恢复和修改其已有配置；但不会在 EOG 中凭空创建新的企业 Application 或新的企业 Ledger。


## 13. Runtime Spec / Enterprise Template / EOG Graph 三层版本模型

本节继续收敛“硬件 / 软件 / 投影”的关系，不推翻此前任何权威边界。

### 13.1 账本运行时版本 = 硬件规格

`Ledger Runtime Spec v1.0` 类似硬件平台规格。

它定义企业软件能够依赖的基础能力与契约，例如：

- ApplicationAnchor；
- LedgerDefinition；
- PostingRule；
- 条件表达；
- Posting effect；
- BusinessData → Posting → LedgerEntry → Balance；
- version pinning / replay；
- compatibility / migration 基础能力。

它不等于某家企业的具体配置。

### 13.2 Enterprise Template Version = 软件版本

Enterprise Context 保存版本化 Enterprise Template / Enterprise Package。

例如：

```text
Ledger Runtime Spec v1.0
        ↑ compatible with
Enterprise Template v1.0
Enterprise Template v1.1
Enterprise Template v1.2
```

Enterprise Template 声明自己依赖的 Runtime Spec compatibility。

模板/企业软件可以持续演进，但**已经生成的版本不可原地重写**。

因此：

```text
Enterprise Template v1.0
        ↓ create working draft
Working Draft
        ↓ modify
Working Draft*
        ↓ explicit Create Version
Enterprise Template v1.1
```

### 13.3 EOG Graph Revision = 投影修订

EOG 基于某一个 Enterprise Template Version / Working Draft 工作。

它可以投影：

- 全部 Application ↔ Ledger 结构；
- 任意局部 Application ↔ Ledger 结构；
- 多个不同 Graph；
- 不同钻取深度和布局。

仅发生以下变化时，只产生 Graph/Projection 保存，不产生新的 Enterprise Template Version：

- 加入/移除投影中的已有 Application；
- 加入/移除投影中的已有 Ledger；
- 改变节点位置；
- 改变布局；
- 改变显示范围；
- 新增 Graph / Subgraph；
- 改变钻取组织；
- 其他纯 Projection / View State 变化。

因此：

```text
Enterprise Template v1.0
        ↓
EOG Graph A rev 1
EOG Graph A rev 2
EOG Graph B rev 7

≠ Enterprise Template v1.1
```

### 13.4 记账关系修改 = 软件 Working Draft 变化

如果 EOG 中执行的是受治理的 **Application ↔ Ledger 条件式 Posting 关系修改**，该动作不再只是投影变化。

它写入的是当前 Enterprise Template / Enterprise Package 的 **Working Draft**。

例如：

```text
Enterprise Template v1.0
        ↓ open working draft
Working Draft based on v1.0
        ↓ modify Application ↔ Ledger Posting relationship
Dirty Working Draft
```

此时：

- 当前 Runtime 仍继续运行已激活版本；
- v1.0 本身不被修改；
- 仅产生未激活的软件草稿变化。

只有用户显式执行 **Create Version / 生成新版本**：

```text
Dirty Working Draft
→ validate
→ Create Version
→ Enterprise Template v1.1
```

才产生新的软件版本。

### 13.5 保存、生成版本、运行时激活必须分离

EOG 至少区分以下动作：

#### A. 保存投影

`Save Projection`

保存：Graph membership、Graph/Subgraph、layout、position、projection visibility、navigation/view state。

不会产生 Enterprise Template 新版本。

#### B. 保存软件草稿

`Save Working Draft`

当存在 Posting relationship 等软件语义修改时，保存到 Enterprise Template Working Draft。

不会改写 base version、不会自动生成新版本、不会自动影响 Runtime。

#### C. 生成软件新版本

`Create Version`

对 Working Draft 做 validation、diff、compatibility check，并生成 immutable snapshot。

结果例如：`Enterprise Template v1.1`。

生成版本不等于立即上线。

#### D. 激活到企业账本运行时

`Activate Version`

由有权限的 Enterprise Administrator 显式选择某一个兼容版本激活到企业 Ledger Runtime。

```text
Enterprise Template v1.0 / v1.1 / v1.2
        ↓ Administrator Activate
Enterprise Ledger Runtime
```

Runtime 只能执行被明确激活/生效的版本集合；具体灰度、多版本并行与生效时间策略后续再冻结。

### 13.6 Git 类比

概念上可类比：

```text
EOG / Working Draft 修改
≈ working tree

Save
≈ 保存工作区

Create Version
≈ commit / tag 一个不可变软件版本

Administrator Activate
≈ deploy / release 到生产运行时
```

这里只借用 Git 的心智模型，不要求复制 Git 技术实现。

### 13.7 EOG 的定位仍然不变

EOG 仍然是 Projection Tool。

它的主要职责是：

```text
Enterprise Template / Runtime Definition
        ↓
local or full projection
```

只有当用户明确进入受治理的 Posting Relationship Edit 操作时，EOG 才作为**软件 Working Draft 的一个受控编辑入口**。

这不把 EOG 扩张为完整 Enterprise Designer：

- EOG 首期仍不新建企业 Application；
- EOG 首期仍不新建企业 Ledger；
- 普通拖拽/画布修改仍只改变 Projection；
- Runtime 永远不会因为 EOG Save 而自动升级。


## 14. 插件所有权冻结：只属于 Ledger Runtime 与 Enterprise Context

本节是明确所有权，不新增插件。

> **Runtime Spec、默认企业模板、软件 Working Draft、版本管理与运行版本选择，全部收敛到现有 Ledger Runtime 与 Enterprise Context 两个插件/能力域。不得因为这些功能再创建第三个 Template Plugin、Version Plugin、Release Plugin 或 EOG Runtime Plugin。**

### 14.1 Ledger Runtime 插件

Ledger Runtime 负责“硬件规格”。

其所有权包括：

- Ledger Runtime Spec / Semantic Contract；
- ApplicationAnchor、LedgerDefinition、PostingRule 可执行契约；
- 条件/表达式/effect 的执行规格；
- BusinessData → Posting → LedgerEntry → Balance；
- Replay / deterministic execution；
- Runtime Spec compatibility 校验；
- 加载并执行 Enterprise Context 选择为 active 的兼容企业软件版本。

Ledger Runtime **不拥有**：

- Enterprise Template Catalog；
- Enterprise Template Working Draft；
- Enterprise Template Version 历史；
- 企业管理员的软件版本选择/发布治理。

### 14.2 Enterprise Context 插件

Enterprise Context 负责“软件”。

其所有权包括：

- Default Enterprise Template v1.0；
- Enterprise Template Catalog；
- template provenance / applicability；
- 企业采用、裁剪与差异配置；
- Enterprise Template Working Draft；
- Save Working Draft；
- Create Version；
- immutable Enterprise Template Version history；
- version diff / compatibility request / migration metadata；
- 企业管理员选择哪个版本进入 active / effective 状态；
- Enterprise Graph Definition 与 EOG Graph Revision。

Enterprise Context 负责的是**软件定义与版本治理**，不是 Ledger Runtime 的确定性执行引擎。

### 14.3 EOG

EOG 不因此成为新插件或新的版本权威。

EOG 只是 Enterprise Context / Ledger Runtime 现有能力的一个投影与编辑入口：

```text
Ledger Runtime
└─ Runtime Spec / executable contract

Enterprise Context
├─ Default Template
├─ Working Draft
├─ Version Management
├─ Active-version governance
└─ Enterprise Graph Definition
        ↑
       EOG
       projection / selected governed edits
```

EOG 的 `Save Projection` 写 Enterprise Context 的 Graph Definition / Revision。

EOG 的受治理 Posting Relationship Edit 写 Enterprise Context 的 Template Working Draft。

EOG 不自行保存一套 Template Version，不自行实现发布引擎，也不直接改变 Ledger Runtime 当前 active version。

### 14.4 Activate 的跨插件边界

“企业管理员选择版本”和“运行时实际接受并执行版本”是一个跨插件协议，不是第三个插件：

```text
Enterprise Context
Administrator selects Template v1.1
        ↓ governed activation request
Ledger Runtime
validate Runtime Spec compatibility
        ↓
accept / reject
        ↓
execute accepted active definition
```

Enterprise Context 拥有版本治理与选择意图；Ledger Runtime 拥有最终兼容性校验和执行安全。

### 14.5 现有 Ledger Runtime Configurator 的定位

仓库中现有 `apps/ledger-runtime-configurator` 是 Ledger Runtime 的开发/配置/编译工具与历史过渡实现，不应被解释成第三个产品级“企业模板插件”。

其中现有 `default-library.ts` / bookkeeping 默认配置属于早期导入与编译证据。产品级 Default Enterprise Template 的长期权威归 Enterprise Context。

后续代码迁移应遵循：

- Runtime-spec 编译/验证能力留在 Ledger Runtime；
- 产品级默认模板内容与版本生命周期迁入/暴露于 Enterprise Context；
- 在迁移完成前保留兼容适配，避免破坏已有验证资产。
