# PA-02A — 独立 Node 进程重启恢复门禁（2026-10-13）

Document class: AGENT_LINE_INCREMENTAL_EVIDENCE
Status: ISOLATED_POSTGRES_NODE_PROCESS_CRASH_RECOVERY_CI_PASS / NOT_HOST_WIRED / NOT_PRODUCTION

## 目的和当前基线

按 [2026-10-13交接入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261013.md) 和 [决策缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261013.md)，优先补原 [PostgreSQL唯一性实验](PA02A-POSTGRES-UNIQUENESS-PROOF-20261011.md) 未完成的**不同 Node 业务进程恢复**。旧字段 `postgresRestartRecovery:true` 只是连接重建，不等于应用进程重启。

本阶段只新增 `tests/agent-line/pa02a-process-recovery.test.mjs` 并把它加入原 `agent-pa02a-postgres-durability.yml` PostgreSQL 18 一次性服务的独立CI。实现继续调用已经合并进main、但**未绑定正式Host**的 `createPostgresAgentDurabilityProofV020`。不改同步V010、`manager/server.ts`、Conversation持久化、EVO业务系统、插件目录或生产环境。

## 设计与可复验断言（已于下列准确head的CI实际执行通过）

1. 测试父进程使用**真实独立Node子进程A**，在随机隔离 PostgreSQL schema 中完成 Run claim 和 REQUESTED Receipt 两次事务，**未向父进程确认结果前自发SIGKILL**。
2. 父进程实际观察 A 的 `SIGKILL`；启动新的**独立Node子进程B**重新连接同一数据库/Schema，从数据库读取Run、RUN_CREATED事件和未终结的REQUESTED回执。
3. B重复完全相同的turn与receipt idempotency key，必须复用原ID且不能新建。改变任务payload必须冲突；切换企业scope不能读取其他企业数据。
4. B诱发事件ID冲突，要求插入新Run与初始事件的事务**整体回滚**，被拒绝的turn无法查询。
5. 父进程用独立DB连接检查实际只保留**1条Run、1条Run事件、1条Receipt**；随机schema最后DROP，失败时同样清理。没有读取生产DB；无外部LLM或业务工具调用。

## 已确认边界（不可升级状态）

- 此门禁检验**实验仓储的真实进程终止与新进程读取**，并不证明正式Host使用了它，也不证明进程死亡中途业务动作可续跑。
- 模拟的「已提交但调用方未知」结果中，Receipt故意保持 `REQUESTED`，**不得自动推断为SUCCEEDED、不得盲目重放写入**。真实业务未知结果的 `UNKNOWN_PENDING_RECONCILIATION`、owner幂等查询、outbox、lease/fencing属于后续设计门禁。
- PostgreSQL**数据库服务本身没有重启**；不同机器节点恢复、Postgres断连期间响应、生产RPO/RTO和实际数据迁移仍OPEN。
- `scope` 在此由测试fixture构造；正式Host必须使用已鉴权的Principal/Context构造可信scope。测试跨企业查询被隔离，不代表已完成真实跨企业伪造输入端到端验收。
- 审计来源：GitHub提交、PR diff、CI run/job 原始记录优先。此文件不是产品上线签收。

## 下一门禁

1. 检查此PR精确head上的PostgreSQL CI，保存成功/失败的真实Run URL、断言及原因。
2. 核对Host当前同步V010依赖和Run状态机，确定先增**异步调用边界/特性开关**还是先补 `unknown write`、跨worker single-flight、lease/fencing/outbox；不允许隐式替换同步API。
3. 任何Host接入都另经真实隔离Host端到端、鉴权及回滚门禁，不随本实验测试改动开启生产绑定。

资料阅读等级：本阶段直接核对了GitHub原文 `manager/server.ts` Store构造位置、V020接口、隔离Postgres实现/测试/CI、PA02A候选设计和State Context宪法；旧14条外链仅历史索引(H)，未据此新增事实。

## 首轮精确CI结果（2026-10-13 UTC+8）

- 首次测试head：`fe699a2c17e8d5927c7bfe889a7dd5493d81c5a4`，PR [#799](https://github.com/jiangxng/EVO-App-Platform/pull/799)，[PostgreSQL 18工作流38345829365 / job115126899050](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38345829365/jobs/115126899050)，**SUCCESS**。
- 实际job log包含 `PA02A_ACTUAL_PROCESS_RESTART`：`status=PASS`、`parentObservedSignal=SIGKILL`、`recoveredFromDifferentNodeProcess=true`、`runCount=1`、`eventCount=1`、`receiptCount=1`、`receiptRemainsUnreconciled=true`；日志显示旧唯一性实验也PASS。
- 同一head上的Project Continuity、Lightweight Host Architecture与短分支退役审计均SUCCESS。此后文档增量提交需在**最终PR head重新检查CI**，不能拿第一次通过冒称最终head通过。
