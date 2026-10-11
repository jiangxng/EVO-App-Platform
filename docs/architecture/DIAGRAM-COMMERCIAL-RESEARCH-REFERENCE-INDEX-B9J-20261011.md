# EVO 2D Designer｜研究资料与决策详细参考索引（接续 B9j，2026-10-11）

> **使用方式：** 本文是增量索引；快速入口为 [B9j 新窗口交接入口](./DIAGRAM-COMMERCIAL-RESEARCH-HANDOFF-B9J-20261011.md)。保留原始 [完整要求 v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)（§1–§16）、[2026-10-10 官方来源详细索引原稿](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)和[原交接入口](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md)。不重写/覆盖它们。
>
> **核心溯源区别：** 2026-10-11 当前聊天窗口**没有直接打开 S1–S7 外部官网**；本次直接读取的是上述 GitHub 研究原稿和项目代码、提交、PR/Actions。原稿明确记录 S1–S7 在 **2026-10-09 初读、2026-10-10 重新读原文**。所以表中“历史：已读原文”仅引用原稿的历史访问声明；“当前：读 GitHub 存档，未重新访问官网”不能写成当前原文复核。若当前官网内容已更新，需下个窗口定向重新访问后追加新的日期和差异。不能从 PR 标题、搜索摘要或 CI 成功倒推出未做的研究/实机验收。

## 1. 证据分级与文字标识

- **历史已读原文 / 当前仅已读 GitHub 研究存档**：S1–S7 各自的官方网页正文在 2026-10-10 的原研究索引有明确阅读记录、章节与摘要；本窗口没有重新浏览，因此原网页当前内容属于“待复核时效”，不是“本轮再读”。
- **本窗口已读原文**：经 GitHub 连接器获取的项目 Markdown、TypeScript / JavaScript、测试工作流和对应 commit 上的实际日志。它们是项目内证据，不是额外外部设计资料。
- **仅看搜索摘要**：此窗口没有任何仅凭外站搜索摘要就用于工程判断的新增来源；不能补造这一类 URL 或访问时间。GitHub PR 元数据只证明状态/标题，不等于代码全文或 CI 的实际行为。
- **待验证**：未本窗口重读的官网最新修订、真实设备输入、外部供应商方案、生产客户数据/数据库及正式商用签收。tldraw、Figma、Excalidraw、GoJS、yFiles 等没有经本窗口核实的官方文档，不列为“已阅参考”。
- 下文使用 **[来源事实]** 指已有文档明确陈述；**[本项目选择]** 指我们自己确定的默认/取舍；**[验证事实]** 指测试代码与 GitHub Actions 现场日志能证明的有限结论；**[推断/限制]** 不是外部来源的保证。

## 2. 外部官网参考 S1–S7（完整原始 URL、历史日期、章节、事实及落地）

### S1 — Miro: Using Miro with a mouse, trackpad, or touchscreen

- **原始网址**：https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen
- **主题 / 阅读等级**：选择/移动、鼠标/触控板/触摸屏；**历史已读原文**（原稿 2026-10-09 初读、2026-10-10 原文复核）；当前 2026-10-11 **只重新读取 GitHub 的 S1 摘要，没有重访官网**。
- **章节定位**：Using Miro with a mouse, trackpad, or touchscreen；Switching between the pan and select tool；Navigation on the board；Frequently asked questions。
- **[来源事实，取自历史研究存档]**：右键拖动画布、滚轮缩放；选择模式下空白拖动框选；触控板双指平移/捏合缩放；Select/Hand 可切换，V/H 与 Space 临时移动；触摸端有长按选择/移动做法。
- **[本项目选择/用途]**：给 Eidos 的 surface.ts / viewport.ts 桌面左键选择/框选、右键/Space 平移和触摸单指/双指区分设计提供依据；只借鉴交互手感，不借 Miro 的权限模型，不将长按变成手机唯一多选入口。需求映射 M01/M05/M07/T01/T06。
- **图片/可复访位置**：网页插图名 new-mouse-trackpad.png、select_and_hand_mode.gif、minimap.png；**没有下载/截图存入仓库**。下次如页面变更应对章节和图例重新核对。

### S2 — React Flow: Panning and Zooming

