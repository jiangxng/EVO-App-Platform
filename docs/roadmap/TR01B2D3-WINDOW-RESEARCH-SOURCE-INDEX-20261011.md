# TR01B2D3｜原始资料与验证来源索引（2026-10-11）

**与旧包关系：**[旧入口](TR01-RESEARCH-HANDOFF-ENTRY-20261010.md)、[旧详细索引（33 项源码/文档及 9 组 PR/CI）](TR01-RESEARCH-SOURCE-INDEX-20261010.md)、[旧方案](TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md) 保持原样。本文件补录后续窗口接续推进的插件归属、基础对象扩展、B2D3 信任和数据库最小权限；不把旧索引已核对的资料重新标记为本次全文阅读。

## 阅读等级与日期口径

- **W 原始外部网页已打开**：本次交接任务 2026-10-11 **实际搜索并打开了指定版本 PostgreSQL 官方文档原文**；该级别仅适用于 W01–W03。不是先前所有聊天都查过这些网页。
- **G 仓库源码/文档已读**：本窗口通过 GitHub 连接器取得完整文件或明确列出的相关段落，链接固定到查询时**不可变 commit**；“相关段落”不代表通篇逐字看完所有依赖。
- **L CI 运行/日志已查**：真实 GitHub Actions 运行页面/Job 步骤/关键日志曾读取；某些早期 CI 只复核了结论，见表逐项。**日志仍在 GitHub，不等于已经复制原始全文或永久附件**。
- **S 仅摘要**：只阅读网页搜索引擎摘要、未打开原文。本次补查**没有使用 S 作为设计权威**；搜索结果仅用于发现 W01–W03，随后打开了原文。
- **T 待验证**：真实生产 OIDC/Google 租户、KMS/HSM/Secret Manager、mTLS/反代和跨主机负载均衡标准**本轮尚未访问原始标准文档**，不为其杜撰“已读 URL”。

日期若未特别说明，2026-10-10～11（GitHub Actions UTC 2026-10-10，面向用户 2026-10-11 时区）。每一项标出**原始 URL、位置、发现和用途**；与“采用此设计”的工程选择分开见 [决策文档](TR01B2D3-WINDOW-RESEARCH-DECISIONS-GAPS-20261011.md)。

## 1. 独立打开的外部权威网络原文（新增）

| ID / 标题、原始网址 | 查阅日期 / 深度 / 章节 | 来源确证事实 | 对项目的用途 |
| --- | --- | --- | --- |
| **W01 PostgreSQL 18: SELECT** https://www.postgresql.org/docs/18/sql-select.html | **2026-10-11；W 原文已打开**；`Description` 权限段及 `The Locking Clause`，约第 85–88 行 | `SELECT ... FOR SHARE` 除目标列 SELECT 外还要求所选表至少一列 `UPDATE` 权限；不是“只要 SELECT 就能锁行” | 解释 App CI [#38061476431](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061476431) 真实运行账号受拒绝，设计 EVO 非 PUBLIC 的受限 `SECURITY DEFINER` key-lock 函数（不把 UPDATE 授予 runtime） |
| **W02 PostgreSQL 18: INSERT** https://www.postgresql.org/docs/18/sql-insert.html | **2026-10-11；W 原文已打开**；`Description` 权限段，约第 50–56 行；`ON CONFLICT Clause` | `ON CONFLICT` 读取的冲突目标（仲裁约束）列需要对应 `SELECT`；`RETURNING` 中读取的列也需 SELECT | 解释 App CI [#38061811187](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061811187) 中 `finance_delegation_nonce` 的 `ON CONFLICT (issuer,jti) DO NOTHING RETURNING jti` 所需 `SELECT(issuer,jti)`，不是全表读或 superuser |
| **W03 PostgreSQL 18: CREATE FUNCTION** https://www.postgresql.org/docs/18/sql-createfunction.html | **2026-10-11；W 原文已打开**；`Writing SECURITY DEFINER Functions Safely`，约第 266–292 行；`SECURITY INVOKER / SECURITY DEFINER` | definer 权限以函数拥有者运行，`search_path` 应排除不可信可写 schema；新函数默认可能有 PUBLIC EXECUTE，需在同一事务中撤销 PUBLIC 并有限授予 | 对照 EVO additive migration `202610100040_finance_runtime_key_lock_function.sql`：`SECURITY DEFINER`、静态 SQL、固定 search_path、`REVOKE EXECUTE FROM PUBLIC`。**仍须专门核验生产函数拥有者、schema CREATE/USAGE、临时 schema / 搜索路径和 grant 事务边界** |

