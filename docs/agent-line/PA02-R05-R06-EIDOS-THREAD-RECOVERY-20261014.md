# PA-02 R05/R06 — Eidos 现有 Thread 恢复消费 Host Outbox（2026-10-14）

**Class:** ORIGINAL PA-02 R05/R06 CLIENT-RECOVERY INTEGRATION EVIDENCE  
**Base:** `main@7e988fa8646f96b2e11b1af5283a146044c8e01d` (#845)。  
**Scope:** 复用 [服务端原始 R05/R06 Outbox](PA02-R05-R06-RUN-OUTBOX-REPLAY-20261014.md) 与现有 Eidos `recoverThreadBackedChatV010`，仅填补断线恢复的实际调用和验证路径。不另做 UI 系统、不部署生产，也不把 PA-03～PA-06 纳入。

## 原始缺口

Host 早已具备 `enterprise-agent.run.events`，PostgreSQL Run 事件持久身份、scope 与缺口 -> snapshot 回落已通过测试。但 Eidos `vendor/eidos/src/app-host/personal-agent-thread-chat.ts` 恢复尚未读取这个受授权接口。过去 **Host R05/R06 测试通过不等于工作台确实使用了重放协议**。

## 本轮修改

- `personal-agent-run-event-recovery.ts` 是完全 READ-only 的 Host Action 消费器，分页获取当前 Run 的事件（上限 16 页×100 条），按 `eventId` 幂等去重、按同 Run 的 `ordinal` 检查有无缺口。意外跨 Run 事件、非法游标、分页不能前进或返回数据不一致都停止恢复；不能将浏览器收到的普通事件视作业务 WRITE 成功。
- Host 返回 `resetRequired` 或客户端发现缺口时，丢弃不完整增量，仅保留 Host 同一 Run 权威 `state / lastEventId / actionReceiptIds` 快照。旧版 Host 没有 `run.events`（`ACTION_HANDLER_NOT_FOUND` 或 feature inactive）则保持既有 `thread.resume` 行为，不能迫使老部署升级。
- 现有 `recoverThreadBackedChatV010` 对找出的**唯一待回复的 Run**先通过授权 Host 读取 `run.events`，然后才对原 `threadId + runId` 调用原有 `thread.resume`，以便复原持久的 USER/ASSISTANT 消息。不会创建新 Run、重复发送用户问题或绕开原来的 Owner Fencing/取消。若 Host 拒绝访问 Outbox，则不执行 `thread.resume`；若返回的 Thread 状态与 Outbox 已确定的终态冲突，则拒绝伪成功。返回 `runRecovery` 以便上层看到恢复来源和 Receipt；旧有 Thread API、普通 `thread.send` 完全不变。
- 当前此变更用于已存在的 Eidos 浏览器恢复入口，并没有增加新的推送协议，也不宣称正式部署的全浏览器多进程端到端用户验收已经完成。

## 回归与反例

`tests/app-host/pa02-thread-outbox-recovery.test.mjs` 覆盖：模拟 Eidos 页面恢复 → Host scoped Outbox 两页 → 重复一条事件不重复累计 → 终态 Receipt/ASSISTANT 消息保持，模拟 R06 缺口必须丢弃增量/使用权威快照、跨主体 Host 拒绝时停止恢复、已完成 Run 快照与 thread.resume 冲突时 fail closed、分页无法结束不能无限循环。旧 `durable-thread-chat.test.mjs` 验证 V010-only Host 行为维持原样。

**验收边界：** 本批关闭 R05/R06 的 Eidos 浏览器端恢复**调用路径与模拟 Host**，不等于真正 HTTP 浏览器端到端测试。最终 R01–R10 签收需要合并已有独立 Host PG proof 和本 Eidos 调用 proof，必要时增加一次真实浏览器 HTTP 演练。R10 时间与费用上限仍另需对账。**CI evidence：** 必须取最终 PR head 的准确结果后登记，勿提前宣称通过。
