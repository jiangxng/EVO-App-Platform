# B6b — App Platform 内置 Eidos 的路径吸附及对齐分布集成（2026-10-10）

**来源：** [研究交接 PR #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 的原始商业化 v1.0、参考索引及 §14 的 39 项验收矩阵。基于 B6a [App #566](https://github.com/jiangxng/EVO-App-Platform/pull/566) 和 B7b 的 Agent/CAS/browser 证明。**不把原始参考链接清单当作本轮已重读的外部原文**。

## B6b 实现和安全边界

- 新 Draft [Eidos #140](https://github.com/jiangxng/eidos/pull/140) 提供 `diagramSnapHandleOffsetV010`、`diagramArrangeNodesV010` 纯几何及 Surface 手柄/命令；本分支 [App #568](https://github.com/jiangxng/EVO-App-Platform/pull/568) 差分更新 vendored `diagram/snapping.ts` 和 `diagram/surface.ts`，保留 `renderContextNavigationV010` 与 B7b 写 token、CAS。
- 手工 waypoint 双轴吸附；正交段仅在法向轴移动；参考节点与其他显式 waypoint，网格/节点吸附完全依循 B6a 的独立开关、6 CSS px 阈值及低比例尺扩展网格步长。
- 选中两节点以上出现 More → Align left/center/right/top/middle/bottom；三节点以上可选 equal-gap distribution。目标位置是本地投影数据，保存时沿用 App 的显式 Save 及投影独立版本 CAS；每次操作只生成一个本地 Undo checkpoint，撤销无 Host 写入。
- Node 专项测试 `tests/integration/diagram-snapping-tools.test.mjs` 已纳入 Diagram Designer Integration CI 路径过滤与**实际执行命令**。B6a / B7b 浏览器自动化 CI 不删减原有测试，并增加了真实三节点选择、Align left 与 Undo 的交互验证；Browser CI 成果以最终 run 结果为准。
- 本次不更改业务定义、交易、财务账本、关系拓扑、权限、模板安装或旧投影结构，不重写 vendor 整个 Surface。

## 没有宣称完成的测试

物理 Windows/macOS/iOS/Android 设备手势；路径手柄实际浏览器中左键/第二指/捕获丢失场景；500 节点/1000 关系性能；完整 §14 39 项。即使 Node CI、Chromium 自动化子场景成功，完整 E03、D02、P01、A02 的结论仍按矩阵登记。

## 真实 Chrome 第四标签页与图层抢占修复

- 初次专用 Chrome 测试尝试用鼠标拖动手工路径点，发现 SVG waypoint 44px target 被正交 segment 的 44px target 覆盖，鼠标实际上命中 segment。已将 **segment hit circle 先绘制、waypoint hit circle 最后绘制**，修复 B5a 的目标优先级缺陷，所有热区尺寸不缩小；上游 Eidos #140 和本仓 vendored 代码均同步。
- 后续真实 browser 测试中的 Undo 会按既定交互规则**清除选择**，所以验证器必须重新选中同一条关系后再读取 restored waypoint。这是测试步骤修订，不是产品 Undo 丢数据。
- [Browser Conflict CI 38012891164](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012891164) **PASS**，实际 Chrome `154.0.8037.97`，四标签页，机器日志 `nativeRouteHandleSnapAndUndo=true`、`groupAlignmentUndo=true`、`nativeGridSnapCancelled=true`、`staleWriteBlocked=true`、`retrySaved=true`、`businessHistoryUnchanged=true`。
- 第四标签页实际执行真实关系选择 → 切换正交路径 → 通过属性面板添加 waypoint → 用 Chrome 原生 CDP mousePressed/mouseMoved/mouseReleased 进行 SVG 控制柄拖动并吸附网格 → Undo → 重新选择关系确认原 waypoint 位置恢复，全程不写 Store。原有 B7b 三标签页保存冲突 / HTTP 503 和 B6a/B6b 群组测试继续通过。
- **尚未实测：** 正交线段本身的原生手柄拖动、曲线路径、手机 Safari/Android Chrome 触摸、双指中途加入、500/1000 大规模性能。原始 §14 39 项完整验收不据此直接置 PASS。

## Chrome 原生正交线段拖动（后续新增证据）

[Browser Conflict CI 38013268466](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38013268466) 在 Chrome/154.0.8037.97 四标签页真实 DOM 中 **PASS**。第四标签页通过路径点数字 X/Y 输入创建清晰非共线折弯（原始单控制点可能与唯一线段手柄完全重叠），用 `document.elementFromPoint` 确定 segment target 真实可点击，按 target 的可移动法向轴发送原生鼠标 press/move/release，核对 SVG 路径改变，再 Undo、重选原关系，核对路径 `d` 与操作前完全相等，并确认 App Host Store 版本未增加。日志记录 `nativeOrthogonalSegmentSnapAndUndo=true`，此前 `nativeRouteHandleSnapAndUndo`、`groupAlignmentUndo`、`staleWriteBlocked`、`retrySaved`、`businessHistoryUnchanged` 同一 run 都为 true。

**余留：** 重叠命中目标在退化几何下的显式消歧、其他路径组合（曲线/自环）、实体 iOS/Android 多指设备、Windows/macOS 触控板、500/1000 大图 FPS 与完整 Viewer 保存往返。原 §14 E03 仍为 NOT TESTED，浏览器两个子场景通过不替代完整正式验收。
