# P01a — App Platform 大图性能及 Eidos 空间索引集成（2026-10-10）

**来源：** 原商用研究交接 [PR #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) §14 P01、B6a #566、B6b #568；Eidos 配对新切片 [#141](https://github.com/jiangxng/eidos/pull/141)。沿用已确认研究，不把引用网址当作新查阅事实。

## 验证链路与实施

- [本分支 Draft #573](https://github.com/jiangxng/EVO-App-Platform/pull/573)，仅在 `vendor/eidos/src/diagram/{obstacle-spatial-index.ts,edge-paths.ts,surface.ts,index.ts}` 差分移植 Eidos P01a；保留 App Host `renderContextNavigationV010`、Agent 工具、B7b 投影写入令牌/CAS，无业务数据改动。
- `tests/integration/diagram-obstacle-spatial-index.test.mjs` 纳入 Diagram Designer Integration CI 的 path 与 **真正执行命令**，源顺序/路由 SVG parity 维持。
- 新工作流 `Diagram Performance Evidence CI` 在 Ubuntu GitHub runner 实际打开 Chrome 154，将全量 Eidos SVG/DOM 挂载 200 节点/400 边及 500 节点/1000 边；给出 mount、选择重新 render、native pointer input dispatch、SVG count、JS heap 等 JSON 及工件。
- **解释警示：** 单次冷 Chrome 的 200/400 常比后运行的 500/1000 慢，这由 JIT / 模块预热与共享 runner 噪声混杂，不可直接比较不同大小的首屏数值；后续采用 **同台 CI runner 精确 checkout B6b PR 基线与 P01a HEAD，分别两个预热、三个重复/规模中位数**，对比只视为工程方向参考，不视为跨设备 FPS/SLA。
- 预优化首次测试 [run 38013986397](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38013986397) Chrome/154 的单次 200/400: mount 622.3 ms，selection 22.2 ms；500/1000: mount 106.1 ms，selection 50.1 ms。不同脚本实例首次优化采样 selection 55.5/88 ms，**因此没有宣布性能提升**，先用配对测量验证。
- 需要继续为 P01 项采集企业真实业务图 500/1000 的场景、帧间隔分布和真实 Win/macOS/iOS/Android 硬件测量。完整 §14 39 项保持 NOT TESTED，不因为合成 Chrome CI 成功就改变。

## 范围保护

不做虚拟化以牺牲交互命中；保持所有可见业务节点、边、路径点、参考线与点击目标完整 DOM，改的是 O(E×N) 数据检索和重复障碍分配，不更改拓扑、保存、视图版本或权限。Eidos 端位于 #141；本分支保留原商业化交接约束和 B6b 测试。
