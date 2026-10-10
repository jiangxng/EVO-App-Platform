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

## 同 runner 正式配对验证结果（P01a 的实际证据，不是 SLA）

[Diagram Performance Evidence CI 38014451416](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014451416) **PASS**。工作流在同一 GitHub Ubuntu runner 对 stacked B6b base 与 P01a HEAD 进行两个独立 `npm ci && npm run build`，分别启动 Chrome/154.0.8037.97。每个版本先做两次不同规模预热，再将两种规模交错各运行 3 次，报告中位数，消除单次冷启动量度的主要干扰。

| 场景 | B6b Base | P01a | 变化 |
|---|---:|---:|---:|
| 200 nodes / 400 edges：mount | 108.0 ms | 105.8 ms | -2.04% |
| 200/400：selection render | 35.9 ms | 41.2 ms | +14.76%（回退） |
| 200/400：CDP drag dispatch p95 | 22.79 ms | 18.78 ms | -17.60% |
| 500 nodes / 1000 edges：mount | 173.2 ms | 140.3 ms | -19.00% |
| 500/1000：selection render | 81.0 ms | 68.3 ms | -15.68% |
| 500/1000：CDP drag dispatch p95 | 21.41 ms | 18.77 ms | -12.33% |

**解释与继续改进：** 500/1000 的两项主要耗时得到本次中位数级改善，但 200/400 selection render 的 +14.76% 退化不能隐去。负百分比在这次测量表示耗时降低，**不是稳定 FPS 提升**；CDP input dispatch 包含浏览器协议/runner 调度，不能替代逐帧绘制时长。需要多次独立 CI 重测 200/400，排查索引构建成本，再决定是否延迟索引创建或为小图保留简单路径。也不能从 synthetic 图推断真实企业图拥堵/label/多自环性能。

**代码正确性证据：** Eidos #141 的全套 CI 和 App `diagram-obstacle-spatial-index.test.mjs` 比较正交两样式原始全量障碍和空间筛选输出，保证 SVG `d`、label、congested 完全相同；无持久化变更。完整 P01（物理设备及应用连续操作）仍未验收。

## 实测反馈后的 P01a 规模自适应修订

此前两轮同 runner 配对基准中，200/400 的 `selection render` 分别退化 +14.76% 和 +4.94%，所以**没有把原始索引设计直接宣称为所有规模的性能优化**。Eidos #141 / App #573 随后实施条件：`visibleNodes × visibleEdges >= 150,000` 时用 256-unit 空间桶；低于该阈值沿用旧的全量障碍扫描，始终复用一次 render 的 source/target Map。阈值只按图形规模计算，不记录到业务图、模板或投影定义，也不破坏实际 view 保存契约。

[新同 runner Chrome CI 38014785156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014785156) **PASS**。旧版 B6b 对比新的混合策略：200/400 selection **19.3→16.8ms (-12.95%)**，500/1000 selection **48.6→40.6ms (-16.46%)**；首屏 mount 200/400 **75.1→76.4ms (+1.73%)**、500/1000 **97.7→96.6ms (-1.13%)**。此前原始索引版本的结果继续留存以便分析；**这次的改善也只是一次 CI 运行器内的对比**，下一步应继续重复并核验真实企业数据规模、p95 长任务和真实设备交互帧率。

各用例图形 DOM node/edge 数量仍完整 200/400 和 500/1000，SVG 节点数在这两个规模下分别 804 和 2004，测试不依赖删减可交互连线。P01 全面验收仍 NOT TESTED。

## 第三次独立 runner 重测确认（2026-10-10）

最新完整 [Diagram Performance Evidence CI 38014903344](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014903344) **PASS**，仍按 base/HEAD 同台构建、Chrome 154、双规模预热、三次中位数流程。200/400 mount **69.1→62.2ms (-9.99%)**、selection **18.5→16.9ms (-8.65%)**；500/1000 mount **97.1→85.3ms (-12.15%)**、selection **44.8→38.5ms (-14.06%)**。CDP drag dispatch p95 在 500/1000 这次略退化 **+7.37%**，不能夸大为拖动帧率提高。

结合前一次 [38014785156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014785156)，自适应策略在两个独立 CI run 中均改善 200/400 和 500/1000 的 selection 中位数；runner 间绝对耗时仍明显波动。最新 App Platform、Browser Conflict、Diagram Integration、Continuity 和 Perf CI 都通过。**P01 正式实体设备与长时间性能验收仍 NOT TESTED。**
