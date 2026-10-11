# EVO 2D Designer 商业化专项｜B9j 新窗口简短交接入口

**整理日期：2026-10-11。** 这是 **B 类 2D Designer 商业化升级专项**的研究与决策接续文件，**不是新的实现分支或主线状态权威**。本文件只提供快速路线，所有来源的标题、原始 URL、历史查阅日期、已读等级、章节、事实/判断、方案比较、冲突、测试日志/图片位置和模块映射请打开同目录的 [详细参考索引](./DIAGRAM-COMMERCIAL-RESEARCH-REFERENCE-INDEX-B9J-20261011.md)，避免两个文件重复和遗失。

## 1. 本轮任务和用户的持续指令

- 专指 **EVO EOG 2D Designer/Viewer 的完整商业化体验**；用户对目前 2D Designer 不满意，不要求用户逐个指出小问题。目标路径是**打开→看懂→选择/框选→移动/编辑连线→取消/撤销→保存→刷新→新 Designer/只读 Viewer 读取**，同时适配鼠标、触控板、触摸屏和移动端。
- **连续小步、可自行推进到可以验收的技术节点**；中间无需用户重复确认或停下来汇报每个环节。每个增量保留 GitHub 文档、真实 CI 证据与小型独立 stacked **Draft PR**。完成一次闭环才集中报告；不因聊天切换重做旧研究。
- **主线隔离不可变**：两个项目仓库分别为 [eidos](https://github.com/jiangxng/eidos) 与 [EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)。不推 main、不合并、不部署，不修改 TR-01、global authority/status 文件，不与其他工作窗口抢写同一文件。Eidos 负责通用 Surface/UI/input/geometry，App Platform 负责业务投影、Host/Agent 授权/CAS、Designer/Viewer。**不能整文件用 Eidos surface.ts 覆盖 App vendor surface.ts**，后者有独立的 Host context navigation。

## 2. 已定方案与禁止误改的边界

1. 桌面采用 **design-tool** 心智模型：左键选择/框选，右键/中键/Space 移动画布；触控板与双指触摸独立导航；手机独立的工具条/抽屉和显式单指可操作替代。已借鉴 S1 Miro、S2 React Flow、S6 W3C、S7 MDN，但**不采用** map-first 的左键空白必平移，不引入 React Flow/draw.io 替代 Eidos。
2. 四类连线路径 **straight / orthogonal / rounded-orthogonal / curve**，路径、箭头、手工 waypoint、sourceAnchor/targetAnchor 与业务方向分离。旧投影无路径字段应保持原直线；新投影**推荐**圆角正交，不能没核实现有入口就声称全已采用。借鉴 S3–S5 draw.io，**不准**投影编辑改变业务节点/关系 source/target、增加关系或记账业务版本。
3. 投影作为业务图的**可见性/展示层**，可隐藏、调整展示坐标和路径；**不产生新的业务定义版本**。自动排版是项目的**固定工具能力**，可由 Agent 触发，但不可全权作为 Agent 的不确定即时决策。真实 Save 使用 App 授权与独立 projection CAS writeToken；陈旧写入必须显式拒绝；失败保留草稿。
4. 有界自动寻路保持**22 个局部相关障碍/2600 格点预算**：失败诚实报告 route-congested，不偷偷扩大预算/制造碰撞假路由。B8t 的受控 Chrome 全自动 300/900、400/1200 图实际分别有 **21/27 条拥塞**；画布摘要用可访问、非阻挡 role=note，inkQuality=full **不是**零拥塞。
5. 字体与输入沿既定安全策略：RTL/CJK/Indic/ZWJ 实际字符、真实 getBBox、256 次昂贵测量预算与密图默认隐藏未选中标签；pointercancel、第二指取消不等于提交。Linux Firefox/WebKit 测试不冒充真机 Safari/Android；§14 **39 项完整正式商业验收始终 NOT TESTED**，不可由自动化 CI 直接改为签收。

## 3. 已完成的技术验证，到哪里为止

- Eidos 上游最新 B8v/B8w [Draft #158](https://github.com/jiangxng/eidos/pull/158)，head **8160cb63621ee7f1578c2de6a44ffe6d199cff6e**，相对 #157；App 对应 [#606](https://github.com/jiangxng/EVO-App-Platform/pull/606)。B8w 真 Firefox/WebKit 复杂文字 14/14；B8x→B9a 又验证同屏双实例、隐藏/Undo、210px 真实拖动/Undo、未保存草稿刷新重载。
- 本窗口新建的后续 **App Draft PR 链**（均按父分支堆叠、未合并）：[B9b #612](https://github.com/jiangxng/EVO-App-Platform/pull/612) → [B9c #614](https://github.com/jiangxng/EVO-App-Platform/pull/614) → [B9d #615](https://github.com/jiangxng/EVO-App-Platform/pull/615) → [B9e #617](https://github.com/jiangxng/EVO-App-Platform/pull/617) → [B9f #618](https://github.com/jiangxng/EVO-App-Platform/pull/618) → [B9g #619](https://github.com/jiangxng/EVO-App-Platform/pull/619) → [B9h #620](https://github.com/jiangxng/EVO-App-Platform/pull/620) → [B9i #621](https://github.com/jiangxng/EVO-App-Platform/pull/621) → **[B9j #622](https://github.com/jiangxng/EVO-App-Platform/pull/622)**。
- **B9d–B9h**：真正 App Handler + FileDefinitionProjectionStore 重开；CAS 过期写入/跨两个 OS 进程冲突、显式授权 deny/allow/deny；合法业务 preview2d 的**非零拥塞**真正写入 Store→新 Editor/readonly Viewer Eidos geometry。集成 **133/133 PASS**，详情 [B9h #38068777299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068777299)。
- **B9j 真 Chrome 154 最新 code/docs head**：**6740000086577a15c257e813ca6340ab2027410c**；[Chrome Actions #38069498639](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069498639) **PASS**。合法合成 25 节点（2 端点、23 障碍）、1 业务边：App 授权 CAS 真保存后新 Designer / 只读 Viewer 都报 **1 条拥塞**；浏览器真鼠标选中并点击“从投影移除”后本地显示 0，CAS 仍为 1；真点击 **Save projection** 后 CAS **1→2**，全新两页面 Viewer / Designer 都为 **0**，无陈旧提示，Viewer 无 Save，JS 错误为空，企业业务定义历史=1。
- 失败也已留档：[B9i 首轮 Playwright 缺失](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069020504)；[B9j 首轮 selection-read 测试服务器 HTTP400](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069271828)，均修测试工装、未降低核心安全检查。该 B9j 技术机器子场景**已过**，但 CI 用的是**合成合法企业图、文件型临时 Store、受控授权**，不是生产部署或顾客人工签收。

## 4. 源码/文档阅读顺序（避免丢失研究遗产）

1. **本入口** → [详细参考索引 S1–S7/P1–P14/取舍/冲突/证据](./DIAGRAM-COMMERCIAL-RESEARCH-REFERENCE-INDEX-B9J-20261011.md)。
2. **研究原始权威**：[原项目研究交接](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md)、[S1–S7 原始详细索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)、[v1.0 完整要求 §14 39 项清单](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)；这三份在 [资料归档 PR #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 独立分支，**不是 main**。
3. **已执行研发证据**：[B9b–B9g CAS 文件/权限交接](./DIAGRAM-B9BG-SAVE-REOPEN-CAS-HANDOFF-20261011.md) → [B9h–B9j 浏览器完整交接](./DIAGRAM-B9HJ-PERSISTED-NATIVE-CHROME-HANDOFF-20261011.md) → [39 项累计证据矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)。必要时读 [B9j 专项详细证据](./DIAGRAM-B9J-NATIVE-SAVE-POSITIVE-VIEWER-20261011.md)。
4. 只对**缺失、冲突或可能过时**的官网来源再定向访问；当前窗口**并未直接浏览 S1–S7 原站**，只读到原研究记录在 10 月 9/10 已经读原文。原站图片/SVG/GIF 没有归档到项目，须据详细索引的章节/图片名重新访问；不要声称有本地截图。

## 5. 当前未决问题与下一任务

**首选下一条 B 类小增量**：在不触动 TR-01/主线权限的前提下，优先用有授权、脱敏的**真实 S2C/P2P 企业投影**复跑 B9j 用户按钮 Save→文件/真正环境可用的存储→独立 Viewer 读取，并保存可复核输入、版本、真实路由拥塞、失败与屏幕证据。不能用合成图代替客户场景，也不要随意复制有敏感信息的生产记录。

其次要按原 §8/§9/§14 在**物理 Windows/macOS/iOS/Android** 测鼠标、触控板、双指、键盘/单指针替代、屏读和长时间大图；B8t 21/27 个拥塞需收集分布并研究不突破预算的修复/人工路径，不能夸大 12k 全自动正交性能。新建投影是否真的默认 rounded-orthogonal、真实新建流程/Viewer 的手势差异也要复查。生产数据库、多服务重启、真实企业身份权限、39 项人工商用验收都**未完成**。

## 6. 保存与恢复策略

本轮新建立的**只读文档交接分支**是 **docs/diagram-commercial-research-decision-handoff-b9j-20261011**，基于 App [B9j #622](https://github.com/jiangxng/EVO-App-Platform/pull/622) 的已验证 head **6740000086577a15c257e813ca6340ab2027410c**，只新增本入口与详细参考索引；与已有编码 Draft #622 分开，不覆盖其他窗口文件、研究原稿和权威状态。交接 Draft PR/head 应从 GitHub PR Checks 读取，不用聊天摘要猜 SHA。此文档本身不能作为生产上线/正式 39 项验收授权。
