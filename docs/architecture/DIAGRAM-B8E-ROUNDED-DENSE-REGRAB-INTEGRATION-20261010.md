# B8e — 14 标签页圆角重叠路径、取消重抓及真实 Viewer 端到端（2026-10-10）

## 继承和边界

- 基线 App [B8d #590](https://github.com/jiangxng/EVO-App-Platform/pull/590)，上游 Eidos [B8d #145](https://github.com/jiangxng/eidos/pull/145)；B8e 两仓库分立 Draft [Eidos #146](https://github.com/jiangxng/eidos/pull/146) / [App #591](https://github.com/jiangxng/EVO-App-Platform/pull/591)。
- 仅差分镜像 Eidos `surface.ts` 的 Escape 尾随点击保护，增加两侧圆角路径/候选单测以及 App 浏览器联调；保留 App `renderContextNavigationV010`、B7b Host/CAS、Agent 裁剪授权、显示层与业务定义版本隔离。遵循 [原研究交接 #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 的既定口径。
- 不减少 44 CSS px 操作热区；原普通拖点 / Shift 拖最近线段 / Shift+Alt 默认第二并连续轮选依然有效。取消不提交，只有释放确认修改后才生成一次 Undo checkpoint；保存必须显式。

## 新增 Chrome 客观证据

[Browser Conflict CI #38021117688](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38021117688) **PASS**：Chrome/154.0.8037.97，14 标签页，日志 `b8eRoundedMultiRankCancelRegrabSaveViewer=true`，旧证据 `b8dNativeDenseOverlapCycleAndUndo`、`b8cNativeTouchCancelRegrab`、`b8bSaveReloadRealViewerRoundtrip` 均继续为 true。

- 第 12 页实际 Designer 中通过 Inspector `rounded-orthogonal` + 五手工点构造四个以上重叠段。CDP Shift+Alt 原生鼠标单击逐项循环到最后、回第二、重选最后，候选编号与图形均正确，无误写 Store、44px 命中区不缩小。
- 对最后一个重叠段真实鼠标拖动，预览保留 `Q` 圆角；原生 Escape 键取消后原 SVG/候选精确恢复，鼠标松开未清除选中。**同一页再次按下并拖动**可以提交；Undo 后原样恢复，Redo 再次还原已提交圆角 SVG。
- 通过实际 App Host 授权和 CAS 点击 `Save projection`，测试投影版本 **4→5**，领域业务定义历史未增加；新开第 13 页实际 Designer 与第 14 页真实只读 Viewer 路径 `d` 严格一致，Viewer 没有编辑控制柄或 Save，读取不写入 Store。
- Eidos #146 CI 和 App #591 Diagram Integration、Platform、Performance Evidence、Project Continuity、Browser CI 均在本次产品/测试提交中 PASS。

## 仍未满足的门槛

本次为 Chrome DevTools 协议真实浏览器事件流，不是物理设备键鼠、系统触摸取消或 iOS/Android/macOS 触控板验证。Save→Viewer 的测试 Store 是同进程内存 provider，未测服务重启和数据库持久化。未覆盖自环直接编辑、贝塞尔曲线多控制柄、实体触摸两指手势、复杂跨关系重叠、多图同页以及真实硬件 FPS/稳定性。原 §14 39 项仍全部 **NOT TESTED**（可记录局部 PASS，不能把局部测试替代完整商业化验收）；继续保持 Draft、未合并、未部署。
