# EOG 待明确需求清单 v0.1

**状态：** 持续收敛  
**语言：** 中文  
**日期：** 2026-10-04  
**用途：** 作为 EOG 插件族的需求澄清入口。后续按编号逐项讨论、确认并回写；未确认项不得自动升级为实现约束。

---

## 0. 已确认边界

以下内容已经确定，不再作为待讨论项：

- Enterprise Context 是 Enterprise Graph Definition 的权威来源。
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

## 1. EOG 最终表达哪些企业对象

**状态：已确认**  
**优先级：P0**

### 决策

EOG 最终目标不是“应用—账本运行图”，而是**完整企业建模工具 / 企业全景图**。

EOG 原则上可以表达企业中的全部对象。对象类型不预先设上限，也不把当前 Application / Ledger 视为最终固定集合。

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

EOG Designer 采用类似 Visio 左侧图形库的“企业对象工具箱”。

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

### 自动画图

“根据企业数据自动画图”暂不作为 EOG Designer 本体功能实现。

未来由：

- Personal Agent；
- 其他 Agent；
- 或其他上层智能能力

调用 EOG/Enterprise Context 的公开建模能力生成或修改图。

因此 EOG 需要提供**确定性、可组合、可由 Human 与 Agent 共用的公开建模命令**，但 EOG 本体不负责自动推理“应该画什么”。

### 明确不做什么

- 不把企业对象范围锁死为 Application / Ledger。
- 不在 Eidos 中硬编码任何企业对象类型。
- 当前不实现“AI 自动画企业图”。

### 架构影响

- Enterprise Context 仍负责企业对象/关系定义权威。
- EOG 负责把这些企业对象投影成可建模的节点、关系和工具箱项。
- Eidos 只提供通用 Toolbox / Shape / Interaction 机制。

---

## 2. 节点和连接线的业务语义

**状态：待明确**  
**优先级：P0**

需要冻结节点与关系的领域语义，而不仅是画布元素。

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

**状态：待明确**  
**优先级：P0**

已确认 Designer 可以编辑，Viewer 不可以编辑；但 Designer 的最终产品深度尚未冻结。

### 需要回答

Designer 是：

- 轻量企业拓扑编辑器；
- 还是完整企业建模工具？

候选能力包括：

- 新增节点
- 删除节点
- 新增关系
- 删除关系
- 属性编辑
- 拖拽布局
- 多选 / 框选
- 批量编辑
- 复制 / 粘贴
- 撤销 / 重做
- 对齐 / 分布
- 自动布局
- 分组
- 折叠 / 展开
- 子图
- 锁定
- 快捷键
- 节点模板
- 关系模板

需要逐项确定哪些属于 EOG Designer，哪些属于 Eidos 2D Core 的通用编辑能力。

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
