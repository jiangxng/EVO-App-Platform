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
