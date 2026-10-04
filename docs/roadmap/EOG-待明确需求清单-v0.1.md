# EOG 待明确需求清单 v0.1

**状态：** 持续收敛  
**语言：** 中文  
**日期：** 2026-10-04  
**用途：** 作为 EOG 插件族的需求澄清入口。后续按编号逐项讨论、确认并回写；未确认项不得自动升级为实现约束。

---

## 0. 已确认边界

以下内容已经确定，不再作为待讨论项：

- **本轮澄清不推翻此前任何架构决定，只进一步拆清各自权威边界。**
- **Enterprise Context 继续是 Enterprise Graph Definition 的权威来源。**
  - 这里的 Graph Definition 指：一个 Graph 投影哪些对象、如何组织、如何钻取、Graph 间如何引用以及其他投影定义。
  - 它不等于 Application / PostingRule / LedgerDefinition 的运行定义。
- **EVO Runtime 继续是 Application / PostingRule / LedgerDefinition 运行语义与运行事实的权威来源。**
  - Runtime Definition Plane：ApplicationAnchor、PostingRule、LedgerDefinition、条件式记账配置及企业采用的模板版本。
  - Runtime Fact Plane：BusinessData、Posting、LedgerEntry、LedgerBalance 等实际运行事实。
- **EOG 是投影工具，不是企业本体设计器。**
  - EOG 读取并引用各自权威来源；
  - EOG 不通过画图创造 Application、Ledger、PostingRule 或已经发生的运行事实。
- EOG 2D 是一个 Package：
  - Viewer：可交互、可选择节点/连线、可查看 Inspector 属性，但不可进行语义编辑。
  - Designer：复用 Viewer 的 Workspace 能力，并增加受治理的语义编辑能力。
- EOG 3D Viewer 独立存在，基于 neutral Spatial Workspace。
- Enterprise Observatory 是与 EOG 同级的独立插件，不属于 Viewer/Designer 本体。
- Observatory 可在 2D/3D Viewer 上叠加 Runtime Facts、Analysis 等观测信息。
- SOP 与 EOG 分离；当前暂停 SOP 产品发展。
- Eidos 负责可复用的 2D Core / 3D Core；EOG 只拥有企业图领域投影与产品能力。
- Viewer 是“只读语义”，不是“无交互界面”。

---

## 0.1 企业核心运行权威链

**状态：已确认**

需要严格区分“定义”与“事实”。

### 运行定义

企业有哪些 Application、有哪些 Ledger、Application 在什么条件下对哪些 Ledger 产生增加/减少效果，这些属于 **Runtime Definition Plane**。

其来源链为：

```text
会计/行业/历史经验
        ↓
Default Runtime Template
        ↓ 企业采用 / 调整 / 版本固定
Enterprise Runtime Definition
├─ ApplicationAnchor
├─ PostingRule
├─ LedgerDefinition
└─ Conditional Posting Topology
```

Default Runtime Template 是实施起点和默认运行骨架，不等于不可修改的企业事实。

### 运行事实

真正已经发生的企业运行事实产生于 EVO Runtime：

```text
BusinessData
→ Posting
→ LedgerEntry
→ LedgerBalance
```

因此“发生了什么”不能由 EOG 或 Enterprise Context 推断后写成事实。

### Enterprise Context 的角色

Enterprise Context 继续承担此前已经确定的 **Enterprise Graph Definition authority**。

它负责保存：

- EOG Graph 本身的定义；
- 这张投影图选择了哪些对象；
- Graph 中对 Runtime / Host 权威对象的稳定引用；
- 多 Graph 组织与导航；
- Graph/Subgraph 钻取定义；
- 权限、人员、组织等 Host 语义；
- 其他不属于最小 Ledger Runtime 的企业上下文。

但对于 Application ↔ PostingRule ↔ Ledger 的运行语义，只保存稳定引用/投影关系，不复制并建立第二套 Runtime 真相。

因此此前设计与本轮设计不是替换关系，而是：

```text
Enterprise Context
= Enterprise Graph Definition authority

EVO Runtime
= executable Application / PostingRule / Ledger authority
  + Runtime Fact authority

EOG
= projection surface over both
```

---


## 0.2 Template-first 企业实施

**状态：已确认**

企业项目实施默认不从空白开始，而从 Enterprise Template 开始。

### 原因

