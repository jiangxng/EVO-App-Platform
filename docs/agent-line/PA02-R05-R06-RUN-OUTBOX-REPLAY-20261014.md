# PA-02 R05/R06 — 现有 Host Run 的 Outbox 和游标恢复（2026-10-14）

**Contract:** 原始 PA-02 R05（Outbox 重复投递，消费者/界面去重）及 R06（事件缺口重放或权威快照）。不延展至 PA-03～PA-06。起点 `main@b8b502b7fe5eb5770e981a8627598fa29e87d423`（#842）。

## 之前的问题

`manager/realtime-event-bus.ts` 的 `/v1/events` SSE 使用内存有界环形缓冲；这是实时提示，不是 PostgreSQL Run 的长期 Outbox。PA-02B 旧名为 fencing-outbox 的专项实际验证的是租约、WRITE intent、UNKNOWN 状态，不曾对 Run 的 **Outbox 重复投递与 gap** 做独立的正式 Host 端到端证明。不能将这两个以前的局部能力直接标记成 R05/R06 通过。

## 最小实现

- 利用已经存在的 `agent_run_events`、`agent_turns` 作为权威，不引入 Kafka、Redis 或第二套 Run 状态。
- `pa02a-postgres-durability-proof.ts` 对独立 `pa02_*` 持久执行 schema 建立 `agent_run_outbox` 和一个 `AFTER INSERT` 数据库触发器。任何已有写路径——PA-02A 首次 Run、正式 fenced Worker 追加、PA-02C 原子取消的最终事件——都在**同一事务**留下独立唯一的 `event_id` Outbox 行；一笔事务回滚则没有孤立 Outbox。启动时对已有运行事件安全回填 `event_id`，唯一约束防止重复产生权威事实。
- `manager/agent-pa02-run-outbox.ts` 提供仅 Host 获得的 principal/context scope 下，针对**一个** Run 的游标分页读取。顺序权威为同一 Run 的 `ordinal`，全局 Outbox sequence 中间有其他 Run/租户的编号是正常现象，不能被误判为同 Run 缺口。
- 正式 `manager/agent-async-read-worker-runtime.ts` 暴露同 scope `replay`，并通过 `enterprise-agent.run.events` action 返回 `events / nextCursor / hasMore / resetRequired` 和同一个 Run 的**权威快照**。未知/过期 cursor、Outbox 记录缺口不得继续发送不完整的增量结果，改由快照恢复；不继续计算模型、不重新发起 WRITE。
- Consumer 应以稳定 `eventId` 去重，不能按到达次数直接追加；删除/丢包后的恢复必须读取权威 Run 的 `state / lastEventId / actionReceiptIds`，避免终态及已经发生的效果丢失。现有 SSE 无持久事件的设计没有被改动；本批提供了通向工作台的授权 Action，但**不声称 Eidos UI 消费者已经改为监听此 Outbox**。

## 具体验收

`tests/agent-line/pa02-host-run-outbox-replay.test.mjs`：通过正式 `run.start` 完成 PostgreSQL Worker READ Run；通过 `run.events` 分页、同 cursor 两次请求模拟重复投递、以 eventId 去重；顺序收齐至 `RUN_SUCCEEDED` 且工具只执行一次；跨 principal/Context 拒绝；未知 cursor 触发 `resetRequired` 并附权威已完成快照；隔离实验删除一条 Outbox 行模拟事件序号缺口，不能返回不完整的增量流；重启后仍可获取权威终态和拒绝 foreign scope。CI 在 PostgreSQL18 独立 schema 执行，不涉及生产数据。原有 PA02A/B/C Run/Owner/取消回归继续执行。

**与 PA-02 阶段验收的关系：** 本批是 R05/R06 的 Postgres Host 服务端集成验收，不等于用户的真实 Eidos 前端或多实例 SSE 已切换到持久 Outbox。最终 R01–R10 汇总时需要检查浏览器和事件恢复的使用路径，再决定正式阶段签收。此处不要新增 UI 重构或生产 Provider 迁移。

**已核实执行证据（代码 head `b447cd4447bca7249fc250f96058441648983ca0`）：** [Host Async READ PostgreSQL18 #38516627246](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516627246) **5/5 PASS，0 FAIL，0 SKIP**，含 `PA02_R05_R06_HOST_OUTBOX` 真实 Run/Outbox/消费去重/序号缺口/跨主体/重启验收；[PA02A Async Uniqueness #38516627186](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516627186)、[PA02C 原子取消 #38516627296](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516627296)、[Lightweight Host #38516627123](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516627123) 均成功。该 head 19/19 工作流成功。后续合并 main 的最终 head 必须另外核验，不借用旧 head 绿灯。
