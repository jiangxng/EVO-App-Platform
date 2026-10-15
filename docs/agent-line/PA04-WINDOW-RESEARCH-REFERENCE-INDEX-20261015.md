# PA-04 本窗口研究资料、来源证据与决策详细索引（2026-10-15）

**Document class:** SESSION_RESEARCH_SOURCE_LEDGER / HISTORICAL_SNAPSHOT  
**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**一手固定快照：** [`main@615fbf3f7d79e2155245b313b0767bbbcaacb9a3`](https://github.com/jiangxng/EVO-App-Platform/commit/615fbf3f7d79e2155245b313b0767bbbcaacb9a3)（#901 合并后、交接 PR 合并前；**非永久 HEAD**）。  
**简短入口：** [PA04-WINDOW-HANDOFF-ENTRY-20261015.md](PA04-WINDOW-HANDOFF-ENTRY-20261015.md)  
**本轮动态验收真相：** [C01–C06 台账](PA04-C01-C06-READINESS-LEDGER.json) / [收敛说明](PA04-C01-C06-CONVERGENCE.md)。  
**查阅日期说明：** 本窗口直接 GitHub 阅读及验收集中于 **2026-10-15**；下表引用固定快照。原总纲的外部资料署名“2026-10-10 查阅”只表示**历史作者自述**，不表示此聊天再次查过官网。

## 0. 阅读层级与重要防伪说明

- **G-FULL**：本窗口确实通过 GitHub 连接取得并核对相关源文件的主体或完整关键逻辑；**G-PART**：取得原文但只分析指定小节/代码范围，不能假称逐行审计。
- **G-LOG**：实际从 GitHub Actions 读过 Job 原始日志，包括测试通过数、关键 PG 证据标记；**G-META**：实际查询过 PR/Issue、commit、main、开放 PR 或 workflow 状态，**只说明那个时间点**。
- **H-UNREAD**：官网 URL 仅存在已读取的旧 GitHub 文档清单/上轮历史 handoff，**此窗口没有通过互联网打开相应原文或搜索摘要**。此类资料下面的“主题”是旧项目文档**转述**，不能当本窗口已核原文的事实。
- **J-DECISION**：用户明确指定或本窗口根据仓库代码/隔离测试作的工程判断，而非引用文档作者、官网或模型作为绝对权威。
- **日期区分**：本包的 GitHub **复核日期**为 2026-10-15，原 blueprint 2026-10-10 的文献查阅日期为历史记录；未知的首次访问日期一律不编造。本轮无直接外站 W-FULL、W-PART 或 W-SEARCH-SNIPPET。

## 1. 本窗口真正读取的 GitHub 原始资料（固定链接）

| ID | 标题／原始 URL（固定 commit） | 直接查看日期／等级及章节 | 来源可以支持的具体发现 | 对 EVO 的具体用途 |
| --- | --- | --- | --- | --- |
| G01 | [原始 Personal Agent 建设总纲](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) | 2026-10-15，G-PART；§15、§19.3、§21.1–21.3、§22.1、§26.2、§30.3 | C01–C06 原条款；PA-03 导入闭环与 PA-05 插件认证原定义。依据而非运行事实 | PA-04/05/06 工作包、验收门槛、PA-03 接口边界 |
| G02 | [AI-Native State & Context 宪法](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) | 2026-10-15，G-PART；§3–§10、§14、§18 | Conversation≠Memory≠Working State；版本/来源/可追溯；模型不持有企业业务权威 | C01/C02/C04 与 PA-05 持久状态所有权 |
| G03 | [项目开发交付规范](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | 2026-10-15，G-FULL（主要规则） | 一任务一个活动 PR、CI 后合并和清分支；隔离证据≠上线；并行 owner 边界 | 所有 PA-05/06 工作和新窗口启动规则 |
| G04 | [Agent 专项交付治理](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/agent-line/AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md) | 2026-10-15，G-PART；通则与分支 | 项目规范优先；轻量宿主；未授权不部署、不代管别的 owner 分支 | PR/branch 协作 |
| G05 | [PA-02 当前验收](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/agent-line/PA02-CURRENT-ACCEPTANCE.md) | 2026-10-15，G-PART；R10 与阶段结论 | 真实货币 R10 NOT_SIGNED，已有技术证据不能代替供应商价格/账单 | #879、首次本地部署和 PA-06 发布前提 |
| G06 | [上个 PA-02 短入口](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/agent-line/PA02-WINDOW-HANDOFF-ENTRY-20261015.md) | 2026-10-15，G-FULL（相关段） | R10 方案 B 以用户本窗口新决策为准；历史外站的阅读等级是前窗口历史 | 跨窗来源分级与遗留依赖 |
| G07 | [上个 PA-02 研究索引](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/agent-line/PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) | 2026-10-15，G-PART；§0–§2 | OpenAI/DeepSeek 的 W/H 访问等级来自旧窗口；本窗口未重新打开官网 | 保留历史网研遗产、不伪造新访问 |
| G08 | [PA-04 动态验收状态](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/agent-line/PA04-CURRENT-ACCEPTANCE.md) | 2026-10-15，G-FULL（C01–C06及各局部闭环） | 九次迭代决定、接口边界、未签收事项、风险和真实 Owner 分层 | PA-04 未签收真实义务，下一阶段复用 |
| G09 | [PA-04 六项收敛说明](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/agent-line/PA04-C01-C06-CONVERGENCE.md) | 2026-10-15，G-FULL；六项对照表 | 项目工程证据、实际 Host 依赖、责任与验收证据区分 | PA-05 前阶段限制和 PA-06 试点准备 |
| G10 | [PA-04 机器证据台账](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/docs/agent-line/PA04-C01-C06-READINESS-LEDGER.json) | 2026-10-15，G-FULL；gates C01–C06 | 六项 ISOLATED_PROVEN、signed=false；PA-02 R10 OPEN；生产不可发布 | 自动核验签收字段与未解决问题 |
| G11 | [Conversation Context 契约](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/contracts/conversation-context.ts) | 2026-10-15，G-FULL（相关接口） | Summary provenance sourceDigest；Host 来源撤销 Port | C02 派生删改与兼容 |
| G12 | [Context 组装与内存 store](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/manager/conversation-context-assembly.ts) | 2026-10-15，G-PART；摘要选择、源校验与撤销 | 当前消息序列/内容指纹决定旧摘要是否可复用，Memory tombstone 阻止旧写 | C01/C02 不丢源设计 |
| G13 | [Context PostgreSQL store](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/manager/conversation-context-postgres-store.ts) | 2026-10-15，G-PART；DDL、保存/撤销事务 | 按线程 tombstone、防重写、摘要 checkpoint 删除、legacy JSONB 格式 | C02 PG18 与源失效传播 |
| G14 | [Context Window 精确校验](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/agents/enterprise-agent/pa04-certified-context-window.ts) | 2026-10-15，G-FULL | model/provider 精确匹配、完整请求可信上界、输出 token 预留、不可证明 fail-closed | C01 真实本地模型 tokenizer 接口 |
| G15 | [旧对话优先级收敛](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/agents/enterprise-agent/pa04-prioritized-context-history.ts) | 2026-10-15，G-FULL | 只允许减少普通旧 history；最新4条、当前 Human、工具/系统/工作观察保留 | C01 Working State 和长对话 Human E2E |
| G16 | [PA-02 Worker 当前 PA-04 接点](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/agents/enterprise-agent/pa02-async-read-worker.ts) | 2026-10-15，G-PART；输入/观察/工具/恢复门禁 | C01 token、C03 READ fresh、C05 Host tool admission 都在 Provider 调用/工具执行前独立验证 | PA-05 插件调用路径复用 |
| G17 | [Host Worker 装配](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/manager/agent-async-read-worker-runtime.ts) | 2026-10-15，G-PART；deps 与工厂 | C01/C03/C05 可选 Host 端口按需注入，不自动等于生产已启用 | PA-05 capability owner/freshness/egress 接入 |
| G18 | [Provider 模型适配](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/agents/enterprise-agent/provider-model.ts) | 2026-10-15，G-FULL | 工具观察标不可信；未知、无效、多工具调用不得假报成功 | C05 防注入、PA-05 工具契约 |
| G19 | [Run 事件与物化](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/contracts/agent-run.ts) | 2026-10-15，G-PART；事件/刷新契约 | READ_REFRESH_RECORDED 契约、Run 决策/观察信息 | C03 审计/恢复 |
| G20 | [持久 Run 物化](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/manager/agent-run-store.ts) | 2026-10-15，G-PART；刷新状态与事件 | 旧 READ 原始事件不改写，新观察作为当前模型视图 | C03 资源版本及下游显示 |
| G21 | [Host 能力目录](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/agents/enterprise-agent/host-tool-catalog.ts) | 2026-10-15，G-PART；Memory read、工具效果 | C06 源授权覆盖搜索、回忆、清单、审计；现有工具目录/Owner 权限 | PA-05 插件认证的候选接入点 |
| G22 | [来源引用展示门禁](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/agents/enterprise-agent/pa04-memory-reference-disclosure.ts) | 2026-10-15，G-FULL | Memory 与来源须按当前 Principal/Context 逐项授权；标题/引用/URL 都不泄漏 | C06 真实附件与资源级授权 |
| G23 | [Memory 提案治理服务](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/manager/context-memory-proposal-service.ts) | 2026-10-15，G-PART；edit/accept/reject | Human-only 审批下沉服务，AI 提案不直接晋升企业事实 | C04 + PA-05 用户直接/Agent 效果一致 |
| G24 | [Memory Review Actions](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/manager/context-memory-proposal-actions.ts) | 2026-10-15，G-PART；Human 确认入口 | 原 UI 已有 Human 门禁；服务级加固避免绕过 | C04 Human 体验和授予保护 |
| G25 | [Memory Store / Writer](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/providers/context-memory/runtime.ts) | 2026-10-15，G-PART；Host Reader/Writer | 记忆治理由 Host Writer/Reader 管理，未创建第二记忆库 | C04 来源/删除/企业隔离 |

**索引质量边界：** 源文件实际内容以固定 SHA 链接为准；本窗口没有访问原始其它仓库的最新 main、不能把总纲中对 EVO、eidos、Experience-Compiler 的历史代码链接说成本轮实读。PR 合并前后完整内容需以各次 PR files 和最终 `main` 重新比较。

## 2. 本窗口一手 GitHub PR / Actions / 测试事实

**九个 PA-04 PR 经逐轮检查均 MERGED，交付功能已在 main；所有九个过程分支已在合并后核对删除。** 下列 PR 页面含讨论、版本变更、changed files 和最终检查；不是外部研究文献。

| PR | 主题与本窗口核对证据 | 结果／限制 |
| --- | --- | --- |
| [#889](https://github.com/jiangxng/EVO-App-Platform/pull/889) | C02 摘要来源指纹；`tests/protocol/pa04-source-summary-invalidation.test.mjs` | merged；不是原始数据删除 |
| [#891](https://github.com/jiangxng/EVO-App-Platform/pull/891) | C01 Token 认证边界；`tests/protocol/pa04-certified-context-window.test.mjs` | merged；没有真实本地 tokenizer |
| [#892](https://github.com/jiangxng/EVO-App-Platform/pull/892) | C01 最近对话及 Host Working State 保留；`tests/protocol/pa04-prioritized-context-history.test.mjs` | merged；不自动提炼所有远古决策 |
| [#893](https://github.com/jiangxng/EVO-App-Platform/pull/893) | C02 PG18 tombstone；[专项 run 38668765032](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38668765032) | merged；真实源删改/EC 仍未接线 |
| [#895](https://github.com/jiangxng/EVO-App-Platform/pull/895) | C03 READ v1→v2、重连/失权；PG18 Job 原始日志在本轮检查过 | merged；生产资源版本凭证待验证 |
| [#897](https://github.com/jiangxng/EVO-App-Platform/pull/897) | C06 Host Memory source disclosure；专用测试 37 项成功 | merged；并非真实资源下载认证 |
| [#898](https://github.com/jiangxng/EVO-App-Platform/pull/898) | C04 Human-only Review 服务保护；专项测试 21 项成功 | merged；Human/业务权威签收待定 |
| [#900](https://github.com/jiangxng/EVO-App-Platform/pull/900) | C05 注入恶意文件、模拟外发目标零副作用；专用 PG 测试 8 项成功 | merged；真实安全网络出口仍未接入 |
| [#901](https://github.com/jiangxng/EVO-App-Platform/pull/901) | 统一运行 C01–C06 九组现有套件 + readiness；[run 38673188190](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38673188190)，**42 tests / 42 pass / 0 fail**，另最终 **5/5 CI** | merged commit `615fbf3f7d79e2155245b313b0767bbbcaacb9a3`；本轮一手最完整的汇总，但仍然 **ISOLATED_PROVEN / NOT_SIGNED** |

**统一证据的稳定目录及短期附件定位**：

- [聚合 workflow](https://github.com/jiangxng/EVO-App-Platform/blob/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/.github/workflows/agent-pa04-c01-c06-consolidated.yml)：锁定 PostgreSQL18，执行 C01–C06 的全部九份协议/PG 证据文件和验收台账防假签测试。
- [CI run #38673188190](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38673188190) 的 job 里实际打印：`PA04_C01_CERTIFIED_CONTEXT_WINDOW`、`PA04_C01_HISTORY_PRIORITY_PG`、`PA04_C02_DERIVED_REVOCATION_PG`、`PA04_C03_FRESH_READ_PG`、`PA04_C05_TOOL_INJECTION_PG`，统计 `42 pass/0 fail`。本轮**实际读过 Job 日志**（G-LOG）。
- 同一 run 上传 Actions artifact `pa04-c01-c06-isolated-evidence`，workflow 中配置 `retention-days: 14`；**没有在本窗口将二进制 artifact 另行下载永久归档，过期后依靠 Github workflow 文本和 PR 重新生成证据**。
- 九份原始可重放测试在 [`tests/protocol/`](https://github.com/jiangxng/EVO-App-Platform/tree/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/tests/protocol) 与 [`tests/agent-line/`](https://github.com/jiangxng/EVO-App-Platform/tree/615fbf3f7d79e2155245b313b0767bbbcaacb9a3/tests/agent-line)；新增验证台账字段的 `tests/protocol/pa04-convergence-readiness.test.mjs` 不改变运行算法。
- **本窗口未创建或保存图片截图，也未保存私有 Provider 密钥、真实费用账单、用户录像或生产业务附件。** 不可把 CI 中的隔离模型/模拟身份说成真实环境的操作截图。

## 3. 原总纲列出的外部公开研究：原网址完整保留，全部仍待本窗口直接验证

**以下 14 条均是 G01 建设总纲 §30.3 的历史转引**（其原作者记录过 2026-10-10 研究）；本窗口 **2026-10-15 只读了 GitHub 里的目录，没有访问或搜索外网原文**。不要把这张表的用途视为外站已经亲自证实的结论。

| ID | 标题／原始官网 URL | 本窗口看到日期与实际访问状态 | 旧总纲所赋予的主题和未来用途（未独立核实） |
| --- | --- | --- | --- |
| S01 | [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 可组合 workflow 和动态 Agent 分工（仅总纲转述）；PA-05 不重造 executor |
| S02 | [Anthropic — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 高信号上下文、按需读取和压缩（转述）；C01 后续真实模型配置 |
| S03 | [Anthropic — Managed agents](https://www.anthropic.com/engineering/managed-agents) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 持久会话/harness 分层（转述）；PA-06 多模型/运维 |
| S04 | [Microsoft — Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | tool/knowledge 描述元数据（转述）；PA-05 插件语义契约 |
| S05 | [AG-UI — Events](https://docs.ag-ui.com/concepts/events) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 事件互操作参考（转述）；PA-05/06 前端标准，不表示兼容 |
| S06 | [A2UI — Catalogs](https://a2ui.org/concepts/catalogs/) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 受控组件目录（转述）；未来 UI 不替代 Eidos |
| S07 | [A2A — Specification](https://a2a-protocol.org/latest/specification/) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 远端 task/artifact/取消（转述）；动态 latest 必须版本锁定 |
| S08 | [MCP — Security best practices（2025-11-25）](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 受众/令牌/SSRF（转述）；PA-05 外部插件必须重新核实版本 |
| S09 | [Microsoft HAX — Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 用户可知/可纠错（转述）；C04 Human UX |
| S10 | [Temporal — Workflow execution](https://docs.temporal.io/workflow-execution) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 持久 workflow 历史重放（转述）；当前无引入产品决定 |
| S11 | [W3C — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 目标尺寸（转述）；与 Eidos 自定义规范区分 |
| S12 | [W3C — Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 状态通知可访问性（转述）；PA-06 运营 UI |
| S13 | [OpenTelemetry — Generative AI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 观测指标语义（转述）；PA-06 前锁定版本/隐私 |
| S14 | [OWASP — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | 2026-10-15 仅在总纲 §30.3 看到；官网 **H-UNREAD / 待验证** | 提示注入分层风险（转述）；C05/PA-05 安全，但本窗口未读官网 |

**前一个 PA-02 窗口遗产，不属于本窗口新增查阅：** [历史来源索引](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) 将 [OpenAI Input Tokens](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens) 记为 W-FULL、[DeepSeek Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion/) 记 W-PART、[OpenAI Responses Create](https://platform.openai.com/docs/api-reference/responses/create) 记 W-ATTEMPTED-NOT_READ、[OpenAI Pricing](https://platform.openai.com/pricing) 记 W-SEARCH-SNIPPET。**这里只复用前窗已保存的访问等级；本窗口没有复读这四个官网，不得把它们写成本轮 W-FULL。** 这些 Provider URL 的报价、模型上下文和用量接口变化快，后续选真实本地/云模型须单独核最新版本和计费条款。

## 4. 采用、排除和适用条件：来源事实与项目判断分开

| 议题 | 直接证据事实（G） | 本窗口采取的 J-DECISION / 理由 | 排除的替代方案与限制 |
| --- | --- | --- | --- |
| 长对话 | AF-02 有原文+摘要/检查点；#891/#892 提供最终模型完整请求校验 | **采用可信完整 Token 上界、输出预留和低优先级历史受控压缩**；优先保护指令/授权/当前 Human/最近4条 | **排除**按字符数猜 Token、任意截断系统/工具/当前意图；旧聊天内未结构化关键决定仍可能受损，待 Working State |
| 来源删除 | #889 过期摘要指纹；#893 PG 源 ID tombstone/派生清理 | **采用来源 owner 明确授权、源范围标识和派生拒写**；既有 PG 不重做 | **排除**把归档当物理删除或擅删永久审计；EC/Memory/备份必须另设合法删除传播 |
| 任务恢复 | #895 完成 READ 来源版本新鲜度与刷新事件 | **采用 Host 当前 READ 版本核验与重新读取，保留旧审计** | **排除**恢复时直接将旧观察当新事实；当前端口为 opt-in，真实插件待接入 |
| 记忆修正 | 既有 Proposal Review，#898 服务层 Human-only 保护 | **采用人审、可纠正、可追踪 supersession**，不重新做记忆存储 | **排除**Agent 自批准提案为企业事实；Human 接受也不自动取代资源 Owner 的事实权威 |
| 提示注入 | #900 真实 PG 隔离模拟恶意文档→外发调用→零次实际外发工具执行 | **采用工具观察低信任标识 + Host 对准确调用参数/目标二次授权** | **排除**只靠提示词、只看工具 ID 存在即授权；真实 egress/重定向控制未覆盖 |
| 引用失权 | #897 Memory 搜索/回忆/审计当前源披露门禁 | **采用按当前 Principal+来源 Context 检查后出站，失权整批不暴露** | **排除**仅检查 Memory 所属 Context；历史 Run/真实下载需要额外即时鉴权 |
| 验收分层 | #901 在同环境 42/42，但六 gate ledger `signed=false` | **采用工程隔离通过 ≠ 产品真实 Human 通过 ≠ 生产批准**，以证据记录和 Owner 区分 | **排除**9 PR=100% 阶段完成、测试绿=已上线。真实阶段外部依赖仍全部开放 |
| PA-03 与 BEX 并行 | 原总纲 §26.2 PA-03 I01–I10；当前 BEX PR 仍开放 | **采用先 PA-04/05/06，再等 BEX 完成回来验 PA-03**（用户明确授权的排期调整），同时保留 PA-03 Agent 独立闭环 | **排除**把 BEX 映射/UI 修复宣告 PA-03 PASS；排序变化不是删除原始门槛 |
| 首次本地模型 | User 明确计划尝试；C01 仍缺真实 tokenizer；PA-02 R10 #879 OPEN | **模型/Provider 可替换性 + 测定实际窗口/费用** | **排除**假设本地运行不计费用或将 PA-02 R10 改为无条件 PASS；型号、硬件、推理速度未定 |

**适用前提**：本轮通过的认证口大多为 Host **可选注入**；测试固定权限/数据/PG 参数证明门禁按接口工作，**没有**证明线上全部业务页面、插件、网络出口和文件下载已执行这些授权。任何“官方框架推荐如此”的话均应以 S/H 原文复查后才归因；本节 G 是项目源事实、J 是项目工程选择。

## 5. 资料、设计与当前现场之间的矛盾／待解决清单

1. **PA-04 依赖 PA-03 真样本 vs 用户调整时序**：总纲 §26.2 预期 PA-02/03 产生真实样本；用户明确先 PA-04→05→06。已将隔离工程推进至统一证据，但 **Human/业务真实签收不因此自动具备样本**。下一窗口不得把依赖缺口隐藏。
2. **PA-02 先收口 vs R10 仍是原始硬门槛**：用户同意费用实测暂缓，但没有同意删改货币验收；故 `PA-02 IN_PROGRESS / NOT_DEV_COMPLETE` 与 #879 OPEN 合法并存。真正上线是否满足费用条件必须另获授权与证据。
3. **C01 受控裁剪 vs 所有早期决定保留**：当前只固定保留 Host 约束、近端4条和已提供的工作观察；**未证明长对话中任意早期重要决定都能自动被识别并结构化**。优先调查 Working State 提取/确认/来源撤销/冲突。
4. **C02 隐私删除 vs 审计/留存**：派生摘要可被淘汰但原 Conversation/Run、EC、备份/附件可能含合法审计信息；“尽数物理清理”须依 Owner 的留存/法规/删除政策划界。
5. **C03 旧审计需保留 vs 用户不能再看无权来源**：旧 READ 留在持久审计事件；C06 只在 Memory 出站前防漏，历史 Run/Conversation 以及附件/导出未形成全覆盖。
6. **C04 个人 Human 审核 vs 企业来源权威**：用户能纠正个人记忆，**但**不能仅因自己批准就把未经业务 Owner 核验的猜测升级为全企业事实。
7. **C05/C06 opt-in Port vs 生产默认无强制接线**：隔离测试验证防线有效，未证明所有合法/恶意输入流都经过这些 Gate。PA-05 插件认证必须明确哪个 Owner 实际安装并强制执行 Port。
8. **PA-05 新插件不改 Agent 核心 vs 各个插件能力多样**：总纲 §21.1 要求完整插件包（manifest、schema、operation、assistance、receipt/导航、learning、certification）；优先找第二个现有真实插件执行直接/Agent 同结果，不把差异都重新编码进 Agent。
9. **原蓝图外部研究日期 2026-10-10 vs 本窗口来源等级**：即使旧作者声称看过某官网，也不能追认本窗口今天读过；相关标准/文档变化可能大，转入 PA-05 或 PA-06 后必须按版本再次核原文。
10. **本窗口 CI 42/42 vs “所有 C gate 正式签收”**：前者只对隔离代码组合有证明力；后者仍需真实模型、删除来源链、权限、Human、网络出口证据及验收人。正式阶段结论仍 `NOT_SIGNED`。

## 6. 优先补查方向及可变资料留存位置

- **PA-05 先核 GitHub 当前代码**：总纲 §21.1–21.3、§26.2；当前 `agents/enterprise-agent/host-tool-catalog.ts`、`manager/agent-async-read-worker-runtime.ts`、平台现有插件 manifest/schema/Capability Owner、2D 已安装能力、原始 PA-01/PA-02 测试。需新读而不是假设所有插件机制已实现。
- **第二业务插件候选**：评估真实支持的不同领域 READ/WRITE/版本效果与受治理 owner；优先无 BEX 冲突、能通过 Human/Agent 相同效果的插件。交易/2D 仅限已认证插件；不能为了满足“第二插件”新建虚假的样板插件。
- **标准/行业来源待核**：PA-05 重点重新打开 S04（generative orchestration）、S08（MCP 安全实践，需确切协议版本）、S07（A2A 规格固定版）；PA-06 可重访 S13（OTel GenAI）与 S03（managed agents）；C05/C06 实际接入前查 S14 与真实资源/下载授权的当前规范。**这些是未来查询建议，不是本轮额外已读**。
- **变化快的 GitHub 状态**：本窗口快照 `main@615fbf3f7d79e2155245b313b0767bbbcaacb9a3`、[#901](https://github.com/jiangxng/EVO-App-Platform/pull/901) MERGED、编制时 BEX open PR #846/#860/#878/#899；下窗口必须**重新查询**，不靠快照推断。GitHub Actions artifact 有保留期，文本 CI/代码树用固定链接可追溯。
- **截图/附件**：本窗口没有新生成图片、PDF、录像、上传本地 token dump 或 git patch；唯一明确的短期 Actions artifact 位于 run 38673188190。`PA04-C01-C06-READINESS-LEDGER.json` 和本详细索引已保存于 GitHub；没有永久附档需要迁移。
- **真实资料缺失不应被猜测填补**：本地开源模型精确名称、tokenizer/chat template/context window、实机硬件资源、模型 token/费用账单、业务插件 owner 当前授权证明、真实用户体验录像、生产权限/egress 配置。本窗口没有这些内容。

## 7. 接续模块、原文档、分支和下一动作映射

| 下一动作 | 首先读取的已有成果 | 影响范围及禁止事项 | 实际交付标准 |
| --- | --- | --- | --- |
| 刷新事实基线与并行边界 | 本窗口[短入口](PA04-WINDOW-HANDOFF-ENTRY-20261015.md)、本索引、`AI-BOOTSTRAP.md`、`project.status.json`、交付规范和 GitHub 开放 PR | 不改 BEX #846/#860/#878/#899；不清其分支，不重开已退休 PA-04 短分支 | 准确新 main/PR/branches/Owner 列表 |
| PA-05 插件认证现状盘点 | 总纲 §21.1–21.3、§26.2；`host-tool-catalog.ts`、`manager/agent-async-read-worker-runtime.ts` 以及实际平台 plugin manifest/schema | 不新造 PA-02 executor、Agent 私有插件体系、或重写标准契约 | 已实现/缺口对照，独立第二插件候选和 certification fixture 范围 |
| PA-05 第一个代码闭环 | 盘点后最小 certification case；复用 `contracts/agent-run.ts` 和 Host Owner/Receipt | 从当时最新 main 起 `agent/pa05-...` 独立 branch+PR；不碰对象导入未合 PR 文件 | 授权、幂等、升级/停用、直接与 Agent 结果一致之 CI，merge+删分支 |
| PA-04 未签收尾项并行追踪 | `PA04-C01-C06-READINESS-LEDGER.json` 的 missingEvidence/owner、#901 CI | 不改 `signed` 不编造 provider/业务授权证据 | 逐个 Owner 补真证据、Human 签收或继续 OPEN |
| PA-06 运营准备 | 总纲 §23–24、§26.2；PA-02 R10 仍 OPEN | 无真实生产授权不部署/开启 WRITE；本地模型非默认零成本 | O01–O04 证据与试点安全报告 |
| 最后 PA-03 收敛 | 总纲 §12.1、§16、§26.2；BEX/CP-03 最新合并事实 | 不把 BEX UI/字段 PR = PA-03 直接 PASS | Agent I01–I10/Human/EC 独立验收，再全阶段合流 |

**截至此次索引编制，唯一实际新建的工作分支：** `docs/pa04-window-research-decision-handoff-20261015`。它只用于这次新增两篇归档文档，合并后应退休。**其最后分支 SHA 和合并 SHA 以此交接 PR 完成时实际 GitHub 记录为准，不预填预测 SHA**。旧功能 PR 的准确代码基线为 `main@615fbf3f7d79e2155245b313b0767bbbcaacb9a3`。

## 8. 谁的结论、哪些事实不应重复研究

- **用户决定**：PA-02 费用 R10 暂缓但原门禁保留；首版拟尝试本地开源模型；先 PA-04→05→06，最终等 BEX 后做 PA-03 联合总结。
- **项目一手事实**：上述 G01–G25 源文件与九个功能 PR + #901 run 42/42、5/5；PA-04 没有六项真实生产全签的证据；短功能分支已退休。
- **本窗口判断**：用 Host 可选 Port + PG18 负向隔离测试最小化风险，暂不大改共享 Host；对未接线的安全策略严格保持未签收。这不是 Anthropic/OWASP 的直接原文背书。
- **下窗口不得重复**：从零设计 Context Memory、重做 AF-02 长对话、重造 Run/Receipt、重新实现 #889–#901 已验功能、重新写一份不同权威的 PA-04 总纲；继续定向补缺而不是重开历史工程。
