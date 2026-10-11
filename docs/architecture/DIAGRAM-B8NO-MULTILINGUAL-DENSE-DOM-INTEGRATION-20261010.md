# EVO 2D Designer B8n + B8o 双增量交接（2026-10-10）

## 范围与继承

继承两仓库 B8l+B8m [Eidos Draft #152](https://github.com/jiangxng/eidos/pull/152)、[EVO Draft #599](https://github.com/jiangxng/EVO-App-Platform/pull/599) 经最新 CI 全绿的基线。本轮独立堆叠为 [Eidos Draft #153](https://github.com/jiangxng/eidos/pull/153)、[EVO Draft #600](https://github.com/jiangxng/EVO-App-Platform/pull/600)。按用户确认的开发节奏，每轮两个独立增量、完整回归和文档交接；不合并 main、不部署生产，不修改业务关系 source/target、Host 授权、Agent 行为、账本版本/业务历史、投影 CAS、手工 route waypoints 和 44px 命中目标。本轮使用已继承的项目研究和 GitHub 仓库代码，没有新增外部网页研读，不得虚构参考资料已读状态。

## B8n：跨语言、过长与显式多行的 SVG 标签

**现状和问题：** B8l 解决了单行真实字体宽度测量，却未将显式换行、长文本折行与实际碰撞面积统一。旧 SVG 标签直接写 `textContent`，浏览器在 SVG 内不能自动进行用户所期待的多行换行；仅按单行测量会与真实文字绘制不一致。

**采用：** 在 `label-reservation.ts` 增加 `diagramCaptionLayoutV010(anchor, caption, measure?, maxWidth=260, maxLines=4)`。先对 CRLF/CR 统一，再按原有换行分段；浏览器支持时使用 `Intl.Segmenter("und",{granularity:"grapheme"})`，避免将组合表情字素拆裂；无 Segmenter 的旧环境退回 `Array.from`（仅保证 UTF-16 surrogate pair 不被截断，不能保证复杂 ZWJ 整体）。每段以 B8l 同款 Canvas2D 11px 字体测量宽度，按 260 world-unit 最长一行拆分；最多四行（可通过函数参数独立验证），超出则末行追加 `…`；完整原文保存在 SVG `title` 和 `aria-label`，而非丢弃数据。SVG 真实绘制为 `<text><tspan ...>`，行距固定 14 world-units；保留单行历史的文本表现不变，不引入独立持久化文本布局契约。

**架构保证：** **自环碰撞索引与实际显示使用完全相同** `diagramCaptionLayoutV010` 结果。由最多四行的最大文字宽度、文字基线、行距和原有描边边距得到联合矩形，代替单行盒；标签的展开状态不依赖选中、悬停、放大缩小的临时 DOM。不会改写已保存的手工自环路径。变更涉及 Eidos Surface 和 App vendored mirror，readonly Viewer 沿用共享渲染面。

**权衡和局限：** 当前英文纯字符按字素逐个换行，尚没有专业英文词界排版和段落双向（RTL）算法；当前 SVG `title` 保留全文但未提供独立弹窗阅读/复制长标题；字体度量仍是 Canvas2D 近似而非真实字体轮廓的解析交叉检测。复杂 ZWJ 字素只有支持 Intl.Segmenter 的环境保证完整。超长内容仍需可访问完整原始关系数据。

**专项验证：** 中文、日文、复合表情、CRLF/换行和 250 字符无空格长文本；单行像素语义兼容；最多四行＋省略号、索引联合矩形、重复运行确定性和错误参数拒绝。真实 Chrome 多两页：Designer 绘制四行 `tspan`、省略号、完整标题和 aria；readonly Viewer 读回相同四行、自环 SVG，且无 Save/编辑权限。原 B8l 测试长标题位置随换行后宽度调整，以验证**实际换行矩形**而非旧单行宽度错误前提。

## B8o：完整 DOM 的大图性能与诚实降级验证

**现状和问题：** 上轮 13,000 条索引单测只证明空间索引正确性，不代表浏览器完整 DOM 承载能力；12,001 条以上在 B8m 内明确退回 `node-only`，但缺少真实页面显示和原生输入证据。

**采用：** 在既有 `tools/diagram-performance-browser-proof.mjs` 增加 opt-in `EVO_DENSE_B8O=1`，**默认 P01 性能比较不变**。另设独立 `.github/workflows/diagram-dense-full-dom.yml`，真实 Chromium/CDP 渲染全部节点按钮与可点击 SVG 线条、测量标题、触发节点选择和原生鼠标拖动。测试 3 档合成图：300 节点 / 1,200 边，600 / 2,400，以及 200 / 12,001（最后一档以显式 straight 为主，避免把昂贵正交全图寻路误当成降级模式的压力来源）。第三档必须从真实 DOM 核验 `data-eidos-diagram-ink-quality="node-only"` 与对应 advisory；前两档必须为 `full` 且无警示；`labelMetrics=browser`、DOM SVG 元素数量、实际选中和鼠标拖动都需要通过。

**验收证据：** 独立 [B8o real Chrome full DOM CI #38037486856](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38037486856) **SUCCESS**，Chrome/154.0.8037.97。同一 runner，预热 3 档后各取一组完整挂载/选择/原生输入样本（**不是**统计 FPS 的充分样本）。当时读到：

| Nodes/Edges | 挂载 ms | 选择 ms | drag CDP p95 ms | SVG 元素 | JS 堆 MB | 质量 |
|---|---:|---:|---:|---:|---:|---|
| 300/1200 | 175.0 | 77.7 | 20.32 | 2412 | 5.64 | full |
| 600/2400 | 251.5 | 141.2 | 22.03 | 4820 | 16.02 | full |
| 200/12001 | 356.3 | 260.1 | 29.04 | 24065 | 25.82 | node-only（真实 DOM 提示存在） |

**限制：** 三档是合成数据，不是企业 12,001 条真实关系的生产视觉交互 SLA；内存值为 Chrome 实测 JS heap，不是浏览器全部 RSS，CDP 事件耗时包含协议开销，并非 GPU 真实帧率。特别是 12,001 档大多数连接线使用 straight，不能推断 12,001 条全部复杂正交/曲线场景同等性能。此次已做一次预热、一组实测，之后还需持续多次测量、真实企业内容、性能基线波动区间及 Chrome 外设备证据。**仅验证大图可降级且仍能运行，不宣称复杂路径都能无交叉。**

## 真实浏览器兼容回归与开放项

[Chrome 154 32-tab Browser CI #38037526845](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38037526845) **PASS**，证明 `b8noMultilingualTspanDenseFullDom=true`，新增 B8n Designer/Viewer 2 页，以及 B8l/B8m、B8jk、B8i、B8h、B8g、B8f、B8e、B8d、B8c、B8b、Host CAS 冲突/503 重试/业务历史不变旧回归均 true。另有跨 12,001 边的独立 B8o Chrome 实测。对最终提交仍须重新核验所有 CI 与上游 PR head，不能将先前成功运行误认成最终 head 证据。

未完成：实体 iOS/Android/macOS/Windows 交互和触控板、真实字体及 RTL/多段落国际化实测、真实 12k 企业全复杂路由的帧率和长期内存、数据库持久服务重启、多用户业务流程、§14 **全部 39 项正式商业化验收仍 NOT TESTED**。继续记录后续 B8p 多语 RTL/专业折行与 B8q 实际企业图压力/性能容忍度研究，不直接合并/部署。
