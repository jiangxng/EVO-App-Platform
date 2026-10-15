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
| C01 | 上下文超过预算；保留核心约束，总预算含工具/输出 | **OPEN**。AF-02 有对话字符限制/压缩，但字符限制不代表完整模型请求 token 预算；需包含实际模型工具/系统/输出预留。 |
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
