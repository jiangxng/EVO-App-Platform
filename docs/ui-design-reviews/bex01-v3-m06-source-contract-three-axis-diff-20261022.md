# BEX-01 V3 / M06｜原型源码 ↔ Host/Eidos 三维差异账（2026-10-22）

> **证据等级**：2026-10-22 已读锁定原型 HTML/CSS/JS、当前 #1086 精确源码与 Eidos 渲染器/控制器/Design Language；此表是**源码级审阅**，不是新的客户导入、人眼截图或 100% Human 签收。继承 [Window 13 索引](../plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-13-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md) 的研究等级与失败记录，不重复外站研究。
>
> **原型**：[PR #909 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) @ `af58e0a`，blob `9f57e9320eb527786ff7b737be27777eba6f8a92`；**业务** [#1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086)（本次基于 `6bde025`，相对 #1077→#1060，均 Draft 未合 main）；main 检查 `ee9cc39`，新进的 #1098 仅在 Provider/治理/帮助/相关 CI 路径，未碰本次源码。
>
> **判定**：E＝已在真实实现源码中对应，自动化证据继承前序（**仍需 Human**）；D＝源码中有确认差异或本批工程缺口；H＝演示与 Host 真正安全语义冲突，需 Human 认可真实路线；V＝真实渲染/同态页面需要 Human 独立校验，不凭 CSS 数字宣告 100%。不把合成 `22 列/172 行` 当成客户事实。

## A. 功能（必须用真实 Host/权限/业务状态核验）

| 原型 DOM/事件 | 当前真实源码/证据 | 判定及余项 |
| --- | --- | --- |
| `#upload` 恢复文件/继续核对 | `apps/data-import/page.ts` Directory/Mapping route、持久化 Import Job | E：真实任务恢复，不复制演示假文件名；入口全流程需 Human 验收 |
| `#stageOne/#stageTwo` 两步骤 | `reviewTask.steps` 两步，由 Eidos 原生 rendering | E；Stage 2 内的子阶段在 Host 内分路由 |
| `#fileinfo` 文件名/工作表/行列数/已读取 | `reviewTask.subject` 取 `job.source` 与真实文件类型图标 | E；不得写死 172 |
| `#mappedCount/#createCount/#skipCount/#issueCount` | `reviewTask.metrics`；Eidos `statusByChoice` 实时本地更新；问题数 `reactive:false` | E；Host dry-run issue 不随未保存选择消失（`c490dd8`） |
| `#bankIssue/#bankToggle/#bank` 双重同名目标用途核对 | `candidatesFor/fieldLabel` 用稳定 `fieldId`，不以同名猜用途；issue 按序 | E；真实两条银行的字段身份/用途属于 M04 Human 未决 |
| `#subjectIssue/#typeToggle` 缺主体类型行纠错 | `rowIssueGroups/relatedRoutes`、`row-correction-page.ts`，有真实行/权限/版本门禁 | E（可纠错路径条件成立时）；真实主体身份禁止猜测 |
| `#metadataIssue/#metaToggle` 系统编码人工决策 | `metadataLikeColumn` + issue `focusGroupId` + 显式 Ignore/Create/Field ID | E；不能从名称自动丢弃 |
| `#tableFilter` 需要关注/全部字段/待处理 | `reviewTable.filter` + `choiceValues:["__PENDING__"]`，改选后即时过滤 | E（`6bde025`）；原型 7/22 vs Host 6/22 是不同来源口径，H/V |
| `#toggleAll` 看全部字段 | filter 中有「全部字段」，可直接切换；没有相同的独立文字按钮 | E（功能），V（入口形式不同） |
| `#mappingRows` 4 列/来源示例/目标 Select/状态 | `reviewGroups`、`reviewTable`；原始行以 Host Job 持久化，样本可展开 | E；示例仅展示最多 3 个简写，完整证据通过 Host 记录/审计 |
| 改选、撤回、目标字段唯一占用 | Eidos `exclusiveSelect`、`statusByChoice`、reset 恢复 | E（`cdba8f8`、`c490dd8`）；未保存不等于已持久化 |
| `#backToFiles/#reset` | `reviewTask.footer` 真 Host 导航/仅撤销未保存选择 | E（#1077） |
| `#prepare/#schemaConfirm` 新字段确认 | `data-import.review` 和 object-extension 批次审批独立路由 | H：原型假创建不同于 Owner 实际审批，真实权限不得绕过；需 Human 认可分步体验 |
| `#saveStatus` 自动存档/localStorage | Host 显式映射保存，且提示「修改须明确保存」 | H：不实现不安全假自动保存；文案视觉需要 Human 认可 |
| `#precheck/#rerun` 本地模拟 | `data-import.dry-run` + Shell 单次成功 refresh；失败不进入 commit | E：真实验证（`b700526`），不复制演示假预检 |
| `#submit/#done` 模拟导入成功 | `data-import.commit` requiresConfirmation，成功才可确认导入结果 | H：真实授权/Receipt 才是成功；M05 未做客户授权导入 |
| 问题超出 12 条时仍需找到每个问题 | Platform 有 `reviewIssues.slice(0,12)`，Eidos UIDL `issues` 目前上限 12；四列表/全字段仍能检查来源列 | D：待设计安全、可扩展的溢出入口（包括行级 issue）；**本批不绕过现有 Eidos 上限** |

## B. 布局（响应式结构，不追逐跨分辨率固定行高）

| 原型源 | 真实实现源码 | 判定/余项 |
| --- | --- | --- |
| topbar/brand/企业工作台/header 60px | Eidos Host 原生工具栏、企业 Context 和身份区域 | H/V：原型演示 chrome 不得替换认证和 Host 导航；Human 判定视觉等价 |
| breadcrumb + h1/subtitle + 双步骤 | `contextNavigation`、`data-eidos-page-heading` + workbench steps | E（阅读顺序），V（同态实测） |
| 文件面板→四指标→连续问题列表→字段表→底部动作 | Eidos `reviewTask` → `reviewTable` → `footer` | E：同序；真实 issues 条数按 Job |
| 四列原型宽 20/25/35/20 | Eidos 样式 20/25/38/17（桌面），表格仍同四语义 | D/V：权重与原型略不同，需要 Human 核验，不盲改全局 |
| 收起证据时紧凑行，打开可看来源 | `evidenceLayout:"inline-collapsed"` opt-in，桌面同行/手机展开 | E；多行高度按数据、不同视口可不同 |
| 手机 680px 卡片断点、850/520px 层次 | Eidos 700px 表格卡片、850/520px 概览/操作栏 | E（响应式意图），V（断点附近重点检查） |
| 390px 原型状态角标+选择器触摸可用 | Eidos 状态右上角、控件最小 44px | E（源码）；需要真实同态 Human 验收 |
| 原型底部保存提示/返回/重置/继续一栏 | Eidos 原生 footer，手机单列，按钮实际为显式保存 | E（行为顺序），H（假自动保存与真实动作分离） |
| 原型内嵌确认/预检/完成 panel | Host 切换至独立批次确认/预检/Receipt 页面 | H/V：业务上真实、布局不同，Human 决策保留 |

## C. 颜色（锁定 #909 的 CSS 色板，与真实作用域逐项分辨）

| 色彩/状态 | 原型 CSS | 当前 Host/Eidos 源码 | 判定 |
| --- | --- | --- | --- |
| 页面底色 | `#f5f7fa` | mapping workspace 背景 `#f5f7fa` | E（源码），V（运行） |
| 文字/辅助文字 | `#172b44` / `#6a7c91` | 同值、限定 mapping form | E/V |
| 表面/边框 | `#fff` / `#e3e9ef` / `#ced9e4` | 同值受控局部 token | E/V |
| 主按钮/焦点 | `#2563a6` / hover `#1d538d` / focus `#73aaf4` | 同值 mapping form tokens | E/V |
| 成功背景/文本 | `#eaf7f1` / `#18765a` | 同值局部 tokens | E/V |
| 警告背景/文本 | `#fff6e7` / `#a66712` | 同值局部 tokens | E/V |
| 危险背景/文本 | `#fff1ee` / `#b54738` | 同值局部 tokens | E/V |
| 重点统计 | `#fffdfa` / `#e8d9bd` | 同值 metric warning 局部样式 | E/V |
| 文件图标 | `#eaf5ed` / `#198354` | 同值且取源文件 XLSX/CSV 类型 | E/V |
| 问题框 / 表头 | `#eddfc6` / `#f7f9fb` | 同值局部样式 | E/V |
| 状态圆角标签（四类） | 匹配绿 `#eaf7f1`、待新增蓝 `#eef5fd`、待处理黄 `#fff6e7`、不导入灰 `#f0f3f6` | **改前**仅 `td[data-tone]` 前景着色；**本批**增原生内层 `span` 标签与仅 mapping 表的状态键色，控制器动态更新标签 | D→代码修复提交；协议/Chromium/最终人眼颜色验收仍待核 |
| 原型整页 topbar 与真实 Host 通用壳 | 原型白色顶栏 | 通用 Eidos 主题，不应随 mapping form 局部 token 改变 | H/V：不对其他页面做全局色板覆盖 |

## 本批最小闭环和不重踩约束

- **确认共因**：Eidos 状态文字直接位于 `td`，只能着色，不可呈现 #909 的背景色标签；用语义 `span` 保留 `td` 布局、筛选、键盘和即时 status 更新；仅 `evo-data-import.mapping` 使用批准色板，其它应用的标签行为不改。
- **定向检验**：源测试必须证明标签节点存在、五种状态键样式/原型颜色存在；旧 `statusByChoice` 行改选/撤回、Pending filter、Host issues protected、reset、预检均保留，实 Host Chromium & 1280/390 通过后再谈 CI。
- **当前实测边界**：前序 `6bde025` 的 16/16 已证实自动化通过（当前可见重复 `continuity` 检查条目）；此提交**尚未获得自己的最终 HEAD CI/Human 签收**。失效路线保留：`navigateTo`+Shell refresh 双挂载、此前 Host issues 被错误重算、PA Agent `MOCK_MODEL_CALL_NOT_SEEN` 首轮偶发；不得再重复。
- **下一条真实 gate**：对提交后的源码运行定向协议与真实 Host Chromium；对照原型实际页面在 desktop 1280px/mobile 390px 核验状态标签，同时把功能/布局/颜色三组差异分别交 Human 签署。问题大于 12 的可靠导览需要 Eidos Owner 决策后再动通用上限。
- **M04/M05/M06** 均 OPEN，整体 3/6。真实 `往来账户2026_10_08_10_15_23.xlsx`、同名银行用途/字段身份、主体类型、客户授权、真实导入及最终 Human 100% **均未在本批取得**。禁止 main/业务 Draft 合并或 Railway 发布。
