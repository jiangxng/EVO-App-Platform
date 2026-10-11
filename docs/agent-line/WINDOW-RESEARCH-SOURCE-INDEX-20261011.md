# Agent 线研究资料详细索引 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT
Scope: 本窗口研究与 PA-00/PA-01A/PA-01B1/PA-01B2 实施证据；不代表四仓当前 main 全貌。

## 1. 阅读状态与证据规则

- **已读原文（本轮可核）**：当前已读取的 GitHub 文档正文、实现 PR diff 和已获取的 CI 日志。读 PR 不等于运行浏览器。
- **历史已读记录**：建设总纲自述已读相关仓库文档/代码，并保留固定 SHA；此次整理读取了总纲，但未重新逐一打开下列所有历史文件，不将它们提升为本轮独立复验。
- **待验证（历史外链）**：原总纲第30章称外部资料于2026-10-10检查，保留14项链接和使用结论；当前保留的上下文不能逐项证明全文/片段/搜索摘要的访问深度。因此统一保守标注待验证，不虚构访问日志，也不冒称只看摘要。
- **仅看搜索摘要**：本次可恢复证据中没有可以明确归到这一档的条目。未知不等于已读，也不等于已证实只读摘要。
- 日期为北京时间。2026-10-11为交接整理日期；没有为“补齐索引”重新浏览外部网页或追加未访问来源。

## 2. 已读且可接续的项目原文

