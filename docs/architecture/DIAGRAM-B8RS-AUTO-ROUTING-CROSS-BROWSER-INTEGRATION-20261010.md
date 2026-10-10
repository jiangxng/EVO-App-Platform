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
