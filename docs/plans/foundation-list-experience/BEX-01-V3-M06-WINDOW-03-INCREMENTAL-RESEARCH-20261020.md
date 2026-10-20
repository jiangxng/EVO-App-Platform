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
