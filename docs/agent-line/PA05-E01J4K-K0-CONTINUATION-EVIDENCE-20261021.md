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


## 9. 2026-10-21 — 非合作 deactivate 本地 stop deadline：第十一项真实 CI

**为什么新增：** 旧 #1082 的 timeout kill/reaping 回归关注 invocation timeout，第一项 stop/shutdown overlap 的 child `deactivate` **会在 400ms 返回**。因此并未证明 child `deactivate()` 永久不返回时 Host `stop()` 能否用自己的 750ms SIGKILL fallback 完成本地回收。

**独立工程原分支：** #1082 不另开 PR。只修改已有两项 test-only 文件：`tests/fixtures/pa05-k0-delayed-process.mjs` 在专用 disposable 包 ID `pa05-k0-deactivate-hang-process` 返回 ready 后让 `deactivate()` 永久 pending，另有 child 5s 自退出保险（commit [`98d91fa`](https://github.com/jiangxng/EVO-App-Platform/commit/98d91fa634054ebd79c9b3f9c335e019a319dad0)）；新增正向 test 在真实 Node child 读出 PID、确认原先存活，调用 `stop()`、检测本地用时上界和 PID 不再存活，最后 `shutdown()` 复核（HEAD [`156609a7`](https://github.com/jiangxng/EVO-App-Platform/commit/156609a7bf9429fa2e1fcc4ca4e42a7349da1964)）。没有修改 `manager/plugin-runtime-host.ts` 或顶层 #1074 Host 代码。

