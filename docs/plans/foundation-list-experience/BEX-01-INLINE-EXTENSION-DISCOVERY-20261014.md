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

## BEX-01 / CP-03 固定进度表（当前专项）

状态核对：2026-10-14。Railway Ledger Configurator 为 **EVO 开发测试环境**（Railway 环境名称仍为 `production`）。当前成功部署 **BEX-01 PR #852 合并提交 `3112de7cec8fc7fe2c7220bb0f4fbb577688dc70`**；Railway deployment `c4be1222-84df-4907-ac30-049d260cd8ee`，SUCCESS、Online，运行实例 1/1、0 崩溃。通过固定分支 `release/bex01-dev-20261014` 锁定此提交，避免最新 `main` 自动包含正在推进的 PA-02。此前已部署成功的 `70597a0e` 及中间短暂的 `50aae2c` 均不是当前有效部署。此表持续复用，**不按阶段 4→3→2→1 倒数**。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| Excel 未匹配列旁的“创建企业扩展字段”入口 | ✅ 代码已合并：Platform [#852](https://github.com/jiangxng/EVO-App-Platform/pull/852)、Eidos [#181](https://github.com/jiangxng/eidos/pull/181) | 在 Railway 的原 XLSX 作业中检查入口可发现性 |
| 既有 CP-03 创建字段 → 映射 → 预检查 → 提交 → 供应商详情 | ✅ 真实隔离 Host + Chromium 回归通过 | 用用户原 XLSX 作业完成实机人工确认 |
| 个人 Agent“自动匹配”原按钮、上下文和完成刷新兼容 | ✅ 代码/代表性浏览器检查通过；真实 Agent 全链未跑 | 本窗口不修改 Agent；全链验证由 PA-02 负责 |
| 核心 `subjectType` 必填与字段权限安全 | ✅ 校验规则未放宽；原文件 3 行缺失仍待处理 | 根据实际主体身份补齐 3 行并重新预检查，不能由“往来类型”推断 |
| 工程合并、规则归档与过程分支整理 | ✅ #851、#852、#854 已合并；关联过程分支已核对删除 | 无需重复开发或清理 |
| Railway 开发环境更新 | ✅ 已部署 `3112de7`，SUCCESS / Online（固定 BEX 发布分支） | 不重新部署；在该环境人工验证新入口 |
| 用户原 Excel 扩展字段操作与详情验收 | ⏳ 待验收 | 在批准的环境中完成真实数据操作并记录字段值显示、缺失行处理与结果 |
| **BEX-01 / CP-03 本轮整体** | **进行中：工程与开发环境部署已完成，真实用户签收未完成** | **使用原 XLSX 完成未匹配列创建、映射、预检查、导入、供应商详情检查后签收** |

**准确部署与回退记录：** 2026-10-14 已接受用户将既有 Railway 定义为开发测试环境、直接部署 BEX-01 的要求。Railway 起初在把 commitSha 指向 `3112de7` 时意外从移动中的 `main` 构建 `50aae2c`（部署 `b4af15e5-6259-4a89-b59b-afb721f0005b`），发现后创建固定发布分支 `release/bex01-dev-20261014` 指向 `3112de7`，重部署并核对实际 Git SHA 为 `3112de7`、服务 SUCCESS / Online、启动日志正常。仅修改 Ledger Configurator 服务 Git 来源，不变更数据库配置/持久卷、共享变量和其他服务。回退依据：此前 `70597a0e` 的部署 `3218adea-04ea-4607-bc62-412b12c7d72a`，如需回退应先核验是否可重新部署旧构建，再由人工确认。**Railway SUCCESS 不是原 Excel Human 验收**；目前无权限访问用户登录的浏览器和原文件，原文件 3 行 `subjectType` 继续单独阻塞。

**记录规则**：后续汇报每次保持同一组“验收项目｜当前状态｜下一步”，状态有变化时更新对应行；代码通过、已合并、已部署、人工签收绝不混写。只有确实新增/删除验收项时说明原因，不能靠“剩余几关”的数字倒计时替代真实状态。

## 收尾与其他窗口分工

BEX 后续只看新入口是否易找、权限是否正确、字段创建后返回映射和详情；真实 Agent 长任务及 Owner PG 存储属于 PA-02，通用 Eidos 组件属于 Eidos owner。原总交接 PR #846 仍是草稿，不因当前页面修复而自动合并或部署。#851、#852、#854 的过程分支已在严格核验后清理，不重复处理；若未来出现新分支仍按归属与合并状态逐一确认。
