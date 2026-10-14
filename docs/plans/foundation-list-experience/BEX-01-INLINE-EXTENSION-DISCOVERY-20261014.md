# BEX-01｜未匹配 Excel 列就地创建企业字段：UX 收口记录（2026-10-14）

> **专项补充，不替代 [PR #846](https://github.com/jiangxng/EVO-App-Platform/pull/846) 中仍未合并的 BEX 总交接**；此文件只记录新增用户反馈、已做的有界改善、回归与剩余 Human Gate，不修改全项目权威状态和 PA-02 文档。

## 触发事实与原定边界

用户在现有 Railway 的“字段映射”打开“系统编码”来源列的目标选择下拉框。截图中只有“忽略此列”及已存在的业务字段，没有创建入口；原 #843 把“创建企业扩展字段（未匹配列）”放到映射页单独的上下文导航，不在列旁。**截图证实该下拉缺入口，不单独证明页面其他位置不存在入口**。业务用户第一次接触时不易发现。原 Excel `往来账户2026_10_08_10_15_23.xlsx` 尚有 3 行核心 `subjectType` 缺失，不能靠扩展字段绕过。

## 定向行业及用户反馈（已实际阅读）

- Microsoft Lists 官方 Excel 建表：https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet 。表头到列表列、内容到行，保留用户调整和确认；微软同时提醒源文件可能保存在可供他人访问的库。本项目**不**照搬“上传什么就新建什么业务对象”的逻辑。
- Reddit Power Apps 用户 Excel 转列表遇到错误类型、记录遗漏：https://www.reddit.com/r/PowerApps/comments/1bk99kj/ 。单条实际社区反馈而非统计共识，支持“类型要由 Human 检查”。
- Reddit 用户修改来自 Excel 的字段类型后应用异常：https://www.reddit.com/r/PowerApps/comments/wkaor3/ 。单一案例，支持避免不经确认地随意改变字段语义。
- Reddit 用户评议“从 Excel 转为数据库时需保留易用性和权限”：https://www.reddit.com/r/nocode/comments/1shj3i4/spreadsheetlike_database_tool/ 。是定性用户需求，不是产品选型的定量排行。
- Nielsen Norman Group：https://www.nngroup.com/articles/ten-usability-heuristics/ 。就地展示相关动作，减少让用户跨位置记忆操作。
- 勤哲 Excel 服务器官方“定义数据项”：https://www.qinzhe.com/cn/tutorial-2015/t-05-03.html 。可借鉴从来源表单理解字段的思想，但不能等同于 EVO 的基础对象授权及 Owner 机制。该来源的早期详细记录见 #846 的 `REFERENCES.md` 追加章节。

## 已确认最小方案

1. 复用原 CP-03 `evo-object-extension` 的创建表单、Owner 校验、字段写入以及导入/详情闭环。**不新建数据库、不改变核心字段和必填规则**。
2. Eidos 使用**可选**表单字段 `contextLink`（通用组件 owner [eidos PR #181](https://github.com/jiangxng/eidos/pull/181)）；仅在特定字段存在本地路径时显示非提交的二级动作，校验 URL 为本地绝对应用路径。既有表单/Agent 动作不受影响。
3. 在供应商导入映射页，仅当目标为 `counterparty.subject`、当前企业的 Object Extension 特性生效、当前操作者是 OWNER/ADMIN 且该来源列未匹配时，列旁显示“＋ 为本列创建企业扩展字段”；原页眉上下文入口继续保留。点击后进入原创建页、人工选择来源列和类型、保存返回并完成映射。
4. 为减少对 PA-02 owner 的共享 Host 变动，本批**不**修改 `manager/server.ts` 和 Agent；创建表单仍需要人工确认来源列，而不是为了自动预选来源列增加未验证的新路由参数。
5. **Agent 防回归**：`ai-auto-map` 原动作类型、taskKind、importJobId、targetId、完成刷新原样保留；协议测试核对 Agent context、许可与跨目标隔离；真实 Host Chromium 在点击列旁入口前先断言“自动匹配”操作仍可见。没有真实调用 PA-02 运行链，因此不宣称新 Agent 全链路已验收。
6. 预检查与显式提交严格分开；仍保留 3 行 `subjectType` 数据质量阻塞，绝不按“供应商/往来类型”自动填“主体类型”。

## 有界阶段倒计时（以已验证阶段数为准，不是分钟预计）

- [x] 第 1 关：社区反馈核对及成熟方案选择；不自动建整表。
- [x] 第 2 关：确认沿用 CP-03、权限边界与 Agent 不改。开发规则 `.clinerules/01-delivery.md` 已由独立 PR #851 合入。
- [x] 第 3 关：Eidos 通用兼容扩展 #181 已合入，Platform BEX 页面 #852 的准确测试 HEAD `8048e0927e1df807a43a872440d56852c096162b` 上，Platform CI / Project Continuity / Lightweight Host / Plugin CI / BEX-01 Real Host Chromium **均成功**；CI 工作流 https://github.com/jiangxng/EVO-App-Platform/actions/runs/38536662593 （Chromium）及 https://github.com/jiangxng/EVO-App-Platform/actions/runs/38536662894 （Platform CI）。
- [ ] 第 4 关：核实合并与过程分支清理，保留原 Railway 版本；到用户实际 Excel 页面时再进行 **Human Gate**。

**区别**：代码测试 PASS / GitHub main 已合并 / Railway 部署 / 用户原 Excel Human 验收是四件不同事情。该文件建立时 #852 尚待合并，不能提前把线上用户体验标记 PASS。

## 收尾与其他窗口分工

BEX 后续只看新入口是否易找、权限是否正确、字段创建后返回映射和详情；真实 Agent 长任务及 Owner PG 存储属于 PA-02，通用 Eidos 组件属于 Eidos owner。原总交接 PR #846 仍是草稿，不能为当前页面修复自动合并或部署。若无法通过当前连接能力删除已合并的过程分支，精确记录分支名称与 PR 留给有删除权限的维护窗口处理，不强制更改历史提交。
