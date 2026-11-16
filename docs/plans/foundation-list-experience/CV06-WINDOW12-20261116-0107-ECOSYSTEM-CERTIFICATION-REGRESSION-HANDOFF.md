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


---

## 6. 2026-11-16 自动续跑 #04/07：恢复范围 + 127 条测试文件到物理 Workflow 的证据映射

> 本节在 **protected main@538e2d83bc0fc5332cd840650122efdaab5b1079** 只做定向证据复核及交接。C=原用户指令/可恢复上下文；A=当前 main 的源码与 Workflow 实际执行命令；B=本轮读取的 PR/Actions/完整 TAP 直接记录；S=历史索引/页面线索；U=无现行原证。**A 级存在执行命令绝不是 B 级通过，更不是生产认证**。

### 6.1 恢复了哪些决定；哪些未重做

- **C / 已确定的工程范围**：复用现有 Eidos Catalog Browser、Data Grid、Platform Capability / ActionRouter、Domain Owner 权限和现存 PostgreSQL 专项 Workflows；不另建 BaseList 巨型框架、第二套 Chart/Kanban/通用 CI、业务 Repo 直连 Host 或 Agent 绕权路径；小样本隐藏与无权时保留合法原列表。开发遵守独立短分支 PR、精确 HEAD 门禁、protected main 与已合并过程分支的 Branch Hygiene Actions；不触碰并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) Owner 文件。
- **D / 采用理由**：领域 owner 控事实、完整查询/聚合与行列裁剪，Host 鉴权并按企业和 Feature 重查，Eidos 只呈现受权结果；物理 PG 不塞进泛用 nightly，是因为 CV03/PA02/PA04/PA05 的隔离 PG18、CV04 的独立 PG16/签名条件和 PA05 的三集群边界不同。只补失去证明的特定 Workflow，而非把 127 条标成 PASS。
- **D / 已放弃或推迟**：新 List Framework/深继承基类（多业务 Owner 不可复用存储/权限）、从分页行拼全量图表（会造假）、没有业务 Owner 枚举和 Eidos owner 通过就做可拖动 Kanban（容易变相 WRITE）、为了绿 CI 增加 skip/降低权限、生产运行时开放 CV03 Human SAVE/CV04 正式后台 EXPORT、把 Railway 历史网页索引当 live Operator 证明。详见 [2026-11-06 架构决定](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[CV00–07 近期计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[Window10 原始来源/采用取舍](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md) 与 [Window11 真 Eidos Chart 接续](CV06-WINDOW11-20261113-0708-EIDOS-AUTHORIZED-CHART-HANDOFF.md)；不再重新做外部搜索。
- **A/B 已完成但有界**：Eidos [#210](https://github.com/jiangxng/eidos/pull/210) + Platform [#1320](https://github.com/jiangxng/EVO-App-Platform/pull/1320)、[#1321](https://github.com/jiangxng/EVO-App-Platform/pull/1321) 真实受限聚合 Chart 已合并并有 Host/Chromium 证据；[#1323](https://github.com/jiangxng/EVO-App-Platform/pull/1323) 消除 14 项旧测试预期漂移；[#1324](https://github.com/jiangxng/EVO-App-Platform/pull/1324) 留存 127 项审计；[#1325](https://github.com/jiangxng/EVO-App-Platform/pull/1325#issuecomment-6905893362) 对全部 127 SKIP 增 CI 反回退并合入。
- **U / 明确不恢复成原话**：当前会话未取得逐字旧聊天导出文件，历史聊天约束只按既有交接和可恢复记录；Railway Autodeploy [官方文档索引](https://docs.railway.com/deployments/github-autodeploys) 仍是旧 Window10 的 S 级线索，不能变成今天服务开关实测。东京现时 SSH 容器 digest、真实生产 Human/Owner 签字、物理手机和在线 LLM 均无本轮新证明。

### 6.2 A+B：从主线 TAP 逐字标题定位到测试源码和 Workflow run 命令

合并后 [Ecosystem Certification Run #43794012042](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43794012042) / [Job #133058605428](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43794012042/job/133058605428) 的 127 个原始 `ok N - NAME # SKIP REASON`，本轮用**完整测试标题**与当前 main 源码逐项对应（126 项在 tests/agent-line，另 1 项 PA04 C02 在 tests/protocol）；再检查各独立 YAML 真正的 `node --test` 命令而不是仅检查 path filter。结果 **127/127 唯一映射，26 个现存独立 Workflow 入口**（主 Workflow 最小归属；一个测试也可能在多个 Workflow 执行）。下表源测试名称默认路径为 `tests/agent-line/` 且后缀 `.test.mjs`，标明 `tests/protocol/` 的一项除外。索引数字只表示原始 TAP 中 127 条 SKIP 的出现顺序，不是全量 suite 的 TAP 序号。

| SKIP 索引（共 127） | 当前源码测试文件 stem → 真正执行命令的 Workflow | 现有专项 Workflow |
| --- | --- | --- |
| 1-5 | cv03-n1-signed-sql-gateway; cv03-n104b-tenant-read-isolation; cv03-n104c-authenticated-authority-event; cv03-n104d-pa05-real-manager-authority; cv03-n104f-authority-tx-outbox-recovery | [cv03-resource-postgres-atomic.yml](../../../.github/workflows/cv03-resource-postgres-atomic.yml) |
| 6-9 | cv03-personal-saved-view-postgres | [cv03-resource-postgres-atomic.yml](../../../.github/workflows/cv03-resource-postgres-atomic.yml) |
| 10-14 | cv03-postgres-runtime-role-admission (10); cv03-resource-postgres-atomic-receipt (11-12); cv03-resource-postgres-conditional (13-14) | [cv03-resource-postgres-atomic.yml](../../../.github/workflows/cv03-resource-postgres-atomic.yml) |
| 15-18 | cv04-dictionary-export-job-pg-encrypted | [cv04-dictionary-export-pg-encrypted.yml](../../../.github/workflows/cv04-dictionary-export-pg-encrypted.yml) |
| 19-22 | cv04-dictionary-export-pg-immutable-audit | [cv04-pg-export-immutable-audit.yml](../../../.github/workflows/cv04-pg-export-immutable-audit.yml) |
| 23-25 | cv04-export-host-worker-sql-lease | [cv04-export-sql-host-worker-lease.yml](../../../.github/workflows/cv04-export-sql-host-worker-lease.yml) |
| 26-29 | cv04-export-pg-active-expiry-maintenance | [cv04-export-pg-active-expiry.yml](../../../.github/workflows/cv04-export-pg-active-expiry.yml) |
| 30-45 | cv04-signed-export-gateway-pg | [cv04-signed-export-pg-gateway.yml](../../../.github/workflows/cv04-signed-export-pg-gateway.yml) |
| 46-47,50,55-70 | pa02-async-read-worker (46); pa02-governed-worker-write (47); pa02-host-object-extension-owner-execution (50); pa02-object-extension-pg-atomic-owner (55); pa02-object-extension-resource-migration (56-57); pa02-r03-r10-durable-model-budget (58-61); pa02-r10-host-cost-preflight (62-66); pa02-r10-postgres-cost-reservation (67-70) | [agent-pa02-async-read-worker.yml](../../../.github/workflows/agent-pa02-async-read-worker.yml) |
| 48,53-54,85 | pa02-host-async-read-execution (48); pa02-host-run-outbox-replay (53); pa02-host-server-sandbox-object-owner (54); pa02c-host-owner-cancel-visible (85) | [agent-pa02-host-async-read-execution.yml](../../../.github/workflows/agent-pa02-host-async-read-execution.yml) |
| 49 | pa02-host-async-reader | [agent-pa02-host-async-reader.yml](../../../.github/workflows/agent-pa02-host-async-reader.yml) |
| 51 | pa02-host-optional-postgres-read | [agent-pa02-host-optional-read.yml](../../../.github/workflows/agent-pa02-host-optional-read.yml) |
| 52 | pa02-host-run-action-pg-e2e | [agent-pa02-host-action-pg-e2e.yml](../../../.github/workflows/agent-pa02-host-action-pg-e2e.yml) |
| 71-72 | pa02-real-read-worker-process-recovery | [agent-pa02-real-worker-process-recovery.yml](../../../.github/workflows/agent-pa02-real-worker-process-recovery.yml) |
| 73 | pa02-real-thread-resume-pg | [agent-pa02-real-thread-resume-pg.yml](../../../.github/workflows/agent-pa02-real-thread-resume-pg.yml) |
| 74 | pa02-real-thread-send-pg | [agent-pa02-real-thread-send-pg.yml](../../../.github/workflows/agent-pa02-real-thread-send-pg.yml) |
| 75 | pa02-worker-cooperative-release | [agent-pa02-cooperative-worker-release.yml](../../../.github/workflows/agent-pa02-cooperative-worker-release.yml) |
| 76 | pa02a-host-async-seam | [agent-pa02a-host-async-seam.yml](../../../.github/workflows/agent-pa02a-host-async-seam.yml) |
| 77-78 | pa02a-postgres-proof (77); pa02a-process-recovery (78) | [agent-pa02a-postgres-durability.yml](../../../.github/workflows/agent-pa02a-postgres-durability.yml) |
| 79 | pa02b-fenced-run-authority | [agent-pa02b-fenced-run-authority.yml](../../../.github/workflows/agent-pa02b-fenced-run-authority.yml) |
| 80 | pa02b-fencing-outbox | [agent-pa02b-fencing-outbox.yml](../../../.github/workflows/agent-pa02b-fencing-outbox.yml) |
| 81 | pa02b-governed-owner-write-handoff | [agent-pa02b-governed-owner-write-handoff.yml](../../../.github/workflows/agent-pa02b-governed-owner-write-handoff.yml) |
| 82 | pa02b-owner-reconciliation | [agent-pa02b-owner-reconciliation.yml](../../../.github/workflows/agent-pa02b-owner-reconciliation.yml) |
| 83 | pa02c-atomic-run-cancel | [agent-pa02c-atomic-run-cancel.yml](../../../.github/workflows/agent-pa02c-atomic-run-cancel.yml) |
| 84 | pa02c-cancellation | [agent-pa02c-cancellation.yml](../../../.github/workflows/agent-pa02c-cancellation.yml) |
| 86-93,127 | pa04-c01-certified-context-window-pg-e2e (86-87); pa04-c03-resumed-read-freshness-pg-e2e (88-90); pa04-c05-tool-injection-pg-e2e (91-93); tests/protocol/pa04-c02-derived-source-revocation (127) | [agent-pa04-c01-c06-consolidated.yml](../../../.github/workflows/agent-pa04-c01-c06-consolidated.yml) |
| 94-103 | pa05-actual-object-extension-owner-pg (94); pa05-cross-database-admission-pg (95); pa05-cross-database-domain-coverage-pg (96); pa05-cross-database-domain-owner-partition-pg (97); pa05-cross-database-governed-handoff-pg (98); pa05-cross-database-host-principal-pg (99); pa05-cross-database-host-sql-identity-pg (100); pa05-cross-database-remote-freeze-pg (101); pa05-cross-database-remote-sql-pg (102); pa05-cross-database-transaction-principal-pg (103) | [agent-pa05-cross-database-admission.yml](../../../.github/workflows/agent-pa05-cross-database-admission.yml) |
| 104-108 | pa05-e01j-shared-read-owner-pg (104-105); pa05-e01j2-authenticated-read-handler-pg (106); pa05-e01j4d-actual-host-http-pg (107); pa05-e01j4f-prestartup-recovery-pg (108) | [agent-pa05-cross-database-admission.yml](../../../.github/workflows/agent-pa05-cross-database-admission.yml) |
| 109-111 | pa05-governed-write-owner-pg (109); pa05-object-extension-host-permit-pg (110); pa05-object-extension-physical-sql-fence-pg (111) | [agent-pa05-governed-write.yml](../../../.github/workflows/agent-pa05-governed-write.yml) |
| 112-126 | pa05-plugin-write-lifecycle-fence-pg | [agent-pa05-governed-write.yml](../../../.github/workflows/agent-pa05-governed-write.yml) |

按工作线的**一一覆盖校验**：CV03=14 / CV04=31 / PA02=40 / PA04=9 / PA05=33，总数 **127**、重复归属 **0**、缺映射 **0**。测试源码/Workflow 执行入口均为 A；本表不替任何文件声称已经在 **538e2d8** 上物理运行成功，也不要求把这些条件塞入普通 Ecosystem Suite。

### 6.3 B：实际读到的历史成功 Run、SHA，与未取得证明的区分

| 工作线 / 已确认独立 Workflow | 原始已成功 Run 与 head SHA | 原证等级与不能扩大解释的边界 |
| --- | --- | --- |
| CV03 resource-postgres-atomic | [#43436767862](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43436767862), PR HEAD 91eda6297cebe30f1503e6771309d60858f76a70 | 真实 PG18 38 PASS / 0 FAIL / 0 SKIP（历史）；非 current main 的全部 127 重新运行 |
| CV04 pg-encrypted | [#43250268315](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43250268315), 1fbf937f24c801b8812340f2da26d76adcc94ad8 | PG16 SUCCESS；既有日志 5/5 encrypted + 11/11 Owner、0 SKIP |
| CV04 immutable-audit | [#43170992605](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43170992605), 72989d259054df293dbe9ee2678e20be20ad187a | PG16 SUCCESS；本节未逐条回读该 Job 测试名/跳过数 |
| CV04 host-worker-lease | [#43205474710](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43205474710), 81262c348b2abf0440ddc0501495aa9c572f2e23 | PG16 SUCCESS；本节未逐条回读该 Job 测试名/跳过数 |
| CV04 active-expiry | [#43202471796](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43202471796), e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0 | PG16 SUCCESS；本节未逐条回读该 Job 测试名/跳过数 |
| CV04 signed-gateway | [#43209191962](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43209191962), ef705935332d5b13976ad8459e193e99a59df0c3 | PG16 SUCCESS；历史 Job 18/18 signed + 5/5 immutable + 5/5 encrypted + 8/8 Owner，0 SKIP |
| PA02 host-async-read-execution | [#43436767595](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43436767595), PR HEAD 91eda6297cebe30f1503e6771309d60858f76a70 | PG18 Job #131923787879：5 PASS / 0 FAIL / 0 SKIP；仅是该命令覆盖子集 |
| PA02 host-optional-read | [#43436768323](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43436768323), PR HEAD 91eda6297cebe30f1503e6771309d60858f76a70 | PG18 3 PASS / 0 FAIL / 0 SKIP；证明 defaultOff 与只读约束、非 PA02 全线 |
| PA05 cross-database-admission | [#43437374010](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43437374010), main d3d07b7ed981fc8f6b92218091c47e53f7e34720 | 三个独立 PG18，历史 28 PASS / 0 FAIL / 0 SKIP；含 `physicalClusters=3`；显式 `productionWriteEnabled=false` |
| PA05 governed-write | [#43437374182](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43437374182), main d3d07b7ed981fc8f6b92218091c47e53f7e34720 | PG18 Job #131925858341：40 PASS / 0 FAIL / 0 SKIP；原代码隔离实验，非生产特权管理员绕过已解决 |

以上共 **10/26 个主归属 Workflow** 已取得可定位的历史成功 Run/SHA；**其余 16/26 当前未取到可逐个复核的最近成功 Run/SHA**（以 PA02 其余专项和 PA04 consolidated 为主）。这不等于它们没有运行过或失败，更不等于 127 条用例已有同一主线 SHA 的完整物理证明。**在 main@538e2d8，本轮仍无 26 个 Workflow 全部 exact-main 零 SKIP 的原证**。实际未补跑专项 Job，也没有把历史成功改写成当天重测。

### 6.4 仅补真实缺口的下一轮任务与关停边界

1. 先为 PA04 consolidated（含 C02 test #127）与 PA02 尚未取得的 15 个主归属 Workflow，查 GitHub Actions Job 的原始测试名、运行时 PG18、真实 `skipped=0` 和 head SHA，填充该索引；已获历史回执的 CV03、CV04、PA05 不重复研究。若发现源码变更影响证据，再**针对那条**现有 workflow 通过原有 `workflow_dispatch`/path trigger 补真实物理验收，并保留 SHA/Job；未实际执行绝不标成功。
2. 不新增泛用 CI、第二套 PG 测试或重新运行全部 127；不能靠 docs PR 的绿色 Continuity 证明物理 SQL，也不因 127 条跳过开启 N1、CV03 SAVE 或 CV04 EXPORT。原 #1325 审计继续拒绝未批准 skip 增长。
3. [Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 与 [Operator #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 本轮复核仍 **OPEN**，[并行 #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 仍未合并。**N1=NOT_CERTIFIED；CV03 Human SAVE OFF；CV04 正式后台 EXPORT OFF**。Eidos Chart 完成不代表 Kanban / 真实登录 Human / 生产移动验收结束。
4. 本轮只更新 Window12 既有交接一份文档；独立短期 docs PR，保留 protected main，成功合并后让现存 [Branch Hygiene](../../../.github/workflows/branch-hygiene.yml) 依准确已合入 SHA 清理**本 PR 自己的**过程分支，不能越权删除并行分支。东京对于纯 docs 变更应该跳过，但必须以原始 Job 为准，不预写 SUCCESS。


---

## 7. 2026-11-16 自动续跑 #05/07：PA02 + PA04 旧缺证的逐项原始 Job 恢复（附 #06 证据时效核验）

> **复核当前基线**：protected `main@836c73f8ee72dfabec3041cf11fb5d20d32ffab9`，先前 #04 已把 127/127 SKIP 文件唯一映射至 26 个现存专用 Workflow。本节不重复造工程 CI、不改 runtime/权限；**B=直接读取 GitHub Actions Run 元数据/Job 日志；A=比较两个 Git Tree 的 YAML/测试 Blob SHA；U=未获 exact-current-main 物理执行或生产签字**。

### 7.1 16/16 个此前“历史 Job/SHA 尚未逐一取得”的专用 Workflow 已找回 B 级日志

检索路径：先从 [PA02 R01–R10 原始证据账](../../agent-line/PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)、[PA02 研究/来源索引](../../agent-line/PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)、[PA04 历史来源与决定索引](../../agent-line/PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) 恢复已使用的 Run 链接；对未留链接的条目，通过 GitHub Actions 指定日期区间和对应 PR SHA 精确定位 Workflow，不依赖搜索摘要“猜成功”；随后逐一读取 **Run head SHA + job ID + 原始 Node reporter `tests/pass/fail/skipped`**。下面的统计列顺序是 **pass / fail / skipped**，均为当时一次 Job 的历史独立 PG18 结果，测试之间可能交叠，不能相加为通用 suite 的 127 项。

| 已有专项 Workflow（本轮 16 条） | 关联 SKIP 主题 | 真正原始 Run / Job | 该 Job 的 head SHA | 历史 pass / fail / skipped |
| --- | --- | --- | --- | --- |
| [agent-pa02-async-read-worker.yml](../../../.github/workflows/agent-pa02-async-read-worker.yml) | PA02 READ/Owner/R03/R10 | [38652026320](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38652026320/job/116152850045) | `2094c74ebaa143d67c246e742d794facfd27687d` | **26 / 0 / 0** |
| [agent-pa02-host-async-reader.yml](../../../.github/workflows/agent-pa02-host-async-reader.yml) | Host scoped READ port | [38362913299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38362913299/job/115181123866) | `687634e5447dbf3463a5c98d53bc20087cb9f82e` | **1 / 0 / 0** |
| [agent-pa02-host-action-pg-e2e.yml](../../../.github/workflows/agent-pa02-host-action-pg-e2e.yml) | Host PG action | [38363335879](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38363335879/job/115182485338) | `44dfab3cd8eb065f0494a4706899f68e8be21a11` | **1 / 0 / 0** |
| [agent-pa02-real-worker-process-recovery.yml](../../../.github/workflows/agent-pa02-real-worker-process-recovery.yml) | SIGKILL / fenced recovery | [38370171372](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38370171372/job/115204904227) | `8c949beb3a78976b9036eccaa5f7f7f21a250fcb` | **3 / 0 / 0** |
| [agent-pa02-real-thread-resume-pg.yml](../../../.github/workflows/agent-pa02-real-thread-resume-pg.yml) | Thread.resume | [38371077639](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38371077639/job/115207931401) | `f73fd8d075debdb0507c7b784dd5d2e6e8547737` | **1 / 0 / 0** |
| [agent-pa02-real-thread-send-pg.yml](../../../.github/workflows/agent-pa02-real-thread-send-pg.yml) | thread.send | [38372106908](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38372106908/job/115211360821) | `245f7a57b6cfec4dd2230046a82acf00e21218c1` | **1 / 0 / 0** |
| [agent-pa02-cooperative-worker-release.yml](../../../.github/workflows/agent-pa02-cooperative-worker-release.yml) | Worker yield / stale fence | [38832195633](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38832195633/job/116753247128) | `3891657b774895c739bca6d463b2af8529eb9f0a` | **3 / 0 / 0** |
| [agent-pa02a-host-async-seam.yml](../../../.github/workflows/agent-pa02a-host-async-seam.yml) | PA02A Host bridge | [38348081884](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38348081884/job/115134013876) | `fd5238dc1016b09c8514f45cfa81f6269eca5cbf` | **1 / 0 / 0** |
| [agent-pa02a-postgres-durability.yml](../../../.github/workflows/agent-pa02a-postgres-durability.yml) | PA02A PG18 durable claim | [38349327169](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38349327169/job/115137864977) | `fd4d8ddff92d5095b4ce51b713e43fcc62866b46` | **2 / 0 / 0** |
| [agent-pa02b-fenced-run-authority.yml](../../../.github/workflows/agent-pa02b-fenced-run-authority.yml) | PA02B Worker lease/Run fencing | [38365479802](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38365479802/job/115189454525) | `cc51963b91040eb9df0615089c1c05cf13790f72` | **2 / 0 / 0** |
| [agent-pa02b-fencing-outbox.yml](../../../.github/workflows/agent-pa02b-fencing-outbox.yml) | PA02B persisted WRITE intent | [38347246849](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38347246849/job/115131388567) | `4e4147b8716e945ece07f93f92bd81d0c2f140d7` | **1 / 0 / 0** |
| [agent-pa02b-governed-owner-write-handoff.yml](../../../.github/workflows/agent-pa02b-governed-owner-write-handoff.yml) | PA02B bounded Owner lost ACK | [38496399614](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38496399614/job/115633033078) | `9f137c25bd4a1b07b3d06a43ea399c15d079f84f` | **3 / 0 / 0** |
| [agent-pa02b-owner-reconciliation.yml](../../../.github/workflows/agent-pa02b-owner-reconciliation.yml) | Owner UNKNOWN resolution | [38515066568](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38515066568/job/115691904851) | `5c06e9f3b86d6a57f9217886ae1bdd412a0fb8fa` | **2 / 0 / 0** |
| [agent-pa02c-atomic-run-cancel.yml](../../../.github/workflows/agent-pa02c-atomic-run-cancel.yml) | PA02C atomic cancel | [38652026240](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38652026240/job/116152849428) | `2094c74ebaa143d67c246e742d794facfd27687d` | **4 / 0 / 0** |
| [agent-pa02c-cancellation.yml](../../../.github/workflows/agent-pa02c-cancellation.yml) | PA02C durable cancel barrier | [38350778851](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38350778851/job/115142437946) | `74c789f0df80147c3bbda5c743574cf905a37db2` | **2 / 0 / 0** |
| [agent-pa04-c01-c06-consolidated.yml](../../../.github/workflows/agent-pa04-c01-c06-consolidated.yml) | PA04 C01–C06 PG18; C02 #127 | [38673188190](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38673188190/job/116220784361) | `f45af7c58d363e327700c366baf89c88d52b53e2` | **42 / 0 / 0** |

**可核对的例外边界**：
- PA04 consolidated [Job #116220784361](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38673188190/job/116220784361) 的 Node reporter 确为 **42 PASS / 0 FAIL / 0 SKIP**，stdout 明确记录 `PA04_C01_HISTORY_PRIORITY_PG`、`PA04_C02_DERIVED_REVOCATION_PG`、`PA04_C03_FRESH_READ_PG`、`PA04_C05_TOOL_INJECTION_PG` 等，所有 marker 仍声明 `productionUsed=false`。单独 C02 [#38668765032 / Job #116206647042](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38668765032/job/116206647042) **12 / 0 / 0**。因此原第 6.3 节“PA04 未找到历史成功 Job”已由**新增原证**解决，但**不**提升为产品上线认证。
- PA02 15 个 Workflow（含恢复 Worker、Host、R10、Owner、cancel）都核到真实 `skipped=0` 的 Node summary。日志中出现预期拒绝 SQL 的 `ERROR` 行属于负向场景，不能据此改写 reporter 的 **0 fail**；如复验失败，必须看实际不通过的 test 名。
- #04 已有的其他 **10/26** Workflow 历史 Run/SHA 保留有效。又直接补读 CV04 先前仅核成功状态的三个原始 Job：[immutable audit #43170992605](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43170992605)（5/0/0 + 5/0/0 + 8/0/0），[active expiry #43202471796](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43202471796)（4/0/0 + 14/0/0 + 8/0/0），[Host/Worker lease #43205474710](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43205474710)（4/0/0 + 10/0/0）；因此**26/26 存在可定位的历史 SUCCESS Run 和其对应范围的零跳过物理记录**。这个“历史入口证明完整”不同于“127/127 每个测试在当前 main 均已复验 PASS”，不允许替换概念。

### 7.2 进一步避免用“过期历史测试”冒充当前测试：Blob SHA 差异与改正

本轮把上述 16 个 Workflow 的历史 Run commit Git Tree 与当前 `main` Tree **逐字节 SHA 对比**，验证：**16/16 条 Workflow 文件 Blob 未改变**；每条 Workflow 指向的 **127 SKIP 中归属该 Workflow 的主要 PG 测试文件**也比对（PA04 包括 `tests/protocol/pa04-c02-derived-source-revocation.test.mjs`）。

最初选定的旧 Run 中恰有三处测试文件 Blob 在之后发生变更；没有隐瞒，而是继续找了在改动**之后**的实际成功 Run 并重对 SHA，替换旧失效样本：

| 旧证据为何不够 | 改用的真实原始 Run / Job 与结果 | 当前 `main` 靶向测试 Blob / Workflow Blob |
| --- | --- | --- |
| `pa02-real-read-worker-process-recovery.test.mjs` 经后续 durable cancel 增强 | [#38370171372 / Job #115204904227](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38370171372/job/115204904227)，**3 / 0 / 0**；历史 SHA `8c949beb3a78976b9036eccaa5f7f7f21a250fcb` | 两者一致 |
| `pa02-worker-cooperative-release.test.mjs` 补全 Run 预算夹具 | [#38832195633 / Job #116753247128](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38832195633/job/116753247128)，**3 / 0 / 0**；历史 SHA `3891657b774895c739bca6d463b2af8529eb9f0a` | 两者一致 |
| `pa02a-postgres-proof.test.mjs` 补强 Receipt 来源及重启 | [#38349327169 / Job #115137864977](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38349327169/job/115137864977)，**2 / 0 / 0**；历史 SHA `fd4d8ddff92d5095b4ce51b713e43fcc62866b46` | 两者一致 |

**边界必须同时保留**：本对比只证明这些 Workflow 及其**相应测试源码**字节未漂移，并不证明所依赖的 runtime 模块、Node 生态、真实服务配置或生产 Host 在 2026-11-16 完全不变。源码一致 + 历史 PG18 成功，仍**不能**代替在 `main@836c73f` 上执行新的隔离数据库 Job。PA04 C01 的真实 tokenizer、外部记忆/缓存传播、真实业务插件新鲜度、生产 Tool policy 均仍有 Owner 签收缺口。

### 7.3 收口判断：现成执行入口已完整，无必要重新开发或泛用重跑

| 证据维度 | 恢复前（第 6.3 节历史快照） | 本轮核到的事实 |
| --- | --- | --- |
| 127 个 SKIP 精确源文件/测试标题/Workflow | 127/127 静态映射，26 个既有工作流 | **保持 127/127；不修改任何测试或 Workflow** |
| 26 个主归属 PG 专项 Workflow 的历史 Run + SHA | 10 已定位、16 待补证 | **26 已定位、0 未定位**；16 个新补项均逐 Job zero-SKIP |
| 新补 16 个 Workflow 与被映射物理用例测试代码 SHA 一致性 | 未逐 SHA 核验 | **16/16 工作流 YAML 一致；对应靶向测试 Blob 均由所列历史成功 SHA 覆盖** |
| latest `main` 的全部 26 个 PG Workflows exact-SHA success | **U** | **仍 U**，本轮没有调用 workflow_dispatch，不将 Git tree 一致视作 CI 成功 |
| 泛用主线全量跳过审计 | [#1325](https://github.com/jiangxng/EVO-App-Platform/pull/1325) 2,246 PASS / 0 FAIL / 127 SKIP | 维持现有反回退逻辑；本轮 docs-only 无新物理结果 |
| 生产签字及 gates | #1092/#1212 OPEN；N1 NOT_CERTIFIED | **未变**：CV03 Human SAVE OFF，CV04 正式后台 EXPORT OFF，PA02/PA04 隔离成功不等于生产 AUTH/Provider/Owner |

**#06/07 下一最小动作**：若确需把 26 个专项升级为“当前 SHA 已重新执行”，先按上表将无测试/YAML Blob 漂移的历史记录保留作开发证据；只针对 **有实际 runtime/数据契约变化风险且不能由现有 owner gate 覆盖** 的专项，通过原有 `workflow_dispatch` 在明确 SHA/临时 PG 条件下复验，留存 Job zero-SKIP；无法从本对话工具触发时标记 U，**不得伪称运行或为触发去改 path-filter**。本轮范围无缺失 Workflow、无缺失测试文件，不新增 YAML/测试/框架，不动生产 Authorizer。真实 Owner [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、Operator [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 和并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 仍独立处理。

交接仍通过原 Window12 文档 append-only 入库；独立 docs PR 精确 HEAD 通过后合并受保护 main，由现有 Branch Hygiene Actions SHA-pinned 删除**本轮**过程分支；本轮不预填门禁/合并/东京 SKIP 成功。