- 会计准则/应用指南已经提供大量可复用的会计与业务处理指导；
- APQC、行业公开资料和其他可靠公开知识已经提供大量基础流程/分类参考；
- 基础元数据、常见 Application、Ledger 和条件式 Posting 拓扑可以提前整理；
- 从零访谈和定义会显著增加实施时间、沟通成本与遗漏概率。

### 决策

Enterprise Context 可以保存版本化的 **Enterprise Template Catalog**。

模板可包含候选：

- Application；
- LedgerDefinition；
- PostingRule / 条件式记账拓扑；
- 基础 Metadata；
- Process / Classification reference；
- 默认投影提示。

项目实施时：

```text
企业主选择模板
→ 确认 / 裁剪 / 调整
→ 形成企业自己的 Runtime Definition
→ EOG 投影该 Runtime Definition
→ 后续再深入 Application 字段与细节
```

### 边界

- Template 是实施基线，不是 Runtime Fact。
- 企业选择模板后必须形成企业自己的版本化 Runtime Definition。
- 模板升级不能隐式改变已实施企业。
- EOG 不负责创建模板，也不负责把普通拖放变成模板实例化。
- EOG 可以预览模板、显示差异和投影已采用定义。

---

## 1. EOG 最终表达哪些企业对象

**状态：已确认**  
**优先级：P0**

### 决策

EOG 最终目标不是只显示“应用—账本运行图”，而是成为**完整的企业运行投影工具 / 企业全景投影视图**。

EOG 原则上可以**投影企业中的全部对象**。对象类型不预先设上限，也不把当前 Application / Ledger 视为最终固定集合。

这里的“可以投影全部对象”不等于“EOG 负责定义全部对象”。每类对象仍由其所属权威系统定义，EOG 只保存引用、投影组织和 View State。

候选对象包括但不限于：

- Application / 应用
- Ledger / 账本
- 组织 / 部门
- 岗位 / 角色
- 人员
- 客户
- 供应商
- 产品
- 仓库
- 设备
- 业务流程
- 数据对象
- 外部系统
- 其他企业资源

### 工具箱模型

EOG 2D Designer 采用类似 Visio 左侧图形库的“企业对象工具箱”，但这里的 Designer 是**投影设计器**，不是企业设计器。

首期工具箱不是空白图形库，而是 **Runtime Definition 驱动的投影导航器**。

当前第一批先提供：

- **应用（Application）**
  - 图标语义：应用 / 系统 / 功能入口
  - 建议视觉：窗口 + 模块网格
  - toolbox id：`eog.application`
- **账本（Ledger）**
  - 图标语义：账本 / 记录 / 余额容器
  - 建议视觉：账册 / 分层记录
  - toolbox id：`eog.ledger`

后续企业对象类型继续向该工具箱扩展，而不是修改 Eidos Core。

### 工具箱选择过滤（已确认首期规则）

当用户在画布选择不同对象时，工具箱按当前企业 Runtime Definition 的条件式记账拓扑过滤：

```text
选中 Application
→ 只显示该 Application 可能“增加”的 Ledger

选中 Ledger
→ 只显示可能“减少”该 Ledger 的 Application
```

这里的“可能”表示存在对应的 PostingRule / 条件式记账定义；不是在没有 BusinessData 的情况下提前判定某个条件已经发生。

这使用户可以沿着：

```text
Application
→ Ledger（增加）
→ Application（减少）
→ Ledger（增加）
→ ...
```

逐步组织当前 EOG 投影图。

未选中任何对象时工具箱如何组织/过滤，后续再定。

### 自动画图

“根据企业数据自动画图”暂不作为 EOG Designer 本体功能实现。

未来由：

- Personal Agent；
- 其他 Agent；
- 或其他上层智能能力

调用 EOG/Enterprise Context 的公开**投影操作**生成或修改 Graph。

因此 EOG 需要提供**确定性、可组合、可由 Human 与 Agent 共用的公开投影命令**，但 EOG 本体不负责自动推理“应该投影什么”。

### 明确不做什么

- 不把企业对象范围锁死为 Application / Ledger。
- 不在 Eidos 中硬编码任何企业对象类型。
- 当前不实现“AI 自动画企业图”。

### 架构影响

- EVO Runtime Definition Plane 负责 Application / PostingRule / Ledger 等运行定义权威。
- Enterprise Context 继续负责 Enterprise Graph Definition、Graph 组织、引用以及 Host 侧企业上下文。
- EOG 负责把这些权威对象和关系投影成节点、连线、工具箱项和钻取入口。
- EOG 不承担企业对象本体设计职责。
- Eidos 只提供通用 Toolbox / Shape / Interaction 机制。

