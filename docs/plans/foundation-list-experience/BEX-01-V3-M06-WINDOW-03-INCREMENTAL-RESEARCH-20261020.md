# BEX-01 V3 M06｜Window 03 增量研究与决策（2026-10-20）

> 叠加于 [Window 02 #1075](https://github.com/jiangxng/EVO-App-Platform/pull/1075)、[M06 #1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058)，不替换历史外站资料。用户固定进度 M01-M03 COMPLETE、M04-M06 OPEN，3/6。

## 本轮新实证（R）
1. 2026-10-20 直接读取 #909 精确 HTML 及原型 Chromium artifact 11957646429。文件卡为 XLSX icon → 文件名 → 工作表、行列 → 已读取 pill；stage 2 步，底部三个可操作按钮。参照 [#909 原型源码](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)。
2. 直接下载并打开 [Host artifact 12250007262](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514) 中最新 desktop/phone 异常截图。对应 synthetic 172×22、三类问题、四列关系、2 阶段已有结构；文件类型图标和 footer 尚欠，真实源无证据工作表名称不得填造。
3. GitHub main 于复核早段为 `eaa5e813…`，随后另窗合并 #1076，变为 `102319de812ce65682f0c6ccb1a930e10b4e22d4`。Railway production 成功部署该 main (deployment `dffc4413-07e5-4302-95ac-adcf737fbdfb`)。主 PR #1060 未合并；当前叠加 #1077 Draft。不可继续使用 ahead 44/behind 0 的过时数字；首次 compare main vs #1060 为 ahead44/behind2。
4. 相关活跃：Platform #1054/#1060/#1066/#1070 Draft；Eidos #202 Open、#203/#204 Draft。不可将并行 Draft 当作已删分支清理。GitHub branch search `delete` 两仓库均没有同名标记结果；连接器未提供删除 Git refs 操作，**未删除任何远端分支**。
5. 第一轮精确 HEAD `6e21ed8d…` 的 Actions：UI/continuity 缺同 PR 设计复核文件而失败；in-context resume 因 footer route validator 误写转义而失败。后续修复需新 HEAD 重跑，不能冒充通过。

## 采用／排除
- 采用 Eidos 通用 iconLabel + Platform 真实 source.kind：拒绝在 Eidos 写供应商语义、按文件名随意猜 XLSX。
- 采用现有内站 route 的真实返回 + 仅浏览器局部重置到 Host loaded snapshot；拒绝静态按钮、静默清除持久化 mapping、伪称自动保存；必要时若用户希望重置服务器草稿，必须另立授权动作和审计设计。
- 继续保持 Platform #1077 **叠加 #1060**、Draft，不盲目 rebase main，不动 Eidos owner PR、Railway、PA05 等。
- 不能将合成 Chromium PASS、CI Human UI Gate 名称、生产 main 部署或静态原型截图解释为客户验收或用户 Human 签收。

## 接续
见 [#1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077) 和本次 [UI 设计复核](../../ui-design-reviews/bex01-v3-m06-file-footer-parity-20261020.md)。优先跑新精确 HEAD，实际验证 1280/390 格式图标、返回目录路由、排他映射更改后重置恢复及所有 V3 Chromium steps。其后补足仍缺视觉与信息层级，等待用户签收。M04/M05 禁止提前启动。


## Window 03 续跑：精确工程证据与视觉差异（新增于 2026-10-20，不覆盖上面时间点）

**新增 R（直接查 GitHub Actions + 下载并打开 Chromium artifact）**：叠加 PR #1077 HEAD `aed51518697c25da49ac84e490ef846dcfa6dd1b` 的 [Platform CI run 39421803573](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803573)、[BEX Real Host Chromium run 39421803660](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803660)、[In-Context Resume run 39421803492](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803492)、[Human UI Gate run 39421803705](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803705)、[Project Continuity run 39421803508](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803508) 和 [Lightweight Host run 39421803658](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803658) 均 completed/success。Chromium 23 step 的 V3 source audit、row correction、batch subject constant、synthetic 22×172 XLSX 及 retained fields 全部 success，非 skipped。

**新截图长期定位**：[run 39421803660 的 artifact 12264985007](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39421803660/artifacts/12264985007)，ZIP 75 entries；实际打开 `v3-prototype-parity-issues-desktop.png`、`v3-prototype-parity-issues-phone.png`、`v3-file-footer-reset-desktop.png`、`v3-file-footer-reset-phone.png`。桌面包含 XLSX 标记、文件名、172 条／22 列、已读取状态、16／4／0／3 汇总、按银行歧义→主体类型→系统编码排序的 3 问题、四列表和底部四按钮。390px 变为纵向卡片，文件类型和操作按钮可见，截图无横向溢出。浏览器测试实际选择 `map_21=__IGNORE__`、本地重置后恢复、导航到 `#/data-import`，桌面/手机均通过。报告 `report.json` 标记 `actualHost=true`、5/5、`browserErrors=[]`，但仅 isolated synthetic fixture，非真实客户记录。

**仍未签收／已知差异**：原型 #909 文件卡带真实工作表信息；当前 Host 授权的来源对象无可信任工作表名时不可凭合成数据臆造。底部主按钮当前为“保存映射并预检查”，为了真实持久化和安全门禁保留，暂不机械改成原型“预检查并继续”而掩盖保存行为。页面标题／说明长度、问题卡间距、映射默认筛选与行密度仍需完整人工逐图审查。原型本身是设计示意，不能直接复制其假“更改将自动保存”口径。用户 Human 视觉签收继续 **OPEN**；目标仍 100%，不可将上述 PASS 当作完成。

**历史失败闭环**：初始 #1077 `6e21…` 失败的未补 UI 设计复核／错误转义，后已修复；`cd7e51…` 的 Platform CI 唯一失败是该 PR 新测试脚本过度转义导致 JS 正则语法错误 `SyntaxError: Invalid regular expression flags`（不是产品功能失败）；`aed515…` 已把断言改成不歧义的 exact substring，平台 1058 项测试流程通过。所有失败 HEAD 仍可追溯，绝不删除或换用旧 PASS。

**版本治理**：#1077 仍叠加 #1060 的 Draft，不合并、不部署；Railway production 自动跟踪其他窗口的 Platform main，当前发现成功部署 main SHA `102319de812ce65682f0c6ccb1a930e10b4e22d4`，不是此 Draft。Eidos #203/204 等通用 owner 仍需独立协调。M01–M03 COMPLETE，M04/M05/M06 OPEN，**3/6**。无真实 Excel、授权 Job、两开户银行真实 fieldId/用途和三条主体身份的新增证据。

本节记录的精确成功 HEAD 为 `aed515…`；**如本文档自身增量追加生成了更新的 SHA，其新 CI 仍需单独核对**，不能自动迁移旧 PASS。


## Window-03 续跑｜真实工作表名称的来源与还原（2026-10-20）

- **直接核实源码（R）：** `apps/data-import/xlsx.ts` 原已解析 `xl/workbook.xml` 内第一张工作表的 `r:id` 并解析工作表 XML，但 `DataImportSourceV010` 原仅保存 name/headers/rows，因此旧 UI 无从得到真实 sheet name。此非模型视觉判断：是真实 Host 源数据契约缺失。
- **增量方案：** parser 在原选中的 sheet 标签读取 `name`，存为可选 `source.worksheetName`，`assertDataImportJobV010` 对来源类型、长度和换行校验并保留入库；Host 文件卡仅在来源为 XLSX 且确有此值时显示「工作表：真实名称 · 共 N 条记录 · M 列」。旧 Job/CSV/ROWS 无 worksheetName 时继续原有展示，绝不猜测客户工作表名。
- **源事实与判断：** #909 原型文件卡含工作表名是已读原文；从真实 `xl/workbook.xml` 获取并存入 Job 是本轮设计判断。不新增采集客户 Excel 的动作。行、列、Recipe 指纹（只使用 headers）、权限、显式提交均保持原契约。
- **验证任务：** synthetic XLSX workbook 真实首张 sheet 名 `Synthetic`，独立 Host 的 V3 视觉 workbook 的 `name` 为 `Visual review`，协议和 1280px/390px Chromium 都对精确文字断言。新 HEAD 的 CI/截图必须另行核对；此段不宣称完成或 Human 签收。总体 3/6，M04/M05/M06 OPEN。


## Window-03 续跑｜四列审核区标题语义（2026-10-20）

- **来源已读原文 R：** #909 HTML 在问题区后单列 section heading「字段对应关系」，并提示保留原有匹配结果；实际 Host 截图中表格上方只显示筛选/可见行数，缺少该层次。本轮未重新访问外部竞品资料。
- **实现判断：** Eidos 通用 reviewTable 可选 heading {title,description}，Platform 负责业务中文语义。Eidos 校验有界字段，HTML 进行内容转义；缺 heading 的所有既有 Eidos 表格完全沿用旧呈现。不会改变 mapping、源数据、服务权限或提交动作。
- **验证要求：** 协议测试校验 heading 存在及空标题拒绝；真实隔离 Host 1280/390 截图断言区标题。此项不等于全部原型视觉完成。M01–M03 DONE，M04–M06 OPEN，总进度 3/6。


## Window-03 续跑｜精简真实工作台首屏说明（2026-10-20）

- **截图已直接查看（R）：** 1280px/390px 真实 Host 合成截图（run 39424881538 artifact 12265218415）显示顶部描述仍是超长操作培训段落，尤其在 390px 占用首屏大量高度，显著不同于 #909 原型简洁的一行说明。原型 HTML 原文之前已读，不重做外站研究。
- **落地判断：** `apps/data-import/page.ts` 将页面首屏 description 按 RECIPE／EC 建议／常规三类缩短为事实可信的概述；详细保存与预检约束保留在通用 reviewTask.helpText、Host 动作与用户可检查源证据中。不得凭简短提示暗示自动保存或导入已成功。
- **测试：** 新增协议断言、1280/390 Chromium 真实 DOM 精确文案断言。只有精确 HEAD 绿灯并重新取证，才能记为工程完成。M06 Human OPEN，M04/M05 客户业务 OPEN，总进度 3/6。


## M06 Window-03 增量｜Workbench 两阶段视觉和问题计数（2026-10-20）

- 原始参考：#909 的原型源代码已读原文，其两阶段顶部 stepper 为带完成勾号和数字的步骤，以及问题标题旁随问题数显示的状态徽标。上次 #1077 HEAD `32e7b396...` 的 Chromium 1280px 和 390px PNG 已直接查看（R）；当时真实 Host 是两颗小圆点，无状态徽标。
- 采用：只改变 Eidos opt-in workbench 的展示，用有界、可访问状态的两阶段视觉；以真实 issues 列表长度派生数量，Platform 仅提供本地化后缀。原因：让用户在第一屏识别进度和剩余决策，不改变现有真实数据和保存/提交/权限。
- 排除：不在 Platform 写死3、不为原型添加虚构按钮、不将独立卡片恢复为单列表；#204 owner 的三张问题卡仍为未决视觉冲突，需要与 Human 签收对齐，不能自行覆盖。
- 检验：协议断言状态/空后缀拒绝，真实 Host Chromium 在 1280px 与390px 核对2个步骤、当前步 aria-current、完成勾号以及“3 项待处理”，新 artifact 实际对比。CI 不能替代 Human 签收。
- 边界：M01–M03完成，M04/M05/M06 OPEN，总体3/6；#1077 Draft，不合并不部署，不触碰客户 Excel、PA05、EOG 或 Railway。


## M06 Window-03 自动续跑 #02｜四列表工具栏与来源保护底注（2026-10-20）

- **来源等级 R／已读原文：** PR #909 的 `BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html` 中 mappingpanel 的表头工具栏同时显示“优先显示需要确认和新增的字段”、当前筛选计数、筛选器和“修改字段对应关系不会更改原 Excel 文件”，表格底部显式告知系统字段排他对应与原来源保留。真实 Host 上一版截图 `v3-prototype-parity-submit-desktop.png` 只显示 6/22 与筛选选择器、缺少这些可信解释。**原型用7/22，Host 实际为6/22，因此绝不可复制静态7。**
- **采用方案（设计判断）：** Eidos `reviewTable` 增加可选的 `toolbarHint`、`footnote` 两个纯展示文本，由 Platform 提供实际简短本地化业务语义；Eidos 校验有界非空、转义 HTML，计数仍从现有 `reviewGroups`／Host 筛选状态实时计算。不将安全底注误写成自动保存保证。不改任何字段值、Recipe、Host 路由／command、原始 XLSX。
- **未采用：** 硬编码“7/22”、改动源表数据、为原型自动保存文案绕开 Host 显式保存、直接套用 #909 的案例字段名。#204 独立问题卡仍保留，连续问题框冲突由 Human 决策。
- **验证目标：** desktop 1280px/phone 390px synthetic isolation，核对真实筛选 6/22→22/22→6/22、指导文本、来源保留底注且不会改动 Host 数据，新增协议测试验证空和超长说明拒绝。具体 CI 与截图须由本 HEAD 实际出具，不预填 PASS。
- **范围与状态：** #1077 → #1060 stacked Draft，不改 main 或生产。M01–M03 DONE，M04/M05/M06 OPEN，总进度3/6，Human视觉签收仍OPEN。


## M06 Window-03 自动续跑 #02（续）｜AI 自动匹配从底栏移入字段决策工具栏（2026-10-20）

- **已读原型事实（R）：** #909 mapping 核对底栏为返回文件／恢复初始选择／预检查并继续三项；#1077 的隔离 Host `v3-prototype-parity-submit-desktop.png` 底栏为这三类动作外加“AI 自动匹配”，造成视觉和心智模型不一致。
- **业务不变量：** AI 自动匹配是用户明确要求的功能，不能删除，也不能变成模拟按钮。Host 现已有实际 Agent 动作 `ai-auto-map`，携带 `agentCapability=agent.personal`、`importJobId` 和真实上下文；Eidos 页控制器查找 `[data-eidos-agent-action]` 绑定实际事件。
- **采用设计（判断）：** Eidos `reviewTable.agentActionId` 仅引用原有 agent action；解析契约严格确认 ID 有界且必须是已声明的 Agent action。渲染在同一字段筛选工具栏，底栏只保留原有真实返回、重置、保存并预检；事件仍被页控制器原事件绑定发现，不能复制或发明 Host 动作。Eidos 仍通用，不在基础控件内写 BEX 特有文案。
- **不采用：** 删除 AI、在 footer 保留重复按钮、将 AI 自动触发或仅写一个没有事件的图标。桌面和 390px 浏览器断言同一 action id 恰有一个按钮、footer 不再包含 AI、移动端可触高度至少44px；不在合成测试里自动触发 Agent 请求以防意外影响独立网络环境。
- **当前状态：** 此文档记录实施意图；是否 CI PASS 必须单独核对新 commit 精确 HEAD，Human signoff 未完成。#204 独立问题卡仍是待决，与本改动不冲突。


## M06 Window-03 自动续跑 #03｜问题卡真正关联原始错误行（2026-10-20）

- **已读源码 R：** #909 原型“3 条记录缺少主体类型”提供“查看记录”并展开具体错误行；#1077 真实 Host 此前“查看记录”仅触发通用 `data-eidos-form-task-focus`，定位来源字段的 select，无法直接进入对应的逐行更正页面。现有 `dataImportRowCorrectRouteV010` 及 `dataImportCorrectableSourceV010` 已提供明确路由与可修正性校验；review 页同样使用此校验生成改正按钮。
- **本轮采用（实施判断）：** Eidos 通用 reviewTask issue 可选 `relatedRoutes:[{label,route}]`，1–8、唯一、非空内部路由、HTML 安全转义，由既有 `data-eidos-context-route` Host delegated navigation 执行。仅当 `dryRun` 实际包含缺失主体类型的行且每条 row 的真实 source column、schema 和 Host correction policy 校验全部通过时，Platform 提供链接；显示原始实际行数，例如 165、169、172。点击“查看记录”只展开链接，再明确点击第 N 行进入真实编辑表单；不会自动保存或提交。若任何行不可修正，继续原字段定位，不会显示假的记录入口。
- **拒绝方案：** 写死 #909 行号、在浏览器端绕过 Host 权限、自动将供应商主体类型设为企业、自动跳到第一条并静默提交、使用模拟内嵌表格复制业务对象。#204 独立问题卡整体保留，卡片与连续问题框冲突仍待 Human 签收。
- **测试计划：** 协议校验正常内路由及拒绝外部／重复路径；隔离真实 Host 的 1280px 和 390px 点击展开三条来源记录，分别导航至 row165、row169 的真实 `evo-data-import.row-correct`，核对真实行号后安全返回，新增 `v3-issue-real-row-links-desktop.png` 与 `v3-issue-real-row-links-phone.png`。无真实客户 Excel，全部 synthetic。
- **进度边界：** 本段是本轮提交前研究记录，不事先宣称 CI PASS；M01–M03 DONE，M04/M05/M06 OPEN，总体仍 3/6。Human 视觉签收 OPEN，勿将 synthetic Host 视为客户业务确认。


## M06 Window-03 自动续跑 #04｜把字段处理动作从面包屑移回字段审核区（2026-10-20）

- **已经读取的事实 R**：#909 原型（原 HTML 和桌面 1280 / 手机 390 的截图）上方面包屑只表达当前任务路径；真实 Host 在 #1077 `b8f83d4...` 桌面截图中出现「供应商列表 › 数据导入 › 字段映射 › 集中审核 6 个未匹配字段 › 创建企业扩展字段」，其中最后两项其实是业务动作，不是上级页面。390px 手机上折叠导航把「集中审核…」显示为左上返回目标，造成信息架构误导；这些工具功能本身必须保留。
- **采用的设计判断**：Platform 将两个有权限的真实辅助工作流（集中审核/创建企业扩展字段），或映射完成后的批次固定值复核，收敛为 `reviewTable.utilityNavigation`，以 Eidos 通用原生 `details` 工具菜单显示在「字段对应关系」标题边。仍走已存在的 `data-eidos-context-route` Host 委派导航，不新增网络动作、不改真实 source/fieldId、权限、Recipe 与审核提交。面包屑只保留目的业务工作台、数据导入、字段映射的真实层级。菜单标签「字段处理工具」由 Platform 提供，Eidos 负责安全校验与转义、390px 触控。
- **为何不采用**：不删除集中审核/扩展字段入口；不继续放在面包屑；不在每个字段行重复“批量审核”；不用 fake 路由、不将普通 URL 变成不受 Host 管理的外部链接。
- **验证要求**：协议检查真实工具路由和隐藏的无权限情况，拒绝重复/不合法路由；真实 Host desktop 1280/phone 390 打开字段处理菜单（新增 `v3-secondary-field-tools-*.png`），确认功能仍可点击进入集中审核页、菜单不会横向溢出，原来字段映射/预检/返回/Reset 保持可用。须以精确 HEAD CI/Chromium 为准，不预称成功。
- **仓库及状态**：#1077→#1060 stacked Draft，保持 Platform/Eidos 职责边界；Eidos #204 三类独立编号问题卡原样保留，视觉争议继续等待 Human；M01–M03 done，M04/M05/M06 open，总进度3/6。PA Allow 的已知 `MOCK_MODEL_CALL_NOT_SEEN` 属独立门禁，不擅自修改。


### M06 自动续跑 #04｜CI 触发确认与不变量复核

在实现提交 `b29b58d40723917f098debe93d59988a13c3b471` 后，GitHub Actions 起初只记录 Project Continuity CI 的 push 运行；尚未出现该 HEAD 的 Platform CI / BEX Real Host Chromium 的 pull_request 工作流。因此不允许沿用上一轮 13/14 或 5/5 验证结论。已核查 BEX 浏览器工作流 `.github/workflows/bex01-real-browser.yml` 监听 `pull_request` 对 `apps/data-import/**`、`vendor/eidos/src/design-language/productive-workbench-css.ts`、`tests/bex01/**` 的变更，本轮确有匹配文件；问题属于 CI 事件触发/可见性，原因未确认。本次用 GitHub Contents API 更新该交接文档，继续观察同步事件；无论结果如何都不得把未执行的门禁写成 PASS，也不可以绕过验证合并。
