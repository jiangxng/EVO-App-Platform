# PA-02A：独立 PostgreSQL 异步Run/Receipt唯一性验证 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT
Status: `ISOLATED_POSTGRES_DURABILITY_PROOF_PASS_NOT_INTEGRATED`

## 证据和边界

- 依据[PA-02A候选异步持久端口设计](PA02A-ASYNC-RUN-RECEIPT-PORT-DESIGN-20261011.md)及原项目[State & Context宪法](../architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md)。
- 代码 Draft [PR #692](https://github.com/jiangxng/EVO-App-Platform/pull/692)，branch `agent/pa02a-postgres-async-uniqueness-proof-20261011`，base = #579 (`agent/pa01b2-page-assistance-20261010`)，精确head `9f794cf928d9a01e55a22c6d5742ea23fd7bc456`。
- 实证 [GitHub Actions run 38098470224](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098470224) / job `114349241657`：**SUCCESS**，`npm ci`、完整构建及PostgreSQL 18独立CI均成功。
- 只有新增 `contracts/agent-durability-async.ts`、`agents/enterprise-agent/pa02a-postgres-durability-proof.ts`、独立测试与workflow。原Sync V010接口、manager/server.ts、Conversation PostgreSQL authority、vendor、全局状态与2D均未变；未切生产Provider、未部署、未迁移。
- 数据库由一次性GitHub CI postgres服务创建，在随机隔离schema内验证并DROP schema cleanup；无Railway生产连接或真实业务数据。

### GitHub日志可核断言

```json
{
  "status": "PASS",
  "concurrentTurns": 32,
  "turnsBeyond100": 131,
  "turnIdempotent": true,
  "scopeIsolation": true,
  "revisionCAS": true,
  "receiptConcurrentBegins": 32,
  "receiptConcurrentTerminals": 32,
  "postgresRestartRecovery": true,
  "productionUsed": false,
  "serverAdapterEnabled": false
}
```

注意：测试输出字段 `postgresRestartRecovery` 的实际运行含义为**关闭两条PostgreSQL客户端连接并创建新连接后能重新读取同一数据库数据**；测试脚本没有真正终止并重启独立Node业务进程，不能声称“跨进程崩溃恢复”已通过。正式重启/数据库恢复演练仍OPEN。

已验证：32路并发同scope/thread/clientTurnId仅创建1 Run，不同任务payload被拒；经过131条新Run仍能直接查原始turn，无100条扫描问题；不同Host scope读不到原Run/Receipt；事件revision CAS阻断过时追加，按ordinal恢复顺序；32路回执相同幂等键仅1创建、32终态竞争只转移1次；不同摘要或矛盾终态冲突；关闭数据库连接再连接可取回Run事件及Receipt终态。

### 首轮失败与修正

1. [run 38098313140](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098313140) 的第一轮DB测试在并发winner查回时 `CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED`，随后诊断得知驱动此环境将JSONB读取为字符串，不能直接与对象深比较。
2. [run 38098415889](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098415889) 将持久任务payload先解码，identity测试前进；又在首个Run事件读取时发现同一JSONB反序列化问题（type读取为undefined）。
3. [run 38098470224](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098470224) 正确解码Run事件JSONB后，独立完整实验PASS；两次失败记录仍保留，不抹去证据。

### 严格不能升级的状态

- **NOT_PRODUCTION_INTEGRATED**：真实Run/Receipt handler仍使用原Sync接口与原Store路径。这个proof没有接上正式Agent执行后端，也没有操作生产数据库。
- **NOT_CROSS_PROCESS_WORKER_PROOF**：两条独立DB连接不是两台机器上的有租约worker；outbox、fencing、未知写入恢复、真正Cancel仍属PA-02B/C。
- **NOT_MIGRATION_READY**：实际生产Run/Receipt数据规模、绑定环境、RPO/RTO、备份/回滚与权限责任仍未测，不能迁移。
- **NOT_FULL_DURABLE_RUN_SEMANTICS**：本次demo验证的是数据库唯一性、持久事件有序存取与幂等Receipt关键原语，未证明完整事件状态机、限额/分页/多租户多主体性能/生产SLO。
- **NOT_VERSIONED_CONTRACT_RELEASED**：V020候选端口不替代任何原Sync V010，尚需owner review和独立实现演进。

接续：保留此作为PA02A第一组数据库proof，继续添加真正独立进程重启、Postgres故障回滚、执行时未知写入和关联会话一致性；在未核对主线现状/并行PR前不得改共享server或生产adapter。
