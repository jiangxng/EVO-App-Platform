# EVO 2D Designer｜本窗口研究资料、来源等级及决策详细索引（2026-10-12）

> 对应[简短交接入口](./DIAGRAM-V1-20261012-WINDOW-CONTINUATION.md)与[main / 线上诊断](./DIAGRAM-V1-20261012-MAIN-ONLINE-INVESTIGATION.md)。本索引专记**这个窗口实际读取的原件**、从既有归档继承的研究及仍未验证事项。不要将引用一个网址、阅读别人的笔记与亲自打开原站混为一谈。访问时间均为 **2026-10-12（香港时间，UTC+8）**，除明确标注的前序资料日期外。

## 一、证据状态定义

- **R：本窗已读原文**：本窗口工具实际读取 GitHub 文件内容、PR/比较 REST 元数据、GitHub Actions 日志或 Railway 项目/部署/HTTP 原始观测。只是读取源代码不等于在真实产品/设备上执行成功。
- **H：已读项目已归档原文**：本窗打开 GitHub 已有的项目研究文件；文件引用的第三方网站与此前工具运行是**前窗档案**，**本窗没有重新打开原网站/重新运行原测试**。
- **S：仅搜索摘要**：**本窗无此等级条目**，不凭空声称做过网页搜索。
- **U：待验证**：本窗未实际读取原站、未取得实时生产会话、未取得截图、真实设备或签收证据。后续应按需要补证。

**来源事实**采用「[事实/R 或 H]」，**本窗口推断/产品建议**采用「[判断]」。原资料自己写有推断时，也不能升级为实测事实。

## 二、原始需求与第三方行业参考 S1–S7（保持前序阅读血缘）

历史来源在 [《2026-10-11 详细来源索引》](./DIAGRAM-V1-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)、[《2026-10-10 原始来源索引》](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md) 和 [v1.0 要求 §16](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) 中已有更深的章节、图片名、P1–P14 与精确取舍，**不在本窗口补造原站阅读**。

