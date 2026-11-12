> **最新交接入口（Window 08 / 自动续跑 #07/07）已迁移至 [CV04-WINDOW08-20261112-FINAL-POSTMERGE-HANDOFF-ENTRY.md](CV04-WINDOW08-20261112-FINAL-POSTMERGE-HANDOFF-ENTRY.md)。以下「Window 07 最新入口」为当时历史快照，不再代表当前 `main` 或东京运行镜像；最终证据应优先使用新入口和原研究索引 §22。**

# CV-04 / Window 07 Final — 2026-11-12 主线交接（最新入口）

> **2026-11-12 北京/香港时间，自动续跑 #07/07。** 本节是已核验的**最新入口**；下方「历史快照」保留 #1277 时点原文供回溯，其中过时 SHA、#1276 尚存分支、尚未实现 Worker CAS/调度等描述均被本节取代。详细原始研究索引见 [CV04 #05–#07 研究与决策索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md) §9–15。**接续必须先重新拉取/核对 `main`，不要固定使用本次合并 SHA。**

## 1. 最新验证与不变的安全边界

- 仓库：[jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)，唯一主线 `main`。本次开始的受保护基线 **`6245f549dd1b97a4989499f8241f5702409a2047`**，是 [#1287](https://github.com/jiangxng/EVO-App-Platform/pull/1287) 的真实合并提交；本轮交接文档 PR 会产生新的 main SHA，届时应另以 GitHub ref 和最终 CI 核验。基线 checks **5 SUCCESS + 2 正常 SKIPPED**（main-only 的 `source-syntax` 和 docs-only 的 `deploy`）。[东京 preflight/deploy #43212673155](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43212673155)：preflight SUCCESS，`EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE`，**没有新 Runtime 镜像发布**。
- **真实运行东京镜像**仍报告 `81262c348b2abf0440ddc0501495aa9c572f2e23`（#1284 实际部署版本），不能错写成 #1287 workflow 的源码 SHA。[两次独立原库/Host 只读实测](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43212637430)：受保护 main 的真实运行 Catalog 没列出已知持久 `dictionary.collection.export.job.request/worker/download`，有效授权候选仍为静态 `host.static-authorization`、相关 binding 数 0；Saved View 未启用；原 `evo_dev` PG 非 `cv03*` QA Schema 里的 `cv04_export_%` 函数/表均 **0/0**；实际登录 `evo` 是 superuser，**不能作为生产最小权限 Producer**。此证据仅覆盖特定命名范围和读取时刻，**不证明**未知命名功能或动态 Provider `check()`。
- **正式跨页持久 EXPORT 仍 OFF／未注册**；隔离 `NODE_ENV=test + isolatedTestOnly` 的 Owner/PG Store/Host-Worker Lease/Signed SQL/Dispatcher/Poll **不是生产可用动作**。现有字典/客户/供应商 **当前页**浏览器 CSV 导出属于已上线的另一条能力，不能与正式后台全量 EXPORT 混同。
- CV03：`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`；正式 SAVE POST 403 和未注册 GET 404 的历史边界不变。Owner [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) **OPEN / PENDING OWNER SIGNOFF**，即使五个 checkbox 全勾也**非具名审批**。并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) **OPEN**；禁止擅改其管理的文件。不得凭自动续跑、CI GREEN、已合入 docs 或手工 test HMAC 打开任何生产功能。

## 2. 本系列已合并成果 — 按原实现复用，不从头重写

