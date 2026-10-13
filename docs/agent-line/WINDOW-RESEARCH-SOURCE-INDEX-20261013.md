# Agent / External Agent：资料来源、证据与附件索引（2026-10-13）

Document class: VERIFIED_SOURCE_INDEX_WITH_HISTORICAL_LINKS。配套：[简短入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261013.md)、[决策及缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261013.md)。此索引补充而不覆盖 [2026-10-11原研究索引](WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)。

## 1. 分级口径及查阅日期
- **G / 已读原文**：本窗口直接通过GitHub连接读取过仓库文件完整或片段正文、PR源码差异、CI job日志、精确Git ref/提交内容。个别长文件仅查看标题/章节或片段，分别标“片段”，不称通读。GitHub `blob/<commit>/` 是可复读原始地址，不是抓取的本地网页副本。
- **M / 已读GitHub元数据或CI汇总**：取回 PR/commit/compare/checks 等实际API结果，没有声称逐行阅读全部改动/全部测试。
- **H / 历史已收录、当前待验证**：从2026-10-10总纲及10-11索引沿用的外部网络链接；**本窗口没有重开网页原文**。原索引声称10-10有研究，原始逐页访问日志不完整，无法鉴别全文和摘要。不可据此宣称“已读原文”。
- **S / 仅搜索摘要**：本窗口可核记录中**0条**。不要为填栏将H冒标成S。
- **U / 待实际验证**：运行时、生产或外部标准具体版本未实测。对日期采用北京/香港时间（UTC+8）；2026-10-12为本窗口GitHub操作日期，2026-10-13为本交接复核日期。GitHub Actions URL/log/artifact具时效性。

## 2. 本窗口实际直接打开过的第一手来源（按主题）