---

## 2. 节点和连接线的业务语义

**状态：讨论中（Application ↔ Ledger 骨架已明确）**  
**优先级：P0**

Application / Ledger 首期关系仍需要继续讨论其创建/修改边界。

拖入画布的动作只保存 EOG Graph 中的图形/引用与 View State；**不得创建新的企业 Application 或新的企业 Ledger**。

这里不同时禁止 PostingRule 或关系的新增/修改；这些是独立需求。

如果两个已放入画布的对象在 Runtime Definition 中已经存在语义关系，EOG 可以把这条已有关系投影出来；这不等于由拖放创建关系。

需要继续冻结其他节点与关系的领域语义。

### 需要回答

1. 允许存在哪些关系类型？
2. 关系是否必须有方向？
3. 关系本身是否是一等业务对象？
4. 关系是否具有：
   - 类型
   - 条件
   - 状态
   - 权重
   - 生效区间
   - 来源
   - 发布状态
5. 一条关系是否允许被多个插件贡献附加属性？
6. Viewer 中点击连接线时，Inspector 至少应该展示哪些属性？
7. Designer 中哪些关系属性允许编辑？

---

## 3. 2D Designer 的编辑深度

**状态：已确认（第一阶段能力）**  
**优先级：P0**

Designer 已确认是**完整企业运行投影编辑工具**，不是企业本体设计器。

首期必须覆盖：

- 将已有权威对象加入投影节点；
- 从当前 Graph 投影中移除节点（不删除源对象）；
- 投影已有权威关系；
- 隐藏/移除投影关系（不删除源关系）；
- 投影/View 属性编辑；
- 拖拽布局
- 多选 / 框选
- 批量编辑
- 子图
- 对齐

其中拖拽、框选、多选、批量选择基础、子图 primitive、对齐等通用能力属于 Eidos 2D Core；EOG 只定义投影语义、来源引用和合法的 Projection/View 操作。

复制/粘贴、撤销/重做、自动布局、分组、折叠、锁定、快捷键、模板等继续预留。

---

## 4. 层级、子图与钻取模型

**状态：已确认（核心原则） / 细节待明确**  
**优先级：P0**

### 已确认决策

- EOG 不规定固定钻取层级。
- 数据钻取最终呈现到哪一层，由最终用户定义。
- 不假设固定的“企业 → 业务域 → 应用 → 子应用”层级。
- 一个企业可以拥有多个 EOG Graph，**数量不设产品级硬限制**。
- 不要求一个企业只有一张“总图”。
- 子图和跨图导航必须作为一等建模能力支持。
- 同一企业的不同 Graph 可以表达不同范围、不同粒度和不同建模目的。

因此：

> EOG 的层级是用户建模出来的，而不是系统预定义出来的。

### 仍需后续明确

1. 节点如何引用另一个 Graph / Subgraph？
2. 双击、Enter、Context Menu 中哪一种作为默认钻取动作？
3. 是否同时支持“嵌套子图”和“独立 Graph 引用”两种模型？
4. 跨 Graph 的关系如何呈现与追踪？
5. Drill-down / Step-up 的历史栈、面包屑和定位方式。
6. Graph 的命名、分类、搜索与权限模型。

### 架构约束

- API 不得假设固定深度。
- 数据模型不得使用固定层级字段（如 level1/level2/level3）。
- 导航应面向 `graphId + target`，而不是面向固定业务层级。
- 大图性能策略可以利用用户定义的 Graph / Subgraph 边界进行局部加载。

---

## 5. Definition 与 View 的关系

**状态：待明确**  
**优先级：P0**

当前倾向是：

> Definition 唯一；View 可以有多个；View State 不改变企业语义。

但还需要产品级冻结。

### 需要回答

同一份 Enterprise Graph Definition 是否允许存在：

- 老板视图
- 财务视图
- 供应链视图
- IT 架构视图
- 运营视图
- 个人视图
- 团队共享视图
- 2D View
- 3D View

还需明确：

1. View 是否可保存筛选条件？
2. View 是否可保存布局？
3. View 是否可隐藏节点/关系？
4. View 是否可定义分组、颜色、尺寸等表现属性？
5. View 是个人资产、团队资产还是企业资产？
6. View 是否具有版本与发布机制？
7. View 是否可以由插件生成？

---

## 6. Observatory 如何叠加到 EOG

**状态：待明确**  
**优先级：P1**

架构边界已经明确：Observatory 是同级插件。

产品效果仍需确定。

### 候选观测信息

