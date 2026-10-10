# EVO 2D Designer — 研究资料与决策参考索引 v1.0

**整理日期：** 2026-10-10（UTC+08）  
**本轮研究原稿日期：** 2026-10-09（UTC+08）  
**维护范围：** Eidos 2D Workspace / EVO-App-Platform EOG 2D Designer、Viewer、Projection。  
**入口：** [EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md](./EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md)  
**完整基线原文（已按字节读取文本并对比 GitHub 内容一致）：** [EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)

> 本索引只记录有据可查的来源。每个外部官方页面在 2026-10-10 已再次打开网页正文核对；2026-10-09 的首次查阅时间取自完整需求原稿 §16。原网页可能更新；下方保留的是复核当日的章节定位、摘要和项目判断，不是网页永久快照。未保存或实际查看过的图片，不称作“已存档截图”。

## 0. 阅读等级、事实层次和验收等级

- **已读原文**：在本交接整理时直接读取网页正文、Github 文档正文或完整基线 Markdown。原文事实以 **[事实]** 标识。
- **仅看搜索摘要**：见到搜索结果/PR 摘要，但尚未直接读取对应正文；必须保留此限制。不要把 PR 标题当作实现或测试证明。
- **待验证**：链接只在文档中引用、当前尚未核原文；或者用户环境、浏览器实际行为、实现满足度尚未实测。
- **[项目决策] / [工程判断]** 不等于外部来源所要求或保证的行为。项目阈值、默认值、阶段划分皆为 EVO 方案，不宣称业界统一标准。
- **CI 通过** 仅表示配置的自动检查成功，不自动意味着 V01–P02 的任一真实设备人工验收通过。测试未运行的项目一律标记 **NOT TESTED**。

## 1. 外部官方研究资料：S1–S7

### S1 — Miro: Using Miro with a mouse, trackpad, or touchscreen

- **原始网址：** https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen
- **查阅日期与状态：** 2026-10-09（需求稿记载）；2026-10-10 再读原文，**已读原文**。
- **章节：** “Using Miro with a mouse, trackpad, or touchscreen”；“Switching between the pan and select tool”；“Navigation on the board”；Frequently asked questions。可由页面 Ctrl+F 以上标题定位。
- **[事实] 核查内容：** 鼠标右键拖动可平移画布，滚轮缩放；Select 工具下空白拖动创建选择范围。触控板双指移动用于平移、捏合缩放。触摸移动画布、捏合缩放；触摸端 Miro 提供长按拖动选择。Mouse / Trackpad 的导航偏好可以明确选择；Select / Hand 用 V/H 切换，并有 Space+左键临时平移。
- **[项目决策] 用途：** Eidos 选择与手形工具、明确的鼠标与触控板偏好、右键移动视角、双指导航的参考；不照搬 Miro“长按框选”作为手机唯一入口（对应 M01/M05/M07/T01/T06）。
- **限制：** Miro 对其自身权限/产品状态的约束不能推断成 EVO 的 Host 授权模型。交互手感需要真实浏览器验证。
- **图例位置：** 原网页内 “new-mouse-trackpad.png”“select_and_hand_mode.gif”“minimap.png”插图；**未单独截屏或存入仓库**。

### S2 — React Flow: Panning and Zooming

- **原始网址：** https://reactflow.dev/learn/concepts/the-viewport
- **查阅日期与状态：** 2026-10-09；2026-10-10 再读原文，**已读原文**。
- **章节：** “Viewport configurations” → “Default viewport controls” / “Design tool viewport controls”。页面在本次核对显示 Last updated August 31, 2026。
- **[事实] 核查内容：** React Flow 默认是地图式：拖拽平移、滚轮/捏合缩放、Shift+拖动选择；官方同时演示设计工具式配置：普通拖动框选，中键/右键/Space+拖动平移，滚动平移，捏合或修饰键滚动缩放。文中出现 panOnScroll、selectionOnDrag、panOnDrag 参数。
- **[项目决策] 用途：** EVO 的建模画布选择 **design-tool** 心智模型，而不沿用 map-first 左拖空白即平移；只借鉴设计，不引入 React Flow 框架。映射 Eidos surface.ts / viewport.ts、M01–M09。
- **限制：** React Flow 自身的 props、React 实现并非 Eidos 现有 API；只有交互模型可借鉴。

### S3 — draw.io: Style connectors

