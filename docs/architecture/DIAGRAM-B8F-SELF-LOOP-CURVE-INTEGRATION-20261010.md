# B8f — EVO 2D Designer 自环和曲线路径可编辑集成（2026-10-10）

## 承接来源与施工边界

- 上游 Eidos [Draft #147](https://github.com/jiangxng/eidos/pull/147) 从 B8e #146 派生；EVO-App-Platform 独立 [Draft #593](https://github.com/jiangxng/EVO-App-Platform/pull/593) 从 B8e #591 派生。不涉及 main、部署、全局状态文件，保持 Agent 权限、Host CAS 和业务定义版本隔离。
- 源于既定商业设计和 [研究交接 #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 的路径显示层要求。本轮不是重读外部网络资料，不将既有研究链接当作最新查阅证据。

## 产品行为与源代码

1. 原有未编辑自环的直线回环、正交回环、圆角正交回环、曲线回环 SVG 完全保留；选择自环不生成路径点或写 Store。节点自身仍是源节点与目标节点，不改变业务关系。
2. 新增固定在节点右侧上/下边界的 **自环手工路径终端**；正交/圆角自环默认在外侧显示可拖段，首次真实拖动提交后采用 `edge.waypoints` 显示层覆盖，不改源/目标 node ids。
3. 曲线自环以一个外凸 bulge 点操作原 cubic Bézier，向外/上下移动可以调整曲率；首次编辑前不创建手工点，编辑后保留 cubic `C`，不被错误渲染为普通折线。向内越界不可提交。
4. Inspector 新增自环首路径点时初始化外侧合理路径而非节点内部中点。画布 Preview、Undo/Redo、节点移动预览、独立 Designer 重开和只读 Viewer 走同一自环路径计算。
5. 44 CSS px 手柄区域、B8e 的 Escape 尾随点击保护、B8d 重叠控制柄轮选、B8b 显式 Save/Viewer、B7b CAS 写令牌均保留，无自动 Host Save。

## 已执行验证

- Eidos #147 release-check **PASS**；App #593 的 Diagram Designer Integration CI、Platform CI、Project Continuity CI、Diagram Performance Evidence CI 及 Browser Conflict CI 均已在功能提交上 PASS。
- [Chrome CI #38022453391](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38022453391) **PASS**，Chrome/154.0.8037.97，共 **17 个独立标签页**；日志 `b8fSelfLoopCurveNativeDragSaveViewer=true`，旧 `b8eRoundedMultiRankCancelRegrabSaveViewer`、`b8dNativeDenseOverlapCycleAndUndo`、`b8cNativeTouchCancelRegrab`、`b8bSaveReloadRealViewerRoundtrip` 均同时 true。
- 第 15 标签页测试 B8f 曲线自环的真正 Browser DOM：通过真实 Inspector 选择边、外侧 44px bulge 目标可命中；CDP 原生鼠标拖动预览，Escape 取消严格恢复原 SVG，同页重新抓取并释放后提交 cubic 曲线，一次 Undo 后复原，Redo 后精确重做；没有隐式写 Store。
- 通过**真实 App Host 授权和 CAS**执行「Save projection」，测试投影版本由 **5→6（仅一次）**，业务定义 history 数量不变；第 16 个全新 Designer 与第 17 个真实只读 Viewer 读取严格一致的 cubic 路径。Viewer 没有编辑或保存按钮，读操作不改变 Store。
- **注意测试数据来源**：现有种子不包含对应自环关系，浏览器测试把一条自环仅注入隔离 artifact source 测试夹具。关系为模拟样本，不是修改业务定义或在真实企业关系数据上验证；但测试使用完整 App 真实操作 Handler、投影 CAS 和 Viewer 读路径。

## 风险、限制与下一步

- **实际发现密集图遮挡边界**：自动自环当前始终向节点右侧展开，若右邻节点占据同一区域，控制柄会被别的节点遮住。本轮验证选取图中右侧外部空旷节点。**自环多方向路由、障碍避让与重叠消歧尚未完成**，应列为下一阶段优先任务；不能通过减少 44px 目标面积规避。
- 正交/圆角自环几何已有单测和渲染代码保护，本轮实际 CDP 自环浏览器场景只覆盖 **curve 的单 bulge**，不能称正交/圆角自环在真实 Chrome 上已经全部操作验收。
- CDP Chrome/154 浏览器层事件 != 实体 Windows/macOS 键盘/鼠标、触控板或 iOS/Android 系统级手势；Store 是内存测试实现，不代表服务器重启/数据库持久化。跨关系复杂避障、性能、物理设备、全 §14 39 项仍 **NOT TESTED**，当前 PR 为 Draft，未合并，未部署。