以上三条不是“仅看搜索摘要”。网页当日版本 18（与所用隔离 Postgres 18 CI 对应）；未来升级数据库需核查新版本，特别是授权和并发语义。外部网页原文**未制作离线 PDF/截图**；本表保留可定位章节和足够事实摘要，避免未来只剩链接。

## 2. GitHub 项目权威及本轮已读代码/设计

固定源码引用分别指向 App Platform **main `a434d4b8...`**、B2D3 Draft **`527257976e16...`** 和 EVO Draft **`4e21327931c2...`**，不要将 Draft 代码误认为 main。

| ID / 标题与原始网址 | 深度、查阅日与定位 | 关键发现（源码事实） | 具体用途 |
| --- | --- | --- | --- |
| **G01 AI Project Bootstrap** https://github.com/jiangxng/EVO-App-Platform/blob/a434d4b8c0737894a79864c1ad806000c87f53f6/AI-BOOTSTRAP.md | G 已读，2026-10-11；`Mandatory startup order`、`Source-of-truth rule`、`Human authority rule` | 状态以 status/handoff 为权威；小步自主，生产权限等 Human 决策另论 | 保证换窗口不从聊天推断项目进度，不手改 HANDOFF-LATEST |
| **G02 project.status.json** https://github.com/jiangxng/EVO-App-Platform/blob/a434d4b8c0737894a79864c1ad806000c87f53f6/project.status.json | G 读取并解析**相关 JSON 节点**，2026-10-11；`projectContinuity.current.openGate`、`foundationObjectProgram.tr01` | B2D3 仍 OPEN，B2D4/B2E 未解锁；TR01 采购/销售为 bounded proof | 新旧 CI/Docs 不得写成正式生产 PASS |
| **G03 Plugin Ownership Guard** https://github.com/jiangxng/EVO-App-Platform/blob/a434d4b8c0737894a79864c1ad806000c87f53f6/docs/architecture/TR01-BUSINESS-PLUGIN-OWNERSHIP-GUARD-20261010.md | G 已读核心规则、2026-10-11；`User-confirmed long-term rule`、`Executable bounded enforcement` | install-scoped Application 归业务、Host 归公共宿主、EVO 最小 runtime 归确定性账本、Cost/Allocation 归 Owner 插件；有源码静态 tripwire，但不是全仓安全沙箱 | 后续业务插件禁止在 Host 引入私有金融/账本写入 |
| **G04 FO Import/Extension Human 验收** https://github.com/jiangxng/EVO-App-Platform/blob/a434d4b8c0737894a79864c1ad806000c87f53f6/docs/roadmap/FO-IMPORT-EXTENSION-HUMAN-ACCEPTANCE-20261010.md | G 已读核心矩阵，2026-10-11；`P0-2`、`P0-3`、`P0-4` | DataImportJob 原始未映射列保留 ≠ 正式 Object Extension sidecar；缺少完整“未知列升格/历史回填”的 Human 端到端确认 | 防止“做业务前必须先完成全部扩展字段”或“原文保留=正式扩展已入库”的误判 |
| **G05 App B2D3 remote owner adapter** https://github.com/jiangxng/EVO-App-Platform/blob/527257976e16db954cab2aed1cc1be0b8e603ad4/apps/trading-reference/finance-owner-remote.ts | G 本窗口读取相关完整文件，2026-10-10；`createTrustedRemoteFinanceOwnerPreflightV010` | 服务器签发 Ed25519 assertion，45s TTL、UUID nonce、issuer/kid、企业/Context/actor/intent 绑定，只读 response 严格检查 `executionAllowed:false` | 后续审批、签名与租户映射测试基线，不能让请求提供任意密钥 |
| **G06 EVO owner delegation route** https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/apps/api/src/finance-owner-delegation-route.ts | G 已读完整文件/核心 `authenticateAgainstPostgresTrust`、`consumeOnce` 和路由，2026-10-10～11 | PostgreSQL 持锁读取 ACTIVE key → 验签/上下文 → 同事务插入唯一 nonce；签名失败默认 401、重放 409，输出 read-only verdict | 核对 nonce、撤销顺序和 Owner 权威；不能把验证结果变成持久财务执行 token |
| **G07 EVO fixed-path key-lock migration** https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/migrations/schema/202610100040_finance_runtime_key_lock_function.sql | G 已读完整 SQL，2026-10-10～11；函数体及 `REVOKE ... FROM public` | 静态、qualified table 的活跃公钥 `FOR SHARE`，以 `SECURITY DEFINER` 执行；运行账号只能 EXECUTE 窄接口，不能 UPDATE/原始 SELECT 密钥表 | 解决 PostgreSQL `FOR SHARE` 权限与最小权限原则冲突，后续审核真实 owner/grants |
| **G08 EVO dedicated owner app / entrypoint** https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/apps/api/src/finance-owner-readonly-app.ts ; https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/apps/api/src/finance-owner-readonly-main.ts | G 已读全部或关键代码，2026-10-10～11；`buildFinanceOwnerReadOnlyAppV010`、startup guard | 独立 app 仅健康探针与签名 Owner read-only route；启动必须 opt-in、POSTGRES trust、明确 DB URL/listen；不构建通用 EVO API | 财务运行账号部署时不同时暴露 Demo/Command/BusinessData 写入表面 |
| **G09 EVO isolated service unit regressions** https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/modules/valuation/tests/finance-owner-readonly-isolation.test.ts | G 已读文件，2026-10-11；`404` negative controls | `/api/v1/commands`、Demo 成本/销售、Ledger/finance execute 等不得存在；坏 assertion 默认拒绝 | 只读服务代码审查快速回归 |
| **G10 App distinct DB login certification** https://github.com/jiangxng/EVO-App-Platform/blob/527257976e16db954cab2aed1cc1be0b8e603ad4/tools/certify-tr01b2d3-distinct-db-logins.mjs | G 已读，2026-10-10～11；`loggedInClient`、`permissionDenied`、`operatorCli`、`spawn finance-owner-readonly-main`、`snapshot` | 真正 PostgreSQL `session_user=current_user`、独立 runtime/operator、最窄权限、签名 HTTP、撤销拒绝、隔离进程 404、财务摘要不变 | 别用 `SET LOCAL ROLE` 假冒真实身份隔离，生产验收复用 SQL grants 清单 |
| **G11 App two-process race certification** https://github.com/jiangxng/EVO-App-Platform/blob/527257976e16db954cab2aed1cc1be0b8e603ad4/tools/certify-tr01b2d3-cross-instance-races.mjs | G 已读完整文件，2026-10-10～11；`signed`、并行 `post`、持锁 `revoke`、nonce count/digest | 两独立进程同一签名 200/409，撤销事务未提交不读取 key，提交后 401/401 且无新 nonce | 执行前重新验证/多实例时序的基线，但非真实跨机器/跨区域 |
| **G12 App cross-project original-sales CI workflow** https://github.com/jiangxng/EVO-App-Platform/blob/527257976e16db954cab2aed1cc1be0b8e603ad4/.github/workflows/cross-project-tr01b-sales-evo-postgres.yml | G 已读完整文件，2026-10-10～11；`EVO_CERTIFIED_COMMIT`、依序 test steps | 固定 EVO 供 CI checkout 的精确 commit；原始销售事实、成本/核销、Host Session/OIDC/TLS、key rotate、真实 DB login、nonce race 连续跑 | 新窗口变更 EVO Owner 时必须配套更新固定 SHA，避免“测错版本” |
| **G13 本轮两份实际业务/证据说明** https://github.com/jiangxng/EVO-App-Platform/blob/527257976e16db954cab2aed1cc1be0b8e603ad4/docs/roadmap/TR01B2D3-TWO-EVO-CONCURRENT-NONCE-REVOKE-20261011.md ; https://github.com/jiangxng/EVO-App-Platform/blob/527257976e16db954cab2aed1cc1be0b8e603ad4/docs/roadmap/TR01B2D3-ISOLATED-FINANCE-OWNER-HTTP-20261011.md | G 已读完整文档，2026-10-11；`Security gap`、`Assertions`、`Limits`、`CI evidence` | 精确边界：same-machine Node 进程、真实 Postgres；无生产 ingress/credential/SSO、多机/网络故障验收 | 新窗口优先采用现有结论，不重新实现已完成的两个 CI 增量 |
| **G14 EVO 设计决策** https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/docs/architecture/decisions/2026-10-10-b2d3-restricted-db-login-trust-key-lock.md ; https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/docs/architecture/decisions/2026-10-11-b2d3-isolated-finance-owner-readonly-process.md | G 本窗口编写并复核对应材料，2026-10-10～11；`Reproduced deployment defect`、`Dedicated entrypoint` | 权限错误实际复现；采用 narrow definer 和单独 service 解决；列出未完成的运维/生产边界 | EVO 子仓库中的权威实现理由，和 App Platform CI 一一对应 |

