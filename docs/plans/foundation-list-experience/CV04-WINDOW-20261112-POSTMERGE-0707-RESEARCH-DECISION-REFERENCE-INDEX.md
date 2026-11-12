# CV-04 / 2026-11-12 / #05–#07：研究资料、决策与工程证据索引

> **与 [简短交接入口](CV04-WINDOW-20261112-POSTMERGE-0707-HANDOFF-ENTRY.md)配套，不代替现有工程设计文档。**
>
> 访问日期：**2026-11-12**（香港/北京时间）。唯一研究媒介为**本仓库的 GitHub 连接器**所取回的源码文本、GitHub PR/commit/check-runs、Actions 工作流和原始 job logs。本窗口**没有调用新的外网搜索、没有查阅第三方教程或官方 PostgreSQL 在线文档**，因此不制造“外部参考资料已读”的条目。文件及 PR 的原始页面统一引用不可变提交 SHA 或固定 PR/Run ID。阅读等级严格区分为：**A = 已读源码/原始文档（本窗口曾取回全文或阅读相应原文段落）**；**B = 已读 GitHub PR/Actions 原始结构数据和/或原始日志（非搜索摘要）**；**C = 经已读资料间接引用/待独立核验原文**。**仅搜索摘要：无**。A 不意味着逐字检查每行代码，只能保证相应章节/片段经过实际查看。

## 1. 经核验的事实边界（区别于后续方案判断）

- 代码主仓库：`jiangxng/EVO-App-Platform`，官方源仓库 https://github.com/jiangxng/EVO-App-Platform 。准确分支 `main`。
- **窗口关闭前核验的 main**：`91356ae77df0a1af9f1993cdfc0909a1f3235f1e`；Commit/Check API 返回 **8/8 success**，其中东京 `preflight` 和 `deploy` 都是 SUCCESS（见 A-09）。新文档通过独立分支 PR 合并后，main 会产生**另一个文档合并提交 SHA**；此处记录的是工程基线，而不是未来动态的 main 最新值。
- **实际完成（本窗口交付）**：#1272 独立 PG 元数据 audit、#1273 未公开 Host EXPORT Capability、#1275 物理 SQL Host/Worker 一次性许可和有界 lease、#1277 PostgreSQL 加密快照主动 TTL 逻辑清理。**并行窗口交付**：#1274 独立隔离签名 SQL Export Gateway；本窗口读取和采用它的主线成果，**不认领 #1274 的独立开发**。
- 产品状态：**新跨页 EXPORT 无正式 `manager/server.ts`/ `catalog/seed.ts` Operation**。测试 Manager 装载的 Human/Personal Agent 能力、物理 PG 角色、SQL permission tests、Chromium 当前页 CSV、东京镜像健康**均不可单独证明真实员工/Agent 生产跨页 EXPORT 可用**。CV-03 N1=NOT_CERTIFIED/SAVE OFF；#1184 open。
- 关键同步事实：#1274 在 #1276 开发中于主线合并；#1276 发生 `mergeable_state=dirty`，后 **CLOSED NOT MERGED**，其非合并分支仍在远端；#1277 **基于已包含 #1274 的 main 重新创建**，源文件逐一移植并重构 README，才在 7/7 精确 HEAD 检查全绿后合并。

## 2. 项目原始源码与技术资料索引

**约定**：下表全部“日期 11-12”均指 **2026-11-12 实际阅读/取得原始内容**，不是源码初次提交日期。相对位置见链接中的固定工程 SHA `91356ae77...`。源码中的具体字段或断言属于**来源事实**；“应采用/不应生产启用”是本窗口或工程作者的**判断**，于第 4 节单独比较。