- **原始网址**：https://reactflow.dev/learn/concepts/the-viewport
- **主题 / 阅读等级**：地图型与设计工具型视口交互；历史 **2026-10-09 / 2026-10-10 已读原文**，当前仅读 GitHub 索引；原索引当时显示 Last updated August 31, 2026，**当前是否更改未验证**。
- **章节定位**：Viewport configurations → Default viewport controls / Design tool viewport controls。
- **[来源事实]**：默认 map-first 模式可拖动平移、滚轮/捏合缩放、Shift+drag 选择；官方还给出 design-tool 配置：普通空白拖动框选，右键/中键/Space+drag 平移，滚轮与捏合有差异；出现 panOnScroll、selectionOnDrag、panOnDrag 配置概念。
- **[本项目选择/用途]**：EOG Designer 采用 design-tool 模型；Viewer 可以偏读图导航。对应 Eidos viewport.ts / surface.ts 和 M01–M09；**不把 React Flow React props 当 Eidos 自己的 API，也不引入该框架运行时**。
- **截图/附件**：原稿无单独图片或网页快照；以页面章节、URL 和本索引摘要定位。

### S3 — draw.io: Style connectors

- **原始网址**：https://www.drawio.com/docs/manual/styles/connector-styles/
- **主题 / 阅读等级**：线型/转角/颜色/箭头解耦；历史 **2026-10-09 / 2026-10-10 已读原文**，本窗口只读存档。
- **章节定位**：Style connectors、Style options、Line style、Colour、arrow heads；原稿记载网页关于 v32.2.1 曲线标签跟随的更新说明，**该版本内容时效待复核**。
- **[来源事实]**：sharp/rounded/curved 转角、线色、端点箭头属于不同的显示维度；新版 draw.io 曲线标签处理与旧版迁移有关。
- **[本项目选择/用途]**：路径分为 straight / orthogonal / rounded-orthogonal / curve，保持 pathKind、style、arrow 独立；曲线标签基于实际几何；Eidos edge-paths.ts、surface.ts 及 EVO 投影 edgePaths，映射 V01/V03/E04/E07。**业务方向由 source/target 语义决定，不能让美化箭头伪造事实**。
- **图片**：官网 Style 面板/连线工具插图；**未独立归档**。

### S4 — draw.io: Work with waypoints on connectors to change their path

- **原始网址**：https://www.drawio.com/docs/manual/connectors/waypoints-connectors/
- **主题 / 阅读等级**：手工路径点/清空/跟随；历史 **2026-10-09 / 2026-10-10 已读原文**，当前只读存档。
- **章节定位**：Add waypoints to connectors；Enter the exact position of a waypoint；Remove a waypoint from a connector；Clear all waypoints；Move waypoints with the connected shapes。
- **[来源事实]**：通过拖动/菜单增加删除 waypoint，Arrange 面板可输入坐标；清除恢复自动路径；Follow Terminals 在该产品中属于可选策略，单端变化时的处理可不同。
- **[本项目选择/用途]**：Eidos edge-waypoints.ts / surface.ts 的拖动、数值微调、撤销、清除恢复自动、手工点保留；EVO gallery.edgePaths 保存路径但**不创建新业务节点**。映射 E03/E05/E06/A02。
- **图片**：该网页 Add/Remove/Clear Waypoints 相关操作截图在原页面正文，**没有本地快照或附件路径**。

### S5 — draw.io: Work with connectors in draw.io

- **原始网址**：https://www.drawio.com/docs/manual/connectors/
- **主题 / 阅读等级**：浮动端点和固定锚点；历史 **2026-10-09 / 2026-10-10 已读原文**，当前只读存档。
- **章节定位**：Floating and fixed connectors；Draw a floating connector；Draw a fixed connector。
- **[来源事实]**：浮动连接点可在图形周界，固定端点绑定固定位置；同条连接两端可分别设置。
- **[本项目选择/用途]**：sourceAnchor 与 targetAnchor 各自支持 Auto/Left/Right/Top/Bottom，不改变 source/target，也不允许 Viewer/Designer 擅自重连业务关系。对应 Eidos edge-paths / surface、EVO template-projection-gallery，映射 E02/E05。
- **图片**：参考网页操作插图，**未保存**。

### S6 — W3C WAI: Understanding SC 2.5.7 Dragging Movements

