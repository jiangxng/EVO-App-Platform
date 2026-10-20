# BEX-01 V3｜M06 高保真工作台接续入口（2026-10-20）

> **新窗口先读本页，再读[详细研究资料与决策索引](BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)。** 然后按需要读取 [M04 前序简短交接](BEX-01-V3-M04-WINDOW-HANDOFF-ENTRY-20261019.md)、[M04 详细索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[V3 总研究遗产](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)，以及 [#909 原型 PR](https://github.com/jiangxng/EVO-App-Platform/pull/909)。这些文档是不同时间点的记录；**当前状态以本页“最新核验快照”为准**，旧文档不回写覆盖。
>
> **保存位置：** 文档专用分支 `docs/bex01-v3-m06-research-window-handoff-20261020`，从 Platform `main@5919e0147232fef1ddfc4f7e9a38b67969100bcf` 创建；不直接推 `main`，不修改 `project.status.json`、Railway 配置、PA05 或其他窗口工作。本文与详细索引为本次新增，是否合并以该文档 PR 为准。

## 一、不可改变的目标与决定

完成 EVO-App-Platform / BEX-01 供应商导入 V3 高保真审核工作台，**按 #909 原型继续实现，目标是 100% 还原；在页面达到目标并完成人工视觉签收前，不启动真实客户 Excel 业务验收**。不得需求偏移、扩大范围或为了增加 PR 数重复实现已有功能。

- **Eidos**：通用工作台、表格/卡片响应式、可逆布局与通用交互；不得写入供应商、开户银行、Import Job 等 Platform 业务语义。
- **Platform**：真实 Import Job、字段业务语义、Host 权限、草稿、预检、提交和审计；仅由 Host 选择哪些内部路由启用宽审核模式。
- 1280px 桌面审核页需提供足够宽的审核表（当前测试目标为约 1200px 内容上限），390px 必须使用合适的手机布局，不能保留挤压桌面表格。
- 自动聚焦只是布局行为；不能覆盖用户已保存的侧栏偏好。原侧栏按钮、活动栏和 Ctrl/Cmd+B 必须能主动恢复导航。
- 两个同名“开户银行”不得按顺序、标签或 LLM 高置信度自动猜选 field ID。Recipe 只能在 Human 明确选择并通过预检后按原契约复用。
- `SUPPLIER` 是往来角色，不是 `ORGANIZATION` 身份证据。三条真实缺失主体类型记录必须按真实证据逐条确认。
- CI PASS、部署 SUCCESS、合成 Host 旅程和历史截图均不能代替客户真实数据验收或 Human 视觉签收。

## 二、最新核验快照（2026-10-20）

| 项目 | 当前准确状态 | 证据与限制 |
|---|---|---|
| Platform `main` | `5919e0147232fef1ddfc4f7e9a38b67969100bcf` | 直接读取 GitHub branch API |
| Railway production | `main@5919e014…`，deployment `5b921757-ca9e-4b48-9eba-595a5b6f6459`，`SUCCESS` | 直接读取 Railway deployment；本轮没有部署新代码 |
| Eidos `main` | `1b651737182c083bdb945e30c4d16b9ecacbc1e1` | 直接读取 GitHub branch API |
| Eidos [#202](https://github.com/jiangxng/eidos/pull/202) | 未合并；HEAD `f3e2b5ec4d90ababa43b343c0008295243a19ca6`；CI 与 Human UI gate PASS | [CI run 39285222302](https://github.com/jiangxng/eidos/actions/runs/39285222302)、[Human gate 39285222230](https://github.com/jiangxng/eidos/actions/runs/39285222230)。通过仅表示该 HEAD 的工作台门禁通过，不表示 Platform 已完成 |
| Platform [#1054](https://github.com/jiangxng/EVO-App-Platform/pull/1054) | **Draft / 未合并**；HEAD `3845c9d953943a3f962ad298669fc66c46956758`；两项关键检查失败 | [Platform CI 39285016324](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016324) 与 [Real Host Chromium 39285016537](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016537) |
| 原型 [#909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | 仍为 Draft / Open；原型源码在独立设计分支 | 原型不是生产页面，也不是已合并的业务实现 |
| 客户数据 | 尚未完成真实验收 | 原客户 Excel、授权 Job、真实银行 field ID/用途与三条身份仍须授权后核对 |
| 总体里程碑 | **3/6 完成** | M01–M03 工程完成；M04 部分完成并 OPEN；M05 OPEN；M06 建设中并待 Human 签收 |

### 需要特别注意的两个新发现

1. Platform CI 的单个失败位于 `tests/app-host/mobile-design-language.test.mjs:68`：旧断言只接受 `browserToolbar.append(globalControls)`，但当前通用工具栏加入了聚焦按钮，实际代码是先追加聚焦按钮再追加 `globalControls`。这是结构断言与新增通用控件不一致；新窗口应更新测试表达正确不变量，不应删除必要的聚焦按钮来迎合旧断言。
2. Real Host Chromium 的 390px 场景失败：`PHONE_TABLE_SHOULD_REFLOW_TO_CARDS`。诊断确认 viewport=390、CSS 成功加载，但 `cardsDisplay=block` 且 `tableDisplay=table`，即手机端仍显示表格。该失败必须调查真实 CSS/DOM 选择器与级联原因，**不能简单放宽或删除测试**。本轮 run 后面的 V3 专项截图步骤因此被跳过。

Platform #1054 分支与当前 main 已发生分叉：compare 结果为相对 `main@5919e014…` **ahead 51 / behind 43**，共同基点 `504554d151081324645ab6d180872c720eaa25d8`。不要直接合并或盲目 rebase；先检查差异中的提交、其他窗口工作与可安全同步的最小变更。

## 三、M01–M06 固定状态表

| 里程碑 | 状态 | 已有工程证据 | 尚余门禁 |
|---|---|---|---|
| **M01 四列审核** | 工程完成 | #973/#978/#981/#984/#989 等既有 PR 已合并；历史适用 CI PASS | 最终 1280px/390px 视觉归 M06 |
| **M02 批次审核** | 工程完成 | #991/#993/#996 已合并；真实隔离 Host 与批次常量/方案预览回归 | 客户真实主体身份归 M04 |
| **M03 草稿恢复** | 工程完成 | #999/#1028 已合并；历史适用 CI 与部署成功 | 真实授权客户会话仍不能由隔离测试替代 |
| **M04 客户数据验收** | **部分完成 · OPEN** | #1033/#1035/#1037/#1039 的工程安全子项已完成 | 原 Excel、授权 Import Job、两个银行字段真实 ID/用途/样本、三条真实主体身份 |
| **M05 真实完整导入** | OPEN | 既有隔离 Host / Recipe 回归 | 真实权限、预检失效重跑、幂等、明确提交、最终审计 |
| **M06 V3 高保真** | **建设中 · OPEN** | #909 原型；Eidos #202 当前 CI/Human gate PASS；Platform 有新增布局代码但当前 CI 失败 | 修复 Platform 两项失败、对照原型 1280px/390px、当前截图证据、Human 签收 |

**总进度保持 3/6，不因 Eidos #202 单独通过而提升。**

## 四、新窗口唯一执行顺序

1. 先读本页与配套详细索引，刷新 GitHub main、#909/#202/#1054 的 HEAD/CI、Railway；不能沿用本页 SHA 当永久最新状态。
2. 先处理 Platform #1054 当前失败：修正旧结构断言；定位 390px 表格未切换卡片的真正原因；不要为了过 CI 牺牲既有手机体验。
3. 由于 #1054 分支相对 main 分叉，先审查 compare 结果并与并行窗口隔离，拟定最小安全同步策略；不直接推 main、不盲目合并/rebase。
4. 重新运行精确 HEAD 的 Platform CI 和真实 Host Chromium；确保 V3 专项步骤真正执行并保存新截图。逐项对照 #909 的文件卡片、问题区、四列映射、步骤导航和底部操作区，分别检查 1280px 与 390px。
5. 只有当前截图和真实页面达到 V3 原型并由用户签收后，才进入 M04 真实客户数据验收；如果原 Excel/授权 Job 不可得，保持 M04 OPEN，不造合成客户事实。之后才继续 M05。
6. 持续保持 M01–M06 六行状态表；不修改 `project.status.json`，不切 Railway 到 release，不覆盖 PA05、Eidos 其他工作或插件治理分支。

## 五、资料和证据边界

本次没有重新开展竞品/外站研究；外部参考网址与历史阅读等级继承自 [M04 详细索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) 和 [2026-10-15 UI/业务研究索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[业务流程研究索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。本次新读的是 GitHub 原型、源码、PR、Actions 日志、部署元数据；具体 URL、结果、方案比较和未决冲突见[详细索引](BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)。

尚未取得/永久保存：客户原始 `往来账户2026_10_08_10_15_23.xlsx`、受权客户 Import Job、真实银行字段身份与用途决定、三条真实主体身份、用户原始四张参考 PNG 的永久仓库附件，以及本轮最新 V3 专项 Chromium 截图。最新失败 run 的 artifact 可查阅，但本轮尚未下载检查其内部文件清单；不得声称它包含已跳过的 V3 专项截图。


## 2026-10-20 续跑 #08 最新执行状态

> 详细证据、截图文件名、原型差异与纠正理由见[详细研究资料与决策索引 §续跑 #08](BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)。

- Platform main 最近一次核验为 `eaa5e813b1e86a6460d988c76eb2076512c35127`；Eidos main 为 `1b651737182c083bdb945e30c4d16b9ecacbc1e1`。PR #1060 当前候选 `def4fa6c99a72e17f6de5569b28307ba2a77e878` 已基于该 Platform main，compare ahead 25 / behind 0；仍为 Draft，未部署。
- 精确 HEAD `def4fa6…` 的 Platform CI、Real Host Chromium、In-Context Import Resume、Human UI Design Review Gate、Lightweight Host Architecture 均 PASS。浏览器 artifact 为 [12242119759](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39373762771/artifacts/12242119759)，已实际打开桌面/手机 PNG。真实 Host Chromium 5/5 场景通过；V3 source audit、row correction、batch constant restore、172×22 synthetic XLSX 的 V3 专项步骤实际执行并通过。
- 复核 artifact 后发现 `report.json` 的页数和行数元数据落后于测试断言。已提交修正 `6d77dcf22324a9039f315432598892b8dc5d6e07`（分页报告改为 25/25/4，样本报告改为 54 行）；**新 HEAD 的 CI/Chromium 仍需重跑确认，暂不记为最终 PASS**。
- 最新截图已证明：标题“核对导入数据”、文件摘要、四列映射表、1280px 桌面和 390px 卡片布局正常。仍未签收：当前映射截图是 0 项 mapping attention 状态，未覆盖原型中的银行同名字段/主体类型/系统编码三类 issue box；顶部三步表达与原型两阶段不同；底部返回文件/恢复初始选择动作尚未对齐。不得把自动化绿灯等同 100% 视觉还原。
- 下一步：等待 `6d77dcf…` 精确 HEAD 的 Platform CI 和 BEX-01 Real Host Chromium；检查新 artifact 的报告数据一致性；随后为未决字段创建隔离 Host 映射状态截图，审查 Host 安全动作契约，再按 #909 逐项修正。继续保持 Draft、不部署、不合并。
- M01–M03 工程完成；M04 客户真实数据 OPEN；M05 真实完整导入 OPEN；M06 高保真/人类视觉签收 OPEN；总体 **3/6**。客户文件、授权 Job、银行字段真实身份/用途和三条真实主体身份仍未取得。
