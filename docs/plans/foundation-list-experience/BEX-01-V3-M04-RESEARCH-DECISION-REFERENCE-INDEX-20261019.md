# BEX-01 V3｜本窗口 M03–M04 研究资料与决策详细参考索引（2026-10-19）

> **与[简短交接入口](BEX-01-V3-M04-WINDOW-HANDOFF-ENTRY-20261019.md)配套。** 本页仅补足本聊天自动续跑 #01–#05 的**直接研究、失败→修复→验收事实、方案比较、外部资料传承、截图/附件位置及后续模块落点**；不覆盖已有 [V3 2026-10-19 总研究索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) §1–§15、[2026-10-15 UI 研究](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[原业务研究](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[#909 分支高保真研究](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)。以上资料正文与 R01–R14、CN01–CN12 等编号原封保留；旧节标题有两个“§12”，应以**标题和链接**定位而非只以序号定位。

**核对时点：2026-10-19。** 本交接文档独立起点 Platform `main@9b80babdc31fafbcb98f043fde01a6f388c7ce03`、Railway production / Ledger Configurator 同 SHA **SUCCESS**；之前逐个 PR 的合并 SHA 见 §2–§3。后续 `main` 可能继续推进，任何 HEAD/CI/部署判断都须重读 GitHub/Railway。

## 1. 证据等级、工作目标和不能越界的结论

- **R（本窗口直接读原文/原始日志）：** GitHub PR/commit/Actions 记录、原始 TypeScript/MJS/Python 源码与真实代码的 GitHub 页面；Railway Connector 部署、健康状态。网址指向 PR、精确 SHA blob 或 Actions run。这些可以证明静态实现及隔离 CI，**不能证明客户生产 Job 已实际验收**。
- **H-A（历史已读外站正文）、H-B（历史仅取可见段落/章节）、H-C（历史仅搜索摘要/题录/图片搜索结果）：** 阅读发生于 **2026-10-14～15**，保存于旧 GitHub 参考索引；本次**没有重新打开那些外站全文**。表中“关键发现”来自已有研究记录；本次读取的是**GitHub 旧索引原文**，不是外部网站新检索。
- **D（待取得/待验证）：** 客户原始 `往来账户2026_10_08_10_15_23.xlsx`、当前受权 Import Job、两项“开户银行”真实技术字段 ID/业务用途、三条真实主体身份、用户原始四图二进制永久地址、Railway 已登录真实业务全页与 Human 最终签收。此前文件库 Excel 列表只找到无关 `香港一件代发.xlsx`，未找到该客户原文件；**本次不把旧 Job 字符串当作读到了内容**。
- **源事实与项目判断分开：** 源事实是代码如何运行、CI 报什么错、文档历史说什么；“因此必须人工确认同名字段”“不得扩展 UI”是用户已决定的 EVO 产品策略，非 NN/g/飞书/微软官方宣称。

目标不变：原 V3 高保真供应商导入工作台；保持 **M01–M06 六个固定里程碑**，本窗口只修复和验证 M03/M04 的既定门禁。任何通过的合成测试只关闭自己的工程子项，不升级客户业务签收。

## 2. 本窗口直接取得的 GitHub/Railway 网络资料（R，2026-10-19）

