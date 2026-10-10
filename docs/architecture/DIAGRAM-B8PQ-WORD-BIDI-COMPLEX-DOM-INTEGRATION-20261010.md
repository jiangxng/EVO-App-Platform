# B8p + B8q｜2D Designer 专业词界、RTL 与混合业务图浏览器性能研究交接
日期：2026-10-10

## 位置与继承

Eidos [Draft #154](https://github.com/jiangxng/eidos/pull/154) 堆叠已完成 Eidos [B8n+B8o Draft #153](https://github.com/jiangxng/eidos/pull/153)；EVO-App-Platform [Draft #601](https://github.com/jiangxng/EVO-App-Platform/pull/601) 堆叠 App [B8n+B8o Draft #600](https://github.com/jiangxng/EVO-App-Platform/pull/600)。这是独立于 TR-01 主线的 2D Designer B 类升级。研究材料继承此前 B8b～B8o 交接及验收矩阵；本轮读取的是当前 GitHub 源码、工作流和测试结果，**没有新读外部网页原文，不应倒填参考资料**。

原则：展示与可读性升级，不改变任何业务关系 source/target、账本定义版本、保存 CAS、Agent/Host 授权或 projection 的手工 waypoint；不减小原 44px 手柄；不合并 main、不部署。

## B8p｜词界 + 双向文字排版

**原问题：** B8n 虽支持真实 SVG 多行、多语言字素和省略号，但普通英文长标题会在可自然换行的单词中间逐字截断；阿拉伯文/希伯来文通过 SVG `textContent` 交给渲染器时，没有明确段落方向，不足以保证混合数字、英语和 RTL 的一致显示。

**采用：**

- `diagramCaptionDirectionV010(caption)` 按 Unicode Script 的第一个强文字方向确定 `rtl`/ `ltr`。阿拉伯语或希伯来语开始的段落为 RTL；英文字母/汉字开始的段落为 LTR；纯数字/标点默认 LTR。**绝不将存储文字倒序或调换业务关系端点**。
- `diagramCaptionLayoutV010` 优先使用 `Intl.Segmenter("und",{granularity:"word"})` 分词，保留空格与原文逻辑顺序，遇到允许宽度之外的完整单词优先移到下一行；仅单词本身过长才退为 B8n 的字素级拆分。缺少 Intl.Segmenter 的环境退回 Unicode 字符串空白分词，再用 codepoint 安全拆分。
- SVG 每条 caption 设置 `direction`、`unicode-bidi="plaintext"`、诊断用 `data-eidos-diagram-caption-direction`，由真实浏览器 Unicode Bidi 布局计算视觉排列，仍保留 `text-anchor=middle`、全文 SVG `title`/aria、B8n 最多 4 行 / 260 世界单位宽 / 最后省略号。
- 关键架构不变：**Designer 和 readonly Viewer 使用同一布局函数产生的相同碰撞矩形与 SVG 行内容**；布局不依赖选中、鼠标悬停或临时 DOM 显隐。

**测试覆盖：** 专项 Node 测试英文 `Sales order payment reconciliation` 必须优先词界换行；阿拉伯文、希伯来文、数字混排，汉语优先强方向，超长 RTL 无空格词、显式换行、旧 B8n/单行兼容。App 真实 Chrome 再增两页（从 32 → 34）：RTL Designer SVG 属性、getComputedStyle 显示 `direction:rtl`、实际 `tspan` 行/宽度、SVG title，及 readonly Viewer 同内容、同自环路由、无 Save、无 CAS 更新。

**边界：** `first strong` 以整条 caption 为段落定方向，多段混合不同方向将由浏览器 `unicode-bidi` 处理；不是专业阿语字形/字距、RTL 标点全矩阵验收；自动 `word` 断词会依浏览器 Unicode/ICU 实现略有差异，需要跨浏览器/实体设备再验收。无 Segmenter 时不能保证所有 ZWJ 组合表情不拆分。动态字体度量仍是 Canvas2D 和当前 font-family 的几何近似，不是字体路径解析。

## B8q｜真正完整 DOM、模拟企业流程多类路径的压力基准

**为什么还要做：** B8o 证明合成 12,001 直线路由和 `node-only` 告警能在真实 Chrome DOM 工作，但对企业常见的混合圆角、正交、贝塞尔、手工路径、多自环、跨部门远边与标题的成本代表性不足。

**实现：** 在既有 `tools/diagram-performance-browser-proof.mjs` 增加显式 `EVO_COMPLEX_B8Q=1`，与原 P01 和 B8o mode **互斥**，默认历史性能基准不变。选定独立尺寸 **160 节点 / 480 关系**和 **320 / 960**，每档独立预热后双次实测；图形保留可重跑的 sales-to-cash（销售到收款）及 procure-to-pay（采购到付款）语义标签，并包括长跨节点、直线/圆角 Q/曲线 C/正交、显式手工 waypoints、自环、英文/CJK/阿拉伯文/希伯来文标签。由完整 SVG `path` 实际确认 Q/C 均存在，`full` 质量显示且无降级告警；通过 Chrome DevTools Protocol 发送真实鼠标按下/多次移动/释放，记录 mount、选择、CDP drag p50/p95、SVG 元素数和 JS heap，**不是伪造的纯算法计时**。独立 `.github/workflows/diagram-complex-business-dom.yml` 运行，并保留日志 artifact。

**取舍：** 用确定的、可重播的**模拟企业流程图**，而不把用户的客户、供应商或真实账本导入 CI。路线复杂性更接近企业工作流，却仍**不是用户真实生产图**；CI 系统环境波动和有限样本不等于实体设备帧率 SLA。B8o 的 200/12,001 直线多占位降级证据作为独立规模上限验证，不把复杂路径场景的 960 条关系表现外推至 12k 条全曲线。

## 源数据 / 判断区分与未决项

- 已核实的仓库事实：B8n 按字素换行并上限 4 行，B8o 已有独立 12,001 关系完整 DOM `node-only` 工作流；B8l 已用浏览器 font metrics；B8j 已用实际渲染 Q/C 折线近似。这些是已读取代码与先前 CI 记录。
- 本轮工程判断：引入专门的词界分段与属性级 bidi、增设混合类型 DOM 场景而不动全局路由算法或真实业务数据，比直接做大型文本布局引擎、另建权限系统、改动主线风险小。
- 排除方案：按字节/UTF-16 截断 UTF-8/组合字符，违反语义；手工倒序 Arabic/Hebrew 文字，破坏逻辑顺序和无障碍语义；将 B8o 直线多关系测试冒充企业真实复杂路由，违反证据可信度。
- 未解决：专业 RTL per-paragraph 混排标点、多语言字体实际 fallback、超长标注操作与全量复制、精确字形边界、真实投影场景 Q/C/orthogonal 12k 连线的全 DOM 性能、Windows/macOS 触控板和实体 iOS/Android 操控、保存数据库重启。
- **§14 39 项正式商业验收仍全部 NOT TESTED**，包括实际业务数据流程与多设备。所有相关 PR 均 Draft，未合并、未部署；不要将某个 CI PASS 等价于完整商业化验收。

## CI 与续接

本轮最新 Eidos/App 提交及所有当前 head workflow run ID、Chrome 34-tab 和 B8q Q/C 证据应在 CI 最终确定后追加到 Draft PR body 和商业验收矩阵；以后继续从本文件、前序 B8n/B8o 文档和 Draft #154/#601 入口工作，不将网络参考索引当成已读原文。


## B8q CI 诊断纠偏：测试图引用了不存在的节点（2026-10-10）

- 两次初始 B8q Chrome 任务未达到 Ready，最初推断为复杂自动正交路由开销过大；**重新阅读 `validateDiagramEditorStateV010` 和压测生成器后确认，这个推断不成立，必须撤回**。
- B8q 采用 160/320 节点、每行 25 列；最后一行不满 25 个节点。旧 `dst=src+1` 逻辑在 `src=159`/ `319` 时错误产生 `n160`/`n320`，违反 Eidos 图状态验证的“每个关系端点必须存在”，因此 `stateFromResult` 不能成功接收图数据，Ready 永远不会出现。
- [初次失败 CI #38049057236](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38049057236) 与第二次失败属于**测试样例非法**，**不是自动寻路性能超限的有效证据**。既不能标记自动寻路通过，也不能声称已证实其失败。
- 已修正不足整行的目标节点环绕计算，并在启动 Chrome 前直接调用生产同款 `validateDiagramEditorStateV010` 对模拟数据进行校验，防止状态验证问题再次被误当作性能超时。
- 只有预校验通过并实际得到 DOM、Q/C 和路径操作的 Chrome 日志后，才能形成混合路径性能结论。需要进一步评估自动寻路规模时，应在独立的合法图样例上运行，保留 CI runner/浏览器/尺寸和重复样本。


## 成功实测结果｜合法混合路径图（Chrome/154.0.8037.97）

修正目标端点并在启动浏览器前进行 `validateDiagramEditorStateV010` 后，独立真实 Chrome [Complex Business DOM CI #38049616368](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38049616368) **PASS**；包含 **Q 圆角、C 贝塞尔、显式手工路线、自动曲线、自环、RTL/CJK 标签、原生鼠标选择/拖动**。图均使用可复现模拟业务对象，并不是用户真实企业账本。

| 合成规模 | 正式样本 | 挂载（统计取高位中间样本） | 选择 | CDP 拖动 p95 | 实际 SVG 元素 | JS 堆 |
|---|---:|---:|---:|---:|---:|---:|
| 160 节点 / 480 边 | 2 | 174.3 ms | 62.9 ms | 20.47 ms | 970 | 7.89 MB |
| 320 节点 / 960 边 | 2 | 216.0 ms | 108.8 ms | 21.46 ms | 1,936 | 10.35 MB |

两档真实 DOM 的 `inkQuality=full`、`labelMetrics=browser`、`advisory=null`，真实 SVG 路径断言确认同时出现 Q 和 C，不只是 JSON 里标记路径类型。脚本保留 P01a/B8o 默认基准口径不变。以上是 **2 个样本/档的 CI-host 数值**（聚合用排序后的中间高位值），CDP 输入派发耗时包含 DevTools 协议开销，并非 GPU 帧率、企业数据或设备性能 SLA。

**纠错闭环：** [失败 CI #38049057236](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38049057236) 的 `P01 fixture never mounted` 来自目标关系引用了未定义的 `n160/n320`，不是自动正交算法计时失败；已补实际 Eidos 状态校验并记录修复。真正大规模全自动复杂路径最坏情况尚未单独测量，不能根据本轮成功推论。
