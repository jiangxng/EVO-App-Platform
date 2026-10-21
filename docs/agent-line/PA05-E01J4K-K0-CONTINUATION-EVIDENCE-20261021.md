# PA05 / E01J4K / K0 — 2026-10-21 接续核验、启动期异常与外部监督者门禁

> **Document class:** HISTORICAL_SNAPSHOT + UNSIGNED_CURRENT_GATE_EVIDENCE。新增窗口证据，不替换 [2026-10-21 最终短交接](PA05-E01J4K-K0-WINDOW-FINAL-HANDOFF-ENTRY-20261021.md) / [研究遗产](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md) / 2026-10-20 原始两份文件。仅对本节列出的精确 SHA / 环境 / 时间片成立。**K0、完整 E01J4、PA05-05 E01–E05、W06 NOT_SIGNED；production material WRITE OFF。**

## 1. 本窗口已恢复的项目权威和实际范围

- 严格依 [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) 读取 `project.status.json` → 当前引用的 `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json`；并读取 `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`、Agent `HANDOFF.md`、[PA05 认证总账 §§62–86](PA05-CERTIFICATION-BASELINE-20261015.md)、[K0 拓扑](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)、[K0 证据表](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) 及 [J4K 已选方案](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)。
- **权威层级差异，不是授权:** 全局 `project.status.json.projectContinuity` 的最近结构化快照仍为 2026-10-10 `TR-01B2D2`，包含当时的旧 Railway deployment；这份快照不代表 PA05 的当前执行签收。**依用户安全边界不改** `project.status.json` 或生成的 HANDOFF-LATEST，不借 K0 跨线重绘 TR-01/BEX/CP03/Eidos/2D 的权威。
- 继承原 PostgreSQL18 / OAuth / Lease / NIST 官方研究的真实阅读等级；本轮没有重读其原文，也没有将已存索引伪称新原始证据。

## 2. 2026-10-21 控制面重新核验（非推测）

