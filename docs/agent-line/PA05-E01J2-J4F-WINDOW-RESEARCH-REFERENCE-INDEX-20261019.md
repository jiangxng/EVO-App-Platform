# PA-05｜E01J2–E01J4F 本窗口详细参考资料与决策索引（2026-10-19）

**文档类别：HISTORICAL_SNAPSHOT / RESEARCH_REFERENCE_DECISION_LEDGER。**  
**简短交接入口：** [PA05-E01J2-J4F-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md](PA05-E01J2-J4F-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md)。  
**认证总账：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §§54–61；[Agent 当前入口](HANDOFF.md)。  
**原项目：** https://github.com/jiangxng/EVO-App-Platform 。本次交接从已核验 `main@c2bfc43c6bf0ec2d11ce6697fd83294686190c4d` 建分支。**绝不能把它当作下一聊天的永久最新 main**。

## 0. 证据分级与访问纪律

| 证据级别 | 在本索引中的严格含义 |
| --- | --- |
| **GITHUB-ORIGINAL-THIS-WINDOW（原文）** | **2026-10-19** 本窗口通过 GitHub 连接直接读取的源码、项目文档、PR API 或 GitHub Actions 原始 job log；表内说明读取范围。读取文件片段不等于完成全仓审计。 |
| **GITHUB-PR-VERIFIED（原始状态）** | **2026-10-19** 直接重新请求 PR 的 `merged=true` 和精确 HEAD/merge SHA；这不是重新执行旧测试。 |
| **CI-RAW-INSPECTED（原始日志）** | 在本窗口真实查看 Actions job 日志/marker 与 Node 测试合计，部分为本窗口工程期间读取；所列 URL 是精确的 Actions run。 |
| **HISTORIC-ORIGINAL-INHERITED（历史已读原文）** | 2026-10-16 历史交接详细索引记录**当时**读过 PostgreSQL 官网指定章节；本窗口 **2026-10-19 没有重新打开官网**。原始 URL/旧阅读等级保留，不能升级为本窗口亲读。 |
| **HISTORIC-DOC-CLAIM（二级转引）** | 老工程决策文档提到的技术结论/来源；本窗口仅阅读其 GitHub 文档文本，**未直接访问外部原始出处**。 |
| **SEARCH-SNIPPET-ONLY** | 仅看搜索摘要未打开文章；本窗口**新增正式引用 0 条**。 |
| **NOT-VERIFIED / TO-VERIFY** | 未读取、未在真实生产运行或仅有工程推断；**不得填为 PASS**。 |
| **ENGINEERING-JUDGMENT** | 基于源码、CI、故障注入所作的工程分析与方案选择；不等于 PostgreSQL 官网对 EVO 生产一致性的担保。 |

所有数据查阅时间均为 **2026-10-19**，除非行内明确列为 **2026-10-16 历史旧索引**。本窗口没有使用浏览器 `web` 重搜 PostgreSQL 官方资料，没有访问 Railway 生产数据库、未取得生产身份/密钥，也没有形成截图。**不能为来源补造“已读网页”或虚构截图路径。**

## 1. 本窗口直接读取的 GitHub 项目原文：网址、用途与位置

以下均为 **GITHUB-ORIGINAL-THIS-WINDOW / 2026-10-19**，链接固定在编纂时已核验 main 快照 `c2bfc43c...`（而非易变的 `main` 标签）。部分源码最初在各阶段工程中通过 GitHub 连接阅读，本次编纂又直接重看了相应最新文件/决策。**固定 SHA 只证明文件版本，不代表生产部署版本。**