- **原始网址**：https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- **主题 / 阅读等级**：拖动必须有单指针非拖动替代（适用例外除外）；历史 **2026-10-09 / 2026-10-10 已读原文**，当前只读存档；规范当前是否更新**待复核**。
- **章节定位**：Success Criterion (SC)；Intent；Relationship to keyboard accessibility requirements；Alternatives for dragging movements on the same page；Sufficient Techniques。
- **[来源事实]**：需要拖动的功能通常需另有无需拖动的单指针操作路径；**只有键盘替代并不必然满足这个拖动准则**。
- **[本项目选择/用途]**：44px 点击/拖动目标、路径点菜单/坐标输入/可点击微调、多选列表及节点位置控制，映射 A02/T06/E03。**没有做过整站 WCAG 审计或实体辅助技术验收，不宣称合规 PASS**。
- **快照**：无仓库内持久化截图；标准原文仍以章节和官方 URL 定向重新核对。

### S7 — MDN: Pointer events

- **原始网址**：https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- **主题 / 阅读等级**：指针捕获、pointercancel、touch-action；历史 **2026-10-09 原需求列入 / 2026-10-10 已读原文**，当前只读存档。
- **章节定位**：Pointer events 事件列表；Capturing the pointer；touch-action CSS property。
- **[来源事实]**：pointerup 正常释放不同于 pointercancel；setPointerCapture / releasePointerCapture 与隐式释放存在；touch-action 影响浏览器原生触摸平移/缩放解释。
- **[本项目选择/用途]**：Eidos B4a+ pointer/touch lifecycle，在第二指、失焦或取消时恢复未提交草稿，不能把 cancel 当 Save；限制画布 touch-action，不禁止全页滚动/表单。映射 T02–T05/M09。
- **限制**：MDN 是 API 说明，**不是 Safari iOS/Android Chrome 产品操作验证**；未归档屏幕录像。

## 3. 项目内部研究与权威依据 P1–P14（不是外部官网的新增阅读）

下列标题/URL 由**已实际读取的 GitHub 原研究索引**复制核对。原索引声称部分文件 2026-10-10 已读全文；**本窗口并未重新打开 P1–P7、P9–P14 的每一篇原文件**，不可写成当前全部重读。P8 对应的后续 Eidos/App Surface 源码、本窗口的当前实现与 Handler/Store 源码则已单独经 GitHub 获取阅读。日期字段为原稿历史记载日期/本次审阅存档日期 2026-10-11。

