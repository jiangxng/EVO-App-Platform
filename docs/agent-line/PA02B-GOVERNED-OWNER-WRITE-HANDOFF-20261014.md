# PA-02B — 受控业务 Owner WRITE Handoff（2026-10-14）

Document class: AGENT_LINE_INCREMENTAL_IMPLEMENTATION
Status: SANDBOX_WRITE_EXECUTION_AND_RECOVERY_PR / CI_PENDING / NO_PRODUCTION_ENABLEMENT

## 为什么只做这个小闭环

PA-02B 的 Fencing、PostgreSQL 写入意图、完整 Receipt 和 Owner UNKNOWN 核验在先前 PR 中已经通过单独测试。本闭环不复制这些原语，而是补缺少的受控衔接：**用相同 Host 可信作用域、WRITE 意图、Receipt、Owner 身份和幂等键，真正调用一次沙盒 Owner 业务写入**；即使 Owner 已提交但传输响应丢失，也绝不重新调用。

## 本 PR 实施范围

- `createGovernedAgentWriteHandoffV040` 的 `dispatch` 要求由 Host 注入可信 Owner；校验 Owner package、原 Run、Principal、EnterpriseContext、Receipt、输入摘要后，依次将 PREPARED 意图、REQUESTED Receipt、Owner link 持久化；仅在 Fencing lease 有效时允许一次 `beginWrite` 并且 **先提交 INVOKING，后调用外部 Owner**。
- Owner 调用后即使传输异常也不推断成功或失败：写入 UNKNOWN，归还原持有者的 exact fencing lease，然后使用原有可信 `ownerVerifier` 核验是否已有真实业务结果。只有 Owner 查证后才能让 WRITE、Receipt 一笔事务进入 SUCCEEDED/FAILED/DENIED。
- `recover` 是明确的无调用恢复路径：进程死在 INVOKING 后，恢复者只能将其隔离到 UNKNOWN 并查询 Owner，不可再次调用 Owner。租约仍有效时不会伪造终态。
- PostgreSQL 18 测试通过真实 `owner_business_effects` 表模拟经过授权的业务 Owner：在 **数据库已落业务结果、调用方未收到应答** 的情况下核验成功且仅一条业务副作用；无业务结果的 LOST reply 保持 UNKNOWN，取消被拒绝；跨企业不能触碰原状态。也覆盖在 INVOKING 后崩溃而未调用 Owner 的恢复。
- 此模块用于未来 Host 可信注册与业务 Owner 集成，**目前既未挂载正式 `manager/server.ts`，也没有实际企业插件 Owner 绑定或对任何生产业务执行 WRITE**。禁止把测试沙盒结果当作整体 PA-02 完成。

## 后续真正剩余的主线门禁

1. Host 根据插件注册的 Owner 能力构建 **可信** invoke/verifier port，并用已认证的当前 Principal/Context 授权业务写入；不能由 LLM 选择任意 Owner 回执。
2. 在实际可选 Agent Worker 内接入 WRITE 生命周期；从 `MODEL_DECISION_RECORDED` 到事前持久意图再到 Receipt，完成跨进程 Worker restart/Outbox、Run observation、最终用户反馈。
3. 真实业务插件的查询/幂等保障（业务 Owner 端）和各租户认证范围；长时间运行/断网/取消联动。主线轻量 Host 默认 OFF；生产发布单独许可。

遵照 `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`：一个闭环、一个短分支、一个 PR；合入并清理后才进行下一闭环。


## 2026-10-14：真实 Fenced Worker → Owner WRITE 增量（PR 此次持续开发）

- 不新增第二套 Worker。给现有 `createReadOnlyFencedAgentWorkerV030` 增加**可选、仅Host可信注入**的 `governedWrite` 端口：未注入时仍只向LLM暴露READ，WRITE仍BLOCKED；注入且精确匹配Tool+Owner后，先重新授权，再处理真实的持久化WRITE决策。
- `pa02-governed-worker-write-port.ts` 从持久Run、模型决策事件、工具参数和Host Principal/Context构造稳定幂等键与REQUESTED Receipt。对既有PREPARED可继续首次派发；INVOKING/UNKNOWN只能调用已有Owner核验流程；已证实终态只读取Receipt，不重发。业务操作参数在真实Owner调用前完整性校验。
- Worker不调用 `catalog.invoke` 派发WRITE。由Owner回执证实后换取新fencing令牌，把观测和Receipt ID写入真实Run事件；UNKNOWN则保留待恢复的Run、拒绝伪造成功与盲重发。
- 扩展现有 `agent-pa02-async-read-worker.yml`：PostgreSQL18真实业务表增量测试+原READ/Fencing/Owner/Cancel回归。正式 `manager/server.ts` 仍不注入业务Owner端口，生产默认关闭。通过CI及main合并后才标注此段完成。