| 编号、阅读等级 | 资料标题与原始 URL | 对应主题、读到的原始事实 | 对当前 EVO 的用途 |
|---|---|---|---|
| S-01 · A（原文关键段落，11-12） | [Dictionary Export Domain Owner：`export-jobs.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/business-dictionary/export-jobs.ts) | `authorize()` 用独立 `dictionary.export` 并检查活动企业、真实关系、插件 active；`request()` 冻结快照、受预算约束；`run()` 以 Revision CAS 处理 `RUNNING/READY/FAILED` 和 15s lease、最多 2 次尝试；`download()` 在字节返回前重授权并先写持久 `DOWNLOAD_AUTHORIZED` audit；原 `expire()` 为访问时被动清理 | 识别唯一真实 Domain Owner/状态机，避免另建列表框架或重复任务表；#07 只补主动清理 |
| S-02 · A（原文关键段落，11-12） | [AES-GCM Export PG 存储适配器](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/business-dictionary/export-job-pg-store.ts) | 用现有 Enterprise Resource `putIfRevision`，原 `pages/csv/fields/policy` 进 AES-GCM 密文；metadata 与 scope 绑定 AAD；普通原始 PG JSONB 不应成为导出私有快照存储；仅隔离测试可启用，非正式密钥管理 | #06 实际 PG fixture、#07 原 CAS 清空 payload；限定 `cv04.export-maintenance` 测试 Actor 仅能提交 EXPIRED |
| S-03 · A（原文关键段落，11-12） | [独立 PG Export Audit 表与 Trigger](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/business-dictionary/export-job-pg-audit.ts) | `prepareIsolatedDictionaryExportAuditV010` 仅 `NODE_ENV=test` 的 `cv03_*`；`cv04_export_audit` 独立元数据表；资源 INSERT/UPDATE trigger 同事务追加，旧事件前缀必须保持，历史表 UPDATE/DELETE 拒绝 | #1272 统一保存审计证据；#1277 EXPIRED audit “恰一次”的底层依据；仍不抗 DBA 禁用 trigger |
| S-04 · A（原文关键段落，11-12） | [未公开的 Dictionary Export Capability](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/business-dictionary/export-capability.ts) | 申请/状态/下载三项操作都 require `dictionary.export`、ENTERPRISE DATA_SCOPE；HUMAN + PERSONAL_AGENT，排除 EXTERNAL_AGENT；申请任务声明 Host WRITE idempotency/receipt，但未在 `catalog/seed.ts` 注册 | #1273 验证 `dictionary.read` 不等于 EXPORT；未来安全准入完善后再决定是否正式发布 |
| S-05 · A（原文关键段落，11-12） | [Platform Capability Operation 授权与发现](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/manager/capability-operation-access.ts) | 现有 Manager/Capability 对真实 Request Context/Resource 执行发现及 Action 之前的 AuthorizationProvider 判定 | #1273 用现有授权基础设施，不重造通用权限框架 |
| S-06 · A（原文关键段落，11-12） | [ActionRouter](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/actions/router.ts)、[Manager Lifecycle](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/manager/service.ts) | 已有 Handler 安装/禁用/执行前路由，不必把逻辑分散到 Eidos UI | 验证插件 disable 时旧 Agent/Human Action 不可继续下载 |
| S-07 · A（原文关键段落，11-12） | [Capability Operation Contract](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/contracts/package.ts)、[Host Authorization Provider](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/providers/authorization/runtime.ts) | Contract `effect` 与 `authorization.action` 是分立语义；由 Provider 判定企业、Subject、Actor、资源 Action | 申请用 WRITE 效果但授权 action 必须明确 `dictionary.export`；不“创造”无定义的 `EXPORT` effect |
| S-08 · A（原文关键段落，11-12） | [现有 Enterprise Resource PG CAS](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/providers/enterprise-context/resources-postgres.ts) | 显式 `preparePostgresConditionalResourceSchemaV010` 和原子 Revision CAS；`receiptWriteMode` 的 `SQL_GATEWAY_ISOLATED_V010` 和 `readMode` 明确用于 CV-03 隔离准入；原始资源 INSERT/UPDATE 无 signed Export 默认许可 | 为 PG Audit/Owner 提供 CAS 基础；不得把 CV-03 Saved View SQL gateway 当作 Dictionary Export 权威 |
| S-09 · A（测试源码段落，11-12） | [CV03 PG Runtime SQL Role 反例](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tests/agent-line/cv03-postgres-runtime-role-admission.test.mjs) | 隔离 SQL login 即便不能改 DDL，如果有原始 Resources/Receipts INSERT 仍可绕过 Node-only Host HMAC；测试将这种情形显式标 `NOT_CERTIFIED` | 本窗口选择物理 SQL 非 Owner/DDL/DML 身份与独立 SECURITY DEFINER Gateway 的反例依据 |
| S-10 · A（原文关键段落，11-12） | [PA05 Object Extension Host SQL Permit](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/object-extension/pa05-host-sql-permit.ts) | Object Extension 专用独立 Host SQL LOGIN、effect permit、Backend PID/transaction fence；文档明确 opt-in 且非产品默认写入 | 研究可信 SQL Host/Business Owner 分离机制；不能直接复用 Object Extension toolId/permit 为 Dictionary Export 授权 |
| S-11 · A（原文关键段落，11-12） | [PA05 Object Extension Physical SQL Guard](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/object-extension/pa05-physical-sql-guard.ts) | 检查登录角色是否超级用户、Owner、可更改 DDL 等；独立 Host/Owner 角色互不继承；SQL trigger 仍受表所有者权限限制 | #06 身份检查借鉴；正式生产还需实际 PA05/T0 真实来源和 OS/SQL 多主机停机 |
| S-12 · A（原文关键段落，11-12） | [PA05 Remote SQL Admission](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/manager/pa05-cross-database-remote-sql-admission.ts) | 强调中心 reservation 与 Worker DB staging 不等于完成的 Owner fence，独立远端 Owner/网络分区仍有未覆盖条件 | 防止把 #06 “可以领取元数据租约”夸大成多 DB 生产授权 |
| S-13 · A（测试源码段落，11-12） | [PA05 Object Extension Physical Fence PG 测试](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tests/agent-line/pa05-object-extension-physical-sql-fence-pg.test.mjs)、[PA05 Host Permit PG 测试](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tests/agent-line/pa05-object-extension-host-permit-pg.test.mjs) | 原 PA05 物理隔离测试包含不同数据库/不同 SQL LOGIN、误调用直连 Owner、真实 Host Permit 与 TLS/进程负例；测试相应限制不等于 EXPORT 已被认证 | 下一窗口设计真实 Export Host→PG 集成验收时复用测试方法，不改其现有 Owner |
| S-14 · A（本窗口编写及原文复核，11-12） | [独立 Export Host/Worker SQL Lease](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/business-dictionary/export-job-pg-sql-lease.ts)、[4 项 PG16 验收](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tests/agent-line/cv04-export-host-worker-sql-lease.test.mjs) | Host-only SQL permit issuance、Worker-only claim、30s Token、15s Lease、Epoch 1→2、revoke、replay/过期/跨企业/不同主体拒绝；两 SQL LOGIN 均无原始表权限，测试显式 `NODE_ENV=test` | #1275 的实际工程与安全负例；#1277 复用同 Host SQL 身份做到期 ID 发现 |
| S-15 · A（本窗口编写及原文复核，11-12） | [Host-only 过期 Job 清理器](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/apps/business-dictionary/export-job-pg-maintenance.ts)、[4 项 PG16 清理测试](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tests/agent-line/cv04-export-pg-active-expiry-maintenance.test.mjs) | Host SQL due ID 查询 `limit<=25`、逐个检查企业与 TTL，先 revoke，再通过原加密 CAS 写 EXPIRED Tombstone、删除 pages/CSV，最多 3 次 CAS retry；双连接恰一条 EXPIRED；无法越权清理；**无生产 cron** | #1277 最终内容；下一阶段只需将这段接到受控后台 Job 运行体系（不能直接生产启用） |
| S-16 · A（原文关键段落，11-12；并行窗口交付） | [CV04 Signed PG Export Gateway 源码](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tools/cv04-isolated-signed-export-gateway.mjs)、[PG 真实测试](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tests/agent-line/cv04-signed-export-gateway-pg.test.mjs)、[作者设计文档](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/docs/plans/foundation-list-experience/CV04-SIGNED-PG-EXPORT-GATEWAY-20261112.md) | 独立 `cv04.dictionary-export.host-write/0.1.0` HMAC 域、Key ID、nonce、授权镜像 healthy/epoch/lease、完整加密资源 digest、固定 Resource Namespace、SQL EXECUTE-only 角色与 CAS/audit 同事务；隔离方案而非真实 Host PA05/T0 | PR #1274 并行合并时必须继承的结果；**不要再造替代签名 Gateway 或修改其表语义，先做真实 Authority 事件接线** |
| S-17 · A（原文，11-12） | [本系列工程资料汇总 README](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/docs/plans/foundation-list-experience/README.md) | 记录原 CV-03/04 状态与已有逐段实施资料；#1274 和 #1277 曾在此同一文件区域并行修改 | 交接文档只增独立入口与索引，保留老文件；避开并行 #1184 受管计划 |
| S-18 · A（原文，11-12） | [Branch Hygiene 合并分支退休规则](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/.github/workflows/branch-hygiene.yml) | 只在 PR MERGED + 合并 HEAD 与 main 祖先、精确分支 SHA 匹配、没有打开的 PR 引用时删除；不直接删除冲突/非祖先分支 | #1275/#1277 分支安全清理的算法依据，#1276 旧分支仍需人工确认差异、不得冒充已合并 |
| S-19 · A（本窗口编写，11-12） | [PG Host/Worker Lease 实施说明](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/docs/plans/foundation-list-experience/CV04-SQL-HOST-WORKER-LEASE-20261112.md)、[主动 TTL 实施说明](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/docs/plans/foundation-list-experience/CV04-ACTIVE-EXPORT-TTL-MAINTENANCE-20261112.md) | 清楚写明两物理 SQL LOGIN 是隔离测试、原 Owner 的 privileged CAS 与 lease 未强绑定，清理只实现逻辑 Tombstone，不是生产清理/擦除 | 下一窗口直接承接具体测试、已达边界及生产阻塞，不必从头设计 |
| S-20 · C（**本窗口未重读原文**，11-12 间接引用） | [CV03 N1 signed gateway 原设计代码](https://github.com/jiangxng/EVO-App-Platform/blob/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/tools/cv03-n1-isolated-signed-sql-gateway.mjs)；[CV03/PA05 正式认证与更多研究文档所在目录](https://github.com/jiangxng/EVO-App-Platform/tree/91356ae77df0a1af9f1993cdfc0909a1f3235f1e/docs) | 本窗口经 S-08、S-09、S-16 作者文档读到其存在和边界，**没有在本窗口对上述全部原始资料逐节独立验证** | 作为未来比对源，不计入“已读原文”；后续要核对最新生产授权、源代、真实数据库角色和 QA 签字 |

### 资料真实阅读状态汇总

- **已读原文或已访问原始源码相关段落**：S-01 至 S-19（其中 S-14/15/19 为本窗口编写并通过实际 GitHub CI 校验，S-16 为并行窗口已合入的原创成果，不能算作本窗口开发）。
- **仅浏览搜索结果摘要**：**0 项**；没有进行新的第三方外部网页搜索，也没有未经访问的“原始网址”。
- **待独立核实原文/下一步候选**：S-20。真正的 Google OIDC/PA05 授权事件源和生产 KMS/数据库连接并无本窗口可引用的认证资料，不声称已访问。

## 3. PR / Actions / 东京部署 / GitHub 文档证据索引

全部为 **B = 本窗口实际核对 GitHub 原始 PR/Actions 数据和（注明时）原始日志**，访问日期 **2026-11-12**。工作流运行链接是不可变历史位置；流水线“通过”只适用于它所对应 SHA/测试条件。

| ID / 原始 URL | 实际取得与关键发现 | 工程用途和真实性限制 |
|---|---|---|
| A-01 · [PR #1272 PG 原子审计](https://github.com/jiangxng/EVO-App-Platform/pull/1272)、[主线专项 PG16 #43170992605](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43170992605) | #1272 MERGED `72989d259054df293dbe9ee2678e20be20ad187a`。真实 PG 5/5，加密 PG 5/5、Owner 8/8；独立审计历史的 UPDATE/DELETE 拒绝，非法 CAS 同事务回滚；东京预览曾成功 | 证实数据库隔离回归，并非生产审计抗 DBA WORM |
| A-02 · [PR #1273 Host EXPORT Capability](https://github.com/jiangxng/EVO-App-Platform/pull/1273)、[专项原始 CI #43171837212](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43171837212)、[东京 #43172263197](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43172263197) | #1273 MERGED `98c32b63d2912b3bef997288093c8fd45ef30e98`。Human/AI 共用现有 Manager+ActionRouter+Owner 的测试装载 **4/4**，Owner+预算 **15/15**，实际主线 CI 和预览成功 | 不可把隔离 RequestContext 与静态授权策略测试写成真实登录双员工/真实个人代理 LLM |
| A-03 · [PR #1275 物理 SQL Lease](https://github.com/jiangxng/EVO-App-Platform/pull/1275)、[PG16 #43174965382](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43174965382)、[main PG #43175377058](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43175377058) | 最终 PR HEAD `373758ca60639cb488a9fe8f70a1e8db8a72df6b`，受保护 main 合并 `5a65e949b6c2a32d3f86a55635a15c070e2c6ab0`。原始 job `131036869596` 记录三个 marker：`CV04_EXPORT_PHYSICAL_SQL_HOST_WORKER_ONE_SHOT_PROVENANCE_PASS`、`CV04_EXPORT_SQL_MULTI_WORKER_CAS_EPOCH_FENCING_PASS`、`CV04_EXPORT_SQL_LEASE_REVOKE_STALE_AUTHORITY_FAILCLOSED_PASS`，**4/4 + 10/10，skip 0** | 判定两个 SQL LOGIN / SQL lease 负例，不能替代真正 Owner CAS 的 SQL 签名 |
| A-04 · [PR #1274 并行 Signed SQL Export Gateway](https://github.com/jiangxng/EVO-App-Platform/pull/1274)、[设计原文](https://github.com/jiangxng/EVO-App-Platform/blob/9ca4182c23ab761e08462e3f349b73780697aee5/docs/plans/foundation-list-experience/CV04-SIGNED-PG-EXPORT-GATEWAY-20261112.md) | **另一窗口实际交付**。最终 PR HEAD `9095595618a780bd89ea444e876edaba0b1fd41f`，在 #1277 开始前并行合入 `main@9ca4182c23ab761e08462e3f349b73780697aee5`；读取其 SQL gateway 源码、测试原文关键段落及设计文件，并核对其 merge PR | 防重复开发；该 SQL AUTH mirror 仍是隔离测试 fixture，尚无真实 PA05/T0 同步 |
| A-05 · [冲突旧 PR #1276](https://github.com/jiangxng/EVO-App-Platform/pull/1276)、[旧 CI #43176312723](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43176312723) | 初版 TypeScript 报 `TS2322`：`number \| undefined` 不能当 `number \| null`；修复后 PG16 编译时 SQL due() 函数误用 `AS $ … END; $`，PG 错 `syntax error at or near "$"`；虽然代码进一步修复，但该分支随后与 #1274 README 冲突（GitHub `mergeable_state=dirty`），最后 **CLOSED NOT MERGED**，没有用它覆盖并行窗口 | 冲突与失败路径证据，不能把失败旧 PR 记作“已合并”；旧分支 `8ffd6efa3a327417d2d0a147cf78a93d5084c3c0` 仍存在 |
| A-06 · [PR #1277 主线重建后的主动清理](https://github.com/jiangxng/EVO-App-Platform/pull/1277)、[PR PG CI #43177052138](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177052138)、[main PG CI #43177415445](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415445) | 在已包含 #1274 的主线新建分支；最终 PR HEAD `85fa44828495f9191bd833fd21a00d73e45634d8` **7/7 SUCCESS**，合入受保护 `main@91356ae77df0a1af9f1993cdfc0909a1f3235f1e`。Main 实际 job `131044929219` 输出 `CV04_EXPORT_PG_ACTIVE_TTL_READY_QUEUED_PURGE_AUDIT_PASS`、`CV04_EXPORT_PG_ACTIVE_TTL_TWO_CONNECTION_SINGLE_EXPIRE_PASS`、`CV04_EXPORT_PG_ACTIVE_TTL_REVOKE_TENANT_FAILCLOSED_PASS`，**4/4、PG 原合同 14/14、Owner 8/8、skip 0**。无正式 Host EXPORT 命令的负例 `CV04_EXPORT_ACTIVE_EXPIRY_NO_LIVE_HOST_ROUTE_PASS` | 是隔离清理真实 PostgreSQL 验收，不是正式 cron/backup purge |
| A-07 · [Branch Hygiene #43177416954](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177416954) | job `131044934212` 原始行：`DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv04-export-pg-active-expiry-main-reconciled-20261112 @ 85fa44828495f9191bd833fd21a00d73e45634d8`；GitHub matching refs 返回空。#1275 已合并分支也返回空。旧 #1276 未合并分支在最后核验时仍可见 | 过程分支清理有安全可重查证据；**不得据此声称所有旧分支已删除** |
| A-08 · [最终 protected-main Commit/check-runs](https://github.com/jiangxng/EVO-App-Platform/commit/91356ae77df0a1af9f1993cdfc0909a1f3235f1e) | 2026-11-12 16:55 左右核对 GitHub Checks：**8/8 completed SUCCESS**：`deploy`、`preflight`、`lightweight-host`、`real-host-desktop-phone-csv`、`continuity`、`active-expiry`、`dictionary-export-real-postgres`、`export-sql-host-worker-lease` | 接续的工程主线校验点，不等于更后来的 main 当前 HEAD |
| A-09 · [东京预览 #43177445714](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177445714)、[Deploy 原始日志 job #131046056600](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177445714/job/131046056600) | `preflight/deploy` SUCCESS；原始部署日志 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=91356ae77df0a1af9f1993cdfc0909a1f3235f1e`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。这是远端镜像和 HTTP/Auth 边界实际通过 | 不能声称东京已开放或实测有正式 EXPORT 页面/个人代理全量下载 |
| A-10 · [并行受管 PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | GitHub PR API 于 2026-11-12 返回 `state=open, merged=false`；本窗口没有直接改其受管三份计划文件 | 避免继续窗口覆盖别的工作线的权威计划；新材料独立放到 `docs/plans/foundation-list-experience` |

## 4. 方案比较与采用/排除理由：来源事实 vs 本窗口判断

| 选择 | 来源事实（可复查条目） | 本窗口的工程判断与条件/限制 |
|---|---|---|
| **采用：复用现有 Dictionary Owner + Enterprise Resource CAS** | S-01/S-02/S-08：已有 Context 限定、字段预算、快照、Revision/审计及下载再授权 | 作为**唯一业务 Store/Owner**，只在 PG/Host 层补必要边界；不另造全能 List 基类。条件：真实 Host 可信 Context 与 DB Owner 准入必须独立认证 |
| **采用：PG trigger 同事务审计** | S-03、A-01/A-06：PG 会在原 CAS INSERT/UPDATE 中同步写审计元数据；非法 history rewrite 事务回滚 | 排除“资源写入后再单独调用审计服务”两提交窗口。限制：SQL superuser/owner 可停用 trigger 或清 WAL，非独立 WORM |
| **采用：独立 `dictionary.export` Action** | S-04/S-05/S-07、A-02：Manager 支持独立 Action 授权，READ 不保证 EXPORT | 保护数据外传，不把当前页 CSV 的小边界 READ 许可自动放大到全部导出；**未注册产品功能**。申请 WRITE 需 Host receipt 安全协议 |
| **采用：两物理 SQL LOGIN + SECURITY DEFINER 元数据许可和 lease** | S-09/S-11/S-14、A-03：非 Owner 登录没有原始 DML/DDL，Host/Worker 互不能替代，PG Epoch/Token 可拒绝重放与抢占 | 比 JS Boolean/GUC 或内存锁更有安全证据，但仅 fence **调度层**；真正 Owner CAS 仍需独立 signed SQL gate，不应混称已完成 |
| **采用并协调：#1274 独立签名 Export SQL gateway** | S-16/A-04：并行 PR 已实际合入，HMAC domain、DB authority mirror、nonce、低权限 Worker EXECUTE | 复用已存在的数据库协议，不重复造第二套。前提是未来 Host 真正签发与 PA05/T0 已批准事件、Key/KMS、SQL role 关联；测试 mirror 不能冒充生产权威 |
| **采用：到期任务主动扫描 + 原 CAS EXPIRED 墓碑** | S-01 只能被动 expire，S-15/A-06 已真实 PG 到期清理 CSV/pages 且恰一次 audit | 避免长期无人访问导致**当前逻辑记录**继续保留业务密文；不提供任意企业的批量全表 SELECT。限制：测试显式调用，没有生产定时服务；数据库旧 WAL/备份密文仍存在 |
| **排除：直接把 CV-03 Saved View 签名写入口复用于 EXPORT** | S-08/S-09/S-16：CV03 的 namespace、Action/签名材料与 Export 不同；权限角色 SQL 直接写仍有反例 | 会形成错误授权继承与业务范围混淆。应该有独立 Export domain、Action、Resource 限定，而非更改 CV03 SAVE 门禁 |
| **排除：单凭运行角色拿 raw PG INSERT/UPDATE/SELECT，或 Host app 内存标志** | S-09/S-11 的物理 SQL 绕过测试；S-14 物理角色拒绝 | Compromised Worker 可能绕过 Node，不能因为一条 Host 请求已授权就赋予共享资源直接写/读权限。需要 SQL 强制的最小权限写入函数 |
| **排除：为赶进度在产品中注册 EXPORT/默认启用 Eidos 按钮** | S-01/S-04/S-16、A-02/A-06：现有真实 Owner 与隔离 SQL 安全合同仍缺生产 session/DB/KMS 认证 | 测试/东京镜像成功 ≠ 真客户可用；在准入/签收满足前必须继续 closed gate，不经用户逐次审批不等于跳过正式安全授权 |
| **排除：强制合并已冲突的 #1276，或强行删除非祖先未合并分支** | A-05/A-07、S-18：旧分支 mergeable dirty；Branch Hygiene 对非合并祖先不会自动删除 | 采用最新 main 新分支移植，仅将 #1277 合并，#1276 CLOSED；旧 branch 安全清理需要先比较全量内容/引用 |

## 5. 冲突、未决问题与优先查阅方向

### 5.1 实际发生的冲突 / 缺口

1. **并行提交冲突**：#1274 在 #1276 开发期间合入 `main`，双方修改 `docs/plans/foundation-list-experience/README.md`。旧 #1276 显示 `mergeable_state=dirty`，其已修正但未经合并的 commit `8ffd6efa3a327417d2d0a147cf78a93d5084c3c0` 仍在远端。#1277 从 `9ca4182...` 创建，保留 #1274 所有 signed gateway 文件，只移植本轮 TTL 差异，已合并。**保留旧分支以供对比，不重复开发或使用未经验证的旧 HEAD。**
2. **构建/SQL 失败**：旧 #1276 的 TS2322 与 SQL 函数 `$$` 分隔符错误来自真实 Actions 原始日志，不能省略为“初次就通过”；#1277 的 PostgreSQL CI 4/4+14/14+8/8 和主线 8/8 才是最终事实。
3. **测试 vs 生产授权镜像**：#1274 的 `cv04_export_authority` 是隔离管理员预置的 DB mirror，#1275 的 Host SQL LOGIN 是试验身份；没有可引用的生产 PA05/T0 授权/撤权事件对接或真实员工会话。即使两者分别 PASS，也无法推出真实授权事件的顺序一致性、密钥托管或对 Worker 失败网络分区的 stop 保证。
4. **双重租约语义**：原 Owner 的 RUNNING/lease CAS、#1275 元数据 SQL lease、#1274 签名 SQL Worker lease（在独立 gateway 函数内）是三个已有边界，当前未证明它们由同一个真实 Host authority 原子组织。下一步应该制定统一的 Epoch/Operation/Resource Revision 执行合同，避免以“多个绿色 lease tests”掩盖真实 race。
5. **到期清理和留存**：#1277 在**当前存储记录**中移除了 `pages/csv` 并写 `EXPIRED`，但没有定时 daemon、生产 Lease Scheduler、可验证 KMS 销毁或数据库 WAL/备份物理擦除。审计表仅有元数据且保留历史；retention 与法务/运维策略未正式签核。
6. **真实 Human/Agent**：先前静态隔离 Host、Chromium 1280/390 viewport、不同 Human/AI 主体有自动验证；但不等于东京 Google/OIDC 真实用户、物理手机、外部自然语言 Agent 或真实成员/管理员审批撤权。必须补真实权限来源、拒绝时序与操作者证据，不要重复 UI 模拟来替代。
7. **CV-03 SAVE 与并行计划**：N1 NOT_CERTIFIED，不影响当前页小范围 READ CSV；#1184 仍 open。不得因为“CV-04 signed export works in test”顺便打开 CV03 SAVE 或编辑并行 Owner 管理文档。

### 5.2 最值得继续核验的代码和测试（按优先级）

1. **先读 S-16 与其安全测试 + S-01/S-08**：对照 signed gateway 的 `authority_epoch`、Operation、签名/nonce、Owner Resource/AES-GCM AAD、真实 SQL Role，写出单条真实 HOST→SQL→Owner 的 admission 数据流。确认 CV-03 原系统有何权限来源但不要直接复用其签名/表。
2. **再读 S-10/S-11/S-12 与真实 PA05/T0 事件来源**：找出可信 Host login/cert、真实企业关系 grant/revoke、插件 disable、不同 AI/HUMAN Actor 的权限快照、网络分区如何停写；**尚未做外部生产授权研究**，不能以本索引中的设计判断取代认证。
3. **再读 S-14/S-15**：结合已有 SQL lease 与主动 TTL 找出“颁发许可→执行 Job→提交 READY→下载→EXPIRED”的单一强制 Epoch 编排点。避免新增第四套 lease 和另一个 CSV renderer。
4. **KMS/治理**：当前密文/WAL/backup 到期清理、密钥版本/轮换、不可变审计外部写入、测试至生产变更审查、安全审计及租约可观测性仍须验证，证据缺失即 fail closed。
5. **可用性和回归**：最后才接正式 `catalog/seed.ts` + `manager/server.ts` + Eidos 下载 + Personal Agent Tool，实际登录两个不同人和 Agent，A/B 企业及撤权、插件停用后的下载时再授权；真实多进程/SQL login 与 Chromium/手机回归，所有门禁全部可追溯后再 release。
6. **旧分支处理**：核对 #1276 已关闭且没有其他打开 PR 引用，比较旧 SHA 的全部差异是否被 #1277 和 #1274 main 完整包含；如不是纯等价归并，不强行删除，可保留并标记 `CLOSED`。不能把 Branch Hygiene 的单个成功日志当作已清全仓。

## 6. 容易变化的证据、段落定位和截图/附件位置

- **动态事实（必须重新查询）**：`main` HEAD、PR #1184 状态、Job 运行与 Branch Hygiene、角色/生产部署配置都可能改变；本索引以 **2026-11-12** 快照、具体 PR ID、工程 HEAD/merge SHA、Actions Run/Job ID 锁定历史。
- **关键旧原始日志定位**：[1275 PG job 131036869596](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43174965382/job/131036869596)，见三个 `CV04_EXPORT_PHYSICAL_SQL...` marker 和 `pass 4 / pass 10`；[1277 main PG job 131044929219](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415445/job/131044929219)，见三个 `CV04_EXPORT_PG_ACTIVE_TTL_...` 和 `pass 4/pass 14/pass 8`；[东京 deploy job 131046056600](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177445714/job/131046056600) 搜索 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS` / `PUBLIC_HTTPS_HEALTH_PASS` / `BASIC_AUTH_BOUNDARY_PASS`；[Hygiene job 131044934212](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177416954/job/131044934212) 搜索 `DELETED_VERIFIED_MERGED_PR_BRANCH`。
- **失败证明的原始位置**：[初次 #1276 build](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43176203546/job/131040936570) 搜索 `TS2322`；[修正后 #1276 PG](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43176312723/job/131041290494) 搜索 `syntax error at or near "$"`。这解释为何没有合并老分支，不是本轮最终 CI 失败。
- **源码章节/函数定位**：S-01 的 `authorize`, `expire`, `request`, `run`, `download`; S-03 的 `prepareIsolatedDictionaryExportAuditV010`、`cv04_append_job_resource_audit`; S-14 的 `cv04_export_issue_lease`, `cv04_export_claim_lease`, `cv04_export_complete_lease`, `cv04_export_revoke_lease`, `cv04_export_due_jobs`; S-15 的 `cleanup()`; S-16 的 `cv04_export_signed_put` 及授权镜像、`nonce` 表和独立 SQL 角色设置。源码/固定提交链接比临时截屏更可靠。
- **截图、文件、附件**：本窗口**未制作网页截图，也未保存独立 PDF、图像或下载 Actions Artifact 到工作区/仓库**；不提供猜测的路径。上表 URL 是确切可重试的位置。若日志日后过期，详细文档保留了关键 marker、失败代码、最终 SHA 和测试数量，但不伪造原始 log 的完整备份。

## 7. 直接对应下一步模块与交付门槛

| 下一步/验收包 | 既有模块/文档起点 | 必须验证的拒绝与成功 | 不能提前声明 |
|---|---|---|---|
| CV04-NEXT-01：可信真实 Host/PA05 AUTHORITY 事件同步 | `manager/capability-operation-access.ts`、`apps/business-dictionary/export-capability.ts`、`tools/cv04-isolated-signed-export-gateway.mjs`；S-05/14/16 | 真实企业 A/B 两独立 Human、AI，包含换企业、撤权、插件 disable 后 DB epoch 变化、事件断链 fail-closed，含真正 SQL Host 认证及 durable audit | “生产源代已认证”，不能伪造 |
| CV04-NEXT-02：Domain Owner 受签名 SQL 角色/租约 fence 的业务 CAS | `export-jobs.ts`, `export-job-pg-store.ts`, `export-job-pg-sql-lease.ts`, `resources-postgres.ts`; S-01/02/08/14/16 | 签名批准、未过期/未撤权的物理 SQL Worker 完成同一 Revision 的 `READY` 才能提交，旧 Lease Epoch 即使已有原数据也拒绝；不同 Worker 主机/Network 断链测试 | “已多物理 Host 无绕过” |
| CV04-NEXT-03：持久作业与运营 TTL/WAL/KMS | `export-job-pg-maintenance.ts`、PG audit、已有 Worker runtime；S-03/15 | 真正 scheduler、限流/重试/回收/心跳、跨两个 SQL Host 清理幂等、备份/retention policy、KMS 轮换、不可变审计 | “物理数据已擦除” |
| CV04-NEXT-04：最后才开放产品 EXPORT | `manager/server.ts`, `catalog/seed.ts`, Eidos Collection surface, Personal Agent Tool；S-04/05/06 | 正式 Bearer/OIDC + Human/AI Actor/企业/插件权限一致性、固定快照+预算/审计、下载前重授权、Desktop/390px/物理手机与真实 Agent 试运行 | “隔离 CI = 客户已上线” |
| CV03-N1：保留独立安全门禁和并行 PR | CV03 既有计划与 PR #1184 | SAVE OFF / N1 NOT_CERTIFIED 不回退；PR #1184 Owner files 未变更 | “CV04 有进展即 CV03 可开放” |

### 7.1 保留下来的精确标识

- `main`（工程校验点）`91356ae77df0a1af9f1993cdfc0909a1f3235f1e`。
- PR #1272 merge `72989d259054df293dbe9ee2678e20be20ad187a`；#1273 merge `98c32b63d2912b3bef997288093c8fd45ef30e98`；#1275 HEAD `373758ca60639cb488a9fe8f70a1e8db8a72df6b`, merge `5a65e949b6c2a32d3f86a55635a15c070e2c6ab0`。
- 并行 #1274 HEAD `9095595618a780bd89ea444e876edaba0b1fd41f`, merge `9ca4182c23ab761e08462e3f349b73780697aee5`。
- #1276 **CLOSED NOT MERGED**, HEAD `8ffd6efa3a327417d2d0a147cf78a93d5084c3c0`，远端原旧分支 `feat/cv04-export-pg-active-expiry-maintenance-20261112` 尚存；#1277 HEAD `85fa44828495f9191bd833fd21a00d73e45634d8`, merge `91356ae77df0a1af9f1993cdfc0909a1f3235f1e`，新分支 `feat/cv04-export-pg-active-expiry-main-reconciled-20261112` 已核验删除。
- 本窗口新建两份交接文档应通过**独立 docs PR**合并；新的 docs-merge SHA 及对应 CI/分支清理以那次 PR 的实际最终核验和评论为准，不应预填“合并成功”。

**保持解释界限**：DB 层的真实测试、Chromium 浏览器体验、东京镜像发布、生产身份/授权/安全认证分别是四层证据，不能相互替代。


## 8. 下一窗口定向追证：2026-11-12 / NEXT-01a 与 #1276 旧分支对等性

> 此节为后续窗口增量，不修改上面的历史快照。日期均指 **2026-11-12（香港/北京时间）**，来自直接读取 GitHub 原文和 Actions 原始结构/日志；没有新查阅第三方资料、没有制作截图。

### 新工程（已证实，不是生产认证）

- **A · 原文源码/测试**：[原签名 Gateway 在交接基线的版本](https://github.com/jiangxng/EVO-App-Platform/blob/14d919b12887dc6f1a88eeee79b1a1115abf9f4d/tools/cv04-isolated-signed-export-gateway.mjs)、[原主机 SQL Worker Lease](https://github.com/jiangxng/EVO-App-Platform/blob/14d919b12887dc6f1a88eeee79b1a1115abf9f4d/apps/business-dictionary/export-job-pg-sql-lease.ts)、[测试 fixture](https://github.com/jiangxng/EVO-App-Platform/blob/14d919b12887dc6f1a88eeee79b1a1115abf9f4d/tests/agent-line/cv04-signed-export-gateway-pg.test.mjs)。确认前者只对每个 Operation 独立查授权镜像；跨 Operation 的 Subject 撤权代际没有一个共同 SQL Fence。
- **采用（工程判断）**：只扩展原 `cv04_export_signed_put`，增加企业 + Subject + Actor 级 Principal Fence，由签名证明 `authorityEpoch` 与共同围栏进行相等比较、`FOR SHARE` 锁到 CAS 提交。功能意义、取舍和剩余限制写入同目录 [CV04 Signed PG Gateway 纵切](CV04-SIGNED-PG-EXPORT-GATEWAY-20261112.md) 的 NEXT-01a 小节。对没有真实 T0 事件来源、SQL Host/Worker Lease Epoch 不共享 Owner CAS、生产 KMS/密钥轮换不认证的事实仍保持 NOT CERTIFIED。
- **B · PR/原始 CI**：[NEXT-01a PR #1279](https://github.com/jiangxng/EVO-App-Platform/pull/1279) 在工程 HEAD `edba62c0954d7e9f18bf9171c3390af04b1c5818` 运行 [真实 PG16 签名 Gateway workflow #43190184677](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43190184677)，原始 job `131087215265` 证实 `CV04_SIGNED_PG_PRINCIPAL_EPOCH_CROSS_OPERATION_FENCE_PASS`、新 Gateway **7/7 PASS, 0 SKIP**、旧 PG audit **5/5**、Encrypted PG **5/5**、Owner **8/8**。#1279 已合并，受保护主线 merge `c0bf3bebd5e891ace27c914ba824319f91721ced`。新主线上的其他 CI 与东京变更是否执行必须用该 SHA 查询，不能以 PR CI 代替。

### 旧 PR #1276 可安全清理的实际代码证据

- **B · PR 原始数据**：[PR #1276](https://github.com/jiangxng/EVO-App-Platform/pull/1276) **CLOSED, NOT MERGED**，旧分支 `feat/cv04-export-pg-active-expiry-maintenance-20261112` 的 `8ffd6efa3a327417d2d0a147cf78a93d5084c3c0` 尚在（最后核验时）；GitHub 打开的 10 个 PR 中未发现该分支作为 head/base。引用是一时快照，Actions 必须重新检查。
- **A · 文件原文和 Blob SHA（固定旧 SHA vs `main@c0bf3beb...`）**：旧 PR 七个 changed files 中，`.github/workflows/cv04-export-pg-active-expiry.yml`、`apps/business-dictionary/export-job-pg-maintenance.ts`、`apps/business-dictionary/export-job-pg-sql-lease.ts`、`apps/business-dictionary/export-job-pg-store.ts`、`docs/plans/foundation-list-experience/CV04-ACTIVE-EXPORT-TTL-MAINTENANCE-20261112.md`、`tests/agent-line/cv04-export-pg-active-expiry-maintenance.test.mjs` 的新旧 Git Blob SHA **六项完全相等**。README 的旧版非空行只有一行不在主线，属于同一 `CV04-ACTIVE-EXPORT-TTL-MAINTENANCE-20261112.md` 功能链接的**文字修订**，新版显式保留“正式 EXPORT 仍不注册，CV03 N1 SAVE OFF”。
- **采用的清理方案（判断）**：旧提交不是 `main` 祖先，原 [Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/blob/c0bf3bebd5e891ace27c914ba824319f91721ced/.github/workflows/branch-hygiene.yml) 按 `behind_by=0` 的通用祖先规则必然安全跳过。不能用强推或误称它“已合入”。另建[严格 SHA-pinned 一次性 Actions 清理](../../../.github/workflows/cv04-retire-pr1276-subsumed.yml)，在合并到 main 的工作流 push 上运行：重新检查旧 PR/原 head、完整七文件集合、六项 Blob SHA、README 单一文字修订、全部 OPEN PR 引用、分支保护、删除前再次核对原 SHA。任何不符都 fail closed；不会触碰其他分支。不预先填写“已删除”，以 Actions 原始结果为准。

**仍未解决**：真实 PA05/T0 权威 outbox→签名数据库镜像原子推进、Owner Business CAS 与物理 Worker Epoch 强制绑定、分布式调度、KMS/WAL/备份 retention、真实多主体 OIDC/Agent 会话。这些不得因为旧分支清理或隔离 SQL PASS 而视为完成。


## 9. 本次窗口新增：CV04 NEXT-02 物理 Lease Epoch → 签名 SQL Resource CAS（2026-11-12）

> 本段为 **NEXT-02** 增量证据，不重写 #05–#07 结论或偷改 CV03 #1184 的 Owner 文件。等级仍依照前文：A=直接读取源码/实施文档关键段落，B=直接读取 PR/Actions 原始数据/日志，C=间接依据或未验证；没有新增第三方互联网来源。

| 等级/原始链接（2026-11-12） | 已证实的来源事实 G | 工程选择 D / 限制 |
| --- | --- | --- |
| A · [原签名 SQL Gateway `main@0233c39`](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/tools/cv04-isolated-signed-export-gateway.mjs) | 签名 HMAC、Principal Epoch、业务 Revision CAS 已有，但旧 Worker transition 未检查另一张物理 SQL Lease/Permit 表 | 使用现有 Gateway 的 opt-in `requirePhysicalWorkerLease`，不另造 Gateway；不提前开放生产 |
| A · [物理 SQL Lease 原文](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/apps/business-dictionary/export-job-pg-sql-lease.ts)、[原真实 SQL Fixture](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/tests/agent-line/cv04-export-host-worker-sql-lease.test.mjs) | Host issue/Worker claim/revoke/complete 原可在数据库测试中证明 Epoch/Token/身份隔离，但许可未携带授权代际，且业务 CAS 在另一条路径发生 | 同一个 PG 事务拿 Job advisory lock 并验证 claimed Permit Token Hash、Worker Lease Epoch、Subject/Actor/Enterprise、发行时 `authorityEpoch`、签名 Epoch、expected Resource Revision。旧 7 参数 issuer 可继续做**未盖章** legacy QA；联合 Gateway 对该 permit 必须 deny |
| A · [原 Dictionary Owner `run()`](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/apps/business-dictionary/export-jobs.ts)、[AES-GCM PG Adapter](https://github.com/jiangxng/EVO-App-Platform/blob/0233c390c0590816aa12861e37ec74364b2c1aa1/apps/business-dictionary/export-job-pg-store.ts) | 原 Owner `run()` 有 RUNNING 中途审计追加与多次 CAS，仍使用隔离管理级 PG Adapter；不是用这次新增的 signed Worker 写入执行生产 Owner | 本 PR 只证明**同一真实 Job Resource Revision + PG 审计 Trigger** 的 SQL 联合围栏；下一阶段需把 Owner 中途 audit、限权读取与真实 PA05/T0 Host signer 对接后才可验证完整 Business Owner |
| B · [失败的首轮真实 PG CI #43194029869](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43194029869) | 当时 9/10 PASS、0 SKIP，失败由错误 expectedRevision 预期断言漏掉 DB 较早阶段正确拒绝的 `CV04_GATEWAY_PERMIT_OR_STATE_DENIED`，不是签名 Gateway 实际接受了非法写 | 断言补入较早拒绝，并在复核中发现物理 permit 还需独立盖章 `authorityEpoch`，两项都在更新 HEAD 修复；原红灯不抹去 |
| B · [新 HEAD `9e4b8f6f` 的实际真实 PG16 #43194540062](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43194540062) | 原始 job `131101985208` 记录三个联合标记：`CV04_SIGNED_PHYSICAL_LEASE_OWNER_REVISION_READY_ATOMIC_PASS`、`CV04_SIGNED_PHYSICAL_LEASE_RECLAIM_STALE_CAS_FENCED_PASS`、`CV04_SIGNED_PHYSICAL_LEASE_REVOKE_PRINCIPAL_DENY_PASS`；新联测 **10/10 PASS、0 SKIP**，旧审计 **5/5**、加密 **5/5**、Owner **8/8**，且正式 EXPORT 未注册 | 可以称为一次性 PostgreSQL16 隔离硬边界验证；不能当两台真实物理 Host、OIDC/Agent 会话、PA05/T0 生产 outbox、KMS 或 WAL/备份签收。新旧 Worker 分别为两个 SQL 连接，未证明跨机器 Worker 宿主故障恢复 |

**已采用 vs 排除**：保留独立 Worker/Host SQL LOGIN + 共同 per-job advisory 事务锁、signed HMAC Principal epoch + Resource revision CAS；拒绝只靠 Worker token、Node 内存标志、旧未盖章 permit 或单独 Business Owner 管理级 DML 来声称生产准入。不改变 CV03 Saved View 签名入口或另起列表插件框架。实施细节、初次 CI 失败和仍未完成的中途 Owner `run()` 桥接，落入 [现有签名 Gateway 纵切文件](CV04-SIGNED-PG-EXPORT-GATEWAY-20261112.md) 的 NEXT-02 节。

**待继续查证 C**：真正的 PA05/T0 outbox 来源/单调授权代际、离线未知主体全局 Package Fence、真实 SQL Host workload 身份和 KMS、Owner `RUNNING→RUNNING` 独立 audit 过渡、安全 GET 最小权限、多物理 Worker 重启/网络分区、真实 Human/Personal Agent 下载重验、备份/WAL retention。正式 CV04 EXPORT OFF，CV03 `N1=NOT_CERTIFIED`、SAVE OFF，#1184 继续不触碰。当前 PR 最终合并 SHA、protected-main CI、东京与 Branch Hygiene **必须合并后再核验**，不提前预填。


## 10. NEXT-03a：真实 Owner `run()` 隔离桥接、受限密文读取、原子中途 Audit（2026-11-12）

> 保留此前 #05–#07、NEXT-01a/02 原证据；此节为新增查证，不把历史索引当成本次已读原文。**不接线正式生产 EXPORT。**

| 阅读等级/原始链接与查阅日期 | 来源事实 G（直接观察） | 对模块的可重用决定 D / 限制 |
| --- | --- | --- |
| **A / 源码已读 2026-11-12** — [原 Domain Owner `run()` 源](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/apps/business-dictionary/export-jobs.ts#L263-L324)、[AES-GCM PG Job 存储](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/apps/business-dictionary/export-job-pg-store.ts)、[CSV 生成器审计](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/foundation/collection-query/authorized-cross-page-csv.ts) | Owner 真正 `run` 包含 `QUEUED→RUNNING`、中途 `RUNNING→RUNNING STARTED/COMPLETED/REJECTED` 多次 CAS 和最后 `READY`；Owner 最终直接使用其注入的 Resource 存储。原 #1281 Gateway 尚不允许中途审计。 | **仅扩展原 Gateway** Worker 中途审计状态分支；必须同 Attempt、同 Lease 截止时间、一个新事件/Revision、有完整物理许可/签名/授权代际。Owner 仅对 `isolatedTestOnly` 注入数据库 `claim.leaseUntil`，不授予公开第三参数。 |
| **A / 源码已读 2026-11-12** — [原签名 Gateway](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/tools/cv04-isolated-signed-export-gateway.mjs)、[原物理 SQL Lease](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/apps/business-dictionary/export-job-pg-sql-lease.ts)、[独立审计 Trigger](https://github.com/jiangxng/EVO-App-Platform/blob/bfdc861a3d8829e5c9147d46601a408937918655/apps/business-dictionary/export-job-pg-audit.ts) | SQL Worker Lease 能 claim/revoke/complete，但无按已认领 token 的 Job GET；直接 GRANT Worker SELECT 原 Resource 表会破坏数据隔离。独立 Audit SQL Trigger 已保留同一资源 CAS 的不可变事件链。 | 原签名 Gateway 在明确绑定物理 Worker `session_user` 的 opt-in 条件下安装 `cv04_export_worker_read(token,epoch)`，仅返回有效 claim/authority/lease 对应 Job **密文和 Resource Revision**；无任何 raw SELECT/LIST。原 Trigger 继续追加真实账本，不发明第二套 Audit。 |
| **B / 原始 PostgreSQL CI 2026-11-12** — [PR #1282](https://github.com/jiangxng/EVO-App-Platform/pull/1282)、[PG16 Workflow #43198149839](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43198149839) / Job `131114302319` | 精确 HEAD `fbbae2f65898c4ba1ccca61b2647c0b67507cebf` 的原始 PG 日志确认 **13/13 PASS、0 SKIP**：`CV04_SIGNED_OWNER_RUNNING_AUDIT_LEASE_FENCED_PASS`、`CV04_SIGNED_WORKER_ENCRYPTED_READ_REVOKE_FAILCLOSED_PASS`、`CV04_REAL_DICTIONARY_OWNER_SIGNED_WORKER_CAS_AUDIT_READY_PASS`；旧 SQL Audit 5/5、加密 PG 5/5、Owner 8/8。实际 Owner `request→run→READY` 的独立 Audit stages 为 `REQUESTED, STARTED, STARTED, COMPLETED, READY`；密文不包含原字典选项或显示名称。 | 证明一次性 PostgreSQL16 隔离原 Domain Owner + 原加密存储 + 原受限签名 SQL + 物理 SQL Worker 的端到端工程联动；**不能叫生产 Human/Agent 会话、真实 PA05/T0 或 KMS 认证**。随后发现 SQL `NULL` lease_until/expiration 比较可能因三值逻辑误放行，已追加显式 IS NULL deny 和独立负向回归；最终 exact HEAD 必须再看 CI，不能沿用本条先前成功。 |

**安全选择与排除**：保留同一 Domain Owner、原 Resource CAS、原不可变 SQL Audit；不授予 Worker 跨任务明文/资源表 SELECT，不增加第三套 List/Gateway/Owner，不假装能用 test-only HMAC Key 认定生产 Host。真实 PA05/T0 的成员/企业/Feature 授权 Epoch 与不可变 Outbox、生产 KMS/decrypt 权属、双物理 Host 进程崩溃与网络分区、持久 Scheduler、正式 Human 与 Personal Agent 会话的下载时再授权以及 WAL/备份保留策略仍为 **C / 未验**。与 CV03 `N1=NOT_CERTIFIED`、SAVE OFF、正式 EXPORT OFF、#1184 受管文件不修改的既定决定完全兼容。

新增证据不包括第三方网页原文（本窗口未作外部资料浏览），也未新增截图。每次后续交接均需凭 PR 最终 HEAD、受保护 main Actions、东京真实 release/HTTPS/认证与 Branch Hygiene 日志单独核验，不以前次 PR PASS 代替。


## 11. NEXT-04 / 独立 Host SQL 会话派工与真实 Worker OS 进程崩溃重领（2026-11-12）

本节增量记录本窗口**直接查阅的仓库原文**，不扩写成未访问的网络来源；遵守 A=已读源码/参考正文、B=原始 CI 记录、C=未验。

| 等级 / 原始网址 / 查阅日期 | G：源事实 | D：工程决策及适用条件 |
| --- | --- | --- |
| A · [SQL Host/Worker Lease 原文件](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/apps/business-dictionary/export-job-pg-sql-lease.ts)（2026-11-12） | SQL Permit 30s、Lease 15s、Epoch 1→2、物理 SQL Host/Worker 登录隔离、资源 Scope/Revision 认证已实现，但没有真正的 Host-only Runnable Job 扫描。 | 在现有 Lease installer 内增加 `cv04_export_runnable_jobs`，限定 Host LOGIN，字段只含待授权派工 Metadata；新增活跃 ISSUED Permit/物理 RUNNING Lease 重叠签发拒绝，不引入独立调度 Lease 表。 |
| A · [原 Domain Owner `run()`](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/apps/business-dictionary/export-jobs.ts)、[原 HMAC SQL Gateway](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/tools/cv04-isolated-signed-export-gateway.mjs)（2026-11-12） | Owner 实际可凭原缓存加密快照恢复业务执行，已有 SQL signed CAS 必须同时验证 Worker Epoch 与业务 Revision；Attempt=2 是不可越过的预算。 | 调度器不调用原资源表 DML、不允许直接控制 Owner 结果，必须经注入的现有 signed `runWork`，失败不标记 DONE，未来 sweep 才可在双 Lease 到期后重试。 |
| A · [现有到期清理](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/apps/business-dictionary/export-job-pg-maintenance.ts)、[原 SQL Lease PG16 回归](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/tests/agent-line/cv04-export-host-worker-sql-lease.test.mjs)、[原签名 PG16 回归](https://github.com/jiangxng/EVO-App-Platform/blob/42389e2dfe27b7ec959b3c6c57d8ee50b8d65647/tests/agent-line/cv04-signed-export-gateway-pg.test.mjs)（2026-11-12） | 到期清理只扫描 `expiresAt<=PG now` 的任务，不能表示 Runnable Job；先前测试由两独立 SQL 会话模拟重领而非实际 Worker OS 进程被终止。 | 单独增加 PostgreSQL meta-only Runnable 入口及真实 `node` 子进程 `SIGKILL` 测试；分别证明 Host 两个独立连接并发排队与不同 Worker 进程重领，不偷换成两台生产 Host 或跨网故障证明。 |

**比较**：选择复用原 Permit/Lease/Epoch/Resource CAS 并由 PostgreSQL DB 时间判定一秒冷却；排除 Node 内存队列/自动重试、建立另一张工作租约、借用 CV03 Signed View Gate、把 SQL Host 元数据视为 live 授权或把 Worker SELECT 原表当任务读取。新增 `createIsolatedDictionaryExportPgDispatcherV010` 仅作为可显式调用的**一次 sweep**、要求每任务 fresh Host 审批；不是常驻调度服务。实现细节及负向验收入口记录在 [现有 SQL Host/Worker 纵切文档](CV04-SQL-HOST-WORKER-LEASE-20261112.md) NEXT-04。

**待查 C / 界限**：真实不同物理 Host 节点崩溃/网络分区与一致性时钟、PA05/T0 事件认证、独立 KMS、长期任务唤醒服务、真实上线授权故障闭环、WAL/WORM/备份清理、Personal Agent 会话、正式 EXPORT/SAVE 准入仍未认证。下一步先验真实 PG16 和最终 HEAD CI；成功后单独核对 protected-main、东京 TLS/Basic Auth 与 Branch Hygiene。正式 EXPORT OFF、CV03 `N1=NOT_CERTIFIED`，SAVE OFF，PR #1184 独占文件不碰。本轮无新增第三方网站资料/截图。


## 12. NEXT-04b — 隔离 Polling Controller 自动唤醒 / Host OS 进程退出重启（2026-11-12）

此节继承前述目录但**不补造**外网访问，所有本轮引用均来自 2026-11-12 实际读取的仓库源码、测试和 Actions，按 A/B/C 分级。之前 #1283 只能证明独立 Host SQL 会话＋Worker OS 子进程；本轮额外补真实 **Host OS 进程** 重启与显式启动的轮询器，仍不是跨机器容灾。

| 等级 / 标题与原始网址 / 查阅日期 | G：直接来源事实 | D：采用和排除、项目用途 |
| --- | --- | --- |
| A / [CV04 原 Dispatcher `main@e68928e`](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/apps/business-dictionary/export-job-pg-dispatch.ts) / 2026-11-12 | `sweep()` 是独立调用的 bounded dispatch；没有周期唤醒/停止/容错式自动重启，授权依赖每次 `authorizeFresh`，工作状态保存在已有 SQL Permit/Lease/Epoch。 | 直接在该模块新增 `createIsolatedDictionaryExportPgPollingV010`，`start/stop/done` 单飞有界空闲退避；不引入新调度表、Redis、永不退出内存队列或后台服务。 |
| A / [原物理 SQL Lease](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/apps/business-dictionary/export-job-pg-sql-lease.ts)、[原签名 PG16 回归与子进程 Helper](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/tests/agent-line/cv04-signed-export-gateway-pg.test.mjs)、[原 PG Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/.github/workflows/cv04-signed-export-pg-gateway.yml) / 2026-11-12 | Lease Epoch=1→2 与签名 CAS Revision 是 DB 权威；旧 #1283 PG16 做过 Worker `SIGKILL`，但 Dispatcher **Host** 仍为同一个 node:test 父进程。 | 新增 Host 子进程使用**自己的** PostgreSQL Host/Worker 连接，通过实际周期 Polling 获取真实物理 permit，`SIGKILL` 后另一 Host 进程重新从 PG 扫描并领取 Epoch=2。父进程只在 disposable fixture 代签业务 CAS，**不证明真实生产独立签名服务高可用**。 |
| A / [原 NEXT-04 部署与研究约束](https://github.com/jiangxng/EVO-App-Platform/blob/e68928ed4ee600e7a0ef09e6fdaa5db3db590ca0/docs/plans/foundation-list-experience/CV04-SQL-HOST-WORKER-LEASE-20261112.md) / 2026-11-12 | Host 仍无生产签名授权 outbox 与 KMS，调度是 isolate-only；没有物理异地时钟/网络分区 SLA。 | 继续保持正式 EXPORT OFF、CV03 `N1=NOT_CERTIFIED`/SAVE OFF，禁改并行 #1184 所有权文件。 |

**工程状态和证据分界**：本次最终 HEAD 的真实 PG16 新 marker、含原有审计/Owner 的 full regression、main/东京/Branch Hygiene 应在 Actions 原文看见后再列为 B=已读日志；还未发生时属于 C=待验证。失联后自动恢复当前仅由测试显式启动新 Host 进程（不是 supervisor 自主重启）；真实 PA05/T0 授权源、跨机网络分区、受管 Cron/daemon、完整生产 Owner Signer/KMS、Human/Agent 正式功能均是 C=未验。本节没有外网第三方研究，也没有新的截图/附件。


### B / NEXT-04b 第一轮原始测试证据（2026-11-12）

- [PR #1284 第一轮原始 PG16 Actions #43204722304](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43204722304) / [源日志 job #131136864897](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43204722304/job/131136864897)，源代码 HEAD `16389bd7bccbdc6f70826cf89b56f23513a41421`：真实日志 `CV04_POLL_SINGLE_FLIGHT_BACKOFF_STOP_FAILCLOSED_PASS`、`CV04_PG_POLL_STOP_RESTART_EPOCH_RECLAIM_READY_PASS`、`CV04_INDEPENDENT_HOST_OS_PROCESS_RESTART_EPOCH_FENCE_PASS`，签名+巡检 **18/18 PASS，0 FAIL，0 SKIP**；不可变 Audit **5/5**、加密 PG CAS **5/5**、Owner **8/8**；`CV04_SIGNED_EXPORT_NOT_PUBLISHED_TO_HOST_PASS`。使用独立真实 Node Host OS 子进程，在 disposable PG 内模拟物理 Lease 超时，测试父进程仍保留 CI 签名材料；这不认证生产 signer 的失败恢复。
- 该记录不覆盖此后研究文档更新产生的最终 HEAD；待最终 HEAD CI 全绿、merge protected `main`、东京实际发布和 Branch Hygiene 核实后，应在 PR post-merge evidence 评论按准确 SHA 归档。来源没有额外网页搜索、付费资料或截图；尚未研究的跨物理机网络分区/时钟漂移不冒充已测。


## 13. NEXT-05a / 2026-11-12：正式 PA05/T0 授权源缺口与 CV04 EXPORT 发布阻断证据

> 此节只引用本轮**实际读过**的仓库文件、真实 GitHub Issue/PR 元数据及历史原文报告；不编造生产 Owner 审批、KMS 身份或本轮未重新执行的东京探针。A=读原文；B=读实际当前外部状态；C=尚未独立核验。

| 等级 / 2026-11-12 访问标题、原始链接 | 来源事实 G（证据边界） | 当前决策 D / 具体用途 |
| --- | --- | --- |
| **B / 已读真实 Issue** [CV03 生产授权 Owner 签署 #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) | 当前 `OPEN`，描述为 `PENDING OWNER SIGNOFF`、`N1=NOT_CERTIFIED`。五项已勾选架构方向；正文明确真实 Owner 的具名/日期/环境/签署链接仍必需，不能代表生产权限。历史最新评论包含 CV03 Tokyo 只读 GET/T0 QA 及来源证据，**不构成 CV04 EXPORT 单独 Owner 签核**。 | CV04 依赖共享的 PA05/T0 权威事件源/正式 Producer，故不能以复选框、CI PASS 或 Tokyo 预览健康替代授权。Live Gate 必须每次查询真实 Issue 身份；Issue 意外关闭只触发人工复核而不是放行。 |
| **B / 已读真实 PR** [#1184（Owner 受管文档）](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | 本次查询仍 OPEN，三份受管文档独立工作线。即使随后该 PR MERGED，仍**不是** CV04 正式签署/KMS 认证。 | 不修改该 PR 所管理文件，门禁只查元数据、绝不以它变为 merged 作为自动审批。 |
| **A / 已读源码** [既有 CV03 N105c09 release gate](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/tools/cv03-n105c09-owner-evidence-release-gate.mjs)、[原回归](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/tests/agent-line/cv03-n105c09-owner-evidence-release-gate.test.mjs)、[原 Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/.github/workflows/cv03-n105c09-owner-release-evidence.yml) | 上游 guard 已有只读 GitHub #1212/#1184 身份、对 checked boxes 的反向判定、不可 Certify、Saved View OFF 和源漂移报警；重写会重复框架与失去一致性。 | 新 `cv04-next05-production-authority-release-gate.mjs` **复用上游 gate**，仅针对正式 Dictionary EXPORT 未注册、Owner/PG/Lease/Poll 生产隔离做新增独立断言，避免重复生产认证器。 |
| **A / 已读源码** [CV04 原 Owner](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/apps/business-dictionary/export-jobs.ts)、[原加密 PG](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/apps/business-dictionary/export-job-pg-store.ts)、[原 Lease](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/apps/business-dictionary/export-job-pg-sql-lease.ts)、[Polling](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/apps/business-dictionary/export-job-pg-dispatch.ts)、[Signed SQL](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/tools/cv04-isolated-signed-export-gateway.mjs) | 真实 Domain Owner 可以在隔离 PG16 内运行，但 `NODE_ENV=test` 和 `isolatedTestOnly` 是硬门禁；当前 SQL Principal/Operation mirror 与 HMAC 由一次性 QA 手工生成，不存在真实 T0 Outbox/独立 KMS 绑定。 | 通过源码反例测试检查任何生产环境绕过、新 Host/Catalog 正式 operation 注册、失去隔离 schema 等均 RED；正常 GREEN 仅代表 `EXPECTED_BLOCKED_BASELINE`，不提供启用 API。 |
| **A / 已读原报告，非本轮真实东京重测** [CV03 N105c12 Tokyo Provider 候选 GET 证据](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/docs/plans/foundation-list-experience/CV03-N105C12-LIVE-PROVIDER-CANDIDATE-READONLY-20261112.md)、[N105c10 Owner 切换契约](https://github.com/jiangxng/EVO-App-Platform/blob/81262c348b2abf0440ddc0501495aa9c572f2e23/docs/plans/foundation-list-experience/CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md) | 历史 Tokio GET 发现唯一静态 AuthorizationProvider 候选、0 binding，不是请求时 `check` 的事务证明；同一正式 ACID T0 为方案 A 但 Scope generation/水印/密钥和真实 Owner 仍待审批。 | 不克隆另一套模拟 T0；CV04 的真实生产入口必须等正式 PA05/DB/Security/Domain Owner 独立签署后再另 PR 最小接线。 |

**比较与排除（D）**：采用复用上游 Owner evidence gate + 增加 CV04 产品入口/Stage 关闭一致性检查；不采用从静态 Policy `ALLOW` 直接签发 Export、用 QA SQL LOGIN/手工 mirror 充当 T0、拷贝测试 HMAC 作生产 KMS、把五个勾选框当审批、创建另一套 Owner 审批/调度框架。保留 Human/Agent 正常页面 CSV 与正式后台跨页 EXPORT 的严格边界。正常的 **绿色是维持禁止状态**；任何非预期源漂移显示 RED 交真正 Owner，而不是“自动可发布”。

**C / 当前未取得**：生产真实 T0 Source/Outbox 和完整所有 Enterprise+Actor+Operation+Feature scope snapshot，生产 Owner 签署与可核对的 Review，真实 Producer/SQL 权威身份、KMS/HSM 密钥轮换、两个不同物理 Host 断网/恢复、正式 Agent 与 Human 全链路、归档与合规保留。本轮没有新第三方网页/截图。**正式 EXPORT OFF、CV03 N1=NOT_CERTIFIED、SAVE OFF，#1184 受管文件未修改。** 新 PR/Workflow 的实测 6/6、Live GitHub 读取、精确 HEAD、protected-main、东京若运行及 Branch Hygiene 均需以真实 CI 结果为准。


### B / NEXT-05a 第一轮真实 Live Gate 原始日志（2026-11-12）

- **失败原始来源（不可误写为 PASS）**：[Actions #43208158346](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43208158346) job `131148526302`，源代码对抗回归 **5/6 PASS、1 FAIL**；仅存一处 test-only SQL Lease 字符串仍被门禁误判正常，实际 SQL `install` 子分支 guard 已遭用例削弱。修复为分别检查 **install/use** 和 **dispatcher/poller** 各两个 test-only 拒绝位置，增强对应反向测试。
- **修复原始来源**：[Actions #43208410247](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43208410247) job `131149367497` 的真实日志：六项固定安全反例 marker、`ℹ pass 6`、`ℹ fail 0`、`ℹ skipped 0`；从真实 GitHub 读取 #1212 Issue / #1184 PR 的 check 通过，且明确输出 `CV04_NEXT05_NON_CERTIFYING_RELEASE_GATE_TERMINAL_PASS`。**只证明“必须继续 OFF”**，并不证明真实 PA05/T0 Signer/KMS 可信。
- 再次强调：当前研究文档修订后 PR HEAD 会变化，必须以**最终 HEAD** 安全门禁及受保护 `main` 单独核对，不把旧成功沿用至新 SHA。实际生产认证仍属 **C=未验**，无新网页/截图。


## 14. NEXT-05b：东京运行中正式 EXPORT 缺席的只读目录证据（2026-11-12）

> 新增 CV04 自身的 **live runtime** 信息；区别于 #1285 静态源码关闭门禁、已有 CV03 N105c11/12 的 Provider 候选/原库目录库存。完整设计、来源、风险和回填位置见 [CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md)。本节的 B 真实物理结果必须以**本轮 protected-main Actions 原始 job 日志**验证，不能凭 PR 代码预填 SUCCESS。

| 访问等级 / 原始来源 / 2026-11-12 | 来源事实 G | 实际用途 D / 不能推断 |
| --- | --- | --- |
| A · [Manager Host GET 路由](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/manager/server.ts)、[Service Catalog](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/manager/service.ts) | 运行 Host 提供 `GET /v1/catalog`、`GET /v1/platform/snapshot`、Provider effective/bindings。返回 Catalog/运行快照，不是特定 export 请求的真实审批调用。 | 使用无副作用的 GET 验证已知正式 `dictionary.collection.export.job.*` Operation 不在运行中的 Catalog，辅以 #1285 源码门禁；**不能反证所有可能未入 Catalog 的动态 Host Action**。 |
| A · [已有 CV03 东京只读工作流](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/.github/workflows/cv03-n105c11-tokyo-live-authority-readonly.yml)、[Compose](https://github.com/jiangxng/EVO-App-Platform/blob/ef705935332d5b13976ad8459e193e99a59df0c3/deploy/tencent-tokyo/compose.yaml) | 保护主线的 `evo-tokyo-dev` Runner 有固定 SSH 身份、可进入现有健康容器；真实原库的 `pg_catalog` 可以在 PostgreSQL READ ONLY 模式查询。 | 建立 CV04 单独的物理 read-only 工作流：只查 CV04 非 QA SQL 前缀函数/表的数量、已知 `evo` 超管登陆事实。不复用 QA Schema 作为正式 T0，绝不生产 DDL/DML/KMS。 |
| B · [真实 Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | 本次开始仍 OPEN/PENDING，既有签署需求仍未消除；受管 #1184 未修改。 | 只有 Owner 可决定实际认证身份、Scope、Outbox/KMS 与生产接线；只读检查 **GREEN 不能提升 RELEASE**。 |

**排除方案**：不执行测试用 Owner `request()` 对真实环境写入、不打 POST 探测未知 Action、不查询具体业务对象/策略，不创建第三套 Authority 或生产 SQL 角色，不在 PR 阶段读取 Tokyo secrets。保留 CV03 `N1=NOT_CERTIFIED`、SAVE OFF、正式 EXPORT OFF。需要读源之外的真实工作流记录时按准确最终 commit HEAD、run/job 链接、已查看 marker/快照 SHA、真实 Branch Hygiene 状态回填；任何未执行的步骤标 C=待验，不将源码假设称物理证据。


### B / NEXT-05b 首个实际受保护 main 东京 Host+原 PG 只读证据（2026-11-12）

- **已读原始来源**：[PR #1286](https://github.com/jiangxng/EVO-App-Platform/pull/1286) 合并保护主线 `main@efbcaf8b7fc9228ff500fed729870736a0a04c67`；[东京只读 Actions #43211654823](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43211654823)，[原始 Job #131160514844](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43211654823/job/131160514844) **SUCCESS**。本次确实读取了源日志，而不是仅依赖历史报告或 Actions 状态。
- **现场 G 事实**：运行镜像 SHA `81262c348b2abf0440ddc0501495aa9c572f2e23`，与本轮 workflow main SHA 不同；真实运行容器健康；GET Catalog 没有列出三个已知正式持久 Export Job Operation；live Provider 候选仍是一个静态授权候选、binding 0；Saved View Feature 未激活；原 `evo_dev` 的非 QA schema 内已知 `cv04_export_%` 函数和表计数均 **0**；原 `evo` SQL Session 是超级用户而非可接受的最小权限签名 Producer。所有日志只输出固定标记、不输出业务数据。
- **物理 terminal**：`CV04_NEXT05B_LIVE_CATALOG_FORMAL_EXPORT_ABSENT_PASS`、`CV04_NEXT05B_ORIGINAL_PG_NONQA_EXPORT_OBJECTS_ABSENT_PASS`、`CV04_NEXT05B_ORIGINAL_SQL_USER_IS_SUPERUSER_NOT_PRODUCER_PASS`、`CV04_NEXT05B_PHYSICAL_READONLY_TERMINAL_PASS` 等源日志标记均存在。对应的完整选择/限制见 [NEXT05b 详细现场报告](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md) §5。
- **D/C 不变**：这只证明运行中的已知 Catalog 名称和 SQL 前缀范围，没有证明未注册的其它 Action、未知 SQL 名或真实 Provider `check()` 的正式 PA05/T0 授权来源。#1212 独立 Owner 签署仍 OPEN/PENDING，不能凭零对象或静态候选给出 KMS/Signed Producer/正式 EXPORT 认证。正式 EXPORT OFF、CV03 `N1=NOT_CERTIFIED`、SAVE OFF，#1184 受管资料不动。此 docs-only 证据补录也不能当作重新部署了最新 Runtime 镜像。


## 15. #07/07 最终合并证据、冲突收口与下一窗口决策矩阵（2026-11-12）

> 本节是迄今**最新**的研究与决策结论，以 [最终交接入口](CV04-WINDOW-20261112-POSTMERGE-0707-HANDOFF-ENTRY.md) 为唯一窗口接续入口。前文 §1 的 `main@91356...`、#1276 未清理，以及 §9–14 部分“待验”描述，只记录各阶段**当时**事实，已经被本节及对应原始 Actions 后续证据推进，不得误作当前完成状态。文档合并还会产生一个比下列起始 SHA 更新的 commit；请实时读取 GitHub main ref，不要将任何历史 SHA 当固定最新值。

### 15.1 来源等级与交叉证据（不补造未访问资料）

- **B，直接取回 GitHub 原始 PR metadata**：本轮逐项核验 [#1276](https://github.com/jiangxng/EVO-App-Platform/pull/1276) CLOSED/NOT MERGED、[#1277](https://github.com/jiangxng/EVO-App-Platform/pull/1277) MERGED、[#1278](https://github.com/jiangxng/EVO-App-Platform/pull/1278) MERGED、[#1279](https://github.com/jiangxng/EVO-App-Platform/pull/1279) MERGED、[#1280](https://github.com/jiangxng/EVO-App-Platform/pull/1280) MERGED、[#1281](https://github.com/jiangxng/EVO-App-Platform/pull/1281) MERGED、[#1282](https://github.com/jiangxng/EVO-App-Platform/pull/1282) MERGED、[#1283](https://github.com/jiangxng/EVO-App-Platform/pull/1283) MERGED、[#1284](https://github.com/jiangxng/EVO-App-Platform/pull/1284) MERGED、[#1285](https://github.com/jiangxng/EVO-App-Platform/pull/1285) MERGED、[#1286](https://github.com/jiangxng/EVO-App-Platform/pull/1286) MERGED、[#1287](https://github.com/jiangxng/EVO-App-Platform/pull/1287) MERGED；所有 merge SHA 见简短入口 §2。#1276 的旧来源分支先前因与 #1274 的并行修改而冲突，**已被 #1277 内容吸收**。根据 [#1280 PR 原始说明](https://github.com/jiangxng/EVO-App-Platform/pull/1280)，Actions 在删除前重新校验六个相同 blob SHA、第七处 README 文案等价和没有 OPEN PR 引用。本轮实际查询旧 `feat/cv04-export-pg-active-expiry-maintenance-20261112` 分支为 **absent**。**不得再把 #1276 当未处理分支或重开旧合并。**
- **B，直接取回保护主线 API**：本轮起始 `main@6245f549dd1b97a4989499f8241f5702409a2047`（[#1287](https://github.com/jiangxng/EVO-App-Platform/pull/1287) 合并提交），GitHub Check API 原始返回 **5 SUCCESS + 2 SKIPPED**（`preflight`、`source-owner-export-closed`、`lightweight-host`、`tokyo-live-export-readonly`、`continuity` SUCCESS；`source-syntax` main-only 跳过，`deploy` docs-only 跳过）。[Tokyo release Actions #43212673155](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43212673155) preflight SUCCESS、deploy SKIPPED：前一窗口原始 log `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE`；实际 Runtime SHA 与 workflow/main 提交明确不同。
- **B，直接核验真正物理读源**：[受保护 main Tokyo live Catalog/PG read-only #43211654823](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43211654823)、[再次复验 #43212637430](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43212637430)。本轮阅读了相应已归档原始现场证据，其 job/marker 索引见 [NEXT05b 东京报告](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md) §5 和 [PR #1287 evidence comment](https://github.com/jiangxng/EVO-App-Platform/pull/1287)。**运行镜像 `81262c348b2abf0440ddc0501495aa9c572f2e23`**，live Catalog 不列出指定后台 EXPORT 操作，授权 Provider 候选为静态 1、相关 binding 0；非 QA 命名 SQL `cv04_export_%` 函数/表 **0/0**，实际 `evo` 数据库登录是 superuser。事实范围只限“已知名字/当前状态”，不是整个数据库审计或生产签名、授权核验。
- **B，直接读取真实当前 Owner 信息**：[Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 于本轮仍 **OPEN**，正文明确 `PENDING OWNER SIGNOFF` 与 `N1=NOT_CERTIFIED`，要求 *具名、角色、日期、审批链接、真实环境* 的独立 Owner 审议；复选框 5/5 不等于批准。[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 仍 OPEN，不允许占用其受管文件。其最新评论中的单条 `N/A` 未提供真实签署，不能冒充批准。
- **A，本轮实际读取项目源码/原报告**：旧 [#1278 简短交接原文](CV04-WINDOW-20261112-POSTMERGE-0707-HANDOFF-ENTRY.md)、[NEXT05b 只读原文](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md)、[原 Signed PG 设计](CV04-SIGNED-PG-EXPORT-GATEWAY-20261112.md)、[原 SQL Worker/Host 设计](CV04-SQL-HOST-WORKER-LEASE-20261112.md)、[原 Tokio CV03 Provider GET Workflow](../../../.github/workflows/cv03-n105c11-tokyo-live-authority-readonly.yml)、[最新 CV04 源码关闭门禁](../../../tools/cv04-next05-production-authority-release-gate.mjs)。C 级未取得信息仍包括真正 PA05/Authorization/DB/Security/Domain 的生产 Owner 签署、独立 KMS/HSM 生产密钥、独立两个物理 Host 网络故障及真正 PG 主库 failover/rollback。不曾访问新第三方外网资料或截图；**仅搜索摘要：无**。

### 15.2 原始可复验工程证据（新旧阶段不能互相替代）

| 证据对象、原始 URL | 已验证的范围 | 不得夸大的限度 |
| --- | --- | --- |
| [#1282 PG16 #43198584059](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43198584059) | 实际 Owner `request→run→READY`、签名多阶段审计和受限 Worker ciphertext 读取，13/13 | 一次性 CI 签名密钥非生产 |
| [#1283 PG16 #43202040149](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43202040149) | 15/15；两个独立 Host SQL 会话/Worker OS child `SIGKILL`、物理 lease+签名 epoch=2 恢复 | Host 是两个 SQL 连接，不是两台物理机器 |
| [#1284 PG16 #43205084273](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43205084273) 与 [真正东京发布 #43205607662](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43205607662) | 18/18、独立两个 Host OS 进程实际重新创建 SQL pool，start/stop/poll/reclaim; 实际 Runtime SHA=81262c...，HTTPS/Basic Auth PASS | 同一个 CI Runner 内不同进程；没有生产 daemon 或独立 Signer HA |
| [#1285 首次红灯 #43208158346](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43208158346) → [修复后主线 #43209191737](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43209191737) | 5/6 FAIL 暴露 Lease installer/test client guard 漏检，修复后 6/6 + 实时 Issue/PR 源一致性检查 PASS | **门禁 GREEN 只表示持续拒绝上线**，不是自带认证 |
| [#1286 实机 #43211654823](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43211654823) → [#1287 实机复验 #43212637430](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43212637430) | 实际运行 Host GET Catalog/Provider 与原 PG 目录 `READ ONLY`，明确旧镜像 SHA，已知正式 EXPORT 入口未出现 | 仅已知 Operation 名称及 SQL 前缀、无未知 SQL 全域审计，Owner 签署仍待定 |

### 15.3 决策对比、矛盾与不可跨越的准入前置条件

- **已采用的工程路线（D）**：轻量 Host + 原 Eidos/Platform Capability/ActionRouter + **唯一 Dictionary Domain Owner**；PG 加密 `putIfRevision` + 统一签名 SQL CAS + 独立 immutable event audit + 独立最小权限 Host/Worker permit + bounded epoch 1→2 + 同一个 test-only dispatch/poll。复用现有 PA05/T0 Shared Authority 研究，生产目标方向为**同一 ACID T0 + 完整 outbox/epoch/source generation/scope**。优点是职责不分裂、测试已验证 CAS/租约/Worker 恢复；限制是所有当前证据仅在隔离授权镜像和 CI Signer 下成立。
- **明确排除的路线（D）**：不把静态 Provider 唯一候选当 live `check()` 的真实持久授权；不拿测试 PG schema/人工 mirror 或东京现有 `evo` **superuser** 当生产 Producer；不把五个 Owner checkbox 当署名决策；不复制/另起第四套 Export Queue/Lease/Owner 或 CV03 Signed View Gate；不为“看起来完成”注册正式 EXPORT、不在未证实 KMS/回滚下对原 PG DDL/DML；不把 Runner 两进程当跨物理 Host 高可用。
- **尚存的证据冲突（G）**：仓库静态源码/CI 已有高覆盖率 signed CAS、Auth mirror、Host/Worker fence，**而真实东京运行 Host 的 Provider 仍为静态候选、binding=0，生产原库没有已知 CV04 Export SQL 对象**。解释不是“代码无效”，而是**隔离 QA 能力尚未接入生产权威事实源**。下一个窗口不能以继续增加镜像 PASS 覆盖此间断。
- **尚待 Owner 明确决定（C）**：PA05 Lifecycle/AuthorizationProvider Owner 给出实际部署 Provider ID、full-scope `enterpriseId,subjectId,actorType,operation,featureId,authorityEpoch,sourceGeneration`、deny/tombstone 快照/水印、outbox 原子提交与事件落地次序；DB Owner 给出生产 PG 最小权限真实 role、Schema/GRANT、WAL/PITR、迁移与回滚验收；Security/Ops Owner 给出真正 Producer workload identity/KMS key lifecycle、rotation/revoke、网络分区停机和应急响应；Domain Owner 验证同企业/跨企业 Human + Personal Agent 全链与 390px/1280px 下载时再次授权。
- **放行逻辑（D）**：只有以上**真实 Owner 在 #1212 或独立决策 PR 具名签署并伴随实际运行环境/Commit SHA/证据链接**后，才在独立 PR 做最小生产接线 + 双物理 Host/撤权失败矩阵，随后另审正式 Export 注册。任何非具名审批、CI 自证或者提前部署都不合格。未完成前 **正式后台 EXPORT OFF，CV03 N1=NOT_CERTIFIED、SAVE OFF**。#1184 独立编辑所有权不得侵犯。

### 15.4 立即可执行的下一窗口输入/输出（工程化验收）

1. **输入**：最新受保护 `main`、[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) Owner 决策、[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 并行文件所有权、本入口 §2 的 PR/SHA 表、[#1285 Production Gate](../../../tools/cv04-next05-production-authority-release-gate.mjs) 与 [#1286 Physical Read-only Workflow](../../../.github/workflows/cv04-next05b-tokyo-export-readonly.yml)。
2. **Owner 前置输出**：一份版本化、可核验的真实生产切换记录，至少五类独立 Owner 审查人的角色/日期/来源 SHA/部署环境/审批 URL；敏感密钥绝不能提交。记录要明确失败/回滚顺序、失联 deny、旧 signer epoch fencing 和完整 scope watermark 对账，且不含“仅测试环境成功即可放行”之类假设。
3. **得到这些真实材料后才执行**：最小 PA05/T0 Producer/Provider/KMS/Owner signed CAS 接线及双物理 Host 故障验收；每个小阶段单独 PR，精确 HEAD CI、受保护 main 与真实部署日志证据不可省略；真正产品 Action 则仍是**再后一阶段**。
4. **若 Owner 证据继续缺失**：继续保持明确 BLOCKED 状态；只可做不升权的源核对、只读物理扫描、对抗性禁止发布测试或补全原始证据。禁止自动签署、创造虚假密钥身份或部署生产 schema。

## 16. Window 08: LIVE main 核对、SOURCE download-only 负例（2026-11-12）

本节是 §15 后续增量。等级 A=本次直接读取 main 源文件全文/指定片段；B=本次直接读取 GitHub API 状态；C=继承原报告但本轮未独立重读现场 Job 原始日志。**不得把 CI 或自动续跑当成生产授权签署。**

### G — 新核查的精确来源

| 证据 | 直接观察与适用范围 | 工程用途 |
| --- | --- | --- |
| B：[main SHA](https://github.com/jiangxng/EVO-App-Platform/commit/63b22c4c81c51165a2f99486f0345be2e6efb3ea)、[#1288](https://github.com/jiangxng/EVO-App-Platform/pull/1288)、精确 commit check-runs（2026-11-12） | main=63b22c4…，#1288 MERGED；5 checks 中 4 SUCCESS + 1 SKIPPED（docs-only deploy）。 | 防止把历史起始 SHA、docs-only skip 误判为新镜像发布。 |
| A：[CV04 已有负向 Owner gate](../../../tools/cv04-next05-production-authority-release-gate.mjs)、[原对抗回归](../../../tests/agent-line/cv04-next05-production-authority-release-gate.test.mjs) | 原门禁只检查已知正式 request/worker 出现在 Manager 或 Catalog，遗漏 download-only 注册；原测试也未注入 download。 | 在原门禁补齐第三个 operation；对 Manager/Catalog 分别新增 download-only 负例，不另建另一套 Gate。 |
| A：[Provider resolution](../../../manager/provider-resolution.ts)、[静态 Authorization runtime](../../../providers/authorization/runtime.ts)、[未挂载 N1-05b T0 DENY adapter](../../../manager/cv03-n105b-authority-t0-pg.ts)、[Export Owner](../../../apps/business-dictionary/export-jobs.ts) | 可见 Provider binding File/Memory、静态授权规则，CV03 DENY client 明确 unmounted，Export Owner 有 isolatedTestOnly+test 保护。 | 不能据此推断部署中真实 PA05/T0 Outbox、完整 scope、authority epoch、source generation 或密钥已认证；正式 EXPORT 继续关闭。 |
| B：[Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[并行 #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | #1212 OPEN/PENDING OWNER SIGNOFF，五项已勾选不构成具名批准；#1184 OPEN，三份受管文件保持原状。 | 不能自签 Owner、迁移 production SQL 或修改 #1184 文件。 |
| C：[Tokyo 既有现场报告](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md) §5、[此前 Actions #43212637430](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43212637430) | 继承先前只读报告：实际运行 SHA=81262c…，已知非 QA SQL 对象 0/0，evo 为 superuser。此次未重新现场获取；不能扩大到未知 SQL/动态授权。 | 后续有真实 Owner 前置才能做生产 Producer、Signer/KMS 与跨物理 Host 验收。 |

### D — 采用方案、限制与可审计下一步

- 采用原 CV04 NEXT-05a 源码负向发布守卫 + 同一对抗测试；禁止 request、worker、download 三个已知后台 operation 在 Manager 或 Catalog 提前注册。保持已有 Eidos/Platform、PA05、Domain Owner、CAS/PG Lease/Dispatcher，不重复实现。
- 这次只是 known-name 源码防线，不是对所有动态 ActionRouter 入口的完整安全审计。已选择的**方案 A：同一 PostgreSQL ACID T0**不改变；本轮未新增生产授权源或 signer。
- 继续等待 PA05 Lifecycle、AuthorizationProvider、PostgreSQL/DB、Security/Ops、Domain 五种具名 Owner 提供有效环境/角色/日期/来源 SHA/审批 URL、完整 Scope（企业、主体、Actor、Feature、Operation）、Epoch/Generation、Outbox/DENY/Tombstone、水印、最小权限 Producer/KMS、撤权及回滚证据。#1212 不可自行关闭。
- 真正执行结果须以独立 Draft PR 精确 HEAD CI、受保护 main、东京运行镜像身份、Actions Branch Hygiene 原始证据更新；此处不预填 PASS。正式后台 EXPORT OFF/unregistered；CV03 N1=NOT_CERTIFIED，SAVE OFF。

## 17. Window 08 自动续跑 #01/07：正式 EXPORT Operation 命名空间关闭守卫（2026-11-12）

> 继承 §16，沿用同一 NEXT-05a gate、同一六项顶层对抗测试及同一研究索引；不是新安全框架、不是生产 Owner 授权。本增量由实际对照 SQL Gateway 操作枚举发现，原 #1289 三操作检查不完整。

### G — 新直接查看的原文与冲突

| 原文与等级 | 实际观察 | 决策用途 |
| --- | --- | --- |
| **A（main 原文）** [原隔离 Signed SQL Export Gateway](../../../tools/cv04-isolated-signed-export-gateway.mjs) 的 `cv04_export_signed_put` 校验分支 | `requested_op` 明确允许 `dictionary.collection.export.job.request`、`worker`、`download` 和 **`expire`**。它仍是一次性测试 Schema 与手动 Authority mirror，**没有生产 PA05/T0 接线**。 | `expire` 同属后台 Export 能力，不能由于未列在前三项而绕过正式未注册守卫。 |
| **A（main 原文）** [CV04 NEXT-05a 旧关闭门禁](../../../tools/cv04-next05-production-authority-release-gate.mjs)、[旧六项对抗测试](../../../tests/agent-line/cv04-next05-production-authority-release-gate.test.mjs) | 旧 gate 仅检查 `request`/`worker`/`download` 三个全名在 `manager/server.ts` 与 `catalog/seed.ts` 中是否出现；只注册 `expire` 或未来新命名会被漏掉。 | 在**原 gate** 上由操作枚举收紧为整个 `dictionary.collection.export.job.` 前缀，两个正式源码入口均拒绝，原测试新增 expire 与未知后缀各 2 个注入负例。 |
| **B（本轮 Live GitHub）** [Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[并行 PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | #1212 仍 OPEN/PENDING，勾选框非具名生产批准；#1184 仍 OPEN。当前基础 main 为 `0fedfad19319155c27210173c19411877224c899`。 | 无生产 SQL/KMS/Host 变更、不修改 PR #1184 管理的文件。 |

### D — 采用理由与限制

- 选择**整个正式后台 job Operation 前缀**的负向守卫，而非继续手动枚举 SQL gateway 的 operation；它复用已经交付的 CV04 NEXT-05a CI/对抗测试，防止新 operation 名在未来静默遗漏。新增注入只增加原一项测试的内部场景，不改变六项顶层协议。
- 该检查依然是指定 Manager/Catalog 源码的**字面字符串防线**；不构成 AST 级动态别名审计，也不能证明真实运行中所有未知 Action 不存在。Runtime 仍以此前 [Tokyo read-only](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md) 狭义现场证据为限。
- 生产方向仍为**已选方案 A / 同 PostgreSQL ACID T0**。真实 PA05/AuthorizationProvider 完整 Scope、Authority Epoch、Source Generation、Outbox、DENY/Tombstone/水印、DB 低权 Producer、Signer/KMS 的身份、轮换、撤权、迁移与回滚必须由真实 Owner 独立具名签署；本轮代码不实现或宣称这些生产前置条件。
- 精确 PR HEAD CI、受保护 main、东京 preflight/deploy SKIP 和 Branch Hygiene 结果须以真实执行日志分别追证，不提前填写 PASS。正式跨页 EXPORT OFF/unregistered；CV03 `N1=NOT_CERTIFIED`，SAVE OFF。

## 18. Window 08 自动续跑 #02/07：东京实际运行 Catalog 前缀核验缺口（2026-11-12）

**G / 当前 main 与原始来源，A/B/C 分级**：本轮 GitHub Live 读取 `main@b4c0868af6f8e893690ac59cc89234576e698360`，#1212 OPEN/PENDING、#1184 OPEN（B）；直接阅读 [Tokyo CV04 只读工作流](../../../.github/workflows/cv04-next05b-tokyo-export-readonly.yml)、[原隔离签名 Gateway](../../../tools/cv04-isolated-signed-export-gateway.mjs) 和 [NEXT-05b 详细物理报告](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md) §5（A）。发现历史物理 Catalog 只读验证仅检查 `request/worker/download` 三个名字，而原 Signed SQL Gate 已存在 `expire`，上一轮 [#1290](https://github.com/jiangxng/EVO-App-Platform/pull/1290) 的源关闭守卫已经改为同 `dictionary.collection.export.job.` 前缀；真实 Runtime Catalog 检查仍缺对齐（D）。这不是第三方网络材料或新的生产授权事实。

**D / 最小实施**：在**同一个** CV04 NEXT-05b 东京只读 Workflow 内，将运行中 Catalog 检查改为整个 Export Job 前缀；PR-only source-syntax 要求实际 Node 代码包含这个条件与新增独立 runtime marker。其余原 GET/PG READ ONLY、安全输出、exact-main、SSH pin、test-only/Owner 禁令全部保留。输出仅能证明该次东京预览镜像的 live Catalog 未列出这个已知命名空间，不能证明动态别名、未知数据库授权、真实 PA05/T0 Provider.check() 或两物理 Host 已认证。详细旧/新范围区别见 [Tokyo NEXT05b 报告 §6](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md)。

**C / 独立 Owner 阻塞未消除**：真正 PA05/AuthorizationProvider/DB/Security/Ops/Domain Owner 具名生产签署、完整 Scope/epoch/sourceGeneration/Outbox/tombstone/watermark、最小权限 Producer/KMS 和可靠回滚均待核验。不得借此编辑 #1184 管理文件、部署生产 PG、启用 EXPORT 或 CV03 SAVE。实际 PR HEAD/东京现场/Branch Hygiene 结果需在其**原始 CI 完成后**记录，不将 PR-only source check 冒充东京物理验收。


### B / Window 08 #02/07 protected-main actual physical terminal（2026-11-12）

> 这是在原 §18 的 A/D 后、`main` 合并和东京实际运行完成**再独立回填**的 B 级原始证据；不可把该真实东京镜像误报为最新源码镜像，也不能把 Catalog 名字缺席扩大为动态 Provider.check() 或真正生产 Owner 审批。

| 原始来源（本轮直接读取 GitHub API / Job log） | 实际确认 G | 仍不能宣称 |
| --- | --- | --- |
| [PR #1291](https://github.com/jiangxng/EVO-App-Platform/pull/1291) / 完整 HEAD `8b2c5cab80daeed63f48a1b9d5fba00124c2a1d4` | Draft→Ready→MERGED；PR 6 SUCCESS + 1 main-only `tokyo-live-export-readonly` SKIPPED；其中 `source-syntax` 原始 Job [#131258564696](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43240295988/job/131258564696) 出现 `CV04_NEXT05B_READONLY_SHELL_NODE_SOURCE_SYNTAX_PASS`。 | PR 不曾访问东京真实 Host/PG。 |
| [main 合并提交 `b1cabf7f4fdbfee1d88a1de4efcce1286c329af5`](https://github.com/jiangxng/EVO-App-Platform/commit/b1cabf7f4fdbfee1d88a1de4efcce1286c329af5)、[主线东京真正只读 Job #131260449146](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43240834882/job/131260449146) | 原始日志实际输出 `CV04_NEXT05B_LIVE_CATALOG_FORMAL_EXPORT_NAMESPACE_ABSENT_PASS`、`CV04_NEXT05B_LIVE_AUTH_PROVIDER_STATIC_CANDIDATE_ONLY_PASS`、`CV04_NEXT05B_ORIGINAL_PG_NONQA_EXPORT_OBJECTS_ABSENT_PASS`、`CV04_NEXT05B_ORIGINAL_SQL_USER_IS_SUPERUSER_NOT_PRODUCER_PASS`、`CV04_NEXT05B_PHYSICAL_READONLY_TERMINAL_PASS`；PostgreSQL `pg_catalog` 计数断言 0/0，live Catalog 未列出已知 `dictionary.collection.export.job.` 命名空间。 | 未全域扫描未知 SQL 名/动态别名，不能证明 KMS/PA05 T0/完整授权 Snapshot/WAL/两物理 Host。 |
| [原始东京实机日志 #43240834882](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43240834882) 和 [Tokyo 发布判定 #43240882452](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43240882452) | 真实运行镜像 `81262c348b2abf0440ddc0501495aa9c572f2e23`，不同于主线 workflow SHA。preflight SUCCESS 并输出 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=b1cabf7f4fdbfee1d88a1de4efcce1286c329af5`；deploy 正常 SKIPPED，**没有新镜像部署**。 | 无新 Runtime 发布、无实际业务授权 Check 行为证明。 |
| [exact-main checks](https://github.com/jiangxng/EVO-App-Platform/commit/b1cabf7f4fdbfee1d88a1de4efcce1286c329af5)、[Branch Hygiene #43240839175](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43240839175) job `131260464176` | Main 精确 SHA **5 SUCCESS + 2 预期 SKIPPED**（`source-syntax` main-only 与 `deploy` 非 runtime）；原始日志 `DELETED_VERIFIED_MERGED_PR_BRANCH fix/cv04-next05b-tokyo-export-namespace-readonly-20261112 @ 8b2c5cab80daeed63f48a1b9d5fba00124c2a1d4`，分支查询 absent。 | 安全分支清理/绿色 CI 不是正式生产认证。 |

本轮再次直接核验 [Owner Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 仍 OPEN/PENDING（五项勾选非正式签署）、并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) OPEN，未修改其三份 Owner 受管文档。方案 A（同一正式 PostgreSQL ACID T0）及所有 Scope/authorityEpoch/sourceGeneration/Outbox/tombstone/Producer/KMS/迁移回滚前置要求**没有新的真实 Owner 证据**，不得提前接线或开功能。正式 EXPORT OFF/unregistered；CV03 `N1=NOT_CERTIFIED`，SAVE OFF。

这份补录是 **docs-only 原始证据回填**，不能触发新的东京运行镜像，也不必为此重新跑同一 Tokyo PG 物理只读作业；后续 main checks 和东京 deploy SKIP 仍分别核验。

## 19. Window 08 自动续跑 #04/07：Domain Owner 旧租约跨尝试写入阻断（2026-11-12）

**G / 资料等级 A（原文已读）**：[Dictionary Export Owner](../../../apps/business-dictionary/export-jobs.ts)、[原 8 项 Owner 回归](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs)、[现有 Owned Export 专项 Workflow](../../../.github/workflows/cv04-dictionary-export-job-owner.yml)、[PG Encrypted CAS](../../../apps/business-dictionary/export-job-pg-store.ts)、[原 Signed SQL Gateway](../../../tools/cv04-isolated-signed-export-gateway.mjs)。原 Owner 在长任务重领 attempt 2 后，旧尝试失败的 catch 可只凭 `state=RUNNING` 写 FAILED；`append` 可把旧 Worker audit 注入新尝试。原 SQL Gateway 物理围栏与 Node Owner 生命周期不是一回事，不能把 SQL 的绿色结果理解为所有 Owner 路径的同一尝试归属（详见 [Owner 文档 NEXT-06](CV04-DICTIONARY-EXPORT-JOB-OWNER-20261112.md)）。

**D / 采用**：在已存在的 Owner `run()` 开始后固定 `attempt + leaseUntil`，将三种后续写路径（中途审计、最终 READY、失败 FAILED）绑定同一 Job Attempt/Lease；若新尝试重领，旧执行无法污染审计或将新任务失败。原 Owner 协议测试加入双时序阻塞并发反例，不再建新签名网关/资源表/任务系统；专项 CI 从 8 项提升为 9 项。**明确反对**仅用 `state=RUNNING`、基于过期时间的单一推测或依赖内存锁来断言 Owner 写入合法。

**C/P / 边界**：隔离测试时钟与单进程双异步任务只证明本次 Owner Race 行为，不代表真实两个物理 Host 的租约原子证明；正式 T0 sourceGeneration、全 Scope/Outbox、Producer/Signer/KMS 与真实 Owner 签认仍须遵从 #1212/#1184 和 §15–18。正式 EXPORT OFF，CV03 `N1=NOT_CERTIFIED`、SAVE OFF。准确 PR CI、受保护 main、东京部署判定及 Branch Hygiene 证据待实际执行完成后记录，不预填通过。

## 20. Window 08 自动续跑 #05/07：旧 Worker 租约过期但未重领仍可能错误完成（2026-11-12）

**G · A 级本轮直接读取的原文**：[Domain Owner](../../../apps/business-dictionary/export-jobs.ts) `run()`、[原 Owner 9 项测试](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs)、[原专项 CI](../../../.github/workflows/cv04-dictionary-export-job-owner.yml)、[原 Signed PG Gateway](../../../tools/cv04-isolated-signed-export-gateway.mjs)。#1293 的 Attempt/Lease **归属一致性检查**只比较固定值；当 Worker 在 lease 到期后仍未被下一 Worker 重领，原值没有改变，可能迟到写审计、READY/FAILED。SQL Gateway 的物理租约围栏独立存在，但不能假设测试级 Owner 自动继承该时间条件；此处没有声称生产已发生利用，正式 Export 原本就 OFF。

**D · 采用**：在原 `stillOwnsAttempt` 增加由可信测试时钟判定的到期条件，复用它所保护的 AUDIT/READY/FAILED 三处写入。保留原加密快照与 RUNNING 元数据供第 2 次合规领取；拒绝旧 Worker 过期写入，不添加第二套 Worker 系统或文件状态。新增一个**无重领反例**，与已存在的双异步竞争回归互补；详见 [Owner NEXT-06b](CV04-DICTIONARY-EXPORT-JOB-OWNER-20261112.md)。原 CI 预计顶层 10 项并必须全部成功。

**边界与证据级别 C/P**：隔离 `NODE_ENV=test` 时钟与 Owner CAS 不代表正式 PG Producer/Signer/KMS、实际 PA05/T0、跨物理 Host 或完整授权 Scope。Owner #1212 仍 OPEN/PENDING，#1184 的受管文件不更改；正式后台 EXPORT OFF/unregistered、CV03 `N1=NOT_CERTIFIED` 与 SAVE OFF。只有 PR 精确 HEAD、主线、东京实际部署与 Branch Hygiene 的原始执行记录完成后，才能标记相应 B 级 PASS，不提前填写。

## 21. Window 08 自动续跑 #06/07：Export Projection 不可篡改 Collection READ 字段权限（2026-11-12）

**A / 本轮实际阅读的来源**：[Domain Owner](../../../apps/business-dictionary/export-jobs.ts)、[固定五字段 Dictionary Collection READ](../../../apps/business-dictionary/collection-query.ts)、[原页 CSV 序列化器](../../../foundation/collection-query/page-csv.ts)、[原 Owner 10 项协议回归](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs)。当前 Dictionary READ 总是提供五项可读字段，因此**没有证据表明产品存在当前字段信息泄漏**。然而旧后台 `request()` 投影不验证请求字段属于实时 `page.readableFieldIds`，却将请求列表覆盖为其新元数据，绕过底层 CSV 序列化器原有的不可读字段拒绝。此为 List Foundation 动态字段 ACL 复用时的安全设计缺口，非已知生产利用。

**D / 采用**：沿用原 Owner 并添加纯字段投影 `projectAuthorizedDictionaryExportPageV010`，严格执行 `requestedIds ⊆ ownerReadableIds ⊆ knownFields`，保留原行 ID、仅复制获准字段；用受限字段合成 Owner 页面做可执行的负向用例，连同原 Owner 测试一起走既有 Workflow。拒绝直接将请求字段列表提升为可读权限、拒绝在 CSV Serializer 之后再过滤（快照已持久化过宽时为时已晚）、拒绝另建授权层。详细技术依据与限制见 [Owner NEXT-07](CV04-DICTIONARY-EXPORT-JOB-OWNER-20261112.md)。

**C/P**：纯投影没有新授权 Provider 或业务资源签名，未来真正动态列级授权仍须由 Owner/PA05/AuthorizationProvider 提供按主体/Actor/企业的权威 `readableFieldIds`。该工作仍是 `NODE_ENV=test + isolatedTestOnly` 的未注册 Job 基础能力。#1212 仍 OPEN/PENDING 真正生产 Owner；#1184 受管文件未动；正式 EXPORT OFF、CV03 `N1=NOT_CERTIFIED`、SAVE OFF。PR 精确 HEAD、主线、东京镜像与分支卫生要等实际 CI 结果再补原始 B 级证据。


## 22. Window 08 / 自动续跑 #07/07：最终读源、决策与下一窗口可执行资料索引（2026-11-12）

> 本节是 §§16–21 的**增量导航**，不是新第三方网络研究。更新时间 2026-11-12（香港/北京时间）。最终核验基线 `main@1fbf937f24c801b8812340f2da26d76adcc94ad8`，**9/9 check-runs SUCCESS**。本节交接 Docs PR 合并会另生成主线 SHA，必须再核验。新窗口请从 [Window 08 最终交接入口](CV04-WINDOW08-20261112-FINAL-POSTMERGE-HANDOFF-ENTRY.md) 开始。

### 已访问来源（不补造第三方原文）

| 证据等级、标题与原始位置（本轮实际读取 2026-11-12） | 来源事实 G | 对项目的直接用途 |
| --- | --- | --- |
| **A · 本仓库源文件** [Dictionary Export Owner](../../../apps/business-dictionary/export-jobs.ts)，[Domain Collection READ](../../../apps/business-dictionary/collection-query.ts)，[Owner 既有测试](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs) | Owner `run()` 同一 attempt/lease 及时间围栏、快照投影按 owner-readable 先验字段集合做白名单；当前字典 Collection 仍固定 5 项 readable 字段；Owner 构造继续 `isolatedTestOnly + NODE_ENV=test` | #1293/#1294/#1295 原地修补，保持 Eidos/Platform 原列权限边界；**不声称已实现动态主体级字段 ACL** |
| **A · 生产权威 Owner 提案** [CV03-N105C10](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md)，[未挂载 T0 客户端](../../../manager/cv03-n105b-authority-t0-pg.ts)，[未挂载 PA05 生命周期适配器](../../../manager/cv03-n105b-pa05-host-lifecycle.ts) | 方案 A 需要同一 PG ACID T0 锁定 sourceGeneration/authorityEpoch/Scope、DENY/tombstone、Outbox、最小权限 Producer；SQL 签名身份需真实 Owner。现有适配器明文声明 UNMOUNTED，QA 不可生产化 | #1212 生产数据/身份/权限来源的审议模板，杜绝直接接线与无来源迁移 |
| **A · 原发布门禁 + 东京只读 Workflow** [Source Owner Gate](../../../tools/cv04-next05-production-authority-release-gate.mjs)，[Tokyo Catalog 只读 Workflow](../../../.github/workflows/cv04-next05b-tokyo-export-readonly.yml)，[东京设计/物理报告](CV04-NEXT05B-TOKYO-LIVE-EXPORT-READONLY-20261112.md) | 整个 `dictionary.collection.export.job.` 已知正式命名空间须源码和 live Catalog 缺席；东京老库已知 CV04 非 QA SQL 名称 0/0、旧账号是超管，不能做 Producer | 控制 Export **OFF**，明确绿色说明挡住启用，而非通过审批；物理只读不是动态授权 `check()` 证据 |
| **B · GitHub PR 与各自原始日志** [#1288](https://github.com/jiangxng/EVO-App-Platform/pull/1288) ～ [#1295](https://github.com/jiangxng/EVO-App-Platform/pull/1295)，[Owner CI #43249855724](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43249855724)，[PG CI #43249855761](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43249855761)，[最终 main commit](https://github.com/jiangxng/EVO-App-Platform/commit/1fbf937f24c801b8812340f2da26d76adcc94ad8) | 八项 PR 已分别 MERGED；#1295 原 Owner 11/11、真实 PG adapter 5/5；最终精确 main **9/9 SUCCESS** | 复用已交付成果，避免再开同类 isolated Gate/PG/Worker PR；各 PR 评论按 source、preview、physical 级别分开 |
| **B · 东京真实发布原始 Job** [Workflow #43250322812](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43250322812)、[deploy Job #131295528291](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43250322812/job/131295528291) | 原始日志有当前真实运行镜像 `1fbf937f24c801b8812340f2da26d76adcc94ad8`，DEV_LOCAL_HEALTH、PUBLIC_HTTPS、BASIC_AUTH 三类 PASS；并非 Docs-only SKIP | 新窗口确认预览镜像版本/健康，**不得**据此申请生产 Export |
| **B · Owner 现况原始 GitHub** [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | #1212 OPEN/PENDING；勾选框非真实签署；#1184 OPEN、reviews []（本轮所见） | 明确生产准入停机点、不触碰 #1184 受管文件，避免冒充 Owner 认可 |
| **C · 待真实 Owner 认证，未取得原文** 真正 PA05/Provider 持久源、PG Owner 资源/环境身份、Producer/Signer/KMS custody/rotation、两个独立物理 Host、WAL/PITR/回滚/Fail-Closed 验收 | 以上**没有**独立生产来源或具名 APPROVED PR；不可把合成 PG schema / Tokyo 当前超管 / 现场只读负证据填成源事实 | 下一阶段 #1212 先行，获批后独立接线 PR；不提前执行生产 DDL/DML/启用 |

### 方案选择与限制（区分来源 G 与本轮判断 D）

- **已选 D**：共享真实 PG 一次 ACID T0，PA05 生命周期与 AuthorizationProvider 权威同 Scope/epoch/generation、完整 DENY/outbox/水印、DB owner + Security/KMS；仍基于原 Platform + Eidos + Dictionary Domain Owner。源依据：上表 A 的 N105C10 文档（是一份建议/契约，**并非**生产审批）。
- **已排除 D**：静态或文件 ALLOW 作为 SQL Authority、CI 自带的 SQL/HMAC/KMS fixture、`evo` 超级用户、分批 per-subject DENY、仅 Node 事件回调、新并行 Export 队列/框架，以及先开正式 EXPORT 再补安全；理由是都无法建立同一真实 Owner/SQL T0 和旧 Actor/离线 Scope 完整 fail-closed。
- **原证据冲突或局限**：#1289 仅检查三种已知操作，#1290 才覆盖全名前缀；#1291 东京 live Catalog 是对当时旧镜像 `81262c...` 的真正只读证据，**不是**新镜像部署；#1292 属 docs-only；#1293～#1295 后来已真实部署新 SHA。早期文档若称 #1284 镜像“当前”，仅为各自时点快照。当前字典固定五字段，不等于动态字段 ACL，#1295 修复的是**未来扩展边界**。东京 0/0 计数仅覆盖特定 SQL 名称/Schema，不排除未知对象；绿色 Gate 断言 OFF，非生产认证。
- **最值得继续访问的原始来源**：由 PA05 Lifecycle、AuthorizationProvider、DB、Security/Ops、Domain Owner 在 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 提交非敏感真实环境/来源 SHA、审核身份与日期、Approved PR、实际 Provider Binding+策略覆盖、PG role/DDL 迁移与回滚、Signer KMS escrow/rotation、双物理 Host 故障录像/原始日志；再复核原始 production WORM/Outbox watermark。**本窗口尚未读到这些，不能推断不存在，只能标注待提供。**

### 工程落点与终端条件

- **已完成 / 不复刻**：Owner `export-jobs.ts`、PG encrypt/audit/lease、Signed SQL Gateway、worker dispatcher/maintenance、Source Owner Closed Gate、东京只读验收和当前页 CSV；具体原始文件和判断均在新交接入口 §2/4。
- **下一步 P**：先最新 `main` 和 #1212/#1184 审查 → 非侵入只读真实生产来源核验并由 Owner 签认 → Owner-approved T0/Signer/DB migration/rollback → 不同物理 Host 的故障/撤权/全 Scope→产品 Human/Agent 端到端 → 独立产品发布许可。没签署则保持所有正式操作 OFF，禁止在生产操作 DDL/DML/KMS，不用重复 isolated tests 代替这些。
- **待本交接 PR 真正完成后再补**：该 docs-only PR 的精确 HEAD checks、main checks、东京预检与 deploy SKIP、Branch Hygiene 的真实证据，应用原 PR 评论收录；本页不能假设 CI 已成功。
