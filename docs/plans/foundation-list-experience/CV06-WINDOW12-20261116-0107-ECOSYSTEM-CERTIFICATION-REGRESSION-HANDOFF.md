# CV06 Window12 自动续跑 #01/07 — Ecosystem Certification 14 项失败收口

> 2026-11-16。接续 [#07/08 上一步恢复交接](CV06-WINDOW11-20261113-0708-EIDOS-AUTHORIZED-CHART-HANDOFF.md) / [PR #1322](https://github.com/jiangxng/EVO-App-Platform/pull/1322)，不重新开发 Eidos Chart、Kanban、业务权限或新列表框架。
>
> 证据等级：A=源码与已提交测试，B=GitHub 原始 Actions/PR，C=已明确聊天要求，D=本轮工程决策，U=尚未验收。**未获得 exact-HEAD CI 前不可写成功**。

## 1. 复核基线与源证

- protected `main@68990fa8d5be918d7157a6caf13d8d4752f54436`；检查 9 条并发 open PR，均未承担这批定时测试修复；本轮只在独立短期分支 `test/ecosystem-certification-14-regressions-20261116` 操作。
- [11-14 定时认证失败](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43584655559) 与 [11-15 失败](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43705726474) 均在旧 `main@d3d07b7ed981fc8f6b92218091c47e53f7e34720`；11-15 原始 full-suite Job #132786256711：2368 total、2227 pass、14 fail、127 skip。不能把这些定时失败伪装成已通过或直接归罪于 #1321 Chart。
- 旧 #1321 [当时完整通过证据](https://github.com/jiangxng/EVO-App-Platform/pull/1321#issuecomment-6855073273) 与后来全量定时失败是两个不同证据时点。

## 2. 失败归因与改动（精确 14 项）

| 原失败数 | 现有合同事实（A/B） | 有界修复/不可削弱项（D） |
| ---: | --- | --- |
| 2 · CV04 PostgreSQL 加密 Store / Poll | `export-job-pg-store.ts` 和 `export-job-pg-dispatch.ts` 先拒绝 `NODE_ENV !== test` 的隔离模块；专项 CV04 workflows 都声明 `NODE_ENV: test`，但定时全量认证原未声明，负例无法进入参数验证 | Ecosystem Certification 的 `test:all` 一步设置 `NODE_ENV: test`；**保留生产代码 admission 未改、无生产 Host EXPORT 注册**。 |
| 1 · App Host readonly submit | Eidos `collectFormValues` 仍 `if(field.readOnly) continue`，TypeScript 生成产物拆成两行；测试假定一行字符串 | 正则允许 `if` 与 `continue` 的空白换行，仍紧邻验证。保留 Eidos server-side forged readonly 字段拒绝。 |
| 2 · CV02 view navigation | 当前 Eidos Context Navigation 最少两个 breadcrumb item；旧测试 fixture 仅一项 | 增加合法父/当前两个节点，保持全部非法 view route、重复选择负例。 |
| 2 · Localization | 产品已经统一 `EVO Plugin Platform` / Personal Agent，并扩至 en、ja、zh-CN、zh-TW | 更新 UI 文案/语言列表预期，保留真实 Feature 启停导致语言包增删的断言。 |
| 7 · Manager lifecycle | Trading Lite 新增 `enterprise.application-runtime-binding` 依赖；旧模拟目录无提供方。Ledger 编译兼容包改为受管 `ledger.runtime.configuration` READ 能力，无声明可导航的 Eidos 旧页面；Agent 四语言 | 在测试中引入仅供 `planInstall` 图依赖的**显式 synthetic provider**，同时新增无 provider 时 `MISSING_CAPABILITY` 的拒绝断言；旧 Ledger 表单检查改为受管 READ Operation 有/无验证；文件 reopen/disable/uninstall 生命周期仍验。测试用 provider 不代表正式 Host AuthorizationProvider 或生产授权。 |
| **14** | **不同历史业务线的测试预期漂移，尚无数据证明 Eidos Chart 有新回归** | **不修改领域授权、安全 gate、主机生产设置、不准通过 skip/remove tests 处理** |

## 3. CI 工作流与原证验收

本 PR 定向修改已有 [`ecosystem-certification.yml`](../../../.github/workflows/ecosystem-certification.yml)：原 `schedule` + `workflow_dispatch` 保留；增加只针对其自身和上述旧测试文件的 PR、main push 触发，以便**精确 HEAD 全量 `npm run test:all`**（不是只跑 14 项的白名单）；`NODE_ENV: test` 只作用于 test 步骤。全量测试仍可失败并阻止本 PR 合并，不能把“预期修复”当成“已验证 PASS”。

最终 PR HEAD / 原始 Job / merged main / Branch Hygiene 与东京自动 Skip 的现场结果，以本 PR 最终评论的 GitHub 原证为准；在完成前不预填成功。

## 4. 未动边界与后续

- #1320–#1322、Eidos #210 既有受权 READ + Chart 不重复开发；#1184 Owner 文件 untouched。
- #1092 Railway Operator 和 #1212 生产 Owner 继续 OPEN；`N1=NOT_CERTIFIED`、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF。
- 如果 exact-HEAD CI 仍失败，读取其原始失败行在**同一 PR**修复，不跳过不放宽；只有全量、轻量 Host、Continuity 和所有自动触发的 Owner/跨项目 Gate 成功才 Ready→protected main。
- 本窗口仅收口定时全量基础测试证据；后续 #02/07 依赖真实新缺口而定，Kanban 的业务 Owner 枚举和 Eidos 上游仍须先行，不得在 Platform 私造。

---

## 5. 2026-11-16 自动续跑 #03/07：127 项 SKIP 的实际原因与独立验证证据

**此节是对 #1323 合并后主线的证据核验，不修改运行时代码/授权/测试。** 检查基线 `main@ad5dc57c3453901cae8f90510636bad0934ca08a`；原始 [merged-main Ecosystem Certification #43790513022](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43790513022) Job #133047621880：**2368 tests / 2241 pass / 0 fail / 127 SKIP**。独立从该 Job 的每一条 `ok N ... # SKIP <reason>` 逐条提取，127 条都有显式的数据库预置条件；**全量测试在该任务中没有执行这 127 条**，绿色总数不代表这些条目在相同环境都成功。

### 5.1 全部 127 条按照理由的互斥归类（B）

| Skip 原因归类（按明确环境条件，互斥） | 数量 | 对应主要业务线 |
| --- | ---: | --- |
| `CV03_RESOURCE_PROOF_DATABASE_URL` 或 `localhost/cv03proof` | **14** | CV03 N1 SQL 权威、C3-01/C3-02 含 Human/Agent/真实 HTTP |
| `CV04_EXPORT_TEST_DATABASE_URL` 或 `localhost/cv04_ci` | **31** | CV04 encrypted CAS、immutable audit、物理 Host/Worker、TTL、signed gateway |
| `PA02A_PROOF_DATABASE_URL` 显式指定 | **17** | PA02A/B/C、Host/Worker durable Run、PA05 单节点 Owner |
| 其他需单实例隔离 PostgreSQL18/真实 PG 的条目 | **51** | PA02 Run、PA04 C01–06、PA05 单节点 Owner 与 E01J |
| 明确需要**三个彼此独立 PostgreSQL18 集群** | **14** | PA05 Cross-DB / E01J / Object Extension 跨数据库约束 |
| **合计** | **127** | 100% 有显式 PG 隔离条件；非无原因 SKIP |

> 分类仅按原始日志的 `SKIP reason` 优先级分组，**不是**按功能名归类。例如 PA05 的单数据库项在“其他单 PG”或 `PA02A_PROOF_DATABASE_URL`，而其三物理集群项进入“3 集群”。这些分类可重算，不要把“存在专项文件”推断为 127/127 在当前 main 被实际运行。

### 5.2 已复用的专项 Workflow、实际 Jobs 与证据边界（A/B）

| 能力及原始 Workflow | 真实已完成的原证 | 有界结论 |
| --- | --- | --- |
| CV03 [PostgreSQL18 Atomic CAS](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/cv03-resource-postgres-atomic.yml) | [Run #43436767862](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43436767862), Job #131923790874, **38 pass / 0 fail / 0 skip**；真实 C3-02 Human Eidos Signed PG / N1 SQL denial markers | 已在 2026-11-13 的历史 PR SHA 验证；不是当前生产 Human/Owner 认证，也不是当前 main 上 127 个 SKIP 被重新执行。 |
| CV04 [Encrypted PG CAS](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/cv04-dictionary-export-pg-encrypted.yml)、[Signed PG gateway](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/cv04-signed-export-pg-gateway.yml)；另有 [immutable audit](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/cv04-pg-export-immutable-audit.yml)、[Host/Worker lease](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/cv04-export-sql-host-worker-lease.yml)、[TTL](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/cv04-export-pg-active-expiry.yml) | [Signed #43209191962](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43209191962), Job #131152054027: 18/18 signed + 5/5 immutable + 5/5 encrypted + 8/8 Owner 全部 0 skip；[Encrypted #43250268315](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43250268315), Job #131293848960: 5/5 PG encrypted + 11/11 Owner, 0 skip。 | PostgreSQL16 disposable 独立 CI 先前真实运行过；生产 Host **没有**启用正式 EXPORT。不能为压低 nightly SKIP 计数把专用证书/数据库环境塞到泛用 Suite。 |
| PA02 [A durable PostgreSQL](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa02a-postgres-durability.yml)、[B fenced authority](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa02b-fenced-run-authority.yml)、[C atomic cancellation](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa02c-atomic-run-cancel.yml)；[Host optional READ](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa02-host-optional-read.yml) | [Host optional READ #43436768323](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43436768323), Job #131923792794: **3 pass / 0 fail / 0 skip**，`defaultOff=true`、无主机 DDL/WRITE、跨企业拒绝、`productionEnabled=false`；其它 PA02A/B/C 同类 PostgreSQL18 专项工作流已查实配置，但**本次未逐个取得最新 Job 全文**。 | PA02A/B/C 有隔离 PG18 workflow，而不是默认 nightly 的共享 DB；尚不能把 17 + 51 中全部 PA02 条目标为当日单项复验完成。 |
| PA04 [C01–C06 consolidated](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa04-c01-c06-consolidated.yml)；[C02 revocation](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa04-c02-source-revocation.yml)；[C05 injection](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa04-c05-tool-injection.yml) | 现有 YAML 均配置 disposable PostgreSQL18、`PA02A_PROOF_DATABASE_URL` 并调用对应 tests，consolidated 另有防 skip 验证；**本次未核到与最新 main 一致的原始成功 Job**。 | **A=已有运行入口，不等于 B=当前运行成功。** 这是需要保留的证据缺口，不能把运行预期写成实际通过。 |
| PA05 [three independent PostgreSQL18 clusters](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa05-cross-database-admission.yml) | [Run #43437374010](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43437374010) main@d3d07b7ed981fc8f6b92218091c47e53f7e34720, Job #131925858011：**28 pass / 0 fail / 0 skip**，独立端口 5432、5433、5434 / 独立三服务。原日志 `physicalClusters=3`，但同时明确 `productionWriteEnabled=false`、`privilegedTableOwnerCanStillDisableTrigger=true`、`realProductionDataMigrated=false`；部分场景明确 `productionCrossStoreAtomicityCertified=false`。 | 隔离三集群有真实成功实验，但证明的是受限、非生产的拒绝/分段一致性边界，不是跨库原子性或生产 Owner 完整获证。 |

### 5.3 结论与后续严格范围（D/U）

1. **已完成：** 对合并主线 `127/127` 条 skip 分别定位到 DB 环境前置原因；查到现成专项工作流和 CV03、CV04、PA02 Host READ、PA05 三物理集群的历史真实 SUCCESS+零 Skip 原始日志。无需修复业务代码、放宽隔离权限、发明第二套 CI。
2. **未完成（U）：** PA02A/B/C 与 PA04、PA05 单数据库/其余 51 条的**逐条现行 exact-main zero-SKIP 作证**尚未完成；隔离工作流可能在旧提交有成功，但本次未读到所有原始日志。所有 127 条在同一个 nightly 中完全运行、生产真实 Operator/Owner Human 签署也未获证；后者不应由 CI 取代。
3. **明确不做：** 不给 Generic Ecosystem Certification 默认附上真实/共享生产 PostgreSQL 或三套外部凭据；不为追求 `skipped 0` 让 CV03/CV04 生产默认开启；不对多集群的隔离测试成绩声称生产全局原子、真实在线数据、持续可用。非签署状态维持 `N1=NOT_CERTIFIED`、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF；[Operator #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) / [Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) / [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不跨窗口修改。
4. **#04/07 的最小必要动作：** 如果仍需收紧 CI 证据，优先按已有专项 Workflow 的实际 Job、test-name/marker、commit SHA 补齐 PA04 与 PA02 逐条映射，再决定是否存在真正**未覆盖的**跳过条目；只对证实缺失的项目触发专项复核或提窄化 Gate PR。**不重新跑全量“研究”和全部127条，也不造 Kanban。**

## 5. #03/07 — 127 条物理 PG 跳过证据与 CI 反回退（2026-11-16）

**证据基线**：合并后的 [Ecosystem Certification Run #43790513022 / Job #133047621880](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43790513022) 原始 TAP：2368 total / 2241 PASS / 0 FAIL / **127 SKIP**。从每个 `ok N - NAME # SKIP REASON` 而非关键词模糊计数提取，全体 127 条均说明需要物理 PostgreSQL/独立数据库证明，分别为：

| 归属工作线 | 原始 TAP 的 skip 数 | 典型跳过前提 | 项目已有独立 Actions（只是存在，非今日 127 项均被重验） |
| --- | ---: | --- | --- |
| CV03 | 14 | `CV03_RESOURCE_PROOF_DATABASE_URL`、PG18 `localhost/cv03proof` | `cv03-resource-postgres-atomic.yml`（PG18）及现有 CV03 N1 专项 |
| CV04 | 31 | `CV04_EXPORT_TEST_DATABASE_URL`、`CV04_EXPORT_SIGNED_GATEWAY_ONLY=YES_DISPOSABLE_CI`、PG16 | `cv04-dictionary-export-pg-encrypted.yml`、`cv04-pg-export-immutable-audit.yml`、`cv04-export-sql-host-worker-lease.yml`、`cv04-export-pg-active-expiry.yml`、`cv04-signed-export-pg-gateway.yml` |
| PA02 | 40 | `PA02A_PROOF_DATABASE_URL`、独立 PG18、真实 Worker/Host | `agent-pa02a-postgres-durability.yml`、`agent-pa02b-fenced-run-authority.yml`、`agent-pa02c-atomic-run-cancel.yml` 和既有 Host READ workflows |
| PA04 | 9 | PG18、Model/Run 严格证据、C02/C03/C05 测试 | `agent-pa04-c03-read-freshness.yml`、`agent-pa04-c05-tool-injection.yml` 及既有 C02/C01 检查 |
| PA05 | 33 | PG18，多数需要认证的三个物理独立 PG18 实例 | `agent-pa05-cross-database-admission.yml`（三 PG18）、`agent-pa05-governed-write.yml` |
| **合计** | **127** | **仅通用套件跳过，不是通过** | 专项多为 path-filter PR/push 与显式 `workflow_dispatch`，不可按存在即算成功 |

**实际已有原证的例子（B）**：
- [PA05 三 PG18 cross-database 原 Action #43437374010](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43437374010) 为 2026-11-13 `main@d3d07b7...` SUCCESS；只证明该历史时点对应 job 的范围，不可冒称今日 SHA 5e64cb1 的 33 条都重新通过。
- [CV03 Enterprise Resource PG 原 Action #43436767862](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43436767862) 为 2026-11-13 旧 PR HEAD SUCCESS，不能替代今日完整集。
- CV04 PG16 workflows 逐一核对显示真实 `postgres:16-alpine` service、`NODE_ENV=test` 与隔离 schema、合法 admission flags；PA02/PA04 workflows 为 `postgres:18` service + `PA02A_PROOF_DATABASE_URL`。**本轮尚未核实这些独立 Actions 在今日 main 的新执行结果**，此处不标记 “127/127 covered by recent physical CI”。

**已实际增加的 CI 反回退（非业务运行时）**：
- 新增 `tools/ecosystem-skip-proof-inventory.mjs` 读取 `npm run test:all` 完整 TAP；要求 TAP `tests=pass+fail+skip`，逐一识别数据库原因与 CV03/CV04/PA02/PA04/PA05 工作线，超出当前可审计 baseline `127` 或出现未知跳过失败，明确输出“这些不是已认证的 PASS”。
- 新增 `tests/ci/ecosystem-skip-proof-inventory.test.mjs`：正常五工作线计数、未知 skip 拒绝、增长拒绝、summary/真实 FAIL 拒绝、GitHub timestamp prefix 校验。旧 127 项在通用套件中**仍然 SKIP**，绝不将跳过静默清零；不是为通过 CI 而跳过测试。
- 更新既有 `.github/workflows/ecosystem-certification.yml`：保留原完整 `npm run test:all`、`NODE_ENV=test`、`schedule`；用 `set -o pipefail` + `tee` 保存 TAP 后执行审计；只有测试本身和审计均成功时 full-suite SUCCESS。仅将这两个审计文件增入既有 PR/main path filters；不让 193 个专项 workflows 每次 docs push 全量跑三 PG 集群。
- **验收要求**：只有本 PR exact HEAD + 合并后 main 的新 full-suite 原 Job 完成，才可标记此反回退机制生效。127 条专项物理验收依然单独作为开放证据，不等于 `N1` 生产签署；#1092/#1212 OPEN、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF 不变。

**潜在后续精确任务**：逐条映射 `测试文件 → workflow command → 最近 run/head SHA → 物理 DB 环境`，只给真正无覆盖的用例新增窄门禁；绝不借机创建第二套 Eidos Chart/Kanban，或部署实验 PostgreSQL EXPORT 到生产 Host。
