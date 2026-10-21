# PA05 / E01J4K / K0 — Railway 生产 Draining / PID1 / SIGTERM 独立证据请求（2026-10-21）

> **性质：K0 R5 生产 Operator 的只读证据收集与非生产验证计划；不是变更申请、授权、认证通过或发布操作。**
>
> K0 / 完整 E01J4 / PA05-05 E01–E05 / W06 全部 `NOT_SIGNED`；production material WRITE `OFF`；Issues #988/#979/#913 `OPEN`；#1071/#1074/#1081/#1082 四 Draft 不合并、不部署。**未授权前不改变 Railway draining/overlap、启动命令、生产进程、Secrets、SQL 或 validator。**

## 1. 为什么此证据优先于继续写 Mock

当前**明确区分三种证据**：

1. **Railway 官方已读原文（2026-10-21）**：
   - [Deployments Reference / Singleton deploys](https://docs.railway.com/deployments/reference) — 官方写明：新部署上线后旧部署收到 SIGTERM；**默认给 0 秒优雅关闭时间**，之后 SIGKILL；draining 可调整。**平台默认事实不等于项目生产有效值**。
   - [Variables Reference / User-provided configuration variables](https://docs.railway.com/variables/reference) — `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`（默认 0 秒）、`RAILWAY_DEPLOYMENT_OVERLAP_SECONDS`（默认 0 秒）；变量只是其中一条配置渠道。
   - [Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) — overlap 是两个部署同时运行的时间；draining 是 SIGTERM→SIGKILL 缓冲，**二者不同**。
   - [Config as Code / Deployment teardown](https://docs.railway.com/config-as-code/reference) — `deploy.drainingSeconds`、`deploy.overlapSeconds` 可从配置文件或环境覆盖，存在来源优先级；不能单凭变量名缺失推断最终配置。
   - [Start Command](https://docs.railway.com/deployments/start-command) — 官方写明 **Railpack start command 通过 shell 执行**；Dockerfile/image 部署 start command 覆盖行为不同。无法从代码文件名推断生产 PID1。
2. **GitHub 精确源码已读（2026-10-21，`main@4d291fb31f7a5c429b20be14fb48df687c5a1dac`）**：
   - `package.json` 的 `scripts.start = "node dist/manager/server.js"`；
   - `Dockerfile` 存在，`CMD ["node","dist/manager/server.js"]`，但这**不证明生产实际使用该 CMD**。
   - `manager/server.ts` 已有 `process.once("SIGTERM", ...)`，当前 main 的 stop 序列在后段才注册 5 秒超时，可能在前面的 await 停顿；#1074 Draft 代码已将超时提前且 45/45 CI SUCCESS，**仍未生产**。
   - 仓库全树 2359 项、Git Trees `truncated=false`；未发现 `railway.json`/`railway.toml`、`.railway/config.json`（并不排除 Railway 服务环境自身的有效配置）。
3. **Railway 已连接生产配置只读直查（2026-10-21）**：
   - project `aee4643e-912b-4ca1-ae95-fe4ec64f5601`，environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`。
   - Ledger Configurator service `a8622238-480e-4da3-be6f-60fd0f3e18db`：`config.build.builder=RAILPACK`、`config.deploy.startCommand=npm start`、`runtime=V2`、`sfo.numReplicas=1`、`healthcheckPath=/health`、`staged=null`；`get_service_config` 无明确 `deploy.drainingSeconds` 和 `deploy.overlapSeconds`，变量名列表未显示可匹配项。**结果只能标 `EFFECTIVE_DRAINING_UNKNOWN; DOCUMENTED_PLATFORM_DEFAULT_ZERO; NEED_OPERATOR_PROOF`**。
   - EVO Runtime `4ab51d1b-ea96-4c61-8d91-a65547bda049`：同样 `RAILPACK` + `npm start` + 单副本，但独立仓库，**不能沿用 Host 的 PID1/Signal 结论**。
   - 当前 Ledger Configurator deployment `abe8f368-a45f-4a09-aa07-0f8201bf838e`，`main@4d291fb31f7a5c429b20be14fb48df687c5a1dac`，Railway `SUCCESS/Online` / 1 running / 0 crashed；该 GitHub HEAD 的 commit checks 只出现 2/2 SUCCESS，**不能代替过去 main 40/40 或完整 Ecosystem 认证**。

**相互冲突/未决资料：** 根目录存在 Dockerfile exec-form CMD，但 Railway 配置报告 builder=RAILPACK、startCommand=npm start；这是需确认**实际已部署 image/build/start** 的来源冲突，不可以自行选择一条假设当事实。Railway 默认值为 0 秒，但当前 service 未返回实际 draining 值，这是**风险提示**而非“已确诊生产为 0 秒”。旧已合并 J4J 28/28、#1074 45/45、#1082 真实 Linux /proc 的 11+1 受限测试都**不覆盖**此生产信号/截止时间。

## 2. R5 生产 Operator 无副作用证据矩阵（仅要求，不执行）

| 证据编号 / Owner | 必须交付的原始事实（允许脱敏） | 能判 PASS 的最低条件 | 当前 |
| --- | --- | --- | --- |
| R5-01 Railway Platform Operator | 指定生产 environment、service、deployment 的最终生效 `drainingSeconds` 与 `overlapSeconds`、来源（dashboard/environment/config-as-code/variable）及查验时刻；**不读取 secret 值** | 给出数值、来源、快照 SHA/deployment、审核人；没有配置则明确确认实际默认 0，不根据变量名自行推导 | `UNVERIFIED` |
| R5-02 Runtime/Infra Operator | 实际运行的 image/digest、build method、process PID1/PID/PPID 和信号转发路径，区分 shell/npm/Node/PROCESS child | 来自受权只读部署回执，能证明 SIGTERM 最终到达 Node shutdown handler；无 secret 命令行与环境转储 | `UNVERIFIED` |
| R5-03 Runtime/Infra Operator | **独立非生产隔离环境**按部署等价 image/command 的 signal→closed 的实测 start/stop/end 事件时间线与失败处理 | 外部观察者真实记录信号、HTTP 拒绝新进入、全部进程 child close 和退出身份；有 supervisor 外部 TTL/销毁保障；未经确认回收不得注入 parent SIGKILL | `UNVERIFIED` |
| R5-04 Platform + Runtime owners | 统一关机预算与 SLA：`t_admission + t_cleanup + t_child_reap + t_receipt + safety_margin < effective_draining_seconds`（单位一致） | 每段有可验证原始时间戳与最坏情况范围；若实际 draining=0 或收据不完整，门禁自动 `DENY`；禁将本地单次 753ms 当生产 SLA | `UNVERIFIED` |
| R5-05 Infra/SRE Owner | 实际 Worker/PROCESS child 外部 inventory、scale/restart authority、外部 caller 与 broker 列表 | 覆盖当前、旧代、正在启动/关闭及远端 caller；由独立 owner 签收，另交实际 stop/denial receipts | `UNVERIFIED` |
| R5-06 DBA/IdP/Security/Audit | 生产 PostgreSQL 保护会话二次核查，Human IdP/MFA、凭据旋转/撤销、审计责任 | 同一 `operationId/inventoryRevision/fencingEpoch` 关联可核验外部签收；不在聊天中公开 secret/SQL 内容 | `UNVERIFIED` |

## 3. 推荐实施顺序及“停止向前”条件

1. **先只读收集 R5-01 + R5-02**：优先从 Railway Operator/部署生效元数据直接取得数值、image digest、启动路径；产物只写入 PA05 证据表，暂不碰配置。
2. 如果证实默认 0 秒或未知：**不要**跑生产停机实验，不把测试变绿当通过；由 Operator 在单独非生产环境评估需要的 drain 时长及直接 Node/PID1 启动策略，变更生产仍需用户**额外明确授权**。
3. 再由有合法管理权限的 Infra 在独占非生产实例建立真正 Supervisor + cgroup/namespace/完整 PID 身份、TTL 外部回收和独立退出收据。仅验证监督者活着、目标正常关闭后回执、失败时收尾；**没有独立外部强制回收先决条件，则父 Host SIGKILL 不执行**。
4. 有上述受权独立设施后才设计/批准真正负面注入；将真实多 Worker、Caller freeze、DB session 和真实 Human/DBA 凭据签收分开展示。不把某个 local PASS 升级为 K0 全域 stop。
5. 任何阶段发现来源冲突、缺未授权 owner、部署版本变化或证据过期，保持 `UNKNOWN/DENY`，标注必须重新查验的精确 SHA/部署 ID。

## 4. 交接与红线

关联 [K0 总工作表](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[K0 本窗口持续研究索引](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)、[认证总账](PA05-CERTIFICATION-BASELINE-20261015.md) 和 [Agent HANDOFF](HANDOFF.md)。所有官方链接为**本轮 2026-10-21 已打开的原文**，不是仅查看摘要。源事实、工程判断、生产 Owner 待证事实必须分栏保留。

本轮并未读取生产 secret 值、SQL、deployment logs/SSH/PID1 现场、未进行生产 Validator/停机/重启/扩容、未触碰 Railway draining/overlap、未改变 `project.status.json`、未操作其他 BEX/CP03/Eidos/2D 工作线，也未删除九条历史 PA05 docs 分支。


## 5. 2026-10-21 自动续跑 #07 — 环境隔离与 PID1 取证工具现状

**R5-03 最新真实控制面负证据（`ORIGINAL_CONNECTED_RAILWAY_LIST_SERVICES_DIRECT_READ_20261021`）：** 用户已连接 Railway project `aee4643e-912b-4ca1-ae95-fe4ec64f5601` 由 `list_services` 返回的 environments **只有 `production`**（`98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`）；其下五服务为 Ledger Configurator、EVO Runtime、Postgres、Experience Compiler、App Host Validator。因此**当前这个项目没有可确认的专属 staging/test Railway environment**。不把当前 production 直接拿来试 SIGTERM 父进程故障，也不在生产环境内创建 Sandbox/临时副本/数据库连接。创建受控非生产环境需要组织授权，未得到前仍 `NO_SAFE_RAILWAY_TEST_ENVIRONMENT_CONFIRMED`。

**新的可选非生产设施资料（2026-10-21 实际打开原文）：** [Railway Sandboxes](https://docs.railway.com/sandboxes) / [Create your first sandbox](https://docs.railway.com/sandboxes/quickstart) 说明沙箱是独立 Linux VM、有环境归属、空闲超时、`destroy`，其命令超时路径对进程组发 TERM 并在 5 秒后可升级 KILL，但官方仍说明连接中断等状态可能未知、必须核独立控制面收尾。**来源事实不等于当前项目已经启用或已授权此设施**。因现有连接器无 Sandbox 操作，未创建、未收费、未运行任何沙箱。对 K0 而言它只是比“无外部清理机制的共享 Runner”更适合评估的**候选隔离平台**；任何生产环境 Sandbox 都不在本次授权范围。

**R5-02 新非生产取证工具（2026-10-21 直接读取真实 CI）：** 原工程 Draft [#1082 commit `eb4743e8ed34cf3cd748c3f79781d092c62712f4`](https://github.com/jiangxng/EVO-App-Platform/commit/eb4743e8ed34cf3cd748c3f79781d092c62712f4) 新添 `tests/fixtures/pa05-k0-runtime-process-ancestry-readonly.mjs` / `tests/protocol/pa05-k0-runtime-process-ancestry-readonly.test.mjs`。只查询受控 PID 的 `/proc/<pid>/stat`、`comm` 和 PID1，不访问 `cmdline/environ/fd`、不发信号或创建进程、不读取 SQL/Secrets。它记录 PID/PPID/startTicks、受限 comm 类别、父链终止原因和 PID1 身份，所有 `runtimeSigtermDelivered/effectiveRailwayDrainingVerified/productionOperatorAttestationPresent/globalStopCertified` 均为 false。注意 `comm=node` 不能区分 npm 的 Node 进程与业务 Node：**仍需可信生产 Operator 授权进程身份和 signal receipt**。仅支持已授权非生产环境；不可当作已取得生产 PID1。

- [GitHub Actions Platform run #39541560856 / job #119030399081](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39541560856/job/119030399081) `ORIGINAL_ACTIONS_JOB_LOG_DIRECT_READ_20261021`：**1124 total / 1123 PASS / 1 SKIPPED / 0 FAIL**，新增两项纯只读观测/错误参数拒绝通过，`PA05_K0_R5_PID1_READONLY_OBSERVATION` 记录 `chainLength=9`、`pid1Identified=true`、`runtimeSigtermDelivered=false`、`globalStopCertified=false`；这是 GitHub Runner 观察值，不是 Railway 产线 process chain。该精确 HEAD 的其他 checks 要另核全绿。

**R5-01/R5-02 判定没有升级**：`effective draining/overlap` 的部署级生效值未从 Railway connector 返回；Railpack + npm start 的生产源配置明确，但实际 PID1、shell/npm/Node 身份与 SIGTERM 传播必须由 Operator 提供脱敏现场证明。**R5-03 更新为 `BLOCKED: NO_AUTHORIZED_ISOLATED_RAILWAY_NONPROD_ENVIRONMENT`**，先获合法隔离环境+独立回收能力，再考虑中断实验。K0/E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`，production material WRITE `OFF`。


## 6. 2026-10-21 新窗口接续 — R5-01→02→03 只读再核与效率换路（非签收）

> **事实冻结时间片：2026-10-21，新窗口连接器直接只读结果。** 原交接入口、研究索引与既有 §§1–5 保留；本节只附加此前未记录的*本次重新读取*与开发路径选择。不宣布 R5 取得 Owner 签收，不访问生产 variable values/Secrets、SQL、runtime logs 或 PID 现场，不修改 Railway/生产/主线、不运行 Validator/父 Host SIGKILL。

### 6.1 本轮直接读取的控制面原始事实（与文献默认值分开）

- **R5-01 / CONNECTED_RAILWAY_DIRECT_READ_20261021**：在已连接的 project `aee4643e-912b-4ca1-ae95-fe4ec64f5601`、production environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`，`describe_service` 与 `get_service_config` 一致返回 Ledger Configurator `a8622238-480e-4da3-be6f-60fd0f3e18db`：`build.builder=RAILPACK`，`build.buildCommand=npm ci && npm run build`，`deploy.startCommand=npm start`，`runtime=V2`，SFO 1 replica，`staged=null`。部署 `abe8f368-a45f-4a09-aa07-0f8201bf838e` 对应 main SHA `4d291fb31f7a5c429b20be14fb48df687c5a1dac`，SUCCESS/Online，1 running、0 crashed、0 warning/critical、无 pendingWork。已读接口未包含 `drainingSeconds` 或 `overlapSeconds` 最终生效值，变量名列表也没有对应键，但**变量缺席不等于实际上为 0**。
- **R5-02 / EXACT_GITHUB_MAIN_SOURCE_DIRECT_READ_20261021**：同一 main SHA 的 `package.json` 定义 `start=node dist/manager/server.js`，仓库 `Dockerfile` 采用 exec-form `CMD ["node","dist/manager/server.js"]`；生产配置却是 `RAILPACK + npm start`。在 `manager/server.ts` 第 10276–10311 行附近，`process.once("SIGTERM", ...)` 注册 Node handler；现行 main 的 5 秒 fallback 定时器位于多段 `await` 和 `processRuntimeHost.shutdown()` **之后**，在卡住的前置 await 上可能无法注册。后句是源码静态风险判断，不是现网停止事件的发生证据；#1074 Draft 修正仍未进入生产。本轮未获得真实 image digest、PID1/PPID/shell/npm/Node 进程身份或可信 SIGTERM 抵达事件；**R5-02 仍 UNVERIFIED**。
- **R5-03 / CONNECTED_RAILWAY_PROJECT_SCOPE_DIRECT_READ_20261021**：`list_services` 再次返回该项目只有 `production` 一个 environment、五服务；`list_projects` 进一步只返回当前账号可见的**一个 Railway project**（EVO Ledger Runtime MVP），即当前连接范围内没有另一个可确认的已存在专属非生产项目。这**不证明组织在其他账号/云上没有设施**；不得自行创建或复制生产数据。当前 Railway 连接器未提供 Sandbox create/exec/destroy 动作。独立测试环境及 Supervisor/专属 cgroup/TTL 独立回收仍 **BLOCKED/NOT_VERIFIED**。
- **精确 GitHub 控制面**：main `4d291fb31f7a5c429b20be14fb48df687c5a1dac`；该提交 check-runs 本次返回 **3 条成功记录，其中 continuity 重复，独立 check 名仅 2 个**，不能当作完整 Ecosystem 检查。四条 Draft 的最新 HEAD 均与交接一致：#1071 `cb71fb1d75d3410a30b33ab480e8455fd4f69001` 为 7/7；#1074 `c6d5fca90ebfc41ffa642dc5af2e756a224ec838` 为 45/45；#1081 `a1e8a0941ff5b796816aaea0904b89533191a239` 为 5/5；#1082 `eb4743e8ed34cf3cd748c3f79781d092c62712f4` 为 5/5；均 `draft=true/open/mergeable=true`，不是已合并/已部署。Issues #988/#979/#913 原始状态均 `OPEN`。旧 Ecosystem 10 FAIL/82 SKIPPED 继续保留，未以无关绿色 check 抵销。
- **新增本轮官方文档查询级别**：通过 Railway 官方文档搜索接口，仅返回 [Deployment Teardown — Draining time](https://docs.railway.com/deployments/deployment-teardown#draining-time) 的**搜索章节摘要**，指向 Settings pane、config as code 和 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`。等级为 `SEARCH_SNIPPET_ONLY_20261021`，不是本窗口重新阅读全页；此前交接 §1/原研究索引已记录其 `ORIGINAL_DIRECT_ARCHIVED_20261021`，两种阅读时间片不可合并成“本次原文已读”。

### 6.2 不重复造测试的选择、替代与止损

| 当前最小真实 gate | 首选执行路线 | 可行替代与换路条件 | 没有 Owner 原始事实时的结论 |
| --- | --- | --- | --- |
| R5-01 production effective drain + overlap | Infra/Railway Operator **只读**核对该 deployment 的 Settings 生效值、所有覆盖来源和查验时刻，提供脱敏签收 | 若现有连接器仍不给最终秒数，**不再重复调相同 API**；改由具权限的 Operator 提供设置导出或签名查看回执 | `UNKNOWN/DENY`，不能从默认 0 或变量名缺席推断生产值 |
| R5-02 PID1/image/SIGTERM | 由同一 Operator 交付 image digest、实际 shell/npm/Node/PROCESS 父链及 Node handler 收到 SIGTERM 的可信外部证据 | 如果不适合直接在生产触发信号，只收集正常历史部署的可信已有事件与 read-only 构建证据；信号动态验证移至 R5-03 经授权的部署等价非生产设施 | `UNVERIFIED`，不能用 Dockerfile CMD 或 GitHub Runner PID1 替代 |
| R5-03 独立监督实验 | Infra 授权**无生产数据**的独立环境，先核 Supervisor 进程生命周期、专属 cgroup/等效编排器、枚举权限、TTL 强制回收与外部可信回执 | 比较独立 Railway 非生产项目/环境、经授权 Sandbox 或其他独占 Linux VM；任一候选不能证明 Host 死后仍能独立回收，立即停止该路线，退回设计级/无破坏 preflight | `BLOCKED`；不建生产 Sandbox、不做 parent SIGKILL |

**进度/提效复盘（工程判断，非来源事实）：** 既有 11 项本地 PROCESS + 2 项 preflight + 6 项 synthetic receipt + 10 项 synthetic inventory + 1 项真实 /proc 正常退出 + 2 项 PID1 只读测试足以支持当前局部研发状态。继续为相同缺口堆合成用例只会增加 PR/CI 成本，不会关闭 R5-01/02/03 的独立 Owner 认证门禁。下一轮按项目 [快速反馈与路线止损规程](../governance/FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0.md)执行：先提交**一份合并的 R5-01/02 只读取证请求**，以部署 ID+时间戳+来源为最小回执；R5-03 先判环境/救援能力，缺失即停止危险实验设计；每两轮无新增决定性证据即写四行“假设/事实/选择/下一次验证”，转向拥有证据的 owner，而非重复远程 CI。仅在实改代码时做受影响 L0/L1 → 最终 HEAD required L2 → 独立 L3，绝不降安全门槛。

**本轮门禁未升级：** R5-01 `UNKNOWN`、R5-02 `UNVERIFIED`、R5-03 `BLOCKED`，R5-04–06 `UNVERIFIED`；K0 / 完整 E01J4 / PA05-05 E01–E05 / W06 全部 `NOT_SIGNED`，production material WRITE `OFF`，Issues #988/#979/#913 `OPEN`。四条 Draft 不合并、不部署、活动分支不删除；九条旧已合并历史分支此次未清理。