| 编号 / 标题及项目原始 URL | 阅读等级 | 来源要点及对本项目的具体用途 |
| --- | --- | --- |
| P1 [Eidos Constitution](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/CONSTITUTION.md) | 历史已读，当前原文未重访 | Eidos 通用契约稳定、几何与 Surface 纯化；禁止业务写权限转移给可视化组件 |
| P2 [Human Experience Design Authority](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md) | 历史已读，当前未重访 | 控件层与整体体验设计优先级，保持设计权威来源 |
| P3 [Productive Design Language](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md) | 历史已读，当前未重访 | 工作区信息密度、工具区和可预测操作 |
| P4 [Business Office Visual Language v0.2](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md) | 历史已读，当前未重访 | 安静商务视觉；视觉系统更新优先于旧设计草案，样式不私造 |
| P5 [Mobile Design Language](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/MOBILE-DESIGN-LANGUAGE.md) | 历史已读，当前未重访 | 移动 Surface 有独立布局，不缩小桌面 UI；语义仍共用 |
| P6 [Icon System](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-ICON-SYSTEM-v0.1.md) | 历史已读，当前未重访 | 工具栏图标、语义和可访问名称依照 Eidos |
| P7 [Experience Architecture](https://github.com/jiangxng/eidos/blob/main/docs/architecture/EXPERIENCE-ARCHITECTURE.md) 与 [Web Delivery / Surface](https://github.com/jiangxng/eidos/blob/main/docs/architecture/WEB-DELIVERY-AND-SURFACE-ARCHITECTURE-v0.1.md) | 历史已读，当前未重访；main 链接可变 | 同一业务真相与动作、不同设备各自组合；当前变化须重新核验 |
| P8 [Eidos diagram Surface](https://github.com/jiangxng/eidos/blob/feat/diagram-commercial-congestion-summary-postselect-b8vw-20261010/src/diagram/surface.ts) 与 [Viewport 原快照](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/src/diagram/viewport.ts) | Surface 本窗口已读取分支原文；Viewport 只沿用历史索引 | Pointer 生命周期、几何计算、拥塞 count、SVG aria 和多实例；不能将 Display 数据当业务状态 |
| P9 [EVO Ecosystem Project Boundaries](https://github.com/jiangxng/EVO-App-Platform/blob/9920870b09b39885614732d582b3f937fe2366ff/docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md) | 历史已读，当前未重访 | Eidos / App Platform / 业务账本 / 经验上下文的职责分界 |
| P10 [EOG Projection Editor 保存入口](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-native-save-positive-b9j-20261011/apps/eog-2d-designer/definition-projection-editor.ts) | 本窗口以真实 Handler 调用及测试源阅读/运行为主；未重新通读此一完整源文件 | App authorized Save、writeToken、camera/placements/edgePaths 的保存与重载 |
| P11 [Projection Gallery contract](https://github.com/jiangxng/EVO-App-Platform/blob/9920870b09b39885614732d582b3f937fe2366ff/contracts/template-projection-gallery.ts) 与 [Preview contract](https://github.com/jiangxng/EVO-App-Platform/blob/9920870b09b39885614732d582b3f937fe2366ff/contracts/template-preview.ts) | 原研究已读，本窗口契约只随测试/应用代码定向核验 | 展示路径、控制点、可见性保存/Viewer 同口径，旧数据保持直线 |
| P12 [Eidos implementation ledger](https://github.com/jiangxng/eidos/blob/feat/diagram-commercial-touch-cancel-b4-20261010/docs/architecture/DIAGRAM-DESIGNER-COMMERCIAL-IMPLEMENTATION-v0.1.md) | 历史已读，当前未重访 | 最初 A1–B4 基线及未验收边界，补充较新 B8/B9 实测链 |
| P13 [App B3 integration](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-waypoint-integration-b3-20261010/docs/architecture/DIAGRAM-COMMERCIAL-WAYPOINT-B3-INTEGRATION-20261010.md) 与 [B4a touch](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-touch-safety-b4-20261010/docs/architecture/DIAGRAM-TOUCH-CANCEL-B4A-20261010.md) | 历史已读，当前未重访 | 早期路径/手势实现决定；后续修订应参考新的 B8/B9 证据 |
| P14 [旧边界快照](https://github.com/jiangxng/EVO-App-Platform/blob/9920870b09b39885614732d582b3f937fe2366ff/docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md) 和 [旧投影契约](https://github.com/jiangxng/EVO-App-Platform/blob/9920870b09b39885614732d582b3f937fe2366ff/contracts/definition-projection.ts) | 原要求 §16 记载；旧合同本窗口未重读 | 只用于审计版本/兼容历史，**不是**当前自动授权的依据 |

### 当前窗口进一步直接读取的项目原文（2026-10-11）

这些路径是本次对**代码或完整文档正文的直接 GitHub 阅读**，而非按标题猜测：

- [现 Eidos Surface](https://github.com/jiangxng/eidos/blob/8160cb63621ee7f1578c2de6a44ffe6d199cff6e/src/diagram/surface.ts) 和 [App vendor Surface](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/vendor/eidos/src/diagram/surface.ts)：实际 geometry.congested 生成与统计、显示 role=note；需要保护 App 特有的 Host contextNavigation，**不要整份覆盖**。
- [App edge-paths](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/vendor/eidos/src/diagram/edge-paths.ts)：当自动正交寻路被预算拒绝时显式 geometry.congested；不承诺所有路径避障。
- [App Projection Store](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/providers/enterprise-context/definition-projection-store.ts)：File Store 的真正 .lock 目录、读-比较-替换 CAS 和 tmp→rename，实测锁失败不偷锁。
- [App 定义投影构建](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/eog/definition-projection.ts)：已支持合法业务定义 payload.preview2d；应用投影时在展示层过滤 hidden node/edge、合并 placements、edgePaths、camera，不更改业务关系的 source/target。
- [Viewer 正式 GET](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/apps/eog-2d-viewer/definition-preview.ts)：正式 readonly Enterprise Definition Viewer，源数据来自 App ProjectionArtifactSource；不能通过显示层赋予保存权限。
- [投影编辑/保存集成测试](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/tests/integration/definition-projection-edit-save.test.mjs) 与 [真浏览器 34 tabs 脚本](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/tools/diagram-projection-browser-conflict-proof.mjs)：手工端点、CAS / conflict、防 503 草稿遗失、只读 Viewer 恢复。
- [最新真实 Chrome 原生 Save 专项](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/tools/diagram-saved-positive-browser-proof-b9i.mjs)：B9j 使用合法业务 preview2d、真正 App CAS File Store、Chrome 按钮 Save 和全新 Viewer DOM。

## 4. 采用方案与排除方案（事实和项目判断分开）

| 对比 | [来源事实/已经确认的产品事实] | [本项目已采用决定及理由] | 排除项、适用条件或限制 |
| --- | --- | --- | --- |
| Designer 导航 | S1 Miro、S2 React Flow 公开区分 Select/Hand 与 map-first/design-tool | 默认 Select、左拖框选、右键/中键/Space 平移；更适合用户的编辑工具预期 | **不采用** map-first 左拖空白一律平移；那更适合只读 Viewer/地图，可在独立 Viewer 考虑 |
| 路线形状 | S3/S4/S5 拆分 path/style/anchor/waypoints | 四类 straight、orthogonal、rounded-orthogonal、curve；旧关系无 pathKind 继续直线 | **不采用** 以 style solid/dashed 取代 pathKind，不自动把旧数据全部改成折线 |
| 自动避障 | Eidos 实现对局部障碍与计算有 22/2600 有界预算 | 安全优先、超预算明确 congested + 单条 aria 和画布摘要，由用户审查/局部调整 | **不采用** 无限全图 A*、提高预算掩盖失败、穿越节点还报告安全；性能/拥塞压力仍在 |
| 自动排版 | 原产品要求 §10 与用户已确定的职责原则 | 固定工具能力，可对当前可见投影执行、尊重锁定、可撤销；Agent 可触发但**不独占**排版算法 | 不将布局简单包装成每次都由 LLM 随机选择，不隐含更改原始业务图 |
| 折线拖动和 WCAG | S4 控制点操作、S6 Dragging Movements | 44px 操作热区、数值/按钮微调、Undo、取消回滚、非拖动替代 | **不声称**已有全量 WCAG 审计；不以仅键盘支持替代全部单指针要求 |
| 多触点处理 | S7 pointercancel/capture/touch-action API | 第二指/取消/失焦清理未提交拖动，双指负责导航，真实触控输入须复测 | 不把 pointercancel 当正常 pointerup Save，不依赖纯 JS 事件就宣称真机支持 |
| 画布技术选型 | S2 React Flow、S3–S5 draw.io 只是参考设计；P1–P9 规定既有项目边界 | 继续 Eidos 通用图形模块 + EVO App Platform 的投影/授权/Viewer；保留增量迁移可追溯性 | **不整体引入** React Flow、draw.io、GoJS 等取代 Eidos；若后续重选需单独许可/迁移评估 |
| 保存与投影业务语义 | 当前 App 实现分离 projection gallery writeToken 与业务定义 revision | 展示层 placements/edgePaths/hidden/camera 由 CAS 独立保存；Viewer 再读取；source/target 不可凭图形操作改变 | 不用无 token blind overwrite、无授权写、静默合并冲突，也不产生新业务定义版本 |
| 跨浏览器文字 | B8u/B8w GitHub Actions 真 Firefox/WebKit getBBox | SVG 排版允许浏览器字体度量差异，保留 source title/aria、256 昂贵测量预算与诊断 | 不要求跨引擎逐像素一致；Linux WebKit 不等于 iPhone Safari |
| 性能与忠实降级 | B8t Chrome 900/1200 全自动真实图确有 21/27 条 congested；inkQuality=full 只表示索引精度 | 逐条与画布级摘要诚实报告拥塞，role=note、pointer-events:none，0 时不显示 | 不把 inkQuality full 写成 100% 绕障，也不将单次 CI runner 时间当 SLA |

## 5. 资料之间的张力/工程冲突及未决问题

1. **S1 Miro 长按与显式手机工具**：外部网站描述自己的手势，EVO 选择显式手机多选；不是来源互相矛盾。缺 iOS/Android 真机与可访问性对照。
2. **S2 map-first 与 design-tool 同时存在**：属于不同使用模式；EOG 编辑器默认后者，Viewer 可读图优先；不能把 React Flow 默认选项误写成行业规范。
3. **旧 straight 与新投影默认 rounded-orthogonal**：兼容保护已确定，但“**全部新建入口是否实际默认圆角正交**”尚需各应用新建流程检查，不能从研究建议直接写成全产品已实现。
4. **S4 Follow Terminals 与当前手工点跟随**：当前产品支持特定同向等量移动/Undo 的测试范围，但复杂旋转、非等比例缩放和锁定节点组合未得到完整真设备证据。
5. **有界自动路由 vs 避障承诺**：300/900、400/1200 全自动图分别 21/27 个真实 congested。B8v 已诚实提示；应研究实际复杂企业图的误判率与用户纠正方案。**不以隐藏警告代替修复。**
6. **RTL 保真 vs 性能**：256 次昂贵 getBBox 上限是项目预算；选中共同节点后 258 条标签实际绘制。剩余标签可能无精确二次测量；继续测试动态字号/设备字体变化，不制造 258 全部精确验证的结论。
7. **规范 S6 非拖动替代 vs 当前页面**：有坐标/微调并不等于全部 gesture 都可替代。需要对触摸长按/段拖动/框选/群组选项做实际辅助技术和单指针审查。
8. **MDN API vs 手机硬件**：Chrome CDP 触摸或 Linux WebKit 引擎通过都不代表真实 iOS Safari/Android Chrome/触摸板行为；需要物理设备。
9. **业务投影只改可见性 vs 布局**：投影只是业务图可见性层、不是重接关系；Designer 编辑自身展示 placements 可以保留，但不能把节点坐标写回基础业务语义或替代 Agent 管控。
10. **测试文件持久化 vs 生产数据库**：B9d–B9j 的 Store 是正式生产文件实现，但 CI 临时文件/业务定义仓受控；它不是线上客户数据库、网络共享盘或部署后长时间稳定性。
11. **准许授权钩子 vs 真实企业身份**：B9g 已验证拒绝不落盘、B9f 两子进程 CAS 竞争，**仍未验证真实登录、多租户 policy 和生产授权提供者**。
12. **机器子场景 PASS vs §14 39 条商用签收**：原要求中的 39 条保持 **NOT TESTED**；除非有真实客户数据、实机/人审记录并逐条认领，否则不可从 GitHub 通过数量升级结论。

## 6. 本窗口新增工程实证索引（日期均为 2026-10-10/11，已读 GitHub 原文/日志）

以下是**直接核验的 GitHub 项目源/测试证据**，不是 2026-10-11 新打开的外部官方网页：

| ID / 入口（原始网址） | 已验证核心事实 | 对模块/验收的用途与限制 |
| --- | --- | --- |
| B8v/w [Eidos #158](https://github.com/jiangxng/eidos/pull/158) + [App #606](https://github.com/jiangxng/EVO-App-Platform/pull/606)，[Chrome #38060230522](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38060230522)，[Firefox/WebKit #38060230544](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38060230544) | Canvas route-congested 计数 21/900、27/1200 与实际 hit 一致；RTL 7×2 原生选择重绘；B8w 14/14；258 真实标签但 256 次昂贵复测上限 | Eidos Surface / App vendor Surface，屏幕阅读提示不阻挡鼠标；**合成图且不等于设备或 SLA** |
| B8x [App #607](https://github.com/jiangxng/EVO-App-Platform/pull/607)，[Actions #38060771821](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38060771821) | 真 Firefox/WebKit 同页双 Surface，第一个拥塞 1、第二个 0，SVG ID、选择状态各自独立 | 多实例隔离；不是不同企业真实权限隔离 |
| B8y [#608](https://github.com/jiangxng/EVO-App-Platform/pull/608)，[Actions #38061392320](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061392320) | 真浏览器隐藏障碍→Undo，拥塞 1→0→1 | 本地编辑状态与几何重算 |
| B8z [#610](https://github.com/jiangxng/EVO-App-Platform/pull/610)，[Actions #38061566920](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061566920) | 真鼠标移动 210px→Undo，拥塞 1→0→1 | Pointer 生命周期 / 重排 |
| B9a [#611](https://github.com/jiangxng/EVO-App-Platform/pull/611)，[Actions #38061894121](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061894121) | 未保存隐藏草稿拥塞 0，公共 refresh→1，真实 reload→1，其他实例 0 | 不将本地草稿误当持久化 |
| B9b [#612](https://github.com/jiangxng/EVO-App-Platform/pull/612)，[Chrome #38067528086](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067528086) | 真 App CAS Save→独立 Designer→readonly Viewer **0/0/0**，Viewer 无 Save | 零拥塞无假阳性，**不是**非零 CAS |
| B9c [#614](https://github.com/jiangxng/EVO-App-Platform/pull/614)，[Chrome #38067825029](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067825029) | Source 测试注入正数拥塞 Designer 1 / Viewer 1，role-note、pointer none | 非零 Viewer 可显示，**该正例未经 CAS 保存** |
| B9d [#615](https://github.com/jiangxng/EVO-App-Platform/pull/615)，[CI #38067979006](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067979006) | 真 Handler CAS Save→文件 Store 实例重建→readonly Viewer，隐节点/waypoint 仍存，旧 token 拦截；129/129 | 存储投影持久化；临时本地文件 |
| B9e [#617](https://github.com/jiangxng/EVO-App-Platform/pull/617)，[CI #38068173599](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068173599) | 两 Node OS 进程竞争**底层 File Store**，唯一获胜，孤儿锁 fail closed；130/130 | 多进程底层 CAS；不是两个 Web 用户 |
| B9f [#618](https://github.com/jiangxng/EVO-App-Platform/pull/618)，[CI #38068348194](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068348194) | 两个独立 **App Handler** 进程向同一文件 expected token 0 保存，恰一个成功；131/131 | App 保存路径并发；身份是模拟的 |
| B9g [#619](https://github.com/jiangxng/EVO-App-Platform/pull/619)，[CI #38068500982](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068500982) | 明确 deny→allow→deny：拒绝不创建/覆盖文件，Viewer 只见允许数据；132/132 | 授权拒绝写入不落盘；策略钩子受控 |
| B9h [#620](https://github.com/jiangxng/EVO-App-Platform/pull/620)，[CI #38068777299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068777299) | 合法 preview2d 23 障碍图通过真实 App CAS 保存文件，重建 Editor/Viewer Eidos geometry **拥塞=true**；再 CAS 隐藏后无拥塞；133/133 | 真正**保存的非零拥塞**；仅 Node 几何层 |
| B9i [#621](https://github.com/jiangxng/EVO-App-Platform/pull/621)，[Chrome #38069072194](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069072194) | 已保存非零拥塞真 Chrome Designer+Viewer 各 1；Node 再调用 Handler 清除后各 0 | 真 DOM/文件 CAS，但第二次 Save 非按钮操作 |
| B9j [#622](https://github.com/jiangxng/EVO-App-Platform/pull/622)，[最终 Chrome #38069498639](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069498639) | **真实鼠标节点选择→Remove from view（CAS 暂仍 1）→UI Save projection（CAS→2）→新 Designer/readonly Viewer 各从 1 恢复 0**，无 JS 错误/业务版本变化；该 run 是最终源分支文档 head **6740000086577a15c257e813ca6340ab2027410c** | 一条完整**受控合成合法企业图、真实 Chrome、正式 App Handler、文件 Store**的机器验收；仍非生产企业商用签收 |

## 7. 难再访问的证据、截图及原文位置

- **原始商业要求永久入口**：[B 类原稿 v1.0 §1–§16](https://github.com/jiangxng/EVO-App-Platform/blob/fb62efeda171f6ef5334a0b554fd0b4031979e84/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)。重点 §6 四种路径/锚点/标签；§7 鼠标；§8 触屏；§9 单指针替代；§10 吸附/固定排版；§11 Save/Undo/CAS；§12 性能；§14 **39 项正式验收**；§16 原始资料链接。原索引详情参见同提交 [S1–S7 资料档案](https://github.com/jiangxng/EVO-App-Platform/blob/fb62efeda171f6ef5334a0b554fd0b4031979e84/docs/architecture/EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)。GitHub commit 固定链接避免 main/分支变动。
- **原网站截图现状**：七个官网页面虽有上述标题和少量指定插图，但**本窗口没有原网站截图/视频、网页 PDF、HTML 原文全文或第三方图像文件存到 GitHub**。只保留原研究者记录的章节名、URL 与经过概括的事实；若官网将来下线，不能声称保存了可恢复的逐字官方副本。
- **机器日志与可追踪原图**：B8u 真实 Firefox/WebKit workflow 把文本日志上传为名为 **b8u-complex-real-firefox-webkit-label-proof** 的 GitHub Actions artifact；B9i/B9j 独立 Chrome workflow 把文本日志上传为 **b9i-saved-positive-chrome-dom**。可从对应 Actions run 的 Artifacts 查找，**这是输出日志，不是已保存网页截图**。每项 run 网址见上表，随 GitHub Actions 保留策略可能过期，故本索引保留重要数值和失败原因。
- **失败运行记录也保存**：[B8u 258 标签首次错误 #38058967083](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38058967083)（原因是未选中密图按设计不绘制标签，后修正 fixture）；[B9i 依赖缺失 #38069020504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069020504)（CI 未装 pinned Playwright）；[B9j selection-read 路由缺失 #38069271828](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069271828)（实际点选触发 GET，fixture 服务器原先只映射 GET/SAVE/VIEW，后补全部正式 App Handler）。都修正了测试环境，而不是压低业务安全检查。
- **性能保留数值**：300/900 全自动图约 21 条真实拥塞（2.33%）、400/1200 约 27 条（2.25%）；各次 CI runner mount/select/heap 受机器波动影响，不能拼成 A/B 算法速度保证。长程 12,001 关系 node-only 降级不能当成 12k 全自动正交验证。
- **GitHub PR 文档档案**：[B9b–B9g 子场景交接](./DIAGRAM-B9BG-SAVE-REOPEN-CAS-HANDOFF-20261011.md)、[B9h–B9j Chrome / Save 交接](./DIAGRAM-B9HJ-PERSISTED-NATIVE-CHROME-HANDOFF-20261011.md)、[39 项累计证据矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)，加本索引；不应因为 Chat 窗口关闭而丢失原始来源层级。

## 8. 最值得继续验证的方向及对应模块

1. **生产级真业务图**：使用**脱敏且有权限**的 S2C/P2P 合法业务 payload.preview2d 重做 B9j UI Save→App File/真实生产适配存储→独立 Viewer；记录真实数据量、版本、用户身份权限与缺失边、错误数。App eog/definition-projection.ts / providers/...-store.ts / apps/eog-2d-designer / apps/eog-2d-viewer，不能动别的窗口的 TR-01 代码。
2. **真实终端验证**：按原要求 §8/§9/§14 在 Windows Chrome/Edge、macOS Safari、真实 iOS Safari 和 Android Chrome 对鼠标/触控板/长按/双指、取消/Undo/Save/Viewer、辅助技术做原生人工/设备录屏。Eidos surface / viewport / mobile styles。自动化 Linux WebKit 不能替代。
3. **自动避障高密度调查**：复现 B8t 21/900、27/1200 的真实几何拒绝原因，辨别局部 22/2600 预算与真实障碍无法安全避让；先补障碍分布报告，再考虑不改变安全性的可解释建议/人工 fallback。Eidos edge-paths / obstacle-routing / surface。
4. **字体与可访问性**：按 S6/S7 规范逐条复核非拖动替代、RTL/CJK/Indic/ZWJ 字体、跨设备按键/屏读；给原 §14 的 T、A、P 各项**独立实测结果**，不是笼统 PASS。
5. **代码/产品状态同步**：保持 stacked Draft，审查当前 Eidos 与 App vendor 仅差分同步，且每次 CI 对应最终 SHA；如需改变已确认路线须新增明确官网原文/设备实证和理由，加入本索引或后续同目录的日期增量，不篡改本历史版本。

**最终保护规则**：原研究事实可以作为已查阅的历史资料继续复用，**不能把历史“官网已读”升级为“新窗口已核原文”**；CI 只能验证自动化覆盖的子场景，§14 39 项正式商业验收的整体状态仍为 NOT TESTED。
