# EVO 2D Designer — 39 项商业化验收证据矩阵（工作记录）

**创建：** 2026-10-10（UTC+08）  
**权威要求：** [EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md](https://github.com/jiangxng/EVO-App-Platform/blob/f559ca0c1de5442a85572886b64e8d2da5f8c1db/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) §14（目前在独立研究交接 PR #552 中，尚未合并）。  
**范围：** Eidos #130–#136 + B5a；App Platform #537/#547/#549/#550 + B5a。**不是投产证书。**

## 判定规则

- **PASS**：须注明能直接验证该项结果的测试方法、环境、commit / CI 或人工截图/录屏；自动化单测只证明其实际断言，不自动证明真实交互验收。
- **FAIL**：实际执行且失败，附可复现步骤。
- **NOT TESTED**：尚未按该项验收完成；即使有相关代码、工具构建成功、静态断言，也保持此项。
- 状态严格区分：已写代码 / CI 成功 / PR 合并 / 部署 / 实机验收；不可把其中一项推断成另一项。
- 每轮填写：设备型号、OS、浏览器版本、输入类型、图规模、测量手段、截图/录像或工作流 URL、准确 commit SHA。不得虚构任何图像、FPS 或录屏。
- 本文为针对性独立文档，不覆盖主线状态文件；所有行首次以 **NOT TESTED** 开始。

## 逐行登记（共 39 项）

| ID | 原要求 §14 的测试场景 | 当前代码/单测候选（不等于验收 PASS） | 验收结论 |
| --- | --- | --- | --- |
| V01 | 同一关系切换四种路径 | Eidos tests/diagram-edge-paths.test.mjs；待浏览器验证 | NOT TESTED |
| V02 | 旧投影没有新增字段 | Eidos tests/diagram-edge-paths.test.mjs；旧投影不迁移待复核 | NOT TESTED |
| V03 | 线型/箭头有业务语义 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| V04 | 在 10%、100%、300% 查看边 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| V05 | 长中文/英文节点名与关系标签 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| V06 | 选中、悬停、焦点与错误并存 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M01 | 左键拖空白 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M02 | 左键单击/拖动节点 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M03 | Shift 点选与追加框选 | Eidos tests/diagram-selection.test.mjs；待真实鼠标 | NOT TESTED |
| M04 | 多选后拖动其中一个节点 | B6a group-bbox 同步吸附偏移单测，Eidos #139 / App #566 CI；群组真实鼠标/触控待验 | NOT TESTED |
| M05 | 右键从节点上拖动画布 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M06 | 原地右键 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M07 | 中键、Space + 拖动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M08 | 输入框内 Space、Delete、Ctrl+A | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M09 | 拖动出画布再释放/切换窗口 | B6a Chrome 154 原生 mouseMoved 预览 + pointercancel 回滚/参考线清理；真实窗口失焦/跨边界待验 | NOT TESTED |
| T01 | 触控板双指平移和捏合 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T02 | 触摸未选节点开始滑动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T03 | 触摸选中后拖动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T04 | 节点拖动中加入第二指 | Eidos #136、App #550 自动/结构测试；待实机 | NOT TESTED |
| T05 | 双指变单指 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T06 | 手机多选/框选 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T07 | 手机抽屉、旋转、软键盘 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| E01 | 自动折线遇到中间节点 | Eidos tests/diagram-obstacle-routing.test.mjs；待真实渲染 | NOT TESTED |
| E02 | 同向多边、反向边、自环 | Eidos tests/diagram-edge-lanes.test.mjs；待交互 | NOT TESTED |
| E03 | 拖动折线段或路径点 | B8c [Chrome 154 十标签页 CI 38018569747](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38018569747) PASS：Shift+原生鼠标从重叠 waypoint 拖动被遮挡正交段并 Undo；CDP 原生 touchStart/move/cancel 后**同页**再次 touchStart/move/end 提交；B8b 保存→新 Designer→Viewer 往返亦通过。实体系统触摸、多平台和高密度复杂图待验 | NOT TESTED |
| E04 | 点击曲线远离端点直线的位置 | Eidos tests/diagram-edge-paths.test.mjs；待真实命中 | NOT TESTED |
| E05 | 移动一个/两个端点 | Eidos tests/diagram-waypoints.test.mjs；待真实操作 | NOT TESTED |
| E06 | 曲线/折线转直线再撤销 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| E07 | 标签拖动和节点移动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D01 | 隐藏节点/边再保存 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D02 | 连续编辑、撤销、重做、保存 | B6b Chrome/154 真正三节点多选→左对齐→Undo→坐标完整恢复且未隐式保存，完整 D02 连续流程待验 | NOT TESTED |
| D03 | 保存失败后重试 | B7b GitHub Chromium 154 实际 UI + HTTP 503 注入 + UI 重试，[Browser CI 38010453881](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38010453881) PASS；其他设备仍待验 | NOT TESTED |
| D04 | 保存后刷新、Viewer、模板预览 | B8b 实际 Chrome 154 UI：自动正交线段转手工、Redo、显式 Save CAS、全新 Designer 回读及真实只读 Enterprise Definition Viewer 的 SVG 路径一致 [CI 38017423084](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38017423084) PASS；Template Preview、真实设备/生产服务待验 | NOT TESTED |
| D05 | 两窗口冲突保存或 Agent 更新 | B7b Chrome 两独立 Tab 实际 Eidos DOM 选择/隐藏/保存/冲突/另存副本；Direct/Personal Agent Node CAS；真机/真实 LLM 待验 | NOT TESTED |
| D06 | 切换到另一投影 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| A01 | 自动排版含隐藏/锁定节点 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| A02 | 系统大字与键盘操作 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| P01 | 规模样例与连续操作 | P01a Chrome 154 synthetic full DOM 200/400+500/1000，独立同 runner A/B 发现 200 退化后启用小图 fallback；[新版 CI 38014785156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014785156) 200 selection -12.95%、500 selection -16.46%；真实硬件 FPS/持续操作待验 | NOT TESTED |
| P02 | 同一页面两个图形实例 | marker ID 已做实例隔离；实际双实例测试待做 | NOT TESTED |

## B5a 增量的测试边界

- 路径点控制柄与正交线段控制柄属于 **Eidos 通用图形交互**；App Platform 仅小范围同步 vendored 几何和 Surface 交互，明确保留 `renderContextNavigationV010`。
- B5a 预计的可自动测试项：路径点有限值/上限验证、正交线段方向约束、端点不变性、鼠标坐标转换所用纯几何函数、vendor seam 静态回归。测试运行与结果需以对应 PR CI 为准。
- B5a 浏览器尚未验收：真实 pointer capture、长拖动/取消、第二指中途加入、手柄与节点的点击层级、不同缩放级别/手机 Safari；**E03 仍是 NOT TESTED**。
- 自动路由（无手工 waypoint）的直接线段拖动、curve 标签移动、自环控制柄、密集重叠线段消歧仍需后续切片；不得把 B5a 宣称为 E03/E07 全部完成。


## D05 并发覆盖风险（B5a 历史源码审查；B7 已有增量实现）

- `apps/eog-2d-designer/definition-projection-editor.ts` 的 `SAVE_PROJECTION_VIEW` 核对 `expectedRevision` 与**业务定义** `latest.revision`、session `definitionRevision`。这证明可识别定义版本过期，不等价于投影自身编辑版本冲突。
- `providers/enterprise-context/definition-projection-store.ts` 的 `put()` 按 enterprise/definition/definitionRevision 键直接过滤旧项后写新 gallery；公开接口目前没有独立投影版本/CAS 参数。这是**可覆盖的架构风险**，不能误记为已通过双窗口验收。
- 下一切片 B7 的最小安全闭环：读取得到独立 `projectionRevision` / opaque ETag，保存强制原子 compare-and-swap，不允许通过业务定义 revision 代替；冲突返回结构化状态供用户保留本地编辑、重新加载或另存投影。并发写必须由各 Store 实现保证原子性，不能只在服务层先读再写。
- 验收证据：两个不同浏览器会话同一投影同一 base revision 竞争写入，恰好一个成功、另一个冲突且保留草稿；保存失败模拟、重试及 Agent 写入同走版本校验。未执行前 D03/D05 继续 NOT TESTED。

## B7 最新实现证据（保留 §14 场景 NOT TESTED）

- B7 相关变更存于 App Platform [Draft #561](https://github.com/jiangxng/EVO-App-Platform/pull/561)（基于 #553）和 Eidos [Draft #138](https://github.com/jiangxng/eidos/pull/138)（基于 #137），尚不属于 main 已上线能力。
- 上节关于 `put()` 无 CAS 的判断准确描述 **B5a 之前** 的代码；B7 增加独立 gallery version、`putIfVersion`、文件排它锁与 `expectedWriteToken`。B7 自动测试覆盖同一 token 竞争保存和旧版本拒绝，也覆盖内存/文件 provider 与旧数据兼容。
- 限制：旧客户端可不带 token、跨主机文件系统原子性未知、异常遗留锁恢复、浏览器本地草稿恢复、Agent 路径及两台真实终端同时编辑尚未完成。**D03/D05 均维持 NOT TESTED，不因 CI 成功自动判为 PASS**。
- 新增架构与运维细节见 `docs/architecture/DIAGRAM-B7-PROJECTION-CAS-20261010.md`；GitHub 当前测试工作流以对应 PR 最新提交为准。

## 实机证据模板

| 日期/执行人 | ID | 设备 + OS | 浏览器版本 | 图规模 | 操作与预期 | 结果 | 证据链接 / issue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 未执行 | — | — | — | — | — | NOT TESTED | — |

目标环境：Windows Chrome/Edge 鼠标、macOS 触控板、iPhone/iPad Safari、Android Chrome；图规模覆盖桌面 200/400、500/1000，手机 100/200。后续将实际证据写回矩阵，不凭推测填 PASS。

**B7 补充恢复路径：** `SAVE_PROJECTION_AS_NEW` 对旧 token 允许显式的非破坏性复制：读取当前 gallery + version，原子追加新投影；原投影不被修改。测试已加入 `definition-projection-edit-save.test.mjs`，浏览器/导航及跨机器验收仍属于 NOT TESTED。

## B7b 追加证据：不带 token 的请求及 Agent CAS

- [Draft PR #563](https://github.com/jiangxng/EVO-App-Platform/pull/563)（基于 #561）开始要求投影编辑器全部写操作携带 `expectedWriteToken`；旧客户端无 token 的写请求被明确拒绝，不再读取当前版本后盲写。
- Direct Definition Projection Agent 与 Unified Current 2D Personal Agent 的裁剪写操作加入 **GET 返回 token → WRITE 强制 token → `putIfVersion`**。统一 Current 2D 的经营图仍使用其自己的 View revision，不混合领域版本。
- CI 的 42 项 Diagram 集成测试包含 Agent/人工写竞争、无 token 拒绝、最新 token 显式重试；此前 B7 的双窗口 Session 测试仍在。
- 所有这些是 Node 集成检查和 GitHub CI 证据，**不是浏览器设备结果**，D03/D05 和其他 37 项验收仍保持 `NOT TESTED`。真实 Browser/Agent 模型/恢复交互需要另外留存截图、日志、环境。
- 研究、工程理由、限制记录见 `DIAGRAM-B7B-AGENT-CAS-WRITE-TOKEN-20261010.md`。


## B7b Chromium 执行证据

- 源码 `tools/diagram-projection-browser-conflict-proof.mjs` 和 `.github/workflows/diagram-designer-browser-cas.yml`：本地服务使用真实投影 ActionHandler，浏览器模块导入真实 Eidos DOM 编辑器；读取/保存不是单纯模拟的状态机。
- 两个标签页竞争、冲突提示、失败草稿保留、明确 Save As 追加新投影：首次 Chrome/154.0.8037.97 已打印真实业务断言日志；清理时的竞态已修复并于 [Browser CI 38010239304](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38010239304) PASS。
- 第三个标签页 HTTP 503 失败保留草稿与真实 Save 按钮重试：已在 Chrome/154.0.8037.97 [Browser CI 38010453881](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38010453881) 执行并通过；日志有 `transientFailurePreservesDraft=true` 与 `retrySaved=true`。
- **此处 D03/D05 仍标 NOT TESTED** 是指原始 §14 的完整跨设备/真实业务验收尚未完成，不否认已完成的局部自动 Chromium 测试。详情见 `DIAGRAM-B7B-BROWSER-CAS-PROOF-20261010.md`。

## B6a 节点吸附与辅助线（2026-10-10）

- [Eidos Draft #139](https://github.com/jiangxng/eidos/pull/139) 对通用节点/多选群组接入纯几何 `diagramSnapTranslationV010`，计算整体包围盒与可见非移动节点的左右上下及中心锚点；同组只采用一次平移。参考线仅在拖动预览出现，取消/失去捕获清除。可独立切换 Grid、Grid snap、Align。
- [App Platform Draft #566](https://github.com/jiangxng/EVO-App-Platform/pull/566) 小范围 vendored port，保留 Host `renderContextNavigationV010`；新增 `tests/integration/diagram-snapping.test.mjs`，已纳入 Diagram Designer Integration CI 真正执行。
- **已跑浏览器子场景：** [Chrome CI 38011441150](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38011441150)，Chrome/154.0.8037.97，鼠标真实 pointer 抓取 + 10% 缩放自适应网格吸附 + `pointercancel` 回滚 + 三开关独立，机器日志 `nativeGridSnapCancelled=true` / `independentGridModes=true`。保留 B7b 多窗口冲突及 HTTP 重试通过的既有证据。
- **缺口仍然存在：** 对齐参考线真实鼠标“与其他节点对齐”、群组鼠标操作、路径点/正交段吸附、等距分布/多对象对齐菜单、Windows/macOS/iOS/Android 实机、500 节点/1000 边性能。此处无证据能够将原始 §14 任何完整场景从 NOT TESTED 提升为 PASS。

## B6b 路径手柄吸附与显式对齐/分布（2026-10-10）

- [Eidos Draft #140](https://github.com/jiangxng/eidos/pull/140) 将 B6a 节点吸附几何延伸到 **manual waypoint 的双轴吸附**和 **orthogonal segment 的单轴约束吸附**；参考可见节点及其他手工路径点，继承 6 CSS px 容差、自适应 24 基础单位网格、Grid snap/Align 两开关。拖动中的参考线在 pointercancel / pointerup 清除，正常完成提交单 Undo；不改变边的业务语义与端点。
- Eidos 同一新纯模块支持 6 项选中节点对齐、2 方向等边缘间隙分布；两节点可对齐，三节点可分布，不足禁用、空间不足拒绝；一次命令仅一条 checkpoint，仍需显式 Save。
- [App Platform Draft #568](https://github.com/jiangxng/EVO-App-Platform/pull/568) 以差分方式更新 vendored Eidos，原 Host 导航、B7b CAS 与旧投影兼容保持。测试 `tests/integration/diagram-snapping-tools.test.mjs` 已纳入 CI 真正执行。[Diagram Integration CI 38012177672](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012177672) 57/57 PASS；Eidos #140 初次 CI PASS。
- [Browser Conflict CI 38012177648](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012177648) Chrome/154.0.8037.97 通过 B6b **真实 DOM 三节点选择、左对齐、Undo 完整恢复且无 Host 投影写入**，并且 B7b 三浏览器标签页冲突 / HTTP 503 重试、B6a 网格吸附均未回归；机器日志 `groupAlignmentUndo=true`。
- **剩余：** 路径点、正交线段的**实际浏览器鼠标/触摸拖动**仍未覆盖，跨设备、自动路线编辑、完整路径复原、500 节点/1000 边性能也未验收。原始 §14 39 项仍保持 NOT TESTED，CI 自动子场景不可冒充全场景人工验收。新文档 `DIAGRAM-B6B-HANDLES-ARRANGEMENT-INTEGRATION-20261010.md` 保存实现及限制。

## B6b 第四标签页新证据：真实手工 waypoint 拖动与控制柄优先级

- 首轮实际 Chrome 浏览器中，manual waypoint 与 orthogonal segment 的透明 44px 热区重叠时，后绘制的 segment 抢占鼠标。B6b 同步修复 Eidos #140 / App #568 Surface 顺序：先输出 segment handle，**再输出 waypoint handle**；保留原定 44px 热区，并加入源代码回归断言。
- [App Browser CI 38012891164](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012891164) 为实际 Chrome/154.0.8037.97、四个独立浏览器标签页，机器日志 `nativeRouteHandleSnapAndUndo=true`。第四标签页在实际 Definition Projection 关系上切为 orthogonal、添加 waypoint、原生 mouse press/move/release 抓取并吸附、Undo 后重选关系确认坐标恢复，原 Host projection 版本未改变。
- E03 的“手工路径点拖动”自动 Chrome 子场景有正向证据；但“正交线段本身拖动、路径合法性全组合、移动后完全保存/Viewer往返、实体触摸/多指、性能”等原 §14 完整验收未穷尽，故 **E03 仍 NOT TESTED** 而非 PASS。

## B6b 正交线段鼠标拖动与原路径精确恢复（2026-10-10）

- [Chrome Browser CI 38013268466](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38013268466) Chrome/154.0.8037.97 四标签页 **PASS**，其中 `nativeOrthogonalSegmentSnapAndUndo=true`、`nativeRouteHandleSnapAndUndo=true`、`groupAlignmentUndo=true`、`businessHistoryUnchanged=true`。
- 因单一共线 waypoint 与 segment handle 透明圈可重合，实验首先通过真实路径点数字坐标控件构造明确拐角；选取真正可点击的 segment 44px SVG 热区，沿其可动法向轴拖动，检查路径实际变化与 Undo 后 `d` 精确还原。两种手柄现均有实际 Chrome 鼠标子场景；用户仍可通过路径点数字编辑处理目标重叠情况。
- 原始 §14 E03 仍保留 NOT TESTED：尚未在手机 Safari / Android Chrome 上验证多指触摸路径编辑、曲线及自环、保存后 Viewer 往返与大图性能。此证据只证明上述子场景，不代表实机商业验收全面 PASS。

## P01a Chromium 大图性能及不一致结果（2026-10-10）

- [Eidos Draft PR #141](https://github.com/jiangxng/eidos/pull/141) 增加 node endpoint Map 和确定性 `obstacle-spatial-index.ts`，只筛选与边相关的障碍节点；大小图和长边 / 大节点边界的退路都保留。路由 `d`、label、congested 与原本**所有障碍全量输入**按单测逐条一致；不改业务语义、投影版本/Agent/权限。
- [App Draft PR #573](https://github.com/jiangxng/EVO-App-Platform/pull/573) 差分 vendor 并加入 `diagram-obstacle-spatial-index.test.mjs` 实际 CI 路径/命令；独立 `tools/diagram-performance-browser-proof.mjs` 用**真实 Chrome 的合成 Eidos DOM**，不碰线上企业数据，分别渲染 200/400 与 500/1000。
- [配对实测 CI 38014451416](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014451416) 在同一 runner checkout B6b base 与 P01a HEAD，分别编译并先预热，再每种规模测 3 次取中位数。500/1000 mount **173.2→140.3ms (-19.00%)**，selection render **81.0→68.3ms (-15.68%)**。200/400 mount **108.0→105.8ms (-2.04%)**，selection **35.9→41.2ms (+14.76% 退化)**。不应把这次局部正向结果宣传为所有图规模优化。
- CDP 鼠标事件调度中位数不是动画帧率；共享 runner、合成数据不等于物理手机/桌面及线上环境；§14 P01 **NOT TESTED**。需真实业务拥堵图、触摸、持续编辑、堆内存峰值与 p95/p99 长任务、Win/macOS/iOS/Android 性能截图和原 §14 阈值核对。
- 跟踪与已确认决策见 `docs/architecture/DIAGRAM-P01A-LARGE-GRAPH-PERFORMANCE-INTEGRATION-20261010.md` 和原研究交接 PR #552。

## P01a 自适应索引及后续配对证据

- 早期 [38014451416](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014451416) 发现单纯空间索引在 200/400 selection **+14.76%** 退化；另一独立重复 200 selection **+4.94%** 退化。为避免牺牲小图性能，新代码在 `visibleNodes × visibleEdges < 150000` 沿用旧障碍扫描，达到该规模才建立空间索引；source/target Map 始终复用。纯几何 parity 测试均保持相同路径。
- [更新后配对 Chrome CI 38014785156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014785156) 200/400 selection 中位数 **19.3→16.8ms (-12.95%)**，500/1000 **48.6→40.6ms (-16.46%)**，每个规模预热后测 3 次。同 run 原版与改版两者都渲染完整 200/400 或 500/1000，未删减可交互对象。
- 仍只有合成 Chrome 测试与共享 runner 调度，未测真实设备 FPS、Long Tasks p95、业务关系密度的极端分布、多图同页或长时间会话稳定性，P01 正式验收维持 `NOT TESTED`。

## P01a 第三次独立配对确认

- [Chrome CI 38014903344](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014903344) 200/400 selection **18.5→16.9ms (-8.65%)**、500/1000 selection **44.8→38.5ms (-14.06%)**。与上轮 [38014785156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014785156) 的两规模 selection -12.95% 和 -16.46% 一致为正向，最新 CI 全 PASS。
- 500/1000 第三次 drag CDP dispatch p95 为 +7.37% 轻微回退，不能用选择重绘的改善假称全交互 FPS 改善。该计时还包含协议/runner 调度。§14 P01 保留 NOT TESTED。

## P01a 第四次重复结果不得遗漏

[Chrome Perf CI 38015041848](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015041848) **PASS** 但 200/400 selection 是 **38.0→40.0ms（+5.26% 回退）**、500/1000 selection **81.1→68.6ms（-15.41%）**。因此 P01 现阶段更准确的结论是 **500/1000 中位数选择重绘在多次不同 CI-runner 配对中改善，小图效应不稳定**；原 §14 P01 `NOT TESTED`，严禁按最佳一次抽样宣称商业化性能验收通过。

## B8a 自动正交折线段直接拖动：真实 Chrome 子场景（2026-10-10）

- [Eidos Draft PR #143](https://github.com/jiangxng/eidos/pull/143) / [App Platform Draft PR #581](https://github.com/jiangxng/EVO-App-Platform/pull/581)：选中没有手工 waypoints 的 orthogonal 或 rounded-orthogonal 边，直接显示 44 CSS px 自动线段法向拖动目标；不要求按 Add path point。自动 SVG 与临时控制点使用同一套路由/障碍逻辑，老共线重复中点去重。选择/取消绝不写入手工控制点；实际释放成功才做一次 Undo checkpoint 与本地展示层转换。
- [真实 Chrome 154 六标签页 Browser CI 38016452101](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38016452101) PASS，`autoSegmentDragCancelConvertUndo=true`。第五标签页从真实关系切换 orthogonal 后不增加 waypoint，使用原生 mouse press/move 预览，再注入 pointercancel 校验**原 SVG d 精确恢复、无手工点且无隐式 Host 写**；第六独立标签页同样无手工点启动，原生鼠标抓取并松手提交，出现手工控制点，再 Undo 恢复自动 SVG、移除手工点。原 B7b 三窗口 CAS/HTTP 503、B6b 手工折线、群组对齐仍通过。
- **有意保留的缺口：** 用 DOM 人工派发的 `pointercancel` 不等于真实操作系统触摸取消；最初尝试在同一 Chrome 标签页紧接着复用原生鼠标状态，第二次拖动未触发预览。此现象暂不能归因于产品；本轮分别在独立标签页证明取消及正常提交/Undo，**没有声称真实同页取消后立即重抓已验收**。还需实体多指/触控板、rounded-orthogonal 直接拖动的浏览器路径、转换后显式保存刷新 Viewer、极端自动障碍路由等。§14 E03 与整体 39 项门槛仍 NOT TESTED。

## B8b 自动正交段保存→重开→Viewer 真正渲染证据（2026-10-10）

- [App B8b 独立 Draft #583](https://github.com/jiangxng/EVO-App-Platform/pull/583) 叠加原 B8a #581，**仅测试与文档**，不更改 Eidos/App 产品代码。延伸 B8a 的真实浏览器测试至 8 个 Chrome 154 标签页。
- [Browser CI #38017423084](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38017423084) **PASS**，机器证明 `b8bSaveReloadRealViewerRoundtrip=true`。第六标签页完成自动段→手工点→Undo→Redo，确保旧的自动 SVG、提交的手工路径和 redo 数据正确，再点击真实 Designer `Save projection`，Store 投影版本 3→4，包含该关系的 orthogonal 手工 `waypoints`，业务定义历史仍为 1。
- 第七个**新打开的** Designer 标签页从原 Host Artifact Source 重新读取同一 projection；手工点数量与实际 SVG `d` 均和保存前完全一致。第八个**真正只读 Enterprise Definition Viewer** 工作台（产品 `createEnterpriseDefinition2dPreviewPageV010`、`createEnterpriseDefinition2dPreviewReadActionV010`、Eidos workspace mount）重新读取、实际绘出完全相同的路径 `d`；无编辑热区及保存按钮，且 Viewer 不写 Store。
- Edge source、target、kind 与原始业务图一致，业务定义版本不变；原 B7b CAS/HTTP 503 和 B6b 手工与 B8a 取消回滚回归未失效。此证明 D04 的**正交自动改手工**一个自动 Chrome 子场景，**并未**测 Template Store Preview、真正重启服务器/持久磁盘后重载、移动真机/生产部署。因此 D04 保留 `NOT TESTED`，原 §14 39 项正式验收不能据此直接 PASS。
- B8a 之前人工 DOM pointercancel 后在**同一标签页**立即 CDP 鼠标重新抓取失败，仍不能判断为 CDP 模拟状态还是产品故障，未被本轮声称已修复。实体多指、真实 OS pointercancel/regrab、复杂圆角路由等仍待验。

## B8c 十标签页 Chromium 重叠控制柄/同页触摸取消后重抓证据（2026-10-10）

- [Eidos Draft #144](https://github.com/jiangxng/eidos/pull/144) / [App Draft #586](https://github.com/jiangxng/EVO-App-Platform/pull/586) 叠加 B8a/B8b 既定口径，不碰另一主线。原显式 waypoint 的 44 CSS px 命中目标始终盖在 segment 之上：普通拖动仍改点；**Shift+拖动**在同一遮挡目标中选择最近 segment；**Shift+Alt+拖动**选择第二个。以 zoom×世界距离判断 44 CSS px 圆区重叠、稳定排序、无候选 fail closed，不缩小碰撞热区。原 checkpoint/Undo、B6b 网格与路径法向、B7b Host CAS 保持。
- [真实 Chrome Browser CI #38018569747](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38018569747) **PASS**：Chrome/154.0.8037.97，新增第九标签页原业务图关系加手工路径点制造重叠区域，原生 CDP 鼠标携带 Shift 状态拖动遮挡下正交 segment、松手产生多个点、Undo 还原单点及完全相同的 SVG、无 Store 自动写。机器报告 `b8cNativeShiftOverlapSegmentUndo=true`。
- 第十标签页没有通过 `new PointerEvent` 手造取消，而是真正 Chrome CDP **`Input.dispatchTouchEvent`** 输入 `touchStart→touchMove→touchCancel→touchStart→touchMove→touchEnd`，在**同一页面** cancel 后复原原 SVG 与无手工点，然后第二次原生浏览器触摸重新预览、松手转为手工路径点，未隐式 Save。机器报告 `b8cNativeTouchCancelRegrab=true`。之前人工 DOM `pointercancel` 后 CDP 鼠标立即重抓未预览的现象因此更可能与混用合成/原生输入有关，但**不能断言物理系统触控故障已经修复或者 iOS/Android 实机已测**。
- 原有 B8b 八标签页真保存/新 Designer/真实只读 Viewer 完全 SVG 往返、B7b 多窗口 CAS/失败重试和 B8a 原生自动段测试仍在十标签页 PASS 中。仍缺实体 OS 取消、触摸板/实体键鼠 Shift+Alt、同点多于两个 segment 消歧、复杂圆角/自环/大图及移动真机。E03、D04 及 §14 的 39 项正式验收仍 `NOT TESTED`。
- 详细技术/验收见 `docs/architecture/DIAGRAM-B8C-OVERLAP-TOUCH-REGRAB-INTEGRATION-20261010.md`；研究来源口径延用独立 PR #552，不冒称重查 S1–S7 外站。


## B8d 十一标签页多重重叠控制柄轮选（2026-10-10）

- Eidos [Draft #145](https://github.com/jiangxng/eidos/pull/145) / App [Draft #590](https://github.com/jiangxng/EVO-App-Platform/pull/590) 在 B8c 基础上增加 3+ 重叠段的轮选，不改原 44px 热区、普通点拖/Shift 最近段/Shift+Alt 默认第二段、CAS、Agent 权限或业务定义版本。
- [App Chrome 154 eleven-tab CI #38020601326](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38020601326) **PASS**：实际 Chrome/154.0.8037.97，**11 个独立标签页**。第 11 页通过真实 Designer Inspector 构造 5 手工路径点的密集折线路由，使末尾 waypoint 下存在至少三个不同的 orthogonal segment 候选；真实 CDP 原生鼠标 Shift+Alt 单击把备选第二切换为第三，显示 `3/N`，未改变原 SVG，保留 22px radius；Shift+Alt 拖动第三线段预览和提交后 SVG 改变，一次 Undo 后精确恢复原 SVG，Store 投影版本仍为 4、未隐式 Save。日志 `b8dNativeDenseOverlapCycleAndUndo=true`。原 B8c 触摸同页取消/重抓、B8b 保存重开 Viewer、B7b CAS、B6b 路径回归全 PASS。
- **仍未验收**：第四及更高候选逐个原生拖动；真实 macOS/Windows 外接鼠标、触控板和 iOS/Android 触摸；复杂圆角/自环、真实硬件 FPS、全 §14 39 项。E03 依然 **NOT TESTED**（该行的局部 Chrome 子场景虽 PASS，却不等于 §14 的完整跨设备验收）；D04 等其他条目结论不变。Draft、未合并、未生产部署。


## B8e 复杂圆角线段、末尾轮选、Escape 同页重抓和 Viewer（2026-10-10）

- 新增 Eidos [Draft #146](https://github.com/jiangxng/eidos/pull/146) / App [Draft #591](https://github.com/jiangxng/EVO-App-Platform/pull/591) 独立增量；沿用原研究交接 [#552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 及 §14 原标准，保留所有 44 CSS px 命中区和业务关系不变。
- [真实 Chrome Browser CI #38021117688](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38021117688) **PASS**，Chrome/154.0.8037.97，**14 标签页**。第 12 页通过真实 Inspector 把一条关系切到 `rounded-orthogonal` 并建五手工点，产生 4+ 遮挡的 segment，真实 CDP Shift+Alt 鼠标点击依次轮选第四到最后，最后循环回第二，再重选最后；点击只改本地候选编号，路径 SVG 不变、Store 未写、22px 半径不变。
- 原生鼠标对最后一条重叠 segment 拖动预览保留 `Q` 圆角；按 Chrome 原生 Escape 键取消及随后鼠标松开，原 SVG 和候选回滚/保留；同一浏览器标签页重新拖动成功。Undo 精确恢复原圆角 SVG，Redo 恢复提交图形。显式 App Host `Save projection` 完成 CAS 投影版本 **4→5 一次**，业务定义 revision/history 保持；第 13 个全新 Designer 和第 14 个真实只读 Viewer 从测试 Store 重读相同 SVG `d`，Viewer 无编辑控件/保存按钮、读操作不写。
- 日志 `b8eRoundedMultiRankCancelRegrabSaveViewer=true`，旧 `b8dNativeDenseOverlapCycleAndUndo`、`b8cNativeTouchCancelRegrab`、`b8bSaveReloadRealViewerRoundtrip`、CAS、503 亦同时为 true。Eidos CI 与 App 五项 CI 已在对应产品/测试提交上 PASS。
- **边界与原正式结论**：此处为 CDP 浏览器鼠标/键盘事件，并非物理键鼠、触控板、iOS/Android/Windows/macOS 系统级多指测试。内存 Store 不能证明服务重启后持久化，也不能证明复杂自环、曲线、跨关系重叠、真实生产性能及 §14 全项；E03/D04 等仍 **NOT TESTED**，总共 39 项完整商业化验收均未升格。未合并、未部署。


## B8f 自环显示层路径与曲线控制柄（2026-10-10）

- 独立 Eidos [Draft #147](https://github.com/jiangxng/eidos/pull/147) + EVO [Draft #593](https://github.com/jiangxng/EVO-App-Platform/pull/593) 对 B8e 的显示层操作能力做自环增量。不变更业务关系端点/对象语义，保持原 44 CSS px 热区、单本地 Undo/Redo、显式 CAS Save、只读 Viewer 和 Agent 授权边界。
- Eidos 单测/CI **PASS**：四种默认 self-loop 形状选择前后未变；正交、圆角 self-loop 可推导外侧手工段；curve 单 bulge cubic 控制点、越界拒绝、节点位移平移显示点与左右终端保持；App integration CI 同时 PASS。
- [B8f Chrome 154 浏览器 17 标签页 #38022453391](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38022453391) **PASS**，证据标志 `b8fSelfLoopCurveNativeDragSaveViewer=true`。第 15 标签页的**测试专用模拟自环关系**由隔离 artifact source 注入，真实 Designer DOM、CDP 原生鼠标拖动曲线外凸 bulge、原生 Escape 恢复、同页重新抓取、单 Undo/Redo 和单次显式 App Host CAS Save 均 PASS（投影版本 5→6，业务定义 history 不变）；新开第 16 Designer 和第 17 真正只读 Viewer 读取相同 cubic SVG `d`，Viewer 无编辑/保存按钮。旧 B8e/B8d/B8c/B8b、CAS 回归同 run PASS。
- **负面发现/待办**：初始测试把控制柄放到 Inspector 区外，第二次调整位置后落在图中其它业务节点之下，两次均实际无法命中。第三次测试把模拟自环挂在图中最右侧且画布内空旷节点，才成功操作。说明现有自动自环固定向右、**尚不提供节点避障**；需要下一阶段方向选择/避障/冲突处理。不可将「外侧有空间的测试样本成功」扩展为「密集图自环操作已验收」。
- **完整验收仍保持**：当前浏览器自环 only curve 单点，其它正交/圆角自环仅纯几何/静态证据；实体键鼠、macOS 触控板、iOS/Android、系统手势打断、数据库重启后的持久性、高密图长期性能和 §14 **39 项正式验收**均 **NOT TESTED**；E03 等不升格，Draft 未合并、未部署。


## B8g 方向自适应避障与手工路径不跳动（2026-10-10）

- Eidos [Draft #148](https://github.com/jiangxng/eidos/pull/148) / App [Draft #595](https://github.com/jiangxng/EVO-App-Platform/pull/595)，独立堆叠在 B8f；不改业务关系 source/target、Agent 权限、Host CAS、44px 命中范围或业务定义版本。已作来源/决策记录：`docs/architecture/DIAGRAM-B8G-SELF-LOOP-OBSTACLE-INTEGRATION-20261010.md`。
- 单测验证：无障碍的四类旧右侧自环 SVG 保持；可见节点占用右侧时自动选下，再占用下则选左、再占左则选上；重排不受障碍列表顺序影响；手工路径点反推自环方向，邻接节点消失时不自动改写手工方向；无效输入拒绝；大图空间索引与完整障碍扫描得到相同决策。
- [Chrome 20 标签页 Browser CI #38023222999](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38023222999) **PASS**（Chrome/154.0.8037.97），标记 `b8gNativeBlockedSideSaveReadViewer=true`。仅通过隔离 artifact source 注入的 **模拟 self-loop 和模拟右侧阻挡节点**构造真实 Browser/Host 行为，不修改实际企业关系。Chrome 第 18 页调用 Inspector 的 Restore automatic routing 后从右侧改走下方；CDP 原生鼠标能够命中外侧控制柄并拖动 cubic 曲线，单次 Undo/Redo；仅显式 Save 才 CAS 推进投影 6→7，业务定义历史不变。第 19 页全新 Designer、第 20 页只读 Viewer **移除测试阻挡节点后**仍严格显示已保存的下侧 cubic SVG，不提供查看侧 Save/编辑，不隐式写入 Store。此前 B8f/B8e/B8d/B8c/B8b/冲突与重试子场景同 run PASS。
- **B8g 不能认定正式商用验收已完成**：全部四侧有阻碍时只选最小交叠，不保证无交叠；未处理边边交叉、标签遮挡、视口边界、同节点多自环、复杂混合手势。真实 Chrome 场景只对底侧 curve 操作提供端到端证据，正交/圆角的左/上路径仍是几何测试。实体手机/桌面设备、持久化数据库服务重启、高密场景的可靠性、完整 §14 **39 项仍 NOT TESTED**。两个 PR 为 Draft，未合并、未部署。


## B8h 多自环分配、同侧错层与拥堵提示（2026-10-10）

- Eidos [Draft #149](https://github.com/jiangxng/eidos/pull/149) + App [Draft #596](https://github.com/jiangxng/EVO-App-Platform/pull/596)，直接堆叠各自 B8g；限定 2D 自环路径显示和 Surface 手柄/提示，不改业务关系 ID/端点/业务定义 revision、Agent 授权、CAS 或 44 CSS px 热区。
- Eidos Geometry/Surface 单测：无遮挡单环保留旧默认 SVG；同节点四条关系方向依次右、下、左、上；第五/六条同侧允许向外错层并标记拥堵；四侧均被节点占满返回非零交叠面积和 `congested=true`；手工路径方向不跳变，且**所有已保存手工路径先于任意自动兄弟自环占用侧别**；警示文字不吃 pointer。
- [Chrome 154，23 标签页实际浏览器 #38024189776](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38024189776) **PASS**，日志 `b8hMultiLoopCongestionNativePointerViewer=true`。第 21 页独立合成五自环：稳定分配右→下→左→上→右，第五条可见拥堵提示并保留 22px 半径/44px 直径真实 Chrome 鼠标可抓点，实际拖动更新 cubic 预览/本地路径但**不隐式写 Store**；第 22 页真实只读 Viewer 仍显示未提交的旧图；第 23 页合成四侧障碍，全部拥堵自环带 DOM 和 aria 状态，提示不会截获指针。B8g/B8f/B8e/B8d/B8c/B8b/Host CAS/临时 503/版本隔离回归同运行通过。
- **证据局限**：以上多环和四侧阻挡都是隔离 artifact source 的模拟关系与模拟节点，不是在线真实业务关系；Chrome CDP 鼠标非实体操作设备；只验证与节点矩形和同节点自环的局部冲突，不含其它关系的边-边交叉惩罚、标签防遮、视口外溢、跨图全局布线。五条以上仍可能共享一侧且继续拥堵，警示不能保证自动化解。实体设备、重启/数据库持久化、完整 §14 **39 条正式商用验收仍 NOT TESTED**；Draft、未合并、未部署。


## B8i 自环与非关联连接线、标签避让和 Fit 取景（2026-10-10）

- 独立两仓 Draft：[Eidos #150](https://github.com/jiangxng/eidos/pull/150)、[App #597](https://github.com/jiangxng/EVO-App-Platform/pull/597)，堆叠 B8h 而非改 main；设计及限制已写入 `docs/architecture/DIAGRAM-B8I-EDGE-LABEL-AVOIDANCE-INTEGRATION-20261010.md`。
- 局部算法：显式自环四侧评分增加“非关联关系中心/控制点构成的折线穿越外侧手柄走廊”和“非关联关系标题/观察值的稳定近似文字矩形”；不根据选中/悬停 DOM 动态改路，保留节点占用、同节点其它自环保留槽位、手工路线 side 固定策略。局部预算 ≤1500 visible edges、≤48 loop-bearing nodes；超出降级为 B8h，**不是全图零交叉保证**。
- Fit All、Fit Selection：包围盒还包括显式自环外侧 reach、同侧多环叠层和已保存 waypoint、额外控制柄空间；普通无自环历史节点包围仍一致；不根据 pan/zoom 改变持久路由。
- Node 与真实 Browser 测试项目：单独跨线、单独标签、全侧线冲突警示、手工路径不跳动、老图 Fit 不变化、外侧 Fit 点纳入；隔离合成测试 source 上 Chrome **26 tabs** 的 Designer、原生鼠标拖动/取消和 readonly Viewer 同 SVG，包括此前 B8h～B8b 与 Host CAS/503 兼容回归。最终是否全部 PASS 只以本轮最新 PR head CI 为准，不能把已启动测试写为完成。
- 保留待测：自动正交/圆角/曲线其它关联边的完整真实线段交点、浏览器字体实际文字盒、更多数量下的线段空间索引、大型企业图性能和视觉质量、任意手动 pan/zoom 的视口避让、实体 iOS/Android/macOS/Windows、持久数据库重启及 §14 **39项正式商用验收全部仍 NOT TESTED**；不合并、不部署。


## B8j + B8k 双增量：真实渲染曲线占用 + 墨迹空间索引（2026-10-10）

- 项目并行提速为一个迭代两个独立结果，PR 为 [Eidos Draft #151](https://github.com/jiangxng/eidos/pull/151) 和 [App Draft #598](https://github.com/jiangxng/EVO-App-Platform/pull/598)，二者仅堆叠各自 B8i，保留此前产品研究及 B8b～B8i 决策/CI，**不改变 main、Agent/Host 权限、企业业务定义、source/target、CAS 规则或 44px 热区**。详细方案、源代码契约和精度限制见 `docs/architecture/DIAGRAM-B8JK-RENDERED-INK-SPATIAL-INDEX-INTEGRATION-20261010.md`。
- **B8j：** 过去的中心线/waypoint 直线弦不能代表其它连接线实际绘制的 Bézier、圆角。现在从 Eidos 实际 `DiagramEdgeGeometry.d` 提取 M/L/Q/C；Q/C 采用带 1.5 world-unit 平坦误差阈值和 8 级深度上限的自适应折线，使用相同的渲染几何给候选自环的外侧走廊计入真实曲线占用；标题位置也取实际 `geometry.label`，不是近似直线终点中点。保留显式说明：这**仍不是解析 Bézier 两曲线精确交点**，只是有界局部走廊检测。
- **B8k：** 在同一次 render 对可见非 self 关系计算一次路由并缓存供 Canvas/Viewer 复用，建立按 256 world-unit 单元索引的段/标签数据。自环只查询附近墨迹并过滤自己的 incident 关系；巨大跨度线段有 overflow 防漏机制。新增 6,000 条远处合成关系 + 长跨距边测试。预算可处理至 12,000 visible edges，100,000 细分段后局部降级为端点线估计；超过 12k 边明确降为 B8h 节点/同节点自环避让，**不是避让成功**。已缓存的非选中关系不重复寻路；只有选中关系需要控件时继续做编辑预览路由。
- [**真实 Chrome 154，28 标签页，Browser CI #38026313103 PASS**](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38026313103)，实际输出 `b8jkRenderedCubicInkIndexedViewer=true`。第 27 页是隔离注入的模拟另一条手工 C 曲线 + 自环，浏览器确认该曲线经过节点外侧、自环改至下方，手柄保留 44px；第 28 页真实只读 Viewer 对**两条关系**重新获取完全一致 SVG，不提供编辑/Save，不推动 Store CAS。原 B8i/B8h/B8g/B8f/B8e/B8d/B8c/B8b、错误重试、冲突防写回归均在同 run 通过。最新 head 的补充缓存优化需要以最新 CI 复跑为最终依据。
- 未达到完整商用验收：6000 远边为合成索引正确性，不等于现场大数据帧率；圆角/曲线仍为自适应采样非解析几何，标签真实浏览器字体测量、多关系全局无交叉、大图索引极端内存峰值、人工 pan/zoom 边界、实体 iOS/Android/macOS/Windows 触摸、数据库重启、完整 §14 **39 项正式商用验收仍 NOT TESTED**。两个 PR 仍 Draft/未合并/未部署。


## B8l + B8m 双增量：实测标签预留与高密度算法降级（2026-10-10）

- 双轨联动但与业务主线隔离：[Eidos Draft #152](https://github.com/jiangxng/eidos/pull/152)，[EVO Draft #599](https://github.com/jiangxng/EVO-App-Platform/pull/599)，堆叠各自 B8j+B8k 已通过的 Draft 分支。未改动投影 Host CAS、业务 source/target、Agent 授权、业务定义版本和 44 CSS px 路由手柄。
- **B8l** 原有无关关系标签最多只保留 176 world-unit 的宽度，导致真实长标题可能占据自环外侧而不被考虑。现用实际浏览器 Canvas2D `measureText`、字体家族和 SVG 11px 字号，计算文字宽度、ascent/descent、文字描边余量对应的稳定世界坐标区。相同标题一轮 render 只测一次；没有 Canvas2D 时以确定性的文字估计兜底，位置不依赖鼠标选中、缩放和临时标签 DOM 显隐。
- **B8m** `full / coarse / node-only` 诚实标注路由精度。当 render 累计 100,000 曲线线段预算用尽，停止进一步 Q/C 分段、保守回退，并由画布提供一次非阻挡式状态提示；超过 12,000 可见关系不进行外部墨迹预计算，仍保留 B8h 节点与同节点多自环方向避让。状态没有增加持久化字段或 Host 权限变更，提示不遮挡拖动。
- **已完成的代码版本测试：** [真实 Chrome 154，30 标签页 #38033645259](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38033645259) **PASS**，日志 `b8lmRealLabelMetricsAndDensityBudget=true`。新增第 29 页长 60 个 M 的**隔离合成关系标题**，实测 SVG 文字宽度超过 176、Canvas2D 测量生效、自环绕行至下侧、44px 路由柄保留；第 30 页只读 Viewer 重读相同 SVG 且无编辑或 Save，Store CAS 不改变。B8j+B8k / B8i / B8h / B8g / B8f / B8e / B8d / B8c / B8b 以及冲突阻断、503 重试、业务定义历史的原有浏览器验证同批通过。
- **高密度 Node 合成测试：** 13,000 条远处关系仍能在空间索引查询中定位局部线条；`12000→full`、`12001→node-only`、精度预算触发→`coarse` 均明确。此测试是**正确性与算法退化验证**，不是实体 13,000 关系企业场景满画布的 FPS 或响应延迟证明。原有 Diagram Performance Evidence CI 继续作为本轮兼容基线。
- **尚未完成商业验收：** 浏览器测量是对 SVG 文字盒的近似，未做到浏览器 DOM 字形最终路径精确解析；超长文字/多行与字体差异、密集企业图现场性能、持久数据中心重启、实体设备及触摸板、§14 **39项正式商业化验收全部仍 NOT TESTED**。两仓库 PR 保持 Draft，未合并、未部署。


## B8n + B8o 双增量：国际化多行标签与真正 Chrome 12,001 关系完整 DOM（2026-10-10）

- 项目独立 Draft：[Eidos #153](https://github.com/jiangxng/eidos/pull/153)、[EVO #600](https://github.com/jiangxng/EVO-App-Platform/pull/600)，分别堆叠已绿的 B8l+B8m，未改 main、未部署、不改投影 CAS、业务关系端点、Agent/Host 授权、手工 route 和 44 CSS px hit targets。详见 `docs/architecture/DIAGRAM-B8NO-MULTILINGUAL-DENSE-DOM-INTEGRATION-20261010.md`。
- **B8n** 真实 SVG `tspan` 多行显示，中文/日文、emoji、显式换行、超长无空格文本；Intl.Segmenter 字素折行，默认 260 world units/4 行，超长省略号和 SVG title/aria 保留完整原始 caption。与 Eidos 共享同一个 `diagramCaptionLayoutV010` 碰撞矩形（真实字体宽度及各行占位），避免显示换行而评分仍按单行；历史单行 label 表现保持，不能重写手工路线。
- [**真实 Chrome 154，32 标签页 #38037526845 PASS**](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38037526845)：合成中日多语言＋表情＋长文字关系标签实际生成四行 `tspan` 和最后一行 `…`，SVG title/aria 均保留全文，readonly Viewer 文本行和两侧关系 SVG 路由与 Designer 一致，没有编辑/Save，Store CAS 未变。B8l/B8m、B8jk、B8i、B8h、B8g、B8f、B8e、B8d、B8c、B8b 与原有 CAS/503/history 回归标记全部为 true。
- **B8o** 新增独立 [Chrome 完整 DOM 性能工作流 #38037486856 PASS](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38037486856)，默认 P01 历史比较不变；真实挂载 300/1200、600/2400、200/12001 节点/连线合成图，实际 SVG 数 2412、4820、24065。预热后各取一次 mount 为 175.0、251.5、356.3ms；选择为 77.7、141.2、260.1ms；CDP dispatch p95 20.32、22.03、29.04ms；JS heap 5.64、16.02、25.82MB。前两档 `full`、无降级告警；**第三档真正从 Chrome DOM 取得 `node-only` 和明确非阻挡提示**。这是实际 DOM+鼠标事件，不是抽象索引数据；却仍是**CI 合成业务图和单次样本**，不证明生产 FPS 或全复杂路由的 12k 性能。
- 待测：真正 CJK/RTL 文本布局与多行可用性、浏览器字体轮廓/换行词边界、真实企业图大规模正交/曲线同时存在时的性能、长时间内存波动、实体 iOS/Android/Windows/macOS/触控板、持久化重启、§14 **39 项正式商业化验收仍全部 NOT TESTED**；PR Draft、未合并、未部署。
