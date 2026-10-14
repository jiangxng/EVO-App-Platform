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


## 2026-10-14 用户真实 Excel 回归：上下文丢失与重复字段（BEX-01 局部修复）

**人工截图证据（用户当前聊天上传，尚无 GitHub 附件可链接）**：
1. 在来源列“开户银行”点“＋ 为本列创建企业扩展字段”。
2. 创建页错误地选中“系统编码”，而不是点击的“开户银行”，业务字段名称仍为空；人工重选后创建并返回。
3. 返回映射后，该来源列仍为“忽略此列”，没有自动映射新字段；重复操作又产生两个名称相同、ID 不同的“开户银行”字段。
4. 以上由用户当前 Railway 页面截图证明，属于真实业务体验 BUG。**不要从截图推断字段已经写入供应商，也不要未经业务核实删除历史重复字段**。

**定向参考依据**（2026-10-14 已浏览，非统计结论）：Airtable 官方 https://support.airtable.com/articles/3067164948-csv-import-extension （优先自动匹配已有列，可跳过不需要的字段）、Microsoft 官方 https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet （Excel 表头生成列、由人调整类型）；ClickUp 用户重复字段抱怨 https://www.reddit.com/r/clickup/comments/1jjqm3n 和 Notion CSV 映射正面评价 https://www.reddit.com/r/Notion/comments/1mzxbd1/ （社区个例，不能当整体量化满意度）。

**接受的交互路线**：先复用唯一匹配的已有字段；不存在匹配时将“创建企业字段”呈现为建议动作，点该列即预选来源列并预填相同业务名称和文本类型，Human 可修正后确认保存；返回映射自动选中刚创建字段，保留预检查与最终显式提交；“忽略此列”始终可选。对来源意义模糊的系统元数据不得静默建字段。多个同名字段不能由系统猜选，需人工判定真实字段归属。

**范围控制与 Agent 防回归**：只改 BEX 现有导入页面、企业字段创建动作和局部 Host 路由参数接续（不改 Host 身份/授权/任务执行），不改 Agent 的 `ai-auto-map` 动作、Owner 存储及 `subjectType` 校验。重复字段防护放在 Owner 写入前；已存在的两个“开户银行”暂不合并、不删除，以免数据损坏。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 从“开户银行”进入创建页，预选来源和业务名称 | ✅ PR [#862](https://github.com/jiangxng/EVO-App-Platform/pull/862) 已合并并部署，真实 Host Chromium PASS | 真实 Host Chromium 和原 Railway 实测 |
| 创建成功后默认映射到刚创建的字段 | PR #862 已合并，40 项 CI 全部通过，Railway 修复版已部署 | 浏览器验证原导入作业不再回到“忽略此列” |
| 已有同名字段复用与重复新增拦截 | PR #862 已合并，40 项 CI 全部通过，Railway 修复版已部署 | 唯一匹配复用、歧义不猜测；原两项重复字段待业务核实 |
| Agent 自动映射与核心必填约束 | ✅ Agent 原入口/上下文保持，代表性浏览器回归 PASS，真实 PA-02 整链另案 | 验证不影响 Agent 控件与三行 `subjectType` 错误 |
| **BEX-01 / CP-03 本轮整体** | **修复已合并并部署开发 Railway，原文件用户签收及历史重复字段处置仍待完成** | **原作业验证创建后自动选中、确认已有重复字段归属、处理 3 行主体类型并执行预检查/提交** |

**实际发布及回退证据（2026-10-14）**：PR [#862](https://github.com/jiangxng/EVO-App-Platform/pull/862) 准确验证 HEAD `f85252350464ab3d4b7ad4c8aff130eb4f415d4f`，40/40 工作流通过，合并提交 `8b7e2cc9e12c13e6086803e5b6f81d78833e7069`。在用户明确确认 Railway 用作开发环境且无需新建环境后，将既有固定发布分支 `release/bex01-dev-20261014` 安全前移至该合并提交。Railway 现有 Ledger Configurator 部署 `35bdd1c5-3f85-475a-9174-05265cc8548d`，真实构建 SHA `8b7e2cc9`，SUCCESS、健康检查通过、App Manager 启动。此前稳定版 `3112de7` 部署 `c4be1222-84df-4907-ac30-049d260cd8ee` 为回退版本依据（回退时需重新核实可重部署性）。未操作原用户数据，不删除已有的两个“开户银行”；Human 验收未完成，不能把工程完成冒充实际数据签收。

## 2026-10-14 用户新增细节：Excel 来源列与系统字段一对一选择

用户明确要求：Excel 甲列选择系统字段 X 后，其他 Excel 列的下拉框**立即不再出现 X**；甲列取消选择或改为其他目标后，X 立即恢复。“忽略此列”允许多个 Excel 列重复使用，不算占用系统字段。这是**实时可用性规则**，不是等提交后才报错；需要同时从保存和预检查层拒绝来源列重复指向同一系统字段的异常请求。

**采用方案**：Eidos 通用可选 `exclusiveSelect:{group,exemptValues}`，仅对显式声明的 select 分组启用动态排他，不影响其他 Eidos 表单（Eidos [PR #182](https://github.com/jiangxng/eidos/pull/182)，已合并）。BEX 的 `map_* ` 下拉均属于 `data-import-targets` 组，`__IGNORE__` 是豁免值。客户端实时隐藏/还原，服务端 `updateMapping` 和 `dryRun` 拒绝两个 Excel 来源列映射到同一字段；保留独立的常量映射与值变换逻辑；不触动 Agent `ai-auto-map` 动作与 `subjectType` 必填规则。旧作业中原有冲突不进行静默重排，留给用户修正。

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| Eidos 通用排他选项契约 | ✅ PR #182 已合并并通过 CI | 与 BEX 固定版本一同部署验证 |
| 已选择的系统目标从其他下拉消失 | 代码已提交 [BEX PR #866](https://github.com/jiangxng/EVO-App-Platform/pull/866)，CI 待最终核验 | 实际 Chromium UI 验证 |
| 释放字段后原位置立即重新出现 | 代码已提交，浏览器回归已补 | 确认变更、恢复以及“忽略此列”可重复 |
| 保存与预检查双重禁止重复目标 | 代码已提交，协议测试已补 | 验证 Agent/外部入口绕过 UI 不能重复赋值 |
| 既有 Agent、企业扩展、主体类型校验 | 未修改 Agent 行为、核心必填或历史数据 | 回归及原 Excel 实际用户操作确认 |
| **BEX-01/CP-03 整体** | **前一版已在 Railway 开发环境；本次增强尚未部署** | **完成 CI → 合并 → 同环境更新 → 人工验收** |

## 收尾与其他窗口分工

BEX 后续只看新入口是否易找、权限是否正确、字段创建后返回映射和详情；真实 Agent 长任务及 Owner PG 存储属于 PA-02，通用 Eidos 组件属于 Eidos owner。原总交接 PR #846 仍是草稿，不因当前页面修复而自动合并或部署。#851、#852、#854 的过程分支已在严格核验后清理，不重复处理；若未来出现新分支仍按归属与合并状态逐一确认。
