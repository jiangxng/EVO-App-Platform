# PA-04 — Context 与记忆治理：当前验收与工作边界

**Document class:** CURRENT_STATUS / LIVING_RUNBOOK  
**Started:** 2026-10-15  
**Owner:** 独立 Personal Agent 建设线  
**Authority:** [PA-00～PA-06 建设总纲 §22.1、§26.2](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)、[AI-Native Agent State & Context Constitution](../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md)、[项目交付规范](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。

## Owner 排期与并行边界（2026-10-15）

- Owner 决定本窗口按 **PA-04 → PA-05 → PA-06** 推进；PA-03 的业务对象导入开发继续由 BEX/CP-03 并行线实施，全部阶段以后再统一做 PA-03 I01–I10 和 PA-04～06 的核对、经验总结及项目收敛。
- **PA-03 不是 BEX 完成的自动同义词**：保留 Agent 端到端导入 I01–I10、Human 与 EC 来源回流的独立最终责任；本窗口不得重做导入页面、映射、对象扩展字段等当前 BEX 代码或提前签收。
- PA-02 技术成果封存复用，R10 真实货币硬预算根据 Owner **方案 B 暂缓**，仍 [Issue #879 OPEN](https://github.com/jiangxng/EVO-App-Platform/issues/879)、`R10 NOT_SIGNED`、`PA-02 IN_PROGRESS / NOT_DEV_COMPLETE`。此处“工程先收口”不代表费用验收豁免或上线准入。
- **第一次上线计划尝试本地开源模型**，作为 Provider 可替换性和试点部署约束记录；具体模型、硬件、性能、费用和生产授权均未确认。本地模型不等于无资源成本，也不改变 Host 授权、usage 真相或 R10 货币门禁。
- 不修改主线 `project.status.json` 或自动生成 `HANDOFF-LATEST.md`；不擅自部署、不开放生产 WRITE，不修改开放 BEX PR 所涉文件。

## PA-04 原始验收矩阵（不缩减 C01–C06）

| Gate | 原始测试意图 | 本轮事实与未决边界 |
| --- | --- | --- |
| C01 | 上下文超过预算；保留核心约束，总预算含工具/输出 | **IN_PROGRESS**。新增可选的真实模型请求前完整 Token 上界校验、输出额度预留、不可证明时 fail-closed；尚缺经认证的具体本地/云端模型 tokenizer/上下文窗口绑定与重要 Working State 优先保留组装，不能签收完整 C01。 |
| C02 | 删除原消息；派生摘要/索引按政策失效 | **IN_PROGRESS**。首批只解决已持久摘要在源内容更改、遮蔽/删除后不能再被旧条件错误复用；原摘要/索引物理失效、删除传播仍未全证。 |
| C03 | 旧 READ 恢复，有新鲜度要求时重新读取 | **OPEN**。需读取 Host 当前授权/资源版本与恢复边界，不使用旧模型快照冒充现时事实。 |
| C04 | 记忆误推断，可查看纠正，不写成企业事实 | **OPEN**。复用现有 Memory Proposal Review、Human 确认与 Host 授权。 |
| C05 | 注入文件，不触发未授权工具或外发 | **OPEN**。需要确定性敌对内容、权限及 egress 负向验收。 |
| C06 | 引用失权，不展示标题/正文/下载 | **OPEN**。需要权限撤销之后端到端引用/检索/附件负向验收。 |

**PA-04 阶段 = IN_PROGRESS / NOT_SIGNED**，所有 C gate 完成后还需在真实长对话、不同 Context、权限变化和模型切换条件下验证。不得将某一个单元测试称作 C02 整体或阶段 PASS。

## 首个独立交付闭环：C02 历史源摘要再利用校验

- **复用既有 AF-02** `manager/conversation-context-assembly.ts`、`contracts/conversation-context.ts`、现有内存/PostgreSQL summary artifact stores。无需重造压缩器、对话存储、数据库或第二个 Memory 子系统。
- **风险**：旧摘要的复用原先只比较首/末消息 ID 与消息数，同数替换或内容遮蔽可能复用过期派生信息。来源已变更但派生摘要未经失效会把旧材料带入新推理。
- **本次修复**：在摘要 provenance 中保存所覆盖顺序消息的 SHA-256 内容指纹；复用时检验完整 ID 序列及内容指纹；legacy 无指纹的摘要不能证明新鲜度，生成新版本；原始 Conversation 始终为上游权威来源。
- **验证**：`tests/protocol/pa04-source-summary-invalidation.test.mjs` 覆盖未变复用、内容遮蔽、等量中间源替换、旧版本迁移四类正/负向。测试通过只证明这一个边界，**不证明**所有删除/保留策略已传播到检索索引或所有缓存层。
- **回滚/兼容**：provenance 中增加可选 `sourceDigest` 保持旧 artifact 可读取；旧 artifact 再次组装不直接复用而重建版本。原始源码/派生快照删除策略留给 C02 后续闭环，不能靠新指纹替代隐私删除义务。

## 后续先后原则

1. 完成首个 C02 源信息过期防误用门禁，并由准确 HEAD CI 验证、合并、删临时分支。
2. 基于实际调用链推进 C01 总模型上下文预算，严格区分 token 上界与估算，保留系统/工具/输出配额；不得假定本地模型上下文长度。
3. 收敛 C02 真实源删除及派生索引失效，再做 C03（旧 READ/权限失效）和 C06（引用失权），之后将 C04 人工纠正、C05 注入隔离的既有能力与遗漏项完成定向验收。
4. PA-04 验收后进入 PA-05 插件认证，再进入 PA-06 受控企业试点；PA-03 的收敛和历史导入 Human/EC 验收仍等待 BEX 线完成。所有阶段保留明确证据等级，杜绝“开发完成 = 生产准入”。

## 2026-10-15：C01 精确模型请求窗口硬拒绝（第二个交付闭环）

- **此前已完成的 AF-02**：Conversation 近端消息/摘要及原文保留、版本化检查点等仅限制字符与摘要长度。它们不等于整次模型调用的 Token 总预算；真实输入还包含 system/developer 指令、当前 Principal/Context、工具目录和 schema、工具观察、Human 当轮输入及模型输出预留。
- **此次增量**：复用原 `agents/enterprise-agent/pa02-async-read-worker.ts` 已组装完的最终 `LlmInferenceRequestV010`，在 Host→Worker 触发 Provider.infer 之前，通过可选的 `CertifiedModelContextWindowV010` 审核：
  1. Host 绑定精确 `providerId/modelId`、模型上下文窗口总 tokens 和明确的 `maxOutputTokens`（Provider 实际收到同一个输出上限）。
  2. 可信 Provider/model 专属 Token 上界凭证须覆盖**整份最终实际请求**的系统、开发者、历史、工具 schema、观察结果以及 Provider 帧/模板开销；单看用户文字、字符数或模型自行估算均不合格。
  3. `inputUpperBoundTokens + reservedMaxOutputTokens <= contextWindowTokens` 才允许调用。缺模型身份、缺凭证、凭证错配、不可靠计数或超限时直接 `RUN_BLOCKED`，**零次模型推理、零次业务工具发出**，并可从 PostgreSQL Run 恢复时保留阻断事实。
  4. 保护系统/开发者约束、Human 输入和有效工具目录；本闭环**不**通过截断这些权威内容来强行放行。后续由经授权、显式优先级的 Context Assembler 在实际完整请求构造前精简非必需历史，并重新验证完整上界。
- **证据**：`tests/protocol/pa04-certified-context-window.test.mjs` 包括完整请求 quote、窗口精确边界、身份/额度错配、凭证缺失或错误、工具膨胀负向、Token quote 无法修改真正请求。`tests/agent-line/pa04-c01-certified-context-window-pg-e2e.test.mjs` 是隔离 PostgreSQL Host/Worker 证明，需对应具备 PG18 URL 的 CI 结果，未运行时不可说通过。
- **兼容及边界**：新增的是 Host 可选、默认不启用的端口；未改变既有 LLM Provider、PA-02 费用测试或业务授权，也不修改 `manager/server.ts`，未打开生产。`sourceVersion` 是 Host attestation 的可追溯版本标识，**不自动证明真实 tokenizer 已通过认证**。真实本地开源模型的 tokenizer、模板、上下文长度、额外开销和动态工具计数未确认，因此 **C01 未完全签收**。
- **仍待完成的 C01**：真实 Provider/local tokenizer 凭证与保守输入上界验证、重要 Working State 不因裁剪失效的优先级模型、模型升级后的新窗口策略、真实长对话超过预算时 Human 可解释的缩减/恢复与端到端验收。PA-04 整体仍 `IN_PROGRESS / NOT_SIGNED`，PA-02 R10 仍 `OPEN / NOT_DEV_COMPLETE`。

## 2026-10-15：C01 来源不丢失的历史对话优先级裁剪（第三个局部闭环）

- **目标**：对前一批完整请求/输出预留已获认证但超窗口的情形提供确定性退让，而不是把所有超限当成永远无法工作的 Agent。适用于可选、Host 授权的特定 Provider/model `contextWindow`；没有可追溯 Token 上界的 Provider 仍然 fail-closed，不能通过裁剪绕过认证。
- **分类**：Host/Provider 正式系统指令、开发者消息中的 Principal/Context、当前 Human 原始指令、Host 工具 schema/权限/观察、输出预留属于**受保护区域**；`run.input.conversationHistory` 中的普通旧对话属于**只读模型上下文候选**。最近四条普通对话同样保留，不尝试通过词语猜测哪些内容是有效业务决定。已持久化的 Run 原始历史、来源和 Receipt **绝不修改或物理删除**。
- **算法**：既有 Agent 模型请求构造格式 `system + history + current user + Host developer` 必须与 Host 已持久化历史逐项匹配；结构不匹配直接阻断。完整请求先调用经认证 Quote；**仅**当异常是容量不足时按历史最旧 25% / 50% / 75% / 全部可裁剪部分（最多额外四次 Quote）逐步排除历史，最少保留近四条，每个候选对包含全部工具/输出额度的**实际最终请求**重新 Quote。未知/错误 Quote、模型身份错配、必要区域自身超限立即阻断。上下文缩减在 PA-02 R10 合成成本预留之前，成本凭证仍针对同一份最终发送请求；未发生无界重复模型推理。
- **验证**：`tests/protocol/pa04-prioritized-context-history.test.mjs` 覆盖核心区原样保留、低优先级历史边界、源 Run 不改、最坏超限、不可信 Quote 不退让、历史区域伪造 fail-closed 等；原 `tests/agent-line/pa04-c01-certified-context-window-pg-e2e.test.mjs` 新增隔离 Host→Worker→PostgreSQL18 场景，要求真实持久历史完整、模型只见精简上下文、恢复不重复推理。相关 CI 为 `.github/workflows/agent-pa04-c01-context-window.yml`；运行前不能视为通过。
- **限制**：这仍不是完整 C01 PASS。当前优先级只是**结构性保护**：经 Host 提供的有效 Working State/工具观察保留，但早期仅出现在聊天文字中的重要决定可能随着旧历史移除。因此正式的 Working State 选择、来源治理/失效传播、权限更新、实际本地模型 tokenizer/模板认证和 Human 长会话验证仍待后续闭环；不能宣称“所有关键约束已自动抽取并永久保留”。本轮不修改 BEX/CP-03、`manager/server.ts`、主线状态、生产部署或 R10 真实计费授权。
