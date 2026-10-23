# PA-05 本窗口研究资料与决策详细参考索引（2026-10-16）

**Document class:** SESSION_RESEARCH_SOURCE_LEDGER / HISTORICAL_SNAPSHOT（Agent 单窗口，一手材料访问等级保真）。  
**查阅跨度：** 2026-10-15 对本轮 PA05 工程 PR、真实 CI/源码的持续核查；**2026-10-16** 对当前 GitHub main、现有研究归档和部分权威源文件再次核查。  
**编写时精确代码快照：** [`5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7`](https://github.com/jiangxng/EVO-App-Platform/commit/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7)（PR #954 merged，后续新窗口必须再次更新 HEAD）。  
**简短入口：** [PA05-WINDOW-HANDOFF-ENTRY-20261016.md](PA05-WINDOW-HANDOFF-ENTRY-20261016.md)；**工作证据正文** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §22–§34；**风险跟踪** [Issue #913](https://github.com/jiangxng/EVO-App-Platform/issues/913)。

## 0. 访问等级：先区分事实、判断和遗产

| 记号 | 本包使用的严格含义 |
| --- | --- |
| **G-FULL** | 本窗口 GitHub Connector 实际取到完整文件，阅读相关完整主体；不能延伸为审计了仓库所有依赖 |
| **G-PART** | 读到实际 GitHub 源文件并检查了代码片段/指定章节，不宣称全文件审计 |
| **G-META** | 实时读取 GitHub PR 合并状态、main/branch、Issue 或 Actions 结论；仅代表核对当时 |
| **G-LOG** | 实际读取 GitHub Actions Job 日志、测试错误和/或工程 marker；不等于登过线上 |
| **H-CARRY** | 原历史 PA04/PA05/PA02 索引已保存的互联网原始网址，本窗口**未重新打开该外站原文或搜索摘要** |
| **W-HIST** | 较早另一窗口的专项文档明确记载访问过外网原文；**只是历史作者记录，不是本窗口实访** |
| **J** | 用户明确要求或本窗口基于现有代码/真实 CI 做出的工程取舍，不是外部文章的原话 |
| **UNKNOWN / NOT_SIGNED** | 尚无可核的生产证明；不得补造页面、截图、官方结论或把候选写成正式验收 |

**特别声明：本窗口直接打开的非 GitHub 公网行业网页 = 0；新搜索摘要 = 0。** 下列 PostgreSQL、MCP、Anthropic 等来源**不得**因本包再次引用就写成“2026-10-16 已读官网”。旧研究访问日期只有原文件明确记载时才引用，未知首次日期写“未知”。这里的技术证明主要来自真实 PG18 代码/CI，不是从官网文献直接推导。

## 1. 本窗口实际读取或检索的 GitHub 原始材料

以下固定 SHA URL 是复现此次代码状态的真实原始网址；新窗口不必靠聊天全文重跑研究。

| ID | 标题 / 可定位原始 URL | 2026-10-15／16 访问等级、位置 | 关键发现（**G 来源事实**）及对工程的用途 |
| --- | --- | --- | --- |
| G01 | [AI-BOOTSTRAP](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/AI-BOOTSTRAP.md) | **G-FULL**，2026-10-16，启动顺序/authority | 最新进度以 repo 和 `project.status.json` 为先；单条闭环分支/PR；本交接仅 Agent 专项 |
| G02 | [Agent HANDOFF](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/HANDOFF.md) | **G-PART**，2026-10-16，历史导航开头 | 旧 PA05 恢复入口固定在 D8 时点，不能替代 D14C4 进度 |
| G03 | [PA05 先前恢复入口](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/PA05-WINDOW-RECOVERY-HANDOFF-20261015.md) | **G-FULL**，2026-10-16，§1–5 | 保留用户的 PA05/06/03 顺序、安全拒绝与跨项目边界；属于更早 D8 历史快照 |
| G04 | [PA05 原来源/决策索引](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md) | **G-FULL**，2026-10-16，§0–5 | 原 S01–S14 公网参考网址与 H-UNREAD 继承，早期 #903–#930 PR 归档，不重做 |
| G05 | [PA04 原始参考索引](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) | **G-PART**，2026-10-16，§0–3 | 旧行业外链历史阅读深度和项目设计边界；不能提升为本窗口外站已读 |
| G06 | [PA02 2026-10-15 来源索引](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) | **G-PART**，2026-10-16，来源与等级 | OpenAI/DeepSeek/Token 价格的早期网页访问等级，仅另窗历史；真实费用 #879 未签 |
| G07 | [PA02 Object Extension PG Owner 决策报告](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/PA02-OBJECT-EXTENSION-POSTGRES-ATOMIC-OWNER-20261014.md) | **G-FULL**，2026-10-16，Owner/Provider 契约与末尾外站来源 | 原文件 Provider 非跨进程单事务；隔离 PostgreSQL Owner 的企业资源+immutable evidence 是同一事务；不能自动迁移文件 Provider |
| G08 | [PA05 实施/认证基线](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md) | **G-PART**，2026-10-15 多轮读相关代码段，2026-10-16 复核 §22–34 章节索引/末尾 | D9–D14C4 连续设计和各 PR 的安全作用域；**历史段标题中的 candidate/CI pending 不是 10-16 最新结果**，需连 PR/Job 判断 |
| G09 | [中央跨库预留](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/manager/pa05-cross-database-admission.ts) | **G-PART**，2026-10-15，reserve/freeze/settle/Host 身份处理；2026-10-16 查阅 | 中央 PENDING + OWNER FROZEN 与 trusted Worker inventory；中央行锁有本库范围，无跨物理库 XA |
| G10 | [远端 SQL 准入](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/manager/pa05-cross-database-remote-sql-admission.ts) | **G-FULL/G-PART**，2026-10-15，构造/trigger/远端 ticket；2026-10-16 特定函数 | 远端 Worker+Host SQL `PREPARED→INVOKING` 需有效 ticket，并受本地 FROZEN 保护 |
| G11 | [Host Principal 身份认证](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/manager/pa05-cross-database-host-principal.ts) | **G-FULL/G-PART**，2026-10-15 | SQL `SESSION_USER`、PG 物理标识、manifest revision、两 Host 实登录与权限漂移检测；仍非生产机器身份 |
| G12 | [远端冻结协调](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/manager/pa05-cross-database-freeze.ts) | **G-FULL/G-PART**，2026-10-15 | 未覆盖所有登记远端时不得说“安全冻结”；失联的 ACTIVE Worker 可能仍用旧票 |
| G13 | [域表 Owner SQL 门禁](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/manager/pa05-cross-database-domain-owner-fence.ts)、[域表覆盖核验](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/manager/pa05-cross-database-domain-coverage.ts) | **G-FULL**，2026-10-15，D14C1–C2 | 限明确安装的域表；Owner 角色/DDL/Trigger/跨业务表权限漂移可检测，未知业务表不能自动被覆盖 |
| G14 | [Object Extension 原 PostgreSQL Owner](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/apps/object-extension/agent-owner-postgres.ts) | **G-PART**，2026-10-15；本轮 D14C4 多次取代码、CI 调整 | 真实 `pa02_contexts/pa02_definitions/pa02_owner_evidence` 与 verifier；受限角色不可执行 `FOR UPDATE/FOR SHARE`，隔离 opt-in 路径采用事务 advisory lock+普通 SELECT |
| G15 | [Object Extension D14C3 可信适配层](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/apps/object-extension/pa05-governed-owner.ts)、[D14C4 真实物理门禁](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/apps/object-extension/pa05-physical-sql-guard.ts) | **G-FULL/G-PART**，2026-10-15 | D14C3 仅 JS 适配时 raw Owner 可越过；D14C4 用实际三表 trigger + 单事务来源阻止**受限 SQL 登录的 raw 调用**，但 GUC/特权绕过仍待认证 |
| G16 | [跨库三 PG18 workflow](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/.github/workflows/agent-pa05-cross-database-admission.yml) | **G-FULL/G-PART**，2026-10-15，每次 PR 更新与 marker；2026-10-16 查 |
| G17 | [真实 Object Extension 业务验证](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/tests/agent-line/pa05-actual-object-extension-owner-pg.test.mjs)、[真实物理门禁验证](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/tests/agent-line/pa05-object-extension-physical-sql-fence-pg.test.mjs) | **G-FULL/G-PART**，2026-10-15，实测源码和 GitHub Actions | 真实第一方域表/独立 verifier/不盲重试 + raw Owner 负向证据；优先从这里继续开展凭证伪造最小测试 |
| G18 | [#913 生命周期 WRITE 冻结 Issue](https://github.com/jiangxng/EVO-App-Platform/issues/913) | **G-META**，本轮反复更新、2026-10-16 核对仍 OPEN | 累积冻结/UNKNOWN/Owner/环境风险阻断与各 D 轮说明；未关闭不可当 SIGNED |
| G19 | [开发交付约束](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/agent-line/AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md) | **G-PART**，2026-10-16，规范/分支清理 | 一闭环一短分支/PR，合并再清理；不能删除其他窗口独有分支 |
| G20 | [全局主线状态](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/project.status.json)、[生成 handoff](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/docs/roadmap/HANDOFF-LATEST.md)、[LLM 指南](https://github.com/jiangxng/EVO-App-Platform/blob/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7/LLM.md) | **G-META/G-PART**，2026-10-15 前窗与 2026-10-16 入口/路径核对；非本次逐行全读 | 这些优先于 Agent 快照但不可在本窗口越权覆写 |

## 2. 逐项工程 PR、确切合并记录、代码对应与来源阅读等级

**下表 PR 均在 2026-10-16 直接复核 GitHub `merged=true`（G-META），不是仅根据聊天口述。** PR / merge SHA 可供继续从 GitHub 定位完整 diff；自动测试运行的“PASS”有原始 CI/Issue 支撑，但未在本次交接重新触发一整套生产环境测试。

| 闭环 | GitHub PR 原始 URL | 已核的合并 SHA | 使用位置 / 本窗口重要结论（G/J 的边界） |
| --- | --- | --- | --- |
| D9 | [#935](https://github.com/jiangxng/EVO-App-Platform/pull/935) | `9b9b19f2643c955b07a0e69db2b05b65d8d3c3a8` | `manager/pa05-cross-database-admission.ts`；中央 durable reservation，不是跨 DB 一次提交 |
| D10 | [#938](https://github.com/jiangxng/EVO-App-Platform/pull/938) | `47314a1e9152ad28beef13bb6925077f160fb3b7` | `manager/pa05-cross-database-remote-sql-admission.ts`；真实 Worker LOGIN SQL 票与 UPDATE trigger |
| D11 | [#941](https://github.com/jiangxng/EVO-App-Platform/pull/941) | `8c59624ec3bf54df6ecb54094cc43014a0d60e52` | 现有 PA-02 `createGovernedAgentWriteHandoffV040` 可信 Owner 接线；不是新执行引擎 |
| D12 | [#943](https://github.com/jiangxng/EVO-App-Platform/pull/943) | `3d1742cd090b6564fcb5fc1d0bd83a4d491c0e4a` | 冻结状态才接受独立 Owner terminal 核实与中央 PENDING→SETTLED，未授权自动清除拒绝 |
| D13 | [#945](https://github.com/jiangxng/EVO-App-Platform/pull/945) | `8fce801e49fb705c713bffe53e86727fdb721737` | 中央真实 LOGIN、SQL ACL、并发冻结与核销；修复负向测试真正 UPDATE 命中 0 行问题 |
| D14A | [#946](https://github.com/jiangxng/EVO-App-Platform/pull/946) | `753218a6de5f94f7eb3fcbcad644edb228f01be3` | 远端单调持久 FROZEN；**证明**失联 ACTIVE B 旧票可执行，绝不可宣称全局停机 |
| D14B1 | [#948](https://github.com/jiangxng/EVO-App-Platform/pull/948) | `1e59cc687b0c62394dd9e8071c14aa7220fe08f0` | 两个不同 Host、三物理库 SQL LOGIN/互认、密码轮换后旧凭证拒绝；非原子跨 DB 撤销 |
| D14B2 | [#949](https://github.com/jiangxng/EVO-App-Platform/pull/949) | `458f860c8d11d6d3238547dd83829f8bb2231335` | 中央 manifest 授权和 reserve 共享事务行锁，解决先核验后撤销的 TOCTOU；远端票不原子撤销 |
| D14B3 | [#950](https://github.com/jiangxng/EVO-App-Platform/pull/950) | `f099856a95d7834838527db27f07e102a5beaccc` | 真实业务 SQL Host 授权探针权限漂移、NOINHERIT、凭证轮换；生产密钥分发不在此项 |
| D14C1 | [#951](https://github.com/jiangxng/EVO-App-Platform/pull/951) | `e01847b92a7b16673430b758aea72e5f93cf09b7` | **修复真实漏洞**：原 Host `PREPARED→INVOKING` 可跳过 D10 ticket；现在 Host/Worker 均强制 ticket |
| D14C2 | [#952](https://github.com/jiangxng/EVO-App-Platform/pull/952) | `867ea40b64a5fcff2fa68dfa0420f24a862bdc88` | 显式 Sales/Purchase/Warehouse 三表全覆盖、Owner 最小权限及 fail-closed ；不是自动扫描所有插件 |
| D14C3 | [#953](https://github.com/jiangxng/EVO-App-Platform/pull/953) | `1f5746487c7d64930d527a9f4776008581bc685b` | **首次真实插件** `evo-object-extension`：原业务 Owner + 表/receipt/Verifier；负向实测 raw Owner 不经适配仍可写 |
| D14C4 | [#954](https://github.com/jiangxng/EVO-App-Platform/pull/954) | `5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7` | 在真实三表下沉 opt-in PostgreSQL trigger，受限角色 raw Owner 被拒；高权限和 GUC 源冒用尚存 |

**旧早期阶段请引用已经核过的一次性资料包**：[PA05 D1–D8 PR #903–#930 整理](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md#2-已有版本化-pr--测试证据链从旧窗口修复而非重复实施)。本次没有更改那些阶段定义，也没有以 D14C4 的结果倒填早期研究日期。

## 3. CI、PG18 日志与短期易失证据

| 原始入口 | 核验日期/等级 | 可靠证据 / 限制 |
| --- | --- | --- |
| [D14C4 PR #954](https://github.com/jiangxng/EVO-App-Platform/pull/954) · [三物理 PG18 Actions #38734730714](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38734730714) | 2026-10-15，**G-META / G-LOG**，Job `116421030937`；2026-10-16 在 main 复核合入 | 精确最终 PR HEAD `dc9e4ab549550a28a2143751c9636c2934aa4677`，全部 **7/7 CI SUCCESS**。证据 marker `PA05_ACTUAL_OBJECT_PHYSICAL_SQL_FENCE_PG`：真实 3 PG18、3 实表、raw Owner 无票/有票均 SQL 拒绝、真实业务+evidence 原子成功、原独立 verifier、幂等、冻结拒绝、普通角色不能 DROP/DISABLE、privileged table owner 仍能 DISABLE、production WRITE=false |
| [D14C3 PR #953](https://github.com/jiangxng/EVO-App-Platform/pull/953) | 2026-10-15，**G-META / G-LOG** | 该 PR 实际触发 **6/6** 成功工作流（Platform CI 不在此文件变更触发集合内），marker `PA05_ACTUAL_OBJECT_EXTENSION_OWNER_PG`；当时 raw Owner **能够**直接绕过 JS adapter，D14C4 在 opt-in 的物理隔离环境中封堵这个具体路径 |
| [D14C2 PR #952](https://github.com/jiangxng/EVO-App-Platform/pull/952) | 2026-10-15，**G-META / G-LOG** | 实际三 PG18、3 域表、2 remote、3 Owner；marker `PA05_XDB_DOMAIN_COVERAGE_PG`；触发器/授权漂移后新 ticket fail closed，中央 PENDING 保留；准确 head 7/7 |
| [D14C1 PR #951](https://github.com/jiangxng/EVO-App-Platform/pull/951) | 2026-10-15，**G-META / G-LOG** | marker `PA05_XDB_DOMAIN_OWNER_PARTITION_PG`：Host 无票不能 INVOKING、Owner SQL 物理效果需票、真实 PG backend 中断、失联远端仍 ACTIVE 时旧票仍可执行、DB owner 可停触发器；7/7 |
| [D14B1–B3 PR #948–#950](https://github.com/jiangxng/EVO-App-Platform/pull/948) · [#949](https://github.com/jiangxng/EVO-App-Platform/pull/949) · [#950](https://github.com/jiangxng/EVO-App-Platform/pull/950) | 2026-10-15，**G-META / G-LOG**（核过各自 CI 标记） | `PA05_XDB_HOST_PRINCIPAL_BINDING_PG`、`PA05_XDB_TRANSACTIONAL_HOST_FENCE_PG`、`PA05_XDB_HOST_LEAST_PRIVILEGE_ROTATION_PG`；实际双 Host SQL 账号、撤销与 reserve 同中央事务、Role/Password 漂移拒绝；非生产管理员认证 |
| [D14A PR #946](https://github.com/jiangxng/EVO-App-Platform/pull/946) | 2026-10-15，**G-META / G-LOG** | `PA05_XDB_REMOTE_MONOTONE_FREEZE_PG`：已经 FROZEN 的远端旧票被本地 SQL 拒绝，失联仍 ACTIVE 的远端可执行旧票，不能假签全局冻结 |
| [D13 PR #945](https://github.com/jiangxng/EVO-App-Platform/pull/945) | 2026-10-15，**G-META / G-LOG** | `PA05_XDB_CENTRAL_SQL_HOST_IDENTITY_PG`：Host SESSION_USER，错误 GRANT、SET ROLE 冒充、两连接并发保护；无多独立主机身份保证 |
| [D9–D12 PR #935/#938/#941/#943](https://github.com/jiangxng/EVO-App-Platform/pull/935) | 2026-10-15，**G-META**、特定 Job 日志及主 CI/基线 | 见 §2 / [PA05 基线 §22–25](PA05-CERTIFICATION-BASELINE-20261015.md)；不是每一条 CI 日志本次重新全文逐行读过 |

**异常日志同样是研究遗产，不是误称“首次全部通过”：** D14C4 PR #954 初次 CI 曾因新测试 `inputDigest` 计算与原业务 canonical 口径不同被 Owner 拒绝；修复摘要后真实 SQL 触发器暴露了三个业务表字段差异（context 行不存在 `run_id`），随后发现 `FOR UPDATE` 与 `FOR SHARE` 均要求额外 UPDATE 权限。最终保留真实原 Owner 并发语义，以 **opt-in transaction advisory lock + 普通 SELECT** 配合受限 SQL LOGIN，不扩大权限；原路径原有 `FOR UPDATE` 不变。以上修改均发生在**同一 PR #954**，以其**最终 HEAD** 7/7 为结论。

**快失效材料定位：** Actions job log、PG marker 与 CI artifact `pa05-xdb-reservation-pg-evidence`（workflow 设置 14 天 retention），引用 [D14C4 run](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38734730714)、Job `116421030937` 和固定合并提交源码/测试为优先永久定位。**本窗口无截图、HAR、录屏、PDF、数据库 dump、生产密钥、正式 Human 测试附件可登记；附件路径 UNKNOWN，不编造。** Github PR/commit 和基线记录的 marker 摘要仍可在 CI artifact 过期后使用，不能冒充完整现场截图。

## 4. 外部行业网页：原始网址、日期、阅读等级与具体用途

以下 **S01–S14 仅继承旧仓库 [PA05 来源索引 §4](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md#4-外部行业资料遗产保持旧来源真实阅读等级)** 和 [PA04 索引 §3](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) 的真实 URL；旧项目蓝图有 2026-10-10 的历史阅读记录描述，但**本窗口 2026-10-15/16 既未访问这些网页原文，也未看任何本轮搜索摘要**。访问日期栏统一诚实写为“历史 2026-10-10 自述 / 本窗口未访问；首次实读日期 UNKNOWN”，仅表示资料链，不保证 URL 当前可达/内容没变。下面的用途是**旧项目采用场景或新窗口待查方向（J）**，不是本窗口阅读作者原文得出的新事实。

| ID | 标题／原始外网 URL | 日期／本窗口阅读等级 | 相关主题与项目具体用途（J / 待核） |
| --- | --- | --- | --- |
| S01 | [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 历史 10-10 自述，首次实读 UNKNOWN；**H-CARRY** | Agent/workflow 组合；PA05 优先复用 PA02 稳定工具/Owner 而非另造 Agent 核心 |
| S02 | [Anthropic — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 同上；**H-CARRY** | PA04 上下文、工作状态；本轮 D14 不重新研究 |
| S03 | [Anthropic — Managed agents](https://www.anthropic.com/engineering/managed-agents) | 同上；**H-CARRY** | PA06 长期执行/生命周期，只在 PA06 任务时重新查 |
| S04 | [Microsoft — Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | 同上；**H-CARRY** | Capability Catalog/工具语义，未来 PA05-05 Provider 真实调用 |
| S05 | [AG-UI — Events](https://docs.ag-ui.com/concepts/events) | 同上；**H-CARRY** | Agent→Human 事件，Eidos 是 Human UI authority |
| S06 | [A2UI — Catalogs](https://a2ui.org/concepts/catalogs/) | 同上；**H-CARRY** | UI 安全组件目录；不能替换 Eidos |
| S07 | [A2A — Specification](https://a2a-protocol.org/latest/specification/) | 同上；**H-CARRY** | 跨 Agent 互操作；`latest` 动态 URL，引用前要锁版本 |
| S08 | [MCP — Security best practices 2025-11-25](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | 同上；**H-CARRY** | 外部工具授权/Token 隔离；不是 D14 的 PostgreSQL SQL 能力保证 |
| S09 | [Microsoft HAX — Human-AI Interaction Guidelines](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | 同上；**H-CARRY** | PA05-05 有凭证 Human 前端拒绝/撤销可用性验收 |
| S10 | [Temporal — Workflow execution](https://docs.temporal.io/workflow-execution) | 同上；**H-CARRY** | 可供未来比较分布式恢复；**没有决定引入 Temporal** |
| S11 | [W3C — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 同上；**H-CARRY** | Eidos 可访问性，非本轮工程 |
| S12 | [W3C — Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 同上；**H-CARRY** | PA05-05 冻结/失败反馈的 Human 可访问性 |
| S13 | [OpenTelemetry — GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | 同上；**H-CARRY** | PA06 观测与 PII 边界，规范版本需复查 |
| S14 | [OWASP — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | 同上；**H-CARRY** | C05/工具调用权限，不把模型文本当业务最终权威 |

**较早其他窗口“已读官方原文”记录，不能归到本窗口：** [PostgreSQL 18 Transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html) 与 [INSERT / ON CONFLICT](https://www.postgresql.org/docs/18/sql-insert.html)：[PA02 原 Owner 报告](PA02-OBJECT-EXTENSION-POSTGRES-ATOMIC-OWNER-20261014.md#本轮新增来源浏览等级) 写明**2026-10-14 已实际打开原文（W-HIST，属于 PA02 那一窗口）**。这两项用于已有 Owner 事务原子性和 ON CONFLICT 行为，D14C4 的真实性另外由 G-LOG/真实 PG18 而不是借文献声称。更早 PA02 的 [OpenAI Responses Input Tokens](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens) 是该旧窗口所记 W-FULL；[DeepSeek Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion/) W-PART；[Responses Create](https://platform.openai.com/docs/api-reference/responses/create) W-ATTEMPTED-NOT_READ；[OpenAI Pricing](https://platform.openai.com/pricing) W-SEARCH-SNIPPET。**本窗口都未重访**，价格/账单受 #879 阻断。

## 5. 方案比较：来源事实 vs 工程判断（J）

| 争议 | GitHub/PG18 已证事实（G） | 本窗口采用方案及理由（J） | 排除/限制的方案（J），适用条件 |
| --- | --- | --- | --- |
| 跨物理数据库 WRITE 原子性 | D9–D13 中央/远端在不同 PG18 物理数据库；没有一把跨库 PostgreSQL 行锁 | 中央持久预留→远端本地 ticket→PA02 Owner/Receipt→冻结后核销，失联保持 UNKNOWN/PENDING | 排除假装同库事务变为全局原子；真实 XA/外部 fencing/租约需独立认证 |
| 断网后旧票的“全局冻结” | D14A/C1 真实反例：已失联 ACTIVE remote B 能在 central FROZEN 后继续用旧票 | 每远端 durable 单调 FROZEN、完整 worker inventory，没能确认所有远端就报告 ERROR | 排除网络断开时仍报告 globally safe；已 INVOKING/物理旧票不能由中央直接撤销 |
| Host 授权与撤销时序 | D14B1 只 preflight 存在撤销竞态，D14B2 真实 `FOR SHARE` 锁 central manifest | 在**中央同一事务**锁验证 Host/Worker manifest，再 INSERT reservation | 不可宣称远端自动跟随撤销；跨库风险留 D14 后续 |
| 跨库身份与权限 | D14B1–B3 真 `SESSION_USER`、双 Host 登录、错误 GRANT/NOINHERIT/NOLOGIN/旧密码拒绝 | 独立真实 SQL LOGIN+最小权限+每次新会话核验；真实旋转需匹配 manifest revision | 排除 Worker 自报身份和仅 in-memory ACL；生产 machine attestation/秘密管理未签 |
| 业务表安全 | D14C1–C2 样例单表和多表 SQL 门禁可用；D14C3 **实际插件 schema 不同** | 先明确实际业务域表/Owner 数据契约，选择 Object Extension 作为首个真实插件；保留原验证器 | 排除把旧资源表改成统一模拟 `scope_key/fence` 表，避免不可控数据迁移 |
| 只依赖 JS 可信适配 | D14C3 实测 raw Object Extension Owner 可直接写入 | D14C4 将强制票/来源与本地 FROZEN 检查装到 **真实三张 PG 表**；合法 Owner 原事务保留 | 只对 opt-in schema 生效；未完成默认生产路由/表迁移 |
| Owner 并发保护与最小权限 | D14C4 CI 证明原 `SELECT…FOR UPDATE` 和 `FOR SHARE` 都需要 UPDATE 权限 | opt-in 使用事务 advisory lock+普通 SELECT，保留原非 opt-in FOR UPDATE 和表唯一键/FK | 排除直接给受限业务 LOGIN 额外 UPDATE；不具 advisory 配合的其他高权连接仍需防 |
| SQL 触发器 vs DBA/失窃凭证 | D14C4 marker 特意证明 table owner 可停 trigger；业务 SQL 登录和 GUC 来源仍可能受冒用 | 保留生产 NOT_SIGNED，下一步优先明确可信 credential/Host 边界与可验证最小攻击 | **不能**声称应用 trigger 抵御超级用户；不自创没有安全根的“签名 GUC” |
| CI 与 Human 签收 | PR #954 7/7 准确 head PG18 回归、0 skip；未给真实 Provider/正式人体验收 | 现阶段标 isolated engineering PASS，生产 WRITE OFF，Issue #913 继续开放 | 排除“已 merge/绿 CI=上线”。PA05-05 需有凭证 Human→Agent→真实业务 Owner 效果与恢复证据 |

## 6. 资料之间的冲突、未解决问题与优先查阅方向

1. **历史候选文字 vs 最新 merged CI：** [PA05 基线](PA05-CERTIFICATION-BASELINE-20261015.md) §22–§34 逐轮追加时常写 `candidate`；[PR #954](https://github.com/jiangxng/EVO-App-Platform/pull/954) 等已经 merged，CI 实际 PASS。解决方式：基线视为演进原始日志、GitHub 合并状态与 **相同 HEAD** 的 Job 日志才是实现状态；**PASS 只到隔离证明边界**。
2. **预检查通过 vs 物理授权被冒用：** D14C4 自定义事务 `evo.pa05.*` 来源和同库 ticket/Effect 可互证，但若攻击者取得允许 INSERT 的业务 SQL LOGIN，可能自己 `SET LOCAL` 引用有效旧票。**这是核心下一项研究/实现候选，不能假称认证通过。** 优先查 `apps/object-extension/agent-owner-postgres.ts`、`pa05-physical-sql-guard.ts`、SQL 角色配置，以及真实受限凭证泄露模拟。
3. **行锁 vs 最小权限：** 原 Owner 需要 `FOR UPDATE`，受限角色不能拥有 UPDATE；本轮 CI 还证明 `FOR SHARE` 同样需要 UPDATE。最终 opt-in 改为 advisory transaction lock+plain SELECT。该方案仅使**配合锁**的 Owner 请求互斥；需要回归实际多进程并发、重入、撞 hash、其他不配合写方，不可扩展为所有任意 SQL 客户端已经串行化。
4. **历史 PostgreSQL 官方文档 vs 实际触发器语义：** PA02 旧窗口只查事务与 INSERT 官方页面；D14C4 的 `SESSION_USER`、trigger `SECURITY DEFINER`、`set_config(...,true)`、锁权限和 CREATE/ALTER ROLE 的生产语义，**本窗口并未直接阅读官方章节**。新窗口若要做更强安全设计，应有目的地访问对应 PG18 官方章节并按 W-FULL/W-PART 注明阅读层级，而非假写本文已完成。
5. **跨数据库协调 vs 故障恢复：** 中央 reserve/Owner settlement 与 remote ticket 非原子；无法联系的 ACTIVE remote 上旧票仍有效。无可信外部 lease expiry/quorum 或远端可验证强制 fencing 时，不可有跨分区全局 fail-stop 安全声明。若研究引入新协调技术，需专门比较安全假设及发生网络隔离时谁持有写权限。
6. **真实业务插件 vs 生产数据权威：** D14C3/C4 的 `evo-object-extension` 是隔离 PostgreSQL 的真实第一方 Owner，但当前产品 Enterprise Resource 文件实现仍与之不同。**没有经批准的无损迁移、生产 Host 注册、密钥部署、真实身份及 Human Browser 验收**。应在原 `apps/object-extension`/真实 Owner 单元先补不可绕过再推广其他插件，别立即重写 Provider。
7. **旧源历史和现行外部规范：** S07 A2A `/latest`、S13 OTel 可能变化。实际需要协议互操作时必须查当前原文并锁版本；**本次没有任何新官网内容结论**。S01–S14 多数与 D14C4 不是同一安全问题，避免为“研究完整”全数重读。
8. **早期恢复分支和新交接分支：** `docs/pa04-window-research-decision-handoff-20261015`、`docs/pa05-window-recovery-20261015` 2026-10-16 核验仍存在，已有治理流程却不能当作已删；新交接分支 `docs/pa05-d14c4-research-decision-handoff-20261016` 是单次 PR 分支，合并后应检查自动删除。不得清理 BEX/Eidos/2D/治理窗口分支。

### 建议的下一轮有界任务（**尚未实现**）

**D14C5 首选技术闭环**：在不触碰生产 `manager/server.ts` / 文件 Provider 的前提下，证明或否定“已泄露受限 Object Extension business SQL LOGIN + 自行设置 `evo.pa05.*` + 历史 valid ticket”能否制造不受信的业务效果，且不破坏合法 Owner/verifier；根据真实 PG18 实证决定如何减少授权、是否需要更强 DB-local one-shot Host capability 或替代安全边界。不要在没有隔离/凭证信任根的情况下“加密签名一个 GUC”冒充解决；保留 direct privileged DB owner 不能由应用触发器阻止的事实。之后才按真实业务插件逐一移植契约，最后 PA05-05 credentialed Provider/Human/Agent signoff。

**缺失内容清单：** 未发现本窗口直接浏览的外站网页、搜索结果、屏幕截图、外部实验附件、真实生产 DB/密钥或 Human 验收视频；没有将旧聊天全文逐字上传 GitHub（本包是有证据取舍摘要，不是转录）。这些东西不在 GitHub 也不在本包里；任何未知 URL 的当前内容/附件路径均写 UNKNOWN。项目原有 113KB PA05 历史实验基线保持原样，可追溯迭代细节。
