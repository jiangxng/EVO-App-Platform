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
| E03 | 拖动折线段或路径点 | B6b Chrome 154 原生鼠标真实 SVG waypoint 拖动/网格吸附/Undo [Browser CI 38012891164](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012891164) PASS；正交段原生拖动和真实触摸等仍待验 | NOT TESTED |
| E04 | 点击曲线远离端点直线的位置 | Eidos tests/diagram-edge-paths.test.mjs；待真实命中 | NOT TESTED |
| E05 | 移动一个/两个端点 | Eidos tests/diagram-waypoints.test.mjs；待真实操作 | NOT TESTED |
| E06 | 曲线/折线转直线再撤销 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| E07 | 标签拖动和节点移动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D01 | 隐藏节点/边再保存 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D02 | 连续编辑、撤销、重做、保存 | B6b Chrome/154 真正三节点多选→左对齐→Undo→坐标完整恢复且未隐式保存，完整 D02 连续流程待验 | NOT TESTED |
| D03 | 保存失败后重试 | B7b GitHub Chromium 154 实际 UI + HTTP 503 注入 + UI 重试，[Browser CI 38010453881](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38010453881) PASS；其他设备仍待验 | NOT TESTED |
| D04 | 保存后刷新、Viewer、模板预览 | App tests/integration/definition-projection-edge-routes.test.mjs；待 Viewer 手动 | NOT TESTED |
| D05 | 两窗口冲突保存或 Agent 更新 | B7b Chrome 两独立 Tab 实际 Eidos DOM 选择/隐藏/保存/冲突/另存副本；Direct/Personal Agent Node CAS；真机/真实 LLM 待验 | NOT TESTED |
| D06 | 切换到另一投影 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| A01 | 自动排版含隐藏/锁定节点 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| A02 | 系统大字与键盘操作 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| P01 | 规模样例与连续操作 | 尚无足以确认该场景的专项证据 | NOT TESTED |
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
