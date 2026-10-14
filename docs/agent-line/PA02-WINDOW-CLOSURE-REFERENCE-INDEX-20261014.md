# PA-02 收尾窗口：研究来源、证据与方案决策详细索引（2026-10-14）

**Document class:** SESSION_RESEARCH_SOURCE_LEDGER / HISTORICAL_SNAPSHOT  
**Repository:** https://github.com/jiangxng/EVO-App-Platform  
**本窗口最新快照基线:** `main@d8e25efd008c88f2e51f5928b797fe2d07896305`；**不是交接 PR 合并后的永久 HEAD**。  
**入口:** [PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md](PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md)。  
**最早一份同日历史资料:** [WINDOW-RESEARCH-SOURCE-INDEX-20261014.md](WINDOW-RESEARCH-SOURCE-INDEX-20261014.md)；它的业务基线为旧 #832，不能代替本次 #839–#848 的新结果。

## 0. 阅读等级、可复核性和来源事实

| 等级 | 含义 |
|---|---|
| **G-FULL** | 本窗口直接通过已连接 GitHub 读取文件较完整原文。原文指**项目仓库文件**，并非外部技术网站。 |
| **G-PART** | 本窗口读取过仓库原文相关段落／函数／片段；没有声称审阅全部代码。 |
| **G-LOG** | 本窗口读取过 GitHub Actions Job 原始日志、测试条数或测试命名断言。日志会过期。 |
| **M** | 实际通过 GitHub 取得 PR、提交、工作流、检查或分支元数据；**不是**原文或浏览器现场演练。 |
| **H** | 通过**较早已保存的研究索引**继承外站 URL／历史摘要；本窗口未打开网站原文，历史记录不能升级为“已读全文”或“搜索摘要”。 |
| **S** | 仅阅读搜索结果摘要：**本窗口 0 条**，未使用公共 Web 搜索结果作为研发依据。 |
| **U** | 尚未验证：真实生产／浏览器全链、费用硬预算、最终阶段签收等。 |

**查阅日期口径**：下列 G/M/G-LOG 为 **2026-10-14**；CI 时间戳为 GitHub UTC。H 类记录的“旧索引归档日”是 2026-10-10/11/13/14 的历史链，**不等于对应外网原文访问日**。所有链接是原始 GitHub 或外部 URL，不凭记忆制造页面和截图。

## 1. 本窗口实际查阅的项目一手资料（源码、契约与设计）

下表给出**标题及永久原始 URL、阅读级别、日期、关键章节／符号、用途**。固定 `blob/<merge SHA>/` 避免未来 main 更新导致证据漂移。

