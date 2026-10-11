# 2D Designer B8v+B8w：拥塞路线可见摘要与跨浏览器重绘证据（2026-10-10）

## 入口、依据与分工

本增量直接继承 [B8t+B8u 浏览器证据](./DIAGRAM-B8TU-ROUTING-BROWSER-ACCEPTANCE-20261010.md)、[Eidos B8v+B8w 设计与边界](https://github.com/jiangxng/eidos/blob/feat/diagram-commercial-congestion-summary-postselect-b8vw-20261010/docs/architecture/DIAGRAM-B8VW-CONGESTION-SUMMARY-POSTSELECT-20261010.md)、[§14 原始 39 项验收](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) 与历史官方资料 S1–S7。本轮没有把旧网址清单写成新查阅资料，也没有重做已经恢复的研究。

- [Eidos Draft #158](https://github.com/jiangxng/eidos/pull/158) 基于 #157；[App Draft #606](https://github.com/jiangxng/EVO-App-Platform/pull/606) 基于 #604。
- Eidos 持有通用 SVG Surface 统计与非阻挡提示；App 保留 `vendor/eidos` 独有 Host `renderContextNavigationV010` 等集成差异。两者均未增加 Host/Agent 授权、业务关系端点修改、CAS 版本或持久保存动作。
- 两仓依然独立 Draft、未合并、未部署、未触碰 TR-01 主线、全局 authority/status 文件。

## B8v：区分全墨迹精度与真正路由失败

B8t 真实 Chrome 自动正交合成图中 `300/900` 有 **21** 个 `data-eidos-diagram-route-congested`，`400/1200` 有 **27** 个。此前已逐条暴露拥塞 `aria-label`，但没有集中计数；浏览器同时返回 `inkQuality=full`（空间墨迹索引全精度），容易被误认成所有线都已无碰撞。

**已实现**：每次 Eidos Surface render 统计该帧真正可见连线的 `geometry.congested`，在 SVG 只读 `data-eidos-diagram-congested-count` 中给出确切数量。**只有大于零**才显示 `N routes need review` 及辅助语义 `N of M visible connectors need manual route review`，使用非阻挡 `pointer-events:none` 与 `role=note`，不制造无界反复的 screen reader 警报，不改变自动路径或关系语义。Eidos / App 的 `surface.ts` 分别做了对应小块精确修改，没有覆盖 vendor 的 Host 导航。

**实际 Chrome 154 证据**：[Diagram B8t CI #38060230522](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38060230522)，针对代码提交 `bfb10f913a5fd625462144863ecd6d2f7d9dd99b`：
- Node 结构与安全镜像 **6/6 PASS**，含 B8v 汇总的 render 生命周期、非阻挡角色与独立计数；
- 浏览器挂载 **300/900** mount 93.2ms、select 41.7ms、mouse dispatch p95 16.77ms、JS heap 5.44MB；
- 浏览器挂载 **400/1200** mount 104.1ms、select 49.7ms、p95 23.18ms、JS heap 7.54MB；
- 逐一断言 route-congested hit path 数量与 SVG 汇总数据一致、摘要 `role=note`、`pointer-events:none`，并要求每条拥塞边仍带完整 `aria-label`。确认为 **21/900 与 27/1200，均诚实降级**，不把 `inkQuality=full` 冒充全图零拥塞。
- 合法合成图经过实际生产 Eidos `validateDiagramEditorStateV010` 后才用真 Chrome 154 全 DOM；各档预热+两次正式样本；时间仅为 CI runner，不是生产 SLA / FPS。

**零拥塞防误报**：在 B8w Firefox/WebKit 的单条安全曲线图进行真实点击前后，`data-eidos-diagram-congested-count=0` 且全局摘要不存在。该断言防止将“存在关系”或“选择关系”当作拥塞。

## B8w：文字第一次正确不足以证明互动后正确

以 B8u 已通过的 **7 组多语言受控标签 × 真 Firefox/WebKit = 14** 次为前提，额外使用真正 Playwright mouse click 选中节点，触发画布重新 render、相关连接线标题变化，再次从最终**父 SVG `getBBox()`**读取其左右位置，和未校准前的 `data-eidos-diagram-caption-world-x` 同一个世界坐标预留框严格比较；文字原文必须由逻辑文字或 SVG `title` 保留，RTL/LTR 仍正确，并确保无脚本错误。

[真实 Firefox/WebKit #38060230544](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38060230544) 记录 `B8W_POST_SELECT_RESULT.nativeClicks=14`，14/14 PASS；`B8U_COMPLEX_TEXT_RESULT.samples=14` 仍 PASS；两个真实引擎各 258 个可见 RTL 标签，仍明确触发昂贵二次 `getBBox` 256 次上限诊断，保持以前确定的密图默认隐藏标签策略。真实 Firefox/Linux 和 WebKit/Linux **不等于** macOS Safari / iPhone 真机；不能外推所有字体。

## 兼容回归、商业验收和下一步

- [Chrome 154 34-tabs Browser Conflict #38060230507](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38060230507) **PASS**，同一 App 代码提交上还确认了原 B8p～B8b、选中/鼠标/取消重抓、CAS 冲突阻断、保存错误重试及业务历史不改变。该值是自动化布景与原有回归，不等于实机交付。
- 最新 App #606 head 的 CI 在文档提交以后还需重新检查；**不得偷换为此前运行的 commit**。最终具体 head/run 可以直接从 PR 的 Checks 查证。
- **§14 39 项正式商业化验收仍 NOT TESTED**：真实企业数据、物理 iPhone/Android、Windows/macOS 字体与触控板、多个图形实例、数据库/重启服务往返及持续压力仍是不同级别的任务，不能以这次浏览器机器子场景宣布全部验收。

建议下一小步：跨真实节点拖动/撤销验证拥塞数量是否同步变化；多实例画布与只读 Viewer 分离；实体设备的 Pointer/RTL 整体交互矩阵。保持双仓专项 Draft、权限/数据边界。
