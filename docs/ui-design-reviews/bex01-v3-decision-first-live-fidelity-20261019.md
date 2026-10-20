# BEX-01 V3｜真实 Host 决策优先布局与高保真目标审查（2026-10-19）

> 本次实施是 **V3 100% 还原建设的第一项工程改动，并非 100% 完工声明**。原设计权威为 [#909 V3 HTML](https://github.com/jiangxng/EVO-App-Platform/pull/909) 和 2026-10-16 S01–S04 四张原始截图（ChatGPT 文件库原图已直接读取并在 M04 详细研究索引 §9.4 登记）。通用技术来源为**已合并的 [Eidos #196](https://github.com/jiangxng/eidos/pull/196)**：`reviewTask.presentation="decision-first"`。本次仅将已合并的 Eidos 上游改动准确前移到 Platform vendor 局部，不重做外站研究、不更新其他 Eidos owner 模块、不改真实客户数据。

## 目标与完成条件

V3 Human 工作台首先让用户核对当前来源列、原始样本、字段选择及状态。现有 `/data-import/jobs/:id/map` 与 `object-extension.batch-import` 页面 Eidos 默认完整任务概览在表格前，占据首屏，和用户的“异常优先、证据就地、操作连续”的高保真基准冲突。本次在原有四列审核表之前压缩任务概览为可展开摘要，完整辅助信息仍可取得。最终 V3 的 100% 样式、交互和 Human 签收是后续独立门禁，不能由此一项替代。

## 流程与步骤

从既有 Host Job 打开 /map 或批次审核：首先显示文件名及真实注意项数量的任务摘要 → 立即可见来源表及字段决策 → 如需检查历史，点击或键盘展开原生 details 查看原完整文件事实、步骤、统计、问题跳转、说明 → 折叠后继续做决定。原始字段选项和保存/授权命令不因展开、折叠发生变化。客户主体类型每条原值与审批路径维持既有规则。

## 导航与信息架构

两条实际 Host 页面均复用 Eidos `reviewTask` 合同，仅选用已经合并的通用 `presentation` 属性；无新增 BEX 私有 shell、React 皮肤、侧边栏或业务路由。/map 现有“集中审核”入口及返回方式不变；文件 ID、授权企业上下文、`choice_N` 的来源列身份和版本校验不变。不得把 Task Summary 的文本当正式批准。

## 视觉与颜色

采用上游 Eidos 44px 原生 summary、高对比边框、现有响应式 token。摘要层默认折叠，但展开时全部 steps/facts/metrics/issues/help 原样出现；状态数量附文字，不单用色彩。真实 ReviewTable 四列、默认需要关注筛选和移动卡片保持独立。**尚未检验 1280px/390px 的逐像素比例与截图偏差，仍需后续检查，不能称已经 100%。**

## 记忆与注意力

人的当前任务是逐列审核，不是重复阅读多屏上下文。来源文件名和待处理数仍可即刻识别，冗长统计与问题辅助是可还原的结构性信息而非删除。草稿保存、重入和已审核 Recipe 仍由 Host 负责；本布局不改变任何原始行值或已保存决策。

## 无障碍与跨年龄

原生 HTML `details/summary` 支持键盘、屏幕阅读器；summary 最小 44px 并有可见焦点，长中文名可换行，所有内层 focusGroupId 不删除。Eidos validator 严格白名单 `full/decision-first`，未知 `presentation` 被拒，默认值保持旧展示。窄屏审核卡片仍提供源列、示例、选择、状态，目标是无水平溢出；真机触摸、200%/400% 缩放和读屏器需要另行签收。

## 安全与数据修复

**仅展示层选择**。没有改变 `DATA_IMPORT_REVIEW_COMMAND_V010`、`OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010`、映射字段 ID、企业 Owner/Admin 权限、同名开户银行防误选、三条主体类型逐行纠错、Schema 创建批准、dry-run、Recipe、supplier commit、receipt 或审计。Eidos 通用合同既非授权源，也没有新脚本执行；Html 所有主体文字沿用 `esc` 转义。M04 未取得用户原 Excel 和受权 Job，仍 OPEN。

## 证据与剩余问题

- 上游 Eidos #196：已合并原文、源代码/完整补丁，明确只对 opt-in 生效。本次做最小 4 个 vendor 文件同步，保留已有 Platform Host overlays。
- Platform 真实业务：修改 `apps/data-import/page.ts` 和 `apps/object-extension/batch-page.ts`，使两个页面显式选择 decision-first；`tests/protocol/bex01-v3-decision-first-visual-review.test.mjs` 对 HTML native disclosure、完整事实保留、严格校验和真实表单进行回归。
- 按精确 PR HEAD 校验 Platform CI、BEX-01 Real Host Chromium、Human UI Gate、Continuity、Lightweight Host，核对原 1280px/390px 截图；如果出现新增失败必须修复后重跑。
- **仍有原 V3 的剩余差异**：实际已登录 Railway 页面与原型的字体、留白、标题、工具栏、字段确认区、底部操作区和跨路由连续性尚需逐项截图审查，不能将本项的自动化绿灯视作完整 100% 或用户签收。
- M01–M03 工程已完成；M04 的原 Excel、两个开户银行真实 ID、三条真实主体身份未验收；M05 真实最终导入待验证；M06 视觉和 Human 签收待验证。工程 3/6 不变。

## 2026-10-19 同窗口追加：S01/S02 直接对照与 Eidos #200 紧凑密度（R）

原始 PNG 的真实读取对照（不是只看索引摘要）：S01 `image(20261016-123851).png` 的 V3 目标表格是紧凑四列，常规一行同时看到原始字段名、示例值、目标选择和状态，没有第三列再次大字重复“系统编码”，也没有固定显示几十个冗长的单列创建链接；S02 `image(20261016-123943).png` 和用户 2026-10-19 当前截图则显示“系统编码”在第 1 和第 3 列重复、来源详情链接和单列创建链接长期占行，导致大量垂直滚动。**S02 是当前偏差证据，不是视觉验收的目标图**。S01 是可供核对的目标片段，而完整页面和流程仍以 #909 HTML 为权威。

针对该差异，经 Eidos owner [#200](https://github.com/jiangxng/eidos/pull/200)（已合并，提交 `bd21cfbce952b6b27527cbb6fdcab5f4c59d076b`）提供可选 `reviewTable.presentation="compact"`：视觉上隐藏重复字段名，绑定的可读标签、选项值、键盘语义仍保留；若当前行有证据展开区，将原 contextLink 保留在**该行展开区中**而不是永远占据选择框下面；没有证据区则仍保持直接显示。桌面使用统一 token 缩小单行间距；工具栏计数在左、筛选在右；手机触摸控件不少于 44px。不复制原型私有 CSS。Platform 仅同步 Eidos 已合并 5 个通用文件的精确功能，在真实 `/map` 和 `mode=batch` 中明确选择 compact，不改业务字段与 Host 命令。

新增浏览器回归核对：真实隔离 Host 四列表格是否显式 compact、来源展开能看到准确的单列导航、选择栏不再重复显示链接、字段映射与集中审核在 1280px 第一屏能看到可操作行、390px 无水平溢出。**这些是自动化工程证据，尚未人工逐像素签收。** 下一批重点：完整文件摘要、需处理问题区域、表格工具栏文案及密度、表底说明与操作区、字段审批/预检流程的一致性。

| M01–M06 原里程碑 | 当前状态和证据 | 尚余门禁 |
| --- | --- | --- |
| M01 四列审核 | 工程完成：#973/#978/#981/#984/#989 已合并；线上旧版本运行，当前 #1054 新视觉仍 Draft | M06 实际视觉 |
| M02 批次审核 | 工程完成：#991/#993/#996 已合并，隔离 Host 回归 | M04 真实身份 |
| M03 保存/重入 | 工程完成：#1028→#999 已合并，历史 CI/部署成功 | 授权客户现场重入 |
| M04 真实数据验收 | 工程安全 #1033/#1035/#1037/#1039 完成，M04 OPEN | 客户原 Excel、授权 Job、两个同名银行字段的实际 ID、三条主体身份 |
| M05 真实导入 | OPEN；隔离流程已有历史回归 | 真实权限、预检/幂等、最终明确提交、审计 |
| M06 高保真 | OPEN；#1054 Draft 包含新 opt-in，Eidos #200 已合并，仍待 V3 全面还原 | 1280/390 实际画面与 Human 签收 |

**整体工程依旧 3/6。** 本追加仅记录直接已读来源事实和新增决策，不是把 #1054 的测试通过等同于完成，也未触碰生产客户文件或 PA05。

## 2026-10-19 续跑 #02：原型上半部分结构纠偏（Eidos #201）

- **新增直接读取事实（R，2026-10-19）：** V3 #909 原 HTML 的 `#review` 区域在四列字段表之前依次呈现导入步骤、真实文件信息、四项计数和“需要处理”问题列表；问题区有人工选择按钮及行级导航。相比之下，PR #1054 最初采用的 `decision-first` 虽保留了全部元素，却在默认关闭的 details 内隐藏这些信息，**不符合用户要求的 100% 原型还原**。
- **变更理由（方案判断）：** 用户明确要求按原型而非单纯首屏短/测试绿灯验收。因此针对两条真实 Host 页面改选通用 `reviewTask.presentation="workbench"`：步骤→文件摘要→计数→有实际问题才显示问题列表→字段表→字段方案及审核动作。撤销了“首屏必须先看到审核行”的非原型假设，改为验证文件/统计/实际问题按工作流顺序可见。
- **架构与实施（R）：** [Eidos #201](https://github.com/jiangxng/eidos/pull/201) 已通过原库 CI + Human UI Gate 并合并于 `1b651737182c083bdb945e30c4d16b9ecacbc1e1`。Platform 在当前 Draft #1054 仅选择性同步 4 个通用框架文件，并对实际 `/data-import/jobs/:id/map`、`/object-extensions/from-import?mode=batch` 显式 opt-in。保留 Eidos 旧 `full` / `decision-first` 供其他应用使用。内容仍取自真实授权 Job，**不捏造原型中的银行候选 ID、三条主体身份、172 行客户记录**。
- **业务/安全门禁：** 企业上下文、字段选择、源值、Host 命令、权限、草稿、字段审批、预检和明确导入未变；同名银行绝不因 UI 展示自动选择。工作流页可能比简化模式更长，这正是优先展示真实问题所需要的，不构成视觉失真。
- **下一步待验证：** 最新 #1054 exact-HEAD 协议/Chromium 1280/390 与 CI；随后逐项核对原型文件卡片文字、四项指标、问题区域/按钮、工具栏、列间距、底部操作区和实际登录页面长图。工程总体保持 **3/6**；M04 数据、M05 导入、M06 Human 签收均 OPEN。不得因为这个工程子项通过而提前合并 Draft。

## 2026-10-19 续跑 #02：真实隔离浏览器截图人工复核（R）

**来源事实等级 R：** 直接下载并打开 [Real Host Chromium run 39277312473](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39277312473) 的 ZIP [artifact 12197673105](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39277312473/artifacts/12197673105)，查阅日期 2026-10-19。并非仅看 CI 摘要；也不是生产登录客户页面。精确 HEAD `0ade1040d701f456e362338cadf075e73de6c96a` 的关联 8 个工作流均 SUCCESS。

| 实际打开的截图 | 已能证明的可见事实 | 仍与 #909 V3 原型有差异 |
| --- | --- | --- |
| `v3-fidelity-workbench-map-1280.png`（1280×900） | 真实 /map 页已可见文件名、172 行/22 列、来源保留标记、步骤条、四个实际统计（4 匹配/17 拟新增/1 忽略/0 需核对）、四列表工具栏与首条来源。0 需核对时不编造 issues。 | **侧栏仍占据约 420px，实际业务内容约 810px，不是原型在页面中 1200px 宽的完整布局**；页标题、文件卡片、统计及表格区的比例、间距、内容文案需进一步对齐。 |
| `v3-fidelity-workbench-batch-1280.png`（1280×900） | 集中审核同样可见原 Excel、172 行/18 列待处理、步骤条与 17/0/1/0 四指标、主体类型来源提示以及四列表。批次主体类型来自 Excel 源列，未自行生成企业常量。 | 同样受固定侧栏宽度限制；顶部标题、长说明、表格操作行、页脚确认区仍不等同原型单一流程布局。 |
| `v3-fidelity-first-viewport-batch-390.png`（390×844） | 移动端展示两列统计卡、文件摘要、步骤与原字段来源提示，底部为现有通用应用导航；控件未在截图中以假数据替代。 | 与 #909 手机原型的顶部/底部区域与长页节奏尚有差异，必须继续对照完整页面；目前尚非 Human 视觉签收。 |
| `v3-e2-actual-map-22-rows-desktop.png`（1280×2577） | 真实 Eidos 业务表中长行、可选字段、新建字段建议与不导入记录均保留；来源证据按钮和目标选择在同一行。 | 仍有相对原型偏窄的列宽与选择框文案差异；完整截图是滚动视图而非所见即所得的 1200px 原型正视图。 |

**来源事实 vs. 判断：** 以上可见结构与图片尺寸是本窗口直接读取的隔离浏览器截图事实；“仍未 100%”是根据 #909 原 HTML 布局、S01 视觉片段与该真实截图的比较判断，不等于生产客户现场测试。**下一项最高优先级 UI 差距：Eidos/Platform 工作台导航占宽与 V3 目标容器尺寸的协调**；仅在明确使用通用受控聚焦布局且不破坏其他页面的前提下修改。其后核对标题、摘要、行密度、问题卡片、操作区与跨页面连续性。不得为追求像素复制而绕开 Host 或越权关闭客户审查。

工程 M01–M03 已完成；M04 真客户数据 OPEN；M05 真导入 OPEN；M06 高保真未签收。总工程进度固定 3/6。PR #1054 **保持 Draft，不自动合并到 main，不切换 Railway**。

## 2026-10-19 续跑 #03：1200px 路由级聚焦布局（Eidos #202 待验证）

**证据和新增决策：** 源自直接读取 #909 HTML、已保存的 S01 视觉目标、实际 Chromium 1280/390 工件 run 39277312473，以及 Eidos `src/workbench/shell.ts` 与 `productive-workbench-css.ts` 的原码。1280px 真实隔离 Host 中，原有侧栏约占 420px、主体宽度仅约 810px；即使隐藏侧栏，Eidos 默认表单还有 1100px 宽度上限。与 V3 目标的约 1200px 连续四列审核工作区不相符，故本轮增加**仅该业务路由选用、通用层提供、可随时恢复的聚焦布局**。

- **Eidos owner 边界（进行中）：** [Eidos PR #202](https://github.com/jiangxng/eidos/pull/202) 提供 `WorkbenchShellOptions.shouldFocusWorkspaceRoute(route)`；桌面聚焦后保留活动栏，隐藏通常导航侧栏与 splitter，字段表最大宽度由通用变量控制（默认 1200px）。工具栏按钮可恢复原导航并重新聚焦，不写入持久化侧栏偏好；390px 使用既有单列工作区，不增加无意义的切换按钮。2026-10-19 本次记录时 #202 的 exact-HEAD CI 仍 **QUEUED**，不得称已合并。
- **Platform 业务归属（Draft 暂存）：** 仅真实 `/data-import/jobs/:id/map` 及有 Job 参数的 `/object-extensions/from-import?mode=batch` 适用；供应商列表、最终预检、普通扩展字段、其他工作台、Agent 和外部 URL 均拒绝进入该聚焦模式。Platform 仅将通用 owner 改动临时同步进 #1054 Draft，与已合并 upstream 保持严格分离，待 #202 通过且合并才可正式认定版本依赖。
- **验证用例（待最新 CI）：** `tests/protocol/bex01-v3-wide-route-focus.test.mjs` 逐个校验允许/拒绝路由；真实 Host Chromium 测试检查 1280px 的映射表实际宽度 1000–1220px、焦点模式开启、侧栏真正隐藏以及工具栏按钮先恢复后重新聚焦。任何绿色结论必须对应**最新精确 HEAD**，不能引用旧 run 39277312473 已通过来替代新代码的验证。
- **后续：** Eidos #202 CI → 合并 → Platform #1054 精确 CI、真实截图 → 对照 #909 剩余标题、文件统计卡片、状态、底部操作区/跨路由流程 → Human 签收。真实客户 Excel、两个银行字段与三条缺失身份仍无新授权证据。**M01–M03 工程完成，M04/M05/M06 OPEN，工程总进度 3/6。** #1054 保持 Draft，不切 Railway release、不写真实客户数据、不覆盖 PA05/Eidos 其他工作。

### 续跑 #04 补充：既有活动栏与快捷键也必须可逆

直接核对 Eidos Workbench 原代码发现单纯覆盖 CSS 的聚焦模式会造成导航可达性冲突：如果用户通过左侧活动栏重新选择 navigation activity，或使用既有 `Ctrl/Cmd+B` 折叠/展开，布局不能仍把侧栏隐藏，更不能因为 V3 临时聚焦而永久写掉原 `sidePanelVisible` / `sidePanelWidth` 偏好。故本轮在 Eidos owner PR [#202](https://github.com/jiangxng/eidos/pull/202) 追加通用行为：导航活动主动展开临时侧栏；快捷键和原 sidebar toggle 共用临时切换，只有用户在普通页面执行正常操作时才沿用旧持久化规则。Platform #1054 Draft 选择性同步这部分变更，并扩展隔离 Host Chromium 覆盖 1280px 聚焦、顶部按钮、`Control+B`、活动栏、离开导入页后的侧栏恢复，以及偏好字段逐项不变（`workspaceTarget` 本身按真实导航仍允许更新）。

**CI 证据级别仍为待验证：** 新增 Eidos PR #202 HEAD 和 Platform #1054 HEAD 关联的 GitHub Actions 均显示 queued，未取到任何该批代码的成功 Chromium 截图。此改动不能升级为已完成工程或 V3 Human 签收。后续先检查 CI/日志，修复后再比对 1280px/390px 完整画面；M01–M03 依历史工程证据完成，M04/M05/M06 OPEN，仍 3/6。

### 续跑 #06：原本关闭侧栏的 V3 用户仍获得宽表且可主动恢复导航

2026-10-20 本轮直接读取 Eidos #202 / Platform #1054 的工作台布局、活动栏与持久化偏好源代码（R）；并非新增外站资料、生产客户视觉证据。发现此前的路由聚焦把 `state.sidePanelVisible` 作为整个聚焦模式的准入条件：当用户原本已关闭侧栏时，既有工作区虽变宽，但默认 `form` 仍限制在 1100px，无法满足 V3 1200px 容器目标；此时点击既有侧栏按钮或 `Ctrl+B` 又会立刻重新启用自动隐藏，导致明确的导航可用性缺陷。这属于从已读源码推出并已作工程修复的具体问题，不冒称真实浏览器验证已通过。

**决定与实施：** 将“当前路由符合工作台聚焦要求”与“用户侧栏偏好为可显示”两个判断分离。任何符合 V3 路由的 1280px 页面均获得统一宽表模式，原本已关闭侧栏则不显示无意义的第二个聚焦按钮；如果用户使用现有快捷键或活动栏主动打开导航，显式操作优先于路由默认聚焦，不被 CSS 随即隐藏。Eidos owner #202 与 Platform vendor 副本均已同步此修复，保留 `sidePanelWidth` 和 `sidePanelVisible` 的普通用户控制语义。

**新增门禁：** Eidos Workbench 结构回归保护上述判断、临时揭示与按钮可见性；Platform 隔离 Host Chromium 使用独立 1280px 用户上下文，预设 `eidos.workbench.layout.sidePanelVisible=false`，核对 V3 实际映射表 1120–1220px、无多余聚焦按钮、原偏好保持不变，然后 `Ctrl+B` 确实恢复侧栏并更新普通偏好。390px 继续沿用 Eidos 单列导航。最新精确 HEAD CI 和真实浏览器结果**仍待 GitHub Actions Runner 运行，不能算 PASS**。

上述是导航布局修复，不代表 #909 标题、文件卡片、审核区、底部操作区和 Human 视觉签收完成。M01–M03 工程完成，M04 客户真实数据验收 OPEN，M05 真实完整导入 OPEN，M06 高保真 OPEN，总体仍 **3/6**。#1054 继续 Draft；#202 未通过/合并前禁止宣告上线。


## 2026-10-20 续跑 #07：#909 原型逐区对照、手机 CSS 根因与工作台动作闭环

### 本轮直接读取的证据（R）

- **原型**：[Platform PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909)，原型 HTML 来源提交 `af58e0abad880439d54230485305bf2b4e05decc`；直接下载并打开 Actions artifact [run 38704093619 / artifact 11957646429](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619)。已实际查看 `01-desktop-overview.png`、`03-complete-field-table.png`、`10-mobile-overview.png`，不是只看链接清单。
- **真实 Host 当前基线**：直接下载并打开 [Platform run 39363181134 / artifact 12238028962](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39363181134)。已查看 `v3-fidelity-workbench-map-1280.png`、`v3-e2-actual-map-22-rows-desktop.png`、`v3-e2-actual-map-22-rows-phone.png` 和 `v3-fidelity-first-viewport-batch-390.png`。这些是隔离 Host / 自动化 fixture 证据，不是生产客户截图或客户 Excel 证据。
- **精确浏览器诊断**：在 390px 下，媒体条件成立，表格容器确实位于目录根节点中，隐藏表格规则也匹配，但计算后的 `display` 仍是 `block`；诊断进一步发现本应通用的 table-wrap 规则被错误包进 `min-width: 701px` 媒体条件。修复后，在上述基线 run 的精确 HEAD 中，390px 表格隐藏、移动卡片显示、Host 搜索/翻页/安全宽度检查通过，V3 专项浏览器步骤实际执行。后续 UI 结构新改动仍必须重跑精确 HEAD CI，不能沿用这份历史绿灯。

### 原型事实与当前差距判断（R / J 分开）

| 区域 | #909 原型直接可见事实（R） | 本轮判断与实现方向（J） |
| --- | --- | --- |
| 页标题与步骤 | 标题为“核对导入数据”；流程为“选择文件”已完成、“核对并导入”当前步骤 | 原来标题“字段映射 · 文件名”与三步条不符，改成原型标题和两步条；文件名移入文件卡 |
| 文件卡片 | XLSX 文件类型标记、文件名、记录数/列数、已读取状态 | 使用真实 Job 的 source kind/rows/headers 生成卡片；不补造工作表名称或客户文件信息 |
| 统计与问题区 | 四项统计；只有实际存在的问题才显示问题列表，问题可聚焦到相应字段选择 | 问题必须由真实 Job、有效 Schema、实际 source values 和现存 dry-run issue 派生；不得把样例中的银行 ID、主体身份或记录数硬编码进生产页面 |
| 四列映射 | Excel 列名、示例值、对应系统字段、状态；有“字段对应关系”标题及“查看全部字段”入口 | 保留现有四列 Host 表单与排他映射值；增加明确标题/说明、全部字段按钮和完整计数文案；筛选只改变显示行，不删除表单值 |
| 辅助动作 | 主流程底部为“返回文件”“恢复初始选择”“预检查并继续” | 把 AI 自动匹配移到字段表工具区，保留个人代理功能但不挤占三个主流程动作；返回走导入列表以保留已暂存 Job；重置使用原始表单初值并刷新本地状态计数 |
| 移动布局 | 手机原型为单列节奏，字段表以卡片显示，不应出现桌面表格 | 继续以 390px 真 Host 断言为门禁；不允许通过放宽断言或隐藏问题数据来“修复” |

### 新增的通用 Eidos 能力边界

- 继续复用通用 `reviewTask.presentation="workbench"`，将步骤放入页面标题行；源文件徽标/状态、任务问题、统计与表格仍使用 Eidos token 和语义属性。
- 表格标题、说明、计数、全部字段入口和上下文路由作为通用 `reviewTable` 能力，不引入 Platform 专用 renderer；业务问题仍由 Platform 的 data-import Job/Schema 生成。
- 表单 `cancel` 动作可声明安全的站内 route 或原生 reset 行为，不能执行 Host command。隐藏的 Job ID 仍以表单值提交给 Host，不在页面上显示无意义的“当前文件”下拉框。
- AI Agent action 继续使用原有 Host 入口，仅调整在表格工具区的视觉位置；映射值、企业上下文、授权、预检查、commit 和审计语义不改变。
- 这组通用变化仅暂存在 Platform 的 vendor Eidos 副本；**不修改 Eidos 仓库的 owner source，也不覆盖 Eidos #202**。后续若需要上游化，另开 Eidos 独立 PR。

### 当前工程与门禁状态

本轮为高保真建设继续新增了业务标题/文件卡/问题区/表格标题与工具/底部动作，以及 route/reset 的通用表单契约。新增代码已准备进入从最新 Platform main 安全隔离出的继续分支；本段记录时，新 UI 结构变更的精确 HEAD CI、1280px/390px 新截图及 Human 视觉签收仍待验证。历史 run 39363181134 只证明此前的 CSS 边界修复和 Host 路由基线，不代替本轮新改动的测试。

当前最新 Platform main 在复核过程中前进到 `ad5ea4932dbabe8289f66289314b43667c154b4a`。先前的 clean continuation 以 `71d63ce6716c19d68e34e77dcd2fe0c185027e35` 为基底；与当前 main 的净变更文件集合无重叠，但仍需基于最新 main 重新建立隔离分支，不盲目 rebase，不 force-push，不直接推 main。PR #1054 / #1060 均继续保留为 Draft 历史，不因新分支而覆盖。

| 里程碑 | 状态 | 必须保留的验收边界 |
| --- | --- | --- |
| M01 | 工程完成 | 不替代客户业务验收 |
| M02 | 工程完成 | 批次审核与权限边界不变 |
| M03 | 工程完成 | 保存/重入仍由 Host 持久化证明 |
| M04 | OPEN | 尚无客户原 Excel、授权 Import Job、两个银行字段真实 ID/用途、三条真实主体身份 |
| M05 | OPEN | 真实完整导入、幂等、权限、receipt/审计仍未验收 |
| M06 | 高保真建设中，待 Human 签收 | 新精确 HEAD CI、1280px/390px 截图、#909 逐项对照与 Human 视觉签收均为独立门禁 |

**整体进度保持 3/6。** 不改 `project.status.json`；不切换 Railway 到 release；不启动真实客户 Excel 业务验收；不覆盖 PA05、Eidos 其他工作或插件治理工作。