- **原始网址：** https://www.drawio.com/docs/manual/styles/connector-styles/
- **查阅日期与状态：** 2026-10-09；2026-10-10 再读原文，**已读原文**。
- **章节：** “Style connectors”；Style 选项；Line style、Colour、arrow heads 等段落。
- **[事实] 核查内容：** 文档把转角（sharp / rounded / curved）、颜色、线条与箭头设置分别处理；说明新版 curved 路由标签可以放到真实曲线上（页面列出 v32.2.1 相关行为及旧标签位置迁移提示）。
- **[项目决策] 用途：** 使用互相独立的展示字段 \`pathKind\`、\`style\`、\`arrow\`；路径形状不代表真实业务方向，路径标签应跟随实际几何。映射 V01/V03/E04/E07。
- **限制：** draw.io 标签版本迁移与颜色方案不可直接当作 EVO 已实现功能。业务锁定的箭头与状态色不可被展示编辑器自由伪造。
- **插图：** 原网页 Style 面板与连线工具图片；**未另存**。

### S4 — draw.io: Work with waypoints on connectors to change their path

- **原始网址：** https://www.drawio.com/docs/manual/connectors/waypoints-connectors/
- **查阅日期与状态：** 2026-10-09；2026-10-10 再读原文，**已读原文**。
- **章节：** “Add waypoints to connectors”；“Enter the exact position of a waypoint”；“Remove a waypoint from a connector”；“Clear all waypoints”；“Move waypoints with the connected shapes”。
- **[事实] 核查内容：** 可通过拖动或上下文菜单增加/移除控制点；Arrange 面板能直接输入 Left/Top 坐标；Clear Waypoints 恢复最短路径；“Follow Terminals”是可选择策略，默认移动单个连接对象时控制点可保持原位，部分样式重新自动寻路。
- **[项目决策] 用途：** B3 数值与按钮微调、添加/删除/恢复自动路径、两端等量移动时跟随；不把手工点变成真实业务节点（E03/E05/E06/A02）。
- **限制：** 当前 B3 还缺真正拖动正交线段、精准控制柄与标签位置的完整交互；不可把“数值调整通过”当作 E03 完整 PASS。
- **图例位置：** Add/Remove/Clear Waypoints 章节插图；**未另存**。

### S5 — draw.io: Work with connectors in draw.io

- **原始网址：** https://www.drawio.com/docs/manual/connectors/
- **查阅日期与状态：** 2026-10-09；2026-10-10 再读原文，**已读原文**。
- **章节：** “Floating and fixed connectors”；“Draw a floating connector”；“Draw a fixed connector”。
- **[事实] 核查内容：** floating 端点可沿图形周界选位置；fixed 端点固定在指定连接点。同一条连接线的两个端可分别采用不同方式。
- **[项目决策] 用途：** B3 \`sourceAnchor\` / \`targetAnchor\` 独立配置 Auto/Left/Right/Top/Bottom，并且仅在原 source/target 上移动外观锚点（E02/E05）。
- **限制：** draw.io 拖线建关系的交互不能移植到 EOG 投影编辑，因为创建/重接业务关系需要 Host 明确授权。

### S6 — W3C WAI: Understanding SC 2.5.7 Dragging Movements

- **原始网址：** https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- **查阅日期与状态：** 2026-10-09；2026-10-10 再读原文，**已读原文**。
- **章节：** “Success Criterion (SC)”；“Intent”；“Relationship to keyboard accessibility requirements”；“Alternatives for dragging movements on the same page”；“Sufficient Techniques”。
- **[事实] 核查内容：** 对需拖动的内容交互，除特定例外外须提供不必拖动的**单指针**操作路径。仅有键盘可操作通常不足以自动满足本条；可点击按钮或数值输入是有意义的替代方式。
- **[项目决策] 用途：** 44px 触摸目标、路径点增删/坐标/微调按钮、非手势多选列表与节点位置输入应分别验收（T06/A02/E03）。
- **限制：** 本轮只读取规范解释，**没有完成 WCAG 全量符合性审计**；画布当前提供的控件并不保证所有拖动功能都有等效替代。

### S7 — MDN: Pointer events

- **原始网址：** https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- **查阅日期与状态：** 2026-10-09 原需求稿列为参考；2026-10-10 再读原文，**已读原文**。
- **章节：** “Pointer events” 事件列表；“Capturing the pointer”；“touch-action CSS property”。
- **[事实] 核查内容：** pointerup 表示正常指针抬起，pointercancel 是独立取消事件；捕获由 setPointerCapture / releasePointerCapture 管理，也可能在抬起或取消后隐式释放；touch-action 决定浏览器在某区域是否执行原生平移缩放。
- **[项目决策] 用途：** Eidos B4a 第二指到来立即取消未提交的节点移动、失焦回滚、禁止把取消当正常提交；限定画布自己的 touch-action，不关闭整页触摸或表单滚动（T02–T05/M09）。
- **限制：** 浏览器具体派发顺序必须 iOS Safari / Android Chrome 实测；MDN 文档不能证明某个应用的手势实现正确。

## 2. 项目权威与实现依据：原始路径、版本、阅读等级

下列 GitHub 链接属于**项目源码/项目文档**，不是第三方最佳实践。2026-10-09 原始需求稿 §2 和 §16 记录了对基线的查阅；下列 \`df6b09c\` / \`9920870\` 锚点使出处免受后续 main 漂移影响。2026-10-10 再读取了本表前七项的原文，且读取了最新 Eidos 2D 实施台账、App Platform 权限边界；其余标“原稿记录、待再次逐段核对”。

| ID | 文档 / 原始 URL（固定版本优先） | 状态 | 关键用途 |
| --- | --- | --- | --- |
| P1 | [Eidos Constitution](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/CONSTITUTION.md) | 已读原文（2026-10-10） | 保持确定性 Eidos 核心契约；不重复自造框架 |
| P2 | [Human Experience Design Authority](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md) | 已读原文 | 权威入口、体验层和设计决策优先级 |
| P3 | [Productive Design Language](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md) | 已读原文 | 生产型工作区的信息密度和交互层次 |
| P4 | [Business Office Visual Language v0.2](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md) | 已读原文 | 安静商务视觉、浅色卡片、令牌；规范对 P3 的视觉修订 |
| P5 | [Mobile Design Language](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/MOBILE-DESIGN-LANGUAGE.md) | 已读原文 | 手机是独立体验实现，不是缩小的桌面卡片；通用 UI 由 Eidos 负责 |
| P6 | [Icon System](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-ICON-SYSTEM-v0.1.md) | 已读原文 | 使用正式图标与可访问名称，不用插件内私造一套 |
| P7 | [Eidos Experience Architecture](https://github.com/jiangxng/eidos/blob/main/docs/architecture/EXPERIENCE-ARCHITECTURE.md)；[Web Delivery and Surface Architecture](https://github.com/jiangxng/eidos/blob/main/docs/architecture/WEB-DELIVERY-AND-SURFACE-ARCHITECTURE-v0.1.md) | 已读原文（2026-10-10，main 路径可变） | “Same truth and actions; surface-specific experience”，共享真相契约、允许不同 Surface 独立组合 |
| P8 | [Eidos 2D surface](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/src/diagram/surface.ts)；[viewport](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/src/diagram/viewport.ts) | 已读原文（本窗口持续审查后续分支） | 路径渲染、命中、相机、pointer 生命周期、实例隔离 |
| P9 | [EVO Ecosystem Project Boundaries](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md) | 已读原文（2026-10-10） | Eidos 通用交互 / App Platform 权限投影 / EVO 业务记账 / EC 经验学习分工 |
| P10 | [EOG 2D Projection Editor](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-touch-safety-b4-20261010/apps/eog-2d-designer/definition-projection-editor.ts) | 已读原文（2026-10-10，分支路径可变） | \`parsedViewState\`、Save/SaveAs、当前 revision、缩略图 |
| P11 | [Projection Gallery contract](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-touch-safety-b4-20261010/contracts/template-projection-gallery.ts)；[Template preview](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-touch-safety-b4-20261010/contracts/template-preview.ts) | 已读原文（2026-10-10） | edgePaths/anchors/waypoints 有效性与 2D Viewer 往返 |
| P12 | [Eidos implementation ledger](https://github.com/jiangxng/eidos/blob/feat/diagram-commercial-touch-cancel-b4-20261010/docs/architecture/DIAGRAM-DESIGNER-COMMERCIAL-IMPLEMENTATION-v0.1.md) | 已读原文（2026-10-10） | A1–B4a 演进记录、缺口/NOT TESTED、eidos 与 vendor 的差异 |
| P13 | [App Platform B3 integration note](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-waypoint-integration-b3-20261010/docs/architecture/DIAGRAM-COMMERCIAL-WAYPOINT-B3-INTEGRATION-20261010.md)；[B4a note](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-touch-safety-b4-20261010/docs/architecture/DIAGRAM-TOUCH-CANCEL-B4A-20261010.md) | 已读原文 / 代码伴随文档 | 下游功能与未验证边界；不要把阶段说明当合并授权 |
| P14 | [EVO Project boundaries at original snapshot](https://github.com/jiangxng/EVO-App-Platform/blob/9920870b09b39885614732d582b3f937fe2366ff/docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md)；[旧投影合同](https://github.com/jiangxng/EVO-App-Platform/blob/9920870b09b39885614732d582b3f937fe2366ff/contracts/definition-projection.ts) | 原需求稿 §16 已列，旧合同未在本轮重新逐段核对 | 审查增量兼容，而非将旧版 API 当当前主线 |

**精确代码定位：** Eidos \`src/diagram/surface.ts\`（页面契约、权限 opt-in、选择与手势、SVG hit/path、captured view state）；\`edge-paths.ts\`（四种路径）；\`obstacle-routing.ts\`（局部避障）；\`edge-lanes.ts\`（并行边与自环）；\`edge-waypoints.ts\`（固定锚点与路径点）；\`selection.ts\`、\`viewport.ts\`。App Platform \`vendor/eidos/src/diagram/\` 同构副本；\`apps/eog-2d-designer/definition-projection-editor.ts\`；\`eog/definition-projection.ts\`；\`apps/eog-2d-viewer/template-preview.ts\`；\`contracts/template-projection-gallery.ts\`、\`contracts/template-preview.ts\`；\`.github/workflows/diagram-designer-integration.yml\`。

## 3. 原始资料与出处完整性

- **已读原文 / 已归档：** 2026-10-09 编制的《EVO 2D Designer 商业化交互与视觉实施要求 v1.0》，完整约 44 KB / 578 行。原始会话/Library 记录曾有 \`EVO-2D-Designer-商业化交互与视觉实施要求-v1.0.md\` 与重名 (1) 副本；本轮从会话文件读取，并与本次 GitHub 新建的 \`EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md\` 内容逐字符核对一致。新窗口不需要再找失效的 sandbox 文件。
- **章节指引：** §1 推荐目标，§2 仓库基线/归属，§3 优秀做法表，§4 页面布局/模式，§5 节点视觉，§6 路径/锚点/标签，§7 鼠标，§8 触摸，§9 键盘/可访问，§10 布局/吸附，§11 保存/撤销/兼容，§12 性能预算，§13 A/B/C 阶段，§14 完整 39 项验收，§15 实施指令，§16 全部官方网址与项目依据。
- **没有声称访问过的额外来源：** tldraw、Excalidraw、Figma、GoJS、yFiles 的具体文档页面没有本窗口的可复核访问记录，不纳入“已读”索引。若后续需要对比请另行实际访问、记录日期。
- **仅看搜索摘要的记录：** 某些早期 PR 发现阶段曾通过 GitHub 搜索返回摘要，随后本窗口又读取了 PR metadata / 代码 / 实施台账；因此不再把其 PR 标题摘要当独立论据。未知的外站摘要不补造。
- **截图/附件位置：** 原始研究稿本身为纯 Markdown（没有页面截图）。S1/S3/S4/S5 官方网页有操作插图及标题（位置见各项），但本轮没有持久化本地截图/录屏到 GitHub。真实产品设备截图与性能录屏仍是未完成验收证据。

## 4. 方案对比：外部事实 vs EVO 自主选择

| 对比维度 | [事实] 来源支持 | [项目决策] 采用及理由 | 排除方案、适用条件与限制 |
| --- | --- | --- | --- |
| 桌面默认导航 | S1/S2 区分选择与移动模式 | 默认 Select；空白左拖框选；右键/中键/Space 移画布：符合专业设计器的可预测编辑路径 | 不选 map-first“空白左拖总是平移”；它适合 Viewer/地图读图，但不适合默认编辑 |
| 手机交互 | S1 有触摸长按框选；S6 要求非拖动替代 | 单指优先阅读/选择；双指始终导航；用明确多选和可点击控制替代隐藏手势 | 不把长按作为唯一选择入口；手机仍需真实抽屉/旋转测试 |
| 连线路径 | S3–S5 把路径、控制点和连接策略分别管理 | \`straight\`、\`orthogonal\`、\`rounded-orthogonal\`、\`curve\` 四类；旧数据无 \`pathKind\` 仍为直线 | 不将 \`style=solid|dashed\` 重定义为路径，避免损坏纹理/箭头兼容 |
| 新旧默认 | 原研究稿 §1/§6 规定旧投影保持原样、新投影推荐圆角正交 | 推荐默认用于**新建投影**且有显式能力/迁移策略时；历史不强制批量改造 | 禁止刷新后旧边突然变折线；当前代码的实际“新投影默认”是否落实尚需检查 |
| 手工 vs 自动 | S4 控制点可增删、清空，Follow Terminals 可选 | 自动路由优先；有必要再编辑路径点，保存时存显式覆盖值；团组移动点跟随 | 不强制所有边都手工控制，避免复杂关系图维护失控；拥塞回退需 UI 可恢复 |
| 编辑框架选择 | S2 React Flow 提供示例；S3–S5 draw.io 有成熟 UI | **沿现有 Eidos Canvas/Contracts 增量实现**：资产保护、统一 Eidos 视觉与 App Host 权限、可替换的小型几何模块 | 不整体更换成 React Flow / draw.io；若未来必须引入库，先评估许可证、体积、边界、迁移成本 |
| 模块所有权 | P1/P5/P9 | Eidos 持有通用 UI/renderer/input；App Platform 持有投影保存/权限/业务方向；Viewer/Designer 共用只读几何语义 | 不把 SVG 路由规则直接固化成 EOG 私有代码，不通过画布改变 source/target |
| 设备 Surface | P5/P7 同一语义可有不同实现 | 允许独立手机布局/工具条/抽屉，复用展示/操作合同 | 不强制一套大桌面 DOM 靠媒体查询缩小；也不复制一套不同业务规则 |

## 5. 冲突 / 张力 / 尚未解决的工程问题

1. **Miro 长按框选 vs EVO 明确多选工具：** 来源事实不冲突，是产品策略不同。已采用显式入口；T06 仍 **NOT TESTED**。
2. **React Flow map-first 默认 vs design-tool 配置：** 官方同时存在两套；EOG Designer 用后者，Viewer 可按只读导航需求选择，不能把默认 API 误当规范。
3. **旧投影直线 vs 新投影圆角正交：** 旧数据兼容优先，原需求建议新投影默认圆角；尚须审计新建入口是否真的做到，不得声称已完成。
4. **draw.io Follow Terminals 可选 vs Eidos B3 当前跟随规则：** 已实现“两端等量移动 → 手工点等量跟随；仅动一端 → 点保持”；复杂旋转/缩放/锁定未认证。
5. **B1 避障失败：** 当前几何返回 \`congested=true\` 并回退旧折线路径，可能穿越节点；这不是“保证绕开障碍”，真正用户可见的解释、修复与路径冲突治理未完成。
6. **B2 高密度并行边：** 简单稳定错位可减少重叠，但可能在窄节点边缘拥挤、标签/箭头互盖；E02 密图验收未完成。
7. **B3 曲线与人工标签：** 路径控制点数值功能与展示往返已有 CI；精准拖动控制柄、标签独立位置/点击选择、折线段法向拖动尚未实现完毕。
8. **W3C 替代操作 vs 当前实现：** B3 有坐标和微调，但框选/群组操作在手机上是否具备完整单指替代未确认，不能声明符合 WCAG 2.5.7。
9. **B4a Pointer Events 分支与浏览器事实：** 第二触点/失焦取消逻辑已有静态和 CI 证据；pointercancel、pointer capture、触摸转捏合在 iOS/Android 的真实顺序需要 T02–T05 实验。
10. **保存冲突：** 现有定义修订校验不等于同定义下投影并发编辑恢复。原需求 D05 要求双窗口/Agent 修改后不可静默覆盖，需审查投影修订令牌与 UI 恢复选择。
11. **Vendor 保护：** Eidos 上游 \`src/diagram/surface.ts\` 与 App Platform \`vendor/eidos/src/diagram/surface.ts\` 存在上下文导航差异；历史集成刻意移植上游差分，后续合并/同步不得整文件覆盖。
12. **多个 CI 通过 vs 39 项验收：** 不得等同。尤其 E03、E06/E07、T04/T05/T07、D03/D05/D06、A01/A02、P01/P02 仍缺完整真实证据。

## 6. 实施版本与验收映射

### Eidos 通用能力

| 切片 | PR | 参考事实 | 主要模块 | 验收关联 |
| --- | --- | --- | --- | --- |
| A1 | [#130](https://github.com/jiangxng/eidos/pull/130) | S3 | \`edge-paths.ts\` / \`surface.ts\` | V01/V02/E04 |
| A2 | [#131](https://github.com/jiangxng/eidos/pull/131) | S1/S2 | \`selection.ts\`, \`viewport.ts\`, \`surface.ts\` | M01–M09/T01 |
| A3 | [#132](https://github.com/jiangxng/eidos/pull/132) | S3 | \`surface.ts\` captured \`edgePaths\` | V01/D02 |
| B1 | [#133](https://github.com/jiangxng/eidos/pull/133) | S3/S4；项目工程判断 | \`obstacle-routing.ts\`, \`edge-paths.ts\` | E01 |
| B2 | [#134](https://github.com/jiangxng/eidos/pull/134) | S5；项目判断 | \`edge-lanes.ts\` | E02 |
| B3 | [#135](https://github.com/jiangxng/eidos/pull/135) | S4/S5/S6 | \`edge-waypoints.ts\`, \`surface.ts\` | E03/E05/E06/A02 |
| B4a | [#136](https://github.com/jiangxng/eidos/pull/136) | S1/S7 | \`surface.ts\` touch capture | T04/T05/M09 |

### App Platform 关联集成

| PR | 源 Eidos 链路 | 保存/Viewer 位置 | 关联验收 |
| --- | --- | --- | --- |
| [#537](https://github.com/jiangxng/EVO-App-Platform/pull/537) | A1–A3 | projection editor、gallery contract、Viewer、SVG thumbnail、vendor | D01/D04 |
| [#547](https://github.com/jiangxng/EVO-App-Platform/pull/547) | B1–B2 | vendor geometry integration | E01/E02 |
| [#549](https://github.com/jiangxng/EVO-App-Platform/pull/549) | B3 | capture/parser/gallery/projection/Viewer/thumbnail | E03/E05/D04 |
| [#550](https://github.com/jiangxng/EVO-App-Platform/pull/550) | B4a | vendor touch and diagram CI | T04/T05 |

**证据分类：** 以上表示“目标实现模块及 CI 可跑路径”，不是验收项 PASS。Eidos \`npm run release:check\` / CI 曾通过；App Platform \`Diagram Designer Integration CI\`、\`Platform CI\`、\`Project Continuity CI\` 已对本链路最近提交通过。实际浏览器/设备测试和 P01/P02 性能测试均**NOT TESTED**，参见完整基线 §14 的 39 项表。

**性能目标来源：** 原需求稿 §12 提议：桌面 200 节点/400 边约 60fps，桌面压力 500/1000 至少 30fps，手机 100/200 至少 30fps，主要交互反馈约 100ms。这是**待测目标、非已测数值**。

## 7. 继续研究与保存证据优先级

1. **第一优先：实际浏览器手势模型。** 从 S7 指针生命周期与 S1/S2 导航区分出发，为 T02–T05、M05–M09 建立真实 Playwright/browser/设备验证；记录 UA、设备、事件顺序、视频。不能只做静态正则。
2. **第二优先：并发保存与失败恢复。** 细读实际投影事务/版本边界，分别构造双窗口旧状态保存、Agent 同时更新、网络失败重试；附保存前后对象快照。用 D03/D05/D06 验收。
3. **第三优先：专业线段编辑。** 结合 S4/S5 路径/端点机制，验证曲线控制点与转直线提示、可撤销路径重置、节点密集时标签和选择消歧、路径拥塞 UI（E01–E07）。
4. **第四优先：对齐吸附与可访问替代。** 原需求 §9/§10 的格点吸附、对齐辅助线、固定布局与可点击操作；以 S6 为规则来源，A01/A02/T06 为验收。
5. **第五优先：性能与多实例。** 参照原需求 §12/§14 压力数据，测真实图型与 P01/P02，不把本地纯函数测试当 60fps 证明。
6. **版本/外部变动：** 官方 Miro、draw.io、React Flow、MDN 文档可随时修订。今后若一个来源规则影响代码决策，记录再次阅读日期、栏目、代码提交、浏览器实测与所采用的取舍。

**本索引不是任何 PR 的合并或生产部署授权。**
---

## 2026-10-10 追加记录：B5a 新窗口接续（不改前述研究事实）

**来源等级：** 本次接续窗口已直接读取两仓库最新源码、已列项目架构文档和 CI 日志；S1–S7 第三方官方页面**本次没有重新打开**，仍只继承上文记载的 2026-10-09/10 原文复核状态，不能把本次编码当作官方来源再次核验。

**落实的既有决策：** 由 Eidos 提供手工路径点/正交线段的图上控制柄，使用项目要求的 44px 命中目标、单次撤销和取消回滚；App Platform 只按差异移植 Eidos 的相关函数/交互，保留 Host `renderContextNavigationV010`。源/目标、业务箭头、业务关系及原始投影兼容语义不更改。这些是 **[工程实施/项目判断]**，并非 S4/S6/S7 声称的项目实现情况。

**新增代码与审查入口：**
- Eidos [B5a Draft PR #137](https://github.com/jiangxng/eidos/pull/137)，基于 #136：`src/diagram/edge-waypoints.ts`、`surface.ts`、`tests/diagram/diagram-visual-handles.test.mjs`、`docs/architecture/DIAGRAM-B5A-VISUAL-HANDLES-20261010.md`。测试曾因 Node test glob 的发现范围与 TypeScript NodeList DOM iterable 约束调整，最终以 PR 当前 SHA / CI 为准。
- App Platform [B5a Draft PR #553](https://github.com/jiangxng/EVO-App-Platform/pull/553)，基于 #550：`vendor/eidos/src/diagram` 定点移植、`tests/integration/diagram-visual-handles.test.mjs`、`docs/architecture/DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md`（从基线 §14 提取完整 **39 项**，初始全部 NOT TESTED）、`docs/architecture/DIAGRAM-COMMERCIAL-RESEARCH-DELTA-B5A-20261010.md`。上述新增文件位于该**独立 PR 分支**，不要在 main 中直接寻找。
- 核心新增可验证风险：App Platform `definition-projection-editor.ts` 用**业务定义 revision** 校验保存；`providers/enterprise-context/definition-projection-store.ts` 当前 `put` 对相同定义 revision 的 gallery 直接替换。独立投影版本/CAS、两个窗口冲突提示与保留草稿尚未实现。此结论来自阅读当前源码，是**[工程审查发现]**，不是成功执行过的双窗口冲突测试。

**验收等级：** B5a 几何/源码测试和 GitHub CI 只能证明其检查覆盖范围；没有录制或保存真实设备截图/录像。E03、D03、D05、T04/T05、P01/P02 与其余 §14 项仍不能凭本记录标为真实设备 PASS。所有新 PR 继续不合并、不部署。下一窗口请先刷新 #137/#553 最新 head SHA、完整 CI、39 项矩阵与可能的主线冲突。

---

## 2026-10-10 追加：B7 保存并发安全专项

**新窗口直接阅读的仓库证据：** App Platform `providers/enterprise-context/definition-projection-store.ts` 原始 `put` 是按 `(enterpriseId, definitionId, definitionRevision)` 替换 gallery，业务 `definitionRevision` 不因投影编辑改变；`apps/eog-2d-designer/definition-projection-editor.ts` 原 `SAVE` 仅核对业务定义版本；Eidos `src/diagram/surface.ts` 原先 await 写请求并在成功后直接载入服务端状态和清空历史。这解释双窗口覆盖与“保存期间后续编辑被旧响应抹除”的风险。标记为 **[已读项目源码并形成的工程判断]**，不是外部参考网站结论。

**采用的方案和适用边界（工程决定）：**
- Eidos [Draft PR #138](https://github.com/jiangxng/eidos/pull/138)，基于 B5a #137：用通用可选不透明 `writeToken` 发送 `expectedWriteToken`，阻止同一 mount 的重入保存，失败保留草稿，延迟成功时比较本地编辑指纹，避免直接覆盖本地新增修改。Eidos 不解析或签发版本。
- App Platform [Draft PR #561](https://github.com/jiangxng/EVO-App-Platform/pull/561)，基于 B5a #553：投影 gallery 有独立递增版本；存储 `putIfVersion` 提供 CAS；文件 provider 在本地文件系统用 `.lock` 目录包裹读-比较-替换；选中的每次保存都比对独立令牌，失败返回 `DEFINITION_PROJECTION_WRITE_CONFLICT`。Host 权限和业务定义仍单独检查。见新文件 `docs/architecture/DIAGRAM-B7-PROJECTION-CAS-20261010.md`（位于 #561 分支）及 Eidos `docs/architecture/DIAGRAM-B7-HOST-WRITE-TOKEN-20261010.md`（位于 #138 分支）。
- 兼容限制：旧客户端请求可缺少 token，暂退化为不安全的当前版本；作为已识别上线门槛，需迁移后强制提供。文件锁对于崩溃遗留会失效关闭，分布式后端必须另提供原子 CAS；不能声称已经做了跨节点并发验收。
- 验证：新增双窗口旧令牌拒绝、读取新令牌后重试、memory/file CAS、历史 snapshot 升级与 Eidos 命令透传测试。**CI 与实机结果按各 PR 当前 head 的 GitHub Checks 重新核对，不用此索引静态记录代替实时状态。** 浏览器 Save As 交互、冲突后可视化对比/草稿导出和 §14 设备测试仍未完成。

**外部资料状态：** 本次 B7 是沿既有 S1–S7 结论继续工程化；没有再次阅读外站正文、没有新增未经访问的资料条目或改变既定交互策略。原始研究索引标题、原网址及“原文/摘要/待验证”判定均保持不变。

**B7 追加恢复决策（工程增量）：** 在两个窗口拥有同一旧 token 的情况下，直接保存旧视图必冲突且不得覆盖原投影；但用户**明确选择另存为新投影**时，Host 使用新读取的 gallery+version 作为一个快照，追加新投影并以 CAS 提交，这能保留其他人的原投影及本地草稿。相关回归测试在 #561 的 `tests/integration/definition-projection-edit-save.test.mjs`；仍需真实浏览器验证。

---

## 2026-10-10 B7b 补充：发现旧客户端与 Agent 写入旁路

**本次证据类别：已读当前仓库源码并在 GitHub Actions 执行集成测试。** 上文已有的官方设计研究 S1–S7 的原始网址、来源等级及结论不变；本轮没有虚构或重新标记为已读外站的资料。

**[工程核查事实]** B7 #561 初始版人工 SAVE 对未提供 `expectedWriteToken` 的旧客户端采用当前最新版本替代，导致过期写入仍可能成功。独立 Direct Definition Projection Agent 与 Unified Personal Agent current-2D crop 工具调用无条件 `projectionStore.put`，绕过在编辑器内已经实现的 CAS。后者统一管理 Definition Projection 和 Enterprise Operating Graph，必须避免将不同 View 的 revision 混同。

**[新决策与实现]** 在独立 [App Platform Draft #563](https://github.com/jiangxng/EVO-App-Platform/pull/563)（基于 #561）实施 B7b：编辑器无 token 写请求一律拒绝；两个 Agent 工具先 GET 暴露 `writeToken`，后续写入要求提交 `expectedWriteToken`；Definition Projection 统一 `getVersioned` + `putIfVersion`，Operating Graph 继续使用自己的 `view.revision` 检查。此改动收紧旧客户端兼容边界，理由是无 token 的静默覆盖不满足既有 D05 的防丢数据验收要求；它没有更改已确认的 2D 交互和路径设计。

**[实际自动验证]** 测试写入后重新读取，Agent 旧 token 被拒绝且不污染 gallery；Direct/Unified 两个工具路径和经营图原版本路径均有集成测试。首轮 [Diagram Designer Integration CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38009755579) 实际执行 42/42 PASS；Platform CI 同提交 PASS。后续 commit/最新 CI 需重新核对。详细说明在 #563 的 `docs/architecture/DIAGRAM-B7B-AGENT-CAS-WRITE-TOKEN-20261010.md`；§14 验收矩阵 D03、D05 仍不能从 Node 单测推断为浏览器实测通过。

**[限制/未决]** 旧客户端需升级并提供友好重试/刷新说明；尚无真实浏览器双窗口可视操作记录、真实 LLM 调用工具后的更新恢复、跨主机存储一致性和实机手势录像。这些保持 NOT TESTED；不得将 Draft PR 视为合并或上线。