| 阶段 / PR / 合并 main SHA | 实际工程与已验范围 | 禁止上升的结论 |
| --- | --- | --- |
| #1272–#1278（见下方历史稿） | 独立 PG 审计/加密 Owner、可选 Host Capability、角色租约、到期逻辑清除以及历史交接。#1274 是并行窗口签名网关贡献。 | 非正式跨页 EXPORT；独立审计不是生产 WORM，逻辑清理不保证 WAL/备份物理消除 |
| [#1279](https://github.com/jiangxng/EVO-App-Platform/pull/1279) → `c0bf3bebd5e891ace27c914ba824319f91721ced` | NEXT-01：已有 Signed SQL Gateway 叠加 Principal-wide epoch fence；Operation/Principal 双围栏。 | 手工镜像不是 PA05 真实 source generation / outbox |
| [#1280](https://github.com/jiangxng/EVO-App-Platform/pull/1280) → `0233c390c0590816aa12861e37ec74364b2c1aa1` | 真实 Actions 经 blob 同一性和 PR 引用/SHA 核查，**安全清理 #1276 已吸收但冲突的旧分支**；本轮再次查询该旧分支**不存在**。 | 不需再尝试合并或删除旧 #1276 |
| [#1281](https://github.com/jiangxng/EVO-App-Platform/pull/1281) → `bfdc861a3d8829e5c9147d46601a408937918655` | NEXT-02：真实物理 Worker token+epoch 与原 HMAC Signed CAS、Revision 和授权 Epoch 同一 SQL 事务围栏，旧 token 失效。 | 未证实真正生产 Host workload identity/KMS |
| [#1282](https://github.com/jiangxng/EVO-App-Platform/pull/1282) → `42389e2dfe27b7ec959b3c6c57d8ee50b8d65647` | NEXT-03a：实际 Dictionary Domain Owner `request→RUNNING→READY`，Worker 受限只读 ciphertext、原加密 CAS、不可变 audit 顺序；[PG16 13/13](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43198584059)。 | 测试签名/密钥仍归一次性 fixture，未接真实生产 KMS |
| [#1283](https://github.com/jiangxng/EVO-App-Platform/pull/1283) → `e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0` | NEXT-04a：Host-only Runnable Metadata、原 PG permit/lease 的有界 `sweep()`，独立 Host SQL 会话与 Worker OS `SIGKILL`→Epoch 2 重领，旧签名 CAS 拒绝；[PG16 15/15](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43202040149)。 | 独立 SQL 会话不等于两台独立物理 Host |
| [#1284](https://github.com/jiangxng/EVO-App-Platform/pull/1284) → `81262c348b2abf0440ddc0501495aa9c572f2e23` | NEXT-04b：`createIsolatedDictionaryExportPgPollingV010` 显式 test-only 启动，单飞/退避/stop/drain/fail-stop；两个独立 Node **Host OS 进程** kill+restart 重新扫描、Epoch 2/旧签名拒绝；[PG16 18/18](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43205084273)，[东京实际部署与 TLS/Basic Auth](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43205607662)。 | 两进程仍在**同一 Runner**；没有生产 supervisor、双物理 Host 网络分区、真正签名容灾 |
| [#1285](https://github.com/jiangxng/EVO-App-Platform/pull/1285) → `ef705935332d5b13976ad8459e193e99a59df0c3` | NEXT-05a：复用 CV03 Owner Gate，新增正式 EXPORT 的**负向**源码/实时 GitHub Owner 关卡；先出现真实 **5/6 FAIL**（单个 SQL Lease guard 漏检），修复后最终 **6/6 PASS**，主线 [Owner Gate](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43209191737)、[PG16 18/18](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43209191962) SUCCESS。 | **GREEN = OFF/BLOCKED 完整性良好，绝不是 Owner 审批/启用许可** |
| [#1286](https://github.com/jiangxng/EVO-App-Platform/pull/1286) → `efbcaf8b7fc9228ff500fed729870736a0a04c67` | NEXT-05b：实际受保护 main 的东京 **仅 GET + PG READ ONLY** 检查，[原始 Job #131160514844](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43211654823/job/131160514844)，检查 live Catalog、Provider 候选、特定 SQL 对象。 | 不读业务数据、不改生产 DB、不冒充真实 Owner/Signer 核准 |
| [#1287](https://github.com/jiangxng/EVO-App-Platform/pull/1287) → `6245f549dd1b97a4989499f8241f5702409a2047` | NEXT-05b：补录实机原始证据/版本边界到设计与索引；[再次现场读取 #43212637430](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43212637430) SUCCESS；protected main 5 SUCCESS + 2 预期 SKIPPED；部署正确跳过；过程分支均已删除。 | 读到的当前 Runtime 仍为 #1284 镜像，不得报告 #1287 重新部署 |

## 3. 下一窗口可直接执行的顺序（无需普通工程逐步批准）

1. **核实即时主线**：先读本入口及[最终证据索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)，再核验 `main`、#1212、#1184、[正式生产权威 Owner 契约](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md) 与 [NEXT-05b 东京原始报告](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md)。不要重复写 Export Owner/Gateway/Lease/轮询器，也不要合并旧 #1276。
2. **只做真实可验证源头工作**：由 PA05 Lifecycle + AuthorizationProvider Owner 提供正式 PG **同一 ACID T0** 的业务成员/插件/主体/Actor/企业 Operation scope 和 `authorityEpoch/sourceGeneration` 归属，按 producer→outbox→snapshot/receipt 原子顺序验证 DENY/tombstone、撤权、换企业、plugin-disabled、Outbox 乱序/缺口/重放、失联 fail closed。**已有隔离 schema 不能迁入 production 充当权威**。
3. **实际运行身份/密钥**：由 PostgreSQL/DB Owner 确认生产 SQL schema 最小权限非超管 Host/Worker/Producer 的 GRANT 与迁移回滚；由 Security/Ops Owner 提供实际 signer/KMS custody、rotation/revoke、事故处理、WAL/PITR/留存；不能拿东京当前 `evo` superuser 或 CI key 冒充签名者。
4. **真正多物理 Host/产品验收**：在上述 Owner 决策和隔离最小接线 PR 评审后，再演练不同物理 Host 网络断开/主库故障、冷启动和自动恢复；复用现有 Dictionary Domain Owner 做 Human+Personal Agent 同资源异授权、跨企业和插件停用 fail closed、实际 390px/1280px 页面/下载时重新授权、保留原 CSV 审计与撤权阻断。
5. **产品发布单独准入**：仅待 *具名* PA05、Authorization、DB、Security/Ops、Domain Owner 在 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 或独立审议 PR 标注 reviewer/角色/日期/真实环境/来源 SHA 与回滚证据后，另开独立正式接线 PR。届时才讨论将 `dictionary.collection.export.job.*` 注册 Host/Catalog；**不得由这个交接窗口自己签署放行**。Owner 仍缺失时可继续准备只读评估和阻断负例，不得在生产做 SQL DDL/DML、KMS 建钥或开放持久 Export。

## 4. 文件地图与交接验证规则

- 唯一业务 Owner：`apps/business-dictionary/export-jobs.ts`；加密 PG CAS：`export-job-pg-store.ts`；独立 audit：`export-job-pg-audit.ts`；物理许可：`export-job-pg-sql-lease.ts`；主动 TTL：`export-job-pg-maintenance.ts`；sweep/poll：`export-job-pg-dispatch.ts`。
- 原 Signed SQL Generator：`tools/cv04-isolated-signed-export-gateway.mjs`；对应 PostgreSQL16 回归：`tests/agent-line/cv04-signed-export-gateway-pg.test.mjs`；真实 PG CI：`.github/workflows/cv04-signed-export-pg-gateway.yml`。
- 非准入发布完整性守卫：`tools/cv04-next05-production-authority-release-gate.mjs` + 对抗用例 + `.github/workflows/cv04-next05-owner-source-release-gate.yml`。东京只读物理：`.github/workflows/cv04-next05b-tokyo-export-readonly.yml`，报告 `CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md`。
- 全程不得直接 push main；用独立分支/Draft PR→最终 HEAD CI 全绿→Ready→Merge→受保护 main/东京/Branch Hygiene 验收，分清 `SUCCESS` 与 `SKIPPED`、源码 SHA 与部署 SHA。若无生产 Runtime 变更，东京 deploy **SKIPPED 是正确行为**。
- **证据等级**：A=直接读过本仓库原文；B=直接读取 GitHub 结构结果/Actions 原始 log；C=文中引用但本轮未独立确认/仍待外部独立认证。没有新增官方第三方网络资料、没有需要留存的截图，**不得补造访问过的源**。任何同一个文件中的早期“待执行/未完成”表述都只属于它当时的历史阶段，不能覆盖本节最新结果。

---

## 历史快照（截至 #1277，已被以上最新进展覆盖；只供追溯）

### 旧交接入口原文（PR #1278 时点）

> **交接时间：2026-11-12（香港/北京时间）。** 这是窗口退出用的简短入口；原始资料、GitHub 工作流/日志、方案取舍、失败历史与验证等级见 [详细研究与决策参考索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)。接续时 **先检查最新 `main`**，不要把本段记录的 SHA 当作不变的远端 HEAD。

## 一、状态和明确约束

- **仓库**：https://github.com/jiangxng/EVO-App-Platform；**准确基线分支：`main`**。截至本交接核验的受保护主线：`91356ae77df0a1af9f1993cdfc0909a1f3235f1e`（PR #1277 合并提交）；该 SHA 的 GitHub Checks **8/8 SUCCESS**，包括东京预览 `preflight/deploy`。东京实际部署日志确认 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=91356ae77df0a1af9f1993cdfc0909a1f3235f1e`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。这是**镜像/认证边界健康**，不是 EXPORT 产品验收。
- 用户明确要求：**持续实际开发**，不逐步请人审批普通工程 PR；维护独立分支、Draft PR、精确 HEAD CI 全绿后 Ready→合并受保护 `main`，再核对主线、东京及 Branch Hygiene；不要直接 push main；不覆盖其他窗口并行开发；交接资料/原始引用必须可复用；Human 与 Personal Agent 共用真实 Owner/权限/企业隔离；保持现有 Eidos+Platform，不另起列表框架。
- **安全结论**：独立跨页 EXPORT 功能虽然已拥有 Domain Owner / 加密 PG CAS / 审计 / 测试级 Host 权限描述符 / 签名 PG 隔离网关 / 物理角色 / 到期清理源码，**正式 `manager/server.ts`、`catalog/seed.ts` 仍未注册 EXPORT Job Operation**。没有生产上可用的全量导出；无法把隔离 PG 实验写成真实 PA05/T0 Host 签名准入或 Google/OIDC 人工验收。
- CV-03 **`N1=NOT_CERTIFIED`，`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`**，正式 SAVE POST 403 / 未注册 GET 404 继续保持；并行 **PR #1184 尚未合并**，不编辑其受管计划文件。

## 二、本窗口实际完成的工程与证据

| 交付 | 准确 PR / 受保护 main 合并 SHA | 已核验及限制 |
|---|---|---|
| 独立 PG 原子不可变审计、SQL 低权限角色拒绝（#05） | [#1272](https://github.com/jiangxng/EVO-App-Platform/pull/1272) → `72989d259054df293dbe9ee2678e20be20ad187a` | 真实 PG 审计 **5/5**，加密 PG **5/5**，原 Owner **8/8**；数据库 trigger 同事务追加元数据审计。DB owner 仍可绕过，非生产 WORM |
| Dictionary 独立 `dictionary.export` Host Capability 受控装载（#05） | [#1273](https://github.com/jiangxng/EVO-App-Platform/pull/1273) → `98c32b63d2912b3bef997288093c8fd45ef30e98` | 仅测试时装载 Manager/Capability Fabric/ActionRouter+真实 Domain Owner；Host 专项 **4/4**，Owner+预算 **15/15**；READ 不升权、Human/AI parity、撤权、停用、跨企业拒绝；**未登记正式产品 Operation** |
| 独立物理 Host/Worker SQL 身份、一次性 permit、租约 Epoch（#06） | [#1275](https://github.com/jiangxng/EVO-App-Platform/pull/1275) → `5a65e949b6c2a32d3f86a55635a15c070e2c6ab0` | PostgreSQL16 **4/4**，已有 PG **10/10**；不同低权限 LOGIN、重放/过期/争抢/撤权拒绝。**只围住调度许可，原 Owner CAS 尚未与该 Epoch 强绑定** |
| 并行窗口的独立签名 SQL Export gateway（在本窗口期间协调核验，非本窗口独占开发） | [#1274](https://github.com/jiangxng/EVO-App-Platform/pull/1274) → `9ca4182c23ab761e08462e3f349b73780697aee5` | 在可见主线读取了源码/测试/方案。隔离 HMAC、AUTH mirror epoch、nonce、SQL EXECUTE-only 运行角色、worker lease/TTL 状态约束。**该镜像不是生产 PA05/T0 权威**；不要重复开发另一套 signed gateway |
| Host-only 到期任务发现 + 主动逻辑 TTL 清理（#07） | 冲突旧 [#1276](https://github.com/jiangxng/EVO-App-Platform/pull/1276) **CLOSED/未合并** → 迁移新 [#1277](https://github.com/jiangxng/EVO-App-Platform/pull/1277) → `91356ae77df0a1af9f1993cdfc0909a1f3235f1e` | 新基线真实 PG **4/4**、旧 PG **14/14**、Owner **8/8**；到期 READY/QUEUED 经 Host SQL due() 范围查询、先 revoke 再加密 CAS 写 `EXPIRED`，CSV/pages 不再留在**当前逻辑记录**，独立审计恰一次。**无实际生产定时调度、无 WAL/备份安全擦除** |

### 合并后主线证据

- `main@91356ae77df0a1af9f1993cdfc0909a1f3235f1e` 的 GitHub check-runs 共 **8 项 SUCCESS**：[PR #1277](https://github.com/jiangxng/EVO-App-Platform/pull/1277)、[主线 PG TTL](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415445)、[主线 Host/Worker Lease](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415372)、[原 Eidos Chromium CSV](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415468)、[Lightweight Host](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415361)、[Continuity](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415464)；签名 PG 保持原单独协议，不能因这些 checks 推断真实正式 Host 上线。
- [东京预览](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177445714) `preflight`/ `deploy` SUCCESS（部署 job `131046056600`）；[Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177416954) 原始日志：`DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv04-export-pg-active-expiry-main-reconciled-20261112 @ 85fa44828495f9191bd833fd21a00d73e45634d8`。
- **尚未清理、不得误报**：关闭但未合并的 #1276 旧分支 `feat/cv04-export-pg-active-expiry-maintenance-20261112` 仍指向 `8ffd6efa3a327417d2d0a147cf78a93d5084c3c0`。本窗口没有对这个**非祖先/存在冲突**分支强行删除；需先做内容等价与不再被引用的 SHA-safe 核查。#1277 重建分支已自动删除。
- #1276 失败经验：TypeScript `found.revision` 可空静态报错；新 SQL due() 函数误用 `$…$` 而非 `$$…$$`；另窗口 #1274 改动相同 README 造成旧分支 `mergeable_state=dirty`。已重新从并行合并后的最新 main 移植，**不要再次合并旧 #1276**。

## 三、下一窗口优先任务

1. 先核验 `main` / PR #1274/#1275/#1277 状态、主线 8/8、东京部署和分支清理。再读 [详细资料索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)，不要重新实现已有 PG gateway/Owner。
2. 在**未发布**的现有平台体系内，规划或实施受信任 Host 授权事件 → PA05/T0 账户/企业/插件撤权/Actor 分离 → SQL 签名者与 DB authority epoch 的真实可审计同步；SQL Owner CAS 需接受真正的签名准入/租约 Epoch 和停机围栏；避免把测试管理连接或 Worker 临时 Token 升级为生产写入许可。
3. 将 TTL `cleanup()` 与受管多 Worker 调度、心跳/重试、SQL least-privilege Owner、租约中断、真实物理多 Host 和失败清理验收衔接；引入符合保留规则的 Key/KMS/备份/WAL 处理；在完成后才考虑注册正式 `dictionary.export` Host Operation 和 Eidos/Personal Agent 下载。
4. 保留真实双主体 Human/Personal Agent、企业切换/撤权、手机浏览器和端到端外部 Agent Tool 验收；Owner 门禁通过前 **继续不开生产 EXPORT，也不改变 CV-03 SAVE**。对旧 #1276 分支只做有据可循的安全清理。

**研究来源边界**：本窗口未访问新的第三方技术文章、官方文档或外网搜索摘要；资料均来自 GitHub 源码原文、PR 状态、Actions 作业日志。截图未制作或保存。任何“生产已认证/外部资料已读”的说法均不成立。