| 编号 / 标题与原始网址 | 实际查阅范围和来源事实 | 业务模块的具体用途 |
| --- | --- | --- |
| GH01 [AI Project Bootstrap — AI-BOOTSTRAP.md](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/AI-BOOTSTRAP.md) | 必须依次核对 `project.status.json`、handoff、LLM、foundation map；历史聊天不能取代仓库权威 | 新窗口入口及进度防漂移 |
| GH02 [Current Project Status — project.status.json](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/project.status.json)、[Generated Handoff — HANDOFF-LATEST](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/docs/roadmap/HANDOFF-LATEST.md) | 全局项目主线仍是 TR-01 快照；自动生成 handoff 不应手工改；不是 PA-05/W06 的签收凭证 | 本线不得覆盖全局 owner 的 CURRENT_STATUS |
| GH03 [LLM Context Contract — LLM.md](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/LLM.md)、[llm.foundation-map.json](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/llm.foundation-map.json) | 共享 Host、Provider、Agent 语义分层与权威文档链接 | 新窗口只按现有契约续接，不移权给业务/Experience |
| GH04 [Development Delivery Workflow v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | 一个活动闭环 PR、准确 HEAD CI、正常合并、安全删临时分支；合并不等于投产 | J2–F 交付方式与下一次分支处理 |
| GH05 [Documentation Lifecycle Governance](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md)、[Extension Boundary Constitution](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) | 当前权威允许演化、已接受的 Decision Record 保历史；Host 只保留最小平台安全/生命周期机制 | 此次独立短入口 + 详细证据索引，不改大范围权威 |
| GH06 [manager/server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/manager/server.ts) | **直接查看** `APP_PLATFORM_STATE_FILE` 后 E01I 恢复状态检查；安装/活跃 Purchase Attention 则启动前抛错；E01J4D 已有实际 HTTP/Action 生命周期分流 | **J4F 不能依赖一个尚未启动 Host 的 HTTP“恢复按钮”** |
| GH07 [manager/service.ts](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/manager/service.ts)、[manager/store.ts](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/manager/store.ts) | 原 AppManager `planDisable/planUninstall/disable/uninstall/getSnapshot`；单一 JSON 文件临时写后 rename，没有和中央 PostgreSQL 的共享提交事务 | J4A/B/C/F 用真实文件状态，保留 SQL+JSON 双存储非 ACID 边界 |
| GH08 [Authenticated SQL READ Host](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/manager/pa05-read-owner-authenticated-host.ts)、[J2 physical PG tests](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/tests/agent-line/pa05-e01j2-authenticated-read-handler-pg.test.mjs) | 原 Handler + DB session login role/epoch/transaction 拒绝逻辑；J4 系列累加 fork/故障/恢复断言 | J2–J4 的保留测试基线 |
| GH09 [J4C Host Lifecycle Composition](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/manager/pa05-read-owner-host-lifecycle.ts)、[J4E SQL Authority](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/manager/pa05-read-owner-lifecycle-pg.ts) | 默认不启用、Host 注入受信任操作员授权、SQL-first FENCE/ASSERT/COMPLETE；J4E 将直接 DML 收缩至 DBA-owned 函数；J4F 增加受限 `pending()` | 新阶段必须**复用现有 Host 组合器，不另造授权栈** |
| GH10 [J4F Prestartup Repair](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/manager/pa05-read-owner-prestartup-recovery.ts)、[J4F test](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/tests/agent-line/pa05-e01j4f-prestartup-recovery-pg.test.mjs)、[J4F SQL fixture](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/tests/agent-line/fixtures/pa05-e01j4f-pending-recovery.sql)、[test-only OS worker](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/tests/agent-line/fixtures/pa05-e01j4f-repair-worker.mjs) | 只允许已认证 Host 的 **单条 FENCED UNINSTALL**；测试 SIGKILL 于本地卸载后、SQL COMPLETE 前，另一进程接续，不恢复 READ 权限；fixture 的 env 授权谓词**非真实 Human 身份** | J4F 已合并的隔离能力，下一步生产维护/身份门禁要单独取证 |
| GH11 [PA05 Cross-database Admission workflow](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/.github/workflows/agent-pa05-cross-database-admission.yml) | 实际三 PostgreSQL18、Node 测试计数从 17 至 24，强制 marker 与 `0 skipped`；不能只看 PR 绿色角标 | 保证继承旧安全负面断言，新阶段不能删测例降门槛 |
| GH12 [PA05 Certification Baseline §§54–61](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md)、[Agent HANDOFF](https://github.com/jiangxng/EVO-App-Platform/blob/c2bfc43c6bf0ec2d11ce6697fd83294686190c4d/docs/agent-line/HANDOFF.md) | 按子里程碑保留实际 PR/CI/签收边界；旧文档的初始 CANDIDATE 段不抵消后加的最终 MERGED 证据 | 下一个聊天应先读 **§61 最终证据**，不可重置已完成阶段 |

**不扩大原文阅读声明：** 某些 2026-10-19 阶段源文件是在工程时查阅并直接使用；本次编纂额外读取了交接/基线与 J2/J3/J4A/B/C/D/F 决策等文件。固定路径供查验，未对所有源码每一行逐段做安全审计。

## 2. 本窗口工程原始网络证据（GitHub PR 和 Actions）

下表各 **PR 的合并状态与两个 SHA 在 2026-10-19 再次向 GitHub API 原始查询**，为 **GITHUB-PR-VERIFIED**。各组 **CI-RAW-INSPECTED** 发生在本窗口工程期：读的是具体 Actions job log 中真实 Node 测试计数、强制安全 marker 和 0 skips；最新一行非纯文档复述。URL 是原始 GitHub 链接，CI 可能清理旧 artifacts。**每一行“PASS”仅属于隔离工程本项。**

| 阶段 / 源码模块 | 工程 PR、准确最终 HEAD / merge SHA | 真实三 PG18 Actions、原始 job 及关键发现 |
| --- | --- | --- |
| **E01J2** SQL 身份 + 原业务 Handler | [#1024](https://github.com/jiangxng/EVO-App-Platform/pull/1024) · HEAD `402c3d819228b1d4eb97301ab441e510428c726e` → merge `3d8320069ab3f424f4a2e47a2d2841df5c429c85` | [#39203051005](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39203051005) · job `117899918670` · **17/17，0 skip**；两个 Host SQL LOGIN、受限 Worker、撤权旧连接、AppManager/ActionRouter 原 Handler 调用；[J2 决策](PA05-E01J2-AUTHENTICATED-SQL-HOST-READ-20261019.md) |
| **E01J3** 中途真 TCP 断链 | [#1026](https://github.com/jiangxng/EVO-App-Platform/pull/1026) · HEAD `3ef47fb7a5921e2f733b041f5ee8607bb6800c68` → merge `3be90217f26d79ccdd75f0320a02cd86eb6b5f2b` | [#39205257968](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39205257968) · job `117906593788` · **18/18，0 skip**；真实 TCP 断链 READ 不泄漏返回值；**原进程优雅恢复未签收**；[J3 决策](PA05-E01J3-INFLIGHT-TCP-READ-20261019.md) |
| **E01J4A** 持久化多 Worker 逐 Host 认证 | [#1029](https://github.com/jiangxng/EVO-App-Platform/pull/1029) · HEAD `33e307f6c5759f966abe9ded8c0a22dc7829e16d` → merge `9ea731442bfbe28ab339965f77e137561bf3b6ee` | [#39208798334](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39208798334) · job `117917364937` · **19/19，0 skip**；两个独立真实 Worker 文件、中央 reattest 不自动批准另一个 Host；[J4A 决策](PA05-E01J4-PERSISTED-MULTIWORKER-REATTEST-20261019.md) |
| **E01J4B** SQL 先撤权 + 三崩溃修复 | [#1031](https://github.com/jiangxng/EVO-App-Platform/pull/1031) · HEAD `4f4eb76d925cf26afa15b832e0c4e84644995419` → merge `c5bb189f159b60241375a570ada6733ceb3ce3db` | [#39211031284](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39211031284) · job `117924220259` · **20/20，0 skip**；DB 意图+授权撤销同事务，本地 ACTIVE/DISABLE/UNINSTALL 分别崩溃，重复修复幂等；[J4B 决策](PA05-E01J4B-CRASH-LIFECYCLE-REPAIR-20261019.md) |
| **E01J4C** Host-only 内部组合适配器 | [#1036](https://github.com/jiangxng/EVO-App-Platform/pull/1036) · HEAD `a37b9ffe0ae5a97674f872f31b9b0a297b49109f` → merge `ea9d2b388a0e27736914afd21a44c2efad845a15` | [#39212988430](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39212988430) · job `117930340130` · **21/21，0 skip**；操作员拒绝、中心离线、本地重载、错误 DISABLE intent 不允许 UNINSTALL；[J4C 决策](PA05-E01J4C-HOST-LIFECYCLE-COMPOSITION-20261019.md) |
| **E01J4D** 实际 Host HTTP/Action 停用卸载 | [#1040](https://github.com/jiangxng/EVO-App-Platform/pull/1040) · HEAD `7d23a27d83049a079d7a3e8da7dcd4788a89fcc0` → merge `bbd89483ac5c5edec463b8e2bb8d266624574b40` | [#39216506019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39216506019) · **22/22，0 skip**，当时 **44/44 affected workflows SUCCESS**；修复重复 Action 路径漏接；[J4D 决策](PA05-E01J4D-ACTUAL-HOST-ROUTE-20261019.md) |
| **E01J4E** 仅执行 DBA 安全函数 | [#1042](https://github.com/jiangxng/EVO-App-Platform/pull/1042) · HEAD `40338a336a53e208fac88673305f5752541887c9` → merge `cae43693a3b78e9dd22110e7763f79f66daeeaee` | [#39219535656](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39219535656) · job `117951339225` · **23/23，0 skip**；Host 无中央表 SELECT/DML，Worker 不能 EXECUTE，假 Host/GUC 拒绝；[J4E 决策](PA05-E01J4E-LEAST-PRIVILEGED-SQL-OPERATOR-20261019.md) |
| **E01J4F** E01I 真实拒绝→受控启动前修复 | [#1044](https://github.com/jiangxng/EVO-App-Platform/pull/1044) · HEAD `fec8216bbdad119736b99697b338bffbac173447` → merge `9264e215496ab088b45a363453fe63bc9a5aae58`；[归档 #1045](https://github.com/jiangxng/EVO-App-Platform/pull/1045) → `ec465d402c566513e15239077037f804cda7c8bd` | [#39225474209](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39225474209) · job `117970578273` · **24/24，0 skip**；真 SIGKILL 后独立恢复进程完成 SQL，原 E01I 宿主启动恢复，中央 READ approved_epoch 仍 0；[J4F 决策](PA05-E01J4F-PRESTART-RECOVERY-20261019.md) |

**安全标记精确索引：** `PA05_E01J4_PERSISTED_MULTIWORKER_REATTEST_PG`、`PA05_E01J4B_CRASH_RECOVER_LIFECYCLE_PG`、`PA05_E01J4C_HOST_COMPOSED_LIFECYCLE_PG`、`PA05_E01J4D_ACTUAL_HTTP_LIFECYCLE_PG`、`PA05_E01J4E_LEAST_PRIVILEGE_FUNCTION_PG`、`PA05_E01J4F_PRESTART_RECOVERY_PG`。最终 J4F marker 的 `actualProductionOperatorIdentityCertified:false`、`productionRepairCommandWired:false`、`productionSecretsProvisioned:false`、`multiWorkerAtomicityCertified:false`、`pa05Signed:false` 是**刻意保留的否定证据**，不能用总体 PASS 覆盖。

## 3. 初始失败、冲突和方案纠正：保留负证据

这些是本窗口查阅 **CI 原日志和修正**，不是单纯搜索摘要；逐条实际修复已进原工程 PR，保留原始 URL 以避免新窗口重新研究或把失败当作未解决漏洞。

| 阶段 / 原始 Actions URL | 真实失败、与来源事实的界限 | 处理与仍存边界 |
| --- | --- | --- |
| J2 [原始工程日志与决策](PA05-E01J2-AUTHENTICATED-SQL-HOST-READ-20261019.md) | 最终合并前因别的窗口推进 main，原分支落后造成分支保护不允许合并（不是业务 SQL 失败） | 同 PR 合并最新 main，精确最终 HEAD 全绿后才合并；未覆盖 BEX |
| J3 [#39204498694](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39204498694) | 真 TCP 断链引发 Node 24 / `postgres.js` `TypeError: Cannot read properties of null (reading 'write')`，`node_modules/postgres/src/connection.js:255`；**原进程可能崩溃** | 证明重启后新 Worker FAIL CLOSED + 明确复认证；**原进程存活/优雅重试、长时间黑洞未认证**，此驱动风险为 P0 待解决 |
| J4A [#39207937779](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39207937779)、[#39208207883](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39208207883) | 首次测试 JS SQL 模板嵌套错误，其次丢失夹具 import 并由 SIGKILL 清理掩盖；真实首次全过 [#39208481146](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39208481146) | 原 PR 修复，不删权限拒绝或旧断言；**本地 JSON + SQL 仍不能共享 ACID** |
| J4B [#39210347370](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39210347370) | 错把 J4B 子测试注册到外层 Node test Context，使 J4A 等待尚未启动的子测试而超时；非越权读取证据 | 改为父 J4A 上 `j4.test`，原 PG18 [#39210593533](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39210593533) 完整 20/20 |
| J4D [#39214960038](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39214960038) | WRITE 回归查出**另一条重复 Action 路由未接中央撤权**，比测试夹具缺陷更重要 | 修复全部六个真实 HTTP/Action 分流点；不得将首轮 J4D 22/22 单独签收 |
| J4D [#39215712380](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39215712380)、[#39216026802](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39216026802) | J2 历史 fork IPC deadline 在并发 PG 运行下先后超时；延长 20→35 秒依然失败，`22/22` 未达标 | 恢复 20 秒标准，改测试文件 **`node --test --test-concurrency=1`**，再跑完整 PG18 [#39216506019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39216506019)。并发竞争是排查假说，不当成已证根因 |
| J4F [#39224632491](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39224632491) | PostgreSQL test-only `REVOKE FUNCTION` 的 schema 标识符漏闭合引号：**23 pass / 1 fail / 0 skipped**；还没进入恢复核心场景 | 原 PR #1044 修复后 [#39224931853](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39224931853) 24/24；最终 [#39225474209](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39225474209) 仍 24/24 |

**实际冲突 A — SQL 安全 vs 本地生命周期：** PostgreSQL 的行锁/事务能阻止授权过早撤销，却不能把 AppManager 的本地 JSON 文件写入统一回滚。**采用：** 先 SQL FENCE、再本地 DISABLE/UNINSTALL、持久化意图、外部可恢复；**不采用：** 伪称全局事务或停机后读取本地 ACTIVE 即自动放行。

**实际冲突 B — 启动隔离 vs 崩溃恢复：** 原 E01I 在 HTTP listen 之前抛错；企图通过现成 HTTP Handler 修复根本无法到达。**采用：** 不改变 E01I，默认不启用的可信维护进程在进 Host 前验证单一 FENCED UNINSTALL、修复后由原 Host 正常启动；**不采用：** 禁用 E01I、自动清空 JSON、增加未经授权的公共恢复 API。

**实际冲突 C — operator 身份 vs 便利性：** 给 Host SQL LOGIN 表级 UPDATE 会允许绕开 Host 操作 ID；测试进程用 env flag 代表操作员则不是生产身份。**采用：** DBA-owned `SECURITY DEFINER`、`session_user`、固定 Host/type/operation、仅 EXECUTE，生产 Human/Provider/凭据仍 NOT_SIGNED。**不采用：** 信任客户端自报 GUC/Host ID、把测试 env 开关变成生产安全凭据。

**实际冲突 D — CI 绿 vs 环境真实签收：** fork/PG18 证明定界行为；但未接生产 DBA 配置、企业数据、模型/Provider/浏览器及 Railway。**结论：** 每个 J2–F 是 ENGINEERING_BOUNDED_PASS，PA05-05 E01–E05 和 W06 仍未签收。

以上“采用/排除”是 **ENGINEERING-JUDGMENT**，除源码/CI 明确可证部分外，不能引用为官网保证。

## 4. 历史网络原始来源 URL：严格保留旧阅读日期和等级

**HISTORIC-ORIGINAL-INHERITED，不属于本窗口实际外网新阅读。** 下列 URL/章节、2026-10-16 已访问状态来自既有 [D14C5–D14C12 原始索引](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md) 和 [E01J 历史资料索引 §1](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md#1-已有-postgresql-官方网络资料原始-url章节作用)。**2026-10-19 本窗口仅通过 GitHub 阅读前述索引，没再次打开这些官网页面**。

| 官方来源名称 / 原始 URL | 旧访问日期与确切主题 | 与本轮实现对应的用途（工程推导） |
| --- | --- | --- |
| [PostgreSQL 18 — 5.8 Privileges](https://www.postgresql.org/docs/18/ddl-priv.html) | 2026-10-16，§5.8 表/Schema/函数权限、PUBLIC | J2 Host/Worker 最小权限，J4E/J4F 仅 EXECUTE |
| [PostgreSQL 18 — REVOKE](https://www.postgresql.org/docs/18/sql-revoke.html) | 2026-10-16，撤权语义/角色继承 | J4E 显式拒绝 PUBLIC 函数 EXECUTE |
| [PostgreSQL 18 — System Information Functions](https://www.postgresql.org/docs/18/functions-info.html) | 2026-10-16，§9.27 服务器身份 | J2/J4E `session_user` 而非自报 Host |
| [PostgreSQL 18 — CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) | 2026-10-16，SECURITY DEFINER / search_path | J4E/J4F DBA-owned 函数安全边界 |
| [PostgreSQL 18 — 13.4 Data Consistency Checks at Application Level](https://www.postgresql.org/docs/18/applevel-consistency.html) | 2026-10-16，§13.4 行锁/应用层事务一致性 | J1/J3/J4 SQL revoke 与 READ 锁竞争 |
| [PostgreSQL 18 — SELECT](https://www.postgresql.org/docs/18/sql-select.html) | 2026-10-16，`FOR SHARE` / `FOR UPDATE` | J1–J4 撤权先于下一 READ |
| [PostgreSQL 18 — 67.1 Transactions and Identifiers](https://www.postgresql.org/docs/18/transaction-id.html) | 2026-10-16，§67.1 事务身份与永久 Host 身份不同 | J2 epoch/Host 持久身份不可用 txid 冒充 |
| [PostgreSQL 18 — Cumulative Statistics System](https://www.postgresql.org/docs/18/monitoring-stats.html) | 2026-10-16，§27.2 backend_start/pg_stat_ssl | 旧连接和证书后端识别，J3 断链威胁模型 |
| [PostgreSQL 18 — ALTER ROLE](https://www.postgresql.org/docs/18/sql-alterrole.html) | 2026-10-16，角色密码变更 | 改密码不意味着旧合法 backend 已撤权 |
| [PostgreSQL 18 — 20.1 pg_hba.conf](https://www.postgresql.org/docs/18/auth-pg-hba-conf.html) | 2026-10-16，hostssl/clientcert/匹配规则 | 真实 SQL Host mTLS 生产核验前置 |
| [PostgreSQL 18 — 18.9 Secure TCP/IP Connections with SSL](https://www.postgresql.org/docs/18/ssl-tcp.html) | 2026-10-16，证书/CA/CRL | J3/J4 生产身份与吊销尚需独立证明 |
| [PostgreSQL 18 — 20.12 Certificate Authentication](https://www.postgresql.org/docs/18/auth-cert.html) | 2026-10-16，证书认证/角色映射 | Host 工作负载身份，不能等价实际 TPM |
| [PostgreSQL 18 — 32.19 SSL Support](https://www.postgresql.org/docs/18/libpq-ssl.html) | 2026-10-16，libpq TLS verify-full 等 | 技术边界参照；**不直接照搬到 postgres.js 配置** |

**HISTORIC-DOC-CLAIM / 非新读：** [PostgreSQL 18 — Connection Settings](https://www.postgresql.org/docs/18/runtime-config-connection.html) 在 [历史 D14C13 决策](PA05-D14C13-HOST-TLS-CERTIFICATE-REVOCATION-20261016.md) 中被引用，旧索引说明本轮未独立验证。不能补写 2026-10-19 官网查阅日期。本窗口新增“仅看搜索摘要”的正式资料 **0 条**。

## 5. 访问后可能变化或遗失的信息：原始位置和摘要保全

1. **GitHub Actions 原始日志会变化/过期：** 上述 run URL 是精确网络位置；最重要的 job ID：J2 `117899918670`、J3 `117906593788`、J4A `117917364937`、J4B `117924220259`、J4C `117930340130`、J4E `117951339225`、J4F `117970578273`；J4D 以 [其决策“Final”与 Action #39216506019](PA05-E01J4D-ACTUAL-HOST-ROUTE-20261019.md) 为准。marker/安全否定项和计数已在这里与总账固定。**没有人为编造可下载的旧 Actions artifact、截图或附件路径。**
2. **关键源码结构锚点：** `manager/server.ts` 搜 `PA05_E01I_RESTORED_READ_OWNER_RECERTIFICATION_REQUIRED` 和 `APP_PLATFORM_STATE_FILE`；`manager/pa05-read-owner-host-lifecycle.ts` 搜 `execute(..., recovery)`、`assertFenced`；`manager/pa05-read-owner-lifecycle-pg.ts` 搜 `pa05_read_lifecycle_operator_transition`、`pa05_read_lifecycle_operator_pending`；`manager/pa05-read-owner-prestartup-recovery.ts` 搜 `recoverPa05ReadOwnerPrestartupUninstallV010`；`tests/agent-line/pa05-e01j4f-prestartup-recovery-pg.test.mjs` 搜 `PA05_E01J4F_PRESTART_RECOVERY_PG`。以上均为可定位章节/代码片段，不是截图。
3. **生产行为和测试隔离差别：** 真实 Host 测试在单独 OS 进程/临时文件/一次性 PG schema 和测试 SQL LOGIN 中进行；测试 Worker 环境开关是模拟角色。主线 Railway 环境、真实企业数据、运营人员签收记录、部署 secret/PKI、Provider/model/browser、全 Worker cluster 观察均**没有本窗口访问证据**。相关字段必须保留 false/NOT_SIGNED。
4. **负面故障不应被最终绿色吞掉：** J3 `postgres.js` in-process driver crash、J4D 多 Action 分支遗漏、J4F SQL quote 错误均有上方精确原始 CI 链接与决策文档；使用 final green 时应同时陈述已修问题与未解 P0。

## 6. 未决问题、方案限制、最值得继续查阅的方向

| 优先级 / 未决项 | 已确认来源事实 | 继续查阅的具体方向和接受条件 |
| --- | --- | --- |
| **P0：生产可信操作员和凭据托管** | J4E/F 是 SQL `session_user` + DBA test-only 安全函数、OS fixture 环境谓词，不是 Human/Provider 身份或生产 SQL 发证 | 复查现有 E01D/E01F 身份/Provider/Host secret 契约与 `manager/server.ts`；核实 DBA 真实角色/函数部署机制、身份吊销/审计、容器/秘钥管理。先做最小、默认 OFF、可独立回归方案；未获授权不得生产制证/投产 |
| **P0：`postgres.js 3.4.9` 断链崩溃** | J3 原始 Node 进程曾因 TCP 错误抛 `null.write`，最终证明“新 Worker 恢复”，不证明旧进程优雅恢复 | 定向核对正在使用的锁定依赖及驱动已知问题/适配隔离，复用 J3 真实 TCP fault fixture；不能把 `pg_terminate_backend` 当成真网络分区 |
| **P0：SQL+JSON 跨 Worker 完整一致性** | PostgreSQL 审批事务不自动包含原 AppManager 本地 JSON；J4F 只覆盖单 Host FENCED UNINSTALL 补偿 | 聚焦 Host inventory、持久操作状态及恢复策略的权威归属；区分可补偿授权安全与业务外部副作用。跨 Worker 真独立进程/真实 PG18 复核，不声称分布式 ACID |
| **P1：可正式操作/审计的启动前修复** | E01I 阻止 Host 带历史 Purchase Attention 文件启动；J4F 只有默认不装配的内核函数+test-only OS fixture | 明确谁运行、如何认证和记录 Human/DBA 允许、怎样绑定本地文件/Host ID、如何锁并行维护、如何在无中央连接时拒绝；生产 CLI/Runbook 仍待批准 |
| **P1：真实企业/人机/Provider/浏览器验收** | PA05-05 E01–E05 和 W06 一直 NOT_SIGNED | 每个已有原验收 gate 单独检查，不因 24/24 自动签收，不扩大 J4F 的工程需求 |

**不建议重复查阅方向：** 已验证的 J2 SQL Host、J3 断链、J4A–F 夹具、E01D/E01I 原设计、旧 PostgreSQL 官方 §§5.8/13.4 文档。只在安全契约发生变化或代码/CI 异常时定点复核，继承旧参考遗产。

## 7. 保存、映射与移交

- **项目模块：** `manager/server.ts`（E01D/E01I/J4D 现有 Host）、`manager/service.ts`/`manager/store.ts`（原生命周期）、`manager/pa05-read-owner-authenticated-host.ts`（J2）、`manager/pa05-read-owner-host-lifecycle.ts`（J4C）、`manager/pa05-read-owner-lifecycle-pg.ts`（J4E/F）、`manager/pa05-read-owner-prestartup-recovery.ts`（J4F），以及对应 `tests/agent-line/` 和 `.github/workflows/agent-pa05-cross-database-admission.yml`。
- **已有权威/决策：** `docs/agent-line/HANDOFF.md`、`PA05-CERTIFICATION-BASELINE-20261015.md` §§54–61、逐阶段 `PA05-E01J2-... / J3-... / J4A–F-...` 决策；全球主线 `project.status.json` + `docs/roadmap/HANDOFF-LATEST.md` 只读。
- **本窗口交付：** 本详细研究索引 + [短入口](PA05-E01J2-J4F-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md)，均放在 `docs/agent-line/`。创建于独立分支 `docs/pa05-e01j2-j4f-window-research-handoff-20261019`，基于 `c2bfc43c6bf0ec2d11ce6697fd83294686190c4d`。最终工程文档 PR、merge SHA、源分支删除在真实合并后另核实，**不预填**。
- **新窗口第一动作：** 重新核当前 main/PR/CI，按 `AI-BOOTSTRAP` 启动顺序，再读短入口→本索引→认证总账 §61；核对最新是否已有 E01J4 可信操作员/正式修复工作，避免跟其他窗口冲突；选择一个既定 OPEN 缺口继续独立短 PR。
