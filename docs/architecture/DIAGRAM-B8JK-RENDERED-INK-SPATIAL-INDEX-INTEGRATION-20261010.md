# B8j + B8k — 路由实际曲线占用与大图墨迹空间索引（2026-10-10）

## 两个增量一次完成的实施边界

- 上游 **B8i** [Eidos Draft #150](https://github.com/jiangxng/eidos/pull/150) 和 [App Draft #597](https://github.com/jiangxng/EVO-App-Platform/pull/597) 的 CI/26-tab Chrome 已 PASS；本增量集中在 [Eidos Draft #151](https://github.com/jiangxng/eidos/pull/151) 与 [App Draft #598](https://github.com/jiangxng/EVO-App-Platform/pull/598)，独立堆叠 B8i，避免合并、生产发布和主线修改。
- 项目研究及源材料沿用 [EVO Designer 接收研究/决策 #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 与 B8i 商业化接收证据矩阵。本轮为已读仓库代码和已执行 CI 的实施决策，没有重新查阅外部文章，不把继承链接当作新阅读原文。
- 数据层完全不变：同一个 self edge 的业务 source/target、业务状态、Agent 授权和实际 Host CAS 不变。自环仍是 visibility/presentation layer，不产生业务定义版本；绝不减小 44px hit area。手工路线固定优先于任何自动避让。

## B8j：相较 B8i 解决什么

**B8i 症状**：对其它关系线，拿节点中心的直线和手工 waypoint 折线作“墨迹”，可能在弧线/圆角真实绘制进入候选区域时漏判，也可能将不存在的弦误判为冲突。

**采用方案**：新 `vendor/eidos/src/diagram/ink-spatial-index.ts` 的 `diagramSvgInkSegmentsV010` 读取 Eidos **真实渲染**路径的世界坐标 SVG 命令（绝对 M/L/Q/C）。L 精确保留线段；Q 和 C 利用 De Casteljau 二分递归，控制点到弦不超过 **1.5 世界单位**就归并，最大深度 8（单曲线 256 段）。图标、箭头和文字不是这些段的一部分。按这组段与 self-loop 28%～72% 端点定义的外侧控制走廊做 Liang–Barsky 线段/矩形相交判定；保留各边旧 B8i 的节点占用/侧槽/稳定标签评分。标签位置改以真实 `geometry.label` 为中心，而非源/目标中心点的近似中点。

**与真实 Viewer 对齐**：Canvas 在渲染级缓存其它可见关系的 `diagramEdgeGeometryV010` 或 `diagramManualEdgeGeometryV010` 结果；在绘制实际 non-self 边时直接复用该相同对象，不只让自环看到一套与 Viewer 不一致的草拟路径。

**限制**：这是有界 *曲线折线近似*，不是 Bézier 与走廊的数学解析求交；最大深度或预算触发时仍有误差。暂不计算“自环实际中心路径”与另一曲线中心路径的精确二维交点，目前仍为自环外侧控制走廊评估，不保证全局最短或无交叉路线。

## B8k：相较 B8i 解决什么

**B8i 症状**：每个自环所属节点反复扫描全部其它关系计算近似线段和标签（O(self-loop owners × relations)），超过 1500 关系或 48 个自环归属节点只能关闭连线/文字避让。

**采用方案**：一次 render，至多 12,000 条当前可见关系生成一份非 self-edge 的真实绘制几何和 InkEntry。新 `createDiagramInkSpatialIndexV010` 用 256 世界单位的网格索引空间包围盒。查找自环周边时只获取相交条目，并按原图顺序恢复；省略源或目标就是本节点的关联边；超过 64 个 bucket 的巨大关系放独立 overflow 列表，防止跨越千格的长线被遗漏；对跨越 4,096 搜索 bucket 的巨大查询完整回退。

**预算/退化规则**：单 render 最多保证使用 100,000 个细分线段；超限后相应关系保守回退为端点直线（不是精确碰撞保证）；超过 12,000 关系时保留 B8h 节点/多自环避让，但不进行 B8j 几何墨迹扫描。明确不把性能预算说成已成功避障。索引只在本轮 render 临时建立，不跨版本存储，避免屏幕、历史和 Host 状态不一致。

## 验证记录与待完成项

- 单测：对 **曲线弦未碰但实际 C 曲线穿越 self-loop 外侧走廊**的差异判断；圆角 Q/C 的递归几何连续性和世界坐标；极端输入防护；6000 条远处关系索引过滤、巨大跨度线段不会丢、当前关系不会被当作非关联关系；源代码契约核验“同一条渲染几何同时用于墨迹评分和实际画布绘制”。原 B8i/B8h/B8g/B8f 控制柄/取消/手动方向回归必须继续 PASS。
- App 实测 Browser CI 保留原 Chrome 26-tab 后扩为 **28 tabs**：在两个新标签页上通过真实 App read/Designer/Viewer 验证隔离注入的曲线关系与自动自环方向及路径 SVG 一致性。用户和真实生产数据没有被创建或修改。**最终是否 PASS 以最新 PR head 的 CI 为准**。
- 该索引仅与 6000 条合成远处边做了过滤正确性测试，不等于在真实 12k 企业关系现场测得可靠帧率。真实 Apple/Android/Windows/macOS、实际浏览器字体复杂度、多设备触摸/触控板、多路径精确相交、数据库服务重启、在线生产实施、§14 **39 项商业化验收仍 NOT TESTED**。