| ID/等级 | 标题、原始网址 | 查阅日期 | 原文发现或元数据事实 | 本项目具体用途 |
|---|---|---|---|---|
| G01 已读源码 | [Platform agent-run/assistance合同](https://github.com/jiangxng/EVO-App-Platform/blob/a3cf919a698a63a76f926bf264bc02fca2877626/contracts/agent-assistance.ts)；[Run handler](https://github.com/jiangxng/EVO-App-Platform/blob/a3cf919a698a63a76f926bf264bc02fca2877626/agents/enterprise-agent/thread-turn-action-handlers.ts) | 10-12 | 与老分支逐文件SHA及源码对比；严格request/result与turn身份；main曾和旧分支不一致，不可直接整体覆盖 | `agents/enterprise-agent/*`、`contracts/*`：保留PA-01协议与100条扫描未解决缺口 |
| G02 已读片段 | [Platform数据导入授权规则](https://github.com/jiangxng/EVO-App-Platform/blob/db555162370b3c3c992c7aef88f605f9ebf2d0cd/apps/data-import/authorization.ts)；[静态授权运行时](https://github.com/jiangxng/EVO-App-Platform/blob/db555162370b3c3c992c7aef88f605f9ebf2d0cd/providers/authorization/runtime.ts) | 10-11历史原文，10-12本窗口使用文档/日志复核 | Owner/Admin等作用域下已有HUMAN/AI允许；必须显式DENY覆盖才能构造AI拒绝；DENY优先。不能把删额外ALLOW当权限拒绝 | `apps/data-import` 与Host：保留真实身份/企业关系门禁和负向安全测试 |
| G03 已读完整 | [PA-02A隔离PostgreSQL证明](https://github.com/jiangxng/EVO-App-Platform/blob/9f794cf928d9a01e55a22c6d5742ea23fd7bc456/agents/enterprise-agent/pa02a-postgres-durability-proof.ts)；[async合同](https://github.com/jiangxng/EVO-App-Platform/blob/9f794cf928d9a01e55a22c6d5742ea23fd7bc456/contracts/agent-durability-async.ts) | 10-12 | 新持久化适配器独立于原Sync V010；scope基于Host提供的身份/企业上下文；测试代码证明原语，不表示运行时已经接线 | `manager/agent-run-store.ts`、`manager/server.ts`（当前只读）及PA-02A/B；需设计异步迁移 |
| G04 已读完整 | [旧版External Agent OAuth helper](https://github.com/jiangxng/EVO-App-Platform/blob/7eb802eb21230e2e5a2dcf863d1507c69f1f7b0f/manager/external-agent-oauth-profile.ts)；[当前OAuth合同](https://github.com/jiangxng/EVO-App-Platform/blob/61d5cb616327656206b9a8ca460e109c7422e524/contracts/external-agent-oauth.ts) | 10-12，10-13复核 | 旧helper依赖的READ/PLAN scope符号在较新合同已消失；较新main具授权码、token、consent、HTTP和元数据路径，不能回退或整包复制旧代码 | External Agent OAuth/权限/令牌：以较新主线为权威，历史仅保留Git ancestry |
| G05 已读完整 | [External Agent插件manifest](https://github.com/jiangxng/EVO-App-Platform/blob/f7d96e9a89365df70720427a89ac116eea321ebf/apps/external-agent-access/package.ts) | 10-12，10-13复核 | 独立 `evo-external-agent-access` APPLICATION声明及四语标题、简体中文描述；通过插件标题CI；目录存在**不等于实际安装/激活**。内部feature `defaultActivation:true` 仅定义安装后默认状态，不保证已安装 | `apps/external-agent-access`、catalog、Host feature loader；下一步验证实际安装/导航/能力暴露 |
| G06 已读完整/片段 | [External Agent Access Standard v0.1](https://github.com/jiangxng/EVO-App-Platform/blob/61d5cb616327656206b9a8ca460e109c7422e524/docs/architecture/EXTERNAL-AGENT-ACCESS-STANDARD-v0.1.md)；[验证路线](https://github.com/jiangxng/EVO-App-Platform/blob/61d5cb616327656206b9a8ca460e109c7422e524/docs/roadmap/EXTERNAL-AGENT-FIRST-PLATFORM-VALIDATION.md) | 10-12对比两版，10-13重读开头 | 明确插件能力对外发现应使用稳定协议与授权，旧规划说未开放；文档当前开头写EA-3A内部基础已实现、外部网络接入仍关闭；正文较长未逐章复读 | EA公开端点、OAuth/MCP、Capability Fabric；重新确认实际网络暴露而非使用文档标题推断 |
| G07 已读完整 | [Agent五分支对账](https://github.com/jiangxng/EVO-App-Platform/blob/f7d96e9a89365df70720427a89ac116eea321ebf/docs/agent-line/AGENT-EXTERNAL-BRANCH-CONVERGENCE-20261012.md)；[PR #786](https://github.com/jiangxng/EVO-App-Platform/pull/786) | 10-12，10-13复核 | 5个旧源ref祖先纳入main；PA02实验原3文件已一致、补CI；保留未自动安装的EA manifest；EA4A旧OAuth和EA5旧 `project.status.json` 不覆盖 | 作为分支收敛的决策审计源；不重复从已删除branch搬运代码 |
| G08 已读源码差异 | [Eidos旧聊天UX源提交](https://github.com/jiangxng/eidos/commit/8d83400ff10e6fb8d53f40e91a1f4b5419272637)；[新版收敛文档](https://github.com/jiangxng/eidos/blob/f412f1d03e684a3f3463d10eac51d6cc79032eff/docs/agent-line/AGENT-CHAT-BRANCH-CONVERGENCE-20261012.md)；[PR #177](https://github.com/jiangxng/eidos/pull/177) | 10-12，10-13复核 | 比较 `page-controller.ts`、`chat/render.ts`、图标、CSS、四语资源及测试；保留复制回复、busy/输入框，排除旧移动布局覆盖和新draft文案丢失 | `eidos/src/app-host/page-controller.ts`、`src/chat/*`、icons/CSS/localization；需要真实IME/屏幕测试 |
| G09 已读完整 | [EC旧Agent三分支历史对账](https://github.com/jiangxng/Experience-Compiler/blob/5f06a6224b6ffe434a9a3c0793b0384943121ac9/docs/architecture/AGENT-LEGACY-BRANCH-CONVERGENCE-20261012.md)；[PR #9](https://github.com/jiangxng/Experience-Compiler/pull/9) | 10-12，10-13复核 | 两个分歧分支以merge parents留历史，但旧README/ARCHITECTURE/CONSTITUTION不覆盖较新正文；第三旧ref已在main；职责边界不变 | EC模型学习建议与EVO授权执行分离；不借收敛调整owner |
| G10 读源码/对账 | [Eidos通用页面保护 PR #142](https://github.com/jiangxng/eidos/pull/142)；[Platform PA-01 #575](https://github.com/jiangxng/EVO-App-Platform/pull/575) | 10-12，10-13复核PR | B2 helper与Host窄接线、B3测试已归集；Eidos #142/Platform #575分别进入main，原依赖PR #570/#577/#579/#638/#691在Platform归并；#692 PR仍显示未merged是历史对象状态 | 防止新窗口误以为需要恢复旧PR链或重开旧分支 |
| G11 读CI日志 | [PA-01B2真实隔离Host/Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578)，[job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578/jobs/114346855709) | 10-11原测试、10-12复核 | 8/8成功：正确关联恰好一次页面重读、原生表单已有/等待中dirty不重读、换mount旧结果不刷新、503无刷新、普通聊天兼容、真实Data Import Recipe复用；模型Responses用确定性localhost替身 | PA-01B2隔离体验验收，**不是**真实外部LLM推理或生产 |
| G12 读CI日志 | [PA-01B3授权与显式拒绝](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340) | 10-11原测试、10-12复核 | allow/deny两个独立Chromium job成功；allow可触发真实mapping.apply并返回ActionReceipt ID；deny状态仍STAGED、映射来源DETERMINISTIC；**尚未单独读取deny receipt终态** | Host权限门禁、Audit/Receipt下一轮补测试，不把有receipt ID当成功业务写 |
| G13 读CI日志与断言 | [PA-02A隔离PostgreSQL运行](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098470224)；[设计与限制](https://github.com/jiangxng/EVO-App-Platform/blob/f7d96e9a89365df70720427a89ac116eea321ebf/docs/agent-line/PA02A-POSTGRES-UNIQUENESS-PROOF-20261011.md) | 10-11原测试、10-12/13复核 | PostgreSQL18，32并发Turn仅1、131个新Turn后原身份可查、32回执争用仅1终态、scope/CAS；`postgresRestartRecovery` 实际**只是数据库客户端断线重连，不是Node进程崩溃恢复** | PA-02A后续可靠性计划；不能据此切换生产Store |
| G14 读CI失败及复跑日志 | [Platform跨项目Chromium最终成功复跑](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38182830629)；[最终PA-01集成PR #575](https://github.com/jiangxng/EVO-App-Platform/pull/575) | 10-12 | 原失败为Chrome DevTools端口启动晚于测试等待窗口；复跑成功；当时更新后PA-01的24项相关CI全部success，才合main | 说明环境偶发与产品失败需要分辨，不能绕过CI |
| G15 读CI失败及修复 | [Platform #786插件多语言检查](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38189039622)，[修复后通过运行](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38189266201) | 10-12 | 新旧EA插件manifest需要四语 `displayNameTranslations` 和小于50字中文描述；旧版本第一次失败，增补后通过 | 插件装载元数据与Eidos多语言，一切新PackageManifest必须过CI |
| G16 读CI清理日志 | [Platform五分支清理](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38189420287)、[Eidos清理](https://github.com/jiangxng/eidos/actions/runs/38189309715)、[EC清理](https://github.com/jiangxng/Experience-Compiler/actions/runs/38189295880) | 10-12，10-13复核 | 全部SUCCESS；按固定SHA+PR/祖先/开放引用检查删除，原branch当前查询404；Eidos另有Branch Hygiene通过 | 证明“删除已合并分支”已执行；以提交/PR链接恢复历史，不靠branch URL |
| M17 元数据 | [最新Platform main](https://github.com/jiangxng/EVO-App-Platform/commit/61d5cb616327656206b9a8ca460e109c7422e524)、[最新Eidos main](https://github.com/jiangxng/eidos/commit/f412f1d03e684a3f3463d10eac51d6cc79032eff)、[最新EC main](https://github.com/jiangxng/Experience-Compiler/commit/5f06a6224b6ffe434a9a3c0793b0384943121ac9) | 10-13 | 已核ref，Platform main后续由其他线继续推进，因此历史#786合并SHA不是当前HEAD | 新窗口先刷新基线，不反推所有现行模块只发生本窗口改动 |

上述G类“已读”仅指本窗口实际访问过标注的源码/片段/日志与对应历史记录，不等于独立现场复测所有系统；历史10-11来源的实际阅读详情仍须查看旧索引。G11–G13的原始浏览器命令/失败控制/精确job位置在各自 `docs/agent-line/PA01B*.md`、`PA02A*.md`。

## 3. 外部网络资料（仅继承已有14条，全部H / 待逐页核验）

**查阅日期：** 原2026-10-10总纲/2026-10-11索引记载为历史研究日期；**本窗口（2026-10-12至13）未直接访问以下网页**。以下发现属于旧总纲的研究摘要，**不是本窗口亲自证实的来源事实**。引用正文或选择正式协议前请定向重读和锁定版本。

| 编号 / 等级 | 标题和原始网址 | 主题、保留关键要点（历史摘要） | 本项目用途及应核原文位置 |
|---|---|---|---|
| S1 H | [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | workflow组合 vs 自主Agent | Agent编排/Capability，核 `§5/§8/§17`；不把多Agent群作为默认架构 |
| S2 H | [Anthropic — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 上下文高信噪比、按需取用 | AF-02 context assembly、预算/压缩；核总纲 `§15` |
| S3 H | [Anthropic — Managed agents](https://www.anthropic.com/engineering/managed-agents) | 管理长期任务、会话与harness分离 | PA-02执行生命周期；文章日期、具体实现细节尤其需核 |
| S4 H | [Microsoft — Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | 工具/主题/知识元数据帮助动态调度 | Capability Fabric描述，不授予额外权限；核总纲 `§8` |
| S5 H | [AG-UI — Events](https://docs.ag-ui.com/concepts/events) | Agent前后端事件互操作 | Eidos streaming/event；尚未承诺兼容，核版本 |
| S6 H | [A2UI — Catalogs](https://a2ui.org/concepts/catalogs/) | 注册组件约束下的生成界面 | Eidos受约束体验，不开放LLM任意UI；核版本与schema |
| S7 H | [A2A — Specification](https://a2a-protocol.org/latest/specification/) | Task/artifact/远端委派/取消 | External Agent未来互操作；动态`latest`必须锁版本 |
| S8 H | [MCP — Security best practices（2025-11-25路径）](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | Token audience、passthrough/SSRF等 | External Agent OAuth/MCP；锁正式安全规范版本 |
| S9 H | [Microsoft HAX — Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | 能力说明、可纠错、人类控制 | Eidos Chat/确认、失败和回执表达 |
| S10 H | [Temporal — Workflow execution](https://docs.temporal.io/workflow-execution) | Durable execution/history replay | PA-02对比路线；未决定引入Temporal为依赖 |
| S11 H | [W3C — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 操作目标最小尺寸 | Eidos触摸UI；项目44px建议不是WCAG统一门槛 |
| S12 H | [W3C — Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 状态反馈与可访问性 | “正在思考”、失败/复制反馈；不无端移动焦点 |
| S13 H | [OpenTelemetry — GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | 追踪和指标字段互操作 | Agent可观测；先定版本/脱敏政策 |
| S14 H | [OWASP — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | Prompt Injection风险 | External Agent/LLM工具调用须依赖Host授权隔离，非仅提示词防御 |

此外，旧总纲§30.2整理过四仓数十条固定提交的内部源文档路径，[旧来源索引§4](WINDOW-RESEARCH-SOURCE-INDEX-20261011.md#4-四仓历史固定来源完整保留)继续是唯一完整清单，**本文件不重复整个历史长表**。其中链接状态是历史快照，不能取代此轮G01–G17的最新对账证据。

## 4. 流失风险高的CI附件/截图原始位置

| 类别 | 原始页面与附件位置 | 具体内容、局限 |
|---|---|---|
| Native helper preflight | [run 38095315018](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018) / [artifact 11685148470](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018/artifacts/11685148470)；[阶段记录](PA01B2-NATIVE-CHROMIUM-PREFLIGHT-20261011.md) | Chromium helper 10/10、截图；**不是完整Host** |
| Full Host Chromium | [run 38097668578](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578) / [artifact 11686346415](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578/artifacts/11686346415)；[阶段记录](PA01B2-FULL-HOST-CHROMIUM-ACCEPTANCE-20261011.md) | 真Host/Workbench/Run/Recipe 8/8，确定性模型、非真实模型性能 |
| Allowed/DENIED mapping | [run 38098385340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340) / allow [11687112571](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340/artifacts/11687112571) / deny [11686147677](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340/artifacts/11686147677) | 两个独立企业/Runner下能力写入与显式DENY；deny receipt终态未单独核 |
| PA-02A database | [run 38098470224](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098470224)；[失败run 38098313140](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098313140)、[失败run 38098415889](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098415889) | PostgreSQL18并发唯一性及JSONB反序列化修复历史；无真实业务进程重启 |
| 当前main再次验收 | [PA-01 24项CI及跨项目复跑](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38182830629)、[Platform #786完成前PA-02A](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38189348946)、[EA插件多语言复跑](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38189266201)、[Eidos最终CI](https://github.com/jiangxng/eidos/actions/runs/38189309727)、[EC最终CI](https://github.com/jiangxng/Experience-Compiler/actions/runs/38189295874) | 均为本窗口曾读取状态的真实CI，留作对比；原始日志未整体复制到GitHub |

### 已检查到的本地临时可恢复证据（不在GitHub）
本环境挂载存在 `/mnt/data/pa01b2-browser-proof/`：`existing-draft.png`、`inflight-draft.png`、`index.html` 及 `artifacts/agent-pa01b2-chromium/report.json`。`report.json`注明测试 `2026-10-10T23:31:25Z`、Chromium 144.0.7559.96、`NATIVE_BROWSER_HELPER_ONLY`、10/10通过，明确 `fullAppHostBackendBrowserAccepted:false`。**这些是历史本地预检，不可混称后来CI的真实Host验收**。临时容器路径不能保证在新窗口可挂载；建议使用本次会话附带的归档下载作为备份，GitHub仍以artifact/阶段文档为主要证据。

## 5. 原始证据可恢复章节索引
- [PA-01B2 Native](PA01B2-NATIVE-CHROMIUM-PREFLIGHT-20261011.md)：浏览器版本、10场景、截图/报告原始artifact。
- [PA-01B2 Full Host](PA01B2-FULL-HOST-CHROMIUM-ACCEPTANCE-20261011.md)：真实Host隔离fixture、8项场景、首次5/8与7/8的观测脚本修正。
- [PA-01B3 allow](PA01B3-ISOLATED-AUTHORIZED-MAPPING-20261011.md)、[explicit deny](PA01B3-EXPLICIT-AI-DENY-BROWSER-20261011.md)：Operation ID、角色策略、Receipt关联、STAGED/DRY_RUN_READY对照；首次测试假设修正。
- [PA-02A候选端口](PA02A-ASYNC-RUN-RECEIPT-PORT-DESIGN-20261011.md)、[唯一性实验](PA02A-POSTGRES-UNIQUENESS-PROOF-20261011.md)：scope/schema/CAS、并发、重连限制及精确失败run。
- [External Agent五分支对账](AGENT-EXTERNAL-BRANCH-CONVERGENCE-20261012.md)、[Eidos旧交互对账](https://github.com/jiangxng/eidos/blob/f412f1d03e684a3f3463d10eac51d6cc79032eff/docs/agent-line/AGENT-CHAT-BRANCH-CONVERGENCE-20261012.md)、[EC分支对账](https://github.com/jiangxng/Experience-Compiler/blob/5f06a6224b6ffe434a9a3c0793b0384943121ac9/docs/architecture/AGENT-LEGACY-BRANCH-CONVERGENCE-20261012.md)：原始ref SHA及保留/排除/安全删除理由。
- [建设总纲§11/13/14/18/19/22/26/28/30](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)：历史技术选项、测试矩阵与外部参考；**快照不代表当前实施阶段**。

## 6. 未保存及不应误传的东西
1. **未存入GitHub：** 14个外部网站的完整HTML/PDF/网页截图；它们在本窗口没有实际抓取，仅保存原URL与旧摘要。
2. **未存入GitHub：** 上表部分CI的完整原始日志ZIP和截图二进制；只保留精确GitHub run/job/artifact URL、失败与通过摘要。GitHub artifact有过期风险。
3. **未存入GitHub：** `/mnt/data/pa01b2-browser-proof/` 的PNG/HTML/JSON本地包（本次对话会提供下载链接，暂不宣称GitHub有文件）。
4. **不存在因而无法存档：** 真实外部LLM语义映射质量评估、生产/多租户压测、完整节点进程崩溃恢复及正式用户截图签收；不得伪造位置或完成状态。

## 7. 2026-10-13 后续窗口新增第一手证据（原 §1–6 保留原状）

| 编号/等级 | 标题和原始网址 | 读取日期及直接观察 | 用途与严格限制 |
|---|---|---|---|
| G18 已读当前源码+CI日志 | [Platform #799](https://github.com/jiangxng/EVO-App-Platform/pull/799)、[新增Node进程恢复测试](https://github.com/jiangxng/EVO-App-Platform/blob/fe699a2c17e8d5927c7bfe889a7dd5493d81c5a4/tests/agent-line/pa02a-process-recovery.test.mjs)、[GitHub Actions run 38345829365](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38345829365) / [job 115126899050](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38345829365/jobs/115126899050) | 2026-10-13：经GitHub连接直接取回源码与job日志。真实Node子进程SIGKILL后另一进程重建仓储、查到唯一Run/事件/仍REQUESTED的Receipt；SQL回滚及scope隔离；一次性PostgreSQL18 job成功 | 弥补G13只测数据库**连接**重建的证据缺口。**不表示**正式Host接线、DB服务重启、多机器Worker、真实业务写入/未知结果协调或上线。新PR后续提交须另查最终head CI。 |

此G18与原14项H级外链无关；未打开那些外部原文，也不升级其阅读等级。


## 8. 2026-10-13 PA-02B后续窗口新增源码来源

| G19 已读内部源码/PR | [Platform #800](https://github.com/jiangxng/EVO-App-Platform/pull/800)；[PA-02B阶段文档](PA02B-FENCING-UNKNOWN-WRITE-20261013.md) | 2026-10-13 当前main原文核对V010 Run executor和Receipt、V020 PostgreSQL proof后新增隔离Lease/Write Intent、CI测试；只有看到精确head PASS才能升级运行证明 | 工程判断为持久fence+UNKNOWN quarantine，不代表正式Host单飞运行或外部工具审计；14项历史外链均未重新打开（H）。 |


## 9. 2026-10-13 PA-02C后续窗口新增内部证据

| G20 已读当前源码 + 待精确CI核验 | [Platform #801](https://github.com/jiangxng/EVO-App-Platform/pull/801)、[PA-02C记录](PA02C-DURABLE-CANCELLATION-20261013.md) | 2026-10-13 按现行V010 Run reducer/runtime、PA-02B隔离调度器和Host职责新增PostgreSQL取消屏障；后续以PR实际GitHub Actions查证运行状态 | 只证明实验性REQUESTED/CANCELLED取消事实、已发出WRITE不自动撤销；正式Host Run终态及生产仍无验收。外部来源S1–S14仍保留H级未重读。 |