- 数量
- 金额
- 余额
- 待办
- 异常
- KPI
- 趋势
- 风险
- 瓶颈
- AI 判断
- 时间轴变化

### 需要回答

这些信息如何进入图：

- Badge
- 节点颜色
- 节点尺寸
- 连线颜色
- 连线粗细
- Tooltip
- Inspector 扩展
- Side Panel
- 时间轴
- Heatmap
- 独立 Analysis Panel

还需确定一个 Viewer 是否允许多个 Observatory/Analysis 插件同时贡献 Overlay。

---

## 7. 3D Viewer 的产品定位

**状态：待明确**  
**优先级：P1**

当前只冻结了技术边界，没有冻结最终业务价值。

候选定位：

- 2D 图的空间化表达
- 超大企业图导航
- 多维关系探索
- 企业数字孪生入口
- 厂区 / 设备 / 仓库空间场景
- 多维数据分析界面

### 需要回答

1. 3D Viewer 是否必须与 2D 使用同一 Definition？
2. 3D 是否只是另一种 View？
3. 是否需要真实物理坐标？
4. 是否需要场景模型、楼层、厂区、设备模型？
5. 3D 是否允许插件贡献空间对象？

在定位未明确前，不扩大 3D 产品范围。

---

## 8. EOG 与 AI / Agent 的交互方式

**状态：待明确**  
**优先级：P1**

候选场景：

- “帮我把销售到回款关系画出来”
- “找出这张企业图里的断点”
- “根据现有应用生成建议关系”
- “为什么这个节点积压”
- “把企业图按价值链重新组织”
- “生成一个供应链视图”

### 需要回答

1. AI 是否只允许读取与分析？
2. AI 是否可以生成修改 Proposal？
3. Proposal 是否必须由 Human 在 Designer 中确认？
4. AI 是否可以直接修改 View？
5. AI 是否可以直接修改 Definition？
6. AI 产生的关系是否必须标记来源与置信度？
7. AI 的建议是否属于 Enterprise Context 的正式定义前阶段？

---

## 9. 权限粒度

**状态：待明确**  
**优先级：P1**

目前只确认 Viewer / Designer 能力边界。

未来可能需要：

- 图级查看权限
- 节点级查看权限
- 属性级查看权限
- View 编辑权限
- Definition 编辑权限
- 发布权限
- 关系编辑权限
- 特定节点类型编辑权限
- Observatory 数据查看权限

### 需要回答

权限最终由 Enterprise Context、App Platform Authorization，还是 EOG 领域规则共同决定，以及三者边界。

---

## 10. Draft / Publish / Version / History

**状态：待明确**  
**优先级：P1**

Enterprise Context 已承担定义权威，但 EOG 产品流程仍需冻结。

候选生命周期：

```text
查看 Published
→ 创建 / 编辑 Draft
→ 校验
→ Diff
→ Review
→ Publish
→ 生效
→ 查看历史
→ 基于历史版本新建 Draft
```

### 需要回答

1. 是否允许多人同时编辑 Draft？
2. 是否需要审批？
3. 发布是否必须原子化？
4. 是否支持版本比较？
5. 是否支持基于历史版本重新发布？
6. Agent Proposal 如何进入该生命周期？

---

## 11. 大图性能与规模目标

**状态：待明确**  
**优先级：P2**

需要给产品规模一个明确量级。

候选规模：

- 100 节点
- 1,000 节点
- 10,000 节点
- 100,000+ 节点

规模目标将影响：

- 图数据查询方式
- 分层加载
- 局部加载
- LOD
- 虚拟化
- WebGL / Canvas 策略
- 布局算法
- 搜索 / 索引
- 3D 场景策略

在规模目标明确前，不应过早做局部性能优化，但接口应避免锁死为“一次加载整张图”。

---

## 12. 插件向 EOG 的 Contribution 模型

**状态：待明确**  
**优先级：P1**

当前原则：

> EOG 本体不认识具体业务插件；业务插件通过公开 Contribution Contract 向 EOG 提供能力。

候选贡献类型：

- 节点类型
- 节点 Inspector 属性
- 关系 Inspector 属性
- Overlay
- Badge
- Context Menu
- Toolbar Action
- 分析结果
- 自定义 View
- Node Renderer
- Edge Renderer
- Drill-down Target
- Agent Tool

### 需要回答

