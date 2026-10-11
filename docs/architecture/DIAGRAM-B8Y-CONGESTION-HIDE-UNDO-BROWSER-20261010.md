# B8y｜2D Designer 可见拥塞在隐藏与 Undo 之后的重新计算（2026-10-10）

## 起点与边界

- 接续 [B8x 同页面双实例](./DIAGRAM-B8X-TWO-INSTANCE-ISOLATION-20261010.md)、[B8v/B8w 拥塞摘要与字体重排](./DIAGRAM-B8VW-CONGESTION-POSTSELECT-INTEGRATION-20261010.md)，不重新解释研究结论和旧官方网址。
- 本轮独立 [EVO Draft #608](https://github.com/jiangxng/EVO-App-Platform/pull/608)，基于 #607。**仅改 Firefox/WebKit 真实浏览器测试脚本、该测试 CI 和证据文档**，不修改运行时的 Eidos/Platform、Host/Agent 授权、关系 source/target、投影保存/CAS 或项目主线 TR-01。仍 Draft，不合并不部署。
- 上一轮 B8t 发现合法合成 900/1200 边中 21/27 条有拥塞；B8v 提供画布级别汇总；B8x 证实同屏两个图不能混淆消息。此轮补 **状态变化之后**的验收证据。

## 本轮真实浏览器自动化场景

复用原 B8x **同一页面两个独立 Designer 实例**：

1. 第一幅拥塞图保持自动 `orthogonal` 连接线和 **23 个相关局部障碍**（超过原有路由器 22 障碍上限），未修改 A* 22/2600 的安全约束。第二幅图是一条无拥塞的 `curve`，有独立 SVG marker 与选择状态。
2. 第一图单独启用既有 `localNodeDrag`、`localSelectionHide` 与 `localVisibilityReset` 选项，**不增加新的模型契约**。
3. 真实 Playwright 鼠标点击第 23 个障碍节点 `block-22`，再实际点击已存在的 `data-eidos-diagram-local-hide` UI 操作。要求第一图原 SVG 拥塞数/全局汇总从 `1 → 0`，不残留过期警告；第二图维持 `0`，先前选择保留。
4. 真实点击 Undo（`data-eidos-diagram-history='undo'`）恢复障碍，可见路由应重新按原预算计算 `0 → 1`；恢复非阻挡 `1 routes need review`，业务底层数据节点和边数保持不变。禁用任何隐式保存，最终只影响这个页面的本地图形视图。
5. 两个真实浏览器引擎 **Firefox/Linux、WebKit/Linux** 各执行一次，同时必须继续通过 B8u 14/14 文字、B8w 14 次原生点击排版重测、B8x 双实例与 258 标签 256 测量上限测试。

新增机器可读取证据为 `B8Y_VISIBILITY_UNDO_RESULT`，CI 工作流强制 grep 校验。旧 B8v 可见拥塞 DOM 检查只证明单帧，不自动视为此项通过。

## 验收等级与缺口

- 即使本项真实浏览器 PASS，也只说明**合成合法图、同页面、本地隐藏/撤销**流程的机器子场景；不能宣称真实 S2C/P2P 企业数据、服务端保存、CAS 冲突、Viewer 重新打开、浏览器/数据库重启或跨企业 Agent 授权已由本轮验证。
- 原 §14 的 39 条**正式商用签收仍 NOT TESTED**。实体设备 Safari iOS / Android、Windows/macOS 字体与触控板、真实客户数据和长时间性能另需核验。
- 本阶段不合并、发布或改写项目状态 authority 文件。失败保留红色历史，修复必须附同一最终 head 的 PASS 证据。

## 后续

在通过上述本地可见性回归后，下一阶段做原生**真实拖动障碍节点**导致拥塞计数刷新，再 Undo 恢复；随后从 App 正式投影保存端至独立 Viewer 读取对齐此提示的边界。不能因为已有 B8b 单次保存/Viewer 往返证明了路径形状，就推断 B8v 新增的拥塞摘要也在 Viewer 运行。
