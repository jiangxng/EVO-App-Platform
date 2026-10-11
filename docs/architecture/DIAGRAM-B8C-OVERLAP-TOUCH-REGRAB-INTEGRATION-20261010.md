# B8c — 重叠路径点/正交段消歧、同页浏览器触摸取消重抓（2026-10-10）

## 继承和修改范围

- 正式研究/设计来源沿用独立 [2D Designer 交接 PR #552](https://github.com/jiangxng/EVO-App-Platform/pull/552)，不冒称本轮重读 S1–S7 外部资料；B8a [Eidos #143](https://github.com/jiangxng/eidos/pull/143) / [App #581](https://github.com/jiangxng/EVO-App-Platform/pull/581) 自动正交段拖动，B8b [App #583](https://github.com/jiangxng/EVO-App-Platform/pull/583) 已有真实 Save→新 Designer→只读 Viewer 证据。
- 本 [App Draft #586](https://github.com/jiangxng/EVO-App-Platform/pull/586) 叠加 B8b #583；Eidos 配对 [Draft #144](https://github.com/jiangxng/eidos/pull/144)。Eidos 源实现只修改 `edge-waypoints.ts` 和 `surface.ts`，App 仅 targeted mirror `vendor/eidos/src/diagram/*`，保留 App 特有 `renderContextNavigationV010`、B7b CAS、Host 工具/Agent 权限和投影展示层契约，业务定义不产生新版本。

## 实现口径

**Shift+拖动**路径点命中目标选择最近的被其 44 CSS px 热区遮挡的正交 segment；**Shift+Alt+拖动**选择第二候选；普通左键仍优先 waypoint。segment 和 waypoint 命中热区半径均为 **22 屏幕 px**，保持现有商业设计，不通过缩小热区解决重叠。无真实遮挡时仍拖 waypoint；不是坐标重排、不是强制自动路由转手工，也不会产生隐式投影保存。通过原导线几何法向吸附、单 Undo checkpoint 以及取消后恢复机制实现。

## 真正浏览器证据

[Browser CI run #38018569747](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38018569747) **PASS**：Chrome/154.0.8037.97，**10 标签页**，机器证据 `b8cNativeShiftOverlapSegmentUndo=true`、`b8cNativeTouchCancelRegrab=true`。新增第九标签页采用真实投影关系、在自动路径上加一个手工点生成重叠区域，CDP 鼠标 `modifiers:8` 触发 Shift+拖动被遮挡 segment，验证预览不同、松手出现多点、Undo 回原单点/SVG、投影 Store 未写。第十标签页改用 Chrome 原生 CDP `Input.dispatchTouchEvent`（不是 JS 自造 DOM PointerEvent）发送 **touchStart→move→touchCancel→第二次 touchStart→move→touchEnd**，在**同一标签页**完成取消路径无变化及后续重新抓取转换手工路径、未隐式 Save。

旧 B7b 三窗口 CAS、HTTP 503、手工操作与 B8a 自动路由、B8b Save/重新打开实际 Designer/真实只读 Viewer SVG 完全往返也同时通过。纯几何回归 `tests/integration/diagram-overlapping-handles.test.mjs` 已加入 Diagram Integration CI 的触发 paths 和真正执行命令。

## 证据限制与剩余工作

- 上述“浏览器原生触摸取消”是 CDP 输入协议驱动 Chrome 触摸生命周期，不是物理设备的 OS 取消，尚不能宣称 iOS/Android/Windows/macOS 实机验证完成。人工 DOM PointerEvent cancel 后 CDP 鼠标重抓失效的旧测试反例作为非等价的输入合成干扰保留，不以新测试冒充 OS 故障已修复。
- Shift+Alt 第二个候选已做确定性单测，跨平台键盘鼠标实操仍需单独检查。超过两个完全重叠候选的操作路径仍待研究；曲线路径、复杂圆角/自环、移动多指/触控板、500/1000 高密度连续拖动及 39 项完整 §14 正式验收仍为 `NOT TESTED`。
- 当前所有开发均为独立 Draft PR，未合并、未部署，不影响另一主线。
