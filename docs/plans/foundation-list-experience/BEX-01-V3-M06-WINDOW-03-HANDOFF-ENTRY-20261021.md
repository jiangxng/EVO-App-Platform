# BEX-01 V3｜M06 高保真审核工作台 Window 03 简短交接入口（2026-10-21）

> **阅读顺序：**本入口 → [Window 03 详细研究资料与决策索引](BEX-01-V3-M06-WINDOW-03-RESEARCH-DECISION-REFERENCE-INDEX-20261021.md) → [#1077 增量源码与设计记录](https://github.com/jiangxng/EVO-App-Platform/pull/1077) → 按需查看 [#1075 Window 02](https://github.com/jiangxng/EVO-App-Platform/pull/1075)、[#1058 M06 Window 01](https://github.com/jiangxng/EVO-App-Platform/pull/1058) 和 [#909 原型](https://github.com/jiangxng/EVO-App-Platform/pull/909)。不同资料是不同日期快照，不能混作当前 main。**不要覆盖旧交接文件。**
> **文档保存范围：**仅本独立文档分支 `docs/bex01-v3-m06-window03-research-handoff-20261021`，从 Platform `main@ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9` 建立；不改 #1077/#1060 功能分支，不动 Eidos owner PR、生产 Railway、PA05/EOG 或 `project.status.json`。此文档 PR 即使合并也不代表产品 Human 签收。

## 1. 任务与不可改变的要求

实现 EVO-App-Platform / BEX-01 **供应商导入 V3 高保真审核工作台**，以 #909 的精确 HTML 原型及桌面/手机截图为最高视觉参照，目标 **100% 高保真且真实可用**。先逐项消除 1280px/390px 真实 Host 视觉与交互差距、完成 **用户 Human 视觉签收**；未签收前**不得开始真实客户 XLSX 的 M04 业务验收、不得进行 M05 真实客户供应商导入提交**。

- **职责分界**：Eidos 仅实现可复用设计语言、控件、布局、响应式、通用交互；Platform 负责业务字段、Import Job/Recipe、EVO Host 内部路由、权限、预检、提交、审计。
- **双同名开户银行**不按列表顺序、文字相似度、样本或 LLM 建议猜 fieldId；必须按两个真实字段用途由 Human 选择并预检。`SUPPLIER` 是交易角色，**不是** `ORGANIZATION` 身份证据；三条主体类型缺失记录逐条由真实客户证据确认。
- **真实 Host 动作**：自动字段匹配只是 Agent 入口，不能用截图或测试按钮冒充成功；字段排他、原文件保留、显式保存与预检、授权导入、行级更正安全规则保持原样。恢复初始选择只恢复本次未保存的前端选择。
- **并行隔离**：#1077 是叠加 #1060 的 Draft，不推 main、不擅自 rebase/合并/部署；Railway 继续 main，不切 release；不改 `project.status.json`，不影响 Eidos #202/#203/#204、PA05、插件治理或 EOG。
- **进度固定口径**：M01–M03 工程完成，M04 真实客户数据／字段身份核验 OPEN，M05 真实业务导入 OPEN，M06 高保真 Human 签收 OPEN；**3/6**。CI 与 synthetic Chromium PASS 不能代替 Human、客户或生产验收。

## 2. 精确工作快照（本窗口工作发生于 2026-10-20；2026-10-21 重新核对元数据）

| 对象 | 正确快照 | 解释 |
| --- | --- | --- |
| [#1077 实施 PR](https://github.com/jiangxng/EVO-App-Platform/pull/1077) | `feat/bex01-v3-m06-file-footer-parity-20261020` HEAD `84939fbd01857c8c41172308731c6b687041b065` | Open、Draft，base 是 #1060 分支；**未合并** |
| [#1060 上游实施 PR](https://github.com/jiangxng/EVO-App-Platform/pull/1060) | `feat/bex01-v3-real-fidelity-clean-mainline-20261020` HEAD `0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23` | Open、Draft，尚未进入 main |
| Platform main | `ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9` | 2026-10-21 查询；不把它当作已含 V3 Draft |
| Railway production | 部署 SUCCESS、branch `main`、commit 同上 | **没有部署 #1077** |
| [Eidos #204](https://github.com/jiangxng/eidos/pull/204) | HEAD `199feb9addfa8de1ae930097c56f528ba1b86ab3` | Open、Draft，独立编号卡默认方案；未修改 owner PR |
| [Eidos #202](https://github.com/jiangxng/eidos/pull/202) / [#203](https://github.com/jiangxng/eidos/pull/203) | 各自 Open，#203 Draft | 通用路由/工作台相关的并行工作，另窗维护 |
| [#1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058) / [#1075](https://github.com/jiangxng/EVO-App-Platform/pull/1075) | **均未合并 main** | 旧交接仍在各自 PR HEAD；不要因为 main 404 而认定文件丢失 |
| [最终 GitHub Actions](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39440257993) | 最终 `84939fbd…`，**14/14 PR workflows SUCCESS**；Real Host Chromium 5/5 PASS、0 browser errors | 仅 synthetic isolated Host，Human 签收 OPEN |

## 3. 本窗口已经完成的功能与设计收敛

1. **来源文件可信信息**：真实 XLSX 解析并保留首个已选工作表 `worksheetName`，文件卡呈现 XLSX 图标、真实文件名/工作表/行列数和读取成功语义状态；旧 Job/CSV 正常兼容。没有真实工作表名时不杜撰原型示例。
2. **审核区层级**：两阶段已完成/当前步骤、真实问题计数、指标卡 warning/positive、四列表前「字段对应关系」标题、真实可见行计数及筛选提示和来源安全底注；页面顶部文案更精简。
3. **真实可操作的底部流程**：「返回文件」使用现有 Host 内部导航；「恢复初始选择」仅前端未保存状态；「保存映射并预检查」保持显式业务提交。AI 自动匹配保留原 `ai-auto-map` Agent 动作，移至映射工具栏而非在底栏重复。
4. **异常记录处理**：3 条实际主体类型缺失记录可展开真实行号，逐行经现有 Host 更正授权检查后打开既有更正页；与字段映射、开户银行双候选、系统编码分别为不同人工决定。
5. **信息架构**：将集中审核未匹配字段、创建企业扩展字段、批次固定值复核从冗长/误导的面包屑移入「字段处理工具」菜单，真实路由和授权条件保持。
6. **本窗口最后一项视觉差异**：BEX 审核页可选 `reviewTask.issuesLayout="connected"`，让三个**独立编号和真实操作**的异常行共用一个暖色外框及分隔线，逼近 #909；未启用时 Eidos #204 的独立卡片仍为默认。此为**可逆的项目实现判断**，不是 Eidos owner 或用户最终 Human 签收。

## 4. 最重要的新证据及未决

**本窗口最终真实 Host**：[run 39440257993](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39440257993) / [artifact 12273680796](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39440257993/artifacts/12273680796)。ZIP 在本聊天已下载并直接打开：`v3-connected-issues-desktop.png`（1280px）、`v3-connected-issues-phone.png`（390px）、`v3-prototype-parity-submit-desktop.png`；report 显示 `actualHost=true`、5/5 PASS、`browserErrors=[]`。**这不是生产客户数据和设备实机证明。**

**核心未决：**#909 与 #204 的产品默认风格最终选择仍需用户 Human 逐图判断；四列表密度、全页高度、按钮位置、移动端完整滚动/真实设备等仍需整理为可视验收清单。真实客户源文件 `往来账户2026_10_08_10_15_23.xlsx`、授权 Import Job、两个同名银行真实 fieldId/用途、三条实际主体身份目前未获证据；不能代替其进行验收。先前独立 PA Allow 偶发 `MOCK_MODEL_CALL_NOT_SEEN`，最终 HEAD 通过，根因仍未正式关闭，勿自行改 PA。

## 5. 新窗口优先执行顺序

1. 先用 GitHub **精确 HEAD** 读取本页、详细索引、[本窗口增量研究](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-03-INCREMENTAL-RESEARCH-20261020.md)、[设计审查](https://github.com/jiangxng/EVO-App-Platform/blob/84939fbd01857c8c41172308731c6b687041b065/docs/ui-design-reviews/bex01-v3-m06-file-footer-parity-20261020.md)，恢复已调查资料；不要重做已有研究。
2. 重新查询 Platform main、#1077、#1060、Eidos #202/#203/#204、PR CI、Railway，关注 base 分支落后和并行修改。除非另得明确批准，不动并行分支、绝不直接 push main。
3. 以 #909 原型 [固定 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) 和原型 artifact 的 1280px/手机截图为基准，逐屏与当前 `84939fbd…` 的真实 Host 截图对照，优先核查**四列映射区的实际密度、完整滚动页、问题展开、底部操作和 390px 使用性**。
4. 将剩余差异分为 **Eidos 通用设计缺陷／Platform 业务组合问题／Human 产品选择**，使用 #1077 的独立后续分支/PR 方式消除可确认项，不覆盖 #204 owner 默认方案；不要为了数量重复建 PR。
5. 每一精确 HEAD 运行协议、Platform CI、BEX Real Host 1280/390 Chromium，下载/查看 PNG 和 `report.json`，保存 artifact 路径、失败→修复链及安全约束；除非真实 100% 视觉签收，不将 M06 置 DONE。
6. M06 Human 100% 签收后**再**核对 M04 客户真 XLSX/Job 和 bank/subject 身份，才准备 M05 真正业务导入；进度保持 3/6 直到门禁实际完成。

## 6. 本交接包的持久保存与待补遗产

- 本包只有两份新 Markdown，位于 `docs/plans/foundation-list-experience/`；详细索引列出原始网址、查阅等级、方案比较、CI/截图、模块/测试和未归档资料。
- 历史外站研究 URL/级别在 #1058/#1075、main 的 M04/V3 研究索引中；本窗口没有重访外站，不把 H（历史继承）写成 R（本窗口读原文）。
- 原型及 Chromium 原始 PNG 的**GitHub Actions artifacts 可到期**；交接保留 artifact ID、run、ZIP 内部截图路径和摘要。目前未把这些 PNG 另做长期版本化附件保存到文档分支；后续如需永久保全须明确上传，不能依赖临时 sandbox 路径。
- 真实客户 XLSX、授权 Job 响应、银行字段证据、三条主体类型证据、真实设备测试、用户签收文件**尚未保存／尚未取得**，具体以详细索引 §「未归档」为准。

**本交接包为文档归档，不是功能上线或签收文件。**
