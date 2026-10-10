# B8z｜浏览器原生拖动与 Undo 后的拥塞计数一致性（2026-10-10）

## 接续关系与范围

本增量 [App Draft #610](https://github.com/jiangxng/EVO-App-Platform/pull/610) 基于 [B8y Draft #608](https://github.com/jiangxng/EVO-App-Platform/pull/608)，继承 [B8x 同屏双实例](./DIAGRAM-B8X-TWO-INSTANCE-ISOLATION-20261010.md)、[B8v/B8w 提示和 RTL 重绘](./DIAGRAM-B8VW-CONGESTION-POSTSELECT-INTEGRATION-20261010.md)。前轮 B8y 已用真实 Firefox/WebKit 验证“隐藏局部障碍→Undo”时路由由拥塞恢复为清晰再回到拥塞。本轮特意**不复用隐藏逻辑**，改用浏览器真实鼠标 `pointerdown / pointermove / pointerup` 拖动，验证设计器实际最常见的节点布局改变。

- 仅更新 `tools/diagram-cross-browser-label-proof.mjs`、专用 `.github/workflows/diagram-rtl-cross-browser.yml` 以及本记录和原 39 项证据矩阵，**不修改 Eidos 或平台运行时源码、业务模型、权限/Agent/CAS/自动布局/Host、已有 22 障碍/2600 网格路由安全上限。**
- 两仓主线/TR-01 不变，所有增量 PR 维持 Draft，**不合并、不部署**；不能把浏览器自动化测试误称为实体设备商用签收。

## 浏览器自动化验收步骤

复用同页两个真实 `mountDiagramEditorPageV010`：第一图包含自动正交连接线和 23 个相关障碍，原本 1 条拥塞；第二图只包含普通无拥塞曲线，0 条拥塞。先由 B8y 使用局部隐藏和 Undo 恢复原始可见图状态，再从真实页面 DOM 获取最后一块障碍节点 `block-22` 的像素 `boundingBox`，通过 Playwright 的真实浏览器 `mouse.move / down / move(14 steps) / up` 在图上纵向移动该节点超过 150 屏幕像素。

断言必须覆盖：
- 拖动前第一图实际拥塞数 **1**；拖动后局部障碍从相关区域移开且 Eidos 真正路由重算，拥塞数 **0**，旧提示消失；
- 第二个图仍为 **0** 条拥塞、选择状态不被此拖动清除；`window.__errors` 无 JS 错误；
- 再通过设计器自己的 `Undo` 按钮撤销移动，第一图回复 **1** 条拥塞和 `1 routes need review`；并非直接写入测试 fixture 或修改 SVG 来伪造结果；
- Firefox/Linux 与 WebKit/Linux 都必须记录 `B8Z_DRAG_UNDO_RESULT`，CI 工作流强制查找事件；B8y 隐藏/Undo、B8x 双实例、B8w RTL 14 次真实鼠标重绘和 B8u 258/256 字形测量上限仍继续执行。

**受测范围**是合成合法数据和真实 Linux 浏览器引擎，不是生产企业 S2C/P2P 图、真实 iPhone/Android/Windows/macOS 输入设备、服务端持久保存后再开独立 Viewer。原商业化要求 §14 的 39 项正式签收结论仍 `NOT TESTED`，本场景仅补自动化证据，不能改写完整验收结论。

## 工作记录方法

CI 正式值以 #610 最新 HEAD 的 GitHub Actions 日志为准。保留任何红色首测及其症结，不得偷换成旧绿色 commit。后续在 B8z 验证成功后，再为真实企业数据 / Viewer 和独立浏览器重开提供同口径测试，不擅自修改业务权限与 Project authority。