**以上固定链接指向当时已读的源码状态，绝不暗示所有源码都已合入 default main。** G14 文档、G08 路由等在 EVO #108 Draft branch，G10/11/12 在 App #594 Draft branch。

## 3. 已查阅的 GitHub PR / CI / Log 证据（永久 run URL，但 Job 日志可能按 GitHub 保留策略失效）

| ID / 原始 URL | 访问日期 / 等级 / 定位 | 可核对结论（不超过 CI 范围） | 具体用途 |
| --- | --- | --- | --- |
| **L01** [#603 Foundation import handoff](https://github.com/jiangxng/EVO-App-Platform/pull/603)；[Platform CI #38059261559](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059261559) | 2026-10-10，L 本窗口前段查 PR、CI 状态与回归；原文另见 G04 | 三份供应商 CSV、Human 验收矩阵、未映射 `备注` 原始值仍存在作业 source；**没有声明自动升格正式扩展字段 UI 已交付** | 保留 CP/FO 初衷和未完成项，不把 B2D3 当替代基础对象 |
| **L02** [#605 Plugin architecture tripwire](https://github.com/jiangxng/EVO-App-Platform/pull/605)；[merge commit](https://github.com/jiangxng/EVO-App-Platform/commit/a434d4b8c0737894a79864c1ad806000c87f53f6) | 2026-10-10，L PR、Platform CI、Continuity 状态均查验，源码见 G03 | 局部正反向源码护栏已合 main；并非运行期全业务插件沙箱 | 新增业务模块不得把财务 SQL/owner 混入 Host |
| **L03 首次失败** [cross-project CI #38061476431](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061476431) | 2026-10-10，L **Job 失败步骤及 Postgres 日志原文** 已查看；步骤 `Certify actual distinct PostgreSQL LOGIN accounts on live signed EVO owner HTTP` | 真实 runtime LOGIN 下直接 `SELECT ... FOR SHARE` 命中 `permission denied for table finance_trusted_signing_key`，Host 收 `401`；`SET ROLE` 测试未覆盖此运行时授权缺口 | 驱动 G07 + W01 的安全修复；**不能改为给运行账号授 UPDATE** |
| **L04 第二次失败** [cross-project CI #38061811187](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061811187) | 2026-10-10，L **失败步骤及 Postgres 日志原文** 已查看，同步骤 | key-lock 修复生效后，nonce `INSERT ... ON CONFLICT (issuer,jti) ... RETURNING jti` 缺相应 `SELECT`，Postgres `permission denied for finance_delegation_nonce`，Host 收 `401` | 通过 W02 精确补充 `SELECT(issuer,jti)`，不开放全表 SELECT |
| **L05 独立受限登录成功** [cross-project CI #38061971800](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061971800) | 2026-10-10，L Job 日志关键 PASS marker 已实际读取 | `TR01B2D3_DISTINCT_DATABASE_LOGINS_LIVE_OWNER_PROOF.status=PASS`、真实独立 runtime/operator LOGIN、签名原始 sales read、两条 audit、无重启撤销、经济 replay 无变化 | 对 L03/L04 两次失败的最终修复证据，和 EVO [#109](https://github.com/jiangxng/EVO/pull/109) 配对 |
| **L06 EVO 独立权限补丁** [EVO #109](https://github.com/jiangxng/EVO/pull/109)；[EVO CI #38061768134](https://github.com/jiangxng/EVO/actions/runs/38061768134) | 2026-10-10，L 查 CI 全套矩阵 PASS、PR merged into parent Draft | SQL migration + route 使用受限 lock 函数；审核不应上升为生产 DB 已授权 | 追踪 key-lock 来源，部署只认可正确迁移版本 |
| **L07 两进程并发真实验证** [App #613](https://github.com/jiangxng/EVO-App-Platform/pull/613)；[CI #38067561855](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067561855)；[文档头最终 CI #38067711812](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067711812) | 2026-10-11，L **Job 日志 PASS marker** 与 Workflows SUCCESS 已核 | `TR01B2D3_TWO_EVO_CONCURRENT_NONCE_REVOKE_PROOF`：`twoIndependentEvoHttpProcesses=true`，`sameSignedAssertionAcceptedExactlyOnce=true`，`replayDeniedAcrossTwoInstances=true`，`committedOperatorRevocationRejectsWaitingRequests=true`，`waitingNewRequestsConsumedNoNonce=true`，`financialExecutionAllowed=false` | 保留并发时序可重演测试，不偷称跨物理机/跨区 |
| **L08 隔离进程实现/测试** [EVO #110](https://github.com/jiangxng/EVO/pull/110)；[EVO CI #38067997945](https://github.com/jiangxng/EVO/actions/runs/38067997945) | 2026-10-11，L 完整 CI 结果 SUCCESS、源码见 G08/G09 | 独立 `finance-owner-readonly` entrypoint，在隔离端不注册命令/demo/finance write | 生产未来需把该进程单独部署而非重用 full API |
| **L09 隔离端真实 Postgres HTTP** [App #616](https://github.com/jiangxng/EVO-App-Platform/pull/616)；[CI #38068088650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068088650)；[文档头最终 #38068229904](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068229904) | 2026-10-11，L Job log 关键 marker 已核验 | `financeOwnerProcessIsolatedFromCommandsAndDemo=true`、runtime/ops 两个 LOGIN、通用 API 404、Owner read success、revoke 和账本 digest 无变化 | 对照 G08–G10 验收隔离进程，而不是只看单元测试 |
| **L10 父分支完整回归** [App TR01B #38068397253](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068397253)；[EVO 全套 #38068386910](https://github.com/jiangxng/EVO/actions/runs/38068386910) | 2026-10-11，L 工作流状态已核验，App #594 head `527257...` **37/37 SUCCESS**、EVO #108 head `4e213...` 全套 CI SUCCESS；未导出全部 jobs 日志 | 两仓库最终完整回归没有回归失败；**并非 main、production 或外部用户 Human 验收** | 当前两个父 Draft 可安全继续开发的真实基准 |
| **L11 父 PR** [App #594](https://github.com/jiangxng/EVO-App-Platform/pull/594)；[EVO #108](https://github.com/jiangxng/EVO/pull/108) | 2026-10-11，L 重新查 GitHub PR 状态与 head、comments；均 `draft:true`、`merged:false` | 新功能目前保存在 feature Draft（含相应子 PR），**main 不包含** | 新窗口正确建立 B2D3 独立小 PR 的基线 |
| **L12 既有主线参考** [TR01B2D2](TR01B2D2-EVO-OWNER-FACT-PIN-VERIFICATION-20261010.md)；[旧 B2D3 两实例](TR01B2D3-TWO-EVO-INSTANCES-TRUST-20261010.md) | 2026-10-10～11，G/L 旧交接与本轮相关文档可读；详细项见旧索引 | 参考采购/销售/成本/核销已在隔离 CI 完成窄范围验证，但生产财务 Owner 授权是新门槛 | 不重跑已关闭 CP/TR01A、B2B/B2C；保持依赖链清楚 |

## 4. 易失材料的简要“离线可读”关键摘录及附件定位

下列是**脱敏摘要/必要的精确测试标签**，不是完整日志的伪造镜像；原始日志仍以 Actions run/job 为入口（登录/保留期可能影响重新访问）。

- [L03](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061476431)：测试脚本按两个 PostgreSQL LOGIN 分别登录；受限 EVO 调用直接对 `finance_trusted_signing_key` 执行 `FOR SHARE`，PostgreSQL `42501 permission denied`，HTTP 401；问题对应 W01 描述的 `UPDATE` 权限要求。
- [L04](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061811187)：修复 trust key-lock 后，`finance_delegation_nonce` INSERT/ON CONFLICT 仍出现 `42501 permission denied`；最终只给予 `INSERT` + `SELECT(issuer,jti)`，对应 W02 原文。
- [L05](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061971800) marker：`TR01B2D3_DISTINCT_DATABASE_LOGINS_LIVE_OWNER_PROOF`，`status=PASS`、`runtimeSessionIsDistinctLogin=true`、`operatorSessionIsDistinctLogin=true`、`actualHostSignedHttpOwnerRead=true`、`crossRolePrivilegeEscalationDenied=true`、`revocationEffectiveWithoutEvoRestart=true`、`originalEconomicAndReplayInputUnchanged=true`、`financialExecutionAllowed=false`。
- [L07](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067711812) marker：`TR01B2D3_TWO_EVO_CONCURRENT_NONCE_REVOKE_PROOF`；200/409（同一 nonce 恰一次）及 401/401（撤销提交后两个等待者），无额外 nonce；twoIndependentEvoHttpProcesses=true，未跨物理机。
- [L09](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068088650) marker：`TR01B2D3_DISTINCT_DATABASE_LOGINS_LIVE_OWNER_PROOF`，其中 `financeOwnerProcessIsolatedFromCommandsAndDemo=true`、`actualHostSignedHttpOwnerRead=true`、`operatorAuditEntries=2`、`financialExecutionAllowed=false`。
- **截图/图片/PDF/附件：**本 B2D3 窗口没有制作外部网页截图、PDF、二进制证据文件或 CI 日志打包附件，因而**没有可合法提供的截图或附件路径**。唯一可追溯源是以上原始网页、不可变源码 commit、GitHub PR、Actions Job log 和本文件脱敏摘录。不要凭空填写 `sandbox:/...` 或 GitHub 假附件链接。

## 5. 尚未访问原始资料（T 待验证，禁止引用为“已读”）

| 待证主题 | 尚缺的一手资料/验证 | 下一步实际用法 |
| --- | --- | --- |
| 生产 Host 外部 OIDC/PKCE/RS256 | 客户真实 IdP 配置、回调 URI、授权主体与企业映射、密钥轮换标准原文及实际租户测试；本轮**只有本地仿真 CI** | 把模拟身份与真实生产主体分开验收，严格 tenant/context scope |
| 生产 Host↔EVO HTTPS/mTLS / reverse proxy | 真实证书签发/CA、private service DNS、ingress 转发边界、network policy、负载均衡，**本轮只有本地 TLS** | 验证真正的受信通道，防代理转发、伪 Host 和匿名访问 |
| KMS/Secret Manager/HSM 与签名密钥 | 平台实际部署环境的密钥权限模型、审计/轮换/回滚/撤销规范和运行记录 | 验收生产秘钥托管，不让任一 runtime/operator 互取对方密钥 |
| PostgreSQL 部署拓扑/高可用 | 实际主库/副本/事务隔离/网络断连/跨机器/延迟观测，不是 CI 双 Node | 在部署真实环境中核对 nonce 唯一性与撤销可见性 |
| CI/生产机密与日志保留 | 本地 CI 的随机测试密钥不等于正式外部密钥；GitHub Actions 原始 Job 日志未离线打包 | 在真实部署有权限时保存脱敏、可审计的生产验收证据 |

**索引原则：**不把“未来可以研究的 RFC/规范名称”编造成已经点开过的网址，不把 GitHub PR 讨论摘要当代码原文，不把 CI 的成功当 Google/OIDC/HTTPS/KMS/生产数据库授权真实验收。
