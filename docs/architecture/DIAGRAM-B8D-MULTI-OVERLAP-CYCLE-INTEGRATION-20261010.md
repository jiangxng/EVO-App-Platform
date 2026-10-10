# B8d — EVO 集成：三段以上重叠控制柄的连续选择（2026-10-10）

## 来源与修改界限

- Eidos B8d 从 [#144](https://github.com/jiangxng/eidos/pull/144) 延伸；App B8d 从 [#586](https://github.com/jiangxng/EVO-App-Platform/pull/586) 延伸。研究交接 [#552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 是沿用来源；本轮没有重新验证外部设计资料。
- App 只镜像 `vendor/eidos/src/diagram/edge-waypoints.ts` 和 `surface.ts` 及增加 `diagram-overlapping-handles.test.mjs` 测试，不触碰 App Host 导航 `renderContextNavigationV010`、CAS 写令牌、Agent 裁剪语义、业务图定义版本。

## 设计与行为

- **原手势完整保留**：普通拖 waypoint，Shift 拖最近段，Shift+Alt 默认拖第二段，继续保持所有命中圈 22px 屏幕半径（44px 直径）。
- 当 waypoint 覆盖 3+ 不同正交线段：Shift+Alt **单击**递进至第三、第四……最后循环回第二；再 Shift+Alt 拖动操作已选择的线段。途中的 `N/M` SVG 文本只是视觉提示，无指针命中，title/aria-label 表达完整操作。
- 原未拖动点击仅调整当前画面控制柄的临时目标，不写投影；路径数据、业务图端点、Host CAS 不变。真正 drag release 与 B8c 一样仅一个本地 Undo，显式 Save 后才写投影 Store。
- 纯几何辅助方法允许按 0-based ordinal 枚举候选，拒绝非法缩放、非法索引、非有限坐标，去除同 index+axis 重复；既有 boolean 选择 API 保持兼容。

## 证据状态

- 本切片必须以 GitHub PR Actions 实际结果判定编译和单测，不把提交代码等同于 CI PASS。
- **尚未完成**实际 Chrome 多候选鼠标 Shift+Alt 单击→拖动→撤销的浏览器证据；iPhone/Android/macOS 触控板/实体键鼠也尚未测试。B8c 十标签页的 Chrome CDP 测试不能自动算作 B8d 验收。
- 原有 [§14 验收矩阵](../DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md) 的 39 项均维持 `NOT TESTED`，E03 只记新增局部自动测试证据。新分支为 Draft、无合并、无部署。
