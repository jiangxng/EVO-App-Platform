# B6a — App Platform 内置 Eidos 吸附对齐差分集成（2026-10-10）

**来源：** [交接 PR #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 的原始商业化需求 §7.2/§10/§12/§14 与研究索引。本窗口继续继承已确认的参考资料等级；**没有声称重新读过 S1–S7 官方原文**。此次 B6a 采用既定「Eidos 图形交互、App Platform 权限/投影保存/业务语义」边界。

## 本轮实现与分工

- 上游 Eidos B6a 新模块 `src/diagram/snapping.ts`（纯算法），`surface.ts` 只在节点拖动时应用；App Platform 仅在 `vendor/eidos/src/diagram/{snapping.ts,surface.ts,index.ts}` 做对应**差分式移植**，不得直接替换整个 Surface。Host 的上下文导航 `renderContextNavigationV010` 必须保持。
- 网格基础间距 24 世界单位（小比例尺按 2 倍阶梯放大以维持约 ≥12 CSS px 屏幕网格间距）、6 CSS px 吸附阈值，分别可关闭 Grid、Grid snap、Align（对齐时显示轻量虚线）。对齐目标仅包含当前可见、不属于拖动组的节点；锁定节点可以作为参照，但本身不因吸附移动。群组统一偏移，单次操作产生一条 Undo。
- Node 纯几何测试与 vendored Surface 静态回归位于 `tests/integration/diagram-snapping.test.mjs`，已显式接入 Diagram Designer Integration CI 的 **执行命令** 和 path filter；与 B7b Agent / CAS / Browser PR 堆叠，但不修改 B7b 存储逻辑。
- 已知未覆盖：手工路径点与正交线段吸附、对象对齐/等距工具按钮、真实多平台拖动、放大后网格密度策略、规模 FPS（B6b/P01）。这些不能因 CI 通过直接标为 §14 验收 PASS。
- 39 项证据矩阵应保留 NOT TESTED，写入 B6a 对 M04 / M09 / T04 / A01 等的自动化候选和后续实测条件。

## 核对方法

需分别检查 Eidos B6a PR 和 App Platform B6a PR 的最新 SHA、CI 和 stacked base。浏览器真机至少覆盖 10%、100%、300%，左键节点单拖、多选整体拖、触摸取消与 Esc、选择操作不保存，以及 Grid/Snap/Align 三模式切换。继续禁止擅自 merge/deploy/main 覆盖。

## B6a Browser CI 的实际验证（2026-10-10）

[Diagram Designer Browser Conflict CI 38011441150](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38011441150) 在 Chrome/154.0.8037.97 通过，沿用 App Platform B7b 的本地真实 ActionHost 与 Eidos DOM：检查 Grid / Grid snap / Align 默认状态及切换独立性，用 CDP 的真实 mousePressed/mouseMoved 模拟网格吸附预览，在 10% 相机缩放验证落在自适应网格世界坐标点；随后 `pointercancel` 回滚预览且 gallery version 保持 0。原有多窗口 CAS/Save As/HTTP 503 重试测试仍运行并通过。日志 `DIAGRAM_BROWSER_CAS_PROOF` 新增 `nativeGridSnapCancelled=true` 与 `independentGridModes=true`。**没有证明实体 macOS 触控板、iOS/Android 触摸或其他真实设备**。

该反馈促进了基于原定 6px 阈值的自适应网格间距细化：10% 缩放时 24 世界单位网格显示过密，现用 192 世界单位，与 snap 计算共同调整；没有更改原研究采用的交互决策。
