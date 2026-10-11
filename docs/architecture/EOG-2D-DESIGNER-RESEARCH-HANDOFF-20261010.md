# 2D Designer 商业化升级 — 新窗口接续入口（2026-10-10）

> **入口文档，控制在快速阅读范围。** 如需来源、外部网页正文摘要、采用/排除方案、证据等级、章节和验收映射，立即打开同目录的 [详细参考索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)。初始研究的完整 44 KB 原文见 [商用体验 v1.0 要求基线](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)；不要靠聊天记忆重写要求。

**创建日期：** 2026-10-10（UTC+08）。**任务归属：** 本聊天窗口负责 2D Designer；用户确认之前断线留下的相关 PR 也是本窗口所做，**不属于主任务窗口的并行变更**。**协作边界：** 继续使用独立 stacked feature/docs 分支与 PR，不擅自合并 \`main\`、不部署、不修改全局交接/状态文件或无关业务模块。下述状态均以本次核验为准，新窗口仍须先刷新 GitHub。

## 1. 用户意图与不变要求

- 用户专指现有 **EOG 2D Designer** 体验不满意，希望由实施窗口整体改善，不应要求其逐条指出 UI 缺陷；2D Viewer 使用同一通用图形渲染能力。最终目标是商务人员能顺畅**打开 → 查看 → 选择/框选 → 移动 → 编辑关系路径 → 撤销/重做 → 保存 → 刷新/Viewer 复现**。
- 默认体验研究建议：安静商务视觉、圆角业务卡片、新投影采用圆角正交连线的推荐方向；旧投影**绝不被动改变**原直线外观；提供直线、直角折线、圆角折线、贝塞尔曲线。
- 鼠标左键选择/框选；右键、中键、Space 临时移动视角；触控板两指移动/缩放；触摸先阅读/选择、双指始终导航；手机采用适合屏幕的控件/抽屉，不照搬缩小版桌面。
- 编辑投影是**展示数据**操作，绝不能借“连线编辑”增加/删除应用、账本、业务关系，改变 \`source\` / \`target\` 或伪造箭头的真实业务方向。授权、保存、并发与版本校验留在 App Platform；Eidos 负责 UI/手势/几何。
- 不整体替换 Eidos、不擅自引入 React Flow/draw.io 作为项目运行依赖；保护已有代码和原有 App Host context-navigation 差异。**不要整份复制上游 \`surface.ts\` 覆盖 vendor 文件。**
- 用户本轮要求的是 **研究/决策交接包**，不是授权合并 2D Designer PR。目标交接包含：本入口、详细参考索引、原始基线全文三份独立文件。

## 2. 读文档顺序与可信度

1. **本入口**：范围、状态、分支与下一步。
2. [详细参考索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)：S1–S7 官方网址（2026-10-09 原研究、2026-10-10 原文复核）、P1–P14 项目依据、事实 vs 决策、取舍/冲突、模块映射及尚未完成的验收。
3. [完整要求基线 v1.0](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)：§1–§16，特别是 **§8 触摸、§11 保存/冲突、§12 性能、§14 全部 39 项验收清单、§16 原始来源链接**。该 GitHub 文件由先前会话的完整 Markdown 复制，经逐字符比对，**未删节、未改写**。
4. [Eidos 实施台账](https://github.com/jiangxng/eidos/blob/feat/diagram-commercial-touch-cancel-b4-20261010/docs/architecture/DIAGRAM-DESIGNER-COMMERCIAL-IMPLEMENTATION-v0.1.md)（随分支提交可变化）；[App Platform B3 保存集成](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-waypoint-integration-b3-20261010/docs/architecture/DIAGRAM-COMMERCIAL-WAYPOINT-B3-INTEGRATION-20261010.md)；[B4a 触摸安全](https://github.com/jiangxng/EVO-App-Platform/blob/feat/diagram-commercial-touch-safety-b4-20261010/docs/architecture/DIAGRAM-TOUCH-CANCEL-B4A-20261010.md)。

资料可信度分类：**已读原文 ≠ 自动化验证 ≠ 真实用户验收**。S1–S7 本次已重新打开官方页面核对；需要附录图例可按索引所记原网页章节查看。此轮**未生成、未保存**浏览器截图或测试录屏，设备兼容与性能数字均**NOT TESTED**。

## 3. 截止本交接的实际实施链路

### Eidos：所有 PR 当前均 open / not merged

| 阶段 | GitHub PR | 分支名 | 当前 head SHA（交接时） | 交付与限制 |
| --- | --- | --- | --- | --- |
| A1 | [#130](https://github.com/jiangxng/eidos/pull/130) | \`feat/diagram-commercial-paths-a1-20261009\` | \`acb18e7792ed4d34b79d36cb440e95b5922e1351\` | 四路几何、真实命中、标签、移动预览 |
| A2 | [#131](https://github.com/jiangxng/eidos/pull/131) | \`feat/diagram-commercial-selection-a2-20261009\` | \`d78c19c19c5bab7403f4825688ff4ac96386c1e8\` | 多选/框选、群组拖动、撤销、鼠标/触控板模式 |
| A3 | [#132](https://github.com/jiangxng/eidos/pull/132) | \`feat/diagram-commercial-projection-style-a3-20261009\` | \`59c83c007d8c2bc2118b553bc835db2ae018dfa6\` | opt-in 路径样式编辑和 view-state 捕获 |
| B1 | [#133](https://github.com/jiangxng/eidos/pull/133) | \`feat/diagram-commercial-obstacle-routing-b1-20261010\` | \`29a3a1424ef3516fb59fbb7364f4ea7ae1a62140\` | 有界局部正交避障，拥塞会明确回退 |
| B2 | [#134](https://github.com/jiangxng/eidos/pull/134) | \`feat/diagram-commercial-parallel-loops-b2-20261010\` | \`2d41535713dead2e1280dd8a85475fe8e5d4e4f7\` | 多边偏移、自环，密集图未实测 |
| B3 | [#135](https://github.com/jiangxng/eidos/pull/135) | \`feat/diagram-commercial-waypoints-b3-20261010\` | \`709fe88aba62cebcad9b21049df03210ae4a14d9\` | 数值/按钮路径点、固定锚点、撤销/群移跟随 |
| B4a | [#136](https://github.com/jiangxng/eidos/pull/136) | \`feat/diagram-commercial-touch-cancel-b4-20261010\` | \`0bbf25975cd966f13426e5b13b5c3044f197bd2c\` | 第二手指进入立即取消未提交节点拖动；真实设备未认证 |

**严格依赖：** Eidos **main ← #130 ← #131 ← #132 ← #133 ← #134 ← #135 ← #136**。上述列出的 head 是在 2026-10-10 读取 PR metadata 时观察值，若后续有提交必须更新，**不可凭旧 SHA 执行 merge**。

### EVO-App-Platform：所有 PR 当前均 open / not merged

| 阶段 | PR | 分支名 | 交接时 head SHA | 交付 |
| --- | --- | --- | --- | --- |
| A1–A3 | [#537](https://github.com/jiangxng/EVO-App-Platform/pull/537) | \`feat/diagram-projection-route-integration-20261009\` | \`f2694fbf4584fe8942e1a19094fa4d3bb30d3740\` | 样式、view-state、保存、Viewer/thumbnail |
| B1–B2 | [#547](https://github.com/jiangxng/EVO-App-Platform/pull/547) | \`feat/diagram-commercial-professional-routing-integration-20261010\` | \`82194ffd13d2bfef9aa95656b23a34d355b70d01\` | Eidos 避障/多边差分式 vendor 集成 |
| B3 | [#549](https://github.com/jiangxng/EVO-App-Platform/pull/549) | \`feat/diagram-commercial-waypoint-integration-b3-20261010\` | \`f8e20971dd795d9ea4bf9bb932d4429665ef7457\` | 锚点/路径点契约、存取、Viewer 和缩略图 |
| B4a | [#550](https://github.com/jiangxng/EVO-App-Platform/pull/550) | \`feat/diagram-commercial-touch-safety-b4-20261010\` | \`a5a20c1b3310f0869a9d12c50025aa92dbabb93e\` | vendor 手势保护、Diagram CI 新增 B1–B4 测试 |

**严格依赖：** App Platform **main ← #537 ← #547 ← #549 ← #550**；且每阶段依赖相应 Eidos 实现。不能只合并最后一个 PR 就假定它独立可用。

### 自动化、部署状态

- 以上 Eidos 切片的 CI 已在本窗口运行并有成功报告；Eidos 最后一段 B4a SHA \`0bbf259...\` 的 CI 成功。App Platform #550 SHA \`a5a20c...\` 的 **Platform CI、Diagram Designer Integration CI、Project Continuity CI** 皆成功。
- **已提交/CI 成功 ≠ 已合并/已部署/已实机验收。** 以上所有 feature PR 在本次核验时均未合并，**2D 商业化功能还没有在 production 上线**。CI 也未涵盖整个验收清单。
- 本窗口的文档归档位于新建的 **docs-only stacked 分支** \`docs/diagram-commercial-research-handoff-20261010\`，起点是 App Platform #550 的 \`a5a20c...\`；该分支只增加本交接的文档，不碰主任务窗口的文件/功能。其文档 PR 的 head SHA、URL 以后续 GitHub 返回为准。

## 4. 当前设计决策（不要重开已定论的争论）

| 决定 | 依据及限制 |
| --- | --- |
| **保持 Eidos 为图形/交互能力所有者**；App Platform 管理投影保存、版本、授权、业务含义 | Eidos Constitution、Mobile Design Language 和 App Platform project-boundaries；\`source/target/arrow\` 不可被展示编辑篡改 |
| **设计工具式交互优先，不复制外部框架** | 官方 Miro、React Flow、draw.io 资料是交互参考；React Flow 的默认地图式行为不等于 EVO Designer 产品规范 |
| **旧投影无 \`pathKind\` 必须维持直线**，推荐新投影采用圆角正交但需另查默认安装情况 | 兼容优先；展示 \`style: solid/dashed\` 是纹理而不是路径，箭头可能属于业务只读语义 |
| **路径/锚点以声明式覆盖值随 projection 保存**，Visualizer/Viewer/Thumbnail 均复现 | Eidos \`edge-waypoints.ts\` 与 App Gallery/Projection 契约；当前只支持受控坐标和侧边锚点，非自由 SVG |
| **桌面/手机可有不同 Surface 实现，共享契约** | Eidos Surface Architecture：“Same truth and actions; surface-specific experience”；必须真实测手机抽屉、键盘与选择 |
| **每个切片独立验证，不抢先合并** | 对主窗口改动及 App Platform vendor 的 context-navigation 保护；B4a 仍未通过真实设备矩阵 |

## 5. 未决风险与紧接着的任务（优先级）

1. **先重新核对事实**：两仓库最新 \`main\`、AGENTS.md（本次根目录查询未发现，不代表其他目录不存在）、PR bases/heads、check-runs、冲突、内置 vendor 与上游的有效差异。不要改写全局 HANDOFF 或自动把 PR 合并。
2. **补齐真实手势验收 T01–T07、M01–M09**：Windows Chrome/Edge 鼠标、macOS 触控板、iPhone/iPad Safari、Android Chrome。尤其第二指加入、释放指针捕获、取消/失焦、双指变单指；录屏/事件日志注明设备和版本。当前未做。
3. **实现 B 后续交互**：手工路径点和正交线段的可视控制柄拖动、线段限制、标签拖动/点击消歧、拥塞恢复提示、对齐/吸附、锁定位置、手机显式多选/底部属性抽屉。注意 Eidos UI 通用归属。
4. **验证保存失败与并发编辑**：投影保存 revision 是否阻止两个窗口互相覆盖？D03/D05/D06 必须有失败重试、本地草稿保留、版本冲突处理和多投影状态隔离；目前不能声称完成。
5. **性能与视觉验收**：使用 §12 规定的桌面 200/400、500/1000、手机 100/200 图规模，测 FPS/延迟，并测试同页多实例和负坐标、并行边、自环、长文本。无实测数据前 P01/P02 标记 NOT TESTED。
6. **维护明确验收矩阵**：以原需求 §14 的 V01–V06、M01–M09、T01–T07、E01–E07、D01–D06、A01–A02、P01–P02 的 **39 项**逐行记录 “PASS / FAIL / NOT TESTED”、证据类型及 commit。单凭 CI 不可把任意项目勾为“实机 PASS”。
7. **谨慎整合**：先按 Eidos stacked 顺序梳理，再按 App Platform stacked 顺序结合当前 main review/rebase，确保上下文导航差异保留。用户没授权本次交接进行 merge/deploy；如后续单独授权，先确认 CI/交互证据/变更范围，再执行。

**参考失落情况：** 现有研究稿完整原文以及 S1–S7 原始链接、重要章节和本轮新结论均已写入 GitHub。**未归档的不是研究文字，而是尚不存在的实机操作录像、浏览器截图、性能测量报告和完整 39 项逐行 PASS/FAIL 证明。** 不要将这些“尚未产生的证据”列为已经通过的成果。

---

### 交给新窗口的首句

请在两个 GitHub 仓库接续 2D Designer 商业化升级，**先读本入口、详细参考索引、原始 v1.0 基线**，再核对 Eidos #130–#136 与 App Platform #537/#547/#549/#550 的最新 PR、依赖与 CI。只由这个 2D 专项窗口负责该工作；遵守独立分支、不可覆盖 vendor 上下文导航、不得擅自合并或部署的约定。先给我最新状态与下一轮缺口，再推进真实设备手势验证、手工段拖动/吸附、投影并发恢复，并同步维护验收证据。