# B8g — EVO 2D Designer 自环避障与保存后方向锁定（2026-10-10）

## 源材料/决策和代码位置

- B8g 分支只从 [App B8f #593](https://github.com/jiangxng/EVO-App-Platform/pull/593) 派生，Eidos 独立 [Draft #148](https://github.com/jiangxng/eidos/pull/148)、App 独立 [Draft #595](https://github.com/jiangxng/EVO-App-Platform/pull/595)。旧标准仍见 [研究交接 #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 和 §14，所列研究文献不是本轮重新访问的原文。
- 文件仅限定 `vendor/eidos/src/diagram/edge-lanes.ts`、`surface.ts` 及镜像测试和证据；不动 `renderContextNavigationV010`、Agent/CAS/业务关系、主线状态，未合并或部署。

## 决策、结果和理由

- 方向优先级固定 **右→下→左→上**，但不是无条件选右：按当前可见节点与每个自环外侧候选包围区域的交集面积计算，首选无冲突的方向；全部冲突时用最小占用面积，稳定同分取右。
- 对 B8f 已有的四种路径外观向其他侧复用正交、圆角、cubic 路径生成。未编辑的右侧路径完全不变；手工 waypoint 仍存在时用位置推导外侧，保留原手工方向。无新契约字段或版本，不改变关系端点与业务含义。
- 大图复用既有空间索引，在确定可以完全覆盖控制柄邻域的范围内做附近查询；其他情况退回完整节点扫描，并以专项单测确保两条路径相等。不会缩小 44 CSS px 热区。
- 其它方案排除：不缩小操作区、不自动移动或清除手工路径、不修改业务拓扑、不把零冲突保障伪称为全局避障。

## 真实 Chrome 实测

[App Browser CI #38023222999](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38023222999)：**PASS**，Chrome/154.0.8037.97，**20 标签页**，日志 `b8gNativeBlockedSideSaveReadViewer=true`。原 B8f/B8e/B8d/B8c/B8b 与 CAS/503 冲突回归也都 PASS。

- 第 18 标签页是测试夹具里的两节点小图：**模拟 self-edge + 模拟右侧 blocking node**，两者都只由隔离 artifact source 注入。通过真实 App Host read、实际 Chrome Designer、Inspector 的 Restore automatic routing 操作移除原手工路径覆盖，系统重排至下侧；CDP 原生鼠标验证控制柄被正确命中，半径 22 CSS px 不变；本地拖动 cubic 的预览/提交、Undo/Redo 严格匹配，未隐式保存。
- 真实 App Host 授权及 CAS 显式保存投影：版本 **6→7** 仅一次，`edgePaths` 中仅存展示层路径控制点，业务定义历史 revision 不增加。
- 第 19 标签页全新 Designer 和第 20 标签页真实只读 Viewer 使用**未注入 blocker 的原自环测试源**；因为手工外侧点已保存，双方读取相同 cubic SVG，不因右侧障碍消失而跳回默认右侧；Viewer 无编辑控件/保存按钮、读操作不写。

## 不可夸大的缺口与下一步

- 仅证明“节点占用导致四侧候选切换”和“人工改动后锁定方向”，**并非所有密集业务图的完美避障**：若四侧均被占用，仍按最小交叠显示；未考虑其它连线、标签、窗口边界或多自环相互遮挡，也尚未输出清晰的拥堵警示。优先作为下一增量。
- 真实浏览器场景只测 curve 的下侧自动避障及手工编辑，四侧自动纯几何/round/orthogonal、索引性能验证在 Node CI；其它侧的大图实体设备操作尚未测。
- Chrome CDP 事件不能冒充真实设备；本轮 Store 仍是隔离的测试 provider，未验证进程重启和数据库持久化；§14 **39项正式商用验收仍 NOT TESTED**。Draft、未合并、未部署。
