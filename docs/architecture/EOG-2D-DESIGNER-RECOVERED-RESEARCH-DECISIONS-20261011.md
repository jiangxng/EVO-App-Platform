# EVO 2D Designer｜恢复资料与决策索引（2026-10-11）

> **性质：恢复旧窗口研究遗产，非新研究、非实现/验收宣告。** 当前窗口负责 2D 专项；不覆盖主线、Agent、TR-01、Eidos 独立仓库或全局状态文件。本文基于已存档原文与 GitHub 源码、PR 元数据复核。完整的 2026-10-09 要求 v1.0 是唯一商业化范围与 §14 验收基线，不能用 B5/B9/B10/B11 增量取代。

## 1. 原件优先的阅读顺序

1. **原始完整 [《EVO 2D Designer 商业化交互与视觉实施要求 v1.0》](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)**：2026-10-09，§1–§16；特别是 §7 桌面语义、§8 移动触摸、§9 键盘替代、§10 自动排版、§11 保存/撤销、§12 性能、§13 A+B 必须交付、§14 39 项验收、§16 来源。此前 2026-10-10 的原窗口交接记录说明该原文曾与旧会话 Library Markdown 逐字符核对。
2. [2026-10-10 原始研究入口](./EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md)及[官方来源详细索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)：S1–S7、P1–P14；原稿、章节、图例位置、事实与项目判断及取舍。
3. [B9j 接续入口](./DIAGRAM-COMMERCIAL-RESEARCH-HANDOFF-B9J-20261011.md)及[增量资料/证据索引](./DIAGRAM-COMMERCIAL-RESEARCH-REFERENCE-INDEX-B9J-20261011.md)：补充 B8/B9 实际机器证据、失败运行、业务数据/设备缺口；**不把当时“仅读旧研究索引”说成重新访问七个官网**。
4. [16 阶段历史手册](./DIAGRAM-B10J-RESEARCH-DECISIONS-HANDOFF-20261011.md)、[32 阶段历史手册](./DIAGRAM-B11P-32-STEP-HANDOFF-20261011.md)、[42 PR 归档目录](./DIAGRAM-B10-B11-CONSOLIDATION-20261011.md)、[54 PR 归档目录](./DIAGRAM-B9-DRAFT-CONSOLIDATION-20261011.md)：来源准确性/历史 PR/QA 的索引，而非 v1.0 的替代要求。
5. 本次新增[基线差距核对](./EOG-2D-DESIGNER-V1-MAIN-GAP-REVIEW-20261011.md)及[接续入口](./EOG-2D-DESIGNER-V1-RECOVERY-ENTRY-20261011.md)。

## 2. 旧窗口 S1–S7 外部官方网站：历史研究可复用

以下“历史已读”基于 2026-10-10 源档所记录的查阅活动。**本次 2026-10-11 未重新打开这些官网原文；本次已直接阅读 GitHub 中的来源索引和部分主线源码。** 页面可能变化，不把当前官网状态误称为已验证。没有把搜索摘要伪装成官网已读。

