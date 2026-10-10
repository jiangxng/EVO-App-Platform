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
