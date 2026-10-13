# PA-02阶段门禁实证状态 — 2026-10-13

Document class: VERIFIED_AGENT_LINE_STAGE_GATE_SNAPSHOT
Scope: EVO-App-Platform agent line only; NOT production signoff.

这是对2026-10-13三份交接文档的**增量结果索引**，并不覆盖原研究来源的访问等级。涉及准确GitHub SHA/CI，优先以PR和Action log为准。

## 当前GitHub合并状态（均进入main，过程分支已删除）

| PR | 合并提交 | 实际闭合的**独立验收证据** | 未被证明/不可升级的状态 |
|---|---|---|---|
| [#799 PA-02A进程恢复](https://github.com/jiangxng/EVO-App-Platform/pull/799) | `c22be54439a01e9741c6f6f2369cc8b5c51490b4` | [PostgreSQL18 job 38346000622](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38346000622)，新业务进程重新读取遭SIGKILL的前进程已提交Run及REQUESTED Receipt、幂等和回滚 | 无Postgres服务重启；Receipt结果未明，未接正式Host |
| [#800 PA-02B隔离fencing](https://github.com/jiangxng/EVO-App-Platform/pull/800) | `92faf7ec69e0ae1de82288dec92fa5c622c91609` | [PostgreSQL18 job 38347246849](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38347246849)：24个租约争用只有一个有效持有者、fence递增、旧worker终结拒绝、WRITE UNKNOWN不重播；该head其他相关CI成功 | 非正式Host真正Worker调度；外部owner Tool端幂等、Outbox完整dispatch和UNKNOWN owner查验未完成 |
| [#801 PA-02C取消屏障](https://github.com/jiangxng/EVO-App-Platform/pull/801) | `b41c02712bb9c1d14de425f3b7c75ec9415a1712` | [PostgreSQL18 job 38347671027](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38347671027)：持久取消、拒绝新写、等租约退出、未知WRITE不伪称CANCELLED；PA02B回归成功 | 隔离Coordinator的取消记录≠正式AgentRun的RUN_CANCELLED事件；真实用户/模型/业务写入取消尚未验收 |
| [#802 PA-02A Host可信scope异步桥](https://github.com/jiangxng/EVO-App-Platform/pull/802) | `858e3119b68bce403b0b59b002a67c0b08b028ce` | [PostgreSQL18 job 38348081884](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38348081884)：Host已解析的Principal/Context强scope、版本化完整task去重、V010 reducer回放终态、跨租户不可见 | 桥未在正式server启用；V020 Receipt字段/版本与旧V010不等价 |

**准确结论：以上四个PR是可靠性基础与前置门禁的工程成果，均不代表PA-02A、PA-02B、PA-02C整体生产功能验收完成。** 完整PA-02的状态为 `IN_PROGRESS / NOT_PRODUCTION_READY`。

## 无需用户阶段性人工验收即可继续的剩余实施

1. 正式Host async Run/Receipt **完整权威接线**，包括现有V010 JSONL/内存历史兼容、Run身份永久唯一键替换100条扫描、Thread/Conversation一致性及真正异步Executor/Handler/恢复入口。不得同步包装异步Promise。
2. 主体授权与跨企业边界下让真正Worker使用PA-02B lease/fencing；确认外部业务owner能以同一个幂等键校验实际动作是否成功，使UNKNOWN有确定性 reconciliation，且禁止过期Worker重放。
3. 将PA-02C的REQUESTED与Worker安全停止、真实Run状态机 `RUN_CANCELLED`、Receipt与界面用户反馈实现一致的可恢复状态；覆盖执行中、掉线、跨进程重启、Postgres故障、长时间工作及错误权限场景。
4. 用**真实隔离Host**跑完整端到端授权与失败恢复测试（含真实企业业务工具的测试沙盒，不对正式企业写入），记录RPO/RTO、回滚策略及兼容门禁。生产连接/部署需与既定owner权限边界另行处理。

## 源码结论与工程判断区分

- **源码直接读取**：`manager/server.ts`仍构造`createAgentRunStoreV010`和`createAgentActionReceiptServiceV010`；`thread-turn-action-handlers.ts`仍基于Run.list(100)寻找clientTurnId；原Runtime仅进程内Map做single-flight；PA-02A/B/C的实验代码非正式绑定。
- **项目判断**：正式Async迁移依赖有序的兼容切换/owner授权、完整Receipt信息、同事务Run状态和fence纪律、安全取消联动；这些必须通过实测。优先严谨补真实闭环，不以“main已合并”或“CI绿色”替代功能/生产完成。
- **外部参考**：原14条外部网页仍属H级历史索引，未据未打开的链接虚构新规范依据。所有新增访问为GitHub当前原文、PR/CI元数据和日志。

不改TR、2D、Ledger Runtime、EVO业务权威、共享`project.status.json`及部署。

## PA-02 最新实施增量 — 旧Turn精确查找（2026-10-13）

[#804候选：以创建后的实际PR编号为准] 纠正正式V010 Host的一个真实正确性缺口：原 `thread-turn-action-handlers.ts` 使用 `runStore.list({limit:100})` 寻找 `clientTurnId`，早于最近100条的用户Turn在网络重试时会被误判为全新任务。新增V010 `getBySource` 做Principal/actor/Context/Thread/sourceAction精确不限页查询；同一个Sync Store内强制相同source的二次创建失败；整合测试制造131条更新Run后复发原请求，确保不重复LLM执行/用户消息与拒绝不同输入。

**限制：** 这是当前Host V010的单实例防重复修复；JSONL跨进程没有SQL式原子唯一约束。无法替代PA-02A全异步Host接线及PA-02B实际多Worker执行。精确PR与CI结果须另查最新GitHub状态，不从此段推断已合并。

## PA-02A Receipt事件结果与原始调用证据保真（2026-10-13继续）

**代码事实**：旧V020 PostgreSQL `agent_receipts` 只有 `receipt_id/idempotency_key/input_digest/status/revision`，不能满足旧正式V010回执对于Owner、来源Interaction、权限主体、完成时间、结果实体和失败细节的还原需求。

**本批改进**：通过独立PostgreSQL schema迁移 `request_payload` 与 `terminal_payload` JSONB，原始Host请求及真实Owner提供的终态资料可保存、重试复用、关闭连接后恢复，并校验重试更换Owner/Tool的身份冲突、跨企业伪造的请求Scope；保留旧行无metadata时显式阻断身份重放。异步V020的终结字段仍可空以兼容此前实验，但**正式Host必须要求证据完整及由业务Owner验证**。本改动不是正式Host启用，也不能让尚未获得业务核验的UNKNOWN自动变为SUCCEEDED。PR与CI状态以GitHub提交核验。


## 2026-10-13 PA-02C跨Coordinator统一事务增量（[#806](https://github.com/jiangxng/EVO-App-Platform/pull/806)）

- **读源码确认的问题**：先前PA-02A的Run事件、PA-02B的lease、PA-02C的cancel分别能通过数据库实验，但并未在一笔事务内将正式V010语义的`RUN_CANCELLED`、Run revision、取消Coordinator终态联动；另`claimLease`在读取取消状态与实际拿租约之间有竞争窗口，Receipt的旧JSONB数据以字符串格式存储，导致直接JSON字段查询可能忽略未终结业务操作。
- **本PR解决的隔离层问题**：`pa02c-atomic-run-cancel.ts`对同作用域Run+取消使用PostgreSQL事务，并在同一事务中核对有效Worker lease、INVOKING/UNKNOWN写入、REQUESTED Receipt后才追加V010 `RUN_CANCELLED` 事件和递增revision；PA-02B领取/续租/写入启动与取消共用事务级advisory lock；PA-02A追加事件在数据库事务中重放V010 reducer，拒绝已终结Run复活；JSONB请求与终态改用真正对象编码，并归一化旧JSONB字符串。
- **独立验收**：带PostgreSQL18服务的GitHub CI覆盖跨企业、Run终态幂等、失联Worker、在途WRITE、未完成回执、数据库重开、既有PA-02A/B/C回归。最终通过状态与合并提交必须核对最终PR head。
- **绝对不代表**：真实Host `manager/server.ts` 已接成PostgreSQL异步Runtime、具备真正跨节点调度与外部业务Owner的结果核对、取消按钮已端到端可用或生产准备完成。原有SYNC V010仍权威，线上运行未因此被切换，**PA-02继续进行**。