**原始 Actions 日志：** [Platform CI #39533283090 / job #119004106488](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39533283090/job/119004106488) 的完整 job log 由本窗口在 2026-10-21 直接读取（等级：`ORIGINAL_ACTIONS_RAW_LOG_DIRECT_READ_20261021`）。`1103 total / 1102 PASS / 1 SKIPPED / 0 FAIL`，十一项 `PA05_K0_BOUNDED_*` marker 全部出现，新 `ok #776`：

```json
{"scope":"isolated-local-child","nonCooperativeDeactivate":true,"childClosedBeforeFixtureFuse":true,"elapsedMs":753,"globalStopCertified":false}
```

**严格结论：** 唯一一次 CI 的 local stop 观察到 **753ms**，在此用例 `<3000ms` 的测试上限内提前回收 child；源码配置 fallback 750ms，观察值与其预期一致，但单次机器的耗时**不是生产 deadline SLA、不是所有负载下上界、不是 SIGTERM PID1 行为，也不是独立父 Host SIGKILL 回执**。现新增 K0 局部工程等级可在对应提交全部 CI 绿后认定为 `ISOLATED_PROCESS_LIFECYCLE_ELEVEN_CASE_BOUNDED_PASS`，不升级 K0 全域认证。

**外部停止权威仍未通过：** 缺受信独立 supervisor 的完整 child/子孙身份与回收；真实 Railway effective drain/overlap、Node PID1 signal、组织全域 worker+Runner、PG backend session/role、Human IdP/DBA/secret broker rotation/revoke/audit。其来源和测试前置门禁见 §§7–8 及旧工作表 R1–R8。四条 Draft 不合并、不部署、不运行生产 Validator/SQL/Secrets/stop/重启；K0/E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`，material WRITE `OFF`。


## 10. 2026-10-21 — 无破坏监督者能力预检：真实 Runner 原始证据 + 默认拒绝

**实施边界：** 在原工程 Draft [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 追加 **2 个 test-only 文件**，没有改生产 runtime 和 Host shutdown。commit [`0d874d69`](https://github.com/jiangxng/EVO-App-Platform/commit/0d874d69cc9594d836df9117e327e585c49421b2) 增加 `tests/fixtures/pa05-k0-external-supervisor-preflight.mjs`；commit [`eb129cc2`](https://github.com/jiangxng/EVO-App-Platform/commit/eb129cc2b156294d34c0a04fb73a6ebbedd4b34f) 增加 `tests/protocol/pa05-k0-supervisor-preflight.test.mjs`。**此阶段仅能探测当前 Runner 内核/cgroup 可读特征，不承诺/实施外部监督者。** 所有安全关键字段始终 false，`assertK0IndependentSupervisorReady` 恒定抛出 `PA05_K0_PARENT_SIGKILL_DENIED`。即使传入所有 `true` 的未经验证 claims，仍拒绝；没有任何执行 SIGKILL 的函数。

**实际原始 CI 证据：** [Platform workflow run #39535199087 / job #119010190494](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39535199087/job/119010190494)，2026-10-21T02:50:49Z，`ORIGINAL_GITHUB_ACTIONS_JOB_LOG_DIRECT_READ_20261021`，真实 `npm run test:platform` **1105 total / 1104 PASS / 1 SKIPPED / 0 FAIL**。两个 preflight 测试 PASS，既有 11 项 K0 disposable PROCESS 专项仍在同一 job 通过。这两项**不是**第 12/13 项 PROCESS 生命周期测试，应独立定级。

```json
{
  "scope": "test-runner-local-readonly",
  "linux": true,
  "cgroupV2Detected": true,
  "ownCgroupLocated": true,
  "eventsReadable": true,
  "cgroupKillPresent": true,
  "observedPopulated": "1",
  "dedicatedCgroupOwnershipVerified": false,
  "independentSupervisorLifetimeVerified": false,
  "childTreeTerminationAuthorityVerified": false,
  "emergencyReaperAndTtlVerified": false,
  "independentlySignedExitReceiptVerified": false,
  "parentSigkillExperimentAuthorized": false,
  "globalStopCertified": false
}
```

第二条 marker：`PA05_K0_EXTERNAL_SUPERVISOR_UNTRUSTED_CLAIMS_DENIED={"scope":"local-test-only","denied":true,"globalStopCertified":false}`。这说明**确实观察到当前 GitHub Runner 具备某些 cgroup v2 可读接口**；不能把 `cgroupKillPresent=true` 与能够安全地创建专属子 cgroup、写入 `cgroup.kill`、回收全部 child、由独立 supervisor 见证甚至生产 Railway 支持相混淆。特别是 `observedPopulated="1"` 只说明**当前 Runner 所在 cgroup 子树有进程**，它不是专属测试 cgroup 的 `populated=0` 外部退出回执。

**局部新工程状态：** `ISOLATED_SUPERVISOR_CAPABILITY_HINTS_READ_ONLY_AND_UNTRUSTED_CLAIMS_DENIED`；#1082 之前的 `ISOLATED_PROCESS_LIFECYCLE_ELEVEN_CASE_BOUNDED_PASS` **不升级**。工程新精确 HEAD `eb129cc2b156294d34c0a04fb73a6ebbedd4b34f` 在上述 CI job SUCCESS 后，其他 workflow check 必须另行确认全绿。

### 10.1 从探测到可安全测试的下一阶段硬门槛

| 证明项 | 接受的后续真实证据 | 本轮状态 |
| --- | --- | --- |
| 隔离归属 | Infra 在**非生产** Linux 隔离环境实际创建并标记本次专属 cgroup，提供 owner、mount namespace、进程 PID namespace、唯一 test run id，不允许复用共享 Runner 根 cgroup | UNVERIFIED |
| 独立 supervisor | 不是受测父 Host 的子生命周期依赖；能够在 Host SIGKILL 后保持运行；向独立审计存储登记 PID + start time 或 pidfd / cgroup 归属 | UNVERIFIED |
| 清理能力 | 独立 supervisor 可在受信隔离权限内可靠执行组回收；完成后观察 cgroup `populated=0`，错误时仍有独立于目标 Host 的 TTL rescue | UNVERIFIED |
| 严格实验门禁 | 进入危险测试前，组织明确授权、可撤销准入、可核查剩余时间预算、测试环境与生产严格分离；外部审计签收 | UNVERIFIED |
| 生产级止写 | 独立于 Linux 本机 OS 的组织全域 Worker/Runner/freeze 清单、SQL backend 复核、IdP/DBA/Secrets/审计权威与 Railway 有效 drain/PID1 | UNVERIFIED |

**方案理由（原始内核资料见 §8）：** 先做不写 cgroup 的内核能力可读性检查，可以确认下一轮应由 SRE 提供的真实前置资源；不能借存在 `cgroup.kill` 就在共享 Runner 直接 SIGKILL 父 Host。**未改变**中央 fencing epoch + 外部 Worker stop receipt + SQL session 二次核查 + Human/DBA 身份链的原 K0→K6 选型。本次没有新的权威外部监督者，也没有带信号的实验。

### 10.2 #1074 merge conflict 的只读源码定位（未修复）

在 GitHub PR API 精确读取 [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) `caccb1b6`：`mergeable=false/mergeable_state=dirty`。原始 PR diff 涉及 `.github/workflows/lightweight-host.yml` 单行长测试命令、`manager/server.ts` Host shutdown 段、新 `manager/host-shutdown.ts` 和一份 Host stop 测试。再次读取 `main@6bea66e8b7cde970a1f62d440b00d6567aeeca57` 两份源文件：主线尚无 `host-shutdown.ts` 的 import，仍是旧 shutdown 段，但 lightweight-host workflow 的长期长行**已有其他 owner 新增的测试项**，并行改动不能被 PR #1074 的旧行整体覆盖。

**限定建议而非实施事实：** 修 #1074 时必须保留当前 main 上全部新增 lightweight-host 测试/Host 改动，再附加 J4J / Host shutdown 测试；源码冲突逐段核对主线 import/server handler/stop，重新跑完整对应 CI；不得自动使用旧 PR 文件覆盖 main 的治理成果。本窗口不更改 #1074，也不合并四 Draft。主线与其生产部署的最后校验时间片可不同；单独列证据。

**K0 否决持续：** production material WRITE `OFF`；K0、完整 E01J4、PA05-05 E01–E05、W06 `NOT_SIGNED`，#988/#979/#913 OPEN；无生产 Validator/SQL/Secrets/停止/扩缩容/draining 或历史分支删除。


## 11. 2026-10-21 — 离线签名回执最小契约：真 CI、但无生产信任根

**新增需求与对先前设计的继承：** 依据原 [K0 验收表 §4](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) 的 operation / inventory revision / fencing epoch / exact instance / nonce / supervisor identity / exit receipt / time binding 字段，将“只是文件存在或未经证实的 boolean 声明”提升为**可测试的离线证据契约草案**。这不是选择实际编排器，也不是修订中央 epoch + 权威清单 + 外部终止 + DB-session 重查 + Human/DBA 生产认证的既定 K0→K6 路线。

**原 #1082 工程分支增量（新增 test-only 两文件，未改 Host Runtime）：**

- [`7531dca586125cbcee7e8dbecc6f351d65531748`](https://github.com/jiangxng/EVO-App-Platform/commit/7531dca586125cbcee7e8dbecc6f351d65531748) 的 `tests/fixtures/pa05-k0-supervisor-receipt-proof.mjs`：仅接受不超过 4096 字节的特定测试 JSON envelope，以 Node.js Ed25519 验证**原始字节签名**，检查精确字段集、JSON 重复键/非规范字节、关联 `operationId/scopeId/inventoryRevision/fencingEpoch/instanceId/startNonce/supervisorId/keyId`、观测时间不早于 120 秒且非未来、`EXTERNAL_PROCESS_EXIT_OBSERVED` 事件及 `cgroupPopulated="0"`。用调用方给出的本地 `Set` 演示重复 digest 拒绝。没有创建、停止或枚举任何 Worker，也没有碰生产 SQL/Secrets/cgroup。
- [`358e01e3751c388ca16f3fac5a28ecbba0d63165`](https://github.com/jiangxng/EVO-App-Platform/commit/358e01e3751c388ca16f3fac5a28ecbba0d63165) 的 `tests/protocol/pa05-k0-synthetic-stop-receipt.test.mjs`：每次 Node CI 生成临时 Ed25519 keypair，仅以测试密钥签测试 fixture，验证正向字节签名、伪造签名/未提供信任键、过期/未来时间、操作/epoch/nonce 不匹配、事件或 cgroup 未清空、重复键、额外生产秘密字段、签名长度异常，以及局部重复回执拒绝等 **6 个测试用例**。

**实际原始 GitHub Actions 证据（`ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_20261021`）：** [Platform run #39536229728 / job #119013390883](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39536229728/job/119013390883) 于 2026-10-21T03:02:03Z 记录 `ok #779–#784` **六项 synthetic 证据契约测试通过**，`1111 total / 1110 PASS / 1 SKIPPED / 0 FAIL`，既有本地 PROCESS 11 项 marker 与 supervisor preflight 2 项 marker 仍在同一 job 通过。关键原始 JSON：

```json
{"scope":"offline-synthetic-fixture-only","payloadBoundToExpectedInstance":true,"signatureMatchesSuppliedTestKey":true,"testOnlyReplayCacheChecked":true,"independentSupervisorIdentityVerified":false,"completeInventoryVerified":false,"stopAuthorityVerified":false,"databaseSessionsVerified":false,"productionIdentityVerified":false,"mayRunParentSigkill":false,"productionMaterialWriteEnabled":false,"globalStopCertified":false}
```

另一日志 `PA05_K0_SYNTHETIC_RECEIPT_REPLAY_DENIED` 为 `{"scope":"offline-fixture","replayDenied":true,"globalStopCertified":false}`。**上述都是测试专用 key、调用方提供的预期 scope 与局部 replay Set，不是经审批的生产 IdP、外部 Supervisor 签名根、持续全域去重账本或真实进程退出证据。** 因而新有界结论只能记 `ISOLATED_SYNTHETIC_RECEIPT_ENVELOPE_SIX_CASE_BOUNDED_PASS`，**不加到之前 11 个真实 Node PROCESS 生命周期案例里**。首次读取原始 job 时，HEAD 的其他 check 尚在执行；必须在精确 HEAD 全绿后更新 total checks。

### 11.1 已确认局限与真正能推进 K0 的后续组织证据

| 项目 | 这次离线 fixture 做到什么 | 尚缺且不能代填的真实权威 |
| --- | --- | --- |
| 回执结构 | 精确绑定 operation/epoch/instance/start nonce，拒绝错配 | 实际编排器产生的数据、可信 owner 验证过的完整 worker inventory |
| 签名 | 对本地 Ed25519 fixture 原始 payload 验签 | **独立 attestor trust root、签名 keyId 与物理 supervisor/部署/环境/租户的授权映射、撤销策略和签名密钥控制** |
| 时效与重放 | 两分钟测试窗口及调用方内存 Set 拒绝重复 payload | 真实可信时钟、持久/跨实例唯一性存储、回执重用/跨操作竞态管理 |
| 停机退出 | 检查字符串 `event` / `cgroupPopulated` 的签名一致性 | **由独立存活的 Supervisor 真实观察专属 cgroup populated=0、所有子孙退出、签收完整性**；签名正确也可能只签了错误事实 |
| 完整认证 | 始终返回 stopAuthorityVerified=false 和 globalStopCertified=false | 外部真正父 Host 突然死亡后的受信回收、R1–R8、PostgreSQL SQL session 再观察、IdP/DBA 生产权限及审计双签 |

**不允许改变的决策：** 不将这个 test-only schema 接入生产 Validator / Host / WRITE 路由，也不以自签测试公钥作信任根；不触发父 Host SIGKILL、清锁、部署、Draining 修改、Secrets/SQL 操作。#1071/#1074/#1081/#1082 全部继续 Draft；K0、完整 E01J4、PA05-05 E01–E05、W06 **NOT_SIGNED**；material WRITE **OFF**；#988/#979/#913 继续 OPEN。


## 12. 2026-10-21 — 回执验签顺序加固：签名先于 claims 解释

**为什么加固：** §11 首版离线 verifier 对期望 scope 做了字段比较后才验签，因此“篡改后仍能解析的回执”有机会先被具体字段拒绝，未能独立证明签名层拒绝篡改。按安全分层原则继续在 #1082 原 Draft 内精确收敛，不增加生产功能，也不改变签名回执只是测试证据的等级。

**真实工程增量：** [`761f4877433ab6d01c73329ad4aa9a764b450a05`](https://github.com/jiangxng/EVO-App-Platform/commit/761f4877433ab6d01c73329ad4aa9a764b450a05) 将 Node Ed25519 `verify(null, payloadBytes, testPublicKey, signatureBytes)` 提前到解析/解释 signed JSON 的**所有 claims 之前**，仍先检验输入长度；[最终测试提交 `50a7a068259c966dafa86a722aab5d012fb96fd8`](https://github.com/jiangxng/EVO-App-Platform/commit/50a7a068259c966dafa86a722aab5d012fb96fd8) 把已签名的 `observedAt` 改为仍在允许时间窗内的不同值，确保因 `BAD_SIGNATURE` 而被拒绝。六项测试数量不变，没有新建真实 Supervisor 或生产密钥。

**独立原始 CI：** [Platform run #39536775595 / job #119015279614](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39536775595/job/119015279614)，`ORIGINAL_GITHUB_ACTIONS_JOB_LOG_READ_20261021`，新 HEAD **1111 total / 1110 PASS / 1 SKIPPED / 0 FAIL**，6 项 synthetic receipt、11 项本地 PROCESS 和 2 项只读 supervisor preflight 均通过。测试 marker 仍明确：`signatureMatchesSuppliedTestKey=true` **但** `independentSupervisorIdentityVerified=false`、`stopAuthorityVerified=false`、`globalStopCertified=false`、`mayRunParentSigkill=false`。精确 HEAD 的剩余 workflows 需单独确认全部结束。

**与 §11 的关系：** §11 是真实已测试的早期历史快照，不覆盖或伪称其已执行新验签先行规则。以本节新 `50a7a068` 的源码、真实 job log 为当前 test-only 包含的更严格状态。绝不因它推断生产 stop authority、SQL session、Human IdP/DBA credential 已签收。K0/完整 E01J4/PA05-05 E01–E05/W06 仍 `NOT_SIGNED`，WRITE `OFF`。


## 13. 2026-10-21 自动续跑 #03 — 离线 Worker 清单与停机回执精确对账

> **证据级别：** `ORIGINAL_GITHUB_SOURCE_COMMITTED_20261021` + `ORIGINAL_GITHUB_ACTIONS_JOB_LOG_DIRECT_READ_20261021`；只是离线合成数据的逻辑一致性验证。不是已经部署的停机服务、真实双 Worker 实验、实际外部 Supervisor 或生产凭据。继承此前 PostgreSQL18/OAuth/Lease/NIST 研究，不重做已验证原文、也不改变 K0→K6 设计。

### 13.1 范围、精确工程提交与原始执行

- 原工程 **Draft [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082)** 延续，不合并、不部署。添加两个 test-only 文件：[`tests/fixtures/pa05-k0-synthetic-inventory-reconciliation.mjs`](https://github.com/jiangxng/EVO-App-Platform/blob/d9be185e3e244bb45fec5f3fab2554c52b04114f/tests/fixtures/pa05-k0-synthetic-inventory-reconciliation.mjs) commit [`599bafafa9c7ad6da63c96d1c1bf2f4e74d8fd61`](https://github.com/jiangxng/EVO-App-Platform/commit/599bafafa9c7ad6da63c96d1c1bf2f4e74d8fd61)，[`tests/protocol/pa05-k0-synthetic-inventory-reconciliation.test.mjs`](https://github.com/jiangxng/EVO-App-Platform/blob/d9be185e3e244bb45fec5f3fab2554c52b04114f/tests/protocol/pa05-k0-synthetic-inventory-reconciliation.test.mjs)，精确 HEAD [`d9be185e3e244bb45fec5f3fab2554c52b04114f`](https://github.com/jiangxng/EVO-App-Platform/commit/d9be185e3e244bb45fec5f3fab2554c52b04114f)。
- [Platform CI #39537627482 / job #119017875426](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39537627482/job/119017875426) **原始 job log 已直接读过**，2026-10-21T03:17:09Z：**1121 total / 1120 PASS / 1 SKIPPED / 0 FAIL**；十组新增 `K0 offline reconciliation` subtest 全部 `ok`；同一次 job 包含先前十一项真实本地 Node PROCESS marker。最终 HEAD 的完整 commit check-runs 还须独立判断全绿，不允许仅用 protocol job 代替整个 CI。
- 测试组合为 **2 个虚构 Worker、3 个虚构外部 caller、临时 Ed25519 测试公钥和内存回执 cache**。完全不生成/停止操作系统进程，不发网络请求、不碰 Railway/生产 SQL/Secrets。

### 13.2 对账方案（仅受限离线 contract test）

要求 synthetic `freeze` 包含相同 `operationId / scopeId / inventoryRevision / fencingEpoch` 及非空、实例身份唯一的 `instanceId / startNonce / supervisorId / keyId`；synthetic `postFreeze` 必须沿用同一快照且 `liveInstances=[]`。停机回执数量及身份严格与冻结快照一对一匹配，并逐个重用 §11–12 已通过的 Ed25519 **签名先于 claims** 检查。caller `DENY` 声明必须覆盖所有测试已知 caller，epoch 一致；synthetic DB session 观察必须与 scope 一致且为 `SYNTHETIC_NO_PROTECTED_SESSIONS`。所有检查完成后才提交本地 replay Set，避免中途拒绝时污染缓存。

以下被显式否决：缺失 / 重复 / 多余或未知 receipt、旧启动 nonce / fencing epoch、重复或空 inventory、声称不完整仍继续、冻结后存活 / 重启实例、冻结快照版本不匹配、未知/重复/遗漏 caller、caller 错 epoch 或返回 ALLOW、模拟 SQL 会话未知或仍在、错误验签公钥、重复 receipt 及半失败后错误消费本地 replay cache。

**真实输出标记**（原始 job log）：

```json
{"scope":"offline-synthetic-reconciliation-only","locallyConsistentUntrustedFixture":true,"syntheticInstanceCount":2,"syntheticCallerCount":3,"testSignaturesMatched":true,"independentInventoryCompletenessVerified":false,"externalStopAuthorityVerified":false,"realCallerAdmissionVerified":false,"realDbSessionAbsenceVerified":false,"humanAndDbaAuthorityVerified":false,"parentSigkillAuthorized":false,"productionMaterialWriteEnabled":false,"globalStopCertified":false}
```

另有 `PA05_K0_SYNTHETIC_MULTIWORKER_REPLAY={"transactionalTestCache":true,"localReplayDenied":true,"globalStopCertified":false}`，**只是 test-runner-local 的重放逻辑**。

### 13.3 本轮决策及不可跨越的认证缺口

- 新等级仅 `ISOLATED_SYNTHETIC_MULTIWORKER_INVENTORY_RECONCILIATION_TEN_CASE_BOUNDED_PASS`；十项“对账逻辑”不得计为十项真正 Worker stop。原有 **11 项 local PROCESS**、**2 项只读 Supervisor preflight**、**6 项 synthetic signature envelope** 各保留原标签与范围。
- `freeze.completeForScope`、`postFreeze.liveInstances=[]`、`callerDecisions=DENY` 和 `dbSessionObservation=SYNTHETIC_NO_PROTECTED_SESSIONS` **都是测试输入中未经组织授权的断言**；即使签名或数据结构均匹配，仍不能证明真实库存完整、实际入口封闭、真实生产 PostgreSQL backend 消失、真实 supervisor 已回收任何进程。输出硬编码保持 `externalStopAuthorityVerified=false`、`realDbSessionAbsenceVerified=false`、`globalStopCertified=false`。
- 下一真门槛仍是 **Infra/SRE 的实际可信库存授权与专属隔离 Supervisor / OS PID/cgroup/退出回执，重启扩缩容排他；独立 DB session 二次核查；完整外部 caller/Host routes；真实 Human IdP、DBA、凭据轮换和审计责任**。这些均不能通过增加本地 Mock 或自签密钥替代。
- 沿用原 K0 → K6 的 fencing epoch / stop attestation / PostgreSQL session / Human IdP / DBA 治理决策；没有新的冲突来源推翻原定路线。无父 Host SIGKILL、生产 Validator、SQL/Secrets、停止、部署、改 draining/trace、异常锁清理和远端分支删除。

**认证状态严格不变：K0 / 完整 E01J4 / PA05-05 E01–E05 / W06 全部 `NOT_SIGNED`，production material WRITE `OFF`；Issues #988/#979/#913 `OPEN`；四条 PR #1071/#1074/#1081/#1082 均 Draft，不合并或部署。**


## 14. 2026-10-21 自动续跑 #03 — Railway 当前 Host/EVO Runtime 有效配置字段只读复核

**证据级别：** `ORIGINAL_CONNECTED_RAILWAY_GET_SERVICE_CONFIG_READ_20261021`，连接的单个项目 `aee4643e-912b-4ca1-ae95-fe4ec64f5601` 的 production `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`；仅两个服务的**非秘密 config 字段**，未读取 production Variables 值、Secrets/SQL 或日志。

| 具体已连接服务 | 本轮真实只读返回的字段 | 尚不能推导 |
| --- | --- | --- |
| Ledger Configurator / Host（`a8622238-480e-4da3-be6f-60fd0f3e18db`） | `source.branch=main`；`deploy.startCommand=npm start`；`deploy.runtime=V2`；`deploy.multiRegionConfig.sfo.numReplicas=1`；`restartPolicyMaxRetries=5`；`healthcheckPath=/health`；`staged=null`；volume `/data` | 实际容器 PID1 是谁、SIGTERM 是否按预期到达 Node/PROCESS children、draining / overlap 生效时长、操作员跨项目 restart/scale 责任 |
| EVO Runtime（`4ab51d1b-ea96-4c61-8d91-a65547bda049`） | `source.branch=main`（独立 EVO 仓库）；`deploy.startCommand=npm start`；`deploy.runtime=V2`；`sfo.numReplicas=1`；`restartPolicyMaxRetries=5`；`healthcheckPath=/health/ready`；`staged=null` | 同上；不能将 Host 自己的 CI 或副本数视为 EVO Runtime 的完整进程清单 |

本次 `get_service_config` 返回的 `deploy` 字段**没有** `draining` / `overlap` 的明确实际值，筛选的变量**名称**亦无可匹配项。这只能得出 `EFFECTIVE_DRAINING_UNVERIFIED`，**不能断言实际为零或默认值**。服务配置不是正在运行实例 PID/PPID/cgroup 库存，不能用 `staged=null` 冒充没有在途调用者或新进程。

同一窗口控制面只读核验：GitHub main `6bea66e8b7cde970a1f62d440b00d6567aeeca57` 40/40 exact commit checks SUCCESS；Railway Ledger Configurator deployment `35d45d8d-d44c-4bce-a51c-9cd36b9405f2` 对应**较旧** `524106df36af45b89d15eebd4c0c4f308b1718fc`，SUCCESS / Online / 1 running / 0 crashed，Railway无 pendingWork。GitHub main 与当前已运行 commit 不一致，**不擅自触发部署，也不能宣称新 main 已在线**。

**R1–R8 仍 UNKNOWN/DENY**：必须由 Railway 授权 Operator 提供 Dashboard 的真实有效 draining/overlap 和受控非生产 PID1/SIGTERM 回执，由组织 Infra/SRE 交付外部 supervisor 清点及停止的全部 Worker/Caller 身份和签收，由 DBA/IdP Owner 交付真实会话/凭据/审计权限。此只读连接器没有提供相关认证证据。K0/E01J4/PA05-05 E01–E05/W06 全部 NOT_SIGNED，material WRITE OFF。


## 15. 2026-10-21 自动续跑 #04 — #1074 合并冲突有界解除及 CI 隔离

**本轮优先解决真实工程阻塞，不重复本地合成测试。** 以原 Draft PR [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) 为唯一修改目标。原 HEAD `caccb1b60358b453ef471eaf6abecf1593e4965c` 有 GitHub REST `mergeable=false / mergeable_state=dirty`，尽管精确旧 HEAD 45/45 checks SUCCESS。GitHub `main@6bea66e8b7cde970a1f62d440b00d6567aeeca57` 有其他窗口在 `.github/workflows/lightweight-host.yml` 长测试行新增的测试，不得以旧 PR 整行覆盖。

### 15.1 原因及实际解决

- 使用 GitHub connector 原样读取 `.github/workflows/lightweight-host.yml` 的原 PR base `eaa5e813b1e86a6460d988c76eb2076512c35127`（blob `898ceb27...`）、现 main `6bea66e8`（blob `99aeb01b...`）、旧 Draft 分支（blob `ee38fd44...`）。原 PR 对 workflow 的唯一修改，是在同一条极长的测试命令后追加 PA05 两个 test 路径；main 则同时在该长行添加其他工作线测试。两侧同改一行会冲突。
- 第一次修正 `390e4a8a17861799b6b3cd302234014c4bc5aa35`：把 workflow 完整切到 main 的版本、另插入独立 PA05 步骤。GitHub 即从 `dirty` 转为 `mergeable=true / behind`，但进一步查询发现该旧 Draft 分支**尚缺**当前 main 的部分新增测试文件（例如 `tests/integration/evo-map-startup-boundary.test.mjs`、`tests/integration/managed-session-startup-boundary.test.mjs`、`tests/integration/oidc-credential-host.test.mjs`）。因此没有把这个过渡提交视为完成。
- **最终手术式收敛：** commit [`c6d5fca90ebfc41ffa642dc5af2e756a224ec838`](https://github.com/jiangxng/EVO-App-Platform/commit/c6d5fca90ebfc41ffa642dc5af2e756a224ec838)，原 Draft 分支 `agent/pa05-host-shutdown-error-path-20261020`：将工作流恢复到 PR base 的完整非 PA05 原有内容，**仅增加一个独立** `PA05 Host shutdown isolation and cooperative lock` 步骤，单独运行 `tests/agent-line/pa05-host-shutdown-error-path.test.mjs` 和 `tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs`；没有触碰 `manager/server.ts`、`manager/host-shutdown.ts` 或测试文件。
- **来源直接证据：** GitHub `list_pr_changed_filenames` + `fetch_pr_file_patch` 当前精确 PR patch，workflow **仅**在 `Isolated installed-disabled module and resource audit` 与 `actions/upload-artifact` 之间新增四行独立测试步骤；原来冲突的长测试行**完全等同 PR base**，因此 main 的新增测试保留给 GitHub 三路合并处理，不在旧 Draft 当前 runner 上执行不存在的 main-only 测试。
- GitHub 重新计算 PR 精确 `c6d5fca9`：**`mergeable=true`，`mergeable_state=behind`，`draft=true`，`state=open`**，原 `dirty` 已解除。这意味着**文本合并冲突解除**，不是已把新 main 合并进旧 Draft、不是自动部署或生产 stop 认证。仍需当前 HEAD 重新跑完 45 项左右的真实 checks；不可重用旧 HEAD 的 45/45。

### 15.2 新 HEAD 真实 CI 复核与仍然成立的限制

**自动合并预演原始文件核验（无 merge 动作）：** 用 GitHub `fetch_file(ref=refs/pull/1074/merge)` 直接读取 GitHub 生成的 #1074 merge preview 的 `.github/workflows/lightweight-host.yml`，blob **`5b117bf8d699d80a6c1605af97380f8aef9f0235`**（全文 5520 字符）。该虚拟合并文件同时包含主线增加的 `tests/integration/oidc-credential-host.test.mjs` 和 `tests/integration/evo-map-startup-boundary.test.mjs`，以及 PA05 独立 `PA05 Host shutdown isolation and cooperative lock` 步骤及两份 Host/J4J tests。**已直接验证 GitHub 三路合并预演不会丢失这些双方测试**，不是仅凭推测；此 ref 为 GitHub 虚拟合并结果，**并未向 main 写入或部署**。如果日后 main 再前进，此证据仍只是当前 preview 快照，需重新读取。

**精确新 HEAD `c6d5fca90ebfc41ffa642dc5af2e756a224ec838` 已 45/45 check-runs SUCCESS**，包括 [Lightweight Host run #39538625109 / job #119021176953](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39538625109/job/119021176953)。**原始 job log 直接读取**（`ORIGINAL_GITHUB_ACTIONS_JOB_LOG_DIRECT_READ_20261021`）：原本 lazy-load 测试步骤 `278 tests / 278 PASS / 0 FAIL`；新增独立 `node --test tests/agent-line/pa05-host-shutdown-error-path.test.mjs tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs` **`5 tests / 5 PASS / 0 FAIL`**。这些日志来自新 SHA，而非错误地复用旧 `caccb1b6` 的 45/45。新增步存在且真正执行，当前 PR GitHub `mergeable=true`、`mergeable_state=behind`、`draft=true`；仍不可签生产 K0 或擅合并。

### 15.3 新发现、限制和下一步

**工程结论：** `HOST_SHUTDOWN_PR_MERGE_CONFLICT_RESOLVED_PENDING_NEW_HEAD_CI`；#1074 仍 Draft/未合并/未生产。这次修复避免两种错误：用旧长行覆盖新 main 的 CI 清单；把 main 新增但当前 Draft 缺失的测试导入旧 Draft 的 CI 造成虚假失败。当前测试步骤依旧只证明旧 Host 本地错误路径，不签生产 PID1/SIGTERM/draining 或 K0 全域停机。

**外部事实没有变：** 本轮 Railway 只读 `environment_status` 显示 Ledger Configurator 1 running/0 crashed，production deployment `35d45d8d-d44c-4bce-a51c-9cd36b9405f2` 对应 **`main@524106df36af45b89d15eebd4c0c4f308b1718fc`**，GitHub 当前 `main@6bea66e8b7cde970a1f62d440b00d6567aeeca57` 40/40 exact checks SUCCESS，**生产仍未跟随 main 更新**。#1071 文档旧 HEAD `6e6a9ed4` 7/7 SUCCESS；#1081 `a1e8a094` 5/5；#1082 `d9be185e` 5/5。以上仅对应列出 SHA 的 GitHub API 结果。

**继续保留否决：** K0、完整 E01J4、PA05-05 E01–E05、W06 全 `NOT_SIGNED`；production material WRITE `OFF`；Issues #988/#979/#913 OPEN。R1–R8 的真实组织 Worker inventory、外部 Supervisor 退出收据、Railway effective draining/Node PID1、生产 Human IdP/DBA session/credential/audit owner 无新增真实签收；不得执行父 Host SIGKILL、生产 Validator/Secrets/SQL、Railway 修改、自动残留锁清理。四 Draft 全部保留，不能执行 merge。


## 16. 2026-10-21 自动续跑 #05 — 独立于目标 Host 的真实 Linux /proc 进程树观察

> **最新证据级别：** `ORIGINAL_GITHUB_COMMITTED_SOURCE_20261021` + `ORIGINAL_GITHUB_ACTIONS_JOB_LOG_DIRECT_READ_20261021`。本节新贡献是真实 OS /proc 独立观察，**不是**独立受权 cgroup Supervisor、父 Host SIGKILL 回收或生产 Worker stop 证明。继承 §§1–15 的原始研究，不重复开展 PostgreSQL18/OAuth/Lease/NIST 等已完成阅读。

### 16.1 真实实施与实际执行

- 原工程 Draft [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 原分支 `agent/pa05-k0-process-runtime-stop-barrier-20261020`，在此前 11 项 PROCESS + 2 项只读 preflight + 6 项签名验证 + 10 项合成 Worker 对账的基础上，**仅增两个 test-only 文件**，没有生产 Runtime/Host 修改。
- `tests/fixtures/pa05-k0-supervised-os-tree.mjs` commit [`e3f5f667e97c0c310bd65973484df1c35dc72e7f`](https://github.com/jiangxng/EVO-App-Platform/commit/e3f5f667e97c0c310bd65973484df1c35dc72e7f)：在一个隔离 CI Runner 中，模拟目标 Host 启动真实可执行 Node Worker。Worker 有**不依赖父 Host 的 5 秒自退出保险**，Host 有 7 秒保险，并在 stop 请求后等待 Worker close；无 `detached`、不制造新 session/namespace、不杀掉目标 Host、不读生产数据。
- `tests/protocol/pa05-k0-external-os-tree-observation.test.mjs` commit [`9b5b62c58ccad63b4d781eb5f4c4be63e69a5a68`](https://github.com/jiangxng/EVO-App-Platform/commit/9b5b62c58ccad63b4d781eb5f4c4be63e69a5a68)：**测试观察者运行在目标 Host 进程之外**，在 Host 接到正常 stop 之前，独立从 Linux `/proc/<hostPid>/stat`、`/proc/<workerPid>/stat` 和 `/proc/<hostPid>/task/<hostPid>/children` 查询 PPID/内核启动 tick/子进程关系及存活状态；目标 Host 向观察者报告的 PID 必须与 procfs 独立清单相符。发出正常 IPC stop（非 SIGKILL）后，观察者再次核查这两个准确启动身份的进程已退出。测试还包含受限救援清理：如有异常，仅对启动时刻匹配的 disposable PID 尝试 SIGTERM，两个目标本身也有 TTL 保险。没有父 Host SIGKILL。
- **原始 CI：** [Platform run #39539664240 / job #119024257994](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39539664240/job/119024257994)，精确 HEAD `9b5b62c58ccad63b4d781eb5f4c4be63e69a5a68`，`ORIGINAL_GITHUB_ACTIONS_RAW_JOB_LOG_DIRECT_READ_20261021`。单独新增 `K0 external OS observer: independently verify two-generation process tree and graceful close` **PASS**；整套 `1122 tests / 1121 PASS / 1 SKIPPED / 0 FAIL`；既有十一项 `PA05_K0_BOUNDED_*` 标记仍在同一 job。原始 marker：

```json
{"scope":"non-production-single-linux-runner","targetHostSeparateProcess":true,"hostRemainedAliveDuringObservation":true,"childConfirmedByExternalProcfs":true,"workerParentPidMatched":true,"hostAndWorkerStartIdentityObserved":true,"gracefulExitExternallyObserved":true,"noParentSigkillTestPerformed":true,"independentCgroupSupervisorVerified":false,"globalStopCertified":false,"productionMaterialWriteEnabled":false}
```

**已确认判断：** `ISOLATED_EXTERNAL_OS_PROCESS_TREE_GRACEFUL_OBSERVATION_ONE_CASE_BOUNDED_PASS`。这是迈出纯内存签名/模拟的真实 OS 层一步；观察者与目标 Host 是不同真实 Node 进程，procfs 的父子关系与启动身份未依赖 Host 的自述直接签收。不过它们仍在**同一非生产 Linux CI Runner**；观察者是测试驱动进程，不是由组织授权的独立生命周期编排器。

### 16.2 尚不能替代的外部授权证据

- 本实验没有发生父 Host 异常退出、突然 SIGKILL、IPC 断裂后长时间存活孤儿，也未证明独立 Supervisor 在目标父 Host 死亡后仍有完整子孙枚举/强制回收、专属 cgroup 归属与 `populated=0` 退出回执。两个目标都设 TTL，不可把 TTL 到期/正常关闭签成 OS 可信全域回收。
- 该 test fixture 的 synthetic Host/Worker **不是**正在生产运行的 Ledger Configurator Plugin Host 的确切真实部署或组织内全部 PROCESS/Runner/浏览器/API caller；不能代表 Railway PID1 / npm SIGTERM/draining/overlap，更不能签真实 DB backend 消失、中央 fencing epoch 或 Human IdP/DBA 凭据与审批。
- 此项独立于之前 11 项真实局部 Plugin PROCESS 生命周期测试、2 项只读内核预检、6 项合成回执验证、10 项合成 Worker 对账，不称为“12 项生产停机认证”。是否宣布 #1082 精确 HEAD **全部** checks SUCCESS，必须核对该 HEAD 的 5 个 checks 而非只凭 protocol job。
- 下一步先由 Infra/SRE 在**明确获授权的非生产独占隔离设施**出具 supervisor service identity、target cgroup/namespace 归属、全量已知 PID/start-time，独立于 Host 的 rescue TTL + kill 权限和真实退出回执，才考虑父 Host SIGKILL 注入与超时责任。缺一项仍 `NOT_EXECUTED`；不要在普通共享 Runner 把此正常停机实验直接升级为父 Host SIGKILL。

**K0、完整 E01J4、PA05-05 E01–E05、W06 全部 `NOT_SIGNED`；production material WRITE 仍 `OFF`；#988/#979/#913 OPEN。** 不合并 Draft、不动生产 Validator/SQL/Secrets/draining/部署/停机、不自动清异常锁、不更改其他窗口文件与 `project.status.json`。


## 17. 2026-10-21 自动续跑 #05 — 并行 main 与 Railway 生产部署新快照

**只读控制面快照（与本 Draft 工作无因果授权关系）：** GitHub main 自本窗口起点 `6bea66e8b7cde970a1f62d440b00d6567aeeca57` 再次由其他并行工作推进至 **`4d291fb31f7a5c429b20be14fb48df687c5a1dac`**。Railway 连接项目的 Ledger Configurator production 最新 deployment **`abe8f368-a45f-4a09-aa07-0f8201bf838e`** 对应同一新 SHA，`SUCCESS / Online`、1 running / 0 crashed / 0 warning，旧 `35d45d8d-d44c-4bce-a51c-9cd36b9405f2` 变为 REMOVED。来源等级 `ORIGINAL_CONNECTED_GITHUB_BRANCH_AND_CHECK_RUNS_READ_20261021` / `ORIGINAL_CONNECTED_RAILWAY_ENVIRONMENT_STATUS_AND_DEPLOYMENT_READ_20261021`。**本窗口没有手动创建部署、重启或改变服务配置**，它是外部并行主线变更后的已观测状态。

当前该新 SHA 的 GitHub commit check-runs 接口只返回 **2 checks / 2 SUCCESS**，不等同上一版本 `main@6bea66e8` 的 40/40 checks，也不能证明新部署经过相同范围的 Platform/Ecosystem 全量测试；旧 Ecosystem Certification 的 10 FAIL / 82 SKIPPED 独立负证据继续保留。Railway `SUCCESS/Online` 是编排器服务级当前状态，不能证明 K0 stop authority、真实 Operator IdP、子孙回收、SQL session 清理或 production material WRITE 安全可开启。

四条 Draft 仍与 main 隔离：#1071 文档继续 Draft、#1074 `c6d5fca9` 冲突已修复但未合并、#1081 负面证据继续 Draft、#1082 真实 /proc 外部观察继续 Draft（`9b5b62c5` 5/5 checks SUCCESS）。本窗口未写 `project.status.json`，不操作生产实例。K0/完整 E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`，production material WRITE `OFF`。


## 18. 2026-10-21 自动续跑 #06 — Railway 官方默认零 Draining 与实际 Node PID1 来源冲突

本轮不再重复增加 synthetic stop 测试，改为 **`R5_DOCUMENTED_PLATFORM_DEFAULT_ZERO_AND_RUNTIME_SIGNAL_CHAIN_UNVERIFIED`** 风险确认，并生成 [Railway Operator 可执行证据请求](PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md)。

**本轮新增原文（2026-10-21 真正打开，`ORIGINAL_RAILWAY_DOC_FULL_PAGE_READ_20261021`）：** [Railway Deployments Reference / Singleton deploys](https://docs.railway.com/deployments/reference) 说明新版本上线后旧版本收到 SIGTERM，**默认 0 秒 graceful drain 后 SIGKILL**；[Variables Reference / User-provided config](https://docs.railway.com/variables/reference) 明确 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` 默认 0 秒，`OVERLAP_SECONDS` 默认 0 秒；[Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) 区分两项语义；[Config as Code / Deployment teardown](https://docs.railway.com/config-as-code/reference) 显示 `deploy.drainingSeconds`、`deploy.overlapSeconds` 和环境覆盖；[Start Command](https://docs.railway.com/deployments/start-command) 明确 Railpack start command 经 shell 执行。**外部平台的默认值**不等于本项目当前实际有效值。

**已直读本项目 GitHub / Railway（`ORIGINAL_GITHUB_SOURCE_AND_CONNECTED_RAILWAY_CONFIG_READ_20261021`）：**
- GitHub `main@4d291fb31f7a5c429b20be14fb48df687c5a1dac`、`package.json` `start=node dist/manager/server.js`；`Dockerfile` 为 `CMD ["node","dist/manager/server.js"]`。完整 git tree **2359 路径 / not truncated**，无 `railway.json` / `railway.toml` / `.railway/config.json`。两条启动方式的差异必须留作真实部署查询。
- Ledger Configurator production `get_service_config` **`build.builder=RAILPACK`，`startCommand=npm start`，V2、SFO 1 replica、`staged=null`**，变量名未列 draining/overlap，config.deploy 未列有效秒数。EVO Runtime 独立 service 也显示 `RAILPACK + npm start`，但不能沿用 Host 的结论。**不能声称 PID1=Node 或 drain=0**；需要 Operator 查最终部署镜像/有效值及安全脱敏的真实 PID/PPID/信号链。
- 当前 main `manager/server.ts` 有 SIGTERM handler，但本次核的 main 中关闭超时 timer 仍在末端 cleanup 之后设置；单个无限 pending cleanup 可以使 timer 迟迟没有注册。独立 #1074 Draft 修复将 shutdown deadline 提前，精确 `c6d5fca9` 45/45 CI SUCCESS，**尚未合并生产**。
- Ledger Configurator Railway `main@4d291fb3` deployment `abe8f368-a45f-4a09-aa07-0f8201bf838e` SUCCESS/Online、1 running/0 crashed；对应 SHA GitHub commit checks **2/2**，和旧 40/40 不同范围。K0 真实 stop、全域 Worker/Caller、SQL session、IdP/DBA 仍没有签收。

**本轮新增决策不改变既有方案：** 将 R5 的“生效 draining 时间”和“实际 PID1/SIGTERM 转发”拆成两张必须由独立生产 Operator 签收的证据；缺任一或实际 draining=0 **仍 DENY K0**。只有在独立非生产隔离环境验证安全 supervisor 回收之后才能考虑实际信号/故障试验。不得自动修改 production draining（即使建议配置非零），不得执行父 Host SIGKILL、生产 Validator/SQL/Secrets/停机、合并 Draft 或清理异常锁。保留 [本轮 Operator 请求](PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md) 中的 owner、R5-01–R5-06、正反证据和阶段顺序。
