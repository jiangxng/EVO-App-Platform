# PA-05｜D14C5–D14C12 网络资料、研究决策和验收详细索引（2026-10-16）

**文档类型：** RESEARCH_SOURCE_DECISION_LEDGER / CONTINUATION，独立 Agent 专项；**短入口：** [PA05-D14C5-D14C12-RESEARCH-HANDOFF-ENTRY-20261016.md](PA05-D14C5-D14C12-RESEARCH-HANDOFF-ENTRY-20261016.md)。  
**归档时源仓库基线（PR #972 已合并）：** [main@84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0](https://github.com/jiangxng/EVO-App-Platform/commit/84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0)。本**文档 PR 合并后**需以新的 main 为准。  
**认证总账：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §35–42 · [Issue #913](https://github.com/jiangxng/EVO-App-Platform/issues/913) **OPEN** · PA-05/W06 **IN_PROGRESS / NOT_SIGNED** · production material WRITE **OFF**。

## 0. 访问等级、日期及反补造约束

| 标签 | 证据含义 |
| --- | --- |
| **W-ORIGINAL-PART-20261016** | **本次交接整理**于 2026-10-16 **实际直接打开** PostgreSQL 18 官方原始网页，查阅与条目相关的章节/内容，**并非阅读或审计整本手册**。这些是本次补充核验；不能据此伪称它们均曾在之前某个工程子轮独立打开。 |
| **G-ORIGINAL-PART** | 当前及此前 PA05 工程通过 GitHub 读取真实代码/原始归档，确认相应机制；不表示已逐行审计整个仓库。|
| **G-PR / G-LOG** | GitHub 直接返回的已合并状态/准确 SHA，以及实际 Actions 日志（仅对列明的精确 run/HEAD 有效）；12/12 CI 是**12 个 Node test 文件/测试用例的集成结果**，并非总共只有 12 个安全断言。 |
| **H-DOC-CLAIM** | 前阶段已经提交的单项工程决策文档**声称/记录**当时打开的原始网址及阅读等级；不把这种历史自述升级为本次直接访问的证据。若本次补充核验同一 URL，仍应区分两个访问事件。 |
| **H-CARRY** | [较早 PA05 来源索引](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md) 和 [PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md) 中保留的 MCP、Anthropic 和其他行业资料网址；**本次未逐条访问或读其摘要**，沿用原历史等级，不复制为“新读原文”。 |
| **W-SUMMARY-ONLY** | 本次详细索引**没有**使用仅搜索结果摘要作正式采纳依据的技术来源；此等级下新增条目数 **0**。 |
| **TODO / NOT_VERIFIED** | 未来需验证或无真实运行证据；对 PKI 部署、企业机器身份、浏览器/Provider 端到端或网络分区强保证不得写 PASS。 |
| **J-ENGINEERING** | 根据实测代码、失败日志、安全威胁模型所作工程判断，不是官网原文。 |

**时间与证据保真：** 下列官方资料“**本次访问**”日期均为 **2026-10-16**。历史 D14C5–C12 单项文档对其工程开发期间的来源访问如有记录，保留为 H-DOC-CLAIM；不能仅因本篇再核验而倒填历史首次访问时间。对未曾实际访问的网址不写“已读”。GitHub/Actions 网页入口亦与文献网址分开，避免把 CI 当成官网论文。

## 1. 本次真正打开的官方网络资料（原始网址、章节、发现、用途）

**W-ORIGINAL-PART-20261016**：下表每项均在**本次整理**从官方原始 URL 打开；章节和关键点取自原始内容，而不从标题猜测。第一列 ID 供后续决策冲突引用。

| ID | 官方原始标题与完整 URL（原文入口） | 查阅日期／原文章节 | 来源事实和对本项目的具体用途 |
| --- | --- | --- | --- |
| **PG01** | [PostgreSQL 18 — 5.8 Privileges](https://www.postgresql.org/docs/18/ddl-priv.html) | 2026-10-16，§5.8 | 表/架构/函数/默认 PUBLIC 权限是各自的授权边界。用于 D14C5/C6 的受限 Business、Host、Schema/表和函数 EXECUTE 审计。 |
| **PG02** | [PostgreSQL 18 — REVOKE](https://www.postgresql.org/docs/18/sql-revoke.html) | 2026-10-16，REVOKE 权限、角色委托语义 | 撤销直接授权并不自动解释完整角色链与 PUBLIC 访问；角色授予/继承必须另查。用于 C6 漂移测试中 NOINHERIT、delegated grants、PUBLIC EXECUTE 不能漏测。 |
| **PG03** | [PostgreSQL 18 — 9.27 System Information Functions and Operators](https://www.postgresql.org/docs/18/functions-info.html) | 2026-10-16，角色/权限函数及当前事务标识函数 | 服务器侧会话/权限查询应优先于客户端自报 GUC；事务 ID 函数与调用时机用于 C6/C10 的实际身份核对。 |
| **PG04** | [PostgreSQL 18 — CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) | 2026-10-16，SECURITY DEFINER 安全用法（示例、SET search_path） | SECURITY DEFINER 使用对象所有者权限，必须限制不可信 search_path／临时 schema 及 PUBLIC 的函数执行权限；用于 C5–C12 SQL 专属签发/撤销/登记/轮换函数。**不是说该机制能抗超级用户。** |
| **PG05** | [PostgreSQL 18 — 13.4 Data Consistency Checks at the Application Level](https://www.postgresql.org/docs/18/applevel-consistency.html) | 2026-10-16，§13.4，SELECT FOR UPDATE/FOR SHARE | 行锁仅保证冲突操作按事务排序；等锁结束后不等于自动取消已提交命令，若要阻止后续操作需写入不可忽视的实际状态。C7 用真实 revoked/consumed 行与并发检验，不能把 COMMITTED 误写为 REVOKED。 |
| **PG06** | [PostgreSQL 18 — SELECT](https://www.postgresql.org/docs/18/sql-select.html) | 2026-10-16，SELECT 锁定行/锁模式条款 | `FOR UPDATE` / `FOR SHARE` 对执行事务和表权限有实际约束。供 C7、C11 的行锁和 `FOR SHARE` 跨轮换验证；受限业务 LOGIN 不可随意增权以迁就测试。 |
| **PG07** | [PostgreSQL 18 — 67.1 Transactions and Identifiers](https://www.postgresql.org/docs/18/transaction-id.html) | 2026-10-16，§67.1 | xid/64 位事务标识与持久记录不同；C10 pin 同一数据库后端和事务，不可把 PID 当作永久身份或全球物理节点证明。 |
| **PG08** | [PostgreSQL 18 — 27.2 Cumulative Statistics System](https://www.postgresql.org/docs/18/monitoring-stats.html) | 2026-10-16，§27.2 `pg_stat_activity`/`pg_stat_ssl` | `pg_stat_activity.backend_start` 是真实服务器记录的连接开始时刻；`backend_xid`、PID/登录角色可核实活事务。§27.2 `pg_stat_ssl` 包含 SSL=true、`client_dn`、`issuer_dn`、`client_serial`；两个 DN 默认最多 **64 字符**，应记录这一身份截断风险。用于 C10/C11/C12。 |
| **PG09** | [PostgreSQL 18 — ALTER ROLE](https://www.postgresql.org/docs/18/sql-alterrole.html) | 2026-10-16，ALTER ROLE PASSWORD | SQL 密码修改的是角色后续登录材料，**不能据此断言已建立的旧 backend 立刻退出**。C11 增加管理员同事务 epoch 截止和旧会话/旧 RR 快照实测。 |
| **PG10** | [PostgreSQL 18 — 20.1 The pg_hba.conf File](https://www.postgresql.org/docs/18/auth-pg-hba-conf.html) | 2026-10-16，§20.1 规则顺序、hostssl/hostnossl、clientcert=verify-ca/verify-full | **首条匹配规则不回退**；`hostssl` 与 `hostnossl` 区分 SSL 状态；可在密码认证之外强制客户端证书 CA 链。C12 的短期 Host 专用 HBA 及无证书拒绝依赖这些机制；注意 IPv4 与 IPv6 匹配不同。 |
| **PG11** | [PostgreSQL 18 — 18.9 Secure TCP/IP Connections with SSL](https://www.postgresql.org/docs/18/ssl-tcp.html) | 2026-10-16，§18.9 | PostgreSQL 服务端需显式启用 TLS、正确设置证书/私钥和信任 CA。用于临时 PG18 CI 服务端证书安装，**不是生产 TLS 配置已完成**。 |
| **PG12** | [PostgreSQL 18 — 20.12 Certificate Authentication](https://www.postgresql.org/docs/18/auth-cert.html) | 2026-10-16，§20.12 | TLS 客户端证书可作为数据库登录身份检查的一部分，用户名映射/完整 DN 机制由 HBA 控制；C12 特意选择密码+证书链并额外在 SQL 对原始 `pg_stat_ssl` 身份 pin，而非依赖一个自报参数。 |
| **PG13** | [PostgreSQL 18 — 32.19 SSL Support](https://www.postgresql.org/docs/18/libpq-ssl.html) | 2026-10-16，§32.19.1–32.19.3 服务器校验与客户端证书 | 服务器身份校验推荐 `verify-full` + SAN/IP 主机匹配；客户端证书应由服务端信任的 CA 签发。C12 的一次性测试证书包含 IP SAN，Client TLS 不禁用服务端证书验证；**该页说明 libpq 行为，测试实际 JS 驱动为 postgres.js/Node TLS，不能直接推定两者配置语法等价**。 |

**相关历史原始访问出处（H-DOC-CLAIM）：** C6 [PG01–03](PA05-D14C6-OBJECT-SQL-ROLE-DRIFT-20261016.md#source-and-reading-level-ledger)；C7 [PG04–06](PA05-D14C7-PERMIT-REVOKE-COMMIT-RACE-20261016.md#precisely-accessed-material-and-evidence-level)；C10 [PG03、PG07–08](PA05-D14C10-TRANSACTION-BOUND-PERMIT-20261016.md#direct-sources-and-grades)；C11 [PG08–09](PA05-D14C11-SQL-CREDENTIAL-SESSION-ROTATION-20261016.md#actual-source-research-and-reading-grades)；C12 [PG08、PG10–13](PA05-D14C12-ACTUAL-POSTGRESQL-CLIENT-CERT-HOST-IDENTITY-20261016.md#sources-actually-inspected-and-grades)。**C5/C8/C9 前述工程文档明确仅继承旧网址或本轮未新读外网；不虚构它们各自打开了额外行业网页。**

## 2. 工程研究结论与真实合并证据（与网络资料明确区分）

下表的 PR 合并状态在此次整理通过 GitHub **逐一重新核对**（G-PR）；CI run IDs 是工程期间实际读取过原始 Actions marker、回归结果并写入了对应单项文档的证据（G-LOG 历史记录）；**不可把所有 run 说成这次整理再次完整执行**。有些早期阶段历史文档仍写 `candidate`，须看已经核验的最终 merged PR 状态。

| 阶段 / 子工程参考文档 | 合并 PR 与准确 merge SHA | 真实代码位置、证明和用途 | Actions 精确索引 |
| --- | --- | --- | --- |
| [D14C5 Host SQL 许可](PA05-D14C5-HOST-PERMIT-BOUNDARY-20261016.md) | [#959](https://github.com/jiangxng/EVO-App-Platform/pull/959) · `d55cf2d3b0bf5ee67ef009c88ca2076afb1b57fd` | 首个独立 SQL Host LOGIN 与受限 Owner，同一 effect 一次性 permit、原真实三表递延 Owner evidence、不可重放；修复 GUC 伪造源。 | [#959 PR checks/logs](https://github.com/jiangxng/EVO-App-Platform/pull/959/checks)；本次未再次逐条读取其精确 run，**不虚构 Actions ID**。 |
| [D14C6 权限漂移](PA05-D14C6-OBJECT-SQL-ROLE-DRIFT-20261016.md) | [#961](https://github.com/jiangxng/EVO-App-Platform/pull/961) · `a76891a5817bd030807b06bf4081a2abc4e5880c` | 动态 SQL 权限 attestor，每次 Host 签发/物理插入检查危险授权、NOINHERIT/GRANT/PUBLIC。 | [PG18 #38834671835](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38834671835)；12/12 PASS、0 skipped。 |
| [D14C7 撤销竞态](PA05-D14C7-PERMIT-REVOKE-COMMIT-RACE-20261016.md) | [#962](https://github.com/jiangxng/EVO-App-Platform/pull/962) · `f948632729c04060a606250484ae63c0290d2365` | revoked/consumed 与物理 INSERT 争抢同一 permit row，撤销后拒写，已提交反馈 COMMITTED。 | [PG18 #38836397285](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38836397285)；12/12 PASS、0 skipped。 |
| [D14C8 内容锁定](PA05-D14C8-APPROVED-COMMAND-PAYLOAD-20261016.md) | [#963](https://github.com/jiangxng/EVO-App-Platform/pull/963) · `9170457579642bd9c010012dd4655b8e976c10a6` | 完整原 Owner `resource` JSONB、`evidence`、digest、原始请求归一化口径；有真 permit 仍不能伪造不同字段/凭据。 | [PG18 #38839445483](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38839445483)；12/12 PASS、0 skipped。 |
| [D14C9 原始命令独立登记](PA05-D14C9-HOST-COMMAND-PROVENANCE-20261016.md) | [#965](https://github.com/jiangxng/EVO-App-Platform/pull/965) · `726fd32de112e5c0046fb226422111bbff41b171` | 独立 SQL Host 先登记不可变完整命令，Owner 随后用原 D10 和完整源核对，未登记则拒绝。 | [PG18 #38840952890](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38840952890)；12/12 PASS、0 skipped。 |
| [D14C10 事务绑定](PA05-D14C10-TRANSACTION-BOUND-PERMIT-20261016.md) | [#967](https://github.com/jiangxng/EVO-App-Platform/pull/967) · `b294f24a81695cdde41a0c1a6d650e5236d77f64` | Host 锁定原 Business SQL 实际 PID+XID；即使另一个数据库连接有**完全相同批准材料和被盗有效 permit**也无法重放。 | [PG18 #38843463232](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38843463232)；12/12 PASS、0 skipped。 |
| [D14C11 密码/旧 session 轮换](PA05-D14C11-SQL-CREDENTIAL-SESSION-ROTATION-20261016.md) | [#969](https://github.com/jiangxng/EVO-App-Platform/pull/969) · `51f285a69778c363bec8763e37a61ac94991cd0c` | DBA 原子密码 + epoch，旧 Host/Business已连 session 拒绝，in-flight Owner 不可提交，RR 旧快照拒绝，新 session 原 Owner 成功。 | [PG18 #38845093624](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38845093624)；12/12 PASS、0 skipped。 |
| [D14C12 真实客户端证书](PA05-D14C12-ACTUAL-POSTGRESQL-CLIENT-CERT-HOST-IDENTITY-20261016.md) | [#972](https://github.com/jiangxng/EVO-App-Platform/pull/972) · `84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0` | 受限 SQL Host 需真实 CA 签发客户端 cert + SQL 密码，物理 `pg_stat_ssl` 观察身份；无 cert / 错 cert 被拒，真实 Owner+Verifier 仍可用。 | **最终** [PG18 #38886594068](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38886594068)，PR HEAD `735b75e80b93206f66aaa821ebbc2c885654501a`：**6/6 change-triggered CI、12/12 PASS、0 skip**；[分支清理 #38886854990](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38886854990) 日志明确删除 `agent/pa05-d14c12-host-mtls-postgres-20261016`。 |

**原始代码与配置的版本复现：** 固定 [main@84c07… 的 Object Extension Owner](https://github.com/jiangxng/EVO-App-Platform/blob/84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0/apps/object-extension/agent-owner-postgres.ts)、
[物理安全门禁](https://github.com/jiangxng/EVO-App-Platform/blob/84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0/apps/object-extension/pa05-physical-sql-guard.ts)、
[Host SQL 发行/登记/撤销](https://github.com/jiangxng/EVO-App-Platform/blob/84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0/apps/object-extension/pa05-host-sql-permit.ts)、
[实际三 PG18 测试](https://github.com/jiangxng/EVO-App-Platform/blob/84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0/tests/agent-line/pa05-object-extension-host-permit-pg.test.mjs)、
[GitHub Actions workflow](https://github.com/jiangxng/EVO-App-Platform/blob/84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0/.github/workflows/agent-pa05-cross-database-admission.yml)、
[短命测试 PKI 脚本](https://github.com/jiangxng/EVO-App-Platform/blob/84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0/scripts/ci/pa05-host-mtls-setup.sh)。
各 PG18 证明真正核对三个不同 `pg_control_system().system_identifier`，其余 D9–D14C4 证明见 [旧参考索引](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md)，不要重复跑此前已验完的实验来宣称本轮新成果。

## 3. 采用／排除方案，理由与适用限制（分开“来源事实”和“工程推断”）

| 主题 | 来源事实与直接工程反例 | 本窗口已经采用的工程判断 **J-ENGINEERING** | 明确排除与适用限制 |
| --- | --- | --- | --- |
| SQL 身份与 GUC | 原 C4 raw 受限 SQL LOGIN 可以自设 `evo.pa05.*`（工程测试）；PG01–04 提供权限/SECURITY DEFINER 工具语义 | C5 把一次 permit 交由真正独立 Host SQL LOGIN，C6 在 Host/Business 物理事务里每次核查 ACL | 排除 GUC 直接当身份、一次 installer 权限检查、JS Wrapper-only；**不能阻止超级用户/双凭据** |
| 撤销与实际提交 | PG05–06：SELECT 锁争抢并不是事务自动取消；C7 PG18 真实 race | 同一许可行持久 revoked/consumed；管理员撤销先赢拒写，提交先赢只能回复 COMMITTED | 排除仅 JS 内存撤销、把 UNKNOWN 直接重试/删除；不提供分布式 XA |
| 内容/命令来源 | C8 发现 Owner 原始 digest 是**原请求**而不是标准化后相同 JSON；C9 原 Owner 可自造表面一致批准源 | C8 主动绑定原资源和 receipt；C9 从可信 Host **先**登记独立不可变命令后才能签 permit | 排除仅 `inputDigest`/改变字段后生成自洽摘要、Owner 自己 staging 命令；仍未证明机器身份 |
| 原样重放 | PG03/07/08：真实 PG backend PID 与 XID 来自数据库；C10 负向真实双 session | Host pin 一个当前活的 Business LOGIN PID+XID，物理 INSERT 校验双标识；旧 permit 别的后端不能执行 | 排除同 token+SQL 密码证明“同一执行主体”；**合法连接本身遭控仍未解决** |
| 旧密码和连接 | PG08/09 + C11 CI：改密码后的旧活动连接存在，`backend_start` 源自 DB | DBA **同一事务**变更密码和 session epoch；SQL attestor 对 old session、old RR snapshot 均拒绝 | 排除“只 ALTER ROLE 就切断所有旧连接”、仅客户端重连状态；未协调 epoch 的生产手动更改无保护 |
| 真实证书来源 | PG10–13 + C12 CI：HBA 的 cert+SCRAM、服务器上的 `pg_stat_ssl` 身份可检查 | test-only CA、server cert/IP SAN、good/bad client cert；Host SQL 必须真实证书 DN/issuer/serial 匹配 | 排除无校验 TLS、`rejectUnauthorized:false`、仅 password、声称测试 client cert = 生产机器 attestation；**测试 HBA 仅 IPv4** |

**拒绝方案的适用条件说明：** 单库行锁是局部强制，不可推广到网络隔离时两个不同物理 PG18 的原子撤销；临时 CI 密钥是验证 PKI 接线是否真实，不应变成仓库长期私钥或生产证书服务；Owner 的源数据版本策略、正式路由和 Provider 写入迁移没有得到新授权。

## 4. 资料或旧文字之间的冲突与实际消解

1. **早期 `candidate / CI pending` vs 当前 PR 已合并：** 每轮 C5–C12 的决策文档是写入当时的快照。后来实测及 PR 已合并；不得用旧文档一句 `candidate` 来说没做，也不得反推生产 SIGNED。判准：本索引合并 SHA + 具体 Actions marker + #913 的 OPEN。
2. **证书 DN 格式，官网 HBA 与 `pg_stat_ssl` 不是同一打印格式：** PG10 HBA `clientname=DN` 说明使用 RFC2253；C12 第一次运行测试错误地预期 `CN=...`，实际本平台 PG18 `pg_stat_ssl` 读回 **`/CN=pa05-certified-host`** 和 **`/CN=PA05 Test CA`**，序列号 **4242**。随后按**服务器观测值**修正 PIN，而非取消验证；[最终三 PG18 #38886594068](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38886594068) 证明成功。**不能随意套用 HBA RFC2253 字符串到 SQL 的原样字符串比较**；生产 DN 长度上限也需重新设计。
3. **PG ssl CA 认证 vs 物理机器身份：** PG10/PG11/PG12 允许对客户端 cert 链检查，C12 确实在真实 SSL 链路执行；但正确私钥+密码若被盗仍可冒用。这里验证的是**证书呈示的、受信任 CA 颁发的连接身份**，不是 TPM/TEE/云 workload-attested 宿主。
4. **PostgreSQL 文档里的锁/事务假设 vs 多库共识：** PG05–08 只规范单数据库事务/连接，D14A 曾显示失联的 ACTIVE Worker 持有有效旧 D10 票；C7–C12 不因此获得跨 DB 全局 fail-stop。需单独网络隔离与旧票过期策略。
5. **C11 保留老会话 vs C12 TLS 证书撤销：** 数据库密码 epoch 保护只在 DBA 配套更新水位时生效。D12 使用证书，**删除/替换 CA 或 CRL 是否能立即使已经连接的旧 Host TLS backend 失效**还没有实测签收；下一步不能仅靠“新连接拒绝”声称断掉旧会话。
6. **Github 文件 README/主线快照滞后 vs Agent 专项：** `project.status.json` / 生成 `HANDOFF-LATEST` 是其他 owner 的 authority，不在此 PR 手改；Agent HANDOFF/基线记录多轮从属事实；新窗口需按真实 main 再核定状态。
7. **外网阅读等级冲突：** 较早 [PA05 旧研究索引](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md) 明确记录它自己的直接外网访问数为 0；**本次交接**才实际重新打开 PG01–PG13。两个时间窗口并不矛盾，**不可篡改旧索引为“早期已读 PostgreSQL 全文”**。

## 5. 最值得继续查阅／验证的方向及下一验收

| 优先级 | 应新增的证据/官网方向 | 下一步最小真实 gate（未签，切勿预写 PASS） | 受影响模块 |
| --- | --- | --- | --- |
| **P0** | PostgreSQL18 [pg_hba.conf](https://www.postgresql.org/docs/18/auth-pg-hba-conf.html)、[pg_stat_ssl](https://www.postgresql.org/docs/18/monitoring-stats.html)、[SSL certificate/CRL](https://www.postgresql.org/docs/18/libpq-ssl.html) 章节，并核对生产候选环境 HBA IPv4/IPv6、CA 轮换、旧 TLS backend 活跃语义 | **D14C13（候选而非授权结论）：** 同一真实独立 Host/Business PG18 测试中拒绝过期/已换证证书与已建立证书会话，确保不会跳过旧原 Owner 数据约束；先研究哪些必须依赖 DBA epoch 或主动断链，再决定是否实现。 | `pa05-physical-sql-guard.ts`、Host TLS issuer、CI setup、`pa05-object-extension-host-permit-pg.test.mjs` |
| **P1** | PA05 真实其他插件 Owner/Provider 代码、Owner 可信 source/DDL 与现有 verifier 语义；不能仅照搬 Object Extension | 逐个实体实际 schema/独立权限与不可变 receipt/真实端到端证明；复用现有 Host/D9/D10 而非为每插件复制一套伪通用引擎 | 对应 plugin Owner、`manager/pa05-cross-database-*`、合同和隔离 CI |
| **P2** | 真正 PA05-05 身份、Human/Agent/Provider 生命周期、生产 PKI 管理与权限审核的当前业务决策文档 | 真实可用身份、两业务场景、失败/网络隔离/重复请求/恢复/升级/冻结、真实浏览器与签收。**只有专门 Human/生产授权后**再讨论 material WRITE ON | Personal Agent、Context、Host governance、Eidos + Provider 原始业务路径 |
| **P3** | 网络隔离 ACTIVE remote ticket / 旧 Host 令牌的强制 fencing；特权 DBA/DDL threat model | 单独明确强制租约/共识/中心服务依赖、断网后哪个库允许写；不要用局部 SQL 锁伪装全局强一致 | `manager/pa05-cross-database-freeze.ts`、remote SQL ticket |

## 6. 容易失效的证据及不可恢复素材

- **PR/merge SHA** 是持久化定位主线的来源；**Actions Job log 和 CI artifact** 可能受平台保留期影响，最重要的 D14C12 精确值已复制到本索引：**HEAD `735b75e80b93206f66aaa821ebbc2c885654501a`，merge `84c07bbd...`，run `38886594068`，6/6 相关 CI、12/12 PASS、0 skip、marker `PA05_ACTUAL_OBJECT_SQL_HOST_MTLS_PG`，`physicalClusters:3`、`postgresql18ActualHostsslHbaVerifiedCARequired:true`、`sqlHostPasswordWithoutClientCertificateDenied:true`、`wrongCaValidClientCertificateWithHostPasswordDenied:true`、`physicalMachineIdentityCertified:false`、`productionWriteEnabled:false`。** [Branch Hygiene run #38886854990](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38886854990) 有 `DELETED_VERIFIED_MERGED_AGENT_BRANCH ... @735b75e8...`。
- D14C12 初始 CI 的证书 DN 格式错误发生在旧 HEAD，修正后重新成功；**错误测试不是认证失效**。如要查逐行错误，见 [#972 Checks](https://github.com/jiangxng/EVO-App-Platform/pull/972/checks) 的初次失败和随后成功记录。
- **没有需要在本包传递的用户截图或 PDF 附件**；此前对安全开发的原始视图均是 GitHub 文件/PR/Actions。D14C12 测试签发的 CA 私钥、Host 私钥、bad-client 私钥**故意只在 Actions runner 临时目录**，不保存到 GitHub、不提供可下载副本；其不能被作为后续证明长期持有同一私钥的材料。
- 本次网页外链是官方长期入口，并非保存了整份外站网页离线快照。即使今后网址内容变动，本索引仍有访问日期、章节、关键事实和具体代码/CI 对应，可沿用最少查阅成本重新定点核对。
- 不能凭 repo / Actions 数据推断已经测试过实际生产 Railway app、证书签发服务、宿主 Kubernetes/云 IAM、Provider 人工验收，也没有这些文件的截图/录屏位置；**UNKNOWN / NOT_SIGNED**。

## 7. 新窗口恢复顺序（保留可继承的原始研究，不从零开始）

按 [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) 读取仓库入口与 `project.status.json` 指向的主线 handoff，**不要修改全局结构化状态**；再看[简短入口](PA05-D14C5-D14C12-RESEARCH-HANDOFF-ENTRY-20261016.md) → 本索引 → [PA05 基线 §35–42](PA05-CERTIFICATION-BASELINE-20261015.md) → [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) → 各 C5–C12 单项原始决策报告 → 当前 main 及 Action PR 变更。优先制定未签安全门禁的**可执行验收条件**再在最新 main 开新短分支；不要恢复已删除 D14C5–C12 分支或重复调查旧的 CI bug。下一窗口第一项务必再次核对 PR、branch、main，并以最终交接 PR 的 merge SHA 覆盖本文历史归档基线。
