# B8a：自动折线段直接拖动的 App Platform 差分集成（2026-10-10）

**源与基线**：原始商用设计和研究索引 [#552](https://github.com/jiangxng/EVO-App-Platform/pull/552)，[Eidos Draft #143](https://github.com/jiangxng/eidos/pull/143) 基于 P01a #141，本仓库 B8a [Draft #581](https://github.com/jiangxng/EVO-App-Platform/pull/581) 基于 P01a #573。前轮 B5a/B6b 对触摸安全、路由 Undo、44px 热区和路由手动路径点的决定继续有效；没有冒称重新阅读 S1–S7 官方原文。

## 用户行为与不变量

- 已指定 `orthogonal` / `rounded-orthogonal` 但尚无手工 waypoint 的连线，选中即可通过画布自动线段控制柄直接拖动，不能要求用户先添加一个点；操作预览不持久化。
- 使用实际自动路由相同的绕障碍折点、相同 P01a 空间索引障碍、6 CSS px B6b 吸附、仅法向移动。取消恢复原始 SVG `d` 和标签定位；松手才转换到手工 `waypoints`，只影响展示层。
- 与 Host `renderContextNavigationV010`、B7b 投影写 token/CAS、业务定义修订/权限完全解耦。成功提交一次 Undo checkpoint，随后沿用显式 Save；浏览器不可隐式保存。
- 保留老共线自动路由的重复中点去重和控制点数量上限；直线风格、曲线与自环不自动强制转换。

## 自动化证据和限制

新 `tests/integration/diagram-auto-route-segment.test.mjs` 已加入 Diagram Designer Integration CI 的 path filter 和**实际命令**；专项用例包括真实绕障碍、纯水平退化路径、原路由端点、无隐式改写和代码交互守卫。

`tools/diagram-projection-browser-conflict-proof.mjs` 在原四个真实 Chrome 标签页外添加第五/六两个独立的自动折线编辑场景：从原业务关系切为 orthogonal，**不点 Add path point**，原生鼠标拖动、取消还原、重新拖动完成转换、Undo 恢复自动 SVG，验证 Host projection store 和业务修订不变。以最终最新 HEAD 上的 Browser CI PASS 为证据；在 CI 未通过前不可宣布完成。

缺口仍有 rounded 复杂路径真机、跨设备触摸、中断与重新载入后的 Viewer 保存往返、性能高密度图。原 39 项 §14 完整验收门槛继续 NOT TESTED。

## 最新实际 Chrome 浏览器证据（2026-10-10）

[Diagram Designer Browser CI 38016452101](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38016452101) Chrome/154.0.8037.97 **PASS**，六标签页。第五标签页从真实关系 `orthogonal` 自动路由开始，无手工路径点，原生鼠标抓取自动线段形成 SVG 预览，再用 DOM `pointercancel` 验证显示和手工数据均完全回滚；第六**独立新页面**直接抓取同类自动线段，释放后生成可编辑 waypoint，Undo 移除手工点并重现原 SVG `d`，无隐式投影 Save。机器证据 `autoSegmentDragCancelConvertUndo=true`，原来 CAS 三窗口/HTTP 503/网格/群组/手工 waypoint/正交段测试都通过。

**保留局限：** 先前在同一页面使用人工 DOM `pointercancel` 后立即使用 CDP 原生鼠标重抓，未触发第二次预览，无法证明这是 CDP 状态问题或真实系统取消问题；因此不能写成“同页取消后立即再拖已验收”。还需真实设备的多指中断和重复抓取、圆角自动线段视觉一致性、显式保存刷新后 Viewer 往返、复杂障碍密集图。本次是 B8a 交互子场景，不是 §14 全部 E03 PASS。