| 编号与原始网址 | 历史查阅、阅读等级 | 当时记录的来源事实（摘要） | EVO 的明确取舍、用途 |
| --- | --- | --- | --- |
| S1 [Miro — Mouse, trackpad or touchscreen](https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen) | 2026-10-09 初读；10-10 原文复核；本次读历史索引 | 选择/手形分工，鼠标右拖移动、触控板两指、触摸阅读和捏合 | **采用**左键选择框选、右/中键和 Space 导航、设备偏好；**不采用**手机长按作为唯一框选方式。对应 M01/M05/M07/T01/T06、Eidos Surface/Viewport。 |
| S2 [React Flow — Panning and Zooming](https://reactflow.dev/learn/concepts/the-viewport) | 10-09 初读；10-10 原文复核；本次读索引 | 官网区分默认 map-first 与 design-tool viewport 配置 | **采用**设计工具心智模型；**不采用**编辑时左拖空白必平移或引入 React Flow 运行时。Viewer 可采用阅读式导航。对应 M01–M09。 |
| S3 [draw.io — Style connectors](https://www.drawio.com/docs/manual/styles/connector-styles/) | 10-09 初读；10-10 原文复核；本次读索引 | 转角形状、纹理/色彩、箭头、路径标签分别有控制项 | **采用**路径 pathKind 与纹理 style、业务箭头语义分离；**不采用**通过外观伪造真实方向/状态。对应 V01/V03/E04/E07。 |
| S4 [draw.io — Waypoints](https://www.drawio.com/docs/manual/connectors/waypoints-connectors/) | 10-09 初读；10-10 原文复核；本次读索引 | 路径点添加/删除、精确位置、Clear Waypoints、Follow Terminals 可分离操作 | **采用**合法控制点、精细位置、重置自动路径、撤销；**不采用**将路径点写成业务节点。对应 E03/E05/E06/A02。 |
| S5 [draw.io — Work with connectors](https://www.drawio.com/docs/manual/connectors/) | 10-09 初读；10-10 原文复核；本次读索引 | 浮动连线端点与固定锚点存在不同语义 | **采用**自动端点或声明式固定锚点；**不采用**更改边的真实 source/target。对应 E05、投影契约。 |
| S6 [W3C — WCAG 2.2 SC 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | 10-09 初读；10-10 原文复核；本次读索引 | 拖动功能通常需提供单指针、非拖动替代（规范含具体适用条件） | **采用**按钮/数值/列表等替代路径；**不采用**“有触屏拖动就已无障碍”的结论。对应 A02/T06/E03。 |
| S7 [MDN — Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) | v1.0 列入 10-09；10-10 原文复核；本次读索引 | pointer capture、pointercancel、touch-action 与手势生命周期 | **采用**互斥手势、取消回滚、第二指中断、捕获释放；**不采用**把 cancel 当 up 提交。对应 M09/T04/T05。 |

历史研究的原网页插图/章节名称在[原始索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md) §1，重要原始示例及曾遇到的官网变动在[B9j 增量索引](./DIAGRAM-COMMERCIAL-RESEARCH-REFERENCE-INDEX-B9J-20261011.md) §2/§7。**未存档官网截图/视频、完整 HTML 或网页 PDF**；不臆造可供恢复的图像附件。

## 3. 已确认的用户要求与工程决定

- **范围**：只针对 2D Designer 整体商业化体验（Viewer 与它共享渲染），不是泛化重做 Eidos；不等待用户逐项列出所有 UI 缺陷。完整操作链是“打开→看懂→选择/框选→移动→改线→撤销→保存→刷新/Viewer 复现”。
- **默认视觉**：安静商务界面，圆角业务卡片、新投影推荐圆角正交路线，另供直线/直角/曲线；旧投影缺 `pathKind` 时保持旧直线外观，不能被动迁移。
- **输入**：左键选择/框选，右键拖动视角，原地右键上下文菜单，中键/Space 平移；触控板/手指使用不同手势但相同业务语义；移动端不只是桌面缩小版。
- **投影边界**：投影用于可见性裁剪，不改业务对象/边身份；Designer 可维护独立的展示坐标/路由/相机；无新业务定义版本。自动排版为固定功能，不是 Agent 动作；应尊重隐藏、锁定与已有视角。
- **安全与平台**：Eidos 是通用图形、几何、手势、体验的所有者；Platform 保持插件封装、权限、Store/CAS、投影与 Host；`evo-eog-2d` 是一个插件、包含 Viewer/Designer 两个 Features。保留 Platform vendor Surface 的 App Host 上下文导航差异；禁止盲目整目录覆盖。
- **变更治理**：2D 专项独立 branch/PR；主线、Agent、业务服务及全局权威状态文档不触碰；旧的“未合并/未部署”仅是当时快照，10-11 的收敛情况以当前 GitHub 元数据复核为准。

## 4. 采用/放弃方案和存在的冲突

| 方案比较 | 采用以及理由 | 放弃或限定以及理由 |
| --- | --- | --- |
| 设计工具式 vs 地图式画布 | Designer 采用 Select / Hand 分工，左拖框选、右键导航，符合业务编辑预期 | 左拖即平移主要适用于只读/地图阅读，不作为 Designer 默认 |
| 增量完善 Eidos vs 全面换引擎 | 延续 Eidos 公开契约及现有插件，易于业务保护、可回退、无额外收费锁定 | 不因参考 React Flow/draw.io 而整体引入 React 或另一编辑器；未来换库须重新评估授权、体积、迁移收益 |
| 自动避障 vs 无限全图计算 | 保留有界寻路，拥塞时真实提示并允许人工修正 | 不无限增大路由预算，也不能碰撞节点却报告已成功避障；密图仍存在拥塞 |
| 样式自由度 vs 业务语义安全 | 路径和显示属性单独保存，在 Viewer 中一致 | 禁止改 source/target、箭头真实方向、业务关系状态 |
| 编辑中自动存盘 vs 明确 Save + CAS | 保留本地草稿、显式授权 Save、stale token 防覆盖 | 不自动提交改业务数据；失败后不清空编辑，不拿测试授权冒充生产安全 |
| 移动图形 + 位置锁定 | 自动排版只动可见的未锁定对象；位置锁定应纳入共享展示契约 | 现行缺锁定契约是明确待修复偏移，不能以“自动排版按钮存在”判定完成 |
| 性能与验收 | 以真实企业案例、四类实际设备及 §14 原始 39 个场景签收 | 合成 Chrome、Linux WebKit 或 CI 成功均非正式商业验收 |

**来源冲突/限制**：S1/S2 的产品默认操作不同，EVO 明确选择 Designer design-tool；S6 的替代交互要求不能因 S1 的长按实现而忽略；密图安全路由预算与视觉美观存在权衡，需报告真实拥塞而不是掩盖；通用 Eidos 与 App vendor 差分需逐文件核对；触屏模拟不等于 iOS/Android 物理设备。

## 5. 先前研发证据保留与阅读等级

- **已读当前 main 原文件**：2026-10-11 读取 `eidos/src/diagram/surface.ts`、`eidos/src/diagram/layered-layout.ts`、`EVO-App-Platform/apps/eog-2d-designer/definition-projection-editor.ts`、原 v1.0 和有关交接文档；这证明代码/文档存在及局部语义，不构成运行验证。
- **已核当前 PR 元数据**：eidos [#160](https://github.com/jiangxng/eidos/pull/160)；Platform [#693](https://github.com/jiangxng/EVO-App-Platform/pull/693)、[#695](https://github.com/jiangxng/EVO-App-Platform/pull/695)、[#699](https://github.com/jiangxng/EVO-App-Platform/pull/699)、[#705](https://github.com/jiangxng/EVO-App-Platform/pull/705)、[#706](https://github.com/jiangxng/EVO-App-Platform/pull/706)：均已合并；原研究 [#552](https://github.com/jiangxng/EVO-App-Platform/pull/552)、[#623](https://github.com/jiangxng/EVO-App-Platform/pull/623)、原 Draft [#689](https://github.com/jiangxng/EVO-App-Platform/pull/689) 为 closed/unmerged，但内容已按归档台账保存。**PR 标题/正文不是本次对每项 CI 的重新运行或核验**。
- **历史机器实证，当前未重跑**：[B9j 原生 Chrome Save→CAS→Designer/Viewer](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069498639)、[B8v/w 路由拥塞](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38060230522)、[B8u 首轮失败](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38058967083)、[B9i 依赖缺失](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069020504)、[B9j fixture 选中路由失败](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069271828)。后两类作为测试失败及修复过程保留；准确约束见 B9j 索引 §6–§7。
- **正式验收**：[39 项主矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md) 与[实机执行规程](./DIAGRAM-B9R-39-ITEM-DEVICE-ACCEPTANCE-PROTOCOL-20261011.md)继续保持 **0/39 签收**，不从历史机器测试提升 PASS。
- **缺失**：当前文件库只找到完整 v1.0 Markdown 的两份副本，未找到独立旧聊天全文导出。旧聊天中未落入这些存档的逐句表述、随意提过但未记录的网址无法无损恢复；不补造。官网原始截图、客户授权真实 S2C/P2P、硬件/无障碍实测及生产持久化授权证据均不在现有签收证据中。

## 6. 未来研究仅定向补缺

优先依据 [v1.0 §13–§14](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) 完成产品收口；只有在现有研究无法裁决真实交互冲突时，才重访 S1–S7 具体章节并单独记录新查阅日期。密图高拥塞的具体几何证据、macOS/iOS/Android 实机行为、W3C 非拖动替代和大字可访问性是剩余的目标性研究，不再重复“从零找行业优秀工具”。
