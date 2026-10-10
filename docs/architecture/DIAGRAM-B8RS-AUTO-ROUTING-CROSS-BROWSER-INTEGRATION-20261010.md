# EVO 2D Designer B8r+B8s 双增量：自动正交路由与真实跨浏览器文字（2026-10-10）

## 交接入口与独立边界

本轮在 Eidos [B8p+B8q Draft #154](https://github.com/jiangxng/eidos/pull/154)、App [B8p+B8q Draft #601](https://github.com/jiangxng/EVO-App-Platform/pull/601) 已通过 CI 的 head 之上分别建立 [Eidos B8r+B8s Draft #155](https://github.com/jiangxng/eidos/pull/155) 和 [EVO App Draft #602](https://github.com/jiangxng/EVO-App-Platform/pull/602)。两个 PR 只涉及 2D Designer 商业化升级 B 类专项，不更改 TR-01 主线、全局 authority 文件、Agent/Host 授权、业务拓扑 source/target、投影 CAS、账本定义版本或用户手工编辑的投影路由。**不合并、不部署。**

本轮研究以已继承的项目内部资料、GitHub 当前源文件 `src/diagram/obstacle-routing.ts` / `surface.ts` / 以前的 Chrome CI 证据为依据。未把以前参考链接列表冒充本轮新读的外部原文，也未声称有新的专家来源。

## B8r：真实自动正交寻路（非手工路径）性能、正确性与降本

### 已核实的实现问题

此前 B8q 修复了模拟测试图尾行非法关系引用 `n160`/`n320`，因此最初“90 秒自动寻路瓶颈”的判断已被正式撤回。本轮只采用 **先经 Eidos `validateDiagramEditorStateV010` 校验合法输入，再运行真实 Chrome** 的证据链。

现有 `routeDiagramOrthogonalV010` 的图搜索是有界 Dijkstra：最多 22 相关障碍、最多 2,600 网格点，直通条件先走快速路径；一旦需要网格路径，其队列按已经走过的距离和转弯罚分遍历，在每个网格点多个方向状态反复做同一障碍包含判断。上限已存在，但重复计算在复杂真实自动路由时仍有可优化空间。**保留原有上限和失败返回 `undefined`，不静默制造碰撞路线。**

### 采用决策

1. 使用到目标的 Manhattan 距离作为 A* 的**可采纳下界**，优先扩展接近终点的候选；所有边为非负长度，转弯罚分也非负，故启发值不会超过后续实际代价。队列依然保留按 key 固定的平局处理，几何输出保持确定性；不变更用户已编辑的手工 waypoints 或源目标关系。
2. 对最多 2,600 个候选网格点预先计算 `Uint8Array` 障碍占用一次，避免同一个单元在不同方向的多次 `rects.some`。相邻段与障碍的真实 `clear()` 碰撞判断依然执行，**不能仅凭端点无障碍判断整个线段安全**。
3. 新增专项 Node 回归覆盖：有障碍的确定性绕行、14 world-unit margin 内的安全性、无障碍直通与 rounded Q，200 条合法生成关系的起终点/碰撞不变性。Eidos 原有单元测试和 App integration CI 一并运行。
4. App 新增独立 `EVO_AUTO_B8R=1` Chrome 工作流 `.github/workflows/diagram-auto-router-full-dom.yml`，100 节点/300 关系及 200/600 两档使用**全部自动** orthogonal/rounded-orthogonal，无任何手工 waypoint 捷径。启动浏览器前做 production Eidos 状态校验；真实完整 DOM、真实 SVG 线条、原生 CDP 选择和拖动得到 mount/selection/heap/dispatch 数据。B8o 12,001 straight-heavy 与 B8q 960 mixed-manual 原历史口径保持原样。

### 仍需如实限制

有界 A* 路由器仍可能受 22 obstacle / 2,600-point 预算约束，无法找到安全通道时仍返回 `undefined` 并由现有画布标出 congested；不保证所有合法图都有无碰撞正交路线。示例合成规模只覆盖 300/600 自动关系，不代表 12,001 条全自动关系的生产可用性。CI 系统性能和 CDP 派发开销也不代表物理设备真 FPS。

## B8s：真实 Firefox/WebKit 的多语言 RTL 排版边界

### 确认需求与方案取舍

在 B8p 已有真实 Chrome 34 标签 RTL 审核的基础上，不能将 Chromium 认为是跨浏览器证据。B8s 建立一个**独立实际浏览器引擎**工作流 `.github/workflows/diagram-rtl-cross-browser.yml`，安装固定版本 Playwright 及 Firefox、WebKit 的浏览器二进制，用真实页面挂载同一 Eidos 2D Surface。不是截图推测或以 Chrome User-Agent 模拟 Safari。

在 4 组受控合成标题中测试：阿拉伯文 RTL/数字、希伯来文 RTL/英文、英文完整单词优先换行、中文日文组合表情。每次从实际 SVG DOM 读取 `direction`、`getComputedStyle.direction`、`unicode-bidi`、多行 `tspan`、`getBBox` 的字形宽高、SVG `title`/完整原文、曲线路径是否存在，收集两个引擎各自的实测证据。测试依赖 Eidos 本身的 `diagramCaptionLayoutV010` 和同样的 Viewer 用渲染入口。

**不强制两个引擎得到完全相同的字形宽高或换行位置**：操作系统字体集、Unicode/ICU、Canvas2D 与 SVG shaping 的差异是现实约束。必须保留的商用契约是 RTL 方向正确、可见行数在约束内、完整业务文本不丢、bbox 真实且有效、不遮挡基本连接路径。Firefox/Linux 与 WebKit/Linux 不等同 Safari/iOS 真机，也不覆盖 Windows/macOS 字体栈。

### 故障和证据守则

Firefox/WebKit 的浏览器下载依赖 CI 环境网络；安装、浏览器启动或 CSS/DOM 断言失败时，该工作流必须保留红色，不可将其替换为 Node 模拟并冒充通过。Eidos 与 App 既有所有 Chrome 回归也必须重新运行；任何不一致不改变客户原始 logo/文字或持久模型。

## 验收和未来工作

该阶段的成功限定为独立单元/集成、最新 head 全部 CI、真实 Chrome 合法自动路由、真实 Firefox+WebKit 渲染证据。专业级 RTL 光标/选择与复制、真实用户企业图及重启后的数据库写入、目标系统实体鼠标/触摸/触控板、12k 全自动复杂路由均尚未完整验收。§14 **39 项商业验收仍 NOT TESTED**。所有本轮代码与研究继续留在两仓库 Draft 分支，便于下一聊天窗口追溯。


## B8s 真实 SVG 与 Canvas 的测量差异、保守避让修正

在实际 [Firefox/WebKit 字形宽度诊断 #38056315599](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38056315599) 中发现：Firefox 阿拉伯文单行 `canvasWidths[0]=237.78`，最终 parent SVG `getBBox.width=237.78`，而 WebKit 对同一 RTL 样例测得 `canvasWidths[0]=247.83`，最终 SVG parent bbox `width=278.55`；希伯来文亦有 `canvas 258.74` vs `SVG 266.91`。此外 WebKit 的子 `tspan.getBBox()` 有时返回整个父标签宽度，不能把每个子 tspan 的 `getBBox` 当作跨引擎可靠的独立行宽。这是实测布局差异，不是存储文本或关系对象错误。

**决策：** `diagramCaptionLayoutV010` 对 `direction="rtl"` 在折行条件和碰撞预留两侧使用相同的 **1.25 倍安全宽度**，避免“折行和评分使用不同估计”。LTR/中英文原有宽度口径不变。因浏览器字形差异不固定，这个工程余量只能降低漏判几率，**不能从此推断 WebKit/Safari 所有复杂字形都永不超框**。在独立真实 Firefox/WebKit 工作流中新增用同一 pure `diagramCaptionLayoutV010` 算出的预留框与实际 SVG parent `getBBox` 的**宽度和水平坐标比较**；若异常则测试失败，不能假定跨浏览器一致。

后续最值得跟进：不同字体、不同系统的 SVG 可见字形精确测量和二次避让策略、Safari/macOS/iOS 真机；更长期应从真实字体轮廓测量或渲染后的有界二次布局入手，不能将这 25% 常数当成最终专业版全部排版需求。


## B8s 水平锚点的真实跨浏览器偏移及修复（更新）

额外验证引入了比“SVG 盒宽度”更严格的断言：比较 **真正画出来的父 `<text>` 的 `getBBox.x/x+width`** 与路由算法使用的同一个世界坐标预留矩形。尽管 B8s 的 1.25 倍 RTL 宽度余量已让 WebKit 希伯来文的总宽度落入预算，WebKit 实际父 SVG 的中心仍可能偏向右侧，说明不能单靠宽度倍率解决锚点定位。以前关于“文字宽度大所以加倍率即可”的结论必须收窄。

**采用两层纠正**：
1. RTL 字符串优先以 1.25 倍测量宽度同时决定折行与避让矩形，防止不同逻辑产生不一致的半径。
2. 在 Eidos Surface 的 SVG 与 DOM **实际挂载以后**，仅对真实可见的 RTL `<text>` 调用 `getBBox()`，比较其中心与 `geometry.label.x`；如存在明显偏移，等量调整该文本及内部每一个 `tspan` 的 `x`，令真实 SVG 字形盒中心与路由预留中心一致。只改变这次渲染的 SVG 属性，不能写入 projection 模型。对一次 render 最多 256 个可见 RTL label 做昂贵 DOM 量测，超过限额或量测不可用时通过 SVG `data-eidos-diagram-bidi-measure-limit/unavailable` 明示诊断，避免无界测量拖慢密集图。

实际 Firefox 和 WebKit 的测试比较**渲染之后**的实际 SVG `getBBox` 与纯 `diagramCaptionLayoutV010` 的世界坐标预留框，既检查字形宽度，也检查是否被整体横向错位。保留 Browser 引擎、字型、行数和真实数值在 CI log 里，兼容出现不同的字体轮廓但不允许超预留框。该策略仍无法取代 Safari/iOS 实机、不同系统 font fallback 和全套 §14 39 项商业化验收。
