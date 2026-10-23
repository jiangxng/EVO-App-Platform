# PA-02 收尾窗口：研究与决策交接简短入口（2026-10-14）

**Document class:** SESSION_HANDOFF_ENTRY / HISTORICAL_SNAPSHOT  
**仓库:** [jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)  
**此次资料包创建前的准确 `main`:** `d8e25efd008c88f2e51f5928b797fe2d07896305`（此 SHA 是研究快照，**不等于资料 PR 合并后的 HEAD**）。  
**接续分支：** 资料包 PR 完成合并／删除过程分支后只从**当时最新的 `main`** 创建下一条短期开发分支；不要恢复已删除的 `agent/*`。  
**详细参考资料索引:** [PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md)；含阅读等级、固定 URL、原始 PR 与 CI、方案取舍、遗留风险、截图附件与旧网页索引。  
**最高阶段权威:** [PA-00～PA-06 总纲／PA-02 原始 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) §25／§26.2／§27；[项目统一交付规范](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。

## 1. 本轮目标、用户明确要求和已确认决定

本窗口不是开始一条全新的 Agent 研究线，而是**按原计划推进 PA-02 持久执行至 R01–R10 完整验收**。用户多次明确：
- **原计划不能无限扩张**：PA-02 的问题必须解决，但涉及 PA-03 导入、PA-04 长上下文/记忆、PA-05 第二插件/2D、PA-06 企业运营的不偷偷提前。
- **避免重做已验证内容**：有用的已有 Worker、Host、Business Owner、Capability 授权、PostgreSQL、Eidos 直接复用；不反复重读外网资料、重写基础架构。
- **一独立交付闭环一短分支/PR**，同 PR 修复直到检查成功；安全地合入 `main`，**核实删除过程分支**；不直接推 `main`，不绕过 CI 或分支保护；不覆盖 BEX、2D 或其他窗口。
- **不擅自部署/启用生产 WRITE**，不调整 `project.status.json`、全局 HANDOFF 及其他窗口 owner 文件；不把隔离测试或模型文字成功称作业务生产验收。
- **固定进度表常态化**：每轮汇报“项目／状态／剩余验收”，按证据区分**已实现、代码已验证、真实整链已验收、阶段已签收**；若偏离总纲应立即标注。
- 本次换窗特别要求**留住已研究来源，原始 URL + 阅读深度、方案比较、冲突、易失附件和新窗口可执行接续**；不补造未查阅的网页或截图。

**已确认选择：** 第一个真实业务 Owner 选 Object Extension 隔离 PostgreSQL；原 Host/Run/Fenced Worker/Owner verifier 继续为权威；WRITE 默认为关闭，只有严格非生产 `OWNER_SANDBOX` 启用；R05/R06 以 DB 事务 Outbox 和权威 Run 快照为准；用户恢复不能新建重复 Run 或盲重试 WRITE；R03 3 次连续模型失败封顶、R10 24 slice + 默认 72h 基于持久 Run 的截止。**这些是项目内已经实现且局部通过 CI 的选择**，不是未读外站的结论。

## 2. 本窗口七个已经合并的实际交付（不用重做）

| 原始 PA-02 目标 | 合并 PR／准确 merge SHA（GitHub 来源） | 已证明的范围；限制 |
|---|---|---|
| 正式 Host 可信业务 WRITE | [#839](https://github.com/jiangxng/EVO-App-Platform/pull/839) `1d2712c9f312b5d0ce46d981c478797cf63b619c` | Host Run→PG Owner→真实回执/失联核查，非生产。 |
| 普通 Thread 发现并执行已授权 Owner | [#841](https://github.com/jiangxng/EVO-App-Platform/pull/841) `f7b722ed8121cab39b644a52d5904b2aee4c0f83` | `thread.send` 沙盒可调受治理业务 Owner，Human 旧文件 Provider 未生产迁移。 |
| R04/R07/R08 取消／已发生效果 | [#842](https://github.com/jiangxng/EVO-App-Platform/pull/842) `b8b502b7fe5eb5770e981a8627598fa29e87d423` | Owner ACK 丢失、Worker 失租后不重执行，取消保留已核验 Receipt。 |
| R05/R06 持久 Outbox、缺口快照 | [#844](https://github.com/jiangxng/EVO-App-Platform/pull/844) `126f5ef730458999e14b51a15d388938bf769a3b` | 实际 PG Host `run.events`、重复投递去重和快照；非真实浏览器。 |
| R03 有界模型失败与 R10 整 Run 步数 | [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845) `7e988fa8646f96b2e11b1af5283a146044c8e01d` | 3 次失败/24 持久步数，跨 Host 恢复无法重置。 |
| R05/R06 Eidos 消费端恢复 | [#847](https://github.com/jiangxng/EVO-App-Platform/pull/847) `dbc6112a794fea401078e662c211670ff877a750` | 工作台恢复代码读持久事件、缺口信快照；模拟 Host 而非完整 HTTP 浏览器。 |
| R10 整 Run 时间截止 | [#848](https://github.com/jiangxng/EVO-App-Platform/pull/848) `28e4a0342ed5615207624fc88822207899f4b54d` | 72h 创建时间截止，越期不启动新模型/工具；**费用硬预算仍未做**。 |

**已经验证，不代表 PA-02 完成。** 测试源、准确 CI URL 与每个场景覆盖在[详细索引 §2](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md#2-真实-pr-与-github-actions-证据索引)。本窗口研究完成时 `main` 已因其他窗口前进至 `d8e25efd...`，不要把 #848 merge SHA 写成“当前 main”。

## 3. 固定进度表——新窗口以后每轮例行更新，不得漏掉

| 原始验收项目 | 2026-10-14 当前状态 | 正式完成还缺什么 |
|---|---|---|
| R01/R02 双 Worker、旧租约 fence | **PG 隔离证据已验证** | 纳入 R01–R10 同一最终签收证据账 |
| R03 模型失败有限重试 | **已验证** | 汇总 #845 的真实 Head／负向案例 |
| R04 不明 WRITE 核验 | **隔离 Host＋Owner 已验证** | 记录生产单权威不在本次声明内 |
| R05/R06 Outbox 与工作台恢复代码 | **Host PG + Eidos 消费端分别已验证** | 真实 HTTP/浏览器重连联动尚待签收 |
| R07/R08 部分成功、取消不丢效果 | **隔离 Host＋Owner 已验证** | 纳入最终恢复/故障综合验收 |
| R09 同 Run 断线重连 | **实现/代码与局部测试已验证** | 真正断线 HTTP/浏览器整链的业务不重发证明 |
| R10 步骤上限、时间截止 | **已验证** | 汇总 #845/#848 |
| **R10 实际费用计量和硬预算** | **未完成** | 真实 provider usage、可信价格口径、持久费用账与硬拦截 |
| **真实 HTTP／浏览器恢复整链** | **待最终验收** | Eidos+真实 Host/PG、重复/缺口/中断/恢复同 Run、截图/网络证据 |
| **R01–R10 综合证据签收** | **未完成** | 一张逐项有链接、有负向测试、有未覆盖说明的证据账 |
| **PA-02 整体** | **IN_PROGRESS / NOT_PRODUCTION_READY** | 上述剩余闭环后才 DEV_COMPLETE；生产部署独立准入 |

这是**固定验收清单**，不是任意 PR 计数，也不是笼统完成百分比。以后报告在表后附：本轮新完成／阻塞／范围是否偏移／PR 合并、提交与分支清理情况。

## 4. 研究结论与决策最小摘要

- **源码事实**：旧 SSE 事件是内存环形重放，不等于可跨进程的 Run 持久 Outbox；原 Eidos `thread.resume` 曾未接 `run.events`；模型返回 usage 不等于持久货币费用。出处见详细索引 P10–P13。
- **工程判断**：采用既有 PG Run/Receipt、事务 Outbox、Owner Evidence、单 Run 继续；排除重复造执行器、直接把 SSE 当权威、ACK 丢失盲重试、未批准的价格估算及为了 PA-02 自动迁移全部企业资源。比较适用条件/限制见详细索引 §4。
- **来源冲突**：旧 10-13/10-14 #832 手册曾写部分模块“尚未接线”，而 #839–#848 已改动；按实际最新 main/合并 PR 为准，保留旧手册作历史；不要覆盖旧研究文档。
- **外网研究状态**：本窗口没有公共 Web 页面全文、搜索摘要或新网页截图；旧 14 条公共技术链接只是从 10-13/10-14 已存档索引继承，全部**H＝历史转引、原文待核**。详见[详细索引 §3](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md#3-历史外部网页参考原始-url-完整保留但本窗口未访问外站)；不要补造 PostgreSQL/模型费用官方 URL。
- **易失附件**：本窗口新的 PA-02 R05/R06 真实浏览器截图／录屏不存在；只有 GitHub CI 可检索日志和可重跑源码测试。PA-01B2 旧 Chromium artifact URL 已保存在详细索引 §6，**非本窗口观看证据**。

## 5. 下一窗口读取顺序和待做任务

1. 先读 `AI-BOOTSTRAP.md`、`LLM.md`、[项目交付规则](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)，再查询**当时最新 main SHA、开放 PR、并行 owner**。本资料包是状态入口，不改 `project.status.json` 等全局 authority。
2. 阅读本短入口；按任务跳转[详细索引](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md) 的代码/来源、CI URL、历史外部资料等级、方案取舍和恢复锚点。**不重启 PA-00/PA-01 和已合并的 #839–#848**。
3. **下一优先级：R10 真实费用计量及硬预算**，先核 `contracts/llm.ts`、`agents/enterprise-agent/openai-responses-model.ts`、`agents/enterprise-agent/pa02-async-read-worker.ts` 的 usage 与 Run 持久证据；必要时查证**真实安装模型**官方 price/usage 文档并记实际阅读日期、固定版本与成本策略，不能编造定价。小 PR 包含真实负向 hard-budget 测试、旧 Owner receipt 安全保存。
4. **真实 HTTP + Chromium 整链**：复用 #844 Host PG 与 #847 Eidos 恢复，验证断线、重复事件、缺口、取消、重启、跨 scope，不创建第二个 Run、不重发业务效果；记录可复跑脚本、日志、Run/receipt ID 与截图 artifact。隔离环境，不生产部署。
5. **最终 R01–R10 证据签收**：按总纲逐项核验并保留真实缺口；只有达到原计划所有门禁再宣布 PA-02 DEV_COMPLETE。PA-03 另起，不预先挪任务。

**本资料交接用分支**：`docs/pa02-window-closure-research-handoff-20261014`，预计合入 main 后删除；新窗口应仅使用 `main`，不要从本历史过程分支继续开发。准确资料包 PR merge SHA 由 GitHub 实际合并结果给出，不能预填。