1. 哪些 Contribution 属于 EOG 公共协议？
2. 哪些只能由第一方插件提供？
3. 是否支持多个插件同时贡献同一节点？
4. 冲突如何解决？
5. Contribution 是否可以声明优先级？
6. EOG 是否允许业务插件注册新的语义节点类型，还是只能引用 Enterprise Context 已知类型？

---

# 推荐确认顺序

第一阶段先确认产品骨架：

1. **EOG 最终表达哪些企业对象**
2. **节点和连接线的业务语义**
3. **2D Designer 的编辑深度**
4. **层级、子图与钻取模型**
5. **Definition 与 View 的关系**

第二阶段再确认扩展能力：

6. Observatory 叠加
7. AI / Agent
8. 权限
9. Draft / Publish / Version
10. 插件 Contribution

第三阶段再确认专项能力：

11. 大图规模
12. 3D 产品定位

---

# 维护规则

- 每个条目只允许以下状态：
  - `待明确`
  - `讨论中`
  - `已确认`
  - `延期`
- 每次确认必须写入：
  - 决策
  - 原因
  - 明确不做什么
  - 对现有架构/契约的影响
  - 是否需要代码迁移
- 已确认需求如果改变，必须通过新的决策记录覆盖，不直接删除历史。
- 本文负责“还有什么需要定”；正式架构结论继续进入 `docs/architecture/`。


## 13. Toolbox 拖放与高级设置

**状态：已确认首期行为 / 高级设置延期**  
**优先级：P0**

### 首期行为

从左侧 Toolbox 将 Application 或 Ledger 拖入 Canvas：

1. 保存该对象在当前 EOG Graph 中的引用/出现；
2. 保存必要的 View State（位置、布局等）；
3. 不创建新的 Application；
4. 不创建新的 LedgerDefinition；
5. 不创建或修改 PostingRule；
6. 不安装新的业务应用；
7. 不修改 Runtime Definition。

因此：

> **Drop = 把已有权威对象加入这张投影图，而不是创建企业对象。**

### 已有关系的显示

如果被放入画布的 Application / Ledger 在 Runtime Definition 中已经存在 Posting 关系，EOG 可以读取并显示该关系及其条件/方向。

这属于“投影已有定义”，不是“Drop 创建关系”。

### 新增 Application / Ledger

EOG 首期明确：

- 不新增企业 Application；
- 不新增企业 Ledger。

这就是当前“不做新增”的精确定义。

PostingRule、关系、Graph、Subgraph 等是否允许新增或修改，不由这条规则决定，后续分别确认。


## 14. “不新增”的精确定义

**状态：已确认**  
**优先级：P0**

EOG 加载默认模板后允许裁剪和修改。

当前“不新增”只锁定两类企业运行对象：

1. 不新增企业 Application；
2. 不新增企业 Ledger。

它不应被扩大解释为“EOG 不能新增任何东西”。

例如新增 Graph、Subgraph、投影节点、关系、PostingRule 等能力，仍按对应需求单独讨论和确认。

因此：

```text
Default Template
→ EOG 加载
→ 对已有 Application / Ledger 做选择、裁剪、恢复、修改
→ 不在 EOG 内创建新的企业 Application / Ledger
```


## 15. EOG 保存 / 软件版本 / Runtime 激活

**状态：已确认核心模型**  
**优先级：P0**

### 三层版本

```text
Ledger Runtime Spec v1.0 = 硬件规格
Enterprise Template / Package v1.x = 企业软件版本
EOG Graph Revision = 投影修订
```

### 已确认规则

1. EOG 可以对 Enterprise Template v1.0 做局部或全部 Application ↔ Ledger 投影。
2. 纯投影修改只保存 Graph Revision，不产生 Enterprise Template 新版本。
3. EOG 首期不新增企业 Application / Ledger。
4. 修改受治理的 Application ↔ Ledger Posting relationship 属于软件语义变化。
5. 软件语义修改先进入 Working Draft，不直接改写已生成版本。
6. `Save` 与 `Create Version` 是两个独立动作。
7. `Create Version` 产生不可变的新 Enterprise Template Version，例如 v1.1。
8. 生成版本不等于上线。
9. Enterprise Administrator 决定何时把哪个兼容版本 Activate 到企业 Ledger Runtime。
10. EOG Save 永远不能自动升级 Runtime。

### 下一步待明确

- Posting relationship 编辑的具体字段/条件范围；
- Working Draft 是否支持多人协作；
- Version 命名规则（SemVer 或内部序列）；
- Activate 是否支持定时生效；
- Runtime 切版本时是否需要 Replay / Re-posting；
- 回滚到旧软件版本的边界。