| 编号／标题与原始 URL | 查阅日期、阅读范围与等级 | 关键发现（源事实） | 对应模块、具体用途及限制 |
| --- | --- | --- | --- |
| R-M03-1 [#1028：批次旧页列身份诊断及修复](https://github.com/jiangxng/EVO-App-Platform/pull/1028)、[原 RED Actions run](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39207709249) | 10-19 **R：真实源码/协议测试/CI 日志** | 打开时 A/B 未匹配，另一命令映射 A 后，旧页 `choice_0` 被错误理解为 B、结果仍 `ok:true`；旧 RED 1017 pass/1 fail/1 skip。经 source revision + Host 持久化再验后回归绿灯。 | `apps/object-extension/batch-page.ts`、`batch-draft.ts`、`actions.ts`、`manager/server.ts` 与 `tests/protocol/bex01-v3-stale-review-source-identity.test.mjs`。证明确定性隔离动作缺口，**不是生产事故**。 |
| R-M03-2 [#999：M03 草稿正式合并](https://github.com/jiangxng/EVO-App-Platform/pull/999)、[最终 Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39209864034)、[隔离 Host Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39209863863) | 10-19 **R：源码、PR、精确 SHA CI、Railway** | #1028 先合入 #999（`fa5278c61acdd62cd1eb039055a8c4a9f1c3c032`）；#999 经与当时 main 无重叠合并、所有适用 CI PASS 后入 main `bdd5ee3b39465bd025a100582e40e7113653d041`，Railway 当时同 SHA SUCCESS。当前重查工作流明细显示该 HEAD 48 success / 1 skipped（分支清理条件跳过），**适用测试全部通过**。 | 不要按旧入口的“#999 OPEN”重复开发草稿；已完成并部署 M03 工程。仍需真实企业账号授权/重新登录业务级验收。 |
| R-M03-3 [#1032：M03 总研究索引归档](https://github.com/jiangxng/EVO-App-Platform/pull/1032)、[八域 UX 审查](https://github.com/jiangxng/EVO-App-Platform/blob/bdd5ee3b39465bd025a100582e40e7113653d041/docs/ui-design-reviews/bex01-v3-m03-stale-review-source-rejection-20261019.md) | 10-19 **R：文档源码/合并记录** | #1032 合并 `7238931ba6a223eee41f0d16ad8360e1e84d48b9`，向旧 [V3 总索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) §13 追加最终 SHA、CI、部署和六行表。 | 当前手册把旧 §12 未完成状态解释为历史快照，不覆盖旧记录。 |
| R-M04-1 [#1033：确定性同名银行防误选](https://github.com/jiangxng/EVO-App-Platform/pull/1033)、[原 RED CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211226617)、[最终 CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211788276) | 10-19 **R：`service.ts` 源码、协议测试与 CI** | 旧 `matches.find(!usedTargets.has)` 将同名“开户银行”的第一/剩余目标当确定性匹配；新合成回归 2 RED；修复后仅“唯一别名或明确来源 technical fieldId”可自动建初始 mapping。PR 入 main `9654da1736f69bf04235ee42350aad9e384ab5ab`。 | `apps/data-import/service.ts::suggestDataImportMappingV010`，`tests/protocol/bex01-v3-m04-ambiguous-bank-targets.test.mjs`；二次导入历史 Human Recipe 不在此处重定义。 |
| R-M04-2 [#1035：实际 Host XLSX Stage + 同名候选证据](https://github.com/jiangxng/EVO-App-Platform/pull/1035)、[Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39212624641) | 10-19 **R：生成 172×22 XLSX 的测试/Host Action 和 CI** | 原 Stage 命令可保留全部合成 Excel 源行；两个同名不同 ID/用途候选不会被初始选择；真实 `/map` reviewGroup 显示 attention 并展开字段用途；未 dry-run/建 schema/commit。PR 入 main `0cb319e32f17f87b5cd18fe9f4fa5e107bbad28a`。 | `tests/protocol/bex01-v3-m04-real-stage-ambiguous-bank.test.mjs`、`tools/bex01/synthetic-v3-xlsx.mjs`、`apps/data-import/page.ts`。**172×22、165/169/172 只是合成样本**。 |
| R-M04-3 [#1037：Experience Compiler 不得预选同名字段](https://github.com/jiangxng/EVO-App-Platform/pull/1037)、[原 RED CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39213354669)、[最终 Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39213930853)、[真实隔离 Host Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39213930821) | 10-19 **R：`actions.ts` Stage 源码、合成经验服务、CI 日志** | EC 建议即使标 `advisoryOnly:true`，旧路径仍因 0.99 置信度写 `job.mapping`，新增用例唯一 RED（1021 pass/1 fail/1 skip）；修复后同名歧义且非精确 ID 的 EC 不预选，唯一历史建议仍保留。PR 入 main `65e970321017bbb022efad9a6ff1d2d9809a407a`。 | `apps/data-import/actions.ts::data-import.stage-file`、`tests/protocol/bex01-v3-m04-ec-bank-advisory.test.mjs`；**“EC advisory”不等于“Human 已批准”**，但先前确实预填了权威 mapping。 |
| R-M04-4 [#1039：已确认银行 ID 的 Recipe 复用](https://github.com/jiangxng/EVO-App-Platform/pull/1039)、[Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39214905232) | 10-19 **R：隔离企业字段/成功 dry-run/第二次 Stage 回归** | 初次同名不猜；合成 Human 明确选定 `test.bank.settlement` 后通过预检，Recipe 保存字段 ID；同结构二次导入 `mappingOrigin=RECIPE`、`appliedRecipeId` 一致、跳过 EC 推荐并重新 dry-run，仍无 supplier commit。PR 入 main `3168a7e39f21fe1de30273fce5a4bfd04116c6ff`；主要四个必需门禁 4/4 PASS。 | `tests/protocol/bex01-v3-m04-human-confirmed-bank-recipe.test.mjs`、`apps/data-import/service.ts`、`recipe.ts`。**只证明合成真实服务链路，不代表客户已有合法 Recipe**。 |
| R-M04-5 [真实映射页源码](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/apps/data-import/page.ts)、[批次审核源码](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/apps/object-extension/batch-page.ts)、[真实 Host 挂载](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/manager/server.ts) | 10-19 **R：直接读取源码相关段落** | 真实 Host 批次页已将企业 `resolvedDescription` 传给候选用途；真实 `/map` 展示 `fieldId`、用途、关注状态。另一个 Host 草稿 helper 缺少 description 但它不是实际页面展示入口。 | 纠正本轮“用途说明可能丢失”的初步误判；**没有为此新建修复 PR**。不要把已具备的能力重新实现一遍。 |
| R-M04-6 [实际二次导入复用逻辑](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/apps/data-import/service.ts)、[Recipe 存储/指纹](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/apps/data-import/recipe.ts)、[契约](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/apps/data-import/types.ts) | 10-19 **R：源码与 `tests/protocol/data-import-recipe.test.mjs`** | Recipe 由 Human 确认且 dry-run 成功后可保存；同企业、目标/用途、结构、Schema 匹配时 `origin=RECIPE`；若 Schema 漂移仅回退可审核历史建议，不代表自动确认；commit 独立。 | 不因 M04 防误选修复而禁止二次导入。Schema digest 忽略显示用 `resolvedDescription`，但仍核真实语义字段定义；不能自动推断客户现有 schema。 |
| R-BASE [本仓库交接遗产总索引](https://github.com/jiangxng/EVO-App-Platform/blob/7238931ba6a223eee41f0d16ad8360e1e84d48b9/docs/plans/foundation-list-experience/BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[旧简短入口](BEX-01-V3-WINDOW-HANDOFF-ENTRY-20261019.md) | 10-19 **R：直接读取 GitHub Markdown** | 总索引 §2–§5 已保存初始 R/CN/M/V/EX 来源，§4 保留 4 截图文字观察，§12/13 记录草稿，§14/15 记录银行两道安全缺口；原简短入口反映更早 #999 OPEN 时点。 | 下窗口以本页最新 M03–M04 状态为准，旧索引是历史证据并非故障；不回写覆盖。 |

**注意 CI 统计口径：** 各 PR 在某次核验时会有“5/5 必需检查 PASS”“47/47 当时可见工作流 PASS”等不同数字；GitHub 事后可能增加条件跳过的自动清理工作流。本次对某些最终 HEAD 复核还看到 **success + skipped（`BEX-01 Retire Verified Process Branches`）**。应按精确 HEAD、**适用工作流全绿，条件跳过单列**，不要把 skipped 宣称为失败，也不要把先前数字无条件累加。

## 3. 仅继承的外部网络研究索引（2026-10-14～15；本窗口没有外站重访）

下表“原始网址”和“当时究竟读到什么”由 [2026-10-19 总索引 §3](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) 和 [2026-10-15 全量旧源索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)继承。日期为**历史阅读日期**；这里直接读取的是 GitHub 中的记录，**不是 2026-10-19 重新打开外部原文**。

| 历史编号／原始标题与网址 | 2026-10 历史查阅日期及确切层级 | 原研究保存的关键发现 | EVO 当前采用用途与边界 |
| --- | --- | --- | --- |
| CN01 [飞书 Aily 数据表](https://www.feishu.cn/content/vl1lf3v5) | 10-15 **H-A 相关原文** | 列匹配建议、人工修改、错误反馈 | 建议和批准分离；不声称复制其具体算法 |
| CN02 [飞书多维表格应用模式](https://www.feishu.cn/content/article/7578812241772924111) | 10-15 **H-A 相关原文** | 基础表与业务工作界面分层 | Platform Job/Schema 与面向角色的 V3 工作台分层 |
| CN03 [飞书响应式设计指南](https://open.feishu.cn/document/design-specification/responsive-design/responsive-design-guidelines?lang=zh-CN) | 10-15 **H-B 仅章节/段落** | 设备间布局转换 | Eidos 桌面四列→移动卡片；未通读/不复制断点 |
| CN04 [Lark Visual specifications](https://open.larksuite.com/document/tools-and-resources/design-specification/gadget-design-specification/visual-specifications/style) | 10-15 **H-B 段落** | 中性色、功能状态颜色分工 | 克制的状态层级，不复制品牌样式 |
| CN05 [飞书应用引擎页面设计原则](https://ae.feishu.cn/hc/zh-CN/articles/768591170201) | 10-15 **H-B 可见段落** | 布局骨架先于细节 | 先按工作任务组织批次/问题/下一步 |
| CN06 [Lark Message Card 设计规范](https://open.feishu.cn/document/ukTMukTMukTM/ugDOwYjL4gDM24CO4AjN) | 10-15 **H-B 正文摘取** | 模块/提示层级 | 状态就地；不是要用消息卡取代工作台 |
| CN07 [飞书抽屉组件](https://open.feishu.cn/document/design-specification/component----feedback/drawer) | 10-15 **H-B 段落/直开不完整** | 扩展证据在上下文附近打开 | 银行候选用途就地展开；不限于抽屉控件 |
| CN08 [简道云 CRM 导入关键字段](https://hc.jiandaoyun.com/solution/13147) | 10-15 **H-C 搜索摘要** | 来源预览→匹配→结果线索 | 只作中文业务词汇线索；未读完整正文 |
| CN09 [简道云导入关联数据](https://hc.jiandaoyun.com/doc/18609) | 10-15 **H-C 搜索摘要** | 关联歧义需要处理的线索 | 不得因此宣称关联匹配算法与 EVO bank ID 等价 |
| CN10 [伙伴云 Excel 导入](https://hc.huoban.com/tables/8a9a/974b) | 10-15 **H-A 网页相关内容** | 表头/选择/来源样本相邻 | 原 Excel 与候选就地核对；未验证产品最新版本 |
| CN11 [畅捷通字段匹配截图](https://service.static.chanjet.com/kj_java/20230505/2f079522361a4f18912a4519d691216b3.2-7.png) | 10-15 **H-C 仅图片搜索结果** | 中文字段已匹配/未匹配示意 | 用词参考，不作为已测软件功能 |
| CN12 [WPS 文档官网](https://docs.wps.cn/welcome) | 10-15 **H-C 仅官网摘要** | 中文办公平台用语 | 没有验证任何其自动映射功能 |
| M01 [NN/g Recognition Rather Than Recall](https://www.nngroup.com/articles/recognition-and-recall/) | 10-15 **H-A 正文** | 展示已做选择减少回忆 | Job、Recipe、草稿重新进入展示已有决定 |
| M02 [Cowan, The Magical Number 4 in Short-Term Memory](https://pubmed.ncbi.nlm.nih.gov/11515286/) | 10-15 **H-C 仅题录/摘要** | 人类短期记忆有限 | 不让用户跨 22 列记忆；**不是最多 4 按钮的规则** |
| M03 [W3C COGA Making Content Usable](https://www.w3.org/TR/coga-usable/) | 10-15 **H-A §4.5/4.6.2/4.6.3/4.7.5** | 进度、减少重复、纠错与恢复 | 持久草稿、错误可定位；COGA Note 非 WCAG 新强制条款 |
| M04 [NN/g Designing for Long Waits and Interruptions](https://www.nngroup.com/articles/designing-for-waits-and-interruptions/) | 10-15 **H-A 相关正文** | 中断后要继续位置 | M03 Host 草稿与重入，不能用 HTML localStorage 冒充 |
| M05 [NN/g Usability for Older Adults](https://www.nngroup.com/articles/usability-for-senior-citizens/) | 10-15 **H-A 相关正文** | 小控件/技术词的障碍 | 清晰中文与可操作目标；无年龄刻板假设 |
| M06 [NN/g Interaction Cost](https://www.nngroup.com/articles/interaction-cost-definition/) | 10-15 **H-A 正文** | 阅读、切换、记忆也是成本 | 证据贴近行；保留必要受控审批 |
| V02 [NN/g Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) | 10-15 **H-A 正文** | 扫描先后依赖层级 | 文件→批次→异常→映射→确认 |
| V03 [NN/g Proximity Principle](https://www.nngroup.com/articles/gestalt-proximity/) | 10-15 **H-A 正文** | 近邻使信息归组 | 来源例值、字段用途、行状态同处 |
| V08 [NN/g Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) | 10-15 **H-A 正文** | 美感能改善感知但不能代替正确性 | 视觉满意不能等于真实数据签收 |
| V11 [USWDS Table](https://designsystem.digital.gov/components/table/) | 10-15 **H-A 官方正文** | 结构化表格与小屏适配 | 桌面四列、手机不丢字段及可审查性 |
| V13–V15 [W3C 文本对比](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)、[非文本对比](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)、[不只靠颜色](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color) | 10-15 **H-A 具体解释章节** | 状态须有文字/可辨边界 | Eidos 语义状态；Chromium PASS 非全面 WCAG 证明 |
| EX01–EX02 [勤哲定义数据项](https://www.qinzhe.com/cn/tutorial-2015/t-05-03.html)、[模板概念](https://www8.qinzhe.com/cn/tutorial-2015/t-03-02.html) | 10-14～15 **H-A 两篇相关正文** | 字段类型/必填集中配置 | 企业扩展字段建议/Owner 批准分离 |
| EX03 / EX05 [Microsoft Lists 从 Excel 新建](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet)、[Airtable CSV Import](https://support.airtable.com/articles/3067164948-csv-import-extension) | 10-15 **H-A 官方相关正文** | 表头/数据预览/对应可编辑 | 映射建议须人可查看和更正，不宣称行为相同 |

没有本窗口直接阅读的新增竞品网址。前序 2026-10-15 主索引中其余 V01–V16 / M01–M08 / F01–F07 / EX01–EX10 原始网址、当时阅读级别和来源冲突仍须以相应[UI 索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)及[业务索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)为准；此处不补造遗漏的网址或阅读记录。

## 4. 具体工程决策与排除方案比较（来源事实 ≠ EVO 决策）

| 问题 | 已采用：谁决定/为什么（**EVO 判断**） | 排除及理由 | 成立前提/残留限制 |
| --- | --- | --- | --- |
| 旧页面 `choice_0` 身份漂移 | 在既有 batchMode 不可见值携带 Job 源列/正式映射 revision；执行前和持久化时再核对，过期拒绝。 | 旧 index 对当前未匹配数组重定位、自动转给另一列：可能改变 Human 原决定；增建页面/按钮：非必要扩展。 | 摘要是并发前置条件不是授权令牌/跨进程锁；原 Host 企业权限仍必须存在。#1028/#999 已实测。 |
| 初次“开户银行”有 2 个同名字段 | 唯一匹配才自动映射；同名业务 label 保留未映射并展示不同 ID/用途；来源**明确为技术字段 ID**时才可准确指向该 ID。 | `find(首个未占用)`、用候选被占用排除法猜剩余字段：业务标签不能证明字段语义。 | 企业扩展 Schema 当前可用字段须具备真实 ID/描述；客户两 ID 未取得。 |
| EC 高置信度（如 0.99）推荐一个同名字段 | EC 只能作为 Human 可审查证据；即使 `advisoryOnly`，也不允许在第一次 Stage 将歧义字段预选进 Job。 | 以高分替代人工、认为“有 advisory 标记就无影响”：实际上旧代码直接写初始 mapping。 | 唯一非歧义 EC 推荐仍可沿旧协议填建议；合法 Recipe 是不同路径。 |
| 人工确认后第二次同结构上传 | 由 Human 明确的 `targetFieldId` + 成功 dry-run 生成已确认 Recipe，满足相同企业/目标/来源结构/Schema 时原样复用，跳过 EC。 | 每次都人工重选：增加成本并违背系统记忆；把 Recipe 当首次无根据 EC 猜选：混淆证据等级。 | Schema 漂移时只能回退成需审核建议；本窗口 #1039 仅为合成证明。 |
| 3 条缺失 `subjectType` | Excel 真实类型原值保留；如有来源列，逐条确认组织/自然人，不以供应商角色推断。 | 一次批次 `ORGANIZATION` 常量只为填三条：会覆盖其他有效来源；用 165/169/172 合成行号当客户事实。 | 客户行级身份事实未取得，未签收。 |
| 高保真 V3 UI 与工程分工 | Eidos 通用 ReviewTable/状态/移动端；Platform 业务 Job/字段候选/授权命令。| BEX 私有皮肤、把业务逻辑写 Eidos、只做静态原型按钮搬运。 | 原型 #909 是参考资产，不能把 Draft 历史分支完整合并生产。 |
| 保存/预检查/提交 | 保存映射/未批准草稿、Owner schema 批准、dry-run 与 supplier commit 保持不同权限与明确动作。 | 上传即写供应商、保存草稿顺便造字段、dry-run 成功即自动提交。 | 真实 M05 授权、幂等和完整业务验收仍 D，不能因隔离测试升级。 |

## 5. 来源间矛盾、纠正过的判断及仍未决的方向

1. **旧入口/索引里的 #999 OPEN vs 当前 MERGED：** [旧简短入口](BEX-01-V3-WINDOW-HANDOFF-ENTRY-20261019.md)是较早时点，#999 已在 `bdd5ee3b...` 合并（已直接查 PR），不能把历史快照误认为当前故障。已有总索引 §13 的最终闭环为较新证据；本页再补 M04 #1039。
2. **“用途说明被 Host 丢弃”与源码证据冲突：** 本窗口一度只看到辅助服务未传描述，后来核对真实批次页 Host 入口已传 `resolvedDescription`，故**撤回整页丢用途的判断，未实施该错误修复**。未来仅在登录后客户数据的真实字段确无描述时，再归类为企业资料缺失或另一个经复现的错误。
3. **原自动建议已修好 vs EC 另有通道：** #1033 只修 `service.ts` 确定性 alias；`actions.ts` 的 Experience Compiler 不经过该判断，直到 #1037 才补门禁。此为**不同代码路径**，不可用某一条单测结论概括所有初始建议。
4. **“同名要人工” vs “二次导入无需再次 AI”：** 无法从名字猜 ID 与必须记住 Human 已批准 ID 并不矛盾，前者是无来源首次建议，后者是有归因 Recipe；#1039 验证正向契约。Schema 变更导致的老 Recipe 不可视为永久有效。
5. **Railway 服务 SUCCESS vs 用户签收：** 部署只表示对应提交服务启动在线，不提供用户已登录同一 Job 的当页截图，不等于 M04/M05/M06 通过。主线并行 PA05 会推进 SHA，旧部署 “SUCCESS” 不能称最新。
6. **“三条异常行 = 165/169/172”**：这些是 `tools/bex01/synthetic-v3-xlsx.mjs` 的夹具行号，不是客户真实缺失记录的行号。缺少原 workbook，就不能确定客户缺失行或应填 ORGANIZATION/PERSON。
7. **老索引“§12”重号和不同 SHA：** 总索引由多次历史追加而有两个 §12；推荐用标题/PR 链接定位，不对旧记录作技术性清洗以免影响其他窗口引用。§13–§15 为本窗口之前已归档增量，本页专门记录已合并 #1039 的最新证据。
8. **最值得下一步查的不是新的竞品文章，而是受权生产证据：** 原 XLSX、同名银行两条真实 Extension 定义/用途、真实 Job 的 mapping/status/rowCorrections、三条实际空值来源及业务身份材料；之后是已登录 1280/390px 对照。只有现场出现新的 UI 争议，才定向打开历史仅摘要的简道云/飞书官方正文并按新增日期记录真实阅读级别。

## 6. 重要资料摘要、可复核章节及附件位置

| 资产 | 精确位置/章节或原始网址 | 重要信息及访问限制 |
| --- | --- | --- |
| **V3 高保真 HTML** | [#909 Draft 的 `BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html`](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)：`#review`、`#tableFilter`、`#mappingRows`、`.actionbar`、`#saveStatus` | 上传→核对两阶段、四列、来源/证据/目标/状态、底部确认；原型 synthetic，#909 **当前仍 OPEN/Draft**，不能当已合并功能。 |
| **用户四张对照图 S01–S04** | [总研究索引 §4](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)：`image(20261016-123851).png` (`file_00000000afec82098eeef212799e6d86`)、`image(20261016-123943).png` (`file_00000000241882098805da9ff5c8056d`)、`image(20261016-124020).png` (`file_000000006ad482098729c8092c96e76a`)、`image(20261016-124036).png` (`file_00000000f4a48230847b7ab6aa7814a9`) | S01 四列表 / 显示 7/22 与关注；S02 20 个未匹配字段集中审核、常量样例和候选用途；S03 待处理/待新增；S04 原值旁用途展开及字段创建入口。**只有文字观察/附件指针已进 GitHub，原 PNG 二进制没永久入 Git**，不得编造有效下载地址。 |
| **V3 原型测试截图** | [V3 2026-10-15 run 38684546184](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184) / [artifact 11948839518](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184/artifacts/11948839518) | 历史 15/15 模拟原型截图，只属原型，Actions 工件有保留期限。 |
| **E4 真正 Host 桌面/移动连续截图** | [run 38895420715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715) / [artifact 12044215349](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715/artifacts/12044215349)、[#981 run 38898532530](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38898532530)/[artifact 12044782204](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38898532530/artifacts/12044782204) | 旧核验：桌面 6 张 / 手机 16 张重叠滚动；手机内部滚动高度从 9139→7621px（22 列合成）；不会替代用户当前登录状态或真机。 |
| **#984 真实隔离 Host 四列** | [run 38905654416](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38905654416)/[artifact 12047588110](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38905654416/artifacts/12047588110) | 四列和问题聚焦的早期自动截图；工件期限不确定，不假设仍能下载。 |
| **M03 stale review 源/CI** | [run 39207709249](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39207709249)、[#1028](https://github.com/jiangxng/EVO-App-Platform/pull/1028)、[八领域审查](https://github.com/jiangxng/EVO-App-Platform/blob/bdd5ee3b39465bd025a100582e40e7113653d041/docs/ui-design-reviews/bex01-v3-m03-stale-review-source-rejection-20261019.md) | 保留确切 RED 原因、Host 再验位置和“不可称分布式锁”限制。 |
| **M04 deterministic RED/EC RED 与最终复用** | [run 39211226617](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211226617)、[run 39213354669](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39213354669)、[#1039](https://github.com/jiangxng/EVO-App-Platform/pull/1039)、[run 39214905232](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39214905232) | 一个由 `find(first unused)` 导致、一个由高置信 EC 导致；独立修复且受权 Recipe 正向复用回归。 |
| **当前真实导入页及服务落点** | [`apps/data-import/page.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/apps/data-import/page.ts)、[`apps/data-import/actions.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/65e970321017bbb022efad9a6ff1d2d9809a407a/apps/data-import/actions.ts)、[`apps/data-import/service.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/9654da1736f69bf04235ee42350aad9e384ab5ab/apps/data-import/service.ts)、[`apps/data-import/recipe.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/3168a7e39f21fe1de30273fce5a4bfd04116c6ff/apps/data-import/recipe.ts) | 可复现业务代码，链接固定 SHA 不随 main 漂移。不要直接在 Eidos fork 里修供应商 ID 逻辑。 |
| **真实客户文件与 Job** | 历史文件名 `往来账户2026_10_08_10_15_23.xlsx`；旧路由 `#/data-import/jobs/import-79ce7d97-bbea-442a-b656-0661273b52f8/map`；前序研究另出现 `import-33ff3446-80c5-4992-b5c6-710f415535b3` | 仅为旧聊天及文档中的**标识字符串**，当前无附件字节/授权 Job 内容可供核对；**不同 Job ID 不得合并视为同一批次**。 |

## 7. 交给下一窗口的模块路线与精确任务门禁

| 顺序 | 阶段与文件模块 | 已完成、不要重做 | 只有何时才能继续、验收产物 |
| --- | --- | --- | --- |
| 0 | GitHub/Railway 当前事实 | #999/#1033/#1035/#1037/#1039 已合并且历史 CI/部署验证；旧 #999 OPEN 过时 | 先刷新 main 与 production SHA、未合并 #909 的状态、相关 PR；并行窗口 owner 文件需 compare；固定 6 行状态表 |
| 1 | **M04 真实银行字段**：`apps/data-import/page.ts`、`service.ts`、`actions.ts`、`apps/object-extension/batch-page.ts`、`manager/server.ts` | 两道首次防误选、候选用途与注意状态、Host Stage、Recipe 正向测试 | 有**授权真实 Excel/Job**后列两条真实 `fieldId`、标签、描述、适用关系、来源样本；让 Human 明确其映射，不自动创建/改动 |
| 2 | **M04 三条真实主体身份**：`apps/data-import/service.ts::correctRow`、`apps/data-import/page.ts`、`apps/data-import/types.ts` | 172×22 合成样本三处空值和隔离逐行更正流程已回归 | 用原 Excel/真实企业证明问题记录行号、现值/应为 ORGANIZATION 或 PERSON、Human 决策/更正审计；不能用夹具 165/169/172 |
| 3 | **M05 原范围**：`apps/data-import/recipe.ts`、`service.ts::dryRun/commit`、`apps/counterparty/import-target.ts` | Human Recipe 复用和 dry-run 与 commit 分离合成协议已有测试 | 经真实授权、字段/源值批准后核 schema 变更预检失效、重新执行、幂等/失败恢复、明确提交和业务 receipt；**不未经授权写入生产供应商** |
| 4 | **M06 原范围**：#909 V3 HTML 与真实 Railway `/map` / batch 页面 | Eidos 通用四列表、状态、桌面/移动合成 CI 已有 | 已登录真实业务 1280/390px 长截图与用户四图逐项比对，人工签收；无原四图 PNG 时只能按已保存的文字观察，不伪称像素一致 |

**约束：** 新 PR 必须是实测差异驱动、独立 bounded 分支，按精确 HEAD / CI / 最新 main 非冲突校验；不能修改 `project.status.json`、改 Railway 为 release、覆盖 PA05 或 Eidos owner；不根据合成银行 ID 创建生产字段，不根据 SUPPLIER 决定主体身份，不用 CI/部署代替真实业务验收。当前**工程里程碑仍 3/6**，M04 为部分完成，M05/M06 保持 OPEN。

## 8. 尚未保存到 GitHub 的原始内容（准确缺口）

- **没有**客户 `往来账户2026_10_08_10_15_23.xlsx` 的原始二进制、可授权复核的 Import Job 导出、两个真实银行扩展字段定义/用途与最终 Human 选择。
- **没有**三条客户真实主体身份的行级记录、业务依据及经授权的最终 rowCorrection 结果；合成夹具的 165/169/172 不能代替。
- **没有**用户 2026-10-16 S01–S04 四张对照 PNG 的永久 GitHub 二进制（已保存文件名/附件 ID/详细观察；见 §6）。
- **没有**当前客户已登录 Railway 1280px/390px 真正完整滚动截图、用户视觉认可/业务签收证明。
- 历史外站网页全文和部分 CI 截图 artifact **没有复制到本交接新文档/仓库**；其原网址、查阅级别、章节、run/artifact ID 均在本页及旧索引中保留。旧外站内容不会以“本窗口已读新原文”冒认。
- 本交接**新写的两份 Markdown 文档**及其分支/PR/commit 属于已保存成果；文档以外没有创建新的本地二进制包或完整 Excel 副本。

研究信息已压缩为可验证出处+方案及限制；接续时优先**客户受权证据**而不是从头搜竞品或重建合成测试。