| 对象 | 本次连接器原始证据 | 结果与证据边界 |
| --- | --- | --- |
| GitHub main | [branch API](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main) | `386f267bcc115fd4e64af74724f2a3aa55199878`，保护分支；[同 SHA check-runs](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/386f267bcc115fd4e64af74724f2a3aa55199878/check-runs) 40/40 SUCCESS；不是旧 schedule 全套 `test:all` 的同范围复跑 |
| Railway Ledger Configurator | 已连接 [Railway 项目](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601)，`environment_status`、`list_deployments`、`describe_service`（只读） | `0cf816e7-3c09-4837-a192-81a682df55be`，`main@386f267b...`，SUCCESS / Online，1 running / 0 crashed，0 warning/critical、无 staged/pending；旧 `5c88b3df...` 为 REMOVED |
| Railway 已连接环境 | 同上 `production` environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3` | 可见五服务：Ledger Configurator、Experience Compiler、App Host Validator（0 running）、EVO Runtime、Postgres；只代表本已连接项目，并非组织级 Worker/caller 全集 |
| Host / EVO Runtime 配置 | `describe_service` 只读、仅变量名称 | 两者 `startCommand=npm start`；Host V2、sfo 1 replica；有效 draining / overlap / PID1 进程树及 SIGTERM 传播未返回；Host 变量名不含 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` **不能推出有效值为零**；两服务 tracing/auto instrumentation OFF |
| [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) 交接 Draft | 交接完成准确 HEAD `375fa97b6ec070bc18b846b91b80b247e20fb4ab` | 7/7 SUCCESS（**本文件后推进 HEAD，必须另查新提交**） |
| [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) Host shutdown Draft | `caccb1b60358b453ef471eaf6abecf1593e4965c` | 45/45 SUCCESS；没有合并或部署 |
| [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 真实负面 Draft | `a1e8a0941ff5b796816aaea0904b89533191a239` | 5/5 SUCCESS；通过表示旧错误时序被成功复现，不是安全合格 |
| [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) PROCESS 修复 Draft | 新 HEAD `6b79d3e3f558a0c46193424edd625700145d19af` | 5/5 SUCCESS；新增隔离启动期第十项真实正向测试，见 §3 |
| 历史真实负证据 | [Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) | `main@eaa5e813...` 定时 run 仍 `completed/failure`、attempt 1，先前原始日志 1815 total / 1723 PASS / **10 FAIL** / 82 SKIPPED。不同 HEAD 的 40/40 或 5/5 不抹除此记录 |
| 认证 issues | [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988) / [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) / [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) | 三者重新读取 GitHub issue，全部 OPEN |

**阅读等级：** 以上为 `ORIGINAL_GITHUB_CONNECTOR_DIRECT_READ_20261021` 与 `ORIGINAL_RAILWAY_CONNECTOR_READ_20261021`；Railway 未暴露的部分必须记 `UNVERIFIED`。

## 3. 第十项本地启动期专项：实际工程、原始日志与限度

**改动归属：** #1082 原活动工程分支；没有创建替代 PR。仅更新 `tests/fixtures/pa05-k0-delayed-process.mjs`（commit [`f23ed262`](https://github.com/jiangxng/EVO-App-Platform/commit/f23ed262c84dbcd910ce355a1de06772d3f5d791)）和 `tests/protocol/pa05-k0-process-shutdown-barrier.test.mjs`（commit [`6b79d3e3`](https://github.com/jiangxng/EVO-App-Platform/commit/6b79d3e3f558a0c46193424edd625700145d19af)）；无生产 Runtime 源码变化，也没有触碰 #1074 顶层 shutdown 代码或 #1081 的负面测试。

- **隔离情形：** 仅特殊测试 package `pa05-k0-activate-hang-process` 的 `activate()` 不返回；child 自带 5 秒 self-exit 保险，父 Host 在测试期间存活。原有九项 fixture 正常逻辑不变。
- **原始 CI:** [Platform run #39530562128 / job #118995237822](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39530562128/job/118995237822)，`ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_20261021`。job `1102 total / 1101 PASS / 1 SKIPPED / 0 FAIL`；新增 `ok 775`：
  ```json
  {"scope":"isolated-local-child","boundedShutdown":true,"startupSettledByChildExit":true,"noActiveRuntime":true,"globalStopCertified":false}
  ```
- 该 job 同时确实输出前九项 `PA05_K0_BOUNDED_*` 的独立 JSON marker（共 **10**），新工程 HEAD [check-runs](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/6b79d3e3f558a0c46193424edd625700145d19af/check-runs) **5/5 SUCCESS**，均为本次直接读取。
- **判定:** `ISOLATED_PROCESS_LIFECYCLE_TEN_CASE_BOUNDED_PASS`（仅特定父 Host 活着、一次性 CI Linux runner、非生产、允许测试 child 自退出）。未通过此测试验证父进程自身 SIGKILL，未识别真实生产 PID1，也未覆盖所有 fork/spawn/IPC 极端异常。该案例以 PROCESS_STARTING 事件作为启动时序屏障，没有单独的 child `activate-entered` 外部签名回执，因此不能扩大为“所有 activation hang 的过程被完整枚举”。用例内 3500ms 是测试断言阈值，**不是**可用于生产的全局 stop deadline。

## 4. 针对父进程死亡的新增定向原文研究（2026-10-21）

| 原始资料与位置 | 阅读等级 | 原文事实 | EVO 的判断及限制 |
| --- | --- | --- | --- |
| [Linux man-pages — PR_SET_CHILD_SUBREAPER(2const)](https://www.man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html)，DESCRIPTION | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | 孤儿子孙进程归属到最近存活的 ancestor subreaper；该监督者可收到 SIGCHLD 并 `wait`，设置不会由 fork 自动继承 | **subreaper 能收尸≠强制让仍存活的 child 退出**；候选独立监督者，必须另有 child 枚举/终止授权/确认流程。没有证据 Railway 当前设此项 |
| [systemd.kill(5)](https://man7.org/linux/man-pages/man5/systemd.kill.5.html)，KillMode/TimeoutStopSec | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | `KillMode=control-group` 对 unit 剩余进程组处理；`mixed` 对主进程 SIGTERM、后续对全组 SIGKILL；`process` 仅处理主进程存在漏下子进程危险；time budget 由实际 unit 设置影响 | **只能作为类比和候选实验平台约束**，绝不冒称 Railway 使用 systemd 或已配置特定 KillMode |
| [Node.js child_process 文档](https://github.com/nodejs/node/blob/main/doc/api/child_process.md)，ChildProcess `close` / `exit` / `error` / `disconnect` | `ORIGINAL_NODE_SOURCE_DOC_DIRECT_READ_20261021` | `close` 在进程结束及 stdio 关闭后发出，与 `exit`/spawn error 不同；发送消息、spawn、kill 也可触发 `error` | #1082 `liveChildren` + `closed` 是**父 Host 活着时的局部过程证据**；无法在父 Host SIGKILL 后出具独立可信回执 |

### 风险选择与安全实验前置门禁

**继续采用：** K0→K6 已选中央 fencing epoch + 组织权威 Worker/caller 清单 + 独立 stop receipt + PostgreSQL session 再核查 + 真正 Human IdP/DBA/审计与 Secret rotation/revocation。新增资料没有推翻已选方案。

**后续可实施但本轮没有实施的安全实验：** 在独立、获授权且非生产的 OS/cgroup 隔离中先启动一个**不随受测 Host 死亡的外部 supervisor**，预登记测试 child 身份（PID + 进程启动时刻/进程树/cgroup/namespace）、核实 supervisor 能枚举并终止所有测试子孙、避免 PID 重用误杀、测试或控制异常时自动 TTL 收尾；只有监督者自身能强制回收并记录可核实退出后，才允许在该平台执行父 Host SIGKILL、重启动期 fork freeze、截止时间与 stop receipt 负面试验。若任一前置能力不具备则保持 `NOT_EXECUTED`。不能在普通共享 GitHub Runner 未配置独立回收权威时直接杀父进程。

**不能采用：** 单次 `pg_terminate_backend=true`、单机文件锁、Lease 超时、本地 `close`、空 runtime map、单一 GitHub CI SUCCESS、Railway 默认设置或测试 IdP 作为 `STOP_CONFIRMED`。

## 5. 分支安全退役审计（不等于实际删除）

原 [2026-10-20 研究索引 §8.2](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 的九条 `docs/pa05-*` 历史已合并分支，今天对每个已知 tip 实施独立 `compare_commits(expected_tip, actual_branch)`、`compare_commits(expected_tip, main@386f267b)`、相应 PR 元数据核查：

- #974 `a5fc71ab`；#1050 `a4d258e2`；#1052 `82f65991`；#1059 `5bf4c9c6`；#1062 `991e34f6`；#1064 `6bcb960b`；#1065 `fe27267a`；#1068 `8fee1e9b`；#1022 `ac261172`。
- **九条全部：** GitHub 原 PR `merged=true`、PR head 与预期 SHA 相同、现存 branch ref 与预期 SHA 完全一致、tip 为当前 main 的共同祖先；没有发现新增独有提交。
- **仍非最终删除签收：** 本次未完整复核所有当前 OPEN PR 引用与每条分支保护状态（早期归档已有旧时间片审计），当前连接的 GitHub action set 又**没有 delete-ref / branch delete / workflow dispatch**。故远端清理 `NOT_EXECUTED`；不得用 force-ref/reset、删文件、关闭 PR 等办法替代。#1071/#1074/#1081/#1082 活动 Draft 分支明确排除。

## 6. 下一最小真实门禁、owner 和安全红线

1. **Host Runtime owner:** 评估 remaining early spawn/IPC fail paths 和 child activation telemetry；对 #1082 新增测试只按十项 bounded PASS 定级，任何新修复继续在现有 Draft 分支迭代。
2. **Infra/SRE owner:** 提供 Railway 真实 production effective draining/overlap、PID1→Node SIGTERM、全实例/PROCESS child/重启扩缩容权威库存、owner 签名及可独立监督的停机 SLA/receipts；没有证据不触发生产操作。
3. **Identity/Security/DBA/Audit owner:** 生产 Human issuer/audience/MFA/撤销 SLA、实际 DB role/session/grants、broker 凭据轮换与审计签名、外部 Runner/Validator/CLI caller 准入；此轮没有读取生产 Secrets/SQL。
4. **安全治理:** 原 [K0 工作表 R1–R8](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) 任何缺失项继续 UNKNOWN/DENY，不能填 0 或“没有”；只做只读查证。
5. **Git/CI:** 四条 Draft 不合并、不触发生产部署；不能关闭旧 Ecosystem 10 FAIL；继续不动 BEX/CP03/Eidos/2D/全局 `project.status.json`。后续合规删除能力就绪仍须再次核 SHA、开放 PR 引用和保护状态。

**本次实际未执行：** 生产 Validator、生产 SQL、生产 Secret 值读取、生产停机/重启/扩缩容、Railway draining/tracing 修改、父 Host SIGKILL、自动孤儿/异常锁清理、分支删除、PR 合并。认证总门禁 **全部 NOT_SIGNED**。


## 7. 2026-10-21 — 第二轮继续：真实 activate 入口和子进程 PID 回收证据（修正第十项强度）

**为什么需要再验证：** §3 早期第十项使用 `PROCESS_STARTING` 事件表示 Host 已准备 fork，但此事件发生在子进程实际加载并进入 `activate()` **之前**。先前 5/5 CI 真实通过，**却不能单凭该事件证明曾进入永久 pending 的 activation**。本次是证据覆盖精度修正，不是宣称旧 CI 失败或另开任务分支。

**已实施，原 #1082 Draft 中原地追加：** `tests/fixtures/pa05-k0-delayed-process.mjs` 仅特殊 disposable package 的 `activate(host)` 通过现成 scoped IPC `host.storage.set("pa05-k0-activation-pid", process.pid)` 将真实 child PID 报给测试内存存储；随后永久 pending，且仍有 5 秒 child 自动退出保险。测试侧覆盖 `PluginStorageServiceV010.set` 捕捉 Host 实际收到的 `packageId/key/PID`，与真实 `pidAlive` 读数交叉检查，不需要调试端点或生产代码分叉。

**精确新增提交：** [fixture 3d0a4a5](https://github.com/jiangxng/EVO-App-Platform/commit/3d0a4a5cb712db42df1caa56722952242cf6d719)；[test HEAD 96caf490](https://github.com/jiangxng/EVO-App-Platform/commit/96caf490dbb5f6ad697a7388baef90dfca0c2287)。中间 `724e058` / `36c700c` 使用 `storage.get` 的真实进入握手，但未取得可供 PID 正反核验的回执；保留历史，以下最终精确日志以 `96caf490` 为准。

**原始动作日志已直接读取：** [Platform run #39532710142 / job #119002307849](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39532710142/job/119002307849)，时间 `2026-10-21T02:24:36Z`（UTC），等级 `ORIGINAL_ACTIONS_RAW_LOG_DIRECT_READ_20261021`。完整 `npm run test:platform` 计数为 **1102 total / 1101 PASS / 1 SKIPPED / 0 FAIL**；真实独立 `PA05_K0_BOUNDED_*` marker **10 个**，第十项：

```json
{"scope":"isolated-local-child","activationEnteredByRealHostIPC":true,"activationCalls":1,"observedChildPidClosed":true,"boundedShutdown":true,"startupSettledByChildExit":true,"noActiveRuntime":true,"globalStopCertified":false}
```

**证据意义：** 第十项不再只有 parent 侧 PROCESS_STARTING，而确实从 child `activate` 经过 Host IPC 返回了 PID，测试证实 `pidAlive(pid)=true`（shutdown 前）及 `false`（shutdown 后）。仍只有**活着的父 Host、一个 disposable local child、单机 Linux Runner**；不证明 parent SIGKILL 后另一实体可以枚举/回收 child，也不证明任何生产实际 deadline。完整 5/5 commit checks 只有在最新 HEAD 逐项 SUCCESS 后才可另行认定。

## 8. 新查阅的 Linux 原文：外部监督与停止回执的选择条件（2026-10-21）

以下是本窗口 **实际打开原始官方/原始手册页面** 的新增内容，而非沿用先前 OAuth/PG/Lease/NIST 索引或把搜索摘要当原文：

| 标题 / 原始 URL / 位置 | 阅读等级 | 直接原文事实 | 应用于 K0 的判断与适用限制 |
| --- | --- | --- | --- |
| [Linux Kernel — Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html), `cgroup.kill`, `cgroup.events populated`, `cgroup.freeze` | `ORIGINAL_KERNEL_DOC_DIRECT_READ_20261021` | 非 root cgroup 的 `cgroup.kill` 接受写 `1`、向所在树进程发 SIGKILL，针对并发 fork 和迁移有明确处理；`cgroup.events populated=0` 意味着该 cgroup 子树不含活进程；freeze 状态不能等价于退出 | **优先候选**用于隔离非生产 supervisor 回收/退出验证；必须在有权限和独占的 *测试 cgroup* 中实施，不能碰共享 runner 的上层 cgroup 或生产服务；只能证明该 cgroup 完整，不证明所有外部 Caller |
| [Linux man-pages — pidfd_open(2)](https://man7.org/linux/man-pages/man2/pidfd_open.2.html), Description/Notes | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | `pidfd_open` 获取指向内核进程对象的文件描述符，配合 poll/epoll 观察死亡；在满足保留条件的 PID 生命周期中可防止错误进程引用 | **进程级身份候选**，要由受信且存活的外部 supervisor 持有 pidfd；不得把纯 PID 文本文件或 PID 重用窗口当成不可伪造的存活证据 |
| [Linux man-pages — pidfd_send_signal(2)](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html), Description | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | 向 pidfd 所引用进程发送信号；受 PID namespace 可见性限制 | 适合单进程身份安全信号操作的候选，但**一个 pidfd 不涵盖未知子孙进程或所有其他 Worker**，不取代 cgroup 树枚举和外部数据库校验 |
| [Linux man-pages — PR_SET_CHILD_SUBREAPER(2const)](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html), Description | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | 最近仍存活的祖先 subreaper 可接收孤儿并 wait | **只负责收养/回收退出状态，不自动杀死仍运行的 child**；不能仅设置 subreaper 就宣布 stop |
| [systemd.kill(5)](https://man7.org/linux/man-pages/man5/systemd.kill.5.html), KillMode | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | `control-group` 与 `mixed` 可管理 unit cgroup 内多进程，`process` 容易遗漏子进程 | 独立监督者设计的对比材料；**没有证据 Railway 当前使用 systemd 或这种 kill mode** |

**已选进一步方案：** K0 的非生产父 Host SIGKILL 证明，先要求在独立隔离 Linux 环境具备 **supervisor 不与 Host 同命运**、隔离 cgroup 的专属所有权、可由 supervisor 验证的完整 child identity/cgroup membership、强制终止能力、`populated=0`/退出回执和失败时自动 TTL 清理；实际能力可由 Infra 选择 cgroup v2 + 外部 pidfd 路线，或由可靠编排器提供同等独立原始证据。避免在普通共享 Runner 上未经隔离直接发起父 Host SIGKILL。SRE/DBA/IdP/Worker 全域生产权威仍必须单独提供。

**当前控制面再次刷新（只读）：** GitHub `main@524106df36af45b89d15eebd4c0c4f308b1718fc` **40/40 exact check-runs SUCCESS**；Railway Host deployment `35d45d8d-d44c-4bce-a51c-9cd36b9405f2` 与该 SHA 一致，SUCCESS/Online，1 running/0 crashed；前一次 `0cf816e7...` 现 REMOVED。此时间片的新 main 来自其他主线，不将其绿色提交检查解释为旧全量 schedule 10 FAIL 修复。

**PR 当前合并状态的新增矛盾/风险：** #1074 当前 GitHub PR API `mergeable=false, mergeable_state=dirty`（准确 HEAD `caccb1b6`，未合并），提示该独立 Host shutdown Draft 需要在**原 PR** 合并前收敛冲突；#1081/#1082 为 `behind`（而非均代表冲突）。本轮因用户禁止合并 Draft、不覆盖其他工作线，未擅自修改 #1074 或推进 main。

**总体否决不变：** K0/E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`；production material WRITE `OFF`；#988/#979/#913 `OPEN`。无生产 Validator、SQL、Secrets、停止、重启、draining/tracing 修改、SIGKILL 父进程实验或远端分支删除。
