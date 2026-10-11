# B9b｜真实 App CAS Save → 新 Designer → 只读 Viewer 的拥塞展示一致性

记录日期：2026-10-11。基于 B9a [Draft #611](https://github.com/jiangxng/EVO-App-Platform/pull/611) 的独立 [Draft #612](https://github.com/jiangxng/EVO-App-Platform/pull/612)，只补 **Chrome 集成验证工具、专用 CI、文档**，没有改动运行时渲染代码、业务端点、Host/Agent/CAS 约束、TR-01 或 main；不合并、不部署。

## 已核实的前提

- B9a 是受控读取 ActionHost 下的本地隐藏 → public refresh → 全页 reload，不能冒充 App 真正 Save 或数据库持久化。
- B8b 已覆盖真实 App 投影操作处理器的授权、CAS Save、独立 Designer 读取，以及正式只读 Enterprise Definition Viewer 对手工连线路径的重现；但未对 B8v 新增的「拥塞路由摘要」核验新旧视图的一致性。
- 此轮在现成 34 Chrome Tab 脚本的**真正 App 投影 Store、授权 Save、全新 Designer、独立 Viewer**断点上增加读图一致性断言，不伪造 SVG 路径与提示。

## B9b 实测场景

1. 在真正 Chrome 通过编辑器原生自动段拖动、Undo/Redo 和「Save projection」，经 App Handler、授权与 CAS 一次提交，投影 Store 版本到 **4**；业务定义历史仍 **1**。
2. 从三处独立读取当帧的 `svg[data-eidos-diagram-congested-count]`，必须等于实际绘制的 `[data-eidos-diagram-route-congested]` 数量，并确保每条拥塞边有辅助 `aria-label`。
3. 摘要仅在 count>0 时显示；显示时需 `role=note`、`pointer-events:none`，不存在时也不造假警告。保存后的 Designer、全新 Designer 和只读 Viewer 计数必须相同；Viewer 没有 Save 按钮。
4. 对原业务图数据 source/target/kind 与业务定义历史不得变更。原 B8b 所验证的精确 SVG 保存路由形状仍保留。

## 真实 GitHub CI 证据

首次提交 `7737ec177ffe9efa39f1011fb10950e5645af55f`：
- [Chrome 34 Tab Browser Conflict #38067528086](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067528086) **PASS**，Chrome **154.0.8037.97**；`B9B_SAVED_VIEWER_CONGESTION_RESULT`：三套显示分别 `count=0,actualPaths=0,summary=null`，只读 Viewer `savedControls=0`；投影 Store 版本 4，业务历史 1。
- [Project Continuity #38067528091](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067528091) **PASS**。
- 上述证明**无拥塞真实保存往返中的计数一致、无假阳性**，并不证明非零拥塞的保存/Viewer 路径，故下一阶段专门增加该正例，不能把 0→0 描述为正例完整商用签收。

## 证据级别

- 本轮的真实 App Host Handler + CAS + **内存 Projection Store** 与真 Chrome 浏览器 UI，比仅静态模型检查更强；但**不等于真实客户数据库/服务重启持久化、不等于上线环境、不等于实体 iOS/Android/macOS/Windows**。
- 原始 §14 **39 项正式商业化验收仍 NOT TESTED**，机器子场景的 PASS 不升级为正式签收。
- 所有改动留在独立 stacked Draft PR，未合并、未部署，不修改 TR-01 或全局项目进度文件。