| ID／级别／日期 | 标题和原始 URL | 原文事实与定位锚点 | 对 PA-02 的用途 |
|---|---|---|---|
| P01 **G-PART** 10-14 | [Personal Agent 建设总纲 v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/28e4a0342ed5615207624fc88822207899f4b54d/docs/roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) | `§21` 预算及失败、`§25` R01–R10 原始验收表（约 745–754 行）、`§26.2` PA-00～06（约 850–860 行）、`§27` RUN-01～05（约 887–892 行）。R10 明列步骤／时间／费用，而 PA-04 的长上下文总 token 预算**是另一个阶段**。 | **唯一原始范围与完成条件**；R10 未证明费用不能签收，拒绝把 PA-03～06 混入 PA-02。 |
| P02 **G-FULL** 10-14 | [项目开发交付规则](https://github.com/jiangxng/EVO-App-Platform/blob/d8e25efd008c88f2e51f5928b797fe2d07896305/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | `§1–3`：最小可验收闭环＝短分支/单 PR／同 PR 修复→必需 CI→合入 main→核实过程分支删除；生产部署和 DEV_COMPLETE 分开。 | 约束此交接的 GitHub 工作法；不覆盖 BEX/2D 主线。 |
| P03 **G-PART** 10-14 | [已有 Agent HANDOFF（历史日志）](https://github.com/jiangxng/EVO-App-Platform/blob/d8e25efd008c88f2e51f5928b797fe2d07896305/docs/agent-line/HANDOFF.md)、[2026-10-13 阶段快照](https://github.com/jiangxng/EVO-App-Platform/blob/d8e25efd008c88f2e51f5928b797fe2d07896305/docs/agent-line/PA02-STAGE-GATES-SNAPSHOT-20261013.md) | 旧“尚未接 Host”反映 10-13 历史状态；后续已被新 PR 逐项推进。 | 新窗口不得按旧快照重做 PA-02A/B/C 或宣布全部已完成。 |
| P04 **G-FULL** 10-14 | [2026-10-14 早先研究来源索引](https://github.com/jiangxng/EVO-App-Platform/blob/d8e25efd008c88f2e51f5928b797fe2d07896305/docs/agent-line/WINDOW-RESEARCH-SOURCE-INDEX-20261014.md)、[旧方案取舍](https://github.com/jiangxng/EVO-App-Platform/blob/d8e25efd008c88f2e51f5928b797fe2d07896305/docs/agent-line/WINDOW-RESEARCH-DECISIONS-GAPS-20261014.md) | `§1` 阅读等级；`§2–3` 旧 GitHub 代码/PR；`§4` 14 条外部网页**仅历史转引**；`§5` 可过期 CI artifacts。 | **保留前窗口参考遗产**；本轮不抬升那 14 个网页的阅读级别。 |
| P05 **G-PART** 10-14 | [正式 Server 入口](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/manager/server.ts)、[异步 Host 运行时](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/manager/agent-async-read-worker-runtime.ts) | `APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE` 及 `OWNER_SANDBOX` 装配；正式 `run.*`、`thread.send` 共用可选 PG worker，生产默认 READ-only/OFF。 | 校验真正 Host 接线而不是单独 fixture；**不默许生产 WRITE**。 |
| P06 **G-PART** 10-14 | [Host 可信 Owner 注册与授权](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/manager/agent-trusted-owner-registration.ts)、[沙盒业务接线](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/manager/agent-pa02-sandbox-object-extension.ts) | `createHostRegisteredAgentOwnerRegistryV040`、`isAuthorized`：已安装 WRITE Capability、AI 身份/enterprise/资源级授权必须同时满足；`pa02-sandbox:*` scope、两份独立 `pa02_*` schema、显式非生产确认。 | 复用平台授权；模型不能自己登记 Owner，业务文件权威冲突时拒绝。 |
| P07 **G-PART** 10-14 | [通用 Capability 工具目录](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/agents/enterprise-agent/capability-fabric-tools.ts)、[受治理 Worker WRITE port](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/agents/enterprise-agent/pa02-governed-worker-write-port.ts) | Eidos 普通目录是 **generic Capability search/invoke** 而非自动暴露独立 Object Extension 业务 tool；Owner 已核验的模型工具描述必须由 Host 授权后添加，不得走通用 catalog 的无回执 WRITE。 | #841 真正工作台业务 Owner 的关键适配发现；不建设第二套执行器。 |
| P08 **G-PART** 10-14 | [Object Extension SQL Owner](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/apps/object-extension/agent-owner-postgres.ts)、[业务资源迁移记录](https://github.com/jiangxng/EVO-App-Platform/blob/f7b722ed8121cab39b644a52d5904b2aee4c0f83/docs/agent-line/PA02-OBJECT-EXTENSION-RESOURCE-MIGRATION-20261014.md) | PostgreSQL Owner business row 与独立不可变证据；离线旧 `enterprise-resources.json` 迁移的存在**不等于**正常 Human Provider 已切换或生产已迁。 | R04 业务已提交 ACK 丢失核验；避免把 Provider 大迁移塞成 PA-02 前置。 |
| P09 **G-PART** 10-14 | [原子取消](https://github.com/jiangxng/EVO-App-Platform/blob/b8b502b7fe5eb5770e981a8627598fa29e87d423/agents/enterprise-agent/pa02c-atomic-run-cancel.ts)、[Owner Reconciler](https://github.com/jiangxng/EVO-App-Platform/blob/b8b502b7fe5eb5770e981a8627598fa29e87d423/agents/enterprise-agent/pa02b-owner-reconciliation.ts) | `commitSafe`、`listPending` 与 `reconcile`；Owner 已提交但 Worker 失去 fence 时，同事务保留 verified Receipt + CANCELLED；`INVOKING/UNKNOWN` 只核查，绝不重新执行 WRITE。 | R04、R07、R08；真实业务效果不能被取消态掩盖。 |
| P10 **G-PART** 10-14 | [Run 事件持久化](https://github.com/jiangxng/EVO-App-Platform/blob/126f5ef730458999e14b51a15d388938bf769a3b/agents/enterprise-agent/pa02a-postgres-durability-proof.ts)、[Host Outbox 读取](https://github.com/jiangxng/EVO-App-Platform/blob/126f5ef730458999e14b51a15d388938bf769a3b/manager/agent-pa02-run-outbox.ts)、[Run Action](https://github.com/jiangxng/EVO-App-Platform/blob/126f5ef730458999e14b51a15d388938bf769a3b/agents/enterprise-agent/run-action-handlers.ts) | SQL `agent_run_events` 触发同事务 `agent_run_outbox`；`enterprise-agent.run.events` 授权游标读，按每 Run ordinal 检缺口并返回权威 Run 快照。 | R05 重复投递去重；R06 事件缺口不丢最终状态/回执；不拿全局 seq 当单 Run 邻接。 |
| P11 **G-FULL / G-PART** 10-14 | [原 SSE 内存环形缓冲](https://github.com/jiangxng/EVO-App-Platform/blob/126f5ef730458999e14b51a15d388938bf769a3b/manager/realtime-event-bus.ts)、[Eidos 恢复消费器](https://github.com/jiangxng/EVO-App-Platform/blob/dbc6112a794fea401078e662c211670ff877a750/vendor/eidos/src/app-host/personal-agent-run-event-recovery.ts)、[Thread 恢复入口](https://github.com/jiangxng/EVO-App-Platform/blob/dbc6112a794fea401078e662c211670ff877a750/vendor/eidos/src/app-host/personal-agent-thread-chat.ts) | SSE `replayAfter` 只对当前进程环形缓冲重播，不能跨进程代替持久 Run；Eidos 恢复通过 Host `run.events` 分页、去重、缺口转 snapshot，旧版 Host 缺 Action 仍走原 Thread 路径。 | R05/R06 客户端接线，保留 R09 同 Run 恢复；**模拟 Host 验证，不是完整 HTTP 浏览器验收**。 |
| P12 **G-PART** 10-14 | [模型与循环限制 Worker](https://github.com/jiangxng/EVO-App-Platform/blob/28e4a0342ed5615207624fc88822207899f4b54d/agents/enterprise-agent/pa02-async-read-worker.ts)、[Run reducer/store](https://github.com/jiangxng/EVO-App-Platform/blob/28e4a0342ed5615207624fc88822207899f4b54d/manager/agent-run-store.ts)、[Run 合同](https://github.com/jiangxng/EVO-App-Platform/blob/28e4a0342ed5615207624fc88822207899f4b54d/contracts/agent-run.ts) | `MODEL_INFERENCE_FAILED` 持久递增连续模型失败数；3 次封顶；整个 Run 24 slices，不随重连重置；按持久 `createdAt` 检查默认 72h 截止，超额 BLOCKED；已确认 Owner effect 优先收尾。 | R03、R10 步骤与时间证据；不能据此升级成“已实施费用硬预算”。 |
| P13 **G-PART** 10-14 | [LLM 合同与 Usage](https://github.com/jiangxng/EVO-App-Platform/blob/28e4a0342ed5615207624fc88822207899f4b54d/contracts/llm.ts)、[Responses Provider](https://github.com/jiangxng/EVO-App-Platform/blob/28e4a0342ed5615207624fc88822207899f4b54d/agents/enterprise-agent/openai-responses-model.ts) | 可见模型响应中 usage/token 口径，但本窗口**没有找到经独立验证的持久 Run 费用账本和批准的单价/硬预算**。没有检索并核验现行商业价格。 | 明确 PA-02 R10 **尚未完成** 的责任边界；单次 token 字段不等于真实货币成本。 |
| P14 **G-PART** 10-14 | [各项实施与负向门禁文档](PA02-HOST-TRUSTED-OBJECT-EXTENSION-EXECUTION-20261014.md)、[正式 Server 沙盒](PA02-HOST-SERVER-SANDBOX-OBJECT-OWNER-20261014.md)、[取消/恢复](PA02C-HOST-OWNER-CANCELLATION-RECOVERY-20261014.md)、[Outbox](PA02-R05-R06-RUN-OUTBOX-REPLAY-20261014.md)、[Eidos](PA02-R05-R06-EIDOS-THREAD-RECOVERY-20261014.md)、[模型/步数](PA02-R03-R10-DURABLE-MODEL-BOUNDS-20261014.md)、[时间](PA02-R10-WALL-TIME-BOUND-20261014.md) | 每个文件的 `原始缺口 / 实施 / 验收 / 限制` 是相应 PR 的业务边界；部分顶部 `CI evidence 待补` 是创建时历史文字，**PR 最终 head/Actions 优先**。 | 新窗口按问题直达对应源码与 CI，不重复阅读整套历史。 |

> 上表相对路径在 GitHub 同目录可点开；访问的是仓库原文而非外部文章，全部查阅日为 2026-10-14。

## 2. 真实 PR 与 GitHub Actions 证据索引

以下 **M** 说明本窗口读取了 PR merged/head/base 元数据；标注 **G-LOG** 的专项还在本窗口读过实际 GitHub CI Job 原始日志和测试计数（有些旧 run 只在当时确认工作流结果）。表中每项末尾记录**明确的实现限制**。

| PR／查阅等级／日期 | 准确合并提交；Actions 原始 URL | 已核实的结论及实施用途；不能过度推断 |
|---|---|---|
| [#839](https://github.com/jiangxng/EVO-App-Platform/pull/839) **M/G-LOG 10-14** | merge `1d2712c9f312b5d0ce46d981c478797cf63b619c`；[Worker PG18 run 38511466369](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511466369) | **13/13 PASS**：正式 Host Run Handler→受治理 SQL Owner→回执；业务已提交但 ACK 丢失的独立核查，不第二次写；没有生产启用。 |
| [#841](https://github.com/jiangxng/EVO-App-Platform/pull/841) **M/G-LOG 10-14** | merge `f7b722ed8121cab39b644a52d5904b2aee4c0f83`；[Host PG18 run 38513320291](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38513320291) | **3/3 PASS**：正常 `thread.send` 从 generic Capability 目录经 Host 授权到 Object Extension Owner；仅 `OWNER_SANDBOX`，不是生产可执行 Provider 切换。 |
| [#842](https://github.com/jiangxng/EVO-App-Platform/pull/842) **M/G-LOG 10-14** | merge `b8b502b7fe5eb5770e981a8627598fa29e87d423`；[PA02C PG18 run 38515066568](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38515066568) | **4/4 PASS**：正在写时取消、丢 ACK、旧 Worker 失租、已发生效果与取消原子保留；旧 PA02B 仅 Owner Receipt 的情况也不伪造模型观察。 |
| [#844](https://github.com/jiangxng/EVO-App-Platform/pull/844) **M/G-LOG 10-14** | merge `126f5ef730458999e14b51a15d388938bf769a3b`；[Host PG18 run 38516903528](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516903528) | **5/5 PASS**：Run Outbox 同事务、重复 eventId 消费去重、缺序号返回 SUCCEEDED Run 快照、重启仍可读、不重复工具。旧内存 SSE 不是主证据。 |
| [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845) **M/G-LOG 10-14** | merge `7e988fa8646f96b2e11b1af5283a146044c8e01d`；[Worker PG18 run 38518119905](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38518119905) | **15/15 PASS**：模型错误 2 次后可恢复／3 次封顶失败无假成功；24 持久 slices 到顶后不能新模型/工具或进程重启绕过。 |
| [#847](https://github.com/jiangxng/EVO-App-Platform/pull/847) **M/G-LOG 10-14** | merge `dbc6112a794fea401078e662c211670ff877a750`；[Eidos P1.7C run 38532064973](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38532064973) | **5 个新消费端回归通过**：Eidos 恢复先读 `run.events`、重复过滤、缺口快照、权限失败/状态矛盾 fail-closed、分页有界；模拟 Host，不是 HTTP/browser 跨进程证明。 |
| [#848](https://github.com/jiangxng/EVO-App-Platform/pull/848) **M/G-LOG 10-14** | merge `28e4a0342ed5615207624fc88822207899f4b54d`；[Worker PG18 run 38532998079](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38532998079) | **16/16 PASS**：72h 过期阻断新模型/工具，持久 Run 重启不复活，新 Run 仍可运行；**不覆盖费用硬预算**。 |

**已确认的质量教训（项目事实）**：#844 第一份 workflow 变更只触发 CI，却**没有把新测试放进 `node --test` 命令**；在同一 PR 修复后才看到 `PA02_R05_R06_HOST_OUTBOX` 及 5/5。#842/#844 曾出现 `PA-01B2` 跨项目 Chrome Mock 模型调用偶发未观测 `MOCK_MODEL_CALL_NOT_SEEN`；曾在不放宽测试的独立 rerun 成功。**工程判断：** 下次必须既看最终 HEAD 全绿，也核对新增场景真的被执行；偶发成功本身不代表根因已修复。

**可重跑的稳定测试锚点**：
- `tests/agent-line/pa02-host-object-extension-owner-execution.test.mjs`、`pa02-host-server-sandbox-object-owner.test.mjs` → #839/#841；
- `tests/agent-line/pa02c-host-owner-cancel-visible.test.mjs`、`pa02b-owner-reconciliation.test.mjs` → #842；
- `tests/agent-line/pa02-host-run-outbox-replay.test.mjs` → #844；
- `tests/agent-line/pa02-r03-r10-durable-model-budget.test.mjs` → #845/#848；
- `tests/app-host/pa02-thread-outbox-recovery.test.mjs`、`durable-thread-chat.test.mjs` → #847；
- `.github/workflows/agent-pa02-host-async-read-execution.yml`、`agent-pa02-async-read-worker.yml`、`agent-pa02c-atomic-run-cancel.yml`、`experience-conversation-thread-p1-7c.yml` → 真实执行配置。

本表的统计是**逐 PR、逐 commit 的局部测试**，不能相加成为 R01–R10 同一最终 integrated-head 的全部实测数。

## 3. 历史外部网页参考：原始 URL 完整保留但**本窗口未访问外站**

来源：本窗口**已读仓库内** [旧来源索引 §4](WINDOW-RESEARCH-SOURCE-INDEX-20261014.md#4-14-条外部网络资料历史转引不是本窗口-web-阅读)。以下每条均 **H / 原文待核**，**外站原文查阅日期无法验证**；旧索引归档在 2026-10-10/11/13/14。本窗口没有公共 Web 搜索，也没有看到这些 URL 的搜索摘要。下述“发现”只是历史交接的**转述**，不是本窗口独立确认。

| H-ID、标题与原始 URL（全为 H，待核） | 历史转述的可能要点（**非本轮来源事实**） | 若需继续核原文的项目用途／优先级 |
|---|---|---|
| H01 [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 有界 workflow 优先 | 未来 Agent 编排复议；PA-02 当前不需重开，低 |
| H02 [Anthropic — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 上下文精简／来源选择 | PA-04 Context 治理，当前低 |
| H03 [Anthropic — Managed agents](https://www.anthropic.com/engineering/managed-agents) | 长运行状态与任务管理 | 若重评持久执行选型再核，中 |
| H04 [Microsoft — Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | Capability 元数据驱动工具 | 已复用本仓 Capability，除非契约变化才核，低 |
| H05 [AG-UI — Events](https://docs.ag-ui.com/concepts/events) | 前端 Agent 事件类型 | 若换 SSE/标准协议时核，低 |
| H06 [A2UI — Catalogs](https://a2ui.org/concepts/catalogs/) | 安全受限 UI 组件目录 | Eidos 生成 UI 未来研究，低 |
| H07 [A2A — Specification](https://a2a-protocol.org/latest/specification/) | 任务委派/终止/artifact | PA-05 External Agent；`latest` 版本变化大，低 |
| H08 [MCP — Security best practices 2025-11-25](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | audience、转发 token、SSRF | 外部 OAuth/MCP 安全，PA-05，低 |
| H09 [Microsoft HAX — Human-AI interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | 人类控制、能力说明 | 未来 Human/Agent 体验验收，低 |
| H10 [Temporal — Workflow execution](https://docs.temporal.io/workflow-execution) | 可靠持久任务/回放 | 作为“为何未引入新引擎”比较对象；本轮**未阅读原文**，中 |
| H11 [W3C — WCAG 2.2 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 触控目标可达性 | Eidos 移动端，非 PA-02 当前阻塞 |
| H12 [W3C — WCAG 2.2 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 状态可感知性 | 真实浏览器恢复 UX 验收需要时核，中 |
| H13 [OpenTelemetry — GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | 模型可观测字段口径 | 费用/usage 可审计时再核版本；中 |
| H14 [OWASP — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | 模型内容不可信 | 现有 Host 强授权由源码验证；若新增攻击模型再核 |

**新窗口优先访问外部原文的顺序（仅当确有需要）：** 针对 R10 费用问题，首先核**实际已安装模型供应商的官方 usage 记账契约、定价版本和计价时间点**（具体 URL 尚未在此窗口检索，**不能编造**）；其次核真实浏览器/HTTP 的现有 Eidos 连接和 CI，必要时看 H12；若改为 Temporal/A2A/MCP 才选读 H10/H07/H08，禁止为了研究本身重访 14 个外站。

## 4. 方案比较：来源事实与工程判断分开

| 主题 | 采用／**工程判断和理由** | 排除或延后／理由 | 适用条件与可证实限制 |
|---|---|---|---|
| Host 执行模型 | **采用**已有正式 Run、PG Fenced Worker、可信 Owner + Reconciler；复用旧契约节省重复实现、保持授权一致。事实锚点 P05–P09、#839/#841。 | 不建第二套 Agent executor、跨插件泛化框架或先全面替换 Enterprise Resources Provider。 | 仅沙盒 Host/独立 PG Owner 跑过；人类旧文件 Provider 与 PG Owner 单一权威尚非生产证明。 |
| WRITE ACK 丢失 | **采用**持久 input digest、Owner 不可变 business evidence、`UNKNOWN` 只核验，Fencing/Receipt 强一致；事实 #839/#842。 | 不在响应失败时直接再次 `Owner.invoke`；不可证明时宁保留 REQUESTED/UNKNOWN。 | 适合可查询业务 Owner idempotency evidence 的插件；尚未覆盖第二业务插件。 |
| R05/R06 数据源 | **采用**与 Run 事件同 SQL 事务 Outbox，按 Run ordinal + eventId 去重，游标异常走权威快照；事实 #844。 | 不以 `manager/realtime-event-bus.ts` 的内存 SSE ring 做跨进程权威；暂不引 Kafka/Redis/新持久引擎。 | PostgreSQL 隔离 Host 通过；生产容量、DB 故障与跨多节点时延要另测。 |
| 工作台恢复 | **采用**现有 Eidos Thread recovery 前置只读 `run.events`，未授权 fail closed，旧 Host 缺 Action 安全回退；事实 #847。 | 不重新设计工作台／自动重新发送用户消息／看到网络错误就新建 Run。 | 新 UI 消费器与模拟 Host 已验证；**尚非真实 HTTP + Chromium + Server 跨故障整链**。 |
| R03 模型失联 | **采用**连续失败次数随 Run 事件持久化、成功重置，最多3次；事实 #845。 | 不在单次 provider 错误直接假成功，也不允许无限/静默跨 provider fallback。 | 失败只计入当前 Run；“真实价格”另需证据。 |
| R10 循环/时间 | **采用**整个 Run 24 slices、基于持久创建时间默认 72h 的安全截止；事实 #845/#848。 | 不仅依赖每 HTTP action 24 步；不在重连时重置时间；不靠浏览器前端计数。 | 会对长待办任务构成需新建任务的边界；继续处理已提交 Owner Receipt 优先于阻断。 |
| R10 费用 | **暂不宣称采用完整方案**；应先核真实 usage、定价版本／币种、上下文 token 实际计量，设计可审计的持久费用账与硬准入；这是**下一步工程判断**，非已验证实现。 | 不伪造 $/1M tokens、缓存价或计费精度；不把 PA-04 token Context 预算或 PA-06 企业配额当 PA-02 任务成本。 | 缺官方已核验供应商价格、可信每次 usage 与硬预算策略，当前 **OPEN**。 |
| 研究方法／协作 | **采用**每个有价值的闭环一短分支/PR，精确 head CI 合并并删除；历史快照只读。事实 P02、#839～#848。 | 不按 PR 数冒充项目完成比例；不推 main、不覆盖 BEX/2D 和全局 status。 | 每一阶段以其原始验收为准；新窗口必须重新读取 main。 |

**注意**：上述“采用”的选择是**用户项目决策＋仓库已有实现／本窗口工程判断**，并非 H01～H14 某个未读网页的官方推荐。来自源码的事实、由 CI 证明的场景、尚未跑过的生产情景必须分开描述。

## 5. 冲突、未解决的问题与最值得继续查阅的方向

1. **旧交接 vs 现 main**：10-13 及旧 10-14 #832 资料中“尚未 Host Owner 接线、R05/R06 待做”属于历史瞬间；#839/#841/#844/#847 已改变状态。解决原则：准确 `main` + 对应 PR merge SHA 优于旧 `CI_PENDING` 文档首段。
2. **“全部 CI 绿色” vs “阶段已验收”**：各专项 Run、PG、模拟 Host 消费端测试成功，不等于同一分支完成真实 HTTP Server + Chromium 断网重连 + OWNER WRITE 效果的整链，也不是生产部署。**不可伪称 R01–R10 已签收**。
3. **旧企业文件存储 vs 新 PG Owner**：独立 PG Object Extension Owner 成功，不代表现 Human UI `enterprise-resources.json` 已整体切换。已做离线迁移不等于在线生产单权威；继续保持 OWNER_SANDBOX 隔离。
4. **R10 费用预算**：模型 `usage` 字段存在，但缺可信持久账本、批准的当前计价来源和执行前 hard budget 证据。最值得下一步查：`contracts/llm.ts`、`agents/enterprise-agent/openai-responses-model.ts`、`pa02-async-read-worker.ts` 的 usage 贯通；精准选读已启用模型的官方价格／响应 usage 文档，保留访问日期及版本；补负向测试（预算不足禁止下一次高成本模型调用；既有 Owner Receipt 仍能核验）。
5. **真实浏览器恢复**：按 #844 服务端与 #847 Eidos 两份不同层的测试固定契约，搭隔离 HTTP + Chromium。用**同一 Run** 验证断网/Tab 重开、事件重复与缺口、取消时已提交业务回执、跨企业拒绝；保存实际 HTTP 状态与 Run IDs、日志、截图／录屏 artifact；失败不得退回新 Run／二次 WRITE。
6. **费用与模型价格版本变化**：官方价格尚未检索，任何未来价格都需记源 URL、获取时间、币种、模型 ID、输入/输出/缓存类别及版本。不得将试算估计当真实费用。
7. **最终 R01–R10 证据签收**：对每项填“断言场景／代码文件／PR merge SHA／最终 CI run／实际环境／未覆盖”，存在尚未证明的窗口就保持 `OPEN`。复用已有的 #799–#837 前置基础证据，不再重做 PA-02A/B/C。

## 6. 易失信息：章节位置、截图／附件及保全状态

| 证据 | 原始位置／可靠锚点 | 本窗口状态和恢复办法 |
|---|---|---|
| **本批 PostgreSQL/Worker/Eidos CI 原始日志** | 本文 §2 七个 `actions/runs/...` 页面；搜索 `PA02_HOST_OBJECT_EXTENSION_GOVERNED_WRITE`、`PA02_SANDBOX_SERVER_THREAD_OWNER`、`PA02C_HOST_OWNER_CANCEL_VISIBLE`、`PA02_R05_R06_HOST_OUTBOX`、`PA02_R03_DURABLE_MODEL_RETRY`、`PA02_R10_PERSISTED_STEP_BUDGET`、`PA02_R10_WALL_TIME_BUDGET`；Eidos 新 test 名在 `pa02-thread-outbox-recovery.test.mjs` | 本窗口看过关键 Job 日志、记录 test 计数；**未导出永久文本日志**。Actions 的日志可能到期，源代码测试保留可重跑。 |
| **R01–R10 原始验收** | 总纲约 745–754 行；`§26.2` 约 850–860 行；`§27` 约 887–892 行 | 已读项目原文；新窗口以精确标题/行锚点找，不凭旧绝对行号推断最新位置。 |
| **Outbox 消费截图/浏览器 trace** | `tests/app-host/pa02-thread-outbox-recovery.test.mjs`、[#847 CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38532064973) | **本窗口没有真实新浏览器截图/录屏 artifact**；只有模拟 Host 的 Eidos 单测。不能提供虚构截图路径。 |
| **历史 PA-01B2 Chromium artifacts** | [Native artifact 11685148470](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018/artifacts/11685148470)、[Full Host artifact 11686346415](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578/artifacts/11686346415) | **H 历史索引转引，未在本窗口下载/打开**。属于 PA-01B2，不是 PA-02 R05/R06 浏览器证据；保底见旧 `PA01B2-FULL-HOST-CHROMIUM-ACCEPTANCE-20261011.md`。 |
| **临时容器文件／本窗口截图** | 无已验证的当前持久路径 | 没有在本窗口新建可交付附件或截图；不能假设旧 `/mnt/data/...` 在新窗口仍存在。 |
| **PR 源分支** | §2 七个合并 PR 中的 `head` 分支 | 此前逐 PR 合并后曾核查删除，**不应依赖已删除的 branch 名取源码**；使用固定 merge SHA。 |
| **费用价格出处** | **无** | 本窗口没有访问真实模型官方现价或保存价格表；下一窗口要先核查再设计 hard budget。 |

## 7. 准确落到下一任务与项目 owner

- **Agent**：`agents/enterprise-agent/pa02-async-read-worker.ts` + `manager/agent-run-store.ts`：R10 可靠 usage/cost 的不可变运行事实；已有 step/clock/retry 不重做。
- **Host/模型提供方**：`contracts/llm.ts`、`agents/enterprise-agent/openai-responses-model.ts`、`manager/agent-async-read-worker-runtime.ts`：计费来源与 usage 绑定真实 modelId/providerId；核准价格和更新规则。若硬预算不能可靠计量，就停在 OPEN 而非虚假美元金额。
- **Eidos**：`vendor/eidos/src/app-host/personal-agent-thread-chat.ts`、`personal-agent-run-event-recovery.ts`：使用现有消费路径做真实 HTTP 浏览器恢复验收，避免重新设计 Chat Workbench。
- **业务 Owner**：`apps/object-extension/agent-owner-postgres.ts`、`manager/agent-pa02-sandbox-object-extension.ts`：仅隔离业务 WRITE 用例；禁止生产自动启用或改为第二套主数据 authority。
- **测试／交付**：`tests/agent-line/pa02-r03-r10-durable-model-budget.test.mjs`、`tests/agent-line/pa02-host-run-outbox-replay.test.mjs`、`tests/app-host/pa02-thread-outbox-recovery.test.mjs` 以及各自 CI workflow；最后产出一张固定状态表和逐项 R01–R10 证据签收。
- **并行冲突**：本资料包的初始 `main@d8e25efd008c88f2e51f5928b797fe2d07896305` 尚有非本线 PR #846 与 #851。不得修改它们的治理/CP-03文档、`project.status.json`、`docs/roadmap/HANDOFF-LATEST.md` 或 2D UI。
- **下一开发分支**：资料 PR 合入并删除后使用 **最新 `main`**，不要恢复本次临时文档分支。**新的 PA-02 R10 费用预算闭环**若可核验，再建立唯一短分支＋PR→CI→merge→delete；否则先生成真实无缺口的阶段证据对账，不设虚假 PR/完成百分比。