| 标识 | 标题、原始地址 | 查阅日期 | 关键事实与具体用途 | 状态/位置 |
|---|---|---|---|---|
| R1 | [建设总纲 v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/4463656366848bdda78dde8fa0c9d5f9e7b4bc8d/docs/roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) | 2026-10-10研究；10-11重新取正文、定向检查 | 30章设计提案；§2四仓快照、§7协作契约、§11交互、§13–14持久化、§22验收、§26工作包、§28待定项、§30来源 | 已读项目文档；其中外部事实仍受下表状态限制 |
| R2 | [PA-00盘点](https://github.com/jiangxng/EVO-App-Platform/blob/4463656366848bdda78dde8fa0c9d5f9e7b4bc8d/docs/agent-line/PA00-BASELINE-AND-PA01A-SCOPE-20261010.md) | 10-10；10-11复读 | 实际源代码构造Run/Receipt为JSONL或memory；同步端口、100条去重、未实现取消；生产配置未测 | 已读原文；“已有与缺口”“候选请求映射” |
| R3 | [本轮结束前HANDOFF](https://github.com/jiangxng/EVO-App-Platform/blob/4463656366848bdda78dde8fa0c9d5f9e7b4bc8d/docs/agent-line/HANDOFF.md) | 10-10；10-11复读 | 精确实现head、CI、依赖顺序与浏览器缺口；防止重复研究 | 已读原文；文末PA-01B2检查点 |
| R4 | [PA-01A PR #575](https://github.com/jiangxng/EVO-App-Platform/pull/575) | 10-10；10-11复查元数据/diff | 同clientTurnId同文字但不同上下文错误复用；修复比较完整context。原代码同套测试5失败 | 已读实现/测试；动态PR以入口固定head为准 |
| R5 | [PA-01B1 PR #577](https://github.com/jiangxng/EVO-App-Platform/pull/577) | 10-10；10-11复查 | 版本化请求/结果，服务端验证、持久保存身份与来源、返回真实receipt IDs | 已读实现/测试；不是完整业务验收 |
| R6 | [PA-01B2 PR #579](https://github.com/jiangxng/EVO-App-Platform/pull/579) | 10-10；10-11复查 | 页面→thread传输→关联结果；同实例且干净才刷新，按钮异常恢复 | 已读实现/测试；真实浏览器待验 |
| R7 | [Eidos PR #142](https://github.com/jiangxng/eidos/pull/142) | 10-10；10-11复查 | 通用helper/原生表单dirty保护/四语文案；owner与vendor窄范围对齐 | 已读实现/测试；富文本不在范围 |

## 3. 外部研究来源及保留摘要

下表“思想及限制”为原总纲保留摘要，属于**历史研究记录**，不当作此次重新认证的来源事实。对应产品化方案均为项目判断；外部来源不证明本项目已实现。

| 标识 | 官方/原作者标题与原始网址 | 保留的关键发现、项目用途及限制 | 日期 | 阅读状态 |
|---|---|---|---|---|
| S1 | [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 简单可组合workflow与动态Agent分工；2024文章用于架构原则，不用于比较2026所有产品能力 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S2 | [Anthropic — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 高信号上下文、按需读取和压缩；本文权限/版本规则是项目化设计 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S3 | [Anthropic — Managed agents](https://www.anthropic.com/engineering/managed-agents) | 2026文章对持久会话、执行与harness分离的讨论；不是采购建议 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S4 | [Microsoft — Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | tools/topics/knowledge与描述元数据；关键固定问询保留确定性 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S5 | [AG-UI — Events](https://docs.ag-ui.com/concepts/events) | 参考前后端事件互操作；不宣称项目当前兼容 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S6 | [A2UI — Catalogs](https://a2ui.org/concepts/catalogs/) | 受注册组件与schema约束的生成界面；不替代Eidos | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S7 | [A2A — Specification](https://a2a-protocol.org/latest/specification/) | 远端task/artifact与取消语义；latest是动态链接，实施前锁版本 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S8 | [MCP — Security best practices，2025-11-25文档路径](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | 受众绑定、token passthrough与SSRF等接入风险；不是宣称此版最新 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S9 | [Microsoft HAX — Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | 能力可知、错误可纠正、用户可控制；本文具体控件尺寸来自Eidos | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S10 | [Temporal — Workflow execution](https://docs.temporal.io/workflow-execution) | 参考持久执行与历史重放；暂不强制引入该产品 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S11 | [W3C — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 区分WCAG最小尺寸标准和项目44px触屏要求 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S12 | [W3C — Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 可访问状态反馈，不强制焦点移动 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S13 | [OpenTelemetry — Generative AI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | 参考遥测互操作；字段仍需版本锁定和隐私控制 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |
| S14 | [OWASP — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | 提示注入风险与分层控制；不承诺完全消除攻击 | 2026-10-10（总纲记载）；2026-10-11核对索引 | 待验证：历史收录，原文阅读深度无法逐项复核 |

### 章节映射与版本敏感点

| 来源 | 总纲章节/模块 | 接续用途与复核要求 |
|---|---|---|
| S1、S4 | §5、§8、§17；Agent编排/Capability | 支持固定工作流与动态推理分工；无需为当前B2验收重查，改变编排方案时再读原文 |
| S2、S3 | §13、§15、§17；运行/上下文 | 上下文预算与执行会话分离是方向；S3标题/网页内容及2026定位尤其需原文验证 |
| S5、S6、S7 | §7、§18、§21；协议/插件/UI | 仅互操作参考；无AG-UI/A2UI/A2A兼容声明。latest动态地址需锁版本，核验字段与取消语义 |
| S8、S14 | §19、§21；工具授权/外部内容 | 权限必须在执行边界重查；MCP日期路径不是“最新”保证；落地时查正式安全规范 |
| S9、S11、S12 | §10–11；Eidos交互 | 人可知/可纠正、状态可访问；44px项目触屏要求不能伪称WCAG统一最低尺寸 |
| S10 | §13–14、§24；持久执行 | 参考历史重放，不代表已选择Temporal；先看现有异步端口和运维成本 |
| S13 | §23；可观测 | 遥测字段需锁版本、脱敏；不记录完整敏感prompt作为默认策略 |

原网页HTML/PDF/截图未在本窗口保存到GitHub；可用的保留材料是本表摘要及总纲对应章节。不要虚构缓存附件。未来定向重读时追加访问日期、页面版本、章节和必要短摘录，避免覆盖此历史证据等级。

## 4. 四仓历史固定来源完整保留

以下直接保留原总纲第30.2节的逐文件原始固定链接与用途，避免丢掉已做的研究路径。查阅日期按总纲为2026-10-10；状态统一为**历史已读记录，本次未逐文件复读**。原总纲正文中的“已合入/最新”均仅指当时快照，不能当2026-10-11当前状态。

### 30.2 仓库证据

平台进展以交付前新证据为准：[最新复核 commit f7bc5eb882](https://github.com/jiangxng/EVO-App-Platform/commit/f7bc5eb88208d7eef0f11abf3a6eae4b9783ed9d)、[更新后的 project.status](https://github.com/jiangxng/EVO-App-Platform/blob/f7bc5eb88208d7eef0f11abf3a6eae4b9783ed9d/project.status.json)、[TR01A6 安装后验收证据](https://github.com/jiangxng/EVO-App-Platform/blob/f7bc5eb88208d7eef0f11abf3a6eae4b9783ed9d/docs/roadmap/TR01A6-INSTALLED-HUMAN-AGENT-WORKBENCH-EVIDENCE-20261010.md)。下表平台的代码论据保留初读固定版本；涉及阶段状态时由这组新证据更新，不使用旧 gate 判断。

| 项目/证据 | 固定版本链接 | 用于核对 |
|---|---|---|
| EVO-App-Platform 初读代码快照 | [commit 592a57298e](https://github.com/jiangxng/EVO-App-Platform/commit/592a57298ecc17dbe616ed887620ae31e65b49ec) | 本次版本基线 |
| EVO-App-Platform | [project.status.json](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/project.status.json) | 阶段状态与关闭记录 |
| EVO-App-Platform | [docs/roadmap/HANDOFF-LATEST.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/roadmap/HANDOFF-LATEST.md) | 近期交接与并行范围 |
| EVO-App-Platform | [docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md) | 四仓owner |
| EVO-App-Platform | [docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md) | 状态/上下文宪法 |
| EVO-App-Platform | [docs/roadmap/AI-NATIVE-AGENT-FOUNDATION-DEBT-RETIREMENT-v0.1.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/roadmap/AI-NATIVE-AGENT-FOUNDATION-DEBT-RETIREMENT-v0.1.md) | AF-01/02与债务路线 |
| EVO-App-Platform | [docs/roadmap/TR01A5-PURCHASE-HUMAN-WORKBENCH-EXPERIENCE-20261010.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/roadmap/TR01A5-PURCHASE-HUMAN-WORKBENCH-EXPERIENCE-20261010.md) | 采购体验gate |
| EVO-App-Platform | [docs/architecture/AGENT-CAPABILITY-FABRIC-v0.1.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/architecture/AGENT-CAPABILITY-FABRIC-v0.1.md) | 能力发现与调用边界 |
| EVO-App-Platform | [docs/architecture/ENTERPRISE-AGENT-EC-CONVERGENCE-v0.1.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/architecture/ENTERPRISE-AGENT-EC-CONVERGENCE-v0.1.md) | 个人Agent/EC分工 |
| EVO-App-Platform | [docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md) | 个人/企业上下文与记忆 |
| EVO-App-Platform | [docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | 扩展边界 |
| EVO-App-Platform | [contracts/agent-run.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/contracts/agent-run.ts) | 现有Run状态与事件 |
| EVO-App-Platform | [contracts/agent-action-receipt.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/contracts/agent-action-receipt.ts) | 现有回执状态 |
| EVO-App-Platform | [agents/enterprise-agent/run-action-handlers.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/agents/enterprise-agent/run-action-handlers.ts) | start/resume/get/list |
| EVO-App-Platform | [agents/enterprise-agent/run-runtime.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/agents/enterprise-agent/run-runtime.ts) | single-flight与未知写入阻断 |
| EVO-App-Platform | [agents/enterprise-agent/thread-turn-action-handlers.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/agents/enterprise-agent/thread-turn-action-handlers.ts) | clientTurnId与原Run复用 |
| EVO-App-Platform | [manager/agent-run-store.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/manager/agent-run-store.ts) | 文件事件存储实现 |
| EVO-App-Platform | [manager/conversation-context-assembly.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/manager/conversation-context-assembly.ts) | 当前长上下文组装 |
| EVO-App-Platform | [apps/data-import/page.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/apps/data-import/page.ts) | 现有AI自动匹配入口 |
| EVO-App-Platform | [apps/data-import/recipe.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/apps/data-import/recipe.ts) | Recipe结构与复用 |
| EVO-App-Platform | [apps/data-import/service.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/apps/data-import/service.ts) | 导入流程与学习触发 |
| EVO-App-Platform | [apps/data-import/experience-advisor.ts](https://github.com/jiangxng/EVO-App-Platform/blob/592a57298ecc17dbe616ed887620ae31e65b49ec/apps/data-import/experience-advisor.ts) | 经验建议接入 |
| EVO main快照 | [commit 2311022640](https://github.com/jiangxng/EVO/commit/2311022640aa108a6baf3db44d9b26bd3e3ad623) | 本次版本基线 |
| EVO | [ARCHITECTURE.md](https://github.com/jiangxng/EVO/blob/2311022640aa108a6baf3db44d9b26bd3e3ad623/ARCHITECTURE.md) | 确定性业务运行时 |
| EVO | [PUBLIC-API.md](https://github.com/jiangxng/EVO/blob/2311022640aa108a6baf3db44d9b26bd3e3ad623/PUBLIC-API.md) | 公共接口边界 |
| EVO | [docs/architecture/EVO-CURRENT-AUTHORITY-BOUNDARY-v0.1.md](https://github.com/jiangxng/EVO/blob/2311022640aa108a6baf3db44d9b26bd3e3ad623/docs/architecture/EVO-CURRENT-AUTHORITY-BOUNDARY-v0.1.md) | 业务与账本权威 |
| EVO | [project.status.json](https://github.com/jiangxng/EVO/blob/2311022640aa108a6baf3db44d9b26bd3e3ad623/project.status.json) | 旧状态指针与进展漂移 |
| eidos main快照 | [commit df6b09c8b2](https://github.com/jiangxng/eidos/commit/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb) | 本次版本基线 |
| eidos | [docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md) | 体验设计权威 |
| eidos | [docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md) | 办公产品视觉语言 |
| eidos | [docs/product/EIDOS-EXPERIENCE-ARCHITECTURE-CONSTITUTION-v0.1.md](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/product/EIDOS-EXPERIENCE-ARCHITECTURE-CONSTITUTION-v0.1.md) | 体验架构 |
| eidos | [docs/architecture/decisions/ADR-0006-AGENT-WORKSPACE-SHELL.md](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/docs/architecture/decisions/ADR-0006-AGENT-WORKSPACE-SHELL.md) | Agent工作区 |
| eidos | [src/design-language/tokens.ts](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/src/design-language/tokens.ts) | 控件/颜色/尺寸/断点 |
| eidos | [src/design-language/icons/icon-system.ts](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/src/design-language/icons/icon-system.ts) | 图标语义与规格 |
| eidos | [src/chat/contracts.ts](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/src/chat/contracts.ts) | typed parts/actions |
| eidos | [src/chat/render.ts](https://github.com/jiangxng/eidos/blob/df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb/src/chat/render.ts) | 渲染与可访问性 |
| Experience-Compiler main快照 | [commit 2ce8942064](https://github.com/jiangxng/Experience-Compiler/commit/2ce89420643a9f08e60301fa6d9424705ef70c1e) | 本次版本基线 |
| Experience-Compiler | [docs/architecture/EC-CURRENT-AUTHORITY-BOUNDARY-v0.1.md](https://github.com/jiangxng/Experience-Compiler/blob/2ce89420643a9f08e60301fa6d9424705ef70c1e/docs/architecture/EC-CURRENT-AUTHORITY-BOUNDARY-v0.1.md) | EC职责 |
| Experience-Compiler | [docs/architecture/DATA-IMPORT-EXPERIENCE-LEARNING-v0.1.md](https://github.com/jiangxng/Experience-Compiler/blob/2ce89420643a9f08e60301fa6d9424705ef70c1e/docs/architecture/DATA-IMPORT-EXPERIENCE-LEARNING-v0.1.md) | 学习范围与门槛 |
| Experience-Compiler | [src/ec/learning/import_mapping.py](https://github.com/jiangxng/Experience-Compiler/blob/2ce89420643a9f08e60301fa6d9424705ef70c1e/src/ec/learning/import_mapping.py) | 映射经验实际实现 |
| Experience-Compiler | [src/ec/storage/sqlite.py](https://github.com/jiangxng/Experience-Compiler/blob/2ce89420643a9f08e60301fa6d9424705ef70c1e/src/ec/storage/sqlite.py) | 当前存储与线程处理 |
| Experience-Compiler | [src/ec/context_v2.py](https://github.com/jiangxng/Experience-Compiler/blob/2ce89420643a9f08e60301fa6d9424705ef70c1e/src/ec/context_v2.py) | 上下文编译参考实现 |
| Experience-Compiler | [ARCHITECTURE.md](https://github.com/jiangxng/Experience-Compiler/blob/2ce89420643a9f08e60301fa6d9424705ef70c1e/ARCHITECTURE.md) | 长期知识与学习设计 |

补充进展入口：[Platform #567](https://github.com/jiangxng/EVO-App-Platform/pull/567)、[#569](https://github.com/jiangxng/EVO-App-Platform/pull/569)、[Eidos 开放PR](https://github.com/jiangxng/eidos/pulls)。平台两项在交付前已合入；其他开放/草稿状态不能作为已合入证据。



## 5. CI 原始证据与可恢复摘要

以下日志在本窗口实际读取，结果不是从测试代码推断。CI网页/日志可能过期；摘要、准确head及job标识用于恢复证据。没有保存整份原始日志或截图。

| 切片 | 精确head | 原始运行链接 | 已读取结果与限制 |
|---|---|---|---|
| PA-01A | f5efab9b110b3e79635c7f904ef7a7d94fd6b137 | [P1.7B 38014345349](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014345349) | 完整构建/36项通过；本地10/10，原实现5失败；当时返回16项工作流全部成功 |
| PA-01B1 | 15f059da4d841e2bc1b6b84b0171bb1be0827797 | [P1.7B 38014789592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014789592) | job114102554558，npm ci/tsc成功，49/49；当时返回17项工作流成功 |
| PA-01B2平台 | db555162370b3c3c992c7aef88f605f9ebf2d0cd | [P1.7C 38015600526](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015600526) | job114105039410，npm ci/tsc成功，63/63；当时返回10项工作流成功 |
| PA-01B2 Eidos | f1057a64e26377ecf719c34ea83ff74b9dee9dc9 | [release-check 38015597223](https://github.com/jiangxng/eidos/actions/runs/38015597223) | job114105030097，类型检查/构建及235/235；首次因日/繁缺key失败，补齐后通过 |

本地针对性测试是Node24 TS变换后执行，最终CI提供完整tsc证据；guard测试使用DOM替身。无真实浏览器、生产、真实LLM或数据库恢复验证证据。不要把CI摘要用作这些门禁的替代。
