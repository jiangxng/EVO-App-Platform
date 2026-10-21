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
