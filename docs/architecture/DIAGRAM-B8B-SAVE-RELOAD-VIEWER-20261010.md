# B8b — 自动正交路线转手工后的保存、重开与只读 Viewer 往返（2026-10-10）

**基线与隔离：** [App B8a Draft #581](https://github.com/jiangxng/EVO-App-Platform/pull/581)、[Eidos B8a Draft #143](https://github.com/jiangxng/eidos/pull/143)。本切片独立 [App Draft #583](https://github.com/jiangxng/EVO-App-Platform/pull/583)，只在浏览器验证脚本与文档增加内容；不改写产品业务逻辑、不合并或部署。原始设计和官方研究参考见独立 [交接 PR #552](https://github.com/jiangxng/EVO-App-Platform/pull/552)。本轮未重新访问外部资料网址。

## 已通过的实际浏览器/Host 回路

[GitHub Actions Browser CI #38017423084](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38017423084) **PASS**。Chrome `154.0.8037.97` 中真实加载 8 个独立标签页，同一个真实 App Platform **Definition Projection Store/Artifact Source** 和同样的 App 动作处理器。

1. 前六个标签页执行原 B7b CAS（双会话冲突、另存、HTTP 503 与重试）、B6b 手工点/正交段抓取、B8a 自动段抓取/取消/松手转换与 Undo，不删除旧覆盖。
2. 第六个 Designer 在 B8a 成功提交自动线段转换后，先 Undo 到原自动 SVG 与无人工 waypoint，再通过 UI **Redo** 还原转换完成的手工路径。Redo 的 `d` 与控制点输入数量须与真正提交时一致，且未保存前 Store version 不变。
3. 在真实编辑器 UI 点击 `Save projection`；经过 App 原有身份上下文、授权和独立投影 CAS，Store version **3 → 4，恰好增加一次**。持久化 Gallery 的 `view.edgePaths` 必须含同一 edgeId 的 `pathKind=orthogonal` 和新生成的手工 waypoints。业务定义历史长度仍为 1。
4. 在新的第七个 Chrome 标签页打开 Designer，实际通过后端 ActionHost 重新读取保存后投影。重新选中相同关系，核对 **SVG `d` 与手工路径控制点数量**与 Save 前逐项一致。没有复用原页面内存数据。
5. 第八个 Chrome 标签页加载由 `createEnterpriseDefinition2dPreviewPageV010` 和 `mountDiagramWorkspacePageV010` 构建的**真实只读 Enterprise Definition Viewer 工作台**。该 Viewer 通过原 `createEnterpriseDefinition2dPreviewReadActionV010` 读取持久化 Gallery，并实际渲染 SVG。SVG `d` 与转换后 Designer 完全一致；不会出现手工点或自动段编辑热区以及 `Save projection` 按钮，且 Viewer 读取不增加投影或业务定义版本。
6. 检查回读后 relation 的 source、target、kind 与原业务图完全一致，waypoints 与 Gallery 中保存的一致。

机器日志标记 `b8bSaveReloadRealViewerRoundtrip=true`、`autoSegmentDragCancelConvertUndo=true`、`staleWriteBlocked=true`、`retrySaved=true`、`businessHistoryUnchanged=true`。

## 正确的验收界限

以上是**真实 Chrome + 产品动作处理器 + Memory Store** 的 UI 往返证据，证明自动线段局部展示改动经显式保存、重新读取、真正 Viewer 渲染，未改业务账本；不代表线上 Railway/跨区域分布式 CAS 已测，更不能代替物理设备触摸。

之前 B8a 使用人工 DOM `pointercancel` 后，立即在**同一标签页**使用 CDP 原生鼠标重新抓取未成功；因人工取消事件与真实 OS 指针序列不同，尚不能确定为产品故障或测试输入状态问题。真实触摸多指系统取消后立即重抓、圆角自动线段复杂场景、500/1000 连续交互、Win/macOS/iOS/Android 设备、线上部署仍需验证。原 §14 的 39 项完整验收依旧 `NOT TESTED`；但 D04 保存/刷新/Viewer 的 B8b 正交自动转手工**子场景**已有正式自动 Chrome 证据。

本切片不修改 Eidos 源码或 App Platform 产品源码，只有验证与文档；B8a #581 保持原开发 PR，#583 独立叠加，保障与其他项目主线无冲突。