| ID | 原始标题及网址 | 查阅日期与状态 | 前序研究中的主要发现（非本窗重新观察） | EVO 模块用途 |
| --- | --- | --- | --- | --- |
| S1 | [Miro — Using Miro with a mouse, trackpad, or touchscreen](https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen) | 2026-10-09 初读、10-10 前窗复核；10-12 **H**；官网 **U** | Mouse/trackpad/touchscreen 的导航与选择区分、Space/右键平移、触控板手势 | `eidos/src/diagram/surface.ts`：M01/M05/M07/T01/T06，移动端明确多选工具；不把长按当唯一方式 |
| S2 | [React Flow — Panning and Zooming](https://reactflow.dev/learn/concepts/the-viewport) | 同上；**H/U** | 视口、平移缩放手势/默认视图的可配置交互参考 | `viewport.ts`，指针与 camera 规则；**没有决定将 Eidos 替换成 React** |
| S3 | [draw.io — Style connectors](https://www.drawio.com/docs/manual/styles/connector-styles/) | 同上；**H/U** | 连线路径、箭头、连接视觉样式应分离 | `edge-paths.ts`、`surface.ts`：V01/V03/V04 |
| S4 | [draw.io — Work with waypoints](https://www.drawio.com/docs/manual/connectors/waypoints-connectors/) | 同上；**H/U** | 路径点可交互维护，不破坏端点锚定 | `edge-waypoints.ts`：E03/E05/E06 |
| S5 | [draw.io — Work with connectors](https://www.drawio.com/docs/manual/connectors/) | 同上；**H/U** | 路径/连接、编辑及自动路由的用户控制 | `obstacle-routing.ts`、`snapping.ts`：E01–E07 |
| S6 | [W3C WCAG 2.2 — Understanding SC 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | 同上；**H/U** | 不应把拖动当唯一完成操作的方法 | A02/Mobile 的非拖动操作替代、键盘/可访问性 |
| S7 | [MDN — Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) | 同上；**H/U** | pointer 捕获与取消、touch/mouse 事件协调 | M09/T04/T05、避免残留拖动 |

**图像与附件状态**：前序来源索引 S1 记录过 `new-mouse-trackpad.png`、`select_and_hand_mode.gif`、`minimap.png` 等**外站资源名**，本窗口**未下载、未生成任何原站截图**；相关 GitHub Actions 日志/截图工件以其 run URL 为定位入口，**未在本窗下载或永久归档工件**，需警惕 GitHub Actions 工件过期。不得编造路径或视觉证据。

## 三、本窗口实际直接读取的 GitHub 原始文件（R）

以下路径/片段均在本窗由 GitHub 连接器读取原文；文件的当前行号可能变化，重要诊断统一以冻结提交 `ccb5820b99d854e1e78f6c35bfb77e01e7d084f1` 链接（生产版本），及当时 main `33ecccdaa27a96f8d6fa0e3e146b589dd71adfa8`。

| ID | 来源原件 URL／查阅日期／状态 | 精确章节或片段 | [事实/R] 原文要点 → 当前用途 |
| --- | --- | --- | --- |
| G1 | [Platform v1.0 商业化要求](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)，10-12 **R** | 开篇总目标、§13、§14（39 场景）、§15、§16 | A+B 为完整交付，C 可延期；必须验证真实 Windows/Mac/iOS/Android；不能以代码合并或机器字符串断言宣告正式验收 |
| G2 | [EOG 2D package](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/eog-2d/package.ts)，10-12 **R** | 约 16–68、79–227 行 | 包 `evo-eog-2d`；Viewer/Designer 各自 Feature；`defaultActivation:true`，Designer requires Viewer+authorization；workspace `/operating-graph`、Viewer `/operating-graph/view`、定义投影 routes 都声明在体验中；注释说明**不放持久侧栏**，从业务上下文打开 |
| G3 | [Platform Manager/Host](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/manager/server.ts)，10-12 **R** | 约 1020–1080 catalog、1079 state、2451–2465 migration、6192–6270 shell/assets、6490–6668 API、7590–7990 EOG/Viewer | EOG 包**确在 catalog**；已安装 Viewer 但 Designer 未 active 时有迁移启用尝试；有效页受 activeFeatures / 企业上下文限制；GET `/v1/platform/snapshot` 与 `/v1/experiences/effective` 用于实效对账；网页登录会重定向 `/login`；带版本 asset 可能使用归档资源路径 |
| G4 | [Eidos Browser Host shell](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/app-host/browser-shell.ts)，10-12 **R** | 约 50–77、160–220、383–405 行 | `currentPath()` 从 **window.location.hash** 解析 `#/foo`；`window.location.hash` 在导航时更新 → 正确打开业务页示例是主页 `/#/store`，不是服务端 `/store` |
| G5 | [Plugin Store Page](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/manager/plugin-store-page.ts)，10-12 **R** | 页面 Experience `defaultRoute: '/store'`、安装/启用展示 | Store 在 App Host 路由体系内存在；直接服务端 GET `/store` 404 不说明 Store 代码被删 |
| G6 | [Designer projection editor](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/eog-2d-designer/definition-projection-editor.ts)，10-12 **R** | 文件开头、命令/保存结构；约 1410 行 | 投影本身有创建/命名/保存和展示调整的当前实现；不能把原 #388 的业务 definition revision 更新路径搬回 |
| G7 | [Viewer definition preview](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/eog-2d-viewer/definition-preview.ts)，10-12 **R** | 115–178 行 | `Edit projection` 工具栏**只有** `canEditProjection && projectionId` 时产生；有 `contextNavigation` 支持，保存/回到业务页属 Host 上下文链路 |
| G8 | [Enterprise software projection Gallery page](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/apps/enterprise-context-governance/software-page.ts)，10-12 **R** | 214–319 行，`projectionGallery`、`primaryItemId`、`secondaryActions` | 当前应用定义详情页**确有 Gallery 展示与预览**，但旧版管理命令（增删/改主要投影）不等于当前已交付，须与旧分支对账说明区分 |
| G9 | [Eidos vendor manifest](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/source.manifest.json)，10-12 **R** | 顶层 `sourceCommit`、`componentPins[0]`、`hostOverlays` | 顶层全局 `22b487...`，**2D 独立** pinned `79e124...`；15/16 diagram 文件匹配上游，`surface.ts` 是声明过的 Host overlay，含 V04/M05/V06/T06/E06/E07/D02/A01 等受控前向移植。不能整目录覆盖 |
| G10 | [Eidos upstream diagram surface](https://github.com/jiangxng/eidos/blob/79e124d32fa5435a645968617d3147358518cb4f/src/diagram/surface.ts) + [Platform Host overlay](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/diagram/surface.ts)，10-12 **R** | 两份全文及名称级/行内容 diff | 上游原文有通用 `contextNavigation` 结构，Host overlay 用另一种上下文导航处理；平台包含额外 V04 等适配。两份不同**有设计原因**，不能仅凭不同 SHA 称覆盖失误；需具体交互复现 |
| G11 | [Catalog seed](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/catalog/seed.ts)，10-12 **R** | `eog2dPackage` re-export | Catalog 存在不代表持久数据卷当前已 installed/active |
| G12 | [Eidos 2D diagram index](https://github.com/jiangxng/EVO-App-Platform/blob/ccb5820b99d854e1e78f6c35bfb77e01e7d084f1/vendor/eidos/src/diagram/index.ts)，10-12 **R** | 模块 exports | 导出 `edge-paths`、`obstacle-routing`、`edge-lanes`、`layered-layout`、`viewport`、`selection`、`edge-waypoints` 等；这些文件在生产源提交内，并非整个引擎被删 |

## 四、归档、PR、CI 原件（区分本窗已读与历史引用）

| ID | 原始 URL／时间／状态 | [事实或限制] 查到什么 | 作用 |
| --- | --- | --- | --- |
| H1 | [前序 2026-10-11 研究来源索引](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/DIAGRAM-V1-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)，10-12 **H** | 记录 S1–S7 原网址/查阅日期/图片文件名、P1–P14、先前机器测试来源；不是本窗重读外站 | 保障原参考遗产不丢失 |
| H2 | [前序恢复和决策索引](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/EOG-2D-DESIGNER-RECOVERED-RESEARCH-DECISIONS-20261011.md)，10-12 **H** | 原 v1.0 基线，B9/B10/B11 历史阶段不是今天缺失清单 | 解释历史方案与商用范围 |
| H3 | [本轮 39 场景进度记录](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/DIAGRAM-V1-CURRENT-CONVERGENCE-STATUS-20261012.md)，10-12 **H** | 39/39 编号有机器子场景覆盖；0/39 正式签收；P01 性能回退、P02 仅 fixture Save 隔离 | 正确验收口径 |
| H4 | [12 旧分支逐条审计](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/DIAGRAM-V1-12-LEGACY-HEADS-RECONCILIATION-20261012.md)，10-12 **R** | 5 个旧验收、7 个产品时代分支逐项处理；不能移植的旧独有 UI 被历史归档；#388 保存方式违反无业务版本原则 | 防止“旧分支删除=所有旧功能已存在”的误判 |
| H5 | [Platform #780](https://github.com/jiangxng/EVO-App-Platform/pull/780) + [主清理 workflow](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38156172588)，10-12 **R（PR/元数据/日志）** | 12 个旧 source ref 合并至 main 的 Git 历史（无旧运行代码树覆盖），旧 #388 关闭，**另删 13 个 refs 含清理头**；复核现存 2D 旧 ref 为 0 | 证明历史可追溯，拒绝把历史合并等同功能集成 |
| H6 | [Platform #776](https://github.com/jiangxng/EVO-App-Platform/pull/776) / [#778](https://github.com/jiangxng/EVO-App-Platform/pull/778) / [#715](https://github.com/jiangxng/EVO-App-Platform/pull/715) / [#762](https://github.com/jiangxng/EVO-App-Platform/pull/762)，10-12 **R（元数据和文件读取；不是逐一重跑测试）** | 先前 main 合并史、34+4 已合并旧 refs 退役，以及独有研究原文完整保存 | 对账其他聊天“为什么还有 2D 分支” |
| H7 | [Eidos #160](https://github.com/jiangxng/eidos/pull/160) / [#171](https://github.com/jiangxng/eidos/pull/171) / [#172](https://github.com/jiangxng/eidos/pull/172) / [#173](https://github.com/jiangxng/eidos/pull/173) / [#174](https://github.com/jiangxng/eidos/pull/174)，10-12 **R（PR/源码、部分 CI）** | Generic core 与锁定能力先入 Eidos；旧 29 PR 阶段链已归档/关闭，独立 recovery 文档保存，后续旧 2D refs 均已清理 | 通用 owner vs Platform vendor 边界 |
| H8 | [Eidos 最终结果](https://github.com/jiangxng/eidos/blob/main/docs/architecture/DIAGRAM-V1-STACK-RETIREMENT-OUTCOME-20261012.md)，10-12 **H** | 清理 workflow [#38156910421](https://github.com/jiangxng/eidos/actions/runs/38156910421) 实际关闭 28 PR、删 28 refs，后因自动删除维护 ref 再查出 404，**任务最后状态 FAILED**；随后 [Branch Hygiene #38157476026](https://github.com/jiangxng/eidos/actions/runs/38157476026) 与 CI SUCCESS | 不把 CI 失败掩盖成成功，也不忽略最终分支确实清空 |
| H9 | [P01 Chrome 性能 workflow](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38152913068) / [P02 Firefox/WebKit 双实例](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153170391)，10-12 **H（读已有总结；未在本窗重跑）** | P01 压力图 500/1000：selection 50.7→53.9ms、pointer p95 18.59→20.33ms；P02 保存仅 fixture request，**不是企业持久层 CAS** | 性能/并发验收门槛与未决风险 |
| H10 | [项目正式 §14 证据矩阵](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)，10-12 **H（基于既有原文引用）** | 全部正式 case 仍不可冒称人工签收 | 新窗复核 NOT TESTED，不“自动提升” |
| H11 | [Eidos Branch Hygiene 源码](https://github.com/jiangxng/eidos/blob/c15aac6f886bf596024127df12b293cac75ec5ba/.github/workflows/branch-hygiene.yml)，10-12 **R** | 只针对已合并 PR 删除 refs；`#174` 合并后已自清理 | 新窗口避免重新构造大型清理 |
| H12 | [本次 Platform #787 main 提交](https://github.com/jiangxng/EVO-App-Platform/commit/33ecccdaa27a96f8d6fa0e3e146b589dd71adfa8)，10-12 **R（GitHub commits/compare）** | 主线已从 f7d96e 前进到 33eccc（BEX 供应商导入首片），**其他窗口仍在运行** | 一切 diff 和 PR 必须以新的 main 为基准 |

**明确未做**：本窗口没有用外网搜索引擎重新搜索 S1–S7；没有访问用户已登录的浏览器（无 cookie/token），没有实际人工触摸/跨设备录像，没有下载旧 GitHub Actions ZIP 工件，也没有新建任何测试视频或图片。涉及真实屏幕和第三方网页当前变更，均为 **U**。

## 五、方案取舍：已采用、排除、限制

| 争议 | 已采用 [判断] 及证据 | 排除/暂不采用 [判断] | 仍适用条件 |
| --- | --- | --- | --- |
| 历史 2D 分支如何合并 | 逐 head 审计，真实完成代码已由新实现承接；老提交做 Git 历史-only parent、闭旧 PR、按 SHA 删除 ref；详 H4/H5 | 整个过时 PR 工作树直接合并/强行恢复旧 Server 与 Projection Revision 写法 | 若用户明确需要旧独有 UI，单独开产品决策并在最新 Host 重新设计/验收 |
| Eidos 新能力如何进入 Platform | Generic 在 Eidos owner；Platform 仅组件 pin 与明示 `surface.ts` Host overlay，15/16 等价，保留上下文返回和 V04 等修补；见 G9/G10 | 全量替换 `vendor/eidos` 或把全局旧 `sourceCommit` 误当 Diagram 独立版本 | 每次 Eidos 更新先对账 pin/overlay、跑 Designer/Viewer 回归 |
| 功能“消失”的优先判断 | 先比 main/线上同文件、导航 hash、插件 installed+active、上下文，再定位删改；见 G2/G3/G4/H12 | 因看不到菜单就认定代码被覆盖；因 404 /store 就断言插件被删；先全量 rollback | 需有用户可复现的原入口和预期功能 |
| 产品内导航模型 | 当前 Designer/Viewer **按业务上下文触发**，而非左侧永驻（G2 代码事实） | 强行恢复独立常驻菜单；和“投影在账本定义/版本/投影视图下”产品决策冲突 | 若业务用户找不到入口，可先改文案/面包屑/上下文操作的发现性，不能擅自改信息架构 |
| 验收完成口径 | 机器子场景 39/39、人工 0/39 分开报，P01/P02 仍有限制 | 以“已合 main”“CI 绿”宣称商业化 100% | 后续必须真实设备与企业保存/权限/并发验证 |
| 发布方案 | 本交接只记录生产滞后版本与差异，不发版、不回滚、不动数据库/volume | 仅因 SHA 落后 main 立即生产部署；没有证据就回滚到更旧版本 | 必须先核对用户同意的目标提交、真实丢失功能清单、风险和回退方案 |

## 六、仍相互冲突的证据或未决问题

1. **“main/线上好多功能被覆盖” vs 代码依然存在**：R/G2–G12 证明核心文件与若干功能注册仍在，且生产到 2026-10-12 main 的 diagram 文件没有差异；但不证明用户在已登录、插件 installed/active、正确企业身份下能看到 UI。**未决**：到底缺失的是入口、特定按钮、已安装状态还是保存链。
2. **某个旧分支“只归档” vs 该功能原来可能真实出现过**：H4 只证明没有把旧 UI 复制回来；旧软件 Gallery/返回按钮等有历史差异，用户感到回退也可能是真的。**未决**：哪些是用户验收过的正式 UX，哪些只是分支实验。用旧截图/确切 commit 进行 UX 对账。
3. **Eidos upstream 和 Platform overlay 不同**：R/G9–G10 明示不同有意；是否每一处差异都符合新交互须用正式浏览器 case 检查。**未决**：Eidos 最近 main 动态是否需要选择性同步；不可 bulk overwrite。
4. **Railway 版本滞后 39 commit vs 线上运行好像少功能**：R/线上部署是 `ccb5820b`，当前 main `33eccc`；diff 19 文件包括 BEX、新外部 Agent 与文档，但无 diagram core。**未决**：用户指出哪些具体“新功能”是在生产提交之后才到 main，以及有无会话/权限掩蔽。
5. **P01/P02 自动化绿 vs 企业商用级要求**：P01 有可测轻微压力回退，P02 不是真实后端 CAS，§14 仍 0/39。**未决**：实机性能、企业授权、多实例真正的保存竞争和恢复体验。
6. **外站参考页与 CI 工件的时效性**：S1–S7 仅基于历史档案，官网现状没复查；Actions artifact 可能过期。下一窗口只在需要新设计/无法复现旧证据时重访，并标明访问时点和原文差异。

## 七、优先继续查阅方向与模块落点

| 优先级 | 下个读点 | 用途 |
| --- | --- | --- |
| P0 | Railway [Ledger Configurator](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601)、[线上站点](https://ledger-configurator-production.up.railway.app)、已登录 `/v1/platform/snapshot` / `/v1/experiences/effective`、浏览器 DevTools | 确认 installed/active/identity/context，区分部署与 UX；Railway 只读，不泄露环境变量值 |
| P0 | G2、G3、G4、G7 + `apps/ledger-manager/` 实际业务返回路径 | 复现 Viewer/Designer 从业务上下文打开、编辑按钮是否条件显示 |
| P1 | [原始需求 §13–§14](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)、[验收矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)、P01/P02 CI | 确定是开发新缺口还是验证缺口；只列真实的待修复缺陷 |
| P1 | Eidos `src/diagram/surface.ts` 与 Platform `vendor/eidos/src/diagram/surface.ts`、`source.manifest.json` | 若鼠标/画布行为丢失，逐行为差异比对，不碰其他 Eidos UI |
| P2 | 旧 [#388](https://github.com/jiangxng/EVO-App-Platform/pull/388) 与 H4 审计；旧企业投影、Viewer 返回 UI | 只有在用户给出已确认旧截图/用例时才作最小恢复方案 |
| P2 | S1–S7 官方原站，尤其 Miro/React Flow/draw.io/W3C/MDN | 仅当要修改交互或发现参考版本变化时再补读原文；更新阅读记录与截图路径 |

**结论约束**：本窗口大量直接源代码/部署资料已经保存在 GitHub 链接中；本索引做的是**可回溯记录与事实/判断分层**，不是代替人工验收，也不是未授权地替其他窗口开发。
